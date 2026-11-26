/* NestBudget calculations — pure functions, no DOM. Every figure the site
   shows comes from here, so the same math can be checked in Node. */
'use strict';

var NB = window.NB || {};
window.NB = NB;

NB.money0 = function (n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
};
NB.money2 = function (n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};
NB.pct1 = function (n) { return n.toFixed(1) + '%'; };
NB.num = function (n) { return new Intl.NumberFormat('en-US').format(n); };

/* Parse a money input; empty or invalid text counts as 0, never NaN. */
NB.toNumber = function (value) {
  var n = parseFloat(String(value).replace(/[$,\s]/g, ''));
  return isFinite(n) ? n : 0;
};

/* --- Monthly budget -------------------------------------------------- */
/* values: { income, housing, food, ... } in dollars per month. */
NB.summarizeBudget = function (values) {
  var total = 0, byBucket = { needs: 0, wants: 0, savings: 0 };
  var rows = NB.CATEGORIES.map(function (cat) {
    var amount = Math.max(0, NB.toNumber(values[cat.key]));
    total += amount;
    byBucket[cat.bucket] += amount;
    return { key: cat.key, label: cat.label, color: cat.color, bucket: cat.bucket, amount: amount };
  });
  var income = Math.max(0, NB.toNumber(values.income));
  var surplus = income - total;
  /* Savings rate: planned savings + whatever is left over, over take-home pay. */
  var plannedSavings = NB.toNumber(values.savings);
  var savingsRate = income > 0 ? ((plannedSavings + Math.max(0, surplus)) / income) * 100 : 0;
  var spentPct = income > 0 ? (total / income) * 100 : 0;
  rows.forEach(function (r) { r.share = total > 0 ? (r.amount / total) * 100 : 0; });
  return {
    income: income, total: total, surplus: surplus,
    savingsRate: savingsRate, spentPct: spentPct,
    rows: rows, byBucket: byBucket,
    buckets: [
      { key: 'needs', label: 'Needs', amount: byBucket.needs, target: 50, color: '#1e5c46' },
      { key: 'wants', label: 'Wants', amount: byBucket.wants, target: 30, color: '#e8a13a' },
      { key: 'savings', label: 'Savings & debt', amount: byBucket.savings + Math.max(0, surplus), target: 20, color: '#3a9e6d' }
    ]
  };
};

/* --- Savings goal ---------------------------------------------------- */
/* months = ceil((target - saved) / monthly); 0 monthly means never. */
NB.goalMonths = function (target, saved, monthly) {
  target = Math.max(0, NB.toNumber(target));
  saved = Math.max(0, NB.toNumber(saved));
  monthly = Math.max(0, NB.toNumber(monthly));
  var remaining = Math.max(0, target - saved);
  if (remaining === 0) return { months: 0, remaining: 0, done: true, progress: 100 };
  if (monthly <= 0) return { months: Infinity, remaining: remaining, done: false, progress: target > 0 ? (saved / target) * 100 : 0 };
  return { months: Math.ceil(remaining / monthly), remaining: remaining, done: false, progress: target > 0 ? (saved / target) * 100 : 0 };
};
/* Monthly amount needed to hit the target within a given number of months. */
NB.goalMonthlyFor = function (target, saved, months) {
  var remaining = Math.max(0, NB.toNumber(target) - NB.toNumber(saved));
  months = Math.max(1, Math.round(NB.toNumber(months)) || 1);
  return remaining / months;
};
/* Date N months from now, as "Jun 2027". */
NB.monthName = function (monthsAhead) {
  var d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/* --- Debt payoff ----------------------------------------------------- */
/* Simulate one strategy. debts: [{balance, apr, min}]. extra: dollars a
   month on top of minimums, aimed at the first debt in `order`.
   Returns months to debt-free, total interest paid, and the payoff order. */
NB.simulatePayoff = function (debts, extra, order) {
  var list = debts.map(function (d, i) {
    return {
      name: d.name, balance: Math.max(0, NB.toNumber(d.balance)),
      apr: Math.max(0, NB.toNumber(d.apr)), min: Math.max(0, NB.toNumber(d.min)), index: i
    };
  }).filter(function (d) { return d.balance > 0; });
  if (list.length === 0) return { months: 0, interest: 0, order: [], totalPaid: 0, payoffOrder: [] };
  var sorted = list.slice().sort(function (a, b) { return order(a, b); });
  var totalMin = list.reduce(function (s, d) { return s + d.min; }, 0);
  var budget = totalMin + Math.max(0, NB.toNumber(extra));
  var remaining = sorted.map(function (d) { return d.balance; });
  var interest = 0, months = 0, payoffOrder = [];
  var guard = 0;
  while (remaining.some(function (b) { return b > 0.005; }) && guard < 1200) {
    guard++;
    months++;
    /* 1. Interest accrues on every open balance. */
    for (var i = 0; i < sorted.length; i++) {
      if (remaining[i] > 0.005) {
        var due = remaining[i] * (sorted[i].apr / 100) / 12;
        interest += due;
        remaining[i] += due;
      }
    }
    /* 2. Minimums go to every open debt. */
    var pool = budget;
    for (var j = 0; j < sorted.length; j++) {
      if (remaining[j] > 0.005) {
        var pay = Math.min(sorted[j].min, remaining[j]);
        remaining[j] -= pay;
        pool -= pay;
      }
    }
    /* 3. Whatever is left attacks the first open debt in the order. */
    for (var k = 0; k < sorted.length && pool > 0.005; k++) {
      if (remaining[k] > 0.005) {
        var extraPay = Math.min(pool, remaining[k]);
        remaining[k] -= extraPay;
        pool -= extraPay;
      }
    }
    /* 4. A debt that just hit zero frees its minimum for next month. */
    for (var m = 0; m < sorted.length; m++) {
      if (remaining[m] <= 0.005 && payoffOrder.indexOf(sorted[m].name) === -1) payoffOrder.push(sorted[m].name);
    }
    if (pool > 0.005 && remaining.every(function (b) { return b <= 0.005; })) break;
  }
  var totalPaid = list.reduce(function (s, d) { return s + d.balance; }, 0) + interest;
  return { months: months, interest: interest, order: sorted.map(function (d) { return d.name; }), totalPaid: totalPaid, payoffOrder: payoffOrder };
};
NB.snowballOrder = function (a, b) { return a.balance - b.balance; };
NB.avalancheOrder = function (a, b) { return b.apr - a.apr; };
NB.comparePayoff = function (debts, extra) {
  var snow = NB.simulatePayoff(debts, extra, NB.snowballOrder);
  var aval = NB.simulatePayoff(debts, extra, NB.avalancheOrder);
  return { snowball: snow, avalanche: aval, interestSaved: snow.interest - aval.interest, monthsSaved: snow.months - aval.months };
};

/* --- Emergency fund -------------------------------------------------- */
NB.emergencyFund = function (essentials, months, saved, monthly) {
  essentials = Math.max(0, NB.toNumber(essentials));
  months = Math.max(0, NB.toNumber(months));
  saved = Math.max(0, NB.toNumber(saved));
  monthly = Math.max(0, NB.toNumber(monthly));
  var target = essentials * months;
  var gap = Math.max(0, target - saved);
  var monthsToFill = monthly > 0 ? Math.ceil(gap / monthly) : (gap > 0 ? Infinity : 0);
  var progress = target > 0 ? Math.min(100, (saved / target) * 100) : 100;
  return { target: target, gap: gap, monthsToFill: monthsToFill, progress: progress };
};

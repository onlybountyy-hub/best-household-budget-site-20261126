/* NestBudget views — one render function per page. Every page is reached
   by a hash route and every calculator recomputes live as you type. */
'use strict';

var NB = window.NB || {};
window.NB = NB;

NB.moneyField = function (id, label, hint, value) {
  return '<div class="field"><label for="' + id + '">' + label +
    (hint ? ' <span class="hint">' + hint + '</span>' : '') + '</label>' +
    '<div class="input-row"><span class="cur" aria-hidden="true">$</span>' +
    '<input type="number" id="' + id + '" inputmode="decimal" min="0" step="1" value="' + value + '"></div></div>';
};

NB.resultBox = function (id, label, value, sub, tone) {
  return '<div class="result-box' + (tone ? ' ' + tone : '') + '" id="' + id + '-box">' +
    '<div class="label">' + label + '</div>' +
    '<div class="value num" id="' + id + '">' + value + '</div>' +
    (sub ? '<div class="sub" id="' + id + '-sub">' + sub + '</div>' : '') + '</div>';
};

NB.legendList = function (rows) {
  var items = rows.map(function (r) {
    return '<li><span><span class="swatch" style="background:' + r.color + '"></span>' + r.label +
      '</span><span><b class="num">' + NB.money0(r.amount) + '</b> <span class="pct">' + NB.pct1(r.share) + '</span></span></li>';
  }).join('');
  return '<ul class="donut-legend">' + items + '</ul>';
};

/* --- Home ------------------------------------------------------------ */
NB.renderHome = function (view) {
  var d = NB.summarizeBudget(NB.DEFAULT_BUDGET);
  var tools = [
    ['calculator', 'Budget Calculator', 'Type in take-home pay and spending. Surplus, savings rate and a spending donut update as you type.'],
    ['503020', '50/30/20 Check', 'See your real needs, wants and savings next to the classic 50/30/20 targets — and what to move.'],
    ['goals', 'Savings Goals', 'Pick a target, see how many months it takes, and what monthly amount gets you there sooner.'],
    ['debt', 'Debt Payoff', 'Snowball vs. avalanche, side by side: months to debt-free and total interest for each.'],
    ['emergency', 'Emergency Fund', 'How big a cushion your household needs, how far along you are, and how fast you can finish it.'],
    ['examples', 'Example Budgets', 'Three realistic households — $38k, $45k and $90k a year — with full monthly breakdowns.']
  ];
  var cards = tools.map(function (t) {
    return '<article class="card tool-card"><h3><a href="#/' + t[0] + '">' + t[1] + '</a></h3><p>' + t[2] + '</p>' +
      '<a class="btn small" href="#/' + t[0] + '">Open tool →</a></article>';
  }).join('');
  view.innerHTML =
    '<section class="hero"><h1>Know where every dollar goes.</h1>' +
    '<p class="lede">NestBudget is a household budget planner that works the moment it opens. ' +
    'Enter your pay and your spending, and it shows your surplus, your savings rate, and a plan for what is left — ' +
    'no account, no tracking, nothing leaves your browser.</p>' +
    '<div class="hero-cta"><a class="btn" href="#/calculator">Start with the budget calculator →</a>' +
    '<a class="btn ghost" href="#/examples">See example budgets</a></div>' +
    '<div class="hero-stats">' +
    '<div class="stat"><b class="num">6</b><span>working tools</span></div>' +
    '<div class="stat"><b class="num">0</b><span>accounts or sign-ups</span></div>' +
    '<div class="stat"><b class="num">100%</b><span>private — runs offline</span></div>' +
    '</div></section>' +
    '<div class="section-head"><h2>Everything a household budget needs</h2>' +
    '<p>Each tool does one job, with real numbers in place before you type anything.</p></div>' +
    '<div class="grid cols-3">' + cards + '</div>' +
    '<div class="section-head"><h2>A realistic month, at a glance</h2>' +
    '<p>Our default household brings home $5,200 a month. Here is where it goes — open the calculator to change any number.</p></div>' +
    '<div class="card"><div class="chart-wrap"><div id="home-donut"></div>' + NB.legendList(d.rows) + '</div>' +
    '<p class="small" style="margin-top:14px">Surplus: <b class="num">' + NB.money0(d.surplus) + '/month</b> · ' +
    'Savings rate: <b>' + NB.pct1(d.savingsRate) + '</b> · ' +
    'Needs <b>' + NB.pct1(d.byBucket.needs / d.income * 100) + '</b> · ' +
    'Wants <b>' + NB.pct1(d.byBucket.wants / d.income * 100) + '</b> · ' +
    'Savings &amp; debt <b>' + NB.pct1((d.byBucket.savings + Math.max(0, d.surplus)) / d.income * 100) + '</b></p></div>' +
    '<div class="grid cols-2" style="margin-top:16px">' +
    '<div class="card"><h3>How it works</h3><ol class="steps">' +
    '<li><b>Enter your real numbers</b>Start with take-home pay, then what you actually spend in each category.</li>' +
    '<li><b>Read the verdict</b>Surplus or deficit, savings rate, and the 50/30/20 split tell you what is working.</li>' +
    '<li><b>Pick one move</b>A savings goal, a debt plan, or an emergency fund — one change at a time, tracked monthly.</li>' +
    '</ol></div>' +
    '<div class="card faq"><h3>Quick answers</h3>' +
    '<details open><summary>Is my data saved anywhere?</summary><p>No. NestBudget has no account, no local storage and no network calls. Close the tab and your numbers are gone — which is the point.</p></details>' +
    '<details><summary>What counts as take-home pay?</summary><p>What lands in your bank account after tax and payroll deductions. If your pay varies, use a cautious average month.</p></details>' +
    '<details><summary>Where do I start if money feels tight?</summary><p>Open the <a href="#/calculator">Budget Calculator</a>, enter what you spend now, and look for the one category where a small cut frees the most dollars.</p></details>' +
    '</div></div>';
  var holder = view.querySelector('#home-donut');
  if (holder) holder.appendChild(NB.donut(d.rows, 210, NB.money0(d.total), 'spent / month'));
};

/* --- Budget calculator (hero tool) ----------------------------------- */
NB.renderCalculator = function (view) {
  var fields = NB.moneyField('in-income', 'Monthly take-home pay', 'after tax', NB.DEFAULT_BUDGET.income);
  NB.CATEGORIES.forEach(function (c) {
    fields += NB.moneyField('in-' + c.key, c.label, c.hint, NB.DEFAULT_BUDGET[c.key]);
  });
  view.innerHTML =
    '<div class="section-head"><span class="kicker">Tool 1 · The heart of the site</span>' +
    '<h1>Budget calculator</h1>' +
    '<p class="lede">Enter what your household brings home and what it spends. Every figure below — surplus, savings rate, the donut — updates the moment you type.</p></div>' +
    '<div class="calc-layout">' +
    '<div class="card"><h2 style="margin-top:0">Your month</h2>' + fields +
    '<p class="small">Empty fields count as $0. All figures are monthly, in US dollars.</p></div>' +
    '<div>' +
    '<div class="result-band">' +
    NB.resultBox('res-income', 'Take-home pay', NB.money0(NB.DEFAULT_BUDGET.income), 'per month') +
    NB.resultBox('res-spent', 'Total spending', '', 'per month') +
    NB.resultBox('res-surplus', 'Surplus', '', 'left over each month') +
    '</div>' +
    '<div class="card"><h2 style="margin-top:0">Where it goes</h2>' +
    '<div class="chart-wrap"><div id="donut-wrap"></div><div id="legend-wrap" style="flex:1;min-width:220px"></div></div>' +
    '<div id="calc-note" style="margin-top:14px"></div></div>' +
    '<div class="card" style="margin-top:16px"><h2 style="margin-top:0">The 50/30/20 split, live</h2>' +
    '<div id="split-wrap"></div>' +
    '<p class="small">Needs are housing, food, transport, utilities and insurance. Wants are fun and everything else. ' +
    'Savings counts planned savings, debt payments and any surplus left over. ' +
    '<a href="#/503020">Open the full 50/30/20 check →</a></p></div>' +
    '</div></div>';

  var readValues = function () {
    var v = { income: NB.toNumber(document.getElementById('in-income').value) };
    NB.CATEGORIES.forEach(function (c) {
      v[c.key] = NB.toNumber(document.getElementById('in-' + c.key).value);
    });
    return v;
  };
  var recompute = function () {
    var d = NB.summarizeBudget(readValues());
    var spentEl = document.getElementById('res-spent');
    var surplusEl = document.getElementById('res-surplus');
    var surplusBox = document.getElementById('res-surplus-box');
    document.getElementById('res-income').textContent = NB.money0(d.income);
    if (spentEl) spentEl.textContent = NB.money0(d.total);
    if (surplusEl) surplusEl.textContent = (d.surplus < 0 ? '−' : '') + NB.money0(Math.abs(d.surplus));
    var surplusSub = document.getElementById('res-surplus-sub');
    if (surplusSub) surplusSub.textContent = d.surplus >= 0 ? 'left over each month · savings rate ' + NB.pct1(d.savingsRate) : 'shortfall each month · overspent by ' + NB.pct1(d.spentPct - 100);
    if (surplusBox) {
      surplusBox.classList.toggle('bad', d.surplus < 0);
      surplusBox.classList.toggle('good', d.surplus >= 0);
    }
    var donutWrap = document.getElementById('donut-wrap');
    if (donutWrap) {
      donutWrap.innerHTML = '';
      donutWrap.appendChild(NB.donut(d.rows, 210, NB.money0(d.total), 'spent / month'));
    }
    var legendWrap = document.getElementById('legend-wrap');
    if (legendWrap) legendWrap.innerHTML = NB.legendList(d.rows);
    var note = document.getElementById('calc-note');
    if (note) {
      if (d.income <= 0) {
        note.innerHTML = '<div class="callout amber"><p><strong>Enter your take-home pay</strong> to see a surplus and a savings rate. The spending breakdown above already works from the categories alone.</p></div>';
      } else if (d.surplus < 0) {
        note.innerHTML = '<div class="callout bad"><p><strong>Deficit of ' + NB.money0(-d.surplus) + ' a month.</strong> Spending is ' + NB.pct1(d.spentPct) + ' of take-home pay. Look for the biggest slice in the donut — housing and food are usually where the dollars are.</p></div>';
      } else if (d.savingsRate < 10) {
        note.innerHTML = '<div class="callout amber"><p><strong>Surplus ' + NB.money0(d.surplus) + ' a month, savings rate ' + NB.pct1(d.savingsRate) + '.</strong> A 10% savings rate is a solid start; 20% is strong. Try moving $100 from wants into savings and watch the rate move.</p></div>';
      } else {
        note.innerHTML = '<div class="callout"><p><strong>Surplus ' + NB.money0(d.surplus) + ' a month, savings rate ' + NB.pct1(d.savingsRate) + '.</strong> That surplus is doing work: send it to your emergency fund or a savings goal before it evaporates into miscellaneous spending.</p></div>';
      }
    }
    var split = document.getElementById('split-wrap');
    if (split) {
      split.innerHTML = d.buckets.map(function (b) {
        var actual = d.income > 0 ? (b.amount / d.income) * 100 : 0;
        var tone = actual <= b.target ? 'ok' : (b.key === 'savings' ? 'ok' : 'over');
        if (b.key === 'savings') tone = actual >= b.target ? 'ok' : 'under';
        var chip = b.key === 'savings'
          ? (actual >= b.target ? 'on target' : 'below target')
          : (actual <= b.target ? 'within target' : 'over target');
        return '<div class="compare-row"><span class="cname">' + b.label + '</span>' +
          '<div><div class="bar-track"><div class="bar-fill" style="width:' + Math.min(100, actual) + '%;background:' + b.color + '"></div></div>' +
          '<div class="small" style="margin-top:3px">Target ' + b.target + '% · you ' + NB.pct1(actual) + ' <span class="verdict ' + tone + '">' + chip + '</span></div></div>' +
          '<span class="cvals"><b class="num">' + NB.money0(b.amount) + '</b><span>per month</span></span></div>';
      }).join('');
    }
  };
  view.querySelectorAll('input[type="number"]').forEach(function (el) {
    el.addEventListener('input', recompute);
  });
  recompute();
};

/* --- 50/30/20 check --------------------------------------------------- */
NB.render503020 = function (view) {
  var d = NB.summarizeBudget(NB.DEFAULT_BUDGET);
  view.innerHTML =
    '<div class="section-head"><span class="kicker">Tool 2 · The classic rule</span>' +
    '<h1>The 50/30/20 check</h1>' +
    '<p class="lede">The rule says: 50% of take-home pay for needs, 30% for wants, 20% for savings and debt payoff. ' +
    'Here it is with your numbers, not a lecture — type your own totals and see where you stand.</p></div>' +
    '<div class="calc-layout">' +
    '<div class="card"><h2 style="margin-top:0">Your split</h2>' +
    NB.moneyField('f-income', 'Monthly take-home pay', '', NB.DEFAULT_BUDGET.income) +
    NB.moneyField('f-needs', 'Needs', 'housing, food, transport, utilities, insurance', d.byBucket.needs) +
    NB.moneyField('f-wants', 'Wants', 'fun, eating out, clothes, gifts', d.byBucket.wants) +
    NB.moneyField('f-savings', 'Savings & debt', 'savings + debt payments', d.byBucket.savings) +
    '<p class="small">Unspent surplus counts toward savings — money you did not spend is money saved.</p></div>' +
    '<div><div class="card"><h2 style="margin-top:0">You vs. the rule</h2><div id="rule-rows"></div>' +
    '<div id="rule-note" style="margin-top:14px"></div></div>' +
    '<div class="card" style="margin-top:16px"><h2 style="margin-top:0">How to read your result</h2>' +
    '<ul class="checklist">' +
    '<li><b>Needs over 50% is normal</b> in expensive cities and on modest pay — rent alone can eat 35%. The fix is usually housing or transport, not coffee.</li>' +
    '<li><b>Wants under 30% is fine.</b> The rule is a ceiling for wants, not a quota to fill.</li>' +
    '<li><b>Savings under 20% is the one to chase.</b> Even 5% beats 0% — and a surplus you move on payday counts.</li>' +
    '<li><b>One change at a time.</b> Pick the bucket furthest from target and move it by 5 points this month.</li>' +
    '</ul></div></div></div>';

  var recompute = function () {
    var income = Math.max(0, NB.toNumber(document.getElementById('f-income').value));
    var vals = {
      needs: Math.max(0, NB.toNumber(document.getElementById('f-needs').value)),
      wants: Math.max(0, NB.toNumber(document.getElementById('f-wants').value)),
      savings: Math.max(0, NB.toNumber(document.getElementById('f-savings').value))
    };
    var total = vals.needs + vals.wants + vals.savings;
    var surplus = income - total;
    var effSavings = vals.savings + Math.max(0, surplus);
    var rows = [
      { key: 'needs', label: 'Needs', amount: vals.needs, target: 50, color: '#1e5c46', goodWhen: 'under' },
      { key: 'wants', label: 'Wants', amount: vals.wants, target: 30, color: '#e8a13a', goodWhen: 'under' },
      { key: 'savings', label: 'Savings & debt', amount: effSavings, target: 20, color: '#3a9e6d', goodWhen: 'over' }
    ];
    var holder = document.getElementById('rule-rows');
    if (holder) {
      holder.innerHTML = rows.map(function (r) {
        var actual = income > 0 ? (r.amount / income) * 100 : 0;
        var ok = r.goodWhen === 'under' ? actual <= r.target : actual >= r.target;
        var chip = r.goodWhen === 'under'
          ? (ok ? 'within target' : 'over by ' + NB.pct1(actual - r.target))
          : (ok ? 'on target' : 'short by ' + NB.pct1(r.target - actual));
        return '<div class="compare-row"><span class="cname">' + r.label + '</span>' +
          '<div><div class="bar-track"><div class="bar-fill" style="width:' + Math.min(100, actual) + '%;background:' + r.color + '"></div></div>' +
          '<div class="small" style="margin-top:3px">Target ' + r.target + '% · you ' + NB.pct1(actual) + ' <span class="verdict ' + (ok ? 'ok' : (r.key === 'savings' ? 'under' : 'over')) + '">' + chip + '</span></div></div>' +
          '<span class="cvals"><b class="num">' + NB.money0(r.amount) + '</b><span>per month</span></span></div>';
      }).join('') +
      '<p class="small" style="margin-top:10px">Total assigned: <b class="num">' + NB.money0(total) + '</b> of <b class="num">' + NB.money0(income) + '</b>' +
      (surplus >= 0 ? ' · <b class="num">' + NB.money0(surplus) + '</b> unassigned, counted as savings.' : ' · <b style="color:var(--red)">over by ' + NB.money0(-surplus) + '</b> — spending beats pay.') + '</p>';
    }
    var note = document.getElementById('rule-note');
    if (note) {
      if (income <= 0) {
        note.innerHTML = '<div class="callout amber"><p><strong>Enter your take-home pay</strong> and the comparison will fill in.</p></div>';
      } else if (surplus < 0) {
        note.innerHTML = '<div class="callout bad"><p><strong>First fix the deficit:</strong> your three buckets add up to ' + NB.money0(-surplus) + ' more than your pay. The 50/30/20 split only makes sense once spending fits inside income.</p></div>';
      } else {
        var needsPct = vals.needs / income * 100;
        note.innerHTML = '<div class="callout"><p><strong>Your headline number:</strong> needs take ' + NB.pct1(needsPct) + ' of your pay. ' +
          (needsPct > 60 ? 'Above 60%, the realistic move is usually a housing or transport change — or accepting a lower savings target for now and protecting the habit.' : 'Under 60% leaves room to push savings toward 20% without feeling squeezed.') + '</p></div>';
      }
    }
  };
  view.querySelectorAll('input[type="number"]').forEach(function (el) {
    el.addEventListener('input', recompute);
  });
  recompute();
};

/* --- Savings goals ----------------------------------------------------- */
NB.renderGoals = function (view) {
  view.innerHTML =
    '<div class="section-head"><span class="kicker">Tool 3 · Save with a date</span>' +
    '<h1>Savings goals</h1>' +
    '<p class="lede">A goal with a date is a plan. Enter a target and what you can set aside each month — NestBudget tells you when you get there, and what it takes to get there sooner.</p></div>' +
    '<div class="calc-layout">' +
    '<div class="card"><h2 style="margin-top:0">Your goal</h2>' +
    '<div class="field"><label for="g-name">What are you saving for?</label>' +
    '<input type="text" id="g-name" value="' + NB.DEFAULT_GOAL.name + '" maxlength="60" style="width:100%;padding:9px 12px;font-size:1rem;border:1px solid var(--line);border-radius:8px"></div>' +
    NB.moneyField('g-target', 'Target amount', 'the full price', NB.DEFAULT_GOAL.target) +
    NB.moneyField('g-saved', 'Already saved', '', NB.DEFAULT_GOAL.saved) +
    NB.moneyField('g-monthly', 'Saving per month', '', NB.DEFAULT_GOAL.monthly) +
    '<p class="small">Try a preset:</p>' +
    '<div class="radio-row">' +
    '<button class="btn small ghost" style="color:var(--green-deep);box-shadow:inset 0 0 0 2px var(--green)" data-preset="3000|650|250">Vacation · $3,000</button>' +
    '<button class="btn small ghost" style="color:var(--green-deep);box-shadow:inset 0 0 0 2px var(--green)" data-preset="8000|1200|300">Car down payment · $8,000</button>' +
    '<button class="btn small ghost" style="color:var(--green-deep);box-shadow:inset 0 0 0 2px var(--green)" data-preset="25000|4000|500">House deposit · $25,000</button>' +
    '</div></div>' +
    '<div>' +
    '<div class="result-band">' +
    NB.resultBox('res-months', 'Months to go', '', 'at this pace') +
    NB.resultBox('res-finish', 'Finish date', '', 'if you start now') +
    NB.resultBox('res-left', 'Still to save', '', 'after what you have') +
    '</div>' +
    '<div class="card"><h2 style="margin-top:0">Progress</h2>' +
    '<div class="progress-wrap"><div class="progress-label"><span id="prog-label">Saved so far</span><span id="prog-pct" class="num"></span></div>' +
    '<div class="bar-track" style="height:18px"><div class="bar-fill" id="prog-bar" style="width:0%"></div></div></div>' +
    '<div class="timeline" id="goal-timeline"></div>' +
    '<p class="small" id="goal-timeline-note"></p>' +
    '<div id="goal-note" style="margin-top:12px"></div></div>' +
    '<div class="card" style="margin-top:16px"><h2 style="margin-top:0">Want it sooner?</h2>' +
    '<div class="table-wrap"><table><thead><tr><th>Finish in</th><th class="num">Save per month</th></tr></thead>' +
    '<tbody id="goal-sooner"></tbody></table></div>' +
    '<p class="small">Same target, faster pace. Pick a row that fits your budget and set your monthly amount to match.</p></div>' +
    '</div></div>';

  var recompute = function () {
    var target = NB.toNumber(document.getElementById('g-target').value);
    var saved = NB.toNumber(document.getElementById('g-saved').value);
    var monthly = NB.toNumber(document.getElementById('g-monthly').value);
    var name = (document.getElementById('g-name').value || 'Your goal').trim();
    var g = NB.goalMonths(target, saved, monthly);
    var monthsEl = document.getElementById('res-months');
    var finishEl = document.getElementById('res-finish');
    var leftEl = document.getElementById('res-left');
    if (monthsEl) monthsEl.textContent = g.done ? 'Done!' : (g.months === Infinity ? '—' : NB.num(g.months));
    var monthsSub = document.getElementById('res-months-sub');
    if (monthsSub) monthsSub.textContent = g.done ? 'target reached' : (g.months === Infinity ? 'set a monthly amount' : 'at this pace');
    if (finishEl) finishEl.textContent = g.done ? 'Today' : (g.months === Infinity ? '—' : NB.monthName(g.months));
    var finishSub = document.getElementById('res-finish-sub');
    if (finishSub) finishSub.textContent = g.done ? 'already there' : (g.months === Infinity ? 'no monthly amount set' : 'if you start now');
    if (leftEl) leftEl.textContent = NB.money0(g.remaining);
    var leftSub = document.getElementById('res-left-sub');
    if (leftSub) leftSub.textContent = 'after what you have';
    var pct = Math.min(100, Math.max(0, g.progress));
    var bar = document.getElementById('prog-bar');
    if (bar) bar.style.width = pct + '%';
    var pctEl = document.getElementById('prog-pct');
    if (pctEl) pctEl.textContent = NB.pct1(pct);
    var labelEl = document.getElementById('prog-label');
    if (labelEl) labelEl.textContent = NB.money0(Math.min(saved, target)) + ' of ' + NB.money0(target) + ' saved';
    var tl = document.getElementById('goal-timeline');
    var tlNote = document.getElementById('goal-timeline-note');
    if (tl) {
      var segs = '';
      var totalSegs = 12;
      var filled = g.done ? totalSegs : (isFinite(g.months) ? Math.min(totalSegs, Math.round(g.months / Math.max(1, Math.ceil(g.months / totalSegs)))) : 0);
      for (var i = 0; i < totalSegs; i++) {
        segs += '<span class="seg' + (i < filled ? ' on' : '') + '"></span>';
      }
      tl.innerHTML = segs;
      if (tlNote) tlNote.textContent = g.done ? 'Fully funded — pick a new goal, or raise the target.' : (isFinite(g.months) ? 'Each block is roughly ' + Math.max(1, Math.ceil(g.months / 12)) + ' month' + (Math.ceil(g.months / 12) > 1 ? 's' : '') + ' of the journey.' : 'Enter a monthly amount to see the timeline.');
    }
    var note = document.getElementById('goal-note');
    if (note) {
      if (g.done) {
        note.innerHTML = '<div class="callout"><p><strong>' + name + ' is funded.</strong> Move the surplus to your next goal — momentum beats perfection.</p></div>';
      } else if (g.months === Infinity) {
        note.innerHTML = '<div class="callout amber"><p><strong>Set a monthly amount</strong> — even $25 a month turns this from a wish into a date.</p></div>';
      } else if (g.months <= 6) {
        note.innerHTML = '<div class="callout"><p><strong>Within reach:</strong> ' + NB.num(g.months) + ' months at ' + NB.money0(monthly) + ' a month. Automate the transfer on payday so willpower never gets a vote.</p></div>';
      } else {
        note.innerHTML = '<div class="callout"><p><strong>' + NB.num(g.months) + ' months to go.</strong> Long goals survive on a monthly transfer, not on motivation. Check the table below for what a faster pace would do.</p></div>';
      }
    }
    var sooner = document.getElementById('goal-sooner');
    if (sooner) {
      sooner.innerHTML = [6, 12, 18, 24].map(function (m) {
        return '<tr><td>' + m + ' months <span class="small">(' + NB.monthName(m) + ')</span></td><td class="num"><b>' + NB.money0(Math.ceil(NB.goalMonthlyFor(target, saved, m))) + '</b></td></tr>';
      }).join('');
    }
  };
  view.querySelectorAll('input').forEach(function (el) {
    el.addEventListener('input', recompute);
  });
  view.querySelectorAll('[data-preset]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var parts = btn.getAttribute('data-preset').split('|');
      document.getElementById('g-target').value = parts[0];
      document.getElementById('g-saved').value = parts[1];
      document.getElementById('g-monthly').value = parts[2];
      recompute();
    });
  });
  recompute();
};

/* --- Debt payoff ------------------------------------------------------- */
NB.renderDebt = function (view) {
  var debtInputs = NB.DEFAULT_DEBTS.map(function (d, i) {
    return '<div class="card" style="margin-bottom:12px"><h3 style="margin-top:0">' + d.name + '</h3>' +
      NB.moneyField('d-bal-' + i, 'Balance owed', '', d.balance) +
      '<div class="field"><label for="d-apr-' + i + '">Interest rate (APR) <span class="hint">percent per year</span></label>' +
      '<div class="input-row"><input type="number" id="d-apr-' + i + '" inputmode="decimal" min="0" step="0.01" value="' + d.apr + '"><span class="cur" style="border-radius:0 8px 8px 0;border:1px solid var(--line);border-left:none" aria-hidden="true">%</span></div></div>' +
      NB.moneyField('d-min-' + i, 'Minimum payment', 'per month', d.min) + '</div>';
  }).join('');
  view.innerHTML =
    '<div class="section-head"><span class="kicker">Tool 4 · Get debt-free, on purpose</span>' +
    '<h1>Debt payoff planner</h1>' +
    '<p class="lede">List your debts, add whatever extra you can pay each month, and compare the two classic strategies: ' +
    '<b>snowball</b> (smallest balance first, for quick wins) vs. <b>avalanche</b> (highest rate first, for the least interest).</p></div>' +
    '<div class="calc-layout">' +
    '<div><div class="card"><h2 style="margin-top:0">Your debts</h2>' + debtInputs + '</div>' +
    '<div class="card" style="margin-top:16px"><h2 style="margin-top:0">Extra payment</h2>' +
    NB.moneyField('d-extra', 'Extra per month', 'on top of all minimums', NB.DEFAULT_EXTRA) +
    '<div class="field"><label>Strategy to compare</label><div class="radio-row">' +
    '<label class="radio-pill"><input type="radio" name="d-strategy" value="snowball" checked> Snowball</label>' +
    '<label class="radio-pill"><input type="radio" name="d-strategy" value="avalanche"> Avalanche</label>' +
    '</div></div>' +
    '<p class="small">Both strategies pay every minimum every month. The extra — and each freed-up minimum — attacks one debt at a time.</p></div></div>' +
    '<div>' +
    '<div class="result-band">' +
    NB.resultBox('res-debtfree', 'Debt-free in', '', 'months') +
    NB.resultBox('res-interest', 'Total interest', '', 'over the payoff') +
    NB.resultBox('res-total', 'Total paid', '', 'balances + interest') +
    '</div>' +
    '<div class="card"><h2 style="margin-top:0">Payoff order</h2><ol class="steps" id="debt-order"></ol>' +
    '<div id="debt-note" style="margin-top:12px"></div></div>' +
    '<div class="card" style="margin-top:16px"><h2 style="margin-top:0">Snowball vs. avalanche</h2>' +
    '<div class="table-wrap"><table><thead><tr><th>Strategy</th><th class="num">Debt-free in</th><th class="num">Total interest</th></tr></thead>' +
    '<tbody id="debt-compare"></tbody></table></div>' +
    '<p class="small" id="debt-verdict"></p></div>' +
    '</div></div>';

  var readDebts = function () {
    return NB.DEFAULT_DEBTS.map(function (d, i) {
      return { name: d.name, balance: NB.toNumber(document.getElementById('d-bal-' + i).value), apr: NB.toNumber(document.getElementById('d-apr-' + i).value), min: NB.toNumber(document.getElementById('d-min-' + i).value) };
    });
  };
  var recompute = function () {
    var debts = readDebts();
    var extra = NB.toNumber(document.getElementById('d-extra').value);
    var strategy = (view.querySelector('input[name="d-strategy"]:checked') || {}).value || 'snowball';
    var cmp = NB.comparePayoff(debts, extra);
    var chosen = strategy === 'snowball' ? cmp.snowball : cmp.avalanche;
    var totalBalance = debts.reduce(function (s, d) { return s + Math.max(0, d.balance); }, 0);
    var freeEl = document.getElementById('res-debtfree');
    if (freeEl) freeEl.textContent = totalBalance <= 0 ? 'Done!' : (chosen.months >= 1200 ? '50+ yrs' : NB.num(chosen.months) + ' mo');
    var intEl = document.getElementById('res-interest');
    if (intEl) intEl.textContent = NB.money0(chosen.interest);
    var totEl = document.getElementById('res-total');
    if (totEl) totEl.textContent = NB.money0(chosen.totalPaid);
    var orderEl = document.getElementById('debt-order');
    if (orderEl) {
      orderEl.innerHTML = chosen.payoffOrder.length === 0
        ? '<li><b>No debts entered</b>Add a balance above to see the payoff order.</li>'
        : chosen.payoffOrder.map(function (name, i) {
            return '<li><b>' + name + '</b>' + (i === 0 ? 'Attack this one first — every extra dollar goes here.' : 'Then roll its payment into the next debt.') + '</li>';
          }).join('');
    }
    var note = document.getElementById('debt-note');
    if (note) {
      if (totalBalance <= 0) {
        note.innerHTML = '<div class="callout"><p><strong>Debt-free.</strong> Enter a balance to plan a payoff.</p></div>';
      } else if (chosen.months >= 1200) {
        note.innerHTML = '<div class="callout bad"><p><strong>Minimums do not cover the interest.</strong> At these rates the balances grow faster than the payments shrink them. Raise the extra payment or the minimums — even $25 more a month changes the math.</p></div>';
      } else {
        note.innerHTML = '<div class="callout"><p><strong>' + (strategy === 'snowball' ? 'Snowball' : 'Avalanche') + ':</strong> debt-free by ' + NB.monthName(chosen.months) + ' — ' + NB.num(chosen.months) + ' months, ' + NB.money0(chosen.interest) + ' of interest on ' + NB.money0(totalBalance) + ' of balances.</p></div>';
      }
    }
    var cmpEl = document.getElementById('debt-compare');
    if (cmpEl) {
      cmpEl.innerHTML =
        '<tr><td>Snowball <span class="small">(smallest first)</span></td><td class="num"><b>' + (cmp.snowball.months >= 1200 ? '50+ yrs' : NB.num(cmp.snowball.months) + ' mo') + '</b></td><td class="num">' + NB.money0(cmp.snowball.interest) + '</td></tr>' +
        '<tr><td>Avalanche <span class="small">(highest rate first)</span></td><td class="num"><b>' + (cmp.avalanche.months >= 1200 ? '50+ yrs' : NB.num(cmp.avalanche.months) + ' mo') + '</b></td><td class="num">' + NB.money0(cmp.avalanche.interest) + '</td></tr>';
    }
    var verdict = document.getElementById('debt-verdict');
    if (verdict) {
      if (totalBalance <= 0) verdict.textContent = '';
      else if (cmp.interestSaved > 1) verdict.innerHTML = 'Avalanche saves <b>' + NB.money0(cmp.interestSaved) + '</b> of interest' + (cmp.monthsSaved > 0 ? ' and finishes <b>' + NB.num(cmp.monthsSaved) + ' month' + (cmp.monthsSaved > 1 ? 's' : '') + ' sooner</b>' : '') + ' than snowball here. But the best strategy is the one you will stick to — snowball\'s early wins keep many households going.';
      else verdict.innerHTML = 'Both strategies cost about the same here — pick the one whose payoff order feels more motivating.';
    }
  };
  view.querySelectorAll('input').forEach(function (el) {
    el.addEventListener('input', recompute);
    el.addEventListener('change', recompute);
  });
  recompute();
};

/* --- Emergency fund ---------------------------------------------------- */
NB.renderEmergency = function (view) {
  view.innerHTML =
    '<div class="section-head"><span class="kicker">Tool 5 · The cushion first</span>' +
    '<h1>Emergency fund</h1>' +
    '<p class="lede">Before investing, before extra debt payments: a cushion that covers months of essential spending. ' +
    'Enter what your household must spend each month, and see the target, the gap, and how fast you can close it.</p></div>' +
    '<div class="calc-layout">' +
    '<div class="card"><h2 style="margin-top:0">Your essentials</h2>' +
    NB.moneyField('e-essentials', 'Essential spending per month', 'housing, food, transport, utilities, insurance', NB.DEFAULT_EMERGENCY.essentials) +
    '<div class="field"><label for="e-months">Months of cover</label>' +
    '<select id="e-months"><option value="3">3 months — the minimum</option><option value="6" selected>6 months — the standard</option><option value="9">9 months — one earner / variable pay</option></select></div>' +
    NB.moneyField('e-saved', 'Already saved', 'in your emergency pot', NB.DEFAULT_EMERGENCY.saved) +
    NB.moneyField('e-monthly', 'Adding per month', '', NB.DEFAULT_EMERGENCY.monthly) +
    '<p class="small">Essentials only — not wants. If you are unsure, take your needs total from the <a href="#/calculator">Budget Calculator</a>.</p></div>' +
    '<div>' +
    '<div class="result-band">' +
    NB.resultBox('res-target', 'Fund target', '', 'months of essentials') +
    NB.resultBox('res-gap', 'Still to save', '', 'to reach the target') +
    NB.resultBox('res-eta', 'Fully funded in', '', 'at this pace') +
    '</div>' +
    '<div class="card"><h2 style="margin-top:0">Progress</h2>' +
    '<div class="progress-wrap"><div class="progress-label"><span id="em-label">Saved so far</span><span id="em-pct" class="num"></span></div>' +
    '<div class="bar-track" style="height:18px"><div class="bar-fill" id="em-bar" style="width:0%"></div></div></div>' +
    '<div class="timeline" id="em-timeline"></div>' +
    '<div id="em-note" style="margin-top:12px"></div></div>' +
    '<div class="card" style="margin-top:16px"><h2 style="margin-top:0">What counts as an emergency?</h2>' +
    '<ul class="checklist">' +
    '<li>Job loss, a pay cut, or a gap between jobs.</li>' +
    '<li>A car repair you cannot drive without, or a home repair you cannot live without.</li>' +
    '<li>A medical bill your insurance does not cover.</li>' +
    '</ul><p class="small">Not an emergency: a sale, a holiday, a new phone. Keep this pot boring — a savings account you can reach in a day, not an investment.</p></div>' +
    '</div></div>';

  var recompute = function () {
    var f = NB.emergencyFund(
      NB.toNumber(document.getElementById('e-essentials').value),
      NB.toNumber(document.getElementById('e-months').value),
      NB.toNumber(document.getElementById('e-saved').value),
      NB.toNumber(document.getElementById('e-monthly').value)
    );
    var months = NB.toNumber(document.getElementById('e-months').value);
    var saved = NB.toNumber(document.getElementById('e-saved').value);
    document.getElementById('res-target').textContent = NB.money0(f.target);
    var targetSub = document.getElementById('res-target-sub');
    if (targetSub) targetSub.textContent = months + ' months of essentials';
    document.getElementById('res-gap').textContent = NB.money0(f.gap);
    document.getElementById('res-eta').textContent = f.gap <= 0 ? 'Funded!' : (f.monthsToFill === Infinity ? '—' : NB.num(f.monthsToFill) + ' mo');
    var etaSub = document.getElementById('res-eta-sub');
    if (etaSub) etaSub.textContent = f.gap <= 0 ? 'target reached' : (f.monthsToFill === Infinity ? 'set a monthly amount' : 'at this pace · ' + NB.monthName(f.monthsToFill));
    var bar = document.getElementById('em-bar');
    if (bar) bar.style.width = Math.min(100, f.progress) + '%';
    var pctEl = document.getElementById('em-pct');
    if (pctEl) pctEl.textContent = NB.pct1(f.progress);
    var labelEl = document.getElementById('em-label');
    if (labelEl) labelEl.textContent = NB.money0(Math.min(saved, f.target)) + ' of ' + NB.money0(f.target) + ' saved';
    var tl = document.getElementById('em-timeline');
    if (tl) {
      var segs = '';
      for (var i = 0; i < 12; i++) segs += '<span class="seg' + (i < Math.round(f.progress / 100 * 12) ? ' on' : '') + '"></span>';
      tl.innerHTML = segs;
    }
    var note = document.getElementById('em-note');
    if (note) {
      if (f.gap <= 0) note.innerHTML = '<div class="callout"><p><strong>Fully funded.</strong> Keep it topped up after any withdrawal, and point new savings at a goal or extra debt payments.</p></div>';
      else if (f.monthsToFill === Infinity) note.innerHTML = '<div class="callout amber"><p><strong>Set a monthly amount</strong> — even $50 a month starts the cushion. Pay yourself first, on payday.</p></div>';
      else if (f.progress < 25) note.innerHTML = '<div class="callout amber"><p><strong>Start small, start now:</strong> your first milestone is one month of essentials — ' + NB.money0(NB.toNumber(document.getElementById('e-essentials').value)) + '. That alone covers most real emergencies.</p></div>';
      else note.innerHTML = '<div class="callout"><p><strong>' + NB.num(f.monthsToFill) + ' months to a full cushion.</strong> You are ' + NB.pct1(f.progress) + ' there. Keep the transfer automatic and the pot separate from everyday spending.</p></div>';
    }
  };
  view.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', recompute);
    el.addEventListener('change', recompute);
  });
  recompute();
};

/* --- Example budgets --------------------------------------------------- */
NB.renderExamples = function (view) {
  var cards = NB.EXAMPLES.map(function (ex) {
    var d = NB.summarizeBudget(Object.assign({ income: ex.income }, ex.items));
    var rows = d.rows.map(function (r) {
      return '<tr><td>' + r.label + '</td><td class="num">' + NB.money0(r.amount) + '</td><td class="num">' + NB.pct1(r.amount / ex.income * 100) + '</td></tr>';
    }).join('');
    return '<article class="card"><span class="tag">Take-home ' + NB.money0(ex.income) + '/mo</span>' +
      '<h2 style="margin-top:8px">' + ex.title + '</h2><p>' + ex.note + '</p>' +
      '<div class="chart-wrap"><div class="ex-donut" data-ex="' + ex.id + '"></div>' +
      '<div style="flex:1;min-width:200px"><div class="table-wrap"><table><thead><tr><th>Category</th><th class="num">Per month</th><th class="num">Share</th></tr></thead>' +
      '<tbody>' + rows + '</tbody><tfoot><tr class="total"><td>Total spent</td><td class="num">' + NB.money0(d.total) + '</td><td class="num">' + NB.pct1(d.spentPct) + '</td></tr>' +
      '<tr class="total"><td>Surplus</td><td class="num">' + NB.money0(d.surplus) + '</td><td class="num">' + NB.pct1(100 - d.spentPct) + '</td></tr></tfoot></table></div></div></div>' +
      '<div class="callout" style="margin-top:12px"><p>' + ex.verdict + '</p></div></article>';
  }).join('');
  view.innerHTML =
    '<div class="section-head"><span class="kicker">Reference · Realistic months</span>' +
    '<h1>Example household budgets</h1>' +
    '<p class="lede">Three households, three pay bands, every dollar assigned. Steal the structure, replace the numbers with your own — ' +
    'or open any of them in the <a href="#/calculator">Budget Calculator</a> and edit from there.</p></div>' +
    '<div class="grid" style="gap:18px">' + cards + '</div>' +
    '<div class="card" style="margin-top:18px"><h2 style="margin-top:0">What the three have in common</h2>' +
    '<ul class="checklist">' +
    '<li>Every dollar has a job before the month starts — including the surplus, which is assigned to savings.</li>' +
    '<li>Housing is the biggest lever in all three. A $200 cheaper home beats a hundred small cuts.</li>' +
    '<li>None of them is at 50/30/20 exactly. The rule is a compass, not a pass mark — see the <a href="#/method">Method</a> page for why.</li>' +
    '</ul></div>';
  view.querySelectorAll('.ex-donut').forEach(function (holder) {
    var ex = NB.EXAMPLES.find(function (e) { return e.id === holder.getAttribute('data-ex'); });
    var d = NB.summarizeBudget(Object.assign({ income: ex.income }, ex.items));
    holder.appendChild(NB.donut(d.rows, 170, NB.money0(d.total), 'spent / month'));
  });
};

/* --- Method ------------------------------------------------------------ */
NB.renderMethod = function (view) {
  view.innerHTML =
    '<div class="section-head"><span class="kicker">Transparency</span>' +
    '<h1>How every number is computed</h1>' +
    '<p class="lede">No black boxes. Every figure on this site comes from the formulas below, applied to numbers you type — or to the defaults shown on each tool.</p></div>' +
    '<div class="card"><h2 style="margin-top:0">The formulas</h2>' +
    '<div class="table-wrap"><table><thead><tr><th>Figure</th><th>Formula</th><th>Where</th></tr></thead><tbody>' +
    '<tr><td>Surplus / deficit</td><td>Take-home pay − total spending</td><td>Budget calculator</td></tr>' +
    '<tr><td>Savings rate</td><td>(Planned savings + surplus) ÷ take-home pay</td><td>Budget calculator</td></tr>' +
    '<tr><td>Category share</td><td>Category spending ÷ total spending</td><td>Budget calculator, examples</td></tr>' +
    '<tr><td>50/30/20 split</td><td>Needs ÷ pay · Wants ÷ pay · (Savings + debt + surplus) ÷ pay</td><td>50/30/20 check</td></tr>' +
    '<tr><td>Months to a goal</td><td>(Target − saved) ÷ monthly saving, rounded up</td><td>Savings goals</td></tr>' +
    '<tr><td>Monthly interest</td><td>Balance × APR ÷ 12, charged before each payment</td><td>Debt payoff</td></tr>' +
    '<tr><td>Debt payoff</td><td>Minimums on every debt, then all extra cash at one debt until it is gone; its payment rolls to the next</td><td>Debt payoff</td></tr>' +
    '<tr><td>Emergency target</td><td>Essential monthly spending × months of cover</td><td>Emergency fund</td></tr>' +
    '</tbody></table></div></div>' +
    '<div class="grid cols-2" style="margin-top:16px">' +
    '<div class="card"><h2 style="margin-top:0">What counts where</h2>' +
    '<p><b>Needs</b> — housing, food, transport, utilities, insurance. The bills you must pay to live and work.</p>' +
    '<p><b>Wants</b> — fun &amp; leisure, and everything else: streaming, eating out, clothes, gifts.</p>' +
    '<p><b>Savings &amp; debt</b> — planned savings, debt payments, and any unspent surplus. Debt minimums sit here because paying debt down is saving in reverse.</p>' +
    '<p>Take-home pay means pay after tax and payroll deductions — what actually lands in the account.</p></div>' +
    '<div class="card"><h2 style="margin-top:0">Assumptions &amp; limits</h2>' +
    '<ul class="checklist">' +
    '<li>All figures are monthly and in US dollars.</li>' +
    '<li>Debt interest compounds monthly at APR ÷ 12; no fees, no rate changes, no new charges.</li>' +
    '<li>Savings goals earn no interest in the projection — a cautious estimate.</li>' +
    '<li>50/30/20 is a guideline from personal-finance writing, not a law: high-rent cities and modest pay push needs above 50% for most households.</li>' +
    '<li>Example budgets are original illustrations, not survey data.</li>' +
    '</ul></div></div>' +
    '<div class="card" style="margin-top:16px"><h2 style="margin-top:0">Benchmarks behind the defaults</h2>' +
    '<p>The 50/30/20 rule comes from the personal-finance literature (popularized by Elizabeth Warren and Amelia Warren Tyagi\'s <i>All Your Worth</i>). ' +
    'The emergency-fund guidance — 3–6 months of essentials, 6–9 with variable pay — is the standard recommendation of consumer-finance advisers. ' +
    'Category patterns in the example budgets are informed by the shape of public U.S. household spending data, such as the Bureau of Labor Statistics Consumer Expenditure Survey; the example figures themselves are our own illustrations, not survey reproductions.</p>' +
    '<p class="small">NestBudget is an educational planner, not financial advice. For debt you cannot manage or a tax question, talk to a qualified adviser.</p></div>';
};

/* --- About ------------------------------------------------------------- */
NB.renderAbout = function (view) {
  view.innerHTML =
    '<div class="section-head"><span class="kicker">About NestBudget</span>' +
    '<h1>A budget planner that minds its own business</h1>' +
    '<p class="lede">NestBudget was built to do one thing well: show a household where its money goes, and what to do next — without asking for an email, a bank login, or a single byte of your data.</p></div>' +
    '<div class="grid cols-2">' +
    '<div class="card"><h2 style="margin-top:0">What it is</h2>' +
    '<p>A set of six working tools: a budget calculator, a 50/30/20 check, a savings-goal planner, a debt-payoff planner, an emergency-fund planner, and three realistic example budgets — plus this method page, so you can check every number.</p>' +
    '<p>It runs entirely in your browser from its own files. There is no server, no account, and no tracking: close the tab and your numbers disappear with it.</p></div>' +
    '<div class="card"><h2 style="margin-top:0">What it is not</h2>' +
    '<ul class="checklist">' +
    '<li>Not a bank app — it never sees your accounts.</li>' +
    '<li>Not an investment adviser — it plans cash flow, not portfolios.</li>' +
    '<li>Not a spreadsheet you have to build — the structure is here, you bring the numbers.</li>' +
    '</ul></div></div>' +
    '<div class="card" style="margin-top:16px"><h2 style="margin-top:0">A month with NestBudget</h2>' +
    '<ol class="steps">' +
    '<li><b>Payday:</b> open the <a href="#/calculator">Budget Calculator</a> and update last month\'s real spending.</li>' +
    '<li><b>First of the month:</b> check the <a href="#/503020">50/30/20 split</a> — one bucket to improve, not five.</li>' +
    '<li><b>When a goal matters:</b> set it in <a href="#/goals">Savings Goals</a> and automate the transfer.</li>' +
    '<li><b>When debt is the priority:</b> run <a href="#/debt">Debt Payoff</a>, pick snowball or avalanche, and stick to it.</li>' +
    '</ol></div>' +
    '<p class="small" style="margin-top:16px">Built as an entry for make.fun\'s best household budget site competition. All design, text and figures are original.</p>';
};

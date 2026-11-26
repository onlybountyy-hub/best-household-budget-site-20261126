/* NestBudget data: category definitions, calculator defaults and the
   hand-written example household budgets shown on the Examples page.
   All figures are original illustrations, not copied from any source. */
'use strict';

var NB = window.NB || {};
window.NB = NB;

/* Spending categories. bucket: needs | wants | savings — the 50/30/20 split. */
NB.CATEGORIES = [
  { key: 'housing',     label: 'Housing',     hint: 'Rent or mortgage, taxes', bucket: 'needs',   color: '#1e5c46' },
  { key: 'food',        label: 'Food',        hint: 'Groceries + eating out',  bucket: 'needs',   color: '#2f6f8f' },
  { key: 'transport',   label: 'Transport',   hint: 'Car, fuel, transit',      bucket: 'needs',   color: '#7fae8e' },
  { key: 'utilities',   label: 'Utilities',   hint: 'Power, water, internet',  bucket: 'needs',   color: '#e8a13a' },
  { key: 'insurance',   label: 'Insurance',   hint: 'Health, home, auto',      bucket: 'needs',   color: '#8a6fb8' },
  { key: 'entertainment', label: 'Fun & leisure', hint: 'Streaming, hobbies',  bucket: 'wants',   color: '#d96a4a' },
  { key: 'savings',     label: 'Savings',     hint: 'Emergency + goals',       bucket: 'savings', color: '#3a9e6d' },
  { key: 'debt',        label: 'Debt payments', hint: 'Cards, loans (minimums)', bucket: 'savings', color: '#b3372a' },
  { key: 'misc',        label: 'Everything else', hint: 'Clothes, gifts, personal', bucket: 'wants', color: '#9a8a6a' }
];

/* Default month used by the budget calculator and the 50/30/20 page:
   a two-adult household, take-home pay $5,200 a month. */
NB.DEFAULT_BUDGET = {
  income: 5200,
  housing: 1650,
  food: 620,
  transport: 480,
  utilities: 260,
  insurance: 310,
  entertainment: 240,
  savings: 500,
  debt: 350,
  misc: 180
};

/* Default debts for the payoff planner. */
NB.DEFAULT_DEBTS = [
  { name: 'Credit card', balance: 4200, apr: 24.99, min: 105 },
  { name: 'Auto loan',   balance: 9800, apr: 7.20,  min: 210 },
  { name: 'Student loan', balance: 6500, apr: 5.50, min: 85 }
];
NB.DEFAULT_EXTRA = 150;

/* Default savings goal. */
NB.DEFAULT_GOAL = { name: 'Family vacation', target: 3000, saved: 650, monthly: 250 };

/* Default emergency-fund inputs. */
NB.DEFAULT_EMERGENCY = { essentials: 2800, months: 6, saved: 4200, monthly: 400 };

/* Realistic example household budgets (monthly, take-home pay).
   Written from scratch as illustrations of the method. */
NB.EXAMPLES = [
  {
    id: 'single',
    title: 'Maya, 29 — single renter',
    income: 2550,
    note: 'Earns $38,000 a year. Rents a one-bedroom with a roommate arrangement, cooks most meals, rides the bus.',
    items: { housing: 850, food: 320, transport: 140, utilities: 130, insurance: 180, entertainment: 120, savings: 300, debt: 160, misc: 150 },
    verdict: 'Needs run high at 64% — rent is the lever. Even so, $300 a month to savings plus a $200 surplus keeps the emergency fund growing.'
  },
  {
    id: 'couple',
    title: 'Dan & Priya — couple, no kids',
    income: 3150,
    note: 'Earns $45,000 a year combined. Small apartment, one shared car, and a standing date night that stays in the budget instead of breaking it.',
    items: { housing: 1050, food: 430, transport: 260, utilities: 170, insurance: 230, entertainment: 150, savings: 350, debt: 200, misc: 130 },
    verdict: 'Needs 68%, wants 9%, savings 23% once the $180 surplus is counted. Closest to 50/30/20 of the three — because rent is modest for their pay.'
  },
  {
    id: 'family',
    title: 'The Okafors — family of four',
    income: 5900,
    note: 'Earns $90,000 a year. Mortgage on a three-bedroom, two cars, kids in after-school care, and a grocery bill that never stops growing.',
    items: { housing: 1850, food: 980, transport: 640, utilities: 330, insurance: 520, entertainment: 260, savings: 600, debt: 310, misc: 220 },
    verdict: 'Needs 73% — childcare sits inside food and transport here, and it swallows the wants budget. Their fix is not cutting fun; it is the $190 surplus plus $600 planned savings, a 13% savings rate.'
  }
];

/* Reference benchmarks shown on the Method page. */
NB.BENCHMARKS = {
  rule503020: { needs: 50, wants: 30, savings: 20 },
  emergencyMonths: '3–6 months of essential spending; 6–9 if income is variable or the household has one earner.',
  savingsRateNote: 'A 20% savings rate (planned savings plus unspent surplus, divided by take-home pay) is a strong target; 10% is a solid start.'
};

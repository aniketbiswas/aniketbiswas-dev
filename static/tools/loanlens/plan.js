export const defaultFees = {
  processingPercent: 0,
  processingFixed: 0,
  taxPercent: 18,
  otherUpfront: 0,
  annualFee: 0,
  prepaymentPercent: 0,
  prepaymentFixed: 0,
};

export function defaultScenario(overrides = {}) {
  return {
    id: "custom",
    name: "Plan 1",
    principal: 5000000,
    annualRate: 8.5,
    tenureYears: 20,
    annualPrepayment: 0,
    annualFirstMonth: 12,
    annualLastMonth: 600,
    annualGrowthPercent: 0,
    monthlyExtra: 0,
    monthlyExtraStart: 1,
    monthlyExtraEnd: 600,
    oneOffs: [],
    rateChanges: [],
    ...overrides,
    fees: { ...defaultFees, ...overrides.fees },
  };
}

export function defaultPlan(now = new Date()) {
  const firstPayment = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    version: 1,
    firstPaymentMonth: `${firstPayment.getFullYear()}-${String(firstPayment.getMonth() + 1).padStart(2, "0")}`,
    selectedId: "custom",
    goals: {
      targetYears: 10,
      monthlyBudget: null,
      annualBudget: null,
      propertyPrice: null,
      availableCash: null,
      reserveCash: 0,
      purchaseCosts: 0,
    },
    scenarios: [defaultScenario()],
  };
}

export class InputError extends Error {
  constructor(message) {
    super(message);
    this.name = "InputError";
  }
}

function number(value, label, min, max, integer = false) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max ||
      (integer && !Number.isInteger(value))) {
    throw new InputError(`${label} must be ${integer ? "a whole number" : "a number"} between ${min} and ${max}.`);
  }
}

export function validateScenario(s) {
  if (!s || typeof s !== "object" || Array.isArray(s)) throw new InputError("A loan scenario is required.");
  if (typeof s.id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(s.id)) throw new InputError("Invalid scenario ID.");
  if (typeof s.name !== "string" || !s.name.trim() || s.name.length > 100) throw new InputError("Scenario name must contain 1-100 characters.");
  number(s.principal, "Loan amount (rupees)", 1000, 1000000000);
  number(s.annualRate, "Annual interest rate (%)", 0, 30);
  number(s.tenureYears, "Tenure (years)", 1, 50, true);
  number(s.annualPrepayment, "Annual prepayment (rupees)", 0, 1000000000);
  number(s.annualFirstMonth, "First annual prepayment month", 1, 600, true);
  number(s.annualLastMonth, "Last annual prepayment month", s.annualFirstMonth, 600, true);
  number(s.annualGrowthPercent, "Annual prepayment growth (%)", -100, 25);
  number(s.monthlyExtra, "Monthly extra payment (rupees)", 0, 1000000000);
  number(s.monthlyExtraStart, "Monthly extra start month", 1, 600, true);
  number(s.monthlyExtraEnd, "Monthly extra end month", s.monthlyExtraStart, 600, true);
  if (!Array.isArray(s.oneOffs) || s.oneOffs.length > 100) throw new InputError("Use at most 100 one-off prepayments.");
  if (!Array.isArray(s.rateChanges) || s.rateChanges.length > 100) throw new InputError("Use at most 100 interest-rate changes.");
  for (const item of s.oneOffs) {
    if (!item || typeof item !== "object") throw new InputError("Invalid one-off prepayment.");
    number(item.month, "One-off month", 1, 600, true);
    number(item.amount, "One-off amount (rupees)", 0, 1000000000);
  }
  const months = new Set();
  for (const item of s.rateChanges) {
    if (!item || typeof item !== "object") throw new InputError("Invalid interest-rate change.");
    number(item.month, "Rate-change month", 2, 600, true);
    number(item.annualRate, "Changed annual rate (%)", 0, 30);
    if (months.has(item.month)) throw new InputError("Only one rate change is allowed per month.");
    months.add(item.month);
  }
  if (!s.fees || typeof s.fees !== "object") throw new InputError("Fee settings are required.");
  for (const key of ["processingPercent", "prepaymentPercent"]) number(s.fees[key], key, 0, 10);
  number(s.fees.taxPercent, "Tax on modelled fees (%)", 0, 30);
  for (const key of ["processingFixed", "otherUpfront", "annualFee", "prepaymentFixed"]) number(s.fees[key], key, 0, 100000000);
  return s;
}

export function validatePlan(plan) {
  if (!plan || typeof plan !== "object" || plan.version !== 1) throw new InputError("Unsupported plan format.");
  if (typeof plan.firstPaymentMonth !== "string" || !/^(20[0-9]{2}|2100)-(0[1-9]|1[0-2])$/.test(plan.firstPaymentMonth)) {
    throw new InputError("First EMI month must be between 2000-01 and 2100-12.");
  }
  if (!Array.isArray(plan.scenarios) || plan.scenarios.length < 1 || plan.scenarios.length > 12) {
    throw new InputError("Keep between 1 and 12 scenarios.");
  }
  const ids = new Set();
  for (const s of plan.scenarios) {
    validateScenario(s);
    if (ids.has(s.id)) throw new InputError("Scenario IDs must be unique.");
    ids.add(s.id);
  }
  if (!ids.has(plan.selectedId)) throw new InputError("Select an existing scenario.");
  if (!plan.goals || typeof plan.goals !== "object") throw new InputError("Goal settings are required.");
  number(plan.goals.targetYears, "Target payoff (years)", 1, 50, true);
  for (const key of ["monthlyBudget", "annualBudget", "propertyPrice", "availableCash"]) {
    if (plan.goals[key] !== null) number(plan.goals[key], key, 0, 1000000000);
  }
  for (const key of ["reserveCash", "purchaseCosts"]) number(plan.goals[key], key, 0, 1000000000);
  return plan;
}

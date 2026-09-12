import { validateScenario, validatePlan } from "./plan.js";

const BALANCE_TOLERANCE = 0.005;

export function emiFor(principal, annualRate, months) {
  if (![principal, annualRate, months].every(Number.isFinite) || principal < 0 || annualRate < 0 || months <= 0) {
    throw new RangeError("EMI requires a non-negative principal and rate, and a positive number of months.");
  }
  const rate = annualRate / 1200;
  return rate === 0 ? principal / months : principal * rate / -Math.expm1(-months * Math.log1p(rate));
}

export function upfrontCost(s) {
  const processing = s.principal * s.fees.processingPercent / 100 + s.fees.processingFixed;
  return processing * (1 + s.fees.taxPercent / 100) + s.fees.otherUpfront;
}

export function simulate(s, { maxMonths = 1200 } = {}) {
  validateScenario(s);
  if (!Number.isInteger(maxMonths) || maxMonths < 1 || maxMonths > 1200) throw new RangeError("Projection must be 1-1200 months.");
  const emi = emiFor(s.principal, s.annualRate, s.tenureYears * 12);
  const changes = new Map(s.rateChanges.map((item) => [item.month, item.annualRate]));
  const lumps = new Map();
  for (const { month, amount } of s.oneOffs) lumps.set(month, (lumps.get(month) ?? 0) + amount);
  const taxRate = s.fees.taxPercent / 100;
  const processing = s.principal * s.fees.processingPercent / 100 + s.fees.processingFixed;
  const upfrontFees = upfrontCost(s);
  const feeBreakdown = { processing, otherUpfront: s.fees.otherUpfront, annual: 0, prepayment: 0, tax: processing * taxRate };
  const rows = [];
  const years = [];
  let balance = s.principal;
  let annualRate = s.annualRate;
  let totalInterest = 0;
  let totalRegularPayments = 0;
  let totalPrepayment = 0;
  let totalFees = upfrontFees;
  let cumulativePrincipal = 0;
  let unusedPrepayment = 0;
  let nonAmortizingMonths = 0;

  for (let month = 1; month <= maxMonths && balance > BALANCE_TOLERANCE; month += 1) {
    if (changes.has(month)) annualRate = changes.get(month);
    const openingBalance = balance;
    const interest = openingBalance * annualRate / 1200;
    const regularPayment = Math.min(emi, openingBalance + interest);
    const regularPrincipal = regularPayment - interest;
    const capitalizedInterest = Math.max(0, -regularPrincipal);
    if (interest >= emi) nonAmortizingMonths += 1;
    balance = Math.max(0, openingBalance - regularPrincipal);

    let requestedExtra = lumps.get(month) ?? 0;
    const monthlyExtra = month >= s.monthlyExtraStart && month <= s.monthlyExtraEnd ? s.monthlyExtra : 0;
    requestedExtra += monthlyExtra;
    if (month >= s.annualFirstMonth && month <= s.annualLastMonth && (month - s.annualFirstMonth) % 12 === 0) {
      const occurrence = (month - s.annualFirstMonth) / 12;
      requestedExtra += s.annualPrepayment * ((1 + s.annualGrowthPercent / 100) ** occurrence);
    }
    // Current-month interest is settled through the EMI first; extra money reduces the remaining balance.
    const prepayment = Math.min(requestedExtra, balance);
    const unusedExtra = requestedExtra - prepayment;
    balance = Math.max(0, balance - prepayment);
    if (balance < BALANCE_TOLERANCE) balance = 0;
    const prepaymentFee = prepayment > 0 ? prepayment * s.fees.prepaymentPercent / 100 + s.fees.prepaymentFixed : 0;
    const annualFee = month % 12 === 0 ? s.fees.annualFee : 0;
    const tax = (prepaymentFee + annualFee) * taxRate;
    const fee = prepaymentFee + annualFee + tax;
    const payment = regularPayment + prepayment + fee;
    totalInterest += interest;
    totalRegularPayments += regularPayment;
    totalPrepayment += prepayment;
    totalFees += fee;
    unusedPrepayment += unusedExtra;
    cumulativePrincipal += regularPrincipal + prepayment;
    feeBreakdown.annual += annualFee;
    feeBreakdown.prepayment += prepaymentFee;
    feeBreakdown.tax += tax;
    const year = Math.ceil(month / 12);
    const row = {
      month, year, annualRate, openingBalance, interest, regularPayment, regularPrincipal, capitalizedInterest,
      prepayment, requestedExtra, unusedExtra, closingBalance: balance, fee, prepaymentFee, annualFee, tax, payment,
      cumulativeInterest: totalInterest, cumulativePrincipal,
    };
    rows.push(row);
    if (month % 12 === 1) {
      years.push({
        year, openingBalance, regularPayments: 0, regularPrincipal: 0, prepayment: 0, interest: 0,
        fees: year === 1 ? upfrontFees : 0, cashOutflow: year === 1 ? upfrontFees : 0, closingBalance: balance,
        monthlyExtras: 0,
      });
    }
    const bucket = years[years.length - 1];
    bucket.regularPayments += regularPayment;
    bucket.regularPrincipal += regularPrincipal;
    bucket.prepayment += prepayment;
    bucket.interest += interest;
    bucket.fees += fee;
    bucket.cashOutflow += payment;
    bucket.closingBalance = balance;
    bucket.monthlyExtras += Math.min(monthlyExtra, prepayment);
  }
  const paidOff = balance === 0;
  const totalRepaid = totalRegularPayments + totalPrepayment;
  return {
    emi, paidOff, months: rows.length, payoffMonth: paidOff ? rows.length : null,
    totalInterest, totalRegularPayments, totalPrepayment, totalRepaid, totalFees,
    totalCashOutflow: totalRepaid + totalFees, borrowingCost: totalInterest + totalFees, upfrontFees, feeBreakdown,
    remainingBalance: balance, unusedPrepayment, nonAmortizingMonths,
    firstYearCash: years[0].cashOutflow, peakYearCash: Math.max(...years.map((y) => y.cashOutflow)),
    rows, years,
  };
}

export function withoutExtras(s) {
  return { ...s, annualPrepayment: 0, monthlyExtra: 0, oneOffs: [] };
}

export function comparePlan(plan) {
  validatePlan(plan);
  return plan.scenarios.map((scenario) => {
    const result = simulate(scenario);
    const baseline = simulate(withoutExtras(scenario));
    const comparable = result.paidOff && baseline.paidOff;
    return {
      scenario, result, baseline,
      interestSaved: comparable ? baseline.totalInterest - result.totalInterest : null,
      monthsSaved: comparable ? baseline.months - result.months : null,
      netSavings: comparable ? baseline.borrowingCost - result.borrowingCost : null,
    };
  });
}

export function repaymentOptions(s) {
  validateScenario(s);
  return [
    { key: "twenty", label: "20-year loan", tenureYears: 20, annualPrepayment: 0 },
    { key: "thirty", label: "30-year loan", tenureYears: 30, annualPrepayment: 0 },
    { key: "five", label: "30 years + 5 lakh / year", tenureYears: 30, annualPrepayment: 500000 },
    { key: "ten", label: "30 years + 10 lakh / year", tenureYears: 30, annualPrepayment: 1000000 },
  ].map(({ key, label, tenureYears, annualPrepayment }) => {
    const scenario = {
      ...s, tenureYears, annualPrepayment, annualFirstMonth: 12, annualLastMonth: 600,
      annualGrowthPercent: 0, monthlyExtra: 0, monthlyExtraStart: 1, monthlyExtraEnd: 600, oneOffs: [],
    };
    const current = s.tenureYears === tenureYears && s.annualPrepayment === annualPrepayment &&
      s.monthlyExtra === 0 && s.oneOffs.length === 0 &&
      (annualPrepayment === 0 || (s.annualFirstMonth === 12 && s.annualLastMonth === 600 && s.annualGrowthPercent === 0));
    return { key, label, scenario, result: simulate(scenario), current };
  });
}

function solveExtra(s, months, kind) {
  const base = { ...withoutExtras(s), annualGrowthPercent: 0, annualFirstMonth: 12, annualLastMonth: 600,
    monthlyExtraStart: 1, monthlyExtraEnd: 600 };
  const paysOff = (extra) => simulate({ ...base, [kind]: extra }, { maxMonths: months }).paidOff;
  if (paysOff(0)) return 0;
  let lo = 0;
  let hi = s.principal;
  while (hi < 1000000000 && !paysOff(hi)) hi = Math.min(hi * 2, 1000000000);
  if (!paysOff(hi)) return null;
  for (let i = 0; i < 42; i += 1) {
    const mid = (lo + hi) / 2;
    if (paysOff(mid)) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi);
}

export function goalAnalysis(s, goals) {
  validateScenario(s);
  const targetMonths = goals.targetYears * 12;
  const hasMonthlyBudget = goals.monthlyBudget !== null;
  const taxMultiplier = 1 + s.fees.taxPercent / 100;
  const financedShare = s.fees.processingPercent / 100 * taxMultiplier;
  let minimumLoan = null;
  let cashRequired = null;
  let cashShortfall = null;
  if (goals.propertyPrice !== null) {
    cashRequired = goals.propertyPrice + goals.purchaseCosts - s.principal + upfrontCost(s);
    if (goals.availableCash !== null) {
      cashShortfall = Math.max(0, cashRequired + goals.reserveCash - goals.availableCash);
      const fixedFees = s.fees.processingFixed * taxMultiplier + s.fees.otherUpfront;
      minimumLoan = Math.max(0, (goals.propertyPrice + goals.purchaseCosts + fixedFees -
        goals.availableCash + goals.reserveCash) / (1 - financedShare));
      // An entirely cash-funded purchase has no loan-origination charges.
      if (goals.availableCash - goals.reserveCash >= goals.propertyPrice + goals.purchaseCosts) minimumLoan = 0;
    }
  }
  const maximumLoanForEmiBudget = hasMonthlyBudget ?
    Math.max(0, goals.monthlyBudget - s.monthlyExtra) / emiFor(1, s.annualRate, s.tenureYears * 12) : null;
  const tenures = [10, 15, 20, 25, 30].map((years) => {
    const result = simulate({ ...s, tenureYears: years });
    const monthlyCommitment = result.emi + s.monthlyExtra;
    const annualExtras = Math.max(...result.years.map((y) => y.prepayment - y.monthlyExtras));
    const withinBudget = hasMonthlyBudget ?
      monthlyCommitment <= goals.monthlyBudget + 0.005 &&
      (goals.annualBudget === null || annualExtras <= goals.annualBudget + 0.005) : null;
    return {
      years, emi: result.emi, months: result.months, paidOff: result.paidOff,
      totalInterest: result.totalInterest, borrowingCost: result.borrowingCost, monthlyCommitment, withinBudget,
    };
  });
  const feasible = tenures.filter((t) => t.withinBudget && t.paidOff);
  feasible.sort((a, b) => a.borrowingCost - b.borrowingCost);
  return {
    targetMonths,
    requiredAnnualPrepayment: solveExtra(s, targetMonths, "annualPrepayment"),
    requiredMonthlyExtra: solveExtra(s, targetMonths, "monthlyExtra"),
    directTargetEmi: emiFor(s.principal, s.annualRate, targetMonths),
    minimumLoan, maximumLoanForEmiBudget, cashRequired, cashShortfall, tenures,
    cheapestFeasibleTenure: feasible[0]?.years ?? null,
  };
}

export function monthLabel(firstPaymentMonth, month) {
  const [year, initialMonth] = firstPaymentMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, initialMonth - 1 + month - 1, 1));
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
}

import type { DcfInput, EquityBridgeInput, ValidationIssue } from "./types";

const MARKETABLE_SECURITIES_OUTCOMES = [
  "separately_reported_current",
  "not_separately_reported",
  "cannot_classify",
] as const;

export function isMarketableSecuritiesOutcome(value: unknown): value is typeof MARKETABLE_SECURITIES_OUTCOMES[number] {
  return typeof value === "string" && MARKETABLE_SECURITIES_OUTCOMES.includes(value as typeof MARKETABLE_SECURITIES_OUTCOMES[number]);
}

function hasValidReviewEvidence(review: unknown): boolean {
  if (typeof review !== "object" || review === null || Array.isArray(review)) return false;
  const evidence = review as { note?: unknown; sourceIds?: unknown };
  return typeof evidence.note === "string" && evidence.note.trim().length > 0 &&
    Array.isArray(evidence.sourceIds) && evidence.sourceIds.length > 0 &&
    evidence.sourceIds.every((id) => typeof id === "string" && id.trim().length > 0);
}

const isoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

function addFactIssues(
  issues: ValidationIssue[], field: string, fact: EquityBridgeInput[keyof Pick<EquityBridgeInput,
    "sharePrice" | "basicShares" | "debt" | "preferredEquity" | "nonControllingInterest" | "cashAndCashEquivalents" | "currentShortTermMarketableSecurities">] | undefined,
  allowedUnits: string[],
): void {
  if (!fact) {
    issues.push({ field, code: "missing_input", message: `${field} is required by the reference bridge.` });
    return;
  }
  if (!Number.isFinite(fact.value)) issues.push({ field, code: "non_finite", message: `${field} must be finite.` });
  if (!allowedUnits.includes(fact.unit)) issues.push({ field, code: "invalid_unit", message: `${field} has an unsupported unit.` });
  if (!isoDate(fact.asOf)) issues.push({ field, code: "invalid_date", message: `${field} must have a valid ISO as-of date.` });
  if (!Array.isArray(fact.sourceIds) || fact.sourceIds.length === 0 || fact.sourceIds.some((id) => !id.trim())) {
    issues.push({ field, code: "missing_source", message: `${field} must reference at least one source.` });
  }
}

export function validateEquityBridgeInput(input: EquityBridgeInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  addFactIssues(issues, "sharePrice", input.sharePrice, ["USD_per_share"]);
  addFactIssues(issues, "basicShares", input.basicShares, ["shares_millions"]);
  addFactIssues(issues, "debt", input.debt, ["USD_millions"]);
  addFactIssues(issues, "preferredEquity", input.preferredEquity, ["USD_millions"]);
  addFactIssues(issues, "nonControllingInterest", input.nonControllingInterest, ["USD_millions"]);
  addFactIssues(issues, "cashAndCashEquivalents", input.cashAndCashEquivalents, ["USD_millions"]);
  if (input.currentShortTermMarketableSecurities) {
    addFactIssues(issues, "currentShortTermMarketableSecurities", input.currentShortTermMarketableSecurities, ["USD_millions"]);
  }

  if (Number.isFinite(input.basicShares.value) && input.basicShares.value <= 0) {
    issues.push({ field: "basicShares", code: "non_positive_shares", message: "Basic common shares outstanding must be greater than zero." });
  }
  if (Number.isFinite(input.sharePrice.value) && input.sharePrice.value <= 0) {
    issues.push({ field: "sharePrice", code: "non_positive_price", message: "Reference share price must be greater than zero." });
  }
  for (const key of ["debt", "preferredEquity", "nonControllingInterest", "cashAndCashEquivalents"] as const) {
    if (Number.isFinite(input[key].value) && input[key].value < 0) {
      issues.push({ field: key, code: "negative_amount", message: `${key} cannot be negative.` });
    }
  }
  if (input.currentShortTermMarketableSecurities && Number.isFinite(input.currentShortTermMarketableSecurities.value) && input.currentShortTermMarketableSecurities.value < 0) {
    issues.push({ field: "currentShortTermMarketableSecurities", code: "negative_amount", message: "Current short-term marketable securities cannot be negative." });
  }
  const review = input.marketableSecuritiesReview;
  if (!hasValidReviewEvidence(review)) {
    issues.push({ field: "marketableSecuritiesReview", code: "missing_classification_evidence", message: "Marketable-security classification needs a note and source reference." });
  }
  if (!isMarketableSecuritiesOutcome(review?.outcome)) {
    issues.push({ field: "marketableSecuritiesReview.outcome", code: "unsupported_outcome", message: "Marketable-security review outcome is unsupported." });
  } else if (review.outcome === "cannot_classify") {
    issues.push({ field: "currentShortTermMarketableSecurities", code: "unclassified_security", message: "Short-term marketable securities cannot be included until their current-asset classification is supported." });
  } else if (review.outcome === "separately_reported_current" && !input.currentShortTermMarketableSecurities) {
    issues.push({ field: "currentShortTermMarketableSecurities", code: "missing_input", message: "The review says separately reported current securities exist, but their amount is missing." });
  } else if (review.outcome === "not_separately_reported" && input.currentShortTermMarketableSecurities) {
    issues.push({ field: "currentShortTermMarketableSecurities", code: "classification_mismatch", message: "A security amount was supplied despite the review stating none is separately reported." });
  }
  if (input.currentShortTermMarketableSecurities &&
      input.currentShortTermMarketableSecurities.inclusionNote?.toLowerCase().includes("included in cash")) {
    issues.push({ field: "currentShortTermMarketableSecurities", code: "cash_overlap", message: "Marketable securities already included in cash equivalents must not be counted a second time." });
  }

  if (!isoDate(input.valuationDate)) issues.push({ field: "valuationDate", code: "invalid_date", message: "Valuation date must be a valid ISO date." });
  if (!isoDate(input.balanceSheetDate)) issues.push({ field: "balanceSheetDate", code: "invalid_date", message: "Balance-sheet date must be a valid ISO date." });
  else if (isoDate(input.valuationDate) && input.balanceSheetDate > input.valuationDate) {
    issues.push({ field: "balanceSheetDate", code: "date_after_valuation", message: "Balance-sheet reporting date must be on or before the market-price valuation date." });
  }
  if (input.sharePrice.asOf !== input.valuationDate) issues.push({ field: "sharePrice.asOf", code: "date_mismatch", message: "Share price date must match the market-price valuation date." });
  for (const key of ["debt", "preferredEquity", "nonControllingInterest", "cashAndCashEquivalents"] as const) {
    if (input[key].asOf !== input.balanceSheetDate) issues.push({ field: `${key}.asOf`, code: "date_mismatch", message: `${key} date must match the balance-sheet reporting date.` });
  }
  if (input.currentShortTermMarketableSecurities && input.currentShortTermMarketableSecurities.asOf !== input.balanceSheetDate) {
    issues.push({ field: "currentShortTermMarketableSecurities.asOf", code: "date_mismatch", message: "Marketable securities date must match the balance-sheet reporting date." });
  }
  return issues;
}

/** Validate constraints relevant to milestone 1; DCF implementation comes later. */
export function validateDcfInput(input: DcfInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nonnegative = ["baseRevenue", "baseEbit", "effectiveTaxRate", "daToRevenue", "capexToRevenue"] as const;
  for (const field of nonnegative) {
    const value = input[field];
    if (!Number.isFinite(value)) issues.push({ field, code: "non_finite", message: `${field} must be finite.` });
  }
  if (input.baseRevenue <= 0) issues.push({ field: "baseRevenue", code: "non_positive_revenue", message: "Base revenue must be greater than zero so the historical ratios can be applied." });
  if (input.baseEbit <= 0) issues.push({ field: "baseEbit", code: "non_positive_ebit", message: "Base EBIT must be positive for an eligible company." });
  if (input.effectiveTaxRate < 0 || input.effectiveTaxRate > 0.4) issues.push({ field: "effectiveTaxRate", code: "unsupported_rate", message: "Historical effective tax rate must be between 0% and 40%." });
  if (input.daToRevenue < 0) issues.push({ field: "daToRevenue", code: "negative_ratio", message: "D&A ratio cannot be negative." });
  if (input.capexToRevenue < 0) issues.push({ field: "capexToRevenue", code: "negative_ratio", message: "CapEx ratio cannot be negative." });
  if (!Number.isFinite(input.operatingNwcToRevenue)) issues.push({ field: "operatingNwcToRevenue", code: "non_finite", message: "Operating NWC ratio must be finite." });
  const bridge = input.equityBridge;
  for (const field of ["debt", "preferredEquity", "nonControllingInterest", "cashAndCashEquivalents"] as const) {
    const value = bridge[field]?.value;
    if (!Number.isFinite(value)) issues.push({ field: `equityBridge.${field}`, code: "non_finite", message: `${field} must be finite.` });
    else if (value < 0) issues.push({ field: `equityBridge.${field}`, code: "negative_amount", message: `${field} cannot be negative.` });
  }
  const shares = bridge.basicShares?.value;
  if (!Number.isFinite(shares)) issues.push({ field: "equityBridge.basicShares", code: "non_finite", message: "Basic shares must be finite." });
  else if (shares <= 0) issues.push({ field: "equityBridge.basicShares", code: "non_positive_shares", message: "Basic shares must be greater than zero." });
  const securities = bridge.currentShortTermMarketableSecurities?.value;
  if (securities !== undefined && !Number.isFinite(securities)) issues.push({ field: "equityBridge.currentShortTermMarketableSecurities", code: "non_finite", message: "Eligible current securities must be finite." });
  else if (securities !== undefined && securities < 0) issues.push({ field: "equityBridge.currentShortTermMarketableSecurities", code: "negative_amount", message: "Eligible current securities cannot be negative." });
  const securitiesReview = bridge.marketableSecuritiesReview;
  if (!hasValidReviewEvidence(securitiesReview)) {
    issues.push({ field: "equityBridge.marketableSecuritiesReview", code: "missing_classification_evidence", message: "Marketable-security classification needs a note and source reference." });
  }
  if (!isMarketableSecuritiesOutcome(securitiesReview?.outcome)) {
    issues.push({ field: "equityBridge.marketableSecuritiesReview.outcome", code: "unsupported_outcome", message: "Marketable-security review outcome is unsupported." });
  } else if (securitiesReview.outcome === "cannot_classify") {
    issues.push({ field: "equityBridge.currentShortTermMarketableSecurities", code: "unclassified_security", message: "Short-term marketable securities cannot be included until their current-asset classification is supported." });
  } else if (securitiesReview.outcome === "separately_reported_current" && bridge.currentShortTermMarketableSecurities === undefined) {
    issues.push({ field: "equityBridge.currentShortTermMarketableSecurities", code: "missing_input", message: "The review says separately reported current securities exist, but their amount is missing." });
  } else if (securitiesReview.outcome === "not_separately_reported" && bridge.currentShortTermMarketableSecurities !== undefined) {
    issues.push({ field: "equityBridge.currentShortTermMarketableSecurities", code: "classification_mismatch", message: "A security amount was supplied despite the review stating none is separately reported." });
  }
  if (input.targetEv !== undefined && !Number.isFinite(input.targetEv)) issues.push({ field: "targetEv", code: "non_finite", message: "Target enterprise value must be finite when supplied." });
  for (const [field, value] of Object.entries(input.assumptions)) {
    if (!Number.isFinite(value)) issues.push({ field: `assumptions.${field}`, code: "non_finite", message: `${field} must be finite.` });
  }
  const { revenueGrowth, forecastOperatingMargin, wacc, terminalGrowth } = input.assumptions;
  if (revenueGrowth < -0.2 || revenueGrowth > 0.5) issues.push({ field: "assumptions.revenueGrowth", code: "unsupported_rate", message: "Revenue growth must be between -20% and 50%." });
  if (forecastOperatingMargin < 0 || forecastOperatingMargin > 0.7) issues.push({ field: "assumptions.forecastOperatingMargin", code: "unsupported_rate", message: "Forecast operating margin must be between 0% and 70%." });
  if (wacc < 0.05 || wacc > 0.2) issues.push({ field: "assumptions.wacc", code: "unsupported_rate", message: "WACC must be between 5% and 20%." });
  if (terminalGrowth < 0 || terminalGrowth > 0.04) issues.push({ field: "assumptions.terminalGrowth", code: "unsupported_rate", message: "Terminal growth must be between 0% and 4%." });
  if (wacc <= terminalGrowth) issues.push({ field: "assumptions.terminalGrowth", code: "wacc_not_above_terminal_growth", message: "WACC must be strictly greater than terminal growth." });
  if (terminalGrowth > wacc - 0.005) issues.push({ field: "assumptions.terminalGrowth", code: "insufficient_wacc_spread", message: "Terminal growth must be at least 0.5 percentage points below WACC." });
  return issues;
}

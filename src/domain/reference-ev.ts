import { validateEquityBridgeInput } from "./validate";
import type { EquityBridgeInput, EquityValuePerShareResult, ReferenceEvResult, ValidationIssue } from "./types";

export type BridgeCalculation =
  | { status: "valid"; value: ReferenceEvResult }
  | { status: "invalid_input"; issues: ValidationIssue[] };

export type EquityPerShareCalculation =
  | { status: "valid"; value: EquityValuePerShareResult }
  | { status: "invalid_input"; issues: ValidationIssue[] };

export function calculateReferenceEv(input: EquityBridgeInput): BridgeCalculation {
  const issues = validateEquityBridgeInput(input);
  if (issues.length) return { status: "invalid_input", issues };
  const marketCap = input.sharePrice.value * input.basicShares.value;
  const securities = input.currentShortTermMarketableSecurities?.value ?? 0;
  const referenceEv = marketCap + input.debt.value + input.preferredEquity.value +
    input.nonControllingInterest.value - input.cashAndCashEquivalents.value - securities;
  if (!Number.isFinite(marketCap) || !Number.isFinite(referenceEv)) {
    return { status: "invalid_input", issues: [{ field: "referenceEv", code: "non_finite_result", message: "Reference enterprise-value calculation did not produce a finite result." }] };
  }
  return {
    status: "valid",
    value: {
      marketCap,
      referenceEv,
      valuationDate: input.valuationDate,
      balanceSheetDate: input.balanceSheetDate,
      adjustments: {
        debt: input.debt.value,
        preferredEquity: input.preferredEquity.value,
        nonControllingInterest: input.nonControllingInterest.value,
        cashAndCashEquivalents: input.cashAndCashEquivalents.value,
        eligibleCurrentShortTermMarketableSecurities: securities,
      },
    },
  };
}

export function calculateEquityValuePerShare(modeledEv: number, input: EquityBridgeInput): EquityPerShareCalculation {
  const issues = validateEquityBridgeInput(input);
  if (!Number.isFinite(modeledEv)) issues.push({ field: "modeledEv", code: "non_finite", message: "Modeled enterprise value must be finite." });
  if (issues.length) return { status: "invalid_input", issues };
  const securities = input.currentShortTermMarketableSecurities?.value ?? 0;
  const estimatedEquityValuePerShare = (modeledEv - input.debt.value - input.preferredEquity.value -
    input.nonControllingInterest.value + input.cashAndCashEquivalents.value + securities) /
    input.basicShares.value;
  if (!Number.isFinite(estimatedEquityValuePerShare)) {
    return { status: "invalid_input", issues: [{ field: "modeledEv", code: "non_finite_result", message: "Equity value per share calculation did not produce a finite result." }] };
  }
  return {
    status: "valid",
    value: {
      estimatedEquityValuePerShare,
      valuationDate: input.valuationDate,
      balanceSheetDate: input.balanceSheetDate,
      basicShares: input.basicShares.value,
    },
  };
}

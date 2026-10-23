import { describe, expect, it } from "vitest";
import { validateDcfInput } from "../../src/domain/validate";
import type { DcfInput } from "../../src/domain/types";

const validDcfInput = (): DcfInput => ({
  baseRevenue: 100,
  baseEbit: 20,
  effectiveTaxRate: 0.2,
  daToRevenue: 0.05,
  capexToRevenue: 0.04,
  operatingNwcToRevenue: -0.02,
  equityBridge: {
    debt: { value: 10, unit: "USD_millions", asOf: "2025-12-30", sourceIds: ["test"] },
    preferredEquity: { value: 0, unit: "USD_millions", asOf: "2025-12-30", sourceIds: ["test"] },
    nonControllingInterest: { value: 0, unit: "USD_millions", asOf: "2025-12-30", sourceIds: ["test"] },
    cashAndCashEquivalents: { value: 5, unit: "USD_millions", asOf: "2025-12-30", sourceIds: ["test"] },
    marketableSecuritiesReview: {
      outcome: "not_separately_reported",
      sourceIds: ["test"],
      note: "Test review found no separately reported current securities.",
    },
    basicShares: { value: 10, unit: "shares_millions", asOf: "2025-12-30", sourceIds: ["test"] },
  },
  assumptions: { revenueGrowth: 0.05, forecastOperatingMargin: 0.2, wacc: 0.095, terminalGrowth: 0.02 },
});

describe("DCF input validation for the shared domain contract", () => {
  it("accepts valid rates and negative operating NWC", () => {
    expect(validateDcfInput(validDcfInput())).toEqual([]);
  });

  it("rejects missing/non-finite and unsupported input classes", () => {
    const input = validDcfInput();
    input.baseRevenue = -1;
    input.daToRevenue = -0.1;
    input.assumptions.wacc = 0.04;
    input.assumptions.terminalGrowth = 0.04;
    input.assumptions.revenueGrowth = Number.POSITIVE_INFINITY;
    const issues = validateDcfInput(input);
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "non_positive_revenue", "negative_ratio", "unsupported_rate", "non_finite", "wacc_not_above_terminal_growth",
    ]));
  });

  it("rejects malformed review outcomes and evidence while accumulating independent issues", () => {
    const input = validDcfInput();
    const review = input.equityBridge.marketableSecuritiesReview as unknown as { outcome: string; sourceIds: unknown };
    review.outcome = "unknown";
    review.sourceIds = "not-an-array";
    expect(() => validateDcfInput(input)).not.toThrow();
    const issues = validateDcfInput(input);
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "missing_classification_evidence", "unsupported_outcome",
    ]));
  });

  it("accepts a zero-valued sourced amount for separately reported current securities", () => {
    const input = validDcfInput();
    input.equityBridge.currentShortTermMarketableSecurities = {
      value: 0, unit: "USD_millions", asOf: "2025-12-30", sourceIds: ["test"],
    };
    input.equityBridge.marketableSecuritiesReview = {
      outcome: "separately_reported_current",
      sourceIds: ["test"],
      note: "The separately reported current securities amount is zero.",
    };
    expect(validateDcfInput(input)).toEqual([]);
  });
});

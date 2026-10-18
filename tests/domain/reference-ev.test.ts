import { describe, expect, it } from "vitest";
import { calculateEquityValuePerShare, calculateReferenceEv } from "../../src/domain/reference-ev";
import { validBridgeInput } from "../fixtures/reference-bridge";

describe("reference EV and equity bridge", () => {
  it("includes each supported adjustment and keeps dates visible", () => {
    const result = calculateReferenceEv(validBridgeInput());
    expect(result.status).toBe("valid");
    if (result.status !== "valid") return;
    expect(result.value.marketCap).toBe(1000);
    expect(result.value.referenceEv).toBe(1005);
    expect(result.value.valuationDate).toBe("2025-12-31");
    expect(result.value.balanceSheetDate).toBe("2025-12-30");
  });

  it("bridges modeled EV to estimated value per basic share", () => {
    const result = calculateEquityValuePerShare(1005, validBridgeInput());
    expect(result.status).toBe("valid");
    if (result.status !== "valid") return;
    expect(result.value.estimatedEquityValuePerShare).toBe(100);
  });

  it("rejects missing inputs, nonfinite amounts, and zero or negative shares", () => {
    const missing = validBridgeInput();
    missing.cashAndCashEquivalents.sourceIds = [];
    expect(calculateReferenceEv(missing)).toMatchObject({ status: "invalid_input" });

    for (const shares of [0, -1]) {
      const input = validBridgeInput();
      input.basicShares.value = shares;
      expect(calculateReferenceEv(input)).toMatchObject({ status: "invalid_input" });
    }

    const nonfinite = validBridgeInput();
    nonfinite.debt.value = Number.NaN;
    expect(calculateReferenceEv(nonfinite)).toMatchObject({ status: "invalid_input" });
  });

  it("requires current classification and prevents cash-equivalent double counting", () => {
    const unclassified = validBridgeInput();
    unclassified.marketableSecuritiesReview.outcome = "cannot_classify";
    expect(calculateReferenceEv(unclassified)).toMatchObject({ status: "invalid_input" });

    const overlap = validBridgeInput();
    overlap.currentShortTermMarketableSecurities!.inclusionNote = "Already included in cash equivalents";
    expect(calculateReferenceEv(overlap)).toMatchObject({ status: "invalid_input" });

    const noSeparateSecurities = validBridgeInput();
    noSeparateSecurities.currentShortTermMarketableSecurities = undefined;
    noSeparateSecurities.marketableSecuritiesReview.outcome = "not_separately_reported";
    const result = calculateReferenceEv(noSeparateSecurities);
    expect(result.status).toBe("valid");
    if (result.status === "valid") expect(result.value.referenceEv).toBe(1010);
  });

  it("rejects securities that disagree with the review or date evidence", () => {
    const mismatch = validBridgeInput();
    mismatch.marketableSecuritiesReview.outcome = "not_separately_reported";
    expect(calculateReferenceEv(mismatch)).toMatchObject({ status: "invalid_input" });

    const future = validBridgeInput();
    future.balanceSheetDate = "2026-01-01";
    expect(calculateReferenceEv(future)).toMatchObject({ status: "invalid_input" });
  });
});

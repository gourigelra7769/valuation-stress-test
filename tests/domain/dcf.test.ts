import { describe, expect, it } from "vitest";
import { calculateDcf } from "../../src/domain/dcf";
import { dcfFixture, independentlyCalculatedDcf } from "../fixtures/dcf-fixture";

const expectClose = (actual: number, expected: number, digits = 9) => expect(actual).toBeCloseTo(expected, digits);

describe("five-year FCFF/WACC DCF", () => {
  it("matches independently expanded annual cash flows, discounting, terminal value, and bridge", () => {
    const result = calculateDcf(dcfFixture());
    expect(result.status).toBe("valid");
    if (result.status !== "valid") return;

    expect(result.value.forecast).toHaveLength(5);
    result.value.forecast.forEach((row, index) => {
      const expected = independentlyCalculatedDcf.years[index];
      expect(row.year).toBe(index + 1);
      for (const field of ["revenue", "ebit", "taxes", "da", "capex", "operatingNwc", "changeInNwc", "fcff", "discountFactor", "presentValueFcff"] as const) {
        expectClose(row[field], field === "operatingNwc" ? expected.nwc : expected[field]);
      }
    });
    expectClose(result.value.terminalValueAtYear5, independentlyCalculatedDcf.terminalValueAtYear5);
    expectClose(result.value.presentValueTerminalValue, independentlyCalculatedDcf.presentValueTerminalValue);
    expectClose(result.value.modeledEv, independentlyCalculatedDcf.modeledEv);
    expectClose(result.value.terminalValueContribution, independentlyCalculatedDcf.terminalValueContribution);
    expectClose(result.value.estimatedEquityValuePerShare, independentlyCalculatedDcf.estimatedEquityValuePerShare);
    const bridge = result.value.modeledEvToEquityBridge;
    expect(bridge.startingModeledEnterpriseValue).toBe(result.value.modeledEv);
    expect(bridge.deductions).toEqual({ debt: 20, preferredEquity: 2, nonControllingInterest: 3 });
    expect(bridge.additions).toEqual({ cashAndCashEquivalents: 15, eligibleCurrentShortTermMarketableSecurities: 5 });
    expect(bridge.shareCount).toEqual({ convention: "basic_common_shares", value: 10 });
    expectClose(bridge.equityValueBeforeShares, result.value.modeledEv - 20 - 2 - 3 + 15 + 5);
    expectClose(bridge.equityValueBeforeShares, bridge.estimatedEquityValuePerShare * bridge.shareCount.value);
    expectClose(bridge.estimatedEquityValuePerShare, independentlyCalculatedDcf.estimatedEquityValuePerShare);
    expectClose(bridge.estimatedEquityValuePerShare, result.value.estimatedEquityValuePerShare);
    expectClose(result.value.modeledEv,
      result.value.forecast.reduce((sum, row) => sum + row.presentValueFcff, 0) + result.value.presentValueTerminalValue);
    expectClose(result.value.terminalValueContribution, result.value.presentValueTerminalValue / result.value.modeledEv);
  });

  it("requires review support for omitted securities and applies only reviewed bridge adjustments", () => {
    const omitted = dcfFixture();
    omitted.equityBridge.currentShortTermMarketableSecurities = undefined;
    omitted.equityBridge.marketableSecuritiesReview = {
      outcome: "not_separately_reported",
      sourceIds: ["test-only"],
      note: "Synthetic test evidence says no separate current securities are reported.",
    };
    const omittedResult = calculateDcf(omitted);
    expect(omittedResult.status).toBe("valid");
    if (omittedResult.status !== "valid") return;
    const omittedBridge = omittedResult.value.modeledEvToEquityBridge;
    expect(omittedBridge.additions.eligibleCurrentShortTermMarketableSecurities).toBe(0);
    expectClose(omittedBridge.equityValueBeforeShares,
      omittedResult.value.modeledEv - 20 - 2 - 3 + 15);
    expectClose(omittedBridge.estimatedEquityValuePerShare,
      omittedBridge.equityValueBeforeShares / omittedBridge.shareCount.value);

    const ambiguous = dcfFixture();
    ambiguous.equityBridge.currentShortTermMarketableSecurities = undefined;
    delete (ambiguous.equityBridge as Partial<typeof ambiguous.equityBridge>).marketableSecuritiesReview;
    expect(calculateDcf(ambiguous)).toMatchObject({ status: "invalid_input" });

    const supplied = dcfFixture();
    expect(supplied.equityBridge.currentShortTermMarketableSecurities?.value).toBe(5);
    expect(calculateDcf(supplied)).toMatchObject({ status: "valid" });
  });

  it("is deterministic and returns finite outputs", () => {
    const first = calculateDcf(dcfFixture());
    const second = calculateDcf(dcfFixture());
    expect(second).toEqual(first);
    expect(first.status).toBe("valid");
    if (first.status !== "valid") return;
    const allNumbers = [
      ...first.value.forecast.flatMap((row) => Object.values(row)),
      first.value.terminalValueAtYear5, first.value.presentValueTerminalValue,
      first.value.modeledEv, first.value.terminalValueContribution,
      first.value.modeledEvToEquityBridge.startingModeledEnterpriseValue,
      first.value.modeledEvToEquityBridge.equityValueBeforeShares,
      first.value.modeledEvToEquityBridge.estimatedEquityValuePerShare,
      first.value.estimatedEquityValuePerShare,
    ];
    expect(allNumbers.every(Number.isFinite)).toBe(true);
  });

  it("accepts inclusive supported boundaries and negative operating NWC", () => {
    const input = dcfFixture();
    input.operatingNwcToRevenue = -0.1;
    input.assumptions = { revenueGrowth: -0.2, forecastOperatingMargin: 0, wacc: 0.06, terminalGrowth: 0.04 };
    const result = calculateDcf(input);
    expect(result.status).toBe("valid");
    if (result.status === "valid") expect(result.value.forecast[0].operatingNwc).toBeLessThan(0);

    const rateBoundary = dcfFixture();
    rateBoundary.assumptions = { revenueGrowth: 0.5, forecastOperatingMargin: 0.7, wacc: 0.05, terminalGrowth: 0.04 };
    expect(calculateDcf(rateBoundary).status).toBe("valid");
  });

  it("rejects WACC at or below terminal growth and a terminal rate outside its supported spread", () => {
    for (const [wacc, terminalGrowth] of [[0.08, 0.08], [0.07, 0.08], [0.05, 0.045]]) {
      const input = dcfFixture();
      input.assumptions.wacc = wacc;
      input.assumptions.terminalGrowth = terminalGrowth;
      expect(calculateDcf(input)).toMatchObject({ status: "invalid_input" });
    }
  });

  it("rejects missing, non-finite, negative, and out-of-range required inputs explicitly", () => {
    const invalidInputs = [
      (x: ReturnType<typeof dcfFixture>) => { x.baseRevenue = 0; },
      (x: ReturnType<typeof dcfFixture>) => { x.baseRevenue = Number.NaN; },
      (x: ReturnType<typeof dcfFixture>) => { x.baseEbit = 0; },
      (x: ReturnType<typeof dcfFixture>) => { x.effectiveTaxRate = 0.401; },
      (x: ReturnType<typeof dcfFixture>) => { x.daToRevenue = -0.01; },
      (x: ReturnType<typeof dcfFixture>) => { x.capexToRevenue = Number.POSITIVE_INFINITY; },
      (x: ReturnType<typeof dcfFixture>) => { x.assumptions.forecastOperatingMargin = 0.71; },
      (x: ReturnType<typeof dcfFixture>) => { x.assumptions.wacc = 0.049; },
      (x: ReturnType<typeof dcfFixture>) => { x.equityBridge.basicShares.value = 0; },
      (x: ReturnType<typeof dcfFixture>) => { x.equityBridge.debt.value = Number.NaN; },
    ];
    for (const mutate of invalidInputs) {
      const input = dcfFixture();
      mutate(input);
      expect(calculateDcf(input).status).toBe("invalid_input");
    }
  });

  it("rejects overflowed outputs instead of returning partial or infinite results", () => {
    const input = dcfFixture();
    input.baseRevenue = Number.MAX_VALUE;
    expect(calculateDcf(input)).toMatchObject({ status: "invalid_input" });
  });
});

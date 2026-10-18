import type { DcfInput } from "../../src/domain/types";

// Synthetic test-only input; no real-company values are represented here.
export const dcfFixture = (): DcfInput => ({
  baseRevenue: 1_000,
  baseEbit: 200,
  effectiveTaxRate: 0.25,
  daToRevenue: 0.08,
  capexToRevenue: 0.10,
  operatingNwcToRevenue: 0.05,
  equityBridge: {
    debt: { value: 20, unit: "USD_millions", asOf: "2025-12-30", sourceIds: ["test-only"] },
    preferredEquity: { value: 2, unit: "USD_millions", asOf: "2025-12-30", sourceIds: ["test-only"] },
    nonControllingInterest: { value: 3, unit: "USD_millions", asOf: "2025-12-30", sourceIds: ["test-only"] },
    cashAndCashEquivalents: { value: 15, unit: "USD_millions", asOf: "2025-12-30", sourceIds: ["test-only"] },
    currentShortTermMarketableSecurities: { value: 5, unit: "USD_millions", asOf: "2025-12-30", sourceIds: ["test-only"] },
    basicShares: { value: 10, unit: "shares_millions", asOf: "2025-12-30", sourceIds: ["test-only"] },
  },
  assumptions: {
    revenueGrowth: 0.10,
    forecastOperatingMargin: 0.22,
    wacc: 0.10,
    terminalGrowth: 0.03,
  },
});

/** Expected independently by expanding the formulas in spec.md by year. */
export const independentlyCalculatedDcf = {
  years: [
    { revenue: 1100, ebit: 242, taxes: 60.5, da: 88, capex: 110, nwc: 55, changeInNwc: 5, fcff: 154.5, discountFactor: 1 / 1.1, presentValueFcff: 140.45454545454544 },
    { revenue: 1210, ebit: 266.2, taxes: 66.55, da: 96.8, capex: 121, nwc: 60.5, changeInNwc: 5.5, fcff: 169.95, discountFactor: 1 / 1.1 ** 2, presentValueFcff: 140.45454545454544 },
    { revenue: 1331, ebit: 292.82, taxes: 73.205, da: 106.48, capex: 133.1, nwc: 66.55, changeInNwc: 6.05, fcff: 186.945, discountFactor: 1 / 1.1 ** 3, presentValueFcff: 140.45454545454544 },
    { revenue: 1464.1, ebit: 322.102, taxes: 80.5255, da: 117.128, capex: 146.41, nwc: 73.205, changeInNwc: 6.655, fcff: 205.6395, discountFactor: 1 / 1.1 ** 4, presentValueFcff: 140.45454545454544 },
    { revenue: 1610.51, ebit: 354.3122, taxes: 88.57805, da: 128.8408, capex: 161.051, nwc: 80.5255, changeInNwc: 7.3205, fcff: 226.20345, discountFactor: 1 / 1.1 ** 5, presentValueFcff: 140.45454545454544 },
  ],
  terminalValueAtYear5: 3328.422192857143,
  presentValueTerminalValue: 2066.688311688311,
  modeledEv: 2768.961038961038,
  terminalValueContribution: 0.7463768115942029,
  estimatedEquityValuePerShare: 276.3961038961038,
};

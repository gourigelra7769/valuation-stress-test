import { calculateDcf } from "../domain/dcf";
import type { DcfInput } from "../domain/types";

export const FICTIONAL_DEMO_WARNING = "FICTIONAL EDUCATIONAL EXAMPLE — NOT REAL MARKET DATA";

/** Isolated educational inputs. This is deliberately not a CompanyDataset. */
export const FICTIONAL_BASELINE_ASSUMPTIONS = {
  revenueGrowth: 0.08,
  forecastOperatingMargin: 0.2,
  wacc: 0.1,
  terminalGrowth: 0.025,
} as const;

const fictionalAmount = (value: number) => ({
  value,
  unit: "USD_millions" as const,
  asOf: "fictional-example",
  sourceIds: [],
  classification: "fictional_educational_input",
});

/** All amounts are invented, internally consistent USD millions/shares millions. */
export const FICTIONAL_DEMO_INPUT: DcfInput = {
  baseRevenue: 1_000,
  baseEbit: 200,
  effectiveTaxRate: 0.22,
  daToRevenue: 0.08,
  capexToRevenue: 0.07,
  operatingNwcToRevenue: 0.04,
  equityBridge: {
    debt: fictionalAmount(150),
    preferredEquity: fictionalAmount(0),
    nonControllingInterest: fictionalAmount(0),
    cashAndCashEquivalents: fictionalAmount(220),
    basicShares: {
      value: 25,
      unit: "shares_millions",
      asOf: "fictional-example",
      sourceIds: [],
      classification: "fictional_educational_input",
    },
  },
  assumptions: FICTIONAL_BASELINE_ASSUMPTIONS,
};

const baselineResult = calculateDcf(FICTIONAL_DEMO_INPUT);
if (baselineResult.status !== "valid") {
  throw new Error("The fixed fictional educational scenario must remain valid under the shared DCF engine.");
}

/** Target is a modeled teaching reference, never a quote or market-derived EV. */
export const FICTIONAL_DEMO_TARGET_EV = baselineResult.value.modeledEv;

export const FICTIONAL_INPUT_SUMMARY = [
  ["Base revenue", "$1,000m"],
  ["Base EBIT", "$200m"],
  ["Historical effective tax rate", "22%"],
  ["D&A / revenue", "8%"],
  ["CapEx / revenue", "7%"],
  ["Operating NWC / revenue", "4%"],
  ["Debt", "$150m"],
  ["Preferred equity", "$0m"],
  ["Non-controlling interests", "$0m"],
  ["Cash and equivalents", "$220m"],
  ["Basic shares", "25m"],
] as const;

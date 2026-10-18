import type { EquityBridgeInput, SourcedFact } from "../../src/domain/types";

// Synthetic values for isolated tests only. This fixture is not company data.
const fact = (value: number, unit: SourcedFact["unit"], asOf: string, inclusionNote?: string): SourcedFact => ({
  value, unit, asOf, sourceIds: ["test-source"], inclusionNote,
});

export const validBridgeInput = (): EquityBridgeInput => ({
  sharePrice: fact(100, "USD_per_share", "2025-12-31"),
  basicShares: fact(10, "shares_millions", "2025-12-30"),
  debt: fact(20, "USD_millions", "2025-12-30"),
  preferredEquity: fact(2, "USD_millions", "2025-12-30"),
  nonControllingInterest: fact(3, "USD_millions", "2025-12-30"),
  cashAndCashEquivalents: fact(15, "USD_millions", "2025-12-30"),
  currentShortTermMarketableSecurities: fact(5, "USD_millions", "2025-12-30"),
  marketableSecuritiesReview: {
    outcome: "separately_reported_current",
    sourceIds: ["test-source"],
    note: "Synthetic test evidence says securities are separate current assets.",
  },
  valuationDate: "2025-12-31",
  balanceSheetDate: "2025-12-30",
});

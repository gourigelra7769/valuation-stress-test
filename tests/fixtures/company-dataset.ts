import type { CompanyDataset, CompanyManifest, CompanyManifestEntry, SourcedFact } from "../../src/domain/types";

// Synthetic company snapshot. This fixture exists only in tests and is never referenced by the app manifest.
export function syntheticCompanyDataset(
  options: { id?: string; ticker?: string; sharePrice?: number; operatingNwcRatio?: number; historicalOperatingMargin?: number; forecastMarginDefault?: boolean } = {},
): CompanyDataset {
  const id = options.id ?? "synthetic-co";
  const fiscalYearEnd = "2025-06-30";
  const balanceSheetDate = "2025-09-30";
  const valuationDate = "2025-12-30";
  const sourceId = "synthetic-source";
  const fact = (value: number, unit: SourcedFact["unit"], asOf = fiscalYearEnd, inclusionNote?: string): SourcedFact => ({
    value, unit, asOf, sourceIds: [sourceId], inclusionNote,
  });
  const defaults: CompanyDataset["defaults"] = {
    revenueGrowth: { value: 0.05, unit: "decimal_rate", classification: "illustrative", rationale: "Test default only.", method: "Fixture constant.", sourceIds: [], editable: true },
    ...(options.forecastMarginDefault === false ? {} : {
      forecastOperatingMargin: { value: 0.2, unit: "decimal_rate", classification: "historical_derived", rationale: "Test historical ratio.", method: "EBIT divided by revenue.", sourceIds: [sourceId], editable: true as const },
    }),
    wacc: { value: 0.095, unit: "decimal_rate", classification: "illustrative", rationale: "Test default only.", method: "Illustrative fallback fixture.", sourceIds: [], editable: true },
    terminalGrowth: { value: 0.02, unit: "decimal_rate", classification: "illustrative", rationale: "Test default only.", method: "Fixture constant.", sourceIds: [], editable: true },
  };
  return {
    schemaVersion: 1,
    company: { id, legalName: `Synthetic ${id}`, ticker: options.ticker ?? "SYN", exchange: "Test Exchange", currency: "USD" },
    marketReference: {
      valuationDate,
      sharePrice: fact(options.sharePrice ?? 100, "USD_per_share", valuationDate),
      basicShares: fact(10, "shares_millions", balanceSheetDate),
    },
    baseYear: {
      fiscalYearEnd,
      revenue: fact(1_000, "USD_millions"),
      ebit: fact((options.historicalOperatingMargin ?? 0.2) * 1_000, "USD_millions"),
      pretaxIncome: fact(250, "USD_millions"),
      incomeTaxExpense: fact(50, "USD_millions"),
      da: fact(80, "USD_millions"),
      capex: fact(100, "USD_millions"),
      operatingCurrentAssets: fact((options.operatingNwcRatio ?? 0.05) * 1_000 + 150, "USD_millions"),
      operatingCurrentLiabilities: fact(150, "USD_millions"),
      interestExpense: fact(4, "USD_millions"),
      beginningInterestBearingDebt: fact(20, "USD_millions"),
      endingInterestBearingDebt: fact(20, "USD_millions"),
    },
    latestBalanceSheet: {
      reportingDate: balanceSheetDate,
      interestBearingDebt: fact(20, "USD_millions", balanceSheetDate),
      cashAndCashEquivalents: fact(15, "USD_millions", balanceSheetDate),
      preferredEquity: fact(0, "USD_millions", balanceSheetDate),
      nonControllingInterest: fact(0, "USD_millions", balanceSheetDate),
      marketableSecuritiesReview: { outcome: "not_separately_reported", sourceIds: [sourceId], note: "Synthetic source says no separate short-term amount." },
    },
    waccEvidence: null,
    defaults,
    sources: [{ id: sourceId, publisher: "Synthetic test publisher", title: "Synthetic test-only source", url: "https://example.test/source", accessedAt: valuationDate, locator: "Test fixture" }],
  };
}

export function syntheticVerifiedEntry(id = "synthetic-co"): CompanyManifestEntry {
  return {
    companyId: id,
    datasetPath: `${id}.json`,
    eligibility: "verified",
    audit: {
      completedAt: "2025-12-31",
      auditor: "Synthetic test auditor",
      checklistVersion: "test-only",
      checkedFieldIds: [
        "marketReference.sharePrice", "marketReference.basicShares",
        "baseYear.revenue", "baseYear.ebit", "baseYear.pretaxIncome", "baseYear.incomeTaxExpense",
        "baseYear.da", "baseYear.capex", "baseYear.operatingCurrentAssets",
        "baseYear.operatingCurrentLiabilities", "baseYear.interestExpense",
        "baseYear.beginningInterestBearingDebt", "baseYear.endingInterestBearingDebt",
        "latestBalanceSheet.interestBearingDebt", "latestBalanceSheet.cashAndCashEquivalents",
        "latestBalanceSheet.preferredEquity", "latestBalanceSheet.nonControllingInterest",
      ],
      sourceDateConsistencyPassed: true,
      inputValidationPassed: true,
      evidenceNote: "Synthetic test audit; not evidence for a real company.",
    },
  };
}

export function syntheticManifest(entries: CompanyManifestEntry[]): CompanyManifest {
  return { schemaVersion: 1, companies: entries };
}

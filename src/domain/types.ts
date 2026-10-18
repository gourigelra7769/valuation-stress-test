/** Source attribution attached to a reported financial fact. */
export type SourceRef = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  publishedAt?: string;
  accessedAt: string;
  locator?: string;
};

export type SourcedFact = {
  value: number;
  reportedValue?: number;
  normalizationNote?: string;
  unit: "USD_millions" | "USD_per_share" | "shares_millions" | "ratio";
  period?: { start: string; end: string; kind: "FY" | "point_in_time" };
  asOf: string;
  sourceIds: string[];
  classification?: string;
  inclusionNote?: string;
};

export type ModelAssumptions = {
  revenueGrowth: number;
  forecastOperatingMargin: number;
  wacc: number;
  terminalGrowth: number;
};

/** Values share a currency and scale (normally USD millions, shares millions). */
export type EquityBridgeInput = {
  sharePrice: SourcedFact;
  basicShares: SourcedFact;
  debt: SourcedFact;
  preferredEquity: SourcedFact;
  nonControllingInterest: SourcedFact;
  cashAndCashEquivalents: SourcedFact;
  /** Omit only when the explicit review outcome is not_separately_reported. */
  currentShortTermMarketableSecurities?: SourcedFact;
  marketableSecuritiesReview: {
    outcome: "separately_reported_current" | "not_separately_reported" | "cannot_classify";
    sourceIds: string[];
    note: string;
  };
  valuationDate: string;
  balanceSheetDate: string;
};

export type AssumptionDefault = {
  value: number;
  unit: "decimal_rate";
  classification: "historical_derived" | "estimated" | "illustrative";
  rationale: string;
  method: string;
  sourceIds: string[];
  editable: true;
};

export type CompanyDataset = {
  schemaVersion: 1;
  company: { id: string; legalName: string; ticker: string; exchange: string; currency: "USD" };
  marketReference: { valuationDate: string; sharePrice: SourcedFact; basicShares: SourcedFact };
  baseYear: {
    fiscalYearEnd: string;
    revenue: SourcedFact;
    ebit: SourcedFact;
    pretaxIncome: SourcedFact;
    incomeTaxExpense: SourcedFact;
    da: SourcedFact;
    capex: SourcedFact;
    operatingCurrentAssets: SourcedFact;
    operatingCurrentLiabilities: SourcedFact;
    interestExpense: SourcedFact;
    beginningInterestBearingDebt: SourcedFact;
    endingInterestBearingDebt: SourcedFact;
  };
  latestBalanceSheet: {
    reportingDate: string;
    interestBearingDebt: SourcedFact;
    cashAndCashEquivalents: SourcedFact;
    currentShortTermMarketableSecurities?: SourcedFact;
    marketableSecuritiesReview: {
      outcome: "separately_reported_current" | "not_separately_reported" | "cannot_classify";
      sourceIds: string[];
      note: string;
    };
    preferredEquity: SourcedFact;
    nonControllingInterest: SourcedFact;
  };
  waccEvidence: {
    riskFreeRate: SourcedFact;
    unleveredIndustryBeta: SourcedFact;
    impliedEquityRiskPremium: SourcedFact;
    betaSourceIndustry: string;
  } | null;
  defaults: {
    revenueGrowth: AssumptionDefault;
    forecastOperatingMargin?: AssumptionDefault;
    wacc: AssumptionDefault;
    terminalGrowth: AssumptionDefault;
  };
  sources: SourceRef[];
};

export type CompanyManifestEntry = {
  companyId: string;
  datasetPath: string;
  eligibility: "candidate" | "verified" | "unavailable";
  audit?: {
    completedAt: string;
    auditor: string;
    checklistVersion: string;
    checkedFieldIds: string[];
    sourceDateConsistencyPassed: boolean;
    inputValidationPassed: boolean;
    evidenceNote: string;
  };
  unavailableReason?: string;
};

export type CompanyManifest = { schemaVersion: 1; companies: CompanyManifestEntry[] };

export type DcfInput = {
  baseRevenue: number;
  baseEbit: number;
  effectiveTaxRate: number;
  daToRevenue: number;
  capexToRevenue: number;
  operatingNwcToRevenue: number;
  equityBridge: Pick<EquityBridgeInput,
    "debt" | "preferredEquity" | "nonControllingInterest" |
    "cashAndCashEquivalents" | "currentShortTermMarketableSecurities" | "basicShares">;
  assumptions: ModelAssumptions;
  targetEv?: number;
};

export type ForecastYear = {
  year: 1 | 2 | 3 | 4 | 5;
  revenue: number;
  ebit: number;
  taxes: number;
  da: number;
  capex: number;
  operatingNwc: number;
  changeInNwc: number;
  fcff: number;
  discountFactor: number;
  presentValueFcff: number;
};

export type DcfOutput = {
  forecast: ForecastYear[];
  terminalValueAtYear5: number;
  presentValueTerminalValue: number;
  modeledEv: number;
  terminalValueContribution: number;
  estimatedEquityValuePerShare: number;
};

export type SolveResult =
  | { status: "solved"; growth: number; modeledEv: number; evError: number; iterations: number }
  | { status: "no_root"; minGrowth: number; maxGrowth: number; assumptionsSummary: string }
  | { status: "invalid_input"; issues: ValidationIssue[] }
  | { status: "solver_failure"; reason: string };

export type ValidationIssue = { field: string; code: string; message: string };

export type ReferenceEvResult = {
  marketCap: number;
  referenceEv: number;
  valuationDate: string;
  balanceSheetDate: string;
  adjustments: {
    debt: number;
    preferredEquity: number;
    nonControllingInterest: number;
    cashAndCashEquivalents: number;
    eligibleCurrentShortTermMarketableSecurities: number;
  };
};

export type EquityValuePerShareResult = {
  estimatedEquityValuePerShare: number;
  valuationDate: string;
  balanceSheetDate: string;
  basicShares: number;
};

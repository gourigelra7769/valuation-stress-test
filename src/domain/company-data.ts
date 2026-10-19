import { calculateReferenceEv } from "./reference-ev";
import { isMarketableSecuritiesOutcome } from "./validate";
import type {
  CompanyDataset,
  CompanyManifest,
  CompanyManifestEntry,
  DcfInput,
  ReferenceEvResult,
  SourcedFact,
  SourceRef,
  ValidationIssue,
} from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const USD = "USD_millions";
const REQUIRED_FACTS = [
  "marketReference.sharePrice", "marketReference.basicShares",
  "baseYear.revenue", "baseYear.ebit", "baseYear.pretaxIncome", "baseYear.incomeTaxExpense",
  "baseYear.da", "baseYear.capex", "baseYear.operatingCurrentAssets",
  "baseYear.operatingCurrentLiabilities", "baseYear.interestExpense",
  "baseYear.beginningInterestBearingDebt", "baseYear.endingInterestBearingDebt",
  "latestBalanceSheet.interestBearingDebt", "latestBalanceSheet.cashAndCashEquivalents",
  "latestBalanceSheet.preferredEquity", "latestBalanceSheet.nonControllingInterest",
] as const;

export type VerifiedCompany = {
  dataset: CompanyDataset;
  reference: ReferenceEvResult;
  modelInput: DcfInput;
  historicalOperatingMargin: number;
  effectiveTaxRate: number;
};

export type CompanyLoadResult = {
  companies: VerifiedCompany[];
  rejected: Array<{ companyId: string; issues: ValidationIssue[] }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function issue(field: string, code: string, message: string): ValidationIssue {
  return { field, code, message };
}

function factAt(dataset: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => isRecord(value) ? value[key] : undefined, dataset);
}

function validateFact(
  value: unknown,
  field: string,
  expectedUnit: string,
  sourceIds: Set<string>,
  issues: ValidationIssue[],
): value is SourcedFact {
  if (!isRecord(value)) {
    issues.push(issue(field, "missing_input", `${field} is required.`));
    return false;
  }
  if (typeof value.value !== "number" || !Number.isFinite(value.value)) issues.push(issue(field, "non_finite", `${field} must be finite.`));
  if (value.unit !== expectedUnit) issues.push(issue(field, "invalid_unit", `${field} must use ${expectedUnit}.`));
  if (!validDate(value.asOf)) issues.push(issue(field, "invalid_date", `${field} needs a valid as-of date.`));
  if (!Array.isArray(value.sourceIds) || value.sourceIds.length === 0 ||
      value.sourceIds.some((id) => typeof id !== "string" || !sourceIds.has(id))) {
    issues.push(issue(field, "missing_source", `${field} must resolve to at least one valid source.`));
  }
  return true;
}

function validateSources(value: unknown, issues: ValidationIssue[]): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(value) || value.length === 0) {
    issues.push(issue("sources", "missing_sources", "The company dataset needs source references."));
    return ids;
  }
  for (const [index, source] of value.entries()) {
    const field = `sources.${index}`;
    if (!isRecord(source)) {
      issues.push(issue(field, "invalid_source", "Source reference must be an object."));
      continue;
    }
    const { id, publisher, title, url, accessedAt } = source;
    let valid = true;
    if (typeof id !== "string" || !id.trim() || ids.has(id)) valid = false;
    if (typeof publisher !== "string" || !publisher.trim() || typeof title !== "string" || !title.trim()) valid = false;
    if (typeof url !== "string") valid = false;
    else {
      try {
        if (!["http:", "https:"].includes(new URL(url).protocol)) valid = false;
      } catch { valid = false; }
    }
    if (!validDate(accessedAt)) valid = false;
    if (!valid) issues.push(issue(field, "invalid_source", "Source needs a unique id, publisher, title, URL, and access date."));
    else ids.add(id as string);
  }
  return ids;
}

function validateAudit(entry: CompanyManifestEntry, issues: ValidationIssue[]): void {
  const audit = entry.audit;
  if (!audit) {
    issues.push(issue("audit", "missing_audit", "Verified eligibility requires a completed audit record."));
    return;
  }
  if (!validDate(audit.completedAt) || typeof audit.auditor !== "string" || !audit.auditor.trim() ||
      typeof audit.checklistVersion !== "string" || !audit.checklistVersion.trim() ||
      typeof audit.evidenceNote !== "string" || !audit.evidenceNote.trim()) {
    issues.push(issue("audit", "incomplete_audit", "Audit date, auditor, checklist version, and evidence note are required."));
  }
  if (audit.sourceDateConsistencyPassed !== true || audit.inputValidationPassed !== true) {
    issues.push(issue("audit", "audit_checks_failed", "Source-date consistency and input-validation audit checks must pass."));
  }
  const checked = new Set(Array.isArray(audit.checkedFieldIds) ? audit.checkedFieldIds : []);
  for (const field of REQUIRED_FACTS) {
    if (!checked.has(field)) issues.push(issue("audit.checkedFieldIds", "unchecked_required_field", `Audit record does not include ${field}.`));
  }
  if (entry.companyId !== entry.companyId.trim() || !entry.datasetPath.trim()) {
    issues.push(issue("manifest", "invalid_manifest_entry", "Manifest identifiers and dataset paths must be non-empty and normalized."));
  }
}

function validateDataset(datasetValue: unknown): { dataset?: CompanyDataset; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!isRecord(datasetValue)) return { issues: [issue("dataset", "invalid_dataset", "Dataset must be an object.")] };
  const dataset = datasetValue as unknown as CompanyDataset;
  if (dataset.schemaVersion !== 1) issues.push(issue("schemaVersion", "unsupported_schema", "Dataset schema version must be 1."));
  if (!isRecord(dataset.company) || !nonEmptyString(dataset.company.id) || !nonEmptyString(dataset.company.legalName) ||
      !nonEmptyString(dataset.company.ticker) || !nonEmptyString(dataset.company.exchange) || dataset.company.currency !== "USD") {
    issues.push(issue("company", "invalid_company", "Company identity and USD currency are required."));
  }
  const sourceIds = validateSources(dataset.sources, issues);
  const raw = datasetValue as Record<string, unknown>;
  const cashDate = isRecord(raw.latestBalanceSheet) ? raw.latestBalanceSheet.reportingDate : undefined;
  const valuationDate = isRecord(raw.marketReference) ? raw.marketReference.valuationDate : undefined;
  const fiscalYearEnd = isRecord(raw.baseYear) ? raw.baseYear.fiscalYearEnd : undefined;
  if (!validDate(valuationDate)) issues.push(issue("marketReference.valuationDate", "invalid_date", "Market-price valuation date is required."));
  if (!validDate(cashDate)) issues.push(issue("latestBalanceSheet.reportingDate", "invalid_date", "Latest balance-sheet date is required."));
  if (!validDate(fiscalYearEnd)) issues.push(issue("baseYear.fiscalYearEnd", "invalid_date", "Base fiscal-year end is required."));

  for (const field of REQUIRED_FACTS) {
    const unit = field.endsWith("sharePrice") ? "USD_per_share" : field.endsWith("basicShares") ? "shares_millions" : USD;
    validateFact(factAt(raw, field), field, unit, sourceIds, issues);
  }
  const baseFactNames = ["revenue", "ebit", "pretaxIncome", "incomeTaxExpense", "da", "capex",
    "operatingCurrentAssets", "operatingCurrentLiabilities", "interestExpense", "beginningInterestBearingDebt", "endingInterestBearingDebt"] as const;
  for (const name of baseFactNames) {
    const fact = dataset.baseYear?.[name];
    if (fact && validDate(fiscalYearEnd) && fact.asOf !== fiscalYearEnd) {
      issues.push(issue(`baseYear.${name}.asOf`, "date_mismatch", "Base-year fact must match the fiscal-year end date."));
    }
  }
  if (dataset.marketReference?.sharePrice && validDate(valuationDate) && dataset.marketReference.sharePrice.asOf !== valuationDate) {
    issues.push(issue("marketReference.sharePrice.asOf", "date_mismatch", "Share price date must match the market-price valuation date."));
  }
  if (dataset.marketReference?.basicShares && validDate(valuationDate) && dataset.marketReference.basicShares.asOf > valuationDate) {
    issues.push(issue("marketReference.basicShares.asOf", "date_after_valuation", "Basic-share count must be reported on or before valuation date."));
  }
  for (const name of ["interestBearingDebt", "cashAndCashEquivalents", "preferredEquity", "nonControllingInterest"] as const) {
    const fact = dataset.latestBalanceSheet?.[name];
    if (fact && validDate(cashDate) && fact.asOf !== cashDate) issues.push(issue(`latestBalanceSheet.${name}.asOf`, "date_mismatch", "Balance-sheet fact must match its reporting date."));
  }
  if (validDate(cashDate) && validDate(valuationDate) && cashDate > valuationDate) {
    issues.push(issue("latestBalanceSheet.reportingDate", "date_after_valuation", "Balance-sheet data must not follow the market-price valuation date."));
  }

  const review = dataset.latestBalanceSheet?.marketableSecuritiesReview;
  const reviewIsRecord = isRecord(review);
  if (!reviewIsRecord || !isMarketableSecuritiesOutcome(review.outcome) || review.outcome === "cannot_classify" ||
      !nonEmptyString(review.note) || !Array.isArray(review.sourceIds) || !review.sourceIds.length ||
      review.sourceIds.some((id) => typeof id !== "string" || !sourceIds.has(id))) {
    issues.push(issue("latestBalanceSheet.marketableSecuritiesReview", "invalid_security_review", "Marketable-security classification needs a resolved, source-backed review."));
  }

  if (dataset.latestBalanceSheet?.currentShortTermMarketableSecurities) {
    validateFact(dataset.latestBalanceSheet.currentShortTermMarketableSecurities,
      "latestBalanceSheet.currentShortTermMarketableSecurities", USD, sourceIds, issues);
    if (!reviewIsRecord || review.outcome !== "separately_reported_current") {
      issues.push(issue("latestBalanceSheet.currentShortTermMarketableSecurities", "classification_mismatch", "A securities amount requires separately_reported_current classification."));
    }
    if (dataset.latestBalanceSheet.currentShortTermMarketableSecurities.inclusionNote?.toLowerCase().includes("included in cash")) {
      issues.push(issue("latestBalanceSheet.currentShortTermMarketableSecurities", "cash_overlap", "Securities already included in cash equivalents cannot be counted again."));
    }
    if (validDate(cashDate) && dataset.latestBalanceSheet.currentShortTermMarketableSecurities.asOf !== cashDate) {
      issues.push(issue("latestBalanceSheet.currentShortTermMarketableSecurities.asOf", "date_mismatch", "Marketable securities must match the balance-sheet reporting date."));
    }
  }
  if (reviewIsRecord && review.outcome === "separately_reported_current" && !dataset.latestBalanceSheet.currentShortTermMarketableSecurities) {
    issues.push(issue("latestBalanceSheet.currentShortTermMarketableSecurities", "missing_input", "Separately reported current securities require a sourced amount."));
  }
  if (reviewIsRecord && review.outcome === "not_separately_reported" && dataset.latestBalanceSheet.currentShortTermMarketableSecurities) {
    issues.push(issue("latestBalanceSheet.currentShortTermMarketableSecurities", "classification_mismatch", "No amount is expected when no separate security is reported."));
  }

  const defaults = dataset.defaults;
  for (const key of ["revenueGrowth", "wacc", "terminalGrowth"] as const) {
    const value = defaults?.[key];
    if (!value || !Number.isFinite(value.value) || value.unit !== "decimal_rate" ||
        !["historical_derived", "estimated", "illustrative"].includes(value.classification) ||
        !nonEmptyString(value.rationale) || !nonEmptyString(value.method) || value.editable !== true ||
        !Array.isArray(value.sourceIds) || value.sourceIds.some((id) => !sourceIds.has(id))) {
      issues.push(issue(`defaults.${key}`, "invalid_default", `${key} needs a finite, editable, documented default.`));
    }
  }
  const growth = defaults?.revenueGrowth?.value;
  const margin = defaults?.forecastOperatingMargin?.value;
  const wacc = defaults?.wacc?.value;
  const terminalGrowth = defaults?.terminalGrowth?.value;
  // Out-of-range documented defaults stay visible and are blocked by model validation;
  // the loader must never clamp them or silently replace the evidence.
  for (const key of ["revenueGrowth", "forecastOperatingMargin", "wacc", "terminalGrowth"] as const) {
    const value = defaults?.[key];
    if (value && Array.isArray(value.sourceIds) && value.sourceIds.some((id) => !sourceIds.has(id))) {
      issues.push(issue(`defaults.${key}.sourceIds`, "missing_source", "Default source ids must resolve to the dataset sources."));
    }
  }

  if (dataset.waccEvidence) {
    for (const key of ["riskFreeRate", "unleveredIndustryBeta", "impliedEquityRiskPremium"] as const) {
      validateFact(dataset.waccEvidence[key], `waccEvidence.${key}`, "ratio", sourceIds, issues);
    }
    if (!nonEmptyString(dataset.waccEvidence.betaSourceIndustry)) issues.push(issue("waccEvidence.betaSourceIndustry", "missing_input", "Beta source industry is required."));
    if (dataset.waccEvidence.riskFreeRate.asOf !== valuationDate) {
      issues.push(issue("waccEvidence.riskFreeRate.asOf", "date_mismatch", "Risk-free rate must match the market-price valuation date."));
    }
    for (const key of ["unleveredIndustryBeta", "impliedEquityRiskPremium"] as const) {
      if (validDate(valuationDate) && dataset.waccEvidence[key].asOf > valuationDate) {
        issues.push(issue(`waccEvidence.${key}.asOf`, "date_after_valuation", "WACC evidence cannot be dated after the market-price valuation date."));
      }
    }
  } else if (dataset.defaults?.wacc?.classification !== "illustrative") {
    issues.push(issue("waccEvidence", "missing_wacc_evidence", "WACC evidence is absent; its default must be explicitly illustrative."));
  }

  if (dataset.baseYear?.revenue?.value > 0 && dataset.baseYear?.pretaxIncome?.value > 0) {
    const effectiveTaxRate = dataset.baseYear.incomeTaxExpense.value / dataset.baseYear.pretaxIncome.value;
    const historicalOperatingMargin = dataset.baseYear.ebit.value / dataset.baseYear.revenue.value;
    if (!Number.isFinite(effectiveTaxRate) || effectiveTaxRate < 0 || effectiveTaxRate > 0.4) {
      issues.push(issue("baseYear.effectiveTaxRate", "invalid_tax_rate", "Historical tax rate must be 0%-40% with positive pre-tax income."));
    }
    if (defaults?.forecastOperatingMargin && Math.abs(defaults.forecastOperatingMargin.value - historicalOperatingMargin) > 1e-10) {
      issues.push(issue("defaults.forecastOperatingMargin", "margin_default_mismatch", "Forecast-margin default must match the historical EBIT/revenue baseline when supplied."));
    }
    const baselineInRange = historicalOperatingMargin >= 0 && historicalOperatingMargin <= 0.7;
    if (baselineInRange && !defaults?.forecastOperatingMargin) {
      issues.push(issue("defaults.forecastOperatingMargin", "missing_default", "An in-range historical margin must be loaded as the documented forecast-margin default."));
    }
    if (!baselineInRange && defaults?.forecastOperatingMargin) {
      issues.push(issue("defaults.forecastOperatingMargin", "fabricated_default", "An out-of-range historical margin cannot be used as the forecast default."));
    }
    if (dataset.baseYear.ebit.value <= 0) issues.push(issue("baseYear.ebit", "non_positive_ebit", "Base EBIT must be positive."));
    if (dataset.baseYear.da && dataset.baseYear.da.value < 0) {
      issues.push(issue("baseYear.da", "negative_amount", "Normalized D&A must not be negative."));
    }
    if (dataset.baseYear.capex && dataset.baseYear.capex.value < 0) {
      issues.push(issue("baseYear.capex", "negative_amount", "Normalized CapEx spend must not be negative."));
    }
  } else {
    issues.push(issue("baseYear", "invalid_base_year", "Base revenue and pre-tax income must be positive."));
  }

  return issues.length ? { issues } : { dataset, issues };
}

export function loadSelectableCompanies(
  manifest: CompanyManifest,
  datasetsByPath: Record<string, unknown>,
): CompanyLoadResult {
  const companies: VerifiedCompany[] = [];
  const rejected: CompanyLoadResult["rejected"] = [];
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.companies)) {
    return { companies, rejected: [{ companyId: "manifest", issues: [issue("manifest", "invalid_manifest", "Company manifest schema is invalid.")] }] };
  }
  for (const entry of manifest.companies) {
    if (!entry || entry.eligibility !== "verified") continue;
    const issues: ValidationIssue[] = [];
    validateAudit(entry, issues);
    const datasetValue = nonEmptyString(entry.datasetPath) ? datasetsByPath[entry.datasetPath] : undefined;
    if (datasetValue === undefined) issues.push(issue("datasetPath", "missing_dataset", "Verified manifest entry has no local dataset."));
    const validation = validateDataset(datasetValue);
    issues.push(...validation.issues);
    if (validation.dataset && validation.dataset.company.id !== entry.companyId) {
      issues.push(issue("company.id", "company_id_mismatch", "Dataset company id does not match its manifest entry."));
    }
    if (issues.length || !validation.dataset) {
      rejected.push({ companyId: entry.companyId, issues });
      continue;
    }

    const dataset = validation.dataset;
    const revenue = dataset.baseYear.revenue.value;
    const effectiveTaxRate = dataset.baseYear.incomeTaxExpense.value / dataset.baseYear.pretaxIncome.value;
    const historicalOperatingMargin = dataset.baseYear.ebit.value / revenue;
    const modelInput: DcfInput = {
      baseRevenue: revenue,
      baseEbit: dataset.baseYear.ebit.value,
      effectiveTaxRate,
      daToRevenue: dataset.baseYear.da.value / revenue,
      capexToRevenue: dataset.baseYear.capex.value / revenue,
      operatingNwcToRevenue: (dataset.baseYear.operatingCurrentAssets.value - dataset.baseYear.operatingCurrentLiabilities.value) / revenue,
      equityBridge: {
        debt: dataset.latestBalanceSheet.interestBearingDebt,
        preferredEquity: dataset.latestBalanceSheet.preferredEquity,
        nonControllingInterest: dataset.latestBalanceSheet.nonControllingInterest,
        cashAndCashEquivalents: dataset.latestBalanceSheet.cashAndCashEquivalents,
        currentShortTermMarketableSecurities: dataset.latestBalanceSheet.currentShortTermMarketableSecurities,
        marketableSecuritiesReview: dataset.latestBalanceSheet.marketableSecuritiesReview,
        basicShares: dataset.marketReference.basicShares,
      },
      assumptions: {
        revenueGrowth: dataset.defaults.revenueGrowth.value,
        forecastOperatingMargin: dataset.defaults.forecastOperatingMargin?.value ?? historicalOperatingMargin,
        wacc: dataset.defaults.wacc.value,
        terminalGrowth: dataset.defaults.terminalGrowth.value,
      },
    };
    const referenceResult = calculateReferenceEv({
      sharePrice: dataset.marketReference.sharePrice,
      basicShares: dataset.marketReference.basicShares,
      debt: dataset.latestBalanceSheet.interestBearingDebt,
      preferredEquity: dataset.latestBalanceSheet.preferredEquity,
      nonControllingInterest: dataset.latestBalanceSheet.nonControllingInterest,
      cashAndCashEquivalents: dataset.latestBalanceSheet.cashAndCashEquivalents,
      currentShortTermMarketableSecurities: dataset.latestBalanceSheet.currentShortTermMarketableSecurities,
      marketableSecuritiesReview: dataset.latestBalanceSheet.marketableSecuritiesReview,
      valuationDate: dataset.marketReference.valuationDate,
      balanceSheetDate: dataset.latestBalanceSheet.reportingDate,
    });
    if (referenceResult.status !== "valid") {
      rejected.push({ companyId: entry.companyId, issues: referenceResult.issues });
      continue;
    }
    companies.push({ dataset, reference: referenceResult.value, modelInput, historicalOperatingMargin, effectiveTaxRate });
  }
  return { companies, rejected };
}

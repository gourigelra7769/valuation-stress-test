import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { loadSelectableCompanies } from "../../src/domain/company-data";
import type { CompanyManifest } from "../../src/domain/types";
import { syntheticCompanyDataset, syntheticManifest, syntheticVerifiedEntry } from "../fixtures/company-dataset";

const productionManifest = JSON.parse(
  readFileSync(new URL("../../data/companies/index.json", import.meta.url), "utf8"),
) as CompanyManifest;

describe("company audit eligibility gate", () => {
  it("excludes candidates and exposes only verified, complete local datasets", () => {
    const candidate = { ...syntheticVerifiedEntry("candidate-co"), eligibility: "candidate" as const, audit: undefined };
    const verified = syntheticVerifiedEntry();
    const loaded = loadSelectableCompanies(syntheticManifest([candidate, verified]), {
      "synthetic-co.json": syntheticCompanyDataset(),
    });
    expect(loaded.companies.map((company) => company.dataset.company.id)).toEqual(["synthetic-co"]);
    expect(loaded.companies[0].reference.referenceEv).toBe(1005);
    expect(loaded.rejected).toEqual([]);
  });

  it("rejects verified entries with incomplete audits, missing source links, or date mismatches", () => {
    const entry = syntheticVerifiedEntry();
    entry.audit!.sourceDateConsistencyPassed = false;
    const dataset = syntheticCompanyDataset();
    dataset.baseYear.revenue.sourceIds = ["missing-source"];
    dataset.marketReference.sharePrice.asOf = "2025-12-29";
    const loaded = loadSelectableCompanies(syntheticManifest([entry]), { "synthetic-co.json": dataset });
    expect(loaded.companies).toHaveLength(0);
    expect(loaded.rejected[0].issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      "audit_checks_failed", "missing_source", "date_mismatch",
    ]));
  });

  it("keeps Microsoft unavailable while source audit evidence is incomplete", () => {
    const microsoft = productionManifest.companies.find((entry) => entry.companyId === "microsoft");
    expect(microsoft?.eligibility).toBe("candidate");
    expect(microsoft?.unavailableReason).toMatch(/pure D&A fact/i);
    expect(microsoft?.unavailableReason).toMatch(/preferred equity/i);
    expect(microsoft?.unavailableReason).toMatch(/non-controlling interests/i);

    // Even an unrelated synthetic fixture cannot turn a candidate into a selectable company.
    const loaded = loadSelectableCompanies(productionManifest, {
      "microsoft.json": syntheticCompanyDataset({ id: "microsoft", ticker: "MSFT" }),
    });
    expect(loaded.companies).toEqual([]);
    expect(loaded.rejected).toEqual([]);
  });

  it("rejects a promoted dataset with missing required facts and incomplete checked fields", () => {
    const entry = syntheticVerifiedEntry();
    entry.audit!.checkedFieldIds = entry.audit!.checkedFieldIds.filter(
      (field) => field !== "latestBalanceSheet.nonControllingInterest",
    );
    const dataset = syntheticCompanyDataset();
    delete (dataset.baseYear as Partial<typeof dataset.baseYear>).da;
    const loaded = loadSelectableCompanies(syntheticManifest([entry]), { "synthetic-co.json": dataset });
    expect(loaded.companies).toHaveLength(0);
    expect(loaded.rejected[0].issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      "missing_input", "unchecked_required_field",
    ]));
  });

  it("rejects securities with unresolved classification or cash overlap", () => {
    const dataset = syntheticCompanyDataset();
    dataset.latestBalanceSheet.currentShortTermMarketableSecurities = {
      value: 10,
      unit: "USD_millions",
      asOf: dataset.latestBalanceSheet.reportingDate,
      sourceIds: ["synthetic-source"],
      inclusionNote: "Already included in cash equivalents",
    };
    dataset.latestBalanceSheet.marketableSecuritiesReview.outcome = "separately_reported_current";
    const loaded = loadSelectableCompanies(syntheticManifest([syntheticVerifiedEntry()]), { "synthetic-co.json": dataset });
    expect(loaded.companies).toHaveLength(0);
    expect(loaded.rejected[0].issues.map((item) => item.code)).toContain("cash_overlap");
  });

  it("rejects an unsupported marketable-security review outcome at the dataset boundary", () => {
    const dataset = syntheticCompanyDataset();
    (dataset.latestBalanceSheet.marketableSecuritiesReview as { outcome: string }).outcome = "unknown";
    const loaded = loadSelectableCompanies(syntheticManifest([syntheticVerifiedEntry()]), { "synthetic-co.json": dataset });
    expect(loaded.companies).toHaveLength(0);
    expect(loaded.rejected[0].issues.map((item) => item.code)).toContain("invalid_security_review");
  });

  it("rejects a missing marketable-security review without throwing when an amount is present", () => {
    const dataset = syntheticCompanyDataset();
    dataset.latestBalanceSheet.currentShortTermMarketableSecurities = {
      value: 10,
      unit: "USD_millions",
      asOf: dataset.latestBalanceSheet.reportingDate,
      sourceIds: ["synthetic-source"],
    };
    delete (dataset.latestBalanceSheet as Partial<typeof dataset.latestBalanceSheet>).marketableSecuritiesReview;

    expect(() => loadSelectableCompanies(syntheticManifest([syntheticVerifiedEntry()]), {
      "synthetic-co.json": dataset,
    })).not.toThrow();
    const loaded = loadSelectableCompanies(syntheticManifest([syntheticVerifiedEntry()]), {
      "synthetic-co.json": dataset,
    });
    expect(loaded.companies).toHaveLength(0);
    expect(loaded.rejected[0].issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      "invalid_security_review", "classification_mismatch",
    ]));
  });

  it("rejects malformed marketable-security review values without throwing when an amount is present", () => {
    const dataset = syntheticCompanyDataset();
    dataset.latestBalanceSheet.currentShortTermMarketableSecurities = {
      value: 10,
      unit: "USD_millions",
      asOf: dataset.latestBalanceSheet.reportingDate,
      sourceIds: ["synthetic-source"],
    };
    (dataset.latestBalanceSheet as unknown as { marketableSecuritiesReview: unknown }).marketableSecuritiesReview = null;

    expect(() => loadSelectableCompanies(syntheticManifest([syntheticVerifiedEntry()]), {
      "synthetic-co.json": dataset,
    })).not.toThrow();
    const loaded = loadSelectableCompanies(syntheticManifest([syntheticVerifiedEntry()]), {
      "synthetic-co.json": dataset,
    });
    expect(loaded.companies).toHaveLength(0);
    expect(loaded.rejected[0].issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      "invalid_security_review", "classification_mismatch",
    ]));
  });
});

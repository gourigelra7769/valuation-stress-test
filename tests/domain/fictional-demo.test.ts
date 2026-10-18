import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculateDcf } from "../../src/domain/dcf";
import { solveGrowthForTarget } from "../../src/domain/solver";
import type { CompanyManifest } from "../../src/domain/types";
import { loadSelectableCompanies } from "../../src/domain/company-data";
import {
  FICTIONAL_BASELINE_ASSUMPTIONS,
  FICTIONAL_DEMO_INPUT,
  FICTIONAL_DEMO_TARGET_EV,
  FICTIONAL_DEMO_WARNING,
} from "../../src/demo/fictional-scenario";
import { syntheticManifest, syntheticVerifiedEntry } from "../fixtures/company-dataset";

const productionManifest = JSON.parse(
  readFileSync(new URL("../../data/companies/index.json", import.meta.url), "utf8"),
) as CompanyManifest;

describe("isolated fictional educational demo", () => {
  it("is not a company dataset and cannot pass the unchanged verified-company gate", () => {
    expect("company" in FICTIONAL_DEMO_INPUT).toBe(false);
    expect("sources" in FICTIONAL_DEMO_INPUT).toBe(false);
    expect(FICTIONAL_DEMO_INPUT.equityBridge.debt.sourceIds).toEqual([]);
    expect(productionManifest.companies.some((entry) => entry.companyId.includes("demo"))).toBe(false);

    const entry = syntheticVerifiedEntry("fictional-demo");
    const gated = loadSelectableCompanies(syntheticManifest([entry]), {
      [entry.datasetPath]: FICTIONAL_DEMO_INPUT,
    });
    expect(gated.companies).toEqual([]);
    expect(gated.rejected[0].issues.length).toBeGreaterThan(0);
    expect(loadSelectableCompanies(productionManifest, {}).companies).toEqual([]);
  });

  it("derives its fixed teaching target and reverse growth with the shared DCF engine and solver", () => {
    const expected = calculateDcf({
      ...FICTIONAL_DEMO_INPUT,
      assumptions: FICTIONAL_BASELINE_ASSUMPTIONS,
    });
    expect(expected.status).toBe("valid");
    if (expected.status !== "valid") return;
    expect(FICTIONAL_DEMO_TARGET_EV).toBe(expected.value.modeledEv);

    const solved = solveGrowthForTarget({
      ...FICTIONAL_DEMO_INPUT,
      assumptions: {
        forecastOperatingMargin: FICTIONAL_BASELINE_ASSUMPTIONS.forecastOperatingMargin,
        wacc: FICTIONAL_BASELINE_ASSUMPTIONS.wacc,
        terminalGrowth: FICTIONAL_BASELINE_ASSUMPTIONS.terminalGrowth,
      },
    }, FICTIONAL_DEMO_TARGET_EV);
    expect(solved.status).toBe("solved");
    if (solved.status === "solved") {
      expect(solved.growth).toBeCloseTo(FICTIONAL_BASELINE_ASSUMPTIONS.revenueGrowth, 4);
      expect(solved.modeledEv).toBeCloseTo(FICTIONAL_DEMO_TARGET_EV, 2);
    }
    expect(FICTIONAL_DEMO_WARNING).toBe("FICTIONAL EDUCATIONAL EXAMPLE — NOT REAL MARKET DATA");
  });
});

import { describe, expect, it } from "vitest";
import { loadSelectableCompanies } from "../../src/domain/company-data";
import { createInitialDashboardState, dashboardReducer } from "../../src/state/dashboard-reducer";
import { syntheticCompanyDataset, syntheticManifest, syntheticVerifiedEntry } from "../fixtures/company-dataset";

function companies() {
  const entryA = syntheticVerifiedEntry("synthetic-a");
  const entryB = syntheticVerifiedEntry("synthetic-b");
  const result = loadSelectableCompanies(syntheticManifest([entryA, entryB]), {
    "synthetic-a.json": syntheticCompanyDataset({ id: "synthetic-a", ticker: "SYA" }),
    "synthetic-b.json": syntheticCompanyDataset({ id: "synthetic-b", ticker: "SYB" }),
  });
  expect(result.rejected).toEqual([]);
  return result.companies;
}

describe("dashboard mode and company state transitions", () => {
  it("defaults to Reverse DCF and transfers the last valid implied growth into Forward mode", () => {
    const list = companies();
    let state = createInitialDashboardState(list);
    expect(state.mode).toBe("reverse");
    expect(state.selectedCompanyId).toBe("synthetic-a");
    expect(state.assumptions?.revenueGrowth).toBe(0.05);

    state = dashboardReducer(state, { type: "implied_growth_updated", growth: 0.14 });
    state = dashboardReducer(state, { type: "switch_mode", mode: "forward" });
    expect(state.mode).toBe("forward");
    expect(state.assumptions?.revenueGrowth).toBe(0.14);
  });

  it("preserves the last user growth when no valid reverse result is available", () => {
    let state = createInitialDashboardState(companies());
    state = dashboardReducer(state, { type: "switch_mode", mode: "forward" });
    state = dashboardReducer(state, { type: "change_assumption", field: "revenueGrowth", value: 0.18 });
    state = dashboardReducer(state, { type: "switch_mode", mode: "reverse" });
    state = dashboardReducer(state, { type: "switch_mode", mode: "forward" });
    expect(state.assumptions?.revenueGrowth).toBe(0.18);
    expect(state.lastUserGrowth).toBe(0.18);
  });

  it("keeps company and shared assumptions across explicit mode switches and blocks reverse growth edits", () => {
    let state = createInitialDashboardState(companies());
    state = dashboardReducer(state, { type: "change_assumption", field: "revenueGrowth", value: 0.3 });
    expect(state.assumptions?.revenueGrowth).toBe(0.05);
    state = dashboardReducer(state, { type: "change_assumption", field: "wacc", value: 0.11 });
    state = dashboardReducer(state, { type: "switch_mode", mode: "forward" });
    expect(state.selectedCompanyId).toBe("synthetic-a");
    expect(state.assumptions?.wacc).toBe(0.11);
  });

  it("loads a selected verified company's defaults, clears prior company values, and preserves mode", () => {
    let state = createInitialDashboardState(companies());
    state = dashboardReducer(state, { type: "switch_mode", mode: "forward" });
    state = dashboardReducer(state, { type: "change_assumption", field: "revenueGrowth", value: 0.22 });
    state = dashboardReducer(state, { type: "change_assumption", field: "wacc", value: 0.12 });
    state = dashboardReducer(state, { type: "select_company", companyId: "synthetic-b" });
    expect(state.mode).toBe("forward");
    expect(state.selectedCompanyId).toBe("synthetic-b");
    expect(state.assumptions).toEqual({ revenueGrowth: 0.05, forecastOperatingMargin: 0.2, wacc: 0.095, terminalGrowth: 0.02 });
    expect(state.lastUserGrowth).toBeNull();
    expect(state.lastValidImpliedGrowth).toBeNull();
    expect(state.notice).toContain("Loaded default assumptions for Synthetic synthetic-b");
  });

  it("does not select a company outside the verified company list", () => {
    const state = createInitialDashboardState(companies());
    expect(dashboardReducer(state, { type: "select_company", companyId: "not-verified" })).toBe(state);
  });

  it("keeps an out-of-range historical margin distinct from the absent forecast default", () => {
    const entry = syntheticVerifiedEntry("margin-outside");
    const dataset = syntheticCompanyDataset({ id: "margin-outside", historicalOperatingMargin: 1.2, forecastMarginDefault: false });
    const loaded = loadSelectableCompanies(syntheticManifest([entry]), { "margin-outside.json": dataset });
    expect(loaded.companies).toHaveLength(1);
    const state = createInitialDashboardState(loaded.companies);
    expect(state.assumptions?.forecastOperatingMargin).toBeUndefined();
    expect(loaded.companies[0].historicalOperatingMargin).toBe(1.2);
  });
});

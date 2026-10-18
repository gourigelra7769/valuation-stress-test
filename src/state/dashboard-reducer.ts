import type { VerifiedCompany } from "../domain/company-data";
import type { ModelAssumptions } from "../domain/types";

export type ValuationMode = "reverse" | "forward";
export type DashboardAssumptions = Omit<ModelAssumptions, "forecastOperatingMargin"> & {
  forecastOperatingMargin: number | undefined;
};

export type DashboardState = {
  companies: VerifiedCompany[];
  selectedCompanyId: string | null;
  mode: ValuationMode;
  assumptions: DashboardAssumptions | null;
  lastValidImpliedGrowth: number | null;
  lastUserGrowth: number | null;
  notice: string | null;
};

export type DashboardAction =
  | { type: "switch_mode"; mode: ValuationMode }
  | { type: "change_assumption"; field: keyof ModelAssumptions; value: number }
  | { type: "implied_growth_updated"; growth: number | null }
  | { type: "select_company"; companyId: string };

function defaults(company: VerifiedCompany): DashboardAssumptions {
  return {
    revenueGrowth: company.dataset.defaults.revenueGrowth.value,
    forecastOperatingMargin: company.dataset.defaults.forecastOperatingMargin?.value,
    wacc: company.dataset.defaults.wacc.value,
    terminalGrowth: company.dataset.defaults.terminalGrowth.value,
  };
}

export function createInitialDashboardState(companies: VerifiedCompany[]): DashboardState {
  const initialCompany = companies[0];
  return {
    companies,
    selectedCompanyId: initialCompany?.dataset.company.id ?? null,
    mode: "reverse",
    assumptions: initialCompany ? defaults(initialCompany) : null,
    lastValidImpliedGrowth: null,
    lastUserGrowth: null,
    notice: null,
  };
}

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "switch_mode": {
      if (action.mode === state.mode || !state.assumptions) return state;
      if (action.mode === "reverse") return { ...state, mode: "reverse", notice: null };
      const selected = state.companies.find((company) => company.dataset.company.id === state.selectedCompanyId);
      const defaultGrowth = selected?.dataset.defaults.revenueGrowth.value;
      const revenueGrowth = state.lastValidImpliedGrowth ?? state.lastUserGrowth ?? defaultGrowth ?? state.assumptions.revenueGrowth;
      return {
        ...state,
        mode: "forward",
        assumptions: { ...state.assumptions, revenueGrowth },
        notice: null,
      };
    }
    case "change_assumption": {
      if (!state.assumptions) return state;
      if (action.field === "revenueGrowth" && state.mode !== "forward") return state;
      return {
        ...state,
        assumptions: { ...state.assumptions, [action.field]: action.value },
        lastUserGrowth: action.field === "revenueGrowth" ? action.value : state.lastUserGrowth,
        notice: null,
      };
    }
    case "implied_growth_updated":
      if (state.mode !== "reverse" || action.growth === null || !Number.isFinite(action.growth) ||
          action.growth === state.lastValidImpliedGrowth) return state;
      return { ...state, lastValidImpliedGrowth: action.growth };
    case "select_company": {
      const selected = state.companies.find((company) => company.dataset.company.id === action.companyId);
      if (!selected || selected.dataset.company.id === state.selectedCompanyId) return state;
      return {
        ...state,
        selectedCompanyId: action.companyId,
        assumptions: defaults(selected),
        lastValidImpliedGrowth: null,
        lastUserGrowth: null,
        notice: `Loaded default assumptions for ${selected.dataset.company.legalName}.`,
      };
    }
  }
}

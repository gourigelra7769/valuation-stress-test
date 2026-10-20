"use client";

import React, { useEffect, useMemo, useReducer, useState } from "react";
import { calculateDcf } from "../src/domain/dcf";
import { generateEqualValueChartSeries } from "../src/domain/chart-series";
import type { VerifiedCompany } from "../src/domain/company-data";
import type { ModelAssumptions } from "../src/domain/types";
import { validateDcfInput } from "../src/domain/validate";
import { solveGrowthForTarget } from "../src/domain/solver";
import { createInitialDashboardState, dashboardReducer } from "../src/state/dashboard-reducer";
import { EqualValueChart } from "./EqualValueChart";
import { ForecastPanel } from "./ForecastPanel";

const currency = (value: number, digits = 1) => `$${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}m`;
const pct = (value: number) => `${(value * 100).toFixed(2)}%`;

function SourceFact({ label, fact, sources }: { label: string; fact: VerifiedCompany["dataset"]["marketReference"]["sharePrice"]; sources: VerifiedCompany["dataset"]["sources"] }) {
  const sourceLinks = fact.sourceIds.map((id) => sources.find((source) => source.id === id)).filter((source) => source !== undefined);
  return <div className="source-row"><span>{label}</span><strong>{fact.value.toLocaleString("en-US")} <small>{fact.unit.replaceAll("_", " ")}</small></strong><span>{fact.asOf}</span><span>{sourceLinks.map((source, index) => <React.Fragment key={source.id}>{index > 0 && ", "}<a href={source.url} target="_blank" rel="noreferrer" title={`${source.publisher}: ${source.title}`}>{source.publisher}: {source.title}</a>{source.locator ? ` · ${source.locator}` : ""}</React.Fragment>)}</span></div>;
}

function EmptyDashboard({ rejectedCount }: { rejectedCount: number }) {
  return <main className="shell">
    <header className="topbar"><div className="brand-mark">V</div><div><p className="eyebrow">Valuation Stress Test</p><h1>Equity research workspace</h1></div><span className="topbar-tag">Local · source reviewed</span></header>
    <section className="company-strip panel"><div><p className="eyebrow">Company and reference</p><h2>Verified company dataset required</h2><p className="muted">Only source-audited company data can be selected.</p></div><label className="company-select">Company<select aria-label="Company" disabled><option>No verified companies</option></select></label></section>
    <section className="empty-state panel"><div className="empty-icon">—</div><p className="eyebrow">Company data unavailable</p><h2>No company has passed the source audit yet</h2>
      <p>The dashboard only enables companies after their dated financial inputs, source links, classifications, and validation checks pass review. {rejectedCount > 0 ? `${rejectedCount} record${rejectedCount === 1 ? " was" : "s were"} marked verified but failed completeness or consistency checks. ` : "No company dataset is currently marked verified. "}Valuation outputs and charts are withheld until a complete source-backed dataset passes review.</p>
      <div className="empty-checklist"><span>✓ Local audited datasets only</span><span>✓ No placeholder financial values</span><span>✓ Test fixtures stay isolated from the app</span></div>
      <p className="demo-entry-link"><a href="/demo">Open the separate fictional educational demo</a></p>
    </section>
    <footer>Reference-data status · No verified dataset available</footer>
  </main>;
}

function NumberControl({ id, label, value, onChange, min, max, step = "0.01", note, invalid, disabled }: {
  id: string; label: string; value: number | undefined; onChange: (value: number) => void;
  min: string; max: string; step?: string; note: string; invalid: boolean; disabled?: boolean;
}) {
  return <label className="control" htmlFor={id}><span>{label}</span><div className={`input-wrap${invalid ? " input-invalid" : ""}`}><input id={id} aria-invalid={invalid} type="number" min={min} max={max} step={step} disabled={disabled} value={value === undefined ? "" : Number((value * 100).toFixed(2)).toString()} onChange={(event) => onChange(event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value) / 100)} /><span>%</span></div><small>{note}</small></label>;
}

export function DashboardClient({ companies, rejectedCount = 0 }: { companies: VerifiedCompany[]; rejectedCount?: number }) {
  const [state, dispatch] = useReducer(dashboardReducer, companies, createInitialDashboardState);
  const [userEditedAssumptions, setUserEditedAssumptions] = useState<Partial<Record<keyof ModelAssumptions, boolean>>>({});
  const company = state.companies.find((candidate) => candidate.dataset.company.id === state.selectedCompanyId);
  const assumptions = state.assumptions;
  const input = useMemo(() => company && assumptions && assumptions.forecastOperatingMargin !== undefined ? {
    ...company.modelInput,
    assumptions: { ...assumptions, forecastOperatingMargin: assumptions.forecastOperatingMargin },
  } : null, [company, assumptions]);
  const inputIssues = useMemo(() => !input ? [] : validateDcfInput(input), [input]);
  const reverse = useMemo(() => state.mode === "reverse" && input
    ? solveGrowthForTarget({ ...input, assumptions: { forecastOperatingMargin: input.assumptions.forecastOperatingMargin, wacc: input.assumptions.wacc, terminalGrowth: input.assumptions.terminalGrowth } }, company!.reference.referenceEv)
    : null, [company, input, state.mode]);
  const forward = useMemo(() => state.mode === "forward" && input && inputIssues.length === 0 ? calculateDcf(input) : null, [input, inputIssues, state.mode]);
  const activeGrowth = state.mode === "reverse" ? (reverse?.status === "solved" ? reverse.growth : undefined) : assumptions?.revenueGrowth;
  const chart = useMemo(() => company && assumptions ? generateEqualValueChartSeries({
    ...company.modelInput,
    assumptions: { wacc: assumptions.wacc, terminalGrowth: assumptions.terminalGrowth, forecastOperatingMargin: assumptions.forecastOperatingMargin ?? company.historicalOperatingMargin },
  }, company.reference.referenceEv) : [], [company, assumptions]);
  useEffect(() => { dispatch({ type: "implied_growth_updated", growth: reverse?.status === "solved" ? reverse.growth : null }); }, [reverse]);

  function changeAssumption(field: keyof ModelAssumptions, value: number) {
    setUserEditedAssumptions((current) => ({ ...current, [field]: true }));
    dispatch({ type: "change_assumption", field, value });
  }

  if (!company || !assumptions) return <EmptyDashboard rejectedCount={rejectedCount} />;
  const displayedDcfInput = input && state.mode === "reverse" && reverse?.status === "solved"
    ? { ...input, assumptions: { ...input.assumptions, revenueGrowth: reverse.growth } }
    : state.mode === "forward" ? input : null;
  const selectedCalculation = state.mode === "reverse"
    ? displayedDcfInput ? calculateDcf(displayedDcfInput) : null
    : forward?.status === "valid" ? forward : null;
  const issueList = inputIssues;
  const modelOutput = selectedCalculation?.status === "valid" ? selectedCalculation.value : null;
  const noRoot = reverse?.status === "no_root";
  const solverFailure = reverse?.status === "solver_failure";
  const missingMargin = assumptions.forecastOperatingMargin === undefined;
  const userSelectedCurrentGrowth = state.lastUserGrowth !== null && assumptions.revenueGrowth === state.lastUserGrowth;
  const carriedSolverGrowth = !userSelectedCurrentGrowth && state.lastValidImpliedGrowth !== null &&
    assumptions.revenueGrowth === state.lastValidImpliedGrowth;
  const security = company.dataset.latestBalanceSheet.currentShortTermMarketableSecurities;
  const defaults = company.dataset.defaults;
  const allFacts = [
    ["Base-year revenue", company.dataset.baseYear.revenue], ["Base-year EBIT", company.dataset.baseYear.ebit],
    ["Pre-tax income", company.dataset.baseYear.pretaxIncome], ["Income tax expense", company.dataset.baseYear.incomeTaxExpense],
    ["D&A", company.dataset.baseYear.da], ["Capital expenditure", company.dataset.baseYear.capex],
    ["Operating current assets", company.dataset.baseYear.operatingCurrentAssets], ["Operating current liabilities", company.dataset.baseYear.operatingCurrentLiabilities],
    ["Interest expense", company.dataset.baseYear.interestExpense], ["Beginning interest-bearing debt", company.dataset.baseYear.beginningInterestBearingDebt], ["Ending interest-bearing debt", company.dataset.baseYear.endingInterestBearingDebt],
    ["Interest-bearing debt", company.dataset.latestBalanceSheet.interestBearingDebt], ["Cash and equivalents", company.dataset.latestBalanceSheet.cashAndCashEquivalents],
    ["Preferred equity", company.dataset.latestBalanceSheet.preferredEquity], ["Non-controlling interest", company.dataset.latestBalanceSheet.nonControllingInterest],
    ...(security ? [["Current marketable securities", security] as const] : []),
    ...(company.dataset.waccEvidence ? [["Risk-free rate", company.dataset.waccEvidence.riskFreeRate] as const, ["Unlevered industry beta", company.dataset.waccEvidence.unleveredIndustryBeta] as const, ["Implied equity risk premium", company.dataset.waccEvidence.impliedEquityRiskPremium] as const] : []),
  ] as const;
  return <main className="shell">
    <header className="topbar"><div className="brand-mark">V</div><div><p className="eyebrow">Valuation Stress Test</p><h1>Equity research workspace</h1></div><span className="topbar-tag">USD · Local source data</span></header>
    <section className="company-strip panel"><div><p className="eyebrow">Company and reference</p><h2>{company.dataset.company.legalName} <span>{company.dataset.company.ticker} · {company.dataset.company.exchange}</span></h2><p className="muted">Market-price valuation date {company.dataset.marketReference.valuationDate} · Balance sheet {company.dataset.latestBalanceSheet.reportingDate}</p></div><label className="company-select">Verified company<select aria-label="Company" value={company.dataset.company.id} onChange={(event) => { setUserEditedAssumptions({}); dispatch({ type: "select_company", companyId: event.target.value }); }}>{state.companies.map((item) => <option key={item.dataset.company.id} value={item.dataset.company.id}>{item.dataset.company.ticker} · {item.dataset.company.legalName}</option>)}</select></label></section>
    {state.notice && <p className="notice" role="status">{state.notice}</p>}
    <div className="mode-row" role="group" aria-label="Valuation mode"><button className={state.mode === "reverse" ? "mode-button selected" : "mode-button"} aria-pressed={state.mode === "reverse"} onClick={() => dispatch({ type: "switch_mode", mode: "reverse" })}>Reverse DCF</button><button className={state.mode === "forward" ? "mode-button selected" : "mode-button"} aria-pressed={state.mode === "forward"} onClick={() => dispatch({ type: "switch_mode", mode: "forward" })}>Forward Valuation</button><span className="mode-explainer">{state.mode === "reverse" ? "Solve the growth implied by the fixed reference EV." : "Set revenue growth and compare modeled EV with the fixed reference."}</span></div>
    <section className="summary-grid">
      <article className="panel result-card"><p className="eyebrow">{state.mode === "reverse" ? "Implied annual revenue growth" : "Selected annual revenue growth"}</p><strong className="hero-number" data-testid="growth-result">{activeGrowth === undefined ? "Unavailable" : pct(activeGrowth)}</strong><span className="result-caption">{state.mode === "reverse" ? "Solver output · read only" : "User-entered assumption"}</span></article>
      <article className="panel result-card"><p className="eyebrow">Reference enterprise value</p><strong className="result-number" data-testid="reference-ev">{currency(company.reference.referenceEv)}</strong><span className="result-caption">Derived from market capitalization and balance-sheet bridge</span></article>
      <article className="panel result-card"><p className="eyebrow">Modeled enterprise value</p><strong className="result-number" data-testid="modeled-ev">{modelOutput ? currency(modelOutput.modeledEv) : "Unavailable"}</strong><span className="result-caption">{state.mode === "reverse" ? "Recalculated at solver growth" : "Calculated from current assumptions"}</span></article>
    </section>
    {noRoot && <div className="state-message no-root" role="status"><strong>No valid growth solution in the supported range.</strong> The fixed target EV cannot be matched from −20% to 50% revenue growth using these assumptions.</div>}
    {solverFailure && <div className="state-message solver-failure" role="alert"><strong>Numerical solver could not confirm a result.</strong> {reverse.status === "solver_failure" ? reverse.reason : "Review inputs and try again."}</div>}
    {missingMargin && <div className="state-message invalid" role="alert"><strong>Forecast margin required.</strong> Historical operating margin {pct(company.historicalOperatingMargin)} is outside the supported 0%–70% range; choose an explicit forecast margin.</div>}
    {issueList.length > 0 && !missingMargin && <div className="state-message invalid" role="alert"><strong>Calculation blocked by invalid assumptions.</strong><ul>{issueList.map((issue) => <li key={`${issue.field}-${issue.code}`}>{issue.field}: {issue.message}</li>)}</ul></div>}
    {forward?.status === "invalid_input" && <div className="state-message invalid" role="alert"><strong>Forward valuation is unavailable.</strong> {forward.issues.map((issue) => issue.message).join(" ")}</div>}
    <div className="main-grid">
      <section className="panel assumptions-panel"><div className="panel-heading"><div><p className="eyebrow">Editable scenario</p><h2>Model assumptions</h2></div><span className="tag user-tag">User controlled</span></div>
        <NumberControl id="growth-input" label="Revenue growth" value={state.mode === "reverse" ? activeGrowth : assumptions.revenueGrowth} min="-20" max="50" disabled={state.mode === "reverse"} invalid={state.mode === "forward" && issueList.some((i) => i.field === "assumptions.revenueGrowth")} onChange={(value) => changeAssumption("revenueGrowth", value)} note={state.mode === "reverse" ? "Solver output · read only in Reverse DCF mode" : `${defaults.revenueGrowth.classification} default · user editable`} />
        <NumberControl id="margin-input" label="Forecast operating margin" value={assumptions.forecastOperatingMargin} min="0" max="70" invalid={issueList.some((i) => i.field === "assumptions.forecastOperatingMargin")} onChange={(value) => changeAssumption("forecastOperatingMargin", value)} note={`Historical baseline ${pct(company.historicalOperatingMargin)} · ${defaults.forecastOperatingMargin?.classification ?? "required user input"}`} />
        <NumberControl id="wacc-input" label="WACC" value={assumptions.wacc} min="5" max="20" invalid={issueList.some((i) => i.field === "assumptions.wacc")} onChange={(value) => changeAssumption("wacc", value)} note={defaults.wacc.classification === "illustrative" ? "Illustrative editable fallback" : "Source-derived editable default"} />
        <div className="fixed-assumption"><span>Terminal growth</span><strong>{pct(assumptions.terminalGrowth)}</strong><small>{defaults.terminalGrowth.classification} default · user editable</small><input aria-label="Terminal growth" type="number" min="0" max="4" step="0.1" value={(assumptions.terminalGrowth * 100).toString()} onChange={(event) => changeAssumption("terminalGrowth", event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value) / 100)} /></div>
        {state.mode === "reverse" && <p className="solver-range">Supported solver range: −20% to 50% annual growth</p>}
      </section>
      <EqualValueChart points={chart} currentMargin={assumptions.forecastOperatingMargin} currentGrowth={activeGrowth} targetEV={company.reference.referenceEv} />
    </div>
    <section className="detail-grid">
      <article className="panel"><p className="eyebrow">Calculated outputs</p><h2>Valuation details</h2><div className="metric-list"><div><span>Estimated equity value per share</span><strong>{modelOutput ? `$${modelOutput.estimatedEquityValuePerShare.toFixed(2)}` : "Unavailable"}</strong></div><div><span>Terminal value contribution</span><strong>{modelOutput ? pct(modelOutput.terminalValueContribution) : "Unavailable"}</strong></div><div><span>Terminal value at year five</span><strong>{modelOutput ? currency(modelOutput.terminalValueAtYear5) : "Unavailable"}</strong></div><div><span>Discounted terminal value</span><strong>{modelOutput ? currency(modelOutput.presentValueTerminalValue) : "Unavailable"}</strong></div></div><p className="fine-print">Per-share value uses basic shares outstanding and may differ from estimates using diluted shares. Historical effective tax rate ({pct(company.effectiveTaxRate)}) is held constant and applied to forecast EBIT.</p></article>
      <article className="panel bridge-panel"><p className="eyebrow">Derived from sourced facts</p><h2>Reference EV bridge</h2><div className="bridge-line"><span>Market capitalization</span><strong>{currency(company.reference.marketCap)}</strong></div><div className="bridge-line"><span>+ Debt</span><strong>{currency(company.reference.adjustments.debt)}</strong></div><div className="bridge-line"><span>+ Preferred equity</span><strong>{currency(company.reference.adjustments.preferredEquity)}</strong></div><div className="bridge-line"><span>+ Non-controlling interests</span><strong>{currency(company.reference.adjustments.nonControllingInterest)}</strong></div><div className="bridge-line"><span>− Cash and equivalents</span><strong>−{currency(company.reference.adjustments.cashAndCashEquivalents)}</strong></div><div className="bridge-line"><span>− Eligible current marketable securities</span><strong>−{currency(company.reference.adjustments.eligibleCurrentShortTermMarketableSecurities)}</strong></div><div className="bridge-total"><span>Reference enterprise value</span><strong>{currency(company.reference.referenceEv)}</strong></div><p className="fine-print">Share price and basic shares dated {company.reference.valuationDate}; balance-sheet adjustments dated {company.reference.balanceSheetDate}. Formula uses basic common shares. The modeled equity bridge uses the same definition.</p></article>
    </section>
    {modelOutput && displayedDcfInput && <ForecastPanel output={modelOutput} input={displayedDcfInput} company={company.dataset} solverDerivedGrowth={state.mode === "reverse" ? "reverse" : carriedSolverGrowth ? "carried" : false} userEditedAssumptions={userEditedAssumptions} />}
    <section className="panel source-panel"><div className="panel-heading"><div><p className="eyebrow">Traceability</p><h2>Source-backed company inputs</h2></div><span className="tag sourced-tag">Sourced facts</span></div><div className="source-table"><div className="source-row source-header"><span>Input</span><span>Value · unit</span><span>As of</span><span>Source reference</span></div><SourceFact label="Reference share price" fact={company.dataset.marketReference.sharePrice} sources={company.dataset.sources} /><SourceFact label="Basic shares outstanding" fact={company.dataset.marketReference.basicShares} sources={company.dataset.sources} />{allFacts.map(([label, fact]) => <SourceFact key={label} label={label} fact={fact} sources={company.dataset.sources} />)}</div><p className="fine-print">Each displayed fact links to its local audit-checked source record with publisher, title, date, and locator when available; the dashboard does not fetch live information.</p></section>
    <footer>{company.dataset.company.ticker} · Data as of {company.dataset.marketReference.valuationDate} · No investment recommendation</footer>
  </main>;
}

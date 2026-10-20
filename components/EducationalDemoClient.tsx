"use client";

import React, { useMemo, useState } from "react";
import { calculateDcf } from "../src/domain/dcf";
import { generateEqualValueChartSeries } from "../src/domain/chart-series";
import { solveGrowthForTarget } from "../src/domain/solver";
import { validateDcfInput } from "../src/domain/validate";
import type { ModelAssumptions } from "../src/domain/types";
import {
  FICTIONAL_BASELINE_ASSUMPTIONS,
  FICTIONAL_DEMO_INPUT,
  FICTIONAL_DEMO_TARGET_EV,
  FICTIONAL_DEMO_WARNING,
  FICTIONAL_INPUT_SUMMARY,
} from "../src/demo/fictional-scenario";
import { EqualValueChart } from "./EqualValueChart";
import { ForecastPanel } from "./ForecastPanel";

type Mode = "reverse" | "forward";
type Field = keyof ModelAssumptions;
const percent = (value: number) => `${(value * 100).toFixed(2)}%`;
const money = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}m`;

function AssumptionControl({ id, label, field, value, onChange, disabled = false, note }: {
  id: string; label: string; field: Field; value: number; onChange: (field: Field, value: number) => void;
  disabled?: boolean; note: string;
}) {
  return <label className="control" htmlFor={id}><span>{label}</span><div className="input-wrap">
    <input id={id} aria-label={label} type="number" min={field === "revenueGrowth" ? -20 : 0} max={field === "revenueGrowth" ? 50 : field === "forecastOperatingMargin" ? 70 : field === "wacc" ? 20 : 4} step="0.25" disabled={disabled} value={Number((value * 100).toFixed(2))} onChange={(event) => onChange(field, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value) / 100)} />
    <span>%</span></div><small>{note}</small></label>;
}

export function EducationalDemoClient() {
  const [mode, setMode] = useState<Mode>("reverse");
  const [assumptions, setAssumptions] = useState<ModelAssumptions>({ ...FICTIONAL_BASELINE_ASSUMPTIONS });
  const modelInput = useMemo(() => ({
    ...FICTIONAL_DEMO_INPUT,
    assumptions,
  }), [assumptions]);
  const validationIssues = useMemo(() => validateDcfInput(modelInput), [modelInput]);
  const reverseInput = useMemo(() => ({
    ...FICTIONAL_DEMO_INPUT,
    assumptions: {
      forecastOperatingMargin: assumptions.forecastOperatingMargin,
      wacc: assumptions.wacc,
      terminalGrowth: assumptions.terminalGrowth,
    },
  }), [assumptions]);
  const reverse = useMemo(() => mode === "reverse"
    ? solveGrowthForTarget(reverseInput, FICTIONAL_DEMO_TARGET_EV)
    : null, [mode, reverseInput]);
  const activeGrowth = mode === "reverse"
    ? reverse?.status === "solved" ? reverse.growth : undefined
    : assumptions.revenueGrowth;
  const calculation = mode === "reverse"
    ? activeGrowth === undefined ? null : calculateDcf({ ...modelInput, assumptions: { ...assumptions, revenueGrowth: activeGrowth } })
    : validationIssues.length === 0 ? calculateDcf(modelInput) : null;
  const output = calculation?.status === "valid" ? calculation.value : null;
  const chart = useMemo(() => generateEqualValueChartSeries({
    ...FICTIONAL_DEMO_INPUT,
    assumptions: {
      forecastOperatingMargin: assumptions.forecastOperatingMargin,
      wacc: assumptions.wacc,
      terminalGrowth: assumptions.terminalGrowth,
    },
  }, FICTIONAL_DEMO_TARGET_EV), [assumptions]);

  function update(field: Field, value: number) {
    setAssumptions((current) => ({ ...current, [field]: value }));
  }
  function switchMode(next: Mode) {
    if (next === "forward" && mode === "reverse" && reverse?.status === "solved") {
      setAssumptions((current) => ({ ...current, revenueGrowth: reverse.growth }));
    }
    setMode(next);
  }

  return <>
    <div className="demo-warning" role="note" aria-label="Fictional educational data warning">{FICTIONAL_DEMO_WARNING}</div>
    <main className="shell demo-shell">
      <header className="topbar"><div className="brand-mark">V</div><div><p className="eyebrow">Valuation Stress Test · Educational mode</p><h1>Fictional valuation scenario</h1></div><a className="topbar-tag demo-back" href="/">Company data status</a></header>
      <section className="company-strip panel demo-context"><div><p className="eyebrow">Fictional scenario · no issuer or quote</p><h2>Five-year FCFF / WACC walkthrough</h2><p className="muted">A deterministic teaching example. No values on this page describe a real company or market.</p></div><span className="tag fictional-tag">Fictional inputs</span></section>
      <div className="demo-section-label"><span className="tag fictional-tag">Fictional inputs</span><span>Invented baseline values used only for this educational calculation</span></div>
      <section className="demo-input-grid" aria-label="Fictional scenario inputs">{FICTIONAL_INPUT_SUMMARY.map(([label, value]) => <article className="panel demo-input" key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
      <div className="mode-row" role="group" aria-label="Valuation mode"><button className={`mode-button${mode === "reverse" ? " selected" : ""}`} aria-pressed={mode === "reverse"} onClick={() => switchMode("reverse")}>Reverse DCF</button><button className={`mode-button${mode === "forward" ? " selected" : ""}`} aria-pressed={mode === "forward"} onClick={() => switchMode("forward")}>Forward Valuation</button><span className="mode-explainer">{mode === "reverse" ? "Solve for growth matching the fictional target" : "Choose growth and calculate modeled value"}</span></div>
      {mode === "reverse" && reverse?.status === "no_root" && <p className="state-message no-root" role="status">No valid growth solution exists within the supported range for these assumptions.</p>}
      {mode === "reverse" && reverse?.status === "solver_failure" && <p className="state-message solver-failure" role="alert">Numerical solver could not confirm a solution. {reverse.reason}</p>}
      {(validationIssues.length > 0 || (mode === "reverse" && reverse?.status === "invalid_input")) && <div className="state-message invalid" role="alert"><strong>Invalid assumptions.</strong><ul>{(mode === "reverse" && reverse?.status === "invalid_input" ? reverse.issues : validationIssues).map((issue, index) => <li key={`${issue.field}-${index}`}>{issue.message}</li>)}</ul></div>}
      <div className="summary-grid demo-summary" aria-label="Calculated outputs">
        <article className="panel result-card"><p className="eyebrow">{mode === "reverse" ? "Solver output" : "User-selected assumption"}</p><strong className="hero-number" data-testid="demo-growth">{activeGrowth === undefined ? "Unavailable" : percent(activeGrowth)}</strong><span className="result-caption">{mode === "reverse" ? "Revenue growth required" : "Annual revenue growth selected"}</span></article>
        <article className="panel result-card"><p className="eyebrow">Calculated fictional target EV</p><strong className="result-number" data-testid="demo-target">{money(FICTIONAL_DEMO_TARGET_EV)}</strong><span className="result-caption">Fixed target calculated from the fictional baseline</span></article>
        <article className="panel result-card"><p className="eyebrow">Calculated modeled EV</p><strong className="result-number" data-testid="demo-modeled-ev">{output ? money(output.modeledEv) : "Unavailable"}</strong><span className="result-caption">{output ? "Shared DCF engine output" : "Blocked until inputs are valid"}</span></article>
      </div>
      <div className="main-grid demo-main-grid">
        <section className="panel assumptions-panel"><div className="panel-heading"><div><p className="eyebrow">User-selected assumptions</p><h2>Model controls</h2></div><span className="tag user-tag">Editable</span></div>
          <AssumptionControl id="demo-growth-input" label="Revenue growth" field="revenueGrowth" value={mode === "reverse" ? activeGrowth ?? assumptions.revenueGrowth : assumptions.revenueGrowth} onChange={update} disabled={mode === "reverse"} note={mode === "reverse" ? "Solver output · read only in Reverse DCF" : "User-selected annual growth assumption"} />
          <AssumptionControl id="demo-margin-input" label="Forecast operating margin" field="forecastOperatingMargin" value={assumptions.forecastOperatingMargin} onChange={update} note="User-selected assumption · supported range 0% to 70%" />
          <AssumptionControl id="demo-wacc-input" label="WACC" field="wacc" value={assumptions.wacc} onChange={update} note="User-selected discount rate · supported range 5% to 20%" />
          <AssumptionControl id="demo-terminal-growth-input" label="Terminal growth" field="terminalGrowth" value={assumptions.terminalGrowth} onChange={update} note="User-selected assumption · must remain below WACC" />
        </section>
        <EqualValueChart points={chart} currentMargin={assumptions.forecastOperatingMargin} currentGrowth={activeGrowth} targetEV={FICTIONAL_DEMO_TARGET_EV} targetLabel="Calculated fictional target EV" targetContext="the calculated fictional target EV" />
      </div>
      <section className="detail-grid demo-details"><article className="panel"><p className="eyebrow">Calculated outputs</p><h2>Model results</h2><div className="metric-list"><div><span>Estimated equity value per share</span><strong>{output ? `$${output.estimatedEquityValuePerShare.toFixed(2)}` : "Unavailable"}</strong></div><div><span>Terminal value contribution</span><strong>{output ? percent(output.terminalValueContribution) : "Unavailable"}</strong></div><div><span>Terminal value at year five</span><strong>{output ? money(output.terminalValueAtYear5) : "Unavailable"}</strong></div><div><span>Discounted terminal value</span><strong>{output ? money(output.presentValueTerminalValue) : "Unavailable"}</strong></div></div><p className="fine-print">These are calculated outputs from fictional inputs and the shared DCF engine, not a forecast or investment advice.</p></article>
        <article className="panel"><p className="eyebrow">Calculation provenance</p><h2>Shared financial engine</h2><p className="muted">Reverse DCF calls the existing deterministic growth solver. Forward Valuation and the fixed teaching target call the same five-year FCFF/WACC DCF engine. Every chart point uses the existing solver with the same fixed fictional target.</p><p className="muted">The demo has no company dataset, source records, market reference date, issuer identity, or quote.</p></article></section>
      {output && <ForecastPanel output={output} />}
      <footer className="demo-footer">{FICTIONAL_DEMO_WARNING}<br />No real company data · No investment recommendation</footer>
    </main>
  </>;
}

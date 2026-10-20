import type { CompanyDataset, DcfInput, DcfOutput, SourcedFact } from "../src/domain/types";

const amount = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}m`;
const factor = (value: number) => value.toFixed(6);
const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

type AssumptionName = "revenueGrowth" | "forecastOperatingMargin" | "wacc" | "terminalGrowth";
type ForecastPanelProps = {
  output: DcfOutput;
  input: DcfInput;
  company?: CompanyDataset;
  fictional?: boolean;
  solverDerivedGrowth?: "reverse" | "carried" | false;
  userEditedAssumptions?: Partial<Record<keyof DcfInput["assumptions"], boolean>>;
};

function SourceFactNote({ label, fact, company }: { label: string; fact: SourcedFact | undefined; company: CompanyDataset }) {
  if (!fact) return <li><strong>{label}:</strong> provenance unavailable in the company record.</li>;
  const sources = fact.sourceIds
    .map((id) => company.sources.find((source) => source.id === id))
    .filter((source) => source !== undefined);
  return <li>
    <strong>{label}:</strong> {fact.value.toLocaleString("en-US")} {fact.unit.replaceAll("_", " ")}
    {fact.reportedValue !== undefined && <>; reported value {fact.reportedValue.toLocaleString("en-US")}</>}
    {fact.asOf && <>; as of {fact.asOf}</>}
    {fact.period && <>; period {fact.period.start} to {fact.period.end} ({fact.period.kind})</>}
    {fact.normalizationNote && <>; normalization: {fact.normalizationNote}</>}
    {fact.classification && <>; classification: {fact.classification}</>}
    {sources.length > 0
      ? <>; sources: {sources.map((source, index) => <span key={source.id}>{index > 0 && ", "}<a href={source.url} target="_blank" rel="noreferrer">{source.publisher}: {source.title}</a>{source.locator ? ` · ${source.locator}` : ""}{source.publishedAt ? ` · published ${source.publishedAt}` : ""}{source.accessedAt ? ` · accessed ${source.accessedAt}` : ""}</span>)}</>
      : "; source link unavailable in the company record"}
  </li>;
}

function AssumptionNote({ name, label, value, company, solverDerived = false, userEdited = false }: {
  name: AssumptionName; label: string; value: number; company?: CompanyDataset; solverDerived?: "reverse" | "carried" | boolean; userEdited?: boolean;
}) {
  const defaultRecord = company?.defaults[name];
  const formatted = percent(value);
  if (!company) {
    const origin = solverDerived === "reverse" ? "solver-derived by this Reverse DCF result"
      : solverDerived === "carried" ? "solver-derived by Reverse DCF and carried into Forward Valuation"
        : userEdited ? "fictional, user-selected assumption" : "fictional baseline assumption (editable by the user)";
    return <li><strong>{label}:</strong> {formatted} — {origin}.</li>;
  }
  if (solverDerived) return <li><strong>{label}:</strong> {formatted} — {solverDerived === "carried" ? "solver-derived by Reverse DCF and carried into Forward Valuation" : "solver-derived for this Reverse DCF result"}.</li>;

  const isCurrentDefault = !userEdited && defaultRecord?.value === value;
  const classification = userEdited ? "user-edited assumption" : isCurrentDefault
    ? defaultRecord?.classification.replaceAll("_", " ") ?? "company default; classification unavailable"
    : defaultRecord ? "current assumption differs from the documented default" : "current assumption; default unavailable";
  const defaultSources = defaultRecord?.sourceIds
    .map((id) => company.sources.find((source) => source.id === id))
    .filter((source) => source !== undefined) ?? [];
  return <li>
    <strong>{label}:</strong> {formatted} — {classification}.
    {isCurrentDefault && <> Method: {defaultRecord?.method || "unavailable in the company record"}. Rationale: {defaultRecord?.rationale || "unavailable in the company record"}.</>}
    {!isCurrentDefault && defaultRecord && <> Default reference: {percent(defaultRecord.value)}; its method ({defaultRecord.method || "unavailable in the company record"}) and rationale ({defaultRecord.rationale || "unavailable in the company record"}) describe the default, not why the current value was selected.</>}
    {isCurrentDefault && defaultRecord?.sourceIds.length
      ? <> Sources: {defaultSources.length > 0
        ? defaultSources.map((source, index) => <span key={source.id}>{index > 0 && ", "}<a href={source.url} target="_blank" rel="noreferrer">{source.publisher}: {source.title}</a>{source.locator ? ` · ${source.locator}` : ""}{source.publishedAt ? ` · published ${source.publishedAt}` : ""}{source.accessedAt ? ` · accessed ${source.accessedAt}` : ""}</span>)
        : "source link unavailable in the company record"}.</>
      : !isCurrentDefault || !defaultRecord?.sourceIds.length ? <> Source provenance for the current value is unavailable.</> : null}
  </li>;
}

export function ForecastPanel({ output, input, company, fictional = false, solverDerivedGrowth = false, userEditedAssumptions = {} }: ForecastPanelProps) {
  const forecastPv = output.forecast.reduce((sum, year) => sum + year.presentValueFcff, 0);
  const rows: { label: string; value: (index: number) => string }[] = [
    { label: "Revenue", value: (i) => amount(output.forecast[i].revenue) },
    { label: "EBIT", value: (i) => amount(output.forecast[i].ebit) },
    { label: "Taxes", value: (i) => amount(output.forecast[i].taxes) },
    { label: "D&A", value: (i) => amount(output.forecast[i].da) },
    { label: "CapEx", value: (i) => amount(output.forecast[i].capex) },
    { label: "Change in operating net working capital", value: (i) => amount(output.forecast[i].changeInNwc) },
    { label: "FCFF", value: (i) => amount(output.forecast[i].fcff) },
    { label: "Discount factor", value: (i) => factor(output.forecast[i].discountFactor) },
    { label: "Present value of FCFF", value: (i) => amount(output.forecast[i].presentValueFcff) },
  ];
  const baseFacts = company ? [
    ["Base-year revenue", company.baseYear.revenue],
    ["Base-year EBIT", company.baseYear.ebit],
    ["Pre-tax income", company.baseYear.pretaxIncome],
    ["Income tax expense", company.baseYear.incomeTaxExpense],
    ["Base-year D&A", company.baseYear.da],
    ["Base-year CapEx", company.baseYear.capex],
    ["Operating current assets", company.baseYear.operatingCurrentAssets],
    ["Operating current liabilities", company.baseYear.operatingCurrentLiabilities],
  ] as const : [];
  const marginDefault = company?.defaults.forecastOperatingMargin;
  const marginDefaultIsCurrent = marginDefault?.value === input.assumptions.forecastOperatingMargin;

  return <section className="panel forecast-panel" aria-labelledby="forecast-heading" data-testid="forecast-panel">
    <div className="panel-heading"><div><p className="eyebrow">Calculated outputs</p><h2 id="forecast-heading">Five-year FCFF forecast</h2></div><span className="tag sourced-tag">Shared DCF output</span></div>
    <p className="fine-print">Current model output is displayed in USD millions.</p>
    <div className="forecast-table-scroll"><table className="forecast-table"><thead><tr><th scope="col">USD millions</th>{output.forecast.map((year) => <th scope="col" key={year.year}>Year {year.year}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{output.forecast.map((year, index) => <td key={year.year}>{row.value(index)}</td>)}</tr>)}</tbody></table></div>
    <details className="forecast-notes" data-testid="forecast-notes">
      <summary>Inputs and calculation notes</summary>
      {fictional && <p className="fine-print fictional-note">Fictional educational inputs only — not real company data. The baseline and assumptions below are invented; user changes are scenario assumptions.</p>}
      {company
        ? <p className="fine-print">Base-year values are historical company inputs; all five year columns are forecast outputs.</p>
        : <p className="fine-print">Baseline values are fictional scenario inputs, not historical issuer facts; all five year columns are forecast outputs.</p>}
      <ul className="forecast-formulas">
        <li><strong>Revenue:</strong> base revenue {amount(input.baseRevenue)} × (1 + revenue growth {percent(input.assumptions.revenueGrowth)})<sup>forecast year</sup>.</li>
        <li><strong>EBIT:</strong> revenue × forecast operating margin {percent(input.assumptions.forecastOperatingMargin)}.</li>
        <li><strong>Taxes:</strong> EBIT × effective tax rate {percent(input.effectiveTaxRate)}.</li>
        <li><strong>D&amp;A:</strong> revenue × D&amp;A-to-revenue ratio {percent(input.daToRevenue)}.</li>
        <li><strong>CapEx:</strong> revenue × CapEx-to-revenue ratio {percent(input.capexToRevenue)}.</li>
        <li><strong>Operating NWC:</strong> revenue × operating-NWC-to-revenue ratio {percent(input.operatingNwcToRevenue)}.</li>
        <li><strong>Change in NWC:</strong> current-year operating NWC − prior-year operating NWC. Year 1 compares with base-year revenue {amount(input.baseRevenue)} using the same operating-NWC ratio.</li>
        <li><strong>FCFF:</strong> EBIT − taxes + D&amp;A − CapEx − change in NWC.</li>
        <li><strong>Discount factor:</strong> 1 / (1 + WACC {percent(input.assumptions.wacc)})<sup>forecast year</sup>.</li>
        <li><strong>Present value of FCFF:</strong> FCFF × discount factor.</li>
        <li><strong>Terminal value:</strong> Year 5 FCFF × (1 + terminal growth {percent(input.assumptions.terminalGrowth)}) / (WACC {percent(input.assumptions.wacc)} − terminal growth {percent(input.assumptions.terminalGrowth)}).</li>
        <li><strong>Present value of terminal value:</strong> terminal value / (1 + WACC {percent(input.assumptions.wacc)})<sup>5</sup>.</li>
        <li><strong>Modeled EV:</strong> sum of the five FCFF present values + present value of terminal value.</li>
      </ul>
      <h3 className="forecast-notes-subheading">Input status and provenance</h3>
      {company ? <>
        <p className="fine-print">Historical fact dates and sources below are shown only where recorded. Derived ratios use these base-year facts; their source records support the underlying facts, not the modeling choice to hold each ratio constant in the forecast.</p>
        <ul className="forecast-provenance">{baseFacts.map(([label, fact]) => <SourceFactNote key={label} label={label} fact={fact} company={company} />)}</ul>
        <ul className="forecast-provenance">
          <AssumptionNote name="revenueGrowth" label="Revenue growth" value={input.assumptions.revenueGrowth} company={company} solverDerived={solverDerivedGrowth} userEdited={userEditedAssumptions.revenueGrowth} />
          <AssumptionNote name="forecastOperatingMargin" label="Forecast operating margin" value={input.assumptions.forecastOperatingMargin} company={company} userEdited={userEditedAssumptions.forecastOperatingMargin} />
          {marginDefaultIsCurrent && marginDefault?.classification === "historical_derived" && <li>Historical margin baseline relationship: base-year EBIT / base-year revenue. This baseline is a historical ratio; it does not establish future performance.</li>}
          <li><strong>Effective tax rate:</strong> {percent(input.effectiveTaxRate)} — derived as base-year income tax expense / base-year pretax income; the derived rate is applied to forecast EBIT.</li>
          <li><strong>D&amp;A-to-revenue ratio:</strong> {percent(input.daToRevenue)} — derived as base-year D&amp;A / base-year revenue.</li>
          <li><strong>CapEx-to-revenue ratio:</strong> {percent(input.capexToRevenue)} — derived as base-year CapEx / base-year revenue.</li>
          <li><strong>Operating-NWC-to-revenue ratio:</strong> {percent(input.operatingNwcToRevenue)} — derived as (base-year operating current assets − base-year operating current liabilities) / base-year revenue.</li>
          <AssumptionNote name="wacc" label="WACC" value={input.assumptions.wacc} company={company} userEdited={userEditedAssumptions.wacc} />
          <AssumptionNote name="terminalGrowth" label="Terminal growth" value={input.assumptions.terminalGrowth} company={company} userEdited={userEditedAssumptions.terminalGrowth} />
        </ul>
        {company.waccEvidence && <p className="fine-print">WACC evidence facts are available in the source-backed company inputs elsewhere on this page. The current model does not calculate WACC from those components using a displayed CAPM formula.</p>}
        {!company.baseYear.fiscalYearEnd && <p className="fine-print">Base-year period end unavailable in the company record.</p>}
        {company.baseYear.fiscalYearEnd && <p className="fine-print">Base-year fiscal period end: {company.baseYear.fiscalYearEnd}.</p>}
      </> : <ul className="forecast-provenance fictional-provenance">
        <li>Base revenue {amount(input.baseRevenue)}, tax rate {percent(input.effectiveTaxRate)}, D&amp;A ratio {percent(input.daToRevenue)}, CapEx ratio {percent(input.capexToRevenue)}, and operating-NWC ratio {percent(input.operatingNwcToRevenue)} are fictional scenario inputs; real source provenance and effective dates are unavailable.</li>
        <AssumptionNote name="revenueGrowth" label="Revenue growth" value={input.assumptions.revenueGrowth} solverDerived={solverDerivedGrowth} userEdited={userEditedAssumptions.revenueGrowth} />
        <AssumptionNote name="forecastOperatingMargin" label="Forecast operating margin" value={input.assumptions.forecastOperatingMargin} userEdited={userEditedAssumptions.forecastOperatingMargin} />
        <li><strong>Effective tax rate:</strong> {percent(input.effectiveTaxRate)} — fictional scenario value, not verified historical company data.</li>
        <AssumptionNote name="wacc" label="WACC" value={input.assumptions.wacc} userEdited={userEditedAssumptions.wacc} />
        <AssumptionNote name="terminalGrowth" label="Terminal growth" value={input.assumptions.terminalGrowth} userEdited={userEditedAssumptions.terminalGrowth} />
      </ul>}
    </details>
    <h3 className="forecast-reconciliation-heading">Enterprise-value reconciliation</h3>
    <div className="forecast-reconciliation" aria-label="Enterprise-value reconciliation">
      <div><span>Sum of present values of forecast FCFF</span><strong data-testid="forecast-pv-subtotal">{amount(forecastPv)}</strong></div>
      <div><span>Terminal value at Year 5</span><strong data-testid="forecast-terminal-value">{amount(output.terminalValueAtYear5)}</strong></div>
      <div><span>Present value of terminal value</span><strong data-testid="forecast-pv-terminal">{amount(output.presentValueTerminalValue)}</strong></div>
      <div className="forecast-ev-total"><span>Modeled enterprise value</span><strong data-testid="forecast-modeled-ev">{amount(output.modeledEv)}</strong></div>
    </div>
    <p className="fine-print">Modeled enterprise value equals the sum of the present values of the five forecast FCFFs plus the present value of terminal value. Terminal value at Year 5 is undiscounted and shown for reference; it is not added directly to this subtotal. Amounts are shown to four decimal places; underlying values retain full precision.</p>
  </section>;
}

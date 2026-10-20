import type { DcfOutput } from "../src/domain/types";

const amount = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}m`;
const factor = (value: number) => value.toFixed(6);

export function ForecastPanel({ output }: { output: DcfOutput }) {
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

  return <section className="panel forecast-panel" aria-labelledby="forecast-heading" data-testid="forecast-panel">
    <div className="panel-heading"><div><p className="eyebrow">Calculated outputs</p><h2 id="forecast-heading">Five-year FCFF forecast</h2></div><span className="tag sourced-tag">Shared DCF output</span></div>
    <p className="fine-print">Current model output is displayed in USD millions.</p>
    <div className="forecast-table-scroll"><table className="forecast-table"><thead><tr><th scope="col">USD millions</th>{output.forecast.map((year) => <th scope="col" key={year.year}>Year {year.year}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{output.forecast.map((year, index) => <td key={year.year}>{row.value(index)}</td>)}</tr>)}</tbody></table></div>
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

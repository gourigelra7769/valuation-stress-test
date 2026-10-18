import { validateDcfInput } from "./validate";
import type { DcfInput, DcfOutput, ForecastYear, ValidationIssue } from "./types";

export type DcfCalculation =
  | { status: "valid"; value: DcfOutput }
  | { status: "invalid_input"; issues: ValidationIssue[] };

/**
 * Deterministic five-year annual FCFF/WACC valuation. All monetary values use
 * the same scale and currency supplied by the caller.
 */
export function calculateDcf(input: DcfInput): DcfCalculation {
  const issues = validateDcfInput(input);
  if (issues.length > 0) return { status: "invalid_input", issues };

  const { revenueGrowth, forecastOperatingMargin, wacc, terminalGrowth } = input.assumptions;
  const { effectiveTaxRate, daToRevenue, capexToRevenue, operatingNwcToRevenue } = input;
  const forecast: ForecastYear[] = [];
  let previousRevenue = input.baseRevenue;
  let presentValueForecastFcff = 0;

  for (let year = 1; year <= 5; year += 1) {
    const revenue = input.baseRevenue * (1 + revenueGrowth) ** year;
    const ebit = revenue * forecastOperatingMargin;
    const taxes = ebit * effectiveTaxRate;
    const da = revenue * daToRevenue;
    const capex = revenue * capexToRevenue;
    const operatingNwc = revenue * operatingNwcToRevenue;
    const previousOperatingNwc = previousRevenue * operatingNwcToRevenue;
    const changeInNwc = operatingNwc - previousOperatingNwc;
    const fcff = ebit - taxes + da - capex - changeInNwc;
    const discountFactor = 1 / (1 + wacc) ** year;
    const presentValueFcff = fcff * discountFactor;

    forecast.push({
      year: year as ForecastYear["year"], revenue, ebit, taxes, da, capex,
      operatingNwc, changeInNwc, fcff, discountFactor, presentValueFcff,
    });
    presentValueForecastFcff += presentValueFcff;
    previousRevenue = revenue;
  }

  const finalFcff = forecast[4].fcff;
  const terminalValueAtYear5 = finalFcff * (1 + terminalGrowth) / (wacc - terminalGrowth);
  const presentValueTerminalValue = terminalValueAtYear5 / (1 + wacc) ** 5;
  const modeledEv = presentValueForecastFcff + presentValueTerminalValue;
  if (modeledEv === 0) {
    return {
      status: "invalid_input",
      issues: [{ field: "modeledEv", code: "zero_enterprise_value", message: "Modeled enterprise value is zero, so terminal-value contribution cannot be calculated." }],
    };
  }
  const terminalValueContribution = presentValueTerminalValue / modeledEv;
  const bridge = input.equityBridge;
  const eligibleSecurities = bridge.currentShortTermMarketableSecurities?.value ?? 0;
  const estimatedEquityValuePerShare = (modeledEv - bridge.debt.value - bridge.preferredEquity.value -
    bridge.nonControllingInterest.value + bridge.cashAndCashEquivalents.value + eligibleSecurities) /
    bridge.basicShares.value;

  const output: DcfOutput = {
    forecast,
    terminalValueAtYear5,
    presentValueTerminalValue,
    modeledEv,
    terminalValueContribution,
    estimatedEquityValuePerShare,
  };
  const numericOutputs = [
    ...forecast.flatMap((row) => [row.revenue, row.ebit, row.taxes, row.da, row.capex,
      row.operatingNwc, row.changeInNwc, row.fcff, row.discountFactor, row.presentValueFcff]),
    terminalValueAtYear5, presentValueTerminalValue, modeledEv, terminalValueContribution,
    estimatedEquityValuePerShare,
  ];
  if (numericOutputs.some((value) => !Number.isFinite(value))) {
    return {
      status: "invalid_input",
      issues: [{ field: "calculation", code: "non_finite_result", message: "DCF calculation produced a non-finite output; check input magnitudes and assumptions." }],
    };
  }
  return { status: "valid", value: output };
}

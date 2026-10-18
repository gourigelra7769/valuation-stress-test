import { describe, expect, it, vi } from "vitest";
import * as dcfModule from "../../src/domain/dcf";
import { calculateDcf } from "../../src/domain/dcf";
import {
  DEFAULT_GROWTH_RANGE,
  REVERSE_SOLVER_GROWTH_TOLERANCE,
  REVERSE_SOLVER_INTERVALS,
  REVERSE_SOLVER_MAX_BISECTION_ITERATIONS,
  REVERSE_SOLVER_RELATIVE_EV_TOLERANCE,
  solveGrowthForTarget,
  type DcfInputWithoutGrowth,
} from "../../src/domain/solver";
import type { DcfInput } from "../../src/domain/types";
import { dcfFixture } from "../fixtures/dcf-fixture";

function withoutGrowth(input: DcfInput): DcfInputWithoutGrowth {
  const { revenueGrowth: _revenueGrowth, ...assumptions } = input.assumptions;
  return { ...input, assumptions };
}

function targetAt(input: DcfInput, growth: number): number {
  const calculated = calculateDcf({ ...input, assumptions: { ...input.assumptions, revenueGrowth: growth } });
  if (calculated.status !== "valid") throw new Error("Test fixture did not produce a valid DCF.");
  return calculated.value.modeledEv;
}

describe("deterministic reverse growth solver", () => {
  it("documents the approved scan and bisection constants", () => {
    expect(REVERSE_SOLVER_INTERVALS).toBe(1000);
    expect(REVERSE_SOLVER_MAX_BISECTION_ITERATIONS).toBe(100);
    expect(REVERSE_SOLVER_GROWTH_TOLERANCE).toBe(0.0001);
    expect(REVERSE_SOLVER_RELATIVE_EV_TOLERANCE).toBe(0.0001);
  });

  it("recovers an ordinary known root within both approved tolerances", () => {
    const input = dcfFixture();
    const knownGrowth = 0.12345;
    const target = targetAt(input, knownGrowth);
    const result = solveGrowthForTarget(withoutGrowth(input), target);
    expect(result.status).toBe("solved");
    if (result.status !== "solved") return;
    expect(Math.abs(result.growth - knownGrowth)).toBeLessThanOrEqual(REVERSE_SOLVER_GROWTH_TOLERANCE);
    expect(result.evError).toBeLessThanOrEqual(REVERSE_SOLVER_RELATIVE_EV_TOLERANCE);
    expect(Math.abs(result.modeledEv - target) / Math.abs(target)).toBeLessThanOrEqual(REVERSE_SOLVER_RELATIVE_EV_TOLERANCE);
    expect(result.iterations).toBeGreaterThan(0);
    expect(result.iterations).toBeLessThanOrEqual(REVERSE_SOLVER_MAX_BISECTION_ITERATIONS);
  });

  it("accepts exact sampled roots and both supported-range endpoints", () => {
    const input = dcfFixture();
    for (const growth of [DEFAULT_GROWTH_RANGE.min, -0.2 + (0.7 * 500) / REVERSE_SOLVER_INTERVALS, DEFAULT_GROWTH_RANGE.max]) {
      const result = solveGrowthForTarget(withoutGrowth(input), targetAt(input, growth));
      expect(result.status).toBe("solved");
      if (result.status === "solved") {
        expect(result.growth).toBe(growth);
        expect(result.iterations).toBe(0);
        expect(result.evError).toBe(0);
      }
    }
  });

  it("returns a confirmed no-root only for strictly monotonic same-side samples", () => {
    const input = dcfFixture();
    const result = solveGrowthForTarget(withoutGrowth(input), 1_000_000);
    expect(result).toMatchObject({
      status: "no_root",
      minGrowth: DEFAULT_GROWTH_RANGE.min,
      maxGrowth: DEFAULT_GROWTH_RANGE.max,
    });
  });

  it("evaluates every one of the 1,001 prescribed scan points", () => {
    const input = dcfFixture();
    const spy = vi.spyOn(dcfModule, "calculateDcf");
    solveGrowthForTarget(withoutGrowth(input), 1_000_000);
    expect(spy).toHaveBeenCalledTimes(REVERSE_SOLVER_INTERVALS + 1);
    spy.mockRestore();
  });

  it("returns solver failure for a merely near-tolerance sample without a root bracket", () => {
    const input = dcfFixture();
    const endpointValue = targetAt(input, DEFAULT_GROWTH_RANGE.min);
    const target = endpointValue * (1 - REVERSE_SOLVER_RELATIVE_EV_TOLERANCE / 2);
    const result = solveGrowthForTarget(withoutGrowth(input), target);
    expect(result.status).toBe("solver_failure");
  });

  it("reports multiple distinct roots as solver failure instead of choosing one", () => {
    const input = dcfFixture();
    input.assumptions.forecastOperatingMargin = 0.2;
    input.effectiveTaxRate = 0.2;
    input.daToRevenue = 0.05;
    input.capexToRevenue = 0.02;
    input.operatingNwcToRevenue = 1;
    const result = solveGrowthForTarget(withoutGrowth(input), 2_400);
    expect(result.status).toBe("solver_failure");
    if (result.status === "solver_failure") expect(result.reason).toMatch(/multiple distinct/i);
  });

  it("does not call a non-monotonic no-bracket scan a confirmed no-root", () => {
    const input = dcfFixture();
    input.assumptions.forecastOperatingMargin = 0.2;
    input.effectiveTaxRate = 0.2;
    input.daToRevenue = 0.05;
    input.capexToRevenue = 0.02;
    input.operatingNwcToRevenue = 1;
    const result = solveGrowthForTarget(withoutGrowth(input), 3_000);
    expect(result.status).toBe("solver_failure");
  });

  it("does not classify an independently constructed tangential root as no-root", () => {
    const input = dcfFixture();
    input.assumptions.forecastOperatingMargin = 0.2;
    input.effectiveTaxRate = 0.2;
    input.daToRevenue = 0.05;
    input.capexToRevenue = 0.02;
    input.operatingNwcToRevenue = 1;
    const k = 0.2 * (1 - 0.2) + 0.05 - 0.02;
    const nwcRatio = 1;
    const wacc = input.assumptions.wacc;
    const terminalGrowth = input.assumptions.terminalGrowth;
    const independentlyExpandedEv = (growth: number) => {
      const q = 1 + growth;
      const cashFlows = Array.from({ length: 5 }, (_, index) =>
        input.baseRevenue * q ** index * (k + (k - nwcRatio) * growth));
      const pvForecast = cashFlows.reduce((sum, fcff, index) => sum + fcff / (1 + wacc) ** (index + 1), 0);
      const terminal = cashFlows[4] * (1 + terminalGrowth) / (wacc - terminalGrowth);
      return pvForecast + terminal / (1 + wacc) ** 5;
    };
    let left = -0.1;
    let right = -0.02;
    const goldenRatio = (Math.sqrt(5) - 1) / 2;
    let x1 = right - goldenRatio * (right - left);
    let x2 = left + goldenRatio * (right - left);
    for (let iteration = 0; iteration < 120; iteration += 1) {
      if (independentlyExpandedEv(x1) < independentlyExpandedEv(x2)) {
        left = x1;
        x1 = x2;
        x2 = left + goldenRatio * (right - left);
      } else {
        right = x2;
        x2 = x1;
        x1 = right - goldenRatio * (right - left);
      }
    }
    const tangentGrowth = (left + right) / 2;
    const tangentTarget = independentlyExpandedEv(tangentGrowth);
    const result = solveGrowthForTarget(withoutGrowth(input), tangentTarget);
    expect(result.status).toBe("solver_failure");
  });

  it("preserves invalid-input and numerical-failure classifications", () => {
    const invalid = dcfFixture();
    invalid.assumptions.wacc = 0.04;
    expect(solveGrowthForTarget(withoutGrowth(invalid), 1_000)).toMatchObject({ status: "invalid_input" });

    const numerical = dcfFixture();
    numerical.baseRevenue = 1e308;
    expect(solveGrowthForTarget(withoutGrowth(numerical), 1_000)).toMatchObject({ status: "solver_failure" });
  });

  it("rejects invalid targets and ranges without clamping growth", () => {
    const input = withoutGrowth(dcfFixture());
    expect(solveGrowthForTarget(input, Number.NaN)).toMatchObject({ status: "invalid_input" });
    expect(solveGrowthForTarget(input, 1_000, { min: -0.21, max: 0.5 })).toMatchObject({ status: "invalid_input" });
    expect(solveGrowthForTarget(input, 1_000, { min: 0.3, max: 0.3 })).toMatchObject({ status: "invalid_input" });
  });

  it("returns deterministic results for repeated identical inputs", () => {
    const input = dcfFixture();
    const without = withoutGrowth(input);
    const target = targetAt(input, 0.125);
    expect(solveGrowthForTarget(without, target)).toEqual(solveGrowthForTarget(without, target));
  });
});

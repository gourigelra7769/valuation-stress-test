import { describe, expect, it, vi } from "vitest";
import * as solverModule from "../../src/domain/solver";
import { calculateDcf } from "../../src/domain/dcf";
import {
  EQUAL_VALUE_MARGIN_INCREMENT,
  EQUAL_VALUE_MARGIN_STEPS,
  generateEqualValueChartSeries,
  splitSolvedSegments,
  type GrowthMarginChartPoint,
} from "../../src/domain/chart-series";
import type { DcfInputWithoutGrowth } from "../../src/domain/solver";
import type { DcfInput } from "../../src/domain/types";
import { dcfFixture } from "../fixtures/dcf-fixture";

function withoutGrowth(input: DcfInput): DcfInputWithoutGrowth {
  const { revenueGrowth: _revenueGrowth, ...assumptions } = input.assumptions;
  return { ...input, assumptions };
}

describe("equal-value growth-versus-margin series", () => {
  it("creates all 71 margins in order from 0% through 70%", () => {
    const input = withoutGrowth(dcfFixture());
    const series = generateEqualValueChartSeries(input, 3_000);
    expect(series).toHaveLength(71);
    expect(series[0].margin).toBe(0);
    expect(series[70].margin).toBe(0.7);
    expect(series.map((point) => point.margin)).toEqual(
      Array.from({ length: EQUAL_VALUE_MARGIN_STEPS + 1 }, (_, index) => Number((index * EQUAL_VALUE_MARGIN_INCREMENT).toFixed(2))),
    );
  });

  it("passes the same fixed target and a distinct margin assumption to the solver at every point", () => {
    const input = withoutGrowth(dcfFixture());
    const spy = vi.spyOn(solverModule, "solveGrowthForTarget");
    const targetEV = 123_456;
    const series = generateEqualValueChartSeries(input, targetEV);
    expect(spy).toHaveBeenCalledTimes(71);
    for (const [callIndex, call] of spy.mock.calls.entries()) {
      expect(call[1]).toBe(targetEV);
      expect(call[0].assumptions.forecastOperatingMargin).toBe(callIndex / 100);
    }
    expect(series).toHaveLength(71);
    spy.mockRestore();
  });

  it("independently recalculates representative solved points against the same target EV", () => {
    const original = dcfFixture();
    const knownMargin = 0.35;
    const knownGrowth = 0.12;
    const referenceInput = {
      ...original,
      assumptions: { ...original.assumptions, forecastOperatingMargin: knownMargin, revenueGrowth: knownGrowth },
    };
    const targetResult = calculateDcf(referenceInput);
    expect(targetResult.status).toBe("valid");
    if (targetResult.status !== "valid") return;

    const targetEV = targetResult.value.modeledEv;
    const series = generateEqualValueChartSeries(withoutGrowth(original), targetEV);
    const solved = series.filter((point) => point.status === "solved");
    expect(solved.length).toBeGreaterThan(0);
    expect(solved.some((point) => point.margin === knownMargin)).toBe(true);
    for (const point of solved.filter((item) => item.margin === 0.2 || item.margin === knownMargin || item.margin === 0.5)) {
      const reevaluated = calculateDcf({
        ...original,
        assumptions: { ...original.assumptions, forecastOperatingMargin: point.margin, revenueGrowth: point.growth },
      });
      expect(reevaluated.status).toBe("valid");
      if (reevaluated.status === "valid") {
        expect(Math.abs(reevaluated.value.modeledEv - targetEV) / Math.abs(targetEV)).toBeLessThanOrEqual(0.001);
      }
    }
  });

  it("keeps no-root, solver-failure, and invalid-input points explicit and valueless", () => {
    const input = withoutGrowth(dcfFixture());
    const spy = vi.spyOn(solverModule, "solveGrowthForTarget");
    spy.mockImplementation((atMargin) => {
      const margin = atMargin.assumptions.forecastOperatingMargin;
      if (margin === 0) return { status: "no_root", minGrowth: -0.2, maxGrowth: 0.5, assumptionsSummary: "test" };
      if (margin === 0.01) return { status: "solver_failure", reason: "synthetic failure" };
      if (margin === 0.02) return { status: "invalid_input", issues: [{ field: "wacc", code: "bad", message: "invalid WACC" }] };
      return { status: "solved", growth: 0.1, modeledEv: 100, evError: 0, iterations: 1 };
    });
    const series = generateEqualValueChartSeries(input, 100);
    expect(series.slice(0, 3)).toEqual([
      expect.objectContaining({ margin: 0, growth: null, status: "no_root", reason: expect.any(String) }),
      { margin: 0.01, growth: null, status: "solver_failure", reason: "synthetic failure" },
      { margin: 0.02, growth: null, status: "invalid_input", reason: "invalid WACC" },
    ]);
    expect(spy).toHaveBeenCalledTimes(71);
    spy.mockRestore();
  });

  it("preserves gaps as separate solved segments without connecting unavailable margins", () => {
    const points: GrowthMarginChartPoint[] = [
      { margin: 0, growth: 0.1, status: "solved" },
      { margin: 0.01, growth: 0.11, status: "solved" },
      { margin: 0.02, growth: null, status: "no_root", reason: "none" },
      { margin: 0.03, growth: 0.12, status: "solved" },
      { margin: 0.04, growth: null, status: "solver_failure", reason: "uncertain" },
      { margin: 0.05, growth: 0.13, status: "solved" },
    ];
    expect(splitSolvedSegments(points)).toEqual([
      points.slice(0, 2),
      points.slice(3, 4),
      points.slice(5, 6),
    ]);
  });

  it("uses the existing solver and preserves its supported growth range", () => {
    const input = withoutGrowth(dcfFixture());
    const customRange = { min: -0.1, max: 0.3 };
    const spy = vi.spyOn(solverModule, "solveGrowthForTarget");
    generateEqualValueChartSeries(input, 3_000, customRange);
    expect(spy).toHaveBeenCalledTimes(71);
    expect(spy.mock.calls.every((call) => call[2] === customRange)).toBe(true);
    spy.mockRestore();
  });
});

import {
  DEFAULT_GROWTH_RANGE,
  solveGrowthForTarget,
  type DcfInputWithoutGrowth,
  type SupportedGrowthRange,
} from "./solver";
import type { SolveResult } from "./types";

export const EQUAL_VALUE_MARGIN_STEPS = 70;
export const EQUAL_VALUE_MARGIN_INCREMENT = 0.01;

export type SolvedGrowthMarginPoint = {
  margin: number;
  growth: number;
  status: "solved";
};

export type UnavailableGrowthMarginPoint = {
  margin: number;
  growth: null;
  status: "no_root" | "solver_failure" | "invalid_input";
  reason: string;
};

export type GrowthMarginChartPoint = SolvedGrowthMarginPoint | UnavailableGrowthMarginPoint;

function failureReason(result: Exclude<SolveResult, { status: "solved" }>): string {
  if (result.status === "solver_failure") return result.reason;
  if (result.status === "invalid_input") return result.issues.map((issue) => issue.message).join(" ");
  return `No root exists within the supported growth range ${result.minGrowth} to ${result.maxGrowth}. ${result.assumptionsSummary}`;
}

/** Generate the 71 specified margins by calling the shared reverse solver at each one. */
export function generateEqualValueChartSeries(
  inputWithoutGrowth: DcfInputWithoutGrowth,
  targetEV: number,
  supportedRange: SupportedGrowthRange = DEFAULT_GROWTH_RANGE,
): GrowthMarginChartPoint[] {
  const points: GrowthMarginChartPoint[] = [];
  for (let index = 0; index <= EQUAL_VALUE_MARGIN_STEPS; index += 1) {
    const margin = Number((index * EQUAL_VALUE_MARGIN_INCREMENT).toFixed(2));
    const result = solveGrowthForTarget({
      ...inputWithoutGrowth,
      assumptions: { ...inputWithoutGrowth.assumptions, forecastOperatingMargin: margin },
    }, targetEV, supportedRange);
    if (result.status === "solved") {
      points.push({ margin, growth: result.growth, status: "solved" });
    } else {
      points.push({ margin, growth: null, status: result.status, reason: failureReason(result) });
    }
  }
  return points;
}

/** Split solved runs at unavailable points so chart renderers cannot bridge gaps. */
export function splitSolvedSegments(points: GrowthMarginChartPoint[]): SolvedGrowthMarginPoint[][] {
  const segments: SolvedGrowthMarginPoint[][] = [];
  let current: SolvedGrowthMarginPoint[] = [];
  for (const point of points) {
    if (point.status === "solved") {
      current.push(point);
    } else if (current.length > 0) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

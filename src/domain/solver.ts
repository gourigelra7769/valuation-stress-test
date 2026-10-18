import { calculateDcf } from "./dcf";
import { validateDcfInput } from "./validate";
import type { DcfInput, ModelAssumptions, SolveResult, ValidationIssue } from "./types";

export const REVERSE_SOLVER_INTERVALS = 1_000;
export const REVERSE_SOLVER_MAX_BISECTION_ITERATIONS = 100;
export const REVERSE_SOLVER_GROWTH_TOLERANCE = 0.0001;
export const REVERSE_SOLVER_RELATIVE_EV_TOLERANCE = 0.0001;
export const DEFAULT_GROWTH_RANGE = { min: -0.2, max: 0.5 } as const;

export type SupportedGrowthRange = { min: number; max: number };
export type DcfInputWithoutGrowth = Omit<DcfInput, "assumptions" | "targetEv"> & {
  assumptions: Omit<ModelAssumptions, "revenueGrowth">;
};

type Sample = { growth: number; modeledEv: number; residual: number };
type RootCandidate = { growth: number; modeledEv: number; evError: number; iterations: number };

const invalid = (field: string, code: string, message: string): SolveResult => ({
  status: "invalid_input",
  issues: [{ field, code, message }],
});

function withGrowth(input: DcfInputWithoutGrowth, growth: number): DcfInput {
  return { ...input, assumptions: { ...input.assumptions, revenueGrowth: growth } };
}

function relativeError(modeledEv: number, targetEv: number): number {
  if (targetEv === 0) return modeledEv === 0 ? 0 : Number.POSITIVE_INFINITY;
  return Math.abs(modeledEv - targetEv) / Math.abs(targetEv);
}

function solveBracket(
  input: DcfInputWithoutGrowth,
  targetEv: number,
  initialLeft: Sample,
  initialRight: Sample,
): RootCandidate | undefined {
  let left = initialLeft;
  let right = initialRight;
  let exactCandidate: Sample | undefined;

  for (let iteration = 1; iteration <= REVERSE_SOLVER_MAX_BISECTION_ITERATIONS; iteration += 1) {
    const middleGrowth = left.growth + (right.growth - left.growth) / 2;
    const middleResult = calculateDcf(withGrowth(input, middleGrowth));
    if (middleResult.status !== "valid") return undefined;
    const middle: Sample = {
      growth: middleGrowth,
      modeledEv: middleResult.value.modeledEv,
      residual: middleResult.value.modeledEv - targetEv,
    };

    if (middle.residual === 0) {
      exactCandidate = middle;
      right = middle;
    } else if ((left.residual < 0 && middle.residual > 0) || (left.residual > 0 && middle.residual < 0)) {
      right = middle;
    } else {
      left = middle;
    }

    const width = right.growth - left.growth;
    if (width <= REVERSE_SOLVER_GROWTH_TOLERANCE) {
      const candidateGrowth = exactCandidate?.growth ?? left.growth + width / 2;
      const independent = calculateDcf(withGrowth(input, candidateGrowth));
      if (independent.status !== "valid") return undefined;
      const error = relativeError(independent.value.modeledEv, targetEv);
      if (error <= REVERSE_SOLVER_RELATIVE_EV_TOLERANCE) {
        return {
          growth: candidateGrowth,
          modeledEv: independent.value.modeledEv,
          evError: error,
          iterations: iteration,
        };
      }
    }
  }
  return undefined;
}

function isStrictlyMonotonic(samples: Sample[]): boolean {
  if (samples.length < 2) return false;
  const increasing = samples[1].residual > samples[0].residual;
  if (samples[1].residual === samples[0].residual) return false;
  for (let index = 1; index < samples.length; index += 1) {
    if (increasing ? samples[index].residual <= samples[index - 1].residual
      : samples[index].residual >= samples[index - 1].residual) return false;
  }
  return true;
}

function assumptionsSummary(input: DcfInputWithoutGrowth): string {
  const { forecastOperatingMargin, wacc, terminalGrowth } = input.assumptions;
  return `margin=${forecastOperatingMargin}; WACC=${wacc}; terminalGrowth=${terminalGrowth}`;
}

/** Solve growth using a full deterministic scan followed by bisection. */
export function solveGrowthForTarget(
  inputWithoutGrowth: DcfInputWithoutGrowth,
  targetEV: number,
  supportedRange: SupportedGrowthRange = DEFAULT_GROWTH_RANGE,
): SolveResult {
  if (!Number.isFinite(targetEV)) return invalid("targetEV", "non_finite", "Target enterprise value must be finite.");
  if (!Number.isFinite(supportedRange.min) || !Number.isFinite(supportedRange.max) ||
      supportedRange.min < DEFAULT_GROWTH_RANGE.min || supportedRange.max > DEFAULT_GROWTH_RANGE.max ||
      supportedRange.min >= supportedRange.max) {
    return invalid("supportedRange", "invalid_growth_range", "Growth range must be finite, increasing, and within -20% to 50%.");
  }

  const issues = validateDcfInput(withGrowth(inputWithoutGrowth, supportedRange.min));
  if (issues.length > 0) return { status: "invalid_input", issues };

  const samples: Sample[] = [];
  let samplingFailure: string | undefined;
  for (let index = 0; index <= REVERSE_SOLVER_INTERVALS; index += 1) {
    const growth = index === 0 ? supportedRange.min
      : index === REVERSE_SOLVER_INTERVALS ? supportedRange.max
        : supportedRange.min + (supportedRange.max - supportedRange.min) * index / REVERSE_SOLVER_INTERVALS;
    const result = calculateDcf(withGrowth(inputWithoutGrowth, growth));
    if (result.status !== "valid") {
      samplingFailure ??= `DCF evaluation failed at sampled growth ${growth}.`;
      continue;
    }
    const residual = result.value.modeledEv - targetEV;
    if (!Number.isFinite(residual)) {
      samplingFailure ??= `Residual overflowed at sampled growth ${growth}.`;
      continue;
    }
    samples.push({ growth, modeledEv: result.value.modeledEv, residual });
  }
  if (samplingFailure) return { status: "solver_failure", reason: samplingFailure };

  const evTolerance = Math.abs(targetEV) * REVERSE_SOLVER_RELATIVE_EV_TOLERANCE;
  const exactSamples = samples.filter((sample) => sample.residual === 0);
  const roots: RootCandidate[] = [];
  for (const sample of exactSamples) {
    // A separate engine call verifies the selected sampled root independently.
    const verified = calculateDcf(withGrowth(inputWithoutGrowth, sample.growth));
    if (verified.status !== "valid") {
      return { status: "solver_failure", reason: `Exact sampled root failed independent DCF verification at growth ${sample.growth}.` };
    }
    const error = relativeError(verified.value.modeledEv, targetEV);
    if (error > REVERSE_SOLVER_RELATIVE_EV_TOLERANCE) {
      return { status: "solver_failure", reason: "Exact sampled root did not meet the independent EV-error tolerance." };
    }
    roots.push({ growth: sample.growth, modeledEv: verified.value.modeledEv, evError: error, iterations: 0 });
  }

  let bracketCount = 0;
  for (let index = 0; index < samples.length - 1; index += 1) {
    const left = samples[index];
    const right = samples[index + 1];
    if ((left.residual < 0 && right.residual > 0) || (left.residual > 0 && right.residual < 0)) {
      bracketCount += 1;
      const root = solveBracket(inputWithoutGrowth, targetEV, left, right);
      if (!root) return { status: "solver_failure", reason: "A sign-changing bracket did not converge within the approved bisection limits." };
      roots.push(root);
    }
  }

  roots.sort((a, b) => a.growth - b.growth);
  const distinctRoots: RootCandidate[] = [];
  for (const root of roots) {
    const previous = distinctRoots[distinctRoots.length - 1];
    if (!previous || Math.abs(root.growth - previous.growth) > REVERSE_SOLVER_GROWTH_TOLERANCE) distinctRoots.push(root);
  }
  if (distinctRoots.length > 1) {
    return { status: "solver_failure", reason: "Multiple distinct growth roots match the target EV within the approved tolerances." };
  }
  if (distinctRoots.length === 1) {
    const root = distinctRoots[0];
    return { status: "solved", growth: root.growth, modeledEv: root.modeledEv, evError: root.evError, iterations: root.iterations };
  }

  const nearTolerance = samples.some((sample) => sample.residual !== 0 && Math.abs(sample.residual) <= evTolerance);
  if (nearTolerance) {
    return { status: "solver_failure", reason: "A sampled residual approaches the EV tolerance without an exact root or sufficiently narrow sign-changing bracket." };
  }
  if (bracketCount > 0) {
    return { status: "solver_failure", reason: "A sign-changing bracket was present but no verified root was produced." };
  }

  const sameSide = samples.every((sample) => sample.residual > 0) || samples.every((sample) => sample.residual < 0);
  const endpointsSeparated = Math.abs(samples[0].residual) > evTolerance &&
    Math.abs(samples[samples.length - 1].residual) > evTolerance;
  if (sameSide && endpointsSeparated && isStrictlyMonotonic(samples)) {
    return {
      status: "no_root",
      minGrowth: supportedRange.min,
      maxGrowth: supportedRange.max,
      assumptionsSummary: assumptionsSummary(inputWithoutGrowth),
    };
  }
  return { status: "solver_failure", reason: "The sampled residuals do not establish a unique root or a confident monotonic no-root result." };
}

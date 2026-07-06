import type { Grade } from "./types";
import type { GradeScale } from "./grade-scale";

function accumulate(grades: Grade[]): { W: number; S: number } {
  let W = 0;
  let S = 0;
  for (const { value, weight } of grades) {
    if (Number.isNaN(value) || Number.isNaN(weight)) continue;
    S += value * weight;
    W += weight;
  }
  return { W, S };
}

export function gradeNeeded(
  grades: Grade[],
  target: number,
  weight: number
): number {
  if (weight <= 0) return NaN;
  const { W, S } = accumulate(grades);
  return (target * (W + weight) - S) / weight;
}

export function badGradesAffordable(
  grades: Grade[],
  target: number,
  badValue: number,
  scale: GradeScale
): number {
  if (!scale.higherIsBetter) return NaN;
  if (badValue >= target) return Infinity;
  const { W, S } = accumulate(grades);
  if (W > 0 && S / W < target) return 0;
  const n = Math.floor((S - target * W) / (target - badValue));
  return Math.max(0, n);
}

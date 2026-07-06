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
  const { W, S } = accumulate(grades);
  // A "bad" grade at or beyond the target in the good direction never pushes
  // the average past the floor → unlimited.
  const atOrBeyond = scale.higherIsBetter ? badValue >= target : badValue <= target;
  if (atOrBeyond) return Infinity;
  if (W > 0) {
    const avg = S / W;
    const pastFloor = scale.higherIsBetter ? avg < target : avg > target;
    if (pastFloor) return 0;
  }
  const n = Math.floor((S - target * W) / (target - badValue));
  return Math.max(0, n);
}

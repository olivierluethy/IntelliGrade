import type { Grade } from "./types";

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

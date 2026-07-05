import type { Grade } from "./types";
import type { GradeScale } from "./grade-scale";

export function weightedAverage(grades: Grade[]): number | null {
  let totalMarks = 0;
  let totalWeight = 0;
  for (const { value, weight } of grades) {
    if (Number.isNaN(value) || Number.isNaN(weight)) continue;
    totalMarks += value * weight;
    totalWeight += weight;
  }
  if (totalWeight <= 0) return null;
  return totalMarks / totalWeight;
}

export function gradeFromPoints(
  earned: number,
  max: number,
  scale: GradeScale
): number {
  return scale.fromPoints(earned, max);
}

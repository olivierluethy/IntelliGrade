import type { GradeScale } from "./grade-scale";

export type CurveResult = {
  originalGrade: number;
  adjustedGrade: number;
  delta: number;
};

export function applyCurve(
  earned: number,
  originalMax: number,
  adjustedMax: number,
  bonus: number,
  scale: GradeScale
): CurveResult {
  const originalGrade = scale.fromPoints(earned, originalMax);
  const raw = scale.fromPoints(earned, adjustedMax) + bonus;
  const adjustedGrade = Math.min(scale.max, Math.max(scale.min, raw));
  return { originalGrade, adjustedGrade, delta: adjustedGrade - originalGrade };
}

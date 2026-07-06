import type { GradeScale } from "./grade-scale";

export type VerifyResult = {
  percentage: number;
  grade: number;
  isPassing: boolean;
  matchesPublished?: boolean;
  difference?: number;
};

export function verifyGrade(
  earned: number,
  max: number,
  scale: GradeScale,
  published?: number
): VerifyResult {
  const percentage = max > 0 ? (earned / max) * 100 : NaN;
  const grade = scale.fromPoints(earned, max);
  const result: VerifyResult = {
    percentage,
    grade,
    isPassing: scale.isPassing(grade),
  };
  if (published !== undefined) {
    result.difference = grade - published;
    result.matchesPublished = Math.abs(grade - published) < 0.005;
  }
  return result;
}

import type { GradeScale } from "./grade-scale";

export type ParsedGrade =
  | { ok: true; value: number; weight: number }
  | { ok: false; error: string };

/**
 * Parse and validate the raw grade + weight strings from a grade input form.
 * Shared by AddGradeForm and GradeRow so validation stays consistent.
 */
export function parseGradeInput(
  value: string,
  weight: string,
  scale: GradeScale
): ParsedGrade {
  const v = parseFloat(value);
  if (Number.isNaN(v) || !scale.clampValid(v)) {
    return { ok: false, error: `Grade must be between ${scale.min} and ${scale.max}.` };
  }
  const w = parseFloat(weight);
  if (Number.isNaN(w) || w <= 0) {
    return { ok: false, error: "Weight must be a positive number." };
  }
  return { ok: true, value: v, weight: w };
}

import type { GradeScale } from "./GradeScale";
import { swissScale } from "./swiss";

export type { GradeScale } from "./GradeScale";
export { swissScale } from "./swiss";

export const SCALES: Record<string, GradeScale> = {
  [swissScale.id]: swissScale,
};

export function getScale(id: string): GradeScale {
  return SCALES[id] ?? swissScale;
}

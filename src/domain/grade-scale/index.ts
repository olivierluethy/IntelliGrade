import type { GradeScale } from "./GradeScale";
import { swissScale } from "./swiss";
import { germanyScale } from "./germany";
import { austriaScale } from "./austria";
import { franceScale } from "./france";
import { italyScale } from "./italy";

export type { GradeScale } from "./GradeScale";
export { swissScale } from "./swiss";

export const SCALES: Record<string, GradeScale> = {
  [swissScale.id]: swissScale,
  [germanyScale.id]: germanyScale,
  [austriaScale.id]: austriaScale,
  [franceScale.id]: franceScale,
  [italyScale.id]: italyScale,
};

export const SCALE_LIST: GradeScale[] = Object.values(SCALES);

export function getScale(id: string): GradeScale {
  return SCALES[id] ?? swissScale;
}

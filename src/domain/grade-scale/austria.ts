import type { GradeScale } from "./GradeScale";

export const austriaScale: GradeScale = {
  id: "austria",
  label: "Austria (1–5)",
  min: 1,
  max: 5,
  passThreshold: 4,
  higherIsBetter: false,
  isPassing(value) {
    return value <= this.passThreshold;
  },
  fromPoints(earned, max) {
    if (max <= 0) return NaN;
    return 5 - (4 * earned) / max;
  },
  colorFor(value) {
    if (value <= 2) return "text-emerald-400";
    if (value <= 3) return "text-lime-400";
    if (value <= 4) return "text-amber-400";
    return "text-rose-400";
  },
  format(value) {
    return value.toFixed(2);
  },
  clampValid(value) {
    return value >= this.min && value <= this.max;
  },
};

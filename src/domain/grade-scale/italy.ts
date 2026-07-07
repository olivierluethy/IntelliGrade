import type { GradeScale } from "./GradeScale";

export const italyScale: GradeScale = {
  id: "italy",
  label: "Italy (0–10)",
  min: 0,
  max: 10,
  passThreshold: 6,
  higherIsBetter: true,
  isPassing(value) {
    return value >= this.passThreshold;
  },
  fromPoints(earned, max) {
    if (max <= 0) return NaN;
    return (10 * earned) / max;
  },
  colorFor(value) {
    if (value >= 8) return "text-emerald-400";
    if (value >= 7) return "text-lime-400";
    if (value >= 6) return "text-amber-400";
    return "text-rose-400";
  },
  format(value) {
    return value.toFixed(2);
  },
  clampValid(value) {
    return value >= this.min && value <= this.max;
  },
};

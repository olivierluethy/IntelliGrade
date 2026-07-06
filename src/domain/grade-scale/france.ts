import type { GradeScale } from "./GradeScale";

export const franceScale: GradeScale = {
  id: "france",
  label: "France (0–20)",
  min: 0,
  max: 20,
  passThreshold: 10,
  higherIsBetter: true,
  isPassing(value) {
    return value >= this.passThreshold;
  },
  fromPoints(earned, max) {
    if (max <= 0) return NaN;
    return (20 * earned) / max;
  },
  colorFor(value) {
    if (value >= 16) return "text-emerald-400";
    if (value >= 14) return "text-lime-400";
    if (value >= 10) return "text-amber-400";
    return "text-rose-400";
  },
  format(value) {
    return value.toFixed(2);
  },
  clampValid(value) {
    return value >= this.min && value <= this.max;
  },
};

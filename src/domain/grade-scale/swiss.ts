import type { GradeScale } from "./GradeScale";

export const swissScale: GradeScale = {
  id: "swiss",
  label: "Switzerland (1–6)",
  min: 1,
  max: 6,
  passThreshold: 4,
  higherIsBetter: true,
  isPassing(value) {
    return value >= this.passThreshold;
  },
  fromPoints(earned, max) {
    if (max <= 0) return NaN;
    return (earned * 5) / max + 1;
  },
  colorFor(value) {
    if (value >= 5.5) return "text-emerald-400";
    if (value >= 4.5) return "text-lime-400";
    if (value >= 4) return "text-amber-400";
    return "text-rose-400";
  },
  format(value) {
    return value.toFixed(2);
  },
  clampValid(value) {
    return value >= this.min && value <= this.max;
  },
};

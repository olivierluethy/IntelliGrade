import { describe, it, expect } from "vitest";
import { weightedAverage, gradeFromPoints } from "./calc";
import { swissScale } from "./grade-scale/swiss";
import type { Grade } from "./types";

const g = (value: number, weight: number): Grade => ({
  id: Math.random().toString(),
  value,
  weight,
});

describe("weightedAverage", () => {
  it("returns null for empty list", () => {
    expect(weightedAverage([])).toBeNull();
  });

  it("returns null when total weight is 0", () => {
    expect(weightedAverage([g(5, 0), g(6, 0)])).toBeNull();
  });

  it("averages a single grade to itself", () => {
    expect(weightedAverage([g(5.5, 1)])).toBeCloseTo(5.5);
  });

  it("weights correctly", () => {
    // (5*1 + 6*2) / (1+2) = 17/3 = 5.6667
    expect(weightedAverage([g(5, 1), g(6, 2)])).toBeCloseTo(5.6667, 3);
  });

  it("handles fractional weights", () => {
    // (4*0.5 + 6*1) / 1.5 = 8/1.5 = 5.3333
    expect(weightedAverage([g(4, 0.5), g(6, 1)])).toBeCloseTo(5.3333, 3);
  });
});

describe("gradeFromPoints", () => {
  it("delegates to the scale", () => {
    expect(gradeFromPoints(20, 20, swissScale)).toBeCloseTo(6);
  });

  it("returns NaN when max is 0", () => {
    expect(Number.isNaN(gradeFromPoints(5, 0, swissScale))).toBe(true);
  });
});

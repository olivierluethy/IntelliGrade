import { describe, it, expect } from "vitest";
import { gradeNeeded, badGradesAffordable } from "./scenario";
import type { Grade } from "./types";
import { swissScale } from "./grade-scale/swiss";

const g = (value: number, weight: number): Grade => ({
  id: Math.random().toString(),
  value,
  weight,
});

describe("gradeNeeded", () => {
  it("with no prior grades, needs exactly the target", () => {
    expect(gradeNeeded([], 5, 1)).toBeCloseTo(5);
  });

  it("single prior grade, weight 1 → correct inverse", () => {
    // (5*(1+1) - 4) / 1 = 6 ; check: (4 + 6*1)/2 = 5
    expect(gradeNeeded([g(4, 1)], 5, 1)).toBeCloseTo(6);
  });

  it("weighted next assessment (w != 1)", () => {
    // (5*(1+2) - 4) / 2 = 11/2 = 5.5 ; check: (4 + 5.5*2)/3 = 5
    expect(gradeNeeded([g(4, 1)], 5, 2)).toBeCloseTo(5.5);
  });

  it("impossible case returns a value above the scale max", () => {
    // (5*(1+1) - 3) / 1 = 7  (> 6)
    expect(gradeNeeded([g(3, 1)], 5, 1)).toBeCloseTo(7);
  });

  it("already-secured case returns a value below the scale min", () => {
    // (4*(3+1) - 18) / 1 = -2  (< 1)
    expect(gradeNeeded([g(6, 3)], 4, 1)).toBeCloseTo(-2);
  });

  it("weight <= 0 → NaN", () => {
    expect(Number.isNaN(gradeNeeded([g(4, 1)], 5, 0))).toBe(true);
  });
});

describe("badGradesAffordable", () => {
  it("counts affordable bad grades holding the target (inclusive boundary)", () => {
    // grades [6 w1], target 5, bad 4: floor((6 - 5)/(5-4)) = 1
    // check n=1: (6+4)/2 = 5 >= 5 ✓ ; n=2: (6+8)/3 = 4.67 < 5 ✗
    expect(badGradesAffordable([g(6, 1)], 5, 4, swissScale)).toBe(1);
  });

  it("counts correctly with weighted existing grades", () => {
    // grades [6 w2], target 5, bad 4: floor((12 - 10)/1) = 2
    expect(badGradesAffordable([g(6, 2)], 5, 4, swissScale)).toBe(2);
  });

  it("returns 0 when already below target", () => {
    expect(badGradesAffordable([g(4, 1)], 5, 4, swissScale)).toBe(0);
  });

  it("returns Infinity when the bad value is at or above the target", () => {
    expect(badGradesAffordable([g(5, 1)], 5, 5, swissScale)).toBe(Infinity);
  });

  it("returns NaN for a lower-is-better scale (unsupported)", () => {
    const reversed = { ...swissScale, higherIsBetter: false };
    expect(Number.isNaN(badGradesAffordable([g(6, 1)], 5, 4, reversed))).toBe(true);
  });
});

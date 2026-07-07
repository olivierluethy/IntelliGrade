import { describe, it, expect } from "vitest";
import { gradeNeeded, gradeNeededPerExam, badGradesAffordable } from "./scenario";
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

describe("gradeNeededPerExam", () => {
  // grades [3,4,6,5] all weight 1 → S=18, W=4 (avg 4.5)
  const grades = [g(3, 1), g(4, 1), g(6, 1), g(5, 1)];

  it("finds the uniform grade needed across N equally-weighted exams", () => {
    // target 4 over 5 exams: (4*(4+5) - 18) / 5 = 18/5 = 3.6
    // check: (18 + 3.6*5) / (4+5) = 36/9 = 4 ✓
    expect(gradeNeededPerExam(grades, 4, 5)).toBeCloseTo(3.6);
  });

  it("with one exam equals gradeNeeded of weight 1", () => {
    expect(gradeNeededPerExam(grades, 5, 1)).toBeCloseTo(gradeNeeded(grades, 5, 1));
  });

  it("respects a per-exam weight", () => {
    // 2 exams of weight 2 == one lump of weight 4
    expect(gradeNeededPerExam(grades, 5, 2, 2)).toBeCloseTo(
      gradeNeeded(grades, 5, 4)
    );
  });

  it("returns NaN for a non-positive count or weight", () => {
    expect(Number.isNaN(gradeNeededPerExam(grades, 4, 0))).toBe(true);
    expect(Number.isNaN(gradeNeededPerExam(grades, 4, 3, 0))).toBe(true);
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

  it("supports lower-is-better scales", () => {
    const reversed = { ...swissScale, higherIsBetter: false };
    // grades [2 w1] (good), target 4, bad 5 (worse): floor((2 - 4)/(4 - 5)) = 2
    expect(badGradesAffordable([g(2, 1)], 4, 5, reversed)).toBe(2);
    // bad grade better than target → unlimited
    expect(badGradesAffordable([g(2, 1)], 4, 3, reversed)).toBe(Infinity);
    // already worse than target → 0
    expect(badGradesAffordable([g(5, 1)], 4, 6, reversed)).toBe(0);
  });

  it("returns 0 when current average exactly equals target", () => {
    expect(badGradesAffordable([g(5, 1)], 5, 4, swissScale)).toBe(0);
  });
});

import { describe, it, expect } from "vitest";
import { gradeNeeded } from "./scenario";
import type { Grade } from "./types";

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

import { describe, it, expect } from "vitest";
import { verifyGrade } from "./verify";
import { swissScale } from "./grade-scale/swiss";

describe("verifyGrade", () => {
  it("full marks → top grade and 100%", () => {
    const r = verifyGrade(20, 20, swissScale);
    expect(r.grade).toBeCloseTo(6);
    expect(r.percentage).toBeCloseTo(100);
    expect(r.isPassing).toBe(true);
  });

  it("zero → min grade and 0%", () => {
    const r = verifyGrade(0, 20, swissScale);
    expect(r.grade).toBeCloseTo(1);
    expect(r.percentage).toBeCloseTo(0);
    expect(r.isPassing).toBe(false);
  });

  it("half marks → mid grade and 50%", () => {
    const r = verifyGrade(10, 20, swissScale);
    expect(r.grade).toBeCloseTo(3.5);
    expect(r.percentage).toBeCloseTo(50);
  });

  it("passing boundary at threshold", () => {
    // grade 4 requires 60% on the Swiss linear scale: (12*5)/20 + 1 = 4
    expect(verifyGrade(12, 20, swissScale).isPassing).toBe(true);
    expect(verifyGrade(11, 20, swissScale).isPassing).toBe(false);
  });

  it("published match → difference 0, matches true", () => {
    const r = verifyGrade(20, 20, swissScale, 6);
    expect(r.difference).toBeCloseTo(0);
    expect(r.matchesPublished).toBe(true);
  });

  it("published mismatch → correct signed difference, matches false", () => {
    const r = verifyGrade(20, 20, swissScale, 5.5); // computed 6
    expect(r.difference).toBeCloseTo(0.5);
    expect(r.matchesPublished).toBe(false);
  });

  it("omits published fields when no published grade given", () => {
    const r = verifyGrade(10, 20, swissScale);
    expect(r.matchesPublished).toBeUndefined();
    expect(r.difference).toBeUndefined();
  });

  it("max <= 0 → NaN grade and percentage", () => {
    const r = verifyGrade(5, 0, swissScale);
    expect(Number.isNaN(r.grade)).toBe(true);
    expect(Number.isNaN(r.percentage)).toBe(true);
  });
});

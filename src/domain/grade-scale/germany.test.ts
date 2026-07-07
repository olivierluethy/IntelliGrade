import { describe, it, expect } from "vitest";
import { germanyScale as s } from "./germany";

describe("germanyScale", () => {
  it("has the right metadata", () => {
    expect(s.id).toBe("germany");
    expect([s.min, s.max, s.passThreshold]).toEqual([1, 6, 4]);
    expect(s.higherIsBetter).toBe(false);
  });
  it("maps points (full → 1 best, zero → 6 worst, half → 3.5)", () => {
    expect(s.fromPoints(20, 20)).toBeCloseTo(1);
    expect(s.fromPoints(0, 20)).toBeCloseTo(6);
    expect(s.fromPoints(10, 20)).toBeCloseTo(3.5);
    expect(Number.isNaN(s.fromPoints(5, 0))).toBe(true);
  });
  it("passes at or below the threshold (lower is better)", () => {
    expect(s.isPassing(4)).toBe(true);
    expect(s.isPassing(4.5)).toBe(false);
    expect(s.isPassing(1)).toBe(true);
  });
  it("validates the range", () => {
    expect(s.clampValid(1)).toBe(true);
    expect(s.clampValid(6)).toBe(true);
    expect(s.clampValid(6.5)).toBe(false);
  });
});

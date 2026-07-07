import { describe, it, expect } from "vitest";
import { austriaScale as s } from "./austria";

describe("austriaScale", () => {
  it("has the right metadata", () => {
    expect(s.id).toBe("austria");
    expect([s.min, s.max, s.passThreshold]).toEqual([1, 5, 4]);
    expect(s.higherIsBetter).toBe(false);
  });
  it("maps points (full → 1 best, zero → 5 worst, half → 3)", () => {
    expect(s.fromPoints(20, 20)).toBeCloseTo(1);
    expect(s.fromPoints(0, 20)).toBeCloseTo(5);
    expect(s.fromPoints(10, 20)).toBeCloseTo(3);
    expect(Number.isNaN(s.fromPoints(5, 0))).toBe(true);
  });
  it("passes at or below the threshold", () => {
    expect(s.isPassing(4)).toBe(true);
    expect(s.isPassing(5)).toBe(false);
  });
  it("validates the range", () => {
    expect(s.clampValid(1)).toBe(true);
    expect(s.clampValid(5)).toBe(true);
    expect(s.clampValid(0)).toBe(false);
  });
});

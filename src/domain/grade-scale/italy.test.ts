import { describe, it, expect } from "vitest";
import { italyScale as s } from "./italy";

describe("italyScale", () => {
  it("has the right metadata", () => {
    expect(s.id).toBe("italy");
    expect([s.min, s.max, s.passThreshold]).toEqual([0, 10, 6]);
    expect(s.higherIsBetter).toBe(true);
  });
  it("maps points (full → 10, zero → 0, half → 5)", () => {
    expect(s.fromPoints(20, 20)).toBeCloseTo(10);
    expect(s.fromPoints(0, 20)).toBeCloseTo(0);
    expect(s.fromPoints(10, 20)).toBeCloseTo(5);
    expect(Number.isNaN(s.fromPoints(5, 0))).toBe(true);
  });
  it("passes at or above the threshold", () => {
    expect(s.isPassing(6)).toBe(true);
    expect(s.isPassing(5.5)).toBe(false);
  });
  it("validates the range", () => {
    expect(s.clampValid(0)).toBe(true);
    expect(s.clampValid(10)).toBe(true);
    expect(s.clampValid(11)).toBe(false);
  });
});

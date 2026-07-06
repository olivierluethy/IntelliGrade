import { describe, it, expect } from "vitest";
import { franceScale as s } from "./france";

describe("franceScale", () => {
  it("has the right metadata", () => {
    expect(s.id).toBe("france");
    expect([s.min, s.max, s.passThreshold]).toEqual([0, 20, 10]);
    expect(s.higherIsBetter).toBe(true);
  });
  it("maps points (full → 20, zero → 0, half → 10)", () => {
    expect(s.fromPoints(20, 20)).toBeCloseTo(20);
    expect(s.fromPoints(0, 20)).toBeCloseTo(0);
    expect(s.fromPoints(10, 20)).toBeCloseTo(10);
    expect(Number.isNaN(s.fromPoints(5, 0))).toBe(true);
  });
  it("passes at or above the threshold", () => {
    expect(s.isPassing(10)).toBe(true);
    expect(s.isPassing(9.5)).toBe(false);
  });
  it("validates the range", () => {
    expect(s.clampValid(0)).toBe(true);
    expect(s.clampValid(20)).toBe(true);
    expect(s.clampValid(21)).toBe(false);
  });
});

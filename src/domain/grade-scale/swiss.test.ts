import { describe, it, expect } from "vitest";
import { swissScale } from "./swiss";

describe("swissScale", () => {
  it("has Swiss bounds", () => {
    expect(swissScale.min).toBe(1);
    expect(swissScale.max).toBe(6);
    expect(swissScale.passThreshold).toBe(4);
    expect(swissScale.higherIsBetter).toBe(true);
  });

  it("computes grade from points: full marks = 6", () => {
    expect(swissScale.fromPoints(20, 20)).toBeCloseTo(6);
  });

  it("computes grade from points: zero = 1", () => {
    expect(swissScale.fromPoints(0, 20)).toBeCloseTo(1);
  });

  it("computes grade from points: half = 3.5", () => {
    expect(swissScale.fromPoints(10, 20)).toBeCloseTo(3.5);
  });

  it("passing at and above 4.0", () => {
    expect(swissScale.isPassing(4)).toBe(true);
    expect(swissScale.isPassing(3.9)).toBe(false);
    expect(swissScale.isPassing(6)).toBe(true);
  });

  it("clampValid rejects out of range", () => {
    expect(swissScale.clampValid(0.9)).toBe(false);
    expect(swissScale.clampValid(6.1)).toBe(false);
    expect(swissScale.clampValid(4.25)).toBe(true);
  });

  it("format shows two decimals", () => {
    expect(swissScale.format(5.2)).toBe("5.20");
  });

  it("colorFor returns a non-empty string differing by band", () => {
    expect(swissScale.colorFor(5.5)).not.toBe(swissScale.colorFor(3.5));
    expect(swissScale.colorFor(5.5).length).toBeGreaterThan(0);
  });
});

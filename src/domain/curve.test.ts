import { describe, it, expect } from "vitest";
import { applyCurve } from "./curve";
import { swissScale } from "./grade-scale/swiss";

describe("applyCurve", () => {
  it("lowering the adjusted max raises the grade", () => {
    // original: (15*5)/20+1 = 4.75; adjusted max 18: (15*5)/18+1 = 5.1667
    const r = applyCurve(15, 20, 18, 0, swissScale);
    expect(r.originalGrade).toBeCloseTo(4.75);
    expect(r.adjustedGrade).toBeCloseTo(5.1667, 3);
    expect(r.delta).toBeGreaterThan(0);
  });

  it("adds the flat bonus", () => {
    const r = applyCurve(15, 20, 20, 0.5, swissScale);
    expect(r.adjustedGrade).toBeCloseTo(5.25); // 4.75 + 0.5
    expect(r.delta).toBeCloseTo(0.5);
  });

  it("clamps at the scale max (cannot exceed 6.0)", () => {
    const r = applyCurve(20, 20, 20, 1, swissScale); // 6 + 1 → clamp 6
    expect(r.adjustedGrade).toBeCloseTo(6);
    expect(r.delta).toBeCloseTo(0);
  });

  it("clamps at the scale min", () => {
    const r = applyCurve(0, 20, 20, -1, swissScale); // 1 - 1 → clamp 1
    expect(r.adjustedGrade).toBeCloseTo(1);
  });

  it("identical max with zero bonus → delta 0", () => {
    const r = applyCurve(15, 20, 20, 0, swissScale);
    expect(r.delta).toBeCloseTo(0);
    expect(r.adjustedGrade).toBeCloseTo(r.originalGrade);
  });
});

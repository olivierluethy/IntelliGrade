import { describe, it, expect } from "vitest";
import { gradeChangePercent, originalFromRaisePercent } from "./gradeChange";

describe("gradeChangePercent", () => {
  it("increase → positive percent", () => {
    expect(gradeChangePercent(4, 5)).toBeCloseTo(25); // (5-4)/4*100
  });
  it("decrease → negative percent", () => {
    expect(gradeChangePercent(5, 4)).toBeCloseTo(-20); // (4-5)/5*100
  });
  it("no change → 0%", () => {
    expect(gradeChangePercent(4.5, 4.5)).toBeCloseTo(0);
  });
});

describe("originalFromRaisePercent", () => {
  it("is the correct inverse: raised/(1+pct/100), not raised*(1-pct/100)", () => {
    // raised 5 after a 25% increase → original 4
    expect(originalFromRaisePercent(5, 25)).toBeCloseTo(4);
    // the old buggy formula would give 5*(1-0.25) = 3.75 — assert we do NOT get that
    expect(originalFromRaisePercent(5, 25)).not.toBeCloseTo(3.75);
  });

  it("round-trips with gradeChangePercent", () => {
    const original = 4.2;
    const raised = 5.1;
    const pct = gradeChangePercent(original, raised);
    expect(originalFromRaisePercent(raised, pct)).toBeCloseTo(original);
  });
});

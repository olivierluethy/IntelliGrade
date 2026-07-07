import { describe, it, expect } from "vitest";
import { parseGradeInput } from "./parseGradeInput";
import { swissScale } from "./grade-scale/swiss";

describe("parseGradeInput", () => {
  it("accepts a valid grade and weight", () => {
    expect(parseGradeInput("5.5", "2", swissScale)).toEqual({
      ok: true,
      value: 5.5,
      weight: 2,
    });
  });

  it("rejects a non-numeric grade", () => {
    const r = parseGradeInput("abc", "1", swissScale);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/between 1 and 6/);
  });

  it("rejects an out-of-range grade using the scale bounds", () => {
    const r = parseGradeInput("7", "1", swissScale);
    expect(r).toEqual({ ok: false, error: "Grade must be between 1 and 6." });
  });

  it("rejects a non-positive or non-numeric weight", () => {
    expect(parseGradeInput("5", "0", swissScale)).toEqual({
      ok: false,
      error: "Weight must be a positive number.",
    });
    expect(parseGradeInput("5", "-1", swissScale).ok).toBe(false);
    expect(parseGradeInput("5", "x", swissScale).ok).toBe(false);
  });
});

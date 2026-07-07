import { describe, it, expect } from "vitest";
import { getScale, SCALES, SCALE_LIST } from "./index";

describe("scale registry", () => {
  it("resolves all five scales by id", () => {
    for (const id of ["swiss", "germany", "austria", "france", "italy"]) {
      expect(getScale(id).id).toBe(id);
    }
  });
  it("SCALE_LIST contains all registered scales", () => {
    expect(SCALE_LIST).toHaveLength(Object.keys(SCALES).length);
    expect(SCALE_LIST.map((s) => s.id)).toContain("germany");
  });
  it("falls back to swiss for an unknown id", () => {
    expect(getScale("atlantis").id).toBe("swiss");
  });
});

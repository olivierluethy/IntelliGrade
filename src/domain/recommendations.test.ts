import { describe, it, expect } from "vitest";
import { computeRecommendations } from "./recommendations";
import { swissScale } from "./grade-scale/swiss";
import { germanyScale } from "./grade-scale/germany";
import type { Subject, Semester } from "./types";

let seq = 0;
const g = (value: number, weight = 1) => ({ id: `grade-${seq++}`, value, weight });
const subject = (name: string, grades = [] as ReturnType<typeof g>[], extra: Partial<Subject> = {}): Subject => ({
  id: `subj-${name}`,
  name,
  grades,
  exams: [],
  ...extra,
});
const sem = (subjects: Subject[], scaleId = swissScale.id): Semester => ({
  id: "sem1",
  name: "HS25",
  scaleId,
  subjects,
});

const byId = (recs: ReturnType<typeof computeRecommendations>) =>
  Object.fromEntries(recs.map((r) => [r.subjectId, r]));

describe("computeRecommendations", () => {
  it("flags a below-target subject as high severity with the grade needed", () => {
    const recs = computeRecommendations(sem([subject("Math", [g(3)], { targetGrade: 4 })]));
    const rec = recs.find((r) => r.subjectId === "subj-Math")!;
    expect(rec.kind).toBe("below-target");
    expect(rec.severity).toBe("high");
    // gradeNeeded([3], 4, 1) = 5 → mention it
    expect(rec.text).toMatch(/5/);
  });

  it("says a below-target subject is unreachable when one grade can't fix it", () => {
    const rec = computeRecommendations(
      sem([subject("Hard", [g(2)], { targetGrade: 5.5 })])
    ).find((r) => r.subjectId === "subj-Hard")!;
    expect(rec.kind).toBe("below-target");
    expect(rec.text).toMatch(/can't|cannot|not enough|one grade/i);
  });

  it("flags a trending-down subject (not below target) as medium", () => {
    const rec = computeRecommendations(
      sem([subject("Bio", [g(6), g(6), g(4.5), g(4.5)], { targetGrade: 4 })])
    ).find((r) => r.subjectId === "subj-Bio")!;
    expect(rec.kind).toBe("trending-down");
    expect(rec.severity).toBe("medium");
  });

  it("suggests setting a target when grades exist but no target", () => {
    const rec = computeRecommendations(sem([subject("Chem", [g(5)])])).find(
      (r) => r.subjectId === "subj-Chem"
    )!;
    expect(rec.kind).toBe("no-target");
    expect(rec.severity).toBe("low");
  });

  it("suggests adding grades for an empty subject", () => {
    const rec = computeRecommendations(sem([subject("Art")])).find(
      (r) => r.subjectId === "subj-Art"
    )!;
    expect(rec.kind).toBe("no-grades");
  });

  it("gives an on-track subject a positive note with the cushion count", () => {
    const rec = computeRecommendations(
      sem([subject("Easy", [g(6), g(6)], { targetGrade: 4 })])
    ).find((r) => r.subjectId === "subj-Easy")!;
    expect(rec.kind).toBe("on-track");
    // badGradesAffordable([6,6], 4, 1, swiss) = 1
    expect(rec.text).toMatch(/1/);
  });

  it("is direction-aware: below-target for a lower-is-better scale", () => {
    // germany: avg 5 (worse than target 4 since higher numbers are worse)
    const rec = computeRecommendations(
      sem([subject("DE", [g(5)], { targetGrade: 4 })], germanyScale.id)
    ).find((r) => r.subjectId === "subj-DE")!;
    expect(rec.kind).toBe("below-target");
  });

  it("emits at most one recommendation per subject and sorts high→low", () => {
    const recs = computeRecommendations(
      sem([
        subject("Low", [g(3)], { targetGrade: 4 }), // high
        subject("Mid", [g(6), g(6), g(5), g(5)], { targetGrade: 4 }), // trending down (medium)
        subject("None", []), // low
      ])
    );
    const ids = byId(recs);
    expect(Object.keys(ids)).toHaveLength(3);
    expect(recs.map((r) => r.severity)).toEqual(["high", "medium", "low"]);
  });
});

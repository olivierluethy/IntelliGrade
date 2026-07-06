import { describe, it, expect } from "vitest";
import { computeAlerts, EXAM_SOON_DAYS } from "./alerts";
import type { Semester, Subject } from "./types";

const today = new Date(2026, 6, 6); // 2026-07-06 (local)

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function subject(over: Partial<Subject> = {}): Subject {
  return { id: "sub", name: "Math", grades: [], exams: [], ...over };
}

function semester(sub: Subject): Semester {
  return { id: "sem", name: "HS25", scaleId: "swiss", subjects: [sub] };
}

describe("computeAlerts", () => {
  it("returns [] for no semesters", () => {
    expect(computeAlerts([], today)).toEqual([]);
  });

  it("flags an exam within EXAM_SOON_DAYS (boundary at 0 and 7, not 8)", () => {
    const mk = (d: string) =>
      computeAlerts(
        [semester(subject({ grades: [{ id: "g", value: 5, weight: 1 }], exams: [{ id: "e", name: "T", date: d, weight: 1 }] }))],
        today
      );
    expect(mk(iso(2026, 7, 6))[0].kind).toBe("exam-soon"); // 0 days
    expect(mk(iso(2026, 7, 13))[0].kind).toBe("exam-soon"); // 7 days
    expect(mk(iso(2026, 7, 14)).some((a) => a.kind === "exam-soon")).toBe(false); // 8 days
    expect(EXAM_SOON_DAYS).toBe(7);
  });

  it("flags a past exam as ungraded with correct daysAgo", () => {
    const alerts = computeAlerts(
      [semester(subject({ grades: [{ id: "g", value: 5, weight: 1 }], exams: [{ id: "e", name: "T", date: iso(2026, 7, 4), weight: 1 }] }))],
      today
    );
    const a = alerts.find((x) => x.kind === "exam-ungraded");
    expect(a).toBeTruthy();
    expect(a!.kind === "exam-ungraded" && a!.daysAgo).toBe(2);
  });

  it("flags below-target only when average is below the target", () => {
    const below = computeAlerts(
      [semester(subject({ targetGrade: 5, grades: [{ id: "g", value: 4, weight: 1 }] }))],
      today
    );
    expect(below.some((a) => a.kind === "below-target")).toBe(true);

    const atOrAbove = computeAlerts(
      [semester(subject({ targetGrade: 5, grades: [{ id: "g", value: 5, weight: 1 }] }))],
      today
    );
    expect(atOrAbove.some((a) => a.kind === "below-target")).toBe(false);
  });

  it("flags a subject with no grades", () => {
    const alerts = computeAlerts([semester(subject({ grades: [] }))], today);
    expect(alerts.some((a) => a.kind === "no-grades")).toBe(true);
  });

  it("orders urgency-first: exam-soon, exam-ungraded, below-target, no-grades", () => {
    const sub = subject({
      targetGrade: 5,
      grades: [{ id: "g", value: 4, weight: 1 }],
      exams: [
        { id: "e1", name: "Soon", date: iso(2026, 7, 8), weight: 1 },
        { id: "e2", name: "Past", date: iso(2026, 7, 1), weight: 1 },
      ],
    });
    const kinds = computeAlerts([semester(sub)], today).map((a) => a.kind);
    expect(kinds).toEqual(["exam-soon", "exam-ungraded", "below-target"]);
  });
});

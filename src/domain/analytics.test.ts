import { describe, it, expect } from "vitest";
import { computeSubjectStats, computeSemesterStats } from "./analytics";
import { swissScale } from "./grade-scale/swiss";
import { germanyScale } from "./grade-scale/germany";
import type { Subject, Semester } from "./types";

let seq = 0;
const g = (value: number, weight = 1, date?: string) => ({
  id: `grade-${seq++}`,
  value,
  weight,
  date,
});
const subject = (name: string, grades = [] as ReturnType<typeof g>[], extra: Partial<Subject> = {}): Subject => ({
  id: `subj-${name}`,
  name,
  grades,
  exams: [],
  ...extra,
});

describe("computeSubjectStats", () => {
  it("summarizes a graded subject (higher-is-better)", () => {
    const s = computeSubjectStats(subject("Math", [g(5, 1), g(4, 1), g(6, 2)]), swissScale);
    expect(s.count).toBe(3);
    // weighted avg: (5 + 4 + 12) / 4 = 5.25
    expect(s.average).toBeCloseTo(5.25);
    expect(s.best).toBe(6); // higher is better
    expect(s.worst).toBe(4);
    expect(s.passing).toBe(true); // 5.25 >= 4
  });

  it("handles an ungraded subject", () => {
    const s = computeSubjectStats(subject("Empty"), swissScale);
    expect(s).toMatchObject({
      count: 0,
      average: null,
      best: null,
      worst: null,
      trend: "na",
      passing: null,
      distanceToTarget: null,
    });
  });

  it("computes best/worst by scale direction (lower-is-better)", () => {
    const s = computeSubjectStats(subject("DE", [g(1.5), g(4), g(2.5)]), germanyScale);
    expect(s.best).toBe(1.5); // lower is better
    expect(s.worst).toBe(4);
    // avg (1.5+4+2.5)/3 = 2.667, passing (<=4)
    expect(s.passing).toBe(true);
  });

  it("distanceToTarget is signed toward the good direction", () => {
    const above = computeSubjectStats(subject("A", [g(5)], { targetGrade: 4 }), swissScale);
    expect(above.distanceToTarget).toBeCloseTo(1); // 5 - 4, on the good side
    const below = computeSubjectStats(subject("B", [g(3)], { targetGrade: 4 }), swissScale);
    expect(below.distanceToTarget).toBeCloseTo(-1);
    // lower-is-better: avg 3, target 4 → on the good side (3 <= 4) → +1
    const de = computeSubjectStats(subject("C", [g(3)], { targetGrade: 4 }), germanyScale);
    expect(de.distanceToTarget).toBeCloseTo(1);
  });

  it("detects an upward trend by date order (higher-is-better)", () => {
    const s = computeSubjectStats(
      subject("T", [
        g(3, 1, "2026-01-01"),
        g(3.5, 1, "2026-02-01"),
        g(5, 1, "2026-03-01"),
        g(5.5, 1, "2026-04-01"),
      ]),
      swissScale
    );
    expect(s.trend).toBe("up");
  });

  it("detects a downward trend (lower-is-better means rising numbers are worse)", () => {
    const s = computeSubjectStats(
      subject("T", [g(1.5), g(2), g(4), g(5)]),
      germanyScale
    );
    expect(s.trend).toBe("down");
  });

  it("reports 'na' trend with fewer than two grades", () => {
    expect(computeSubjectStats(subject("T", [g(5)]), swissScale).trend).toBe("na");
  });
});

describe("computeSemesterStats", () => {
  const scaleId = swissScale.id;
  const sem = (subjects: Subject[]): Semester => ({
    id: "sem1",
    name: "HS25",
    scaleId,
    subjects,
  });

  it("aggregates across graded subjects", () => {
    const stats = computeSemesterStats(
      sem([
        subject("Math", [g(6), g(6)]), // avg 6
        subject("Bio", [g(4), g(4)]), // avg 4
        subject("Art"), // ungraded
      ])
    );
    expect(stats.subjectCount).toBe(3);
    expect(stats.gradedSubjectCount).toBe(2);
    // mean of subject averages: (6 + 4) / 2 = 5
    expect(stats.average).toBeCloseTo(5);
    expect(stats.passingCount).toBe(2); // both >= 4
    expect(stats.failingCount).toBe(0);
    expect(stats.bestSubject?.name).toBe("Math");
    expect(stats.worstSubject?.name).toBe("Bio");
  });

  it("counts failing subjects and picks best/worst by direction", () => {
    const stats = computeSemesterStats(
      sem([
        subject("Pass", [g(5)]),
        subject("Fail", [g(3)]), // < 4 fails
      ])
    );
    expect(stats.passingCount).toBe(1);
    expect(stats.failingCount).toBe(1);
    expect(stats.bestSubject?.name).toBe("Pass");
    expect(stats.worstSubject?.name).toBe("Fail");
  });

  it("returns null average for a semester with no graded subjects", () => {
    const stats = computeSemesterStats(sem([subject("Empty")]));
    expect(stats.average).toBeNull();
    expect(stats.bestSubject).toBeNull();
    expect(stats.worstSubject).toBeNull();
  });
});

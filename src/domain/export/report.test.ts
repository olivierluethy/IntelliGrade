import { describe, it, expect } from "vitest";
import { buildSemesterReport } from "./report";
import { swissScale } from "../grade-scale/swiss";
import { germanyScale } from "../grade-scale/germany";
import type { Subject, Semester } from "../types";

let seq = 0;
const g = (value: number, weight = 1, label?: string) => ({
  id: `grade-${seq++}`,
  value,
  weight,
  label,
});
const subject = (name: string, grades = [] as ReturnType<typeof g>[], extra: Partial<Subject> = {}): Subject => ({
  id: `subj-${name}`,
  name,
  grades,
  exams: [],
  ...extra,
});
const sem = (subjects: Subject[], scaleId = swissScale.id, name = "HS25"): Semester => ({
  id: "sem1",
  name,
  scaleId,
  subjects,
});

describe("buildSemesterReport", () => {
  it("builds a titled report with scale label and summary", () => {
    const r = buildSemesterReport(
      sem([
        subject("Math", [g(6), g(6)], { targetGrade: 4 }),
        subject("Bio", [g(3)], { targetGrade: 4 }),
      ])
    );
    expect(r.title).toBe("IntelliGrade — HS25");
    expect(r.semesterName).toBe("HS25");
    expect(r.scaleLabel).toBe(swissScale.label);
    expect(r.summary.subjectCount).toBe(2);
    expect(r.summary.averageText).toBe("4.50"); // mean of 6.00 and 3.00
    expect(r.summary.passingText).toBe("1 / 2");
  });

  it("formats subject rows with average, target, status, and grades", () => {
    const r = buildSemesterReport(sem([subject("Math", [g(5, 2, "Exam")], { targetGrade: 4 })]));
    const row = r.subjects[0];
    expect(row.name).toBe("Math");
    expect(row.averageText).toBe("5.00");
    expect(row.targetText).toBe("4.00");
    expect(row.status).toBe("Pass");
    expect(row.gradeCount).toBe(1);
    expect(row.grades[0]).toEqual({ label: "Exam", valueText: "5.00", weight: 2 });
  });

  it("shows dashes for an ungraded, untargeted subject", () => {
    const row = buildSemesterReport(sem([subject("Art")])).subjects[0];
    expect(row.averageText).toBe("—");
    expect(row.targetText).toBe("—");
    expect(row.status).toBe("—");
    expect(row.gradeCount).toBe(0);
  });

  it("labels unlabeled grades positionally", () => {
    const row = buildSemesterReport(sem([subject("X", [g(5), g(4)])])).subjects[0];
    expect(row.grades.map((x) => x.label)).toEqual(["Grade 1", "Grade 2"]);
  });

  it("is direction-aware for status (lower-is-better)", () => {
    // germany: avg 5 fails target 4 (higher numbers are worse)
    const row = buildSemesterReport(
      sem([subject("DE", [g(5)], { targetGrade: 4 })], germanyScale.id)
    ).subjects[0];
    expect(row.status).toBe("Fail");
    expect(row.averageText).toBe("5.00");
  });

  it("reports an em-dash average for an empty semester", () => {
    const r = buildSemesterReport(sem([]));
    expect(r.summary.averageText).toBe("—");
    expect(r.summary.passingText).toBe("0 / 0");
  });
});

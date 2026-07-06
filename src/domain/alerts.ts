import type { Semester } from "./types";
import { weightedAverage } from "./calc";
import { getScale } from "./grade-scale";

export const EXAM_SOON_DAYS = 7;

export type Alert =
  | { kind: "exam-soon"; semesterId: string; subjectId: string; subjectName: string; examId: string; examName: string; date: string; daysUntil: number }
  | { kind: "exam-ungraded"; semesterId: string; subjectId: string; subjectName: string; examId: string; examName: string; date: string; daysAgo: number }
  | { kind: "below-target"; semesterId: string; subjectId: string; subjectName: string; average: number; target: number }
  | { kind: "no-grades"; semesterId: string; subjectId: string; subjectName: string };

const MS_PER_DAY = 86_400_000;

function midnight(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function parseDateMidnight(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function computeAlerts(semesters: Semester[], today: Date): Alert[] {
  const todayMid = midnight(today);
  const soon: Extract<Alert, { kind: "exam-soon" }>[] = [];
  const ungraded: Extract<Alert, { kind: "exam-ungraded" }>[] = [];
  const belowTarget: Alert[] = [];
  const noGrades: Alert[] = [];

  for (const semester of semesters) {
    const scale = getScale(semester.scaleId);
    for (const subject of semester.subjects) {
      const base = {
        semesterId: semester.id,
        subjectId: subject.id,
        subjectName: subject.name,
      };

      for (const exam of subject.exams) {
        const daysUntil = Math.round(
          (parseDateMidnight(exam.date) - todayMid) / MS_PER_DAY
        );
        if (daysUntil >= 0 && daysUntil <= EXAM_SOON_DAYS) {
          soon.push({ kind: "exam-soon", ...base, examId: exam.id, examName: exam.name, date: exam.date, daysUntil });
        } else if (daysUntil < 0) {
          ungraded.push({ kind: "exam-ungraded", ...base, examId: exam.id, examName: exam.name, date: exam.date, daysAgo: -daysUntil });
        }
      }

      if (subject.targetGrade !== undefined) {
        const avg = weightedAverage(subject.grades);
        if (avg !== null) {
          const below = scale.higherIsBetter
            ? avg < subject.targetGrade
            : avg > subject.targetGrade;
          if (below) {
            belowTarget.push({ kind: "below-target", ...base, average: avg, target: subject.targetGrade });
          }
        }
      }

      if (subject.grades.length === 0) {
        noGrades.push({ kind: "no-grades", ...base });
      }
    }
  }

  soon.sort((a, b) => a.daysUntil - b.daysUntil);
  ungraded.sort((a, b) => b.daysAgo - a.daysAgo);
  return [...soon, ...ungraded, ...belowTarget, ...noGrades];
}

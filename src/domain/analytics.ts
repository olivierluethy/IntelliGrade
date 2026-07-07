import type { Grade, Subject, Semester } from "./types";
import type { GradeScale } from "./grade-scale";
import { getScale } from "./grade-scale";
import { weightedAverage } from "./calc";

const EPS = 1e-9;

export type Trend = "up" | "down" | "flat" | "na";

export type SubjectStats = {
  subjectId: string;
  name: string;
  average: number | null;
  count: number;
  best: number | null;
  worst: number | null;
  trend: Trend;
  passing: boolean | null;
  target?: number;
  distanceToTarget: number | null;
};

export type SemesterStats = {
  semesterId: string;
  name: string;
  scaleId: string;
  average: number | null;
  subjectCount: number;
  gradedSubjectCount: number;
  passingCount: number;
  failingCount: number;
  bestSubject: SubjectStats | null;
  worstSubject: SubjectStats | null;
  subjects: SubjectStats[];
};

/** Grades ordered chronologically by date when every grade has one, else insertion order. */
function chronological(grades: Grade[]): Grade[] {
  if (grades.length > 0 && grades.every((x) => x.date)) {
    return [...grades].sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : 0));
  }
  return grades;
}

function trendOf(grades: Grade[], scale: GradeScale): Trend {
  if (grades.length < 2) return "na";
  const ordered = chronological(grades);
  const mid = Math.floor(ordered.length / 2);
  const firstAvg = weightedAverage(ordered.slice(0, mid));
  const secondAvg = weightedAverage(ordered.slice(ordered.length - mid));
  if (firstAvg === null || secondAvg === null) return "na";
  const delta = scale.higherIsBetter ? secondAvg - firstAvg : firstAvg - secondAvg;
  if (delta > EPS) return "up";
  if (delta < -EPS) return "down";
  return "flat";
}

export function computeSubjectStats(subject: Subject, scale: GradeScale): SubjectStats {
  const values = subject.grades.map((x) => x.value).filter((v) => !Number.isNaN(v));
  const average = weightedAverage(subject.grades);
  const hasGrades = values.length > 0;

  let best: number | null = null;
  let worst: number | null = null;
  if (hasGrades) {
    const hi = Math.max(...values);
    const lo = Math.min(...values);
    best = scale.higherIsBetter ? hi : lo;
    worst = scale.higherIsBetter ? lo : hi;
  }

  const distanceToTarget =
    subject.targetGrade !== undefined && average !== null
      ? scale.higherIsBetter
        ? average - subject.targetGrade
        : subject.targetGrade - average
      : null;

  return {
    subjectId: subject.id,
    name: subject.name,
    average,
    count: subject.grades.length,
    best,
    worst,
    trend: trendOf(subject.grades, scale),
    passing: average === null ? null : scale.isPassing(average),
    target: subject.targetGrade,
    distanceToTarget,
  };
}

export function computeSemesterStats(semester: Semester): SemesterStats {
  const scale = getScale(semester.scaleId);
  const subjects = semester.subjects.map((s) => computeSubjectStats(s, scale));
  const graded = subjects.filter((s) => s.average !== null);

  const average =
    graded.length > 0
      ? graded.reduce((sum, s) => sum + (s.average as number), 0) / graded.length
      : null;

  // Rank graded subjects best→worst: by distanceToTarget when available, else by average
  // in the scale's good direction.
  const rankValue = (s: SubjectStats): number => {
    if (s.distanceToTarget !== null) return s.distanceToTarget;
    const avg = s.average as number;
    return scale.higherIsBetter ? avg : -avg;
  };
  const ranked = [...graded].sort((a, b) => rankValue(b) - rankValue(a));

  return {
    semesterId: semester.id,
    name: semester.name,
    scaleId: semester.scaleId,
    average,
    subjectCount: subjects.length,
    gradedSubjectCount: graded.length,
    passingCount: graded.filter((s) => s.passing === true).length,
    failingCount: graded.filter((s) => s.passing === false).length,
    bestSubject: ranked[0] ?? null,
    worstSubject: ranked.length > 0 ? ranked[ranked.length - 1] : null,
    subjects,
  };
}

import type { Semester } from "../types";
import { getScale } from "../grade-scale";
import { computeSemesterStats } from "../analytics";

export type ReportGradeRow = { label: string; valueText: string; weight: number };

export type ReportSubjectRow = {
  name: string;
  averageText: string;
  targetText: string;
  status: string;
  gradeCount: number;
  grades: ReportGradeRow[];
};

export type SemesterReport = {
  title: string;
  semesterName: string;
  scaleLabel: string;
  summary: {
    averageText: string;
    passingText: string;
    subjectCount: number;
  };
  subjects: ReportSubjectRow[];
};

const DASH = "—";

export function buildSemesterReport(semester: Semester): SemesterReport {
  const scale = getScale(semester.scaleId);
  const stats = computeSemesterStats(semester);

  const subjects: ReportSubjectRow[] = semester.subjects.map((subject) => {
    const s = stats.subjects.find((x) => x.subjectId === subject.id)!;
    const status =
      s.passing === null ? DASH : s.passing ? "Pass" : "Fail";
    return {
      name: subject.name,
      averageText: s.average === null ? DASH : scale.format(s.average),
      targetText: s.target === undefined ? DASH : scale.format(s.target),
      status,
      gradeCount: subject.grades.length,
      grades: subject.grades.map((grade, i) => ({
        label: grade.label?.trim() || `Grade ${i + 1}`,
        valueText: scale.format(grade.value),
        weight: grade.weight,
      })),
    };
  });

  return {
    title: `IntelliGrade — ${semester.name}`,
    semesterName: semester.name,
    scaleLabel: scale.label,
    summary: {
      averageText: stats.average === null ? DASH : scale.format(stats.average),
      passingText: `${stats.passingCount} / ${stats.gradedSubjectCount}`,
      subjectCount: stats.subjectCount,
    },
    subjects,
  };
}

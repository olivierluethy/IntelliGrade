import type { Subject, Semester } from "./types";
import type { GradeScale } from "./grade-scale";
import { getScale } from "./grade-scale";
import { weightedAverage } from "./calc";
import { gradeNeeded, badGradesAffordable } from "./scenario";
import { computeSubjectStats } from "./analytics";

export type Severity = "high" | "medium" | "low";

export type RecommendationKind =
  | "below-target"
  | "trending-down"
  | "no-target"
  | "no-grades"
  | "on-track";

export type Recommendation = {
  id: string;
  kind: RecommendationKind;
  severity: Severity;
  subjectId: string;
  subjectName: string;
  text: string;
};

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

function forSubject(subject: Subject, scale: GradeScale): Recommendation | null {
  const base = { subjectId: subject.id, subjectName: subject.name };
  const rec = (
    kind: RecommendationKind,
    severity: Severity,
    text: string
  ): Recommendation => ({ id: `${kind}:${subject.id}`, kind, severity, ...base, text });

  if (subject.grades.length === 0) {
    return rec("no-grades", "low", `Add grades for ${subject.name} to start tracking.`);
  }

  const avg = weightedAverage(subject.grades);
  const stats = computeSubjectStats(subject, scale);

  if (subject.targetGrade !== undefined && avg !== null) {
    const onBadSide = scale.higherIsBetter
      ? avg < subject.targetGrade
      : avg > subject.targetGrade;
    if (onBadSide) {
      const needed = gradeNeeded(subject.grades, subject.targetGrade, 1);
      const reachable = scale.clampValid(needed);
      const text = reachable
        ? `${subject.name} is below target (${scale.format(avg)} vs ${scale.format(
            subject.targetGrade
          )}). Aim for ${scale.format(needed)} on your next equally-weighted grade.`
        : `${subject.name} is below target (${scale.format(avg)} vs ${scale.format(
            subject.targetGrade
          )}). One grade can't close the gap — plan several strong results.`;
      return rec("below-target", "high", text);
    }
  }

  if (stats.trend === "down") {
    return rec(
      "trending-down",
      "medium",
      `${subject.name} is trending downward — recent grades are weaker than earlier ones.`
    );
  }

  if (subject.targetGrade === undefined) {
    return rec(
      "no-target",
      "low",
      `Set a target for ${subject.name} to unlock planning and cushion estimates.`
    );
  }

  // Target set and on the good side → positive cushion note when affordable.
  if (avg !== null) {
    const worstGrade = scale.higherIsBetter ? scale.min : scale.max;
    const cushion = badGradesAffordable(
      subject.grades,
      subject.targetGrade,
      worstGrade,
      scale
    );
    if (cushion >= 1) {
      const count = cushion === Infinity ? "several" : String(cushion);
      return rec(
        "on-track",
        "low",
        `${subject.name} is on track — you can afford ${count} more weak result(s) and still hit your target.`
      );
    }
  }

  return null;
}

export function computeRecommendations(semester: Semester): Recommendation[] {
  const scale = getScale(semester.scaleId);
  const recs = semester.subjects
    .map((s) => forSubject(s, scale))
    .filter((r): r is Recommendation => r !== null);
  return recs.sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    return bySeverity !== 0 ? bySeverity : a.subjectName.localeCompare(b.subjectName);
  });
}

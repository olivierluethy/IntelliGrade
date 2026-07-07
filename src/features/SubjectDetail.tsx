import { useStore } from "../store/useStore";
import { weightedAverage } from "../domain/calc";
import { getScale } from "../domain/grade-scale";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { AddGradeForm } from "./AddGradeForm";
import { PointsCalculator } from "./PointsCalculator";
import { ExamPlanner } from "./ExamPlanner";
import { GradeRow } from "./GradeRow";
import { Planner } from "./scenario/Planner";
import { ListChecks } from "../components/Icon";

type Props = { semesterId: string; subjectId: string };

export function SubjectDetail({ semesterId, subjectId }: Props) {
  // Subscribe to just this semester/subject so unrelated store mutations don't
  // re-render the detail pane.
  const semester = useStore((s) =>
    s.data.semesters.find((x) => x.id === semesterId)
  );
  const subject = useStore((s) =>
    s.data.semesters
      .find((x) => x.id === semesterId)
      ?.subjects.find((y) => y.id === subjectId)
  );
  if (!semester || !subject) return null;

  const scale = getScale(semester.scaleId);
  const avg = weightedAverage(subject.grades);
  const passing = avg === null ? null : scale.isPassing(avg);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">
            {semester.name} · {subject.grades.length}{" "}
            {subject.grades.length === 1 ? "grade" : "grades"}
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {subject.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="card px-4 py-2 text-right">
            <div className="eyebrow">Average</div>
            <div
              className={`font-readout text-2xl font-bold leading-none ${
                avg === null ? "text-faint" : scale.colorFor(avg)
              }`}
            >
              {avg === null ? "—" : scale.format(avg)}
            </div>
          </div>
          {passing !== null && (
            <span
              className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                passing
                  ? "border-pass/30 bg-pass/10 text-pass"
                  : "border-fail/30 bg-fail/10 text-fail"
              }`}
            >
              {passing ? "Passing" : "Failing"}
            </span>
          )}
        </div>
      </header>

      {/* Planner — the hero */}
      <Planner
        key={subjectId}
        semesterId={semesterId}
        subjectId={subjectId}
        grades={subject.grades}
        target={subject.targetGrade}
        scale={scale}
        upcomingExams={subject.exams.length}
      />

      {/* Grades + quick add */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeader
            icon={ListChecks}
            title="Grades"
            hint="Every result counts toward your average by its weight."
          />
          {subject.grades.length === 0 ? (
            <EmptyState
              compact
              icon={ListChecks}
              title="No grades yet"
              description="Add your first grade with the panel on the right — your average and plan update instantly."
            />
          ) : (
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-3 pb-2 eyebrow">Grade</th>
                    <th className="px-3 pb-2 eyebrow">Weight</th>
                    <th className="px-3 pb-2 eyebrow">Label</th>
                    <th className="px-3 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {subject.grades.map((g) => (
                    <GradeRow
                      key={g.id}
                      semesterId={semesterId}
                      subjectId={subjectId}
                      grade={g}
                      scale={scale}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <AddGradeForm
              semesterId={semesterId}
              subjectId={subjectId}
              scale={scale}
            />
          </Card>
          <Card>
            <PointsCalculator
              semesterId={semesterId}
              subjectId={subjectId}
              scale={scale}
            />
          </Card>
        </div>
      </div>

      {/* Exams */}
      <ExamPlanner
        semesterId={semesterId}
        subjectId={subjectId}
        exams={subject.exams}
        scale={scale}
      />
    </div>
  );
}

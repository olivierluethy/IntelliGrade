import { useStore } from "../store/useStore";
import { weightedAverage } from "../domain/calc";
import { getScale } from "../domain/grade-scale";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { AddGradeForm } from "./AddGradeForm";
import { PointsCalculator } from "./PointsCalculator";
import { ExamPlanner } from "./ExamPlanner";
import { GradeRow } from "./GradeRow";
import { TargetEditor } from "./TargetEditor";
import { GradeNeededCard } from "./scenario/GradeNeededCard";
import { AffordCard } from "./scenario/AffordCard";

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          {subject.name}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Average</span>
            {avg === null ? (
              <Badge className="text-slate-400">—</Badge>
            ) : (
              <Badge className={scale.colorFor(avg)}>{scale.format(avg)}</Badge>
            )}
          </div>
          <TargetEditor
            key={subjectId}
            semesterId={semesterId}
            subjectId={subjectId}
            target={subject.targetGrade}
            scale={scale}
          />
        </div>
      </header>

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

      <ExamPlanner
        semesterId={semesterId}
        subjectId={subjectId}
        exams={subject.exams}
        scale={scale}
      />

      {subject.targetGrade === undefined ? (
        <Card>
          <p className="text-sm text-slate-500">
            Set a target grade to plan ahead.
          </p>
        </Card>
      ) : (
        <>
          <GradeNeededCard
            grades={subject.grades}
            target={subject.targetGrade}
            scale={scale}
          />
          <AffordCard
            grades={subject.grades}
            target={subject.targetGrade}
            scale={scale}
          />
        </>
      )}

      <Card className="overflow-x-auto p-0">
        {subject.grades.length === 0 ? (
          <p className="p-6 text-center text-slate-500">
            No grades yet — add your first one above.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 font-medium">Grade</th>
                <th className="px-4 py-2 font-medium">Weight</th>
                <th className="px-4 py-2 font-medium">Label</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="[&_td]:px-4">
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
        )}
      </Card>
    </div>
  );
}

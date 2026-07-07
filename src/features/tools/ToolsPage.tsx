import { useStore } from "../../store/useStore";
import { getScale } from "../../domain/grade-scale";
import { VerificationCalculator } from "./VerificationCalculator";
import { CurveCalculator } from "./CurveCalculator";
import { GradeChangeCalculator } from "./GradeChangeCalculator";

type Props = { semesterId: string | null; subjectId: string | null };

export function ToolsPage({ semesterId, subjectId }: Props) {
  const data = useStore((s) => s.data);
  const semester = data.semesters.find((s) => s.id === semesterId);
  const scale = getScale(semester?.scaleId ?? "swiss");
  const subject = semester?.subjects.find((s) => s.id === subjectId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Tools</h1>
        <p className="mt-1 text-sm text-muted">
          Quick grade calculators.{" "}
          {subject ? (
            <>
              Results can be saved straight into{" "}
              <span className="font-medium text-brand-bright">{subject.name}</span>.
            </>
          ) : (
            <>Open a subject first to save any result as a grade.</>
          )}
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <VerificationCalculator scale={scale} semesterId={semesterId} subjectId={subjectId} />
        <CurveCalculator scale={scale} semesterId={semesterId} subjectId={subjectId} />
        <GradeChangeCalculator />
      </div>
    </div>
  );
}

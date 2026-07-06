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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Tools</h2>
        <p className="text-sm text-slate-400">
          Verify grades, model curves, and compute percentage changes.
        </p>
      </header>
      <VerificationCalculator scale={scale} semesterId={semesterId} subjectId={subjectId} />
      <CurveCalculator scale={scale} semesterId={semesterId} subjectId={subjectId} />
      <GradeChangeCalculator />
    </div>
  );
}

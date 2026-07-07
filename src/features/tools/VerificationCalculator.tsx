import { useState } from "react";
import { verifyGrade } from "../../domain/verify";
import type { GradeScale } from "../../domain/grade-scale";
import { useStore } from "../../store/useStore";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { SectionHeader } from "../../components/SectionHeader";
import { ClipboardCheck, Plus } from "../../components/Icon";

type Props = { scale: GradeScale; semesterId: string | null; subjectId: string | null };

export function VerificationCalculator({ scale, semesterId, subjectId }: Props) {
  const addGrade = useStore((s) => s.addGrade);
  const [earned, setEarned] = useState("");
  const [max, setMax] = useState("");
  const [weight, setWeight] = useState("");
  const [published, setPublished] = useState("");

  const e = parseFloat(earned);
  const m = parseFloat(max);
  const pub = published.trim() === "" ? undefined : parseFloat(published);
  const valid = !Number.isNaN(e) && !Number.isNaN(m) && m > 0;
  const result = valid
    ? verifyGrade(e, m, scale, pub !== undefined && !Number.isNaN(pub) ? pub : undefined)
    : null;
  const gradeValid = result !== null && scale.clampValid(result.grade);
  const canSave = gradeValid && semesterId !== null && subjectId !== null;

  const save = () => {
    if (!canSave || result === null || semesterId === null || subjectId === null) return;
    const w = parseFloat(weight);
    addGrade(semesterId, subjectId, {
      value: result.grade,
      weight: !Number.isNaN(w) && w > 0 ? w : 1,
    });
  };

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader
        icon={ClipboardCheck}
        title="Verify a grade"
        hint="Turn your points into the grade you should have got — and check it against what the teacher wrote."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Points earned" value={earned} onChange={setEarned} placeholder="15" />
        <NumberField label="Points possible" value={max} onChange={setMax} placeholder="20" />
        <NumberField label="Weight (optional)" value={weight} onChange={setWeight} placeholder="1" />
        <NumberField label="Teacher's grade (optional)" value={published} onChange={setPublished} placeholder="4.5" />
      </div>

      {result !== null && (
        <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">Correct grade</span>
            <span className={`font-readout text-2xl font-bold ${gradeValid ? scale.colorFor(result.grade) : "text-fail"}`}>
              {scale.format(result.grade)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-faint">
            <span>{result.percentage.toFixed(1)}% · {result.isPassing ? "passing" : "failing"}</span>
          </div>
          {result.matchesPublished !== undefined && (
            <div className={`mt-2 text-sm ${result.matchesPublished ? "text-pass" : "text-warn"}`}>
              {result.matchesPublished
                ? "✓ Matches the teacher's grade."
                : `Off by ${result.difference!.toFixed(2)} from the teacher's grade.`}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-4">
        <Button variant="ghost" disabled={!canSave} onClick={save} className="w-full">
          <Plus size={16} /> Save as grade
        </Button>
        {subjectId === null && (
          <p className="mt-1.5 text-center text-xs text-faint">Open a subject to save.</p>
        )}
      </div>
    </Card>
  );
}

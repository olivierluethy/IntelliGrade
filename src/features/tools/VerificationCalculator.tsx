import { useState } from "react";
import { verifyGrade } from "../../domain/verify";
import type { GradeScale } from "../../domain/grade-scale";
import { useStore } from "../../store/useStore";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
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
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <ClipboardCheck size={16} className="text-indigo-400" />
        Verify a teacher's grade
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Earned points" value={earned} onChange={setEarned} placeholder="e.g. 15" />
        <NumberField label="Max points" value={max} onChange={setMax} placeholder="e.g. 20" />
        <NumberField label="Weight (optional)" value={weight} onChange={setWeight} placeholder="1" />
        <NumberField label="Published grade (optional)" value={published} onChange={setPublished} placeholder="e.g. 4.5" />
      </div>
      {result !== null && (
        <div className="mt-4 space-y-1 text-sm">
          <div>
            Percentage:{" "}
            <span className="font-semibold text-slate-200">{result.percentage.toFixed(1)}%</span>
          </div>
          <div>
            Correct grade:{" "}
            <span className={`font-semibold ${gradeValid ? scale.colorFor(result.grade) : "text-rose-400"}`}>
              {scale.format(result.grade)}
            </span>{" "}
            <span className="text-slate-400">({result.isPassing ? "pass" : "fail"})</span>
          </div>
          {result.matchesPublished !== undefined && (
            <div className={result.matchesPublished ? "text-emerald-400" : "text-amber-400"}>
              {result.matchesPublished
                ? "Matches the published grade."
                : `Off by ${result.difference!.toFixed(2)} from the published grade.`}
            </div>
          )}
        </div>
      )}
      <div className="mt-4 flex items-center gap-2">
        <Button variant="ghost" disabled={!canSave} onClick={save}>
          <Plus size={16} /> Save as grade
        </Button>
        {subjectId === null && (
          <span className="text-xs text-slate-500">Select a subject to save</span>
        )}
      </div>
    </Card>
  );
}

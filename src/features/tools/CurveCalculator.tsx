import { useState } from "react";
import { applyCurve } from "../../domain/curve";
import { weightedAverage } from "../../domain/calc";
import type { GradeScale } from "../../domain/grade-scale";
import { useStore } from "../../store/useStore";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { SectionHeader } from "../../components/SectionHeader";
import { SlidersHorizontal, Plus } from "../../components/Icon";

type Props = { scale: GradeScale; semesterId: string | null; subjectId: string | null };

export function CurveCalculator({ scale, semesterId, subjectId }: Props) {
  const data = useStore((s) => s.data);
  const addGrade = useStore((s) => s.addGrade);
  const [earned, setEarned] = useState("");
  const [originalMax, setOriginalMax] = useState("");
  const [adjustedMax, setAdjustedMax] = useState("");
  const [bonus, setBonus] = useState("");

  const e = parseFloat(earned);
  const om = parseFloat(originalMax);
  const am = parseFloat(adjustedMax);
  const b = bonus.trim() === "" ? 0 : parseFloat(bonus);
  const valid =
    !Number.isNaN(e) && !Number.isNaN(om) && om > 0 && !Number.isNaN(am) && am > 0 && !Number.isNaN(b);
  const result = valid ? applyCurve(e, om, am, b, scale) : null;
  const gradeValid = result !== null && scale.clampValid(result.adjustedGrade);
  const canSave = gradeValid && semesterId !== null && subjectId !== null;

  const subject = data.semesters
    .find((s) => s.id === semesterId)
    ?.subjects.find((s) => s.id === subjectId);
  const projectedAvg =
    result !== null && subject
      ? weightedAverage([...subject.grades, { id: "__preview", value: result.adjustedGrade, weight: 1 }])
      : null;

  const save = () => {
    if (!canSave || result === null || semesterId === null || subjectId === null) return;
    addGrade(semesterId, subjectId, { value: result.adjustedGrade, weight: 1 });
  };

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader
        icon={SlidersHorizontal}
        title="Adjust for a curve"
        hint="Teacher lowered the max or added bonus points? See your new grade before it's official."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Points earned" value={earned} onChange={setEarned} placeholder="15" />
        <NumberField label="Original max" value={originalMax} onChange={setOriginalMax} placeholder="20" />
        <NumberField label="Adjusted max" value={adjustedMax} onChange={setAdjustedMax} placeholder="18" />
        <NumberField label="Flat bonus" value={bonus} onChange={setBonus} placeholder="0.25" />
      </div>

      {result !== null && (
        <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">Adjusted grade</span>
            <span className="flex items-baseline gap-2">
              <span className={`font-readout text-2xl font-bold ${gradeValid ? scale.colorFor(result.adjustedGrade) : "text-fail"}`}>
                {scale.format(result.adjustedGrade)}
              </span>
              <span className={`text-xs font-medium ${result.delta >= 0 ? "text-pass" : "text-fail"}`}>
                {result.delta >= 0 ? "+" : ""}
                {result.delta.toFixed(2)}
              </span>
            </span>
          </div>
          <div className="mt-1 text-xs text-faint">
            was {scale.format(result.originalGrade)}
            {projectedAvg !== null && (
              <> · new subject average {scale.format(projectedAvg)}</>
            )}
          </div>
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

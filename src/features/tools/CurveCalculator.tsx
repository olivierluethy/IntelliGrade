import { useState } from "react";
import { applyCurve } from "../../domain/curve";
import { weightedAverage } from "../../domain/calc";
import type { GradeScale } from "../../domain/grade-scale";
import { useStore } from "../../store/useStore";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
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
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <SlidersHorizontal size={16} className="text-indigo-400" />
        Grade curve adjustment
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Earned points" value={earned} onChange={setEarned} placeholder="e.g. 15" />
        <NumberField label="Original max" value={originalMax} onChange={setOriginalMax} placeholder="e.g. 20" />
        <NumberField label="Adjusted max" value={adjustedMax} onChange={setAdjustedMax} placeholder="e.g. 18" />
        <NumberField label="Flat bonus" value={bonus} onChange={setBonus} placeholder="e.g. 0.25" />
      </div>
      {result !== null && (
        <div className="mt-4 space-y-1 text-sm">
          <div>
            Original grade:{" "}
            <span className={`font-semibold ${scale.colorFor(result.originalGrade)}`}>
              {scale.format(result.originalGrade)}
            </span>
          </div>
          <div>
            Adjusted grade:{" "}
            <span className={`font-semibold ${gradeValid ? scale.colorFor(result.adjustedGrade) : "text-rose-400"}`}>
              {scale.format(result.adjustedGrade)}
            </span>{" "}
            <span className="text-slate-400">
              ({result.delta >= 0 ? "+" : ""}
              {result.delta.toFixed(2)})
            </span>
          </div>
          {projectedAvg !== null && (
            <div>
              Projected new average:{" "}
              <span className={`font-semibold ${scale.colorFor(projectedAvg)}`}>
                {scale.format(projectedAvg)}
              </span>
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

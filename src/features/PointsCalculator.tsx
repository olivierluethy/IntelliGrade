import { useState } from "react";
import { useStore } from "../store/useStore";
import { gradeFromPoints } from "../domain/calc";
import { Button } from "../components/Button";
import { Calculator, Plus } from "../components/Icon";
import type { GradeScale } from "../domain/grade-scale";

type Props = { semesterId: string; subjectId: string; scale: GradeScale };

export function PointsCalculator({ semesterId, subjectId, scale }: Props) {
  const addGrade = useStore((s) => s.addGrade);
  const [earned, setEarned] = useState("");
  const [max, setMax] = useState("");

  const e = parseFloat(earned);
  const m = parseFloat(max);
  const valid = !Number.isNaN(e) && !Number.isNaN(m) && m > 0;
  const grade = valid ? gradeFromPoints(e, m, scale) : null;
  const gradeValid = grade !== null && scale.clampValid(grade);

  const input =
    "w-24 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <Calculator size={16} className="text-indigo-400" />
        Grade from points
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={input}
          type="number"
          placeholder="Earned"
          aria-label="Earned points"
          value={earned}
          onChange={(ev) => setEarned(ev.target.value)}
        />
        <span className="text-slate-500">/</span>
        <input
          className={input}
          type="number"
          placeholder="Max"
          aria-label="Max points"
          value={max}
          onChange={(ev) => setMax(ev.target.value)}
        />
        {grade !== null && (
          <span className="text-sm text-slate-400">
            ={" "}
            <span className={`font-semibold ${gradeValid ? scale.colorFor(grade) : "text-rose-400"}`}>
              {scale.format(grade)}
            </span>
          </span>
        )}
        <Button
          variant="ghost"
          disabled={!gradeValid}
          onClick={() => {
            if (!gradeValid || grade === null) return;
            addGrade(semesterId, subjectId, { value: grade, weight: 1 });
            setEarned("");
            setMax("");
          }}
        >
          <Plus size={16} /> Save as grade
        </Button>
      </div>
    </div>
  );
}

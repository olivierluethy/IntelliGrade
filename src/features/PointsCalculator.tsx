import { useState } from "react";
import { useStore } from "../store/useStore";
import { gradeFromPoints } from "../domain/calc";
import { Button } from "../components/Button";
import { SectionHeader } from "../components/SectionHeader";
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

  return (
    <div>
      <SectionHeader
        icon={Calculator}
        title="Grade from points"
        hint="Scored 15/20? Get the grade — then save it in one click."
      />
      <div className="flex items-end gap-2">
        <label className="flex-1 text-sm">
          <span className="font-medium text-muted">Earned</span>
          <input
            className="field mt-1 tabular-nums"
            type="number"
            placeholder="15"
            aria-label="Earned points"
            value={earned}
            onChange={(ev) => setEarned(ev.target.value)}
          />
        </label>
        <span className="pb-2.5 text-faint">/</span>
        <label className="flex-1 text-sm">
          <span className="font-medium text-muted">Max</span>
          <input
            className="field mt-1 tabular-nums"
            type="number"
            placeholder="20"
            aria-label="Max points"
            value={max}
            onChange={(ev) => setMax(ev.target.value)}
          />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-sm text-muted">
          {grade === null ? (
            <span className="text-faint">Enter points to preview</span>
          ) : (
            <>
              ={" "}
              <span
                className={`font-readout text-lg font-bold ${gradeValid ? scale.colorFor(grade) : "text-fail"}`}
              >
                {scale.format(grade)}
              </span>
            </>
          )}
        </div>
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

import { useState } from "react";
import { badGradesAffordable } from "../../domain/scenario";
import { weightedAverage } from "../../domain/calc";
import type { Grade } from "../../domain/types";
import type { GradeScale } from "../../domain/grade-scale";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { ShieldAlert } from "../../components/Icon";

type Props = { grades: Grade[]; target: number; scale: GradeScale };

export function AffordCard({ grades, target, scale }: Props) {
  const [bad, setBad] = useState(String(scale.passThreshold));
  const b = parseFloat(bad);
  const valid = !Number.isNaN(b);
  const n = valid ? badGradesAffordable(grades, target, b, scale) : null;
  const avg = weightedAverage(grades);

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <ShieldAlert size={16} className="text-indigo-400" />
        How many bad grades can I afford?
      </div>
      <div className="max-w-[10rem]">
        <NumberField
          label="Bad grade value"
          value={bad}
          onChange={setBad}
          placeholder={scale.format(scale.passThreshold)}
        />
      </div>
      {n !== null && !Number.isNaN(n) && (
        <div className="mt-3 text-sm">
          {n === Infinity ? (
            <span className="text-emerald-400">
              Unlimited — that grade is at or above your target.
            </span>
          ) : n === 0 && avg !== null && avg < target ? (
            <span className="text-rose-400">
              You're below target now — 0 to spare.
            </span>
          ) : (
            <span>
              You can take{" "}
              <span className="font-semibold text-slate-200">{n}</span> more
              grade(s) of {scale.format(b)} and stay at or above{" "}
              {scale.format(target)}.
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

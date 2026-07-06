import { useState } from "react";
import { gradeNeeded } from "../../domain/scenario";
import type { Grade } from "../../domain/types";
import type { GradeScale } from "../../domain/grade-scale";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { Target } from "../../components/Icon";

type Props = { grades: Grade[]; target: number; scale: GradeScale };

export function GradeNeededCard({ grades, target, scale }: Props) {
  const [weight, setWeight] = useState("1");
  const w = parseFloat(weight);
  const valid = !Number.isNaN(w) && w > 0;
  const needed = valid ? gradeNeeded(grades, target, w) : null;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Target size={16} className="text-indigo-400" />
        What grade do I need?
      </div>
      <div className="max-w-[10rem]">
        <NumberField
          label="Next assessment weight"
          value={weight}
          onChange={setWeight}
          placeholder="1"
        />
      </div>
      {needed !== null && (
        <div className="mt-3 text-sm">
          {needed > scale.max ? (
            <span className="text-rose-400">
              Not reachable with one grade (would need {scale.format(needed)}) —
              plan more assessments or lower the target.
            </span>
          ) : needed <= scale.min ? (
            <span className="text-emerald-400">
              Already secured — any grade keeps you at or above your target.
            </span>
          ) : (
            <span>
              You need a{" "}
              <span className={`font-semibold ${scale.colorFor(needed)}`}>
                {scale.format(needed)}
              </span>{" "}
              on your next grade to reach {scale.format(target)}.
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

import { useState } from "react";
import { gradeNeededPerExam } from "../../domain/scenario";
import type { Grade } from "../../domain/types";
import type { GradeScale } from "../../domain/grade-scale";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { Target } from "../../components/Icon";

type Props = {
  grades: Grade[];
  target: number;
  scale: GradeScale;
  /** Number of still-upcoming (ungraded) exams for this subject, used to prefill. */
  upcomingExams?: number;
};

export function GradeNeededCard({ grades, target, scale, upcomingExams }: Props) {
  const [count, setCount] = useState(String(Math.max(1, upcomingExams ?? 1)));
  const [weight, setWeight] = useState("1");

  const n = parseInt(count, 10);
  const w = parseFloat(weight);
  const countValid = Number.isInteger(n) && n >= 1;
  const weightValid = !Number.isNaN(w) && w > 0;
  const needed =
    countValid && weightValid ? gradeNeededPerExam(grades, target, n, w) : null;

  // Reachability depends on the scale's direction.
  const unreachable =
    needed !== null &&
    (scale.higherIsBetter ? needed > scale.max : needed < scale.min);
  const secured =
    needed !== null &&
    (scale.higherIsBetter ? needed <= scale.min : needed >= scale.max);

  const eachSuffix = n > 1 ? " on each" : "";
  const examWord = n > 1 ? `each of your ${n} exams` : "your next grade";

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Target size={16} className="text-indigo-400" />
        What grade do I need?
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="max-w-[9rem]">
          <NumberField
            label="Upcoming exams"
            value={count}
            onChange={setCount}
            placeholder="1"
          />
        </div>
        <div className="max-w-[9rem]">
          <NumberField
            label="Weight each"
            value={weight}
            onChange={setWeight}
            placeholder="1"
          />
        </div>
      </div>
      {needed !== null && (
        <div className="mt-3 text-sm">
          {unreachable ? (
            <span className="text-rose-400">
              Not reachable this way (would need {scale.format(needed)}
              {eachSuffix}) — plan more exams or adjust your target.
            </span>
          ) : secured ? (
            <span className="text-emerald-400">
              Already secured — any grade keeps you at your target of{" "}
              {scale.format(target)}.
            </span>
          ) : (
            <span>
              You need a{" "}
              <span className={`font-semibold ${scale.colorFor(needed)}`}>
                {scale.format(needed)}
              </span>{" "}
              on {examWord} to reach {scale.format(target)}.
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

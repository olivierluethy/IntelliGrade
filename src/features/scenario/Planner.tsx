import { useState } from "react";
import { useStore } from "../../store/useStore";
import { weightedAverage } from "../../domain/calc";
import { gradeNeededPerExam, badGradesAffordable } from "../../domain/scenario";
import type { Grade } from "../../domain/types";
import type { GradeScale } from "../../domain/grade-scale";
import { Card } from "../../components/Card";
import { SectionHeader } from "../../components/SectionHeader";
import { GradeTrack } from "../../components/GradeTrack";
import { Target } from "../../components/Icon";

type Props = {
  semesterId: string;
  subjectId: string;
  grades: Grade[];
  target: number | undefined;
  scale: GradeScale;
  /** Number of still-upcoming exams for this subject (prefills the count). */
  upcomingExams: number;
};

export function Planner({
  semesterId,
  subjectId,
  grades,
  target,
  scale,
  upcomingExams,
}: Props) {
  const setSubjectTarget = useStore((s) => s.setSubjectTarget);
  const [targetText, setTargetText] = useState(
    target !== undefined ? scale.format(target) : ""
  );
  const [count, setCount] = useState(String(Math.max(1, upcomingExams)));
  const [weight, setWeight] = useState("1");

  const avg = weightedAverage(grades);

  const commitTarget = (v: string) => {
    setTargetText(v);
    const n = parseFloat(v);
    setSubjectTarget(
      semesterId,
      subjectId,
      v.trim() === "" || Number.isNaN(n) ? undefined : n
    );
  };

  const n = parseInt(count, 10);
  const w = parseFloat(weight);
  const countValid = Number.isInteger(n) && n >= 1;
  const weightValid = !Number.isNaN(w) && w > 0;

  const hasTarget = target !== undefined;
  const needed =
    hasTarget && countValid && weightValid
      ? gradeNeededPerExam(grades, target, n, w)
      : null;
  const unreachable =
    needed !== null &&
    (scale.higherIsBetter ? needed > scale.max : needed < scale.min);
  const secured =
    needed !== null &&
    (scale.higherIsBetter ? needed <= scale.min : needed >= scale.max);

  const worst = scale.higherIsBetter ? scale.min : scale.max;
  const cushion = hasTarget
    ? badGradesAffordable(grades, target, worst, scale)
    : null;

  const gap =
    hasTarget && avg !== null
      ? scale.higherIsBetter
        ? avg - target
        : target - avg
      : null;

  return (
    <Card className="border-brand/25 bg-gradient-to-b from-brand/[0.06] to-transparent">
      <SectionHeader
        icon={Target}
        title="Target planner"
        hint="Set the average you're aiming for — see exactly what each remaining exam needs."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Controls */}
        <div className="space-y-4">
          <FieldRow
            label="I want an average of"
            value={targetText}
            onChange={commitTarget}
            placeholder={`e.g. ${scale.format(
              scale.higherIsBetter
                ? scale.passThreshold + 1
                : scale.passThreshold - 1
            )}`}
            suffix={`on the ${scale.format(scale.min)}–${scale.format(scale.max)} scale`}
          />
          {hasTarget && (
            <div className="grid grid-cols-2 gap-3">
              <FieldRow
                label="Upcoming exams"
                value={count}
                onChange={setCount}
                placeholder="1"
              />
              <FieldRow
                label="Weight each"
                value={weight}
                onChange={setWeight}
                placeholder="1"
              />
            </div>
          )}
        </div>

        {/* Result */}
        <div className="space-y-4">
          <GradeTrack
            scale={scale}
            average={avg}
            target={target}
            needed={needed}
          />

          {!hasTarget ? (
            <p className="text-sm leading-relaxed text-muted">
              Enter a target on the left and we'll show, in plain terms, the grade
              you need on your remaining exams to reach it.
            </p>
          ) : needed === null ? (
            <p className="text-sm text-faint">
              Enter how many exams are still ahead to see what you need.
            </p>
          ) : unreachable ? (
            <Verdict tone="fail">
              A single run of {n} exam{n > 1 ? "s" : ""} can't reach{" "}
              {scale.format(target)} (you'd need {scale.format(needed)}). Plan
              more exams or ease the target.
            </Verdict>
          ) : secured ? (
            <Verdict tone="pass">
              You've already secured it — any remaining grades keep you at{" "}
              {scale.format(target)} or better.
            </Verdict>
          ) : (
            <Verdict tone="neutral">
              You need{" "}
              <span className={`font-readout text-lg font-bold ${scale.colorFor(needed)}`}>
                {scale.format(needed)}
              </span>{" "}
              on {n > 1 ? `each of your ${n} upcoming exams` : "your next exam"} to
              reach your target of {scale.format(target)}.
            </Verdict>
          )}

          {hasTarget && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat
                label="Now"
                value={avg === null ? "—" : scale.format(avg)}
                className={avg === null ? "text-faint" : scale.colorFor(avg)}
              />
              <MiniStat
                label="Gap"
                value={
                  gap === null
                    ? "—"
                    : `${gap >= 0 ? "+" : ""}${gap.toFixed(2)}`
                }
                className={
                  gap === null
                    ? "text-faint"
                    : gap >= 0
                      ? "text-pass"
                      : "text-fail"
                }
              />
              <MiniStat
                label="Can still slip"
                value={
                  cushion === null || cushion === Infinity
                    ? "∞"
                    : String(cushion)
                }
                sub={cushion !== Infinity ? `at ${scale.format(worst)}` : "safe"}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  placeholder,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-muted">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="field mt-1.5 tabular-nums"
      />
      {suffix && <span className="mt-1 block text-xs text-faint">{suffix}</span>}
    </label>
  );
}

function Verdict({
  tone,
  children,
}: {
  tone: "pass" | "fail" | "neutral";
  children: React.ReactNode;
}) {
  const ring =
    tone === "pass"
      ? "border-pass/30 bg-pass/10"
      : tone === "fail"
        ? "border-fail/30 bg-fail/10"
        : "border-line bg-surface-2";
  return (
    <p className={`rounded-xl border ${ring} px-4 py-3 text-sm leading-relaxed text-fg`}>
      {children}
    </p>
  );
}

function MiniStat({
  label,
  value,
  sub,
  className = "text-fg",
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-2 py-2">
      <div className="eyebrow">{label}</div>
      <div className={`font-readout text-lg font-semibold ${className}`}>{value}</div>
      {sub && <div className="text-[0.65rem] text-faint">{sub}</div>}
    </div>
  );
}

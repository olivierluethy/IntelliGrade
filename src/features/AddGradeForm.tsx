import { useState } from "react";
import { useStore } from "../store/useStore";
import { Button } from "../components/Button";
import { Plus } from "../components/Icon";
import type { GradeScale } from "../domain/grade-scale";

type Props = { semesterId: string; subjectId: string; scale: GradeScale };

export function AddGradeForm({ semesterId, subjectId, scale }: Props) {
  const addGrade = useStore((s) => s.addGrade);
  const [value, setValue] = useState("");
  const [weight, setWeight] = useState("1");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const v = parseFloat(value);
    const w = parseFloat(weight);
    if (Number.isNaN(v) || !scale.clampValid(v)) {
      setError(`Grade must be between ${scale.min} and ${scale.max}.`);
      return;
    }
    if (Number.isNaN(w) || w <= 0) {
      setError("Weight must be a positive number.");
      return;
    }
    addGrade(semesterId, subjectId, {
      value: v,
      weight: w,
      label: label.trim() || undefined,
    });
    setValue("");
    setWeight("1");
    setLabel("");
    setError("");
  };

  const input =
    "rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60";

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          type="number"
          step="0.05"
          placeholder="Grade"
          aria-label="Grade"
          className={`${input} w-24`}
        />
        <input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          type="number"
          step="0.5"
          placeholder="Weight"
          aria-label="Weight"
          className={`${input} w-24`}
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Label (optional)"
          aria-label="Grade label"
          className={`${input} min-w-0 flex-1`}
        />
        <Button onClick={submit}>
          <Plus size={16} /> Add grade
        </Button>
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}

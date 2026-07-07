import { useState } from "react";
import { useStore } from "../store/useStore";
import { Button } from "../components/Button";
import { SectionHeader } from "../components/SectionHeader";
import { Plus } from "../components/Icon";
import type { GradeScale } from "../domain/grade-scale";
import { parseGradeInput } from "../domain/parseGradeInput";

type Props = { semesterId: string; subjectId: string; scale: GradeScale };

export function AddGradeForm({ semesterId, subjectId, scale }: Props) {
  const addGrade = useStore((s) => s.addGrade);
  const [value, setValue] = useState("");
  const [weight, setWeight] = useState("1");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const parsed = parseGradeInput(value, weight, scale);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    addGrade(semesterId, subjectId, {
      value: parsed.value,
      weight: parsed.weight,
      label: label.trim() || undefined,
    });
    setValue("");
    setWeight("1");
    setLabel("");
    setError("");
  };

  return (
    <div>
      <SectionHeader
        icon={Plus}
        title="Add a grade"
        hint={`On the ${scale.format(scale.min)}–${scale.format(scale.max)} scale. Weight = how much it counts.`}
      />
      <div className="grid grid-cols-2 gap-2.5">
        <label className="text-sm">
          <span className="font-medium text-muted">Grade</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            type="number"
            step="0.05"
            placeholder={scale.format(scale.passThreshold)}
            aria-label="Grade"
            className="field mt-1 tabular-nums"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-muted">Weight</span>
          <input
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            type="number"
            step="0.5"
            placeholder="1"
            aria-label="Weight"
            className="field mt-1 tabular-nums"
          />
        </label>
      </div>
      <label className="mt-2.5 block text-sm">
        <span className="font-medium text-muted">Label (optional)</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. Midterm"
          aria-label="Grade label"
          className="field mt-1"
        />
      </label>
      {error && <p className="mt-2 text-sm text-fail">{error}</p>}
      <Button onClick={submit} className="mt-3 w-full">
        <Plus size={16} /> Add grade
      </Button>
    </div>
  );
}

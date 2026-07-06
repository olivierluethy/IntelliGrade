import { useState } from "react";
import { useStore } from "../store/useStore";
import { NumberField } from "../components/NumberField";
import type { GradeScale } from "../domain/grade-scale";

type Props = {
  semesterId: string;
  subjectId: string;
  target: number | undefined;
  scale: GradeScale;
};

export function TargetEditor({ semesterId, subjectId, target, scale }: Props) {
  const setSubjectTarget = useStore((s) => s.setSubjectTarget);
  const [text, setText] = useState(target !== undefined ? String(target) : "");

  const commit = (v: string) => {
    setText(v);
    const n = parseFloat(v);
    if (v.trim() === "" || Number.isNaN(n)) {
      setSubjectTarget(semesterId, subjectId, undefined);
    } else {
      setSubjectTarget(semesterId, subjectId, n);
    }
  };

  return (
    <div className="w-28">
      <NumberField
        label="Target"
        value={text}
        onChange={commit}
        min={scale.min}
        max={scale.max}
        placeholder={`e.g. ${scale.format(scale.passThreshold + 1)}`}
      />
    </div>
  );
}

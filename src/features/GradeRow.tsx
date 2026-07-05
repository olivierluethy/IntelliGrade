import { useState } from "react";
import { useStore } from "../store/useStore";
import { IconButton } from "../components/IconButton";
import { Trash2, Pencil, Check, X } from "../components/Icon";
import type { GradeScale } from "../domain/grade-scale";
import type { Grade as GradeType } from "../domain/types";

type Props = {
  semesterId: string;
  subjectId: string;
  grade: GradeType;
  scale: GradeScale;
};

export function GradeRow({ semesterId, subjectId, grade, scale }: Props) {
  const updateGrade = useStore((s) => s.updateGrade);
  const deleteGrade = useStore((s) => s.deleteGrade);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(grade.value));
  const [weight, setWeight] = useState(String(grade.weight));

  const save = () => {
    const v = parseFloat(value);
    const w = parseFloat(weight);
    if (Number.isNaN(v) || !scale.clampValid(v) || Number.isNaN(w) || w <= 0)
      return;
    updateGrade(semesterId, subjectId, grade.id, { value: v, weight: w });
    setEditing(false);
  };

  const input =
    "w-20 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60";

  return (
    <tr className="border-b border-slate-800/60">
      <td className="py-2">
        {editing ? (
          <input
            className={input}
            type="number"
            step="0.05"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        ) : (
          <span className={`font-semibold tabular-nums ${scale.colorFor(grade.value)}`}>
            {scale.format(grade.value)}
          </span>
        )}
      </td>
      <td className="py-2">
        {editing ? (
          <input
            className={input}
            type="number"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        ) : (
          <span className="tabular-nums text-slate-300">{grade.weight}</span>
        )}
      </td>
      <td className="py-2 text-slate-400">{grade.label ?? "—"}</td>
      <td className="py-2">
        <div className="flex justify-end gap-1">
          {editing ? (
            <>
              <IconButton icon={Check} label="Save" onClick={save} />
              <IconButton
                icon={X}
                label="Cancel"
                onClick={() => {
                  setValue(String(grade.value));
                  setWeight(String(grade.weight));
                  setEditing(false);
                }}
              />
            </>
          ) : (
            <>
              <IconButton
                icon={Pencil}
                label="Edit grade"
                onClick={() => setEditing(true)}
              />
              <IconButton
                icon={Trash2}
                label="Delete grade"
                variant="danger"
                onClick={() => deleteGrade(semesterId, subjectId, grade.id)}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

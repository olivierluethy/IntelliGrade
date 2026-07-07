import { useState } from "react";
import { useStore } from "../store/useStore";
import { Button } from "../components/Button";
import { Plus } from "../components/Icon";
import { SCALE_LIST, getScale } from "../domain/grade-scale";

export function SemesterSwitcher() {
  const { semesters, activeSemesterId } = useStore((s) => s.data);
  const setActive = useStore((s) => s.setActiveSemester);
  const addSemester = useStore((s) => s.addSemester);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [scaleId, setScaleId] = useState(SCALE_LIST[0].id);

  const activeSemester = semesters.find((s) => s.id === activeSemesterId);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = addSemester(trimmed, scaleId);
    setActive(id);
    setName("");
    setScaleId(SCALE_LIST[0].id);
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="semester-select" className="eyebrow">
        Semester
      </label>
      <select
        id="semester-select"
        value={activeSemesterId ?? ""}
        onChange={(e) => setActive(e.target.value)}
        aria-label="Select semester"
        className="field"
      >
        {semesters.length === 0 && <option value="">No semesters yet</option>}
        {semesters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {activeSemester && (
        <p className="text-xs text-faint">
          Grading scale: {getScale(activeSemester.scaleId).label}
        </p>
      )}

      {adding ? (
        <div className="space-y-2 rounded-xl border border-line bg-surface p-2.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. HS25"
            aria-label="New semester name"
            className="field"
          />
          <select
            value={scaleId}
            onChange={(e) => setScaleId(e.target.value)}
            aria-label="Grade scale"
            className="field"
          >
            {SCALE_LIST.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button onClick={submit} className="flex-1">
              Add semester
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setAdding(true)} className="w-full">
          <Plus size={16} /> New semester
        </Button>
      )}
    </div>
  );
}

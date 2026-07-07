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

  const control =
    "w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60";

  return (
    <div className="space-y-2">
      <label
        htmlFor="semester-select"
        className="text-xs font-medium uppercase tracking-wide text-slate-500"
      >
        Semester
      </label>
      <select
        id="semester-select"
        value={activeSemesterId ?? ""}
        onChange={(e) => setActive(e.target.value)}
        aria-label="Select semester"
        className={control}
      >
        {semesters.length === 0 && <option value="">No semesters yet</option>}
        {semesters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {activeSemester && (
        <p className="text-xs text-slate-500">
          Scale: {getScale(activeSemester.scaleId).label}
        </p>
      )}

      {adding ? (
        <div className="space-y-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. HS25"
            aria-label="New semester name"
            className={control}
          />
          <select
            value={scaleId}
            onChange={(e) => setScaleId(e.target.value)}
            aria-label="Grade scale"
            className={control}
          >
            {SCALE_LIST.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <Button onClick={submit}>Add</Button>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setAdding(true)}>
          <Plus size={16} /> New semester
        </Button>
      )}
    </div>
  );
}

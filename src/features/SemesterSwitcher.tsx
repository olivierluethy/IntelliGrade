import { useState } from "react";
import { useStore } from "../store/useStore";
import { Button } from "../components/Button";
import { Plus } from "../components/Icon";

export function SemesterSwitcher() {
  const { semesters, activeSemesterId } = useStore((s) => s.data);
  const setActive = useStore((s) => s.setActiveSemester);
  const addSemester = useStore((s) => s.addSemester);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = addSemester(trimmed);
    setActive(id);
    setName("");
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Semester
      </label>
      <select
        value={activeSemesterId ?? ""}
        onChange={(e) => setActive(e.target.value)}
        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
      >
        {semesters.length === 0 && <option value="">No semesters yet</option>}
        {semesters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {adding ? (
        <div className="flex gap-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. HS25"
            className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
          />
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

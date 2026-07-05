import { useState } from "react";
import { useStore } from "../store/useStore";
import { Button } from "../components/Button";
import { Plus, ChevronRight } from "../components/Icon";

type Props = {
  selectedSubjectId: string | null;
  onSelectSubject: (id: string) => void;
};

export function SubjectList({ selectedSubjectId, onSelectSubject }: Props) {
  const data = useStore((s) => s.data);
  const addSubject = useStore((s) => s.addSubject);
  const [name, setName] = useState("");

  const semester = data.semesters.find((s) => s.id === data.activeSemesterId);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed || !semester) return;
    const id = addSubject(semester.id, trimmed);
    onSelectSubject(id);
    setName("");
  };

  if (!semester) {
    return (
      <p className="text-sm text-slate-500">
        Create a semester to add subjects.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Subjects
      </label>
      <ul className="space-y-1">
        {semester.subjects.map((sub) => {
          const active = sub.id === selectedSubjectId;
          return (
            <li key={sub.id}>
              <button
                onClick={() => onSelectSubject(sub.id)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-indigo-500/15 text-indigo-300"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {sub.name}
                <ChevronRight size={14} className="text-slate-600" />
              </button>
            </li>
          );
        })}
        {semester.subjects.length === 0 && (
          <li className="px-2.5 py-1 text-sm text-slate-500">
            No subjects yet.
          </li>
        )}
      </ul>
      <div className="flex gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add subject"
          className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
        />
        <Button onClick={submit}>
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useStore } from "../store/useStore";
import { IconButton } from "../components/IconButton";
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
      <p className="text-sm text-faint">Create a semester to add subjects.</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="eyebrow">Subjects</div>
      <ul className="space-y-1">
        {semester.subjects.map((sub) => {
          const active = sub.id === selectedSubjectId;
          return (
            <li key={sub.id}>
              <button
                onClick={() => onSelectSubject(sub.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                  active
                    ? "bg-brand/15 font-medium text-brand-bright"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <span className="truncate">{sub.name}</span>
                <ChevronRight
                  size={14}
                  className={active ? "text-brand" : "text-faint"}
                />
              </button>
            </li>
          );
        })}
        {semester.subjects.length === 0 && (
          <li className="rounded-lg border border-dashed border-line px-3 py-2 text-sm text-faint">
            No subjects yet — add your first below.
          </li>
        )}
      </ul>
      <div className="flex gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add subject"
          aria-label="New subject name"
          className="field min-w-0 flex-1"
        />
        <IconButton icon={Plus} label="Add subject" onClick={submit} />
      </div>
    </div>
  );
}

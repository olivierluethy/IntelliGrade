import { useState } from "react";
import { useStore } from "../store/useStore";
import type { Exam } from "../domain/types";
import type { GradeScale } from "../domain/grade-scale";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { CalendarClock, CalendarPlus, Trash2, Check } from "../components/Icon";

type Props = { semesterId: string; subjectId: string; exams: Exam[]; scale: GradeScale };

function daysUntil(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const then = new Date(y, m - 1, d).setHours(0, 0, 0, 0);
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((then - now) / 86_400_000);
}

function whenLabel(iso: string): { text: string; tone: string } {
  const d = daysUntil(iso);
  if (d < 0) return { text: `${-d}d ago`, tone: "text-fail" };
  if (d === 0) return { text: "today", tone: "text-warn" };
  if (d <= 7) return { text: `in ${d}d`, tone: "text-warn" };
  return { text: `in ${d}d`, tone: "text-faint" };
}

export function ExamPlanner({ semesterId, subjectId, exams, scale }: Props) {
  const addExam = useStore((s) => s.addExam);
  const deleteExam = useStore((s) => s.deleteExam);
  const recordExamGrade = useStore((s) => s.recordExamGrade);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("1");
  const [error, setError] = useState("");
  const [recording, setRecording] = useState<Record<string, string>>({});

  const submit = () => {
    const w = parseFloat(weight);
    if (!name.trim()) return setError("Give the exam a name.");
    if (!date) return setError("Pick a date.");
    if (Number.isNaN(w) || w <= 0) return setError("Weight must be a positive number.");
    addExam(semesterId, subjectId, { name: name.trim(), date, weight: w });
    setName("");
    setDate("");
    setWeight("1");
    setError("");
  };

  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card>
      <SectionHeader
        icon={CalendarClock}
        title="Upcoming exams"
        hint="Plan what's ahead. Record a grade when you get it — it moves into your grades and updates the plan."
      />

      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[10rem] flex-1 text-sm">
          <span className="font-medium text-muted">Exam name</span>
          <input
            className="field mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Final exam"
            aria-label="Exam name"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-muted">Date</span>
          <input
            className="field mt-1 [color-scheme:dark]"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Exam date"
          />
        </label>
        <label className="w-20 text-sm">
          <span className="font-medium text-muted">Weight</span>
          <input
            className="field mt-1 tabular-nums"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="1"
            aria-label="Weight"
          />
        </label>
        <Button onClick={submit}>
          <CalendarPlus size={16} /> Add exam
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-fail">{error}</p>}

      {sorted.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarClock}
          title="Nothing scheduled"
          description="Add an exam above to see it counted in your target planner."
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {sorted.map((exam) => {
            const when = whenLabel(exam.date);
            const raw = recording[exam.id] ?? "";
            const canRecord =
              !Number.isNaN(parseFloat(raw)) && scale.clampValid(parseFloat(raw));
            return (
              <li
                key={exam.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5"
              >
                <div className="min-w-[8rem] flex-1">
                  <div className="font-medium text-fg">{exam.name}</div>
                  <div className="text-xs text-faint">
                    {exam.date} · ×{exam.weight}{" "}
                    <span className={when.tone}>· {when.text}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    className="field w-24 tabular-nums"
                    type="number"
                    value={raw}
                    aria-label={`Grade for ${exam.name}`}
                    placeholder="Grade"
                    onChange={(v) =>
                      setRecording((r) => ({ ...r, [exam.id]: v.target.value }))
                    }
                  />
                  <Button
                    variant="ghost"
                    disabled={!canRecord}
                    onClick={() => {
                      const v = parseFloat(raw);
                      if (Number.isNaN(v) || !scale.clampValid(v)) return;
                      recordExamGrade(semesterId, subjectId, exam.id, v);
                      setRecording((r) => {
                        const next = { ...r };
                        delete next[exam.id];
                        return next;
                      });
                    }}
                  >
                    <Check size={16} /> Record
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => deleteExam(semesterId, subjectId, exam.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

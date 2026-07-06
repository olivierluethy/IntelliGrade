import { useState } from "react";
import { useStore } from "../store/useStore";
import type { Exam } from "../domain/types";
import type { GradeScale } from "../domain/grade-scale";
import { NumberField } from "../components/NumberField";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { CalendarClock, CalendarPlus, Trash2, Check } from "../components/Icon";

type Props = { semesterId: string; subjectId: string; exams: Exam[]; scale: GradeScale };

export function ExamPlanner({ semesterId, subjectId, exams, scale }: Props) {
  const addExam = useStore((s) => s.addExam);
  const deleteExam = useStore((s) => s.deleteExam);
  const recordExamGrade = useStore((s) => s.recordExamGrade);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("1");
  const [error, setError] = useState("");
  const [recording, setRecording] = useState<Record<string, string>>({});

  const input =
    "rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60";

  const submit = () => {
    const w = parseFloat(weight);
    if (!name.trim()) return setError("Name is required.");
    if (!date) return setError("Date is required.");
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
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <CalendarClock size={16} className="text-indigo-400" />
        Upcoming exams
      </div>

      <div className="flex flex-wrap items-end gap-1.5">
        <input
          className={`${input} min-w-0 flex-1`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exam name"
          aria-label="Exam name"
        />
        <input
          className={input}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Exam date"
        />
        <div className="w-20">
          <NumberField label="Weight" value={weight} onChange={setWeight} placeholder="1" />
        </div>
        <Button onClick={submit}>
          <CalendarPlus size={16} /> Add exam
        </Button>
      </div>
      {error && <p className="mt-1.5 text-sm text-rose-400">{error}</p>}

      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No upcoming exams.</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {sorted.map((exam) => (
            <li
              key={exam.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-200">{exam.name}</span>
              <span className="text-slate-500">{exam.date}</span>
              <span className="text-slate-500">×{exam.weight}</span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-24">
                  <NumberField
                    label="Grade"
                    value={recording[exam.id] ?? ""}
                    onChange={(v) => setRecording((r) => ({ ...r, [exam.id]: v }))}
                    placeholder="Grade"
                  />
                </div>
                <Button
                  variant="ghost"
                  disabled={
                    Number.isNaN(parseFloat(recording[exam.id] ?? "")) ||
                    !scale.clampValid(parseFloat(recording[exam.id] ?? ""))
                  }
                  onClick={() => {
                    const v = parseFloat(recording[exam.id] ?? "");
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
                <Button variant="danger" onClick={() => deleteExam(semesterId, subjectId, exam.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

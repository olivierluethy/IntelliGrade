# IntelliGrade Exam Planner + Smart Alerts (Sub-project 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-subject exam planning (upcoming exams with dates, convertible to grades) and a global derived smart-alerts view.

**Architecture:** A new `Exam` entity on each subject (`subject.exams`) with a `schemaVersion` 1→2 migration; three store actions (add/delete/record); a pure `domain/alerts.ts` that computes four alert kinds from semesters + today; an `ExamPlanner` card in the subject detail; and an `Alerts` sidebar view with a count badge.

**Tech Stack:** Vite + React 18 + TypeScript + Tailwind v4 + Zustand + Vitest + lucide-react.

## Global Constraints

- **Grade scale is abstract:** all grade math goes through `GradeScale`/`getScale` and the `Grade`/`Exam` types; never hard-code `1`/`6`/`4`.
- **Weighted-average convention:** reuse `weightedAverage` from `src/domain/calc.ts`; do not reimplement averaging.
- **TDD for domain + persistence + store:** failing test first, then minimal implementation. Component/interaction tests are NOT required (SP0–SP2 convention).
- **No new persisted state beyond `Subject.exams`.** Alerts are recomputed each render, never stored.
- **Purity:** `computeAlerts` takes `today: Date` as a parameter (UI passes `new Date()`); no `Date.now()`/`new Date()` inside the domain.
- **Accessible inputs:** number inputs use the SP1 `NumberField`; date/text inputs get an associated `<label>` and `aria-label`.
- **Verification gate (before every commit that touches TS):** `npx tsc -b` clean and `npm test` green. Tasks touching components additionally run `npm run build`.
- **Commit style:** conventional commits, matching existing history.

---

### Task 1: Data model + v1→v2 migration

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/store/persistence.ts`
- Modify: `src/store/useStore.ts` (only `addSubject` — initialize `exams: []`)
- Test: `src/store/persistence.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Exam = { id: string; name: string; date: string; weight: number };
  // Subject gains: exams: Exam[]
  // AppData.schemaVersion is now 2
  export function emptyAppData(): AppData;            // schemaVersion 2
  export function migrate(raw: unknown): AppData;     // v1 → v2 (adds exams: []); v2 passthrough; else empty
  ```

- [ ] **Step 1: Write the failing migration tests**

Replace the existing `describe("migrate", ...)` block in `src/store/persistence.test.ts` with:

```ts
describe("migrate", () => {
  it("returns empty data for null", () => {
    expect(migrate(null)).toEqual(emptyAppData());
  });

  it("returns empty data for corrupt/unknown version", () => {
    expect(migrate({ schemaVersion: 99 })).toEqual(emptyAppData());
    expect(migrate({ foo: "bar" })).toEqual(emptyAppData());
  });

  it("upgrades v1 data to v2, adding exams: [] to each subject", () => {
    const v1 = {
      schemaVersion: 1,
      activeSemesterId: "s1",
      semesters: [
        {
          id: "s1",
          name: "HS25",
          scaleId: "swiss",
          subjects: [{ id: "sub1", name: "Math", grades: [] }],
        },
      ],
    };
    const out = migrate(v1);
    expect(out.schemaVersion).toBe(2);
    expect(out.activeSemesterId).toBe("s1");
    expect(out.semesters[0].subjects[0].exams).toEqual([]);
  });

  it("passes through valid v2 data (defaulting missing exams)", () => {
    const v2 = {
      schemaVersion: 2,
      activeSemesterId: "s1",
      semesters: [
        {
          id: "s1",
          name: "HS25",
          scaleId: "swiss",
          subjects: [
            { id: "sub1", name: "Math", grades: [], exams: [{ id: "e1", name: "Test", date: "2026-07-10", weight: 1 }] },
          ],
        },
      ],
    };
    expect(migrate(v2)).toEqual(v2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- persistence`
Expected: FAIL — the v1 upgrade test fails (current `migrate` passes v1 through unchanged / lacks `exams`).

- [ ] **Step 3: Update the type model**

In `src/domain/types.ts`, add the `Exam` type, add `exams` to `Subject`, and bump `AppData.schemaVersion`:

```ts
export type Grade = {
  id: string;
  value: number;
  weight: number;
  label?: string;
  date?: string;
  category?: string;
};

export type Exam = {
  id: string;
  name: string;
  date: string; // ISO calendar date, 'YYYY-MM-DD'
  weight: number;
};

export type Subject = {
  id: string;
  name: string;
  targetGrade?: number;
  grades: Grade[];
  exams: Exam[];
};

export type Semester = {
  id: string;
  name: string;
  scaleId: string;
  subjects: Subject[];
};

export type AppData = {
  schemaVersion: 2;
  activeSemesterId: string | null;
  semesters: Semester[];
};
```

- [ ] **Step 4: Implement the migration**

Replace the contents of `src/store/persistence.ts` with:

```ts
import type { AppData, Semester } from "../domain/types";

export const STORAGE_KEY = "intelligrade.data";

export function emptyAppData(): AppData {
  return { schemaVersion: 2, activeSemesterId: null, semesters: [] };
}

// Ensure every subject has an `exams` array (v1 subjects lack it).
function withExams(semesters: Semester[]): Semester[] {
  return semesters.map((s) => ({
    ...s,
    subjects: s.subjects.map((sub) => ({ ...sub, exams: sub.exams ?? [] })),
  }));
}

export function migrate(raw: unknown): AppData {
  if (!raw || typeof raw !== "object") return emptyAppData();
  const d = raw as { schemaVersion?: number; activeSemesterId?: string | null; semesters?: unknown };
  if (!Array.isArray(d.semesters)) return emptyAppData();
  if (d.schemaVersion === 1 || d.schemaVersion === 2) {
    return {
      schemaVersion: 2,
      activeSemesterId: d.activeSemesterId ?? null,
      semesters: withExams(d.semesters as Semester[]),
    };
  }
  return emptyAppData();
}

export function loadAppData(
  storage: Pick<Storage, "getItem"> = localStorage
): AppData {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyAppData();
    return migrate(JSON.parse(raw));
  } catch {
    return emptyAppData();
  }
}

export function saveAppData(
  data: AppData,
  storage: Pick<Storage, "setItem"> = localStorage
): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — non-fatal
  }
}
```

- [ ] **Step 5: Initialize `exams` in `addSubject`**

In `src/store/useStore.ts`, find the `addSubject` action and change the pushed subject literal from `{ id, name, grades: [] }` to include `exams`:

```ts
    addSubject: (semesterId, name) => {
      const id = newId();
      commit(
        mapSemester(get().data, semesterId, (s) => ({
          ...s,
          subjects: [...s.subjects, { id, name, grades: [], exams: [] }],
        }))
      );
      return id;
    },
```

- [ ] **Step 6: Run the full gate**

Run: `npx tsc -b && npm test && npm run build`
Expected: tsc clean; all tests green (persistence migration tests pass); build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/domain/types.ts src/store/persistence.ts src/store/useStore.ts src/store/persistence.test.ts
git commit -m "feat(model): add Exam entity and v1->v2 migration"
```

---

### Task 2: Store actions — add/delete/record exam

**Files:**
- Modify: `src/store/useStore.ts`
- Test: `src/store/useStore.test.ts`

**Interfaces:**
- Consumes: `Exam` type; existing `mapSubject` helper, `newId`, `commit`.
- Produces (added to the store `State` type and returned object):
  ```ts
  addExam(semesterId: string, subjectId: string, exam: Omit<Exam, "id">): string;
  deleteExam(semesterId: string, subjectId: string, examId: string): void;
  recordExamGrade(semesterId: string, subjectId: string, examId: string, value: number): void;
  ```

- [ ] **Step 1: Write the failing tests**

Append to `src/store/useStore.test.ts` (inside the existing `describe("store CRUD", ...)` block, before its closing `});`):

```ts
  it("adds and deletes an exam", () => {
    const sem = useStore.getState().addSemester("HS25");
    const sub = useStore.getState().addSubject(sem, "Math");
    const eid = useStore
      .getState()
      .addExam(sem, sub, { name: "Vectors", date: "2026-07-10", weight: 2 });
    let exams = useStore.getState().data.semesters[0].subjects[0].exams;
    expect(exams).toHaveLength(1);
    expect(exams[0].name).toBe("Vectors");

    useStore.getState().deleteExam(sem, sub, eid);
    exams = useStore.getState().data.semesters[0].subjects[0].exams;
    expect(exams).toHaveLength(0);
  });

  it("records an exam as a grade and removes the exam", () => {
    const sem = useStore.getState().addSemester("HS25");
    const sub = useStore.getState().addSubject(sem, "Math");
    const eid = useStore
      .getState()
      .addExam(sem, sub, { name: "Vectors", date: "2026-07-10", weight: 2 });

    useStore.getState().recordExamGrade(sem, sub, eid, 5.5);
    const subject = useStore.getState().data.semesters[0].subjects[0];
    expect(subject.exams).toHaveLength(0);
    expect(subject.grades).toHaveLength(1);
    expect(subject.grades[0].value).toBe(5.5);
    expect(subject.grades[0].weight).toBe(2);
    expect(subject.grades[0].label).toBe("Vectors");
    expect(subject.grades[0].date).toBe("2026-07-10");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- useStore`
Expected: FAIL — `addExam`/`deleteExam`/`recordExamGrade` are not functions.

- [ ] **Step 3: Add the actions**

In `src/store/useStore.ts`: import `Exam` (add it to the existing type import from `../domain/types`), add the three signatures to the `State` type, and add the three actions to the returned object (place them after `setSubjectTarget`).

Type import line becomes:
```ts
import type { AppData, Grade, Semester, Subject, Exam } from "../domain/types";
```

Add to the `State` type:
```ts
  addExam: (semesterId: string, subjectId: string, exam: Omit<Exam, "id">) => string;
  deleteExam: (semesterId: string, subjectId: string, examId: string) => void;
  recordExamGrade: (
    semesterId: string,
    subjectId: string,
    examId: string,
    value: number
  ) => void;
```

Add the actions to the returned object:
```ts
    addExam: (semesterId, subjectId, exam) => {
      const id = newId();
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => ({
          ...sub,
          exams: [...sub.exams, { ...exam, id }],
        }))
      );
      return id;
    },

    deleteExam: (semesterId, subjectId, examId) =>
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => ({
          ...sub,
          exams: sub.exams.filter((e) => e.id !== examId),
        }))
      ),

    recordExamGrade: (semesterId, subjectId, examId, value) =>
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => {
          const exam = sub.exams.find((e) => e.id === examId);
          if (!exam) return sub;
          return {
            ...sub,
            grades: [
              ...sub.grades,
              {
                id: newId(),
                value,
                weight: exam.weight,
                label: exam.name,
                date: exam.date,
              },
            ],
            exams: sub.exams.filter((e) => e.id !== examId),
          };
        })
      ),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- useStore`
Expected: PASS (existing + 2 new tests).

- [ ] **Step 5: Commit**

```bash
git add src/store/useStore.ts src/store/useStore.test.ts
git commit -m "feat(store): add addExam, deleteExam, recordExamGrade actions"
```

---

### Task 3: Domain — `computeAlerts`

**Files:**
- Create: `src/domain/alerts.ts`
- Test: `src/domain/alerts.test.ts`

**Interfaces:**
- Consumes: `Semester` from `./types`, `weightedAverage` from `./calc`, `getScale` from `./grade-scale`.
- Produces:
  ```ts
  export const EXAM_SOON_DAYS = 7;
  export type Alert =
    | { kind: "exam-soon"; semesterId: string; subjectId: string; subjectName: string; examId: string; examName: string; date: string; daysUntil: number }
    | { kind: "exam-ungraded"; semesterId: string; subjectId: string; subjectName: string; examId: string; examName: string; date: string; daysAgo: number }
    | { kind: "below-target"; semesterId: string; subjectId: string; subjectName: string; average: number; target: number }
    | { kind: "no-grades"; semesterId: string; subjectId: string; subjectName: string };
  export function computeAlerts(semesters: Semester[], today: Date): Alert[];
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/alerts.test.ts
import { describe, it, expect } from "vitest";
import { computeAlerts, EXAM_SOON_DAYS } from "./alerts";
import type { Semester, Subject } from "./types";

const today = new Date(2026, 6, 6); // 2026-07-06 (local)

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function subject(over: Partial<Subject> = {}): Subject {
  return { id: "sub", name: "Math", grades: [], exams: [], ...over };
}

function semester(sub: Subject): Semester {
  return { id: "sem", name: "HS25", scaleId: "swiss", subjects: [sub] };
}

describe("computeAlerts", () => {
  it("returns [] for no semesters", () => {
    expect(computeAlerts([], today)).toEqual([]);
  });

  it("flags an exam within EXAM_SOON_DAYS (boundary at 0 and 7, not 8)", () => {
    const mk = (d: string) =>
      computeAlerts(
        [semester(subject({ grades: [{ id: "g", value: 5, weight: 1 }], exams: [{ id: "e", name: "T", date: d, weight: 1 }] }))],
        today
      );
    expect(mk(iso(2026, 7, 6))[0].kind).toBe("exam-soon"); // 0 days
    expect(mk(iso(2026, 7, 13))[0].kind).toBe("exam-soon"); // 7 days
    expect(mk(iso(2026, 7, 14)).some((a) => a.kind === "exam-soon")).toBe(false); // 8 days
    expect(EXAM_SOON_DAYS).toBe(7);
  });

  it("flags a past exam as ungraded with correct daysAgo", () => {
    const alerts = computeAlerts(
      [semester(subject({ grades: [{ id: "g", value: 5, weight: 1 }], exams: [{ id: "e", name: "T", date: iso(2026, 7, 4), weight: 1 }] }))],
      today
    );
    const a = alerts.find((x) => x.kind === "exam-ungraded");
    expect(a).toBeTruthy();
    expect(a!.kind === "exam-ungraded" && a!.daysAgo).toBe(2);
  });

  it("flags below-target only when average is below the target", () => {
    const below = computeAlerts(
      [semester(subject({ targetGrade: 5, grades: [{ id: "g", value: 4, weight: 1 }] }))],
      today
    );
    expect(below.some((a) => a.kind === "below-target")).toBe(true);

    const atOrAbove = computeAlerts(
      [semester(subject({ targetGrade: 5, grades: [{ id: "g", value: 5, weight: 1 }] }))],
      today
    );
    expect(atOrAbove.some((a) => a.kind === "below-target")).toBe(false);
  });

  it("flags a subject with no grades", () => {
    const alerts = computeAlerts([semester(subject({ grades: [] }))], today);
    expect(alerts.some((a) => a.kind === "no-grades")).toBe(true);
  });

  it("orders urgency-first: exam-soon, exam-ungraded, below-target, no-grades", () => {
    const sub = subject({
      targetGrade: 5,
      grades: [{ id: "g", value: 4, weight: 1 }],
      exams: [
        { id: "e1", name: "Soon", date: iso(2026, 7, 8), weight: 1 },
        { id: "e2", name: "Past", date: iso(2026, 7, 1), weight: 1 },
      ],
    });
    const kinds = computeAlerts([semester(sub)], today).map((a) => a.kind);
    expect(kinds).toEqual(["exam-soon", "exam-ungraded", "below-target"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- alerts`
Expected: FAIL — cannot resolve `./alerts`.

- [ ] **Step 3: Write the implementation**

```ts
// src/domain/alerts.ts
import type { Semester } from "./types";
import { weightedAverage } from "./calc";
import { getScale } from "./grade-scale";

export const EXAM_SOON_DAYS = 7;

export type Alert =
  | { kind: "exam-soon"; semesterId: string; subjectId: string; subjectName: string; examId: string; examName: string; date: string; daysUntil: number }
  | { kind: "exam-ungraded"; semesterId: string; subjectId: string; subjectName: string; examId: string; examName: string; date: string; daysAgo: number }
  | { kind: "below-target"; semesterId: string; subjectId: string; subjectName: string; average: number; target: number }
  | { kind: "no-grades"; semesterId: string; subjectId: string; subjectName: string };

const MS_PER_DAY = 86_400_000;

function midnight(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function parseDateMidnight(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function computeAlerts(semesters: Semester[], today: Date): Alert[] {
  const todayMid = midnight(today);
  const soon: Extract<Alert, { kind: "exam-soon" }>[] = [];
  const ungraded: Extract<Alert, { kind: "exam-ungraded" }>[] = [];
  const belowTarget: Alert[] = [];
  const noGrades: Alert[] = [];

  for (const semester of semesters) {
    const scale = getScale(semester.scaleId);
    for (const subject of semester.subjects) {
      const base = {
        semesterId: semester.id,
        subjectId: subject.id,
        subjectName: subject.name,
      };

      for (const exam of subject.exams) {
        const daysUntil = Math.round(
          (parseDateMidnight(exam.date) - todayMid) / MS_PER_DAY
        );
        if (daysUntil >= 0 && daysUntil <= EXAM_SOON_DAYS) {
          soon.push({ kind: "exam-soon", ...base, examId: exam.id, examName: exam.name, date: exam.date, daysUntil });
        } else if (daysUntil < 0) {
          ungraded.push({ kind: "exam-ungraded", ...base, examId: exam.id, examName: exam.name, date: exam.date, daysAgo: -daysUntil });
        }
      }

      if (subject.targetGrade !== undefined) {
        const avg = weightedAverage(subject.grades);
        if (avg !== null) {
          const below = scale.higherIsBetter
            ? avg < subject.targetGrade
            : avg > subject.targetGrade;
          if (below) {
            belowTarget.push({ kind: "below-target", ...base, average: avg, target: subject.targetGrade });
          }
        }
      }

      if (subject.grades.length === 0) {
        noGrades.push({ kind: "no-grades", ...base });
      }
    }
  }

  soon.sort((a, b) => a.daysUntil - b.daysUntil);
  ungraded.sort((a, b) => b.daysAgo - a.daysAgo);
  return [...soon, ...ungraded, ...belowTarget, ...noGrades];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- alerts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/alerts.ts src/domain/alerts.test.ts
git commit -m "feat(domain): add computeAlerts for smart alerts"
```

---

### Task 4: ExamPlanner card in SubjectDetail

**Files:**
- Modify: `src/components/Icon.tsx` (add `CalendarClock`, `CalendarPlus`)
- Create: `src/features/ExamPlanner.tsx`
- Modify: `src/features/SubjectDetail.tsx` (render the ExamPlanner card)

**Interfaces:**
- Consumes: `useStore` (`data` via parent, `addExam`, `deleteExam`, `recordExamGrade`); `Exam` type; `GradeScale`; `NumberField`, `Card`, `Button`, icons.
- Produces:
  ```ts
  type ExamPlannerProps = { semesterId: string; subjectId: string; exams: Exam[]; scale: GradeScale };
  export function ExamPlanner(props: ExamPlannerProps): JSX.Element;
  ```

- [ ] **Step 1: Add icons**

Edit `src/components/Icon.tsx` to add `CalendarClock` and `CalendarPlus` to the re-export list (keep all existing icons):

```tsx
export {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  GraduationCap,
  Calculator,
  ChevronRight,
  BookOpen,
  Target,
  ClipboardCheck,
  SlidersHorizontal,
  Percent,
  Wrench,
  ShieldAlert,
  CalendarClock,
  CalendarPlus,
} from "lucide-react";
```

- [ ] **Step 2: Create the ExamPlanner**

```tsx
// src/features/ExamPlanner.tsx
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
                <input
                  className={`${input} w-20`}
                  type="number"
                  step="0.05"
                  placeholder="Grade"
                  aria-label={`Grade for ${exam.name}`}
                  value={recording[exam.id] ?? ""}
                  onChange={(e) =>
                    setRecording((r) => ({ ...r, [exam.id]: e.target.value }))
                  }
                />
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
```

- [ ] **Step 3: Render ExamPlanner in SubjectDetail**

In `src/features/SubjectDetail.tsx`, add the import:

```tsx
import { ExamPlanner } from "./ExamPlanner";
```

Then insert this immediately AFTER the `<Card>` wrapping `<PointsCalculator ... />` and BEFORE the scenario section (`{subject.targetGrade === undefined ? ...}`):

```tsx
      <ExamPlanner
        semesterId={semesterId}
        subjectId={subjectId}
        exams={subject.exams}
        scale={scale}
      />
```

- [ ] **Step 4: Verify type-check, tests, and build**

Run: `npx tsc -b && npm test && npm run build`
Expected: tsc clean; tests green; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/Icon.tsx src/features/ExamPlanner.tsx src/features/SubjectDetail.tsx
git commit -m "feat(ui): add exam planner card to subject detail"
```

---

### Task 5: Alerts nav + AlertsView

**Files:**
- Modify: `src/components/Icon.tsx` (add `Bell`, `AlertTriangle`, `TrendingDown`, `FileWarning`)
- Create: `src/features/alerts/AlertsView.tsx`
- Modify: `src/features/Sidebar.tsx` (add Alerts nav button + badge)
- Modify: `src/App.tsx` (compute alerts, extend `view`, render AlertsView, navigation)

**Interfaces:**
- Consumes: `computeAlerts`/`Alert` (Task 3); `useStore` (`data`, `setActiveSemester`); `Card`, icons.
- Produces:
  ```ts
  // Sidebar props gain: view: "grades" | "tools" | "alerts"; alertCount: number
  type AlertsViewProps = { alerts: Alert[]; onOpenSubject: (semesterId: string, subjectId: string) => void };
  export function AlertsView(props: AlertsViewProps): JSX.Element;
  ```

- [ ] **Step 1: Add icons**

Add to the `src/components/Icon.tsx` re-export list (keep all existing): `Bell`, `AlertTriangle`, `TrendingDown`, `FileWarning`.

```tsx
export {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  GraduationCap,
  Calculator,
  ChevronRight,
  BookOpen,
  Target,
  ClipboardCheck,
  SlidersHorizontal,
  Percent,
  Wrench,
  ShieldAlert,
  CalendarClock,
  CalendarPlus,
  Bell,
  AlertTriangle,
  TrendingDown,
  FileWarning,
} from "lucide-react";
```

- [ ] **Step 2: Create the AlertsView**

```tsx
// src/features/alerts/AlertsView.tsx
import type { Alert } from "../../domain/alerts";
import { Card } from "../../components/Card";
import { AlertTriangle, CalendarClock, TrendingDown, FileWarning, ChevronRight } from "../../components/Icon";

type Props = {
  alerts: Alert[];
  onOpenSubject: (semesterId: string, subjectId: string) => void;
};

function describe(alert: Alert): { icon: JSX.Element; text: string } {
  switch (alert.kind) {
    case "exam-soon":
      return {
        icon: <CalendarClock size={16} className="text-amber-400" />,
        text: `${alert.subjectName}: "${alert.examName}" ${
          alert.daysUntil === 0 ? "is today" : `in ${alert.daysUntil} day(s)`
        } (${alert.date})`,
      };
    case "exam-ungraded":
      return {
        icon: <AlertTriangle size={16} className="text-rose-400" />,
        text: `${alert.subjectName}: "${alert.examName}" was ${alert.daysAgo} day(s) ago — record your grade`,
      };
    case "below-target":
      return {
        icon: <TrendingDown size={16} className="text-rose-400" />,
        text: `${alert.subjectName} is below target (${alert.average.toFixed(2)} / ${alert.target.toFixed(2)})`,
      };
    case "no-grades":
      return {
        icon: <FileWarning size={16} className="text-slate-400" />,
        text: `${alert.subjectName} has no grades yet`,
      };
  }
}

export function AlertsView({ alerts, onOpenSubject }: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Alerts</h2>
        <p className="text-sm text-slate-400">
          Everything that needs your attention, across all subjects.
        </p>
      </header>

      {alerts.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            Nothing needs attention — you're all caught up.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert, i) => {
            const { icon, text } = describe(alert);
            return (
              <li key={`${alert.kind}-${alert.subjectId}-${i}`}>
                <button
                  type="button"
                  onClick={() => onOpenSubject(alert.semesterId, alert.subjectId)}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                >
                  {icon}
                  <span className="min-w-0 flex-1">{text}</span>
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add the Alerts nav button + badge to Sidebar**

Replace the contents of `src/features/Sidebar.tsx` with:

```tsx
import { SemesterSwitcher } from "./SemesterSwitcher";
import { SubjectList } from "./SubjectList";
import { GraduationCap, BookOpen, Wrench, Bell } from "../components/Icon";

type View = "grades" | "tools" | "alerts";

type Props = {
  selectedSubjectId: string | null;
  onSelectSubject: (id: string) => void;
  view: View;
  onChangeView: (view: View) => void;
  alertCount: number;
};

export function Sidebar({
  selectedSubjectId,
  onSelectSubject,
  view,
  onChangeView,
  alertCount,
}: Props) {
  const navBtn = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400/60 ${
      active ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
    }`;

  return (
    <aside className="flex w-full flex-col gap-6 border-b border-slate-800 bg-slate-900/40 p-4 md:h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2">
        <GraduationCap className="text-indigo-400" size={22} />
        <span className="text-lg font-semibold tracking-tight">
          IntelliGrade
        </span>
      </div>
      <nav className="flex gap-2" aria-label="Primary">
        <button
          type="button"
          className={navBtn(view === "grades")}
          aria-current={view === "grades" ? "page" : undefined}
          onClick={() => onChangeView("grades")}
        >
          <BookOpen size={16} /> Grades
        </button>
        <button
          type="button"
          className={navBtn(view === "tools")}
          aria-current={view === "tools" ? "page" : undefined}
          onClick={() => onChangeView("tools")}
        >
          <Wrench size={16} /> Tools
        </button>
        <button
          type="button"
          className={navBtn(view === "alerts")}
          aria-current={view === "alerts" ? "page" : undefined}
          onClick={() => onChangeView("alerts")}
        >
          <Bell size={16} /> Alerts
          {alertCount > 0 && (
            <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
              {alertCount}
            </span>
          )}
        </button>
      </nav>
      <SemesterSwitcher />
      <SubjectList
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={onSelectSubject}
      />
    </aside>
  );
}
```

- [ ] **Step 4: Wire alerts into App**

Replace the contents of `src/App.tsx` with:

```tsx
import { useState } from "react";
import { Sidebar } from "./features/Sidebar";
import { SubjectDetail } from "./features/SubjectDetail";
import { ToolsPage } from "./features/tools/ToolsPage";
import { AlertsView } from "./features/alerts/AlertsView";
import { useStore } from "./store/useStore";
import { computeAlerts } from "./domain/alerts";

export default function App() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
  const [view, setView] = useState<"grades" | "tools" | "alerts">("grades");
  const data = useStore((s) => s.data);
  const setActiveSemester = useStore((s) => s.setActiveSemester);
  const activeSemesterId = data.activeSemesterId;
  const activeSemester = data.semesters.find((s) => s.id === activeSemesterId);
  const effectiveSubjectId =
    selectedSubjectId !== null &&
    activeSemester?.subjects.some((sub) => sub.id === selectedSubjectId)
      ? selectedSubjectId
      : null;

  const alerts = computeAlerts(data.semesters, new Date());

  const openSubject = (semesterId: string, subjectId: string) => {
    setActiveSemester(semesterId);
    setSelectedSubjectId(subjectId);
    setView("grades");
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        selectedSubjectId={effectiveSubjectId}
        onSelectSubject={setSelectedSubjectId}
        view={view}
        onChangeView={setView}
        alertCount={alerts.length}
      />
      <main className="flex-1 p-6">
        {view === "alerts" ? (
          <AlertsView alerts={alerts} onOpenSubject={openSubject} />
        ) : view === "tools" ? (
          <ToolsPage
            semesterId={activeSemesterId ?? null}
            subjectId={effectiveSubjectId}
          />
        ) : effectiveSubjectId && activeSemesterId ? (
          <SubjectDetail
            semesterId={activeSemesterId}
            subjectId={effectiveSubjectId}
          />
        ) : (
          <div className="grid h-full place-items-center text-center">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Welcome to IntelliGrade</h2>
              <p className="text-slate-400">
                Create a semester, add a subject, and start tracking grades.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Verify type-check, tests, and build**

Run: `npx tsc -b && npm test && npm run build`
Expected: tsc clean; all tests green; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/Icon.tsx src/features/alerts/AlertsView.tsx src/features/Sidebar.tsx src/App.tsx
git commit -m "feat(ui): add Alerts view with sidebar nav badge"
```

---

## Final verification (after Task 5)

- [ ] Run the full gate once more: `npx tsc -b && npm test && npm run build` — all green.
- [ ] Manual smoke (`npm run dev`): add an upcoming exam to a subject → it appears in the planner; record a grade on it → it moves into the grades table with the exam's weight; the Alerts nav shows a badge and lists exam-soon / ungraded / below-target / no-grades items; clicking an alert opens its subject.
- [ ] Update the design spec status line and log any follow-ups per the SP0–SP2 convention.

## Success criteria (from the design spec)

1. Exams add/list/delete/record per subject. — Tasks 2, 4.
2. v1 → v2 migration without loss. — Task 1.
3. `computeAlerts` returns the four kinds at boundaries, urgency-ordered; tests pass. — Task 3.
4. Alerts view + nav badge; clicking navigates to the subject. — Task 5.
5. `npm run build` and `tsc -b` clean; all tests pass. — every task gate.
6. Number inputs via `NumberField`; date/text inputs labelled; no new persisted state beyond `Subject.exams`. — Tasks 1, 4, 5.
</content>
</invoke>

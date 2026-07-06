# IntelliGrade — Exam Planner + Smart Alerts (Sub-project 3) Design

**Date:** 2026-07-06
**Status:** Approved (design) — proceeding autonomously per user delegation
**Author:** Olivier Lüthy + Claude

---

## Context

Sub-projects 0–2 are merged to `main`: a Vite + React + TypeScript + Tailwind v4 +
Zustand grade tracker with a pure `src/domain/` layer (a `GradeScale` interface,
`weightedAverage`, `verifyGrade`/`applyCurve`/`gradeChange`, `gradeNeeded`/
`badGradesAffordable`), versioned localStorage persistence (`schemaVersion: 1`), a
sidebar with a Grades/Tools view switch, a subject detail view (grades table, target
editor, scenario cards), and a Tools page.

This sub-project adds **forward-looking exam planning** — upcoming exams with dates —
and a **derived smart-alerts** layer that surfaces what needs attention. It is one
step in the roadmap; multi-country grading (SP4), analytics (SP5), and exports (SP6)
remain later sub-projects.

## Decisions (locked)

- **Scope:** exam planner + a lean, purely-derived alerts layer, together.
- **Exam model:** a separate `Exam` entity on each subject (`subject.exams`); a
  "Record grade" action converts a past exam into a `Grade` and removes the exam.
- **Alerts:** four kinds — exam-soon, exam-ungraded, below-target, no-grades.
- **Alert surface:** a global **Alerts** view reached from a sidebar nav button with a
  count badge; each alert links to its subject. Alerts are recomputed each render and
  never persisted.
- **No backend:** this is a localStorage SPA, so alerts are in-app only (no OS/push/
  email notifications).

## Goals

Let students plan upcoming exams and see, in one place, everything that needs
attention — computed correctly from real data, with no new persisted alert state.

## Non-goals (later sub-projects or out of scope)

OS/push/email notifications; recurring exams; per-exam reminder configuration;
calendar export. Multi-country generalization of "below target" stays SP4. Analytics
(SP5) and exports (SP6) are separate.

---

## Data model & migration

New entity and a subject field (in `src/domain/types.ts`):

```ts
export type Exam = {
  id: string;
  name: string;
  date: string;   // ISO calendar date, 'YYYY-MM-DD'
  weight: number;
};

export type Subject = {
  id: string;
  name: string;
  targetGrade?: number;
  grades: Grade[];
  exams: Exam[];   // NEW — planned/upcoming assessments
};

export type AppData = {
  schemaVersion: 2;   // bumped from 1
  activeSemesterId: string | null;
  semesters: Semester[];
};
```

**Migration (`src/store/persistence.ts`):** `emptyAppData` returns `schemaVersion: 2`.
`migrate` gains a real v1→v2 upgrade — this is the hardening flagged as an SP0/SP1
follow-up:

- A well-formed **v1** payload (`schemaVersion === 1`, `semesters` an array) is upgraded
  to v2 by adding `exams: []` to every subject that lacks it and setting
  `schemaVersion: 2`.
- A well-formed **v2** payload is returned as-is (with `exams` defaulted to `[]` on any
  subject missing it, for resilience).
- Anything else (missing/other version, non-array semesters, malformed) → `emptyAppData()`.

**Store actions (`src/store/useStore.ts`):**

```ts
addExam(semesterId, subjectId, exam: Omit<Exam, "id">): string;   // returns new id
deleteExam(semesterId, subjectId, examId): void;
recordExamGrade(semesterId, subjectId, examId, value: number): void;
  // creates Grade { value, weight: exam.weight, label: exam.name, date: exam.date }
  // then removes the exam (atomic single commit). No-op if the exam is not found.
```

`addSubject` initializes `exams: []`.

---

## Domain — smart alerts

`src/domain/alerts.ts` (pure, no React, unit-tested):

```ts
import type { Semester } from "./types";

export const EXAM_SOON_DAYS = 7;

export type Alert =
  | { kind: "exam-soon"; semesterId; subjectId; subjectName; examId; examName; date; daysUntil }
  | { kind: "exam-ungraded"; semesterId; subjectId; subjectName; examId; examName; date; daysAgo }
  | { kind: "below-target"; semesterId; subjectId; subjectName; average; target }
  | { kind: "no-grades"; semesterId; subjectId; subjectName };

export function computeAlerts(semesters: Semester[], today: Date): Alert[];
```

`today` is passed in (the UI passes `new Date()`) so the function is pure and testable.
Day math compares calendar dates: `daysUntil = round((examDateMidnight − todayMidnight)
/ 86_400_000)`. Rules per subject, across all semesters:

- **exam-soon:** for each exam with `0 ≤ daysUntil ≤ EXAM_SOON_DAYS`.
- **exam-ungraded:** for each exam with `daysUntil < 0` (`daysAgo = −daysUntil`). Every
  exam in the list is by definition unrecorded (recording removes it), so a past-dated
  exam is an ungraded one.
- **below-target:** when `subject.targetGrade !== undefined`, `weightedAverage(grades)`
  is non-null, and (for a higher-is-better scale via `getScale(semester.scaleId)`) the
  average is below the target. SP4 generalizes the direction.
- **no-grades:** when `subject.grades.length === 0`.

Result ordering (stable, urgency-first): `exam-soon` (soonest `daysUntil` first), then
`exam-ungraded` (most overdue first), then `below-target`, then `no-grades`. The domain
returns structured data only; the UI formats display strings.

---

## Planner UI

`src/features/ExamPlanner.tsx`, rendered as an "Upcoming exams" card inside
`SubjectDetail` (exams belong to a subject):

- **Add form:** name (text), date (`<input type="date">`), weight (`NumberField`,
  default 1) → `addExam`. Inputs are accessible (associated `<label>` + `aria-label`);
  the weight input reuses the SP1 `NumberField`.
- **List:** the subject's exams sorted by date ascending, each row showing name, date,
  weight, with two actions: **Record grade** (a small value `NumberField` + confirm →
  `recordExamGrade`, moving it into the grades table) and **Delete** (`deleteExam`).
- Empty state: "No upcoming exams."

---

## Alerts UI

- `src/features/Sidebar.tsx`: add a third nav button **Alerts** (with the existing
  Grades/Tools) showing a count badge when there are active alerts.
- `src/App.tsx`: extend `view` to `'grades' | 'tools' | 'alerts'`; compute
  `computeAlerts(data.semesters, new Date())` once; pass the count to the sidebar and
  the list to `AlertsView`.
- `src/features/alerts/AlertsView.tsx`: lists each alert with formatted text and an
  icon per kind; clicking an alert navigates to its subject — sets the active semester
  (`setActiveSemester`), selects the subject, and switches to `view='grades'`. Empty
  state: "Nothing needs attention — you're all caught up."

Icons added to `src/components/Icon.tsx` (e.g. `Bell`, `CalendarClock`,
`AlertTriangle`, `TrendingDown`).

---

## Architecture & files

**Modify:** `src/domain/types.ts` (Exam, Subject.exams, schemaVersion 2);
`src/store/persistence.ts` (v1→v2 migrate, empty v2); `src/store/useStore.ts` (addExam,
deleteExam, recordExamGrade; addSubject inits exams); `src/features/SubjectDetail.tsx`
(render ExamPlanner); `src/features/Sidebar.tsx` (Alerts nav + badge); `src/App.tsx`
(alerts view + compute); `src/components/Icon.tsx` (icons).

**Create:** `src/domain/alerts.ts` (+ `alerts.test.ts`); `src/features/ExamPlanner.tsx`;
`src/features/alerts/AlertsView.tsx`.

Reuses `weightedAverage`, `getScale`, `newId`, `NumberField`, `Card`, `Badge`, `Button`,
and the existing selection/semester state in `App.tsx`.

---

## Testing

Vitest (TDD — failing test first):

- **alerts.test.ts:** exam-soon fires at `daysUntil` 0 and 7 and not at 8; exam-ungraded
  fires for a past-dated exam with correct `daysAgo`; below-target fires when average <
  target and not when average ≥ target or no target; no-grades fires for an empty
  subject; ordering is urgency-first; empty input → `[]`.
- **persistence.test.ts (added cases):** a v1 payload (subjects without `exams`) migrates
  to v2 with `exams: []` on each subject and `schemaVersion: 2`; a v2 payload round-trips;
  a malformed payload → `emptyAppData()`.

Component/interaction tests remain out of scope (SP0–SP2 convention).

---

## Success criteria

1. Exams can be added, listed (sorted by date), deleted, and recorded (converting to a
   weighted grade that appears in the grades table) per subject.
2. Persistence migrates existing v1 data to v2 without loss (subjects gain `exams: []`).
3. `computeAlerts` returns the four alert kinds correctly at their boundaries, ordered
   urgency-first; all `domain/alerts` unit tests pass.
4. A sidebar **Alerts** view lists active alerts with a nav count badge; clicking an
   alert navigates to its subject.
5. `npm run build` and `tsc -b` are clean; all tests pass.
6. All number inputs use `NumberField`; date/text inputs have associated labels /
   `aria-label`s; no new persisted state beyond `Subject.exams`.
</content>
</invoke>

# IntelliGrade — Foundation (Sub-project 0) Design

**Date:** 2026-07-05
**Status:** Approved (design) — pending spec review
**Author:** Olivier Lüthy + Claude

---

## Context

IntelliGrade is currently a ~1,000-line static site (plain HTML, SCSS/CSS, and six
vanilla JS files, no build step). It offers four calculators — grade-from-points,
a "needed grade" modal driven by `prompt()`, grade increase/decrease %, and a
reverse-from-% calculator — plus PDF (jsPDF) and Excel (SheetJS) export.

Its critical limitation: **there is no data model and no persistence.** Grades live
only in DOM table rows and vanish on reload. There is no concept of subjects or
semesters, the styling is light-mode only, and calculations are hardwired to the
Swiss 1.0–6.0 scale.

The long-term vision is a professional academic-planning platform (scenario engine,
exam planner, alerts, multi-country grading, analytics, recommendations, rich
exports). That vision is roughly ten products in one and cannot be a single spec.
It has been **decomposed into sub-projects**, each with its own spec → plan → build
cycle:

- **0. Foundation** *(this document)* — data model, persistence, dark Tailwind shell,
  modular architecture, icon swap, one ported calculator.
- 1. Core calculators rebuilt on the model (points, verification, curve adjustment).
- 2. Scenario engine ("what grade do I need", "how many bad grades can I afford").
- 3. Exam planner + smart alerts.
- 4. Multi-country grading systems.
- 5. Analytics dashboards + recommendations.
- 6. Professional PDF/Excel export with live previews.

Every later sub-project reads and writes the data model and reuses the pure
calculation logic introduced here, so the foundation must be built first.

## Decisions (locked with the user)

- **Tech foundation:** full framework rebuild (not modernize-in-place).
- **Stack:** Vite + React + TypeScript + Tailwind CSS.
- **Migration:** fresh rebuild; port the existing calculators onto the new model as
  we go. The old files remain in git history.
- **Hierarchy depth:** `Semester → Subject → Grade` (three levels), with the model
  designed so School Year and Program can wrap it later without a rewrite.
- **Grading scope:** implement Switzerland fully now; abstract the scale behind an
  interface so other countries are drop-in additions in Sub-project 4.
- **Theme:** dark mode only.
- **Icons:** Lucide (replacing Font Awesome and PNG icons).

## Goals

Deliver the smallest self-standing product that every later feature builds on: a
**usable, persistent, good-looking weighted-grade tracker**.

## Non-goals (deferred to later sub-projects)

Scenario engine, exam planner, smart alerts, additional countries, analytics charts,
recommendations, and PDF/Excel export are all explicitly out of scope for
Sub-project 0.

---

## Architecture & module boundaries

```
src/
  domain/            ← pure logic, zero React, fully unit-tested
    grade-scale/
      GradeScale.ts  ← the scale interface
      swiss.ts       ← Swiss 1.0–6.0 implementation
      index.ts       ← scale registry (id → GradeScale)
    calc.ts          ← weightedAverage(), gradeFromPoints()
    types.ts         ← Semester, Subject, Grade, AppData
  store/
    useStore.ts      ← app state (Zustand)
    persistence.ts   ← localStorage load/save, schemaVersion + migrate()
  components/        ← presentational, reusable: Card, Table, Button, Icon, Badge…
  features/
    SemesterSwitcher/
    SubjectList/
    SubjectDetail/   ← weighted-grade table + running average badge
    PointsCalculator/← ported grade-from-points utility
  App.tsx
  main.tsx
```

**Core principle:** `domain/` knows nothing about React or the DOM. All grade math is
pure functions that take data plus a `GradeScale` and return numbers. The scenario
engine, analytics, and exports in later sub-projects reuse this exact tested logic
rather than reimplementing it.

### The GradeScale interface

This is the seam that makes multi-country support a later drop-in.

```ts
interface GradeScale {
  id: string;               // e.g. 'swiss'
  label: string;            // e.g. 'Switzerland (1–6)'
  min: number;              // 1.0
  max: number;              // 6.0
  passThreshold: number;    // 4.0
  higherIsBetter: boolean;  // true for Swiss; false for the German scale later
  isPassing(value: number): boolean;
  fromPoints(earned: number, max: number): number;  // Swiss: earned*5/max + 1
  colorFor(value: number): string;   // Tailwind class or hex for grade coloring
  format(value: number): string;     // display formatting, e.g. '5.25'
  clampValid(value: number): boolean;// range validation
}
```

`weightedAverage` and `gradeFromPoints` accept a `GradeScale` argument, so no
calculation logic is scale-specific.

---

## Data model & persistence

```ts
type Grade = {
  id: string;
  value: number;
  weight: number;      // 0.5 = half, 1 = normal, 2 = double
  label?: string;
  date?: string;       // ISO date
  category?: string;   // e.g. 'exam', 'oral' — free-form for now
};

type Subject = {
  id: string;
  name: string;
  targetGrade?: number;
  grades: Grade[];
};

type Semester = {
  id: string;
  name: string;
  scaleId: string;     // 'swiss' for now
  subjects: Subject[];
};

type AppData = {
  schemaVersion: 1;
  activeSemesterId: string | null;
  semesters: Semester[];
};
```

- Persisted to `localStorage` under a single key `intelligrade.data` as JSON,
  **debounced** (~300 ms) on change to avoid thrashing.
- `schemaVersion` plus a `migrate(raw): AppData` function guard against future model
  changes wiping user data. `migrate` is a version switch; v1 is the identity.
- On load, invalid/corrupt JSON falls back to a fresh empty `AppData` (never throws
  to the UI).
- Adding School Year / Program later means introducing parent nodes above `Semester`
  and bumping `schemaVersion` — `Subject` and `Grade` shapes stay stable.

---

## UI shell & the ported feature

- **Dark-only Tailwind theme:** slate/zinc base with a single accent color. Mobile-first
  and fully responsive. Accessibility from the start: visible focus rings, `aria`
  labels on icon buttons, keyboard-operable table rows.
- **Layout:** collapsible sidebar containing the semester switcher and subject list;
  the main pane shows the selected subject's weighted-grade table with add / edit /
  delete rows and a live running-average badge colored via `scale.colorFor`.
- **Empty states:** first run seeds nothing but shows clear "create your first
  semester / subject" prompts.
- **Ported feature — grade-from-points:** a small utility panel that computes a grade
  from earned/max points using `scale.fromPoints`, and can write the result directly
  into the selected subject as a new grade (an upgrade over the old text-only output).

---

## Testing

- **Vitest** for the `domain/` layer, following TDD (tests written before
  implementation):
  - `weightedAverage` — normal case, single grade, mixed weights, **empty subject**
    (returns null/undefined, not NaN), **total weight of zero**.
  - `gradeFromPoints` — normal case, full marks, zero earned, `maxPoints === 0`
    guarded.
  - Swiss `GradeScale` — `isPassing` boundary at 4.0, `clampValid` for out-of-range
    (below 1.0, above 6.0), `colorFor` bucket boundaries.
- Component/interaction tests are not required for this sub-project beyond the domain
  layer; they can be added when features grow.

---

## Success criteria

1. `npm run dev` serves a dark, responsive React app.
2. A user can create a semester, add subjects, and add weighted grades that
   **persist across reloads**.
3. The subject view shows a correct, live weighted average, colored by grade.
4. Grade-from-points computes correctly and can save its result into a subject.
5. All `domain/` unit tests pass (`npm run test`).
6. No Font Awesome or PNG icons remain in the new app; Lucide is used throughout.

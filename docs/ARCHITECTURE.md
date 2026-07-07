# IntelliGrade — Architecture & Developer Guide

This is the deep dive for anyone working on IntelliGrade. Read the
[README](../README.md) first for the product overview and quick start; this document
explains **how it's built and how to extend it safely**.

---

## 1. Philosophy

Three principles drive the codebase:

1. **The grade maths is the product.** All calculations live in a **pure domain layer**
   (`src/domain/`) with no React, DOM, or store imports. It is unit-tested and reused
   everywhere. UI never re-implements a calculation.
2. **Everything is grade-system agnostic.** Every calculation flows through the
   **`GradeScale`** interface. Direction (`higherIsBetter`), range, pass threshold, colour,
   and formatting all come from the scale — so Swiss (higher = better) and German (lower =
   better) work through the same code paths.
3. **Instant clarity in the UI.** Screens state their purpose; planning is shown as a visual
   position on a scale, not a raw number you have to interpret.

### Layered architecture

```
                ┌─────────────────────────────────────────┐
   UI layer     │  src/features/*  (screens)               │  React
                │  src/components/* (primitives)           │
                └───────────────┬─────────────────────────┘
                                │ reads state, calls actions
                ┌───────────────▼─────────────────────────┐
   State layer  │  src/store/useStore.ts  (Zustand)        │  actions + persistence
                │  src/store/persistence.ts (localStorage) │
                └───────────────┬─────────────────────────┘
                                │ calls pure functions
                ┌───────────────▼─────────────────────────┐
   Domain layer │  src/domain/*  (pure, tested)            │  no React / DOM / store
                │  src/domain/grade-scale/* (GradeScale)   │
                └─────────────────────────────────────────┘
```

Dependencies point **downward only**. The domain layer knows nothing about the store or the
UI. Breaking this rule (e.g. importing the store into `src/domain/`) is the one thing to avoid.

---

## 2. Data model (`src/domain/types.ts`)

```ts
Grade    = { id, value, weight, label?, date?, category? }
Exam     = { id, name, date /* YYYY-MM-DD */, weight }
Subject  = { id, name, targetGrade?, grades: Grade[], exams: Exam[] }
Semester = { id, name, scaleId, subjects: Subject[] }
AppData  = { schemaVersion: 2, activeSemesterId, semesters: Semester[] }
```

- A **Semester** owns a grade scale (`scaleId`) and a list of subjects.
- A **Subject** has grades, an optional **target**, and scheduled **exams**.
- An **Exam** is a *plan*. When you record its grade it becomes a `Grade` (carrying the exam's
  name, weight, date) and is removed from `exams` — see `recordExamGrade` in the store.
- **Alerts and analytics are derived, never stored.**

---

## 3. Domain layer

All pure, all tested (`*.test.ts` sit next to each module).

| Module | Key functions | Notes |
|--------|---------------|-------|
| `calc.ts` | `weightedAverage(grades)`, `gradeFromPoints(earned, max, scale)` | The average is weight-aware; ignores `NaN`. |
| `scenario.ts` | `gradeNeeded`, `gradeNeededPerExam`, `badGradesAffordable` | The planning engine (see §5). Direction-aware. |
| `verify.ts` | `verifyGrade(earned, max, scale, published?)` | Points → grade, %, pass/fail, and diff vs a published grade. |
| `curve.ts` | `applyCurve(earned, origMax, adjMax, bonus, scale)` | Recompute a grade under a curved max / flat bonus. |
| `gradeChange.ts` | `gradeChangePercent`, `originalFromRaisePercent` | % change between two grades, and the inverse. |
| `alerts.ts` | `computeAlerts(semesters, today)` | Four alert kinds; direction-aware “below target”. |
| `analytics.ts` | `computeSubjectStats`, `computeSemesterStats` | Averages, best/worst, trend, pass, distance-to-target. |
| `recommendations.ts` | `computeRecommendations(semester)` | One ranked, plain-language rec per subject. |
| `parseGradeInput.ts` | `parseGradeInput(value, weight, scale)` | Shared grade+weight validation for the forms. |
| `export/report.ts` | `buildSemesterReport(semester)` | The serialisable report model for all export formats. |

### 3.1 The `GradeScale` interface (`grade-scale/GradeScale.ts`)

```ts
interface GradeScale {
  id: string;
  label: string;
  min: number;
  max: number;
  passThreshold: number;
  higherIsBetter: boolean;
  isPassing(value): boolean;
  fromPoints(earned, max): number;   // NaN when max <= 0
  colorFor(value): string;           // a Tailwind text-* class
  format(value): string;             // usually value.toFixed(2)
  clampValid(value): boolean;        // within [min, max]
}
```

Five scales are registered in `grade-scale/index.ts`:

| id | label | range | pass | direction |
|----|-------|-------|------|-----------|
| `swiss` | Switzerland (1–6) | 1–6 | 4 | higher is better |
| `germany` | Germany (1–6) | 1–6 | 4 | **lower is better** |
| `austria` | Austria (1–5) | 1–5 | 4 | **lower is better** |
| `france` | France (0–20) | 0–20 | 10 | higher is better |
| `italy` | Italy (0–10) | 0–10 | 6 | higher is better |

The registry exposes `SCALES`, `SCALE_LIST`, and `getScale(id)` (which falls back to `swiss`
for unknown ids). **`colorFor` returns a Tailwind `text-*` class** (e.g. `text-emerald-400`),
which the UI uses directly so computed and hand-written colours never drift.

---

## 4. State & persistence (`src/store/`)

- **`useStore.ts`** — a single Zustand store holding `data: AppData` plus every mutation:
  `addSemester`, `setActiveSemester`, `addSubject`, `deleteSubject`, `addGrade`,
  `updateGrade`, `deleteGrade`, `setSubjectTarget`, `addExam`, `deleteExam`,
  `recordExamGrade`. All updates are **immutable** (helper `mapSemester` / `mapSubject`).
  Every mutation calls `commit()`, which saves to `localStorage` and sets state.
- **`persistence.ts`** — `loadAppData` / `saveAppData` (key `intelligrade.data`) and
  `migrate(raw)`, which defends against malformed payloads and upgrades old schemas
  (e.g. backfills the `exams` array on v1 subjects).
- **Selectors:** components subscribe narrowly (e.g. `SubjectDetail` selects just its
  semester/subject) so unrelated mutations don't re-render them.

---

## 5. The planning maths (the heart)

Given prior grades with total weight `W` and weighted sum `S` (so `average = S / W`):

**Grade needed on one more assessment of weight `w`** (`gradeNeeded`):

```
needed = (target · (W + w) − S) / w
```

**Grade needed on each of `N` equally-weighted upcoming exams** (`gradeNeededPerExam`):
scoring the same `x` on `N` exams of weight `w` is equivalent to one result of weight `N·w`,
so it reduces to the formula above with `w → N·w`. This is what the Target planner shows.

**How many “bad” grades you can still afford** (`badGradesAffordable`): the largest count `n`
of results at `badValue` that keep the average on the good side of `target`. It is
direction-aware via `scale.higherIsBetter` (a bad value at/behind the target in the good
direction returns `Infinity`; already past the floor returns `0`).

**Reachability** is interpreted by the UI per direction: for higher-is-better, `needed > max`
is impossible and `needed ≤ min` is already secured; for lower-is-better it's mirrored. This
lives in `features/scenario/Planner.tsx` and `components/GradeTrack.tsx`.

---

## 6. Export pipeline (`src/features/export/` + `src/domain/export/`)

One **pure report model**, three renderers — so they can't drift:

```
buildSemesterReport(semester)  →  SemesterReport
        │
        ├─ ReportPreview.tsx     (in-app dark HTML preview)
        ├─ pdf.ts   exportSemesterPdf(report)   (jsPDF + autotable)
        └─ excel.ts exportSemesterXlsx(report)  (SheetJS: Summary + Subjects sheets)
```

`pdf.ts` and `excel.ts` are **code-split** — `ExportView` imports them with dynamic `import()`
on click, so the heavy libraries stay out of the main bundle. The downloaded files use a
light, print-friendly layout; the in-app preview is dark to match the UI but shows identical
content.

---

## 7. UI layer

- **`App.tsx`** — the shell: a fixed sidebar + a full-width (`max-w-[1400px]`) content canvas.
  It holds the current `view` and the selected subject, and routes to the right screen. There
  is no router library; view switching is local state.
- **`features/`** — one folder/file per screen (see the structure table in the README). The
  **Grades** screen (`SubjectDetail.tsx`) is a “cockpit”: header readout → Target planner →
  grades table + quick-add rail → exams.
- **`components/`** — reusable primitives. Notable ones:
  - **`GradeTrack`** — the signature meter: places *now* / *target* / *needed* on the scale.
  - **`SectionHeader`** — icon + title + a one-line “what this does” hint (used everywhere for
    self-explanatory screens).
  - **`EmptyState`** — every empty state points at the next action.

### Design system (`src/index.css`)

Tailwind v4 is configured in CSS via `@theme`. The token system:

- **Brand = violet** (`--color-brand #8b7bf5`) — means *you & your goals / actions*. It also
  overrides Tailwind's `indigo-*`.
- **Neutrals:** `ink`, `ink-2`, `surface`, `surface-2`, `line`, `line-soft`, `fg`, `muted`,
  `faint`.
- **Grade semantics:** `pass` / `warn` / `fail` are set **equal** to the emerald-400 /
  amber-400 / rose-400 that `GradeScale.colorFor()` emits, so UI and computed colours match.
  Reserve these three for grade quality only; use violet for interactive/target.
- **Fonts:** Space Grotesk (display + numeric readouts, `.font-readout`) + Inter (UI/tables,
  tabular figures), bundled via `@fontsource`.
- **Utilities:** `card`, `field`, `eyebrow` (`@utility`), plus `.app-bg` and `.font-readout`.

---

## 8. Testing & the quality gate

- **Domain modules are TDD-tested** with Vitest (`*.test.ts` next to each module). If you
  change a formula, update/extend its test.
- **UI is not unit-tested by convention** — it's verified with a production build plus a quick
  browser smoke (Playwright driving the real app).
- **Before any commit touching TypeScript:**
  ```bash
  npx tsc -b && npm test && npm run build
  ```
  All three must be clean.

---

## 9. How to extend — recipes

### Add a new country / grade scale
1. Create `src/domain/grade-scale/<country>.ts` implementing `GradeScale` (mirror `swiss.ts`;
   set `higherIsBetter` correctly; `fromPoints` returns `NaN` when `max <= 0`).
2. Add a test `<country>.test.ts` (metadata, `fromPoints`, `isPassing`, `clampValid`).
3. Register it in `grade-scale/index.ts` (`SCALES`).
4. Done — the scale picker, planner, analytics, alerts, and export all pick it up.

### Add a new calculator (Tools)
1. Put the maths in a pure `src/domain/<name>.ts` + test.
2. Build a card in `src/features/tools/<Name>Calculator.tsx` using `SectionHeader` (with a
   “what this does” hint), `NumberField`, and a result panel; wire “Save as grade” via
   `addGrade` if relevant.
3. Add it to the grid in `features/tools/ToolsPage.tsx`.

### Add a new top-level view
1. Create `src/features/<area>/<Name>View.tsx`.
2. Add the view id to the `view` union and routing in `App.tsx`, and a nav entry in
   `features/Sidebar.tsx` (`NAV`).

### Change the data model
1. Update `src/domain/types.ts` and bump `schemaVersion`.
2. Extend `migrate()` in `persistence.ts` to upgrade older data, and cover it with a test in
   `persistence.test.ts`.

---

## 10. Gotchas

- **Never import the store or React into `src/domain/`.** Keep it pure.
- **Don't hardcode colours/formatting for a grade** — go through `scale.colorFor` /
  `scale.format`, and respect `scale.higherIsBetter` for any “good/bad” logic.
- **Alerts and analytics are derived** — don't persist them.
- **Export libs are heavy** — keep them behind the dynamic `import()` in `ExportView`.
- **`getScale(id)` never throws** — it falls back to `swiss` for unknown ids.

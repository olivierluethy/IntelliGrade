# IntelliGrade — Core Calculators (Sub-project 1) Design

**Date:** 2026-07-06
**Status:** Approved (design) — pending spec review
**Author:** Olivier Lüthy + Claude

---

## Context

Sub-project 0 rebuilt IntelliGrade on a Vite + React + TypeScript + Tailwind + Zustand
foundation with a pure `src/domain/` layer (a `GradeScale` interface with the Swiss
scale, `weightedAverage`, `gradeFromPoints`), versioned localStorage persistence, and
a dark UI (sidebar → subject detail with a live weighted-average table, plus an
in-subject grade-from-points calculator).

This sub-project restores and extends the calculators from the original app, built
properly on the data model. It is one step in the platform roadmap (see
`2026-07-05-intelligrade-foundation-design.md`); the scenario engine, exam planner,
multi-country grading, analytics, and exports remain later sub-projects.

## Decisions (locked with the user)

- **Next sub-project:** SP1 — core calculators (before the SP2 scenario engine).
- **UI home:** a dedicated **Tools** page reached from a sidebar nav switch;
  calculators are usable without a subject, and where it makes sense they can save a
  result into the currently selected subject (reusing the SP0 "Save as grade"
  pattern).
- **Curve model:** adjust the max-points divisor (fewer points needed for a 6) plus a
  flat bonus.
- The existing in-subject grade-from-points calculator stays where it is; on the
  Tools page, verification supersedes a standalone points calculator.

## Goals

Give students trustworthy answers to "is my teacher's grade correct?", "what did the
curve change?", and "what percentage change was that?" — all on the new model, with
correct math.

## Non-goals (later sub-projects)

"What grade do I need" and "how many bad grades can I afford" (SP2 scenario engine);
additional countries (SP4); analytics and exports (SP5/SP6).

---

## Feature 1 — Teacher-grade verification

**Inputs:** earned points, max points, optional weighting (informational), optional
published grade (what the teacher gave).

**Outputs:** percentage (`earned/max`), the mathematically correct grade
(`scale.fromPoints`), pass/fail (`scale.isPassing`), and — when a published grade is
entered — whether it matches and the signed difference.

**Save:** optional "Save as grade" writes the computed grade (weight defaulting to the
entered weighting or 1) into the currently selected subject; disabled when no subject
is selected.

## Feature 2 — Grade curve adjustment

Models the two adjustments teachers actually make on a linear Swiss scale
(`grade = points*5/max + 1`): lowering the points needed for the top grade (a smaller
adjusted max/divisor) and adding a flat bonus.

**Inputs:** earned points, original max, adjusted max, flat bonus.

**Outputs:** original grade, adjusted grade, delta, and — when a subject is selected —
the resulting new subject average (computed as if the adjusted grade were added).

**Save:** optional "Save as grade" writes the adjusted grade into the selected subject.

## Feature 3 — Grade change %

Two-way, porting the original app's two percentage calculators:

- original + raised grade → signed percentage change
- raised grade + percentage → the original grade

**Bug fix carried into the design:** the original app computed the reverse as
`raised × (1 − pct/100)`, which is not the inverse of a percentage increase. The
correct inverse of `pct = (raised − original)/original × 100` is
`original = raised / (1 + pct/100)`. This design uses the correct formula and the
tests assert the round-trip.

---

## Navigation & UI

A top-level view switch is added to `App.tsx`: `view: 'grades' | 'tools'`. The sidebar
gains a small nav block (two Lucide-icon buttons: **Grades**, **Tools**). The semester
switcher and subject list stay visible in both views, so the currently selected
subject (`selectedSubjectId`, reconciled to the active semester exactly as in SP0)
serves as the shared save target. In Tools view the main pane renders `ToolsPage` with
the three calculator cards. "Save as grade" buttons are enabled only when a subject is
selected; otherwise they are disabled with a hint ("Select a subject to save"). No new
state model is introduced — the existing selection state is reused.

Dark-mode only, mobile-first, accessible: all number inputs use a new `NumberField`
component that renders an associated label and `aria-label`, plus an inline error slot.

---

## Architecture & files

**Domain (pure, no React, unit-tested):**

```ts
// src/domain/verify.ts
type VerifyResult = {
  percentage: number;          // earned/max * 100
  grade: number;               // scale.fromPoints(earned, max)
  isPassing: boolean;
  matchesPublished?: boolean;  // present only when published provided
  difference?: number;         // grade - published, present only when published provided
};
function verifyGrade(
  earned: number, max: number, scale: GradeScale, published?: number
): VerifyResult;   // grade/percentage are NaN when max <= 0

// src/domain/curve.ts
type CurveResult = { originalGrade: number; adjustedGrade: number; delta: number };
function applyCurve(
  earned: number, originalMax: number, adjustedMax: number, bonus: number, scale: GradeScale
): CurveResult;    // adjustedGrade = clamp(scale.fromPoints(earned, adjustedMax) + bonus) to [min,max]
                   // originalGrade = scale.fromPoints(earned, originalMax); delta = adjustedGrade - originalGrade

// src/domain/gradeChange.ts
function gradeChangePercent(original: number, raised: number): number;       // (raised-original)/original*100
function originalFromRaisePercent(raised: number, pct: number): number;      // raised/(1+pct/100)
```

**Components:**

- `src/components/NumberField.tsx` — `{ label, value, onChange, step?, placeholder?, error?, min?, max? }`; renders `<label>`+`<input type="number">` with `aria-label={label}`, inline error text. Reused by all calculators (and resolves the SP0 placeholder-only-input follow-up).

**Features:**

- `src/features/tools/ToolsPage.tsx` — lays out the three calculator cards; receives the active `semesterId`/`subjectId` (or null) for save targeting.
- `src/features/tools/VerificationCalculator.tsx`
- `src/features/tools/CurveCalculator.tsx`
- `src/features/tools/GradeChangeCalculator.tsx`

**Shell:**

- `src/App.tsx` — add `view` state; render `ToolsPage` or the existing subject view.
- `src/features/Sidebar.tsx` — add the Grades/Tools nav block.
- `src/components/Icon.tsx` — add any needed icons (e.g. `Wrench`/`ClipboardCheck`, `SlidersHorizontal`, `Percent`); the SP0 unused `BookOpen`/`Target` may be used or left.

Calculators reuse `getScale(semester.scaleId)` for the active semester (fallback Swiss
when no semester), `weightedAverage` for the curve's projected average, and
`useStore.addGrade` for saving.

---

## Testing

Vitest unit tests (TDD — failing test first) for the three domain modules:

- **verify.ts:** full marks → top grade & 100%; zero → min grade & 0%; half → mid;
  `isPassing` boundary; published match (difference 0, matches true) and mismatch
  (correct signed difference, matches false); `max <= 0` → NaN grade/percentage.
- **curve.ts:** lower adjusted max raises the grade; bonus is added; result clamps at
  the scale max (e.g. earned==max with bonus does not exceed 6.0); delta sign correct;
  identical original/adjusted max with zero bonus → delta 0.
- **gradeChange.ts:** increase (positive %), decrease (negative %), no change (0%);
  round-trip — `originalFromRaisePercent(raised, gradeChangePercent(o, raised))` ≈ `o`;
  explicit check that the reverse is `raised/(1+pct/100)`, not the old
  `raised*(1−pct/100)`.

Component/interaction tests are not required for this sub-project, consistent with SP0.

---

## Success criteria

1. A **Tools** view is reachable from the sidebar; switching between Grades and Tools
   works and the selected subject persists across the switch.
2. Verification computes percentage, grade, pass/fail, and correct match/difference
   against a published grade; can save the grade into the selected subject.
3. Curve adjustment shows original grade, adjusted grade, delta, and the projected new
   average; can save the adjusted grade.
4. Grade-change % computes the signed change and the **correct** inverse.
5. All new `domain/` unit tests pass; `npm run build` and `tsc -b` are clean.
6. All number inputs have associated labels / `aria-label`s via `NumberField`.

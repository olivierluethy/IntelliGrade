# IntelliGrade — Scenario Engine (Sub-project 2) Design

**Date:** 2026-07-06
**Status:** Approved (design) — pending spec review
**Author:** Olivier Lüthy + Claude

---

## Context

Sub-projects 0 (foundation) and 1 (core calculators) are merged to `main`. The app
is a Vite + React + TypeScript + Tailwind v4 + Zustand grade tracker with a pure,
unit-tested `src/domain/` layer built on a `GradeScale` interface (Swiss scale:
1–6, higher is better, pass threshold 4.0), versioned localStorage persistence, a
sidebar → subject detail view with a live weighted-average table, and a Tools page
with three calculators (verification, curve, grade-change %).

This sub-project adds the **scenario engine** — forward-looking planning that answers
the two questions students actually ask: *"what grade do I need?"* and *"how many bad
grades can I afford?"*. It is one step in the platform roadmap; the exam planner and
alerts (SP3), multi-country grading (SP4), analytics (SP5), and exports (SP6) remain
later sub-projects.

## Decisions (locked with the user)

- **UI home:** subject-anchored. The scenario engine lives in the subject detail
  view, using each subject's real grades and its `targetGrade`. This wires up the
  `setSubjectTarget` store action that SP0 left as an unused forward-surface.
- **"What grade do I need" model:** solve for a **single next grade** at a chosen
  weight (default 1) that brings the weighted average up to the target.
- **"How many bad grades can I afford" model:** hold the subject's **target** as the
  floor; count how many more grades at a chosen value (default the scale's pass
  threshold) at weight 1 keep the average at or above the target.
- **Feasibility presentation:** reuse the SP1 pattern — show the computed number with
  an interpretation note rather than a bare (possibly impossible) value.
- **`badValue ≥ target`** is treated as "unlimited", not an error.

## Goals

Give students a trustworthy, contextual answer to how the rest of the semester has to
go for a given subject to hit their target — computed on the real weighted-average
model, with correct math and honest feasibility notes.

## Non-goals (later sub-projects)

Exam scheduling and smart alerts (SP3); additional countries (SP4); analytics charts
and recommendations (SP5); exports (SP6). No multi-subject or whole-semester scenario
solving in this sub-project — everything is per-subject. No new persisted state beyond
the existing `Subject.targetGrade` (via `setSubjectTarget`).

---

## Feature 1 — Target editor

A small control in the subject detail header lets the student set or clear the
subject's target grade. It is a `NumberField` (from SP1) bound to `Subject.targetGrade`,
persisted through the existing `setSubjectTarget(semesterId, subjectId, target)` action.
Clearing the field (empty input) sets the target back to `undefined`.

When no target is set, the two scenario cards render a muted prompt — "Set a target
grade to plan ahead" — instead of results.

## Feature 2 — What grade do I need

**Inputs:** the subject's existing grades (from the model), the target (from the
target editor), and the weight of the next assessment (a `NumberField`, default 1).

**Output:** the single grade value needed on the next assessment, with a feasibility
note (see UI & edge cases).

## Feature 3 — How many bad grades can I afford

**Inputs:** the subject's existing grades, the target, and a "bad grade" value (a
`NumberField`, default the scale's `passThreshold`).

**Output:** the largest number of additional grades at that value (weight 1) that keep
the average at or above the target, with an interpretation note.

---

## Architecture & files

**Domain (pure, no React, unit-tested):** `src/domain/scenario.ts`

Let `W = Σ weight` and `S = Σ (value × weight)` over the subject's grades (skipping
`NaN` values/weights, exactly as `weightedAverage` does). Current average is `S / W`
when `W > 0`.

```ts
import type { Grade } from "./types";
import type { GradeScale } from "./grade-scale";

// The grade needed on the next single assessment (weight w) to reach `target`
// as the new weighted average.  x = (target*(W + w) − S) / w.
// Requires w > 0; returns NaN when w <= 0.
// With no prior grades (W = 0) this reduces to `target`.
// The raw value is returned unclamped; feasibility is interpreted in the UI.
function gradeNeeded(grades: Grade[], target: number, weight: number): number;

// The largest integer n >= 0 such that adding n grades of value `badValue`
// (weight 1) keeps the average at or above `target` (for a higher-is-better scale):
//   (S + n*badValue) / (W + n) >= target
// Cases:
//   - badValue >= target        → Infinity (adding them never drops below target)
//   - current average < target  → 0 (already below the floor)
//   - otherwise                 → floor((S − target*W) / (target − badValue)), min 0
function badGradesAffordable(
  grades: Grade[], target: number, badValue: number, scale: GradeScale
): number;
```

`badGradesAffordable` reads `scale.higherIsBetter`; this sub-project ships only the
higher-is-better path (Swiss). The lower-is-better branch is out of scope until SP4
adds a reversed scale — the function signature takes `scale` now so SP4 is additive,
and the function throws or is documented as unsupported for `higherIsBetter === false`
(it will not be called from the Swiss-only UI). Decision: **document-and-guard** —
when `higherIsBetter === false`, return `NaN` (UI shows nothing); no SP2 caller hits
this path.

**Components:**

- `src/features/TargetEditor.tsx` — `{ semesterId, subjectId, target, scale }`; a
  `NumberField` that writes through `setSubjectTarget`. Empty input → `undefined`.
- `src/features/scenario/GradeNeededCard.tsx` — `{ grades, target, scale }`; internal
  weight input; renders `gradeNeeded` result with a feasibility note.
- `src/features/scenario/AffordCard.tsx` — `{ grades, target, scale }`; internal
  bad-value input (default `scale.passThreshold`); renders `badGradesAffordable`.

**Shell:**

- `src/features/SubjectDetail.tsx` — render the `TargetEditor` in the header and the
  two scenario cards (below the existing points calculator, above the grades table).
  Cards receive `subject.grades`, `subject.targetGrade`, and the resolved `scale`.

Calculators reuse `getScale(semester.scaleId)`, the `Grade` type, `NumberField`,
`Card`, and the existing `setSubjectTarget` action. No new store state is introduced.

---

## UI & edge cases

All numeric inputs use the SP1 `NumberField` (associated label + `aria-label`). Cards
render nothing but the "set a target" prompt while `targetGrade` is `undefined`.

**Grade needed** (`gradeNeeded` result `x`):

- `x > scale.max` → "Not reachable with one grade (would need `format(x)`) — plan more
  assessments or lower the target." (amber/rose)
- `x <= scale.min` → "Already secured — any grade keeps you at or above your target."
- otherwise → `format(x)` in `scale.colorFor(x)`.

**Bad grades affordable** (`badGradesAffordable` result `n`):

- `n === Infinity` → "Unlimited — that grade is at or above your target."
- `n === 0` and current average `< target` → "You're below target now — 0 to spare."
- otherwise → "You can take `n` more grade(s) of `badValue` and stay at or above
  `target`."

Dark-mode only, mobile-first, matching the existing subject detail layout.

---

## Testing

Vitest unit tests (TDD — failing test first) for `src/domain/scenario.ts`:

- **gradeNeeded:** no prior grades → returns `target`; single prior grade, weight 1 →
  correct inverse (e.g. grades `[4.0 w1]`, target `5.0`, w `1` → `6.0`); weighted next
  assessment (w ≠ 1) computed correctly; impossible case returns a value `> scale.max`
  (e.g. needs `7.25`); trivially-secured case returns a value `< scale.min`; `w <= 0`
  → `NaN`.
- **badGradesAffordable:** normal count (e.g. grades averaging above target, count > 0);
  exact boundary (adding the nth grade lands exactly on target → counts); current
  average already below target → `0`; `badValue >= target` → `Infinity`;
  `higherIsBetter === false` → `NaN`.

Component/interaction tests are not required for this sub-project, consistent with
SP0/SP1.

---

## Success criteria

1. A target editor in the subject header sets and clears `Subject.targetGrade`,
   persisted via `setSubjectTarget` and surviving reload.
2. "What grade do I need" computes the correct single-next-grade value for a chosen
   weight and shows the right feasibility note for reachable / impossible / secured.
3. "How many bad grades can I afford" computes the correct count, holding the target,
   and shows the right note for the unlimited and already-below cases.
4. Both scenario cards show the "set a target" prompt when no target is set.
5. All new `domain/` unit tests pass; `npm run build` and `tsc -b` are clean.
6. All number inputs have associated labels / `aria-label`s via `NumberField`; no new
   persisted store state beyond the existing `targetGrade`.
</content>
</invoke>

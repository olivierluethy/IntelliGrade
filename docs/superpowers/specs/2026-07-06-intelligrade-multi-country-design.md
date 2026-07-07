# IntelliGrade — Multi-Country Grading (Sub-project 4) Design

**Date:** 2026-07-06
**Status:** Implemented (2026-07-07) — all 4 tasks committed on `rebuild/multi-country`; `tsc -b`, 85 tests, and `npm run build` all green
**Author:** Olivier Lüthy + Claude

---

## Context

Sub-projects 0–3 are merged to `main`. All grade math already flows through a
`GradeScale` interface (`src/domain/grade-scale/`), and only the Swiss scale (1–6,
higher-is-better, pass 4) exists. Crucially, the direction-sensitive consumers already
read `scale.higherIsBetter`: `computeAlerts` (below-target) and `badGradesAffordable`
(which currently returns `NaN` for lower-is-better as an explicit SP4 placeholder). The
`Semester` model already carries `scaleId`, and `addSemester(name, scaleId?)` accepts a
scale — but the UI never sets it (always defaults to Swiss).

This sub-project adds four more national scales and lets the student choose a scale when
creating a semester. It is largely additive thanks to the `GradeScale` seam.

## Decisions (locked)

- **Scales added:** Germany (1–6, lower-is-better, pass ≤4), France (0–20, higher, pass
  10), Austria (1–5, lower-is-better, pass ≤4), Italy (0–10, higher, pass 6). Swiss
  stays the default.
- **Picker:** a scale `<select>` in the "New semester" form (`SemesterSwitcher`); the
  active semester's scale label is shown as a caption.
- **Generalize `badGradesAffordable`** to support lower-is-better scales (removing the
  `NaN` placeholder) so the scenario "afford" card works for every scale.
- Everything else is already scale-driven and needs no change (verification, curve,
  grade-needed, alerts, averages, colors, formatting all go through the active scale).

## Goals

Let a student track and reason about grades in the German, French, Austrian, or Italian
systems — with correct pass/fail direction, averages, verification, scenarios, and
alerts — by picking a scale per semester.

## Non-goals (later or out of scope)

Cross-scale conversion (comparing a German 2.0 to a French 15); per-subject scales
(scale is per semester); university variants (e.g. Italian 18–30, German GPA points);
analytics (SP5) and exports (SP6). The Tools "curve adjustment" remains defined by the
active scale's `fromPoints`+clamp; its "flat bonus" is numerically applied in scale
units (semantically a Swiss-style tweak) — unchanged.

---

## Feature 1 — Four national GradeScale implementations

Each is a pure `GradeScale` (mirroring `swiss.ts`), unit-tested. All use
`format(v) = v.toFixed(2)` and `fromPoints` returns `NaN` when `max <= 0`.

**Germany — `src/domain/grade-scale/germany.ts`**
- `id: "germany"`, `label: "Germany (1–6)"`, `min: 1`, `max: 6`, `passThreshold: 4`,
  `higherIsBetter: false`.
- `isPassing(v) = v <= 4`.
- `fromPoints(earned, max) = 6 − 5 * (earned / max)` (full marks → 1 best, zero → 6 worst).
- `colorFor(v)`: `v <= 2 → emerald`, `<= 3 → lime`, `<= 4 → amber`, else `rose`.
- `clampValid(v) = v >= 1 && v <= 6`.

**France — `src/domain/grade-scale/france.ts`**
- `id: "france"`, `label: "France (0–20)"`, `min: 0`, `max: 20`, `passThreshold: 10`,
  `higherIsBetter: true`.
- `isPassing(v) = v >= 10`.
- `fromPoints(earned, max) = 20 * (earned / max)`.
- `colorFor(v)`: `v >= 16 → emerald`, `>= 14 → lime`, `>= 10 → amber`, else `rose`.
- `clampValid(v) = v >= 0 && v <= 20`.

**Austria — `src/domain/grade-scale/austria.ts`**
- `id: "austria"`, `label: "Austria (1–5)"`, `min: 1`, `max: 5`, `passThreshold: 4`,
  `higherIsBetter: false`.
- `isPassing(v) = v <= 4` (5 = Nicht genügend, fail).
- `fromPoints(earned, max) = 5 − 4 * (earned / max)` (full → 1, zero → 5).
- `colorFor(v)`: `v <= 2 → emerald`, `<= 3 → lime`, `<= 4 → amber`, else `rose`.
- `clampValid(v) = v >= 1 && v <= 5`.

**Italy — `src/domain/grade-scale/italy.ts`**
- `id: "italy"`, `label: "Italy (0–10)"`, `min: 0`, `max: 10`, `passThreshold: 6`,
  `higherIsBetter: true`.
- `isPassing(v) = v >= 6`.
- `fromPoints(earned, max) = 10 * (earned / max)`.
- `colorFor(v)`: `v >= 8 → emerald`, `>= 7 → lime`, `>= 6 → amber`, else `rose`.
- `clampValid(v) = v >= 0 && v <= 10`.

## Feature 2 — Scale registry

`src/domain/grade-scale/index.ts` registers all five scales in `SCALES` (keyed by id)
and exports a `SCALE_LIST: GradeScale[]` (`Object.values(SCALES)`) for the picker.
`getScale(id)` still falls back to Swiss for unknown ids.

## Feature 3 — Generalize `badGradesAffordable`

`src/domain/scenario.ts` — remove the `!higherIsBetter → NaN` guard and make the four
branches direction-aware (both directions now supported):

```
higherIsBetter ? badValue >= target : badValue <= target   → Infinity  (bad grade is at/beyond target in the good direction)
avg present and (higherIsBetter ? avg < target : avg > target) → 0      (already past the floor)
otherwise                                                   → max(0, floor((S − target*W) / (target − badValue)))
```

The `floor` formula is unchanged and correct in both directions (numerator and
denominator flip sign together). The SP2 test that asserted `NaN` for a lower-is-better
scale is updated to assert the correct lower-is-better count.

## Feature 4 — Scale picker in SemesterSwitcher

The "New semester" form gains a scale `<select>` (options from `SCALE_LIST`, labelled,
`aria-label`), defaulting to Swiss. Submitting calls `addSemester(name, scaleId)` and
resets. Below the semester `<select>`, a caption shows the active semester's scale label
(`getScale(activeSemester.scaleId).label`).

---

## Architecture & files

**Create:** `src/domain/grade-scale/germany.ts` (+ `.test.ts`),
`france.ts` (+ test), `austria.ts` (+ test), `italy.ts` (+ test).
**Modify:** `src/domain/grade-scale/index.ts` (register scales, `SCALE_LIST`);
`src/domain/scenario.ts` (+ `scenario.test.ts` reversed case);
`src/features/SemesterSwitcher.tsx` (scale picker + caption).

No data-model or persistence change (scale is already `Semester.scaleId`; existing
semesters keep `"swiss"`). No new store action — `addSemester` already accepts `scaleId`.

## Testing

Vitest (TDD — failing test first):
- **Per scale:** `fromPoints` at full marks (→ best grade), zero (→ worst), half (→
  midpoint), and `max <= 0 → NaN`; `isPassing` at the threshold boundary (correct
  direction); `clampValid` in/out of range; `higherIsBetter`/`min`/`max`/`passThreshold`
  values. E.g. Germany `fromPoints(20,20)=1`, `fromPoints(0,20)=6`, `isPassing(4)=true`,
  `isPassing(4.5)=false`.
- **Registry:** `getScale("germany")` etc. resolve; `SCALE_LIST` contains all five;
  unknown id → Swiss.
- **scenario:** `badGradesAffordable` for a lower-is-better scale — a count case
  (e.g. Germany grades averaging better than target, positive count with inclusive
  boundary), `badValue` at/beyond target → Infinity, already-worse → 0; existing
  higher-is-better cases still pass.

Component/interaction tests remain out of scope (SP0–SP3 convention).

## Success criteria

1. Five scales resolve via `getScale`; each computes `fromPoints`/`isPassing`/
   `clampValid` correctly for its direction; all scale unit tests pass.
2. `badGradesAffordable` returns correct counts for both higher- and lower-is-better
   scales (no `NaN` placeholder); scenario tests pass.
3. Creating a semester lets the student pick a scale; the chosen scale drives that
   semester's averages, colors, verification, scenarios, and alerts; the active scale
   label is visible.
4. `npm run build` and `tsc -b` are clean; all tests pass.
5. The scale `<select>` is labelled/`aria-label`led; existing Swiss semesters are
   unaffected.
</content>
</invoke>

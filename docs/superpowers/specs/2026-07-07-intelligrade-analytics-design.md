# IntelliGrade — Analytics Dashboards + Recommendations (Sub-project 5) Design

**Date:** 2026-07-07
**Status:** Approved (design) — decisions delegated to Claude; proceeding autonomously
**Author:** Olivier Lüthy + Claude

---

## Context

SP0–SP4 are merged. Grade math is pure and scale-driven (`src/domain/`, `GradeScale`).
SP5 adds a read-only **Analytics** view for the active semester: derived statistics,
simple visualizations, and rule-based recommendations. Like `alerts`, everything is
**derived, never persisted** — no data-model or store-action changes.

## Decisions (locked)

- **Pure domain, TDD.** Two new pure modules; component tests not required (SP0–SP4 convention).
- **No new dependencies.** Charts are hand-rolled inline SVG (matches the hand-built
  component style; keeps the bundle small). No chart library.
- **Scope = active semester** (mirrors `SubjectDetail`). Cross-semester analytics is out of scope.
- **Direction-aware throughout** via `scale.higherIsBetter` — "best" grade, trend, pass, and
  distance-to-target all respect the scale direction.

## Module 1 — `src/domain/analytics.ts`

```ts
export type Trend = "up" | "down" | "flat" | "na";

export type SubjectStats = {
  subjectId: string;
  name: string;
  average: number | null;        // weightedAverage(grades)
  count: number;                 // grades.length
  best: number | null;           // best grade value in the scale's good direction
  worst: number | null;          // worst grade value
  trend: Trend;                  // first-half vs second-half avg, chronological
  passing: boolean | null;       // scale.isPassing(average); null if no grades
  target?: number;
  distanceToTarget: number | null; // signed toward "good": >0 means above target
};

export type SemesterStats = {
  semesterId: string;
  name: string;
  scaleId: string;
  average: number | null;        // mean of subject averages (equal weight per graded subject)
  subjectCount: number;
  gradedSubjectCount: number;
  passingCount: number;          // graded subjects that pass
  failingCount: number;          // graded subjects that fail
  bestSubject: SubjectStats | null;
  worstSubject: SubjectStats | null;
  subjects: SubjectStats[];      // in original order
};

export function computeSubjectStats(subject: Subject, scale: GradeScale): SubjectStats;
export function computeSemesterStats(semester: Semester): SemesterStats;
```

**Trend rule:** order grades chronologically — by `date` when all present, else insertion
order. Need ≥2 grades or return `"na"`. Split into first/second half (odd count → middle
grade shared/ignored: use `floor(n/2)` split). Compare the two halves' *weighted averages*
in the scale's good direction: improvement → `"up"`, regression → `"down"`, within an
epsilon (1e-9) → `"flat"`.

**best/worst:** `higherIsBetter ? max/min : min/max` of grade values.

**distanceToTarget:** `higherIsBetter ? average - target : target - average` (positive = on
the good side of the target). `null` if no target or no average.

**Semester `average`:** unweighted mean of each graded subject's `average` (each subject
counts once). `null` if no graded subjects. `bestSubject`/`worstSubject` chosen by
`distanceToTarget` when targets exist, else by `average` in the good direction; only graded
subjects considered.

## Module 2 — `src/domain/recommendations.ts`

```ts
export type Severity = "high" | "medium" | "low";
export type Recommendation = {
  id: string;                    // stable-ish key: `${kind}:${subjectId}`
  kind: "below-target" | "trending-down" | "no-target" | "no-grades" | "on-track";
  severity: Severity;
  subjectId: string;
  subjectName: string;
  text: string;
};

export function computeRecommendations(semester: Semester): Recommendation[];
```

**Rules (per subject in the active semester):**
- **below-target** (high): has target + average on the bad side → suggest the grade needed
  next (equally weighted): uses `gradeNeeded(grades, target, 1)`, clamped/labelled via the
  scale; if the needed grade is unreachable (outside `[min,max]`), say so.
- **trending-down** (medium): `trend === "down"` and not already below target.
- **no-target** (low): has grades but no target → "Set a target to unlock planning."
- **no-grades** (low): no grades → "Add grades to start tracking."
- **on-track** (low, positive): has target, average on the good side, and can afford ≥1 more
  weak result (`badGradesAffordable` with a worst-case bad grade = scale min/max) →
  "On track — you can afford N more weak result(s)."

Sort by severity (high→low) then subject name. At most one rec per subject (first matching
rule by the order above), except `on-track` which only appears when none of the negatives do.

## Module 3 — UI

- **Nav:** add an `"analytics"` view to `App`'s union and a `BarChart3` icon button in
  `Sidebar` (labelled "Insights"), between Tools and Alerts.
- **`src/features/analytics/AnalyticsView.tsx`** (reads store by `semesterId`, like
  `SubjectDetail`; takes `onOpenSubject`):
  - **Summary card:** semester average badge (scale-coloured), passing/total, best & worst
    subject chips.
  - **Subject averages chart:** inline horizontal SVG bars, one per graded subject, coloured
    via `scale.colorFor`, with a target reference line per bar when a target exists.
  - **Subject table:** name, average badge, trend arrow (▲/▼/▬), pass badge, distance to
    target. Rows click through via `onOpenSubject`.
  - **Recommendations card:** severity-coloured list; empty state "No recommendations —
    everything looks healthy."
  - Empty states for "no active semester" and "no subjects yet".
- **`src/features/analytics/SubjectBars.tsx`:** the pure-presentational SVG bar chart.

## Verification gate

`npx tsc -b` clean · `npm test` green · `npm run build` succeeds · Playwright browser smoke
(active semester with graded subjects renders summary, chart, table, and recommendations).

## Success criteria

1. `computeSubjectStats`/`computeSemesterStats` correct for both scale directions (TDD).
2. `computeRecommendations` prioritized, direction-aware, one-per-subject (TDD).
3. Analytics view reachable from the sidebar; shows summary, chart, table, recommendations;
   rows click through to the subject; graceful empty states.
4. Gate green; no persisted analytics state; no new dependencies.

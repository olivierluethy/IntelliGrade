# IntelliGrade Scenario Engine (Sub-project 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subject-anchored forward planning — "what grade do I need?" and "how many bad grades can I afford?" — built on the weighted-average model.

**Architecture:** One pure, unit-tested domain module (`src/domain/scenario.ts`) holds both calculations. A `TargetEditor` writes the subject's `targetGrade` through the existing `setSubjectTarget` store action. Two cards (`GradeNeededCard`, `AffordCard`) render in the subject detail view, showing results with feasibility notes; when no target is set they show a prompt.

**Tech Stack:** Vite + React 18 + TypeScript + Tailwind v4 + Zustand + Vitest + lucide-react.

## Global Constraints

- **Grade scale is abstract:** all math goes through the `GradeScale` interface (`src/domain/grade-scale/GradeScale.ts`) and the `Grade` type; never hard-code `1`/`6`/`4`/`*5`. The active scale is `getScale(semester.scaleId)`.
- **Weighted-average convention:** `W = Σ weight`, `S = Σ (value*weight)`, skipping any grade whose `value` or `weight` is `NaN` — identical to `weightedAverage` in `src/domain/calc.ts`. Current average is `S/W` when `W > 0`.
- **TDD for the domain module:** failing test first, then minimal implementation. Component/interaction tests are NOT required (consistent with SP0/SP1).
- **No new persisted store state:** reuse `Subject.targetGrade` and the existing `setSubjectTarget(semesterId, subjectId, target: number | undefined)` action. Clearing the target editor writes `undefined`.
- **Accessible inputs:** every `<input type="number">` is rendered through the SP1 `NumberField` (associated `<label>` + `aria-label`).
- **Verification gate (before every commit that touches TS):** `npx tsc -b` clean and `npm test` green. Tasks that touch components additionally run `npm run build`.
- **Commit style:** conventional commits (`feat:`, `test:`), matching existing history.

---

### Task 1: Domain — `gradeNeeded`

**Files:**
- Create: `src/domain/scenario.ts`
- Test: `src/domain/scenario.test.ts`

**Interfaces:**
- Consumes: `Grade` from `./types`.
- Produces:
  ```ts
  // internal helper (not exported): accumulate(grades) => { W: number; S: number }
  export function gradeNeeded(grades: Grade[], target: number, weight: number): number;
  // x = (target*(W + weight) − S) / weight ; returns NaN when weight <= 0 ;
  // with no prior grades (W = 0) reduces to `target`. Raw/unclamped.
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/scenario.test.ts
import { describe, it, expect } from "vitest";
import { gradeNeeded } from "./scenario";
import type { Grade } from "./types";

const g = (value: number, weight: number): Grade => ({
  id: Math.random().toString(),
  value,
  weight,
});

describe("gradeNeeded", () => {
  it("with no prior grades, needs exactly the target", () => {
    expect(gradeNeeded([], 5, 1)).toBeCloseTo(5);
  });

  it("single prior grade, weight 1 → correct inverse", () => {
    // (5*(1+1) - 4) / 1 = 6 ; check: (4 + 6*1)/2 = 5
    expect(gradeNeeded([g(4, 1)], 5, 1)).toBeCloseTo(6);
  });

  it("weighted next assessment (w != 1)", () => {
    // (5*(1+2) - 4) / 2 = 11/2 = 5.5 ; check: (4 + 5.5*2)/3 = 5
    expect(gradeNeeded([g(4, 1)], 5, 2)).toBeCloseTo(5.5);
  });

  it("impossible case returns a value above the scale max", () => {
    // (5*(1+1) - 3) / 1 = 7  (> 6)
    expect(gradeNeeded([g(3, 1)], 5, 1)).toBeCloseTo(7);
  });

  it("already-secured case returns a value below the scale min", () => {
    // (4*(3+1) - 18) / 1 = -2  (< 1)
    expect(gradeNeeded([g(6, 3)], 4, 1)).toBeCloseTo(-2);
  });

  it("weight <= 0 → NaN", () => {
    expect(Number.isNaN(gradeNeeded([g(4, 1)], 5, 0))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scenario`
Expected: FAIL — cannot resolve `./scenario`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/scenario.ts
import type { Grade } from "./types";

function accumulate(grades: Grade[]): { W: number; S: number } {
  let W = 0;
  let S = 0;
  for (const { value, weight } of grades) {
    if (Number.isNaN(value) || Number.isNaN(weight)) continue;
    S += value * weight;
    W += weight;
  }
  return { W, S };
}

export function gradeNeeded(
  grades: Grade[],
  target: number,
  weight: number
): number {
  if (weight <= 0) return NaN;
  const { W, S } = accumulate(grades);
  return (target * (W + weight) - S) / weight;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scenario`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/scenario.ts src/domain/scenario.test.ts
git commit -m "feat(domain): add gradeNeeded for what-grade-do-I-need scenario"
```

---

### Task 2: Domain — `badGradesAffordable`

**Files:**
- Modify: `src/domain/scenario.ts`
- Test: `src/domain/scenario.test.ts`

**Interfaces:**
- Consumes: `Grade` from `./types`, `GradeScale` from `./grade-scale`, the existing `accumulate` helper.
- Produces:
  ```ts
  export function badGradesAffordable(
    grades: Grade[], target: number, badValue: number, scale: GradeScale
  ): number;
  // higherIsBetter === false            → NaN (unsupported until SP4)
  // badValue >= target                  → Infinity (never drops below target)
  // current average (S/W, W>0) < target → 0
  // otherwise → max(0, floor((S − target*W) / (target − badValue)))
  ```

- [ ] **Step 1: Write the failing test**

Append to `src/domain/scenario.test.ts` (add the imports on the existing import lines):

```ts
import { gradeNeeded, badGradesAffordable } from "./scenario";
import { swissScale } from "./grade-scale/swiss";

describe("badGradesAffordable", () => {
  it("counts affordable bad grades holding the target (inclusive boundary)", () => {
    // grades [6 w1], target 5, bad 4: floor((6 - 5)/(5-4)) = 1
    // check n=1: (6+4)/2 = 5 >= 5 ✓ ; n=2: (6+8)/3 = 4.67 < 5 ✗
    expect(badGradesAffordable([g(6, 1)], 5, 4, swissScale)).toBe(1);
  });

  it("counts correctly with weighted existing grades", () => {
    // grades [6 w2], target 5, bad 4: floor((12 - 10)/1) = 2
    expect(badGradesAffordable([g(6, 2)], 5, 4, swissScale)).toBe(2);
  });

  it("returns 0 when already below target", () => {
    expect(badGradesAffordable([g(4, 1)], 5, 4, swissScale)).toBe(0);
  });

  it("returns Infinity when the bad value is at or above the target", () => {
    expect(badGradesAffordable([g(5, 1)], 5, 5, swissScale)).toBe(Infinity);
  });

  it("returns NaN for a lower-is-better scale (unsupported)", () => {
    const reversed = { ...swissScale, higherIsBetter: false };
    expect(Number.isNaN(badGradesAffordable([g(6, 1)], 5, 4, reversed))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scenario`
Expected: FAIL — `badGradesAffordable` is not exported.

- [ ] **Step 3: Write minimal implementation**

Add to `src/domain/scenario.ts` (keep the existing `accumulate` and `gradeNeeded`; add the import and the new function):

```ts
import type { GradeScale } from "./grade-scale";

export function badGradesAffordable(
  grades: Grade[],
  target: number,
  badValue: number,
  scale: GradeScale
): number {
  if (!scale.higherIsBetter) return NaN;
  if (badValue >= target) return Infinity;
  const { W, S } = accumulate(grades);
  if (W > 0 && S / W < target) return 0;
  const n = Math.floor((S - target * W) / (target - badValue));
  return Math.max(0, n);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scenario`
Expected: PASS (11 tests total in the file).

- [ ] **Step 5: Commit**

```bash
git add src/domain/scenario.ts src/domain/scenario.test.ts
git commit -m "feat(domain): add badGradesAffordable for how-many-bad-grades scenario"
```

---

### Task 3: TargetEditor + subject header wiring

**Files:**
- Create: `src/features/TargetEditor.tsx`
- Modify: `src/features/SubjectDetail.tsx` (render TargetEditor in the header)

**Interfaces:**
- Consumes: `useStore.setSubjectTarget` (signature `(semesterId, subjectId, target: number | undefined) => void`); `NumberField` (SP1); `GradeScale`.
- Produces:
  ```ts
  type TargetEditorProps = {
    semesterId: string; subjectId: string;
    target: number | undefined; scale: GradeScale;
  };
  export function TargetEditor(props: TargetEditorProps): JSX.Element;
  ```

- [ ] **Step 1: Create the TargetEditor**

```tsx
// src/features/TargetEditor.tsx
import { useState } from "react";
import { useStore } from "../store/useStore";
import { NumberField } from "../components/NumberField";
import type { GradeScale } from "../domain/grade-scale";

type Props = {
  semesterId: string;
  subjectId: string;
  target: number | undefined;
  scale: GradeScale;
};

export function TargetEditor({ semesterId, subjectId, target, scale }: Props) {
  const setSubjectTarget = useStore((s) => s.setSubjectTarget);
  const [text, setText] = useState(target !== undefined ? String(target) : "");

  const commit = (v: string) => {
    setText(v);
    const n = parseFloat(v);
    if (v.trim() === "" || Number.isNaN(n)) {
      setSubjectTarget(semesterId, subjectId, undefined);
    } else {
      setSubjectTarget(semesterId, subjectId, n);
    }
  };

  return (
    <div className="w-28">
      <NumberField
        label="Target"
        value={text}
        onChange={commit}
        min={scale.min}
        max={scale.max}
        placeholder={`e.g. ${scale.format(scale.passThreshold + 1)}`}
      />
    </div>
  );
}
```

- [ ] **Step 2: Render TargetEditor in the SubjectDetail header**

In `src/features/SubjectDetail.tsx`, add the import near the other feature imports:

```tsx
import { TargetEditor } from "./TargetEditor";
```

Then replace the existing `<header>...</header>` block with:

```tsx
      <header className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          {subject.name}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Average</span>
            {avg === null ? (
              <Badge className="text-slate-400">—</Badge>
            ) : (
              <Badge className={scale.colorFor(avg)}>{scale.format(avg)}</Badge>
            )}
          </div>
          <TargetEditor
            semesterId={semesterId}
            subjectId={subjectId}
            target={subject.targetGrade}
            scale={scale}
          />
        </div>
      </header>
```

- [ ] **Step 3: Verify type-check, tests, and build**

Run: `npx tsc -b && npm test && npm run build`
Expected: tsc clean; all existing + scenario tests green; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/features/TargetEditor.tsx src/features/SubjectDetail.tsx
git commit -m "feat(ui): add subject target editor wired to setSubjectTarget"
```

---

### Task 4: GradeNeededCard + scenario section in SubjectDetail

**Files:**
- Create: `src/features/scenario/GradeNeededCard.tsx`
- Modify: `src/features/SubjectDetail.tsx` (add the scenario section with the no-target prompt)

**Interfaces:**
- Consumes: `gradeNeeded` (Task 1); `Grade`, `GradeScale`; `NumberField`, `Card`, `Target` icon (already exported from `src/components/Icon.tsx`).
- Produces:
  ```ts
  type GradeNeededCardProps = { grades: Grade[]; target: number; scale: GradeScale };
  export function GradeNeededCard(props: GradeNeededCardProps): JSX.Element;
  ```

- [ ] **Step 1: Create the GradeNeededCard**

```tsx
// src/features/scenario/GradeNeededCard.tsx
import { useState } from "react";
import { gradeNeeded } from "../../domain/scenario";
import type { Grade } from "../../domain/types";
import type { GradeScale } from "../../domain/grade-scale";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { Target } from "../../components/Icon";

type Props = { grades: Grade[]; target: number; scale: GradeScale };

export function GradeNeededCard({ grades, target, scale }: Props) {
  const [weight, setWeight] = useState("1");
  const w = parseFloat(weight);
  const valid = !Number.isNaN(w) && w > 0;
  const needed = valid ? gradeNeeded(grades, target, w) : null;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Target size={16} className="text-indigo-400" />
        What grade do I need?
      </div>
      <div className="max-w-[10rem]">
        <NumberField
          label="Next assessment weight"
          value={weight}
          onChange={setWeight}
          placeholder="1"
        />
      </div>
      {needed !== null && (
        <div className="mt-3 text-sm">
          {needed > scale.max ? (
            <span className="text-rose-400">
              Not reachable with one grade (would need {scale.format(needed)}) —
              plan more assessments or lower the target.
            </span>
          ) : needed <= scale.min ? (
            <span className="text-emerald-400">
              Already secured — any grade keeps you at or above your target.
            </span>
          ) : (
            <span>
              You need a{" "}
              <span className={`font-semibold ${scale.colorFor(needed)}`}>
                {scale.format(needed)}
              </span>{" "}
              on your next grade to reach {scale.format(target)}.
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Add the scenario section to SubjectDetail**

In `src/features/SubjectDetail.tsx`, add the import:

```tsx
import { GradeNeededCard } from "./scenario/GradeNeededCard";
```

Then insert this block immediately AFTER the `<Card>` that wraps `<PointsCalculator ... />` and BEFORE the `<Card className="overflow-x-auto p-0">` grades-table card:

```tsx
      {subject.targetGrade === undefined ? (
        <Card>
          <p className="text-sm text-slate-500">
            Set a target grade to plan ahead.
          </p>
        </Card>
      ) : (
        <>
          <GradeNeededCard
            grades={subject.grades}
            target={subject.targetGrade}
            scale={scale}
          />
          {/* AffordCard added in Task 5 */}
        </>
      )}
```

- [ ] **Step 3: Verify type-check, tests, and build**

Run: `npx tsc -b && npm test && npm run build`
Expected: tsc clean; tests green; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/features/scenario/GradeNeededCard.tsx src/features/SubjectDetail.tsx
git commit -m "feat(ui): add what-grade-do-I-need scenario card"
```

---

### Task 5: AffordCard

**Files:**
- Modify: `src/components/Icon.tsx` (add the `ShieldAlert` icon)
- Create: `src/features/scenario/AffordCard.tsx`
- Modify: `src/features/SubjectDetail.tsx` (render AffordCard next to GradeNeededCard)

**Interfaces:**
- Consumes: `badGradesAffordable` (Task 2); `weightedAverage` from `../../domain/calc`; `Grade`, `GradeScale`; `NumberField`, `Card`, `ShieldAlert` icon.
- Produces:
  ```ts
  type AffordCardProps = { grades: Grade[]; target: number; scale: GradeScale };
  export function AffordCard(props: AffordCardProps): JSX.Element;
  ```

- [ ] **Step 1: Add the ShieldAlert icon**

Edit `src/components/Icon.tsx` to add `ShieldAlert` to the re-export list:

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
} from "lucide-react";
```

- [ ] **Step 2: Create the AffordCard**

```tsx
// src/features/scenario/AffordCard.tsx
import { useState } from "react";
import { badGradesAffordable } from "../../domain/scenario";
import { weightedAverage } from "../../domain/calc";
import type { Grade } from "../../domain/types";
import type { GradeScale } from "../../domain/grade-scale";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { ShieldAlert } from "../../components/Icon";

type Props = { grades: Grade[]; target: number; scale: GradeScale };

export function AffordCard({ grades, target, scale }: Props) {
  const [bad, setBad] = useState(String(scale.passThreshold));
  const b = parseFloat(bad);
  const valid = !Number.isNaN(b);
  const n = valid ? badGradesAffordable(grades, target, b, scale) : null;
  const avg = weightedAverage(grades);

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <ShieldAlert size={16} className="text-indigo-400" />
        How many bad grades can I afford?
      </div>
      <div className="max-w-[10rem]">
        <NumberField
          label="Bad grade value"
          value={bad}
          onChange={setBad}
          placeholder={scale.format(scale.passThreshold)}
        />
      </div>
      {n !== null && !Number.isNaN(n) && (
        <div className="mt-3 text-sm">
          {n === Infinity ? (
            <span className="text-emerald-400">
              Unlimited — that grade is at or above your target.
            </span>
          ) : n === 0 && avg !== null && avg < target ? (
            <span className="text-rose-400">
              You're below target now — 0 to spare.
            </span>
          ) : (
            <span>
              You can take{" "}
              <span className="font-semibold text-slate-200">{n}</span> more
              grade(s) of {scale.format(b)} and stay at or above{" "}
              {scale.format(target)}.
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 3: Render AffordCard in SubjectDetail**

In `src/features/SubjectDetail.tsx`, add the import:

```tsx
import { AffordCard } from "./scenario/AffordCard";
```

Then replace the placeholder comment line `{/* AffordCard added in Task 5 */}` (inside the `<>...</>` fragment from Task 4) with:

```tsx
          <AffordCard
            grades={subject.grades}
            target={subject.targetGrade}
            scale={scale}
          />
```

- [ ] **Step 4: Verify type-check, tests, and build**

Run: `npx tsc -b && npm test && npm run build`
Expected: tsc clean; all tests green; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/Icon.tsx src/features/scenario/AffordCard.tsx src/features/SubjectDetail.tsx
git commit -m "feat(ui): add how-many-bad-grades scenario card"
```

---

## Final verification (after Task 5)

- [ ] Run the full gate once more: `npx tsc -b && npm test && npm run build` — all green.
- [ ] Manual smoke (`npm run dev`): open a subject, set a Target in the header → the two scenario cards appear; clear the Target → both cards collapse to the "Set a target grade to plan ahead" prompt; change the next-assessment weight and the bad-grade value → results update; confirm an impossible need shows the "not reachable" note and a subject already above target shows the "already secured" / "unlimited" notes.
- [ ] Update `docs/superpowers/specs/2026-07-06-intelligrade-scenario-engine-design.md` status line to reflect completion, and log any follow-ups per the SP0/SP1 convention.

## Success criteria (from the design spec)

1. Target editor sets and clears `Subject.targetGrade` via `setSubjectTarget`, surviving reload. — Task 3.
2. "What grade do I need" computes the correct single-next-grade value for a chosen weight with the right feasibility note. — Tasks 1, 4.
3. "How many bad grades can I afford" computes the correct count holding the target, with unlimited/already-below notes. — Tasks 2, 5.
4. Both scenario cards show the "set a target" prompt when no target is set. — Task 4 (prompt), Tasks 4–5 (cards).
5. All new `domain/` unit tests pass; `npm run build` and `tsc -b` clean. — every task gate.
6. All number inputs use `NumberField`; no new persisted store state beyond `targetGrade`. — Tasks 3–5.
</content>
</invoke>

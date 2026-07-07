# IntelliGrade Multi-Country Grading (Sub-project 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add German, French, Austrian, and Italian grade scales and a per-semester scale picker, and generalize the one direction-sensitive scenario function.

**Architecture:** Four new pure `GradeScale` implementations registered alongside Swiss; `badGradesAffordable` made direction-aware; a scale `<select>` added to the "New semester" form. Everything else is already scale-driven.

**Tech Stack:** Vite + React 18 + TypeScript + Tailwind v4 + Zustand + Vitest.

## Global Constraints

- **Every scale implements the `GradeScale` interface** (`src/domain/grade-scale/GradeScale.ts`): `id, label, min, max, passThreshold, higherIsBetter, isPassing, fromPoints, colorFor, format, clampValid`. Mirror `swiss.ts` structure.
- **Direction correctness:** higher-is-better → `isPassing(v) = v >= passThreshold`; lower-is-better → `isPassing(v) = v <= passThreshold`. `fromPoints` returns `NaN` when `max <= 0`. `format(v) = v.toFixed(2)` for all new scales.
- **TDD for domain modules:** failing test first, then minimal implementation. Component tests are NOT required (SP0–SP3 convention).
- **No data-model / persistence / store-action change:** scale is already `Semester.scaleId`; `addSemester(name, scaleId?)` already accepts it.
- **Accessible inputs:** the scale `<select>` has an associated label / `aria-label`.
- **Verification gate (before every commit that touches TS):** `npx tsc -b` clean and `npm test` green. The UI task also runs `npm run build`.
- **Commit style:** conventional commits.

---

### Task 1: Germany + Austria scales (lower-is-better)

**Files:**
- Create: `src/domain/grade-scale/germany.ts`, `src/domain/grade-scale/germany.test.ts`
- Create: `src/domain/grade-scale/austria.ts`, `src/domain/grade-scale/austria.test.ts`

**Interfaces:**
- Consumes: `GradeScale` from `./GradeScale`.
- Produces: `export const germanyScale: GradeScale;` and `export const austriaScale: GradeScale;`

- [x] **Step 1: Write the failing tests**

```ts
// src/domain/grade-scale/germany.test.ts
import { describe, it, expect } from "vitest";
import { germanyScale as s } from "./germany";

describe("germanyScale", () => {
  it("has the right metadata", () => {
    expect(s.id).toBe("germany");
    expect([s.min, s.max, s.passThreshold]).toEqual([1, 6, 4]);
    expect(s.higherIsBetter).toBe(false);
  });
  it("maps points (full → 1 best, zero → 6 worst, half → 3.5)", () => {
    expect(s.fromPoints(20, 20)).toBeCloseTo(1);
    expect(s.fromPoints(0, 20)).toBeCloseTo(6);
    expect(s.fromPoints(10, 20)).toBeCloseTo(3.5);
    expect(Number.isNaN(s.fromPoints(5, 0))).toBe(true);
  });
  it("passes at or below the threshold (lower is better)", () => {
    expect(s.isPassing(4)).toBe(true);
    expect(s.isPassing(4.5)).toBe(false);
    expect(s.isPassing(1)).toBe(true);
  });
  it("validates the range", () => {
    expect(s.clampValid(1)).toBe(true);
    expect(s.clampValid(6)).toBe(true);
    expect(s.clampValid(6.5)).toBe(false);
  });
});
```

```ts
// src/domain/grade-scale/austria.test.ts
import { describe, it, expect } from "vitest";
import { austriaScale as s } from "./austria";

describe("austriaScale", () => {
  it("has the right metadata", () => {
    expect(s.id).toBe("austria");
    expect([s.min, s.max, s.passThreshold]).toEqual([1, 5, 4]);
    expect(s.higherIsBetter).toBe(false);
  });
  it("maps points (full → 1 best, zero → 5 worst, half → 3)", () => {
    expect(s.fromPoints(20, 20)).toBeCloseTo(1);
    expect(s.fromPoints(0, 20)).toBeCloseTo(5);
    expect(s.fromPoints(10, 20)).toBeCloseTo(3);
    expect(Number.isNaN(s.fromPoints(5, 0))).toBe(true);
  });
  it("passes at or below the threshold", () => {
    expect(s.isPassing(4)).toBe(true);
    expect(s.isPassing(5)).toBe(false);
  });
  it("validates the range", () => {
    expect(s.clampValid(1)).toBe(true);
    expect(s.clampValid(5)).toBe(true);
    expect(s.clampValid(0)).toBe(false);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test -- germany austria`
Expected: FAIL — cannot resolve `./germany` / `./austria`.

- [x] **Step 3: Write the implementations**

```ts
// src/domain/grade-scale/germany.ts
import type { GradeScale } from "./GradeScale";

export const germanyScale: GradeScale = {
  id: "germany",
  label: "Germany (1–6)",
  min: 1,
  max: 6,
  passThreshold: 4,
  higherIsBetter: false,
  isPassing(value) {
    return value <= this.passThreshold;
  },
  fromPoints(earned, max) {
    if (max <= 0) return NaN;
    return 6 - (5 * earned) / max;
  },
  colorFor(value) {
    if (value <= 2) return "text-emerald-400";
    if (value <= 3) return "text-lime-400";
    if (value <= 4) return "text-amber-400";
    return "text-rose-400";
  },
  format(value) {
    return value.toFixed(2);
  },
  clampValid(value) {
    return value >= this.min && value <= this.max;
  },
};
```

```ts
// src/domain/grade-scale/austria.ts
import type { GradeScale } from "./GradeScale";

export const austriaScale: GradeScale = {
  id: "austria",
  label: "Austria (1–5)",
  min: 1,
  max: 5,
  passThreshold: 4,
  higherIsBetter: false,
  isPassing(value) {
    return value <= this.passThreshold;
  },
  fromPoints(earned, max) {
    if (max <= 0) return NaN;
    return 5 - (4 * earned) / max;
  },
  colorFor(value) {
    if (value <= 2) return "text-emerald-400";
    if (value <= 3) return "text-lime-400";
    if (value <= 4) return "text-amber-400";
    return "text-rose-400";
  },
  format(value) {
    return value.toFixed(2);
  },
  clampValid(value) {
    return value >= this.min && value <= this.max;
  },
};
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm test -- germany austria`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/domain/grade-scale/germany.ts src/domain/grade-scale/germany.test.ts src/domain/grade-scale/austria.ts src/domain/grade-scale/austria.test.ts
git commit -m "feat(domain): add Germany and Austria grade scales (lower-is-better)"
```

---

### Task 2: France + Italy scales (higher-is-better)

**Files:**
- Create: `src/domain/grade-scale/france.ts`, `src/domain/grade-scale/france.test.ts`
- Create: `src/domain/grade-scale/italy.ts`, `src/domain/grade-scale/italy.test.ts`

**Interfaces:**
- Consumes: `GradeScale` from `./GradeScale`.
- Produces: `export const franceScale: GradeScale;` and `export const italyScale: GradeScale;`

- [x] **Step 1: Write the failing tests**

```ts
// src/domain/grade-scale/france.test.ts
import { describe, it, expect } from "vitest";
import { franceScale as s } from "./france";

describe("franceScale", () => {
  it("has the right metadata", () => {
    expect(s.id).toBe("france");
    expect([s.min, s.max, s.passThreshold]).toEqual([0, 20, 10]);
    expect(s.higherIsBetter).toBe(true);
  });
  it("maps points (full → 20, zero → 0, half → 10)", () => {
    expect(s.fromPoints(20, 20)).toBeCloseTo(20);
    expect(s.fromPoints(0, 20)).toBeCloseTo(0);
    expect(s.fromPoints(10, 20)).toBeCloseTo(10);
    expect(Number.isNaN(s.fromPoints(5, 0))).toBe(true);
  });
  it("passes at or above the threshold", () => {
    expect(s.isPassing(10)).toBe(true);
    expect(s.isPassing(9.5)).toBe(false);
  });
  it("validates the range", () => {
    expect(s.clampValid(0)).toBe(true);
    expect(s.clampValid(20)).toBe(true);
    expect(s.clampValid(21)).toBe(false);
  });
});
```

```ts
// src/domain/grade-scale/italy.test.ts
import { describe, it, expect } from "vitest";
import { italyScale as s } from "./italy";

describe("italyScale", () => {
  it("has the right metadata", () => {
    expect(s.id).toBe("italy");
    expect([s.min, s.max, s.passThreshold]).toEqual([0, 10, 6]);
    expect(s.higherIsBetter).toBe(true);
  });
  it("maps points (full → 10, zero → 0, half → 5)", () => {
    expect(s.fromPoints(20, 20)).toBeCloseTo(10);
    expect(s.fromPoints(0, 20)).toBeCloseTo(0);
    expect(s.fromPoints(10, 20)).toBeCloseTo(5);
    expect(Number.isNaN(s.fromPoints(5, 0))).toBe(true);
  });
  it("passes at or above the threshold", () => {
    expect(s.isPassing(6)).toBe(true);
    expect(s.isPassing(5.5)).toBe(false);
  });
  it("validates the range", () => {
    expect(s.clampValid(0)).toBe(true);
    expect(s.clampValid(10)).toBe(true);
    expect(s.clampValid(11)).toBe(false);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test -- france italy`
Expected: FAIL — cannot resolve `./france` / `./italy`.

- [x] **Step 3: Write the implementations**

```ts
// src/domain/grade-scale/france.ts
import type { GradeScale } from "./GradeScale";

export const franceScale: GradeScale = {
  id: "france",
  label: "France (0–20)",
  min: 0,
  max: 20,
  passThreshold: 10,
  higherIsBetter: true,
  isPassing(value) {
    return value >= this.passThreshold;
  },
  fromPoints(earned, max) {
    if (max <= 0) return NaN;
    return (20 * earned) / max;
  },
  colorFor(value) {
    if (value >= 16) return "text-emerald-400";
    if (value >= 14) return "text-lime-400";
    if (value >= 10) return "text-amber-400";
    return "text-rose-400";
  },
  format(value) {
    return value.toFixed(2);
  },
  clampValid(value) {
    return value >= this.min && value <= this.max;
  },
};
```

```ts
// src/domain/grade-scale/italy.ts
import type { GradeScale } from "./GradeScale";

export const italyScale: GradeScale = {
  id: "italy",
  label: "Italy (0–10)",
  min: 0,
  max: 10,
  passThreshold: 6,
  higherIsBetter: true,
  isPassing(value) {
    return value >= this.passThreshold;
  },
  fromPoints(earned, max) {
    if (max <= 0) return NaN;
    return (10 * earned) / max;
  },
  colorFor(value) {
    if (value >= 8) return "text-emerald-400";
    if (value >= 7) return "text-lime-400";
    if (value >= 6) return "text-amber-400";
    return "text-rose-400";
  },
  format(value) {
    return value.toFixed(2);
  },
  clampValid(value) {
    return value >= this.min && value <= this.max;
  },
};
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm test -- france italy`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/domain/grade-scale/france.ts src/domain/grade-scale/france.test.ts src/domain/grade-scale/italy.ts src/domain/grade-scale/italy.test.ts
git commit -m "feat(domain): add France and Italy grade scales (higher-is-better)"
```

---

### Task 3: Register scales + generalize `badGradesAffordable`

**Files:**
- Modify: `src/domain/grade-scale/index.ts`
- Modify: `src/domain/scenario.ts`
- Modify: `src/domain/scenario.test.ts`
- Test: `src/domain/grade-scale/index.test.ts` (create)

**Interfaces:**
- Consumes: the four new scales (Tasks 1–2), `swissScale`.
- Produces:
  ```ts
  export const SCALES: Record<string, GradeScale>;   // now 5 entries
  export const SCALE_LIST: GradeScale[];              // Object.values(SCALES)
  export function getScale(id: string): GradeScale;   // unchanged fallback to swiss
  // badGradesAffordable now supports lower-is-better (no NaN placeholder)
  ```

- [x] **Step 1: Write the failing registry + scenario tests**

Create `src/domain/grade-scale/index.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getScale, SCALES, SCALE_LIST } from "./index";

describe("scale registry", () => {
  it("resolves all five scales by id", () => {
    for (const id of ["swiss", "germany", "austria", "france", "italy"]) {
      expect(getScale(id).id).toBe(id);
    }
  });
  it("SCALE_LIST contains all registered scales", () => {
    expect(SCALE_LIST).toHaveLength(Object.keys(SCALES).length);
    expect(SCALE_LIST.map((s) => s.id)).toContain("germany");
  });
  it("falls back to swiss for an unknown id", () => {
    expect(getScale("atlantis").id).toBe("swiss");
  });
});
```

In `src/domain/scenario.test.ts`, replace the existing test titled `"returns NaN for a lower-is-better scale (unsupported)"` with:

```ts
  it("supports lower-is-better scales", () => {
    const reversed = { ...swissScale, higherIsBetter: false };
    // grades [2 w1] (good), target 4, bad 5 (worse): floor((2 - 4)/(4 - 5)) = 2
    expect(badGradesAffordable([g(2, 1)], 4, 5, reversed)).toBe(2);
    // bad grade better than target → unlimited
    expect(badGradesAffordable([g(2, 1)], 4, 3, reversed)).toBe(Infinity);
    // already worse than target → 0
    expect(badGradesAffordable([g(5, 1)], 4, 6, reversed)).toBe(0);
  });
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test -- "grade-scale/index" scenario`
Expected: FAIL — `SCALE_LIST`/`germany` not registered, and the reversed scenario test fails against the current `NaN` behavior.

- [x] **Step 3: Register the scales**

Replace the contents of `src/domain/grade-scale/index.ts` with:

```ts
import type { GradeScale } from "./GradeScale";
import { swissScale } from "./swiss";
import { germanyScale } from "./germany";
import { austriaScale } from "./austria";
import { franceScale } from "./france";
import { italyScale } from "./italy";

export type { GradeScale } from "./GradeScale";
export { swissScale } from "./swiss";

export const SCALES: Record<string, GradeScale> = {
  [swissScale.id]: swissScale,
  [germanyScale.id]: germanyScale,
  [austriaScale.id]: austriaScale,
  [franceScale.id]: franceScale,
  [italyScale.id]: italyScale,
};

export const SCALE_LIST: GradeScale[] = Object.values(SCALES);

export function getScale(id: string): GradeScale {
  return SCALES[id] ?? swissScale;
}
```

- [x] **Step 4: Generalize `badGradesAffordable`**

In `src/domain/scenario.ts`, replace the body of `badGradesAffordable` with the direction-aware version:

```ts
export function badGradesAffordable(
  grades: Grade[],
  target: number,
  badValue: number,
  scale: GradeScale
): number {
  const { W, S } = accumulate(grades);
  // A "bad" grade at or beyond the target in the good direction never pushes
  // the average past the floor → unlimited.
  const atOrBeyond = scale.higherIsBetter ? badValue >= target : badValue <= target;
  if (atOrBeyond) return Infinity;
  if (W > 0) {
    const avg = S / W;
    const pastFloor = scale.higherIsBetter ? avg < target : avg > target;
    if (pastFloor) return 0;
  }
  const n = Math.floor((S - target * W) / (target - badValue));
  return Math.max(0, n);
}
```

(Leave the imports and `gradeNeeded`/`accumulate` unchanged. `GradeScale` is already imported in this file.)

- [x] **Step 5: Run tests to verify they pass**

Run: `npm test -- "grade-scale/index" scenario`
Expected: PASS (registry tests + updated scenario tests; existing higher-is-better scenario tests still pass).

- [x] **Step 6: Commit**

```bash
git add src/domain/grade-scale/index.ts src/domain/grade-scale/index.test.ts src/domain/scenario.ts src/domain/scenario.test.ts
git commit -m "feat(domain): register national scales and generalize badGradesAffordable"
```

---

### Task 4: Scale picker in SemesterSwitcher

**Files:**
- Modify: `src/features/SemesterSwitcher.tsx`

**Interfaces:**
- Consumes: `SCALE_LIST`, `getScale` from `../domain/grade-scale`; `addSemester(name, scaleId)` (already accepts `scaleId`).
- Produces: no new exports.

- [x] **Step 1: Add the scale picker + caption**

Replace the contents of `src/features/SemesterSwitcher.tsx` with:

```tsx
import { useState } from "react";
import { useStore } from "../store/useStore";
import { Button } from "../components/Button";
import { Plus } from "../components/Icon";
import { SCALE_LIST, getScale } from "../domain/grade-scale";

export function SemesterSwitcher() {
  const { semesters, activeSemesterId } = useStore((s) => s.data);
  const setActive = useStore((s) => s.setActiveSemester);
  const addSemester = useStore((s) => s.addSemester);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [scaleId, setScaleId] = useState(SCALE_LIST[0].id);

  const activeSemester = semesters.find((s) => s.id === activeSemesterId);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = addSemester(trimmed, scaleId);
    setActive(id);
    setName("");
    setScaleId(SCALE_LIST[0].id);
    setAdding(false);
  };

  const control =
    "w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60";

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Semester
      </label>
      <select
        value={activeSemesterId ?? ""}
        onChange={(e) => setActive(e.target.value)}
        aria-label="Select semester"
        className={control}
      >
        {semesters.length === 0 && <option value="">No semesters yet</option>}
        {semesters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {activeSemester && (
        <p className="text-xs text-slate-500">
          Scale: {getScale(activeSemester.scaleId).label}
        </p>
      )}

      {adding ? (
        <div className="space-y-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. HS25"
            aria-label="New semester name"
            className={control}
          />
          <select
            value={scaleId}
            onChange={(e) => setScaleId(e.target.value)}
            aria-label="Grade scale"
            className={control}
          >
            {SCALE_LIST.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <Button onClick={submit}>Add</Button>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setAdding(true)}>
          <Plus size={16} /> New semester
        </Button>
      )}
    </div>
  );
}
```

- [x] **Step 2: Verify type-check, tests, and build**

Run: `npx tsc -b && npm test && npm run build`
Expected: tsc clean; all tests green; build succeeds.

- [x] **Step 3: Commit**

```bash
git add src/features/SemesterSwitcher.tsx
git commit -m "feat(ui): add grade-scale picker to new-semester form"
```

---

## Final verification (after Task 4)

- [x] Run the full gate once more: `npx tsc -b && npm test && npm run build` — all green.
- [ ] Manual smoke (`npm run dev`): create a semester with, e.g., Germany — its subjects' averages/verification/colors reflect lower-is-better (1 best); the scale caption shows "Germany (1–6)"; existing Swiss semesters are unchanged.
- [x] Update the design spec status line and log any follow-ups.

## Success criteria (from the design spec)

1. Five scales resolve via `getScale`; each computes correctly for its direction. — Tasks 1–3.
2. `badGradesAffordable` correct for both directions (no NaN). — Task 3.
3. Semester creation offers a scale picker driving that semester; active scale label visible. — Task 4.
4. `npm run build` and `tsc -b` clean; all tests pass. — every task gate.
5. Scale `<select>` labelled; existing Swiss semesters unaffected. — Task 4.
</content>
</invoke>

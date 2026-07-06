# IntelliGrade Core Calculators (Sub-project 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated Tools page with three trustworthy calculators (teacher-grade verification, grade-curve adjustment, grade-change %) built on the SP0 data model.

**Architecture:** Three pure, unit-tested domain modules (`verify.ts`, `curve.ts`, `gradeChange.ts`) hold the math. A reusable accessible `NumberField` component backs all calculator inputs. A top-level `view: 'grades' | 'tools'` switch in `App.tsx` (with a Sidebar nav block) toggles between the existing subject view and a new `ToolsPage` that lays out the three calculator cards. The currently selected subject (already reconciled in `App.tsx`) is the shared "Save as grade" target.

**Tech Stack:** Vite + React 18 + TypeScript + Tailwind v4 + Zustand + Vitest + lucide-react.

## Global Constraints

- **Grade scale is abstract:** all math goes through the `GradeScale` interface (`src/domain/grade-scale/GradeScale.ts`); never hard-code `1`/`6`/`*5`. Resolve the active scale with `getScale(semester.scaleId)`, falling back to `swissScale` when no semester exists.
- **TDD for domain modules:** failing test first, then minimal implementation. Component/interaction tests are NOT required (consistent with SP0).
- **Dark-mode only, mobile-first, accessible:** every `<input type="number">` in this sub-project is rendered through `NumberField`, which supplies an associated `<label>` and `aria-label`.
- **No new store state:** reuse the existing `selectedSubjectId` selection (reconciled to the active semester in `App.tsx`) and `useStore.addGrade` for saving.
- **Verification gates (run before every commit that touches TS):** `npx tsc -b` clean and `npm test` green.
- **Commit style:** conventional commits (`feat:`, `test:`, `fix:`), matching existing history.

---

### Task 1: Domain — `verifyGrade`

**Files:**
- Create: `src/domain/verify.ts`
- Test: `src/domain/verify.test.ts`

**Interfaces:**
- Consumes: `GradeScale` from `./grade-scale` (`fromPoints(earned, max) => number` returns `NaN` when `max <= 0`; `isPassing(value) => boolean`; `min`/`max` numbers).
- Produces:
  ```ts
  export type VerifyResult = {
    percentage: number;          // earned/max*100; NaN when max <= 0
    grade: number;               // scale.fromPoints(earned, max); NaN when max <= 0
    isPassing: boolean;
    matchesPublished?: boolean;  // present only when published provided
    difference?: number;         // grade - published; present only when published provided
  };
  export function verifyGrade(
    earned: number, max: number, scale: GradeScale, published?: number
  ): VerifyResult;
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/verify.test.ts
import { describe, it, expect } from "vitest";
import { verifyGrade } from "./verify";
import { swissScale } from "./grade-scale/swiss";

describe("verifyGrade", () => {
  it("full marks → top grade and 100%", () => {
    const r = verifyGrade(20, 20, swissScale);
    expect(r.grade).toBeCloseTo(6);
    expect(r.percentage).toBeCloseTo(100);
    expect(r.isPassing).toBe(true);
  });

  it("zero → min grade and 0%", () => {
    const r = verifyGrade(0, 20, swissScale);
    expect(r.grade).toBeCloseTo(1);
    expect(r.percentage).toBeCloseTo(0);
    expect(r.isPassing).toBe(false);
  });

  it("half marks → mid grade and 50%", () => {
    const r = verifyGrade(10, 20, swissScale);
    expect(r.grade).toBeCloseTo(3.5);
    expect(r.percentage).toBeCloseTo(50);
  });

  it("passing boundary at threshold", () => {
    // grade 4 requires 60% on the Swiss linear scale: (12*5)/20 + 1 = 4
    expect(verifyGrade(12, 20, swissScale).isPassing).toBe(true);
    expect(verifyGrade(11, 20, swissScale).isPassing).toBe(false);
  });

  it("published match → difference 0, matches true", () => {
    const r = verifyGrade(20, 20, swissScale, 6);
    expect(r.difference).toBeCloseTo(0);
    expect(r.matchesPublished).toBe(true);
  });

  it("published mismatch → correct signed difference, matches false", () => {
    const r = verifyGrade(20, 20, swissScale, 5.5); // computed 6
    expect(r.difference).toBeCloseTo(0.5);
    expect(r.matchesPublished).toBe(false);
  });

  it("omits published fields when no published grade given", () => {
    const r = verifyGrade(10, 20, swissScale);
    expect(r.matchesPublished).toBeUndefined();
    expect(r.difference).toBeUndefined();
  });

  it("max <= 0 → NaN grade and percentage", () => {
    const r = verifyGrade(5, 0, swissScale);
    expect(Number.isNaN(r.grade)).toBe(true);
    expect(Number.isNaN(r.percentage)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- verify`
Expected: FAIL — cannot resolve `./verify`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/verify.ts
import type { GradeScale } from "./grade-scale";

export type VerifyResult = {
  percentage: number;
  grade: number;
  isPassing: boolean;
  matchesPublished?: boolean;
  difference?: number;
};

export function verifyGrade(
  earned: number,
  max: number,
  scale: GradeScale,
  published?: number
): VerifyResult {
  const percentage = max > 0 ? (earned / max) * 100 : NaN;
  const grade = scale.fromPoints(earned, max);
  const result: VerifyResult = {
    percentage,
    grade,
    isPassing: scale.isPassing(grade),
  };
  if (published !== undefined) {
    result.difference = grade - published;
    result.matchesPublished = Math.abs(grade - published) < 0.005;
  }
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- verify`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/verify.ts src/domain/verify.test.ts
git commit -m "feat(domain): add verifyGrade for teacher-grade verification"
```

---

### Task 2: Domain — `applyCurve`

**Files:**
- Create: `src/domain/curve.ts`
- Test: `src/domain/curve.test.ts`

**Interfaces:**
- Consumes: `GradeScale` from `./grade-scale` (`fromPoints`, `min`, `max`).
- Produces:
  ```ts
  export type CurveResult = { originalGrade: number; adjustedGrade: number; delta: number };
  export function applyCurve(
    earned: number, originalMax: number, adjustedMax: number, bonus: number, scale: GradeScale
  ): CurveResult;
  // adjustedGrade = clamp(scale.fromPoints(earned, adjustedMax) + bonus, [scale.min, scale.max])
  // originalGrade = scale.fromPoints(earned, originalMax); delta = adjustedGrade - originalGrade
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/curve.test.ts
import { describe, it, expect } from "vitest";
import { applyCurve } from "./curve";
import { swissScale } from "./grade-scale/swiss";

describe("applyCurve", () => {
  it("lowering the adjusted max raises the grade", () => {
    // original: (15*5)/20+1 = 4.75; adjusted max 18: (15*5)/18+1 = 5.1667
    const r = applyCurve(15, 20, 18, 0, swissScale);
    expect(r.originalGrade).toBeCloseTo(4.75);
    expect(r.adjustedGrade).toBeCloseTo(5.1667, 3);
    expect(r.delta).toBeGreaterThan(0);
  });

  it("adds the flat bonus", () => {
    const r = applyCurve(15, 20, 20, 0.5, swissScale);
    expect(r.adjustedGrade).toBeCloseTo(5.25); // 4.75 + 0.5
    expect(r.delta).toBeCloseTo(0.5);
  });

  it("clamps at the scale max (cannot exceed 6.0)", () => {
    const r = applyCurve(20, 20, 20, 1, swissScale); // 6 + 1 → clamp 6
    expect(r.adjustedGrade).toBeCloseTo(6);
    expect(r.delta).toBeCloseTo(0);
  });

  it("clamps at the scale min", () => {
    const r = applyCurve(0, 20, 20, -1, swissScale); // 1 - 1 → clamp 1
    expect(r.adjustedGrade).toBeCloseTo(1);
  });

  it("identical max with zero bonus → delta 0", () => {
    const r = applyCurve(15, 20, 20, 0, swissScale);
    expect(r.delta).toBeCloseTo(0);
    expect(r.adjustedGrade).toBeCloseTo(r.originalGrade);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- curve`
Expected: FAIL — cannot resolve `./curve`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/curve.ts
import type { GradeScale } from "./grade-scale";

export type CurveResult = {
  originalGrade: number;
  adjustedGrade: number;
  delta: number;
};

export function applyCurve(
  earned: number,
  originalMax: number,
  adjustedMax: number,
  bonus: number,
  scale: GradeScale
): CurveResult {
  const originalGrade = scale.fromPoints(earned, originalMax);
  const raw = scale.fromPoints(earned, adjustedMax) + bonus;
  const adjustedGrade = Math.min(scale.max, Math.max(scale.min, raw));
  return { originalGrade, adjustedGrade, delta: adjustedGrade - originalGrade };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- curve`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/curve.ts src/domain/curve.test.ts
git commit -m "feat(domain): add applyCurve for grade-curve adjustment"
```

---

### Task 3: Domain — grade-change percentage

**Files:**
- Create: `src/domain/gradeChange.ts`
- Test: `src/domain/gradeChange.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export function gradeChangePercent(original: number, raised: number): number;   // (raised-original)/original*100
  export function originalFromRaisePercent(raised: number, pct: number): number;  // raised/(1+pct/100)
  ```

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/gradeChange.test.ts
import { describe, it, expect } from "vitest";
import { gradeChangePercent, originalFromRaisePercent } from "./gradeChange";

describe("gradeChangePercent", () => {
  it("increase → positive percent", () => {
    expect(gradeChangePercent(4, 5)).toBeCloseTo(25); // (5-4)/4*100
  });
  it("decrease → negative percent", () => {
    expect(gradeChangePercent(5, 4)).toBeCloseTo(-20); // (4-5)/5*100
  });
  it("no change → 0%", () => {
    expect(gradeChangePercent(4.5, 4.5)).toBeCloseTo(0);
  });
});

describe("originalFromRaisePercent", () => {
  it("is the correct inverse: raised/(1+pct/100), not raised*(1-pct/100)", () => {
    // raised 5 after a 25% increase → original 4
    expect(originalFromRaisePercent(5, 25)).toBeCloseTo(4);
    // the old buggy formula would give 5*(1-0.25) = 3.75 — assert we do NOT get that
    expect(originalFromRaisePercent(5, 25)).not.toBeCloseTo(3.75);
  });

  it("round-trips with gradeChangePercent", () => {
    const original = 4.2;
    const raised = 5.1;
    const pct = gradeChangePercent(original, raised);
    expect(originalFromRaisePercent(raised, pct)).toBeCloseTo(original);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gradeChange`
Expected: FAIL — cannot resolve `./gradeChange`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/gradeChange.ts
export function gradeChangePercent(original: number, raised: number): number {
  return ((raised - original) / original) * 100;
}

export function originalFromRaisePercent(raised: number, pct: number): number {
  return raised / (1 + pct / 100);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gradeChange`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/gradeChange.ts src/domain/gradeChange.test.ts
git commit -m "feat(domain): add grade-change percent with correct inverse"
```

---

### Task 4: `NumberField` component

**Files:**
- Create: `src/components/NumberField.tsx`

**Interfaces:**
- Consumes: nothing (leaf component).
- Produces:
  ```ts
  export type NumberFieldProps = {
    label: string;
    value: string;                       // controlled string value (raw input text)
    onChange: (value: string) => void;
    step?: number;
    placeholder?: string;
    error?: string;
    min?: number;
    max?: number;
  };
  export function NumberField(props: NumberFieldProps): JSX.Element;
  ```
  Renders a `<label>` wrapping the label text and an `<input type="number">` with `aria-label={label}`, plus an inline error slot below.

- [ ] **Step 1: Write the component**

```tsx
// src/components/NumberField.tsx
export type NumberFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  placeholder?: string;
  error?: string;
  min?: number;
  max?: number;
};

export function NumberField({
  label,
  value,
  onChange,
  step,
  placeholder,
  error,
  min,
  max,
}: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-300">{label}</span>
      <input
        type="number"
        aria-label={label}
        aria-invalid={error ? true : undefined}
        value={value}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
      />
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -b`
Expected: clean (no output / exit 0).

- [ ] **Step 3: Commit**

```bash
git add src/components/NumberField.tsx
git commit -m "feat(ui): add accessible NumberField input component"
```

---

### Task 5: Navigation shell — Tools view switch + ToolsPage scaffold

Adds the `Grades`/`Tools` nav block to the sidebar, the `view` state in `App.tsx`, and an empty `ToolsPage` so switching between views works and the selected subject persists across the switch.

**Files:**
- Modify: `src/components/Icon.tsx` (add icon re-exports)
- Modify: `src/features/Sidebar.tsx` (add nav block + props)
- Modify: `src/App.tsx` (add `view` state, render `ToolsPage` or subject view)
- Create: `src/features/tools/ToolsPage.tsx` (scaffold — calculators added in Tasks 6–8)

**Interfaces:**
- Consumes: `useStore` `data`/`addGrade`; `getScale`; the `NumberField` (later tasks). `Sidebar` currently takes `{ selectedSubjectId, onSelectSubject }`.
- Produces:
  ```ts
  // Sidebar new prop shape:
  type SidebarProps = {
    selectedSubjectId: string | null;
    onSelectSubject: (id: string) => void;
    view: "grades" | "tools";
    onChangeView: (view: "grades" | "tools") => void;
  };
  // ToolsPage prop shape (consumed by App):
  type ToolsPageProps = { semesterId: string | null; subjectId: string | null };
  export function ToolsPage(props: ToolsPageProps): JSX.Element;
  ```

- [ ] **Step 1: Add icons**

Edit `src/components/Icon.tsx` to add the four icons used by the nav and calculator cards:

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
} from "lucide-react";
```

- [ ] **Step 2: Add the Sidebar nav block**

Replace the contents of `src/features/Sidebar.tsx` with:

```tsx
import { SemesterSwitcher } from "./SemesterSwitcher";
import { SubjectList } from "./SubjectList";
import { GraduationCap, BookOpen, Wrench } from "../components/Icon";

type View = "grades" | "tools";

type Props = {
  selectedSubjectId: string | null;
  onSelectSubject: (id: string) => void;
  view: View;
  onChangeView: (view: View) => void;
};

export function Sidebar({
  selectedSubjectId,
  onSelectSubject,
  view,
  onChangeView,
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

- [ ] **Step 3: Create the ToolsPage scaffold**

```tsx
// src/features/tools/ToolsPage.tsx
type Props = { semesterId: string | null; subjectId: string | null };

export function ToolsPage(_props: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Tools</h2>
        <p className="text-sm text-slate-400">
          Verify grades, model curves, and compute percentage changes.
        </p>
      </header>
      {/* Calculator cards added in Tasks 6–8 */}
    </div>
  );
}
```

- [ ] **Step 4: Wire the view switch into App**

Replace the contents of `src/App.tsx` with:

```tsx
import { useState } from "react";
import { Sidebar } from "./features/Sidebar";
import { SubjectDetail } from "./features/SubjectDetail";
import { ToolsPage } from "./features/tools/ToolsPage";
import { useStore } from "./store/useStore";

export default function App() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
  const [view, setView] = useState<"grades" | "tools">("grades");
  const data = useStore((s) => s.data);
  const activeSemesterId = data.activeSemesterId;
  const activeSemester = data.semesters.find((s) => s.id === activeSemesterId);
  const effectiveSubjectId =
    selectedSubjectId !== null &&
    activeSemester?.subjects.some((sub) => sub.id === selectedSubjectId)
      ? selectedSubjectId
      : null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        selectedSubjectId={effectiveSubjectId}
        onSelectSubject={setSelectedSubjectId}
        view={view}
        onChangeView={setView}
      />
      <main className="flex-1 p-6">
        {view === "tools" ? (
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
Expected: tsc clean; all existing + new domain tests green; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/Icon.tsx src/features/Sidebar.tsx src/App.tsx src/features/tools/ToolsPage.tsx
git commit -m "feat(ui): add Tools view switch and ToolsPage scaffold"
```

---

### Task 6: VerificationCalculator

**Files:**
- Create: `src/features/tools/VerificationCalculator.tsx`
- Modify: `src/features/tools/ToolsPage.tsx` (render the card + resolve scale)

**Interfaces:**
- Consumes: `verifyGrade`/`VerifyResult` (Task 1); `NumberField` (Task 4); `getScale`, `GradeScale`; `useStore.addGrade`; `Card`, `Button`, icons.
- Produces:
  ```ts
  type CalcProps = { scale: GradeScale; semesterId: string | null; subjectId: string | null };
  export function VerificationCalculator(props: CalcProps): JSX.Element;
  ```
  Save is enabled only when both `semesterId` and `subjectId` are non-null.

- [ ] **Step 1: Create the calculator**

```tsx
// src/features/tools/VerificationCalculator.tsx
import { useState } from "react";
import { verifyGrade } from "../../domain/verify";
import type { GradeScale } from "../../domain/grade-scale";
import { useStore } from "../../store/useStore";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { ClipboardCheck, Plus } from "../../components/Icon";

type Props = { scale: GradeScale; semesterId: string | null; subjectId: string | null };

export function VerificationCalculator({ scale, semesterId, subjectId }: Props) {
  const addGrade = useStore((s) => s.addGrade);
  const [earned, setEarned] = useState("");
  const [max, setMax] = useState("");
  const [weight, setWeight] = useState("");
  const [published, setPublished] = useState("");

  const e = parseFloat(earned);
  const m = parseFloat(max);
  const pub = published.trim() === "" ? undefined : parseFloat(published);
  const valid = !Number.isNaN(e) && !Number.isNaN(m) && m > 0;
  const result = valid
    ? verifyGrade(e, m, scale, pub !== undefined && !Number.isNaN(pub) ? pub : undefined)
    : null;
  const gradeValid = result !== null && scale.clampValid(result.grade);
  const canSave = gradeValid && semesterId !== null && subjectId !== null;

  const save = () => {
    if (!canSave || result === null || semesterId === null || subjectId === null) return;
    const w = parseFloat(weight);
    addGrade(semesterId, subjectId, {
      value: result.grade,
      weight: !Number.isNaN(w) && w > 0 ? w : 1,
    });
  };

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <ClipboardCheck size={16} className="text-indigo-400" />
        Verify a teacher's grade
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Earned points" value={earned} onChange={setEarned} placeholder="e.g. 15" />
        <NumberField label="Max points" value={max} onChange={setMax} placeholder="e.g. 20" />
        <NumberField label="Weight (optional)" value={weight} onChange={setWeight} placeholder="1" />
        <NumberField label="Published grade (optional)" value={published} onChange={setPublished} placeholder="e.g. 4.5" />
      </div>
      {result !== null && (
        <div className="mt-4 space-y-1 text-sm">
          <div>
            Percentage:{" "}
            <span className="font-semibold text-slate-200">{result.percentage.toFixed(1)}%</span>
          </div>
          <div>
            Correct grade:{" "}
            <span className={`font-semibold ${gradeValid ? scale.colorFor(result.grade) : "text-rose-400"}`}>
              {scale.format(result.grade)}
            </span>{" "}
            <span className="text-slate-400">({result.isPassing ? "pass" : "fail"})</span>
          </div>
          {result.matchesPublished !== undefined && (
            <div className={result.matchesPublished ? "text-emerald-400" : "text-amber-400"}>
              {result.matchesPublished
                ? "Matches the published grade."
                : `Off by ${result.difference!.toFixed(2)} from the published grade.`}
            </div>
          )}
        </div>
      )}
      <div className="mt-4 flex items-center gap-2">
        <Button variant="ghost" disabled={!canSave} onClick={save}>
          <Plus size={16} /> Save as grade
        </Button>
        {subjectId === null && (
          <span className="text-xs text-slate-500">Select a subject to save</span>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Render it from ToolsPage**

Replace the contents of `src/features/tools/ToolsPage.tsx` with:

```tsx
import { useStore } from "../../store/useStore";
import { getScale } from "../../domain/grade-scale";
import { VerificationCalculator } from "./VerificationCalculator";

type Props = { semesterId: string | null; subjectId: string | null };

export function ToolsPage({ semesterId, subjectId }: Props) {
  const data = useStore((s) => s.data);
  const semester = data.semesters.find((s) => s.id === semesterId);
  const scale = getScale(semester?.scaleId ?? "swiss");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Tools</h2>
        <p className="text-sm text-slate-400">
          Verify grades, model curves, and compute percentage changes.
        </p>
      </header>
      <VerificationCalculator scale={scale} semesterId={semesterId} subjectId={subjectId} />
      {/* CurveCalculator (Task 7) and GradeChangeCalculator (Task 8) added below */}
    </div>
  );
}
```

- [ ] **Step 3: Verify type-check, tests, and build**

Run: `npx tsc -b && npm test && npm run build`
Expected: tsc clean; tests green; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/VerificationCalculator.tsx src/features/tools/ToolsPage.tsx
git commit -m "feat(ui): add teacher-grade verification calculator"
```

---

### Task 7: CurveCalculator

**Files:**
- Create: `src/features/tools/CurveCalculator.tsx`
- Modify: `src/features/tools/ToolsPage.tsx` (render the card)

**Interfaces:**
- Consumes: `applyCurve`/`CurveResult` (Task 2); `weightedAverage` from `../../domain/calc`; `NumberField`; `GradeScale`; `useStore` (`data`, `addGrade`); `Card`, `Button`, icons.
- Produces:
  ```ts
  type CalcProps = { scale: GradeScale; semesterId: string | null; subjectId: string | null };
  export function CurveCalculator(props: CalcProps): JSX.Element;
  ```

- [ ] **Step 1: Create the calculator**

```tsx
// src/features/tools/CurveCalculator.tsx
import { useState } from "react";
import { applyCurve } from "../../domain/curve";
import { weightedAverage } from "../../domain/calc";
import type { GradeScale } from "../../domain/grade-scale";
import { useStore } from "../../store/useStore";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { SlidersHorizontal, Plus } from "../../components/Icon";

type Props = { scale: GradeScale; semesterId: string | null; subjectId: string | null };

export function CurveCalculator({ scale, semesterId, subjectId }: Props) {
  const data = useStore((s) => s.data);
  const addGrade = useStore((s) => s.addGrade);
  const [earned, setEarned] = useState("");
  const [originalMax, setOriginalMax] = useState("");
  const [adjustedMax, setAdjustedMax] = useState("");
  const [bonus, setBonus] = useState("");

  const e = parseFloat(earned);
  const om = parseFloat(originalMax);
  const am = parseFloat(adjustedMax);
  const b = bonus.trim() === "" ? 0 : parseFloat(bonus);
  const valid =
    !Number.isNaN(e) && !Number.isNaN(om) && om > 0 && !Number.isNaN(am) && am > 0 && !Number.isNaN(b);
  const result = valid ? applyCurve(e, om, am, b, scale) : null;
  const gradeValid = result !== null && scale.clampValid(result.adjustedGrade);
  const canSave = gradeValid && semesterId !== null && subjectId !== null;

  const subject = data.semesters
    .find((s) => s.id === semesterId)
    ?.subjects.find((s) => s.id === subjectId);
  const projectedAvg =
    result !== null && subject
      ? weightedAverage([...subject.grades, { id: "__preview", value: result.adjustedGrade, weight: 1 }])
      : null;

  const save = () => {
    if (!canSave || result === null || semesterId === null || subjectId === null) return;
    addGrade(semesterId, subjectId, { value: result.adjustedGrade, weight: 1 });
  };

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <SlidersHorizontal size={16} className="text-indigo-400" />
        Grade curve adjustment
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Earned points" value={earned} onChange={setEarned} placeholder="e.g. 15" />
        <NumberField label="Original max" value={originalMax} onChange={setOriginalMax} placeholder="e.g. 20" />
        <NumberField label="Adjusted max" value={adjustedMax} onChange={setAdjustedMax} placeholder="e.g. 18" />
        <NumberField label="Flat bonus" value={bonus} onChange={setBonus} placeholder="e.g. 0.25" />
      </div>
      {result !== null && (
        <div className="mt-4 space-y-1 text-sm">
          <div>
            Original grade:{" "}
            <span className={`font-semibold ${scale.colorFor(result.originalGrade)}`}>
              {scale.format(result.originalGrade)}
            </span>
          </div>
          <div>
            Adjusted grade:{" "}
            <span className={`font-semibold ${gradeValid ? scale.colorFor(result.adjustedGrade) : "text-rose-400"}`}>
              {scale.format(result.adjustedGrade)}
            </span>{" "}
            <span className="text-slate-400">
              ({result.delta >= 0 ? "+" : ""}
              {result.delta.toFixed(2)})
            </span>
          </div>
          {projectedAvg !== null && (
            <div>
              Projected new average:{" "}
              <span className={`font-semibold ${scale.colorFor(projectedAvg)}`}>
                {scale.format(projectedAvg)}
              </span>
            </div>
          )}
        </div>
      )}
      <div className="mt-4 flex items-center gap-2">
        <Button variant="ghost" disabled={!canSave} onClick={save}>
          <Plus size={16} /> Save as grade
        </Button>
        {subjectId === null && (
          <span className="text-xs text-slate-500">Select a subject to save</span>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Render it from ToolsPage**

In `src/features/tools/ToolsPage.tsx`, add the import and the card. Change the import block to include:

```tsx
import { CurveCalculator } from "./CurveCalculator";
```

And insert, immediately after the `<VerificationCalculator ... />` line:

```tsx
      <CurveCalculator scale={scale} semesterId={semesterId} subjectId={subjectId} />
```

- [ ] **Step 3: Verify type-check, tests, and build**

Run: `npx tsc -b && npm test && npm run build`
Expected: tsc clean; tests green; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/CurveCalculator.tsx src/features/tools/ToolsPage.tsx
git commit -m "feat(ui): add grade-curve adjustment calculator"
```

---

### Task 8: GradeChangeCalculator

**Files:**
- Create: `src/features/tools/GradeChangeCalculator.tsx`
- Modify: `src/features/tools/ToolsPage.tsx` (render the card)

**Interfaces:**
- Consumes: `gradeChangePercent`, `originalFromRaisePercent` (Task 3); `NumberField`; `Card`, icons. No save target (pure calculation).
- Produces:
  ```ts
  export function GradeChangeCalculator(): JSX.Element;  // no props — pure calc, no subject save
  ```

- [ ] **Step 1: Create the calculator**

```tsx
// src/features/tools/GradeChangeCalculator.tsx
import { useState } from "react";
import { gradeChangePercent, originalFromRaisePercent } from "../../domain/gradeChange";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { Percent } from "../../components/Icon";

export function GradeChangeCalculator() {
  // Direction A: original + raised → percent change
  const [original, setOriginal] = useState("");
  const [raised, setRaised] = useState("");
  const o = parseFloat(original);
  const r = parseFloat(raised);
  const percent = !Number.isNaN(o) && o !== 0 && !Number.isNaN(r) ? gradeChangePercent(o, r) : null;

  // Direction B: raised + percent → original
  const [raised2, setRaised2] = useState("");
  const [pct, setPct] = useState("");
  const r2 = parseFloat(raised2);
  const p = parseFloat(pct);
  const derivedOriginal =
    !Number.isNaN(r2) && !Number.isNaN(p) && 1 + p / 100 !== 0
      ? originalFromRaisePercent(r2, p)
      : null;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Percent size={16} className="text-indigo-400" />
        Grade change %
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Original + raised → % change
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Original grade" value={original} onChange={setOriginal} placeholder="e.g. 4" />
          <NumberField label="Raised grade" value={raised} onChange={setRaised} placeholder="e.g. 5" />
        </div>
        {percent !== null && (
          <div className="text-sm">
            Change:{" "}
            <span className={`font-semibold ${percent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {percent >= 0 ? "+" : ""}
              {percent.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Raised + % change → original
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Raised grade" value={raised2} onChange={setRaised2} placeholder="e.g. 5" />
          <NumberField label="Percent change" value={pct} onChange={setPct} placeholder="e.g. 25" />
        </div>
        {derivedOriginal !== null && (
          <div className="text-sm">
            Original:{" "}
            <span className="font-semibold text-slate-200">{derivedOriginal.toFixed(2)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Render it from ToolsPage**

In `src/features/tools/ToolsPage.tsx`, add the import:

```tsx
import { GradeChangeCalculator } from "./GradeChangeCalculator";
```

And insert, immediately after the `<CurveCalculator ... />` line:

```tsx
      <GradeChangeCalculator />
```

- [ ] **Step 3: Verify type-check, tests, and build**

Run: `npx tsc -b && npm test && npm run build`
Expected: tsc clean; all tests green; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/GradeChangeCalculator.tsx src/features/tools/ToolsPage.tsx
git commit -m "feat(ui): add grade-change percentage calculator"
```

---

## Final verification (after Task 8)

- [ ] Run the full gate one more time: `npx tsc -b && npm test && npm run build` — all green.
- [ ] Manual smoke (`npm run dev`): switch to **Tools**, confirm the three cards render; selecting a subject in **Grades** then switching to **Tools** keeps it selected and enables the Save buttons; with no subject selected the Save buttons are disabled with the "Select a subject to save" hint.
- [ ] Update `docs/superpowers/specs/2026-07-06-intelligrade-core-calculators-design.md` status line to reflect completion, and log any follow-ups into `.superpowers/sdd/` per the SP0 convention.

## Success criteria (from the design spec)

1. Tools view reachable from the sidebar; switching preserves the selected subject. — Tasks 5–8.
2. Verification computes percentage, grade, pass/fail, match/difference; can save into the selected subject. — Tasks 1, 6.
3. Curve adjustment shows original/adjusted/delta + projected average; can save. — Tasks 2, 7.
4. Grade-change % computes signed change and the correct inverse. — Tasks 3, 8.
5. All new domain unit tests pass; `npm run build` and `tsc -b` clean. — every task gate.
6. All number inputs have associated labels / `aria-label`s via `NumberField`. — Task 4, used by Tasks 6–8.
</content>
</invoke>

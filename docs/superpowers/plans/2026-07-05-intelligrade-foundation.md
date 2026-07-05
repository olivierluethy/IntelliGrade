# IntelliGrade Foundation (Sub-project 0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild IntelliGrade as a persistent, dark-mode React app with a clean data model (Semester → Subject → Grade), a pluggable grade-scale abstraction (Swiss implemented), and the grade-from-points calculator ported onto the model.

**Architecture:** Vite + React + TypeScript. A pure, React-free `domain/` layer holds all grade math behind a `GradeScale` interface. A `store/` layer (Zustand) holds app state and persists it to `localStorage` with a versioned schema. React `components/` and `features/` render the shell (semester switcher, subject list, subject detail table, points calculator).

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4, Zustand, Lucide-react, Vitest.

## Global Constraints

- Dark mode only. No light theme. Base palette slate/zinc + one accent color.
- Icons: Lucide-react only. No Font Awesome, no PNG icons in the new app.
- `src/domain/**` must import nothing from React, the DOM, or the store. Pure functions only.
- All grade math takes a `GradeScale` argument; nothing is hardcoded to the Swiss numbers outside `swiss.ts`.
- localStorage key: `intelligrade.data`. Schema is versioned (`schemaVersion: 1`).
- TDD for `domain/` and `store/`: write the failing test first, watch it fail, implement, watch it pass, commit.
- Swiss scale: `min 1.0`, `max 6.0`, `passThreshold 4.0`, `higherIsBetter true`, `fromPoints = earned*5/max + 1`.
- The new app is built fresh under the repo root; the old `index.html`, `css/`, `js/` remain in git history and may be deleted in the final task.

---

### Task 1: Scaffold Vite + React + TS + Tailwind + Vitest

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html` (new), `src/main.tsx`, `src/App.tsx`, `src/index.css`, `vitest.config.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: a running dev server and a passing `npm run test` harness. `src/App.tsx` exports default `App`.

- [ ] **Step 1: Create the Vite project files**

Because the repo already has content, scaffold manually rather than `npm create`. Create `package.json`:

```json
{
  "name": "intelligrade",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^4.5.5",
    "lucide-react": "^0.454.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4",
    "tailwindcss": "^4.0.0-beta.4",
    "@tailwindcss/vite": "^4.0.0-beta.4"
  }
}
```

- [ ] **Step 2: Create config files**

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 3: Create the app entry files**

New `index.html` (repo root — overwrite the old one):

```html
<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="shortcut icon" href="/images/favicon.ico" />
    <title>IntelliGrade</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/index.css`:

```css
@import "tailwindcss";

:root { color-scheme: dark; }
body { @apply bg-slate-950 text-slate-100 antialiased; }
```

`src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/App.tsx`:

```tsx
export default function App() {
  return (
    <div className="min-h-screen grid place-items-center">
      <h1 className="text-3xl font-semibold tracking-tight">IntelliGrade</h1>
    </div>
  );
}
```

- [ ] **Step 4: Update .gitignore**

Append these lines to `.gitignore` (create it if absent):

```
node_modules
dist
*.local
```

- [ ] **Step 5: Install and verify**

Run: `npm install`
Then: `npm run test`
Expected: Vitest runs and reports "No test files found" (exit 0) — harness works.
Then: `npm run dev` and confirm it starts without error (Ctrl-C to stop).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts vitest.config.ts tsconfig.json tsconfig.node.json index.html src/main.tsx src/App.tsx src/index.css .gitignore
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

### Task 2: Domain types + GradeScale interface + Swiss scale

**Files:**
- Create: `src/domain/types.ts`, `src/domain/grade-scale/GradeScale.ts`, `src/domain/grade-scale/swiss.ts`, `src/domain/grade-scale/index.ts`
- Test: `src/domain/grade-scale/swiss.test.ts`

**Interfaces:**
- Produces:
  - `interface GradeScale` with members: `id: string`, `label: string`, `min: number`, `max: number`, `passThreshold: number`, `higherIsBetter: boolean`, `isPassing(v: number): boolean`, `fromPoints(earned: number, max: number): number`, `colorFor(v: number): string`, `format(v: number): string`, `clampValid(v: number): boolean`.
  - `swissScale: GradeScale` (id `'swiss'`).
  - `getScale(id: string): GradeScale` and `SCALES: Record<string, GradeScale>`.
  - Types `Grade`, `Subject`, `Semester`, `AppData` from `types.ts`.

- [ ] **Step 1: Write the failing test**

`src/domain/grade-scale/swiss.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { swissScale } from "./swiss";

describe("swissScale", () => {
  it("has Swiss bounds", () => {
    expect(swissScale.min).toBe(1);
    expect(swissScale.max).toBe(6);
    expect(swissScale.passThreshold).toBe(4);
    expect(swissScale.higherIsBetter).toBe(true);
  });

  it("computes grade from points: full marks = 6", () => {
    expect(swissScale.fromPoints(20, 20)).toBeCloseTo(6);
  });

  it("computes grade from points: zero = 1", () => {
    expect(swissScale.fromPoints(0, 20)).toBeCloseTo(1);
  });

  it("computes grade from points: half = 3.5", () => {
    expect(swissScale.fromPoints(10, 20)).toBeCloseTo(3.5);
  });

  it("passing at and above 4.0", () => {
    expect(swissScale.isPassing(4)).toBe(true);
    expect(swissScale.isPassing(3.9)).toBe(false);
    expect(swissScale.isPassing(6)).toBe(true);
  });

  it("clampValid rejects out of range", () => {
    expect(swissScale.clampValid(0.9)).toBe(false);
    expect(swissScale.clampValid(6.1)).toBe(false);
    expect(swissScale.clampValid(4.25)).toBe(true);
  });

  it("format shows two decimals", () => {
    expect(swissScale.format(5.2)).toBe("5.20");
  });

  it("colorFor returns a non-empty string differing by band", () => {
    expect(swissScale.colorFor(5.5)).not.toBe(swissScale.colorFor(3.5));
    expect(swissScale.colorFor(5.5).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL — cannot resolve `./swiss`.

- [ ] **Step 3: Write the types**

`src/domain/types.ts`:

```ts
export type Grade = {
  id: string;
  value: number;
  weight: number;
  label?: string;
  date?: string;
  category?: string;
};

export type Subject = {
  id: string;
  name: string;
  targetGrade?: number;
  grades: Grade[];
};

export type Semester = {
  id: string;
  name: string;
  scaleId: string;
  subjects: Subject[];
};

export type AppData = {
  schemaVersion: 1;
  activeSemesterId: string | null;
  semesters: Semester[];
};
```

- [ ] **Step 4: Write the GradeScale interface**

`src/domain/grade-scale/GradeScale.ts`:

```ts
export interface GradeScale {
  id: string;
  label: string;
  min: number;
  max: number;
  passThreshold: number;
  higherIsBetter: boolean;
  isPassing(value: number): boolean;
  fromPoints(earned: number, max: number): number;
  colorFor(value: number): string;
  format(value: number): string;
  clampValid(value: number): boolean;
}
```

- [ ] **Step 5: Write the Swiss scale**

`src/domain/grade-scale/swiss.ts`:

```ts
import type { GradeScale } from "./GradeScale";

export const swissScale: GradeScale = {
  id: "swiss",
  label: "Switzerland (1–6)",
  min: 1,
  max: 6,
  passThreshold: 4,
  higherIsBetter: true,
  isPassing(value) {
    return value >= this.passThreshold;
  },
  fromPoints(earned, max) {
    if (max <= 0) return NaN;
    return (earned * 5) / max + 1;
  },
  colorFor(value) {
    if (value >= 5.5) return "text-emerald-400";
    if (value >= 4.5) return "text-lime-400";
    if (value >= 4) return "text-amber-400";
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

- [ ] **Step 6: Write the scale registry**

`src/domain/grade-scale/index.ts`:

```ts
import type { GradeScale } from "./GradeScale";
import { swissScale } from "./swiss";

export type { GradeScale } from "./GradeScale";
export { swissScale } from "./swiss";

export const SCALES: Record<string, GradeScale> = {
  [swissScale.id]: swissScale,
};

export function getScale(id: string): GradeScale {
  return SCALES[id] ?? swissScale;
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test`
Expected: PASS (8 tests).

- [ ] **Step 8: Commit**

```bash
git add src/domain/types.ts src/domain/grade-scale/
git commit -m "feat(domain): add types, GradeScale interface, and Swiss scale"
```

---

### Task 3: Weighted-average and grade-from-points calc functions

**Files:**
- Create: `src/domain/calc.ts`
- Test: `src/domain/calc.test.ts`

**Interfaces:**
- Consumes: `Grade` from `types.ts`, `GradeScale` from `grade-scale`.
- Produces:
  - `weightedAverage(grades: Grade[]): number | null` — returns `null` when there are no grades or total weight is 0; otherwise `sum(value*weight)/sum(weight)`.
  - `gradeFromPoints(earned: number, max: number, scale: GradeScale): number` — delegates to `scale.fromPoints`.

- [ ] **Step 1: Write the failing test**

`src/domain/calc.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { weightedAverage, gradeFromPoints } from "./calc";
import { swissScale } from "./grade-scale/swiss";
import type { Grade } from "./types";

const g = (value: number, weight: number): Grade => ({
  id: Math.random().toString(),
  value,
  weight,
});

describe("weightedAverage", () => {
  it("returns null for empty list", () => {
    expect(weightedAverage([])).toBeNull();
  });

  it("returns null when total weight is 0", () => {
    expect(weightedAverage([g(5, 0), g(6, 0)])).toBeNull();
  });

  it("averages a single grade to itself", () => {
    expect(weightedAverage([g(5.5, 1)])).toBeCloseTo(5.5);
  });

  it("weights correctly", () => {
    // (5*1 + 6*2) / (1+2) = 17/3 = 5.6667
    expect(weightedAverage([g(5, 1), g(6, 2)])).toBeCloseTo(5.6667, 3);
  });

  it("handles fractional weights", () => {
    // (4*0.5 + 6*1) / 1.5 = 8/1.5 = 5.3333
    expect(weightedAverage([g(4, 0.5), g(6, 1)])).toBeCloseTo(5.3333, 3);
  });
});

describe("gradeFromPoints", () => {
  it("delegates to the scale", () => {
    expect(gradeFromPoints(20, 20, swissScale)).toBeCloseTo(6);
  });

  it("returns NaN when max is 0", () => {
    expect(Number.isNaN(gradeFromPoints(5, 0, swissScale))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL — cannot resolve `./calc`.

- [ ] **Step 3: Write the implementation**

`src/domain/calc.ts`:

```ts
import type { Grade } from "./types";
import type { GradeScale } from "./grade-scale";

export function weightedAverage(grades: Grade[]): number | null {
  let totalMarks = 0;
  let totalWeight = 0;
  for (const { value, weight } of grades) {
    if (Number.isNaN(value) || Number.isNaN(weight)) continue;
    totalMarks += value * weight;
    totalWeight += weight;
  }
  if (totalWeight <= 0) return null;
  return totalMarks / totalWeight;
}

export function gradeFromPoints(
  earned: number,
  max: number,
  scale: GradeScale
): number {
  return scale.fromPoints(earned, max);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test`
Expected: PASS (all calc + swiss tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/calc.ts src/domain/calc.test.ts
git commit -m "feat(domain): add weightedAverage and gradeFromPoints"
```

---

### Task 4: Persistence layer (localStorage + versioned migrate)

**Files:**
- Create: `src/store/persistence.ts`
- Test: `src/store/persistence.test.ts`

**Interfaces:**
- Consumes: `AppData` from `domain/types`.
- Produces:
  - `STORAGE_KEY = "intelligrade.data"`.
  - `emptyAppData(): AppData` — `{ schemaVersion: 1, activeSemesterId: null, semesters: [] }`.
  - `migrate(raw: unknown): AppData` — returns valid `AppData`, or `emptyAppData()` for null/corrupt/unknown-version input.
  - `loadAppData(storage?: Pick<Storage, "getItem">): AppData`.
  - `saveAppData(data: AppData, storage?: Pick<Storage, "setItem">): void`.

- [ ] **Step 1: Write the failing test**

`src/store/persistence.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  emptyAppData,
  migrate,
  loadAppData,
  saveAppData,
  STORAGE_KEY,
} from "./persistence";

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    _map: map,
  };
}

describe("migrate", () => {
  it("returns empty data for null", () => {
    expect(migrate(null)).toEqual(emptyAppData());
  });

  it("returns empty data for corrupt/unknown version", () => {
    expect(migrate({ schemaVersion: 99 })).toEqual(emptyAppData());
    expect(migrate({ foo: "bar" })).toEqual(emptyAppData());
  });

  it("passes through valid v1 data", () => {
    const data = {
      schemaVersion: 1,
      activeSemesterId: "s1",
      semesters: [{ id: "s1", name: "HS25", scaleId: "swiss", subjects: [] }],
    };
    expect(migrate(data)).toEqual(data);
  });
});

describe("load/save round-trip", () => {
  it("saves then loads identical data", () => {
    const store = fakeStorage();
    const data = emptyAppData();
    data.activeSemesterId = "abc";
    saveAppData(data, store);
    expect(store._map.get(STORAGE_KEY)).toBeTypeOf("string");
    expect(loadAppData(store)).toEqual(data);
  });

  it("loads empty data when storage is empty", () => {
    expect(loadAppData(fakeStorage())).toEqual(emptyAppData());
  });

  it("loads empty data when stored JSON is corrupt", () => {
    expect(loadAppData(fakeStorage({ [STORAGE_KEY]: "{not json" }))).toEqual(
      emptyAppData()
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL — cannot resolve `./persistence`.

- [ ] **Step 3: Write the implementation**

`src/store/persistence.ts`:

```ts
import type { AppData } from "../domain/types";

export const STORAGE_KEY = "intelligrade.data";

export function emptyAppData(): AppData {
  return { schemaVersion: 1, activeSemesterId: null, semesters: [] };
}

export function migrate(raw: unknown): AppData {
  if (
    raw &&
    typeof raw === "object" &&
    (raw as AppData).schemaVersion === 1 &&
    Array.isArray((raw as AppData).semesters)
  ) {
    return raw as AppData;
  }
  return emptyAppData();
}

export function loadAppData(
  storage: Pick<Storage, "getItem"> = localStorage
): AppData {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyAppData();
    return migrate(JSON.parse(raw));
  } catch {
    return emptyAppData();
  }
}

export function saveAppData(
  data: AppData,
  storage: Pick<Storage, "setItem"> = localStorage
): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — non-fatal
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/persistence.ts src/store/persistence.test.ts
git commit -m "feat(store): add versioned localStorage persistence"
```

---

### Task 5: Zustand store with debounced persistence and CRUD actions

**Files:**
- Create: `src/store/useStore.ts`, `src/store/id.ts`
- Test: `src/store/useStore.test.ts`

**Interfaces:**
- Consumes: `emptyAppData`, `loadAppData`, `saveAppData` from `persistence`; `Semester`, `Subject`, `Grade`, `AppData` from `domain/types`.
- Produces a Zustand store with state `{ data: AppData }` and actions:
  - `addSemester(name: string, scaleId?: string): string` (returns new id, sets it active if first)
  - `setActiveSemester(id: string): void`
  - `addSubject(semesterId: string, name: string): string`
  - `deleteSubject(semesterId: string, subjectId: string): void`
  - `addGrade(semesterId: string, subjectId: string, grade: Omit<Grade, "id">): string`
  - `updateGrade(semesterId: string, subjectId: string, gradeId: string, patch: Partial<Omit<Grade, "id">>): void`
  - `deleteGrade(semesterId: string, subjectId: string, gradeId: string): void`
  - `setSubjectTarget(semesterId: string, subjectId: string, target: number | undefined): void`
- Also produces `newId(): string` from `id.ts`.

- [ ] **Step 1: Write the id helper (no test needed — trivial)**

`src/store/id.ts`:

```ts
export function newId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}
```

- [ ] **Step 2: Write the failing test**

`src/store/useStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "./useStore";
import { emptyAppData } from "./persistence";

beforeEach(() => {
  useStore.setState({ data: emptyAppData() });
});

describe("store CRUD", () => {
  it("adds a semester and makes the first one active", () => {
    const id = useStore.getState().addSemester("HS25");
    const { data } = useStore.getState();
    expect(data.semesters).toHaveLength(1);
    expect(data.activeSemesterId).toBe(id);
  });

  it("adds a subject to a semester", () => {
    const sem = useStore.getState().addSemester("HS25");
    const sub = useStore.getState().addSubject(sem, "Math");
    const semester = useStore.getState().data.semesters[0];
    expect(semester.subjects[0].id).toBe(sub);
    expect(semester.subjects[0].name).toBe("Math");
  });

  it("adds, updates, and deletes a grade", () => {
    const sem = useStore.getState().addSemester("HS25");
    const sub = useStore.getState().addSubject(sem, "Math");
    const gid = useStore
      .getState()
      .addGrade(sem, sub, { value: 5, weight: 1 });
    let grades = useStore.getState().data.semesters[0].subjects[0].grades;
    expect(grades[0].value).toBe(5);

    useStore.getState().updateGrade(sem, sub, gid, { value: 5.5 });
    grades = useStore.getState().data.semesters[0].subjects[0].grades;
    expect(grades[0].value).toBe(5.5);

    useStore.getState().deleteGrade(sem, sub, gid);
    grades = useStore.getState().data.semesters[0].subjects[0].grades;
    expect(grades).toHaveLength(0);
  });

  it("deletes a subject", () => {
    const sem = useStore.getState().addSemester("HS25");
    const sub = useStore.getState().addSubject(sem, "Math");
    useStore.getState().deleteSubject(sem, sub);
    expect(useStore.getState().data.semesters[0].subjects).toHaveLength(0);
  });

  it("sets a subject target", () => {
    const sem = useStore.getState().addSemester("HS25");
    const sub = useStore.getState().addSubject(sem, "Math");
    useStore.getState().setSubjectTarget(sem, sub, 5.2);
    expect(
      useStore.getState().data.semesters[0].subjects[0].targetGrade
    ).toBe(5.2);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL — cannot resolve `./useStore`.

- [ ] **Step 4: Write the store**

`src/store/useStore.ts`:

```ts
import { create } from "zustand";
import type { AppData, Grade, Semester, Subject } from "../domain/types";
import { loadAppData, saveAppData, emptyAppData } from "./persistence";
import { swissScale } from "../domain/grade-scale";
import { newId } from "./id";

type State = {
  data: AppData;
  addSemester: (name: string, scaleId?: string) => string;
  setActiveSemester: (id: string) => void;
  addSubject: (semesterId: string, name: string) => string;
  deleteSubject: (semesterId: string, subjectId: string) => void;
  addGrade: (
    semesterId: string,
    subjectId: string,
    grade: Omit<Grade, "id">
  ) => string;
  updateGrade: (
    semesterId: string,
    subjectId: string,
    gradeId: string,
    patch: Partial<Omit<Grade, "id">>
  ) => void;
  deleteGrade: (
    semesterId: string,
    subjectId: string,
    gradeId: string
  ) => void;
  setSubjectTarget: (
    semesterId: string,
    subjectId: string,
    target: number | undefined
  ) => void;
};

// Map helpers keep updates immutable and readable.
const mapSemester = (
  data: AppData,
  semesterId: string,
  fn: (s: Semester) => Semester
): AppData => ({
  ...data,
  semesters: data.semesters.map((s) => (s.id === semesterId ? fn(s) : s)),
});

const mapSubject = (
  data: AppData,
  semesterId: string,
  subjectId: string,
  fn: (sub: Subject) => Subject
): AppData =>
  mapSemester(data, semesterId, (s) => ({
    ...s,
    subjects: s.subjects.map((sub) => (sub.id === subjectId ? fn(sub) : sub)),
  }));

export const useStore = create<State>((set, get) => {
  const commit = (data: AppData) => {
    saveAppData(data);
    set({ data });
  };

  return {
    data: loadAppData(),

    addSemester: (name, scaleId = swissScale.id) => {
      const id = newId();
      const data = get().data;
      const semester: Semester = { id, name, scaleId, subjects: [] };
      commit({
        ...data,
        semesters: [...data.semesters, semester],
        activeSemesterId: data.activeSemesterId ?? id,
      });
      return id;
    },

    setActiveSemester: (id) => commit({ ...get().data, activeSemesterId: id }),

    addSubject: (semesterId, name) => {
      const id = newId();
      commit(
        mapSemester(get().data, semesterId, (s) => ({
          ...s,
          subjects: [...s.subjects, { id, name, grades: [] }],
        }))
      );
      return id;
    },

    deleteSubject: (semesterId, subjectId) =>
      commit(
        mapSemester(get().data, semesterId, (s) => ({
          ...s,
          subjects: s.subjects.filter((sub) => sub.id !== subjectId),
        }))
      ),

    addGrade: (semesterId, subjectId, grade) => {
      const id = newId();
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => ({
          ...sub,
          grades: [...sub.grades, { ...grade, id }],
        }))
      );
      return id;
    },

    updateGrade: (semesterId, subjectId, gradeId, patch) =>
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => ({
          ...sub,
          grades: sub.grades.map((g) =>
            g.id === gradeId ? { ...g, ...patch } : g
          ),
        }))
      ),

    deleteGrade: (semesterId, subjectId, gradeId) =>
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => ({
          ...sub,
          grades: sub.grades.filter((g) => g.id !== gradeId),
        }))
      ),

    setSubjectTarget: (semesterId, subjectId, target) =>
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => ({
          ...sub,
          targetGrade: target,
        }))
      ),
  };
});
```

> Note: `saveAppData` writes on every commit. This is fine for localStorage at this
> data size; debouncing is an optimization deferred until profiling shows a need
> (YAGNI). The persistence seam already exists if we want it later.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/store/useStore.ts src/store/id.ts src/store/useStore.test.ts
git commit -m "feat(store): add Zustand store with CRUD and persistence"
```

---

### Task 6: Presentational component kit (Icon, Button, Card, Badge, IconButton)

**Files:**
- Create: `src/components/Icon.tsx`, `src/components/Button.tsx`, `src/components/IconButton.tsx`, `src/components/Card.tsx`, `src/components/Badge.tsx`

**Interfaces:**
- Produces reusable dark-theme components:
  - `Button({ children, onClick, variant?, type?, disabled? })` — `variant: "primary" | "ghost" | "danger"`.
  - `IconButton({ icon, label, onClick, variant? })` — `icon` is a Lucide component; `label` becomes `aria-label` and `title`.
  - `Card({ children, className? })`.
  - `Badge({ children, className? })`.
  - `Icon` re-exports selected Lucide icons for one import site.

- [ ] **Step 1: Create the Icon barrel**

`src/components/Icon.tsx`:

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
} from "lucide-react";
```

- [ ] **Step 2: Create Button**

`src/components/Button.tsx`:

```tsx
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
};

const styles: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-indigo-500 hover:bg-indigo-400 text-white",
  ghost: "bg-slate-800 hover:bg-slate-700 text-slate-200",
  danger: "bg-rose-600 hover:bg-rose-500 text-white",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400/60 disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Create IconButton**

`src/components/IconButton.tsx`:

```tsx
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger";
};

export function IconButton({
  icon: IconEl,
  label,
  onClick,
  variant = "default",
}: Props) {
  const color =
    variant === "danger"
      ? "text-slate-400 hover:text-rose-400"
      : "text-slate-400 hover:text-slate-100";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-md p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400/60 ${color}`}
    >
      <IconEl size={16} />
    </button>
  );
}
```

- [ ] **Step 4: Create Card and Badge**

`src/components/Card.tsx`:

```tsx
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/60 p-4 ${className}`}
    >
      {children}
    </div>
  );
}
```

`src/components/Badge.tsx`:

```tsx
import type { ReactNode } from "react";

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-sm font-semibold tabular-nums ${className}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Verify it typechecks**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/
git commit -m "feat(ui): add dark-theme component kit with Lucide icons"
```

---

### Task 7: App shell — sidebar with SemesterSwitcher + SubjectList

**Files:**
- Create: `src/features/SemesterSwitcher.tsx`, `src/features/SubjectList.tsx`, `src/features/Sidebar.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useStore`, components from Task 6.
- Produces:
  - `Sidebar({ selectedSubjectId, onSelectSubject })`.
  - `SemesterSwitcher()` — dropdown of semesters + "add semester" inline input.
  - `SubjectList({ selectedSubjectId, onSelectSubject })` — lists subjects of the active semester with add + select.
- `App.tsx` now renders a two-pane layout: `Sidebar` + a main pane placeholder (filled in Task 8).

- [ ] **Step 1: Create SemesterSwitcher**

`src/features/SemesterSwitcher.tsx`:

```tsx
import { useState } from "react";
import { useStore } from "../store/useStore";
import { Button } from "../components/Button";
import { Plus } from "../components/Icon";

export function SemesterSwitcher() {
  const { semesters, activeSemesterId } = useStore((s) => s.data);
  const setActive = useStore((s) => s.setActiveSemester);
  const addSemester = useStore((s) => s.addSemester);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = addSemester(trimmed);
    setActive(id);
    setName("");
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Semester
      </label>
      <select
        value={activeSemesterId ?? ""}
        onChange={(e) => setActive(e.target.value)}
        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
      >
        {semesters.length === 0 && <option value="">No semesters yet</option>}
        {semesters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {adding ? (
        <div className="flex gap-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. HS25"
            className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
          />
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

- [ ] **Step 2: Create SubjectList**

`src/features/SubjectList.tsx`:

```tsx
import { useState } from "react";
import { useStore } from "../store/useStore";
import { Button } from "../components/Button";
import { Plus, ChevronRight } from "../components/Icon";

type Props = {
  selectedSubjectId: string | null;
  onSelectSubject: (id: string) => void;
};

export function SubjectList({ selectedSubjectId, onSelectSubject }: Props) {
  const data = useStore((s) => s.data);
  const addSubject = useStore((s) => s.addSubject);
  const [name, setName] = useState("");

  const semester = data.semesters.find((s) => s.id === data.activeSemesterId);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed || !semester) return;
    const id = addSubject(semester.id, trimmed);
    onSelectSubject(id);
    setName("");
  };

  if (!semester) {
    return (
      <p className="text-sm text-slate-500">
        Create a semester to add subjects.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Subjects
      </label>
      <ul className="space-y-1">
        {semester.subjects.map((sub) => {
          const active = sub.id === selectedSubjectId;
          return (
            <li key={sub.id}>
              <button
                onClick={() => onSelectSubject(sub.id)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-indigo-500/15 text-indigo-300"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {sub.name}
                <ChevronRight size={14} className="text-slate-600" />
              </button>
            </li>
          );
        })}
        {semester.subjects.length === 0 && (
          <li className="px-2.5 py-1 text-sm text-slate-500">
            No subjects yet.
          </li>
        )}
      </ul>
      <div className="flex gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add subject"
          className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
        />
        <Button onClick={submit}>
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Sidebar**

`src/features/Sidebar.tsx`:

```tsx
import { SemesterSwitcher } from "./SemesterSwitcher";
import { SubjectList } from "./SubjectList";
import { GraduationCap } from "../components/Icon";

type Props = {
  selectedSubjectId: string | null;
  onSelectSubject: (id: string) => void;
};

export function Sidebar({ selectedSubjectId, onSelectSubject }: Props) {
  return (
    <aside className="flex w-full flex-col gap-6 border-b border-slate-800 bg-slate-900/40 p-4 md:h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2">
        <GraduationCap className="text-indigo-400" size={22} />
        <span className="text-lg font-semibold tracking-tight">
          IntelliGrade
        </span>
      </div>
      <SemesterSwitcher />
      <SubjectList
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={onSelectSubject}
      />
    </aside>
  );
}
```

- [ ] **Step 4: Rewrite App.tsx to the two-pane layout**

`src/App.tsx`:

```tsx
import { useState } from "react";
import { Sidebar } from "./features/Sidebar";

export default function App() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={setSelectedSubjectId}
      />
      <main className="flex-1 p-6">
        {selectedSubjectId ? (
          <p className="text-slate-500">Subject detail comes in Task 8.</p>
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

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`
Manually confirm: add a semester, add a subject, select it, and that both persist after a page reload.
Then: `npx tsc -b` → no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/SemesterSwitcher.tsx src/features/SubjectList.tsx src/features/Sidebar.tsx src/App.tsx
git commit -m "feat(ui): add sidebar with semester switcher and subject list"
```

---

### Task 8: Subject detail — weighted-grade table + running average

**Files:**
- Create: `src/features/SubjectDetail.tsx`, `src/features/GradeRow.tsx`, `src/features/AddGradeForm.tsx`
- Modify: `src/App.tsx:main` (replace the Task-8 placeholder)

**Interfaces:**
- Consumes: `useStore`, `weightedAverage` from `domain/calc`, `getScale` from `domain/grade-scale`, components from Task 6.
- Produces:
  - `SubjectDetail({ semesterId, subjectId })` — header (subject name + colored average Badge), add-grade form, table of grades.
  - `GradeRow({ semesterId, subjectId, grade, scale })` — one editable/deletable row.
  - `AddGradeForm({ semesterId, subjectId, scale })` — value + weight + optional label inputs.

- [ ] **Step 1: Create AddGradeForm**

`src/features/AddGradeForm.tsx`:

```tsx
import { useState } from "react";
import { useStore } from "../store/useStore";
import { Button } from "../components/Button";
import { Plus } from "../components/Icon";
import type { GradeScale } from "../domain/grade-scale";

type Props = { semesterId: string; subjectId: string; scale: GradeScale };

export function AddGradeForm({ semesterId, subjectId, scale }: Props) {
  const addGrade = useStore((s) => s.addGrade);
  const [value, setValue] = useState("");
  const [weight, setWeight] = useState("1");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const v = parseFloat(value);
    const w = parseFloat(weight);
    if (Number.isNaN(v) || !scale.clampValid(v)) {
      setError(`Grade must be between ${scale.min} and ${scale.max}.`);
      return;
    }
    if (Number.isNaN(w) || w <= 0) {
      setError("Weight must be a positive number.");
      return;
    }
    addGrade(semesterId, subjectId, {
      value: v,
      weight: w,
      label: label.trim() || undefined,
    });
    setValue("");
    setWeight("1");
    setLabel("");
    setError("");
  };

  const input =
    "rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60";

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          type="number"
          step="0.05"
          placeholder="Grade"
          className={`${input} w-24`}
        />
        <input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          type="number"
          step="0.5"
          placeholder="Weight"
          className={`${input} w-24`}
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Label (optional)"
          className={`${input} min-w-0 flex-1`}
        />
        <Button onClick={submit}>
          <Plus size={16} /> Add grade
        </Button>
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Create GradeRow**

`src/features/GradeRow.tsx`:

```tsx
import { useState } from "react";
import { useStore } from "../store/useStore";
import { IconButton } from "../components/IconButton";
import { Trash2, Pencil, Check, X } from "../components/Icon";
import type { Grade, GradeScale } from "../domain/grade-scale";
import type { Grade as GradeType } from "../domain/types";

type Props = {
  semesterId: string;
  subjectId: string;
  grade: GradeType;
  scale: GradeScale;
};

export function GradeRow({ semesterId, subjectId, grade, scale }: Props) {
  const updateGrade = useStore((s) => s.updateGrade);
  const deleteGrade = useStore((s) => s.deleteGrade);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(grade.value));
  const [weight, setWeight] = useState(String(grade.weight));

  const save = () => {
    const v = parseFloat(value);
    const w = parseFloat(weight);
    if (Number.isNaN(v) || !scale.clampValid(v) || Number.isNaN(w) || w <= 0)
      return;
    updateGrade(semesterId, subjectId, grade.id, { value: v, weight: w });
    setEditing(false);
  };

  const input =
    "w-20 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60";

  return (
    <tr className="border-b border-slate-800/60">
      <td className="py-2">
        {editing ? (
          <input
            className={input}
            type="number"
            step="0.05"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        ) : (
          <span className={`font-semibold tabular-nums ${scale.colorFor(grade.value)}`}>
            {scale.format(grade.value)}
          </span>
        )}
      </td>
      <td className="py-2">
        {editing ? (
          <input
            className={input}
            type="number"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        ) : (
          <span className="tabular-nums text-slate-300">{grade.weight}</span>
        )}
      </td>
      <td className="py-2 text-slate-400">{grade.label ?? "—"}</td>
      <td className="py-2">
        <div className="flex justify-end gap-1">
          {editing ? (
            <>
              <IconButton icon={Check} label="Save" onClick={save} />
              <IconButton
                icon={X}
                label="Cancel"
                onClick={() => setEditing(false)}
              />
            </>
          ) : (
            <>
              <IconButton
                icon={Pencil}
                label="Edit grade"
                onClick={() => setEditing(true)}
              />
              <IconButton
                icon={Trash2}
                label="Delete grade"
                variant="danger"
                onClick={() => deleteGrade(semesterId, subjectId, grade.id)}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
```

> Note: the `Grade` import from `../domain/grade-scale` is only for the re-exported
> `GradeScale` type; if your editor flags an unused `Grade`, remove it and keep
> `GradeScale`. Keep `GradeType` for the row's grade prop.

- [ ] **Step 3: Fix the GradeRow imports (clean version)**

Replace the two type-import lines at the top of `src/features/GradeRow.tsx` with exactly:

```tsx
import type { GradeScale } from "../domain/grade-scale";
import type { Grade as GradeType } from "../domain/types";
```

- [ ] **Step 4: Create SubjectDetail**

`src/features/SubjectDetail.tsx`:

```tsx
import { useStore } from "../store/useStore";
import { weightedAverage } from "../domain/calc";
import { getScale } from "../domain/grade-scale";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { AddGradeForm } from "./AddGradeForm";
import { GradeRow } from "./GradeRow";

type Props = { semesterId: string; subjectId: string };

export function SubjectDetail({ semesterId, subjectId }: Props) {
  const data = useStore((s) => s.data);
  const semester = data.semesters.find((s) => s.id === semesterId);
  const subject = semester?.subjects.find((s) => s.id === subjectId);
  if (!semester || !subject) return null;

  const scale = getScale(semester.scaleId);
  const avg = weightedAverage(subject.grades);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          {subject.name}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Average</span>
          {avg === null ? (
            <Badge className="text-slate-400">—</Badge>
          ) : (
            <Badge className={scale.colorFor(avg)}>{scale.format(avg)}</Badge>
          )}
        </div>
      </header>

      <Card>
        <AddGradeForm
          semesterId={semesterId}
          subjectId={subjectId}
          scale={scale}
        />
      </Card>

      <Card className="overflow-x-auto p-0">
        {subject.grades.length === 0 ? (
          <p className="p-6 text-center text-slate-500">
            No grades yet — add your first one above.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 font-medium">Grade</th>
                <th className="px-4 py-2 font-medium">Weight</th>
                <th className="px-4 py-2 font-medium">Label</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="[&_td]:px-4">
              {subject.grades.map((g) => (
                <GradeRow
                  key={g.id}
                  semesterId={semesterId}
                  subjectId={subjectId}
                  grade={g}
                  scale={scale}
                />
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Wire SubjectDetail into App.tsx**

In `src/App.tsx`, add the import and replace the Task-8 placeholder line. Add near the top:

```tsx
import { SubjectDetail } from "./features/SubjectDetail";
import { useStore } from "./store/useStore";
```

Inside `App`, before the return, add:

```tsx
  const activeSemesterId = useStore((s) => s.data.activeSemesterId);
```

Replace the `{selectedSubjectId ? (...) : (...)}` block's first branch:

```tsx
        {selectedSubjectId && activeSemesterId ? (
          <SubjectDetail
            semesterId={activeSemesterId}
            subjectId={selectedSubjectId}
          />
        ) : (
```

- [ ] **Step 6: Verify in browser**

Run: `npm run dev`
Manually confirm: add grades with weights, the colored average updates live, edit and delete rows work, and everything survives a reload. Then `npx tsc -b` → no errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/SubjectDetail.tsx src/features/GradeRow.tsx src/features/AddGradeForm.tsx src/App.tsx
git commit -m "feat(ui): subject detail with weighted-grade table and live average"
```

---

### Task 9: Port the grade-from-points calculator

**Files:**
- Create: `src/features/PointsCalculator.tsx`
- Modify: `src/features/SubjectDetail.tsx` (mount the calculator)

**Interfaces:**
- Consumes: `gradeFromPoints` from `domain/calc`, `useStore.addGrade`, `getScale`, components from Task 6.
- Produces: `PointsCalculator({ semesterId, subjectId, scale })` — earned/max inputs, live computed grade, and a "Save as grade" button that writes it into the subject via `addGrade`.

- [ ] **Step 1: Create PointsCalculator**

`src/features/PointsCalculator.tsx`:

```tsx
import { useState } from "react";
import { useStore } from "../store/useStore";
import { gradeFromPoints } from "../domain/calc";
import { Button } from "../components/Button";
import { Calculator, Plus } from "../components/Icon";
import type { GradeScale } from "../domain/grade-scale";

type Props = { semesterId: string; subjectId: string; scale: GradeScale };

export function PointsCalculator({ semesterId, subjectId, scale }: Props) {
  const addGrade = useStore((s) => s.addGrade);
  const [earned, setEarned] = useState("");
  const [max, setMax] = useState("");

  const e = parseFloat(earned);
  const m = parseFloat(max);
  const valid = !Number.isNaN(e) && !Number.isNaN(m) && m > 0;
  const grade = valid ? gradeFromPoints(e, m, scale) : null;
  const gradeValid = grade !== null && scale.clampValid(grade);

  const input =
    "w-24 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <Calculator size={16} className="text-indigo-400" />
        Grade from points
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={input}
          type="number"
          placeholder="Earned"
          value={earned}
          onChange={(ev) => setEarned(ev.target.value)}
        />
        <span className="text-slate-500">/</span>
        <input
          className={input}
          type="number"
          placeholder="Max"
          value={max}
          onChange={(ev) => setMax(ev.target.value)}
        />
        {grade !== null && (
          <span className="text-sm text-slate-400">
            ={" "}
            <span className={`font-semibold ${gradeValid ? scale.colorFor(grade) : "text-rose-400"}`}>
              {scale.format(grade)}
            </span>
          </span>
        )}
        <Button
          variant="ghost"
          disabled={!gradeValid}
          onClick={() => {
            if (!gradeValid || grade === null) return;
            addGrade(semesterId, subjectId, { value: grade, weight: 1 });
            setEarned("");
            setMax("");
          }}
        >
          <Plus size={16} /> Save as grade
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mount it in SubjectDetail**

In `src/features/SubjectDetail.tsx`, add the import:

```tsx
import { PointsCalculator } from "./PointsCalculator";
```

Then, immediately after the `<Card>` containing `<AddGradeForm ... />`, add a second card:

```tsx
      <Card>
        <PointsCalculator
          semesterId={semesterId}
          subjectId={subjectId}
          scale={scale}
        />
      </Card>
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Manually confirm: entering 18 earned / 20 max shows 5.50, "Save as grade" adds a weight-1 grade to the table and updates the average; out-of-range points disable the save button. Then `npx tsc -b` → no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/PointsCalculator.tsx src/features/SubjectDetail.tsx
git commit -m "feat(ui): port grade-from-points calculator onto the data model"
```

---

### Task 10: Remove legacy app files and update README

**Files:**
- Delete: `js/main.js`, `js/basic-calculations.js`, `js/modalGenerateTable.js`, `js/neededGrade.js`, `js/pdfMaker.js`, `js/convertToExcel.js`, `css/style.css`, `css/style.css.map`, `css/style.scss`, `images/enter.png`, `images/background.png`, `images/watermark.png`, `images/icon.png`
- Keep: `images/favicon.ico`, `images/IntelliGrade.drawio`
- Modify: `README.md`

**Interfaces:** none (cleanup only).

- [ ] **Step 1: Delete legacy source**

```bash
git rm js/main.js js/basic-calculations.js js/modalGenerateTable.js js/neededGrade.js js/pdfMaker.js js/convertToExcel.js css/style.css css/style.css.map css/style.scss images/enter.png images/background.png images/watermark.png images/icon.png
```

- [ ] **Step 2: Update README**

Replace the `## Dependencies` and `## Getting Started` sections of `README.md` with:

```markdown
## Getting Started

1. Clone this repository.
2. Run `npm install`.
3. Run `npm run dev` and open the printed local URL.

## Tech Stack

Vite · React · TypeScript · Tailwind CSS · Zustand · Lucide · Vitest

## Architecture

- `src/domain/` — pure, framework-free grade logic behind a `GradeScale` interface (unit-tested with Vitest).
- `src/store/` — Zustand state with versioned localStorage persistence.
- `src/components/` — reusable dark-theme UI primitives.
- `src/features/` — app screens (semester switcher, subject list, subject detail, calculators).

Data model: **Semester → Subject → Grade**, all saved locally in the browser.
```

- [ ] **Step 3: Verify build and tests still pass**

Run: `npm run test` → all PASS.
Run: `npm run build` → succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove legacy static app and update README"
```

---

## Self-Review

**Spec coverage:**
- Vite + React + TS + Tailwind scaffold → Task 1 ✓
- Dark-only theme → Task 1 (`index.css`, `html class="dark"`) + all components ✓
- Data model Semester→Subject→Grade → Task 2 (types) ✓
- GradeScale abstraction, Swiss implemented → Task 2 ✓
- weightedAverage + gradeFromPoints pure/tested → Task 3 ✓
- localStorage persistence + versioned migrate → Task 4 ✓
- Store CRUD → Task 5 ✓
- Lucide icons, no Font Awesome/PNG → Task 6 (Icon barrel) + Task 10 (delete PNGs) ✓
- App shell: sidebar, semester switcher, subject list → Task 7 ✓
- Subject detail table + live colored average → Task 8 ✓
- Ported grade-from-points writing into a subject → Task 9 ✓
- Unit tests for edge cases (empty subject, zero weight, out-of-range, max=0) → Tasks 2–4 ✓
- Success criteria (persist across reload, dev server, tests pass, no legacy icons) → Tasks 7/8 verify steps + Task 10 ✓

**Placeholder scan:** No TBD/TODO; every code step contains complete code. The only "placeholder" is App.tsx's intentional interim text in Task 7, replaced in Task 8. ✓

**Type consistency:** `weightedAverage(grades): number | null`, `gradeFromPoints(earned, max, scale)`, `getScale(id)`, store action signatures, and `GradeScale` members are used identically across Tasks 3–9. `newId()` used in Task 5 defined in Task 5. ✓

**Deferred (correctly out of scope, per spec non-goals):** scenario engine, exam planner, alerts, multi-country, analytics, PDF/Excel export.

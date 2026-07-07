<p align="center">
  <a href="https://github.com/olivierluethy/IntelliGrade">
    <img src="images/favicon.ico" alt="IntelliGrade logo" width="72" height="72">
  </a>
</p>

<h1 align="center">IntelliGrade</h1>

<p align="center">
  A grade-tracking and academic-planning app for students.<br>
  <em>“What grade do I need on my next exam?” — answered in one glance.</em>
</p>

---

## What is IntelliGrade?

IntelliGrade is a **client-side web app** that helps a student track their grades and
**plan toward a target**. You enter your grades (or the points you scored), set the average
you're aiming for, and the app tells you — in plain language — exactly what you need on your
remaining exams to get there.

It started as a Swiss 1–6 grade calculator and grew into a small academic-planning platform:
scenario planning, exam scheduling, smart alerts, analytics, multi-country grade scales, and
PDF/Excel export. **Everything runs in the browser** — there is no backend and no account;
all data lives in the browser's `localStorage`.

**Who it's for:** students (originally Swiss gymnasium/university), with support for German,
Austrian, French, and Italian grading scales too.

**Design north-star — instant clarity.** A first-time user should know what to do and where
to click without hesitation, so every screen states its purpose and the planning maths is
shown visually instead of hidden behind jargon.

---

## Feature tour (by screen)

The app is a dashboard with a left sidebar (semester + subject pickers) and five main views:

| View | What it's for |
|------|---------------|
| **Grades** | The heart of the app. Pick a subject to see its **average**, a **Target planner**, its grades table, quick “add grade” / “grade from points” panels, and **upcoming exams**. |
| **Insights** | Semester analytics: summary stats, a subject-average bar chart (pass line + target ticks), a subjects table with trends, and ranked **recommendations** on what to focus on. |
| **Tools** | Three standalone calculators: **verify a teacher's grade** from points, **adjust for a curve**, and **grade change %**. Each result can be saved straight into the open subject. |
| **Export** | Download a polished semester report as **PDF** or **Excel**, with a live in-app preview. |
| **Alerts** | Everything that needs attention across subjects: exams coming up, ungraded past exams, subjects below target, subjects with no grades. |

### The Target planner (the core idea)

Set *“I want an average of X”* and enter how many exams are still ahead. The planner shows a
**GradeTrack meter** (where you are now, your target, and what you need) plus a single
sentence like:

> *You need **5.25** on each of your 2 upcoming exams to reach your target of **5.00**.*

It also shows your current gap and how much you can still afford to slip. The exam count is
prefilled from the subject's scheduled exams, so it stays in sync automatically.

---

## Getting started

```bash
git clone https://github.com/olivierluethy/IntelliGrade
cd IntelliGrade
npm install
npm run dev        # open the printed local URL (Vite)
```

That's it — no environment variables, no services to run.

### npm scripts

| Script | Does |
|--------|------|
| `npm run dev` | Start the Vite dev server with hot reload. |
| `npm run build` | Type-check (`tsc -b`) and produce a production build in `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm test` | Run the Vitest unit suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |

---

## Tech stack

**Vite · React 18 · TypeScript · Tailwind CSS v4 · Zustand · Lucide · Vitest**

- **React + TypeScript** for the UI, strictly typed.
- **Tailwind v4** (configured in CSS via `@theme` in `src/index.css`) — a custom dark design
  system, not stock Tailwind colours.
- **Zustand** for state, persisted to `localStorage`.
- **Vitest** for unit tests (the grade maths is fully covered).
- **jsPDF + jspdf-autotable** and **SheetJS (xlsx)** for exports (code-split, loaded on demand).
- **@fontsource** for the bundled fonts (Space Grotesk + Inter).

---

## Project structure

```
src/
├── domain/            Pure, framework-free logic (no React/DOM). Unit-tested.
│   ├── types.ts         Data model: Semester → Subject → Grade / Exam
│   ├── calc.ts          weightedAverage, gradeFromPoints
│   ├── scenario.ts      gradeNeeded, gradeNeededPerExam, badGradesAffordable
│   ├── verify.ts        verify a teacher's grade
│   ├── curve.ts         curve adjustment
│   ├── gradeChange.ts   percentage change between grades
│   ├── alerts.ts        computeAlerts (derived, never stored)
│   ├── analytics.ts     per-subject & per-semester stats (direction-aware)
│   ├── recommendations.ts   ranked, plain-language advice
│   ├── parseGradeInput.ts   shared grade+weight validation
│   ├── export/report.ts     the report model shared by PDF/Excel/preview
│   └── grade-scale/     the GradeScale interface + 5 national scales + registry
├── store/             Zustand store + versioned localStorage persistence
│   ├── useStore.ts      all actions (add/update/delete grades, exams, targets…)
│   ├── persistence.ts   load/save + schema migration
│   └── id.ts            id generation
├── components/        Reusable dark-theme UI primitives
│   ├── Card, Button, Badge, NumberField, IconButton, Icon
│   ├── SectionHeader, StatTile, EmptyState
│   └── GradeTrack        the signature “where am I vs target” meter
├── features/          The screens
│   ├── Sidebar, SemesterSwitcher, SubjectList
│   ├── SubjectDetail    the Grades cockpit
│   ├── AddGradeForm, PointsCalculator, GradeRow, ExamPlanner
│   ├── scenario/Planner.tsx     the Target planner
│   ├── analytics/       Insights view + chart
│   ├── tools/           the three calculators
│   ├── export/          Export view, live preview, PDF/Excel renderers
│   └── alerts/          Alerts view
├── App.tsx            App shell + view routing
└── index.css          Design tokens (@theme), fonts, base styles
```

**The golden rule:** `src/domain/` is **pure** — it never imports React, the DOM, or the
store. That's what makes the grade maths easy to test and reuse. UI reads from the store and
calls domain functions; it never re-implements a calculation.

---

## Core concepts

### Data model

```
Semester (has a grade scale)
  └── Subject (optional target grade)
        ├── Grade (value, weight, optional label/date)
        └── Exam  (name, date, weight)  ← scheduled; becomes a Grade when recorded
```

All of it is one JSON object in `localStorage` under `intelligrade.data`, versioned by
`schemaVersion` and upgraded by `migrate()` in `persistence.ts`.

### Grade scales (`src/domain/grade-scale/`)

Every calculation goes through the **`GradeScale`** interface, so the app is grade-system
agnostic. A scale defines its range, pass threshold, direction (`higherIsBetter`), how to turn
points into a grade, how to colour and format a value, and validation. Five scales ship
today — **Switzerland (1–6)**, **Germany (1–6, lower is better)**, **Austria (1–5, lower is
better)**, **France (0–20)**, **Italy (0–10)** — registered in `grade-scale/index.ts`. Each
semester stores which scale it uses.

> Adding a country = one new file implementing `GradeScale` + a line in the registry. Nothing
> else needs to change, because every consumer respects `higherIsBetter`.

### How “what grade do I need” works

Scoring the same grade `x` on `N` exams of weight `w` is equivalent to one result of weight
`N·w`, so `gradeNeededPerExam` reduces to the single-grade formula. All planning is pure and
direction-aware, and the same numbers feed the on-screen meter. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the formulas.

---

## Testing & quality gate

The **grade maths is the product**, so it's covered by unit tests (Vitest). UI components are
not unit-tested by convention — they're verified by build + browser smoke.

Before committing anything that touches TypeScript, the gate is:

```bash
npx tsc -b && npm test && npm run build
```

All three must be clean. At time of writing: **117 tests passing**.

---

## Conventions

- **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `style:`, `docs:` …).
- Keep domain logic pure and tested; keep colour/format decisions inside `GradeScale`.
- Follow the design system in `src/index.css` and `docs/ARCHITECTURE.md` — violet is for
  *you & your goals*; emerald/amber/rose mean grade quality (pass / near / fail).
- Small, reviewable commits.

---

## Status

The rebuild is complete: **sub-projects 0–6 are all shipped** (foundation, core calculators,
scenario engine, exam planner + alerts, multi-country grading, analytics + recommendations,
and PDF/Excel export), followed by a full UI/UX redesign. Design specs and implementation
plans live in `docs/superpowers/`.

## Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — deep dive: layers, data flow, the grade
  maths, the design system, and how to extend the app.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

Questions or feedback: open an issue on GitHub.

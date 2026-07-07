# IntelliGrade — Professional PDF/Excel Export with Live Previews (Sub-project 6) Design

**Date:** 2026-07-07
**Status:** Approved (design) — decisions delegated to Claude; proceeding autonomously
**Author:** Olivier Lüthy + Claude

---

## Context

SP0–SP5 are merged. SP6 lets a student export a professional report of the active semester
(subjects, grades, averages, target status, key stats) as **PDF** or **Excel**, with a
**live in-app preview** that mirrors the output before download.

## Decisions (locked)

- **One pure report model, three renderers.** A pure `buildSemesterReport(semester)` produces
  a serializable `SemesterReport` (numbers + pre-formatted text via `scale.format`). The live
  preview (HTML), the PDF renderer, and the Excel renderer all consume the *same* model, so
  they can't drift. The model is TDD-tested; the renderers are thin adapters verified by
  browser smoke (they touch the DOM / file system, so no unit tests — SP0–SP5 convention).
- **Libraries:** `jspdf` + `jspdf-autotable` (PDF), `xlsx`/SheetJS (Excel). Chosen for zero
  server dependency (fully client-side) and battle-tested table output.
- **Scope = active semester** (mirrors Insights). "All semesters" is out of scope.
- **Date handling stays out of the pure model.** Adapters/preview stamp "generated on" using
  the browser clock; the model itself is deterministic and date-free (keeps it testable).

## Module 1 — `src/domain/export/report.ts` (pure, TDD)

```ts
export type ReportGradeRow = { label: string; valueText: string; weight: number };
export type ReportSubjectRow = {
  name: string;
  averageText: string;      // "—" when no grades
  targetText: string;       // "—" when unset
  status: string;           // "Pass" | "Fail" | "—"
  gradeCount: number;
  grades: ReportGradeRow[];
};
export type SemesterReport = {
  title: string;            // "IntelliGrade — <semester>"
  semesterName: string;
  scaleLabel: string;
  summary: {
    averageText: string;    // semester mean, "—" when none
    passingText: string;    // "2 / 3"
    subjectCount: number;
  };
  subjects: ReportSubjectRow[];
};

export function buildSemesterReport(semester: Semester): SemesterReport;
```

Uses `getScale`, `computeSemesterStats`, and `scale.format`/`isPassing`. Grade rows use the
grade's `label ?? "Grade N"`. "Pass"/"Fail" from `SubjectStats.passing` (null → "—").

## Module 2 — Renderers (adapters, browser-only)

- **`src/features/export/pdf.ts`** — `exportSemesterPdf(report)`: jsPDF A4 portrait; title +
  scale + "Generated <date>"; a summary line; one `autoTable` of subjects
  (Subject / Average / Target / Status / #Grades); saves as `<semester>-report.pdf`.
- **`src/features/export/excel.ts`** — `exportSemesterXlsx(report)`: a "Summary" sheet
  (title, scale, semester average, passing) + a "Subjects" sheet (same columns as PDF).
  `XLSX.writeFile` saves `<semester>-report.xlsx`.
- Both take the pure `SemesterReport` and are the only files importing the heavy libs (kept
  out of the domain layer).

## Module 3 — UI

- **Nav:** add an `"export"` view; sidebar `Download` icon button labelled "Export"
  (after Insights).
- **`src/features/export/ReportPreview.tsx`** — renders `SemesterReport` as styled HTML
  (title, scale caption, summary chips, subject table). This IS the live preview.
- **`src/features/export/ExportView.tsx`** (reads active semester from store):
  - Format toggle: **PDF | Excel** (segmented control, accessible radio group).
  - Live `ReportPreview`.
  - **Download** button → calls the matching adapter with the current report.
  - Empty state when no active semester / no subjects.

## Verification gate

`npx tsc -b` clean · `npm test` green · `npm run build` succeeds · Playwright smoke: open
Export, preview shows the active semester; clicking Download with PDF yields a `%PDF` file and
with Excel yields a `PK`-zip `.xlsx` (verified via Playwright download bytes).

## Success criteria

1. `buildSemesterReport` correct & deterministic for both scale directions (TDD).
2. PDF and Excel download real, valid files rendered from the shared model.
3. Live preview matches the exported content; format toggle switches the download type.
4. Gate green; export libs confined to `features/export/*`; graceful empty states.

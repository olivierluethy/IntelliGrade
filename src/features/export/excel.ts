import * as XLSX from "xlsx";
import type { SemesterReport } from "../../domain/export/report";

function fileName(report: SemesterReport): string {
  const safe = report.semesterName.replace(/[^\w.-]+/g, "_") || "semester";
  return `${safe}-report.xlsx`;
}

/** Render a semester report to a downloadable .xlsx workbook (client-side, SheetJS). */
export function exportSemesterXlsx(report: SemesterReport): void {
  const wb = XLSX.utils.book_new();

  const summary = XLSX.utils.aoa_to_sheet([
    [report.title],
    [],
    ["Scale", report.scaleLabel],
    ["Semester average", report.summary.averageText],
    ["Passing subjects", report.summary.passingText],
    ["Total subjects", report.summary.subjectCount],
    ["Generated", new Date().toLocaleDateString()],
  ]);
  summary["!cols"] = [{ wch: 18 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, summary, "Summary");

  const subjects = XLSX.utils.aoa_to_sheet([
    ["Subject", "Average", "Target", "Status", "Grades"],
    ...report.subjects.map((s) => [
      s.name,
      s.averageText,
      s.targetText,
      s.status,
      s.gradeCount,
    ]),
  ]);
  subjects["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, subjects, "Subjects");

  XLSX.writeFile(wb, fileName(report));
}

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SemesterReport } from "../../domain/export/report";

function fileName(report: SemesterReport): string {
  const safe = report.semesterName.replace(/[^\w.-]+/g, "_") || "semester";
  return `${safe}-report.pdf`;
}

/** Render a semester report to a downloadable PDF (client-side, jsPDF). */
export function exportSemesterPdf(report: SemesterReport): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;

  doc.setFontSize(18);
  doc.text(report.title, margin, 50);

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Scale: ${report.scaleLabel}`, margin, 68);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, 82);
  doc.text(
    `Semester average: ${report.summary.averageText}    Passing: ${report.summary.passingText}`,
    margin,
    98
  );
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 116,
    margin: { left: margin, right: margin },
    head: [["Subject", "Average", "Target", "Status", "Grades"]],
    body: report.subjects.map((s) => [
      s.name,
      s.averageText,
      s.targetText,
      s.status,
      String(s.gradeCount),
    ]),
    headStyles: { fillColor: [79, 70, 229] }, // indigo-600
    styles: { fontSize: 10, cellPadding: 6 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
  });

  doc.save(fileName(report));
}

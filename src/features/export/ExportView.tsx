import { useState } from "react";
import { useStore } from "../../store/useStore";
import { buildSemesterReport } from "../../domain/export/report";
import { ReportPreview } from "./ReportPreview";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Download, FileText, FileSpreadsheet } from "../../components/Icon";

type Format = "pdf" | "excel";

type Props = { semesterId: string | null };

export function ExportView({ semesterId }: Props) {
  const semester = useStore((s) =>
    s.data.semesters.find((x) => x.id === semesterId)
  );
  const [format, setFormat] = useState<Format>("pdf");

  if (!semester) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Header />
        <Card>
          <p className="text-sm text-slate-500">
            Create a semester to export a report.
          </p>
        </Card>
      </div>
    );
  }

  const report = buildSemesterReport(semester);
  const [busy, setBusy] = useState(false);

  // The PDF/Excel libraries are heavy, so they are code-split and loaded on demand.
  const download = async () => {
    setBusy(true);
    try {
      if (format === "pdf") {
        const { exportSemesterPdf } = await import("./pdf");
        exportSemesterPdf(report);
      } else {
        const { exportSemesterXlsx } = await import("./excel");
        exportSemesterXlsx(report);
      }
    } finally {
      setBusy(false);
    }
  };

  const seg = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400/60 ${
      active ? "bg-indigo-500 text-white" : "text-slate-300 hover:bg-slate-800"
    }`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Header semesterName={semester.name} />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="radiogroup"
            aria-label="Export format"
            className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={format === "pdf"}
              className={seg(format === "pdf")}
              onClick={() => setFormat("pdf")}
            >
              <FileText size={16} /> PDF
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={format === "excel"}
              className={seg(format === "excel")}
              onClick={() => setFormat("excel")}
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
          </div>
          <Button
            onClick={download}
            disabled={busy || report.subjects.length === 0}
          >
            <Download size={16} />{" "}
            {busy ? "Preparing…" : `Download ${format === "pdf" ? "PDF" : "Excel"}`}
          </Button>
        </div>
        {report.subjects.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">
            Add subjects to {semester.name} to generate a report.
          </p>
        )}
      </Card>

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-400">Live preview</h3>
        <ReportPreview report={report} />
      </div>
    </div>
  );
}

function Header({ semesterName }: { semesterName?: string }) {
  return (
    <header>
      <h2 className="text-2xl font-semibold tracking-tight">Export</h2>
      <p className="text-sm text-slate-400">
        {semesterName
          ? `Download a professional report of ${semesterName} as PDF or Excel.`
          : "Download a professional report as PDF or Excel."}
      </p>
    </header>
  );
}

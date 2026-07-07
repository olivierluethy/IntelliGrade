import { useState } from "react";
import { useStore } from "../../store/useStore";
import { buildSemesterReport } from "../../domain/export/report";
import { ReportPreview } from "./ReportPreview";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { SectionHeader } from "../../components/SectionHeader";
import { EmptyState } from "../../components/EmptyState";
import { Download, FileText, FileSpreadsheet } from "../../components/Icon";

type Format = "pdf" | "excel";

type Props = { semesterId: string | null };

export function ExportView({ semesterId }: Props) {
  const semester = useStore((s) =>
    s.data.semesters.find((x) => x.id === semesterId)
  );
  const [format, setFormat] = useState<Format>("pdf");
  const [busy, setBusy] = useState(false);

  if (!semester) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={Download}
          title="No semester to export"
          description="Create a semester and add some grades, then come back to download a clean report."
        />
      </div>
    );
  }

  const report = buildSemesterReport(semester);
  const empty = report.subjects.length === 0;

  // Export libraries are heavy, so they're code-split and loaded on demand.
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
    `flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
      active ? "bg-brand text-white" : "text-muted hover:bg-line/60"
    }`;

  return (
    <div className="space-y-6">
      <Header semesterName={semester.name} />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Controls */}
        <Card className="h-fit">
          <SectionHeader
            icon={Download}
            title="Download a report"
            hint="A clean summary of this semester — share it or keep it for your records."
          />
          <div
            role="radiogroup"
            aria-label="Export format"
            className="flex rounded-xl border border-line bg-surface-2 p-1"
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

          <ul className="mt-4 space-y-1.5 text-xs text-faint">
            <li>· Semester average & pass count</li>
            <li>· Every subject: average, target, status</li>
            <li>
              · {format === "pdf" ? "One-page printable PDF" : "Summary + subjects sheets"}
            </li>
          </ul>

          <Button
            onClick={download}
            disabled={busy || empty}
            className="mt-4 w-full"
          >
            <Download size={16} />{" "}
            {busy ? "Preparing…" : `Download ${format === "pdf" ? "PDF" : "Excel"}`}
          </Button>
          {empty && (
            <p className="mt-2 text-center text-xs text-faint">
              Add subjects to {semester.name} to generate a report.
            </p>
          )}
        </Card>

        {/* Live preview */}
        <div>
          <div className="mb-2 eyebrow">Live preview — exactly what you'll get</div>
          <ReportPreview report={report} />
        </div>
      </div>
    </div>
  );
}

function Header({ semesterName }: { semesterName?: string }) {
  return (
    <header>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Export</h1>
      <p className="mt-1 text-sm text-muted">
        {semesterName
          ? `Download ${semesterName} as a polished PDF or Excel report.`
          : "Download a polished PDF or Excel report."}
      </p>
    </header>
  );
}

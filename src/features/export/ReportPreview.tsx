import type { SemesterReport } from "../../domain/export/report";

const statusClass: Record<string, string> = {
  Pass: "text-pass",
  Fail: "text-fail",
};

/** Dark-themed in-app preview of the report the PDF/Excel will contain. */
export function ReportPreview({ report }: { report: SemesterReport }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line bg-surface-2 px-5 py-4">
        <h2 className="font-display text-xl font-semibold text-fg">{report.title}</h2>
        <p className="mt-0.5 text-sm text-faint">Scale: {report.scaleLabel}</p>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-line px-5 py-3 text-sm">
        <Summary label="Semester average" value={report.summary.averageText} />
        <Summary label="Passing" value={report.summary.passingText} />
        <Summary label="Subjects" value={String(report.summary.subjectCount)} />
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-faint">
            <th className="px-5 py-2.5 eyebrow">Subject</th>
            <th className="px-5 py-2.5 eyebrow">Average</th>
            <th className="px-5 py-2.5 eyebrow">Target</th>
            <th className="px-5 py-2.5 eyebrow">Status</th>
            <th className="px-5 py-2.5 eyebrow">Grades</th>
          </tr>
        </thead>
        <tbody>
          {report.subjects.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-6 text-center text-faint">
                No subjects yet.
              </td>
            </tr>
          ) : (
            report.subjects.map((s, i) => (
              <tr
                key={s.name + i}
                className="border-b border-line-soft last:border-0"
              >
                <td className="px-5 py-2.5 font-medium text-fg">{s.name}</td>
                <td className="px-5 py-2.5 font-readout tabular-nums text-fg">
                  {s.averageText}
                </td>
                <td className="px-5 py-2.5 tabular-nums text-muted">{s.targetText}</td>
                <td
                  className={`px-5 py-2.5 font-medium ${statusClass[s.status] ?? "text-faint"}`}
                >
                  {s.status}
                </td>
                <td className="px-5 py-2.5 tabular-nums text-muted">{s.gradeCount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-faint">{label}: </span>
      <span className="font-readout font-semibold tabular-nums text-fg">{value}</span>
    </div>
  );
}

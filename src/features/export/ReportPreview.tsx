import type { SemesterReport } from "../../domain/export/report";

/** WYSIWYG-ish HTML preview of the report that PDF/Excel will contain. */
export function ReportPreview({ report }: { report: SemesterReport }) {
  return (
    <div className="rounded-lg bg-white p-6 text-slate-900 shadow-inner">
      <h1 className="text-xl font-bold">{report.title}</h1>
      <p className="mt-1 text-sm text-slate-500">Scale: {report.scaleLabel}</p>

      <div className="mt-4 flex flex-wrap gap-6 border-y border-slate-200 py-3 text-sm">
        <div>
          <span className="text-slate-500">Semester average: </span>
          <span className="font-semibold tabular-nums">
            {report.summary.averageText}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Passing: </span>
          <span className="font-semibold tabular-nums">
            {report.summary.passingText}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Subjects: </span>
          <span className="font-semibold tabular-nums">
            {report.summary.subjectCount}
          </span>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-indigo-600 text-left text-white">
            <th className="px-3 py-2 font-semibold">Subject</th>
            <th className="px-3 py-2 font-semibold">Average</th>
            <th className="px-3 py-2 font-semibold">Target</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2 font-semibold">Grades</th>
          </tr>
        </thead>
        <tbody>
          {report.subjects.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-3 text-center text-slate-400">
                No subjects.
              </td>
            </tr>
          ) : (
            report.subjects.map((s, i) => (
              <tr
                key={s.name + i}
                className={i % 2 ? "bg-slate-50" : "bg-white"}
              >
                <td className="px-3 py-2">{s.name}</td>
                <td className="px-3 py-2 tabular-nums">{s.averageText}</td>
                <td className="px-3 py-2 tabular-nums">{s.targetText}</td>
                <td
                  className={`px-3 py-2 font-medium ${
                    s.status === "Pass"
                      ? "text-emerald-600"
                      : s.status === "Fail"
                        ? "text-rose-600"
                        : "text-slate-400"
                  }`}
                >
                  {s.status}
                </td>
                <td className="px-3 py-2 tabular-nums">{s.gradeCount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

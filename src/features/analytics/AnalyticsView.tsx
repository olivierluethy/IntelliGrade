import { useStore } from "../../store/useStore";
import { getScale } from "../../domain/grade-scale";
import { computeSemesterStats } from "../../domain/analytics";
import type { SubjectStats, Trend } from "../../domain/analytics";
import { computeRecommendations } from "../../domain/recommendations";
import type { Recommendation, Severity } from "../../domain/recommendations";
import { SubjectBars } from "./SubjectBars";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Lightbulb,
} from "../../components/Icon";

type Props = {
  semesterId: string | null;
  onOpenSubject: (semesterId: string, subjectId: string) => void;
};

const trendGlyph: Record<Trend, JSX.Element> = {
  up: <TrendingUp size={16} className="text-emerald-400" />,
  down: <TrendingDown size={16} className="text-rose-400" />,
  flat: <Minus size={16} className="text-slate-500" />,
  na: <span className="text-slate-600">—</span>,
};

const sevChip: Record<Severity, string> = {
  high: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low: "bg-slate-700/40 text-slate-300 border-slate-700",
};

export function AnalyticsView({ semesterId, onOpenSubject }: Props) {
  const semester = useStore((s) =>
    s.data.semesters.find((x) => x.id === semesterId)
  );

  if (!semester) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Header />
        <Card>
          <p className="text-sm text-slate-500">
            Create a semester to see analytics.
          </p>
        </Card>
      </div>
    );
  }

  const scale = getScale(semester.scaleId);
  const stats = computeSemesterStats(semester);
  const recs = computeRecommendations(semester);

  if (stats.subjectCount === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Header semesterName={semester.name} />
        <Card>
          <p className="text-sm text-slate-500">
            Add subjects and grades to {semester.name} to unlock analytics.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Header semesterName={semester.name} />

      {/* Summary */}
      <Card>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Stat label="Average">
            {stats.average === null ? (
              <Badge className="text-slate-400">—</Badge>
            ) : (
              <Badge className={scale.colorFor(stats.average)}>
                {scale.format(stats.average)}
              </Badge>
            )}
          </Stat>
          <Stat label="Passing">
            <span className="text-sm font-semibold tabular-nums text-slate-200">
              {stats.passingCount}/{stats.gradedSubjectCount}
            </span>
          </Stat>
          <Stat label="Best">
            <span className="text-sm text-emerald-300">
              {stats.bestSubject?.name ?? "—"}
            </span>
          </Stat>
          <Stat label="Needs work">
            <span className="text-sm text-rose-300">
              {stats.worstSubject?.name ?? "—"}
            </span>
          </Stat>
        </div>
      </Card>

      {/* Chart */}
      {stats.gradedSubjectCount > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-medium text-slate-300">
            Subject averages
          </h3>
          <SubjectBars subjects={stats.subjects} scale={scale} />
        </Card>
      )}

      {/* Table */}
      <Card>
        <h3 className="mb-2 text-sm font-medium text-slate-300">Subjects</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-1.5 font-medium">Subject</th>
              <th className="py-1.5 font-medium">Avg</th>
              <th className="py-1.5 text-center font-medium">Trend</th>
              <th className="py-1.5 font-medium">Target</th>
              <th className="py-1.5" />
            </tr>
          </thead>
          <tbody>
            {stats.subjects.map((s) => (
              <SubjectRow
                key={s.subjectId}
                s={s}
                scaleFormat={scale.format}
                scaleColor={scale.colorFor}
                onClick={() => onOpenSubject(semester.id, s.subjectId)}
              />
            ))}
          </tbody>
        </table>
      </Card>

      {/* Recommendations */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-400" />
          <h3 className="text-sm font-medium text-slate-300">Recommendations</h3>
        </div>
        {recs.length === 0 ? (
          <p className="text-sm text-slate-500">
            No recommendations — everything looks healthy.
          </p>
        ) : (
          <ul className="space-y-2">
            {recs.map((r) => (
              <RecRow
                key={r.id}
                r={r}
                onClick={() => onOpenSubject(semester.id, r.subjectId)}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Header({ semesterName }: { semesterName?: string }) {
  return (
    <header>
      <h2 className="text-2xl font-semibold tracking-tight">Insights</h2>
      <p className="text-sm text-slate-400">
        {semesterName
          ? `Analytics and recommendations for ${semesterName}.`
          : "Analytics and recommendations for the active semester."}
      </p>
    </header>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      {children}
    </div>
  );
}

function SubjectRow({
  s,
  scaleFormat,
  scaleColor,
  onClick,
}: {
  s: SubjectStats;
  scaleFormat: (v: number) => string;
  scaleColor: (v: number) => string;
  onClick: () => void;
}) {
  return (
    <tr
      className="cursor-pointer border-t border-slate-800/60 hover:bg-slate-800/40"
      onClick={onClick}
    >
      <td className="py-2 text-slate-200">{s.name}</td>
      <td className="py-2">
        {s.average === null ? (
          <span className="text-slate-600">—</span>
        ) : (
          <span className={`font-semibold tabular-nums ${scaleColor(s.average)}`}>
            {scaleFormat(s.average)}
          </span>
        )}
      </td>
      <td className="py-2 text-center">
        <span className="inline-flex justify-center">{trendGlyph[s.trend]}</span>
      </td>
      <td className="py-2 tabular-nums text-slate-400">
        {s.target === undefined ? (
          "—"
        ) : (
          <>
            {scaleFormat(s.target)}
            {s.distanceToTarget !== null && (
              <span
                className={
                  s.distanceToTarget >= 0 ? "text-emerald-400" : "text-rose-400"
                }
              >
                {" "}
                ({s.distanceToTarget >= 0 ? "+" : ""}
                {s.distanceToTarget.toFixed(2)})
              </span>
            )}
          </>
        )}
      </td>
      <td className="py-2 text-right">
        <ChevronRight size={14} className="text-slate-600" />
      </td>
    </tr>
  );
}

function RecRow({ r, onClick }: { r: Recommendation; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
      >
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${sevChip[r.severity]}`}
        >
          {r.severity}
        </span>
        <span className="min-w-0 flex-1 text-slate-200">{r.text}</span>
        <ChevronRight size={16} className="shrink-0 text-slate-600" />
      </button>
    </li>
  );
}

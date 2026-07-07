import { useStore } from "../../store/useStore";
import { getScale } from "../../domain/grade-scale";
import { computeSemesterStats } from "../../domain/analytics";
import type { SubjectStats, Trend } from "../../domain/analytics";
import { computeRecommendations } from "../../domain/recommendations";
import type { Recommendation, Severity } from "../../domain/recommendations";
import { SubjectBars } from "./SubjectBars";
import { Card } from "../../components/Card";
import { StatTile } from "../../components/StatTile";
import { SectionHeader } from "../../components/SectionHeader";
import { EmptyState } from "../../components/EmptyState";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Lightbulb,
  BarChart3,
  ListChecks,
  CheckCircle2,
} from "../../components/Icon";

type Props = {
  semesterId: string | null;
  onOpenSubject: (semesterId: string, subjectId: string) => void;
};

const trendGlyph: Record<Trend, JSX.Element> = {
  up: <TrendingUp size={16} className="text-pass" />,
  down: <TrendingDown size={16} className="text-fail" />,
  flat: <Minus size={16} className="text-faint" />,
  na: <span className="text-faint">—</span>,
};

const sevChip: Record<Severity, string> = {
  high: "border-fail/30 bg-fail/10 text-fail",
  medium: "border-warn/30 bg-warn/10 text-warn",
  low: "border-line bg-surface-2 text-muted",
};

export function AnalyticsView({ semesterId, onOpenSubject }: Props) {
  const semester = useStore((s) =>
    s.data.semesters.find((x) => x.id === semesterId)
  );

  if (!semester) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={BarChart3}
          title="No semester yet"
          description="Create a semester and add a few grades to unlock trends, comparisons, and recommendations."
        />
      </div>
    );
  }

  const scale = getScale(semester.scaleId);
  const stats = computeSemesterStats(semester);
  const recs = computeRecommendations(semester);

  if (stats.subjectCount === 0) {
    return (
      <div className="space-y-6">
        <Header semesterName={semester.name} />
        <EmptyState
          icon={BarChart3}
          title="Nothing to analyse yet"
          description={`Add subjects and grades to ${semester.name}, and this page fills with trends and advice.`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header semesterName={semester.name} />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Average"
          value={
            <span className={stats.average === null ? "text-faint" : scale.colorFor(stats.average)}>
              {stats.average === null ? "—" : scale.format(stats.average)}
            </span>
          }
          sub="across graded subjects"
        />
        <StatTile
          label="Passing"
          value={
            <span>
              {stats.passingCount}
              <span className="text-faint">/{stats.gradedSubjectCount}</span>
            </span>
          }
          sub="subjects on track"
        />
        <StatTile
          label="Best"
          value={<span className="text-pass">{stats.bestSubject?.name ?? "—"}</span>}
        />
        <StatTile
          label="Needs work"
          value={<span className="text-fail">{stats.worstSubject?.name ?? "—"}</span>}
        />
      </div>

      {/* Chart + recommendations */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <SectionHeader
            icon={BarChart3}
            title="Subject averages"
            hint="Each bar is a subject average on the grade scale; the violet tick marks its target."
          />
          {stats.gradedSubjectCount > 0 ? (
            <SubjectBars subjects={stats.subjects} scale={scale} />
          ) : (
            <p className="text-sm text-faint">Add grades to see the chart.</p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeader
            icon={Lightbulb}
            title="Recommendations"
            hint="What to focus on next, ranked by urgency."
          />
          {recs.length === 0 ? (
            <EmptyState
              compact
              icon={CheckCircle2}
              title="All healthy"
              description="No action needed right now — keep it up."
            />
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

      {/* Subjects table */}
      <Card>
        <SectionHeader
          icon={ListChecks}
          title="All subjects"
          hint="Click a row to open the subject."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-3 pb-2 eyebrow">Subject</th>
                <th className="px-3 pb-2 eyebrow">Average</th>
                <th className="px-3 pb-2 text-center eyebrow">Trend</th>
                <th className="px-3 pb-2 eyebrow">Target</th>
                <th className="px-3 pb-2" />
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
        </div>
      </Card>
    </div>
  );
}

function Header({ semesterName }: { semesterName?: string }) {
  return (
    <header>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Insights</h1>
      <p className="mt-1 text-sm text-muted">
        {semesterName
          ? `How ${semesterName} is going — at a glance.`
          : "Trends and recommendations for the active semester."}
      </p>
    </header>
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
      className="cursor-pointer border-b border-line-soft last:border-0 hover:bg-surface-2/50"
      onClick={onClick}
    >
      <td className="px-3 py-2.5 font-medium text-fg">{s.name}</td>
      <td className="px-3 py-2.5">
        {s.average === null ? (
          <span className="text-faint">—</span>
        ) : (
          <span className={`font-readout font-semibold ${scaleColor(s.average)}`}>
            {scaleFormat(s.average)}
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 text-center">
        <span className="inline-flex justify-center">{trendGlyph[s.trend]}</span>
      </td>
      <td className="px-3 py-2.5 tabular-nums text-muted">
        {s.target === undefined ? (
          <span className="text-faint">—</span>
        ) : (
          <>
            {scaleFormat(s.target)}
            {s.distanceToTarget !== null && (
              <span className={s.distanceToTarget >= 0 ? "text-pass" : "text-fail"}>
                {" "}
                ({s.distanceToTarget >= 0 ? "+" : ""}
                {s.distanceToTarget.toFixed(2)})
              </span>
            )}
          </>
        )}
      </td>
      <td className="px-3 py-2.5 text-right">
        <ChevronRight size={14} className="text-faint" />
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
        className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-line/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
      >
        <span
          className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold capitalize ${sevChip[r.severity]}`}
        >
          {r.severity}
        </span>
        <span className="min-w-0 flex-1 text-fg">{r.text}</span>
        <ChevronRight size={16} className="mt-0.5 shrink-0 text-faint" />
      </button>
    </li>
  );
}

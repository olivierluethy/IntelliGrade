import type { Alert } from "../../domain/alerts";
import { EmptyState } from "../../components/EmptyState";
import {
  AlertTriangle,
  CalendarClock,
  TrendingDown,
  FileWarning,
  ChevronRight,
  CheckCircle2,
} from "../../components/Icon";

type Props = {
  alerts: Alert[];
  onOpenSubject: (semesterId: string, subjectId: string) => void;
};

function describe(alert: Alert): { icon: JSX.Element; text: string; tone: string } {
  switch (alert.kind) {
    case "exam-soon":
      return {
        icon: <CalendarClock size={18} className="text-warn" />,
        tone: "warn",
        text: `${alert.subjectName}: "${alert.examName}" ${
          alert.daysUntil === 0 ? "is today" : `in ${alert.daysUntil} day(s)`
        } (${alert.date})`,
      };
    case "exam-ungraded":
      return {
        icon: <AlertTriangle size={18} className="text-fail" />,
        tone: "fail",
        text: `${alert.subjectName}: "${alert.examName}" was ${alert.daysAgo} day(s) ago — record your grade`,
      };
    case "below-target":
      return {
        icon: <TrendingDown size={18} className="text-fail" />,
        tone: "fail",
        text: `${alert.subjectName} is below target (${alert.average.toFixed(2)} / ${alert.target.toFixed(2)})`,
      };
    case "no-grades":
      return {
        icon: <FileWarning size={18} className="text-faint" />,
        tone: "muted",
        text: `${alert.subjectName} has no grades yet`,
      };
  }
}

export function AlertsView({ alerts, onOpenSubject }: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Alerts</h1>
        <p className="mt-1 text-sm text-muted">
          {alerts.length > 0
            ? `${alerts.length} thing${alerts.length > 1 ? "s" : ""} across your subjects need a look.`
            : "Everything that needs your attention shows up here."}
        </p>
      </header>

      {alerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="You're all caught up"
          description="No deadlines slipping, no missing grades, nothing below target. Add exams and targets to your subjects and we'll flag anything that needs attention."
        />
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert, i) => {
            const { icon, text } = describe(alert);
            return (
              <li key={`${alert.kind}-${alert.subjectId}-${i}`}>
                <button
                  type="button"
                  onClick={() => onOpenSubject(alert.semesterId, alert.subjectId)}
                  className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                >
                  <span className="shrink-0">{icon}</span>
                  <span className="min-w-0 flex-1 text-fg">{text}</span>
                  <ChevronRight size={16} className="shrink-0 text-faint" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

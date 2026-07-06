import type { Alert } from "../../domain/alerts";
import { Card } from "../../components/Card";
import { AlertTriangle, CalendarClock, TrendingDown, FileWarning, ChevronRight } from "../../components/Icon";

type Props = {
  alerts: Alert[];
  onOpenSubject: (semesterId: string, subjectId: string) => void;
};

function describe(alert: Alert): { icon: JSX.Element; text: string } {
  switch (alert.kind) {
    case "exam-soon":
      return {
        icon: <CalendarClock size={16} className="text-amber-400" />,
        text: `${alert.subjectName}: "${alert.examName}" ${
          alert.daysUntil === 0 ? "is today" : `in ${alert.daysUntil} day(s)`
        } (${alert.date})`,
      };
    case "exam-ungraded":
      return {
        icon: <AlertTriangle size={16} className="text-rose-400" />,
        text: `${alert.subjectName}: "${alert.examName}" was ${alert.daysAgo} day(s) ago — record your grade`,
      };
    case "below-target":
      return {
        icon: <TrendingDown size={16} className="text-rose-400" />,
        text: `${alert.subjectName} is below target (${alert.average.toFixed(2)} / ${alert.target.toFixed(2)})`,
      };
    case "no-grades":
      return {
        icon: <FileWarning size={16} className="text-slate-400" />,
        text: `${alert.subjectName} has no grades yet`,
      };
  }
}

export function AlertsView({ alerts, onOpenSubject }: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">Alerts</h2>
        <p className="text-sm text-slate-400">
          Everything that needs your attention, across all subjects.
        </p>
      </header>

      {alerts.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            Nothing needs attention — you're all caught up.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert, i) => {
            const { icon, text } = describe(alert);
            return (
              <li key={`${alert.kind}-${alert.subjectId}-${i}`}>
                <button
                  type="button"
                  onClick={() => onOpenSubject(alert.semesterId, alert.subjectId)}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                >
                  {icon}
                  <span className="min-w-0 flex-1">{text}</span>
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

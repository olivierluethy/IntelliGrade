import { useState } from "react";
import { Sidebar } from "./features/Sidebar";
import { SubjectDetail } from "./features/SubjectDetail";
import { ToolsPage } from "./features/tools/ToolsPage";
import { AnalyticsView } from "./features/analytics/AnalyticsView";
import { AlertsView } from "./features/alerts/AlertsView";
import { useStore } from "./store/useStore";
import { computeAlerts } from "./domain/alerts";

export default function App() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
  const [view, setView] = useState<
    "grades" | "tools" | "insights" | "alerts"
  >("grades");
  const data = useStore((s) => s.data);
  const setActiveSemester = useStore((s) => s.setActiveSemester);
  const activeSemesterId = data.activeSemesterId;
  const activeSemester = data.semesters.find((s) => s.id === activeSemesterId);
  const effectiveSubjectId =
    selectedSubjectId !== null &&
    activeSemester?.subjects.some((sub) => sub.id === selectedSubjectId)
      ? selectedSubjectId
      : null;

  const alerts = computeAlerts(data.semesters, new Date());

  const openSubject = (semesterId: string, subjectId: string) => {
    setActiveSemester(semesterId);
    setSelectedSubjectId(subjectId);
    setView("grades");
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        selectedSubjectId={effectiveSubjectId}
        onSelectSubject={setSelectedSubjectId}
        view={view}
        onChangeView={setView}
        alertCount={alerts.length}
      />
      <main className="flex-1 p-6">
        {view === "alerts" ? (
          <AlertsView alerts={alerts} onOpenSubject={openSubject} />
        ) : view === "insights" ? (
          <AnalyticsView
            semesterId={activeSemesterId ?? null}
            onOpenSubject={openSubject}
          />
        ) : view === "tools" ? (
          <ToolsPage
            semesterId={activeSemesterId ?? null}
            subjectId={effectiveSubjectId}
          />
        ) : effectiveSubjectId && activeSemesterId ? (
          <SubjectDetail
            semesterId={activeSemesterId}
            subjectId={effectiveSubjectId}
          />
        ) : (
          <div className="grid h-full place-items-center text-center">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Welcome to IntelliGrade</h2>
              <p className="text-slate-400">
                Create a semester, add a subject, and start tracking grades.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

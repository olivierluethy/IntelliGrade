import { useState } from "react";
import { Sidebar } from "./features/Sidebar";
import { SubjectDetail } from "./features/SubjectDetail";
import { ToolsPage } from "./features/tools/ToolsPage";
import { AnalyticsView } from "./features/analytics/AnalyticsView";
import { ExportView } from "./features/export/ExportView";
import { AlertsView } from "./features/alerts/AlertsView";
import { EmptyState } from "./components/EmptyState";
import { useStore } from "./store/useStore";
import { computeAlerts } from "./domain/alerts";
import { GraduationCap } from "./components/Icon";

export default function App() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
  const [view, setView] = useState<
    "grades" | "tools" | "insights" | "export" | "alerts"
  >("grades");
  const semesters = useStore((s) => s.data.semesters);
  const activeSemesterId = useStore((s) => s.data.activeSemesterId);
  const setActiveSemester = useStore((s) => s.setActiveSemester);
  const activeSemester = semesters.find((s) => s.id === activeSemesterId);
  const effectiveSubjectId =
    selectedSubjectId !== null &&
    activeSemester?.subjects.some((sub) => sub.id === selectedSubjectId)
      ? selectedSubjectId
      : null;

  const alerts = computeAlerts(semesters, new Date());

  const openSubject = (semesterId: string, subjectId: string) => {
    setActiveSemester(semesterId);
    setSelectedSubjectId(subjectId);
    setView("grades");
  };

  return (
    <div className="app-bg flex min-h-screen flex-col md:flex-row">
      <Sidebar
        selectedSubjectId={effectiveSubjectId}
        onSelectSubject={setSelectedSubjectId}
        view={view}
        onChangeView={setView}
        alertCount={alerts.length}
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1400px] px-5 py-6 md:px-8 md:py-8">
          {view === "alerts" ? (
            <AlertsView alerts={alerts} onOpenSubject={openSubject} />
          ) : view === "insights" ? (
            <AnalyticsView
              semesterId={activeSemesterId ?? null}
              onOpenSubject={openSubject}
            />
          ) : view === "export" ? (
            <ExportView semesterId={activeSemesterId ?? null} />
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
            <EmptyState
              icon={GraduationCap}
              title={
                activeSemester
                  ? "Pick a subject to get started"
                  : "Welcome to IntelliGrade"
              }
              description={
                activeSemester
                  ? "Choose a subject on the left, or add one, to track grades and plan toward a target."
                  : "Create a semester on the left, add a subject, and start tracking grades and planning ahead."
              }
            />
          )}
        </div>
      </main>
    </div>
  );
}

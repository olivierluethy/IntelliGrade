import { SemesterSwitcher } from "./SemesterSwitcher";
import { SubjectList } from "./SubjectList";
import { GraduationCap, BookOpen, Wrench, Bell } from "../components/Icon";

type View = "grades" | "tools" | "alerts";

type Props = {
  selectedSubjectId: string | null;
  onSelectSubject: (id: string) => void;
  view: View;
  onChangeView: (view: View) => void;
  alertCount: number;
};

export function Sidebar({
  selectedSubjectId,
  onSelectSubject,
  view,
  onChangeView,
  alertCount,
}: Props) {
  const navBtn = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400/60 ${
      active ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
    }`;

  return (
    <aside className="flex w-full flex-col gap-6 border-b border-slate-800 bg-slate-900/40 p-4 md:h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2">
        <GraduationCap className="text-indigo-400" size={22} />
        <span className="text-lg font-semibold tracking-tight">
          IntelliGrade
        </span>
      </div>
      <nav className="flex gap-2" aria-label="Primary">
        <button
          type="button"
          className={navBtn(view === "grades")}
          aria-current={view === "grades" ? "page" : undefined}
          onClick={() => onChangeView("grades")}
        >
          <BookOpen size={16} /> Grades
        </button>
        <button
          type="button"
          className={navBtn(view === "tools")}
          aria-current={view === "tools" ? "page" : undefined}
          onClick={() => onChangeView("tools")}
        >
          <Wrench size={16} /> Tools
        </button>
        <button
          type="button"
          className={navBtn(view === "alerts")}
          aria-current={view === "alerts" ? "page" : undefined}
          onClick={() => onChangeView("alerts")}
        >
          <Bell size={16} /> Alerts
          {alertCount > 0 && (
            <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
              {alertCount}
            </span>
          )}
        </button>
      </nav>
      <SemesterSwitcher />
      <SubjectList
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={onSelectSubject}
      />
    </aside>
  );
}

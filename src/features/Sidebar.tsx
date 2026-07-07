import { SemesterSwitcher } from "./SemesterSwitcher";
import { SubjectList } from "./SubjectList";
import { GraduationCap, BookOpen, Wrench, BarChart3, Download, Bell } from "../components/Icon";

type View = "grades" | "tools" | "insights" | "export" | "alerts";

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
    `flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400/60 ${
      active ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
    }`;

  const items: {
    id: View;
    label: string;
    icon: JSX.Element;
    full?: boolean;
    badge?: number;
  }[] = [
    { id: "grades", label: "Grades", icon: <BookOpen size={16} />, full: true },
    { id: "tools", label: "Tools", icon: <Wrench size={16} /> },
    { id: "insights", label: "Insights", icon: <BarChart3 size={16} /> },
    { id: "export", label: "Export", icon: <Download size={16} /> },
    { id: "alerts", label: "Alerts", icon: <Bell size={16} />, badge: alertCount },
  ];

  return (
    <aside className="flex w-full flex-col gap-6 border-b border-slate-800 bg-slate-900/40 p-4 md:h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2">
        <GraduationCap className="text-indigo-400" size={22} />
        <span className="text-lg font-semibold tracking-tight">
          IntelliGrade
        </span>
      </div>
      <nav className="grid grid-cols-2 gap-2" aria-label="Primary">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${navBtn(view === item.id)} ${item.full ? "col-span-2" : ""}`}
            aria-current={view === item.id ? "page" : undefined}
            onClick={() => onChangeView(item.id)}
          >
            {item.icon} {item.label}
            {item.badge ? (
              <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
      <SemesterSwitcher />
      <SubjectList
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={onSelectSubject}
      />
    </aside>
  );
}

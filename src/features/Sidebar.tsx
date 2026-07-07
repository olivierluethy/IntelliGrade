import { useState } from "react";
import { SemesterSwitcher } from "./SemesterSwitcher";
import { SubjectList } from "./SubjectList";
import { IconButton } from "../components/IconButton";
import {
  GraduationCap,
  BookOpen,
  Wrench,
  BarChart3,
  Download,
  Bell,
  Menu,
} from "../components/Icon";

type View = "grades" | "tools" | "insights" | "export" | "alerts";

type Props = {
  selectedSubjectId: string | null;
  onSelectSubject: (id: string) => void;
  view: View;
  onChangeView: (view: View) => void;
  alertCount: number;
};

const NAV: { id: View; label: string; icon: typeof BookOpen; hint: string }[] = [
  { id: "grades", label: "Grades", icon: BookOpen, hint: "Track & plan a subject" },
  { id: "insights", label: "Insights", icon: BarChart3, hint: "Trends & advice" },
  { id: "tools", label: "Tools", icon: Wrench, hint: "Grade calculators" },
  { id: "export", label: "Export", icon: Download, hint: "PDF & Excel report" },
  { id: "alerts", label: "Alerts", icon: Bell, hint: "Needs attention" },
];

export function Sidebar({
  selectedSubjectId,
  onSelectSubject,
  view,
  onChangeView,
  alertCount,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="flex w-full flex-col gap-6 border-b border-line bg-ink-2/70 p-4 backdrop-blur md:h-screen md:w-[264px] md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand/15 text-brand">
            <GraduationCap size={20} />
          </span>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold tracking-tight">
              IntelliGrade
            </div>
            <div className="text-[0.7rem] text-faint">Grade planner</div>
          </div>
        </div>
        <div className="md:hidden">
          <IconButton
            icon={Menu}
            label={open ? "Collapse menu" : "Expand menu"}
            onClick={() => setOpen((v) => !v)}
          />
        </div>
      </div>

      <div
        className={`${open ? "flex" : "hidden"} flex-col gap-6 md:flex`}
        id="sidebar-panel"
      >
        <nav className="space-y-1" aria-label="Primary">
          {NAV.map((item) => {
            const active = view === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  onChangeView(item.id);
                  setOpen(false);
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                  active
                    ? "bg-brand/15 text-fg ring-1 ring-inset ring-brand/30"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <Icon
                  size={18}
                  className={active ? "text-brand-bright" : "text-faint group-hover:text-muted"}
                />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {item.id === "alerts" && alertCount > 0 ? (
                  <span className="rounded-full bg-fail/90 px-1.5 text-xs font-semibold text-white">
                    {alertCount}
                  </span>
                ) : (
                  <span className="text-[0.7rem] text-faint opacity-0 transition-opacity group-hover:opacity-100">
                    {item.hint}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="h-px bg-line-soft" />
        <SemesterSwitcher />
        <SubjectList
          selectedSubjectId={selectedSubjectId}
          onSelectSubject={onSelectSubject}
        />
      </div>
    </aside>
  );
}

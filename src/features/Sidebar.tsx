import { SemesterSwitcher } from "./SemesterSwitcher";
import { SubjectList } from "./SubjectList";
import { GraduationCap } from "../components/Icon";

type Props = {
  selectedSubjectId: string | null;
  onSelectSubject: (id: string) => void;
};

export function Sidebar({ selectedSubjectId, onSelectSubject }: Props) {
  return (
    <aside className="flex w-full flex-col gap-6 border-b border-slate-800 bg-slate-900/40 p-4 md:h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2">
        <GraduationCap className="text-indigo-400" size={22} />
        <span className="text-lg font-semibold tracking-tight">
          IntelliGrade
        </span>
      </div>
      <SemesterSwitcher />
      <SubjectList
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={onSelectSubject}
      />
    </aside>
  );
}

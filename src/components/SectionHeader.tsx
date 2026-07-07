import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  icon?: LucideIcon;
  title: string;
  /** One short line telling the user what this section is for. */
  hint?: string;
  action?: ReactNode;
};

/** Card/section heading with an optional "what this does" line and trailing action. */
export function SectionHeader({ icon: Icon, title, hint, action }: Props) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        {Icon && (
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand/12 text-brand">
            <Icon size={16} />
          </span>
        )}
        <div>
          <h3 className="font-display text-[0.95rem] font-semibold leading-tight text-fg">
            {title}
          </h3>
          {hint && <p className="mt-0.5 text-xs leading-snug text-faint">{hint}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

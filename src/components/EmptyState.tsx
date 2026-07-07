import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  /** Compact fits inside a card; default fills a view. */
  compact?: boolean;
};

/** A tidy, intentional empty state that points at the next action. */
export function EmptyState({ icon: Icon, title, description, action, compact }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/40 text-center ${
        compact ? "gap-2 px-6 py-8" : "gap-3 px-6 py-16"
      }`}
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-brand/12 text-brand">
        <Icon size={22} />
      </span>
      <h3 className="font-display text-lg font-semibold text-fg">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

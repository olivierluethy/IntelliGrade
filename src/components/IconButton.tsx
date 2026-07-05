import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger";
};

export function IconButton({
  icon: IconEl,
  label,
  onClick,
  variant = "default",
}: Props) {
  const color =
    variant === "danger"
      ? "text-slate-400 hover:text-rose-400"
      : "text-slate-400 hover:text-slate-100";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-md p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400/60 ${color}`}
    >
      <IconEl size={16} />
    </button>
  );
}

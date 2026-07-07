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
      ? "text-faint hover:text-fail hover:bg-fail/10"
      : "text-faint hover:text-fg hover:bg-line/60";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-md p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${color}`}
    >
      <IconEl size={16} />
    </button>
  );
}

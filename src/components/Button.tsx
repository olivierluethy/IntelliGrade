import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

const styles: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-bright shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]",
  ghost: "bg-surface-2 text-fg hover:bg-line/70 border border-line",
  danger: "bg-transparent text-faint hover:bg-fail/10 hover:text-fail border border-line",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
};

const styles: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-indigo-500 hover:bg-indigo-400 text-white",
  ghost: "bg-slate-800 hover:bg-slate-700 text-slate-200",
  danger: "bg-rose-600 hover:bg-rose-500 text-white",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400/60 disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

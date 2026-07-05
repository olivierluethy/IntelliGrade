import type { ReactNode } from "react";

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-sm font-semibold tabular-nums ${className}`}
    >
      {children}
    </span>
  );
}

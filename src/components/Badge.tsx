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
      className={`inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-sm font-semibold tabular-nums ${className}`}
    >
      {children}
    </span>
  );
}

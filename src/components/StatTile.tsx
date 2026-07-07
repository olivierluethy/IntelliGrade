import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
};

/** Compact labelled statistic for dashboard headers. */
export function StatTile({ label, value, sub, className = "" }: Props) {
  return (
    <div className={`card px-4 py-3 ${className}`}>
      <div className="eyebrow">{label}</div>
      <div className="mt-1 font-readout text-2xl font-semibold leading-none text-fg">
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-faint">{sub}</div>}
    </div>
  );
}

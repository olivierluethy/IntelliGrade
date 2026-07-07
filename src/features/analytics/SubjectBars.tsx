import type { GradeScale } from "../../domain/grade-scale";
import type { SubjectStats } from "../../domain/analytics";

type Props = {
  subjects: SubjectStats[];
  scale: GradeScale;
};

// colorFor returns a Tailwind text class; map the known set to hex for bar fills
// so we don't depend on dynamically-named bg-* classes being generated.
const FILL: Record<string, string> = {
  "text-emerald-400": "#34d399",
  "text-lime-400": "#a3e635",
  "text-amber-400": "#fbbf24",
  "text-rose-400": "#fb7185",
};

export function SubjectBars({ subjects, scale }: Props) {
  const graded = subjects.filter((s) => s.average !== null);
  if (graded.length === 0) return null;

  const span = scale.max - scale.min || 1;
  const pct = (v: number) => ((v - scale.min) / span) * 100;

  // Integer gridlines across the scale.
  const ticks: number[] = [];
  for (let t = Math.ceil(scale.min); t <= Math.floor(scale.max); t++) ticks.push(t);

  const passLeft = pct(scale.passThreshold);

  return (
    <div>
      {/* legend */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-faint">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-sm bg-pass" /> average
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-0.5 bg-brand" /> target
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-px bg-faint" /> pass {scale.format(scale.passThreshold)}
        </span>
      </div>

      <div className="space-y-2.5">
        {graded.map((s) => {
          const avg = s.average as number;
          const fill = FILL[scale.colorFor(avg)] ?? "#8b7bf5";
          return (
            <div key={s.subjectId} className="flex items-center gap-3">
              <div className="w-24 shrink-0 truncate text-right text-sm text-muted" title={s.name}>
                {s.name}
              </div>
              <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-inset ring-line">
                {/* gridlines */}
                {ticks.map((t) => (
                  <div
                    key={t}
                    className="absolute inset-y-0 w-px bg-line-soft"
                    style={{ left: `${pct(t)}%` }}
                  />
                ))}
                {/* pass line */}
                <div
                  className="absolute inset-y-0 w-px bg-faint/70"
                  style={{ left: `${passLeft}%` }}
                />
                {/* bar */}
                <div
                  className="absolute inset-y-1 left-0 rounded-md"
                  style={{ width: `${Math.max(2, pct(avg))}%`, backgroundColor: fill }}
                />
                {/* value */}
                <span className="absolute right-2 top-1/2 -translate-y-1/2 font-readout text-xs font-semibold text-fg">
                  {scale.format(avg)}
                </span>
                {/* target tick */}
                {s.target !== undefined && (
                  <div
                    className="absolute inset-y-[-2px] w-0.5 bg-brand"
                    style={{ left: `${pct(s.target)}%` }}
                    title={`Target ${scale.format(s.target)}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* axis */}
      <div className="mt-2 flex items-center gap-3">
        <div className="w-24 shrink-0" />
        <div className="relative h-4 flex-1">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute -translate-x-1/2 text-[0.65rem] text-faint"
              style={{ left: `${pct(t)}%` }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

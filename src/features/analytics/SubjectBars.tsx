import type { GradeScale } from "../../domain/grade-scale";
import type { SubjectStats } from "../../domain/analytics";

type Props = {
  subjects: SubjectStats[];
  scale: GradeScale;
};

// Tailwind text-* colour → a concrete fill so SVG rects can use it.
const FILL: Record<string, string> = {
  "text-emerald-400": "#34d399",
  "text-lime-400": "#a3e635",
  "text-amber-400": "#fbbf24",
  "text-rose-400": "#fb7185",
};

/** Horizontal bar chart of subject averages, one row per graded subject. */
export function SubjectBars({ subjects, scale }: Props) {
  const graded = subjects.filter((s) => s.average !== null);
  if (graded.length === 0) return null;

  const span = scale.max - scale.min || 1;
  const frac = (v: number) => Math.max(0, Math.min(1, (v - scale.min) / span));

  const rowH = 34;
  const labelW = 120;
  const barLeft = labelW + 8;
  const width = 520;
  const barMax = width - barLeft - 52; // leave room for the value at the end
  const height = graded.length * rowH + 8;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Subject averages"
    >
      {graded.map((s, i) => {
        const y = i * rowH + 4;
        const avg = s.average as number;
        const w = frac(avg) * barMax;
        const fill = FILL[scale.colorFor(avg)] ?? "#94a3b8";
        const targetX =
          s.target !== undefined ? barLeft + frac(s.target) * barMax : null;
        return (
          <g key={s.subjectId}>
            <text
              x={labelW}
              y={y + rowH / 2}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-slate-300"
              fontSize="13"
            >
              {s.name.length > 16 ? s.name.slice(0, 15) + "…" : s.name}
            </text>
            <rect
              x={barLeft}
              y={y + 6}
              width={barMax}
              height={rowH - 16}
              rx="4"
              className="fill-slate-800"
            />
            <rect
              x={barLeft}
              y={y + 6}
              width={w}
              height={rowH - 16}
              rx="4"
              fill={fill}
            />
            {targetX !== null && (
              <line
                x1={targetX}
                x2={targetX}
                y1={y + 2}
                y2={y + rowH - 6}
                stroke="#e2e8f0"
                strokeWidth="2"
                strokeDasharray="3 2"
              >
                <title>Target {scale.format(s.target as number)}</title>
              </line>
            )}
            <text
              x={barLeft + barMax + 8}
              y={y + rowH / 2}
              dominantBaseline="middle"
              className="fill-slate-200 tabular-nums"
              fontSize="13"
              fontWeight="600"
            >
              {scale.format(avg)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

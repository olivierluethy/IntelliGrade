import type { GradeScale } from "../domain/grade-scale";

type Props = {
  scale: GradeScale;
  average: number | null;
  target?: number;
  /** Optional grade you'd need next, drawn as a hollow marker. */
  needed?: number | null;
};

/**
 * The signature instrument: a 1–6 track that places where you ARE (average),
 * where you WANT to be (target) and, optionally, what you NEED next — so the
 * abstract planning maths becomes a physical position on the grade scale.
 */
export function GradeTrack({ scale, average, target, needed }: Props) {
  const span = scale.max - scale.min || 1;
  const pct = (v: number) => `${((clamp(v) - scale.min) / span) * 100}%`;
  function clamp(v: number) {
    return Math.max(scale.min, Math.min(scale.max, v));
  }

  const passPct = ((scale.passThreshold - scale.min) / span) * 100;
  // The passing zone sits on the good side of the threshold.
  const goodZone = scale.higherIsBetter
    ? { left: `${passPct}%`, right: "0%" }
    : { left: "0%", right: `${100 - passPct}%` };

  const ariaParts = [
    average !== null ? `average ${scale.format(average)}` : "no average yet",
    target !== undefined ? `target ${scale.format(target)}` : null,
    needed != null && Number.isFinite(needed) ? `need ${scale.format(needed)}` : null,
  ].filter(Boolean);

  return (
    <div className="select-none" role="img" aria-label={`Grade track: ${ariaParts.join(", ")}`}>
      {/* top labels: average */}
      <div className="relative h-6">
        {average !== null && (
          <Marker pos={pct(average)} place="top">
            <span className={`font-readout font-semibold ${scale.colorFor(average)}`}>
              {scale.format(average)}
            </span>
            <span className="text-faint"> now</span>
          </Marker>
        )}
      </div>

      {/* the track */}
      <div className="relative h-3 rounded-full bg-surface-2 ring-1 ring-inset ring-line">
        {/* passing zone */}
        <div
          className="absolute inset-y-0 rounded-full bg-pass/18"
          style={{ left: goodZone.left, right: goodZone.right }}
        />
        {/* pass threshold tick */}
        <div
          className="absolute inset-y-[-3px] w-px bg-line"
          style={{ left: `${passPct}%` }}
        />
        {/* needed marker (hollow) */}
        {needed != null && Number.isFinite(needed) && scale.clampValid(needed) && (
          <div
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-warn bg-ink"
            style={{ left: pct(needed) }}
            title={`Need ${scale.format(needed)}`}
          />
        )}
        {/* average marker (filled) */}
        {average !== null && (
          <div
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-fg shadow"
            style={{ left: pct(average) }}
          />
        )}
        {/* target marker (violet flag) */}
        {target !== undefined && (
          <div
            className="absolute inset-y-[-5px] w-0.5 bg-brand"
            style={{ left: pct(target) }}
          />
        )}
      </div>

      {/* bottom labels: scale ends, pass, target */}
      <div className="relative mt-1.5 h-5 text-[0.7rem]">
        <span className="absolute left-0 text-faint">{scale.format(scale.min)}</span>
        <span
          className="absolute -translate-x-1/2 text-faint"
          style={{ left: `${passPct}%` }}
        >
          pass {scale.format(scale.passThreshold)}
        </span>
        <span className="absolute right-0 text-faint">{scale.format(scale.max)}</span>
        {target !== undefined && (
          <Marker pos={pct(target)} place="bottom">
            <span className="font-semibold text-brand">target {scale.format(target)}</span>
          </Marker>
        )}
      </div>
    </div>
  );
}

function Marker({
  pos,
  place,
  children,
}: {
  pos: string;
  place: "top" | "bottom";
  children: React.ReactNode;
}) {
  return (
    <span
      className={`absolute -translate-x-1/2 whitespace-nowrap text-xs ${
        place === "top" ? "bottom-0" : "top-0"
      }`}
      style={{ left: pos }}
    >
      {children}
    </span>
  );
}

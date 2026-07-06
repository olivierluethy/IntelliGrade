import { useState } from "react";
import { gradeChangePercent, originalFromRaisePercent } from "../../domain/gradeChange";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { Percent } from "../../components/Icon";

export function GradeChangeCalculator() {
  // Direction A: original + raised → percent change
  const [original, setOriginal] = useState("");
  const [raised, setRaised] = useState("");
  const o = parseFloat(original);
  const r = parseFloat(raised);
  const percent = !Number.isNaN(o) && o !== 0 && !Number.isNaN(r) ? gradeChangePercent(o, r) : null;

  // Direction B: raised + percent → original
  const [raised2, setRaised2] = useState("");
  const [pct, setPct] = useState("");
  const r2 = parseFloat(raised2);
  const p = parseFloat(pct);
  const derivedOriginal =
    !Number.isNaN(r2) && !Number.isNaN(p) && 1 + p / 100 !== 0
      ? originalFromRaisePercent(r2, p)
      : null;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Percent size={16} className="text-indigo-400" />
        Grade change %
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Original + raised → % change
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Original grade" value={original} onChange={setOriginal} placeholder="e.g. 4" />
          <NumberField label="Raised grade" value={raised} onChange={setRaised} placeholder="e.g. 5" />
        </div>
        {percent !== null && (
          <div className="text-sm">
            Change:{" "}
            <span className={`font-semibold ${percent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {percent >= 0 ? "+" : ""}
              {percent.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Raised + % change → original
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Raised grade" value={raised2} onChange={setRaised2} placeholder="e.g. 5" />
          <NumberField label="Percent change" value={pct} onChange={setPct} placeholder="e.g. 25" />
        </div>
        {derivedOriginal !== null && (
          <div className="text-sm">
            Original:{" "}
            <span className="font-semibold text-slate-200">{derivedOriginal.toFixed(2)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

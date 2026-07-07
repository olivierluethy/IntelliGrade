import { useState } from "react";
import { gradeChangePercent, originalFromRaisePercent } from "../../domain/gradeChange";
import { NumberField } from "../../components/NumberField";
import { Card } from "../../components/Card";
import { SectionHeader } from "../../components/SectionHeader";
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
    <Card className="flex h-full flex-col">
      <SectionHeader
        icon={Percent}
        title="Grade change %"
        hint="How much did a grade go up or down in percent — or work back to the original."
      />

      <div className="space-y-2.5">
        <div className="eyebrow">From two grades → % change</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Original grade" value={original} onChange={setOriginal} placeholder="4" />
          <NumberField label="New grade" value={raised} onChange={setRaised} placeholder="5" />
        </div>
        {percent !== null && (
          <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm">
            Change:{" "}
            <span className={`font-readout text-lg font-bold ${percent >= 0 ? "text-pass" : "text-fail"}`}>
              {percent >= 0 ? "+" : ""}
              {percent.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2.5 border-t border-line pt-4">
        <div className="eyebrow">From new grade + % → original</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="New grade" value={raised2} onChange={setRaised2} placeholder="5" />
          <NumberField label="Percent change" value={pct} onChange={setPct} placeholder="25" />
        </div>
        {derivedOriginal !== null && (
          <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm">
            Original:{" "}
            <span className="font-readout text-lg font-bold text-fg">
              {derivedOriginal.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

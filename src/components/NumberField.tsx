// src/components/NumberField.tsx
export type NumberFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  placeholder?: string;
  error?: string;
  min?: number;
  max?: number;
};

export function NumberField({
  label,
  value,
  onChange,
  step,
  placeholder,
  error,
  min,
  max,
}: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-300">{label}</span>
      <input
        type="number"
        aria-label={label}
        aria-invalid={error ? true : undefined}
        value={value}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
      />
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}

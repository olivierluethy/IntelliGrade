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
  hint?: string;
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
  hint,
}: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-muted">{label}</span>
      <input
        type="number"
        aria-label={label}
        aria-invalid={error ? true : undefined}
        value={value}
        step={step ?? "any"}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="field tabular-nums"
      />
      {error ? (
        <span className="text-xs text-fail">{error}</span>
      ) : hint ? (
        <span className="text-xs text-faint">{hint}</span>
      ) : null}
    </label>
  );
}

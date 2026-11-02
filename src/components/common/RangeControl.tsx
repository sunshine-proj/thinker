interface RangeControlProps {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly minimum: number;
  readonly maximum: number;
  readonly step: number;
  /** Formatted value with units, shown beside the label. */
  readonly displayValue: string;
  readonly disabled?: boolean;
  readonly onChange: (value: number) => void;
}

/** Labelled slider that reports its numeric value and bounds. */
export function RangeControl({
  id,
  label,
  value,
  minimum,
  maximum,
  step,
  displayValue,
  disabled = false,
  onChange,
}: RangeControlProps) {
  return (
    <div className="lab-control">
      <span className="lab-control__heading">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{displayValue}</output>
      </span>
      <input
        disabled={disabled}
        id={id}
        max={maximum}
        min={minimum}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step={step}
        type="range"
        value={value}
      />
      <span aria-hidden="true" className="lab-control__bounds">
        <span>{minimum}</span>
        <span>{maximum}</span>
      </span>
    </div>
  );
}

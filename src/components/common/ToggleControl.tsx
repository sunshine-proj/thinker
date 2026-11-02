interface ToggleControlProps {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly className?: string;
  readonly onChange: (checked: boolean) => void;
}

/** Switch-style checkbox with a short explanatory caption. */
export function ToggleControl({
  id,
  label,
  description,
  checked,
  className,
  onChange,
}: ToggleControlProps) {
  return (
    <label
      className={className ? `lab-toggle ${className}` : "lab-toggle"}
      htmlFor={id}
    >
      <input
        checked={checked}
        id={id}
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <span aria-hidden="true" className="lab-toggle__track">
        <span />
      </span>
      <span>
        {label}
        <small>{description}</small>
      </span>
    </label>
  );
}

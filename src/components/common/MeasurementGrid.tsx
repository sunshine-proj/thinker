export interface MeasurementItem {
  readonly label: string;
  readonly value: string;
}

/** Live-announced readouts shown under a simulation or diagram. */
export function MeasurementGrid({ items }: { readonly items: readonly MeasurementItem[] }) {
  return (
    <div aria-live="polite" className="game-measurements">
      {items.map((item) => (
        <div className="game-measurement" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

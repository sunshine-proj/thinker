interface HeatFlowDiagramProps {
  readonly kind: "engine" | "refrigerator";
  readonly hotLabel: string;
  readonly coldLabel: string;
  readonly hotWatts: number;
  readonly coldWatts: number;
  readonly workWatts: number;
}

const kW = (watts: number) => `${(watts / 1000).toFixed(watts >= 1000 ? 1 : 3)} kW`;

/** Energy-flow sketch of a heat engine or refrigerator; arrow thickness is proportional to power. */
export function HeatFlowDiagram({ kind, hotLabel, coldLabel, hotWatts, coldWatts, workWatts }: HeatFlowDiagramProps) {
  const biggest = Math.max(hotWatts, coldWatts, workWatts, 1);
  const width = (watts: number) => Math.max(3, (watts / biggest) * 36);
  const engine = kind === "engine";
  return (
    <svg
      aria-label={`${engine ? "Heat engine" : "Refrigerator"} energy flow. ${engine ? `Heat in from ${hotLabel}: ${kW(hotWatts)}. Work out: ${kW(workWatts)}. Heat rejected to ${coldLabel}: ${kW(coldWatts)}.` : `Heat removed from ${coldLabel}: ${kW(coldWatts)}. Work in: ${kW(workWatts)}. Heat rejected to ${hotLabel}: ${kW(hotWatts)}.`}`}
      className="balance-plot"
      role="img"
      viewBox="0 0 700 320"
    >
      <rect fill="#f9faff" height="320" rx="10" width="700" />
      <rect fill="#ffe3df" height="54" stroke="#c0392b" width="260" x="220" y="14" />
      <text className="flow-label" textAnchor="middle" x="350" y="46">{hotLabel}</text>
      <rect fill="#dbeeff" height="54" stroke="#5a8fc4" width="260" x="220" y="252" />
      <text className="flow-label" textAnchor="middle" x="350" y="284">{coldLabel}</text>
      <rect fill="#e8ecfb" height="70" stroke="#7180d8" width="130" x="285" y="125" />
      <text className="flow-label" textAnchor="middle" x="350" y="165">{engine ? "Engine" : "Fridge"}</text>
      <line stroke="#c0392b" strokeWidth={width(hotWatts)} x1="320" x2="320" y1={engine ? 70 : 122} y2={engine ? 122 : 70} />
      <text className="flow-label" x="150" y="100">{kW(hotWatts)} {engine ? "heat in" : "heat out"}</text>
      <line stroke="#5a8fc4" strokeWidth={width(coldWatts)} x1="320" x2="320" y1={engine ? 198 : 250} y2={engine ? 250 : 198} />
      <text className="flow-label" x="150" y="230">{kW(coldWatts)} {engine ? "heat out" : "heat in"}</text>
      <line stroke="#2a9d8f" strokeWidth={width(workWatts)} x1={engine ? 415 : 600} x2={engine ? 600 : 415} y1="160" y2="160" />
      <text className="flow-label" textAnchor="middle" x="540" y="140">{kW(workWatts)} work {engine ? "out" : "in"}</text>
    </svg>
  );
}

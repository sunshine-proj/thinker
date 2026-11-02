import { createNumericGamePage } from "../../../game-engine/rounds";
import { solarCooker } from "./solarCooker";

export const SolarCookerPage = createNumericGamePage({
  definition: solarCooker,
  measurements: (game) => {
    const o = game.last?.outcome;
    return [
      { label: "POWER COLLECTED", value: o ? `${o.powerWatts.toFixed(0)} W` : "—" },
      { label: "TIME TO BOIL", value: o?.minutes != null ? `${o.minutes.toFixed(1)} min` : "—" },
      { label: "STEADY TEMPERATURE", value: o?.steadyCelsius != null ? `${o.steadyCelsius.toFixed(0)} °C` : "—" },
      { label: "MISALIGNMENT", value: o ? `${o.misalignmentDegrees.toFixed(1)}°` : "—" },
    ];
  },
  visual: (game) => {
    const diameter = game.control.diameter as number;
    const tilt = (game.control.tilt as number | undefined) ?? 35;
    const scale = 110 / Math.max(diameter, 0.5);
    const rad = (tilt * Math.PI) / 180;
    const half = (diameter * scale) / 2;
    const cx = 330;
    const cy = 170;
    return (
      <svg aria-label={`Solar dish ${diameter.toFixed(2)} meters across, tilted ${tilt.toFixed(1)} degrees above the horizon. The sun is 35 degrees above the horizon.`} className="balance-plot" role="img" viewBox="0 0 700 260">
        <rect fill="#f9faff" height="260" rx="10" width="700" />
        <line stroke="#d9a21f" strokeWidth="3" x1="60" x2={60 + 90 * Math.cos((35 * Math.PI) / 180)} y1="60" y2={60 + 90 * Math.sin((35 * Math.PI) / 180)} />
        <text className="balance-plot__pivot-label" x="40" y="45">sunlight (35° up)</text>
        <line stroke="#7180d8" strokeLinecap="round" strokeWidth="8" x1={cx - half * Math.sin(rad)} x2={cx + half * Math.sin(rad)} y1={cy + half * Math.cos(rad)} y2={cy - half * Math.cos(rad)} />
        <circle cx={cx + 40 * Math.cos(rad)} cy={cy - 40 * Math.sin(rad)} fill="#364057" r="9" />
        <line stroke="#9aa5cf" x1="50" x2="650" y1="230" y2="230" />
        <text className="balance-plot__pivot-label" x="430" y="60">Dish {diameter.toFixed(2)} m · pot at the focus</text>
      </svg>
    );
  },
});

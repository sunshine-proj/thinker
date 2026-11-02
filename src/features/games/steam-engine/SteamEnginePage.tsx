import { HeatFlowDiagram } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { steamEngine } from "./steamEngine";

export const SteamEnginePage = createNumericGamePage({
  definition: steamEngine,
  measurements: (game) => {
    const o = game.last?.outcome;
    return [
      { label: "EFFICIENCY", value: o ? `${(o.engine.efficiency * 100).toFixed(1)}%` : "—" },
      { label: "CARNOT LIMIT", value: o ? `${(o.engine.carnotEfficiency * 100).toFixed(1)}%` : "—" },
      { label: "WORK OUTPUT", value: o ? `${(o.engine.workWatts / 1000).toFixed(1)} kW` : "—" },
      { label: "ENTROPY PRODUCED", value: o ? `${o.engine.entropyProductionWattsPerKelvin.toFixed(1)} W/K` : "—" },
    ];
  },
  visual: (game) => {
    const o = game.last?.outcome;
    const heat = (game.control.heat as number) * 1000;
    return (
      <HeatFlowDiagram
        coldLabel={`Condenser ${game.control.cold}°C`}
        coldWatts={o ? o.engine.rejectedHeatWatts : 0}
        hotLabel={`Boiler ${game.control.hot}°C`}
        hotWatts={heat}
        kind="engine"
        workWatts={o ? o.engine.workWatts : 0}
      />
    );
  },
});

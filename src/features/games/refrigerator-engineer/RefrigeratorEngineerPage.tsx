import { HeatFlowDiagram } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { refrigeratorEngineer } from "./refrigeratorEngineer";

export const RefrigeratorEngineerPage = createNumericGamePage({
  definition: refrigeratorEngineer,
  measurements: (game) => {
    const o = game.last?.outcome;
    return [
      { label: "COLD SPACE", value: o ? `${o.coldCelsius.toFixed(1)} °C` : "—" },
      { label: "COP ACHIEVED", value: o ? o.state.cop.toFixed(2) : "—" },
      { label: "CARNOT COP", value: o ? o.state.carnotCop.toFixed(1) : "—" },
      { label: "COOLING POWER", value: o ? `${o.state.coolingWatts.toFixed(1)} W` : "—" },
    ];
  },
  visual: (game) => {
    const o = game.last?.outcome;
    return (
      <HeatFlowDiagram
        coldLabel={`Cold space ${o ? o.coldCelsius.toFixed(1) : "?"}°C`}
        coldWatts={o ? o.state.coolingWatts : 0}
        hotLabel={`Room ${game.round.roomCelsius}°C`}
        hotWatts={o ? o.state.heatRejectedWatts : 0}
        kind="refrigerator"
        workWatts={game.control.power as number}
      />
    );
  },
});

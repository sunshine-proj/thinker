import { createNumericGamePage } from "../../../game-engine/rounds";
import { MATERIALS, finalTemperature, materialDetective } from "./materialDetective";

export const MaterialDetectivePage = createNumericGamePage({
  definition: materialDetective,
  measurements: (game) => [
    { label: "THERMOMETER (FINAL)", value: `${finalTemperature(game.round, game.control).toFixed(2)} °C` },
    { label: "WATER START", value: "20 °C" },
    { label: "SAMPLE START", value: `${game.control.sampleTemp} °C` },
    { label: "SAMPLE MASS", value: `${(game.control.sampleMass as number).toFixed(2)} kg` },
  ],
  visual: (game) => (
    <div className="calorimeter-panel" role="group" aria-label="Calorimeter and reference table">
      <p className="balance-situation">
        {(game.control.sampleMass as number).toFixed(2)} kg of the mystery metal at {game.control.sampleTemp} °C is dropped into {(game.control.waterMass as number).toFixed(2)} kg of water at 20 °C. The thermometer settles at {finalTemperature(game.round, game.control).toFixed(2)} °C.
      </p>
      <table className="circuit-readings">
        <caption>REFERENCE SPECIFIC HEATS (J/kg·K)</caption>
        <thead><tr><th scope="col">Material</th><th scope="col">c</th></tr></thead>
        <tbody>{MATERIALS.map((m) => (<tr key={m.name}><td>{m.name}</td><td>{m.specificHeat}</td></tr>))}<tr><td>water</td><td>4186</td></tr></tbody>
      </table>
    </div>
  ),
});

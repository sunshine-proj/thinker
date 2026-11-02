import { LineChart, RangeControl } from "../../../components/common";
import { RoundGamePage } from "../../../game-engine/rounds";
import { SIMULATION_HOURS } from "./temperatureControlData";
import { resolveSettings, temperatureControl, temperatureCurve } from "./temperatureControlModel";

export function TemperatureControlPage() {
  return (
    <RoundGamePage
      definition={temperatureControl}
      renderControls={(game) => {
        const { round, control } = game;
        const settings = resolveSettings(round, control);
        return (
          <>
            {round.heater.fixedWatts === null ? (
              <RangeControl
                disabled={!game.canEdit}
                displayValue={`${control.heaterWatts} W`}
                id="heater-power"
                label="Heater power"
                maximum={round.heater.maximum}
                minimum={round.heater.minimum}
                onChange={(heaterWatts) => game.setControl((current) => ({ ...current, heaterWatts }))}
                step={round.heater.step}
                value={control.heaterWatts}
              />
            ) : (
              <p className="game-instructions">Heater fixed at {round.heater.fixedWatts} W.</p>
            )}
            {round.insulation.fixedCentimeters === null ? (
              <RangeControl
                disabled={!game.canEdit}
                displayValue={`${control.insulationCentimeters.toFixed(1)} cm`}
                id="insulation-thickness"
                label="Insulation thickness"
                maximum={round.insulation.maximum}
                minimum={round.insulation.minimum}
                onChange={(insulationCentimeters) => game.setControl((current) => ({ ...current, insulationCentimeters }))}
                step={round.insulation.step}
                value={control.insulationCentimeters}
              />
            ) : (
              <p className="game-instructions">
                Insulation fixed at {round.insulation.fixedCentimeters} cm of mineral wool (k = {round.conductivity} W/m·K), {round.wallAreaSquareMeters} m² of walls.
              </p>
            )}
            <p className="game-instructions">
              Outside: {round.outsideTemperatureCelsius} °C · starting inside: {round.initialTemperatureCelsius} °C · target {round.goal.targetCelsius} °C ± {round.goal.toleranceKelvin} K
              {round.goal.maximumPowerWatts !== null ? ` · heater ≤ ${round.goal.maximumPowerWatts} W` : ""}
              {round.goal.warmUp ? ` · ${round.goal.warmUp.reachCelsius} °C within ${round.goal.warmUp.withinHours} h` : ""}.
              {" "}Selected: {settings.heaterWatts} W, {settings.insulationCentimeters.toFixed(1)} cm.
            </p>
          </>
        );
      }}
      renderMeasurements={(game) => {
        const outcome = game.last?.outcome;
        return [
          { label: "EQUILIBRIUM", value: outcome ? `${outcome.steadyStateCelsius.toFixed(1)} °C` : "—" },
          { label: "HEAT LOSS AT 20 °C", value: outcome ? `${(outcome.conductanceWattsPerKelvin * (20 - game.round.outsideTemperatureCelsius)).toFixed(0)} W` : "—" },
          { label: "TIME CONSTANT", value: outcome ? `${outcome.timeConstantHours.toFixed(1)} h` : "—" },
          {
            label: game.round.goal.warmUp ? `TIME TO ${game.round.goal.warmUp.reachCelsius} °C` : "CONDUCTANCE U",
            value: outcome
              ? game.round.goal.warmUp
                ? outcome.timeToWarmUpHours === null ? "never" : `${outcome.timeToWarmUpHours.toFixed(1)} h`
                : `${outcome.conductanceWattsPerKelvin.toFixed(1)} W/K`
              : "—",
          },
        ];
      }}
      renderVisual={(game) => {
        const outcome = game.last?.outcome;
        const { goal } = game.round;
        if (!outcome) {
          return (
            <p className="balance-situation">
              Choose your settings and run the winter night to see the cabin warm toward its equilibrium temperature.
            </p>
          );
        }
        return (
          <LineChart
            band={{ label: `${goal.targetCelsius} °C ± ${goal.toleranceKelvin} K`, yMin: goal.targetCelsius - goal.toleranceKelvin, yMax: goal.targetCelsius + goal.toleranceKelvin }}
            description={`The room warms from ${game.round.initialTemperatureCelsius} degrees toward an equilibrium of ${outcome.steadyStateCelsius.toFixed(1)} degrees with a time constant of ${outcome.timeConstantHours.toFixed(1)} hours.`}
            series={[{ label: "Inside temperature", points: temperatureCurve(outcome.room) }]}
            title="Cabin temperature through the night"
            xDomain={[0, SIMULATION_HOURS]}
            xLabel="Time (hours)"
            yLabel="Temperature (°C)"
          />
        );
      }}
    />
  );
}

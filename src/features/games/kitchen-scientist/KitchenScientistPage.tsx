import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateIcedDrink } from "../../../physics/thermodynamics";
import { ALUMINIUM_CONDUCTIVITY, BASE_POWER, CUBE_MASS, DRINK_MASS, DRINK_START, DRINK_TARGET, HOB_EFFICIENCY, HOB_POWER, POT_RADIUS, WATER_MASS, kitchenScientist, runKitchen } from "./kitchenScientist";

export const KitchenScientistPage = createNumericGamePage({
  definition: kitchenScientist,
  measurements: (game) => {
    const o = runKitchen(game.round, game.control);
    if (game.round.kind === "boil") {
      const energy = HOB_POWER * HOB_EFFICIENCY * (game.control.minutes as number) * 60;
      return [
        { label: "HEAT NEEDED", value: `${(WATER_MASS * 4186 * 80 / 1000).toFixed(0)} kJ` },
        { label: "POWER INTO WATER", value: `${HOB_POWER * HOB_EFFICIENCY} W` },
        { label: "ENERGY IN YOUR TIME", value: `${(energy / 1000).toFixed(0)} kJ` },
        { label: "TEMPERATURE THEN", value: `${Math.min(100, 20 + energy / (WATER_MASS * 4186)).toFixed(1)} °C` },
      ];
    }
    if (game.round.kind === "ice") {
      return [
        { label: "ICE CUBES", value: String(game.control.cubes) },
        { label: "FINAL TEMPERATURE", value: `${o.headline.toFixed(1)} °C` },
        { label: "ICE LEFT", value: `${((o.detail ?? 0) * 1000).toFixed(0)} g` },
        { label: "LATENT HEAT USED", value: `${((game.control.cubes as number) * CUBE_MASS * 334).toFixed(1)} kJ` },
      ];
    }
    return [
      { label: "HEAT FLOW", value: `${BASE_POWER} W` },
      { label: "BASE THICKNESS", value: `${(game.control.thickness as number).toFixed(1)} mm` },
      { label: "TEMPERATURE DROP", value: `${o.headline.toFixed(2)} K` },
      { label: "BASE AREA", value: `${(Math.PI * POT_RADIUS ** 2 * 10000).toFixed(0)} cm²` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "boil") {
      const minutes = game.control.minutes as number;
      const points = Array.from({ length: 60 }, (_, i) => {
        const t = (20 * i) / 59;
        return { x: t, y: Math.min(100, 20 + (HOB_POWER * HOB_EFFICIENCY * t * 60) / (WATER_MASS * 4186)) };
      });
      return <LineChart description="Water temperature against heating time; it rises in a straight line until it reaches boiling." series={[{ label: "Water temperature", points }, { label: "Your time", dashed: true, points: [{ x: minutes, y: 0 }, { x: minutes, y: 110 }] }]} title="Heating the water" xDomain={[0, 20]} xLabel="Time (min)" yDomain={[0, 110]} yLabel="Temperature (°C)" />;
    }
    if (game.round.kind === "ice") {
      const points = Array.from({ length: 9 }, (_, i) => ({ x: i, y: calculateIcedDrink(DRINK_MASS, DRINK_START, i * CUBE_MASS).finalCelsius }));
      return <LineChart description="Final temperature of the drink against the number of ice cubes; with more than about four cubes some ice is left over at 0 degrees." series={[{ label: "Final temperature", points }, { label: "Target 10 °C", dashed: true, points: [{ x: 0, y: DRINK_TARGET }, { x: 8, y: DRINK_TARGET }] }]} title="Cooling the juice" xDomain={[0, 8]} xLabel="Ice cubes" yDomain={[0, 26]} yLabel="Final temperature (°C)" />;
    }
    const area = Math.PI * POT_RADIUS ** 2;
    const points = Array.from({ length: 60 }, (_, i) => {
      const mm = 1 + (29 * i) / 59;
      return { x: mm, y: (BASE_POWER * mm / 1000) / (ALUMINIUM_CONDUCTIVITY * area) };
    });
    return <LineChart description="Temperature drop across the pot base against its thickness; it grows in a straight line." series={[{ label: "Temperature drop", points }, { label: "Target 2 K", dashed: true, points: [{ x: 1, y: 2 }, { x: 30, y: 2 }] }, { label: "Your base", dashed: true, points: [{ x: game.control.thickness as number, y: 0 }, { x: game.control.thickness as number, y: 6 }] }]} title="Heat through the base" xDomain={[1, 30]} xLabel="Thickness (mm)" yDomain={[0, 6]} yLabel="Temperature drop (K)" />;
  },
});

import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { NEUTRON_MASS } from "../../../physics/core";
import { calculateElectronWavelengthFromVoltage, calculateWavelengthFromSpeed } from "../../../physics/quantum";
import { runMatter, waveOrParticle } from "./waveOrParticle";

export const WaveOrParticlePage = createNumericGamePage({
  definition: waveOrParticle,
  measurements: (game) => {
    const o = runMatter(game.round, game.control);
    return [
      { label: "WAVELENGTH", value: `${o.wavelengthNm.toFixed(4)} nm` },
      { label: "TARGET WAVELENGTH", value: `${o.targetWavelengthNm.toFixed(4)} nm` },
      { label: "FRINGE SPACING", value: o.fringeSpacingMm === null ? "—" : `${o.fringeSpacingMm.toFixed(3)} mm` },
      { label: game.round.kind === "neutron" ? "NEUTRON SPEED" : "VOLTAGE", value: game.round.kind === "neutron" ? `${game.control.speed} m/s` : `${game.control.volts} V` },
    ];
  },
  visual: (game) => {
    const o = runMatter(game.round, game.control);
    if (game.round.kind === "fringes") {
      const lambda = o.wavelengthNm * 1e-9;
      const points = Array.from({ length: 401 }, (_, i) => {
        const y = -1e-3 + (2e-3 * i) / 400;
        return { x: y * 1000, y: Math.cos((Math.PI * 1e-6 * y) / (lambda * 1)) ** 2 };
      });
      return <LineChart description={`Fringe pattern on the screen; bright fringes ${o.fringeSpacingMm?.toFixed(3)} millimeters apart.`} series={[{ label: "Relative intensity", points }]} title="Electron double-slit pattern" xDomain={[-1, 1]} xLabel="Position on the screen (mm)" yDomain={[0, 1.05]} yLabel="Relative intensity" />;
    }
    if (game.round.kind === "neutron") {
      const target = calculateElectronWavelengthFromVoltage(100) * 1e9;
      const points = Array.from({ length: 120 }, (_, i) => {
        const speed = 500 + (5500 * i) / 119;
        return { x: speed, y: calculateWavelengthFromSpeed(NEUTRON_MASS, speed) * 1e9 };
      });
      return <LineChart description="Wavelength of a neutron against its speed, with the electron's wavelength as a dashed line." series={[{ label: "Neutron", points }, { label: "Electron at 100 V", dashed: true, points: [{ x: 500, y: target }, { x: 6000, y: target }] }]} title="Matching wavelengths" xDomain={[500, 6000]} xLabel="Neutron speed (m/s)" yLabel="Wavelength (nm)" />;
    }
    const points = Array.from({ length: 120 }, (_, i) => {
      const volts = 10 + (490 * i) / 119;
      return { x: volts, y: calculateElectronWavelengthFromVoltage(volts) * 1e9 };
    });
    return <LineChart description={`Electron wavelength against accelerating voltage; at ${game.control.volts} volts it is ${o.wavelengthNm.toFixed(3)} nanometers.`} series={[{ label: "Wavelength", points }, { label: "Your voltage", dashed: true, points: [{ x: game.control.volts as number, y: 0 }, { x: game.control.volts as number, y: o.wavelengthNm }] }]} title="Electron wavelength" xDomain={[10, 500]} xLabel="Accelerating voltage (V)" yLabel="Wavelength (nm)" />;
  },
});

import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateMaximumKineticEnergyEv } from "../../../physics/quantum";
import { photoelectricLab, runLab } from "./photoelectricLab";

export const PhotoelectricLabPage = createNumericGamePage({
  definition: photoelectricLab,
  measurements: (game) => {
    const o = runLab(game.round, game.control);
    return [
      { label: "PHOTON ENERGY", value: `${o.photonEv.toFixed(2)} eV` },
      { label: "WORK FUNCTION", value: `${o.workFunctionEv.toFixed(2)} eV` },
      { label: "MAX ELECTRON ENERGY", value: `${o.kineticEnergyEv.toFixed(2)} eV` },
      { label: "THRESHOLD WAVELENGTH", value: `${o.thresholdNm.toFixed(0)} nm` },
    ];
  },
  visual: (game) => {
    const o = runLab(game.round, game.control);
    const byWork = game.round.kind === "metal";
    const points = Array.from({ length: 150 }, (_, i) => {
      if (byWork) {
        const work = 1.5 + (4.5 * i) / 149;
        return { x: work, y: calculateMaximumKineticEnergyEv(o.wavelengthNm, work) };
      }
      const nm = 200 + (500 * i) / 149;
      return { x: nm, y: calculateMaximumKineticEnergyEv(nm, o.workFunctionEv) };
    });
    const mark = byWork ? o.workFunctionEv : o.wavelengthNm;
    return (
      <LineChart
        description={`Maximum electron energy against ${byWork ? "work function" : "wavelength"}; at your setting it is ${o.kineticEnergyEv.toFixed(2)} electron-volts.`}
        series={[{ label: "Maximum kinetic energy", points }, { label: "Your setting", dashed: true, points: [{ x: mark, y: 0 }, { x: mark, y: Math.max(o.kineticEnergyEv, 0.1) }] }]}
        title="Photoelectric effect"
        xDomain={byWork ? [1.5, 6] : [200, 700]}
        xLabel={byWork ? "Work function (eV)" : "Wavelength (nm)"}
        yLabel="Maximum electron energy (eV)"
      />
    );
  },
});

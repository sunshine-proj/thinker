import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { ELECTRON_MASS } from "../../../physics/core";
import { calculateBarrierTransmissionEv, calculateBoxTransitionWavelength } from "../../../physics/quantum";
import { BARRIER, DOT, STM, quantumTunnel, runTunnel } from "./quantumTunnel";

export const QuantumTunnelPage = createNumericGamePage({
  definition: quantumTunnel,
  measurements: (game) => {
    const o = runTunnel(game.round, game.control);
    if (game.round.kind === "dot") {
      return [{ label: "PHOTON WAVELENGTH", value: `${o.headline.toFixed(0)} nm` }, { label: "TARGET", value: `${DOT.wavelengthNm} nm` }];
    }
    if (game.round.kind === "barrier") {
      return [{ label: "CHANCE OF TUNNELLING", value: `${(o.headline * 100).toFixed(3)} %` }];
    }
    return [{ label: "CURRENT FALLS BY", value: `${o.headline.toFixed(1)} ×` }];
  },
  visual: (game) => {
    if (game.round.kind === "dot") {
      const points = Array.from({ length: 86 }, (_, i) => {
        const width = 0.3 + (1.7 * i) / 85;
        return { x: width, y: calculateBoxTransitionWavelength(2, 1, ELECTRON_MASS, width * 1e-9) * 1e9 };
      });
      const width = game.control.width as number;
      return <LineChart description="Wavelength of the light from the 2 to 1 jump against box width; it grows as the square of the width." series={[{ label: "Emitted wavelength", points }, { label: "Orange 600 nm", dashed: true, points: [{ x: 0.3, y: 600 }, { x: 2, y: 600 }] }, { label: "Your box", dashed: true, points: [{ x: width, y: 0 }, { x: width, y: 1500 }] }]} title="Colour from size" xDomain={[0.3, 2]} xLabel="Box width (nm)" yDomain={[0, 1500]} yLabel="Wavelength (nm)" />;
    }
    const stm = game.round.kind === "stm";
    const energy = stm ? STM.energyEv : BARRIER.energyEv;
    const height = stm ? STM.heightEv : BARRIER.heightEv;
    const [from, to] = stm ? [0.4, 1.1] : [0.05, 1];
    const points = Array.from({ length: 80 }, (_, i) => {
      const width = from + ((to - from) * i) / 79;
      return { x: width, y: Math.log10(calculateBarrierTransmissionEv(energy, height, width, ELECTRON_MASS)) };
    });
    const width = stm ? STM.gapNm + (game.control.increase as number) : (game.control.width as number);
    return <LineChart description="Logarithm of the tunnelling probability against barrier width: a straight line falling steeply, because the probability decays exponentially with width." series={[{ label: "log₁₀ T", points }, { label: stm ? "Your new gap" : "Your width", dashed: true, points: [{ x: width, y: -12 }, { x: width, y: 0 }] }]} title="Tunnelling and width" xDomain={[from, to]} xLabel="Barrier width (nm)" yDomain={[-12, 0]} yLabel="log₁₀ (tunnelling probability)" />;
  },
});

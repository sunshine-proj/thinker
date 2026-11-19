import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateAmplification, calculatePendulumFrequency } from "../../../physics/waves";
import { BRIDGE, GLASS, SWING, resonanceSwing, runResonance } from "./resonanceSwing";

export const ResonanceSwingPage = createNumericGamePage({
  definition: resonanceSwing,
  measurements: (game) => {
    const o = runResonance(game.round, game.control);
    if (game.round.kind === "swing") {
      return [
        { label: "SWING'S NATURAL FREQUENCY", value: `${calculatePendulumFrequency(SWING.length).toFixed(3)} Hz` },
        { label: "AMPLIFICATION", value: `${o.headline.toFixed(1)} ×` },
      ];
    }
    if (game.round.kind === "glass") {
      return [{ label: "RESPONSE", value: `${(o.headline * 100).toFixed(0)} % of peak` }];
    }
    return [{ label: "PEAK AMPLIFICATION", value: `${o.headline.toFixed(1)} ×` }];
  },
  visual: (game) => {
    const kind = game.round.kind;
    const natural = kind === "swing" ? calculatePendulumFrequency(SWING.length) : kind === "glass" ? GLASS.naturalHz : BRIDGE.naturalHz;
    const zeta = kind === "swing" ? SWING.damping : kind === "glass" ? GLASS.damping : (game.control.damping as number);
    const [from, to] = kind === "swing" ? [0.1, 1] : kind === "glass" ? [870, 890] : [0.5, 3.5];
    const points = Array.from({ length: 401 }, (_, i) => {
      const f = from + ((to - from) * i) / 400;
      return { x: f, y: calculateAmplification(f, natural, zeta) };
    });
    const peak = Math.max(...points.map((p) => p.y));
    const f = kind === "bridge" ? natural : (game.control.frequency as number);
    return <LineChart description={`Amplification against driving frequency, peaking at the natural frequency of ${natural.toPrecision(4)} hertz. Less damping makes the peak higher and narrower.`} series={[{ label: "Amplification", points }, { label: kind === "bridge" ? "Walking pace" : "Your frequency", dashed: true, points: [{ x: f, y: 0 }, { x: f, y: peak * 1.05 }] }]} title="The resonance curve" xDomain={[from, to]} xLabel="Driving frequency (Hz)" yDomain={[0, peak * 1.05]} yLabel="Amplification (×)" />;
  },
});

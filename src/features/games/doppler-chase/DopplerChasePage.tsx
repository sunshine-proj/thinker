import { LineChart, ListenButtons } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateDopplerFrequency } from "../../../physics/waves";
import { AMBULANCE, CYCLIST, PASSBY, SOUND_SPEED, dopplerChase, runDoppler } from "./dopplerChase";

export const DopplerChasePage = createNumericGamePage({
  definition: dopplerChase,
  measurements: (game) => {
    const o = runDoppler(game.round, game.control);
    return [
      { label: "TRUE FREQUENCY", value: `${o.sourceHz.toFixed(0)} Hz` },
      { label: "HEARD AT YOUR SPEED", value: `${o.heardHz.toFixed(1)} Hz` },
      { label: "SPEED OF SOUND", value: `${SOUND_SPEED.toFixed(0)} m/s` },
    ];
  },
  visual: (game) => {
    const o = runDoppler(game.round, game.control);
    const cyclist = game.round.kind === "cyclist";
    const max = cyclist ? 30 : 60;
    const source = o.sourceHz;
    const approaching = Array.from({ length: 61 }, (_, i) => {
      const s = (max * i) / 60;
      return { x: s, y: cyclist ? calculateDopplerFrequency(source, SOUND_SPEED, s, 0) : calculateDopplerFrequency(source, SOUND_SPEED, 0, s) };
    });
    const receding = Array.from({ length: 61 }, (_, i) => {
      const s = (max * i) / 60;
      return { x: s, y: cyclist ? calculateDopplerFrequency(source, SOUND_SPEED, -s, 0) : calculateDopplerFrequency(source, SOUND_SPEED, 0, -s) };
    });
    const target = game.round.kind === "approach" ? AMBULANCE.heardHz : game.round.kind === "passby" ? PASSBY.approachHz : CYCLIST.heardHz;
    const speed = game.control.speed as number;
    return (
      <>
        <LineChart description="Frequency heard against speed. Coming closer raises the pitch (solid line); moving apart lowers it (dashed line)." series={[{ label: "Coming closer", points: approaching }, { label: "Moving apart", dashed: true, points: receding }, { label: "Heard", dashed: true, points: [{ x: 0, y: target }, { x: max, y: target }] }, { label: "Your speed", dashed: true, points: [{ x: speed, y: source * 0.8 }, { x: speed, y: source * 1.25 }] }]} title="Pitch and speed" xDomain={[0, max]} xLabel="Speed (m/s)" yDomain={[source * 0.8, source * 1.25]} yLabel="Frequency heard (Hz)" />
        <ListenButtons
          tones={[
            { label: "Play the true pitch", frequency: source },
            { label: "Play the pitch at your speed", frequency: o.heardHz },
            { label: "Play what you heard", frequency: target },
          ]}
        />
      </>
    );
  },
});

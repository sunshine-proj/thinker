import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { addVelocities, calculateContractedLength, calculateLorentzFactor, calculateTwinTrip } from "../../../physics/astronomy";
import { HANGAR, PROBE, TWINS, lightspeedVoyager, runVoyager } from "./lightspeedVoyager";

export const LightspeedVoyagerPage = createNumericGamePage({
  definition: lightspeedVoyager,
  measurements: (game) => {
    const beta = game.control.beta as number;
    const o = runVoyager(game.round, game.control);
    const gamma = { label: "LORENTZ FACTOR γ", value: calculateLorentzFactor(beta).toFixed(3) };
    if (game.round.kind === "twins") {
      const trip = calculateTwinTrip(TWINS.distance, beta);
      return [gamma, { label: "EARTH YEARS", value: trip.homeYears.toFixed(1) }, { label: "CREW YEARS", value: o.headline.toFixed(2) }];
    }
    if (game.round.kind === "hangar") {
      return [gamma, { label: "SHIP LENGTH SEEN FROM THE HANGAR", value: `${o.headline.toFixed(1)} m` }];
    }
    return [{ label: "SIMPLE ADDITION (WRONG)", value: `${(PROBE.ship + PROBE.probe).toFixed(2)}c` }, { label: "YOUR ANSWER", value: `${beta.toFixed(3)}c` }];
  },
  visual: (game) => {
    const beta = game.control.beta as number;
    if (game.round.kind === "probe") {
      const points = Array.from({ length: 50 }, (_, i) => {
        const u = (0.99 * i) / 49;
        return { x: u, y: addVelocities(PROBE.ship, u) };
      });
      return <LineChart description="Speed of the probe relative to Earth against its launch speed from a ship moving at 0.6 c. It approaches but never reaches the speed of light." series={[{ label: "Relativistic sum", points }, { label: "Speed of light", dashed: true, points: [{ x: 0, y: 1 }, { x: 1, y: 1 }] }]} title="Adding speeds" xDomain={[0, 1]} xLabel="Probe speed relative to the ship (c)" yDomain={[0.5, 1.05]} yLabel="Speed relative to Earth (c)" />;
    }
    const hangar = game.round.kind === "hangar";
    const points = Array.from({ length: 100 }, (_, i) => {
      const b = 0.5 + (0.499 * i) / 99;
      return { x: b, y: hangar ? calculateContractedLength(HANGAR.shipLength, b) : calculateTwinTrip(TWINS.distance, b).travellerYears };
    });
    const target = hangar ? HANGAR.hangarLength : TWINS.crewYears;
    return <LineChart description={hangar ? "Length of the 100 meter ship as measured from the hangar, against its speed. It shrinks sharply close to the speed of light." : "Years the crew ages on the 24 light-year round trip, against ship speed. Close to light speed it drops sharply."} series={[{ label: hangar ? "Measured length" : "Crew years", points }, { label: hangar ? "Hangar 50 m" : "Target 5 years", dashed: true, points: [{ x: 0.5, y: target }, { x: 1, y: target }] }, { label: "Your speed", dashed: true, points: [{ x: beta, y: 0 }, { x: beta, y: hangar ? 100 : 45 }] }]} title={hangar ? "Length contraction" : "Time dilation"} xDomain={[0.5, 1]} xLabel="Ship speed (c)" yDomain={hangar ? [0, 100] : [0, 45]} yLabel={hangar ? "Length (m)" : "Crew years"} />;
  },
});

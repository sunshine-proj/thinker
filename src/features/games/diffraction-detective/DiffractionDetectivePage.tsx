import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateGratingAngle, calculateSingleSlitIntensity } from "../../../physics/optics";
import { CD_ANGLE, CD_LASER_NM, GRATING_SPACING, HAIR_LASER_NM, HAIR_MINIMUM_SPACING_CM, LASER_ANGLE, SCREEN_DISTANCE, diffractionDetective, runDiffraction } from "./diffractionDetective";

export const DiffractionDetectivePage = createNumericGamePage({
  definition: diffractionDetective,
  measurements: (game) => {
    const o = runDiffraction(game.round, game.control);
    if (game.round.kind === "hair") {
      return [
        { label: "DARK GAPS APART (YOUR HAIR)", value: `${o.headline.toFixed(2)} cm` },
        { label: "MEASURED", value: `${HAIR_MINIMUM_SPACING_CM} cm` },
      ];
    }
    return [
      { label: "FIRST ORDER (YOUR ANSWER)", value: `${o.headline.toFixed(2)}°` },
      { label: "MEASURED", value: `${game.round.kind === "laser" ? LASER_ANGLE : CD_ANGLE}°` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "hair") {
      const width = (game.control.width as number) * 1e-6;
      const points = Array.from({ length: 201 }, (_, i) => {
        const y = -0.04 + (0.08 * i) / 200;
        return { x: y * 100, y: calculateSingleSlitIntensity(width, HAIR_LASER_NM * 1e-9, SCREEN_DISTANCE, y) };
      });
      return <LineChart description="Diffraction pattern of the hair on the wall for your width: a bright centre with dark gaps either side. Measured dark gaps are 1 centimeter either side of the centre." series={[{ label: "Brightness", points }, { label: "Measured gap", dashed: true, points: [{ x: 1, y: 0 }, { x: 1, y: 1 }] }, { label: "Measured gap ", dashed: true, points: [{ x: -1, y: 0 }, { x: -1, y: 1 }] }]} title="The hair's pattern" xDomain={[-4, 4]} xLabel="Position on the wall (cm)" yDomain={[0, 1.05]} yLabel="Relative brightness" />;
    }
    const laser = game.round.kind === "laser";
    const points = laser
      ? Array.from({ length: 75 }, (_, i) => {
          const nm = 380 + (370 * i) / 74;
          return { x: nm, y: calculateGratingAngle(GRATING_SPACING, nm * 1e-9) };
        })
      : Array.from({ length: 91 }, (_, i) => {
          const um = 0.7 + (4.3 * i) / 90;
          return { x: um, y: calculateGratingAngle(um * 1e-6, CD_LASER_NM * 1e-9) };
        });
    const measured = laser ? LASER_ANGLE : CD_ANGLE;
    return <LineChart description={laser ? "First-order angle against wavelength for a 600 lines per millimetre grating: longer wavelengths bend more." : "First-order angle of a 650 nanometer laser against track spacing: closer tracks bend light more."} series={[{ label: "First-order angle", points }, { label: "Measured", dashed: true, points: laser ? [{ x: 380, y: measured }, { x: 750, y: measured }] : [{ x: 0.7, y: measured }, { x: 5, y: measured }] }]} title={laser ? "Grating angle and colour" : "Track spacing and angle"} xDomain={laser ? [380, 750] : [0.7, 5]} xLabel={laser ? "Wavelength (nm)" : "Track spacing (µm)"} yLabel="Angle (°)" />;
  },
});

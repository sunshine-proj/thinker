import { LineChart } from "../../../components/common";
import { createNumericGamePage } from "../../../game-engine/rounds";
import { calculateTwoBeamFactor, hasOneInversion } from "../../../physics/optics";
import { COATING_INDEX, COLOUR_THICKNESS, GLASS_INDEX, GREEN, SOAP_INDEX, runFilm, soapBubbleColours } from "./soapBubbleColours";

export const SoapBubbleColoursPage = createNumericGamePage({
  definition: soapBubbleColours,
  measurements: (game) => {
    const o = runFilm(game.round, game.control);
    if (game.round.kind === "colour") {
      return [
        { label: "EXTRA PATH 2nt", value: `${(2 * SOAP_INDEX * COLOUR_THICKNESS).toFixed(0)} nm` },
        { label: "REFLECTION AT YOUR λ", value: `${(calculateTwoBeamFactor(COLOUR_THICKNESS, SOAP_INDEX, game.control.wavelength as number, true) * 100).toFixed(0)} %` },
      ];
    }
    const index = game.round.kind === "soap" ? SOAP_INDEX : COATING_INDEX;
    return [
      { label: "EXTRA PATH 2nt", value: `${(2 * index * (game.control.thickness as number)).toFixed(0)} nm` },
      { label: "GREEN REFLECTION", value: `${(o.headline * 100).toFixed(0)} % of maximum` },
    ];
  },
  visual: (game) => {
    if (game.round.kind === "colour") {
      const points = Array.from({ length: 75 }, (_, i) => {
        const lambda = 380 + (370 * i) / 74;
        return { x: lambda, y: calculateTwoBeamFactor(COLOUR_THICKNESS, SOAP_INDEX, lambda, true) };
      });
      const lambda = game.control.wavelength as number;
      return <LineChart description="Relative reflection of a 300 nanometer soap film across the visible spectrum; it peaks in the green near 532 nanometers." series={[{ label: "Reflection", points }, { label: "Your wavelength", dashed: true, points: [{ x: lambda, y: 0 }, { x: lambda, y: 1 }] }]} title="The film's colour" xDomain={[380, 750]} xLabel="Wavelength (nm)" yDomain={[0, 1.05]} yLabel="Relative reflection" />;
    }
    const soap = game.round.kind === "soap";
    const index = soap ? SOAP_INDEX : COATING_INDEX;
    const one = soap ? true : hasOneInversion(1, COATING_INDEX, GLASS_INDEX);
    const points = Array.from({ length: 79 }, (_, i) => {
      const t = 10 + (390 * i) / 78;
      return { x: t, y: calculateTwoBeamFactor(t, index, GREEN, one) };
    });
    const t = game.control.thickness as number;
    return <LineChart description={`Relative reflection of 550 nanometer green light against film thickness for ${soap ? "a soap film in air" : "a coating on glass"}. It rises and falls every quarter wavelength in the film.`} series={[{ label: "Green reflection", points }, { label: "Your thickness", dashed: true, points: [{ x: t, y: 0 }, { x: t, y: 1 }] }]} title={soap ? "Soap film" : "Anti-reflection coating"} xDomain={[10, 400]} xLabel="Thickness (nm)" yDomain={[0, 1.05]} yLabel="Relative reflection" />;
  },
});

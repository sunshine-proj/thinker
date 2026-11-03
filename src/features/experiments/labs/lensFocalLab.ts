import { calculateConjugatePositions, calculateImageDistance, calculateMagnification } from "../../../physics/optics";
import { createMeasurement } from "../../../simulation/measurements";
import type { LabDefinition } from "./labTypes";

export const LENS_LAB_ID = "lens-focal-length";

export const lensFocalLab: LabDefinition = {
  id: LENS_LAB_ID,
  name: "Lens Focal Length",
  eyebrow: "EXPERIMENT LAB · OPTICS",
  introduction: "Place an object in front of a converging lens, find where its image forms, and measure the lens's focal length three ways: from one object–image pair, from a straight-line graph of 1/v against 1/u, and by Bessel's two-position method.",
  assumptions: "A thin converging lens with paraxial rays (no aberrations), light travelling left to right, real-is-positive sign convention for the image distance (a negative image distance is a virtual image on the object's side), and perfectly precise distance readings. Real measurements would scatter by the reading error of the ruler.",
  controls: [
    { kind: "number", key: "focal", label: "True focal length of the lens", unit: "cm", minimum: 5, maximum: 50, step: 0.5, initial: 20 },
    { kind: "number", key: "object", label: "Object distance u", unit: "cm", minimum: 3, maximum: 150, step: 1, initial: 60 },
    { kind: "number", key: "height", label: "Object height", unit: "cm", minimum: 1, maximum: 10, step: 0.5, initial: 3 },
    { kind: "number", key: "separation", label: "Object–screen distance D (Bessel method)", unit: "cm", minimum: 10, maximum: 300, step: 1, initial: 100 },
  ],
  describe: (v) => `f ${v.focal} cm · u ${v.object} cm · object ${v.height} cm · D ${v.separation} cm`,
  run(v) {
    const f = v.focal as number;
    const u = v.object as number;
    const h = v.height as number;
    const D = v.separation as number;
    const image = calculateImageDistance(f, u);
    const magnification = image === null ? null : calculateMagnification(u, image);
    const positions = D > 4 * f ? calculateConjugatePositions(f, D) : [];
    const bessel = positions.length === 2 ? (D * D - (positions[1]! - positions[0]!) ** 2) / (4 * D) : null;
    const estimate = image === null || image === 0 ? null : (u * image) / (u + image);
    const reciprocal = Array.from({ length: 60 }, (_, i) => {
      const x = (100 / f) * (0.05 + (0.9 * i) / 59);
      return { x, y: 100 / f - x };
    });
    const curve = Array.from({ length: 80 }, (_, i) => {
      const distance = f * 1.05 + ((f * 6 - f * 1.05) * i) / 79;
      return { x: distance, y: calculateImageDistance(f, distance) ?? 0 };
    });
    const kind = image === null ? "No image forms" : image > 0 ? "Real, inverted" : "Virtual, upright";
    return {
      measurements: [
        createMeasurement("image", "Image distance v", image, "cm"),
        createMeasurement("magnification", "Magnification", magnification, "×"),
        createMeasurement("imageHeight", "Image height", magnification === null ? null : Math.abs(magnification) * h, "cm"),
        createMeasurement("power", "Lens power", 100 / f, "D"),
        createMeasurement("fromPair", "Focal length from u and v", estimate, "cm"),
        createMeasurement("besselShift", "Lens shift between sharp positions", positions.length === 2 ? positions[1]! - positions[0]! : null, "cm"),
        createMeasurement("besselFocal", "Focal length by Bessel's method", bessel, "cm"),
      ],
      charts: [
        {
          title: "Image distance against object distance",
          description: `Image distance in centimeters against object distance for a lens of focal length ${f} centimeters; the image runs off to infinity as the object approaches the focal point. At u = ${u} it is ${image === null ? "undefined" : image.toFixed(1)} centimeters.`,
          xLabel: "Object distance u (cm)", yLabel: "Image distance v (cm)",
          series: [{ label: "v(u)", points: curve }, { label: "Your object", dashed: true, points: [{ x: u, y: 0 }, { x: u, y: Math.max(image ?? 0, 0) }] }],
          xDomain: [f * 1.05, f * 6],
        },
        {
          title: "The straight-line graph of 1/v against 1/u",
          description: `Plotting 1/v against 1/u gives a straight line of slope −1 that crosses each axis at 1/f = ${(100 / f).toFixed(2)} per meter; the intercept measures the focal length.`,
          xLabel: "1/u (m⁻¹)", yLabel: "1/v (m⁻¹)",
          series: [{ label: "1/v = 1/f − 1/u", points: reciprocal }, ...(image !== null && image > 0 ? [{ label: "Your pair", dashed: true, points: [{ x: 100 / u - 0.3, y: 100 / image }, { x: 100 / u + 0.3, y: 100 / image }] }] : [])],
        },
      ],
      explanations: [
        image === null
          ? { title: "The object is at the focal point", text: "Rays from a point at the focal distance leave the lens parallel, so no image forms at any finite distance." }
          : { title: kind, text: image > 0 ? `With the object beyond the focal length (u = ${u} cm > f = ${f} cm) the lens focuses the light to a real, inverted image on a screen at v = ${image.toFixed(1)} cm. The magnification is ${magnification!.toFixed(2)}, so the ${h} cm object appears ${(Math.abs(magnification!) * h).toFixed(1)} cm tall.` : `Inside the focal length (u < f) the lens cannot bring the rays together; they only seem to diverge from a virtual, upright, magnified image ${Math.abs(image).toFixed(1)} cm behind the object. This is how a magnifying glass works (magnification ${magnification!.toFixed(2)}).` },
        { title: "Focal length from one pair", text: estimate === null ? "No real image, so there is no measurable pair." : `The thin lens equation 1/f = 1/u + 1/v gives f = uv/(u + v) = ${estimate.toFixed(2)} cm, the true ${f} cm. Real measurements scatter, so averaging many pairs (or fitting the straight line) is better.` },
        { title: "Bessel's two-position method", text: bessel === null ? `Bessel's method needs a screen at least 4f from the object (D > ${(4 * f).toFixed(0)} cm). With D = ${D} cm the lens cannot form a sharp image at all.` : `With the object and screen ${D} cm apart there are two lens positions that give a sharp image, ${(positions[1]! - positions[0]!).toFixed(1)} cm apart. Then f = (D² − d²)/4D = ${bessel.toFixed(2)} cm. It only needs distances between the lens positions, not the position of the lens center.` },
      ],
    };
  },
};

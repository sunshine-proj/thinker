import { SOUND_SPEED_20C, calculatePathDifference, calculateRelativeIntensity, calculateWavelength, classifyInterference } from "../../../physics/waves";
import { createMeasurement } from "../../../simulation/measurements";
import type { LabDefinition } from "./labTypes";

export const WAVE_LAB_ID = "wave-interference-lab";
const HALF_WIDTH = 5;

export const waveInterferenceLab: LabDefinition = {
  id: WAVE_LAB_ID,
  name: "Sound Interference Lab",
  eyebrow: "EXPERIMENT LAB · WAVES",
  introduction: "Two loudspeakers play the same tone. Walk along a line in front of them, find the loud and silent places, and see how the frequency, the distance between the speakers and your position change the pattern.",
  assumptions: "Two small speakers in phase with equal strength in a quiet, echo-free room (a free field), sound speed 343 m/s, equal amplitudes at the listener (the small difference in distance is ignored for amplitude) and a listening line parallel to the line joining the speakers. The intensity is relative to the maximum, cos²(πΔ/λ).",
  controls: [
    { kind: "number", key: "frequency", label: "Frequency", unit: "Hz", minimum: 100, maximum: 1000, step: 5, initial: 343 },
    { kind: "number", key: "separation", label: "Speaker separation", unit: "m", minimum: 0.5, maximum: 5, step: 0.1, initial: 2 },
    { kind: "number", key: "distance", label: "Distance to the listening line", unit: "m", minimum: 1, maximum: 10, step: 0.5, initial: 4 },
    { kind: "number", key: "position", label: "Your position along the line", unit: "m", minimum: -HALF_WIDTH, maximum: HALF_WIDTH, step: 0.05, initial: 1 },
  ],
  describe: (v) => `${v.frequency} Hz · speakers ${v.separation} m apart · line at ${v.distance} m · at x ${v.position} m`,
  run(v) {
    const frequency = v.frequency as number;
    const d = v.separation as number;
    const L = v.distance as number;
    const wavelength = calculateWavelength(frequency, SOUND_SPEED_20C);
    const a = { x: -d / 2, y: 0 };
    const b = { x: d / 2, y: 0 };
    const intensityAt = (x: number) => calculateRelativeIntensity(calculatePathDifference({ x, y: L }, a, b), wavelength);
    const delta = calculatePathDifference({ x: v.position as number, y: L }, a, b);
    const intensity = intensityAt(v.position as number);
    const samples = Array.from({ length: 501 }, (_, i) => {
      const x = -HALF_WIDTH + (2 * HALF_WIDTH * i) / 500;
      return { x, y: intensityAt(x) };
    });
    let loud = 0;
    let quiet = 0;
    for (let i = 1; i < samples.length - 1; i += 1) {
      const y = samples[i]!.y;
      if (y > samples[i - 1]!.y && y >= samples[i + 1]!.y) loud += 1;
      if (y < samples[i - 1]!.y && y <= samples[i + 1]!.y) quiet += 1;
    }
    const maxOrder = Math.floor(d / wavelength);
    const spacing = (wavelength * L) / d;
    const kind = classifyInterference(intensity);
    return {
      measurements: [
        createMeasurement("wavelength", "Wavelength", wavelength, "m"),
        createMeasurement("pathDifference", "Path difference at your position", delta, "m"),
        createMeasurement("inWavelengths", "Path difference in wavelengths", delta / wavelength, ""),
        createMeasurement("intensity", "Relative intensity there", intensity * 100, "%"),
        createMeasurement("loudSpots", "Loud spots along the line", loud, ""),
        createMeasurement("quietSpots", "Silent spots along the line", quiet, ""),
        createMeasurement("spacing", "Far-field spacing of loud spots", spacing, "m"),
      ],
      charts: [{
        title: "Loudness along the listening line",
        description: `Relative intensity along a line ${L} meters in front of two speakers ${d} meters apart playing ${frequency} hertz. There are ${loud} loud and ${quiet} silent spots within ${HALF_WIDTH} meters of the center. At your position the intensity is ${(intensity * 100).toFixed(0)} percent.`,
        xLabel: "Position along the line (m)", yLabel: "Relative intensity",
        series: [{ label: "Intensity", points: samples }, { label: "You", dashed: true, points: [{ x: v.position as number, y: 0 }, { x: v.position as number, y: 1 }] }],
        xDomain: [-HALF_WIDTH, HALF_WIDTH], yDomain: [0, 1.05],
      }],
      explanations: [
        { title: `At your position it is ${kind}`, text: `The path difference is ${delta.toFixed(3)} m, ${(delta / wavelength).toFixed(2)} wavelengths (λ = ${wavelength.toFixed(3)} m). A whole number of wavelengths gives loud (constructive), an odd number of half-wavelengths gives silence (destructive). Here the intensity is ${(intensity * 100).toFixed(1)} % of the maximum.` },
        { title: "Frequency sets the spacing", text: `A higher frequency means a shorter wavelength, so the path difference passes through more whole wavelengths along the line: the loud spots are about λL/d = ${spacing.toFixed(2)} m apart (far-field estimate). Doubling the frequency roughly halves that spacing.` },
        { title: "Speaker separation sets how many fringes", text: `The speakers are ${d} m apart, so the largest possible path difference is ${d} m = ${(d / wavelength).toFixed(1)} wavelengths: at most ${2 * maxOrder + 1} loud directions exist (${maxOrder} on each side of the center). If the speakers are closer than half a wavelength there is only the central loud maximum.` },
        { title: "Why a quiet room matters", text: "Real rooms add echoes that fill in the silent spots, so the pattern is easiest to hear outdoors or in a damped room. The same maths describes the bright and dark fringes of a double slit with light." },
      ],
    };
  },
};

import { calculateDragCoefficient, calculateLevelFlightSpeed, calculateLiftCoefficient } from "../../physics/fluids";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, cloud, sky, sun } from "./scenery";

const PARASITIC_DRAG = 0.06;
const SPAN_EFFICIENCY = 0.8;
const MAX_LIFT = 0.8;
const PLANE_MASS = 0.005;
const WING_AREA = 0.02;
const FLIGHT_SECONDS = 3;

interface Contest { readonly title: string; readonly goal: string; readonly launchHeight: number; readonly zone: readonly [number, number] }
export const CONTESTS: readonly Contest[] = [
  { title: "Playground throw", goal: "Thrown from 1.5 m, glide at least 7 m.", launchHeight: 1.5, zone: [7, 100] },
  { title: "School record", goal: "From 1.5 m again, beat the school record of 12 m.", launchHeight: 1.5, zone: [12, 100] },
  { title: "Land on the mat", goal: "From the 6 m balcony, land on the mat 36–42 m away. Not too far!", launchHeight: 6, zone: [36, 42] },
];

/** A steady glide: the plane descends along a line whose slope is D/L, so it travels h·(L/D). */
export function glide(level: number, aspectRatio: number, angleDegrees: number) {
  const contest = CONTESTS[level] as Contest;
  const lift = calculateLiftCoefficient((angleDegrees * Math.PI) / 180, aspectRatio, MAX_LIFT);
  if (lift.stalled || lift.value <= 0) {
    // A stalled or flat-winged plane cannot make enough lift and noses down almost steeply.
    return { stalled: lift.stalled, ratio: 0.5, distance: contest.launchHeight * 0.5, speed: null };
  }
  const ratio = lift.value / calculateDragCoefficient(lift.value, PARASITIC_DRAG, aspectRatio, SPAN_EFFICIENCY);
  return { stalled: false, ratio, distance: contest.launchHeight * ratio, speed: calculateLevelFlightSpeed(PLANE_MASS, WING_AREA, lift.value) };
}

export interface PlaneState { readonly throws: number; readonly flight: ReturnType<typeof glide> | null; readonly time: number }

export const paperPlaneContest: LiveGameDefinition<PlaneState> = {
  id: "paper-plane-contest",
  title: "Paper Plane Contest",
  worldId: "fluids",
  eyebrow: "PLAYGROUND · LIFT AND DRAG",
  modelTag: "GLIDE DISTANCE = h × L/D",
  introduction: "Fold the best paper plane in school! Choose the shape of its wings and how much its nose points up, then throw.",
  howToPlay: "Set the wing shape (long and thin, or short and wide) and the nose-up angle, then press Throw (Space or Enter).",
  physics: "As the plane glides, air pushes up on its wings (lift) and holds it back (drag). It sinks a little for every metre it flies forward, and the better the lift-to-drag ratio L/D, the farther it goes: distance = launch height × L/D. Tilting the nose up makes more lift, up to a point; too much and the air stops flowing smoothly over the wing: the plane stalls and drops. Long, thin wings waste less energy in swirls at the wing tips, so they glide better.",
  assumptions: "A steady straight glide in still air (thrown gently, so the throw speed adds nothing), a 5 g plane with 200 cm² of wing, thin-wing lift with slope 2πAR/(AR + 2), drag C_D = 0.06 + C_L²/(π·0.8·AR), a stall at C_L = 0.8 after which the plane drops at about 2 m down per metre forward.",
  levels: CONTESTS.map((contest, index) => ({ id: `contest-${index + 1}`, title: contest.title, goal: contest.goal })),
  sliders: () => [
    { key: "aspect", label: "Wing shape (span² ÷ area)", unit: "", minimum: 1, maximum: 8, step: 0.1, initial: 2 },
    { key: "angle", label: "Nose-up angle", unit: "°", minimum: 0, maximum: 20, step: 0.1, initial: 5 },
  ],
  actions: [{ id: "throw", label: "Throw!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 30, timeScale: 1 },
  create: () => ({ throws: 0, flight: null, time: 0 }),
  step(state, input, dt, level) {
    if (state.flight && state.time < FLIGHT_SECONDS) return { ...state, time: state.time + dt };
    if (!input.pressed.has("throw")) return state;
    return { throws: state.throws + 1, flight: glide(level, input.values.aspect ?? 2, input.values.angle ?? 5), time: 0 };
  },
  verdict(state, level) {
    const contest = CONTESTS[level] as Contest;
    if (!state.flight) return { status: "playing", message: "Fold your plane and throw it." };
    if (state.time < FLIGHT_SECONDS) return { status: "playing", message: "Whoosh…" };
    const distance = state.flight.distance;
    if (distance >= contest.zone[0] && distance <= contest.zone[1]) return { status: "won", message: `It glided ${distance.toFixed(1)} m!` };
    if (state.flight.stalled) return { status: "playing", message: "The nose was too high: the wings stalled and the plane dropped. Lower the angle." };
    return { status: "playing", message: distance < contest.zone[0] ? `${distance.toFixed(1)} m: not far enough. Try longer wings or a better angle.` : `${distance.toFixed(1)} m: you overshot the mat!` };
  },
  stars: (state) => (state.throws <= 2 ? 3 : state.throws <= 4 ? 2 : 1),
  readouts: (state, input, level) => {
    const preview = glide(level, input.values.aspect ?? 2, input.values.angle ?? 5);
    return [
      { label: "LIFT ÷ DRAG", value: preview.stalled ? "stalled!" : preview.ratio.toFixed(2) },
      { label: "GLIDE SPEED", value: preview.speed ? `${preview.speed.toFixed(1)} m/s` : "—" },
      { label: "LAST THROW", value: state.flight && state.time >= FLIGHT_SECONDS ? `${state.flight.distance.toFixed(1)} m` : "—" },
    ];
  },
  draw(context, state, input, width, height, level) {
    const contest = CONTESTS[level] as Contest;
    sky(context, width, height);
    sun(context, width - 50, 40);
    cloud(context, width * 0.4, 60);
    const far = Math.max(contest.zone[0] * 1.3, contest.zone[1] === 100 ? contest.zone[0] * 1.4 : contest.zone[1] * 1.15);
    const scaleX = (width - 40) / far;
    const scaleY = Math.min(scaleX * 3, (height - 70) / (contest.launchHeight * 1.2));
    const at = (x: number, y: number) => ({ x: 20 + x * scaleX, y: height - 30 - y * scaleY });
    context.fillStyle = PLAYGROUND_COLOURS.grass;
    context.fillRect(0, height - 30, width, 30);
    context.fillStyle = "rgb(81 207 102 / 60%)";
    const zoneEnd = Math.min(contest.zone[1], far);
    context.fillRect(at(contest.zone[0], 0).x, height - 30, (zoneEnd - contest.zone[0]) * scaleX, 8);
    badge(context, contest.zone[1] === 100 ? `${contest.zone[0]} m +` : `mat ${contest.zone[0]}–${contest.zone[1]} m`, at(contest.zone[0], 0).x, height - 36, "#2b8a3e");
    context.fillStyle = "#adb5bd";
    context.fillRect(0, at(0, contest.launchHeight).y, 24, contest.launchHeight * scaleY);
    const flight = state.flight;
    const progress = flight ? Math.min(1, state.time / FLIGHT_SECONDS) : 0;
    const x = flight ? flight.distance * progress : 0;
    const y = contest.launchHeight * (1 - progress);
    const p = at(x, y);
    const nose = ((input.values.angle ?? 5) * Math.PI) / 180;
    const span = 10 + (input.values.aspect ?? 2) * 3;
    context.fillStyle = PLAYGROUND_COLOURS.white;
    context.strokeStyle = PLAYGROUND_COLOURS.ink;
    context.save();
    context.translate(p.x, p.y);
    context.rotate(-nose);
    context.beginPath();
    context.moveTo(22, 0);
    context.lineTo(-span, -6);
    context.lineTo(-span * 0.6, 0);
    context.lineTo(-span, 6);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  },
  describe: (state, input, level) => {
    const preview = glide(level, input.values.aspect ?? 2, input.values.angle ?? 5);
    return `Wings of aspect ratio ${(input.values.aspect ?? 2).toFixed(1)} at ${(input.values.angle ?? 5).toFixed(1)} degrees: ${preview.stalled ? "stalled" : `lift-to-drag ${preview.ratio.toFixed(2)}`}, a glide of ${preview.distance.toFixed(1)} metres. ${state.throws} throws so far.`;
  },
};

import { STANDARD_GRAVITY } from "../../physics/core";
import { advanceProjectile, calculateBottomGForce, calculateSlopeAcceleration, calculateSpeedAtBottom, launchProjectile, type ProjectileState } from "../../physics/mechanics";
import type { LiveGameDefinition } from "../../game-engine/live/liveTypes";
import { PLAYGROUND_COLOURS, badge, cloud, sky, sun } from "./scenery";

const RAMP_ANGLE = 35;
/** Rolling friction of skateboard wheels plus air, as an effective coefficient. */
const ROLLING = 0.08;
const RUN_UP = 2;
const LOOP_RADIUS = 1.5;
const MAX_LOOP_G = 7;

interface Course { readonly title: string; readonly goal: string; readonly kind: "jump" | "spin" | "loop"; readonly landFrom?: number; readonly landTo?: number; readonly airtime?: number }
export const COURSES: readonly Course[] = [
  { title: "First jump", goal: "Drop in, fly off the kicker and land on the deck between 3 m and 5 m away.", kind: "jump", landFrom: 3, landTo: 5 },
  { title: "Spin trick", goal: "Stay in the air for at least 1 second to spin, and land between 4 m and 7 m away.", kind: "spin", landFrom: 4, landTo: 7, airtime: 1 },
  { title: "Loop the loop", goal: "Make it all the way round the 1.5 m loop without falling, and without going so fast the loop squashes you (more than 7 g).", kind: "loop" },
];

type Phase = "ready" | "ramp" | "flat" | "air" | "loop" | "landed" | "crashed";

export interface SkateState {
  readonly phase: Phase;
  /** Distance along the current section, m. */
  readonly distance: number;
  readonly speed: number;
  readonly flight: ProjectileState | null;
  readonly airtime: number;
  readonly loopAngle: number;
  readonly landingX: number | null;
  readonly message: string;
  readonly launchSpeed: number;
}

const rampLength = (height: number) => height / Math.sin((RAMP_ANGLE * Math.PI) / 180);

/** Speed (m/s) at the bottom of the drop-in ramp, with rolling friction. */
export function dropInSpeed(height: number): number {
  return calculateSpeedAtBottom(rampLength(height), RAMP_ANGLE, ROLLING);
}

export const skatePark: LiveGameDefinition<SkateState> = {
  id: "skate-park",
  title: "Skate Park",
  worldId: "everyday",
  eyebrow: "PLAYGROUND · ENERGY AND MOTION",
  modelTag: "ENERGY · PROJECTILE · LOOP",
  introduction: "Pick how high to drop in and how steep the kicker is, then send your skater flying. Land the jumps, spin in the air and make it round the giant loop!",
  howToPlay: "Set the drop-in height (and the kicker angle on jump levels) with the sliders, then press Drop in (Space or Enter).",
  physics: "Going down the ramp, height energy turns into speed: the higher you start, the faster you go, although friction steals a little. Off the kicker you fly like a ball: a faster take-off and an angle near 45° go farther, and a steeper angle keeps you in the air longer for tricks. In the loop you need enough speed at the top (v² ≥ g r) or you fall, but too much speed squashes you at the bottom.",
  assumptions: "A straight 35° drop-in ramp with an effective rolling-friction coefficient of 0.08, a 2 m flat run-up with no losses, take-off and landing at the same height, no air resistance in flight, and a loop entered without losses. The skater is treated as a point.",
  levels: COURSES.map((course, index) => ({ id: `course-${index + 1}`, title: course.title, goal: course.goal })),
  sliders: (level) => [
    { key: "height", label: "Drop-in height", unit: "m", minimum: 0.5, maximum: 6, step: 0.05, initial: 1.5 },
    ...((COURSES[level] as Course).kind === "loop" ? [] : [{ key: "kicker", label: "Kicker angle", unit: "°", minimum: 15, maximum: 60, step: 1, initial: 30 }]),
  ],
  actions: [{ id: "go", label: "Drop in!", keys: [" ", "Enter"] }],
  timing: { fixedTimeStepSeconds: 1 / 120, timeScale: 1 },
  create: () => ({ phase: "ready", distance: 0, speed: 0, flight: null, airtime: 0, loopAngle: 0, landingX: null, message: "Set up your run, then drop in.", launchSpeed: 0 }),
  step(state, input, dt, level) {
    const course = COURSES[level] as Course;
    const height = input.values.height ?? 1.5;
    switch (state.phase) {
      case "ready":
        return input.pressed.has("go") ? { ...state, phase: "ramp", distance: 0, speed: 0, message: "Dropping in!" } : state;
      case "ramp": {
        const a = calculateSlopeAcceleration(RAMP_ANGLE, ROLLING);
        const speed = state.speed + a * dt;
        const distance = state.distance + state.speed * dt + 0.5 * a * dt * dt;
        if (distance >= rampLength(height)) {
          const exact = dropInSpeed(height);
          return { ...state, phase: "flat", distance: 0, speed: exact, launchSpeed: exact, message: `${exact.toFixed(1)} m/s at the bottom!` };
        }
        return { ...state, speed, distance };
      }
      case "flat": {
        const distance = state.distance + state.speed * dt;
        if (distance < RUN_UP) {
          return { ...state, distance };
        }
        if (course.kind === "loop") {
          return { ...state, phase: "loop", loopAngle: 0 };
        }
        return { ...state, phase: "air", flight: launchProjectile(0, 0, state.speed, input.values.kicker ?? 30), airtime: 0 };
      }
      case "air": {
        const flight = advanceProjectile(state.flight as ProjectileState, dt);
        const airtime = state.airtime + dt;
        if (flight.y > 0) {
          return { ...state, flight, airtime };
        }
        const previous = state.flight as ProjectileState;
        const fraction = previous.y / (previous.y - flight.y);
        const landingX = previous.x + fraction * (flight.x - previous.x);
        const time = airtime - dt * (1 - fraction);
        const onDeck = landingX >= (course.landFrom ?? 0) && landingX <= (course.landTo ?? Infinity);
        const longEnough = time >= (course.airtime ?? 0);
        return {
          ...state, flight: { ...flight, y: 0, x: landingX }, airtime: time, landingX,
          phase: onDeck && longEnough ? "landed" : "crashed",
          message: !onDeck
            ? `Landed at ${landingX.toFixed(1)} m: ${landingX < (course.landFrom ?? 0) ? "short of the deck" : "past the deck"}!`
            : !longEnough ? `Only ${time.toFixed(2)} s in the air: not enough time to spin. Try a steeper kicker.`
            : `Landed at ${landingX.toFixed(1)} m after ${time.toFixed(2)} s in the air!`,
        };
      }
      case "loop": {
        const v0 = state.launchSpeed;
        if (calculateBottomGForce(v0, LOOP_RADIUS) > MAX_LOOP_G) {
          return { ...state, phase: "crashed", message: `Too fast! ${calculateBottomGForce(v0, LOOP_RADIUS).toFixed(1)} g at the bottom of the loop. Start lower.` };
        }
        const g = STANDARD_GRAVITY;
        const vSquared = v0 * v0 - 2 * g * LOOP_RADIUS * (1 - Math.cos(state.loopAngle));
        // The track pushes with N = m (v²/r + g cosφ); when that reaches zero the skater falls off.
        if (vSquared <= 0 || vSquared / LOOP_RADIUS + g * Math.cos(state.loopAngle) <= 0) {
          return { ...state, phase: "crashed", message: `Fell off at ${((state.loopAngle * 180) / Math.PI).toFixed(0)}° round the loop: not enough speed. Start higher.` };
        }
        const loopAngle = state.loopAngle + (Math.sqrt(vSquared) / LOOP_RADIUS) * dt;
        if (loopAngle >= 2 * Math.PI) {
          return { ...state, loopAngle: 2 * Math.PI, phase: "landed", message: `All the way round! ${calculateBottomGForce(v0, LOOP_RADIUS).toFixed(1)} g at the bottom.` };
        }
        return { ...state, loopAngle, speed: Math.sqrt(vSquared) };
      }
      default:
        return state;
    }
  },
  verdict: (state) =>
    state.phase === "landed" ? { status: "won", message: state.message }
    : state.phase === "crashed" ? { status: "lost", message: state.message }
    : { status: "playing", message: state.message },
  stars: (state, level) => {
    const course = COURSES[level] as Course;
    if (course.kind === "loop") {
      const gForce = calculateBottomGForce(state.launchSpeed, LOOP_RADIUS);
      return gForce <= 6.3 ? 3 : gForce <= 6.7 ? 2 : 1;
    }
    const middle = ((course.landFrom ?? 0) + (course.landTo ?? 0)) / 2;
    const half = ((course.landTo ?? 0) - (course.landFrom ?? 0)) / 2;
    const off = Math.abs((state.landingX ?? 0) - middle) / half;
    return off <= 0.3 ? 3 : off <= 0.7 ? 2 : 1;
  },
  readouts: (state, input, level) => {
    const course = COURSES[level] as Course;
    const speed = dropInSpeed(input.values.height ?? 1.5);
    const angle = ((input.values.kicker ?? 30) * Math.PI) / 180;
    const items = [
      { label: "SPEED AT THE BOTTOM", value: `${speed.toFixed(1)} m/s` },
      course.kind === "loop"
        ? { label: "SPEED NEEDED AT THE TOP √(g r)", value: `${Math.sqrt(STANDARD_GRAVITY * LOOP_RADIUS).toFixed(1)} m/s` }
        : { label: "PREDICTED JUMP v² sin2θ / g", value: `${((speed * speed * Math.sin(2 * angle)) / STANDARD_GRAVITY).toFixed(1)} m` },
    ];
    if (course.kind === "spin") {
      items.push({ label: "PREDICTED AIRTIME 2v sinθ / g", value: `${((2 * speed * Math.sin(angle)) / STANDARD_GRAVITY).toFixed(2)} s` });
    }
    if (course.kind === "loop") {
      items.push({ label: "G-FORCE AT THE BOTTOM", value: `${calculateBottomGForce(speed, LOOP_RADIUS).toFixed(1)} g (max ${MAX_LOOP_G})` });
    }
    if (state.landingX !== null) {
      items.push({ label: "LANDED AT", value: `${state.landingX.toFixed(1)} m` });
    }
    return items;
  },
  draw(context, state, input, width, height, level) {
    const course = COURSES[level] as Course;
    sky(context, width, height);
    sun(context, width - 45, 40);
    cloud(context, width * 0.4, 40, 0.8);
    const rampHeight = input.values.height ?? 1.5;
    const groundY = height - 40;
    const scale = Math.min((height - 90) / 7, width / 16);
    const rampRun = rampHeight / Math.tan((RAMP_ANGLE * Math.PI) / 180);
    const originX = 20 + rampRun * scale;
    const toScreen = (x: number, y: number) => ({ x: originX + (x + RUN_UP) * scale, y: groundY - y * scale });
    context.fillStyle = "#adb5bd";
    context.fillRect(0, groundY, width, height - groundY);
    // Drop-in ramp.
    context.fillStyle = "#e599f7";
    context.beginPath();
    context.moveTo(20, groundY - rampHeight * scale);
    context.lineTo(originX, groundY);
    context.lineTo(20, groundY);
    context.fill();
    if (course.kind === "loop") {
      const centre = toScreen(1.5, LOOP_RADIUS);
      context.strokeStyle = "#7048e8";
      context.lineWidth = 6;
      context.beginPath();
      context.arc(centre.x, centre.y, LOOP_RADIUS * scale, 0, 2 * Math.PI);
      context.stroke();
    } else {
      const from = toScreen(course.landFrom ?? 0, 0);
      const to = toScreen(course.landTo ?? 0, 0);
      context.fillStyle = "#51cf66";
      context.fillRect(from.x, groundY - 8, to.x - from.x, 8);
      badge(context, `LAND ${course.landFrom}–${course.landTo} m`, from.x, groundY - 14, "#2b8a3e");
      const kicker = ((input.values.kicker ?? 30) * Math.PI) / 180;
      const k = toScreen(0, 0);
      context.fillStyle = "#ffa94d";
      context.beginPath();
      context.moveTo(k.x - 26, groundY);
      context.lineTo(k.x, groundY);
      context.lineTo(k.x, groundY - Math.tan(kicker) * 26);
      context.fill();
    }
    let p: { x: number; y: number };
    if (state.phase === "ramp") {
      const along = state.distance / rampLength(rampHeight);
      p = { x: 20 + along * (originX - 20), y: groundY - rampHeight * scale * (1 - along) };
    } else if (state.phase === "flat") {
      p = toScreen(state.distance - RUN_UP, 0);
    } else if (state.phase === "loop" || (course.kind === "loop" && state.phase !== "ready")) {
      const centre = toScreen(1.5, LOOP_RADIUS);
      p = { x: centre.x + Math.sin(state.loopAngle) * LOOP_RADIUS * scale, y: centre.y + Math.cos(state.loopAngle) * LOOP_RADIUS * scale };
    } else if (state.flight) {
      p = toScreen(state.flight.x, state.flight.y);
    } else {
      p = { x: 20, y: groundY - rampHeight * scale };
    }
    context.fillStyle = PLAYGROUND_COLOURS.player;
    context.beginPath();
    context.arc(p.x, p.y - 18, 9, 0, 2 * Math.PI);
    context.fill();
    context.fillStyle = "#ff6b6b";
    context.fillRect(p.x - 14, p.y - 6, 28, 5);
    badge(context, `${rampHeight.toFixed(2)} m`, 22, groundY - rampHeight * scale - 8, "#862e9c");
  },
  describe: (state, input, level) =>
    `${COURSES[level]?.title}. Drop-in height ${(input.values.height ?? 1.5).toFixed(2)} metres${(COURSES[level] as Course).kind === "loop" ? "" : `, kicker angle ${input.values.kicker ?? 30} degrees`}. ${state.message}`,
};

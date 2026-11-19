import {
  calculateCircularOrbitSpeed,
  calculateEquatorialSpeed,
  calculateLightTravelTime,
  calculateLorentzFactor,
  calculateOrbitalPeriod,
  calculateProperTime,
  calculateRelativisticKineticEnergy,
  calculateSurvivingFraction,
  calculateTangentialDriftHeight,
  calculateTidalAcceleration,
  calculateTwinTrip,
} from "../../physics/astronomy";
import {
  ASTRONOMICAL_UNIT,
  ATMOSPHERIC_PRESSURE,
  AVOGADRO_CONSTANT,
  BOLTZMANN_CONSTANT,
  EARTH_GRAVITATIONAL_PARAMETER,
  EARTH_MEAN_RADIUS,
  EARTH_MOON_DISTANCE,
  EARTH_SIDEREAL_DAY,
  HELIUM_MOLAR_MASS,
  LUNAR_GRAVITY,
  MOON_GRAVITATIONAL_PARAMETER,
  MUON_MEAN_LIFETIME,
  SPEED_OF_LIGHT,
  STANDARD_GRAVITY,
  SUN_GRAVITATIONAL_PARAMETER,
} from "../../physics/core";
import {
  calculateDragFallDistance,
  calculateDragFallTime,
  calculateFallTime,
  calculatePendulumPeriod,
  calculateTerminalSpeed,
} from "../../physics/mechanics";
import {
  calculateMeanKineticEnergy,
  calculatePressureAtConstantVolume,
  calculateRmsSpeed,
  calculateThermalWavelength,
} from "../../physics/thermodynamics";
import type { ThoughtExperiment } from "./thoughtExperimentTypes";

const fixed = (value: number, digits: number) => value.toFixed(digits);
const sample = (from: number, to: number, count: number) =>
  Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));

/* ---------------- What if Earth's gravity disappeared? ---------------- */

/** Equatorial radius, m: the equator is where rotation is fastest. */
const EARTH_EQUATORIAL_RADIUS = 6.378137e6;
const EQUATOR_SPEED = calculateEquatorialSpeed(EARTH_EQUATORIAL_RADIUS, EARTH_SIDEREAL_DAY);
const MOON_ORBITAL_SPEED = calculateCircularOrbitSpeed(EARTH_GRAVITATIONAL_PARAMETER, EARTH_MOON_DISTANCE);
const EARTH_ORBITAL_SPEED = calculateCircularOrbitSpeed(SUN_GRAVITATIONAL_PARAMETER, ASTRONOMICAL_UNIT);
const SECONDS_PER_DAY = 86_400;

/** Fractional increase of Earth's distance from the Sun after the given days in a straight line. */
export function earthSunDistanceIncrease(days: number): number {
  return calculateTangentialDriftHeight(ASTRONOMICAL_UNIT, EARTH_ORBITAL_SPEED, days * SECONDS_PER_DAY) / ASTRONOMICAL_UNIT;
}

const gravityDisappears: ThoughtExperiment = {
  id: "gravity-disappears",
  title: "What if Earth's gravity disappeared?",
  worldId: "mechanics",
  summary: "Switch gravity off and follow what inertia alone does to you, the Moon and the Earth.",
  scenario:
    "You are standing on the equator. Suddenly, everywhere in the universe, gravity switches off. Nothing else changes: you, the ground and the air keep the velocities they had a moment before.",
  statements: [
    { kind: "established", text: "Newton's first law: with no net force, an object keeps moving in a straight line at constant speed." },
    { kind: "established", text: "Earth turns once every 23 h 56 min, so a point on the equator moves east at about 465 m/s." },
    { kind: "assumption", text: "Gravity vanishes instantly and everywhere, and the ground does not push you upward as it relaxes. Air drag on you is ignored." },
    { kind: "speculation", text: "Without gravity, the Earth itself, compressed by its own weight, would slowly spring apart. How that would unfold is not something this model calculates." },
  ],
  question: {
    id: "main",
    prompt: "In the first second after gravity disappears, what happens to you?",
    options: [
      { id: "fly", label: "You are flung into space at hundreds of metres per second" },
      { id: "drift", label: "You start to drift up, only centimetres at first, then faster" },
      { id: "stay", label: "Nothing: you stay standing on the ground" },
      { id: "up", label: "You shoot straight upward like a rocket" },
    ],
    answerId: "drift",
  },
  parameter: { label: "Time after gravity disappears", unit: "s", minimum: 1, maximum: 600, step: 1, initial: 1 },
  run(seconds) {
    const height = calculateTangentialDriftHeight(EARTH_EQUATORIAL_RADIUS, EQUATOR_SPEED, seconds);
    const series = sample(0, 600, 121).map((t) => ({
      x: t,
      y: calculateTangentialDriftHeight(EARTH_EQUATORIAL_RADIUS, EQUATOR_SPEED, t) / 1000,
    }));
    return {
      rows: [
        { label: "Your sideways speed (unchanged)", value: `${fixed(EQUATOR_SPEED, 0)} m/s` },
        { label: `Height above the ground after ${seconds} s`, value: height < 1 ? `${fixed(height * 100, 1)} cm` : height < 1000 ? `${fixed(height, 1)} m` : `${fixed(height / 1000, 2)} km` },
        { label: "Moon's speed as it leaves in a straight line", value: `${fixed(MOON_ORBITAL_SPEED, 0)} m/s` },
        { label: "Earth's speed as it leaves the Sun in a straight line", value: `${fixed(EARTH_ORBITAL_SPEED / 1000, 1)} km/s` },
      ],
      chart: {
        title: "Your height above the ground",
        description: "Height above the ground against time for a person on the equator who keeps moving in a straight line at 465 m/s. It grows slowly at first, as the square of time, then faster.",
        xLabel: "Time (s)",
        yLabel: "Height (km)",
        series: [{ label: "Height above the ground", points: series }],
        xDomain: [0, 600],
      },
      summary: `After ${seconds} s you are ${height < 1 ? `${fixed(height * 100, 1)} cm` : `${fixed(height, 0)} m`} up. You are not thrown off; the curved ground falls away beneath your straight path.`,
    };
  },
  explanation: [
    { kind: "established", text: "Gravity was not holding you down against a force flinging you outward; it was bending your path into a circle. Remove it and you continue along the tangent at 465 m/s." },
    { kind: "prediction", text: "Because the ground curves away only slowly, your height grows as s²/2R at first: 1.7 cm after one second, about 61 m after a minute and about 6 km after ten minutes." },
    { kind: "established", text: "The same inertia applies to the Moon, which would leave along its orbit at about 1 km/s, and to the Earth, which would leave the Sun at almost 30 km/s." },
  ],
  variation: {
    question: {
      id: "variation",
      prompt: "Earth keeps moving in a straight line at 29.8 km/s. After 30 days without gravity, how much farther from the Sun is it?",
      options: [
        { id: "same", label: "No farther: it still circles the Sun" },
        { id: "tiny", label: "About 0.1 % farther" },
        { id: "twelve", label: "About 12 % farther" },
        { id: "double", label: "About twice as far" },
      ],
      answerId: "twelve",
    },
    explanation: [
      { kind: "prediction", text: `In 30 days Earth travels 7.7 × 10¹⁰ m along a straight line; by Pythagoras it ends up ${fixed(earthSunDistanceIncrease(30) * 100, 1)} % farther from the Sun. The slow start of the drift you saw for yourself, here on a larger scale.` },
    ],
  },
  related: [
    { title: "Orbit Simulator", path: "/worlds/astronomy/orbit-simulator" },
    { title: "Orbital Motion lab", path: "/experiments/orbital-motion" },
  ],
};

/* ---------------- What if gravity doubled? ---------------- */

const TABLE_HEIGHT = 1.5;
const PENDULUM_LENGTH = 1;
/** Take-off speed of a standing jump (about 37 cm on Earth), set by muscles and unchanged by g. */
const JUMP_TAKEOFF_SPEED = 2.7;
const PERSON_MASS = 50;

const gravityDoubles: ThoughtExperiment = {
  id: "gravity-doubles",
  title: "What if gravity doubled?",
  worldId: "mechanics",
  summary: "Turn up g and see how falling, swinging, jumping and weighing change.",
  scenario: "Overnight, the strength of gravity at Earth's surface doubles, from 9.8 to 19.6 m/s². Earth's size and everything on it stay the same.",
  statements: [
    { kind: "established", text: "In free fall from rest, an object covers h = ½ g t², so its fall time is t = √(2h/g)." },
    { kind: "established", text: "A pendulum's period is T = 2π √(L/g) for small swings, and weight is W = m g." },
    { kind: "assumption", text: "Only g changes. Air resistance is ignored, and your muscles give a jump the same take-off speed as before." },
    { kind: "speculation", text: "How hearts, bones and plants would cope with double weight depends on biology, not on this model." },
  ],
  question: {
    id: "main",
    prompt: "With g doubled, how long does an apple take to fall from a 1.5 m table, compared with today?",
    options: [
      { id: "half", label: "Half the time" },
      { id: "seventy", label: "About 71 % of the time (1/√2)" },
      { id: "same", label: "The same time" },
      { id: "double", label: "Twice as long" },
    ],
    answerId: "seventy",
  },
  parameter: { label: "Gravity compared with today", unit: "× g", minimum: 0.5, maximum: 3, step: 0.1, initial: 2 },
  run(factor) {
    const g = STANDARD_GRAVITY * factor;
    const fall = calculateFallTime(TABLE_HEIGHT, g);
    const todayFall = calculateFallTime(TABLE_HEIGHT, STANDARD_GRAVITY);
    const period = calculatePendulumPeriod(PENDULUM_LENGTH, g);
    const jump = JUMP_TAKEOFF_SPEED ** 2 / (2 * g);
    return {
      rows: [
        { label: "Gravitational acceleration", value: `${fixed(g, 2)} m/s²` },
        { label: "Apple's fall from 1.5 m", value: `${fixed(fall, 3)} s (${fixed((fall / todayFall) * 100, 0)} % of today)` },
        { label: "1 m pendulum period", value: `${fixed(period, 2)} s` },
        { label: "Height of a standing jump", value: `${fixed(jump * 100, 0)} cm` },
        { label: `Weight of a ${PERSON_MASS} kg person`, value: `${fixed(PERSON_MASS * g, 0)} N` },
      ],
      chart: {
        title: "Fall time from a 1.5 m table",
        description: "Fall time against the strength of gravity. It falls as one over the square root of g, so doubling g shortens the fall to about 71 percent.",
        xLabel: "Gravity (× today)",
        yLabel: "Fall time (s)",
        series: [
          { label: "Fall time", points: sample(0.5, 3, 51).map((x) => ({ x, y: calculateFallTime(TABLE_HEIGHT, STANDARD_GRAVITY * x) })) },
          { label: "Your setting", dashed: true, points: [{ x: factor, y: 0 }, { x: factor, y: 0.8 }] },
        ],
        xDomain: [0.5, 3],
        yDomain: [0, 0.8],
      },
      summary: `At ${fixed(factor, 1)} g the apple lands in ${fixed(fall, 3)} s, ${fixed((fall / todayFall) * 100, 0)} % of today's time, while your weight is ${fixed(factor, 1)} times larger.`,
    };
  },
  explanation: [
    { kind: "established", text: "Fall time depends on √(1/g), not on 1/g: doubling g makes the apple fall in 1/√2 ≈ 71 % of the time, not half. It does land 41 % faster (√2 times the speed)." },
    { kind: "prediction", text: "Your weight doubles, and the same leg push gives only half the jump height, because the height is v²/2g." },
  ],
  variation: {
    question: {
      id: "variation",
      prompt: "A pendulum clock is set to keep perfect time today. With gravity doubled, what does it do?",
      options: [
        { id: "slow", label: "It runs slow, losing half the day" },
        { id: "same", label: "It still keeps perfect time" },
        { id: "fast10", label: "It runs fast, gaining about 10 hours a day" },
        { id: "fast24", label: "It runs twice as fast, gaining 24 hours a day" },
      ],
      answerId: "fast10",
    },
    explanation: [
      { kind: "prediction", text: `The period shrinks by 1/√2, so the clock ticks √2 ≈ 1.414 times as often. Each real day it shows ${fixed((Math.SQRT2 - 1) * 24, 1)} extra hours.` },
    ],
  },
  related: [
    { title: "Gravity Comparison lab", path: "/experiments/gravity-comparison" },
    { title: "Planet Designer", path: "/worlds/astronomy/planet-designer" },
  ],
};

/* ---------------- What if a feather fell in a vacuum? ---------------- */

/** Apollo 15 geological hammer, kg. */
const HAMMER_MASS = 1.32;
/** Illustrative drag area C_d·A of the hammer, m². */
const HAMMER_DRAG_AREA = 0.003;
/** Illustrative small feather: 0.5 g with a drag area that gives a terminal speed near 1 m/s. */
const FEATHER_MASS = 5e-4;
const FEATHER_DRAG_AREA = 0.008;
const HAMMER_TERMINAL = calculateTerminalSpeed(HAMMER_MASS, HAMMER_DRAG_AREA);
const FEATHER_TERMINAL = calculateTerminalSpeed(FEATHER_MASS, FEATHER_DRAG_AREA);

const featherVacuum: ThoughtExperiment = {
  id: "feather-vacuum",
  title: "What if a feather fell in a vacuum?",
  worldId: "mechanics",
  summary: "Drop a hammer and a feather with and without air, on Earth and on the Moon.",
  scenario: "You hold a hammer and a feather at the same height and let go of both together: first in a room full of air, then inside a chamber with all the air pumped out.",
  statements: [
    { kind: "established", text: "Without air, every object falls with the same acceleration g, whatever its mass. Apollo 15 astronaut David Scott showed this with a hammer and a falcon feather on the Moon in 1971." },
    { kind: "established", text: "In air, drag grows with speed until it balances the weight; the object then falls at its terminal speed v_t = √(2mg/ρC_dA)." },
    { kind: "assumption", text: `The drag areas are illustrative: the feather's terminal speed is about ${fixed(FEATHER_TERMINAL, 1)} m/s and the hammer's about ${fixed(HAMMER_TERMINAL, 0)} m/s. Real feathers also flutter and drift sideways.` },
  ],
  question: {
    id: "main",
    prompt: "In the vacuum chamber, which reaches the floor first?",
    options: [
      { id: "hammer", label: "The hammer, because it is heavier" },
      { id: "feather", label: "The feather, because it is lighter" },
      { id: "same", label: "Both land at the same moment" },
      { id: "float", label: "The feather floats; with no air it cannot fall" },
    ],
    answerId: "same",
  },
  parameter: { label: "Drop height", unit: "m", minimum: 0.5, maximum: 3, step: 0.1, initial: 1.6 },
  run(height) {
    const vacuum = calculateFallTime(height, STANDARD_GRAVITY);
    const hammerAir = calculateDragFallTime(height, HAMMER_TERMINAL);
    const featherAir = calculateDragFallTime(height, FEATHER_TERMINAL);
    const moon = calculateFallTime(height, LUNAR_GRAVITY);
    const end = Math.max(featherAir, 0.1);
    const times = sample(0, end, 81);
    const heightAt = (fallen: number) => Math.max(0, height - fallen);
    return {
      rows: [
        { label: "Hammer in air", value: `${fixed(hammerAir, 3)} s` },
        { label: "Feather in air", value: `${fixed(featherAir, 2)} s` },
        { label: "Both in a vacuum on Earth", value: `${fixed(vacuum, 3)} s` },
        { label: "Both on the Moon (no air)", value: `${fixed(moon, 2)} s` },
      ],
      chart: {
        title: "Height above the floor in air",
        description: "Height against time for the hammer and the feather falling through air. The hammer falls almost as in a vacuum; the feather soon drifts down at about one metre per second.",
        xLabel: "Time (s)",
        yLabel: "Height (m)",
        series: [
          { label: "Hammer in air", points: times.map((t) => ({ x: t, y: heightAt(calculateDragFallDistance(t, HAMMER_TERMINAL)) })) },
          { label: "Feather in air", dashed: true, points: times.map((t) => ({ x: t, y: heightAt(calculateDragFallDistance(t, FEATHER_TERMINAL)) })) },
        ],
        xDomain: [0, end],
        yDomain: [0, height],
      },
      summary: `From ${fixed(height, 1)} m, air delays the feather to ${fixed(featherAir, 2)} s, but in a vacuum both take ${fixed(vacuum, 3)} s.`,
    };
  },
  explanation: [
    { kind: "established", text: "A heavier object is pulled harder, but it is also harder to accelerate: the mass cancels in a = F/m = mg/m = g. Only air resistance makes the feather slow." },
    { kind: "prediction", text: "In air the hammer is barely affected, because its weight is huge compared with the drag at these speeds, while the feather reaches its terminal speed within a few centimetres." },
  ],
  variation: {
    question: {
      id: "variation",
      prompt: "Now drop them from the same height on the Moon, where g = 1.62 m/s². Compared with Earth's vacuum chamber, the fall takes…",
      options: [
        { id: "same", label: "The same time" },
        { id: "twoHalf", label: "About 2.5 times longer" },
        { id: "six", label: "About 6 times longer" },
        { id: "shorter", label: "Less time" },
      ],
      answerId: "twoHalf",
    },
    explanation: [
      { kind: "prediction", text: `The fall time scales as 1/√g, so it is √(9.81/1.62) = ${fixed(Math.sqrt(STANDARD_GRAVITY / LUNAR_GRAVITY), 2)} times longer: one sixth of the gravity, but not six times the time.` },
    ],
  },
  related: [
    { title: "Parachute Designer", path: "/worlds/mechanics/parachute-designer" },
    { title: "Gravity Comparison lab", path: "/experiments/gravity-comparison" },
  ],
};

/* ---------------- What would happen near the speed of light? ---------------- */

const PROXIMA_DISTANCE_LY = 4.24;
const SHIP_LENGTH = 100;
const MUON_ALTITUDE = 15_000;
const MUON_BETA = 0.995;

export function muonSurvival(relativistic: boolean): number {
  return calculateSurvivingFraction(MUON_ALTITUDE, MUON_BETA, MUON_MEAN_LIFETIME, relativistic);
}

const nearLightSpeed: ThoughtExperiment = {
  id: "near-light-speed",
  title: "What would happen near the speed of light?",
  worldId: "astronomy",
  summary: "Fly faster and faster and watch clocks, lengths and energy change.",
  scenario: "A spaceship sets off for Proxima Centauri, 4.24 light-years away, and cruises at a large fraction of the speed of light. Its crew compares their clocks with clocks on Earth.",
  statements: [
    { kind: "established", text: "Special relativity: a clock moving at speed v runs slow by the Lorentz factor γ = 1/√(1 − v²/c²). This is measured every day, from particle accelerators to GPS satellites." },
    { kind: "established", text: "No object with mass can reach the speed of light: its kinetic energy (γ − 1)mc² grows without limit as v → c." },
    { kind: "assumption", text: "The ship cruises at constant speed; the time spent speeding up and slowing down is ignored." },
    { kind: "speculation", text: "Whether a crewed ship could ever be given that much energy is an open engineering question; the physics only says how much it would need." },
  ],
  question: {
    id: "main",
    prompt: "The ship flies at 90 % of the speed of light for what its crew measures as one year. How much time passes on Earth?",
    options: [
      { id: "one", label: "One year" },
      { id: "less", label: "About half a year" },
      { id: "more", label: "About 2.3 years" },
      { id: "ten", label: "About 10 years" },
    ],
    answerId: "more",
  },
  parameter: { label: "Ship speed", unit: "c", minimum: 0.1, maximum: 0.999, step: 0.001, initial: 0.9 },
  run(beta) {
    const gamma = calculateLorentzFactor(beta);
    const trip = calculateTwinTrip(PROXIMA_DISTANCE_LY, beta);
    return {
      rows: [
        { label: "Lorentz factor γ", value: fixed(gamma, 3) },
        { label: "One crew year lasts on Earth", value: `${fixed(gamma, 2)} years` },
        { label: "Ship's 100 m length, seen from Earth", value: `${fixed(SHIP_LENGTH / gamma, 1)} m` },
        { label: "Round trip to Proxima: Earth years", value: fixed(trip.homeYears, 1) },
        { label: "Round trip to Proxima: crew years", value: fixed(trip.travellerYears, 1) },
        { label: "Kinetic energy per kilogram", value: `${(calculateRelativisticKineticEnergy(1, beta)).toExponential(2)} J` },
      ],
      chart: {
        title: "Lorentz factor",
        description: "The Lorentz factor against speed. It stays close to 1 up to about half the speed of light, then rises steeply and grows without limit as the speed approaches c.",
        xLabel: "Speed (fraction of c)",
        yLabel: "γ",
        series: [
          { label: "γ", points: sample(0, 0.995, 120).map((x) => ({ x, y: calculateLorentzFactor(x) })) },
          { label: "Your speed", dashed: true, points: [{ x: beta, y: 1 }, { x: beta, y: 12 }] },
        ],
        xDomain: [0, 1],
        yDomain: [1, 12],
      },
      summary: `At ${fixed(beta * 100, 1)} % of c, γ = ${fixed(gamma, 2)}: each year aboard is ${fixed(gamma, 2)} years on Earth, and the Proxima round trip ages the crew ${fixed(trip.travellerYears, 1)} years against Earth's ${fixed(trip.homeYears, 1)}.`,
    };
  },
  explanation: [
    { kind: "established", text: "At 0.9c, γ = 2.29: one year aboard corresponds to 2.29 years on Earth. Both observers measure the other's clock running slow while they cruise; the twin who turns around (changes frame) is the one who has aged less when they meet." },
    { kind: "prediction", text: "Lengths along the motion shrink by the same factor, and the energy needed rises steeply: at 0.99c each kilogram carries about 5.5 × 10¹⁷ J, roughly what the whole world uses in eight hours." },
  ],
  variation: {
    question: {
      id: "variation",
      prompt: "Muons are made 15 km up by cosmic rays and live on average 2.2 µs at rest. At 0.995c, what fraction of them reaches the ground?",
      options: [
        { id: "none", label: "Practically none: they decay after about 660 m" },
        { id: "ten", label: "About 10 %" },
        { id: "half", label: "About half" },
        { id: "all", label: "All of them" },
      ],
      answerId: "ten",
    },
    explanation: [
      { kind: "established", text: `Without time dilation only ${muonSurvival(false).toExponential(0)} of them would survive the 50 µs trip. With γ ≈ 10 their clocks run ten times slow and about ${fixed(muonSurvival(true) * 100, 0)} % arrive, as detectors on mountains and at sea level confirm (Rossi and Hall, 1941; Frisch and Smith, 1963).` },
    ],
  },
  related: [
    { title: "Black Hole Explorer", path: "/worlds/astronomy/black-hole-explorer" },
    { title: "Particle Accelerator Laboratory", path: "/worlds/electromagnetism/particle-accelerator" },
  ],
};

/* ---------------- What if Earth had two moons? ---------------- */

const MOON_TIDE = calculateTidalAcceleration(MOON_GRAVITATIONAL_PARAMETER, EARTH_MOON_DISTANCE, EARTH_MEAN_RADIUS);
const SUN_TIDE = calculateTidalAcceleration(SUN_GRAVITATIONAL_PARAMETER, ASTRONOMICAL_UNIT, EARTH_MEAN_RADIUS);

/** Combined tidal forcing of both moons and the Sun lined up, compared with today's spring tide. */
export function alignedTideRatio(secondMoonDistanceFraction: number): number {
  const second = calculateTidalAcceleration(MOON_GRAVITATIONAL_PARAMETER, EARTH_MOON_DISTANCE * secondMoonDistanceFraction, EARTH_MEAN_RADIUS);
  return (MOON_TIDE + second + SUN_TIDE) / (MOON_TIDE + SUN_TIDE);
}

const twoMoons: ThoughtExperiment = {
  id: "two-moons",
  title: "What if Earth had two moons?",
  worldId: "astronomy",
  summary: "Add a twin of our Moon and work out how the tides would change.",
  scenario: "A second moon, with the same mass as ours, orbits Earth in the same plane. You choose how far away it is.",
  statements: [
    { kind: "established", text: "Tides come from the difference in a body's pull across Earth. That difference falls as 1/d³: a = 2GMR/d³." },
    { kind: "established", text: "Today the Moon's tidal pull is about 2.2 times the Sun's; when they line up we get spring tides." },
    { kind: "assumption", text: "Point masses on circular orbits. The numbers are the tidal forcing; the height of real tides also depends on coastlines and ocean resonances." },
    { kind: "speculation", text: "Two large moons would tug on each other. Whether such a system stays stable for billions of years, or the moons collide or one is thrown out, depends on details this model does not include." },
  ],
  question: {
    id: "main",
    prompt: "The second moon orbits at half the Moon's distance. How strong is its tidal pull compared with our Moon's?",
    options: [
      { id: "two", label: "Twice as strong" },
      { id: "four", label: "Four times as strong" },
      { id: "eight", label: "Eight times as strong" },
      { id: "half", label: "Half as strong" },
    ],
    answerId: "eight",
  },
  parameter: { label: "Second moon's distance", unit: "× Moon distance", minimum: 0.3, maximum: 2, step: 0.05, initial: 0.5 },
  run(fraction) {
    const distance = EARTH_MOON_DISTANCE * fraction;
    const tide = calculateTidalAcceleration(MOON_GRAVITATIONAL_PARAMETER, distance, EARTH_MEAN_RADIUS);
    const moonPeriod = calculateOrbitalPeriod(EARTH_GRAVITATIONAL_PARAMETER, EARTH_MOON_DISTANCE);
    const period = calculateOrbitalPeriod(EARTH_GRAVITATIONAL_PARAMETER, distance);
    return {
      rows: [
        { label: "Distance", value: `${fixed(distance / 1000, 0)} km` },
        { label: "Its tidal pull ÷ our Moon's", value: `${fixed(tide / MOON_TIDE, 2)} ×` },
        { label: "Our Moon's tidal pull ÷ the Sun's", value: `${fixed(MOON_TIDE / SUN_TIDE, 2)} ×` },
        { label: "Everything lined up ÷ today's spring tide", value: `${fixed(alignedTideRatio(fraction), 2)} ×` },
        { label: "Its orbital period", value: `${fixed(period / SECONDS_PER_DAY, 1)} days (our Moon: ${fixed(moonPeriod / SECONDS_PER_DAY, 1)})` },
      ],
      chart: {
        title: "Tidal pull of the second moon",
        description: "The second moon's tidal pull compared with our Moon's, against its distance. It rises steeply as the moon comes closer, as one over distance cubed.",
        xLabel: "Distance (× Moon distance)",
        yLabel: "Tidal pull (× our Moon)",
        series: [
          { label: "Tidal pull", points: sample(0.3, 2, 69).map((x) => ({ x, y: 1 / x ** 3 })) },
          { label: "Your setting", dashed: true, points: [{ x: fraction, y: 0 }, { x: fraction, y: 40 }] },
        ],
        xDomain: [0.3, 2],
        yDomain: [0, 40],
      },
      summary: `At ${fixed(fraction, 2)} times the Moon's distance the second moon raises ${fixed(tide / MOON_TIDE, 2)} times the Moon's tidal pull.`,
    };
  },
  explanation: [
    { kind: "established", text: "Halving the distance makes the moon's pull itself four times stronger (1/d²), but the difference in that pull across Earth, which is what raises tides, eight times stronger (1/d³)." },
    { kind: "prediction", text: "A moon that close would also orbit much faster, in under ten days, so its tides would come and go on a different rhythm from our Moon's." },
  ],
  variation: {
    question: {
      id: "variation",
      prompt: "With the second moon at half the distance, both moons and the Sun line up. How big is the combined tidal pull compared with today's spring tide?",
      options: [
        { id: "two", label: "About 2 times" },
        { id: "sixHalf", label: "About 6.5 times" },
        { id: "nine", label: "About 9 times" },
        { id: "twenty", label: "About 20 times" },
      ],
      answerId: "sixHalf",
    },
    explanation: [
      { kind: "prediction", text: `Today's spring tide is Moon + Sun ≈ 1 + 0.46 in Moon units. Adding 8 for the new moon gives (8 + 1 + 0.46)/(1 + 0.46) ≈ ${fixed(alignedTideRatio(0.5), 1)} times as much forcing.` },
    ],
  },
  related: [
    { title: "Solar System Builder", path: "/worlds/astronomy/solar-system-builder" },
    { title: "Orbit Simulator", path: "/worlds/astronomy/orbit-simulator" },
  ],
};

/* ---------------- What happens near absolute zero? ---------------- */

const HELIUM_ATOM_MASS = HELIUM_MOLAR_MASS / AVOGADRO_CONSTANT;
const ROOM_TEMPERATURE = 300;
/** Mean spacing between helium atoms sealed at 1 atm and 300 K (unchanged at constant volume), m. */
const ATOM_SPACING = Math.cbrt((BOLTZMANN_CONSTANT * ROOM_TEMPERATURE) / ATMOSPHERIC_PRESSURE);
/** Boiling point of helium-4 at 1 atm, K. */
const HELIUM_BOILING_POINT = 4.22;

/** Temperature in kelvin for a slider on a log scale (−3 → 1 mK, 2.48 → 300 K). */
export const temperatureFromLog = (logValue: number) => 10 ** logValue;

const absoluteZero: ThoughtExperiment = {
  id: "absolute-zero",
  title: "What happens near absolute zero?",
  worldId: "thermodynamics",
  summary: "Cool sealed helium toward 0 K and watch the classical picture break down.",
  scenario: "A sealed, rigid container holds helium gas at room temperature and 1 atmosphere. You cool it further and further toward absolute zero, 0 K (−273.15 °C).",
  statements: [
    { kind: "established", text: "Temperature measures the average kinetic energy of the particles: ⟨E⟩ = (3/2) k T, so their typical speed is v_rms = √(3RT/M)." },
    { kind: "established", text: "Absolute zero cannot be reached in a finite number of steps (the third law of thermodynamics), and quantum mechanics leaves atoms with a zero-point motion even at 0 K." },
    { kind: "assumption", text: "The classical ideal-gas formulas are used at every temperature to show where they fail. Real helium liquefies at 4.2 K at 1 atm and becomes a superfluid below 2.17 K." },
  ],
  question: {
    id: "main",
    prompt: "As you cool the helium toward absolute zero, what happens to the atoms' motion?",
    options: [
      { id: "stop", label: "They slow down steadily and stop completely at 0 K" },
      { id: "quantum", label: "They slow down as √T, but quantum effects take over before 0 K and they never stop entirely" },
      { id: "faster", label: "They speed up as they pack closer together" },
      { id: "same", label: "Nothing changes; temperature does not affect motion" },
    ],
    answerId: "quantum",
  },
  parameter: {
    label: "Temperature (logarithmic)",
    unit: "",
    minimum: -3,
    maximum: Math.log10(ROOM_TEMPERATURE),
    step: 0.01,
    initial: Math.log10(ROOM_TEMPERATURE),
    format: (value) => {
      const kelvin = temperatureFromLog(value);
      return kelvin >= 1 ? `${fixed(kelvin, 1)} K` : `${fixed(kelvin * 1000, 1)} mK`;
    },
  },
  run(logValue) {
    const kelvin = temperatureFromLog(logValue);
    const speed = calculateRmsSpeed(kelvin, HELIUM_MOLAR_MASS);
    const wavelength = calculateThermalWavelength(kelvin, HELIUM_ATOM_MASS);
    const ratio = wavelength / ATOM_SPACING;
    const pressure = calculatePressureAtConstantVolume(ATMOSPHERIC_PRESSURE, ROOM_TEMPERATURE, kelvin);
    const regime =
      ratio >= 1 ? "Quantum regime: the atoms' wave packets overlap, so the classical gas picture fails."
      : kelvin < HELIUM_BOILING_POINT ? "Below helium's boiling point: real helium would already be liquid."
      : "Classical regime: the ideal-gas picture works.";
    return {
      rows: [
        { label: "Temperature", value: kelvin >= 1 ? `${fixed(kelvin, 2)} K` : `${fixed(kelvin * 1000, 2)} mK` },
        { label: "Typical atom speed v_rms", value: `${fixed(speed, speed < 10 ? 2 : 0)} m/s` },
        { label: "Mean kinetic energy", value: `${calculateMeanKineticEnergy(kelvin).toExponential(2)} J` },
        { label: "Ideal-gas pressure (sealed)", value: `${pressure >= 100 ? fixed(pressure / 1000, 1) + " kPa" : fixed(pressure, 2) + " Pa"}` },
        { label: "Quantum size ÷ atom spacing", value: fixed(ratio, ratio < 1 ? 3 : 1) },
        { label: "Regime", value: regime },
      ],
      chart: {
        title: "Atom speed and quantum size",
        description: "Typical helium atom speed and the ratio of the atoms' quantum wavelength to their spacing, against the logarithm of temperature. Speed falls toward zero while the quantum ratio rises past one at very low temperature.",
        xLabel: "log₁₀(temperature / K)",
        yLabel: "Speed (km/s) · quantum ratio",
        series: [
          { label: "v_rms (km/s)", points: sample(-3, Math.log10(ROOM_TEMPERATURE), 80).map((x) => ({ x, y: calculateRmsSpeed(10 ** x, HELIUM_MOLAR_MASS) / 1000 })) },
          { label: "Quantum size ÷ spacing", dashed: true, points: sample(-3, Math.log10(ROOM_TEMPERATURE), 80).map((x) => ({ x, y: Math.min(3, calculateThermalWavelength(10 ** x, HELIUM_ATOM_MASS) / ATOM_SPACING) })) },
        ],
        xDomain: [-3, Math.log10(ROOM_TEMPERATURE)],
        yDomain: [0, 3],
      },
      summary: `At ${kelvin >= 1 ? fixed(kelvin, 1) + " K" : fixed(kelvin * 1000, 1) + " mK"} the atoms move at about ${fixed(speed, speed < 10 ? 1 : 0)} m/s. ${regime}`,
    };
  },
  explanation: [
    { kind: "established", text: "Cooling removes kinetic energy, so the atoms slow as √T: from about 1.4 km/s at room temperature to about 160 m/s at 4 K." },
    { kind: "established", text: "But each atom is also a wave whose size grows as 1/√T. Once that size approaches the spacing between atoms, quantum rules take over: helium-4 becomes a superfluid that flows without friction, and the atoms keep a zero-point motion even at 0 K." },
    { kind: "prediction", text: "The ideal-gas formulas predict the pressure falling to zero at 0 K; that is where the familiar idea of a temperature scale with a bottom at −273.15 °C comes from." },
  ],
  variation: {
    question: {
      id: "variation",
      prompt: "Before anything liquefies, you cool the sealed container from 300 K to 150 K. What happens to the pressure?",
      options: [
        { id: "same", label: "It stays the same" },
        { id: "half", label: "It halves" },
        { id: "quarter", label: "It drops to a quarter" },
        { id: "zero", label: "It drops to zero" },
      ],
      answerId: "half",
    },
    explanation: [
      { kind: "established", text: `At constant volume P ∝ T in kelvin (Gay-Lussac's law), so halving the absolute temperature halves the pressure: ${fixed(calculatePressureAtConstantVolume(ATMOSPHERIC_PRESSURE, ROOM_TEMPERATURE, 150) / 1000, 1)} kPa. Halving the temperature in °C would not halve it.` },
    ],
  },
  related: [
    { title: "Refrigerator Engineer", path: "/worlds/thermodynamics/refrigerator-engineer" },
    { title: "Steam Engine", path: "/worlds/thermodynamics/steam-engine" },
  ],
};

/* ---------------- What if light traveled slower? ---------------- */

const CYCLING_SPEED = 10;
const BIKE_LENGTH = 1.8;
const FRIEND_DISTANCE = 100;
const SLOW_LIGHT_FOR_VARIATION = 20;
const SECONDS_PER_YEAR = 365.25 * SECONDS_PER_DAY;

export function slowSunlightYears(lightSpeed: number): number {
  return calculateLightTravelTime(ASTRONOMICAL_UNIT, lightSpeed) / SECONDS_PER_YEAR;
}

const slowerLight: ThoughtExperiment = {
  id: "slower-light",
  title: "What if light traveled slower?",
  worldId: "optics",
  summary: "Turn the speed of light down to cycling speeds and see relativity in the street.",
  scenario: "Imagine a world where light travels at only a few tens of metres per second, while everything else about everyday life stays as it is. You go for a bike ride at 10 m/s.",
  statements: [
    { kind: "speculation", text: "This world is hypothetical. Changing the speed of light alone is not a self-consistent idea, because atoms, chemistry and light itself depend on it. Only the motion formulas use the new value here." },
    { kind: "established", text: "In our world, the effects you will see are real but tiny at everyday speeds: γ for a cyclist differs from 1 by about 10⁻¹⁵." },
    { kind: "assumption", text: "Special relativity's formulas are applied with the slower light speed, and light takes time to carry images to you." },
  ],
  question: {
    id: "main",
    prompt: "Light travels at only 20 m/s. You ride a bike at 10 m/s. What do the formulas of relativity predict?",
    options: [
      { id: "nothing", label: "Nothing unusual: relativity is only for spaceships" },
      { id: "effects", label: "Your clock runs about 13 % slow compared with a friend's, and your bike is measured shorter" },
      { id: "overtake", label: "You could pedal hard enough to overtake light" },
      { id: "heavy", label: "Only that the bike would feel heavier" },
    ],
    answerId: "effects",
  },
  parameter: { label: "Speed of light in this world", unit: "m/s", minimum: 11, maximum: 200, step: 1, initial: 20 },
  run(lightSpeed) {
    const beta = CYCLING_SPEED / lightSpeed;
    const gamma = calculateLorentzFactor(beta);
    return {
      rows: [
        { label: "Your speed ÷ light speed", value: fixed(beta, 3) },
        { label: "Lorentz factor γ", value: fixed(gamma, 3) },
        { label: "Your watch after a 1 h ride (friend's clock: 60 min)", value: `${fixed(calculateProperTime(3600, beta) / 60, 1)} min` },
        { label: "Your 1.8 m bike, as your friend measures it", value: `${fixed(BIKE_LENGTH / gamma, 2)} m` },
        { label: "Delay before you see a friend 100 m away wave", value: `${fixed(calculateLightTravelTime(FRIEND_DISTANCE, lightSpeed), 1)} s` },
        { label: "Sunlight's journey to Earth", value: `${fixed(slowSunlightYears(lightSpeed), 0)} years` },
      ],
      chart: {
        title: "How slow your watch runs",
        description: "Minutes shown on the cyclist's watch during one hour of the friend's time, against the speed of light in this imagined world. The slower the light, the more the watch lags.",
        xLabel: "Speed of light (m/s)",
        yLabel: "Minutes on your watch",
        series: [
          { label: "Your watch", points: sample(11, 200, 100).map((x) => ({ x, y: calculateProperTime(3600, CYCLING_SPEED / x) / 60 })) },
          { label: "Your setting", dashed: true, points: [{ x: lightSpeed, y: 0 }, { x: lightSpeed, y: 60 }] },
        ],
        xDomain: [11, 200],
        yDomain: [0, 60],
      },
      summary: `With light at ${lightSpeed} m/s, γ = ${fixed(gamma, 3)}: an hour's ride leaves your watch ${fixed(60 - calculateProperTime(3600, beta) / 60, 1)} minutes behind.`,
    };
  },
  explanation: [
    { kind: "prediction", text: "At half the speed of light γ = 1.155, so your watch shows about 52 minutes while your friend's shows 60, and your bike is measured 13 % shorter along its motion." },
    { kind: "established", text: "However hard you pedal, adding speeds never takes you past light: in relativity speeds combine as (u + v)/(1 + uv/c²)." },
    { kind: "speculation", text: "In George Gamow's stories, Mr Tompkins explores just such a town; they are a way to picture the formulas, not a description of a possible world." },
  ],
  variation: {
    question: {
      id: "variation",
      prompt: "In the world where light travels at 20 m/s, how long does sunlight take to reach Earth (1.5 × 10¹¹ m)?",
      options: [
        { id: "minutes", label: "About 8 minutes, as now" },
        { id: "days", label: "About 2 days" },
        { id: "centuries", label: "About 240 years" },
        { id: "instant", label: "No time at all" },
      ],
      answerId: "centuries",
    },
    explanation: [
      { kind: "prediction", text: `t = d/c = 1.496 × 10¹¹ m ÷ 20 m/s = ${fixed(slowSunlightYears(SLOW_LIGHT_FOR_VARIATION), 0)} years. In our world it takes ${fixed(calculateLightTravelTime(ASTRONOMICAL_UNIT, SPEED_OF_LIGHT), 0)} s, about 8.3 minutes: we always see the Sun as it was a little while ago.` },
    ],
  },
  related: [
    { title: "Echo Explorer", path: "/worlds/waves/echo-explorer" },
    { title: "Black Hole Explorer", path: "/worlds/astronomy/black-hole-explorer" },
  ],
};

export const THOUGHT_EXPERIMENTS: readonly ThoughtExperiment[] = Object.freeze([
  gravityDisappears,
  gravityDoubles,
  featherVacuum,
  nearLightSpeed,
  twoMoons,
  absoluteZero,
  slowerLight,
]);

export function findThoughtExperiment(id: string): ThoughtExperiment | undefined {
  return THOUGHT_EXPERIMENTS.find((experiment) => experiment.id === id);
}

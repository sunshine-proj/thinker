import { v, type KnowledgeEntry } from "./types";

export const EVERYDAY_KNOWLEDGE: readonly KnowledgeEntry[] = [
  {
    topicId: "sports-physics",
    introduction: "Sport is applied physics: projectiles, bounces, drag and spin decide every shot.",
    objectives: ["Apply projectile motion to throws and shots.", "Use the coefficient of restitution for bounces."],
    explanation: "A ball in flight follows a parabola if drag is small, with range set by speed and angle. Fast balls such as tennis serves feel strong drag, which shortens their flight. When a ball bounces, its rebound speed is a fraction e of its impact speed, so it rebounds to e² of its drop height. Spin bends a ball's path through the Magnus effect.",
    formulas: [
      { expression: "R = v² sin 2θ / g", meaning: "Range on level ground without drag.", variables: [v("R", "range", "m"), v("v", "launch speed", "m/s"), v("θ", "launch angle", "°"), v("g", "gravitational acceleration", "m/s²")] },
      { expression: "h_rebound = e² h_drop", meaning: "Rebound height after one bounce.", variables: [v("e", "coefficient of restitution", "no unit"), v("h", "heights", "m")] },
    ],
    definitions: [
      { term: "Coefficient of restitution", meaning: "Ratio of rebound speed to impact speed." },
      { term: "Magnus effect", meaning: "Sideways force on a spinning ball." },
    ],
    examples: ["A basketball must rebound to between 1.2 m and 1.4 m when dropped from 1.8 m.", "Golf ball dimples reduce drag and let the ball fly farther."],
    questions: [
      { question: "At what angle does a ball go farthest without drag?", answer: "45°, on level ground." },
      { question: "A ball dropped from 2 m rebounds to 1.28 m. What is e?", answer: "√(1.28/2) = 0.8." },
    ],
    advanced: "With drag, the best launch angle is below 45°; for a shot put, released above the ground, it is about 37–42°.",
  },
  {
    topicId: "transportation",
    introduction: "Cars, bikes and trains run on mechanics: forces, energy, power and momentum.",
    objectives: ["Explain gears and wheel torque.", "Use impulse to explain crash safety."],
    explanation: "A bicycle's gears trade force for speed: a larger rear sprocket gives more torque at the wheel but less speed per pedal turn. At speed, most of a cyclist's power fights air drag, which grows with v³. In a crash, the change of momentum is fixed, so crumple zones, airbags and seat belts lengthen the stopping time to reduce the force on the passengers.",
    formulas: [
      { expression: "P = F v", meaning: "Power needed to push against a resistive force at speed v.", variables: [v("P", "power", "W"), v("F", "resistive force", "N"), v("v", "speed", "m/s")] },
      { expression: "F = m Δv / Δt", meaning: "Average force during a collision.", variables: [v("m", "mass", "kg"), v("Δv", "change in speed", "m/s"), v("Δt", "stopping time", "s")] },
    ],
    definitions: [
      { term: "Gear ratio", meaning: "Teeth on the front chainring divided by teeth on the rear sprocket." },
      { term: "Crumple zone", meaning: "Part of a car designed to deform and absorb energy in a crash." },
    ],
    examples: ["Stopping in 0.1 s instead of 0.01 s cuts the force by a factor of ten.", "Trains are efficient because steel wheels on rails have very low rolling resistance."],
    questions: [
      { question: "A 70 kg passenger stops from 15 m/s in 0.15 s. What is the average force?", answer: "F = 70 × 15 / 0.15 = 7000 N." },
      { question: "Why does riding twice as fast need about eight times the power against drag?", answer: "Drag ∝ v² and power = force × speed, so P ∝ v³." },
    ],
    advanced: "Regenerative braking in electric cars turns kinetic energy back into stored electrical energy.",
  },
  {
    topicId: "household-physics",
    introduction: "The kitchen and the home are full of heat, electricity and pressure at work.",
    objectives: ["Calculate heating times.", "Explain how cookware and appliances work."],
    explanation: "Boiling water takes energy mcΔT supplied at the hob's power, minus losses. Ice cools drinks well because melting absorbs latent heat. Pans conduct heat through their bases; pressure cookers raise the boiling point so food cooks faster. Microwave ovens heat water molecules directly with 2.45 GHz waves.",
    formulas: [
      { expression: "t = m c ΔT / (η P)", meaning: "Time to heat water with a heater of power P and efficiency η.", variables: [v("t", "time", "s"), v("m", "mass", "kg"), v("c", "specific heat", "J/(kg·K)"), v("ΔT", "temperature rise", "K"), v("η", "efficiency", "no unit"), v("P", "power", "W")] },
    ],
    definitions: [
      { term: "Efficiency", meaning: "Fraction of energy that heats the food rather than the kitchen." },
      { term: "Boiling point", meaning: "Temperature at which vapour pressure equals the surrounding pressure." },
    ],
    examples: ["A 2 kW kettle heats 1 kg of water from 20 °C to 100 °C in about 3 minutes.", "At high altitude water boils below 100 °C, so pasta takes longer."],
    questions: [
      { question: "Why does a pressure cooker cook faster?", answer: "Higher pressure raises the boiling point to about 120 °C." },
      { question: "Why do ice cubes cool a drink more than the same mass of 0 °C water?", answer: "Melting absorbs 334 kJ/kg before the meltwater even starts warming." },
    ],
    advanced: "Induction hobs heat ferromagnetic pans directly with eddy currents and magnetic hysteresis.",
  },
  {
    topicId: "human-vision",
    introduction: "The eye is an optical instrument: a lens system that focuses images onto the retina.",
    objectives: ["Explain accommodation, short sight and long sight.", "Calculate the power of corrective lenses."],
    explanation: "The cornea and lens focus light onto the retina. The eye changes its lens shape to focus near or far (accommodation). In short sight (myopia) the eye focuses too strongly and distant objects blur; a diverging lens corrects it. In long sight and with age (presbyopia), near objects blur; a converging lens helps. Opticians give lens power in dioptres.",
    formulas: [
      { expression: "P = 1 / f", meaning: "Lens power.", variables: [v("P", "power", "D (dioptres)"), v("f", "focal length", "m")] },
      { expression: "P_correction = −1 / far point", meaning: "Lens power that lets a short-sighted eye see far away (lens at the eye).", variables: [v("far point", "farthest distance seen sharply", "m")] },
    ],
    definitions: [
      { term: "Near point", meaning: "Closest distance the eye can focus on, about 25 cm for young adults." },
      { term: "Accommodation", meaning: "Changing the eye's focus by changing the lens shape." },
    ],
    examples: ["A short-sighted person with a far point of 50 cm needs −2 D glasses.", "Pupils shrink in bright light, which also sharpens focus."],
    questions: [
      { question: "What kind of lens corrects short sight?", answer: "A diverging (concave) lens, with negative power." },
      { question: "Why do many people need reading glasses after about 45?", answer: "The lens stiffens, so the near point moves away (presbyopia)." },
    ],
    advanced: "The eye's resolution is limited by both diffraction at the pupil and the spacing of cone cells, about 1 arcminute.",
  },
  {
    topicId: "sensors",
    introduction: "Phones and cars are full of sensors that turn physical quantities into electrical signals.",
    objectives: ["Explain how an accelerometer measures tilt.", "Use the inverse-square law for light sensors."],
    explanation: "An accelerometer measures the force on a tiny test mass; at rest it reads g along whatever axis points up, so a tilted phone reads g sin θ along its long edge. A gyroscope measures rotation rate, and integrating it gives the angle turned. A light sensor's reading from a small lamp falls as 1/d², which lets a phone estimate distance.",
    formulas: [
      { expression: "a = g sin θ", meaning: "Accelerometer reading along an axis tilted θ from horizontal.", variables: [v("a", "reading", "m/s²"), v("g", "gravitational acceleration", "m/s²"), v("θ", "tilt angle", "°")] },
      { expression: "E = I / d²", meaning: "Illuminance from a point source.", variables: [v("E", "illuminance", "lx"), v("I", "luminous intensity", "cd"), v("d", "distance", "m")] },
    ],
    definitions: [
      { term: "MEMS", meaning: "Micro-electro-mechanical systems: microscopic machines on a chip." },
      { term: "Lux (lx)", meaning: "Unit of illuminance; one lumen per square metre." },
    ],
    examples: ["Your phone rotates its screen using the accelerometer.", "A fitness band counts steps from the jolts of its accelerometer."],
    questions: [
      { question: "A phone reads 4.9 m/s² along its long edge. At what angle is it tilted?", answer: "sin θ = 4.9/9.8 = 0.5, so θ = 30°." },
      { question: "Doubling your distance from a lamp changes the light reading how?", answer: "It falls to a quarter." },
    ],
    advanced: "Sensor fusion combines accelerometer, gyroscope and magnetometer readings to estimate orientation without drift.",
  },
  {
    topicId: "engineering-applications",
    introduction: "Engineers use physics to design structures and machines that work safely and efficiently.",
    objectives: ["Explain safety factors.", "Recognise physics behind everyday engineering."],
    explanation: "A bridge beam bends under load; its stress depends on the bending moment and on its shape, so deep I-beams resist bending with little material. Dams must resist the hydrostatic force of the water and the overturning torque it creates. Engineers design with safety factors, making structures several times stronger than the largest expected load.",
    formulas: [
      { expression: "σ = M y / I", meaning: "Bending stress in a beam.", variables: [v("σ", "stress", "Pa"), v("M", "bending moment", "N·m"), v("y", "distance from the neutral axis", "m"), v("I", "second moment of area", "m⁴")] },
      { expression: "safety factor = capacity / expected load", meaning: "How much stronger a design is than it must be.", variables: [] },
    ],
    definitions: [
      { term: "Stress", meaning: "Internal force per unit area in a material." },
      { term: "Second moment of area", meaning: "How a cross-section's shape resists bending; for a rectangle b h³ / 12." },
    ],
    examples: ["Doubling a beam's depth makes it eight times stiffer.", "Roller coasters are designed so riders never feel more than about 5–6 g."],
    questions: [
      { question: "Why are floor joists placed on their narrow edge?", answer: "Depth matters most for bending (I ∝ h³), so on edge they are far stiffer." },
      { question: "Why do dams get thicker toward the bottom?", answer: "Water pressure, and the force it creates, grow with depth." },
    ],
    advanced: "Finite-element analysis splits structures into small pieces to compute stresses that formulas cannot handle.",
  },
];

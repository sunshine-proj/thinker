import { v, type KnowledgeEntry } from "./types";

export const ASTRONOMY_KNOWLEDGE: readonly KnowledgeEntry[] = [
  {
    topicId: "gravity",
    introduction: "Gravity is the attraction between all masses. It holds you on Earth and the planets round the Sun.",
    objectives: ["Use Newton's law of gravitation.", "Calculate surface gravity from mass and radius."],
    explanation: "Every mass attracts every other mass with a force proportional to both masses and inversely proportional to the square of the distance between their centres. At a planet's surface this gives g = GM/R², 9.8 m/s² on Earth, 1.6 on the Moon and about 3.7 on Mars.",
    formulas: [
      { expression: "F = G m₁ m₂ / r²", meaning: "Newton's law of universal gravitation.", variables: [v("F", "force", "N"), v("G", "gravitational constant, 6.674 × 10⁻¹¹", "N·m²/kg²"), v("m₁, m₂", "masses", "kg"), v("r", "distance between centres", "m")] },
      { expression: "g = G M / R²", meaning: "Surface gravity of a planet.", variables: [v("g", "gravitational field strength", "m/s²"), v("M", "planet mass", "kg"), v("R", "planet radius", "m")] },
    ],
    definitions: [
      { term: "Gravitational field", meaning: "Force per unit mass at a point." },
      { term: "Weightlessness", meaning: "The sensation in free fall, when nothing pushes back on you; gravity still acts." },
    ],
    examples: ["The ISS is 400 km up, where gravity is still about 90 % of its surface value.", "Tides come from the Moon's gravity being stronger on Earth's near side."],
    questions: [
      { question: "If you stood twice as far from Earth's centre, how strong would gravity be?", answer: "A quarter, because F ∝ 1/r²." },
      { question: "A planet has twice Earth's mass and twice its radius. What is its surface gravity?", answer: "g = 2/2² = 0.5 times Earth's." },
    ],
    advanced: "General relativity describes gravity as curved spacetime; Newton's law is its weak-field limit.",
  },
  {
    topicId: "planetary-motion",
    introduction: "Planets move round the Sun in ellipses, following Kepler's three laws.",
    objectives: ["State Kepler's laws.", "Use Kepler's third law to relate period and orbit size."],
    explanation: "First law: each orbit is an ellipse with the Sun at one focus. Second law: a line from the Sun to a planet sweeps equal areas in equal times, so planets move faster when closer. Third law: the square of the period is proportional to the cube of the average distance. Newton showed all three follow from his law of gravity.",
    formulas: [
      { expression: "T² = 4π² a³ / (G M)", meaning: "Kepler's third law.", variables: [v("T", "orbital period", "s"), v("a", "semi-major axis (average distance)", "m"), v("M", "mass of the central body", "kg")] },
    ],
    definitions: [
      { term: "Ellipse", meaning: "An oval with two foci; a circle is an ellipse with both foci together." },
      { term: "Astronomical unit (AU)", meaning: "Mean Earth–Sun distance, 1.496 × 10¹¹ m." },
    ],
    examples: ["Mars at 1.52 AU takes 1.52^1.5 ≈ 1.88 years to orbit.", "Comets swing fast past the Sun and crawl through the outer Solar System."],
    questions: [
      { question: "A planet orbits at 4 AU. What is its period?", answer: "√(4³) = 8 years." },
      { question: "When is Earth fastest in its orbit?", answer: "In early January, at perihelion, its closest point to the Sun." },
    ],
    advanced: "With several planets, their mutual pulls cause small deviations; N-body integration predicts these precisely.",
  },
  {
    topicId: "orbital-mechanics",
    introduction: "Orbital mechanics is the science of how spacecraft move under gravity and change orbits.",
    objectives: ["Calculate circular orbit speed.", "Plan a Hohmann transfer."],
    explanation: "An orbiting object is always falling but moving sideways fast enough to keep missing the planet. A circular orbit needs speed √(GM/r). The vis-viva equation gives the speed anywhere on an ellipse. To move to a higher orbit efficiently, burn forward to enter a transfer ellipse, then burn again at its far point (a Hohmann transfer).",
    formulas: [
      { expression: "v = √(G M / r)", meaning: "Speed for a circular orbit.", variables: [v("v", "orbital speed", "m/s"), v("r", "orbit radius", "m")] },
      { expression: "v² = G M (2/r − 1/a)", meaning: "Vis-viva equation for any orbit.", variables: [v("a", "semi-major axis", "m")] },
    ],
    definitions: [
      { term: "Delta-v", meaning: "Change of velocity a manoeuvre needs; the currency of spaceflight." },
      { term: "Apoapsis / periapsis", meaning: "Farthest and closest points of an orbit." },
    ],
    examples: ["The ISS orbits at about 7.7 km/s, once every 92 minutes.", "Geostationary satellites sit 35 786 km up and orbit once per sidereal day."],
    questions: [
      { question: "Why does a spacecraft speed up to move to a higher orbit, yet end up slower?", answer: "The burn raises the far side of the orbit; climbing trades speed for height, so the final circular speed is lower." },
      { question: "How does orbital speed change if the orbit radius quadruples?", answer: "It halves, because v ∝ 1/√r." },
    ],
    advanced: "Gravity assists steal a little of a planet's orbital momentum to speed spacecraft up without fuel.",
  },
  {
    topicId: "escape-velocity",
    introduction: "Escape velocity is the launch speed needed to leave a body's gravity for good, without further thrust.",
    objectives: ["Derive escape velocity from energy conservation.", "Compare escape speeds of different bodies."],
    explanation: "To escape, kinetic energy must at least equal the gravitational potential energy binding you: ½mv² = GMm/r. The mass of the escaping object cancels. Escape speed is √2 times the circular orbit speed at the same radius: 11.2 km/s from Earth's surface, 2.4 km/s from the Moon's.",
    formulas: [
      { expression: "v_esc = √(2 G M / r)", meaning: "Escape velocity from distance r.", variables: [v("v_esc", "escape velocity", "m/s"), v("M", "body mass", "kg"), v("r", "distance from centre", "m")] },
    ],
    definitions: [
      { term: "Bound orbit", meaning: "An orbit with negative total energy; the object cannot escape." },
      { term: "Specific orbital energy", meaning: "Total energy per kilogram: ½v² − GM/r." },
    ],
    examples: ["Light gases like hydrogen escape Earth's atmosphere because some molecules exceed escape speed.", "The Moon's low escape speed is why it has almost no atmosphere."],
    questions: [
      { question: "Does a heavier rocket need a higher escape speed?", answer: "No: the mass cancels, though it needs more energy." },
      { question: "What escape speed would Earth have if it shrank to a quarter of its radius with the same mass?", answer: "Twice as much, 22.4 km/s, because v ∝ 1/√r." },
    ],
    advanced: "If a mass is squeezed inside the radius where escape speed equals c, it becomes a black hole.",
  },
  {
    topicId: "stars",
    introduction: "Stars are hot balls of gas powered by fusion. Their colour tells their temperature, and their brightness tells their size.",
    objectives: ["Use Wien's law to find a star's temperature.", "Use the Stefan–Boltzmann law to relate luminosity, radius and temperature."],
    explanation: "Stars glow roughly like black bodies. Hotter stars peak at shorter wavelengths, so they look blue-white; cooler ones look red. A star's luminosity depends on its surface area and the fourth power of its temperature, so a cool red giant can still be very luminous. Plotting luminosity against temperature (the Hertzsprung–Russell diagram) sorts stars into the main sequence, giants and white dwarfs.",
    formulas: [
      { expression: "λ_max = b / T", meaning: "Wien's displacement law: peak wavelength of thermal radiation.", variables: [v("λ_max", "peak wavelength", "m"), v("b", "Wien's constant, 2.898 × 10⁻³", "m·K"), v("T", "surface temperature", "K")] },
      { expression: "L = 4π R² σ T⁴", meaning: "Luminosity of a star.", variables: [v("L", "luminosity", "W"), v("R", "radius", "m"), v("σ", "Stefan–Boltzmann constant, 5.67 × 10⁻⁸", "W/(m²·K⁴)")] },
    ],
    definitions: [
      { term: "Luminosity", meaning: "Total power a star radiates." },
      { term: "Main sequence", meaning: "The band on the H–R diagram where stars fuse hydrogen in their cores." },
    ],
    examples: ["The Sun (5772 K) peaks near 500 nm, in the green, but looks white because it emits all colours.", "Betelgeuse is cooler than the Sun yet about 100 000 times more luminous, because it is enormous."],
    questions: [
      { question: "A star peaks at 290 nm. What is its surface temperature?", answer: "T = 2.898 × 10⁻³ / 2.9 × 10⁻⁷ ≈ 10 000 K." },
      { question: "Two stars have the same temperature; one has twice the radius. How do their luminosities compare?", answer: "The larger is four times as luminous (L ∝ R²)." },
    ],
    advanced: "A star's mass sets its whole life: massive stars burn fast and explode as supernovae; the Sun will become a white dwarf.",
  },
  {
    topicId: "black-holes",
    introduction: "A black hole is a region where gravity is so strong that not even light can escape.",
    objectives: ["Calculate the Schwarzschild radius.", "Describe gravitational time dilation near a black hole."],
    explanation: "For a non-rotating black hole, the event horizon is at the Schwarzschild radius r_s = 2GM/c². A static clock at radius r runs slow by the factor √(1 − r_s/r) compared with a distant one, approaching zero at the horizon. Light can circle at 1.5 r_s (the photon sphere), and the innermost stable orbit for matter is at 3 r_s.",
    formulas: [
      { expression: "r_s = 2 G M / c²", meaning: "Schwarzschild radius of a mass M.", variables: [v("r_s", "Schwarzschild radius", "m"), v("M", "mass", "kg"), v("c", "speed of light", "m/s")] },
      { expression: "dτ/dt = √(1 − r_s / r)", meaning: "Rate of a static clock at radius r relative to a distant clock.", variables: [v("τ", "local (proper) time", "s"), v("t", "distant time", "s"), v("r", "distance from centre", "m")] },
    ],
    definitions: [
      { term: "Event horizon", meaning: "The boundary beyond which nothing can return." },
      { term: "ISCO", meaning: "Innermost stable circular orbit, 3 r_s for a non-rotating black hole." },
    ],
    examples: ["If the Sun were squeezed into a black hole, its horizon would have a radius of about 3 km.", "Sagittarius A*, at our galaxy's centre, has about 4 million solar masses."],
    questions: [
      { question: "What is Earth's Schwarzschild radius?", answer: "About 9 mm." },
      { question: "At r = 2 r_s, how fast does a static clock run compared with a distant one?", answer: "√(1 − ½) ≈ 0.71, about 71 % of the rate." },
    ],
    advanced: "Hawking showed black holes slowly radiate; for stellar black holes this is far too faint to observe.",
  },
  {
    topicId: "relativity",
    introduction: "Relativity describes how space and time depend on motion and gravity. It matters near light speed and near huge masses.",
    objectives: ["Calculate the Lorentz factor.", "Apply time dilation and length contraction.", "Explain why nothing with mass reaches c."],
    explanation: "Special relativity rests on two ideas: the laws of physics are the same in every inertial frame, and light travels at c for everyone. It follows that moving clocks run slow by γ = 1/√(1 − v²/c²) and moving lengths shrink by the same factor. Energy grows without limit as v → c. General relativity adds that gravity slows clocks too; GPS satellites must correct for both effects.",
    formulas: [
      { expression: "γ = 1 / √(1 − v² / c²)", meaning: "Lorentz factor.", variables: [v("γ", "Lorentz factor", "no unit"), v("v", "speed", "m/s"), v("c", "speed of light, 299 792 458", "m/s")] },
      { expression: "Δt = γ Δτ, L = L₀ / γ", meaning: "Time dilation and length contraction.", variables: [v("Δτ", "time on the moving clock", "s"), v("L₀", "rest length", "m")] },
      { expression: "E = γ m c²", meaning: "Total energy of a moving mass.", variables: [v("E", "energy", "J"), v("m", "mass", "kg")] },
    ],
    definitions: [
      { term: "Inertial frame", meaning: "A frame moving at constant velocity, in which Newton's first law holds." },
      { term: "Proper time", meaning: "Time measured by a clock moving with the object." },
    ],
    examples: ["Cosmic-ray muons reach the ground only because their clocks run slow.", "GPS clocks gain about 38 µs a day relative to the ground; uncorrected, positions would drift about 10 km a day."],
    questions: [
      { question: "What is γ at 0.6c?", answer: "1/√(1 − 0.36) = 1.25." },
      { question: "A twin travels to a star 4 light-years away at 0.8c and back. How much does each age?", answer: "Earth twin 10 years; travelling twin 6 years." },
    ],
    advanced: "In spacetime, the interval c²Δt² − Δx² is the same for all observers; relativity is the geometry of that invariant.",
  },
];

import { v, type KnowledgeEntry } from "./types";

export const NUCLEAR_KNOWLEDGE: readonly KnowledgeEntry[] = [
  {
    topicId: "nuclear-structure",
    introduction: "The nucleus is made of protons and neutrons, held together by the strong nuclear force.",
    objectives: ["Write nuclide notation.", "Calculate binding energy from the mass defect."],
    explanation: "A nucleus with Z protons and N neutrons has mass number A = Z + N. Its mass is less than the sum of its parts: the missing mass, times c², is the binding energy that holds it together. Binding energy per nucleon peaks near iron-56 (about 8.8 MeV), which is why fusing light nuclei and splitting heavy ones both release energy.",
    formulas: [
      { expression: "Δm = Z m_p + N m_n − m_nucleus", meaning: "Mass defect.", variables: [v("Δm", "mass defect", "kg or u"), v("Z", "protons", "no unit"), v("N", "neutrons", "no unit"), v("m_p, m_n", "proton and neutron masses", "kg or u")] },
      { expression: "E_B = Δm c²", meaning: "Binding energy; 1 u corresponds to 931.5 MeV.", variables: [v("E_B", "binding energy", "J or MeV"), v("c", "speed of light", "m/s")] },
    ],
    definitions: [
      { term: "Nucleon", meaning: "A proton or neutron." },
      { term: "Strong force", meaning: "Very short-range attraction between nucleons that overcomes the protons' repulsion." },
    ],
    examples: ["Helium-4 has a binding energy of 28.3 MeV, about 7.1 MeV per nucleon.", "A nucleus is about 10⁻¹⁵ m across; an atom about 10⁻¹⁰ m."],
    questions: [
      { question: "How many neutrons does uranium-235 (Z = 92) have?", answer: "235 − 92 = 143." },
      { question: "Why do heavy nuclei need more neutrons than protons?", answer: "Extra neutrons add strong-force attraction without adding electric repulsion." },
    ],
    advanced: "The semi-empirical (liquid-drop) formula estimates binding energy from volume, surface, Coulomb, asymmetry and pairing terms.",
  },
  {
    topicId: "isotopes",
    introduction: "Isotopes are atoms of the same element with different numbers of neutrons.",
    objectives: ["Identify isotopes from nuclide notation.", "Read the chart of nuclides."],
    explanation: "Isotopes share chemistry, because they have the same number of electrons, but differ in mass and nuclear stability. On the chart of nuclides (N across, Z up), stable nuclei form a narrow valley; nuclei above it tend to decay by β⁺ or electron capture, those below by β⁻, and very heavy ones by α decay.",
    formulas: [
      { expression: "ᴬ_Z X", meaning: "Nuclide notation: element X with mass number A and proton number Z.", variables: [v("A", "mass number", "no unit"), v("Z", "atomic number", "no unit")] },
    ],
    definitions: [
      { term: "Valley of stability", meaning: "The band of stable nuclides on the N–Z chart." },
      { term: "Radioisotope", meaning: "An unstable isotope that decays." },
    ],
    examples: ["Carbon-12 and carbon-14 are isotopes; carbon-14 is used for radiocarbon dating.", "Deuterium (hydrogen-2) makes 'heavy water'."],
    questions: [
      { question: "Are ¹⁴C and ¹⁴N isotopes?", answer: "No: they have the same mass number but different elements (different Z)." },
      { question: "A nucleus has too many neutrons for stability. How is it likely to decay?", answer: "By β⁻ decay, turning a neutron into a proton." },
    ],
    advanced: "Mass spectrometers separate isotopes by their charge-to-mass ratio in a magnetic field.",
  },
  {
    topicId: "radioactive-decay",
    introduction: "Unstable nuclei decay randomly, but large numbers of them follow a precise exponential law.",
    objectives: ["Use the decay law and half-life.", "Explain why decay is random yet predictable."],
    explanation: "Each nucleus has a fixed chance per second of decaying, independent of its age. With many nuclei, the number left falls by half every half-life. Activity, decays per second, falls the same way. You cannot tell when one nucleus will decay, but counts of many follow statistics with spread about √N.",
    formulas: [
      { expression: "N = N₀ e^(−λt) = N₀ (1/2)^(t/t½)", meaning: "Number of undecayed nuclei after time t.", variables: [v("N", "nuclei remaining", "no unit"), v("N₀", "initial nuclei", "no unit"), v("λ", "decay constant", "1/s"), v("t½", "half-life", "s")] },
      { expression: "λ = ln 2 / t½, A = λ N", meaning: "Decay constant and activity.", variables: [v("A", "activity", "Bq (decays per second)")] },
    ],
    definitions: [
      { term: "Half-life", meaning: "Time for half the nuclei in a sample to decay." },
      { term: "Becquerel (Bq)", meaning: "One decay per second." },
    ],
    examples: ["Iodine-131 (half-life 8 days) is used in medicine because it decays quickly.", "Radiocarbon dating uses carbon-14's 5730-year half-life."],
    questions: [
      { question: "What fraction of a sample remains after 3 half-lives?", answer: "(1/2)³ = 1/8." },
      { question: "Does heating a radioactive sample change its half-life?", answer: "No: nuclear decay is essentially unaffected by temperature or chemistry." },
    ],
    advanced: "In a decay chain, a daughter with a shorter half-life can reach secular equilibrium, with the same activity as its parent.",
  },
  {
    topicId: "nuclear-fusion",
    introduction: "Fusion joins light nuclei into heavier ones and releases energy. It powers the Sun.",
    objectives: ["Calculate fusion energy from mass differences.", "Explain why fusion needs extreme temperatures."],
    explanation: "Nuclei repel each other electrically, so they must approach very fast to get close enough for the strong force to grab them. The Coulomb barrier is about 0.4 MeV for deuterium–tritium, but quantum tunnelling lets fusion happen at temperatures of about 100 million K on Earth (15 million K in the Sun's dense core). D–T fusion releases 17.6 MeV per reaction.",
    formulas: [
      { expression: "Q = (Σm_before − Σm_after) c²", meaning: "Energy released by a nuclear reaction.", variables: [v("Q", "energy released", "MeV or J"), v("m", "masses", "u or kg")] },
      { expression: "U = k Z₁ Z₂ e² / r", meaning: "Coulomb barrier height at contact distance r.", variables: [v("U", "barrier energy", "J"), v("Z₁, Z₂", "charges of the nuclei", "no unit"), v("r", "contact distance", "m")] },
    ],
    definitions: [
      { term: "Plasma", meaning: "Gas so hot its atoms are stripped of electrons." },
      { term: "Tokamak", meaning: "A doughnut-shaped magnetic bottle for holding fusion plasma." },
    ],
    examples: ["The Sun turns about 4 million tonnes of mass into energy every second.", "ITER aims to produce ten times more fusion power than it uses to heat the plasma."],
    questions: [
      { question: "Why can fusion happen in the Sun even though its core is too cool to overcome the barrier classically?", answer: "Quantum tunnelling lets some nuclei pass through the barrier." },
      { question: "Why is D–T the easiest fusion fuel?", answer: "It has the lowest barrier (single charges) and a large reaction probability." },
    ],
    advanced: "The Lawson criterion sets the density, temperature and confinement time a reactor needs to produce net energy.",
  },
  {
    topicId: "nuclear-fission",
    introduction: "Fission splits a heavy nucleus into two lighter ones, releasing energy and more neutrons.",
    objectives: ["Calculate fission energy.", "Explain chain reactions and the role of control rods."],
    explanation: "A slow neutron absorbed by uranium-235 makes it split, releasing about 200 MeV and 2–3 neutrons. If on average exactly one of those causes another fission (multiplication factor k = 1), the reactor runs steadily (critical). Control rods absorb neutrons to keep k at 1; a moderator slows neutrons so they cause fission more easily. A small fraction of neutrons are delayed by seconds, which makes reactors controllable.",
    formulas: [
      { expression: "Nₙ = N₀ kⁿ", meaning: "Neutron population after n generations.", variables: [v("N₀", "initial neutrons", "no unit"), v("k", "multiplication factor", "no unit"), v("n", "generations", "no unit")] },
    ],
    definitions: [
      { term: "Critical", meaning: "k = 1: a self-sustaining, steady chain reaction." },
      { term: "Moderator", meaning: "A material such as water or graphite that slows neutrons." },
    ],
    examples: ["One kilogram of uranium-235 releases about as much energy as 3 million kg (3000 tonnes) of coal.", "Nuclear power stations generate about a tenth of the world's electricity."],
    questions: [
      { question: "What happens to a reactor's power if k = 1.001 for 1000 generations?", answer: "It grows by e¹ ≈ 2.7 times." },
      { question: "Why do delayed neutrons matter for safety?", answer: "They stretch the time between generations, so operators and control rods can respond." },
    ],
    advanced: "Point-kinetics equations model a reactor's power with prompt and delayed neutron groups.",
  },
  {
    topicId: "mass-energy",
    introduction: "Mass and energy are equivalent: a little mass corresponds to a huge amount of energy.",
    objectives: ["Use E = mc².", "Connect mass changes to nuclear and solar energy."],
    explanation: "Einstein showed that energy has mass: E = mc². Because c² is enormous, 1 g of mass is equivalent to 9 × 10¹³ J. In nuclear reactions the products weigh measurably less than the reactants; in chemistry the change exists too, but is a billion times smaller.",
    formulas: [
      { expression: "E = Δm c²", meaning: "Energy released when mass Δm is converted.", variables: [v("E", "energy", "J"), v("Δm", "mass change", "kg"), v("c", "speed of light, 3.00 × 10⁸", "m/s")] },
    ],
    definitions: [
      { term: "Rest energy", meaning: "The energy mc² an object has at rest." },
      { term: "Atomic mass unit (u)", meaning: "1/12 of a carbon-12 atom's mass, 1.661 × 10⁻²⁷ kg, equivalent to 931.5 MeV." },
    ],
    examples: ["The Sun's 3.8 × 10²⁶ W output means it loses about 4.3 million tonnes per second.", "A fully charged phone battery is heavier than a flat one by less than a billionth of a gram."],
    questions: [
      { question: "How much energy is 1 kg of mass?", answer: "9 × 10¹⁶ J." },
      { question: "A reaction releases 17.6 MeV. How much mass, in u, is lost?", answer: "17.6/931.5 ≈ 0.0189 u." },
    ],
    advanced: "Most of the mass of a proton comes not from its quarks' masses but from the energy of the strong force binding them.",
  },
];

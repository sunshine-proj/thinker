import { v, type KnowledgeEntry } from "./types";

export const THERMODYNAMICS_KNOWLEDGE: readonly KnowledgeEntry[] = [
  {
    topicId: "temperature",
    introduction: "Temperature measures how hot or cold something is: the average kinetic energy of its particles.",
    objectives: ["Convert between Celsius and kelvin.", "Relate temperature to particle motion."],
    explanation: "The kelvin scale starts at absolute zero, where classical particle motion would stop; 0 K = −273.15 °C, and a change of 1 K equals a change of 1 °C. In a gas, the average translational kinetic energy of each particle is (3/2)kT, so hotter means faster particles.",
    formulas: [
      { expression: "T(K) = θ(°C) + 273.15", meaning: "Converting Celsius to kelvin.", variables: [v("T", "absolute temperature", "K"), v("θ", "Celsius temperature", "°C")] },
      { expression: "⟨E_k⟩ = (3/2) k T", meaning: "Average kinetic energy of a gas particle.", variables: [v("k", "Boltzmann constant, 1.381 × 10⁻²³", "J/K")] },
    ],
    definitions: [
      { term: "Absolute zero", meaning: "0 K, the lowest possible temperature, which can be approached but never reached." },
      { term: "Thermometer", meaning: "A device using a property that changes with temperature, such as the expansion of a liquid." },
    ],
    examples: ["Room temperature is about 293 K.", "Air molecules at room temperature move at about 500 m/s on average."],
    questions: [
      { question: "What is 37 °C in kelvin?", answer: "310.15 K." },
      { question: "If the kelvin temperature of a gas doubles, what happens to the particles' average kinetic energy?", answer: "It doubles." },
    ],
    advanced: "Temperature is formally defined by 1/T = ∂S/∂U: how much entropy rises when energy is added.",
  },
  {
    topicId: "heat",
    introduction: "Heat is energy transferred because of a temperature difference.",
    objectives: ["Distinguish heat from temperature.", "Calculate energy for heating and melting."],
    explanation: "Heat always flows from hotter to colder by itself. Adding heat raises temperature (Q = mcΔT) or changes the state at constant temperature (Q = mL). A bath of warm water holds far more thermal energy than a red-hot spark, though the spark is hotter.",
    formulas: [
      { expression: "Q = m L", meaning: "Energy to melt or boil a mass at constant temperature.", variables: [v("Q", "energy", "J"), v("m", "mass", "kg"), v("L", "specific latent heat (334 kJ/kg to melt ice)", "J/kg")] },
    ],
    definitions: [
      { term: "Latent heat", meaning: "Energy needed to change state without changing temperature." },
      { term: "Thermal energy", meaning: "The internal energy of the random motion of particles." },
    ],
    examples: ["Melting 1 kg of ice takes as much energy as warming 1 kg of water by 80 °C.", "Steam burns are worse than boiling-water burns because steam releases latent heat as it condenses."],
    questions: [
      { question: "How much energy melts 200 g of ice at 0 °C?", answer: "Q = 0.2 × 334 000 = 66 800 J." },
      { question: "Why does the temperature of boiling water stay at 100 °C?", answer: "The energy supplied goes into changing liquid to gas, not into raising temperature." },
    ],
    advanced: "Heat and work are both energy transfers; the first law of thermodynamics says ΔU = Q − W.",
  },
  {
    topicId: "thermal-equilibrium",
    introduction: "Two objects in contact reach thermal equilibrium when they come to the same temperature.",
    objectives: ["Use energy balance to find a final temperature.", "State the zeroth law."],
    explanation: "In an insulated mixture, the heat lost by the hot part equals the heat gained by the cold part. The final temperature is a weighted average, weighted by mass × specific heat. The zeroth law says that if A and B are each in equilibrium with C, they are in equilibrium with each other, which is what makes thermometers work.",
    formulas: [
      { expression: "m₁c₁(T₁ − T_f) = m₂c₂(T_f − T₂)", meaning: "Heat lost by the hot object equals heat gained by the cold one.", variables: [v("m", "masses", "kg"), v("c", "specific heats", "J/(kg·K)"), v("T_f", "final temperature", "°C or K")] },
    ],
    definitions: [
      { term: "Zeroth law", meaning: "Systems in equilibrium with a third system are in equilibrium with each other." },
      { term: "Insulated", meaning: "Exchanging no heat with the surroundings." },
    ],
    examples: ["Mixing equal masses of water at 20 °C and 80 °C gives 50 °C.", "A house heater must replace heat lost through the walls to keep a steady temperature."],
    questions: [
      { question: "1 kg of water at 90 °C is mixed with 3 kg at 10 °C. What is the final temperature?", answer: "(1 × 90 + 3 × 10)/4 = 30 °C." },
      { question: "Why does a metal bench feel colder than a wooden one at the same temperature?", answer: "Metal conducts heat away from your skin much faster." },
    ],
    advanced: "Equilibrium is reached exponentially; the time constant depends on heat capacity and thermal conductance.",
  },
  {
    topicId: "heat-transfer",
    introduction: "Heat travels by conduction, convection and radiation.",
    objectives: ["Describe the three mechanisms.", "Use Fourier's law for conduction."],
    explanation: "Conduction passes energy through a material by particle collisions; metals conduct well. Convection carries heat with a moving fluid, such as warm air rising. Radiation is electromagnetic waves, which can cross a vacuum; hotter surfaces radiate much more (∝ T⁴).",
    formulas: [
      { expression: "P = k A ΔT / d", meaning: "Conduction through a flat layer (Fourier's law).", variables: [v("P", "heat flow", "W"), v("k", "thermal conductivity", "W/(m·K)"), v("A", "area", "m²"), v("ΔT", "temperature difference", "K"), v("d", "thickness", "m")] },
      { expression: "P = ε σ A T⁴", meaning: "Power radiated by a surface (Stefan–Boltzmann law).", variables: [v("ε", "emissivity", "no unit"), v("σ", "Stefan–Boltzmann constant, 5.67 × 10⁻⁸", "W/(m²·K⁴)"), v("T", "absolute temperature", "K")] },
    ],
    definitions: [
      { term: "Thermal conductivity", meaning: "How well a material conducts heat; copper ≈ 400, wood ≈ 0.1 W/(m·K)." },
      { term: "Insulator", meaning: "A material that conducts heat poorly, often by trapping air." },
    ],
    examples: ["Double glazing traps a layer of gas that conducts poorly.", "The Sun's energy reaches Earth only by radiation."],
    questions: [
      { question: "If a wall is made twice as thick, what happens to the heat flow?", answer: "It halves, because P ∝ 1/d." },
      { question: "Why do radiators on a wall heat a whole room?", answer: "Mostly by convection: warmed air rises and circulates." },
    ],
    advanced: "Convection is described by a heat transfer coefficient h, with P = h A ΔT; it depends strongly on the flow.",
  },
  {
    topicId: "specific-heat",
    introduction: "Specific heat capacity is the energy needed to warm 1 kg of a substance by 1 K.",
    objectives: ["Use Q = mcΔT.", "Identify materials from their specific heat."],
    explanation: "Water has an unusually large specific heat, 4186 J/(kg·K), so it warms slowly and stores much energy; metals have much smaller values (iron ≈ 450). Measuring the temperature change when a hot sample is dropped into water (calorimetry) reveals its specific heat.",
    formulas: [
      { expression: "Q = m c ΔT", meaning: "Energy to change the temperature of a mass.", variables: [v("Q", "energy", "J"), v("m", "mass", "kg"), v("c", "specific heat capacity", "J/(kg·K)"), v("ΔT", "temperature change", "K")] },
    ],
    definitions: [
      { term: "Heat capacity", meaning: "Energy per kelvin for a whole object: C = mc." },
      { term: "Calorimetry", meaning: "Measuring heat by temperature changes in an insulated container." },
    ],
    examples: ["Coastal climates are mild because the sea's large heat capacity evens out temperatures.", "A metal spoon heats up in tea much faster than the tea cools."],
    questions: [
      { question: "How much energy heats 2 kg of water from 20 °C to 70 °C?", answer: "Q = 2 × 4186 × 50 = 418 600 J." },
      { question: "Equal masses of copper and water get the same heat. Which warms more?", answer: "Copper, about ten times more, because its specific heat is about one tenth." },
    ],
    advanced: "At low temperatures specific heats fall toward zero; explaining this was an early success of quantum theory (Einstein and Debye).",
  },
  {
    topicId: "thermal-expansion",
    introduction: "Most materials expand when heated, because their particles vibrate more and push slightly farther apart.",
    objectives: ["Use the linear expansion formula.", "Explain expansion gaps and bimetallic strips."],
    explanation: "A rod of length L grows by ΔL = αLΔT, where α is the coefficient of linear expansion. Steel's α is about 12 × 10⁻⁶ per K, so a 100 m steel bridge grows about 4 cm over a 30 K range. Engineers leave gaps; a bimetallic strip bends because two bonded metals expand by different amounts.",
    formulas: [
      { expression: "ΔL = α L ΔT", meaning: "Change in length of a solid.", variables: [v("ΔL", "change in length", "m"), v("α", "coefficient of linear expansion", "1/K"), v("L", "original length", "m"), v("ΔT", "temperature change", "K")] },
    ],
    definitions: [
      { term: "Expansion joint", meaning: "A gap that lets a structure expand without buckling." },
      { term: "Bimetallic strip", meaning: "Two metals bonded together that bend when heated, used in thermostats." },
    ],
    examples: ["Railway tracks buckle on very hot days if their gaps are too small.", "Water is unusual: it expands as it freezes and is densest at 4 °C."],
    questions: [
      { question: "How much does a 20 m steel rail (α = 12 × 10⁻⁶/K) grow when it warms by 40 K?", answer: "ΔL = 12 × 10⁻⁶ × 20 × 40 ≈ 9.6 mm." },
      { question: "Why can running a tight jar lid under hot water loosen it?", answer: "The metal lid expands more than the glass." },
    ],
    advanced: "Volume expands by ΔV ≈ 3αVΔT; for liquids and gases a volume coefficient β is used instead.",
  },
  {
    topicId: "thermodynamic-laws",
    introduction: "The laws of thermodynamics set the rules for energy, heat and work, including what no engine can do.",
    objectives: ["State the first and second laws.", "Calculate Carnot efficiency and coefficients of performance."],
    explanation: "First law: energy is conserved, ΔU = Q − W. Second law: heat does not flow from cold to hot by itself, and no engine can turn all heat into work. A heat engine working between hot and cold reservoirs has a maximum efficiency set only by their temperatures (Carnot). A refrigerator uses work to pump heat from cold to hot.",
    formulas: [
      { expression: "η_max = 1 − T_c / T_h", meaning: "Carnot efficiency, the best any heat engine can do.", variables: [v("η", "efficiency", "no unit"), v("T_c, T_h", "cold and hot reservoir temperatures", "K")] },
      { expression: "COP_max = T_c / (T_h − T_c)", meaning: "Best coefficient of performance of a refrigerator.", variables: [v("COP", "heat removed per unit of work", "no unit")] },
    ],
    definitions: [
      { term: "Heat engine", meaning: "A device that turns some heat into work, such as a steam turbine." },
      { term: "Reservoir", meaning: "A body so large its temperature does not change." },
    ],
    examples: ["A power station with steam at 800 K and a river at 300 K can be at most 62 % efficient.", "Heat pumps deliver 3–4 J of heat for each joule of electricity."],
    questions: [
      { question: "What is the Carnot efficiency between 600 K and 300 K?", answer: "1 − 300/600 = 50 %." },
      { question: "Why can a fridge not cool a closed kitchen if its door is left open?", answer: "It releases more heat at the back than it removes inside (the removed heat plus the work)." },
    ],
    advanced: "The third law says entropy approaches a constant as T → 0, so absolute zero cannot be reached in a finite number of steps.",
  },
  {
    topicId: "entropy",
    introduction: "Entropy measures how many microscopic arrangements match what we see. It explains why time seems to run one way.",
    objectives: ["Relate entropy to the number of microstates.", "Explain why disorder almost always increases."],
    explanation: "There are vastly more ways to spread gas evenly through a box than to have it all in one half. If each arrangement is equally likely, the even spread is overwhelmingly probable. Boltzmann's formula S = k ln Ω connects entropy to the number of arrangements Ω. The second law, that the entropy of an isolated system does not decrease, is a statement about probability that becomes certainty for large numbers of particles.",
    formulas: [
      { expression: "S = k ln Ω", meaning: "Boltzmann's entropy formula.", variables: [v("S", "entropy", "J/K"), v("k", "Boltzmann constant", "J/K"), v("Ω", "number of microstates", "no unit")] },
      { expression: "ΔS = Q / T", meaning: "Entropy change when heat Q flows reversibly at temperature T.", variables: [v("Q", "heat", "J"), v("T", "temperature", "K")] },
    ],
    definitions: [
      { term: "Microstate", meaning: "One exact arrangement of all particles." },
      { term: "Macrostate", meaning: "What we observe, such as pressure and temperature, matched by many microstates." },
    ],
    examples: ["Perfume spreads through a room but never gathers back into the bottle.", "For 100 gas particles, the chance of finding them all in one half is (1/2)¹⁰⁰ ≈ 10⁻³⁰."],
    questions: [
      { question: "For 4 particles in two halves of a box, how likely is it that all are on the left?", answer: "(1/2)⁴ = 1/16." },
      { question: "Your fridge makes ice. Does that break the second law?", answer: "No: the fridge releases heat to the kitchen, raising total entropy more than the ice lowers it." },
    ],
    advanced: "Entropy links thermodynamics to information theory: Shannon's information entropy has the same mathematical form.",
  },
];

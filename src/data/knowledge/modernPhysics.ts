import { v, type KnowledgeEntry } from "./types";

export const MODERN_PHYSICS_KNOWLEDGE: readonly KnowledgeEntry[] = [
  {
    topicId: "atomic-structure",
    introduction: "Atoms have a tiny, dense nucleus surrounded by electrons in definite energy levels.",
    objectives: ["Describe the nuclear atom.", "Use the Bohr model to find hydrogen's energy levels and spectral lines."],
    explanation: "Rutherford's scattering experiment showed the nucleus is about 100 000 times smaller than the atom. In the Bohr model of hydrogen-like atoms, electrons can only have energies Eₙ = −13.6 eV × Z²/n². Jumping down from a higher level emits a photon with exactly the energy difference, so each element has a fingerprint of spectral lines.",
    formulas: [
      { expression: "Eₙ = −13.6 eV × Z² / n²", meaning: "Energy levels of a one-electron atom (Bohr model).", variables: [v("Eₙ", "energy of level n", "eV"), v("Z", "nuclear charge (protons)", "no unit"), v("n", "level number 1, 2, 3…", "no unit")] },
      { expression: "λ = h c / ΔE", meaning: "Wavelength of the photon from a jump of energy ΔE.", variables: [v("λ", "wavelength", "m"), v("h", "Planck constant", "J·s"), v("ΔE", "energy difference", "J")] },
    ],
    definitions: [
      { term: "Ground state", meaning: "The lowest energy level, n = 1." },
      { term: "Ionisation energy", meaning: "Energy needed to remove the electron completely." },
    ],
    examples: ["Hydrogen's red Hα line at 656 nm is the 3 → 2 jump.", "Neon signs glow in neon's own colours."],
    questions: [
      { question: "How much energy does it take to ionise hydrogen from its ground state?", answer: "13.6 eV." },
      { question: "Why do atoms emit only certain colours?", answer: "Only certain energy jumps are possible, so only certain photon energies appear." },
    ],
    advanced: "The Bohr model fails for atoms with more than one electron; quantum mechanics replaces orbits with orbitals (probability clouds).",
  },
  {
    topicId: "quantum-mechanics",
    introduction: "Quantum mechanics describes matter on small scales, where energy comes in steps and particles behave like waves.",
    objectives: ["Explain energy quantisation for a particle in a box.", "Describe quantum tunnelling."],
    explanation: "A particle confined to a region can only have certain energies, because its wave must fit inside, like a standing wave on a string: Eₙ = n²h²/(8mL²). The smaller the box, the larger the spacing. A particle can also pass through a barrier higher than its energy, with a probability that falls exponentially with barrier width and height: tunnelling, which powers the Sun and scanning tunnelling microscopes.",
    formulas: [
      { expression: "Eₙ = n² h² / (8 m L²)", meaning: "Energy levels of a particle in a one-dimensional box.", variables: [v("Eₙ", "energy", "J"), v("n", "quantum number 1, 2, 3…", "no unit"), v("h", "Planck constant, 6.626 × 10⁻³⁴", "J·s"), v("m", "mass", "kg"), v("L", "box width", "m")] },
      { expression: "T ≈ e^(−2κd), κ = √(2m(V − E))/ħ", meaning: "Approximate tunnelling probability through a wide barrier.", variables: [v("T", "transmission probability", "no unit"), v("d", "barrier width", "m"), v("V", "barrier height", "J"), v("E", "particle energy", "J"), v("ħ", "reduced Planck constant h/2π", "J·s")] },
    ],
    definitions: [
      { term: "Wavefunction", meaning: "The quantum description of a particle; its squared size gives probability." },
      { term: "Tunnelling", meaning: "Passing through a barrier that classical physics forbids." },
    ],
    examples: ["Quantum dots of different sizes glow in different colours because L sets the level spacing.", "Flash memory stores data by tunnelling electrons through thin insulating layers."],
    questions: [
      { question: "If a box is made half as wide, how do its energy levels change?", answer: "They become four times larger, because E ∝ 1/L²." },
      { question: "Why do we never see a football tunnel through a wall?", answer: "Its mass is so large that κ is enormous and the probability is effectively zero." },
    ],
    advanced: "The Schrödinger equation iħ ∂ψ/∂t = Ĥψ governs how wavefunctions evolve.",
  },
  {
    topicId: "wave-particle-duality",
    introduction: "Light and matter both show wave and particle behaviour, depending on how you look.",
    objectives: ["Calculate the de Broglie wavelength.", "Explain the double-slit experiment with electrons."],
    explanation: "Light arrives in particles (photons) yet forms interference patterns. De Broglie proposed that matter has a wavelength λ = h/p. Electrons fired one at a time through two slits land as single dots, yet build up an interference pattern, so each electron's wave passes through both slits. Electrons accelerated through 100 V have λ ≈ 0.12 nm, comparable to atomic spacings, which is why electron diffraction works.",
    formulas: [
      { expression: "λ = h / p = h / (m v)", meaning: "de Broglie wavelength (non-relativistic).", variables: [v("λ", "wavelength", "m"), v("h", "Planck constant", "J·s"), v("p", "momentum", "kg·m/s")] },
      { expression: "λ = h / √(2 m e V)", meaning: "Wavelength of an electron accelerated through voltage V.", variables: [v("e", "elementary charge", "C"), v("V", "accelerating voltage", "V")] },
    ],
    definitions: [
      { term: "Photon", meaning: "A quantum of light with energy E = hf." },
      { term: "Matter wave", meaning: "The wave associated with a moving particle." },
    ],
    examples: ["Electron microscopes see far finer detail than light microscopes.", "Even buckyball molecules (60 carbon atoms) have shown double-slit interference."],
    questions: [
      { question: "If an electron's speed doubles, what happens to its wavelength?", answer: "It halves, because λ ∝ 1/v." },
      { question: "What happens to the interference pattern if you detect which slit each electron goes through?", answer: "It disappears; the electrons form two bands instead." },
    ],
    advanced: "Complementarity: the experimental setup decides which aspect you see; both are part of one quantum description.",
  },
  {
    topicId: "photoelectric-effect",
    introduction: "Light shining on a metal can knock out electrons, but only if each photon has enough energy.",
    objectives: ["Use Einstein's photoelectric equation.", "Find the threshold frequency and stopping potential."],
    explanation: "Each photon gives all its energy hf to one electron. The electron needs at least the work function φ to escape; anything left over is kinetic energy. Below the threshold frequency, no electrons emerge however bright the light. Brighter light means more photons, so more electrons, but not faster ones. Einstein won the 1921 Nobel Prize for this explanation.",
    formulas: [
      { expression: "E_k,max = h f − φ", meaning: "Einstein's photoelectric equation.", variables: [v("E_k,max", "maximum kinetic energy of electrons", "J or eV"), v("h", "Planck constant", "J·s"), v("f", "light frequency", "Hz"), v("φ", "work function of the metal", "J or eV")] },
      { expression: "e V_s = E_k,max", meaning: "The stopping voltage measures the electrons' maximum energy.", variables: [v("V_s", "stopping potential", "V")] },
    ],
    definitions: [
      { term: "Work function", meaning: "Minimum energy to free an electron from a metal surface." },
      { term: "Threshold frequency", meaning: "f₀ = φ/h; below it no electrons are emitted." },
    ],
    examples: ["Solar cells and camera sensors convert photons into electrical signals.", "Ultraviolet light discharges a negatively charged zinc plate; red light does not."],
    questions: [
      { question: "Light of 400 nm (3.10 eV) hits sodium (φ = 2.28 eV). What is the electrons' maximum energy?", answer: "0.82 eV." },
      { question: "Why does very bright red light fail to eject electrons from zinc?", answer: "Each red photon has too little energy; brightness adds photons, not energy per photon." },
    ],
    advanced: "The slope of stopping potential against frequency is h/e, which Millikan used to measure Planck's constant.",
  },
  {
    topicId: "particle-physics",
    introduction: "Particle physics studies the smallest building blocks of matter and the forces between them.",
    objectives: ["Name the main families of particles.", "Identify particles from their tracks in a magnetic field."],
    explanation: "Matter is built from quarks (which make protons and neutrons) and leptons (such as the electron and the muon); forces are carried by bosons such as the photon. In a detector with a magnetic field, a charged particle's track curves with radius r = p/(|q|B): the direction of the curve shows the charge's sign, and the radius gives the momentum.",
    formulas: [
      { expression: "r = p / (|q| B)", meaning: "Radius of a charged particle's track.", variables: [v("r", "radius of curvature", "m"), v("p", "momentum", "kg·m/s"), v("q", "charge", "C"), v("B", "magnetic field", "T")] },
    ],
    definitions: [
      { term: "Antiparticle", meaning: "A particle with the same mass and opposite charge, such as the positron." },
      { term: "Standard Model", meaning: "The theory of all known elementary particles and three of the four forces." },
    ],
    examples: ["The positron was discovered in 1932 from a track curving the 'wrong' way.", "The Higgs boson was found at CERN's Large Hadron Collider in 2012."],
    questions: [
      { question: "An electron and a positron with equal momentum enter a field. How do their tracks differ?", answer: "Same radius, curving in opposite directions." },
      { question: "A track curves more tightly. What does that say about the particle's momentum?", answer: "Lower momentum (for the same charge and field)." },
    ],
    advanced: "Gravity is not part of the Standard Model; uniting it with quantum mechanics is a major open problem.",
  },
  {
    topicId: "quantum-superposition",
    introduction: "A quantum system can be in a combination of states until it is measured.",
    objectives: ["Use amplitudes to find measurement probabilities.", "Explain how polarisers demonstrate quantum measurement."],
    explanation: "A qubit can be in the state α|0⟩ + β|1⟩; measuring it gives 0 with probability |α|² and 1 with probability |β|², and the probabilities add to 1. Amplitudes can interfere, which is how a Mach–Zehnder interferometer sends every photon out of one port. A photon passing a polariser at angle θ to its polarisation gets through with probability cos²θ (Malus's law, one photon at a time).",
    formulas: [
      { expression: "P(0) = |α|², P(1) = |β|², |α|² + |β|² = 1", meaning: "Born rule for a two-state system.", variables: [v("α, β", "amplitudes", "no unit"), v("P", "probabilities", "no unit")] },
      { expression: "P = cos² θ", meaning: "Probability a polarised photon passes a polariser at angle θ.", variables: [v("θ", "angle between polarisation and polariser", "°")] },
    ],
    definitions: [
      { term: "Superposition", meaning: "A combination of states that is itself a valid state." },
      { term: "Measurement", meaning: "An interaction that gives a definite result and changes the state to match it." },
    ],
    examples: ["Quantum computers use superpositions of many qubits.", "Three polarisers at 0°, 45° and 90° pass light where two at 0° and 90° block it all."],
    questions: [
      { question: "A qubit has α = 0.6. What is the probability of measuring 1?", answer: "|β|² = 1 − 0.36 = 0.64." },
      { question: "What fraction of polarised photons pass a polariser at 60°?", answer: "cos² 60° = 0.25." },
    ],
    advanced: "Entangled particles share one superposition; measuring one immediately fixes the correlations with the other, though no signal travels.",
  },
];

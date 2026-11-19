import { v, type KnowledgeEntry } from "./types";

export const ELECTROMAGNETISM_KNOWLEDGE: readonly KnowledgeEntry[] = [
  {
    topicId: "electric-charge",
    introduction: "Electric charge is a property of matter that makes it push or pull on other charges.",
    objectives: ["Describe positive and negative charge.", "Use Coulomb's law to find the force between charges."],
    explanation: "Charge comes in two kinds. Like charges repel, unlike charges attract. Protons carry +e and electrons −e, with e = 1.602 × 10⁻¹⁹ C, and charge is always conserved. Rubbing two materials moves electrons from one to the other. The force between point charges falls with the square of their distance.",
    formulas: [
      { expression: "F = k q₁ q₂ / r²", meaning: "Coulomb's law for two point charges.", variables: [v("F", "force", "N"), v("k", "Coulomb constant, 8.99 × 10⁹", "N·m²/C²"), v("q₁, q₂", "charges", "C"), v("r", "distance between them", "m")] },
    ],
    definitions: [
      { term: "Coulomb (C)", meaning: "Unit of charge; about 6.24 × 10¹⁸ electrons." },
      { term: "Conductor", meaning: "A material in which charges move freely, such as a metal." },
    ],
    examples: ["A balloon rubbed on hair picks up electrons and then sticks to a wall.", "Lightning is a huge flow of charge between a cloud and the ground."],
    questions: [
      { question: "If the distance between two charges doubles, what happens to the force?", answer: "It falls to a quarter, because F ∝ 1/r²." },
      { question: "Why does a charged balloon attract an uncharged wall?", answer: "Its charge pushes the wall's electrons slightly away, leaving the nearer surface oppositely charged, and the closer charge wins." },
    ],
    advanced: "Inside the nucleus protons repel enormously; the strong nuclear force holds them together over very short ranges.",
  },
  {
    topicId: "electric-fields",
    introduction: "An electric field is the region around a charge where other charges feel a force.",
    objectives: ["Define field strength as force per charge.", "Sketch field lines for point charges."],
    explanation: "The field strength E at a point is the force a +1 C test charge would feel there. Field lines start on positive charges and end on negative ones; they are closer together where the field is stronger. Between two parallel charged plates the field is uniform, E = V/d.",
    formulas: [
      { expression: "E = F / q", meaning: "Field strength is force per unit charge.", variables: [v("E", "electric field strength", "N/C = V/m"), v("F", "force", "N"), v("q", "test charge", "C")] },
      { expression: "E = k Q / r²", meaning: "Field of a point charge.", variables: [v("Q", "source charge", "C"), v("r", "distance", "m")] },
    ],
    definitions: [
      { term: "Field line", meaning: "A line showing the direction a positive charge would be pushed." },
      { term: "Uniform field", meaning: "A field with the same strength and direction everywhere." },
    ],
    examples: ["An old cathode-ray TV steered electrons with electric fields.", "Sharks sense the tiny electric fields of their prey's muscles."],
    questions: [
      { question: "What force does a 2 µC charge feel in a field of 5000 N/C?", answer: "F = qE = 2 × 10⁻⁶ × 5000 = 0.01 N." },
      { question: "Which way does an electron move in a field pointing east?", answer: "West: negative charges feel a force opposite to the field." },
    ],
    advanced: "Gauss's law relates the field through a closed surface to the charge inside, and is one of Maxwell's four equations.",
  },
  {
    topicId: "voltage",
    introduction: "Voltage, or potential difference, is the energy given to or taken from each coulomb of charge.",
    objectives: ["Define voltage as energy per charge.", "Relate voltage to the energy transferred in a circuit."],
    explanation: "A battery gives every coulomb that passes through it a certain energy; 1 volt means 1 joule per coulomb. In a circuit the charges give that energy to the components. Around any closed loop, the voltages gained equal the voltages used (Kirchhoff's voltage law).",
    formulas: [
      { expression: "V = E / Q", meaning: "Potential difference is energy transferred per charge.", variables: [v("V", "potential difference", "V"), v("E", "energy", "J"), v("Q", "charge", "C")] },
    ],
    definitions: [
      { term: "Volt (V)", meaning: "One joule per coulomb." },
      { term: "Electromotive force (emf)", meaning: "The energy per charge a source supplies." },
    ],
    examples: ["A 1.5 V cell gives each coulomb 1.5 J.", "A bird on a high-voltage wire is safe: both feet are at nearly the same potential."],
    questions: [
      { question: "How much energy does 3 C of charge gain from a 12 V battery?", answer: "E = VQ = 36 J." },
      { question: "Two 1.5 V cells in series give what voltage?", answer: "3 V: voltages of cells in series add." },
    ],
    advanced: "An electron accelerated through 1 V gains 1 electron-volt (eV) = 1.602 × 10⁻¹⁹ J, the natural energy unit of atomic physics.",
  },
  {
    topicId: "current",
    introduction: "Electric current is the rate at which charge flows past a point.",
    objectives: ["Calculate current from charge and time.", "Explain current in series and parallel circuits."],
    explanation: "Current is measured in amperes: 1 A is 1 C per second. In a metal wire, electrons drift slowly (millimetres per second) but the signal travels at nearly light speed. In a series circuit the same current flows everywhere; at a junction, the currents in equal the currents out (Kirchhoff's current law).",
    formulas: [
      { expression: "I = Q / t", meaning: "Current is charge per unit time.", variables: [v("I", "current", "A"), v("Q", "charge", "C"), v("t", "time", "s")] },
    ],
    definitions: [
      { term: "Ampere (A)", meaning: "One coulomb per second." },
      { term: "Conventional current", meaning: "Drawn from + to −, opposite to the electrons' motion." },
    ],
    examples: ["A phone charger supplies about 2 A.", "A current of about 0.1 A through the chest can be fatal, which is why residual-current devices trip at 0.03 A."],
    questions: [
      { question: "How much charge flows through a 0.5 A lamp in a minute?", answer: "Q = It = 0.5 × 60 = 30 C." },
      { question: "In a parallel circuit, 2 A flows into a junction and 0.5 A leaves along one branch. What flows in the other?", answer: "1.5 A." },
    ],
    advanced: "Current density J = n q v_d links current to the number of carriers and their drift speed.",
  },
  {
    topicId: "resistance",
    introduction: "Resistance measures how strongly a component opposes current.",
    objectives: ["Calculate resistance from voltage and current.", "Combine resistors in series and parallel."],
    explanation: "Resistance depends on the material, length and thickness of a conductor: longer and thinner means more resistance. Resistors in series add; in parallel the combined resistance is smaller than the smallest one. Current through a resistance turns electrical energy into heat at a rate I²R.",
    formulas: [
      { expression: "R = ρ L / A", meaning: "Resistance of a wire.", variables: [v("R", "resistance", "Ω"), v("ρ", "resistivity", "Ω·m"), v("L", "length", "m"), v("A", "cross-sectional area", "m²")] },
      { expression: "R_series = R₁ + R₂; 1/R_parallel = 1/R₁ + 1/R₂", meaning: "Combining resistors.", variables: [v("R₁, R₂", "resistances", "Ω")] },
      { expression: "P = I² R", meaning: "Heating power in a resistor.", variables: [v("P", "power", "W"), v("I", "current", "A")] },
    ],
    definitions: [
      { term: "Ohm (Ω)", meaning: "One volt per ampere." },
      { term: "Resistivity", meaning: "A material's resistance for a 1 m cube; copper's is 1.7 × 10⁻⁸ Ω·m." },
    ],
    examples: ["Toasters use high-resistance wire that glows red-hot.", "Power lines use thick wires and high voltage to keep I²R losses small."],
    questions: [
      { question: "What is the total of 6 Ω and 3 Ω in parallel?", answer: "1/R = 1/6 + 1/3 = 1/2, so R = 2 Ω." },
      { question: "A wire is stretched to twice its length (same volume). How does its resistance change?", answer: "It becomes four times larger: length doubles and area halves." },
    ],
    advanced: "Resistance of metals rises with temperature; some materials become superconductors with zero resistance when very cold.",
  },
  {
    topicId: "ohms-law",
    introduction: "Ohm's law says that for many conductors the current is proportional to the voltage.",
    objectives: ["Use V = IR.", "Recognise ohmic and non-ohmic components."],
    explanation: "For an ohmic conductor at constant temperature, doubling the voltage doubles the current; the current-voltage graph is a straight line through the origin. Filament lamps (which heat up) and diodes (which conduct one way) are not ohmic.",
    formulas: [
      { expression: "V = I R", meaning: "Voltage across a resistance equals current times resistance.", variables: [v("V", "potential difference", "V"), v("I", "current", "A"), v("R", "resistance", "Ω")] },
    ],
    definitions: [
      { term: "Ohmic", meaning: "Following V = IR with a constant R." },
      { term: "I–V graph", meaning: "A plot of current against voltage for a component." },
    ],
    examples: ["A 230 V kettle drawing 10 A has a resistance of 23 Ω.", "LEDs need a series resistor to limit the current."],
    questions: [
      { question: "What current flows through 470 Ω connected to 9 V?", answer: "I = V/R ≈ 0.019 A = 19 mA." },
      { question: "Why does a lamp's current not double when its voltage doubles?", answer: "The filament gets hotter and its resistance rises." },
    ],
    advanced: "Ohm's law is an empirical rule for materials, not a fundamental law; microscopically it comes from electrons scattering off the lattice.",
  },
  {
    topicId: "electric-circuits",
    introduction: "A circuit is a closed path in which charge flows from a source through components and back.",
    objectives: ["Analyse series and parallel circuits.", "Calculate electrical power and energy."],
    explanation: "In series, components share the voltage and carry the same current; if one breaks, all stop. In parallel, each branch gets the full voltage and currents add, which is why homes are wired in parallel. Electrical power is P = VI, and the energy used is P × t.",
    formulas: [
      { expression: "P = V I", meaning: "Electrical power.", variables: [v("P", "power", "W"), v("V", "voltage", "V"), v("I", "current", "A")] },
      { expression: "E = P t", meaning: "Energy transferred in a time.", variables: [v("E", "energy", "J"), v("t", "time", "s")] },
    ],
    definitions: [
      { term: "Short circuit", meaning: "A path of very low resistance that lets a dangerously large current flow." },
      { term: "Fuse", meaning: "A thin wire that melts and breaks the circuit when the current is too large." },
    ],
    examples: ["A 2 kW heater on 230 V draws about 8.7 A.", "Old Christmas lights in series all went out when one bulb failed."],
    questions: [
      { question: "How much energy, in kWh, does a 60 W lamp use in 10 hours?", answer: "0.6 kWh (60 W × 10 h)." },
      { question: "Why are house sockets wired in parallel?", answer: "Each appliance gets the full mains voltage and works independently." },
    ],
    advanced: "Kirchhoff's laws, current conservation at junctions and voltage sums round loops, solve any network of resistors.",
  },
  {
    topicId: "magnetic-fields",
    introduction: "Magnetic fields surround magnets and electric currents and push on moving charges.",
    objectives: ["Describe the field around a magnet, a wire and a solenoid.", "Calculate the field of a wire and a solenoid."],
    explanation: "Field lines run from north to south outside a magnet. A current-carrying wire is circled by field lines (right-hand grip rule), and a coil (solenoid) makes a nearly uniform field inside, like a bar magnet. An iron core multiplies the field until the iron saturates near 2 T.",
    formulas: [
      { expression: "B = μ₀ I / (2π r)", meaning: "Field at distance r from a long straight wire.", variables: [v("B", "magnetic field", "T"), v("μ₀", "permeability of free space, 1.257 × 10⁻⁶", "T·m/A"), v("I", "current", "A"), v("r", "distance", "m")] },
      { expression: "B = μ₀ n I", meaning: "Field inside a long solenoid.", variables: [v("n", "turns per metre", "1/m")] },
    ],
    definitions: [
      { term: "Tesla (T)", meaning: "Unit of magnetic field; Earth's field is about 50 µT." },
      { term: "Solenoid", meaning: "A long coil of wire." },
    ],
    examples: ["MRI scanners use superconducting coils with fields of 1.5–3 T.", "A compass needle lines up with Earth's magnetic field."],
    questions: [
      { question: "What is the field 2 cm from a wire carrying 10 A?", answer: "B = 2 × 10⁻⁷ × 10 / 0.02 = 1 × 10⁻⁴ T = 100 µT." },
      { question: "How can you make a solenoid's field stronger?", answer: "More turns per metre, more current, or an iron core." },
    ],
    advanced: "There are no magnetic monopoles: magnetic field lines always close on themselves (∇·B = 0).",
  },
  {
    topicId: "lorentz-force",
    introduction: "A charge moving through a magnetic field feels a force at right angles to both its motion and the field.",
    objectives: ["Use F = qvB.", "Explain circular motion of charges in a magnetic field."],
    explanation: "The magnetic force is F = q v × B. Because it is always perpendicular to the velocity, it changes the direction but never the speed or kinetic energy. A charge moving across a uniform field goes round a circle of radius r = mv/(|q|B); with some velocity along the field it follows a helix. An electron curves the opposite way to a proton.",
    formulas: [
      { expression: "F = q (E + v × B)", meaning: "Total electromagnetic (Lorentz) force.", variables: [v("F", "force", "N"), v("q", "charge", "C"), v("E", "electric field", "V/m"), v("v", "velocity", "m/s"), v("B", "magnetic field", "T")] },
      { expression: "r = m v / (|q| B)", meaning: "Radius of the circle for motion across the field.", variables: [v("r", "radius", "m"), v("m", "mass", "kg")] },
    ],
    definitions: [
      { term: "Cyclotron frequency", meaning: "f = |q|B/(2πm), the rate of circling, independent of speed." },
      { term: "Velocity selector", meaning: "Crossed E and B fields that let through only charges with v = E/B." },
    ],
    examples: ["Aurorae form where charged particles spiral along Earth's field into the atmosphere.", "Electric motors turn because currents in wires feel this force."],
    questions: [
      { question: "Why does a magnetic field not speed up a charged particle?", answer: "The force is always perpendicular to its motion, so it does no work." },
      { question: "Which has a bigger circle at the same speed in the same field: an electron or a proton?", answer: "The proton, because r ∝ m and it is 1836 times heavier." },
    ],
    advanced: "At speeds near c, the radius uses relativistic momentum, r = γ m v/(|q|B), which is why cyclotrons must be modified for high energies.",
  },
  {
    topicId: "electromagnetic-induction",
    introduction: "A changing magnetic field through a coil creates a voltage. This is how generators and transformers work.",
    objectives: ["State Faraday's and Lenz's laws.", "Calculate the induced emf of a rotating coil."],
    explanation: "Faraday's law: the induced emf equals the rate of change of magnetic flux linkage. Move a magnet into a coil, or spin a coil in a field, and a current flows. Lenz's law: the induced current opposes the change that caused it, which is why it takes work to turn a generator. A coil of N turns and area A spinning at angular speed ω in field B gives a peak emf NBAω.",
    formulas: [
      { expression: "ε = −N dΦ/dt", meaning: "Faraday's law (the minus sign is Lenz's law).", variables: [v("ε", "induced emf", "V"), v("N", "number of turns", "no unit"), v("Φ", "magnetic flux B A", "Wb")] },
      { expression: "ε₀ = N B A ω", meaning: "Peak emf of a coil rotating in a uniform field.", variables: [v("A", "coil area", "m²"), v("ω", "angular speed", "rad/s")] },
    ],
    definitions: [
      { term: "Magnetic flux", meaning: "Field times the area it passes through: Φ = B A cos θ." },
      { term: "Transformer", meaning: "Two coils on an iron core that change AC voltage in the ratio of their turns." },
    ],
    examples: ["Power stations spin huge coils in magnetic fields.", "Induction hobs heat pans with currents induced in the metal."],
    questions: [
      { question: "Why does a magnet fall slowly through a copper pipe?", answer: "It induces currents in the pipe whose fields oppose its motion (Lenz's law)." },
      { question: "A coil's rotation speed doubles. What happens to its peak emf?", answer: "It doubles, because ε₀ ∝ ω." },
    ],
    advanced: "Maxwell added that a changing electric field also makes a magnetic field; together they predict electromagnetic waves travelling at c.",
  },
];

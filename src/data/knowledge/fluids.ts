import { v, type KnowledgeEntry } from "./types";

export const FLUIDS_KNOWLEDGE: readonly KnowledgeEntry[] = [
  {
    topicId: "density",
    introduction: "Density is how much mass is packed into each cubic metre of a material.",
    objectives: ["Calculate density from mass and volume.", "Predict floating and sinking from density."],
    explanation: "Density ρ = m/V. Water is 1000 kg/m³, air about 1.2, steel about 7850. An object denser than a liquid sinks in it; less dense, it floats. A hollow steel ship floats because its average density, hull plus air, is less than water's.",
    formulas: [
      { expression: "ρ = m / V", meaning: "Density is mass per unit volume.", variables: [v("ρ", "density", "kg/m³"), v("m", "mass", "kg"), v("V", "volume", "m³")] },
    ],
    definitions: [
      { term: "Average density", meaning: "Total mass divided by total volume of an object, including any hollow space." },
      { term: "Relative density", meaning: "Density compared with water's." },
    ],
    examples: ["Ice (917 kg/m³) floats on water, which is why lakes freeze from the top.", "A fresh egg sinks in water but floats in strong salt water."],
    questions: [
      { question: "A 2 kg block has a volume of 0.0025 m³. Will it float in water?", answer: "Its density is 800 kg/m³, less than water's, so it floats." },
      { question: "Why does a helium balloon rise?", answer: "The balloon's average density is less than the surrounding air's." },
    ],
    advanced: "Density changes with temperature and pressure; water's maximum density at 4 °C shapes how lakes mix.",
  },
  {
    topicId: "pressure",
    introduction: "Pressure is force per unit area. In a liquid it grows with depth.",
    objectives: ["Calculate pressure from force and area.", "Use P = ρgh for hydrostatic pressure."],
    explanation: "A sharp knife cuts because its force acts on a tiny area. In a fluid at rest, pressure acts equally in all directions and increases with depth because of the weight of fluid above: every 10 m of water adds about 1 atmosphere. Pressure depends only on depth, not on the shape of the container.",
    formulas: [
      { expression: "P = F / A", meaning: "Pressure is force per unit area.", variables: [v("P", "pressure", "Pa = N/m²"), v("F", "force", "N"), v("A", "area", "m²")] },
      { expression: "P = P₀ + ρ g h", meaning: "Pressure at depth h in a liquid.", variables: [v("P₀", "pressure at the surface", "Pa"), v("ρ", "liquid density", "kg/m³"), v("g", "gravitational acceleration", "m/s²"), v("h", "depth", "m")] },
    ],
    definitions: [
      { term: "Pascal (Pa)", meaning: "One newton per square metre." },
      { term: "Gauge pressure", meaning: "Pressure above atmospheric, ρgh in a liquid." },
    ],
    examples: ["Dams are thicker at the bottom where the water pressure is greatest.", "Snowshoes spread your weight to lower the pressure on snow."],
    questions: [
      { question: "What is the gauge pressure 20 m under water?", answer: "ρgh = 1000 × 9.8 × 20 ≈ 196 kPa, about 2 atmospheres." },
      { question: "Why do your ears hurt at the bottom of a deep pool?", answer: "The water pressure outside the eardrum is larger than the air pressure inside." },
    ],
    advanced: "Pascal's principle: pressure applied to a confined fluid is transmitted everywhere, which is how hydraulic brakes multiply force.",
  },
  {
    topicId: "buoyancy",
    introduction: "Buoyancy is the upward push of a fluid on an object in it.",
    objectives: ["State Archimedes' principle.", "Calculate how deep a floating object sits."],
    explanation: "Archimedes' principle: the upthrust equals the weight of fluid displaced. A floating object sinks until it displaces its own weight of fluid, so the fraction submerged is ρ_object/ρ_fluid. A ship also needs stability: its metacentre must lie above its centre of gravity, or a small tilt grows and it capsizes.",
    formulas: [
      { expression: "F_b = ρ_fluid g V_submerged", meaning: "Archimedes' principle.", variables: [v("F_b", "buoyant force", "N"), v("ρ_fluid", "fluid density", "kg/m³"), v("V_submerged", "submerged volume", "m³")] },
      { expression: "fraction submerged = ρ_object / ρ_fluid", meaning: "How much of a floating object is under the surface.", variables: [v("ρ_object", "average density of the object", "kg/m³")] },
    ],
    definitions: [
      { term: "Upthrust", meaning: "Another name for the buoyant force." },
      { term: "Metacentric height", meaning: "Distance from the centre of gravity up to the metacentre; it must be positive for stability." },
    ],
    examples: ["About 90 % of an iceberg is under water.", "Submarines dive by flooding tanks to raise their average density."],
    questions: [
      { question: "A block of density 600 kg/m³ floats in water. What fraction is submerged?", answer: "60 %." },
      { question: "Why does a loaded ship sit lower in fresh water than in the sea?", answer: "Fresh water is less dense, so more volume must be displaced." },
    ],
    advanced: "For a box-shaped barge, the metacentric height is d/2 + B²/(12d) − KG, where d is the draft and B the beam.",
  },
  {
    topicId: "fluid-dynamics",
    introduction: "Fluid dynamics describes moving fluids, from blood in arteries to air over wings.",
    objectives: ["Use the continuity equation.", "Distinguish laminar and turbulent flow with the Reynolds number."],
    explanation: "An incompressible fluid flowing through a pipe has the same volume flow everywhere, so it speeds up where the pipe narrows (A₁v₁ = A₂v₂). Slow, smooth flow is laminar; fast flow becomes turbulent. The Reynolds number compares inertia with viscosity; in pipes, flow is usually laminar below about 2300.",
    formulas: [
      { expression: "A₁ v₁ = A₂ v₂", meaning: "Continuity: volume flow rate is constant.", variables: [v("A", "cross-sectional area", "m²"), v("v", "flow speed", "m/s")] },
      { expression: "Re = ρ v D / μ", meaning: "Reynolds number for pipe flow.", variables: [v("Re", "Reynolds number", "no unit"), v("ρ", "density", "kg/m³"), v("D", "pipe diameter", "m"), v("μ", "dynamic viscosity", "Pa·s")] },
    ],
    definitions: [
      { term: "Laminar flow", meaning: "Smooth flow in layers." },
      { term: "Turbulent flow", meaning: "Chaotic flow with eddies." },
    ],
    examples: ["Putting a thumb over a hose makes the water squirt faster.", "Smoke rises smoothly at first, then breaks into swirls as it speeds up."],
    questions: [
      { question: "Water at 2 m/s enters a pipe that narrows to half its area. How fast does it flow there?", answer: "4 m/s." },
      { question: "Is honey or water more likely to flow turbulently at the same speed?", answer: "Water, because honey's much larger viscosity gives a tiny Reynolds number." },
    ],
    advanced: "The Navier–Stokes equations govern viscous flow; proving their solutions always stay smooth is a million-dollar open problem.",
  },
  {
    topicId: "bernoulli",
    introduction: "Bernoulli's principle: in a flowing fluid, where the speed is higher the pressure is lower.",
    objectives: ["Apply Bernoulli's equation.", "Explain a Venturi meter."],
    explanation: "Along a streamline of steady, frictionless, incompressible flow, pressure plus kinetic energy per volume plus potential energy per volume is constant. In a narrow throat the fluid speeds up and its pressure drops; measuring that drop (a Venturi meter) gives the flow rate. It is energy conservation for fluids.",
    formulas: [
      { expression: "P + ½ ρ v² + ρ g h = constant", meaning: "Bernoulli's equation along a streamline.", variables: [v("P", "pressure", "Pa"), v("ρ", "density", "kg/m³"), v("v", "speed", "m/s"), v("h", "height", "m")] },
    ],
    definitions: [
      { term: "Streamline", meaning: "A path followed by fluid particles in steady flow." },
      { term: "Venturi effect", meaning: "Pressure drop where a flow is constricted." },
    ],
    examples: ["A shower curtain is pulled inward by the moving air and water.", "Perfume atomisers draw liquid up by blowing air across a tube."],
    questions: [
      { question: "Water speeds up from 1 m/s to 3 m/s in a level pipe. By how much does its pressure fall?", answer: "½ × 1000 × (9 − 1) = 4000 Pa." },
      { question: "Why must Bernoulli's equation be used with care for wing lift?", answer: "Lift also needs the wing to turn the air downward; the 'equal transit time' explanation is wrong." },
    ],
    advanced: "Bernoulli's equation neglects viscosity; real pipes need extra friction losses (Darcy–Weisbach).",
  },
  {
    topicId: "viscosity",
    introduction: "Viscosity is a fluid's resistance to flowing, its 'thickness'.",
    objectives: ["Use Stokes' law for a sphere falling slowly through a fluid.", "Use Poiseuille's law for flow in a narrow pipe."],
    explanation: "Honey is about 10 000 times more viscous than water. A small sphere sinking slowly feels a drag 6πμrv (Stokes' law), so it reaches a terminal speed that reveals the viscosity, the principle of the falling-ball viscometer. In a narrow pipe, flow rate grows with the fourth power of the radius, so slightly narrowed arteries carry much less blood.",
    formulas: [
      { expression: "F = 6 π μ r v", meaning: "Stokes drag on a slow sphere (Re < 1).", variables: [v("F", "drag force", "N"), v("μ", "dynamic viscosity", "Pa·s"), v("r", "sphere radius", "m"), v("v", "speed", "m/s")] },
      { expression: "v_t = 2 (ρ_s − ρ_f) g r² / (9 μ)", meaning: "Terminal speed of a small sphere in a viscous fluid.", variables: [v("ρ_s, ρ_f", "sphere and fluid densities", "kg/m³")] },
      { expression: "Q = π r⁴ ΔP / (8 μ L)", meaning: "Poiseuille flow rate in a pipe.", variables: [v("Q", "volume flow rate", "m³/s"), v("ΔP", "pressure drop", "Pa"), v("L", "pipe length", "m")] },
    ],
    definitions: [
      { term: "Dynamic viscosity μ", meaning: "Water is about 0.001 Pa·s; honey about 10 Pa·s." },
      { term: "Terminal velocity", meaning: "Constant speed when drag and buoyancy balance weight." },
    ],
    examples: ["Motor oil is graded by viscosity, because it must flow when cold and still protect when hot.", "Fog droplets stay up because their terminal speeds are tiny."],
    questions: [
      { question: "If a pipe's radius halves, how does Poiseuille flow change?", answer: "It falls to 1/16 of its value." },
      { question: "A steel ball falls twice as fast in fluid A as in fluid B. Which is more viscous?", answer: "Fluid B, about twice as viscous (v_t ∝ 1/μ), if the densities are similar." },
    ],
    advanced: "Many real fluids, such as ketchup and blood, are non-Newtonian: their viscosity changes with how fast they are sheared.",
  },
  {
    topicId: "aerodynamics",
    introduction: "Aerodynamics studies the forces on objects moving through air: lift and drag.",
    objectives: ["Use the lift and drag equations.", "Relate angle of attack to lift."],
    explanation: "Lift L = ½ρv²SC_L and drag D = ½ρv²SC_D. The lift coefficient rises with angle of attack until the wing stalls, around 15°. An aircraft in level flight needs lift equal to its weight, so it must fly faster when heavy or in thin air. The glide ratio, lift divided by drag, sets how far a glider travels per metre of height lost.",
    formulas: [
      { expression: "L = ½ ρ v² S C_L", meaning: "Lift on a wing.", variables: [v("L", "lift", "N"), v("ρ", "air density", "kg/m³"), v("v", "airspeed", "m/s"), v("S", "wing area", "m²"), v("C_L", "lift coefficient", "no unit")] },
      { expression: "D = ½ ρ v² S C_D", meaning: "Drag force.", variables: [v("D", "drag", "N"), v("C_D", "drag coefficient", "no unit")] },
    ],
    definitions: [
      { term: "Angle of attack", meaning: "Angle between the wing and the oncoming air." },
      { term: "Stall", meaning: "Sudden loss of lift when the angle of attack is too large." },
    ],
    examples: ["Racing cars use upside-down wings to push their tyres onto the track.", "Cyclists tuck down to reduce their drag area."],
    questions: [
      { question: "If an aircraft flies twice as fast, how does the lift at the same angle change?", answer: "It is four times larger, because L ∝ v²." },
      { question: "A glider has a glide ratio of 40. How far can it glide from 1 km up in still air?", answer: "About 40 km." },
    ],
    advanced: "Induced drag, from wingtip vortices, falls with speed while parasitic drag rises; their sum is least at the best glide speed.",
  },
];

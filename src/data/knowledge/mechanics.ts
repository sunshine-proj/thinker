import { v, type KnowledgeEntry } from "./types";

export const MECHANICS_KNOWLEDGE: readonly KnowledgeEntry[] = [
  {
    topicId: "motion",
    introduction: "Motion is a change of position over time. To describe it you need a reference point, a direction and a clock.",
    objectives: ["Describe position and displacement relative to a reference point.", "Tell distance travelled from displacement."],
    explanation: "Position says where something is relative to a chosen origin. Displacement is the straight-line change of position, with a direction; distance is the total length of the path. A runner who laps a 400 m track has run 400 m but has zero displacement. Graphs of position against time show motion at a glance: a straight line means steady motion, a curve means the motion is changing.",
    formulas: [
      { expression: "Δx = x₂ − x₁", meaning: "Displacement is the final position minus the initial position.", variables: [v("Δx", "displacement", "m"), v("x₁, x₂", "initial and final position", "m")] },
    ],
    definitions: [
      { term: "Displacement", meaning: "Change of position, including direction." },
      { term: "Reference frame", meaning: "The origin, axes and clock you measure motion against." },
    ],
    examples: ["A lift that goes up 3 floors and down 3 floors has moved but has zero displacement.", "On a train you are at rest relative to your seat but moving relative to the ground."],
    questions: [
      { question: "You walk 3 m east and then 4 m north. What is your displacement?", answer: "5 m, in a direction about 53° north of east (Pythagoras: √(3² + 4²) = 5)." },
      { question: "Can distance travelled be smaller than the size of the displacement?", answer: "No. The straight line is the shortest path, so distance ≥ |displacement|." },
    ],
    advanced: "Motion is relative: Galilean relativity says the laws of mechanics are the same in every frame moving at constant velocity. Special relativity extends this to light.",
  },
  {
    topicId: "velocity",
    introduction: "Velocity tells you how fast something moves and in which direction.",
    objectives: ["Calculate average velocity from displacement and time.", "Distinguish speed from velocity."],
    explanation: "Average velocity is displacement divided by the time taken; it has a direction. Speed is the size of the velocity, with no direction. On a position-time graph the slope is the velocity: a steeper line means faster motion, and a negative slope means moving backwards.",
    formulas: [
      { expression: "v = Δx / Δt", meaning: "Average velocity is the displacement per unit time.", variables: [v("v", "velocity", "m/s"), v("Δx", "displacement", "m"), v("Δt", "time interval", "s")] },
    ],
    definitions: [
      { term: "Speed", meaning: "How fast, regardless of direction: the magnitude of the velocity." },
      { term: "Instantaneous velocity", meaning: "The velocity at one moment, the slope of the position-time graph there." },
    ],
    examples: ["A car's speedometer shows speed; a satnav that also knows your heading knows your velocity.", "100 km/h is 27.8 m/s: divide by 3.6."],
    questions: [
      { question: "A cyclist covers 9 km in 30 minutes. What is the average speed in m/s?", answer: "9000 m ÷ 1800 s = 5 m/s." },
      { question: "A car drives round a roundabout at a steady 30 km/h. Is its velocity constant?", answer: "No: its speed is constant but its direction changes, so its velocity changes." },
    ],
    advanced: "Instantaneous velocity is the derivative v = dx/dt; the area under a velocity-time graph gives the displacement.",
  },
  {
    topicId: "acceleration",
    introduction: "Acceleration is how quickly velocity changes, by speeding up, slowing down or turning.",
    objectives: ["Calculate acceleration from a change in velocity.", "Use the equations of uniformly accelerated motion."],
    explanation: "Acceleration is the change in velocity divided by the time it takes. Braking is acceleration opposite to the motion. With constant acceleration a, starting at speed u, the velocity after time t is u + at and the distance is ut + ½at². The slope of a velocity-time graph is the acceleration.",
    formulas: [
      { expression: "a = Δv / Δt", meaning: "Acceleration is the change of velocity per unit time.", variables: [v("a", "acceleration", "m/s²"), v("Δv", "change in velocity", "m/s"), v("Δt", "time interval", "s")] },
      { expression: "s = u t + ½ a t²", meaning: "Distance covered with constant acceleration.", variables: [v("s", "displacement", "m"), v("u", "initial velocity", "m/s"), v("t", "time", "s"), v("a", "acceleration", "m/s²")] },
      { expression: "v² = u² + 2 a s", meaning: "Links speeds and distance without time; used for stopping distances.", variables: [v("v", "final velocity", "m/s"), v("u", "initial velocity", "m/s"), v("a", "acceleration", "m/s²"), v("s", "displacement", "m")] },
    ],
    definitions: [
      { term: "Uniform acceleration", meaning: "Acceleration that stays the same over time." },
      { term: "Deceleration", meaning: "Everyday word for acceleration that reduces speed." },
    ],
    examples: ["A sports car going 0–100 km/h in 4 s accelerates at about 7 m/s².", "Doubling a car's speed quadruples its braking distance, because s = v²/2a."],
    questions: [
      { question: "A ball is dropped. Ignoring air, how fast is it falling after 2 s?", answer: "v = g t ≈ 9.8 × 2 ≈ 19.6 m/s." },
      { question: "A car at 20 m/s brakes at 5 m/s². How far does it travel before stopping?", answer: "s = v²/(2a) = 400/10 = 40 m." },
    ],
    advanced: "Acceleration is the second derivative of position, a = d²x/dt². In circular motion an object accelerates toward the centre even at constant speed.",
  },
  {
    topicId: "newtons-laws",
    introduction: "Newton's three laws connect force and motion; they are the foundation of classical mechanics.",
    objectives: ["State the three laws.", "Use F = ma to predict acceleration.", "Identify action-reaction pairs."],
    explanation: "First law: an object stays at rest or keeps moving in a straight line at constant speed unless a net force acts on it. Second law: the net force equals mass times acceleration. Third law: when A pushes on B, B pushes back on A with an equal and opposite force; the two forces act on different objects, so they do not cancel.",
    formulas: [
      { expression: "F_net = m a", meaning: "The net force produces an acceleration in its own direction; more mass means less acceleration.", variables: [v("F_net", "net (resultant) force", "N"), v("m", "mass", "kg"), v("a", "acceleration", "m/s²")] },
    ],
    definitions: [
      { term: "Inertia", meaning: "The tendency of a mass to keep its state of motion." },
      { term: "Newton (N)", meaning: "The force that gives 1 kg an acceleration of 1 m/s²." },
    ],
    examples: ["A puck on ice glides far because almost no net force slows it.", "A rocket pushes gas backwards; the gas pushes the rocket forwards."],
    questions: [
      { question: "What net force gives a 1200 kg car an acceleration of 2 m/s²?", answer: "F = m a = 1200 × 2 = 2400 N." },
      { question: "A book rests on a table. What is the reaction to the Earth's pull on the book?", answer: "The book's pull on the Earth, not the table's push (that pair is book–table)." },
    ],
    advanced: "Newton's second law is more generally F = dp/dt, which also covers changing mass, such as a rocket burning fuel.",
  },
  {
    topicId: "forces",
    introduction: "A force is a push or pull. Forces have size and direction, and they add as vectors.",
    objectives: ["Draw a free-body diagram.", "Find the resultant of several forces.", "Relate weight to mass."],
    explanation: "Common forces are weight (gravity), the normal force from a surface, tension in ropes, friction and drag. A free-body diagram shows every force on one object as an arrow. Forces in the same line add or subtract; at angles, add them head-to-tail or by components. Weight is W = mg, and it is a force in newtons, not a mass.",
    formulas: [
      { expression: "W = m g", meaning: "Weight is mass times gravitational field strength.", variables: [v("W", "weight", "N"), v("m", "mass", "kg"), v("g", "gravitational field strength", "N/kg = m/s²")] },
    ],
    definitions: [
      { term: "Resultant force", meaning: "The single force with the same effect as all the forces together." },
      { term: "Normal force", meaning: "The push of a surface on an object, perpendicular to the surface." },
    ],
    examples: ["A 60 kg person weighs about 590 N on Earth and about 97 N on the Moon.", "Bridges carry loads by turning them into tension and compression in their parts."],
    questions: [
      { question: "Forces of 30 N east and 40 N north act on a box. What is the resultant?", answer: "50 N, about 53° north of east." },
      { question: "Does your mass change on the Moon?", answer: "No. Your mass stays the same; your weight is about one sixth." },
    ],
    advanced: "On a slope, split weight into components mg sin θ along the slope and mg cos θ into it.",
  },
  {
    topicId: "friction",
    introduction: "Friction is the force between surfaces that opposes sliding. Without it you could not walk or brake.",
    objectives: ["Distinguish static and kinetic friction.", "Use the coefficient of friction to calculate the force."],
    explanation: "Static friction holds an object still and grows as needed up to a maximum μ_s N. Once sliding starts, kinetic friction μ_k N acts, usually a little smaller. Friction depends on the surfaces and on how hard they press together (the normal force), but barely on the contact area. On a slope an object starts to slide when tan θ exceeds μ_s.",
    formulas: [
      { expression: "F_s ≤ μ_s N", meaning: "Static friction can be anything up to its maximum.", variables: [v("F_s", "static friction", "N"), v("μ_s", "coefficient of static friction", "no unit"), v("N", "normal force", "N")] },
      { expression: "F_k = μ_k N", meaning: "Kinetic friction while sliding.", variables: [v("F_k", "kinetic friction", "N"), v("μ_k", "coefficient of kinetic friction", "no unit"), v("N", "normal force", "N")] },
    ],
    definitions: [
      { term: "Coefficient of friction μ", meaning: "Ratio of friction force to normal force for a pair of surfaces." },
      { term: "Critical angle", meaning: "Steepest slope on which an object stays put: tan θ = μ_s." },
    ],
    examples: ["Rubber on dry asphalt has μ ≈ 0.7–0.9; on ice it drops below 0.1.", "Anti-lock brakes keep tyres rolling so static friction, which is larger, does the braking."],
    questions: [
      { question: "A 10 kg box on a floor with μ_k = 0.3 is pushed along. What is the friction force?", answer: "F = μ_k m g ≈ 0.3 × 10 × 9.8 ≈ 29 N." },
      { question: "Why does a heavier box need more force to slide but not more to accelerate once it slides with the same μ?", answer: "Friction grows with weight, and so does the mass to accelerate; the deceleration μ_k g is the same." },
    ],
    advanced: "Friction comes from microscopic contact points bonding and breaking; the real contact area is a tiny fraction of the apparent one.",
  },
  {
    topicId: "momentum",
    introduction: "Momentum is mass times velocity, the 'quantity of motion'. In a collision it is conserved.",
    objectives: ["Calculate momentum.", "Apply conservation of momentum to collisions.", "Relate impulse to force and time."],
    explanation: "If no outside force acts, the total momentum of a system stays the same, whatever happens inside it. In an elastic collision kinetic energy is also conserved; in an inelastic one some becomes heat and sound, and if the objects stick together the loss is the largest possible. Impulse, force × time, equals the change of momentum, which is why spreading a stop over a longer time reduces the force.",
    formulas: [
      { expression: "p = m v", meaning: "Momentum of a moving object.", variables: [v("p", "momentum", "kg·m/s"), v("m", "mass", "kg"), v("v", "velocity", "m/s")] },
      { expression: "m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂", meaning: "Total momentum before a collision equals the total after.", variables: [v("m₁, m₂", "masses", "kg"), v("u", "velocities before", "m/s"), v("v", "velocities after", "m/s")] },
      { expression: "F Δt = Δp", meaning: "Impulse equals the change in momentum.", variables: [v("F", "average force", "N"), v("Δt", "contact time", "s"), v("Δp", "change in momentum", "kg·m/s")] },
    ],
    definitions: [
      { term: "Elastic collision", meaning: "A collision in which kinetic energy is conserved." },
      { term: "Impulse", meaning: "Force multiplied by the time it acts." },
    ],
    examples: ["Airbags and crumple zones lengthen the stopping time and so reduce the force.", "A gun recoils because the bullet gains forward momentum."],
    questions: [
      { question: "A 2 kg cart at 3 m/s hits a stationary 1 kg cart and they stick. How fast do they move?", answer: "Total momentum 6 kg·m/s shared by 3 kg: 2 m/s." },
      { question: "Why do you bend your knees when landing from a jump?", answer: "It lengthens the time to stop, so the same change of momentum needs a smaller force." },
    ],
    advanced: "Momentum conservation follows from the symmetry of physics under shifts in space (Noether's theorem).",
  },
  {
    topicId: "energy",
    introduction: "Energy is the ability to do work. It changes form but is never created or destroyed.",
    objectives: ["Calculate kinetic and gravitational potential energy.", "Use energy conservation to predict speeds."],
    explanation: "A moving object has kinetic energy ½mv²; a raised object has gravitational potential energy mgh. Without friction, the total stays constant, so a roller coaster that drops h metres gains speed √(2gh). Friction and drag turn mechanical energy into heat, which is why real rides lose height on each hill.",
    formulas: [
      { expression: "E_k = ½ m v²", meaning: "Kinetic energy of a moving mass.", variables: [v("E_k", "kinetic energy", "J"), v("m", "mass", "kg"), v("v", "speed", "m/s")] },
      { expression: "E_p = m g h", meaning: "Gravitational potential energy near Earth's surface.", variables: [v("E_p", "potential energy", "J"), v("m", "mass", "kg"), v("g", "gravitational acceleration", "m/s²"), v("h", "height", "m")] },
    ],
    definitions: [
      { term: "Joule (J)", meaning: "Energy transferred when a force of 1 N acts over 1 m." },
      { term: "Conservation of energy", meaning: "Energy only changes form; the total in a closed system is constant." },
    ],
    examples: ["A 1 kg ball dropped from 5 m hits the ground at about 9.9 m/s.", "A car's brakes turn its kinetic energy into heat."],
    questions: [
      { question: "How fast is a coaster moving after a frictionless 20 m drop from rest?", answer: "v = √(2gh) = √(2 × 9.8 × 20) ≈ 19.8 m/s." },
      { question: "If you double your speed, what happens to your kinetic energy?", answer: "It quadruples, because E_k ∝ v²." },
    ],
    advanced: "Energy conservation follows from the laws of physics not changing with time (Noether's theorem).",
  },
  {
    topicId: "work-power",
    introduction: "Work is energy transferred by a force; power is how fast that transfer happens.",
    objectives: ["Calculate work done by a force.", "Calculate power and efficiency."],
    explanation: "A force does work when it moves something along its direction: W = F d cos θ. Carrying a bag horizontally at steady speed does no work on it against gravity. Power is work per second, measured in watts. Machines cannot create energy; efficiency is the useful output divided by the input.",
    formulas: [
      { expression: "W = F d cos θ", meaning: "Work done by a force along a displacement.", variables: [v("W", "work", "J"), v("F", "force", "N"), v("d", "displacement", "m"), v("θ", "angle between force and motion", "°")] },
      { expression: "P = W / t", meaning: "Power is the rate of doing work.", variables: [v("P", "power", "W"), v("W", "work or energy", "J"), v("t", "time", "s")] },
      { expression: "η = useful output / input", meaning: "Efficiency, always below 1 for real machines.", variables: [v("η", "efficiency", "no unit (often %)")] },
    ],
    definitions: [
      { term: "Watt (W)", meaning: "One joule per second." },
      { term: "Efficiency", meaning: "Fraction of input energy that ends up as useful output." },
    ],
    examples: ["Lifting 50 kg by 2 m takes about 980 J; doing it in 2 s needs about 490 W.", "A kettle rated 2 kW transfers 2000 J every second."],
    questions: [
      { question: "A lift raises 800 kg by 30 m in 20 s. What power does it need, ignoring losses?", answer: "P = mgh/t = 800 × 9.8 × 30 / 20 ≈ 11.8 kW." },
      { question: "Does a person holding a heavy box still do work on the box?", answer: "No work is done on the box (it does not move), though muscles use energy internally." },
    ],
    advanced: "Power is also force times velocity, P = F v, which explains why a car's top speed is limited by engine power against drag.",
  },
  {
    topicId: "circular-motion",
    introduction: "An object moving in a circle is always accelerating toward the centre, even at constant speed.",
    objectives: ["Calculate centripetal acceleration and force.", "Explain why loops need a minimum speed."],
    explanation: "The direction of motion keeps turning, so there is an acceleration v²/r toward the centre. Some real force must supply it: tension, friction, gravity or a track's push. There is no outward 'centrifugal force' acting on you from outside; you feel pressed outward because your body tends to go straight. At the top of a loop, gravity alone can provide the acceleration if v² ≥ g r.",
    formulas: [
      { expression: "a = v² / r = ω² r", meaning: "Centripetal acceleration toward the centre.", variables: [v("a", "centripetal acceleration", "m/s²"), v("v", "speed", "m/s"), v("r", "radius", "m"), v("ω", "angular speed", "rad/s")] },
      { expression: "F = m v² / r", meaning: "Net force needed to keep a mass on the circle.", variables: [v("F", "centripetal force", "N"), v("m", "mass", "kg")] },
    ],
    definitions: [
      { term: "Centripetal", meaning: "Directed toward the centre of the circle." },
      { term: "g-force", meaning: "Acceleration felt, expressed as a multiple of g." },
    ],
    examples: ["A car taking a bend relies on friction from the tyres.", "Astronauts in orbit are in free fall: gravity supplies exactly the centripetal force."],
    questions: [
      { question: "What is the minimum speed at the top of a 10 m-radius loop?", answer: "v = √(g r) = √(98) ≈ 9.9 m/s." },
      { question: "A car doubles its speed on the same bend. How much more friction does it need?", answer: "Four times as much, because F ∝ v²." },
    ],
    advanced: "In a rotating frame you can describe motion with fictitious forces (centrifugal and Coriolis), which explain weather patterns on Earth.",
  },
  {
    topicId: "rotation",
    introduction: "Rotation is turning about an axis. Rotating objects have rotational inertia and angular momentum.",
    objectives: ["Relate torque and angular acceleration.", "Use moment of inertia to explain rolling races.", "Apply conservation of angular momentum."],
    explanation: "Torque is the turning effect of a force. How hard an object is to spin depends on its moment of inertia, which grows when mass is far from the axis. A hoop rolls down a slope more slowly than a solid disc of the same mass and radius, because more of its energy goes into spinning. With no outside torque, angular momentum Iω is conserved: a skater who pulls in their arms spins faster.",
    formulas: [
      { expression: "τ = I α", meaning: "Rotational form of Newton's second law.", variables: [v("τ", "torque", "N·m"), v("I", "moment of inertia", "kg·m²"), v("α", "angular acceleration", "rad/s²")] },
      { expression: "a = g sin θ / (1 + I/(m r²))", meaning: "Acceleration of a body rolling without slipping down a slope.", variables: [v("a", "acceleration", "m/s²"), v("θ", "slope angle", "°"), v("m", "mass", "kg"), v("r", "radius", "m")] },
      { expression: "L = I ω", meaning: "Angular momentum, conserved without outside torque.", variables: [v("L", "angular momentum", "kg·m²/s"), v("ω", "angular speed", "rad/s")] },
    ],
    definitions: [
      { term: "Moment of inertia", meaning: "Rotational inertia: I = Σ m r², larger when mass is far from the axis." },
      { term: "Rolling without slipping", meaning: "The contact point is momentarily at rest, so v = ω r." },
    ],
    examples: ["A solid sphere (I = 2/5 mr²) beats a hollow one (2/3 mr²) down any slope.", "Divers tuck to spin faster and open out to slow down before entering the water."],
    questions: [
      { question: "Which wins a race down a ramp: a hoop or a solid disc?", answer: "The disc: a = g sin θ/(1 + ½) versus g sin θ/(1 + 1) for the hoop." },
      { question: "A skater spinning at 2 rev/s halves their moment of inertia. How fast do they spin?", answer: "4 rev/s, because Iω stays the same." },
    ],
    advanced: "Angular momentum conservation follows from rotational symmetry; it is why planets sweep equal areas in equal times.",
  },
  {
    topicId: "equilibrium",
    introduction: "An object is in equilibrium when the forces and turning effects on it balance.",
    objectives: ["Apply the conditions for equilibrium.", "Use the principle of moments to balance a lever."],
    explanation: "For an object to stay at rest, the net force must be zero and the net torque about any point must be zero. For a seesaw this is the principle of moments: clockwise moments equal anticlockwise moments about the pivot. A uniform beam's weight acts at its centre of mass.",
    formulas: [
      { expression: "Σ F = 0, Σ τ = 0", meaning: "Conditions for static equilibrium.", variables: [v("F", "forces", "N"), v("τ", "torques about any point", "N·m")] },
      { expression: "τ = F d", meaning: "Torque of a force at perpendicular distance d from the pivot.", variables: [v("τ", "torque", "N·m"), v("F", "force", "N"), v("d", "perpendicular distance", "m")] },
    ],
    definitions: [
      { term: "Centre of mass", meaning: "The point where the whole weight can be taken to act." },
      { term: "Stable equilibrium", meaning: "After a small push, the object returns to its position." },
    ],
    examples: ["A 30 kg child 2 m from the pivot balances a 60 kg adult 1 m from it.", "Cranes use counterweights so their total torque stays near zero."],
    questions: [
      { question: "Where must a 40 kg child sit to balance a 20 kg child 3 m from the pivot?", answer: "1.5 m from the pivot on the other side: 40 × 1.5 = 20 × 3." },
      { question: "Why is a wide-based object harder to tip over?", answer: "Its centre of mass must rise further, and stay over the base for longer, before it topples." },
    ],
    advanced: "Engineers analyse bridges and buildings as networks of members in equilibrium, solving for tension and compression in each part.",
  },
];

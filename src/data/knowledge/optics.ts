import { v, type KnowledgeEntry } from "./types";

export const OPTICS_KNOWLEDGE: readonly KnowledgeEntry[] = [
  {
    topicId: "reflection",
    introduction: "Reflection is light bouncing off a surface. On a smooth surface the angles are predictable.",
    objectives: ["State the law of reflection.", "Distinguish regular and diffuse reflection."],
    explanation: "The angle of reflection equals the angle of incidence, both measured from the normal (the line perpendicular to the surface). A mirror reflects regularly and forms images; paper reflects diffusely in all directions, which is why you can see it from anywhere but cannot see yourself in it.",
    formulas: [
      { expression: "θᵢ = θᵣ", meaning: "Law of reflection.", variables: [v("θᵢ", "angle of incidence from the normal", "°"), v("θᵣ", "angle of reflection from the normal", "°")] },
    ],
    definitions: [
      { term: "Normal", meaning: "A line at right angles to the surface where the ray hits." },
      { term: "Diffuse reflection", meaning: "Scattering of light in many directions from a rough surface." },
    ],
    examples: ["Periscopes use two mirrors at 45° to see over walls.", "Bike reflectors use corner shapes that send light straight back to its source."],
    questions: [
      { question: "A ray hits a mirror at 30° to the surface. What is the angle of reflection?", answer: "60° from the normal (30° to the surface)." },
      { question: "Why can a laser maze be solved with plane mirrors?", answer: "Each mirror turns the beam predictably by twice the angle between the beam and the mirror." },
    ],
    advanced: "Turning a mirror by an angle α turns the reflected beam by 2α, a fact used in sensitive galvanometers.",
  },
  {
    topicId: "refraction",
    introduction: "Refraction is the bending of light as it passes from one material into another, because its speed changes.",
    objectives: ["Use Snell's law.", "Explain total internal reflection."],
    explanation: "Light travels more slowly in glass or water than in air. The refractive index n = c/v says how much slower. Entering a denser medium, light bends toward the normal; leaving it, away from the normal. Beyond the critical angle, light inside the denser medium cannot escape and is totally reflected, which is how optical fibres carry signals.",
    formulas: [
      { expression: "n₁ sin θ₁ = n₂ sin θ₂", meaning: "Snell's law of refraction.", variables: [v("n₁, n₂", "refractive indices", "no unit"), v("θ₁, θ₂", "angles from the normal", "°")] },
      { expression: "sin θ_c = n₂ / n₁", meaning: "Critical angle for total internal reflection (n₁ > n₂).", variables: [v("θ_c", "critical angle", "°")] },
    ],
    definitions: [
      { term: "Refractive index", meaning: "Ratio of light's speed in vacuum to its speed in the material: water 1.33, glass about 1.5." },
      { term: "Total internal reflection", meaning: "Complete reflection inside a denser medium beyond the critical angle." },
    ],
    examples: ["A straw in water looks bent at the surface.", "Diamonds sparkle because their high index (2.42) gives a small critical angle."],
    questions: [
      { question: "Light enters glass (n = 1.5) at 30°. What is the refraction angle?", answer: "sin θ₂ = sin 30°/1.5 = 0.333, so θ₂ ≈ 19.5°." },
      { question: "What is the critical angle for glass to air?", answer: "sin θ_c = 1/1.5, θ_c ≈ 41.8°." },
    ],
    advanced: "Snell's law follows from Fermat's principle: light takes the path of least time.",
  },
  {
    topicId: "lenses",
    introduction: "Lenses refract light to focus it, forming images that can be larger, smaller, upright or inverted.",
    objectives: ["Use the thin-lens equation.", "Calculate magnification."],
    explanation: "A converging (convex) lens brings parallel rays to a focus at distance f; a diverging (concave) lens spreads them as if from a virtual focus. For an object at distance u, the image forms at distance v given by the lens equation. Objects beyond f give real, inverted images; objects inside f give a virtual, upright, magnified image, as in a magnifying glass.",
    formulas: [
      { expression: "1/f = 1/u + 1/v", meaning: "Thin-lens equation (real-is-positive convention).", variables: [v("f", "focal length", "m"), v("u", "object distance", "m"), v("v", "image distance", "m")] },
      { expression: "m = v / u", meaning: "Size of the magnification.", variables: [v("m", "magnification", "no unit")] },
      { expression: "P = 1/f", meaning: "Lens power, used by opticians.", variables: [v("P", "power", "dioptres (1/m)")] },
    ],
    definitions: [
      { term: "Focal length", meaning: "Distance from the lens to where parallel rays meet." },
      { term: "Real image", meaning: "An image light actually passes through; it can be shown on a screen." },
    ],
    examples: ["A camera focuses by moving its lens to change v.", "A +2.5 dioptre reading lens has f = 0.4 m."],
    questions: [
      { question: "An object 30 cm from a 10 cm lens: where is the image?", answer: "1/v = 1/10 − 1/30 = 1/15, so v = 15 cm, real and half-size." },
      { question: "Where must an object be for a converging lens to act as a magnifier?", answer: "Closer to the lens than its focal length." },
    ],
    advanced: "Real lenses suffer aberrations: different colours focus at different distances (chromatic aberration), corrected with lens combinations.",
  },
  {
    topicId: "mirrors",
    introduction: "Plane and curved mirrors form images by reflection.",
    objectives: ["Describe images in plane mirrors.", "Use the mirror equation for concave and convex mirrors."],
    explanation: "A plane mirror forms a virtual image as far behind it as the object is in front, the same size and laterally reversed. A concave mirror focuses parallel light at f = R/2, like a converging lens; a convex mirror spreads light, giving a smaller, upright image with a wide field of view.",
    formulas: [
      { expression: "1/f = 1/u + 1/v, f = R/2", meaning: "Mirror equation and focal length of a spherical mirror.", variables: [v("f", "focal length", "m"), v("R", "radius of curvature", "m"), v("u, v", "object and image distances", "m")] },
    ],
    definitions: [
      { term: "Virtual image", meaning: "An image from which light only appears to come." },
      { term: "Concave mirror", meaning: "A mirror curved inward like a spoon's bowl." },
    ],
    examples: ["Shop security mirrors are convex to show a wide area.", "Make-up mirrors are concave: close up, they give an enlarged upright image."],
    questions: [
      { question: "How tall must a plane mirror be to see your whole body?", answer: "Half your height, wherever you stand." },
      { question: "Why do car wing mirrors say objects are closer than they appear?", answer: "They are convex, so images are smaller and seem farther away." },
    ],
    advanced: "Large telescopes use parabolic mirrors because spherical ones do not bring all parallel rays to the same focus.",
  },
  {
    topicId: "light-spectrum",
    introduction: "White light is a mixture of colours; visible light is a small part of the electromagnetic spectrum.",
    objectives: ["Relate colour to wavelength.", "Explain dispersion and rainbows."],
    explanation: "Visible light runs from about 380 nm (violet) to 750 nm (red). Glass and water have slightly different refractive indices for different colours, so a prism spreads white light into a spectrum (dispersion). A rainbow forms when sunlight refracts into raindrops, reflects inside and refracts out; red appears at about 42° from the antisolar point and violet at about 40°.",
    formulas: [
      { expression: "c = f λ", meaning: "Speed of light equals frequency times wavelength.", variables: [v("c", "speed of light, 3.00 × 10⁸", "m/s"), v("f", "frequency", "Hz"), v("λ", "wavelength", "m")] },
    ],
    definitions: [
      { term: "Dispersion", meaning: "Splitting of light into colours because the refractive index depends on wavelength." },
      { term: "Electromagnetic spectrum", meaning: "Radio, microwaves, infrared, visible, ultraviolet, X-rays and gamma rays." },
    ],
    examples: ["A secondary rainbow, at about 51°, has its colours reversed because light reflects twice.", "Infrared cameras see heat radiated by warm bodies."],
    questions: [
      { question: "What is the frequency of green light of wavelength 550 nm?", answer: "f = c/λ ≈ 5.5 × 10¹⁴ Hz." },
      { question: "Why must the Sun be behind you to see a rainbow?", answer: "Drops send light back toward the Sun's direction at about 42°." },
    ],
    advanced: "The rainbow angle is the angle of minimum deviation; light piles up there, which is why the bow is bright.",
  },
  {
    topicId: "optical-instruments",
    introduction: "Microscopes, telescopes, cameras and the eye combine lenses or mirrors to form useful images.",
    objectives: ["Calculate the magnification of a compound microscope.", "Explain the resolution limit."],
    explanation: "A compound microscope's objective makes a magnified real image, which the eyepiece magnifies again; the total is roughly (tube length/f_objective) × (25 cm/f_eyepiece). A telescope's magnification is f_objective/f_eyepiece. Magnifying more than about 1000 times the numerical aperture shows no extra detail, because diffraction limits resolution to about half a wavelength.",
    formulas: [
      { expression: "M ≈ (L / f_o) × (D / f_e)", meaning: "Magnification of a compound microscope.", variables: [v("L", "tube length", "m"), v("f_o, f_e", "objective and eyepiece focal lengths", "m"), v("D", "near point, 0.25", "m")] },
      { expression: "d ≈ 0.61 λ / NA", meaning: "Smallest resolvable separation (Rayleigh).", variables: [v("d", "resolvable distance", "m"), v("λ", "wavelength", "m"), v("NA", "numerical aperture", "no unit")] },
    ],
    definitions: [
      { term: "Resolution", meaning: "The smallest detail an instrument can separate." },
      { term: "Empty magnification", meaning: "Enlarging beyond the resolution limit, which shows nothing new." },
    ],
    examples: ["A 160 mm tube with a 4 mm objective and 25 mm eyepiece magnifies about 400×.", "Electron microscopes beat the light limit because electron wavelengths are tiny."],
    questions: [
      { question: "Why can a light microscope not show individual atoms?", answer: "Atoms (~0.1 nm) are far smaller than the ~200 nm diffraction limit of visible light." },
      { question: "A telescope has f_o = 1 m and f_e = 25 mm. What is its magnification?", answer: "40×." },
    ],
    advanced: "Super-resolution microscopy uses fluorescent molecules switched on one at a time to get around the diffraction limit.",
  },
  {
    topicId: "optical-interference",
    introduction: "When light waves overlap they add up: bright where crests meet crests, dark where crests meet troughs.",
    objectives: ["Explain constructive and destructive interference of light.", "Calculate fringe spacing and thin-film colours."],
    explanation: "Light from two narrow slits forms bright and dark fringes on a screen, spaced λL/d: proof that light is a wave (Young, 1801). In a thin film such as a soap bubble, light reflecting from the front and back surfaces interferes; which colours are reinforced depends on the film's thickness, giving shifting rainbow colours.",
    formulas: [
      { expression: "Δy = λ L / d", meaning: "Spacing of double-slit fringes.", variables: [v("Δy", "fringe spacing", "m"), v("λ", "wavelength", "m"), v("L", "slit–screen distance", "m"), v("d", "slit separation", "m")] },
      { expression: "2 n t = (m + ½) λ", meaning: "Bright reflection from a thin film in air (one reflection inverts the wave).", variables: [v("n", "film refractive index", "no unit"), v("t", "film thickness", "m"), v("m", "order 0, 1, 2…", "no unit")] },
    ],
    definitions: [
      { term: "Coherent", meaning: "Waves with a fixed phase relationship, needed for a steady pattern." },
      { term: "Path difference", meaning: "The extra distance one wave travels compared with the other." },
    ],
    examples: ["Oil on a wet road shows colours from thin-film interference.", "Anti-reflection coatings on glasses are about a quarter-wavelength thick."],
    questions: [
      { question: "Red light (650 nm) passes slits 0.5 mm apart onto a screen 2 m away. What is the fringe spacing?", answer: "Δy = 650 × 10⁻⁹ × 2 / 0.0005 = 2.6 mm." },
      { question: "Why does a soap film look black just before it bursts?", answer: "When it is much thinner than a wavelength, the inverted front reflection cancels the back one." },
    ],
    advanced: "Interferometers such as LIGO measure length changes a thousandth of a proton's size by counting interference fringes.",
  },
  {
    topicId: "diffraction",
    introduction: "Diffraction is the spreading of waves around obstacles and through openings.",
    objectives: ["Use the diffraction-grating equation.", "Relate single-slit spreading to slit width."],
    explanation: "Waves spread out after passing an opening; the narrower the opening compared with the wavelength, the more they spread. A single slit of width a gives dark minima at a sin θ = mλ. A grating, with many slits a distance d apart, sends bright, sharp orders at d sin θ = mλ, so it separates colours precisely and can measure wavelengths.",
    formulas: [
      { expression: "d sin θ = m λ", meaning: "Bright orders of a diffraction grating.", variables: [v("d", "grating spacing", "m"), v("θ", "angle of order m", "°"), v("m", "order", "no unit"), v("λ", "wavelength", "m")] },
      { expression: "a sin θ = m λ", meaning: "Dark minima of a single slit (m = 1, 2…).", variables: [v("a", "slit width", "m")] },
    ],
    definitions: [
      { term: "Grating", meaning: "A surface with many regularly spaced lines or slits." },
      { term: "Order", meaning: "Which bright beam (m = 0, 1, 2…) of a grating." },
    ],
    examples: ["The colours on a CD come from its 1.6 µm track spacing acting as a reflection grating.", "A hair in a laser beam gives a pattern that reveals its width."],
    questions: [
      { question: "A 600 lines/mm grating and 500 nm light: at what angle is the first order?", answer: "d = 1.67 µm; sin θ = 0.3, θ ≈ 17.5°." },
      { question: "Why do you hear around a corner but not see around it?", answer: "Sound wavelengths (~1 m) match doorways, so sound diffracts strongly; light's are far too small." },
    ],
    advanced: "X-ray diffraction from crystals (Bragg's law, 2d sin θ = nλ) revealed the structure of DNA.",
  },
];

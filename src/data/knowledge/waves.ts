import { v, type KnowledgeEntry } from "./types";

export const WAVES_KNOWLEDGE: readonly KnowledgeEntry[] = [
  {
    topicId: "wave-propagation",
    introduction: "A wave carries energy from place to place without carrying the material along with it.",
    objectives: ["Distinguish transverse and longitudinal waves.", "Use v = fλ."],
    explanation: "In a transverse wave, such as a wave on a string, the medium moves at right angles to the wave's direction. In a longitudinal wave, such as sound, it moves back and forth along it. The wave speed depends on the medium: on a string it is √(T/μ). When a wave meets a boundary it reflects, and on a fixed end the pulse comes back inverted.",
    formulas: [
      { expression: "v = f λ", meaning: "The wave equation.", variables: [v("v", "wave speed", "m/s"), v("f", "frequency", "Hz"), v("λ", "wavelength", "m")] },
      { expression: "v = √(T / μ)", meaning: "Speed of waves on a stretched string.", variables: [v("T", "tension", "N"), v("μ", "mass per unit length", "kg/m")] },
    ],
    definitions: [
      { term: "Transverse wave", meaning: "Oscillation perpendicular to the direction of travel." },
      { term: "Longitudinal wave", meaning: "Oscillation along the direction of travel, with compressions and rarefactions." },
    ],
    examples: ["A stadium 'Mexican wave' moves round the ground while people only stand and sit.", "Earthquake P-waves are longitudinal and arrive before transverse S-waves."],
    questions: [
      { question: "A wave has frequency 5 Hz and wavelength 2 m. How fast does it travel?", answer: "v = 10 m/s." },
      { question: "How does tightening a string change its wave speed?", answer: "It increases it, as √T." },
    ],
    advanced: "The wave equation ∂²y/∂t² = v² ∂²y/∂x² describes waves in strings, air, water and light alike.",
  },
  {
    topicId: "frequency",
    introduction: "Frequency is the number of oscillations each second. For sound it is what we hear as pitch.",
    objectives: ["Relate frequency and period.", "Connect frequency to musical pitch."],
    explanation: "Frequency is measured in hertz (oscillations per second); the period T is the time for one oscillation, T = 1/f. Humans hear roughly 20 Hz to 20 kHz. Doubling the frequency raises a note by one octave; in equal temperament each semitone multiplies the frequency by 2^(1/12).",
    formulas: [
      { expression: "f = 1 / T", meaning: "Frequency is the inverse of the period.", variables: [v("f", "frequency", "Hz"), v("T", "period", "s")] },
      { expression: "f = 440 × 2^(n/12)", meaning: "Frequency n semitones above concert A.", variables: [v("n", "semitones from A4", "no unit")] },
    ],
    definitions: [
      { term: "Hertz (Hz)", meaning: "One oscillation per second." },
      { term: "Octave", meaning: "A doubling of frequency." },
    ],
    examples: ["Concert A is 440 Hz.", "Bats use ultrasound above 20 kHz to locate insects."],
    questions: [
      { question: "What is the period of a 50 Hz mains supply?", answer: "T = 1/50 = 0.02 s = 20 ms." },
      { question: "What note is one octave above 440 Hz?", answer: "A5 at 880 Hz." },
    ],
    advanced: "Any periodic sound can be split into a fundamental and harmonics by Fourier analysis; the mix of harmonics is the timbre.",
  },
  {
    topicId: "amplitude",
    introduction: "Amplitude is the size of a wave's oscillation. For sound it sets loudness.",
    objectives: ["Relate amplitude to energy and intensity.", "Use the decibel scale."],
    explanation: "Amplitude is the maximum displacement from rest. The energy a wave carries grows with the square of its amplitude, so doubling the amplitude carries four times the power. Loudness is measured on the logarithmic decibel scale, where +10 dB means ten times the intensity and +20 dB means ten times the amplitude.",
    formulas: [
      { expression: "I ∝ A²", meaning: "Intensity grows with the square of amplitude.", variables: [v("I", "intensity", "W/m²"), v("A", "amplitude", "m (or Pa for sound)")] },
      { expression: "ΔL = 20 log₁₀(A₂ / A₁)", meaning: "Change in sound level from an amplitude ratio.", variables: [v("ΔL", "level change", "dB")] },
    ],
    definitions: [
      { term: "Decibel (dB)", meaning: "A logarithmic unit for ratios of intensity or amplitude." },
      { term: "Intensity", meaning: "Power carried per unit area." },
    ],
    examples: ["A whisper is about 30 dB, a rock concert about 110 dB.", "Ear protection is advised for long exposure above 85 dB."],
    questions: [
      { question: "By how many decibels does the level rise if the amplitude doubles?", answer: "20 log₁₀ 2 ≈ 6 dB." },
      { question: "Does a louder note travel faster?", answer: "No: speed depends on the medium, not the amplitude (for ordinary sounds)." },
    ],
    advanced: "Perceived loudness also depends on frequency; the ear is most sensitive around 2–5 kHz.",
  },
  {
    topicId: "wavelength",
    introduction: "Wavelength is the distance between successive crests of a wave.",
    objectives: ["Measure wavelength from a wave picture.", "Relate wavelength to frequency and speed."],
    explanation: "For a fixed wave speed, higher frequency means shorter wavelength. Sound at 343 m/s with frequency 343 Hz has a 1 m wavelength. On a string fixed at both ends, standing waves fit whole numbers of half-wavelengths: L = nλ/2.",
    formulas: [
      { expression: "λ = v / f", meaning: "Wavelength from speed and frequency.", variables: [v("λ", "wavelength", "m"), v("v", "wave speed", "m/s"), v("f", "frequency", "Hz")] },
      { expression: "λₙ = 2L / n", meaning: "Wavelengths of standing waves on a string of length L.", variables: [v("L", "string length", "m"), v("n", "harmonic number", "no unit")] },
    ],
    definitions: [
      { term: "Crest", meaning: "The highest point of a wave." },
      { term: "Standing wave", meaning: "A wave pattern that does not travel, with fixed nodes and antinodes." },
    ],
    examples: ["FM radio waves near 100 MHz are about 3 m long.", "Microwave ovens use 12 cm waves."],
    questions: [
      { question: "What wavelength has a 1 kHz sound in air?", answer: "λ = 343/1000 ≈ 0.34 m." },
      { question: "What is the longest standing wave on a 65 cm guitar string?", answer: "1.3 m (the fundamental, λ = 2L)." },
    ],
    advanced: "The wavelength of a wave sets the scale of detail it can reveal, which links acoustics, optics and quantum matter waves.",
  },
  {
    topicId: "sound",
    introduction: "Sound is a longitudinal pressure wave that needs a medium to travel through.",
    objectives: ["Calculate the speed of sound in air.", "Use echoes to measure distance."],
    explanation: "Sound travels by compressions and rarefactions of the medium. In air its speed grows with temperature, v = √(γRT/M), about 343 m/s at 20 °C. It is faster in water (about 1480 m/s) and steel (about 5900 m/s). An echo returns after travelling to a reflector and back, so the distance is v t / 2. Sound cannot cross a vacuum.",
    formulas: [
      { expression: "v = √(γ R T / M)", meaning: "Speed of sound in an ideal gas.", variables: [v("γ", "adiabatic index, 1.4 for air", "no unit"), v("R", "gas constant, 8.314", "J/(mol·K)"), v("T", "temperature", "K"), v("M", "molar mass, 0.029 for air", "kg/mol")] },
      { expression: "d = v t / 2", meaning: "Distance to a reflector from the echo delay.", variables: [v("d", "distance", "m"), v("t", "echo delay", "s")] },
    ],
    definitions: [
      { term: "Echo", meaning: "Reflected sound heard after a delay." },
      { term: "Ultrasound", meaning: "Sound above about 20 kHz, beyond human hearing." },
    ],
    examples: ["Count the seconds between lightning and thunder and divide by 3 for the distance in kilometres.", "Ships map the sea floor with sonar echoes."],
    questions: [
      { question: "An echo from a cliff returns after 2 s. How far away is the cliff?", answer: "d = 343 × 2 / 2 ≈ 343 m." },
      { question: "Why is the speed of sound faster on a hot day?", answer: "Air molecules move faster and pass on the disturbance more quickly; v ∝ √T." },
    ],
    advanced: "Sound speed in air does not depend on pressure at a fixed temperature, because density and pressure change together.",
  },
  {
    topicId: "resonance",
    introduction: "Resonance is the large response of a system driven at its natural frequency.",
    objectives: ["Explain natural frequency and driving frequency.", "Describe how damping limits resonance."],
    explanation: "Every oscillator, such as a swing, a guitar string or a bridge, has natural frequencies. Push it periodically and the amplitude builds up most when the driving frequency matches a natural frequency, because each push adds energy at the right moment. Damping (friction, air resistance) limits the peak amplitude and widens the resonance curve.",
    formulas: [
      { expression: "f₀ = (1/2π) √(k/m)", meaning: "Natural frequency of a mass on a spring.", variables: [v("f₀", "natural frequency", "Hz"), v("k", "spring constant", "N/m"), v("m", "mass", "kg")] },
      { expression: "A = (F₀/m) / √((ω₀² − ω²)² + (γω)²)", meaning: "Steady amplitude of a damped, driven oscillator.", variables: [v("A", "amplitude", "m"), v("F₀", "driving force amplitude", "N"), v("ω₀", "natural angular frequency", "rad/s"), v("ω", "driving angular frequency", "rad/s"), v("γ", "damping rate", "1/s")] },
    ],
    definitions: [
      { term: "Natural frequency", meaning: "The frequency at which a system oscillates when disturbed and left alone." },
      { term: "Damping", meaning: "Loss of energy that makes oscillations die away." },
    ],
    examples: ["Pushing a swing at the right moment each time makes it go higher.", "Soldiers break step on bridges to avoid driving them at resonance."],
    questions: [
      { question: "Why do tuning a radio and pushing a swing both rely on resonance?", answer: "Both respond strongly only to a driving frequency that matches their natural frequency." },
      { question: "What happens to the resonance peak if damping increases?", answer: "It becomes lower and broader." },
    ],
    advanced: "The quality factor Q = ω₀/γ measures how sharp a resonance is; quartz watch crystals have Q of about 10⁵.",
  },
  {
    topicId: "wave-interference",
    introduction: "When two waves meet, their displacements add. They can reinforce or cancel.",
    objectives: ["Use path difference to predict loud and quiet spots.", "Explain beats."],
    explanation: "Where two waves from coherent sources arrive in step (path difference a whole number of wavelengths), they reinforce; where they arrive half a wavelength out of step, they cancel. Two notes with slightly different frequencies produce beats, a throbbing loudness at the difference frequency, which musicians use to tune.",
    formulas: [
      { expression: "Δ = n λ (loud), Δ = (n + ½) λ (quiet)", meaning: "Conditions for constructive and destructive interference.", variables: [v("Δ", "path difference", "m"), v("n", "whole number", "no unit"), v("λ", "wavelength", "m")] },
      { expression: "f_beat = |f₁ − f₂|", meaning: "Beat frequency of two close notes.", variables: [v("f_beat", "beat frequency", "Hz")] },
    ],
    definitions: [
      { term: "Superposition", meaning: "The total displacement is the sum of the individual waves." },
      { term: "Beats", meaning: "Periodic rising and falling of loudness from two close frequencies." },
    ],
    examples: ["Noise-cancelling headphones play an inverted copy of the noise.", "Walking between two speakers playing the same tone, you hear loud and quiet spots."],
    questions: [
      { question: "Tuning forks of 440 Hz and 443 Hz sound together. What do you hear?", answer: "A tone near 441.5 Hz that beats 3 times a second." },
      { question: "Two speakers are in phase. At a point 0.85 m farther from one, the wavelength is 1.7 m. Loud or quiet?", answer: "Quiet: the path difference is half a wavelength." },
    ],
    advanced: "Interference conserves energy: the energy missing at quiet spots appears at loud ones.",
  },
  {
    topicId: "doppler-effect",
    introduction: "The Doppler effect is the change in observed frequency when a source or observer moves.",
    objectives: ["Use the Doppler formula for sound.", "Explain the pitch change of a passing siren."],
    explanation: "As a source approaches, it emits each crest a little closer to the previous one, so the wavelength shortens and you hear a higher pitch; as it moves away, the pitch drops. For sound, the effect depends on the speeds of source and observer relative to the air. Light shows the same effect: galaxies moving away from us are red-shifted.",
    formulas: [
      { expression: "f′ = f (v + v_o) / (v − v_s)", meaning: "Observed frequency for sound; v_o > 0 when the observer moves toward the source and v_s > 0 when the source moves toward the observer.", variables: [v("f′", "observed frequency", "Hz"), v("f", "emitted frequency", "Hz"), v("v", "speed of sound", "m/s"), v("v_o", "observer speed", "m/s"), v("v_s", "source speed", "m/s")] },
    ],
    definitions: [
      { term: "Red-shift", meaning: "Increase in wavelength of light from a receding source." },
      { term: "Sonic boom", meaning: "The shock wave formed when a source moves faster than sound." },
    ],
    examples: ["An ambulance siren sounds higher as it approaches and lower as it passes.", "Police speed guns measure the Doppler shift of reflected radio waves."],
    questions: [
      { question: "A 700 Hz siren approaches at 30 m/s (sound at 343 m/s). What frequency do you hear?", answer: "f′ = 700 × 343/313 ≈ 767 Hz." },
      { question: "What pitch do you hear as it moves away at the same speed?", answer: "f′ = 700 × 343/373 ≈ 644 Hz." },
    ],
    advanced: "Doppler ultrasound measures blood flow speeds; for light, the relativistic Doppler formula is needed at high speeds.",
  },
];

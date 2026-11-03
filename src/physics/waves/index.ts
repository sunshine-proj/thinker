export {
  CONCERT_A_HZ,
  SOUND_SPEED_20C,
  calculateAmplitudeRatio,
  calculateHarmonicAmplitude,
  calculateLevelChangeDecibels,
  calculateNoteFrequency,
  calculatePeriod,
  calculateWavelength,
  synthesizeHarmonics,
  type Waveform,
} from "./sound";
export {
  calculateFrettedFrequency,
  calculateModeShape,
  calculateStringFrequency,
  calculateStringWaveSpeed,
  calculateTensionForFrequency,
  calculateTouchedHarmonic,
} from "./strings";
export {
  calculateTravelTime,
  createWaveGrid,
  gaussianPulse,
  simulateWave,
  stepsForDuration,
  type WaveGrid,
  type WaveProfile,
  type WaveSimulation,
} from "./waveEquation";
export {
  DISTINCT_ECHO_DELAY_SECONDS,
  calculateEchoDelay,
  calculateEchoDistance,
  calculateMinimumEchoDistance,
  calculateSpeedOfSound,
  calculateTemperatureFromSpeed,
} from "./echo";
export {
  calculateBeatFrequency,
  calculateFundamental,
  calculateResolutionTime,
  calculateSpectrum,
  findSpectralPeaks,
  sampleTones,
  type SpectrumPoint,
  type Tone,
} from "./spectrum";
export {
  calculateFringeSpacing,
  calculatePathDifference,
  calculateRelativeIntensity,
  calculateScreenIntensity,
  calculateSlitSeparation,
  classifyInterference,
  type InterferenceKind,
  type Point,
} from "./interference";

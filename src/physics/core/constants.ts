/** Exact SI-defined speed of light, in meters per second. */
export const SPEED_OF_LIGHT = 299_792_458;
/** Standard gravitational acceleration, in meters per second squared. */
export const STANDARD_GRAVITY = 9.80665;
/** Newtonian gravitational constant, in cubic meters per kilogram per second squared. */
export const GRAVITATIONAL_CONSTANT = 6.6743e-11;
/** Positive elementary charge magnitude, in coulombs. */
export const ELEMENTARY_CHARGE = 1.602176634e-19;
/** Electron charge, in coulombs. */
export const ELECTRON_CHARGE = -ELEMENTARY_CHARGE;
/** Electron rest mass, in kilograms. */
export const ELECTRON_MASS = 9.1093837139e-31;
/** Proton rest mass, in kilograms. */
export const PROTON_MASS = 1.67262192595e-27;
/** Boltzmann constant, in joules per kelvin. */
export const BOLTZMANN_CONSTANT = 1.380649e-23;
/** Planck constant, in joule-seconds. */
export const PLANCK_CONSTANT = 6.62607015e-34;

export const PHYSICAL_CONSTANTS = Object.freeze({
  speedOfLight: SPEED_OF_LIGHT,
  standardGravity: STANDARD_GRAVITY,
  gravitationalConstant: GRAVITATIONAL_CONSTANT,
  elementaryCharge: ELEMENTARY_CHARGE,
  electronCharge: ELECTRON_CHARGE,
  electronMass: ELECTRON_MASS,
  protonMass: PROTON_MASS,
  boltzmannConstant: BOLTZMANN_CONSTANT,
  planckConstant: PLANCK_CONSTANT,
});

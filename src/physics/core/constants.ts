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

/** Vacuum permittivity ε₀, in farads per meter (CODATA 2018). */
export const VACUUM_PERMITTIVITY = 8.8541878128e-12;
/** Coulomb constant k = 1 / (4π ε₀), in N·m²/C². */
export const COULOMB_CONSTANT = 1 / (4 * Math.PI * VACUUM_PERMITTIVITY);

/** Specific heat capacity of liquid water near room temperature, J/(kg·K). */
export const SPECIFIC_HEAT_WATER = 4186;
/** Specific heat capacity of ice near 0 °C, J/(kg·K). */
export const SPECIFIC_HEAT_ICE = 2090;
/** Latent heat of fusion of water, J/kg. */
export const LATENT_HEAT_FUSION_WATER = 3.34e5;
/** Mean gravitational parameter GM of Earth, m³/s². */
export const EARTH_GRAVITATIONAL_PARAMETER = 3.986004418e14;
/** Mean radius of Earth, m. */
export const EARTH_MEAN_RADIUS = 6.371e6;
/** Surface gravity of the Moon, m/s². */
export const LUNAR_GRAVITY = 1.62;

/** Vacuum permeability μ₀, in henries per meter (CODATA 2018). */
export const VACUUM_PERMEABILITY = 1.25663706212e-6;
/** Electron-volt in joules. */
export const ELECTRON_VOLT = ELEMENTARY_CHARGE;

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
  vacuumPermittivity: VACUUM_PERMITTIVITY,
  coulombConstant: COULOMB_CONSTANT,
});

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

/** Mass of Earth, kg. */
export const EARTH_MASS = 5.9722e24;
/** Gravitational parameter GM of the Sun, m³/s². */
export const SUN_GRAVITATIONAL_PARAMETER = 1.32712440018e20;
/** Astronomical unit (mean Earth–Sun distance), m. */
export const ASTRONOMICAL_UNIT = 1.495978707e11;
/** Julian year, s. */
export const JULIAN_YEAR = 365.25 * 86400;
/** Gravitational parameter GM of the Moon, m³/s². */
export const MOON_GRAVITATIONAL_PARAMETER = 4.9028e12;
/** Mean radius of the Moon, m. */
export const MOON_MEAN_RADIUS = 1.7374e6;
/** Molar gas constant R, J/(mol·K). */
export const MOLAR_GAS_CONSTANT = 8.314462618;
/** Mean molar mass of dry air, kg/mol. */
export const AIR_MOLAR_MASS = 0.0289647;
/** Adiabatic index of air (diatomic gas). */
export const AIR_ADIABATIC_INDEX = 1.4;

/** Neutron mass, kg. */
export const NEUTRON_MASS = 1.67492749804e-27;
/** Avogadro constant, 1/mol. */
export const AVOGADRO_CONSTANT = 6.02214076e23;
/** Density of fresh water near 4 °C, kg/m³. */
export const FRESH_WATER_DENSITY = 1000;
/** Typical density of seawater, kg/m³. */
export const SEAWATER_DENSITY = 1025;
/** Standard atmospheric pressure, Pa. */
export const ATMOSPHERIC_PRESSURE = 101325;

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

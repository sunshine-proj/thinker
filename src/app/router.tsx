import { lazy } from "react";
import { createBrowserRouter, Outlet, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ExperimentsIndexPage } from "../features/experiments/ExperimentsIndexPage";
import { HomePage } from "../features/home/HomePage";
import { PhysicsWorldsPage } from "../features/physics-worlds/PhysicsWorldsPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { NotFoundPage } from "./NotFoundPage";
import { SectionPage } from "./SectionPage";

// Pages are loaded on demand so the first visit downloads only the shell and the page being opened.
const ElectronTrajectoryLabPage = lazy(() => import("../features/experiments/ElectronTrajectoryLabPage").then((module) => ({ default: module.ElectronTrajectoryLabPage })));
const ProjectileMasterPage = lazy(() => import("../features/games/projectile-master/ProjectileMasterPage").then((module) => ({ default: module.ProjectileMasterPage })));
const BalanceChallengePage = lazy(() => import("../features/games/balance-challenge/BalanceChallengePage").then((module) => ({ default: module.BalanceChallengePage })));
const CircuitBuilderPage = lazy(() => import("../features/games/circuit-builder/CircuitBuilderPage").then((module) => ({ default: module.CircuitBuilderPage })));
const AchievementsPage = lazy(() => import("../features/achievements/AchievementsPage").then((module) => ({ default: module.AchievementsPage })));
const ChallengesPage = lazy(() => import("../features/challenges/ChallengesPage").then((module) => ({ default: module.ChallengesPage })));
const BridgeBuilderPage = lazy(() => import("../features/games/bridge-builder/BridgeBuilderPage").then((module) => ({ default: module.BridgeBuilderPage })));
const ElectricDetectivePage = lazy(() => import("../features/games/electric-detective/ElectricDetectivePage").then((module) => ({ default: module.ElectricDetectivePage })));
const LaserMazePage = lazy(() => import("../features/games/laser-maze/LaserMazePage").then((module) => ({ default: module.LaserMazePage })));
const LensDesignerPage = lazy(() => import("../features/games/lens-designer/LensDesignerPage").then((module) => ({ default: module.LensDesignerPage })));
const IceMeltingPage = lazy(() => import("../features/games/ice-melting/IceMeltingPage").then((module) => ({ default: module.IceMeltingPage })));
const TemperatureControlPage = lazy(() => import("../features/games/temperature-control/TemperatureControlPage").then((module) => ({ default: module.TemperatureControlPage })));
const OrbitSimulatorPage = lazy(() => import("../features/games/orbit-simulator/OrbitSimulatorPage").then((module) => ({ default: module.OrbitSimulatorPage })));
const MoonLandingPage = lazy(() => import("../features/games/moon-landing/MoonLandingPage").then((module) => ({ default: module.MoonLandingPage })));
const RaceSimulatorPage = lazy(() => import("../features/games/race-simulator/RaceSimulatorPage").then((module) => ({ default: module.RaceSimulatorPage })));
const SpaceMissionPage = lazy(() => import("../features/games/space-mission/SpaceMissionPage").then((module) => ({ default: module.SpaceMissionPage })));
const ParachuteDesignerPage = lazy(() => import("../features/games/parachute-designer/ParachuteDesignerPage").then((module) => ({ default: module.ParachuteDesignerPage })));
const RollerCoasterPage = lazy(() => import("../features/games/roller-coaster/RollerCoasterPage").then((module) => ({ default: module.RollerCoasterPage })));
const MagneticMazePage = lazy(() => import("../features/games/magnetic-maze/MagneticMazePage").then((module) => ({ default: module.MagneticMazePage })));
const PowerPlantPage = lazy(() => import("../features/games/power-plant/PowerPlantPage").then((module) => ({ default: module.PowerPlantPage })));
const ElectromagneticCranePage = lazy(() => import("../features/games/electromagnetic-crane/ElectromagneticCranePage").then((module) => ({ default: module.ElectromagneticCranePage })));
const ParticleAcceleratorPage = lazy(() => import("../features/games/particle-accelerator/ParticleAcceleratorPage").then((module) => ({ default: module.ParticleAcceleratorPage })));
const SteamEnginePage = lazy(() => import("../features/games/steam-engine/SteamEnginePage").then((module) => ({ default: module.SteamEnginePage })));
const RefrigeratorEngineerPage = lazy(() => import("../features/games/refrigerator-engineer/RefrigeratorEngineerPage").then((module) => ({ default: module.RefrigeratorEngineerPage })));
const MaterialDetectivePage = lazy(() => import("../features/games/material-detective/MaterialDetectivePage").then((module) => ({ default: module.MaterialDetectivePage })));
const SolarCookerPage = lazy(() => import("../features/games/solar-cooker/SolarCookerPage").then((module) => ({ default: module.SolarCookerPage })));
const RainbowCreatorPage = lazy(() => import("../features/games/rainbow-creator/RainbowCreatorPage").then((module) => ({ default: module.RainbowCreatorPage })));
const VisionSimulatorPage = lazy(() => import("../features/games/vision-simulator/VisionSimulatorPage").then((module) => ({ default: module.VisionSimulatorPage })));
const MicroscopeBuilderPage = lazy(() => import("../features/games/microscope-builder/MicroscopeBuilderPage").then((module) => ({ default: module.MicroscopeBuilderPage })));
const SoundCreatorPage = lazy(() => import("../features/games/sound-creator/SoundCreatorPage").then((module) => ({ default: module.SoundCreatorPage })));
const VirtualGuitarPage = lazy(() => import("../features/games/virtual-guitar/VirtualGuitarPage").then((module) => ({ default: module.VirtualGuitarPage })));
const WaveSimulatorPage = lazy(() => import("../features/games/wave-simulator/WaveSimulatorPage").then((module) => ({ default: module.WaveSimulatorPage })));
const EchoExplorerPage = lazy(() => import("../features/games/echo-explorer/EchoExplorerPage").then((module) => ({ default: module.EchoExplorerPage })));
const FrequencyDetectivePage = lazy(() => import("../features/games/frequency-detective/FrequencyDetectivePage").then((module) => ({ default: module.FrequencyDetectivePage })));
const WaveInterferencePage = lazy(() => import("../features/games/wave-interference/WaveInterferencePage").then((module) => ({ default: module.WaveInterferencePage })));
const PlanetDesignerPage = lazy(() => import("../features/games/planet-designer/PlanetDesignerPage").then((module) => ({ default: module.PlanetDesignerPage })));
const SolarSystemBuilderPage = lazy(() => import("../features/games/solar-system-builder/SolarSystemBuilderPage").then((module) => ({ default: module.SolarSystemBuilderPage })));
const EscapeVelocityPage = lazy(() => import("../features/games/escape-velocity/EscapeVelocityPage").then((module) => ({ default: module.EscapeVelocityPage })));
const AsteroidMissionPage = lazy(() => import("../features/games/asteroid-mission/AsteroidMissionPage").then((module) => ({ default: module.AsteroidMissionPage })));
const BlackHoleExplorerPage = lazy(() => import("../features/games/black-hole-explorer/BlackHoleExplorerPage").then((module) => ({ default: module.BlackHoleExplorerPage })));
const AtomBuilderPage = lazy(() => import("../features/games/atom-builder/AtomBuilderPage").then((module) => ({ default: module.AtomBuilderPage })));
const ParticleDetectivePage = lazy(() => import("../features/games/particle-detective/ParticleDetectivePage").then((module) => ({ default: module.ParticleDetectivePage })));
const WaveOrParticlePage = lazy(() => import("../features/games/wave-or-particle/WaveOrParticlePage").then((module) => ({ default: module.WaveOrParticlePage })));
const QuantumPuzzlePage = lazy(() => import("../features/games/quantum-puzzle/QuantumPuzzlePage").then((module) => ({ default: module.QuantumPuzzlePage })));
const RadioactiveCountdownPage = lazy(() => import("../features/games/radioactive-countdown/RadioactiveCountdownPage").then((module) => ({ default: module.RadioactiveCountdownPage })));
const PhotoelectricLabPage = lazy(() => import("../features/games/photoelectric-lab/PhotoelectricLabPage").then((module) => ({ default: module.PhotoelectricLabPage })));
const ShipDesignerPage = lazy(() => import("../features/games/ship-designer/ShipDesignerPage").then((module) => ({ default: module.ShipDesignerPage })));
const WaterPressurePage = lazy(() => import("../features/games/water-pressure/WaterPressurePage").then((module) => ({ default: module.WaterPressurePage })));
const DamEngineerPage = lazy(() => import("../features/games/dam-engineer/DamEngineerPage").then((module) => ({ default: module.DamEngineerPage })));
const FlightSimulatorPage = lazy(() => import("../features/games/flight-simulator/FlightSimulatorPage").then((module) => ({ default: module.FlightSimulatorPage })));
const PipePuzzlePage = lazy(() => import("../features/games/pipe-puzzle/PipePuzzlePage").then((module) => ({ default: module.PipePuzzlePage })));
const FloatingChallengePage = lazy(() => import("../features/games/floating-challenge/FloatingChallengePage").then((module) => ({ default: module.FloatingChallengePage })));
const NuclearPuzzlePage = lazy(() => import("../features/games/nuclear-puzzle/NuclearPuzzlePage").then((module) => ({ default: module.NuclearPuzzlePage })));
const HalfLifeChallengePage = lazy(() => import("../features/games/half-life-challenge/HalfLifeChallengePage").then((module) => ({ default: module.HalfLifeChallengePage })));
const FusionSimulatorPage = lazy(() => import("../features/games/fusion-simulator/FusionSimulatorPage").then((module) => ({ default: module.FusionSimulatorPage })));
const EnergyDetectivePage = lazy(() => import("../features/games/energy-detective/EnergyDetectivePage").then((module) => ({ default: module.EnergyDetectivePage })));
const IsotopeExplorerPage = lazy(() => import("../features/games/isotope-explorer/IsotopeExplorerPage").then((module) => ({ default: module.IsotopeExplorerPage })));
const BicyclePhysicsPage = lazy(() => import("../features/games/bicycle-physics/BicyclePhysicsPage").then((module) => ({ default: module.BicyclePhysicsPage })));
const BasketballChallengePage = lazy(() => import("../features/games/basketball-challenge/BasketballChallengePage").then((module) => ({ default: module.BasketballChallengePage })));
const TennisPhysicsPage = lazy(() => import("../features/games/tennis-physics/TennisPhysicsPage").then((module) => ({ default: module.TennisPhysicsPage })));
const KitchenScientistPage = lazy(() => import("../features/games/kitchen-scientist/KitchenScientistPage").then((module) => ({ default: module.KitchenScientistPage })));
const CarSafetyEngineerPage = lazy(() => import("../features/games/car-safety-engineer/CarSafetyEngineerPage").then((module) => ({ default: module.CarSafetyEngineerPage })));
const SmartphoneDetectivePage = lazy(() => import("../features/games/smartphone-detective/SmartphoneDetectivePage").then((module) => ({ default: module.SmartphoneDetectivePage })));
const AmusementParkPhysicsPage = lazy(() => import("../features/games/amusement-park-physics/AmusementParkPhysicsPage").then((module) => ({ default: module.AmusementParkPhysicsPage })));
const MirrorIllusionsPage = lazy(() => import("../features/games/mirror-illusions/MirrorIllusionsPage").then((module) => ({ default: module.MirrorIllusionsPage })));
const LabRoute = lazy(() => import("../features/experiments/labs/LabRoute").then((module) => ({ default: module.LabRoute })));

function ElectronTrajectoryLabRoute() {
  const [searchParams] = useSearchParams();
  return (
    <ElectronTrajectoryLabPage
      savedExperimentId={searchParams.get("saved") ?? undefined}
    />
  );
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "worlds", element: <PhysicsWorldsPage /> },
      {
        path: "worlds/mechanics/projectile-master",
        element: <ProjectileMasterPage />,
      },
      {
        path: "worlds/mechanics/balance-challenge",
        element: <BalanceChallengePage />,
      },
      {
        path: "worlds/mechanics/bridge-builder",
        element: <BridgeBuilderPage />,
      },
      {
        path: "worlds/electromagnetism/circuit-builder",
        element: <CircuitBuilderPage />,
      },
      {
        path: "worlds/electromagnetism/electric-detective",
        element: <ElectricDetectivePage />,
      },
      {
        path: "worlds/optics/laser-maze",
        element: <LaserMazePage />,
      },
      {
        path: "worlds/optics/lens-designer",
        element: <LensDesignerPage />,
      },
      {
        path: "worlds/thermodynamics/ice-melting",
        element: <IceMeltingPage />,
      },
      {
        path: "worlds/thermodynamics/temperature-control",
        element: <TemperatureControlPage />,
      },
      {
        path: "worlds/astronomy/orbit-simulator",
        element: <OrbitSimulatorPage />,
      },
      {
        path: "worlds/astronomy/moon-landing",
        element: <MoonLandingPage />,
      },
      {
        path: "worlds/mechanics/race-simulator",
        element: <RaceSimulatorPage />,
      },
      {
        path: "worlds/mechanics/space-mission",
        element: <SpaceMissionPage />,
      },
      {
        path: "worlds/mechanics/parachute-designer",
        element: <ParachuteDesignerPage />,
      },
      {
        path: "worlds/mechanics/roller-coaster",
        element: <RollerCoasterPage />,
      },
      {
        path: "worlds/electromagnetism/magnetic-maze",
        element: <MagneticMazePage />,
      },
      {
        path: "worlds/electromagnetism/power-plant",
        element: <PowerPlantPage />,
      },
      {
        path: "worlds/electromagnetism/electromagnetic-crane",
        element: <ElectromagneticCranePage />,
      },
      {
        path: "worlds/electromagnetism/particle-accelerator",
        element: <ParticleAcceleratorPage />,
      },
      {
        path: "worlds/thermodynamics/steam-engine",
        element: <SteamEnginePage />,
      },
      {
        path: "worlds/thermodynamics/refrigerator-engineer",
        element: <RefrigeratorEngineerPage />,
      },
      {
        path: "worlds/thermodynamics/material-detective",
        element: <MaterialDetectivePage />,
      },
      {
        path: "worlds/thermodynamics/solar-cooker",
        element: <SolarCookerPage />,
      },
      {
        path: "worlds/optics/rainbow-creator",
        element: <RainbowCreatorPage />,
      },
      {
        path: "worlds/optics/vision-simulator",
        element: <VisionSimulatorPage />,
      },
      {
        path: "worlds/optics/mirror-illusions",
        element: <MirrorIllusionsPage />,
      },
      {
        path: "worlds/optics/microscope-builder",
        element: <MicroscopeBuilderPage />,
      },
      {
        path: "worlds/waves/sound-creator",
        element: <SoundCreatorPage />,
      },
      {
        path: "worlds/waves/virtual-guitar",
        element: <VirtualGuitarPage />,
      },
      {
        path: "worlds/waves/wave-simulator",
        element: <WaveSimulatorPage />,
      },
      {
        path: "worlds/waves/echo-explorer",
        element: <EchoExplorerPage />,
      },
      {
        path: "worlds/waves/frequency-detective",
        element: <FrequencyDetectivePage />,
      },
      {
        path: "worlds/waves/wave-interference",
        element: <WaveInterferencePage />,
      },
      {
        path: "worlds/astronomy/planet-designer",
        element: <PlanetDesignerPage />,
      },
      {
        path: "worlds/astronomy/solar-system-builder",
        element: <SolarSystemBuilderPage />,
      },
      {
        path: "worlds/astronomy/escape-velocity",
        element: <EscapeVelocityPage />,
      },
      {
        path: "worlds/astronomy/asteroid-mission",
        element: <AsteroidMissionPage />,
      },
      {
        path: "worlds/astronomy/black-hole-explorer",
        element: <BlackHoleExplorerPage />,
      },
      {
        path: "worlds/modern-physics/atom-builder",
        element: <AtomBuilderPage />,
      },
      {
        path: "worlds/modern-physics/particle-detective",
        element: <ParticleDetectivePage />,
      },
      {
        path: "worlds/modern-physics/wave-or-particle",
        element: <WaveOrParticlePage />,
      },
      {
        path: "worlds/modern-physics/quantum-puzzle",
        element: <QuantumPuzzlePage />,
      },
      {
        path: "worlds/modern-physics/radioactive-countdown",
        element: <RadioactiveCountdownPage />,
      },
      {
        path: "worlds/modern-physics/photoelectric-lab",
        element: <PhotoelectricLabPage />,
      },
      {
        path: "worlds/fluids/ship-designer",
        element: <ShipDesignerPage />,
      },
      {
        path: "worlds/fluids/water-pressure",
        element: <WaterPressurePage />,
      },
      {
        path: "worlds/fluids/dam-engineer",
        element: <DamEngineerPage />,
      },
      {
        path: "worlds/fluids/flight-simulator",
        element: <FlightSimulatorPage />,
      },
      {
        path: "worlds/fluids/pipe-puzzle",
        element: <PipePuzzlePage />,
      },
      {
        path: "worlds/fluids/floating-challenge",
        element: <FloatingChallengePage />,
      },
      {
        path: "worlds/nuclear/nuclear-puzzle",
        element: <NuclearPuzzlePage />,
      },
      {
        path: "worlds/nuclear/half-life-challenge",
        element: <HalfLifeChallengePage />,
      },
      {
        path: "worlds/nuclear/fusion-simulator",
        element: <FusionSimulatorPage />,
      },
      {
        path: "worlds/nuclear/energy-detective",
        element: <EnergyDetectivePage />,
      },
      {
        path: "worlds/nuclear/isotope-explorer",
        element: <IsotopeExplorerPage />,
      },
      {
        path: "worlds/everyday/bicycle-physics",
        element: <BicyclePhysicsPage />,
      },
      {
        path: "worlds/everyday/basketball-challenge",
        element: <BasketballChallengePage />,
      },
      {
        path: "worlds/everyday/tennis-physics",
        element: <TennisPhysicsPage />,
      },
      {
        path: "worlds/everyday/kitchen-scientist",
        element: <KitchenScientistPage />,
      },
      {
        path: "worlds/everyday/car-safety-engineer",
        element: <CarSafetyEngineerPage />,
      },
      {
        path: "worlds/everyday/smartphone-detective",
        element: <SmartphoneDetectivePage />,
      },
      {
        path: "worlds/everyday/amusement-park-physics",
        element: <AmusementParkPhysicsPage />,
      },
      {
        path: "experiments",
        element: <Outlet />,
        children: [
          { index: true, element: <ExperimentsIndexPage /> },
          { path: "gravity-comparison", element: <LabRoute labId="gravity-comparison" /> },
          { path: "friction", element: <LabRoute labId="friction-surfaces" /> },
          { path: "projectile-motion", element: <LabRoute labId="projectile-motion-lab" /> },
          { path: "magnetic-field", element: <LabRoute labId="magnetic-field-strength" /> },
          { path: "heat-transfer", element: <LabRoute labId="heat-transfer-modes" /> },
          { path: "lens-focal-length", element: <LabRoute labId="lens-focal-length" /> },
          { path: "wave-interference", element: <LabRoute labId="wave-interference-lab" /> },
          { path: "orbital-motion", element: <LabRoute labId="orbital-motion-lab" /> },
          {
            path: "electron-trajectory",
            element: <ElectronTrajectoryLabRoute />,
          },
        ],
      },
      { path: "challenges", element: <ChallengesPage /> },
      {
        path: "thought-experiments",
        element: (
          <SectionPage
            title="Thought Experiments"
            eyebrow="Imagine the impossible"
            description="Make a prediction, question your assumptions, and follow an idea wherever physics takes it."
            icon="thoughtExperiments"
          />
        ),
      },
      {
        path: "knowledge",
        element: (
          <SectionPage
            title="Knowledge Base"
            eyebrow="Build your understanding"
            description="A growing collection of clear explanations, useful formulas, and connections to the world around you."
            icon="knowledge"
          />
        ),
      },
      { path: "achievements", element: <AchievementsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

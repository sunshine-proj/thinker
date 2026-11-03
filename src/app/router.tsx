import { createBrowserRouter, Outlet, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ElectronTrajectoryLabPage } from "../features/experiments/ElectronTrajectoryLabPage";
import { ExperimentsIndexPage } from "../features/experiments/ExperimentsIndexPage";
import { ProjectileMasterPage } from "../features/games/projectile-master/ProjectileMasterPage";
import { BalanceChallengePage } from "../features/games/balance-challenge/BalanceChallengePage";
import { CircuitBuilderPage } from "../features/games/circuit-builder/CircuitBuilderPage";
import { AchievementsPage } from "../features/achievements/AchievementsPage";
import { ChallengesPage } from "../features/challenges/ChallengesPage";
import { BridgeBuilderPage } from "../features/games/bridge-builder/BridgeBuilderPage";
import { ElectricDetectivePage } from "../features/games/electric-detective/ElectricDetectivePage";
import { LaserMazePage } from "../features/games/laser-maze/LaserMazePage";
import { LensDesignerPage } from "../features/games/lens-designer/LensDesignerPage";
import { IceMeltingPage } from "../features/games/ice-melting/IceMeltingPage";
import { TemperatureControlPage } from "../features/games/temperature-control/TemperatureControlPage";
import { OrbitSimulatorPage } from "../features/games/orbit-simulator/OrbitSimulatorPage";
import { MoonLandingPage } from "../features/games/moon-landing/MoonLandingPage";
import { RaceSimulatorPage } from "../features/games/race-simulator/RaceSimulatorPage";
import { SpaceMissionPage } from "../features/games/space-mission/SpaceMissionPage";
import { ParachuteDesignerPage } from "../features/games/parachute-designer/ParachuteDesignerPage";
import { RollerCoasterPage } from "../features/games/roller-coaster/RollerCoasterPage";
import { MagneticMazePage } from "../features/games/magnetic-maze/MagneticMazePage";
import { PowerPlantPage } from "../features/games/power-plant/PowerPlantPage";
import { ElectromagneticCranePage } from "../features/games/electromagnetic-crane/ElectromagneticCranePage";
import { ParticleAcceleratorPage } from "../features/games/particle-accelerator/ParticleAcceleratorPage";
import { SteamEnginePage } from "../features/games/steam-engine/SteamEnginePage";
import { RefrigeratorEngineerPage } from "../features/games/refrigerator-engineer/RefrigeratorEngineerPage";
import { MaterialDetectivePage } from "../features/games/material-detective/MaterialDetectivePage";
import { SolarCookerPage } from "../features/games/solar-cooker/SolarCookerPage";
import { RainbowCreatorPage } from "../features/games/rainbow-creator/RainbowCreatorPage";
import { VisionSimulatorPage } from "../features/games/vision-simulator/VisionSimulatorPage";
import { MicroscopeBuilderPage } from "../features/games/microscope-builder/MicroscopeBuilderPage";
import { SoundCreatorPage } from "../features/games/sound-creator/SoundCreatorPage";
import { VirtualGuitarPage } from "../features/games/virtual-guitar/VirtualGuitarPage";
import { WaveSimulatorPage } from "../features/games/wave-simulator/WaveSimulatorPage";
import { EchoExplorerPage } from "../features/games/echo-explorer/EchoExplorerPage";
import { FrequencyDetectivePage } from "../features/games/frequency-detective/FrequencyDetectivePage";
import { WaveInterferencePage } from "../features/games/wave-interference/WaveInterferencePage";
import { PlanetDesignerPage } from "../features/games/planet-designer/PlanetDesignerPage";
import { SolarSystemBuilderPage } from "../features/games/solar-system-builder/SolarSystemBuilderPage";
import { EscapeVelocityPage } from "../features/games/escape-velocity/EscapeVelocityPage";
import { AsteroidMissionPage } from "../features/games/asteroid-mission/AsteroidMissionPage";
import { BlackHoleExplorerPage } from "../features/games/black-hole-explorer/BlackHoleExplorerPage";
import { AtomBuilderPage } from "../features/games/atom-builder/AtomBuilderPage";
import { ParticleDetectivePage } from "../features/games/particle-detective/ParticleDetectivePage";
import { WaveOrParticlePage } from "../features/games/wave-or-particle/WaveOrParticlePage";
import { QuantumPuzzlePage } from "../features/games/quantum-puzzle/QuantumPuzzlePage";
import { RadioactiveCountdownPage } from "../features/games/radioactive-countdown/RadioactiveCountdownPage";
import { PhotoelectricLabPage } from "../features/games/photoelectric-lab/PhotoelectricLabPage";
import { ShipDesignerPage } from "../features/games/ship-designer/ShipDesignerPage";
import { WaterPressurePage } from "../features/games/water-pressure/WaterPressurePage";
import { DamEngineerPage } from "../features/games/dam-engineer/DamEngineerPage";
import { FlightSimulatorPage } from "../features/games/flight-simulator/FlightSimulatorPage";
import { PipePuzzlePage } from "../features/games/pipe-puzzle/PipePuzzlePage";
import { FloatingChallengePage } from "../features/games/floating-challenge/FloatingChallengePage";
import { NuclearPuzzlePage } from "../features/games/nuclear-puzzle/NuclearPuzzlePage";
import { HalfLifeChallengePage } from "../features/games/half-life-challenge/HalfLifeChallengePage";
import { FusionSimulatorPage } from "../features/games/fusion-simulator/FusionSimulatorPage";
import { EnergyDetectivePage } from "../features/games/energy-detective/EnergyDetectivePage";
import { IsotopeExplorerPage } from "../features/games/isotope-explorer/IsotopeExplorerPage";
import { BicyclePhysicsPage } from "../features/games/bicycle-physics/BicyclePhysicsPage";
import { MirrorIllusionsPage } from "../features/games/mirror-illusions/MirrorIllusionsPage";
import { HomePage } from "../features/home/HomePage";
import { PhysicsWorldsPage } from "../features/physics-worlds/PhysicsWorldsPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { NotFoundPage } from "./NotFoundPage";
import { SectionPage } from "./SectionPage";

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
        path: "experiments",
        element: <Outlet />,
        children: [
          { index: true, element: <ExperimentsIndexPage /> },
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

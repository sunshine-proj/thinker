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

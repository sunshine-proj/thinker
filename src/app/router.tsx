import { createBrowserRouter, Outlet, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ElectronTrajectoryLabPage } from "../features/experiments/ElectronTrajectoryLabPage";
import { ExperimentsIndexPage } from "../features/experiments/ExperimentsIndexPage";
import { ProjectileMasterPage } from "../features/games/projectile-master/ProjectileMasterPage";
import { BalanceChallengePage } from "../features/games/balance-challenge/BalanceChallengePage";
import { CircuitBuilderPage } from "../features/games/circuit-builder/CircuitBuilderPage";
import { AchievementsPage } from "../features/achievements/AchievementsPage";
import { ChallengesPage } from "../features/challenges/ChallengesPage";
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
        path: "worlds/electromagnetism/circuit-builder",
        element: <CircuitBuilderPage />,
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

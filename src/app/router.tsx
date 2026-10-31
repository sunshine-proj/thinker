import { createBrowserRouter, Outlet } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ElectronTrajectoryLabPage } from "../features/experiments/ElectronTrajectoryLabPage";
import { HomePage } from "../features/home/HomePage";
import { NotFoundPage } from "./NotFoundPage";
import { SectionPage } from "./SectionPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "worlds",
        element: (
          <SectionPage
            title="Physics Worlds"
            eyebrow="Choose a direction"
            description="Explore the ideas that shape our universe, from everyday motion to the behavior of tiny particles."
            icon="worlds"
          />
        ),
      },
      {
        path: "experiments",
        element: <Outlet />,
        children: [
          { index: true, element: <ElectronTrajectoryLabPage /> },
          {
            path: "electron-trajectory",
            element: <ElectronTrajectoryLabPage />,
          },
        ],
      },
      {
        path: "challenges",
        element: (
          <SectionPage
            title="Challenges"
            eyebrow="Put your ideas to work"
            description="Take on focused physics problems and discover which principles can help you solve them."
            icon="challenges"
          />
        ),
      },
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
      {
        path: "achievements",
        element: (
          <SectionPage
            title="Achievements"
            eyebrow="Celebrate your progress"
            description="Keep track of the questions you have explored and the physics ideas you have mastered."
            icon="achievements"
          />
        ),
      },
      {
        path: "profile",
        element: (
          <SectionPage
            title="Your Profile"
            eyebrow="Your learning space"
            description="Your learning journey and progress will live here as you explore Physics Playground."
            icon="profile"
          />
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

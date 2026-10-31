import type { IconName } from "../common/AppIcon";

export interface NavigationItem {
  label: string;
  to: string;
  icon: IconName;
}

export const PRIMARY_NAVIGATION: readonly NavigationItem[] = [
  { label: "Home", to: "/", icon: "home" },
  { label: "Physics Worlds", to: "/worlds", icon: "worlds" },
  { label: "Experiment Lab", to: "/experiments", icon: "experiments" },
  { label: "Challenges", to: "/challenges", icon: "challenges" },
  {
    label: "Thought Experiments",
    to: "/thought-experiments",
    icon: "thoughtExperiments",
  },
  { label: "Knowledge Base", to: "/knowledge", icon: "knowledge" },
  { label: "Achievements", to: "/achievements", icon: "achievements" },
  { label: "Profile", to: "/profile", icon: "profile" },
];

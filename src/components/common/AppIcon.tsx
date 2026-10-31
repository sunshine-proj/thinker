export type IconName =
  | "home"
  | "worlds"
  | "experiments"
  | "challenges"
  | "thoughtExperiments"
  | "knowledge"
  | "achievements"
  | "profile"
  | "arrowRight";

interface AppIconProps {
  name: IconName;
  className?: string;
}

export function AppIcon({ name, className }: AppIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
    >
      {name === "home" && (
        <>
          <path d="m3.5 10 8.5-7 8.5 7" />
          <path d="M5.5 9v11h13V9M9.5 20v-6h5v6" />
        </>
      )}
      {name === "worlds" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3.5 12h17M12 3c2.3 2.4 3.5 5.4 3.5 9s-1.2 6.6-3.5 9c-2.3-2.4-3.5-5.4-3.5-9S9.7 5.4 12 3Z" />
        </>
      )}
      {name === "experiments" && (
        <>
          <path d="M9 3h6M10 3v6l-5.2 8.2A2.5 2.5 0 0 0 6.9 21h10.2a2.5 2.5 0 0 0 2.1-3.8L14 9V3" />
          <path d="M7.5 15h9" />
        </>
      )}
      {name === "challenges" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" />
        </>
      )}
      {name === "thoughtExperiments" && (
        <>
          <path d="M9 18h6m-5 3h4m-5-6.5a6 6 0 1 1 6 0c-.8.6-1 1.2-1 2.5h-4c0-1.3-.2-1.9-1-2.5Z" />
          <path d="M12 2v1m8.5 3.5-.9.5M4.4 6.5l-.9-.5" />
        </>
      )}
      {name === "knowledge" && (
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
          <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M8 7h8m-8 4h6" />
        </>
      )}
      {name === "achievements" && (
        <>
          <path d="M8 4h8v5a4 4 0 0 1-8 0V4Zm4 9v4m-4 4h8m-4-4a4 4 0 0 0 4 4m-8-4a4 4 0 0 1-4-4v-2h4m8 0h4v2a4 4 0 0 1-4 4" />
        </>
      )}
      {name === "profile" && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </>
      )}
      {name === "arrowRight" && <path d="M4 12h15m-6-6 6 6-6 6" />}
    </svg>
  );
}

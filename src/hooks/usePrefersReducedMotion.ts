import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function currentPreference(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(QUERY).matches
    : false;
}

/** Wall-clock seconds between canvas frames when the learner prefers reduced motion. */
export const REDUCED_MOTION_RENDER_INTERVAL_SECONDS = 1;

/**
 * Tracks the operating-system "reduce motion" setting. Simulations use it to show
 * stepped snapshots instead of continuous animation; the physics is unchanged.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(currentPreference);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia(QUERY);
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

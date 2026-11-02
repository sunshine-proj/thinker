export interface ServiceWorkerCallbacks {
  /** The app shell has been cached; it now works offline. */
  readonly onOfflineReady: () => void;
  /** A new version is installed and waiting for the learner to reload. */
  readonly onUpdateReady: () => void;
}

/**
 * Registers the generated service worker. Returns a function that activates a
 * waiting update and reloads, or null when service workers are unavailable.
 */
export async function registerServiceWorker(
  callbacks: ServiceWorkerCallbacks,
): Promise<(() => Promise<void>) | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");
    return registerSW({
      onOfflineReady: callbacks.onOfflineReady,
      onNeedRefresh: callbacks.onUpdateReady,
    });
  } catch (error) {
    console.error("The service worker could not be registered:", error);
    return null;
  }
}

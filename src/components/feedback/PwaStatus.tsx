import { useEffect, useState } from "react";
import { registerServiceWorker } from "../../services/pwa/registerServiceWorker";
import { useInstallPrompt } from "../../services/pwa/installPrompt";
import { useOnlineStatus } from "../../services/pwa/connectivity";

/**
 * Connection, offline-readiness, update and install messages. Everything is a
 * plain-text status so it works without relying on colour or icons.
 */
export function PwaStatus() {
  const online = useOnlineStatus();
  const { canInstall, install } = useInstallPrompt();
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [applyUpdate, setApplyUpdate] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    let active = true;
    void registerServiceWorker({
      onOfflineReady: () => active && setOfflineReady(true),
      onUpdateReady: () => active && setUpdateReady(true),
    }).then((update) => {
      if (active && update) {
        setApplyUpdate(() => update);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const messages = [
    !online &&
      "You are offline. Games, experiments and your saved progress still work; progress will sync when a connection returns.",
    offlineReady && online && "Physics Playground is ready to work offline.",
  ].filter((message): message is string => typeof message === "string");

  if (messages.length === 0 && !updateReady && !canInstall) {
    return null;
  }

  return (
    <div aria-live="polite" className="pwa-status" role="status">
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
      {updateReady && (
        <p>
          A new version is available.{" "}
          <button
            className="circuit-chip"
            onClick={() => void applyUpdate?.()}
            type="button"
          >
            Reload to update
          </button>
        </p>
      )}
      {canInstall && (
        <p>
          Install Physics Playground for quick access and offline use.{" "}
          <button className="circuit-chip" onClick={() => void install()} type="button">
            Install app
          </button>
        </p>
      )}
    </div>
  );
}

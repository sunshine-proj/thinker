import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { createSyncManager } from "./services/sync/progressSync";
import { progressRepository } from "./store/progressStore";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('The application root element "#root" was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// No remote account is configured yet, so progress stays on this device; once an
// adapter (for example Supabase) is provided here, it syncs whenever connectivity returns.
createSyncManager(progressRepository, null).syncOnReconnect(window);

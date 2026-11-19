import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { startProgressSync } from "./services/sync/syncService";
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

// Syncs with Supabase when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set;
// otherwise progress stays on this device.
startProgressSync(window);

import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // The service worker is a build-time concern; tests run without it.
    ...(mode === "test"
      ? []
      : [
          VitePWA({
            // Updates wait for the learner so an active experiment is never reloaded mid-run.
            registerType: "prompt",
            includeAssets: ["icons/apple-touch-icon.png"],
            manifest: {
              name: "Physics Playground",
              short_name: "Physics",
              description:
                "Learn physics by playing, experimenting, building, and discovering.",
              lang: "en",
              start_url: "/",
              scope: "/",
              display: "standalone",
              orientation: "any",
              background_color: "#f5f7fb",
              theme_color: "#596be0",
              categories: ["education", "science"],
              icons: [
                { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
                { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
                {
                  src: "/icons/icon-maskable-512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "maskable",
                },
              ],
            },
            workbox: {
              // Everything the app needs is bundled, so the whole shell works offline.
              globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest}"],
              // Client-side routes such as /worlds load the app shell when offline.
              navigateFallback: "/index.html",
              cleanupOutdatedCaches: true,
            },
          }),
        ]),
  ],
  resolve: {
    alias:
      mode === "test"
        ? [
            {
              find: "virtual:pwa-register",
              replacement: new URL("./tests/stubs/pwa-register.ts", import.meta.url).pathname,
            },
          ]
        : [],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    // Several page tests walk a whole game; give them room when the machine is busy.
    testTimeout: 15_000,
  },
}));

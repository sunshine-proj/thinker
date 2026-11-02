/** Stand-in for the virtual module that vite-plugin-pwa generates at build time. */
export function registerSW(): () => Promise<void> {
  return async () => undefined;
}

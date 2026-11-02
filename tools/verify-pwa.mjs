// Checks the production build for the pieces an installable, offline-capable PWA needs.
// Run after `npm run build`:  npm run verify:pwa
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dist = new URL("../dist/", import.meta.url).pathname;
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(existsSync(join(dist, "sw.js")), "dist/sw.js is missing");
check(existsSync(join(dist, "manifest.webmanifest")), "dist/manifest.webmanifest is missing");

if (existsSync(join(dist, "manifest.webmanifest"))) {
  const manifest = JSON.parse(readFileSync(join(dist, "manifest.webmanifest"), "utf8"));
  check(manifest.display === "standalone", "manifest display must be standalone");
  check(manifest.start_url && manifest.name && manifest.short_name, "manifest needs name, short_name and start_url");
  const sizes = new Set((manifest.icons ?? []).map((icon) => icon.sizes));
  check(sizes.has("192x192") && sizes.has("512x512"), "manifest needs 192x192 and 512x512 icons");
  check(
    (manifest.icons ?? []).some((icon) => icon.purpose === "maskable"),
    "manifest needs a maskable icon",
  );
  for (const icon of manifest.icons ?? []) {
    check(existsSync(join(dist, icon.src)), `icon file ${icon.src} is missing from dist`);
  }
}

if (existsSync(join(dist, "sw.js"))) {
  const worker = readFileSync(join(dist, "sw.js"), "utf8");
  const precached = new Set([...worker.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]));
  check(precached.has("index.html"), "the app shell (index.html) is not precached");
  check(worker.includes("NavigationRoute"), "offline navigation fallback is not configured");
  const assets = readdirSync(join(dist, "assets"));
  for (const asset of assets) {
    check(precached.has(`assets/${asset}`), `assets/${asset} is not precached`);
  }
}

const html = existsSync(join(dist, "index.html")) ? readFileSync(join(dist, "index.html"), "utf8") : "";
check(html.includes("manifest.webmanifest"), "index.html does not link the manifest");
check(!/https?:\/\/(?!www\.w3\.org)/.test(html.replace(/<meta[^>]*>/g, "")), "index.html loads a remote resource that would fail offline");

if (failures.length > 0) {
  console.error("PWA verification failed:\n - " + failures.join("\n - "));
  process.exit(1);
}
console.log("PWA verification passed: manifest, icons, service worker, precache and offline fallback are in place.");

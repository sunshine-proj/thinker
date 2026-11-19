// Checks the production build against size budgets so the first visit stays fast on a phone.
// Run after `npm run build`:  npm run verify:performance
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const dist = new URL("../dist/assets/", import.meta.url).pathname;
const KB = 1024;
const budgets = {
  entryScriptGzip: 130 * KB, // the shell, router, store and shared physics: everything a first visit downloads
  largestPageChunkGzip: 60 * KB, // any single lazily loaded page
  stylesheetGzip: 20 * KB,
};

const files = readdirSync(dist).map((name) => ({ name, gzip: gzipSync(readFileSync(join(dist, name))).length }));
const scripts = files.filter((file) => file.name.endsWith(".js"));
const entry = scripts.find((file) => file.name.startsWith("index-"));

// A first visit downloads the entry and every chunk it imports statically (Rollup moves shared code into
// such chunks), so the entry budget counts all of them. Dynamic import() targets are lazily loaded pages.
function staticClosure(start) {
  const seen = new Set();
  const stack = [start];
  while (stack.length > 0) {
    const name = stack.pop();
    if (seen.has(name)) continue;
    seen.add(name);
    const source = readFileSync(join(dist, name), "utf8");
    for (const match of source.matchAll(/(?:\bfrom|\bimport)\s*["']\.\/([\w.-]+\.js)["']/g)) stack.push(match[1]);
  }
  return seen;
}
const startup = entry ? staticClosure(entry.name) : new Set();
const startupGzip = scripts.filter((file) => startup.has(file.name)).reduce((sum, file) => sum + file.gzip, 0);
const pages = scripts.filter((file) => !startup.has(file.name) && !file.name.startsWith("workbox") && !file.name.startsWith("virtual_pwa"));
const largestPage = pages.reduce((best, file) => (file.gzip > best.gzip ? file : best), { name: "none", gzip: 0 });
const stylesheet = files.find((file) => file.name.endsWith(".css"));
const failures = [];
const report = (label, size, budget) => {
  const line = `${label}: ${(size / KB).toFixed(1)} kB gzip (budget ${(budget / KB).toFixed(0)} kB)`;
  console.log(line);
  if (size > budget) failures.push(line);
};

if (!entry) failures.push("entry chunk not found");
else report(`first-visit scripts (${[...startup].join(", ")})`, startupGzip, budgets.entryScriptGzip);
report(`largest page chunk ${largestPage.name}`, largestPage.gzip, budgets.largestPageChunkGzip);
if (stylesheet) report(`stylesheet ${stylesheet.name}`, stylesheet.gzip, budgets.stylesheetGzip);
console.log(`${pages.length} lazily loaded page chunks`);
if (pages.length < 20) failures.push("pages are not code-split (fewer than 20 lazy chunks)");

if (failures.length > 0) {
  console.error("Performance budget exceeded:\n - " + failures.join("\n - "));
  process.exit(1);
}
console.log("Performance budgets met.");

import { render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { router } from "../../src/app/router";
import { PHYSICS_WORLDS } from "../../src/data/games/gameCatalog";

const ROUTES = [
  "/", "/worlds", "/experiments", "/challenges", "/achievements", "/profile", "/thought-experiments",
  "/worlds/mechanics/projectile-master", "/worlds/mechanics/balance-challenge", "/worlds/electromagnetism/circuit-builder",
  "/experiments/electron-trajectory",
  ...PHYSICS_WORLDS.flatMap((world) => world.entries.map((entry) => entry.path)),
];

// Colour contrast depends on computed styles and layout, which jsdom does not provide; it is checked by hand
// against the design tokens (see TESTING.md). Everything else axe can decide in jsdom is enforced.
const RULES = { "color-contrast": { enabled: false }, "scrollable-region-focusable": { enabled: false } };

async function audit(path: string) {
  const memory = createMemoryRouter(router.routes, { initialEntries: [path] });
  const { container } = render(<RouterProvider router={memory} />);
  await waitFor(() => expect(screen.queryByText("Loading…")).toBeNull(), { timeout: 10_000 });
  await screen.findByRole("heading", { level: 1 }, { timeout: 10_000 });
  const results = await axe.run(container, { rules: RULES });
  return results.violations.map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length}) e.g. ${violation.nodes[0]?.html.slice(0, 120)}`);
}

describe("accessibility (axe-core, every route)", () => {
  it.each([...new Set(ROUTES)])("%s has no detectable violations", async (path) => {
    expect(await audit(path)).toEqual([]);
  }, 30_000);
});

describe("structure", () => {
  it("has a skip link, a labelled navigation and a single main landmark on every page shell", async () => {
    const memory = createMemoryRouter(router.routes, { initialEntries: ["/"] });
    const { container } = render(<RouterProvider router={memory} />);
    await screen.findByRole("heading", { level: 1 });
    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(container.querySelector('a[href="#main-content"]')).not.toBeNull();
    expect(container.querySelectorAll("nav[aria-label], nav[aria-labelledby]").length).toBeGreaterThan(0);
  });
});

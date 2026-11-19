import { expect, test } from "@playwright/test";

test.describe("installable PWA", () => {
  test("serves a manifest with icons and registers a service worker", async ({ page, request }) => {
    await page.goto("/");
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(href).toBeTruthy();
    const manifest = await (await request.get(href!)).json();
    expect(manifest.name).toBe("Physics Playground");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.some((icon: { sizes: string }) => icon.sizes === "512x512")).toBe(true);
    const registered = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state ?? null);
    expect(["activated", "activating"]).toContain(registered);
  });
});

test.describe("offline", () => {
  test("navigates between pages and plays a game with no connection", async ({ page, context }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    // Reload once so the page is controlled by the service worker.
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/worlds");
    await expect(page.getByRole("heading", { level: 1, name: "Physics Worlds" })).toBeVisible();
    await page.goto("/worlds/mechanics/ice-puck-pilot");
    await expect(page.getByRole("heading", { level: 1, name: "Ice Puck Pilot" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: /offline/i })).toBeVisible();
    await page.goto("/knowledge/ohms-law");
    await expect(page.getByRole("heading", { level: 1, name: "Ohm's law" })).toBeVisible();
    await context.setOffline(false);
  });
});

test.describe("progress", () => {
  test("offers to resume an unfinished game after a reload", async ({ page }) => {
    await page.goto("/worlds/mechanics/ice-puck-pilot");
    await page.getByRole("button", { name: "Start game" }).click();
    await page.getByRole("slider", { name: "Thrust" }).fill("3");
    await page.waitForTimeout(700);
    await page.reload();
    await expect(page.getByRole("button", { name: "Resume saved game" })).toBeVisible();
  });

  test("keeps a thought-experiment prediction across reloads", async ({ page }) => {
    await page.goto("/thought-experiments/gravity-doubles");
    await page.getByRole("radio", { name: /About 71 %/ }).check();
    await page.getByRole("button", { name: "Lock in my prediction" }).click();
    await expect(page.getByText(/Prediction recorded/)).toBeVisible();
    await page.reload();
    await expect(page.getByText(/Your prediction matched the result/)).toBeVisible();
  });
});

test.describe("live game on a phone-sized screen", () => {
  test("plays Moon Landing Live with touch controls and no sideways scrolling", async ({ page }) => {
    await page.goto("/worlds/astronomy/moon-landing/live");
    await expect(page.getByRole("heading", { level: 1, name: "Moon Landing Live" })).toBeVisible();
    await expect(page.locator("canvas.live-game__canvas")).toBeVisible();
    const before = await page.getByText(/ALTITUDE/).locator("..").textContent();
    await page.getByRole("button", { name: "Start" }).click();
    const thrust = page.getByRole("button", { name: /Thrust/ });
    await thrust.dispatchEvent("pointerdown");
    await page.waitForTimeout(800);
    await thrust.dispatchEvent("pointerup");
    await expect.poll(async () => page.getByText(/ALTITUDE/).locator("..").textContent()).not.toBe(before);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

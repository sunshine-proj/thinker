/// <reference types="node" />
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

const token = (name: string) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})`))?.[1] ?? "";

const css = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");
const html = readFileSync(join(process.cwd(), "index.html"), "utf8");

interface Rule { readonly selector: string; readonly body: string }
function rules(): Rule[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...stripped.matchAll(/([^{}@]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1]!.trim(), body: m[2]! }));
}
const declaration = (body: string, property: string) => body.match(new RegExp(`(?:^|[;\\s])${property}:\\s*(#[0-9a-fA-F]{3,6})\\b`))?.[1];

describe("colour contrast (WCAG AA, 4.5:1 for text)", () => {
  it("keeps the design tokens readable on the page and panel backgrounds", () => {
    const ink = token("color-ink");
    const muted = token("color-muted");
    const brand = token("color-brand");
    const brandDark = token("color-brand-dark");
    for (const background of ["#ffffff", "#f5f7fb"]) {
      expect(contrastRatio(ink, background)).toBeGreaterThan(7);
      expect(contrastRatio(muted, background), `muted text on ${background}`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(brandDark, background), `brand link text on ${background}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio("#ffffff", brand), "white on brand buttons").toBeGreaterThanOrEqual(4.5);
  });

  it("checks every rule that sets both a text and a background colour", () => {
    const failures: string[] = [];
    for (const rule of rules()) {
      const color = declaration(rule.body, "color");
      const background = declaration(rule.body, "background(?:-color)?");
      if (color && background && !rule.selector.includes(":disabled") && contrastRatio(color, background) < 4.5) {
        failures.push(`${rule.selector}: ${color} on ${background} = ${contrastRatio(color, background).toFixed(2)}`);
      }
    }
    expect(failures.join("\n")).toBe("");
  });

  it("keeps dark text colours used on the light surfaces readable", () => {
    const failures: string[] = [];
    for (const rule of rules()) {
      const color = declaration(rule.body, "color");
      if (!color || declaration(rule.body, "background(?:-color)?")) continue;
      // Light colours are meant for dark or coloured backgrounds and are covered by the pair check above.
      const light = contrastRatio(color, "#000000") > 8;
      for (const surface of ["#ffffff", "#f5f7fb"]) {
        if (!light && !rule.selector.includes(":disabled") && contrastRatio(color, surface) < 4.5) {
          failures.push(`${rule.selector}: ${color} on ${surface} = ${contrastRatio(color, surface).toFixed(2)}`);
        }
      }
    }
    expect(failures.join("\n")).toBe("");
  });
});

describe("responsive design", () => {
  it("declares the mobile viewport and a 320 px minimum width", () => {
    expect(html).toMatch(/<meta name="viewport" content="width=device-width, initial-scale=1(\.0)?"/);
    expect(css).toMatch(/body\s*\{[^}]*min-width:\s*320px/);
  });

  it("adapts the layout at tablet and phone widths", () => {
    const breakpoints = [...css.matchAll(/@media \(max-width: (\d+)px\)/g)].map((m) => Number(m[1]));
    expect(breakpoints.some((w) => w >= 700 && w <= 800)).toBe(true);
    expect(breakpoints.some((w) => w <= 430)).toBe(true);
    expect(breakpoints.some((w) => w >= 1000)).toBe(true);
  });

  it("keeps charts and diagrams fluid instead of fixed width", () => {
    for (const selector of [".balance-plot", ".line-chart svg"]) {
      const rule = rules().find((r) => r.selector.split(",").map((s) => s.trim()).includes(selector));
      expect(rule, `${selector} rule`).toBeDefined();
      expect(rule!.body).toMatch(/width:\s*100%|max-width:\s*100%/);
    }
  });

  it("gives interactive controls touch-sized targets (at least 40 px, 44 px for primary buttons)", () => {
    expect(css).toMatch(/min-height:\s*44px/);
    // Status badges are not interactive; everything else that sets a minimum height must be touch-sized.
    const small = rules()
      .filter((rule) => !/^\.(lab|game)-status\b/.test(rule.selector))
      .map((rule) => ({ rule, height: Number(rule.body.match(/min-height:\s*(\d+)px/)?.[1] ?? 99) }))
      .filter(({ height }) => height < 40)
      .map(({ rule, height }) => `${rule.selector}: ${height}px`);
    expect(small.join("\n")).toBe("");
  });

  it("respects the reduced-motion preference", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/animation(?:-duration)?:\s*(?:none|0\.01ms)|transition(?:-duration)?:\s*(?:none|0\.01ms)/);
  });

  it("shows a visible keyboard focus indicator", () => {
    expect(css).toMatch(/:focus-visible/);
  });
});

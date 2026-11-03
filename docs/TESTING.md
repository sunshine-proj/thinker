# Quality testing

Step 80 of the roadmap covers accessibility, responsive design, offline use, browser compatibility and performance.
This page lists what the repository checks automatically and what still has to be verified by a person on real
devices, because a headless test runner cannot do it.

## Run everything

```bash
npm run typecheck
npm run lint
npm test                    # includes tests/quality/*
npm run build
npm run verify:pwa          # manifest, icons, service worker, every built asset precached, offline fallback
npm run verify:performance  # bundle-size budgets on the production build
```

## Automated

| Area | Check | Where |
|---|---|---|
| Accessibility | [axe-core](https://github.com/dequelabs/axe-core) runs on **every route** in the router (all games, experiments, the home, worlds, profile, challenges and achievements pages): names, roles, labels, landmarks, headings, ARIA validity. | `tests/quality/accessibility.test.tsx` |
| Accessibility | Colour contrast of all text colours in `src/styles.css` against their backgrounds (WCAG AA 4.5:1), computed from the stylesheet, because jsdom cannot compute styles for axe's own contrast rule. Disabled controls are exempt. | `tests/quality/css.test.ts` |
| Accessibility | Keyboard focus indicator, skip link, labelled landmarks, reduced-motion media query. | `tests/quality/css.test.ts`, `tests/quality/accessibility.test.tsx` |
| Responsive | Mobile viewport meta tag, 320 px minimum width, tablet and phone breakpoints, fluid charts and diagrams, touch targets of at least 40 px (44 px for primary buttons). | `tests/quality/css.test.ts` |
| Offline | Production build precaches every asset including all lazy page chunks and falls back to the app shell for navigation; progress is stored in IndexedDB with an in-memory fallback and syncs on reconnect. | `npm run verify:pwa`, `tests/pwa.test.tsx`, `tests/services` |
| Performance | Size budgets: entry script ≤ 130 kB gzip, any page chunk ≤ 60 kB gzip, stylesheet ≤ 20 kB gzip, pages code-split. | `npm run verify:performance` |
| Performance | Simulation cost: every lab setting evaluates in under 150 ms, the heaviest game models (N-body, drag, FFT, wave equation) in a fraction of a second, and the orbit integrator is bounded. | `tests/quality/performance.test.ts` |
| Browser compatibility | The build targets Vite's `baseline-widely-available` set (Chrome and Edge 107+, Firefox 104+, Safari 16+). | `vite.config.ts` default |

## Manual checklist (needs real browsers and devices)

These have **not** been run by the automated suite. Before a release, check at least the following.

- [ ] **Screen reader:** NVDA with Firefox or Chrome on Windows, VoiceOver with Safari on macOS and iOS, TalkBack on Android. Play one round of a
      game and run one experiment; check that sliders announce their value and unit, that measurements are announced when they change
      (they are `aria-live`), and that the text alternative of every chart is understandable.
- [ ] **Keyboard only:** tab through Home, Physics Worlds, one game and one experiment. Every control reachable, focus always visible, no traps,
      arrow keys change sliders.
- [ ] **Zoom and text size:** 200 % browser zoom and a larger system font; nothing is cut off or overlaps.
- [ ] **Devices:** a small phone (320–360 px wide), a large phone, a tablet in both orientations, a laptop. Check that canvases and charts
      resize, touch targets are comfortable and the bottom navigation does not cover content.
- [ ] **Browsers:** current Chrome, Edge, Firefox and Safari (desktop), Safari on iOS and Chrome on Android. Install the app as a PWA on
      Android and iOS ("Add to Home Screen").
- [ ] **Offline:** load the app online, open one game and one experiment, switch to airplane mode, reload, navigate between pages, finish a round,
      then go back online and confirm the progress is kept. Also try "Update available" after deploying a new build.
- [ ] **Performance on a mid-range phone:** open the Solar System Builder, Wave Simulator and the Orbital Motion lab and check that
      sliders respond without noticeable lag (use the browser's performance profiler if in doubt). Run Lighthouse on the production build.
- [ ] **Reduced motion and dark mode:** with "reduce motion" enabled in the operating system, animations should stop; the app has a light theme only.
- [ ] **Colour-vision:** check charts and diagrams with a colour-blindness simulator; every chart series is also distinguished by a legend, dashes
      or labels.

## Known limits

- No end-to-end tests with Playwright have been added yet; the project lists Playwright in its stack but the suite currently runs in jsdom.
- The axe contrast rule is replaced by the stylesheet check above; text over images or gradients is not covered.
- Layout (overlap, overflow) cannot be tested in jsdom; the CSS checks verify the rules that prevent it, not the rendered result.

# Accessibility Menu and Brand Fonts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the site in Gotham Black and Helvetica Neue from self-hosted files, and add a 12-tile accessibility menu to every page.

**Architecture:** One new self-contained script, `site/a11y.js`, holds settings state, persistence, and the panel UI. It applies every setting as a class on `<html>`; all visual effects live in one labelled CSS block in `site/styles.css`. Fonts are converted once by a Node script and referenced through `@font-face`. Tests are Playwright scripts run with `node --test` against `http-server`.

**Tech Stack:** Plain HTML/CSS/JS (no build step), Playwright (already a dependency), `node:test`, `wawoff2` (new dev dependency, font conversion only).

**Spec:** `docs/superpowers/specs/2026-11-10-accessibility-menu-and-brand-fonts-design.md`

## Global Constraints

- Static site on Netlify, no build step; CSP is `default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self'` (in `site/_headers`). No inline scripts, no third-party hosts.
- Red is `#880808` (`--color-accent`, `--color-blood-red`). Do not introduce any other red.
- Titles Gotham Black (weight 900); body Helvetica Neue Light (300) and Regular (400). `font-display: swap`.
- Keep Montserrat and Inter as fallbacks; delete their files only after Task 1's check passes.
- `localStorage` access is always inside `try/catch`; the site works with it blocked.
- Tap targets at least 44px. Panel works at 375px wide with no horizontal scroll.
- Pages to wire (10): `site/index.html`, `site/404.html`, `site/thanks.html`, `site/codex.html`, and the six `site/work/*.html` (use `../` paths there).
- Font source files are in `C:\Users\cainm\Downloads\` zips; the owner has chosen to use them. Unpack into a fresh scratch folder, never into the repo, and never run anything from inside the unpacked folders.

## Review Focus

- Storage blocked or throws (private window): menu still works for the session, no console error.
- Corrupt or old saved JSON in storage: ignored, defaults used, no crash.
- Visitor hides the button, then reloads: footer "Accessibility settings" link still reopens the menu.
- Several settings at once (large text + 2x line height + dyslexia font): no horizontal scroll at 375px.
- OS `prefers-reduced-motion: reduce` with no saved choice: Pause Animations starts on.

## File Structure

- Create `tests/helpers.mjs`: starts `http-server` on port 8099, exposes `startServer()`, `stopServer()`, `newPage(browser, path)`.
- Create `tests/fonts.test.mjs`, `tests/a11y-core.test.mjs`, `tests/a11y-tiles.test.mjs`: Playwright tests.
- Create `convert-fonts.mjs` (repo root): one-off converter, OTF to `.woff2`.
- Create `site/a11y.js`: the whole widget.
- Create `site/assets/fonts/gotham-black.woff2`, `helveticaneue-light.woff2`, `helveticaneue-roman.woff2`, `opendyslexic-regular.woff2` and `opendyslexic-LICENSE.txt`.
- Modify `site/styles.css` (font faces and tokens; one `/* ─── Accessibility menu ─── */` block at the end), `site/enhancements.js` (pause hook), the 10 HTML pages (script tag in `<head>`, footer link), `package.json` (test script, `wawoff2`), `ASSETS-TODO.md`.

---

### Task 1: Brand fonts

**Files:**
- Create: `tests/helpers.mjs`, `tests/fonts.test.mjs`, `convert-fonts.mjs`, three font files in `site/assets/fonts/`
- Modify: `site/styles.css:28-60` (font faces), `site/styles.css:77-78` (tokens), `site/index.html` (preload), `package.json`

**Interfaces:**
- Produces: `startServer(): Promise<void>`, `stopServer(): Promise<void>`, `newPage(browser, path: string): Promise<Page>` in `tests/helpers.mjs` (base URL `http://localhost:8099`); font families `Gotham Black` (900) and `Helvetica Neue` (300, 400) available to CSS.

- [ ] **Step 1: Add `"test": "node --test tests/"` to `package.json` scripts and `wawoff2` to devDependencies; run `npm install`.**
- [ ] **Step 2: Write `tests/helpers.mjs`** per the Interfaces block (spawn `node node_modules/http-server/bin/http-server site -c-1 -p 8099`, wait until the port answers).
- [ ] **Step 3: Write the failing test `fonts.test.mjs`:** `title font is Gotham Black` loads `/index.html`, awaits `document.fonts.ready`, asserts `document.fonts.check('900 16px "Gotham Black"')` is true and `getComputedStyle(h1).fontFamily` starts with `"Gotham Black"`; `body font is Helvetica Neue` asserts `document.fonts.check('400 16px "Helvetica Neue"')` and `'300 16px "Helvetica Neue"'` are true and `getComputedStyle(document.body).fontFamily` starts with `"Helvetica Neue"`; `fallback fonts still declared` asserts the computed `--font-title` custom property contains `Montserrat`.
- [ ] **Step 4: Run `npm test`.** Expected: all three FAIL.
- [ ] **Step 5: Unpack both zips to a fresh scratch folder; write `convert-fonts.mjs(srcDir, outDir)`** using `wawoff2` to convert `Gotham-Black.otf`, `HelveticaNeueLight.otf`, `HelveticaNeueRoman.otf` to `gotham-black.woff2`, `helveticaneue-light.woff2`, `helveticaneue-roman.woff2` in `site/assets/fonts/`. Run it and report the three sizes.
- [ ] **Step 6: In `styles.css` add `@font-face` for Gotham Black (900), Helvetica Neue (300) and (400) with `font-display: swap` and the new files; set `--font-title: 'Gotham Black', 'Montserrat', sans-serif` and `--font-body: 'Helvetica Neue', 'Inter', sans-serif`.** Add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the Gotham and Roman files to `index.html`.
- [ ] **Step 7: Run `npm test` and `node check-assets.mjs`.** Expected: font tests PASS; 0 missing.
- [ ] **Step 8: Look at home, one case study and the Codex page in the browser pane at desktop and 375px;** confirm no overflow and acceptable text wrapping with the new metrics. Fix only genuine breakage.
- [ ] **Step 9: Remove the Montserrat/Inter `@font-face` rules and files only if the fallback test and a repo search show nothing needs them; otherwise leave them.** Commit: `git add` the touched files, message `Switch to Gotham Black and Helvetica Neue`.

---

### Task 2: Menu core (state, panel shell, wiring)

**Files:**
- Create: `site/a11y.js`, `tests/a11y-core.test.mjs`
- Modify: `site/styles.css` (start the accessibility block: button, panel, tiles), the 10 HTML pages (script tag in `<head>`; footer link)

**Interfaces:**
- Produces, on `window.TMEA11y`: `get(): Settings`, `set(key: string, value: number): void`, `cycle(key: string): void`, `reset(): void`, `open(): void`, `close(): void`. `Settings` is `{contrast, links, text, spacing, pause, images, dyslexia, lineheight, align, saturation, pos}` with integer values (0 is off; `pos` 0 bottom-left, 1 bottom-right, 2 hidden). Storage key `tme-a11y` (JSON). Every change dispatches `document` event `a11y:change` with `detail` = the settings. Class naming on `<html>`: `a11y-<key>-<n>` for stepped keys, boolean keys use `a11y-links`, `a11y-pause`, `a11y-images-off`, `a11y-dyslexia`; position is `data-a11y-pos`.
- Panel markup: button `#a11y-toggle` (aria-label "Accessibility menu", aria-expanded), `div#a11y-panel[role=dialog][aria-label="Accessibility Menu"]`, close button `#a11y-close`, tiles `button.a11y-tile[data-key]`, footer link `a.a11y-footer-link` ("Accessibility settings").

- [ ] **Step 1: Write failing tests in `a11y-core.test.mjs`:** `button opens panel and sets aria-expanded`; `Esc closes panel and returns focus to the button`; `focus stays inside the panel while open` (Tab past the last tile wraps to `#a11y-close` or first tile); `settings persist across reload` (call `TMEA11y.set('links',1)`, reload, assert `html.a11y-links`); `blocked storage still works` (override `Storage.prototype.setItem` to throw via `addInitScript`, set a value, assert class applied and no console error); `corrupt storage is ignored` (store `{bad` under `tme-a11y` via `addInitScript`, assert page loads, `get().links === 0`, no console error); `footer link opens the menu`; `panel has no horizontal scroll at 375px`.
- [ ] **Step 2: Run `npm test`.** Expected: new tests FAIL.
- [ ] **Step 3: Implement `site/a11y.js` as one IIFE** exposing `window.TMEA11y` per the Interfaces block; it builds the button and panel on `DOMContentLoaded`, applies saved classes immediately at parse time (before first paint), wraps all storage access in `try/catch`, and ignores values that are not integers within each key's range. Tiles in this task are built for all 12 keys but only the settings plumbing is required to work.
- [ ] **Step 4: Style button, panel and tiles in the accessibility block:** 44px minimum targets, brand-red focus ring (`--color-accent`), panel is a bottom sheet on narrow screens, tiles in a two-column grid, active tile shows a check and step bars.
- [ ] **Step 5: Add `<script src="a11y.js"></script>` (`../a11y.js` in `work/`) in `<head>` and an `a.a11y-footer-link` inside `.footer-inner` on all 10 pages; add `a11y-footer-link` to the footer link click handler** so it calls `TMEA11y.open()`.
- [ ] **Step 6: Run `npm test`.** Expected: all PASS. Also run `node check-assets.mjs` and confirm no CSP errors in the console on `index`, a `work/` page, `404` and `codex`.
- [ ] **Step 7: Commit:** `Add accessibility menu core and wiring`.

---

### Task 3: Visual tiles

**Files:**
- Create: `tests/a11y-tiles.test.mjs`
- Modify: `site/a11y.js` (tile labels and step counts), `site/styles.css` (accessibility block)

**Interfaces:**
- Consumes: `TMEA11y.cycle(key)`, class naming from Task 2.
- Produces: working effects for keys `contrast` (3 steps: Invert, Light, Dark), `links` (on/off), `text` (110%, 125%, 150%), `spacing` (3 steps), `lineheight` (1.5, 1.75, 2), `align` (left, centre, right), `saturation` (low, high, greyscale).

- [ ] **Step 1: Write failing tests:** for each key, cycle once through `TMEA11y.cycle` and assert the specific computed effect: `text` step 1 gives `getComputedStyle(documentElement).fontSize` of `17.6px` and step 3 `24px`; `lineheight` step 3 gives body line height of exactly 2x its font size; `spacing` step 1 gives a non-zero `letterSpacing` on a paragraph; `align` step 2 gives `textAlign === 'center'` on a paragraph; `links` makes a content link `textDecorationLine === 'underline'`; `saturation` step 3 gives `filter` containing `grayscale`; `contrast` step 1 gives a filter containing `invert`. Also `each stepped key wraps back to 0 after its last step` and `stacked settings leave no horizontal scroll at 375px` (text 3 + lineheight 3 + spacing 3 on `index.html` and `work/nora.html`).
- [ ] **Step 2: Run `npm test`.** Expected: new tests FAIL.
- [ ] **Step 3: Add the CSS for each class** in the accessibility block, scoped to `html.a11y-*`. Text scaling sets `html { font-size }` as a percentage so existing `rem` sizes follow; `contrast` and `saturation` use `filter` on `html`, with images re-inverted for Invert so photographs are not negatives. Fix collisions with existing high-specificity rules by raising scope, not with blanket `!important`.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: View `index.html` and `work/nora.html` at 375px with each setting on;** fix wrapping or overflow found.
- [ ] **Step 6: Commit:** `Add visual accessibility settings`.

---

### Task 4: Motion, images, dyslexia

**Files:**
- Modify: `site/a11y.js`, `site/enhancements.js:10` (and the guards at lines 88-314), `site/styles.css`
- Create: `site/assets/fonts/opendyslexic-regular.woff2`, `site/assets/fonts/opendyslexic-LICENSE.txt`

**Interfaces:**
- Consumes: `a11y:change` event and `html.a11y-pause` from Task 2.
- Produces: `enhancements.js` treats `prefersReducedMotion` as true when `html.a11y-pause` is set (read at load and re-read on `a11y:change`).

- [ ] **Step 1: Write failing tests:** `pause stops css animation` (with `a11y-pause`, every element's computed `animationName` is `none` and `transitionDuration` is `0s`); `pause pauses videos` (on `work/costa-rebrand.html`, with pause set every `video.paused === true`, and unpausing is not forced); `pause is on by default under prefers-reduced-motion` (Playwright `reducedMotion: 'reduce'`, no saved value: `get().pause === 1`); `a saved choice overrides the OS default`; `hide images hides img, video and canvas` (computed `visibility` hidden or `display` none) while the page text is still visible; `dyslexia font applies` (`document.fonts.check('16px OpenDyslexic')` and body computed `fontFamily` starts with `OpenDyslexic` when set).
- [ ] **Step 2: Run `npm test`.** Expected: new tests FAIL.
- [ ] **Step 3: Obtain OpenDyslexic Regular as `.woff2` plus its SIL OFL licence text.** Ask the owner before downloading, naming the file, source and size; do not fetch without a yes. If they decline, fall back to a locally supplied file or drop this tile and say so.
- [ ] **Step 4: Implement.** CSS: `a11y-pause` disables animations and transitions and sets `scroll-behavior: auto`; `a11y-images-off` hides images, video, canvas and background images; `a11y-dyslexia` swaps `--font-title` and `--font-body` to OpenDyslexic. JS: on pause, call `.pause()` on all `<video>` and remove `autoplay`; default `pause` to 1 when the OS requests reduced motion and no value is stored; `enhancements.js` re-reads the flag.
- [ ] **Step 5: Run `npm test`.** Expected: PASS. Confirm with the browser pane that parallax stops on `index.html` when Pause is toggled live.
- [ ] **Step 6: Commit:** `Add pause, hide images and dyslexia settings`.

---

### Task 5: Reset and move/hide

**Files:**
- Modify: `site/a11y.js`, `site/styles.css`, `tests/a11y-core.test.mjs`

**Interfaces:**
- Consumes: `TMEA11y.reset()`, `pos` setting from Task 2.

- [ ] **Step 1: Write failing tests:** `reset clears every setting and removes all a11y classes` (set several, click the Reset tile, assert `get()` all zero and `html.className` has no `a11y-` class); `move cycles bottom-left, bottom-right, hidden` (assert button bounding box side for pos 0 and 1, button not visible for pos 2); `hidden position survives reload and the footer link still opens the menu`; `reset keeps the widget reachable` (after reset the button is visible at the default position).
- [ ] **Step 2: Run `npm test`.** Expected: new tests FAIL.
- [ ] **Step 3: Implement the Reset All and Move/Hide Widget controls in the panel** (full-width reset button in brand red; move row cycling `pos`), with `data-a11y-pos` styling in the accessibility block.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit:** `Add reset and move/hide widget controls`.

---

### Task 6: Verification and handoff

**Files:**
- Modify: `ASSETS-TODO.md`

- [ ] **Step 1: Run `npm test` and `node check-assets.mjs`.** Expected: all tests pass, 0 missing.
- [ ] **Step 2: Keyboard-only pass in the browser pane** on `index.html`: Tab to the button, open, move through every tile, toggle with Enter and Space, Esc closes and focus returns. Record any failure and fix it with a test.
- [ ] **Step 3: Check the console for CSP or script errors on `index`, `work/nora`, `codex`, `404`, `thanks`;** and `document.fonts` shows Gotham Black and Helvetica Neue loaded.
- [ ] **Step 4: Update `ASSETS-TODO.md`:** remove the CV and cover-letter item and the font decision (done); add the accessibility menu and the font-licence note (desktop files in use; a webfont licence is still the safe route).
- [ ] **Step 5: Commit** `Document accessibility menu and fonts in ASSETS-TODO`, then push to PR 3 only after the owner approves.

# Accessibility menu and brand fonts: design

Date: 2026-11-10
Branch: `site-refresh-nov-2026` (PR 3)

## Goal

1. Bring the site's typography in line with the brand spec: **Gotham Black** for titles, **Helvetica Neue** for body, red `#880808`.
2. Add a visitor-controlled **accessibility menu** on every page, modelled on the reference screenshots (12 tiles, settings remembered, reset, move/hide).

Success: every page renders in the spec'd fonts from self-hosted licensed files; a visitor can change any of the 12 settings, reload, and find them kept; nothing breaks the CSP; the menu is fully keyboard and screen-reader usable.

## Out of scope

- CV and cover letter: not on the site (decided 2026-11-10).
- Redesign, role-based categories, three.js viewer: parked.
- Fixing the site's baseline accessibility (contrast, focus order, alt text) is a separate pass. The menu supplements it and does not replace it.

## Part 1: brand fonts and red

**Red.** `#880808` is already `--color-accent` and `--color-blood-red`, in the page `theme-color` tags and in the manifest. No change. Re-check for stray reds during the build.

**Fonts.** The owner supplies licensed `.woff2` files, placed in `site/assets/fonts/`:

| Role | Font | Weight | Replaces |
|---|---|---|---|
| Titles | Gotham Black | 900 | Montserrat 900 |
| Body | Helvetica Neue Light | 300 | Inter 300 |
| Body | Helvetica Neue Regular | 400 | Inter 400 |

- Add `@font-face` rules (`font-display: swap`) in `styles.css`.
- Set `--font-title: 'Gotham Black', 'Montserrat', sans-serif` and `--font-body: 'Helvetica Neue', 'Inter', sans-serif`, so the free fonts remain a fallback.
- Preload the title and regular-body files on the home page.
- Delete the Montserrat and Inter files and their rules only after a full-site check shows nothing depends on them.
- CSP is unchanged: `font-src 'self'` already covers self-hosted files.
- Blocker: the work cannot be completed until the files arrive. If the licence is desktop-only it does not cover web embedding, and the owner must get a webfont licence.

## Part 2: accessibility menu

### Behaviour

A floating button opens a panel (a dialog). Tiles toggle or cycle through steps; the active tile shows a check and step bars, as in the reference.

| Tile | Steps | Effect |
|---|---|---|
| Contrast | Invert, Light, Dark | colour scheme override |
| Highlight Links | on/off | underline and outline all links |
| Bigger Text | 110%, 125%, 150% | scales the root font size |
| Text Spacing | 3 steps | letter and word spacing |
| Pause Animations | on/off | stops CSS animation and transitions, parallax, and pauses video |
| Hide Images | on/off | hides images, video, canvas and CSS background images |
| Dyslexia Friendly | on/off | switches body and titles to OpenDyslexic |
| Line Height | 1.5x, 1.75x, 2x | body line height |
| Text Align | left, centre, right | text alignment |
| Saturation | low, high, greyscale | CSS filter on the page |
| Reset All | n/a | clears every setting |
| Move/Hide Widget | bottom-left, bottom-right, hidden | moves or hides the button |

Defaults honour `prefers-reduced-motion` (Pause Animations starts on if the OS asks for it) and respect the visitor's browser text size.

### Architecture

- **`site/a11y.js`**: one self-contained file. Builds the button and panel, applies settings as classes and CSS custom properties on `<html>`, saves to `localStorage` inside `try/catch` (works without storage), listens for changes.
- **`styles.css`**: one clearly labelled block holding the `.a11y-*` classes and the panel styling, using existing design tokens.
- **Loading**: `<script src="a11y.js"></script>` in the `<head>` of every page, not deferred, so saved settings apply before first paint and avoid a flash of the default style. The file is small. CSP already allows `script-src 'self'`; no inline script.
- **`enhancements.js`**: reads the Pause Animations state and skips parallax when set.
- **Pages**: `index`, the six `work/` pages, `codex`, `404`, `thanks` (paths adjusted for `work/`).
- **Restore path when hidden**: a footer link "Accessibility settings" on every page always reopens the menu, so hiding the button is never a dead end.
- **Dyslexia font**: OpenDyslexic, SIL OFL licence, self-hosted as one `.woff2` in `assets/fonts/` with its licence file beside it.

### Accessibility of the menu itself

- Button and tiles are real `<button>` elements, at least 44px, with `aria-pressed` on toggles and the current step announced.
- Panel is `role="dialog"` with a label, traps focus while open, closes on Esc or the close button, and returns focus to the button.
- Visible focus ring in the brand red.
- The panel works at 375px with no horizontal scroll.

### Error handling

- No `localStorage`: the menu still works for the session.
- A corrupt saved value is ignored and reset.
- If the script fails to load, the site is unaffected.

## Testing

No test framework exists in the repo, so verification is by browser:

1. `node check-assets.mjs` reports 0 missing, including the new font files.
2. In the browser pane at desktop and 375px: toggle each tile, check the effect, reload, confirm persistence, press Reset.
3. Keyboard only: open, tab through tiles, toggle with Enter and Space, Esc closes, focus returns.
4. Hide the button, confirm the footer link restores it.
5. Console shows no CSP errors on every page type.
6. Confirm titles and body render in Gotham Black and Helvetica Neue (computed font, `document.fonts.check`).
7. Confirm Pause Animations stops parallax and video, and Hide Images leaves layout usable.

## Risks

- Font licence scope (see Part 1).
- Blocking script in `<head>` adds a small request on every page. Mitigated by keeping the file small and cacheable.
- Class-based overrides may clash with existing high-specificity rules; fix as found during testing, not with `!important` sprawl.

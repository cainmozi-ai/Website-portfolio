# Figma design system

**File:** https://www.figma.com/design/Li1G2mOx4BKQvwYJP0t68N

A full Figma reconstruction of this site, built from the live pages rather than redrawn
by eye. Every colour, spacing value and text style was measured off the running site at
1440px and 375px.

## What is in it

| Page group | Contents |
|---|---|
| Foundations | Colour (9 swatches), Typography (37 styles), Spacing & Layout |
| Components | 18 components across Navigation, Buttons & Links, Form, Project Card, Case Study Blocks, Structure |
| Screens | All 10 pages at 1440 desktop and 375 mobile — 20 frames |

3 variable collections, 40 variables, 37 text styles, 1 effect style.

## The round trip

Semantic variables carry their real CSS custom-property name in Figma's Code Syntax
field — select a swatch and Figma shows `var(--color-accent)`, `var(--space-md)` and so
on. That is what makes a change in Figma mappable back to `site/styles.css`.

To hand changes back to Claude: send the file URL and say what you changed.

- **Token change** (a colour, a spacing step) maps directly to `:root` in `styles.css`.
- **Component change** maps to the matching CSS block — the component names follow the
  class names (`Project Card` → `.project-card`, `Process Stage` → `.cs-process-stage`).
- **Layout change** — name the frame (e.g. "Home / Desktop, the showreel section") and
  describe what should be different.

## Known gaps (deliberate)

- **No dark mode.** The site has none, so the Color collection has a single mode.
  Adding one in Figma would create tokens with nothing to map back to.
- **Two tokens have no CSS variable.** `radius/sm` (2px) and `brandmark` (#913133) are
  hardcoded literals in the stylesheet, so their Code Syntax shows the literal value.
- **Resting state only.** Scroll reveals, hover states, the lightbox and lazy-loading
  are code-only behaviours and are not represented.
- **IN PROGRESS blocks are real.** They mark the 11 case-study slots that still have no
  artwork — see `ASSETS-TODO.md`.

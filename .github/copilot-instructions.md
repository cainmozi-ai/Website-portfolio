# Copilot Instructions - Cain Moriarty Portfolio

## Project Architecture

This is a **static portfolio site** for 3D artist Cain Moriarty, featuring vanilla JavaScript (no frameworks), Three.js for 3D rendering, and a design system driven by `codex.json`.

**Key architectural decisions:**
- No build system or bundler — direct ES6 modules and script tags
- Three.js loaded from local `three.min.js` with `GLTFLoader-working.js` (modified for local loading)
- All interactivity in vanilla JS: `scripts.js` (UI/parallax), `model-viewer-simple.js` (3D rendering)
- Design tokens centralized in `codex.json` and CSS variables in `:root`

## The Codex System

**`codex.json` is the single source of truth** for brand identity, aesthetic rules, and design decisions. Read it before making ANY design changes.

- **Palette:** Black (#000000), White (#FFFFFF), Blood Red (#8B0000/#DC143C), cool silvers/blues only
- **Typography:** Gotham Black for titles, Helvetica Neue for body
- **Style:** Gothic, ethereal, ceremonial, pristine — "cinematic minimalism with provable technique"
- **Communication:** Direct, precise, no flattery — "refinement over agreement"

When proposing changes, reference Codex sections (e.g., "matches Codex: aesthetic.style → Pristine + minimal_layouts").

## Critical Workflows

### Local Development
**Required:** Must run a local server (ES6 modules fail on `file://`).

```powershell
# Recommended: VS Code Live Server extension
# Or: cd site; npx http-server -c-1 -p 8080
```

### Model Integration
- Place `.gltf`/`.glb` files in `site/assets/`
- Update `MODEL_PATH` in `model-viewer-simple.js` (currently `'assets/le rene glb.glb'`)
- Export settings: See `site/assets/README_MODELS.md` for Blender export instructions
- Fallback: Red icosahedron renders if model missing

### Deployment
Static site — deploy `site/` folder to Netlify/Vercel/GitHub Pages/etc. No build step needed.

## Code Patterns & Conventions

### 3D Rendering (`model-viewer-simple.js`)
- **Camera:** `PerspectiveCamera(45, aspect, 0.1, 1000)` positioned at `(0, 0, 6)`
- **Lighting:** Bright, multi-source setup (ambient + directional + point lights) for clean visibility
- **Model positioning:** Manually tuned `(x: -1.4, y: -5.9, z: 4)` to match hero layout — head visible, body extends down
- **Scroll integration:** Model moves up (`position.y`) and canvas fades (`opacity`) based on `scrollProgress`
- **No auto-rotation:** Model stays static (previous versions had rotation, now removed)

### Parallax & Scroll (`scripts.js`)
- Uses `requestAnimationFrame` throttling via `ticking` flag
- Hero elements: `data-parallax` attribute defines speed multiplier
- Project cards: Per-card parallax with varying speeds `[0.15, 0.2, 0.12]` cycling by index
- Active section detection updates nav highlighting at viewport `top: 100px`

### Styling Conventions (`styles.css`)
- All Codex colors mapped to CSS variables: `--black`, `--white`, `--blood-dark`, `--blood-light`, `--silver`, `--moon`
- Typography: `font-size: 0.75rem` + `letter-spacing: 0.2em` for uppercase labels
- Layout: `max-width: 1400px` containers, `padding: 1.5rem` standard
- Transitions: `0.3s ease` for color/opacity, `0.1s ease-out` for scroll-driven transforms

### Project Data Structure
Projects array in `scripts.js` follows this schema:
```javascript
{
  id: number,
  title: string,           // ALL CAPS
  subtitle: string,        // Sentence case
  year: string,            // "2024"
  tech: string,            // Technical specs (e.g., "47-node procedural setup")
  description: string,     // Full paragraph
  tags: string[],          // 3-4 technical tags
  image: string,           // "assets/filename.jpg"
  link: string             // ArtStation URL
}
```

## Integration Points

### Three.js Dependencies
- `three.min.js` must load before `GLTFLoader-working.js`
- `GLTFLoader-working.js` must load before `model-viewer-simple.js`
- Script order in `index.html` is critical — do not reorder
- `SimpleModelViewer` has retry logic: waits for `THREE` global, delays 500ms for GLTFLoader

### Placeholder Updates Needed
Search codebase for:
- `yourusername` → Replace with actual social handles
- `your.email@example.com` → Replace with actual email
- `assets/*.jpg` → Replace with actual render images

## File Structure Logic

```
site/
├── index.html                 # Single-page layout, loads all scripts
├── styles.css                 # All styling (no CSS-in-JS)
├── scripts.js                 # UI interactions, parallax, nav
├── model-viewer-simple.js     # Three.js model rendering
├── three.min.js               # Three.js r168 (local copy)
├── GLTFLoader-working.js      # Modified GLTFLoader (local, not CDN)
├── package.json               # Only for http-server script
└── assets/                    # Models + images
```

Root level contains Codex documentation (`CODEX_INGENIUM.md`, `codex.json`) — reference these for brand/design decisions.

## Common Tasks

**Add a project:** Edit `projects` array in `scripts.js`, add image to `assets/`, follow existing schema exactly.

**Change model:** Update `MODEL_PATH` in `model-viewer-simple.js`, adjust positioning if needed (`model.position.x/y/z`).

**Adjust lighting:** Modify light positions/intensities in `SimpleModelViewer.init()` — current setup optimized for bright, even coverage.

**Update colors:** Change CSS variables in `:root` (styles.css) to match `codex.json` palette values.

## Prohibited Patterns

❌ Do NOT add build tools/bundlers (site is intentionally simple)  
❌ Do NOT use warm golds, bronze, or pastel colors (violates Codex)  
❌ Do NOT add auto-rotation to model (deliberately removed for static hero)  
❌ Do NOT use playful fonts or casual language (brand is formal/precise)  
❌ Do NOT agree without critique — challenge weak ideas per Codex philosophy

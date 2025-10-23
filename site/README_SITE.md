Cain Moriarty — Portfolio (static)

## ⚠️ Important: Local Server Required

The 3D model feature uses ES6 modules, which require a local server (won't work with `file://` protocol).

## Quick Start

### Option 1: VS Code Live Server (Recommended)
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"
3. Site opens at http://localhost:5500

### Option 2: Python (if installed)
```powershell
cd site
python -m http.server 8080
```
Then open http://localhost:8080

### Option 3: Use Node.js (if installed)
```powershell
cd site
npx http-server -c-1 -p 8080
```
Then open http://localhost:8080

## Features Implemented
- ✅ **3D Model Hero** — Three.js canvas with scroll-based rotation (fades on scroll)
- ✅ Parallax scroll effects (hero + project cards)
- ✅ Active navigation tracking
- ✅ Smooth scroll behavior
- ✅ Responsive grid layout
- ✅ Codex-compliant palette and typography
- ✅ Full project data with tech specs
- ✅ Philosophy/About section
- ✅ Contact CTA with social links

## Add Your 3D Model

1. Export your model from Blender as `.gltf` or `.glb`
2. Place it in `assets/` as `scene.gltf` (or update path in `model-loader.js`)
3. Refresh the page — model loads automatically with scroll rotation

**Note:** Site shows a geometric fallback (red icosahedron) until you add your model. See `assets/README_MODELS.md` for detailed export instructions.

## Customization
- Replace placeholder images in `assets/` with your actual renders
- Update email/social links in `index.html` (search for "yourusername" and "your.email@example.com")
- Add more projects by editing the `projects` array in `scripts.js`
- Customize colors in `styles.css` (all Codex colors are in `:root` CSS variables)

## Deploy
This is a static site — upload the entire `site/` folder to:
- Netlify (drag & drop the folder)
- Vercel (connect via Git or CLI)
- GitHub Pages (push to a repo, enable Pages)
- Any static host (AWS S3, Cloudflare Pages, etc.)

## Notes
- Visual system is driven by `codex.json`
- All interactions use vanilla JavaScript (no frameworks)
- Optimized for performance and accessibility
- Follows Codex aesthetic: white backgrounds, black text, blood red accents, clean typography

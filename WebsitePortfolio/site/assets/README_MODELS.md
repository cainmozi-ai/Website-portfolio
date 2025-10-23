# 3D Model Setup

## Quick Start

1. Export your model from Blender as `.gltf` or `.glb`
2. Place the file in this folder as `scene.gltf` (or `scene.glb`)
3. Refresh the website — the model will load automatically

## If You Don't Have a Model Yet

The site will display a beautiful geometric fallback (red icosahedron) until you add your model.

## Model Requirements

- **Format**: `.gltf` or `.glb` (GLTF is recommended)
- **File size**: Under 10MB for web performance (optimize in Blender)
- **Scale**: The loader applies 2.5x scale — adjust in `model-loader.js` if needed
- **Origin**: Model should be centered at origin (0,0,0)

## Export from Blender

1. Select your model
2. File → Export → glTF 2.0
3. Settings:
   - Format: glTF Separate or glTF Binary
   - Include: Selected Objects
   - Transform: +Y Up
   - Geometry: Apply Modifiers, UVs, Normals
   - Compression: Draco (optional, reduces file size)
4. Export as `scene.gltf` to this folder

## Customization

Edit `model-loader.js` to customize:
- `MODEL_PATH` — change model filename
- `AUTO_ROTATE_SPEED` — rotation speed
- Scale, position, lighting

## Troubleshooting

If the model doesn't appear:
- Check browser console for errors (F12)
- Verify file path matches `MODEL_PATH` in `model-loader.js`
- Ensure textures are embedded or in same folder
- Try `.glb` format (single file, easier)

/**
 * Image Optimization Script
 *
 * Generates responsive WebP + fallback variants (400/800/1200/1600w) for every
 * photo and render under site/assets, and compresses the original in place.
 *
 * Notes:
 *  - Derivative files (`*-800w.jpg`) are skipped, so re-running never produces
 *    `foo-800w-800w.jpg`.
 *  - Opaque PNGs are 3D renders and photographs, not graphics with transparency.
 *    PNG compresses them terribly (2MB is typical here), so their derivatives are
 *    emitted as JPEG. PNGs that actually use their alpha channel stay PNG.
 *  - Idempotent: a source whose derivatives already exist and are newer is
 *    skipped. Pass --force to rebuild everything.
 *
 * Run from the repo root:  node optimize-images.mjs [--force]
 */

import sharp from 'sharp';
import { readdir, stat, unlink, rename } from 'fs/promises';
import { join, extname, relative } from 'path';

const SITE_ASSETS = 'site/assets';
const MAX_WIDTH = 1600;
const RESPONSIVE_WIDTHS = [400, 800, 1200, 1600];
const JPEG_QUALITY = 80;
const WEBP_QUALITY = 78;

// Below this, an image is a logo or icon: compress it, don't generate srcset sizes.
const SMALL_IMAGE_THRESHOLD = 200 * 1024;

const FORCE = process.argv.includes('--force');
const DERIVATIVE = /-\d+w\.(jpe?g|png|webp)$/i;

async function getAllImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.name === 'fonts') continue;
    if (entry.isDirectory()) {
      files.push(...await getAllImages(fullPath));
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name) && !DERIVATIVE.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

const exists = (p) => stat(p).then(() => true, () => false);

function formatSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

/**
 * sharp's `isOpaque` is false for a single anti-aliased edge pixel, which was
 * keeping 1.6MB PNG derivatives for renders that are 99.9% opaque. Only treat
 * the alpha channel as load-bearing if a real share of the image uses it.
 */
const ALPHA_PIXEL_THRESHOLD = 0.005;   // 0.5% of pixels

async function hasMeaningfulAlpha(filePath) {
  if ((await sharp(filePath).stats()).isOpaque) return false;
  const { data, info } = await sharp(filePath).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  let translucent = 0, total = 0;
  for (let i = 3; i < data.length; i += info.channels) {
    total++;
    if (data[i] < 250) translucent++;
  }
  return translucent / total > ALPHA_PIXEL_THRESHOLD;
}

async function optimizeImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  const originalSize = (await stat(filePath)).size;
  const metadata = await sharp(filePath).metadata();
  const base = filePath.replace(/\.(jpg|jpeg|png)$/i, '');

  // An opaque PNG is a render or a photo — ship it as JPEG.
  const usesAlpha = ext === '.png' && await hasMeaningfulAlpha(filePath);
  const fallbackExt = usesAlpha ? 'png' : 'jpg';

  const isSmall = originalSize < SMALL_IMAGE_THRESHOLD;
  const widths = isSmall ? [] : (() => {
    const w = RESPONSIVE_WIDTHS.filter((x) => x <= metadata.width);
    if (metadata.width < MAX_WIDTH && !w.includes(metadata.width)) w.push(metadata.width);
    return w;
  })();

  const largest = widths.length ? Math.max(...widths) : null;
  if (!FORCE) {
    const sentinel = largest ? `${base}-${largest}w.webp` : `${base}.webp`;
    if (await exists(sentinel)) {
      const s = await stat(sentinel);
      if (s.mtimeMs >= (await stat(filePath)).mtimeMs) return null;
    }
  }

  const encode = (pipeline, out) =>
    out.endsWith('.webp') ? pipeline.webp({ quality: WEBP_QUALITY }).toFile(out)
      : out.endsWith('.png') ? pipeline.png({ compressionLevel: 9 }).toFile(out)
        : pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(out);

  for (const w of widths) {
    const src = sharp(filePath).resize(w, null, { withoutEnlargement: true });
    await encode(src.clone(), `${base}-${w}w.webp`);
    await encode(src.clone(), `${base}-${w}w.${fallbackExt}`);
    // A previous run may have written a PNG derivative where we now emit JPEG.
    if (fallbackExt === 'jpg' && await exists(`${base}-${w}w.png`)) await unlink(`${base}-${w}w.png`);
  }

  // Compress the original in place and emit a full-size WebP beside it.
  const capped = sharp(filePath).resize(MAX_WIDTH, null, { withoutEnlargement: true });
  await encode(capped.clone(), `${base}.webp`);
  await encode(capped.clone(), filePath + '.tmp' + ext);
  await rename(filePath + '.tmp' + ext, filePath);

  const newSize = (await stat(filePath)).size;
  const suffix = widths.length ? ` (+${widths.length} sizes, ${fallbackExt}/webp)` : ' (+webp)';
  return `  ${relative(SITE_ASSETS, filePath)}: ${formatSize(originalSize)} → ${formatSize(newSize)}${suffix}`;
}

async function main() {
  const images = await getAllImages(SITE_ASSETS);
  console.log(`Found ${images.length} source images${FORCE ? ' (--force)' : ''}\n`);

  let totalOriginal = 0, totalNew = 0, done = 0, skipped = 0;
  for (const img of images) {
    const before = (await stat(img)).size;
    try {
      const result = await optimizeImage(img);
      if (result === null) { skipped++; continue; }
      console.log(result);
      totalOriginal += before;
      totalNew += (await stat(img)).size;
      done++;
    } catch (err) {
      console.error(`  ERROR: ${img}: ${err.message}`);
    }
  }

  console.log(`\nProcessed ${done}, skipped ${skipped} (already current).`);
  console.log(`Originals: ${formatSize(totalOriginal)} → ${formatSize(totalNew)}`);
}

main();

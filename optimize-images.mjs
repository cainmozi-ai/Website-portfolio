/**
 * Image Optimization Script
 * Compresses all JPG/PNG images, generates WebP variants, and creates
 * responsive sizes (400w, 800w, 1200w, 1600w) for gallery/hero images.
 * Small images (logos, icons) are only compressed, not resized.
 */

import sharp from 'sharp';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, extname, basename, dirname, relative } from 'path';

const SITE_ASSETS = 'site/assets';
const MAX_WIDTH = 1600;
const RESPONSIVE_WIDTHS = [400, 800, 1200, 1600];
const JPEG_QUALITY = 80;
const WEBP_QUALITY = 78;
const PNG_QUALITY = 80;

// Images that should get responsive srcset variants (hero/gallery images)
// Small images like logos are just compressed at original size
const SMALL_IMAGE_THRESHOLD = 200 * 1024; // 200KB — below this, just compress

async function getAllImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.name === 'fonts') continue; // skip fonts directory
    if (entry.isDirectory()) {
      files.push(...await getAllImages(fullPath));
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function optimizeImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  const fileStats = await stat(filePath);
  const originalSize = fileStats.size;
  const img = sharp(filePath);
  const metadata = await img.metadata();

  const isSmall = originalSize < SMALL_IMAGE_THRESHOLD;
  const results = [];

  if (isSmall) {
    // Just compress in place + generate WebP
    let pipeline = sharp(filePath);
    if (metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
    }

    if (ext === '.png') {
      await pipeline.clone().png({ quality: PNG_QUALITY, effort: 7 }).toFile(filePath + '.tmp');
      await pipeline.clone().webp({ quality: WEBP_QUALITY }).toFile(filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    } else {
      await pipeline.clone().jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(filePath + '.tmp');
      await pipeline.clone().webp({ quality: WEBP_QUALITY }).toFile(filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    }

    // Replace original with compressed version
    const { rename } = await import('fs/promises');
    await rename(filePath + '.tmp', filePath);
    const newStats = await stat(filePath);
    results.push(`  ${relative(SITE_ASSETS, filePath)}: ${formatSize(originalSize)} → ${formatSize(newStats.size)}`);
  } else {
    // Generate responsive sizes
    const widths = RESPONSIVE_WIDTHS.filter(w => w <= metadata.width);
    if (!widths.includes(metadata.width) && metadata.width < MAX_WIDTH) {
      widths.push(metadata.width);
    }

    const baseName = filePath.replace(/\.(jpg|jpeg|png)$/i, '');
    const isJpeg = ext !== '.png';

    for (const w of widths) {
      const suffix = `-${w}w`;
      const pipeline = sharp(filePath).resize(w, null, { withoutEnlargement: true });

      if (isJpeg) {
        await pipeline.clone().jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(`${baseName}${suffix}.jpg`);
        await pipeline.clone().webp({ quality: WEBP_QUALITY }).toFile(`${baseName}${suffix}.webp`);
      } else {
        await pipeline.clone().png({ quality: PNG_QUALITY, effort: 7 }).toFile(`${baseName}${suffix}.png`);
        await pipeline.clone().webp({ quality: WEBP_QUALITY }).toFile(`${baseName}${suffix}.webp`);
      }
    }

    // Also compress the original (overwrite) and make a WebP of it at max width
    let compressPipeline = sharp(filePath).resize(MAX_WIDTH, null, { withoutEnlargement: true });
    if (isJpeg) {
      await compressPipeline.clone().jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(filePath + '.tmp');
      await compressPipeline.clone().webp({ quality: WEBP_QUALITY }).toFile(filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    } else {
      await compressPipeline.clone().png({ quality: PNG_QUALITY, effort: 7 }).toFile(filePath + '.tmp');
      await compressPipeline.clone().webp({ quality: WEBP_QUALITY }).toFile(filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    }

    const { rename } = await import('fs/promises');
    await rename(filePath + '.tmp', filePath);
    const newStats = await stat(filePath);
    results.push(`  ${relative(SITE_ASSETS, filePath)}: ${formatSize(originalSize)} → ${formatSize(newStats.size)} (+ ${widths.length} responsive sizes + WebP)`);
  }

  return results;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

async function main() {
  console.log('Scanning for images...');
  const images = await getAllImages(SITE_ASSETS);
  console.log(`Found ${images.length} images\n`);

  let totalOriginal = 0;
  let totalNew = 0;

  for (const img of images) {
    const before = (await stat(img)).size;
    totalOriginal += before;
    try {
      const results = await optimizeImage(img);
      results.forEach(r => console.log(r));
      const after = (await stat(img)).size;
      totalNew += after;
    } catch (err) {
      console.error(`  ERROR: ${img}: ${err.message}`);
    }
  }

  console.log(`\nTotal: ${formatSize(totalOriginal)} → ${formatSize(totalNew)} (originals only, excludes responsive/WebP variants)`);
  console.log('Done!');
}

main();

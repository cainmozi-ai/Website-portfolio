/**
 * Favicon / App Icon Generator
 *
 * The original favicon.svg was a 1424x1484 JPEG wrapped in an <svg><image> tag
 * (230KB for a 32px icon, duplicated three times in the repo). The brandmark is
 * pure straight lines, so it is defined here as a real vector path traced from
 * that raster, and every icon size is rendered from it.
 *
 * Run from the repo root:  node generate-icons.mjs
 */

import { writeFile } from 'fs/promises';
import sharp from 'sharp';

const SITE = 'site';
const INK = '#913133';        // brandmark red, sampled from the original artwork
const BG = '#FFFFFF';         // --color-bg
const THEME = '#880808';      // --color-accent

// One stroke of the triple-stroke M: bbox 262x742, vertical bar spans x=78..174.
const STROKE = 'M75 0 L174 72 L174 594 L262 662 L175 741 L78 662 L78 140 L0 84 Z';
const PITCH = 259.5;          // horizontal distance between strokes

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 782 742" fill="${INK}">
<path d="${STROKE}"/>
<path d="${STROKE}" transform="translate(${PITCH} 0)"/>
<path d="${STROKE}" transform="translate(${PITCH * 2} 0)"/>
</svg>`;

/**
 * Square icon: the mark centred on `bg` with `padRatio` of breathing room.
 * `bg: null` keeps the background transparent.
 */
function square(size, padRatio, bg) {
  const inner = Math.round(size * (1 - padRatio * 2));
  const w = inner;
  const h = Math.round((742 / 782) * inner);
  const x = Math.round((size - w) / 2);
  const y = Math.round((size - h) / 2);
  const fill = bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${fill}<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 782 742" fill="${INK}"><path d="${STROKE}"/><path d="${STROKE}" transform="translate(${PITCH} 0)"/><path d="${STROKE}" transform="translate(${PITCH * 2} 0)"/></svg></svg>`;
}

// Scalable icon keeps a transparent ground so it adapts to browser chrome.
await writeFile(`${SITE}/favicon.svg`, square(32, 0.06, null) + '\n');

await Promise.all([
  sharp(Buffer.from(square(32, 0.06, null))).png({ compressionLevel: 9 }).toFile(`${SITE}/favicon-32x32.png`),
  sharp(Buffer.from(square(16, 0.03, null))).png({ compressionLevel: 9 }).toFile(`${SITE}/favicon-16x16.png`),
  // iOS masks the corners and ignores transparency — needs an opaque ground.
  sharp(Buffer.from(square(180, 0.16, BG))).png({ compressionLevel: 9 }).toFile(`${SITE}/apple-touch-icon.png`),
  sharp(Buffer.from(square(192, 0.12, BG))).png({ compressionLevel: 9 }).toFile(`${SITE}/icon-192.png`),
  sharp(Buffer.from(square(512, 0.12, BG))).png({ compressionLevel: 9 }).toFile(`${SITE}/icon-512.png`),
  // Maskable variant: extra padding so Android's safe zone never clips the mark.
  sharp(Buffer.from(square(512, 0.22, BG))).png({ compressionLevel: 9 }).toFile(`${SITE}/icon-512-maskable.png`),
]);

await writeFile(`${SITE}/site.webmanifest`, JSON.stringify({
  name: 'The Moriarty Experience',
  short_name: 'Moriarty',
  description: 'Portfolio of Cain Moriarty — 3D artist and visual storyteller.',
  start_url: '/',
  display: 'standalone',
  background_color: BG,
  theme_color: THEME,
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2) + '\n');

console.log('Icons written to site/');

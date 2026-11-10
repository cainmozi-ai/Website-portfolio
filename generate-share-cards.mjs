/**
 * Open Graph / Twitter share cards.
 *
 * Link previews want a 1200x630 image. Pointing og:image at a page's hero asset
 * meant shipping multi-megabyte PNGs (or, for N.O.R.A, a 6KB thumbnail) to every
 * scraper, at whatever aspect ratio the render happened to be. This crops one
 * properly sized card per page, at a hyphenated path scrapers handle reliably.
 *
 * Run from the repo root:  node generate-share-cards.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'fs/promises';

const OUT = 'site/assets/share';
const A = 'site/assets';

const CARDS = [
  ['home',                 `${A}/Midnight/frame-street.png`],
  ['balance-brewing',      `${A}/Balance/mockup.jpg`],
  ['byodoin-phoenix-hall', `${A}/Byodo-in/final-render.png`],
  ['costa-rebrand',        `${A}/Costa/part 50194.png`],
  ['medieval-armour',      `${A}/Medieval/sallet front.png`],
  ['midnight-run',         `${A}/Midnight/render car.png`],
  ['nora',                 `${A}/N.O.R.A/20260129_163504_011.jpg`],
];

await mkdir(OUT, { recursive: true });

for (const [slug, src] of CARDS) {
  const out = `${OUT}/${slug}.jpg`;
  await sharp(src)
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .flatten({ background: '#FFFFFF' })          // scrapers do not honour alpha
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  const { size } = await (await import('fs/promises')).stat(out);
  console.log(`  ${out}  ${Math.round(size / 1024)}KB`);
}
console.log('Done.');

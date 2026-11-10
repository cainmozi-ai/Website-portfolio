/**
 * Converts desktop fonts (.otf/.ttf) to .woff2 for the site.
 *
 * Usage (pairs of input and output):
 *   node convert-fonts.mjs <in.otf> <out.woff2> [<in2.otf> <out2.woff2> ...]
 *
 * Example:
 *   node convert-fonts.mjs Gotham-Black.otf site/assets/fonts/gotham-black.woff2
 */
import { readFile, writeFile } from 'node:fs/promises';
import wawoff2 from 'wawoff2';

const args = process.argv.slice(2);
if (args.length === 0 || args.length % 2 !== 0) {
  console.error('Usage: node convert-fonts.mjs <in> <out> [<in> <out> ...]');
  process.exit(1);
}

for (let i = 0; i < args.length; i += 2) {
  const [src, dest] = [args[i], args[i + 1]];
  const out = await wawoff2.compress(await readFile(src));
  await writeFile(dest, out);
  console.log(`${dest}  ${Math.round(out.length / 1024)}KB`);
}

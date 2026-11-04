/**
 * Verifies every local asset referenced by the site actually exists.
 * Checks src, srcset, poster, href and CSS url() across all HTML + CSS.
 * Run from the repo root:  node check-assets.mjs
 */
import { readFile, readdir, stat } from 'fs/promises';
import { join, dirname, normalize, resolve } from 'path';

const SITE = resolve('site');
const pages = [];
async function walk(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'assets' && e.name !== 'node_modules') await walk(p); }
    else if (/\.(html|css)$/i.test(e.name)) pages.push(p);
  }
}
await walk(SITE);

const exists = (p) => stat(p).then(() => true, () => false);
let missing = 0, checked = 0;

for (const page of pages) {
  const text = await readFile(page, 'utf8');
  const refs = new Set();
  for (const m of text.matchAll(/(?:src|href|poster)="([^"]+)"/g)) refs.add(m[1]);
  for (const m of text.matchAll(/srcset="([^"]+)"/g))
    for (const part of m[1].split(',')) refs.add(part.trim().split(/\s+/)[0]);
  for (const m of text.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)) refs.add(m[2]);

  for (const raw of refs) {
    if (!raw || /^(https?:|data:|mailto:|tel:|#|%23|\/\/)/i.test(raw)) continue;
    const clean = decodeURIComponent(raw.split(/[?#]/)[0]);
    if (!clean) continue;
    const base = clean.startsWith('/') ? SITE : dirname(page);
    const target = normalize(join(base, clean.replace(/^\//, '')));
    checked++;
    if (!await exists(target)) {
      console.log(`MISSING  ${page.slice(SITE.length + 1)}  ->  ${clean}`);
      missing++;
    }
  }
}
console.log(`\nChecked ${checked} local references across ${pages.length} files. Missing: ${missing}`);
process.exit(missing ? 1 : 0);

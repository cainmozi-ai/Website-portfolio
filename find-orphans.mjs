/**
 * Lists files under site/assets that nothing in the site references.
 * Run from the repo root:  node find-orphans.mjs
 */
import { readFile, readdir, stat } from 'fs/promises';
import { join, dirname, normalize, resolve, relative } from 'path';

const SITE = resolve('site');
const BS = String.fromCharCode(92);
const norm = (s) => s.split(BS).join('/');

async function walk(dir, pred, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, pred, out);
    else if (pred(e.name)) out.push(p);
  }
  return out;
}

const pages = await walk(SITE, (n) => /\.(html|css|js|json|webmanifest|xml)$/i.test(n))
  .then((all) => all.filter((p) => !norm(p).includes('/assets/')));

const used = new Set();
for (const page of pages) {
  const text = await readFile(page, 'utf8');
  const refs = new Set();
  for (const m of text.matchAll(/(?:src|data-src|href|poster|content)="([^"]+)"/g)) refs.add(m[1]);
  for (const m of text.matchAll(/srcset="([^"]+)"/g))
    for (const part of m[1].split(',')) refs.add(part.trim().split(/\s+/)[0]);
  for (const m of text.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)) refs.add(m[2]);
  for (const m of text.matchAll(/["'](\.{0,2}\/?[\w /().-]+\.(?:jpe?g|png|webp|svg|mp4|webm|mkv|woff2?|pdf|obj))["']/gi)) refs.add(m[1]);

  for (let raw of refs) {
    if (!raw || /^(data:|mailto:|tel:|#|%23)/i.test(raw)) continue;
    raw = raw.replace(/^https?:\/\/themoriartyexperience\.com/i, '/');
    if (/^https?:/i.test(raw)) continue;
    const clean = decodeURIComponent(raw.split(/[?#]/)[0]);
    if (!clean) continue;
    const base = clean.startsWith('/') ? SITE : dirname(page);
    used.add(norm(normalize(join(base, clean.replace(/^\//, '')))));
  }
}

const assets = await walk(join(SITE, 'assets'), () => true);
let bytes = 0;
const orphans = [];
for (const a of assets) {
  if (used.has(norm(a))) continue;
  const s = await stat(a);
  bytes += s.size;
  orphans.push([s.size, relative(SITE, a)]);
}
orphans.sort((x, y) => y[0] - x[0]);
for (const [size, p] of orphans) console.log(`${(size / 1048576).toFixed(2).padStart(8)}MB  ${norm(p)}`);
console.log(`\n${orphans.length} unreferenced files, ${(bytes / 1048576).toFixed(1)}MB total`);

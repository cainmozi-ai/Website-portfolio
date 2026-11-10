import { spawn } from 'node:child_process';
import net from 'node:net';

let proc = null;

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
    s.on('error', reject);
  });
}

async function waitFor(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server did not start: ' + url);
}

/** Starts http-server for ./site on a free port; returns the base URL. */
export async function startServer() {
  const port = await freePort();
  proc = spawn(process.execPath, ['node_modules/http-server/bin/http-server', 'site', '-c-1', '-p', String(port), '-a', '127.0.0.1'], { stdio: 'ignore' });
  const base = `http://127.0.0.1:${port}`;
  await waitFor(base + '/index.html');
  return base;
}

export async function stopServer() {
  if (proc) { proc.kill(); proc = null; }
}

/** Opens `path` (e.g. '/index.html') in a fresh page and waits for load. */
export async function newPage(browser, base, path, contextOptions = {}) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await page.goto(base + path, { waitUntil: 'load' });
  return page;
}

/**
 * Launches a Chromium-family browser. Tries Playwright's bundled build, then the
 * Edge and Chrome already installed on the machine, so tests run with no download.
 */
export async function launchBrowser() {
  const { chromium } = await import('playwright');
  let first;
  for (const opts of [{}, { channel: 'msedge' }, { channel: 'chrome' }]) {
    try { return await chromium.launch(opts); } catch (err) { first ??= err; }
  }
  throw first;
}

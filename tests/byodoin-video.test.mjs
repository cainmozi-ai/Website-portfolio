import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, stopServer, newPage, launchBrowser } from './helpers.mjs';

let base, browser;
before(async () => { base = await startServer(); browser = await launchBrowser(); });
after(async () => { await browser.close(); await stopServer(); });

test('Byodo-in page has the VR video with real sources and a poster', async () => {
  const page = await newPage(browser, base, '/work/byodoin-phoenix-hall.html');
  const v = await page.evaluate(() => {
    const el = document.querySelector('video.project-video');
    if (!el) return null;
    return {
      sources: [...el.querySelectorAll('source')].map((s) => ({ src: s.getAttribute('data-src') || s.getAttribute('src'), type: s.type })),
      poster: el.getAttribute('poster'),
      controls: el.hasAttribute('controls'),
      autoplay: el.hasAttribute('autoplay'),
      label: el.getAttribute('aria-label'),
      w: el.getAttribute('width'), h: el.getAttribute('height'),
    };
  });
  assert.ok(v, 'a video.project-video exists');
  assert.ok(v.controls, 'has controls (the clip has sound)');
  assert.equal(v.autoplay, false, 'does not autoplay with sound');
  assert.ok(v.label && /Byōdō-in/.test(v.label), 'has an aria-label naming the project');
  assert.ok(v.w && v.h, 'has width and height');
  const urls = [...v.sources.map((s) => s.src), v.poster];
  assert.equal(v.sources.length, 2);
  for (const u of urls) {
    const res = await page.request.get(new URL(u, base + '/work/byodoin-phoenix-hall.html').href);
    assert.equal(res.status(), 200, u);
  }
});

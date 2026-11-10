import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, stopServer, newPage, launchBrowser } from './helpers.mjs';

let base, browser;
before(async () => { base = await startServer(); browser = await launchBrowser(); });
after(async () => { await browser.close(); await stopServer(); });

test('showreel is the V4 cut (about 73s) and loads from the page', async () => {
  const page = await newPage(browser, base, '/index.html', { viewport: { width: 1280, height: 800 } });
  await page.evaluate(() => document.querySelector('.showreel-video').scrollIntoView({ block: 'center' }));
  await page.waitForFunction(() => document.querySelector('.showreel-video').readyState >= 1, null, { timeout: 20000 });
  const d = await page.evaluate(() => document.querySelector('.showreel-video').duration);
  assert.ok(d > 72 && d < 75, 'duration ' + d);
});

test('showreel copy and structured data match the new length', async () => {
  const page = await newPage(browser, base, '/index.html');
  const r = await page.evaluate(() => {
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)).find((j) => j['@type'] === 'VideoObject');
    return { caption: document.querySelector('.showreel-caption').textContent, ldDuration: ld.duration, ldDesc: ld.description };
  });
  assert.ok(!/sixty/i.test(r.caption), r.caption);
  assert.ok(!/sixty/i.test(r.ldDesc), r.ldDesc);
  assert.equal(r.ldDuration, 'PT1M13S');
});

test('every showreel source and the poster resolve', async () => {
  const page = await newPage(browser, base, '/index.html');
  const urls = await page.evaluate(() => {
    const v = document.querySelector('.showreel-video');
    return [v.getAttribute('poster'), ...[...v.querySelectorAll('source')].map((s) => s.getAttribute('data-src') || s.getAttribute('src'))];
  });
  for (const u of urls) {
    const res = await page.request.get(new URL(u, base + '/index.html').href);
    assert.equal(res.status(), 200, u);
  }
});

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, stopServer, newPage, launchBrowser } from './helpers.mjs';

let base, browser;
before(async () => { base = await startServer(); browser = await launchBrowser(); });
after(async () => { await browser.close(); await stopServer(); });

const set = (page, key, value) => page.evaluate(([k, v]) => window.TMEA11y.set(k, v), [key, value]);

test('pause collapses every animation and transition to near-zero', async () => {
  const page = await newPage(browser, base, '/index.html');
  await set(page, 'pause', 1);
  const worst = await page.evaluate(() => {
    const secs = (v) => Math.max(...v.split(',').map((x) => parseFloat(x) || 0));
    let a = 0, t = 0, iter = 1;
    for (const el of document.querySelectorAll('body, body *')) {
      const cs = getComputedStyle(el);
      a = Math.max(a, secs(cs.animationDuration));
      t = Math.max(t, secs(cs.transitionDuration));
      iter = Math.max(iter, ...cs.animationIterationCount.split(',').filter((x) => x.trim()).map((x) => (x.trim() === 'infinite' ? Infinity : parseFloat(x))));
    }
    return { a, t, iter };
  });
  assert.ok(worst.a <= 0.001, 'animation duration ' + worst.a);
  assert.ok(worst.t <= 0.001, 'transition duration ' + worst.t);
  assert.equal(worst.iter, 1);
});

test('pause pauses playing videos', async () => {
  const page = await newPage(browser, base, '/work/costa-rebrand.html');
  await page.evaluate(() => document.querySelector('video').scrollIntoView());
  await page.waitForFunction(() => [...document.querySelectorAll('video')].some((v) => !v.paused), null, { timeout: 8000 });
  await set(page, 'pause', 1);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('video')].every((v) => v.paused)), true);
});

test('pause starts on when the OS asks for reduced motion and nothing is saved', async () => {
  const page = await newPage(browser, base, '/work/nora.html', { reducedMotion: 'reduce' });
  assert.equal(await page.evaluate(() => window.TMEA11y.get().pause), 1);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('a11y-pause')), true);
});

test('a saved choice overrides the OS reduced-motion default', async () => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.addInitScript(() => { localStorage.setItem('tme-a11y', JSON.stringify({ pause: 0 })); });
  const page = await context.newPage();
  await page.goto(base + '/work/nora.html');
  assert.equal(await page.evaluate(() => window.TMEA11y.get().pause), 0);
});

test('hide images hides img and video but keeps text visible', async () => {
  const page = await newPage(browser, base, '/work/costa-rebrand.html');
  await set(page, 'images', 1);
  const r = await page.evaluate(() => {
    const hidden = (e) => { const c = getComputedStyle(e); return c.visibility === 'hidden' || c.display === 'none'; };
    const media = [...document.querySelectorAll('main img, main video, main canvas')];
    const p = document.querySelector('main p');
    return { media: media.length, shown: media.filter((e) => !hidden(e)).length, textShown: !hidden(p) && p.getBoundingClientRect().height > 0 };
  });
  assert.ok(r.media > 0);
  assert.equal(r.shown, 0, r.shown + ' of ' + r.media + ' media elements still visible');
  assert.equal(r.textShown, true);
});

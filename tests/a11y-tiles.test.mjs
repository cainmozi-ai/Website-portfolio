import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, stopServer, newPage, launchBrowser } from './helpers.mjs';

let base, browser;
before(async () => { base = await startServer(); browser = await launchBrowser(); });
after(async () => { await browser.close(); await stopServer(); });

const set = (page, key, value) => page.evaluate(([k, v]) => window.TMEA11y.set(k, v), [key, value]);
const css = (page, sel, prop) => page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel, prop]);

test('text steps scale the root font size', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  await set(page, 'text', 1);
  assert.equal(await css(page, 'html', 'fontSize'), '17.6px');
  await set(page, 'text', 3);
  assert.equal(await css(page, 'html', 'fontSize'), '24px');
});

test('line height steps are 1.5x, 1.75x and 2x', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  for (const [step, ratio] of [[1, 1.5], [2, 1.75], [3, 2]]) {
    await set(page, 'lineheight', step);
    const r = await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('main p'));
      return parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
    });
    assert.ok(Math.abs(r - ratio) < 0.01, `step ${step}: ${r} != ${ratio}`);
  }
});

test('spacing step 1 adds letter spacing', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  const before = parseFloat(await css(page, 'main p', 'letterSpacing')) || 0;
  await set(page, 'spacing', 1);
  const after = parseFloat(await css(page, 'main p', 'letterSpacing')) || 0;
  assert.ok(after > before, `letter spacing ${before} -> ${after}`);
});

test('align steps are left, centre, right', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  for (const [step, value] of [[1, 'left'], [2, 'center'], [3, 'right']]) {
    await set(page, 'align', step);
    assert.equal(await css(page, 'main p', 'textAlign'), value);
  }
});

test('links setting underlines links that are plain by default', async () => {
  const page = await newPage(browser, base, '/index.html');
  assert.ok(!(await css(page, '.project-cta', 'textDecorationLine')).includes('underline'));
  await set(page, 'links', 1);
  assert.ok((await css(page, '.project-cta', 'textDecorationLine')).includes('underline'));
});

test('saturation steps apply low, high and greyscale filters', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  await set(page, 'saturation', 1);
  assert.match(await css(page, 'html', 'filter'), /saturate\(0\.5\)/);
  await set(page, 'saturation', 2);
  assert.match(await css(page, 'html', 'filter'), /saturate\(2\)/);
  await set(page, 'saturation', 3);
  assert.match(await css(page, 'html', 'filter'), /grayscale/);
});

test('contrast steps: invert, light, dark', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  await set(page, 'contrast', 1);
  assert.match(await css(page, 'html', 'filter'), /invert/);
  await set(page, 'contrast', 2);
  assert.equal(await css(page, 'body', 'backgroundColor'), 'rgb(255, 255, 255)');
  assert.equal(await css(page, 'main p', 'color'), 'rgb(0, 0, 0)');
  await set(page, 'contrast', 3);
  assert.equal(await css(page, 'body', 'backgroundColor'), 'rgb(0, 0, 0)');
  assert.equal(await css(page, 'main p', 'color'), 'rgb(255, 255, 255)');
});

test('each stepped key wraps back to off after its last step', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  const keys = { contrast: 3, text: 3, spacing: 3, lineheight: 3, align: 3, saturation: 3, links: 1 };
  for (const [key, max] of Object.entries(keys)) {
    for (let i = 0; i < max; i++) await page.evaluate((k) => window.TMEA11y.cycle(k), key);
    assert.equal(await page.evaluate((k) => window.TMEA11y.get()[k], key), max, key + ' at max');
    await page.evaluate((k) => window.TMEA11y.cycle(k), key);
    assert.equal(await page.evaluate((k) => window.TMEA11y.get()[k], key), 0, key + ' wrapped');
  }
});

test('the fixed menu button stays in the viewport with filters on and the page scrolled', async () => {
  const page = await newPage(browser, base, '/work/nora.html', { viewport: { width: 1280, height: 800 } });
  await set(page, 'contrast', 1);
  await set(page, 'saturation', 3);
  await page.evaluate(() => window.scrollTo(0, 1500));
  const r = await page.evaluate(() => document.getElementById('a11y-toggle').getBoundingClientRect().toJSON());
  assert.ok(r.top >= 0 && r.bottom <= 800, `toggle at ${r.top}-${r.bottom}`);
});

test('stacked text settings leave no horizontal scroll at 375px', async () => {
  for (const path of ['/work/nora.html', '/work/byodoin-phoenix-hall.html']) {
    const page = await newPage(browser, base, path, { viewport: { width: 375, height: 812 } });
    await set(page, 'text', 3);
    await set(page, 'lineheight', 3);
    await set(page, 'spacing', 3);
    await page.waitForTimeout(300);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(over <= 0, `${path} overflows by ${over}px`);
  }
});

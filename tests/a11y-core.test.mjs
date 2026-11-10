import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, stopServer, newPage, launchBrowser } from './helpers.mjs';

let base, browser;
before(async () => { base = await startServer(); browser = await launchBrowser(); });
after(async () => { await browser.close(); await stopServer(); });

const PAGES = ['/index.html', '/404.html', '/thanks.html', '/codex.html',
  '/work/balance-brewing.html', '/work/byodoin-phoenix-hall.html', '/work/costa-rebrand.html',
  '/work/medieval-armour.html', '/work/midnight-run.html', '/work/nora.html'];

const visible = (page, sel) => page.locator(sel).isVisible();

test('every page has the menu button and a footer link', async () => {
  for (const path of PAGES) {
    const page = await newPage(browser, base, path);
    assert.equal(await page.locator('#a11y-toggle').count(), 1, path + ' toggle');
    assert.equal(await page.locator('.a11y-footer-link').count(), 1, path + ' footer link');
    await page.context().close();
  }
});

test('button opens panel and sets aria-expanded', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  assert.equal(await visible(page, '#a11y-panel'), false);
  await page.click('#a11y-toggle');
  assert.equal(await visible(page, '#a11y-panel'), true);
  assert.equal(await page.getAttribute('#a11y-toggle', 'aria-expanded'), 'true');
});

test('Esc closes panel and returns focus to the button', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  await page.click('#a11y-toggle');
  await page.keyboard.press('Escape');
  assert.equal(await visible(page, '#a11y-panel'), false);
  assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), 'a11y-toggle');
});

test('focus stays inside the panel while open', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  await page.click('#a11y-toggle');
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => !!document.activeElement.closest('#a11y-panel'));
    assert.ok(inside, 'focus left the panel on Tab #' + (i + 1));
  }
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Shift+Tab');
    const inside = await page.evaluate(() => !!document.activeElement.closest('#a11y-panel'));
    assert.ok(inside, 'focus left the panel on Shift+Tab #' + (i + 1));
  }
});

test('settings persist across reload', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  await page.evaluate(() => window.TMEA11y.set('links', 1));
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('a11y-links')), true);
  await page.reload();
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('a11y-links')), true);
});

test('invalid values are ignored by set', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  await page.evaluate(() => { window.TMEA11y.set('text', 99); window.TMEA11y.set('text', -1); window.TMEA11y.set('nope', 1); });
  assert.equal(await page.evaluate(() => window.TMEA11y.get().text), 0);
});

test('a11y:change fires with the new settings', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  const detail = await page.evaluate(() => new Promise((resolve) => {
    document.addEventListener('a11y:change', (e) => resolve(e.detail), { once: true });
    window.TMEA11y.set('spacing', 2);
  }));
  assert.equal(detail.spacing, 2);
});

test('blocked storage still works and logs no errors', async () => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + '/work/nora.html');
  await page.evaluate(() => window.TMEA11y.set('links', 1));
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('a11y-links')), true);
  assert.deepEqual(errors, []);
});

test('corrupt storage is ignored', async () => {
  const context = await browser.newContext();
  await context.addInitScript(() => { localStorage.setItem('tme-a11y', '{bad'); });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + '/work/nora.html');
  assert.equal(await page.evaluate(() => window.TMEA11y.get().links), 0);
  assert.deepEqual(errors, []);
});

test('footer link opens the menu', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  await page.click('.a11y-footer-link');
  assert.equal(await visible(page, '#a11y-panel'), true);
});

test('panel has no horizontal scroll at 375px', async () => {
  const page = await newPage(browser, base, '/work/nora.html', { viewport: { width: 375, height: 812 } });
  await page.click('#a11y-toggle');
  const m = await page.evaluate(() => ({
    over: document.documentElement.scrollWidth - innerWidth,
    right: document.getElementById('a11y-panel').getBoundingClientRect().right,
    iw: innerWidth,
  }));
  assert.ok(m.over <= 0, 'page overflow ' + m.over);
  assert.ok(m.right <= m.iw + 0.5, 'panel right edge ' + m.right + ' > ' + m.iw);
});

test('reset clears every setting and removes all a11y classes', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  await page.evaluate(() => { const a = window.TMEA11y; a.set('text', 2); a.set('links', 1); a.set('contrast', 3); a.set('dyslexia', 1); a.set('saturation', 2); });
  await page.click('#a11y-toggle');
  await page.click('#a11y-reset');
  const s = await page.evaluate(() => ({ get: window.TMEA11y.get(), cls: [...document.documentElement.classList].filter((c) => c.startsWith('a11y-')) }));
  assert.deepEqual(Object.values(s.get).filter((v) => v !== 0), []);
  assert.deepEqual(s.cls, []);
});

test('move cycles bottom-left, bottom-right, hidden', async () => {
  const page = await newPage(browser, base, '/work/nora.html', { viewport: { width: 1280, height: 800 } });
  await page.click('#a11y-toggle');
  const box = () => page.evaluate(() => document.getElementById('a11y-toggle').getBoundingClientRect().toJSON());
  assert.ok((await box()).left < 100, 'starts bottom-left');
  await page.click('#a11y-move');
  assert.ok((await box()).left > 1000, 'moves bottom-right');
  await page.click('#a11y-move');
  assert.equal(await visible(page, '#a11y-toggle'), false, 'then hidden');
  await page.click('#a11y-move');
  assert.ok((await box()).left < 100, 'then back to bottom-left');
});

test('hidden position survives reload and the footer link still opens the menu', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  await page.evaluate(() => window.TMEA11y.set('pos', 2));
  await page.reload();
  assert.equal(await visible(page, '#a11y-toggle'), false);
  await page.click('.a11y-footer-link');
  assert.equal(await visible(page, '#a11y-panel'), true);
});

test('reset keeps the widget reachable', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  await page.evaluate(() => window.TMEA11y.set('pos', 2));
  await page.click('.a11y-footer-link');
  await page.click('#a11y-reset');
  assert.equal(await visible(page, '#a11y-toggle'), true);
});

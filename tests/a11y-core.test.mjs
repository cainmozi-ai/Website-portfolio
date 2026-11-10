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

test('keyboard only: Enter opens, Space toggles a tile, Esc closes', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  await page.focus('#a11y-toggle');
  await page.keyboard.press('Enter');
  assert.equal(await visible(page, '#a11y-panel'), true);
  await page.keyboard.press('Tab'); // close button -> first tile
  assert.equal(await page.evaluate(() => document.activeElement.dataset.key), 'contrast');
  await page.keyboard.press('Tab'); // Highlight Links
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('a11y-links')), true);
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-pressed')), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await visible(page, '#a11y-panel'), false);
});

test('no console or script errors on any page with the menu open', async () => {
  for (const path of PAGES) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(base + path, { waitUntil: 'load' });
    await page.click('#a11y-toggle');
    await page.evaluate(() => { const a = window.TMEA11y; a.set('text', 1); a.set('pause', 1); a.set('images', 1); a.set('dyslexia', 1); });
    await page.waitForTimeout(250);
    assert.deepEqual(errors, [], path);
    await context.close();
  }
});

// ── Final-review fixes ──

test('light and dark contrast do not turn the custom cursor into a solid disc', async () => {
  const page = await newPage(browser, base, '/index.html', { viewport: { width: 1280, height: 800 } });
  await page.mouse.move(400, 400);
  assert.equal(await page.locator('.cursor-ring').count(), 1, 'cursor exists on this setup');
  for (const step of [2, 3]) {
    await page.evaluate((s) => window.TMEA11y.set('contrast', s), step);
    for (const sel of ['.cursor-ring', '.cursor-dot']) {
      const bg = await page.evaluate((s) => getComputedStyle(document.querySelector(s)).backgroundColor, sel);
      assert.ok(bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || !/^rgb\((0, 0, 0|255, 255, 255)\)$/.test(bg) || sel === '.cursor-dot', `${sel} bg ${bg} at contrast ${step}`);
    }
    const ring = await page.evaluate(() => getComputedStyle(document.querySelector('.cursor-ring')).backgroundColor);
    assert.ok(ring === 'rgba(0, 0, 0, 0)' || ring === 'transparent', 'ring is filled: ' + ring);
  }
});

test('reset restores the OS reduced-motion default instead of switching Pause off', async () => {
  const page = await newPage(browser, base, '/work/nora.html', { reducedMotion: 'reduce' });
  await page.click('#a11y-toggle');
  await page.click('#a11y-reset');
  assert.equal(await page.evaluate(() => window.TMEA11y.get().pause), 1);
  await page.reload();
  assert.equal(await page.evaluate(() => window.TMEA11y.get().pause), 1);
});

test('changing another setting does not save Pause as a choice', async () => {
  const page = await newPage(browser, base, '/work/nora.html', { reducedMotion: 'reduce' });
  await page.evaluate(() => window.TMEA11y.set('links', 1));
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tme-a11y')));
  assert.equal('pause' in saved, false, JSON.stringify(saved));
});

test('the menu button stays reachable on the locked Codex page even when hidden', async () => {
  const context = await browser.newContext();
  await context.addInitScript(() => { localStorage.setItem('tme-a11y', JSON.stringify({ pos: 2 })); });
  const page = await context.newPage();
  await page.goto(base + '/codex.html');
  assert.equal(await page.locator('.codex-lock:not(.unlocked)').count(), 1, 'lock screen is showing');
  assert.equal(await visible(page, '#a11y-toggle'), true);
});

test('the menu is not announced as modal, and closes on outside click and on Esc from anywhere', async () => {
  const page = await newPage(browser, base, '/work/nora.html');
  assert.equal(await page.getAttribute('#a11y-panel', 'aria-modal'), null);
  await page.click('#a11y-toggle');
  await page.mouse.click(1000, 400);
  assert.equal(await visible(page, '#a11y-panel'), false, 'outside click closes');
  await page.click('#a11y-toggle');
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); });
  await page.keyboard.press('Escape');
  assert.equal(await visible(page, '#a11y-panel'), false, 'Esc closes with focus outside the panel');
});

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, stopServer, newPage, launchBrowser } from './helpers.mjs';

let base, browser;
before(async () => { base = await startServer(); browser = await launchBrowser(); });
after(async () => { await browser.close(); await stopServer(); });

const PAGES = ['/index.html', '/404.html', '/thanks.html', '/codex.html',
  '/work/balance-brewing.html', '/work/byodoin-phoenix-hall.html', '/work/costa-rebrand.html',
  '/work/medieval-armour.html', '/work/midnight-run.html', '/work/nora.html'];

for (const width of [375, 320]) {
  test(`no page scrolls sideways at ${width}px`, async () => {
    for (const path of PAGES) {
      const page = await newPage(browser, base, path, { viewport: { width, height: 800 } });
      await page.waitForTimeout(700);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(over <= 0, `${path} overflows by ${over}px at ${width}px`);
      await page.context().close();
    }
  });
}

test('letter-reveal headings keep their words and can still wrap', async () => {
  const page = await newPage(browser, base, '/index.html', { viewport: { width: 375, height: 800 } });
  const r = await page.evaluate(() => {
    const h = document.querySelector('.about-motto, .section-label');
    return { text: h.textContent.replace(/ /g, ' ').trim(), label: h.getAttribute('aria-label'), words: h.querySelectorAll('.char-word').length };
  });
  assert.equal(r.text.replace(/\s+/g, ' '), r.label.replace(/\s+/g, ' '));
  assert.ok(r.words >= 1, 'words are wrapped in .char-word');
});

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, stopServer, newPage, launchBrowser } from './helpers.mjs';

let base, browser;
before(async () => { base = await startServer(); browser = await launchBrowser(); });
after(async () => { await browser.close(); await stopServer(); });

// Loads every declared face and returns "family weight status" strings.
async function faceStates(page) {
  return page.evaluate(async () => {
    const faces = [...document.fonts];
    await Promise.allSettled(faces.map((f) => f.load()));
    return faces.map((f) => `${f.family.replace(/"/g, '')} ${f.weight} ${f.status}`);
  });
}

test('title font is Gotham Black', async () => {
  const page = await newPage(browser, base, '/index.html');
  const states = await faceStates(page);
  assert.ok(states.includes('Gotham Black 900 loaded'), states.join(' | '));
  const family = await page.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily);
  assert.match(family, /^"?Gotham Black"?/);
});

test('body font is Helvetica Neue', async () => {
  const page = await newPage(browser, base, '/index.html');
  const states = await faceStates(page);
  assert.ok(states.includes('Helvetica Neue 300 loaded'), states.join(' | '));
  assert.ok(states.includes('Helvetica Neue 400 loaded'), states.join(' | '));
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  assert.match(family, /^"?Helvetica Neue"?/);
});

test('fallback fonts still declared', async () => {
  const page = await newPage(browser, base, '/index.html');
  const title = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--font-title'));
  assert.match(title, /Montserrat/);
});

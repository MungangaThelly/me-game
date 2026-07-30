import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('service worker updates navigations from the network and activates immediately', async () => {
  const serviceWorker = await readFile(
    new URL('../public/sw.js', import.meta.url),
    'utf8'
  );

  assert.match(serviceWorker, /memory-game-v3/);
  assert.match(serviceWorker, /skipWaiting/);
  assert.match(serviceWorker, /clients\.claim/);
  assert.match(serviceWorker, /networkFirstNavigation/);
});

test('Netlify returns 404 for missing assets before applying the SPA fallback', async () => {
  const redirects = await readFile(
    new URL('../public/_redirects', import.meta.url),
    'utf8'
  );
  const rules = redirects.trim().split(/\r?\n/);

  assert.equal(rules[0].trim(), '/assets/* /404.html 404');
  assert.equal(rules[1].trim(), '/* /index.html 200');
});

test('mobile initialization does not install document-level touch blockers', async () => {
  const mobileManager = await readFile(
    new URL('../src/utils/mobileManager.js', import.meta.url),
    'utf8'
  );
  const initializationCalls = mobileManager.match(/this\.setupTouchEvents\(\)/g) || [];

  assert.equal(initializationCalls.length, 0);
});

test('iOS users can open manual installation instructions', async () => {
  const mobileManager = await readFile(
    new URL('../src/utils/mobileManager.js', import.meta.url),
    'utf8'
  );

  assert.match(
    mobileManager,
    /!this\.isStandalone && \(this\.isIOS \|\| this\.deferredPrompt !== null\)/
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function readLocale(locale) {
  const url = new URL(`../src/locales/${locale}.json`, import.meta.url);
  return JSON.parse(await readFile(url, 'utf8'));
}

test('all supported locales contain the same translation keys', async () => {
  const [english, swedish, french] = await Promise.all([
    readLocale('en'),
    readLocale('sv'),
    readLocale('fr')
  ]);
  const expectedKeys = Object.keys(english).sort();

  assert.deepEqual(Object.keys(swedish).sort(), expectedKeys);
  assert.deepEqual(Object.keys(french).sort(), expectedKeys);
});

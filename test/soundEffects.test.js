import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../src/utils/soundEffects.js', import.meta.url),
  'utf8'
);

test('audio initialization listeners run in capture phase', () => {
  assert.match(source, /addEventListener\('click', initOnUserGesture, true\)/);
  assert.match(source, /removeEventListener\('click', initOnUserGesture, true\)/);
});

test('all sounds requested by the game are defined', async () => {
  const gameSource = await readFile(
    new URL('../src/components/MemoryGame.jsx', import.meta.url),
    'utf8'
  );
  const requestedSounds = [
    ...gameSource.matchAll(/(?:soundManager\.play|playSound)\('([^']+)'\)/g)
  ].map((match) => match[1]);

  for (const soundName of new Set(requestedSounds)) {
    assert.match(source, new RegExp(`this\\.sounds\\.${soundName}\\s*=`));
  }
});

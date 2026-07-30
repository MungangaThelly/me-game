import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('manual setup selections advance to the next section', async () => {
  const source = await readFile(
    new URL('../src/components/MemoryGame.jsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /scrollToSection\(playerSelectorRef\)/);
  assert.match(source, /scrollToSection\(themeSelectorRef\)/);
  assert.match(source, /scrollToSection\(difficultySelectorRef\)/);
  assert.match(source, /scrollToSection\(cardGridRef\)/);
});

test('automatic section scrolling respects reduced motion', async () => {
  const source = await readFile(
    new URL('../src/components/MemoryGame.jsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /behavior: prefersReducedMotion \? 'auto' : 'smooth'/);
});

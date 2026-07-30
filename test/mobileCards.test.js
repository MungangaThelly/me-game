import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('mobile cards use large responsive symbols', async () => {
  const styles = await readFile(
    new URL('../src/components/ModernLayout.css', import.meta.url),
    'utf8'
  );

  assert.match(
    styles,
    /\.card-back\s*\{[^}]*font-size:\s*clamp\(2\.5rem,\s*12vw,\s*3\.75rem\)/s
  );
});

test('the old small-phone symbol override is removed', async () => {
  const styles = await readFile(
    new URL('../src/components/MemoryGame.css', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(styles, /clamp\(1\.2rem,\s*3vw,\s*1\.8rem\)/);
});

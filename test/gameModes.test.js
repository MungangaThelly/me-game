import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key)
};

const { gameModeManager } = await import('../src/utils/gameModes.js');

test('daily challenges are deterministic for the same date', () => {
  const date = new Date('2026-07-30T12:00:00Z');
  const first = gameModeManager.generateDailyChallenge(date);
  const second = gameModeManager.generateDailyChallenge(date);
  assert.deepEqual(second, first);
});

test('survival progress awards power-ups at expected streaks', () => {
  gameModeManager.initializeSurvival('test-player');
  let state;
  for (let index = 0; index < 3; index += 1) {
    state = gameModeManager.updateSurvivalProgress('test-player', {
      won: true,
      score: 100
    });
  }
  assert.equal(state.level, 4);
  assert.equal(state.powerUps.timeFreeze, 1);
  assert.equal(gameModeManager.usePowerUp('test-player', 'timeFreeze'), true);
  assert.equal(state.powerUps.timeFreeze, 0);
});

test('numeric difficulties fall back to valid mode timing', () => {
  assert.equal(gameModeManager.getTimeAttackSettings(2).timeLimit, 90);
  assert.equal(gameModeManager.getBlitzSettings(2).timePerPair, 2.5);
});

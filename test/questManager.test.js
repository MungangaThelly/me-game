import test from 'node:test';
import assert from 'node:assert/strict';

const saved = new Map();
globalThis.localStorage = {
  getItem: key => saved.get(key) ?? null,
  setItem: (key, value) => saved.set(key, String(value))
};

const { QuestManager } = await import('../src/utils/questManager.js');

test('provides two daily quests and one weekly quest deterministically', () => {
  const manager = new QuestManager();
  const date = new Date('2026-08-14T12:00:00Z');
  const first = manager.getActiveQuests(date);
  const second = manager.getActiveQuests(date);
  assert.equal(first.length, 3);
  assert.equal(first.filter(quest => quest.cadence === 'daily').length, 2);
  assert.equal(first.filter(quest => quest.cadence === 'weekly').length, 1);
  assert.deepEqual(first, second);
});

test('persists progress and awards each quest only once', () => {
  saved.clear();
  const manager = new QuestManager();
  const date = new Date('2026-08-14T12:00:00Z');
  const targetQuest = manager.getActiveQuests(date)[0];
  const result = manager.record(targetQuest.event, targetQuest.target, date);
  assert.equal(result.unlocked.some(quest => quest.key === targetQuest.key), true);
  const stars = result.stars;
  assert.equal(manager.record(targetQuest.event, 1, date).stars, stars);
  assert.equal(new QuestManager().getSnapshot(date).stars, stars);
});

test('recovers from corrupted or unwritable storage', () => {
  saved.set('memoryGame_quests_v1', '{bad json');
  const manager = new QuestManager();
  assert.equal(manager.getSnapshot(new Date('2026-08-14')).stars, 0);
  const original = globalThis.localStorage.setItem;
  globalThis.localStorage.setItem = () => { throw new Error('quota'); };
  assert.equal(manager.save({ stars: 1, progress: {} }), false);
  globalThis.localStorage.setItem = original;
});

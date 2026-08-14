import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areAllCardsMatched,
  calculatePerformance,
  createShuffledCards,
  getGameProgress,
  getPreviewDuration
} from '../src/utils/gameLogic.js';

test('creates the expected number of matching card pairs', () => {
  const cards = createShuffledCards(['a', 'b', 'c', 'd', 'e'], 1, () => 0.5);
  assert.equal(cards.length, 10);
  assert.equal(new Set(cards.map((card) => card.id)).size, 10);
  for (const symbol of ['a', 'b', 'c', 'd', 'e']) {
    assert.equal(cards.filter((card) => card.value === symbol).length, 2);
  }
});

test('reports completion only for a non-empty fully matched deck', () => {
  assert.equal(areAllCardsMatched([]), false);
  assert.equal(areAllCardsMatched([{ isMatched: true }]), true);
  assert.equal(areAllCardsMatched([{ isMatched: true }, { isMatched: false }]), false);
});

test('calculates match progress', () => {
  assert.equal(getGameProgress([]), 0);
  assert.equal(getGameProgress([{ isMatched: true }, { isMatched: false }]), 50);
});

test('falls back to medium difficulty for invalid values', () => {
  const symbols = Array.from({ length: 10 }, (_, index) => String(index));
  assert.equal(createShuffledCards(symbols, 'medium', () => 0.5).length, 20);
});

test('scales card preview time by difficulty', () => {
  assert.equal(getPreviewDuration(1), 4);
  assert.equal(getPreviewDuration(2), 3);
  assert.equal(getPreviewDuration(3), 2);
  assert.equal(getPreviewDuration('invalid'), 3);
});

test('calculates stable performance grades and clamps invalid input', () => {
  assert.deepEqual(calculatePerformance({ totalPairs: 5, totalMoves: 10, streak: 5, timer: 10, difficulty: 3 }), {
    moves: 5, accuracy: 100, score: 99, grade: 'S'
  });
  const poor = calculatePerformance({ totalPairs: 5, totalMoves: 40, streak: 0, timer: 500, difficulty: 1 });
  assert.equal(poor.accuracy, 25);
  assert.equal(poor.grade, 'C');
  assert.ok(poor.score >= 0 && poor.score <= 100);
});

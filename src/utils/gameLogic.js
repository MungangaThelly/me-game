export function createShuffledCards(symbols, difficulty, random = Math.random) {
  const normalizedDifficulty = Number(difficulty);
  const pairCount = (Number.isFinite(normalizedDifficulty) ? Math.max(1, normalizedDifficulty) : 2) * 5;
  const selectedSymbols = symbols.slice(0, pairCount);
  const cards = selectedSymbols.flatMap((value) => [
    { value, isFlipped: false, isMatched: false },
    { value, isFlipped: false, isMatched: false }
  ]);

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }

  return cards.map((card, id) => ({ id, ...card }));
}

export function areAllCardsMatched(cards) {
  return cards.length > 0 && cards.every((card) => card.isMatched);
}

export function getGameProgress(cards) {
  if (cards.length === 0) return 0;
  const matchedCards = cards.filter((card) => card.isMatched).length;
  return (matchedCards / cards.length) * 100;
}

export function getPreviewDuration(difficulty) {
  return ({ 1: 4, 2: 3, 3: 2 })[Number(difficulty)] || 3;
}

export function calculatePerformance({ totalPairs, totalMoves, streak, timer, difficulty }) {
  const moves = Math.max(1, Math.ceil(totalMoves / 2));
  const pairs = Math.max(1, totalPairs);
  const accuracy = Math.min(100, Math.round((pairs / moves) * 100));
  const score = Math.min(100, Math.max(0, Math.round(
    accuracy * 0.55 + Math.min(streak, pairs) / pairs * 20 +
    Math.max(0, 20 - Math.max(0, timer) / pairs) + Math.max(1, Math.min(3, Number(difficulty) || 2)) * 2
  )));
  const grade = score >= 90 ? 'S' : score >= 78 ? 'A' : score >= 64 ? 'B' : 'C';
  return { moves, accuracy, score, grade };
}

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

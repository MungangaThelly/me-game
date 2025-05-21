import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import "./MemoryGame.css";
import "../i18n";

const themes = {
  fruits: ['🍎', '🍊', '🍋', '🍉', '🍇', '🍓', '🍑', '🥭', '🍍', '🥝'],
  flowers: ['🌹', '🌻', '🌼', '🌸', '🌺', '🌷', '💐', '🏵️', '🥀', '🪷'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸'],
  fishes: ['🐠', '🐟', '🐡', '🦈', '🐋', '🐬', '🐳', '🦀', '🐙', '🦑'],
  birds: ['🐦', '🐤', '🐧', '🦅', '🦉', '🦜', '🦚', '🦩', '🦢', '🐥']
};

const themeColors = {
  fruits: '#FF5252',
  flowers: '#FF4081',
  animals: '#FF9800',
  sports: '#4CAF50',
  fishes: '#00BCD4',
  birds: '#9C27B0'
};

const shuffleCards = (difficulty, theme) => {
  const selectedSymbols = themes[theme].slice(0, difficulty * 5);

  let cardPairs = selectedSymbols
    .flatMap(value => [
      { id: Math.random(), value, isFlipped: false, isMatched: false },
      { id: Math.random(), value, isFlipped: false, isMatched: false }
    ])
    .sort(() => Math.random() - 0.5);

  return cardPairs.map((card, index) => ({
    id: index,
    value: card.value,
    isFlipped: false,
    isMatched: false
  }));
};

const MemoryGame = () => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState(2);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(localStorage.getItem("highScore") || 0);
  const [theme, setTheme] = useState('fruits');
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();

  useEffect(() => {
    setCards(shuffleCards(difficulty, theme));
  }, [difficulty, theme]);

  useEffect(() => {
    let interval;
    if (gameStarted && !allCardsMatched()) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, cards]);

  const resetGame = () => {
    setCards(shuffleCards(difficulty, theme));
    setFlippedCards([]);
    setScore(0);
    setTimer(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const handleCardClick = (id) => {
    if (flippedCards.length === 2 || !gameStarted || gameOver) return;

    const updatedCards = cards.map((card) =>
      card.id === id ? { ...card, isFlipped: true } : card
    );

    setCards(updatedCards);
    setFlippedCards([...flippedCards, id]);

    if (flippedCards.length === 1) {
      checkForMatch(updatedCards, flippedCards[0], id);
    }
  };

  const checkForMatch = (updatedCards, firstId, secondId) => {
    const firstCard = updatedCards.find((card) => card.id === firstId);
    const secondCard = updatedCards.find((card) => card.id === secondId);

    if (firstCard.value === secondCard.value) {
      setTimeout(() => {
        setScore((prev) => prev + 10);
        setCards(updatedCards.map((card) =>
          card.value === firstCard.value ? { ...card, isMatched: true } : card
        ));
      }, 500);
    } else {
      setTimeout(() => {
        setCards(updatedCards.map((card) =>
          card.id === firstId || card.id === secondId
            ? { ...card, isFlipped: false }
            : card
        ));
      }, 1000);
    }
    setFlippedCards([]);
  };

  const allCardsMatched = () => {
    return cards.every((card) => card.isMatched);
  };

  const changeDifficulty = (level) => {
    setDifficulty(level);
    setCards(shuffleCards(level, theme));
    setScore(0);
    setTimer(0);
    setGameStarted(true);
  };

  useEffect(() => {
    if (allCardsMatched() && !gameOver && gameStarted) {
      setGameOver(true);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("highScore", score);
      }
    }
  }, [cards, score, gameOver, highScore, gameStarted]);

  const renderThemeButton = (themeKey) => (
    <button
      key={themeKey}
      className={`theme-btn ${theme === themeKey ? 'active' : ''}`}
      onClick={() => setTheme(themeKey)}
      style={{ 
        backgroundColor: themeColors[themeKey],
        borderColor: theme === themeKey ? '#fff' : 'transparent'
      }}
      aria-label={t(themeKey)}
    >
      <span className="theme-icon">{themes[themeKey][0]}</span>
      <span className="theme-name">{t(themeKey)}</span>
    </button>
  );

  return (
    <div className="memory-game" data-theme={theme}>
      <h1>{t('ME-GAME')}</h1>
      
      {gameOver ? (
        <div className="congratulations-screen">
          <h2>{t('congratulations')}</h2>
          <p>{t('finalScore')}: {score}</p>
          <p>{t('timeTaken')}: {timer}s</p>
          <p>{t('highScore')}: {highScore}</p>
          <div className="game-over-actions">
            <button onClick={resetGame}>{t('playAgain')}</button>
            <button 
              onClick={() => navigate('/')}
              className="home-button"
            >
              {t('returnHome')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="game-stats">
            <p>{t('timer')}: {timer}s</p>
            <p>{t('score')}: {score}</p>
            <p>{t('highScore')}: {highScore}</p>
          </div>

          <div className="theme-selector">
            <h3>{t('selectTheme')}</h3>
            <div className="theme-grid">
              {Object.keys(themes).map(renderThemeButton)}
            </div>
          </div>

          <div className="difficulty-buttons">
            <button 
              onClick={() => changeDifficulty(1)}
              className={difficulty === 1 ? 'active' : ''}
            >
              {t('easy')}
            </button>
            <button 
              onClick={() => changeDifficulty(2)}
              className={difficulty === 2 ? 'active' : ''}
            >
              {t('medium')}
            </button>
            <button 
              onClick={() => changeDifficulty(3)}
              className={difficulty === 3 ? 'active' : ''}
            >
              {t('hard')}
            </button>
          </div>
          
          <button 
            onClick={resetGame} 
            className="reset-button" 
            aria-label={t('reset')}
            style={{ backgroundColor: themeColors[theme] }}
          >
            {t('reset-play')}
          </button>
          
          <div className="language-buttons">
            <button 
              onClick={() => i18n.changeLanguage("sv")} 
              aria-label={t('switchToSwedish')}
            >
              🇸🇪 {t('swedish')}
            </button>
            <button 
              onClick={() => i18n.changeLanguage("en")} 
              aria-label={t('switchToEnglish')}
            >
              🇬🇧 {t('english')}
            </button>
          </div>
          
          <div className="card-grid">
            {cards.map((card) => (
              <div
                key={card.id}
                className={`card ${card.isFlipped ? "flipped" : ""} ${card.isMatched ? "matched" : ""}`}
                onClick={() => !card.isFlipped && !card.isMatched && handleCardClick(card.id)}
                aria-label={card.isFlipped || card.isMatched ? t('cardValue', { value: card.value }) : t('flipCard')}
              >
                <div className="card-inner">
                  <div className="card-front">?</div>
                  <div className="card-back">{card.value}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MemoryGame;
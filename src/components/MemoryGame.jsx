import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import "./MemoryGame.css";
import "../i18n";

// Expanded themes with 12 categories
const themes = {
  flowers: ['🌹', '🌻', '🌼', '🌸', '🌺', '🌷', '💐', '🏵️', '🥀', '🪷'],
  fruits: ['🍎', '🍊', '🍋', '🍉', '🍇', '🍓', '🍑', '🥭', '🍍', '🥝'],
  vegetables: ['🥕', '🥦', '🧅', '🍅', '🥒', '🌽', '🍠', '🥔', '🍆', '🫑'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'],
  marine: ['🐠', '🐟', '🐡', '🦈', '🐋', '🐬', '🐳', '🦀', '🐙', '🦑'],
  birds: ['🐦', '🐤', '🐧', '🦅', '🦉', '🦜', '🦚', '🦩', '🦢', '🐥'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸'],
  vehicles: ['🚗', '🚕', '🚙', '🚌', '🚲', '🏍️', '✈️', '🚀', '🛸', '🚁'],
  weather: ['☀️', '⛅', '🌧️', '❄️', '🌪️', '🌈', '🌤️', '⚡', '🌙', '🌊'],
  music: ['🎹', '🎸', '🥁', '🎺', '🎻', '🎷', '🪕', '🎼', '🎤', '🎧'],
  professions: ['👨‍⚕️', '👩‍🍳', '👨‍🔬', '👩‍🎨', '👨‍🚒', '👩‍✈️', '👨‍🏫', '👩‍💻', '👨‍🔧', '👩‍🚀'],
  holidays: ['🎄', '🎃', '🎆', '🎇', '🪔', '🎉', '🎊', '🛶', '🎁', '🧧'],
  zodiac: ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑'],
   colors: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'],
  shapes: ['⬛', '⬜', '◼️', '◻️', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '🟨', '🟪']
};

// Theme metadata
const themeMeta = {
  flowers: { color: '#FF4081', icon: '🌹' },
  fruits: { color: '#FF5252', icon: '🍎' },
  vegetables: { color: '#8BC34A', icon: '🥕' },
  animals: { color: '#FF9800', icon: '🐶' },
  marine: { color: '#00BCD4', icon: '🐠' },
  birds: { color: '#9C27B0', icon: '🦜' },
  sports: { color: '#4CAF50', icon: '⚽' },
  vehicles: { color: '#607D8B', icon: '🚗' },
  weather: { color: '#03A9F4', icon: '☀️' },
  music: { color: '#E91E63', icon: '🎹' },
  professions: { color: '#795548', icon: '👨‍⚕️' },
  holidays: { color: '#F44336', icon: '🎄' },
  zodiac: { color: '#FFC107', icon: '♈' },
  colors: { color: '#FF1744', icon: '🎨' },
  shapes: { color: '#7C4DFF', icon: '🔶' }
};

// Multiplayer modes
const multiplayerModes = {
  solo: { name: 'solo', players: 1 },
  versus: { name: 'versus', players: 2 },
  teams: { name: 'teams', players: 4 }
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
  const [difficulty, setDifficulty] = useState(2);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(localStorage.getItem("highScore") || 0);
  const [theme, setTheme] = useState('fruits');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [multiplayerMode, setMultiplayerMode] = useState(multiplayerModes.solo);
  const [players, setPlayers] = useState([{ id: 1, name: 'Player 1', score: 0, active: true }]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    setCards(shuffleCards(difficulty, theme));
  }, [difficulty, theme]);

  useEffect(() => {
    let interval;
    if (gameStarted && !allCardsMatched()) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, cards]);

  const resetGame = () => {
    setCards(shuffleCards(difficulty, theme));
    setFlippedCards([]);
    setPlayers(players.map(p => ({ ...p, score: 0 })));
    setCurrentPlayer(0);
    setTimer(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const handleCardClick = (id) => {
    if (flippedCards.length === 2 || !gameStarted || gameOver) return;

    const updatedCards = cards.map(card =>
      card.id === id ? { ...card, isFlipped: true } : card
    );

    setCards(updatedCards);
    setFlippedCards([...flippedCards, id]);

    if (flippedCards.length === 1) {
      checkForMatch(updatedCards, flippedCards[0], id);
    }
  };

  const checkForMatch = (updatedCards, firstId, secondId) => {
    const firstCard = updatedCards.find(card => card.id === firstId);
    const secondCard = updatedCards.find(card => card.id === secondId);
    const isMatch = firstCard.value === secondCard.value;

    setTimeout(() => {
      if (isMatch) {
        const newCards = updatedCards.map(card =>
          card.value === firstCard.value ? { ...card, isMatched: true } : card
        );
        setCards(newCards);

        if (multiplayerMode.players > 1) {
          const newPlayers = [...players];
          newPlayers[currentPlayer].score += 10;
          setPlayers(newPlayers);
        }
      } else {
        setCards(updatedCards.map(card =>
          [firstId, secondId].includes(card.id) ? { ...card, isFlipped: false } : card
        ));

        if (multiplayerMode.players > 1) {
          setCurrentPlayer((currentPlayer + 1) % multiplayerMode.players);
        }
      }
      setFlippedCards([]);
    }, isMatch ? 500 : 1000);
  };

  const allCardsMatched = () => cards.every(card => card.isMatched);

  const changeDifficulty = (level) => {
    setDifficulty(level);
    setCards(shuffleCards(level, theme));
    setGameStarted(true);
    resetGame();
  };

  const changeMultiplayerMode = (mode) => {
    setMultiplayerMode(mode);
    setPlayers(
      Array(mode.players)
        .fill()
        .map((_, i) => ({
          id: i + 1,
          name: `${t('player')} ${i + 1}`,
          score: 0,
          active: i === 0
        }))
    );
    resetGame();
  };

  useEffect(() => {
    if (allCardsMatched() && !gameOver && gameStarted) {
      setGameOver(true);
      const topScore = Math.max(...players.map(p => p.score), highScore);
      if (topScore > highScore) {
        setHighScore(topScore);
        localStorage.setItem("highScore", topScore);
      }
    }
  }, [cards, players, gameOver, gameStarted, highScore]);

  const ThemePreviewModal = () => (
    <div className="modal-overlay" onClick={() => setShowThemeModal(false)}>
      <div className="theme-preview-modal" onClick={e => e.stopPropagation()}>
        <h3>{t('themePreview')}</h3>
        <div className="theme-preview-grid">
          {themes[theme].slice(0, difficulty * 5).map((emoji, i) => (
            <div key={i} className="preview-emoji">{emoji}</div>
          ))}
        </div>
        <button onClick={() => setShowThemeModal(false)}>{t('close')}</button>
      </div>
    </div>
  );

  const MultiplayerScoreboard = () => (
    <div className="scoreboard">
      {players.map((player, i) => (
        <div key={i} className={`player ${i === currentPlayer ? 'active' : ''}`}>
          <span>{player.name}</span>
          <span>{player.score}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="memory-game" data-theme={theme}>
      <h1>{t('Me-GaMe')}</h1>
      
      {gameOver ? (
        <div className="congratulations-screen">
          <h2>{t('congratulations')}</h2>
          {multiplayerMode.players > 1 ? (
            <>
              <h3>{t('finalScores')}</h3>
              {players.map((player, i) => (
                <p key={i}>{player.name}: {player.score}</p>
              ))}
            </>
          ) : (
            <p>{t('finalScore')}: {players[0].score}</p>
          )}
          <p>{t('timeTaken')}: {timer}s</p>
          <p>{t('highScore')}: {highScore}</p>
          <div className="game-over-actions">
            <button onClick={resetGame}>{t('playAgain')}</button>
            <button onClick={() => navigate('/')}>{t('returnHome')}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="game-controls">
            <div className="mode-selector">
              {Object.values(multiplayerModes).map(mode => (
                <button
                  key={mode.name}
                  className={multiplayerMode.name === mode.name ? 'active' : ''}
                  onClick={() => changeMultiplayerMode(mode)}
                >
                  {t(mode.name)}
                </button>
              ))}
            </div>

            <div className="theme-selector">
              <h3>{t('selectTheme')}</h3>
              <div className="theme-grid">
                {Object.keys(themes).slice(0, 6).map(themeKey => (
                  <button
                    key={themeKey}
                    className={`theme-btn ${theme === themeKey ? 'active' : ''}`}
                    onClick={() => setTheme(themeKey)}
                    style={{ backgroundColor: themeMeta[themeKey].color }}
                  >
                    <span className="theme-icon">{themeMeta[themeKey].icon}</span>
                    <span className="theme-name">{t(themeKey)}</span>
                  </button>
                ))}

                  {/* Second Row */}
                {Object.keys(themes).slice(6).map(themeKey => (
                  <button
                    key={themeKey}
                    className={`theme-btn ${theme === themeKey ? 'active' : ''}`}
                    onClick={() => setTheme(themeKey)}
                    style={{ backgroundColor: themeMeta[themeKey].color }}
                  >
                    <span className="theme-icon">{themeMeta[themeKey].icon}</span>
                    <span className="theme-name">{t(themeKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setShowThemeModal(true)}
              className="preview-button"
            >
              {t('previewTheme')}
            </button>

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
          </div>

          {multiplayerMode.players > 1 && <MultiplayerScoreboard />}

          <div className="game-info">
            <div className="game-stats">
              <p>{t('timer')}: {timer}s</p>
              {multiplayerMode.players === 1 && <p>{t('score')}: {players[0].score}</p>}
              <p>{t('highScore')}: {highScore}</p>
            </div>

            <div className="action-buttons">
              <button onClick={resetGame} className="reset-button">
                {t('reset')}
              </button>
              <div className="language-buttons">
                <button onClick={() => i18n.changeLanguage("sv")}>
                  🇸🇪 {t('swedish')}
                </button>
                <button onClick={() => i18n.changeLanguage("en")}>
                  🇬🇧 {t('english')}
                </button>
              </div>
            </div>
          </div>

          <div className="card-grid">
            {cards.map(card => (
              <div
                key={card.id}
                className={`card ${card.isFlipped ? "flipped" : ""} ${card.isMatched ? "matched" : ""}`}
                onClick={() => !card.isFlipped && !card.isMatched && handleCardClick(card.id)}
                aria-label={card.isFlipped || card.isMatched ? card.value : t('flipCard')}
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

      {showThemeModal && <ThemePreviewModal />}
    </div>
  );
};

export default MemoryGame;
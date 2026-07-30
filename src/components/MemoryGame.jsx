import React, { useState, useEffect, useRef, useMemo, useCallback, memo, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import soundManager from "../utils/soundEffects";
import { ParticleEffect, animationUtils } from "../utils/animations";
import gameStats from "../utils/gameStats";
import customThemeManager from "../utils/customThemes";
import multiplayerManager from "../utils/multiplayerManager";
import accessibilityManager from "../utils/accessibilityManager";
import gameModeManager from "../utils/gameModes";
import { areAllCardsMatched, createShuffledCards } from "../utils/gameLogic";
import { MultiplayerScoreboard, ThemePreviewModal } from "./GamePanels";
import mobileManager from "../utils/mobileManager";
import "./MemoryGame.css";
import "./ModernLayout.css";
import "../i18n";

// Lazy load heavy components for better performance
const LazyStatsModal = lazy(() => Promise.resolve({ 
  default: ({ onClose, stats, t, achievements }) => (
    <div className="stats-modal">
      <div className="stats-content">
        <div className="stats-header">
          <h2>📊 {t('gameStatistics')}</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>🎮 {t('gamesPlayed')}</h3>
            <p>{stats.gamesPlayed}</p>
          </div>
          <div className="stat-card">
            <h3>🏆 {t('winRate')}</h3>
            <p>{stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) : 0}%</p>
          </div>
          <div className="stat-card">
            <h3>⚡ {t('avgTime')}</h3>
            <p>{stats.averageTime}s</p>
          </div>
          <div className="stat-card">
            <h3>🔥 {t('bestStreak')}</h3>
            <p>{stats.bestStreak}</p>
          </div>
        </div>
        {achievements.length > 0 && (
          <div className="achievements">
            <h3>🏅 {t('achievements')}</h3>
            <div className="achievement-grid">
              {achievements.map((achievement, index) => (
                <div key={index} className="achievement-badge">
                  {t(achievement)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}));

// Optimized Card component with React.memo to prevent unnecessary re-renders
const Card = memo(({ card, onCardClick, soundManager }) => {
  const handleClick = useCallback(() => {
    if (!card.isFlipped && !card.isMatched) {
      onCardClick(card.id);
    }
  }, [card.id, card.isFlipped, card.isMatched, onCardClick]);

  return (
    <button
      type="button"
      data-card-id={card.id}
      className={`card ${card.isFlipped ? "flipped" : ""} ${card.isMatched ? "matched" : ""}`}
      onClick={handleClick}
      onMouseEnter={() => soundManager.play('buttonHover')}
      aria-label={card.isFlipped || card.isMatched ? card.value : 'Flip card'}
      disabled={card.isMatched}
    >
      <div className="card-inner">
        <div className="card-front">?</div>
        <div className="card-back">{card.value}</div>
      </div>
    </button>
  );
});

Card.displayName = 'Card';

// Optimized Theme Button component with React.memo
const ThemeButton = memo(({ themeKey, isActive, onClick, soundManager, style, icon, name, isBuiltIn = true }) => {
  const handleClick = useCallback(() => {
    onClick(themeKey);
  }, [themeKey, onClick]);

  return (
    <button
      className={`theme-btn ${isActive ? 'active' : ''} ${!isBuiltIn ? 'custom-theme' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => soundManager.play('buttonHover')}
      style={style}
    >
      <span className="theme-icon">{icon}</span>
      <span className="theme-name">{name}</span>
    </button>
  );
});

ThemeButton.displayName = 'ThemeButton';

// Optimized Custom Theme Container component
const CustomThemeContainer = memo(({ themeKey, theme, customThemes, themeMeta, onThemeChange, onExport, onDelete, soundManager }) => {
  const handleThemeClick = useCallback(() => {
    onThemeChange(themeKey);
  }, [themeKey, onThemeChange]);

  const handleExport = useCallback(() => {
    onExport(themeKey);
  }, [themeKey, onExport]);

  const handleDelete = useCallback(() => {
    onDelete(themeKey);
  }, [themeKey, onDelete]);

  return (
    <div className="custom-theme-container">
      <button
        className={`theme-btn custom-theme ${theme === themeKey ? 'active' : ''}`}
        onClick={handleThemeClick}
        onMouseEnter={() => soundManager.play('buttonHover')}
        style={{ backgroundColor: themeMeta[themeKey]?.color }}
      >
        <span className="theme-icon">{themeMeta[themeKey]?.icon}</span>
        <span className="theme-name">{customThemes[themeKey]?.name}</span>
      </button>
      <div className="custom-theme-controls">
        <button
          onClick={handleExport}
          className="export-btn"
          title="Export theme"
        >
          📤
        </button>
        <button
          onClick={handleDelete}
          className="delete-btn"
          title="Delete theme"
        >
          🗑️
        </button>
      </div>
    </div>
  );
});

CustomThemeContainer.displayName = 'CustomThemeContainer';

// Built-in themes with 16 categories
const builtInThemes = {
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
  colors: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥'],
  shapes: ['⬛', '⬜', '◼️', '◻️', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻'],
  space: ['🚀', '🛸', '👽', '🌎', '🌕', '✨', '⭐', '🌟', '💫', '☄️']
};



// Multiplayer modes
const multiplayerModes = {
  solo: { name: 'solo', players: 1 },
  versus: { name: 'versus', players: 2 },
  teams: { name: 'teams', players: 4 }
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
  const [setupStep, setSetupStep] = useState(0);
  const [autoSetup, setAutoSetup] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState('');
  const [scrollIndicatorText, setScrollIndicatorText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [soundVolume, setSoundVolume] = useState(soundManager.getVolume());
  
  // Progressive difficulty states
  const [timeLimit, setTimeLimit] = useState(0);
  const [streak, setStreak] = useState(0);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [perfectGame, setPerfectGame] = useState(true);
  const [totalMoves, setTotalMoves] = useState(0);
  // Removed old gameMode state - now using currentGameMode
  
  // Statistics and achievements
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const [statsData, setStatsData] = useState(gameStats.getStats());
  
  // Theme customization
  const [showThemeBuilder, setShowThemeBuilder] = useState(false);
  const [customThemes, setCustomThemes] = useState(customThemeManager.getAllThemes());
  const [builderStep, setBuilderStep] = useState(1);
  const [newThemeName, setNewThemeName] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState([]);
  const [themeColor, setThemeColor] = useState('#4CAF50');
  const [activeCategory, setActiveCategory] = useState('nature');

  // Enhanced Multiplayer
  const [isMultiplayerConnected, setIsMultiplayerConnected] = useState(false);
  const [showMultiplayerMenu, setShowMultiplayerMenu] = useState(false);
  const [showRoomBrowser, setShowRoomBrowser] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showTournamentBrowser, setShowTournamentBrowser] = useState(false);
  const [currentMultiplayerRoom, setCurrentMultiplayerRoom] = useState(null);
  const [roomList, setRoomList] = useState([]);
  const [isSpectating, setIsSpectating] = useState(false);
  const [playerProfile] = useState(multiplayerManager.getPlayerInfo());
  const [onlinePlayers, setOnlinePlayers] = useState([]);

  // Accessibility Plus
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);
  const [accessibilityPrefs, setAccessibilityPrefs] = useState(accessibilityManager.getPreferences());
  
  // Game Modes state
  const [currentGameMode, setCurrentGameMode] = useState('classic');
  const [survivalState, setSurvivalState] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [, setPuzzlePattern] = useState(null);
  const [blitzSettings, setBlitzSettings] = useState(null);
  const [gameModePowerUps, setGameModePowerUps] = useState({
    timeFreeze: false,
    extraLife: false,
    revealHint: false
  });
  const [lives, setLives] = useState(3);
  
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const changeLanguage = (language) => {
    localStorage.setItem('language', language);
    i18n.changeLanguage(language);
  };

  // Combine built-in and custom themes
  const themes = useMemo(() => {
    const combined = { ...builtInThemes };
    Object.entries(customThemes).forEach(([key, customTheme]) => {
      combined[key] = customTheme.emojis;
    });
    return combined;
  }, [customThemes]);

  // Combine theme metadata
  const themeMeta = useMemo(() => {
    const builtInMeta = {
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
      shapes: { color: '#7C4DFF', icon: '🔶' },
      space: { color: '#673AB7', icon: '🚀' }
    };

    const combined = { ...builtInMeta };
    Object.entries(customThemes).forEach(([key, customTheme]) => {
      combined[key] = {
        color: customTheme.color,
        icon: customTheme.icon,
        isCustom: true,
        name: customTheme.name
      };
    });
    return combined;
  }, [customThemes]);

  // Shuffle cards function - now inside component to access themes
  const shuffleCards = (difficulty, theme) =>
    createShuffledCards(themes[theme], difficulty);
  
  const themeGridRef = useRef(null);
  const controlsRef = useRef(null);
  const gameContainerRef = useRef(null);
  const particleEffectRef = useRef(null);
  const playerSelectorRef = useRef(null);
  const themeSelectorRef = useRef(null);
  const difficultySelectorRef = useRef(null);
  const cardGridRef = useRef(null);

  const scrollToSection = useCallback((sectionRef) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (!section) return;

        const prefersReducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;

        section.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      });
    });
  }, []);

  useEffect(() => {
    setCards(shuffleCards(difficulty, theme));
    
    // Initialize particle effect system
    if (gameContainerRef.current && !particleEffectRef.current) {
      particleEffectRef.current = new ParticleEffect(gameContainerRef.current);
    }
  // shuffleCards is recreated when themes change; themes are already reflected by theme selection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, theme]);

  useEffect(() => {
    let interval;
    if (gameStarted && !allCardsMatched) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  // cards drives allCardsMatched, so tracking cards also updates the timer state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, cards]);

  // Initialize mobile manager
  useEffect(() => {
    const initMobile = async () => {
      try {
        // Initialize mobile features
        mobileManager.initializeMobileFeatures();
        
        // Setup touch gestures for game area
        if (gameContainerRef.current) {
          mobileManager.setupTouchGestures(gameContainerRef.current, {
            onSwipeLeft: () => {
              // Navigate between game modes or themes
              const themeKeys = Object.keys(themes);
              if (themeKeys.length === 0) return;
              const currentIndex = Math.max(0, themeKeys.indexOf(theme));
              const nextIndex = (currentIndex + 1) % themeKeys.length;
              setTheme(themeKeys[nextIndex]);
            },
            onSwipeRight: () => {
              // Navigate to previous theme
              const themeKeys = Object.keys(themes);
              if (themeKeys.length === 0) return;
              const currentIndex = Math.max(0, themeKeys.indexOf(theme));
              const prevIndex =
                currentIndex === 0 ? themeKeys.length - 1 : currentIndex - 1;
              setTheme(themeKeys[prevIndex]);
            }
          });
        }
        
        // Monitor performance (less verbose)
        mobileManager.monitorPerformance((metrics) => {
          // Only log performance issues or significant changes
          if (metrics.fps < 45) {
            console.warn('Performance warning - FPS:', metrics.fps);
            // Reduce particle effects or animations
            console.log('Reducing effects for better performance');
          }
        });
        
        // Setup PWA installation prompt
        mobileManager.setupPWAPrompt();
        
      } catch (error) {
        console.error('Failed to initialize mobile features:', error);
      }
    };

    initMobile();
    
    // Cleanup on unmount
    const gameContainer = gameContainerRef.current;
    return () => {
      if (gameContainer) {
        mobileManager.removeTouchGestures(gameContainer);
      }
    };
  }, [theme, themes]);

  useEffect(() => {
    if (autoSetup) {
      const setupSteps = [
        // Step 0: Show multiplayer modes with scrolling
        () => {
          soundManager.play('autoSetupStep');
          setHighlightedSection('mode-selector');
          setScrollIndicatorText('📍 Showing Player Modes');
          // Scroll to mode selector with delay
          setTimeout(() => {
            const modeSelector = document.querySelector('.mode-selector');
            if (modeSelector) {
              modeSelector.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              });
            }
          }, 300);
          
          const modes = Object.values(multiplayerModes);
          let currentModeIndex = 0;
          
          const modeInterval = setInterval(() => {
            changeMultiplayerMode(modes[currentModeIndex]);
            currentModeIndex++;
            
            if (currentModeIndex >= modes.length) {
              clearInterval(modeInterval);
              setHighlightedSection('');
              setScrollIndicatorText('');
              setTimeout(() => setSetupStep(1), 1200);
            }
          }, 1800);
        },
        
        // Step 1: Show all themes with scrolling
        () => {
          setHighlightedSection('theme-selector');
          setScrollIndicatorText('🎨 Showcasing Themes');
          // Scroll to theme selector with delay
          setTimeout(() => {
            const themeGrid = themeGridRef.current;
            if (themeGrid) {
              themeGrid.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              });
            }
          }, 300);
          
          const themeKeys = Object.keys(themes);
          let currentThemeIndex = 0;
          
          const themeInterval = setInterval(() => {
            setTheme(themeKeys[currentThemeIndex]);
            currentThemeIndex++;
            
            if (currentThemeIndex >= themeKeys.length) {
              clearInterval(themeInterval);
              setHighlightedSection('');
              setScrollIndicatorText('');
              setTimeout(() => setSetupStep(2), 800);
            }
          }, 500);
        },
        
        // Step 2: Show theme preview
        () => {
          setShowThemeModal(true);
          setTimeout(() => {
            setShowThemeModal(false);
            setSetupStep(3);
          }, 2000);
        },
        
        // Step 3: Cycle through difficulties with scrolling
        () => {
          setHighlightedSection('difficulty-buttons');
          setScrollIndicatorText('⚡ Testing Difficulty Levels');
          // Scroll to difficulty buttons with delay
          setTimeout(() => {
            const difficultyButtons = document.querySelector('.difficulty-buttons');
            if (difficultyButtons) {
              difficultyButtons.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              });
            }
          }, 300);
          
          const difficulties = [1, 2, 3];
          let currentDiffIndex = 0;
          
          const diffInterval = setInterval(() => {
            setDifficulty(difficulties[currentDiffIndex]);
            currentDiffIndex++;
            
            if (currentDiffIndex >= difficulties.length) {
              clearInterval(diffInterval);
              setHighlightedSection('');
              setScrollIndicatorText('');
              setTimeout(() => setSetupStep(4), 1200);
            }
          }, 1500);
        },
        
        // Step 4: Cycle through languages with scrolling
        () => {
          setHighlightedSection('language-buttons');
          setScrollIndicatorText('🌍 Switching Languages');
          // Scroll to language buttons with delay
          setTimeout(() => {
            const languageButtons = document.querySelector('.language-buttons');
            if (languageButtons) {
              languageButtons.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              });
            }
          }, 300);
          
          const languages = ['en', 'sv', 'fr'];
          let currentLangIndex = 0;
          
          const langInterval = setInterval(() => {
            changeLanguage(languages[currentLangIndex]);
            currentLangIndex++;
            
            if (currentLangIndex >= languages.length) {
              clearInterval(langInterval);
              setHighlightedSection('');
              setScrollIndicatorText('🎮 Starting Game!');
              setTimeout(() => {
                setSetupStep(5);
                setAutoSetup(false);
                // Scroll to game area before starting
                setTimeout(() => {
                  const cardGrid = document.querySelector('.card-grid');
                  if (cardGrid) {
                    cardGrid.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center',
                      inline: 'center'
                    });
                  }
                  setScrollIndicatorText('');
                }, 500);
                startGame();
              }, 1200);
            }
          }, 1800);
        }
      ];
      
      if (setupStep < setupSteps.length) {
        setupSteps[setupStep]();
      }
    }
  // This guided sequence intentionally advances only when its explicit step changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSetup, setupStep, i18n]);

  // Enhanced Multiplayer Event Listeners
  useEffect(() => {
    // Set up multiplayer event listeners
    const handleMultiplayerConnected = () => {
      setIsMultiplayerConnected(true);
    };

    const handleMultiplayerDisconnected = () => {
      setIsMultiplayerConnected(false);
      setCurrentMultiplayerRoom(null);
    };

    const handleRoomJoined = (room) => {
      setCurrentMultiplayerRoom(room);
      setShowRoomBrowser(false);
      setShowMultiplayerMenu(false);
    };

    const handleRoomList = (rooms) => {
      setRoomList(rooms);
    };

    const handlePlayerJoined = (player) => {
      if (currentMultiplayerRoom) {
        setOnlinePlayers(prev => [...prev, player]);
      }
    };

    const handlePlayerLeft = (player) => {
      setOnlinePlayers(prev => prev.filter(p => p.id !== player.id));
    };

    const handleGameState = (gameState) => {
      // Sync game state from multiplayer server
      if (gameState && !isSpectating) {
        setCards(gameState.cards || []);
        setFlippedCards(gameState.flippedCards || []);
        setGameStarted(gameState.gameStarted || false);
        setGameOver(gameState.gameOver || false);
        setTimer(gameState.timer || 0);
      }
    };

    // Add event listeners
    multiplayerManager.on('connected', handleMultiplayerConnected);
    multiplayerManager.on('disconnected', handleMultiplayerDisconnected);
    multiplayerManager.on('roomJoined', handleRoomJoined);
    multiplayerManager.on('roomList', handleRoomList);
    multiplayerManager.on('playerJoined', handlePlayerJoined);
    multiplayerManager.on('playerLeft', handlePlayerLeft);
    multiplayerManager.on('gameState', handleGameState);

    // Cleanup event listeners
    return () => {
      multiplayerManager.off('connected', handleMultiplayerConnected);
      multiplayerManager.off('disconnected', handleMultiplayerDisconnected);
      multiplayerManager.off('roomJoined', handleRoomJoined);
      multiplayerManager.off('roomList', handleRoomList);
      multiplayerManager.off('playerJoined', handlePlayerJoined);
      multiplayerManager.off('playerLeft', handlePlayerLeft);
      multiplayerManager.off('gameState', handleGameState);
    };
  }, [currentMultiplayerRoom, isSpectating]);

  const resetGame = () => {
    setCards(shuffleCards(difficulty, theme));
    setFlippedCards([]);
    setPlayers(players.map(p => ({ ...p, score: 0 })));
    setCurrentPlayer(0);
    setTimer(0);
    setGameOver(false);
    setGameStarted(true);
    
    // Reset progressive difficulty stats
    setStreak(0);
    setScoreMultiplier(1);
    setPerfectGame(true);
    setTotalMoves(0);
    
    // Set time limit based on game mode and difficulty
    if (currentGameMode === 'timeAttack') {
      const timeLimits = { 1: 60, 2: 90, 3: 120 }; // Easy: 60s, Medium: 90s, Hard: 120s
      setTimeLimit(timeLimits[difficulty]);
    } else if (currentGameMode === 'blitz' && blitzSettings) {
      setTimeLimit(cards.length * blitzSettings.timePerPair);
    } else if (currentGameMode === 'survival' && survivalState) {
      setTimeLimit(survivalState.timePerLevel);
    } else if (currentGameMode === 'daily' && dailyChallenge) {
      setTimeLimit(dailyChallenge.timeLimit || 0);
    } else {
      setTimeLimit(0); // No time limit for classic mode
    }
  };

  const startAutoSetup = () => {
    setSetupStep(0);
    setAutoSetup(true);
    setGameStarted(false);
    setHighlightedSection('');
  };

  const startGame = () => {
    // Record game start in statistics
    gameStats.recordGameStart(difficulty, theme, currentGameMode);
    setStatsData(gameStats.getStats());
    
    resetGame();
    setAutoSetup(false);
  };

  // Theme Builder Handlers
  const openThemeBuilder = () => {
    setShowThemeBuilder(true);
    setBuilderStep(1);
    setSelectedEmojis([]);
    setNewThemeName('');
    setThemeColor('#FF4081');
    setActiveCategory(customThemeManager.emojiCategories[0].name);
  };

  const closeThemeBuilder = () => {
    setShowThemeBuilder(false);
    setBuilderStep(1);
    setSelectedEmojis([]);
    setNewThemeName('');
  };

  const toggleEmojiSelection = (emoji) => {
    setSelectedEmojis(prev => {
      if (prev.includes(emoji)) {
        return prev.filter(e => e !== emoji);
      } else if (prev.length < 16) {
        return [...prev, emoji];
      }
      return prev;
    });
  };

  const createTheme = () => {
    if (newThemeName.trim() && selectedEmojis.length === 16) {
      const success = customThemeManager.createTheme(
        newThemeName.trim().toLowerCase().replace(/\s+/g, '-'),
        newThemeName.trim(),
        selectedEmojis,
        themeColor,
        selectedEmojis[0]
      );
      
      if (success) {
        setCustomThemes(customThemeManager.getAllThemes());
        closeThemeBuilder();
        playSound('gameComplete'); // Success sound
      }
    }
  };

  const importThemeFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const themeData = JSON.parse(e.target.result);
          const success = customThemeManager.importTheme(themeData);
          if (success) {
            setCustomThemes(customThemeManager.getAllThemes());
            playSound('gameComplete');
          } else {
            alert('Invalid theme file format');
          }
        } catch {
          alert('Error reading theme file');
        }
      };
      reader.readAsText(file);
    }
  };

  const exportTheme = (themeKey) => {
    const theme = customThemes[themeKey];
    if (theme) {
      customThemeManager.exportTheme(themeKey);
    }
  };

  const deleteCustomTheme = (themeKey) => {
    if (confirm(`Delete theme "${customThemes[themeKey]?.name}"?`)) {
      customThemeManager.deleteTheme(themeKey);
      setCustomThemes(customThemeManager.getAllThemes());
      if (theme === themeKey) {
        setTheme('flowers'); // Reset to default theme
      }
    }
  };

  // Utility function for playing sounds
  const playSound = useCallback((soundType) => {
    soundManager.play(soundType);
  }, []);

  // Enhanced Multiplayer Handlers
  const connectToMultiplayer = useCallback(async () => {
    try {
      // Use mock server for development
      await multiplayerManager.connectMockServer();
      setIsMultiplayerConnected(true);
      multiplayerManager.getRoomList();
      playSound('gameComplete');
    } catch (error) {
      console.error('Failed to connect to multiplayer:', error);
      alert('Failed to connect to multiplayer server');
    }
  }, [playSound]);

  const disconnectFromMultiplayer = useCallback(() => {
    multiplayerManager.disconnect();
    setIsMultiplayerConnected(false);
    setCurrentMultiplayerRoom(null);
    setShowMultiplayerMenu(false);
    playSound('buttonClick');
  }, [playSound]);

  const createMultiplayerRoom = useCallback((roomConfig) => {
    multiplayerManager.createRoom({
      name: roomConfig.name || `${playerProfile.username}'s Room`,
      maxPlayers: roomConfig.maxPlayers || 4,
      gameMode: currentGameMode,
      difficulty: difficulty,
      theme: theme,
      isPrivate: roomConfig.isPrivate || false,
      password: roomConfig.password,
      allowSpectators: true
    });
    setShowCreateRoom(false);
    playSound('buttonClick');
  }, [playerProfile.username, currentGameMode, difficulty, theme, playSound]);

  const joinMultiplayerRoom = useCallback((roomId, password = null) => {
    multiplayerManager.joinRoom(roomId, password);
    playSound('buttonClick');
  }, [playSound]);

  const leaveMultiplayerRoom = useCallback(() => {
    if (currentMultiplayerRoom) {
      multiplayerManager.leaveRoom();
      setCurrentMultiplayerRoom(null);
      playSound('buttonClick');
    }
  }, [currentMultiplayerRoom, playSound]);

  const spectateRoom = useCallback((roomId) => {
    multiplayerManager.spectateRoom(roomId);
    setIsSpectating(true);
    playSound('buttonClick');
  }, [playSound]);

  // Accessibility handlers
  const toggleAccessibilityMenu = useCallback(() => {
    setShowAccessibilityMenu(prev => !prev);
  }, []);

  const updateAccessibilityPrefs = useCallback((newPrefs) => {
    setAccessibilityPrefs(prev => ({
      ...prev,
      ...newPrefs
    }));
    // Update each preference individually
    Object.entries(newPrefs).forEach(([key, value]) => {
      accessibilityManager.updatePreference(key, value);
    });
  }, []);

  const handleAccessibilityKeyNav = useCallback((event) => {
    accessibilityManager.handleKeyboardNavigation(event, {
      cards,
      flippedCards,
      onCardSelect: (cardId) => {
        if (!gameOver && gameStarted && flippedCards.length < 2) {
          handleCardClick(cardId);
        }
      }
    });
  // handleCardClick is declared below and reads the same game-state values tracked here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, flippedCards, gameOver, gameStarted]);

  // Game Mode handlers
  const switchGameMode = useCallback((mode) => {
    setCurrentGameMode(mode);
    if (mode === 'survival') {
      const survival = gameModeManager.initializeSurvival('player1');
      setSurvivalState(survival);
      setLives(survival.lives);
    } else if (mode === 'daily') {
      const challenge = gameModeManager.generateDailyChallenge();
      setDailyChallenge(challenge);
    } else if (mode === 'puzzle') {
      const patterns = gameModeManager.generatePuzzlePatterns();
      setPuzzlePattern(patterns.sequence); // Default to sequence pattern
    } else if (mode === 'blitz') {
      const settings = gameModeManager.getBlitzSettings(difficulty);
      setBlitzSettings(settings);
    }
    
    // Reset game state for new mode
    resetGame();
    soundManager.play('modeChange');
    scrollToSection(playerSelectorRef);
  // resetGame is declared below; mode changes invoke it directly.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, scrollToSection]);

  const handlePowerUp = useCallback((powerUpType) => {
    if (currentGameMode !== 'survival') return false;
    
    const success = gameModeManager.usePowerUp('player1', powerUpType);
    if (success) {
      setGameModePowerUps(prev => ({
        ...prev,
        [powerUpType]: true
      }));
      
      // Apply power-up effects
      switch (powerUpType) {
        case 'timeFreeze':
          setGameModePowerUps(prev => ({ ...prev, timeFreeze: true }));
          setTimeout(() => {
            setGameModePowerUps(prev => ({ ...prev, timeFreeze: false }));
          }, 10000); // 10 seconds freeze
          break;
        case 'extraLife':
          setLives(prev => prev + 1);
          break;
        case 'revealHint': {
          // Show first unmatched pair briefly
          const unmatched = cards.filter(card => !card.matched);
          if (unmatched.length >= 2) {
            const pair = unmatched.slice(0, 2);
            pair.forEach(card => card.isHint = true);
            setTimeout(() => {
              pair.forEach(card => card.isHint = false);
            }, 2000);
          }
          break;
        }
      }
      
      soundManager.play('powerUp');
      return true;
    }
    return false;
  }, [currentGameMode, cards]);

  const handleGameModeComplete = useCallback((gameResult) => {
    let modeSpecificResult = { ...gameResult };
    
    switch (currentGameMode) {
      case 'survival': {
        const survivalResult = gameModeManager.updateSurvivalProgress('player1', gameResult);
        setSurvivalState(survivalResult);
        setLives(survivalResult.lives);
        
        if (survivalResult.lives > 0 && gameResult.won) {
          // Continue to next level
          setTimeout(() => {
            resetGame();
            setDifficulty('medium'); // Adjust difficulty based on level
          }, 3000);
        }
        break;
      }
        
      case 'daily': {
        const reward = gameModeManager.completeDailyChallenge(new Date(), gameResult);
        if (reward) {
          modeSpecificResult.reward = reward;
          soundManager.play('achievement');
        }
        break;
      }
        
      case 'timeAttack': {
        const timeAttackSettings = gameModeManager.getTimeAttackSettings(difficulty);
        if (gameResult.time <= timeAttackSettings.timeLimit && gameResult.won) {
          modeSpecificResult.speedBonus = Math.max(0, timeAttackSettings.timeLimit - gameResult.time) * 10;
        }
        break;
      }
        
      case 'blitz':
        if (gameResult.won) {
          // Continue with more cards
          setTimeout(() => {
            setDifficulty(prev => prev === 'easy' ? 'medium' : prev === 'medium' ? 'hard' : 'hard');
            resetGame();
          }, 2000);
        }
        break;
    }
    
    return modeSpecificResult;
  // resetGame is declared below and is intentionally invoked using current render state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGameMode, difficulty]);

  const handleCardClick = useCallback((id) => {
    if (flippedCards.length === 2 || !gameStarted || gameOver) return;
    
    // Check time limit
    if (timeLimit > 0 && timer >= timeLimit) {
      setGameOver(true);
      soundManager.play('noMatch');
      mobileManager.hapticFeedback('error');
      return;
    }

    // Play card flip sound and haptic feedback
    soundManager.play('cardFlip');
    mobileManager.hapticFeedback('light');
    
    // Increment total moves
    setTotalMoves(prev => prev + 1);

    const updatedCards = cards.map(card =>
      card.id === id ? { ...card, isFlipped: true } : card
    );

    setCards(updatedCards);
    setFlippedCards([...flippedCards, id]);

    if (flippedCards.length === 1) {
      checkForMatch(updatedCards, flippedCards[0], id);
    }
  // checkForMatch is declared below and uses the same render snapshot as this click.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flippedCards, gameStarted, gameOver, timeLimit, timer, cards]);

  const checkForMatch = (updatedCards, firstId, secondId) => {
    const firstCard = updatedCards.find(card => card.id === firstId);
    const secondCard = updatedCards.find(card => card.id === secondId);
    const isMatch = firstCard.value === secondCard.value;

    setTimeout(() => {
      if (isMatch) {
        // Play match sound and haptic feedback
        soundManager.play('match');
        mobileManager.hapticFeedback('success');
        
        // Update streak and multiplier
        const newStreak = streak + 1;
        setStreak(newStreak);
        
        // Calculate score multiplier based on streak
        const newMultiplier = Math.min(5, 1 + Math.floor(newStreak / 3) * 0.5);
        setScoreMultiplier(newMultiplier);
        
        // Calculate base score
        let baseScore = 10;
        
        // Time bonus (faster matches get more points)
        if (currentGameMode === 'timeAttack') {
          const timeBonus = Math.max(0, 30 - timer) * 0.5;
          baseScore += timeBonus;
        }
        
        // Difficulty bonus
        const difficultyBonus = { 1: 1, 2: 1.5, 3: 2 };
        baseScore *= difficultyBonus[difficulty];
        
        // Apply multiplier
        const finalScore = Math.round(baseScore * newMultiplier);
        
        // Add particle effects for match
        if (particleEffectRef.current) {
          const firstElement = document.querySelector(`[data-card-id="${firstId}"]`);
          const secondElement = document.querySelector(`[data-card-id="${secondId}"]`);
          
          if (firstElement && secondElement) {
            const rect1 = firstElement.getBoundingClientRect();
            const rect2 = secondElement.getBoundingClientRect();
            const containerRect = gameContainerRef.current.getBoundingClientRect();
            
            // Create sparkles at both card positions
            particleEffectRef.current.createSparkles(
              rect1.left + rect1.width/2 - containerRect.left,
              rect1.top + rect1.height/2 - containerRect.top,
              8
            );
            particleEffectRef.current.createSparkles(
              rect2.left + rect2.width/2 - containerRect.left,
              rect2.top + rect2.height/2 - containerRect.top,
              8
            );
            
            // Animate the matched cards
            animationUtils.matchCelebration(firstElement);
            animationUtils.matchCelebration(secondElement);
          }
        }
        
        const newCards = updatedCards.map(card =>
          card.value === firstCard.value ? { ...card, isMatched: true } : card
        );
        setCards(newCards);

        if (multiplayerMode.players > 1) {
          const newPlayers = [...players];
          newPlayers[currentPlayer].score += finalScore;
          setPlayers(newPlayers);
        } else {
          // Single player scoring
          const newPlayers = [...players];
          newPlayers[0].score += finalScore;
          setPlayers(newPlayers);
        }
      } else {
        // Play no match sound and haptic feedback
        soundManager.play('noMatch');
        mobileManager.hapticFeedback('error');
        
        // Reset streak and perfect game
        setStreak(0);
        setScoreMultiplier(1);
        setPerfectGame(false);
        
        // Shake animation for wrong match
        const firstElement = document.querySelector(`[data-card-id="${firstId}"]`);
        const secondElement = document.querySelector(`[data-card-id="${secondId}"]`);
        
        if (firstElement && secondElement) {
          animationUtils.shake(firstElement);
          animationUtils.shake(secondElement);
        }
        
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

  // Memoized expensive calculations
  const allCardsMatched = useMemo(() => areAllCardsMatched(cards), [cards]);

  // Performance-optimized functions with useCallback
  const changeDifficulty = useCallback((level) => {
    playSound('buttonClick');
    setDifficulty(level);
    setCards(shuffleCards(level, theme));
    setGameStarted(true);
    resetGame();
    scrollToSection(cardGridRef);
  // resetGame is declared below and intentionally resets the newly selected difficulty.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, shuffleCards, playSound, scrollToSection]);

  const changeMultiplayerMode = (mode) => {
    soundManager.play('buttonClick');
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
    scrollToSection(themeSelectorRef);
  };

  const toggleSound = useCallback(() => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    soundManager.setEnabled(newSoundEnabled);
    if (newSoundEnabled) {
      soundManager.play('buttonClick');
    }
  }, [soundEnabled]);

  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    setSoundVolume(newVolume);
    soundManager.setVolume(newVolume);
    soundManager.play('buttonClick');
  }, []);

  const handleThemeChange = useCallback((newTheme) => {
    soundManager.play('themeChange');
    setTheme(newTheme);
    scrollToSection(difficultySelectorRef);
  }, [scrollToSection]);

  useEffect(() => {
    if (allCardsMatched && !gameOver && gameStarted) {
      // Play game completion sound
      soundManager.play('gameComplete');
      
      // Record game completion in statistics
      const gameData = {
        won: true,
        score: players[0].score,
        time: timer,
        moves: Math.ceil(totalMoves / 2),
        difficulty: difficulty,
        theme: theme,
        gameMode: currentGameMode,
        streak: streak,
        perfectGame: perfectGame,
        pairs: difficulty * 5
      };
      
      // Handle game mode specific completion
      const modeResult = handleGameModeComplete(gameData);
      
      const achievement = gameStats.recordGameEnd(modeResult);
      if (achievement) {
        setNewAchievement(achievement);
      }
      
      // Show mode-specific rewards
      if (modeResult.reward) {
        setNewAchievement(modeResult.reward.achievement);
      }
      
      setStatsData(gameStats.getStats());
      
      // Create confetti celebration
      if (particleEffectRef.current && gameContainerRef.current) {
        const rect = gameContainerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 3;
        
        // Create multiple bursts of confetti
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            particleEffectRef.current.createConfetti(
              centerX + (Math.random() - 0.5) * 200,
              centerY + (Math.random() - 0.5) * 100,
              20
            );
          }, i * 200);
        }
      }
      
      setGameOver(true);
      const topScore = Math.max(...players.map(p => p.score), highScore);
      if (topScore > highScore) {
        setHighScore(topScore);
        localStorage.setItem("highScore", topScore);
      }
    }
  // Completion helpers are declared in this component and use the same completed-game snapshot.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, players, gameOver, gameStarted, highScore, timer, totalMoves, difficulty, theme, currentGameMode, streak, perfectGame]);

  // Accessibility effects
  useEffect(() => {
    // Accessibility manager is already initialized in constructor
    // Apply saved accessibility preferences
    const savedPrefs = accessibilityManager.getPreferences();
    if (savedPrefs) {
      setAccessibilityPrefs(savedPrefs);
      accessibilityManager.applyAccessibilitySettings();
    }

    // Set up keyboard navigation
    const handleKeyDown = (event) => {
      handleAccessibilityKeyNav(event);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleAccessibilityKeyNav]);

  useEffect(() => {
    // Announce game state changes
    if (gameStarted && !gameOver) {
      accessibilityManager.announceGameEvent('gameStarted', { 
        difficulty: difficulty,
        theme: theme 
      });
    } else if (gameOver) {
      const winner = players.length > 1 
        ? players.reduce((max, p) => p.score > max.score ? p : max, players[0])
        : players[0];
      accessibilityManager.announceGameEvent('gameWon', {
        score: winner.score,
        time: timer,
        moves: totalMoves
      });
    }
  }, [gameStarted, gameOver, players, difficulty, theme, timer, totalMoves]);

  useEffect(() => {
    // Announce matches and score updates
    if (players.length > 0 && players[currentPlayer] && players[currentPlayer].score > 0) {
      const activePlayer = players[currentPlayer];
      accessibilityManager.announce(`Score: ${activePlayer.score} points`);
    }
  }, [players, currentPlayer]);

  const StatsModal = () => (
    <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
      <div className="stats-modal" onClick={e => e.stopPropagation()}>
        <h3>📊 {t('gameStatistics')}</h3>
        
        <div className="stats-grid">
          <div className="stats-section">
            <h4>{t('generalStats')}</h4>
            <div className="stat-item">
              <span>{t('gamesPlayed')}:</span>
              <span>{statsData.gamesPlayed}</span>
            </div>
            <div className="stat-item">
              <span>{t('gamesWon')}:</span>
              <span>{statsData.gamesWon}</span>
            </div>
            <div className="stat-item">
              <span>{t('winRate')}:</span>
              <span>{gameStats.getWinRate()}%</span>
            </div>
            <div className="stat-item">
              <span>{t('averageScore')}:</span>
              <span>{gameStats.getAverageScore()}</span>
            </div>
            <div className="stat-item">
              <span>{t('bestScore')}:</span>
              <span>{statsData.bestScore}</span>
            </div>
            <div className="stat-item">
              <span>{t('perfectGames')}:</span>
              <span>{statsData.perfectGames}</span>
            </div>
          </div>

          <div className="stats-section">
            <h4>{t('timeStats')}</h4>
            <div className="stat-item">
              <span>{t('bestTime')}:</span>
              <span>{statsData.bestTime !== Infinity ? `${statsData.bestTime}s` : '--'}</span>
            </div>
            <div className="stat-item">
              <span>{t('averageTime')}:</span>
              <span>{Math.round(statsData.averageTime)}s</span>
            </div>
            <div className="stat-item">
              <span>{t('longestStreak')}:</span>
              <span>{statsData.longestStreak}</span>
            </div>
            <div className="stat-item">
              <span>{t('playStreak')}:</span>
              <span>{gameStats.getPlayStreak()} {t('days')}</span>
            </div>
          </div>

          <div className="stats-section achievements-section">
            <h4>🏆 {t('achievements')}</h4>
            {Object.entries(statsData.achievements).map(([key, unlocked]) => (
              <div key={key} className={`achievement ${unlocked ? 'unlocked' : 'locked'}`}>
                <span className="achievement-icon">
                  {unlocked ? '🏆' : '🔒'}
                </span>
                <span className="achievement-name">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-actions">
          <button onClick={() => setShowStatsModal(false)}>{t('close')}</button>
          <button 
            onClick={() => {
              if (confirm(t('resetStatsConfirm'))) {
                gameStats.resetStats();
                setStatsData(gameStats.getStats());
              }
            }}
            className="reset-stats-btn"
          >
            {t('resetStats')}
          </button>
        </div>
      </div>
    </div>
  );

  const AccessibilityModal = () => (
    <div className="modal-overlay" onClick={() => setShowAccessibilityMenu(false)}>
      <div className="accessibility-modal" onClick={e => e.stopPropagation()}>
        <h3>{t('accessibilitySettings')}</h3>
        
        <div className="accessibility-section">
          <h4>{t('visualSettings')}</h4>
          
          <label className="accessibility-option">
            <input
              type="checkbox"
              checked={accessibilityPrefs.highContrast}
              onChange={(e) => updateAccessibilityPrefs({ highContrast: e.target.checked })}
            />
            <span>{t('highContrastMode')}</span>
          </label>

          <label className="accessibility-option">
            <input
              type="checkbox"
              checked={accessibilityPrefs.colorBlindMode}
              onChange={(e) => updateAccessibilityPrefs({ colorBlindMode: e.target.checked })}
            />
            <span>{t('colorBlindSupport')}</span>
          </label>

          <div className="accessibility-slider">
            <label>{t('fontSize')}: {accessibilityPrefs.fontSize}px</label>
            <input
              type="range"
              min="12"
              max="24"
              value={accessibilityPrefs.fontSize}
              onChange={(e) => updateAccessibilityPrefs({ fontSize: parseInt(e.target.value) })}
            />
          </div>

          <div className="accessibility-slider">
            <label>{t('animationSpeed')}: {accessibilityPrefs.animationSpeed}x</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={accessibilityPrefs.animationSpeed}
              onChange={(e) => updateAccessibilityPrefs({ animationSpeed: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="accessibility-section">
          <h4>{t('audioSettings')}</h4>
          
          <label className="accessibility-option">
            <input
              type="checkbox"
              checked={accessibilityPrefs.voiceAnnouncements}
              onChange={(e) => updateAccessibilityPrefs({ voiceAnnouncements: e.target.checked })}
            />
            <span>{t('voiceAnnouncements')}</span>
          </label>

          <label className="accessibility-option">
            <input
              type="checkbox"
              checked={accessibilityPrefs.soundCues}
              onChange={(e) => updateAccessibilityPrefs({ soundCues: e.target.checked })}
            />
            <span>{t('soundCues')}</span>
          </label>
        </div>

        <div className="accessibility-section">
          <h4>{t('navigationSettings')}</h4>
          
          <label className="accessibility-option">
            <input
              type="checkbox"
              checked={accessibilityPrefs.keyboardNavigation}
              onChange={(e) => updateAccessibilityPrefs({ keyboardNavigation: e.target.checked })}
            />
            <span>{t('keyboardNavigation')}</span>
          </label>

          <label className="accessibility-option">
            <input
              type="checkbox"
              checked={accessibilityPrefs.screenReaderSupport}
              onChange={(e) => updateAccessibilityPrefs({ screenReaderSupport: e.target.checked })}
            />
            <span>{t('screenReaderSupport')}</span>
          </label>
        </div>

        <div className="modal-actions">
          <button onClick={() => setShowAccessibilityMenu(false)}>{t('close')}</button>
          <button 
            onClick={() => {
              const defaults = {
                highContrast: false,
                colorblindMode: 'none',
                fontSize: 'normal',
                voiceAnnouncements: false,
                keyboardNavigation: true,
                reducedMotion: false
              };
              setAccessibilityPrefs(defaults);
              // Update each preference individually
              Object.entries(defaults).forEach(([key, value]) => {
                accessibilityManager.updatePreference(key, value);
              });
            }}
            className="reset-btn"
          >
            {t('resetToDefaults')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="memory-game" data-theme={theme} ref={gameContainerRef}>
      <h1>{t('Me-GaMe')}</h1>
      
      {/* Mobile-specific UI elements */}
      {mobileManager.isMobile && (
        <div className="mobile-ui">
          <div className="swipe-hints" role="note">
            <div className="swipe-hint">↔️ {t('swipeHintThemes')}</div>
            <div className="swipe-hint">↕️ {t('scrollHint')}</div>
          </div>
          <button 
            className="install-pwa-button"
            onClick={() => mobileManager.promptPWAInstall()}
            style={{ display: mobileManager.canInstallPWA() ? 'block' : 'none' }}
          >
            📱 {mobileManager.isIOS ? t('addToHomeScreen') : t('installApp')}
          </button>
        </div>
      )}
      
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
          <div className="game-controls" ref={controlsRef}>
            <div className="game-mode-selector">
              <h4>{t('gameMode')}</h4>
              <div className="game-mode-grid">
                {Object.values(gameModeManager.getGameModes()).map(mode => (
                  <button
                    key={mode.name}
                    className={`game-mode-card ${currentGameMode === mode.name ? 'active' : ''}`}
                    onClick={() => switchGameMode(mode.name)}
                    onMouseEnter={() => soundManager.play('buttonHover')}
                    title={mode.description}
                  >
                    <div className="mode-icon">{mode.icon}</div>
                    <div className="mode-name">{t(mode.name)}</div>
                    <div className="mode-features">
                      {mode.features.slice(0, 2).map((feature, idx) => (
                        <span key={idx} className="feature-tag">
                          {t(feature.toLowerCase().replace(/\s+/g, ''))}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Game Mode Info Panel */}
              {currentGameMode !== 'classic' && (
                <div className="game-mode-info">
                  {currentGameMode === 'survival' && survivalState && (
                    <div className="survival-info">
                      <div className="survival-stats">
                        <span>Level: {survivalState.level}</span>
                        <span>Lives: {lives}</span>
                        <span>Score: {survivalState.score}</span>
                      </div>
                      <div className="power-ups">
                        {Object.entries(survivalState.powerUps).map(([type, count]) => (
                          count > 0 && (
                            <button
                              key={type}
                              className="power-up-button"
                              onClick={() => handlePowerUp(type)}
                              disabled={gameModePowerUps[type]}
                            >
                              {type === 'timeFreeze' ? '❄️' : type === 'extraLife' ? '❤️' : '💡'} {count}
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {currentGameMode === 'daily' && dailyChallenge && (
                    <div className="daily-challenge-info">
                      <h5>{dailyChallenge.name}</h5>
                      <p>{dailyChallenge.description}</p>
                      <div className="challenge-progress">
                        Attempts: {dailyChallenge.attempts}
                        {dailyChallenge.completed && (
                          <span className="completed">✅ Completed!</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {currentGameMode === 'blitz' && blitzSettings && (
                    <div className="blitz-info">
                      <div className="blitz-stats">
                        <span>Time per pair: {blitzSettings.timePerPair}s</span>
                        <span>Penalty: -{blitzSettings.penalty}s</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className={`mode-selector ${highlightedSection === 'mode-selector' ? 'auto-setup-highlight' : ''}`}
              ref={playerSelectorRef}
            >
              <h4>{t('players')}</h4>
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

            <div
              className={`theme-selector ${highlightedSection === 'theme-selector' ? 'auto-setup-highlight' : ''}`}
              ref={themeSelectorRef}
            >
              <h3>{t('selectTheme')}</h3>
              <div className="theme-grid" ref={themeGridRef}>
                {/* Built-in themes */}
                {Object.keys(builtInThemes).map(themeKey => (
                  <ThemeButton
                    key={themeKey}
                    themeKey={themeKey}
                    isActive={theme === themeKey}
                    onClick={handleThemeChange}
                    soundManager={soundManager}
                    style={{ backgroundColor: themeMeta[themeKey].color }}
                    icon={themeMeta[themeKey].icon}
                    name={t(themeKey)}
                    isBuiltIn={true}
                  />
                ))}
                
                {/* Custom themes */}
                {Object.keys(customThemes).map(themeKey => (
                  <CustomThemeContainer
                    key={themeKey}
                    themeKey={themeKey}
                    theme={theme}
                    customThemes={customThemes}
                    themeMeta={themeMeta}
                    onThemeChange={handleThemeChange}
                    onExport={exportTheme}
                    onDelete={deleteCustomTheme}
                    soundManager={soundManager}
                  />
                ))}
              </div>
              
              <div className="theme-controls">
                <button 
                  onClick={openThemeBuilder}
                  className="create-theme-button"
                  onMouseEnter={() => soundManager.play('buttonHover')}
                >
                  ✨ Create Custom Theme
                </button>
                
                <label className="import-theme-button">
                  📁 Import Theme
                  <input
                    type="file"
                    accept=".json"
                    onChange={importThemeFile}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <button 
              onClick={() => setShowThemeModal(true)}
              className="preview-button"
            >
              👀 {t('previewTheme')}
            </button>

            <div
              className={`difficulty-buttons ${highlightedSection === 'difficulty-buttons' ? 'auto-setup-highlight' : ''}`}
              ref={difficultySelectorRef}
            >
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
              onClick={startAutoSetup}
              className="auto-setup-button"
              disabled={autoSetup}
              onMouseEnter={() => soundManager.play('buttonHover')}
            >
              {t('autoSetup')}
            </button>

            <div className="sound-settings">
              <h4>{t('soundSettings')}</h4>
              <div className="sound-controls">
                <button 
                  onClick={toggleSound}
                  className={`sound-toggle ${soundEnabled ? 'active' : ''}`}
                  onMouseEnter={() => soundManager.play('buttonHover')}
                >
                  {soundEnabled ? '🔊' : '🔇'} {t(soundEnabled ? 'soundOn' : 'soundOff')}
                </button>
                {soundEnabled && (
                  <div className="volume-control">
                    <span>🔉</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={soundVolume}
                      onChange={handleVolumeChange}
                      className="volume-slider"
                    />
                    <span>🔊</span>
                  </div>
                )}
              </div>
            </div>

            <div className="accessibility-controls">
              <h4>{t('accessibility')}</h4>
              <button 
                onClick={toggleAccessibilityMenu}
                className={`accessibility-toggle ${showAccessibilityMenu ? 'active' : ''}`}
                onMouseEnter={() => soundManager.play('buttonHover')}
                aria-label="Toggle accessibility settings"
              >
                ♿ {t('accessibilitySettings')}
              </button>
            </div>
          </div>

          {multiplayerMode.players > 1 && (
            <MultiplayerScoreboard players={players} currentPlayer={currentPlayer} />
          )}

          <div className="game-info">
            <div className="game-stats">
              <p>
                {t('timer')}: {timer}s
                {timeLimit > 0 && (
                  <span className={timer > timeLimit * 0.8 ? 'time-warning' : ''}>
                    /{timeLimit}s
                  </span>
                )}
              </p>
              {multiplayerMode.players === 1 && (
                <>
                  <p>{t('score')}: {players[0].score}</p>
                  {streak > 0 && <p className="streak">🔥 {t('streak')}: {streak}</p>}
                  {scoreMultiplier > 1 && (
                    <p className="multiplier">✨ {scoreMultiplier.toFixed(1)}x</p>
                  )}
                  <p>{t('moves')}: {Math.ceil(totalMoves / 2)}</p>
                </>
              )}
              <p>{t('highScore')}: {highScore}</p>
            </div>

            <div className="action-buttons">
              <button onClick={resetGame} className="reset-button">
                {t('reset')}
              </button>
              <button 
                onClick={() => setShowStatsModal(true)} 
                className="stats-button"
                onMouseEnter={() => soundManager.play('buttonHover')}
              >
                📊 {t('statistics')}
              </button>
              
              <button 
                onClick={() => setShowMultiplayerMenu(true)} 
                className={`multiplayer-button ${isMultiplayerConnected ? 'connected' : ''}`}
                onMouseEnter={() => soundManager.play('buttonHover')}
              >
                🌐 {isMultiplayerConnected ? 'Online' : 'Multiplayer'}
              </button>
              
              <div className={`language-buttons ${highlightedSection === 'language-buttons' ? 'auto-setup-highlight' : ''}`}>
                <button onClick={() => changeLanguage("sv")}>
                  🇸🇪 {t('swedish')}
                </button>
                <button onClick={() => changeLanguage("en")}>
                  🇬🇧 {t('english')}
                </button>
                <button onClick={() => changeLanguage("fr")}>
                  🇫🇷 {t('french')}
                </button>
              </div>
            </div>
          </div>

          <div className="card-grid" ref={cardGridRef}>
            {cards.map(card => (
              <Card
                key={card.id}
                card={card}
                onCardClick={handleCardClick}
                soundManager={soundManager}
              />
            ))}
          </div>
        </>
      )}

      {showThemeModal && (
        <ThemePreviewModal
          difficulty={difficulty}
          emojis={themes[theme]}
          onClose={() => setShowThemeModal(false)}
          t={t}
        />
      )}
      {showStatsModal && <StatsModal />}
      {showAccessibilityMenu && <AccessibilityModal />}
      
      {/* Auto-setup scroll indicator */}
      {scrollIndicatorText && (
        <div className="auto-setup-scroll-indicator">
          {scrollIndicatorText}
        </div>
      )}

      {/* Achievement notification */}
      {newAchievement && (
        <div className="achievement-notification">
          <div className="achievement-content">
            <h4>🏆 {t('achievementUnlocked')}</h4>
            <p>{t(newAchievement)}</p>
            <button onClick={() => setNewAchievement(null)}>✓</button>
          </div>
        </div>
      )}

      {/* Enhanced Multiplayer Modals */}
      {showMultiplayerMenu && (
        <div className="multiplayer-modal">
          <div className="multiplayer-content">
            <div className="multiplayer-header">
              <h2>🌐 Enhanced Multiplayer</h2>
              <button onClick={() => setShowMultiplayerMenu(false)} className="close-button">✕</button>
            </div>
            
            <div className="player-profile">
              <h3>👤 Your Profile</h3>
              <div className="profile-info">
                <span className="avatar">{playerProfile.avatar}</span>
                <span className="username">{playerProfile.username}</span>
                <span className="level">Level {playerProfile.stats.level}</span>
                <span className="rank">{playerProfile.stats.rank}</span>
              </div>
            </div>

            <div className="multiplayer-actions">
              {!isMultiplayerConnected ? (
                <button 
                  onClick={connectToMultiplayer}
                  className="connect-button"
                >
                  🚀 Connect to Server
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setShowCreateRoom(true)}
                    className="create-room-button"
                  >
                    ➕ Create Room
                  </button>
                  
                  <button 
                    onClick={() => setShowRoomBrowser(true)}
                    className="browse-rooms-button"
                  >
                    🔍 Browse Rooms
                  </button>
                  
                  <button 
                    onClick={() => setShowTournamentBrowser(true)}
                    className="tournament-button"
                  >
                    🏆 Tournaments
                  </button>
                  
                  {currentMultiplayerRoom && (
                    <button 
                      onClick={leaveMultiplayerRoom}
                      className="leave-room-button"
                    >
                      🚪 Leave Room
                    </button>
                  )}
                  
                  <button 
                    onClick={disconnectFromMultiplayer}
                    className="disconnect-button"
                  >
                    🔌 Disconnect
                  </button>
                </>
              )}
            </div>

            {currentMultiplayerRoom && (
              <div className="current-room">
                <h3>🏠 Current Room: {currentMultiplayerRoom.name}</h3>
                <div className="room-players">
                  {onlinePlayers.map((player, index) => (
                    <div key={index} className="player-card">
                      <span className="player-avatar">{player.avatar}</span>
                      <span className="player-name">{player.username}</span>
                      <span className="player-ready">{player.ready ? '✅' : '⏳'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateRoom && (
        <div className="create-room-modal">
          <div className="create-room-content">
            <div className="modal-header">
              <h2>➕ Create Room</h2>
              <button onClick={() => setShowCreateRoom(false)} className="close-button">✕</button>
            </div>
            
            <form
              className="room-settings"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                createMultiplayerRoom({
                  name: data.get('roomName'),
                  maxPlayers: Number(data.get('maxPlayers')),
                  isPrivate: data.get('isPrivate') === 'on',
                  allowSpectators: data.get('allowSpectators') === 'on'
                });
              }}
            >
              <label>
                Room Name:
                <input name="roomName" type="text" placeholder="My Awesome Room" required />
              </label>
              
              <label>
                Max Players:
                <select name="maxPlayers" defaultValue="4">
                  <option value="2">2 Players</option>
                  <option value="3">3 Players</option>
                  <option value="4">4 Players</option>
                  <option value="6">6 Players</option>
                </select>
              </label>
              
              <label>
                <input name="isPrivate" type="checkbox" />
                Private Room
              </label>
              
              <label>
                <input name="allowSpectators" type="checkbox" defaultChecked />
                Allow Spectators
              </label>
              <div className="room-actions">
              <button 
                type="submit"
                className="create-button"
              >
                🎮 Create & Join Room
              </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoomBrowser && (
        <div className="room-browser-modal">
          <div className="room-browser-content">
            <div className="modal-header">
              <h2>🔍 Browse Rooms</h2>
              <button onClick={() => setShowRoomBrowser(false)} className="close-button">✕</button>
            </div>
            
            <div className="room-list">
              {roomList.length === 0 ? (
                <div className="no-rooms">
                  <p>🏠 No rooms available</p>
                  <button onClick={() => setShowCreateRoom(true)}>Create First Room</button>
                </div>
              ) : (
                roomList.map((room, index) => (
                  <div key={index} className="room-item">
                    <div className="room-info">
                      <h3>{room.name}</h3>
                      <span className="room-players">{room.currentPlayers}/{room.maxPlayers} players</span>
                      <span className="room-mode">{room.gameMode}</span>
                    </div>
                    <div className="room-actions">
                      <button 
                        onClick={() => joinMultiplayerRoom(room.id)}
                        disabled={room.currentPlayers >= room.maxPlayers}
                      >
                        🎮 Join
                      </button>
                      <button 
                        onClick={() => spectateRoom(room.id)}
                        disabled={!room.allowSpectators}
                      >
                        👁️ Watch
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showTournamentBrowser && (
        <div className="tournament-modal">
          <div className="tournament-content">
            <div className="modal-header">
              <h2>🏆 Tournaments</h2>
              <button onClick={() => setShowTournamentBrowser(false)} className="close-button">✕</button>
            </div>
            
            <div className="tournament-tabs">
              <button className="tab active">🎯 Join Tournament</button>
              <button className="tab">🏅 Leaderboard</button>
              <button className="tab">📊 My Stats</button>
            </div>
            
            <div className="tournament-list">
              <div className="tournament-item">
                <h3>🥇 Weekly Championship</h3>
                <p>16 players • Single Elimination • Prize: 1000 XP</p>
                <button className="join-tournament-button">🎮 Join Tournament</button>
              </div>
              
              <div className="tournament-item">
                <h3>⚡ Speed Masters</h3>
                <p>32 players • Time Attack Mode • Prize: 2000 XP</p>
                <button className="join-tournament-button">🎮 Join Tournament</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Builder Modal */}
      {showThemeBuilder && (
        <div className="theme-builder-modal">
          <div className="theme-builder-content">
            <div className="theme-builder-header">
              <h2>✨ Create Custom Theme</h2>
              <button onClick={closeThemeBuilder} className="close-button">✕</button>
            </div>

            {builderStep === 1 && (
              <div className="builder-step">
                <h3>Step 1: Theme Name & Color</h3>
                <div className="theme-builder-form">
                  <label>
                    Theme Name:
                    <input
                      type="text"
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                      placeholder="My Awesome Theme"
                      maxLength={30}
                    />
                  </label>
                  
                  <label>
                    Theme Color:
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                    />
                  </label>
                </div>
                
                <div className="builder-controls">
                  <button 
                    onClick={() => setBuilderStep(2)}
                    disabled={!newThemeName.trim()}
                    className="next-button"
                  >
                    Next: Select Emojis →
                  </button>
                </div>
              </div>
            )}

            {builderStep === 2 && (
              <div className="builder-step">
                <h3>Step 2: Select 16 Emojis</h3>
                <div className="emoji-selection-info">
                  Selected: {selectedEmojis.length}/16
                </div>
                
                <div className="emoji-categories">
                  {customThemeManager.emojiCategories.map(category => (
                    <button
                      key={category.name}
                      onClick={() => setActiveCategory(category.name)}
                      className={`category-btn ${activeCategory === category.name ? 'active' : ''}`}
                    >
                      {category.icon} {category.name}
                    </button>
                  ))}
                </div>

                <div className="emoji-grid">
                  {customThemeManager.emojiCategories
                    .find(cat => cat.name === activeCategory)?.emojis
                    .map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => toggleEmojiSelection(emoji)}
                        className={`emoji-btn ${selectedEmojis.includes(emoji) ? 'selected' : ''} ${selectedEmojis.length >= 16 && !selectedEmojis.includes(emoji) ? 'disabled' : ''}`}
                        disabled={selectedEmojis.length >= 16 && !selectedEmojis.includes(emoji)}
                      >
                        {emoji}
                      </button>
                    ))
                  }
                </div>

                <div className="selected-emojis">
                  <h4>Selected Emojis:</h4>
                  <div className="selected-emoji-list">
                    {selectedEmojis.map((emoji, index) => (
                      <span key={index} className="selected-emoji">{emoji}</span>
                    ))}
                  </div>
                </div>
                
                <div className="builder-controls">
                  <button 
                    onClick={() => setBuilderStep(1)}
                    className="back-button"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={createTheme}
                    disabled={selectedEmojis.length !== 16}
                    className="create-button"
                  >
                    Create Theme ✨
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryGame;

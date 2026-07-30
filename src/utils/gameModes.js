// Game Modes Manager
// Handles different game modes including time attack, survival, puzzle patterns, and daily challenges

class GameModeManager {
  constructor() {
    this.dailyChallenges = new Map();
    this.puzzlePatterns = new Map();
    this.survivalData = new Map();
    this.loadSavedData();
  }

  // Game Mode Definitions
  getGameModes() {
    return {
      classic: {
        name: 'classic',
        icon: '🏛️',
        description: 'Traditional memory matching game',
        features: ['No time limit', 'Score based on moves', 'Relaxed gameplay'],
        settings: {
          hasTimeLimit: false,
          scoringMultiplier: 1,
          penaltySystem: false
        }
      },
      timeAttack: {
        name: 'timeAttack',
        icon: '⏰',
        description: 'Race against time to match all pairs',
        features: ['Time pressure', 'Speed bonuses', 'Increasing difficulty'],
        settings: {
          hasTimeLimit: true,
          scoringMultiplier: 2,
          penaltySystem: true,
          timeBonus: true
        }
      },
      survival: {
        name: 'survival',
        icon: '🔥',
        description: 'Survive as long as possible with increasing difficulty',
        features: ['Progressive difficulty', 'Lives system', 'Endless gameplay'],
        settings: {
          hasTimeLimit: true,
          scoringMultiplier: 3,
          penaltySystem: true,
          livesSystem: true,
          progressiveDifficulty: true
        }
      },
      puzzle: {
        name: 'puzzle',
        icon: '🧩',
        description: 'Solve specific patterns and sequences',
        features: ['Predetermined patterns', 'Logic challenges', 'Pattern recognition'],
        settings: {
          hasTimeLimit: false,
          scoringMultiplier: 2,
          penaltySystem: false,
          patternBased: true
        }
      },
      daily: {
        name: 'daily',
        icon: '📅',
        description: 'Daily challenge with special rewards',
        features: ['One attempt per day', 'Special rewards', 'Leaderboards'],
        settings: {
          hasTimeLimit: true,
          scoringMultiplier: 4,
          penaltySystem: true,
          dailyChallenge: true
        }
      },
      blitz: {
        name: 'blitz',
        icon: '⚡',
        description: 'Ultra-fast gameplay with quick decisions',
        features: ['Very short time limits', 'Instant penalties', 'Rapid fire'],
        settings: {
          hasTimeLimit: true,
          scoringMultiplier: 5,
          penaltySystem: true,
          blitzMode: true
        }
      }
    };
  }

  // Time Attack Mode
  getTimeAttackSettings(difficulty) {
    const baseTime = {
      easy: 120, // 2 minutes
      medium: 90, // 1.5 minutes
      hard: 60   // 1 minute
    };

    return {
      timeLimit: baseTime[difficulty] || 90,
      speedBonus: true,
      perfectGameBonus: 500,
      timeWarningAt: 30, // seconds
      criticalWarningAt: 10 // seconds
    };
  }

  // Survival Mode
  initializeSurvival(playerId = 'default') {
    const survivalState = {
      level: 1,
      lives: 3,
      timePerLevel: 60,
      pairsPerLevel: 6,
      score: 0,
      consecutiveWins: 0,
      powerUps: {
        timeFreeze: 0,
        extraLife: 0,
        revealHint: 0
      }
    };

    this.survivalData.set(playerId, survivalState);
    this.saveSurvivalData();
    return survivalState;
  }

  updateSurvivalProgress(playerId, gameResult) {
    const survival = this.survivalData.get(playerId) || this.initializeSurvival(playerId);

    if (gameResult.won) {
      survival.level += 1;
      survival.consecutiveWins += 1;
      survival.score += gameResult.score;
      
      // Increase difficulty
      survival.timePerLevel = Math.max(30, survival.timePerLevel - 2);
      survival.pairsPerLevel = Math.min(15, survival.pairsPerLevel + 1);
      
      // Award power-ups for consecutive wins
      if (survival.consecutiveWins % 3 === 0) {
        survival.powerUps.timeFreeze += 1;
      }
      if (survival.consecutiveWins % 5 === 0) {
        survival.powerUps.extraLife += 1;
      }
      if (survival.consecutiveWins % 7 === 0) {
        survival.powerUps.revealHint += 1;
      }
    } else {
      survival.lives -= 1;
      survival.consecutiveWins = 0;
    }

    this.survivalData.set(playerId, survival);
    this.saveSurvivalData();
    return survival;
  }

  usePowerUp(playerId, powerUpType) {
    const survival = this.survivalData.get(playerId);
    if (!survival || !survival.powerUps[powerUpType] || survival.powerUps[powerUpType] <= 0) {
      return false;
    }

    survival.powerUps[powerUpType] -= 1;
    this.survivalData.set(playerId, survival);
    this.saveSurvivalData();
    return true;
  }

  // Puzzle Mode Patterns
  generatePuzzlePatterns() {
    return {
      sequence: {
        name: 'Sequential Pattern',
        description: 'Match pairs in a specific order',
        generator: (cards) => {
          // Create sequence where pairs must be matched in alphabetical order
          const sortedPairs = [...new Set(cards.map(c => c.emoji))].sort();
          return { requiredOrder: sortedPairs };
        }
      },
      memory: {
        name: 'Memory Challenge',
        description: 'Remember shown pattern, then match it',
        generator: (cards) => {
          // Show 3-5 cards briefly, then player must match them first
          const targetCards = cards.slice(0, Math.min(6, cards.length)).map(c => c.id);
          return { revealPattern: targetCards, revealTime: 3000 };
        }
      },
      cascade: {
        name: 'Cascade Pattern',
        description: 'Each match reveals more cards',
        generator: () => {
          // Only show 4 cards initially, reveal more as matches are made
          return { 
            cascadeReveal: true,
            initialVisible: 4,
            revealPerMatch: 2
          };
        }
      },
      mirror: {
        name: 'Mirror Match',
        description: 'Match pairs symmetrically across the board',
        generator: () => {
          // Cards must be matched in mirror positions
          return { mirrorMode: true };
        }
      }
    };
  }

  // Daily Challenges
  generateDailyChallenge(date = new Date()) {
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (this.dailyChallenges.has(dateKey)) {
      return this.dailyChallenges.get(dateKey);
    }

    // Use date as seed for consistent daily challenges
    const seed = this.hashCode(dateKey);
    const random = this.seededRandom(seed);

    const challenges = [
      {
        type: 'timeAttack',
        name: 'Speed Demon',
        description: 'Complete in under 45 seconds',
        difficulty: 'medium',
        timeLimit: 45,
        reward: { points: 1000, achievement: 'Speed Demon' }
      },
      {
        type: 'survival',
        name: 'Endurance Test',
        description: 'Reach level 5 in survival mode',
        targetLevel: 5,
        reward: { points: 1500, achievement: 'Survivor' }
      },
      {
        type: 'puzzle',
        name: 'Pattern Master',
        description: 'Complete 3 puzzle patterns perfectly',
        targetPerfect: 3,
        reward: { points: 1200, achievement: 'Pattern Master' }
      },
      {
        type: 'classic',
        name: 'Perfectionist',
        description: 'Complete without any wrong matches',
        perfectGame: true,
        difficulty: 'hard',
        reward: { points: 2000, achievement: 'Perfectionist' }
      }
    ];

    const todaysChallenge = challenges[Math.floor(random() * challenges.length)];
    todaysChallenge.date = dateKey;
    todaysChallenge.attempts = 0;
    todaysChallenge.completed = false;

    this.dailyChallenges.set(dateKey, todaysChallenge);
    this.saveDailyChallenges();
    return todaysChallenge;
  }

  completeDailyChallenge(date, result) {
    const dateKey = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const challenge = this.dailyChallenges.get(dateKey);
    
    if (!challenge || challenge.completed) {
      return null;
    }

    challenge.attempts += 1;

    // Check if challenge requirements are met
    let completed = false;
    switch (challenge.type) {
      case 'timeAttack':
        completed = result.won && result.time <= challenge.timeLimit;
        break;
      case 'survival':
        completed = result.level >= challenge.targetLevel;
        break;
      case 'puzzle':
        completed = result.perfectMatches >= challenge.targetPerfect;
        break;
      case 'classic':
        completed = result.won && result.perfectGame === challenge.perfectGame;
        break;
    }

    if (completed) {
      challenge.completed = true;
      challenge.completionTime = new Date().toISOString();
      this.saveDailyChallenges();
      return challenge.reward;
    }

    this.saveDailyChallenges();
    return null;
  }

  // Blitz Mode
  getBlitzSettings(difficulty) {
    const settings = {
      easy: {
        timePerPair: 3,
        penalty: 2,
        bonusTime: 1
      },
      medium: {
        timePerPair: 2.5,
        penalty: 3,
        bonusTime: 0.5
      },
      hard: {
        timePerPair: 2,
        penalty: 4,
        bonusTime: 0.5
      }
    };

    return settings[difficulty] || settings.medium;
  }

  // Helper functions
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  seededRandom(seed) {
    let x = seed;
    return function() {
      x ^= x << 13;
      x ^= x >> 17;
      x ^= x << 5;
      return (((x < 0) ? ~x + 1 : x) % 1000) / 1000;
    };
  }

  // Data persistence
  loadSavedData() {
    try {
      const dailyData = localStorage.getItem('memoryGame_dailyChallenges');
      if (dailyData) {
        const parsed = JSON.parse(dailyData);
        this.dailyChallenges = new Map(parsed);
      }

      const survivalDataStr = localStorage.getItem('memoryGame_survivalData');
      if (survivalDataStr) {
        const parsed = JSON.parse(survivalDataStr);
        this.survivalData = new Map(parsed);
      }
    } catch (error) {
      console.warn('Failed to load game mode data:', error);
    }
  }

  saveDailyChallenges() {
    try {
      localStorage.setItem('memoryGame_dailyChallenges', 
        JSON.stringify(Array.from(this.dailyChallenges.entries()))
      );
    } catch (error) {
      console.warn('Failed to save daily challenges:', error);
    }
  }

  saveSurvivalData() {
    try {
      localStorage.setItem('memoryGame_survivalData', 
        JSON.stringify(Array.from(this.survivalData.entries()))
      );
    } catch (error) {
      console.warn('Failed to save survival data:', error);
    }
  }

  // Get leaderboards for daily challenges
  getDailyLeaderboard() {
    // In a real app, this would fetch from server
    // For now, return mock data
    return [
      { name: 'Player1', score: 2500, time: 42 },
      { name: 'Player2', score: 2200, time: 47 },
      { name: 'Player3', score: 1800, time: 52 }
    ];
  }

  // Reset daily challenges (for testing)
  resetDailyChallenges() {
    this.dailyChallenges.clear();
    localStorage.removeItem('memoryGame_dailyChallenges');
  }

  // Get game mode statistics
  getGameModeStats(mode, playerId = 'default') {
    switch (mode) {
      case 'survival':
        return this.survivalData.get(playerId) || null;
      case 'daily': {
        const today = new Date().toISOString().split('T')[0];
        return this.dailyChallenges.get(today) || null;
      }
      default:
        return null;
    }
  }
}

// Export singleton instance
export const gameModeManager = new GameModeManager();
export default gameModeManager;

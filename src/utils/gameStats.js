// Game Statistics Manager
class GameStats {
  constructor() {
    this.storageKey = 'memoryGameStats';
    this.stats = this.loadStats();
  }

  loadStats() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
    
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      bestScore: 0,
      totalTime: 0,
      bestTime: Infinity,
      averageTime: 0,
      longestStreak: 0,
      perfectGames: 0,
      totalMoves: 0,
      bestMovesRatio: Infinity, // moves per pair
      
      // Per difficulty stats
      difficultyStats: {
        1: { played: 0, won: 0, bestScore: 0, bestTime: Infinity },
        2: { played: 0, won: 0, bestScore: 0, bestTime: Infinity },
        3: { played: 0, won: 0, bestScore: 0, bestTime: Infinity }
      },
      
      // Per theme stats
      themeStats: {},
      
      // Achievement tracking
      achievements: {
        firstWin: false,
        speedDemon: false, // Win in under 30 seconds
        perfectionist: false, // 10 perfect games
        marathoner: false, // 100 games played
        streakMaster: false, // 10+ streak
        themeExplorer: false, // Try all themes
        multitasker: false // Win in all difficulties
      },
      
      // Recent games (last 10)
      recentGames: [],
      
      // Daily stats
      dailyStats: {},
      
      lastPlayed: Date.now()
    };
  }

  saveStats() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
  }

  recordGameStart(difficulty, theme) {
    this.stats.gamesPlayed++;
    
    // Initialize theme stats if not exists
    if (!this.stats.themeStats[theme]) {
      this.stats.themeStats[theme] = { played: 0, won: 0, bestScore: 0 };
    }
    
    this.stats.difficultyStats[difficulty].played++;
    this.stats.themeStats[theme].played++;
    
    // Update daily stats
    const today = new Date().toDateString();
    if (!this.stats.dailyStats[today]) {
      this.stats.dailyStats[today] = { played: 0, won: 0, totalScore: 0 };
    }
    this.stats.dailyStats[today].played++;
    
    this.saveStats();
  }

  recordGameEnd(gameData) {
    // Validate gameData parameter
    if (!gameData || typeof gameData !== 'object') {
      console.error('Invalid gameData passed to recordGameEnd:', gameData);
      return null;
    }

    const {
      won,
      score,
      time,
      moves,
      difficulty,
      theme,
      gameMode,
      streak,
      perfectGame,
      pairs
    } = gameData;

    if (won) {
      this.stats.gamesWon++;
      
      // Safely update difficulty stats
      if (this.stats.difficultyStats && this.stats.difficultyStats[difficulty]) {
        this.stats.difficultyStats[difficulty].won++;
      }
      
      // Safely update theme stats
      if (this.stats.themeStats && this.stats.themeStats[theme]) {
        this.stats.themeStats[theme].won++;
      }
      
      // Update daily stats
      const today = new Date().toDateString();
      if (this.stats.dailyStats[today]) {
        this.stats.dailyStats[today].won++;
        this.stats.dailyStats[today].totalScore += (score || 0);
      }
      
      // Check for first win achievement
      if (this.stats.gamesWon === 1) {
        this.unlockAchievement('firstWin');
      }
    }

    // Update totals and bests (with safety checks)
    this.stats.totalScore += (score || 0);
    this.stats.totalTime += (time || 0);
    this.stats.totalMoves += (moves || 0);
    
    if ((score || 0) > this.stats.bestScore) {
      this.stats.bestScore = score || 0;
    }
    
    if (won && (time || 0) > 0 && (this.stats.bestTime === Infinity || time < this.stats.bestTime)) {
      this.stats.bestTime = time;
    }
    
    if ((streak || 0) > this.stats.longestStreak) {
      this.stats.longestStreak = streak || 0;
    }
    
    if (perfectGame) {
      this.stats.perfectGames++;
      if (this.stats.perfectGames >= 10) {
        this.unlockAchievement('perfectionist');
      }
    }
    
    // Update difficulty best scores and times (with safety checks)
    if (this.stats.difficultyStats && this.stats.difficultyStats[difficulty]) {
      const diffStat = this.stats.difficultyStats[difficulty];
      if ((score || 0) > diffStat.bestScore) {
        diffStat.bestScore = score || 0;
      }
      if (won && (time || 0) > 0 && (diffStat.bestTime === Infinity || time < diffStat.bestTime)) {
        diffStat.bestTime = time;
      }
    }
    
    // Update theme best score (with safety checks)
    if (this.stats.themeStats && this.stats.themeStats[theme] && (score || 0) > this.stats.themeStats[theme].bestScore) {
      this.stats.themeStats[theme].bestScore = score || 0;
    }
    
    // Calculate moves ratio (moves per pair) with safety checks
    if ((moves || 0) > 0 && (pairs || 0) > 0) {
      const movesRatio = moves / pairs;
      if (this.stats.bestMovesRatio === Infinity || movesRatio < this.stats.bestMovesRatio) {
        this.stats.bestMovesRatio = movesRatio;
      }
    }
    
    // Update averages
    this.stats.averageTime = this.stats.totalTime / this.stats.gamesPlayed;
    
    // Add to recent games
    this.stats.recentGames.unshift({
      date: Date.now(),
      won,
      score,
      time,
      moves,
      difficulty,
      theme,
      gameMode,
      perfectGame
    });
    
    // Keep only last 10 games
    if (this.stats.recentGames.length > 10) {
      this.stats.recentGames = this.stats.recentGames.slice(0, 10);
    }
    
    // Check achievements
    this.checkAchievements(gameData);
    
    this.stats.lastPlayed = Date.now();
    this.saveStats();
  }

  checkAchievements(gameData) {
    const { won, time, streak } = gameData;
    
    // Speed Demon: Win in under 30 seconds
    if (won && time < 30) {
      this.unlockAchievement('speedDemon');
    }
    
    // Marathoner: 100 games played
    if (this.stats.gamesPlayed >= 100) {
      this.unlockAchievement('marathoner');
    }
    
    // Streak Master: 10+ streak
    if (streak >= 10) {
      this.unlockAchievement('streakMaster');
    }
    
    // Theme Explorer: Try all themes (16 themes)
    const themesPlayed = Object.keys(this.stats.themeStats).length;
    if (themesPlayed >= 16) {
      this.unlockAchievement('themeExplorer');
    }
    
    // Multitasker: Win in all difficulties
    const allDifficultiesWon = Object.values(this.stats.difficultyStats)
      .every(diff => diff.won > 0);
    if (allDifficultiesWon) {
      this.unlockAchievement('multitasker');
    }
  }

  unlockAchievement(achievementKey) {
    if (!this.stats.achievements[achievementKey]) {
      this.stats.achievements[achievementKey] = true;
      // Return true to show notification
      return true;
    }
    return false;
  }

  getStats() {
    return { ...this.stats };
  }

  getWinRate() {
    return this.stats.gamesPlayed > 0 
      ? Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100) 
      : 0;
  }

  getAverageScore() {
    return this.stats.gamesPlayed > 0 
      ? Math.round(this.stats.totalScore / this.stats.gamesPlayed)
      : 0;
  }

  getPlayStreak() {
    // Calculate current play streak (consecutive days)
    const dates = Object.keys(this.stats.dailyStats)
      .sort((a, b) => new Date(b) - new Date(a));
    
    if (dates.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < dates.length; i++) {
      const date = new Date(dates[i]);
      const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  resetStats() {
    this.stats = this.loadStats();
    localStorage.removeItem(this.storageKey);
    this.stats = this.loadStats();
    this.saveStats();
  }
}

// Create singleton instance
const gameStats = new GameStats();

export default gameStats;

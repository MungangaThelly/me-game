// Custom Theme Manager
class CustomThemeManager {
  constructor() {
    this.storageKey = 'customThemes';
    this.customThemes = this.loadCustomThemes();
  }

  loadCustomThemes() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
    return {};
  }

  saveCustomThemes() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.customThemes));
  }

  createTheme(name, emojis, color, icon) {
    if (emojis.length < 10) {
      throw new Error('Theme must have at least 10 emojis');
    }

    const themeKey = `custom_${Date.now()}`;
    this.customThemes[themeKey] = {
      name,
      emojis: emojis.slice(0, 10), // Limit to 10 emojis
      color,
      icon,
      created: Date.now(),
      author: 'You',
      plays: 0,
      rating: 0,
      ratings: []
    };

    this.saveCustomThemes();
    return themeKey;
  }

  updateTheme(themeKey, updates) {
    if (this.customThemes[themeKey]) {
      this.customThemes[themeKey] = { 
        ...this.customThemes[themeKey], 
        ...updates,
        modified: Date.now()
      };
      this.saveCustomThemes();
    }
  }

  deleteTheme(themeKey) {
    if (this.customThemes[themeKey]) {
      delete this.customThemes[themeKey];
      this.saveCustomThemes();
    }
  }

  getTheme(themeKey) {
    return this.customThemes[themeKey];
  }

  getAllThemes() {
    return { ...this.customThemes };
  }

  rateTheme(themeKey, rating) {
    if (this.customThemes[themeKey] && rating >= 1 && rating <= 5) {
      const theme = this.customThemes[themeKey];
      theme.ratings.push(rating);
      theme.rating = theme.ratings.reduce((sum, r) => sum + r, 0) / theme.ratings.length;
      this.saveCustomThemes();
    }
  }

  incrementPlays(themeKey) {
    if (this.customThemes[themeKey]) {
      this.customThemes[themeKey].plays++;
      this.saveCustomThemes();
    }
  }

  exportTheme(themeKey) {
    const theme = this.customThemes[themeKey];
    if (theme) {
      return JSON.stringify({
        name: theme.name,
        emojis: theme.emojis,
        color: theme.color,
        icon: theme.icon,
        author: theme.author,
        exported: Date.now()
      });
    }
    return null;
  }

  importTheme(themeData) {
    try {
      const theme = JSON.parse(themeData);
      if (theme.name && theme.emojis && theme.color && theme.icon) {
        const themeKey = this.createTheme(
          `${theme.name} (Imported)`,
          theme.emojis,
          theme.color,
          theme.icon
        );
        if (theme.author) {
          this.updateTheme(themeKey, { author: theme.author });
        }
        return themeKey;
      }
    } catch (error) {
      throw new Error('Invalid theme data');
    }
  }

  // Predefined emoji categories for theme builder
  getEmojiCategories() {
    return {
      nature: ['🌿', '🌲', '🌺', '🌸', '🌻', '🌹', '🌷', '🌵', '🍄', '🌾', '🌱', '🌳', '🍀', '🌼', '💐'],
      food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍑', '🥭', '🍍', '🥝', '🍒', '🥥', '🍅', '🥕'],
      animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐧', '🦉'],
      objects: ['⚽', '🏀', '🎾', '🎲', '🎯', '🎪', '🎨', '🎭', '🎪', '🎺', '🎸', '🎹', '🎮', '🕹️', '🎊'],
      symbols: ['❤️', '💛', '💚', '💙', '💜', '🧡', '🖤', '🤍', '💕', '💖', '✨', '⭐', '🌟', '💫', '☄️'],
      shapes: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻']
    };
  }

  // Generate random theme
  generateRandomTheme() {
    const categories = this.getEmojiCategories();
    const categoryKeys = Object.keys(categories);
    const randomCategory = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
    const emojis = [...categories[randomCategory]].sort(() => 0.5 - Math.random()).slice(0, 10);
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      name: `Random ${randomCategory.charAt(0).toUpperCase() + randomCategory.slice(1)}`,
      emojis,
      color,
      icon: emojis[0]
    };
  }
}

// Create singleton instance
const customThemeManager = new CustomThemeManager();

export default customThemeManager;
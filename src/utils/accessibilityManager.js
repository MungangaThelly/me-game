/**
 * Accessibility Manager
 * Handles accessibility features including high contrast mode, 
 * screen reader support, keyboard navigation, and assistive technologies
 */

class AccessibilityManager {
  constructor() {
    this.preferences = this.loadPreferences();
    this.focusHistory = [];
    this.currentFocusIndex = -1;
    this.voiceEnabled = this.preferences.voiceAnnouncements;
    this.synth = window.speechSynthesis;
    
    this.init();
  }

  init() {
    this.applyAccessibilitySettings();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupVoiceAnnouncements();
  }

  // Preferences Management
  loadPreferences() {
    const saved = localStorage.getItem('accessibilityPreferences');
    if (saved) {
      return JSON.parse(saved);
    }
    
    return {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      keyboardNavigation: true,
      screenReader: false,
      voiceAnnouncements: false,
      focusIndicators: true,
      colorBlindMode: 'none', // none, protanopia, deuteranopia, tritanopia
      fontSize: 'normal', // small, normal, large, xlarge
      soundCues: true
    };
  }

  savePreferences() {
    localStorage.setItem('accessibilityPreferences', JSON.stringify(this.preferences));
  }

  updatePreference(key, value) {
    this.preferences[key] = value;
    this.savePreferences();
    this.applyAccessibilitySettings();
  }

  // High Contrast Mode
  enableHighContrast() {
    document.body.classList.add('high-contrast');
    this.updatePreference('highContrast', true);
    this.announce('High contrast mode enabled');
  }

  disableHighContrast() {
    document.body.classList.remove('high-contrast');
    this.updatePreference('highContrast', false);
    this.announce('High contrast mode disabled');
  }

  toggleHighContrast() {
    if (this.preferences.highContrast) {
      this.disableHighContrast();
    } else {
      this.enableHighContrast();
    }
  }

  // Colorblind Support
  setColorBlindMode(mode) {
    // Remove existing colorblind classes
    document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    
    if (mode !== 'none') {
      document.body.classList.add(mode);
      this.announce(`Color blind support enabled for ${mode}`);
    } else {
      this.announce('Color blind support disabled');
    }
    
    this.updatePreference('colorBlindMode', mode);
  }

  // Font Size Control
  setFontSize(size) {
    // Remove existing font size classes
    document.body.classList.remove('font-small', 'font-normal', 'font-large', 'font-xlarge');
    
    if (size !== 'normal') {
      document.body.classList.add(`font-${size}`);
    }
    
    this.updatePreference('fontSize', size);
    this.announce(`Font size changed to ${size}`);
  }

  // Reduced Motion
  enableReducedMotion() {
    document.body.classList.add('reduced-motion');
    this.updatePreference('reducedMotion', true);
    this.announce('Reduced motion enabled');
  }

  disableReducedMotion() {
    document.body.classList.remove('reduced-motion');
    this.updatePreference('reducedMotion', false);
    this.announce('Reduced motion disabled');
  }

  toggleReducedMotion() {
    if (this.preferences.reducedMotion) {
      this.disableReducedMotion();
    } else {
      this.enableReducedMotion();
    }
  }

  // Keyboard Navigation
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    document.addEventListener('focus', (e) => this.handleFocusChange(e), true);
  }

  handleKeyboardNavigation(e) {
    if (!this.preferences.keyboardNavigation) return;

    switch (e.key) {
      case 'Tab':
        this.handleTabNavigation(e);
        break;
      case 'Enter':
      case ' ':
        this.handleActivation(e);
        break;
      case 'Escape':
        this.handleEscape(e);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.handleArrowNavigation(e);
        break;
      case 'Home':
        this.focusFirst(e);
        break;
      case 'End':
        this.focusLast(e);
        break;
    }
  }

  handleTabNavigation(e) {
    const focusableElements = this.getFocusableElements();
    
    if (focusableElements.length === 0) return;

    if (e.shiftKey) {
      // Shift+Tab - go backwards
      if (document.activeElement === focusableElements[0]) {
        e.preventDefault();
        focusableElements[focusableElements.length - 1].focus();
      }
    } else {
      // Tab - go forward
      if (document.activeElement === focusableElements[focusableElements.length - 1]) {
        e.preventDefault();
        focusableElements[0].focus();
      }
    }
  }

  handleActivation(e) {
    const element = document.activeElement;
    
    if (element && (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button')) {
      e.preventDefault();
      element.click();
      this.announce(`Activated ${this.getElementDescription(element)}`);
    }
  }

  handleEscape() {
    // Close modals or return focus
    const modal = document.querySelector('.modal:not([hidden])');
    if (modal) {
      const closeButton = modal.querySelector('.close-button');
      if (closeButton) {
        closeButton.click();
      }
    }
  }

  handleArrowNavigation(e) {
    // Handle arrow navigation for grids and lists
    const element = document.activeElement;
    const container = element.closest('[role="grid"], [role="listbox"], .theme-grid, .card-grid');
    
    if (!container) return;

    e.preventDefault();
    
    const items = container.querySelectorAll('[tabindex], button, [role="gridcell"], [role="option"]');
    const currentIndex = Array.from(items).indexOf(element);
    
    let newIndex = currentIndex;
    
    if (container.classList.contains('card-grid')) {
      // Handle card grid navigation
      const columns = Math.floor(container.offsetWidth / 100); // Approximate
      
      switch (e.key) {
        case 'ArrowLeft':
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case 'ArrowRight':
          newIndex = Math.min(items.length - 1, currentIndex + 1);
          break;
        case 'ArrowUp':
          newIndex = Math.max(0, currentIndex - columns);
          break;
        case 'ArrowDown':
          newIndex = Math.min(items.length - 1, currentIndex + columns);
          break;
      }
    } else {
      // Handle linear navigation
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          newIndex = Math.min(items.length - 1, currentIndex + 1);
          break;
      }
    }
    
    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
      this.announce(this.getElementDescription(items[newIndex]));
    }
  }

  focusFirst(e) {
    e.preventDefault();
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  focusLast(e) {
    e.preventDefault();
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }

  getFocusableElements() {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="gridcell"]',
      '[role="option"]'
    ];
    
    return Array.from(document.querySelectorAll(selectors.join(', ')))
      .filter(element => {
        return element.offsetWidth > 0 && 
               element.offsetHeight > 0 && 
               !element.hidden &&
               window.getComputedStyle(element).visibility !== 'hidden';
      });
  }

  // Focus Management
  setupFocusManagement() {
    // Add focus indicators
    if (this.preferences.focusIndicators) {
      document.body.classList.add('focus-indicators');
    }
  }

  handleFocusChange(e) {
    if (this.preferences.focusIndicators) {
      // Announce focus changes for screen readers
      const description = this.getElementDescription(e.target);
      if (description && this.preferences.screenReader) {
        this.announce(description, true); // Immediate announcement
      }
    }
  }

  // Voice Announcements
  setupVoiceAnnouncements() {
    if (this.voiceEnabled && this.synth) {
      this.announce('Voice announcements enabled');
    }
  }

  announce(text, immediate = false) {
    if (!this.voiceEnabled || !this.synth || !text) return;

    // Cancel previous speech if immediate
    if (immediate) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.2;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    // Set voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(voice => voice.lang.startsWith('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synth.speak(utterance);
  }

  // Screen Reader Support
  getElementDescription(element) {
    if (!element) return '';

    // Check for aria-label first
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }

    // Check for aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) {
        return labelElement.textContent;
      }
    }

    // Get text content or value
    if (element.tagName === 'INPUT') {
      const type = element.type;
      const value = element.value;
      
      if (type === 'checkbox' || type === 'radio') {
        const checked = element.checked ? 'checked' : 'unchecked';
        return `${element.labels?.[0]?.textContent || 'Option'} ${checked}`;
      }
      
      return `Input ${type} ${value ? 'with value ' + value : 'empty'}`;
    }

    if (element.tagName === 'BUTTON') {
      return `Button ${element.textContent || element.innerHTML.replace(/<[^>]*>/g, '')}`;
    }

    // Card descriptions
    if (element.classList.contains('card')) {
      const cardValue = element.querySelector('.card-back')?.textContent;
      const isFlipped = element.classList.contains('flipped');
      const isMatched = element.classList.contains('matched');
      
      if (isMatched) {
        return `Matched card ${cardValue}`;
      } else if (isFlipped) {
        return `Flipped card showing ${cardValue}`;
      } else {
        return 'Card face down';
      }
    }

    // Theme buttons
    if (element.classList.contains('theme-btn')) {
      const themeName = element.querySelector('.theme-name')?.textContent;
      const isActive = element.classList.contains('active');
      return `Theme ${themeName} ${isActive ? 'selected' : ''}`;
    }

    return element.textContent || element.getAttribute('title') || element.tagName.toLowerCase();
  }

  // Game-specific accessibility
  announceGameEvent(event, details = {}) {
    let message = '';

    switch (event) {
      case 'cardFlipped':
        message = `Card flipped showing ${details.value}`;
        break;
      case 'match':
        message = `Match found! ${details.value}`;
        break;
      case 'noMatch':
        message = 'No match, cards flipped back';
        break;
      case 'gameWon':
        message = `Congratulations! Game completed in ${details.time} seconds with ${details.moves} moves`;
        break;
      case 'gameStarted':
        message = `New game started. ${details.difficulty} difficulty with ${details.theme} theme`;
        break;
      case 'themeChanged':
        message = `Theme changed to ${details.theme}`;
        break;
      case 'difficultyChanged':
        message = `Difficulty changed to ${details.difficulty}`;
        break;
      case 'scoreUpdate':
        message = `Score updated. Current score: ${details.score}`;
        break;
    }

    if (message) {
      this.announce(message);
    }
  }

  // Apply all accessibility settings
  applyAccessibilitySettings() {
    // High contrast
    if (this.preferences.highContrast) {
      document.body.classList.add('high-contrast');
    }

    // Font size
    if (this.preferences.fontSize !== 'normal') {
      document.body.classList.add(`font-${this.preferences.fontSize}`);
    }

    // Colorblind mode
    if (this.preferences.colorBlindMode !== 'none') {
      document.body.classList.add(this.preferences.colorBlindMode);
    }

    // Reduced motion
    if (this.preferences.reducedMotion) {
      document.body.classList.add('reduced-motion');
    }

    // Focus indicators
    if (this.preferences.focusIndicators) {
      document.body.classList.add('focus-indicators');
    }
  }

  // Public API
  getPreferences() {
    return { ...this.preferences };
  }

  isEnabled(feature) {
    return this.preferences[feature] || false;
  }

  enableVoice() {
    this.voiceEnabled = true;
    this.updatePreference('voiceAnnouncements', true);
    this.announce('Voice announcements enabled');
  }

  disableVoice() {
    this.voiceEnabled = false;
    this.updatePreference('voiceAnnouncements', false);
    if (this.synth) {
      this.synth.cancel();
    }
  }

  toggleVoice() {
    if (this.voiceEnabled) {
      this.disableVoice();
    } else {
      this.enableVoice();
    }
  }
}

// Export singleton instance
const accessibilityManager = new AccessibilityManager();
export default accessibilityManager;

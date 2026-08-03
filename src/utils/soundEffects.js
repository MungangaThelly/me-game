// Sound Effects Manager
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.enabled = localStorage.getItem('soundEnabled') !== 'false';
    this.volume = parseFloat(localStorage.getItem('soundVolume') || '0.5');
    this.initialized = false;
    
    // Don't initialize audio immediately - wait for user interaction
    this.setupUserInteractionListener();
    this.preloadSounds();
  }

  setupUserInteractionListener() {
    // Wait for first user interaction to initialize audio
    const initOnUserGesture = () => {
      if (!this.initialized) {
        this.initAudioContext();
      }
      // Capture runs before React handlers, so the first control press can play sound.
      document.removeEventListener('click', initOnUserGesture, true);
      document.removeEventListener('keydown', initOnUserGesture, true);
      document.removeEventListener('touchstart', initOnUserGesture, true);
    };
    
    document.addEventListener('click', initOnUserGesture, true);
    document.addEventListener('keydown', initOnUserGesture, true);
    document.addEventListener('touchstart', initOnUserGesture, true);
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('Audio context initialized after user interaction');
    } catch {
      console.warn('Web Audio API not supported, falling back to HTML5 audio');
    }
  }

  // Generate sounds using Web Audio API
  generateTone(frequency, duration, type = 'sine') {
    if (!this.audioContext || !this.enabled || !this.initialized) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Generate complex sounds
  generateComplexSound(config) {
    if (!this.audioContext || !this.enabled) return;

    config.notes.forEach((note, index) => {
      setTimeout(() => {
        this.generateTone(note.frequency, note.duration, note.type);
      }, index * (config.delay || 50));
    });
  }

  preloadSounds() {
    // Card flip sound - quick high pitched click
    this.sounds.cardFlip = () => {
      this.generateTone(800, 0.1, 'square');
    };

    // Match success - pleasant chime
    this.sounds.match = () => {
      this.generateComplexSound({
        notes: [
          { frequency: 523, duration: 0.2, type: 'sine' }, // C5
          { frequency: 659, duration: 0.2, type: 'sine' }, // E5
          { frequency: 784, duration: 0.3, type: 'sine' }  // G5
        ],
        delay: 60
      });
    };

    // Wrong match - subtle disappointment
    this.sounds.noMatch = () => {
      this.generateTone(200, 0.2, 'sawtooth');
    };

    // Game complete - victory fanfare
    this.sounds.gameComplete = () => {
      const victoryNotes = [
        { frequency: 523, duration: 0.15, type: 'sine' }, // C5
        { frequency: 659, duration: 0.15, type: 'sine' }, // E5
        { frequency: 784, duration: 0.15, type: 'sine' }, // G5
        { frequency: 1047, duration: 0.4, type: 'sine' }, // C6
      ];
      
      this.generateComplexSound({
        notes: victoryNotes,
        delay: 80
      });
    };

    // Button hover - subtle feedback
    this.sounds.buttonHover = () => {
      this.generateTone(400, 0.05, 'sine');
    };

    // Button click
    this.sounds.buttonClick = () => {
      this.generateTone(600, 0.08, 'triangle');
    };

    // Theme change
    this.sounds.themeChange = () => {
      this.generateTone(350, 0.12, 'sine');
    };

    // Auto-setup step
    this.sounds.autoSetupStep = () => {
      this.generateComplexSound({
        notes: [
          { frequency: 440, duration: 0.1, type: 'sine' },
          { frequency: 554, duration: 0.1, type: 'sine' }
        ],
        delay: 30
      });
    };

    this.sounds.modeChange = () => {
      this.generateComplexSound({
        notes: [
          { frequency: 392, duration: 0.1, type: 'triangle' },
          { frequency: 523, duration: 0.16, type: 'triangle' }
        ],
        delay: 45
      });
    };

    this.sounds.powerUp = () => {
      this.generateComplexSound({
        notes: [
          { frequency: 523, duration: 0.1, type: 'sine' },
          { frequency: 659, duration: 0.12, type: 'sine' },
          { frequency: 880, duration: 0.22, type: 'sine' }
        ],
        delay: 45
      });
    };

    this.sounds.achievement = () => {
      this.generateComplexSound({
        notes: [
          { frequency: 659, duration: 0.14, type: 'triangle' },
          { frequency: 784, duration: 0.14, type: 'triangle' },
          { frequency: 1047, duration: 0.32, type: 'sine' }
        ],
        delay: 70
      });
    };
  }

  // Public methods
  play(soundName) {
    if (this.sounds[soundName] && this.enabled && this.initialized) {
      try {
        // Resume audio context if suspended (required by browsers)
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        this.sounds[soundName]();
      } catch (error) {
        console.warn('Sound play failed:', error);
      }
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', enabled.toString());
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundVolume', this.volume.toString());
  }

  isEnabled() {
    return this.enabled;
  }

  getVolume() {
    return this.volume;
  }
}

// Create singleton instance
const soundManager = new SoundManager();

export default soundManager;

// Mobile Enhancement Manager
// Handles touch gestures, haptic feedback, PWA features, and mobile optimizations

class MobileManager {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isIOS = this.detectIOS();
    this.isAndroid = this.detectAndroid();
    this.supportsHaptics = this.detectHapticSupport();
    this.isStandalone = this.detectStandalone();
    this.touchStartPos = { x: 0, y: 0 };
    this.touchEndPos = { x: 0, y: 0 };
    this.swipeThreshold = 50;
    this.tapTimeout = null;
    this.doubleTapTimeout = null;
    this.longPressTimeout = null;
    
    this.init();
  }

  init() {
    // Initialize PWA deferred prompt
    this.initializeDeferredPrompt();
    
    if (this.isMobile) {
      this.setupViewportMeta();
      this.setupMobileOptimizations();
      this.setupPWAFeatures();
    }
  }

  // Device Detection
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768 ||
           ('ontouchstart' in window);
  }

  detectIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  detectAndroid() {
    return /Android/.test(navigator.userAgent);
  }

  detectHapticSupport() {
    return 'vibrate' in navigator || 
           'hapticFeedback' in navigator ||
           (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function');
  }

  detectStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // Touch Events Setup
  setupTouchEvents() {
    // Prevent default touch behaviors that interfere with game
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Prevent context menu on long press
    document.addEventListener('contextmenu', (e) => {
      if (this.isMobile) {
        e.preventDefault();
      }
    });

    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  handleTouchStart(event) {
    if (event.touches.length > 1) {
      event.preventDefault(); // Prevent multi-touch gestures
      return;
    }

    const touch = event.touches[0];
    this.touchStartPos = { x: touch.clientX, y: touch.clientY };
    this.touchStartTime = Date.now();

    // Setup long press detection
    this.longPressTimeout = setTimeout(() => {
      this.handleLongPress(touch);
    }, 500);
  }

  handleTouchMove(event) {
    if (event.touches.length > 1) {
      event.preventDefault();
      return;
    }

    // Clear long press if finger moves
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }

    // Prevent scrolling during game interaction
    const target = event.target.closest('.card, .game-controls, .memory-game');
    if (target) {
      event.preventDefault();
    }
  }

  handleTouchEnd(event) {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }

    if (event.changedTouches.length === 0) return;

    const touch = event.changedTouches[0];
    this.touchEndPos = { x: touch.clientX, y: touch.clientY };
    this.touchEndTime = Date.now();

    const deltaX = this.touchEndPos.x - this.touchStartPos.x;
    const deltaY = this.touchEndPos.y - this.touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = this.touchEndTime - this.touchStartTime;

    // Handle different gesture types
    if (distance < 10 && duration < 300) {
      this.handleTap(touch);
    } else if (distance > this.swipeThreshold) {
      this.handleSwipe(deltaX, deltaY);
    }
  }

  handleTap(touch) {
    // Double tap detection
    if (this.doubleTapTimeout) {
      clearTimeout(this.doubleTapTimeout);
      this.doubleTapTimeout = null;
      this.handleDoubleTap(touch);
    } else {
      this.doubleTapTimeout = setTimeout(() => {
        this.doubleTapTimeout = null;
        this.handleSingleTap(touch);
      }, 300);
    }
  }

  handleSingleTap(touch) {
    // Emit custom tap event
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target) {
      const event = new CustomEvent('mobileTap', {
        detail: { target, position: { x: touch.clientX, y: touch.clientY } }
      });
      target.dispatchEvent(event);
    }
  }

  handleDoubleTap(touch) {
    // Emit custom double tap event
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target) {
      const event = new CustomEvent('mobileDoubleTap', {
        detail: { target, position: { x: touch.clientX, y: touch.clientY } }
      });
      target.dispatchEvent(event);
    }
  }

  handleLongPress(touch) {
    // Emit custom long press event
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target) {
      const event = new CustomEvent('mobileLongPress', {
        detail: { target, position: { x: touch.clientX, y: touch.clientY } }
      });
      target.dispatchEvent(event);
    }
  }

  handleSwipe(deltaX, deltaY) {
    const direction = this.getSwipeDirection(deltaX, deltaY);
    const event = new CustomEvent('mobileSwipe', {
      detail: { direction, deltaX, deltaY }
    });
    document.dispatchEvent(event);
  }

  getSwipeDirection(deltaX, deltaY) {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  // Haptic Feedback
  hapticFeedback(type = 'light') {
    if (!this.supportsHaptics) return;

    try {
      if (navigator.vibrate) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [50],
          success: [10, 50, 10],
          error: [100, 50, 100],
          click: [5],
          match: [20, 10, 20, 10, 30]
        };
        navigator.vibrate(patterns[type] || patterns.light);
      }
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
  }

  // Viewport and Mobile Optimizations
  setupViewportMeta() {
    // Ensure proper viewport meta tag
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  }

  setupMobileOptimizations() {
    // Add mobile-specific CSS class
    document.body.classList.add('mobile-device');
    
    if (this.isIOS) {
      document.body.classList.add('ios-device');
    }
    
    if (this.isAndroid) {
      document.body.classList.add('android-device');
    }

    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });

    // Handle keyboard visibility on mobile
    if (this.isMobile) {
      let initialViewportHeight = window.innerHeight;
      
      window.addEventListener('resize', () => {
        const currentHeight = window.innerHeight;
        const heightDifference = initialViewportHeight - currentHeight;
        
        if (heightDifference > 150) {
          document.body.classList.add('keyboard-visible');
        } else {
          document.body.classList.remove('keyboard-visible');
        }
      });
    }
  }

  handleOrientationChange() {
    // Force layout recalculation
    const gameContainer = document.querySelector('.memory-game');
    if (gameContainer) {
      gameContainer.style.display = 'none';
      gameContainer.offsetHeight; // Trigger reflow
      gameContainer.style.display = '';
    }

    // Emit orientation change event
    const orientation = window.orientation;
    const event = new CustomEvent('mobileOrientationChange', {
      detail: { orientation, isLandscape: Math.abs(orientation) === 90 }
    });
    document.dispatchEvent(event);
  }

  // PWA Features
  setupPWAFeatures() {
    this.setupServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineSupport();
  }

  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registered successfully');
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailable();
            }
          });
        });
      } catch (error) {
        console.log('ServiceWorker registration failed:', error);
      }
    }
  }

  setupInstallPrompt() {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.showInstallButton();
    });

    // Handle install button click
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('install-pwa-btn')) {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
          }
          deferredPrompt = null;
          this.hideInstallButton();
        }
      }
    });
  }

  showInstallButton() {
    const existingButton = document.querySelector('.install-pwa-btn');
    if (existingButton) return;

    const button = document.createElement('button');
    button.className = 'install-pwa-btn';
    button.textContent = '📱 Install App';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      z-index: 1000;
      cursor: pointer;
      transform: translateY(100px);
      transition: transform 0.3s ease;
    `;

    document.body.appendChild(button);
    
    // Animate in
    setTimeout(() => {
      button.style.transform = 'translateY(0)';
    }, 100);
  }

  hideInstallButton() {
    const button = document.querySelector('.install-pwa-btn');
    if (button) {
      button.style.transform = 'translateY(100px)';
      setTimeout(() => button.remove(), 300);
    }
  }

  showUpdateAvailable() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';

    const message = document.createElement('span');
    message.textContent = 'New version available!';

    const updateButton = document.createElement('button');
    updateButton.type = 'button';
    updateButton.textContent = 'Update';
    updateButton.addEventListener('click', () => window.location.reload());

    notification.append(message, updateButton);
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 1000;
      display: flex;
      gap: 15px;
      align-items: center;
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  setupOfflineSupport() {
    // Cache game data for offline play
    this.cacheGameData();
    
    // Handle online/offline status
    window.addEventListener('online', () => {
      this.showConnectionStatus('online');
    });

    window.addEventListener('offline', () => {
      this.showConnectionStatus('offline');
    });
  }

  cacheGameData() {
    if ('caches' in window) {
      const gameData = {
        themes: localStorage.getItem('customThemes') || '{}',
        stats: localStorage.getItem('memoryGameStats') || '{}',
        preferences: localStorage.getItem('gamePreferences') || '{}'
      };
      
      // Store in cache for offline access
      caches.open('memory-game-data').then(cache => {
        cache.put('/game-data', new Response(JSON.stringify(gameData)));
      });
    }
  }

  async loadOfflineData() {
    if ('caches' in window) {
      try {
        const cache = await caches.open('memory-game-data');
        const response = await cache.match('/game-data');
        if (response) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Failed to load offline data:', error);
      }
    }
    return null;
  }

  showConnectionStatus(status) {
    const indicator = document.createElement('div');
    indicator.className = `connection-status ${status}`;
    indicator.textContent = status === 'online' ? '🟢 Online' : '🔴 Offline';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      padding: 8px 15px;
      background: ${status === 'online' ? '#4CAF50' : '#f44336'};
      color: white;
      border-radius: 20px;
      font-size: 14px;
      z-index: 1000;
      transform: translateY(-100px);
      transition: transform 0.3s ease;
    `;

    document.body.appendChild(indicator);

    // Animate in
    setTimeout(() => {
      indicator.style.transform = 'translateY(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      indicator.style.transform = 'translateY(-100px)';
      setTimeout(() => indicator.remove(), 300);
    }, 3000);
  }

  // Mobile-specific game optimizations
  optimizeForMobile() {
    return {
      // Larger touch targets
      cardMinSize: '60px',
      
      // Reduced animations for performance
      reducedMotion: this.isMobile,
      
      // Touch-friendly controls
      buttonMinHeight: '44px',
      
      // Optimized grid for mobile screens
      mobileGridColumns: this.getMobileGridColumns(),
      
      // Battery-saving features
      reducedParticles: true,
      
      // Touch feedback settings
      hapticEnabled: this.supportsHaptics
    };
  }

  getMobileGridColumns() {
    const width = window.innerWidth;
    if (width < 380) return 3; // Very small phones
    if (width < 480) return 4; // Small phones
    if (width < 768) return 5; // Large phones
    return 6; // Tablets
  }

  // Performance monitoring
  monitorRenderPerformance() {
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'memory-game-render' && entry.duration > 16.67) {
            console.warn('Slow render detected:', entry.duration + 'ms');
            this.optimizePerformance();
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure'] });
    }
  }

  optimizePerformance() {
    // Reduce visual effects on slower devices
    document.body.classList.add('performance-mode');
    
    // Disable expensive animations
    const style = document.createElement('style');
    style.textContent = `
      .performance-mode .particle { display: none !important; }
      .performance-mode .card { transition-duration: 0.2s !important; }
      .performance-mode .confetti { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  // Utility methods
  isMobileDevice() {
    return this.isMobile;
  }

  getDeviceInfo() {
    return {
      isMobile: this.isMobile,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      supportsHaptics: this.supportsHaptics,
      isStandalone: this.isStandalone,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  // PWA Installation Methods
  canInstallPWA() {
    // iOS Safari does not expose beforeinstallprompt, so keep the manual
    // "Add to Home Screen" action available there.
    return !this.isStandalone && (this.isIOS || this.deferredPrompt !== null);
  }

  promptPWAInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        this.deferredPrompt = null;
      });
    } else {
      // Show manual install instructions
      this.showInstallInstructions();
    }
  }

  showInstallInstructions() {
    let instructions;
    if (this.isIOS) {
      instructions = 'To install this app on your iOS device, tap the Share button and then "Add to Home Screen".';
    } else if (this.isAndroid) {
      instructions = 'To install this app, tap the menu button and select "Add to Home Screen" or "Install App".';
    } else {
      instructions = 'To install this app, look for the install button in your browser\'s address bar.';
    }
    
    alert(instructions);
  }

  // Initialize all mobile features
  initializeMobileFeatures() {
    console.log('Initializing mobile features...');
    
    if (this.isMobile) {
      this.setupViewportMeta();
      this.setupMobileOptimizations();
      this.setupPWAFeatures();
    }
    
    // Initialize performance monitoring
    this.startPerformanceMonitoring();
    
    console.log('Mobile features initialized successfully');
  }

  // Setup touch gestures for a specific element
  setupTouchGestures(element, callbacks = {}) {
    if (!element || !this.isMobile) return;

    const handleTouchStart = (e) => {
      this.touchStartPos = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    };

    const handleTouchEnd = (e) => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      
      this.touchEndPos = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      };

      const deltaX = this.touchEndPos.x - this.touchStartPos.x;
      const deltaY = this.touchEndPos.y - this.touchStartPos.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (Math.max(absDeltaX, absDeltaY) < this.swipeThreshold) return;

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && callbacks.onSwipeRight) {
          callbacks.onSwipeRight();
        } else if (deltaX < 0 && callbacks.onSwipeLeft) {
          callbacks.onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && callbacks.onSwipeDown) {
          callbacks.onSwipeDown();
        } else if (deltaY < 0 && callbacks.onSwipeUp) {
          callbacks.onSwipeUp();
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Store handlers for cleanup
    element._touchHandlers = { handleTouchStart, handleTouchEnd };
  }

  // Remove touch gestures from element
  removeTouchGestures(element) {
    if (!element || !element._touchHandlers) return;
    
    element.removeEventListener('touchstart', element._touchHandlers.handleTouchStart);
    element.removeEventListener('touchend', element._touchHandlers.handleTouchEnd);
    delete element._touchHandlers;
  }

  // Performance monitoring
  monitorPerformance(callback) {
    if (typeof callback !== 'function') return;

    let frameCount = 0;
    let lastTime = performance.now();
    let reportInterval = 5000; // Report every 5 seconds instead of every second
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= reportInterval) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        callback({
          fps,
          memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
          timestamp: currentTime
        });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  // Setup PWA prompt
  setupPWAPrompt() {
    // This method can trigger PWA installation prompts if available
    if (this.deferredPrompt) {
      console.log('PWA installation prompt is available');
    } else {
      console.log('PWA installation prompt is not available yet');
    }
  }

  // Start performance monitoring
  startPerformanceMonitoring() {
    if ('performance' in window && 'requestAnimationFrame' in window) {
      this.monitorPerformance((metrics) => {
        // Log performance metrics for debugging
        if (metrics.fps < 30) {
          console.warn('Low FPS detected:', metrics.fps);
        }
      });
    }
  }

  // Initialize deferred prompt property
  initializeDeferredPrompt() {
    this.deferredPrompt = null;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('PWA install prompt available');
    });
  }
}

// Create service worker content
export const serviceWorkerContent = `
const CACHE_NAME = 'memory-game-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/components/MemoryGame.jsx',
  '/src/components/MemoryGame.css',
  '/src/utils/soundEffects.js',
  '/src/utils/animations.js',
  '/src/utils/gameStats.js',
  '/src/utils/customThemes.js',
  '/src/utils/multiplayerManager.js',
  '/src/utils/accessibilityManager.js',
  '/src/utils/gameModes.js',
  '/src/utils/mobileManager.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;

// Export singleton instance
export const mobileManager = new MobileManager();
export default mobileManager;

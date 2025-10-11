// Particle Effects and Animation System
export class ParticleEffect {
  constructor(container, type = 'confetti') {
    this.container = container;
    this.type = type;
    this.particles = [];
    this.animationFrame = null;
  }

  createConfetti(x, y, count = 30) {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    
    for (let i = 0; i < count; i++) {
      const particle = {
        id: Math.random(),
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        gravity: 0.1,
        life: 1.0,
        decay: 0.02
      };
      this.particles.push(particle);
    }
    
    if (!this.animationFrame) {
      this.animate();
    }
  }

  createSparkles(x, y, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      
      const particle = {
        id: Math.random(),
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: 0,
        rotationSpeed: 0,
        color: '#ffd700',
        size: Math.random() * 4 + 2,
        gravity: 0,
        life: 1.0,
        decay: 0.04,
        sparkle: true
      };
      this.particles.push(particle);
    }
    
    if (!this.animationFrame) {
      this.animate();
    }
  }

  animate() {
    this.particles.forEach((particle, index) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += particle.gravity;
      particle.rotation += particle.rotationSpeed;
      
      // Update life
      particle.life -= particle.decay;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(index, 1);
      }
    });

    this.render();

    if (this.particles.length > 0) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    } else {
      this.animationFrame = null;
    }
  }

  render() {
    // Remove existing particles from DOM
    const existingParticles = this.container.querySelectorAll('.particle');
    existingParticles.forEach(p => p.remove());

    // Add current particles
    this.particles.forEach(particle => {
      const element = document.createElement('div');
      element.className = 'particle';
      element.style.cssText = `
        position: absolute;
        left: ${particle.x}px;
        top: ${particle.y}px;
        width: ${particle.size}px;
        height: ${particle.size}px;
        background-color: ${particle.color};
        transform: rotate(${particle.rotation}deg);
        opacity: ${particle.life};
        pointer-events: none;
        z-index: 1000;
        ${particle.sparkle ? 'border-radius: 50%; box-shadow: 0 0 6px currentColor;' : ''}
      `;
      
      this.container.appendChild(element);
    });
  }

  clear() {
    this.particles = [];
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    const existingParticles = this.container.querySelectorAll('.particle');
    existingParticles.forEach(p => p.remove());
  }
}

// Animation utilities
export const animationUtils = {
  // Card entrance animation
  cardEntrance: (element, delay = 0) => {
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8) rotateY(90deg)';
    element.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1) rotateY(0deg)';
    }, delay);
  },

  // Match celebration
  matchCelebration: (element) => {
    element.style.animation = 'matchCelebration 0.8s ease-out';
    
    // Reset animation after completion
    setTimeout(() => {
      element.style.animation = '';
    }, 800);
  },

  // Button bounce
  buttonBounce: (element) => {
    element.style.animation = 'buttonBounce 0.3s ease';
    setTimeout(() => {
      element.style.animation = '';
    }, 300);
  },

  // Shake animation for wrong matches
  shake: (element) => {
    element.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
      element.style.animation = '';
    }, 500);
  },

  // Pulse animation
  pulse: (element, duration = 1000) => {
    element.style.animation = `pulse ${duration}ms ease-in-out`;
    setTimeout(() => {
      element.style.animation = '';
    }, duration);
  }
};
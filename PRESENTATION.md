# Memory Game Pro

> A multilingual memory game for children, families, and casual players.

[Play the live game](https://letplayalways.it-weor.se/) ·
[View the source](https://github.com/MungangaThelly/me-game)

## Overview

Memory Game Pro is a responsive React card-matching game. It combines several
local game modes, one-to-four-player play on the same device, emoji themes,
accessibility preferences, statistics, sound feedback, and installable
Progressive Web App support.

The French interface uses the dashboard title **Le Royaume des Enfants**.

## Current features

### Game modes

- **Classic** — traditional matching without time pressure
- **Time Attack** — complete the board within a time limit
- **Survival** — progressive rounds with lives and power-ups
- **Puzzle** — pattern-focused challenges
- **Daily Challenge** — a deterministic challenge for the current date
- **Blitz** — short rounds with rapid decisions

### Players and themes

- Solo, two-player versus, and four-player team configurations
- Turn-based local play on one device
- 16 built-in emoji theme categories
- User-created themes stored locally in the browser
- Theme import and export

### Languages

- English
- Swedish
- French

Language changes apply immediately. In French, the main game heading is
**Le Royaume des Enfants**.

### Guided setup

On phones and desktop browsers, manual selections guide the player through:

1. Game mode
2. Number of players
3. Theme
4. Difficulty
5. Language
6. Game board

The page scrolls smoothly to the next section after each choice and respects the
user's reduced-motion preference. Players can still scroll manually at any time.

### Mobile and PWA

- Responsive controls and card layouts
- Native vertical scrolling on mobile
- Left/right theme swipe support
- Touch and optional vibration feedback
- Web app manifest and service worker
- Offline application shell and runtime asset caching
- Browser installation prompt where supported
- Manual **Add to Home Screen** instructions on iPhone and iPad

### Accessibility and preferences

- Keyboard-operable game controls
- Visible focus styles
- High-contrast, larger-text, reduced-motion, and color-vision preferences
- Optional sound with adjustable volume
- Visual feedback alongside sound feedback

These features improve accessibility, but the project does not claim formal
WCAG certification.

### Statistics

Game statistics, achievements, preferences, and custom themes are stored in the
browser with `localStorage`. The app does not upload this data to a server.

## Multiplayer scope

The included interface demonstrates local multiplayer and mock room flows. The
multiplayer manager can connect to a WebSocket endpoint, but this repository
does not include a production multiplayer backend.

Consequently, production-ready online rooms, cross-device synchronization,
global leaderboards, and tournaments require a separate server.

## Technology

- React 19
- Vite 6
- React Router
- i18next and react-i18next
- Browser storage, Web Audio, vibration, service worker, and PWA APIs
- Node's built-in test runner
- ESLint

## Quality checks

The repository includes tests for:

- Card generation, completion, and match progress
- Daily challenge determinism and game-mode rules
- Translation-key parity across English, Swedish, and French
- Guided mobile navigation
- Reduced-motion behavior
- Service-worker and Netlify fallback configuration
- iOS installation guidance

Run the complete validation locally:

```bash
npm test
npm run lint
npm run build
npm audit
```

## Deployment

The production site is hosted on Netlify:

**https://letplayalways.it-weor.se/**

Netlify builds the project with `npm run build` and publishes the `dist`
directory.

## Project status

The application is deployed and playable on desktop and mobile. Online
multiplayer infrastructure and independently verified accessibility or
performance benchmarks are outside the current project scope.

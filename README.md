# Memory Game Pro

A responsive, multilingual memory-matching game built with React and Vite.

Live site: [letplayalways.it-weor.se](https://letplayalways.it-weor.se/)

The French dashboard is titled **Le Royaume des Enfants**.

## Features

- Classic, time attack, survival, puzzle, daily, and blitz game modes
- Focused single-player gameplay
- 16 built-in emoji themes plus user-created themes
- English, Swedish, and French interfaces
- Guided setup scrolling from game mode through language to the game board
- Local statistics, achievements, preferences, and theme storage
- Keyboard, touch, sound, vibration, and accessibility preferences
- Installable PWA with offline shell and runtime asset caching
- iOS **Add to Home Screen** guidance

## Development

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Vite prints the local development address after startup.

## Quality checks

```bash
npm test
npm run lint
npm run build
npm audit
```

The tests cover core game logic, game-mode rules, translation parity, guided
mobile navigation, service-worker behavior, Netlify routing, and iOS
installation guidance.

The production build is written to `dist/`.

## Project structure

```text
src/
  components/   React game UI and styles
  pages/        Route-level pages
  locales/      English, Swedish, and French translations
  utils/        Game rules and browser-service managers
public/         Manifest, icon, redirects, and service worker
test/           Node-based logic, locale, navigation, and PWA tests
```

Player data, custom themes, statistics, achievements, and preferences are stored
in the browser with `localStorage`; they are not uploaded to a server.

## Mobile setup flow

Each manual selection scrolls to the next core setup section:

```text
Game mode → Theme → Difficulty → Language → Game board
```

The scrolling respects reduced-motion preferences and does not prevent native
manual scrolling.

## PWA installation

- Chromium-based browsers show an install action when the browser makes it
  available.
- iPhone and iPad users receive manual **Add to Home Screen** instructions.
- The install action is hidden when the app is already running in standalone
  mode.

## Deployment

The project is configured for Netlify:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback: `public/_redirects`

Missing assets return a real 404 before the SPA fallback is applied, preventing
stale JavaScript paths from receiving HTML responses.

## License

No license file is currently included. Add one before distributing the project
under a specific open-source license.

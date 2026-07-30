# Memory Game Pro

A React memory-matching game with several local game modes, custom emoji themes,
statistics, accessibility preferences, sound effects, and installable PWA support.

Live site: [letplayalways.it-weor.se](https://letplayalways.it-weor.se/)

## Features

- Classic, time attack, survival, puzzle, daily, and blitz modes
- One to four players sharing the same device
- Local multiplayer room simulation for demonstrating room flows
- Built-in and user-created emoji themes
- English and Swedish translations
- Local statistics and preferences
- Keyboard and mobile controls
- Offline application shell and runtime asset caching

Online rooms, tournaments, global leaderboards, and cross-device synchronization
require a WebSocket/backend service and are not included in this repository.

## Development

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm test
npm run lint
npm run build
npm audit
```

The production build is written to `dist/`.

## Structure

```text
src/
  components/   React game UI
  pages/        Route-level pages
  locales/      English and Swedish translations
  utils/        Game rules and browser-service managers
public/         Manifest, icon, and service worker
test/           Node-based unit tests for pure game behavior
```

Player data, custom themes, and preferences are stored in the browser with
`localStorage`; they are not uploaded to a server.

## Deployment

The project is built with Vite and can be deployed to Netlify using:

- Build command: `npm run build`
- Publish directory: `dist`

## License

No license file is currently included. Add one before distributing the project
under a specific open-source license.

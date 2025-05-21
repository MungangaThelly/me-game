# Memory Game 🧠🎨

A responsive memory matching game with multiple themes, difficulty levels, and language support.

![Game Screenshot](./screenshots/gameplay.gif) *Example gameplay with colors theme*

## Features ✨

### 🆕 New Themes Added
- **Colors** 🎨 - Vibrant color emojis (🔴🟢🔵)
- **Geometric Forms** 🔶 - Various shapes (⬛🔺💠)

### All Available Themes (14 Total)
| Category | Emoji Examples | Preview |
|----------|----------------|---------|
| Flowers | 🌹🌻🌸 | ![Flowers](./screenshots/flowers.png) |
| Fruits | 🍎🍊🍇 | ![Fruits](./screenshots/fruits.png) |
| Animals | 🐶🐱🐻 | ![Animals](./screenshots/animals.png) |
| Marine Life | 🐠🐬🦀 | ![Marine](./screenshots/marine.png) |
| Birds | 🦅🦉🦜 | ![Birds](./screenshots/birds.png) |
| Sports | ⚽🏀🎾 | ![Sports](./screenshots/sports.png) |
| **Colors** | 🔴🟢🔵 | ![Colors](./screenshots/colors.png) |
| **Shapes** | ⬛🔺💠 | ![Shapes](./screenshots/shapes.png) |
| Vehicles | 🚗✈️🚀 | ![Vehicles](./screenshots/vehicles.png) |
| Weather | ☀️🌧️🌈 | ![Weather](./screenshots/weather.png) |
| Music | 🎹🥁🎷 | ![Music](./screenshots/music.png) |
| Professions | 👨‍⚕️👩‍🍳👩‍🚀 | ![Professions](./screenshots/professions.png) |
| Holidays | 🎄🎃🎉 | ![Holidays](./screenshots/holidays.png) |
| Zodiac | ♈♉♊ | ![Zodiac](./screenshots/zodiac.png) |

### Game Modes
- 🕹️ **Single Player** - Classic memory challenge
- ⚔️ **2-Player Versus** - Take turns competing
- 👥 **4-Player Teams** - Team memory battle

### Core Features
- 🎚️ 3 Difficulty Levels (Easy/Medium/Hard)
- 🌍 Bilingual Support (English/Swedish)
- ⏱️ Game timer & scoring
- 🏆 Persistent high scores
- 📱 Fully responsive design
- 🎭 Theme preview modal
- ♿ Colorblind-friendly modes available

## Installation ⚙️

```bash
git clone https://github.com/yourusername/me-game.git
cd me-game
npm install
npm start
How to Play 🕹️
Select a theme from the colorful grid

Choose difficulty:

Easy: 5 pairs

Medium: 10 pairs

Hard: 15 pairs

Match all pairs before time runs out!

In multiplayer modes, the player with most matches wins

Customization 🛠️
Adding New Themes
Add to themes object in MemoryGame.jsx:

javascript
space: ['🚀', '🛸', '👽', '🌎', '🌕', '✨']
Add metadata:

javascript
space: { color: '#673AB7', icon: '🚀' }
Add translations in src/locales/

Future Roadmap 🚀
Add sound effects toggle

Implement daily challenges

Add player profiles

Create theme editor

Credits 🙏
Emoji icons from Twemoji

Color palettes from Material Design

Game design inspired by classic memory games

Enjoy the game! 🎉
If you enjoy this project, please consider giving it a ⭐!
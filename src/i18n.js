import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    "en": {
      "gameTitle": "Memory Game",
      "reset": "Reset Game",
      "flipCard": "Flip a card",
      "matched": "Matched!",
      "timer": "Time",
      "score": "Score",
      "easy": "Easy",
      "medium": "Medium",
      "hard": "Hard",
      "swedish": "Swedish",
      "english": "English",
      "congratulations": "Congratulations!",
      "finalScore": "Final Score",
      "timeTaken": "Time Taken",
      "highScore": "High Score",
      "playAgain": "Play Again"
    },
    "sv": {
      "gameTitle": "Memory Spelet",
      "reset": "Återställ spelet",
      "flipCard": "Vänd på ett kort",
      "matched": "Matchad!",
      "timer": "Tid",
      "score": "Poäng",
      "easy": "Lätt",
      "medium": "Medium",
      "hard": "Svår",
      "swedish": "Svenska",
      "english": "Engelska",
      "congratulations": "Grattis!",
      "finalScore": "Slutpoäng",
      "timeTaken": "Tid Använd",
      "highScore": "Högsta Poäng",
      "playAgain": "Spela Igen"
    }
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;

// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h1>Memory Game</h1>
        <p className="subtitle">Test your memory with this matching game</p>
      </div>
      
      <div className="game-cta">
        <Link to="/memory-game" className="cta-button">
          Start Playing
        </Link>
      </div>

      <div className="game-info">
        <h2>How to Play</h2>
        <ol className="instructions">
          <li>Flip two cards at a time to find matches</li>
          <li>Match all pairs to win</li>
          <li>Complete the game with the fewest moves</li>
        </ol>
      </div>
    </div>
  );
}

export default Home;
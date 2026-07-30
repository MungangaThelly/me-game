import React from 'react';
import Home from './pages/Home';
import MemoryGame from './components/MemoryGame';

function App() {
  const isGameRoute = window.location.pathname === '/memory-game';

  return (
    <>
      {isGameRoute ? <MemoryGame /> : <Home />}

      <footer className="game-footer">
        © 2025 Virtal AB (Munganga). All rights reserved.
      </footer>
    </>
  );
}

export default App;

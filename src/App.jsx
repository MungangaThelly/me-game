// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MemoryGame from './components/MemoryGame'; 

function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/memory-game" element={<MemoryGame />} />
      </Routes>
    </Router>

    <footer className="game-footer">
        © 2025 Virtal AB(Munganga). All rights reserved.
      </footer>
  </>
  );
}

export default App;

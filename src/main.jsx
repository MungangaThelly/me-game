import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import MemoryGame from './components/MemoryGame'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './i18n'  // Your i18n configuration

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
        <App />
  </React.StrictMode>
)
// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'  // ← This import was missing
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

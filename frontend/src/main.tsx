import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext'; // Import this

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Add the Provider here so the rest of the app can use it */}
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './ui/App';
import './ui/styles.css';
import './ui/screens.css';
import './ui/hud.css';
import './ui/cinematic.css';
import { hideZones, inHideZone, obstacles, sim } from './game/sim';
import { useGame } from './game/store';

if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__game = { sim, useGame, hideZones, obstacles, inHideZone };

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

import { useEffect, useRef, useState } from 'react';
import { GameCanvas } from '../game/Game';
import { clearInput } from '../game/input';
import { attachControls, cursor, isLocked, lockPointer, releasePointer } from '../game/controls';
import { LEVELS } from '../game/levels';
import { startMusic, stopMusic } from '../game/sound';
import { useGame } from '../game/store';
import { IntroOverlay } from '../cinematic/IntroOverlay';
import { FinaleOverlay } from '../cinematic/Finale';
import { DoorFade, DoorPrompt } from './DoorUi';
import { Hud } from './Hud';
import { LoadingScreen } from './LoadingScreen';
import { LevelSelect } from './LevelSelect';
import { MainMenu } from './MainMenu';
import { MobilePad } from './MobilePad';
import { Credits, GameOverScreen, HowToPlay, PauseMenu, VictoryScreen } from './Overlays';
import { CollectionScreen, EvolutionScreen, ShopScreen } from './RoachScreens';
import { SettingsScreen } from './Settings';

export default function App() {
  const screen = useGame((s) => s.screen);
  const level = useGame((s) => s.level);
  const inGame = useGame((s) => s.inGame);
  const startLevel = useGame((s) => s.startLevel);
  const setScreen = useGame((s) => s.setScreen);
  const touchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const spec = LEVELS[level - 1];
  const showHud = inGame && ['game', 'paused', 'game-over', 'level-complete', 'ending'].includes(screen);
  const bootArgs = useRef(false);

  useEffect(() => {
    if (screen === 'loading') return;
    if (screen === 'intro' || screen === 'finale' || screen === 'paused') stopMusic();
    else startMusic();
  }, [screen]);

  useEffect(() => { if (screen !== 'game') clearInput(); }, [screen]);
  useEffect(() => attachControls(), []);

  useEffect(() => {
    if (bootArgs.current) return;
    bootArgs.current = true;
    const q = new URLSearchParams(window.location.search);
    if (import.meta.env.DEV && q.has('intro')) {
      void import('../cinematic/timeline').then(({ intro }) => { setScreen('intro'); intro.t = Number(q.get('intro')) || 0; });
      return;
    }
    const n = Number(q.get('level'));
    if (n >= 1 && n <= LEVELS.length) {
      useGame.setState({ unlocked: LEVELS.length, reached: LEVELS.length });
      startLevel(n);
      return;
    }
    if (import.meta.env.DEV && q.has('skipload')) setScreen('menu');
    const go = q.get('screen');
    if (import.meta.env.DEV && go) setScreen(go as never);
  }, [setScreen, startLevel]);

  const pause = () => { releasePointer(); setScreen('paused'); };

  return (
    <main className="app">
      <div className="scene"><GameCanvas level={level} /><div className="vignette" /></div>

      {screen === 'menu' && <MainMenu />}
      {screen === 'level-select' && <LevelSelect />}
      {screen === 'collection' && <CollectionScreen />}
      {screen === 'evolution' && <EvolutionScreen />}
      {screen === 'shop' && <ShopScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'how-to-play' && <HowToPlay />}
      {screen === 'credits' && <Credits />}
      {screen === 'intro' && <IntroOverlay onFinish={() => startLevel(1)} />}
      {screen === 'finale' && <FinaleOverlay />}

      {showHud && <Hud onPause={pause} />}
      {screen === 'game' && <MobilePad />}
      {screen === 'game' && spec.intro && <div className="intro-chip" key={`${level}-${useGame.getState().runId}`}>{spec.intro}</div>}
      {screen === 'game' && !touchDevice && <LockPrompt />}
      {screen === 'game' && <DoorPrompt />}
      {inGame && <DoorFade />}

      {screen === 'paused' && <PauseMenu />}
      {screen === 'game-over' && <GameOverScreen />}
      {(screen === 'level-complete' || screen === 'ending') && <VictoryScreen />}

      <LoadingGate />
    </main>
  );
}

function LockPrompt() {
  const [, bump] = useState(0);
  useEffect(() => {
    const sync = () => bump((n) => n + 1);
    document.addEventListener('pointerlockchange', sync);
    window.addEventListener('cursor-change', sync);
    return () => {
      document.removeEventListener('pointerlockchange', sync);
      window.removeEventListener('cursor-change', sync);
    };
  }, []);
  if (isLocked()) return null;
  if (cursor.free) return <button className="lock-prompt free" onClick={() => { cursor.free = false; lockPointer(); window.dispatchEvent(new Event('cursor-change')); }}>CURSOR FREE <kbd>V</kbd> OR CLICK TO LOCK</button>;
  return <button className="lock-prompt" onClick={() => lockPointer()}>CLICK TO CONTROL CAMERA</button>;
}

function LoadingGate() {
  const [shown, setShown] = useState(true);
  const screen = useGame((s) => s.screen);
  const setScreen = useGame((s) => s.setScreen);
  useEffect(() => { if (screen !== 'loading') setShown(false); }, [screen]);
  if (!shown) return null;
  return <LoadingScreen onReady={() => { if (useGame.getState().screen === 'loading') setScreen('menu'); setShown(false); }} />;
}

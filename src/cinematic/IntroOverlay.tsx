import { useEffect, useRef, useState } from 'react';
import { CinematicAudio } from './CinematicAudio';
import { introBridge } from './bridge';
import type { SubtitleState } from './SubtitleManager';
import { T } from './timeline';

export function IntroOverlay({ onFinish }: { onFinish: () => void }) {
  const [sub, setSub] = useState<SubtitleState>(null);
  const [started, setStarted] = useState(false);
  const fadeEl = useRef<HTMLDivElement>(null);
  const titleEl = useRef<HTMLDivElement>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const readyAt = useRef(0);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    setLeaving(true);
    CinematicAudio.impact();
    window.setTimeout(onFinish, 650);
  };

  useEffect(() => {
    introBridge.onSubtitle = setSub;
    introBridge.onProgress = (t, fade, title) => {
      if (fadeEl.current) fadeEl.current.style.opacity = String(fade);
      if (titleEl.current) titleEl.current.style.setProperty('--k', String(title));
      const ready = t >= T.title + 2.4;
      if (ready) readyAt.current ||= performance.now();
      setShowPrompt((p) => (p === ready ? p : ready));
    };
    return () => {
      introBridge.onSubtitle = () => undefined;
      introBridge.onProgress = () => undefined;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      CinematicAudio.unlock();
      if (e.code === 'Escape') { e.preventDefault(); finish(); return; }
      if (readyAt.current && performance.now() - readyAt.current > 300) finish();
    };
    const onPointer = () => {
      CinematicAudio.unlock();
      if (readyAt.current && performance.now() - readyAt.current > 300) finish();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  });

  useEffect(() => { setStarted(true); }, []);

  return (
    <div className={`cine ${started ? 'cine-on' : ''} ${leaving ? 'cine-leave' : ''}`}>
      <div className="cine-bar cine-bar-top" />
      <div className="cine-bar cine-bar-bottom" />
      {sub && (
        <div className={`cine-sub cine-sub-${sub.style}`} key={sub.key}>
          <span>{sub.text}</span>
        </div>
      )}
      <div className="cine-fade" ref={fadeEl} />
      <div className="cine-title" ref={titleEl} aria-hidden={!showPrompt}>
        <small>A TINY ROACH. A BIG DREAM.</small>
        <h1>LIPAS</h1>
        <h2>FROM LONGKANG TO LUXURY</h2>
        <p className={showPrompt ? 'cine-press on' : 'cine-press'}>PRESS ANY KEY TO BEGIN</p>
      </div>
      <button className="cine-skip" onClick={() => { CinematicAudio.unlock(); finish(); }}>SKIP INTRO <kbd>ESC</kbd></button>
      <div className="cine-leave-fade" />
    </div>
  );
}

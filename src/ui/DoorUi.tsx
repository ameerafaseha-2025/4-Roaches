import { useEffect, useRef, useState } from 'react';
import { door, sim_prompt } from '../game/sim';

export function DoorPrompt() {
  const [view, setView] = useState({ text: '', sub: '' });
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (sim_prompt.text !== view.text || sim_prompt.sub !== view.sub) setView({ text: sim_prompt.text, sub: sim_prompt.sub });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [view]);
  if (!view.text) return null;
  const locked = view.text === 'LOCKED';
  const stairs = view.text === 'STAIRS';
  return (
    <div className={`door-prompt ${locked ? 'locked' : ''}`}>
      <span className="dp-key">{locked ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : stairs ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20h4v-4h4v-4h4V8h4" /></svg> : 'E'}</span>
      <span className="dp-text">{locked ? 'DOOR LOCKED' : stairs ? 'THE STAIRS ARE OPEN' : 'OPEN DOOR'}</span>
      {view.sub && <small>{view.sub}</small>}
    </div>
  );
}

export function DoorFade() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const loop = () => {
      if (el.current && door.fade !== last) {
        el.current.style.transition = door.fade === 0 ? 'opacity .6s ease' : 'none';
        el.current.style.opacity = String(door.fade);
        last = door.fade;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={el} className="door-fade" />;
}

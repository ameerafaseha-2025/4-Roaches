import { useEffect, useState } from 'react';
import { LEVELS } from '../game/levels';
import { sound } from '../game/sound';
import { useGame } from '../game/store';
import { MUTATIONS } from '../progression/MutationConfig';
import { Coins } from './kit';

type Item = { id: string; label: string; hint: string; go: () => void; disabled?: boolean; primary?: boolean };

export function MainMenu() {
  const s = useGame();
  const [sel, setSel] = useState(0);
  const equipped = MUTATIONS[s.equipped];
  const started = s.reached > 1 || s.score > 0 || s.lifetimeCoins > 0;
  const level = LEVELS[Math.min(s.unlocked, LEVELS.length) - 1];

  const items: Item[] = [
    { id: 'continue', label: 'Continue', hint: started ? `Level ${s.unlocked}: ${level.name}` : 'No save yet', disabled: !started, primary: true, go: () => s.startLevel(s.unlocked) },
    { id: 'new', label: 'New Game', hint: 'Watch the story and begin at Level 1', go: () => s.setScreen('intro') },
    { id: 'levels', label: 'Level Selection', hint: 'Replay any room you have reached', go: () => s.navigate('level-select') },
    { id: 'collection', label: 'Roach Collection', hint: 'Inspect every mutation in 3D', go: () => s.navigate('collection') },
    { id: 'evolution', label: 'Mutations & Skills', hint: 'Equip forms and spend coins on skills', go: () => s.navigate('evolution') },
    { id: 'shop', label: 'Shop', hint: 'Cosmetics and upgrades', go: () => s.navigate('shop') },
    { id: 'settings', label: 'Settings', hint: 'Graphics, audio, controls', go: () => s.navigate('settings') },
    { id: 'credits', label: 'Credits', hint: 'Who made this', go: () => s.navigate('credits') },
  ];
  const enabled = items.map((i, n) => (i.disabled ? -1 : n)).filter((n) => n >= 0);

  useEffect(() => {
    const first = items.findIndex((i) => !i.disabled);
    setSel(first < 0 ? 0 : first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat && e.code === 'Enter') return;
      const at = enabled.indexOf(sel);
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); setSel(enabled[(at + 1) % enabled.length]); sound(); }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); setSel(enabled[(at - 1 + enabled.length) % enabled.length]); sound(); }
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); sound(); items[sel].go(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="menu">
      <div className="menu-left">
        <div className="menu-brand">
          <span className="eyebrow">A tiny roach. A big dream.</span>
          <h1>LIPAS</h1>
          <h2>From Longkang to Luxury</h2>
          <span className="accent">One father. One house. One mission.</span>
        </div>
        <nav className="nav" aria-label="Main menu">
          {items.map((it, n) => (
            <button key={it.id} className={`nav-item ${it.primary ? 'primary' : ''} ${sel === n ? 'sel' : ''}`} disabled={it.disabled}
              onMouseEnter={() => !it.disabled && setSel(n)} onFocus={() => !it.disabled && setSel(n)}
              onClick={() => { sound(); it.go(); }}>
              <i>{String(n + 1).padStart(2, '0')}</i>{it.label}
            </button>
          ))}
        </nav>
        <p className="menu-hint" key={sel}>{items[sel].hint}</p>
      </div>
      <div className="menu-right">
        <div className="menu-status">
          <div className="meta"><b>Progress</b>Level {Math.min(s.unlocked, LEVELS.length)} of {LEVELS.length}</div>
          <Coins value={s.coins} />
        </div>
        <div className="menu-equip">
          <span className="eyebrow">Current form</span>
          <h3>{equipped.name}</h3>
          <p>{equipped.tagline}</p>
          <span className={`rarity-tag r-${equipped.rarity}`}>{equipped.rarity}</span>
        </div>
      </div>
      <div className="menu-foot"><span>W S / Arrows to browse · Enter to select</span><span>v1.0</span></div>
    </div>
  );
}

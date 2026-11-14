import { useState } from 'react';
import { LEVELS, type LevelSpec } from '../game/levels';
import { useGame } from '../game/store';
import { Coins, ScreenFrame, useBackKey } from './kit';
import { LevelArt } from './LevelArt';

const ROOM_SHORT: Record<string, string> = { bathroom: 'Bathroom', store: 'Store Room', kitchen: 'Kitchen', bedroom: 'Bedroom', living: 'Living Room', boss: 'Boss Domain', feast: 'Luxury Floor' };
const THREAT = (l: LevelSpec) => {
  if (l.kind === 'feast') return 'None. Feast.';
  if (l.kind === 'boss') return 'Mak (slipper) and the Janitor (spray)';
  return l.humans.map((h) => h.name).join(', ');
};

export function LevelSelect() {
  const s = useGame();
  const [sel, setSel] = useState(Math.min(s.unlocked, LEVELS.length) - 1);
  useBackKey(true, s.back);

  return (
    <ScreenFrame eyebrow="Household map" title="Level Selection" onBack={s.back} tools={<Coins value={s.coins} />}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="lv-wrap" role="list">
          {LEVELS.map((l, i) => {
            const open = l.id <= s.unlocked;
            const cleared = s.claimed.includes(`clear:L${l.id}`);
            const progress = cleared ? 100 : open ? 0 : 0;
            return (
              <button key={l.id} role="listitem" disabled={!open} className={`lv ${sel === i ? 'sel' : ''}`}
                style={{ ['--lv-bg' as string]: l.sky }}
                onMouseEnter={() => open && setSel(i)} onFocus={() => open && setSel(i)} onClick={() => s.startLevel(l.id)}>
                <div className="lv-art"><LevelArt theme={l.theme} /></div>
                <span className="lv-no">{String(l.id).padStart(2, '0')}</span>
                {!open && (
                  <svg className="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                )}
                <span className="tag">{l.kind === 'boss' ? 'Boss' : l.kind === 'feast' ? 'Goal' : l.difficulty}</span>
                <h3>{ROOM_SHORT[l.theme]}</h3>
                <dl>
                  <dt>Humans</dt><dd>{l.humans.length || 'None'}</dd>
                  <dt>Threat</dt><dd>{open ? (l.kind === 'boss' ? 'Slipper + spray' : l.humans.length ? l.difficulty : 'Calm') : 'Unknown'}</dd>
                  <dt>Status</dt><dd>{!open ? 'Locked' : cleared ? 'Cleared' : 'Available'}</dd>
                </dl>
                <div className="lv-prog"><i style={{ width: `${progress}%` }} /></div>
              </button>
            );
          })}
        </div>
        <div className="lv-foot">
          <span>{LEVELS[sel].name}: {LEVELS[sel].subtitle}</span>
          <span>{s.unlocked <= sel ? 'Clear the previous room to unlock' : `Opponents: ${THREAT(LEVELS[sel])}`}</span>
        </div>
      </div>
    </ScreenFrame>
  );
}

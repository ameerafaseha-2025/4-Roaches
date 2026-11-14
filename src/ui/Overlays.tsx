import { useEffect, useState } from 'react';
import { LEVELS } from '../game/levels';
import { sound } from '../game/sound';
import { useGame } from '../game/store';
import { lockPointer } from '../game/controls';
import { MUTATIONS } from '../progression/MutationConfig';
import { Btn, Coin, Coins, Mouse, ScreenFrame, useBackKey } from './kit';

export function PauseMenu() {
  const s = useGame();
  const spec = LEVELS[s.level - 1];
  const eq = MUTATIONS[s.equipped];
  const resume = () => { s.setScreen('game'); lockPointer(); };
  return (
    <div className="pause-wrap">
      <div className="pause-col">
        <div>
          <span className="eyebrow">Paused</span>
          <h2 style={{ marginTop: 12 }}>Take a<br />breath</h2>
        </div>
        <div className="nav" style={{ borderLeft: 0 }}>
          <button className="nav-item sel primary" onClick={() => { sound(); resume(); }}><i>01</i>Resume<small>Back to the chaos</small></button>
          <button className="nav-item" onClick={() => { sound(); s.startLevel(s.level); }}><i>02</i>Restart Level</button>
          <button className="nav-item" onClick={() => { sound(); s.navigate('how-to-play'); }}><i>03</i>Controls</button>
          <button className="nav-item" onClick={() => { sound(); s.navigate('settings'); }}><i>04</i>Settings</button>
          <button className="nav-item" onClick={() => { sound(); s.setScreen('menu'); }}><i>05</i>Return to Main Menu</button>
        </div>
      </div>
      <div className="pause-info">
        <div className="kv"><b>Level {s.level}</b>{spec.name}</div>
        <div className="kv"><b>Form</b>{eq.name}</div>
        <div className="kv"><b>Crumb Coins</b><Coins value={s.coins} /></div>
      </div>
    </div>
  );
}

export function HowToPlay() {
  const s = useGame();
  useBackKey(true, s.back);
  return (
    <ScreenFrame eyebrow="Learn the ropes" title="Controls" mode={s.inGame ? 'over-game' : 'plain'} onBack={s.back}>
      <div className="keys scroll" style={{ flex: 1, alignContent: 'start' }}>
        <h3>Movement</h3>
        <div className="row"><kbd>W A S D</kbd>Move, relative to the camera</div>
        <div className="row"><Mouse />Move the mouse to rotate the camera</div>
        <div className="row"><kbd>Space</kbd>Jump</div>
        <div className="row"><kbd>Shift</kbd>Sprint (uses stamina)</div>
        <h3>Abilities</h3>
        <div className="row"><kbd>F</kbd>Toggle flight (uses energy)</div>
        <div className="row"><kbd>E</kbd>Hide under furniture or clothing</div>
        <div className="row"><kbd>Q</kbd>Special ability of your equipped mutation</div>
        <div className="row"><kbd>Space / C</kbd>Climb and descend while flying</div>
        <h3>Combat</h3>
        <div className="row"><Mouse button="left" />Primary attack: lunge at a face</div>
        <div className="row"><Mouse button="right" />Hold to aim and lock on to a human</div>
        <div className="row"><kbd>Esc</kbd>Pause and release the mouse</div>
      </div>
    </ScreenFrame>
  );
}

export function Credits() {
  const s = useGame();
  useBackKey(true, s.back);
  return (
    <ScreenFrame eyebrow="Behind the scenes" title="Credits" onBack={s.back}>
      <div className="credits">
        <div><h3>Game</h3><p>LIPAS: From Longkang to Luxury. A tiny roach, a big dream and one very large house.</p></div>
        <div><h3>Built with</h3><p>Three.js, React Three Fiber, React and Zustand. Characters, rooms, sound and music are generated in code.</p></div>
        <div><h3>Open assets</h3><ul><li>Textures and models from Poly Haven (CC0)</li><li>Cinzel, DM Sans and Caveat Brush (SIL Open Font License)</li></ul></div>
      </div>
    </ScreenFrame>
  );
}

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() + 500;
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / 900));
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span className="num">{n}</span>;
}

const fmtTime = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function VictoryScreen() {
  const s = useGame();
  const r = s.result;
  const final = s.screen === 'ending';
  const spec = LEVELS[(r?.level ?? s.level) - 1];
  const next = (r?.level ?? s.level) + 1;
  if (!r) return null;
  const total = r.coins;
  return (
    <div className="result">
      <div className="result-card win">
        <span className="eyebrow">{final ? 'The end' : spec.kind === 'boss' ? 'Boss defeated' : 'Room cleared'}</span>
        <h2 className="banner" style={{ marginTop: 14 }}>{final ? 'A feast for the fallen' : spec.kind === 'boss' ? 'The stairs are open' : 'Cleared'}</h2>
        <p className="sub">{final ? 'He ate for the family he lost, and the house was his at last.' : `${spec.name} completed in ${fmtTime(r.time)}.`}</p>
        <div className="rule" />
        <div className="rewards">
          {r.rewards.length === 0 && <div className="reward" style={{ animationDelay: '.3s' }}><span>No new rewards. Replays pay only for objectives you have not claimed.</span></div>}
          {r.rewards.map((w, i) => (
            <div className="reward" key={i} style={{ animationDelay: `${0.25 + i * 0.1}s` }}><span>{w.label}</span><span className="coins"><Coin />+{w.amount}</span></div>
          ))}
          <div className="reward total" style={{ animationDelay: `${0.35 + r.rewards.length * 0.1}s` }}><span>Crumb Coins earned</span><span className="coins"><Coin /><CountUp to={total} /></span></div>
        </div>
        {r.newMutations.length > 0 && <div className="unlock-banner">New mutation unlocked: {r.newMutations.map((m) => MUTATIONS[m].name).join(', ')}</div>}
        <div className="result-actions">
          {!final && next <= LEVELS.length && <Btn primary onClick={() => s.startLevel(next)}>{spec.kind === 'boss' ? 'Climb the stairs' : 'Next room'}</Btn>}
          <Btn onClick={() => s.navigate('evolution')}>Mutations & Skills</Btn>
          <Btn onClick={() => s.navigate('shop')}>Shop</Btn>
          <Btn onClick={() => s.startLevel(r.level)}>Replay</Btn>
          <Btn ghost onClick={() => s.setScreen('menu')}>Main menu</Btn>
        </div>
      </div>
    </div>
  );
}

export function GameOverScreen() {
  const s = useGame();
  return (
    <div className="result">
      <div className="result-card lose">
        <span className="eyebrow">The family is counting on you</span>
        <h2 className="banner" style={{ marginTop: 14 }}>Squashed</h2>
        <p className="sub">Every legend gets stepped on once. Change your form, spend your crumbs, and go again.</p>
        <div className="rule" />
        <div className="result-actions">
          <Btn primary onClick={() => s.startLevel(s.level)}>Try again</Btn>
          <Btn onClick={() => s.navigate('evolution')}>Mutations & Skills</Btn>
          <Btn onClick={() => s.navigate('level-select')}>Levels</Btn>
          <Btn ghost onClick={() => s.setScreen('menu')}>Main menu</Btn>
        </div>
      </div>
    </div>
  );
}

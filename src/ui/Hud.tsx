import { useEffect, useState } from 'react';
import { tutorial } from '../game/input';
import { FEAST_TARGET, LEVELS } from '../game/levels';
import { fpsMeter } from '../game/fps';
import { prefs } from '../game/prefs';
import { sim } from '../game/sim';
import { useGame } from '../game/store';
import { MUTATIONS } from '../progression/MutationConfig';
import { Coins } from './kit';

const TUTORIAL: { key: keyof typeof tutorial; text: string; keys: string }[] = [
  { key: 'looked', text: 'Move the mouse to look around', keys: 'MOUSE' },
  { key: 'moved', text: 'Walk, relative to the camera', keys: 'W A S D' },
  { key: 'jumped', text: 'Jump', keys: 'SPACE' },
  { key: 'sprinted', text: 'Sprint while walking', keys: 'SHIFT' },
  { key: 'flew', text: 'Take off, then land again', keys: 'F' },
  { key: 'hid', text: 'Hide under the vanity', keys: 'E' },
  { key: 'aimed', text: 'Aim at the human', keys: 'RIGHT CLICK' },
  { key: 'attacked', text: 'Face attack!', keys: 'LEFT CLICK' },
];

function Tutorial() {
  const step = TUTORIAL.find((t) => !tutorial[t.key]);
  if (!step) return null;
  return (
    <div className="tutorial">
      <small>TUTORIAL {TUTORIAL.indexOf(step) + 1}/{TUTORIAL.length}</small>
      <strong>{step.text}</strong>
      <kbd>{step.keys}</kbd>
    </div>
  );
}

function Bar({ tag, label, value, max, kind }: { tag: string; label: string; value: number; max: number; kind: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`bar ${kind} ${pct < 22 ? 'low' : ''}`} aria-label={`${label} ${Math.ceil(value)}`}>
      <span>{tag}</span><div className="t"><i style={{ width: `${pct}%` }} /></div><b>{Math.ceil(value)}</b>
    </div>
  );
}

const ICONS: Record<string, string> = {
  scurry: 'M5 17 L13 7 M9 17 L17 7 M13 17 L21 7',
  shield: 'M12 3 L20 6 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V6 Z',
  dash: 'M3 12 H15 M11 7 L16 12 L11 17 M18 8 L21 12 L18 16',
  burst: 'M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z',
  veil: 'M2 12 C6 6 18 6 22 12 C18 18 6 18 2 12 Z M12 9 A3 3 0 1 0 12 15 A3 3 0 1 0 12 9',
  rage: 'M12 2 L15 9 L22 9 L16 14 L18 22 L12 17 L6 22 L8 14 L2 9 L9 9 Z',
};

function AbilityIcon() {
  const eq = useGame((s) => s.equipped);
  const def = MUTATIONS[eq].ability;
  const [, tick] = useState(0);
  useEffect(() => { const id = window.setInterval(() => tick((n) => n + 1), 100); return () => window.clearInterval(id); }, []);
  const cd = sim.abilityCd;
  const frac = sim.abilityCdMax > 0 ? Math.min(1, cd / sim.abilityCdMax) : 0;
  const active = (Object.values(sim.fx) as number[]).some((v) => v > 0);
  return (
    <div className={`ability ${cd <= 0 ? 'ready' : ''} ${active ? 'active' : ''}`} style={{ ['--ab-color' as string]: def.color }} title={`${def.name}: ${def.desc}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"><path d={ICONS[def.id] ?? ICONS.burst} /></svg>
      {cd > 0 && <><span className="cd" style={{ transform: `scaleY(${frac})` }} /><span className="cdn num">{Math.ceil(cd)}</span></>}
      <kbd>Q</kbd>
    </div>
  );
}

export function Hud({ onPause }: { onPause: () => void }) {
  const s = useGame();
  const [, tick] = useState(0);
  useEffect(() => { const id = window.setInterval(() => tick((n) => n + 1), 100); return () => window.clearInterval(id); }, []);
  const spec = LEVELS[s.level - 1];
  const goal = spec.kind === 'feast' ? `Feast ${s.feasted} / ${FEAST_TARGET}` : `Terrify ${s.cleared.length} / ${spec.humans.length}`;
  const msg = s.message && Date.now() < s.messageUntil ? s.message : '';
  const warning = s.warning && Date.now() < s.warningUntil ? s.warning : '';
  const playing = s.screen === 'game';
  return (
    <div className="hud">
      {prefs.showFps && <span className="fps">{fpsMeter.fps} FPS</span>}
      <div className="hud-top">
        <div className="hud-room"><small>Level {s.level} of {LEVELS.length}</small><strong>{spec.name}</strong></div>
        <div className="hud-right">
          <div className="hud-coins"><Coins value={s.coins} /><button className="pause" aria-label="Pause" onClick={onPause}>II</button></div>
          <div className="objective">
            <small>Objective</small>
            <strong>{goal}</strong>
            {spec.kind !== 'feast' && <em className={s.exitUnlocked ? 'on' : ''}>{s.exitUnlocked ? 'Door open. Fly to it.' : 'Door locked'}</em>}
          </div>
        </div>
      </div>
      {spec.humans.length > 0 && (
        <div className="fear-panel">
          {spec.humans.map((h, i) => {
            const id = `L${s.level}-H${i}`;
            const done = s.cleared.includes(id);
            const alert = !done && !sim.hidden && (sim.stun[i] ?? 0) <= 0 && sim.humanFaces[i] && sim.humanFaces[i].distanceTo(sim.position) < 7 * (1 - s.stats.detectionResistance);
            return (
              <div className={`fear-row ${done ? 'done' : ''}`} key={id}>
                <span>{h.name}<i className={`aware ${alert ? 'on' : sim.hidden ? 'hid' : ''}`} title={alert ? 'Has noticed you' : sim.hidden ? 'You are hidden' : 'Has not noticed you'} /></span>
                <div className="fear-bar"><i style={{ width: `${s.fear[id] ?? 0}%` }} /></div>
              </div>
            );
          })}
          <small>FEAR · {sim.hidden ? 'HIDDEN' : 'EXPOSED'}</small>
        </div>
      )}
      {warning && <div className="warning">{warning}</div>}
      <div className="hud-center">{msg}</div>
      {playing && prefs.tutorial && s.level === 1 && <Tutorial />}
      {playing && sim.aiming && <div className="aim-reticle"><i /></div>}
      {playing && sim.hideOn && <div className="hide-badge">HIDDEN</div>}
      <div className="hud-bottom">
        <div className="vitals">
          <Bar tag="HP" label="Health" value={s.health} max={s.maxHealth} kind="hp" />
          <Bar tag="EN" label="Flight energy" value={s.energy} max={100} kind="en" />
          <Bar tag="ST" label="Stamina" value={s.stamina} max={s.maxStamina} kind="st" />
        </div>
        <AbilityIcon />
        <div className="state">
          {sim.stuckTo >= 0 ? 'ON FACE' : sim.flying ? 'FLYING' : sim.hideOn ? 'HIDING' : 'WALKING'}
          <small>{s.energy < 20 ? 'Low energy. Eat scraps.' : 'F fly · Space jump · Q ability'}</small>
        </div>
      </div>
    </div>
  );
}

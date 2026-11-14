import { useEffect, useRef } from 'react';
import { computeStats, unlockHint } from '../progression/MutationManager';
import { BASE, MUTATIONS, MUTATION_ORDER, type MutationDef, type MutationId } from '../progression/MutationConfig';
import { stage } from './MenuStage';
import { Coin } from './kit';

const rows: { label: string; value: (s: ReturnType<typeof computeStats>) => number; max: number; fmt: (n: number) => string }[] = [
  { label: 'Health', value: (s) => s.maxHealth, max: 150, fmt: (n) => String(Math.round(n)) },
  { label: 'Attack', value: (s) => s.attackDamage, max: 1.6, fmt: (n) => `${Math.round(n * 100)}%` },
  { label: 'Speed', value: (s) => s.movementSpeed, max: 3.6, fmt: (n) => `${Math.round((n / BASE.movementSpeed) * 100)}%` },
  { label: 'Flight', value: (s) => s.flightSpeed / s.flightEnergyConsumption, max: 2.4 * 4.4 / 3.4 * 1.3, fmt: (n) => `${Math.round((n / (BASE.flightSpeed / BASE.flightEnergyConsumption)) * 100)}%` },
  { label: 'Stamina', value: (s) => s.staminaCapacity, max: 160, fmt: (n) => String(Math.round(n)) },
  { label: 'Defence', value: (s) => s.defence, max: 0.4, fmt: (n) => `${Math.round(n * 100)}%` },
  { label: 'Stealth', value: (s) => s.detectionResistance + 0.5, max: 1, fmt: (n) => `${Math.round((n - 0.5) * 100)}%` },
];

export function StatBlock({ id, skills, compareTo }: { id: MutationId; skills: Record<string, number>; compareTo?: MutationId }) {
  const s = computeStats(id, skills);
  const base = computeStats('basic', skills);
  const other = compareTo && compareTo !== id ? computeStats(compareTo, skills) : null;
  return (
    <div className="stat-block" aria-label="Attributes">
      {rows.map((r) => {
        const v = r.value(s);
        const b = r.value(base);
        const o = other ? r.value(other) : null;
        const delta = o === null ? 0 : v - o;
        const tone = o === null || Math.abs(delta) < 1e-6 ? '' : delta > 0 ? 'up' : 'down';
        return (
          <div className="stat" key={r.label}>
            <span>{r.label}</span>
            <div className="stat-bar"><i style={{ width: `${Math.min(100, (v / r.max) * 100)}%` }} /><b style={{ left: `${Math.min(100, (b / r.max) * 100)}%` }} /></div>
            <span className={`stat-v ${tone}`}>{r.fmt(v)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AbilityCard({ def }: { def: MutationDef }) {
  const a = def.ability;
  return (
    <div className="ab-card" style={{ ['--ab-color' as string]: a.color }}>
      <div className="row"><h4>{a.name}</h4><span className="key"><kbd>Q</kbd></span></div>
      <p>{a.desc}</p>
      <div className="meta"><span>Cooldown {a.cooldown}s</span><span>Lasts {a.duration}s</span>{a.energyCost > 0 && <span>Energy {a.energyCost}</span>}</div>
    </div>
  );
}

export function ProsCons({ def }: { def: MutationDef }) {
  return (
    <div className="proscons">
      <div className="pro"><h5>Advantages</h5><ul>{def.pros.map((p) => <li key={p}>{p}</li>)}</ul></div>
      <div className="con"><h5>Weaknesses</h5><ul>{def.cons.map((p) => <li key={p}>{p}</li>)}</ul></div>
    </div>
  );
}

export type Rowstate = 'equipped' | 'owned' | 'buyable' | 'locked';

export function MutationRail({ selected, onSelect, owned, equipped, reached }: {
  selected: MutationId; onSelect: (id: MutationId) => void; owned: MutationId[]; equipped: MutationId; reached: number;
}) {
  return (
    <div className="rail scroll" role="listbox" aria-label="Mutations">
      {MUTATION_ORDER.map((id) => {
        const m = MUTATIONS[id];
        const has = owned.includes(id);
        const gated = !has && reached < m.requiresReached;
        const end = id === equipped ? <span className="end eq">EQUIPPED</span> : has ? <span className="end ok">OWNED</span> : gated ? <span className="end">LOCKED</span> : <span className="end"><Coin />{m.price}</span>;
        return (
          <button key={id} role="option" aria-selected={selected === id} className={`tile ${selected === id ? 'sel' : ''} ${!has && gated ? 'dim-tile' : ''}`} style={{ color: `var(--r-${m.rarity})` }} onClick={() => onSelect(id)}>
            <span className="gem" />
            <div style={{ color: 'var(--ivory)' }}><h4>{m.name}</h4><small className={`r-${m.rarity}`}>{m.rarity}</small></div>
            {end}
          </button>
        );
      })}
    </div>
  );
}

export function PreviewSpacer({ hint = true }: { hint?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let down = false;
    let lastX = 0;
    const el = ref.current;
    if (!el) return;
    const onDown = (e: PointerEvent) => { down = true; lastX = e.clientX; stage.drag = 1; stage.spin = false; el.setPointerCapture(e.pointerId); };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      stage.pointerX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      stage.pointerY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (down) { stage.targetYaw += (e.clientX - lastX) * 0.012; lastX = e.clientX; }
      else if (!stage.spin) stage.targetYaw += stage.pointerX * 0.008;
    };
    const onUp = () => { down = false; stage.drag = 0; window.setTimeout(() => { if (!down) stage.spin = true; }, 1800); };
    const onLeave = () => { stage.pointerX = 0; stage.pointerY = 0; };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onLeave);
      stage.drag = 0; stage.spin = true; stage.pointerX = 0; stage.pointerY = 0;
    };
  }, []);
  return <div className="spacer" ref={ref} style={{ cursor: 'grab' }}>{hint && <span className="pv-hint">Drag to rotate · Move the mouse to tilt</span>}</div>;
}

export { unlockHint };

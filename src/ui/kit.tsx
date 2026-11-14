import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sound } from '../game/sound';
import { useGame } from '../game/store';

export const Coin = () => <span className="coin" aria-hidden="true" />;

export function Coins({ value, className = '' }: { value: number; className?: string }) {
  return <span className={`coins ${className}`} title="Crumb Coins"><Coin />{value.toLocaleString()}</span>;
}

export function Btn({ children, onClick, primary = false, danger = false, ghost = false, small = false, block = false, disabled = false, quiet = false }: {
  children: ReactNode; onClick: () => void; primary?: boolean; danger?: boolean; ghost?: boolean; small?: boolean; block?: boolean; disabled?: boolean; quiet?: boolean;
}) {
  const cls = ['btn', primary && 'btn-primary', danger && 'btn-danger', ghost && 'btn-ghost', small && 'btn-sm', block && 'btn-block'].filter(Boolean).join(' ');
  return (
    <button className={cls} disabled={disabled} onClick={() => { if (!quiet) sound(); onClick(); }}>
      {children}
    </button>
  );
}

export function Mouse({ button }: { button?: 'left' | 'right' }) {
  return <span className={`mouse mouse-${button ?? 'none'}`} aria-hidden="true"><i /></span>;
}

export const ScreenFrame = ScreenFrameImpl;

function ScreenFrameImpl({ eyebrow, title, onBack, tools, tabs, children, mode = 'plain', backLabel = 'Back' }: {
  eyebrow: string; title: string; onBack?: () => void; tools?: ReactNode; tabs?: ReactNode; children: ReactNode; mode?: 'plain' | 'stage' | 'over-game'; backLabel?: string;
}) {
  return (
    <section className={`screen ${mode === 'stage' ? 'stage' : ''} ${mode === 'over-game' ? 'over-game' : ''}`}>
      <header className="head">
        <div className="head-title"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
        {tabs}
        <div className="head-tools">
          {tools}
          {onBack && <Btn small onClick={onBack}>{backLabel}<kbd>ESC</kbd></Btn>}
        </div>
      </header>
      <div className="body">{children}</div>
    </section>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? 'on' : ''}`} onClick={() => { sound(); onChange(!on); }} />;
}

export function Slider({ value, min, max, step = 1, onChange, label }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; label: string }) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input className="slider" type="range" aria-label={label} min={min} max={max} step={step} value={value} style={{ ['--fill' as string]: `${fill}%` }} onChange={(e) => onChange(Number(e.target.value))} />
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: readonly T[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} role="radio" aria-checked={o === value} className={o === value ? 'on' : ''} onClick={() => { sound(); onChange(o); }}>{o}</button>
      ))}
    </div>
  );
}

export function useToast() {
  const [t, setT] = useState<{ text: string; tone: 'good' | 'bad' | 'plain'; id: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = (text: string, tone: 'good' | 'bad' | 'plain' = 'plain') => {
    setT({ text, tone, id: Date.now() });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setT(null), 2300);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const node = t ? <div className={`toast ${t.tone === 'plain' ? '' : t.tone}`} key={t.id} role="status">{t.text}</div> : null;
  return { show, node };
}

export function Confirm({ eyebrow, title, body, cost, balance, confirmLabel, onConfirm, onCancel }: {
  eyebrow: string; title: string; body: string; cost?: number; balance?: number; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { e.stopPropagation(); onCancel(); }
      if (e.code === 'Enter') { e.stopPropagation(); onConfirm(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel, onConfirm]);
  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <span className="eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        <p>{body}</p>
        {cost !== undefined && balance !== undefined && (
          <div className="modal-row">
            <span>Cost <Coins value={cost} /></span>
            <span>Balance after <Coins value={balance - cost} /></span>
          </div>
        )}
        <div className="modal-actions">
          <Btn ghost onClick={onCancel}>Cancel</Btn>
          <Btn primary onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

export function useBackKey(enabled: boolean, onBack: () => void) {
  const ref = useRef(onBack);
  ref.current = onBack;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape' && !e.repeat) { e.preventDefault(); ref.current(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}

export const screenOf = () => useGame.getState().screen;

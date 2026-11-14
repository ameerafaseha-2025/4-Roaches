import { useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { sound } from '../game/sound';

const TIPS = [
  'Humans cannot see you under furniture. Press E near cover to hide.',
  'Eating scraps restores flight energy and earns Crumb Coins.',
  'A face attack fills a human\'s fear bar. Fill it to 100 to clear them.',
  'Sprinting drains stamina, flying drains energy. Rest on the ground to recover.',
  'Every mutation has a special ability on Q. Learn its rhythm.',
  'Mak throws slippers. Keep moving and she will miss.',
  'Rewards are paid once per objective. Challenges pay extra.',
  'Larger humans take longer to terrify. Be patient and stay on their face.',
];

const TEXTURES = [
  'rounded_square_tiled_wall', 'long_white_tiles', 'scuffed_cement', 'concrete_wall_004', 'plastered_wall_04', 'clay_roof_tiles',
].flatMap((id) => ['Diffuse', 'nor_gl', 'arm'].map((m) => `/assets/textures/${id}/${m}.jpg`));

const MODELS = ['rubber_duck_toy', 'potted_plant_01', 'wicker_basket_01', 'plunger', 'multi_cleaner_bottle', 'bleach_bottle'].map((n) => `/assets/models/${n}/${n}.gltf`);

const FONTS = ['600 20px Cinzel', '900 20px Cinzel', '500 14px "DM Sans"', '700 14px "DM Sans"', '400 20px "Caveat Brush"'];

type Job = { run: () => Promise<unknown>; weight: number };

function imageJob(url: string): Job {
  return {
    weight: 1,
    run: () => new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => resolve(undefined);
      img.src = url;
    }),
  };
}

export function LoadingScreen({ onReady }: { onReady: () => void }) {
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [tip, setTip] = useState(() => Math.floor(Math.random() * TIPS.length));
  const started = useRef(false);

  const crumbs = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ left: (i * 47) % 100, delay: (i * 0.73) % 9, dur: 7 + (i % 5) * 1.6, size: 3 + (i % 4) * 1.5 })), []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const jobs: Job[] = [
      ...FONTS.map((f): Job => ({ weight: 1, run: () => document.fonts.load(f).catch(() => undefined) })),
      ...TEXTURES.map(imageJob),
      ...MODELS.map((u): Job => ({ weight: 2, run: () => Promise.resolve(useGLTF.preload(u)).then(() => new Promise((r) => setTimeout(r, 30))) })),
      { weight: 2, run: () => Promise.resolve(useTexture.preload(TEXTURES.slice(0, 3))) },
    ];
    const total = jobs.reduce((a, j) => a + j.weight, 0);
    let finished = 0;
    const started0 = performance.now();
    Promise.all(jobs.map((j) => j.run().catch(() => undefined).then(() => { finished += j.weight; setPct(Math.min(99, Math.round((finished / total) * 100))); }))).then(() => {
      const wait = Math.max(0, 1800 - (performance.now() - started0));
      window.setTimeout(() => { setPct(100); setReady(true); }, wait);
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTip((t) => (t + 1) % TIPS.length), 4200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const go = () => { sound(); setDone(true); window.setTimeout(onReady, 650); };
    const onKey = (e: KeyboardEvent) => { if (!e.repeat) go(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', go);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', go); };
  }, [ready, onReady]);

  return (
    <div className={`loading ${done ? 'done' : ''}`} role="status" aria-live="polite">
      <div className="loading-art" aria-hidden="true">
        {crumbs.map((c, i) => <i key={i} className="crumb" style={{ left: `${c.left}%`, animationDelay: `-${c.delay}s`, animationDuration: `${c.dur}s`, width: c.size, height: c.size }} />)}
      </div>
      <div className="loading-title">
        <h1>LIPAS<span>From Longkang to Luxury</span></h1>
      </div>
      <div className="loading-bar">
        <div className="loading-track"><i style={{ width: `${pct}%` }} /></div>
        <span className="loading-pct num">{pct}%</span>
      </div>
      <p className="loading-tip" key={tip}><b>TIP</b>{TIPS[tip]}</p>
      <span className={`loading-ready ${ready ? 'on' : ''}`}>PRESS ANY KEY</span>
    </div>
  );
}

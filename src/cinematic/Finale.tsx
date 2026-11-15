import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { Banquet, HALL, TABLE_Y, TABLE_Z } from '../game/Banquet';
import { RoachModel } from '../game/RoachModel';
import { useGame } from '../game/store';
import { CinematicAudio } from './CinematicAudio';
import { CinematicCamera, type Shot } from './CinematicCamera';
import { SubtitleManager, type SubtitleCue, type SubtitleState } from './SubtitleManager';

export const FINALE_LENGTH = 26;
const TITLE_AT = 21.6;

const finale = {
  t: 0,
  onSub: (_: SubtitleState) => undefined as void,
  onFade: (_: number) => undefined as void,
  onTitle: (_: number) => undefined as void,
};

const cues: SubtitleCue[] = [
  { at: 1.4, duration: 3.6, text: 'Bapak Lipas climbed out of the longkang...' },
  { at: 5.4, duration: 3.6, text: '...crossed the whole house...' },
  { at: 9.2, duration: 3.8, text: '...and reached the feast he had promised them.' },
  { at: 13.4, duration: 3.6, text: 'Cake. Chicken. Chocolates. More than they could ever eat.' },
  { at: 17.2, duration: 3.8, text: 'For the first time in a long time, the family was full.' },
];

const shots: Shot[] = [
  { at: 0, pos: [0, 1.2, 10.5], look: [0, 1.4, TABLE_Z], fov: 58 },
  { at: 8, pos: [-1.6, 1.5, 4.2], look: [0, 1.5, TABLE_Z], fov: 50 },
  { at: 9.2, pos: [-3.0, 1.9, TABLE_Z + 3.4], look: [-0.4, 1.35, TABLE_Z], fov: 44, cut: true },
  { at: 13.2, pos: [2.8, 1.8, TABLE_Z + 3.6], look: [0.2, 1.35, TABLE_Z], fov: 42 },
  { at: 13.4, pos: [0.3, 1.7, TABLE_Z + 2.0], look: [0, 1.3, TABLE_Z], fov: 34, cut: true },
  { at: 21, pos: [0.5, 1.55, TABLE_Z + 1.8], look: [0, 1.28, TABLE_Z], fov: 30 },
  { at: 21.2, pos: [0, 2.6, TABLE_Z + 9], look: [0, 1.4, TABLE_Z], fov: 54, cut: true },
  { at: 26, pos: [0, 3.2, TABLE_Z + 11], look: [0, 1.4, TABLE_Z], fov: 58 },
];

const FAMILY: { x: number; z: number; s: number; r: number; bob: number }[] = [
  { x: -0.35, z: 0.3, s: 0.62, r: Math.PI + 0.25, bob: 0 },
  { x: -1.3, z: 0.25, s: 0.5, r: Math.PI + 0.5, bob: 1 },
  { x: 0.75, z: 0.3, s: 0.3, r: Math.PI - 0.4, bob: 2 },
  { x: 1.35, z: 0.35, s: 0.28, r: Math.PI - 0.2, bob: 3 },
  { x: 1.9, z: 0.25, s: 0.26, r: Math.PI - 0.5, bob: 4 },
];

function Family() {
  const equipped = useGame((s) => s.equipped);
  const cosmetics = useGame((s) => s.cosmeticsEquipped);
  const nodes = useRef<(THREE.Group | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    nodes.current.forEach((g, i) => {
      if (!g) return;
      const hungry = Math.max(0, Math.sin(t * 5 + i * 1.7));
      g.position.y = TABLE_Y + 0.05 + hungry * 0.025;
      g.rotation.x = -hungry * 0.12;
    });
  });
  return (
    <group position={[0, 0, TABLE_Z]}>
      {FAMILY.map((f, i) => (
        <group key={i} ref={(g) => { nodes.current[i] = g; }} position={[f.x, TABLE_Y + 0.05, f.z]} rotation={[0, f.r, 0]} scale={f.s}>
          <RoachModel mutation={i === 0 ? equipped : 'basic'} cosmetics={i === 0 ? cosmetics : undefined} />
        </group>
      ))}
    </group>
  );
}

export function FinaleSequence() {
  const { camera, scene, gl } = useThree();
  const cam = useMemo(() => new CinematicCamera(shots), []);
  const subs = useMemo(() => new SubtitleManager(cues), []);
  const bg = useMemo(() => new THREE.Color('#2a1d12'), []);
  const key = useRef<THREE.PointLight>(null);

  useEffect(() => {
    finale.t = 0;
    subs.reset();
    const off = subs.subscribe((s) => finale.onSub(s));
    CinematicAudio.unlock();
    CinematicAudio.setTension(0);
    CinematicAudio.startMusic();
    const prev = gl.toneMappingExposure;
    gl.toneMappingExposure = 1.2;
    scene.background = bg;
    scene.fog = new THREE.Fog(bg, 18, 46);
    return () => {
      off();
      subs.reset();
      CinematicAudio.stopAll();
      gl.toneMappingExposure = prev;
      scene.fog = null;
      if (camera instanceof THREE.PerspectiveCamera) { camera.fov = 56; camera.updateProjectionMatrix(); }
    };
  }, [camera, gl, scene, subs, bg]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    finale.t = Math.min(FINALE_LENGTH, finale.t + dt);
    const t = finale.t;
    subs.update(t);
    if (camera instanceof THREE.PerspectiveCamera) cam.update(t, dt, camera);
    if (key.current) key.current.intensity = 34 + Math.sin(state.clock.elapsedTime * 2) * 2;
    finale.onFade(t < 1 ? 1 - t : t > FINALE_LENGTH - 1.4 ? (t - (FINALE_LENGTH - 1.4)) / 1.4 : 0);
    finale.onTitle(Math.min(1, Math.max(0, (t - TITLE_AT) / 1.8)));
  });

  return (
    <group>
      <Environment resolution={128} background={false}>
        <Lightformer form="rect" intensity={1.6} color="#ffe3b0" position={[0, 8, 0]} scale={[16, 16, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.1} color="#ffc27a" position={[0, 3, -10]} scale={[14, 6, 1]} />
      </Environment>
      <hemisphereLight args={['#ffe9c4', '#4a3420', 0.75]} />
      <directionalLight position={[-4, 9, 8]} intensity={1.7} color="#ffd9a0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-camera-far={40} shadow-bias={-0.0004} />
      <pointLight ref={key} position={[0, 4.4, TABLE_Z]} intensity={34} distance={16} decay={1.4} color="#ffd48a" />
      <pointLight position={[0, 6, TABLE_Z + 8]} intensity={14} distance={18} decay={1.5} color="#ffe6b8" />
      <Banquet />
      <Family />
    </group>
  );
}

export function FinaleOverlay() {
  const [sub, setSub] = useState<SubtitleState>(null);
  const fade = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const go = () => {
    if (done.current) return;
    done.current = true;
    useGame.getState().setScreen('ending');
  };

  useEffect(() => {
    finale.onSub = setSub;
    finale.onFade = (k) => {
      if (fade.current) fade.current.style.opacity = String(k);
      if (finale.t >= FINALE_LENGTH - 0.05) go();
    };
    finale.onTitle = (k) => { title.current?.style.setProperty('--k', String(k)); };
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape' || e.code === 'Enter') { e.preventDefault(); go(); } };
    window.addEventListener('keydown', onKey);
    return () => {
      finale.onSub = () => undefined;
      finale.onFade = () => undefined;
      finale.onTitle = () => undefined;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="cine cine-on">
      <div className="cine-bar cine-bar-top" />
      <div className="cine-bar cine-bar-bottom" />
      {sub && <div className={`cine-sub cine-sub-${sub.style}`} key={sub.key}><span>{sub.text}</span></div>}
      <div className="cine-title finale-title" ref={title} aria-hidden="true">
        <h2>A TINY ROACH.<br />A BIG DREAM.</h2>
      </div>
      <div className="cine-fade" ref={fade} />
      <button className="cine-skip" onClick={go}>SKIP <kbd>ESC</kbd></button>
    </div>
  );
}

export const FINALE_HALL = HALL;

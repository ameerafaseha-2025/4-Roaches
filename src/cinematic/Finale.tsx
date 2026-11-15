import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { RoachModel } from '../game/RoachModel';
import { useGame } from '../game/store';
import { CinematicAudio } from './CinematicAudio';
import { CinematicCamera, type Shot } from './CinematicCamera';
import { SubtitleManager, type SubtitleCue, type SubtitleState } from './SubtitleManager';

export const FINALE_LENGTH = 30;
const finale = { t: 0, onSub: (_: SubtitleState) => undefined as void, onFade: (_: number) => undefined as void };

const cues: SubtitleCue[] = [
  { at: 1.2, duration: 3.6, text: 'Mak Lipas was defeated.' },
  { at: 5.0, duration: 3.8, text: 'The stairs to the second floor were open at last.' },
  { at: 9.6, duration: 4.4, text: 'Gold plates. Wedding cake. More food than a roach could dream of.' },
  { at: 14.6, duration: 4.2, text: 'He thought of the family he had lost...' },
  { at: 19.0, duration: 4.4, text: '...and ate for every one of them.' },
  { at: 24.0, duration: 4.4, text: 'From the longkang to luxury. The house was his.', style: 'shout' },
];

const shots: Shot[] = [
  { at: 0, pos: [0, 0.5, 9], look: [0, 0.8, 0], fov: 55 },
  { at: 8, pos: [-1.5, 0.7, 5.5], look: [0, 1.1, 0], fov: 50 },
  { at: 9.6, pos: [-3.2, 1.9, 2.4], look: [0, 1.1, 0], fov: 46, cut: true },
  { at: 14.4, pos: [2.6, 1.7, 2.2], look: [0, 1.2, 0], fov: 44 },
  { at: 14.6, pos: [0.4, 1.5, 1.6], look: [0, 1.15, 0], fov: 34, cut: true },
  { at: 22, pos: [0.8, 1.45, 1.4], look: [0, 1.15, 0], fov: 30 },
  { at: 24, pos: [0, 2.2, 6.4], look: [0, 1.3, 0], fov: 52, cut: true },
  { at: 30, pos: [0, 2.9, 8.4], look: [0, 1.3, 0], fov: 56 },
];

const TABLE_Y = 1.0;

function Plate({ x, z, c }: { x: number; z: number; c: string }) {
  return (
    <group position={[x, TABLE_Y, z]}>
      <mesh castShadow><cylinderGeometry args={[0.34, 0.38, 0.05, 32]} /><meshPhysicalMaterial color="#f4d77a" metalness={0.9} roughness={0.22} /></mesh>
      <mesh position={[0, 0.17, 0]} castShadow><sphereGeometry args={[0.22, 28, 20]} /><meshPhysicalMaterial color={c} roughness={0.35} clearcoat={0.6} /></mesh>
    </group>
  );
}

function Family() {
  const equipped = useGame((s) => s.equipped);
  const cosmetics = useGame((s) => s.cosmeticsEquipped);
  const bob = useRef<THREE.Group[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    bob.current.forEach((g, i) => { if (g) g.position.y = TABLE_Y + 0.03 + Math.abs(Math.sin(t * 3 + i)) * 0.03; });
  });
  const spots: { p: [number, number, number]; s: number; r: number; own: boolean }[] = [
    { p: [-0.1, TABLE_Y, 0.55], s: 0.55, r: Math.PI, own: true },
    { p: [-1.1, TABLE_Y, 0.4], s: 0.45, r: Math.PI * 0.9, own: false },
    { p: [0.9, TABLE_Y, 0.4], s: 0.28, r: Math.PI * 1.1, own: false },
    { p: [1.5, TABLE_Y, 0.55], s: 0.26, r: Math.PI * 1.05, own: false },
  ];
  return (
    <>
      {spots.map((f, i) => (
        <group key={i} ref={(g) => { if (g) bob.current[i] = g; }} position={f.p} rotation={[0, f.r, 0]} scale={f.s}>
          <RoachModel mutation={f.own ? equipped : 'basic'} cosmetics={f.own ? cosmetics : undefined} />
        </group>
      ))}
    </>
  );
}

export function FinaleSequence() {
  const { camera, scene, gl } = useThree();
  const cam = useMemo(() => new CinematicCamera(shots), []);
  const subs = useMemo(() => new SubtitleManager(cues), []);
  const bg = useMemo(() => new THREE.Color('#1a1208'), []);
  const keyLight = useRef<THREE.PointLight>(null);

  useEffect(() => {
    finale.t = 0;
    subs.reset();
    const off = subs.subscribe((s) => finale.onSub(s));
    CinematicAudio.unlock();
    CinematicAudio.setTension(0);
    CinematicAudio.startMusic();
    const prev = gl.toneMappingExposure;
    gl.toneMappingExposure = 1.15;
    scene.background = bg;
    return () => {
      off();
      subs.reset();
      CinematicAudio.stopAll();
      gl.toneMappingExposure = prev;
      if (camera instanceof THREE.PerspectiveCamera) { camera.fov = 56; camera.updateProjectionMatrix(); }
    };
  }, [camera, gl, scene, subs, bg]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    finale.t = Math.min(FINALE_LENGTH, finale.t + dt);
    const t = finale.t;
    subs.update(t);
    if (camera instanceof THREE.PerspectiveCamera) cam.update(t, dt, camera);
    if (keyLight.current) keyLight.current.intensity = 26 + Math.sin(t * 2) * 2;
    finale.onFade(t < 1 ? 1 - t : t > FINALE_LENGTH - 1.6 ? (t - (FINALE_LENGTH - 1.6)) / 1.6 : 0);
  });

  return (
    <group>
      <Environment resolution={128} background={false}>
        <Lightformer form="rect" intensity={1.6} color="#ffe3b0" position={[0, 6, 2]} scale={[10, 5, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1} color="#ffc27a" position={[4, 2, -3]} scale={[4, 3, 1]} />
      </Environment>
      <hemisphereLight args={['#ffe9c4', '#4a3420', 0.7]} />
      <directionalLight position={[-3, 7, 5]} intensity={1.6} color="#ffd9a0" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight ref={keyLight} position={[0, 3.2, 1]} intensity={26} distance={14} color="#ffd48a" />
      <fog attach="fog" args={['#1a1208', 9, 26]} />
      <mesh position={[0, -0.05, 0]} receiveShadow><boxGeometry args={[30, 0.1, 30]} /><meshPhysicalMaterial color="#d9c9a2" roughness={0.3} clearcoat={0.5} /></mesh>
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[5, 14]} /><meshStandardMaterial color="#a43a46" roughness={0.9} /></mesh>
      <mesh position={[0, 4, -6]} receiveShadow><boxGeometry args={[30, 8, 0.2]} /><meshStandardMaterial color="#f1e7cf" roughness={0.85} /></mesh>
      <mesh position={[0, TABLE_Y - 0.06, 0]} castShadow receiveShadow><boxGeometry args={[4.6, 0.12, 1.7]} /><meshPhysicalMaterial color="#f7f1e3" roughness={0.5} /></mesh>
      {[-2, 2].flatMap((x) => [-0.65, 0.65].map((z) => (
        <mesh key={`${x}${z}`} position={[x, TABLE_Y / 2 - 0.06, z]} castShadow><boxGeometry args={[0.14, TABLE_Y, 0.14]} /><meshStandardMaterial color="#8a5f3a" /></mesh>
      )))}
      {[[-1.8, '#e8786a'], [-0.9, '#f3c98a'], [0, '#d6d36c'], [0.9, '#e8786a'], [1.8, '#f3c98a']].map(([x, c], i) => <Plate key={i} x={x as number} z={-0.35} c={c as string} />)}
      <mesh position={[0, TABLE_Y + 0.3, -0.6]} castShadow><cylinderGeometry args={[0.32, 0.4, 0.6, 32]} /><meshPhysicalMaterial color="#fff7ea" roughness={0.4} /></mesh>
      <Family />
      <Sparkles count={50} scale={[8, 4, 6]} position={[0, 2, 0]} size={3} speed={0.3} color="#ffe7a0" opacity={0.6} />
    </group>
  );
}

export function FinaleOverlay() {
  const [sub, setSub] = useState<SubtitleState>(null);
  const fade = useRef<HTMLDivElement>(null);
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
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape' || e.code === 'Enter') { e.preventDefault(); go(); } };
    window.addEventListener('keydown', onKey);
    return () => {
      finale.onSub = () => undefined;
      finale.onFade = () => undefined;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="cine cine-on">
      <div className="cine-bar cine-bar-top" />
      <div className="cine-bar cine-bar-bottom" />
      {sub && <div className={`cine-sub cine-sub-${sub.style}`} key={sub.key}><span>{sub.text}</span></div>}
      <div className="cine-fade" ref={fade} />
      <button className="cine-skip" onClick={go}>SKIP <kbd>ESC</kbd></button>
    </div>
  );
}

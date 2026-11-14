import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { CinematicAudio } from './CinematicAudio';
import { CinematicCamera, type Shot } from './CinematicCamera';
import { DrainSet } from './DrainSet';
import { Disaster } from './Disaster';
import { Family, RUG } from './Family';
import { House, Wreck } from './Scenery';
import { introBridge } from './bridge';
import { SubtitleManager, type SubtitleCue } from './SubtitleManager';
import { FOOD, HOME, intro, lerp, phase, T } from './timeline';

export const INTRO_LENGTH = 68;

const cueData: SubtitleCue[] = [
  { at: 2.6, duration: 3.6, text: 'Deep beneath the world of humans...' },
  { at: 6.4, duration: 3.4, text: '...a little family had a home of their own.' },
  { at: 11.0, duration: 4.4, text: 'He had everything a father could ever wish for...' },
  { at: 15.8, duration: 5.2, text: 'A loving wife. A happy family. A place to call home.' },
  { at: 23.6, duration: 3.0, text: 'But happiness never lasts forever...' },
  { at: 27.0, duration: 4.8, text: 'THE HUMANS HAVE ARRIVED.', style: 'shout' },
  { at: 37.0, duration: 3.0, text: 'Their home was gone...' },
  { at: 40.0, duration: 3.0, text: 'Their food was gone...' },
  { at: 43.0, duration: 4.6, text: 'But a father never gives up.' },
  { at: 49.0, duration: 3.2, text: 'One house. Five rooms full of opportunity.' },
  { at: 52.2, duration: 3.0, text: 'One mission. Feed the family.' },
];

const shots: Shot[] = [
  { at: 0, pos: [0.4, 1.4, 11], look: [0.6, 1.2, -4], fov: 52 },
  { at: 6.4, pos: [0.9, 1.0, 3.2], look: [HOME.x + 0.3, 0.6, HOME.z + 0.4], fov: 46 },
  { at: 9, pos: [-1.8, 1.7, 0.2], look: [RUG.x, 0.3, RUG.z], fov: 54, cut: true },
  { at: 12.4, pos: [FOOD.x + 1.6, 0.55, FOOD.z + 1.9], look: [RUG.x + 0.3, 0.3, RUG.z + 0.1], fov: 40, cut: true },
  { at: 15.4, pos: [RUG.x + 0.1, 0.3, RUG.z + 1.1], look: [RUG.x, 0.14, RUG.z], fov: 36, cut: true },
  { at: 19.2, pos: [RUG.x - 1.3, 0.62, RUG.z + 1.7], look: [RUG.x, 0.22, RUG.z - 0.1], fov: 34, cut: true },
  { at: 22.9, pos: [-0.2, 1.2, 1.6], look: [HOME.x + 0.5, 0.5, HOME.z + 0.3], fov: 50, cut: true },
  { at: 23.8, pos: [0.2, 0.8, 0.6], look: [HOME.x + 0.8, 1.2, HOME.z + 0.2], fov: 58 },
  { at: 26, pos: [HOME.x - 0.6, 1.0, HOME.z + 3.2], look: [HOME.x + 0.8, 0.5, HOME.z - 0.3], fov: 56, cut: true },
  { at: 28.8, pos: [HOME.x - 0.2, 0.7, HOME.z + 2.4], look: [HOME.x + 0.3, 0.4, HOME.z + 0.4], fov: 52 },
  { at: 29.6, pos: [HOME.x + 0.1, 0.55, HOME.z + 1.4], look: [HOME.x + 0.2, 0.4, HOME.z - 1.0], fov: 62, cut: true },
  { at: 32.2, pos: [HOME.x - 1.4, 0.9, HOME.z + 5.2], look: [HOME.x, 0.4, HOME.z + 8], fov: 66 },
  { at: 35.4, pos: [HOME.x + 0.4, 1.4, HOME.z + 6.5], look: [HOME.x, 0.3, HOME.z + 11], fov: 62 },
  { at: 36.2, pos: [1.2, 1.5, 0.2], look: [HOME.x + 0.2, 0.2, HOME.z - 0.4], fov: 52, cut: true },
  { at: 38.6, pos: [RUG.x + 0.2, 0.3, RUG.z + 1.0], look: [RUG.x, 0.15, RUG.z], fov: 32, cut: true },
  { at: 41.3, pos: [RUG.x - 1.1, 0.34, RUG.z + 1.0], look: [RUG.x - 0.8, 0.22, RUG.z - 0.2], fov: 30, cut: true },
  { at: 43.2, pos: [FOOD.x + 1.2, 0.34, FOOD.z + 1.3], look: [FOOD.x + 0.5, 0.26, FOOD.z + 0.2], fov: 30, cut: true },
  { at: 46.6, pos: [FOOD.x + 1.5, 0.4, FOOD.z + 1.0], look: [FOOD.x - 4, 1.6, FOOD.z - 14], fov: 42 },
  { at: 48, pos: [FOOD.x + 0.7, 0.12, FOOD.z + 2.2], look: [FOOD.x + 0.2, 4.2, -26], fov: 62, cut: true },
  { at: 51, pos: [FOOD.x - 0.1, 0.1, -4.5], look: [HOME.x, 5, -26.5], fov: 70 },
  { at: 55.2, pos: [HOME.x, 0.2, -11], look: [HOME.x, 5.2, -26.5], fov: 74 },
  { at: 57.4, pos: [HOME.x - 2.2, 0.4, -17.5], look: [HOME.x, 3.8, -27.2], fov: 58, cut: true },
  { at: 68, pos: [HOME.x - 1.0, 0.55, -19.6], look: [HOME.x, 3.9, -27.2], fov: 56 },
];

type Mood = { fog: string; fogNear: number; fogFar: number; exposure: number; key: string; keyI: number; fill: number };
const MOODS: Record<string, Mood> = {
  drain: { fog: '#0d1518', fogNear: 4, fogFar: 22, exposure: 0.95, key: '#9bd7e0', keyI: 0.35, fill: 0.55 },
  warm: { fog: '#1a1410', fogNear: 4, fogFar: 20, exposure: 1.15, key: '#ffb870', keyI: 0.5, fill: 0.9 },
  tense: { fog: '#0a0d12', fogNear: 3, fogFar: 14, exposure: 0.8, key: '#7f98c8', keyI: 0.25, fill: 0.35 },
  sad: { fog: '#0b1013', fogNear: 4, fogFar: 18, exposure: 0.85, key: '#6e93a8', keyI: 0.3, fill: 0.45 },
  flood: { fog: '#12303a', fogNear: 3, fogFar: 16, exposure: 1.15, key: '#8fd8ea', keyI: 0.9, fill: 0.9 },
  night: { fog: '#090d1c', fogNear: 10, fogFar: 60, exposure: 1.0, key: '#a8bdff', keyI: 0.6, fill: 0.6 },
};

function moodFor(t: number): Mood {
  if (t < 9) return MOODS.drain;
  if (t < T.disaster) return MOODS.warm;
  if (t >= T.water - 0.2 && t < T.reset) return MOODS.flood;
  if (t < T.reset) return MOODS.tense;
  if (t < 46) return MOODS.sad;
  return MOODS.night;
}

const lerpColor = (a: THREE.Color, b: string, k: number) => a.lerp(new THREE.Color(b), k);

export function IntroSequence() {
  const { camera, scene, gl } = useThree();
  const cam = useMemo(() => new CinematicCamera(shots), []);
  const subs = useMemo(() => new SubtitleManager(cueData), []);
  const fired = useRef(new Set<string>());
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.HemisphereLight>(null);
  const bg = useMemo(() => new THREE.Color('#0d1518'), []);
  const myFog = useRef<THREE.Fog | null>(null);

  useEffect(() => {
    const jump = import.meta.env.DEV ? Number(new URLSearchParams(window.location.search).get('intro')) || 0 : 0;
    intro.t = jump;
    intro.scale = 1;
    fired.current.clear();
    subs.reset();
    const off = subs.subscribe((s) => introBridge.onSubtitle(s));
    CinematicAudio.setTension(0);
    CinematicAudio.startMusic();
    CinematicAudio.setWater(0.55);
    const previousExposure = gl.toneMappingExposure;
    return () => {
      off();
      subs.reset();
      CinematicAudio.stopAll();
      gl.toneMappingExposure = previousExposure;
      if (scene.fog && scene.fog === myFog.current) scene.fog = null;
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 56;
        camera.updateProjectionMatrix();
      }
    };
  }, [camera, cam, gl, scene, subs]);

  const once = (key: string, at: number, t: number, fn: () => void) => {
    if (t >= at && !fired.current.has(key)) {
      fired.current.add(key);
      fn();
    }
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const slow = intro.t > T.water - 0.15 && intro.t < T.water + 1.1;
    intro.scale = slow ? 0.28 : 1;
    intro.t = Math.min(INTRO_LENGTH, intro.t + dt * intro.scale);
    const t = intro.t;

    subs.update(t);

    once('step1', T.disaster + 0.6, t, () => CinematicAudio.footstep());
    once('step2', T.disaster + 1.5, t, () => { CinematicAudio.footstep(); cam.shake(0.5); });
    once('step3', T.disaster + 2.4, t, () => { CinematicAudio.footstep(); cam.shake(0.8); });
    once('tense', T.disaster, t, () => CinematicAudio.setTension(1));
    once('broom1', T.broom, t, () => { CinematicAudio.broomSweep(0.75); cam.shake(0.6); });
    once('broom2', T.broom + 1.1, t, () => { CinematicAudio.broomSweep(0.75); cam.shake(0.7); });
    once('broom3', T.broom + 2.2, t, () => { CinematicAudio.broomSweep(0.8); cam.shake(0.9); });
    once('hit', T.water, t, () => { CinematicAudio.impact(); cam.shake(2); CinematicAudio.setWater(1.6); });
    once('squeak1', T.disaster + 1.0, t, () => CinematicAudio.squeak());
    once('squeak2', T.disaster + 1.9, t, () => CinematicAudio.squeak());
    once('squeak3', T.water + 0.4, t, () => CinematicAudio.squeak());
    once('calm', T.reset, t, () => { CinematicAudio.setTension(0); CinematicAudio.setWater(0.3); });
    once('title', T.title, t, () => { CinematicAudio.impact(); CinematicAudio.setWater(0); });
    if (t > T.water && t < T.reset) cam.shake(0.45);
    if (t > T.disaster && t < T.broom) cam.shake(0.12);

    cam.setRoll(t > T.water && t < T.reset ? Math.sin(t * 6) * 0.05 : 0);
    if (camera instanceof THREE.PerspectiveCamera) cam.update(t, dt, camera);

    const mood = moodFor(t);
    lerpColor(bg, mood.fog, Math.min(1, dt * 2.5));
    scene.background = bg;
    if (!myFog.current) myFog.current = new THREE.Fog(bg, mood.fogNear, mood.fogFar);
    scene.fog = myFog.current;
    const fog = myFog.current;
    fog.color.copy(bg);
    fog.near = lerp(fog.near, mood.fogNear, Math.min(1, dt * 2));
    fog.far = lerp(fog.far, mood.fogFar, Math.min(1, dt * 2));
    gl.toneMappingExposure = lerp(gl.toneMappingExposure, mood.exposure, Math.min(1, dt * 2));
    if (sun.current) {
      sun.current.color.lerp(new THREE.Color(mood.key), Math.min(1, dt * 2));
      sun.current.intensity = lerp(sun.current.intensity, mood.keyI * 4, Math.min(1, dt * 2));
    }
    if (fill.current) fill.current.intensity = lerp(fill.current.intensity, mood.fill, Math.min(1, dt * 2));

    const fade = t < T.fade ? 0 : t < T.title - 0.4 ? phase(t, T.fade, T.title - 0.4) : 1 - phase(t, T.title - 0.4, T.title + 0.8);
    const titleK = phase(t, T.title, T.title + 2.4);
    introBridge.onProgress(t, Math.max(fade, t < 1.4 ? 1 - phase(t, 0, 1.4) : 0), titleK);
  });

  return (
    <group>
      <Environment resolution={128} background={false}>
        <Lightformer form="rect" intensity={0.8} color="#bfe4ee" position={[0, 6, 2]} scale={[8, 4, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} color="#ffd6a0" position={[3, 2, -4]} scale={[4, 3, 1]} />
      </Environment>
      <hemisphereLight ref={fill} args={['#9fb8c0', '#2a2a28', 0.55]} />
      <directionalLight ref={sun} position={[-4, 8, 6]} intensity={1.4} color="#9bd7e0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-far={40} shadow-bias={-0.0004} />
      <DrainSet />
      <Wreck />
      <Family />
      <Disaster />
      <House />
    </group>
  );
}

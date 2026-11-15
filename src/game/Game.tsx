import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Food, Human, Projectiles } from './Actors';
import { CameraRig, Player } from './Player';
import { Room } from './Room';
import { BanquetRoom } from './BanquetRoom';
import { BANQUET_FOOD } from './Banquet';
import { LEVELS } from './levels';
import { bathroomFood } from './Bathroom';
import { IntroSequence } from '../cinematic/IntroSequence';
import { FinaleSequence } from '../cinematic/Finale';
import { MenuStage, PREVIEW_SCREENS } from '../ui/MenuStage';
import { prefs } from './prefs';
import { fpsMeter } from './fps';
import { useGame } from './store';

function FpsProbe() {
  const frame = useRef(0);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    return () => { gl.shadowMap.autoUpdate = true; };
  }, [gl]);
  useFrame((_, delta) => {
    fpsMeter.sample(delta);
    frame.current += 1;
    gl.shadowMap.needsUpdate = frame.current % 2 === 0 || frame.current < 4;
  });
  return null;
}

const MIN_SHADOW_SIZE = 0.32;

function ShadowTuner({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const done = useRef(0);
  const box = useMemo(() => new THREE.Box3(), []);
  const size = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const stages = [0.6, 2.5, 6];
    if (done.current >= stages.length || t < stages[done.current] + (g.userData.t0 ??= t)) return;
    done.current += 1;
    g.updateWorldMatrix(true, true);
    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.castShadow || mesh.userData.tuned) return;
      mesh.userData.tuned = true;
      box.setFromObject(mesh);
      box.getSize(size);
      if (Math.max(size.x, size.y, size.z) < MIN_SHADOW_SIZE) mesh.castShadow = false;
    });
  });
  return <group ref={ref}>{children}</group>;
}

function Experience({ level, runId }: { level: number; runId: number }) {
  const spec = LEVELS[level - 1];
  const exitUnlocked = useGame((s) => s.exitUnlocked);
  const screen = useGame((s) => s.screen);
  const inGame = useGame((s) => s.inGame);
  const banquet = useGame((s) => s.banquet);
  const preview = useGame((s) => s.previewMutation);
  const equipped = useGame((s) => s.equipped);
  if (screen === 'intro') return <IntroSequence />;
  if (screen === 'finale') return <FinaleSequence />;
  if (!inGame) {
    const showPreview = PREVIEW_SCREENS.has(screen);
    return <MenuStage mode={showPreview ? 'preview' : 'menu'} mutation={showPreview ? preview : equipped} />;
  }
  if (banquet) {
    return (
      <>
        <BanquetRoom key={`banquet-${runId}`} />
        {BANQUET_FOOD.map((pos, i) => (
          <Food key={`banquet-${runId}-F${i}`} id={`B-F${i}`} position={pos} index={i} />
        ))}
        <Player key={`p-banquet-${runId}`} level={level} runId={runId} />
        <CameraRig resetKey={`banquet-${runId}`} />
      </>
    );
  }
  return (
    <>
      <ShadowTuner key={`tune-${level}-${runId}`}><Room level={level} exitUnlocked={exitUnlocked} /></ShadowTuner>
      {spec.humans.map((h, i) => (
        <Human key={`${level}-${runId}-${i}`} index={i} spec={h} id={`L${level}-H${i}`} />
      ))}
      {(spec.theme === 'bathroom' ? bathroomFood : spec.food).map((pos, i) => (
        <Food key={`${level}-${runId}-F${i}`} id={`L${level}-F${i}`} position={pos} index={i} />
      ))}
      <Projectiles />
      <Player key={`p-${level}-${runId}`} level={level} runId={runId} />
      <CameraRig resetKey={`${level}-${runId}`} />
    </>
  );
}

const dprFor = (q: string): number | [number, number] => (q === 'Low' ? 1 : q === 'Balanced' ? 1.25 : [1, 2]);

export const GameCanvas = memo(function GameCanvas({ level }: { level: number }) {
  const runId = useGame((s) => s.runId);
  const [, bump] = useState(0);
  useEffect(() => {
    const update = () => bump((n) => n + 1);
    window.addEventListener('prefs-change', update);
    return () => window.removeEventListener('prefs-change', update);
  }, []);
  return (
    <Canvas
      shadows={prefs.shadows && prefs.quality !== 'Low' ? 'soft' : false}
      dpr={dprFor(prefs.quality)}
      camera={{ position: [0, 1.2, 7], fov: prefs.fov, near: 0.05, far: 60 }}
      gl={{ antialias: prefs.quality !== 'Low', powerPreference: 'high-performance' }}
      onCreated={({ gl, scene }) => {
        if (import.meta.env.DEV) Object.assign(window, { __gl: gl, __scene: scene });
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <FpsProbe />
      <Experience level={level} runId={runId} />
    </Canvas>
  );
});

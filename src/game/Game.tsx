import { useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Food, Human, Projectiles } from './Actors';
import { CameraRig, Player } from './Player';
import { Room } from './Room';
import { LEVELS } from './levels';
import { bathroomFood } from './Bathroom';
import { IntroSequence } from '../cinematic/IntroSequence';
import { MenuStage, PREVIEW_SCREENS } from '../ui/MenuStage';
import { prefs } from './prefs';
import { fpsMeter } from './fps';
import { useGame } from './store';

function FpsProbe() {
  useFrame((_, delta) => fpsMeter.sample(delta));
  return null;
}

function Experience({ level, runId }: { level: number; runId: number }) {
  const spec = LEVELS[level - 1];
  const exitUnlocked = useGame((s) => s.exitUnlocked);
  const screen = useGame((s) => s.screen);
  const inGame = useGame((s) => s.inGame);
  const preview = useGame((s) => s.previewMutation);
  const equipped = useGame((s) => s.equipped);
  if (screen === 'intro') return <IntroSequence />;
  if (!inGame) {
    const showPreview = PREVIEW_SCREENS.has(screen);
    return <MenuStage mode={showPreview ? 'preview' : 'menu'} mutation={showPreview ? preview : equipped} />;
  }
  return (
    <>
      <Room level={level} exitUnlocked={exitUnlocked} />
      {spec.humans.map((h, i) => (
        <Human key={`${level}-${runId}-${i}`} index={i} spec={h} id={`L${level}-H${i}`} />
      ))}
      {(spec.theme === 'bathroom' ? bathroomFood : spec.food).map((pos, i) => (
        <Food key={`${level}-${runId}-F${i}`} id={`L${level}-F${i}`} position={pos} index={i} level={level} />
      ))}
      <Projectiles />
      <Player key={`p-${level}-${runId}`} level={level} runId={runId} />
      <CameraRig resetKey={`${level}-${runId}`} />
    </>
  );
}

const dprFor = (q: string): number | [number, number] => (q === 'Low' ? 1 : q === 'Balanced' ? 1.25 : [1, 2]);

export function GameCanvas({ level }: { level: number }) {
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
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <FpsProbe />
      <Experience level={level} runId={runId} />
    </Canvas>
  );
}

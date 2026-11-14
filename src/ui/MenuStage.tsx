import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { RoachModel } from '../game/RoachModel';
import { Surface } from '../game/surfaces';
import { useGame, type Screen } from '../game/store';
import { MUTATIONS, type MutationId } from '../progression/MutationConfig';

export const PREVIEW_SCREENS: ReadonlySet<Screen> = new Set<Screen>(['collection', 'evolution', 'shop']);

export const stage = { yaw: 0, targetYaw: 0, drag: 0, spin: true, pointerX: 0, pointerY: 0 };

type Mode = 'menu' | 'preview';

const POSES: Record<Mode, { pos: [number, number, number]; look: [number, number, number]; fov: number }> = {
  menu: { pos: [-0.2, 0.55, 2.6], look: [0.75, 0.22, 0], fov: 36 },
  preview: { pos: [0.15, 0.62, 2.5], look: [0, 0.2, 0], fov: 32 },
};

export function StageCamera({ mode }: { mode: Mode }) {
  const look = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3(...POSES[mode].pos));
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = POSES[mode];
    const t = state.clock.elapsedTime;
    const sway = mode === 'menu' ? 1 : 0.25;
    const target = new THREE.Vector3(p.pos[0] + Math.sin(t * 0.22) * 0.22 * sway + stage.pointerX * 0.12, p.pos[1] + Math.sin(t * 0.31) * 0.04 + stage.pointerY * 0.06, p.pos[2] + Math.cos(t * 0.17) * 0.12 * sway);
    pos.current.lerp(target, 1 - Math.exp(-2.4 * dt));
    state.camera.position.copy(pos.current);
    look.current.lerp(new THREE.Vector3(...p.look), 1 - Math.exp(-3 * dt));
    state.camera.lookAt(look.current);
    const cam = state.camera as THREE.PerspectiveCamera;
    cam.fov = THREE.MathUtils.damp(cam.fov, p.fov, 3, dt);
    cam.updateProjectionMatrix();
  });
  return null;
}

function Turntable({ mutation, mode }: { mutation: MutationId; mode: Mode }) {
  const group = useRef<THREE.Group>(null);
  const cosmetics = useGame((s) => s.cosmeticsEquipped);
  const cos = useGame((s) => s.previewCosmetics);
  const scale = mode === 'menu' ? 0.95 : 1.05;
  const pop = useRef(0);
  const last = useRef(mutation);
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    if (last.current !== mutation) { last.current = mutation; pop.current = 1; }
    pop.current = Math.max(0, pop.current - dt * 3);
    if (stage.spin && !stage.drag) stage.targetYaw += dt * (mode === 'menu' ? 0.18 : 0.55);
    stage.yaw = THREE.MathUtils.damp(stage.yaw, stage.targetYaw, 8, dt);
    g.rotation.y = (mode === 'menu' ? -0.55 : 0.5) + stage.yaw;
    const bob = Math.sin(state.clock.elapsedTime * 1.6) * 0.012;
    const s = scale * (1 + Math.sin(pop.current * Math.PI) * 0.12);
    g.scale.setScalar(s);
    g.position.set(mode === 'menu' ? 0.85 : 0, 0.02 + bob, 0);
  });
  return (
    <group ref={group}>
      <RoachModel mutation={mutation} cosmetics={cos ?? cosmetics} />
    </group>
  );
}

function Plinth({ accent }: { accent: string }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (ring.current) ring.current.rotation.z += delta * 0.25; });
  return (
    <group position={[0, -0.01, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.6, 64]} />
        <meshStandardMaterial color="#17120f" roughness={0.9} />
      </mesh>
      <mesh ref={ring} position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.64, 96, 1, 0, Math.PI * 1.6]} />
        <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 0.805, 96]} />
        <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function MenuSet() {
  const light = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (light.current) light.current.intensity = 12 + Math.sin(state.clock.elapsedTime * 7) * 1.2 + Math.sin(state.clock.elapsedTime * 17) * 0.8;
  });
  return (
    <group>
      <Surface tex="scuffed_cement" w={14} h={14} span={2.6} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} tint="#8d8a82" gloss={0.15} />
      <mesh position={[0, 3, -3.4]} receiveShadow>
        <planeGeometry args={[14, 7]} />
        <meshStandardMaterial color="#1a1613" roughness={0.95} />
      </mesh>
      <mesh position={[-2.6, 1.1, -1.8]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 2.2, 18]} />
        <meshStandardMaterial color="#5d6468" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[3.0, 0.4, -1.4]} castShadow rotation={[0, 0.5, 0]}>
        <boxGeometry args={[1.4, 0.8, 1]} />
        <meshStandardMaterial color="#8a6b3c" roughness={0.9} />
      </mesh>
      <pointLight ref={light} position={[2.2, 0.8, -1.2]} color="#ffb870" distance={8} decay={1.8} castShadow />
      <spotLight position={[-1.2, 4.2, 1.4]} angle={0.5} penumbra={0.9} intensity={70} color="#fff0d0" distance={12} castShadow target-position={[0.55, 0, 0]} />
      <Sparkles count={50} scale={[7, 3, 5]} position={[0.5, 1.3, -0.6]} size={2.4} speed={0.18} color="#ffe2a8" opacity={0.5} />
    </group>
  );
}

function PreviewSet({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 2.5, -2.6]}>
        <planeGeometry args={[12, 7]} />
        <meshBasicMaterial color="#0c0a09" />
      </mesh>
      <Plinth accent={accent} />
      <spotLight position={[1.4, 3.2, 1.6]} angle={0.42} penumbra={0.9} intensity={80} color="#fff1d6" distance={10} castShadow target-position={[0, 0.1, 0]} />
      <spotLight position={[-2.2, 1.6, -1.4]} angle={0.7} penumbra={1} intensity={34} color={accent} distance={8} target-position={[0, 0.2, 0]} />
      <Sparkles count={36} scale={[3, 2, 3]} position={[0, 0.8, 0]} size={2.6} speed={0.2} color={accent} opacity={0.55} />
    </group>
  );
}

export function MenuStage({ mode, mutation }: { mode: Mode; mutation: MutationId }) {
  const def = MUTATIONS[mutation];
  const accent = useMemo(() => def.ability.color, [def]);
  return (
    <>
      <color attach="background" args={[mode === 'menu' ? '#100d0b' : '#0b0908']} />
      <fog attach="fog" args={[mode === 'menu' ? '#100d0b' : '#0b0908', 4, 11]} />
      <Environment resolution={96} background={false}>
        <Lightformer form="rect" intensity={1.4} color="#ffe2b8" position={[0, 5, 2]} scale={[8, 4, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={0.8} color="#9fb8d0" position={[-5, 2, 0]} scale={[4, 4, 1]} rotation-y={Math.PI / 2} />
      </Environment>
      <hemisphereLight args={['#ffe9cc', '#2a2018', 0.35]} />
      {mode === 'menu' ? <MenuSet /> : <PreviewSet accent={accent} />}
      <Turntable mutation={mutation} mode={mode} />
      <ContactShadows position={[mode === 'menu' ? 0.85 : 0, 0.011, 0]} opacity={0.5} scale={5} blur={2.4} far={2} resolution={256} />
      <StageCamera mode={mode} />
    </>
  );
}

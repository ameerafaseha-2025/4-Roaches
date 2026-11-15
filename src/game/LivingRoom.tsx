import { Suspense, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Prop } from './Bathroom';
import { Chrome } from './fixtures';
import { Block, Book, Curtain, Fan, Frame, Pillow, type Ob } from './props';
import { Architecture, ExitDoor, Lighting, WallWindow, type ShellStyle } from './Shell';
import { addExtraObstacle, makeBox, removeExtraObstacle, setHideZones, setObstacles, setRoom, stairs, STAIRS, stairEndZ, stairTop } from './sim';
import { useGame } from './store';
import { Surface } from './surfaces';
import { DIMS } from './world';

export const LIVING_STYLE: ShellStyle = {
  floorTex: 'wood_floor', floorSpan: 4.5, floorTint: '#e0c9a6',
  wallTex: 'plastered_wall_04', wallSpan: 7, wallTint: '#f6ead2',
  wainscot: 3.2, upper: '#e8d8b8', trim: '#fbf4e4', ceiling: '#fbf3e2', accent: '#a8714f',
  fog: '#e8d9bd', dark: false, lampColor: '#ffe3b0',
};

export const livingObstacles: Ob[] = [
  [0.6, 0.6, 1.4, 4.2, 1.2, 1.7],
  [0.6, 1.4, 2.3, 4.2, 2.8, 0.4],
  [0.6, 1.1, -5.1, 4.4, 2.2, 0.9],
  [0.6, 0.9, -0.9, 2.6, 0.14, 1.4],
  [-0.5, 0.42, -1.4, 0.12, 0.84, 0.12], [1.7, 0.42, -1.4, 0.12, 0.84, 0.12],
  [-0.5, 0.42, -0.4, 0.12, 0.84, 0.12], [1.7, 0.42, -0.4, 0.12, 0.84, 0.12],
  [3.8, 0.8, -3.6, 2.0, 1.6, 1.3],
  [-3.4, 1.2, -1.6, 1.5, 0.14, 1.5],
  [-5.8, 3.0, -3.9, 1.2, 6.0, 1.8],
  [5.5, 1.5, 3.8, 1.8, 3.0, 1.0],
];

export const livingHide: Ob[] = [
  [0.6, 0.45, -0.9, 2.2, 0.9, 1.1],
];

function TV() {
  const glow = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!glow.current) return;
    const t = s.clock.elapsedTime;
    (glow.current.material as THREE.MeshBasicMaterial).color.setHSL((t * 0.07) % 1, 0.45, 0.55 + Math.sin(t * 5) * 0.05);
  });
  return (
    <group position={[0.6, 0, -5.1]}>
      <Block p={[0, 1.1, 0]} s={[4.4, 2.2, 0.9]} c="#6f543a" rough={0.5} />
      <mesh position={[0, 3.4, 0.1]} castShadow><boxGeometry args={[3.2, 1.8, 0.14]} /><meshStandardMaterial color="#14151a" roughness={0.3} /></mesh>
      <mesh ref={glow} position={[0, 3.4, 0.19]}><planeGeometry args={[3.0, 1.65]} /><meshBasicMaterial color="#8ec5ff" toneMapped={false} /></mesh>
      <pointLight position={[0, 3.4, 1.4]} intensity={4} distance={7} color="#9fc8ff" />
      <mesh position={[0, 2.28, 0.1]}><boxGeometry args={[0.6, 0.12, 0.4]} /><meshStandardMaterial color="#1c1e22" /></mesh>
    </group>
  );
}

function Sofa() {
  return (
    <group position={[0.6, 0, 1.4]} rotation={[0, Math.PI, 0]}>
      <Block p={[0, 0.4, 0]} s={[4.2, 0.8, 1.7]} c="#6d8a79" rough={0.9} clear={0} r={0.12} />
      <Block p={[0, 1.5, -0.85]} s={[4.2, 1.7, 0.45]} c="#628070" rough={0.9} clear={0} r={0.14} />
      {[-2.0, 2.0].map((x) => <Block key={x} p={[x, 0.9, 0]} s={[0.4, 1.0, 1.7]} c="#628070" rough={0.9} clear={0} r={0.12} />)}
      {[-1.0, 1.0].map((x) => <Block key={x} p={[x, 0.95, 0.1]} s={[1.8, 0.28, 1.3]} c="#7a9886" rough={0.9} clear={0} r={0.1} />)}
      <Pillow position={[-1.5, 1.3, -0.3]} c="#e0b46a" s={[0.7, 0.7, 0.3]} />
      <Pillow position={[1.6, 1.3, -0.3]} c="#d28a6a" s={[0.7, 0.7, 0.3]} />
    </group>
  );
}

function CoffeeTable() {
  return (
    <group position={[0.6, 0, -0.9]}>
      <Block p={[0, 0.9, 0]} s={[2.6, 0.14, 1.4]} c="#a6805a" rough={0.4} clear={0.5} />
      {[[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]].map(([x, z], i) => <mesh key={i} position={[x, 0.42, z]} castShadow><boxGeometry args={[0.12, 0.84, 0.12]} /><meshStandardMaterial color="#7a5a3a" /></mesh>)}
      <Book position={[-0.6, 1.0, 0.1]} c="#d96a5a" s={[0.7, 0.08, 0.5]} ry={0.2} />
      <Book position={[-0.6, 1.08, 0.1]} c="#e8c35a" s={[0.6, 0.08, 0.45]} ry={-0.1} />
      <mesh position={[0.5, 1.06, -0.2]} castShadow><cylinderGeometry args={[0.13, 0.1, 0.2, 16]} /><meshPhysicalMaterial color="#fafafa" roughness={0.2} clearcoat={1} /></mesh>
      <mesh position={[0.9, 0.99, 0.3]} rotation={[0, 0.5, 0]}><boxGeometry args={[0.28, 0.03, 0.55]} /><meshStandardMaterial color="#1c1e22" /></mesh>
    </group>
  );
}

function Shelving() {
  return (
    <group position={[-5.8, 0, -3.9]}>
      <Block p={[0, 3.0, 0]} s={[1.2, 6.0, 1.8]} c="#7a5a3a" rough={0.5} />
      {[1.2, 2.4, 3.6, 4.8].map((y, i) => (
        <group key={y}>
          <mesh position={[0.35, y, 0]}><boxGeometry args={[0.6, 0.06, 1.7]} /><meshStandardMaterial color="#8a6a4a" /></mesh>
          {[-0.6, -0.1, 0.4].map((z, j) => <Book key={j} position={[0.35, y + 0.35, z]} c={['#d96a5a', '#5aa6c9', '#e8c35a', '#8fc29b', '#9a7ba3'][(i + j) % 5]} s={[0.4, 0.6, 0.18]} />)}
        </group>
      ))}
    </group>
  );
}

function Armchair() {
  return (
    <group position={[3.8, 0, -3.6]} rotation={[0, Math.PI / 2, 0]}>
      <Block p={[0, 0.4, 0]} s={[1.3, 0.8, 2.0]} c="#a8714f" rough={0.9} clear={0} r={0.12} />
      <Block p={[0.5, 1.2, 0]} s={[0.3, 1.5, 2.0]} c="#98654a" rough={0.9} clear={0} r={0.12} />
      <Pillow position={[0, 0.95, 0.2]} c="#e9d7a8" s={[0.9, 0.3, 0.9]} />
    </group>
  );
}

function Chair() {
  return (
    <group position={[-3.4, 0, -1.6]} rotation={[0, 2.29 + Math.PI, 0]}>
      <Block p={[0, 1.2, 0]} s={[1.5, 0.14, 1.5]} c="#a8714f" rough={0.8} clear={0} r={0.06} />
      <Block p={[0, 2.0, -0.7]} s={[1.5, 1.7, 0.12]} c="#98654a" rough={0.8} clear={0} r={0.06} />
      {[[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]].map(([x, z], i) => <mesh key={i} position={[x, 0.6, z]} castShadow><boxGeometry args={[0.12, 1.2, 0.12]} /><meshStandardMaterial color="#6f4a2e" /></mesh>)}
    </group>
  );
}

const stairWalls = () => [
  makeBox(STAIRS.x - STAIRS.width / 2 - 0.15, stairTop() / 2, STAIRS.z0 - (STAIRS.count * STAIRS.depth) / 2, 0.3, stairTop() + 1, STAIRS.count * STAIRS.depth),
  makeBox(STAIRS.x + STAIRS.width / 2 + 0.15, stairTop() / 2, STAIRS.z0 - (STAIRS.count * STAIRS.depth) / 2, 0.3, stairTop() + 1, STAIRS.count * STAIRS.depth),
  makeBox(STAIRS.x, stairTop() / 2, stairEndZ() - 0.4, STAIRS.width + 0.6, stairTop() + 1, 0.8),
];

function StairCase() {
  const open = useGame((s) => s.bossDefeated);
  const steps = useRef<(THREE.Mesh | null)[]>([]);
  const glow = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  const solid = useRef(false);
  const walls = useRef<ReturnType<typeof stairWalls>>([]);
  useEffect(() => {
    t.current = 0;
    solid.current = false;
    return () => {
      walls.current.forEach(removeExtraObstacle);
      walls.current = [];
      stairs.active = false;
    };
  }, [open]);
  useFrame((state, delta) => {
    if (!open) return;
    t.current += Math.min(delta, 0.05);
    const k = t.current;
    steps.current.forEach((m, i) => {
      if (!m) return;
      const h = (i + 1) * STAIRS.rise;
      const p = Math.min(1, Math.max(0, (k - i * 0.06) / 0.6));
      const e = 1 - Math.pow(1 - p, 3);
      m.position.y = h / 2 - (1 - e) * (h + 0.4);
      m.visible = p > 0;
    });
    if (!solid.current && k > 0.06 * STAIRS.count + 0.7) {
      solid.current = true;
      stairs.active = true;
      walls.current = stairWalls();
      walls.current.forEach(addExtraObstacle);
    }
    if (glow.current) (glow.current.material as THREE.MeshBasicMaterial).opacity = Math.min(0.75, Math.max(0, k - 1.2)) * (0.85 + Math.sin(state.clock.elapsedTime * 2.4) * 0.15);
  });
  if (!open) return null;
  return (
    <group>
      {Array.from({ length: STAIRS.count }).map((_, i) => {
        const h = (i + 1) * STAIRS.rise;
        return (
          <mesh key={i} ref={(m) => { steps.current[i] = m; }} position={[STAIRS.x, -h, STAIRS.z0 - (i + 0.5) * STAIRS.depth]} castShadow receiveShadow>
            <boxGeometry args={[STAIRS.width, h, STAIRS.depth - 0.01]} />
            <meshPhysicalMaterial color={i % 2 ? '#c9a063' : '#d7b278'} roughness={0.5} clearcoat={0.35} />
          </mesh>
        );
      })}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[STAIRS.x + s * (STAIRS.width / 2 + 0.05), stairTop() / 2 + 0.3, STAIRS.z0 - (STAIRS.count * STAIRS.depth) / 2]} rotation={[Math.atan2(stairTop(), STAIRS.count * STAIRS.depth), 0, 0]}>
          <boxGeometry args={[0.08, 0.1, Math.hypot(stairTop(), STAIRS.count * STAIRS.depth)]} />
          <meshStandardMaterial color="#6f4a2e" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[STAIRS.x, stairTop() / 2, stairEndZ() - 0.4]} castShadow>
        <boxGeometry args={[STAIRS.width, stairTop(), 0.8]} />
        <meshPhysicalMaterial color="#d7b278" roughness={0.5} clearcoat={0.35} />
      </mesh>
      <mesh ref={glow} position={[STAIRS.x, stairTop() + 1.5, -5.38]}>
        <planeGeometry args={[1.8, 3]} />
        <meshBasicMaterial color="#fff0b8" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[STAIRS.x, stairTop() + 3.05, -5.36]}>
        <boxGeometry args={[2.0, 0.14, 0.14]} />
        <meshStandardMaterial color="#e3b84f" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Clock() {
  const hand = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (hand.current) hand.current.rotation.z = -s.clock.elapsedTime * 0.2; });
  return (
    <group position={[6.4, 5.4, 0.6]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh><circleGeometry args={[0.55, 32]} /><meshStandardMaterial color="#fbf7ee" /></mesh>
      <mesh position={[0, 0, -0.01]}><ringGeometry args={[0.52, 0.6, 32]} /><meshStandardMaterial color="#6b5a4a" /></mesh>
      <mesh ref={hand} position={[0, 0, 0.01]}><boxGeometry args={[0.04, 0.4, 0.01]} /><meshBasicMaterial color="#2a2a2a" /></mesh>
    </group>
  );
}

function LivingSet() {
  return (
    <group>
      <TV />
      <Sofa />
      <CoffeeTable />
      <Shelving />
      <Armchair />
      <Chair />
      <Clock />
      <Surface tex="dirty_carpet" w={5.0} h={3.4} span={2.6} position={[0.6, 0.016, 0.2]} rotation={[-Math.PI / 2, 0, 0]} tint="#c98f6a" gloss={0} />
      <Prop name="potted_plant_01" position={[5.5, 3.0, 3.8]} scale={1.2} />
      <Prop name="wicker_basket_01" position={[-5.0, 0, -1.2]} scale={1.8} />
      <Block p={[5.5, 1.5, 3.8]} s={[1.8, 3.0, 1.0]} c="#7a5a3a" rough={0.5} />
      <Fan position={[0.6, 7.4, 0.2]} blades={5} />
      <Frame position={[-3.4, 5.0, -5.4]} w={2.2} h={1.4} art="#8fb28a" />
      <Frame position={[3.6, 5.2, -5.4]} w={1.4} h={1.8} art="#d9a35a" />
      <Curtain position={[-6.3, 3.8, -1.6]} w={2.4} h={3.8} color="#c97b6a" rotationY={Math.PI / 2} />
      <StairCase />
      <mesh position={[-1.0, 0.03, 3.6]} castShadow><cylinderGeometry args={[0.22, 0.22, 0.06, 16]} /><Chrome /></mesh>
    </group>
  );
}

export function LivingRoom({ exitUnlocked }: { exitUnlocked: boolean }) {
  const dims = DIMS.living;
  setRoom(dims.halfX, dims.halfZ, dims.height);
  useEffect(() => {
    setObstacles(livingObstacles);
    setHideZones(livingHide);
  }, []);
  return (
    <group>
      <Lighting style={LIVING_STYLE} dims={dims} />
      <Architecture dims={dims} style={LIVING_STYLE} />
      <WallWindow position={[6.46, 4.8, -3.0]} rotation={[0, -Math.PI / 2, 0]} w={2.4} h={2.0} />
      <WallWindow position={[-6.46, 4.6, -1.6]} rotation={[0, Math.PI / 2, 0]} w={2.0} h={1.6} />
      <ExitDoor dims={dims} active={exitUnlocked} color={LIVING_STYLE.accent} />
      <Suspense fallback={null}>
        <LivingSet />
      </Suspense>
    </group>
  );
}

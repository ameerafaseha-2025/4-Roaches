import { Suspense, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Prop } from './Bathroom';
import { Bottle, Chrome, Cloth, Hamper, Wood } from './fixtures';
import { Architecture, ExitDoor, Lighting, WallWindow, type ShellStyle } from './Shell';
import { setHideZones, setObstacles, setRoom } from './sim';
import { Surface } from './surfaces';
import { DIMS } from './world';

type V3 = [number, number, number];
type Ob = [number, number, number, number, number, number];

export const STORE_STYLE: ShellStyle = {
  floorTex: 'scuffed_cement', floorSpan: 4, floorTint: '#cfc8bb',
  wallTex: 'plastered_wall_04', wallSpan: 7, wallTint: '#fff1d6',
  wainscot: 2.6, upper: '#e2d6bd', trim: '#cbbfa6', ceiling: '#e6dfcf', accent: '#d08b3c',
  fog: '#bdb4a2', dark: false, lampColor: '#ffe0aa',
};

const SHELF_W = 3.2;
const SHELF_D = 1.1;
const SHELF_H = 5;
const LEVELS_Y = [0.45, 1.75, 3.05, 4.35];

export const storeObstacles: Ob[] = [
  [-3.2, SHELF_H / 2, -4.9, SHELF_W, SHELF_H, SHELF_D],
  [0.4, SHELF_H / 2, -4.9, SHELF_W, SHELF_H, SHELF_D],
  [5.85, SHELF_H / 2, -2.6, SHELF_D, SHELF_H, SHELF_W],
  [5.6, 2.55, 1.6, 1.5, 0.2, 3.2],
  [6.2, 1.2, 0.2, 0.2, 2.4, 0.2], [6.2, 1.2, 3.0, 0.2, 2.4, 0.2],
  [5.0, 1.2, 0.2, 0.2, 2.4, 0.2], [5.0, 1.2, 3.0, 0.2, 2.4, 0.2],
  [-5.65, 2.2, -4.3, 1.8, 4.4, 1.6],
  [-5.6, 1.1, -1.6, 1.9, 2.3, 1.9],
  [-5.5, 0.55, 4.5, 1.5, 1.1, 1.4],
  [-5.5, 1.55, 4.5, 1.2, 0.9, 1.2],
  [3.4, 0.45, 4.7, 1.1, 0.9, 1.1],
  [4.6, 0.6, 4.6, 1.3, 1.2, 1.2],
  [-4.8, 0.5, -3.0, 1.1, 1.0, 1.1],
  [2.4, 0.28, 4.9, 0.56, 0.56, 0.56],
  [2.0, 0.28, 5.1, 0.56, 0.56, 0.56],
  [-1.2, 0.44, -3.5, 0.5, 0.88, 0.5],
  [2.5, 0.68, -3.8, 0.55, 1.35, 0.55],
  [-2.8, 0.37, 3.6, 0.5, 0.73, 0.5],
];

export const storeHide: Ob[] = [
  [5.6, 1.2, 1.6, 1.1, 2.4, 2.9],
  [-5.5, 0.35, 4.5, 1.3, 0.7, 1.2],
];

const CARD = ['#b98d52', '#a67b45', '#c69a5c', '#b0834a'];

function Crate({ p, s, c = CARD[0], r = 0 }: { p: V3; s: V3; c?: string; r?: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <RoundedBox args={s} radius={0.03} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={c} roughness={0.92} sheen={0.5} sheenColor="#e8cfa0" />
      </RoundedBox>
      <mesh position={[0, s[1] / 2 + 0.003, 0]}>
        <boxGeometry args={[0.1, 0.004, s[2] * 0.98]} />
        <meshStandardMaterial color="#d8c08a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, s[2] / 2 + 0.003]}>
        <planeGeometry args={[s[0] * 0.4, s[1] * 0.28]} />
        <meshStandardMaterial color="#f1ead7" roughness={0.9} />
      </mesh>
    </group>
  );
}

function PaintCan({ p, c, s = 1 }: { p: V3; c: string; s?: number }) {
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 24]} />
        <meshStandardMaterial color="#c9ccd0" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.405, 0]}>
        <cylinderGeometry args={[0.185, 0.185, 0.012, 24]} />
        <meshPhysicalMaterial color={c} roughness={0.35} clearcoat={0.6} />
      </mesh>
      <mesh position={[0.1, 0.12, 0.16]} rotation={[0, 0.5, 0]}>
        <planeGeometry args={[0.22, 0.16]} />
        <meshStandardMaterial color={c} roughness={0.7} />
      </mesh>
    </group>
  );
}

function ShelfUnit({ position, rotationY = 0, seed = 0 }: { position: V3; rotationY?: number; seed?: number }) {
  const posts: V3[] = [[-1, 0, -1], [1, 0, -1], [-1, 0, 1], [1, 0, 1]].map(([x, , z]) => [x * (SHELF_W / 2 - 0.06), SHELF_H / 2, z * (SHELF_D / 2 - 0.06)]);
  const rnd = (n: number) => { const v = Math.sin((n + seed) * 91.7) * 43758.5; return v - Math.floor(v); };
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {posts.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.1, SHELF_H, 0.1]} />
          <meshStandardMaterial color="#5b6b78" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {LEVELS_Y.map((y, li) => (
        <group key={y}>
          <mesh position={[0, y - 0.04, 0]} receiveShadow castShadow>
            <boxGeometry args={[SHELF_W - 0.1, 0.08, SHELF_D - 0.1]} />
            <meshStandardMaterial color="#8c7352" roughness={0.8} />
          </mesh>
          {li === 0 && (
            <>
              <Crate p={[-1.0, y + 0.4, 0]} s={[0.9, 0.8, 0.8]} c={CARD[Math.floor(rnd(1) * 4)]} r={0.05} />
              <Crate p={[0.05, y + 0.3, 0.05]} s={[0.8, 0.6, 0.7]} c={CARD[Math.floor(rnd(2) * 4)]} r={-0.08} />
              <Crate p={[1.0, y + 0.45, 0]} s={[0.85, 0.9, 0.8]} c={CARD[Math.floor(rnd(3) * 4)]} />
            </>
          )}
          {li === 1 && (
            <>
              {[-1.1, -0.7, -0.3].map((x, i) => <PaintCan key={i} p={[x, y, 0.1 * (i % 2)]} c={['#d96a5a', '#5aa6c9', '#e8c35a'][i]} s={1 + rnd(i + 5) * 0.2} />)}
              <PaintCan p={[-0.9, y + 0.4, 0.05]} c="#8fc29b" />
              <Crate p={[0.5, y + 0.35, 0]} s={[1.0, 0.7, 0.8]} c={CARD[Math.floor(rnd(9) * 4)]} r={0.04} />
              <Bottle position={[1.25, y, 0.1]} color="#6aa6d6" h={0.7} r={0.12} label="#f2f7ff" />
            </>
          )}
          {li === 2 && (
            <>
              <mesh position={[-0.8, y + 0.2, 0]} scale={[1.0, 0.4, 0.8]} castShadow>
                <sphereGeometry args={[0.5, 20, 14]} />
                <Cloth color="#c97b9a" />
              </mesh>
              <mesh position={[-0.7, y + 0.5, 0.05]} scale={[0.9, 0.3, 0.7]} castShadow>
                <sphereGeometry args={[0.5, 20, 14]} />
                <Cloth color="#e9d7a8" />
              </mesh>
              <Crate p={[0.6, y + 0.3, 0]} s={[1.1, 0.6, 0.8]} c={CARD[Math.floor(rnd(13) * 4)]} />
              <Bottle position={[1.3, y, -0.1]} color="#e8a0c8" h={0.6} r={0.12} cap="#b4568a" label="#fff0f8" />
            </>
          )}
          {li === 3 && (
            <>
              <Crate p={[-0.9, y + 0.25, 0]} s={[0.8, 0.5, 0.7]} c={CARD[Math.floor(rnd(17) * 4)]} />
              <Crate p={[0.1, y + 0.4, 0]} s={[1.0, 0.8, 0.8]} c={CARD[Math.floor(rnd(19) * 4)]} r={0.1} />
              <PaintCan p={[1.1, y, 0]} c="#d96a5a" />
            </>
          )}
        </group>
      ))}
    </group>
  );
}

function Workbench() {
  return (
    <group position={[5.6, 0, 1.6]}>
      <RoundedBox args={[1.5, 0.2, 3.2]} radius={0.04} position={[0, 2.5, 0]} castShadow receiveShadow>
        <Wood color="#a87c4a" />
      </RoundedBox>
      {[[-0.6, -1.4], [0.6, -1.4], [-0.6, 1.4], [0.6, 1.4]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.2, z]} castShadow>
          <boxGeometry args={[0.2, 2.4, 0.2]} />
          <Wood color="#8a5f3a" />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <boxGeometry args={[1.3, 0.08, 3.0]} />
        <Wood color="#8a5f3a" />
      </mesh>
      <Crate p={[0, 0.9, 0.2]} s={[0.9, 0.8, 0.9]} c={CARD[1]} r={0.2} />
      <Crate p={[0.1, 0.6, -0.9]} s={[0.7, 0.4, 0.7]} c={CARD[2]} />
      <group position={[0.1, 2.6, -0.8]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.7, 0.36, 0.5]} />
          <meshPhysicalMaterial color="#d8a23a" roughness={0.4} clearcoat={0.5} />
        </mesh>
        <mesh position={[0.25, 0.4, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.3]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      </group>
      <Prop name="all_purpose_cleaner" position={[-0.1, 2.6, 0.5]} scale={2.6} rotation={[0, 0.6, 0]} />
      <Prop name="drain_cleaner" position={[0.2, 2.6, 1.2]} scale={2.6} rotation={[0, -0.5, 0]} />
      <mesh position={[-0.3, 2.64, -0.1]} rotation={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.15, 0.3, 20]} />
        <meshStandardMaterial color="#c9ccd0" metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  );
}

function WaterHeater() {
  return (
    <group position={[-5.7, 0, -4.3]}>
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.78, 0.78, 4.4, 36]} />
        <meshPhysicalMaterial color="#e6e8e6" roughness={0.3} clearcoat={0.7} />
      </mesh>
      <mesh position={[0, 4.4, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.1, 36]} />
        <Chrome />
      </mesh>
      {[0.5, 4.0].map((y) => (
        <mesh key={y} position={[0.1, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.78, 0.04, 8, 36]} />
          <Chrome />
        </mesh>
      ))}
      <mesh position={[0.79, 2.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial color="#2a2f35" />
      </mesh>
      <mesh position={[0.8, 2.6, 0.22]}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshBasicMaterial color="#5cff8a" toneMapped={false} />
      </mesh>
      <mesh position={[0.3, 4.9, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.0, 12]} />
        <Chrome />
      </mesh>
    </group>
  );
}

function MopBucket({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.42, 1.0, 28, 1, true]} />
        <meshPhysicalMaterial color="#e8b43a" roughness={0.4} clearcoat={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.06, 28]} />
        <meshStandardMaterial color="#c9952a" />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <circleGeometry args={[0.5, 28]} />
        <meshPhysicalMaterial color="#6fb0c8" roughness={0.1} clearcoat={1} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 1.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.55, 0.025, 8, 24, Math.PI]} />
        <Chrome />
      </mesh>
      <mesh position={[0.15, 1.8, 0.1]} rotation={[0.18, 0, -0.15]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.6, 10]} />
        <Wood color="#c9a063" />
      </mesh>
      <mesh position={[0.4, 0.95, 0.2]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.28, 16, 12]} />
        <Cloth color="#e9e4d8" />
      </mesh>
    </group>
  );
}

function Pegboard() {
  return (
    <group position={[3.9, 3.7, -5.4]}>
      <mesh receiveShadow>
        <boxGeometry args={[2.8, 2.2, 0.08]} />
        <meshStandardMaterial color="#b89968" roughness={0.85} />
      </mesh>
      {Array.from({ length: 6 }).flatMap((_, r) => Array.from({ length: 11 }).map((__, c) => (
        <mesh key={`${r}-${c}`} position={[-1.25 + c * 0.25, -0.9 + r * 0.36, 0.045]}>
          <circleGeometry args={[0.02, 6]} />
          <meshBasicMaterial color="#5a4630" />
        </mesh>
      )))}
      <group position={[-0.8, 0.3, 0.12]} rotation={[0, 0, 0.1]}>
        <mesh castShadow><boxGeometry args={[0.08, 1.0, 0.06]} /><Wood color="#8a5f3a" /></mesh>
        <mesh position={[0, 0.6, 0]} castShadow><boxGeometry args={[0.5, 0.2, 0.08]} /><Chrome /></mesh>
      </group>
      <group position={[0.1, 0.1, 0.12]}>
        <mesh castShadow><cylinderGeometry args={[0.04, 0.04, 1.2, 8]} /><Wood color="#c9a063" /></mesh>
        <mesh position={[0, -0.7, 0]} castShadow><boxGeometry args={[0.6, 0.12, 0.1]} /><meshStandardMaterial color="#c24a3a" /></mesh>
      </group>
      <group position={[0.9, 0.2, 0.12]}>
        <mesh castShadow><torusGeometry args={[0.28, 0.035, 8, 20]} /><meshStandardMaterial color="#d98a2a" /></mesh>
      </group>
      <mesh position={[-0.2, -0.5, 0.12]} castShadow>
        <boxGeometry args={[0.32, 0.5, 0.1]} />
        <meshStandardMaterial color="#d8403f" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Ladder() {
  return (
    <group position={[4.2, 0, 5.1]} rotation={[0.2, 0, 0]}>
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 2.3, 0]} castShadow>
          <boxGeometry args={[0.1, 4.6, 0.1]} />
          <meshStandardMaterial color="#d99a3a" metalness={0.4} roughness={0.45} />
        </mesh>
      ))}
      {[0.6, 1.4, 2.2, 3.0, 3.8].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[0.7, 0.07, 0.12]} />
          <meshStandardMaterial color="#c9ccd0" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function SwingBulb() {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => { if (g.current) g.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.9) * 0.05; });
  return (
    <group position={[0.4, 7.4, 0.6]}>
      <group ref={g}>
        <mesh position={[0, -1.1, 0]}><cylinderGeometry args={[0.015, 0.015, 2.2, 6]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh position={[0, -2.35, 0]}><cylinderGeometry args={[0.07, 0.06, 0.2, 10]} /><meshStandardMaterial color="#444" /></mesh>
        <mesh position={[0, -2.6, 0]}><sphereGeometry args={[0.2, 20, 16]} /><meshStandardMaterial color="#fff4d0" emissive="#ffe3a0" emissiveIntensity={3} toneMapped={false} /></mesh>
      </group>
    </group>
  );
}

function StoreSet() {
  return (
    <group>
      <ShelfUnit position={[-3.2, 0, -4.9]} seed={1} />
      <ShelfUnit position={[0.4, 0, -4.9]} seed={7} />
      <ShelfUnit position={[5.85, 0, -2.6]} rotationY={-Math.PI / 2} seed={13} />
      <Workbench />
      <WaterHeater />
      <Hamper position={[-5.6, 0, -1.6]} />
      <MopBucket position={[-4.8, 0, -3.0]} />
      <Pegboard />
      <Ladder />
      <SwingBulb />

      <Crate p={[-5.5, 0.55, 4.5]} s={[1.5, 1.1, 1.4]} c={CARD[0]} r={0.1} />
      <Crate p={[-5.5, 1.55, 4.5]} s={[1.2, 0.9, 1.2]} c={CARD[3]} r={-0.15} />
      <Crate p={[3.4, 0.45, 4.7]} s={[1.1, 0.9, 1.1]} c={CARD[2]} r={0.3} />
      <Crate p={[4.6, 0.6, 4.6]} s={[1.3, 1.2, 1.2]} c={CARD[1]} r={-0.1} />
      <PaintCan p={[2.4, 0, 4.9]} c="#5aa6c9" s={1.4} />
      <PaintCan p={[2.0, 0, 5.1]} c="#d96a5a" s={1.4} />

      <Surface tex="dirty_carpet" w={3.2} h={2.2} span={2.2} position={[0.3, 0.014, 0.4]} rotation={[-Math.PI / 2, 0, 0]} tint="#a79a86" gloss={0} />

      <Prop name="bleach_bottle" position={[-1.2, 0, -3.5]} scale={3.0} rotation={[0, 0.6, 0]} />
      <Prop name="plunger" position={[2.5, 0, -3.8]} scale={3.2} />
      <Prop name="multi_cleaner_bottle" position={[-2.8, 0, 3.6]} scale={3.2} rotation={[0, -0.5, 0]} />
      <Prop name="wicker_basket_01" position={[-3.4, 0, 1.2]} scale={2.0} rotation={[0, 0.4, 0]} />
      <Prop name="potted_plant_01" position={[5.6, 2.6, 2.8]} scale={0.9} />
    </group>
  );
}

export function StoreRoom({ exitUnlocked }: { exitUnlocked: boolean }) {
  const dims = DIMS.store;
  setRoom(dims.halfX, dims.halfZ, dims.height);
  useEffect(() => {
    setObstacles(storeObstacles);
    setHideZones(storeHide);
  }, []);
  return (
    <group>
      <Lighting style={STORE_STYLE} dims={dims} />
      <Architecture dims={dims} style={STORE_STYLE} />
      <WallWindow position={[6.46, 5.2, -0.4]} rotation={[0, -Math.PI / 2, 0]} w={2.2} h={1.6} />
      <WallWindow position={[-1.6, 5.4, 5.46]} rotation={[0, Math.PI, 0]} w={2.0} h={1.4} />
      <ExitDoor dims={dims} active={exitUnlocked} color={STORE_STYLE.accent} />
      <Suspense fallback={null}>
        <StoreSet />
      </Suspense>
    </group>
  );
}

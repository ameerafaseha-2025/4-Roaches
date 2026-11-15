import { Suspense, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Prop } from './Bathroom';
import { Chrome, Cloth } from './fixtures';
import { Block, Book, Curtain, Frame, Pillow, type Ob } from './props';
import { Architecture, ExitDoor, Lighting, WallWindow, type ShellStyle } from './Shell';
import { setHideZones, setObstacles, setRoom } from './sim';
import { Surface } from './surfaces';
import { DIMS } from './world';
import * as THREE from 'three';

export const BEDROOM_STYLE: ShellStyle = {
  floorTex: 'laminate_floor_02', floorSpan: 4, floorTint: '#d8c2b4',
  wallTex: 'plastered_wall_04', wallSpan: 7, wallTint: '#e7d9ec',
  wainscot: 3.0, upper: '#cdbbd6', trim: '#f1e9f2', ceiling: '#eee7ef', accent: '#c08ab0',
  fog: '#4a3f5c', dark: true, lampColor: '#ffd9a8',
};

export const bedroomObstacles: Ob[] = [
  [0.4, 0.9, -4.0, 4.6, 1.8, 3.4],
  [-5.4, 3.2, -4.3, 1.7, 6.4, 2.6],
  [-3.4, 0.55, -5.0, 1.0, 1.1, 0.8],
  [3.9, 0.55, -5.0, 1.0, 1.1, 0.8],
  [5.7, 2.5, 1.0, 1.4, 0.18, 2.8],
  [5.2, 1.2, -0.2, 0.14, 2.4, 0.14], [6.2, 1.2, -0.2, 0.14, 2.4, 0.14],
  [5.2, 1.2, 2.2, 0.14, 2.4, 0.14], [6.2, 1.2, 2.2, 0.14, 2.4, 0.14],
  [-5.6, 1.1, -1.0, 1.6, 2.2, 3.0],
  [3.4, 0.25, 4.5, 1.6, 0.5, 1.2],
];

export const bedroomHide: Ob[] = [
  [5.7, 0.8, 1.0, 1.0, 1.6, 2.3],
];

function Bed() {
  return (
    <group position={[0.4, 0, -4.0]}>
      <Block p={[0, 0.45, 0]} s={[4.6, 0.9, 3.4]} c="#8a6a4a" rough={0.55} />
      <Block p={[0, 1.2, 0.1]} s={[4.4, 0.6, 3.1]} c="#e9e2f0" rough={0.9} clear={0} r={0.1} />
      <Block p={[0.3, 1.55, 0.5]} s={[4.0, 0.18, 2.4]} c="#9a7ba3" rough={0.9} clear={0} r={0.08} />
      <Block p={[0, 2.0, -1.7]} s={[4.7, 2.2, 0.2]} c="#6f543a" rough={0.5} />
      <Pillow position={[-1.2, 1.65, -1.1]} c="#f4eef6" />
      <Pillow position={[0.3, 1.65, -1.1]} c="#f4eef6" />
      <Pillow position={[1.6, 1.62, -1.2]} c="#c08ab0" s={[0.7, 0.28, 0.5]} />
      <mesh position={[0.9, 1.7, 0.4]} castShadow><sphereGeometry args={[0.22, 16, 12]} /><meshStandardMaterial color="#d8c9a0" roughness={0.9} /></mesh>
    </group>
  );
}

function Wardrobe() {
  return (
    <group position={[-5.4, 0, -4.3]}>
      <Block p={[0, 3.2, 0]} s={[1.7, 6.4, 2.6]} c="#8a6a4a" rough={0.5} />
      {[-0.65, 0.65].map((z) => (
        <group key={z}>
          <mesh position={[0.87, 3.2, z]} castShadow><boxGeometry args={[0.05, 5.8, 1.2]} /><meshPhysicalMaterial color="#9a7a58" roughness={0.45} clearcoat={0.4} /></mesh>
          <mesh position={[0.93, 3.2, z * 0.3]}><boxGeometry args={[0.06, 0.8, 0.07]} /><Chrome /></mesh>
        </group>
      ))}
      <mesh position={[0.92, 3.2, 0]}><boxGeometry args={[0.02, 5.9, 0.04]} /><meshStandardMaterial color="#2a1d12" /></mesh>
    </group>
  );
}

function Desk() {
  const glow = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (glow.current) (glow.current.material as THREE.MeshBasicMaterial).opacity = 0.85 + Math.sin(s.clock.elapsedTime * 2) * 0.05; });
  return (
    <group position={[5.7, 0, 1.0]}>
      <Block p={[0, 2.5, 0]} s={[1.4, 0.18, 2.8]} c="#a87c4a" rough={0.5} />
      {[[-0.5, -1.2], [0.5, -1.2], [-0.5, 1.2], [0.5, 1.2]].map(([x, z], i) => <mesh key={i} position={[x, 1.25, z]} castShadow><boxGeometry args={[0.12, 2.5, 0.12]} /><meshStandardMaterial color="#6f543a" /></mesh>)}
      <group position={[0.2, 2.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[1.3, 0.8, 0.08]} /><meshStandardMaterial color="#1c1e22" roughness={0.3} /></mesh>
        <mesh ref={glow} position={[0, 0.5, 0.05]}><planeGeometry args={[1.2, 0.7]} /><meshBasicMaterial color="#9fd0ff" transparent opacity={0.85} toneMapped={false} /></mesh>
        <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.4, 0.1, 0.25]} /><meshStandardMaterial color="#2a2c30" /></mesh>
      </group>
      <Book position={[-0.2, 2.64, 0.9]} c="#d96a5a" />
      <Book position={[-0.2, 2.72, 0.9]} c="#5aa6c9" ry={0.2} />
      <mesh position={[-0.1, 3.0, -1.0]} castShadow><cylinderGeometry args={[0.2, 0.25, 0.1, 18]} /><meshStandardMaterial color="#d8d0c0" /></mesh>
      <mesh position={[-0.1, 3.4, -1.0]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.03, 0.03, 0.8, 8]} /><meshStandardMaterial color="#d8d0c0" /></mesh>
    </group>
  );
}

function Nightstand({ x }: { x: number }) {
  return (
    <group position={[x, 0, -5.0]}>
      <Block p={[0, 0.55, 0]} s={[1.0, 1.1, 0.8]} c="#8a6a4a" rough={0.5} />
      <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.18, 0.28, 0.5, 20]} /><meshStandardMaterial color="#f6e7c8" emissive="#ffd9a0" emissiveIntensity={0.9} /></mesh>
      <Book position={[0.2, 1.14, 0.1]} c="#7a5a9a" s={[0.4, 0.06, 0.3]} />
    </group>
  );
}

function BedroomSet() {
  return (
    <group>
      <Bed />
      <Wardrobe />
      <Desk />
      <Nightstand x={-3.4} />
      <Nightstand x={3.9} />
      <Block p={[-5.6, 1.1, -1.0]} s={[1.6, 2.2, 3.0]} c="#7a5a3a" rough={0.5}>
        {[0.45, 0.0, -0.45].map((y) => <mesh key={y} position={[0.82, y, 0]}><boxGeometry args={[0.04, 0.55, 2.7]} /><meshStandardMaterial color="#8a6a4a" /></mesh>)}
      </Block>
      <Block p={[3.4, 0.25, 4.5]} s={[1.6, 0.5, 1.2]} c="#e07a8a" rough={0.9} clear={0} r={0.12} />
      <mesh position={[3.2, 0.62, 4.5]} castShadow><sphereGeometry args={[0.26, 14, 10]} /><Cloth color="#f1e3b8" /></mesh>
      <Surface tex="dirty_carpet" w={4.2} h={2.6} span={2.4} position={[0.4, 0.014, -0.4]} rotation={[-Math.PI / 2, 0, 0]} tint="#c5a4c9" gloss={0} />
      <Prop name="potted_plant_01" position={[-5.6, 2.2, -1.0]} scale={0.9} />
      <Prop name="wicker_basket_01" position={[4.8, 0, 4.4]} scale={1.8} />
      <Frame position={[0.4, 5.3, -5.4]} w={2.0} h={1.3} art="#9a7ba3" />
      <Curtain position={[-6.3, 3.5, -1.4]} w={2.6} h={3.6} color="#8a6aa8" rotationY={Math.PI / 2} />
    </group>
  );
}

export function BedroomRoom({ exitUnlocked }: { exitUnlocked: boolean }) {
  const dims = DIMS.bedroom;
  setRoom(dims.halfX, dims.halfZ, dims.height);
  useEffect(() => {
    setObstacles(bedroomObstacles);
    setHideZones(bedroomHide);
  }, []);
  return (
    <group>
      <Lighting style={BEDROOM_STYLE} dims={dims} />
      <Architecture dims={dims} style={BEDROOM_STYLE} />
      <WallWindow position={[-6.46, 4.6, -1.4]} rotation={[0, Math.PI / 2, 0]} w={2.2} h={2.0} night />
      <ExitDoor dims={dims} active={exitUnlocked} color={BEDROOM_STYLE.accent} />
      <Suspense fallback={null}>
        <BedroomSet />
      </Suspense>
    </group>
  );
}

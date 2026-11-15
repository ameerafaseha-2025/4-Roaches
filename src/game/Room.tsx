import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, RoundedBox, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { LEVELS } from './levels';
import { Soft } from './look';
import { ROOM, setHideZones, setObstacles, setRoom } from './sim';
import { Component, Suspense, type ReactNode } from 'react';
import { BathroomSet, bathroomHide, bathroomObstacles } from './Bathroom';
import { Architecture, ExitDoor, Lighting, WallWindow, type ShellStyle } from './Shell';
import { DIMS } from './world';
import { StoreRoom } from './StoreRoom';
import { KitchenRoom } from './KitchenRoom';
import { BedroomRoom } from './BedroomRoom';
import { LivingRoom } from './LivingRoom';

type Item = { p: [number, number, number]; s: [number, number, number]; c: string; clear?: number; glow?: boolean };

const item = (x: number, z: number, w: number, d: number, h: number, c: string, y = 0, clear = 0): Item => ({ p: [x, y + h / 2, z], s: [w, h, d], c, clear });

function furniture(level: number): Item[] {
  switch (level) {
    case 1:
      return [
        item(-4.4, -4.6, 1.3, 2.2, 0.7, '#eef2f2', 0, 0.8),
        item(-4.4, -5.4, 1.2, 0.5, 1.4, '#e4ebeb', 0, 0.8),
        item(4.3, -4.8, 2.4, 1.1, 0.9, '#d8c7a6'),
        item(4.4, -2.2, 0.8, 0.8, 0.5, '#b7d0d6'),
        item(-4.8, 1.6, 0.6, 1.8, 0.25, '#8fb7c0'),
      ];
    case 2:
      return [
        item(-3.9, -4.4, 3.4, 2.2, 0.75, '#eef3f5', 0, 0.9),
        item(3.9, -4.7, 2.6, 1.0, 0.95, '#cfd9dc'),
        item(4.6, 0.5, 1.0, 1.0, 0.6, '#9cc4d4'),
        item(-4.8, 2.3, 0.8, 0.8, 0.4, '#e6c9d4'),
      ];
    case 3:
      return [
        item(-3.9, -5.0, 3.6, 1.2, 1.1, '#e8dcc3'),
        item(1.8, -4.6, 3.0, 1.2, 1.1, '#d9c9a7'),
        item(0, 0.6, 2.6, 1.4, 0.95, '#b78a5c', 0, 0.3),
        item(-4.6, 2.0, 1.0, 1.0, 1.4, '#c7d1cc', 0, 0.5),
        item(4.8, -2.0, 0.9, 0.9, 0.7, '#e6a76d'),
      ];
    case 4:
      return [
        item(0, -4.3, 4.2, 2.8, 0.6, '#9a7ba3', 0, 0.2),
        item(-3.8, -5.2, 1.0, 0.9, 0.7, '#7a6a80'),
        item(3.6, -5.2, 1.0, 0.9, 0.7, '#7a6a80'),
        item(-4.6, 1.2, 1.2, 2.2, 1.8, '#a58b7a'),
        item(4.4, 1.6, 1.4, 1.0, 0.8, '#8a7a95'),
      ];
    case 5:
      return [
        item(-3.6, -1.4, 3.2, 1.4, 0.6, '#6d8a79', 0, 0.5),
        item(-3.6, -2.15, 3.2, 0.3, 1.1, '#6d8a79', 0, 0.5),
        item(3.6, -5.3, 2.8, 0.5, 1.5, '#45403d'),
        item(0, 2.0, 2.2, 1.0, 0.45, '#a6805a', 0, 0.3),
        item(4.8, 1.8, 0.9, 0.9, 1.6, '#a7b59e'),
      ];
    default:
      return [];
  }
}

function LegacyRoom({ level, exitUnlocked }: { level: number; exitUnlocked: boolean }) {
  setRoom(6, 6, 3.2);
  const spec = LEVELS[level - 1];
  const dark = level === 4;
  const items = useMemo(() => furniture(level), [level]);
  useEffect(() => {
    setObstacles(items.map((i) => [i.p[0], i.p[1], i.p[2], i.s[0], i.s[1], i.s[2]]));
    setHideZones([]);
  }, [items]);
  const lamp = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (lamp.current) lamp.current.intensity = (dark ? 14 : 22) + Math.sin(state.clock.elapsedTime * 1.3) * 0.6;
  });
  const fogColor = dark ? '#2c2538' : spec.sky;
  return (
    <group>
      <color attach="background" args={[fogColor]} />
      <fog attach="fog" args={[fogColor, 14, 34]} />
      <Environment resolution={128} background={false}>
        <Lightformer form="rect" intensity={dark ? 0.7 : 2.4} color={dark ? '#9a8cd0' : '#fff1d8'} position={[0, 6, 0]} scale={[14, 14, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={dark ? 0.5 : 1.6} color={dark ? '#7a8cc8' : '#d8ecff'} position={[-8, 3, 2]} scale={[8, 5, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1} color="#ffd9b0" position={[8, 2, -2]} scale={[8, 5, 1]} rotation-y={-Math.PI / 2} />
      </Environment>
      <hemisphereLight args={[dark ? '#a8a0d8' : '#fff6e6', '#8a7a68', dark ? 0.55 : 0.85]} />
      <directionalLight
        position={[-5, 9, 5]}
        intensity={dark ? 0.9 : 2.2}
        color={dark ? '#b9c5ff' : '#fff0d6'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={6}
        shadow-bias={-0.0004}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      <pointLight ref={lamp} position={[0, 2.8, 0]} distance={14} decay={1.6} color={dark ? '#ffcf9a' : '#ffe6b8'} />
      <pointLight position={[0, 1.4, -4]} intensity={4} distance={8} color={spec.accent} />

      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[ROOM.halfX * 2, 0.1, ROOM.halfZ * 2]} />
        <Soft color={spec.floor} rough={0.6} clearcoat={0.1} sheen={0.2} />
      </mesh>
      <mesh position={[0, ROOM.height / 2, -ROOM.halfZ]} receiveShadow>
        <boxGeometry args={[ROOM.halfX * 2, ROOM.height, 0.2]} />
        <Soft color={spec.wall} rough={0.85} sheen={0.3} />
      </mesh>
      <mesh position={[-ROOM.halfX, ROOM.height / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, ROOM.height, ROOM.halfZ * 2]} />
        <Soft color={spec.wall} rough={0.85} sheen={0.3} />
      </mesh>
      <mesh position={[ROOM.halfX, ROOM.height / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, ROOM.height, ROOM.halfZ * 2]} />
        <Soft color={spec.wall} rough={0.85} sheen={0.3} />
      </mesh>
      <mesh position={[0, 0.12, -ROOM.halfZ + 0.12]}>
        <boxGeometry args={[ROOM.halfX * 2, 0.24, 0.06]} />
        <Soft color="#ffffff" rough={0.5} />
      </mesh>
      <mesh position={[-ROOM.halfX + 0.12, 1.7, 1]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.2, 1.3]} />
        <meshBasicMaterial color={dark ? '#3a4a78' : '#ffeec8'} toneMapped={false} />
      </mesh>

      {items.map((it, i) => (
        <RoundedBox key={i} args={it.s} radius={0.07} smoothness={4} position={it.p} castShadow receiveShadow>
          <Soft color={it.c} rough={0.55} sheen={0.7} clearcoat={it.clear ?? 0} />
        </RoundedBox>
      ))}

      <group position={[0, 2.95, 0]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.5, 0.35, 28, 1, true]} />
          <meshStandardMaterial color="#fff2d6" emissive="#ffe3a8" emissiveIntensity={1.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <ContactShadows position={[0, 0.011, 0]} opacity={dark ? 0.4 : 0.32} scale={14} blur={2.8} far={4} resolution={512} />
      <Sparkles count={26} scale={[11, 3, 11]} position={[0, 1.5, 0]} size={2.4} speed={0.15} color={spec.accent} opacity={0.35} />
      <Door active={exitUnlocked} color={spec.accent} />
    </group>
  );
}

function Door({ active, color }: { active: boolean; color: string }) {
  const glow = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!glow.current) return;
    const m = glow.current.material as THREE.MeshBasicMaterial;
    m.opacity = active ? 0.55 + Math.sin(state.clock.elapsedTime * 3) * 0.15 : 0.12;
  });
  return (
    <group position={[0, 0, -ROOM.halfZ + 0.16]}>
      <RoundedBox args={[1.5, 2.3, 0.1]} radius={0.05} position={[0, 1.15, 0]} castShadow>
        <Soft color={active ? '#e8c978' : '#6b5a4a'} rough={0.45} clearcoat={0.4} />
      </RoundedBox>
      <mesh ref={glow} position={[0, 1.15, 0.08]}>
        <planeGeometry args={[1.3, 2.1]} />
        <meshBasicMaterial color={active ? '#fff0b0' : color} transparent opacity={0.12} toneMapped={false} />
      </mesh>
    </group>
  );
}

class PropGuard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.warn('Bathroom props failed to load; continuing without them.', error); }
  render() { return this.state.failed ? null : this.props.children; }
}

const BATH_STYLE: ShellStyle = {
  floorTex: 'rounded_square_tiled_wall', floorSpan: 4.2, floorTint: '#e4f3f1',
  wallTex: 'long_white_tiles', wallSpan: 7.5, wallTint: '#ffffff',
  wainscot: 4.6, upper: '#bfe3de', trim: '#fbf8f0', ceiling: '#fbf6ec', accent: '#5fb0a8',
  fog: '#d7ebe8', dark: false, lampColor: '#fff0d0',
};

function BathroomRoom({ exitUnlocked }: { exitUnlocked: boolean }) {
  const dims = DIMS.bathroom;
  setRoom(dims.halfX, dims.halfZ, dims.height);
  useEffect(() => {
    setObstacles(bathroomObstacles);
    setHideZones(bathroomHide);
  }, []);
  return (
    <group>
      <Lighting style={BATH_STYLE} dims={dims} />
      <Architecture dims={dims} style={BATH_STYLE} />
      <WallWindow position={[2.9, 5.6, 5.46]} rotation={[0, Math.PI, 0]} w={2.6} h={1.7} />
      <ExitDoor dims={dims} active={exitUnlocked} color={BATH_STYLE.accent} />
      <PropGuard>
        <Suspense fallback={null}>
          <BathroomSet />
        </Suspense>
      </PropGuard>
    </group>
  );
}

export function Room({ level, exitUnlocked }: { level: number; exitUnlocked: boolean }) {
  if (LEVELS[level - 1].theme === 'bathroom') return <BathroomRoom exitUnlocked={exitUnlocked} />;
  if (LEVELS[level - 1].theme === 'store') return <PropGuard><StoreRoom exitUnlocked={exitUnlocked} /></PropGuard>;
  if (LEVELS[level - 1].theme === 'kitchen') return <PropGuard><KitchenRoom exitUnlocked={exitUnlocked} /></PropGuard>;
  if (LEVELS[level - 1].theme === 'bedroom') return <PropGuard><BedroomRoom exitUnlocked={exitUnlocked} /></PropGuard>;
  if (LEVELS[level - 1].theme === 'living') return <PropGuard><LivingRoom exitUnlocked={exitUnlocked} /></PropGuard>;
  return <LegacyRoom level={level} exitUnlocked={exitUnlocked} />;
}

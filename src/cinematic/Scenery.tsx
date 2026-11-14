import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { usePbr } from '../game/surfaces';
import { FOOD, HOME, intro, phase, T } from './timeline';

export const HOUSE_Z = -27;

function Roof({ side }: { side: -1 | 1 }) {
  const tex = usePbr('clay_roof_tiles', 6, 2);
  return (
    <mesh position={[1, 9.6, HOUSE_Z - 4 + side * -2.6 * -1]} rotation={[side * 0.62, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[19.6, 0.4, 6.6]} />
      <meshPhysicalMaterial color="#b36a4a" map={tex.map} normalMap={tex.normalMap} roughnessMap={tex.arm} roughness={1} />
    </mesh>
  );
}

export function House() {
  const wall = usePbr('plastered_wall_04', 5, 2);
  const glow = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!glow.current) return;
    const flick = 1 + Math.sin(state.clock.elapsedTime * 2.1) * 0.04;
    glow.current.scale.setScalar(flick);
  });
  const windows: [number, number, number, number][] = [[-5.2, 5.4, 2.2, 2.2], [-1.8, 5.4, 2.2, 2.2], [4.2, 5.4, 2.2, 2.2], [7.4, 5.4, 2.2, 2.2], [-5.2, 1.9, 2.2, 1.9], [7.4, 1.9, 2.2, 1.9]];
  return (
    <group>
      <mesh position={[0, -0.02, HOUSE_Z + 6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#1b2a21" roughness={0.97} />
      </mesh>
      <mesh position={[1, 0.01, HOUSE_Z + 9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.4, 24]} />
        <meshStandardMaterial color="#5c5a55" roughness={0.9} />
      </mesh>
      <mesh position={[1, 5, HOUSE_Z - 4]} castShadow receiveShadow>
        <boxGeometry args={[19, 10, 8]} />
        <meshStandardMaterial color="#c9c0b0" roughness={0.9} />
      </mesh>
      <mesh position={[1, 5, HOUSE_Z + 0.02]} receiveShadow>
        <planeGeometry args={[19, 10]} />
        <meshPhysicalMaterial color="#e8dcc6" map={wall.map} normalMap={wall.normalMap} roughnessMap={wall.arm} roughness={1} />
      </mesh>
      <Roof side={-1} />
      <Roof side={1} />
      <group ref={glow}>
        {windows.map(([x, y, w, h], i) => (
          <group key={i} position={[x, y, HOUSE_Z + 0.06]}>
            <mesh>
              <planeGeometry args={[w, h]} />
              <meshBasicMaterial color={i % 3 === 1 ? '#ffd28a' : '#ffe6b0'} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 0.04]}>
              <boxGeometry args={[0.1, h, 0.08]} />
              <meshStandardMaterial color="#2a2018" />
            </mesh>
            <mesh position={[0, 0, 0.04]}>
              <boxGeometry args={[w, 0.1, 0.08]} />
              <meshStandardMaterial color="#2a2018" />
            </mesh>
            <RoundedBox args={[w + 0.3, 0.18, 0.4]} radius={0.04} position={[0, -h / 2 - 0.1, 0.16]}>
              <meshStandardMaterial color="#efe6d4" roughness={0.6} />
            </RoundedBox>
          </group>
        ))}
        <pointLight position={[1, 3, HOUSE_Z + 3]} intensity={60} distance={26} decay={1.5} color="#ffcf90" />
      </group>
      <group position={[1, 0, HOUSE_Z + 0.08]}>
        <RoundedBox args={[2.6, 4.2, 0.3]} radius={0.06} position={[0, 2.1, 0]} castShadow>
          <meshPhysicalMaterial color="#6b4326" roughness={0.55} clearcoat={0.4} />
        </RoundedBox>
        <mesh position={[0.9, 1.9, 0.2]}>
          <sphereGeometry args={[0.12, 14, 12]} />
          <meshStandardMaterial color="#e3c27a" metalness={1} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.45, 0.4]}>
          <boxGeometry args={[3.6, 0.3, 1.2]} />
          <meshStandardMaterial color="#7a766e" roughness={0.9} />
        </mesh>
        <pointLight position={[0, 4.6, 1.2]} intensity={40} distance={18} decay={1.6} color="#ffd9a0" />
      </group>
      <mesh position={[-16, 17, -62]}>
        <sphereGeometry args={[2.6, 28, 20]} />
        <meshBasicMaterial color="#e8f0ff" toneMapped={false} fog={false} />
      </mesh>
      <Sparkles count={50} scale={[40, 14, 40]} position={[0, 8, HOUSE_Z + 6]} size={2.4} speed={0.1} color="#cfe0ff" opacity={0.45} />
    </group>
  );
}

export function Wreck() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = intro.t >= T.reset;
  });
  const bits: { p: [number, number, number]; r: [number, number, number]; s: [number, number, number]; c: string }[] = [
    { p: [-0.5, 0.1, -4.6], r: [0.4, 0.8, 0.3], s: [0.9, 0.18, 0.6], c: '#8d6c43' },
    { p: [0.2, 0.08, -5.4], r: [0.1, 0.2, 0.5], s: [0.5, 0.12, 0.3], c: '#a98458' },
    { p: [1.8, 0.06, -3.2], r: [0, 1.2, 0], s: [0.5, 0.06, 0.4], c: '#a62f3a' },
    { p: [0.6, 0.1, -2.6], r: [0.6, 0.3, 0.2], s: [0.35, 0.1, 0.25], c: '#6b5a3a' },
    { p: [2.4, 0.07, -4.4], r: [0.2, 0.9, 0.1], s: [0.4, 0.09, 0.3], c: '#7a6a4a' },
  ];
  return (
    <group ref={ref} visible={false}>
      {bits.map((b, i) => (
        <mesh key={i} position={b.p} rotation={b.r} scale={b.s} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={b.c} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[FOOD.x + 0.9, 0.15, FOOD.z + 0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.17, 0.36, 24]} />
        <meshPhysicalMaterial color="#c9503f" metalness={0.7} roughness={0.3} clearcoat={0.8} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[HOME.x + 0.2 + i * 0.7, 0.012, HOME.z + 1.2 + i * 0.5]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[0.45 + i * 0.12, 20]} />
          <meshPhysicalMaterial color="#244e56" roughness={0.04} clearcoat={1} transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}

export { phase };

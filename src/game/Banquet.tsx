import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Surface } from './surfaces';

export const TABLE_Y = 1.0;
export const TABLE_Z = -4;
export const HALL = { front: 12, back: -12, half: 8, height: 9 };

export const BANQUET_FOOD: [number, number, number][] = [
  [-2.9, TABLE_Y + 0.3, TABLE_Z - 0.45], [-1.5, TABLE_Y + 0.75, TABLE_Z - 0.45], [0.05, TABLE_Y + 0.45, TABLE_Z - 0.4],
  [1.55, TABLE_Y + 0.5, TABLE_Z - 0.45], [2.95, TABLE_Y + 0.3, TABLE_Z - 0.45],
  [-0.9, TABLE_Y + 0.25, TABLE_Z + 0.55], [1.3, TABLE_Y + 0.25, TABLE_Z + 0.55],
];

export const banquetObstacles: [number, number, number, number, number, number][] = [
  [0, TABLE_Y - 0.07, TABLE_Z, 8.2, 0.14, 2.3],
  [-3.9, 0.45, TABLE_Z - 0.95, 0.26, 0.9, 0.26], [3.9, 0.45, TABLE_Z - 0.95, 0.26, 0.9, 0.26],
  [-3.9, 0.45, TABLE_Z + 0.95, 0.26, 0.9, 0.26], [3.9, 0.45, TABLE_Z + 0.95, 0.26, 0.9, 0.26],
  [0, TABLE_Y - 0.45, TABLE_Z + 1.3, 8.5, 0.7, 0.06],
  ...[-1, 1].flatMap((s) => [-5, 2, 9].map((z): [number, number, number, number, number, number] => [s * (HALL.half - 0.5), 3.6, z, 1.0, 7.2, 1.0])),
];

type V3 = [number, number, number];
const gold = <meshStandardMaterial color="#e3b84f" metalness={1} roughness={0.22} />;

function GoldPlate({ p, r = 0.36 }: { p: V3; r?: number }) {
  return (
    <mesh position={p} castShadow>
      <cylinderGeometry args={[r, r * 1.08, 0.05, 32]} />
      {gold}
    </mesh>
  );
}

function Cake({ p }: { p: V3 }) {
  const tiers: [number, number, string][] = [[0.44, 0.2, '#fff4e4'], [0.33, 0.2, '#f6c9d4'], [0.22, 0.18, '#fff8ee']];
  let y = 0.06;
  return (
    <group position={p}>
      <GoldPlate p={[0, 0, 0]} r={0.55} />
      {tiers.map(([r, h, c], i) => {
        const at = y + h / 2;
        y += h;
        return (
          <group key={i}>
            <mesh position={[0, at, 0]} castShadow><cylinderGeometry args={[r, r, h, 36]} /><meshPhysicalMaterial color={c} roughness={0.5} clearcoat={0.3} /></mesh>
            <mesh position={[0, at + h / 2 - 0.01, 0]}><torusGeometry args={[r, 0.02, 8, 36]} /><meshStandardMaterial color="#ffffff" roughness={0.4} /></mesh>
          </group>
        );
      })}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 0.12, y + 0.04, Math.sin((i / 5) * Math.PI * 2) * 0.12]} castShadow>
          <sphereGeometry args={[0.045, 12, 10]} /><meshPhysicalMaterial color="#c4242f" roughness={0.2} clearcoat={1} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh key={`b${i}`} position={[Math.cos((i / 8) * Math.PI * 2) * 0.5, 0.1, Math.sin((i / 8) * Math.PI * 2) * 0.5]}>
          <sphereGeometry args={[0.04, 10, 8]} /><meshStandardMaterial color="#e86a8a" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Chicken({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <GoldPlate p={[0, 0, 0]} r={0.62} />
      <mesh position={[0, 0.22, 0]} scale={[1.25, 0.8, 0.9]} castShadow><sphereGeometry args={[0.3, 28, 20]} /><meshPhysicalMaterial color="#c4772c" roughness={0.45} clearcoat={0.7} /></mesh>
      <mesh position={[0.2, 0.3, 0]} scale={[0.7, 0.55, 0.7]} castShadow><sphereGeometry args={[0.2, 20, 14]} /><meshPhysicalMaterial color="#d0873a" roughness={0.45} clearcoat={0.7} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[-0.28, 0.12, s * 0.2]} rotation={[0, 0, 0.5]}>
          <mesh castShadow><capsuleGeometry args={[0.06, 0.22, 6, 10]} /><meshPhysicalMaterial color="#b9672a" roughness={0.45} clearcoat={0.6} /></mesh>
          <mesh position={[0, -0.2, 0]}><sphereGeometry args={[0.05, 10, 8]} /><meshStandardMaterial color="#f4ecd8" /></mesh>
        </group>
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <mesh key={i} position={[Math.cos((i / 7) * Math.PI * 2) * 0.5, 0.05, Math.sin((i / 7) * Math.PI * 2) * 0.4]} scale={[1.4, 0.5, 1]}>
          <sphereGeometry args={[0.06, 8, 6]} /><meshStandardMaterial color={i % 2 ? '#4f8f3a' : '#e8a43a'} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function FruitBowl({ p }: { p: V3 }) {
  const fruit: [number, number, number, string, number][] = [
    [-0.12, 0.2, 0.05, '#cf2a2a', 0.12], [0.1, 0.2, -0.06, '#e8821f', 0.12], [0.02, 0.2, 0.14, '#d83a3a', 0.11],
    [-0.04, 0.34, -0.02, '#f0c43a', 0.11], [0.15, 0.3, 0.08, '#8fbf3a', 0.1],
  ];
  return (
    <group position={p}>
      <mesh position={[0, 0.17, 0]} castShadow><sphereGeometry args={[0.36, 28, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />{gold}</mesh>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.14, 0.18, 0.06, 20]} />{gold}</mesh>
      {fruit.map(([x, y, z, c, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow><sphereGeometry args={[r, 16, 12]} /><meshPhysicalMaterial color={c} roughness={0.35} clearcoat={0.8} /></mesh>
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[-0.2 + (i % 3) * 0.06 + (Math.floor(i / 3) % 2) * 0.03, 0.3 - Math.floor(i / 3) * 0.05, -0.12 + Math.floor(i / 3) * 0.02]}>
          <sphereGeometry args={[0.04, 10, 8]} /><meshPhysicalMaterial color="#5a2a7a" roughness={0.3} clearcoat={0.9} />
        </mesh>
      ))}
      <mesh position={[0.05, 0.4, 0.12]} rotation={[0.2, 0.4, 0]}><torusGeometry args={[0.16, 0.035, 8, 20, Math.PI * 0.7]} /><meshStandardMaterial color="#f3d14a" roughness={0.5} /></mesh>
    </group>
  );
}

function Pastries({ p }: { p: V3 }) {
  const macs = ['#f4a3b8', '#bfe3a8', '#f6d28a', '#c9b3ec', '#f4a3b8'];
  return (
    <group position={p}>
      <GoldPlate p={[0, 0, 0]} r={0.55} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos(i * 2.1) * 0.22 - 0.1, 0.1, Math.sin(i * 2.1) * 0.22]} rotation={[Math.PI / 2, 0, i]} scale={[1, 1, 1.4]} castShadow>
          <torusGeometry args={[0.11, 0.055, 10, 18, Math.PI * 1.3]} /><meshPhysicalMaterial color="#d79a4a" roughness={0.55} clearcoat={0.4} />
        </mesh>
      ))}
      {macs.map((c, i) => (
        <group key={i} position={[0.22 + (i % 3) * 0.13 - 0.08, 0.08, -0.2 + Math.floor(i / 3) * 0.2]}>
          <mesh position={[0, 0.012, 0]}><cylinderGeometry args={[0.055, 0.05, 0.025, 14]} /><meshStandardMaterial color={c} roughness={0.6} /></mesh>
          <mesh position={[0, -0.005, 0]}><cylinderGeometry args={[0.05, 0.05, 0.02, 14]} /><meshStandardMaterial color="#fff6e8" /></mesh>
          <mesh position={[0, -0.025, 0]}><cylinderGeometry args={[0.055, 0.05, 0.025, 14]} /><meshStandardMaterial color={c} roughness={0.6} /></mesh>
        </group>
      ))}
    </group>
  );
}

function Chocolates({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <RoundedBox args={[0.9, 0.12, 0.55]} radius={0.03} position={[0, 0.06, 0]} castShadow><meshStandardMaterial color="#3a1f12" roughness={0.5} /></RoundedBox>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[-0.33 + (i % 6) * 0.13, 0.15, -0.12 + Math.floor(i / 6) * 0.22]} castShadow>
          <sphereGeometry args={[0.055, 14, 10]} />
          <meshPhysicalMaterial color={['#4a2616', '#6b3a1e', '#2a140a'][i % 3]} roughness={0.25} clearcoat={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Candelabra({ p }: { p: V3 }) {
  const flames = useRef<THREE.Mesh[]>([]);
  useFrame((s) => flames.current.forEach((m, i) => { if (m) m.scale.set(1, 1 + Math.sin(s.clock.elapsedTime * 9 + i * 2) * 0.18, 1); }));
  return (
    <group position={p}>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.16, 0.2, 0.05, 20]} />{gold}</mesh>
      <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.025, 0.04, 0.7, 10]} />{gold}</mesh>
      <mesh position={[0, 0.72, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.018, 0.018, 0.6, 8]} />{gold}</mesh>
      {[-0.3, 0, 0.3].map((x, i) => (
        <group key={i} position={[x, i === 1 ? 0.78 : 0.76, 0]}>
          <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.026, 0.026, 0.2, 10]} /><meshStandardMaterial color="#fff6e0" roughness={0.6} /></mesh>
          <mesh ref={(m) => { if (m) flames.current[i] = m; }} position={[0, 0.25, 0]}><sphereGeometry args={[0.03, 10, 8]} /><meshBasicMaterial color="#ffd27a" toneMapped={false} /></mesh>
        </group>
      ))}
    </group>
  );
}

function Flowers({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.12, 0.09, 0.44, 18]} /><meshPhysicalMaterial color="#f4f1ea" roughness={0.2} clearcoat={1} /></mesh>
      {Array.from({ length: 9 }).map((_, i) => (
        <group key={i} position={[Math.cos(i * 2.4) * 0.14, 0.52 + (i % 3) * 0.07, Math.sin(i * 2.4) * 0.14]}>
          <mesh><sphereGeometry args={[0.09, 12, 10]} /><meshStandardMaterial color={['#e8586a', '#f6a8b8', '#fff2d6'][i % 3]} roughness={0.7} /></mesh>
          <mesh position={[0, 0.02, 0]}><sphereGeometry args={[0.03, 8, 6]} /><meshStandardMaterial color="#f0c43a" /></mesh>
        </group>
      ))}
    </group>
  );
}

function Chandelier({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.02, 0.02, 2.4, 6]} />{gold}</mesh>
      {[0.9, 0.6].map((r, k) => (
        <group key={k} position={[0, -k * 0.5, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r, 0.04, 8, 36]} />{gold}</mesh>
          {Array.from({ length: 8 - k * 2 }).map((_, i, a) => (
            <group key={i} position={[Math.cos((i / a.length) * Math.PI * 2) * r, 0, Math.sin((i / a.length) * Math.PI * 2) * r]}>
              <mesh position={[0, 0.12, 0]}><sphereGeometry args={[0.05, 10, 8]} /><meshBasicMaterial color="#ffe3a0" toneMapped={false} /></mesh>
              <mesh position={[0, -0.15, 0]}><coneGeometry args={[0.04, 0.2, 8]} /><meshPhysicalMaterial color="#e8f2ff" roughness={0.05} transmission={0.4} transparent opacity={0.8} /></mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function Hall() {
  const w = HALL.half * 2;
  const len = HALL.front - HALL.back;
  const cz = (HALL.front + HALL.back) / 2;
  return (
    <group>
      <Surface tex="marble_01" w={w} h={len} span={4} position={[0, 0, cz]} rotation={[-Math.PI / 2, 0, 0]} tint="#f4ead8" gloss={0.9} />
      <mesh position={[0, 0.012, cz]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.4, len]} /><meshStandardMaterial color="#8f1f2c" roughness={0.9} /></mesh>
      {[-1.7, 1.7].map((x) => <mesh key={x} position={[x, 0.016, cz]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.1, len]} /><meshStandardMaterial color="#e3b84f" metalness={0.8} roughness={0.3} /></mesh>)}
      <mesh position={[0, HALL.height / 2, HALL.back]}><boxGeometry args={[w, HALL.height, 0.3]} /><meshStandardMaterial color="#e9dcc0" roughness={0.8} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * HALL.half, HALL.height / 2, cz]}><boxGeometry args={[0.3, HALL.height, len]} /><meshStandardMaterial color="#e9dcc0" roughness={0.8} /></mesh>
      ))}
      <mesh position={[0, HALL.height, cz]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[w, len]} /><meshStandardMaterial color="#f3e8cf" roughness={0.9} /></mesh>
      {[-5.5, -1.8, 1.8, 5.5].map((x) => (
        <group key={x} position={[x, 0, HALL.back + 0.2]}>
          <mesh position={[0, 4.6, 0]}><planeGeometry args={[2.1, 5.6]} /><meshBasicMaterial color="#18244a" toneMapped={false} /></mesh>
          {[[-0.5, 6], [0.3, 5.2], [0.7, 3.4], [-0.3, 3.1], [0.1, 4.3]].map(([dx, y], i) => (
            <mesh key={i} position={[dx as number, y as number, 0.01]}><circleGeometry args={[0.035, 6]} /><meshBasicMaterial color="#ffe9a8" toneMapped={false} /></mesh>
          ))}
          <mesh position={[0, 7.4, 0]}><circleGeometry args={[1.05, 24, 0, Math.PI]} /><meshBasicMaterial color="#18244a" toneMapped={false} /></mesh>
          {[-1.1, 1.1].map((fx) => <mesh key={fx} position={[fx, 4.6, 0.06]}><boxGeometry args={[0.16, 5.8, 0.16]} />{gold}</mesh>)}
        </group>
      ))}
      {[-1, 1].flatMap((s) => [-5, 2, 9].map((z) => (
        <group key={`${s}${z}`} position={[s * (HALL.half - 0.5), 0, z]}>
          <mesh position={[0, 3.6, 0]}><cylinderGeometry args={[0.38, 0.45, 7.2, 20]} /><meshStandardMaterial color="#f6efe0" roughness={0.45} /></mesh>
          <mesh position={[0, 0.15, 0]}><boxGeometry args={[1.1, 0.3, 1.1]} />{gold}</mesh>
          <mesh position={[0, 7.3, 0]}><boxGeometry args={[1.1, 0.3, 1.1]} />{gold}</mesh>
        </group>
      )))}
      <Chandelier p={[0, HALL.height - 2.8, 3]} />
      <Chandelier p={[0, HALL.height - 2.8, -4]} />
      <Sparkles count={60} scale={[14, 6, 24]} position={[0, 4, 3]} size={3} speed={0.25} color="#ffe7a0" opacity={0.5} />
    </group>
  );
}

function Table() {
  return (
    <group>
      <RoundedBox args={[8.2, 0.14, 2.3]} radius={0.04} position={[0, TABLE_Y - 0.07, 0]} castShadow receiveShadow><meshPhysicalMaterial color="#6f4a2a" roughness={0.45} clearcoat={0.5} /></RoundedBox>
      <mesh position={[0, TABLE_Y - 0.13, 0]} receiveShadow><boxGeometry args={[8.5, 0.03, 2.6]} /><meshStandardMaterial color="#fbf6ec" roughness={0.9} /></mesh>
      <mesh position={[0, TABLE_Y - 0.45, 1.3]}><boxGeometry args={[8.5, 0.7, 0.03]} /><meshStandardMaterial color="#fbf6ec" roughness={0.9} /></mesh>
      {[-3.9, 3.9].flatMap((x) => [-0.95, 0.95].map((z) => (
        <mesh key={`${x}${z}`} position={[x, (TABLE_Y - 0.14) / 2, z]} castShadow><cylinderGeometry args={[0.1, 0.13, TABLE_Y - 0.14, 14]} /><meshStandardMaterial color="#5a3a20" roughness={0.5} /></mesh>
      )))}
      <mesh position={[0, TABLE_Y + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[7.6, 0.5]} /><meshStandardMaterial color="#8f1f2c" roughness={0.8} /></mesh>
    </group>
  );
}

export function Banquet() {
  const y = TABLE_Y + 0.05;
  return (
    <group>
      <Suspense fallback={null}><Hall /></Suspense>
      <group position={[0, 0, TABLE_Z]}>
      <Table />
      <Pastries p={[-2.9, y, -0.45]} />
      <Cake p={[-1.5, y, -0.45]} />
      <Chicken p={[0.05, y, -0.4]} />
      <FruitBowl p={[1.55, y, -0.45]} />
      <Chocolates p={[2.95, y, -0.45]} />
      <Candelabra p={[-3.6, TABLE_Y, 0.55]} />
      <Candelabra p={[3.6, TABLE_Y, 0.55]} />
      <Flowers p={[-0.75, TABLE_Y, 0.5]} />
      <Flowers p={[1.0, TABLE_Y, 0.5]} />
      {[-2.2, -0.9, 0.5, 2.2].map((x, i) => <GoldPlate key={i} p={[x, y - 0.03, 0.55]} r={0.3} />)}
      </group>
    </group>
  );
}

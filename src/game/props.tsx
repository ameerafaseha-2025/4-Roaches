import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Chrome, Cloth, Wood } from './fixtures';

export type V3 = [number, number, number];
export type Ob = [number, number, number, number, number, number];

export function Block({ p, s, c, rough = 0.5, clear = 0.3, r = 0.03, ry = 0, children }: { p: V3; s: V3; c: string; rough?: number; clear?: number; r?: number; ry?: number; children?: ReactNode }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <RoundedBox args={s} radius={r} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={c} roughness={rough} clearcoat={clear} clearcoatRoughness={0.35} />
      </RoundedBox>
      {children}
    </group>
  );
}

export function Fan({ position, blades = 4, color = '#e9e2d2' }: { position: V3; blades?: number; color?: string }) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, d) => { if (spin.current) spin.current.rotation.y += Math.min(d, 0.05) * 5; });
  return (
    <group position={position}>
      <mesh position={[0, -0.35, 0]}><cylinderGeometry args={[0.05, 0.05, 0.7, 8]} /><meshStandardMaterial color="#6b6258" /></mesh>
      <group ref={spin} position={[0, -0.75, 0]}>
        <mesh><cylinderGeometry args={[0.28, 0.28, 0.2, 20]} /><meshStandardMaterial color="#8a7a60" metalness={0.5} roughness={0.4} /></mesh>
        {Array.from({ length: blades }).map((_, i) => (
          <mesh key={i} position={[Math.cos((i / blades) * Math.PI * 2) * 1.2, 0, Math.sin((i / blades) * Math.PI * 2) * 1.2]} rotation={[0, -(i / blades) * Math.PI * 2, 0.06]} castShadow>
            <boxGeometry args={[1.8, 0.05, 0.5]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Steam({ position, n = 4, h = 1.2 }: { position: V3; n?: number; h?: number }) {
  const refs = useRef<THREE.Mesh[]>([]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const k = ((t * 0.35 + i / n) % 1);
      m.position.set(Math.sin(t + i * 2) * 0.08 * k, k * h, Math.cos(t * 0.8 + i) * 0.06 * k);
      m.scale.setScalar(0.12 + k * 0.28);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.28 * (1 - k);
    });
  });
  return (
    <group position={position}>
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} ref={(m) => { if (m) refs.current[i] = m; }}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export function Curtain({ position, w = 2.4, h = 3.4, color = '#c97b6a', rotationY = 0 }: { position: V3; w?: number; h?: number; color?: string; rotationY?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => { if (g.current) g.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.7) * 0.015; });
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, h / 2 + 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.04, 0.04, w + 0.4, 10]} /><Chrome /></mesh>
      <group ref={g} position={[0, h / 2, 0]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * w * 0.32, 0, 0]}>
            {Array.from({ length: 5 }).map((_, i) => (
              <mesh key={i} position={[(i - 2) * (w * 0.11), 0, Math.sin(i * 1.7) * 0.05]} castShadow>
                <boxGeometry args={[w * 0.1, h, 0.05]} />
                <Cloth color={color} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

export function Frame({ position, w = 1.4, h = 1.0, art = '#8fb28a', ry = 0 }: { position: V3; w?: number; h?: number; art?: string; ry?: number }) {
  return (
    <group position={position} rotation={[0, ry, 0]}>
      <RoundedBox args={[w + 0.2, h + 0.2, 0.08]} radius={0.02} castShadow><Wood color="#7a5232" /></RoundedBox>
      <mesh position={[0, 0, 0.045]}><planeGeometry args={[w, h]} /><meshStandardMaterial color={art} roughness={0.8} /></mesh>
      <mesh position={[-w * 0.15, -h * 0.12, 0.05]}><circleGeometry args={[Math.min(w, h) * 0.22, 20]} /><meshStandardMaterial color="#f3e2a0" roughness={0.8} /></mesh>
      <mesh position={[w * 0.2, h * 0.1, 0.05]}><circleGeometry args={[Math.min(w, h) * 0.14, 20]} /><meshStandardMaterial color="#d96a5a" roughness={0.8} /></mesh>
    </group>
  );
}

export function Pot({ position, color = '#c9ccd0', s = 1 }: { position: V3; color?: string; s?: number }) {
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.28, 0.25, 0.4, 24]} /><meshStandardMaterial color={color} metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0.34, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 0.3, 8]} /><meshStandardMaterial color="#2a2a2a" /></mesh>
    </group>
  );
}

export function Book({ position, c, s = [0.5, 0.08, 0.36], ry = 0 }: { position: V3; c: string; s?: V3; ry?: number }) {
  return (
    <mesh position={position} rotation={[0, ry, 0]} castShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={0.7} />
    </mesh>
  );
}

export function Pillow({ position, c, s = [0.9, 0.3, 0.6], ry = 0 }: { position: V3; c: string; s?: V3; ry?: number }) {
  return (
    <mesh position={position} rotation={[0, ry, 0]} scale={s} castShadow>
      <sphereGeometry args={[0.5, 20, 14]} />
      <Cloth color={c} />
    </mesh>
  );
}

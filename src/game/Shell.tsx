import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, RoundedBox, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Surface } from './surfaces';
import type { Dims } from './world';

export type ShellStyle = {
  floorTex: string;
  floorSpan: number;
  floorTint: string;
  wallTex: string;
  wallSpan: number;
  wallTint: string;
  wainscot: number;
  upper: string;
  trim: string;
  ceiling: string;
  accent: string;
  fog: string;
  dark: boolean;
  lampColor: string;
};

const paint = (color: string, rough = 0.85) => (
  <meshPhysicalMaterial color={color} roughness={rough} sheen={0.4} sheenRoughness={0.7} sheenColor="#ffffff" />
);

export function Architecture({ dims, style }: { dims: Dims; style: ShellStyle }) {
  const { halfX: hx, halfZ: hz, height: h } = dims;
  const w = style.wainscot;
  const upperH = h - w;
  return (
    <group>
      <Surface tex={style.floorTex} w={hx * 2} h={hz * 2} span={style.floorSpan} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} tint={style.floorTint} gloss={0.6} />
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[hx * 2 + 1, 0.2, hz * 2 + 1]} />
        <meshStandardMaterial color="#6b5d52" />
      </mesh>

      {[
        { p: [0, 0, -hz] as [number, number, number], r: 0, len: hx * 2 },
        { p: [0, 0, hz] as [number, number, number], r: Math.PI, len: hx * 2 },
        { p: [-hx, 0, 0] as [number, number, number], r: Math.PI / 2, len: hz * 2 },
        { p: [hx, 0, 0] as [number, number, number], r: -Math.PI / 2, len: hz * 2 },
      ].map((wall, i) => (
        <group key={i} position={wall.p} rotation={[0, wall.r, 0]}>
          <Surface tex={style.wallTex} w={wall.len} h={w} span={style.wallSpan} position={[0, w / 2, 0.01]} tint={style.wallTint} gloss={0.8} normalStrength={0.6} />
          <mesh position={[0, w + upperH / 2, 0.01]} receiveShadow>
            <planeGeometry args={[wall.len, upperH]} />
            {paint(style.upper)}
          </mesh>
          <mesh position={[0, 0.17, 0.05]} castShadow receiveShadow>
            <boxGeometry args={[wall.len, 0.34, 0.1]} />
            {paint(style.trim, 0.4)}
          </mesh>
          <mesh position={[0, w, 0.06]} castShadow>
            <boxGeometry args={[wall.len, 0.16, 0.12]} />
            {paint(style.accent, 0.35)}
          </mesh>
          <mesh position={[0, h - 0.14, 0.06]} castShadow>
            <boxGeometry args={[wall.len, 0.28, 0.12]} />
            {paint(style.trim, 0.5)}
          </mesh>
        </group>
      ))}

      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[hx * 2, hz * 2]} />
        {paint(style.ceiling, 0.9)}
      </mesh>
    </group>
  );
}

export function ExitDoor({ dims, active, color }: { dims: Dims; active: boolean; color: string }) {
  const door = dims.door;
  const leaf = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!leaf.current || !door) return;
    leaf.current.rotation.y = THREE.MathUtils.damp(leaf.current.rotation.y, active ? 1.3 : 0, 3, Math.min(delta, 0.05));
    if (glow.current) (glow.current.material as THREE.MeshBasicMaterial).opacity = active ? 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.15 : 0;
  });
  if (!door) return null;
  const { w, h } = door;
  return (
    <group position={[-dims.halfX, 0, door.z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh ref={glow} position={[0, h / 2, -0.35]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#fff1b8" transparent opacity={0} toneMapped={false} />
      </mesh>
      {active && <pointLight position={[0, h * 0.5, 0.5]} intensity={18} distance={9} color="#ffe2a0" />}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.22, h + 0.2, 0.24]} radius={0.04} position={[s * (w / 2 + 0.11), (h + 0.2) / 2, 0.08]} castShadow>
          {paint('#f1ebe0', 0.4)}
        </RoundedBox>
      ))}
      <RoundedBox args={[w + 0.44, 0.22, 0.24]} radius={0.04} position={[0, h + 0.1, 0.08]} castShadow>
        {paint('#f1ebe0', 0.4)}
      </RoundedBox>
      <group ref={leaf} position={[-w / 2, 0, -0.04]}>
        <RoundedBox args={[w, h, 0.14]} radius={0.04} position={[w / 2, h / 2, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color={active ? '#d9b36a' : '#a9794e'} roughness={0.5} clearcoat={0.4} />
        </RoundedBox>
        {[0.3, 0.7].map((f) => (
          <mesh key={f} position={[w / 2, h * f, 0.075]}>
            <boxGeometry args={[w * 0.68, h * 0.32, 0.03]} />
            <meshPhysicalMaterial color={active ? '#e6c785' : '#92643f'} roughness={0.55} clearcoat={0.3} />
          </mesh>
        ))}
        <mesh position={[w - 0.28, h * 0.48, 0.14]} castShadow>
          <sphereGeometry args={[0.1, 18, 14]} />
          <meshStandardMaterial color="#e3c27a" metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[w - 0.28, h * 0.58, 0.1]}>
          <sphereGeometry args={[0.045, 12, 10]} />
          <meshBasicMaterial color={active ? '#8bffb0' : color} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export function WallWindow({ position, rotation = [0, 0, 0], w = 2.6, h = 1.8, night = false }: { position: [number, number, number]; rotation?: [number, number, number]; w?: number; h?: number; night?: boolean }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={night ? '#3b4a7a' : '#fff6dc'} toneMapped={false} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, 0, 0.06]} scale={i ? [w, 0.07, 0.07] : [0.07, h, 0.07]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#f4f1ea" roughness={0.45} />
        </mesh>
      ))}
      {[
        { p: [0, h / 2 + 0.07, 0.06] as [number, number, number], s: [w + 0.3, 0.14, 0.14] as [number, number, number] },
        { p: [0, -h / 2 - 0.07, 0.06] as [number, number, number], s: [w + 0.3, 0.14, 0.14] as [number, number, number] },
        { p: [-w / 2 - 0.07, 0, 0.06] as [number, number, number], s: [0.14, h, 0.14] as [number, number, number] },
        { p: [w / 2 + 0.07, 0, 0.06] as [number, number, number], s: [0.14, h, 0.14] as [number, number, number] },
      ].map((f, i) => (
        <RoundedBox key={i} args={f.s} radius={0.03} position={f.p} castShadow>
          <meshStandardMaterial color="#f4f1ea" roughness={0.4} />
        </RoundedBox>
      ))}
      <RoundedBox args={[w + 0.5, 0.12, 0.34]} radius={0.03} position={[0, -h / 2 - 0.2, 0.14]} castShadow>
        <meshStandardMaterial color="#f4f1ea" roughness={0.4} />
      </RoundedBox>
    </group>
  );
}

export function CeilingLight({ position, color, intensity = 14 }: { position: [number, number, number]; color: string; intensity?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.12, 36]} />
        <meshStandardMaterial color="#f6f2ea" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.05, 36]} />
        <meshStandardMaterial color="#fff6dd" emissive="#ffe9b8" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.5, 0]} intensity={intensity} distance={15} decay={1.4} color={color} />
    </group>
  );
}

export function Lighting({ style, dims }: { style: ShellStyle; dims: Dims }) {
  const dark = style.dark;
  return (
    <group>
      <color attach="background" args={[style.fog]} />
      <fog attach="fog" args={[style.fog, 16, 40]} />
      <Environment resolution={256} background={false}>
        <Lightformer form="rect" intensity={dark ? 0.6 : 2.2} color={dark ? '#8f86c8' : '#fff1d8'} position={[0, 9, 0]} scale={[16, 16, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={dark ? 0.5 : 1.8} color={dark ? '#7a8cc8' : '#e4f1ff'} position={[0, 4, -9]} scale={[10, 5, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#ffd9b0" position={[9, 3, 2]} scale={[8, 5, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={2} color="#ffffff" position={[-6, 6, 4]} scale={4} rotation-y={Math.PI / 3} />
      </Environment>
      <hemisphereLight args={[dark ? '#a8a0d8' : '#fff4e2', '#8a7a68', dark ? 0.5 : 0.7]} />
      <directionalLight
        position={[-4, dims.height + 6, 5]}
        intensity={dark ? 0.8 : 1.9}
        color={dark ? '#b9c5ff' : '#fff0d6'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={5}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      <CeilingLight position={[-2.4, dims.height - 0.05, -1.4]} color={style.lampColor} intensity={dark ? 7 : 16} />
      <CeilingLight position={[2.6, dims.height - 0.05, 1.4]} color={style.lampColor} intensity={dark ? 7 : 16} />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.34} scale={16} blur={2.6} far={5} resolution={512} />
      <Sparkles count={30} scale={[12, 6, 10]} position={[0, 3.5, 0]} size={3} speed={0.12} color="#fff1c8" opacity={0.3} />
    </group>
  );
}

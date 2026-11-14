import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { usePbr } from '../game/surfaces';
import { HOME, intro, phase, T } from './timeline';

const TUNNEL_LEN = 28;

function Concrete({ id, rx, ry, tint, side }: { id: string; rx: number; ry: number; tint: string; side?: THREE.Side }) {
  const t = usePbr(id, rx, ry);
  return (
    <meshPhysicalMaterial
      color={tint}
      map={t.map}
      normalMap={t.normalMap}
      normalScale={new THREE.Vector2(1.1, 1.1)}
      roughnessMap={t.arm}
      aoMap={t.arm}
      roughness={1}
      metalness={0}
      side={side}
    />
  );
}

function Water() {
  const ripple = usePbr('scuffed_cement', 3, 14);
  const surf = useRef<THREE.MeshPhysicalMaterial>(null);
  useFrame((_, dt) => {
    ripple.normalMap.offset.y -= dt * 0.22 * intro.scale;
    ripple.normalMap.offset.x += dt * 0.03 * intro.scale;
  });
  return (
    <mesh position={[-1.55, -0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.3, TUNNEL_LEN]} />
      <meshPhysicalMaterial
        ref={surf}
        color="#2d6b74"
        normalMap={ripple.normalMap}
        normalScale={new THREE.Vector2(0.9, 0.9)}
        roughness={0.04}
        metalness={0.2}
        clearcoat={1}
        clearcoatRoughness={0.05}
        transparent
        opacity={0.86}
        envMapIntensity={1.8}
      />
    </mesh>
  );
}

function Bottle({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const geo = useMemo(() => {
    const pts: [number, number][] = [[0.001, 0], [0.26, 0.02], [0.28, 0.3], [0.27, 0.8], [0.18, 1.02], [0.1, 1.12], [0.1, 1.3], [0.001, 1.3]];
    return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 20);
  }, []);
  return (
    <mesh geometry={geo} position={position} rotation={rotation} castShadow>
      <meshPhysicalMaterial color="#7fc4d8" roughness={0.1} transmission={0.5} thickness={0.2} transparent opacity={0.75} clearcoat={1} />
    </mesh>
  );
}

function Floaters() {
  const items = useRef<(THREE.Object3D | null)[]>([]);
  const seeds = useMemo(() => [0, 1, 2, 3, 4, 5, 6].map((i) => ({ z: -12 + i * 4.1, x: -2.4 + (i % 3) * 0.55, spin: 0.2 + i * 0.07, kind: i % 3 })), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    seeds.forEach((s, i) => {
      const o = items.current[i];
      if (!o) return;
      const z = ((s.z + t * 0.45 * intro.scale + 14) % TUNNEL_LEN) - 14;
      o.position.set(s.x + Math.sin(t * 0.7 + i) * 0.08, -0.34 + Math.sin(t * 1.3 + i * 2) * 0.025, z);
      o.rotation.y = t * s.spin;
    });
  });
  return (
    <>
      {seeds.map((s, i) => (
        <group key={i} ref={(o) => { items.current[i] = o; }}>
          {s.kind === 0 && (
            <mesh scale={[1, 0.5, 1.4]} castShadow>
              <icosahedronGeometry args={[0.14, 1]} />
              <meshStandardMaterial color="#6b5a3a" roughness={0.9} flatShading />
            </mesh>
          )}
          {s.kind === 1 && (
            <mesh rotation={[0.2, 0, 0.1]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 0.24, 14]} />
              <meshStandardMaterial color="#c9503f" metalness={0.8} roughness={0.35} />
            </mesh>
          )}
          {s.kind === 2 && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.5, 1]}>
              <circleGeometry args={[0.22, 8]} />
              <meshStandardMaterial color="#5d7a3a" roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

function Home() {
  const lamp = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = intro.t;
    const out = phase(t, T.broom, T.water);
    const back = phase(t, T.reset + 4, T.reset + 9);
    const level = (1 - out + back * 0.15) * (0.9 + Math.sin(state.clock.elapsedTime * 9) * 0.06 + Math.sin(state.clock.elapsedTime * 23) * 0.03);
    if (lamp.current) lamp.current.intensity = 5 * level;
    if (flame.current) flame.current.scale.setScalar(Math.max(0.01, level));
  });
  return (
    <group position={[HOME.x, 0, HOME.z]}>
      <HomeProps />
      <pointLight ref={lamp} position={[0.6, 0.9, 0.3]} color="#ffb96a" distance={7} decay={1.6} castShadow />
      <mesh position={[0.6, 0.62, 0.3]} ref={flame}>
        <sphereGeometry args={[0.06, 12, 10]} />
        <meshBasicMaterial color="#ffd89a" toneMapped={false} />
      </mesh>
    </group>
  );
}

function HomeProps() {
    const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const destroyed = intro.t > T.water && intro.t < T.reset + 99;
    ref.current.visible = !destroyed;
    const shove = phase(intro.t, T.water - 0.9, T.water);
    ref.current.position.z = shove * 3;
    ref.current.rotation.y = shove * 0.8;
  });
  return (
    <group ref={ref}>
      <mesh position={[-0.9, 0.55, -0.9]} rotation={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.1, 1.2]} />
        <meshStandardMaterial color="#a98458" roughness={0.9} />
      </mesh>
      <mesh position={[-0.9, 1.12, -0.9]} rotation={[0, 0.25, 0.04]} castShadow>
        <boxGeometry args={[1.62, 0.07, 1.3]} />
        <meshStandardMaterial color="#8d6c43" roughness={0.9} />
      </mesh>
      <mesh position={[-0.6, 0.45, -0.28]} rotation={[0, 0.25, 0]}>
        <boxGeometry args={[0.55, 0.8, 0.04]} />
        <meshBasicMaterial color="#201006" />
      </mesh>
      <mesh position={[0.6, 0.18, 0.3]} castShadow>
        <cylinderGeometry args={[0.2, 0.17, 0.36, 24]} />
        <meshPhysicalMaterial color="#c9503f" metalness={0.7} roughness={0.3} clearcoat={0.8} />
      </mesh>
      <mesh position={[0.6, 0.55, 0.3]}>
        <cylinderGeometry args={[0.035, 0.035, 0.18, 10]} />
        <meshStandardMaterial color="#efe3c9" roughness={0.6} />
      </mesh>
      <RoundedBox args={[0.6, 0.06, 0.4]} radius={0.02} position={[0.2, 0.06, 0.9]} rotation={[0, 0.3, 0]} receiveShadow>
        <meshStandardMaterial color="#a62f3a" roughness={0.9} />
      </RoundedBox>
      <mesh position={[-0.2, 0.5, 0.8]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.6, 18]} />
        <meshStandardMaterial color="#b9c4c7" metalness={0.8} roughness={0.35} />
      </mesh>
      <Bottle position={[1.8, 0, -0.2]} rotation={[0, 0, Math.PI / 2 - 0.1]} />
    </group>
  );
}

function Grate() {
  const bars = [-0.45, -0.22, 0, 0.22, 0.45];
  const light = useRef<THREE.SpotLight>(null);
  const shaft = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const t = intro.t;
    const cover = phase(t, T.disaster + 0.2, T.disaster + 1.6) * (1 - phase(t, T.water + 3, T.reset + 1));
    const level = 1 - cover * 0.88;
    if (light.current) light.current.intensity = 70 * level;
    if (shaft.current) (shaft.current.material as THREE.MeshBasicMaterial).opacity = 0.2 * level;
  });
  return (
    <group position={[HOME.x + 0.4, 4.43, HOME.z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <planeGeometry args={[1.5, 1.0]} />
        <meshBasicMaterial color="#fff3d8" toneMapped={false} />
      </mesh>
      {bars.map((x) => (
        <mesh key={x} position={[x * 1.4, 0, 0]} castShadow>
          <boxGeometry args={[0.05, 0.05, 1.04]} />
          <meshStandardMaterial color="#1e2326" metalness={0.8} roughness={0.5} />
        </mesh>
      ))}
      <spotLight ref={light} position={[0, 0.1, 0]} angle={0.5} penumbra={0.9} color="#fff1d0" distance={12} decay={1.4} castShadow target-position={[0, -5, 0]} />
      <mesh ref={shaft} position={[0, -2.25, 0]}>
        <cylinderGeometry args={[0.7, 1.7, 4.5, 24, 1, true]} />
        <meshBasicMaterial color="#fff0cc" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <Sparkles count={26} scale={[1.6, 4, 1.2]} position={[0, -2.2, 0]} size={2.2} speed={0.2} color="#fff0cc" opacity={0.5} />
    </group>
  );
}

export function DrainSet() {
  return (
    <group>
      <mesh position={[0, 1.6, -TUNNEL_LEN / 2 + 14]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[3.2, 3.2, TUNNEL_LEN, 40, 1, true]} />
        <Concrete id="concrete_wall_004" rx={5} ry={9} tint="#8a9094" side={THREE.BackSide} />
      </mesh>
      <mesh position={[1.35, -0.2, -TUNNEL_LEN / 2 + 14]} receiveShadow castShadow>
        <boxGeometry args={[3.5, 0.4, TUNNEL_LEN]} />
        <Concrete id="scuffed_cement" rx={2} ry={14} tint="#9a9a94" />
      </mesh>
      <mesh position={[-0.42, -0.2, -TUNNEL_LEN / 2 + 14]} castShadow>
        <boxGeometry args={[0.1, 0.5, TUNNEL_LEN]} />
        <meshStandardMaterial color="#7a7d80" roughness={0.8} />
      </mesh>
      <Water />
      <Floaters />
      <Grate />
      <Home />
      <Bottle position={[2.4, 0, 6]} rotation={[0, 0.5, Math.PI / 2]} />
      <Bottle position={[2.0, 0, -9]} rotation={[0, 2, Math.PI / 2 - 0.2]} />
      <mesh position={[2.2, 0.08, 1.2]} rotation={[0.1, 0.8, 0]} castShadow>
        <icosahedronGeometry args={[0.28, 1]} />
        <meshStandardMaterial color="#4f5b3a" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.6, 0.02, 3.4]} rotation={[-Math.PI / 2, 0, 0.5]}>
        <circleGeometry args={[0.55, 20]} />
        <meshStandardMaterial color="#26302e" roughness={0.2} metalness={0.2} transparent opacity={0.8} />
      </mesh>
      <Sparkles count={40} scale={[5, 3, 26]} position={[0, 1.8, -2]} size={1.6} speed={0.08} color="#cfe3ea" opacity={0.25} />
    </group>
  );
}

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HOME, intro, lerp, phase, smooth, T } from './timeline';

export function Disaster() {
  const shadow = useRef<THREE.Mesh>(null);
  const broom = useRef<THREE.Group>(null);
  const flood = useRef<THREE.Mesh>(null);
  const foam = useRef<THREE.Mesh>(null);
  const spray = useRef<THREE.Group>(null);
  const bristle = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = intro.t;
    const tt = state.clock.elapsedTime;

    if (shadow.current) {
      const on = phase(t, T.disaster, T.disaster + 1.4) * (1 - phase(t, T.water + 2, T.reset));
      const m = shadow.current.material as THREE.MeshBasicMaterial;
      m.opacity = on * 0.85;
      const pulse = 1 + Math.sin(tt * 4) * 0.02;
      shadow.current.scale.set(pulse * lerp(1.2, 2.1, phase(t, T.disaster, T.broom)), pulse, 1);
      shadow.current.position.set(HOME.x + 0.5, 0.06, HOME.z + lerp(-2.4, 0.5, phase(t, T.disaster, T.broom)));
    }

    if (broom.current) {
      const arrive = smooth(phase(t, T.disaster + 1.2, T.broom - 0.3));
      const sweep = phase(t, T.broom, T.water);
      const present = t > T.disaster + 1 && t < T.water + 1.4;
      broom.current.visible = present;
      const stroke = Math.sin(sweep * Math.PI * 3.2);
      broom.current.position.set(
        HOME.x + 0.3 + stroke * 1.5 * (sweep > 0 ? 1 : 0),
        lerp(6.2, 0.08, arrive),
        HOME.z + 0.9 - sweep * 1.4,
      );
      broom.current.rotation.set(-0.5 + arrive * 0.15, 0, stroke * 0.35);
      if (bristle.current) bristle.current.rotation.z = stroke * 0.18;
    }

    if (flood.current) {
      const k = phase(t, T.water, T.water + 1.8);
      const out = 1 - phase(t, T.reset - 1.6, T.reset);
      const m = flood.current.material as THREE.MeshPhysicalMaterial;
      m.opacity = 0.97 * out * Math.min(1, k * 3);
      flood.current.visible = t > T.water - 0.1 && t < T.reset + 0.2;
      const rush = smooth(k);
      flood.current.position.set(HOME.x, lerp(-0.2, 0.55, rush) + Math.sin(tt * 8) * 0.05, lerp(-16, HOME.z + 2, Math.min(1, k * 1.6)));
      flood.current.scale.set(1, 1 + Math.sin(tt * 9) * 0.06, lerp(0.3, 1.2, rush));
    }

    if (foam.current) {
      foam.current.visible = t > T.water && t < T.reset;
      const k = phase(t, T.water, T.water + 1.5);
      foam.current.position.set(HOME.x, 0.9 + Math.sin(tt * 12) * 0.08, lerp(-15, HOME.z + 3.2, Math.min(1, k * 1.5)));
    }

    if (spray.current) {
      spray.current.visible = t > T.water && t < T.reset - 0.5;
      spray.current.rotation.y += 0.08;
    }
  });

  return (
    <group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={broom} visible={false}>
        <mesh position={[0, 3.1, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 6.2, 12]} />
          <meshStandardMaterial color="#8a6a3a" roughness={0.7} />
        </mesh>
        <group ref={bristle}>
          <mesh position={[0, 0.0, 0]} castShadow>
            <boxGeometry args={[1.2, 0.18, 0.32]} />
            <meshStandardMaterial color="#d6b04a" roughness={0.9} />
          </mesh>
          {Array.from({ length: 22 }).map((_, i) => (
            <mesh key={i} position={[-0.55 + i * 0.05, -0.2, (i % 3) * 0.04 - 0.04]} rotation={[0.05 * (i % 4), 0, (i - 11) * 0.012]} castShadow>
              <cylinderGeometry args={[0.012, 0.01, 0.42, 5]} />
              <meshStandardMaterial color="#e3c05a" roughness={0.9} />
            </mesh>
          ))}
        </group>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.3, 0.1, 0.38]} />
          <meshStandardMaterial color="#5c7a96" roughness={0.6} />
        </mesh>
      </group>

      <mesh ref={flood} visible={false} position={[HOME.x, 0.2, -10]}>
        <boxGeometry args={[5.8, 1.6, 6]} />
        <meshPhysicalMaterial color="#58b8c8" emissive="#1f6f80" emissiveIntensity={0.6} transparent opacity={0} roughness={0.08} clearcoat={1} />
      </mesh>
      <mesh ref={foam} visible={false} position={[HOME.x, 0.9, -10]}>
        <boxGeometry args={[5.9, 0.4, 0.8]} />
        <meshStandardMaterial color="#f2fbff" roughness={0.9} emissive="#bfeaf5" emissiveIntensity={0.25} />
      </mesh>
      <group ref={spray} position={[HOME.x, 0.8, HOME.z + 1.5]} visible={false}>
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh key={i} position={[Math.cos(i) * (0.4 + (i % 4) * 0.35), (i % 5) * 0.28, Math.sin(i * 1.7) * 0.6]}>
            <sphereGeometry args={[0.06 + (i % 3) * 0.03, 8, 6]} />
            <meshBasicMaterial color="#e9fbff" transparent opacity={0.75} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

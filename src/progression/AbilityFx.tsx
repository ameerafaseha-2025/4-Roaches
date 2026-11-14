import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sim } from '../game/sim';

const setOpacity = (m: THREE.Mesh | null, v: number) => {
  if (!m) return;
  m.visible = v > 0.01;
  (m.material as THREE.MeshBasicMaterial).opacity = v;
};

export function AbilityFx() {
  const shield = useRef<THREE.Mesh>(null);
  const dash = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const burst = useRef<THREE.Mesh>(null);
  const veil = useRef<THREE.Mesh>(null);
  const rage = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const fx = sim.fx;
    setOpacity(shield.current, fx.shield > 0 ? 0.28 + Math.sin(t * 10) * 0.06 : 0);
    if (shield.current) shield.current.scale.setScalar(1 + Math.sin(t * 8) * 0.03);

    const d = fx.dash > 0 ? fx.dash / 0.3 : 0;
    setOpacity(dash.current, d * 0.8);
    if (dash.current) dash.current.scale.set(1, 1, 1 + (1 - d) * 3);
    if (ring.current) {
      const k = fx.dash > 0 || sim.abilityFlash > 0.4 && fx.dash > -1 ? 1 - d : 0;
      setOpacity(ring.current, fx.dash > 0 ? (1 - k) * 0.7 : 0);
      ring.current.scale.setScalar(0.4 + k * 3.2);
    }

    const b = fx.burst > 0 ? fx.burst / 0.45 : 0;
    setOpacity(burst.current, b * 0.7);
    if (burst.current) burst.current.scale.set(1, 1, 1 + (1 - b) * 2);

    setOpacity(veil.current, fx.veil > 0 ? 0.22 + Math.sin(t * 5) * 0.05 : 0);
    if (veil.current) veil.current.scale.setScalar(1.1 + Math.sin(t * 3) * 0.06);

    setOpacity(rage.current, fx.rage > 0 ? 0.3 + Math.sin(t * 14) * 0.1 : 0);

    if (light.current) {
      const on = fx.dash > 0 || fx.rage > 0 || fx.burst > 0 || fx.shield > 0 || fx.veil > 0;
      light.current.intensity = THREE.MathUtils.damp(light.current.intensity, on ? 2.4 : 0, 12, 0.016);
      light.current.color.set(fx.rage > 0 ? '#ffcf4a' : fx.dash > 0 ? '#6fd3ff' : fx.veil > 0 ? '#a77bff' : fx.shield > 0 ? '#9db4c8' : '#cfeaff');
    }
  });

  return (
    <group>
      <mesh ref={shield} position={[0, 0.22, 0.05]} visible={false}>
        <sphereGeometry args={[0.55, 28, 20]} />
        <meshBasicMaterial color="#9db4c8" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={dash} position={[0, 0.2, -0.7]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <coneGeometry args={[0.25, 1.6, 16, 1, true]} />
        <meshBasicMaterial color="#6fd3ff" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={ring} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.85, 1, 40]} />
        <meshBasicMaterial color="#6fd3ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={burst} position={[0, 0.2, -0.7]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <coneGeometry args={[0.35, 1.8, 16, 1, true]} />
        <meshBasicMaterial color="#cfeaff" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={veil} position={[0, 0.22, 0.05]} visible={false}>
        <sphereGeometry args={[0.6, 24, 18]} />
        <meshBasicMaterial color="#7a4fd0" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={rage} position={[0, 0.22, 0.05]} visible={false}>
        <sphereGeometry args={[0.62, 24, 18]} />
        <meshBasicMaterial color="#ffcf4a" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0.4, 0]} intensity={0} distance={4} />
    </group>
  );
}

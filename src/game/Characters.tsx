import { forwardRef, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type Motion = { speed: number; alert: number };

type HumanProps = {
  skin: string;
  outfit: string;
  hair: string;
  style?: 'shirt' | 'dress' | 'apron' | 'suit';
  hairStyle?: 'short' | 'long' | 'bun' | 'bald';
  weapon?: 'slipper' | 'spray';
  scale?: number;
  fear: number;
  stuck: boolean;
  motion: MutableRefObject<Motion>;
};

const mat = (color: string, rough = 0.7, sheen = 0.6) => (
  <meshPhysicalMaterial color={color} roughness={rough} metalness={0} sheen={sheen} sheenRoughness={0.5} sheenColor="#ffffff" />
);

function torsoGeometry(bottom: number, waist: number, chest: number, shoulder: number) {
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(bottom, 0.02),
    new THREE.Vector2(waist, 0.22),
    new THREE.Vector2(waist * 0.98, 0.34),
    new THREE.Vector2(chest, 0.52),
    new THREE.Vector2(shoulder, 0.68),
    new THREE.Vector2(shoulder * 0.7, 0.76),
    new THREE.Vector2(0.075, 0.8),
    new THREE.Vector2(0.001, 0.8),
  ];
  const g = new THREE.LatheGeometry(pts, 36);
  g.scale(1, 1, 0.68);
  return g;
}

function Hand({ skin }: { skin: string }) {
  return (
    <group>
      <mesh scale={[1, 1.1, 0.55]} castShadow>
        <sphereGeometry args={[0.052, 18, 14]} />
        {mat(skin, 0.6)}
      </mesh>
      {[-0.03, -0.01, 0.012, 0.034].map((x, i) => (
        <mesh key={i} position={[x, -0.062 - (i === 1 || i === 2 ? 0.008 : 0), 0]} castShadow>
          <capsuleGeometry args={[0.0085, 0.04, 4, 8]} />
          {mat(skin, 0.6)}
        </mesh>
      ))}
      <mesh position={[0.05, -0.02, 0.012]} rotation={[0, 0, -0.9]}>
        <capsuleGeometry args={[0.0095, 0.035, 4, 8]} />
        {mat(skin, 0.6)}
      </mesh>
    </group>
  );
}

export const HumanModel = forwardRef<THREE.Group, HumanProps>(function HumanModel(
  { skin, outfit, hair, style = 'shirt', hairStyle = 'short', weapon, scale = 1, fear, stuck, motion },
  ref,
) {
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const foreL = useRef<THREE.Group>(null);
  const foreR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);
  const hips = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const torso = useMemo(() => torsoGeometry(0.2, 0.17, 0.2, 0.235), []);
  const pale = useMemo(() => new THREE.Color(skin).lerp(new THREE.Color('#f6f1ea'), Math.min(0.6, fear / 170)).getStyle(), [skin, fear]);
  const trousers = style === 'suit' ? '#2a2c34' : style === 'dress' ? skin : '#3b3f52';
  const shoe = weapon ? '#2c2f36' : '#5a3b2a';
  const scared = fear > 45;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const sp = Math.min(1, motion.current.speed / 1.4);
    const w = t * (4 + sp * 3);
    const swing = Math.sin(w) * 0.55 * sp;
    if (legL.current && legR.current && kneeL.current && kneeR.current) {
      legL.current.rotation.x = swing;
      legR.current.rotation.x = -swing;
      kneeL.current.rotation.x = Math.max(0, -Math.sin(w)) * 0.7 * sp;
      kneeR.current.rotation.x = Math.max(0, Math.sin(w)) * 0.7 * sp;
    }
    const raise = stuck || scared ? 1 : 0;
    if (armL.current && armR.current && foreL.current && foreR.current) {
      const idle = Math.sin(t * 1.4) * 0.03;
      armL.current.rotation.x = -swing * 0.7 + idle - raise * 1.2;
      armR.current.rotation.x = swing * 0.7 - idle - raise * (weapon ? 0.5 : 1.2);
      armL.current.rotation.z = 0.12 + raise * 0.5;
      armR.current.rotation.z = -0.12 - raise * 0.5;
      foreL.current.rotation.x = -0.25 - raise * 0.9;
      foreR.current.rotation.x = -0.25 - raise * (weapon ? 1.6 : 0.9);
    }
    if (hips.current) {
      hips.current.position.y = 0.88 + Math.abs(Math.sin(w)) * 0.012 * sp + Math.sin(t * 1.4) * 0.003;
      hips.current.rotation.z = Math.sin(w) * 0.025 * sp + (stuck ? Math.sin(t * 22) * 0.05 : 0);
    }
    if (head.current) {
      head.current.rotation.x = Math.sin(t * 0.8) * 0.02 - (scared ? 0.18 : 0);
      head.current.rotation.z = stuck ? Math.sin(t * 24) * 0.12 : 0;
    }
    if (lid.current) {
      const blink = Math.sin(t * 0.9 + 1.3) > 0.985 ? 0.1 : 1;
      lid.current.scale.y = blink;
    }
  });

  const wideEyes = scared ? 1.25 : 1;
  const pupil = scared ? 0.011 : 0.017;

  return (
    <group ref={ref} scale={scale}>
      <group ref={hips} position={[0, 0.88, 0]}>
        {[-1, 1].map((s) => (
          <group key={s} ref={s === -1 ? legL : legR} position={[s * 0.085, 0, 0]}>
            <mesh position={[0, -0.21, 0]} castShadow>
              <capsuleGeometry args={[0.07, 0.34, 8, 16]} />
              {mat(trousers, 0.85, 0.8)}
            </mesh>
            <group ref={s === -1 ? kneeL : kneeR} position={[0, -0.42, 0]}>
              <mesh position={[0, -0.2, 0]} castShadow>
                <capsuleGeometry args={[0.052, 0.34, 8, 16]} />
                {mat(trousers, 0.85, 0.8)}
              </mesh>
              <mesh position={[0, -0.415, 0.035]} scale={[1, 0.62, 1.7]} castShadow>
                <sphereGeometry args={[0.062, 18, 14]} />
                {mat(shoe, 0.4, 0.3)}
              </mesh>
            </group>
          </group>
        ))}
        {style === 'dress' && (
          <mesh position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.3, 0.5, 32, 1, true]} />
            <meshPhysicalMaterial color={outfit} roughness={0.8} sheen={1} sheenColor="#ffffff" side={THREE.DoubleSide} />
          </mesh>
        )}
        <mesh geometry={torso} position={[0, -0.02, 0]} castShadow>
          <meshPhysicalMaterial color={outfit} roughness={0.85} sheen={1} sheenColor="#ffffff" sheenRoughness={0.5} />
        </mesh>
        {style === 'shirt' && (
          <mesh position={[0, 0.2, 0.123]} scale={[0.05, 0.3, 0.012]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
        )}
        {style === 'apron' && (
          <mesh position={[0, 0.2, 0.13]} scale={[1, 1, 1]} castShadow>
            <boxGeometry args={[0.28, 0.5, 0.025]} />
            <meshPhysicalMaterial color="#f7f4ec" roughness={0.9} sheen={1} />
          </mesh>
        )}
        {style === 'suit' && (
          <mesh position={[0, 0.5, 0.12]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.035, 0.2, 0.02]} />
            <meshStandardMaterial color="#8a2a35" roughness={0.6} />
          </mesh>
        )}
        <mesh position={[0, 0.2, 0]} scale={[1, 0.08, 0.68]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1, 32]} />
          <meshStandardMaterial color="#2c2a2a" roughness={0.5} />
        </mesh>

        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.065, 0.12, 20]} />
          {mat(pale, 0.6)}
        </mesh>

        {[-1, 1].map((s) => (
          <group key={s} ref={s === -1 ? armL : armR} position={[s * 0.255, 0.7, 0]}>
            <mesh position={[0, -0.01, 0]} castShadow>
              <sphereGeometry args={[0.065, 20, 16]} />
              {mat(outfit, 0.8, 1)}
            </mesh>
            <mesh position={[0, -0.16, 0]} castShadow>
              <capsuleGeometry args={[0.052, 0.22, 8, 14]} />
              {mat(outfit, 0.8, 1)}
            </mesh>
            <group ref={s === -1 ? foreL : foreR} position={[0, -0.32, 0]}>
              <mesh position={[0, -0.14, 0]} castShadow>
                <capsuleGeometry args={[0.042, 0.2, 8, 14]} />
                {mat(pale, 0.6)}
              </mesh>
              <group position={[0, -0.3, 0]} scale={[s, 1, 1]}>
                <Hand skin={pale} />
                {weapon && s === 1 && (
                  <group position={[0, -0.08, 0.04]} rotation={[0.3, 0, 0]}>
                    {weapon === 'slipper' ? (
                      <mesh scale={[1, 0.3, 1]} castShadow>
                        <capsuleGeometry args={[0.07, 0.24, 8, 16]} />
                        <meshPhysicalMaterial color="#3f8fd0" roughness={0.35} clearcoat={0.7} />
                      </mesh>
                    ) : (
                      <group>
                        <mesh castShadow>
                          <cylinderGeometry args={[0.04, 0.04, 0.24, 20]} />
                          <meshPhysicalMaterial color="#d8403f" roughness={0.3} clearcoat={0.8} />
                        </mesh>
                        <mesh position={[0, 0.14, 0.02]}>
                          <cylinderGeometry args={[0.018, 0.026, 0.05, 12]} />
                          <meshStandardMaterial color="#f3f3f3" roughness={0.4} />
                        </mesh>
                      </group>
                    )}
                  </group>
                )}
              </group>
            </group>
          </group>
        ))}

        <group ref={head} position={[0, 0.98, 0]}>
          <mesh scale={[0.92, 1.08, 0.98]} castShadow>
            <sphereGeometry args={[0.145, 40, 32]} />
            {mat(pale, 0.55, 0.9)}
          </mesh>
          <mesh position={[0, -0.075, 0.03]} scale={[0.82, 0.8, 0.85]} castShadow>
            <sphereGeometry args={[0.12, 28, 22]} />
            {mat(pale, 0.55, 0.9)}
          </mesh>
          <mesh position={[0, -0.01, 0.145]} scale={[0.7, 1.2, 1]} castShadow>
            <coneGeometry args={[0.022, 0.07, 14]} />
            {mat(pale, 0.5, 0.6)}
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.145, -0.005, 0]} scale={[0.4, 1, 0.8]} castShadow>
                <sphereGeometry args={[0.04, 14, 12]} />
                {mat(pale, 0.55, 0.6)}
              </mesh>
              <group position={[s * 0.056, 0.02, 0.123]} scale={[1, wideEyes, 1]}>
                <mesh scale={[1, 0.85, 0.55]}>
                  <sphereGeometry args={[0.03, 20, 16]} />
                  <meshPhysicalMaterial color="#fbfaf6" roughness={0.12} clearcoat={1} />
                </mesh>
                <mesh position={[0, 0, 0.014]} scale={[1, 1, 0.5]}>
                  <sphereGeometry args={[0.019, 16, 14]} />
                  <meshStandardMaterial color="#4a3020" roughness={0.2} />
                </mesh>
                <mesh position={[0, 0, 0.022]}>
                  <sphereGeometry args={[pupil, 12, 10]} />
                  <meshStandardMaterial color="#0c0806" roughness={0.1} />
                </mesh>
                <mesh position={[0.007, 0.008, 0.027]}>
                  <sphereGeometry args={[0.004, 8, 6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
              <mesh position={[s * 0.056, 0.062 + (scared ? 0.018 : 0), 0.128]} rotation={[0, 0, s * (scared ? 0.35 : -0.12)]} scale={[1, 0.28, 0.4]}>
                <capsuleGeometry args={[0.017, 0.05, 4, 8]} />
                <meshStandardMaterial color={hair} roughness={0.6} />
              </mesh>
              <mesh position={[s * 0.085, -0.045, 0.1]} scale={[1, 0.6, 0.4]}>
                <sphereGeometry args={[0.028, 12, 10]} />
                <meshBasicMaterial color="#ff8f8f" transparent opacity={0.22 + Math.min(0.4, fear / 200)} />
              </mesh>
            </group>
          ))}
          <group ref={lid} />
          <mesh position={[0, -0.095, 0.128]} scale={[1, scared ? 1.9 : 0.55, 0.6]}>
            <sphereGeometry args={[scared ? 0.02 : 0.03, 16, 12]} />
            <meshStandardMaterial color={scared ? '#5c1f24' : '#b0605f'} roughness={0.4} />
          </mesh>

          {hairStyle !== 'bald' && (
            <group>
              <mesh position={[0, 0.03, -0.012]} scale={[0.96, 1, 1.02]} castShadow>
                <sphereGeometry args={[0.15, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
                <meshPhysicalMaterial color={hair} roughness={0.45} sheen={1} sheenColor="#ffffff" clearcoat={0.35} />
              </mesh>
              <mesh position={[0, 0.07, 0.07]} rotation={[0.5, 0, 0]} scale={[1.55, 0.35, 0.5]} castShadow>
                <sphereGeometry args={[0.085, 20, 14]} />
                <meshPhysicalMaterial color={hair} roughness={0.45} sheen={1} clearcoat={0.35} />
              </mesh>
            </group>
          )}
          {hairStyle === 'long' && (
            <mesh position={[0, -0.12, -0.075]} scale={[1, 1, 0.55]} castShadow>
              <capsuleGeometry args={[0.13, 0.26, 10, 20]} />
              <meshPhysicalMaterial color={hair} roughness={0.45} sheen={1} clearcoat={0.3} />
            </mesh>
          )}
          {hairStyle === 'bun' && (
            <mesh position={[0, 0.2, -0.04]} castShadow>
              <sphereGeometry args={[0.07, 22, 18]} />
              <meshPhysicalMaterial color={hair} roughness={0.45} sheen={1} clearcoat={0.3} />
            </mesh>
          )}
          {hairStyle === 'bald' && (
            <mesh position={[0, 0.01, -0.09]} scale={[1.2, 0.55, 0.5]}>
              <sphereGeometry args={[0.12, 18, 12, 0, Math.PI * 2, 0, Math.PI]} />
              <meshStandardMaterial color="#cfcfcf" roughness={0.6} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
});

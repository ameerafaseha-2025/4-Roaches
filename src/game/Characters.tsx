import { forwardRef, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { Pose } from './activities';

export type Motion = {
  speed: number;
  alert: number;
  pose: Pose | null;
  poseW: number;
  sit: number;
  stage: number;
  run: number;
  look: number;
  flinch: number;
};

export const newMotion = (): Motion => ({ speed: 0, alert: 0, pose: null, poseW: 0, sit: 0, stage: 0, run: 0, look: 0, flinch: 0 });

type PropRegistry = MutableRefObject<Record<string, THREE.Group | null>>;

function HeldProps({ registry }: { registry: PropRegistry }) {
  const reg = (name: string) => (g: THREE.Group | null) => { registry.current[name] = g; };
  const wood = '#b98a5a';
  return (
    <group>
      <group ref={reg('phone')} visible={false} position={[0, -0.04, 0.035]}>
        <mesh castShadow><boxGeometry args={[0.075, 0.14, 0.012]} /><meshStandardMaterial color="#1c1e22" roughness={0.3} /></mesh>
        <mesh position={[0, 0, 0.007]}><planeGeometry args={[0.065, 0.12]} /><meshBasicMaterial color="#9fd0ff" toneMapped={false} /></mesh>
      </group>
      <group ref={reg('toothbrush')} visible={false} position={[0, -0.05, 0.02]}>
        <mesh position={[0, 0.02, 0]}><capsuleGeometry args={[0.011, 0.14, 4, 8]} /><meshStandardMaterial color="#5ad0c8" roughness={0.4} /></mesh>
        <mesh position={[0, 0.115, 0]}><boxGeometry args={[0.025, 0.04, 0.018]} /><meshStandardMaterial color="#ffffff" /></mesh>
      </group>
      <group ref={reg('comb')} visible={false} position={[0, -0.05, 0.02]}>
        <mesh><boxGeometry args={[0.1, 0.03, 0.012]} /><meshStandardMaterial color="#d96a5a" roughness={0.5} /></mesh>
      </group>
      <group ref={reg('knife')} visible={false} position={[0, -0.04, 0.03]}>
        <mesh position={[0, 0, 0]}><boxGeometry args={[0.03, 0.09, 0.025]} /><meshStandardMaterial color="#3a2a22" /></mesh>
        <mesh position={[0, -0.12, 0]}><boxGeometry args={[0.012, 0.15, 0.06]} /><meshStandardMaterial color="#dfe3e6" metalness={0.9} roughness={0.2} /></mesh>
      </group>
      <group ref={reg('ladle')} visible={false} position={[0, -0.02, 0.02]}>
        <mesh position={[0, -0.1, 0]}><cylinderGeometry args={[0.01, 0.01, 0.38, 8]} /><meshStandardMaterial color="#c9ccd0" metalness={0.8} roughness={0.3} /></mesh>
        <mesh position={[0, -0.3, 0]}><sphereGeometry args={[0.045, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#c9ccd0" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} /></mesh>
      </group>
      <group ref={reg('broom')} visible={false} position={[0, 0, 0]} rotation={[1.3, 0, 0]}>
        <mesh position={[0, -0.4, 0]}><cylinderGeometry args={[0.014, 0.014, 1.7, 8]} /><meshStandardMaterial color={wood} /></mesh>
        <mesh position={[0, -1.22, 0]}><boxGeometry args={[0.42, 0.1, 0.1]} /><meshStandardMaterial color="#d8b94a" roughness={0.9} /></mesh>
      </group>
      <group ref={reg('book')} visible={false} position={[0, -0.05, 0.04]}>
        <mesh castShadow><boxGeometry args={[0.2, 0.15, 0.025]} /><meshStandardMaterial color="#7a5a9a" roughness={0.7} /></mesh>
        <mesh position={[0, 0, 0.014]}><planeGeometry args={[0.18, 0.13]} /><meshStandardMaterial color="#f4efe2" /></mesh>
      </group>
      <group ref={reg('cloth')} visible={false} position={[0, -0.04, 0.03]}>
        <mesh><boxGeometry args={[0.2, 0.16, 0.03]} /><meshStandardMaterial color="#e9e4d8" roughness={0.95} /></mesh>
      </group>
      <group ref={reg('clothes')} visible={false} position={[-0.1, -0.06, 0.07]}>
        <mesh castShadow><boxGeometry args={[0.28, 0.2, 0.07]} /><meshStandardMaterial color="#5aa6c9" roughness={0.95} /></mesh>
        <mesh position={[0, 0, 0.04]}><boxGeometry args={[0.26, 0.18, 0.03]} /><meshStandardMaterial color="#e07a8a" roughness={0.95} /></mesh>
      </group>
      <group ref={reg('box')} visible={false} position={[-0.12, -0.1, 0.12]}>
        <mesh castShadow><boxGeometry args={[0.3, 0.22, 0.22]} /><meshStandardMaterial color="#b98d52" roughness={0.9} /></mesh>
      </group>
      <group ref={reg('plate')} visible={false} position={[-0.05, -0.05, 0.05]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.1, 0.012, 20]} /><meshPhysicalMaterial color="#fafafa" roughness={0.2} clearcoat={1} /></mesh>
      </group>
    </group>
  );
}

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
  const upper = useRef<THREE.Group>(null);
  const propRefs = useRef<Record<string, THREE.Group | null>>({});
  const lid = useRef<THREE.Group>(null);
  const torso = useMemo(() => torsoGeometry(0.2, 0.17, 0.2, 0.235), []);
  const pale = useMemo(() => new THREE.Color(skin).lerp(new THREE.Color('#f6f1ea'), Math.min(0.6, fear / 170)).getStyle(), [skin, fear]);
  const trousers = style === 'suit' ? '#2a2c34' : style === 'dress' ? skin : '#3b3f52';
  const shoe = weapon ? '#2c2f36' : '#5a3b2a';
  const scared = fear > 45;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const m = motion.current;
    const pose = m.pose;
    const pw = pose ? m.poseW : 0;
    const sit = m.sit;
    const run = m.run;
    const sp = Math.min(1, m.speed / 1.4);
    const w = t * (4 + sp * 3 + run * 5);
    const swing = Math.sin(w) * (0.55 + run * 0.5) * sp;
    if (legL.current && legR.current && kneeL.current && kneeR.current) {
      legL.current.rotation.x = swing * (1 - sit) - sit * 1.5;
      legR.current.rotation.x = -swing * (1 - sit) - sit * 1.5;
      kneeL.current.rotation.x = Math.max(0, -Math.sin(w)) * (0.7 + run * 0.7) * sp * (1 - sit) + sit * 1.5;
      kneeR.current.rotation.x = Math.max(0, Math.sin(w)) * (0.7 + run * 0.7) * sp * (1 - sit) + sit * 1.5;
    }
    const stageRaise = stuck ? 1 : m.stage >= 3 ? 1 : m.stage === 2 ? 0.55 : scared ? 0.6 : 0;
    const raise = stageRaise * (1 - pw * (m.stage >= 2 ? 0 : 1));
    const a = pose?.anim ?? 'none';
    const o = { lx: 0, rx: 0, lz: 0, rz: 0, fl: 0, fr: 0, lean: 0, hy: 0 };
    if (pw > 0.01 && m.stage < 2) {
      if (a === 'scrub') { o.lx = Math.sin(t * 9) * 0.14; o.rx = Math.sin(t * 9 + 1.4) * 0.14; o.fl = Math.sin(t * 9) * 0.1; o.fr = Math.sin(t * 9 + 1) * 0.1; }
      else if (a === 'chop') { o.fr = Math.max(0, Math.sin(t * 7)) * 0.6; o.rx = Math.sin(t * 7) * 0.08; o.lx = Math.sin(t * 7) * 0.03; }
      else if (a === 'stir') { o.rz = Math.cos(t * 3.2) * 0.14; o.rx = Math.sin(t * 3.2) * 0.12; o.fr = Math.sin(t * 3.2) * 0.1; }
      else if (a === 'sweep') { o.lx = Math.sin(t * 3.4) * 0.2; o.rx = Math.sin(t * 3.4) * 0.2; o.lean = Math.sin(t * 3.4) * 0.05; }
      else if (a === 'brush') { o.fr = Math.sin(t * 13) * 0.14; o.rx = Math.sin(t * 13) * 0.04; o.hy = Math.sin(t * 13) * 0.04; }
      else if (a === 'type') { o.fl = Math.sin(t * 11) * 0.05; o.fr = Math.sin(t * 9 + 1) * 0.05; }
      else if (a === 'rummage') { o.lx = Math.sin(t * 4) * 0.22; o.rx = Math.sin(t * 4 + 2) * 0.22; o.lean = Math.sin(t * 2.2) * 0.07; }
      else if (a === 'fold') { o.lx = Math.sin(t * 2.6) * 0.14; o.rx = Math.sin(t * 2.6 + 0.5) * 0.14; o.fl = Math.sin(t * 2.6) * 0.15; o.fr = Math.sin(t * 2.6 + 0.5) * 0.15; }
      else if (a === 'read') { o.hy = Math.sin(t * 0.7) * 0.05; }
    }
    if (armL.current && armR.current && foreL.current && foreR.current) {
      const idle = Math.sin(t * 1.4) * 0.03;
      const bLx = -swing * 0.7 + idle - raise * 1.2;
      const bRx = swing * 0.7 - idle - raise * (weapon ? 0.5 : 1.2);
      const bLz = 0.12 + raise * 0.5;
      const bRz = -0.12 - raise * 0.5;
      const bFl = -0.25 - raise * 0.9;
      const bFr = -0.25 - raise * (weapon ? 1.6 : 0.9);
      const pl = pose?.armL ?? [0, 0.12, 0];
      const pr = pose?.armR ?? [0, -0.12, 0];
      const fl = pose?.foreL ?? -0.25;
      const fr = pose?.foreR ?? -0.25;
      armL.current.rotation.x = THREE.MathUtils.lerp(bLx, pl[0] + o.lx, pw);
      armR.current.rotation.x = THREE.MathUtils.lerp(bRx, pr[0] + o.rx, pw);
      armL.current.rotation.z = THREE.MathUtils.lerp(bLz, pl[1] + o.lz, pw);
      armR.current.rotation.z = THREE.MathUtils.lerp(bRz, pr[1] + o.rz, pw);
      foreL.current.rotation.x = THREE.MathUtils.lerp(bFl, fl + o.fl, pw);
      foreR.current.rotation.x = THREE.MathUtils.lerp(bFr, fr + o.fr, pw);
    }
    if (hips.current) {
      hips.current.position.y = 0.88 - sit * 0.39 + Math.abs(Math.sin(w)) * (0.012 + run * 0.02) * sp + Math.sin(t * 1.4) * 0.003;
      hips.current.rotation.z = Math.sin(w) * (0.025 + run * 0.03) * sp + (stuck ? Math.sin(t * 22) * 0.05 : 0);
    }
    if (upper.current) {
      const lean = (pose?.lean ?? 0) * pw + o.lean - (m.stage === 2 ? 0.14 : m.stage >= 3 ? 0.08 : 0) - m.flinch * 0.45 + run * 0.16;
      upper.current.rotation.x = THREE.MathUtils.damp(upper.current.rotation.x, lean, 10, 1 / 60);
      upper.current.position.y = -sit * 0.0;
      const breathe = a === 'breathe' || m.stage === 0 ? 1 + Math.sin(t * 1.6) * 0.008 : 1;
      upper.current.scale.y = breathe;
    }
    for (const key in propRefs.current) {
      const g = propRefs.current[key];
      if (g) g.visible = !!pose && pose.prop === key && pw > 0.5 && m.stage < 3;
    }
    if (head.current) {
      head.current.rotation.x = Math.sin(t * 0.8) * 0.02 - (scared ? 0.18 : 0) + (pose?.headX ?? 0) * pw * (m.stage >= 2 ? 0 : 1) - m.flinch * 0.3;
      head.current.rotation.y = THREE.MathUtils.clamp(m.look, -1.1, 1.1) + o.hy;
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
        <group ref={upper}>
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
                {s === 1 && <HeldProps registry={propRefs} />}
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
    </group>
  );
});

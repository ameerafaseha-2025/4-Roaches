import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, RoundedBox, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Surface } from './surfaces';
import type { Dims, Door } from './world';
import { OPEN_ANGLE, resetDoor, tickDoor } from './door';
import { door as doorState } from './sim';
import { useGame } from './store';

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
  return (
    <group>
      <Surface tex={style.floorTex} w={hx * 2} h={hz * 2} span={style.floorSpan} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} tint={style.floorTint} gloss={0.6} />
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[hx * 2 + 1, 0.2, hz * 2 + 1]} />
        <meshStandardMaterial color="#6b5d52" />
      </mesh>

      {[
        { p: [0, 0, -hz] as [number, number, number], r: 0, len: hx * 2, cut: null as Door | null },
        { p: [0, 0, hz] as [number, number, number], r: Math.PI, len: hx * 2, cut: null as Door | null },
        { p: [-hx, 0, 0] as [number, number, number], r: Math.PI / 2, len: hz * 2, cut: dims.door },
        { p: [hx, 0, 0] as [number, number, number], r: -Math.PI / 2, len: hz * 2, cut: null as Door | null },
      ].map((wall, i) => {
        const half = wall.len / 2;
        const dx = wall.cut ? -wall.cut.z : 0;
        const pieces = wall.cut
          ? [
              { x0: -half, x1: dx - wall.cut.w / 2, y0: 0 },
              { x0: dx + wall.cut.w / 2, x1: half, y0: 0 },
              { x0: dx - wall.cut.w / 2, x1: dx + wall.cut.w / 2, y0: wall.cut.h },
            ]
          : [{ x0: -half, x1: half, y0: 0 }];
        return (
          <group key={i} position={wall.p} rotation={[0, wall.r, 0]}>
            {pieces.map((pc, j) => {
              const len = pc.x1 - pc.x0;
              const cx = (pc.x0 + pc.x1) / 2;
              const wa = Math.max(pc.y0, 0);
              const wb = Math.min(h, w);
              const ua = Math.max(pc.y0, w);
              return (
                <group key={j}>
                  {wb > wa && <Surface tex={style.wallTex} w={len} h={wb - wa} span={style.wallSpan} position={[cx, (wa + wb) / 2, 0.01]} tint={style.wallTint} gloss={0.8} normalStrength={0.6} />}
                  {h > ua && (
                    <mesh position={[cx, (ua + h) / 2, 0.01]} receiveShadow>
                      <planeGeometry args={[len, h - ua]} />
                      {paint(style.upper)}
                    </mesh>
                  )}
                  {pc.y0 === 0 && (
                    <mesh position={[cx, 0.17, 0.05]} castShadow receiveShadow>
                      <boxGeometry args={[len, 0.34, 0.1]} />
                      {paint(style.trim, 0.4)}
                    </mesh>
                  )}
                  {w >= pc.y0 && (
                    <mesh position={[cx, w, 0.06]} castShadow>
                      <boxGeometry args={[len, 0.16, 0.12]} />
                      {paint(style.accent, 0.35)}
                    </mesh>
                  )}
                  <mesh position={[cx, h - 0.14, 0.06]} castShadow>
                    <boxGeometry args={[len, 0.28, 0.12]} />
                    {paint(style.trim, 0.5)}
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}

      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[hx * 2, hz * 2]} />
        {paint(style.ceiling, 0.9)}
      </mesh>
      {dims.door && <Doorway door={dims.door} halfX={hx} />}
    </group>
  );
}

const DEPTH = 3.4;
const SIGN_ON = new THREE.Color('#8bffb0');
const SIGN_OFF = new THREE.Color('#6a3a2c');

function Doorway({ door, halfX }: { door: Door; halfX: number }) {
  const { w, h } = door;
  const ww = w + 0.22;
  const back = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((_, d) => {
    if (!back.current) return;
    const lit = !doorState.locked;
    back.current.color.lerp(lit ? LIT : DIM, Math.min(1, d * 3));
  });
  return (
    <group position={[-halfX, 0, door.z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.005, -DEPTH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ww, DEPTH]} />
        <meshStandardMaterial color="#8a7458" roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * ww / 2, h / 2, -DEPTH / 2]} rotation={[0, -s * Math.PI / 2, 0]}>
          <planeGeometry args={[DEPTH, h]} />
          <meshStandardMaterial color="#cdbf9f" roughness={0.9} emissive="#3a2c18" emissiveIntensity={0.5} />
        </mesh>
      ))}
      <mesh position={[0, h, -DEPTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ww, DEPTH]} />
        <meshStandardMaterial color="#d8ccb0" roughness={0.9} emissive="#3a2c18" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, h / 2, -DEPTH]}>
        <planeGeometry args={[ww, h]} />
        <meshBasicMaterial ref={back} color="#2a2118" toneMapped={false} />
      </mesh>
    </group>
  );
}

const LIT = new THREE.Color('#ffe9b8');
const DIM = new THREE.Color('#40342a');

function useExitSign() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 80;
    const g = c.getContext('2d')!;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 256, 80);
    g.fillStyle = '#000000';
    g.font = '800 54px "DM Sans", Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('EXIT', 128, 44);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

export function ExitDoor({ dims, active, color }: { dims: Dims; active: boolean; color: string }) {
  const door = dims.door;
  const leaf = useRef<THREE.Group>(null);
  const doorLight = useRef<THREE.PointLight>(null);
  const trimMat = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const sign = useRef<THREE.MeshBasicMaterial>(null);
  const exitTex = useExitSign();
  useEffect(() => { if (door) resetDoor(door.z, door.w, door.h); }, [door]);
  useFrame((state, delta) => {
    if (!leaf.current || !door) return;
    const dt = Math.min(delta, 0.05);
    doorState.locked = !active;
    if (useGame.getState().screen === 'game') tickDoor(dt);
    leaf.current.rotation.y = doorState.p * OPEN_ANGLE;
    const pulse = active && doorState.state === 'closed' ? 0.35 + Math.sin(state.clock.elapsedTime * 2.4) * 0.15 : active ? 0.2 : 0;
    trimMat.current.forEach((m) => { if (m) m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, pulse, 6, dt); });
    if (sign.current) sign.current.color.lerp(active ? SIGN_ON : SIGN_OFF, Math.min(1, dt * 4));
    if (doorLight.current) doorLight.current.intensity = THREE.MathUtils.damp(doorLight.current.intensity, active ? 10 + doorState.p * 10 : 0, 4, dt);
  });
  if (!door) return null;
  const { w, h } = door;
  const trim = (m: THREE.MeshPhysicalMaterial | null, i: number) => { if (m) trimMat.current[i] = m; };
  return (
    <group position={[-dims.halfX, 0, door.z]} rotation={[0, Math.PI / 2, 0]}>
      <pointLight ref={doorLight} position={[0, h * 0.5, 0.9]} intensity={0} distance={9} color="#ffe2a0" />
      {[-1, 1].map((s, i) => (
        <RoundedBox key={s} args={[0.22, h + 0.2, 0.24]} radius={0.04} position={[s * (w / 2 + 0.11), (h + 0.2) / 2, 0.08]} castShadow>
          <meshPhysicalMaterial ref={(m) => trim(m, i)} color="#f1ebe0" roughness={0.4} emissive="#ffd27a" emissiveIntensity={0} />
        </RoundedBox>
      ))}
      <RoundedBox args={[w + 0.44, 0.22, 0.24]} radius={0.04} position={[0, h + 0.1, 0.08]} castShadow>
        <meshPhysicalMaterial ref={(m) => trim(m, 2)} color="#f1ebe0" roughness={0.4} emissive="#ffd27a" emissiveIntensity={0} />
      </RoundedBox>
      <group position={[0, h + 0.62, 0.1]}>
        <mesh>
          <boxGeometry args={[1.1, 0.34, 0.06]} />
          <meshStandardMaterial color="#2a2623" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[1.0, 0.28]} />
          <meshBasicMaterial ref={sign} map={exitTex} color="#5a2a20" toneMapped={false} />
        </mesh>
      </group>
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

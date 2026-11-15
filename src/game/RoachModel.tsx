import { createContext, useContext, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { sim } from './sim';
import { MUTATIONS, type MutationId, type RoachLook } from '../progression/MutationConfig';
import { cosmeticById, type CosmeticSlot } from '../progression/CosmeticsConfig';

export type RoachPose = { speed: number; flying: boolean; grounded: boolean; sprinting: boolean; velocity: { y: number } };

export const RoachPoseContext = createContext<RoachPose>(sim);

type Resolved = {
  look: RoachLook;
  shell: string;
  shellLight: string;
  wing: string;
  antenna: string;
  fx: string | null;
  accessory: string | null;
};

const LookContext = createContext<Resolved | null>(null);
const useLook = () => useContext(LookContext)!;

export type Cosmetics = Partial<Record<CosmeticSlot, string>>;

function resolve(mutation: MutationId, cosmetics?: Cosmetics): Resolved {
  const look = MUTATIONS[mutation].look;
  const value = (slot: CosmeticSlot) => (cosmetics?.[slot] ? cosmeticById(cosmetics[slot]!)?.value ?? null : null);
  const shell = value('shell') ?? look.shell;
  const shellLight = value('shell') ? new THREE.Color(shell).lerp(new THREE.Color('#ffffff'), 0.22).getStyle() : look.shellLight;
  return {
    look,
    shell,
    shellLight,
    wing: value('wing') ?? look.wing,
    antenna: value('antenna') ?? 'default',
    fx: value('fx'),
    accessory: value('accessory'),
  };
}

function Shell({ color, rough = 0.28, coat = 0.9, glow = false }: { color: string; rough?: number; coat?: number; glow?: boolean }) {
  const { look } = useLook();
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={rough}
      metalness={look.metal}
      clearcoat={coat}
      clearcoatRoughness={0.18}
      sheen={0.4}
      sheenColor="#d9a070"
      emissive={glow && look.glow ? look.glow : '#000000'}
      emissiveIntensity={glow && look.glow ? 0.35 : 0}
    />
  );
}

function useWingGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.09, 0.02, 0.11, 0.3, 0.05, 0.62);
    shape.bezierCurveTo(0.03, 0.7, -0.03, 0.7, -0.05, 0.6);
    shape.bezierCurveTo(-0.08, 0.3, -0.06, 0.04, 0, 0);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.012, bevelSegments: 3, curveSegments: 20 });
    g.translate(-0.06, 0, 0);
    g.rotateX(Math.PI / 2);
    g.rotateY(Math.PI);
    return g;
  }, []);
}

function Leg({ side, index, thighLen = 0.2, shinLen = 0.26 }: { side: -1 | 1; index: number; thighLen?: number; shinLen?: number }) {
  const sim = useContext(RoachPoseContext);
  const { look, shellLight } = useLook();
  const hip = useRef<THREE.Group>(null);
  const knee = useRef<THREE.Group>(null);
  const foot = useRef<THREE.Group>(null);
  const base = [0.5, 0, -0.5][index];
  const phase = (index + (side === 1 ? 0 : 1)) % 2 === 0 ? 0 : Math.PI;
  const z = [0.16, 0, -0.17][index];
  const th = look.legThick;
  useFrame((state) => {
    if (!hip.current || !knee.current || !foot.current) return;
    const t = state.clock.elapsedTime;
    const moving = sim.speed > 0.15 && !sim.flying && sim.grounded;
    const rate = sim.sprinting ? 30 : 17;
    const air = !sim.grounded && !sim.flying;
    let swing = 0;
    let lift = 0;
    if (moving) {
      swing = Math.sin(t * rate + phase) * 0.55;
      lift = Math.max(0, Math.cos(t * rate + phase)) * 0.55;
    }
    let spread = 0;
    let tuck = 0;
    if (sim.flying) { tuck = 0.8; spread = -0.15; }
    if (air) { tuck = -0.35; spread = 0.25; }
    hip.current.rotation.y = side * (base + swing * 0.55 + (index === 0 ? 0.15 : index === 2 ? -0.2 : 0)) * -1;
    hip.current.rotation.z = side * (0.5 - spread - lift * 0.25);
    knee.current.rotation.z = side * (-1.25 + lift * 0.5 + tuck);
    foot.current.rotation.z = side * (0.85 - lift * 0.4);
  });
  return (
    <group position={[side * 0.1, 0.13, z]}>
      <group ref={hip}>
        <mesh position={[side * thighLen / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.8]} castShadow>
          <capsuleGeometry args={[0.032 * th, thighLen, 6, 12]} />
          <meshStandardMaterial color={look.leg} roughness={0.45} metalness={look.metal * 0.6} />
        </mesh>
        <mesh position={[side * thighLen, 0, 0]}>
          <sphereGeometry args={[0.034 * th, 12, 10]} />
          <meshStandardMaterial color={shellLight} roughness={0.4} metalness={look.metal * 0.6} />
        </mesh>
        <group ref={knee} position={[side * thighLen, 0, 0]}>
          <mesh position={[side * shinLen / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.022 * th, shinLen, 6, 10]} />
            <meshStandardMaterial color={look.leg} roughness={0.5} metalness={look.metal * 0.6} />
          </mesh>
          <group ref={foot} position={[side * shinLen, 0, 0]}>
            <mesh position={[side * 0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.012 * th, 0.09, 4, 8]} />
              <meshStandardMaterial color="#20120a" roughness={0.6} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function Antenna({ side }: { side: -1 | 1 }) {
  const sim = useContext(RoachPoseContext);
  const { look, antenna } = useLook();
  const ref = useRef<THREE.Group>(null);
  const style = antenna;
  const geo = useMemo(() => {
    const k = style === 'long' ? 1.25 : 0.8;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const curl = style === 'curly' ? Math.sin(u * Math.PI * 4) * 0.05 * u : 0;
      pts.push(new THREE.Vector3(side * (0.62 * u * k + curl), 0.16 * Math.sin(u * Math.PI * 0.9), 0.66 * Math.pow(u, 0.85) * k + (style === 'curly' ? Math.cos(u * Math.PI * 4) * 0.03 * u : 0)));
    }
    return { tube: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, 0.009, 6, false), tip: pts[pts.length - 1] };
  }, [side, style]);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 2.4 + side) * 0.14 * side;
    ref.current.rotation.x = Math.sin(t * 3.1 + side * 2) * 0.05 - (sim.flying ? 0.25 : 0);
  });
  const glowTip = style === 'glow' || (look.glow && look.pattern === 'bolts');
  const tipColor = style === 'glow' ? '#ffe9a0' : look.glow ?? '#ffffff';
  return (
    <group ref={ref} position={[side * 0.04, 0.27, 0.42]}>
      <mesh geometry={geo.tube} castShadow>
        <meshStandardMaterial color={look.leg} roughness={0.5} emissive={glowTip ? tipColor : '#000000'} emissiveIntensity={glowTip ? 0.5 : 0} />
      </mesh>
      {glowTip && (
        <mesh position={geo.tip}>
          <sphereGeometry args={[0.022, 12, 10]} />
          <meshBasicMaterial color={tipColor} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function Wing({ side, geo }: { side: 1 | -1; geo: THREE.BufferGeometry }) {
  const { look, wing } = useLook();
  const [w, l] = look.wingSize;
  const veins = look.pattern === 'veins' || look.pattern === 'royal';
  return (
    <group position={[side * 0.025, 0, 0]}>
      <mesh geometry={geo} scale={[side * w, 1, l]} castShadow>
        <meshPhysicalMaterial color={wing} roughness={0.2} clearcoat={1} clearcoatRoughness={0.15} transmission={look.pattern === 'veins' ? 0.2 : 0.08} thickness={0.1} metalness={look.pattern === 'royal' ? 0.6 : 0.05} side={THREE.DoubleSide} emissive={look.pattern === 'royal' ? look.glow ?? '#000' : '#000'} emissiveIntensity={look.pattern === 'royal' ? 0.25 : 0} />
      </mesh>
      {veins && [0.03, 0.065, 0.1].map((x, i) => (
        <mesh key={i} position={[side * x * w, 0.012, -0.28 * l]} rotation={[0, side * (0.06 - i * 0.05), 0]} scale={[1, 1, l]}>
          <boxGeometry args={[0.006, 0.004, 0.52]} />
          <meshStandardMaterial color={look.accent} roughness={0.3} emissive={look.pattern === 'royal' ? look.accent : '#000'} emissiveIntensity={look.pattern === 'royal' ? 0.6 : 0} />
        </mesh>
      ))}
      {look.pattern === 'royal' && (
        <mesh position={[side * 0.06 * w, 0.014, -0.34 * l]} scale={[1, 1, l]}>
          <boxGeometry args={[0.012, 0.004, 0.62]} />
          <meshBasicMaterial color="#fff0b0" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function Plates() {
  const { look } = useLook();
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.243 + (i % 2) * 0.004, -0.02 - i * 0.1]} scale={[0.34 - i * 0.025, 0.05, 0.12]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={look.shellLight} metalness={0.75} roughness={0.3} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.165, 0.2, 0.2]} rotation={[0, 0, s * -1.1]} castShadow>
          <coneGeometry args={[0.035, 0.1, 6]} />
          <meshStandardMaterial color={look.accent} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function Bolts() {
  const { look } = useLook();
  const line = (z: number, x: number, rz: number, len = 0.12) => (
    <mesh position={[x, 0.2, z]} rotation={[0, 0, rz]}>
      <boxGeometry args={[len, 0.008, 0.012]} />
      <meshBasicMaterial color={look.accent} toneMapped={false} />
    </mesh>
  );
  return (
    <group position={[0, 0.07, 0]}>
      {line(0.0, -0.04, 0.9)}{line(-0.05, 0.03, -0.9)}{line(-0.12, -0.035, 0.9)}
      {line(-0.2, 0.03, -0.9)}{line(-0.28, -0.03, 0.9)}{line(-0.36, 0.03, -0.9)}
    </group>
  );
}

function Crown() {
  const { look } = useLook();
  return (
    <group position={[0, 0.305, 0.39]}>
      <mesh>
        <cylinderGeometry args={[0.062, 0.07, 0.03, 18]} />
        <meshStandardMaterial color={look.accent} metalness={1} roughness={0.2} emissive={look.glow ?? '#000'} emissiveIntensity={0.4} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.058, 0.04, Math.sin(a) * 0.058]}>
            <coneGeometry args={[0.014, 0.05, 6]} />
            <meshStandardMaterial color={look.accent} metalness={1} roughness={0.2} emissive={look.glow ?? '#000'} emissiveIntensity={0.5} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.02, 0.065]}>
        <sphereGeometry args={[0.014, 10, 8]} />
        <meshStandardMaterial color="#d6364a" emissive="#d6364a" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function Accessory({ kind }: { kind: string }) {
  const felt = <meshStandardMaterial color="#1c1a22" roughness={0.8} />;
  if (kind === 'bowtie') {
    return (
      <group position={[0, 0.12, 0.33]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.035, 0, 0]} rotation={[0, 0, s * Math.PI / 2]}>
            <coneGeometry args={[0.03, 0.05, 4]} />
            <meshStandardMaterial color="#c0334a" roughness={0.5} />
          </mesh>
        ))}
        <mesh><sphereGeometry args={[0.012, 10, 8]} /><meshStandardMaterial color="#8a1f33" /></mesh>
      </group>
    );
  }
  if (kind === 'headband') {
    return (
      <mesh position={[0, 0.245, 0.385]} rotation={[0.35, 0, 0]}>
        <torusGeometry args={[0.083, 0.012, 8, 28]} />
        <meshStandardMaterial color="#d8483a" roughness={0.6} />
      </mesh>
    );
  }
  if (kind === 'shades') {
    return (
      <group position={[0, 0.238, 0.47]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.062, 0, 0]}>
            <boxGeometry args={[0.058, 0.04, 0.015]} />
            <meshPhysicalMaterial color="#0a0a0e" roughness={0.05} clearcoat={1} />
          </mesh>
        ))}
        <mesh><boxGeometry args={[0.04, 0.008, 0.012]} /><meshStandardMaterial color="#0a0a0e" /></mesh>
      </group>
    );
  }
  if (kind === 'tophat') {
    return (
      <group position={[0, 0.3, 0.38]} rotation={[-0.1, 0, 0]}>
        <mesh><cylinderGeometry args={[0.1, 0.1, 0.012, 24]} />{felt}</mesh>
        <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.062, 0.066, 0.115, 24]} />{felt}</mesh>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.068, 0.068, 0.025, 24]} /><meshStandardMaterial color="#b8323e" roughness={0.6} /></mesh>
      </group>
    );
  }
  return null;
}

function Aura({ kind }: { kind: string }) {
  const cfg = { bubble: { c: '#bfe8ff', s: 7, n: 12, sp: 0.35 }, sparkle: { c: '#ffe7a0', s: 5, n: 16, sp: 0.5 }, ember: { c: '#ff9a4a', s: 5, n: 14, sp: 0.8 } }[kind];
  if (!cfg) return null;
  return <Sparkles count={cfg.n} scale={[0.9, 0.5, 1.4]} position={[0, 0.2, 0]} size={cfg.s} speed={cfg.sp} color={cfg.c} opacity={0.85} />;
}

export function RoachModel({ mutation = 'basic', cosmetics }: { mutation?: MutationId; cosmetics?: Cosmetics }) {
  const sim = useContext(RoachPoseContext);
  const r = useMemo(() => resolve(mutation, cosmetics), [mutation, cosmetics]);
  const { look } = r;
  const root = useRef<THREE.Group>(null);
  const wings = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const wingGeo = useWingGeometry();
  const segments = useMemo(() => [0, 1, 2, 3, 4, 5].map((i) => ({ z: -0.12 - i * 0.07, s: 1 - i * 0.07, dark: i % 2 === 1 })), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (wings.current) {
      const open = sim.flying ? 1 : !sim.grounded ? 0.55 : 0;
      const flap = sim.flying ? Math.sin(t * 52) * 0.55 : 0;
      wings.current.children.forEach((w, i) => {
        const s = i === 0 ? 1 : -1;
        w.rotation.z = s * (0.04 + open * (0.75 + flap));
        w.rotation.x = open * 0.12;
      });
    }
    if (body.current) {
      const moving = sim.speed > 0.15 && !sim.flying && sim.grounded;
      body.current.position.y = moving ? Math.abs(Math.sin(t * (sim.sprinting ? 30 : 17))) * 0.012 : sim.flying ? Math.sin(t * 6) * 0.015 : 0;
      body.current.rotation.z = moving ? Math.sin(t * (sim.sprinting ? 15 : 8.5)) * 0.04 : 0;
    }
    if (root.current) root.current.rotation.x = sim.grounded ? 0 : Math.max(-0.4, Math.min(0.4, -sim.velocity.y * 0.06));
  });

  const glow = !!look.glow;
  return (
    <LookContext.Provider value={r}>
      <group ref={root} scale={0.9 * look.scale}>
        <group ref={body} scale={look.body}>
          <mesh position={[0, 0.19, 0.2]} scale={[1.05, 0.5, 1.05]} castShadow>
            <sphereGeometry args={[0.19, 32, 22]} />
            <Shell color={r.shellLight} glow={glow} />
          </mesh>
          <mesh position={[0, 0.2, 0.21]} scale={[0.72, 0.36, 0.7]}>
            <sphereGeometry args={[0.19, 32, 20]} />
            <meshPhysicalMaterial color={look.accent} roughness={0.3} clearcoat={1} transparent opacity={look.pattern === 'royal' ? 0.75 : 0.45} />
          </mesh>
          <mesh position={[0, 0.2, 0.39]} scale={[0.8, 0.8, 0.9]} castShadow>
            <sphereGeometry args={[0.095, 28, 22]} />
            <Shell color={r.shell} rough={0.22} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.062, 0.235, 0.455]} scale={[0.8, 1.05, 0.7]}>
                <sphereGeometry args={[0.04, 20, 16]} />
                <meshPhysicalMaterial color={look.eye} roughness={0.05} clearcoat={1} emissive={glow ? look.eye : '#000'} emissiveIntensity={glow ? 0.6 : 0} />
              </mesh>
              <mesh position={[s * 0.058, 0.25, 0.478]}>
                <sphereGeometry args={[0.012, 10, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[s * 0.035, 0.17, 0.46]} rotation={[0.5, 0, s * 0.3]}>
                <capsuleGeometry args={[0.014, 0.05, 4, 8]} />
                <meshStandardMaterial color={look.leg} roughness={0.5} />
              </mesh>
            </group>
          ))}
          {segments.map((seg, i) => (
            <mesh key={i} position={[0, 0.15 - i * 0.004, seg.z + 0.02]} scale={[seg.s * 0.95, 0.42, 0.55]} castShadow>
              <sphereGeometry args={[0.2, 22, 14]} />
              <Shell color={seg.dark ? r.shell : new THREE.Color(r.shell).lerp(new THREE.Color(r.shellLight), 0.35).getStyle()} rough={0.32} glow={glow && seg.dark} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.035, 0.12, -0.5]} rotation={[-1.45, 0, s * 0.35]}>
              <coneGeometry args={[0.014, 0.12, 6]} />
              <meshStandardMaterial color={look.leg} roughness={0.5} />
            </mesh>
          ))}
          {look.plates && <Plates />}
          {look.pattern === 'bolts' && <Bolts />}
          <group ref={wings} position={[0, 0.272, 0.3]}>
            <Wing side={1} geo={wingGeo} />
            <Wing side={-1} geo={wingGeo} />
          </group>
          {([-1, 1] as const).flatMap((s) => [0, 1, 2].map((i) => <Leg key={`${s}${i}`} side={s} index={i} />))}
          <Antenna side={-1} />
          <Antenna side={1} />
          {look.crown && r.accessory !== 'tophat' && <Crown />}
          {r.accessory && <Accessory kind={r.accessory} />}
        </group>
        {r.fx && <Aura kind={r.fx} />}
        {look.glow && mutation === 'shadow' && <Aura kind="sparkle" />}
      </group>
    </LookContext.Provider>
  );
}

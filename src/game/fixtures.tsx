import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

export const Ceramic = ({ color = '#f6f4ee' }: { color?: string }) => (
  <meshPhysicalMaterial color={color} roughness={0.12} clearcoat={1} clearcoatRoughness={0.06} sheen={0.2} />
);
export const Chrome = () => <meshStandardMaterial color="#e8edf0" metalness={1} roughness={0.12} envMapIntensity={1.4} />;
export const Plastic = ({ color, rough = 0.35 }: { color: string; rough?: number }) => (
  <meshPhysicalMaterial color={color} roughness={rough} clearcoat={0.6} clearcoatRoughness={0.2} />
);
export const Cloth = ({ color }: { color: string }) => (
  <meshPhysicalMaterial color={color} roughness={0.95} sheen={1} sheenRoughness={0.6} sheenColor="#ffffff" />
);
export const Wood = ({ color = '#b98a5a' }: { color?: string }) => (
  <meshPhysicalMaterial color={color} roughness={0.55} clearcoat={0.25} clearcoatRoughness={0.4} />
);

function lathe(points: [number, number][], segments = 40) {
  const g = new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
  g.computeVertexNormals();
  return g;
}

export function Toilet({ position }: { position: V3 }) {
  const bowl = useMemo(() => lathe([[0.001, 0], [0.55, 0.02], [0.78, 0.3], [0.86, 0.7], [0.84, 0.95], [0.72, 1.12], [0.62, 1.12], [0.001, 0.4]]), []);
  const rim = useMemo(() => new THREE.TorusGeometry(0.72, 0.14, 20, 48), []);
  return (
    <group position={position}>
      <mesh geometry={bowl} position={[0, 0.0, 0.2]} scale={[0.95, 1, 1.28]} castShadow receiveShadow>
        <Ceramic />
      </mesh>
      <mesh position={[0, 0.35, -0.4]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.62, 0.7, 28]} />
        <Ceramic />
      </mesh>
      <mesh geometry={rim} position={[0, 1.2, 0.2]} rotation={[Math.PI / 2, 0, 0]} scale={[0.95, 1.28, 0.55]} castShadow>
        <Plastic color="#fbfaf6" rough={0.2} />
      </mesh>
      <mesh position={[0, 1.2, 0.2]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.95, 1.28, 1]}>
        <circleGeometry args={[0.6, 40]} />
        <meshPhysicalMaterial color="#9fb7bd" roughness={0.05} clearcoat={1} />
      </mesh>
      <RoundedBox args={[1.5, 1.35, 0.7]} radius={0.12} smoothness={5} position={[0, 1.9, -0.82]} castShadow receiveShadow>
        <Ceramic />
      </RoundedBox>
      <RoundedBox args={[1.58, 0.12, 0.78]} radius={0.05} smoothness={4} position={[0, 2.62, -0.82]} castShadow>
        <Ceramic />
      </RoundedBox>
      <mesh position={[0.45, 2.72, -0.82]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.06, 20]} />
        <Chrome />
      </mesh>
      <mesh position={[-0.2, 2.72, -0.82]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 20]} />
        <Chrome />
      </mesh>
    </group>
  );
}

export function Vanity({ position, width = 3.8, depth = 1.9 }: { position: V3; width?: number; depth?: number }) {
  const legH = 1.0;
  const body = 1.5;
  const topY = legH + body;
  return (
    <group position={position}>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (width / 2 - 0.14), legH / 2, sz * (depth / 2 - 0.14)]} castShadow>
          <cylinderGeometry args={[0.07, 0.05, legH, 14]} />
          <meshStandardMaterial color="#c9a46a" metalness={0.7} roughness={0.3} />
        </mesh>
      )))}
      <RoundedBox args={[width, 0.08, depth - 0.1]} radius={0.03} position={[0, legH + 0.04, 0]} receiveShadow>
        <Wood color="#c8b08a" />
      </RoundedBox>
      <RoundedBox args={[width, body, depth]} radius={0.08} smoothness={4} position={[0, legH + body / 2 + 0.08, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#e8dcc6" roughness={0.45} clearcoat={0.5} clearcoatRoughness={0.3} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <group key={s}>
          <RoundedBox args={[width / 2 - 0.2, body - 0.3, 0.06]} radius={0.03} position={[s * (width / 4), legH + body / 2 + 0.08, depth / 2 + 0.01]} castShadow>
            <meshPhysicalMaterial color="#d8c7a8" roughness={0.4} clearcoat={0.55} />
          </RoundedBox>
          <mesh position={[s * (width / 4 - s * 0.45), legH + body / 2 + 0.45, depth / 2 + 0.12]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.035, 0.45, 6, 12]} />
            <Chrome />
          </mesh>
        </group>
      ))}
      <RoundedBox args={[width + 0.18, 0.2, depth + 0.16]} radius={0.05} smoothness={4} position={[0, topY + 0.18, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f1eee8" roughness={0.18} clearcoat={0.9} clearcoatRoughness={0.1} />
      </RoundedBox>
      <group position={[0, topY + 0.29, 0.05]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1.2, 0.9, 1]}>
          <circleGeometry args={[0.78, 40]} />
          <Ceramic />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} scale={[1.2, 0.9, 1]}>
          <ringGeometry args={[0.62, 0.78, 40]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.08} clearcoat={1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} scale={[1.2, 0.9, 1]}>
          <circleGeometry args={[0.58, 40]} />
          <meshPhysicalMaterial color="#dfe9ec" roughness={0.1} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.012, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.05, 0.1, 20]} />
          <Chrome />
        </mesh>
        <Faucet position={[0, 0, -0.78]} />
      </group>
    </group>
  );
}

function Faucet({ position }: { position: V3 }) {
  const spout = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0, 0.82, 0.18), new THREE.Vector3(0, 0.78, 0.5), new THREE.Vector3(0, 0.62, 0.55)]);
    return new THREE.TubeGeometry(c, 30, 0.07, 14, false);
  }, []);
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.12, 24]} />
        <Chrome />
      </mesh>
      <mesh geometry={spout} castShadow>
        <Chrome />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.5, 0.2, 0.1]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.4, 16]} />
          <Chrome />
        </mesh>
      ))}
    </group>
  );
}

export function Mirror({ position, w = 3.4, h = 2.7 }: { position: V3; w?: number; h?: number }) {
  return (
    <group position={position}>
      <RoundedBox args={[w + 0.24, h + 0.24, 0.1]} radius={0.06} smoothness={4} castShadow>
        <meshStandardMaterial color="#d6b777" metalness={0.9} roughness={0.25} />
      </RoundedBox>
      <RoundedBox args={[w, h, 0.04]} radius={0.04} smoothness={4} position={[0, 0, 0.06]}>
        <meshStandardMaterial color="#d4e7ec" metalness={1} roughness={0.035} envMapIntensity={1.6} />
      </RoundedBox>
      <mesh position={[0, h / 2 + 0.55, 0.12]}>
        <boxGeometry args={[w * 0.8, 0.09, 0.09]} />
        <meshStandardMaterial color="#fff2cf" emissive="#ffe2a0" emissiveIntensity={2.2} />
      </mesh>
    </group>
  );
}

export function roundedRect(w: number, l: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -l / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + l - r);
  s.quadraticCurveTo(x + w, y + l, x + w - r, y + l);
  s.lineTo(x + r, y + l);
  s.quadraticCurveTo(x, y + l, x, y + l - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export function Bathtub({ position, rotationY = 0, length = 5.2, width = 2.3, height = 1.7 }: { position: V3; rotationY?: number; length?: number; width?: number; height?: number }) {
  const wallGeo = useMemo(() => {
    const shape = roundedRect(width, length, 0.55);
    shape.holes.push(roundedRect(width - 0.6, length - 0.6, 0.4));
    const g = new THREE.ExtrudeGeometry(shape, { depth: height - 0.5, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4, curveSegments: 24 });
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }, [width, length, height]);
  const baseGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRect(width - 0.1, length - 0.1, 0.5), { depth: 0.55, bevelEnabled: false, curveSegments: 24 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, [width, length]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={baseGeo} castShadow receiveShadow>
        <Ceramic />
      </mesh>
      <mesh geometry={wallGeo} position={[0, 0.5, 0]} castShadow receiveShadow>
        <Ceramic />
      </mesh>
      <mesh position={[0, 0.62, length / 2 - 0.65]}>
        <cylinderGeometry args={[0.11, 0.11, 0.03, 18]} />
        <Chrome />
      </mesh>
      <mesh position={[0, height + 0.9, -length / 2 + 0.1]}>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
        <Chrome />
      </mesh>
      <group position={[0, height, length / 2 - 0.12]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 0.2, 18]} />
          <Chrome />
        </mesh>
        <mesh position={[0, 0.5, 0.15]} rotation={[0.6, 0, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.7, 6, 14]} />
          <Chrome />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.55, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 0.26, 16]} />
            <Chrome />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function ShowerGlass({ position, h = 4.8, w = 2.8 }: { position: V3; h?: number; w?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[0.04, h, w]} />
        <meshPhysicalMaterial color="#cfe9ee" roughness={0.04} transmission={0.9} thickness={0.2} ior={1.45} transparent opacity={0.28} />
      </mesh>
      <mesh position={[0, h, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, w + 0.1]} />
        <Chrome />
      </mesh>
      <mesh position={[0, h / 2, -w / 2]} castShadow>
        <boxGeometry args={[0.1, h, 0.08]} />
        <Chrome />
      </mesh>
      <mesh position={[-0.12, h * 0.55, w / 2 - 0.35]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.04, 0.9, 6, 12]} />
        <Chrome />
      </mesh>
    </group>
  );
}

export function ShowerHead({ position }: { position: V3 }) {
  const arm = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.35, 0.05, 0), new THREE.Vector3(-0.85, 0.2, 0)]);
    return new THREE.TubeGeometry(c, 16, 0.05, 10, false);
  }, []);
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 18]} />
        <Chrome />
      </mesh>
      <mesh geometry={arm} castShadow>
        <Chrome />
      </mesh>
      <mesh position={[-0.9, 0.12, 0]} rotation={[0, 0, 0.4]} castShadow>
        <cylinderGeometry args={[0.36, 0.3, 0.1, 28]} />
        <Chrome />
      </mesh>
    </group>
  );
}

export function TowelRack({ position }: { position: V3 }) {
  const towels: { y: number; c: string; w: number }[] = [
    { y: 5.15, c: '#4fa7a1', w: 1.9 },
    { y: 4.15, c: '#f2e6d4', w: 1.8 },
    { y: 3.2, c: '#e58a9b', w: 1.7 },
  ];
  return (
    <group position={position}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.05, 4.1, 0.08]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 3.7, 12]} />
          <meshStandardMaterial color="#6b5a46" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      {towels.map((t) => (
        <group key={t.y} position={[0, t.y, 0.1]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 2.2, 12]} />
            <meshStandardMaterial color="#6b5a46" metalness={0.8} roughness={0.35} />
          </mesh>
          <RoundedBox args={[t.w, 0.85, 0.07]} radius={0.03} position={[0, -0.34, 0.07]} castShadow>
            <Cloth color={t.c} />
          </RoundedBox>
          <RoundedBox args={[t.w, 0.85, 0.07]} radius={0.03} position={[0, -0.34, -0.07]} castShadow>
            <Cloth color={t.c} />
          </RoundedBox>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, t.w, 16]} />
            <Cloth color={t.c} />
          </mesh>
          <mesh position={[0, -0.7, 0.115]}>
            <boxGeometry args={[t.w, 0.06, 0.012]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Bottle({ position, color, cap = '#ffffff', h = 1.0, r = 0.18, pump = false, label = '#ffffff' }: { position: V3; color: string; cap?: string; h?: number; r?: number; pump?: boolean; label?: string }) {
  const body = useMemo(() => lathe([[0.001, 0], [r, 0.01], [r * 1.05, h * 0.12], [r * 1.05, h * 0.78], [r * 0.7, h * 0.9], [r * 0.34, h * 0.94], [r * 0.34, h], [0.001, h]], 28), [h, r]);
  return (
    <group position={position}>
      <mesh geometry={body} castShadow>
        <meshPhysicalMaterial color={color} roughness={0.15} clearcoat={1} transmission={0.15} thickness={0.1} />
      </mesh>
      <mesh position={[0, h * 0.45, 0]} castShadow>
        <cylinderGeometry args={[r * 1.06, r * 1.06, h * 0.32, 28, 1, true]} />
        <meshStandardMaterial color={label} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, h + 0.05, 0]} castShadow>
        <cylinderGeometry args={[r * 0.42, r * 0.42, 0.14, 18]} />
        <Plastic color={cap} />
      </mesh>
      {pump && (
        <>
          <mesh position={[0, h + 0.2, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.25, 10]} />
            <Plastic color={cap} />
          </mesh>
          <mesh position={[r * 0.4, h + 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.04, r * 0.9, 4, 10]} />
            <Plastic color={cap} />
          </mesh>
        </>
      )}
    </group>
  );
}

export function ToothbrushHolder({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.2, 0.6, 24, 1, true]} />
        <meshPhysicalMaterial color="#9bd1cb" roughness={0.12} clearcoat={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 24]} />
        <Plastic color="#9bd1cb" />
      </mesh>
      {[{ c: '#e8607a', r: 0.18 }, { c: '#4a8fd6', r: -0.12 }].map((b) => (
        <group key={b.c} rotation={[0, 0, b.r]} position={[b.r * 0.4, 0, 0]}>
          <mesh position={[0, 0.62, 0]} castShadow>
            <capsuleGeometry args={[0.028, 0.9, 6, 10]} />
            <Plastic color={b.c} />
          </mesh>
          <mesh position={[0, 1.15, 0.02]}>
            <boxGeometry args={[0.09, 0.2, 0.06]} />
            <Plastic color="#f8f8f8" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function PaperHolder({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0.15]} castShadow>
        <boxGeometry args={[0.1, 0.5, 0.3]} />
        <Chrome />
      </mesh>
      <mesh position={[0, 0.02, 0.34]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.75, 12]} />
        <Chrome />
      </mesh>
      <mesh position={[0, 0.02, 0.34]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.55, 28]} />
        <meshPhysicalMaterial color="#fbf8f0" roughness={0.9} sheen={1} />
      </mesh>
      <mesh position={[0, -0.18, 0.62]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.52, 0.36, 0.015]} />
        <meshStandardMaterial color="#fbf8f0" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Shelf({ position, w = 2.2, d = 0.7 }: { position: V3; w?: number; d?: number }) {
  return (
    <group position={position}>
      <RoundedBox args={[w, 0.12, d]} radius={0.03} castShadow receiveShadow>
        <Wood color="#c79a67" />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.2), -0.28, -d / 2 + 0.05]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 0.42, 0.07]} />
          <Chrome />
        </mesh>
      ))}
    </group>
  );
}

export function StorageCabinet({ position, w = 2.6, d = 1.5, h = 5.8 }: { position: V3; w?: number; d?: number; h?: number }) {
  return (
    <group position={position}>
      <RoundedBox args={[d, h, w]} radius={0.07} smoothness={4} position={[0, h / 2, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#eae0cc" roughness={0.45} clearcoat={0.45} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <group key={s}>
          <RoundedBox args={[0.06, h * 0.46, w / 2 - 0.12]} radius={0.025} position={[d / 2 + 0.01, h * 0.28, s * (w / 4)]} castShadow>
            <meshPhysicalMaterial color="#d9c9a7" roughness={0.4} clearcoat={0.55} />
          </RoundedBox>
          <RoundedBox args={[0.06, h * 0.4, w / 2 - 0.12]} radius={0.025} position={[d / 2 + 0.01, h * 0.76, s * (w / 4)]} castShadow>
            <meshPhysicalMaterial color="#d9c9a7" roughness={0.4} clearcoat={0.55} />
          </RoundedBox>
          {[0.28, 0.76].map((f) => (
            <mesh key={f} position={[d / 2 + 0.12, h * f + (f > 0.5 ? -0.3 : 0.4), s * 0.22]} castShadow>
              <sphereGeometry args={[0.08, 14, 12]} />
              <Chrome />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function Hamper({ position }: { position: V3 }) {
  const clothes: { p: V3; c: string; s: V3 }[] = [
    { p: [0.1, 2.3, 0], c: '#e07a8a', s: [0.7, 0.35, 0.6] },
    { p: [-0.25, 2.35, 0.2], c: '#5aa6c9', s: [0.55, 0.3, 0.5] },
    { p: [0.3, 2.28, -0.3], c: '#f1e3b8', s: [0.5, 0.28, 0.45] },
  ];
  return (
    <group position={position}>
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 0.8, 2.3, 36, 1, true]} />
        <meshPhysicalMaterial color="#c9a57a" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.06, 28]} />
        <meshStandardMaterial color="#a9865c" roughness={0.9} />
      </mesh>
      {[0.25, 0.9, 1.55, 2.2].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1]}>
          <torusGeometry args={[0.8 + y * 0.07, 0.045, 10, 40]} />
          <meshStandardMaterial color="#8d6a43" roughness={0.8} />
        </mesh>
      ))}
      {clothes.map((c, i) => (
        <mesh key={i} position={c.p} scale={c.s} castShadow>
          <sphereGeometry args={[1, 20, 16]} />
          <Cloth color={c.c} />
        </mesh>
      ))}
    </group>
  );
}

export function ClothesPile({ position }: { position: V3 }) {
  const items: { p: V3; c: string; s: V3; r: number }[] = [
    { p: [0, 0.32, 0], c: '#5f8ec9', s: [1.2, 0.34, 0.9], r: 0.2 },
    { p: [0.45, 0.55, 0.15], c: '#e9d7a8', s: [0.9, 0.3, 0.7], r: -0.4 },
    { p: [-0.35, 0.6, -0.1], c: '#d9708a', s: [0.8, 0.28, 0.65], r: 0.9 },
    { p: [0.1, 0.8, 0.0], c: '#8fc29b', s: [0.6, 0.25, 0.5], r: 0.3 },
  ];
  return (
    <group position={position}>
      {items.map((it, i) => (
        <mesh key={i} position={it.p} rotation={[0, it.r, 0]} scale={it.s} castShadow receiveShadow>
          <sphereGeometry args={[1, 24, 18]} />
          <Cloth color={it.c} />
        </mesh>
      ))}
      <mesh position={[0.95, 0.12, 0.5]} rotation={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.9, 6, 12]} />
        <Cloth color="#5f8ec9" />
      </mesh>
    </group>
  );
}

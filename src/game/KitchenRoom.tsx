import { Suspense, useEffect } from 'react';
import { Prop } from './Bathroom';
import { Chrome } from './fixtures';
import { Block, Fan, Frame, Pot, Steam, type Ob, type V3 } from './props';
import { Architecture, ExitDoor, Lighting, WallWindow, type ShellStyle } from './Shell';
import { setHideZones, setObstacles, setRoom } from './sim';
import { Surface } from './surfaces';
import { DIMS } from './world';

export const KITCHEN_STYLE: ShellStyle = {
  floorTex: 'terracotta_floor_tiles', floorSpan: 3.2, floorTint: '#f1dcc0',
  wallTex: 'square_tiled_wall', wallSpan: 5, wallTint: '#fff4de',
  wainscot: 3.1, upper: '#f2e2bf', trim: '#fbf5e6', ceiling: '#fbf3e0', accent: '#d99a5b',
  fog: '#f2e2c4', dark: false, lampColor: '#ffe7b8',
};

export const kitchenObstacles: Ob[] = [
  [-3.2, 1.45, -4.85, 6.2, 2.9, 1.3],
  [2.0, 1.45, -4.85, 2.0, 2.9, 1.3],
  [4.0, 3.2, -5.1, 2.4, 6.4, 1.8],
  [5.7, 1.5, 0.3, 1.5, 3.0, 2.6],
  [-5.9, 0.6, -1.0, 1.0, 1.2, 1.4],
  [5.6, 0.75, 3.6, 1.8, 1.5, 1.8],
  [-2.2, 0.4, 4.9, 0.5, 0.8, 0.5],
];

export const kitchenHide: Ob[] = [
  [-5.9, 0.4, -1.0, 1.0, 0.8, 1.3],
  [5.6, 0.4, 3.6, 1.7, 0.8, 1.7],
];

function Counters() {
  return (
    <group>
      <Block p={[-3.2, 1.45, -4.85]} s={[6.2, 2.9, 1.3]} c="#e8d6b4" rough={0.5} clear={0.4} />
      <Block p={[-3.2, 3.0, -4.85]} s={[6.3, 0.2, 1.4]} c="#6f6a66" rough={0.3} clear={0.7} />
      <Block p={[2.0, 1.45, -4.85]} s={[2.0, 2.9, 1.3]} c="#e8d6b4" rough={0.5} clear={0.4} />
      <Block p={[2.0, 3.0, -4.85]} s={[2.1, 0.2, 1.4]} c="#6f6a66" rough={0.3} clear={0.7} />
      {[-5.4, -4.0, -2.6, -1.2, 0.2, 1.6, 2.4].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 1.6, -4.18]} castShadow><boxGeometry args={[1.25, 2.3, 0.05]} /><meshPhysicalMaterial color={i % 2 ? '#dcc79d' : '#e2cfa8'} roughness={0.45} clearcoat={0.3} /></mesh>
          <mesh position={[x + 0.4, 2.2, -4.12]}><sphereGeometry args={[0.05, 10, 8]} /><Chrome /></mesh>
        </group>
      ))}
      {[-5.0, -1.5].map((x) => (
        <Block key={x} p={[x, 5.6, -5.2]} s={[3.0, 1.6, 0.9]} c="#d9c28f" rough={0.5} clear={0.3} />
      ))}
      <group position={[-3.4, 3.1, -4.85]}>
        <mesh position={[0, 0.02, 0]} castShadow><boxGeometry args={[1.7, 0.08, 1.0]} /><Chrome /></mesh>
        <mesh position={[0, -0.01, 0]}><boxGeometry args={[1.5, 0.1, 0.8]} /><meshStandardMaterial color="#9aa3a8" metalness={0.8} roughness={0.35} /></mesh>
        <mesh position={[0, 0.5, -0.4]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.9, 10]} /><Chrome /></mesh>
        <mesh position={[0, 0.95, -0.15]} rotation={[0.8, 0, 0]}><cylinderGeometry args={[0.04, 0.04, 0.5, 10]} /><Chrome /></mesh>
        <mesh position={[1.6, 0.06, 0.1]} rotation={[0, 0.4, 0]} castShadow><boxGeometry args={[0.9, 0.06, 0.6]} /><meshStandardMaterial color="#b98a5a" roughness={0.6} /></mesh>
        <mesh position={[1.6, 0.14, 0.1]} rotation={[0, 0.4, 0]}><boxGeometry args={[0.5, 0.1, 0.18]} /><meshStandardMaterial color="#e24a3a" roughness={0.6} /></mesh>
      </group>
      <group position={[0.2, 3.1, -4.85]}>
        {[[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.03, z]}><cylinderGeometry args={[0.28, 0.28, 0.04, 24]} /><meshStandardMaterial color="#1c1c1e" roughness={0.4} /></mesh>
        ))}
        <Pot position={[-0.5, 0.05, -0.3]} s={1.3} />
        <Steam position={[-0.5, 0.5, -0.3]} />
        <Pot position={[0.5, 0.05, 0.3]} color="#b0453a" s={1.0} />
      </group>
      <mesh position={[0.2, 4.8, -5.3]} castShadow><boxGeometry args={[2.1, 0.9, 0.7]} /><meshStandardMaterial color="#c9ccd0" metalness={0.8} roughness={0.35} /></mesh>
    </group>
  );
}

function Fridge() {
  return (
    <group position={[4.0, 0, -5.1]}>
      <Block p={[0, 3.2, 0]} s={[2.4, 6.4, 1.8]} c="#e6ebee" rough={0.25} clear={0.7} r={0.1} />
      <mesh position={[0, 4.4, 0.92]}><boxGeometry args={[2.2, 0.04, 0.02]} /><meshStandardMaterial color="#9aa3a8" /></mesh>
      {[1.3, 5.2].map((y) => <mesh key={y} position={[0.85, y, 1.0]} castShadow><boxGeometry args={[0.08, 1.4, 0.1]} /><Chrome /></mesh>)}
      {[['#d9534f', -0.5, 5.2], ['#5cb85c', 0.2, 5.5], ['#f0ad4e', -0.1, 4.9]].map(([c, x, y], i) => (
        <mesh key={i} position={[x as number, y as number, 0.93]} rotation={[0, 0, i * 0.3]}><boxGeometry args={[0.45, 0.35, 0.02]} /><meshStandardMaterial color={c as string} roughness={0.7} /></mesh>
      ))}
    </group>
  );
}

function DiningSet() {
  return (
    <group position={[5.6, 0, 3.6]}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow><cylinderGeometry args={[0.95, 0.95, 0.12, 36]} /><meshPhysicalMaterial color="#b98a5a" roughness={0.5} clearcoat={0.3} /></mesh>
      <mesh position={[0, 0.75, 0]} castShadow><cylinderGeometry args={[0.1, 0.18, 1.5, 12]} /><meshPhysicalMaterial color="#8a5f3a" roughness={0.5} /></mesh>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.6, 0.6, 0.06, 24]} /><meshPhysicalMaterial color="#8a5f3a" /></mesh>
      <mesh position={[0, 1.58, 0]}><cylinderGeometry args={[0.55, 0.55, 0.02, 30]} /><meshStandardMaterial color="#f7f3ea" roughness={0.9} /></mesh>
      <mesh position={[0.1, 1.68, 0.1]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.06, 28]} /><meshPhysicalMaterial color="#fafafa" roughness={0.15} clearcoat={1} /></mesh>
      <mesh position={[0.1, 1.78, 0.1]} castShadow><sphereGeometry args={[0.2, 20, 12]} /><meshPhysicalMaterial color="#e8786a" roughness={0.4} clearcoat={0.6} /></mesh>
      <mesh position={[-0.5, 1.7, -0.3]} castShadow><cylinderGeometry args={[0.1, 0.08, 0.2, 14]} /><meshPhysicalMaterial color="#6fb0c8" roughness={0.2} clearcoat={1} transparent opacity={0.8} /></mesh>
      <Block p={[-1.4, 0.8, 0]} s={[0.9, 0.1, 0.9]} c="#a87c4a" r={0.02} />
      <Block p={[-1.4, 1.5, 0.35]} s={[0.9, 1.4, 0.1]} c="#a87c4a" r={0.02} />
      {[[-1.7, -0.3], [-1.1, -0.3], [-1.7, 0.3], [-1.1, 0.3]].map(([x, z], i) => <mesh key={i} position={[x, 0.4, z]}><boxGeometry args={[0.08, 0.8, 0.08]} /><meshStandardMaterial color="#8a5f3a" /></mesh>)}
    </group>
  );
}

function KitchenSet() {
  return (
    <group>
      <Counters />
      <Fridge />
      <Block p={[5.7, 1.5, 0.3]} s={[1.5, 3.0, 2.6]} c="#d6c3a0" rough={0.5}>
        <mesh position={[-0.76, 0.3, 0]}><boxGeometry args={[0.04, 1.2, 2.2]} /><meshStandardMaterial color="#c4ae88" /></mesh>
      </Block>
      <Block p={[5.7, 3.1, 0.3]} s={[1.6, 0.2, 2.7]} c="#6f6a66" rough={0.3} clear={0.7} />
      <DiningSet />
      <Block p={[-5.9, 0.6, -1.0]} s={[1.0, 1.2, 1.4]} c="#c9a063" rough={0.6} />
      <Prop name="wicker_basket_01" position={[-5.9, 1.2, -1.0]} scale={1.3} />
      <Prop name="potted_plant_01" position={[5.7, 3.2, -0.4]} scale={0.9} />
      <Prop name="all_purpose_cleaner" position={[-5.6, 3.1, -4.85]} scale={2.4} rotation={[0, 0.3, 0]} />
      <Prop name="bleach_bottle" position={[-2.2, 0, 4.9]} scale={2.6} rotation={[0, 0.8, 0]} />
      <Surface tex="terry_cloth" w={2.4} h={1.1} span={1.6} position={[-3.2, 0.014, -3.5]} rotation={[-Math.PI / 2, 0, 0]} tint="#d97b6a" gloss={0} />
      <Surface tex="terry_cloth" w={2.0} h={3.2} span={1.6} position={[0.2, 0.014, 0.8]} rotation={[-Math.PI / 2, 0, 0]} tint="#e8d6a8" gloss={0} />
      <Fan position={[0.6, 7.4, 0.6]} />
      <Frame position={[-1.0, 5.2, -5.4]} w={1.4} h={1.0} art="#8fb28a" />
      <mesh position={[-6.4, 5.0, -3.2]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.55, 28]} />
        <meshStandardMaterial color="#fbf7ee" roughness={0.4} />
      </mesh>
      <mesh position={[-6.38, 5.0, -3.2]} rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[0.5, 0.55, 28]} />
        <meshStandardMaterial color="#6b5a4a" />
      </mesh>
    </group>
  );
}

export function KitchenRoom({ exitUnlocked }: { exitUnlocked: boolean }) {
  const dims = DIMS.kitchen;
  setRoom(dims.halfX, dims.halfZ, dims.height);
  useEffect(() => {
    setObstacles(kitchenObstacles);
    setHideZones(kitchenHide);
  }, []);
  return (
    <group>
      <Lighting style={KITCHEN_STYLE} dims={dims} />
      <Architecture dims={dims} style={KITCHEN_STYLE} />
      <WallWindow position={[-3.4, 4.6, -5.46]} w={2.2} h={1.6} />
      <WallWindow position={[6.46, 5.0, 3.6]} rotation={[0, -Math.PI / 2, 0]} w={2.0} h={1.4} />
      <ExitDoor dims={dims} active={exitUnlocked} color={KITCHEN_STYLE.accent} />
      <Suspense fallback={null}>
        <KitchenSet />
      </Suspense>
    </group>
  );
}

export type { V3 };

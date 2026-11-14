import { Clone, RoundedBox, useGLTF } from '@react-three/drei';
import { Bathtub, Bottle, Cloth, ClothesPile, Hamper, Mirror, PaperHolder, Shelf, ShowerGlass, ShowerHead, StorageCabinet, Toilet, TowelRack, ToothbrushHolder, Vanity } from './fixtures';

type Box = [number, number, number, number, number, number];

const TUB = { x: 5.3, z: -0.5, len: 5.2, wid: 2.3, h: 1.7 };

export const bathroomObstacles: Box[] = [
  [-2.4, 1.95, -4.5, 3.8, 1.9, 1.9],
  [2.6, 1.35, -4.15, 1.7, 2.7, 2.5],
  [TUB.x, 0.25, TUB.z, TUB.wid, 0.5, TUB.len],
  [TUB.x - TUB.wid / 2 + 0.15, TUB.h / 2, TUB.z, 0.3, TUB.h, TUB.len],
  [TUB.x + TUB.wid / 2 - 0.15, TUB.h / 2, TUB.z, 0.3, TUB.h, TUB.len],
  [TUB.x, TUB.h / 2, TUB.z - TUB.len / 2 + 0.15, TUB.wid, TUB.h, 0.3],
  [TUB.x, TUB.h / 2, TUB.z + TUB.len / 2 - 0.15, TUB.wid, TUB.h, 0.3],
  [5.85, 2.4, 2.45, 1.3, 4.8, 0.12],
  [-5.7, 2.9, -3.6, 1.5, 5.8, 2.6],
  [4.9, 1.15, 4.4, 1.8, 2.3, 1.8],
  [-4.9, 0.55, 3.8, 1.6, 1.1, 1.4],
  [0.9, 0.06, 0.2, 3.4, 0.12, 2.2],
  [-2.4, 0.06, -2.5, 2.4, 0.12, 1.3],
];

export const bathroomHide: Box[] = [
  [-2.4, 0.5, -4.5, 3.4, 1.0, 1.8],
  [-4.9, 0.6, 3.8, 1.9, 1.3, 1.7],
];

export const bathroomFood: [number, number, number][] = [
  [-3.7, 2.95, -4.3],
  [-2.4, 0.15, -4.4],
  [4.6, 1.85, 0.4],
  [1.4, 0.22, 0.1],
  [1.3, 0.12, -3.2],
  [-4.9, 1.2, 3.8],
];

function Prop({ name, position, scale, rotation = [0, 0, 0] }: { name: string; position: [number, number, number]; scale: number; rotation?: [number, number, number] }) {
  const gltf = useGLTF(`/assets/models/${name}/${name}.gltf`);
  return <Clone object={gltf.scene} position={position} scale={scale} rotation={rotation} castShadow receiveShadow />;
}

export function BathroomSet() {
  return (
    <group>
      <Vanity position={[-2.4, 0, -4.5]} />
      <Mirror position={[-2.4, 4.75, -5.38]} />
      <Bottle position={[-3.8, 2.78, -4.75]} color="#f08a6a" cap="#ffffff" h={0.62} r={0.15} pump label="#fff7ef" />
      <ToothbrushHolder position={[-0.95, 2.78, -4.85]} />
      <Prop name="rubber_duck_toy" position={[-1.7, 2.78, -3.95]} scale={1.3} rotation={[0, 0.7, 0]} />

      <Toilet position={[2.6, 0, -4.2]} />
      <PaperHolder position={[4.2, 2.1, -5.38]} />
      <Shelf position={[2.6, 4.9, -5.13]} />
      <Prop name="potted_plant_01" position={[3.2, 4.96, -5.1]} scale={0.7} />
      <Bottle position={[1.9, 4.96, -5.1]} color="#6aa6d6" h={0.7} r={0.13} label="#f2f7ff" />
      <Prop name="wicker_basket_01" position={[2.4, 4.96, -5.0]} scale={1.1} />

      <Bathtub position={[TUB.x, 0, TUB.z]} length={TUB.len} width={TUB.wid} height={TUB.h} />
      <ShowerHead position={[6.4, 5.4, -1.6]} />
      <group position={[5.85, 0, 2.45]} rotation={[0, Math.PI / 2, 0]}>
        <ShowerGlass position={[0, 0, 0]} w={1.3} h={4.8} />
      </group>
      <Bottle position={[6.15, 1.7, -2.0]} color="#8fd1b5" h={0.8} r={0.15} cap="#2f8f78" label="#e9fff4" />
      <Bottle position={[6.15, 1.7, -1.55]} color="#e8a0c8" h={0.75} r={0.14} cap="#b4568a" label="#fff0f8" />
      <Bottle position={[6.15, 1.7, -1.15]} color="#f3e2a0" h={0.62} r={0.13} cap="#c9a13f" pump label="#fff9e0" />
      <Prop name="rubber_duck_toy" position={[5.3, 0.5, 0.9]} scale={1.6} rotation={[0, 2.4, 0]} />

      <group position={[6.38, 0, -4.35]} rotation={[0, -Math.PI / 2, 0]}>
        <TowelRack position={[0, 0, 0]} />
      </group>

      <StorageCabinet position={[-5.7, 0, -3.6]} />
      <Prop name="wicker_basket_01" position={[-5.7, 5.8, -3.6]} scale={1.6} />

      <Hamper position={[4.9, 0, 4.4]} />
      <ClothesPile position={[-4.9, 0, 3.8]} />

      <RoundedBox args={[3.4, 0.12, 2.2]} radius={0.05} smoothness={4} position={[0.9, 0.06, 0.2]} receiveShadow castShadow>
        <Cloth color="#5fb0a8" />
      </RoundedBox>
      <RoundedBox args={[3.0, 0.02, 1.8]} radius={0.01} position={[0.9, 0.125, 0.2]}>
        <Cloth color="#cfeee9" />
      </RoundedBox>
      <RoundedBox args={[2.4, 0.12, 1.3]} radius={0.05} smoothness={4} position={[-2.4, 0.06, -2.5]} receiveShadow castShadow>
        <Cloth color="#f1d9a8" />
      </RoundedBox>

      <Prop name="plunger" position={[1.45, 0, -2.85]} scale={3.2} />
      <Prop name="multi_cleaner_bottle" position={[3.9, 0, -5.05]} scale={3.4} rotation={[0, 0.5, 0]} />
      <Prop name="bleach_bottle" position={[-0.25, 0, -3.2]} scale={3.0} rotation={[0, -0.4, 0]} />
    </group>
  );
}

['rubber_duck_toy', 'potted_plant_01', 'wicker_basket_01', 'plunger', 'multi_cleaner_bottle', 'bleach_bottle'].forEach((n) => useGLTF.preload(`/assets/models/${n}/${n}.gltf`));

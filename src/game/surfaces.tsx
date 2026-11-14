import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const base = '/assets/textures';

export function usePbr(id: string, repeatX: number, repeatY: number) {
  const [map, normalMap, arm] = useTexture([`${base}/${id}/Diffuse.jpg`, `${base}/${id}/nor_gl.jpg`, `${base}/${id}/arm.jpg`]);
  return useMemo(() => {
    const make = (t: THREE.Texture, srgb: boolean) => {
      const c = t.clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(repeatX, repeatY);
      c.anisotropy = 8;
      c.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      c.needsUpdate = true;
      return c;
    };
    return { map: make(map, true), normalMap: make(normalMap, false), arm: make(arm, false) };
  }, [map, normalMap, arm, repeatX, repeatY]);
}

type SurfaceProps = {
  tex: string;
  w: number;
  h: number;
  span: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  tint?: string;
  gloss?: number;
  normalStrength?: number;
  receive?: boolean;
};

export function Surface({ tex, w, h, span, position, rotation = [0, 0, 0], tint = '#ffffff', gloss = 0.35, normalStrength = 0.8, receive = true }: SurfaceProps) {
  const t = usePbr(tex, w / span, h / span);
  return (
    <mesh position={position} rotation={rotation} receiveShadow={receive}>
      <planeGeometry args={[w, h]} />
      <meshPhysicalMaterial
        color={tint}
        map={t.map}
        normalMap={t.normalMap}
        normalScale={new THREE.Vector2(normalStrength, normalStrength)}
        roughnessMap={t.arm}
        aoMap={t.arm}
        aoMapIntensity={0.9}
        metalness={0}
        roughness={1}
        clearcoat={gloss}
        clearcoatRoughness={0.25}
      />
    </mesh>
  );
}

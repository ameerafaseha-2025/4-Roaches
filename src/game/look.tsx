import { useMemo } from 'react';
import * as THREE from 'three';

type MatProps = {
  color: string;
  rough?: number;
  sheen?: number;
  clearcoat?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
};

export function Soft({ color, rough = 0.7, sheen = 0.5, clearcoat = 0, emissive, emissiveIntensity = 0, transparent, opacity, side }: MatProps) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={rough}
      metalness={0}
      sheen={sheen}
      sheenRoughness={0.6}
      sheenColor={new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.5)}
      clearcoat={clearcoat}
      clearcoatRoughness={0.4}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissiveIntensity}
      transparent={transparent}
      opacity={opacity}
      side={side}
    />
  );
}

export function useGradientSky(top: string, bottom: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const g = canvas.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    g.fillStyle = grad;
    g.fillRect(0, 0, 2, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [top, bottom]);
}

import type { Theme } from './levels';

export type Door = { x: number; z: number; w: number; h: number };
export type Dims = { halfX: number; halfZ: number; height: number; door: Door | null };

// Gameplay scale stays roach-sized; the house is built enormous around it.
const door: Door = { x: -6.5, z: 2.2, w: 3.0, h: 5.6 };
const base = { halfX: 6.5, halfZ: 5.5, height: 7.5 };

export const DIMS: Record<Theme, Dims> = {
  bathroom: { ...base, door },
  store: { ...base, door },
  kitchen: { ...base, door },
  bedroom: { ...base, door },
  living: { ...base, door },
  boss: { ...base, door },
  feast: { ...base, door: null },
};

export const HUMAN_SCALE = 2.6;

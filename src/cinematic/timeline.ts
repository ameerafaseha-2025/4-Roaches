export const intro = { t: 0, scale: 1, ready: false };

export const T = {
  family: 9,
  disaster: 23,
  broom: 26,
  water: 29.2,
  reset: 35.6,
  aftermath: 36,
  invasion: 48,
  fade: 55.2,
  title: 57.4,
  hold: 68,
};

export const HOME = { x: 1.0, z: -4.2 };
export const FOOD = { x: 1.6, z: -3.9 };

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const phase = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const smooth = (v: number) => v * v * (3 - 2 * v);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const heading = (fx: number, fz: number, tx: number, tz: number) => Math.atan2(tx - fx, tz - fz);

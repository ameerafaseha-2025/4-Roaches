import * as THREE from 'three';

export const ROOM = { halfX: 6.5, halfZ: 5.5, height: 7.5 };

export const sim = {
  position: new THREE.Vector3(0, 0.3, 4.4),
  velocity: new THREE.Vector3(),
  yaw: 0,
  pitch: 0,
  roll: 0,
  speed: 0,
  flying: false,
  sprinting: false,
  stuckTo: -1,
  stuckUntil: 0,
  grounded: true,
  hidden: false,
  hideOn: false,
  camYaw: 0,
  camPitch: 0.35,
  aiming: false,
  target: -1,
  attack: 'idle' as 'idle' | 'windup' | 'lunge' | 'recover',
  attackT: 0,
  shake: 0,
  recoil: [] as number[],
  cool: [] as number[],
  lungeDir: new THREE.Vector3(0, 0, -1),
  attackTarget: -1,
  fx: { shield: 0, dash: 0, burst: 0, veil: 0, rage: 0, scurry: 0 },
  abilityCd: 0,
  abilityCdMax: 1,
  abilityFlash: 0,
  invuln: 0,
  stun: [] as number[],
  hideSince: 0,
  hideCooldownUntil: 0,
  secondWindUsed: false,
  impact: { pos: new THREE.Vector3(), t: 99 },
  humanFaces: [] as THREE.Vector3[],
  humanFwd: [] as THREE.Vector3[],
  notice: [] as number[],
  npcs: [] as { x: number; z: number; on: boolean; state: string; exited: boolean }[],
  exitQueue: [] as number[],
  projectiles: [] as { pos: THREE.Vector3; vel: THREE.Vector3; life: number; dmg?: number }[],
};

export const door = {
  has: false,
  z: 0,
  half: 1.5,
  height: 5.6,
  state: 'closed' as 'closed' | 'opening' | 'open' | 'closing',
  t: 0,
  p: 0,
  creaked: false,
  holdUntil: 0,
  exiting: 0,
  exitStart: 0,
  stepAt: 0,
  locked: true,
  fade: 0,
};

export const sim_prompt = { text: '', sub: '' };

export const reveal = { active: false, t: 0, length: 5.2 };

export const STAIRS = { x: 5.4, width: 2.0, z0: 2.9, depth: 0.38, rise: 0.18, count: 20 };
export const stairTop = () => STAIRS.count * STAIRS.rise;
export const stairEndZ = () => STAIRS.z0 - STAIRS.count * STAIRS.depth;

export type Box = { min: THREE.Vector3; max: THREE.Vector3; camOnly?: boolean };

export const obstacles: Box[] = [];
export const hideZones: Box[] = [];
const extras: Box[] = [];

export const makeBox = (x: number, y: number, z: number, w: number, h: number, d: number, camOnly = false): Box => ({
  min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
  max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2),
  camOnly,
});

export function addExtraObstacle(box: Box) {
  extras.push(box);
  obstacles.push(box);
  obstacleVersion.n += 1;
}

export function removeExtraObstacle(box: Box) {
  const e = extras.indexOf(box);
  if (e >= 0) extras.splice(e, 1);
  const o = obstacles.indexOf(box);
  if (o >= 0) obstacles.splice(o, 1);
  obstacleVersion.n += 1;
}

export const stairs = { active: false };
const CLIMB = 0.4;

function stairSurface(p: THREE.Vector3) {
  if (!stairs.active || Math.abs(p.x - STAIRS.x) > STAIRS.width / 2 + 0.02 || p.z > STAIRS.z0 + 0.02 || p.z < stairEndZ() - 0.8) return -1;
  const idx = Math.floor((STAIRS.z0 - p.z) / STAIRS.depth) + 1;
  return Math.min(STAIRS.count, Math.max(0, idx)) * STAIRS.rise;
}

export function setHideZones(list: [number, number, number, number, number, number][]) {
  hideZones.length = 0;
  for (const [x, y, z, w, h, d] of list) {
    hideZones.push({ min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2), max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2) });
  }
}

export function inHideZone(p: THREE.Vector3) {
  return hideZones.some((b) => p.x > b.min.x && p.x < b.max.x && p.y >= b.min.y - 0.01 && p.y < b.max.y && p.z > b.min.z && p.z < b.max.z);
}

export function setRoom(halfX: number, halfZ: number, height: number) {
  ROOM.halfX = halfX;
  ROOM.halfZ = halfZ;
  ROOM.height = height;
}

export const obstacleVersion = { n: 0 };

export function setObstacles(list: [number, number, number, number, number, number][]) {
  obstacleVersion.n += 1;
  obstacles.length = 0;
  for (const [x, y, z, w, h, d] of list) obstacles.push(makeBox(x, y, z, w, h, d));
  for (const e of extras) obstacles.push(e);
}

const RADIUS = 0.22;
const STEP = 0.2;

export function resolveCollisions(p: THREE.Vector3, v: THREE.Vector3) {
  const gate = door.has && (door.exiting > 0 || (door.p > 0.55 && !door.locked)) && p.y < door.height - 0.4 && Math.abs(p.z - door.z) < door.half - 0.3;
  const minX = gate || (door.exiting > 0 && p.x < -ROOM.halfX) ? -ROOM.halfX - 3.2 : -ROOM.halfX + 0.4;
  p.x = THREE.MathUtils.clamp(p.x, minX, ROOM.halfX - 0.4);
  p.z = THREE.MathUtils.clamp(p.z, -ROOM.halfZ + 0.4, ROOM.halfZ - 0.4);
  if (p.x < -ROOM.halfX + 0.4 && door.has) p.z = THREE.MathUtils.clamp(p.z, door.z - door.half + 0.35, door.z + door.half - 0.35);
  if (p.y > ROOM.height - 0.3) { p.y = ROOM.height - 0.3; v.y = Math.min(0, v.y); }
  const surf = stairSurface(p);
  if (surf >= 0 && surf - p.y > CLIMB) {
    const idx = Math.floor((STAIRS.z0 - p.z) / STAIRS.depth) + 1;
    p.z = STAIRS.z0 - (idx - 1) * STAIRS.depth + RADIUS * 0.6;
    v.z = Math.max(0, v.z);
  }
  for (const b of obstacles) {
    if (b.camOnly || b.max.y - p.y <= STEP) continue;
    if (p.x > b.min.x - RADIUS && p.x < b.max.x + RADIUS && p.y > b.min.y - RADIUS && p.y < b.max.y + RADIUS && p.z > b.min.z - RADIUS && p.z < b.max.z + RADIUS) {
      const dx = Math.min(p.x - (b.min.x - RADIUS), b.max.x + RADIUS - p.x);
      const dy = Math.min(p.y - (b.min.y - RADIUS), b.max.y + RADIUS - p.y);
      const dz = Math.min(p.z - (b.min.z - RADIUS), b.max.z + RADIUS - p.z);
      if (dy <= dx && dy <= dz) {
        if (p.y - b.min.y > b.max.y - p.y) { p.y = b.max.y + RADIUS; v.y = Math.max(0, v.y); } else { p.y = b.min.y - RADIUS; v.y = Math.min(0, v.y); }
      } else if (dx <= dz) {
        if (p.x - b.min.x > b.max.x - p.x) p.x = b.max.x + RADIUS; else p.x = b.min.x - RADIUS;
        v.x = 0;
      } else {
        if (p.z - b.min.z > b.max.z - p.z) p.z = b.max.z + RADIUS; else p.z = b.min.z - RADIUS;
        v.z = 0;
      }
    }
  }
}

const CAM_MARGIN = 0.25;

export function clipCamera(from: THREE.Vector3, to: THREE.Vector3, out: THREE.Vector3) {
  const d = new THREE.Vector3().subVectors(to, from);
  const len = d.length();
  let tMax = 1;
  const axes = ['x', 'y', 'z'] as const;
  for (const b of obstacles) {
    if (b.max.y < 0.35) continue;
    const lo = { x: b.min.x - CAM_MARGIN, y: b.min.y - CAM_MARGIN, z: b.min.z - CAM_MARGIN };
    const hi = { x: b.max.x + CAM_MARGIN, y: b.max.y + CAM_MARGIN, z: b.max.z + CAM_MARGIN };
    if (axes.every((a) => from[a] > lo[a] && from[a] < hi[a])) continue;
    let t0 = 0;
    let t1 = tMax;
    for (const a of axes) {
      if (Math.abs(d[a]) < 1e-6) {
        if (from[a] < lo[a] || from[a] > hi[a]) { t0 = 2; break; }
      } else {
        let ta = (lo[a] - from[a]) / d[a];
        let tb = (hi[a] - from[a]) / d[a];
        if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta);
        t1 = Math.min(t1, tb);
        if (t0 > t1) break;
      }
    }
    if (t0 <= t1 && t0 < tMax) tMax = t0;
  }
  const bounds = { x: ROOM.halfX - 0.35, z: ROOM.halfZ - 0.35, y: ROOM.height - 0.4 };
  for (const a of axes) {
    if (Math.abs(d[a]) < 1e-6) continue;
    const limit = d[a] > 0 ? bounds[a] : a === 'y' ? 0.25 : -bounds[a];
    const t = (limit - from[a]) / d[a];
    if (t >= 0 && t < tMax) tMax = t;
  }
  const minT = len > 0 ? Math.min(1, 0.45 / len) : 0;
  out.copy(from).addScaledVector(d, Math.max(tMax * 0.97, minT));
  return tMax * len;
}

export function floorHeight(p: THREE.Vector3) {
  let h = 0;
  const surf = stairSurface(p);
  if (surf >= 0 && surf <= p.y + CLIMB) h = surf;
  for (const b of obstacles) {
    if (b.camOnly) continue;
    if (p.x > b.min.x - 0.05 && p.x < b.max.x + 0.05 && p.z > b.min.z - 0.05 && p.z < b.max.z + 0.05 && b.max.y <= p.y + 0.35) h = Math.max(h, b.max.y);
  }
  return h;
}

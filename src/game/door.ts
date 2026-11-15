import { door, ROOM, sim } from './sim';
import { doorSfx } from './sound';

const OPEN_S = 1.5;
const CLOSE_S = 1.0;
export const OPEN_ANGLE = 1.5;
export const ease = (k: number) => k * k * (3 - 2 * k);
const now = () => performance.now() / 1000;

export function resetDoor(z: number, w: number, h: number) {
  Object.assign(door, { has: true, z, half: w / 2, height: h, state: 'closed', t: 0, p: 0, creaked: false, holdUntil: 0, exiting: 0, exitStart: 0, stepAt: 0 });
}

export function distanceToDoor() {
  return Math.hypot(sim.position.x + ROOM.halfX, sim.position.z - door.z);
}

export function requestOpen(holdFor = 5) {
  door.holdUntil = Math.max(door.holdUntil, now() + holdFor);
  if (door.state === 'open' || door.state === 'opening') return false;
  door.state = 'opening';
  door.creaked = false;
  doorSfx.latch();
  return true;
}

export function requestClose() {
  if (door.state === 'closed' || door.state === 'closing') return;
  door.state = 'closing';
  doorSfx.creak(CLOSE_S * 0.8);
}

export function tickDoor(dt: number) {
  if (!door.has) return;
  if (door.state === 'opening') {
    door.t = Math.min(1, door.t + dt / OPEN_S);
    if (!door.creaked && door.t > 0.08) { door.creaked = true; doorSfx.creak(OPEN_S * 0.75); }
    if (door.t >= 1) door.state = 'open';
  } else if (door.state === 'closing') {
    door.t = Math.max(0, door.t - dt / CLOSE_S);
    if (door.t <= 0) { door.state = 'closed'; doorSfx.thud(); }
  } else if (door.state === 'open' && door.exiting === 0 && now() > door.holdUntil && distanceToDoor() > 3.6) {
    requestClose();
  }
  door.p = ease(door.t);
}

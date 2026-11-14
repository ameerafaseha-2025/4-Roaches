import * as THREE from 'three';
import { sim } from '../game/sim';
import { sound } from '../game/sound';
import { useGame } from '../game/store';
import { MUTATIONS } from './MutationConfig';

type FxKey = keyof typeof sim.fx;
type Ctx = { dir: THREE.Vector3; now: number };

type Behaviour = {
  fx: FxKey;
  usable: (ctx: Ctx) => string | null;
  start: (ctx: Ctx) => void;
  sfx: 'ui' | 'eat' | 'attack' | 'whoosh' | 'impact' | 'win' | 'scream';
};

const STUN_RADIUS = 2.6;

const BEHAVIOURS: Record<string, Behaviour> = {
  scurry: {
    fx: 'scurry', sfx: 'whoosh',
    usable: () => null,
    start: () => undefined,
  },
  shield: {
    fx: 'shield', sfx: 'impact',
    usable: () => null,
    start: () => undefined,
  },
  dash: {
    fx: 'dash', sfx: 'attack',
    usable: () => null,
    start: ({ dir }) => {
      sim.velocity.x = dir.x * 14;
      sim.velocity.z = dir.z * 14;
      sim.invuln = Math.max(sim.invuln, 0.45);
      for (let i = 0; i < sim.humanFaces.length; i++) {
        const f = sim.humanFaces[i];
        if (!f) continue;
        if (Math.hypot(f.x - sim.position.x, f.z - sim.position.z) < STUN_RADIUS * 1.6) sim.stun[i] = 2.2;
      }
      sim.shake = Math.max(sim.shake, 0.35);
    },
  },
  burst: {
    fx: 'burst', sfx: 'whoosh',
    usable: () => {
      const s = useGame.getState();
      return s.energy < 10 ? 'NOT ENOUGH ENERGY' : null;
    },
    start: ({ dir }) => {
      if (!sim.flying) {
        sim.flying = true;
        sim.position.y += 0.06;
      }
      sim.velocity.x = dir.x * 13;
      sim.velocity.z = dir.z * 13;
      sim.velocity.y = Math.max(sim.velocity.y, 1.2);
      useGame.getState().spendEnergy(10);
      sim.shake = Math.max(sim.shake, 0.2);
    },
  },
  veil: {
    fx: 'veil', sfx: 'ui',
    usable: () => null,
    start: () => undefined,
  },
  rage: {
    fx: 'rage', sfx: 'scream',
    usable: () => null,
    start: () => { sim.shake = Math.max(sim.shake, 0.4); },
  },
};

export function abilityId() {
  return MUTATIONS[useGame.getState().equipped].ability.id;
}

export function resetAbilities() {
  (Object.keys(sim.fx) as FxKey[]).forEach((k) => { sim.fx[k] = 0; });
  sim.abilityCd = 0;
  sim.abilityCdMax = 1;
  sim.abilityFlash = 0;
  sim.invuln = 0;
  sim.stun.length = 0;
  sim.secondWindUsed = false;
  sim.hideSince = 0;
  sim.hideCooldownUntil = 0;
}

export function activateAbility(dirX: number, dirZ: number, facingYaw: number) {
  const store = useGame.getState();
  const def = MUTATIONS[store.equipped].ability;
  const beh = BEHAVIOURS[def.id];
  if (!beh) return;
  if (sim.abilityCd > 0) { store.toast(`${def.name} RECHARGING ${Math.ceil(sim.abilityCd)}s`); return; }
  const dir = new THREE.Vector3(dirX, 0, dirZ);
  if (dir.lengthSq() < 0.01) dir.set(-Math.sin(facingYaw), 0, -Math.cos(facingYaw));
  dir.normalize();
  const ctx: Ctx = { dir, now: performance.now() / 1000 };
  const why = beh.usable(ctx);
  if (why) { store.toast(why); return; }
  beh.start(ctx);
  sim.fx[beh.fx] = def.duration;
  const cd = def.cooldown * store.stats.specialAbilityCooldown;
  sim.abilityCd = cd;
  sim.abilityCdMax = cd;
  sim.abilityFlash = 1;
  sound(beh.sfx);
  store.toast(`${def.name}!`);
}

export function tickAbilities(dt: number) {
  (Object.keys(sim.fx) as FxKey[]).forEach((k) => { sim.fx[k] = Math.max(0, sim.fx[k] - dt); });
  sim.abilityCd = Math.max(0, sim.abilityCd - dt);
  sim.abilityFlash = Math.max(0, sim.abilityFlash - dt * 2.4);
  sim.invuln = Math.max(0, sim.invuln - dt);
  for (let i = 0; i < sim.stun.length; i++) if (sim.stun[i] > 0) sim.stun[i] = Math.max(0, sim.stun[i] - dt);
}

export function speedMultiplier() {
  let m = 1;
  if (sim.fx.scurry > 0) m *= 1.45;
  if (sim.fx.rage > 0) m *= 1.3;
  return m;
}

export function attackMultiplier() {
  return sim.fx.rage > 0 ? 1.6 : 1;
}

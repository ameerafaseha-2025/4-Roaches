import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoachModel } from './RoachModel';
import { AbilityFx } from '../progression/AbilityFx';
import { LEVELS } from './levels';
import { input, tutorial } from './input';
import { prefs } from './prefs';
import { activateAbility, attackMultiplier, resetAbilities, speedMultiplier, tickAbilities } from '../progression/Abilities';
import { clipCamera, floorHeight, inHideZone, resolveCollisions, ROOM, sim } from './sim';
import { DIMS, HUMAN_SCALE } from './world';
import { setWingBuzz, sound } from './sound';
import { useGame } from './store';

const tmp = new THREE.Vector3();
const dirV = new THREE.Vector3();
const wish = new THREE.Vector3();
const FACE_REACH = 0.42;
const ATTACK_RANGE = 3.4;
const AIM_RANGE = 5.4;
const WINDUP = 0.16;
const LUNGE = 0.3;
const RECOVER = 0.32;
const ATTACK_COST = 6;

const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

function faceReach(level: number, i: number) {
  return FACE_REACH * (LEVELS[level - 1].humans[i]?.scale ?? 1) * HUMAN_SCALE;
}

function alive(level: number, i: number) {
  return !useGame.getState().cleared.includes(`L${level}-H${i}`);
}

function pickTarget(level: number, p: THREE.Vector3, range: number, camFwd: THREE.Vector3, needFacing: boolean) {
  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < sim.humanFaces.length; i++) {
    if (!alive(level, i) || (sim.cool[i] ?? 0) > performance.now() / 1000) continue;
    const to = tmp.subVectors(sim.humanFaces[i], p);
    const dist = to.length();
    if (dist > range) continue;
    const dot = to.clone().setY(0).normalize().dot(camFwd);
    if (needFacing && dot < 0.25) continue;
    const score = dist * (1.4 - Math.max(0, dot));
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return best;
}

export function Player({ level, runId }: { level: number; runId: number }) {
  const group = useRef<THREE.Group>(null);
  const model = useRef<THREE.Group>(null);
  const equipped = useGame((s) => s.equipped);
  const cosmetics = useGame((s) => s.cosmeticsEquipped);

  useEffect(() => {
    sim.position.set(LEVELS[level - 1].theme === 'bathroom' ? -1.2 : 0, 0.3, 3.4);
    sim.velocity.set(0, 0, 0);
    sim.yaw = 0;
    sim.camYaw = 0;
    sim.camPitch = 0.38;
    sim.pitch = 0;
    sim.roll = 0;
    sim.flying = false;
    sim.hidden = false;
    sim.hideOn = false;
    sim.aiming = false;
    sim.target = -1;
    sim.attack = 'idle';
    sim.attackT = 0;
    sim.attackTarget = -1;
    sim.stuckTo = -1;
    sim.shake = 0;
    sim.projectiles.length = 0;
    sim.humanFaces.length = 0;
    sim.humanFwd.length = 0;
    sim.cool.length = 0;
    sim.recoil.length = 0;
    resetAbilities();
    return () => setWingBuzz(false);
  }, [level, runId]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.04);
    const store = useGame.getState();
    const g = group.current;
    if (!g) return;
    if (store.screen !== 'game') {
      setWingBuzz(false);
      input.mouseX = 0;
      input.mouseY = 0;
      return;
    }
    const now = performance.now() / 1000;
    const p = sim.position;
    const v = sim.velocity;
    const spec = LEVELS[level - 1];

    const stats = store.stats;
    tickAbilities(dt);
    const sens = 0.0024 * (prefs.sensitivity / 100);
    if (input.mouseX || input.mouseY) tutorial.looked = true;
    sim.camYaw -= input.mouseX * sens;
    sim.camPitch = THREE.MathUtils.clamp(sim.camPitch + input.mouseY * sens * (prefs.invertY ? -1 : 1), -0.2, 1.2);
    input.mouseX = 0;
    input.mouseY = 0;

    const camFwd = dirV.set(-Math.sin(sim.camYaw), 0, -Math.cos(sim.camYaw)).clone();
    const camRight = new THREE.Vector3(Math.cos(sim.camYaw), 0, -Math.sin(sim.camYaw));
    const moveF = Number(input.forward) - Number(input.backward) + input.stickY;
    const moveR = Number(input.right) - Number(input.left) + input.stickX;
    const moveLen = Math.min(1, Math.hypot(moveF, moveR));
    wish.set(0, 0, 0).addScaledVector(camFwd, moveF).addScaledVector(camRight, moveR);
    if (wish.lengthSq() > 0) wish.normalize();
    if (moveLen > 0.05) tutorial.moved = true;

    const lowEnergy = store.energy <= 0;
    if (input.fly) {
      input.fly = false;
      if (sim.flying) sim.flying = false;
      else if (!lowEnergy) { sim.flying = true; v.y = Math.max(v.y, 1.6); p.y += 0.05; sim.hideOn = false; tutorial.flew = true; sound('ui'); }
      else store.toast('NO ENERGY. EAT SCRAPS TO FLY');
    }
    if (input.jump) {
      input.jump = false;
      if (!sim.flying && sim.grounded && sim.stuckTo < 0 && sim.attack === 'idle') {
        v.y = 3.8;
        sim.grounded = false;
        sim.hideOn = false;
        tutorial.jumped = true;
        sound('whoosh');
      }
    }
    if (sim.flying && lowEnergy) { sim.flying = false; store.toast('OUT OF ENERGY. GLIDING DOWN'); }

    if (input.ability) {
      input.ability = false;
      if (sim.stuckTo < 0) activateAbility(wish.x, wish.z, sim.yaw);
    }

    if (input.hide) {
      input.hide = false;
      if (sim.hideOn) { sim.hideOn = false; store.toast('YOU CREEP OUT OF COVER'); }
      else if (performance.now() / 1000 < sim.hideCooldownUntil) store.toast('HIDING RECOVERS IN ' + Math.ceil(sim.hideCooldownUntil - performance.now() / 1000) + 's');
      else if (!sim.flying && sim.grounded && inHideZone(p)) { sim.hideOn = true; sim.hideSince = performance.now() / 1000; tutorial.hid = true; store.toast('HIDDEN. HUMANS CANNOT SEE YOU'); sound('ui'); }
      else store.toast('NO COVER NEARBY. TRY UNDER THE VANITY');
    }

    sim.aiming = input.aim && sim.attack === 'idle' && sim.stuckTo < 0;
    if (sim.aiming) {
      tutorial.aimed = true;
      sim.target = pickTarget(level, p, AIM_RANGE * 2.2, camFwd, false);
    } else sim.target = -1;

    const wantsSprint = input.sprint && store.stamina > 0 && moveLen > 0.05;
    sim.sprinting = wantsSprint;
    if (wantsSprint) tutorial.sprinted = true;
    let speed = (sim.flying ? stats.flightSpeed : stats.movementSpeed) * (wantsSprint ? stats.sprintSpeed : 1) * speedMultiplier();
    if (sim.aiming) speed *= 0.6;
    if (sim.hideOn) speed *= stats.stealthMove;

    if (input.attack) {
      input.attack = false;
      if (sim.attack === 'idle' && sim.stuckTo < 0) {
        if (store.stamina < ATTACK_COST) store.toast('TOO TIRED TO ATTACK');
        else {
          const range = sim.aiming ? AIM_RANGE : ATTACK_RANGE;
          let t = sim.aiming && sim.target >= 0 && sim.humanFaces[sim.target] && p.distanceTo(sim.humanFaces[sim.target]) <= range ? sim.target : -1;
          if (t < 0) t = pickTarget(level, p, range, camFwd, true);
          sim.attackTarget = t;
          sim.attack = 'windup';
          sim.attackT = 0;
          sim.hideOn = false;
          store.spendStamina(ATTACK_COST);
          tutorial.attacked = true;
          if (t >= 0) {
            tmp.subVectors(sim.humanFaces[t], p).setY(0).normalize();
            sim.lungeDir.copy(tmp);
          } else sim.lungeDir.set(-Math.sin(sim.yaw), 0, -Math.cos(sim.yaw));
          if (t < 0) store.toast('NOTHING IN REACH. FLY CLOSER TO A FACE');
        }
      }
    }

    if (sim.stuckTo >= 0) {
      const face = sim.humanFaces[sim.stuckTo];
      if (face) p.lerp(tmp.copy(face), 1 - Math.exp(-18 * dt));
      v.set(0, 0, 0);
      sim.speed = 0;
      store.addFear(`L${level}-H${sim.stuckTo}`, (60 / (spec.humans[sim.stuckTo]?.tough ?? 80)) * 100 * dt * stats.attackDamage * attackMultiplier());
      sim.shake = Math.max(sim.shake, 0.06);
      if (now > sim.stuckUntil) {
        const idx = sim.stuckTo;
        sim.cool[idx] = now + 1.2;
        sim.stuckTo = -1;
        const f = sim.humanFwd[idx];
        if (f) v.set(f.x * 4.5, 1.6, f.z * 4.5);
        sim.attack = 'recover';
        sim.attackT = 0;
        sound('scream');
      }
    } else if (sim.attack !== 'idle') {
      sim.attackT += dt;
      sim.speed = THREE.MathUtils.damp(sim.speed, 0, 10, dt);
      if (sim.attack === 'windup') {
        v.x = THREE.MathUtils.damp(v.x, 0, 14, dt);
        v.z = THREE.MathUtils.damp(v.z, 0, 14, dt);
        if (!sim.flying) v.y -= 14 * dt;
        const want = Math.atan2(-sim.lungeDir.x, -sim.lungeDir.z);
        sim.yaw += angleDiff(sim.yaw, want) * Math.min(1, dt * 20);
        if (sim.attackT >= WINDUP) { sim.attack = 'lunge'; sim.attackT = 0; sound('whoosh'); }
      } else if (sim.attack === 'lunge') {
        const t = sim.attackTarget;
        const face = t >= 0 ? sim.humanFaces[t] : null;
        if (face) tmp.subVectors(face, p).normalize();
        else tmp.copy(sim.lungeDir).setY(0.05).normalize();
        v.copy(tmp).multiplyScalar(face ? 12 : 8);
        sim.yaw = Math.atan2(-tmp.x, -tmp.z);
        if (face && alive(level, t) && (sim.cool[t] ?? 0) <= now && p.distanceTo(face) < faceReach(level, t) * 1.25) {
          sim.stuckTo = t;
          sim.stuckUntil = now + 1.5;
          sim.flying = true;
          sim.shake = 0.5;
          sim.recoil[t] = 1;
          sim.impact.pos.copy(face);
          sim.impact.t = 0;
          sound('impact');
          useGame.getState().toast('FACE ATTACK!');
        } else if (sim.attackT >= LUNGE) {
          sim.attack = 'recover';
          sim.attackT = 0;
          v.multiplyScalar(0.2);
        }
      } else if (sim.attackT >= RECOVER) {
        sim.attack = 'idle';
        sim.attackT = 0;
      }
    } else if (sim.flying) {
      sim.speed = THREE.MathUtils.damp(sim.speed, moveLen * speed, 4, dt);
      if (moveLen > 0.05) {
        const want = Math.atan2(-wish.x, -wish.z);
        const diff = angleDiff(sim.yaw, want);
        sim.yaw += diff * Math.min(1, dt * 7);
        sim.roll = THREE.MathUtils.damp(sim.roll, THREE.MathUtils.clamp(-diff * 0.55, -0.7, 0.7), 5, dt);
      } else sim.roll = THREE.MathUtils.damp(sim.roll, 0, 5, dt);
      const climb = Number(input.up) - Number(input.down);
      const air = 5 * stats.aerialControl * stats.acceleration;
      v.x = THREE.MathUtils.damp(v.x, wish.x * sim.speed, air, dt);
      v.z = THREE.MathUtils.damp(v.z, wish.z * sim.speed, air, dt);
      v.y = THREE.MathUtils.damp(v.y, climb * 3.2 - 0.05, 5 * stats.aerialControl, dt);
      sim.pitch = THREE.MathUtils.damp(sim.pitch, THREE.MathUtils.clamp(v.y * 0.1, -0.5, 0.5), 5, dt);
      store.spendEnergy((wantsSprint ? 2.05 : 1) * stats.flightEnergyConsumption * dt);
      if (stats.energyRegeneration > 0) store.refill(stats.energyRegeneration * dt);
      if (wantsSprint) store.spendStamina(22 * stats.sprintStaminaCost * dt);
    } else {
      sim.pitch = THREE.MathUtils.damp(sim.pitch, 0, 6, dt);
      sim.roll = THREE.MathUtils.damp(sim.roll, 0, 6, dt);
      sim.speed = THREE.MathUtils.damp(sim.speed, moveLen * speed, 10, dt);
      if (moveLen > 0.05) {
        const want = Math.atan2(-wish.x, -wish.z);
        sim.yaw += angleDiff(sim.yaw, want) * Math.min(1, dt * 12);
      }
      const accel = (sim.grounded ? 14 : 3.5) * stats.acceleration;
      v.x = THREE.MathUtils.damp(v.x, wish.x * sim.speed, accel, dt);
      v.z = THREE.MathUtils.damp(v.z, wish.z * sim.speed, accel, dt);
      v.y -= 14 * dt;
      if (wantsSprint) store.spendStamina(20 * stats.sprintStaminaCost * dt);
      if (stats.energyRegeneration > 0 && sim.grounded) store.refill(stats.energyRegeneration * 0.5 * dt);
    }

    if (sim.stuckTo < 0) {
      p.addScaledVector(v, dt);
      resolveCollisions(p, v);
      const floor = floorHeight(p);
      sim.grounded = p.y <= floor + 0.05;
      if (p.y < floor) { p.y = floor; v.y = Math.max(0, v.y); }
      if (sim.flying && sim.grounded && input.down) sim.flying = false;
    }
    if (!sim.flying && sim.stuckTo < 0 && !wantsSprint) store.regenStamina((sim.grounded ? 18 : 6) * stats.staminaRegeneration * dt);

    if (sim.hideOn && (sim.flying || !inHideZone(p) || performance.now() / 1000 - sim.hideSince > stats.hideDuration)) {
      if (sim.hideOn) sim.hideCooldownUntil = performance.now() / 1000 + stats.hideCooldown;
      sim.hideOn = false;
    }
    sim.hidden = sim.hideOn || sim.fx.veil > 0;

    const door = DIMS[spec.theme].door;
    const nearDoor = !!door && p.x < -ROOM.halfX + 1.1 && Math.abs(p.z - door.z) < door.w / 2 && p.y < door.h;
    if (spec.kind !== 'feast' && store.exitUnlocked && nearDoor) store.advance();
    if (spec.kind === 'feast' && store.exitUnlocked) store.advance();

    setWingBuzz(sim.flying, wantsSprint ? 1.6 : 1);
    sim.shake = Math.max(0, sim.shake - dt * 1.8);
    sim.impact.t += dt;

    g.position.copy(p);
    g.rotation.set(0, sim.yaw + Math.PI, 0);
    const m = model.current;
    if (m) {
      let sx = 1;
      let sy = 1;
      let sz = 1;
      let tilt = -sim.pitch * 0.9;
      if (sim.attack === 'windup') {
        const k = Math.min(1, sim.attackT / WINDUP);
        sy = 1 - 0.22 * k; sz = 1 - 0.1 * k; sx = 1 + 0.1 * k; tilt = 0.45 * k;
      } else if (sim.attack === 'lunge') {
        sz = 1.25; sy = 0.85; sx = 0.9; tilt = -0.2;
      } else if (sim.attack === 'recover') {
        const k = 1 - Math.min(1, sim.attackT / RECOVER);
        sz = 1 + 0.12 * k; sy = 1 - 0.1 * k; tilt = -0.15 * k;
      }
      m.scale.set(sx, sy, sz);
      m.rotation.x = tilt;
      m.rotation.z = sim.roll;
      m.visible = true;
    }
  });

  return (
    <group ref={group}>
      <group ref={model}>
        <group visible>
          <RoachModel mutation={equipped} cosmetics={cosmetics} />
          <AbilityFx />
        </group>
      </group>
      <pointLight position={[0, 0.5, 0]} intensity={0.9} distance={2.6} color="#ffd6a0" />
    </group>
  );
}

export function CameraRig({ resetKey }: { resetKey: string }) {
  const { camera } = useThree();
  const state = useRef({ dist: 2.4, init: true });
  useEffect(() => { state.current.init = true; }, [resetKey]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.04);
    const s = state.current;
    const p = sim.position;
    const focus = new THREE.Vector3(p.x, p.y + 0.28, p.z);
    const aim = sim.aiming;
    const wanted = (sim.flying ? 3.0 : 2.4) * (aim ? 0.72 : 1) * (sim.sprinting ? 1.12 : 1);
    const cp = Math.cos(sim.camPitch);
    const dir = new THREE.Vector3(Math.sin(sim.camYaw) * cp, Math.sin(sim.camPitch), Math.cos(sim.camYaw) * cp);
    const desired = focus.clone().addScaledVector(dir, wanted);
    const clipped = new THREE.Vector3();
    const reach = clipCamera(focus, desired, clipped);
    const allowed = Math.min(wanted, Math.max(0.5, reach));
    if (s.init) { s.dist = allowed; s.init = false; }
    s.dist = allowed < s.dist ? THREE.MathUtils.damp(s.dist, allowed, 28, dt) : THREE.MathUtils.damp(s.dist, allowed, 3.5, dt);
    camera.position.copy(focus).addScaledVector(dir, s.dist);
    if (sim.shake > 0) {
      const a = sim.shake * 0.09 * (prefs.shake / 100);
      camera.position.x += (Math.random() - 0.5) * a;
      camera.position.y += (Math.random() - 0.5) * a;
    }
    camera.lookAt(focus.x, focus.y + 0.08, focus.z);
    if (camera instanceof THREE.PerspectiveCamera) {
      const kick = sim.attack === 'lunge' ? 8 : 0;
      camera.fov = THREE.MathUtils.damp(camera.fov, (prefs.fov + (sim.sprinting ? 12 : sim.flying ? 6 : 0)) + kick - (aim ? 9 : 0), 6, dt);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

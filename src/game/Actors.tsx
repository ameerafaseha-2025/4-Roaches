import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { FOOD_REWARDS, ROLE, detectRange, type HumanSpec } from './levels';
import { Soft } from './look';
import { HumanModel, newMotion, type Motion } from './Characters';
import { POSES, ROUTINES, type Activity, type NpcState } from './activities';
import { doorApproach, farthestFree, findPath, isFree, type P2 } from './nav';
import { requestOpen } from './door';
import { door, ROOM, sim } from './sim';
import { footstep, voiceSfx } from './sound';
import { HUMAN_SCALE } from './world';
import { useGame } from './store';

const playing = () => useGame.getState().screen === 'game';
const clamp = THREE.MathUtils.clamp;
const TV_POINT: P2 = [0.6, -5.1];

type Mode = 'routine' | 'suspicious' | 'frightened' | 'fleeing' | 'chase' | 'recovering' | 'exiting';
type MakMode = 'walk' | 'throw' | 'slam' | 'recover';

const SLEEP: Activity[] = ['sleep', 'sofaSleep'];
const SIT: Activity[] = ['phone', 'tv', 'read'];
const WORK: Activity[] = ['sweep', 'carry', 'pace', 'chop', 'cook', 'dishes', 'prep', 'fold', 'sort'];
const baseLabel = (a: Activity): NpcState => (SLEEP.includes(a) ? 'SLEEPING' : SIT.includes(a) ? 'SITTING' : WORK.includes(a) ? 'WORKING' : a === 'stand' ? 'IDLE' : 'INTERACTING');
const LABEL: Record<Exclude<Mode, 'routine'>, NpcState> = { suspicious: 'SUSPICIOUS', frightened: 'FRIGHTENED', fleeing: 'FLEEING', chase: 'WALKING', recovering: 'RECOVERING', exiting: 'FLEEING' };

let lastVoice = 0;
const voice = (fn: () => void) => {
  const t = performance.now();
  if (t - lastVoice < 450) return;
  lastVoice = t;
  fn();
};

const slamMat = new THREE.MeshBasicMaterial({ color: '#ff2d3d', transparent: true, opacity: 0.3, depthWrite: false });

export function Human({ index, spec, id }: { index: number; spec: HumanSpec; id: string }) {
  const group = useRef<THREE.Group>(null);
  const spray = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Group>(null);
  const mark = useRef<THREE.Mesh>(null);
  const slam = useRef<THREE.Group>(null);
  const aimLine = useRef<THREE.Mesh>(null);
  const fearView = useGame((s) => Math.round((s.fear[id] ?? 0) / 4) * 4);
  const cleared = useGame((s) => s.cleared.includes(id));
  const bossActive = useGame((s) => s.bossActive);
  const isMak = spec.role === 'mak';
  const scale = (spec.scale ?? 1) * HUMAN_SCALE;
  const spot = isMak ? undefined : ROUTINES[spec.name];
  const home: P2 = spot ? spot.pos : spec.pos;
  const activity: Activity = spot?.activity ?? 'stand';
  const pose = POSES[activity];
  const motion = useRef<Motion>(newMotion());
  const st = useRef({
    yaw: spot?.face ?? 0, x: home[0], z: home[1], stomp: 0, sprayT: 2, sprayWind: 0, sprayOn: 0, decay: 0, fall: 0,
    mode: 'routine' as Mode, stateT: 0, path: [] as P2[], replanT: 0, routeI: 0, lie: pose.lie, sit: pose.sit, gy: 0, calmT: 0,
    exitDelay: 0, scream: false, gasp: false, exited: false, step: 0, wasAwake: false, age: 0,
    mak: 'walk' as MakMode, mT: 0, cd: 2.2, entered: false,
  });

  const follow = (s: typeof st.current, dt: number, speed: number, free = false) => {
    const wp = s.path[0];
    if (!wp) return false;
    const dx = wp[0] - s.x;
    const dz = wp[1] - s.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.25) { s.path.shift(); return s.path.length > 0; }
    const step = Math.min(d, speed * dt);
    const nx = s.x + (dx / d) * step;
    const nz = s.z + (dz / d) * step;
    if (!free && !isFree(nx, nz) && isFree(s.x, s.z)) { s.path.length = 0; return false; }
    s.x = nx;
    s.z = nz;
    return true;
  };

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const s = st.current;
    const m = motion.current;
    const t = state.clock.elapsedTime;
    const run = playing();
    const store = useGame.getState();
    const present = !isMak || store.bossActive || cleared;
    const fear = store.fear[id] ?? 0;
    g.visible = present && !s.exited;
    g.rotation.order = 'YXZ';
    const stuckHere = sim.stuckTo === index;
    const p = sim.position;
    const R = ROLE[spec.role];

    if (isMak && store.bossActive && !s.entered) {
      s.entered = true; s.x = -5.4; s.z = 2.2; s.cd = 2.4; sim.notice[index] = 0;
    }

    const rec = sim.npcs[index] ?? (sim.npcs[index] = { x: s.x, z: s.z, on: true, state: 'IDLE', exited: false });
    const stunned = !isMak && (sim.stun[index] ?? 0) > 0;
    const flat = Math.hypot(p.x - s.x, p.z - s.z);

    if (run && present && !s.exited) {
      const res = store.stats.detectionResistance;
      const sleeping = s.mode === 'routine' && s.lie > 0.5;
      const range = detectRange(spec, res) * (sleeping ? 0.5 : 1);
      s.age += dt;
      const grace = s.age < 4 && fear <= 0;
      const toRoach = Math.atan2(p.x - s.x, p.z - s.z);
      const off = Math.abs(Math.atan2(Math.sin(toRoach - s.yaw), Math.cos(toRoach - s.yaw)));
      const behind = flat > 2.5 && off > 1.9 && s.mode === 'routine';
      const inRange = !grace && !sim.hidden && !stunned && flat < range;
      const n0 = sim.notice[index] ?? 0;
      const rate = R.notice * (sleeping ? 0.5 : 1) * (behind ? 0.3 : 1);
      const n = clamp(n0 + (inRange || fear > 0 ? rate * dt : -0.5 * dt), 0, 1);
      sim.notice[index] = stuckHere ? 1 : n;
      const aware = (stuckHere || n >= 1) && !sim.hidden;
      const vol = clamp(1 - flat / 18, 0.12, 1);

      if (!isMak) {
        s.stateT += dt;
        const stage = cleared ? 4 : spec.role === 'person' && fear >= 60 ? 3 : fear >= 30 ? 2 : fear > 0 || n >= 0.4 ? 1 : 0;
        const enter = (mode: Mode) => { s.mode = mode; s.stateT = 0; s.path = []; s.replanT = 0; };

        if (cleared && s.mode !== 'exiting') {
          const queue = sim.exitQueue;
          if (!queue.includes(index)) queue.push(index);
          s.exitDelay = queue.indexOf(index) * 0.55;
          enter('exiting');
          if (!isMak) voice(() => voiceSfx.scream(spec.role === 'janitor' ? 0.8 : 1.05, vol));
        } else if (!cleared) {
          if (s.mode === 'routine' && (n >= 0.4 || fear > 0)) { enter('suspicious'); m.flinch = 0.5; if (!s.gasp) { s.gasp = true; voice(() => (n >= 0.7 || fear > 0 ? voiceSfx.gasp(vol) : voiceSfx.hm(vol))); } }
          else if (s.mode === 'suspicious') {
            if (stage >= 3) enter('fleeing');
            else if (stage === 2) enter('frightened');
            else if (n >= 1 && spec.role === 'janitor') enter('chase');
            else if (n < 0.15 && fear <= 0 && s.stateT > 2.5) enter('recovering');
          } else if (s.mode === 'frightened') {
            if (stage >= 3) enter('fleeing');
            else if (spec.role === 'janitor' && n >= 1 && stage < 3) enter('chase');
            else if (fear < 12 && s.stateT > 2) enter('suspicious');
          } else if (s.mode === 'fleeing') {
            if (fear < 28 && s.stateT > 2.2) enter('recovering');
          } else if (s.mode === 'chase') {
            if (stage >= 3 && false) enter('frightened');
            if (n < 0.2) s.calmT += dt; else s.calmT = 0;
            if (s.calmT > 3) { s.calmT = 0; enter('recovering'); }
          } else if (s.mode === 'recovering') {
            if (n >= 0.4 || fear > 0) enter('suspicious');
          }
          if (s.mode === 'fleeing' && !s.scream) { s.scream = true; m.flinch = 1; voice(() => voiceSfx.scream(1, vol)); }
          if (s.mode !== 'fleeing') s.scream = false;
          if (s.mode === 'frightened' && s.stateT < 0.05) { m.flinch = 1; voice(() => voiceSfx.gasp(vol)); }
        }

        const px = s.x;
        const pz = s.z;
        const awake = s.mode !== 'routine' && !(s.mode === 'suspicious' && (s.sit > 0.5 || s.lie > 0.5));
        const standing = s.sit < 0.25 && s.lie < 0.25;
        const away = Math.atan2(s.x - p.x, s.z - p.z);
        let speed = 0;
        let faceTo: number | null = null;

        if (s.mode === 'routine') {
          if (spot?.route && pose.walks && standing) {
            if (!s.path.length) { s.routeI = (s.routeI + 1) % spot.route.length; s.path = [spot.route[s.routeI]]; }
            speed = 0.8;
            follow(s, dt, speed, true);
          } else {
            const dx = home[0] - s.x; const dz = home[1] - s.z;
            if (Math.hypot(dx, dz) > 0.05) { s.x += dx * Math.min(1, dt * 3); s.z += dz * Math.min(1, dt * 3); }
            faceTo = spot?.face ?? null;
          }
        } else if (s.mode === 'suspicious') {
          faceTo = s.sit > 0.5 || s.lie > 0.5 ? null : Math.atan2(p.x - s.x, p.z - s.z);
          if (fear > 0 && spec.role === 'person' && standing) {
            const bx = s.x + Math.sin(away) * 0.5 * dt;
            const bz = s.z + Math.cos(away) * 0.5 * dt;
            if (isFree(bx, bz)) { s.x = bx; s.z = bz; speed = 0.5; }
          }
        } else if (s.mode === 'frightened') {
          faceTo = Math.atan2(p.x - s.x, p.z - s.z);
          const bx = s.x + Math.sin(away) * 0.9 * dt;
          const bz = s.z + Math.cos(away) * 0.9 * dt;
          if (isFree(bx, bz)) { s.x = bx; s.z = bz; speed = 0.9; }
        } else if (s.mode === 'fleeing') {
          s.replanT -= dt;
          if (s.replanT <= 0 || !s.path.length) {
            s.replanT = 1.0;
            const goal = farthestFree(s.x, s.z, p.x, p.z);
            s.path = findPath(s.x, s.z, goal[0], goal[1]);
          }
          speed = 2.3;
          follow(s, dt, speed);
        } else if (s.mode === 'chase') {
          const dx = p.x - s.x; const dz = p.z - s.z;
          const d = Math.hypot(dx, dz);
          faceTo = Math.atan2(dx, dz);
          const sp = stunned || stuckHere || fear >= 30 ? R.chase * 0.5 : R.chase;
          if (!stunned && !stuckHere && d > 0.45 * scale && !(s.sprayWind > 0 || s.sprayOn > 0)) {
            s.replanT -= dt;
            if (s.replanT <= 0 || !s.path.length) { s.replanT = 0.7; s.path = findPath(s.x, s.z, p.x, p.z); }
            speed = sp;
            follow(s, dt, speed);
          }
        } else if (s.mode === 'recovering') {
          if (!s.path.length) s.path = findPath(s.x, s.z, home[0], home[1]);
          speed = 1.0;
          follow(s, dt, speed);
          if (Math.hypot(home[0] - s.x, home[1] - s.z) < 0.5) {
            s.x = home[0]; s.z = home[1]; s.path = [];
            sim.notice[index] = 0; s.gasp = false; s.mode = 'routine'; s.stateT = 0;
          }
        } else if (s.mode === 'exiting') {
          if (s.stateT >= s.exitDelay) {
            const ap = doorApproach();
            const through = s.x < ap[0] + 0.2 && Math.abs(s.z - door.z) < door.half - 0.4;
            if (!through) {
              if (!s.path.length || s.replanT <= 0) { s.path = findPath(s.x, s.z, ap[0], ap[1]); s.replanT = 1.5; }
              s.replanT -= dt;
              speed = 2.8;
              follow(s, dt, speed);
            } else {
              requestOpen(3);
              const near = Math.abs(s.x - ap[0]) < 1.6;
              if (door.p > 0.6 || s.x < -ROOM.halfX + 0.4) {
                speed = 2.8;
                s.x -= speed * dt;
                s.z += (door.z - s.z) * Math.min(1, dt * 4);
                faceTo = -Math.PI / 2;
                if (s.x < -ROOM.halfX - 0.9) { s.exited = true; rec.exited = true; }
              } else if (near) speed = 0;
            }
            if (!through && s.path.length === 0 && Math.hypot(s.x - ap[0], s.z - ap[1]) < 0.9) s.x = Math.min(s.x, ap[0] + 0.15);
          }
        }

        s.x = clamp(s.x, -ROOM.halfX - 3, ROOM.halfX - 0.8);
        s.z = clamp(s.z, -ROOM.halfZ + 0.8, ROOM.halfZ - 0.8);
        const moved = Math.hypot(s.x - px, s.z - pz) / Math.max(dt, 0.001);
        motion.current.speed = THREE.MathUtils.damp(motion.current.speed, moved, 6, dt);
        const moving = moved > 0.15;
        if (moving && s.mode !== 'routine' && s.mode !== 'frightened' && s.mode !== 'suspicious' && s.mode !== 'chase') faceTo = Math.atan2(s.x - px, s.z - pz);
        else if (moving && s.mode === 'routine') faceTo = Math.atan2(s.x - px, s.z - pz);
        if (faceTo !== null) {
          const diff = Math.atan2(Math.sin(faceTo - s.yaw), Math.cos(faceTo - s.yaw));
          const rate = s.mode === 'fleeing' || s.mode === 'exiting' ? 9 : s.mode === 'routine' ? 3 : 3.6;
          s.yaw += diff * Math.min(1, dt * rate * (stunned || stuckHere ? 0 : 1));
        }

        const lookAt: P2 | null = s.mode === 'routine' ? (activity === 'tv' ? TV_POINT : null) : s.mode === 'fleeing' || s.mode === 'exiting' ? null : [p.x, p.z];
        let lookY = 0;
        if (lookAt) {
          const w = Math.atan2(lookAt[0] - s.x, lookAt[1] - s.z);
          lookY = Math.atan2(Math.sin(w - s.yaw), Math.cos(w - s.yaw));
        }
        m.look = THREE.MathUtils.damp(m.look, lookAt ? clamp(lookY, -1.1, 1.1) : 0, 5, dt);
        m.pose = pose;
        const wantPose = s.mode === 'routine' && (pose.walks || !moving) ? 1 : 0;
        m.poseW = THREE.MathUtils.damp(m.poseW, wantPose, 5, dt);
        const sitT = (pose.sit === 1 && (s.mode === 'routine' || s.mode === 'suspicious')) || (pose.lie === 1 && s.mode === 'suspicious' && s.stateT < 1.4) ? 1 : 0;
        const lieT = pose.lie === 1 && s.mode === 'routine' ? 1 : 0;
        s.sit = THREE.MathUtils.damp(s.sit, sitT, 4.5, dt);
        s.lie = THREE.MathUtils.damp(s.lie, lieT, 3.5, dt);
        m.sit = s.sit;
        m.stage = stage >= 4 ? 3 : stage;
        m.run = THREE.MathUtils.damp(m.run, s.mode === 'fleeing' || s.mode === 'exiting' ? 1 : 0, 8, dt);
        m.flinch = Math.max(0, m.flinch - dt * 2.4);
        if ((s.mode === 'fleeing' || s.mode === 'exiting') && speed > 1 && flat < 20) {
          s.step -= dt;
          if (s.step <= 0) { s.step = 0.32; footstep(true, vol * 0.8); }
        }
        s.wasAwake = awake;
        rec.state = s.mode === 'routine' ? baseLabel(activity) : LABEL[s.mode];
      }

      if (!isMak) {
        s.stomp = Math.max(0, s.stomp - dt);
        const upright = s.sit < 0.5 && s.lie < 0.5;
        if (flat < 0.5 * scale && p.y < 0.6 && s.stomp <= 0 && !sim.hidden && !stunned && !stuckHere && s.mode !== 'fleeing' && s.mode !== 'exiting' && upright && s.mode !== 'routine') {
          s.stomp = 1.4;
          store.hurt(R.stomp);
        }
      }

      if (spec.role === 'janitor' && !cleared) {
        s.sprayT -= dt;
        if (stunned) { s.sprayOn = 0; s.sprayWind = 0; }
        if (s.sprayT <= 0 && s.mode === 'chase' && aware && !stunned && !stuckHere && flat < detectRange(spec, res) * 0.55 && s.sprayWind <= 0 && s.sprayOn <= 0) { s.sprayWind = 0.8; s.sprayT = 3.4; }
        if (s.sprayWind > 0) { s.sprayWind -= dt; if (s.sprayWind <= 0) s.sprayOn = 1.3; }
        if (s.sprayOn > 0) {
          s.sprayOn -= dt;
          const fwd = new THREE.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw));
          const rel = new THREE.Vector3(p.x - s.x, p.y - 1.0, p.z - s.z);
          const along = rel.dot(fwd);
          if (along > 0 && along < 3.2 && rel.length() < 3.2 && Math.abs(rel.y) < 1.8) store.drain(5 * dt, 12 * dt);
        }
        if (spray.current) {
          spray.current.visible = s.sprayOn > 0 || s.sprayWind > 0;
          (spray.current.material as THREE.MeshBasicMaterial).opacity = s.sprayOn > 0 ? 0.28 : 0.1 + Math.sin(t * 30) * 0.03;
        }
      }

      if (isMak && !cleared) {
        const phase2 = fear > 50;
        const dx0 = p.x - s.x; const dz0 = p.z - s.z;
        const busy = s.mak === 'throw' || s.mak === 'slam';
        let tx = spec.pos[0] + Math.sin(t * 0.5 * spec.patrol * 0.35) * 1.2;
        let tz = spec.pos[1] + Math.cos(t * 0.4 * spec.patrol * 0.35) * 0.5;
        let speed = 0.9;
        if (aware && !stuckHere && !busy && s.mak !== 'recover') {
          tx = p.x + sim.velocity.x * 0.45; tz = p.z + sim.velocity.z * 0.45;
          speed = R.chase * (phase2 ? 1.25 : 1);
          if (Math.hypot(tx - s.x, tz - s.z) < 0.45 * scale) speed = 0;
        }
        if (stuckHere || busy || s.mak === 'recover') speed = 0;
        const dx = tx - s.x; const dz = tz - s.z; const d = Math.hypot(dx, dz);
        const px = s.x; const pz = s.z;
        if (d > 0.001 && speed > 0) { const step = Math.min(d, speed * dt); s.x += (dx / d) * step; s.z += (dz / d) * step; }
        s.x = clamp(s.x, -ROOM.halfX + 1.2, ROOM.halfX - 1.2);
        s.z = clamp(s.z, -ROOM.halfZ + 1.2, ROOM.halfZ - 1.2);
        motion.current.speed = THREE.MathUtils.damp(motion.current.speed, Math.hypot(s.x - px, s.z - pz) / Math.max(dt, 0.001), 6, dt);
        let want = s.yaw;
        if (aware || busy) want = Math.atan2(dx0, dz0);
        else if (Math.hypot(s.x - px, s.z - pz) > 0.0005) want = Math.atan2(s.x - px, s.z - pz);
        const diff = Math.atan2(Math.sin(want - s.yaw), Math.cos(want - s.yaw));
        s.yaw += diff * Math.min(1, dt * (stuckHere ? 0 : 4));
        s.stomp = Math.max(0, s.stomp - dt);
        if (flat < 0.5 * scale && p.y < 0.6 && s.stomp <= 0 && !sim.hidden && !stuckHere && s.mak !== 'slam') { s.stomp = 1.4; store.hurt(R.stomp); }
        s.cd -= dt;
        if (s.mak === 'walk' && s.cd <= 0 && !sim.hidden) { s.mak = flat < 3.8 * (scale / 3.4) * 1.1 ? 'slam' : 'throw'; s.mT = 0; }
        else if (busy) {
          s.mT += dt;
          if (s.mT >= (s.mak === 'slam' ? 1.05 : 0.95) * (phase2 ? 0.75 : 1)) {
            if (s.mak === 'throw') {
              const from = new THREE.Vector3(s.x, 1.0 * scale, s.z);
              const dir = new THREE.Vector3().subVectors(p, from).normalize();
              sim.projectiles.push({ pos: from, vel: dir.multiplyScalar(phase2 ? 8.6 : 7.4), life: 2.6, dmg: 22 });
            } else {
              sim.shake = Math.max(sim.shake, 0.9);
              if (Math.hypot(p.x - s.x, p.z - s.z) < 3.0 && p.y < 1.4 && !sim.hidden) store.hurt(26);
            }
            s.mak = 'recover'; s.mT = 0;
          }
        } else if (s.mak === 'recover') { s.mT += dt; if (s.mT >= (phase2 ? 0.5 : 0.8)) { s.mak = 'walk'; s.cd = phase2 ? 1.6 : 2.5; } }
        if (stuckHere && s.mak !== 'walk') { s.mak = 'walk'; s.cd = 2; }
        s.decay += dt;
        if (s.decay > 0.25) { if (!stuckHere && fear > 0) store.addFear(id, -2.5 * R.decay); s.decay = 0; }
        rec.state = s.mak === 'throw' || s.mak === 'slam' ? 'WORKING' : 'WALKING';
      } else if (!isMak && !cleared) {
        s.decay += dt;
        if (s.decay > 0.25) { if (!stuckHere && fear > 0) store.addFear(id, -2.5 * R.decay * (s.mode === 'fleeing' ? 1.6 : 1)); s.decay = 0; }
      }
    }

    if (isMak && cleared) s.fall = Math.min(1, s.fall + dt * 1.5);
    const lieK = s.lie;
    const surf = spot?.y ?? 0;
    const ySit = surf ? Math.max(0, surf - 0.49 * scale + 0.12) : 0;
    const gy = ySit * s.sit * (1 - lieK) + surf * lieK;
    g.position.set(s.x, gy + s.fall * 0.25, s.z);
    g.rotation.y = s.yaw;
    const rc = sim.recoil[index] ?? 0;
    if (rc > 0) sim.recoil[index] = Math.max(0, rc - dt * 2.2);
    const windup = isMak && s.mak === 'throw' ? Math.min(1, s.mT / 0.95) : 0;
    g.rotation.x = -s.fall * Math.PI / 2.1 - lieK * Math.PI / 2 - Math.sin(rc * Math.PI) * 0.28 + (isMak && s.mak === 'slam' ? Math.min(1, s.mT / 1.05) * 0.18 : 0) + windup * 0.08;
    rec.x = s.x; rec.z = s.z; rec.on = g.visible;

    if (ring.current) {
      const on = sim.target === index && !cleared;
      ring.current.visible = on;
      if (on) {
        ring.current.position.set(0, 1.84 * scale, 0);
        ring.current.rotation.z = t * 1.6;
        ring.current.scale.setScalar(1 + Math.sin(t * 6) * 0.06);
        ring.current.quaternion.copy(state.camera.quaternion);
        ring.current.quaternion.premultiply(g.quaternion.clone().invert());
      }
    }
    const n = sim.notice[index] ?? 0;
    const tele = isMak && (s.mak === 'throw' || s.mak === 'slam') || s.sprayWind > 0;
    if (mark.current) {
      mark.current.visible = !cleared && present && ((n >= 1 && (isMak || spec.role === 'janitor')) || tele || s.mode === 'chase') && !sim.hidden;
      mark.current.position.set(0, 2.62 * scale + Math.sin(t * 8) * 0.04, 0);
      (mark.current.material as THREE.MeshBasicMaterial).color.set(tele ? '#ff2d3d' : '#ffb347');
    }
    if (slam.current) {
      const on = isMak && s.mak === 'slam';
      slam.current.visible = on;
      if (on) { const k = Math.min(1, s.mT / 1.05); slam.current.scale.setScalar(0.35 + k * 0.65); slamMat.opacity = 0.18 + k * 0.4 + Math.sin(t * 24) * 0.05; }
    }
    if (aimLine.current) {
      const on = isMak && s.mak === 'throw';
      aimLine.current.visible = on;
      if (on) { aimLine.current.position.set(0, 0.04, 3.4); aimLine.current.scale.set(1, 1, 6); (aimLine.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + (s.mT / 0.95) * 0.5; }
    }

    const face = sim.humanFaces[index] ?? (sim.humanFaces[index] = new THREE.Vector3());
    const fwd = sim.humanFwd[index] ?? (sim.humanFwd[index] = new THREE.Vector3());
    fwd.set(Math.sin(s.yaw), 0, Math.cos(s.yaw));
    const standY = gy + (1.84 - s.sit * 0.39) * scale - s.fall * 1.4 * scale;
    const standX = s.x + fwd.x * 0.16 * scale;
    const standZ = s.z + fwd.z * 0.16 * scale;
    const lx = s.x - Math.sin(s.yaw) * 1.86 * scale;
    const lz = s.z - Math.cos(s.yaw) * 1.86 * scale;
    face.set(THREE.MathUtils.lerp(standX, lx, lieK), THREE.MathUtils.lerp(standY, gy + 0.3 * scale, lieK), THREE.MathUtils.lerp(standZ, lz, lieK));
  });

  return (
    <group>
      <group ref={group} visible={!isMak}>
        <HumanModel skin={spec.skin} outfit={spec.outfit} hair={spec.hair} style={spec.style} hairStyle={spec.hairStyle} motion={motion} weapon={spec.weapon} scale={scale} fear={fearView} stuck={fearView > 0 && fearView < 100} />
        {spec.role === 'janitor' && (
          <mesh ref={spray} visible={false} position={[0, 1.0 * scale, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[1.0, 3, 20, 1, true]} />
            <meshBasicMaterial color="#b9f0b0" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        )}
        {isMak && (
          <>
            <group ref={slam} visible={false} position={[0, 0.04, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} material={slamMat}>
                <circleGeometry args={[3.0, 48]} />
              </mesh>
            </group>
            <mesh ref={aimLine} visible={false}>
              <boxGeometry args={[0.3, 0.02, 1]} />
              <meshBasicMaterial color="#ff2d3d" transparent opacity={0.4} depthWrite={false} />
            </mesh>
          </>
        )}
        <mesh ref={mark} visible={false}>
          <octahedronGeometry args={[0.18, 0]} />
          <meshBasicMaterial color="#ffb347" depthTest={false} toneMapped={false} />
        </mesh>
        <group ref={ring} visible={false}>
          <mesh>
            <ringGeometry args={[0.34 * scale * 0.4, 0.4 * scale * 0.4, 40]} />
            <meshBasicMaterial color="#ffd77a" transparent opacity={0.9} depthTest={false} toneMapped={false} />
          </mesh>
          {[0, 1, 2, 3].map((n) => (
            <mesh key={n} rotation={[0, 0, (n * Math.PI) / 2]} position={[Math.cos((n * Math.PI) / 2) * 0.5 * scale * 0.4, Math.sin((n * Math.PI) / 2) * 0.5 * scale * 0.4, 0]}>
              <planeGeometry args={[0.05 * scale * 0.4, 0.14 * scale * 0.4]} />
              <meshBasicMaterial color="#ffd77a" depthTest={false} toneMapped={false} />
            </mesh>
          ))}
        </group>
        {!cleared && (!isMak || bossActive) && (
          <Html position={[0, 2.35 * scale, 0]} center distanceFactor={9} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
            <div className={`fear-tag ${spec.role}`}>
              <span>{spec.name}</span>
              <div className="fear-track"><i style={{ width: `${fearView}%` }} /></div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

export function Projectiles() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const run = playing();
    const list = sim.projectiles;
    for (let i = list.length - 1; i >= 0; i--) {
      const pr = list[i];
      if (run) {
        pr.pos.addScaledVector(pr.vel, dt);
        pr.life -= dt;
        if (pr.pos.distanceTo(sim.position) < 0.4) {
          useGame.getState().hurt(pr.dmg ?? 14);
          pr.life = 0;
        }
        if (pr.pos.y < 0.05) pr.life = 0;
      }
      if (pr.life <= 0) list.splice(i, 1);
    }
    meshes.current.forEach((m, i) => {
      if (!m) return;
      const pr = list[i];
      m.visible = !!pr;
      if (pr) {
        m.position.copy(pr.pos);
        m.rotation.y += dt * 14;
      }
    });
  });
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(m) => { meshes.current[i] = m; }} visible={false} castShadow>
          <capsuleGeometry args={[0.07, 0.24, 6, 12]} />
          <Soft color="#4a93c7" rough={0.4} clearcoat={0.6} />
        </mesh>
      ))}
    </>
  );
}

export function Food({ id, position, index }: { id: string; position: [number, number, number]; index: number }) {
  const group = useRef<THREE.Group>(null);
  const collected = useGame((s) => s.collected.includes(id));
  const reward = FOOD_REWARDS[index % 3];
  const y = position[1] + 0.06;
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.9 + index;
    group.current.position.y = y + Math.sin(state.clock.elapsedTime * 2 + index) * 0.04;
    if (collected || !playing()) return;
    const dx = sim.position.x - position[0];
    const dz = sim.position.z - position[2];
    const dy = sim.position.y - y;
    if (Math.hypot(dx, dz) < 0.55 && Math.abs(dy) < 0.6) useGame.getState().collect(id, reward.energy);
  });
  if (collected) return null;
  return (
    <group ref={group} position={[position[0], y, position[2]]}>
      <mesh castShadow>
        <sphereGeometry args={[0.1, 20, 16]} />
        <Soft color={reward.color} rough={0.4} clearcoat={0.5} emissive={reward.color} emissiveIntensity={0.25} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshBasicMaterial color={reward.color} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}

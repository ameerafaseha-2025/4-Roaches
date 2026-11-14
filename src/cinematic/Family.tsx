import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoachModel, RoachPoseContext, type RoachPose } from '../game/RoachModel';
import { FOOD, heading, HOME, intro, lerp, phase, smooth, T } from './timeline';

type Ctl = (t: number, a: Actor) => void;

export type Actor = {
  pos: THREE.Vector3;
  yaw: number;
  tilt: number;
  roll: number;
  scale: number;
  pose: RoachPose;
  prev: THREE.Vector3;
  visible: boolean;
};

const RUG = new THREE.Vector3(1.2, 0, -3.3);
const CHAIN_X = 0.0;

function makeActor(scale: number): Actor {
  return {
    pos: new THREE.Vector3(), yaw: 0, tilt: 0, roll: 0, scale, visible: true, prev: new THREE.Vector3(),
    pose: { speed: 0, flying: false, grounded: true, sprinting: false, velocity: { y: 0 } },
  };
}

function Cast({ actor, ctl, children, flower }: { actor: Actor; ctl: Ctl; children?: ReactNode; flower?: boolean }) {
  const g = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const ctxPose = useMemo(() => actor.pose, [actor]);
  useFrame((_, dt) => {
    if (!g.current || !body.current) return;
    ctl(intro.t, actor);
    const d = Math.max(dt, 0.001);
    const moved = actor.pos.distanceTo(actor.prev) / d;
    actor.pose.speed = THREE.MathUtils.lerp(actor.pose.speed, moved, 0.35);
    actor.pose.velocity.y = (actor.pos.y - actor.prev.y) / d;
    actor.pose.grounded = actor.pos.y < 0.04;
    actor.prev.copy(actor.pos);
    g.current.visible = actor.visible;
    g.current.position.copy(actor.pos);
    g.current.rotation.set(0, actor.yaw, 0);
    g.current.scale.setScalar(actor.scale);
    body.current.rotation.set(actor.tilt, 0, actor.roll);
  });
  return (
    <group ref={g}>
      <group ref={body}>
        <RoachPoseContext.Provider value={ctxPose}>
          <RoachModel />
        </RoachPoseContext.Provider>
        {flower && (
          <group position={[0.07, 0.34, 0.44]}>
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 0.035, Math.sin((i / 5) * Math.PI * 2) * 0.035, 0]}>
                <sphereGeometry args={[0.028, 10, 8]} />
                <meshStandardMaterial color="#ff8fb0" roughness={0.5} />
              </mesh>
            ))}
            <mesh><sphereGeometry args={[0.022, 10, 8]} /><meshStandardMaterial color="#ffe08a" /></mesh>
          </group>
        )}
        {children}
      </group>
    </group>
  );
}

function washed(t: number, a: Actor, seed: number, startX: number, startZ: number) {
  const k = phase(t, T.water, T.reset - 0.4);
  const e = smooth(k);
  a.pos.x = lerp(startX, startX - 1.6 - seed * 0.5, e) + Math.sin(t * 5 + seed) * 0.08 * k;
  a.pos.z = lerp(startZ, startZ + 9 + seed * 1.2, e * e * 0.5 + e * 0.5);
  a.pos.y = 0.14 + Math.sin(t * 7 + seed * 2) * 0.1 * k + 0.2 * k;
  a.yaw += 0.2 + seed * 0.05;
  a.roll = Math.sin(t * 6 + seed) * 0.9 * k;
  a.tilt = Math.cos(t * 5 + seed) * 0.6 * k;
  a.pose.flying = false;
}

function panic(t: number, a: Actor, seed: number, homeX: number, homeZ: number) {
  const k = phase(t, T.disaster + 0.4, T.broom + 1.5);
  const scurry = Math.sin(t * 11 + seed * 3) * 0.35 * k;
  a.pos.x = homeX + scurry + (homeX - HOME.x) * k * 0.4;
  a.pos.z = homeZ + Math.cos(t * 9 + seed) * 0.3 * k + k * 0.4;
  a.pos.y = Math.max(0, Math.sin(t * 13 + seed * 5) * 0.12 * k);
  a.yaw = Math.sin(t * 8 + seed) * 1.6 * k + Math.PI * 0.2;
  a.tilt = 0;
  a.roll = 0;
  a.pose.sprinting = true;
}

function aftermath(t: number, a: Actor, x: number, z: number, faceX: number, faceZ: number, sag: number) {
  const k = smooth(phase(t, T.reset, T.reset + 1.2));
  const breathe = Math.sin(t * 1.5) * 0.01;
  a.pos.set(lerp(x, x, k), 0 + breathe, z);
  a.yaw = heading(x, z, faceX, faceZ);
  a.tilt = sag + Math.sin(t * 1.2) * 0.03;
  a.roll = 0;
  a.pose.sprinting = false;
}

export function Family() {
  const bapak = useMemo(() => makeActor(1.0), []);
  const mak = useMemo(() => makeActor(0.92), []);
  const kids = useMemo(() => [makeActor(0.5), makeActor(0.46), makeActor(0.42)], []);

  const bapakCtl: Ctl = (t, a) => {
    a.pose.sprinting = false;
    a.tilt = 0;
    a.roll = 0;
    a.visible = t > 3;
    const sx = FOOD.x + 0.5;
    const sz = FOOD.z + 0.2;
    if (t < T.family) {
      a.pos.set(sx, 0, sz);
      a.yaw = heading(sx, sz, RUG.x, RUG.z);
    } else if (t < T.disaster) {
      const cycle = (t - T.family) % 5;
      const trips = [0, 1];
      void trips;
      if (cycle < 1.6) {
        const k = smooth(cycle / 1.6);
        a.pos.set(lerp(sx, RUG.x + 0.5, k), 0, lerp(sz, RUG.z + 0.1, k));
        a.yaw = heading(sx, sz, RUG.x, RUG.z);
        a.tilt = -0.05;
      } else if (cycle < 3.4) {
        a.pos.set(RUG.x + 0.5, 0, RUG.z + 0.1);
        const target = kids[Math.floor((t - T.family) / 5) % 3].pos;
        a.yaw = heading(a.pos.x, a.pos.z, target.x, target.z);
        a.tilt = 0.28 + Math.sin(t * 8) * 0.07;
      } else {
        const k = smooth((cycle - 3.4) / 1.6);
        a.pos.set(lerp(RUG.x + 0.5, sx, k), 0, lerp(RUG.z + 0.1, sz, k));
        a.yaw = heading(RUG.x, RUG.z, sx, sz);
      }
    } else if (t < T.water) {
      panic(t, a, 0, sx, sz);
    } else if (t < T.reset) {
      washed(t, a, 0, sx, sz);
    } else if (t < T.invasion) {
      const k = smooth(phase(t, T.reset + 7.5, T.reset + 10));
      aftermath(t, a, sx, sz, lerp(RUG.x, HOME.x - 0.5, k), lerp(RUG.z, HOME.z - 12, k), 0);
      a.tilt = lerp(0.1, -0.04, k);
    } else {
      const k = phase(t, T.invasion + 2.5, T.fade);
      const walk = smooth(k);
      a.pos.set(lerp(sx, sx - 0.3, walk), 0, lerp(sz, -11.5, walk));
      a.yaw = Math.PI + Math.sin(t * 2) * 0.03;
      a.pose.sprinting = false;
    }
  };

  const makCtl: Ctl = (t, a) => {
    a.pose.sprinting = false;
    a.tilt = 0;
    a.roll = 0;
    a.visible = t > 3;
    const hx = RUG.x - 0.8;
    const hz = RUG.z - 0.2;
    if (t < T.disaster) {
      a.pos.set(hx + Math.sin(t * 0.7) * 0.12, 0, hz + Math.cos(t * 0.5) * 0.08);
      const k = Math.floor((t * 0.3) % 3);
      a.yaw = heading(a.pos.x, a.pos.z, kids[k].pos.x, kids[k].pos.z);
      a.tilt = Math.sin(t * 2.4) * 0.06;
    } else if (t < T.water) {
      panic(t, a, 1, hx, hz);
    } else if (t < T.reset) {
      washed(t, a, 1, hx, hz);
    } else if (t < T.invasion) {
      aftermath(t, a, hx, hz, RUG.x + 0.2, RUG.z + 0.1, 0.12);
      a.tilt += Math.sin(t * 3) * 0.04;
      a.yaw += Math.sin(t * 1.3) * 0.25;
    } else {
      aftermath(t, a, hx, hz, FOOD.x, FOOD.z - 10, 0.05);
    }
  };

  const kidCtl = (i: number): Ctl => (t, a) => {
    a.pose.sprinting = false;
    a.tilt = 0;
    a.roll = 0;
    a.visible = t > 3;
    const ang = (i / 3) * Math.PI * 2;
    const bx = RUG.x + Math.cos(ang) * 0.5;
    const bz = RUG.z + Math.sin(ang) * 0.5;
    if (t < T.family) {
      a.pos.set(bx, 0, bz);
      a.yaw = ang + 2;
    } else if (t < T.disaster) {
      const hop = Math.max(0, Math.sin(t * (5 + i * 1.3) + i * 2));
      const circle = t * (0.5 + i * 0.1) + i * 2;
      a.pos.set(RUG.x + Math.cos(circle) * 0.55, hop * 0.2, RUG.z + Math.sin(circle) * 0.5);
      a.yaw = -circle + Math.PI;
      a.tilt = hop * -0.25;
      if (hop > 0.97) a.pose.flying = false;
    } else if (t < T.water) {
      panic(t, a, 2 + i, bx, bz);
    } else if (t < T.reset) {
      washed(t, a, 2 + i, bx, bz);
    } else if (t < T.invasion) {
      const sx = RUG.x + Math.cos(ang) * 0.38;
      const sz = RUG.z + Math.sin(ang) * 0.38;
      aftermath(t, a, sx, sz, RUG.x, RUG.z, 0.38);
      a.tilt += Math.sin(t * 2 + i) * 0.02;
    } else {
      const sx = RUG.x + Math.cos(ang) * 0.38;
      const sz = RUG.z + Math.sin(ang) * 0.38;
      aftermath(t, a, sx, sz, FOOD.x - 0.3, FOOD.z - 10, 0.3);
    }
  };

  void CHAIN_X;
  return (
    <group>
      <Cast actor={bapak} ctl={bapakCtl} />
      <Cast actor={mak} ctl={makCtl} flower />
      {kids.map((k, i) => <Cast key={i} actor={k} ctl={kidCtl(i)} />)}
    </group>
  );
}

export { RUG };

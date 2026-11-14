import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { FEAST_TABLE_TOP, FOOD_REWARDS, LEVELS, type HumanSpec } from './levels';
import { Soft } from './look';
import { HumanModel, type Motion } from './Characters';
import { HUMAN_SCALE } from './world';
import { sim } from './sim';
import { useGame } from './store';

const playing = () => useGame.getState().screen === 'game';

export function Human({ index, spec, id }: { index: number; spec: HumanSpec; id: string }) {
  const group = useRef<THREE.Group>(null);
  const spray = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Group>(null);
  const fear = useGame((s) => s.fear[id] ?? 0);
  const cleared = useGame((s) => s.cleared.includes(id));
  const scale = (spec.scale ?? 1) * HUMAN_SCALE;
  const motion = useRef<Motion>({ speed: 0, alert: 0 });
  const st = useRef({ yaw: 0, stomp: 0, throwT: 1.5 + index, sprayT: 2 + index, sprayOn: 0, decay: 0, fall: 0, x: spec.pos[0], z: spec.pos[1] });

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const s = st.current;
    const t = state.clock.elapsedTime;
    const run = playing();
    const stuckHere = sim.stuckTo === index;
    const p = sim.position;

    const stunned = (sim.stun[index] ?? 0) > 0;
    if (run && !cleared) {
      const patrol = stunned ? 0 : spec.patrol * 0.35;
      const px = s.x;
      const pz = s.z;
      s.x = spec.pos[0] + Math.sin(t * 0.5 * patrol + index * 2) * 1.2;
      s.z = spec.pos[1] + Math.cos(t * 0.4 * patrol + index) * 0.5 + (fear > 50 ? -0.2 : 0);
      motion.current.speed = THREE.MathUtils.damp(motion.current.speed, Math.hypot(s.x - px, s.z - pz) / Math.max(dt, 0.001), 6, dt);
      const toRoach = Math.atan2(p.x - s.x, p.z - s.z);
      let diff = toRoach - s.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const aware = !sim.hidden && !stunned;
      s.yaw += diff * Math.min(1, dt * (stuckHere || !aware ? 0 : 2.2 + spec.patrol));

      const flat = Math.hypot(p.x - s.x, p.z - s.z);
      s.stomp = Math.max(0, s.stomp - dt);
      const detect = (7 + spec.patrol * 1.2) * (1 - useGame.getState().stats.detectionResistance) * (sim.hidden ? 0 : 1);
      if (flat < 0.5 * scale && p.y < 0.6 && s.stomp <= 0 && !sim.hidden && !stunned) {
        s.stomp = 1.4;
        useGame.getState().hurt(spec.weapon ? 14 : 9);
      }

      if (spec.weapon === 'slipper') {
        s.throwT -= dt;
        if (s.throwT <= 0 && flat < detect && !stunned && !sim.hidden) {
          s.throwT = 2.6;
          const from = new THREE.Vector3(s.x, 1.0 * scale, s.z);
          const dir = new THREE.Vector3().subVectors(p, from).normalize();
          sim.projectiles.push({ pos: from, vel: dir.multiplyScalar(6.5), life: 2.4 });
        }
      }
      if (spec.weapon === 'spray') {
        s.sprayT -= dt;
        if (stunned) s.sprayOn = 0;
        if (s.sprayT <= 0 && !stunned && !sim.hidden && flat < detect) { s.sprayOn = 1.4; s.sprayT = 3.6; }
        if (s.sprayOn > 0) {
          s.sprayOn -= dt;
          const fwd = new THREE.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw));
          const rel = new THREE.Vector3(p.x - s.x, p.y - 1.0, p.z - s.z);
          const along = rel.dot(fwd);
          if (along > 0 && along < 3.2 && rel.length() < 3.2 && Math.abs(rel.y) < 1.8) {
            useGame.getState().drain(5 * dt, 12 * dt);
          }
        }
        if (spray.current) spray.current.visible = s.sprayOn > 0;
      }

      s.decay += dt;
      if (s.decay > 0.25) {
        if (!stuckHere && fear > 0) useGame.getState().addFear(id, -2.5);
        s.decay = 0;
      }
    }

    if (cleared) s.fall = Math.min(1, s.fall + dt * 1.5);
    g.position.set(s.x, 0, s.z);
    g.rotation.y = s.yaw;
    const rc = sim.recoil[index] ?? 0;
    if (rc > 0) sim.recoil[index] = Math.max(0, rc - dt * 2.2);
    g.rotation.x = -s.fall * Math.PI / 2.1 - Math.sin(rc * Math.PI) * 0.28;
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
    g.position.y = s.fall * 0.25;

    const face = sim.humanFaces[index] ?? (sim.humanFaces[index] = new THREE.Vector3());
    const fwd = sim.humanFwd[index] ?? (sim.humanFwd[index] = new THREE.Vector3());
    fwd.set(Math.sin(s.yaw), 0, Math.cos(s.yaw));
    face.set(s.x + fwd.x * 0.16 * scale, 1.84 * scale - s.fall * 1.4 * scale, s.z + fwd.z * 0.16 * scale);
  });

  return (
    <group>
      <group ref={group}>
        <HumanModel skin={spec.skin} outfit={spec.outfit} hair={spec.hair} style={spec.style} hairStyle={spec.hairStyle} motion={motion} weapon={spec.weapon} scale={scale} fear={fear} stuck={fear > 0 && fear < 100} />
        {spec.weapon === 'spray' && (
          <mesh ref={spray} visible={false} position={[0, 1.0 * scale, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[1.0, 3, 20, 1, true]} />
            <meshBasicMaterial color="#b9f0b0" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        )}
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
        {!cleared && (
          <Html position={[0, 2.35 * scale, 0]} center distanceFactor={9} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
            <div className="fear-tag">
              <span>{spec.name}</span>
              <div className="fear-track"><i style={{ width: `${fear}%` }} /></div>
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
          useGame.getState().hurt(14);
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

export function Food({ id, position, index, level }: { id: string; position: [number, number, number]; index: number; level: number }) {
  const group = useRef<THREE.Group>(null);
  const collected = useGame((s) => s.collected.includes(id));
  const feast = LEVELS[level - 1].kind === 'feast';
  const reward = FOOD_REWARDS[index % 3];
  const y = feast ? FEAST_TABLE_TOP + 0.28 : position[1] + 0.06;
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
      {feast ? (
        <>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.24, 0.1, 28]} />
            <Soft color="#f4d77a" rough={0.2} clearcoat={1} />
          </mesh>
          <mesh position={[0, 0.12, 0]} castShadow>
            <sphereGeometry args={[0.15, 28, 20]} />
            <Soft color={['#e8786a', '#f3c98a', '#d6d36c'][index % 3]} rough={0.35} clearcoat={0.6} />
          </mesh>
        </>
      ) : (
        <mesh castShadow>
          <sphereGeometry args={[0.1, 20, 16]} />
          <Soft color={reward.color} rough={0.4} clearcoat={0.5} emissive={reward.color} emissiveIntensity={0.25} />
        </mesh>
      )}
      <pointLight intensity={0.8} distance={1.4} color={reward.color} />
    </group>
  );
}

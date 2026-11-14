import * as THREE from 'three';

export type Shot = {
  at: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov?: number;
  ease?: 'linear' | 'smooth';
  cut?: boolean;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

export class CinematicCamera {
  private shots: Shot[];
  private shakeAmount = 0;
  private roll = 0;
  private readonly p = new THREE.Vector3();
  private readonly l = new THREE.Vector3();
  private readonly a = new THREE.Vector3();
  private readonly b = new THREE.Vector3();

  constructor(shots: Shot[]) {
    this.shots = [...shots].sort((x, y) => x.at - y.at);
  }

  shake(amount: number) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  setRoll(roll: number) {
    this.roll = roll;
  }

  update(time: number, dt: number, camera: THREE.PerspectiveCamera) {
    const shots = this.shots;
    let i = 0;
    while (i < shots.length - 1 && time >= shots[i + 1].at) i++;
    const from = shots[i];
    const to = shots[Math.min(i + 1, shots.length - 1)];
    let k = 0;
    if (to !== from && !to.cut) {
      k = THREE.MathUtils.clamp((time - from.at) / (to.at - from.at), 0, 1);
      if ((to.ease ?? 'smooth') === 'smooth') k = smooth(k);
    }
    this.p.set(...from.pos).lerp(this.a.set(...to.pos), k);
    this.l.set(...from.look).lerp(this.b.set(...to.look), k);
    const fov = THREE.MathUtils.lerp(from.fov ?? 50, to.fov ?? from.fov ?? 50, k);

    if (this.shakeAmount > 0.001) {
      const s = this.shakeAmount;
      this.p.x += (Math.random() - 0.5) * s * 0.18;
      this.p.y += (Math.random() - 0.5) * s * 0.18;
      this.p.z += (Math.random() - 0.5) * s * 0.18;
      this.shakeAmount = Math.max(0, this.shakeAmount - dt * 1.6);
    }

    camera.position.copy(this.p);
    camera.lookAt(this.l);
    if (this.roll) camera.rotateZ(this.roll);
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }
}

export const fpsMeter = {
  fps: 0,
  acc: 0,
  frames: 0,
  sample(delta: number) {
    this.acc += delta;
    this.frames += 1;
    if (this.acc >= 0.5) {
      this.fps = Math.round(this.frames / this.acc);
      this.acc = 0;
      this.frames = 0;
    }
  },
};

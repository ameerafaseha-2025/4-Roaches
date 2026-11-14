let ctx: AudioContext | undefined;
let master: GainNode | undefined;
let noiseBuffer: AudioBuffer | undefined;
let musicTimer: number | undefined;
let tension = 0;
let step = 0;
let waterGain: GainNode | undefined;
let waterNodes: AudioNode[] = [];

import { prefs } from '../game/prefs';

const volume = () => prefs.master / 100;
const enabled = () => prefs.sfxOn;
const musicEnabled = () => prefs.musicOn;

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.connect(ctx.destination);
    const len = ctx.sampleRate * 2;
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  master!.gain.value = volume();
  return ctx;
}

function noise(c: AudioContext, filterType: BiquadFilterType, freq: number, q = 0.7) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer!;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = filterType;
  f.frequency.value = freq;
  f.Q.value = q;
  src.connect(f);
  return { src, filter: f };
}

export const CinematicAudio = {
  unlock() {
    try { audio(); } catch { /* audio unavailable */ }
  },

  setTension(value: number) {
    tension = value;
  },

  startMusic() {
    if (musicTimer || !musicEnabled()) return;
    try {
      const c = audio();
      const calm = [0, 4, 7, 11, 12, 11, 7, 4];
      const dark = [0, 1, 6, 7, 0, 1, 6, 3];
      step = 0;
      const tick = () => {
        if (!musicEnabled()) return;
        const now = c.currentTime;
        const scale = tension > 0.5 ? dark : calm;
        const root = tension > 0.5 ? 110 : 174.6;
        const note = root * Math.pow(2, scale[step % scale.length] / 12);
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = tension > 0.5 ? 'sawtooth' : 'triangle';
        osc.frequency.value = note;
        const level = 0.035 + tension * 0.03;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(level, now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + (tension > 0.5 ? 0.3 : 0.7));
        osc.connect(g);
        g.connect(master!);
        osc.start(now);
        osc.stop(now + 0.8);
        if (tension > 0.5 && step % 2 === 0) CinematicAudio.thump(0.5);
        step++;
      };
      tick();
      musicTimer = window.setInterval(tick, 480);
    } catch { /* audio unavailable */ }
  },

  stopMusic() {
    if (musicTimer) window.clearInterval(musicTimer);
    musicTimer = undefined;
    tension = 0;
  },

  thump(strength = 1) {
    if (!enabled()) return;
    try {
      const c = audio();
      const now = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.3);
      g.gain.setValueAtTime(0.28 * strength, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(g);
      g.connect(master!);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch { /* audio unavailable */ }
  },

  footstep() {
    CinematicAudio.thump(1.4);
    if (!enabled()) return;
    try {
      const c = audio();
      const { src, filter } = noise(c, 'lowpass', 220);
      const g = c.createGain();
      const now = c.currentTime;
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      filter.connect(g);
      g.connect(master!);
      src.start(now);
      src.stop(now + 0.3);
    } catch { /* audio unavailable */ }
  },

  broomSweep(duration = 0.7) {
    if (!enabled()) return;
    try {
      const c = audio();
      const { src, filter } = noise(c, 'bandpass', 1800, 0.9);
      const g = c.createGain();
      const now = c.currentTime;
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.linearRampToValueAtTime(3200, now + duration);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.14, now + duration * 0.4);
      g.gain.linearRampToValueAtTime(0.0001, now + duration);
      filter.connect(g);
      g.connect(master!);
      src.start(now);
      src.stop(now + duration + 0.05);
    } catch { /* audio unavailable */ }
  },

  impact() {
    CinematicAudio.thump(2.2);
    if (!enabled()) return;
    try {
      const c = audio();
      const { src, filter } = noise(c, 'lowpass', 900);
      const g = c.createGain();
      const now = c.currentTime;
      g.gain.setValueAtTime(0.4, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      filter.connect(g);
      g.connect(master!);
      src.start(now);
      src.stop(now + 1);
    } catch { /* audio unavailable */ }
  },

  squeak() {
    if (!enabled()) return;
    try {
      const c = audio();
      const now = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100 + Math.random() * 500, now);
      osc.frequency.exponentialRampToValueAtTime(1900 + Math.random() * 600, now + 0.09);
      g.gain.setValueAtTime(0.05, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(g);
      g.connect(master!);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch { /* audio unavailable */ }
  },

  setWater(level: number) {
    if (!enabled()) level = 0;
    try {
      const c = audio();
      if (!waterGain) {
        const a = noise(c, 'lowpass', 700, 0.4);
        const b = noise(c, 'bandpass', 1500, 0.5);
        waterGain = c.createGain();
        waterGain.gain.value = 0;
        a.filter.connect(waterGain);
        b.filter.connect(waterGain);
        waterGain.connect(master!);
        a.src.start();
        b.src.start();
        waterNodes = [a.src, b.src];
      }
      waterGain.gain.setTargetAtTime(level * 0.12, c.currentTime, 0.2);
    } catch { /* audio unavailable */ }
  },

  stopAll() {
    CinematicAudio.stopMusic();
    try {
      if (waterGain && ctx) waterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      const nodes = waterNodes;
      window.setTimeout(() => {
        nodes.forEach((n) => { try { (n as AudioBufferSourceNode).stop(); } catch { /* already stopped */ } });
      }, 500);
      waterNodes = [];
      waterGain = undefined;
    } catch { /* audio unavailable */ }
  },
};

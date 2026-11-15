let context: AudioContext | undefined;
let master: GainNode | undefined;
let musicTimer: number | undefined;
let wing: { osc: OscillatorNode; gain: GainNode } | undefined;

type Kind = 'ui' | 'eat' | 'attack' | 'hurt' | 'win' | 'scream' | 'whoosh' | 'impact';

import { prefs } from './prefs';

const readVolume = () => prefs.master / 100;
const musicOn = () => prefs.musicOn;
const sfxOn = () => prefs.sfxOn;
const sfxLevel = () => prefs.sfx / 100;
const musicLevel = () => prefs.music / 100;

function ctx() {
  context ??= new AudioContext();
  if (!master) {
    master = context.createGain();
    master.connect(context.destination);
  }
  if (context.state === 'suspended') void context.resume();
  master.gain.value = readVolume();
  return context;
}

export function refreshVolume() {
  if (master) master.gain.value = readVolume();
  if (!musicOn()) stopMusic();
}

export function sound(kind: Kind = 'ui') {
  if (!sfxOn()) return;
  try {
    const c = ctx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    const tones: Record<Kind, [number, number, number]> = {
      ui: [520, 760, 0.14],
      eat: [220, 520, 0.16],
      attack: [180, 90, 0.2],
      hurt: [140, 55, 0.3],
      win: [440, 880, 0.5],
      scream: [900, 1500, 0.45],
      whoosh: [420, 140, 0.18],
      impact: [150, 38, 0.28],
    };
    const [a, b, len] = tones[kind];
    osc.type = kind === 'hurt' || kind === 'scream' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(a, now);
    osc.frequency.exponentialRampToValueAtTime(b, now + len);
    gain.gain.setValueAtTime(0.09 * sfxLevel(), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + len + 0.04);
    osc.connect(gain);
    gain.connect(master!);
    osc.start(now);
    osc.stop(now + len + 0.06);
  } catch (error) {
    console.warn('Audio unavailable.', error);
  }
}

let noiseBuf: AudioBuffer | undefined;
function noiseSource(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  return s;
}

type Burst = { at?: number; dur: number; freq: number; to?: number; q?: number; gain: number; type?: BiquadFilterType };
function noiseBurst(c: AudioContext, b: Burst) {
  const t = c.currentTime + (b.at ?? 0);
  const src = noiseSource(c);
  const f = c.createBiquadFilter();
  const g = c.createGain();
  f.type = b.type ?? 'bandpass';
  f.frequency.setValueAtTime(b.freq, t);
  if (b.to) f.frequency.exponentialRampToValueAtTime(b.to, t + b.dur);
  f.Q.value = b.q ?? 1;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(b.gain * sfxLevel(), t + Math.min(0.02, b.dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + b.dur);
  src.connect(f); f.connect(g); g.connect(master!);
  src.start(t, Math.random() * 0.5);
  src.stop(t + b.dur + 0.05);
}

function tone(c: AudioContext, at: number, dur: number, a: number, b: number, gain: number, type: OscillatorType = 'sine') {
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(a, t);
  o.frequency.exponentialRampToValueAtTime(b, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain * sfxLevel(), t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master!);
  o.start(t);
  o.stop(t + dur + 0.04);
}

function safe(fn: (c: AudioContext) => void) {
  if (!sfxOn()) return;
  try { fn(ctx()); } catch { /* audio unavailable */ }
}

export const doorSfx = {
  latch: () => safe((c) => { noiseBurst(c, { dur: 0.05, freq: 2600, q: 3, gain: 0.07 }); tone(c, 0, 0.05, 1500, 900, 0.03, 'square'); noiseBurst(c, { at: 0.07, dur: 0.06, freq: 1800, q: 2, gain: 0.06 }); }),
  creak: (dur: number) => safe((c) => {
    const t = c.currentTime;
    const o = c.createOscillator(); const f = c.createBiquadFilter(); const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(70, t);
    o.frequency.linearRampToValueAtTime(130, t + dur * 0.5);
    o.frequency.linearRampToValueAtTime(95, t + dur);
    f.type = 'bandpass'; f.frequency.setValueAtTime(520, t); f.frequency.linearRampToValueAtTime(900, t + dur * 0.6); f.Q.value = 7;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045 * sfxLevel(), t + 0.12);
    g.gain.setValueAtTime(0.04 * sfxLevel(), t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(master!);
    o.start(t); o.stop(t + dur + 0.05);
    noiseBurst(c, { dur, freq: 300, to: 500, q: 0.7, gain: 0.02, type: 'lowpass' });
  }),
  thud: () => safe((c) => { tone(c, 0, 0.22, 95, 38, 0.16); noiseBurst(c, { dur: 0.12, freq: 420, q: 0.8, gain: 0.07, type: 'lowpass' }); }),
  locked: () => safe((c) => { for (let i = 0; i < 3; i++) { noiseBurst(c, { at: i * 0.075, dur: 0.045, freq: 2200 - i * 250, q: 3, gain: 0.05 }); tone(c, i * 0.075, 0.04, 700, 400, 0.025, 'square'); } }),
};

let lastStep = 0;
export function footstep(running = false, vol = 1) {
  const now = performance.now();
  if (now - lastStep < (running ? 90 : 160)) return;
  lastStep = now;
  safe((c) => noiseBurst(c, { dur: running ? 0.07 : 0.09, freq: 900 + Math.random() * 500, to: 300, q: 0.9, gain: (running ? 0.05 : 0.035) * vol, type: 'lowpass' }));
}

export const voiceSfx = {
  gasp: (vol = 1) => safe((c) => { noiseBurst(c, { dur: 0.22, freq: 1400, to: 2600, q: 1.4, gain: 0.05 * vol }); tone(c, 0.02, 0.2, 380, 560, 0.02 * vol, 'triangle'); }),
  hm: (vol = 1) => safe((c) => { tone(c, 0, 0.28, 190, 150, 0.025 * vol, 'triangle'); tone(c, 0.3, 0.2, 170, 210, 0.02 * vol, 'triangle'); }),
  scream: (pitch = 1, vol = 1) => safe((c) => { tone(c, 0, 0.5, 620 * pitch, 1180 * pitch, 0.032 * vol, 'sawtooth'); tone(c, 0.06, 0.4, 930 * pitch, 1500 * pitch, 0.014 * vol, 'triangle'); noiseBurst(c, { dur: 0.4, freq: 2200, q: 1.2, gain: 0.015 * vol }); }),
};

export function setWingBuzz(on: boolean, intensity = 1) {
  if (!sfxOn()) on = false;
  try {
    if (on && !wing) {
      const c = ctx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 110;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(master!);
      osc.start();
      wing = { osc, gain };
    }
    if (wing && context) {
      wing.gain.gain.setTargetAtTime(on ? 0.03 * intensity * sfxLevel() : 0, context.currentTime, 0.08);
      wing.osc.frequency.setTargetAtTime(100 + intensity * 25, context.currentTime, 0.1);
    }
  } catch {
    /* audio unavailable */
  }
}

const SCALE = [0, 3, 7, 10, 12, 10, 7, 3];

export function startMusic() {
  if (musicTimer || !musicOn()) return;
  try {
    const c = ctx();
    let step = 0;
    const tick = () => {
      if (!musicOn()) return;
      const now = c.currentTime;
      const root = step % 16 < 8 ? 196 : 174.6;
      const note = root * Math.pow(2, SCALE[step % SCALE.length] / 12);
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = note;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.045 * musicLevel()), now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      osc.connect(gain);
      gain.connect(master!);
      osc.start(now);
      osc.stop(now + 0.55);
      step += 1;
    };
    tick();
    musicTimer = window.setInterval(tick, 420);
  } catch {
    /* audio unavailable */
  }
}

export function stopMusic() {
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = undefined;
}

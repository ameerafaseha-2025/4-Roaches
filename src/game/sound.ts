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

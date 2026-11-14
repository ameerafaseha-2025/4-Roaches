export type Quality = 'High' | 'Balanced' | 'Low';

export type Prefs = {
  master: number;
  music: number;
  sfx: number;
  musicOn: boolean;
  sfxOn: boolean;
  quality: Quality;
  shadows: boolean;
  fov: number;
  showFps: boolean;
  sensitivity: number;
  invertY: boolean;
  shake: number;
  tutorial: boolean;
  subtitles: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  master: 65,
  music: 70,
  sfx: 80,
  musicOn: true,
  sfxOn: true,
  quality: 'High',
  shadows: true,
  fov: 56,
  showFps: false,
  sensitivity: 100,
  invertY: false,
  shake: 100,
  tutorial: true,
  subtitles: true,
};

const KEYS: Record<keyof Prefs, string> = {
  master: 'roach-volume',
  music: 'roach-music-vol',
  sfx: 'roach-sfx-vol',
  musicOn: 'roach-music',
  sfxOn: 'roach-sfx',
  quality: 'roach-quality',
  shadows: 'roach-shadows',
  fov: 'roach-fov',
  showFps: 'roach-fps',
  sensitivity: 'roach-sensitivity',
  invertY: 'roach-invert',
  shake: 'roach-shake',
  tutorial: 'roach-tutorial',
  subtitles: 'roach-subtitles',
};

const read = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};

const num = (key: string, fallback: number, min: number, max: number) => {
  const raw = read(key);
  const n = raw === null ? NaN : Number(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const flag = (key: string, fallback: boolean) => {
  const raw = read(key);
  return raw === null ? fallback : raw !== 'off';
};

export function loadPrefs(): Prefs {
  const quality = read(KEYS.quality);
  return {
    master: num(KEYS.master, DEFAULT_PREFS.master, 0, 100),
    music: num(KEYS.music, DEFAULT_PREFS.music, 0, 100),
    sfx: num(KEYS.sfx, DEFAULT_PREFS.sfx, 0, 100),
    musicOn: flag(KEYS.musicOn, DEFAULT_PREFS.musicOn),
    sfxOn: flag(KEYS.sfxOn, DEFAULT_PREFS.sfxOn),
    quality: quality === 'Balanced' || quality === 'Low' || quality === 'High' ? quality : DEFAULT_PREFS.quality,
    shadows: flag(KEYS.shadows, DEFAULT_PREFS.shadows),
    fov: num(KEYS.fov, DEFAULT_PREFS.fov, 45, 80),
    showFps: flag(KEYS.showFps, DEFAULT_PREFS.showFps) && read(KEYS.showFps) !== null,
    sensitivity: num(KEYS.sensitivity, DEFAULT_PREFS.sensitivity, 30, 200),
    invertY: flag(KEYS.invertY, DEFAULT_PREFS.invertY) && read(KEYS.invertY) !== null,
    shake: num(KEYS.shake, DEFAULT_PREFS.shake, 0, 100),
    tutorial: flag(KEYS.tutorial, DEFAULT_PREFS.tutorial),
    subtitles: flag(KEYS.subtitles, DEFAULT_PREFS.subtitles),
  };
}

export const prefs: Prefs = loadPrefs();

export function savePrefs(next: Prefs) {
  Object.assign(prefs, next);
  try {
    (Object.keys(KEYS) as (keyof Prefs)[]).forEach((k) => {
      const v = prefs[k];
      localStorage.setItem(KEYS[k], typeof v === 'boolean' ? (v ? 'on' : 'off') : String(v));
    });
  } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event('prefs-change'));
}

import { DEFAULT_COSMETICS, type CosmeticSlot } from './CosmeticsConfig';
import type { MutationId } from './MutationConfig';

export const SAVE_KEY = 'lipas-save';
export const SAVE_VERSION = 1;
export const MAX_LEVEL = 5;

export type SaveData = {
  version: number;
  coins: number;
  lifetimeCoins: number;
  owned: MutationId[];
  equipped: MutationId;
  skills: Record<string, number>;
  cosmeticsOwned: string[];
  cosmeticsEquipped: Record<CosmeticSlot, string>;
  unlocked: number;
  reached: number;
  score: number;
  claimed: string[];
  bestFear: Record<string, number>;
  finished: boolean;
};

const MUTATION_IDS: MutationId[] = ['basic', 'tank', 'thunder', 'aero', 'shadow', 'royal'];
const SLOTS: CosmeticSlot[] = ['wing', 'shell', 'antenna', 'fx', 'accessory'];

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    coins: 0,
    lifetimeCoins: 0,
    owned: ['basic'],
    equipped: 'basic',
    skills: {},
    cosmeticsOwned: Object.values(DEFAULT_COSMETICS),
    cosmeticsEquipped: { ...DEFAULT_COSMETICS },
    unlocked: 1,
    reached: 1,
    score: 0,
    claimed: [],
    bestFear: {},
    finished: false,
  };
}

const num = (v: unknown, fallback: number, min = 0, max = 1e9) => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
};
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export function sanitize(raw: unknown): SaveData {
  const base = defaultSave();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const owned = strings(r.owned).filter((m): m is MutationId => (MUTATION_IDS as string[]).includes(m));
  if (!owned.includes('basic')) owned.unshift('basic');
  const equipped = (MUTATION_IDS as string[]).includes(r.equipped as string) && owned.includes(r.equipped as MutationId) ? (r.equipped as MutationId) : 'basic';
  const skills: Record<string, number> = {};
  if (r.skills && typeof r.skills === 'object') {
    for (const [k, v] of Object.entries(r.skills as Record<string, unknown>)) skills[k] = num(v, 0, 0, 3);
  }
  const cosmeticsOwned = Array.from(new Set([...base.cosmeticsOwned, ...strings(r.cosmeticsOwned)]));
  const cosmeticsEquipped = { ...base.cosmeticsEquipped };
  if (r.cosmeticsEquipped && typeof r.cosmeticsEquipped === 'object') {
    for (const slot of SLOTS) {
      const id = (r.cosmeticsEquipped as Record<string, unknown>)[slot];
      if (typeof id === 'string' && cosmeticsOwned.includes(id)) cosmeticsEquipped[slot] = id;
    }
  }
  const bestFear: Record<string, number> = {};
  if (r.bestFear && typeof r.bestFear === 'object') {
    for (const [k, v] of Object.entries(r.bestFear as Record<string, unknown>)) bestFear[k] = num(v, 0, 0, 100);
  }
  const unlocked = num(r.unlocked, 1, 1, MAX_LEVEL);
  return {
    version: SAVE_VERSION,
    coins: num(r.coins, 0),
    lifetimeCoins: num(r.lifetimeCoins, 0),
    owned,
    equipped,
    skills,
    cosmeticsOwned,
    cosmeticsEquipped,
    unlocked,
    reached: Math.max(unlocked, num(r.reached, 1, 1, MAX_LEVEL)),
    finished: r.finished === true,
    score: num(r.score, 0),
    claimed: strings(r.claimed),
    bestFear,
  };
}

function migrate(raw: unknown): SaveData {
  const data = sanitize(raw);
  return data;
}

function legacy(): Partial<SaveData> {
  const unlocked = Number(localStorage.getItem('roach-rampage-unlocked') || '1');
  const score = Number(localStorage.getItem('roach-rampage-score') || '0');
  return { unlocked: Number.isFinite(unlocked) ? unlocked : 1, score: Number.isFinite(score) ? score : 0 };
}

export function loadSave(): SaveData {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (text) {
      const parsed = JSON.parse(text) as unknown;
      return migrate(parsed);
    }
  } catch (error) {
    console.warn('Save data was unreadable and has been reset.', error);
    try { localStorage.setItem(`${SAVE_KEY}-corrupt-backup`, localStorage.getItem(SAVE_KEY) ?? ''); } catch { /* storage full */ }
  }
  return sanitize({ ...defaultSave(), ...legacy() });
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    localStorage.setItem('roach-rampage-unlocked', String(data.unlocked));
    localStorage.setItem('roach-rampage-score', String(data.score));
  } catch (error) {
    console.warn('Could not write save data.', error);
  }
}

export function eraseSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('roach-rampage-unlocked');
    localStorage.removeItem('roach-rampage-score');
  } catch { /* storage unavailable */ }
}

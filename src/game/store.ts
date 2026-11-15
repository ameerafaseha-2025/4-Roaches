import { create } from 'zustand';
import { LEVELS } from './levels';
import { resetTutorial } from './input';
import { sim } from './sim';
import { cosmeticById } from '../progression/CosmeticsConfig';
import type { CosmeticSlot } from '../progression/CosmeticsConfig';
import { canBuyMutation, computeStats, earnedMutations, secondWindHeal } from '../progression/MutationManager';
import { MUTATIONS, type MutationId, type Stats } from '../progression/MutationConfig';
import { eraseSave, loadSave, writeSave, type SaveData } from '../progression/SaveManager';
import { nextSkillCost, skillById } from '../progression/SkillManager';

export type Screen =
  | 'loading' | 'menu' | 'intro' | 'story' | 'level-select' | 'collection' | 'evolution' | 'shop'
  | 'how-to-play' | 'settings' | 'credits' | 'game' | 'paused' | 'game-over' | 'level-complete' | 'finale' | 'ending';

export type Reward = { label: string; amount: number };
export type RunResult = {
  level: number;
  rewards: Reward[];
  coins: number;
  time: number;
  newMutations: MutationId[];
  firstClear: boolean;
};

type Persisted = Pick<SaveData, 'coins' | 'lifetimeCoins' | 'owned' | 'equipped' | 'skills' | 'cosmeticsOwned' | 'cosmeticsEquipped' | 'unlocked' | 'reached' | 'score' | 'claimed' | 'finished'>;

type GameStore = Persisted & {
  screen: Screen;
  level: number;
  runId: number;
  health: number;
  maxHealth: number;
  energy: number;
  stamina: number;
  maxStamina: number;
  stats: Stats;
  fear: Record<string, number>;
  cleared: string[];
  collected: string[];
  bossActive: boolean;
  bossDefeated: boolean;
  exitUnlocked: boolean;
  runClaims: string[];
  rewards: Reward[];
  runStart: number;
  damageTaken: number;
  result: RunResult | null;
  message: string;
  messageUntil: number;
  warning: string;
  warningUntil: number;
  history: Screen[];
  inGame: boolean;
  previewMutation: MutationId;
  previewCosmetics: Partial<Record<CosmeticSlot, string>> | null;
  setPreview: (id: MutationId) => void;
  setPreviewCosmetics: (c: Partial<Record<CosmeticSlot, string>> | null) => void;
  startLevel: (level: number) => void;
  setScreen: (screen: Screen) => void;
  navigate: (screen: Screen) => void;
  back: () => void;
  warn: (message: string) => void;
  addFear: (id: string, amount: number) => void;
  collect: (id: string, energy: number) => void;
  hurt: (amount: number) => void;
  drain: (healthAmount: number, energyAmount: number) => void;
  spendEnergy: (amount: number) => void;
  spendStamina: (amount: number) => void;
  refill: (amount: number) => void;
  regenStamina: (amount: number) => void;
  heal: (amount: number) => void;
  advance: () => void;
  toast: (message: string) => void;
  buyMutation: (id: MutationId) => { ok: boolean; reason?: string };
  equipMutation: (id: MutationId) => boolean;
  buySkill: (id: string) => { ok: boolean; reason?: string };
  buyCosmetic: (id: string) => { ok: boolean; reason?: string };
  equipCosmetic: (id: string) => boolean;
  resetSave: () => void;
};

const saved = loadSave();

const freshRun = () => ({
  fear: {} as Record<string, number>,
  cleared: [] as string[],
  collected: [] as string[],
  bossActive: false,
  bossDefeated: false,
  exitUnlocked: false,
  runClaims: [] as string[],
  rewards: [] as Reward[],
  damageTaken: 0,
});

const GAME_FAMILY: ReadonlySet<Screen> = new Set<Screen>(['game', 'paused', 'game-over', 'level-complete']);
const OVERLAY: ReadonlySet<Screen> = new Set<Screen>(['settings', 'how-to-play']);
const place = (screen: Screen, inGame: boolean) => ({ screen, inGame: GAME_FAMILY.has(screen) ? true : OVERLAY.has(screen) ? inGame : false });

const foodCoins = (level: number) => 3 + Math.floor(level / 2);
const terrifyCoins = (level: number, index: number) => {
  const h = LEVELS[level - 1].humans[index];
  if (h?.role === 'mak') return 250;
  if (h?.role === 'janitor') return 90;
  return 12 + 4 * level;
};
const clearCoins = (level: number) => (LEVELS[level - 1].kind === 'boss' ? 350 : 40 + 25 * level);
const parTime = (level: number) => 75 + 25 * LEVELS[level - 1].humans.length;

export const useGame = create<GameStore>((set, get) => {
  const persist = () => {
    const s = get();
    writeSave({
      version: 1, coins: s.coins, lifetimeCoins: s.lifetimeCoins, owned: s.owned, equipped: s.equipped, skills: s.skills,
      cosmeticsOwned: s.cosmeticsOwned, cosmeticsEquipped: s.cosmeticsEquipped, unlocked: s.unlocked, reached: s.reached,
      score: s.score, claimed: s.claimed, bestFear: {}, finished: s.finished,
    });
  };

  const award = (key: string, base: number, label: string) => {
    const s = get();
    if (s.runClaims.includes(key)) return 0;
    if (s.claimed.includes(key)) {
      set({ runClaims: [...s.runClaims, key] });
      return 0;
    }
    const amount = Math.max(1, Math.round(base));
    set({
      coins: s.coins + amount,
      lifetimeCoins: s.lifetimeCoins + amount,
      claimed: [...s.claimed, key],
      runClaims: [...s.runClaims, key],
      rewards: [...s.rewards, { label, amount }],
    });
    persist();
    return amount;
  };

  const mitigate = (amount: number, rollDodge: boolean) => {
    const s = get();
    if (sim.invuln > 0) return 0;
    if (rollDodge && Math.random() < s.stats.dodgeChance) {
      set({ message: 'DODGED!', messageUntil: Date.now() + 900 });
      return 0;
    }
    let m = 1 - s.stats.defence;
    if (sim.fx.shield > 0) m *= 0.3;
    if (sim.fx.rage > 0) m *= 0.5;
    return amount * m;
  };

  const afterDamage = (health: number) => {
    const s = get();
    if (health <= 0) { set({ health: 0, screen: 'game-over' }); return; }
    const heal = secondWindHeal(s.skills);
    if (heal && !sim.secondWindUsed && health < s.maxHealth * 0.2) {
      sim.secondWindUsed = true;
      set({ health: Math.min(s.maxHealth, health + heal), message: 'SECOND WIND!', messageUntil: Date.now() + 1800 });
    }
  };

  return {
    ...saved,
    screen: 'loading',
    level: 1,
    runId: 0,
    health: 100,
    maxHealth: 100,
    energy: 100,
    stamina: 100,
    maxStamina: 100,
    stats: computeStats(saved.equipped, saved.skills),
    ...freshRun(),
    runStart: 0,
    result: null,
    message: '',
    messageUntil: 0,
    warning: '',
    warningUntil: 0,
    history: [],
    inGame: false,
    previewMutation: saved.equipped,
    previewCosmetics: null,
    setPreview: (id) => set({ previewMutation: id }),
    setPreviewCosmetics: (c) => set({ previewCosmetics: c }),

    startLevel: (level) => {
      const s = get();
      if (level > s.unlocked) return;
      resetTutorial();
      const stats = computeStats(s.equipped, s.skills);
      const maxHealth = Math.round(stats.maxHealth);
      const maxStamina = Math.round(stats.staminaCapacity);
      set({
        level, runId: s.runId + 1, ...freshRun(), stats, maxHealth, maxStamina, health: maxHealth, stamina: maxStamina, energy: 100,
        screen: 'game', inGame: true, history: [], message: '', messageUntil: 0, warning: '', warningUntil: 0, runStart: Date.now(), result: null,
      });
    },
    setScreen: (screen) => set((s) => ({ ...place(screen, s.inGame), history: screen === 'menu' || GAME_FAMILY.has(screen) ? [] : s.history })),
    navigate: (screen) => set((s) => ({ ...place(screen, s.inGame), history: s.screen === 'loading' ? s.history : [...s.history, s.screen] })),
    back: () => set((s) => {
      const prev = s.history[s.history.length - 1] ?? 'menu';
      return { ...place(prev, s.inGame), history: s.history.slice(0, -1) };
    }),
    warn: (message) => set({ warning: message, warningUntil: Date.now() + 2600 }),

    addFear: (id, amount) => {
      const s = get();
      if (s.cleared.includes(id) || s.screen !== 'game') return;
      const spec = LEVELS[s.level - 1];
      const index = Number(id.split('-H')[1]);
      const human = spec.humans[index];
      if (!human || id !== `L${s.level}-H${index}`) return;
      if (human.role === 'mak' && !s.bossActive) return;
      const value = Math.max(0, Math.min(100, (s.fear[id] ?? 0) + amount));
      const fear = { ...s.fear, [id]: value };
      if (value < 100) { set({ fear }); return; }
      const cleared = [...s.cleared, id];
      const minions = spec.humans.filter((h) => h.role !== 'mak').length;
      const minionsDone = cleared.filter((c) => spec.humans[Number(c.split('-H')[1])]?.role !== 'mak').length;
      const bossDown = human.role === 'mak';
      const done = cleared.length >= spec.humans.length;
      const wakeBoss = !bossDown && !s.bossActive && spec.kind === 'boss' && minionsDone >= minions;
      const message = bossDown ? 'MAK LIPAS IS DEFEATED!' : wakeBoss ? 'MAK LIPAS ENTERS THE ROOM!' : done ? 'EVERYONE IS TERRIFIED. THE DOOR IS OPEN.' : human.role === 'janitor' ? 'JANITOR TERRIFIED! +150' : 'TARGET TERRIFIED! +150';
      set({
        fear, cleared, score: s.score + (bossDown ? 1000 : 150), exitUnlocked: done, bossActive: s.bossActive || wakeBoss, bossDefeated: s.bossDefeated || bossDown,
        message, messageUntil: Date.now() + 2600,
        ...(wakeBoss ? { warning: 'BOSS: MAK LIPAS', warningUntil: Date.now() + 3200 } : {}),
      });
      award(`terrify:${id}`, terrifyCoins(s.level, index), human.role === 'person' ? `Terrified ${human.name}` : `Defeated ${human.name}`);
      persist();
      if (bossDown) {
        const run = s.runId;
        window.setTimeout(() => { const g = get(); if (g.runId === run && g.screen === 'game') g.advance(); }, 2400);
      }
    },

    collect: (id, energy) => {
      const s = get();
      if (s.collected.includes(id)) return;
      const collected = [...s.collected, id];
      const coins = award(`food:${id}`, foodCoins(s.level), 'Food scraps');
      const gain = Math.round(energy * s.stats.foodEnergy);
      set({ collected, energy: Math.min(100, s.energy + gain), stamina: Math.min(s.maxStamina, s.stamina + 20), message: `YUM! +${gain} ENERGY${coins ? `  +${coins} COINS` : ''}`, messageUntil: Date.now() + 2000 });
    },

    hurt: (amount) => {
      const dealt = mitigate(amount, true);
      if (dealt <= 0) return;
      const s = get();
      const health = Math.max(0, s.health - dealt);
      sim.shake = Math.max(sim.shake, 0.45);
      set({ health, damageTaken: s.damageTaken + dealt, message: 'OUCH!', messageUntil: Date.now() + 1200 });
      afterDamage(health);
    },
    drain: (healthAmount, energyAmount) => {
      const dealt = mitigate(healthAmount, false);
      const s = get();
      const health = Math.max(0, s.health - dealt);
      set({ health, damageTaken: s.damageTaken + dealt, energy: Math.max(0, s.energy - energyAmount) });
      afterDamage(health);
    },
    spendEnergy: (amount) => set((s) => ({ energy: Math.max(0, s.energy - amount) })),
    spendStamina: (amount) => set((s) => ({ stamina: Math.max(0, s.stamina - amount) })),
    refill: (amount) => set((s) => ({ energy: Math.min(100, s.energy + amount) })),
    regenStamina: (amount) => set((s) => ({ stamina: Math.min(s.maxStamina, s.stamina + amount) })),
    heal: (amount) => set((s) => ({ health: Math.min(s.maxHealth, s.health + amount) })),

    advance: () => {
      const s = get();
      if (s.screen !== 'game') return;
      const level = s.level;
      const spec = LEVELS[level - 1];
      if (!s.exitUnlocked || s.cleared.length < spec.humans.length) return;
      const time = (Date.now() - s.runStart) / 1000;
      award(`clear:L${level}`, clearCoins(level), `${spec.name} cleared`);
      if (s.damageTaken < 0.5) award(`ch:untouched:L${level}`, 40, 'Challenge: Untouched');
      if (get().collected.length >= (spec.theme === 'bathroom' ? 6 : spec.food.length)) award(`ch:gourmet:L${level}`, 30, 'Challenge: Gourmet');
      if (spec.kind === 'room' && time < parTime(level)) award(`ch:swift:L${level}`, 35, 'Challenge: Swift');

      const after = get();
      const earned = earnedMutations(level);
      const newMutations = earned.filter((m) => !after.owned.includes(m));
      const owned = [...after.owned, ...newMutations];
      const firstClear = level >= after.unlocked;
      const unlocked = Math.max(after.unlocked, Math.min(LEVELS.length, level + 1));
      const finished = after.finished || level === LEVELS.length;
      const score = after.score + 250;
      const coins = after.rewards.reduce((a, r) => a + r.amount, 0);
      set({
        owned, unlocked, reached: unlocked, score, finished,
        result: { level, rewards: after.rewards, coins, time, newMutations, firstClear },
        screen: level === LEVELS.length ? 'finale' : 'level-complete', message: '',
        inGame: level === LEVELS.length ? false : true,
      });
      persist();
    },

    toast: (message) => set({ message, messageUntil: Date.now() + 2200 }),

    buyMutation: (id) => {
      const s = get();
      const def = MUTATIONS[id];
      const check = canBuyMutation(def, s);
      if (!check.ok) return check;
      set({ coins: s.coins - def.price, owned: [...s.owned, id] });
      persist();
      return { ok: true };
    },
    equipMutation: (id) => {
      const s = get();
      if (!s.owned.includes(id)) return false;
      set({ equipped: id, stats: computeStats(id, s.skills) });
      persist();
      return true;
    },
    buySkill: (id) => {
      const s = get();
      const def = skillById(id);
      if (!def) return { ok: false, reason: 'Unknown skill' };
      const level = s.skills[id] ?? 0;
      const cost = nextSkillCost(id, level);
      if (cost === null) return { ok: false, reason: 'Already at max level' };
      if (s.coins < cost) return { ok: false, reason: `Need ${cost - s.coins} more Crumb Coins` };
      const skills = { ...s.skills, [id]: level + 1 };
      set({ coins: s.coins - cost, skills, stats: computeStats(s.equipped, skills) });
      persist();
      return { ok: true };
    },
    buyCosmetic: (id) => {
      const s = get();
      const def = cosmeticById(id);
      if (!def) return { ok: false, reason: 'Unknown item' };
      if (s.cosmeticsOwned.includes(id)) return { ok: false, reason: 'Already owned' };
      if (s.coins < def.price) return { ok: false, reason: `Need ${def.price - s.coins} more Crumb Coins` };
      set({ coins: s.coins - def.price, cosmeticsOwned: [...s.cosmeticsOwned, id] });
      persist();
      return { ok: true };
    },
    equipCosmetic: (id) => {
      const s = get();
      const def = cosmeticById(id);
      if (!def || !s.cosmeticsOwned.includes(id)) return false;
      set({ cosmeticsEquipped: { ...s.cosmeticsEquipped, [def.slot as CosmeticSlot]: id } });
      persist();
      return true;
    },
    resetSave: () => {
      eraseSave();
      window.location.reload();
    },
  };
});

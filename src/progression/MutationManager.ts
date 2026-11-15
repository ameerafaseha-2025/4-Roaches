import { ADDITIVE, BASE, MUTATIONS, type MutationDef, type MutationId, type StatKey, type Stats } from './MutationConfig';
import { skillById, SKILLS } from './SkillManager';
import type { SaveData } from './SaveManager';

export function computeStats(id: MutationId, skills: Record<string, number>): Stats {
  const mods = MUTATIONS[id].mods;
  const out = { ...BASE } as Stats;
  (Object.keys(BASE) as StatKey[]).forEach((k) => {
    const m = mods[k];
    if (m === undefined) return;
    out[k] = ADDITIVE.has(k) ? BASE[k] + m : BASE[k] * m;
  });
  for (const def of SKILLS) {
    const lvl = skills[def.id] ?? 0;
    if (!lvl || !def.stat) continue;
    const k = def.stat;
    const delta = def.perLevel * lvl;
    out[k] = ADDITIVE.has(k) ? out[k] + delta : out[k] * (1 + delta);
  }
  if ((skills.quickhide ?? 0) > 0) out.hideDuration *= 1 + 0.1 * skills.quickhide;
  out.defence = Math.min(0.75, Math.max(0, out.defence));
  out.detectionResistance = Math.min(0.7, Math.max(-0.5, out.detectionResistance));
  out.dodgeChance = Math.min(0.4, Math.max(0, out.dodgeChance));
  return out;
}

export const secondWindHeal = (skills: Record<string, number>) => [0, 30, 45, 60][skills.secondwind ?? 0] ?? 0;

export function canBuyMutation(def: MutationDef, save: Pick<SaveData, 'coins' | 'owned' | 'reached'>): { ok: boolean; reason?: string } {
  if (save.owned.includes(def.id)) return { ok: false, reason: 'Already owned' };
  if (save.reached < def.requiresReached) return { ok: false, reason: 'Reach the Living Room first' };
  if (save.coins < def.price) return { ok: false, reason: `Need ${def.price - save.coins} more Crumb Coins` };
  return { ok: true };
}

export function earnedMutations(completedLevel: number): MutationId[] {
  return (Object.values(MUTATIONS) as MutationDef[]).filter((m) => m.earnedBy !== null && m.earnedBy <= completedLevel).map((m) => m.id);
}

export function unlockHint(def: MutationDef): string {
  if (def.earnedBy === null) return 'Available from the start';
  const names = ['', 'The Bathroom', 'The Store Room', 'The Kitchen', 'The Bedroom', 'Mak Lipas'];
  return def.earnedBy === 5 ? 'Free after defeating Mak Lipas' : `Free after clearing ${names[def.earnedBy]}`;
}

export { skillById };

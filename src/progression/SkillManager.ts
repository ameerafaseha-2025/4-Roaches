import type { StatKey } from './MutationConfig';

export type SkillDef = {
  id: string;
  name: string;
  branch: 'body' | 'flight' | 'cunning';
  desc: (level: number) => string;
  costs: number[];
  stat: StatKey | null;
  perLevel: number;
};

const pct = (v: number) => `${Math.round(v * 100)}%`;

export const SKILLS: SkillDef[] = [
  { id: 'vitality', name: 'Vitality', branch: 'body', stat: 'maxHealth', perLevel: 0.06, costs: [50, 90, 150], desc: (l) => `+${pct(0.06 * Math.max(1, l))} maximum health` },
  { id: 'thickskin', name: 'Thick Skin', branch: 'body', stat: 'defence', perLevel: 0.04, costs: [60, 110, 170], desc: (l) => `${pct(0.04 * Math.max(1, l))} less damage taken` },
  { id: 'grip', name: 'Sticky Grip', branch: 'body', stat: 'attackDamage', perLevel: 0.07, costs: [60, 110, 170], desc: (l) => `+${pct(0.07 * Math.max(1, l))} face attack power` },
  { id: 'lungs', name: 'Big Lungs', branch: 'body', stat: 'staminaCapacity', perLevel: 0.08, costs: [50, 90, 150], desc: (l) => `+${pct(0.08 * Math.max(1, l))} stamina capacity` },
  { id: 'sprinter', name: 'Sprinter Legs', branch: 'flight', stat: 'movementSpeed', perLevel: 0.03, costs: [55, 100, 160], desc: (l) => `+${pct(0.03 * Math.max(1, l))} movement speed` },
  { id: 'wings', name: 'Efficient Wings', branch: 'flight', stat: 'flightEnergyConsumption', perLevel: -0.06, costs: [70, 120, 190], desc: (l) => `${pct(0.06 * Math.max(1, l))} less flight energy used` },
  { id: 'stomach', name: 'Iron Stomach', branch: 'flight', stat: 'foodEnergy', perLevel: 0.1, costs: [45, 80, 130], desc: (l) => `+${pct(0.1 * Math.max(1, l))} energy from scraps` },
  { id: 'mastery', name: 'Ability Mastery', branch: 'cunning', stat: 'specialAbilityCooldown', perLevel: -0.07, costs: [80, 140, 220], desc: (l) => `${pct(0.07 * Math.max(1, l))} shorter ability cooldown` },
  { id: 'quickhide', name: 'Quick Hide', branch: 'cunning', stat: 'hideCooldown', perLevel: -0.15, costs: [50, 90, 140], desc: (l) => `${pct(0.15 * Math.max(1, l))} shorter hide cooldown, hide longer` },
  { id: 'secondwind', name: 'Second Wind', branch: 'cunning', stat: null, perLevel: 0, costs: [90, 160, 240], desc: (l) => `Once per level, heal ${[30, 45, 60][Math.max(1, l) - 1]} health when below 20%` },
];

export const SKILL_BRANCH_NAME = { body: 'Body', flight: 'Movement', cunning: 'Cunning' } as const;

export const skillById = (id: string) => SKILLS.find((s) => s.id === id);

export function nextSkillCost(id: string, level: number): number | null {
  const s = skillById(id);
  if (!s || level >= s.costs.length) return null;
  return s.costs[level];
}

export type MutationId = 'basic' | 'tank' | 'thunder' | 'aero' | 'shadow' | 'royal';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const MUTATION_ORDER: MutationId[] = ['basic', 'tank', 'thunder', 'aero', 'shadow', 'royal'];

export const BASE = {
  maxHealth: 100,
  attackDamage: 1,
  movementSpeed: 2.7,
  sprintSpeed: 1.75,
  flightSpeed: 4.4,
  flightEnergyConsumption: 3.4,
  energyRegeneration: 0,
  staminaCapacity: 100,
  staminaRegeneration: 1,
  defence: 0,
  detectionResistance: 0,
  specialAbilityCooldown: 1,
  sprintStaminaCost: 1,
  aerialControl: 1,
  acceleration: 1,
  hideDuration: 8,
  hideCooldown: 3,
  stealthMove: 0.45,
  dodgeChance: 0,
  foodEnergy: 1,
} as const;

export type StatKey = keyof typeof BASE;
export type Stats = { [K in StatKey]: number };

export const ADDITIVE: ReadonlySet<StatKey> = new Set<StatKey>(['energyRegeneration', 'defence', 'detectionResistance', 'dodgeChance']);

export type StatMods = Partial<Record<StatKey, number>>;

export type AbilityData = {
  id: string;
  name: string;
  desc: string;
  duration: number;
  cooldown: number;
  energyCost: number;
  color: string;
};

export type RoachLook = {
  shell: string;
  shellLight: string;
  leg: string;
  wing: string;
  accent: string;
  glow: string | null;
  eye: string;
  scale: number;
  body: [number, number, number];
  legThick: number;
  wingSize: [number, number];
  pattern: 'none' | 'veins' | 'bolts' | 'royal';
  plates: boolean;
  crown: boolean;
  metal: number;
};

export type MutationDef = {
  id: MutationId;
  name: string;
  rarity: Rarity;
  tagline: string;
  desc: string;
  price: number;
  earnedBy: number | null;
  requiresReached: number;
  mods: StatMods;
  ability: AbilityData;
  pros: string[];
  cons: string[];
  look: RoachLook;
};

export const MUTATIONS: Record<MutationId, MutationDef> = {
  basic: {
    id: 'basic', name: 'Basic Roach', rarity: 'common', price: 0, earnedBy: null, requiresReached: 1,
    tagline: 'Humble. Hardy. Hungry.',
    desc: 'Bapak Lipas as he is: a scrappy survivor with no special gifts and no special flaws.',
    mods: {},
    ability: { id: 'scurry', name: 'SCURRY', desc: 'A burst of speed that costs no stamina.', duration: 2.5, cooldown: 12, energyCost: 0, color: '#e6d3a3' },
    pros: ['Balanced in every way', 'Scurry is always cheap'],
    cons: ['Nothing stands out'],
    look: { shell: '#6b3a22', shellLight: '#8f5430', leg: '#3b2214', wing: '#b46a34', accent: '#d9a24f', glow: null, eye: '#120a06', scale: 1, body: [1, 1, 1], legThick: 1, wingSize: [1, 1], pattern: 'none', plates: false, crown: false, metal: 0.05 },
  },
  tank: {
    id: 'tank', name: 'Tank Roach', rarity: 'uncommon', price: 160, earnedBy: 1, requiresReached: 1,
    tagline: 'Thick shell. Thicker skull.',
    desc: 'A heavily armoured brute. Hard to kill and hits like a dropped shoe, but it is slow and burns stamina fast.',
    mods: { maxHealth: 1.4, attackDamage: 1.3, defence: 0.2, movementSpeed: 0.88, flightSpeed: 0.9, flightEnergyConsumption: 1.15, sprintStaminaCost: 1.4, staminaRegeneration: 0.9, detectionResistance: -0.1 },
    ability: { id: 'shield', name: 'SHELL SHIELD', desc: 'Harden the shell and take only 30% of incoming damage.', duration: 4, cooldown: 14, energyCost: 0, color: '#9db4c8' },
    pros: ['+40% health, 20% defence', '+30% attack', 'Shell Shield'],
    cons: ['12% slower on foot', 'Sprinting costs 40% more stamina', 'Easier to spot'],
    look: { shell: '#3b3a3f', shellLight: '#57555c', leg: '#26252a', wing: '#4c4a52', accent: '#9db4c8', glow: null, eye: '#0c0a0a', scale: 1.12, body: [1.22, 1.2, 1.08], legThick: 1.45, wingSize: [0.9, 0.85], pattern: 'none', plates: true, crown: false, metal: 0.55 },
  },
  thunder: {
    id: 'thunder', name: 'Thunder Roach', rarity: 'rare', price: 260, earnedBy: 2, requiresReached: 1,
    tagline: 'Fast enough to outrun the slipper.',
    desc: 'Crackling with static. Blisteringly quick with sharp reflexes, but fragile when caught.',
    mods: { movementSpeed: 1.22, sprintSpeed: 1.1, acceleration: 1.6, staminaRegeneration: 1.15, dodgeChance: 0.16, maxHealth: 0.85, attackDamage: 0.95, flightSpeed: 1.05 },
    ability: { id: 'dash', name: 'ELECTRIC DASH', desc: 'Dash forward, dodge all damage and stun humans nearby.', duration: 0.3, cooldown: 8, energyCost: 0, color: '#6fd3ff' },
    pros: ['+22% run speed, quick acceleration', '16% dodge chance', 'Electric Dash stuns'],
    cons: ['-15% health', 'Slightly weaker attack'],
    look: { shell: '#2d3f6b', shellLight: '#3f63a8', leg: '#17203a', wing: '#4ea7e8', accent: '#6fd3ff', glow: '#6fd3ff', eye: '#bfefff', scale: 0.97, body: [0.92, 0.9, 1.06], legThick: 0.9, wingSize: [1, 1.05], pattern: 'bolts', plates: false, crown: false, metal: 0.35 },
  },
  aero: {
    id: 'aero', name: 'Aero Roach', rarity: 'rare', price: 320, earnedBy: 3, requiresReached: 1,
    tagline: 'Born for the open air.',
    desc: 'Broad patterned wings and a sleek body. Flies farther on less energy, but is clumsy and fragile on the ground.',
    mods: { flightSpeed: 1.3, flightEnergyConsumption: 0.7, energyRegeneration: 1.4, aerialControl: 1.4, movementSpeed: 0.93, maxHealth: 0.9, attackDamage: 0.9 },
    ability: { id: 'burst', name: 'SKY BURST', desc: 'A rapid aerial boost in your movement direction. Works from the ground.', duration: 0.45, cooldown: 7, energyCost: 10, color: '#cfeaff' },
    pros: ['+30% flight speed', '-30% flight energy use', 'Regenerates energy', 'Precise air control'],
    cons: ['7% slower on foot', '-10% health and attack'],
    look: { shell: '#5b6b7a', shellLight: '#8aa2b6', leg: '#2b3640', wing: '#cfeaff', accent: '#8fd0ff', glow: null, eye: '#0e1418', scale: 0.98, body: [0.88, 0.86, 1.14], legThick: 0.85, wingSize: [1.35, 1.6], pattern: 'veins', plates: false, crown: false, metal: 0.2 },
  },
  shadow: {
    id: 'shadow', name: 'Shadow Roach', rarity: 'epic', price: 380, earnedBy: 4, requiresReached: 1,
    tagline: 'You never saw it. That was the point.',
    desc: 'A dark ghost of a roach. Hard to detect and a master of hiding, but weak in a straight fight.',
    mods: { detectionResistance: 0.35, hideDuration: 1.75, hideCooldown: 0.4, stealthMove: 1.6, movementSpeed: 1.05, maxHealth: 0.9, flightSpeed: 0.95, attackDamage: 1.05 },
    ability: { id: 'veil', name: 'SHADOW VEIL', desc: 'Become unseen: humans lose track of you for a few seconds.', duration: 6, cooldown: 16, energyCost: 0, color: '#a77bff' },
    pros: ['35% harder to detect', 'Hides 75% longer, recovers faster', 'Shadow Veil'],
    cons: ['-10% health', 'Slower flight'],
    look: { shell: '#17121f', shellLight: '#2c2140', leg: '#0d0a12', wing: '#3a2a55', accent: '#a77bff', glow: '#7a4fd0', eye: '#d6b8ff', scale: 1, body: [0.95, 0.95, 1.04], legThick: 0.95, wingSize: [1, 1], pattern: 'veins', plates: false, crown: false, metal: 0.3 },
  },
  royal: {
    id: 'royal', name: 'Royal Roach', rarity: 'legendary', price: 800, earnedBy: 6, requiresReached: 6,
    tagline: 'All hail the king of the longkang.',
    desc: 'The ultimate evolution. Strong, sturdy and swift in the air, with a long recharge on its royal power.',
    mods: { maxHealth: 1.3, attackDamage: 1.4, defence: 0.1, movementSpeed: 1.08, flightSpeed: 1.15, flightEnergyConsumption: 0.85, energyRegeneration: 0.8, staminaCapacity: 1.3, staminaRegeneration: 1.2, specialAbilityCooldown: 1.0 },
    ability: { id: 'rage', name: 'ROYAL RAGE', desc: 'Attack +60%, speed +30%, incoming damage halved.', duration: 7, cooldown: 24, energyCost: 0, color: '#ffd35a' },
    pros: ['+30% health, +40% attack', '+30% stamina, energy regeneration', 'Royal Rage'],
    cons: ['Royal Rage has a long 24s recharge', 'Needs the Boss Domain reached to buy'],
    look: { shell: '#b8862c', shellLight: '#e8b84a', leg: '#6b4a14', wing: '#ffd35a', accent: '#fff0b0', glow: '#ffcf4a', eye: '#2a1a04', scale: 1.1, body: [1.06, 1.02, 1.1], legThick: 1.1, wingSize: [1.25, 1.35], pattern: 'royal', plates: false, crown: true, metal: 0.9 },
  },
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#cbbf9f',
  uncommon: '#6fae7a',
  rare: '#5e9fe0',
  epic: '#a77bff',
  legendary: '#f0b84a',
};

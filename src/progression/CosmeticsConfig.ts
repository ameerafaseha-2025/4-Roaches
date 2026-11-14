export type CosmeticSlot = 'wing' | 'shell' | 'antenna' | 'fx' | 'accessory';

export type CosmeticDef = {
  id: string;
  slot: CosmeticSlot;
  name: string;
  price: number;
  value: string | null;
};

export const SLOT_LABEL: Record<CosmeticSlot, string> = {
  wing: 'Wing Colour',
  shell: 'Exoskeleton',
  antenna: 'Antennae',
  fx: 'Aura Effect',
  accessory: 'Accessory',
};

export const COSMETIC_SLOTS: CosmeticSlot[] = ['wing', 'shell', 'antenna', 'fx', 'accessory'];

export const COSMETICS: CosmeticDef[] = [
  { id: 'wing-default', slot: 'wing', name: 'Natural', price: 0, value: null },
  { id: 'wing-rose', slot: 'wing', name: 'Rose Quartz', price: 80, value: '#e68aa8' },
  { id: 'wing-azure', slot: 'wing', name: 'Azure', price: 80, value: '#6fb7e8' },
  { id: 'wing-jade', slot: 'wing', name: 'Jade', price: 80, value: '#6fcf9c' },
  { id: 'wing-violet', slot: 'wing', name: 'Amethyst', price: 100, value: '#a78be0' },
  { id: 'wing-ember', slot: 'wing', name: 'Ember', price: 120, value: '#ff7a3a' },

  { id: 'shell-default', slot: 'shell', name: 'Natural', price: 0, value: null },
  { id: 'shell-chestnut', slot: 'shell', name: 'Chestnut', price: 60, value: '#8a4a26' },
  { id: 'shell-moss', slot: 'shell', name: 'Moss', price: 90, value: '#51703a' },
  { id: 'shell-obsidian', slot: 'shell', name: 'Obsidian', price: 90, value: '#26232b' },
  { id: 'shell-crimson', slot: 'shell', name: 'Crimson', price: 110, value: '#8c2230' },
  { id: 'shell-pearl', slot: 'shell', name: 'Pearl', price: 140, value: '#cfc8b8' },

  { id: 'antenna-default', slot: 'antenna', name: 'Standard', price: 0, value: 'default' },
  { id: 'antenna-long', slot: 'antenna', name: 'Long Whiskers', price: 60, value: 'long' },
  { id: 'antenna-curly', slot: 'antenna', name: 'Curly', price: 70, value: 'curly' },
  { id: 'antenna-glow', slot: 'antenna', name: 'Glow Tips', price: 110, value: 'glow' },

  { id: 'fx-default', slot: 'fx', name: 'None', price: 0, value: null },
  { id: 'fx-bubble', slot: 'fx', name: 'Soap Bubbles', price: 100, value: 'bubble' },
  { id: 'fx-sparkle', slot: 'fx', name: 'Stardust', price: 120, value: 'sparkle' },
  { id: 'fx-ember', slot: 'fx', name: 'Embers', price: 140, value: 'ember' },

  { id: 'acc-default', slot: 'accessory', name: 'None', price: 0, value: null },
  { id: 'acc-bowtie', slot: 'accessory', name: 'Bow Tie', price: 70, value: 'bowtie' },
  { id: 'acc-headband', slot: 'accessory', name: 'Headband', price: 80, value: 'headband' },
  { id: 'acc-shades', slot: 'accessory', name: 'Shades', price: 120, value: 'shades' },
  { id: 'acc-tophat', slot: 'accessory', name: 'Top Hat', price: 150, value: 'tophat' },
];

export const DEFAULT_COSMETICS: Record<CosmeticSlot, string> = {
  wing: 'wing-default',
  shell: 'shell-default',
  antenna: 'antenna-default',
  fx: 'fx-default',
  accessory: 'acc-default',
};

export const cosmeticById = (id: string) => COSMETICS.find((c) => c.id === id);
export const cosmeticsBySlot = (slot: CosmeticSlot) => COSMETICS.filter((c) => c.slot === slot);

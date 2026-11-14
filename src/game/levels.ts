export type LevelKind = 'room' | 'boss' | 'feast';
export type Theme = 'bathroom' | 'store' | 'kitchen' | 'bedroom' | 'living' | 'boss' | 'feast';

export type HumanSpec = {
  name: string;
  pos: [number, number];
  skin: string;
  outfit: string;
  hair: string;
  patrol: number;
  tough: number;
  weapon?: 'slipper' | 'spray';
  style?: 'shirt' | 'dress' | 'apron' | 'suit';
  hairStyle?: 'short' | 'long' | 'bun' | 'bald';
  scale?: number;
};

export type LevelSpec = {
  id: number;
  kind: LevelKind;
  theme: Theme;
  name: string;
  subtitle: string;
  room: string;
  difficulty: string;
  intro: string;
  floor: string;
  wall: string;
  accent: string;
  sky: string;
  humans: HumanSpec[];
  food: [number, number, number][];
};

const food = (...p: [number, number][]): [number, number, number][] => p.map(([x, z]) => [x, 0.12, z]);

export const LEVELS: LevelSpec[] = [
  {
    id: 1, kind: 'room', theme: 'bathroom', name: 'The Bathroom', subtitle: 'Where the family was flushed away.', room: 'BATHROOM',
    difficulty: 'EASY', intro: 'Start small. Find the man who did this and make him scream.',
    floor: '#d9cfb8', wall: '#e8efef', accent: '#6fb5b0', sky: '#cfe3e8',
    humans: [{ name: 'Uncle Ah Seng', pos: [0.4, -0.6], skin: '#e0b896', outfit: '#6f8fb5', hair: '#2b2220', patrol: 0.6, tough: 70 }],
    food: [],
  },
  {
    id: 2, kind: 'room', theme: 'store', name: 'The Store Room', subtitle: 'Mops, bleach and bad memories.', room: 'STORE ROOM',
    difficulty: 'EASY', intro: 'Poison on every shelf. Stay off the floor.',
    floor: '#a8a49a', wall: '#cfc8b8', accent: '#e0a458', sky: '#bdb7a8',
    humans: [
      { name: 'Auntie Kiah', style: 'dress', hairStyle: 'bun', pos: [-1.8, -1.0], skin: '#d9a98a', outfit: '#c97b9a', hair: '#3a2a26', patrol: 0.9, tough: 80 },
      { name: 'Cousin Danial', pos: [2.0, -0.6], skin: '#e3bb98', outfit: '#5d8a6e', hair: '#1e1a1a', patrol: 1.1, tough: 80 },
    ],
    food: food([-4.2, 3.3], [3.9, 3], [-4, -1.2], [4.2, -3], [0, 1.4], [-1.5, 3.8]),
  },
  {
    id: 3, kind: 'room', theme: 'kitchen', name: 'The Kitchen', subtitle: 'Crumbs, grease, and a very large knife block.', room: 'KITCHEN',
    difficulty: 'MEDIUM', intro: 'Eat well. You will need every drop of energy.',
    floor: '#d7c4a0', wall: '#efe4cf', accent: '#d99a5b', sky: '#f2e2c4',
    humans: [
      { name: 'Chef Rosli', style: 'apron', pos: [-1.8, -1.0], skin: '#cf9d7c', outfit: '#f2efe6', hair: '#231c1a', patrol: 1.2, tough: 90 },
      { name: 'Maid Siti', style: 'dress', hairStyle: 'long', pos: [2.0, -0.8], skin: '#d8a888', outfit: '#8a79b8', hair: '#2a1f1d', patrol: 1.4, tough: 90 },
    ],
    food: food([-4.2, 3.2], [3.8, 3.4], [-3.6, 0.4], [4.1, -1.2], [0, 1.2], [-1.2, -0.6], [2, 3.6]),
  },
  {
    id: 4, kind: 'room', theme: 'bedroom', name: 'The Bedroom', subtitle: 'Lights out. The teenagers are awake.', room: 'BEDROOM',
    difficulty: 'MEDIUM', intro: 'Dim light, jumpy humans. Fear builds fast here.',
    floor: '#8c7a8f', wall: '#b7a8bc', accent: '#c08ab0', sky: '#2c2538',
    humans: [
      { name: 'Teen Aiman', pos: [-2.2, -0.8], skin: '#dcb18f', outfit: '#4d5a8a', hair: '#1b1717', patrol: 1.5, tough: 95 },
      { name: 'Teen Nurin', style: 'dress', hairStyle: 'long', pos: [0.4, -1.4], skin: '#d6a483', outfit: '#b86b8f', hair: '#2a2020', patrol: 1.6, tough: 95 },
      { name: 'Grandpa Atuk', hairStyle: 'bald', pos: [2.4, -0.8], skin: '#c99978', outfit: '#8a8f7a', hair: '#cfcfcf', patrol: 0.8, tough: 100 },
    ],
    food: food([-4.1, 3.3], [3.8, 3.2], [-3.6, 0.6], [4.2, -1], [-1.3, 2], [1.8, 0.3]),
  },
  {
    id: 5, kind: 'room', theme: 'living', name: 'The Living Room', subtitle: 'Sofa, telly, and a family of five.', room: 'LIVING ROOM',
    difficulty: 'HARD', intro: 'Many eyes. Keep moving and strike from above.',
    floor: '#b79c78', wall: '#e5d8bf', accent: '#a8714f', sky: '#e8d9bd',
    humans: [
      { name: 'Papa Hamid', pos: [-2.0, -0.8], skin: '#d4a07f', outfit: '#6b7a8f', hair: '#201a19', patrol: 1.6, tough: 100 },
      { name: 'Kak Long', style: 'dress', hairStyle: 'long', pos: [0.2, -1.8], skin: '#dcae8e', outfit: '#d28a6a', hair: '#2b2220', patrol: 1.8, tough: 100 },
      { name: 'Abang Ngah', pos: [2.2, -0.8], skin: '#d9ab8a', outfit: '#5c8a7e', hair: '#1a1616', patrol: 1.8, tough: 100 },
    ],
    food: food([-4.2, 3.3], [3.9, 3.1], [-3.8, 0.2], [4.1, -1.2], [-1.5, 1.5], [2.2, 0.6], [0, 3.8]),
  },
  {
    id: 6, kind: 'boss', theme: 'boss', name: 'Boss Domain', subtitle: 'Mak with her slipper. Pak Cik Janitor with the spray.', room: 'BOSS DOMAIN',
    difficulty: 'BOSS', intro: 'Slippers fly. Spray burns. Land on both faces to claim the stairs.',
    floor: '#8a7860', wall: '#d2c3a4', accent: '#c25a45', sky: '#e0cfae',
    humans: [
      { name: 'Mak', style: 'dress', hairStyle: 'bun', pos: [-2.2, -1.2], skin: '#d6a483', outfit: '#b0455f', hair: '#1c1616', patrol: 2.4, tough: 160, weapon: 'slipper', scale: 1.15 },
      { name: 'Janitor', pos: [2.2, -1.2], skin: '#c4936f', outfit: '#3d6b83', hair: '#161313', patrol: 2.2, tough: 160, weapon: 'spray', scale: 1.1 },
    ],
    food: food([-4.3, 3.5], [4.2, 3.4], [-4.1, 0.2], [4.3, 0.4], [0, 3.9]),
  },
  {
    id: 7, kind: 'feast', theme: 'feast', name: 'The Luxury Floor', subtitle: 'Upstairs, where the real food lives.', room: 'SECOND FLOOR',
    difficulty: 'GOAL', intro: 'Gold plates. Wedding cake. Eat it all and bring the family home.',
    floor: '#d9c9a2', wall: '#f1e7cf', accent: '#e0b44f', sky: '#f4e8c8',
    humans: [],
    food: food([-2.5, -1.05], [-0.85, -1.05], [0.85, -1.05], [2.5, -1.05], [-1.7, 0.05], [0, 0.05], [1.7, 0.05]),
  },
];

export const FEAST_TARGET = 7;
export const FEAST_TABLE_TOP = 1.1;

export const STORY = [
  { title: 'A Happy Home', text: 'Behind the old fridge, one cockroach found his mate. Together they built a small, happy family.' },
  { title: 'The Ruin', text: 'Then one night the humans came with spray and slippers. In an instant their little world was gone.' },
  { title: 'The Rampage', text: 'The father survived. His wings are his weapon. He will cross every room, land on every face, and take the house back.' },
  { title: 'The Goal', text: 'Past the boss domain, up the stairs, a table of luxury food waits. Fly, feed, and finish it.' },
];

export const FOOD_REWARDS = [
  { energy: 18, label: 'Scrap', color: '#e5c27b' },
  { energy: 30, label: 'Biscuit', color: '#e19a52' },
  { energy: 45, label: 'Nasi lemak', color: '#d6d36c' },
];

export function loadUnlocked(): number {
  const saved = Number(localStorage.getItem('roach-rampage-unlocked') || '1');
  return Math.max(1, Math.min(LEVELS.length, Number.isFinite(saved) ? saved : 1));
}

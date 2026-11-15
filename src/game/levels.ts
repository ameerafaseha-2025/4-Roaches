export type LevelKind = 'room' | 'boss';
export type Theme = 'bathroom' | 'store' | 'kitchen' | 'bedroom' | 'living';
export type Role = 'person' | 'janitor' | 'mak';

export type HumanSpec = {
  name: string;
  role: Role;
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

// Difficulty hierarchy: people are slow and easy to avoid, janitors notice fast and chase, Mak Lipas is the boss.
export const ROLE = {
  person: { label: 'Person', detect: 6, notice: 0.55, chase: 0, stomp: 9, decay: 1 },
  janitor: { label: 'Janitor', detect: 9, notice: 1.3, chase: 0.95, stomp: 13, decay: 1 },
  mak: { label: 'Mak Lipas', detect: 13, notice: 3, chase: 1.7, stomp: 18, decay: 0.25 },
} as const;

export const detectRange = (h: HumanSpec, resistance: number) => ROLE[h.role].detect * (1 - resistance);

const food = (...p: [number, number][]): [number, number, number][] => p.map(([x, z]) => [x, 0.12, z]);

const person = (name: string, pos: [number, number], skin: string, outfit: string, hair: string, patrol: number, tough: number, extra: Partial<HumanSpec> = {}): HumanSpec =>
  ({ name, role: 'person', pos, skin, outfit, hair, patrol, tough, ...extra });
const janitor = (name: string, pos: [number, number], skin: string, patrol: number, tough: number): HumanSpec =>
  ({ name, role: 'janitor', pos, skin, outfit: '#2f7f86', hair: '#161313', patrol, tough, weapon: 'spray', scale: 1.05 });

const MAK: HumanSpec = {
  name: 'Mak Lipas', role: 'mak', style: 'dress', hairStyle: 'bun', pos: [-3.4, 1.4], skin: '#d6a483', outfit: '#a3303d', hair: '#1c1616',
  patrol: 2.4, tough: 240, weapon: 'slipper', scale: 1.3,
};

export const LEVELS: LevelSpec[] = [
  {
    id: 1, kind: 'room', theme: 'bathroom', name: 'The Bathroom', subtitle: 'Where the family was flushed away.', room: 'BATHROOM',
    difficulty: 'EASY', intro: 'Start small. Find the people who did this and make them scream.',
    floor: '#d9cfb8', wall: '#e8efef', accent: '#6fb5b0', sky: '#cfe3e8',
    humans: [
      person('Uncle Ah Seng', [0.4, -0.6], '#e0b896', '#6f8fb5', '#2b2220', 0.6, 70),
      person('Auntie Mimah', [-3.0, 0.6], '#d9a98a', '#c97b9a', '#3a2a26', 0.7, 72, { style: 'dress', hairStyle: 'bun' }),
      person('Cousin Faiz', [3.0, 1.0], '#e3bb98', '#5d8a6e', '#1e1a1a', 0.8, 75),
    ],
    food: [],
  },
  {
    id: 2, kind: 'room', theme: 'store', name: 'The Store Room', subtitle: 'Mops, bleach and bad memories.', room: 'STORE ROOM',
    difficulty: 'EASY', intro: 'Poison on every shelf. The janitor is watching. Stay off the floor.',
    floor: '#a8a49a', wall: '#cfc8b8', accent: '#e0a458', sky: '#bdb7a8',
    humans: [
      person('Auntie Kiah', [-2.4, -0.8], '#d9a98a', '#c97b9a', '#3a2a26', 0.8, 80, { style: 'dress', hairStyle: 'bun' }),
      person('Cousin Danial', [2.4, -0.4], '#e3bb98', '#5d8a6e', '#1e1a1a', 0.9, 80),
      janitor('Janitor Pak Mat', [0.2, -2.6], '#c4936f', 1.5, 115),
    ],
    food: food([-4.2, 3.3], [3.9, 3], [-4, -1.2], [4.2, -3], [0, 1.4], [-1.5, 3.8]),
  },
  {
    id: 3, kind: 'room', theme: 'kitchen', name: 'The Kitchen', subtitle: 'Crumbs, grease, and a very large knife block.', room: 'KITCHEN',
    difficulty: 'MEDIUM', intro: 'Eat well. Two janitors patrol here. You will need every drop of energy.',
    floor: '#d7c4a0', wall: '#efe4cf', accent: '#d99a5b', sky: '#f2e2c4',
    humans: [
      person('Chef Rosli', [-2.2, -0.6], '#cf9d7c', '#f2efe6', '#231c1a', 0.9, 85, { style: 'apron' }),
      person('Maid Siti', [2.4, -0.4], '#d8a888', '#8a79b8', '#2a1f1d', 1.0, 85, { style: 'dress', hairStyle: 'long' }),
      janitor('Janitor Pak Din', [-3.6, -2.6], '#b98563', 1.6, 120),
      janitor('Janitor Abang Jai', [3.4, -2.4], '#c4936f', 1.7, 120),
    ],
    food: food([-4.2, 3.2], [3.8, 3.4], [-3.6, 0.4], [4.1, -1.2], [0, 1.2], [-1.2, -0.6], [2, 3.6]),
  },
  {
    id: 4, kind: 'room', theme: 'bedroom', name: 'The Bedroom', subtitle: 'Lights out. Everyone is awake.', room: 'BEDROOM',
    difficulty: 'MEDIUM', intro: 'Dim light, jumpy humans and three janitors. Fear builds fast here.',
    floor: '#8c7a8f', wall: '#b7a8bc', accent: '#c08ab0', sky: '#2c2538',
    humans: [
      person('Teen Aiman', [-2.6, -0.4], '#dcb18f', '#4d5a8a', '#1b1717', 1.0, 90),
      person('Teen Nurin', [0.4, -0.8], '#d6a483', '#b86b8f', '#2a2020', 1.1, 90, { style: 'dress', hairStyle: 'long' }),
      person('Grandpa Atuk', [3.0, -0.4], '#c99978', '#8a8f7a', '#cfcfcf', 0.6, 95, { hairStyle: 'bald', scale: 0.8 }),
      janitor('Janitor Pak Long', [-3.8, -2.4], '#b98563', 1.7, 125),
      janitor('Janitor Abang Wan', [1.8, -1.6], '#c4936f', 1.8, 125),
      janitor('Janitor Pak Leh', [3.8, -2.4], '#a97a58', 1.8, 125),
    ],
    food: food([-4.1, 3.3], [3.8, 3.2], [-3.6, 0.6], [4.2, -1], [-1.3, 2], [1.8, 0.3]),
  },
  {
    id: 5, kind: 'boss', theme: 'living', name: 'The Living Room', subtitle: 'Sofa, telly, and Mak Lipas with her slipper.', room: 'LIVING ROOM',
    difficulty: 'BOSS', intro: 'Clear her family first. Then Mak Lipas arrives. Watch the red warnings.',
    floor: '#b79c78', wall: '#e5d8bf', accent: '#a8714f', sky: '#e8d9bd',
    humans: [
      person('Papa Hamid', [-3.0, -0.2], '#d4a07f', '#6b7a8f', '#201a19', 1.0, 95),
      person('Kak Long', [0.0, -1.0], '#dcae8e', '#d28a6a', '#2b2220', 1.1, 95, { style: 'dress', hairStyle: 'long' }),
      person('Abang Ngah', [3.0, -0.2], '#d9ab8a', '#5c8a7e', '#1a1616', 1.1, 95),
      janitor('Janitor Pak Sudin', [-4.6, 0.4], '#b98563', 1.8, 130),
      janitor('Janitor Abang Ali', [1.4, -2.8], '#c4936f', 1.9, 130),
      janitor('Janitor Pak Hassan', [3.8, -2.6], '#a97a58', 1.9, 130),
      MAK,
    ],
    food: food([-4.2, 3.3], [3.9, 3.1], [-3.8, 0.2], [4.1, -1.2], [-2.6, 1.2], [2.2, 0.6], [0, 3.8]),
  },
];

export const countRoles = (humans: HumanSpec[]) => ({
  person: humans.filter((h) => h.role === 'person').length,
  janitor: humans.filter((h) => h.role === 'janitor').length,
  mak: humans.filter((h) => h.role === 'mak').length,
});

export const TOTALS = LEVELS.reduce(
  (a, l) => {
    const c = countRoles(l.humans);
    return { person: a.person + c.person, janitor: a.janitor + c.janitor, mak: a.mak + c.mak, enemies: a.enemies + l.humans.length };
  },
  { person: 0, janitor: 0, mak: 0, enemies: 0 },
);

export const roleOfKey = (key: string): Role | null => {
  const m = /^L(\d+)-H(\d+)$/.exec(key);
  return m ? LEVELS[Number(m[1]) - 1]?.humans[Number(m[2])]?.role ?? null : null;
};

export const STORY = [
  { title: 'A Happy Home', text: 'Behind the old fridge, one cockroach found his mate. Together they built a small, happy family.' },
  { title: 'The Ruin', text: 'Then one night the humans came with spray and slippers. In an instant their little world was gone.' },
  { title: 'The Rampage', text: 'The father survived. His wings are his weapon. He will cross every room, land on every face, and take the house back.' },
  { title: 'The Goal', text: 'Five rooms. Thirteen people. Nine janitors. And Mak Lipas waiting in the living room. Beat them all and a feast is yours.' },
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

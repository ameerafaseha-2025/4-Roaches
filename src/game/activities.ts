export type NpcState = 'IDLE' | 'WALKING' | 'SITTING' | 'SLEEPING' | 'INTERACTING' | 'WORKING' | 'SUSPICIOUS' | 'FRIGHTENED' | 'FLEEING' | 'RECOVERING';

export type Activity =
  | 'mirror' | 'brush' | 'wash' | 'stand'
  | 'sort' | 'search' | 'sweep' | 'carry'
  | 'cook' | 'chop' | 'dishes' | 'fridge' | 'prep'
  | 'sleep' | 'phone' | 'fold' | 'wardrobe' | 'getready'
  | 'tv' | 'read' | 'sofaSleep' | 'pace';

export type Pose = {
  sit: number;
  lie: number;
  armL: [number, number, number];
  armR: [number, number, number];
  foreL: number;
  foreR: number;
  lean: number;
  headX: number;
  headY: number;
  anim: 'none' | 'scrub' | 'chop' | 'stir' | 'sweep' | 'brush' | 'type' | 'rummage' | 'fold' | 'turn' | 'read' | 'breathe';
  prop?: 'phone' | 'toothbrush' | 'knife' | 'ladle' | 'broom' | 'book' | 'cloth' | 'box' | 'clothes' | 'plate' | 'comb';
  walks?: boolean;
};

const P = (o: Partial<Pose>): Pose => ({ sit: 0, lie: 0, armL: [0, 0.12, 0], armR: [0, -0.12, 0], foreL: -0.25, foreR: -0.25, lean: 0, headX: 0, headY: 0, anim: 'none', ...o });

export const POSES: Record<Activity, Pose> = {
  mirror: P({ armL: [-0.4, 0.2, 0], armR: [-1.2, -0.1, 0], foreR: -1.4, headX: -0.05, anim: 'brush', prop: 'comb' }),
  brush: P({ armR: [-1.05, -0.15, 0], foreR: -1.7, headX: 0.12, lean: 0.06, anim: 'brush', prop: 'toothbrush' }),
  wash: P({ armL: [-0.7, 0.1, 0], armR: [-0.7, -0.1, 0], foreL: -0.9, foreR: -0.9, lean: 0.14, headX: 0.22, anim: 'scrub' }),
  stand: P({ anim: 'breathe' }),
  sort: P({ armL: [-0.9, 0.1, 0], armR: [-0.9, -0.1, 0], foreL: -0.5, foreR: -0.5, lean: 0.12, headX: 0.2, anim: 'rummage', prop: 'box' }),
  search: P({ armL: [-0.8, 0.1, 0], armR: [-1.0, -0.1, 0], foreL: -0.7, foreR: -0.7, lean: 0.35, headX: 0.15, anim: 'rummage' }),
  sweep: P({ armL: [-0.7, 0.25, 0], armR: [-0.55, -0.25, 0], foreL: -0.6, foreR: -0.6, lean: 0.12, headX: 0.2, anim: 'sweep', prop: 'broom', walks: true }),
  carry: P({ armL: [-1.0, 0.2, 0], armR: [-1.0, -0.2, 0], foreL: -1.1, foreR: -1.1, lean: -0.05, anim: 'none', prop: 'box', walks: true }),
  cook: P({ armR: [-0.8, -0.1, 0], armL: [-0.45, 0.15, 0], foreR: -1.0, foreL: -0.8, lean: 0.1, headX: 0.25, anim: 'stir', prop: 'ladle' }),
  chop: P({ armL: [-0.7, 0.1, 0], armR: [-0.85, -0.1, 0], foreL: -0.9, foreR: -1.0, lean: 0.12, headX: 0.32, anim: 'chop', prop: 'knife' }),
  dishes: P({ armL: [-0.7, 0.1, 0], armR: [-0.7, -0.1, 0], foreL: -0.8, foreR: -0.8, lean: 0.14, headX: 0.3, anim: 'scrub', prop: 'plate' }),
  fridge: P({ armR: [-1.0, -0.1, 0], foreR: -0.6, lean: 0.1, headX: 0.1, anim: 'rummage' }),
  prep: P({ armL: [-0.7, 0.1, 0], armR: [-0.75, -0.1, 0], foreL: -0.8, foreR: -0.8, lean: 0.1, headX: 0.28, anim: 'fold', prop: 'plate' }),
  sleep: P({ lie: 1, armL: [0.1, 0.3, 0], armR: [0, -0.3, 0], anim: 'breathe' }),
  phone: P({ sit: 1, armL: [-0.6, 0.1, 0], armR: [-0.95, -0.1, 0], foreL: -1.3, foreR: -1.5, headX: 0.45, lean: 0.12, anim: 'type', prop: 'phone' }),
  fold: P({ armL: [-0.75, 0.1, 0], armR: [-0.75, -0.1, 0], foreL: -0.9, foreR: -0.9, lean: 0.1, headX: 0.3, anim: 'fold', prop: 'clothes' }),
  wardrobe: P({ armL: [-1.4, 0.2, 0], armR: [-1.1, -0.2, 0], foreL: -0.4, foreR: -0.4, headX: -0.05, anim: 'rummage' }),
  getready: P({ armR: [-1.2, -0.1, 0], armL: [-0.3, 0.15, 0], foreR: -1.5, headX: -0.05, anim: 'brush', prop: 'comb' }),
  tv: P({ sit: 1, armL: [0.3, 0.2, 0], armR: [0.3, -0.2, 0], foreL: -0.4, foreR: -0.4, headX: -0.04, anim: 'turn' }),
  read: P({ sit: 1, armL: [-0.7, 0.15, 0], armR: [-0.7, -0.15, 0], foreL: -1.35, foreR: -1.35, headX: 0.42, anim: 'read', prop: 'book' }),
  sofaSleep: P({ lie: 1, armL: [0.1, 0.3, 0], armR: [0.2, -0.3, 0], anim: 'breathe' }),
  pace: P({ armL: [0, 0.1, 0], armR: [-0.5, -0.1, 0], foreR: -1.2, headX: 0.2, anim: 'type', prop: 'phone', walks: true }),
};

export type Spot = {
  activity: Activity;
  pos: [number, number];
  face: number;
  y?: number;
  route?: [number, number][];
  alt?: Activity;
  label: string;
};

export type Routine = Record<string, Spot>;

export const ROUTINES: Record<string, Spot> = {
  'Uncle Ah Seng': { activity: 'brush', pos: [-2.4, -2.9], face: 0, label: 'Brushing teeth at the vanity' },
  'Auntie Mimah': { activity: 'mirror', pos: [-0.6, -2.8], face: 0, label: 'Checking the mirror' },
  'Cousin Faiz': { activity: 'wash', pos: [2.6, -2.9], face: 0, label: 'Washing hands' },

  'Auntie Kiah': { activity: 'sort', pos: [-3.2, -3.1], face: 0, label: 'Sorting shelf boxes' },
  'Cousin Danial': { activity: 'search', pos: [-5.0, 3.4], face: Math.PI * 0.5, label: 'Searching through boxes' },
  'Janitor Pak Mat': { activity: 'sweep', pos: [0.4, -1.8], face: 0, route: [[-1.4, -1.8], [2.2, -1.8]], label: 'Sweeping the floor' },

  'Chef Rosli': { activity: 'cook', pos: [0.6, -3.0], face: 0, label: 'Stirring a pot' },
  'Maid Siti': { activity: 'dishes', pos: [-3.4, -3.0], face: 0, label: 'Washing dishes' },
  'Janitor Pak Din': { activity: 'fridge', pos: [3.8, -3.2], face: 0, label: 'Looking in the fridge' },
  'Janitor Abang Jai': { activity: 'chop', pos: [1.6, -3.0], face: 0, label: 'Preparing food' },

  'Teen Aiman': { activity: 'phone', pos: [1.0, -1.3], face: Math.PI * 0.2, y: 1.28, label: 'On his phone, sitting on the bed' },
  'Teen Nurin': { activity: 'getready', pos: [-1.0, -1.6], face: Math.PI, label: 'Getting ready' },
  'Grandpa Atuk': { activity: 'sleep', pos: [0.4, -4.2], face: Math.PI / 2, y: 1.52, label: 'Asleep in bed' },
  'Janitor Pak Long': { activity: 'wardrobe', pos: [-3.7, -3.9], face: -Math.PI / 2, label: 'Searching the wardrobe' },
  'Janitor Abang Wan': { activity: 'fold', pos: [3.4, 3.2], face: 0, label: 'Folding clothes' },
  'Janitor Pak Leh': { activity: 'carry', pos: [-3.2, 1.0], face: 0, route: [[-3.2, 1.0], [-3.2, 3.6]], label: 'Moving laundry' },

  'Papa Hamid': { activity: 'tv', pos: [0.6, 1.5], face: Math.PI, y: 0.62, label: 'Watching TV on the sofa' },
  'Kak Long': { activity: 'read', pos: [-1.0, 1.5], face: Math.PI, y: 0.62, label: 'Reading on the sofa' },
  'Abang Ngah': { activity: 'sofaSleep', pos: [2.2, 1.4], face: Math.PI, y: 0.9, label: 'Napping on the sofa' },
  'Janitor Pak Sudin': { activity: 'sweep', pos: [-4.0, 0.4], face: 0, route: [[-4.4, 0.4], [-4.4, 3.2]], label: 'Sweeping' },
  'Janitor Abang Ali': { activity: 'pace', pos: [1.4, -2.8], face: 0, route: [[-1.4, -2.8], [3.4, -2.8]], label: 'Pacing on his phone' },
  'Janitor Pak Hassan': { activity: 'wash', pos: [3.6, -1.8], face: 0, label: 'Wiping the shelf' },
};

export const FALLBACK: Spot = { activity: 'stand', pos: [0, 0], face: 0, label: 'Waiting' };

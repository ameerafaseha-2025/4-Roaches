export type SubtitleCue = { at: number; text: string; duration: number; style?: 'normal' | 'shout' };

export type SubtitleState = { text: string; style: 'normal' | 'shout'; key: number } | null;

export class SubtitleManager {
  private cues: SubtitleCue[];
  private active = -1;
  private listeners = new Set<(s: SubtitleState) => void>();

  constructor(cues: SubtitleCue[]) {
    this.cues = [...cues].sort((a, b) => a.at - b.at);
  }

  subscribe(fn: (s: SubtitleState) => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  update(time: number) {
    let next = -1;
    for (let i = 0; i < this.cues.length; i++) {
      const c = this.cues[i];
      if (time >= c.at && time < c.at + c.duration) next = i;
    }
    if (next === this.active) return;
    this.active = next;
    const cue = next >= 0 ? this.cues[next] : null;
    const state: SubtitleState = cue ? { text: cue.text, style: cue.style ?? 'normal', key: next } : null;
    this.listeners.forEach((fn) => fn(state));
  }

  reset() {
    this.active = -1;
    this.listeners.forEach((fn) => fn(null));
  }
}

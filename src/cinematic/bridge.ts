import type { SubtitleState } from './SubtitleManager';

export type IntroBridge = {
  onSubtitle: (s: SubtitleState) => void;
  onProgress: (t: number, fade: number, title: number) => void;
};

const noop = () => undefined;

export const introBridge: IntroBridge = {
  onSubtitle: noop,
  onProgress: noop,
};

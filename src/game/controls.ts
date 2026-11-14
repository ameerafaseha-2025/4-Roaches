import { clearInput, input } from './input';
import { useGame } from './store';

const SCENE = '.scene canvas';
let detachCurrent: (() => void) | null = null;

export const isLocked = () => !!document.pointerLockElement;

export function lockPointer() {
  const canvas = document.querySelector<HTMLElement>(SCENE);
  if (!canvas || document.pointerLockElement) return;
  try {
    const result = canvas.requestPointerLock() as unknown as Promise<void> | undefined;
    result?.catch?.(() => undefined);
  } catch {
    /* pointer lock unavailable */
  }
}

export function releasePointer() {
  if (document.pointerLockElement) document.exitPointerLock();
}

const screen = () => useGame.getState().screen;

function pause() {
  clearInput();
  useGame.getState().setScreen('paused');
  releasePointer();
}

export function attachControls() {
  detachCurrent?.();

  const setKey = (code: string, down: boolean, repeat: boolean) => {
    switch (code) {
      case 'KeyW': case 'ArrowUp': input.forward = down; break;
      case 'KeyS': case 'ArrowDown': input.backward = down; break;
      case 'KeyA': case 'ArrowLeft': input.left = down; break;
      case 'KeyD': case 'ArrowRight': input.right = down; break;
      case 'ShiftLeft': case 'ShiftRight': input.sprint = down; break;
      case 'KeyC': case 'ControlLeft': input.down = down; break;
      case 'Space':
        input.up = down;
        if (down && !repeat) input.jump = true;
        break;
      case 'KeyF': if (down && !repeat) input.fly = true; break;
      case 'KeyE': if (down && !repeat) input.hide = true; break;
      case 'KeyQ': if (down && !repeat) input.ability = true; break;
      default: break;
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      if (screen() === 'game') pause();
      else if (screen() === 'paused') { useGame.getState().setScreen('game'); lockPointer(); }
      return;
    }
    if (screen() === 'loading') return;
    if (screen() !== 'game') return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    setKey(e.code, true, e.repeat);
  };
  const onKeyUp = (e: KeyboardEvent) => setKey(e.code, false, false);

  const onMouseMove = (e: MouseEvent) => {
    if (screen() === 'game' && isLocked()) {
      input.mouseX += e.movementX;
      input.mouseY += e.movementY;
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    if (screen() !== 'game') return;
    const target = e.target as HTMLElement | null;
    if (!isLocked()) {
      if (target?.closest('.scene') && e.button === 0) lockPointer();
      return;
    }
    if (e.button === 0) input.attack = true;
    if (e.button === 2) input.aim = true;
  };
  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 2) input.aim = false;
  };
  const onContextMenu = (e: MouseEvent) => {
    if (screen() === 'game') e.preventDefault();
  };

  const onLockChange = () => {
    if (!isLocked()) {
      input.aim = false;
      input.attack = false;
      if (screen() === 'game') pause();
    }
  };
  const onBlur = () => clearInput();
  const onVisibility = () => {
    if (document.hidden && screen() === 'game') pause();
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('blur', onBlur);
  document.addEventListener('pointerlockchange', onLockChange);
  document.addEventListener('visibilitychange', onVisibility);

  detachCurrent = () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('pointerlockchange', onLockChange);
    document.removeEventListener('visibilitychange', onVisibility);
    detachCurrent = null;
    clearInput();
  };
  return detachCurrent;
}

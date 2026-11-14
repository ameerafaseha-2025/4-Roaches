import { useRef, type PointerEvent } from 'react';
import { input } from '../game/input';

export function MobilePad() {
  const stick = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const rect = stick.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    input.stickX = Math.max(-1, Math.min(1, dx));
    input.stickY = Math.max(-1, Math.min(1, -dy));
    const nub = stick.current?.firstElementChild as HTMLDivElement | null;
    if (nub) nub.style.transform = `translate(${input.stickX * 28}px, ${-input.stickY * 28}px)`;
  };
  const release = () => {
    pointer.current = null;
    input.stickX = 0;
    input.stickY = 0;
    const nub = stick.current?.firstElementChild as HTMLDivElement | null;
    if (nub) nub.style.transform = 'translate(0,0)';
  };

  return (
    <div className="pad">
      <div
        ref={stick}
        className="stick"
        onPointerDown={(e) => { pointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
        onPointerMove={(e) => { if (pointer.current === e.pointerId) move(e); }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <div className="nub" />
      </div>
      <div className="pad-buttons">
        <button onPointerDown={() => { input.fly = true; }}>FLY</button>
        <button onPointerDown={() => { input.sprint = true; }} onPointerUp={() => { input.sprint = false; }} onPointerCancel={() => { input.sprint = false; }}>SPRINT</button>
        <button onPointerDown={() => { input.jump = true; }}>JUMP</button>
        <button onPointerDown={() => { input.attack = true; }}>ATTACK</button>
      </div>
    </div>
  );
}

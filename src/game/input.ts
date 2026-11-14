export const input = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
  sprint: false,
  fly: false,
  jump: false,
  aim: false,
  attack: false,
  hide: false,
  ability: false,
  stickX: 0,
  stickY: 0,
  mouseX: 0,
  mouseY: 0,
};

export const tutorial = {
  looked: false,
  moved: false,
  jumped: false,
  sprinted: false,
  flew: false,
  hid: false,
  aimed: false,
  attacked: false,
};

export function clearInput() {
  input.forward = false;
  input.backward = false;
  input.left = false;
  input.right = false;
  input.up = false;
  input.down = false;
  input.sprint = false;
  input.fly = false;
  input.jump = false;
  input.aim = false;
  input.attack = false;
  input.hide = false;
  input.ability = false;
  input.stickX = 0;
  input.stickY = 0;
  input.mouseX = 0;
  input.mouseY = 0;
}

export function resetTutorial() {
  (Object.keys(tutorial) as (keyof typeof tutorial)[]).forEach((k) => { tutorial[k] = false; });
}

// Keyboard and mouse input for The Vault. One job: turn physical keys into a
// small state object the world reads every step. No game logic lives here.
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
  KeyE: 'interact',
  KeyQ: 'throw',
  Enter: 'confirm',
  KeyR: 'restart',
  KeyM: 'mute',
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let mouse = { x: 0, y: 0, clicked: false };

  function onKeyDown(event) {
    const name = KEYMAP[event.code];
    if (!name) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    if (!held.has(name)) pressed.add(name);
    held.add(name);
  }
  function onKeyUp(event) {
    const name = KEYMAP[event.code];
    if (name) held.delete(name);
  }
  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
  }
  function onMouseDown(event) {
    onMouseMove(event);
    mouse.clicked = true;
  }
  function onBlur() {
    held.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    // A unit movement vector from the held movement keys, or {x:0, y:0}.
    moveVector() {
      let x = 0;
      let y = 0;
      if (held.has('left')) x -= 1;
      if (held.has('right')) x += 1;
      if (held.has('up')) y -= 1;
      if (held.has('down')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.hypot(x, y);
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    sneaking() {
      return held.has('sneak');
    },
    // True once per physical press; the world consumes it each step.
    wasPressed(name) {
      return pressed.has(name);
    },
    consumePressed() {
      pressed.clear();
    },
    mouseClick() {
      const clicked = mouse.clicked;
      mouse.clicked = false;
      return clicked ? { x: mouse.x, y: mouse.y } : null;
    },
  };
}

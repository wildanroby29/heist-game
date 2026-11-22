// The Vault — entry point. Owns the canvas, the game loop and the screens;
// the rules live in world.js and the painting in render.js.
//
// ?shot=start|play|alarm|win stages one screenshot scene and renders it once
// (used by the maker's screenshot script; not part of play).
import { FIELD } from './config.js';
import { createInput } from './input.js';
import { createWorld, stepWorld, stepAmbient, startRun, SCREEN } from './world.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';
import { unlockAudio, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = FIELD.width;
canvas.height = FIELD.height;

const world = createWorld();
const input = createInput(canvas);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot, world);
  draw(ctx, world);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (input.wasPressed('mute')) toggleMute();
    if (world.screen === SCREEN.TITLE) {
      // Let the room patrol behind the title so it feels alive.
      stepAmbient(world, dt);
      if (input.wasPressed('confirm')) {
        unlockAudio();
        startRun(world);
      }
    } else if (world.screen === SCREEN.PLAY) {
      stepWorld(world, dt, input);
    } else if (input.wasPressed('restart')) {
      startRun(world);
    }
    input.consumePressed();
    draw(ctx, world);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

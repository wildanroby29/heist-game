// Staged screenshot scenes behind ?shot=start|play|alarm|win. Each scene plays
// the real rules forward from a fresh world for a fixed number of steps,
// steered by a simple autopilot, so every frame is what real play looks like
// and the same scene always gives the same frame (patrols and camera sweeps
// are deterministic; only footstep sounds use Math.random, never the rules).
import { GUARD, CAMERA, LOOT_TARGET } from './config.js';
import { createWorld, stepWorld, stepAmbient, startRun, SCREEN } from './world.js';
import { canSee } from './vision.js';

const STEP = 1 / 60;
const PLAY_SECONDS = 60;
const ALARM_SECONDS = 40;
const WIN_SECONDS = 600;
const VAULT_DOOR = { x: 1030, y: 330 };
const ALARM_ROUTE = [
  { x: 640, y: 560 }, { x: 880, y: 650 }, { x: 880, y: 500 }, { x: 920, y: 340 }, { x: 700, y: 330 },
];
const EXIT_POINT = { x: 90, y: 727 };

/** A fake input object the autopilot drives; stepWorld reads it like a keyboard. */
function pilotInput(pilot) {
  return {
    moveVector() {
      return pilot.vector;
    },
    sneaking() {
      return pilot.sneak;
    },
    wasPressed(name) {
      return pilot.pressed.has(name);
    },
    mouseClick() {
      return null;
    },
    consumePressed() {
      pilot.pressed.clear();
    },
  };
}

/** True when the thief is inside any guard or camera cone right now. */
function inAnyCone(world) {
  const player = world.player;
  for (const guard of world.guards) {
    if (canSee({ x: guard.x, y: guard.y, facing: guard.facing, range: GUARD.visionRange, halfAngle: GUARD.visionHalfAngle }, player, world.blockers)) return true;
    if (Math.hypot(guard.x - player.x, guard.y - player.y) < 90) return true;
  }
  for (const camera of world.cameras) {
    if (canSee({ x: camera.x, y: camera.y, facing: camera.facing, range: CAMERA.visionRange, halfAngle: CAMERA.visionHalfAngle }, player, world.blockers)) return true;
  }
  return false;
}

function makePilot(world, waypoints, options) {
  let index = 0;
  const pilot = { vector: { x: 0, y: 0 }, sneak: false, pressed: new Set() };
  function targetPoint() {
    if (options.dynamicTarget) return options.dynamicTarget(world);
    return index < waypoints.length ? waypoints[index] : null;
  }
  function update() {
    const player = world.player;
    const target = targetPoint();
    if (target === null) {
      pilot.vector = { x: 0, y: 0 };
      return;
    }
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 14) {
      if (!options.dynamicTarget) index += 1;
      pilot.vector = { x: 0, y: 0 };
      return;
    }
    if (options.avoidCones && inAnyCone(world)) {
      pilot.vector = { x: 0, y: 0 };
      pilot.sneak = true;
      return;
    }
    pilot.vector = { x: dx / distance, y: dy / distance };
    pilot.sneak = options.alwaysSneak || inAnyCone(world);
    for (const bar of world.bars) {
      if (!bar.taken && Math.hypot(bar.x - player.x, bar.y - player.y) < 30) {
        pilot.pressed.add('interact');
        break;
      }
    }
  }
  return { pilot, update, get done() { return !options.dynamicTarget && index >= waypoints.length; } };
}

/** Run the world forward with the pilot for up to `seconds`; stop early on `stopWhen`. */
function runPilot(world, pilot, seconds, stopWhen) {
  const input = pilotInput(pilot.pilot);
  const steps = Math.floor(seconds / STEP);
  for (let index = 0; index < steps; index += 1) {
    pilot.update();
    stepWorld(world, STEP, input);
    if (world.screen !== SCREEN.PLAY) break;
    if (stopWhen && stopWhen(world)) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw.
 * start: title over a live, patrolling room. play: mid-heist, thief inside
 * the room near the vault. alarm: the alarm just tripped, guards converging.
 * win: the getaway, played through to the win screen.
 */
export function stageShot(name, world) {
  if (name === 'start') {
    const fresh = createWorld();
    Object.assign(world, fresh);
    // Title screen keeps its own world state; step the patrols underneath it.
    for (let index = 0; index < 5 / STEP; index += 1) stepAmbient(world, STEP);
    world.screen = SCREEN.TITLE;
    return SCREEN.TITLE;
  }

  startRun(world);
  if (name === 'alarm') {
    const pilot = makePilot(world, ALARM_ROUTE, { avoidCones: false, alwaysSneak: true });
    runPilot(world, pilot, ALARM_SECONDS, (state) => state.alarmTripped);
    return world.screen;
  }
  if (name === 'win') {
    // Three phases: walk to the vault door, pocket the bars, then follow a
    // fixed route around the teller counter to the ESCAPE door.
    const exitRoute = [
      VAULT_DOOR, { x: 920, y: 340 }, { x: 880, y: 500 }, { x: 880, y: 650 }, { x: 300, y: 650 }, EXIT_POINT,
    ];
    let phase = 'approach';
    let exitIndex = 0;
    const pilot = makePilot(world, [], {
      avoidCones: false,
      alwaysSneak: false,
      dynamicTarget(state) {
        if (phase === 'approach') {
          if (Math.hypot(state.player.x - VAULT_DOOR.x, state.player.y - VAULT_DOOR.y) < 30) phase = 'loot';
          return VAULT_DOOR;
        }
        if (phase === 'loot') {
          if (state.loot >= LOOT_TARGET) {
            phase = 'exit';
            return exitRoute[0];
          }
          let nearest = null;
          let best = Infinity;
          for (const bar of state.bars) {
            if (bar.taken) continue;
            const distance = Math.hypot(bar.x - state.player.x, bar.y - state.player.y);
            if (distance < best) {
              best = distance;
              nearest = bar;
            }
          }
          return nearest || VAULT_DOOR;
        }
        const target = exitRoute[exitIndex];
        if (Math.hypot(state.player.x - target.x, state.player.y - target.y) < 16) {
          exitIndex = Math.min(exitIndex + 1, exitRoute.length - 1);
        }
        return exitRoute[exitIndex];
      },
    });
    runPilot(world, pilot, WIN_SECONDS, (state) => state.screen !== SCREEN.PLAY);
    return world.screen;
  }

  // play: careful crossing toward the vault, stopping near the vault door.
  const pilot = makePilot(
    world,
    [{ x: 640, y: 560 }, { x: 300, y: 520 }, { x: 300, y: 330 }, { x: 560, y: 300 }, VAULT_DOOR],
    { avoidCones: true, alwaysSneak: false },
  );
  runPilot(world, pilot, PLAY_SECONDS, (state) => pilot.done || state.alarm > 30);
  return world.screen;
}

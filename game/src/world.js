// The Vault's game state and rules: movement and collision, the alarm meter,
// loot and the escape, thrown-coin distractions, lives and the win/lose ends.
// Rendering lives in render.js; this file only decides what happens.
import {
  FIELD, PLAYER, LOOT_TARGET, COINS_START, COIN_THROW_RANGE,
  ALARM, GUARD,
} from './config.js';
import { buildWalls, buildCover, VAULT, EXIT_ZONE, GUARD_ROUTES, CAMERA_MOUNTS, COIN_PICKUPS, ENTRANCE } from './level.js';
import { createGuards, updateGuard, sendGuardToInvestigate, guardSeesThief, GUARD_STATE } from './guards.js';
import { createCameras, updateCamera, cameraSeesThief } from './cameras.js';
import { hasLineOfSight } from './vision.js';
import {
  soundPickup, soundCoin, soundStep, soundCaught, soundWin, soundSpotted,
  startAlarmSiren, stopAlarmSiren,
} from './audio.js';

export const SCREEN = { TITLE: 'title', PLAY: 'play', WIN: 'win', OVER: 'over' };

export function createWorld() {
  const walls = buildWalls();
  const cover = buildCover();
  const blockers = [...walls, ...cover];
  return {
    screen: SCREEN.TITLE,
    time: 0,
    elapsed: 0,
    alarm: 0,
    alarmTripped: false,
    loot: 0,
    coins: COINS_START,
    lives: 3,
    score: 0,
    muted: false,
    walls,
    cover,
    blockers,
    bars: VAULT.bars.map((bar) => ({ ...bar })),
    coinPickups: COIN_PICKUPS.map((coin) => ({ ...coin })),
    guards: createGuards(GUARD_ROUTES),
    cameras: createCameras(CAMERA_MOUNTS),
    player: {
      x: ENTRANCE.x,
      y: ENTRANCE.y,
      facing: -Math.PI / 2,
      sneaking: false,
      moving: false,
      invulnerableLeft: 0,
    },
    coin: null, // {x, y, secondsLeft} — the last thrown coin, still ringing
    caughtFlash: 0,
    winStats: null,
    message: '',
    messageLeft: 0,
  };
}

/** Put the thief back at the entrance after a catch, with a short safe window. */
function respawnPlayer(world) {
  world.player.x = ENTRANCE.x;
  world.player.y = ENTRANCE.y;
  world.player.facing = -Math.PI / 2;
  world.player.invulnerableLeft = 2;
  world.alarm = ALARM.afterCaught;
  world.alarmTripped = false;
  stopAlarmSiren();
  for (const guard of world.guards) {
    guard.state = GUARD_STATE.PATROL;
    guard.investigate = null;
    guard.chaseTarget = null;
  }
}

/** Circle-vs-rectangle push-out; keeps `pos` (radius r) out of every blocker. */
function resolveCollision(pos, r, blockers) {
  for (const rect of blockers) {
    const nearestX = Math.max(rect.x, Math.min(pos.x, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(pos.y, rect.y + rect.h));
    const dx = pos.x - nearestX;
    const dy = pos.y - nearestY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= r * r) continue;
    if (distSq === 0) {
      pos.y = rect.y - r;
      continue;
    }
    const dist = Math.sqrt(distSq);
    pos.x = nearestX + (dx / dist) * r;
    pos.y = nearestY + (dy / dist) * r;
  }
  pos.x = Math.max(PLAYER.radius + 2, Math.min(FIELD.width - PLAYER.radius - 2, pos.x));
  pos.y = Math.max(PLAYER.radius + 2, Math.min(FIELD.height - PLAYER.radius - 2, pos.y));
}

/** Throw a coin: it lands toward the aim point and every nearby guard checks it. */
function throwCoin(world, aimX, aimY) {
  if (world.coins <= 0 || world.coin !== null) return;
  const player = world.player;
  const dx = aimX - player.x;
  const dy = aimY - player.y;
  const distance = Math.hypot(dx, dy);
  const reach = Math.min(distance, COIN_THROW_RANGE);
  const landing = distance < 1
    ? { x: player.x, y: player.y - 60 }
    : { x: player.x + (dx / distance) * reach, y: player.y + (dy / distance) * reach };
  world.coins -= 1;
  world.coin = { x: landing.x, y: landing.y, secondsLeft: 1.6 };
  soundCoin();
  for (const guard of world.guards) {
    if (Math.hypot(guard.x - landing.x, guard.y - landing.y) <= COIN_THROW_RANGE) {
      sendGuardToInvestigate(guard, landing.x, landing.y);
    }
  }
  world.message = 'Coin thrown — a guard goes to check the noise';
  world.messageLeft = 2.2;
}

function showMessage(world, text, seconds = 2.2) {
  world.message = text;
  world.messageLeft = seconds;
}

/** Advance only the patrols and camera sweeps: the room stays alive behind the
 * title screen without any detection, alarm or catches. */
export function stepAmbient(world, dt) {
  world.time += dt;
  for (const camera of world.cameras) updateCamera(camera, world.time);
  for (const guard of world.guards) updateGuard(guard, dt, world.blockers, null, false);
}

/** One fixed step of the game while it is being played. */
export function stepWorld(world, dt, input) {
  world.time += dt;
  world.elapsed += dt;
  if (world.messageLeft > 0) world.messageLeft -= dt;
  if (world.caughtFlash > 0) world.caughtFlash -= dt;
  if (world.player.invulnerableLeft > 0) world.player.invulnerableLeft -= dt;
  if (world.coin !== null) {
    world.coin.secondsLeft -= dt;
    if (world.coin.secondsLeft <= 0) world.coin = null;
  }

  const player = world.player;
  const move = input.moveVector();
  player.sneaking = input.sneaking();
  player.moving = move.x !== 0 || move.y !== 0;
  if (player.moving) {
    player.facing = Math.atan2(move.y, move.x);
    const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    player.x += move.x * speed * dt;
    player.y += move.y * speed * dt;
    resolveCollision(player, PLAYER.radius, world.blockers);
    if (!player.sneaking && Math.random() < dt * 2.2) soundStep();
  }

  // Throw a coin with Q (toward where the thief faces) or a mouse click (there).
  const throwPressed = input.wasPressed('throw');
  const interactPressed = input.wasPressed('interact');
  if (throwPressed) {
    throwCoin(world, player.x + Math.cos(player.facing) * 150, player.y + Math.sin(player.facing) * 150);
  }
  const click = input.mouseClick();
  if (click !== null) throwCoin(world, click.x, click.y);
  input.consumePressed();

  // Cameras sweep; guards walk, investigate or chase.
  for (const camera of world.cameras) updateCamera(camera, world.time);
  for (const guard of world.guards) updateGuard(guard, dt, world.blockers, player, world.alarmTripped);

  // Detection: cones, then hearing. Sneaking is spotted more slowly.
  let seen = false;
  let wasSpotted = false;
  for (const guard of world.guards) {
    const distance = Math.hypot(guard.x - player.x, guard.y - player.y);
    if (guardSeesThief(guard, player, world.blockers)) {
      seen = true;
      if (guard.spotFlash > 0.8) wasSpotted = true;
      const proximity = 1 - Math.min(distance, GUARD.visionRange) / GUARD.visionRange;
      const factor = player.sneaking ? GUARD.sneakSpotFactor : 1;
      world.alarm += (ALARM.guardSeePerSecond * (0.5 + proximity) * factor) * dt;
    } else if (!player.sneaking && distance < ALARM.heardDistance) {
      world.alarm += ALARM.heardPerSecond * dt;
    }
  }
  for (const camera of world.cameras) {
    if (cameraSeesThief(camera, player, world.blockers)) {
      seen = true;
      if (camera.spotFlash > 0.8) wasSpotted = true;
      world.alarm += ALARM.cameraSeePerSecond * dt;
    }
  }
  if (wasSpotted) soundSpotted();
  if (!seen) world.alarm -= ALARM.decayPerSecond * dt;
  world.alarm = Math.max(0, Math.min(ALARM.max, world.alarm));

  // Trip and release the alarm.
  if (!world.alarmTripped && world.alarm >= ALARM.trip) {
    world.alarmTripped = true;
    startAlarmSiren();
    showMessage(world, 'ALARM! The guards are coming for you!', 3);
  } else if (world.alarmTripped && world.alarm < 45) {
    world.alarmTripped = false;
    stopAlarmSiren();
  }

  // A guard that reaches the thief grabs them.
  if (player.invulnerableLeft <= 0) {
    for (const guard of world.guards) {
      if (Math.hypot(guard.x - player.x, guard.y - player.y) < PLAYER.grabDistance) {
        world.lives -= 1;
        world.caughtFlash = 1.2;
        soundCaught();
        stopAlarmSiren();
        if (world.lives <= 0) {
          world.screen = SCREEN.OVER;
          world.score = world.loot;
          return;
        }
        showMessage(world, `Caught! ${world.lives} ${world.lives === 1 ? 'life' : 'lives'} left — back to the entrance`, 3);
        respawnPlayer(world);
        return;
      }
    }
  }

  // Pick up gold with E, or walk over a spare coin.
  if (interactPressed) {
    for (const bar of world.bars) {
      if (!bar.taken && Math.hypot(bar.x - player.x, bar.y - player.y) < 34) {
        bar.taken = true;
        world.loot += bar.value;
        soundPickup();
        showMessage(world, `Gold bar pocketed — $${world.loot} of $${LOOT_TARGET}`, 2.2);
        break;
      }
    }
  }
  for (const coin of world.coinPickups) {
    if (!coin.taken && Math.hypot(coin.x - player.x, coin.y - player.y) < 26) {
      coin.taken = true;
      world.coins += 1;
      soundPickup();
      showMessage(world, 'Found a coin — one more distraction', 2);
    }
  }

  // Escape: the door opens once the loot target is met.
  const inExit =
    player.x >= EXIT_ZONE.x && player.x <= EXIT_ZONE.x + EXIT_ZONE.w &&
    player.y >= EXIT_ZONE.y && player.y <= EXIT_ZONE.y + EXIT_ZONE.h;
  if (inExit && world.loot >= LOOT_TARGET) {
    const timeBonus = Math.max(0, 3000 - Math.floor(world.elapsed) * 10);
    const livesBonus = world.lives * 500;
    world.score = world.loot + timeBonus + livesBonus;
    world.winStats = {
      loot: world.loot,
      timeSeconds: Math.floor(world.elapsed),
      timeBonus,
      livesBonus,
      score: world.score,
    };
    world.screen = SCREEN.WIN;
    stopAlarmSiren();
    soundWin();
  }
}

/** Start a fresh run from the title screen. */
export function startRun(world) {
  const fresh = createWorld();
  Object.assign(world, fresh);
  world.screen = SCREEN.PLAY;
}

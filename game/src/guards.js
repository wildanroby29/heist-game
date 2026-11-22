// The three patrolling guards of The Vault. A guard walks its route and pauses
// at each waypoint, turns toward a thrown coin to investigate it, and — once
// the alarm trips — runs at the thief's last seen position.
import { GUARD, COIN_INVESTIGATE_SECONDS } from './config.js';
import { angleTo, canSee } from './vision.js';

export const GUARD_STATE = { PATROL: 'patrol', INVESTIGATE: 'investigate', CHASE: 'chase' };

export function createGuards(routes) {
  return routes.map((route) => ({
    name: route.name,
    color: route.color,
    waypoints: route.waypoints,
    waypointIndex: 0,
    x: route.waypoints[0].x,
    y: route.waypoints[0].y,
    facing: 0,
    state: GUARD_STATE.PATROL,
    pauseLeft: 0,
    investigate: null, // {x, y, secondsLeft}
    chaseTarget: null, // {x, y}
    seesThief: false,
    spotFlash: 0, // seconds the "!" stays up after first spotting
  }));
}

/** Move `guard` one step; returns nothing, mutates the guard in place. */
export function updateGuard(guard, dt, blockers, thief, alarmTripped) {
  const speed = guard.state === GUARD_STATE.CHASE ? GUARD.chaseSpeed : GUARD.patrolSpeed;

  if (alarmTripped) {
    guard.state = GUARD_STATE.CHASE;
    if (thief) guard.chaseTarget = { x: thief.x, y: thief.y };
  }

  let target = null;
  if (guard.state === GUARD_STATE.CHASE && guard.chaseTarget) {
    target = guard.chaseTarget;
  } else if (guard.state === GUARD_STATE.INVESTIGATE && guard.investigate) {
    target = guard.investigate;
  } else {
    guard.state = GUARD_STATE.PATROL;
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
      return;
    }
    target = guard.waypoints[guard.waypointIndex];
  }

  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 4) {
    if (guard.state === GUARD_STATE.PATROL) {
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      guard.pauseLeft = GUARD.pauseSeconds;
    } else if (guard.state === GUARD_STATE.INVESTIGATE) {
      guard.investigate.secondsLeft -= dt;
      guard.facing += dt * 1.2; // look around while checking the noise
      if (guard.investigate.secondsLeft <= 0) {
        guard.investigate = null;
        guard.state = GUARD_STATE.PATROL;
      }
    } else if (guard.state === GUARD_STATE.CHASE) {
      guard.chaseTarget = null;
      guard.state = GUARD_STATE.PATROL;
    }
    return;
  }

  const step = Math.min(distance, speed * dt);
  guard.x += (dx / distance) * step;
  guard.y += (dy / distance) * step;
  guard.facing = angleTo(guard, target);
}

/** Send a guard to check a noise at (x, y) for a few seconds. */
export function sendGuardToInvestigate(guard, x, y) {
  if (guard.state === GUARD_STATE.CHASE) return;
  guard.state = GUARD_STATE.INVESTIGATE;
  guard.investigate = { x, y, secondsLeft: COIN_INVESTIGATE_SECONDS };
}

/** Does this guard currently see the thief? Sets seesThief and the spot flash. */
export function guardSeesThief(guard, thief, blockers) {
  const seen = canSee(
    { x: guard.x, y: guard.y, facing: guard.facing, range: GUARD.visionRange, halfAngle: GUARD.visionHalfAngle },
    thief,
    blockers,
  );
  if (seen && !guard.seesThief) guard.spotFlash = 0.9;
  guard.seesThief = seen;
  if (guard.spotFlash > 0) guard.spotFlash -= 1 / 60;
  return seen;
}

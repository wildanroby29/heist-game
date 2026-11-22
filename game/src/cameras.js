// The wall cameras of The Vault. Each camera hangs on a wall and sweeps its
// vision cone back and forth on a fixed period, so the player must read the
// sweep and time the crossing.
import { CAMERA } from './config.js';
import { canSee } from './vision.js';

export function createCameras(mounts) {
  return mounts.map((mount, index) => ({
    name: mount.name,
    x: mount.x,
    y: mount.y,
    baseAngle: mount.baseAngle,
    // Stagger the sweeps so the three cameras are never in phase.
    phase: index * 1.7,
    facing: mount.baseAngle,
    seesThief: false,
    spotFlash: 0,
  }));
}

/** Advance the sweep; the cone angle oscillates around the resting aim. */
export function updateCamera(camera, timeSeconds) {
  const t = timeSeconds + camera.phase;
  const swing = Math.sin((2 * Math.PI * t) / CAMERA.sweepPeriodSeconds);
  camera.facing = camera.baseAngle + swing * CAMERA.sweepHalfAngle;
}

/** Does this camera currently see the thief? Sets seesThief and the spot flash. */
export function cameraSeesThief(camera, thief, blockers) {
  const seen = canSee(
    { x: camera.x, y: camera.y, facing: camera.facing, range: CAMERA.visionRange, halfAngle: CAMERA.visionHalfAngle },
    thief,
    blockers,
  );
  if (seen && !camera.seesThief) camera.spotFlash = 0.9;
  camera.seesThief = seen;
  if (camera.spotFlash > 0) camera.spotFlash -= 1 / 60;
  return seen;
}

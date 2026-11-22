// Vision maths for The Vault: vision cones and line of sight. A watcher sees
// the thief only when the thief is inside the cone AND no wall or cover blocks
// the straight line between them.

/** Angle of `point` as seen from `from`, in radians. */
export function angleTo(from, point) {
  return Math.atan2(point.y - from.y, point.x - from.x);
}

/** Smallest absolute difference between two angles, in radians. */
export function angleDifference(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff);
}

/** True when `point` lies inside a cone of `range` and `halfAngle` around `facing`. */
export function insideCone(from, facing, range, halfAngle, point) {
  const dx = point.x - from.x;
  const dy = point.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return false;
  if (distance < 1) return true;
  return angleDifference(Math.atan2(dy, dx), facing) <= halfAngle;
}

/** True when the segment a->b touches the rectangle (x, y, w, h). */
export function segmentHitsRect(ax, ay, bx, by, rect) {
  const minX = Math.min(ax, bx);
  const maxX = Math.max(ax, bx);
  const minY = Math.min(ay, by);
  const maxY = Math.max(ay, by);
  if (maxX < rect.x || minX > rect.x + rect.w || maxY < rect.y || minY > rect.y + rect.h) return false;
  if (ax >= rect.x && ax <= rect.x + rect.w && ay >= rect.y && ay <= rect.y + rect.h) return true;
  if (bx >= rect.x && bx <= rect.x + rect.w && by >= rect.y && by <= rect.y + rect.h) return true;
  const dx = bx - ax;
  const dy = by - ay;
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [x1, y1, x2, y2] of edges) {
    const denom = dx * (y2 - y1) - dy * (x2 - x1);
    if (denom === 0) continue;
    const t = ((x1 - ax) * (y2 - y1) - (y1 - ay) * (x2 - x1)) / denom;
    const u = ((x1 - ax) * dy - (y1 - ay) * dx) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

/** True when nothing in `blockers` stands between `from` and `to`. */
export function hasLineOfSight(from, to, blockers) {
  for (const rect of blockers) {
    if (segmentHitsRect(from.x, from.y, to.x, to.y, rect)) return false;
  }
  return true;
}

/** True when `watcher` (with facing, range, half-angle) can see `target`. */
export function canSee(watcher, target, blockers) {
  return (
    insideCone(watcher, watcher.facing, watcher.range, watcher.halfAngle, target) &&
    hasLineOfSight(watcher, target, blockers)
  );
}

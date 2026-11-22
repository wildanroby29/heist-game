// The bank floor of The Vault: walls, cover, the vault room, the escape door,
// guard patrol routes, camera mounts and gold-bar spawns. Pure data plus a
// couple of helpers; no behaviour lives here.
import { FIELD, HUD_HEIGHT, WALL, BAR_VALUE } from './config.js';

export const ENTRANCE = { x: 640, y: 738 };

// Every rectangle the thief, guards and sight lines cannot cross.
export function buildWalls() {
  const walls = [];
  // Outer shell (the entrance gap is a door in the bottom wall, not a hole).
  walls.push({ x: 0, y: HUD_HEIGHT, w: FIELD.width, h: WALL }); // top
  walls.push({ x: 0, y: FIELD.height - WALL, w: FIELD.width, h: WALL }); // bottom
  walls.push({ x: 0, y: HUD_HEIGHT, w: WALL, h: FIELD.height - HUD_HEIGHT }); // left
  walls.push({ x: FIELD.width - WALL, y: HUD_HEIGHT, w: WALL, h: FIELD.height - HUD_HEIGHT }); // right
  // Vault room, top-right: walls with one doorway at the bottom (x 980-1080).
  walls.push({ x: 880, y: HUD_HEIGHT + WALL, w: WALL, h: 208 }); // vault west wall
  walls.push({ x: 880, y: 282, w: 100, h: WALL }); // vault south wall, left of door
  walls.push({ x: 1080, y: 282, w: FIELD.width - WALL - 1080, h: WALL }); // vault south wall, right of door
  return walls;
}

// Furniture that blocks sight (and movement): teller counter, desks, pillars.
export function buildCover() {
  return [
    { x: 420, y: 392, w: 440, h: 74, label: 'TELLER', kind: 'counter' },
    { x: 180, y: 170, w: 130, h: 58, label: 'DESK', kind: 'desk' },
    { x: 560, y: 170, w: 130, h: 58, label: 'DESK', kind: 'desk' },
    { x: 180, y: 580, w: 130, h: 58, label: 'DESK', kind: 'desk' },
    { x: 900, y: 560, w: 130, h: 58, label: 'DESK', kind: 'desk' },
    { x: 330, y: 300, w: 46, h: 46, label: '', kind: 'pillar' },
    { x: 950, y: 420, w: 46, h: 46, label: '', kind: 'pillar' },
    { x: 1120, y: 470, w: 46, h: 46, label: '', kind: 'pillar' },
    { x: 60, y: 420, w: 90, h: 44, label: 'PLANTS', kind: 'planter' },
    { x: 1060, y: 620, w: 90, h: 44, label: 'PLANTS', kind: 'planter' },
  ];
}

// The vault itself: the round door on the east wall and the table of gold bars.
export const VAULT = {
  door: { x: FIELD.width - WALL, y: 180, radius: 52 },
  table: { x: 980, y: 130, w: 220, h: 90 },
  bars: [
    { x: 1010, y: 150 }, { x: 1060, y: 150 }, { x: 1110, y: 150 },
    { x: 1010, y: 185 }, { x: 1060, y: 185 }, { x: 1110, y: 185 },
  ].map((spot) => ({ ...spot, value: BAR_VALUE, taken: false })),
};

// The escape zone in the south-west corner; it opens once LOOT_TARGET is met.
export const EXIT_ZONE = { x: WALL, y: 668, w: 120, h: 118 };

export const GUARD_ROUTES = [
  {
    name: 'Marco',
    color: '#2f5d8a',
    waypoints: [
      { x: 300, y: 140 }, { x: 700, y: 140 }, { x: 700, y: 300 }, { x: 300, y: 300 },
    ],
  },
  {
    name: 'Rosa',
    color: '#5d3a8a',
    waypoints: [
      { x: 150, y: 520 }, { x: 640, y: 520 }, { x: 640, y: 640 }, { x: 150, y: 640 },
    ],
  },
  {
    name: 'Vince',
    color: '#8a5a2f',
    waypoints: [
      { x: 980, y: 360 }, { x: 1180, y: 360 }, { x: 1180, y: 620 }, { x: 980, y: 620 },
    ],
  },
];

// Wall cameras: position, the wall they hang on, and their resting aim.
export const CAMERA_MOUNTS = [
  { x: 640, y: HUD_HEIGHT + WALL, baseAngle: Math.PI / 2, name: 'CAM 1' },
  { x: FIELD.width - WALL, y: 480, baseAngle: Math.PI, name: 'CAM 2' },
  { x: WALL, y: 300, baseAngle: 0, name: 'CAM 3' },
];

// Extra coin pickups lying on the floor (a tool at a cost: coins are limited).
export const COIN_PICKUPS = [
  { x: 240, y: 470, taken: false },
  { x: 760, y: 250, taken: false },
  { x: 1150, y: 700, taken: false },
];

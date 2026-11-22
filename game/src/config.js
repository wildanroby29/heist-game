// The Vault — a top-down bank heist. Tunable numbers live here and nowhere else.
export const FIELD = { width: 1280, height: 800 };
export const HUD_HEIGHT = 64;
export const WALL = 14;

export const PLAYER = {
  radius: 12,
  walkSpeed: 175,
  sneakSpeed: 92,
  // How close a guard must be to grab the thief.
  grabDistance: 24,
};

export const LOOT_TARGET = 2500; // dollars the thief must steal before ESCAPE opens
export const BAR_VALUE = 500;
export const COINS_START = 5;
export const COIN_THROW_RANGE = 260;
export const COIN_INVESTIGATE_SECONDS = 4;

export const ALARM = {
  max: 100,
  // Alarm level that trips the full alarm: guards converge on the thief.
  trip: 100,
  // Alarm level the meter settles back to after a catch.
  afterCaught: 35,
  decayPerSecond: 12,
  guardSeePerSecond: 55,
  cameraSeePerSecond: 70,
  // Running (not sneaking) close to a guard is heard.
  heardPerSecond: 10,
  heardDistance: 130,
};

export const GUARD = {
  radius: 13,
  patrolSpeed: 72,
  chaseSpeed: 152,
  visionRange: 235,
  visionHalfAngle: 0.56, // radians, about 32 degrees each side
  pauseSeconds: 1.6,
  // Sneaking inside a cone is spotted much more slowly.
  sneakSpotFactor: 0.45,
};

export const CAMERA = {
  visionRange: 265,
  visionHalfAngle: 0.5,
  sweepHalfAngle: 0.85,
  sweepPeriodSeconds: 5.2,
};

export const COLORS = {
  floorA: '#222839',
  floorB: '#1d2333',
  floorLine: '#2c3448',
  wall: '#3a4157',
  wallTop: '#4d5570',
  hud: '#10141f',
  hudLine: '#2a3145',
  gold: '#f5c542',
  goldDark: '#c9931a',
  vaultDoor: '#8f9bb0',
  vaultDoorDark: '#6b768c',
  guard: '#2f5d8a',
  guardCap: '#1d3a5c',
  camera: '#c0392b',
  coneGuard: 'rgba(255, 208, 60, 0.16)',
  coneGuardEdge: 'rgba(255, 208, 60, 0.45)',
  coneCamera: 'rgba(255, 92, 60, 0.14)',
  coneCameraEdge: 'rgba(255, 92, 60, 0.45)',
  coneAlert: 'rgba(255, 45, 45, 0.30)',
  coneAlertEdge: 'rgba(255, 45, 45, 0.8)',
  thief: '#12b5a5',
  thiefDark: '#0b7a70',
  cover: '#5a4a33',
  coverTop: '#6e5c40',
  pillar: '#4a4f63',
  exit: '#1f9d55',
  exitDark: '#14703c',
  text: '#f2f4f8',
  textDim: '#9aa5bd',
  alarmLow: '#39d353',
  alarmMid: '#f5c542',
  alarmHigh: '#ff453a',
};

// All drawing for The Vault: the bank floor, vault, cover, vision cones,
// guards, cameras, the thief, the HUD and the title/win/caught screens.
// Nothing here changes game state; it only paints the world.
import { FIELD, HUD_HEIGHT, WALL, PLAYER, LOOT_TARGET, ALARM, GUARD, CAMERA, COLORS } from './config.js';
import { VAULT, EXIT_ZONE } from './level.js';
import { SCREEN } from './world.js';

const TILE = 80;

function roundRect(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawFloor(ctx) {
  for (let y = HUD_HEIGHT; y < FIELD.height; y += TILE) {
    for (let x = 0; x < FIELD.width; x += TILE) {
      const even = ((x / TILE) + (y / TILE)) % 2 === 0;
      ctx.fillStyle = even ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, TILE, TILE);
    }
  }
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= FIELD.width; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, HUD_HEIGHT);
    ctx.lineTo(x, FIELD.height);
    ctx.stroke();
  }
  for (let y = HUD_HEIGHT; y <= FIELD.height; y += TILE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD.width, y);
    ctx.stroke();
  }
  // The vault room floor is polished marble: a lighter tint.
  ctx.fillStyle = 'rgba(245, 197, 66, 0.05)';
  ctx.fillRect(880, HUD_HEIGHT + WALL, FIELD.width - WALL - 880, 282 - HUD_HEIGHT - WALL);
}

function drawWalls(ctx, walls) {
  for (const wall of walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(wall.x, wall.y, wall.w, 3);
  }
}

function drawCover(ctx, cover) {
  for (const item of cover) {
    ctx.fillStyle = item.kind === 'pillar' ? COLORS.pillar : COLORS.cover;
    roundRect(ctx, item.x, item.y, item.w, item.h, item.kind === 'pillar' ? 6 : 4);
    ctx.fill();
    ctx.fillStyle = item.kind === 'pillar' ? '#5b6076' : COLORS.coverTop;
    roundRect(ctx, item.x + 3, item.y + 3, item.w - 6, Math.max(8, item.h - 6), 3);
    ctx.fill();
    if (item.label) {
      ctx.fillStyle = 'rgba(242, 244, 248, 0.75)';
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, item.x + item.w / 2, item.y + item.h / 2);
    }
  }
}

function drawVault(ctx, world) {
  const door = VAULT.door;
  // Round vault door set into the east wall.
  ctx.fillStyle = COLORS.vaultDoorDark;
  ctx.beginPath();
  ctx.arc(door.x - 4, door.y, door.radius + 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.vaultDoor;
  ctx.beginPath();
  ctx.arc(door.x - 4, door.y, door.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.vaultDoorDark;
  ctx.lineWidth = 4;
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(door.x - 4, door.y);
    ctx.lineTo(door.x - 4 + Math.cos(angle) * (door.radius - 6), door.y + Math.sin(angle) * (door.radius - 6));
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.vaultDoorDark;
  ctx.beginPath();
  ctx.arc(door.x - 4, door.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('VAULT', 1090, 112);

  // The table of gold bars.
  const table = VAULT.table;
  ctx.fillStyle = '#3d3222';
  roundRect(ctx, table.x, table.y, table.w, table.h, 6);
  ctx.fill();
  ctx.fillStyle = '#54432c';
  roundRect(ctx, table.x + 4, table.y + 4, table.w - 8, table.h - 8, 4);
  ctx.fill();
  for (const bar of world.bars) {
    if (bar.taken) continue;
    ctx.fillStyle = COLORS.goldDark;
    roundRect(ctx, bar.x - 2, bar.y - 1, 44, 18, 3);
    ctx.fill();
    ctx.fillStyle = COLORS.gold;
    roundRect(ctx, bar.x, bar.y, 40, 14, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillRect(bar.x + 5, bar.y + 2, 30, 3);
  }
  const remaining = world.bars.filter((bar) => !bar.taken).length;
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`GOLD BARS: ${remaining} LEFT`, 1090, table.y + table.h + 18);
}

function drawExit(ctx, world) {
  const open = world.loot >= LOOT_TARGET;
  ctx.fillStyle = open ? COLORS.exit : 'rgba(31, 157, 85, 0.25)';
  roundRect(ctx, EXIT_ZONE.x, EXIT_ZONE.y, EXIT_ZONE.w, EXIT_ZONE.h, 8);
  ctx.fill();
  ctx.strokeStyle = open ? '#7be3a2' : 'rgba(123, 227, 162, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = open ? '#eafff1' : 'rgba(234, 255, 241, 0.65)';
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ESCAPE', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + 40);
  ctx.font = 'bold 11px Arial, sans-serif';
  if (open) {
    ctx.fillText('GO! GET OUT!', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + 62);
  } else {
    ctx.fillText('LOCKED', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + 62);
    ctx.fillText(`NEED $${LOOT_TARGET - world.loot}`, EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + 78);
  }
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText('exit door', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + 92);
}

function drawCone(ctx, x, y, facing, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuard(ctx, guard) {
  const alert = guard.seesThief;
  drawCone(
    ctx, guard.x, guard.y, guard.facing, GUARD.visionRange, GUARD.visionHalfAngle,
    alert ? COLORS.coneAlert : COLORS.coneGuard,
    alert ? COLORS.coneAlertEdge : COLORS.coneGuardEdge,
  );
  // Body and cap.
  ctx.fillStyle = guard.color;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guardCap;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius - 4, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * (GUARD.radius + 6), guard.y + Math.sin(guard.facing) * (GUARD.radius + 6));
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(guard.name.toUpperCase(), guard.x, guard.y - GUARD.radius - 5);
  if (guard.spotFlash > 0) {
    ctx.fillStyle = '#ff453a';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('!', guard.x, guard.y - GUARD.radius - 20);
  }
}

function drawCamera(ctx, camera) {
  const alert = camera.seesThief;
  drawCone(
    ctx, camera.x, camera.y, camera.facing, CAMERA.visionRange, CAMERA.visionHalfAngle,
    alert ? COLORS.coneAlert : COLORS.coneCamera,
    alert ? COLORS.coneAlertEdge : COLORS.coneCameraEdge,
  );
  ctx.fillStyle = '#2b2f3a';
  ctx.fillRect(camera.x - 9, camera.y - 9, 18, 18);
  ctx.fillStyle = COLORS.camera;
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(camera.x + Math.cos(camera.facing) * 3, camera.y + Math.sin(camera.facing) * 3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.textDim;
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  const labelX = Math.max(30, Math.min(FIELD.width - 30, camera.x));
  ctx.fillText(camera.name, labelX, camera.y + 24);
  if (camera.spotFlash > 0) {
    ctx.fillStyle = '#ff453a';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('!', camera.x, camera.y - 18);
  }
}

function drawPlayer(ctx, world) {
  const player = world.player;
  if (player.invulnerableLeft > 0 && Math.floor(world.time * 8) % 2 === 0) return; // blink while safe
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER.radius, 0, Math.PI * 2);
  ctx.fill();
  // Mask band.
  ctx.strokeStyle = COLORS.thiefDark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER.radius - 3, player.facing - 0.9, player.facing + 0.9);
  ctx.stroke();
  // Facing tick.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.facing) * (PLAYER.radius + 5), player.y + Math.sin(player.facing) * (PLAYER.radius + 5));
  ctx.stroke();
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(18, 181, 165, 0.7)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER.radius + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.thief;
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', player.x, player.y - PLAYER.radius - 6);
  } else {
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', player.x, player.y - PLAYER.radius - 6);
  }
}

function drawCoinPickups(ctx, world) {
  for (const coin of world.coinPickups) {
    if (coin.taken) continue;
    ctx.fillStyle = '#d8b25a';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5d97a';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (world.coin !== null) {
    ctx.strokeStyle = '#f5d97a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(world.coin.x, world.coin.y, 10 + Math.sin(world.time * 12) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f5d97a';
    ctx.beginPath();
    ctx.arc(world.coin.x, world.coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function drawHud(ctx, world) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, FIELD.width, HUD_HEIGHT);
  ctx.fillStyle = COLORS.hudLine;
  ctx.fillRect(0, HUD_HEIGHT - 2, FIELD.width, 2);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('THE VAULT', 16, 30);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText('a bank heist', 16, 50);

  // Alarm meter.
  const meterX = 210;
  const meterY = 18;
  const meterW = 250;
  const meterH = 20;
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText('ALARM', meterX, meterY - 4 + 12);
  ctx.fillStyle = '#262c3d';
  roundRect(ctx, meterX + 62, meterY, meterW, meterH, 5);
  ctx.fill();
  const ratio = world.alarm / ALARM.max;
  ctx.fillStyle = ratio < 0.45 ? COLORS.alarmLow : ratio < 0.75 ? COLORS.alarmMid : COLORS.alarmHigh;
  if (ratio > 0.01) {
    roundRect(ctx, meterX + 62, meterY, Math.max(10, meterW * ratio), meterH, 5);
    ctx.fill();
  }
  ctx.strokeStyle = '#4d5570';
  ctx.lineWidth = 1;
  roundRect(ctx, meterX + 62, meterY, meterW, meterH, 5);
  ctx.stroke();
  ctx.fillStyle = world.alarmTripped ? COLORS.alarmHigh : COLORS.text;
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText(world.alarmTripped ? 'ALARM!' : `${Math.round(world.alarm)}%`, meterX + 62 + meterW + 10, meterY + 15);

  // Loot, coins, lives, timer.
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.fillText(`LOOT $${world.loot} / $${LOOT_TARGET}`, 600, 30);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText(`◉ ${world.coins} coins`, 600, 52);
  ctx.fillStyle = '#ff6b81';
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.fillText('♥'.repeat(world.lives) + '♡'.repeat(Math.max(0, 3 - world.lives)), 830, 30);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText('lives', 830, 50);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.fillText(formatTime(world.elapsed), 1010, 30);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText(`score ${world.score}`, 1010, 50);
  ctx.textAlign = 'left';
}

function drawMessage(ctx, world) {
  if (world.messageLeft <= 0 || !world.message) return;
  ctx.font = 'bold 15px Arial, sans-serif';
  const width = ctx.measureText(world.message).width + 28;
  ctx.fillStyle = 'rgba(16, 20, 31, 0.88)';
  roundRect(ctx, (FIELD.width - width) / 2, FIELD.height - 52, width, 34, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.fillText(world.message, FIELD.width / 2, FIELD.height - 29);
  ctx.textAlign = 'left';
}

/** Paint the whole room (no HUD text over the title/win/over screens' veils). */
export function drawWorld(ctx, world) {
  drawFloor(ctx);
  drawExit(ctx, world);
  drawVault(ctx, world);
  drawCover(ctx, world.cover);
  drawWalls(ctx, world.walls);
  drawCoinPickups(ctx, world);
  for (const guard of world.guards) drawGuard(ctx, guard);
  for (const camera of world.cameras) drawCamera(ctx, camera);
  drawPlayer(ctx, world);
  drawHud(ctx, world);
  drawMessage(ctx, world);
  if (world.alarmTripped) {
    ctx.strokeStyle = 'rgba(255, 69, 58, 0.85)';
    ctx.lineWidth = 5;
    ctx.strokeRect(3, HUD_HEIGHT + 3, FIELD.width - 6, FIELD.height - HUD_HEIGHT - 6);
    ctx.fillStyle = COLORS.alarmHigh;
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ ALARM — HIDE OR RUN ⚠', FIELD.width / 2, HUD_HEIGHT + 36);
    ctx.textAlign = 'left';
  }
}

function drawVeil(ctx, alpha) {
  ctx.fillStyle = `rgba(8, 11, 20, ${alpha})`;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function drawTitle(ctx, world) {
  drawWorld(ctx, world);
  drawVeil(ctx, 0.66);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 84px Arial, sans-serif';
  ctx.fillText('THE VAULT', FIELD.width / 2, 250);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText('A bank heist — steal the gold, dodge the cones, get out clean', FIELD.width / 2, 300);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '17px Arial, sans-serif';
  ctx.fillText('WASD / arrows — move      SHIFT — sneak (slow, quiet, harder to spot)', FIELD.width / 2, 380);
  ctx.fillText('E — pocket gold      Q or click — throw a coin to distract a guard', FIELD.width / 2, 410);
  ctx.fillText('Fill the ALARM meter and the guards come running. 3 lives. Steal $2,500, then reach ESCAPE.', FIELD.width / 2, 440);
  ctx.fillStyle = COLORS.thief;
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('Press ENTER to start', FIELD.width / 2, 510);
  ctx.textAlign = 'left';
}

function drawWin(ctx, world) {
  drawWorld(ctx, world);
  drawVeil(ctx, 0.7);
  const stats = world.winStats || { loot: world.loot, timeSeconds: 0, timeBonus: 0, livesBonus: 0, score: world.score };
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.fillText('CLEAN GETAWAY!', FIELD.width / 2, 260);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText(`You escaped with $${stats.loot} in gold`, FIELD.width / 2, 320);
  ctx.font = '19px Arial, sans-serif';
  ctx.fillText(`Time ${formatTime(stats.timeSeconds)}  •  time bonus +${stats.timeBonus}  •  lives bonus +${stats.livesBonus}`, FIELD.width / 2, 360);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 30px Arial, sans-serif';
  ctx.fillText(`SCORE ${stats.score}`, FIELD.width / 2, 410);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '17px Arial, sans-serif';
  ctx.fillText('Press R to play again', FIELD.width / 2, 470);
  ctx.textAlign = 'left';
}

function drawOver(ctx, world) {
  drawWorld(ctx, world);
  drawVeil(ctx, 0.72);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.alarmHigh;
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.fillText('CAUGHT!', FIELD.width / 2, 260);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('The guards haul you out. The vault keeps its gold.', FIELD.width / 2, 320);
  ctx.font = '19px Arial, sans-serif';
  ctx.fillText(`Loot kept: $${world.loot}  •  Score ${world.score}`, FIELD.width / 2, 360);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '17px Arial, sans-serif';
  ctx.fillText('Press R to try again', FIELD.width / 2, 430);
  ctx.textAlign = 'left';
}

/** Paint the current screen of the game. */
export function draw(ctx, world) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (world.screen === SCREEN.TITLE) drawTitle(ctx, world);
  else if (world.screen === SCREEN.WIN) drawWin(ctx, world);
  else if (world.screen === SCREEN.OVER) drawOver(ctx, world);
  else drawWorld(ctx, world);
}

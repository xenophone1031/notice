import { initInput, consumeChoiceKey } from "./input.js";
import { createPlayer, updatePlayer, drawPlayer, loadPlayerSprite } from "./player.js";
import {
  createEnemySystem,
  resetEnemies,
  updateEnemies,
  drawEnemies,
} from "./enemy.js";
import {
  createProjectileSystem,
  resetProjectiles,
  updateProjectiles,
  drawProjectiles,
} from "./projectile.js";
import {
  createWeaponLoadout,
  updateWeapons,
  drawAuraHint,
} from "./weapon.js";
import {
  createXpSystem,
  resetXp,
  updateXpGems,
  collectXp,
  drawXpGems,
  rollUpgrades,
  applyLevelUp,
  needsLevelUp,
} from "./xp.js";
import {
  createEffectSystem,
  resetEffects,
  updateEffects,
  drawEffects,
} from "./effects.js";
import {
  resolveCollisions,
  resolveProjectileDeathExplosions,
} from "./collision.js";
import {
  bindUiHandlers,
  showStart,
  showPlaying,
  showLevelUp,
  hideLevelUp,
  showGameOver,
  updateHud,
} from "./ui.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const STATE = {
  MENU: "menu",
  PLAYING: "playing",
  LEVELUP: "levelup",
  GAMEOVER: "gameover",
};

let state = STATE.MENU;
let player = createPlayer();
let enemies = createEnemySystem();
let projectiles = createProjectileSystem();
let loadout = createWeaponLoadout();
let xpSystem = createXpSystem();
let fx = createEffectSystem();
let pendingUpgrades = [];
let lastTime = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function getCamera() {
  return {
    x: player.x - canvas.width / 2,
    y: player.y - canvas.height / 2,
  };
}

function resetGame() {
  player = createPlayer();
  loadout = createWeaponLoadout();
  resetEnemies(enemies);
  resetProjectiles(projectiles);
  resetXp(xpSystem);
  resetEffects(fx);
  pendingUpgrades = [];
}

function startGame() {
  resetGame();
  state = STATE.PLAYING;
  showPlaying();
  updateHud(player);
}

function enterLevelUp() {
  applyLevelUp(player);
  pendingUpgrades = rollUpgrades(loadout);
  state = STATE.LEVELUP;
  showLevelUp(pendingUpgrades);
  updateHud(player);
}

function selectUpgrade(index) {
  if (state !== STATE.LEVELUP) return;
  const upgrade = pendingUpgrades[index];
  if (!upgrade) return;
  upgrade.apply(player, loadout);
  pendingUpgrades = [];
  hideLevelUp();

  if (needsLevelUp(player)) {
    enterLevelUp();
    return;
  }

  state = STATE.PLAYING;
  showPlaying();
  updateHud(player);
}

function enterGameOver() {
  state = STATE.GAMEOVER;
  showGameOver(player);
}

function drawBackground(cam) {
  const grid = 48;
  const startX = Math.floor(cam.x / grid) * grid;
  const startY = Math.floor(cam.y / grid) * grid;

  ctx.fillStyle = "#1a2332";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = startX; x < cam.x + canvas.width + grid; x += grid) {
    const sx = x - cam.x;
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, canvas.height);
  }
  for (let y = startY; y < cam.y + canvas.height + grid; y += grid) {
    const sy = y - cam.y;
    ctx.moveTo(0, sy);
    ctx.lineTo(canvas.width, sy);
  }
  ctx.stroke();
}

function update(dt) {
  if (state === STATE.LEVELUP) {
    const choice = consumeChoiceKey();
    if (choice >= 0) selectUpgrade(choice);
    return;
  }

  if (state !== STATE.PLAYING) return;

  updatePlayer(player, dt);
  updateEnemies(enemies, player, dt, canvas.width, canvas.height);
  updateWeapons(loadout, player, enemies.list, projectiles, fx, dt);
  updateProjectiles(projectiles, dt, enemies.list, fx);
  resolveCollisions(player, enemies, projectiles, xpSystem, fx);
  resolveProjectileDeathExplosions(player, enemies, projectiles, xpSystem, fx);
  enemies.list = enemies.list.filter((e) => e.alive);
  projectiles.list = projectiles.list.filter((p) => p.alive);
  updateXpGems(xpSystem, player, dt);
  collectXp(xpSystem, player);
  updateEffects(fx, dt);

  if (needsLevelUp(player)) {
    enterLevelUp();
  }

  updateHud(player);

  if (player.hp <= 0) {
    enterGameOver();
  }
}

function render() {
  const cam = getCamera();
  drawBackground(cam);

  if (state === STATE.MENU) return;

  drawXpGems(ctx, xpSystem.gems, cam);
  drawAuraHint(ctx, loadout, player, cam);
  drawProjectiles(ctx, projectiles.list, cam);
  drawEnemies(ctx, enemies.list, cam);
  drawPlayer(ctx, player, cam);
  drawEffects(ctx, fx, cam);

  if (state === STATE.PLAYING || state === STATE.LEVELUP) {
    ctx.beginPath();
    ctx.arc(
      player.x - cam.x,
      player.y - cam.y,
      player.pickupRadius,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = "rgba(163, 113, 247, 0.22)";
    ctx.stroke();
  }
}

function frame(time) {
  const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
  lastTime = time;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

async function init() {
  resize();
  window.addEventListener("resize", resize);
  initInput();
  bindUiHandlers({
    onStart: startGame,
    onRetry: startGame,
    onSelectUpgrade: selectUpgrade,
  });
  showStart();
  await loadPlayerSprite("dht.jpg");
  requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(frame);
  });
}

init();

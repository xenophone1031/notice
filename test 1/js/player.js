import { clamp, normalize } from "./utils.js";
import { getMoveVector } from "./input.js";

const SPRITE_COLS = 4;
const SPRITE_ROWS = 4;
const ANIM_FPS = 10;
const DRAW_W = 48;
const DRAW_H = 72;

/** @type {HTMLCanvasElement | HTMLImageElement | null} */
let spriteImage = null;
let spriteReady = false;
let spriteFailed = false;

function processSpriteTransparency(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  // Sample corners to catch checkerboard background colors
  const samples = [
    0,
    (canvas.width - 1) * 4,
    (canvas.height - 1) * canvas.width * 4,
    ((canvas.height - 1) * canvas.width + canvas.width - 1) * 4,
  ];
  const bgColors = samples.map((i) => [d[i], d[i + 1], d[i + 2]]);

  const near = (r, g, b, c, tol = 28) =>
    Math.abs(r - c[0]) <= tol && Math.abs(g - c[1]) <= tol && Math.abs(b - c[2]) <= tol;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    // light gray / white checkerboard, or colors matching sampled corners
    const isLightChecker =
      Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && r >= 175;
    const isCornerBg = bgColors.some((c) => near(r, g, b, c, 24));
    if (isLightChecker || isCornerBg) {
      d[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function loadPlayerSprite(src = "dht.jpg") {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        spriteImage = processSpriteTransparency(img);
        spriteReady = true;
        resolve(true);
      } catch {
        spriteImage = img;
        spriteReady = true;
        resolve(true);
      }
    };
    img.onerror = () => {
      spriteFailed = true;
      spriteReady = false;
      resolve(false);
    };
    img.src = src;
  });
}

export function createPlayer() {
  return {
    x: 0,
    y: 0,
    radius: 16,
    maxHp: 100,
    hp: 100,
    moveSpeed: 180,
    pickupRadius: 60,
    iFrameMs: 500,
    iFrameLeft: 0,
    level: 1,
    xp: 0,
    xpToNext: 5,
    kills: 0,
    facing: "down",
    animFrame: 0,
    animTimer: 0,
    moving: false,
  };
}

function facingFromMove(x, y) {
  if (Math.abs(x) > Math.abs(y)) {
    return x < 0 ? "left" : "right";
  }
  return y < 0 ? "up" : "down";
}

function rowFromFacing(facing) {
  // 1행 정면, 2행 좌, 3행 우, 4행 뒤
  switch (facing) {
    case "down":
      return 0;
    case "left":
      return 1;
    case "right":
      return 2;
    case "up":
      return 3;
    default:
      return 0;
  }
}

export function updatePlayer(player, dt) {
  if (player.iFrameLeft > 0) {
    player.iFrameLeft = Math.max(0, player.iFrameLeft - dt * 1000);
  }

  const move = getMoveVector();
  player.moving = move.x !== 0 || move.y !== 0;

  if (player.moving) {
    const dir = normalize(move.x, move.y);
    player.x += dir.x * player.moveSpeed * dt;
    player.y += dir.y * player.moveSpeed * dt;
    player.facing = facingFromMove(move.x, move.y);

    player.animTimer += dt;
    const frameDur = 1 / ANIM_FPS;
    while (player.animTimer >= frameDur) {
      player.animTimer -= frameDur;
      player.animFrame = (player.animFrame + 1) % SPRITE_COLS;
    }
  } else {
    player.animFrame = 0;
    player.animTimer = 0;
  }
}

export function damagePlayer(player, amount) {
  if (player.iFrameLeft > 0 || player.hp <= 0) return false;
  player.hp = clamp(player.hp - amount, 0, player.maxHp);
  player.iFrameLeft = player.iFrameMs;
  return true;
}

export function drawPlayer(ctx, player, cam) {
  const sx = player.x - cam.x;
  const sy = player.y - cam.y;
  const blinking =
    player.iFrameLeft > 0 && Math.floor(player.iFrameLeft / 80) % 2 === 0;

  if (blinking) ctx.globalAlpha = 0.35;

  if (spriteReady && spriteImage) {
    const fw = Math.floor(spriteImage.width / SPRITE_COLS);
    const fh = Math.floor(spriteImage.height / SPRITE_ROWS);
    const row = rowFromFacing(player.facing);
    const col = player.animFrame;

    ctx.drawImage(
      spriteImage,
      col * fw,
      row * fh,
      fw,
      fh,
      sx - DRAW_W / 2,
      sy - DRAW_H / 2,
      DRAW_W,
      DRAW_H
    );
  } else {
    ctx.beginPath();
    ctx.arc(sx, sy, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#58a6ff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx, sy, player.radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

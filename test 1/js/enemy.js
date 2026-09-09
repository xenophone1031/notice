import { normalize, randInt, randRange } from "./utils.js";

export function createEnemySystem() {
  return {
    list: [],
    spawnTimer: 0,
    spawnInterval: 1.1,
  };
}

export function resetEnemies(system) {
  system.list.length = 0;
  system.spawnTimer = 0;
  system.spawnInterval = 1.1;
}

function spawnOutsideView(player, canvasW, canvasH) {
  const margin = 40;
  const halfW = canvasW / 2 + margin;
  const halfH = canvasH / 2 + margin;
  const side = randInt(0, 3);
  let x = player.x;
  let y = player.y;

  if (side === 0) {
    x = player.x + randRange(-halfW, halfW);
    y = player.y - halfH;
  } else if (side === 1) {
    x = player.x + randRange(-halfW, halfW);
    y = player.y + halfH;
  } else if (side === 2) {
    x = player.x - halfW;
    y = player.y + randRange(-halfH, halfH);
  } else {
    x = player.x + halfW;
    y = player.y + randRange(-halfH, halfH);
  }

  return {
    id: `e_${Math.random().toString(36).slice(2)}_${Date.now()}`,
    x,
    y,
    radius: 12,
    hp: 20,
    maxHp: 20,
    speed: 70,
    contactDamage: 10,
    xpValue: randInt(1, 2),
    alive: true,
  };
}

export function updateEnemies(system, player, dt, canvasW, canvasH) {
  system.spawnTimer -= dt;
  if (system.spawnTimer <= 0) {
    system.list.push(spawnOutsideView(player, canvasW, canvasH));
    system.spawnTimer = system.spawnInterval;
    system.spawnInterval = Math.max(0.45, system.spawnInterval - 0.008);
  }

  for (const enemy of system.list) {
    if (!enemy.alive) continue;
    const dir = normalize(player.x - enemy.x, player.y - enemy.y);
    enemy.x += dir.x * enemy.speed * dt;
    enemy.y += dir.y * enemy.speed * dt;
  }

  system.list = system.list.filter((e) => e.alive);
}

export function drawEnemies(ctx, enemies, cam) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const sx = enemy.x - cam.x;
    const sy = enemy.y - cam.y;

    ctx.beginPath();
    ctx.arc(sx, sy, enemy.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#f85149";
    ctx.fill();

    const ratio = enemy.hp / enemy.maxHp;
    if (ratio < 1) {
      const bw = enemy.radius * 2;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(sx - bw / 2, sy - enemy.radius - 8, bw, 3);
      ctx.fillStyle = "#3fb950";
      ctx.fillRect(sx - bw / 2, sy - enemy.radius - 8, bw * ratio, 3);
    }
  }
}

import { dist, normalize, randRange } from "./utils.js";
import { spawnProjectile } from "./projectile.js";
import { spawnBeam, spawnBurst, spawnFlash, spawnRing } from "./effects.js";

export const WEAPON_CATALOG = {
  bolt: {
    id: "bolt",
    name: "매직 볼트",
    desc: "가까운 적에게 유도 마법탄",
    color: "#ffd700",
  },
  fireball: {
    id: "fireball",
    name: "파이어볼",
    desc: "폭발하는 화염구",
    color: "#ff6b2d",
  },
  shards: {
    id: "shards",
    name: "아이스 샤드",
    desc: "부채꼴 관통 얼음 조각",
    color: "#7dd3fc",
  },
  lightning: {
    id: "lightning",
    name: "체인 라이트닝",
    desc: "적을 연쇄 감전",
    color: "#c4b5fd",
  },
  orbit: {
    id: "orbit",
    name: "궤도 블레이드",
    desc: "주위를 도는 칼날",
    color: "#f0abfc",
  },
  aura: {
    id: "aura",
    name: "홀리 오라",
    desc: "주변 지속 성스러운 파동",
    color: "#fde68a",
  },
  knives: {
    id: "knives",
    name: "나이프 팬",
    desc: "전방위 단검 난사",
    color: "#e2e8f0",
  },
  meteor: {
    id: "meteor",
    name: "메테오",
    desc: "하늘에서 운석 낙하",
    color: "#fb923c",
  },
};

export function createWeaponLoadout() {
  return {
    owned: { bolt: 1 },
    timers: {
      bolt: 0,
      fireball: 0,
      shards: 0,
      lightning: 0,
      aura: 0,
      knives: 0,
      meteor: 0,
    },
    orbitSynced: false,
    damageBonus: 0,
    cooldownMul: 1,
  };
}

export function hasWeapon(loadout, id) {
  return (loadout.owned[id] || 0) > 0;
}

export function weaponLevel(loadout, id) {
  return loadout.owned[id] || 0;
}

export function unlockOrUpgradeWeapon(loadout, id) {
  loadout.owned[id] = (loadout.owned[id] || 0) + 1;
  if (id === "orbit") loadout.orbitSynced = false;
}

function findNearest(enemies, x, y, ignore = null) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const enemy of enemies) {
    if (!enemy.alive || enemy === ignore) continue;
    const d = dist(x, y, enemy.x, enemy.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = enemy;
    }
  }
  return { enemy: nearest, dist: nearestDist };
}

function sortedByDistance(enemies, x, y) {
  return enemies
    .filter((e) => e.alive)
    .map((e) => ({ e, d: dist(x, y, e.x, e.y) }))
    .sort((a, b) => a.d - b.d);
}

function syncOrbitBlades(loadout, player, projectiles) {
  const level = weaponLevel(loadout, "orbit");
  if (level <= 0) {
    projectiles.list = projectiles.list.filter((p) => p.kind !== "orbit");
    loadout.orbitSynced = true;
    return;
  }

  const count = 2 + level;
  const existing = projectiles.list.filter((p) => p.kind === "orbit");
  if (existing.length === count && loadout.orbitSynced) {
    for (const p of existing) {
      p.damage = 8 + level * 3 + loadout.damageBonus;
      p.orbitRadius = 54 + level * 8;
      p.owner = player;
    }
    return;
  }

  projectiles.list = projectiles.list.filter((p) => p.kind !== "orbit");
  for (let i = 0; i < count; i++) {
    spawnProjectile(projectiles, {
      x: player.x,
      y: player.y,
      kind: "orbit",
      color: "#f0abfc",
      damage: 8 + level * 3 + loadout.damageBonus,
      radius: 10,
      life: 9999,
      pierce: 999,
      trail: true,
      angle: (Math.PI * 2 * i) / count,
      spin: 3.2 + level * 0.35,
      orbitRadius: 54 + level * 8,
      owner: player,
      hitCooldown: 0.28,
    });
  }
  loadout.orbitSynced = true;
}

function fireBolt(loadout, player, enemies, projectiles, fx) {
  const level = weaponLevel(loadout, "bolt");
  const { enemy } = findNearest(enemies, player.x, player.y);
  if (!enemy) return false;

  const count = level >= 4 ? 3 : level >= 2 ? 2 : 1;
  const baseAng = Math.atan2(enemy.y - player.y, enemy.x - player.x);
  const speed = 420 + level * 20;
  const dmg = 10 + level * 3 + loadout.damageBonus;

  for (let i = 0; i < count; i++) {
    const spread = count === 1 ? 0 : (i - (count - 1) / 2) * 0.18;
    const ang = baseAng + spread;
    spawnProjectile(projectiles, {
      x: player.x,
      y: player.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      kind: "bolt",
      color: "#ffd700",
      damage: dmg,
      radius: 5 + level * 0.4,
      life: 2.2,
      pierce: level >= 5 ? 1 : 0,
      homing: 0.35 + level * 0.05,
    });
  }
  spawnFlash(fx, player.x, player.y, "#ffd700", 28, 0.08);
  return true;
}

function fireFireball(loadout, player, enemies, projectiles, fx) {
  const level = weaponLevel(loadout, "fireball");
  const { enemy } = findNearest(enemies, player.x, player.y);
  if (!enemy) return false;
  const dir = normalize(enemy.x - player.x, enemy.y - player.y);
  const speed = 280 + level * 15;
  spawnProjectile(projectiles, {
    x: player.x,
    y: player.y,
    vx: dir.x * speed,
    vy: dir.y * speed,
    kind: "fireball",
    color: "#ff6b2d",
    damage: 14 + level * 5 + loadout.damageBonus,
    radius: 9 + level,
    life: 2.4,
    explodeRadius: 48 + level * 10,
    pierce: 0,
    explodeOnDeath: true,
  });
  spawnFlash(fx, player.x, player.y, "#ff6b2d", 34, 0.1);
  return true;
}

function fireShards(loadout, player, enemies, projectiles, fx) {
  const level = weaponLevel(loadout, "shards");
  const { enemy } = findNearest(enemies, player.x, player.y);
  if (!enemy) return false;
  const base = Math.atan2(enemy.y - player.y, enemy.x - player.x);
  const count = 3 + level;
  const speed = 380 + level * 25;
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const ang = base + (t - 0.5) * (0.7 + level * 0.05);
    spawnProjectile(projectiles, {
      x: player.x,
      y: player.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      kind: "shard",
      color: "#7dd3fc",
      damage: 7 + level * 2 + loadout.damageBonus,
      radius: 5,
      life: 1.6,
      pierce: 1 + Math.floor(level / 2),
      spin: 10,
    });
  }
  spawnBurst(fx, player.x, player.y, "#7dd3fc", 8, 90);
  return true;
}

function fireLightning(loadout, player, enemies, fx) {
  const level = weaponLevel(loadout, "lightning");
  const ordered = sortedByDistance(enemies, player.x, player.y);
  if (!ordered.length) return false;

  const chains = Math.min(2 + level, ordered.length);
  const dmg = 12 + level * 4 + loadout.damageBonus;
  let prevX = player.x;
  let prevY = player.y;

  for (let i = 0; i < chains; i++) {
    const target = ordered[i].e;
    const falloff = 1 - i * 0.15;
    target.hp -= dmg * falloff;
    spawnBeam(fx, prevX, prevY, target.x, target.y, "#c4b5fd", 0.16);
    spawnFlash(fx, target.x, target.y, "#ddd6fe", 36, 0.12);
    spawnBurst(fx, target.x, target.y, "#a78bfa", 10, 160);
    prevX = target.x;
    prevY = target.y;
  }
  return true;
}

function pulseAura(loadout, player, enemies, fx) {
  const level = weaponLevel(loadout, "aura");
  const radius = 70 + level * 14;
  const dmg = 4 + level * 2 + loadout.damageBonus * 0.5;
  spawnRing(fx, player.x, player.y, "#fde68a", radius, 0.28);
  spawnFlash(fx, player.x, player.y, "#fef3c7", radius * 0.7, 0.1);

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (dist(player.x, player.y, enemy.x, enemy.y) <= radius + enemy.radius) {
      enemy.hp -= dmg;
      spawnTrailBurst(fx, enemy.x, enemy.y);
    }
  }
  return true;
}

function spawnTrailBurst(fx, x, y) {
  spawnBurst(fx, x, y, "#fde68a", 4, 60);
}

function fireKnives(loadout, player, projectiles, fx) {
  const level = weaponLevel(loadout, "knives");
  const count = 6 + level * 2;
  const speed = 460;
  const dmg = 6 + level * 2 + loadout.damageBonus;
  for (let i = 0; i < count; i++) {
    const ang = (Math.PI * 2 * i) / count + randRange(-0.05, 0.05);
    spawnProjectile(projectiles, {
      x: player.x,
      y: player.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      kind: "knife",
      color: "#e2e8f0",
      damage: dmg,
      radius: 4,
      life: 0.85,
      pierce: level >= 3 ? 1 : 0,
      trail: false,
    });
  }
  spawnRing(fx, player.x, player.y, "#e2e8f0", 40, 0.15);
  return true;
}

function fireMeteor(loadout, player, enemies, projectiles, fx) {
  const level = weaponLevel(loadout, "meteor");
  const ordered = sortedByDistance(enemies, player.x, player.y).slice(0, 1 + level);
  if (!ordered.length) {
    // still drop near player if no enemies nearby targeting empty-ish area
    const ang = randRange(0, Math.PI * 2);
    const tx = player.x + Math.cos(ang) * 120;
    const ty = player.y + Math.sin(ang) * 120;
    dropMeteor(projectiles, fx, tx, ty, level, loadout);
    return true;
  }
  for (const { e } of ordered) {
    dropMeteor(projectiles, fx, e.x, e.y, level, loadout);
  }
  return true;
}

function dropMeteor(projectiles, fx, tx, ty, level, loadout) {
  const startX = tx + randRange(-40, 40);
  const startY = ty - randRange(180, 260);
  spawnProjectile(projectiles, {
    x: startX,
    y: startY,
    vx: (tx - startX) * 0.6,
    vy: 80,
    kind: "meteor",
    color: "#fb923c",
    damage: 18 + level * 6 + loadout.damageBonus,
    radius: 11 + level,
    life: 2.5,
    explodeRadius: 55 + level * 12,
    trail: true,
    explodeOnDeath: true,
  });
  spawnFlash(fx, tx, ty, "#fdba74", 24, 0.2);
}

const COOLDOWNS = {
  bolt: (lv) => Math.max(0.18, 0.45 - lv * 0.04),
  fireball: (lv) => Math.max(0.5, 1.1 - lv * 0.08),
  shards: (lv) => Math.max(0.4, 0.95 - lv * 0.07),
  lightning: (lv) => Math.max(0.45, 1.0 - lv * 0.08),
  aura: (lv) => Math.max(0.35, 0.75 - lv * 0.05),
  knives: (lv) => Math.max(0.55, 1.2 - lv * 0.08),
  meteor: (lv) => Math.max(0.8, 1.6 - lv * 0.1),
};

export function updateWeapons(loadout, player, enemies, projectiles, fx, dt) {
  syncOrbitBlades(loadout, player, projectiles);

  for (const id of Object.keys(loadout.timers)) {
    loadout.timers[id] -= dt;
  }

  const mul = loadout.cooldownMul;

  if (hasWeapon(loadout, "bolt") && loadout.timers.bolt <= 0) {
    if (fireBolt(loadout, player, enemies, projectiles, fx)) {
      loadout.timers.bolt = COOLDOWNS.bolt(weaponLevel(loadout, "bolt")) * mul;
    }
  }
  if (hasWeapon(loadout, "fireball") && loadout.timers.fireball <= 0) {
    if (fireFireball(loadout, player, enemies, projectiles, fx)) {
      loadout.timers.fireball =
        COOLDOWNS.fireball(weaponLevel(loadout, "fireball")) * mul;
    }
  }
  if (hasWeapon(loadout, "shards") && loadout.timers.shards <= 0) {
    if (fireShards(loadout, player, enemies, projectiles, fx)) {
      loadout.timers.shards = COOLDOWNS.shards(weaponLevel(loadout, "shards")) * mul;
    }
  }
  if (hasWeapon(loadout, "lightning") && loadout.timers.lightning <= 0) {
    if (fireLightning(loadout, player, enemies, fx)) {
      loadout.timers.lightning =
        COOLDOWNS.lightning(weaponLevel(loadout, "lightning")) * mul;
    }
  }
  if (hasWeapon(loadout, "aura") && loadout.timers.aura <= 0) {
    if (pulseAura(loadout, player, enemies, fx)) {
      loadout.timers.aura = COOLDOWNS.aura(weaponLevel(loadout, "aura")) * mul;
    }
  }
  if (hasWeapon(loadout, "knives") && loadout.timers.knives <= 0) {
    if (fireKnives(loadout, player, projectiles, fx)) {
      loadout.timers.knives = COOLDOWNS.knives(weaponLevel(loadout, "knives")) * mul;
    }
  }
  if (hasWeapon(loadout, "meteor") && loadout.timers.meteor <= 0) {
    if (fireMeteor(loadout, player, enemies, projectiles, fx)) {
      loadout.timers.meteor = COOLDOWNS.meteor(weaponLevel(loadout, "meteor")) * mul;
    }
  }
}

export function drawAuraHint(ctx, loadout, player, cam) {
  const level = weaponLevel(loadout, "aura");
  if (level <= 0) return;
  const radius = 70 + level * 14;
  const t = performance.now() * 0.003;
  ctx.beginPath();
  ctx.arc(player.x - cam.x, player.y - cam.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(253, 230, 138, ${0.15 + Math.sin(t) * 0.08})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

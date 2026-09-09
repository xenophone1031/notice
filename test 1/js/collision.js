import { circleHit } from "./utils.js";
import { damagePlayer } from "./player.js";
import { dropXp } from "./xp.js";
import { spawnBurst, spawnFlash, spawnRing } from "./effects.js";

function killEnemy(player, enemy, xpSystem, fx) {
  enemy.alive = false;
  player.kills += 1;
  dropXp(xpSystem, enemy.x, enemy.y, enemy.xpValue);
  spawnBurst(fx, enemy.x, enemy.y, "#f85149", 14, 180);
  spawnFlash(fx, enemy.x, enemy.y, "#fda4af", 40, 0.12);
}

function hurtEnemy(player, enemy, damage, xpSystem, fx) {
  enemy.hp -= damage;
  if (enemy.hp <= 0) {
    killEnemy(player, enemy, xpSystem, fx);
    return true;
  }
  return false;
}

function explodeAt(x, y, radius, damage, color, player, enemies, xpSystem, fx) {
  spawnRing(fx, x, y, color, radius, 0.3);
  spawnFlash(fx, x, y, color, radius, 0.15);
  spawnBurst(fx, x, y, color, 18, 220);
  for (const enemy of enemies.list) {
    if (!enemy.alive) continue;
    if (circleHit(x, y, radius, enemy.x, enemy.y, enemy.radius)) {
      hurtEnemy(player, enemy, damage * 0.75, xpSystem, fx);
    }
  }
}

export function resolveCollisions(player, enemies, projectiles, xpSystem, fx) {
  // Finalize kills from aura/lightning before contact damage
  for (const enemy of enemies.list) {
    if (!enemy.alive) continue;
    if (enemy.hp <= 0) killEnemy(player, enemy, xpSystem, fx);
  }

  for (const p of projectiles.list) {
    if (!p.alive) continue;

    for (const enemy of enemies.list) {
      if (!enemy.alive) continue;
      if (!circleHit(p.x, p.y, p.radius, enemy.x, enemy.y, enemy.radius)) continue;

      if (p.kind === "orbit") {
        const key = enemy.id;
        if (p.hitTimers.has(key)) continue;
        p.hitTimers.set(key, p.hitCooldown || 0.25);
        hurtEnemy(player, enemy, p.damage, xpSystem, fx);
        spawnBurst(fx, enemy.x, enemy.y, p.color, 6, 100);
        continue;
      }

      if (p.hitSet.has(enemy.id)) continue;
      p.hitSet.add(enemy.id);

      hurtEnemy(player, enemy, p.damage, xpSystem, fx);
      spawnBurst(fx, p.x, p.y, p.color, 8, 120);

      if (p.explodeRadius > 0) {
        p.alive = false;
        p.explodeOnDeath = false;
        explodeAt(
          p.x,
          p.y,
          p.explodeRadius,
          p.damage,
          p.color,
          player,
          enemies,
          xpSystem,
          fx
        );
        break;
      }

      if (p.pierce > 0) {
        p.pierce -= 1;
      } else {
        p.alive = false;
        break;
      }
    }
  }

  for (const enemy of enemies.list) {
    if (!enemy.alive) continue;
    if (circleHit(player.x, player.y, player.radius, enemy.x, enemy.y, enemy.radius)) {
      if (damagePlayer(player, enemy.contactDamage)) {
        spawnFlash(fx, player.x, player.y, "#f85149", 50, 0.1);
      }
    }
  }
}

export function resolveProjectileDeathExplosions(player, enemies, projectiles, xpSystem, fx) {
  for (const p of projectiles.list) {
    if (p.alive) continue;
    if (!p.explodeOnDeath || !(p.explodeRadius > 0)) continue;
    p.explodeOnDeath = false;
    explodeAt(
      p.x,
      p.y,
      p.explodeRadius,
      p.damage,
      p.color,
      player,
      enemies,
      xpSystem,
      fx
    );
  }
}

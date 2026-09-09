import { clamp, pickRandom } from "./utils.js";
import {
  WEAPON_CATALOG,
  hasWeapon,
  unlockOrUpgradeWeapon,
  weaponLevel,
} from "./weapon.js";

export function createXpSystem() {
  return { gems: [] };
}

export function resetXp(system) {
  system.gems.length = 0;
}

export function dropXp(system, x, y, value) {
  system.gems.push({
    x,
    y,
    value,
    radius: 6,
    alive: true,
  });
}

export function updateXpGems(system, player, dt) {
  for (const gem of system.gems) {
    if (!gem.alive) continue;
    const dx = player.x - gem.x;
    const dy = player.y - gem.y;
    const d = Math.hypot(dx, dy);
    if (d <= player.pickupRadius) {
      const pull = 320 * dt;
      if (d < pull || d < 8) {
        gem.x = player.x;
        gem.y = player.y;
      } else {
        gem.x += (dx / d) * pull;
        gem.y += (dy / d) * pull;
      }
    }
  }
}

export function collectXp(system, player) {
  let gained = 0;
  for (const gem of system.gems) {
    if (!gem.alive) continue;
    const d = Math.hypot(player.x - gem.x, player.y - gem.y);
    if (d <= player.radius + gem.radius) {
      gem.alive = false;
      gained += gem.value;
    }
  }
  system.gems = system.gems.filter((g) => g.alive);
  if (gained > 0) player.xp += gained;
  return gained;
}

export function drawXpGems(ctx, gems, cam) {
  for (const gem of gems) {
    const sx = gem.x - cam.x;
    const sy = gem.y - cam.y;
    ctx.save();
    ctx.shadowColor = "#a371f7";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#a371f7";
    ctx.beginPath();
    ctx.arc(sx, sy, gem.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e9d5ff";
    ctx.beginPath();
    ctx.arc(sx - 1, sy - 1, gem.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const MAX_WEAPON_LEVEL = 5;

function makeStatUpgrades() {
  return [
    {
      id: "damage",
      title: "공격력 증가",
      desc: "모든 무기 데미지 +3",
      apply(player, loadout) {
        loadout.damageBonus += 3;
      },
    },
    {
      id: "firerate",
      title: "공격 속도 증가",
      desc: "모든 무기 쿨다운 12% 감소",
      apply(player, loadout) {
        loadout.cooldownMul = Math.max(0.4, loadout.cooldownMul * 0.88);
      },
    },
    {
      id: "movespeed",
      title: "이동 속도 증가",
      desc: "이동 속도 +25",
      apply(player) {
        player.moveSpeed += 25;
      },
    },
    {
      id: "maxhp",
      title: "최대 HP 증가",
      desc: "최대 HP +25, 즉시 회복",
      apply(player) {
        player.maxHp += 25;
        player.hp = clamp(player.hp + 25, 0, player.maxHp);
      },
    },
    {
      id: "pickup",
      title: "흡입 범위 증가",
      desc: "경험치 흡입 반경 +20",
      apply(player) {
        player.pickupRadius += 20;
      },
    },
  ];
}

function makeWeaponOffers(loadout) {
  const offers = [];
  for (const def of Object.values(WEAPON_CATALOG)) {
    const lv = weaponLevel(loadout, def.id);
    if (lv <= 0) {
      offers.push({
        id: `get_${def.id}`,
        title: `신규: ${def.name}`,
        desc: def.desc,
        apply(player, lo) {
          unlockOrUpgradeWeapon(lo, def.id);
        },
      });
    } else if (lv < MAX_WEAPON_LEVEL) {
      offers.push({
        id: `up_${def.id}`,
        title: `${def.name} Lv${lv + 1}`,
        desc: `${def.desc} (강화)`,
        apply(player, lo) {
          unlockOrUpgradeWeapon(lo, def.id);
        },
      });
    }
  }
  return offers;
}

export function rollUpgrades(loadout) {
  const pool = [...makeStatUpgrades(), ...makeWeaponOffers(loadout)];
  // Prefer mixing: try to include at least one weapon-related if available
  const weaponOffers = pool.filter((p) => p.id.startsWith("get_") || p.id.startsWith("up_"));
  const stats = pool.filter((p) => !p.id.startsWith("get_") && !p.id.startsWith("up_"));
  const picks = [];

  if (weaponOffers.length && Math.random() < 0.7) {
    picks.push(...pickRandom(weaponOffers, 1));
  }
  const restPool = pool.filter((p) => !picks.includes(p));
  picks.push(...pickRandom(restPool, 3 - picks.length));
  // if somehow short
  while (picks.length < 3 && stats.length) {
    const extra = pickRandom(
      stats.filter((s) => !picks.includes(s)),
      1
    );
    if (!extra.length) break;
    picks.push(extra[0]);
  }
  return picks.slice(0, 3);
}

export function applyLevelUp(player) {
  player.level += 1;
  player.xp -= player.xpToNext;
  player.xpToNext = Math.floor(player.xpToNext * 1.35 + 2);
  if (player.xp < 0) player.xp = 0;
}

export function needsLevelUp(player) {
  return player.xp >= player.xpToNext;
}

export { hasWeapon };

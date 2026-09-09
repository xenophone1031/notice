import { spawnTrail } from "./effects.js";

export function createProjectileSystem() {
  return { list: [] };
}

export function resetProjectiles(system) {
  system.list.length = 0;
}

export function spawnProjectile(system, opts) {
  system.list.push({
    x: opts.x,
    y: opts.y,
    vx: opts.vx || 0,
    vy: opts.vy || 0,
    damage: opts.damage ?? 10,
    radius: opts.radius ?? 5,
    life: opts.life ?? 2.2,
    alive: true,
    kind: opts.kind || "bolt",
    color: opts.color || "#ffd700",
    pierce: opts.pierce ?? 0,
    hitSet: new Set(),
    explodeRadius: opts.explodeRadius || 0,
    trail: opts.trail !== false,
    glow: opts.glow !== false,
    angle: opts.angle || 0,
    spin: opts.spin || 0,
    orbitRadius: opts.orbitRadius || 0,
    owner: opts.owner || null,
    hitTimers: new Map(),
    hitCooldown: opts.hitCooldown || 0.25,
    homing: opts.homing || 0,
    explodeOnDeath: !!opts.explodeOnDeath,
    id: opts.id || Math.random().toString(36).slice(2),
  });
}

export function updateProjectiles(system, dt, enemies, fx) {
  for (const p of system.list) {
    if (!p.alive) continue;

    if (p.kind === "orbit" && p.owner) {
      p.angle += p.spin * dt;
      p.x = p.owner.x + Math.cos(p.angle) * p.orbitRadius;
      p.y = p.owner.y + Math.sin(p.angle) * p.orbitRadius;
      for (const [id, t] of [...p.hitTimers.entries()]) {
        const next = t - dt;
        if (next <= 0) p.hitTimers.delete(id);
        else p.hitTimers.set(id, next);
      }
    } else if (p.kind === "meteor") {
      p.vy += 520 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += 8 * dt;
      p.life -= dt;
      if (p.life <= 0) p.alive = false;
    } else {
      if (p.homing > 0 && enemies?.length) {
        let nearest = null;
        let best = Infinity;
        for (const e of enemies) {
          if (!e.alive) continue;
          const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
          if (d < best) {
            best = d;
            nearest = e;
          }
        }
        if (nearest) {
          const dx = nearest.x - p.x;
          const dy = nearest.y - p.y;
          const len = Math.hypot(dx, dy) || 1;
          const speed = Math.hypot(p.vx, p.vy);
          p.vx += (dx / len) * p.homing * dt * 60;
          p.vy += (dy / len) * p.homing * dt * 60;
          const ns = Math.hypot(p.vx, p.vy) || 1;
          p.vx = (p.vx / ns) * speed;
          p.vy = (p.vy / ns) * speed;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.spin) p.angle += p.spin * dt;
      p.life -= dt;
      if (p.life <= 0) p.alive = false;
    }

    if (p.trail && fx && Math.random() < 0.65) {
      spawnTrail(fx, p.x, p.y, p.color, Math.max(2, p.radius * 0.45));
    }
  }
}

export function drawProjectiles(ctx, projectiles, cam) {
  for (const p of projectiles) {
    if (!p.alive) continue;
    const sx = p.x - cam.x;
    const sy = p.y - cam.y;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(p.angle || Math.atan2(p.vy || 0, p.vx || 1));

    if (p.glow) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 14;
    }

    if (p.kind === "fireball" || p.kind === "meteor") {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius * 1.6);
      g.addColorStop(0, "#fff5c0");
      g.addColorStop(0.35, p.color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 1.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "orbit") {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(p.radius * 1.4, 0);
      ctx.lineTo(-p.radius * 0.7, p.radius * 0.8);
      ctx.lineTo(-p.radius * 0.3, 0);
      ctx.lineTo(-p.radius * 0.7, -p.radius * 0.8);
      ctx.closePath();
      ctx.fill();
    } else if (p.kind === "shard") {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(p.radius * 1.8, 0);
      ctx.lineTo(-p.radius, p.radius * 0.7);
      ctx.lineTo(-p.radius * 0.4, 0);
      ctx.lineTo(-p.radius, -p.radius * 0.7);
      ctx.closePath();
      ctx.fill();
    } else if (p.kind === "knife") {
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.radius * 0.4, -p.radius * 1.6, p.radius * 0.8, p.radius * 3.2);
      ctx.fillStyle = "#ffe8a3";
      ctx.fillRect(-p.radius * 0.25, -p.radius * 1.6, p.radius * 0.5, p.radius);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-p.radius * 0.2, -p.radius * 0.2, p.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

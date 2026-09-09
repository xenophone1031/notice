import { randRange } from "./utils.js";

export function createEffectSystem() {
  return {
    particles: [],
    rings: [],
    beams: [],
    flashes: [],
  };
}

export function resetEffects(fx) {
  fx.particles.length = 0;
  fx.rings.length = 0;
  fx.beams.length = 0;
  fx.flashes.length = 0;
}

export function spawnBurst(fx, x, y, color, count = 12, speed = 140) {
  for (let i = 0; i < count; i++) {
    const ang = (Math.PI * 2 * i) / count + randRange(-0.2, 0.2);
    const spd = randRange(speed * 0.4, speed);
    fx.particles.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: randRange(0.25, 0.55),
      maxLife: 0.55,
      size: randRange(2, 5),
      color,
      drag: 0.92,
    });
  }
}

export function spawnTrail(fx, x, y, color, size = 4) {
  fx.particles.push({
    x: x + randRange(-2, 2),
    y: y + randRange(-2, 2),
    vx: randRange(-20, 20),
    vy: randRange(-20, 20),
    life: randRange(0.15, 0.35),
    maxLife: 0.35,
    size,
    color,
    drag: 0.88,
  });
}

export function spawnRing(fx, x, y, color, maxRadius = 60, life = 0.35) {
  fx.rings.push({
    x,
    y,
    radius: 4,
    maxRadius,
    life,
    maxLife: life,
    color,
    width: 3,
  });
}

export function spawnBeam(fx, x1, y1, x2, y2, color, life = 0.18) {
  fx.beams.push({ x1, y1, x2, y2, color, life, maxLife: life, width: 4 });
}

export function spawnFlash(fx, x, y, color, radius = 40, life = 0.12) {
  fx.flashes.push({ x, y, color, radius, life, maxLife: life });
}

export function updateEffects(fx, dt) {
  for (const p of fx.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= p.drag;
    p.vy *= p.drag;
  }
  fx.particles = fx.particles.filter((p) => p.life > 0);

  for (const r of fx.rings) {
    r.life -= dt;
    const t = 1 - r.life / r.maxLife;
    r.radius = 4 + (r.maxRadius - 4) * t;
  }
  fx.rings = fx.rings.filter((r) => r.life > 0);

  for (const b of fx.beams) {
    b.life -= dt;
  }
  fx.beams = fx.beams.filter((b) => b.life > 0);

  for (const f of fx.flashes) {
    f.life -= dt;
  }
  fx.flashes = fx.flashes.filter((f) => f.life > 0);
}

export function drawEffects(ctx, fx, cam) {
  ctx.save();

  for (const f of fx.flashes) {
    const a = f.life / f.maxLife;
    const g = ctx.createRadialGradient(
      f.x - cam.x,
      f.y - cam.y,
      0,
      f.x - cam.x,
      f.y - cam.y,
      f.radius
    );
    g.addColorStop(0, hexAlpha(f.color, a * 0.7));
    g.addColorStop(1, hexAlpha(f.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x - cam.x, f.y - cam.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const b of fx.beams) {
    const a = b.life / b.maxLife;
    ctx.strokeStyle = hexAlpha(b.color, a);
    ctx.lineWidth = b.width * (0.5 + a);
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(b.x1 - cam.x, b.y1 - cam.y);
    ctx.lineTo(b.x2 - cam.x, b.y2 - cam.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  for (const r of fx.rings) {
    const a = r.life / r.maxLife;
    ctx.strokeStyle = hexAlpha(r.color, a);
    ctx.lineWidth = r.width * a + 1;
    ctx.shadowColor = r.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(r.x - cam.x, r.y - cam.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  for (const p of fx.particles) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = hexAlpha(p.color, a);
    ctx.beginPath();
    ctx.arc(p.x - cam.x, p.y - cam.y, p.size * a, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function hexAlpha(color, alpha) {
  if (color.startsWith("rgba") || color.startsWith("rgb")) {
    return color.replace(/[\d.]+\)$/g, `${alpha})`);
  }
  const a = Math.round(clamp01(alpha) * 255)
    .toString(16)
    .padStart(2, "0");
  if (color.length === 7) return `${color}${a}`;
  return color;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

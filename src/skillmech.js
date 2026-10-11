import { canWalk, lineOfSight } from "./world.js";
// Mechanics for the newer skill shapes: beams, rains of strikes, orbiting orbs,
// travelling tornadoes and leaps that crash down on enemies.
export function installSkillMechanics(Game) {
  Object.assign(Game.prototype, {
    addDecal(x, y, radius, style, life = 4) {
      this.decals ??= [];
      this.decals.push({ x, y, radius, style, life, seed: Math.random() * 100 });
      if (this.decals.length > 24) this.decals.shift();
    },
    areaDamage(x, y, radius, amount, skill, element) {
      let hits = 0;
      for (const e of this.combatEnemies())
        if (Math.hypot(e.x - x, e.y - y) < radius + 12 && lineOfSight(this.world, { x, y }, e)) {
          this.damageEnemy(e, amount, { element, lifesteal: skill.lifesteal });
          if (skill.slow) e.slow = Math.max(e.slow || 0, skill.slow);
          if (skill.stun && !e.boss) e.stun = Math.max(e.stun || 0, skill.stun);
          this.applyWeaponStatus(e, skill);
          hits++;
        }
      return hits;
    },
    // A straight ray that hits everything along it.
    castBeam(angle, skill, damage, look, element) {
      const s = this.save,
        length = skill.range || 300,
        width = skill.width || 14;
      this.effects.push({ type: "beam", x: s.x, y: s.y, angle, length, width, style: look, seed: Math.random() * 100, life: 0.6, maxLife: 0.6 });
      for (const e of this.combatEnemies()) {
        const dx = e.x - s.x,
          dy = e.y - s.y,
          along = dx * Math.cos(angle) + dy * Math.sin(angle),
          across = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
        if (along > -10 && along < length && across < width + 14) {
          this.damageEnemy(e, damage(skill.multiplier || 2.6), { element, lifesteal: skill.lifesteal });
          if (skill.slow) e.slow = Math.max(e.slow || 0, skill.slow);
          this.applyWeaponStatus(e, skill);
        }
      }
      this.addDecal(s.x + Math.cos(angle) * length * 0.6, s.y + Math.sin(angle) * length * 0.6, 40, look, 2.5);
      this.shake = this.controls.screenShake ? 0.2 : 0;
    },
    // Several strikes fall around the target point one after another.
    castRain(point, skill, damage, look, element) {
      const s = this.save,
        d = Math.hypot(point.x - s.x, point.y - s.y),
        limit = Math.min(1, 260 / Math.max(1, d)),
        cx = s.x + (point.x - s.x) * limit,
        cy = s.y + (point.y - s.y) * limit,
        count = (skill.count || 6) + (skill.perk ? 2 : 0),
        spread = skill.spread || 85;
      for (let i = 0; i < count; i++) {
        // The first strike lands exactly where you aimed; the rest scatter around it.
        const a = Math.random() * Math.PI * 2,
          r = i === 0 ? 0 : Math.sqrt(Math.random()) * spread;
        this.zones.push({
          type: "meteor",
          style: look,
          shape: skill.shape,
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r * 0.7,
          radius: skill.radius || 50,
          life: 0.55 + i * 0.16,
          fall: 0.55,
          damage: damage(skill.multiplier || 1.4),
          color: skill.color || "#ffffff",
          burn: skill.burn,
          stun: skill.stun,
          slow: skill.slow,
        });
      }
    },
    // Orbs, blades or skulls circle the hero and hurt anything they touch.
    startOrbit(skill, damage, look) {
      this.orbit = {
        count: (skill.count || 3) + (skill.perk ? 1 : 0),
        radius: skill.radius || 48,
        life: skill.duration || 8,
        angle: 0,
        speed: skill.speed || 4,
        damage: damage(skill.multiplier || 0.7),
        style: look,
        shape: skill.shape || "orb",
        hit: new Map(),
        skill,
      };
    },
    updateOrbit(dt) {
      const o = this.orbit;
      if (!o) return;
      o.life -= dt;
      o.angle += o.speed * dt;
      if (o.life <= 0) {
        this.orbit = null;
        return;
      }
      const s = this.save;
      for (let i = 0; i < o.count; i++) {
        const a = o.angle + (i / o.count) * Math.PI * 2,
          x = s.x + Math.cos(a) * o.radius,
          y = s.y - 12 + Math.sin(a) * o.radius * 0.62;
        for (const e of this.combatEnemies()) {
          if (Math.hypot(e.x - x, e.y - 10 - y) > 22) continue;
          const last = o.hit.get(e.id) || 0;
          if (this.time - last < 0.45) continue;
          o.hit.set(e.id, this.time);
          this.damageEnemy(e, o.damage, { lifesteal: o.skill.lifesteal });
          this.applyWeaponStatus(e, o.skill);
          this.emit("hit", x, y, "#ffffff", 6);
        }
      }
    },
    // A funnel that travels forward, pulling foes in and grinding them down.
    castTornado(angle, skill, damage, look) {
      const s = this.save,
        speed = skill.speed || 70;
      for (let k = 0; k < (skill.count || 1) + (skill.perk ? 1 : 0); k++) {
        const a = angle + (k - ((skill.count || 1) - 1) / 2) * 0.35;
        this.zones.push({
          type: "tornado",
          style: look,
          x: s.x + Math.cos(a) * 30,
          y: s.y + Math.sin(a) * 30,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          radius: skill.radius || 40,
          life: skill.duration || 4,
          tick: 0,
          damage: damage(skill.multiplier || 0.6),
          skill,
        });
      }
    },
    updateTornado(z, dt) {
      const nx = z.x + z.vx * dt,
        ny = z.y + z.vy * dt;
      if (canWalk(this.world, nx, ny, 8)) {
        z.x = nx;
        z.y = ny;
      } else {
        z.vx *= -1;
        z.vy *= -1;
      }
      z.tick -= dt;
      for (const e of this.combatEnemies()) {
        const d = Math.hypot(e.x - z.x, e.y - z.y);
        if (d > z.radius + 30) continue;
        if (!e.boss && d > 4) {
          const px = e.x + ((z.x - e.x) / d) * 50 * dt,
            py = e.y + ((z.y - e.y) / d) * 50 * dt;
          if (canWalk(this.world, px, py, 6)) {
            e.x = px;
            e.y = py;
          }
        }
        if (z.tick <= 0 && d < z.radius + 12) {
          this.damageEnemy(e, z.damage);
          this.applyWeaponStatus(e, z.skill);
        }
      }
      if (z.tick <= 0) z.tick = 0.4;
    },
    // Leap into the air and crash down on the target point.
    castLeap(angle, point, skill, damage, look, element) {
      const s = this.save,
        d = Math.min(skill.range || 200, Math.hypot(point.x - s.x, point.y - s.y)),
        dur = 0.5;
      this.startDash(angle, Math.max(40, d), dur);
      this.leap = { t: 0, dur, radius: (skill.radius || 95) + (skill.perk ? 20 : 0), amount: damage(skill.multiplier || 3), style: look, skill, element };
    },
    updateLeap(dt) {
      const l = this.leap;
      if (!l) {
        this.heroLift = 0;
        return;
      }
      l.t += dt;
      this.heroLift = Math.sin(Math.min(1, l.t / l.dur) * Math.PI) * 42;
      if (l.t < l.dur) return;
      const s = this.save;
      this.leap = null;
      this.heroLift = 0;
      this.effects.push({ type: "nova", x: s.x, y: s.y, style: l.style, radius: l.radius, seed: Math.random() * 100, life: 0.8, maxLife: 0.8 });
      this.addDecal(s.x, s.y, l.radius * 0.8, l.style === "light" ? "light" : "earth");
      this.areaDamage(s.x, s.y, l.radius, l.amount, { ...l.skill, stun: l.skill.stun ?? 0.6 }, l.element);
      this.shake = this.controls.screenShake ? 0.4 : 0;
      this.hitStop = Math.max(this.hitStop || 0, 0.06);
    },
  });
}

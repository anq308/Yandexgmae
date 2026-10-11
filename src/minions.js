import { canWalk, lineOfSight } from "./world.js";
import { drawSprite } from "./sprites.js";
import { SPRITES } from "./spritedata.js";
// Necromancer allies: skeleton warriors and a bone golem that follow the hero and fight on their own.
const MAX = { skeleton: 5, golem: 1, wolf: 3, bear: 1, hawk: 3, turret: 2, mech: 1 };
// How each kind of ally fights: reach, speed, swing time, area and colour of its strikes.
const KINDS = {
  skeleton: { reach: 24, speed: 118, swing: 0.9, mult: 1, color: "#9fe0a0", element: "void" },
  golem: { reach: 34, speed: 82, swing: 1.3, mult: 1.4, area: 60, color: "#e2f0d2", element: "void" },
  wolf: { reach: 26, speed: 165, swing: 0.6, mult: 0.9, color: "#e8e0d0" },
  bear: { reach: 34, speed: 95, swing: 1.2, mult: 1.6, area: 55, color: "#c8a070" },
  hawk: { reach: 30, speed: 210, swing: 0.7, mult: 0.7, color: "#f0e0b0", flying: true },
  turret: { reach: 270, speed: 0, swing: 0.55, mult: 1, color: "#ffd060", ranged: true },
  mech: { reach: 36, speed: 90, swing: 1.1, mult: 1.5, area: 62, color: "#c8d0d8", stun: 0.6 },
};
export function installMinions(Game) {
  Object.assign(Game.prototype, {
    summonMinions(kind, count, duration, damage, skill = {}, limit = MAX[kind] || 3) {
      const s = this.save;
      this.allies = (this.allies || []).filter((a) => a.life > 0);
      const same = this.allies.filter((a) => a.kind === kind);
      // Re-casting refreshes the oldest minions instead of growing the army forever.
      while (same.length + count > limit && same.length) {
        const old = same.shift();
        old.life = 0;
      }
      for (let i = 0; i < count; i++) {
        const a = (i / Math.max(1, count)) * Math.PI * 2 + this.time,
          x = skill.at ? skill.at.x : s.x + Math.cos(a) * 30,
          y = skill.at ? skill.at.y : s.y + Math.sin(a) * 22;
        const spot = canWalk(this.world, x, y, 6) ? { x, y } : { x: s.x, y: s.y };
        this.allies.push({
          id: "ally" + ++this.spawnSerial,
          kind,
          ...spot,
          life: duration,
          maxLife: duration,
          damage: damage * (KINDS[kind]?.mult || 1),
          cooldown: 0.4 + i * 0.15,
          swing: 0,
          poison: skill.poison || 0,
          armored: !!skill.armored,
          face: 1,
        });
        this.emit("summon", spot.x, spot.y, kind === "golem" ? "#e2f0d2" : "#9fe0a0", 16);
      }
      this.allies = this.allies.filter((a) => a.life > 0);
    },
    updateMinions(dt) {
      if (!this.allies?.length) return;
      const s = this.save,
        enemies = this.combatEnemies();
      for (const a of this.allies) {
        a.life -= dt;
        a.cooldown = Math.max(0, a.cooldown - dt);
        a.swing = Math.max(0, a.swing - dt);
        const K = KINDS[a.kind] || KINDS.skeleton,
          reach = K.reach,
          speed = K.speed * dt;
        const target = enemies
          .filter(
            (e) =>
              Math.hypot(e.x - a.x, e.y - a.y) < 220 &&
              Math.hypot(e.x - s.x, e.y - s.y) < 320 &&
              lineOfSight(this.world, a, e),
          )
          .sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0];
        let gx, gy;
        if (target) {
          const d = Math.hypot(target.x - a.x, target.y - a.y);
          a.face = target.x < a.x ? -1 : 1;
          if (K.ranged && d <= reach) {
            // Turrets never move: they swivel and fire steam bolts.
            if (a.cooldown <= 0) {
              a.cooldown = K.swing * (this.buffs.frenzy > 0 ? 0.6 : 1);
              a.swing = 0.15;
              const ang = Math.atan2(target.y - 10 - (a.y - 18), target.x - a.x);
              this.projectiles.push({ x: a.x, y: a.y - 18, vx: Math.cos(ang) * 330, vy: Math.sin(ang) * 330, life: 1, damage: a.damage, hit: new Set(), pierce: 1, type: "magic", style: "fire", color: "#ffd060", trail: 0 });
              this.emit("hit", a.x + Math.cos(ang) * 10, a.y - 18, "#ffe08a", 4);
            }
            continue;
          }
          if (d <= reach + (target.boss ? 26 : 0)) {
            if (a.cooldown <= 0) {
              a.cooldown = K.swing * (this.buffs.frenzy > 0 ? 0.6 : 1);
              a.swing = 0.25;
              const hits = K.area ? enemies.filter((e) => Math.hypot(e.x - a.x, e.y - a.y) < K.area) : [target];
              for (const e of hits) {
                this.damageEnemy(e, a.damage * (this.buffs.frenzy > 0 ? 1.6 : 1), { element: K.element });
                if (a.armored && a.kind === "golem" && !e.boss) e.stun = Math.max(e.stun || 0, 0.6);
                if (K.stun && !e.boss) e.stun = Math.max(e.stun || 0, K.stun);
                if (a.poison) e.poison = Math.max(e.poison || 0, a.poison);
              }
              this.effects.push({
                x: a.x,
                y: a.y,
                type: "slash",
                radius: K.area ? 50 : 28,
                life: 0.2,
                maxLife: 0.2,
                angle: Math.atan2(target.y - a.y, target.x - a.x),
                color: K.color,
                arc: 1.1,
              });
            }
            continue;
          }
          gx = target.x;
          gy = target.y;
        } else {
          if (K.speed === 0) continue;
          const d = Math.hypot(s.x - a.x, s.y - a.y);
          if (d > 420) {
            // Allies left far behind catch up instantly.
            a.x = s.x;
            a.y = s.y + 12;
            continue;
          }
          if (d < 46) continue;
          gx = s.x;
          gy = s.y;
        }
        const d = Math.max(1, Math.hypot(gx - a.x, gy - a.y)),
          nx = a.x + ((gx - a.x) / d) * speed,
          ny = a.y + ((gy - a.y) / d) * speed;
        if (canWalk(this.world, nx, a.y, 6)) a.x = nx;
        if (canWalk(this.world, a.x, ny, 6)) a.y = ny;
        a.moving = true;
      }
      for (const a of this.allies)
        if (a.life <= 0) this.emit("summon", a.x, a.y, "#9fe0a0", 10);
      this.allies = this.allies.filter((a) => a.life > 0);
    },
  });
}
const r = (c, x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
export function drawMinion(c, a, time) {
  const fading = a.life < 2 ? 0.4 + 0.6 * Math.abs(Math.sin(time * 10)) : 1;
  c.save();
  c.globalAlpha = fading;
  c.translate(Math.round(a.x), Math.round(a.y));
  c.scale(a.face || 1, 1);
  c.fillStyle = "#00000044";
  c.beginPath();
  c.ellipse(0, 3, a.kind === "golem" ? 16 : 9, 4, 0, 0, Math.PI * 2);
  c.fill();
  const glow = "#9fe0a0";
  if (drawBeast(c, a, time)) {
    c.restore();
    return;
  }
  if (a.kind === "golem") {
    const s = Math.sin(time * 5) * 1;
    r(c, -11, -30, 22, 22, "#cfc8b0");
    r(c, -9, -28, 18, 3, "#efe9d4");
    for (let i = 0; i < 3; i++) r(c, -8, -22 + i * 4, 16, 1, "#8f8872");
    r(c, -17, -28 + s, 7, 18, "#d8d2bc");
    r(c, 10, -28 - s, 7, 18, "#d8d2bc");
    r(c, -8, -8, 6, 10, "#b8b29c");
    r(c, 2, -8, 6, 10, "#b8b29c");
    r(c, -6, -40, 12, 10, "#e8e2cc");
    r(c, -4, -37, 3, 3, glow);
    r(c, 1, -37, 3, 3, glow);
    r(c, -3, -32, 6, 1, "#6a6452");
    if (a.armored) {
      r(c, -12, -31, 24, 4, "#8d9ba3");
      r(c, -18, -29, 8, 4, "#8d9ba3");
      r(c, 10, -29, 8, 4, "#8d9ba3");
      for (let i = 0; i < 4; i++) r(c, -10 + i * 6, -35, 2, 4, "#d7e0e2");
    }
  } else {
    const step = Math.sin(time * 9 + a.x) * 1.5;
    r(c, -5, -24, 10, 9, "#e8e2cc");
    r(c, -3, -21, 2, 2, glow);
    r(c, 2, -21, 2, 2, glow);
    r(c, -2, -16, 5, 1, "#8a8470");
    r(c, -1, -14, 2, 9, "#ddd7c0");
    for (let i = 0; i < 3; i++) r(c, -4, -13 + i * 3, 8, 1, "#cfc9b2");
    r(c, -4, -5 + step, 2, 8, "#cfc9b2");
    r(c, 2, -5 - step, 2, 8, "#cfc9b2");
    // Rusty blade raised during a swing.
    const lift = a.swing > 0 ? -6 : 0;
    r(c, 6, -16 + lift, 2, 12, "#b8c4c4");
    r(c, 4, -6 + lift, 6, 2, "#8a6a3a");
    r(c, -8, -14, 3, 7, "#7a6a4a");
    if (a.armored) {
      // Rank III: helmet, breastplate and a round shield.
      r(c, -6, -26, 12, 4, "#8d9ba3");
      r(c, -1, -29, 2, 3, "#d84a3c");
      r(c, -5, -14, 10, 7, "#8d9ba3");
      r(c, -4, -13, 8, 1, "#d7e0e2");
      r(c, -11, -16, 5, 9, "#7a5a34");
      r(c, -10, -15, 3, 7, "#c9a25a");
    }
  }
  c.globalAlpha = 0.3 * fading;
  r(c, -8, 0, 16, 2, glow);
  c.restore();
}

// Beasts called by rangers and summoners, drawn from pixel sprites.
function drawBeast(c, a, time) {
  const sp = SPRITES[a.kind];
  if (!sp || !["wolf", "bear", "hawk", "turret", "mech"].includes(a.kind)) return false;
  const frame = a.kind === "hawk" ? Math.floor(time * 10 + a.x) % 2 : a.moving || a.swing > 0 ? Math.floor(time * 9 + a.x) % 2 : 0,
    lift = a.kind === "hawk" ? -26 + Math.sin(time * 3 + a.x) * 3 : 0;
  if (a.kind === "hawk") {
    c.fillStyle = "#00000030";
    c.beginPath();
    c.ellipse(0, 2, 6, 2, 0, 0, Math.PI * 2);
    c.fill();
  }
  drawSprite(c, a.kind, sp.frames, sp.palette, a.swing > 0 ? 3 : 0, lift, {
    scale: a.kind === "bear" || a.kind === "mech" ? 2 : a.kind === "turret" ? 1.8 : 1.6,
    frame,
    shadow: a.kind !== "hawk",
    tint: a.spirit ? "hue-rotate(160deg) brightness(1.4) opacity(0.85)" : undefined,
  });
  return true;
}

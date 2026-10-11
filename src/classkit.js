import { canWalk, lineOfSight } from "./world.js";
import { drawSprite } from "./sprites.js";
import { SPRITES } from "./spritedata.js";
// Signature class abilities: transformations, telekinesis, corpses and commands.
// Each method is called from useSkill() with the skill's ranked config and a damage(n) helper.
export function installClassKit(Game) {
  Object.assign(Game.prototype, {
    // ---------- Warrior ----------
    startBerserk(skill) {
      this.buffs.berserk = skill.duration || 8;
      this.emit("phase", this.save.x, this.save.y, "#ff4a3a", 30);
      this.shake = this.controls.screenShake ? 0.3 : 0;
    },
    castWarCry(skill, damage) {
      const s = this.save,
        radius = skill.radius || 150;
      this.effects.push({ type: "nova", x: s.x, y: s.y, style: "blood", radius, seed: Math.random() * 100, life: 0.7, maxLife: 0.7 });
      for (const e of this.combatEnemies())
        if (Math.hypot(e.x - s.x, e.y - s.y) < radius) {
          this.damageEnemy(e, damage(skill.multiplier || 0.6));
          if (!e.boss) e.fear = (skill.duration || 3) + (skill.perk ? 1 : 0);
          e.armorBreak = 6;
        }
      this.shake = this.controls.screenShake ? 0.35 : 0;
    },
    castExecute(angle, skill, damage) {
      const s = this.save,
        target = this.combatEnemies()
          .filter((e) => Math.hypot(e.x - s.x, e.y - s.y) < 95 && lineOfSight(this.world, s, e))
          .sort((a, b) => a.hp - b.hp)[0];
      this.effects.push({ x: s.x, y: s.y, type: "slash", radius: 80, life: 0.35, maxLife: 0.35, angle, color: "#ff5a4a", arc: 1.4, rarity: "legendary" });
      if (!target) return;
      const low = target.hp < target.maxHp * 0.3;
      this.damageEnemy(target, damage((skill.multiplier || 4) * (low ? 2 : 1)), { crit: low });
      this.effects.push({ type: "nova", x: target.x, y: target.y, style: "blood", radius: 50, seed: Math.random() * 100, life: 0.6, maxLife: 0.6 });
      this.hitStop = 0.08;
    },
    // ---------- Mage ----------
    // Tear a boulder (or a log near trees) out of the ground and hurl it.
    castTelekinesis(point, skill, damage) {
      const s = this.save,
        near = this.world.getObjectsInRect(s.x - 90, s.y - 90, 180, 180).some((o) => o.type === "tree"),
        side = Math.random() < 0.5 ? -1 : 1,
        count = 1 + (skill.perk ? 1 : 0);
      this.thrown ??= [];
      for (let i = 0; i < count; i++)
        this.thrown.push({
          kind: near && i === 0 ? "log" : "rock",
          x: s.x + side * (26 + i * 18),
          y: s.y + 6,
          z: 0,
          tx: point.x,
          ty: point.y,
          phase: "lift",
          t: -i * 0.18,
          spin: Math.random() * 6,
          radius: skill.radius || 70,
          damage: damage(skill.multiplier || 3.4),
          stun: skill.stun || 0.8,
        });
      for (let i = 0; i < 14; i++) this.emit("impact", s.x + side * 26, s.y + 6, "#b89a6a", 1);
    },
    updateThrown(dt) {
      if (!this.thrown?.length) return;
      for (const r of this.thrown) {
        r.t += dt;
        r.spin += dt * (r.phase === "fly" || r.phase === "arc" ? 9 : 2);
        if (r.t < 0) continue;
        if (r.phase === "arc") {
          const k = Math.min(1, r.t / r.dur);
          r.x = r.sx + (r.tx - r.sx) * k;
          r.y = r.sy + (r.ty - r.sy) * k;
          r.z = 20 + Math.sin(k * Math.PI) * 60 - k * 20;
          if (k < 1) continue;
          r.done = true;
          this.effects.push({ type: "nova", x: r.tx, y: r.ty, style: r.style, radius: r.radius, seed: Math.random() * 100, life: 0.8, maxLife: 0.8 });
          this.addDecal(r.tx, r.ty, r.radius * 0.8, r.style);
          this.areaDamage(r.tx, r.ty, r.radius, r.damage, r.skill, r.style === "poison" ? "poison" : "fire");
          this.shake = this.controls.screenShake ? 0.3 : 0;
          continue;
        }
        if (r.phase === "lift") {
          r.z = Math.min(34, r.t * 90);
          if (r.t > 0.45) {
            r.phase = "fly";
            r.t = 0;
          }
          continue;
        }
        const d = Math.hypot(r.tx - r.x, r.ty - r.y),
          step = 330 * dt;
        if (d > step) {
          r.x += ((r.tx - r.x) / d) * step;
          r.y += ((r.ty - r.y) / d) * step;
          r.z = Math.max(4, r.z - dt * 20);
          continue;
        }
        r.done = true;
        this.effects.push({ type: "nova", x: r.tx, y: r.ty, style: "earth", radius: r.radius, seed: Math.random() * 100, life: 0.8, maxLife: 0.8 });
        this.addDecal(r.tx, r.ty, r.radius * 0.8, "earth");
        this.areaDamage(r.tx, r.ty, r.radius, r.damage, { stun: r.stun });
        this.shake = this.controls.screenShake ? 0.35 : 0;
      }
      this.thrown = this.thrown.filter((r) => !r.done);
    },
    // Lift every foe nearby into the air, then slam them down.
    castLevitate(skill, damage) {
      const s = this.save,
        radius = skill.radius || 120;
      for (const e of this.combatEnemies())
        if (!e.boss && Math.hypot(e.x - s.x, e.y - s.y) < radius) {
          e.levitate = 1.3;
          e.levitateDamage = damage(skill.multiplier || 2.6);
          e.stun = Math.max(e.stun || 0, 1.5);
        }
      this.effects.push({ type: "nova", x: s.x, y: s.y, style: "arcane", radius, seed: Math.random() * 100, life: 0.7, maxLife: 0.7 });
    },
    // ---------- Necromancer ----------
    recordCorpse(e) {
      if (e.boss || e.summoned) return;
      this.corpses ??= [];
      this.corpses.push({ x: e.x, y: e.y, type: e.type, life: 40, seed: Math.random() * 100 });
      if (this.corpses.length > 30) this.corpses.shift();
    },
    nearbyCorpses(x, y, r) {
      return (this.corpses || []).filter((c) => Math.hypot(c.x - x, c.y - y) < r);
    },
    castCorpseExplosion(point, skill, damage) {
      const list = this.nearbyCorpses(point.x, point.y, skill.range || 220).slice(0, (skill.count || 4) + (skill.perk ? 2 : 0));
      if (!list.length) {
        this.onToast?.("Рядом нет трупов. / No corpses nearby.");
        return false;
      }
      list.forEach((c, i) => {
        this.zones.push({ type: "meteor", style: "poison", x: c.x, y: c.y, radius: skill.radius || 70, life: 0.05 + i * 0.12, fall: 0.01, damage: damage(skill.multiplier || 2.2), color: "#9fe0a0", poison: 3 });
        c.life = 0;
      });
      this.corpses = this.corpses.filter((c) => c.life > 0);
      return true;
    },
    castArmy(skill, damage) {
      const s = this.save,
        list = this.nearbyCorpses(s.x, s.y, 260).slice(0, (skill.count || 3) + (skill.rank - 1) + (skill.perk ? 2 : 0));
      const n = Math.max(2, list.length);
      for (let i = 0; i < n; i++) {
        const c = list[i] || { x: s.x + Math.cos(i * 2) * 30, y: s.y + Math.sin(i * 2) * 20 };
        this.summonMinions("skeleton", 1, skill.duration || 18, damage(skill.multiplier || 0.55), { ...skill, at: c, armored: skill.perk }, 8);
        this.effects.push({ type: "nova", x: c.x, y: c.y, style: "bone", radius: 40, seed: Math.random() * 100, life: 0.6, maxLife: 0.6 });
        if (list[i]) list[i].life = 0;
      }
      this.corpses = (this.corpses || []).filter((c) => c.life > 0);
    },
    castDarkPact(skill, damage) {
      const s = this.save,
        mine = (this.allies || []).filter((a) => a.life > 0);
      for (const a of mine) {
        a.life = 0;
        this.effects.push({ type: "nova", x: a.x, y: a.y, style: "void", radius: 70, seed: Math.random() * 100, life: 0.7, maxLife: 0.7 });
        this.areaDamage(a.x, a.y, 70, damage(skill.multiplier || 1.8), {});
      }
      s.hp = Math.min(this.stats.maxHp, s.hp + Math.round(this.stats.maxHp * 0.08 * mine.length));
      this.buffs.pact = mine.length ? 8 : 0;
      this.allies = (this.allies || []).filter((a) => a.life > 0);
      return true;
    },
    // ---------- Paladin ----------
    startAvatar(skill) {
      this.buffs.avatar = skill.duration || 10;
      const s = this.save;
      this.effects.push({ type: "nova", x: s.x, y: s.y, style: "light", radius: 120, seed: Math.random() * 100, life: 0.9, maxLife: 0.9 });
    },
    startDivineShield(skill) {
      this.invincible = Math.max(this.invincible, (skill.duration || 3) + (skill.perk ? 1 : 0));
      this.buffs.divineShield = this.invincible;
    },
    startRetribution(skill, damage) {
      this.buffs.retribution = skill.duration || 8;
      this.retributionDamage = damage(skill.multiplier || 0.45);
      this.retributionTick = 0;
    },
    // ---------- Ranger ----------
    castSmokeBomb(skill) {
      const s = this.save;
      this.buffs.stealth = skill.duration || 4;
      for (const e of this.combatEnemies())
        if (Math.hypot(e.x - s.x, e.y - s.y) < 140 && !e.boss) {
          e.alert = 0;
          e.windup = 0;
          e.stun = Math.max(e.stun || 0, 1.2);
        }
      this.vfx ??= [];
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2,
          sp = 20 + Math.random() * 60;
        this.vfx.push({ x: s.x, y: s.y, z: 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 10 + Math.random() * 20, life: 1.6, max: 1.6, size: 12 + Math.random() * 10, grow: 14, ramp: "smoke", alpha: 0.7, blob: true, drag: 1.4 });
      }
    },
    castPointBlank(angle, skill, damage) {
      const n = (skill.count || 6) + (skill.perk ? 2 : 0);
      for (let i = 0; i < n; i++)
        this.shoot(angle + (i - (n - 1) / 2) * 0.12, damage(skill.multiplier || 1.1), { pierce: 1, range: 150, type: "arrow" });
      for (const e of this.combatEnemies()) {
        const d = Math.hypot(e.x - this.save.x, e.y - this.save.y);
        if (d < 90) this.knockback(e, Math.atan2(e.y - this.save.y, e.x - this.save.x), 60);
      }
      this.startDash(angle + Math.PI, 60, 0.15);
    },
    // ---------- Monk ----------
    // A storm of blows on the nearest foe.
    startFlurry(skill, damage) {
      const s = this.save,
        target = this.combatEnemies()
          .filter((e) => Math.hypot(e.x - s.x, e.y - s.y) < 90)
          .sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y))[0];
      if (!target) return;
      this.flurry = { target, left: (skill.hits || 10) + (skill.rank - 1) * 2 + (skill.perk ? 2 : 0), timer: 0, damage: damage(skill.multiplier || 0.55), stun: skill.perk };
    },
    // ---------- Engineer ----------
    // Lob a bomb or a flask in an arc to the target point.
    castBomb(point, skill, damage, look) {
      const s = this.save,
        count = skill.perk ? 2 : 1;
      this.thrown ??= [];
      for (let i = 0; i < count; i++) {
        const tx = point.x + (i ? 40 : 0),
          ty = point.y + (i ? 20 : 0),
          d = Math.hypot(tx - s.x, ty - s.y);
        this.thrown.push({ kind: look === "poison" ? "flask" : "bomb", x: s.x, y: s.y, z: 20, sx: s.x, sy: s.y, tx, ty, phase: "arc", t: -i * 0.15, dur: Math.max(0.35, d / 320), spin: 0, radius: skill.radius || 75, damage: damage(skill.multiplier || 2.8), style: look, skill });
      }
    },
    castCone(angle, skill, damage, look, element) {
      const s = this.save,
        radius = skill.radius || 130;
      this.effects.push({ type: "breath", x: s.x, y: s.y, angle, arc: 0.6, radius, style: look, seed: Math.random() * 100, life: 0.7, maxLife: 0.7 });
      // A roaring jet of flame particles fills the cone.
      this.vfx ??= [];
      const ramp = look === "fire" ? "fire" : look;
      for (let i = 0; i < 90; i++) {
        const a = angle + (Math.random() - 0.5) * 1.1,
          sp = 120 + Math.random() * 220,
          life = 0.35 + Math.random() * 0.35;
        this.vfx.push({ x: s.x + Math.cos(angle) * 14, y: s.y + Math.sin(angle) * 8, z: 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, vz: 10 + Math.random() * 25, life, max: life, size: 4 + Math.random() * 5, grow: 10, ramp, blob: true, drag: 3.2 });
        if (i % 4 === 0) this.vfx.push({ x: s.x, y: s.y, z: 14, vx: Math.cos(a) * sp * 0.6, vy: Math.sin(a) * sp * 0.4, vz: 30, life: 1, max: 1, size: 6, grow: 12, ramp: "smoke", alpha: 0.35, blob: true, drag: 2 });
      }
      for (const e of this.combatEnemies()) {
        const a = Math.atan2(e.y - s.y, e.x - s.x),
          diff = Math.atan2(Math.sin(a - angle), Math.cos(a - angle));
        if (Math.hypot(e.x - s.x, e.y - s.y) < radius + 12 && Math.abs(diff) < 0.6 && lineOfSight(this.world, s, e)) {
          this.damageEnemy(e, damage(skill.multiplier || 2.6), { element });
          this.applyWeaponStatus(e, skill);
        }
      }
    },
    // ---------- Shapeshifter ----------
    startForm(skill) {
      const kinds = ["wolf", "bear", "raven", "treant"],
        kind = skill.form === "random" ? kinds[Math.floor(Math.random() * kinds.length)] : skill.form,
        gift = skill.form === "random" ? ["fire", "poison", "ice", "lightning"][Math.floor(Math.random() * 4)] : null;
      this.form = { kind, life: skill.duration || 14, gift };
      const s = this.save;
      this.effects.push({ type: "nova", x: s.x, y: s.y, style: { wolf: "blood", bear: "earth", raven: "wind", treant: "poison" }[kind], radius: 70, seed: Math.random() * 100, life: 0.7, maxLife: 0.7 });
      this.onToast?.(
        { wolf: "Облик волка / Wolf form", bear: "Облик медведя / Bear form", raven: "Облик ворона / Raven form", treant: "Облик энта / Treant form" }[kind] + (gift ? " · " + gift : ""),
      );
    },
    // What the hero attacks with while transformed.
    formWeapon(base) {
      const f = this.form;
      if (!f) return base;
      const element = f.gift || base.element;
      if (f.kind === "raven") return { ...base, kind: "ranged", range: 250, element, formShot: true, color: "#c8d8e8" };
      if (f.kind === "bear") return { ...base, kind: "melee", formRange: 72, arc: 3.2, element, color: "#c8a070", stun: 0.2 };
      if (f.kind === "treant") return { ...base, kind: "melee", formRange: 64, arc: 1.8, element: element || "poison", slow: 1.5, color: "#8ad04a" };
      return { ...base, kind: "melee", formRange: 52, arc: 1.3, element, color: "#f0e0c8", crit: (base.crit || 0) + 0.1 };
    },
    formSpeed() {
      return { wolf: 1.4, raven: 1.6, bear: 0.95, treant: 0.85 }[this.form?.kind] || 1;
    },
    formArmor() {
      return { bear: 0.6, treant: 0.8 }[this.form?.kind] || 1;
    },
    startFrenzy(skill) {
      this.buffs.frenzy = skill.duration || 8;
      for (const a of this.allies || []) this.effects.push({ type: "nova", x: a.x, y: a.y, style: "blood", radius: 36, seed: Math.random() * 100, life: 0.5, maxLife: 0.5 });
    },
    // ---------- Per-frame upkeep ----------
    updateClassKit(dt) {
      const s = this.save;
      this.updateThrown(dt);
      if (this.flurry) {
        const f = this.flurry;
        f.timer -= dt;
        if (f.target.hp <= 0) this.flurry = null;
        else if (f.timer <= 0) {
          f.timer = 0.08;
          f.left--;
          const a = Math.atan2(f.target.y - s.y, f.target.x - s.x);
          this.facing = a;
          this.attackAnimation = 0.08;
          this.damageEnemy(f.target, f.damage);
          this.effects.push({ x: s.x, y: s.y, type: "slash", style: "fist", radius: Math.min(60, Math.hypot(f.target.x - s.x, f.target.y - s.y) + 10), life: 0.12, maxLife: 0.12, angle: a + (Math.random() - 0.5) * 0.5, color: "#f0c060" });
          if (f.left <= 0) {
            if (f.stun && !f.target.boss) f.target.stun = Math.max(f.target.stun || 0, 1);
            this.effects.push({ type: "nova", x: f.target.x, y: f.target.y, style: "light", radius: 45, seed: Math.random() * 100, life: 0.5, maxLife: 0.5 });
            this.flurry = null;
          }
        }
      }
      if (this.form) {
        this.form.life -= dt;
        if (this.form.kind === "treant") s.hp = Math.min(this.stats.maxHp, s.hp + this.stats.maxHp * 0.03 * dt);
        if (this.form.life <= 0) {
          this.effects.push({ type: "nova", x: s.x, y: s.y, style: "wind", radius: 50, seed: Math.random() * 100, life: 0.5, maxLife: 0.5 });
          this.form = null;
        }
      }
      for (const c of this.corpses || []) c.life -= dt;
      if (this.corpses) this.corpses = this.corpses.filter((c) => c.life > 0);
      if (this.buffs.retribution > 0) {
        this.retributionTick -= dt;
        if (this.retributionTick <= 0) {
          this.retributionTick = 0.6;
          for (const e of this.combatEnemies())
            if (Math.hypot(e.x - s.x, e.y - s.y) < 95) {
              this.damageEnemy(e, this.retributionDamage, { element: "light" });
              this.emit("hit", e.x, e.y - 10, "#ffe08a", 6);
            }
        }
      }
      // Floating foes hang in the air, then crash down.
      for (const e of this.enemies)
        if (e.levitate > 0) {
          e.levitate -= dt;
          e.lift = Math.min(36, (1.3 - e.levitate) * 90);
          if (e.levitate <= 0) {
            e.lift = 0;
            this.damageEnemy(e, e.levitateDamage || 0);
            this.effects.push({ type: "nova", x: e.x, y: e.y, style: "earth", radius: 40, seed: Math.random() * 100, life: 0.6, maxLife: 0.6 });
          }
        }
      for (const e of this.enemies) if (e.armorBreak > 0) e.armorBreak -= dt;
      // Feared enemies run away from the hero.
      for (const e of this.enemies)
        if (e.fear > 0 && e.hp > 0) {
          e.fear -= dt;
          const d = Math.max(1, Math.hypot(e.x - s.x, e.y - s.y)),
            nx = e.x + ((e.x - s.x) / d) * e.speed * 1.2 * dt,
            ny = e.y + ((e.y - s.y) / d) * e.speed * 1.2 * dt;
          if (canWalk(this.world, nx, ny, 6)) {
            e.x = nx;
            e.y = ny;
          }
          e.windup = 0;
        }
      // Auras of transformation.
      if (this.buffs.berserk > 0 && Math.random() < dt * 30)
        this.vfx?.push({ x: s.x + (Math.random() - 0.5) * 16, y: s.y, z: 6 + Math.random() * 20, vx: 0, vy: 0, vz: 30 + Math.random() * 30, life: 0.6, max: 0.6, size: 4 + Math.random() * 3, grow: 4, ramp: "blood", add: true, blob: true, alpha: 0.6, drag: 1 });
      if (this.buffs.avatar > 0 && Math.random() < dt * 20)
        this.vfx?.push({ x: s.x + (Math.random() - 0.5) * 30, y: s.y, z: 10 + Math.random() * 30, vx: 0, vy: 0, vz: 20, life: 0.8, max: 0.8, size: 2, ramp: "light", add: true, shape: "cross", drag: 1 });
      if (this.buffs.retribution > 0 && Math.random() < dt * 25) {
        const a = Math.random() * Math.PI * 2;
        this.vfx?.push({ x: s.x + Math.cos(a) * 90, y: s.y + Math.sin(a) * 56, z: 2, vx: 0, vy: 0, vz: 40, life: 0.6, max: 0.6, size: 2, ramp: "light", add: true, shape: "streak", drag: 1 });
      }
    },
    // Combat modifiers granted by transformations.
    attackSpeedMultiplier() {
      return (this.buffs.berserk > 0 ? 0.6 : 1) * ({ wolf: 0.6, bear: 1.2, raven: 0.8, treant: 1.1 }[this.form?.kind] || 1);
    },
    damageMultiplier() {
      return (
        (this.buffs.berserk > 0 ? 1.4 : 1) *
        (this.buffs.avatar > 0 ? 1.3 : 1) *
        (this.buffs.pact > 0 ? 1.3 : 1) *
        (this.buffs.frenzy > 0 ? 1.25 : 1) *
        ({ wolf: 1.1, bear: 1.4, raven: 1, treant: 1.2 }[this.form?.kind] || 1)
      );
    },
    bonusLifesteal() {
      return this.buffs.berserk > 0 ? 0.08 : 0;
    },
  });
}
// Telekinetic boulders and logs, glowing with the mage's grip.
export function drawThrown(c, list, time) {
  for (const r of list || []) {
    if (r.t < 0) continue;
    const y = r.y - r.z;
    c.save();
    c.fillStyle = "#00000040";
    c.beginPath();
    c.ellipse(r.x, r.y + 2, 12, 4, 0, 0, Math.PI * 2);
    c.fill();
    const g = c.createRadialGradient(r.x, y - 6, 2, r.x, y - 6, 24),
      lobbed = r.kind === "bomb" || r.kind === "flask";
    if (lobbed) {
      c.translate(r.x, y - 6);
      c.rotate(r.spin);
      if (r.kind === "bomb") {
        c.fillStyle = "#2a2a30";
        c.beginPath();
        c.arc(0, 0, 7, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#5a5a64";
        c.fillRect(-4, -5, 3, 3);
        c.fillStyle = "#8a6a42";
        c.fillRect(-1, -11, 2, 5);
        c.fillStyle = Math.sin(time * 40) > 0 ? "#ffe08a" : "#ff6a1a";
        c.fillRect(-2, -14, 4, 4);
      } else {
        c.fillStyle = "#c8e8d8";
        c.fillRect(-4, -9, 8, 3);
        c.fillStyle = "#7ac03a";
        c.beginPath();
        c.arc(0, 2, 7, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#c0f070";
        c.fillRect(-4, -1, 3, 3);
        c.fillStyle = "#8a6a42";
        c.fillRect(-2, -12, 4, 3);
      }
      c.restore();
      continue;
    }
    g.addColorStop(0, "#c8b8ff88");
    g.addColorStop(1, "#7a6aff00");
    c.globalCompositeOperation = "lighter";
    c.fillStyle = g;
    c.fillRect(r.x - 24, y - 30, 48, 48);
    c.globalCompositeOperation = "source-over";
    c.translate(r.x, y - 6);
    c.rotate(r.spin);
    if (r.kind === "log") {
      c.fillStyle = "#6a4428";
      c.fillRect(-16, -5, 32, 10);
      c.fillStyle = "#8a5a34";
      c.fillRect(-16, -5, 32, 3);
      for (let i = -12; i < 14; i += 6) {
        c.fillStyle = "#4a2e1a";
        c.fillRect(i, -4, 1, 8);
      }
      c.fillStyle = "#c8a070";
      c.fillRect(14, -5, 3, 10);
      c.fillStyle = "#8a6440";
      c.fillRect(15, -2, 1, 4);
    } else {
      c.fillStyle = "#6a6a72";
      c.beginPath();
      c.moveTo(-12, -2);
      c.lineTo(-6, -11);
      c.lineTo(6, -10);
      c.lineTo(12, -1);
      c.lineTo(8, 9);
      c.lineTo(-7, 9);
      c.closePath();
      c.fill();
      c.fillStyle = "#9a9aa4";
      c.fillRect(-6, -9, 9, 4);
      c.fillStyle = "#4a4a52";
      c.fillRect(-2, 2, 8, 3);
      c.fillStyle = "#5a8a3a";
      c.fillRect(-10, 6, 6, 3);
    }
    c.restore();
    // Crackling telekinetic sparks around it.
    for (let i = 0; i < 4; i++) {
      const a = time * 6 + i * 1.6;
      c.fillStyle = i % 2 ? "#e0d0ff" : "#9a8aff";
      c.fillRect(Math.round(r.x + Math.cos(a) * 16), Math.round(y - 6 + Math.sin(a) * 9), 2, 2);
    }
  }
}
// Corpses linger on the ground until a necromancer finds a use for them.
export function drawCorpse(c, k, time) {
  c.save();
  c.globalAlpha = Math.min(1, k.life / 3) * 0.9;
  c.fillStyle = "#4a2a2a66";
  c.beginPath();
  c.ellipse(k.x, k.y + 2, 11, 4, 0, 0, Math.PI * 2);
  c.fill();
  const s = (n) => Math.abs(Math.sin(k.seed * 9 + n));
  c.fillStyle = "#e8e2cc";
  c.fillRect(Math.round(k.x - 8), Math.round(k.y - 2), 10, 2);
  c.fillRect(Math.round(k.x - 3 + s(1) * 4), Math.round(k.y - 5), 5, 4);
  c.fillStyle = "#14121a";
  c.fillRect(Math.round(k.x - 2 + s(1) * 4), Math.round(k.y - 4), 1, 1);
  c.fillStyle = "#cfc8b0";
  c.fillRect(Math.round(k.x + 3), Math.round(k.y), 6, 1);
  c.restore();
}

// The shapeshifter's beast bodies, drawn in place of the hero from pixel sprites.
export function drawFormBeast(c, x, y, form, facing, time, moving, swing) {
  const key = { wolf: "wolfForm", bear: "bear", raven: "raven", treant: "treantling" }[form.kind],
    sp = SPRITES[key],
    flip = Math.cos(facing) < 0,
    frame = form.kind === "wolf" && swing > 0 ? 2 : form.kind === "raven" ? Math.floor(time * 12) % 2 : moving ? Math.floor(time * 10) % 2 : 0,
    lift = form.kind === "raven" ? -30 + Math.sin(time * 4) * 3 : 0,
    lunge = swing > 0 ? (flip ? -4 : 4) : 0;
  if (form.kind === "raven") {
    c.fillStyle = "#00000040";
    c.beginPath();
    c.ellipse(x, y + 2, 9, 3, 0, 0, Math.PI * 2);
    c.fill();
  }
  drawSprite(c, key + "-form", sp.frames, sp.palette, x + lunge, y + lift, {
    scale: form.kind === "raven" ? 2.2 : 2,
    flip,
    frame,
    shadow: form.kind !== "raven",
  });
  const gift = { fire: "#ff8a2a", poison: "#9ae06a", ice: "#9ad8ff", lightning: "#d8c0ff" }[form.gift];
  if (gift) {
    c.save();
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 5; i++) {
      c.globalAlpha = 0.5 + Math.sin(time * 10 + i) * 0.3;
      c.fillStyle = gift;
      c.fillRect(Math.round(x + Math.sin(time * 5 + i * 2) * 16), Math.round(y - 18 + lift + Math.cos(time * 4 + i) * 10), 3, 3);
    }
    c.restore();
  }
}

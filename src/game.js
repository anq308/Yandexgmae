import { classes, tr } from "./i18n.js";
import {
  TILE,
  WIDTH,
  HEIGHT,
  createWorld,
  enemySpawns,
  regionAt,
  canWalk,
  findPath,
  landmarks,
  lineOfSight,
} from "./world.js";
import {
  deriveStats,
  equippedWeapon,
  skillConfig,
  upgradeSkill,
  weapons,
} from "./equipment.js";
import { loadControls, movement, keyLabel } from "./controls.js";
import { createTerrain, drawObject, drawHero, drawEnemy } from "./art.js";
import { installLife } from "./life.js";
import { barFor, disciplines, weaponDiscipline } from "./abilities.js";
import { installAdventure } from "./adventure.js";
import { expandedEnemyStats, updateBoss, addHazard } from "./battle.js";
import { elementMultiplier } from "./climate.js";
import { drawHazard, drawSparks, drawClimate } from "./fx.js";
import {
  drawAdventureObject,
  drawAdvancedEnemy,
  drawSkillEffect,
} from "./adventure-art.js";
export const enemyStats = expandedEnemyStats;
export class Game {
  constructor(canvas, platform, audio) {
    this.canvas = canvas;
    this.c = canvas.getContext("2d", { alpha: false });
    this.platform = platform;
    this.audio = audio;
    this.world = createWorld();
    this.terrain = createTerrain(this.world);
    this.save = null;
    this.sparks = [];
    this.hazards = [];
    this.potionCooldown = 0;
    this.spawnSerial = 0;
    this.paused = true;
    this.keys = new Set();
    this.path = [];
    this.particles = [];
    this.projectiles = [];
    this.effects = [];
    this.time = 0;
    this.attackCooldown = 0;
    this.skillCooldown = 0;
    this.skillCooldowns = [0, 0, 0, 0, 0];
    this.abilityCooldowns = {};
    this.fishing = null;
    this.controls = loadControls();
    this.zones = [];
    this.buffs = {};
    this.combo = 0;
    this.comboTimer = 0;
    this.attackAnimation = 0;
    this.shake = 0;
    this.pendingInteraction = null;
    this.waypoint = null;
    this.dash = null;
    this.dodgeCooldown = 0;
    this.invincible = 0;
    this.pointer = null;
    this.selectedTarget = null;
    this.facing = Math.PI / 2;
    this.uiTimer = 0;
    this.saveTimer = 0;
    this.pointer = null;
    this.joystick = { x: 0, y: 0 };
    this.camera = { x: 24 * TILE, y: 62 * TILE };
    this.last = performance.now();
    this.onChange = () => {};
    this.onInteract = () => {};
    this.onToast = () => {};
    this.onDeath = () => {};
    this.onVictory = () => {};
    this.heldAttack = false;
    this.enemies = [];
    this.collected = new Set();
    this.defeated = new Set();
    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    requestAnimationFrame((t) => this.frame(t));
  }
  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    this.scale = bounds.width < 600 ? 1.65 : 2;
    this.canvas.width = Math.round(bounds.width / this.scale);
    this.canvas.height = Math.round(bounds.height / this.scale);
    this.c.imageSmoothingEnabled = false;
  }
  load(save) {
    this.save = save;
    this.collected = new Set(save.collected);
    this.defeated = new Set(save.defeated);
    this.loadZone();
    this.camera = { x: save.x, y: save.y };
    this.path = [];
    this.projectiles = [];
    this.particles = [];
    this.effects = [];
    this.attackCooldown = 0;
    this.skillCooldown = 0;
    this.skillCooldowns = [0, 0, 0, 0, 0];
    this.abilityCooldowns = {};
    this.fishing = null;
    this.zones = [];
    this.buffs = {};
    this.combo = 0;
    this.comboTimer = 0;
    this.pendingInteraction = null;
    this.waypoint = null;
    this.dash = null;
    this.dodgeCooldown = 0;
    this.invincible = 0;
    this.currentRegion = save.activeDungeon?.id || regionAt(save.x, save.y);
    this.pointer = null;
    this.selectedTarget = null;
    this.facing = Math.PI / 2;
    if (!canWalk(this.world, save.x, save.y)) {
      const camp =
        landmarks.find((o) => o.id === save.checkpoint) ||
        landmarks.find((o) => o.id === "camp1");
      if (save.activeDungeon) Object.assign(save, this.world.start);
      else {
        save.x = camp.x + 24;
        save.y = camp.y;
      }
    }
  }
  get stats() {
    const s = this.save,
      c = classes[s.characterClass];
    return deriveStats(s, c);
  }
  get xpNeeded() {
    return this.save.level * 75;
  }
  setPaused(paused) {
    this.paused = paused;
    this.keys.clear();
    this.heldAttack = false;
    this.joystick = { x: 0, y: 0 };
    this.platform.gameplay(!paused && !!this.save);
    this.audio.setPaused(paused);
  }
  persist() {
    if (!this.save) return;
    if (this.save.activeDungeon)
      this.save.activeDungeon.enemyHp = Object.fromEntries(
        this.enemies.filter((e) => !e.summoned).map((e) => [e.id, e.hp]),
      );
    this.save.potionCooldown = this.potionCooldown;
    this.save.collected = [...this.collected];
    this.save.defeated = [...this.defeated];
    this.platform.save(this.save);
  }
  moveTo(x, y) {
    if (this.paused || !this.save) return;
    this.pendingInteraction = null;
    if (!canWalk(this.world, x, y)) {
      let best = null;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const px = (Math.floor(x / TILE) + dx) * TILE + TILE / 2,
            py = (Math.floor(y / TILE) + dy) * TILE + TILE / 2;
          if (canWalk(this.world, px, py)) {
            const d = Math.hypot(px - x, py - y);
            if (!best || d < best.d) best = { x: px, y: py, d };
          }
        }
      if (best) {
        x = best.x;
        y = best.y;
      }
    }
    this.path = findPath(this.world, this.save, { x, y });
    if (!this.path.length)
      this.onToast(
        tr(
          "Сюда нельзя пройти. Выберите тропу.",
          "You cannot walk here. Choose a clear trail.",
        ),
      );
  }
  nearest() {
    if (!this.save) return null;
    return (
      this.world
        .getObjectsInRect(this.save.x - 50, this.save.y - 50, 100, 100)
        .concat(this.activeLoot)
        .filter(
          (o) =>
            [
              "npc",
              "camp",
              "herb",
              "ore",
              "crystal",
              "chest",
              "rune",
              "altar",
              "sign",
              "wood",
              "board",
              "entrance",
              "exit",
              "stairs",
              "dungeonChest",
              "trainer",
              "fishspot",
              "berryBush",
              "loot",
            ].includes(o.type) &&
            !(
              ["herb", "ore", "crystal", "wood"].includes(o.type) &&
              this.collected.has(o.id)
            ),
        )
        .map((o) => ({
          ...o,
          d: Math.hypot(o.x - this.save.x, o.y - this.save.y),
        }))
        .filter((o) => o.d < 46)
        .sort((a, b) => a.d - b.d)[0] || null
    );
  }
  interact() {
    if (this.paused || !this.save) return;
    const o = this.nearest();
    if (o) this.onInteract(o);
    else
      this.onToast(
        tr(
          "Подойдите ближе к персонажу или предмету.",
          "Get closer to a character or an object.",
        ),
      );
  }
  combatEnemies() {
    return this.enemies.filter(
      (e) =>
        e.hp > 0 &&
        (!e.nightOnly || this.climate.night) &&
        (e.type !== "guardian" || this.save.flags.bossAwake),
    );
  }
  aim() {
    const s = this.save,
      stats = this.stats;
    const targets = this.combatEnemies()
      .filter(
        (e) =>
          Math.hypot(e.x - s.x, e.y - s.y) <
            Math.min(
              stats.range + 90,
              this.climate.weather === "fog" ? 155 : 450,
            ) && lineOfSight(this.world, s, e),
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y),
      );
    const target = this.controls.autoAim
      ? targets.find((e) => e.id === this.selectedTarget) || targets[0]
      : null;
    const angle = target
      ? Math.atan2(target.y - s.y, target.x - s.x)
      : !this.controls.autoAim && this.pointer
        ? Math.atan2(this.pointer.y - s.y, this.pointer.x - s.x)
        : (this.facing ?? Math.PI / 2);
    return { angle, target: target || targets[0] };
  }
  shoot(angle, damage, options = {}) {
    const s = this.save,
      stats = this.stats,
      speed = options.speed || 330;
    this.projectiles.push({
      x: s.x,
      y: s.y - 7,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: (options.range || stats.range) / speed + 0.08,
      damage,
      type: options.type || (s.characterClass === "mage" ? "magic" : "arrow"),
      color: options.color || stats.weapon.color,
      hit: new Set(),
      pierce: options.pierce || stats.weapon.pierce || 1,
      slow: options.slow || stats.weapon.slow || 0,
      element: options.element || stats.weapon.element,
      practice: options.practice || null,
      burn: options.burn || stats.weapon.burn,
      poison: options.poison || stats.weapon.poison,
      stun: options.stun || stats.weapon.stun,
    });
  }
  attack(special = false) {
    if (special) {
      this.useSkill(0);
      return;
    }
    if (this.paused || !this.save || this.fishing || this.attackCooldown > 0)
      return;
    const s = this.save,
      stats = this.stats,
      { angle } = this.aim(),
      weapon = equippedWeapon(s);
    this.facing = angle;
    this.attackCooldown = stats.cooldown;
    this.attackAnimation = 0.22;
    this.combo = this.comboTimer > 0 ? (this.combo % 3) + 1 : 1;
    this.comboTimer = 1.25;
    const damage =
      elementMultiplier(this.climate, weapon.element) *
      stats.damage *
      (this.buffs.stealth > 0 && weaponDiscipline(s) === "blades" ? 1.8 : 1) *
      (this.buffs.focus > 0 ? 1.25 : 1) *
      (this.combo === 3 && weapon.kind === "melee" ? 1.35 : 1);
    this.buffs.stealth = 0;
    if (weapon.kind === "melee") {
      this.effects.push({
        x: s.x,
        y: s.y,
        type: "slash",
        radius: stats.range,
        life: 0.25,
        maxLife: 0.25,
        angle,
        color: weapon.color,
        arc: weapon.arc,
      });
      for (const e of this.combatEnemies()) {
        const a = Math.atan2(e.y - s.y, e.x - s.x),
          difference = Math.atan2(Math.sin(a - angle), Math.cos(a - angle));
        if (
          Math.hypot(e.x - s.x, e.y - s.y) < stats.range + 12 &&
          Math.abs(difference) < (weapon.arc || 1.3) &&
          lineOfSight(this.world, s, e)
        ) {
          if (s.equippedWeapon)
            s.weaponPractice[weaponDiscipline(s)] =
              (s.weaponPractice[weaponDiscipline(s)] || 0) + 1;
          this.damageEnemy(e, damage);
          this.applyWeaponStatus(e, weapon);
          this.knockback(e, angle, this.combo === 3 ? 12 : 5);
        }
      }
    } else this.shoot(angle, damage, { practice: weaponDiscipline(s) });
    this.audio.effect("hit");
  }
  skillCooldownAt(index) {
    return index === 0 ? this.skillCooldown : this.skillCooldowns[index];
  }
  useSkill(index) {
    if (
      this.paused ||
      !this.save ||
      this.fishing ||
      !Number.isInteger(index) ||
      index < 0 ||
      index > 4
    )
      return false;
    const s = this.save,
      skill = skillConfig(s, index),
      stats = this.stats;
    if (!s.equippedWeapon) {
      this.onToast(
        tr(
          "Сначала возьмите оружие из рюкзака.",
          "Equip a weapon from your backpack first.",
        ),
      );
      return false;
    }
    if (skill.rank < 1 || s.level < skill.level) {
      this.onToast(
        tr(
          "Изучите этот приём в книге умений.",
          "Learn this ability in your skill book.",
        ),
      );
      return false;
    }
    if (
      this.skillCooldownAt(index) > 0 ||
      (this.abilityCooldowns[skill.id] || 0) > 0
    )
      return false;
    if (s.mana < skill.cost) {
      this.onToast(tr("Недостаточно энергии.", "Not enough energy."));
      return false;
    }
    const { angle, target } = this.aim(),
      point =
        this.controls.autoAim && target
          ? target
          : this.pointer || {
              x: s.x + Math.cos(angle) * 80,
              y: s.y + Math.sin(angle) * 80,
            };
    const effect = skill.effect || skill.id,
      color = skill.color || stats.weapon.color,
      element =
        skill.element ||
        { frostnova: "ice", meteor: "fire", starwave: "void" }[effect] ||
        stats.weapon.element;
    if (effect === "mark" && !target) return false;
    s.mana -= skill.cost;
    this.abilityCooldowns[skill.id] = skill.cooldown;
    this.syncSkillCooldowns();
    s.abilityUses[skill.id] = (s.abilityUses[skill.id] || 0) + 1;
    this.attackAnimation = 0.35;
    this.facing = angle;
    this.audio.effect("skill");
    if (effect !== "stealth") this.buffs.stealth = 0;
    this.emit(effect, s.x, s.y, color, 32);
    const damage = (n) =>
      stats.skillDamage *
      n *
      skill.power *
      elementMultiplier(this.climate, element);
    const burst = (radius, mult, slow = 0, cone = false) => {
      this.effects.push({
        x: s.x,
        y: s.y,
        type: "burst",
        style: element === "ice" ? "frostnova" : effect,
        radius,
        color,
        life: 0.5,
        maxLife: 0.5,
      });
      if (mult <= 0) return;
      for (const e of this.combatEnemies()) {
        const a = Math.atan2(e.y - s.y, e.x - s.x),
          diff = Math.atan2(Math.sin(a - angle), Math.cos(a - angle));
        if (
          Math.hypot(e.x - s.x, e.y - s.y) < radius + 12 &&
          (!cone || Math.abs(diff) < 0.38) &&
          lineOfSight(this.world, s, e)
        ) {
          this.damageEnemy(e, damage(mult));
          if (slow) e.slow = Math.max(e.slow || 0, slow);
          this.applyWeaponStatus(e, skill);
        }
      }
    };
    if (["burst", "whirlwind", "starwave", "thrust"].includes(effect))
      burst(
        skill.radius || (effect === "whirlwind" ? 105 : 150),
        skill.multiplier || 2.4,
        skill.slow || 0,
        effect === "thrust",
      );
    if (skill.id === "chainlightning") {
      const hits = new Set(),
        points = [{ x: s.x, y: s.y - 12 }];
      let origin = s;
      for (let i = 0; i < 5; i++) {
        const next = this.combatEnemies()
          .filter(
            (e) =>
              !hits.has(e.id) &&
              Math.hypot(e.x - origin.x, e.y - origin.y) < (i ? 150 : 320) &&
              lineOfSight(this.world, origin, e),
          )
          .sort(
            (a, b) =>
              Math.hypot(a.x - origin.x, a.y - origin.y) -
              Math.hypot(b.x - origin.x, b.y - origin.y),
          )[0];
        if (!next) break;
        hits.add(next.id);
        this.damageEnemy(
          next,
          damage((skill.multiplier || 2.8) * Math.pow(0.8, i)),
        );
        points.push({ x: next.x, y: next.y - 10 });
        this.emit("lightning", next.x, next.y, color, 12);
        origin = next;
      }
      this.effects.push({
        x: s.x,
        y: s.y,
        type: "chain",
        points,
        color,
        life: 0.45,
        maxLife: 0.45,
      });
    }
    if (["fan", "volley"].includes(effect) && skill.id !== "chainlightning") {
      const n = skill.count || 3;
      for (let i = 0; i < n; i++)
        this.shoot(
          angle + (i - (n - 1) / 2) * 0.15,
          damage(skill.multiplier || 1.55),
          {
            pierce: skill.pierce || 99,
            range: 320,
            color,
            element,
            type: element ? "magic" : "arrow",
            slow: skill.slow,
            burn: skill.burn,
            poison: skill.poison,
          },
        );
    }
    if (effect === "bulwark") {
      this.buffs.bulwark = 6 + skill.rank - 1;
      this.buffs.shieldColor = color;
      if (skill.id === "riposte") this.buffs.riposte = 6;
      if (skill.id === "flameward") this.buffs.flameward = 6;
      burst(32, 0);
    }
    if (["trap", "field"].includes(effect)) {
      const d = Math.hypot(point.x - s.x, point.y - s.y),
        limit = Math.min(1, 150 / Math.max(1, d));
      this.zones.push({
        type: "trap",
        style: element || effect,
        x: s.x + (point.x - s.x) * limit,
        y: s.y + (point.y - s.y) * limit,
        radius: skill.radius || 65,
        life: skill.duration || 8,
        damage: damage(skill.multiplier || 0.45),
        tick: 0,
        color,
        pull: skill.id === "singularity",
        slow: skill.slow || 0.5,
        ...(skill.burn ? { burn: skill.burn } : {}),
      });
    }
    if (effect === "frostnova")
      burst(skill.radius || 125, skill.multiplier || 1.3, 4 + skill.rank - 1);
    if (effect === "mark") {
      target.mark = 10;
      target.markPower = 0.5 * skill.power;
      this.emit("mark", target.x, target.y, color, 16);
    }
    if (effect === "charge") {
      this.startDash(angle, 155, 0.28, true);
      this.zones.push({
        type: "charge",
        x: 0,
        y: 0,
        radius: 80,
        life: 0.29,
        damage: damage(skill.multiplier || 2.7),
        color,
        poison: skill.poison,
      });
    }
    if (["meteor", "impact"].includes(effect)) {
      const d = Math.hypot(point.x - s.x, point.y - s.y),
        limit = Math.min(1, 250 / Math.max(1, d));
      this.zones.push({
        type: "meteor",
        style: element || effect,
        x: s.x + (point.x - s.x) * limit,
        y: s.y + (point.y - s.y) * limit,
        radius: skill.radius || 125,
        life: 0.7,
        damage: damage(skill.multiplier || 3.5),
        color,
        stun: skill.stun,
        burn: skill.burn,
      });
    }
    if (effect === "stealth") this.buffs.stealth = (skill.duration || 5) + skill.rank - 1;
    if (effect === "heal")
      s.hp = Math.min(
        stats.maxHp,
        s.hp + Math.round(stats.maxHp * 0.2 * skill.power),
      );
    if (effect === "focus") this.buffs.focus = 8 + skill.rank;
    if (effect === "haste") this.buffs.haste = 8 + skill.rank;
    if (effect === "blink") this.startDash(angle, 160 + (skill.rank - 1) * 20, 0.25, true);
    if (effect === "restore")
      s.mana = Math.min(stats.maxMana, s.mana + 40 * skill.power);
    this.persist();
    this.onChange();
    return true;
  }
  learnSkill(index) {
    const success = upgradeSkill(this.save, index);
    if (success) {
      this.persist();
      this.audio.effect("level");
      this.onChange();
    }
    return success;
  }
  equipWeapon(id) {
    if (
      !weapons[id] ||
      weapons[id].class !== this.save.characterClass ||
      !this.save.ownedWeapons.includes(id) ||
      this.save.level < (weapons[id]?.level || 1)
    )
      return false;
    this.save.equippedWeapon = id;
    this.save.skillRanks = disciplines[weaponDiscipline(this.save)].ids.map(
      (id) => this.save.abilityRanks[id] || 0,
    );
    this.syncSkillCooldowns();
    this.buffs.stealth = 0;
    this.attackCooldown = Math.max(this.attackCooldown, 0.18);
    this.combo = 0;
    this.persist();
    this.onChange();
    return true;
  }
  knockback(e, angle, distance) {
    if (e.boss) return;
    for (let i = 0; i < distance; i += 3) {
      const x = e.x + Math.cos(angle) * 3,
        y = e.y + Math.sin(angle) * 3;
      if (canWalk(this.world, x, y, 6)) {
        e.x = x;
        e.y = y;
      }
    }
  }
  startDash(angle, distance, duration, charge = false) {
    this.path = [];
    this.pendingInteraction = null;
    this.dash = {
      angle,
      remaining: duration,
      duration,
      speed: distance / duration,
      charge,
    };
    this.invincible = duration + 0.12;
  }
  dodge() {
    if (this.paused || !this.save || this.dodgeCooldown > 0) return;
    this.dodgeCooldown =
      this.climate.weather === "snow" && !this.stats.armor.weatherproof
        ? 2.2
        : 1.8;
    const move = movement(this.keys);
    const direction =
      Math.hypot(this.joystick.x, this.joystick.y) > 0.1 ? this.joystick : move;
    const angle =
      direction.x || direction.y
        ? Math.atan2(direction.y, direction.x)
        : (this.facing ?? 0);
    this.startDash(angle, 85, 0.2);
    this.effects.push({
      x: this.save.x,
      y: this.save.y,
      type: "burst",
      radius: 18,
      color: "#e6edcc",
      life: 0.25,
      maxLife: 0.25,
    });
  }
  potion(type = "potion", fromMenu = false) {
    if ((this.paused && !fromMenu) || !this.save) return;
    if (this.potionCooldown > 0) {
      this.onToast(
        tr(
          `Зелье будет доступно через ${Math.ceil(this.potionCooldown)} с.`,
          `Potion ready in ${Math.ceil(this.potionCooldown)} s.`,
        ),
      );
      return;
    }
    const s = this.save,
      stats = this.stats;
    if (!s.inventory[type]) {
      this.onToast(
        tr(
          "Зелья закончились. Загляните к травнице.",
          "No potions left. Visit the herbalist.",
        ),
      );
      return;
    }
    const key = type === "potion" ? "hp" : "mana",
      max = key === "hp" ? stats.maxHp : stats.maxMana;
    if (s[key] >= max) {
      this.onToast(tr("Запас уже полон.", "Already full."));
      return;
    }
    s.inventory[type]--;
    this.potionCooldown = 8;
    this.emit("heal", s.x, s.y, type === "potion" ? "#bbde9c" : "#a5cce6", 22);
    s[key] = Math.min(max, s[key] + (key === "hp" ? 65 : 60));
    this.audio.effect("pickup");
    this.persist();
    this.onChange();
  }
  damageEnemy(e, amount) {
    if (e.hp <= 0 || e.sleeping) return;
    if (e.boss && e.arena && !e.engaged) {
      const s = this.save,
        a = e.arena;
      if (s.x <= a.x || s.x >= a.x + a.w || s.y <= a.y || s.y >= a.y + a.h)
        return;
      updateBoss(this, e, 0);
    }
    const damage = Math.round(
      amount *
        (e.mark > 0 ? 1 + (e.markPower || 0.5) : 1) *
        (e.ward ? 0.75 : 1),
    );
    this.shake = this.controls.screenShake ? 0.1 : 0;
    e.hp = Math.max(0, e.hp - damage);
    this.particles.push({
      x: e.x,
      y: e.y - 24,
      text: "−" + damage,
      color: "#ffe8b4",
      life: 0.8,
      maxLife: 0.8,
    });
    this.audio.effect("hit");
    this.emit("impact", e.x, e.y, e.color || "#ecc894", 6);
    if (e.hp <= 0) {
      this.defeated.add(e.id);
      if (e.boss) this.bossDrop(e);
      else if (!e.summoned) {
        this.save.gold += e.gold;
        this.save.inventory.fiber +=
          e.type === "slime" || e.type === "spider" ? 2 : 1;
        if (["wolf", "bat", "bandit"].includes(e.type))
          this.save.inventory.leather++;
        if (["golem", "sentinel", "skeleton"].includes(e.type))
          this.save.inventory.ore++;
        if (e.type === "shaman" || e.type === "wisp")
          this.save.inventory.crystal++;
      }
      this.addXp(Math.round(e.xp * this.climate.xp));
      if (this.climate.night && !this.save.activeDungeon && !e.summoned)
        this.save.nightKills++;
      if (!this.save.activeDungeon && !e.boss && !e.summoned)
        this.save.respawns[e.id] =
          this.climate.elapsed + 150 + (e.tier || 0) * 20;
      if (!e.summoned && this.save.kills[e.type] !== undefined)
        this.save.kills[e.type]++;
      this.effects.push({
        x: e.x,
        y: e.y - 8,
        type: "burst",
        radius: 25,
        color: "#dce5ae",
        life: 0.5,
        maxLife: 0.5,
      });
      if (e.type === "guardian") {
        this.save.flags.bossDefeated = true;
        this.save.quest = 6;
        this.onVictory();
      }
      this.persist();
      this.onChange();
    }
  }
  addXp(amount) {
    this.save.xp += amount;
    while (this.save.xp >= this.xpNeeded && this.save.level < 50) {
      this.save.xp -= this.xpNeeded;
      this.save.level++;
      this.save.skillPoints++;
      this.save.hp = Math.min(
        this.stats.maxHp,
        this.save.hp + Math.round(this.stats.maxHp * 0.18),
      );
      this.save.mana = Math.min(this.stats.maxMana, this.save.mana + 20);
      this.audio.effect("level");
      this.onToast(
        tr(
          `Уровень ${this.save.level}! +1 очко навыков. Книга умений: ${keyLabel(this.controls.bindings.skills)}.`,
          `Level ${this.save.level}! +1 skill point. Skill book: ${keyLabel(this.controls.bindings.skills)}.`,
        ),
      );
    }
  }
  collect(o) {
    if (this.collected.has(o.id)) return;
    this.collected.add(o.id);
    if (o.type === "chest") {
      this.save.gold += 35;
      this.save.inventory.potion++;
      const chestNumber = Number(o.id.replace(/\D/g, "")),
        foundGear = ["linenCap", "linenPants", "sandals"][chestNumber % 3];
      if (
        chestNumber % 5 === 0 &&
        !this.save.ownedWearables.includes(foundGear)
      ) {
        this.save.ownedWearables.push(foundGear);
        this.onToast(
          tr(
            "В тайнике найден предмет одежды. Откройте рюкзак.",
            "Found clothing in the chest. Open your backpack.",
          ),
        );
      }
      if (Number(o.id.replace(/\D/g, "")) % 4 === 0)
        this.save.inventory[this.save.characterClass + "Scroll"]++;
      this.addXp(15);
      this.onToast(
        tr(
          "Найдено: 35 монет и зелье здоровья!",
          "Found: 35 coins and a health potion!",
        ),
      );
    } else {
      this.save.inventory[o.type] =
        (this.save.inventory[o.type] || 0) +
        (o.type === "herb" && this.climate.night ? 2 : 1);
      this.addXp(5);
      this.onToast(
        tr("Ресурс добавлен в рюкзак.", "Resource added to your backpack."),
      );
    }
    this.audio.effect("pickup");
    this.persist();
    this.onChange();
  }
  hurt(amount, element = "physical", environment = false) {
    if (this.invincible > 0) return;
    if (this.buffs.riposte > 0 && !environment) {
      const e = this.combatEnemies().find(
        (e) =>
          Math.hypot(e.x - this.save.x, e.y - this.save.y) < 110 &&
          lineOfSight(this.world, this.save, e),
      );
      if (e) {
        this.damageEnemy(e, this.stats.damage * 0.7);
        this.emit("parry", e.x, e.y, "#f2ddab", 12);
      }
    }
    if (this.buffs.bulwark > 0) amount *= 0.45;
    amount = Math.round(
      amount *
        (environment ? 1 : this.climate.enemyDamage) *
        (this.stats.armor.resist === element ? 0.7 : 1),
    );
    this.shake = this.controls.screenShake ? 0.2 : 0;
    this.save.hp = Math.max(
      0,
      this.save.hp -
        Math.max(1, amount - Math.min(amount * 0.5, this.stats.defense * 0.55)),
    );
    this.invincible = 0.38;
    this.audio.effect("hurt");
    this.particles.push({
      x: this.save.x,
      y: this.save.y - 24,
      text:
        "−" +
        Math.max(1, amount - Math.min(amount * 0.5, this.stats.defense * 0.55)),
      color: "#f0ad98",
      life: 0.7,
      maxLife: 0.7,
    });
    this.persist();
    this.onChange();
    if (this.save.hp <= 0) {
      this.setPaused(true);
      this.onDeath();
    }
  }
  respawn() {
    if (this.save.activeDungeon) this.leaveDungeon(true);
    const camp =
      landmarks.find((o) => o.id === this.save.checkpoint) ||
      landmarks.find((o) => o.id === "camp1");
    this.save.x = camp.x + 24;
    this.save.y = camp.y;
    this.save.hp = this.stats.maxHp;
    this.save.mana = this.stats.maxMana;
    this.save.gold = Math.max(
      0,
      this.save.gold - Math.min(200, Math.ceil(this.save.gold * 0.12)),
    );
    this.path = [];
    this.projectiles = [];
    this.invincible = 2;
    this.dash = null;
    this.zones = [];
    this.hazards = [];
    this.sparks = [];
    this.potionCooldown = 0;
    this.buffs = {};
    this.pendingInteraction = null;
    this.waypoint = null;
    this.combo = 0;
    this.comboTimer = 0;
    this.attackCooldown = 0;
    this.skillCooldown = 0;
    this.skillCooldowns = [0, 0, 0, 0, 0];
    this.abilityCooldowns = {};
    this.fishing = null;
    this.dodgeCooldown = 0;
    this.camera = { x: this.save.x, y: this.save.y };
    for (const e of this.enemies) {
      e.x = e.homeX;
      e.y = e.homeY;
      e.windup = 0;
      e.cooldown = 1;
      e.slow = 0;
      e.stun = 0;
      e.mark = 0;
      if (e.boss) {
        e.hp = e.maxHp;
        e.engaged = false;
        e.phase = 1;
        e.elapsed = 0;
        e.attackTimer = 2;
      }
    }
    this.persist();
    this.onChange();
  }
  rest(o) {
    if (!o || this.save.activeDungeon || this.inDanger()) {
      this.onToast(
        tr("Сначала отойдите от противников.", "Move away from enemies first."),
      );
      return false;
    }
    this.save.restTime += 45;
    this.potionCooldown = 0;
    this.save.hp = this.stats.maxHp;
    this.save.mana = this.stats.maxMana;
    this.save.checkpoint = o.id;
    if (!this.save.visitedCamps.includes(o.id))
      this.save.visitedCamps.push(o.id);
    this.skillCooldown = 0;
    this.skillCooldowns = [0, 0, 0, 0, 0];
    this.abilityCooldowns = {};
    this.fishing = null;
    this.persist();
    this.onChange();
    return true;
  }
  fastTravel(id) {
    const camp = landmarks.find((o) => o.id === id && o.type === "camp");
    if (
      !camp ||
      this.save.activeDungeon ||
      !this.save.visitedCamps.includes(id)
    )
      return false;
    if (
      this.combatEnemies().some(
        (e) => Math.hypot(e.x - this.save.x, e.y - this.save.y) < 160,
      ) ||
      this.projectiles.some(
        (p) =>
          p.enemy && Math.hypot(p.x - this.save.x, p.y - this.save.y) < 180,
      )
    ) {
      this.onToast(
        tr("Сначала отойдите от противников.", "Move away from enemies first."),
      );
      return false;
    }
    this.save.x = camp.x + 24;
    this.save.y = camp.y;
    this.path = [];
    this.pendingInteraction = null;
    this.waypoint = null;
    this.projectiles = [];
    this.zones = [];
    this.dash = null;
    this.selectedTarget = null;
    this.camera = { x: this.save.x, y: this.save.y };
    this.persist();
    this.onChange();
    return true;
  }
  update(dt) {
    const s = this.save;
    if (!s || this.paused) return;
    s.playtime += dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    for (const id of Object.keys(this.abilityCooldowns))
      this.abilityCooldowns[id] = Math.max(0, this.abilityCooldowns[id] - dt);
    this.syncSkillCooldowns();
    this.levelSyncTimer = (this.levelSyncTimer || 0) + dt;
    if (this.levelSyncTimer > 2) {
      this.levelSyncTimer = 0;
      this.syncEnemyLevels();
    }
    if (this.fishing) {
      this.updateFishing(dt);
      this.uiTimer += dt;
      if (this.uiTimer > 0.06) {
        this.uiTimer = 0;
        this.onChange();
      }
      return;
    }
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.invincible = Math.max(0, this.invincible - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    this.attackAnimation = Math.max(0, this.attackAnimation - dt);
    this.shake = Math.max(0, this.shake - dt);
    for (const key of Object.keys(this.buffs).filter(
      (key) => typeof this.buffs[key] === "number",
    ))
      this.buffs[key] = Math.max(0, this.buffs[key] - dt);
    s.mana = Math.min(
      this.stats.maxMana,
      s.mana +
        dt *
          this.stats.manaRegen *
          (this.enemies.some((e) => e.boss && e.engaged && e.hp > 0)
            ? 0.45
            : 1),
    );
    const input = movement(this.keys);
    let dx = input.x,
      dy = input.y;
    if (this.joystick.x || this.joystick.y) {
      dx = this.joystick.x;
      dy = this.joystick.y;
    }
    if (dx || dy) {
      this.path = [];
      this.pendingInteraction = null;
    } else if (this.path.length) {
      const dest = this.path[0],
        distance = Math.hypot(dest.x - s.x, dest.y - s.y);
      if (distance < 4) this.path.shift();
      else {
        dx = (dest.x - s.x) / distance;
        dy = (dest.y - s.y) / distance;
      }
    }
    this.moving = !!(dx || dy || this.dash);
    if (this.dash) {
      dx = Math.cos(this.dash.angle);
      dy = Math.sin(this.dash.angle);
      this.facing = this.dash.angle;
    }
    if (this.moving) {
      const length = Math.max(1, Math.hypot(dx, dy)),
        speed =
          (this.dash
            ? this.dash.speed
            : this.stats.speed *
              (this.stats.armor.weatherproof ? 1 : this.climate.speed) *
              (this.buffs.chilled > 0 ? 0.65 : 1) *
              (this.buffs.haste > 0 ? 1.3 : 1)) * dt;
      if (!this.dash) this.facing = Math.atan2(dy, dx);
      // Substeps prevent a dash tunnelling through trunks or house walls.
      const steps = Math.max(1, Math.ceil(speed / 5));
      let moved = false;
      for (let i = 0; i < steps; i++) {
        const nx = s.x + ((dx / length) * speed) / steps,
          ny = s.y + ((dy / length) * speed) / steps;
        if (canWalk(this.world, nx, s.y)) {
          s.x = nx;
          moved = true;
        }
        if (canWalk(this.world, s.x, ny)) {
          s.y = ny;
          moved = true;
        }
      }
      if (!moved) {
        this.path = [];
        this.pendingInteraction = null;
      }
    }
    if (this.dash) {
      this.dash.remaining -= dt;
      if (this.dash.remaining <= 0) this.dash = null;
    }
    if (this.keys.has(this.controls.bindings.attack) || this.heldAttack)
      this.attack();
    if (this.pendingInteraction) {
      const o = this.world.objects
        .concat(this.activeLoot)
        .find((o) => o.id === this.pendingInteraction);
      if (!o) {
        this.pendingInteraction = null;
      } else if (Math.hypot(s.x - o.x, s.y - o.y) < 43) {
        this.pendingInteraction = null;
        this.path = [];
        this.onInteract(o);
        if (this.paused) return;
      }
    }
    if (
      this.waypoint &&
      Math.hypot(s.x - this.waypoint.x, s.y - this.waypoint.y) < 12
    ) {
      this.waypoint = null;
      this.onToast(
        tr("Вы пришли к отметке на карте.", "You reached your map marker."),
      );
    }
    const reg = s.activeDungeon?.id || regionAt(s.x, s.y);
    if (reg !== this.currentRegion) {
      this.currentRegion = reg;
      if (!s.discovered.includes(reg)) {
        s.discovered.push(reg);
        this.addXp(15);
        this.persist();
      }
      this.onChange();
    }
    for (const e of this.combatEnemies()) {
      if (this.buffs.flameward > 0 && Math.hypot(e.x - s.x, e.y - s.y) < 65)
        e.burn = Math.max(e.burn || 0, 1);
      e.slow = Math.max(0, (e.slow || 0) - dt);
      e.stun = Math.max(0, (e.stun || 0) - dt);
      e.mark = Math.max(0, (e.mark || 0) - dt);
      if (e.burn > 0 || e.poison > 0) {
        e.burn = Math.max(0, (e.burn || 0) - dt);
        e.poison = Math.max(0, (e.poison || 0) - dt);
        e.dotTick = (e.dotTick || 0) - dt;
        if (e.dotTick <= 0) {
          e.dotTick = 1;
          this.damageEnemy(e, e.dotDamage || 4);
        }
      }
      if (e.hp <= 0) continue;
      const dist = Math.hypot(s.x - e.x, s.y - e.y);
      if (e.boss) {
        updateBoss(this, e, dt);
        continue;
      }
      if (dist > 360 || e.stun > 0) continue;
      if (this.buffs.stealth > 0) {
        e.windup = 0;
        continue;
      }
      e.cooldown = Math.max(0, e.cooldown - dt);
      const large = ["guardian", "titan"].includes(e.type),
        ranged = ["sentinel", "wisp", "skeleton", "shaman"].includes(e.type),
        attackRange = large ? 88 : ranged ? 165 : 25;
      if (e.windup > 0) {
        e.windup -= dt;
        if (e.windup <= 0) {
          if (e.type === "shaman") {
            addHazard(this, {
              x: e.aimX,
              y: e.aimY,
              radius: 50,
              delay: 0.75,
              damage: e.damage,
              element: "void",
              color: "#d9a0e9",
              owner: e.id,
            });
            this.emit("cast", e.x, e.y, "#d9a0e9", 15);
          } else if (ranged) {
            const a = Math.atan2((e.aimY ?? s.y) - e.y, (e.aimX ?? s.x) - e.x);
            this.projectiles.push({
              x: e.x,
              y: e.y - 8,
              vx: Math.cos(a) * 170,
              vy: Math.sin(a) * 170,
              life: 1.6,
              damage: e.damage,
              enemy: true,
              type: e.type === "wisp" ? "magic" : "arrow",
              color: "#f0a787",
              element: e.element,
              hit: new Set(),
              pierce: 1,
            });
          } else {
            if (Math.hypot(s.x - e.x, s.y - e.y) < (large ? 96 : 30)) {
              this.hurt(e.damage, e.element);
              if (e.type === "spider") this.buffs.poison = 4;
            }
            this.effects.push({
              x: e.x,
              y: e.y,
              type: "burst",
              radius: large ? 95 : 26,
              color: "#de9a7e",
              life: 0.35,
              maxLife: 0.35,
            });
            if (e.type === "guardian" && e.hp < e.maxHp * 0.45)
              for (let n = 0; n < 6; n++) {
                const a = (n * Math.PI) / 3 + this.time;
                this.projectiles.push({
                  x: e.x,
                  y: e.y - 8,
                  vx: Math.cos(a) * 125,
                  vy: Math.sin(a) * 125,
                  life: 2,
                  damage: 14,
                  enemy: true,
                  type: "magic",
                  color: "#e8a984",
                  hit: new Set(),
                  pierce: 1,
                });
              }
          }
          e.cooldown = large ? 2 : ranged ? 2.1 : 1.4;
          if (this.paused) return;
        }
      } else if (
        dist < attackRange &&
        e.cooldown <= 0 &&
        lineOfSight(this.world, e, s)
      ) {
        e.windup = large ? 0.9 : ranged ? 0.65 : 0.45;
        e.aimX = s.x;
        e.aimY = s.y;
      } else if (dist < this.climate.aggro && dist > (ranged ? 115 : 20)) {
        const speed = e.speed * (e.slow > 0 ? 0.32 : 1) * dt,
          dx = (s.x - e.x) / dist,
          dy = (s.y - e.y) / dist;
        if (canWalk(this.world, e.x + dx * speed, e.y, 6)) e.x += dx * speed;
        if (canWalk(this.world, e.x, e.y + dy * speed, 6)) e.y += dy * speed;
      } else if (dist >= this.climate.aggro) {
        const d = Math.hypot(e.homeX - e.x, e.homeY - e.y);
        if (d > 3) {
          const x = e.x + ((e.homeX - e.x) / d) * e.speed * dt,
            y = e.y + ((e.homeY - e.y) / d) * e.speed * dt;
          if (canWalk(this.world, x, y, 6)) {
            e.x = x;
            e.y = y;
          }
        }
      }
    }
    for (const zone of this.zones) {
      zone.life -= dt;
      if (zone.type === "trap") {
        zone.tick -= dt;
        for (const e of this.combatEnemies())
          if (
            Math.hypot(e.x - zone.x, e.y - zone.y) < zone.radius &&
            lineOfSight(this.world, zone, e)
          ) {
            e.slow = Math.max(e.slow || 0, zone.slow || 0.5);
            if (zone.pull && !e.boss) {
              const d = Math.max(1, Math.hypot(zone.x - e.x, zone.y - e.y)),
                nx = e.x + ((zone.x - e.x) / d) * 35 * dt,
                ny = e.y + ((zone.y - e.y) / d) * 35 * dt;
              if (canWalk(this.world, nx, ny, 6)) {
                e.x = nx;
                e.y = ny;
              }
            }
            if (zone.tick <= 0) {
              this.damageEnemy(e, zone.damage);
              this.applyWeaponStatus(e, zone);
            }
          }
        if (zone.tick <= 0) zone.tick = 0.8;
      } else if (zone.life <= 0) {
        if (zone.type === "charge") {
          zone.x = s.x;
          zone.y = s.y;
        }
        for (const e of this.combatEnemies())
          if (
            Math.hypot(e.x - zone.x, e.y - zone.y) < zone.radius &&
            lineOfSight(this.world, zone, e)
          ) {
            this.damageEnemy(e, zone.damage);
            this.applyWeaponStatus(e, zone);
            if (zone.type === "charge") {
              e.stun = e.boss ? 0.2 : 1.3;
              e.windup = 0;
              e.cooldown = Math.max(e.cooldown, 0.8);
            }
          }
        this.emit(zone.type, zone.x, zone.y, zone.color, 40);
        this.effects.push({
          x: zone.x,
          y: zone.y,
          type: "burst",
          radius: zone.radius,
          color: zone.color,
          life: 0.5,
          maxLife: 0.5,
        });
        this.shake = this.controls.screenShake ? 0.25 : 0;
      }
    }
    this.zones = this.zones.filter((z) => z.life > 0);
    for (const p of this.projectiles) {
      p.life -= dt;
      const before = { x: p.x, y: p.y };
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0 || !lineOfSight(this.world, before, p)) {
        p.life = 0;
        continue;
      }
      if (p.enemy) {
        if (Math.hypot(p.x - s.x, p.y - (s.y - 9)) < 14) {
          this.hurt(p.damage, p.element);
          if (p.element === "poison") this.buffs.poison = 4;
          p.life = 0;
          if (this.paused) return;
        }
        continue;
      }
      for (const e of this.combatEnemies())
        if (
          !p.hit.has(e.id) &&
          Math.hypot(p.x - e.x, p.y - (e.y - 8)) <
            (["guardian", "titan"].includes(e.type) ? 30 : 16)
        ) {
          p.hit.add(e.id);
          if (p.practice)
            s.weaponPractice[p.practice] =
              (s.weaponPractice[p.practice] || 0) + 1;
          this.damageEnemy(e, p.damage);
          this.applyWeaponStatus(e, p);
          if (p.hit.size >= p.pierce) {
            p.life = 0;
            break;
          }
        }
    }
    this.projectiles = this.projectiles.filter((p) => p.life > 0);
    this.updateAdventure(dt);
    if (this.paused) return;
    this.uiTimer += dt;
    this.saveTimer += dt;
    if (this.uiTimer > 0.1) {
      this.uiTimer = 0;
      this.onChange();
    }
    if (this.saveTimer > 3) {
      this.saveTimer = 0;
      this.persist();
    }
  }
  frame(now) {
    const dt = Math.min((now - this.last) / 1000, 0.04);
    this.last = now;
    this.time += dt;
    this.update(dt);
    for (const p of this.particles) {
      if (!this.paused) {
        p.life -= dt;
        p.y -= dt * 24;
      }
    }
    for (const e of this.effects) if (!this.paused) e.life -= dt;
    this.particles = this.particles.filter((p) => p.life > 0);
    this.effects = this.effects.filter((e) => e.life > 0);
    this.render(dt);
    requestAnimationFrame((t) => this.frame(t));
  }
  render(dt) {
    const c = this.c,
      w = this.canvas.width,
      h = this.canvas.height,
      s = this.save;
    const boss = s && this.enemies.find((e) => e.boss && e.engaged && e.hp > 0),
      tx = s
        ? s.x +
          (boss
            ? Math.max(-w * 0.18, Math.min(w * 0.18, (boss.x - s.x) * 0.28))
            : 0)
        : 25 * TILE + Math.sin(this.time * 0.08) * 40,
      ty = s
        ? s.y +
          (boss
            ? Math.max(-h * 0.18, Math.min(h * 0.18, (boss.y - s.y) * 0.28)) -
              h * 0.1
            : 0)
        : 61 * TILE;
    this.camera.x += (tx - this.camera.x) * Math.min(1, dt * 8);
    this.camera.y += (ty - this.camera.y) * Math.min(1, dt * 8);
    const cx = Math.round(
        Math.max(
          0,
          Math.min(
            (this.world.bounds?.width || WIDTH) * TILE - w,
            this.camera.x - w / 2,
          ),
        ),
      ),
      cy = Math.round(
        Math.max(
          0,
          Math.min(
            (this.world.bounds?.height || HEIGHT) * TILE - h,
            this.camera.y - h / 2,
          ),
        ),
      );
    this.view = { x: cx, y: cy, w, h };
    this.terrain.draw(c, cx, cy, w, h);
    c.save();
    c.translate(
      -cx + (this.shake > 0 ? Math.sin(this.time * 90) * 2 : 0),
      -cy + (this.shake > 0 ? Math.cos(this.time * 85) * 2 : 0),
    );
    for (const o of this.world.getObjectsInRect(
      cx - 100,
      cy - 100,
      w + 200,
      h + 200,
    ))
      if (o.type === "dungeonFloor")
        drawAdventureObject(c, o, this.time, this.world, this.collected);
    for (const hazard of this.hazards) drawHazard(c, hazard, this.time);
    for (const z of this.zones) {
      if (z.type === "charge") continue;
      c.fillStyle = z.color + "25";
      c.strokeStyle = z.color;
      c.lineWidth = 1;
      c.beginPath();
      c.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      if (z.type === "meteor") {
        c.fillStyle = z.color;
        c.fillRect(z.x - 2, z.y - (90 * z.life) / 0.7, 4, 14);
      }
    }
    if (this.buffs.bulwark > 0 && s) {
      c.strokeStyle = this.buffs.shieldColor || "#d0e3b4";
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(s.x, s.y - 15, 17, 24, 0, 0, Math.PI * 2);
      c.stroke();
    }
    if (this.path.length) {
      c.fillStyle = "#f8e5b54a";
      for (let i = 0; i < this.path.length; i += 2) {
        const p = this.path[i];
        c.fillRect(p.x - 1, p.y - 1, 3, 3);
      }
      const p = this.path[this.path.length - 1];
      c.strokeStyle = "#f4e3b7";
      c.strokeRect(p.x - 5, p.y - 5, 10, 10);
    }
    const visible = this.world
      .getObjectsInRect(cx - 80, cy - 25, w + 160, h + 115)
      .filter(
        (o) =>
          o.type !== "dungeonFloor" &&
          o.x > cx - 80 &&
          o.x < cx + w + 80 &&
          o.y > cy - 20 &&
          o.y < cy + h + 85,
      )
      .map((o) => ({ ...o, drawType: "object" }));
    visible.push(
      ...this.enemies
        .filter(
          (e) =>
            e.hp > 0 &&
            (!e.nightOnly || this.climate.night) &&
            (e.type !== "guardian" || s?.flags.bossAwake) &&
            e.x > cx - 40 &&
            e.x < cx + w + 40 &&
            e.y > cy - 30 &&
            e.y < cy + h + 40,
        )
        .map((e) => ({ ...e, drawType: "enemy" })),
    );
    visible.push(...this.activeLoot.map((o) => ({ ...o, drawType: "loot" })));
    if (s) visible.push({ ...s, drawType: "hero" });
    visible.sort((a, b) => a.y - b.y);
    for (const o of visible) {
      if (o.drawType === "hero") {
        c.globalAlpha =
          this.buffs.stealth > 0
            ? 0.28
            : this.invincible > 0
              ? 0.55 + 0.45 * Math.sin(this.time * 30)
              : 1;
        drawHero(c, o.x, o.y, o.characterClass, {
          ...o.appearance,
          player: true,
          equipment: s.equippedWearables,
          frame: this.moving ? this.time * 12 : 0,
          facing: this.facing ?? Math.PI / 2,
          swing: this.attackAnimation,
          weapon: s.equippedWeapon,
          armorLevel: s.armorLevel,
          armor: s.equippedArmor,
        });
        c.globalAlpha = 1;
      } else if (o.drawType === "enemy") {
        if (!drawAdvancedEnemy(c, o, this.time)) drawEnemy(c, o, this.time);
        c.font = "bold 8px monospace";
        c.textAlign = "center";
        const ly = o.y - (o.boss ? 65 : 35);
        c.fillStyle = "#172320";
        c.fillRect(o.x - 16, ly - 8, 32, 11);
        c.fillStyle = o.level > s.level + 1 ? "#f0ac89" : "#e2d2a3";
        c.fillText("Lv. " + o.level, o.x, ly);
      } else {
        if (
          o.type === "tree" &&
          s &&
          Math.abs(o.x - s.x) < 26 &&
          s.y < o.y &&
          s.y > o.y - 55
        )
          c.globalAlpha = 0.48;
        if (!drawAdventureObject(c, o, this.time, this.world, this.collected))
          drawObject(c, o, this.time, this.collected, s?.flags);
        c.globalAlpha = 1;
      }
    }
    for (const p of this.projectiles) {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(Math.atan2(p.vy, p.vx));
      if (p.type === "arrow") {
        c.fillStyle = p.color || "#f4ddb4";
        c.fillRect(-8, -1, 12, 2);
        c.fillStyle = "#617d75";
        c.fillRect(3, -2, 4, 4);
      } else {
        const color = p.color || "#b3e8eb";
        c.shadowColor = color;
        c.shadowBlur = 9;
        c.fillStyle = color;
        for (let i = 0; i < 4; i++) {
          c.globalAlpha = 0.15 + i * 0.16;
          c.fillRect(-18 + i * 4, -2 - (i % 2), 4, 4);
        }
        c.globalAlpha = 1;
        c.fillStyle = color;
        if (p.element === "ice") {
          c.beginPath();
          c.moveTo(-6, 0);
          c.lineTo(0, -4);
          c.lineTo(7, 0);
          c.lineTo(0, 4);
          c.closePath();
          c.fill();
        } else if (p.element === "lightning") {
          c.strokeStyle = color;
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(-14, -4);
          c.lineTo(-7, 2);
          c.lineTo(0, -3);
          c.lineTo(6, 0);
          c.stroke();
        } else {
          c.beginPath();
          c.arc(0, 0, p.element === "fire" ? 4 : 3, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = "#f4ffee";
        c.fillRect(-1, -1, 2, 2);
      }
      c.restore();
    }
    for (const e of this.effects) {
      drawSkillEffect(c, e, this.time);
      c.globalAlpha = e.life / e.maxLife;
      c.strokeStyle = e.color;
      c.lineWidth = e.type === "slash" ? 3 : 2;
      c.beginPath();
      if (e.type === "chain") {
        for (let i = 1; i < e.points.length; i++) {
          const a = e.points[i - 1],
            b = e.points[i];
          c.moveTo(a.x, a.y);
          c.lineTo((a.x + b.x) / 2 + 5, (a.y + b.y) / 2 - 8);
          c.lineTo(b.x, b.y);
        }
      } else if (e.type === "slash")
        c.arc(
          e.x,
          e.y,
          e.radius * (1 - (e.life / e.maxLife) * 0.4),
          e.angle - (e.arc || 1.2),
          e.angle + (e.arc || 1.2),
        );
      else c.arc(e.x, e.y, e.radius * (1 - e.life / e.maxLife), 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 1;
    }
    for (const p of this.particles) {
      if (!this.controls.showDamage) continue;
      c.globalAlpha = Math.min(1, p.life * 2);
      c.font = "bold 10px monospace";
      c.textAlign = "center";
      c.fillStyle = "#23382f";
      c.fillText(p.text, p.x + 1, p.y + 1);
      c.fillStyle = p.color;
      c.fillText(p.text, p.x, p.y);
      c.globalAlpha = 1;
    }
    drawClimate(c, this, cx, cy, w, h);
    drawSparks(c, this);
    for (let i = 0; i < 12; i++) {
      const px = cx + ((i * 97 + this.time * 3) % w),
        py = cy + ((i * 59 + Math.sin(this.time * 0.8 + i) * 8) % h);
      c.globalAlpha = 0.25 + Math.sin(this.time * 2 + i) * 0.18;
      c.fillStyle = "#fff7c6";
      c.fillRect(px, py, 1, 1);
    }
    c.globalAlpha = 1;
    c.restore();
  }
}

installAdventure(Game);
installLife(Game);

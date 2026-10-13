import { classes, tr, label, language } from "./i18n.js";
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
  critChance,
  CRIT_MULTIPLIER,
} from "./equipment.js";
import { loadControls, movement, keyLabel } from "./controls.js";
import { createTerrain, drawObject, drawHero, drawEnemy, setSeason, armorTier, drawWingFlash } from "./art.js";
import { seasonNames } from "./climate.js";
import { installLife } from "./life.js";
import { barFor, disciplines, weaponDiscipline } from "./abilities.js";
import { installAdventure } from "./adventure.js";
import { installEclipse } from "./eclipse.js";
import { installMinions, drawMinion } from "./minions.js";
import { drawProjectile, drawZone, drawCast, elementColors } from "./spellfx.js";
import { installLoot, drawGroundItem, drawLootLabels } from "./loot.js";
import { installWorldBosses, drawWorldBoss } from "./worldbosses.js";
import { installInteriors, addDoors } from "./interiors.js";
import { addSettlements, createCritters, updateCritters } from "./settlements.js";
import { drawDecor, drawRuinHouse, drawCritter, isFlatDecor } from "./settlement-art.js";
import { installStory, storyOf } from "./story.js";
import { drawNova, drawDecal, drawBeam, drawOrbit, drawTornado, drawBossCast, drawBreath, updateVfx, drawVfx, dodgeBurst, dodgeTrail, drawSpiritWolf, attackStyle, attackParticles, drawAfterimage, hitBurst } from "./skillvfx.js";
import { installSkillMechanics } from "./skillmech.js";
import { installClassKit, drawThrown, drawCorpse, drawFormBeast } from "./classkit.js";
import { addBiomeSpawns, biomeSpecial, drawBiomeEnemy } from "./bestiary.js";
import { drawEnemyTelegraph } from "./fx.js";
// How each foe's blow looks: fangs, claws, heavy slams or a blade.
const enemyStrikeStyle = (e, large) =>
  large || ["golem", "yeti", "treantling", "sandGolem", "titan"].includes(e.type)
    ? "heavy"
    : ["wolf", "boar", "ghoul"].includes(e.type)
      ? "bite"
      : ["spider", "crab", "scorpion", "bat", "toad", "slime"].includes(e.type)
        ? "claw"
        : "blade";
import { expandedEnemyStats, updateBoss, addHazard } from "./battle.js";
import { elementMultiplier } from "./climate.js";
import {
  drawHazard,
  drawSparks,
  drawClimate,
  drawSlash,
  drawDeath,
  drawLevelUp,
  drawVignette,
  drawDodge,
} from "./fx.js";
import {
  drawAdventureObject,
  drawAdvancedEnemy,
  drawSkillEffect,
} from "./adventure-art.js";
export const enemyStats = expandedEnemyStats;
// Flat decorations are drawn before everything that stands on them.
const isFloor = (o) =>
  o.type === "dungeonFloor" ||
  isFlatDecor(o) ||
  o.type === "houseExit" ||
  (o.type === "furniture" && (o.kind === "rug" || o.kind === "window"));
export class Game {
  constructor(canvas, platform, audio) {
    this.canvas = canvas;
    this.c = canvas.getContext("2d", { alpha: false });
    this.platform = platform;
    this.audio = audio;
    this.world = createWorld();
    addDoors(this.world);
    addSettlements(this.world);
    addBiomeSpawns(this.world);
    this.critters = createCritters(Math.random, this.world);
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
    this.decals = [];
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
    // Single random source for crits and drops; tests replace it for determinism.
    this.rng = Math.random;
    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    requestAnimationFrame((t) => this.frame(t));
  }
  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    // Small screens zoom out a little so the hero sees enough of the world.
    const small = Math.min(bounds.width, bounds.height);
    this.scale = small < 440 ? Math.max(1.4, Math.min(1.75, small / 235)) : bounds.width < 600 ? 1.65 : 2;
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
    this.season = null;
    this.syncSeason(false);
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
    this.decals = [];
    this.allies = [];
    this.groundLoot = [];
    this.heroAnim = null;
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
  // A steeper curve keeps the campaign from being finished in minutes.
  get xpNeeded() {
    return Math.round(100 * this.save.level ** 1.55);
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
              "door",
              "houseExit",
              "stash",
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
      style:
        options.style ||
        options.element ||
        stats.weapon.element ||
        ((options.type || (s.characterClass === "mage" ? "magic" : "arrow")) === "arrow"
          ? s.characterClass === "necromancer"
            ? "bone"
            : "arrow"
          : s.characterClass === "necromancer"
            ? "bone"
            : "arcane"),
      burn: options.burn || stats.weapon.burn,
      poison: options.poison || stats.weapon.poison,
      stun: options.stun || stats.weapon.stun,
      crit: options.crit ?? critChance(s, stats.weapon),
      lifesteal: options.lifesteal ?? (stats.weapon.lifesteal || 0) + this.bonusLifesteal(),
      splash: options.splash ?? stats.weapon.splash,
      trail: 0,
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
      weapon = this.formWeapon(equippedWeapon(s));
    this.facing = angle;
    this.attackCooldown = stats.cooldown * this.attackSpeedMultiplier();
    this.attackAnimation = 0.22;
    this.combo = this.comboTimer > 0 ? (this.combo % 3) + 1 : 1;
    this.comboTimer = 1.25;
    const crit =
      (this.buffs.stealth > 0 && this.buffs.stealthCrit > 0) ||
      this.rng() < critChance(s, weapon);
    const damage =
      (crit ? CRIT_MULTIPLIER : 1) *
      elementMultiplier(this.climate, weapon.element) *
      stats.damage *
      (this.buffs.stealth > 0 ? 1.8 : 1) *
      (this.buffs.focus > 0 ? 1.25 : 1) *
      this.damageMultiplier() *
      (this.combo === 3 && weapon.kind === "melee" ? 1.35 : 1);
    this.buffs.stealth = 0;
    {
      const look = this.form ? (this.form.kind === "bear" ? "heavy" : this.form.kind === "raven" ? "bow" : "claw") : attackStyle(weapon.appearance || s.equippedWeapon);
      attackParticles(this, look, s.x, s.y, angle, weapon.kind === "melee" ? weapon.formRange || stats.range : 30, weapon.color, weapon.element);
      if (look === "heavy") this.shake = Math.max(this.shake, this.controls.screenShake ? 0.12 : 0);
    }
    if (weapon.kind === "melee") {
      this.effects.push({
        x: s.x,
        y: s.y,
        type: "slash",
        style: this.form ? (this.form.kind === "bear" ? "heavy" : this.form.kind === "wolf" ? "bite" : "claw") : attackStyle(weapon.appearance || s.equippedWeapon),
        radius: weapon.formRange || stats.range,
        life: 0.25,
        maxLife: 0.25,
        angle,
        color: weapon.color,
        arc: weapon.arc,
        crit,
        combo: this.combo,
        rarity: weapon.rarity,
      });
      for (const e of this.combatEnemies()) {
        const a = Math.atan2(e.y - s.y, e.x - s.x),
          difference = Math.atan2(Math.sin(a - angle), Math.cos(a - angle));
        if (
          Math.hypot(e.x - s.x, e.y - s.y) < (weapon.formRange || stats.range) + 12 &&
          Math.abs(difference) < (weapon.arc || 1.3) &&
          lineOfSight(this.world, s, e)
        ) {
          if (s.equippedWeapon)
            s.weaponPractice[weaponDiscipline(s)] =
              (s.weaponPractice[weaponDiscipline(s)] || 0) + 1;
          this.damageEnemy(e, damage, {
            crit,
            element: weapon.element,
            lifesteal: (weapon.lifesteal || 0) + this.bonusLifesteal(),
          });
          this.applyWeaponStatus(e, weapon);
          this.knockback(e, angle, this.combo === 3 || crit ? 12 : 5);
        }
      }
    } else if (weapon.formShot)
      for (const k of [-0.12, 0, 0.12]) this.shoot(angle + k, damage * 0.55, { type: "arrow", element: weapon.element, style: weapon.element || "wind", range: 250 });
    else this.shoot(angle, damage, { practice: weaponDiscipline(s) });
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
    if (effect === "corpseExplosion" && !this.nearbyCorpses(point.x, point.y, skill.range || 220).length) {
      this.onToast(tr("Рядом нет трупов для взрыва.", "There are no corpses nearby to detonate."));
      return false;
    }
    s.mana -= skill.cost;
    this.abilityCooldowns[skill.id] = skill.cooldown;
    this.syncSkillCooldowns();
    s.abilityUses[skill.id] = (s.abilityUses[skill.id] || 0) + 1;
    this.attackAnimation = 0.35;
    this.facing = angle;
    this.audio.effect("skill");
    if (effect !== "stealth") this.buffs.stealth = 0;
    this.emit(effect, s.x, s.y, color, 32);
    this.effects.push({
      x: s.x,
      y: s.y,
      type: "cast",
      style: element || (s.characterClass === "necromancer" ? "bone" : s.characterClass === "mage" ? "arcane" : "physical"),
      color,
      life: 0.5,
      maxLife: 0.5,
    });
    const damage = (n) =>
      stats.skillDamage *
      n *
      this.damageMultiplier() *
      skill.power *
      elementMultiplier(this.climate, element);
    // The look of a skill: its element, its own style, or the class's signature.
    const look =
      skill.style ||
      element ||
      { starwave: "arcane", whirlwind: "physical", smite: "light", divineStorm: "light", plagueNova: "poison", reap: "blood", shadowcut: "void", frostnova: "ice", flamewave: "fire" }[skill.id] ||
      { necromancer: "bone", paladin: "light", mage: "arcane", warrior: "physical", ranger: "wind" }[s.characterClass];
    const burst = (radius, mult, slow = 0, cone = false) => {
      this.effects.push({
        x: s.x,
        y: s.y,
        type: mult > 0 ? "nova" : "burst",
        style: mult > 0 ? look : element === "ice" ? "frostnova" : effect,
        radius,
        color,
        seed: Math.random() * 100,
        life: mult > 0 ? 0.8 : 0.5,
        maxLife: mult > 0 ? 0.8 : 0.5,
      });
      if (mult > 0 && radius >= 60) {
        this.addDecal(s.x, s.y, radius * 0.75, look);
        this.shake = Math.max(this.shake, this.controls.screenShake ? 0.18 : 0);
      }
      if (mult <= 0) return;
      for (const e of this.combatEnemies()) {
        const a = Math.atan2(e.y - s.y, e.x - s.x),
          diff = Math.atan2(Math.sin(a - angle), Math.cos(a - angle));
        if (
          Math.hypot(e.x - s.x, e.y - s.y) < radius + 12 &&
          (!cone || Math.abs(diff) < 0.38) &&
          lineOfSight(this.world, s, e)
        ) {
          this.damageEnemy(e, damage(mult), {
            element,
            lifesteal: skill.lifesteal,
          });
          if (slow) e.slow = Math.max(e.slow || 0, slow);
          if (skill.perk && !e.boss)
            e.stun = Math.max(e.stun || 0, effect === "frostnova" ? 1 : 0.6);
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
            pierce: (skill.pierce || 99) + (skill.perk ? 1 : 0),
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
    if (["fan", "volley"].includes(effect) && skill.perk && (skill.count || 3) === 1)
      this.shoot(angle + 0.08, damage(skill.multiplier || 1.55), {
        pierce: skill.pierce,
        range: 320,
        color,
        element,
      });
    if (effect === "bulwark") {
      this.buffs.bulwark = 6 + skill.rank - 1;
      if (skill.perk) this.buffs.reflect = this.buffs.bulwark;
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
        style: skill.pull ? "void" : element || (effect === "trap" ? "trap" : "arcane"),
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
      target.mark = 10 + (skill.rank - 1) * 3;
      target.markPower = (skill.perk ? 0.75 : 0.5) * skill.power;
      this.emit("mark", target.x, target.y, color, 16);
    }
    if (effect === "charge") {
      this.startDash(angle, 155 + (skill.rank - 1) * 20, 0.28, true);
      if (skill.perk) this.buffs.bulwark = Math.max(this.buffs.bulwark || 0, 2);
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
      if (skill.perk)
        this.zones.push({
          ...this.zones[this.zones.length - 1],
          life: 1.2,
        });
    }
    if (effect === "beam") this.castBeam(angle, skill, damage, look, element);
    if (effect === "berserk") this.startBerserk(skill);
    if (effect === "form") this.startForm(skill);
    if (effect === "flurry") this.startFlurry(skill, damage);
    if (effect === "bomb") this.castBomb(point, skill, damage, look === "poison" ? "poison" : "fire");
    if (effect === "cone") this.castCone(angle, skill, damage, look, element);
    if (effect === "frenzy") this.startFrenzy(skill);
    if (effect === "warcry") this.castWarCry(skill, damage);
    if (effect === "execute") this.castExecute(angle, skill, damage);
    if (effect === "telekinesis") this.castTelekinesis(point, skill, damage);
    if (effect === "levitate") this.castLevitate(skill, damage);
    if (effect === "corpseExplosion") this.castCorpseExplosion(point, skill, damage);
    if (effect === "army") this.castArmy(skill, damage);
    if (effect === "darkPact") this.castDarkPact(skill, damage);
    if (effect === "avatar") this.startAvatar(skill);
    if (effect === "divineShield") this.startDivineShield(skill);
    if (effect === "retribution") this.startRetribution(skill, damage);
    if (effect === "smokeBomb") this.castSmokeBomb(skill);
    if (effect === "pointBlank") this.castPointBlank(angle, skill, damage);
    if (effect === "callBeast") this.summonMinions(skill.minion || "wolf", skill.count || 1, skill.duration || 25, damage(skill.multiplier || 0.6), skill);
    if (effect === "rain") this.castRain(point, skill, damage, look, element);
    if (effect === "orbit") this.startOrbit(skill, damage, look);
    if (effect === "tornado") this.castTornado(angle, skill, damage, look);
    if (effect === "leap") this.castLeap(angle, point, skill, damage, look, element);
    if (effect === "summon")
      this.summonMinions(
        skill.minion || "skeleton",
        skill.count || 1,
        (skill.duration || 20) + (skill.armored ? 5 : 0),
        damage(skill.multiplier || 0.5) * (skill.armored ? 1.5 : 1),
        skill,
      );
    if (effect === "stealth") {
      // Ranked durations are already applied in rankConfig.
      this.buffs.stealth = skill.duration ?? 5 + skill.rank - 1;
      this.buffs.stealthCrit = skill.perk ? this.buffs.stealth : 0;
    }
    if (effect === "heal" && skill.perk) this.buffs.regen = 5;
    if (effect === "heal")
      s.hp = Math.min(
        stats.maxHp,
        s.hp + Math.round(stats.maxHp * 0.2 * skill.power),
      );
    if (effect === "focus") this.buffs.focus = 8 + skill.rank + (skill.perk ? 1 : 0);
    if (effect === "haste") this.buffs.haste = 8 + skill.rank + (skill.perk ? 1 : 0);
    if (effect === "blink") {
      this.blinkTeleport(angle, 160 + (skill.rank - 1) * 20);
      if (skill.perk) this.invincible = Math.max(this.invincible, 0.8);
    }
    if (effect === "restore" && skill.perk) this.potionCooldown = 0;
    if (effect === "restore")
      s.mana = Math.min(stats.maxMana, s.mana + 40 * skill.power);
    this.persist();
    this.onChange();
    return true;
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
  // Repaint terrain when the season turns; trees read the season every frame.
  syncSeason(announce = true) {
    const season = this.climate.season;
    if (season === this.season) return;
    const first = !this.season;
    this.season = season;
    setSeason(season);
    this.overworldTerrain?.chunks.clear();
    this.terrain?.chunks.clear();
    if (announce && !first)
      this.onToast(
        tr(
          `${season === "summer" ? "Наступило" : "Наступила"} ${seasonNames[season][0].toLowerCase()}.`,
          `${seasonNames[season][1]} has come.`,
        ),
      );
  }
  separation(e) {
    let x = 0,
      y = 0;
    for (const o of this.enemies) {
      if (o === e || o.hp <= 0 || o.boss) continue;
      const dx = e.x - o.x,
        dy = e.y - o.y,
        d = Math.hypot(dx, dy);
      if (d > 0.01 && d < 22) {
        x += (dx / d) * (1 - d / 22) * 1.4;
        y += (dy / d) * (1 - d / 22) * 1.4;
      }
    }
    return { x, y };
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
  // Each class dodges its own way: portals, graves, light, rolls or a shoulder charge.
  dodge() {
    if (this.paused || !this.save || this.dodgeCooldown > 0 || this.heroAnim) return;
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
    const s = this.save,
      cls = s.characterClass;
    if (cls === "mage") {
      dodgeBurst(this, "portal", s.x, s.y, angle);
      return this.blinkTeleport(angle, 115, "portal");
    }
    if (cls === "necromancer") {
      dodgeBurst(this, "grave", s.x, s.y, angle);
      return this.blinkTeleport(angle, 100, "grave");
    }
    if (cls === "shapeshifter") {
      // Bursts into a flock of crows and reforms a few steps away.
      dodgeBurst(this, "crows", s.x, s.y, angle);
      return this.blinkTeleport(angle, 110, "portal");
    }
    this.startDash(angle, cls === "ranger" ? 100 : cls === "monk" ? 110 : cls === "engineer" ? 120 : 85, cls === "engineer" ? 0.24 : 0.2);
    const style = { paladin: "holyDash", ranger: "roll", warrior: "chargeDust", summoner: "spiritWolf", monk: "chiStep", engineer: "rocket" }[cls] || "chargeDust";
    dodgeBurst(this, style, s.x, s.y, angle);
    this.dashStyle = style;
    this.effects.push({
      x: s.x,
      y: s.y,
      type: "dodge",
      style,
      angle,
      life: 0.45,
      maxLife: 0.45,
    });
    if (style === "holyDash") {
      this.buffs.bulwark = Math.max(this.buffs.bulwark || 0, 0.6);
      this.emit("phase", s.x, s.y, "#ffe08a", 14);
    } else if (style === "roll") this.emit("leaf", s.x, s.y, "#8fd06a", 12);
    else this.emit("trail", s.x, s.y, "#d8c9a0", 14);
  }
  blinkTeleport(angle, distance, style = "portal") {
    const s = this.save;
    let tx = s.x,
      ty = s.y;
    for (let d = 6; d <= distance; d += 6) {
      const x = s.x + Math.cos(angle) * d,
        y = s.y + Math.sin(angle) * d;
      if (!canWalk(this.world, x, y)) break;
      tx = x;
      ty = y;
    }
    this.path = [];
    this.pendingInteraction = null;
    this.facing = angle;
    this.invincible = Math.max(this.invincible, 0.5);
    const dur = style === "grave" ? 0.5 : 0.36;
    this.heroAnim = { style, t: 0, dur, to: { x: tx, y: ty }, moved: false };
    for (const [x, y, phase] of [
      [s.x, s.y, "out"],
      [tx, ty, "in"],
    ])
      this.effects.push({ x, y, type: "dodge", style, phase, life: dur + 0.25, maxLife: dur + 0.25 });
    this.emit(style === "grave" ? "trail" : "phase", s.x, s.y, style === "grave" ? "#7a6a4a" : "#c8a8ff", 14);
  }
  updateHeroAnim(dt) {
    const a = this.heroAnim;
    if (!a) return;
    a.t += dt;
    if (!a.moved && a.t >= a.dur / 2) {
      a.moved = true;
      this.save.x = a.to.x;
      this.save.y = a.to.y;
      this.emit(a.style === "grave" ? "summon" : "phase", a.to.x, a.to.y, a.style === "grave" ? "#9fe0a0" : "#c8a8ff", 16);
    }
    if (a.t >= a.dur) this.heroAnim = null;
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
  damageEnemy(e, amount, options = {}) {
    if (e.hp <= 0 || e.sleeping || e.burrowed > 0) return;
    if (e.boss && e.arena && !e.engaged) {
      const s = this.save,
        a = e.arena;
      if (s.x <= a.x || s.x >= a.x + a.w || s.y <= a.y || s.y >= a.y + a.h)
        return;
      updateBoss(this, e, 0);
    }
    // Elemental combos: steam, shatter and venom burst.
    let combo = null,
      comboMult = 1;
    if (options.element === "ice" && e.burn > 0) {
      combo = ["Пар!", "Steam!"];
      comboMult = 1.4;
      e.burn = 0;
    } else if (options.element === "lightning" && e.slow > 0) {
      combo = ["Раскол!", "Shatter!"];
      comboMult = 1.5;
    } else if (options.element === "fire" && e.poison > 0 && !options.chained) {
      combo = ["Взрыв яда!", "Venom burst!"];
      e.poison = 0;
      for (const o of this.combatEnemies())
        if (o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 70)
          this.damageEnemy(o, amount * 0.3, { element: "poison", chained: true });
      this.effects.push({ x: e.x, y: e.y - 8, type: "burst", style: "poison", radius: 70, color: "#b4e67e", life: 0.45, maxLife: 0.45 });
    }
    if (combo)
      this.particles.push({
        x: e.x,
        y: e.y - 56,
        text: combo[language === "ru" ? 0 : 1],
        color: "#8ff0ff",
        size: 12,
        life: 1.1,
        maxLife: 1.1,
      });
    const damage = Math.round(
      amount *
        comboMult *
        (e.mark > 0 ? 1 + (e.markPower || 0.5) : 1) *
        (e.ward ? 0.75 : 1) *
        (options.element === "light" && (e.shade || e.undead) ? 1.6 : 1) *
        (e.shield > 0 ? 0.5 : 1) *
        // Shells and plates soak damage until a war cry breaks them.
        (e.armor ? (e.armorBreak > 0 ? 1 : 1 - e.armor) : 1) *
        (e.armorBreak > 0 && !e.armor ? 1.15 : 1),
    );
    this.shake = this.controls.screenShake ? (options.crit ? 0.16 : 0.1) : 0;
    e.hp = Math.max(0, e.hp - damage);
    e.hitFlash = 0.12;
    if (damage > 0) hitBurst(this, e, this.save || e, options.crit, e.hp <= 0);
    this.particles.push({
      x: e.x + (this.rng() - 0.5) * 10,
      y: e.y - (e.boss ? 52 : 26),
      text: (options.crit ? "✦" : "−") + damage,
      color: options.crit ? "#ffd166" : "#ffe8b4",
      size: options.crit ? 13 : 10,
      life: options.crit ? 1 : 0.8,
      maxLife: options.crit ? 1 : 0.8,
    });
    if (options.lifesteal && this.save.hp > 0) {
      const heal = Math.max(1, Math.round(damage * options.lifesteal));
      this.save.hp = Math.min(this.stats.maxHp, this.save.hp + heal);
      this.emit("heal", this.save.x, this.save.y, "#e58b88", 3);
    }
    this.audio.effect(options.crit ? "crit" : "hit");
    const elementTint = elementColors[options.element]?.[1];
    this.emit(
      options.crit ? "crit" : "impact",
      e.x,
      e.y,
      options.crit ? "#ffd98a" : elementTint || e.color || "#ecc894",
      options.crit ? 14 : elementTint ? 10 : 6,
    );
    if (options.crit && !e.boss) this.hitStop = 0.05;
    if (e.hp <= 0) {
      this.defeated.add(e.id);
      this.recordCorpse(e);
      this.audio.effect("death");
      this.effects.push({
        x: e.x,
        y: e.y,
        type: "death",
        enemy: { ...e },
        life: e.boss ? 1.4 : 0.6,
        maxLife: e.boss ? 1.4 : 0.6,
      });

      if (e.boss) this.bossDrop(e);
      else if (!e.summoned) this.dropLoot(e);
      this.addXp(Math.round(e.xp * this.climate.xp));
      if (this.climate.night && !this.save.activeDungeon && !e.summoned)
        this.save.nightKills++;
      if (!this.save.activeDungeon && !e.boss && !e.summoned && !e.unique)
        this.save.respawns[e.id] =
          this.climate.elapsed +
          (150 + (e.tier || 0) * 20) * (this.climate.night ? 0.7 : 1);
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
        storyOf(this.save).fate.guardian ??= "slain";
        this.save.flags.bossDefeated = true;
        this.save.quest = 6;
        this.onVictory();
      }
      if (e.type === "herald") this.collectShard(e);
      if (e.type === "eclipse") this.defeatEclipse(e);
      this.persist();
      this.onChange();
    }
  }
  addXp(amount) {
    this.save.xp += Math.round(amount * (this.stats.race.xp || 1));
    while (this.save.xp >= this.xpNeeded && this.save.level < 50) {
      this.save.xp -= this.xpNeeded;
      this.save.level++;
      this.save.skillPoints++;
      this.save.hp = Math.min(
        this.stats.maxHp,
        this.save.hp + Math.round(this.stats.maxHp * 0.18),
      );
      this.save.mana = Math.min(this.stats.maxMana, this.save.mana + 20);
      this.effects.push({
        x: this.save.x,
        y: this.save.y,
        type: "levelup",
        life: 1.3,
        maxLife: 1.3,
      });
      this.emit("phase", this.save.x, this.save.y, "#ffe39a", 30);
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
      const chest = this.openChest(o);
      this.addXp(15 + chest.tier * 10);
      this.onToast(`${label(chest.name)}: ${chest.found.join(", ")}.`);
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
    if (element === "poison" && this.stats.race.poisonImmune) {
      this.buffs.poison = 0;
      return;
    }
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
    if (this.buffs.reflect > 0 && !environment) {
      const e = this.combatEnemies().find(
        (e) => Math.hypot(e.x - this.save.x, e.y - this.save.y) < 140,
      );
      if (e) this.damageEnemy(e, amount * 0.3);
    }
    if (this.buffs.bulwark > 0) amount *= 0.45;
    amount *= this.formArmor();
    amount = Math.round(
      amount *
        (environment ? 1 : this.climate.enemyDamage) *
        (this.stats.armor.resist === element ? 0.7 : 1),
    );
    this.shake = this.controls.screenShake ? 0.2 : 0;
    const dealt = Math.max(
      1,
      Math.round(amount - Math.min(amount * 0.5, this.stats.defense * 0.55)),
    );
    this.save.hp = Math.max(0, this.save.hp - dealt);
    this.invincible = 0.38;
    this.heroFlash = 0.15;
    this.audio.effect("hurt");
    this.particles.push({
      x: this.save.x,
      y: this.save.y - 24,
      text: "−" + dealt,
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
    this.decals = [];
    this.hazards = [];
    this.sparks = [];
    this.potionCooldown = 0;
    this.buffs = {};
    this.allies = [];
    this.heroAnim = null;
    this.eclipseDark = 0;
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
      e.burrowed = 0;
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
      this.save.interior ||
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
    this.decals = [];
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
    const engagedBoss = this.enemies.find((e) => e.boss && e.engaged && e.hp > 0);
    const darkTarget =
      engagedBoss?.type === "eclipse" && engagedBoss.phase >= 2 ? 0.3 : 0;
    this.eclipseDark =
      (this.eclipseDark || 0) +
      (darkTarget - (this.eclipseDark || 0)) * Math.min(1, dt * 1.5);
    this.audio.setMood?.(
      engagedBoss
        ? engagedBoss.type === "eclipse"
          ? "eclipse"
          : "boss"
        : s.activeDungeon
          ? "dungeon"
          : this.climate.night
            ? "night"
            : "day",
    );
    this.syncSeason();
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
    this.heroFlash = Math.max(0, (this.heroFlash || 0) - dt);
    this.updateOrbit(dt);
    this.updateLeap(dt);
    this.updateClassKit(dt);
    const race = this.stats.race;
    if (race.regen && s.hp > 0) s.hp = Math.min(this.stats.maxHp, s.hp + this.stats.maxHp * race.regen * dt);
    if (race.poisonImmune) this.buffs.poison = 0;
    if (this.buffs.regen > 0)
      s.hp = Math.min(this.stats.maxHp, s.hp + this.stats.maxHp * 0.03 * dt);
    // High-tier armor sheds a faint aura of sparks.
    const tier = armorTier[s.equippedArmor] || 0;
    if (tier >= 5) {
      this.auraTimer = (this.auraTimer || 0) - dt;
      if (this.auraTimer <= 0) {
        this.auraTimer = tier >= 7 ? 0.12 : 0.22;
        const a = this.rng() * Math.PI * 2;
        this.sparks.push({
          x: s.x + Math.cos(a) * 12,
          y: s.y - 12 + Math.sin(a) * 10,
          vx: 0,
          vy: -18,
          life: 0.7,
          maxLife: 0.7,
          color: { frost: "#c8f2ff", runic: "#a8ffd9", ember: "#ffb35c", storm: "#e0ccff" }[s.equippedArmor] || "#ffe08a",
          size: 2,
          type: "aura",
          glow: true,
        });
      }
    }
    if (this.moving && !this.dash) {
      this.dustTimer = (this.dustTimer || 0) - dt;
      if (this.dustTimer <= 0 && !s.activeDungeon) {
        this.dustTimer = 0.22;
        this.sparks.push({
          x: s.x + (this.rng() - 0.5) * 8,
          y: s.y + 2,
          vx: (this.rng() - 0.5) * 10,
          vy: -6,
          life: 0.4,
          maxLife: 0.4,
          color: this.climate.weather === "snow" ? "#eef3ea" : "#d8c9a0",
          size: 2,
          type: "dust",
        });
      }
    }
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
    this.updateHeroAnim(dt);
    const input = this.heroAnim ? { x: 0, y: 0 } : movement(this.keys);
    let dx = input.x,
      dy = input.y;
    if (!this.heroAnim && (this.joystick.x || this.joystick.y)) {
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
              (this.buffs.haste > 0 ? 1.3 : 1) *
              (this.buffs.berserk > 0 ? 1.15 : 1) *
              this.formSpeed()) * dt;
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
      if (this.dashStyle && !this.dash.charge) dodgeTrail(this, this.dashStyle, s.x, s.y, this.dash.angle, dt);
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
    // Walking up to a campfire unlocks it for fast travel.
    if (!s.activeDungeon && !s.interior) {
      this.campCheck = (this.campCheck || 0) - dt;
      if (this.campCheck <= 0) {
        this.campCheck = 0.5;
        const camp = landmarks.find(
          (o) => o.type === "camp" && !s.visitedCamps.includes(o.id) && Math.hypot(o.x - s.x, o.y - s.y) < 110,
        );
        if (camp) {
          s.visitedCamps.push(camp.id);
          this.onToast(
            tr(
              `Костёр открыт: ${camp.name[0]}. Теперь сюда можно переместиться с карты.`,
              `Campfire discovered: ${camp.name[1]}. You can now travel here from the map.`,
            ),
          );
          this.persist();
        }
      }
    }
    const reg = s.interior
      ? "house:" + s.interior.id
      : s.activeDungeon?.id || regionAt(s.x, s.y);
    if (reg !== this.currentRegion) {
      this.currentRegion = reg;
      if (!s.interior && !s.discovered.includes(reg)) {
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
      e.hitFlash = Math.max(0, (e.hitFlash || 0) - dt);
      e.lunge = Math.max(0, (e.lunge || 0) - dt);
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
      if (e.strike > 0) e.strike -= dt;
      const dist = Math.hypot(s.x - e.x, s.y - e.y);
      if (Math.abs(s.x - e.x) > 4) e.face = s.x < e.x ? -1 : 1;
      if (e.boss) {
        updateBoss(this, e, dt);
        continue;
      }
      if (biomeSpecial(this, e, dt, dist)) continue;
      if (this.enemySpecial(e, dt, dist)) continue;
      // Leash: monsters dragged too far from home walk back and recover.
      if (
        !e.returning &&
        dist > 150 &&
        Math.hypot(e.x - e.homeX, e.y - e.homeY) > 420
      ) {
        e.returning = true;
        e.alert = 0;
        e.windup = 0;
      }
      if (e.returning) {
        const d = Math.hypot(e.homeX - e.x, e.homeY - e.y);
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.25 * dt);
        if (d < 8) e.returning = false;
        else {
          const step = Math.min(d, e.speed * 1.6 * dt);
          e.x += ((e.homeX - e.x) / d) * step;
          e.y += ((e.homeY - e.y) / d) * step;
        }
        continue;
      }
      if (dist > 360 || e.stun > 0 || e.fear > 0 || e.levitate > 0) continue;
      if (this.buffs.stealth > 0) {
        e.windup = 0;
        e.alert = 0;
        continue;
      }
      e.alert = Math.max(0, (e.alert || 0) - dt);
      if (dist < this.climate.aggro && !e.alert && lineOfSight(this.world, e, s)) {
        // One monster spotting the hero alerts its pack.
        e.alert = 4;
        for (const o of this.enemies)
          if (o !== e && !o.boss && o.hp > 0 && !o.alert && Math.hypot(o.x - e.x, o.y - e.y) < 140) {
            o.alert = 3;
            this.emit("alert", o.x, o.y - 30, "#ffd166", 3);
          }
      } else if (dist < this.climate.aggro) e.alert = Math.max(e.alert, 1);
      e.cooldown = Math.max(0, e.cooldown - dt);
      const large = ["guardian", "titan"].includes(e.type) || e.large,
        ranged = ["sentinel", "wisp", "skeleton", "shaman"].includes(e.type) || e.rangedAttack,
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
              type: e.type === "wisp" || e.shotStyle === "poison" ? "magic" : "arrow",
              style: e.shotStyle,
              color: "#f0a787",
              element: e.element,
              hit: new Set(),
              pierce: 1,
            });
          } else {
            if (Math.hypot(s.x - e.x, s.y - e.y) < (large ? 96 : 30)) {
              this.hurt(e.damage, e.element);
              if (e.type === "spider" || e.element === "poison") this.buffs.poison = 4;
              if (e.rootOnHit) this.buffs.chilled = 1.4;
            }
            // A visible strike: the foe lunges and its blow sweeps the air in front of it.
            const strikeAngle = Math.atan2((e.aimY ?? s.y) - e.y, (e.aimX ?? s.x) - e.x);
            e.strike = 0.22;
            e.strikeAngle = strikeAngle;
            this.effects.push({
              x: e.x,
              y: e.y,
              type: "slash",
              style: enemyStrikeStyle(e, large),
              radius: large ? 96 : 40,
              life: 0.3,
              maxLife: 0.3,
              angle: strikeAngle,
              color: e.element === "poison" ? "#9ad04a" : e.element === "ice" ? "#9ad8ff" : "#ff7a5a",
              arc: large ? 1.4 : 0.9,
            });
            if (Math.hypot(s.x - e.x, s.y - e.y) < (large ? 96 : 30)) hitBurst(this, { type: "hero", x: s.x, y: s.y }, e, false, false);
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
        e.windupMax = e.windup;
        e.aimX = s.x;
        e.aimY = s.y;
      } else if ((dist < this.climate.aggro || e.alert > 0) && dist > (ranged ? 115 : 20)) {
        // Wolves and bandits leap at the hero from mid range.
        if (
          ["wolf", "bandit", "shade"].includes(e.type) &&
          dist < 120 &&
          dist > 45 &&
          !e.lungeCooldown
        ) {
          e.lunge = 0.28;
          e.lungeCooldown = 3.5;
          this.emit("trail", e.x, e.y, "#d9cfb4", 6);
        }
        e.lungeCooldown = Math.max(0, (e.lungeCooldown || 0) - dt);
        const speed =
            e.speed * (e.slow > 0 ? 0.32 : 1) * (e.lunge > 0 ? 3.2 : 1) * dt,
          sep = this.separation(e);
        let dx = (s.x - e.x) / dist + sep.x,
          dy = (s.y - e.y) / dist + sep.y;
        const length = Math.hypot(dx, dy) || 1;
        dx /= length;
        dy /= length;
        if (canWalk(this.world, e.x + dx * speed, e.y, 6)) e.x += dx * speed;
        if (canWalk(this.world, e.x, e.y + dy * speed, 6)) e.y += dy * speed;
      } else if (ranged && dist <= 80 && e.windup <= 0) {
        // Archers and casters step back to keep their distance.
        const speed = e.speed * 0.75 * (e.slow > 0 ? 0.32 : 1) * dt,
          dx = (e.x - s.x) / Math.max(1, dist),
          dy = (e.y - s.y) / Math.max(1, dist);
        if (canWalk(this.world, e.x + dx * speed, e.y, 6)) e.x += dx * speed;
        if (canWalk(this.world, e.x, e.y + dy * speed, 6)) e.y += dy * speed;
      } else if (dist >= this.climate.aggro && !e.alert) {
        // Idle: wander around the spawn point, pausing between strolls.
        e.idle = (e.idle ?? this.rng() * 2) - dt;
        if (!e.wander || e.idle <= 0) {
          const a = this.rng() * Math.PI * 2,
            r = 20 + this.rng() * 55;
          e.wander = { x: e.homeX + Math.cos(a) * r, y: e.homeY + Math.sin(a) * r };
          e.idle = 2 + this.rng() * 3;
        }
        const d = Math.hypot(e.wander.x - e.x, e.wander.y - e.y);
        if (d > 3) {
          const step = e.speed * 0.35 * dt,
            x = e.x + ((e.wander.x - e.x) / d) * step,
            y = e.y + ((e.wander.y - e.y) / d) * step;
          if (canWalk(this.world, x, y, 6)) {
            e.x = x;
            e.y = y;
            e.face = e.wander.x < e.x ? -1 : 1;
          } else e.wander = null;
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
      } else if (zone.type === "tornado") {
        this.updateTornado(zone, dt);
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
          type: zone.type === "charge" ? "burst" : "nova",
          style: zone.style || "earth",
          radius: zone.radius,
          color: zone.color,
          seed: Math.random() * 100,
          life: 0.8,
          maxLife: 0.8,
        });
        if (zone.type !== "charge" && zone.shape !== "arrow" && zone.style !== "wind") this.addDecal(zone.x, zone.y, zone.radius * 0.8, zone.style || "earth");
        this.shake = this.controls.screenShake ? 0.25 : 0;
      }
    }
    this.zones = this.zones.filter((z) => z.life > 0);
    for (const p of this.projectiles) {
      p.life -= dt;
      p.trail = (p.trail || 0) - dt;
      if (p.type === "magic" && p.trail <= 0) {
        p.trail = 0.035;
        this.sparks.push({
          x: p.x,
          y: p.y,
          vx: -p.vx * 0.05 + (this.rng() - 0.5) * 12,
          vy: -p.vy * 0.05 + (this.rng() - 0.5) * 12,
          life: 0.3,
          maxLife: 0.3,
          color: p.color || "#b3e8eb",
          size: 2,
          type: "trail",
          glow: true,
        });
      }
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
          const crit = this.rng() < (p.crit || 0);
          this.damageEnemy(e, p.damage * (crit ? CRIT_MULTIPLIER : 1), {
            crit,
            element: p.element,
            lifesteal: p.lifesteal,
          });
          this.applyWeaponStatus(e, p);
          if (p.splash) {
            for (const o of this.combatEnemies())
              if (
                o !== e &&
                Math.hypot(o.x - e.x, o.y - e.y) < p.splash &&
                !p.hit.has(o.id)
              )
                this.damageEnemy(o, p.damage * 0.45, { element: p.element });
            this.effects.push({
              x: e.x,
              y: e.y - 8,
              type: "burst",
              style: p.element === "light" ? "light" : "splash",
              radius: p.splash,
              color: p.color,
              life: 0.35,
              maxLife: 0.35,
            });
          }
          if (p.hit.size >= p.pierce) {
            p.life = 0;
            break;
          }
        }
    }
    this.projectiles = this.projectiles.filter((p) => p.life > 0);
    this.updateMinions(dt);
    if (!s.activeDungeon && !s.interior) {
      this.updateWorldBosses(dt);
      updateCritters(this.critters || [], dt, s, this.rng);
      this.storyTick();
      this.storyBattle(dt);
    }
    this.updateGroundLoot?.(dt);
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
    let dt = Math.min((now - this.last) / 1000, 0.04);
    this.last = now;
    // Brief hit-stop on critical strikes gives blows weight.
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      dt *= 0.15;
    }
    this.time += dt;
    this.update(dt);
    for (const p of this.particles) {
      if (!this.paused) {
        p.life -= dt;
        p.y -= dt * 24;
      }
    }
    for (const e of this.effects) if (!this.paused) e.life -= dt;
    if (!this.paused) updateVfx(this, dt);
    if (!this.paused && this.decals) {
      for (const d of this.decals) d.life -= dt;
      this.decals = this.decals.filter((d) => d.life > 0);
    }
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
    // Small rooms are centred instead of pinned to the top-left corner.
    const bounds = this.world.bounds;
    const vx = bounds && bounds.width * TILE < w ? Math.round((bounds.width * TILE - w) / 2) : cx,
      vy = bounds && bounds.height * TILE < h ? Math.round((bounds.height * TILE - h) / 2) : cy;
    if (vx !== cx || vy !== cy) {
      c.fillStyle = "#0e0b09";
      c.fillRect(0, 0, w, h);
    }
    return this.renderScene(c, vx, vy, w, h, dt, s);
  }
  renderScene(c, cx, cy, w, h, dt, s) {
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
      if (isFloor(o))
        o.type === "decor"
          ? drawDecor(c, o, this.time)
          : drawAdventureObject(c, o, this.time, this.world, this.collected);
    for (const hazard of this.hazards) drawHazard(c, hazard, this.time);
    for (const d of this.decals || []) drawDecal(c, d, this.time);
    for (const k of this.corpses || []) drawCorpse(c, k, this.time);
    for (const z of this.zones) z.type === "tornado" ? drawTornado(c, z, this.time) : drawZone(c, z, this.time);
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
          !isFloor(o) &&
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
    visible.push(...(this.allies || []).map((a) => ({ ...a, drawType: "ally" })));
    if (s && !s.activeDungeon && !s.interior)
      for (const a of this.critters || [])
        if (a.x > cx - 40 && a.x < cx + w + 40 && a.y > cy - 30 && a.y < cy + h + 40)
          visible.push({ ...a, ref: a, drawType: "critter" });
    for (const d of this.groundLoot || [])
      if (d.zone === this.zoneId) visible.push({ ...d, ref: d, drawType: "ground" });
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
        const heroFlash = this.heroFlash > 0 && c.filter !== undefined;
        if (heroFlash) c.filter = "sepia(1) saturate(4) hue-rotate(-30deg)";
        else if (this.buffs.berserk > 0 && c.filter !== undefined) c.filter = "saturate(1.8) brightness(1.08) sepia(0.35) hue-rotate(-25deg)";
        c.save();
        if (this.heroLift) c.translate(0, -this.heroLift);
        const anim = this.heroAnim;
        if (anim) {
          const half = anim.dur / 2,
            p = anim.t < half ? anim.t / half : 1 - (anim.t - half) / half;
          if (anim.style === "grave") {
            // Sink into the earth, then climb out at the destination.
            c.beginPath();
            c.rect(o.x - 40, o.y - 80, 80, 82);
            c.clip();
            c.translate(0, p * 38);
          } else {
            c.translate(o.x, o.y);
            c.scale(Math.max(0.05, 1 - p * 0.95), 1 + p * 0.4);
            c.translate(-o.x, -o.y);
            c.globalAlpha *= 1 - p * 0.7;
          }
        }
        if (this.form) drawFormBeast(c, o.x, o.y, this.form, this.facing ?? 0, this.time, this.moving, this.attackAnimation);
        else drawHero(c, o.x, o.y, o.characterClass, {
          ...o.appearance,
          race: s.race,
          player: true,
          equipment: s.equippedWearables,
          frame: this.moving ? this.time * 12 : 0,
          facing: this.facing ?? Math.PI / 2,
          swing: this.attackAnimation,
          weapon: s.equippedWeapon,
          armorLevel: s.armorLevel,
          armor: s.equippedArmor,
          time: this.time,
          moving: this.moving,
          wings: this.buffs.avatar > 0 ? "seraph" : null,
          scale: this.buffs.berserk > 0 ? 1.15 : 1,
        });
        c.restore();
        if (heroFlash || this.buffs.berserk > 0) c.filter = "none";
        if (this.buffs.divineShield > 0) {
          c.save();
          c.globalCompositeOperation = "lighter";
          c.globalAlpha = 0.35 + Math.sin(this.time * 8) * 0.1;
          const gr = c.createRadialGradient(o.x, o.y - 16, 6, o.x, o.y - 16, 30);
          gr.addColorStop(0, "#fff4c000");
          gr.addColorStop(0.8, "#ffe08a88");
          gr.addColorStop(1, "#ffe08a00");
          c.fillStyle = gr;
          c.beginPath();
          c.arc(o.x, o.y - 16, 30, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }
        c.globalAlpha = 1;
      } else if (o.drawType === "critter") {
        drawCritter(c, o.ref, this.time);
      } else if (o.type === "decor") {
        drawDecor(c, o, this.time);
      } else if (o.type === "ruinHouse") {
        drawRuinHouse(c, o, this.time);
      } else if (o.drawType === "ground") {
        drawGroundItem(c, o.ref, this.time);
      } else if (o.drawType === "ally") {
        drawMinion(c, o, this.time);
      } else if (o.drawType === "enemy") {
        if (o.elite || o.type === "herald") {
          // Elite aura under the feet.
          c.save();
          c.globalAlpha = 0.35 + Math.sin(this.time * 4) * 0.12;
          c.strokeStyle = o.type === "herald" ? "#b48cff" : "#f0c060";
          c.lineWidth = 2;
          c.beginPath();
          c.ellipse(o.x, o.y + 3, 17, 6, 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        }
        const flash = o.hitFlash > 0 && c.filter !== undefined;
        if (flash) c.filter = "brightness(2.4) saturate(0.4)";
        // Telegraph under the foe while it winds up an attack.
        if (o.windup > 0 && !o.boss) drawEnemyTelegraph(c, o, this.time);
        if (o.lift || o.strike > 0) {
          c.save();
          c.translate(o.strike > 0 ? Math.cos(o.strikeAngle) * 5 : 0, -(o.lift || 0));
        }
        // Sprites first; bosses fall through to their hand-drawn art.
        if (!drawBiomeEnemy(c, o, this.time) && !drawWorldBoss(c, o, this.time) && !drawAdvancedEnemy(c, o, this.time))
          drawEnemy(c, o, this.time);
        if (o.lift || o.strike > 0) c.restore();
        if (flash) c.filter = "none";
        if (!o.boss) {
          const ly = o.y - 48,
            danger =
              o.level > s.level + 1
                ? "#f08a6e"
                : o.level < s.level - 1
                  ? "#9fb7a4"
                  : "#e8d8a6";
          c.font = "bold 7px monospace";
          c.textAlign = "center";
          const text = (o.elite ? "★" : "") + o.level;
          c.fillStyle = "#101a17cc";
          c.fillRect(o.x - 21, ly - 6, 7 + text.length * 4, 8);
          c.fillStyle = danger;
          c.fillText(text, o.x - 17 + text.length * 2, ly);
        }
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
    if (this.orbit && s) drawOrbit(c, this.orbit, s, this.time);
    drawThrown(c, this.thrown, this.time);
    for (const p of this.projectiles) drawProjectile(c, p, this.time);
    for (const e of this.effects) {
      if (e.type === "death") {
        drawDeath(c, e, this.time, (ctx, m, t) => {
          if (!drawBiomeEnemy(ctx, m, t) && !drawWorldBoss(ctx, m, t) && !drawAdvancedEnemy(ctx, m, t))
            drawEnemy(ctx, m, t);
        });
        continue;
      }
      if (e.type === "levelup") {
        drawLevelUp(c, e, this.time);
        continue;
      }
      if (e.type === "slash") {
        drawSlash(c, e);
        continue;
      }
      if (e.type === "dodge") {
        drawDodge(c, e, this.time);
        continue;
      }
      if (e.type === "cast") {
        drawCast(c, e, this.time);
        continue;
      }
      if (e.type === "nova") {
        drawNova(c, e, this.time);
        continue;
      }
      if (e.type === "beam") {
        drawBeam(c, e, this.time);
        continue;
      }
      if (e.type === "bossCast") {
        drawBossCast(c, e, this.time);
        continue;
      }
      if (e.type === "breath") {
        drawBreath(c, e, this.time);
        continue;
      }
      if (e.type === "afterimage") {
        drawAfterimage(c, e);
        continue;
      }
      if (e.type === "spiritWolf") {
        drawSpiritWolf(c, e, this.time);
        continue;
      }
      if (e.type === "wingFlash") {
        drawWingFlash(c, e, this.time);
        continue;
      }
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
    drawVfx(c, this);
    for (const p of this.particles) {
      if (!this.controls.showDamage) continue;
      c.globalAlpha = Math.min(1, p.life * 2);
      const pop = p.size > 10 ? 1 + Math.max(0, p.life / p.maxLife - 0.75) * 2 : 1;
      c.font = `bold ${Math.round((p.size || 10) * pop)}px monospace`;
      c.textAlign = "center";
      c.fillStyle = "#23382f";
      c.fillText(p.text, p.x + 1, p.y + 1);
      c.fillStyle = p.color;
      c.fillText(p.text, p.x, p.y);
      c.globalAlpha = 1;
    }
    drawClimate(c, this, cx, cy, w, h);
    drawSparks(c, this);
    drawLootLabels(c, this);
    for (let i = 0; i < 12; i++) {
      const px = cx + ((i * 97 + this.time * 3) % w),
        py = cy + ((i * 59 + Math.sin(this.time * 0.8 + i) * 8) % h);
      c.globalAlpha = 0.25 + Math.sin(this.time * 2 + i) * 0.18;
      c.fillStyle = "#fff7c6";
      c.fillRect(px, py, 1, 1);
    }
    c.globalAlpha = 1;
    c.restore();
    if (s && this.controls.screenShake !== undefined) {
      const ratio = s.hp / this.stats.maxHp;
      drawVignette(c, w, h, ratio < 0.3 ? (0.3 - ratio) / 0.3 : 0, this.time);
    }
  }
}

installAdventure(Game);
installLife(Game);
installEclipse(Game);
installMinions(Game);
installLoot(Game);
installWorldBosses(Game);
installInteriors(Game);
installStory(Game);
installSkillMechanics(Game);
installClassKit(Game);

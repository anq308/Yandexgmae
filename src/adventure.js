import {
  enemySpawns,
  landmarks,
  canWalk,
  regionAt,
  TILE,
  WIDTH,
} from "./world.js";
import {
  dungeons,
  contracts,
  contractProgress,
  dungeonAccess,
  difficulties,
} from "./content.js";
import { createDungeon } from "./dungeons.js";
import { makeEnemy, addHazard, updateHazards } from "./battle.js";
import { climateAt } from "./climate.js";
import { emitFx, updateFx } from "./fx.js";
import { createTerrain } from "./art.js";
import {
  weapons,
  armors,
  payMaterials,
  canPayMaterials,
  weaponUpgradeCost,
  armorUpgradeCost, missingRequirements } from "./equipment.js";
import { tr, label } from "./i18n.js";
import { dawnWeapons } from "./eclipse.js";
import { worldBosses, RESPAWN } from "./worldbosses.js";
import { gearPool } from "./loot.js";
import { createInterior } from "./interiors.js";
export function installAdventure(Game) {
  Object.defineProperties(Game.prototype, {
    climate: {
      get() {
        return climateAt(
          this.save,
          this.currentRegion,
          this.save?.interior ? "interior" : this.save?.activeDungeon?.id,
        );
      },
    },
    zoneId: {
      get() {
        const d = this.save?.activeDungeon;
        if (this.save?.interior) return "house:" + this.save.interior.id;
        return d ? `${d.id}:${d.runId}:${d.floor}` : "world";
      },
    },
    activeLoot: {
      get() {
        return (this.save?.lootDrops || []).filter(
          (d) => d.zone === this.zoneId,
        );
      },
    },
  });
  Object.assign(Game.prototype, {
    emit(type, x, y, color, count) {
      emitFx(this, type, x, y, color, count);
    },
    loadZone() {
      const s = this.save;
      if (!this.overworld) {
        this.overworld = this.world;
        this.overworldTerrain = this.terrain;
      }
      if (s.interior) {
        // Indoors: a quiet furnished room without enemies or weather.
        this.world = createInterior(s.interior.id);
        this.terrain = createTerrain(this.world);
        this.enemies = [];
        this.sparks = [];
        this.hazards = [];
        this.potionCooldown = s.potionCooldown || 0;
        this.currentRegion = "house:" + s.interior.id;
        return;
      }
      const state = s.activeDungeon;
      this.world = state ? createDungeon(state) : this.overworld;
      this.terrain = state ? createTerrain(this.world) : this.overworldTerrain;
      const spawns = state ? this.world.spawns : enemySpawns;
      this.enemies = spawns
        .filter((e) => !this.defeated.has(e.id))
        .map((e) => {
          const m = makeEnemy(e, undefined, s.level);
          const diff = state && difficulties[state.difficulty || 0];
          if (diff && diff.hp > 1) {
            m.maxHp = m.hp = Math.round(m.maxHp * diff.hp);
            m.damage = Math.round(m.damage * diff.damage);
            m.level += diff.level;
            m.xp = Math.round(m.xp * (1 + diff.loot * 0.6));
            m.gold = Math.round(m.gold * (1 + diff.loot * 0.6));
            m.scaled = true;
          }
          if (state && Number.isFinite(state.enemyHp?.[e.id]))
            m.hp = Math.min(m.maxHp, state.enemyHp[e.id]);
          return m;
        });
      if (!state) {
        this.spawnQuestEnemies?.();
        this.spawnWorldBosses?.();
        this.worldBossTimer = 5;
      }
      if (state && this.enemies.every((e) => !e.guard || e.hp <= 0)) {
        this.world.openGate();
        this.terrain.chunks.clear();
        for (const e of this.enemies) e.sleeping = false;
      }
      this.sparks = [];
      this.hazards = [];
      this.potionCooldown = s.potionCooldown || 0;
      this.spawnSerial = 0;
      this.weatherStrike = 0;
      this.trapTimer = 5;
      this.clockMark = Math.floor(this.climate.elapsed / 12);
      this.currentRegion = state ? state.id : regionAt(s.x, s.y);
    },
    enterDungeon(id, difficulty = 0) {
      if (!dungeonAccess(this.save, id, difficulty)) {
        this.onToast(
          tr(
            "Недостаточный уровень или не собраны три печати глубин.",
            "Your level is too low or the three depth seals are missing.",
          ),
        );
        return false;
      }
      if (this.save.activeDungeon || this.inDanger()) return false;
      const portal = landmarks.find((o) => o.dungeon === id);
      if (
        !portal ||
        Math.hypot(portal.x - this.save.x, portal.y - this.save.y) > 65
      )
        return false;
      this.save.runSerial++;
      this.save.activeDungeon = {
        id,
        floor: 1,
        tier: Math.min(6, this.save.dungeonClears[id] || 0),
        runId: this.save.runSerial,
        returnPoint: { x: portal.x + 24, y: portal.y },
        enemyHp: {},
        difficulty,
      };
      this.loadZone();
      Object.assign(this.save, this.world.start);
      this.resetTransit();
      this.currentRegion = id;
      if (!this.save.discovered.includes(id)) this.save.discovered.push(id);
      this.persist();
      this.onChange();
      return true;
    },
    nextDungeonFloor() {
      const state = this.save.activeDungeon;
      if (!state) return false;
      if (this.enemies.some((e) => e.hp > 0 && !e.summoned)) {
        this.onToast(
          tr(
            "Сначала победите всех стражей этажа.",
            "Defeat every floor guardian first.",
          ),
        );
        return false;
      }
      if (state.floor === dungeons[state.id].floors) {
        this.leaveDungeon();
        return true;
      }
      const previous = this.zoneId;
      this.relocateLoot(previous, state.returnPoint);
      state.floor++;
      state.enemyHp = {};
      this.loadZone();
      Object.assign(this.save, this.world.start);
      this.resetTransit();
      this.persist();
      this.onChange();
      return true;
    },
    relocateLoot(prefix, point) {
      for (const drop of this.save.lootDrops)
        if (drop.zone.startsWith(prefix)) {
          drop.zone = "world";
          drop.x = point.x;
          drop.y = point.y + 24;
        }
    },
    leaveDungeon(force = false) {
      const state = this.save.activeDungeon;
      if (!state) return false;
      if (!force && this.enemies.some((e) => e.boss && e.engaged && e.hp > 0)) {
        this.onToast(
          tr(
            "Выход запечатан. Победите босса или отступите после поражения.",
            "The exit is sealed. Defeat the boss or retreat after death.",
          ),
        );
        return false;
      }
      this.relocateLoot(`${state.id}:${state.runId}:`, state.returnPoint);
      const point = state.returnPoint;
      this.defeated = new Set(
        [...this.defeated].filter((id) => !id.startsWith(state.id + ":")),
      );
      this.collected = new Set(
        [...this.collected].filter((id) => !id.startsWith(state.id + ":")),
      );
      this.save.activeDungeon = null;
      this.loadZone();
      Object.assign(this.save, point);
      this.resetTransit();
      this.persist();
      this.onChange();
      return true;
    },
    resetTransit() {
      this.cancelFishing?.();
      this.path = [];
      this.pendingInteraction = null;
      this.waypoint = null;
      this.projectiles = [];
      this.zones = [];
      this.hazards = [];
      this.sparks = [];
      this.dash = null;
      this.selectedTarget = null;
      this.buffs = {};
      this.allies = [];
      this.heroAnim = null;
      this.heldAttack = false;
      this.camera = { x: this.save.x, y: this.save.y };
      this.currentRegion = this.save.interior
        ? "house:" + this.save.interior.id
        : this.save.activeDungeon?.id || regionAt(this.save.x, this.save.y);
    },
    sealArena() {
      if (!this.save.activeDungeon) return;
      for (let x = 44; x <= 46; x++) {
        this.world.blocked[27 * WIDTH + x] = 1;
        this.world.tiles[27 * WIDTH + x] = 8;
      }
      this.terrain.chunks.clear();
    },
    openArena() {
      if (!this.save.activeDungeon) return;
      for (let x = 44; x <= 46; x++) {
        this.world.blocked[27 * WIDTH + x] = 0;
        this.world.tiles[27 * WIDTH + x] = 9;
      }
      this.terrain.chunks.clear();
    },
    inDanger() {
      return (
        this.combatEnemies().some(
          (e) => Math.hypot(e.x - this.save.x, e.y - this.save.y) < 220,
        ) ||
        this.projectiles.some(
          (p) =>
            p.enemy && Math.hypot(p.x - this.save.x, p.y - this.save.y) < 230,
        ) ||
        this.hazards.some(
          (h) => Math.hypot(h.x - this.save.x, h.y - this.save.y) < 260,
        )
      );
    },
    updateAdventure(dt) {
      this.potionCooldown = Math.max(0, this.potionCooldown - dt);
      updateFx(this, dt);
      updateHazards(this, dt);
      if (this.paused) return;
      const cl = this.climate,
        s = this.save;
      if (s.activeDungeon) {
        this.trapTimer -= dt;
        if (this.trapTimer <= 0) {
          this.trapTimer = 10;
          const d = dungeons[s.activeDungeon.id];
          for (const o of this.world.objects.filter(
            (o) =>
              o.type === "dungeonTrap" &&
              Math.hypot(o.x - s.x, o.y - s.y) < 280,
          ))
            addHazard(this, {
              x: o.x,
              y: o.y,
              radius: 47,
              delay: 1.25,
              damage: 16 + d.level,
              element:
                s.activeDungeon.id === "mine"
                  ? "ice"
                  : s.activeDungeon.id === "abyss"
                    ? "poison"
                    : "void",
              pool: s.activeDungeon.id === "abyss",
              color: d.color,
              owner: "trap",
            });
        }
        if (
          !this.world.gateOpen &&
          !this.enemies.some((e) => e.guard && e.hp > 0)
        ) {
          this.world.openGate();
          this.terrain.chunks.clear();
          for (const e of this.enemies) e.sleeping = false;
          this.onToast(
            tr(
              "Печать зала разрушена. Путь открыт.",
              "The hall seal is broken. The way is open.",
            ),
          );
        }
      } else if (!s.interior) {
        for (const [id, at] of Object.entries(s.respawns))
          if (cl.elapsed >= at) {
            const spawn = enemySpawns.find((e) => e.id === id);
            // Never respawn in sight of the hero or inside a settlement.
            if (
              spawn &&
              Math.hypot(spawn.x - s.x, spawn.y - s.y) > 260 &&
              !["village", "outpost", "harbor", "frontier"].includes(regionAt(spawn.x, spawn.y))
            ) {
              const old = this.enemies.find((e) => e.id === id),
                fresh = makeEnemy(spawn, undefined, s.level);
              if (old) Object.assign(old, fresh);
              else this.enemies.push(fresh);
              this.defeated.delete(id);
              delete s.respawns[id];
            }
          }
        const tick = Math.floor(cl.elapsed / 12);
        if (tick !== this.clockMark) {
          this.clockMark = tick;
          if (
            cl.weather === "storm" &&
            !["village", "outpost", "harbor", "frontier"].includes(
              this.currentRegion,
            )
          )
            addHazard(this, {
              shape: "lightning",
              x: s.x,
              y: s.y,
              radius: 40,
              delay: 1.25,
              damage: 32,
              element: "lightning",
              color: "#e0c7ff",
              owner: "weather",
            });
        }
      }
      if (this.buffs.poison > 0) {
        this.poisonTick = (this.poisonTick || 0) - dt;
        if (this.poisonTick <= 0) {
          this.poisonTick = 1.3;
          this.hurt(6, "poison", true);
          this.emit("poison", s.x, s.y, "#b2dc8d", 5);
        }
      }
    },
    bossDrop(e) {
      const state = this.save.activeDungeon,
        id = state?.id,
        contents = {
          gold: e.gold,
          items: {
            essence:
              id === "citadel" ? 8 : id === "abyss" ? 5 : id === "mine" ? 4 : 2,
            ore: 4,
            crystal: 2,
          },
        };
      if (id && e.type === dungeons[id].boss) {
        contents.weapon = dungeons[id].loot[this.save.characterClass];
        contents.armor = dungeons[id].armor;
        this.save.dungeonClears[id] = (this.save.dungeonClears[id] || 0) + 1;
        this.save.flags["seal-" + id] = true;
        this.openArena();
      } else if (e.worldBoss) {
        const def = worldBosses.find((b) => b.type === e.type),
          pool = gearPool(this.save, this.save.level + 4).filter(([k]) => k === "weapon");
        if (pool.length) contents.weapon = pool[Math.floor(this.rng() * pool.length)][1];
        contents.items.essence = 3 + Math.floor(def.baseLevel / 3);
        this.save.respawns[e.id] =
          this.save.playtime + this.save.restTime + RESPAWN;
        this.save.flags["wb-" + e.type] = true;
      } else if (e.type === "eclipse") {
        contents.weapon = dawnWeapons[this.save.characterClass];
        contents.items.essence = 12;
        contents.items.crystal = 6;
      } else {
        contents.weapon =
          e.type === "titan"
            ? { warrior: "scimitar", ranger: "repeater", mage: "moonstaff", paladin: "justiceHammer", necromancer: "harvestScythe" }[
                this.save.characterClass
              ]
            : { warrior: "axe", ranger: "longbow", mage: "earthstaff", paladin: "morningstar", necromancer: "cryptWand" }[
                this.save.characterClass
              ];
        contents.armor = e.type === "titan" ? "plate" : "chain";
      }
      contents.items[this.save.characterClass + "Scroll"] = 1;
      contents.wearable = e.worldBoss
        ? worldBosses.find((b) => b.type === e.type).trophy
        : e.type === "eclipse"
          ? "dawnCirclet"
          : id === "citadel"
          ? "runeHood"
          : id === "abyss"
            ? "ironGreaves"
            : id === "mine"
              ? "ironHelm"
              : "leatherBoots";
      for (const m of this.enemies) if (m.owner === e.id) m.hp = 0;
      const diff = difficulties[state?.difficulty || 0];
      if (diff.essence > 1) contents.items.essence = Math.round(contents.items.essence * diff.essence);
      this.bossFountain(e, (e.worldBoss ? 2 : e.type === "eclipse" ? 3 : 1) + diff.loot);
      this.hazards = this.hazards.filter((h) => h.owner !== e.id);
      this.projectiles = this.projectiles.filter((p) => !p.enemy);
      this.save.lootDrops.push({
        id: "loot-" + e.id,
        type: "loot",
        x: e.x,
        y: e.y,
        zone: this.zoneId,
        contents,
        name:
          e.type === "eclipse"
            ? ["Реликвии рассвета", "Relics of dawn"]
            : ["Трофеи босса", "Boss spoils"],
        color: e.color || "#e8d593",
      });
      this.emit("loot", e.x, e.y, "#f4d181", 65);
      this.onToast(
        tr(
          "Босс побеждён! Подберите светящуюся добычу.",
          "Boss defeated! Pick up the glowing spoils.",
        ),
      );
    },
    collectLoot(id) {
      const drop = this.activeLoot.find((d) => d.id === id);
      if (!drop || Math.hypot(drop.x - this.save.x, drop.y - this.save.y) > 65)
        return false;
      const c = drop.contents;
      this.save.gold += c.gold || 0;
      for (const [key, n] of Object.entries(c.items || {}))
        this.save.inventory[key] = (this.save.inventory[key] || 0) + n;
      for (const [key, list] of [
        ["weapon", "ownedWeapons"],
        ["armor", "ownedArmors"],
      ])
        if (c[key]) {
          if (!this.save[list].includes(c[key])) this.save[list].push(c[key]);
          else this.save.inventory.essence += 2;
        }
      if (c.wearable) {
        if (!this.save.ownedWearables.includes(c.wearable))
          this.save.ownedWearables.push(c.wearable);
        else this.save.inventory.essence += 2;
      }
      this.save.lootDrops = this.save.lootDrops.filter((d) => d.id !== id);
      this.emit("pickup", drop.x, drop.y, "#f3dc8b", 22);
      this.persist();
      this.onChange();
      return true;
    },
    lootChest(o) {
      if (this.collected.has(o.id)) return false;
      this.collected.add(o.id);
      this.save.gold += 30 + (this.save.activeDungeon?.floor || 1) * 10;
      this.save.inventory.ore += 2;
      this.save.inventory.fiber += 2;
      this.save.inventory.potion++;
      if (o.id.includes("chest14"))
        this.save.inventory[this.save.characterClass + "Scroll"]++;
      this.emit("loot", o.x, o.y, "#e9ce91", 22);
      this.persist();
      this.onChange();
      return true;
    },
    applyWeaponStatus(e, w) {
      if (w.slow) e.slow = Math.max(e.slow || 0, w.slow);
      if (w.stun && !e.boss) e.stun = Math.max(e.stun || 0, w.stun);
      if (w.burn) e.burn = w.burn;
      if (w.poison) e.poison = w.poison;
      e.dotDamage = Math.max(e.dotDamage || 0, this.stats.damage * 0.1);
    },
    equipArmor(id) {
      const a = armors[id];
      if (
        !a ||
        !this.save.ownedArmors.includes(id) ||
        this.save.level < (a.level || 1)
      )
        return false;
      this.save.equippedArmor = id;
      this.save.hp = Math.min(this.save.hp, this.stats.maxHp);
      this.save.mana = Math.min(this.save.mana, this.stats.maxMana);
      this.persist();
      this.onChange();
      return true;
    },
    acquireEquipment(kind, id, craft = false) {
      const catalog = kind === "armor" ? armors : weapons,
        item = catalog[id],
        list = kind === "armor" ? "ownedArmors" : "ownedWeapons";
      if (
        !item ||
        item.source ||
        this.save[list].includes(id) ||
        this.save.level < (item.level || 1) ||
        missingRequirements(this.save, item).length ||
        (kind === "weapon" && item.class !== this.save.characterClass)
      )
        return false;
      if (craft) {
        if (!item.recipe || !payMaterials(this.save, item.recipe)) return false;
      } else {
        // Gear without a price but with a recipe can only be forged.
        if ((kind === "armor" || item.recipe) && !item.price) return false;
        if (this.save.gold < (item.price || 45)) return false;
        this.save.gold -= item.price || 45;
      }
      this.save[list].push(id);
      if (kind === "armor") this.equipArmor(id);
      else this.equipWeapon(id);
      this.persist();
      this.onChange();
      return true;
    },
    upgradeEquipment(kind) {
      const s = this.save,
        key = kind === "weapon" ? "weaponLevel" : "armorLevel",
        cost = kind === "weapon" ? weaponUpgradeCost(s) : armorUpgradeCost(s);
      if (
        s[key] >= 6 ||
        s.level < 2 + s[key] * 2 ||
        (kind === "armor" && s.equippedArmor === "none") ||
        s.gold < cost.gold ||
        !canPayMaterials(s, { ore: cost.ore, essence: cost.essence })
      )
        return false;
      s.gold -= cost.gold;
      payMaterials(s, { ore: cost.ore, essence: cost.essence });
      s[key]++;
      this.persist();
      this.onChange();
      return true;
    },
    acceptContract(id) {
      const q = contracts.find((q) => q.id === id);
      if (!q || this.save.level < q.level || this.save.contracts[id])
        return false;
      this.save.contracts[id] = "active";
      this.persist();
      return true;
    },
    claimContract(id) {
      const q = contracts.find((q) => q.id === id),
        s = this.save;
      if (
        !q ||
        s.contracts[id] !== "active" ||
        contractProgress(s, q) < q.count
      )
        return false;
      if (q.kind === "item") s.inventory[q.target] -= q.count;
      s.contracts[id] = "done";
      s.gold += q.gold;
      s.skillPoints += q.points || 0;
      this.addXp(q.xp);
      this.persist();
      this.onChange();
      return true;
    },
    learnMastery(id) {
      const s = this.save;
      if (
        !["vitality", "focus", "precision"].includes(id) ||
        s.level < 5 ||
        s.skillPoints < 1 ||
        s.masteries[id] >= 8
      )
        return false;
      s.masteries[id]++;
      s.skillPoints--;
      this.persist();
      this.onChange();
      return true;
    },
    waitAtCamp(id, hour) {
      const camp = landmarks.find((o) => o.id === id && o.type === "camp");
      if (
        !camp ||
        this.save.activeDungeon ||
        Math.hypot(camp.x - this.save.x, camp.y - this.save.y) > 60 ||
        this.inDanger()
      )
        return false;
      const delta = (hour - this.climate.hour + 24) % 24;
      this.save.restTime += (Math.max(1, delta) * 900) / 24;
      this.rest(camp);
      this.persist();
      return true;
    },
  });
}

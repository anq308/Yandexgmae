import {
  abilityCatalog,
  rankLevel,
  weaponDiscipline,
  disciplines,
  barFor,
  skillsFor,
  abilityRank,
  migrateAbilities,
} from "./abilities.js";
import { wearables, recipes } from "./gear.js";
import { payMaterials, canPayMaterials, upgradeSkill } from "./equipment.js";
import { landmarks, TILE } from "./world.js";
import { makeEnemy } from "./battle.js";
import { tr } from "./i18n.js";
export const trainerIds = {
  warrior: "bladeMentor",
  ranger: "rangerMentor",
  mage: "mageMentor",
  paladin: "paladinMentor",
  necromancer: "necroMentor",
  summoner: "beastMentor",
  shapeshifter: "druidMentor",
  monk: "monkMentor",
  engineer: "engineerMentor",
};
export function acquisitionReason(g, id) {
  const s = g.save,
    a = abilityCatalog[id],
    rank = abilityRank(s, id);
  if (!a || a.class !== s.characterClass) return tr("Неизвестное умение", "Unknown ability");
  if (rank >= 3) return tr("Максимальный ранг", "Maximum rank");
  const required = rankLevel(a, rank + 1);
  if (s.level < required)
    return tr(`Нужен уровень ${required} · ваш ${s.level}`, `Requires level ${required} · yours ${s.level}`);
  if (s.skillPoints < 1)
    return tr("Нужно 1 очко навыка · получите уровень или прочтите манускрипт", "Requires 1 skill point · level up or read a manuscript");
  return "";
}
export const RESPEC_COST = 100;
export function installLife(Game) {
  Object.assign(Game.prototype, {
    acquisitionReason(id) {
      return acquisitionReason(this, id);
    },
    // Accepts an ability id (or a book index for older callers).
    learnSkill(ref) {
      const a = typeof ref === "string" ? abilityCatalog[ref] : skillsFor(this.save)[ref];
      if (!a) return false;
      const reason = acquisitionReason(this, a.id);
      if (reason) {
        this.onToast(reason);
        return false;
      }
      if (!upgradeSkill(this.save, a.id)) return false;
      this.audio.effect("level");
      this.onToast(
        abilityRank(this.save, a.id) === 1
          ? tr("Умение изучено. Назначьте его на панель в книге умений.", "Ability learned. Put it on your bar in the skill book.")
          : tr("Умение усилено.", "Ability upgraded."),
      );
      this.persist();
      this.onChange();
      return true;
    },
    readManuscript() {
      const key = this.save.characterClass + "Scroll";
      if (!this.save.inventory[key]) return false;
      this.save.inventory[key]--;
      this.save.skillPoints++;
      this.audio.effect("level");
      this.onToast(tr("Манускрипт прочитан: +1 очко навыка.", "Manuscript read: +1 skill point."));
      this.persist();
      this.onChange();
      return true;
    },
    // Mentors return every spent point for a fee.
    respecSkills() {
      const s = this.save,
        spent = Object.values(s.abilityRanks).reduce((n, r) => n + r, 0),
        o = landmarks.find((o) => o.id === trainerIds[s.characterClass]);
      if (!spent || s.gold < RESPEC_COST || s.activeDungeon || Math.hypot(s.x - o.x, s.y - o.y) > 90) return false;
      s.gold -= RESPEC_COST;
      s.skillPoints += spent;
      s.abilityRanks = {};
      this.abilityCooldowns = {};
      this.syncSkillCooldowns();
      this.persist();
      this.onChange();
      return true;
    },
    assignAbility(id, slot) {
      const valid = skillsFor(this.save).some((a) => a.id === id);
      if (!valid || !Number.isInteger(slot) || slot < 0 || slot > 4)
        return false;
      const bar = [...barFor(this.save)],
        other = bar.indexOf(id);
      if (other >= 0) [bar[slot], bar[other]] = [bar[other], bar[slot]];
      else bar[slot] = id;
      this.save.hotbars = { main: bar };
      this.syncSkillCooldowns();
      this.persist();
      this.onChange();
      return true;
    },
    syncSkillCooldowns() {
      this.skillCooldowns = barFor(this.save).map(
        (id) => this.abilityCooldowns[id] || 0,
      );
      this.skillCooldown = this.skillCooldowns[0];
    },
    equipWearable(id) {
      const a = wearables[id];
      if (
        !a ||
        !this.save.ownedWearables.includes(id) ||
        this.save.level < a.level ||
        (a.class && a.class !== this.save.characterClass)
      )
        return false;
      this.save.equippedWearables[a.slot] = id;
      this.save.hp = Math.min(this.save.hp, this.stats.maxHp);
      this.save.mana = Math.min(this.save.mana, this.stats.maxMana);
      this.persist();
      this.onChange();
      return true;
    },
    removeGear(slot) {
      if (slot === "mainhand") {
        this.save.equippedWeapon = null;
        this.syncSkillCooldowns();
      } else if (slot === "chest") this.equipArmor("none");
      else if (slot in this.save.equippedWearables)
        this.save.equippedWearables[slot] = null;
      else return false;
      this.save.hp = Math.min(this.save.hp, this.stats.maxHp);
      this.save.mana = Math.min(this.save.mana, this.stats.maxMana);
      this.persist();
      this.onChange();
      return true;
    },
    acquireWearable(id, craft = false) {
      const a = wearables[id],
        s = this.save;
      if (
        !a ||
        a.source ||
        s.ownedWearables.includes(id) ||
        s.level < a.level ||
        (a.class && a.class !== s.characterClass)
      )
        return false;
      if (craft) {
        if (!a.recipe || !payMaterials(s, a.recipe)) return false;
      } else {
        if (!a.price || s.gold < a.price) return false;
        s.gold -= a.price;
      }
      s.ownedWearables.push(id);
      this.equipWearable(id);
      this.persist();
      return true;
    },
    craftReason(id, count = 1) {
      const r = recipes.find((r) => r.id === id), s = this.save;
      if (!r || !Number.isInteger(count) || count < 1 || count > 99)
        return tr("Выберите рецепт", "Select a recipe");
      if (r.gear) {
        const a = wearables[r.gear];
        if (s.ownedWearables.includes(r.gear)) return tr("Эта вещь уже есть в рюкзаке или надета", "You already own this item");
        if (count !== 1 || s.level < a.level) return tr(`Нужен уровень ${a.level}`, `Requires level ${a.level}`);
      }
      const missing = Object.entries(r.inputs).filter(([k,n]) => (s.inventory[k] || 0) < n * count);
      if (missing.length) return tr("Не хватает материалов", "Missing ingredients");
      if (r.camp && (s.activeDungeon || this.inDanger() || !landmarks.some(o => o.type === "camp" && Math.hypot(o.x-s.x,o.y-s.y) < 65)))
        return tr("Нужен безопасный костёр · отмечен на карте", "Requires a safe campfire · marked on the map");
      return "";
    },
    craftSmall(id, count = 1) {
      const reason = this.craftReason(id, count);
      if (reason) { this.onToast(reason); return false; }
      const r = recipes.find(r => r.id === id);
      // Validate the entire batch before spending any material.
      if (!payMaterials(this.save, Object.fromEntries(Object.entries(r.inputs).map(([k,n]) => [k,n*count])))) return false;
      if (r.gear) {
        this.save.ownedWearables.push(r.gear);
        this.equipWearable(r.gear);
      } else for (const [k,n] of Object.entries(r.output)) this.save.inventory[k] += n * count;
      this.save.activities.recipes += count;
      this.onToast(tr("Создано: ", "Crafted: ") + tr(...r.name) + (count > 1 ? ` × ${count}` : "") + (r.gear ? tr(" · надето на героя", " · equipped") : ""));
      this.persist(); this.onChange(); return true;
    },
    eatFood(id) {
      if (
        this.potionCooldown > 0 ||
        !["berry", "cookedFish", "bandage"].includes(id) ||
        !this.save.inventory[id]
      )
        return false;
      const hp = id === "cookedFish" ? 40 : id === "bandage" ? 25 : 12;
      if (this.save.hp >= this.stats.maxHp && id !== "bandage" && !(id === "cookedFish" && this.save.mana < this.stats.maxMana)) return false;
      this.save.inventory[id]--;
      this.save.hp = Math.min(this.stats.maxHp, this.save.hp + hp);
      if (id === "cookedFish")
        this.save.mana = Math.min(this.stats.maxMana, this.save.mana + 15);
      if (id === "bandage") this.buffs.poison = 0;
      this.potionCooldown = 8;
      this.persist();
      this.onChange();
      return true;
    },
    harvestBerry(o) {
      if (
        this.save.activeDungeon ||
        this.climate.elapsed < (this.save.activities.harvests[o.id] || 0)
      )
        return false;
      this.save.inventory.berry += 2;
      this.save.activities.berries += 2;
      this.save.activities.harvests[o.id] = this.climate.elapsed + 120;
      this.emit("pickup", o.x, o.y, "#d89cae", 12);
      this.persist();
      this.onChange();
      return true;
    },
    startFishing(o) {
      if (
        this.save.activeDungeon ||
        this.inDanger() ||
        Math.hypot(o.x - this.save.x, o.y - this.save.y) > 60 ||
        !this.save.inventory.rod
      ) {
        this.onToast(
          tr(
            "Нужна удочка, берег рядом и безопасное место.",
            "Requires a rod, a nearby fishing spot and safety.",
          ),
        );
        return false;
      }
      const bait = !!this.save.inventory.bait;
      if (bait) this.save.inventory.bait--;
      this.path = [];
      this.keys.clear();
      this.fishing = {
        spot: o.id,
        phase: "waiting",
        age: 0,
        wait: 2 + ((this.save.activities.catches * 7 + o.x) % 30) / 10,
        bait,
        target: 0.35 + (this.save.activities.catches % 3) * 0.1,
        progress: 0,
      };
      this.persist();
      return true;
    },
    updateFishing(dt) {
      const f = this.fishing;
      if (!f) return;
      f.age += dt;
      if (f.phase === "waiting" && f.age >= f.wait) {
        f.phase = "bite";
        f.age = 0;
        f.cursor = 0;
        this.audio.effect("pickup");
      } else if (f.phase === "bite") {
        f.cursor = (Math.sin(f.age * 2.7 - Math.PI / 2) + 1) / 2;
        if (f.age > 6) {
          f.phase = "miss";
          this.onChange();
        }
      }
    },
    fishingTap() {
      const f = this.fishing;
      if (!f || f.phase !== "bite") return false;
      const width = f.bait ? 0.17 : 0.12;
      if (Math.abs(f.cursor - f.target) > width) {
        f.phase = "miss";
        this.onChange();
        return false;
      }
      const s = this.save;
      s.activities.catches++;
      const rare =
        (s.activities.catches + Math.floor(this.climate.hour)) % 7 === 0;
      const species = this.climate.night
        ? "moonfish"
        : this.climate.weather === "rain"
          ? "trout"
          : f.spot === "seaFishing"
            ? "mackerel"
            : "carp";
      if (!s.activities.fishSpecies.includes(species))
        s.activities.fishSpecies.push(species);
      s.inventory.rawFish += this.climate.weather === "rain" ? 2 : 1;
      if (rare) {
        s.inventory.pearl++;
        if (s.activities.catches % 2)
          s.inventory[s.characterClass + "Scroll"]++;
      }
      this.addXp(12);
      f.phase = "caught";
      f.species = species;
      f.rare = rare;
      this.emit("pickup", s.x, s.y, "#96d7dd", 24);
      this.persist();
      this.onChange();
      return true;
    },
    cancelFishing() {
      this.fishing = null;
      this.keys.clear();
    },
    syncEnemyLevels() {
      for (const e of this.enemies) {
        if (
          e.hp <= 0 ||
          e.engaged ||
          e.scaled ||
          Math.hypot(e.x - this.save.x, e.y - this.save.y) < 360
        )
          continue;
        const fresh = makeEnemy(e, undefined, this.save.level);
        if (fresh.level !== e.level) {
          const fraction = e.hp / e.maxHp;
          Object.assign(e, {
            level: fresh.level,
            maxHp: fresh.maxHp,
            hp: Math.round(fresh.maxHp * fraction),
            damage: fresh.damage,
            xp: fresh.xp,
            gold: fresh.gold,
          });
        }
      }
    },
  });
}

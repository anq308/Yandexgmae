import { weapons, armors, classWeapons } from "./equipment.js";
import { wearables } from "./gear.js";
import { items, label, tr } from "./i18n.js";
import { canWalk, regionAt, TILE } from "./world.js";
import { drawWeapon } from "./art.js";
import { raceOf } from "./races.js";
import { biomeMaterials } from "./bestiary.js";
// Diablo-style ground loot: enemies burst into gold, materials, potions and gear.
export const rarityColors = {
  common: "#efe6cf",
  rare: "#7fb2ff",
  epic: "#c48cff",
  legendary: "#ff9a3c",
  mythic: "#ff4a6a",
  gold: "#f2c14e",
};
const materialDrops = {
  slime: { fiber: 2 },
  spider: { fiber: 2 },
  wolf: { fiber: 1, leather: 1 },
  bat: { fiber: 1, leather: 1 },
  bandit: { fiber: 1, leather: 1 },
  golem: { fiber: 1, ore: 1 },
  sentinel: { fiber: 1, ore: 1 },
  skeleton: { fiber: 1, ore: 1 },
  shaman: { fiber: 1, crystal: 1 },
  wisp: { fiber: 1, crystal: 1 },
  ...biomeMaterials,
};
export function gearRarity(kind, id) {
  const item = kind === "weapon" ? weapons[id] : kind === "armor" ? armors[id] : wearables[id];
  if (!item) return "common";
  if (item.rarity) return item.rarity;
  if (kind === "armor") return item.level >= 7 ? "epic" : item.level >= 4 ? "rare" : "common";
  if (kind === "wear") return item.source ? "legendary" : item.level >= 10 ? "epic" : item.level >= 5 ? "rare" : "common";
  return "common";
}
// Unowned, non-trophy gear the hero could use soon; rarer items are less likely.
export function gearPool(save, maxLevel = save.level + 2) {
  const pool = [];
  for (const [id, w] of classWeapons(save.characterClass))
    if (!w.source && !w.requires && !save.ownedWeapons.includes(id) && (w.level || 1) <= maxLevel)
      pool.push(["weapon", id]);
  for (const [id, a] of Object.entries(armors))
    if (id !== "none" && !a.source && !a.requires && !save.ownedArmors.includes(id) && (a.level || 1) <= maxLevel)
      pool.push(["armor", id]);
  for (const [id, a] of Object.entries(wearables))
    if (!a.source && (!a.class || a.class === save.characterClass) && !save.ownedWearables.includes(id) && (a.level || 1) <= maxLevel)
      pool.push(["wear", id]);
  return pool;
}
export function rollGear(save, rng, maxLevel) {
  const pool = gearPool(save, maxLevel);
  if (!pool.length) return null;
  const weight = { common: 6, rare: 3, epic: 1.4, legendary: 0.5, mythic: 0 },
    total = pool.reduce((n, [k, id]) => n + weight[gearRarity(k, id)], 0);
  let pick = rng() * total;
  for (const entry of pool) {
    pick -= weight[gearRarity(...entry)];
    if (pick <= 0) return entry;
  }
  return pool[pool.length - 1];
}
export function lootName(d) {
  if (d.kind === "gold") return tr(`${d.n} золота`, `${d.n} gold`);
  if (d.kind === "item") return label(items[d.key] || [d.key, d.key]) + (d.n > 1 ? ` ×${d.n}` : "");
  const item = d.kind === "weapon" ? weapons[d.key] : d.kind === "armor" ? armors[d.key] : wearables[d.key];
  return label(item.name);
}
// Each land hides its own materials in chests.
const chestMaterials = {
  village: ["herb", "fiber", "wood"],
  meadow: ["herb", "fiber", "wood"],
  forest: ["herb", "wood", "fiber"],
  lake: ["fiber", "bait", "herb"],
  outpost: ["ore", "wood", "leather"],
  mountain: ["ore", "crystal"],
  ruins: ["ore", "crystal", "essence"],
  amberwood: ["wood", "leather", "herb"],
  marsh: ["herb", "leather", "essence"],
  harbor: ["pearl", "fiber", "bait"],
  coast: ["pearl", "fiber", "wood"],
  island: ["pearl", "crystal"],
  tundra: ["crystal", "ore", "leather"],
  highlands: ["ore", "leather", "crystal"],
  deadwood: ["essence", "wood", "leather"],
  badlands: ["ore", "essence", "leather"],
  frontier: ["leather", "ore", "fiber"],
};
const chestKinds = [
  ["Тайник контрабандиста", "Smuggler's stash"],
  ["Сундук павшего искателя", "Fallen seeker's chest"],
  ["Забытый сундук", "Forgotten chest"],
  ["Схрон охотника", "Hunter's cache"],
  ["Окованный ларец", "Iron-bound coffer"],
];
export function installLoot(Game) {
  Object.assign(Game.prototype, {
    spawnLoot(x, y, kind, key, n = 1, spread = 1) {
      this.groundLoot ??= [];
      const a = this.rng() * Math.PI * 2,
        dist = (16 + this.rng() * 26) * spread;
      let tx = x + Math.cos(a) * dist,
        ty = y + Math.sin(a) * dist * 0.7;
      if (!canWalk(this.world, tx, ty, 4)) {
        tx = x;
        ty = y;
      }
      const rarity = kind === "gold" ? "gold" : kind === "item" ? (key === "essence" ? "epic" : "common") : gearRarity(kind, key);
      this.groundLoot.push({
        id: "drop" + ++this.spawnSerial,
        kind,
        key,
        n,
        rarity,
        x: tx,
        y: ty,
        fromX: x,
        fromY: y,
        age: 0,
        zone: this.zoneId,
      });
    },
    // Chests spill their contents onto the ground. Farther and more dangerous lands hold richer chests.
    openChest(o) {
      const s = this.save,
        tx = o.x / TILE,
        ty = o.y / TILE,
        tier = Math.min(5, Math.floor(Math.hypot(tx - 24, ty - 62) / 32)),
        region = regionAt(o.x, o.y),
        mats = chestMaterials[region] || chestMaterials.meadow,
        found = [];
      const gold = Math.round((18 + tier * 26 + s.level * 5) * (0.6 + this.rng() * 0.9));
      for (let i = 0; i < 3; i++) this.spawnLoot(o.x, o.y, "gold", null, Math.max(1, Math.round(gold / 3)), 1.6);
      found.push(tr(`${gold} монет`, `${gold} coins`));
      const kinds = 1 + Math.floor(this.rng() * 2) + (tier >= 3 ? 1 : 0);
      for (let i = 0; i < kinds; i++) {
        const key = mats[Math.floor(this.rng() * mats.length)],
          n = key === "essence" || key === "pearl" ? 1 : 1 + Math.floor(this.rng() * (2 + tier));
        this.spawnLoot(o.x, o.y, "item", key, n, 1.4);
        found.push(label(items[key] || [key, key]) + (n > 1 ? " ×" + n : ""));
      }
      const roll = this.rng();
      if (roll < 0.45) {
        const potion = roll < 0.3 ? "potion" : "manaPotion";
        this.spawnLoot(o.x, o.y, "item", potion, 1 + (tier >= 2 ? 1 : 0), 1.2);
        found.push(label(items[potion]));
      }
      if (this.rng() < 0.1 + tier * 0.03) {
        this.spawnLoot(o.x, o.y, "item", s.characterClass + "Scroll", 1, 1.2);
        found.push(tr("свиток умений", "skill scroll"));
      }
      if (this.rng() < 0.22 + tier * 0.09) {
        const gear = rollGear(s, this.rng, s.level + 1 + tier);
        if (gear) {
          this.spawnLoot(o.x, o.y, gear[0], gear[1], 1, 1.8);
          found.push(lootName({ kind: gear[0], key: gear[1] }));
        }
      }
      this.emit("loot", o.x, o.y - 10, tier >= 3 ? "#c48cff" : "#f2c14e", 18 + tier * 4);
      return { name: chestKinds[Math.floor(this.rng() * chestKinds.length)], found, tier };
    },
    dropLoot(e) {
      const s = this.save,
        night = this.climate.night ? 1.15 : 1;
      this.spawnLoot(e.x, e.y, "gold", null, Math.max(1, Math.round(e.gold * (0.8 + this.rng() * 0.4) * night * this.climate.gold * 0.75)));
      for (const [key, n] of Object.entries(materialDrops[e.type] || { fiber: 1 }))
        this.spawnLoot(e.x, e.y, "item", key, n);
      if (this.rng() < (e.elite ? 0.3 : 0.06)) this.spawnLoot(e.x, e.y, "item", "potion", 1);
      else if (this.rng() < 0.04) this.spawnLoot(e.x, e.y, "item", "manaPotion", 1);
      if (e.elite || (e.tier >= 3 && this.rng() < 0.12)) this.spawnLoot(e.x, e.y, "item", "essence", 1);
      if (this.rng() < 0.015) this.spawnLoot(e.x, e.y, "item", s.characterClass + "Scroll", 1);
      const gearChance = (e.elite ? 0.14 : 0.018) + (e.tier || 0) * 0.006;
      if (this.rng() < gearChance) {
        const gear = rollGear(s, this.rng);
        if (gear) this.spawnLoot(e.x, e.y, gear[0], gear[1], 1, 1.4);
      }
    },
    // A boss bursts into a fountain of coins and potions around its trophy bag.
    bossFountain(e, extraGear = 0) {
      for (let i = 0; i < 6; i++)
        this.spawnLoot(e.x, e.y, "gold", null, Math.round(e.gold / 8), 2.4);
      for (let i = 0; i < 2; i++) this.spawnLoot(e.x, e.y, "item", "potion", 1, 2);
      this.spawnLoot(e.x, e.y, "item", "manaPotion", 1, 2);
      for (let i = 0; i < extraGear; i++) {
        const gear = rollGear(this.save, this.rng, this.save.level + 4);
        if (gear && !this.groundLoot.some((d) => d.key === gear[1])) this.spawnLoot(e.x, e.y, gear[0], gear[1], 1, 2.6);
      }
    },
    pickUpLoot(d) {
      const s = this.save;
      if (d.kind === "gold") s.gold += Math.round(d.n * (raceOf(s).gold || 1));
      else if (d.kind === "item") s.inventory[d.key] = (s.inventory[d.key] || 0) + d.n;
      else {
        const list = d.kind === "weapon" ? "ownedWeapons" : d.kind === "armor" ? "ownedArmors" : "ownedWearables";
        if (s[list].includes(d.key)) s.inventory.essence += 1;
        else s[list].push(d.key);
        this.onToast(tr(`Найдено: ${lootName(d)}. Откройте рюкзак.`, `Found: ${lootName(d)}. Open your backpack.`));
      }
      this.particles.push({
        x: d.x,
        y: d.y - 20,
        text: "+" + lootName(d),
        color: rarityColors[d.rarity],
        size: d.kind === "gold" || d.kind === "item" ? 9 : 12,
        life: 1.2,
        maxLife: 1.2,
      });
      this.emit("pickup", d.x, d.y, rarityColors[d.rarity], d.kind === "gold" ? 6 : 12);
      this.audio.effect(d.kind === "gold" ? "coin" : "pickup");
    },
    updateGroundLoot(dt) {
      if (!this.groundLoot?.length) return;
      const s = this.save;
      let picked = false;
      for (const d of this.groundLoot) {
        if (d.zone !== this.zoneId) continue;
        d.age += dt;
        const dist = Math.hypot(d.x - s.x, d.y - s.y);
        // Coins drift toward the hero; everything is collected by walking over it.
        if (d.kind === "gold" && d.age > 0.5 && dist < 70) {
          d.x += ((s.x - d.x) / dist) * 160 * dt;
          d.y += ((s.y - d.y) / dist) * 160 * dt;
        }
        if (d.age > 0.45 && dist < 24) {
          this.pickUpLoot(d);
          d.taken = true;
          picked = true;
        }
        const ttl = d.kind === "gold" || d.kind === "item" ? 240 : 900;
        if (d.age > ttl) d.taken = true;
      }
      this.groundLoot = this.groundLoot.filter((d) => !d.taken);
      if (picked) {
        this.persist();
        this.onChange();
      }
    },
  });
}
// Ground sprites: drawn in the depth-sorted pass so heroes walk in front of loot.
export function drawGroundItem(c, d, time) {
  const t = Math.min(1, d.age / 0.45),
    x = d.fromX + (d.x - d.fromX) * t,
    y = d.fromY + (d.y - d.fromY) * t,
    hop = Math.sin(t * Math.PI) * 26 + (t >= 1 ? Math.abs(Math.sin(d.age * 3)) * 1.5 : 0),
    color = rarityColors[d.rarity];
  c.save();
  if ((d.kind !== "gold" && d.kind !== "item") || d.key === "essence") {
    // Light pillar marks gear and essences from afar.
    const g = c.createLinearGradient(x, y - 90, x, y);
    g.addColorStop(0, color + "00");
    g.addColorStop(1, color + "88");
    c.globalAlpha = 0.55 + Math.sin(time * 3 + d.x) * 0.15;
    c.fillStyle = g;
    c.fillRect(x - 3, y - 90, 6, 90);
    c.globalAlpha = 1;
  }
  c.fillStyle = "#00000055";
  c.beginPath();
  c.ellipse(x, y + 2, 7, 3, 0, 0, Math.PI * 2);
  c.fill();
  c.translate(Math.round(x), Math.round(y - hop));
  const r = (px, py, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(px, py, w, h);
  };
  if (d.kind === "gold") {
    const n = Math.min(4, 1 + Math.floor(d.n / 15));
    for (let i = 0; i < n; i++) {
      r(-4 + i * 2, -3 - i * 2, 6, 3, "#7a4e10");
      r(-4 + i * 2, -4 - i * 2, 6, 2, "#f2c14e");
      r(-3 + i * 2, -4 - i * 2, 2, 1, "#fff09a");
    }
  } else if (d.kind === "item") {
    if (d.key.toLowerCase().includes("potion")) {
      const liquid = d.key === "potion" ? "#e0483a" : "#4f94e8";
      r(-1, -10, 3, 2, "#9a6234");
      r(-3, -8, 7, 7, "#1b120c");
      r(-2, -7, 5, 5, liquid);
      r(-2, -7, 1, 2, "#ffffffaa");
    } else if (d.key === "essence") {
      r(-2, -10, 4, 2, "#dcc2ff");
      r(-3, -8, 6, 6, "#a070e0");
      r(-2, -7, 2, 2, "#f4e8ff");
    } else if (d.key.endsWith("Scroll")) {
      r(-5, -8, 10, 6, "#e8d8a8");
      r(-5, -8, 10, 1, "#9a6234");
      r(-5, -3, 10, 1, "#9a6234");
      r(-1, -6, 2, 2, "#e0483a");
    } else {
      const col = { fiber: "#b4e67e", leather: "#b07a48", ore: "#9aa0a8", crystal: "#a8ecff", wood: "#9a6234" }[d.key] || "#d6a066";
      r(-4, -6, 8, 5, "#1b120c");
      r(-3, -5, 6, 3, col);
      r(-3, -5, 2, 1, "#ffffff88");
    }
  } else if (d.kind === "weapon") {
    c.rotate(-0.9);
    c.scale(0.8, 0.8);
    c.translate(-9, 14);
    drawWeapon(c, d.key, 0);
  } else if (d.kind === "armor") {
    const col = armors[d.key]?.color || "#a8b5b8";
    r(-6, -12, 12, 11, "#1b120c");
    r(-5, -11, 10, 9, col);
    r(-8, -12, 4, 4, col);
    r(4, -12, 4, 4, col);
    r(-1, -11, 2, 9, "#ffffff55");
  } else {
    const w = wearables[d.key],
      col = w?.color || "#c9a25a";
    r(-5, -9, 10, 7, "#1b120c");
    r(-4, -8, 8, 5, col);
    r(-4, -8, 8, 1, "#ffffff66");
  }
  c.restore();
}
// Names float above loot like in classic action RPGs; gear is always labelled.
export function drawLootLabels(c, g) {
  const s = g.save;
  if (!s || !g.groundLoot?.length) return;
  c.save();
  c.font = "10px Tiny5, monospace";
  c.textAlign = "center";
  c.textBaseline = "middle";
  const shown = [];
  for (const d of g.groundLoot) {
    if (d.zone !== g.zoneId || d.age < 0.45) continue;
    const gear = d.kind !== "gold" && d.kind !== "item";
    if (!gear && Math.hypot(d.x - s.x, d.y - s.y) > 130) continue;
    const text = lootName(d),
      w = c.measureText(text).width + 8;
    let y = d.y - 22;
    // Stack labels that would overlap.
    while (shown.some((o) => Math.abs(o.x - d.x) < (o.w + w) / 2 && Math.abs(o.y - y) < 11)) y -= 11;
    shown.push({ x: d.x, y, w });
    c.fillStyle = "#0b0806d0";
    c.fillRect(Math.round(d.x - w / 2), Math.round(y - 6), Math.round(w), 12);
    c.fillStyle = rarityColors[d.rarity];
    c.fillText(text, Math.round(d.x), Math.round(y));
  }
  c.restore();
}

import { WIDTH, HEIGHT, TILE, point, canWalk } from "./world.js";
import { weapons, armors } from "./equipment.js";
import { wearables } from "./gear.js";
import { tr, label } from "./i18n.js";
import { ruins } from "./settlements.js";
import { rollGear } from "./loot.js";
// Enterable houses: taverns, shops, the forge and ordinary homes with residents.
const keeper = (name, role, style) => ({ name, role, style });
export const interiorDefs = {
  shop: { kind: "shop", name: ["Лавка «Пыльная полка»", "The Dusty Shelf"], keeper: keeper(["Торговец Ганс", "Hans the Trader"], ["Покупает и продаёт", "Buys and sells"], "elder") },
  home2: { kind: "tavern", name: ["Таверна «Лиственный кубок»", "The Leafcup Tavern"], keeper: keeper(["Трактирщица Грета", "Greta the Innkeeper"], ["Еда, ночлег и слухи", "Food, rooms and rumours"], "herbalist") },
  forge: { kind: "forge", name: ["Кузница Брама", "Bram's Forge"], keeper: keeper(["Подмастерье Тим", "Tim the Apprentice"], ["Кузнечные заказы", "Smithing orders"], "smith") },
  hill1: { kind: "tavern", name: ["Приют «Высокий Ключ»", "Highspring Lodge"], keeper: keeper(["Хозяин Борис", "Boris the Host"], ["Еда, ночлег и слухи", "Food, rooms and rumours"], "elder") },
  harbor1: { kind: "tavern", name: ["Таверна «Солёный якорь»", "The Salty Anchor"], keeper: keeper(["Трактирщик Ульф", "Ulf the Barkeep"], ["Еда, ночлег и слухи", "Food, rooms and rumours"], "smith") },
  harbor2: { kind: "shop", name: ["Рынок пристани", "Riverport Market"], keeper: keeper(["Купчиха Марта", "Martha the Merchant"], ["Покупает и продаёт", "Buys and sells"], "herbalist") },
  frontier1: { kind: "shop", name: ["Лавка пограничья", "Frontier Store"], keeper: keeper(["Скупщик Орен", "Oren the Fence"], ["Покупает и продаёт", "Buys and sells"], "ranger") },
};
const homeLines = [
  ["Ночью в лесу бродят восставшие. Без факела не ходите.", "Revenants roam the woods at night. Don't go without a torch."],
  ["Мой дед говорил, что под горами спят ледяные големы.", "My grandfather said frost golems sleep beneath the mountains."],
  ["Осенью торговцы платят за всё щедрее — золото само течёт в руки.", "In autumn coins flow freely — enemies drop more gold."],
  ["Видели старую ведьму на болотах? Говорят, у неё капюшон, что копит силы.", "Seen the old witch in the marshes? They say her hood stores power."],
  ["Если устали — таверна недалеко. Комната на ночь стоит недорого.", "Tired? The tavern is close by. A room for the night is cheap."],
  ["Зимой озёра замерзают, а лёд становится сильнее. Маги радуются.", "In winter lakes freeze and ice grows stronger. Mages rejoice."],
];
for (const id of ["home1", "home3", "home4", "hill2", "hill3", "harbor3", "frontier2", "frontier3", "islandHome", "seaside"])
  interiorDefs[id] = {
    kind: "home",
    name: ["Дом жителя", "A villager's home"],
    keeper: keeper(["Житель", "Villager"], ["Хозяин дома", "Homeowner"], ["elder", "herbalist", "smith", "ranger"][id.length % 4]),
    line: homeLines[id.length % homeLines.length],
  };
for (const r of ruins)
  interiorDefs[r.id] = {
    kind: "ruin",
    name: r.name,
    keeper: null,
  };
export const sellPrices = { fiber: 2, leather: 4, wood: 3, ore: 5, crystal: 8, herb: 3, essence: 25, pearl: 30, rawFish: 4, berry: 1 };
export const buyPrices = { fiber: 5, leather: 9, wood: 6, ore: 12, crystal: 18, bait: 4, rod: 25, bandage: 10, potion: 22, manaPotion: 26 };
export const tavernMenu = { cookedFish: 12, berry: 2, potion: 24 };
export const ROOM_PRICE = 20;
export const gearSellPrice = (kind, id) => {
  const item = kind === "weapon" ? weapons[id] : kind === "armor" ? armors[id] : wearables[id];
  return Math.max(10, Math.round((item.price || (item.level || 1) * 60) / 3));
};
// Small furnished room, built in the same tile format as dungeons.
export function createInterior(houseId) {
  const def = interiorDefs[houseId],
    tiles = new Uint8Array(WIDTH * HEIGHT).fill(8),
    blocked = new Uint8Array(WIDTH * HEIGHT).fill(1),
    objects = [];
  // A cosy 12×8 room: the back wall carries windows, shelves and the hearth.
  for (let y = 4; y <= 11; y++)
    for (let x = 5; x <= 16; x++) {
      tiles[y * WIDTH + x] = 9;
      blocked[y * WIDTH + x] = 0;
    }
  tiles[12 * WIDTH + 10] = 9;
  tiles[12 * WIDTH + 11] = 9;
  const prefix = "house:" + houseId + ":",
    put = (kind, x, y, solid = true, extra = {}) => {
      objects.push({ id: prefix + kind + x + "," + y, type: "furniture", kind, ...point(x, y), ...extra });
      if (solid) blocked[Math.floor(y) * WIDTH + Math.floor(x)] = 1;
    },
    wall = (kind, x) => put(kind, x, 3.98, false, { wall: true });
  if (def.kind === "tavern") {
    wall("window", 13);
    wall("kegRack", 6);
    wall("bottleShelf", 8);
    wall("banner", 10);
    wall("trophy", 12);
    put("fireplace", 15, 4);
    for (let x = 5; x <= 9; x++) put("counter", x, 6);
    put("keg", 5, 4);
    put("rug", 14.5, 6.5, false);
    for (const [x, y] of [[7, 9], [13, 9]]) {
      put("table", x, y, true, { mugs: true });
      put("stool", x - 1, y, false);
      put("stool", x + 1, y, false);
      put("candle", x, y - 0.05, false);
    }
    put("bench", 11, 7);
    put("barrel", 16, 11);
    put("barrel", 16, 10);
    put("sacks", 5, 11);
    put("candle", 7.5, 6, false);
    put("plant", 5, 8);
  } else if (def.kind === "shop") {
    wall("window", 10);
    wall("potionShelf", 6);
    wall("shelf", 8);
    wall("shelf", 13);
    wall("hangingHerbs", 15);
    for (let x = 7; x <= 13; x++) put("counter", x, 6, true, { goods: x });
    put("scales", 12, 6.34, false);
    put("display", 6, 9, true, { goods: "fruit" });
    put("display", 15, 9, true, { goods: "cloth" });
    put("crate", 5, 11);
    put("crate", 5, 10);
    put("sacks", 6, 11);
    put("barrel", 16, 11);
    put("barrel", 15, 11);
    put("rug", 10.5, 9, false);
    put("plant", 16, 4);
    wall("lantern", 11.5);
  } else if (def.kind === "forge") {
    wall("toolRack", 8);
    wall("weaponRack", 12);
    wall("weaponRack", 14);
    wall("window", 10);
    put("furnace", 5.5, 4.4);
    put("bellows", 7, 5);
    put("anvil", 10, 7);
    put("quench", 12, 7);
    put("grindstone", 14, 9);
    put("armorStand", 16, 5);
    put("armorStand", 16, 7);
    put("coal", 5, 7, false);
    put("crate", 5, 11);
    put("ingots", 6, 11);
    put("workbench", 15, 11);
    put("barrel", 16, 11);
  } else if (def.kind === "ruin") {
    // Dust, cobwebs, bones, a collapsed beam and a forgotten chest.
    wall("cobweb", 5);
    wall("cobweb", 16);
    wall("brokenWindow", 9);
    wall("brokenShelf", 12);
    put("brokenTable", 8, 7);
    put("chairDown", 9.6, 8.4, false);
    put("bones", 13, 10, false);
    put("rubble", 6, 9, false);
    put("rubble", 15, 8, false);
    put("hole", 11, 9.5, false);
    put("beam", 7, 10.5, false);
    put("brokenBarrel", 5, 11);
    put("crate", 16, 11);
    put("moss", 14, 5, false);
    put("moss", 6, 5, false);
    put("moss", 10, 10.6, false);
    put("rubble", 12, 6, false);
    put("bones", 6.5, 6.4, false);
    put("cobwebFloor", 16, 9, false);
    objects.push({ id: "stash-" + houseId, type: "stash", rich: true, ...point(15, 5), name: ["Старый сундук", "Old chest"] });
    blocked[5 * WIDTH + 15] = 1;
  } else {
    wall("window", 7);
    wall("window", 13);
    wall("wallPlates", 10);
    wall("hangingHerbs", 15.2);
    put("fireplace", 11, 4);
    put("cookingPot", 11, 5.2, false);
    put("bed", 5.5, 5);
    put("wardrobe", 8, 4);
    put("bookshelf", 16, 4);
    put("rug", 6.5, 8, false);
    put("table", 13, 8);
    put("chair", 12, 8, false);
    put("chair", 14, 8, false);
    put("candle", 13, 7.95, false);
    put("washbasin", 5, 10);
    put("plant", 16, 9);
    put("vase", 9, 4.6, false);
    objects.push({ id: "stash-" + houseId, type: "stash", ...point(16, 11), name: ["Сундук жильца", "Resident's chest"] });
    blocked[11 * WIDTH + 16] = 1;
  }
  if (def.keeper) objects.push({
    id: "keeper-" + houseId,
    type: "npc",
    house: houseId,
    ...(def.kind === "tavern" ? point(7, 5) : def.kind === "shop" ? point(10, 5) : def.kind === "forge" ? point(9, 6) : point(13, 6)),
    name: def.keeper.name,
    role: def.keeper.role,
    style: def.keeper.style,
  });
  objects.push({ id: prefix + "exit", type: "houseExit", ...point(10.5, 12), name: ["Выйти на улицу", "Go outside"] });
  return {
    tiles,
    blocked,
    objects,
    spawns: [],
    width: WIDTH,
    height: HEIGHT,
    bounds: { width: 22, height: 16 },
    theme: "interior",
    interior: houseId,
    start: point(10.5, 11),
    getObjectsInRect(x, y, w, h) {
      return objects.filter((o) => o.x >= x - 50 && o.x < x + w + 50 && o.y > y - 70 && o.y < y + h + 70);
    },
  };
}
export function addDoors(world) {
  for (const o of world.objects.filter((o) => o.type === "house" && interiorDefs[o.id]))
    world.addObject?.({
      id: "door-" + o.id,
      type: "door",
      house: o.id,
      x: o.x,
      y: o.y + 14,
      name: interiorDefs[o.id].name,
    });
}
export function installInteriors(Game) {
  Object.assign(Game.prototype, {
    enterHouse(id) {
      const s = this.save,
        house = this.world.objects.find((o) => o.id === id);
      if (!interiorDefs[id] || s.activeDungeon || s.interior || !house) return false;
      if (Math.hypot(house.x - s.x, house.y + 14 - s.y) > 70) return false;
      if (this.inDanger()) {
        this.onToast(tr("Сначала отойдите от противников.", "Move away from enemies first."));
        return false;
      }
      s.interior = { id, returnPoint: { x: house.x, y: house.y + 34 } };
      this.loadZone();
      Object.assign(s, this.world.start);
      this.resetTransit();
      this.persist();
      this.onChange();
      return true;
    },
    leaveHouse() {
      const s = this.save;
      if (!s.interior) return false;
      const back = s.interior.returnPoint;
      s.interior = null;
      this.loadZone();
      Object.assign(s, canWalk(this.world, back.x, back.y) ? back : { x: back.x, y: back.y + 24 });
      this.resetTransit();
      this.persist();
      this.onChange();
      return true;
    },
    // Taverns rent a bed until morning: full rest without a campfire.
    innRest() {
      const s = this.save;
      if (!s.interior || interiorDefs[s.interior.id]?.kind !== "tavern" || s.gold < ROOM_PRICE) return false;
      s.gold -= ROOM_PRICE;
      const delta = (8 - this.climate.hour + 24) % 24;
      s.restTime += (Math.max(1, delta) * 900) / 24;
      s.hp = this.stats.maxHp;
      s.mana = this.stats.maxMana;
      this.potionCooldown = 0;
      this.abilityCooldowns = {};
      this.syncSkillCooldowns();
      this.persist();
      this.onChange();
      return true;
    },
    tradeItem(mode, key, count = 1) {
      const s = this.save,
        kind = s.interior && interiorDefs[s.interior.id]?.kind,
        table = mode === "sell" ? sellPrices : kind === "tavern" ? tavernMenu : buyPrices;
      if (!table[key] || !["shop", "tavern"].includes(kind) || (mode === "sell" && kind !== "shop")) return false;
      const n = mode === "sell" ? Math.min(count, s.inventory[key] || 0) : count,
        total = table[key] * n;
      if (n < 1) return false;
      if (mode === "sell") {
        s.inventory[key] -= n;
        s.gold += total;
      } else {
        if (s.gold < total) return false;
        s.gold -= total;
        s.inventory[key] = (s.inventory[key] || 0) + n;
      }
      this.audio.effect("coin");
      this.persist();
      this.onChange();
      return true;
    },
    // Unused gear can be sold; equipped items and the last weapon stay.
    sellGear(kind, id) {
      const s = this.save,
        list = kind === "weapon" ? "ownedWeapons" : kind === "armor" ? "ownedArmors" : "ownedWearables";
      if (interiorDefs[s.interior?.id]?.kind !== "shop" || !s[list].includes(id)) return false;
      if (kind === "weapon" && (s.equippedWeapon === id || s.ownedWeapons.length <= 1)) return false;
      if (kind === "armor" && (id === "none" || s.equippedArmor === id)) return false;
      if (kind === "wear" && Object.values(s.equippedWearables).includes(id)) return false;
      s[list] = s[list].filter((x) => x !== id);
      s.gold += gearSellPrice(kind, id);
      this.audio.effect("coin");
      this.persist();
      this.onChange();
      return true;
    },
    openStash(o) {
      if (this.collected.has(o.id)) return false;
      this.collected.add(o.id);
      if (o.rich) {
        // Abandoned huts hide real treasure: coins, essence and a piece of gear.
        this.save.gold += 80 + Math.round(this.rng() * 60);
        this.save.inventory.essence += 2;
        const gear = rollGear(this.save, this.rng, this.save.level + 3);
        if (gear) {
          const list = { weapon: "ownedWeapons", armor: "ownedArmors", wear: "ownedWearables" }[gear[0]];
          if (!this.save[list].includes(gear[1])) this.save[list].push(gear[1]);
        }
        this.emit("loot", o.x, o.y, "#c48cff", 30);
        this.persist();
        this.onChange();
        return gear || true;
      }
      this.save.gold += 25;
      const key = ["herb", "fiber", "leather", "wood"][o.id.length % 4];
      this.save.inventory[key] += 2;
      this.save.inventory.potion++;
      this.emit("loot", o.x, o.y, "#e9ce91", 18);
      this.persist();
      this.onChange();
      return true;
    },
  });
}
export const interiorTile = TILE;

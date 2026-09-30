import { wearableStats } from "./gear.js";
import { configureAbility, upgradeAbility } from "./abilities.js";
export const weapons = {
  sword: {
    name: ["Стальной меч", "Steel sword"],
    desc: [
      "Сбалансированные удары и быстрая серия атак.",
      "Balanced strikes and quick attack chains.",
    ],
    class: "warrior",
    icon: "sword",
    kind: "melee",
    multiplier: 1,
    cooldown: 0.43,
    range: 54,
    arc: 1.45,
    price: 0,
    color: "#d2dfe0",
  },
  spear: {
    name: ["Копьё дозора", "Watchman’s spear"],
    desc: [
      "Длинный выпад. Держите противника на расстоянии.",
      "A long thrust. Keep enemies at a distance.",
    ],
    class: "warrior",
    icon: "spear",
    kind: "melee",
    multiplier: 1.15,
    cooldown: 0.56,
    range: 92,
    arc: 0.55,
    price: 85,
    color: "#cdd8bf",
  },
  greatsword: {
    name: ["Двуручный клинок", "Greatsword"],
    desc: [
      "Медленный мощный удар с широким размахом.",
      "Slow, powerful strikes with a wide swing.",
    ],
    class: "warrior",
    icon: "sword",
    kind: "melee",
    multiplier: 1.65,
    cooldown: 0.78,
    range: 72,
    arc: 1.95,
    price: 150,
    color: "#e0be7a",
  },
  bow: {
    name: ["Охотничий лук", "Hunting bow"],
    desc: [
      "Быстрые стрелы на средней дистанции.",
      "Quick arrows at medium range.",
    ],
    class: "ranger",
    icon: "bow",
    kind: "ranged",
    multiplier: 1,
    cooldown: 0.33,
    range: 235,
    price: 0,
    color: "#d7ba7f",
  },
  crossbow: {
    name: ["Арбалет механика", "Mechanist’s crossbow"],
    desc: [
      "Сильный дальний выстрел пробивает двух противников.",
      "Powerful long shots pierce two enemies.",
    ],
    class: "ranger",
    icon: "crossbow",
    kind: "ranged",
    multiplier: 1.65,
    cooldown: 0.7,
    range: 310,
    pierce: 2,
    price: 140,
    color: "#c2b69a",
  },
  daggers: {
    name: ["Парные кинжалы", "Twin daggers"],
    desc: [
      "Быстрый ближний бой и ускоренное передвижение.",
      "Rapid melee strikes and faster movement.",
    ],
    class: "ranger",
    icon: "daggers",
    kind: "melee",
    multiplier: 0.75,
    cooldown: 0.22,
    range: 43,
    arc: 1.2,
    price: 70,
    speed: 12,
    color: "#ccdfe0",
  },
  staff: {
    name: ["Посох искры", "Spark staff"],
    desc: [
      "Световой снаряд с устойчивым уроном.",
      "A light projectile with reliable damage.",
    ],
    class: "mage",
    icon: "staff",
    kind: "ranged",
    multiplier: 1,
    cooldown: 0.62,
    range: 210,
    price: 0,
    color: "#b5eee6",
  },
  wand: {
    name: ["Жезл ветра", "Wind wand"],
    desc: [
      "Частые лёгкие снаряды. Подходит для боя на ходу.",
      "Frequent light bolts. Ideal for fighting on the move.",
    ],
    class: "mage",
    icon: "staff",
    kind: "ranged",
    multiplier: 0.68,
    cooldown: 0.32,
    range: 195,
    price: 90,
    color: "#d6eab0",
  },
  frostStaff: {
    name: ["Посох инея", "Frost staff"],
    desc: [
      "Ледяной снаряд замедляет врага на две секунды.",
      "An ice bolt slows its target for two seconds.",
    ],
    class: "mage",
    icon: "snow",
    kind: "ranged",
    multiplier: 1.2,
    cooldown: 0.72,
    range: 265,
    slow: 2,
    price: 165,
    color: "#a8dcf4",
  },
};
const advancedWeapons = {
  axe: {
    class: "warrior",
    name: ["Боевой топор", "Battle axe"],
    kind: "melee",
    multiplier: 1.35,
    cooldown: 0.57,
    range: 58,
    arc: 1.65,
    price: 200,
    level: 3,
    bonus: 2,
    color: "#d6b79b",
    icon: "sword",
  },
  hammer: {
    class: "warrior",
    name: ["Молот склепа", "Crypt hammer"],
    kind: "melee",
    multiplier: 1.6,
    cooldown: 0.76,
    range: 63,
    arc: 1.7,
    level: 4,
    bonus: 5,
    stun: 0.35,
    source: "crypt",
    color: "#bac5d4",
    icon: "sword",
  },
  scimitar: {
    class: "warrior",
    name: ["Сабля каравана", "Caravan scimitar"],
    kind: "melee",
    multiplier: 1.1,
    cooldown: 0.35,
    range: 59,
    arc: 1.4,
    price: 420,
    level: 7,
    bonus: 5,
    color: "#e7d5a4",
    icon: "sword",
    recipe: { ore: 9, wood: 5 },
  },
  frostSpear: {
    class: "warrior",
    name: ["Копьё ледника", "Glacier spear"],
    kind: "melee",
    multiplier: 1.5,
    cooldown: 0.53,
    range: 110,
    arc: 0.65,
    bonus: 8,
    level: 7,
    source: "mine",
    element: "ice",
    slow: 1.4,
    color: "#a1dbf9",
    icon: "spear",
  },
  flameblade: {
    class: "warrior",
    name: ["Клинок углей", "Cinder blade"],
    kind: "melee",
    multiplier: 1.65,
    cooldown: 0.56,
    range: 76,
    arc: 1.8,
    bonus: 12,
    level: 10,
    source: "abyss",
    element: "fire",
    burn: 4,
    color: "#ffb16c",
    icon: "sword",
  },
  titanblade: {
    class: "warrior",
    name: ["Разлом небес", "Skybreaker"],
    kind: "melee",
    multiplier: 2,
    cooldown: 0.67,
    range: 93,
    arc: 1.9,
    bonus: 18,
    level: 14,
    source: "citadel",
    element: "lightning",
    color: "#ead4ff",
    icon: "sword",
  },
  longbow: {
    class: "ranger",
    name: ["Длинный лук", "Longbow"],
    kind: "ranged",
    multiplier: 1.3,
    cooldown: 0.46,
    range: 340,
    price: 210,
    level: 3,
    bonus: 2,
    color: "#cbbb8f",
    icon: "bow",
  },
  shadowdaggers: {
    class: "ranger",
    name: ["Кинжалы теней", "Shadow daggers"],
    kind: "melee",
    multiplier: 1.15,
    cooldown: 0.24,
    range: 52,
    arc: 1.2,
    bonus: 5,
    level: 4,
    source: "crypt",
    speed: 14,
    color: "#b9acd8",
    icon: "daggers",
  },
  repeater: {
    class: "ranger",
    name: ["Многозарядный арбалет", "Repeating crossbow"],
    kind: "ranged",
    multiplier: 1.05,
    cooldown: 0.25,
    range: 265,
    price: 440,
    level: 7,
    bonus: 5,
    color: "#c5b490",
    icon: "crossbow",
    recipe: { ore: 7, wood: 8 },
  },
  moonbow: {
    class: "ranger",
    name: ["Лук зимней луны", "Wintermoon bow"],
    kind: "ranged",
    multiplier: 1.6,
    cooldown: 0.48,
    range: 335,
    bonus: 8,
    level: 7,
    source: "mine",
    slow: 1.3,
    element: "ice",
    color: "#b7e8ed",
    icon: "bow",
  },
  venombow: {
    class: "ranger",
    name: ["Жало глубин", "Depthstinger"],
    kind: "ranged",
    multiplier: 1.7,
    cooldown: 0.43,
    range: 305,
    bonus: 12,
    level: 10,
    source: "abyss",
    poison: 5,
    element: "poison",
    color: "#b8ec8d",
    icon: "bow",
  },
  stormbow: {
    class: "ranger",
    name: ["Лук громовержца", "Thunderlord bow"],
    kind: "ranged",
    multiplier: 1.85,
    cooldown: 0.4,
    range: 360,
    bonus: 18,
    level: 14,
    source: "citadel",
    pierce: 3,
    element: "lightning",
    color: "#ded0fb",
    icon: "bow",
  },
  emberstaff: {
    class: "mage",
    name: ["Посох погребального огня", "Funeral flame staff"],
    kind: "ranged",
    multiplier: 1.35,
    cooldown: 0.56,
    range: 255,
    bonus: 5,
    level: 4,
    source: "crypt",
    element: "fire",
    burn: 4,
    color: "#f5ac73",
    icon: "staff",
  },
  earthstaff: {
    class: "mage",
    name: ["Посох камня", "Earth staff"],
    kind: "ranged",
    multiplier: 1.5,
    cooldown: 0.68,
    range: 240,
    price: 220,
    level: 3,
    bonus: 2,
    stun: 0.4,
    color: "#cdcb9c",
    icon: "staff",
  },
  moonstaff: {
    class: "mage",
    name: ["Жезл лунного света", "Moonlight wand"],
    kind: "ranged",
    multiplier: 1.1,
    cooldown: 0.29,
    range: 290,
    price: 450,
    level: 7,
    bonus: 5,
    color: "#dccaf1",
    icon: "staff",
    recipe: { crystal: 7, wood: 5 },
  },
  tidestaff: {
    class: "mage",
    name: ["Скипетр вечного льда", "Eternal ice scepter"],
    kind: "ranged",
    multiplier: 1.55,
    cooldown: 0.55,
    range: 300,
    bonus: 8,
    level: 7,
    source: "mine",
    slow: 2.2,
    element: "ice",
    color: "#9de5f7",
    icon: "snow",
  },
  voidstaff: {
    class: "mage",
    name: ["Посох бездны", "Abyss staff"],
    kind: "ranged",
    multiplier: 1.85,
    cooldown: 0.58,
    range: 290,
    bonus: 12,
    level: 10,
    source: "abyss",
    pierce: 3,
    element: "void",
    color: "#d796f5",
    icon: "staff",
  },
  thunderwand: {
    class: "mage",
    name: ["Скипетр бури", "Tempest scepter"],
    kind: "ranged",
    multiplier: 1.75,
    cooldown: 0.37,
    range: 335,
    bonus: 18,
    level: 14,
    source: "citadel",
    element: "lightning",
    color: "#e1ccff",
    icon: "staff",
  },
};
const weaponDescriptions = {
  axe: [
    "Тяжёлый рубящий удар с большим уроном, но долгим замахом.",
    "A heavy cleaving strike with high damage and a slower swing.",
  ],
  hammer: [
    "Оглушает обычных врагов на 0,35 секунды. Трофей Костяного короля.",
    "Stuns normal enemies for 0.35 seconds. Loot from the Bone King.",
  ],
  scimitar: [
    "Быстрые серии ударов. Можно создать из руды и древесины.",
    "Fast attack chains. Can be crafted from ore and wood.",
  ],
  frostSpear: [
    "Дальняя колющая атака льдом; замедление на 1,4 секунды.",
    "A long-reaching ice thrust; slows for 1.4 seconds.",
  ],
  flameblade: [
    "Огненный клинок поджигает врагов на 4 секунды. Дождь ослабляет пламя.",
    "A fire blade burns enemies for 4 seconds. Rain weakens its flame.",
  ],
  titanblade: [
    "Легендарный тяжёлый клинок молний. Во время дождя и грозы бьёт сильнее.",
    "A legendary heavy lightning blade. Stronger during rain and storms.",
  ],
  longbow: [
    "Дальность 340: позволяет удерживать врага на расстоянии.",
    "340 range lets you keep enemies at a distance.",
  ],
  shadowdaggers: [
    "Быстрые парные удары и скорость движения +14.",
    "Fast dual strikes and +14 movement speed.",
  ],
  repeater: [
    "Частые выстрелы на средней дистанции. Для крафта нужны руда и древесина.",
    "Rapid mid-range shots. Crafted from ore and wood.",
  ],
  moonbow: [
    "Ледяные стрелы замедляют на 1,3 секунды. Дождь усиливает лёд.",
    "Ice arrows slow for 1.3 seconds. Rain strengthens ice.",
  ],
  venombow: [
    "Ядовитые стрелы наносят дополнительный урон в течение 5 секунд.",
    "Venom arrows deal extra damage over 5 seconds.",
  ],
  stormbow: [
    "Легендарные стрелы молнии пробивают до трёх противников.",
    "Legendary lightning arrows pierce up to three enemies.",
  ],
  earthstaff: [
    "Каменные снаряды оглушают обычных врагов на 0,4 секунды.",
    "Stone projectiles stun normal enemies for 0.4 seconds.",
  ],
  emberstaff: [
    "Огненные снаряды поджигают на 4 секунды. Трофей Костяного короля.",
    "Fire projectiles burn for 4 seconds. Loot from the Bone King.",
  ],
  moonstaff: [
    "Быстрый жезл. Можно создать из кристаллов и древесины.",
    "A fast wand. Can be crafted from crystals and wood.",
  ],
  tidestaff: [
    "Сильное замедление на 2,2 секунды. Лёд усиливается в дождь и снег.",
    "Slows for 2.2 seconds. Ice grows stronger in rain and snow.",
  ],
  voidstaff: [
    "Снаряды тьмы пробивают до трёх врагов.",
    "Void projectiles pierce up to three enemies.",
  ],
  thunderwand: [
    "Легендарный скипетр с частыми разрядами молнии.",
    "A legendary scepter casting rapid lightning bolts.",
  ],
};
for (const [id, w] of Object.entries(advancedWeapons))
  weapons[id] = {
    ...w,
    price: w.price || 0,
    rarity: w.source === "citadel" ? "legendary" : w.source ? "epic" : "rare",
    desc: weaponDescriptions[id],
  };
weapons.frostStaff.element = "ice";
// Merchant and crafted alternatives: deliberate trade-offs within the existing schools.
const additions = [
  ["duelist", "sword", "Меч дуэлянта", "Duelist sword", 2, 115, { multiplier:.9, cooldown:.29, range:48, arc:1.1, speed:5, recipe:{ore:3,wood:2}, color:"#ead2a5" }, ["Быстрый узкий удар; +5 к скорости. Школа клинка.", "Fast narrow strikes; +5 speed. Blade school."]],
  ["halberd", "spear", "Алебарда стража", "Guard halberd", 5, 285, {multiplier:1.35,cooldown:.68,range:105,arc:1.15,recipe:{ore:6,wood:3},color:"#c6d9bb"}, ["Широкий длинный удар ценой медленного восстановления.","Wide, long reach at the cost of slower recovery."]],
  ["warmaul", "hammer", "Осадный молот", "Siege maul", 8, 520, {multiplier:1.75,cooldown:.95,range:65,arc:1.8,stun:.5,bonus:6,recipe:{ore:12,wood:4},color:"#d4bfa0"}, ["Оглушение обычных врагов на 0,5 с; очень медленный удар.","Stuns normal enemies for 0.5 s; very slow strikes."]],
  ["emberSpear", "spear", "Пика пепла", "Ash pike", 12, 850, {multiplier:1.45,cooldown:.66,range:118,arc:.5,bonus:10,element:"fire",burn:3,recipe:{ore:14,essence:4,wood:4},color:"#f4ad73"}, ["Дальний огненный выпад, поджог на 3 с. Дождь ослабляет огонь.","Long fire thrust, 3 s burn. Rain weakens fire."]],
  ["shortbow", "bow", "Лук разведчика", "Scout bow", 2, 110, {multiplier:.8,cooldown:.25,range:185,speed:6,recipe:{wood:3,fiber:3},color:"#d0c594"}, ["Скорострельный короткий лук; +6 к скорости, малая дальность.","Rapid short-range bow; +6 speed, limited reach."]],
  ["frostDaggers", "daggers", "Клинки инея", "Frost blades", 5, 290, {multiplier:.95,cooldown:.27,range:45,arc:1.1,speed:8,element:"ice",slow:1.5,recipe:{ore:4,crystal:3,leather:2},color:"#a7e3f2"}, ["Замедление на 1,5 с; школа клинков с невидимостью.","1.5 s slow; dual blade school with invisibility."]],
  ["siegeCrossbow", "crossbow", "Арбалет крепости", "Fortress crossbow", 8, 530, {multiplier:2,cooldown:1.05,range:370,pierce:3,bonus:5,recipe:{ore:9,wood:6,leather:3},color:"#e0c99a"}, ["Пробивает 3 цели на большой дистанции; долгая перезарядка.","Pierces 3 targets at long range; long reload."]],
  ["assassinDaggers", "daggers", "Клинки гадюки", "Viper blades", 12, 850, {multiplier:1.2,cooldown:.29,range:50,arc:1.2,speed:10,bonus:9,element:"poison",poison:4,recipe:{ore:10,essence:4,leather:4},color:"#bfd988"}, ["Яд на 4 с и скорость +10. Удар из невидимости усилен.","4 s poison and +10 speed. Stealth attacks are stronger."]],
  ["apprenticeFlame", "staff", "Посох уголька", "Ember apprentice staff", 2, 115, {multiplier:.9,cooldown:.7,range:190,element:"fire",burn:2,recipe:{wood:3,crystal:2},color:"#f5b07b"}, ["Открывает огненную школу. Поджог на 2 с, малая дальность.","Opens fire school. 2 s burn, short range."]],
  ["stormRod", "wand", "Жезл грозы", "Storm rod", 5, 295, {multiplier:.85,cooldown:.48,range:230,element:"lightning",recipe:{wood:3,crystal:5,ore:2},color:"#d8bdff"}, ["Школа молний с цепным разрядом; дождь усиливает выстрелы.","Lightning school with chain lightning; rain strengthens shots."]],
  ["obsidianStaff", "staff", "Обсидиановый посох", "Obsidian staff", 8, 540, {multiplier:1.3,cooldown:.9,range:290,pierce:2,element:"void",bonus:4,recipe:{wood:4,crystal:8,essence:2},color:"#ba9edc"}, ["Школа пустоты; медленные снаряды пробивают 2 цели.","Void school; slow-firing bolts pierce 2 targets."]],
  ["graniteStaff", "staff", "Посох монолита", "Monolith staff", 12, 880, {multiplier:1.6,cooldown:.96,range:285,stun:.55,bonus:9,recipe:{ore:12,crystal:7,essence:4},color:"#d9c5a6"}, ["Школа земли. Оглушение обычных врагов на 0,55 с; медленный темп.","Earth school. Stuns normal enemies for 0.55 s; slow firing."]],
];
for (const [id, base, ru, en, level, price, extra, desc] of additions)
  weapons[id] = {...weapons[base], source: undefined, rarity: "rare", appearance: base, name:[ru,en], desc, level, price, ...extra};
export const armors = {
  none: {
    name: ["Без брони", "No armor"],
    desc: [
      "Обычная одежда не защищает от ударов.",
      "Travel clothes provide no protection.",
    ],
    defense: 0,
    hp: 0,
    color: null,
    price: 0,
  },
  cloth: {
    name: ["Стёганый жилет", "Padded vest"],
    desc: [
      "Лёгкая защита, запас энергии +15.",
      "Light protection, +15 maximum energy.",
    ],
    defense: 2,
    hp: 8,
    mana: 15,
    price: 65,
    recipe: { fiber: 6, herb: 2 },
    level: 1,
    color: "#a79877",
  },
  leather: {
    name: ["Кожаный доспех", "Leather armor"],
    desc: [
      "Не мешает движению. Скорость +2.",
      "Flexible protection. +2 movement speed.",
    ],
    defense: 5,
    hp: 20,
    speed: 2,
    price: 150,
    recipe: { leather: 7, fiber: 4 },
    level: 2,
    color: "#966c49",
  },
  chain: {
    name: ["Кольчуга дозора", "Watchman chainmail"],
    desc: [
      "Надёжная защита, но немного замедляет.",
      "Reliable protection with a small speed penalty.",
    ],
    defense: 10,
    hp: 35,
    speed: -4,
    price: 320,
    recipe: { ore: 10, leather: 4 },
    level: 4,
    color: "#8c9b9f",
  },
  plate: {
    name: ["Рыцарский панцирь", "Knight plate"],
    desc: [
      "Сильная защита ценой подвижности.",
      "Heavy defense at the cost of mobility.",
    ],
    defense: 16,
    hp: 55,
    speed: -8,
    price: 650,
    recipe: { ore: 18, crystal: 4, leather: 6 },
    level: 7,
    color: "#a8b5b8",
  },
  grave: {
    name: ["Покров склепа", "Crypt mantle"],
    desc: [
      "Энергия +25. Сопротивление яду 30%.",
      "+25 energy. 30% poison resistance.",
    ],
    defense: 8,
    hp: 30,
    mana: 25,
    resist: "poison",
    level: 4,
    source: "crypt",
    color: "#9b8aae",
  },
  frost: {
    name: ["Доспех ледника", "Glacier armor"],
    desc: [
      "Защита от холода и замедления снегом.",
      "Resists ice damage and snow movement penalties.",
    ],
    defense: 14,
    hp: 45,
    resist: "ice",
    weatherproof: true,
    level: 7,
    source: "mine",
    color: "#92bbc7",
  },
  ember: {
    name: ["Панцирь глубин", "Depth carapace"],
    desc: [
      "Сопротивление огню 30%, здоровье +70.",
      "30% fire resistance, +70 health.",
    ],
    defense: 19,
    hp: 70,
    resist: "fire",
    level: 10,
    source: "abyss",
    color: "#b5816b",
  },
  storm: {
    name: ["Регалии грозы", "Storm regalia"],
    desc: [
      "Сопротивление молниям 30%, энергия +35.",
      "30% lightning resistance, +35 energy.",
    ],
    defense: 23,
    hp: 75,
    mana: 35,
    resist: "lightning",
    weatherproof: true,
    level: 14,
    source: "citadel",
    color: "#b6a0d1",
  },
  runic: {
    name: ["Рунный доспех", "Runic armor"],
    desc: [
      "Создаётся из эссенций боссов. Быстро восстанавливает энергию.",
      "Crafted from boss essences. Improves energy recovery.",
    ],
    defense: 18,
    hp: 55,
    mana: 30,
    regen: 0.5,
    level: 10,
    recipe: { essence: 9, ore: 14, crystal: 8 },
    color: "#a1b4aa",
  },
};
export const equippedArmor = (save) =>
  armors[save.equippedArmor] || armors.none;
export const starterWeapons = (cls) =>
  classWeapons(cls).filter(([, w]) => !w.rarity);
export const weaponUpgradeCost = (save) => ({
  gold: 100 + save.weaponLevel * 95,
  ore: 2 + save.weaponLevel * 2,
  essence: save.weaponLevel >= 3 ? save.weaponLevel - 2 : 0,
});
export const armorUpgradeCost = (save) => ({
  gold: 80 + save.armorLevel * 85,
  ore: 2 + save.armorLevel,
  essence: save.armorLevel >= 3 ? save.armorLevel - 2 : 0,
});
export function canPayMaterials(save, recipe = {}) {
  return Object.entries(recipe).every(
    ([id, n]) => (save.inventory[id] || 0) >= n,
  );
}
export function payMaterials(save, recipe = {}) {
  if (!canPayMaterials(save, recipe)) return false;
  for (const [id, n] of Object.entries(recipe)) save.inventory[id] -= n;
  return true;
}

export const defaultWeapon = (cls) =>
  ({ warrior: "sword", ranger: "bow", mage: "staff" })[cls];
export const classWeapons = (cls) =>
  Object.entries(weapons).filter(([, w]) => w.class === cls);
export function equippedWeapon(save) {
  const id = save.equippedWeapon;
  if (!id)
    return {
      name: ["Кулаки", "Fists"],
      kind: "melee",
      none: true,
      multiplier: 0.5,
      range: 28,
      cooldown: 0.5,
      icon: "hand",
      color: "#deb18c",
    };
  return weapons[id]?.class === save.characterClass
    ? weapons[id]
    : weapons[defaultWeapon(save.characterClass)];
}
export function deriveStats(save, base) {
  const w = equippedWeapon(save),
    a = equippedArmor(save),
    m = save.masteries || {},
    pieces = wearableStats(save);
  const power =
    base.damage +
    (save.level - 1) * 2 +
    Math.min(6, save.weaponLevel) * 3 +
    (m.precision || 0) * 2;
  return {
    ...base,
    weapon: w,
    armor: a,
    maxHp:
      base.hp +
      (save.level - 1) * 10 +
      (a.hp || 0) +
      (a === armors.none ? 0 : Math.min(6, save.armorLevel) * 10) +
      (m.vitality || 0) * 8 +
      pieces.hp,
    maxMana:
      base.mana +
      (save.level - 1) * 5 +
      (a.mana || 0) +
      (m.focus || 0) * 6 +
      pieces.mana,
    damage: Math.round(power * w.multiplier + (w.bonus || 0)),
    skillDamage: power + (w.bonus || 0) * 0.5,
    range: w.range + pieces.range,
    cooldown: w.cooldown,
    speed: base.speed + (w.speed || 0) + (a.speed || 0) + pieces.speed,
    defense:
      a.defense +
      (a === armors.none ? 0 : Math.min(6, save.armorLevel) * 2) +
      pieces.defense,
    manaRegen: 0.95 + (a.regen || 0) + (m.focus || 0) * 0.12,
  };
}

export { skillTrees } from "./abilities.js";
export const skillConfig = configureAbility;
export const upgradeSkill = upgradeAbility;

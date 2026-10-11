import { wearableStats } from "./gear.js";
import { raceOf } from "./races.js";
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
// 1.5: weapons with traits (critical strikes, life steal, splash) and the dawn relics of the final act.
const traitWeapons = [
  ["bloodletter", "axe", "Кровопийца", "Bloodletter", 9, 690, {multiplier:1.5,cooldown:.6,range:62,arc:1.7,bonus:7,lifesteal:.06,recipe:{ore:10,leather:6,essence:5},color:"#e08a86"}, ["Каждый удар возвращает 6% урона здоровьем. Покупка или крафт из эссенций.","Every hit restores 6% of damage as health. Buy it or craft it from essences."]],
  ["hawkeye", "longbow", "Ястребиный глаз", "Hawkeye", 9, 640, {multiplier:1.45,cooldown:.5,range:380,bonus:7,crit:.15,recipe:{wood:8,leather:5,essence:4},color:"#e8d9a0"}, ["Шанс крита +15%. Самая большая дальность среди обычных луков.","+15% critical chance. The longest reach among ordinary bows."]],
  ["starfall", "moonstaff", "Посох звездопада", "Starfall staff", 9, 660, {multiplier:1.2,cooldown:.6,range:280,bonus:7,splash:42,crit:.06,recipe:{crystal:10,wood:5,essence:4},color:"#f3e6a8"}, ["Снаряды взрываются: 45% урона по врагам рядом с целью.","Bolts explode for 45% damage around the target."]],
  ["dawnblade", "greatsword", "Рассветный клинок", "Dawnblade", 16, 0, {multiplier:2.15,cooldown:.6,range:96,arc:2,bonus:24,element:"light",crit:.1,lifesteal:.04,source:"eclipse",color:"#fff0b0"}, ["Реликвия финала. Свет: +60% урона по теням, шанс крита +10%, вампиризм 4%.","Finale relic. Light: +60% damage to shades, +10% crit, 4% life steal."]],
  ["dawnbow", "bow", "Лук первого луча", "Bow of the First Ray", 16, 0, {multiplier:1.95,cooldown:.36,range:380,bonus:24,pierce:3,element:"light",crit:.18,source:"eclipse",color:"#fff0b0"}, ["Реликвия финала. Свет пробивает 3 цели, шанс крита +18%.","Finale relic. Light pierces 3 targets, +18% critical chance."]],
  ["dawnstaff", "staff", "Посох рассвета", "Dawn staff", 16, 0, {multiplier:1.95,cooldown:.42,range:340,bonus:24,element:"light",splash:55,crit:.08,source:"eclipse",color:"#fff0b0"}, ["Реликвия финала. Взрывы света вокруг цели, шанс крита +8%.","Finale relic. Bursts of light around the target, +8% crit."]],
];
for (const [id, base, ru, en, level, price, extra, desc] of traitWeapons)
  weapons[id] = {
    ...weapons[base],
    source: undefined,
    rarity: extra.source ? "legendary" : "epic",
    appearance: weapons[base].appearance || base,
    name: [ru, en],
    desc,
    level,
    price,
    ...extra,
  };
// 1.6: Paladin and Necromancer arsenals. Fields mirror the base catalog above.
const W = (cls, id, ru, en, data, desc) =>
  (weapons[id] = { class: cls, name: [ru, en], desc, price: 0, ...data });
W("paladin", "mace", "Булава послушника", "Novice mace", { kind: "melee", icon: "mace", appearance: "mace", multiplier: 1, cooldown: 0.48, range: 52, arc: 1.35, color: "#e8dcb0" }, ["Надёжные удары средней скорости. Школа веры.", "Reliable strikes at a steady pace. Faith school."]);
W("paladin", "templeHammer", "Молот храма", "Temple hammer", { kind: "melee", icon: "mace", appearance: "hammer", multiplier: 1.45, cooldown: 0.72, range: 60, arc: 1.6, stun: 0.3, price: 95, color: "#d6cba0" }, ["Тяжёлый удар оглушает обычных врагов на 0,3 с. Школа суда.", "Heavy blows stun normal enemies for 0.3 s. Judgment school."]);
W("paladin", "oathLance", "Копьё обета", "Oath lance", { kind: "melee", icon: "spear", appearance: "spear", multiplier: 1.15, cooldown: 0.58, range: 90, arc: 0.55, price: 85, color: "#e6dfc0" }, ["Длинный выпад держит врагов на расстоянии. Школа суда.", "A long thrust keeps enemies away. Judgment school."]);
W("paladin", "morningstar", "Утренняя звезда", "Morningstar", { kind: "melee", icon: "mace", appearance: "mace", multiplier: 1.3, cooldown: 0.55, range: 56, arc: 1.4, crit: 0.05, bonus: 2, level: 3, price: 210, rarity: "rare", color: "#efe0a8" }, ["Шипы дают +5% к шансу крита.", "Spikes grant +5% critical chance."]);
W("paladin", "justiceHammer", "Молот правосудия", "Hammer of justice", { kind: "melee", icon: "mace", appearance: "hammer", multiplier: 1.5, cooldown: 0.66, range: 62, arc: 1.7, stun: 0.35, element: "light", bonus: 5, level: 7, price: 480, recipe: { ore: 10, crystal: 3 }, rarity: "rare", color: "#ffe08a" }, ["Свет: +60% урона нежити и теням, оглушение 0,35 с.", "Light: +60% damage to undead and shadows, 0.35 s stun."]);
W("paladin", "oathblade", "Клятвенный клинок", "Oathblade", { kind: "melee", icon: "sword", appearance: "greatsword", multiplier: 1.55, cooldown: 0.6, range: 72, arc: 1.8, lifesteal: 0.05, bonus: 7, level: 9, price: 700, recipe: { ore: 10, essence: 5, leather: 4 }, rarity: "epic", color: "#f3e3b0" }, ["Каждый удар возвращает 5% урона здоровьем.", "Every hit restores 5% of damage as health."]);
W("paladin", "requiemMace", "Булава отпевания", "Requiem mace", { kind: "melee", icon: "mace", appearance: "mace", multiplier: 1.4, cooldown: 0.5, range: 58, arc: 1.45, element: "light", bonus: 5, level: 4, source: "crypt", rarity: "epic", color: "#fff0b8" }, ["Трофей Костяного короля. Свет жжёт нежить.", "Bone King trophy. Light burns the undead."]);
W("paladin", "glacierMaul", "Молот ледника", "Glacier maul", { kind: "melee", icon: "mace", appearance: "hammer", multiplier: 1.6, cooldown: 0.7, range: 64, arc: 1.7, element: "ice", slow: 1.6, bonus: 8, level: 7, source: "mine", rarity: "epic", color: "#a8e4f6" }, ["Замедление 1,6 с. Трофей Ледяного тирана.", "1.6 s slow. Frost Tyrant trophy."]);
W("paladin", "purifierCenser", "Кадило очищения", "Purifier censer", { kind: "melee", icon: "mace", appearance: "mace", multiplier: 1.65, cooldown: 0.56, range: 70, arc: 1.8, element: "fire", burn: 4, bonus: 12, level: 10, source: "abyss", rarity: "epic", color: "#ffb36c" }, ["Поджигает на 4 с. Трофей Матки глубин.", "Burns for 4 s. Brood Queen trophy."]);
W("paladin", "heavenHammer", "Молот небесного суда", "Hammer of heaven", { kind: "melee", icon: "mace", appearance: "hammer", multiplier: 2, cooldown: 0.68, range: 90, arc: 1.9, element: "lightning", stun: 0.4, bonus: 18, level: 14, source: "citadel", rarity: "legendary", color: "#ead4ff" }, ["Легендарный молот молний. Трофей Повелителя бури.", "Legendary lightning hammer. Storm Lord trophy."]);
W("paladin", "dawnhammer", "Рассветный молот", "Dawnhammer", { kind: "melee", icon: "mace", appearance: "hammer", multiplier: 2.15, cooldown: 0.6, range: 92, arc: 2, element: "light", crit: 0.1, lifesteal: 0.04, bonus: 24, level: 16, source: "eclipse", rarity: "legendary", color: "#fff0b0" }, ["Реликвия финала. Свет, крит +10%, вампиризм 4%.", "Finale relic. Light, +10% crit, 4% life steal."]);
W("necromancer", "boneWand", "Костяной жезл", "Bone wand", { kind: "ranged", icon: "bone", appearance: "skullstaff", multiplier: 1, cooldown: 0.55, range: 215, color: "#d8f0c8" }, ["Сгусток костяной пыли на средней дистанции. Школа костей.", "A bolt of bone dust at medium range. Bone school."]);
W("necromancer", "reaperScythe", "Серп жнеца", "Reaper sickle", { kind: "melee", icon: "scythe", appearance: "scythe", multiplier: 1.2, cooldown: 0.6, range: 64, arc: 1.8, lifesteal: 0.03, price: 90, color: "#cfe8c0" }, ["Широкий взмах, вампиризм 3%. Школа жатвы.", "Wide swing, 3% life steal. Reaping school."]);
W("necromancer", "plagueStaff", "Посох мора", "Plague staff", { kind: "ranged", icon: "staff", appearance: "skullstaff", multiplier: 0.85, cooldown: 0.45, range: 200, element: "poison", poison: 3, price: 90, color: "#a8e07a" }, ["Отравляет на 3 с. Школа чумы.", "Poisons for 3 s. Plague school."]);
W("necromancer", "cryptWand", "Жезл склепа", "Crypt wand", { kind: "ranged", icon: "bone", appearance: "skullstaff", multiplier: 1.25, cooldown: 0.5, range: 250, pierce: 2, bonus: 2, level: 3, price: 220, rarity: "rare", color: "#e4f0d0" }, ["Снаряды пробивают 2 цели.", "Bolts pierce 2 targets."]);
W("necromancer", "harvestScythe", "Коса жатвы", "Harvest scythe", { kind: "melee", icon: "scythe", appearance: "scythe", multiplier: 1.5, cooldown: 0.62, range: 72, arc: 1.9, lifesteal: 0.05, bonus: 5, level: 7, price: 470, recipe: { ore: 8, essence: 2, wood: 4 }, rarity: "rare", color: "#c8f0b0" }, ["Вампиризм 5%, очень широкий взмах.", "5% life steal, very wide swing."]);
W("necromancer", "soulStaff", "Посох душ", "Soul staff", { kind: "ranged", icon: "staff", appearance: "skullstaff", multiplier: 1.3, cooldown: 0.6, range: 280, element: "void", splash: 40, bonus: 7, level: 9, price: 700, recipe: { crystal: 9, essence: 4, wood: 4 }, rarity: "epic", color: "#c6a8ff" }, ["Души взрываются: 45% урона вокруг цели.", "Souls explode for 45% damage around the target."]);
W("necromancer", "kingScepter", "Скипетр Костяного короля", "Bone King scepter", { kind: "ranged", icon: "bone", appearance: "skullstaff", multiplier: 1.35, cooldown: 0.52, range: 255, element: "void", pierce: 2, bonus: 5, level: 4, source: "crypt", rarity: "epic", color: "#cbb2f1" }, ["Трофей Костяного короля. Тьма пробивает 2 цели.", "Bone King trophy. Void pierces 2 targets."]);
W("necromancer", "rimeStaff", "Посох вечной мерзлоты", "Rime staff", { kind: "ranged", icon: "staff", appearance: "skullstaff", multiplier: 1.5, cooldown: 0.56, range: 290, element: "ice", slow: 2, bonus: 8, level: 7, source: "mine", rarity: "epic", color: "#a8e4f6" }, ["Замедление 2 с. Трофей Ледяного тирана.", "2 s slow. Frost Tyrant trophy."]);
W("necromancer", "broodWand", "Жезл матки", "Brood wand", { kind: "ranged", icon: "bone", appearance: "skullstaff", multiplier: 1.7, cooldown: 0.45, range: 300, element: "poison", poison: 5, bonus: 12, level: 10, source: "abyss", rarity: "epic", color: "#b8ec8d" }, ["Сильный яд на 5 с. Трофей Матки глубин.", "Strong 5 s poison. Brood Queen trophy."]);
W("necromancer", "stormScythe", "Коса бури", "Storm scythe", { kind: "melee", icon: "scythe", appearance: "scythe", multiplier: 2, cooldown: 0.6, range: 92, arc: 2, element: "lightning", lifesteal: 0.05, bonus: 18, level: 14, source: "citadel", rarity: "legendary", color: "#ded0fb" }, ["Легендарная коса молний, вампиризм 5%.", "Legendary lightning scythe, 5% life steal."]);
W("necromancer", "duskstaff", "Посох сумеречного рассвета", "Duskdawn staff", { kind: "ranged", icon: "staff", appearance: "skullstaff", multiplier: 1.95, cooldown: 0.42, range: 340, element: "light", splash: 55, crit: 0.08, bonus: 24, level: 16, source: "eclipse", rarity: "legendary", color: "#fff0b0" }, ["Реликвия финала. Взрывы света вокруг цели.", "Finale relic. Bursts of light around the target."]);
export const elementNames = {
  fire: ["Огонь", "Fire"],
  ice: ["Лёд", "Ice"],
  poison: ["Яд", "Poison"],
  lightning: ["Молния", "Lightning"],
  void: ["Тьма", "Void"],
  light: ["Свет", "Light"],
};
// Base critical chance per class; weapons, precision mastery and focus add to it.
export const critChance = (save, weapon = equippedWeapon(save)) =>
  Math.min(
    0.6,
    ({ warrior: 0.05, ranger: 0.09, mage: 0.06, paladin: 0.05, necromancer: 0.06, summoner: 0.06, shapeshifter: 0.08, monk: 0.1, engineer: 0.05 }[save.characterClass] || 0.05) +
      (weapon.crit || 0) +
      (equippedArmor(save).crit || 0) +
      wearableStats(save).crit +
      (raceOf(save).crit || 0) +
      (save.masteries?.precision || 0) * 0.005,
  );
export const CRIT_MULTIPLIER = 1.75;
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
// 2.3: more armor, and three mythic sets that grow wings. Mythic gear is never sold or dropped:
// it is forged from a mountain of materials, and only after the named bosses have fallen.
Object.assign(armors, {
  scale: { name: ["Чешуйчатый доспех", "Scale armor"], desc: ["Пластины внахлёст: защита без сильного замедления.", "Overlapping plates: protection without much slowdown."], defense: 12, hp: 40, speed: -2, price: 480, recipe: { ore: 12, leather: 8 }, level: 5, color: "#7a9a7a" },
  shadow: { name: ["Доспех теней", "Shadow armor"], desc: ["Скорость +6, шанс крита +5%. Для тех, кто бьёт первым.", "+6 speed, +5% crit. For those who strike first."], defense: 15, hp: 45, speed: 6, crit: 0.05, price: 950, recipe: { leather: 14, essence: 4, fiber: 10 }, level: 9, color: "#4a4458" },
  mithril: { name: ["Мифриловая броня", "Mithril armor"], desc: ["Лёгкая как шёлк, крепкая как гора. Энергия +30.", "Light as silk, strong as a mountain. +30 energy."], defense: 22, hp: 70, mana: 30, price: 1700, recipe: { ore: 24, crystal: 10, essence: 6 }, level: 12, color: "#c8dce8" },
  dragon: { name: ["Драконья чешуя", "Dragonscale"], desc: ["Мифический доспех с драконьими крыльями. Сопротивление огню 30%, здоровье +130.", "Mythic armor with dragon wings. 30% fire resistance, +130 health."], defense: 32, hp: 130, resist: "fire", level: 18, rarity: "mythic", recipe: { essence: 25, ore: 30, crystal: 15, leather: 20 }, requires: ["wb-frostWyrm", "seal-abyss"], color: "#a8382a" },
  abyss: { name: ["Покров Бездны", "Shroud of the Abyss"], desc: ["Мифический доспех с крыльями тени. Скорость +8, шанс крита +10%.", "Mythic armor with shadow wings. +8 speed, +10% crit."], defense: 28, hp: 100, speed: 8, crit: 0.1, level: 19, rarity: "mythic", recipe: { essence: 28, pearl: 6, leather: 24, crystal: 12 }, requires: ["wb-witch", "seal-crypt"], color: "#3a2a52" },
  seraph: { name: ["Облачение серафима", "Seraph raiment"], desc: ["Мифический доспех с крыльями ангела и нимбом. Энергия +60, быстрое восстановление.", "Mythic armor with angel wings and a halo. +60 energy, fast recovery."], defense: 30, hp: 110, mana: 60, regen: 0.8, level: 20, rarity: "mythic", recipe: { essence: 30, pearl: 8, crystal: 20, ore: 20 }, requires: ["seal-citadel", "eclipseDefeated"], color: "#f4ead0" },
});
export const mythicRequirementNames = {
  "seal-crypt": ["Костяной король повержен", "Bone King defeated"],
  "seal-mine": ["Ледяной тиран повержен", "Frost Tyrant defeated"],
  "seal-abyss": ["Матка глубин повержена", "Brood Queen defeated"],
  "seal-citadel": ["Повелитель бури повержен", "Storm Lord defeated"],
  eclipseDefeated: ["Нерей Бессветный повержен", "Nerei the Lightless defeated"],
  "wb-treant": ["Древень Мшистый повержен", "Mossbark defeated"],
  "wb-sandWorm": ["Песчаный червь повержен", "Sand Worm defeated"],
  "wb-witch": ["Болотная ведьма повержена", "Marsh Witch defeated"],
  "wb-banditKing": ["Атаман Кривой Клык повержен", "Crookfang defeated"],
  "wb-cyclops": ["Циклоп повержен", "Cyclops defeated"],
  "wb-frostWyrm": ["Ледяной змей повержен", "Frost Wyrm defeated"],
};
export const missingRequirements = (save, item) => (item.requires || []).filter((f) => !save.flags?.[f]);
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
  ({ warrior: "sword", ranger: "bow", mage: "staff", paladin: "mace", necromancer: "boneWand", summoner: "totemStaff", shapeshifter: "druidClaws", monk: "handWraps", engineer: "flintlock" })[cls];
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
    race = raceOf(save),
    pieces = wearableStats(save);
  const power =
    (base.damage +
      (save.level - 1) * 2 +
      Math.min(6, save.weaponLevel) * 3 +
      (m.precision || 0) * 2) *
    (1 + (race.damage || 0) + (save.flags?.duskPower ? 0.12 : 0) + (save.flags?.obeliskPower ? 0.05 : 0));
  return {
    ...base,
    weapon: w,
    armor: a,
    race,
    maxHp:
      base.hp +
      (race.hp || 0) +
      (save.level - 1) * 10 +
      (a.hp || 0) +
      (a === armors.none ? 0 : Math.min(6, save.armorLevel) * 10) +
      (m.vitality || 0) * 8 +
      pieces.hp +
      (save.flags?.guardianBlessing ? 40 : 0),
    maxMana:
      base.mana +
      (race.mana || 0) +
      (save.level - 1) * 5 +
      (a.mana || 0) +
      (m.focus || 0) * 6 +
      pieces.mana,
    damage: Math.round(power * w.multiplier + (w.bonus || 0)),
    skillDamage: power + (w.bonus || 0) * 0.5,
    range: w.range + pieces.range,
    cooldown: w.cooldown,
    speed: base.speed + (race.speed || 0) + (w.speed || 0) + (a.speed || 0) + pieces.speed,
    defense:
      (race.defense || 0) +
      a.defense +
      (a === armors.none ? 0 : Math.min(6, save.armorLevel) * 2) +
      pieces.defense,
    manaRegen: 0.95 + (a.regen || 0) + (m.focus || 0) * 0.12,
  };
}

export { skillTrees } from "./abilities.js";
export const skillConfig = configureAbility;
export const upgradeSkill = upgradeAbility;

// 2.3: epic and legendary crafts for every class, and one mythic weapon each with its own look.
const forge = [
  ["warrior", "berserkAxe", "Топор берсерка", "Berserker axe", { kind: "melee", icon: "sword", appearance: "axe", multiplier: 1.7, cooldown: 0.62, range: 66, arc: 1.8, crit: 0.08, lifesteal: 0.04, bonus: 10, level: 11, price: 980, recipe: { ore: 14, leather: 8, essence: 5 }, rarity: "epic", color: "#e0a07a" }, ["Крит +8%, вампиризм 4%. Чем ближе враг, тем страшнее.", "+8% crit, 4% life steal. The closer the foe, the worse for them."]],
  ["warrior", "dragonbane", "Драконья погибель", "Dragonbane", { kind: "melee", icon: "sword", appearance: "greatsword", multiplier: 2, cooldown: 0.62, range: 88, arc: 1.9, element: "fire", burn: 4, crit: 0.1, bonus: 18, level: 15, recipe: { ore: 22, essence: 12, crystal: 8 }, rarity: "legendary", color: "#ff8a4a" }, ["Легендарный двуручник: поджог на 4 с, крит +10%. Только крафт.", "Legendary greatsword: 4 s burn, +10% crit. Craft only."]],
  ["warrior", "ragnarok", "Пламя Рагнарёка", "Flame of Ragnarok", { kind: "melee", icon: "sword", appearance: "infernoBlade", multiplier: 2.6, cooldown: 0.6, range: 104, arc: 2.1, element: "fire", burn: 5, splash: 50, crit: 0.12, lifesteal: 0.05, bonus: 32, level: 20, recipe: { essence: 22, ore: 30, crystal: 14, wood: 10 }, requires: ["seal-citadel", "wb-cyclops"], rarity: "mythic", color: "#ff5a1a" }, ["Мифический огненный меч. Взрыв пламени вокруг цели, поджог, крит +12%, вампиризм 5%.", "Mythic flaming sword. Flame bursts around the target, burn, +12% crit, 5% life steal."]],
  ["ranger", "windrunner", "Бегущий с ветром", "Windrunner", { kind: "ranged", icon: "bow", appearance: "bow", multiplier: 1.35, cooldown: 0.3, range: 330, speed: 8, crit: 0.08, bonus: 9, level: 11, price: 960, recipe: { wood: 12, leather: 8, essence: 4 }, rarity: "epic", color: "#bfe8c0" }, ["Скорострельный лук: скорость +8, крит +8%.", "Rapid bow: +8 speed, +8% crit."]],
  ["ranger", "northstar", "Северная звезда", "North Star", { kind: "ranged", icon: "bow", appearance: "bow", multiplier: 1.85, cooldown: 0.42, range: 400, element: "ice", slow: 2, pierce: 3, crit: 0.12, bonus: 18, level: 15, recipe: { wood: 18, crystal: 12, essence: 12 }, rarity: "legendary", color: "#a8e4ff" }, ["Легендарный лук: ледяные стрелы пробивают 3 цели и замедляют.", "Legendary bow: ice arrows pierce 3 targets and slow."]],
  ["ranger", "phoenix", "Феникс", "Phoenix", { kind: "ranged", icon: "bow", appearance: "phoenixBow", multiplier: 2.3, cooldown: 0.34, range: 420, element: "fire", burn: 4, pierce: 4, crit: 0.2, bonus: 30, level: 20, recipe: { essence: 22, wood: 26, pearl: 6, crystal: 12 }, requires: ["seal-citadel", "wb-treant"], rarity: "mythic", color: "#ffb03a" }, ["Мифический лук-птица: огненные стрелы пробивают 4 цели, крит +20%.", "Mythic bird-bow: fire arrows pierce 4 targets, +20% crit."]],
  ["mage", "frostfire", "Посох льда и пламени", "Frostfire staff", { kind: "ranged", icon: "staff", appearance: "staff", multiplier: 1.55, cooldown: 0.55, range: 300, element: "fire", burn: 3, splash: 38, bonus: 10, level: 11, price: 990, recipe: { crystal: 12, wood: 6, essence: 5 }, rarity: "epic", color: "#ff9ad0" }, ["Огненные взрывы вокруг цели, поджог 3 с.", "Fiery bursts around the target, 3 s burn."]],
  ["mage", "stormeye", "Око бури", "Eye of the Storm", { kind: "ranged", icon: "staff", appearance: "wand", multiplier: 1.8, cooldown: 0.4, range: 320, element: "lightning", crit: 0.1, bonus: 18, level: 15, recipe: { crystal: 20, essence: 12, ore: 8 }, rarity: "legendary", color: "#d8bdff" }, ["Легендарный жезл: цепные молнии, крит +10%.", "Legendary wand: chain lightning, +10% crit."]],
  ["mage", "genesis", "Скипетр Сотворения", "Scepter of Genesis", { kind: "ranged", icon: "staff", appearance: "cosmicStaff", multiplier: 2.4, cooldown: 0.42, range: 380, element: "void", splash: 60, pierce: 2, crit: 0.12, bonus: 30, level: 20, recipe: { essence: 26, crystal: 30, pearl: 8 }, requires: ["seal-citadel", "wb-frostWyrm"], rarity: "mythic", color: "#9a7aff" }, ["Мифический скипетр со звёздами на орбите. Взрывы пустоты, пробивание 2 целей.", "Mythic scepter with orbiting stars. Void bursts, pierces 2 targets."]],
  ["paladin", "crusader", "Клинок крестоносца", "Crusader blade", { kind: "melee", icon: "sword", appearance: "greatsword", multiplier: 1.7, cooldown: 0.6, range: 76, arc: 1.8, element: "light", lifesteal: 0.04, bonus: 10, level: 11, price: 990, recipe: { ore: 14, crystal: 6, essence: 5 }, rarity: "epic", color: "#ffe9a8" }, ["Свет и вампиризм 4%.", "Light and 4% life steal."]],
  ["paladin", "lightbringer", "Светоносец", "Lightbringer", { kind: "melee", icon: "mace", appearance: "hammer", multiplier: 2.05, cooldown: 0.64, range: 84, arc: 1.9, element: "light", stun: 0.45, crit: 0.08, bonus: 18, level: 15, recipe: { ore: 22, crystal: 12, essence: 12 }, rarity: "legendary", color: "#fff0b0" }, ["Легендарный молот света: оглушение 0,45 с, крит +8%.", "Legendary hammer of light: 0.45 s stun, +8% crit."]],
  ["paladin", "seraphHand", "Длань Серафима", "Hand of the Seraph", { kind: "melee", icon: "mace", appearance: "seraphHammer", multiplier: 2.55, cooldown: 0.62, range: 100, arc: 2.1, element: "light", stun: 0.5, splash: 45, lifesteal: 0.06, bonus: 32, level: 20, recipe: { essence: 24, ore: 28, pearl: 6, crystal: 14 }, requires: ["seal-citadel", "wb-banditKing"], rarity: "mythic", color: "#fff4c0" }, ["Мифический крылатый молот с нимбом. Удар света вокруг цели, вампиризм 6%.", "Mythic winged hammer with a halo. Light bursts around the target, 6% life steal."]],
  ["necromancer", "bonecaller", "Зов костей", "Bonecaller", { kind: "ranged", icon: "bone", appearance: "skullstaff", multiplier: 1.5, cooldown: 0.5, range: 290, element: "void", pierce: 3, bonus: 10, level: 11, price: 980, recipe: { ore: 8, essence: 6, wood: 6 }, rarity: "epic", color: "#d0c8ff" }, ["Снаряды тьмы пробивают 3 цели.", "Void bolts pierce 3 targets."]],
  ["necromancer", "weeper", "Коса Плакальщицы", "Weeper's scythe", { kind: "melee", icon: "scythe", appearance: "scythe", multiplier: 2, cooldown: 0.58, range: 92, arc: 2.1, element: "void", lifesteal: 0.08, crit: 0.08, bonus: 18, level: 15, recipe: { ore: 16, essence: 14, leather: 8 }, rarity: "legendary", color: "#b8a0ff" }, ["Легендарная коса: вампиризм 8%, огромный взмах.", "Legendary scythe: 8% life steal, huge sweep."]],
  ["necromancer", "lichCrown", "Филактерия Короля-Лича", "Lich King's Phylactery", { kind: "ranged", icon: "staff", appearance: "lichStaff", multiplier: 2.4, cooldown: 0.44, range: 360, element: "poison", poison: 6, splash: 55, lifesteal: 0.05, bonus: 30, level: 20, recipe: { essence: 28, crystal: 18, pearl: 6, ore: 12 }, requires: ["seal-citadel", "wb-witch"], rarity: "mythic", color: "#7aff9a" }, ["Мифический посох с короной и душами. Ядовитые взрывы, вампиризм 5%.", "Mythic staff with a crown and souls. Poison bursts, 5% life steal."]],
];
for (const [cls, id, ru, en, data, desc] of forge) W(cls, id, ru, en, data, desc);

// 2.6: the Summoner and the Shapeshifter.
const newClassArsenal = [
  ["summoner", "totemStaff", "Тотемный посох", "Totem staff", { kind: "ranged", icon: "staff", appearance: "staff", multiplier: 1, cooldown: 0.5, range: 200, color: "#c8e08a" }, ["Сгусток силы природы. Школа стаи.", "A bolt of nature's power. Pack school."]],
  ["summoner", "beastWhip", "Звериный хлыст", "Beast whip", { kind: "melee", icon: "sword", appearance: "whip", multiplier: 1.05, cooldown: 0.45, range: 78, arc: 0.7, price: 90, color: "#c8a070" }, ["Длинный хлёсткий удар. Школа медведя.", "A long lashing strike. Bear school."]],
  ["summoner", "antlerWand", "Рогатый жезл", "Antler wand", { kind: "ranged", icon: "staff", appearance: "wand", multiplier: 0.85, cooldown: 0.38, range: 230, price: 90, color: "#e8d8a0" }, ["Быстрые выстрелы. Школа неба.", "Rapid shots. Sky school."]],
  ["summoner", "packStaff", "Посох вожака", "Packleader staff", { kind: "ranged", icon: "staff", appearance: "staff", multiplier: 1.25, cooldown: 0.5, range: 240, bonus: 3, level: 3, price: 220, rarity: "rare", color: "#d0e890" }, ["Надёжный посох для призывателя.", "A dependable staff for a summoner."]],
  ["summoner", "thornWhip", "Терновый хлыст", "Thorn whip", { kind: "melee", icon: "sword", appearance: "whip", multiplier: 1.4, cooldown: 0.45, range: 84, arc: 0.8, poison: 3, bonus: 5, level: 7, price: 480, recipe: { wood: 6, leather: 6, essence: 2 }, rarity: "rare", color: "#8ad04a" }, ["Шипы отравляют на 3 с.", "Thorns poison for 3 s."]],
  ["summoner", "alphaTotem", "Тотем альфы", "Alpha totem", { kind: "ranged", icon: "staff", appearance: "staff", multiplier: 1.5, cooldown: 0.5, range: 270, crit: 0.08, bonus: 8, level: 9, price: 720, recipe: { wood: 10, essence: 4, leather: 4 }, rarity: "epic", color: "#f0d070" }, ["Крит +8%.", "+8% crit."]],
  ["summoner", "stormHorn", "Рог бури", "Storm horn", { kind: "ranged", icon: "staff", appearance: "wand", multiplier: 1.6, cooldown: 0.42, range: 290, element: "lightning", bonus: 10, level: 11, price: 980, recipe: { crystal: 10, essence: 5, leather: 6 }, rarity: "epic", color: "#d8bdff" }, ["Молнии с цепным разрядом.", "Lightning with chain discharges."]],
  ["summoner", "worldtree", "Ветвь Мирового древа", "Worldtree branch", { kind: "ranged", icon: "staff", appearance: "staff", multiplier: 1.9, cooldown: 0.44, range: 320, element: "poison", poison: 4, splash: 40, bonus: 18, level: 15, recipe: { wood: 24, essence: 12, crystal: 8 }, rarity: "legendary", color: "#9ae06a" }, ["Легендарная ветвь: ядовитые взрывы вокруг цели.", "Legendary branch: poisonous bursts around the target."]],
  ["summoner", "broodWhip", "Хлыст матки", "Brood whip", { kind: "melee", icon: "sword", appearance: "whip", multiplier: 1.7, cooldown: 0.44, range: 90, arc: 0.9, element: "poison", poison: 5, bonus: 12, level: 10, source: "abyss", rarity: "epic", color: "#b8ec8d" }, ["Трофей Матки глубин.", "Brood Queen trophy."]],
  ["summoner", "thunderHorn", "Рог Повелителя бури", "Stormlord horn", { kind: "ranged", icon: "staff", appearance: "wand", multiplier: 2, cooldown: 0.4, range: 330, element: "lightning", bonus: 18, level: 14, source: "citadel", rarity: "legendary", color: "#ded0fb" }, ["Трофей Повелителя бури.", "Storm Lord trophy."]],
  ["summoner", "beastlord", "Скипетр Повелителя зверей", "Scepter of the Beastlord", { kind: "ranged", icon: "staff", appearance: "beastStaff", multiplier: 2.4, cooldown: 0.42, range: 360, element: "poison", splash: 55, crit: 0.12, bonus: 30, level: 20, recipe: { essence: 26, wood: 30, leather: 20, pearl: 6 }, requires: ["seal-citadel", "wb-treant"], rarity: "mythic", color: "#ffd060" }, ["Мифический скипетр с духом волка. Призванные звери сильнее.", "Mythic scepter with a wolf spirit. Summoned beasts grow stronger."]],
  ["shapeshifter", "druidClaws", "Когти друида", "Druid claws", { kind: "melee", icon: "daggers", appearance: "claws", multiplier: 0.9, cooldown: 0.32, range: 48, arc: 1.2, color: "#e8e0c8" }, ["Быстрые удары когтями. Школа волка.", "Quick claw strikes. Wolf school."]],
  ["shapeshifter", "oakMaul", "Дубовая палица", "Oak maul", { kind: "melee", icon: "mace", appearance: "hammer", multiplier: 1.4, cooldown: 0.65, range: 58, arc: 1.6, stun: 0.25, price: 90, color: "#a08050" }, ["Тяжёлый удар. Школа медведя.", "A heavy blow. Bear school."]],
  ["shapeshifter", "featherStaff", "Посох пера", "Feather staff", { kind: "ranged", icon: "staff", appearance: "staff", multiplier: 0.95, cooldown: 0.45, range: 220, price: 90, color: "#c8d8e8" }, ["Ветер срывается с посоха. Школа ворона.", "Wind leaps from the staff. Raven school."]],
  ["shapeshifter", "fangClaws", "Клыкастые когти", "Fanged claws", { kind: "melee", icon: "daggers", appearance: "claws", multiplier: 1.15, cooldown: 0.3, range: 50, arc: 1.2, crit: 0.06, bonus: 3, level: 3, price: 220, rarity: "rare", color: "#f0e8d0" }, ["Крит +6%.", "+6% crit."]],
  ["shapeshifter", "ironbark", "Железная кора", "Ironbark maul", { kind: "melee", icon: "mace", appearance: "hammer", multiplier: 1.6, cooldown: 0.66, range: 62, arc: 1.7, stun: 0.35, bonus: 6, level: 7, price: 480, recipe: { wood: 10, ore: 6 }, rarity: "rare", color: "#8a7050" }, ["Оглушение 0,35 с.", "0.35 s stun."]],
  ["shapeshifter", "moonClaws", "Лунные когти", "Moon claws", { kind: "melee", icon: "daggers", appearance: "claws", multiplier: 1.35, cooldown: 0.29, range: 52, arc: 1.3, lifesteal: 0.05, bonus: 8, level: 9, price: 720, recipe: { crystal: 6, leather: 6, essence: 4 }, rarity: "epic", color: "#d8e0ff" }, ["Вампиризм 5%.", "5% life steal."]],
  ["shapeshifter", "galeStaff", "Посох бури", "Gale staff", { kind: "ranged", icon: "staff", appearance: "staff", multiplier: 1.55, cooldown: 0.44, range: 290, pierce: 3, bonus: 10, level: 11, price: 980, recipe: { wood: 10, crystal: 8, essence: 5 }, rarity: "epic", color: "#bfe8d0" }, ["Ветер пробивает 3 цели.", "Wind pierces 3 targets."]],
  ["shapeshifter", "primalClaws", "Первобытные когти", "Primal claws", { kind: "melee", icon: "daggers", appearance: "claws", multiplier: 1.8, cooldown: 0.28, range: 56, arc: 1.4, crit: 0.12, lifesteal: 0.06, bonus: 18, level: 15, recipe: { leather: 20, essence: 12, crystal: 8 }, rarity: "legendary", color: "#ffe0a0" }, ["Легендарные когти: крит +12%, вампиризм 6%.", "Legendary claws: +12% crit, 6% life steal."]],
  ["shapeshifter", "frostFangs", "Клыки мерзлоты", "Frost fangs", { kind: "melee", icon: "daggers", appearance: "claws", multiplier: 1.5, cooldown: 0.3, range: 52, arc: 1.3, element: "ice", slow: 1.6, bonus: 8, level: 7, source: "mine", rarity: "epic", color: "#a8e4f6" }, ["Трофей Ледяного тирана.", "Frost Tyrant trophy."]],
  ["shapeshifter", "stormTalons", "Когти бури", "Storm talons", { kind: "melee", icon: "daggers", appearance: "claws", multiplier: 2, cooldown: 0.28, range: 58, arc: 1.4, element: "lightning", bonus: 18, level: 14, source: "citadel", rarity: "legendary", color: "#ded0fb" }, ["Трофей Повелителя бури.", "Storm Lord trophy."]],
  ["shapeshifter", "worldbeast", "Клыки Первозверя", "Fangs of the First Beast", { kind: "melee", icon: "daggers", appearance: "beastClaws", multiplier: 2.5, cooldown: 0.27, range: 64, arc: 1.6, element: "fire", burn: 4, crit: 0.18, lifesteal: 0.06, bonus: 30, level: 20, recipe: { essence: 26, leather: 30, crystal: 14, pearl: 6 }, requires: ["seal-citadel", "wb-frostWyrm"], rarity: "mythic", color: "#ff7a3a" }, ["Мифические пылающие когти. В зверином облике бьют ещё сильнее.", "Mythic blazing claws. Even stronger in beast form."]],
];
for (const [cls, id, ru, en, data, desc] of newClassArsenal) W(cls, id, ru, en, data, desc);

// 2.7: the Monk and the Engineer.
const monkAndEngineer = [
  ["monk", "handWraps", "Боевые бинты", "Hand wraps", { kind: "melee", icon: "hand", appearance: "fists", multiplier: 0.8, cooldown: 0.28, range: 42, arc: 0.9, color: "#f4e0c0" }, ["Молниеносные удары кулаками. Школа кулака.", "Lightning-fast punches. Fist school."]],
  ["monk", "boStaff", "Шест", "Bo staff", { kind: "melee", icon: "staff", appearance: "spear", multiplier: 1.1, cooldown: 0.44, range: 80, arc: 1.5, price: 90, color: "#c8a070" }, ["Широкий удар шестом. Школа ветра.", "A wide staff sweep. Wind school."]],
  ["monk", "ironKnuckles", "Железные кастеты", "Iron knuckles", { kind: "melee", icon: "hand", appearance: "fists", multiplier: 1, cooldown: 0.34, range: 42, arc: 0.9, stun: 0.2, price: 90, color: "#b8c4c8" }, ["Тяжёлые кулаки ненадолго оглушают. Школа духа.", "Heavy fists briefly stun. Spirit school."]],
  ["monk", "dragonWraps", "Бинты дракона", "Dragon wraps", { kind: "melee", icon: "hand", appearance: "fists", multiplier: 1.05, cooldown: 0.27, range: 44, arc: 0.9, crit: 0.06, bonus: 3, level: 3, price: 220, rarity: "rare", color: "#ff9a5a" }, ["Крит +6%.", "+6% crit."]],
  ["monk", "jadeStaff", "Нефритовый шест", "Jade staff", { kind: "melee", icon: "staff", appearance: "spear", multiplier: 1.45, cooldown: 0.42, range: 86, arc: 1.6, bonus: 5, level: 7, price: 480, recipe: { wood: 6, crystal: 4 }, rarity: "rare", color: "#7ad8a0" }, ["Удар нефритом по широкой дуге.", "A wide jade sweep."]],
  ["monk", "thunderFists", "Громовые кулаки", "Thunder fists", { kind: "melee", icon: "hand", appearance: "fists", multiplier: 1.3, cooldown: 0.27, range: 46, arc: 1, element: "lightning", bonus: 8, level: 9, price: 720, recipe: { ore: 8, crystal: 6, essence: 4 }, rarity: "epic", color: "#d8bdff" }, ["Удары молнией.", "Lightning strikes."]],
  ["monk", "celestialStaff", "Небесный шест", "Celestial staff", { kind: "melee", icon: "staff", appearance: "spear", multiplier: 1.95, cooldown: 0.4, range: 94, arc: 1.8, element: "light", crit: 0.1, bonus: 18, level: 15, recipe: { wood: 16, crystal: 14, essence: 12 }, rarity: "legendary", color: "#fff0b0" }, ["Легендарный шест света, крит +10%.", "Legendary staff of light, +10% crit."]],
  ["monk", "frostKnuckles", "Кулаки мерзлоты", "Frost knuckles", { kind: "melee", icon: "hand", appearance: "fists", multiplier: 1.4, cooldown: 0.28, range: 44, arc: 1, element: "ice", slow: 1.5, bonus: 8, level: 7, source: "mine", rarity: "epic", color: "#a8e4f6" }, ["Трофей Ледяного тирана.", "Frost Tyrant trophy."]],
  ["monk", "stormWraps", "Бинты бури", "Storm wraps", { kind: "melee", icon: "hand", appearance: "fists", multiplier: 1.9, cooldown: 0.26, range: 48, arc: 1.1, element: "lightning", bonus: 18, level: 14, source: "citadel", rarity: "legendary", color: "#ded0fb" }, ["Трофей Повелителя бури.", "Storm Lord trophy."]],
  ["monk", "skyDragon", "Кулаки Небесного дракона", "Fists of the Sky Dragon", { kind: "melee", icon: "hand", appearance: "dragonFists", multiplier: 2.4, cooldown: 0.24, range: 52, arc: 1.2, element: "fire", burn: 4, crit: 0.18, lifesteal: 0.05, bonus: 30, level: 20, recipe: { essence: 26, leather: 24, crystal: 16, pearl: 6 }, requires: ["seal-citadel", "wb-cyclops"], rarity: "mythic", color: "#ff7a3a" }, ["Мифические кулаки: каждый удар — рёв огненного дракона.", "Mythic fists: every blow is a fire dragon's roar."]],
  ["monk", "spiritBead", "Чётки духа", "Spirit beads", { kind: "melee", icon: "hand", appearance: "fists", multiplier: 1.2, cooldown: 0.28, range: 44, arc: 1, lifesteal: 0.04, bonus: 6, level: 11, price: 960, recipe: { crystal: 8, essence: 5, fiber: 8 }, rarity: "epic", color: "#f0d080" }, ["Вампиризм 4%.", "4% life steal."]],
  ["engineer", "flintlock", "Кремнёвое ружьё", "Flintlock", { kind: "ranged", icon: "crossbow", appearance: "gun", multiplier: 1.1, cooldown: 0.55, range: 240, color: "#e8c080" }, ["Меткий выстрел. Школа взрывчатки.", "A precise shot. Explosives school."]],
  ["engineer", "heavyWrench", "Тяжёлый ключ", "Heavy wrench", { kind: "melee", icon: "mace", appearance: "wrench", multiplier: 1.2, cooldown: 0.5, range: 56, arc: 1.4, stun: 0.2, price: 90, color: "#b8c4c8" }, ["Удар ключом. Школа механизмов.", "A wrench blow. Machinery school."]],
  ["engineer", "pocketCrossbow", "Карманный арбалет", "Pocket crossbow", { kind: "ranged", icon: "crossbow", appearance: "crossbow", multiplier: 0.85, cooldown: 0.38, range: 220, price: 90, color: "#c8a070" }, ["Быстрая стрельба. Школа алхимии.", "Rapid fire. Alchemy school."]],
  ["engineer", "doubleBarrel", "Двустволка", "Double barrel", { kind: "ranged", icon: "crossbow", appearance: "gun", multiplier: 1.3, cooldown: 0.55, range: 230, pierce: 2, bonus: 3, level: 3, price: 220, rarity: "rare", color: "#e8c080" }, ["Пробивает 2 цели.", "Pierces 2 targets."]],
  ["engineer", "powerWrench", "Паровой ключ", "Steam wrench", { kind: "melee", icon: "mace", appearance: "wrench", multiplier: 1.55, cooldown: 0.52, range: 60, arc: 1.5, stun: 0.35, bonus: 5, level: 7, price: 480, recipe: { ore: 10, wood: 2 }, rarity: "rare", color: "#c8d0d8" }, ["Оглушение 0,35 с.", "0.35 s stun."]],
  ["engineer", "arcRifle", "Дуговая винтовка", "Arc rifle", { kind: "ranged", icon: "crossbow", appearance: "gun", multiplier: 1.55, cooldown: 0.5, range: 290, element: "lightning", bonus: 8, level: 9, price: 720, recipe: { ore: 8, crystal: 8, essence: 4 }, rarity: "epic", color: "#d8bdff" }, ["Молнии с цепным разрядом.", "Lightning with chain discharges."]],
  ["engineer", "dragonCannon", "Драконья пушка", "Dragon cannon", { kind: "ranged", icon: "crossbow", appearance: "gun", multiplier: 1.95, cooldown: 0.6, range: 320, element: "fire", burn: 4, splash: 50, bonus: 18, level: 15, recipe: { ore: 24, crystal: 10, essence: 12 }, rarity: "legendary", color: "#ff8a4a" }, ["Легендарная пушка: огненные взрывы.", "Legendary cannon: fiery explosions."]],
  ["engineer", "frostRifle", "Морозная винтовка", "Frost rifle", { kind: "ranged", icon: "crossbow", appearance: "gun", multiplier: 1.5, cooldown: 0.5, range: 290, element: "ice", slow: 2, bonus: 8, level: 7, source: "mine", rarity: "epic", color: "#a8e4f6" }, ["Трофей Ледяного тирана.", "Frost Tyrant trophy."]],
  ["engineer", "stormCannon", "Пушка бури", "Storm cannon", { kind: "ranged", icon: "crossbow", appearance: "gun", multiplier: 2, cooldown: 0.5, range: 330, element: "lightning", bonus: 18, level: 14, source: "citadel", rarity: "legendary", color: "#ded0fb" }, ["Трофей Повелителя бури.", "Storm Lord trophy."]],
  ["engineer", "worldbreaker", "Разрушитель миров", "Worldbreaker", { kind: "ranged", icon: "crossbow", appearance: "worldCannon", multiplier: 2.4, cooldown: 0.5, range: 380, element: "fire", splash: 70, burn: 4, crit: 0.12, bonus: 30, level: 20, recipe: { essence: 26, ore: 36, crystal: 16, pearl: 6 }, requires: ["seal-citadel", "wb-banditKing"], rarity: "mythic", color: "#ffb03a" }, ["Мифическая паровая пушка с пылающим ядром.", "Mythic steam cannon with a blazing core."]],
  ["engineer", "gearbow", "Шестерёночный арбалет", "Gear crossbow", { kind: "ranged", icon: "crossbow", appearance: "crossbow", multiplier: 1.25, cooldown: 0.36, range: 260, crit: 0.06, bonus: 6, level: 11, price: 960, recipe: { ore: 10, wood: 6, essence: 4 }, rarity: "epic", color: "#e0c890" }, ["Скорострельный, крит +6%.", "Rapid-fire, +6% crit."]],
];
for (const [cls, id, ru, en, data, desc] of monkAndEngineer) W(cls, id, ru, en, data, desc);

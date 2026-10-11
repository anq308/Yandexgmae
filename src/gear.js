const g = (slot, ru, en, defense, hp, price, recipe, extra = {}) => ({
  slot,
  name: [ru, en],
  defense,
  hp,
  price,
  recipe,
  level: 1,
  ...extra,
});
export const wearables = {
  linenCap: g(
    "head",
    "Льняной колпак",
    "Linen cap",
    1,
    3,
    30,
    { fiber: 3 },
    { color: "#bca983" },
  ),
  linenPants: g(
    "legs",
    "Льняные штаны",
    "Linen trousers",
    1,
    5,
    40,
    { fiber: 4 },
    { color: "#a89875" },
  ),
  sandals: g(
    "feet",
    "Кожаные сандалии",
    "Sandals",
    1,
    3,
    35,
    { leather: 2, fiber: 1 },
    { speed: 2, color: "#aa7855" },
  ),
  leatherHood: g(
    "head",
    "Кожаный капюшон",
    "Leather hood",
    2,
    8,
    70,
    { leather: 3, fiber: 1 },
    { level: 2, color: "#916542" },
  ),
  leatherPants: g(
    "legs",
    "Кожаные поножи",
    "Leather leggings",
    3,
    10,
    90,
    { leather: 4, fiber: 2 },
    { level: 2, color: "#916542" },
  ),
  leatherBoots: g(
    "feet",
    "Сапоги охотника",
    "Hunter boots",
    2,
    6,
    80,
    { leather: 3, wood: 1 },
    { level: 2, speed: 4, color: "#75543c" },
  ),
  ironHelm: g(
    "head",
    "Железный шлем",
    "Iron helmet",
    4,
    12,
    180,
    { ore: 5, leather: 1 },
    { level: 5, color: "#9daeb3" },
  ),
  ironGreaves: g(
    "legs",
    "Железные поножи",
    "Iron greaves",
    5,
    18,
    210,
    { ore: 7, leather: 2 },
    { level: 5, color: "#9daeb3" },
  ),
  ironBoots: g(
    "feet",
    "Железные сапоги",
    "Iron boots",
    4,
    12,
    190,
    { ore: 5, leather: 2 },
    { level: 5, speed: -2, color: "#9daeb3" },
  ),
  runeHood: g(
    "head",
    "Капюшон рун",
    "Runic hood",
    5,
    16,
    0,
    { essence: 3, crystal: 4, fiber: 4 },
    { level: 10, mana: 15, color: "#aaa0c7" },
  ),
  runePants: g(
    "legs",
    "Рунные поножи",
    "Runic leggings",
    6,
    22,
    0,
    { essence: 4, ore: 6, fiber: 4 },
    { level: 10, color: "#aaa0c7" },
  ),
  runeBoots: g(
    "feet",
    "Сапоги странника",
    "Wayfarer boots",
    5,
    18,
    0,
    { essence: 3, leather: 5, crystal: 3 },
    { level: 10, speed: 6, color: "#aaa0c7" },
  ),
  buckler: g(
    "offhand",
    "Деревянный щит",
    "Wooden buckler",
    3,
    10,
    65,
    { wood: 4, ore: 1 },
    { class: "warrior", color: "#95784b" },
  ),
  quiver: g(
    "offhand",
    "Колчан следопыта",
    "Ranger quiver",
    1,
    6,
    65,
    { leather: 3, wood: 2 },
    { class: "ranger", range: 20, color: "#95784b" },
  ),
  focus: g(
    "offhand",
    "Кристалл фокусировки",
    "Focus crystal",
    1,
    5,
    65,
    { crystal: 3, fiber: 2 },
    { class: "mage", mana: 20, color: "#a1d4da" },
  ),
};
wearables.holySymbol = g(
  "offhand",
  "Святой оберег",
  "Holy symbol",
  3,
  14,
  140,
  { ore: 3, crystal: 2 },
  { class: "paladin", mana: 10, color: "#f0d27a" },
);
wearables.boneCharm = g(
  "offhand",
  "Костяной амулет",
  "Bone charm",
  1,
  8,
  140,
  { leather: 2, crystal: 2 },
  { class: "necromancer", mana: 22, color: "#d8e8c8" },
);
wearables.packHorn = g("offhand", "Рог стаи", "Pack horn", 2, 10, 140, { leather: 3, wood: 2 }, { class: "summoner", mana: 15, color: "#c8a070" });
wearables.beastTotem = g("offhand", "Тотем зверя", "Beast totem", 3, 12, 140, { wood: 3, leather: 2 }, { class: "shapeshifter", hp: 10, color: "#8ac070" });
wearables.prayerBeads = g("offhand", "Молитвенные чётки", "Prayer beads", 2, 10, 140, { fiber: 3, crystal: 1 }, { class: "monk", mana: 12, color: "#c89a5a" });
wearables.toolbelt = g("offhand", "Пояс с инструментами", "Toolbelt", 3, 12, 140, { leather: 3, ore: 2 }, { class: "engineer", hp: 10, color: "#8a6a42" });
// Unique trophies of the six world bosses.
for (const [id, slot, ru, en, defense, hp, extra] of [
  ["rootCrown", "head", "Венец из корней", "Crown of roots", 5, 50, { level: 6, color: "#6fb24e" }],
  ["wormGreaves", "legs", "Поножи из чешуи червя", "Wormscale greaves", 9, 35, { level: 7, color: "#c89a5a" }],
  ["hexHood", "head", "Капюшон ведьмы", "Hexweaver hood", 3, 20, { level: 8, mana: 40, color: "#4a2f6a" }],
  ["fangBoots", "feet", "Сапоги Кривого Клыка", "Crookfang boots", 5, 20, { level: 9, speed: 8, color: "#7a4a2a" }],
  ["cyclopsEye", "offhand", "Око циклопа", "Cyclops eye", 4, 30, { level: 11, mana: 20, range: 20, color: "#3a6ad0" }],
  ["wyrmHelm", "head", "Шлем Хладокрыла", "Rimewing helm", 10, 45, { level: 13, color: "#9ee4f6" }],
])
  wearables[id] = g(slot, ru, en, defense, hp, 0, null, { ...extra, source: "worldboss" });
// Some pieces sharpen the eye: critical chance bonuses.
for (const [id, crit] of [["leatherHood", 0.02], ["quiver", 0.03], ["fangBoots", 0.03], ["cyclopsEye", 0.05], ["hexHood", 0.02]])
  wearables[id].crit = crit;
wearables.dawnCirclet = g(
  "head",
  "Венец рассвета",
  "Circlet of Dawn",
  8,
  40,
  0,
  null,
  { level: 16, mana: 25, speed: 4, source: "eclipse", color: "#f2d98a" },
);
export const emptyWearables = () => ({
  head: null,
  legs: null,
  feet: null,
  offhand: null,
});
export const equippedPieces = (s) =>
  Object.values(s.equippedWearables || {})
    .map((id) => wearables[id])
    .filter(Boolean);
export function wearableStats(s) {
  const out = { defense: 0, hp: 0, mana: 0, speed: 0, range: 0, crit: 0 };
  for (const a of equippedPieces(s))
    for (const k of Object.keys(out)) out[k] += a[k] || 0;
  return out;
}
export const slotNames = {
  head: ["Голова", "Head"],
  chest: ["Корпус", "Chest"],
  legs: ["Ноги", "Legs"],
  feet: ["Ступни", "Feet"],
  mainhand: ["Правая рука", "Main hand"],
  offhand: ["Левая рука", "Off hand"],
};
export const recipes = [
  { id: "cap", name: ["Льняной колпак", "Linen cap"], inputs: {fiber:3}, output: {}, gear: "linenCap" },
  { id: "pants", name: ["Льняные штаны", "Linen trousers"], inputs: {fiber:4}, output: {}, gear: "linenPants" },
  { id: "sandals", name: ["Кожаные сандалии", "Sandals"], inputs: {leather:2,fiber:1}, output: {}, gear: "sandals" },
  { id: "hood", name: ["Кожаный капюшон", "Leather hood"], inputs: {leather:3,fiber:1}, output: {}, gear: "leatherHood" },
  {
    id: "rod",
    name: ["Удочка", "Fishing rod"],
    inputs: { wood: 2, fiber: 1 },
    output: { rod: 1 },
  },
  {
    id: "bait",
    name: ["Наживка", "Bait"],
    inputs: { herb: 1, fiber: 1 },
    output: { bait: 3 },
  },
  {
    id: "bandage",
    name: ["Перевязка", "Bandage"],
    inputs: { fiber: 2, herb: 1 },
    output: { bandage: 1 },
  },
  {
    id: "fish",
    name: ["Рыба на углях", "Grilled fish"],
    inputs: { rawFish: 2, wood: 1 },
    output: { cookedFish: 2 },
    camp: true,
  },
  {
    id: "potion",
    name: ["Зелье здоровья", "Health potion"],
    inputs: { herb: 3 },
    output: { potion: 1 },
  },
  {
    id: "mana",
    name: ["Зелье энергии", "Energy potion"],
    inputs: { crystal: 1 },
    output: { manaPotion: 1 },
  },
];

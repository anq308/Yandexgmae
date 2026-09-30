export let language = "ru";
export function setLanguage(lang) {
  language = lang === "ru" ? "ru" : "en";
  document.documentElement.lang = language;
  document.title =
    language === "ru"
      ? "Эльдерия · Хроники забытой долины"
      : "Elderia · Chronicles of the Forgotten Valley";
}
export const tr = (ru, en) => (language === "ru" ? ru : en);
export const classes = {
  warrior: {
    name: ["Воин", "Warrior"],
    tagline: ["Сила и отвага", "Strength & courage"],
    desc: [
      "Начинает в дорожной одежде. Клинок, броню и силу придётся заслужить.",
      "Starts in travel clothes. Earn better blades, armor and power.",
    ],
    color: "#dbae73",
    hp: 140,
    mana: 70,
    damage: 16,
    speed: 110,
    range: 54,
    cooldown: 0.43,
    skill: ["Вихрь клинков", "Blade whirlwind"],
    skillDesc: [
      "Круговой удар поражает всех врагов рядом.",
      "A spinning strike hits every nearby enemy.",
    ],
    weapon: ["Стальной меч", "Steel sword"],
    icon: "sword",
  },
  ranger: {
    name: ["Следопыт", "Ranger"],
    tagline: ["Ловкость и точность", "Agility & precision"],
    desc: [
      "Знает лесные тропы и бьёт без промаха. Быстрее ветра, тише листвы.",
      "Knows every woodland trail. Swifter than wind, quieter than leaves.",
    ],
    color: "#9ac59e",
    hp: 105,
    mana: 90,
    damage: 12,
    speed: 128,
    range: 235,
    cooldown: 0.33,
    skill: ["Залп стрел", "Arrow volley"],
    skillDesc: [
      "Три усиленные стрелы пробивают строй врагов.",
      "Three powerful arrows pierce enemy lines.",
    ],
    weapon: ["Охотничий лук", "Hunting bow"],
    icon: "bow",
  },
  mage: {
    name: ["Маг", "Mage"],
    tagline: ["Мудрость и магия", "Wisdom & magic"],
    desc: [
      "Превращает древние знания в силу. Управляет светом кристаллов долины.",
      "Turns ancient knowledge into power. Commands the light of the valley’s crystals.",
    ],
    color: "#b6a2da",
    hp: 90,
    mana: 130,
    damage: 20,
    speed: 108,
    range: 210,
    cooldown: 0.62,
    skill: ["Звёздная волна", "Star wave"],
    skillDesc: [
      "Волна света поражает врагов на большой площади.",
      "A wave of light strikes enemies in a wide area.",
    ],
    weapon: ["Посох искры", "Spark staff"],
    icon: "staff",
  },
};
export const label = (pair) => pair[language === "ru" ? 0 : 1];
export const regions = {
  tundra: ["Белая тундра", "White Tundra"],
  highlands: ["Расколотое нагорье", "Shattered Highlands"],
  deadwood: ["Мёртвый лес", "Deadwood"],
  badlands: ["Пепельные пустоши", "Ashen Badlands"],
  frontier: ["Пограничный посёлок", "Frontier Settlement"],
  island: ["Песчаный остров", "Sand Isle"],
  crypt: ["Лиственная гробница", "Leafhaven Crypt"],
  mine: ["Шахты вечного льда", "Everfrost Mines"],
  abyss: ["Провал ядовитых корней", "Venomroot Abyss"],
  citadel: ["Цитадель расколотого неба", "Shattered Sky Citadel"],
  village: ["Лиственная деревня", "Leafhaven Village"],
  meadow: ["Солнечные луга", "Sunlit Meadows"],
  forest: ["Шепчущий лес", "Whispering Woods"],
  mountain: ["Серебряные вершины", "Silver Peaks"],
  outpost: ["Деревня Высокий Ключ", "Highspring Village"],
  ruins: ["Забытые руины", "Forgotten Ruins"],
  lake: ["Озеро тихого света", "Stilllight Lake"],
  amberwood: ["Янтарная роща", "Amberwood Grove"],
  marsh: ["Туманные болота", "Misty Marshes"],
  harbor: ["Речная пристань", "Riverport"],
  coast: ["Лазурный берег", "Azure Coast"],
};
export const items = {
  fiber: ["Волокно", "Fiber"],
  leather: ["Кожа", "Leather"],
  wood: ["Древесина", "Wood"],
  essence: ["Эссенция босса", "Boss essence"],
  herb: ["Лунная трава", "Moonleaf"],
  ore: ["Железная руда", "Iron ore"],
  crystal: ["Светящийся кристалл", "Glowing crystal"],
  potion: ["Зелье здоровья", "Health potion"],
  manaPotion: ["Зелье энергии", "Energy potion"],
};

Object.assign(items, {
  rawFish: ["Свежая рыба", "Raw fish"],
  cookedFish: ["Рыба на углях", "Grilled fish"],
  berry: ["Лесные ягоды", "Wild berries"],
  bait: ["Наживка", "Bait"],
  rod: ["Удочка", "Fishing rod"],
  bandage: ["Перевязка", "Bandage"],
  pearl: ["Жемчуг", "Pearl"],
  warriorScroll: ["Манускрипт воина", "Warrior manuscript"],
  rangerScroll: ["Манускрипт следопыта", "Ranger manuscript"],
  mageScroll: ["Манускрипт мага", "Mage manuscript"],
});

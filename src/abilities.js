// Weapon disciplines share no learned ranks; utility skills belong to the class.
const skill = (
  id,
  name,
  en,
  effect,
  icon,
  source = "practice",
  level = 1,
  extra = {},
) => {
  const descriptions = {
    burst: ["Удар по площади вокруг героя.", "An area strike around the hero."],
    thrust: [
      "Дальний узкий удар по направлению прицеливания.",
      "A long, narrow thrust in your aiming direction.",
    ],
    fan: [
      `Выпускает ${extra.count || 3} снарядов. Пробивает ${extra.pierce || 1} целей.`,
      `Fires ${extra.count || 3} projectiles, piercing ${extra.pierce || 1} targets.`,
    ],
    bulwark: [
      "На 6 секунд снижает входящий урон на 55%.",
      "Reduces incoming damage by 55% for 6 seconds.",
    ],
    impact: [
      "Удар по выбранной области через 0,7 секунды; оглушает обычных врагов.",
      "Hits the target area after 0.7 seconds; stuns normal enemies.",
    ],
    meteor: [
      "Мощный удар по выбранной области через 0,7 секунды.",
      "A powerful strike in the target area after 0.7 seconds.",
    ],
    trap: [
      "Оставляет капкан на 8 секунд: замедление и периодический урон.",
      "A trap lasts 8 seconds, slowing enemies and dealing repeated damage.",
    ],
    field: [
      `Поле на ${extra.duration || 5} секунд: замедление и периодический урон.`,
      `An area lasts ${extra.duration || 5} seconds, slowing enemies and dealing repeated damage.`,
    ],
    charge: [
      "Неуязвимый рывок, затем удар вокруг новой позиции.",
      "An invulnerable dash followed by a strike around your new position.",
    ],
    frostnova: [
      "Ледяной взрыв вокруг героя, замедляющий врагов на 4 секунды.",
      "An icy blast around the hero that slows enemies for 4 seconds.",
    ],
    focus: [
      "Усиливает обычные атаки на 25% на 9 секунд.",
      "Boosts basic attack damage by 25% for 9 seconds.",
    ],
    haste: [
      "Ускоряет движение на 30% на 9 секунд.",
      "Boosts movement speed by 30% for 9 seconds.",
    ],
    restore: ["Восстанавливает 40 энергии.", "Restores 40 energy."],
  };
  const desc = descriptions[effect] || [
    "Осваивается отдельно для этого оружия.",
    "Mastered separately for this weapon.",
  ];
  return {
    id,
    name: [name, en],
    desc: [extra.ru || desc[0], extra.en || desc[1]],
    effect,
    icon,
    source,
    level,
    cost: extra.cost ?? 25,
    cooldown: extra.cooldown ?? 7,
    color: extra.color || "#d9cfaa",
    ...extra,
  };
};
export const disciplines = {
  blade: {
    class: "warrior",
    name: ["Клинок", "Blade"],
    ids: ["whirlwind", "bulwark", "charge"],
  },
  heavy: {
    class: "warrior",
    name: ["Тяжёлое оружие", "Heavy weapons"],
    ids: ["cleave", "heavyGuard", "earthbreaker"],
  },
  pole: {
    class: "warrior",
    name: ["Древковое оружие", "Polearms"],
    ids: ["spearline", "riposte", "lunge"],
  },
  bow: {
    class: "ranger",
    name: ["Лук", "Bow"],
    ids: ["volley", "trap", "mark"],
  },
  crossbow: {
    class: "ranger",
    name: ["Арбалет", "Crossbow"],
    ids: ["piercingBolt", "caltrops", "barrage"],
  },
  blades: {
    class: "ranger",
    name: ["Парные клинки", "Dual blades"],
    ids: ["shadowcut", "vanish", "shadowstep"],
  },
  arcane: {
    class: "mage",
    name: ["Тайная магия", "Arcane"],
    ids: ["starwave", "frostnova", "meteor"],
  },
  ice: {
    class: "mage",
    name: ["Магия льда", "Ice magic"],
    ids: ["icefan", "iceNova", "blizzard"],
  },
  fire: {
    class: "mage",
    name: ["Магия огня", "Fire magic"],
    ids: ["flamewave", "flameward", "inferno"],
  },
  earth: {
    class: "mage",
    name: ["Магия земли", "Earth magic"],
    ids: ["stonewave", "stoneguard", "quake"],
  },
  storm: {
    class: "mage",
    name: ["Магия молнии", "Lightning magic"],
    ids: ["chainlightning", "stormward", "thunderstrike"],
  },
  void: {
    class: "mage",
    name: ["Магия тьмы", "Void magic"],
    ids: ["voidwave", "voidward", "singularity"],
  },
  faith: {
    class: "paladin",
    name: ["Вера", "Faith"],
    ids: ["smite", "holyShield", "consecration"],
  },
  judgment: {
    class: "paladin",
    name: ["Суд", "Judgment"],
    ids: ["judgmentHammer", "zeal", "divineStorm"],
  },
  bone: {
    class: "necromancer",
    name: ["Кость", "Bone"],
    ids: ["boneSpear", "boneArmor", "raiseDead"],
  },
  plague: {
    class: "necromancer",
    name: ["Чума", "Plague"],
    ids: ["plagueNova", "decay", "summonGhouls"],
  },
  reaping: {
    class: "necromancer",
    name: ["Жатва", "Reaping"],
    ids: ["reap", "deathMark", "boneGolem"],
  },
  // 2.4: a fifth way to fight for every class — leaps, rains, orbits, tornadoes and beams.
  fury: { class: "warrior", name: ["Ярость", "Fury"], ids: ["titanLeap", "bladeStorm", "fissure"] },
  wild: { class: "ranger", name: ["Дикая природа", "The wild"], ids: ["arrowRain", "cyclone", "spiritHawks"] },
  cosmos: { class: "mage", name: ["Магия звёзд", "Star magic"], ids: ["starRain", "elementOrbs", "supernova"] },
  heaven: { class: "paladin", name: ["Небеса", "Heavens"], ids: ["heavenLeap", "hammerfall", "dawnRay"] },
  blood: { class: "necromancer", name: ["Кровь", "Blood"], ids: ["bloodStorm", "skullRain", "soulOrbit"] },
  // 2.6: signature schools — what makes each class itself.
  beast: { class: "warrior", name: ["Зверь войны", "Beast of war"], ids: ["warcry", "berserk", "execute"] },
  hunter: { class: "ranger", name: ["Охотник", "Hunter"], ids: ["pointBlank", "smokeBomb", "callBeast"] },
  mind: { class: "mage", name: ["Телекинез", "Telekinesis"], ids: ["telekinesis", "manaShield", "levitate"] },
  ritual: { class: "necromancer", name: ["Тёмный ритуал", "Dark ritual"], ids: ["corpseExplosion", "army", "darkPact"] },
  avatarSchool: { class: "paladin", name: ["Аватар", "Avatar"], ids: ["retribution", "divineShield", "avatar"] },
  pack: { class: "summoner", name: ["Стая", "The pack"], ids: ["summonWolves", "packFrenzy", "alphaHowl"] },
  bearClan: { class: "summoner", name: ["Медведь", "The bear"], ids: ["summonBear", "barkskin", "stampede"] },
  sky: { class: "summoner", name: ["Небо", "The sky"], ids: ["summonHawks", "featherRain", "eagleDive"] },
  lupine: { class: "shapeshifter", name: ["Волк", "The wolf"], ids: ["wolfForm", "bloodHowl", "pounce"] },
  ursine: { class: "shapeshifter", name: ["Медведь", "The bear"], ids: ["bearForm", "maul", "thickHide"] },
  corvid: { class: "shapeshifter", name: ["Ворон", "The raven"], ids: ["ravenForm", "galeFunnel", "murder"] },
  wildShape: { class: "shapeshifter", name: ["Дикий облик", "Wild shape"], ids: ["entangle", "treantForm", "wildMorph"] },
  fist: { class: "monk", name: ["Кулак", "The fist"], ids: ["palmStrike", "flurry", "dragonPalm"] },
  windStep: { class: "monk", name: ["Ветер", "The wind"], ids: ["flyingKick", "whirlKick", "cycloneKick"] },
  spirit: { class: "monk", name: ["Дух", "The spirit"], ids: ["chiWave", "ironBody", "chiOrbs"] },
  explosives: { class: "engineer", name: ["Взрывчатка", "Explosives"], ids: ["bomb", "mineField", "rocketBarrage"] },
  machines: { class: "engineer", name: ["Механизмы", "Machines"], ids: ["turret", "shieldGenerator", "mechGolem"] },
  alchemy: { class: "engineer", name: ["Алхимия", "Alchemy"], ids: ["acidFlask", "flamethrower", "overcharge"] },
};
const groups = {
  duelist: "blade", halberd: "pole", warmaul: "heavy", emberSpear: "pole",
  shortbow: "bow", frostDaggers: "blades", siegeCrossbow: "crossbow", assassinDaggers: "blades",
  apprenticeFlame: "fire", stormRod: "storm", obsidianStaff: "void", graniteStaff: "earth",
  mace: "faith", morningstar: "faith", requiemMace: "faith", purifierCenser: "faith", dawnhammer: "faith",
  templeHammer: "judgment", oathLance: "judgment", justiceHammer: "judgment", oathblade: "judgment", glacierMaul: "judgment", heavenHammer: "judgment",
  boneWand: "bone", cryptWand: "bone", kingScepter: "bone", rimeStaff: "bone", duskstaff: "bone",
  plagueStaff: "plague", soulStaff: "plague", broodWand: "plague",
  reaperScythe: "reaping", harvestScythe: "reaping", stormScythe: "reaping",
  bloodletter: "heavy", dawnblade: "heavy", hawkeye: "bow", dawnbow: "bow", starfall: "arcane", dawnstaff: "arcane",
  totemStaff: "pack", packStaff: "pack", alphaTotem: "pack", worldtree: "pack", beastlord: "pack",
  beastWhip: "bearClan", thornWhip: "bearClan", broodWhip: "bearClan",
  antlerWand: "sky", stormHorn: "sky", thunderHorn: "sky",
  druidClaws: "lupine", fangClaws: "lupine", moonClaws: "lupine", primalClaws: "lupine", frostFangs: "lupine", stormTalons: "lupine", worldbeast: "lupine",
  oakMaul: "ursine", ironbark: "ursine",
  featherStaff: "corvid", galeStaff: "corvid",
  handWraps: "fist", ironKnuckles: "spirit", dragonWraps: "fist", thunderFists: "fist", frostKnuckles: "fist", stormWraps: "fist", skyDragon: "fist", spiritBead: "spirit",
  boStaff: "windStep", jadeStaff: "windStep", celestialStaff: "spirit",
  flintlock: "explosives", doubleBarrel: "explosives", dragonCannon: "explosives", worldbreaker: "explosives", stormCannon: "explosives", frostRifle: "explosives", arcRifle: "alchemy",
  heavyWrench: "machines", powerWrench: "machines",
  pocketCrossbow: "alchemy", gearbow: "alchemy",
  sword: "blade",
  scimitar: "blade",
  greatsword: "heavy",
  axe: "heavy",
  hammer: "heavy",
  flameblade: "heavy",
  titanblade: "heavy",
  spear: "pole",
  frostSpear: "pole",
  bow: "bow",
  longbow: "bow",
  moonbow: "bow",
  venombow: "bow",
  stormbow: "bow",
  crossbow: "crossbow",
  repeater: "crossbow",
  daggers: "blades",
  shadowdaggers: "blades",
  staff: "arcane",
  wand: "arcane",
  moonstaff: "arcane",
  frostStaff: "ice",
  tidestaff: "ice",
  emberstaff: "fire",
  earthstaff: "earth",
  thunderwand: "storm",
  voidstaff: "void",
};
export const weaponDiscipline = (s) =>
  groups[s.equippedWeapon] ||
  { warrior: "blade", ranger: "bow", mage: "arcane", paladin: "faith", necromancer: "bone", summoner: "pack", shapeshifter: "lupine", monk: "fist", engineer: "explosives" }[s.characterClass];
export const abilityCatalog = {};
export function registerBaseSkills(trees) {
  for (const [cls, list] of Object.entries(trees))
    list.forEach(
      (s, i) =>
        (abilityCatalog[s.id] = {
          ...s,
          effect: s.id,
          class: cls,
          source: ["practice", "mentor", "tome"][i],
          color:
            s.id === "meteor"
              ? "#f0af73"
              : cls === "mage"
                ? "#b2d4f5"
                : "#d9cfaa",
        }),
    );
}
const specialized = [
  skill(
    "cleave",
    "Размашистый удар",
    "Heavy cleave",
    "burst",
    "sword",
    "practice",
    1,
    { multiplier: 2.6, radius: 90, stun: 0.5 },
  ),
  skill(
    "heavyGuard",
    "Стойка несокрушимого",
    "Unyielding stance",
    "bulwark",
    "shield",
    "mentor",
    2,
    { cost: 24, cooldown: 12 },
  ),
  skill(
    "earthbreaker",
    "Раскол земли",
    "Earthbreaker",
    "impact",
    "meteor",
    "tome",
    4,
    { multiplier: 3.5, radius: 145, stun: 1.4, color: "#d7b187" },
  ),
  skill(
    "spearline",
    "Прокол строя",
    "Line thrust",
    "thrust",
    "spear",
    "practice",
    1,
    { multiplier: 2.3, radius: 170, cooldown: 6 },
  ),
  skill(
    "riposte",
    "Парирующая стойка",
    "Riposte stance",
    "bulwark",
    "shield",
    "mentor",
    2,
    { cooldown: 10, cost: 20 },
  ),
  skill("lunge", "Копейный выпад", "Spear lunge", "charge", "boot", "tome", 4, {
    multiplier: 3,
    cost: 32,
    cooldown: 12,
  }),
  skill(
    "piercingBolt",
    "Пробивной болт",
    "Piercing bolt",
    "fan",
    "crossbow",
    "practice",
    1,
    { count: 1, pierce: 4, multiplier: 3, cooldown: 7 },
  ),
  skill("caltrops", "Капкан шипов", "Caltrops", "trap", "trap", "mentor", 2, {
    radius: 75,
    cost: 22,
    cooldown: 10,
  }),
  skill(
    "barrage",
    "Серия болтов",
    "Bolt barrage",
    "fan",
    "crossbow",
    "tome",
    4,
    { count: 7, multiplier: 1.3, pierce: 2, cost: 40, cooldown: 15 },
  ),
  skill(
    "shadowcut",
    "Теневой разрез",
    "Shadow cut",
    "burst",
    "daggers",
    "practice",
    1,
    {
      radius: 65,
      multiplier: 2.5,
      poison: 4,
      ru: "Разрез вокруг героя отравляет врагов на 4 секунды.",
      en: "A slash around the hero poisons enemies for 4 seconds.",
      cost: 18,
      cooldown: 5,
      color: "#ae90d0",
    },
  ),
  skill(
    "vanish",
    "Раствориться в тени",
    "Vanish",
    "stealth",
    "moon",
    "mentor",
    2,
    {
      cost: 28,
      cooldown: 18,
      duration: 5,
      color: "#ae90d0",
      ru: "Невидимость на 5 секунд. Следующий удар клинками сильнее на 80%; атака раскрывает героя.",
      en: "Invisible for 5 seconds. The next blade attack gains 80% damage; attacking reveals you.",
    },
  ),
  skill(
    "shadowstep",
    "Шаг за спину",
    "Shadow step",
    "charge",
    "daggers",
    "tome",
    4,
    { multiplier: 3.2, cost: 30, cooldown: 12, color: "#c5a3e1", poison: 5 },
  ),
  skill("icefan", "Осколки льда", "Ice shards", "fan", "snow", "practice", 1, {
    count: 3,
    multiplier: 1.35,
    element: "ice",
    slow: 2,
    color: "#b4eafb",
  }),
  skill(
    "iceNova",
    "Кольцо зимы",
    "Winter nova",
    "frostnova",
    "snow",
    "mentor",
    2,
    { element: "ice", color: "#b4eafb", cost: 28, cooldown: 9 },
  ),
  skill("blizzard", "Снежная буря", "Blizzard", "field", "snow", "tome", 4, {
    element: "ice",
    multiplier: 0.65,
    radius: 110,
    duration: 6,
    slow: 1.2,
    color: "#b4eafb",
    cost: 40,
    cooldown: 15,
  }),
  skill(
    "flamewave",
    "Волна пламени",
    "Flame wave",
    "burst",
    "meteor",
    "practice",
    1,
    {
      element: "fire",
      multiplier: 2.4,
      radius: 135,
      burn: 4,
      color: "#f7a16b",
    },
  ),
  skill(
    "flameward",
    "Огненный покров",
    "Flame ward",
    "bulwark",
    "shield",
    "mentor",
    2,
    { element: "fire", color: "#f7a16b", cost: 28, cooldown: 12 },
  ),
  skill("inferno", "Падение огня", "Inferno", "meteor", "meteor", "tome", 4, {
    element: "fire",
    color: "#f7a16b",
    multiplier: 3.8,
    cost: 42,
    cooldown: 14,
  }),
  skill(
    "stonewave",
    "Каменная волна",
    "Stone wave",
    "burst",
    "crystal",
    "practice",
    1,
    { multiplier: 2, radius: 125, stun: 1, color: "#cdb78e" },
  ),
  skill(
    "stoneguard",
    "Каменная кожа",
    "Stone skin",
    "bulwark",
    "shield",
    "mentor",
    2,
    { cost: 22, cooldown: 12, color: "#cdb78e" },
  ),
  skill("quake", "Землетрясение", "Earthquake", "impact", "meteor", "tome", 4, {
    multiplier: 3.3,
    radius: 150,
    stun: 2,
    cost: 40,
    cooldown: 14,
    color: "#cdb78e",
  }),
  skill(
    "chainlightning",
    "Цепная молния",
    "Chain lightning",
    "fan",
    "spark",
    "practice",
    1,
    {
      count: 1,
      pierce: 6,
      ru: "Молния перескакивает между 5 врагами; каждый следующий получает на 20% меньше урона.",
      en: "Lightning jumps between 5 enemies; each next target takes 20% less damage.",
      multiplier: 2.8,
      element: "lightning",
      color: "#d9b7ff",
    },
  ),
  skill(
    "stormward",
    "Щит разряда",
    "Discharge ward",
    "bulwark",
    "shield",
    "mentor",
    2,
    { color: "#d9b7ff", element: "lightning", cost: 25, cooldown: 12 },
  ),
  skill(
    "thunderstrike",
    "Громовой удар",
    "Thunderstrike",
    "meteor",
    "spark",
    "tome",
    4,
    {
      element: "lightning",
      multiplier: 4,
      radius: 110,
      cost: 42,
      cooldown: 14,
      color: "#d9b7ff",
    },
  ),
  skill(
    "voidwave",
    "Волна пустоты",
    "Void wave",
    "burst",
    "spark",
    "practice",
    1,
    { element: "void", radius: 150, multiplier: 2.4, color: "#b591de" },
  ),
  skill(
    "voidward",
    "Покров пустоты",
    "Void ward",
    "bulwark",
    "shield",
    "mentor",
    2,
    { cost: 24, cooldown: 12, color: "#b591de" },
  ),
  skill(
    "singularity",
    "Сингулярность",
    "Singularity",
    "field",
    "trap",
    "tome",
    4,
    {
      element: "void",
      ru: "Притягивает обычных врагов к центру и наносит периодический урон.",
      en: "Pulls normal enemies into its center and deals repeated damage.",
      multiplier: 0.9,
      radius: 110,
      duration: 5,
      slow: 0.8,
      color: "#b591de",
      cost: 42,
      cooldown: 15,
    },
  ),
  skill("rally", "Боевой клич", "Rally", "heal", "heart", "quest", 3, {
    class: "warrior",
    quest: "smithQuestDone",
    cost: 32,
    cooldown: 25,
    ru: "Восстанавливает 20% здоровья. Открывается после помощи кузнецу.",
    en: "Restores 20% health. Unlocked by helping the smith.",
  }),
  skill(
    "warfocus",
    "Сосредоточение бойца",
    "Battle focus",
    "focus",
    "target",
    "ritual",
    5,
    { class: "warrior", cost: 24, cooldown: 20 },
  ),
  skill("fieldcare", "Помощь леса", "Forest care", "heal", "leaf", "quest", 3, {
    class: "ranger",
    quest: "herbQuestDone",
    cost: 30,
    cooldown: 25,
    ru: "Восстанавливает 20% здоровья. Открывается после помощи травнице.",
    en: "Restores 20% health. Unlocked by helping the herbalist.",
  }),
  skill("trailwind", "Ветер троп", "Trail wind", "haste", "boot", "ritual", 5, {
    class: "ranger",
    cost: 25,
    cooldown: 20,
  }),
  skill(
    "arcaneblink",
    "Магический шаг",
    "Arcane step",
    "blink",
    "boot",
    "quest",
    3,
    {
      class: "mage",
      quest: "forestRune",
      cost: 25,
      cooldown: 12,
      ru: "Безопасный рывок. Изучается после восстановления лесного обелиска.",
      en: "A safe dash. Learned after restoring the forest obelisk.",
    },
  ),
  skill(
    "meditation",
    "Медитация",
    "Meditation",
    "restore",
    "spark",
    "ritual",
    5,
    { class: "mage", cost: 0, cooldown: 30 },
  ),
];
const LIGHT = "#ffe08a",
  BONE = "#e2f0d2",
  PLAGUE = "#9fe07a";
specialized.push(
  skill("smite", "Кара небес", "Smite", "burst", "holy", "practice", 1, {
    element: "light",
    radius: 110,
    multiplier: 2.5,
    color: LIGHT,
    ru: "Вспышка света вокруг героя. Нежить и тени получают +60% урона.",
    en: "A burst of light around the hero. Undead and shadows take +60% damage.",
  }),
  skill("holyShield", "Щит веры", "Shield of faith", "bulwark", "shield", "mentor", 2, { cost: 22, cooldown: 11, color: LIGHT }),
  skill("consecration", "Освящение", "Consecration", "field", "sun", "tome", 4, {
    element: "light",
    radius: 100,
    duration: 6,
    multiplier: 0.75,
    slow: 0.3,
    cost: 38,
    cooldown: 14,
    color: LIGHT,
    ru: "Освящённая земля 6 секунд жжёт врагов светом и замедляет их.",
    en: "Hallowed ground burns enemies with light and slows them for 6 seconds.",
  }),
  skill("judgmentHammer", "Молот правосудия", "Hammer of judgment", "thrust", "mace", "practice", 1, {
    element: "light",
    multiplier: 2.8,
    radius: 150,
    stun: 0.8,
    cooldown: 7,
    color: LIGHT,
    ru: "Удар света по линии прицела оглушает обычных врагов на 0,8 с.",
    en: "A line of light along your aim stuns normal enemies for 0.8 s.",
  }),
  skill("zeal", "Рвение", "Zeal", "charge", "boot", "mentor", 2, { multiplier: 2.6, cost: 30, cooldown: 11, color: LIGHT }),
  skill("divineStorm", "Божественная буря", "Divine storm", "burst", "holy", "tome", 4, {
    element: "light",
    radius: 140,
    multiplier: 3,
    cost: 40,
    cooldown: 13,
    color: "#fff0b0",
  }),
  skill("boneSpear", "Костяное копьё", "Bone spear", "fan", "bone", "practice", 1, {
    count: 1,
    pierce: 5,
    multiplier: 3,
    cooldown: 5,
    color: BONE,
  }),
  skill("boneArmor", "Костяной доспех", "Bone armor", "bulwark", "skull", "mentor", 2, { cost: 24, cooldown: 12, color: BONE }),
  skill("raiseDead", "Поднять мертвецов", "Raise the dead", "summon", "skull", "tome", 4, {
    count: 2,
    minion: "skeleton",
    duration: 25,
    multiplier: 0.55,
    cost: 40,
    cooldown: 18,
    color: PLAGUE,
    ru: "Поднимает 2 скелетов-воинов на 25 секунд. Каждый ранг добавляет ещё одного.",
    en: "Raises 2 skeleton warriors for 25 seconds. Each rank adds one more.",
  }),
  skill("plagueNova", "Чумная волна", "Plague nova", "burst", "essence", "practice", 1, {
    element: "poison",
    poison: 4,
    radius: 130,
    multiplier: 1.8,
    color: PLAGUE,
    ru: "Волна заразы вокруг героя отравляет врагов на 4 секунды.",
    en: "A wave of plague around the hero poisons enemies for 4 seconds.",
  }),
  skill("decay", "Гниющая земля", "Decaying ground", "field", "leaf", "mentor", 2, {
    element: "poison",
    poison: 3,
    radius: 95,
    duration: 6,
    multiplier: 0.7,
    slow: 0.4,
    cost: 28,
    cooldown: 12,
    color: PLAGUE,
  }),
  skill("summonGhouls", "Призыв упырей", "Summon ghouls", "summon", "skull", "tome", 4, {
    count: 3,
    minion: "skeleton",
    duration: 18,
    multiplier: 0.45,
    poison: 3,
    cost: 42,
    cooldown: 20,
    color: PLAGUE,
    ru: "Призывает 3 упырей на 18 секунд; их удары отравляют.",
    en: "Summons 3 ghouls for 18 seconds; their strikes poison.",
  }),
  skill("reap", "Жатва", "Reap", "burst", "scythe", "practice", 1, {
    radius: 95,
    multiplier: 2.4,
    lifesteal: 0.12,
    color: "#b6f0a0",
    ru: "Широкий взмах косой: 12% урона возвращается здоровьем.",
    en: "A wide scythe sweep: 12% of damage returns as health.",
  }),
  skill("deathMark", "Печать смерти", "Death mark", "mark", "target", "mentor", 2, { cost: 24, cooldown: 12, color: PLAGUE }),
  skill("boneGolem", "Костяной голем", "Bone golem", "summon", "bone", "tome", 4, {
    count: 1,
    minion: "golem",
    duration: 30,
    multiplier: 1.2,
    cost: 45,
    cooldown: 22,
    color: BONE,
    ru: "Призывает костяного голема на 30 секунд. Голем бьёт по площади.",
    en: "Summons a bone golem for 30 seconds. The golem strikes an area.",
  }),
  skill("layOnHands", "Возложение рук", "Lay on hands", "heal", "heart", "quest", 3, {
    class: "paladin",
    quest: "forestRune",
    cost: 30,
    cooldown: 25,
    ru: "Восстанавливает 20% здоровья. Открывается после лесного обелиска.",
    en: "Restores 20% health. Unlocked by the forest obelisk.",
  }),
  skill("auraZeal", "Аура рвения", "Aura of zeal", "focus", "sun", "ritual", 5, { class: "paladin", cost: 24, cooldown: 20 }),
  skill("bloodRite", "Кровавый обряд", "Blood rite", "heal", "heart", "quest", 3, {
    class: "necromancer",
    quest: "herbQuestDone",
    cost: 30,
    cooldown: 25,
    ru: "Восстанавливает 20% здоровья. Открывается после помощи травнице.",
    en: "Restores 20% health. Unlocked by helping the herbalist.",
  }),
  skill("soulSiphon", "Похищение души", "Soul siphon", "restore", "essence", "ritual", 5, { class: "necromancer", cost: 0, cooldown: 30 }),
);
// 2.4: the new schools.
const T = (ru, en) => ({ ru, en });
specialized.push(
  skill("titanLeap", "Прыжок титана", "Titan leap", "leap", "meteor", "practice", 3, { style: "earth", radius: 95, multiplier: 3, stun: 0.6, range: 210, cost: 28, cooldown: 9, ...T("Прыжок к цели и удар о землю: трещины, обломки, оглушение.", "Leap to the target and slam the ground: cracks, debris, stun.") }),
  skill("bladeStorm", "Буря клинков", "Blade storm", "orbit", "sword", "mentor", 6, { style: "physical", shape: "blade", count: 3, radius: 50, duration: 7, speed: 5, multiplier: 0.8, cost: 35, cooldown: 16, ...T("Три клинка вращаются вокруг героя 7 секунд и рубят всех, кого касаются.", "Three blades spin around the hero for 7 seconds, cutting everything they touch.") }),
  skill("fissure", "Разлом", "Fissure", "beam", "ore", "tome", 10, { style: "earth", range: 280, width: 18, multiplier: 3.2, stun: 0.5, cost: 40, cooldown: 14, ...T("Удар раскалывает землю длинной трещиной: урон и оглушение на всём пути.", "A blow splits the earth in a long fissure: damage and stun along its length.") }),
  skill("arrowRain", "Дождь стрел", "Rain of arrows", "rain", "bow", "practice", 3, { style: "wind", shape: "arrow", count: 7, radius: 45, spread: 80, multiplier: 1.3, cost: 28, cooldown: 9, ...T("Залпы стрел падают с неба на выбранную область.", "Volleys of arrows rain down on the chosen area.") }),
  skill("cyclone", "Смерч", "Cyclone", "tornado", "leaf", "mentor", 6, { style: "wind", radius: 40, speed: 75, duration: 4, multiplier: 0.55, cost: 32, cooldown: 13, ...T("Смерч ползёт вперёд, затягивает врагов и бьёт их каждые 0,4 с.", "A cyclone crawls forward, pulling foes in and hitting them every 0.4 s.") }),
  skill("spiritHawks", "Духи ястребов", "Spirit hawks", "orbit", "target", "tome", 10, { style: "wind", count: 3, radius: 58, duration: 8, speed: 6, multiplier: 0.85, cost: 35, cooldown: 18, ...T("Призрачные ястребы кружат вокруг героя и клюют врагов.", "Spectral hawks circle the hero and strike nearby foes.") }),
  skill("starRain", "Звездопад", "Starfall", "rain", "spark", "practice", 3, { style: "arcane", element: "void", count: 6, radius: 55, spread: 85, multiplier: 1.5, cost: 32, cooldown: 10, ...T("С неба одна за другой падают звёзды и взрываются.", "Stars fall from the sky one after another and explode.") }),
  skill("elementOrbs", "Сферы стихий", "Elemental orbs", "orbit", "crystal", "mentor", 6, { style: "fire", element: "fire", burn: 2, count: 3, radius: 52, duration: 9, speed: 4.5, multiplier: 0.9, cost: 35, cooldown: 18, ...T("Огненные сферы кружат вокруг героя и поджигают врагов.", "Fiery orbs circle the hero and set foes ablaze.") }),
  skill("supernova", "Луч сверхновой", "Supernova ray", "beam", "moon", "tome", 10, { style: "void", element: "void", range: 340, width: 18, multiplier: 4, cost: 45, cooldown: 16, ...T("Луч сверхновой прожигает всё на своём пути.", "A supernova ray burns through everything in its path.") }),
  skill("heavenLeap", "Небесный прыжок", "Heavenly leap", "leap", "holy", "practice", 3, { style: "light", element: "light", radius: 100, multiplier: 3, stun: 0.5, range: 210, cost: 28, cooldown: 10, ...T("Прыжок на крыльях света и удар столбом сияния.", "A leap on wings of light and a strike with a pillar of radiance.") }),
  skill("hammerfall", "Молоты небес", "Hammers of heaven", "rain", "mace", "mentor", 6, { style: "light", element: "light", shape: "hammer", count: 6, radius: 50, spread: 80, multiplier: 1.6, stun: 0.4, cost: 34, cooldown: 12, ...T("Сияющие молоты падают с неба и оглушают врагов.", "Shining hammers fall from the sky and stun foes.") }),
  skill("dawnRay", "Луч рассвета", "Ray of dawn", "beam", "sun", "tome", 10, { style: "light", element: "light", range: 320, width: 20, multiplier: 3.6, cost: 42, cooldown: 15, ...T("Столп рассветного света сжигает нежить и тени на всём пути.", "A shaft of dawnlight burns undead and shadows along its path.") }),
  skill("bloodStorm", "Кровавый смерч", "Blood storm", "tornado", "heart", "practice", 3, { style: "blood", radius: 42, speed: 70, duration: 4, multiplier: 0.6, cost: 30, cooldown: 12, ...T("Вихрь крови ползёт вперёд и затягивает врагов.", "A whirl of blood crawls forward and drags foes in.") }),
  skill("skullRain", "Дождь черепов", "Rain of skulls", "rain", "skull", "mentor", 6, { style: "poison", element: "poison", shape: "skull", poison: 3, count: 6, radius: 50, spread: 80, multiplier: 1.4, cost: 32, cooldown: 11, ...T("Горящие черепа падают с неба и взрываются ядом.", "Burning skulls fall from the sky and burst with poison.") }),
  skill("soulOrbit", "Хоровод душ", "Ring of souls", "orbit", "bone", "tome", 10, { style: "void", shape: "skull", count: 4, radius: 54, duration: 9, speed: 4, multiplier: 0.8, lifesteal: 0.1, cost: 36, cooldown: 18, ...T("Черепа-души кружат вокруг героя и пьют жизнь врагов.", "Soul skulls circle the hero and drain the life of foes.") }),
);
specialized.push(
  skill("warcry", "Боевой рёв", "War cry", "warcry", "sword", "practice", 2, { radius: 150, multiplier: 0.6, duration: 3, cost: 22, cooldown: 12, ...T("Рёв ломает броню врагов вокруг; обычные враги в страхе бегут 3 секунды.", "A roar breaks the armour of foes around you; normal enemies flee in fear for 3 seconds.") }),
  skill("berserk", "Ярость зверя", "Beast rage", "berserk", "sword", "mentor", 5, { duration: 8, cost: 35, cooldown: 24, ...T("8 секунд звериной ярости: удары на 40% быстрее и на 40% сильнее, вампиризм 8%, скорость +15%.", "8 seconds of beast rage: strikes 40% faster and 40% stronger, 8% life steal, +15% speed.") }),
  skill("execute", "Казнь", "Execute", "execute", "sword", "tome", 9, { multiplier: 4, cost: 30, cooldown: 10, ...T("Страшный удар по самому раненому врагу рядом. Если у него меньше 30% здоровья — урон вдвое больше.", "A brutal blow to the most wounded foe nearby. Below 30% health it deals double damage.") }),
  skill("pointBlank", "Выстрел в упор", "Point blank", "pointBlank", "bow", "practice", 2, { count: 6, multiplier: 1.1, cost: 22, cooldown: 8, ...T("Веер стрел в упор отбрасывает врагов, а герой отскакивает назад.", "A point-blank fan of arrows knocks foes back while you leap away.") }),
  skill("smokeBomb", "Дымовая шашка", "Smoke bomb", "smokeBomb", "moon", "mentor", 5, { duration: 4, cost: 28, cooldown: 18, ...T("Облако дыма: невидимость 4 секунды, враги рядом теряют вас и оглушены.", "A cloud of smoke: 4 seconds of invisibility; nearby foes lose you and are stunned.") }),
  skill("callBeast", "Зов зверя", "Call of the beast", "callBeast", "target", "tome", 8, { minion: "wolf", count: 1, duration: 25, multiplier: 0.7, cost: 35, cooldown: 26, ...T("Призывает волка-спутника на 25 секунд. На высоком ранге волков больше.", "Calls a wolf companion for 25 seconds. Higher ranks call more wolves.") }),
  skill("telekinesis", "Телекинез", "Telekinesis", "telekinesis", "ore", "practice", 2, { multiplier: 3.4, radius: 70, stun: 0.8, cost: 26, cooldown: 7, ...T("Вырывает из земли валун (или бревно, если рядом деревья) и швыряет в цель: урон по площади и оглушение.", "Tears a boulder (or a log near trees) out of the ground and hurls it: area damage and stun.") }),
  skill("manaShield", "Барьер маны", "Mana barrier", "bulwark", "shield", "mentor", 5, { color: "#9ac0ff", cost: 26, cooldown: 14, ...T("Мерцающий барьер поглощает 55% урона.", "A shimmering barrier absorbs 55% of damage.") }),
  skill("levitate", "Левитация", "Levitation", "levitate", "spark", "tome", 9, { radius: 120, multiplier: 2.6, cost: 38, cooldown: 16, ...T("Поднимает всех врагов вокруг в воздух и через секунду швыряет о землю.", "Lifts every foe around into the air and slams them down a second later.") }),
  skill("corpseExplosion", "Взрыв трупа", "Corpse explosion", "corpseExplosion", "skull", "practice", 2, { count: 4, radius: 70, multiplier: 2.2, poison: 3, cost: 20, cooldown: 6, ...T("Павшие враги остаются на земле. Взрывает до 4 трупов у цели ядовитым пламенем.", "Fallen foes stay on the ground. Detonates up to 4 corpses near the target in poisonous fire.") }),
  skill("army", "Армия мёртвых", "Army of the dead", "army", "bone", "mentor", 6, { count: 3, duration: 18, multiplier: 0.55, cost: 40, cooldown: 26, ...T("Поднимает скелетов из трупов вокруг (не меньше двух). На III ранге — в броне.", "Raises skeletons from the corpses around you (at least two). Armoured at rank III.") }),
  skill("darkPact", "Тёмный пакт", "Dark pact", "darkPact", "essence", "tome", 9, { multiplier: 1.8, cost: 20, cooldown: 20, ...T("Жертвует всех слуг: каждый взрывается тьмой и лечит вас на 8%, затем +30% силы на 8 секунд.", "Sacrifices every minion: each explodes in darkness and heals you 8%, then +30% power for 8 seconds.") }),
  skill("retribution", "Возмездие", "Retribution", "retribution", "sun", "practice", 2, { duration: 8, multiplier: 0.45, cost: 24, cooldown: 16, ...T("8 секунд аура света жжёт врагов рядом каждые 0,6 с.", "For 8 seconds an aura of light burns nearby foes every 0.6 s.") }),
  skill("divineShield", "Божественный щит", "Divine shield", "divineShield", "shield", "mentor", 5, { duration: 3, cost: 30, cooldown: 28, ...T("3 секунды полной неуязвимости в золотом куполе.", "3 seconds of total invulnerability in a golden dome.") }),
  skill("avatar", "Аватар света", "Avatar of light", "avatar", "holy", "tome", 9, { duration: 10, cost: 40, cooldown: 30, ...T("10 секунд вы — аватар: крылья света, +30% силы ко всем атакам.", "For 10 seconds you are an avatar: wings of light, +30% power to every attack.") }),
);
// 2.6: the Summoner's beasts and the Shapeshifter's forms.
specialized.push(
  skill("summonWolves", "Зов стаи", "Call of the pack", "callBeast", "target", "practice", 1, { minion: "wolf", count: 2, duration: 22, multiplier: 0.6, cost: 30, cooldown: 14, ...T("Призывает двух волков на 22 секунды. С рангом волков больше.", "Calls two wolves for 22 seconds. More wolves with rank.") }),
  skill("packFrenzy", "Бешенство стаи", "Pack frenzy", "frenzy", "heart", "mentor", 3, { duration: 8, cost: 24, cooldown: 18, ...T("8 секунд ваши звери бьют на 60% сильнее и быстрее, а ваши атаки — на 25%.", "For 8 seconds your beasts strike 60% harder and faster, and your attacks 25% harder.") }),
  skill("alphaHowl", "Вой вожака", "Alpha howl", "warcry", "moon", "tome", 7, { radius: 160, multiplier: 0.5, duration: 3, cost: 26, cooldown: 14, ...T("Вой ломает броню врагов и обращает их в бегство.", "A howl breaks foes' armour and sends them fleeing.") }),
  skill("summonBear", "Призыв медведя", "Summon bear", "callBeast", "shield", "practice", 2, { minion: "bear", count: 1, duration: 30, multiplier: 1, cost: 38, cooldown: 24, ...T("Призывает медведя на 30 секунд: он бьёт по площади.", "Summons a bear for 30 seconds that strikes an area.") }),
  skill("barkskin", "Дубовая кожа", "Barkskin", "bulwark", "leaf", "mentor", 4, { color: "#8ac070", cost: 22, cooldown: 14, ...T("Кожа твердеет как кора: −55% урона.", "Skin hardens like bark: −55% damage.") }),
  skill("stampede", "Призрачное стадо", "Spirit stampede", "beam", "wood", "tome", 9, { style: "earth", range: 300, width: 22, multiplier: 3.2, stun: 0.6, cost: 40, cooldown: 15, ...T("Призрачное стадо проносится вперёд, топча и оглушая всех на пути.", "A spectral herd thunders forward, trampling and stunning all in its path.") }),
  skill("summonHawks", "Стая ястребов", "Hawk flock", "callBeast", "bow", "practice", 2, { minion: "hawk", count: 3, duration: 20, multiplier: 0.45, cost: 30, cooldown: 16, ...T("Три ястреба пикируют на врагов 20 секунд.", "Three hawks dive at your foes for 20 seconds.") }),
  skill("featherRain", "Град перьев", "Feather hail", "rain", "leaf", "mentor", 5, { style: "wind", shape: "arrow", count: 8, radius: 40, spread: 85, multiplier: 1.2, cost: 28, cooldown: 10, ...T("Острые как ножи перья падают с неба.", "Feathers sharp as knives rain down from the sky.") }),
  skill("eagleDive", "Удар орла", "Eagle dive", "leap", "target", "tome", 8, { style: "wind", radius: 90, multiplier: 3, range: 220, cost: 30, cooldown: 11, ...T("Дух орла уносит вас к цели и обрушивает вниз.", "An eagle spirit carries you to the target and slams you down.") }),
  skill("natureMend", "Целебная роса", "Healing dew", "heal", "leaf", "quest", 3, { class: "summoner", quest: "forestRune", cost: 30, cooldown: 25 }),
  skill("spiritBond", "Связь духов", "Spirit bond", "restore", "essence", "ritual", 5, { class: "summoner", cost: 0, cooldown: 30 }),
  skill("wolfForm", "Облик волка", "Wolf form", "form", "moon", "practice", 1, { form: "wolf", duration: 14, cost: 25, cooldown: 6, ...T("14 секунд вы волк: скорость +40%, укусы на 40% быстрее, крит +10%.", "For 14 seconds you are a wolf: +40% speed, bites 40% faster, +10% crit.") }),
  skill("bloodHowl", "Кровавый вой", "Blood howl", "warcry", "heart", "mentor", 4, { radius: 150, multiplier: 0.7, duration: 3, cost: 24, cooldown: 14, ...T("Вой обращает врагов в бегство и ломает им броню.", "A howl sends foes fleeing and breaks their armour.") }),
  skill("pounce", "Прыжок хищника", "Predator pounce", "leap", "sword", "tome", 7, { style: "blood", radius: 80, multiplier: 3.2, range: 200, cost: 26, cooldown: 9, ...T("Прыжок на добычу с разрывающим ударом.", "A leap onto your prey with a rending strike.") }),
  skill("bearForm", "Облик медведя", "Bear form", "form", "shield", "practice", 2, { form: "bear", duration: 14, cost: 25, cooldown: 6, ...T("14 секунд вы медведь: −40% урона, удары лапой по площади на 40% сильнее.", "For 14 seconds you are a bear: −40% damage taken, paw swipes 40% stronger over an area.") }),
  skill("maul", "Растерзать", "Maul", "burst", "mace", "mentor", 4, { style: "blood", radius: 85, multiplier: 3, stun: 0.6, cost: 26, cooldown: 8, ...T("Яростный удар когтями во все стороны, оглушает.", "A furious claw sweep in every direction that stuns.") }),
  skill("thickHide", "Толстая шкура", "Thick hide", "bulwark", "shield", "tome", 7, { color: "#a08050", cost: 22, cooldown: 14, ...T("Шкура держит удар: −55% урона.", "Your hide takes the blow: −55% damage.") }),
  skill("ravenForm", "Облик ворона", "Raven form", "form", "leaf", "practice", 2, { form: "raven", duration: 14, cost: 25, cooldown: 6, ...T("14 секунд вы ворон: скорость +60%, вы осыпаете врагов острыми перьями издалека.", "For 14 seconds you are a raven: +60% speed, raining sharp feathers on foes from afar.") }),
  skill("galeFunnel", "Воронка ветра", "Gale funnel", "tornado", "leaf", "mentor", 5, { style: "wind", radius: 42, speed: 80, duration: 4, multiplier: 0.6, cost: 30, cooldown: 12, ...T("Смерч из перьев ползёт вперёд и затягивает врагов.", "A funnel of feathers crawls forward, dragging foes in.") }),
  skill("murder", "Воронья стая", "Murder of crows", "orbit", "moon", "tome", 8, { style: "void", count: 4, radius: 56, duration: 8, speed: 5, multiplier: 0.75, cost: 34, cooldown: 18, ...T("Стая ворон кружит вокруг и клюёт врагов.", "A murder of crows circles you, pecking at foes.") }),
  skill("entangle", "Цепкие корни", "Entangling roots", "trap", "leaf", "practice", 2, { style: "poison", radius: 80, slow: 0.95, duration: 5, multiplier: 0.4, cost: 22, cooldown: 10, ...T("Корни опутывают врагов в области: почти полная остановка и урон.", "Roots entangle foes in an area: nearly frozen and taking damage.") }),
  skill("treantForm", "Облик энта", "Treant form", "form", "wood", "mentor", 5, { form: "treant", duration: 14, cost: 25, cooldown: 6, ...T("14 секунд вы энт: лечение 3% в секунду, удары опутывают врагов.", "For 14 seconds you are a treant: heal 3% per second, your blows entangle foes.") }),
  skill("wildMorph", "Дикая метаморфоза", "Wild metamorphosis", "form", "spark", "tome", 8, { form: "random", duration: 16, cost: 20, cooldown: 8, ...T("Случайный облик на 16 секунд — и случайный бонус к нему: огонь, яд, лёд или молния в когтях.", "A random form for 16 seconds — with a random gift: fire, poison, ice or lightning in your claws.") }),
  skill("rejuvenate", "Омоложение", "Rejuvenation", "heal", "heart", "quest", 3, { class: "shapeshifter", quest: "forestRune", cost: 30, cooldown: 25 }),
  skill("moonwell", "Лунный родник", "Moonwell", "restore", "moon", "ritual", 5, { class: "shapeshifter", cost: 0, cooldown: 30 }),
);
// 2.7: the Monk's fists and the Engineer's machines.
specialized.push(
  skill("palmStrike", "Удар ладонью", "Palm strike", "thrust", "hand", "practice", 1, { style: "light", radius: 110, multiplier: 2.4, stun: 0.3, cost: 18, cooldown: 4, ...T("Волна ци бьёт перед собой и оглушает.", "A wave of chi strikes ahead and stuns.") }),
  skill("flurry", "Сотня кулаков", "Hundred fists", "flurry", "hand", "mentor", 3, { hits: 10, multiplier: 0.55, cost: 24, cooldown: 8, ...T("За секунду обрушивает на ближайшего врага десять ударов.", "Unleashes ten blows on the nearest foe in a second.") }),
  skill("dragonPalm", "Ладонь дракона", "Dragon palm", "beam", "meteor", "tome", 8, { style: "fire", element: "fire", burn: 3, range: 260, width: 20, multiplier: 3.4, cost: 38, cooldown: 14, ...T("Из ладони вырывается огненный дракон ци.", "A fiery chi dragon bursts from your palm.") }),
  skill("flyingKick", "Удар в прыжке", "Flying kick", "charge", "boot", "practice", 2, { multiplier: 2.6, cost: 20, cooldown: 6, ...T("Стремительный прыжок ногой вперёд, затем удар вокруг.", "A swift flying kick, then a strike around you.") }),
  skill("whirlKick", "Вихрь ног", "Whirling kick", "burst", "boot", "mentor", 4, { style: "wind", radius: 90, multiplier: 2.6, cost: 22, cooldown: 6, ...T("Круговой удар ногой по всем вокруг.", "A spinning kick that hits everyone around.") }),
  skill("cycloneKick", "Смерч-удар", "Cyclone kick", "tornado", "leaf", "tome", 8, { style: "wind", radius: 40, speed: 85, duration: 3.5, multiplier: 0.65, cost: 30, cooldown: 12, ...T("Удар рождает смерч, который ползёт вперёд.", "Your kick births a cyclone that crawls forward.") }),
  skill("chiWave", "Волна ци", "Chi wave", "beam", "sun", "practice", 2, { style: "light", element: "light", range: 280, width: 16, multiplier: 2.8, cost: 26, cooldown: 8, ...T("Луч ци пронзает строй врагов.", "A beam of chi pierces through the enemy line.") }),
  skill("ironBody", "Железное тело", "Iron body", "bulwark", "shield", "mentor", 4, { color: "#f0c060", cost: 22, cooldown: 14, ...T("Тело твердеет как железо: −55% урона.", "Your body hardens like iron: −55% damage.") }),
  skill("chiOrbs", "Сферы ци", "Chi orbs", "orbit", "spark", "tome", 8, { style: "light", count: 3, radius: 50, duration: 9, speed: 5, multiplier: 0.8, cost: 32, cooldown: 18, ...T("Золотые сферы ци кружат вокруг и обжигают врагов.", "Golden chi orbs circle you, burning foes.") }),
  skill("innerPeace", "Внутренний покой", "Inner peace", "heal", "heart", "quest", 3, { class: "monk", quest: "forestRune", cost: 30, cooldown: 25 }),
  skill("zenFocus", "Дзен", "Zen", "restore", "moon", "ritual", 5, { class: "monk", cost: 0, cooldown: 30 }),
  skill("bomb", "Бомба", "Bomb", "bomb", "meteor", "practice", 1, { radius: 75, multiplier: 2.8, burn: 2, cost: 20, cooldown: 4, ...T("Бросает бомбу по дуге: огненный взрыв по площади.", "Lobs a bomb in an arc: a fiery blast over an area.") }),
  skill("mineField", "Минное поле", "Minefield", "trap", "trap", "mentor", 4, { style: "fire", element: "fire", burn: 3, radius: 80, duration: 6, multiplier: 0.6, cost: 26, cooldown: 12, ...T("Минное поле поджигает и рвёт врагов 6 секунд.", "A minefield burns and blasts foes for 6 seconds.") }),
  skill("rocketBarrage", "Ракетный залп", "Rocket barrage", "rain", "meteor", "tome", 8, { style: "fire", element: "fire", shape: "rocket", count: 7, radius: 50, spread: 90, multiplier: 1.5, burn: 2, cost: 36, cooldown: 13, ...T("Залп ракет по выбранной области.", "A salvo of rockets on the chosen area.") }),
  skill("turret", "Турель", "Turret", "callBeast", "crossbow", "practice", 2, { minion: "turret", count: 1, duration: 20, multiplier: 0.7, cost: 30, cooldown: 16, ...T("Ставит паровую турель на 20 секунд: она сама стреляет по врагам.", "Deploys a steam turret for 20 seconds that fires at foes on its own.") }),
  skill("shieldGenerator", "Генератор щита", "Shield generator", "bulwark", "shield", "mentor", 4, { color: "#7ac8ff", cost: 24, cooldown: 14, ...T("Энергощит гасит 55% урона.", "An energy shield absorbs 55% of damage.") }),
  skill("mechGolem", "Механический голем", "Mech golem", "callBeast", "ore", "tome", 8, { minion: "mech", count: 1, duration: 30, multiplier: 1.3, cost: 42, cooldown: 26, ...T("Собирает паровой голем на 30 секунд: удар по площади и оглушение.", "Assembles a steam golem for 30 seconds: area slams that stun.") }),
  skill("acidFlask", "Кислотная колба", "Acid flask", "bomb", "potion", "practice", 2, { style: "poison", element: "poison", poison: 4, radius: 70, multiplier: 2, cost: 20, cooldown: 5, ...T("Колба с кислотой разбивается ядовитым облаком.", "A flask of acid shatters into a poison cloud.") }),
  skill("flamethrower", "Огнемёт", "Flamethrower", "cone", "meteor", "mentor", 4, { style: "fire", element: "fire", burn: 3, radius: 130, multiplier: 2.6, cost: 26, cooldown: 7, ...T("Струя пламени конусом поджигает всех перед вами.", "A cone of flame sets everyone ahead ablaze.") }),
  skill("overcharge", "Перегрузка", "Overcharge", "focus", "spark", "tome", 7, { cost: 20, cooldown: 20, ...T("Механизмы и оружие работают на пределе: атаки на 25% сильнее.", "Gear runs at the limit: attacks 25% stronger.") }),
  skill("repairKit", "Ремкомплект", "Repair kit", "heal", "heart", "quest", 3, { class: "engineer", quest: "forestRune", cost: 30, cooldown: 25 }),
  skill("steamVent", "Паровой клапан", "Steam vent", "restore", "spark", "ritual", 5, { class: "engineer", cost: 0, cooldown: 30 }),
);
for (const s of specialized) {
  const profile = Object.values(disciplines).find((p) => p.ids.includes(s.id));
  abilityCatalog[s.id] = { ...s, class: s.class || profile.class };
}
export const utilitySkills = {
  warrior: ["rally", "warfocus"],
  ranger: ["fieldcare", "trailwind"],
  mage: ["arcaneblink", "meditation"],
  paladin: ["layOnHands", "auraZeal"],
  necromancer: ["bloodRite", "soulSiphon"],
  summoner: ["natureMend", "spiritBond"],
  shapeshifter: ["rejuvenate", "moonwell"],
  monk: ["innerPeace", "zenFocus"],
  engineer: ["repairKit", "steamVent"],
};
// 1.7: abilities belong to the class. The weapon only grants +15% to its own school.
export const schoolOf = (id) =>
  Object.keys(disciplines).find((k) => disciplines[k].ids.includes(id)) || null;
export const classSkills = (cls) =>
  [
    ...Object.values(disciplines)
      .filter((d) => d.class === cls)
      .flatMap((d) => d.ids),
    ...(utilitySkills[cls] || []),
  ].map((id) => abilityCatalog[id]);
export const skillsFor = (s) => classSkills(s.characterClass);
export function defaultBar(s) {
  const first = disciplines[weaponDiscipline(s)].ids,
    rest = classSkills(s.characterClass)
      .map((a) => a.id)
      .filter((id) => !first.includes(id))
      .sort((a, b) => abilityCatalog[a].level - abilityCatalog[b].level);
  return [...first, ...rest].slice(0, 5);
}
const validBar = (s, ids) =>
  Array.isArray(ids) &&
  ids.length === 5 &&
  new Set(ids).size === 5 &&
  ids.every((id) => abilityCatalog[id]?.class === s.characterClass);
export const barFor = (s) =>
  validBar(s, s.hotbars?.main) ? s.hotbars.main : defaultBar(s);
export const abilityRank = (s, id) => s.abilityRanks?.[id] || 0;
export const rankLevel = (a, rank) => a.level + [0, 0, 3, 7][rank];
// Ranks change behaviour, not only damage: more projectiles, wider areas, extra minions.
export function rankConfig(s, a, rank = abilityRank(s, a.id)) {
  const r = Math.max(1, rank),
    affinity = !!s.equippedWeapon && schoolOf(a.id) === weaponDiscipline(s),
    effect = a.effect || a.id,
    cfg = {
      ...a,
      rank,
      affinity,
      power: (1 + (r - 1) * 0.25) * (affinity ? 1.15 : 1),
      cooldown: a.cooldown - (r - 1) * 0.5,
      perk: r >= 3,
    };
  if (a.radius) cfg.radius = Math.round(a.radius * (1 + (r - 1) * 0.12));
  if (a.duration) cfg.duration = a.duration + (r - 1);
  if (effect === "fan" || effect === "volley") {
    if ((a.count || 3) > 1) cfg.count = (a.count || 3) + (r - 1);
    else cfg.pierce = (a.pierce || 1) + (r - 1) * 2;
  }
  if (effect === "callBeast") cfg.count = (a.count || 1) + (r - 1) + (r >= 3 ? 1 : 0);
  if (effect === "summon") {
    cfg.count = a.minion === "golem" ? 1 : (a.count || 1) + (r - 1);
    cfg.armored = r >= 3;
  }
  return cfg;
}
export function configureAbility(s, index) {
  return rankConfig(s, abilityCatalog[barFor(s)[index]]);
}
// What each rank adds, shown in the skill book as [ru, en] pairs.
export function rankPerks(a) {
  const e = a.effect || a.id;
  const base = ["Открывает приём", "Unlocks the ability"];
  const dmg = ["+25% силы", "+25% power"];
  if (e === "summon" && a.minion === "golem")
    return [base, ["Голем сильнее: +25% урона, откат −0,5 с", "Stronger golem: +25% damage, −0.5 s cooldown"], ["Костяная броня: голем оглушает ударом и живёт дольше", "Bone plating: the golem stuns and lasts longer"]];
  if (e === "summon")
    return [[`${a.count} союзника`, `${a.count} minions`], [`${a.count + 1} союзника, +25% урона`, `${a.count + 1} minions, +25% damage`], [`${a.count + 2} союзника в броне и с мечами: +50% урона, живут на 5 с дольше`, `${a.count + 2} armoured minions with swords: +50% damage, last 5 s longer`]];
  if (e === "fan" || e === "volley")
    return (a.count || 3) > 1
      ? [base, ["+1 снаряд, +25% силы", "+1 projectile, +25% power"], ["+2 снаряда, снаряды пробивают на 1 цель больше", "+2 projectiles, each pierces one more target"]]
      : [base, ["Пробивает на 2 цели больше, +25% силы", "Pierces 2 more targets, +25% power"], ["Пробивает на 4 цели больше, второе копьё следом", "Pierces 4 more, a second spear follows"]];
  if (["burst", "whirlwind", "starwave", "thrust"].includes(e))
    return [base, ["Радиус +12%, " + dmg[0], "Radius +12%, " + dmg[1]], ["Радиус +24%, оглушение обычных врагов 0,6 с", "Radius +24%, stuns normal enemies 0.6 s"]];
  if (e === "frostnova") return [base, ["Радиус +12%, замедление дольше", "Radius +12%, longer slow"], ["Заморозка: враги оглушены на 1 с", "Freeze: enemies stunned for 1 s"]];
  if (e === "meteor" || e === "impact") return [base, ["Радиус +12%, " + dmg[0], "Radius +12%, " + dmg[1]], ["Второй удар через 0,5 с", "A second strike after 0.5 s"]];
  if (e === "trap" || e === "field") return [base, ["+1 с и радиус +12%", "+1 s and radius +12%"], ["+2 с, радиус +24%, сильное замедление", "+2 s, radius +24%, strong slow"]];
  if (e === "bulwark") return [base, ["Защита длится на 1 с дольше", "Guard lasts 1 s longer"], ["Отражает 30% полученного урона во врага", "Reflects 30% of damage taken"]];
  if (e === "charge") return [base, ["Рывок дальше, " + dmg[0], "Longer dash, " + dmg[1]], ["Оглушение дольше и щит на 2 с", "Longer stun and a 2 s shield"]];
  if (e === "mark") return [base, ["Метка длится на 3 с дольше", "Mark lasts 3 s longer"], ["Отмеченный враг получает +75% урона", "Marked enemy takes +75% damage"]];
  if (e === "heal") return [base, ["Лечение +25%", "Healing +25%"], ["Плюс лечение 3% здоровья в секунду 5 с", "Plus 3% health per second for 5 s"]];
  if (e === "stealth") return [base, ["Невидимость на 1 с дольше", "1 s longer invisibility"], ["Первый удар из невидимости — всегда крит", "First strike from stealth always crits"]];
  if (e === "focus" || e === "haste") return [base, ["Длительность +1 с", "Duration +1 s"], ["Длительность +2 с и эффект сильнее на 10%", "Duration +2 s and 10% stronger"]];
  if (e === "blink") return [base, ["Дальность +20", "Range +20"], ["Дальность +40, неуязвимость после шага", "Range +40, invulnerable after the step"]];
  if (e === "leap") return [base, ["Радиус +12%, " + dmg[0], "Radius +12%, " + dmg[1]], ["Ударная волна шире на 20 и сильнее", "Shockwave 20 wider and stronger"]];
  if (e === "rain") return [base, ["Область +12%, " + dmg[0], "Area +12%, " + dmg[1]], ["+2 удара с неба", "+2 strikes from the sky"]];
  if (e === "orbit") return [base, ["+1 с, " + dmg[0], "+1 s, " + dmg[1]], ["+1 сфера на орбите", "+1 orb in orbit"]];
  if (e === "tornado") return [base, ["+1 с и радиус +12%", "+1 s and radius +12%"], ["Второй смерч рядом с первым", "A second tornado beside the first"]];
  if (e === "beam") return [base, dmg, ["+50% силы", "+50% power"]];
  if (["berserk", "avatar", "retribution", "divineShield", "smokeBomb", "form", "frenzy"].includes(e)) return [base, ["Длительность +1 с, " + dmg[0], "Duration +1 s, " + dmg[1]], ["Длительность +2 с и откат −1 с", "Duration +2 s and −1 s cooldown"]];
  if (e === "flurry") return [base, ["+2 удара, " + dmg[0], "+2 blows, " + dmg[1]], ["+4 удара и оглушение в конце", "+4 blows and a stun at the end"]];
  if (e === "bomb") return [base, ["Область +12%, " + dmg[0], "Area +12%, " + dmg[1]], ["Две бомбы сразу", "Two bombs at once"]];
  if (e === "cone") return [base, ["Длина +12%, " + dmg[0], "Length +12%, " + dmg[1]], ["+50% силы", "+50% power"]];
  if (e === "telekinesis") return [base, ["Область +12%, " + dmg[0], "Area +12%, " + dmg[1]], ["Вырывает сразу два обломка", "Tears out two pieces at once"]];
  if (e === "corpseExplosion") return [base, ["Область +12%, " + dmg[0], "Area +12%, " + dmg[1]], ["Взрывает на 2 трупа больше", "Detonates 2 more corpses"]];
  if (e === "army" || e === "callBeast") return [base, ["+1 союзник, " + dmg[0], "+1 ally, " + dmg[1]], ["+2 союзника", "+2 allies"]];
  if (e === "warcry") return [base, ["Радиус +12%, страх дольше", "Radius +12%, longer fear"], ["Страх на 1 с дольше", "Fear lasts 1 s longer"]];
  if (e === "restore") return [base, ["+25% энергии", "+25% energy"], ["+50% энергии и откат зелья сброшен", "+50% energy and potion cooldown reset"]];
  return [base, dmg, ["+50% силы", "+50% power"]];
}
export function upgradeAbility(s, id) {
  const a = abilityCatalog[id];
  if (!a || a.class !== s.characterClass) return false;
  const rank = abilityRank(s, id);
  if (rank >= 3 || s.level < rankLevel(a, rank + 1) || s.skillPoints < 1) return false;
  s.skillPoints--;
  s.abilityRanks ??= {};
  s.abilityRanks[id] = rank + 1;
  return true;
}
export function migrateAbilities(s, input = s) {
  s.abilityRanks = { ...s.abilityRanks };
  s.abilityUses = { ...s.abilityUses };
  s.weaponPractice = { ...s.weaponPractice };
  s.hotbars = { ...s.hotbars };
  if (!input.abilityRanks) {
    const p = weaponDiscipline(s);
    disciplines[p].ids.forEach((id, i) => {
      if (s.skillRanks?.[i]) s.abilityRanks[id] = s.skillRanks[i];
    });
  }
  // Earlier versions kept one bar per weapon school; keep the active one as the class bar.
  if (!validBar(s, s.hotbars.main)) {
    const legacy = s.hotbars[weaponDiscipline(s)];
    s.hotbars = { main: validBar(s, legacy) ? legacy : defaultBar(s) };
  } else s.hotbars = { main: s.hotbars.main };
}
export const skillTrees = {
  warrior: [
    {
      id: "whirlwind",
      name: ["Вихрь клинков", "Blade whirlwind"],
      desc: [
        "Круговая атака по всем врагам рядом.",
        "A spinning strike against all nearby enemies.",
      ],
      icon: "sword",
      cost: 25,
      cooldown: 5,
      level: 1,
    },
    {
      id: "bulwark",
      name: ["Железная кожа", "Iron skin"],
      desc: [
        "На 6 секунд снижает входящий урон на 55%.",
        "Reduces incoming damage by 55% for 6 seconds.",
      ],
      icon: "shield",
      cost: 22,
      cooldown: 10,
      level: 2,
    },
    {
      id: "charge",
      name: ["Прорыв", "Vanguard charge"],
      desc: [
        "Рывок вперёд и оглушающий удар по площади.",
        "Charge forward and deliver an area stun.",
      ],
      icon: "boot",
      cost: 35,
      cooldown: 12,
      level: 4,
    },
  ],
  ranger: [
    {
      id: "volley",
      name: ["Залп стрел", "Arrow volley"],
      desc: [
        "Три усиленные стрелы пробивают строй врагов.",
        "Three powerful arrows pierce enemy lines.",
      ],
      icon: "bow",
      cost: 25,
      cooldown: 5,
      level: 1,
    },
    {
      id: "trap",
      name: ["Лесная ловушка", "Woodland trap"],
      desc: [
        "Ловушка наносит урон и замедляет врагов на 8 секунд.",
        "An 8-second trap damages and slows nearby enemies.",
      ],
      icon: "trap",
      cost: 22,
      cooldown: 9,
      level: 2,
    },
    {
      id: "mark",
      name: ["Метка охотника", "Hunter’s mark"],
      desc: [
        "Отмеченный враг получает на 50% больше урона 10 секунд.",
        "A marked enemy takes 50% more damage for 10 seconds.",
      ],
      icon: "target",
      cost: 25,
      cooldown: 12,
      level: 4,
    },
  ],
  mage: [
    {
      id: "starwave",
      name: ["Звёздная волна", "Star wave"],
      desc: ["Большая круговая волна света.", "A wide circular wave of light."],
      icon: "spark",
      cost: 25,
      cooldown: 5,
      level: 1,
    },
    {
      id: "frostnova",
      name: ["Ледяное кольцо", "Frost nova"],
      desc: [
        "Поражает и замедляет всех врагов рядом на 4 секунды.",
        "Hits and slows all nearby enemies for 4 seconds.",
      ],
      icon: "snow",
      cost: 28,
      cooldown: 9,
      level: 2,
    },
    {
      id: "meteor",
      name: ["Метеор", "Meteor"],
      desc: [
        "Через 0,7 секунды обрушивает мощный удар в выбранную область.",
        "After 0.7 seconds, strikes a chosen area with a powerful meteor.",
      ],
      icon: "meteor",
      cost: 40,
      cooldown: 12,
      level: 4,
    },
  ],
};
registerBaseSkills(skillTrees);

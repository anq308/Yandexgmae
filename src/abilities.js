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
};
const groups = {
  duelist: "blade", halberd: "pole", warmaul: "heavy", emberSpear: "pole",
  shortbow: "bow", frostDaggers: "blades", siegeCrossbow: "crossbow", assassinDaggers: "blades",
  apprenticeFlame: "fire", stormRod: "storm", obsidianStaff: "void", graniteStaff: "earth",
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
  { warrior: "blade", ranger: "bow", mage: "arcane" }[s.characterClass];
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
for (const s of specialized) {
  const profile = Object.values(disciplines).find((p) => p.ids.includes(s.id));
  abilityCatalog[s.id] = { ...s, class: s.class || profile.class };
}
export const utilitySkills = {
  warrior: ["rally", "warfocus"],
  ranger: ["fieldcare", "trailwind"],
  mage: ["arcaneblink", "meditation"],
};
export const skillsFor = (s) =>
  [
    ...disciplines[weaponDiscipline(s)].ids,
    ...utilitySkills[s.characterClass],
  ].map((id) => abilityCatalog[id]);
export const barFor = (s) =>
  s.hotbars?.[weaponDiscipline(s)] || skillsFor(s).map((a) => a.id);
export function abilityRank(s, id) {
  const profile = disciplines[weaponDiscipline(s)],
    i = profile.ids.indexOf(id);
  return Math.max(
    s.abilityRanks?.[id] || 0,
    i >= 0 ? s.skillRanks?.[i] || 0 : 0,
  );
}
export function configureAbility(s, index) {
  const id = barFor(s)[index],
    a = abilityCatalog[id],
    rank = abilityRank(s, id);
  return {
    ...a,
    rank,
    power: 1 + Math.max(0, rank - 1) * 0.25,
    cooldown: a.cooldown - Math.max(0, rank - 1) * 0.5,
  };
}
export const rankLevel = (a, rank) => a.level + [0, 0, 2, 5][rank];
export function upgradeAbility(s, index) {
  const a = configureAbility(s, index);
  if (!a || s.level < rankLevel(a, a.rank + 1) || s.skillPoints < 1 || a.rank >= 3) return false;
  s.skillPoints--;
  s.abilityRanks ??= {};
  s.abilityRanks[a.id] = a.rank + 1;
  const i = disciplines[weaponDiscipline(s)].ids.indexOf(a.id);
  if (i >= 0) s.skillRanks[i] = a.rank + 1;
  return true;
}
export function migrateAbilities(s, input = s) {
  const p = weaponDiscipline(s);
  s.abilityRanks = { ...s.abilityRanks };
  s.abilityUses = { ...s.abilityUses };
  s.weaponPractice = { ...s.weaponPractice };
  s.hotbars = { ...s.hotbars };
  if (!input.abilityRanks)
    disciplines[p].ids.forEach((id, i) => {
      if (s.skillRanks[i]) s.abilityRanks[id] = s.skillRanks[i];
    });
  s.hotbars[p] ??= skillsFor(s).map((a) => a.id);
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

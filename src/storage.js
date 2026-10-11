import {
  migrateAbilities,
  abilityCatalog,
  disciplines,
  utilitySkills,
  weaponDiscipline,
} from "./abilities.js";
import { wearables, emptyWearables } from "./gear.js";
import { classes } from "./i18n.js";
import { TILE, WIDTH, HEIGHT, point } from "./world.js";
import { defaultWeapon, weapons, armors } from "./equipment.js";
import { interiorDefs } from "./interiors.js";
import { races } from "./races.js";
export const SAVE_KEY = "elderia-save-v1";
export function newSave(
  name,
  characterClass,
  appearance,
  selectedWeapon = defaultWeapon(characterClass),
  race = "human",
) {
  const c = classes[characterClass];
  return {
    version: 1,
    updatedAt: Date.now(),
    name,
    race: races[race] ? race : "human",
    characterClass,
    appearance,
    ...point(24, 63),
    hp: c.hp,
    mana: c.mana,
    level: 1,
    xp: 0,
    gold: 25,
    inventory: {
      potion: 2,
      manaPotion: 1,
      herb: 0,
      ore: 0,
      crystal: 0,
      fiber: 0,
      leather: 0,
      wood: 0,
      essence: 0,
      rawFish: 0,
      cookedFish: 0,
      berry: 0,
      bait: 0,
      rod: 0,
      bandage: 0,
      pearl: 0,
      warriorScroll: 0,
      rangerScroll: 0,
      mageScroll: 0,
      paladinScroll: 0,
      necromancerScroll: 0,
      summonerScroll: 0,
      shapeshifterScroll: 0,
      monkScroll: 0,
      engineerScroll: 0,
    },
    weaponLevel: 0,
    potionCooldown: 0,
    // The chosen starting weapon is already in hand.
    equippedWeapon:
      weapons[selectedWeapon]?.class === characterClass
        ? selectedWeapon
        : defaultWeapon(characterClass),
    ownedWeapons: [
      weapons[selectedWeapon]?.class === characterClass
        ? selectedWeapon
        : defaultWeapon(characterClass),
    ],
    skillRanks: [0, 0, 0],
    abilityRanks: {
      [disciplines[
        weaponDiscipline({ characterClass, equippedWeapon: selectedWeapon })
      ].ids[0]]: 1,
    },
    abilityUses: {},
    weaponPractice: {},
    hotbars: {},
    ownedWearables: [],
    equippedWearables: emptyWearables(),
    bagOrder: [],
    activities: {
      catches: 0,
      recipes: 0,
      berries: 0,
      fishSpecies: [],
      harvests: {},
    },
    skillPoints: 0,
    visitedCamps: ["camp1"],
    armorLevel: 0,
    rulesVersion: 3,
    equippedArmor: "none",
    ownedArmors: ["none"],
    masteries: { vitality: 0, focus: 0, precision: 0 },
    restTime: 0,
    nightKills: 0,
    respawns: {},
    contracts: {},
    dungeonClears: { crypt: 0, mine: 0, abyss: 0, citadel: 0 },
    activeDungeon: null,
    runSerial: 0,
    lootDrops: [],
    quest: 0,
    kills: {
      slime: 0,
      golem: 0,
      wisp: 0,
      wolf: 0,
      sentinel: 0,
      titan: 0,
      bat: 0,
      skeleton: 0,
      bandit: 0,
      spider: 0,
      shaman: 0,
      revenant: 0,
      shade: 0,
      herald: 0,
    },
    collected: [],
    defeated: [],
    flags: {},
    discovered: ["village"],
    playtime: 0,
    checkpoint: "camp1",
  };
}
export function validateSave(input) {
  if (
    !input ||
    input.version !== 1 ||
    !classes[input.characterClass] ||
    typeof input.name !== "string"
  )
    return null;
  const base = newSave(
    input.name.slice(0, 20),
    input.characterClass,
    input.appearance || {},
  );
  const s = {
    ...base,
    ...input,
    inventory: { ...base.inventory, ...input.inventory },
    kills: { ...base.kills, ...input.kills },
    flags: { ...input.flags },
    masteries: { ...base.masteries, ...input.masteries },
    dungeonClears: { ...base.dungeonClears, ...input.dungeonClears },
    respawns: { ...input.respawns },
    contracts: { ...input.contracts },
  };
  if (!input.rulesVersion) {
    s.equippedArmor = input.armorLevel > 0 ? "chain" : "none";
    s.ownedArmors = input.armorLevel > 0 ? ["none", "chain"] : ["none"];
    s.rulesVersion = 2;
    for (const id of Array.isArray(s.defeated) ? s.defeated : [])
      if (!id.includes("titan") && id !== "guardian")
        s.respawns[id] = s.playtime + s.restTime + 60;
  }
  if (
    !Array.isArray(s.ownedArmors) ||
    !s.ownedArmors.every((id) => armors[id]) ||
    !s.ownedArmors.includes("none") ||
    !s.ownedArmors.includes(s.equippedArmor)
  )
    return null;
  if (
    !Object.values(s.masteries).every(
      (n) => Number.isInteger(n) && n >= 0 && n <= 8,
    ) ||
    !Object.values(s.dungeonClears).every(
      (n) => Number.isInteger(n) && n >= 0,
    ) ||
    !Number.isFinite(s.restTime) ||
    s.restTime < 0 ||
    !Number.isInteger(s.runSerial) ||
    s.runSerial < 0
  )
    return null;
  if (
    !Array.isArray(s.lootDrops) ||
    s.lootDrops.some(
      (d) =>
        !d ||
        typeof d.id !== "string" ||
        typeof d.zone !== "string" ||
        !Number.isFinite(d.x) ||
        !Number.isFinite(d.y) ||
        !d.contents ||
        !Number.isFinite(d.contents.gold) ||
        d.contents.gold < 0 ||
        Object.entries(d.contents.items || {}).some(
          ([key, n]) =>
            !(key in base.inventory) || !Number.isFinite(n) || n < 0,
        ) ||
        (d.contents.weapon && !weapons[d.contents.weapon]) ||
        (d.contents.armor && !armors[d.contents.armor]) ||
        (d.contents.wearable && !wearables[d.contents.wearable]),
    )
  )
    return null;
  if (!races[s.race]) s.race = "human";
  // Story state: keep only well-formed data so a damaged save cannot break the scenes.
  if (!s.story || typeof s.story !== "object" || Array.isArray(s.story)) s.story = {};
  for (const k of ["dawn", "dusk", "trust"]) if (!Number.isFinite(s.story[k])) delete s.story[k];
  for (const k of ["knows", "fate", "mods"]) if (!s.story[k] || typeof s.story[k] !== "object") delete s.story[k];
  for (const k of ["seen", "log"]) if (!Array.isArray(s.story[k])) delete s.story[k];
  if (s.story.wave && typeof s.story.wave.anchor !== "string") s.story.wave = null;
  s.interior ??= null;
  if (
    s.interior &&
    (!interiorDefs[s.interior.id] ||
      s.activeDungeon ||
      !Number.isFinite(s.interior.returnPoint?.x) ||
      !Number.isFinite(s.interior.returnPoint?.y))
  )
    s.interior = null;
  if (s.activeDungeon) {
    const d = s.activeDungeon,
      limits = { crypt: 3, mine: 3, abyss: 4, citadel: 4 };
    if (
      !limits[d.id] ||
      !Number.isInteger(d.floor) ||
      d.floor < 1 ||
      d.floor > limits[d.id] ||
      !Number.isInteger(d.runId) ||
      d.runId < 1 ||
      !Number.isFinite(d.tier) ||
      d.tier < 0 ||
      d.tier > 6 ||
      ![undefined, 0, 1, 2].includes(d.difficulty) ||
      !Number.isFinite(d.returnPoint?.x) ||
      !Number.isFinite(d.returnPoint?.y)
    )
      return null;
  }
  if (
    !Object.values(s.respawns).every((n) => Number.isFinite(n) && n >= 0) ||
    !Object.values(s.contracts).every((v) => v === "active" || v === "done") ||
    !Number.isInteger(s.nightKills) ||
    s.nightKills < 0
  )
    return null;
  if (
    s.activeDungeon?.enemyHp &&
    !Object.values(s.activeDungeon.enemyHp).every(
      (n) => Number.isFinite(n) && n >= 0,
    )
  )
    return null;
  if (
    !Number.isFinite(s.potionCooldown) ||
    s.potionCooldown < 0 ||
    s.potionCooldown > 8
  )
    return null;
  if (input.equippedWeapon === undefined)
    s.equippedWeapon = defaultWeapon(s.characterClass);
  if (input.skillRanks === undefined) s.skillRanks = [1, 0, 0];
  if (!Array.isArray(s.skillRanks)) return null;
  if (!Array.isArray(s.ownedWeapons)) return null;
  s.ownedWeapons = [
    ...new Set(
      s.ownedWeapons.filter((id) => weapons[id]?.class === s.characterClass),
    ),
  ];
  if (!s.ownedWeapons.length)
    s.ownedWeapons = [defaultWeapon(s.characterClass)];
  if (s.equippedWeapon !== null && !s.ownedWeapons.includes(s.equippedWeapon))
    s.equippedWeapon = s.ownedWeapons[0];
  if (!input.abilityRanks) migrateAbilities(s, input);
  else migrateAbilities(s, { ...s, abilityRanks: input.abilityRanks });
  if (
    !Object.entries(s.abilityRanks).every(
      ([id, n]) =>
        abilityCatalog[id]?.class === s.characterClass &&
        Number.isInteger(n) &&
        n >= 0 &&
        n <= 3,
    )
  )
    return null;
  if (
    !Object.values(s.abilityUses).every((n) => Number.isInteger(n) && n >= 0) ||
    !Object.values(s.weaponPractice).every((n) => Number.isInteger(n) && n >= 0)
  )
    return null;
  if (
    !Object.values(s.hotbars).every(
      (ids) =>
        Array.isArray(ids) &&
        ids.length === 5 &&
        new Set(ids).size === 5 &&
        ids.every((id) => abilityCatalog[id]?.class === s.characterClass),
    )
  )
    return null;
  s.equippedWearables = { ...emptyWearables(), ...s.equippedWearables };
  if (
    !Array.isArray(s.ownedWearables) ||
    !s.ownedWearables.every((id) => wearables[id]) ||
    !Object.entries(s.equippedWearables).every(
      ([slot, id]) =>
        id === null ||
        (wearables[id]?.slot === slot &&
          (!wearables[id].class || wearables[id].class === s.characterClass) &&
          s.ownedWearables.includes(id)),
    )
  )
    return null;
  if (
    !Array.isArray(s.bagOrder) ||
    !s.bagOrder.every((id) => typeof id === "string")
  )
    return null;
  s.activities = {
    ...base.activities,
    ...input.activities,
    harvests: { ...input.activities?.harvests },
  };
  if (
    !["catches", "recipes", "berries"].every(
      (k) => Number.isInteger(s.activities[k]) && s.activities[k] >= 0,
    ) ||
    !Array.isArray(s.activities.fishSpecies) ||
    !s.activities.fishSpecies.every((v) => typeof v === "string") ||
    !Object.values(s.activities.harvests).every(
      (n) => Number.isFinite(n) && n >= 0,
    )
  )
    return null;
  // Add 1.1 systems to the original slot while retaining character progress.
  if (input.skillPoints === undefined) s.skillPoints = Math.max(0, s.level - 1);
  if (
    !Array.isArray(s.skillRanks) ||
    s.skillRanks.length !== 3 ||
    !s.skillRanks.every((n) => Number.isInteger(n) && n >= 0 && n <= 3)
  )
    return null;
  if (
    !Number.isInteger(s.skillPoints) ||
    s.skillPoints < 0 ||
    s.skillPoints > 150
  )
    return null;
  if (
    !Array.isArray(s.visitedCamps) ||
    !s.visitedCamps.every((v) => typeof v === "string")
  )
    return null;
  s.visitedCamps = [
    ...new Set(["camp1", ...s.visitedCamps, s.checkpoint]),
  ].filter((id) => /^camp[1-6]$/.test(id));
  for (const key of [
    "x",
    "y",
    "hp",
    "mana",
    "level",
    "xp",
    "gold",
    "weaponLevel",
    "armorLevel",
    "quest",
    "playtime",
    "updatedAt",
  ])
    if (!Number.isFinite(s[key])) return null;
  if (
    s.x < TILE ||
    s.x > (WIDTH - 1) * TILE ||
    s.y < TILE ||
    s.y > (HEIGHT - 1) * TILE ||
    s.level < 1 ||
    s.level > 50 ||
    s.gold < 0 ||
    s.quest < 0 ||
    s.quest > 11
  )
    return null;
  for (const key of Object.keys(base.inventory))
    if (!Number.isFinite(s.inventory[key]) || s.inventory[key] < 0) return null;
  for (const key of ["collected", "defeated", "discovered"])
    if (!Array.isArray(s[key]) || !s[key].every((v) => typeof v === "string"))
      return null;
  return s;
}
export function readLocal() {
  try {
    return validateSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
  } catch {
    return null;
  }
}
export function writeLocal(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
export function chooseSave(local, cloud) {
  const l = validateSave(local),
    c = validateSave(cloud);
  return !l ? c : !c ? l : c.updatedAt > l.updatedAt ? c : l;
}

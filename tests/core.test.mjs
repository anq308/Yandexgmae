import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorld,
  findPath,
  point,
  landmarks,
  enemySpawns,
  canWalk,
  random,
} from "../src/world.js";
import { newSave, validateSave, chooseSave } from "../src/storage.js";
import { questInfo, canActivate, countGathered } from "../src/quests.js";

test("every quest, enemy and collectible is reachable from the starting village", () => {
  const world = createWorld(),
    start = point(24, 63);
  assert.ok(canWalk(world, start.x, start.y));
  for (const object of [
    ...landmarks,
    ...enemySpawns,
    ...world.objects.filter((o) =>
      ["herb", "ore", "crystal", "wood"].includes(o.type),
    ),
  ]) {
    assert.ok(
      findPath(world, start, object).length,
      `Unreachable: ${object.id}`,
    );
  }
});
test("world generation is reproducible and paths never cross solid tiles", () => {
  const a = createWorld(),
    b = createWorld();
  assert.deepEqual(a.tiles, b.tiles);
  assert.deepEqual(a.blocked, b.blocked);
  const route = findPath(
    a,
    point(24, 63),
    landmarks.find((o) => o.id === "altar"),
  );
  assert.ok(route.length > 50);
  route.forEach((p) => assert.ok(canWalk(a, p.x, p.y)));
  assert.deepEqual(findPath(a, point(24, 63), { x: -5, y: -5 }), []);
  const r1 = random(12),
    r2 = random(12);
  assert.equal(r1(), r2());
});
test("save validation recovers inventory defaults and rejects broken saves", () => {
  for (const characterClass of ["warrior", "ranger", "mage"]) {
    const s = newSave("Элиан", characterClass, {});
    assert.ok(validateSave(JSON.parse(JSON.stringify(s))));
  }
  assert.equal(validateSave(null), null);
  const s = newSave("Элиан", "warrior", {});
  assert.equal(validateSave({ ...s, x: Infinity }), null);
  assert.equal(validateSave({ ...s, characterClass: "invalid" }), null);
  assert.equal(validateSave({ ...s, inventory: { potion: -1 } }), null);
  assert.equal(validateSave({ ...s, collected: "invalid" }), null);
  const partial = validateSave({ ...s, inventory: { potion: 1 } });
  assert.equal(partial.inventory.herb, 0);
});
test("newer valid cloud or local data wins without wiping a valid local save", () => {
  const s = newSave("Hero", "mage", {}),
    old = { ...s, updatedAt: 10 },
    fresh = { ...s, updatedAt: 20 };
  assert.equal(chooseSave(old, fresh).updatedAt, 20);
  assert.equal(chooseSave(fresh, old).updatedAt, 20);
  assert.equal(chooseSave(fresh, { bad: true }).updatedAt, 20);
  assert.equal(chooseSave(null, fresh).updatedAt, 20);
});
test("obelisks answer only at their chapter and every chapter has a journal entry", () => {
  const s = newSave("Hero", "warrior", {});
  s.collected = ["herb0", "herb1", "herb2"];
  assert.equal(countGathered(s, "herb"), 3);
  s.quest = 1;
  assert.ok(canActivate(s, "forestRune"));
  assert.equal(questInfo(s).target, "forestRune");
  s.quest = 3;
  assert.ok(canActivate(s, "mountainRune"));
  s.quest = 0;
  assert.equal(canActivate(s, "mountainRune"), false);
  for (let quest = 0; quest <= 11; quest++) {
    s.quest = quest;
    assert.ok(questInfo(s).title);
    assert.ok(questInfo(s).steps.length);
  }
});

test("legacy characters retain progress and receive the new arsenal and skill points", () => {
  const legacy = newSave("Veteran", "mage", { cape: "#abcdef" });
  legacy.level = 4;
  legacy.checkpoint = "camp2";
  legacy.quest = 6;
  legacy.gold = 231;
  legacy.collected = ["chest2"];
  for (const key of [
    "equippedWeapon",
    "ownedWeapons",
    "skillRanks",
    "skillPoints",
    "visitedCamps",
  ])
    delete legacy[key];
  const migrated = validateSave(JSON.parse(JSON.stringify(legacy)));
  assert.equal(migrated.equippedWeapon, "staff");
  assert.deepEqual(migrated.ownedWeapons, ["staff"]);
  assert.deepEqual(migrated.skillRanks, [1, 0, 0]);
  assert.equal(migrated.skillPoints, 3);
  assert.deepEqual(migrated.visitedCamps, ["camp1", "camp2"]);
  assert.equal(migrated.quest, 6);
  assert.equal(migrated.gold, 231);
  assert.deepEqual(migrated.collected, ["chest2"]);
  const invalid = validateSave({
    ...migrated,
    ownedWeapons: ["sword", "frostStaff"],
    equippedWeapon: "sword",
  });
  assert.deepEqual(invalid.ownedWeapons, ["frostStaff"]);
  assert.equal(invalid.equippedWeapon, "frostStaff");
});

test("weapons provide distinct reach, damage and mobility while skills enforce progression", async () => {
  const { deriveStats, upgradeSkill } = await import("../src/equipment.js");
  const { classes } = await import("../src/i18n.js");
  const s = newSave("Hero", "warrior", {});
  const sword = deriveStats(s, classes.warrior),
    spear = deriveStats({ ...s, equippedWeapon: "spear" }, classes.warrior);
  assert.ok(spear.range > sword.range);
  assert.ok(spear.cooldown > sword.cooldown);
  const r = newSave("Hero", "ranger", {});
  assert.ok(
    deriveStats({ ...r, equippedWeapon: "daggers" }, classes.ranger).speed >
      deriveStats(r, classes.ranger).speed,
  );
  s.skillPoints = 4;
  assert.equal(upgradeSkill(s, "bulwark"), false);
  assert.equal(s.skillPoints, 4);
  s.level = 2;
  assert.equal(upgradeSkill(s, "bulwark"), true);
  assert.equal(s.abilityRanks.bulwark, 1);
  assert.equal(upgradeSkill(s, "charge"), false);
  assert.equal(upgradeSkill(s, "whirlwind"), false);
  s.level = 3;
  assert.equal(upgradeSkill(s, "whirlwind"), false);
  s.level = 4;
  assert.equal(upgradeSkill(s, "whirlwind"), true);
  assert.equal(upgradeSkill(s, "whirlwind"), false);
  s.level = 8;
  assert.equal(upgradeSkill(s, "whirlwind"), true);
  assert.equal(upgradeSkill(s, "whirlwind"), false);
  assert.equal(upgradeSkill(s, "volley"), false);
  assert.equal(s.skillPoints, 1);
});

test("control preferences reject conflicting bindings and diagonal movement keeps its speed", async () => {
  const { normalizeControls, defaultBindings, movement } = await import(
    "../src/controls.js"
  );
  const invalid = [
    { ...defaultBindings, attack: "KeyD" },
    { ...defaultBindings, attack: "KeyQ" },
    { ...defaultBindings, attack: undefined },
    Object.fromEntries(
      Object.entries(defaultBindings).map(([k, v]) => [
        k === "attack" ? "wrong" : k,
        v,
      ]),
    ),
  ];
  for (const bindings of invalid)
    assert.deepEqual(normalizeControls({ bindings }).bindings, defaultBindings);
  const swapped = { ...defaultBindings, attack: "KeyQ", skill1: "Space" };
  assert.deepEqual(
    normalizeControls({ bindings: swapped, autoAim: false }).bindings,
    swapped,
  );
  assert.equal(normalizeControls({ autoAim: false }).autoAim, false);
  assert.equal(
    Math.hypot(...Object.values(movement(new Set(["KeyW", "KeyD"])))),
    1,
  );
  assert.deepEqual(movement(new Set(["KeyW", "KeyS"])), { x: 0, y: 0 });
});

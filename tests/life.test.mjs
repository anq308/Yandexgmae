import test from "node:test";
import assert from "node:assert/strict";
import { newSave, validateSave } from "../src/storage.js";
import { weapons, deriveStats } from "../src/equipment.js";
import { classes } from "../src/i18n.js";
import {
  abilityCatalog,
  skillsFor,
  weaponDiscipline,
  barFor,
} from "../src/abilities.js";
import { makeEnemy } from "../src/battle.js";
import { wearables, emptyWearables } from "../src/gear.js";

test("every weapon selects a class discipline, with 138 independent abilities and five valid slots", () => {
  assert.equal(Object.keys(abilityCatalog).length, 138);
  for (const [id, w] of Object.entries(weapons)) {
    const s = newSave("Hero", w.class, {}, id);
    assert.equal(s.equippedWeapon, id);
    assert.equal(s.equippedArmor, "none");
    assert.deepEqual(s.equippedWearables, emptyWearables());
    s.equippedWeapon = id;
    assert.ok(skillsFor(s).length >= 8);
    assert.equal(new Set(barFor(s)).size, 5);
    assert.ok(skillsFor(s).every((a) => a.class === w.class));
    assert.ok(validateSave(s));
  }
  const s = newSave("Ranger", "ranger", {}, "daggers");
  s.equippedWeapon = "daggers";
  assert.equal(weaponDiscipline(s), "blades");
  assert.ok(skillsFor(s).some((a) => a.effect === "stealth"));
  // Abilities belong to the class: switching to a bow keeps stealth available.
  s.equippedWeapon = "bow";
  assert.equal(weaponDiscipline(s), "bow");
  assert.ok(skillsFor(s).some((a) => a.effect === "stealth"));
});
test("equipment bonuses come only from worn pieces, while empty hands have weaker attacks", () => {
  const s = newSave("Hero", "warrior", {}),
    bare = deriveStats({ ...s, equippedWeapon: null }, classes.warrior);
  s.equippedWeapon = "sword";
  assert.equal(deriveStats(s, classes.warrior).damage, bare.damage * 2);
  s.ownedWearables = Object.keys(wearables);
  const notWorn = deriveStats(s, classes.warrior);
  s.equippedWearables = {
    head: "ironHelm",
    legs: "ironGreaves",
    feet: "ironBoots",
    offhand: "buckler",
  };
  const worn = deriveStats(s, classes.warrior);
  assert.equal(worn.defense - notWorn.defense, 16);
  assert.equal(worn.maxHp - notWorn.maxHp, 52);
});
test("saved hotbars, independent mastery and activities survive validation; foreign and duplicate skills are rejected", () => {
  const s = newSave("Hero", "ranger", {});
  s.equippedWeapon = "daggers";
  s.ownedWeapons.push("daggers");
  s.abilityRanks.vanish = 2;
  s.abilityUses.vanish = 8;
  s.weaponPractice.blades = 12;
  s.hotbars.blades = [
    "vanish",
    "shadowcut",
    "shadowstep",
    "fieldcare",
    "trailwind",
  ];
  s.activities.catches = 3;
  s.activities.fishSpecies = ["carp"];
  s.ownedWearables = ["leatherHood"];
  s.equippedWearables.head = "leatherHood";
  s.inventory.rod = 1;
  const v = validateSave(JSON.parse(JSON.stringify(s)));
  assert.equal(v.abilityRanks.vanish, 2);
  // Legacy per-weapon bars become the single class bar.
  assert.deepEqual(Object.keys(v.hotbars), ["main"]);
  assert.equal(v.hotbars.main[0], "vanish");
  assert.equal(v.activities.catches, 3);
  // A corrupted bar is repaired to the default instead of losing the save.
  const repaired = validateSave({
    ...s,
    hotbars: {
      blades: ["vanish", "vanish", "shadowstep", "fieldcare", "trailwind"],
    },
  });
  assert.equal(new Set(repaired.hotbars.main).size, 5);
  assert.equal(validateSave({ ...s, abilityRanks: { bulwark: 1 } }), null);
  assert.equal(
    validateSave({
      ...s,
      equippedWearables: { offhand: "buckler" },
      ownedWearables: ["buckler"],
    }),
    null,
  );
});
test("normal monsters scale near the hero; bosses stay above the hero and region minimums remain", () => {
  const spawn = { id: "balance-test", type: "slime", x: 100, y: 100 },
    low = makeEnemy(spawn, undefined, 1),
    high = makeEnemy(spawn, undefined, 15);
  assert.ok(high.level >= 14 && high.level <= 16);
  assert.ok(high.maxHp > low.maxHp);
  assert.ok(high.damage > low.damage);
  assert.ok(high.xp > low.xp);
  const boss = makeEnemy(
    { ...spawn, type: "boneKing", boss: true },
    undefined,
    15,
  );
  assert.equal(boss.level, 17);
  assert.ok(
    makeEnemy({ ...spawn, type: "stormLord", boss: true }, undefined, 1)
      .level >= 14,
  );
});

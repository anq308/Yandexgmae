import test from "node:test";
import assert from "node:assert/strict";
import { newSave, validateSave } from "../src/storage.js";
import {
  weapons,
  critChance,
  CRIT_MULTIPLIER,
  classWeapons,
} from "../src/equipment.js";
import { disciplines, weaponDiscipline } from "../src/abilities.js";
import { wearables } from "../src/gear.js";
import { createWorld, canWalk, findPath, landmarks, point } from "../src/world.js";
import { hazardHits, makeEnemy, expandedEnemyStats } from "../src/battle.js";
import { questInfo, allSeals, FINAL_QUEST } from "../src/quests.js";
import { heralds, questSpawns, shardCount, dawnWeapons } from "../src/eclipse.js";

test("every weapon belongs to a school of its own class and trait values stay sane", () => {
  for (const [id, w] of Object.entries(weapons)) {
    const school = weaponDiscipline({ characterClass: w.class, equippedWeapon: id });
    assert.equal(disciplines[school].class, w.class, id);
    assert.ok(!w.lifesteal || (w.lifesteal > 0 && w.lifesteal <= 0.1), id);
    assert.ok(!w.crit || (w.crit > 0 && w.crit <= 0.2), id);
    assert.ok(w.price > 0 || w.source || w.recipe || !w.rarity, id);
  }
  for (const cls of ["warrior", "ranger", "mage", "paladin", "necromancer"]) {
    assert.equal(weapons[dawnWeapons[cls]].class, cls);
    assert.equal(weapons[dawnWeapons[cls]].rarity, "legendary");
    assert.ok(classWeapons(cls).length >= 11);
  }
});

test("critical chance depends on class, weapon and precision and is capped", () => {
  const ranger = newSave("A", "ranger", {}),
    warrior = newSave("B", "warrior", {});
  assert.ok(critChance(ranger, weapons.bow) > critChance(warrior, weapons.sword));
  assert.ok(critChance(ranger, weapons.hawkeye) > critChance(ranger, weapons.bow));
  ranger.masteries.precision = 8;
  assert.ok(critChance(ranger, weapons.hawkeye) <= 0.6);
  assert.ok(CRIT_MULTIPLIER > 1.5);
});

test("act III quests follow the seals, shards, rift and epilogue", () => {
  const s = newSave("Hero", "mage", {});
  s.quest = 7;
  assert.equal(questInfo(s).target, null);
  for (const id of ["crypt", "mine", "abyss", "citadel"]) s.flags["seal-" + id] = true;
  assert.ok(allSeals(s));
  assert.equal(questInfo(s).target, "elder");
  s.quest = 8;
  assert.equal(questInfo(s).steps.length, 3);
  s.flags["shard-marsh"] = true;
  assert.equal(shardCount(s), 1);
  assert.deepEqual(questInfo(s).steps.map(([, have]) => have), [0, 1, 0]);
  s.quest = 9;
  assert.equal(questInfo(s).target, "altar");
  s.quest = FINAL_QUEST;
  assert.ok(questInfo(s).steps.length >= 3);
  assert.ok(validateSave(JSON.parse(JSON.stringify(s))));
  assert.equal(validateSave({ ...s, quest: FINAL_QUEST + 1 }), null);
});

test("heralds and Nerei spawn on reachable ground and only when the story allows", () => {
  const world = createWorld(),
    s = newSave("Hero", "warrior", {});
  assert.equal(questSpawns(world, s).length, 0);
  s.quest = 8;
  const spawns = questSpawns(world, s);
  assert.equal(spawns.filter((e) => e.type === "herald").length, heralds.length);
  for (const e of spawns) {
    assert.ok(canWalk(world, e.x, e.y), e.id);
    assert.ok(e.unique, e.id);
  }
  s.flags["shard-tundra"] = true;
  assert.equal(
    questSpawns(world, s).filter((e) => e.type === "herald").length,
    heralds.length - 1,
  );
  s.quest = 9;
  s.flags.eclipseAwake = true;
  const boss = questSpawns(world, s).find((e) => e.type === "eclipse");
  assert.ok(boss && canWalk(world, boss.x, boss.y));
  const altar = landmarks.find((o) => o.id === "altar");
  assert.ok(Math.hypot(boss.x - altar.x, boss.y - altar.y) < 200);
  assert.ok(findPath(world, point(91, 72), boss).length > 0 || Math.hypot(boss.x - point(91, 72).x, boss.y - point(91, 72).y) < 30);
});

test("eclipse pulse spares only the circles of light", () => {
  const h = {
    shape: "eclipse",
    x: 0,
    y: 0,
    radius: 300,
    safe: [{ x: 100, y: 0, r: 38 }],
  };
  assert.ok(hazardHits(h, { x: 0, y: 0 }));
  assert.ok(!hazardHits(h, { x: 100, y: 10 }));
  assert.ok(!hazardHits(h, { x: 400, y: 0 }));
});

test("shadow enemies scale like other foes and Nerei is the strongest boss", () => {
  const nerei = makeEnemy({ id: "eclipse", type: "eclipse", x: 0, y: 0, boss: true }, undefined, 1);
  assert.equal(nerei.level, 16);
  assert.ok(
    Object.values(expandedEnemyStats)
      .filter((e) => e.boss && e !== expandedEnemyStats.eclipse)
      .every((e) => e.hp < nerei.maxHp),
  );
  assert.ok(expandedEnemyStats.shade.shade && expandedEnemyStats.herald.shade);
  assert.equal(wearables.dawnCirclet.source, "eclipse");
});

import test from "node:test";
import assert from "node:assert/strict";
import { newSave, validateSave } from "../src/storage.js";
import {
  weapons,
  armors,
  starterWeapons,
  deriveStats,
} from "../src/equipment.js";
import { classes } from "../src/i18n.js";
import { dungeons, dungeonAccess } from "../src/content.js";
import { createDungeon } from "../src/dungeons.js";
import { findPath, canWalk, point, WIDTH, HEIGHT } from "../src/world.js";
import { climateAt, elementMultiplier } from "../src/climate.js";
import { hazardHits, expandedEnemyStats, makeEnemy } from "../src/battle.js";
test("new heroes have no armor, every class has a full arsenal and boss equipment is excluded from creation", () => {
  assert.equal(Object.keys(weapons).length, 126);
  assert.equal(Object.keys(armors).length, 16);
  // Every class has exactly one mythic weapon, and mythic gear is locked behind named bosses.
  const mythic = Object.values(weapons).filter((w) => w.rarity === "mythic");
  assert.deepEqual(mythic.map((w) => w.class).sort(), Object.keys(classes).sort());
  for (const item of [...mythic, armors.dragon, armors.abyss, armors.seraph]) {
    assert.ok(item.requires?.length >= 2 && item.level >= 18 && item.recipe && !item.price);
    assert.ok(Object.values(item.recipe).reduce((a, b) => a + b, 0) >= 60);
  }
  for (const cls of Object.keys(classes)) {
    const s = newSave("Hero", cls, {});
    assert.equal(s.equippedArmor, "none");
    assert.deepEqual(s.ownedArmors, ["none"]);
    assert.equal(deriveStats(s, classes[cls]).defense, 0);
    assert.equal(
      Object.values(weapons).filter((w) => w.class === cls).length >= 11,
      true,
    );
    assert.equal(starterWeapons(cls).length, 3);
  }
});
test("all fourteen dungeon floors have accessible guards and gates protect their last hall", () => {
  assert.equal(WIDTH, 256);
  assert.equal(HEIGHT, 192);
  for (const [id, d] of Object.entries(dungeons))
    for (let floor = 1; floor <= d.floors; floor++) {
      const world = createDungeon({ id, floor, tier: 0, runId: 1 });
      assert.ok(canWalk(world, world.start.x, world.start.y));
      for (const e of world.spawns.filter((e) => e.guard))
        assert.ok(findPath(world, world.start, e).length, e.id);
      const stairs = world.objects.find((o) => o.type === "stairs");
      assert.equal(findPath(world, world.start, stairs).length, 0);
      world.openGate();
      for (const target of [
        ...world.spawns,
        ...world.objects.filter((o) =>
          ["stairs", "dungeonChest", "exit"].includes(o.type),
        ),
      ])
        assert.ok(findPath(world, world.start, target).length, target.id);
      assert.equal(
        world.spawns.filter((e) => e.boss).length,
        +(floor === d.floors),
      );
    }
});
test("citadel requires three seals and later challenges increase health and damage", () => {
  const s = newSave("Hero", "warrior", {});
  s.level = 14;
  assert.equal(dungeonAccess(s, "citadel"), false);
  Object.assign(s.dungeonClears, { crypt: 1, mine: 1, abyss: 1 });
  assert.equal(dungeonAccess(s, "citadel"), true);
  s.level = 3;
  assert.equal(dungeonAccess(s, "crypt"), false);
  for (const type of ["boneKing", "frostTyrant", "broodQueen", "stormLord"]) {
    const a = makeEnemy({ id: "boss", type, ...point(46, 34), tier: 0 }),
      b = makeEnemy({ id: "boss", type, ...point(46, 34), tier: 2.1 });
    assert.ok(b.hp > a.hp * 1.4);
    assert.ok(b.damage > a.damage);
    assert.ok(a.hp >= 2200);
  }
});
test("weather, time and dungeon climate change combat parameters", () => {
  const s = newSave("Hero", "mage", {});
  assert.equal(climateAt(s).hour, 8);
  s.playtime = 180;
  const rain = climateAt(s);
  assert.equal(rain.weather, "rain");
  assert.equal(elementMultiplier(rain, "fire"), 0.7);
  assert.equal(elementMultiplier(rain, "ice"), 1.2);
  assert.equal(elementMultiplier(rain, "lightning"), 1.25);
  assert.equal(climateAt(s, "mountain").weather, "snow");
  s.playtime = 500;
  const night = climateAt(s);
  assert.ok(night.night);
  assert.equal(night.enemyDamage, 1.2);
  assert.equal(night.season, "spring");
  assert.ok(Math.abs(night.xp - 1.15 * 1.05) < 1e-9);
  const cave = climateAt(s, "mine", "mine");
  assert.equal(cave.enemyDamage, 1);
  assert.equal(cave.weather, "snow");
  s.playtime = 360;
  assert.equal(climateAt(s).aggro, 150);
  // Seasons rotate every two days; winter brings snow and short days.
  const seasons = [0, 1, 2, 3].map((k) => climateAt({ playtime: k * 1800 + 60 }).season);
  assert.deepEqual(seasons, ["spring", "summer", "autumn", "winter"]);
  const winter = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => climateAt({ playtime: 3 * 1800 + 60 + k * 180 }).weather);
  assert.ok(winter.filter((w) => w === "snow").length >= 4);
  assert.ok(climateAt({ playtime: 1800 + 450 }).dark === 0);
});
test("telegraph geometry leaves a safe inner ring and permits sidestepping beams and cones", () => {
  const ring = { shape: "ring", x: 0, y: 0, radius: 195, inner: 100 };
  assert.equal(hazardHits(ring, { x: 50, y: 0 }), false);
  assert.equal(hazardHits(ring, { x: 140, y: 0 }), true);
  assert.equal(hazardHits(ring, { x: 230, y: 0 }), false);
  assert.equal(
    hazardHits(
      { shape: "line", x: 0, y: 0, angle: 0, range: 370, width: 31 },
      { x: 150, y: 70 },
    ),
    false,
  );
  assert.equal(
    hazardHits(
      { shape: "cone", x: 0, y: 0, angle: 0, radius: 145, arc: 1 },
      { x: -80, y: 0 },
    ),
    false,
  );
});
test("old armor upgrades migrate and malformed dungeon saves cannot load", () => {
  const s = newSave("Hero", "warrior", {}),
    old = { ...s, armorLevel: 2 };
  delete old.rulesVersion;
  delete old.equippedArmor;
  delete old.ownedArmors;
  assert.equal(validateSave(old).equippedArmor, "chain");
  assert.equal(
    validateSave({ ...s, activeDungeon: { id: "crypt", floor: 9 } }),
    null,
  );
  assert.equal(validateSave({ ...s, respawns: { slime0: Infinity } }), null);
  assert.equal(validateSave({ ...s, contracts: { tailor: "cheat" } }), null);
  assert.equal(validateSave({ ...old, defeated: {} }), null);
  assert.equal(
    validateSave({
      ...s,
      lootDrops: [
        {
          id: "bad",
          zone: "world",
          x: 10,
          y: 10,
          contents: { gold: 20, items: { ore: -1 } },
        },
      ],
    }),
    null,
  );
});

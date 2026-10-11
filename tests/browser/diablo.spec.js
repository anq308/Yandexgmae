import { test, expect } from "@playwright/test";
async function begin(page, cls = "warrior") {
  await page.goto("/");
  await page.evaluate(() => (window.__ELDERIA__.game.rng = () => 0.99));
  await page.locator("[data-action=create]").click();
  await page.locator(`[data-class=${cls}]`).click();
  await page.locator("[data-action=start]").click();
  await expect(page.locator("#hud")).toBeVisible();
}

test("nine classes are offered; the necromancer raises minions that fight on their own", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-action=create]").click();
  await expect(page.locator(".class-card")).toHaveCount(9);
  await begin(page, "necromancer");
  const r = await page.evaluate(async () => {
    const { barFor } = await import("/src/abilities.js");
    const g = window.__ELDERIA__.game,
      s = g.save;
    g.equipWeapon(s.ownedWeapons[0]);
    s.level = 6;
    s.abilityRanks.raiseDead = 1;
    const slot = barFor(s).indexOf("raiseDead");
    s.mana = 200;
    g.setPaused(true);
    g.paused = false;
    const dummy = {
      ...g.enemies.find((e) => e.type === "slime"),
      id: "dummy",
      x: s.x + 70,
      y: s.y,
      hp: 3000,
      maxHp: 3000,
      speed: 0,
      cooldown: 999,
    };
    g.enemies = [dummy];
    const cast = g.useSkill(slot);
    const allies = g.allies.length;
    for (let i = 0; i < 80; i++) g.update(0.04);
    g.paused = true;
    return { cast, allies, hp: dummy.hp, mentor: !!g.world.objects.find((o) => o.id === "necroMentor") };
  });
  expect(r.cast).toBe(true);
  expect(r.allies).toBe(2);
  expect(r.hp).toBeLessThan(3000);
  expect(r.mentor).toBe(true);
});

test("enemies drop loot on the ground that is collected by walking over it", async ({ page }) => {
  await begin(page);
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save;
    g.setPaused(true);
    const e = g.enemies.find((e) => e.type === "slime");
    const gold = s.gold,
      fiber = s.inventory.fiber;
    g.damageEnemy(e, 1e6);
    const dropped = g.groundLoot.filter((d) => d.zone === g.zoneId).length,
      creditedNow = s.gold !== gold || s.inventory.fiber !== fiber;
    Object.assign(s, { x: e.x, y: e.y });
    g.paused = false;
    for (let i = 0; i < 40; i++) {
      for (const d of g.groundLoot) Object.assign(s, { x: d.x, y: d.y });
      g.update(0.04);
    }
    g.paused = true;
    return { dropped, creditedNow, gold: s.gold - gold, fiber: s.inventory.fiber - fiber, left: g.groundLoot.length };
  });
  expect(r.dropped).toBeGreaterThanOrEqual(2);
  expect(r.creditedNow).toBe(false);
  expect(r.gold).toBeGreaterThan(0);
  expect(r.fiber).toBe(2);
  expect(r.left).toBe(0);
});

test("world bosses guard the farlands, drop their trophy and return after a delay", async ({ page }) => {
  await begin(page, "paladin");
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save,
      bosses = g.enemies.filter((e) => e.worldBoss).map((e) => e.type).sort();
    g.setPaused(true);
    const wyrm = g.enemies.find((e) => e.type === "frostWyrm");
    Object.assign(s, { x: wyrm.x, y: wyrm.y + 30 });
    g.damageEnemy(wyrm, 1e8);
    const drop = g.activeLoot[0];
    const respawnAt = s.respawns[wyrm.id];
    g.collectLoot(drop.id);
    // Before the timer the boss stays away, after it the boss returns.
    g.spawnWorldBosses();
    const early = g.enemies.some((e) => e.id === wyrm.id && e.hp > 0);
    s.restTime += 1300;
    g.spawnWorldBosses();
    const late = g.enemies.some((e) => e.id === wyrm.id && e.hp > 0);
    return { bosses, trophy: s.ownedWearables.includes("wyrmHelm"), respawnAt: respawnAt > 0, early, late, flag: !!s.flags["wb-frostWyrm"] };
  });
  expect(r.bosses).toEqual(["banditKing", "cyclops", "frostWyrm", "sandWorm", "treant", "witch"]);
  expect(r).toMatchObject({ trophy: true, respawnAt: true, early: false, late: true, flag: true });
});

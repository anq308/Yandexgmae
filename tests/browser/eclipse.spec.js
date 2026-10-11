import { test, expect } from "@playwright/test";
async function begin(page, cls = "warrior") {
  await page.goto("/");
  await page.evaluate(() => (window.__ELDERIA__.game.rng = () => 0.99));
  await page.locator("[data-action=create]").click();
  await page.locator(`[data-class=${cls}]`).click();
  await page.locator("[data-action=start]").click();
  await expect(page.locator("#hud")).toBeVisible();
}

test("critical hits deal more damage and life steal heals the hero", async ({ page }) => {
  await begin(page);
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save;
    s.level = 9;
    s.ownedWeapons.push("bloodletter");
    g.equipWeapon("bloodletter");
    g.setPaused(true);
    g.paused = false;
    const dummy = (id) => ({
      ...g.enemies.find((e) => e.type === "slime"),
      id,
      hp: 5000,
      maxHp: 5000,
      x: s.x + 25,
      y: s.y,
      speed: 0,
      cooldown: 99,
    });
    const hit = (roll) => {
      const e = dummy("dummy" + roll);
      g.enemies = [e];
      g.rng = () => roll;
      g.attackCooldown = 0;
      g.comboTimer = 0;
      g.attack();
      return 5000 - e.hp;
    };
    const normal = hit(0.99);
    s.hp = 50;
    const crit = hit(0);
    const healed = s.hp;
    g.paused = true;
    return { normal, crit, healed };
  });
  expect(r.crit).toBeGreaterThan(r.normal * 1.6);
  expect(r.healed).toBeGreaterThan(50);
});

test("act III: heralds, shards, the rift, Nerei and the epilogue persist", async ({ page }) => {
  await begin(page, "ranger");
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save;
    s.level = 16;
    s.quest = 7;
    for (const id of ["crypt", "mine", "abyss", "citadel"]) s.flags["seal-" + id] = true;
    const elder = g.world.objects.find((o) => o.id === "elder");
    Object.assign(s, { x: elder.x, y: elder.y + 20 });
    g.onInteract(elder);
  });
  await expect(page.getByRole("dialog")).toContainText("Нерея");
  await page.locator('[data-action="actThree"]').click();
  const heralds = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    return g.enemies.filter((e) => e.type === "herald" && e.hp > 0).length;
  });
  expect(heralds).toBe(3);
  await expect(page.locator("#quest-title")).toHaveText("Голос за печатями");
  const afterHeralds = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.setPaused(true);
    for (const e of g.enemies.filter((e) => e.type === "herald"))
      g.damageEnemy(e, 1e7);
    return { quest: g.save.quest, respawns: Object.keys(g.save.respawns).filter((id) => id.startsWith("herald")) };
  });
  expect(afterHeralds).toEqual({ quest: 9, respawns: [] });
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      altar = g.world.objects.find((o) => o.id === "altar");
    g.enemies = g.enemies.filter((e) => !e.id.startsWith("herald"));
    Object.assign(g.save, { x: altar.x, y: altar.y });
    g.onInteract(altar);
  });
  await page.locator('[data-action="sc-nerei-start-fight"]').click();
  const boss = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      e = g.enemies.find((e) => e.type === "eclipse");
    return { exists: !!e, above: e.level >= g.save.level + 2, awake: g.save.flags.eclipseAwake };
  });
  expect(boss).toEqual({ exists: true, above: true, awake: true });
  // Reload mid-fight: the rift stays open and Nerei returns.
  await page.evaluate(() => window.__ELDERIA__.game.persist());
  await page.reload();
  await page.evaluate(() => (window.__ELDERIA__.game.rng = () => 0.99));
  await page.locator('[data-action="continue"]').click();
  const loot = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      e = g.enemies.find((e) => e.type === "eclipse");
    g.setPaused(true);
    Object.assign(g.save, { x: e.x, y: e.y + 30 });
    g.damageEnemy(e, 1e8);
    const drop = g.activeLoot[0];
    return { quest: g.save.quest, weapon: drop?.contents.weapon, wear: drop?.contents.wearable, id: drop?.id };
  });
  expect(loot).toMatchObject({ quest: 10, weapon: "dawnbow", wear: "dawnCirclet" });
  await page.locator('.modal [data-action="close"]').first().click();
  await page.evaluate((id) => window.__ELDERIA__.game.collectLoot(id), loot.id);
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      elder = g.world.objects.find((o) => o.id === "elder");
    Object.assign(g.save, { x: elder.x, y: elder.y + 20 });
    g.onInteract(elder);
  });
  await page.locator('[data-action="sc-epilogue-start-dawn"]').click();
  await expect(page.getByRole("dialog")).toContainText("Хранителя рассвета");
  const end = await page.evaluate(() => {
    const s = window.__ELDERIA__.game.save;
    return { quest: s.quest, owned: s.ownedWeapons.includes("dawnbow"), circlet: s.ownedWearables.includes("dawnCirclet"), dawn: s.flags.dawnHero };
  });
  expect(end).toEqual({ quest: 11, owned: true, circlet: true, dawn: true });
});

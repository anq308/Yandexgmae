import { test, expect } from "@playwright/test";
async function begin(page, cls = "warrior") {
  await page.goto("/");
  await page.evaluate(() => (window.__ELDERIA__.game.rng = () => 0.99));
  await page.locator("[data-action=create]").click();
  await page.locator(`[data-class=${cls}]`).click();
  await page.locator("[data-action=start]").click();
  await expect(page.locator("#hud")).toBeVisible();
}

test("houses can be entered; shops trade, taverns rent rooms and the visit survives reloading", async ({ page }) => {
  await begin(page);
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save;
    const door = g.world.objects.find((o) => o.id === "door-shop");
    Object.assign(s, { x: door.x, y: door.y + 20 });
    s.inventory.ore = 4;
    s.gold = 0;
    const entered = g.enterHouse("shop"),
      noEnemies = g.enemies.length === 0;
    const sold = g.tradeItem("sell", "ore", 999),
      goldAfterSale = s.gold,
      bought = g.tradeItem("buy", "fiber", 1),
      noRoomHere = g.innRest();
    g.persist();
    return { entered, noEnemies, sold, goldAfterSale, bought, gold: s.gold, ore: s.inventory.ore, noRoomHere, zone: g.zoneId };
  });
  expect(r).toEqual({ entered: true, noEnemies: true, sold: true, goldAfterSale: 20, bought: true, gold: 15, ore: 0, noRoomHere: false, zone: "house:shop" });
  await page.reload();
  await page.evaluate(() => (window.__ELDERIA__.game.rng = () => 0.99));
  await page.locator("[data-action=continue]").click();
  const back = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save,
      inside = !!s.interior;
    const left = g.leaveHouse();
    const door = g.world.objects.find((o) => o.id === "door-home2");
    Object.assign(s, { x: door.x, y: door.y + 20 });
    g.enterHouse("home2");
    s.gold = 50;
    s.hp = 10;
    const rested = g.innRest();
    return { inside, left, rested, hp: s.hp === g.stats.maxHp, gold: s.gold, hour: Math.round(g.climate.hour) };
  });
  expect(back).toEqual({ inside: true, left: true, rested: true, hp: true, gold: 30, hour: 8 });
});

test("each class dodges its own way and the mage reappears through a portal", async ({ page }) => {
  await begin(page, "mage");
  const r = await page.evaluate(async () => {
    const { newSave } = await import("/src/storage.js");
    const g = window.__ELDERIA__.game,
      out = {};
    for (const cls of ["mage", "necromancer", "paladin", "ranger", "warrior"]) {
      g.load(newSave("D", cls, {}));
      g.enemies = [];
      g.paused = false;
      g.facing = 0;
      const x = g.save.x;
      g.dodge();
      const style = g.heroAnim?.style || g.effects.find((e) => e.type === "dodge")?.style;
      for (let i = 0; i < 30; i++) g.update(0.02);
      out[cls] = { style, moved: Math.round(g.save.x - x) > 20, done: !g.heroAnim };
    }
    g.paused = true;
    return out;
  });
  expect(r.mage).toEqual({ style: "portal", moved: true, done: true });
  expect(r.necromancer).toEqual({ style: "grave", moved: true, done: true });
  expect(r.paladin.style).toBe("holyDash");
  expect(r.ranger.style).toBe("roll");
  expect(r.warrior.style).toBe("chargeDust");
});

test("idle monsters wander near home, a spotted hero alerts the pack and runaways return home", async ({ page }) => {
  await begin(page);
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save,
      base = g.enemies.find((e) => e.type === "slime");
    g.setPaused(true);
    g.paused = false;
    const mk = (id, dx, dy) => ({ ...base, id, x: s.x + dx, y: s.y + dy, homeX: s.x + dx, homeY: s.y + dy, alert: 0, wander: null, idle: 0, cooldown: 99, hp: 500, maxHp: 500 });
    const near = mk("near", 150, 0),
      friend = mk("friend", 150, 100),
      far = mk("far", 350, 0);
    g.enemies = [near, friend, far];
    g.update(0.05);
    const alerted = friend.alert > 0;
    const runaway = mk("runaway", 0, 0);
    runaway.x = s.x + 300;
    runaway.homeX = s.x + 900;
    runaway.hp = 100;
    g.enemies = [runaway];
    g.update(0.05);
    const returning = runaway.returning;
    for (let i = 0; i < 20; i++) g.update(0.05);
    g.paused = true;
    return { alerted, returning, healed: runaway.hp > 100 };
  });
  expect(r).toEqual({ alerted: true, returning: true, healed: true });
});

test("seasons repaint the valley and are announced", async ({ page }) => {
  await begin(page);
  const r = await page.evaluate(async () => {
    const g = window.__ELDERIA__.game,
      s = g.save,
      first = g.season;
    s.restTime = 5400;
    g.paused = false;
    g.update(0.02);
    g.paused = true;
    g.onChange();
    return { first, now: g.season, badge: document.querySelector("#weather-badge").textContent };
  });
  expect(r.first).toBe("spring");
  expect(r.now).toBe("winter");
  expect(r.badge).toContain("Зима");
});

test("villages have farms and grazing livestock; hidden huts hold a one-time treasure", async ({ page }) => {
  await begin(page);
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save,
      objs = g.world.objects;
    const huts = objs.filter((o) => o.type === "ruinHouse").map((o) => o.id),
      fields = objs.filter((o) => o.type === "decor" && o.kind === "farm").length,
      pens = objs.filter((o) => o.type === "decor" && o.kind === "pen").length,
      animals = new Set(g.critters.filter((a) => a.pen).map((a) => a.kind)),
      wild = ['crab', 'gull'].every((k) => g.critters.some((a) => a.kind === k)),
      beach = ['pier', 'boat', 'wreck', 'shell'].every((k) => objs.some((o) => o.type === 'decor' && o.kind === k));
    // Livestock stays inside its fence.
    g.enemies = [];
    for (let i = 0; i < 60; i++) g.update(0.25);
    const fenced = g.critters.filter((a) => a.pen).every((a) => a.x >= a.pen.x * 24 && a.x <= (a.pen.x + a.pen.w) * 24 && a.y >= a.pen.y * 24 && a.y <= (a.pen.y + a.pen.h) * 24);
    const door = objs.find((o) => o.id === "door-ruin1");
    Object.assign(s, { x: door.x, y: door.y + 10 });
    const entered = g.enterHouse("ruin1"),
      stash = g.world.objects.find((o) => o.type === "stash"),
      gold = s.gold,
      first = !!g.openStash(stash),
      gained = s.gold - gold >= 80,
      again = g.openStash(stash);
    return { huts: huts.length, fields: fields >= 3, pens, animals: animals.size, wild, beach, fenced, entered, first, gained, again };
  });
  expect(r).toEqual({ huts: 6, fields: true, pens: 8, animals: 5, wild: true, beach: true, fenced: true, entered: true, first: true, gained: true, again: false });
});

test("mythic gear needs the named victories and a mountain of materials", async ({ page }) => {
  await begin(page, "warrior");
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save;
    s.level = 20;
    Object.assign(s.inventory, { essence: 60, ore: 80, crystal: 50, wood: 30, leather: 40, pearl: 20 });
    const locked = g.acquireEquipment("weapon", "ragnarok", true),
      lockedArmor = g.acquireEquipment("armor", "dragon", true);
    Object.assign(s.flags, { "seal-citadel": true, "wb-cyclops": true, "wb-frostWyrm": true, "seal-abyss": true });
    const sword = g.acquireEquipment("weapon", "ragnarok", true),
      armor = g.acquireEquipment("armor", "dragon", true);
    return { locked, lockedArmor, sword, armor, wielded: s.equippedWeapon, worn: s.equippedArmor, essence: s.inventory.essence };
  });
  expect(r).toEqual({ locked: false, lockedArmor: false, sword: true, armor: true, wielded: "ragnarok", worn: "dragon", essence: 13 });
});

test("forge-only gear cannot be bought, even cheaply", async ({ page }) => {
  await begin(page, "warrior");
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save;
    s.level = 20;
    s.gold = 99999;
    Object.assign(s.flags, { "seal-citadel": true, "wb-cyclops": true });
    return [g.acquireEquipment("weapon", "ragnarok"), g.acquireEquipment("weapon", "dragonbane"), s.gold];
  });
  expect(r).toEqual([false, false, 99999]);
});

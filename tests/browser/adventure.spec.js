import { test, expect } from "@playwright/test";
async function begin(page, cls = "warrior") {
  await page.goto("/");
  await page.locator("[data-action=create]").click();
  await page.locator(`[data-class=${cls}]`).click();
  await page.locator("[data-action=start]").click();
  await expect(page.locator("#hud")).toBeVisible();
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.equipWeapon(g.save.ownedWeapons[0]);
    g.attackCooldown = 0;
  });
}
async function enter(page, id, level = 14) {
  return page.evaluate(
    ({ id, level }) => {
      const g = window.__ELDERIA__.game;
      g.setPaused(true);
      g.save.level = level;
      g.enemies = [];
      const portal = g.world.objects.find((o) => o.dungeon === id);
      Object.assign(g.save, { x: portal.x, y: portal.y });
      const ok = g.enterDungeon(id);
      g.onChange();
      return ok;
    },
    { id, level },
  );
}
async function finalFloor(page) {
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.setPaused(true);
    while (
      g.save.activeDungeon.floor <
      { crypt: 3, mine: 3, abyss: 4, citadel: 4 }[g.save.activeDungeon.id]
    ) {
      for (const e of g.enemies) g.damageEnemy(e, 1e6);
      g.nextDungeonFloor();
    }
    for (const e of g.enemies.filter((e) => !e.boss)) g.damageEnemy(e, 1e6);
    g.paused = false;
    g.update(0.04);
    g.paused = true;
    g.onChange();
  });
}

test("armor starts empty, crafting spends materials, upgrades require level, and contracts pay once", async ({
  page,
}) => {
  await begin(page);
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.equippedArmor),
  ).toBe("none");
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    Object.assign(g.save.inventory, { fiber: 6, herb: 2 });
    g.save.gold = 1000;
    window.__ELDERIA__.action("armorCraft-cloth");
  });
  await expect(
    page.locator(".gear-card.equipped").filter({ hasText: "Стёганый" }),
  ).toContainText("Стёганый");
  const result = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    const rejected = g.upgradeEquipment("armor");
    g.save.level = 2;
    const noOre = g.upgradeEquipment("armor");
    g.save.inventory.ore = 2;
    const upgrade = g.upgradeEquipment("armor");
    g.acceptContract("tailor");
    const before = g.save.gold;
    const first = g.claimContract("tailor"),
      second = g.claimContract("tailor");
    g.persist();
    return {
      armor: g.save.equippedArmor,
      fiber: g.save.inventory.fiber,
      herb: g.save.inventory.herb,
      defense: g.stats.defense,
      rank: g.save.armorLevel,
      rejected,
      noOre,
      upgrade,
      first,
      second,
      gain: g.save.gold - before,
    };
  });
  expect(result).toEqual({
    armor: "cloth",
    fiber: 0,
    herb: 0,
    defense: 4,
    rank: 1,
    rejected: false,
    noOre: false,
    upgrade: true,
    first: true,
    second: false,
    gain: 80,
  });
  await page.reload();
  await page.locator("[data-action=continue]").click();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.equippedArmor),
  ).toBe("cloth");
});

test("dungeon floors, local map, arena lock, three phases and guaranteed physical loot survive reload", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await begin(page);
  expect(await enter(page, "crypt", 4)).toBe(true);
  await page.evaluate(() => window.__ELDERIA__.game.setPaused(false));
  await page.keyboard.press("KeyM");
  await expect(page.locator("[role=dialog]")).toContainText("60 × 48");
  await expect(page.locator("[data-action=travel-camp1]")).toHaveCount(0);
  await page.locator(".modal-header [data-action=close]").click();
  await finalFloor(page);
  const phases = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      e = g.enemies.find((e) => e.boss);
    g.paused = false;
    const sleeping = e.sleeping;
    const hp = e.hp;
    g.damageEnemy(e, 500);
    const doorProtected = e.hp === hp;
    g.save.x = e.x;
    g.save.y = e.y + 80;
    g.update(0.04);
    const leave = g.leaveDungeon();
    g.damageEnemy(e, e.maxHp * 0.36);
    g.update(0.04);
    const phase2 = e.phase;
    const minions = g.enemies.filter(
      (m) => m.owner === e.id && m.hp > 0,
    ).length;
    g.damageEnemy(e, e.maxHp * 0.5);
    g.update(0.04);
    const phase3 = e.phase;
    g.save.x = e.x;
    g.save.y = e.y + 25;
    g.damageEnemy(e, 1e6);
    g.setPaused(true);
    g.persist();
    g.onChange();
    return {
      sleeping,
      doorProtected,
      leave,
      phase2,
      phase3,
      minions,
      seals: g.save.dungeonClears.crypt,
      loot: g.activeLoot.length,
      weapon: g.activeLoot[0].contents.weapon,
    };
  });
  expect(phases).toMatchObject({
    sleeping: false,
    doorProtected: true,
    leave: false,
    phase2: 2,
    phase3: 3,
    seals: 1,
    loot: 1,
    weapon: "hammer",
  });
  expect(phases.minions).toBeGreaterThan(0);
  await page.reload();
  await page.locator("[data-action=continue]").click();
  const saved = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.setPaused(true);
    const drop = g.activeLoot[0];
    g.save.x = drop.x;
    g.save.y = drop.y;
    const first = g.collectLoot(drop.id),
      second = g.collectLoot(drop.id);
    const exit = g.leaveDungeon();
    return {
      first,
      second,
      exit,
      armor: g.save.ownedArmors.includes("grave"),
      weapon: g.save.ownedWeapons.includes("hammer"),
      active: g.save.activeDungeon,
    };
  });
  expect(saved).toEqual({
    first: true,
    second: false,
    exit: true,
    armor: true,
    weapon: true,
    active: null,
  });
  expect(errors).toEqual([]);
});

test("all four dungeon lords grant their class gear, repeat challenges scale and sealed entry is enforced", async ({
  page,
}) => {
  await begin(page, "mage");
  expect(await enter(page, "citadel")).toBe(false);
  for (const [id, weapon, armor] of [
    ["crypt", "emberstaff", "grave"],
    ["mine", "tidestaff", "frost"],
    ["abyss", "voidstaff", "ember"],
    ["citadel", "thunderwand", "storm"],
  ]) {
    expect(await enter(page, id, 20)).toBe(true);
    await finalFloor(page);
    const result = await page.evaluate(() => {
      const g = window.__ELDERIA__.game,
        e = g.enemies.find((e) => e.boss);
      Object.assign(g.save, { x: e.x, y: e.y + 40 });
      g.damageEnemy(e, 1e6);
      const drop = g.activeLoot[0],
        contents = drop.contents;
      g.collectLoot(drop.id);
      g.leaveDungeon();
      return { contents, active: g.save.activeDungeon };
    });
    expect(result.contents.weapon).toBe(weapon);
    expect(result.contents.armor).toBe(armor);
    expect(result.active).toBe(null);
  }
  expect(await enter(page, "crypt", 20)).toBe(true);
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.activeDungeon.tier),
  ).toBe(1);
});

test("stationary heroes lose a boss fight, warning damage waits, and potions cannot be spammed in menus", async ({
  page,
}) => {
  await begin(page);
  await enter(page, "crypt", 4);
  await finalFloor(page);
  const result = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      e = g.enemies.find((e) => e.boss);
    g.save.level = 4;
    g.save.weaponLevel = 0;
    g.save.equippedArmor = "none";
    g.save.hp = g.stats.maxHp;
    Object.assign(g.save, { x: e.x, y: e.y + 80 });
    g.paused = false;
    g.update(0.04);
    e.attackTimer = 0;
    g.update(0.04);
    const initial = g.save.hp;
    for (let i = 0; i < 8; i++) g.update(0.04);
    const before = g.save.hp;
    for (let i = 0; i < 28; i++) g.update(0.04);
    const hit = g.save.hp < before;
    g.save.hp = 20;
    g.save.inventory.potion = 10;
    g.potionCooldown = 0;
    g.potion();
    const healed = g.save.hp;
    g.setPaused(true);
    g.potion("potion", true);
    const unchanged = g.save.hp === healed && g.save.inventory.potion === 9;
    g.paused = false;
    let seconds = 0;
    while (g.save.hp > 0 && seconds < 50) {
      g.update(0.04);
      seconds += 0.04;
    }
    g.paused = true;
    return { initial, before, hit, unchanged, dead: g.save.hp === 0, seconds };
  });
  expect(result.before).toBe(result.initial);
  expect(result.hit).toBe(true);
  expect(result.unchanged).toBe(true);
  expect(result.dead).toBe(true);
  expect(result.seconds).toBeLessThan(50);
});

test("night, elemental weather, material harvesting, respawns and death reset use the actual engine", async ({
  page,
}) => {
  await begin(page, "mage");
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.setPaused(true);
    g.save.playtime = 500;
    const herb = g.world.objects.find((o) => o.type === "herb");
    g.collect(herb);
    const harvested = g.save.inventory.herb;
    const e = g.enemies.find((e) => e.type === "slime");
    g.damageEnemy(e, 9999);
    const nightKills = g.save.nightKills;
    g.save.playtime = 700;
    g.save.x = 24 * 24 + 12;
    g.save.y = 63 * 24 + 12;
    g.paused = false;
    g.update(0.04);
    g.paused = true;
    const respawn = g.enemies.find((m) => m.id === e.id).hp > 0;
    g.save.hp = 10;
    g.save.xp = 0;
    g.addXp(g.xpNeeded);
    const partialHeal = g.save.hp < g.stats.maxHp;
    return { harvested, nightKills, respawn, partialHeal };
  });
  expect(r).toEqual({
    harvested: 2,
    nightKills: 1,
    respawn: true,
    partialHeal: true,
  });
  await enter(page, "crypt", 4);
  await finalFloor(page);
  const death = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      e = g.enemies.find((e) => e.boss);
    Object.assign(g.save, { x: e.x, y: e.y + 25 });
    g.damageEnemy(e, 1e6);
    g.save.gold = 1000;
    g.invincible = 0;
    g.hurt(99999);
    g.respawn();
    const gold = g.save.gold;
    return {
      gold,
      active: g.save.activeDungeon,
      relocated: g.save.lootDrops[0].zone,
      hp: g.save.hp,
    };
  });
  expect(death.gold).toBe(880);
  expect(death.active).toBe(null);
  expect(death.relocated).toBe("world");
  expect(death.hp).toBeGreaterThan(0);
});

test("rain reduces actual fire skill damage and potion cooldown survives reopening the game", async ({
  page,
}) => {
  await begin(page, "mage");
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.setPaused(true);
    g.paused = false;
    const e = {
      ...g.enemies.find((e) => e.type === "slime"),
      x: g.save.x + 40,
      y: g.save.y,
      hp: 2000,
      maxHp: 2000,
    };
    e.speed = 0;
    e.cooldown = 999;
    g.enemies = [e];
    g.save.level = 4;
    g.save.skillRanks = [1, 0, 1];
    g.save.mana = g.stats.maxMana;
    g.save.playtime = 0;
    g.useSkill(2);
    for (let i = 0; i < 20; i++) g.update(0.04);
    const clear = 2000 - e.hp;
    g.skillCooldowns[2] = 0;
    g.abilityCooldowns.meteor = 0;
    g.save.mana = g.stats.maxMana;
    g.save.playtime = 180;
    e.hp = 2000;
    g.useSkill(2);
    for (let i = 0; i < 20; i++) g.update(0.04);
    const rain = 2000 - e.hp;
    g.save.hp = 10;
    g.potion();
    g.setPaused(true);
    g.persist();
    return { clear, rain, cooldown: g.potionCooldown };
  });
  expect(r.rain).toBeCloseTo(r.clear * 0.7, 0);
  expect(r.cooldown).toBe(8);
  await page.reload();
  await page.locator("[data-action=continue]").click();
  await page.keyboard.press("KeyI");
  const after = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    const hp = g.save.hp,
      n = g.save.inventory.potion;
    g.potion("potion", true);
    return {
      cd: g.potionCooldown,
      unchanged: hp === g.save.hp && n === g.save.inventory.potion,
    };
  });
  expect(after.cd).toBeGreaterThan(7);
  expect(after.unchanged).toBe(true);
});

test("boss health, weather and dungeon status fit portrait and landscape mobile displays", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await begin(page);
  await enter(page, "crypt", 4);
  await finalFloor(page);
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      e = g.enemies.find((e) => e.boss);
    Object.assign(g.save, { x: e.x, y: e.y + 80 });
    g.paused = false;
    g.update(0.04);
    g.setPaused(true);
    g.onChange();
  });
  await page.evaluate(async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
  });
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    for (const selector of [
      "#boss-health",
      "#weather-badge",
      "#dungeon-status",
      ".player-card",
      ".action-bar",
    ]) {
      await expect(page.locator(selector)).toBeVisible();
      const r = await page.locator(selector).boundingBox();
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(size.width + 1);
      expect(r.y + r.height).toBeLessThanOrEqual(size.height + 1);
    }
  }
  expect(errors).toEqual([]);
  await context.close();
});

test("walking to dropped boss loot opens its pickup dialog on arrival", async ({
  page,
}) => {
  await begin(page);
  await enter(page, "crypt", 4);
  await finalFloor(page);
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      e = g.enemies.find((e) => e.boss);
    Object.assign(g.save, { x: e.x, y: e.y + 25 });
    g.damageEnemy(e, 1e6);
    const drop = g.activeLoot[0];
    g.save.x = drop.x - 110;
    g.save.y = drop.y;
    g.paused = false;
    g.moveTo(drop.x, drop.y);
    g.pendingInteraction = drop.id;
    for (let i = 0; i < 100 && !g.paused; i++) g.update(0.04);
  });
  await expect(page.getByRole("dialog")).toContainText("Трофеи босса");
  await page.locator("[data-action^=lootClaim-]").click();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.activeLoot.length),
  ).toBe(0);
});

test("HUD refresh keeps quest steps and refreshes the minimap immediately on entering a dungeon", async ({
  page,
}) => {
  await begin(page);
  const r = await page.evaluate(async () => {
    const g = window.__ELDERIA__.game;
    g.setPaused(true);
    g.time = 10;
    g.onChange();
    await window.__ELDERIA__.action("sound");
    const steps = document.querySelectorAll("#quest-steps .quest-step").length;
    const c = document.querySelector("#minimap"),
      populated = c
        .getContext("2d")
        .getImageData(0, 0, c.width, c.height)
        .data.some((v) => v > 0);
    g.time = 10;
    g.onChange();
    const before = c.toDataURL();
    g.save.level = 4;
    g.enemies = [];
    const o = g.world.objects.find((o) => o.dungeon === "crypt");
    Object.assign(g.save, { x: o.x, y: o.y });
    g.enterDungeon("crypt");
    const after = document.querySelector("#minimap").toDataURL();
    return { steps, populated, changed: before !== after };
  });
  expect(r.steps).toBeGreaterThan(0);
  expect(r.populated).toBe(true);
  expect(r.changed).toBe(true);
});

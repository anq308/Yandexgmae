import { test, expect } from "@playwright/test";
async function begin(page, cls = "warrior", weapon) {
  await page.goto("/");
  await page.locator("[data-action=create]").click();
  await page.locator(`[data-class=${cls}]`).click();
  if (weapon) await page.locator(`[data-start-weapon=${weapon}]`).click();
  await page.locator("[data-action=start]").click();
  await expect(page.locator("#hud")).toBeVisible();
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.equipWeapon(g.save.ownedWeapons[0]);
    g.attackCooldown = 0;
  });
}
async function approach(page, id) {
  await page.evaluate((id) => {
    const g = window.__ELDERIA__.game,
      o = g.world.objects.find((o) => o.id === id);
    g.save.x = o.x;
    g.save.y = o.y + 20;
    g.path = [];
  }, id);
  await page.keyboard.press("KeyE");
}

test("starter weapons and smith purchases change real attacks and persist after reload", async ({
  page,
}) => {
  await begin(page, "warrior", "spear");
  expect(await page.evaluate(() => window.__ELDERIA__.game.stats.range)).toBe(
    92,
  );
  await page.evaluate(() => {
    window.__ELDERIA__.game.save.gold = 250;
  });
  await approach(page, "smith");
  await page.locator("[data-action=buyWeapon-greatsword]").click();
  expect(await page.evaluate(() => window.__ELDERIA__.game.save.gold)).toBe(
    100,
  );
  await page.locator("[data-action=equip-spear]").click();
  await page.locator("[data-action=close]").first().click();
  await page.keyboard.press("KeyI");
  await page.locator(".inventory-details summary").click();
  await page.locator("[data-action=equip-greatsword]").click();
  await page.reload();
  await page.locator("[data-action=continue]").click();
  const result = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    return {
      equipped: g.save.equippedWeapon,
      owned: g.save.ownedWeapons,
      damage: g.stats.damage,
      cooldown: g.stats.cooldown,
      wrongClass: g.equipWeapon("bow"),
    };
  });
  expect(result).toEqual({
    equipped: "greatsword",
    owned: ["spear", "greatsword"],
    damage: 26,
    cooldown: 0.78,
    wrongClass: false,
  });
});

test("skill book unlocks abilities and defense, cooldowns and collision-safe charges work together", async ({
  page,
}) => {
  await begin(page);
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.save.level = 4;
    g.save.skillPoints = 3;
    g.save.gold = 200;
    g.save.inventory.warriorScroll = 1;
    g.save.abilityUses.whirlwind = 5;
    const mentor = g.world.objects.find((o) => o.id === "bladeMentor");
    g.save.x = mentor.x;
    g.save.y = mentor.y + 20;
    g.save.mana = g.stats.maxMana;
  });
  await page.keyboard.press("KeyK");
  await page.locator("[data-action=learn-1]").click();
  await page.locator("[data-action=learn-2]").click();
  await page.locator("[data-action=learn-0]").click();
  await expect(page.locator(".skills-intro strong")).toContainText("0");
  await page.locator("[data-action=close]").first().click();
  const result = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.setPaused(true);
    g.paused = false;
    const before = g.save.hp;
    g.useSkill(1);
    g.hurt(20);
    const protectedDamage = before - g.save.hp;
    const mana = g.save.mana;
    const repeat = g.useSkill(1),
      spentAgain = g.save.mana !== mana;
    g.useSkill(0);
    const independent = g.skillCooldownAt(0) > 0 && g.skillCooldownAt(1) > 0;
    g.save.mana = g.stats.maxMana;
    g.controls.autoAim = false;
    g.pointer = { x: g.save.x + 150, y: g.save.y };
    g.useSkill(2);
    const x = g.save.x,
      wallX = Math.floor(x / 24) + 2,
      row = Math.floor(g.save.y / 24);
    for (let y = row - 2; y <= row + 2; y++)
      g.world.blocked[y * g.world.width + wallX] = 1;
    for (let i = 0; i < 10; i++) g.update(0.04);
    const stopped = g.save.x < wallX * 24;
    g.dash = { remaining: 1 };
    g.respawn();
    g.paused = true;
    return {
      ranks: g.save.skillRanks,
      protectedDamage,
      repeat,
      spentAgain,
      independent,
      stopped,
      dash: g.dash,
      zones: g.zones.length,
    };
  });
  expect(result).toEqual({
    ranks: [2, 1, 1],
    protectedDamage: 9,
    repeat: false,
    spentAgain: false,
    independent: true,
    stopped: true,
    dash: null,
    zones: 0,
  });
});

test("frost slows targets and meteor damage occurs only after its warning", async ({
  page,
}) => {
  await begin(page, "mage", "staff");
  const result = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.setPaused(true);
    g.paused = false;
    g.save.level = 4;
    g.save.skillRanks = [1, 1, 1];
    g.save.mana = g.stats.maxMana;
    const e = {
      ...g.enemies.find((e) => e.type === "slime"),
      hp: 1000,
      maxHp: 1000,
      x: g.save.x + 50,
      y: g.save.y,
      speed: 0,
      cooldown: 999,
    };
    g.enemies = [e];
    g.useSkill(1);
    const slow = e.slow;
    g.useSkill(2);
    const warnedHp = e.hp;
    for (let i = 0; i < 5; i++) g.update(0.04);
    const earlyHp = e.hp;
    for (let i = 0; i < 14; i++) g.update(0.04);
    const lateHp = e.hp;
    g.paused = true;
    return {
      slow,
      warnedHp,
      earlyHp,
      lateHp,
      cooldowns: g.skillCooldowns.slice(1, 3),
    };
  });
  expect(result.slow).toBe(4);
  expect(result.earlyHp).toBe(result.warnedHp);
  expect(result.lateHp).toBeLessThan(result.earlyHp - 80);
  expect(result.cooldowns.every((n) => n > 0)).toBe(true);
});

test("crossbow pierces two targets and bow hunter marks increase damage without charging empty casts", async ({
  page,
}) => {
  await begin(page, "ranger", "crossbow");
  const result = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.setPaused(true);
    g.paused = false;
    g.controls.autoAim = false;
    g.pointer = { x: g.save.x + 150, y: g.save.y };
    g.save.level = 4;
    g.save.skillRanks = [1, 1, 1];
    g.save.mana = g.stats.maxMana;
    const base = g.enemies.find((e) => e.type === "slime");
    g.enemies = [45, 85].map((dx, i) => ({
      ...base,
      id: "pierce" + i,
      x: g.save.x + dx,
      y: g.save.y,
      hp: 1000,
      maxHp: 1000,
      speed: 0,
      cooldown: 999,
    }));
    const damage = g.stats.damage;
    g.attack();
    for (let i = 0; i < 12; i++) g.update(0.03);
    const pierced = g.enemies.map((e) => 1000 - e.hp);
    g.save.ownedWeapons.push("bow");
    g.equipWeapon("bow");
    g.save.skillRanks = [1, 1, 1];
    g.useSkill(2);
    const hp = g.enemies[0].hp;
    g.damageEnemy(g.enemies[0], 20);
    const markedDamage = hp - g.enemies[0].hp;
    g.skillCooldowns[2] = 0;
    g.enemies = [];
    const mana = g.save.mana,
      empty = g.useSkill(2),
      spent = g.save.mana !== mana;
    g.paused = true;
    return { damage, pierced, markedDamage, empty, spent };
  });
  expect(result.pierced).toEqual([result.damage, result.damage]);
  expect(result.markedDamage).toBe(30);
  expect(result.empty).toBe(false);
  expect(result.spent).toBe(false);
});

test("key rebinding swaps conflicts, controls persist and the rebound skill key casts", async ({
  page,
}) => {
  await begin(page);
  await page.keyboard.press("Escape");
  await page.locator("[data-action=controls]").click();
  await page.locator("[data-rebind=skill1]").click();
  await page.keyboard.press("Space");
  await expect(page.locator("[data-rebind=skill1]")).toHaveText("SPACE");
  await expect(page.locator("[data-rebind=attack]")).toHaveText("Q");
  await page.locator("[data-control=autoAim]").uncheck();
  await page.locator("[data-control=screenShake]").uncheck();
  await page.reload();
  await page.locator("[data-action=continue]").click();
  await page.keyboard.press("Space");
  const controls = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    return {
      autoAim: g.controls.autoAim,
      shake: g.controls.screenShake,
      skill: g.controls.bindings.skill1,
      attack: g.controls.bindings.attack,
      cooldown: g.skillCooldownAt(0),
    };
  });
  expect(controls).toMatchObject({
    autoAim: false,
    shake: false,
    skill: "Space",
    attack: "KeyQ",
  });
  expect(controls.cooldown).toBeGreaterThan(0);
});

test("map markers start walking routes and camp travel requires discovery and safety", async ({
  page,
}) => {
  await begin(page);
  await page.keyboard.press("KeyM");
  await expect(page.locator("[data-action=travel-camp3]")).toBeDisabled();
  const map = await page.locator("#large-map").boundingBox();
  await page.mouse.click(
    map.x + (map.width * 24.5) / 256,
    map.y + (map.height * 65.5) / 192,
  );
  await expect(page.locator("#map-marker-label")).toContainText("Отметка:");
  const marker = await page.evaluate(() => window.__ELDERIA__.game.waypoint);
  expect(marker.x).toBeCloseTo(24.5 * 24, 0);
  expect(marker.y).toBeCloseTo(65.5 * 24, 0);
  await page.locator("[data-action=mapWalk]").click();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.path.length),
  ).toBeGreaterThan(0);
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.path = [];
    g.rest(g.world.objects.find((o) => o.id === "camp3"));
    const e = g.enemies.find((e) => e.type === "slime");
    e.x = g.save.x + 30;
    e.y = g.save.y;
  });
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.fastTravel("camp3")),
  ).toBe(false);
  await page.evaluate(() => (window.__ELDERIA__.game.enemies = []));
  await page.keyboard.press("KeyM");
  await page.locator("[data-action=mapZoomIn]").click();
  await expect(page.locator("#map-zoom-value")).toHaveText("135%");
  await page.locator("[data-action=travel-camp3]").click();
  const destination = await page.evaluate(() => ({
    x: window.__ELDERIA__.game.save.x,
    y: window.__ELDERIA__.game.save.y,
  }));
  expect(destination).toEqual({ x: 138 * 24 + 12 + 24, y: 82 * 24 + 12 });
  await page.reload();
  await page.locator("[data-action=continue]").click();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.visitedCamps),
  ).toContain("camp3");
});

test("two fingers can move and attack independently", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() => {
    Element.prototype.requestFullscreen = async () => {};
  });
  const page = await context.newPage();
  await begin(page);
  await page.waitForTimeout(250);
  const session = await context.newCDPSession(page),
    j = await page.locator("#joystick").boundingBox(),
    a = await page.locator("[data-action=attack]").boundingBox();
  const joy = { x: j.x + j.width * 0.75, y: j.y + j.height * 0.5, id: 1 },
    attack = { x: a.x + a.width * 0.5, y: a.y + a.height * 0.5, id: 2 };
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [joy],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [joy, attack],
  });
  expect(await page.evaluate(() => window.__ELDERIA__.game.heldAttack)).toBe(
    true,
  );
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [joy],
  });
  expect(
    await page.evaluate(() => ({
      held: window.__ELDERIA__.game.heldAttack,
      x: window.__ELDERIA__.game.joystick.x,
    })),
  ).toEqual({ held: true, x: 0 });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(await page.evaluate(() => window.__ELDERIA__.game.heldAttack)).toBe(
    false,
  );
  await context.close();
});

test("the farlands patrol awards one weapon and keeps completion after reloading", async ({
  page,
}) => {
  await begin(page);
  await approach(page, "captain");
  await page.locator("[data-action=acceptExpedition]").click();
  await page.locator("[data-action=close]").first().click();
  const before = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.setPaused(true);
    for (const type of ["wolf", "sentinel"])
      for (const e of g.enemies
        .filter((e) => e.type === type)
        .slice(0, type === "wolf" ? 6 : 4))
        g.damageEnemy(e, e.hp);
    g.setPaused(false);
    return { gold: g.save.gold, points: g.save.skillPoints };
  });
  await approach(page, "captain");
  await page.locator("[data-action=expeditionReward]").click();
  const after = await page.evaluate(() => {
    const s = window.__ELDERIA__.game.save;
    return {
      gold: s.gold,
      points: s.skillPoints,
      weapons: s.ownedWeapons,
      done: s.flags.expeditionDone,
    };
  });
  expect(after.gold).toBe(before.gold + 160);
  expect(after.points).toBeGreaterThan(before.points);
  expect(after.weapons).toEqual(["sword", "spear"]);
  expect(after.done).toBe(true);
  await expect(page.locator("[data-action=expeditionReward]")).toHaveCount(0);
  await page.reload();
  await page.locator("[data-action=continue]").click();
  expect(
    await page.evaluate(
      () => window.__ELDERIA__.game.save.flags.expeditionDone,
    ),
  ).toBe(true);
});

test("melee combos, traps and enemy warning projectiles affect combat", async ({
  page,
}) => {
  await begin(page);
  const combo = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.setPaused(true);
    g.paused = false;
    const e = {
      ...g.enemies.find((e) => e.type === "slime"),
      hp: 1000,
      maxHp: 1000,
      x: g.save.x + 25,
      y: g.save.y,
    };
    g.enemies = [e];
    const hits = [];
    for (let i = 0; i < 3; i++) {
      g.attackCooldown = 0;
      const hp = e.hp;
      g.attack();
      hits.push(hp - e.hp);
    }
    g.paused = true;
    return hits;
  });
  expect(combo).toEqual([16, 16, 22]);
  await page.evaluate(async () => {
    const { newSave } = await import("/src/storage.js");
    const g = window.__ELDERIA__.game;
    g.load(newSave("Hunter", "ranger", {}));
    g.equipWeapon("bow");
    g.save.level = 2;
    g.save.skillRanks = [1, 1, 0];
    g.save.mana = g.stats.maxMana;
  });
  const trap = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.paused = false;
    const e = {
      ...g.enemies.find((e) => e.type === "sentinel"),
      hp: 500,
      maxHp: 500,
      x: g.save.x + 100,
      y: g.save.y,
      speed: 0,
      cooldown: 0,
    };
    g.enemies = [e];
    g.useSkill(1);
    g.update(0.04);
    const trapped = e.hp < 500 && e.slow > 0;
    for (let i = 0; i < 19; i++) g.update(0.04);
    const warnedShot = g.projectiles.some((p) => p.enemy);
    const hp = g.save.hp;
    for (let i = 0; i < 22; i++) g.update(0.04);
    g.paused = true;
    return { trapped, warnedShot, damage: hp - g.save.hp };
  });
  expect(trap.trapped).toBe(true);
  expect(trap.warnedShot).toBe(true);
  expect(trap.damage).toBeGreaterThan(0);
});

test("large world rendering keeps terrain cache bounded while every new biome renders", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await begin(page);
  const info = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.setPaused(true);
    const c = document.createElement("canvas");
    c.width = c.height = 384;
    const ctx = c.getContext("2d");
    for (let y = 0; y < 136; y += 16)
      for (let x = 0; x < 172; x += 16)
        g.terrain.draw(ctx, x * 24, y * 24, 384, 384);
    return {
      cache: g.terrain.chunks.size,
      overview: [g.terrain.overview.width, g.terrain.overview.height],
      enemies: g.enemies.length,
    };
  });
  expect(info.cache).toBe(24);
  expect(info.overview).toEqual([1024, 768]);
  expect(info.enemies).toBeGreaterThan(40);
  expect(errors).toEqual([]);
});

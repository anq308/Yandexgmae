import { test, expect } from "@playwright/test";

async function begin(page, cls = "warrior") {
  await page.goto("/");
  // Crits and random drops are disabled so damage checks stay deterministic.
  await page.evaluate(() => (window.__ELDERIA__.game.rng = () => 0.99));
  await page.getByRole("button", { name: "Начать путешествие" }).click();
  await page.locator(`[data-class="${cls}"]`).click();
  await page.locator("#hero-name").fill("Тестовый герой");
  await page.locator('[data-action="start"]').click();
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

test("create all classes, preserve choices, save and resume without losing progress", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await begin(page, "mage");
  await expect(page.locator("#class-label")).toHaveText("Человек · Маг");
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(250);
  await page.keyboard.up("KeyD");
  const before = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.save.gold = 77;
    g.persist();
    return { x: g.save.x, y: g.save.y };
  });
  await page.reload();
  await page.locator('[data-action="continue"]').click();
  const after = await page.evaluate(() => ({
    x: window.__ELDERIA__.game.save.x,
    y: window.__ELDERIA__.game.save.y,
    gold: window.__ELDERIA__.game.save.gold,
    cls: window.__ELDERIA__.game.save.characterClass,
  }));
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.y).toBeCloseTo(before.y, 0);
  expect(after.gold).toBe(77);
  expect(after.cls).toBe("mage");
  expect(errors).toEqual([]);
});
test("complete the story chain through conversations, claim each reward once and keep progress on reload", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await begin(page);
  const choose = (a) => page.locator(`[data-action="${a}"]`).click();
  const quest = () => page.evaluate(() => window.__ELDERIA__.game.save.quest);
  const killWave = () =>
    page.evaluate(() => {
      const g = window.__ELDERIA__.game;
      g.setPaused(true);
      for (const e of g.enemies.filter((e) => e.storyWave)) g.damageEnemy(e, 99999);
      g.storyTick();
      g.setPaused(false);
    });
  await approach(page, "elder");
  await choose("sc-prologue-start-accept");
  expect(await quest()).toBe(1);
  await approach(page, "forestRune");
  await choose("sc-forest-start-light");
  expect(await page.evaluate(() => window.__ELDERIA__.game.enemies.filter((e) => e.storyWave === "forest").length)).toBe(5);
  await killWave();
  expect(await quest()).toBe(2);
  await approach(page, "elder");
  await choose("sc-oliver2-start-next");
  await choose("sc-oliver2-news-gold");
  expect(await quest()).toBe(3);
  await approach(page, "mountainRune");
  await choose("sc-ivva-start-fight");
  await killWave();
  expect(await quest()).toBe(4);
  await approach(page, "scout");
  await choose("sc-rin-start-oath");
  expect(await quest()).toBe(5);
  await approach(page, "altar");
  await choose("sc-guardian-start-fight");
  expect(await page.evaluate(() => window.__ELDERIA__.game.save.flags.bossAwake)).toBe(true);
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.damageEnemy(g.enemies.find((e) => e.type === "guardian"), 99999);
  });
  await expect(page.getByRole("dialog")).toContainText("Свет вернулся");
  await page.locator('.modal-header [data-action="close"]').click();
  await approach(page, "elder");
  await choose("sc-seals-start-finish");
  expect(await quest()).toBe(7);
  const gold = await page.evaluate(() => window.__ELDERIA__.game.save.gold);
  await page.evaluate(() => window.__ELDERIA__.action("sc-seals-start-finish"));
  expect(await page.evaluate(() => window.__ELDERIA__.game.save.gold)).toBe(gold);
  const fate = await page.evaluate(() => window.__ELDERIA__.game.save.story.fate);
  expect(fate).toEqual({ lea: "saved", ivva: "fled", rin: "ally", guardian: "slain" });
  await page.reload();
  await page.locator('[data-action="continue"]').click();
  await expect(page.locator("#quest-title")).toHaveText("Четыре печати глубин");
  expect(errors).toEqual([]);
});
test("real attacks, cooldowns, potions, campfires and death recovery behave correctly", async ({
  page,
}) => {
  await begin(page, "warrior");
  const result = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save,
      e = g.enemies.find((e) => e.type === "slime");
    g.setPaused(false);
    s.x = e.x;
    s.y = e.y + 20;
    g.attack();
    const first = e.hp;
    g.attack();
    const second = e.hp;
    g.attack(true);
    const mana = s.mana;
    const skill = g.skillCooldown;
    s.hp -= 60;
    g.potion();
    return {
      first,
      second,
      mana,
      skill,
      hp: s.hp,
      max: g.stats.maxHp,
      potions: s.inventory.potion,
    };
  });
  // Slimes have 118 HP after the 1.8 difficulty pass; one sword hit deals 16.
  expect(result.first).toBe(102);
  expect(result.second).toBe(102);
  expect(result.mana).toBe(45);
  expect(result.skill).toBe(5);
  expect(result.hp).toBe(result.max);
  expect(result.potions).toBe(1);
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.invincible = 0;
    g.hurt(9999);
  });
  await expect(page.getByRole("dialog")).toContainText("Даже герою");
  await page.locator('[data-action="respawn"]').click();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.hp),
  ).toBeGreaterThan(0);
  await approach(page, "camp1");
  await page.locator('[data-action="rest-camp1"]').click();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.checkpoint),
  ).toBe("camp1");
});
test("menus really pause simulation and crafting cannot block the main quest", async ({
  page,
}) => {
  await begin(page);
  await page.keyboard.press("KeyI");
  expect(await page.evaluate(() => window.__ELDERIA__.game.paused)).toBe(true);
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.save.inventory.herb = 3;
    g.collected = new Set(["herb0", "herb1", "herb2"]);
    g.save.quest = 1;
    g.persist();
  });
  await page.locator('[data-action="invTab-craft"]').click();
  await page.locator('[data-action="recipe-potion"]').click();
  await page.locator('[data-action="craftOutput"]').click();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.inventory.herb),
  ).toBe(0);
  expect(
    await page.evaluate(() =>
      window.__ELDERIA__.canActivate(
        window.__ELDERIA__.game.save,
        "forestRune",
      ),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.__ELDERIA__.game.paused)).toBe(false);
});
test("ranger and mage projectiles hit enemies and skill cooldowns prevent repeated spending", async ({
  page,
}) => {
  await begin(page, "ranger");
  const result = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save,
      e = g.enemies.find((e) => e.type === "slime");
    e.x = s.x + 55;
    e.y = s.y;
    e.speed = 0;
    g.setPaused(false);
    g.attack();
    for (let i = 0; i < 12; i++) g.update(0.02);
    const rangerHp = e.hp;
    s.characterClass = "mage";
    s.ownedWeapons = ["staff"];
    g.equipWeapon("staff");
    s.abilityRanks.starwave = 1;
    g.attackCooldown = 0;
    e.hp = e.maxHp;
    g.projectiles = [];
    g.attack();
    for (let i = 0; i < 12; i++) g.update(0.02);
    const mageHp = e.hp;
    s.mana = 60;
    g.skillCooldown = 0;
    g.attack(true);
    const mana = s.mana;
    g.attack(true);
    return { rangerHp, mageHp, mana, afterRepeated: s.mana };
  });
  expect(result.rangerHp).toBe(106);
  expect(result.mageHp).toBe(98);
  expect(result.mana).toBe(35);
  expect(result.afterRepeated).toBe(35);
});
test("side quests consume resources once and upgrades respect prices", async ({
  page,
}) => {
  await begin(page);
  await approach(page, "herbalist");
  await page.locator('[data-action="acceptHerbs"]').click();
  await page.evaluate(() => (window.__ELDERIA__.game.save.inventory.herb = 6));
  await page.locator('[data-action="herbReward"]').click();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.flags.herbQuestDone),
  ).toBe(true);
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.inventory.herb),
  ).toBe(0);
  await page.locator('.modal-header [data-action="close"]').click();
  await approach(page, "smith");
  await page.locator('[data-action="acceptSmith"]').click();
  await page.evaluate(() => (window.__ELDERIA__.game.save.inventory.ore = 4));
  await page.locator('[data-action="smithReward"]').click();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.weaponLevel),
  ).toBe(1);
  await expect(page.locator('[data-action="upgradeWeapon"]')).toBeDisabled();
  await page.evaluate(() => window.__ELDERIA__.action("upgradeWeapon"));
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.weaponLevel),
  ).toBe(1);
});
test("touch controls and all essential HUD buttons stay inside portrait and landscape screens", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() => {
    Element.prototype.requestFullscreen = async () => {};
  });
  const page = await context.newPage();
  await begin(page, "ranger");
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(200);
    const layout = await page.evaluate(() => ({
      scrollX: document.documentElement.scrollWidth > innerWidth,
      scrollY: document.documentElement.scrollHeight > innerHeight,
      buttons: [
        ...document.querySelectorAll("#hud .action-slot,#joystick"),
      ].map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
      }),
    }));
    expect(layout.scrollX).toBe(false);
    expect(layout.scrollY).toBe(false);
    for (const b of layout.buttons) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.right).toBeLessThanOrEqual(size.width);
      expect(b.bottom).toBeLessThanOrEqual(size.height);
    }
  }
  const before = await page.evaluate(() => window.__ELDERIA__.game.save.x);
  const joystick = await page.locator("#joystick").boundingBox();
  await page.mouse.move(
    joystick.x + joystick.width * 0.8,
    joystick.y + joystick.height * 0.5,
  );
  await page.mouse.down();
  await page.waitForTimeout(300);
  await page.mouse.up();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.x),
  ).toBeGreaterThan(before);
  await context.close();
});
test("English localization works and new-game cancellation preserves the saved hero", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-action="language"]').click();
  await expect(page.locator("h1")).toContainText("Every valley");
  await page.locator('[data-action="create"]').click();
  await expect(page.locator("h1")).toContainText("hero");
  await page.locator('[data-action="start"]').click();
  await expect(page.locator("#class-label")).toHaveText("Human · Warrior");
  await page.keyboard.press("Escape");
  await page.locator('[data-action="leave"]').click();
  await page.locator('[data-action="create"]').click();
  await expect(page.getByRole("dialog")).toContainText("one save slot");
  await page.locator('.modal-header [data-action="close"]').click();
  await page.locator('[data-action="continue"]').click();
  await expect(page.locator("#class-label")).toHaveText("Human · Warrior");
});

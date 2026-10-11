import { test, expect } from "@playwright/test";
async function begin(page, cls = "warrior", race) {
  await page.goto("/");
  await page.evaluate(() => (window.__ELDERIA__.game.rng = () => 0.99));
  await page.locator("[data-action=create]").click();
  if (race) await page.locator(`[data-race=${race}]`).click();
  await page.locator(`[data-class=${cls}]`).click();
  await page.locator("[data-action=start]").click();
  await expect(page.locator("#hud")).toBeVisible();
}

test("races are chosen at creation and change real stats", async ({ page }) => {
  await begin(page, "warrior", "orc");
  const orc = await page.evaluate(async () => {
    const { newSave } = await import("/src/storage.js"),
      { deriveStats } = await import("/src/equipment.js"),
      { classes } = await import("/src/i18n.js");
    const g = window.__ELDERIA__.game,
      stats = (race) => deriveStats({ ...newSave("A", "warrior", {}, "sword", race), equippedWeapon: "sword" }, classes.warrior);
    return { race: g.save.race, orc: stats("orc"), human: stats("human"), elf: stats("elf"), dwarf: stats("dwarf") };
  });
  expect(orc.race).toBe("orc");
  expect(orc.orc.damage).toBeGreaterThan(orc.human.damage);
  expect(orc.elf.maxMana).toBe(orc.human.maxMana + 25);
  expect(orc.dwarf.defense).toBe(orc.human.defense + 5);
  await expect(page.locator("#class-label")).toHaveText("Орк · Воин");
});

test("conversations offer numbered answers, class answers are tagged and the finale has endings", async ({ page }) => {
  await begin(page);
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      elder = g.world.objects.find((o) => o.id === "elder");
    Object.assign(g.save, { x: elder.x, y: elder.y + 20 });
    g.onInteract(elder);
  });
  // Four common answers plus the warrior's own.
  await expect(page.locator(".vn-choices .button")).toHaveCount(5);
  await expect(page.locator(".vn-choices .choice-tag")).toHaveText(["[Воин]"]);
  await page.keyboard.press("Digit2");
  await expect(page.locator(".vn-text")).toContainText("Знак Рассвета выбирает сам");
  await expect(page.locator(".vn-choices .button")).toHaveCount(4);
  await page.locator('[data-action="sc-prologue-start-w"]').click();
  expect(await page.evaluate(() => [window.__ELDERIA__.game.save.quest, window.__ELDERIA__.game.save.story.trust])).toEqual([1, 1]);
  const dusk = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save,
      before = g.stats.damage;
    s.quest = 10;
    window.__ELDERIA__.action("epilogueDusk");
    return { quest: s.quest, dusk: s.flags.duskPower, stronger: g.stats.damage > before };
  });
  expect(dusk).toEqual({ quest: 11, dusk: true, stronger: true });
  await expect(page.getByRole("dialog")).toContainText("Повелителя сумерек");
});

test("choices decide fates: a dark bargain kills Lea, changes Rin and weakens Nerei", async ({ page }) => {
  await begin(page, "necromancer", "undead");
  const talk = (id) =>
    page.evaluate((id) => {
      const g = window.__ELDERIA__.game,
        o = g.world.objects.find((o) => o.id === id);
      Object.assign(g.save, { x: o.x, y: o.y + 20 });
      g.onInteract(o);
    }, id);
  const act = (a) => page.evaluate((a) => window.__ELDERIA__.action(a), a);
  await talk("elder");
  await expect(page.locator(".choice-tag")).toHaveText(["[Некромант]", "[Нежить]"]);
  await act("sc-prologue-start-n");
  await talk("forestRune");
  await expect(page.locator(".choice-tag")).toHaveText(["[Некромант]"]);
  await act("sc-forest-start-dead");
  await act("sc-forest-start-drink");
  const power = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    for (const e of g.enemies.filter((e) => e.storyWave)) g.damageEnemy(e, 99999);
    g.storyTick();
    return [g.save.quest, g.save.flags.obeliskPower];
  });
  expect(power).toEqual([2, true]);
  await talk("elder");
  await act("sc-oliver2-start-confront");
  await act("sc-oliver2-confess-tell");
  await act("sc-oliver2-news-gold");
  await talk("mountainRune");
  await act("sc-ivva-start-deal");
  await act("sc-ivva-afterDeal-go");
  await talk("scout");
  // Lea is dead: Rin can only be told the truth or lied to.
  await expect(page.locator('[data-action="sc-rin-start-oath"]')).toHaveCount(0);
  await act("sc-rin-start-truth");
  const mid = await page.evaluate(() => {
    const s = window.__ELDERIA__.game.save;
    return { quest: s.quest, fate: s.story.fate, dusk: s.story.dusk >= 5, trust: s.story.trust };
  });
  expect(mid).toEqual({ quest: 5, fate: { lea: "dead", ivva: "pact", rin: "enemy" }, dusk: true, trust: -2 });
  await talk("altar");
  // Knowing the whole truth lets the Warden rest without a fight.
  await act("sc-guardian-start-spare");
  expect(await page.evaluate(() => [window.__ELDERIA__.game.save.quest, window.__ELDERIA__.game.save.flags.guardianBlessing])).toEqual([6, true]);
  const shaped = await page.evaluate(async () => {
    const { heralds } = await import("/src/eclipse.js");
    const g = window.__ELDERIA__.game,
      s = g.save;
    s.quest = 9;
    for (const h of heralds) s.flags["shard-" + h.shard] = true;
    const altar = g.world.objects.find((o) => o.id === "altar");
    Object.assign(s, { x: altar.x, y: altar.y + 20 });
    window.__ELDERIA__.action("sc-nerei-start-heard");
    const boss = g.enemies.find((e) => e.type === "eclipse");
    return { ratio: Math.round((boss.maxHp / 18400) * 100), ashen: g.enemies.filter((e) => e.storyWave === "ashen").length };
  });
  // Heard (×0.8) and Ivva's pact (×0.9); Rin leads three Ashen against you.
  expect(shaped).toEqual({ ratio: 72, ashen: 3 });
  await page.evaluate(() => {
    const s = window.__ELDERIA__.game.save;
    s.quest = 10;
    const elder = window.__ELDERIA__.game.world.objects.find((o) => o.id === "elder");
    Object.assign(s, { x: elder.x, y: elder.y + 20 });
    window.__ELDERIA__.game.onInteract(elder);
  });
  await page.locator('[data-action="sc-epilogue-start-peace"]').click();
  await expect(page.getByRole("dialog")).toContainText("Примирителя братьев");
  await expect(page.locator(".fate-list li")).toHaveCount(5);
});

test("Rin's arrows help against Nerei and chests hold varied loot", async ({ page }) => {
  await begin(page);
  const r = await page.evaluate(async () => {
    const { heralds } = await import("/src/eclipse.js");
    const g = window.__ELDERIA__.game,
      s = g.save;
    s.story = { fate: { rin: "ally" } };
    s.quest = 9;
    for (const h of heralds) s.flags["shard-" + h.shard] = true;
    const altar = g.world.objects.find((o) => o.id === "altar");
    Object.assign(s, { x: altar.x, y: altar.y + 20 });
    g.openRift();
    const boss = g.enemies.find((e) => e.type === "eclipse"),
      full = boss.hp;
    for (let i = 0; i < 20; i++) g.storyBattle(0.5);
    // Two chests far apart: the distant one is richer.
    g.groundLoot = [];
    const chests = g.world.objects.filter((o) => o.type === "chest").sort((a, b) => a.x + a.y - (b.x + b.y));
    const near = g.openChest(chests[0]),
      far = g.openChest(chests[chests.length - 1]);
    return { hurt: boss.hp < full, nearTier: near.tier, farTier: far.tier, found: far.found.length >= 2, drops: g.groundLoot.length >= 6 };
  });
  expect(r.hurt).toBe(true);
  expect(r.farTier).toBeGreaterThan(r.nearTier);
  expect(r.found && r.drops).toBe(true);
});

test("dungeon difficulties gate by level and toughen foes", async ({ page }) => {
  await begin(page);
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save,
      portal = g.world.objects.find((o) => o.dungeon === "crypt");
    g.setPaused(true);
    g.enemies = [];
    Object.assign(s, { x: portal.x, y: portal.y });
    s.level = 5;
    const lockedHeroic = g.enterDungeon("crypt", 1);
    const normal = g.enterDungeon("crypt", 0),
      normalHp = g.enemies.find((e) => e.guard).maxHp;
    g.leaveDungeon(true);
    Object.assign(s, { x: portal.x, y: portal.y });
    s.level = 12;
    g.enemies = [];
    const nightmare = g.enterDungeon("crypt", 2),
      e = g.enemies.find((e) => e.guard);
    g.syncEnemyLevels();
    return { lockedHeroic, normal, nightmare, harder: e.maxHp > normalHp * 2, difficulty: s.activeDungeon.difficulty, keptScale: e.scaled };
  });
  expect(r).toEqual({ lockedHeroic: false, normal: true, nightmare: true, harder: true, difficulty: 2, keptScale: true });
  await page.evaluate(() => window.__ELDERIA__.game.onChange());
  await expect(page.locator("#dungeon-status")).toContainText("Кошмар");
});

test("the smith shop has tabs, quick buy buttons and a detail panel; campfires unlock on approach", async ({ page }) => {
  await begin(page, "mage");
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.save.gold = 500;
    g.onInteract(g.world.objects.find((o) => o.id === "smith"));
  });
  await expect(page.locator(".vendor-row")).not.toHaveCount(0);
  await page.locator('[data-action="vendorTab-armor"]').click();
  await page.locator('[data-action="vendorSel-cloth"]').click();
  await expect(page.locator(".vendor-detail")).toContainText("Стёганый");
  await page.locator('[data-action="armorBuy-cloth"]').first().click();
  expect(await page.evaluate(() => window.__ELDERIA__.game.save.equippedArmor)).toBe("cloth");
  await page.keyboard.press("Escape");
  const camp = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save,
      c = g.world.objects.find((o) => o.id === "camp2");
    Object.assign(s, { x: c.x + 40, y: c.y });
    g.enemies = [];
    g.paused = false;
    g.update(0.6);
    g.paused = true;
    return s.visitedCamps.includes("camp2");
  });
  expect(camp).toBe(true);
});

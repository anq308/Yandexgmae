import { test, expect } from "@playwright/test";
async function begin(page, cls = "warrior", weapon) {
  await page.goto("/");
  // Crits and random drops are disabled so damage checks stay deterministic.
  await page.evaluate(() => (window.__ELDERIA__.game.rng = () => 0.99));
  await page.locator("[data-action=create]").click();
  await page.locator(`[data-class=${cls}]`).click();
  if (weapon) await page.locator(`[data-start-weapon=${weapon}]`).click();
  await page.locator("[data-action=start]").click();
  await expect(page.locator("#hud")).toBeVisible();
}

test("armed start, backpack equipment, armor drag, stacks, crafting grid and saved layout", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await begin(page);
  expect(
    await page.evaluate(() => {
      const g = window.__ELDERIA__.game;
      return [g.save.equippedWeapon, g.save.equippedArmor, g.stats.damage];
    }),
  ).toEqual(["sword", "none", 16]);
  await page.keyboard.press("KeyI");
  await expect(page.locator(".gear-cell.filled")).toHaveCount(1);
  // Taking the sword off and dragging it back restores the damage.
  await page.locator('[data-action="unequip-mainhand"]').click();
  expect(await page.evaluate(() => window.__ELDERIA__.game.stats.damage)).toBe(8);
  await page
    .locator('[data-bag-key="w:sword"]')
    .dragTo(page.locator("[data-gear-slot=mainhand]"));
  expect(await page.evaluate(() => window.__ELDERIA__.game.stats.damage)).toBe(
    16,
  );
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    Object.assign(g.save.inventory, { wood: 4, fiber: 130, herb: 6 });
    g.save.ownedWearables.push("linenCap");
    window.__ELDERIA__.action("inventory");
  });
  await expect(page.locator('[data-bag-key^="i:fiber:"]')).toHaveCount(3);
  await page
    .locator('[data-bag-key="g:linenCap"]')
    .dragTo(page.locator("[data-gear-slot=head]"));
  expect(
    await page.evaluate(
      () => window.__ELDERIA__.game.save.equippedWearables.head,
    ),
  ).toBe("linenCap");
  await page.locator("[data-action=invTab-craft]").click();
  await page.locator("[data-action=recipe-rod]").click();
  await page.locator("[data-action=craftOutput]").click();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.inventory.rod),
  ).toBe(1);
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.inventory.wood),
  ).toBe(2);
  const before = await page.evaluate(
    () => window.__ELDERIA__.game.save.inventory.fiber,
  );
  await page.locator("[data-action=invTab-gear]").click();
  await page
    .locator('[data-bag-key="i:fiber:0"]')
    .dragTo(page.locator('[data-bag-key="i:wood:0"]'));
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.bagOrder.length),
  ).toBeGreaterThan(0);
  await page.reload();
  await page.locator("[data-action=continue]").click();
  expect(
    await page.evaluate(() => {
      const s = window.__ELDERIA__.game.save;
      return [
        s.inventory.rod,
        s.inventory.fiber,
        s.equippedWearables.head,
        s.equippedWeapon,
      ];
    }),
  ).toEqual([1, before, "linenCap", "sword"]);
  expect(errors).toEqual([]);
});

test("abilities need only a skill point and the hero level; manuscripts grant points and mentors reset", async ({
  page,
}) => {
  await begin(page);
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save;
    g.equipWeapon("sword");
    g.enemies = [];
    s.level = 2;
    s.skillPoints = 0;
    const noPoint = g.learnSkill("bulwark");
    s.skillPoints = 3;
    const lowLevel = g.learnSkill("whirlwind");
    const bulwark = g.learnSkill("bulwark");
    s.level = 6;
    const whirl = g.learnSkill("whirlwind");
    // A spear skill is learned while holding a sword: abilities belong to the class.
    const spear = g.learnSkill("spearline");
    s.inventory.warriorScroll = 1;
    const read = g.readManuscript(),
      pointsAfterRead = s.skillPoints;
    const farReset = g.respecSkills(),
      o = g.world.objects.find((o) => o.id === "bladeMentor");
    s.x = o.x;
    s.y = o.y + 15;
    s.gold = 300;
    const reset = g.respecSkills();
    return {
      noPoint,
      lowLevel,
      bulwark,
      whirl,
      spear,
      read,
      pointsAfterRead,
      farReset,
      reset,
      points: s.skillPoints,
      ranks: Object.keys(s.abilityRanks).length,
      gold: s.gold,
    };
  });
  expect(r).toEqual({
    noPoint: false,
    lowLevel: false,
    bulwark: true,
    whirl: true,
    spear: true,
    read: true,
    pointsAfterRead: 1,
    farReset: false,
    reset: true,
    points: 5,
    ranks: 0,
    gold: 200,
  });
});

test("ranger daggers grant real invisibility, reordered hotbars persist, cooldowns follow abilities and attacks reveal", async ({
  page,
}) => {
  await begin(page, "ranger", "daggers");
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.equipWeapon("daggers");
    g.save.level = 5;
    g.save.abilityRanks.vanish = 1;
    g.save.abilityRanks.shadowstep = 1;
    g.save.mana = 200;
  });
  await page.keyboard.press("KeyK");
  // Five ranger schools plus class utilities; the daggers' own school opens first.
  await expect(page.locator(".sb-school-tab")).toHaveCount(6);
  await expect(page.locator(".sb-school-tab.active")).toContainText("+15%");
  await expect(page.locator(".skill-card")).toHaveCount(3);
  await expect(page.locator(".skill-card[data-ability=vanish]")).toContainText(
    "Раствориться в тени",
  );
  await page
    .locator(".skill-node-icon[data-ability=vanish]")
    .dragTo(page.locator('.bar-edit-slot[data-bar-slot="0"]'));
  await page.keyboard.press("Escape");
  await page.keyboard.press("KeyQ");
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.buffs.stealth),
  ).toBeGreaterThan(0);
  await expect(page.locator("#buff-display")).toContainText("Невидимость");
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save;
    g.setPaused(true);
    g.paused = false;
    const e = {
      ...g.enemies.find((e) => e.type === "slime"),
      x: s.x + 20,
      y: s.y,
      hp: 1000,
      maxHp: 1000,
      speed: 80,
      windup: 0.2,
      cooldown: 0,
    };
    g.enemies = [e];
    const hp = s.hp,
      x = e.x;
    g.update(0.3);
    const hiddenSafe = s.hp === hp && e.x === x;
    g.attack();
    const reveal = g.buffs.stealth,
      damage = 1000 - e.hp;
    g.assignAbility("vanish", 1);
    const noReset = g.useSkill(1);
    s.ownedWeapons.push("bow");
    g.equipWeapon("bow");
    const bowIds = [...window.__ELDERIA__.barFor(s)];
    g.equipWeapon("daggers");
    const sameCD = g.skillCooldownAt(1) > 0;
    g.persist();
    g.paused = true;
    return { hiddenSafe, reveal, damage, noReset, sameCD, bowIds };
  });
  expect(r.hiddenSafe).toBe(true);
  expect(r.reveal).toBe(0);
  expect(r.damage).toBeGreaterThan(20);
  expect(r.noReset).toBe(false);
  expect(r.sameCD).toBe(true);
  // One class bar: switching weapons keeps the same abilities in place.
  expect(r.bowIds[1]).toBe("vanish");
  await page.reload();
  await page.locator("[data-action=continue]").click();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.hotbars.main[1]),
  ).toBe("vanish");
});

test("fishing has timed bites, misses, bait, weather catches, cooking and regrowing berries", async ({
  page,
}) => {
  await begin(page);
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      o = g.world.objects.find((o) => o.id === "riverFishing");
    g.enemies = [];
    g.save.inventory.rod = 1;
    g.save.inventory.bait = 2;
    g.save.x = o.x;
    g.save.y = o.y + 15;
    g.save.playtime = 180;
    window.__ELDERIA__.action("interact");
  });
  await expect(page.getByRole("dialog")).toContainText("Рыбалка");
  expect(await page.evaluate(() => window.__ELDERIA__.game.paused)).toBe(false);
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.fishing.phase = "bite";
    g.fishing.age = 0;
    g.fishing.cursor = g.fishing.target;
    g.fishingTap();
  });
  await expect(page.locator("#fish-phase")).toHaveText("Поймано!");
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.inventory.rawFish),
  ).toBe(2);
  await page.locator("[data-action=fishAgain]").click();
  const failed = await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.fishing.phase = "bite";
    g.fishing.cursor = 1;
    const wrong = g.fishingTap(),
      phase = g.fishing.phase,
      counts = g.save.activities.catches;
    return { wrong, phase, counts };
  });
  expect(failed).toEqual({ wrong: false, phase: "miss", counts: 1 });
  await page.keyboard.press("Escape");
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save;
    const bush = g.world.objects.find((o) => o.type === "berryBush");
    const first = g.harvestBerry(bush),
      second = g.harvestBerry(bush);
    s.playtime += 121;
    const regrown = g.harvestBerry(bush);
    s.inventory.wood = 2;
    const noCamp = g.craftSmall("fish");
    const camp = g.world.objects.find((o) => o.id === "camp1");
    s.x = camp.x;
    s.y = camp.y + 20;
    const cook = g.craftSmall("fish");
    s.hp = 10;
    const eat = g.eatFood("cookedFish");
    g.persist();
    return {
      first,
      second,
      regrown,
      noCamp,
      cook,
      eat,
      berry: s.inventory.berry,
      cooked: s.inventory.cookedFish,
      hp: s.hp,
      fishing: g.fishing,
    };
  });
  expect(r).toMatchObject({
    first: true,
    second: false,
    regrown: true,
    noCamp: false,
    cook: true,
    eat: true,
    berry: 4,
    cooked: 1,
    hp: 50,
    fishing: null,
  });
  await page.reload();
  await page.locator("[data-action=continue]").click();
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.activities.catches),
  ).toBe(1);
});

test("real weapon schools produce different attacks, elements, statuses and effects", async ({
  page,
}) => {
  await begin(page);
  const results = await page.evaluate(async () => {
    const { newSave } = await import("/src/storage.js"),
      { weapons } = await import("/src/equipment.js"),
      { skillsFor } = await import("/src/abilities.js");
    const g = window.__ELDERIA__.game,
      out = [];
    for (const [id, w] of Object.entries(weapons)) {
      g.load(newSave("Test", w.class, {}, id));
      g.save.level = 20;
      g.equipWeapon(id);
      g.save.mana = 500;
      g.save.abilityRanks[skillsFor(g.save)[0].id] = 1;
      g.paused = false;
      const e = {
        ...g.enemies.find((e) => e.type === "slime"),
        x: g.save.x + 40,
        y: g.save.y,
        hp: 2000,
        maxHp: 2000,
        speed: 0,
        cooldown: 999,
      };
      g.enemies = [e];
      const cast = g.useSkill(0);
      // A shapeshifter's first ability is a transformation: attack in the new form.
      if (g.form) {
        g.attackCooldown = 0;
        g.attack();
      }
      for (let i = 0; i < 15; i++) g.update(0.03);
      out.push({
        id,
        cast,
        hp: e.hp,
        effects: g.effects.length + g.sparks.length,
        slow: e.slow,
        burn: e.burn,
        poison: e.poison,
      });
    }
    g.paused = true;
    return out;
  });
  expect(results).toHaveLength(126);
  for (const r of results) {
    expect(r.cast, r.id).toBe(true);
    expect(r.hp, r.id).toBeLessThan(2000);
  }
  expect(results.find((r) => r.id === "daggers").poison).toBeGreaterThan(0);
  expect(results.find((r) => r.id === "emberstaff").burn).toBeGreaterThan(0);
  expect(results.find((r) => r.id === "frostStaff").slow).toBeGreaterThan(0);
});

test("enemy level refresh preserves damaged health and skips nearby fights", async ({
  page,
}) => {
  await begin(page);
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      e = g.enemies.find((e) => e.type === "slime");
    g.save.x = e.x;
    g.save.y = e.y + 20;
    const old = e.level;
    e.hp = e.maxHp / 2;
    g.save.level = 20;
    g.syncEnemyLevels();
    const near = e.level;
    g.save.x = e.x + 500;
    g.syncEnemyLevels();
    return { old, near, newLevel: e.level, fraction: e.hp / e.maxHp };
  });
  expect(r.near).toBe(r.old);
  expect(r.newLevel).toBeGreaterThanOrEqual(19);
  expect(r.fraction).toBeCloseTo(0.5, 2);
});

test("all five slots and inventory remain usable on portrait and landscape phones", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await begin(page);
    await expect(page.locator(".action-slot")).toHaveCount(9);
    for (const el of await page.locator(".action-slot").all()) {
      const b = await el.boundingBox();
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(viewport.width);
      expect(b.y + b.height).toBeLessThanOrEqual(viewport.height);
    }
    await page.locator("[data-action=inventory]").first().click();
    await expect(page.locator("#paperdoll")).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.querySelector(".modal").scrollWidth <=
          document.querySelector(".modal").clientWidth + 1,
      ),
    ).toBe(true);
    // The starting sword is already in hand: take it off, then equip it from the bag.
    await page.locator("[data-gear-slot=mainhand]").click();
    await page.locator('[data-bag-key="w:sword"]').click();
    await page.locator('.bag-description [data-action="equip-sword"]').click();
    expect(
      await page.evaluate(() => window.__ELDERIA__.game.save.equippedWeapon),
    ).toBe("sword");
    await page.keyboard.press("Escape");
    await page.evaluate(() => {
      window.__ELDERIA__.game.save = null;
      localStorage.clear();
    });
  }
});

test("fishing waits for a bite, stops on focus loss, and expires without a hook", async ({
  page,
}) => {
  await begin(page);
  const r = await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      o = g.world.objects.find((o) => o.id === "lakeFishing");
    g.enemies = [];
    g.save.x = o.x;
    g.save.y = o.y;
    g.save.inventory.rod = 1;
    window.__ELDERIA__.action("interact");
    g.fishing.wait = 0.2;
    g.update(0.1);
    const waiting = g.fishing.phase;
    window.dispatchEvent(new Event("blur"));
    const age = g.fishing.age,
      play = g.save.playtime;
    g.update(1);
    const stopped =
      g.paused && age === g.fishing.age && play === g.save.playtime;
    window.dispatchEvent(new Event("focus"));
    g.update(0.15);
    const bite = g.fishing.phase;
    for (let i = 0; i < 65; i++) g.update(0.1);
    return {
      waiting,
      stopped,
      bite,
      end: g.fishing.phase,
      catches: g.save.activities.catches,
    };
  });
  expect(r).toEqual({
    waiting: "waiting",
    stopped: true,
    bite: "bite",
    end: "miss",
    catches: 0,
  });
});

test("boss summons match the hero and chain lightning jumps between nearby targets", async ({
  page,
}) => {
  await begin(page);
  const r = await page.evaluate(async () => {
    const { makeEnemy, updateBoss } = await import("/src/battle.js"),
      { newSave } = await import("/src/storage.js");
    const g = window.__ELDERIA__.game,
      s = g.save;
    s.level = 16;
    s.flags.bossAwake = true;
    const boss = makeEnemy(
      { id: "summon-boss", type: "guardian", x: s.x, y: s.y - 55 },
      undefined,
      s.level,
    );
    g.enemies = [boss];
    boss.hp = boss.maxHp * 0.6;
    g.paused = false;
    updateBoss(g, boss, 0.04);
    const levels = g.enemies
      .filter((e) => e.owner === boss.id)
      .map((e) => e.level);
    g.load(newSave("Mage", "mage", {}, "staff"));
    g.save.level = 16;
    g.save.ownedWeapons.push("thunderwand");
    g.equipWeapon("thunderwand");
    g.save.abilityRanks.chainlightning = 1;
    g.save.mana = 200;
    g.paused = false;
    // Place all three targets in an open test arena; walls must block real jumps.
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -1; dx <= 10; dx++)
        g.world.blocked[
          (Math.floor(g.save.y / 24) + dy) * g.world.width +
            Math.floor(g.save.x / 24) +
            dx
        ] = 0;
    const base = makeEnemy(
      { id: "chain1", type: "slime", x: g.save.x + 40, y: g.save.y },
      undefined,
      16,
    );
    g.enemies = [
      base,
      { ...base, id: "chain2", x: base.x + 80 },
      { ...base, id: "chain3", x: base.x + 160 },
    ];
    g.enemies.forEach((e) => {
      e.hp = e.maxHp = 1000;
    });
    const cast = g.useSkill(0),
      damage = g.enemies.map((e) => 1000 - e.hp),
      chain = g.effects.find((e) => e.type === "chain");
    g.paused = true;
    return { levels, cast, damage, segments: chain.points.length };
  });
  expect(r.levels.length).toBeGreaterThan(0);
  expect(r.levels.every((level) => level >= 15)).toBe(true);
  expect(r.cast).toBe(true);
  expect(r.damage.every((n) => n > 0)).toBe(true);
  expect(r.damage[1]).toBeLessThan(r.damage[0]);
  expect(r.segments).toBe(4);
});

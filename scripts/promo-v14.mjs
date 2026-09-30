import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const out = "artifacts/promo";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch(),
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const capture = async (name) => {
  await page.evaluate(() =>
    document.querySelector("#toast").classList.remove("visible"),
  );
  await page.screenshot({ path: `${out}/${name}.png`, animations: "disabled" });
};
try {
  await page.goto("http://localhost:5173");
  await page.locator("[data-action=create]").click();
  await page.locator("[data-class=ranger]").click();
  await page.locator("[data-start-weapon=daggers]").click();
  await page.locator("[data-action=start]").click();
  await page.keyboard.press("KeyI");
  await capture("bare-inventory");
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      s = g.save;
    s.level = 8;
    s.skillPoints = 3;
    s.gold = 180;
    g.equipWeapon("daggers");
    s.ownedWeapons.push("bow", "crossbow", "longbow");
    s.ownedArmors.push("leather");
    g.equipArmor("leather");
    s.ownedWearables = [
      "leatherHood",
      "leatherPants",
      "leatherBoots",
      "quiver",
      "linenCap",
      "sandals",
    ];
    g.equipWearable("leatherHood");
    g.equipWearable("leatherPants");
    g.equipWearable("leatherBoots");
    g.equipWearable("quiver");
    s.abilityRanks = {
      volley: 1,
      shadowcut: 2,
      vanish: 1,
      shadowstep: 1,
      fieldcare: 1,
      trailwind: 1,
    };
    s.skillRanks = [2, 1, 1];
    s.abilityUses = { shadowcut: 9, vanish: 3 };
    s.weaponPractice.blades = 22;
    s.flags.herbQuestDone = true;
    Object.assign(s.inventory, {
      wood: 8,
      fiber: 12,
      leather: 6,
      ore: 7,
      herb: 5,
      crystal: 4,
      essence: 2,
      rod: 1,
      bait: 5,
      rawFish: 3,
      rangerScroll: 1,
    });
    g.onChange();
    window.__ELDERIA__.action("inventory");
  });
  await capture("equipment-inventory");
  await page.locator("[data-action=recipe-rod]").click();
  await capture("crafting-grid");
  await page.keyboard.press("Escape");
  await page.keyboard.press("KeyK");
  await capture("weapon-skills");
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.save.mana = 100;
    g.paused = false;
    g.useSkill(1);
    g.setPaused(true);
    g.onChange();
  });
  await capture("ranger-invisibility");
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game,
      o = g.world.objects.find((o) => o.id === "riverFishing");
    g.buffs = {};
    g.enemies = [];
    g.save.x = o.x;
    g.save.y = o.y + 15;
    g.currentRegion = "village";
    g.camera = { x: g.save.x, y: g.save.y };
    g.paused = false;
    g.onInteract(o);
    g.fishing.phase = "bite";
    g.fishing.cursor = g.fishing.target;
    g.fishing.age = 1;
    g.setPaused(true);
    g.onChange();
  });
  await capture("fishing");
  await page.keyboard.press("Escape");
  for (const id of ["crypt", "mine", "abyss", "citadel"]) {
    await page.evaluate(async (id) => {
      const { dungeons } = await import("/src/content.js"),
        { newSave } = await import("/src/storage.js");
      const g = window.__ELDERIA__.game,
        s = newSave("Элиан", "ranger", {}, "daggers");
      s.level = 16;
      s.ownedArmors = ["none", "leather"];
      s.equippedArmor = "leather";
      s.equippedWeapon = "daggers";
      s.abilityRanks.vanish = 1;
      s.activeDungeon = {
        id,
        floor: dungeons[id].floors,
        runId: 1,
        tier: 0,
        returnPoint: { x: 600, y: 1500 },
        enemyHp: {},
      };
      g.load(s);
      g.enemies.filter((e) => !e.boss).forEach((e) => g.damageEnemy(e, 1e6));
      const b = g.enemies.find((e) => e.boss);
      s.x = b.x + 30;
      s.y = b.y + 60;
      s.hp = g.stats.maxHp;
      s.mana = g.stats.maxMana;
      g.camera = { x: s.x, y: s.y };
      g.paused = false;
      g.update(0.04);
      g.setPaused(true);
      g.onChange();
      window.__ELDERIA__.action("sound");
      document.querySelector("#movement-tip").hidden = true;
    }, id);
    await capture(`${id}-design`);
  }
  await page.evaluate(async () => {
    const {newSave}=await import('/src/storage.js'); const g=window.__ELDERIA__.game;
    const s=newSave('Элиан','mage',{},'staff');s.level=9;s.gold=725;s.skillPoints=4;
    s.abilityRanks.starwave=2;s.ownedWeapons.push('wand','frostStaff','stormRod','obsidianStaff');
    Object.assign(s.inventory,{wood:8,fiber:12,leather:6,ore:7,herb:5,crystal:4,essence:2});
    g.load(s);g.equipWeapon('staff');window.__ELDERIA__.action('sound');g.onInteract(g.world.objects.find(o=>o.id==='smith'));
  });
  await capture('shop-readability');
  await page.keyboard.press('Escape');await page.keyboard.press('KeyK');await capture('mage-skill-progression');
  await page.keyboard.press('Escape');await page.keyboard.press('KeyI');await page.locator('#recipe-picker').selectOption('cap');await capture('portable-clothing');
  await page.setViewportSize({width:390,height:844});await capture('mobile-inventory');
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("v1.4 screenshots generated without browser errors");
} finally {
  await browser.close();
}

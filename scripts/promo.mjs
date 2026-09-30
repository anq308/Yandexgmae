import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const out = "artifacts/promo";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
try {
  await page.goto(process.env.ELDERIA_PREVIEW_URL || "http://127.0.0.1:5173");
  await page.locator('[data-action="create"]').click();
  await page.locator("#hero-name").fill("Элиан");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/character-creation.png` });
  await page.locator('[data-action="start"]').click();
  await page.waitForTimeout(500);
  await page.evaluate(() =>
    document.querySelector("#toast").classList.remove("visible"),
  );
  await page.screenshot({ path: `${out}/village.png` });
  for (const scene of [
    { file: "forest", x: 41, y: 43, quest: 1 },
    { file: "mountains", x: 86, y: 19, quest: 3 },
    { file: "ruins", x: 91, y: 68, quest: 5, boss: true },
    { file: "amberwood", x: 139, y: 36, quest: 7, region: "amberwood" },
    { file: "riverport", x: 138, y: 82, quest: 7, region: "harbor" },
    { file: "coast", x: 47, y: 113, quest: 7, region: "coast" },
    {
      file: "tundra-snow",
      x: 207,
      y: 20,
      quest: 7,
      region: "tundra",
      time: 180,
    },
    { file: "frontier", x: 190, y: 148, quest: 7, region: "frontier" },
    { file: "island", x: 59, y: 173, quest: 7, region: "island" },
    {
      file: "night-rain",
      x: 42,
      y: 42,
      quest: 7,
      region: "forest",
      time: 1640,
    },
  ]) {
    await page.evaluate((scene) => {
      const g = window.__ELDERIA__.game;
      g.save.x = scene.x * 24 + 12;
      g.save.y = scene.y * 24 + 12;
      g.save.quest = scene.quest;
      g.save.playtime = scene.time || 5;
      g.save.restTime = 0;
      g.save.flags.bossAwake = !!scene.boss;
      g.save.hp = g.stats.maxHp;
      g.camera = { x: g.save.x, y: g.save.y };
      g.setPaused(true);
      g.currentRegion =
        scene.region ||
        (scene.file === "forest"
          ? "forest"
          : scene.file === "mountains"
            ? "mountain"
            : "ruins");
      g.onChange();
    }, scene);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}/${scene.file}.png` });
  }
  await page.evaluate(() => window.__ELDERIA__.action("map"));
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${out}/expanded-map.png` });
  await page.evaluate(() => window.__ELDERIA__.action("close"));
  for (const [id, armor, weapon] of [
    ["crypt", "chain", "scimitar"],
    ["mine", "grave", "hammer"],
    ["abyss", "frost", "frostSpear"],
    ["citadel", "ember", "flameblade"],
  ]) {
    await page.evaluate(
      async ({ id, armor, weapon }) => {
        const { dungeons } = await import("/src/content.js"),
          g = window.__ELDERIA__.game;
        g.setPaused(true);
        g.save.level = 16;
        g.save.skillRanks = [3, 3, 3];
        g.save.gold = 820;
        g.save.inventory.potion = 6;
        g.save.equippedArmor = armor;
        g.save.equippedWeapon = weapon;
        g.save.activeDungeon = {
          id,
          floor: dungeons[id].floors,
          runId: 1,
          tier: 0,
          returnPoint: { x: 600, y: 1500 },
          enemyHp: {},
        };
        g.loadZone();
        g.enemies.filter((e) => !e.boss).forEach((e) => g.damageEnemy(e, 1e6));
        const boss = g.enemies.find((e) => e.boss);
        Object.assign(g.save, { x: boss.x + 45, y: boss.y + 68 });
        g.save.hp = g.stats.maxHp;
        g.save.mana = g.stats.maxMana;
        g.paused = false;
        g.update(0.04);
        g.update(0.04);
        g.damageEnemy(boss, boss.maxHp * 0.39);
        g.update(0.04);
        g.useSkill(0);
        g.update(0.15);
        g.setPaused(true);
        g.particles = [];
        g.camera = { x: g.save.x, y: g.save.y };
        g.onChange();
        document.querySelector("#toast").classList.remove("visible");
        document.querySelector("#movement-tip").hidden = true;
      },
      { id, armor, weapon },
    );
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${id}-boss.png` });
    await page.evaluate(() => window.__ELDERIA__.game.leaveDungeon(true));
  }
  await page.evaluate(() => {
    const g = window.__ELDERIA__.game;
    g.save.playtime = 5;
    g.save.restTime = 0;
    g.save.x = 24 * 24 + 12;
    g.save.y = 63 * 24 + 12;
    g.currentRegion = "village";
    g.camera = { x: g.save.x, y: g.save.y };
    g.setPaused(true);
    g.onChange();
  });
  const images = await page.evaluate(async () => {
    const { drawHero, drawTree, drawObject } = await import("/src/art.js");
    const icon = document.createElement("canvas");
    icon.width = 512;
    icon.height = 512;
    let c = icon.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#1f3b2c";
    c.fillRect(0, 0, 512, 512);
    c.save();
    c.scale(4, 4);
    drawTree(c, 9, 119, "pine");
    drawTree(c, 119, 121, "pine");
    drawTree(c, 26, 91, "oak");
    drawTree(c, 110, 67, "pine");
    c.restore();
    const glow = c.createRadialGradient(256, 260, 30, 256, 260, 240);
    glow.addColorStop(0, "#bbbd7960");
    glow.addColorStop(1, "#1f3b2c00");
    c.fillStyle = glow;
    c.fillRect(0, 0, 512, 512);
    c.strokeStyle = "#d3c08b45";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(256, 250, 188, 0, Math.PI * 2);
    c.stroke();
    drawHero(c, 249, 373, "warrior", {
      scale: 9,
      skin: "#e9b88a",
      hair: "#654333",
    });
    for (const [x, y] of [
      [109, 108],
      [382, 111],
      [145, 229],
      [389, 305],
    ]) {
      c.fillStyle = "#edd7a1";
      c.fillRect(x - 3, y - 13, 6, 26);
      c.fillRect(x - 13, y - 3, 26, 6);
      c.fillRect(x - 6, y - 6, 12, 12);
    }
    const cover = document.createElement("canvas");
    cover.width = 800;
    cover.height = 470;
    c = cover.getContext("2d");
    c.imageSmoothingEnabled = false;
    const g = window.__ELDERIA__.game;
    g.terrain.draw(c, 18 * 24, 56 * 24, 12 * 24, 8 * 24, 0, 0, 800, 470);
    c.save();
    c.scale(2.8, 2.8);
    for (const o of g.world.objects
      .filter(
        (o) => o.x > 18 * 24 && o.x < 30 * 24 && o.y > 56 * 24 && o.y < 66 * 24,
      )
      .sort((a, b) => a.y - b.y))
      drawObject(c, { ...o, x: o.x - 18 * 24, y: o.y - 56 * 24 }, 0);
    c.restore();
    const grad = c.createLinearGradient(0, 0, 800, 0);
    grad.addColorStop(0, "#142d22f5");
    grad.addColorStop(0.58, "#142d22c0");
    grad.addColorStop(1, "#142d2210");
    c.fillStyle = grad;
    c.fillRect(0, 0, 800, 470);
    c.fillStyle = "#d9c38a";
    c.font = "14px Arial";
    c.fillText("ХРОНИКИ ЗАБЫТОЙ ДОЛИНЫ", 52, 128);
    c.fillStyle = "#f3e8c9";
    c.font = "bold 64px Georgia";
    c.fillText("Эльдерия", 47, 209);
    c.fillStyle = "#c3d0ac";
    c.font = "17px Arial";
    c.fillText("Маленький герой. Большое приключение.", 52, 253);
    c.fillStyle = "#d6c28f";
    c.fillRect(52, 283, 44, 2);
    drawHero(c, 597, 361, "warrior", { scale: 5 });
    drawHero(c, 712, 371, "mage", { scale: 4 });
    drawHero(c, 482, 380, "ranger", { scale: 4 });
    c.fillStyle = "#bed0ab";
    c.font = "12px Arial";
    c.fillText("ОТКРЫТЫЙ МИР    ·    3 КЛАССА    ·    ВАША ИСТОРИЯ", 52, 407);
    return {
      icon: icon.toDataURL("image/png"),
      cover: cover.toDataURL("image/png"),
    };
  });
  for (const [key, data] of Object.entries(images))
    writeFileSync(
      `${out}/${key === "icon" ? "icon-512" : "cover-800x470"}.png`,
      Buffer.from(data.split(",")[1], "base64"),
    );
  console.log(`Promotional art and real gameplay screenshots: ${out}`);
} finally {
  await browser.close();
}

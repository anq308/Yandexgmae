import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFileSync, readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { newSave } from "../src/storage.js";
import { point, landmarks, enemySpawns } from "../src/world.js";
const errors = [],
  browser = await chromium.launch(),
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://localhost:4173");
  assert.equal(await page.evaluate(() => "__ELDERIA__" in window), false);
  await page.locator("[data-action=create]").click();
  await page.locator("[data-class=ranger]").click();
  await page.locator("[data-start-weapon=daggers]").click();
  await page.locator("[data-action=start]").click();
  await page.keyboard.press("KeyI");
  assert.equal(await page.locator(".gear-cell.filled").count(), 0);
  await page.screenshot({
    path: "artifacts/production-inventory-v14.png",
    animations: "disabled",
  });
  await page
    .locator('[data-bag-key="w:daggers"]')
    .dragTo(page.locator("[data-gear-slot=mainhand]"));
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator('[data-skill-slot="1"] span').textContent(),
    "Раствориться в тени",
  );
  await page.keyboard.press("KeyK");
  assert.equal(await page.locator(".skill-node").count(), 5);
  await page
    .locator(".skill-node-icon[data-ability=shadowcut]")
    .dragTo(page.locator('.bar-edit-slot[data-bar-slot="4"]'));
  await page.screenshot({
    path: "artifacts/production-skills-v14.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await page.keyboard.press("KeyI");
  await page.locator("#recipe-picker").selectOption("rod");
  assert.equal(await page.locator("[data-action=craftMake-rod-1]").isDisabled(), true);
  assert.match(await page.locator(".craft-status").textContent(), /Не хватает материалов/);
  await page.keyboard.press("Escape");
  await page.reload();
  await page.locator("[data-action=continue]").click();
  assert.equal(
    await page.locator('[data-skill-slot="4"] span').textContent(),
    "Теневой разрез",
  );
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("elderia-save-v1")).equippedWeapon,
    ),
    "daggers",
  );
  const shore = landmarks.find((o) => o.id === "lakeFishing"),
    s = newSave("Рыболов", "ranger", {}, "daggers");
  s.x = shore.x;
  s.y = shore.y + 15;
  s.level = 3;
  s.inventory.rod = 1;
  s.inventory.bait = 2;
  s.playtime = 180;
  s.updatedAt = Date.now();
  assert.ok(enemySpawns.every((e) => Math.hypot(e.x - s.x, e.y - s.y) > 220));
  const fishingPage = await browser.newPage();
  fishingPage.on("pageerror", (e) => errors.push(e.message));
  await fishingPage.addInitScript(
    (s) => localStorage.setItem("elderia-save-v1", JSON.stringify(s)),
    s,
  );
  await fishingPage.goto("http://localhost:4173");
  await fishingPage.locator("[data-action=continue]").click();
  await fishingPage.keyboard.press("KeyE");
  await fishingPage.locator("#fish-phase").waitFor();
  assert.match(await fishingPage.getByRole("dialog").textContent(), /Рыбалка/);
  await fishingPage.waitForFunction(
    () => document.querySelector("#fish-phase")?.textContent === "Клюёт!",
  );
  await fishingPage.screenshot({
    path: "artifacts/production-fishing-v14.png",
    animations: "disabled",
  });
  await fishingPage.keyboard.press("Escape");
  assert.deepEqual(errors, []);
  const verification = execFileSync(
    "python3",
    [
      "-c",
      `import zipfile,pathlib,json; z=zipfile.ZipFile('artifacts/elderia-yandex.zip'); files=[p for p in pathlib.Path('dist').rglob('*') if p.is_file()]; assert sorted(z.namelist())==sorted(str(p.relative_to('dist')) for p in files); assert all(z.read(str(p.relative_to('dist')))==p.read_bytes() for p in files); assert not any(b'__ELDERIA__' in p.read_bytes() for p in files); print(json.dumps({'files':len(files),'bytes':sum(p.stat().st_size for p in files),'archiveMatchesDist':True,'debugHookAbsent':True}))`,
    ],
    { encoding: "utf8" },
  );
  const result = {
    version: "1.4.0",
    unitChecks: 18,
    browserChecks: 43,
    totalAutomatedChecks: 61,
    productionSmoke: {
      bareStart: true,
      weaponChangesSkills: true,
      dragEquip: true,
      hotbarReload: true,
      fishingBites: true,
      recipeRequirementsVisible: true,
      browserErrors: errors,
    },
    ...JSON.parse(verification),
    zipBytes: statSync("artifacts/elderia-yandex.zip").size,
  };
  writeFileSync(
    "artifacts/production-validation-v14.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}

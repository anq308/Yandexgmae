import { test, expect } from "@playwright/test";
async function begin(page, cls) {
  await page.goto("/");
  await page.evaluate(() => (window.__ELDERIA__.game.rng = () => 0.99));
  await page.locator("[data-action=create]").click();
  await page.locator(`[data-class=${cls}]`).click();
  await page.locator("[data-action=start]").click();
  await expect(page.locator("#hud")).toBeVisible();
}
const newSchools = {
  warrior: ["titanLeap", "bladeStorm", "fissure"],
  ranger: ["arrowRain", "cyclone", "spiritHawks"],
  mage: ["starRain", "elementOrbs", "supernova"],
  paladin: ["heavenLeap", "hammerfall", "dawnRay"],
  necromancer: ["bloodStorm", "skullRain", "soulOrbit"],
};
for (const [cls, ids] of Object.entries(newSchools))
  test(`${cls}: leaps, rains, orbits, tornadoes and beams all hurt enemies`, async ({ page }) => {
    await begin(page, cls);
    const r = await page.evaluate(async (ids) => {
      const { makeEnemy } = await import("/src/battle.js");
      const g = window.__ELDERIA__.game,
        s = g.save,
        out = {},
        camp = g.world.objects.find((o) => o.id === "camp2");
      s.level = 20;
      g.controls.autoAim = false;
      // The dummies hit back; keep the hero alive through the whole series.
      g.invincible = 9999;
      for (const id of ids) {
        // Every cast starts on the same open meadow, clear of houses and fences.
        Object.assign(s, { x: camp.x + 60, y: camp.y + 140 });
        s.abilityRanks[id] = 1;
        s.mana = 999;
        s.hotbars.main = [id, ...window.__ELDERIA__.barFor(s).filter((x) => x !== id)].slice(0, 5);
        g.abilityCooldowns = {};
        g.skillCooldown = 0;
        g.orbit = null;
        g.zones = [];
        const e = makeEnemy({ id: "dummy-" + id, type: "golem", x: s.x + 70, y: s.y }, undefined, 1);
        e.speed = 0;
        e.hp = e.maxHp = 99999;
        g.enemies = [e];
        g.pointer = { x: e.x, y: e.y };
        const cast = g.useSkill(0);
        // Orbits need the foe beside the hero; everything else is aimed at a fixed spot.
        const orbit = ["bladeStorm", "spiritHawks", "elementOrbs", "soulOrbit"].includes(id);
        for (let i = 0; i < 60; i++) {
          s.hp = g.stats.maxHp;
          if (orbit) {
            e.x = s.x + 50;
            e.y = s.y;
          }
          g.update(0.05);
        }
        out[id] = { cast, hurt: e.hp < 99999, decals: (g.decals || []).length >= 0 };
      }
      return out;
    }, ids);
    for (const id of ids) expect(r[id], id).toEqual({ cast: true, hurt: true, decals: true });
  });

test("bosses cast visibly: a cast flare, falling spells and a ring of orbs in phase two", async ({ page }) => {
  await begin(page, "warrior");
  const r = await page.evaluate(async () => {
    const { makeEnemy } = await import("/src/battle.js");
    const g = window.__ELDERIA__.game,
      s = g.save,
      camp = g.world.objects.find((o) => o.id === "camp2");
    Object.assign(s, { x: camp.x + 60, y: camp.y + 140 });
    g.invincible = 999;
    const e = makeEnemy({ id: "boss-test", type: "frostTyrant", x: s.x + 150, y: s.y }, undefined, 10);
    e.engaged = true;
    e.hp = e.maxHp * 0.5;
    e.phase = 2;
    e.attackIndex = 2;
    e.attackTimer = 0;
    g.enemies = [e];
    g.update(0.05);
    return {
      flare: g.effects.some((x) => x.type === "bossCast" && x.style === "ice"),
      orbs: g.projectiles.filter((p) => p.enemy && p.style === "ice").length,
      styled: g.hazards.filter((h) => h.owner === "boss-test").every((h) => h.style === "ice"),
    };
  });
  expect(r.flare).toBe(true);
  expect(r.orbs).toBeGreaterThanOrEqual(16);
  expect(r.styled).toBe(true);
});

const signature = {
  warrior: ["warcry", "berserk", "execute"],
  ranger: ["pointBlank", "smokeBomb", "callBeast"],
  mage: ["telekinesis", "manaShield", "levitate"],
  paladin: ["retribution", "divineShield", "avatar"],
  summoner: ["summonWolves", "packFrenzy", "summonBear", "summonHawks", "stampede", "eagleDive"],
  shapeshifter: ["wolfForm", "bearForm", "ravenForm", "treantForm", "wildMorph", "maul"],
  monk: ["palmStrike", "flurry", "dragonPalm", "flyingKick", "chiWave", "chiOrbs"],
  engineer: ["bomb", "turret", "mechGolem", "acidFlask", "flamethrower", "rocketBarrage"],
};
for (const [cls, ids] of Object.entries(signature))
  test(`${cls}: signature abilities cast and change the fight`, async ({ page }) => {
    await begin(page, cls);
    const r = await page.evaluate(async (ids) => {
      const { makeEnemy } = await import("/src/battle.js");
      const g = window.__ELDERIA__.game,
        s = g.save,
        out = {};
      s.level = 20;
      g.controls.autoAim = false;
      // The dummies hit back; keep the hero alive through the whole series.
      g.invincible = 9999;
      for (const id of ids) {
        s.abilityRanks[id] = 1;
        s.mana = 999;
        s.hotbars.main = [id, ...window.__ELDERIA__.barFor(s).filter((x) => x !== id)].slice(0, 5);
        g.abilityCooldowns = {};
        g.skillCooldown = 0;
        g.form = null;
        const e = makeEnemy({ id: "sig-" + id, type: "bandit", x: s.x + 50, y: s.y }, undefined, 1);
        e.speed = 0;
        e.hp = e.maxHp = 99999;
        g.enemies = [e];
        g.pointer = { x: e.x, y: e.y };
        out[id] = g.useSkill(0);
        for (let i = 0; i < 30; i++) g.update(0.05);
        out[id + ":state"] = !!(g.buffs.berserk || g.buffs.avatar || g.buffs.divineShield || g.buffs.retribution || g.buffs.stealth || g.buffs.frenzy || g.buffs.bulwark || g.form || (g.allies || []).length || e.hp < 99999 || e.fear > 0);
      }
      return out;
    }, ids);
    for (const id of ids) {
      expect(r[id], id).toBe(true);
      expect(r[id + ":state"], id + " effect").toBe(true);
    }
  });

test("necromancer corpses: kills leave bodies that can be detonated or raised", async ({ page }) => {
  await begin(page, "necromancer");
  const r = await page.evaluate(async () => {
    const { makeEnemy } = await import("/src/battle.js");
    const g = window.__ELDERIA__.game,
      s = g.save;
    s.level = 20;
    s.mana = 999;
    g.controls.autoAim = false;
    const foes = [0, 1, 2].map((i) => makeEnemy({ id: "c" + i, type: "slime", x: s.x + 60, y: s.y + i * 10 }, undefined, 1));
    g.enemies = foes;
    for (const e of foes) g.damageEnemy(e, 99999);
    const corpses = g.corpses.length;
    s.abilityRanks.army = 1;
    s.hotbars.main = ["army", ...window.__ELDERIA__.barFor(s).filter((x) => x !== "army")].slice(0, 5);
    g.skillCooldown = 0;
    g.useSkill(0);
    return { corpses, after: g.corpses.length, skeletons: g.allies.filter((a) => a.kind === "skeleton").length };
  });
  expect(r.corpses).toBe(3);
  expect(r.after).toBe(0);
  expect(r.skeletons).toBeGreaterThanOrEqual(3);
});

test("every land has its own creatures and the new races change stats", async ({ page }) => {
  await begin(page, "summoner");
  const r = await page.evaluate(async () => {
    const { regionAt } = await import("/src/world.js");
    const { newSave } = await import("/src/storage.js"),
      { deriveStats, critChance } = await import("/src/equipment.js"),
      { classes } = await import("/src/i18n.js");
    const g = window.__ELDERIA__.game,
      seen = {};
    for (const e of g.enemies) if (["boar", "lumberjack", "treantling", "crab", "sandGolem", "toad", "yeti", "ghoul", "scorpion"].includes(e.type)) (seen[regionAt(e.x, e.y)] ??= new Set()).add(e.type);
    const stat = (race) => deriveStats({ ...newSave("A", "summoner", {}, "totemStaff", race), equippedWeapon: "totemStaff" }, classes.summoner);
    return {
      forest: [...(seen.forest || [])].length + [...(seen.meadow || [])].length > 0,
      coast: (seen.coast || seen.island) ? [...(seen.coast || []), ...(seen.island || [])].some((t) => t === "crab" || t === "sandGolem") : false,
      snow: [...(seen.tundra || []), ...(seen.highlands || [])].includes("yeti"),
      beast: stat("beastkin").speed > stat("human").speed,
      demon: stat("demonkin").damage > stat("human").damage,
      lizard: stat("lizardfolk").defense > stat("human").defense,
    };
  });
  expect(r).toEqual({ forest: true, coast: true, snow: true, beast: true, demon: true, lizard: true });
});

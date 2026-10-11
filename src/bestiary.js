import { TILE, WIDTH, HEIGHT, point, canWalk, regionAt, enemySpawns, landmarks } from "./world.js";
import { drawSprite } from "./sprites.js";
import { SPRITES } from "./spritedata.js";
// Biome creatures: each land gets its own wildlife and outlaws, with their own tricks.
export const biomeEnemyStats = {
  boar: { hp: 200, damage: 26, speed: 70, xp: 36, gold: 10, baseLevel: 3, charger: true },
  lumberjack: { hp: 210, damage: 30, speed: 66, xp: 40, gold: 26, baseLevel: 4, rangedAttack: true, shotStyle: "axe" },
  treantling: { hp: 380, damage: 32, speed: 34, xp: 55, gold: 18, baseLevel: 6, rootOnHit: true },
  crab: { hp: 260, damage: 28, speed: 60, xp: 42, gold: 20, baseLevel: 4, armor: 0.35 },
  sandGolem: { hp: 320, damage: 34, speed: 40, xp: 50, gold: 22, baseLevel: 6, ambush: true },
  toad: { hp: 190, damage: 24, speed: 50, xp: 38, gold: 14, baseLevel: 5, rangedAttack: true, shotStyle: "poison", element: "poison" },
  yeti: { hp: 420, damage: 40, speed: 52, xp: 70, gold: 30, baseLevel: 9, large: true, element: "ice" },
  ghoul: { hp: 230, damage: 32, speed: 92, xp: 46, gold: 18, baseLevel: 7, undead: true },
  scorpion: { hp: 260, damage: 34, speed: 74, xp: 52, gold: 22, baseLevel: 9, element: "poison" },
};
export const biomeEnemyNames = {
  boar: ["Дикий кабан", "Wild boar"],
  lumberjack: ["Дровосек-разбойник", "Outlaw woodcutter"],
  treantling: ["Молодой энт", "Treantling"],
  crab: ["Гигантский краб", "Giant crab"],
  sandGolem: ["Песчаный голем", "Sand golem"],
  toad: ["Болотная жаба", "Bog toad"],
  yeti: ["Йети", "Yeti"],
  ghoul: ["Гуль", "Ghoul"],
  scorpion: ["Пустынный скорпион", "Desert scorpion"],
};
export const biomeMaterials = {
  boar: { leather: 2 },
  lumberjack: { wood: 2, leather: 1 },
  treantling: { wood: 3 },
  crab: { pearl: 1, fiber: 1 },
  sandGolem: { crystal: 1, ore: 1 },
  toad: { herb: 1, leather: 1 },
  yeti: { leather: 2, crystal: 1 },
  ghoul: { fiber: 1, essence: 1 },
  scorpion: { leather: 1, ore: 1 },
};
const roster = {
  forest: ["boar", "lumberjack", "treantling"],
  meadow: ["boar", "lumberjack"],
  amberwood: ["treantling", "boar"],
  coast: ["crab", "sandGolem"],
  island: ["crab", "sandGolem"],
  lake: ["toad", "crab"],
  marsh: ["toad", "toad", "ghoul"],
  mountain: ["yeti"],
  tundra: ["yeti", "yeti"],
  highlands: ["yeti", "boar"],
  deadwood: ["ghoul", "treantling"],
  badlands: ["scorpion", "lumberjack"],
  ruins: ["ghoul", "scorpion"],
};
const hash = (n) => {
  const x = Math.sin(n * 91.7 + 13.1) * 43758.5453;
  return x - Math.floor(x);
};
const quiet = new Set(["village", "outpost", "harbor", "frontier"]);
// Scatter biome creatures on walkable ground, away from settlements and landmarks.
export function addBiomeSpawns(world) {
  if (enemySpawns.some((e) => e.id.startsWith("biome-"))) return;
  let placed = 0;
  for (let i = 0; i < 2600 && placed < 140; i++) {
    const tx = 4 + Math.floor(hash(i) * (WIDTH - 8)),
      ty = 4 + Math.floor(hash(i + 7777) * (HEIGHT - 8)),
      p = point(tx, ty),
      region = regionAt(p.x, p.y),
      list = roster[region];
    if (!list || quiet.has(region) || !canWalk(world, p.x, p.y, 10)) continue;
    if (Math.hypot(tx - 24, ty - 62) < 26) continue;
    if (landmarks.some((o) => Math.hypot(o.x - p.x, o.y - p.y) < 6 * TILE)) continue;
    if (enemySpawns.some((e) => Math.hypot(e.x - p.x, e.y - p.y) < 4 * TILE)) continue;
    const type = list[Math.floor(hash(i + 3) * list.length)];
    enemySpawns.push({ id: `biome-${type}-${placed}`, type, ...p, tier: Math.min(3, Math.floor(Math.hypot(tx - 24, ty - 62) / 60)) });
    placed++;
  }
}
// Per-frame tricks; returning true means the enemy's turn is fully handled here.
export function biomeSpecial(g, e, dt, dist) {
  const s = g.save;
  if (e.ambush) {
    if (e.hidden === undefined) e.hidden = true;
    if (e.hidden) {
      if (dist > 75) return true;
      e.hidden = false;
      e.stun = 0.4;
      g.effects.push({ type: "nova", x: e.x, y: e.y, style: "earth", radius: 60, seed: Math.random() * 100, life: 0.7, maxLife: 0.7 });
      g.emit("impact", e.x, e.y, "#d8c08a", 20);
    }
    return false;
  }
  if (e.charger) {
    e.chargeCd = Math.max(0, (e.chargeCd ?? 2) - dt);
    if (e.charge) {
      e.charge.life -= dt;
      for (let k = 0; k < 3; k++) {
        const nx = e.x + Math.cos(e.charge.angle) * 260 * dt / 3,
          ny = e.y + Math.sin(e.charge.angle) * 260 * dt / 3;
        if (canWalk(g.world, nx, ny, 8)) {
          e.x = nx;
          e.y = ny;
        } else e.charge.life = 0;
      }
      e.face = Math.cos(e.charge.angle) < 0 ? -1 : 1;
      if (!e.charge.hit && Math.hypot(s.x - e.x, s.y - e.y) < 26) {
        e.charge.hit = true;
        g.hurt(e.damage * 1.3, "physical");
      }
      if (Math.random() < 0.6) g.emit("trail", e.x, e.y, "#c8a070", 2);
      if (e.charge.life <= 0) {
        e.charge = null;
        e.cooldown = 1.2;
      }
      return true;
    }
    if (e.chargeCd <= 0 && dist > 55 && dist < 210 && (e.alert > 0 || dist < g.climate.aggro) && g.buffs.stealth <= 0) {
      e.charge = { angle: Math.atan2(s.y - e.y, s.x - e.x), life: 0.7 };
      e.chargeCd = 4.5;
      g.emit("phase", e.x, e.y, "#f0c080", 8);
      return true;
    }
  }
  return false;
}
// ---------- Drawing ----------
const r = (c, x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
const shadowOf = (c, x, y, w) => {
  c.fillStyle = "#00000040";
  c.beginPath();
  c.ellipse(x, y + 2, w, 4, 0, 0, Math.PI * 2);
  c.fill();
};
export function drawBiomeEnemy(c, e, time) {
  if (!biomeEnemyStats[e.type]) return false;
  const { x, y } = e;
  if (e.type === "sandGolem" && e.hidden) {
    // A suspicious mound of sand with a crack of glowing eyes.
    shadowOf(c, x, y, 14);
    r(c, x - 14, y - 6, 28, 8, "#d8c08a");
    r(c, x - 10, y - 9, 20, 4, "#e8d4a0");
    r(c, x - 15, y - 4, 2, 2, "#1a1210");
    r(c, x + 13, y - 4, 2, 2, "#1a1210");
    if (Math.sin(time * 2 + x) > 0.6) {
      r(c, x - 4, y - 7, 2, 1, "#ffb040");
      r(c, x + 2, y - 7, 2, 1, "#ffb040");
    }
    return true;
  }
  const sp = SPRITES[e.type],
    frame = Math.floor(time * 7 + x * 0.03) % 2,
    windup = e.windup > 0,
    bob = e.type === "toad" && windup ? -2 : 0;
  drawSprite(c, e.type, sp.frames, sp.palette, x + (windup ? Math.sin(time * 60) * 1 : 0), y + bob, {
    scale: 2,
    flip: (e.face || 1) < 0,
    frame,
    tint: windup ? "brightness(1.35)" : e.charge ? "saturate(1.4)" : undefined,
  });
  if (e.charge) for (let i = 0; i < 3; i++) r(c, x - (e.face || 1) * (22 + i * 7), y - 8 + i * 3, 5, 2, "#d8c09a");
  return true;
}

import { point, canWalk } from "./world.js";
import {
  expandedEnemyStats,
  makeEnemy,
  addHazard,
  bossPatterns,
  bossTicks,
  bossFan,
  bossSummon,
} from "./battle.js";
import { bossNames, mobNames } from "./content.js";
import { walkableNear } from "./eclipse.js";
import { tr } from "./i18n.js";
// Six roaming lords guard the far corners of the valley and return after a while.
export const RESPAWN = 1200;
export const worldBosses = [
  {
    id: "wbTreant",
    type: "treant",
    at: [128, 20],
    baseLevel: 6,
    trophy: "rootCrown",
    name: ["Древень Мшистый", "Mossbark the Elder Tree"],
    stats: { hp: 3200, damage: 40, speed: 34, xp: 420, gold: 300, color: "#8fd06a", element: "poison", minion: "wisp" },
  },
  {
    id: "wbWorm",
    type: "sandWorm",
    at: [90, 172],
    baseLevel: 7,
    trophy: "wormGreaves",
    name: ["Зыбун, песчаный червь", "Shifter the Sand Worm"],
    stats: { hp: 3600, damage: 44, speed: 0, xp: 480, gold: 340, color: "#e8c27a", element: "poison", minion: "spider" },
  },
  {
    id: "wbWitch",
    type: "witch",
    at: [160, 96],
    baseLevel: 8,
    trophy: "hexHood",
    name: ["Болотная ведьма Мора", "Mora the Bog Witch"],
    stats: { hp: 3800, damage: 46, speed: 52, xp: 540, gold: 380, color: "#b48cff", element: "void", minion: "spider" },
  },
  {
    id: "wbBandit",
    type: "banditKing",
    at: [230, 165],
    baseLevel: 9,
    trophy: "fangBoots",
    name: ["Атаман Кривой Клык", "Crookfang the Bandit King"],
    stats: { hp: 4300, damage: 50, speed: 70, xp: 600, gold: 520, color: "#e07a4a", minion: "bandit" },
  },
  {
    id: "wbCyclops",
    type: "cyclops",
    at: [215, 60],
    baseLevel: 11,
    trophy: "cyclopsEye",
    name: ["Гром, каменный циклоп", "Thunderhide the Cyclops"],
    stats: { hp: 5400, damage: 58, speed: 46, xp: 760, gold: 600, color: "#d8c49a", minion: "golem" },
  },
  {
    id: "wbWyrm",
    type: "frostWyrm",
    at: [230, 12],
    baseLevel: 13,
    trophy: "wyrmHelm",
    name: ["Хладокрыл, ледяной вирм", "Rimewing the Frost Wyrm"],
    stats: { hp: 6600, damage: 64, speed: 62, xp: 900, gold: 700, color: "#9ee4f6", element: "ice", minion: "bat" },
  },
];
for (const b of worldBosses) {
  expandedEnemyStats[b.type] = { ...b.stats, boss: true, worldBoss: true };
  bossNames[b.type] = b.name;
  mobNames[b.type] = b.name;
}
export function worldBossSpawns(world, save) {
  const elapsed = (save.playtime || 0) + (save.restTime || 0);
  return worldBosses
    .filter((b) => !(save.respawns?.[b.id] > elapsed))
    .map((b) => {
      const p = point(...b.at);
      return {
        id: b.id,
        type: b.type,
        ...walkableNear(world, p.x, p.y, 16),
        boss: true,
        unique: true,
        baseLevel: b.baseLevel,
      };
    });
}
export function installWorldBosses(Game) {
  Object.assign(Game.prototype, {
    spawnWorldBosses() {
      const s = this.save;
      if (!s || s.activeDungeon) return;
      const elapsed = s.playtime + s.restTime;
      for (const spawn of worldBossSpawns(this.world, s)) {
        if (this.enemies.some((e) => e.id === spawn.id && e.hp > 0)) continue;
        if (this.defeated.has(spawn.id)) {
          if (!(s.respawns[spawn.id] <= elapsed)) continue;
          this.defeated.delete(spawn.id);
          delete s.respawns[spawn.id];
        }
        this.enemies = this.enemies.filter((e) => e.id !== spawn.id);
        this.enemies.push(makeEnemy(spawn, undefined, s.level));
      }
    },
    updateWorldBosses(dt) {
      this.worldBossTimer = (this.worldBossTimer ?? 5) - dt;
      if (this.worldBossTimer > 0) return;
      this.worldBossTimer = 5;
      this.spawnWorldBosses();
    },
  });
}
const around = (g, s, k, r) => ({
  x: s.x + Math.cos(k * 2.3 + g.time) * r,
  y: s.y + Math.sin(k * 2.3 + g.time) * r * 0.8,
});
// ---- Attack patterns: n cycles 0..4, phase 1..3 ----
bossPatterns.treant = (g, e, n, phase, base, a) => {
  const s = g.save;
  if (n === 0) {
    // Roots erupt in a line toward the hero.
    for (let k = 1; k <= 4 + phase; k++)
      addHazard(g, { ...base, x: e.x + Math.cos(a) * k * 42, y: e.y + Math.sin(a) * k * 42, radius: 30, delay: 0.7 + k * 0.14, color: "#8fd06a" });
  } else if (n === 1) addHazard(g, { ...base, shape: "ring", radius: 185, inner: 90, color: "#6aa84a" });
  else if (n === 2) bossFan(g, e, 5 + phase * 2, 0.15, 190);
  else if (n === 3) addHazard(g, { ...base, x: s.x, y: s.y, radius: 70, delay: 1.1, element: "ice", color: "#a8e07a" });
  else {
    bossSummon(g, e, 2);
    if (phase >= 2) {
      e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.03);
      g.emit("heal", e.x, e.y, "#a8e07a", 24);
    }
  }
};
bossPatterns.sandWorm = (g, e, n, phase, base) => {
  const s = g.save;
  if (n % 2 === 0) {
    // Burrow, then burst out under the hero.
    e.burrowed = 1.4;
    e.emerge = { x: s.x, y: s.y };
    g.emit("trail", e.x, e.y, "#e8c27a", 20);
    addHazard(g, { ...base, x: s.x, y: s.y, radius: 64, delay: 1.4, color: "#e8c27a" });
  } else if (n === 1) bossFan(g, e, 5 + phase * 2, 0.14, 210);
  else addHazard(g, { ...base, shape: "ring", radius: 170, inner: 70, color: "#d8a85a" });
  if (phase >= 2 && n === 3) bossSummon(g, e, 2);
};
bossTicks.sandWorm = (g, e, dt) => {
  if (!(e.burrowed > 0)) return;
  e.burrowed -= dt;
  if (e.burrowed <= 0 && e.emerge) {
    const spot = canWalk(g.world, e.emerge.x, e.emerge.y, 12) ? e.emerge : { x: e.x, y: e.y };
    e.x = spot.x;
    e.y = spot.y;
    e.emerge = null;
    g.emit("impact", e.x, e.y, "#e8c27a", 30);
    g.shake = g.controls.screenShake ? 0.3 : 0;
  }
};
bossPatterns.witch = (g, e, n, phase, base, a) => {
  const s = g.save;
  if (n === 0) bossFan(g, e, 4 + phase, 0.2, 200);
  else if (n === 1)
    for (let k = 0; k < 2 + phase; k++) addHazard(g, { ...base, ...around(g, s, k, k * 50), radius: 46, delay: base.delay + k * 0.2, pool: true, element: "poison", color: "#9fe07a" });
  else if (n === 2) {
    addHazard(g, { ...base, shape: "ring", radius: 150, inner: 50 });
    for (let tries = 0; tries < 6; tries++) {
      const ang = g.rng() * Math.PI * 2,
        x = e.homeX + Math.cos(ang) * 150,
        y = e.homeY + Math.sin(ang) * 110;
      if (canWalk(g.world, x, y, 14)) {
        g.emit("phase", e.x, e.y, e.color, 18);
        e.x = x;
        e.y = y;
        g.emit("phase", x, y, e.color, 18);
        break;
      }
    }
  } else if (n === 3) addHazard(g, { ...base, shape: "line", angle: a, range: 360, width: 24 });
  else {
    bossSummon(g, e, 2);
    addHazard(g, { ...base, x: s.x, y: s.y, radius: 95, delay: 1.3, element: "poison", color: "#9fe07a" });
  }
};
bossPatterns.banditKing = (g, e, n, phase, base, a) => {
  const s = g.save;
  if (n === 0) addHazard(g, { ...base, shape: "cone", angle: a, arc: 0.95, radius: 130 });
  else if (n === 1) {
    addHazard(g, { ...base, radius: 105, delay: 0.8 });
    e.bossDash = { angle: a, speed: 260, life: 0.55, wait: 1 };
  } else if (n === 2) bossFan(g, e, 4 + phase * 2, 0.12, 250);
  else if (n === 3) {
    addHazard(g, { ...base, shape: "line", angle: a, range: 330, width: 28 });
    e.bossDash = { angle: a, speed: 300, life: 0.7, wait: base.delay };
  } else {
    bossSummon(g, e, 2);
    for (let k = 0; k < 3; k++) addHazard(g, { ...base, ...around(g, s, k, 20 + k * 45), radius: 52, delay: 1 + k * 0.25, element: "fire", color: "#ff9a3c" });
  }
};
bossPatterns.cyclops = (g, e, n, phase, base, a) => {
  const s = g.save;
  if (n === 0) addHazard(g, { ...base, x: s.x, y: s.y, radius: 82 });
  else if (n === 1)
    for (let k = 0; k < 2 + phase; k++) addHazard(g, { ...base, ...around(g, s, k, k * 38), radius: 50, delay: 0.9 + k * 0.45, color: "#b8a888" });
  else if (n === 2)
    // Sweeping eye beam: three lines fan out one after another.
    for (let k = -1; k <= 1; k++) addHazard(g, { ...base, shape: "line", angle: a + k * 0.5, range: 400, width: 20, delay: base.delay + (k + 1) * 0.35, element: "lightning", color: "#ff6a4a" });
  else if (n === 3) {
    addHazard(g, { ...base, radius: 110 });
    addHazard(g, { ...base, shape: "ring", radius: 230, inner: 140, delay: base.delay + 0.6 });
  } else {
    bossFan(g, e, 5 + phase, 0.16, 220);
    if (phase >= 2) bossSummon(g, e, 1);
  }
};
bossPatterns.frostWyrm = (g, e, n, phase, base, a) => {
  const s = g.save;
  if (n === 0) addHazard(g, { ...base, shape: "cone", angle: a, arc: 0.7, radius: 200, element: "ice" });
  else if (n === 1)
    for (let k = 0; k < 3 + phase; k++) addHazard(g, { ...base, ...around(g, s, k, 15 + k * 35), radius: 40, delay: 0.8 + k * 0.18, element: "ice" });
  else if (n === 2) {
    addHazard(g, { ...base, shape: "ring", radius: 200, inner: 95, element: "ice" });
    bossFan(g, e, 5 + phase, 0.18, 230);
  } else if (n === 3) {
    addHazard(g, { ...base, shape: "line", angle: a, range: 380, width: 34, element: "ice" });
    e.bossDash = { angle: a, speed: 320, life: 0.75, wait: base.delay };
  } else {
    addHazard(g, { ...base, radius: 145, element: "ice", delay: 1.2 });
    if (phase >= 2) bossSummon(g, e, 2);
  }
};
// ---- Models ----
const R = (c, x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
const P = (c, pts, col) => {
  c.fillStyle = col;
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
};
function shadow(c, x, y, w) {
  c.fillStyle = "#10192455";
  c.beginPath();
  c.ellipse(x, y + 4, w, 7, 0, 0, Math.PI * 2);
  c.fill();
}
const models = {
  treant(c, e, t) {
    const sway = Math.sin(t * 1.5) * 2;
    shadow(c, 0, 0, 30);
    // Root feet and trunk.
    for (const dx of [-16, -5, 6, 15]) P(c, [[dx - 4, 2], [dx, -12], [dx + 5, 2]], "#5a3a22");
    R(c, -14, -52, 28, 52, "#6b4428");
    R(c, -12, -52, 6, 52, "#8a5a34");
    R(c, 6, -48, 5, 46, "#4e3018");
    for (let i = 0; i < 5; i++) R(c, -10 + (i % 2) * 8, -44 + i * 9, 6, 1, "#4e3018");
    // Face with glowing eyes.
    R(c, -8, -38, 5, 4, "#0e0a06");
    R(c, 3, -38, 5, 4, "#0e0a06");
    R(c, -7, -37, 3, 2, e.enraged ? "#ff8a5a" : "#c8ff7a");
    R(c, 4, -37, 3, 2, e.enraged ? "#ff8a5a" : "#c8ff7a");
    R(c, -6, -26, 12, 3, "#2a180c");
    // Branch arms.
    P(c, [[-14, -40], [-34, -54 + sway], [-36, -48 + sway], [-14, -32]], "#6b4428");
    P(c, [[14, -40], [34, -54 - sway], [36, -48 - sway], [14, -32]], "#6b4428");
    // Leaf crown.
    for (const [dx, dy, r] of [[-22, -62, 14], [0, -72, 18], [22, -62, 14], [-10, -82, 12], [12, -80, 12], [-34, -50, 9], [34, -50, 9]]) {
      c.fillStyle = "#3f7a34";
      c.beginPath();
      c.arc(dx + sway * 0.5, dy, r, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#6fb24e";
      c.beginPath();
      c.arc(dx - 3 + sway * 0.5, dy - 3, r * 0.55, 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 6; i++) R(c, -24 + i * 9, -70 + (i % 2) * 8, 2, 2, "#d8a8e0");
  },
  sandWorm(c, e, t) {
    if (e.burrowed > 0) {
      // Only a churning mound is visible while burrowed.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 4;
        R(c, Math.cos(a) * 14, Math.sin(a) * 5 - 2, 4, 3, "#c8a060");
      }
      P(c, [[-18, 2], [0, -10], [18, 2]], "#d8b070");
      return;
    }
    shadow(c, 0, 0, 30);
    P(c, [[-34, 4], [-20, -6], [20, -6], [34, 4]], "#c8a060");
    const segs = 5;
    for (let i = segs; i >= 0; i--) {
      const y = -i * 14,
        x = Math.sin(t * 2 + i * 0.7) * (i * 2.5),
        w = 26 - i * 1.5;
      R(c, x - w / 2, y - 14, w, 16, i % 2 ? "#b0844a" : "#c89a5a");
      R(c, x - w / 2, y - 14, w, 3, "#e8c27a");
      R(c, x - w / 2 + 3, y - 6, 3, 3, "#7a5426");
      R(c, x + w / 2 - 6, y - 6, 3, 3, "#7a5426");
    }
    // Ring of teeth on top.
    const hx = Math.sin(t * 2 + segs * 0.7) * segs * 2.5,
      hy = -segs * 14 - 18;
    c.fillStyle = "#3a1a10";
    c.beginPath();
    c.ellipse(hx, hy, 12, 7, 0, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      R(c, hx + Math.cos(a) * 10 - 1, hy + Math.sin(a) * 5 - 1, 2, 3, "#f4ead0");
    }
  },
  witch(c, e, t) {
    const hover = Math.sin(t * 2.5) * 3;
    shadow(c, 0, 0, 20);
    c.translate(0, hover);
    // Broom staff with a cauldron-green orb.
    R(c, 18, -46, 2, 50, "#6b4428");
    c.fillStyle = "#9fe07a";
    c.globalAlpha = 0.5 + Math.sin(t * 6) * 0.2;
    c.beginPath();
    c.arc(19, -50, 7, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
    R(c, 16, -53, 6, 6, "#d8ffb0");
    // Tattered robe.
    P(c, [[-16, 2], [-12, -30], [12, -30], [16, 2]], "#4a2f6a");
    for (let i = 0; i < 5; i++) P(c, [[-16 + i * 8, 2], [-12 + i * 8, 8 + (i % 2) * 3], [-8 + i * 8, 2]], "#3a2252");
    R(c, -10, -28, 4, 22, "#6a4a90");
    R(c, -12, -14, 24, 3, "#2a1a3a");
    // Green face, long nose, glowing eyes.
    R(c, -7, -42, 14, 13, "#8fb06a");
    R(c, -1, -36, 6, 3, "#6f9050");
    R(c, -5, -39, 3, 2, "#ffef7a");
    R(c, 2, -39, 3, 2, "#ffef7a");
    R(c, -9, -32, 3, 8, "#cfcfcf");
    R(c, 6, -32, 3, 8, "#cfcfcf");
    // Big crooked hat.
    P(c, [[-18, -42], [18, -42], [6, -50], [10, -72], [-4, -50]], "#2a1a3a");
    R(c, -16, -44, 32, 3, "#3a2252");
    R(c, -6, -48, 12, 2, "#b48cff");
  },
  banditKing(c, e, t) {
    const step = Math.sin(t * 6) * 2;
    shadow(c, 0, 0, 22);
    c.scale(1.7, 1.7);
    R(c, -6, -6 + step, 5, 10, "#3a2a1e");
    R(c, 2, -6 - step, 5, 10, "#3a2a1e");
    R(c, -7, 2 + step, 6, 3, "#1e140c");
    R(c, 2, 2 - step, 6, 3, "#1e140c");
    R(c, -9, -24, 18, 19, "#7a4a2a");
    R(c, -8, -23, 4, 16, "#9a6234");
    R(c, -9, -10, 18, 3, "#3a2416");
    R(c, -2, -10, 4, 3, "#f2c14e");
    R(c, -12, -24, 4, 14, "#d89a70");
    R(c, 8, -24, 4, 14, "#d89a70");
    R(c, -6, -36, 12, 12, "#d89a70");
    R(c, -7, -38, 14, 4, "#c0302a");
    R(c, 5, -38, 5, 2, "#c0302a");
    R(c, 9, -36, 2, 5, "#c0302a");
    R(c, -4, -31, 2, 2, "#1a0e08");
    R(c, 2, -31, 2, 2, "#1a0e08");
    R(c, -6, -27, 12, 4, "#2a1a10");
    R(c, -2, -27, 1, 3, "#f4ead0");
    // Twin axes.
    for (const side of [-1, 1]) {
      R(c, side * 14 - 1, -32, 2, 22, "#6b4428");
      P(c, [[side * 14, -34], [side * 22, -38], [side * 22, -26], [side * 14, -28]], "#c8d0d2");
    }
  },
  cyclops(c, e, t) {
    const breathe = Math.sin(t * 2) * 1;
    shadow(c, 0, 0, 30);
    c.scale(2, 2);
    R(c, -7, -8, 6, 12, "#8a8478");
    R(c, 2, -8, 6, 12, "#8a8478");
    R(c, -11, -32 + breathe, 22, 25, "#a49c8a");
    R(c, -10, -31 + breathe, 5, 20, "#bab29e");
    R(c, -10, -12, 20, 6, "#6b4428");
    R(c, -16, -30, 6, 18, "#a49c8a");
    R(c, 10, -30, 6, 18, "#a49c8a");
    // Head with one huge eye.
    R(c, -7, -44 + breathe, 14, 13, "#a49c8a");
    R(c, -4, -41 + breathe, 8, 6, "#f4ead0");
    R(c, -2, -40 + breathe, 4, 4, e.enraged ? "#ff4a2a" : "#3a6ad0");
    R(c, -1, -39 + breathe, 1, 1, "#ffffff");
    R(c, -5, -34 + breathe, 10, 2, "#4a3a2a");
    R(c, -3, -46 + breathe, 2, 3, "#c8c0ae");
    R(c, 2, -46 + breathe, 2, 3, "#c8c0ae");
    // Stone club.
    R(c, 15, -38, 3, 22, "#6b4428");
    R(c, 12, -46, 9, 10, "#7a7468");
    R(c, 13, -45, 3, 3, "#9a9488");
  },
  frostWyrm(c, e, t) {
    const flap = Math.sin(t * 5) * 10,
      hover = Math.sin(t * 2) * 4;
    shadow(c, 0, 0, 34);
    c.translate(0, -18 + hover);
    // Wings.
    for (const side of [-1, 1]) {
      P(c, [[side * 8, -26], [side * 50, -44 - flap], [side * 46, -22 - flap * 0.5], [side * 30, -12], [side * 8, -14]], "#4a8ab0");
      P(c, [[side * 8, -26], [side * 46, -42 - flap], [side * 30, -20], [side * 8, -18]], "#9ee4f6");
      for (let k = 1; k <= 3; k++) R(c, side * (10 + k * 10) - 1, -28 - flap * (k / 4), 2, 14, "#2a5a7a");
    }
    // Body, tail and neck.
    P(c, [[-12, -30], [12, -30], [16, -8], [0, 4], [-16, -8]], "#7ac0dc");
    R(c, -6, -26, 12, 18, "#d8f6ff");
    P(c, [[0, 2], [-10, 18], [-22, 22], [-6, 10]], "#5aa0c0");
    P(c, [[-6, -30], [6, -30], [10, -48], [-2, -50]], "#7ac0dc");
    // Head with horns and icy eyes.
    R(c, -6, -60, 16, 11, "#7ac0dc");
    R(c, 8, -56, 7, 5, "#9ee4f6");
    R(c, 0, -57, 3, 3, "#ffffff");
    P(c, [[-4, -60], [-10, -70], [-1, -61]], "#e8faff");
    P(c, [[4, -60], [2, -71], [7, -61]], "#e8faff");
    c.globalAlpha = 0.5 + Math.sin(t * 7) * 0.2;
    R(c, 14, -54, 6, 2, "#e8faff");
    c.globalAlpha = 1;
  },
};
export function drawWorldBoss(c, e, time) {
  const model = models[e.type];
  if (!model) return false;
  c.save();
  c.translate(Math.round(e.x), Math.round(e.y));
  model(c, e, time);
  c.restore();
  if (e.windup > 0) {
    c.strokeStyle = "#efa989";
    c.beginPath();
    c.moveTo(e.x, e.y - 8);
    c.lineTo(e.aimX || e.x, e.aimY || e.y);
    c.stroke();
  }
  return true;
}
export const worldBossToast = (b) =>
  tr(`Мировой босс: ${b.name[0]}`, `World boss: ${b.name[1]}`);

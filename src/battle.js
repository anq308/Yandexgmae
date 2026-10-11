import { canWalk, lineOfSight } from "./world.js";
import { tr, label } from "./i18n.js";
import { bossNames } from "./content.js";
import { biomeEnemyStats } from "./bestiary.js";
export const expandedEnemyStats = {
  slime: { hp: 74, damage: 14, speed: 52, xp: 18, gold: 8 },
  golem: { hp: 230, damage: 28, speed: 38, xp: 42, gold: 16 },
  wisp: { hp: 145, damage: 22, speed: 64, xp: 34, gold: 13 },
  wolf: { hp: 180, damage: 23, speed: 88, xp: 32, gold: 15 },
  sentinel: { hp: 240, damage: 29, speed: 44, xp: 45, gold: 20 },
  bat: { hp: 100, damage: 18, speed: 100, xp: 23, gold: 10 },
  skeleton: { hp: 160, damage: 24, speed: 43, xp: 30, gold: 15, undead: true },
  bandit: { hp: 185, damage: 27, speed: 78, xp: 35, gold: 23 },
  spider: {
    hp: 175,
    damage: 23,
    speed: 80,
    xp: 32,
    gold: 12,
    element: "poison",
  },
  shaman: { hp: 220, damage: 30, speed: 42, xp: 42, gold: 22, element: "void" },
  revenant: { hp: 270, damage: 33, speed: 57, xp: 48, gold: 24, undead: true },
  shade: {
    hp: 300,
    damage: 38,
    speed: 92,
    xp: 60,
    gold: 26,
    element: "void",
    shade: true,
    color: "#9c86d6",
  },
  herald: {
    hp: 1500,
    damage: 46,
    speed: 48,
    xp: 320,
    gold: 160,
    element: "void",
    shade: true,
    color: "#b48cff",
  },
  guardian: {
    hp: 1850,
    damage: 39,
    speed: 45,
    xp: 180,
    gold: 220,
    boss: true,
    color: "#9ce3d9",
  },
  titan: {
    hp: 1550,
    damage: 43,
    speed: 42,
    xp: 150,
    gold: 180,
    boss: true,
    color: "#edd391",
  },
  boneKing: {
    hp: 2200,
    damage: 37,
    speed: 48,
    xp: 320,
    gold: 300,
    boss: true,
    color: "#cbb2f1",
    element: "void",
    undead: true,
  },
  frostTyrant: {
    hp: 3400,
    damage: 47,
    speed: 56,
    xp: 500,
    gold: 430,
    boss: true,
    color: "#9de7f5",
    element: "ice",
  },
  broodQueen: {
    hp: 4750,
    damage: 57,
    speed: 53,
    xp: 700,
    gold: 580,
    boss: true,
    color: "#bcdf91",
    element: "poison",
  },
  eclipse: {
    hp: 9200,
    damage: 74,
    speed: 70,
    xp: 1600,
    gold: 1500,
    boss: true,
    shade: true,
    color: "#c9a8ff",
    element: "void",
  },
  stormLord: {
    hp: 6800,
    damage: 68,
    speed: 65,
    xp: 950,
    gold: 800,
    boss: true,
    color: "#dfbdfb",
    element: "lightning",
  },
};
// World bosses register their own attack patterns and per-frame logic here.
// Global tuning: tougher foes so progress has to be earned.
export const DIFFICULTY = { hp: 1.6, damage: 1.35, bossHp: 1.25 };
export const bossPatterns = {},
  bossTicks = {};
export function makeEnemy(
  spawn,
  stats = expandedEnemyStats[spawn.type],
  playerLevel = 1,
) {
  const baseLevel =
      spawn.baseLevel ||
      stats.baseLevel ||
      {
        slime: 1,
        bat: 1,
        wolf: 3,
        golem: 3,
        wisp: 3,
        skeleton: 4,
        bandit: 4,
        spider: 4,
        shaman: 5,
        revenant: 6,
        sentinel: 6,
        guardian: 6,
        titan: 8,
        boneKing: 4,
        frostTyrant: 7,
        broodQueen: 10,
        stormLord: 14,
        shade: 10,
        herald: 12,
        eclipse: 16,
      }[spawn.type],
    offset = ([...spawn.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 3) - 1,
    level = Math.max(baseLevel, playerLevel + (stats.boss ? 2 : offset)),
    growth = Math.max(0, level - baseLevel);
  const tier = spawn.tier || 0,
    multiplier = (1 + tier * 0.24) * DIFFICULTY.hp * (stats.boss ? DIFFICULTY.bossHp : 1),
    elite = spawn.elite ? 1.55 : 1;
  return {
    ...spawn,
    ...stats,
    baseLevel,
    level,
    hp: Math.round(stats.hp * multiplier * elite * (1 + growth * 0.1)),
    maxHp: Math.round(stats.hp * multiplier * elite * (1 + growth * 0.1)),
    damage: Math.round(
      DIFFICULTY.damage *
      stats.damage *
        (1 + tier * 0.12) *
        (1 + growth * 0.055) *
        (spawn.elite ? 1.2 : 1),
    ),
    xp: Math.round(stats.xp * (1 + tier * 0.12) * (1 + growth * 0.1)),
    gold: Math.round(stats.gold * (1 + tier * 0.1)),
    homeX: spawn.x,
    homeY: spawn.y,
    cooldown: 1,
    windup: 0,
    phase: 1,
    attackTimer: 2.2,
    attackIndex: 0,
    engaged: false,
    elapsed: 0,
  };
}
export { fan as bossFan, summon as bossSummon };
Object.assign(expandedEnemyStats, biomeEnemyStats);
// Each boss casts in its own element.
export const bossStyle = (e) =>
  ({ boneKing: "bone", frostTyrant: "ice", broodQueen: "poison", stormLord: "lightning", guardian: "earth", titan: "earth", eclipse: "void", herald: "void", shade: "void" })[e.type] ||
  e.element ||
  "fire";
export function addHazard(g, data) {
  g.hazards.push({
    shape: "circle",
    delay: 0.9,
    radius: 60,
    color: "#ed997a",
    age: 0,
    done: false,
    ...data,
  });
}
function fan(g, e, count = 5, spread = 0.17, speed = 215) {
  const a = Math.atan2(g.save.y - e.y, g.save.x - e.x);
  addHazard(g, {
    shape: "volley",
    x: e.x,
    y: e.y,
    angle: a,
    count,
    spread,
    speed,
    range: 330,
    delay: 0.7,
    damage: e.damage * 0.65,
    color: e.color || "#ebad8d",
    element: e.element,
    style: bossStyle(e),
    owner: e.id,
  });
}
function orbRing(g, e, count, damage, style) {
  const spin = g.time * 0.7;
  for (let i = 0; i < count; i++) {
    const a = spin + (i / count) * Math.PI * 2,
      speed = 150;
    g.projectiles.push({
      x: e.x,
      y: e.y - 14,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 2.4,
      damage,
      enemy: true,
      type: "magic",
      style: ["fire", "ice", "lightning", "poison", "void", "light", "bone", "arcane"].includes(style) ? style : "arcane",
      color: e.color,
      element: e.element,
      hit: new Set(),
      pierce: 1,
    });
  }
}
function summon(g, e, count) {
  const type = e.minion ||
    (e.type === "broodQueen"
      ? "spider"
      : e.type === "boneKing"
        ? "skeleton"
        : e.type === "frostTyrant"
          ? "bat"
          : e.type === "eclipse"
            ? "shade"
            : "revenant");
  const alive = g.enemies.filter((m) => m.owner === e.id && m.hp > 0).length;
  for (let i = 0; i < Math.min(count, 4 - alive); i++) {
    const a = (i * Math.PI * 2) / count,
      x = e.x + Math.cos(a) * 85,
      y = e.y + Math.sin(a) * 85;
    if (canWalk(g.world, x, y, 6)) {
      const m = makeEnemy(
        {
          id: e.id + "-summon-" + ++g.spawnSerial,
          type,
          x,
          y,
          tier: g.save.level >= 12 ? 2 : 0,
          owner: e.id,
          summoned: true,
        },
        undefined,
        g.save.level,
      );
      m.hp = m.maxHp = Math.round(m.maxHp * 0.65);
      m.xp = m.gold = 0;
      g.enemies.push(m);
      g.emit("summon", x, y, e.color, 20);
    }
  }
}
// Nerei the Lightless: night pulses with safe light pools, shadow beams and blinks.
function eclipseAttack(g, e, n, phase, base, a) {
  const s = g.save;
  if (n === 1 && phase >= 2) {
    const safe = [];
    for (let k = 0; k < 3; k++) {
      const angle = k * ((Math.PI * 2) / 3) + g.time,
        x = e.homeX + Math.cos(angle) * 120,
        y = e.homeY + Math.sin(angle) * 85;
      if (canWalk(g.world, x, y, 10)) safe.push({ x, y, r: 38 });
    }
    if (!safe.length) safe.push({ x: s.x, y: s.y, r: 40 });
    addHazard(g, {
      ...base,
      x: e.homeX,
      y: e.homeY,
      shape: "eclipse",
      radius: 330,
      safe,
      delay: 2.4,
      damage: base.damage * 1.25,
      color: "#6b4fa8",
    });
    g.onToast(
      tr(
        "Нерей гасит свет! Встаньте в светлый круг.",
        "Nerei swallows the light! Stand in a circle of light.",
      ),
    );
  } else if (n === 3) {
    for (let k = -1; k <= (phase >= 2 ? 1 : -1); k += 2)
      addHazard(g, {
        ...base,
        shape: "line",
        angle: a + k * (phase >= 2 ? 0.45 : 0),
        range: 420,
        width: 26,
        color: "#a183ff",
      });
    if (phase === 1)
      addHazard(g, { ...base, shape: "line", angle: a, range: 420, width: 26, color: "#a183ff" });
  } else if (n === 2) {
    fan(g, e, 5 + phase * 2, 0.13, 220 + phase * 15);
  } else if (n === 0) {
    addHazard(g, { ...base, shape: "cone", angle: a, arc: 1.1, radius: 165 });
  } else {
    for (let k = 0; k < phase + 2; k++)
      addHazard(g, {
        ...base,
        x: s.x + Math.cos(k * 2.4) * k * 46,
        y: s.y + Math.sin(k * 2.4) * k * 46,
        radius: 50,
        delay: base.delay + k * 0.2,
      });
  }
  if (phase === 3) {
    // Blink to a new point around the arena centre.
    for (let tries = 0; tries < 6; tries++) {
      const angle = g.rng() * Math.PI * 2,
        x = e.homeX + Math.cos(angle) * 140,
        y = e.homeY + Math.sin(angle) * 100;
      if (canWalk(g.world, x, y, 16)) {
        g.emit("phase", e.x, e.y, e.color, 20);
        e.x = x;
        e.y = y;
        g.emit("phase", x, y, e.color, 20);
        break;
      }
    }
  }
}
export function updateBoss(g, e, dt) {
  const s = g.save,
    dist = Math.hypot(s.x - e.x, s.y - e.y);
  if (e.sleeping) return;
  if (g.buffs.stealth > 0 && dist > 70) return;
  const inArena =
    !e.arena ||
    (s.x > e.arena.x &&
      s.x < e.arena.x + e.arena.w &&
      s.y > e.arena.y &&
      s.y < e.arena.y + e.arena.h);
  if (!e.engaged) {
    if (!inArena || dist > 245 || !lineOfSight(g.world, e, s)) return;
    e.engaged = true;
    e.attackTimer = 1.25;
    g.sealArena?.();
    g.onToast(
      label(bossNames[e.type] || [e.type, e.type]) +
        " — " +
        tr("бой начался", "battle begins"),
    );
  }
  if (!e.arena && Math.hypot(s.x - e.homeX, s.y - e.homeY) > 430) {
    e.engaged = false;
    e.elapsed = 0;
    e.bossDash = null;
    e.burrowed = 0;
    e.attackTimer = 2.2;
    for (const m of g.enemies) if (m.owner === e.id) m.hp = 0;
    e.hp = e.maxHp;
    e.phase = 1;
    e.x = e.homeX;
    e.y = e.homeY;
    g.hazards = g.hazards.filter((h) => h.owner !== e.id);
    return;
  }
  e.elapsed += dt;
  e.enraged = e.elapsed >= 100;
  bossTicks[e.type]?.(g, e, dt);
  const phase = e.hp / e.maxHp > 0.66 ? 1 : e.hp / e.maxHp > 0.33 ? 2 : 3;
  if (phase > e.phase) {
    e.phase = phase;
    e.attackTimer = 0.9;
    g.emit("phase", e.x, e.y, e.color, 55);
    g.shake = g.controls.screenShake ? 0.35 : 0;
    summon(g, e, phase === 2 ? 2 : 3);
  }
  e.ward = g.enemies.some((m) => m.owner === e.id && m.hp > 0);
  e.attackTimer -= dt;
  e.recover = Math.max(0, (e.recover || 0) - dt);
  if (e.attackTimer <= 0) {
    const n = e.attackIndex++ % 5,
      a = Math.atan2(s.y - e.y, s.x - e.x),
      damage = e.damage * (e.enraged ? 1.3 : 1),
      color = e.color || "#edb980",
      delay = phase === 3 ? 0.72 : 1.05;
    const style = bossStyle(e),
      base = {
        x: e.x,
        y: e.y,
        damage,
        element: e.element,
        color,
        owner: e.id,
        delay,
        style,
      };
    g.effects.push({ type: "bossCast", x: e.x, y: e.y, style, life: 0.8, maxLife: 0.8 });
    // From the second phase every boss also looses a spinning ring of orbs.
    if (phase >= 2 && n === 2) orbRing(g, e, 10 + phase * 3, damage * 0.55, style);
    if (bossPatterns[e.type]) {
      bossPatterns[e.type](g, e, n, phase, base, a);
    } else if (e.type === "eclipse") {
      eclipseAttack(g, e, n, phase, base, a);
    } else if (e.type === "stormLord" && (n === 1 || n === 4)) {
      for (let k = 0; k < phase + 1; k++)
        addHazard(g, {
          ...base,
          x: s.x + Math.cos(k * 2) * k * 48,
          y: s.y + Math.sin(k * 2) * k * 48,
          radius: 45,
          delay: 0.9 + k * 0.24,
          shape: "lightning",
        });
    } else if (n === 0) {
      addHazard(g, {
        ...base,
        shape: "cone",
        angle: a,
        arc: 1.03,
        radius: 145,
      });
      if (phase === 3) fan(g, e, 7, 0.14, 240);
    } else if (n === 1) {
      addHazard(g, { ...base, shape: "ring", radius: 195, inner: 100 });
      if (phase >= 2)
        addHazard(g, {
          ...base,
          x: s.x,
          y: s.y,
          radius: 47,
          delay: delay + 0.5,
        });
    } else if (n === 2) {
      fan(g, e, 3 + phase * 2, 0.16, 205 + phase * 12);
    } else if (n === 3) {
      addHazard(g, {
        ...base,
        shape: "line",
        angle: a,
        range: 370,
        width: 31,
        damage: damage * 1.1,
      });
      if (e.type === "frostTyrant" || e.type === "titan")
        e.bossDash = { angle: a, speed: 210, life: 0.65, wait: delay };
    } else {
      for (let k = 0; k < phase + 1; k++)
        addHazard(g, {
          ...base,
          x: s.x + Math.cos(k * 2.1) * k * 52,
          y: s.y + Math.sin(k * 2.1) * k * 52,
          radius: 55,
          delay: delay + k * 0.22,
          pool: e.type === "broodQueen",
        });
      if (phase >= 2 && e.attackIndex % 10 === 0) summon(g, e, 2);
    }
    e.recover = delay + 0.65;
    e.attackTimer = phase === 3 ? 1.75 : phase === 2 ? 2.25 : 2.85;
  }
  if (e.burrowed > 0) return;
  if (e.bossDash) {
    e.bossDash.wait -= dt;
    if (e.bossDash.wait <= 0) {
      const dash = e.bossDash;
      dash.life -= dt;
      for (let i = 0; i < 3; i++) {
        const x = e.x + (Math.cos(dash.angle) * dash.speed * dt) / 3,
          y = e.y + (Math.sin(dash.angle) * dash.speed * dt) / 3;
        if (canWalk(g.world, x, y, 16)) {
          e.x = x;
          e.y = y;
        }
      }
      if (Math.hypot(s.x - e.x, s.y - e.y) < 38) g.hurt(e.damage, e.element);
      g.emit("trail", e.x, e.y, e.color, 2);
      if (dash.life <= 0) e.bossDash = null;
    }
  } else if (e.recover <= 0 && dist > 115) {
    const speed =
        e.speed * (phase === 3 ? 1.15 : 1) * (e.slow > 0 ? 0.75 : 1) * dt,
      dx = (s.x - e.x) / dist,
      dy = (s.y - e.y) / dist;
    const x = e.x + dx * speed,
      y = e.y + dy * speed;
    if (
      canWalk(g.world, x, y, 15) &&
      (!e.arena ||
        (x > e.arena.x + 25 &&
          x < e.arena.x + e.arena.w - 25 &&
          y > e.arena.y + 25 &&
          y < e.arena.y + e.arena.h - 25))
    ) {
      e.x = x;
      e.y = y;
    }
  }
}
export function hazardHits(h, p) {
  const dx = p.x - h.x,
    dy = p.y - h.y,
    d = Math.hypot(dx, dy),
    a = Math.atan2(dy, dx),
    diff = Math.atan2(
      Math.sin(a - (h.angle || 0)),
      Math.cos(a - (h.angle || 0)),
    );
  if (h.shape === "line")
    return (
      dx * Math.cos(h.angle) + dy * Math.sin(h.angle) > -12 &&
      dx * Math.cos(h.angle) + dy * Math.sin(h.angle) < h.range &&
      Math.abs(-dx * Math.sin(h.angle) + dy * Math.cos(h.angle)) < h.width + 8
    );
  if (h.shape === "cone") return d < h.radius + 8 && Math.abs(diff) < h.arc;
  if (h.shape === "eclipse")
    return (
      d < h.radius &&
      !(h.safe || []).some((z) => Math.hypot(p.x - z.x, p.y - z.y) < z.r - 4)
    );
  if (h.shape === "ring") return d < h.radius + 8 && d > (h.inner || 0) - 8;
  return d < h.radius + 8;
}
export function updateHazards(g, dt) {
  for (const h of g.hazards) {
    if (g.paused) return;
    h.age += dt;
    h.delay -= dt;
    if (h.done) {
      h.life -= dt;
      if (h.pool) {
        h.tick -= dt;
        if (h.tick <= 0) {
          h.tick = 1.15;
          if (hazardHits(h, g.save)) g.hurt(h.damage * 0.24, "poison");
        }
      }
      continue;
    }
    if (h.delay > 0) continue;
    h.done = true;
    h.life = h.pool ? 5 : 0.3;
    h.tick = 0;
    if (h.style && h.owner !== "weather") {
      if (h.shape === "line") g.effects.push({ type: "beam", x: h.x, y: h.y + 10, angle: h.angle, length: h.range, width: h.width * 0.7, style: h.style, seed: g.time, life: 0.55, maxLife: 0.55 });
      else if (h.shape === "cone") g.effects.push({ type: "breath", x: h.x, y: h.y, angle: h.angle, arc: h.arc, radius: h.radius, style: h.style, seed: g.time, life: 0.7, maxLife: 0.7 });
      else if (h.shape !== "volley" && h.shape !== "eclipse") {
        g.effects.push({ type: "nova", x: h.x, y: h.y, radius: h.shape === "ring" ? h.radius : h.radius * 1.15, style: h.shape === "lightning" ? "lightning" : h.style, seed: g.time * 7 + h.x, life: 0.75, maxLife: 0.75 });
        if (!h.pool && h.shape !== "ring") g.addDecal?.(h.x, h.y, h.radius * 0.8, h.style, 3);
      }
    }
    g.emit(
      h.shape === "lightning" ? "lightning" : "impact",
      h.x,
      h.y,
      h.color,
      25,
    );
    if (h.shape === "volley") {
      for (let i = 0; i < h.count; i++) {
        const a = h.angle + (i - (h.count - 1) / 2) * h.spread;
        g.projectiles.push({
          x: h.x,
          y: h.y - 8,
          vx: Math.cos(a) * h.speed,
          vy: Math.sin(a) * h.speed,
          life: 2,
          damage: h.damage,
          enemy: true,
          type: "magic",
          style: ["fire", "ice", "lightning", "poison", "void", "light", "bone", "arcane"].includes(h.style) ? h.style : undefined,
          color: h.color,
          element: h.element,
          hit: new Set(),
          pierce: 1,
        });
      }
    } else if (
      hazardHits(h, g.save) &&
      (h.shape === "lightning" || lineOfSight(g.world, h, g.save))
    ) {
      g.hurt(h.damage, h.element, h.owner === "weather");
      if (h.element === "ice") g.buffs.chilled = 1.5;
    }
    if (h.owner === "weather")
      for (const e of g.combatEnemies())
        if (hazardHits(h, e)) g.damageEnemy(e, h.damage * 1.5);
  }
  g.hazards = g.hazards.filter((h) => !h.done || h.life > 0);
}

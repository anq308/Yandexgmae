import { TILE, WIDTH, HEIGHT, point, canWalk, regionAt } from "./world.js";
// Farms, market stalls and pastures around the villages, plus abandoned huts in the wilds.
// Decorations never block movement; only the huts occupy their own tiles.
export const ruins = [
  { id: "ruin1", at: [54, 26], name: ["Заброшенная хижина лесника", "Abandoned forester's hut"] },
  { id: "ruin2", at: [118, 96], name: ["Покосившийся дом на болоте", "Sunken marsh house"] },
  { id: "ruin3", at: [200, 104], name: ["Мёртвая сторожка", "Dead watch-lodge"] },
  { id: "ruin4", at: [206, 24], name: ["Занесённая снегом хижина", "Snowbound hut"] },
  { id: "ruin5", at: [240, 72], name: ["Разрушенный приют", "Ruined shelter"] },
  { id: "ruin6", at: [100, 162], name: ["Хижина отшельника", "Hermit's shack"] },
];
// Livestock pens in pixel space: animals wander inside their fences.
export const pens = [
  { kind: "cow", x: 8, y: 62, w: 6, h: 5, count: 3 },
  { kind: "pig", x: 37, y: 58, w: 5, h: 4, count: 3 },
  { kind: "chicken", x: 13, y: 67, w: 4, h: 3, count: 5 },
  { kind: "goat", x: 62, y: 35, w: 5, h: 4, count: 3 },
  { kind: "chicken", x: 149, y: 83, w: 4, h: 3, count: 4 },
  { kind: "cow", x: 128, y: 86, w: 5, h: 4, count: 2 },
  { kind: "pig", x: 192, y: 155, w: 4, h: 3, count: 3 },
  { kind: "sheep", x: 177, y: 156, w: 5, h: 3, count: 3 },
];
const decor = [
  // Leafhaven farm: a fenced plot of beds, windmill, scarecrow, hay and a small market.
  ["farm", 32, 67, { w: 6, h: 4, crops: ["wheat", "cabbage", "pumpkin", "carrot"] }],
  ["windmill", 40, 68],
  ["scarecrow", 35, 68.4],
  ["haystack", 39, 72],
  ["haystack", 31, 73],
  ["cart", 30, 72],
  ["woodpile", 14, 57],
  ["beehive", 11, 70],
  ["beehive", 12, 71],
  ["flowerbed", 21, 59],
  ["flowerbed", 31, 57],
  ["stall", 22, 66, { goods: "apples" }],
  ["stall", 26, 67, { goods: "cloth" }],
  ["trough", 10, 66],
  // Highspring terraces.
  ["farm", 68, 40, { w: 6, h: 3, crops: ["wheat", "carrot", "cabbage"] }],
  ["haystack", 66, 41],
  ["woodpile", 75, 33],
  ["flowerbed", 70, 32],
  // The old graveyard around Leafhaven Crypt, deep in the woods.
  ["grave", 64, 55],
  ["grave", 65, 59],
  ["grave", 70, 55],
  ["grave", 71, 59],
  ["grave", 63, 57.5],
  ["grave", 72, 57],
  ["deadTree", 62, 54],
  ["deadTree", 73, 54.5],
  ["deadTree", 62.5, 60],
  // Riverport market row and fish racks.
  ["stall", 134, 80, { goods: "fish" }],
  ["stall", 137, 80, { goods: "apples" }],
  ["stall", 140, 80, { goods: "pots" }],
  ["fishrack", 143, 90],
  ["fishrack", 146, 90],
  ["cart", 131, 82],
  ["haystack", 127, 85],
  // Frontier fields.
  ["farm", 177, 151, { w: 6, h: 3, crops: ["wheat", "pumpkin", "carrot"] }],
  ["scarecrow", 180, 152.4],
  ["haystack", 184, 154],
  ["woodpile", 186, 141],
];
const landmarks = new Set(["npc", "camp", "chest", "rune", "altar", "entrance", "door", "ruinHouse", "trainer", "sign", "board"]);
// Find the nearest spot whose whole w×h tile block is free.
function freeBlock(world, tx, ty, w, h) {
  for (let ring = 0; ring < 14; ring++)
    for (let dy = -ring; dy <= ring; dy++)
      for (let dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const x0 = tx + dx,
          y0 = ty + dy;
        let ok = true;
        for (let y = y0 - 1; y <= y0 + h && ok; y++)
          for (let x = x0 - 1; x <= x0 + w && ok; x++)
            if (world.blocked[y * WIDTH + x] || world.tiles[y * WIDTH + x] === 2) ok = false;
        // Keep clear of quest objects, chests and camps so huts never hide them.
        if (ok && world.getObjectsInRect)
          ok = !world
            .getObjectsInRect((x0 - 3) * TILE, (y0 - 3) * TILE, (w + 6) * TILE, (h + 6) * TILE)
            .some((o) => landmarks.has(o.type));
        if (ok) return [x0, y0];
      }
  return null;
}
// Fields, pens and graves need open ground: trees, rocks and flowers there are removed.
function clearArea(world, tx, ty, w, h) {
  if (!world.removeObject) return;
  for (const o of world.getObjectsInRect(tx * TILE - TILE, ty * TILE - TILE, (w + 2) * TILE, (h + 3) * TILE)) {
    if (!["tree", "rock", "flower"].includes(o.type)) continue;
    const ox = Math.floor(o.x / TILE),
      oy = Math.floor(o.y / TILE);
    if (ox < tx - 1 || ox > tx + w || oy < ty - 1 || oy > ty + h + 1) continue;
    world.removeObject(o);
    if (world.tiles[oy * WIDTH + ox] !== 2) world.blocked[oy * WIDTH + ox] = 0;
  }
}
const h2 = (x, y) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
const isWater = (world, x, y) => world.tiles[y * WIDTH + x] === 2;
const isShore = (world, x, y) => !isWater(world, x, y) && !world.blocked[y * WIDTH + x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isWater(world, x + dx, y + dy));
const beachRegion = (x, y) => ["coast", "island"].includes(regionAt(x * TILE, y * TILE));
// Nearest walkable shore tile around (tx, ty), with the direction towards open water.
function findShore(world, tx, ty, maxRing = 14, open = 0) {
  for (let ring = 0; ring < maxRing; ring++)
    for (let dy = -ring; dy <= ring; dy++)
      for (let dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const x = tx + dx,
          y = ty + dy;
        if (x < 2 || y < 2 || x >= WIDTH - 2 || y >= HEIGHT - 2 || !isShore(world, x, y)) continue;
        const dir = [[0, 1], [1, 0], [-1, 0], [0, -1]].find(([ox, oy]) => {
          for (let k = 1; k <= Math.max(1, open); k++) if (!isWater(world, x + ox * k, y + oy * k)) return false;
          // Open sea: the water is wide on both sides as well, not a narrow stream.
          return !open || [-2, 2].every((side) => isWater(world, x + ox * 3 + oy * side, y + oy * 3 + ox * side));
        });
        if (dir) return { x, y, dir };
      }
  return null;
}
// The coast: fewer boulders, more shells, driftwood, seaweed and dune grass; a fishing pier,
// boats and nets by the seaside house, a shipwreck, crabs on the sand and gulls overhead.
function addBeach(world) {
  world.critterHomes = world.critterHomes || [];
  for (const o of world.getObjectsInRect(0, 99 * TILE, WIDTH * TILE, (HEIGHT - 99) * TILE)) {
    if (o.type !== "rock") continue;
    const tx = Math.floor(o.x / TILE),
      ty = Math.floor(o.y / TILE);
    if (!beachRegion(tx, ty) || h2(tx, ty) < 0.3) continue;
    world.removeObject(o);
    world.blocked[ty * WIDTH + tx] = 0;
  }
  for (let y = 100; y < HEIGHT - 2; y++)
    for (let x = 2; x < WIDTH - 2; x++) {
      if (!beachRegion(x, y) || isWater(world, x, y) || world.blocked[y * WIDTH + x] || world.tiles[y * WIDTH + x] === 1) continue;
      const r = h2(x, y),
        shore = isShore(world, x, y);
      let kind = null;
      if (shore && r < 0.09) kind = ["shell", "starfish", "seaweed", "seaweed"][Math.floor(r * 44) % 4];
      else if (!shore && r < 0.022) kind = ["duneGrass", "duneGrass", "driftwood", "shell", "tidepool"][Math.floor(r * 220) % 5];
      if (kind) world.addObject({ id: `beach-${kind}-${x}-${y}`, type: "decor", kind, ...point(x, y), variant: Math.floor(r * 1000) % 3 });
      if (shore && r > 0.985) world.critterHomes.push({ kind: "crab", x, y, r: 2, count: 1 + (r > 0.993 ? 1 : 0) });
    }
  // Seaside fishing spot: a short pier over the water, beached boats and drying nets.
  const pier = findShore(world, 44, 112, 30, 6);
  if (pier && pier.dir) {
    const [dx, dy] = pier.dir;
    let len = 0;
    for (let k = 1; k <= 4 && isWater(world, pier.x + dx * k, pier.y + dy * k); k++) {
      world.blocked[(pier.y + dy * k) * WIDTH + pier.x + dx * k] = 0;
      len = k;
    }
    if (len) world.addObject({ id: "pierFishing", type: "fishspot", name: ["Рыбалка с пирса", "Pier fishing"], ...point(pier.x + dx * len, pier.y + dy * len) });
    if (len) world.addObject({ id: "decor-pier", type: "decor", kind: "pier", ...point(pier.x + (dx * (len + 1)) / 2, pier.y + (dy * (len + 1)) / 2), dir: pier.dir, len: len + 1 });
  }
  for (const [tx, ty, i] of [[40, 113, 0], [49, 113, 1]]) {
    const b = findShore(world, tx, ty, 8);
    if (b) world.addObject({ id: `decor-boat-${i}`, type: "decor", kind: "boat", ...point(b.x, b.y), variant: i });
  }
  for (const [kind, tx, ty] of [["netRack", 47, 108], ["barrelStack", 41, 108], ["crates", 48, 110], ["fishrack", 40, 110], ["campfirePot", 46, 112]]) {
    const p = point(tx, ty);
    if (canWalk(world, p.x, p.y, 4)) world.addObject({ id: `decor-${kind}-${tx}-${ty}`, type: "decor", kind, ...p });
  }
  for (const [tx, ty] of [[100, 120], [24, 124], [140, 116]]) {
    const w = findShore(world, tx, ty, 18);
    if (!w) continue;
    world.addObject({ id: "decor-wreck", type: "decor", kind: "wreck", ...point(w.x, w.y) });
    world.blocked[w.y * WIDTH + w.x] = 1;
    break;
  }
  for (let i = 0; i < 5; i++) world.critterHomes.push({ kind: "gull", x: 30 + i * 22, y: 108 + (i % 3) * 8, r: 6, count: 1 });
}
export function addSettlements(world) {
  if (!world.addObject) return;
  if (world.removeObject) addBeach(world);
  for (const [type, tx, ty, extra = {}] of decor) {
    const p = point(tx, ty);
    if (type === "farm") {
      clearArea(world, tx, ty, extra.w, extra.h);
      world.addObject({ id: `decor-farm-${tx}-${ty}`, type: "decor", kind: "farm", x: (tx + extra.w / 2) * TILE, y: (ty + extra.h / 2) * TILE, ...extra });
      continue;
    }
    clearArea(world, Math.floor(tx), Math.floor(ty), 1, 1);
    if (!canWalk(world, p.x, p.y, 2)) continue;
    world.addObject({ id: `decor-${type}-${tx}-${ty}`, type: "decor", kind: type, ...p, ...extra });
  }
  for (const pen of pens) clearArea(world, pen.x, pen.y, pen.w, pen.h);
  for (const pen of pens)
    world.addObject({
      id: `pen-${pen.x}-${pen.y}`,
      type: "decor",
      kind: "pen",
      x: pen.x * TILE,
      y: pen.y * TILE,
      w: pen.w * TILE,
      h: pen.h * TILE,
    });
  for (const r of ruins) {
    const spot = freeBlock(world, r.at[0], r.at[1], 4, 3);
    if (!spot) continue;
    const [tx, ty] = spot;
    // The hut occupies its tiles; the door step below stays walkable.
    for (let y = ty; y < ty + 2; y++) for (let x = tx; x < tx + 4; x++) world.blocked[y * WIDTH + x] = 1;
    const p = point(tx + 1.5, ty + 1.6);
    world.addObject({ id: r.id, type: "ruinHouse", ...p, name: r.name });
    world.addObject({ id: "door-" + r.id, type: "door", house: r.id, x: p.x, y: p.y + 14, name: r.name });
  }
}
// Ambient animals: they wander inside their pens and never fight.
export function createCritters(rng = Math.random, world = null) {
  const out = [];
  // Free-roaming wildlife: crabs scuttle around their patch of sand, gulls circle above the coast.
  for (const h of world?.critterHomes || [])
    for (let i = 0; i < h.count; i++)
      out.push({ kind: h.kind, home: h, x: (h.x + 0.5) * TILE, y: (h.y + 0.5) * TILE, tx: null, wait: rng() * 3, face: 1, seed: rng() * 10 });
  for (const pen of pens)
    for (let i = 0; i < pen.count; i++)
      out.push({
        kind: pen.kind,
        pen,
        x: (pen.x + 0.5 + rng() * (pen.w - 1)) * TILE,
        y: (pen.y + 0.5 + rng() * (pen.h - 1)) * TILE,
        tx: null,
        wait: rng() * 3,
        face: rng() < 0.5 ? -1 : 1,
        seed: rng() * 10,
      });
  return out;
}
export function updateCritters(critters, dt, hero, rng = Math.random) {
  for (const a of critters) {
    if (Math.abs(a.x - hero.x) > 700 || Math.abs(a.y - hero.y) > 500) continue;
    if (a.kind === "gull") {
      a.seed += dt;
      const t = a.seed * 0.5;
      a.x = (a.home.x + 0.5) * TILE + Math.cos(t) * a.home.r * TILE;
      a.y = (a.home.y + 0.5) * TILE + Math.sin(t * 1.3) * a.home.r * TILE * 0.5;
      a.face = Math.sin(t) > 0 ? -1 : 1;
      a.moving = true;
      continue;
    }
    a.wait -= dt;
    if (a.tx === null && a.wait <= 0 && a.home) {
      a.tx = (a.home.x + 0.5 + (rng() - 0.5) * 2 * a.home.r) * TILE;
      a.ty = (a.home.y + 0.5 + (rng() - 0.5) * a.home.r) * TILE;
    } else if (a.tx === null && a.wait <= 0) {
      a.tx = (a.pen.x + 0.5 + rng() * (a.pen.w - 1)) * TILE;
      a.ty = (a.pen.y + 0.5 + rng() * (a.pen.h - 1)) * TILE;
    }
    if (a.tx !== null) {
      const d = Math.hypot(a.tx - a.x, a.ty - a.y),
        speed = (a.kind === "chicken" ? 30 : a.kind === "crab" ? 22 : 16) * dt;
      if (d < 2) {
        a.tx = null;
        a.wait = 1.5 + rng() * 4;
      } else {
        a.face = a.tx < a.x ? -1 : 1;
        a.x += ((a.tx - a.x) / d) * speed;
        a.y += ((a.ty - a.y) / d) * speed;
      }
    }
    a.moving = a.tx !== null;
  }
}

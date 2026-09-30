import { WIDTH, HEIGHT, TILE, point } from "./world.js";
import { dungeons } from "./content.js";
export function createDungeon(state) {
  const d = dungeons[state.id],
    tiles = new Uint8Array(WIDTH * HEIGHT).fill(8),
    blocked = new Uint8Array(WIDTH * HEIGHT).fill(1),
    objects = [];
  const carve = (x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) {
        tiles[yy * WIDTH + xx] = 9;
        blocked[yy * WIDTH + xx] = 0;
      }
  };
  for (const r of [
    [4, 33, 12, 11],
    [4, 17, 12, 12],
    [20, 17, 13, 12],
    [20, 4, 13, 11],
    [38, 4, 16, 13],
    [36, 28, 21, 17],
  ])
    carve(...r);
  carve(8, 25, 3, 14);
  carve(9, 22, 18, 3);
  carve(25, 9, 3, 16);
  carve(26, 8, 21, 3);
  carve(44, 9, 3, 31);
  const prefix = `${state.id}:${state.runId}:${state.floor}:`,
    last = state.floor === d.floors;
  objects.push(
    {
      id: prefix + "exit",
      type: "exit",
      ...point(7, 40),
      name: ["Выход из подземелья", "Dungeon exit"],
    },
    {
      id: prefix + "stairs",
      type: "stairs",
      ...point(48, 41),
      name: last
        ? ["Выход после победы", "Victory exit"]
        : ["Лестница вниз", "Stairs down"],
    },
  );
  for (const [x, y] of [
    [5, 34],
    [14, 27],
    [21, 18],
    [31, 6],
    [39, 6],
    [54, 29],
    [38, 43],
  ])
    objects.push({
      id: prefix + "torch" + x + "," + y,
      type: "torch",
      ...point(x, y),
      color: d.color,
    });
  for (const [x, y] of [
    [14, 35],
    [31, 27],
    [51, 6],
  ])
    objects.push({
      id: prefix + "chest" + x,
      type: "dungeonChest",
      ...point(x, y),
      name: ["Сундук глубин", "Depth chest"],
    });
  // Distinct room furniture, floor mosaics and arena sigils for each depth.
  const chamberNames = {
    crypt: ["Склеп", "Crypt"],
    mine: ["Штольня", "Gallery"],
    abyss: ["Гнездо", "Nest"],
    citadel: ["Рунный зал", "Rune hall"],
  };
  for (const [i, [x, y, w, h]] of [
    [4, 33, 12, 11],
    [4, 17, 12, 12],
    [20, 17, 13, 12],
    [20, 4, 13, 11],
    [38, 4, 16, 13],
    [36, 28, 21, 17],
  ].entries()) {
    objects.push({
      id: prefix + "mosaic" + i,
      type: "dungeonFloor",
      ...point(x + Math.floor(w / 2), y + Math.floor(h / 2)),
      w: (w - 3) * TILE,
      h: (h - 3) * TILE,
      theme: state.id,
      arena: i === 5,
      name: chamberNames[state.id],
    });
    for (let n = 0; n < 3; n++)
      objects.push({
        id: prefix + "decor" + i + "-" + n,
        type: "dungeonDecor",
        ...point(x + 1 + n * 3, y + 1),
        theme: state.id,
        variant: (i + n + state.floor) % 3,
        color: d.color,
      });
  }
  // Side alcoves give floors different silhouettes without blocking the route.
  if (state.id === "crypt") {
    carve(1, 19, 3, 5);
    carve(28, 1, 4, 3);
  }
  if (state.id === "mine") {
    carve(16, 34, 8, 4);
    carve(54, 8, 4, 5);
  }
  if (state.id === "abyss") {
    carve(16, 19, 4, 5);
    carve(39, 17, 5, 4);
  }
  if (state.id === "citadel") {
    carve(33, 20, 6, 5);
    carve(19, 10, 4, 4);
  }
  const spawns = [],
    rooms = [
      [6, 19],
      [22, 19],
      [22, 6],
      [40, 6],
    ];
  rooms.forEach(([x, y], ri) => {
    for (let n = 0; n < 4 + Math.min(2, state.tier); n++)
      spawns.push({
        id: prefix + "mob" + ri + "-" + n,
        type: d.mobs[(ri + n + state.floor) % d.mobs.length],
        ...point(x + 2 + (n % 2) * 5, y + 2 + Math.floor(n / 2) * 3),
        tier:
          Math.max(0, Math.floor(d.level / 4) - 1) +
          state.floor * 0.2 +
          state.tier * 0.35,
        guard: true,
      });
  });
  if (last)
    spawns.push({
      id: prefix + "boss",
      type: d.boss,
      ...point(46, 34),
      boss: true,
      tier: state.tier * 0.35,
      arena: { x: 37 * TILE, y: 29 * TILE, w: 19 * TILE, h: 14 * TILE },
      sleeping: true,
    });
  else
    for (let n = 0; n < 3; n++)
      spawns.push({
        id: prefix + "elite" + n,
        type: d.mobs[n % d.mobs.length],
        ...point(42 + n * 4, 34),
        tier: Math.floor(d.level / 4) + state.floor * 0.3 + state.tier * 0.35,
        elite: true,
      });
  // Obstacles vary between floors but keep entrance, guards and hall connected.
  for (const [i, [x, y]] of [
    [10, 21],
    [26, 20],
    [26, 7],
    [44, 7],
  ].entries()) {
    const yy = y + (state.floor % 2) * 2;
    blocked[yy * WIDTH + x] = 1;
    tiles[yy * WIDTH + x] = 8;
    objects.push({
      id: prefix + "pillar" + i,
      type: "dungeonPillar",
      ...point(x, yy),
      color: d.color,
    });
  }
  for (const [i, [x, y]] of [
    [10, 27],
    [29, 14],
    [49, 13],
  ].entries())
    objects.push({
      id: prefix + "trap" + i,
      type: "dungeonTrap",
      ...point(x, y),
      color: d.color,
    });
  const gates = [];
  for (let y = 22; y <= 23; y++)
    for (let x = 44; x <= 46; x++) {
      blocked[y * WIDTH + x] = 1;
      tiles[y * WIDTH + x] = 8;
      gates.push(y * WIDTH + x);
    }
  objects.push({
    id: prefix + "gate",
    type: "gate",
    ...point(45, 23),
    name: ["Печать зала", "Hall seal"],
  });
  return {
    tiles,
    blocked,
    objects,
    spawns,
    gates,
    gateOpen: false,
    width: WIDTH,
    height: HEIGHT,
    bounds: { width: 60, height: 48 },
    theme: state.id,
    start: point(9, 39),
    getObjectsInRect(x, y, w, h) {
      return objects.filter(
        (o) =>
          o.x >= x - 50 && o.x < x + w + 50 && o.y > y - 70 && o.y < y + h + 70,
      );
    },
    openGate() {
      for (const i of gates) {
        blocked[i] = 0;
        tiles[i] = 9;
      }
      this.gateOpen = true;
    },
  };
}

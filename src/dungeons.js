import { WIDTH, HEIGHT, TILE, point } from "./world.js";
import { dungeons } from "./content.js";
// Each depth is generated anew for every floor and run, with its own architecture:
// the crypt is a catacomb of rectangular vaults, the mine a winding cave of tunnels,
// the abyss an organic warren of round caverns, the citadel a hall of wide straight galleries.
// Every floor keeps the same promise: guards in the rooms, a sealed hall at the end.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashString = (str) => [...str].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261);
const styles = {
  crypt: { rooms: [6, 8], shape: "rect", size: [7, 10], corridor: 2, path: "elbow" },
  mine: { rooms: [5, 7], shape: "blob", size: [3, 5], corridor: 2, path: "winding" },
  abyss: { rooms: [6, 8], shape: "blob", size: [3, 6], corridor: 3, path: "noisy" },
  citadel: { rooms: [4, 6], shape: "rect", size: [9, 12], corridor: 3, path: "straight" },
};
export function createDungeon(state) {
  const d = dungeons[state.id],
    st = styles[state.id] || styles.crypt,
    rng = seeded(hashString(`${state.id}:${state.floor}:${state.runId || 1}`)),
    ri = (a, b) => a + Math.floor(rng() * (b - a + 1)),
    tiles = new Uint8Array(WIDTH * HEIGHT).fill(8),
    blocked = new Uint8Array(WIDTH * HEIGHT).fill(1),
    objects = [],
    prefix = `${state.id}:${state.runId}:${state.floor}:`,
    last = state.floor === d.floors;
  const LIMIT = 34; // everything except the hall stays left of this column
  const floorAt = (x, y) => tiles[y * WIDTH + x] === 9;
  const dig = (x, y) => {
    if (x < 1 || y < 1 || x > LIMIT || y > 46) return;
    tiles[y * WIDTH + x] = 9;
    blocked[y * WIDTH + x] = 0;
  };
  const digFree = (x, y) => {
    tiles[y * WIDTH + x] = 9;
    blocked[y * WIDTH + x] = 0;
  };
  // ---------- Rooms ----------
  const rooms = [],
    overlaps = (r) => rooms.some((o) => r.x - 2 < o.x + o.w && r.x + r.w + 2 > o.x && r.y - 2 < o.y + o.h && r.y + r.h + 2 > o.y);
  const wanted = ri(st.rooms[0], st.rooms[1]);
  // The entrance room sits on the far left.
  const startRoom = { x: 2, y: ri(4, 34), w: 8, h: 8 };
  rooms.push(startRoom);
  for (let tries = 0; tries < 400 && rooms.length < wanted; tries++) {
    const s = st.shape === "rect" ? { w: ri(st.size[0], st.size[1]), h: ri(st.size[0] - 1, st.size[1] - 1) } : { w: ri(st.size[0], st.size[1]) * 2 + 1, h: ri(st.size[0], st.size[1]) * 2 };
    const r = { x: ri(3, LIMIT - s.w - 1), y: ri(2, 45 - s.h), ...s };
    if (!overlaps(r)) rooms.push(r);
  }
  const carveRoom = (r) => {
    if (st.shape === "rect")
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) dig(x, y);
    else {
      // Blob caverns: a few overlapping ellipses with ragged edges.
      const cx = r.x + r.w / 2,
        cy = r.y + r.h / 2;
      for (let k = 0; k < 3; k++) {
        const ox = cx + (rng() - 0.5) * r.w * 0.4,
          oy = cy + (rng() - 0.5) * r.h * 0.4,
          rx = (r.w / 2) * (0.7 + rng() * 0.3),
          ry = (r.h / 2) * (0.7 + rng() * 0.3);
        for (let y = Math.floor(oy - ry); y <= oy + ry; y++)
          for (let x = Math.floor(ox - rx); x <= ox + rx; x++) {
            const dx = (x - ox) / rx,
              dy = (y - oy) / ry;
            if (dx * dx + dy * dy <= 1 - rng() * 0.18) dig(x, y);
          }
      }
      for (let y = Math.floor(cy) - 1; y <= cy + 1; y++) for (let x = Math.floor(cx) - 1; x <= cx + 1; x++) dig(x, y);
    }
  };
  rooms.forEach(carveRoom);
  const centre = (r) => ({ x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) });
  // ---------- Corridors ----------
  const brush = (x, y, w) => {
    for (let dy = 0; dy < w; dy++) for (let dx = 0; dx < w; dx++) dig(x + dx - (w >> 1), y + dy - (w >> 1));
  };
  const connect = (a, b) => {
    let { x, y } = a;
    const w = st.corridor;
    if (st.path === "elbow" || st.path === "straight") {
      const horizontalFirst = rng() < 0.5;
      const stepX = () => {
        while (x !== b.x) {
          brush(x, y, w);
          x += Math.sign(b.x - x);
        }
      };
      const stepY = () => {
        while (y !== b.y) {
          brush(x, y, w);
          y += Math.sign(b.y - y);
        }
      };
      if (horizontalFirst) {
        stepX();
        stepY();
      } else {
        stepY();
        stepX();
      }
      brush(x, y, w);
      return;
    }
    // Winding tunnels and noisy root passages drift towards the target.
    let guard = 0;
    while ((x !== b.x || y !== b.y) && guard++ < 600) {
      brush(x, y, st.path === "noisy" ? w + (rng() < 0.3 ? 1 : 0) : w);
      const r = rng();
      if (r < 0.62) {
        if (Math.abs(b.x - x) > Math.abs(b.y - y)) x += Math.sign(b.x - x);
        else y += Math.sign(b.y - y);
      } else if (r < 0.81) y += rng() < 0.5 ? 1 : -1;
      else x += rng() < 0.5 ? 1 : -1;
      x = Math.max(2, Math.min(LIMIT - 1, x));
      y = Math.max(2, Math.min(45, y));
    }
    brush(b.x, b.y, w);
  };
  // A chain through the rooms ordered from the entrance, plus one loop for a second path.
  const order = [startRoom, ...rooms.slice(1).sort((p, q) => centre(p).x - centre(q).x)];
  for (let i = 1; i < order.length; i++) connect(centre(order[i - 1]), centre(order[i]));
  if (order.length > 3) connect(centre(order[1]), centre(order[order.length - 2]));
  // ---------- The sealed hall ----------
  const hall = { x: 37, y: ri(4, 30), w: 19, h: 14 };
  for (let y = hall.y; y < hall.y + hall.h; y++) for (let x = hall.x; x < hall.x + hall.w; x++) digFree(x, y);
  const lastRoom = order[order.length - 1],
    gateY = hall.y + Math.floor(hall.h / 2),
    from = centre(lastRoom);
  // Corridor from the last room to column 34, then straight into the hall through the gate.
  connect(from, { x: LIMIT - 1, y: gateY });
  for (let x = LIMIT - 1; x < hall.x; x++) for (let dy = -1; dy <= 1; dy++) digFree(x, gateY + dy);
  const gates = [];
  for (const x of [35, 36])
    for (let dy = -1; dy <= 1; dy++) {
      const i = (gateY + dy) * WIDTH + x;
      blocked[i] = 1;
      tiles[i] = 8;
      gates.push(i);
    }
  // ---------- Objects ----------
  const sc = centre(startRoom);
  const start = point(sc.x, sc.y);
  objects.push(
    { id: prefix + "exit", type: "exit", ...point(sc.x - 2, sc.y + 1), name: ["Выход из подземелья", "Dungeon exit"] },
    { id: prefix + "stairs", type: "stairs", ...point(hall.x + hall.w - 3, gateY), name: last ? ["Выход после победы", "Victory exit"] : ["Лестница вниз", "Stairs down"] },
    { id: prefix + "gate", type: "gate", ...point(36, gateY), name: ["Печать зала", "Hall seal"] },
  );
  dig(sc.x - 2, sc.y + 1);
  const chamberNames = { crypt: ["Склеп", "Crypt"], mine: ["Штольня", "Gallery"], abyss: ["Гнездо", "Nest"], citadel: ["Рунный зал", "Rune hall"] };
  const allRooms = [...rooms, hall];
  allRooms.forEach((r, i) => {
    const c = centre(r),
      isHall = r === hall;
    objects.push({ id: prefix + "mosaic" + i, type: "dungeonFloor", ...point(c.x, c.y), w: Math.max(2, r.w - 3) * TILE, h: Math.max(2, r.h - 3) * TILE, theme: state.id, arena: isHall, name: chamberNames[state.id] });
    // Torches on the top wall, decor along it.
    for (const tx of [r.x + 1, r.x + r.w - 2])
      if (floorAt(tx, r.y) || isHall) objects.push({ id: prefix + "torch" + i + "-" + tx, type: "torch", ...point(tx, r.y), color: d.color });
    for (let n = 0; n < 3; n++) {
      const dx = r.x + 2 + n * 3,
        dy = r.y + 1;
      if (floorAt(dx, dy)) objects.push({ id: prefix + "decor" + i + "-" + n, type: "dungeonDecor", ...point(dx, dy), theme: state.id, variant: (i + n + state.floor) % 3, color: d.color });
    }
  });
  // Random floor cell inside a room.
  const cellIn = (r) => {
    for (let t = 0; t < 60; t++) {
      const x = ri(r.x + 1, r.x + r.w - 2),
        y = ri(r.y + 1, r.y + r.h - 2);
      if (floorAt(x, y) && !blocked[y * WIDTH + x]) return { x, y };
    }
    return centre(r);
  };
  const sideRooms = rooms.slice(1);
  // Pillars in big rectangular rooms (inset, never on the room's centre lines).
  sideRooms.forEach((r, i) => {
    if (r.w < 9 || r.h < 8 || st.shape !== "rect") return;
    for (const [px, py] of [[r.x + 2, r.y + 2], [r.x + r.w - 3, r.y + r.h - 3]]) {
      blocked[py * WIDTH + px] = 1;
      tiles[py * WIDTH + px] = 8;
      objects.push({ id: prefix + "pillar" + i + "-" + px, type: "dungeonPillar", ...point(px, py), color: d.color });
    }
  });
  // Chests in a couple of side rooms.
  for (let i = 0; i < Math.min(3, sideRooms.length); i++) {
    const r = sideRooms[(i * 2 + state.floor) % sideRooms.length],
      p = cellIn(r);
    objects.push({ id: prefix + "chest" + i, type: "dungeonChest", ...point(p.x, p.y), name: ["Сундук глубин", "Depth chest"] });
  }
  // Traps on the way: crypt and abyss have more of them.
  const trapCount = state.id === "abyss" || state.id === "crypt" ? 4 : 2;
  for (let i = 0; i < trapCount; i++) {
    const r = sideRooms[(i + state.floor) % Math.max(1, sideRooms.length)];
    if (!r) break;
    const p = cellIn(r);
    objects.push({ id: prefix + "trap" + i, type: "dungeonTrap", ...point(p.x, p.y), color: d.color });
  }
  // ---------- Foes ----------
  const spawns = [],
    roster = d.mobs;
  sideRooms.forEach((r, k) => {
    const n = 3 + Math.min(3, Math.floor((r.w * r.h) / 40)) + Math.min(1, state.tier);
    for (let i = 0; i < n; i++) {
      const p = cellIn(r);
      spawns.push({
        id: prefix + "mob" + k + "-" + i,
        type: roster[Math.floor(rng() * roster.length)],
        ...point(p.x, p.y),
        tier: Math.max(0, Math.floor(d.level / 4) - 1) + state.floor * 0.2 + state.tier * 0.35,
        guard: true,
      });
    }
  });
  const hc = centre(hall);
  if (last)
    spawns.push({ id: prefix + "boss", type: d.boss, ...point(hc.x, hc.y), boss: true, tier: state.tier * 0.35, arena: { x: hall.x * TILE, y: hall.y * TILE, w: hall.w * TILE, h: hall.h * TILE }, sleeping: true });
  else {
    // A champion of the depth guards each lower hall with two elites.
    const champion = d.champions?.[(state.floor - 1) % d.champions.length];
    for (let n = 0; n < 3; n++)
      spawns.push({
        id: prefix + "elite" + n,
        type: n === 0 && champion ? champion : roster[n % roster.length],
        ...point(hall.x + 5 + n * 4, hc.y + (n % 2 ? 3 : -3)),
        tier: Math.floor(d.level / 4) + state.floor * 0.3 + state.tier * 0.35 + (n === 0 ? 0.6 : 0),
        elite: true,
      });
  }
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
    start,
    getObjectsInRect(x, y, w, h) {
      return objects.filter((o) => o.x >= x - 50 && o.x < x + w + 50 && o.y > y - 70 && o.y < y + h + 70);
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

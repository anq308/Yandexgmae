import { TILE, WIDTH, HEIGHT, regionAt } from "./world.js";
import { icon } from "./icons.js";
// Parchment-style world map: textured terrain, fog over unexplored lands and pixel icons.
const PX = 4;
const regionKeys = [];
let regionGrid = null;
function regionIndex() {
  if (regionGrid) return regionGrid;
  regionGrid = new Uint8Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      const key = regionAt(x * TILE + TILE / 2, y * TILE + TILE / 2);
      let i = regionKeys.indexOf(key);
      if (i < 0) i = regionKeys.push(key) - 1;
      regionGrid[y * WIDTH + x] = i;
    }
  return regionGrid;
}
const hash = (x, y) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
const shade = (hex, amount) => {
  const v = parseInt(hex.slice(1), 16);
  return `rgb(${[(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => Math.max(0, Math.min(255, Math.round(c + amount)))).join(",")})`;
};
const baseColors = {
  0: "#8ea56c",
  1: "#d6c08e",
  2: "#4f8b96",
  3: "#b49a6a",
  4: "#d4d9c8",
  5: "#8a958a",
  6: "#dccb9a",
  7: "#6a8f72",
};
const regionTint = {
  forest: "#6f9060",
  amberwood: "#b0a064",
  tundra: "#dfe5e0",
  highlands: "#9aa494",
  deadwood: "#7c8070",
  badlands: "#c8a878",
  marsh: "#6f8a6e",
  coast: "#d8c898",
  island: "#dccb9a",
};
let overviewCache = { key: "", canvas: null };
export function worldOverview(world, season) {
  const key = season + ":" + world.objects.length;
  if (overviewCache.key === key) return overviewCache.canvas;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * PX;
  canvas.height = HEIGHT * PX;
  const c = canvas.getContext("2d"),
    grid = regionIndex();
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      const v = world.tiles[y * WIDTH + x],
        reg = regionKeys[grid[y * WIDTH + x]];
      let col = v === 0 && regionTint[reg] ? regionTint[reg] : baseColors[v] || "#8ea56c";
      if (season === "winter" && v === 0 && !["coast", "island", "badlands"].includes(reg)) col = "#e2e8e4";
      if (season === "autumn" && v === 0 && !["coast", "island", "badlands", "tundra"].includes(reg)) col = "#ad9c62";
      if (season === "winter" && v === 2 && reg !== "coast") col = "#a9c8d4";
      c.fillStyle = shade(col, (hash(x, y) - 0.5) * 14);
      c.fillRect(x * PX, y * PX, PX, PX);
      if (v === 2) {
        // Darker deep water away from shore, light surf along the coastline.
        const shore = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => world.tiles[(y + dy) * WIDTH + x + dx] !== 2);
        c.fillStyle = shore ? "#e6dcb455" : "#1e4a5a30";
        c.fillRect(x * PX, y * PX, PX, PX);
      }
      if (v === 1 || v === 3) {
        c.fillStyle = "#00000018";
        c.fillRect(x * PX, y * PX + PX - 1, PX, 1);
      }
    }
  for (const o of world.objects) {
    const x = (o.x / TILE) * PX,
      y = (o.y / TILE) * PX;
    if (o.type === "tree") {
      const reg = regionKeys[grid[Math.floor(o.y / TILE) * WIDTH + Math.floor(o.x / TILE)]];
      const leaf =
        season === "winter"
          ? "#b8c8c4"
          : season === "autumn" && o.style !== "pine"
            ? "#b4642e"
            : reg === "amberwood"
              ? "#8e6e3a"
              : reg === "deadwood"
                ? "#5a5a48"
                : "#3e6a40";
      c.fillStyle = "#00000040";
      c.fillRect(x - 1, y, 4, 2);
      c.fillStyle = leaf;
      c.fillRect(x - 2, y - 3, 4, 4);
      c.fillStyle = shade(leaf.length === 7 ? leaf : "#3e6a40", 30);
      c.fillRect(x - 2, y - 3, 2, 2);
    } else if (o.type === "rock" || o.type === "ore") {
      c.fillStyle = "#6a6e6a";
      c.fillRect(x - 2, y - 2, 4, 3);
      c.fillStyle = "#a8aca4";
      c.fillRect(x - 2, y - 2, 2, 1);
    } else if (o.type === "house") {
      c.fillStyle = "#00000050";
      c.fillRect(x - 6, y - 2, 13, 5);
      c.fillStyle = o.style === "red" ? "#a85945" : o.style === "green" ? "#4d7968" : "#997251";
      c.fillRect(x - 7, y - 6, 13, 5);
      c.fillStyle = "#e8d8b0";
      c.fillRect(x - 5, y - 1, 9, 3);
    }
  }
  overviewCache = { key, canvas };
  return canvas;
}
let fogCache = { key: "", canvas: null };
// Unexplored regions are covered by dark hatched parchment.
export function fogOverlay(discovered) {
  const key = [...discovered].sort().join(",");
  if (fogCache.key === key) return fogCache.canvas;
  const grid = regionIndex(),
    known = new Set(discovered.map((k) => regionKeys.indexOf(k)));
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * PX;
  canvas.height = HEIGHT * PX;
  const c = canvas.getContext("2d");
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      if (known.has(grid[y * WIDTH + x])) continue;
      c.fillStyle = "#1c1610e0";
      c.fillRect(x * PX, y * PX, PX, PX);
      if ((x + y) % 3 === 0) {
        c.fillStyle = "#3a2e20";
        c.fillRect(x * PX, y * PX, 1, 1);
      }
    }
  fogCache = { key, canvas };
  return canvas;
}
export function isDiscovered(discovered, x, y) {
  const grid = regionIndex(),
    i = grid[Math.floor(y / TILE) * WIDTH + Math.floor(x / TILE)];
  return discovered.includes(regionKeys[i]);
}
const images = {};
export function mapIcon(name) {
  if (!images[name]) {
    const img = new Image();
    img.src =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(icon(name).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" '));
    img.onload = () => document.dispatchEvent(new Event("mapicons"));
    images[name] = img;
  }
  return images[name];
}
// Preload every map icon so the first map draw already has them.
if (typeof document !== "undefined")
  for (const name of ["skull", "ore", "leaf", "crystal", "sun", "lock", "fish", "book", "crown", "essence", "flag", "target", "arrow", "home", "coin"])
    mapIcon(name);
// Pixel icon with a dark backing plate so it reads on any terrain.
export function drawMapIcon(c, name, x, y, size = 16, ring = null) {
  const img = mapIcon(name);
  c.fillStyle = "#0b0806d0";
  c.fillRect(Math.round(x - size / 2 - 2), Math.round(y - size / 2 - 2), size + 4, size + 4);
  if (ring) {
    c.strokeStyle = ring;
    c.lineWidth = 2;
    c.strokeRect(Math.round(x - size / 2 - 2), Math.round(y - size / 2 - 2), size + 4, size + 4);
  }
  if (img.complete) c.drawImage(img, Math.round(x - size / 2), Math.round(y - size / 2), size, size);
}
// Labels avoid each other by nudging upward.
export function labelPlacer(c) {
  const placed = [];
  return (text, x, y, color = "#f2e4c6", bg = "#0b0806c8") => {
    const w = c.measureText(text).width + 10,
      h = 14;
    let ty = y;
    for (let i = 0; i < 6 && placed.some((p) => Math.abs(p.x - x) < (p.w + w) / 2 && Math.abs(p.y - ty) < h); i++) ty -= h;
    placed.push({ x, y: ty, w });
    c.fillStyle = bg;
    c.fillRect(Math.round(x - w / 2), Math.round(ty - h / 2), Math.round(w), h);
    c.fillStyle = color;
    c.fillText(text, Math.round(x), Math.round(ty + 1));
  };
}

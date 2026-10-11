// Pixel sprites drawn from character grids. Each sprite gets an automatic dark outline and
// is cached as an offscreen canvas, so creatures look like hand-made pixel art.
const cache = new Map();
function build(key, rows, palette, outline) {
  if (typeof document === "undefined") return null;
  const h = rows.length,
    w = Math.max(...rows.map((r) => r.length)),
    cv = document.createElement("canvas");
  cv.width = w + 2;
  cv.height = h + 2;
  const c = cv.getContext("2d"),
    filled = (x, y) => y >= 0 && y < h && x >= 0 && x < rows[y].length && rows[y][x] !== "." && rows[y][x] !== " ";
  // Outline first: every empty cell touching a filled one.
  if (outline)
    for (let y = -1; y <= h; y++)
      for (let x = -1; x <= w; x++) {
        if (filled(x, y)) continue;
        if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) {
          c.fillStyle = outline;
          c.fillRect(x + 1, y + 1, 1, 1);
        }
      }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === "." || ch === " ") continue;
      c.fillStyle = palette[ch] || "#ff00ff";
      c.fillRect(x + 1, y + 1, 1, 1);
    }
  cache.set(key, cv);
  return cv;
}
// Draw a sprite with its feet at (x, y). frames: array of row arrays; frame picks one.
export function drawSprite(c, key, frames, palette, x, y, options = {}) {
  const frame = options.frame || 0,
    rows = frames[frame % frames.length],
    id = key + ":" + (frame % frames.length),
    img = cache.get(id) || build(id, rows, palette, options.outline ?? "#1a1210");
  if (!img) return;
  const scale = options.scale || 1,
    w = img.width * scale,
    h = img.height * scale;
  c.save();
  c.translate(Math.round(x), Math.round(y));
  if (options.flip) c.scale(-1, 1);
  if (options.shadow !== false) {
    c.fillStyle = "#00000044";
    c.beginPath();
    c.ellipse(0, 1, w * 0.36, 3.5, 0, 0, Math.PI * 2);
    c.fill();
  }
  if (options.tint) c.filter = options.tint;
  c.drawImage(img, Math.round(-w / 2), Math.round(-h + 2 + (options.lift || 0)), w, h);
  c.restore();
}

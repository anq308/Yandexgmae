import { tr } from "./i18n.js";
// The opening chronicle, painted as cinematic pixel art. Every scene is a stack of cached
// layers at different depths: the camera drifts and near layers slide faster than far ones.
const W = 320,
  H = 180,
  LW = W + 90,
  LH = H + 24,
  DRIFT = 40;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 31.7) * 43758.5453;
  return x - Math.floor(x);
};
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const px = (c, x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
// ---------- Painting helpers ----------
function ditherSky(c, stops, h = LH) {
  const img = c.createImageData(LW, h),
    cols = stops.map(hex),
    n = cols.length - 1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < LW; x++) {
      const t = (y / h) * n,
        i = Math.min(n - 1, Math.floor(t)),
        pick = (t - i) * 16 > bayer(x, y) ? cols[i + 1] : cols[i],
        o = (y * LW + x) * 4;
      img.data[o] = pick[0];
      img.data[o + 1] = pick[1];
      img.data[o + 2] = pick[2];
      img.data[o + 3] = 255;
    }
  c.putImageData(img, 0, 0);
}
function glow(c, x, y, r, rgba) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba);
  g.addColorStop(1, rgba.replace(/[\d.]+\)$/, "0)"));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}
function disc(c, x, y, r, col) {
  c.fillStyle = col;
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.round(Math.sqrt(r * r - dy * dy));
    c.fillRect(Math.round(x - w), Math.round(y + dy), w * 2, 1);
  }
}
// A puffy cloud: a shaded underside and a lit crown.
function cloud(c, x, y, w, lit, shade) {
  const n = Math.max(3, Math.round(w / 7));
  for (let i = 0; i < n; i++) {
    const r = 4 + Math.round(hash(x + i * 13) * 4) + (i > 0 && i < n - 1 ? 2 : 0);
    disc(c, x + i * (w / n), y + 1, r, shade);
  }
  for (let i = 0; i < n; i++) {
    const r = 3 + Math.round(hash(x + i * 13) * 4) + (i > 0 && i < n - 1 ? 2 : 0);
    disc(c, x + i * (w / n) - 1, y - 1, r, lit);
  }
  px(c, x - 6, y + 4, w + 6, 2, shade);
}
const smoothRidge = (x, o) => o.base - Math.abs(Math.sin(x * 0.013 * o.freq + o.seed)) * o.amp - Math.abs(Math.sin(x * 0.037 * o.freq + o.seed * 1.7)) * o.amp * 0.42;
// A mountain range: lit and shadowed faces with a dithered seam, ragged snow and haze at the foot.
function mountains(c, o) {
  o = { freq: 1, hazeH: 26, ...o };
  for (let x = 0; x < LW; x++) {
    const y = Math.round(smoothRidge(x, o) + Math.sin(x * 0.5 + o.seed) * 0.8),
      slope = smoothRidge(x + 3, o) - smoothRidge(x - 3, o);
    for (let yy = y; yy < LH; yy++) {
      // Faces split along the slope; near the seam the two colours dither together.
      const k = Math.max(-1, Math.min(1, slope / 2.5)),
        lit = (k + 1) * 8 < bayer(x, yy) + 0.5 ? true : k < 0;
      let col = slope < -0.4 ? o.col : slope > 0.4 ? o.shade : lit ? o.col : o.shade;
      const line = o.base - o.amp * 0.74 + Math.sin(x * 0.7 + o.seed) * 2 + Math.sin(x * 0.19) * 2;
      if (o.snow && yy < line && yy - y < (line - y) * 0.8 + 1) col = slope > 0.4 ? o.snowShade : o.snow;
      c.fillStyle = col;
      c.fillRect(x, yy, 1, 1);
    }
  }
  if (o.haze) {
    // Air between the ranges: a soft veil rising from the foot of the mountains.
    const [r, g, b] = hex(o.haze),
      grad = c.createLinearGradient(0, o.base - o.hazeH * 1.6, 0, o.base + 6);
    grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0.85)`);
    c.save();
    c.globalCompositeOperation = "source-atop";
    c.fillStyle = grad;
    c.fillRect(0, 0, LW, LH);
    c.restore();
  }
}
// Rolling hills with a lighter rim of grass.
function hills(c, base, amp, seed, col, rim, freq = 1) {
  for (let x = 0; x < LW; x++) {
    const y = Math.round(base - Math.abs(Math.sin(x * 0.02 * freq + seed)) * amp - Math.sin(x * 0.06 + seed) * amp * 0.2);
    px(c, x, y, 1, LH - y, col);
    px(c, x, y, 1, 1, rim);
  }
}
// A belt of pines; lit on one side.
function pines(c, base, col, lit, seed, gap = 7, tall = 18) {
  px(c, 0, base, LW, LH - base, col);
  for (let x = -8; x < LW + 8; x += gap) {
    const h = tall * (0.6 + hash(x + seed) * 0.7),
      cx = x + hash(x * 3 + seed) * 4;
    for (let k = 0; k < h; k++) {
      const half = Math.max(0.5, (k / h) * (h / 3.2)) + (k % 4 === 3 ? 1 : 0),
        yy = Math.round(base - h + k);
      px(c, cx - half, yy, Math.round(half * 2) + 1, 1, col);
      if (lit && k % 4 !== 0) px(c, cx - half, yy, 1, 1, lit);
    }
  }
}
// Foreground grass and flowers, dark against the scene.
function grass(c, base, col, seed, flowers) {
  px(c, 0, base, LW, LH - base, col);
  for (let x = 0; x < LW; x += 2) {
    const h = 3 + hash(x + seed) * 9,
      lean = (hash(x * 7 + seed) - 0.5) * 4;
    for (let k = 0; k < h; k++) px(c, x + (lean * k) / h, base - k, 1, 1, col);
    if (flowers && hash(x * 5 + seed) > 0.93) px(c, x + lean, base - h - 1, 2, 2, flowers[Math.floor(hash(x) * flowers.length)]);
  }
}
// An overhanging branch of leaves entering from a top corner.
function branch(c, x, y, dir, col, lit) {
  for (let i = 0; i < 9; i++) {
    const bx = x + dir * i * 9,
      by = y + i * i * 0.5;
    disc(c, bx, by, 9 - i * 0.6, col);
    if (lit) px(c, bx - 3, by + 4, 3, 1, lit);
  }
  px(c, x - 10 * dir, y - 2, 30, 3, col);
}
// Soft shafts of light falling from a source.
function rays(c, x, y, t, rgb, count = 6, len = 200) {
  c.save();
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < count; i++) {
    const a = Math.PI / 2 + (i - (count - 1) / 2) * 0.22 + Math.sin(t * 0.3 + i) * 0.04,
      w = 0.05 + hash(i) * 0.05,
      g = c.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.addColorStop(0, `rgba(${rgb},${0.13 + Math.sin(t * 0.8 + i * 2) * 0.05})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a - w) * len, y + Math.sin(a - w) * len);
    c.lineTo(x + Math.cos(a + w) * len, y + Math.sin(a + w) * len);
    c.fill();
  }
  c.restore();
}
// Drifting motes: pollen, sparks or ash.
function motes(c, t, n, col, fall, seed = 0) {
  for (let i = 0; i < n; i++) {
    const k = (t * (0.05 + hash(i + seed) * 0.06) + hash(i * 3 + seed)) % 1,
      x = hash(i * 7 + seed) * LW + Math.sin(t * 0.8 + i) * 8,
      y = fall ? k * LH : LH - k * LH;
    c.globalAlpha = Math.sin(k * Math.PI);
    px(c, x, y, 1, 1, col);
  }
  c.globalAlpha = 1;
}
// A hero in silhouette with a wind-blown cloak, pauldrons and a rim of light on the lit side.
function figure(c, x, y, s, o, t) {
  const face = o.face || 1,
    wave = Math.sin(t * 2.4 + (o.phase || 0)),
    body = o.color || "#14101c",
    rim = o.rim;
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(face * s, s);
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(-3, -26);
  c.lineTo(3, -26);
  c.lineTo(4, -4);
  c.quadraticCurveTo(-8, -2 + wave, -17 - wave * 3, -1 + wave);
  c.lineTo(-13 - wave * 2, -8);
  c.lineTo(-10, -16 + wave);
  c.closePath();
  c.fill();
  c.fillRect(-6, -26, 12, 3);
  c.fillRect(-4, -23, 8, 8);
  c.fillRect(-5, -15, 10, 2);
  c.fillRect(-4, -13, 8, 3);
  c.fillRect(-4, -10, 3, 10);
  c.fillRect(1, -10, 3, 10);
  c.fillRect(-5, -1, 4, 1);
  c.fillRect(1, -1, 4, 1);
  c.fillRect(-1, -28, 3, 2);
  disc(c, 0, -31, 3, body);
  if (o.hood) {
    c.beginPath();
    c.moveTo(-4, -29);
    c.lineTo(-1, -39);
    c.lineTo(4, -29);
    c.fill();
  } else c.fillRect(-4, -34, 7, 2);
  // Arm and weapon.
  if (o.weapon === "sword") {
    c.fillRect(4, -24, 3, 9);
    c.fillRect(5, -40, 2, 25);
    c.fillRect(2, -17, 8, 2);
  } else if (o.weapon === "staff") {
    c.fillRect(4, -24, 3, 9);
    c.fillRect(7, -46, 2, 46);
    c.fillRect(5, -48, 6, 3);
  } else if (o.weapon === "palm") {
    c.fillRect(4, -26, 3, 3);
    c.fillRect(6, -34, 3, 9);
  } else c.fillRect(4, -24, 3, 10);
  if (rim) {
    c.fillStyle = rim;
    c.fillRect(2, -33, 1, 4);
    c.fillRect(3, -31, 1, 2);
    c.fillRect(5, -26, 1, 2);
    c.fillRect(3, -23, 1, 8);
    c.fillRect(4, -13, 1, 3);
    c.fillRect(3, -10, 1, 10);
    if (o.weapon === "sword") c.fillRect(6, -40, 1, 22);
    else if (o.weapon === "staff") c.fillRect(8, -46, 1, 44);
    else if (o.weapon === "palm") c.fillRect(8, -34, 1, 8);
  }
  c.restore();
  if (o.weaponGlow) {
    const gx = x + (o.weapon === "staff" ? 8 : 6) * face * s,
      gy = y - (o.weapon === "staff" ? 47 : 40) * s;
    glow(c, gx, gy, (16 + Math.sin(t * 3) * 2) * s, o.weaponGlow);
  }
}
function house(c, x, y, roof = "#5a2a24", wall = "#3a2a2a") {
  px(c, x, y - 9, 13, 9, wall);
  c.fillStyle = roof;
  c.beginPath();
  c.moveTo(x - 2, y - 9);
  c.lineTo(x + 6.5, y - 16);
  c.lineTo(x + 15, y - 9);
  c.fill();
  px(c, x + 9, y - 16, 2, 4, wall);
  px(c, x + 5, y - 4, 3, 4, "#1a1210");
}
function windows(c, x, y, t) {
  const on = Math.sin(t * 3 + x) > -0.85 ? "#ffcf6a" : "#c8903a";
  px(c, x + 2, y - 7, 2, 2, on);
  px(c, x + 9, y - 7, 2, 2, on);
  glow(c, x + 6, y - 6, 9, "rgba(255,190,90,0.25)");
}
function smoke(c, x, y, t) {
  for (let i = 0; i < 6; i++) {
    const k = (t * 0.22 + i / 6) % 1;
    c.globalAlpha = (1 - k) * 0.35;
    disc(c, x + Math.sin(k * 6 + i) * 3 + k * 10, y - k * 34, 1 + k * 3, "#d0c8c0");
  }
  c.globalAlpha = 1;
}
function obelisk(c, x, y, col = "#2a2a36", lit = "#4a4a5a") {
  px(c, x - 3, y - 2, 7, 2, col);
  px(c, x - 2, y - 20, 5, 18, col);
  px(c, x - 1, y - 23, 3, 3, col);
  px(c, x - 2, y - 20, 1, 18, lit);
}
function obeliskLight(c, x, y, t, strength = 1) {
  const beam = c.createLinearGradient(0, y - 110, 0, y - 18);
  beam.addColorStop(0, "rgba(255,224,138,0)");
  beam.addColorStop(1, `rgba(255,224,138,${0.5 * strength})`);
  c.fillStyle = beam;
  c.fillRect(x - 1, y - 110, 3, 92);
  glow(c, x, y - 14, 20 + Math.sin(t * 3) * 2, `rgba(255,214,120,${0.5 * strength})`);
  c.fillStyle = `rgba(255,240,180,${0.95 * strength})`;
  c.fillRect(x, y - 18, 1, 13);
  c.fillRect(x - 1, y - 14, 3, 1);
}
// ---------- Scenes: layers from far (depth 0) to near (depth > 1) ----------
const sceneDefs = [
  {
    // Dawn over the valley of Elderia.
    layers: [
      {
        depth: 0.05,
        paint(c) {
          ditherSky(c, ["#1e2050", "#4a3e80", "#9a5a88", "#e48a7a", "#fcc890"]);
          glow(c, 186, 70, 110, "rgba(255,214,150,0.55)");
          disc(c, 186, 70, 13, "#fff4d0");
          disc(c, 186, 70, 10, "#fffbea");
        },
        animate(c, t) {
          for (let i = 0; i < 4; i++) {
            const x = ((t * (2 + i) + i * 120) % (LW + 120)) - 80;
            cloud(c, x, 30 + i * 12, 34 + i * 8, "#f8c8c0", "#b87a98");
          }
          rays(c, 186, 70, t, "255,220,160", 7, 220);
        },
      },
      { depth: 0.18, paint: (c) => mountains(c, { base: 128, amp: 70, seed: 1.1, col: "#7a74a8", shade: "#5a5488", snow: "#f2eefa", snowShade: "#b8b4d8", haze: "#c890a0", hazeH: 34 }) },
      { depth: 0.35, paint: (c) => mountains(c, { base: 146, amp: 44, seed: 2.6, freq: 1.4, col: "#566a92", shade: "#40507a", snow: "#dfe6f2", snowShade: "#a8b4cc", haze: "#8a8aa8", hazeH: 24 }) },
      {
        depth: 0.6,
        paint(c) {
          hills(c, 160, 16, 4.1, "#2e4e3e", "#4a7050", 1.3);
          pines(c, 170, "#1e3a2c", "#2e5038", 3, 6, 16);
          obelisk(c, 112, 158);
          obelisk(c, 316, 150);
          for (let y = 160; y < LH; y++) {
            const cx = 230 + Math.sin(y * 0.16) * 16 + (y - 160) * 0.9,
              w = Math.round((y - 156) * 0.6) + 2;
            px(c, cx - w / 2, y, w, 1, "#6a9ad0");
            px(c, cx - w / 2, y, 1, 1, "#9ac0e8");
          }
          for (const x of [164, 180, 196, 212]) house(c, x, 176 + (x % 3));
        },
        animate(c, t) {
          obeliskLight(c, 112, 158, t);
          obeliskLight(c, 316, 150, t + 1, 0.9);
          for (const x of [164, 180, 196, 212]) windows(c, x, 176 + (x % 3), t);
          smoke(c, 173, 160, t);
          smoke(c, 205, 162, t + 1.7);
          for (let y = 178; y < LH; y += 3) px(c, 234 + (y - 160) * 0.9 + Math.sin(t * 2 + y) * 3, y, 4, 1, "#fff0d0");
          for (let i = 0; i < 6; i++) {
            const bx = ((t * 16 + i * 37) % (LW + 40)) - 20,
              by = 70 + Math.sin(t * 2 + i) * 4 + i * 5,
              f = Math.sin(t * 9 + i) > 0 ? 1 : 0;
            px(c, bx - 2, by - f, 2, 1, "#2a2040");
            px(c, bx, by, 1, 1, "#2a2040");
            px(c, bx + 1, by - f, 2, 1, "#2a2040");
          }
        },
      },
      {
        depth: 1.3,
        paint(c) {
          grass(c, 198, "#0e1a14", 5, ["#e86a6a", "#f0d070", "#c8a0f0"]);
        },
        animate: (c, t) => motes(c, t, 26, "#ffe8b0", false, 3),
      },
    ],
  },
  {
    // Two brothers on a cliff above a sea of clouds: gold dawn and violet dusk.
    layers: [
      {
        depth: 0.05,
        paint(c) {
          ditherSky(c, ["#120a26", "#3a1e52", "#7a3a66", "#d47a5a", "#f6c27a"]);
          glow(c, 160, 150, 120, "rgba(255,200,120,0.45)");
          glow(c, 260, 120, 100, "rgba(160,100,255,0.35)");
          glow(c, 200, 112, 60, "rgba(255,226,160,0.5)");
          disc(c, 200, 112, 18, "#ffe2a0");
          disc(c, 200, 112, 15, "#fff2c8");
        },
        animate(c, t) {
          for (let i = 0; i < 3; i++) {
            const x = ((t * (1.5 + i) + i * 150) % (LW + 120)) - 80;
            px(c, x, 40 + i * 16, 60 + i * 20, 2, "rgba(255,190,160,0.35)");
            px(c, x + 14, 38 + i * 16, 30, 2, "rgba(255,210,180,0.3)");
          }
          rays(c, 200, 112, t, "255,210,150", 5, 160);
        },
      },
      { depth: 0.2, paint: (c) => mountains(c, { base: 150, amp: 34, seed: 0.8, freq: 1.2, col: "#4a2e5a", shade: "#36224a", haze: "#9a5a72", hazeH: 20 }) },
      {
        depth: 0.45,
        paint(c) {
          for (let i = 0; i < 16; i++) cloud(c, i * 28 - 10, 158 + (i % 3) * 3, 30, "#e8a090", "#9a5a78");
          px(c, 0, 164, LW, LH - 164, "#9a5a78");
        },
      },
      {
        depth: 1,
        paint(c) {
          c.fillStyle = "#140c1a";
          c.beginPath();
          c.moveTo(70, LH);
          c.lineTo(96, 168);
          c.lineTo(130, 160);
          c.lineTo(200, 158);
          c.lineTo(258, 162);
          c.lineTo(286, 176);
          c.lineTo(300, LH);
          c.fill();
          for (let i = 0; i < 40; i++) px(c, 100 + hash(i) * 180, 166 + hash(i + 9) * 30, 3 + hash(i + 2) * 6, 1, "#22162a");
          for (let x = 104; x < 280; x += 2) px(c, x, 159 + Math.round(Math.abs(x - 200) * 0.05) - Math.round(hash(x) * 2), 1, 2, "#2a1e36");
        },
        animate(c, t) {
          glow(c, 156, 130, 44, "rgba(255,210,120,0.22)");
          glow(c, 246, 130, 44, "rgba(170,110,255,0.22)");
          figure(c, 172, 160, 1.25, { face: 1, weapon: "sword", rim: "#ffe08a", weaponGlow: "rgba(255,224,138,0.75)", color: "#1a1420" }, t);
          figure(c, 228, 160, 1.25, { face: -1, weapon: "staff", hood: true, rim: "#c8a8ff", weaponGlow: "rgba(180,130,255,0.75)", color: "#140e1c", phase: 1.3 }, t);
          for (let i = 0; i < 30; i++) {
            const k = (t * 0.18 + hash(i)) % 1,
              left = i % 2 === 0,
              x = (left ? 130 : 210) + hash(i + 3) * 60 + Math.sin(t + i) * 4;
            c.globalAlpha = 1 - k;
            px(c, x, 160 - k * 120, 1, 1, left ? "#ffe0a0" : "#c8a8ff");
          }
          c.globalAlpha = 1;
        },
      },
      {
        depth: 1.35,
        paint(c) {
          for (const [x0, dir] of [[0, 1], [LW, -1]]) {
            c.fillStyle = "#08050c";
            c.beginPath();
            c.moveTo(x0, LH);
            c.lineTo(x0, 150);
            c.lineTo(x0 + dir * 30, 170);
            c.lineTo(x0 + dir * 50, LH);
            c.fill();
          }
        },
        animate: (c, t) => motes(c, t, 14, "#ffd8a0", false, 8),
      },
    ],
  },
  {
    // The eclipse: Ardan raises his blade inside the seal, and chains of light bind the dark.
    layers: [
      {
        depth: 0.04,
        paint(c) {
          ditherSky(c, ["#030208", "#0c0818", "#1a102c", "#341a38", "#4a2234"]);
          for (let i = 0; i < 120; i++) px(c, hash(i + 1) * LW, hash(i + 2) * 130, 1, 1, hash(i) > 0.85 ? "#fff4d8" : "#7a74a0");
        },
        animate(c, t) {
          const cx = 200,
            cy = 62;
          glow(c, cx, cy, 70, "rgba(255,200,130,0.28)");
          for (let i = 0; i < 36; i++) {
            const a = (i / 36) * Math.PI * 2 + t * 0.04,
              len = 24 + hash(i) * 18 + Math.sin(t * 2 + i) * 3;
            c.strokeStyle = i % 3 ? "rgba(255,226,150,0.45)" : "rgba(255,250,220,0.7)";
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20);
            c.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
            c.stroke();
          }
          disc(c, cx, cy, 20, "#fff0c0");
          disc(c, cx + 1, cy, 19, "#05030a");
          px(c, cx - 19, cy - 2, 1, 4, "#fffbe8");
        },
      },
      { depth: 0.2, paint: (c) => mountains(c, { base: 150, amp: 36, seed: 3.3, freq: 1.1, col: "#1a1226", shade: "#120c1c", haze: "#2a1630", hazeH: 16 }) },
      {
        depth: 0.55,
        paint(c) {
          px(c, 0, 162, LW, LH - 162, "#0e0914");
          // Ruined colonnade on the horizon.
          for (let i = 0; i < 9; i++) {
            const x = 40 + i * 42,
              h = 12 + hash(i) * 18;
            px(c, x, 162 - h, 5, h, "#1c1426");
            px(c, x - 1, 162 - h, 7, 2, "#1c1426");
          }
        },
      },
      {
        depth: 0.85,
        paint(c) {
          px(c, 0, 176, LW, LH - 176, "#0a060e");
        },
        animate(c, t) {
          const cx = 205,
            cy = 184;
          c.save();
          c.translate(cx, cy);
          c.scale(1, 0.3);
          c.globalCompositeOperation = "lighter";
          c.strokeStyle = `rgba(190,150,255,${0.55 + Math.sin(t * 2) * 0.2})`;
          c.lineWidth = 3;
          for (const r of [66, 50]) {
            c.beginPath();
            c.arc(0, 0, r, 0, Math.PI * 2);
            c.stroke();
          }
          c.rotate(t * 0.25);
          c.lineWidth = 2;
          for (const off of [0, Math.PI / 6]) {
            c.beginPath();
            for (let i = 0; i <= 3; i++) {
              const a = (i / 3) * Math.PI * 2 + off;
              c.lineTo(Math.cos(a) * 50, Math.sin(a) * 50);
            }
            c.stroke();
          }
          c.restore();
          // The pillar of light from the raised blade.
          const g = c.createLinearGradient(0, 0, 0, cy - 40);
          g.addColorStop(0, "rgba(255,230,160,0)");
          g.addColorStop(1, `rgba(255,230,160,${0.5 + Math.sin(t * 4) * 0.1})`);
          c.fillStyle = g;
          c.fillRect(cx + 5, 0, 3, cy - 40);
          // Four chains of light from the depths to the seal.
          c.save();
          c.globalCompositeOperation = "lighter";
          for (const [x, y] of [[60, 128], [350, 126], [96, LH], [316, LH]]) {
            for (const [w, col] of [[4, "rgba(255,200,110,0.18)"], [2, "rgba(255,224,150,0.45)"], [1, "rgba(255,248,220,0.9)"]]) {
              c.strokeStyle = col;
              c.lineWidth = w;
              c.beginPath();
              for (let i = 0; i <= 20; i++) {
                const a = i / 20;
                c.lineTo(x + (cx - x) * a, y + (cy - y) * a - Math.sin(a * Math.PI) * 10 + Math.sin(a * 18 - t * 6) * 1.2);
              }
              c.stroke();
            }
            glow(c, x, y, 12, "rgba(255,224,138,0.8)");
          }
          c.restore();
          figure(c, cx, cy, 1.2, { face: 1, weapon: "sword", rim: "#ffe8a0", weaponGlow: "rgba(255,236,170,0.9)", color: "#0c0810" }, t);
          glow(c, cx, cy - 20, 40, "rgba(200,160,255,0.18)");
        },
      },
      {
        depth: 1.3,
        paint(c) {
          for (const [x, h, w] of [[8, 120, 20], [372, 90, 22]]) {
            px(c, x, LH - h, w, h, "#050308");
            px(c, x - 3, LH - h, w + 6, 4, "#050308");
            px(c, x + w - 4, LH - h - 6, 6, 6, "#050308");
          }
        },
        animate: (c, t) => motes(c, t, 40, "#9a90b0", true, 4),
      },
    ],
  },
  {
    // A hundred years of silence: fog, a dying obelisk, red eyes and the Ashen procession.
    layers: [
      {
        depth: 0.04,
        paint(c) {
          ditherSky(c, ["#06080f", "#0e1420", "#18202e", "#262e3a"]);
          for (let i = 0; i < 60; i++) px(c, hash(i + 7) * LW, hash(i + 8) * 90, 1, 1, hash(i) > 0.8 ? "#c8d0e0" : "#4a5468");
          glow(c, 80, 40, 40, "rgba(190,200,230,0.25)");
          disc(c, 80, 40, 10, "#d8dce8");
          disc(c, 84, 37, 9, "#0e1420");
        },
        animate(c, t) {
          for (let i = 0; i < 3; i++) {
            const x = ((t * (3 + i) + i * 140) % (LW + 120)) - 80;
            cloud(c, x, 50 + i * 10, 40, "#2a3242", "#1c2430");
          }
        },
      },
      { depth: 0.2, paint: (c) => mountains(c, { base: 128, amp: 28, seed: 5.1, freq: 1.4, col: "#1a2230", shade: "#141a26", haze: "#262e3a", hazeH: 18 }) },
      { depth: 0.45, paint: (c) => pines(c, 150, "#111822", null, 9, 8, 30) },
      {
        depth: 0.75,
        paint(c) {
          pines(c, 170, "#0a0f16", null, 21, 13, 46);
          px(c, 160, 168, 90, 40, "#0a0f16");
          obelisk(c, 210, 166, "#1e2230", "#2c3242");
        },
        animate(c, t) {
          const flicker = Math.sin(t * 7) > 0.55 || Math.sin(t * 13) > 0.9 ? 0.55 : 0.1;
          obeliskLight(c, 210, 166, t, flicker);
          for (let i = 0; i < 7; i++) {
            if (Math.sin(t * 1.5 + i * 2.3) < -0.4) continue;
            const ex = 30 + i * 50,
              ey = 150 + (i % 3) * 6;
            px(c, ex, ey, 2, 1, "#ff3a2a");
            px(c, ex + 4, ey, 2, 1, "#ff3a2a");
            glow(c, ex + 3, ey, 5, "rgba(255,60,40,0.35)");
          }
          for (let i = 0; i < 5; i++) {
            const x = 250 + i * 20 - ((t * 3) % 20),
              y = 184,
              bob = Math.abs(Math.sin(t * 3 + i)) * 1;
            figure(c, x, y - bob, 0.9, { face: -1, hood: true, color: "#2a2630", rim: "#c8743a", phase: i }, t);
            glow(c, x - 6, y - 30, 12 + Math.sin(t * 9 + i) * 2, "rgba(255,140,60,0.55)");
            px(c, x - 7, y - 32, 2, 3, "#ffb050");
            px(c, x - 7, y - 33, 1, 1, "#fff0a0");
          }
        },
      },
      {
        depth: 1.3,
        paint(c) {
          px(c, 0, 196, LW, LH - 196, "#030508");
          for (const [x, dir] of [[0, 1], [LW, -1]]) {
            c.strokeStyle = "#030508";
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(x, 0);
            c.quadraticCurveTo(x + dir * 30, 30, x + dir * 60, 26);
            c.moveTo(x + dir * 30, 18);
            c.lineTo(x + dir * 40, 4);
            c.moveTo(x, 60);
            c.quadraticCurveTo(x + dir * 20, 70, x + dir * 34, 90);
            c.stroke();
          }
        },
        animate(c, t) {
          for (let i = 0; i < 5; i++) {
            const x = ((t * (5 + i * 3) + i * 100) % (LW + 200)) - 140;
            c.fillStyle = "rgba(150,165,190,0.1)";
            c.beginPath();
            c.ellipse(x, 168 + i * 8, 120, 8, 0, 0, Math.PI * 2);
            c.fill();
          }
        },
      },
    ],
  },
  {
    // The storm, the wreck — and you, rising on the shore with the Mark of Dawn.
    layers: [
      {
        depth: 0.05,
        paint(c) {
          ditherSky(c, ["#10141e", "#1e2636", "#343e52", "#545c6e", "#6a6e7c"]);
        },
        animate(c, t) {
          const flash = Math.sin(t * 1.3) > 0.96;
          for (let i = 0; i < 6; i++) {
            const x = ((t * (4 + i) + i * 90) % (LW + 140)) - 90;
            cloud(c, x, 20 + i * 12, 60, flash ? "#8a94b0" : "#3a4458", "#232a3a");
          }
          if (flash) {
            c.strokeStyle = "#f0f4ff";
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(300, 30);
            c.lineTo(292, 60);
            c.lineTo(302, 74);
            c.lineTo(290, 118);
            c.stroke();
            glow(c, 296, 80, 60, "rgba(210,220,255,0.3)");
          }
        },
      },
      {
        depth: 0.35,
        paint(c) {
          px(c, 0, 124, LW, 40, "#1e2e40");
          for (let i = 0; i < 60; i++) px(c, hash(i) * LW, 126 + hash(i + 1) * 30, 8, 1, "#2e4258");
          // The broken ship, listing in the surf.
          c.fillStyle = "#120e12";
          c.beginPath();
          c.moveTo(262, 136);
          c.lineTo(330, 124);
          c.lineTo(322, 138);
          c.lineTo(270, 142);
          c.fill();
          c.save();
          c.translate(296, 130);
          c.rotate(-0.25);
          c.fillRect(-1, -46, 3, 46);
          c.fillRect(-12, -38, 26, 2);
          c.beginPath();
          c.moveTo(2, -36);
          c.lineTo(18, -24);
          c.lineTo(4, -16);
          c.fill();
          c.restore();
        },
        animate(c, t) {
          for (let i = 0; i < 6; i++) {
            const y = 126 + i * 5,
              off = (t * (10 + i * 4) + i * 50) % 60;
            for (let x = -60 + off; x < LW; x += 60) px(c, x, y, 16, 1, "rgba(200,220,240,0.35)");
          }
        },
      },
      {
        depth: 0.8,
        paint(c) {
          c.fillStyle = "#c2b08a";
          c.beginPath();
          c.moveTo(0, 168);
          c.quadraticCurveTo(200, 152, LW, 164);
          c.lineTo(LW, LH);
          c.lineTo(0, LH);
          c.fill();
          px(c, 0, 186, LW, LH - 186, "#a8966e");
          for (let i = 0; i < 90; i++) px(c, hash(i) * LW, 166 + hash(i + 4) * 36, 2, 1, i % 2 ? "#9a8862" : "#d0c09a");
          for (const [x, y, w] of [[230, 172, 18], [110, 180, 10], [276, 184, 4]]) px(c, x, y, w, 2, "#3a2a22");
        },
        animate(c, t) {
          const surf = Math.sin(t * 1.2) * 6;
          c.fillStyle = "rgba(160,190,210,0.5)";
          c.beginPath();
          c.moveTo(0, 162 + surf * 0.2);
          c.quadraticCurveTo(200, 150 + surf * 0.4, LW, 160 + surf * 0.2);
          c.lineTo(LW, 155);
          c.lineTo(0, 155);
          c.fill();
          px(c, 0, 161 + surf * 0.2, LW, 1, "rgba(240,248,255,0.7)");
          // The hero rising, the Mark burning on the raised palm.
          const pulse = 0.6 + Math.sin(t * 3) * 0.3,
            hx = 180,
            hy = 182;
          figure(c, hx, hy, 1.15, { face: 1, weapon: "palm", rim: "#ffe0a0", color: "#1a161e", phase: 0.6 }, t);
          glow(c, hx + 9, hy - 40, 34, `rgba(255,214,120,${pulse * 0.6})`);
          px(c, hx + 8, hy - 41, 3, 3, "#fff4c0");
          for (let i = 0; i < 12; i++) {
            const k = (t * 0.5 + hash(i)) % 1;
            c.globalAlpha = 1 - k;
            px(c, hx + 9 + Math.sin(i * 2 + t) * 8 * k, hy - 42 - k * 28, 1, 1, "#ffe8a0");
          }
          c.globalAlpha = 1;
          // Reflection of the light on the wet sand.
          c.fillStyle = `rgba(255,220,150,${pulse * 0.15})`;
          c.fillRect(hx - 10, hy + 1, 30, 2);
        },
      },
      {
        depth: 1.3,
        paint(c) {
          c.fillStyle = "#0c0a0c";
          c.beginPath();
          c.moveTo(0, LH);
          c.lineTo(0, 170);
          c.lineTo(20, 166);
          c.lineTo(46, 178);
          c.lineTo(60, LH);
          c.fill();
          px(c, 340, 192, 70, 4, "#0c0a0c");
          px(c, 356, 184, 4, 12, "#0c0a0c");
        },
        animate(c, t) {
          for (let i = 0; i < 90; i++) {
            const k = (t * 1.8 + hash(i)) % 1;
            c.fillStyle = "rgba(200,215,235,0.45)";
            c.fillRect(Math.round(hash(i + 2) * LW + k * 30 - 30), Math.round(k * LH), 1, 5);
          }
        },
      },
    ],
  },
  {
    // Sunrise on the road to Leafhaven.
    layers: [
      {
        depth: 0.05,
        paint(c) {
          ditherSky(c, ["#2e4e92", "#7a86c0", "#e2a6a0", "#fcd094", "#fff2c8"]);
          glow(c, 150, 62, 120, "rgba(255,232,170,0.6)");
          disc(c, 150, 62, 14, "#fff6d8");
          disc(c, 150, 62, 11, "#fffdf0");
        },
        animate(c, t) {
          for (let i = 0; i < 4; i++) {
            const x = ((t * (2 + i) + i * 110) % (LW + 120)) - 80;
            cloud(c, x, 28 + i * 13, 40 + i * 6, "#fff0e8", "#c8a8c8");
          }
          rays(c, 150, 62, t, "255,236,190", 7, 200);
        },
      },
      { depth: 0.18, paint: (c) => mountains(c, { base: 132, amp: 48, seed: 1.9, col: "#8a90c0", shade: "#6a70a2", snow: "#f8f6fc", snowShade: "#c4c4dc", haze: "#d8b0b0", hazeH: 28 }) },
      {
        depth: 0.4,
        paint(c) {
          hills(c, 156, 20, 3.3, "#5a7a5a", "#7a9a6a", 1.6);
          for (const [x, y] of [[178, 156], [194, 154], [210, 157]]) house(c, x, y, "#7a3a2a", "#5a4038");
          obelisk(c, 252, 146, "#3a3a4a", "#5a5a6e");
        },
        animate(c, t) {
          for (const [x, y] of [[178, 156], [194, 154], [210, 157]]) windows(c, x, y, t);
          smoke(c, 189, 140, t);
          obeliskLight(c, 252, 146, t, 0.85);
        },
      },
      {
        depth: 0.75,
        paint(c) {
          px(c, 0, 168, LW, LH - 168, "#4a6e3a");
          for (let i = 0; i < 80; i++) px(c, hash(i) * LW, 170 + hash(i + 3) * 34, 3, 1, "#5a8046");
          c.fillStyle = "#c8a878";
          c.beginPath();
          c.moveTo(120, LH);
          c.quadraticCurveTo(190, 186, 200, 166);
          c.lineTo(206, 166);
          c.quadraticCurveTo(232, 186, 300, LH);
          c.fill();
          for (let i = 0; i < 30; i++) px(c, 170 + hash(i) * 70, 180 + hash(i + 2) * 24, 2, 1, "#a8885a");
          pines(c, 176, "#2a4426", "#3e5e34", 12, 16, 26);
          c.fillStyle = "#c8a878";
          c.beginPath();
          c.moveTo(140, LH);
          c.quadraticCurveTo(192, 190, 201, 172);
          c.lineTo(205, 172);
          c.quadraticCurveTo(226, 190, 280, LH);
          c.fill();
        },
        animate(c, t) {
          const step = Math.abs(Math.sin(t * 4)) * 1.5;
          figure(c, 190, 186 - step, 1, { face: 1, weapon: "sword", rim: "#ffe8b0", color: "#1a1620" }, t);
        },
      },
      {
        depth: 1.3,
        paint(c) {
          grass(c, 208, "#16260f", 2, ["#f08a8a", "#f8e080", "#ffffff"]);
        },
        animate: (c, t) => motes(c, t, 22, "#fff4c8", false, 6),
      },
    ],
  },
];
const cache = new Map();
function painted(index, li) {
  const key = index + ":" + li;
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement("canvas");
  cv.width = LW;
  cv.height = LH;
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  sceneDefs[index].layers[li].paint?.(c);
  cache.set(key, cv);
  return cv;
}
let shownIndex = -1;
const prev = typeof document !== "undefined" ? document.createElement("canvas") : null,
  last = typeof document !== "undefined" ? document.createElement("canvas") : null;
// Draw one moment of a page: parallax layers, their living overlays, grading and a crossfade.
export function drawIntroScene(canvas, index, t) {
  const c = canvas.getContext("2d");
  if (canvas.width !== W) {
    canvas.width = W;
    canvas.height = H;
  }
  if (!prev.width || prev.width !== W) {
    prev.width = last.width = W;
    prev.height = last.height = H;
  }
  if (index !== shownIndex) {
    // Keep the previous page's last frame to dissolve from.
    const p = prev.getContext("2d");
    p.fillStyle = "#000";
    p.fillRect(0, 0, W, H);
    if (shownIndex >= 0) p.drawImage(last, 0, 0);
    shownIndex = index;
  }
  c.imageSmoothingEnabled = false;
  const ease = 1 - Math.pow(1 - Math.min(1, t / 16), 2),
    drift = DRIFT * (index % 2 ? 1 - ease : ease);
  sceneDefs[index].layers.forEach((layer, li) => {
    const ox = -Math.round(10 + drift * layer.depth),
      oy = -Math.round(8 * layer.depth + ease * 6 * layer.depth);
    c.drawImage(painted(index, li), ox, oy);
    if (layer.animate) {
      c.save();
      c.translate(ox, oy);
      layer.animate(c, t);
      c.restore();
    }
  });
  const v = c.createRadialGradient(W / 2, H / 2, 70, W / 2, H / 2, 200);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.6)");
  c.fillStyle = v;
  c.fillRect(0, 0, W, H);
  last.getContext("2d").drawImage(canvas, 0, 0);
  if (t < 1.2) {
    c.globalAlpha = 1 - t / 1.2;
    c.drawImage(prev, 0, 0);
    c.globalAlpha = 1;
  }
}
// Forget the dissolve source when the opening is closed.
export function resetIntroScene() {
  shownIndex = -1;
}
export const introPages = () => [
  { title: tr("Эльдерия", "Elderia"), text: tr("Между Серебряными вершинами и Лазурным морем лежит Эльдерия — забытая долина. Сто лет её хранит свет двух обелисков: пока они горят, тьма под землёй спит.", "Between the Silver Peaks and the Azure Sea lies Elderia, the forgotten valley. For a hundred years the light of two obelisks has kept it: while they burn, the darkness below sleeps.") },
  { title: tr("Два брата", "Two brothers"), text: tr("Когда-то долину берегли братья-хранители. Ардан нёс Знак Рассвета. Нерей искал способ вернуть мёртвых — и шагнул туда, откуда не возвращаются.", "Once the valley was kept by two brothers. Ardan bore the Mark of Dawn. Nerei sought a way to bring back the dead — and stepped where no one returns from.") },
  { title: tr("Затмение", "The eclipse"), text: tr("Нерей погасил солнце. Ардан запер брата под долиной четырьмя печатями глубин и двумя обелисками — и отдал за это жизнь. Знак Рассвета исчез вместе с ним.", "Nerei put out the sun. Ardan locked his brother beneath the valley with four depth seals and two obelisks — and paid with his life. The Mark of Dawn vanished with him.") },
  { title: tr("Сто лет тишины", "A hundred years of silence"), text: tr("Теперь обелиски гаснут. Из лесов выходят твари, а в серых плащах ходят Пепельные — те, кто ждёт пробуждения Нерея. Печати глубин трещат.", "Now the obelisks are fading. Beasts leave the woods, and the Ashen walk in grey cloaks, waiting for Nerei to wake. The depth seals are cracking.") },
  { title: tr("Ты", "You"), text: tr("Шторм. Обломки корабля. Ты очнулся на берегу без памяти — и на твоей ладони горит Знак Рассвета, который не видели сто лет.", "A storm. The wreck of a ship. You wake on the shore with no memory — and on your palm burns the Mark of Dawn, unseen for a hundred years.") },
  { title: tr("Твоя дорога", "Your road"), text: tr("Найди старосту Оливера в Лиственной деревне. Зажги обелиски, спустись в глубины, узнай правду об Ардане и Нерее — и реши, каким будет рассвет этой долины.", "Find Elder Oliver in Leafhaven. Light the obelisks, descend into the depths, learn the truth about Ardan and Nerei — and decide what dawn this valley will see.") },
];
// The world's chronicle for the journal.
export const loreEntries = () => [
  [tr("Долина Эльдерия", "The valley of Elderia"), tr("Долина зажата между Серебряными вершинами на севере и Лазурным морем на юге. Её деревни — Лиственная, Высокий Ключ, Речная пристань и Пограничный посёлок — живут под светом обелисков.", "The valley lies between the Silver Peaks to the north and the Azure Sea to the south. Its villages — Leafhaven, Highspring, Riverport and the Frontier — live under the light of the obelisks.")],
  [tr("Ардан и Нерей", "Ardan and Nerei"), tr("Братья-хранители. Ардан носил Знак Рассвета. Нерей хотел победить смерть. Их ссора стоила долине солнца, а Ардану — жизни.", "The guardian brothers. Ardan bore the Mark of Dawn. Nerei wished to defeat death. Their feud cost the valley its sun and Ardan his life.")],
  [tr("Обелиски и печати", "Obelisks and seals"), tr("Два обелиска — лесной и горный — держат свет. Четыре печати глубин в гробнице, шахтах, провале и цитадели держат цепи Нерея. Их стерегут владыки подземелий.", "Two obelisks — of the forest and of the mountain — hold the light. Four depth seals in the crypt, the mines, the abyss and the citadel hold Nerei's chains. Dungeon lords guard them.")],
  [tr("Пепельные", "The Ashen"), tr("Культ в серых плащах. Верят, что Нерей вернёт им мёртвых, и тайно подтачивают обелиски. Их жрица — Ивва.", "A cult in grey cloaks. They believe Nerei will return their dead and secretly gnaw at the obelisks. Their priestess is Ivva.")],
  [tr("Знак Рассвета", "The Mark of Dawn"), tr("Знак Ардана. Он выбирает сам — и сто лет не выбирал никого. Теперь он горит на вашей ладони и откликается на обелиски.", "Ardan's mark. It chooses for itself — and for a hundred years chose no one. Now it burns on your palm and answers the obelisks.")],
  [tr("Глубины", "The depths"), tr("Каждое подземелье строится заново при каждом спуске. Лиственная гробница — катакомбы мёртвых, Шахты вечного льда — извилистые штольни, Провал ядовитых корней — живые пещеры, Цитадель расколотого неба — залы бури.", "Every dungeon is reshaped on each descent. Leafhaven Crypt is a catacomb of the dead, the Everfrost Mines are winding galleries, the Venomroot Abyss is a living warren, the Shattered Sky Citadel is a hall of storms.")],
];

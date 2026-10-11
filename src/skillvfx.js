// Rich spell visuals: element novas, ground decals, beams, orbiting orbs and tornadoes.
// Every effect is layered: a flash, a shockwave and element-specific particles.
export const palettes = {
  fire: ["#fff4c0", "#ffd36a", "#ff8a2a", "#c83a1a", "#5a1a0a"],
  ice: ["#ffffff", "#e0f8ff", "#9ad8ff", "#4a9ad8", "#1a4a7a"],
  lightning: ["#ffffff", "#fff6b0", "#d8c0ff", "#8a6aff", "#3a2a8a"],
  void: ["#ffffff", "#ead8ff", "#b08aff", "#6a3ad0", "#2a0a5a"],
  arcane: ["#ffffff", "#e0ecff", "#9ac0ff", "#5a6ae0", "#1a2a6a"],
  poison: ["#f4ffd0", "#d0f08a", "#8ad04a", "#4a8a2a", "#1a3a0a"],
  light: ["#ffffff", "#fff8d8", "#ffe08a", "#e0a83a", "#8a5a1a"],
  physical: ["#ffffff", "#f0eadc", "#cfc6b0", "#8a8070", "#3a342a"],
  bone: ["#ffffff", "#f4eedc", "#d8d0b8", "#9a927a", "#3a3428"],
  earth: ["#f0e0b8", "#d0b080", "#a07a4a", "#6a4a2a", "#2a1a0a"],
  blood: ["#ffe0e0", "#ff8a8a", "#e03a4a", "#8a0a1a", "#3a0008"],
  wind: ["#ffffff", "#eaf8f0", "#bfe8d0", "#7ab89a", "#2a5a4a"],
};
// Skill styles map onto one of the element looks above.
const styleElement = {
  fire: "fire", meteor: "fire", flamewave: "fire", inferno: "fire", ember: "fire",
  ice: "ice", frostnova: "ice", icefan: "ice", blizzard: "ice",
  lightning: "lightning", chainlightning: "lightning", thunderstrike: "lightning",
  void: "void", starwave: "arcane", arcane: "arcane", stealth: "void",
  poison: "poison", plagueNova: "poison", decay: "poison",
  light: "light", smite: "light", divineStorm: "light", consecration: "light",
  bone: "bone", reap: "blood", blood: "blood",
  earth: "earth", quake: "earth", impact: "earth",
  whirlwind: "physical", burst: "physical", thrust: "physical", physical: "physical", shadowcut: "void",
  wind: "wind",
};
export const elementOf = (style) => styleElement[style] || (palettes[style] ? style : "physical");
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const ease = (t) => 1 - Math.pow(1 - t, 3);
function rect(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}
function glow(c, x, y, r, inner, outer = "#00000000") {
  if (r <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
const alpha = (hex, a) => hex + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0");
function flame(c, x, y, h, w, col, tip) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x - w, y);
  c.quadraticCurveTo(x - w * 0.8, y - h * 0.6, x, y - h);
  c.quadraticCurveTo(x + w * 0.8, y - h * 0.6, x + w, y);
  c.closePath();
  c.fill();
  if (tip) {
    c.fillStyle = tip;
    c.beginPath();
    c.moveTo(x - w * 0.45, y);
    c.quadraticCurveTo(x - w * 0.3, y - h * 0.45, x, y - h * 0.62);
    c.quadraticCurveTo(x + w * 0.3, y - h * 0.45, x + w * 0.45, y);
    c.closePath();
    c.fill();
  }
}
function bolt(c, x1, y1, x2, y2, seed, col, width, jag = 10) {
  const n = 6;
  c.strokeStyle = col;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x1, y1);
  for (let i = 1; i < n; i++) {
    const t = i / n,
      off = (hash(seed + i) - 0.5) * jag * 2;
    c.lineTo(x1 + (x2 - x1) * t + off, y1 + (y2 - y1) * t + off * 0.6);
  }
  c.lineTo(x2, y2);
  c.stroke();
}
// ---------- Particle engine ----------
// Pixel particles with real motion: they fly, rise, fall, shrink and change colour over
// their life. Emissive ones are drawn additively so overlapping sparks glow.
const ramps = {
  fire: ["#fff4b0", "#ffd23a", "#ffa21a", "#ff6a10", "#e8401a", "#a82410", "#5a1608"],
  ice: ["#e8faff", "#a8e4ff", "#6ac4f8", "#3a9ae8", "#2a6ac8", "#1a4a8a"],
  lightning: ["#fffbd0", "#f0e080", "#c8a8ff", "#9a7aff", "#6a4ae8", "#3a2aa0"],
  void: ["#f0e0ff", "#d0a8ff", "#a87aff", "#8a4aff", "#6a2ad0", "#2a0a6a"],
  arcane: ["#e8f4ff", "#a8d0ff", "#7aa8ff", "#5a7aff", "#4a5ae0", "#1a2a8a"],
  poison: ["#e8ff9a", "#c0f05a", "#94d83a", "#6ab82a", "#4a8a2a", "#1a4a10"],
  light: ["#fffbe0", "#fff09a", "#ffe05a", "#ffc83a", "#e8a02a", "#8a5a1a"],
  physical: ["#f8f4e8", "#e8e0cc", "#d0c4ac", "#b0a48a", "#7a705e", "#3a342a"],
  bone: ["#f8f4e4", "#e8e0c8", "#d0c8a8", "#b0a888", "#8a8470", "#3a3428"],
  earth: ["#e0c898", "#c8a870", "#a8844a", "#8a6a3a", "#6a4a2a", "#3a2a14"],
  blood: ["#ff9a9a", "#ff5a5a", "#e8303a", "#c01a2a", "#8a0a1a", "#4a0008"],
  wind: ["#f0fff8", "#c8f0dc", "#9ad8be", "#6ac0a0", "#4aa080", "#2a5a4a"],
  smoke: ["#7a7068", "#5a5450", "#3e3a38", "#2a2826"],
};
// Soft round sprites, cached per colour, so flames, smoke and mist are blobs, not squares.
const blobCache = new Map();
function blob(col) {
  let b = blobCache.get(col);
  if (!b && typeof document !== "undefined") {
    b = document.createElement("canvas");
    b.width = b.height = 32;
    const x = b.getContext("2d"),
      gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, col);
    gr.addColorStop(0.45, col + "cc");
    gr.addColorStop(1, col + "00");
    x.fillStyle = gr;
    x.fillRect(0, 0, 32, 32);
    blobCache.set(col, b);
  }
  return b;
}
export function updateVfx(g, dt) {
  g.vfx ??= [];
  const list = g.vfx;
  for (const e of g.effects) if (e.type === "nova" && !e.dead) emitNova(g, e, dt);
  for (const p of g.projectiles || [])
    if (p.type === "magic" && Math.random() < dt * 40) {
      const ramp = ramps[p.style || p.element] ? p.style || p.element : "arcane";
      push(g, { x: p.x + (Math.random() - 0.5) * 4, y: p.y + 10, z: 10 + (Math.random() - 0.5) * 4, vx: -p.vx * 0.08 + (Math.random() - 0.5) * 14, vy: -p.vy * 0.08 + (Math.random() - 0.5) * 10, vz: ramp === "fire" ? 20 : 0, life: 0.25 + Math.random() * 0.25, size: 1.5 + Math.random() * 2, grow: -3, ramp, add: true, drag: 2 });
    }
  for (const d of g.decals || []) if (d.style && elementOf(d.style) === "fire" && d.life > 2.6 && Math.random() < dt * 18) emberFromDecal(g, d);
  for (const p of list) {
    p.life -= dt;
    p.vx *= 1 - (p.drag || 0) * dt;
    p.vy *= 1 - (p.drag || 0) * dt;
    p.vz = (p.vz || 0) - (p.grav || 0) * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z = Math.max(0, (p.z || 0) + p.vz * dt);
    if (p.z === 0 && p.bounce && p.vz < 0) p.vz = -p.vz * p.bounce;
    p.size += (p.grow || 0) * dt;
  }
  g.vfx = list.filter((p) => p.life > 0 && p.size > 0.3);
  if (g.vfx.length > 1600) g.vfx.splice(0, g.vfx.length - 1600);
}
const push = (g, p) => g.vfx.push({ ...p, max: p.life });
function emberFromDecal(g, d) {
  const a = Math.random() * Math.PI * 2,
    r = Math.random() * d.radius * 0.7;
  push(g, { x: d.x + Math.cos(a) * r, y: d.y + Math.sin(a) * r * 0.62, z: 0, vx: (Math.random() - 0.5) * 8, vy: 0, vz: 25 + Math.random() * 30, life: 0.5 + Math.random() * 0.5, size: 1.5 + Math.random() * 1.5, ramp: "fire", add: true, drag: 1 });
}
// Each frame of a nova's life spawns particles on its expanding front.
function emitNova(g, e, dt) {
  const el = elementOf(e.style),
    p = 1 - e.life / e.maxLife,
    R = e.radius,
    front = R * ease(Math.min(1, p * 1.6)),
    expanding = p < 0.62,
    rate = expanding ? (e.radius / 120) * 520 : 0,
    n = Math.round(rate * dt + Math.random());
  if (!e.burst) {
    e.burst = true;
    initialBurst(g, e, el);
  }
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2,
      ca = Math.cos(a),
      sa = Math.sin(a),
      x = e.x + ca * front * (0.9 + Math.random() * 0.15),
      y = e.y + sa * front * 0.62;
    if (el === "fire") {
      if (Math.random() < 0.55) push(g, { x: x + (Math.random() - 0.5) * 6, y, z: Math.random() * 3, vx: ca * (6 + Math.random() * 14) + (Math.random() - 0.5) * 8, vy: sa * (4 + Math.random() * 8), vz: 45 + Math.random() * 60, life: 0.35 + Math.random() * 0.45, size: 6 + Math.random() * 6, grow: -9, ramp: "fire", add: true, blob: true, drag: 2.5 });
      else push(g, { x, y, z: 4, vx: ca * (20 + Math.random() * 40) + (Math.random() - 0.5) * 30, vy: sa * (12 + Math.random() * 20), vz: 70 + Math.random() * 90, grav: 60, life: 0.4 + Math.random() * 0.6, size: 1 + Math.random() * 1.5, ramp: "fire", add: true, drag: 1.5 });
      if (Math.random() < 0.12) push(g, { x, y, z: 16, vx: ca * 6, vy: sa * 4, vz: 22 + Math.random() * 18, life: 1 + Math.random() * 0.7, size: 6 + Math.random() * 4, grow: 10, ramp: "smoke", alpha: 0.3, blob: true, drag: 1 });
    } else if (el === "ice") {
      if (Math.random() < 0.5) push(g, { x, y, z: 2, vx: ca * (50 + Math.random() * 70), vy: sa * (30 + Math.random() * 45), vz: 30 + Math.random() * 60, grav: 160, life: 0.4 + Math.random() * 0.4, size: 1.5 + Math.random() * 2, ramp: "ice", add: true, drag: 1.5, shape: "shard" });
      if (Math.random() < 0.25) push(g, { x, y, z: 4, vx: ca * 10, vy: sa * 6, vz: 8, life: 0.8 + Math.random() * 0.6, size: 8 + Math.random() * 6, grow: 10, ramp: "ice", alpha: 0.35, blob: true, drag: 1 });
    } else if (el === "lightning") {
      push(g, { x, y, z: Math.random() * 20, vx: ca * (80 + Math.random() * 120), vy: sa * (50 + Math.random() * 80), vz: (Math.random() - 0.3) * 80, grav: 60, life: 0.15 + Math.random() * 0.25, size: 1.5 + Math.random() * 1.5, ramp: "lightning", add: true, drag: 3, shape: "streak" });
    } else if (el === "void" || el === "arcane") {
      const t = a + 1.4;
      push(g, { x, y, z: 8 + Math.random() * 10, vx: Math.cos(t) * 70 + ca * 20, vy: Math.sin(t) * 44 + sa * 12, vz: (Math.random() - 0.5) * 30, life: 0.4 + Math.random() * 0.5, size: 1.5 + Math.random() * 2.5, grow: -2, ramp: el, add: true, drag: 1.6 });
    } else if (el === "poison") {
      if (Math.random() < 0.6) push(g, { x, y, z: 2, vx: ca * 14, vy: sa * 8, vz: 10 + Math.random() * 16, life: 0.7 + Math.random() * 0.7, size: 8 + Math.random() * 6, grow: 10, ramp: "poison", alpha: 0.55, blob: true, drag: 1.2 });
      if (Math.random() < 0.25) push(g, { x, y, z: 2, vx: 0, vy: 0, vz: 18 + Math.random() * 14, life: 0.6, size: 2, ramp: "poison", add: true, shape: "ring" });
    } else if (el === "light") {
      push(g, { x, y, z: Math.random() * 6, vx: ca * 12, vy: sa * 8, vz: 50 + Math.random() * 90, life: 0.5 + Math.random() * 0.6, size: 1.5 + Math.random() * 2, grow: -1.5, ramp: "light", add: true, drag: 1.4, shape: Math.random() < 0.3 ? "cross" : undefined });
    } else if (el === "earth") {
      push(g, { x, y, z: 1, vx: ca * (30 + Math.random() * 40), vy: sa * (20 + Math.random() * 25), vz: 60 + Math.random() * 90, grav: 320, bounce: 0.3, life: 0.6 + Math.random() * 0.5, size: 2 + Math.random() * 3, ramp: "earth", drag: 1.2 });
      if (Math.random() < 0.35) push(g, { x, y, z: 3, vx: ca * 18, vy: sa * 10, vz: 12, life: 0.9 + Math.random() * 0.6, size: 9 + Math.random() * 6, grow: 12, ramp: "earth", alpha: 0.45, blob: true, drag: 1.5 });
    } else if (el === "bone") {
      push(g, { x, y, z: 6, vx: ca * (60 + Math.random() * 60), vy: sa * (40 + Math.random() * 40), vz: 40 + Math.random() * 50, grav: 200, life: 0.5 + Math.random() * 0.4, size: 2 + Math.random() * 1.5, ramp: "bone", shape: "shard", drag: 1 });
      if (Math.random() < 0.3) push(g, { x, y, z: 6, vx: ca * 10, vy: sa * 6, vz: 20, life: 0.6, size: 3, grow: 5, ramp: "poison", alpha: 0.4, add: true });
    } else {
      const ramp = el === "blood" ? "blood" : el === "wind" ? "wind" : "physical",
        t = a + Math.PI / 2;
      push(g, { x, y, z: 8 + Math.random() * 8, vx: Math.cos(t) * 90 + ca * 20, vy: Math.sin(t) * 56 + sa * 12, vz: 0, life: 0.25 + Math.random() * 0.25, size: 1.5 + Math.random() * 1.5, ramp, add: el !== "blood", shape: "streak", drag: 2 });
      if (el === "blood" && Math.random() < 0.4) push(g, { x, y, z: 10, vx: ca * 50, vy: sa * 30, vz: 50, grav: 260, life: 0.6, size: 2, ramp: "blood", drag: 0.5 });
    }
  }
}
// The opening flash: a cone of debris and sparks thrown up at the centre.
function initialBurst(g, e, el) {
  const ramp = ramps[el] ? el : "physical",
    count = Math.round(e.radius * 0.22);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2,
      sp = 30 + Math.random() * 80;
    push(g, { x: e.x, y: e.y, z: 6 + Math.random() * 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.62, vz: 40 + Math.random() * 120, grav: el === "fire" || el === "light" || el === "void" || el === "arcane" ? 40 : 220, life: 0.3 + Math.random() * 0.5, size: 1.5 + Math.random() * 2, ramp, add: el !== "earth" && el !== "bone" && el !== "blood", drag: 1.8, shape: Math.random() < 0.4 ? "streak" : undefined });
  }
}
// Particles are drawn in two passes: smoke and debris normally, emissive sparks additively.
export function drawVfx(c, g) {
  const list = g.vfx;
  if (!list?.length) return;
  const colourOf = (p) => {
    const ramp = ramps[p.ramp] || ramps.physical,
      t = Math.pow(1 - p.life / p.max, 0.75);
    return ramp[Math.min(ramp.length - 1, Math.floor(t * ramp.length))];
  };
  // Soft additive halos give emissive particles their glow without bleaching them white.
  c.save();
  c.globalCompositeOperation = "lighter";
  for (const p of list) {
    if (!p.add) continue;
    const sz = Math.max(4, p.size * (p.blob ? 2.2 : 4)),
      img = blob(colourOf(p));
    if (!img) continue;
    c.globalAlpha = (p.blob ? 0.35 : 0.3) * Math.min(1, (p.life / p.max) * 2);
    c.drawImage(img, p.x - sz / 2, p.y - (p.z || 0) - sz / 2, sz, sz);
  }
  c.restore();
  c.save();
  for (const p of list) {
    const col = colourOf(p),
      t = 1 - p.life / p.max,
      sz = Math.max(1, Math.round(p.size)),
      x = Math.round(p.x),
      y = Math.round(p.y - (p.z || 0));
    c.globalAlpha = (p.alpha ?? 1) * Math.min(1, (p.life / p.max) * 2.2);
    c.fillStyle = col;
    if (p.blob) {
      const img = blob(col),
        bs = p.size * 1.6;
      if (img) c.drawImage(img, p.x - bs / 2, p.y - (p.z || 0) - bs / 2, bs, bs);
    } else if (p.shape === "streak") {
      const len = Math.min(10, Math.hypot(p.vx, p.vy) * 0.05 + 2),
        ang = Math.atan2(p.vy - (p.vz || 0) * 0.3, p.vx);
      c.save();
      c.translate(x, y);
      c.rotate(ang);
      c.fillRect(-len, -sz / 2, len + sz, sz);
      c.restore();
    } else if (p.shape === "shard") {
      c.save();
      c.translate(x, y);
      c.rotate(Math.atan2(p.vy, p.vx));
      c.fillRect(-sz * 1.5, -sz / 2, sz * 3, Math.max(1, sz * 0.7));
      c.restore();
    } else if (p.shape === "cross") {
      c.fillRect(x - sz, y, sz * 2 + 1, 1);
      c.fillRect(x, y - sz, 1, sz * 2 + 1);
    } else if (p.shape === "ring") {
      c.strokeStyle = col;
      c.lineWidth = 1;
      c.beginPath();
      c.arc(x, y, sz + t * 3, 0, Math.PI * 2);
      c.stroke();
    } else c.fillRect(x - (sz >> 1), y - (sz >> 1), sz, sz);
  }
  c.restore();
}
// The nova itself now only adds what particles cannot: light on the ground, a flash,
// and a few signature shapes (ice spikes, lightning bolts, the arcane star, a light pillar).
export function drawNova(c, e, time) {
  const el = elementOf(e.style),
    P = palettes[el],
    p = 1 - e.life / e.maxLife,
    R = e.radius,
    r = R * ease(Math.min(1, p * 1.6)),
    fade = 1 - p,
    seed = e.seed || 1,
    { x, y } = e;
  c.save();
  c.globalCompositeOperation = "lighter";
  // Light thrown on the ground by the blast.
  c.globalAlpha = fade * 0.4;
  c.save();
  c.translate(x, y);
  c.scale(1, 0.62);
  glow(c, 0, 0, Math.max(10, r * 1.1), alpha(P[3], 0.5), alpha(P[4], 0));
  c.restore();
  // A thin, quickly fading heat front.
  if (p < 0.4) {
    c.globalAlpha = (0.4 - p) * 1.2;
    c.strokeStyle = P[2];
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2);
    c.stroke();
  }
  // Central flash.
  if (p < 0.25) {
    c.globalAlpha = 0.7;
    glow(c, x, y - 8, R * 0.4 * (1 - p * 2), alpha(P[1], (0.25 - p) * 3), alpha(P[3], 0));
  }
  c.restore();
  c.save();
  if (el === "ice") {
    const N = 22;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + hash(seed + i) * 0.25,
        rr = R * (0.55 + hash(seed + i * 9) * 0.45),
        appear = Math.min(1, Math.max(0, (p * 1.6 - rr / R) * 5)),
        grow = appear * (p > 0.75 ? (1 - p) / 0.25 : 1),
        h = Math.round((10 + hash(seed + i * 5) * 16) * grow),
        px = Math.round(x + Math.cos(a) * rr),
        py = Math.round(y + Math.sin(a) * rr * 0.62),
        lean = Math.round(Math.cos(a) * 4);
      if (h < 2) continue;
      c.fillStyle = P[4];
      c.beginPath();
      c.moveTo(px - 4, py);
      c.lineTo(px + lean, py - h);
      c.lineTo(px + 4, py);
      c.fill();
      c.fillStyle = P[2];
      c.beginPath();
      c.moveTo(px - 2, py);
      c.lineTo(px + lean, py - h);
      c.lineTo(px + 1, py);
      c.fill();
      rect(c, px + lean - 1, py - h, 2, 2, P[0]);
    }
  } else if (el === "lightning" && p < 0.55) {
    const frame = Math.floor(time * 30);
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + hash(seed + frame + i),
        tx = x + Math.cos(a) * r,
        ty = y + Math.sin(a) * r * 0.62;
      bolt(c, x, y - 10, tx, ty, seed * 13 + frame * 7 + i, alpha(P[3], 0.8), 4, 12);
      bolt(c, x, y - 10, tx, ty, seed * 13 + frame * 7 + i, P[0], 1, 12);
    }
    if (p < 0.35) {
      bolt(c, x + 6, y - 200, x, y - 8, seed + frame, alpha(P[2], 0.8), 7, 16);
      bolt(c, x + 6, y - 200, x, y - 8, seed + frame, P[0], 2, 16);
    }
  } else if ((el === "void" || el === "arcane") && p < 0.7) {
    c.globalCompositeOperation = "lighter";
    const spin = time * 4 + seed,
      size = R * 0.35 * (p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.5);
    c.globalAlpha = 0.85;
    c.fillStyle = alpha(P[2], 0.9);
    c.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = spin + (i * Math.PI) / 8,
        d = i % 2 ? size * 0.3 : size;
      c.lineTo(x + Math.cos(a) * d, y - 10 + Math.sin(a) * d * 0.8);
    }
    c.fill();
    glow(c, x, y - 10, size * 0.7, alpha(P[0], 1), alpha(P[2], 0));
  } else if (el === "light" && p < 0.75) {
    c.globalCompositeOperation = "lighter";
    const pw = 22 * (p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.6);
    const gr = c.createLinearGradient(x - pw, 0, x + pw, 0);
    gr.addColorStop(0, alpha(P[2], 0));
    gr.addColorStop(0.5, alpha(P[0], 0.95));
    gr.addColorStop(1, alpha(P[2], 0));
    c.fillStyle = gr;
    c.fillRect(x - pw, y - 240, pw * 2, 240);
  }
  c.restore();
}
// Marks left on the ground: scorched earth, frost, cracks, poison puddles and glowing glyphs.
export function drawDecal(c, d, time) {
  const el = elementOf(d.style),
    P = palettes[el],
    a = Math.min(1, d.life / 1.2) * 0.8,
    R = d.radius;
  c.save();
  c.globalAlpha = a;
  if (el === "fire") {
    // Scorched patches rather than one dark disc, with a dying glow in the cracks.
    for (let i = 0; i < 9; i++) {
      const ang = hash(d.seed + i) * Math.PI * 2,
        dist = R * hash(d.seed + i * 3) * 0.6,
        px = d.x + Math.cos(ang) * dist,
        py = d.y + Math.sin(ang) * dist * 0.62;
      c.globalAlpha = a * 0.45;
      c.save();
      c.translate(px, py);
      c.scale(1, 0.6);
      glow(c, 0, 0, R * (0.25 + hash(d.seed + i * 7) * 0.2), "#2a1608aa", "#2a160800");
      c.restore();
    }
    if (d.life > 2) {
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = Math.min(1, (d.life - 2) / 2) * (0.5 + Math.sin(time * 7 + d.seed) * 0.2);
      c.save();
      c.translate(d.x, d.y);
      c.scale(1, 0.62);
      glow(c, 0, 0, R * 0.7, "#ff6a1a55", "#ff6a1a00");
      c.restore();
    }
  } else if (el === "ice") {
    glow(c, d.x, d.y, R, "#e8f8ff66", "#d8f4ff00");
    c.globalAlpha = a * 0.6;
    c.strokeStyle = "#ffffffaa";
    c.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      c.beginPath();
      c.moveTo(d.x, d.y);
      c.lineTo(d.x + Math.cos(ang) * R * 0.9, d.y + Math.sin(ang) * R * 0.55);
      c.stroke();
    }
  } else if (el === "poison") {
    glow(c, d.x, d.y, R * 0.8, "#6ab83a88", "#4a8a2a00");
    for (let i = 0; i < 5; i++) {
      const k = (time * 0.8 + hash(d.seed + i)) % 1;
      c.globalAlpha = a * (1 - k);
      c.strokeStyle = "#d0f08a";
      c.beginPath();
      c.arc(d.x + (hash(d.seed + i * 2) - 0.5) * R, d.y + (hash(d.seed + i * 5) - 0.5) * R * 0.5, 2 + k * 3, 0, Math.PI * 2);
      c.stroke();
    }
  } else if (el === "earth" || el === "physical" || el === "blood") {
    c.strokeStyle = el === "blood" ? "#5a0a10" : "#2a1a0a";
    c.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2 + hash(d.seed + i);
      c.beginPath();
      c.moveTo(d.x, d.y);
      c.lineTo(d.x + Math.cos(ang) * R * 0.5, d.y + Math.sin(ang) * R * 0.3);
      c.lineTo(d.x + Math.cos(ang + 0.2) * R * 0.85, d.y + Math.sin(ang + 0.2) * R * 0.52);
      c.stroke();
    }
  } else {
    // Light, void, arcane, lightning and bone leave a faint fading glyph.
    c.globalAlpha = a * 0.4;
    glow(c, d.x, d.y, R * 0.7, alpha(P[2], 0.35), alpha(P[2], 0));
    c.strokeStyle = P[2];
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(d.x, d.y, R * 0.7, R * 0.43, 0, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + time * 0.4;
      c.lineTo(d.x + Math.cos(ang) * R * 0.55, d.y + Math.sin(ang) * R * 0.34);
    }
    c.closePath();
    c.stroke();
  }
  c.restore();
}
// A straight ray: wide glow, bright core, sparks along it and a flare at both ends.
export function drawBeam(c, e, time) {
  const el = elementOf(e.style),
    P = palettes[el],
    p = 1 - e.life / e.maxLife,
    w = e.width * (p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85);
  if (w <= 0.5) return;
  c.save();
  c.translate(e.x, e.y - 10);
  c.rotate(e.angle);
  const g = c.createLinearGradient(0, -w * 1.6, 0, w * 1.6);
  g.addColorStop(0, alpha(P[3], 0));
  g.addColorStop(0.3, alpha(P[2], 0.8));
  g.addColorStop(0.5, P[0]);
  g.addColorStop(0.7, alpha(P[2], 0.8));
  g.addColorStop(1, alpha(P[3], 0));
  c.fillStyle = g;
  c.fillRect(0, -w * 1.6, e.length, w * 3.2);
  if (el === "lightning") {
    const frame = Math.floor(time * 24);
    bolt(c, 0, 0, e.length, 0, frame + (e.seed || 0), P[0], 2, w);
  }
  for (let i = 0; i < 26; i++) {
    const t = (hash((e.seed || 0) + i) + time * 1.5) % 1,
      off = (hash(i * 7) - 0.5) * w * 2.4;
    rect(c, t * e.length, off, 3, 2, i % 2 ? P[1] : P[0]);
  }
  glow(c, 0, 0, w * 2.4, alpha(P[0], 0.9), alpha(P[2], 0));
  glow(c, e.length, 0, w * 3, alpha(P[1], 0.9), alpha(P[3], 0));
  c.restore();
}
// Orbs, blades or spirits circling the hero.
export function drawOrbit(c, o, hero, time) {
  const el = elementOf(o.style),
    P = palettes[el];
  for (let i = 0; i < o.count; i++) {
    const a = o.angle + (i / o.count) * Math.PI * 2,
      x = hero.x + Math.cos(a) * o.radius,
      y = hero.y - 12 + Math.sin(a) * o.radius * 0.62;
    for (let t = 1; t <= 4; t++) {
      const ta = a - t * 0.14;
      c.globalAlpha = 0.5 - t * 0.1;
      glow(c, hero.x + Math.cos(ta) * o.radius, hero.y - 12 + Math.sin(ta) * o.radius * 0.62, 7 - t, alpha(P[2], 0.8), alpha(P[3], 0));
    }
    c.globalAlpha = 1;
    if (o.shape === "blade") {
      glow(c, x, y, 18, alpha(P[0], 0.5), alpha(P[2], 0));
      c.strokeStyle = alpha(P[1], 0.6);
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(hero.x, hero.y - 12, o.radius, o.radius * 0.62, 0, a - 0.7, a);
      c.stroke();
      c.save();
      c.translate(x, y);
      c.rotate(a + Math.PI / 2 + time * 12);
      c.fillStyle = P[3];
      c.beginPath();
      c.moveTo(0, -18);
      c.lineTo(4, -4);
      c.lineTo(3, 10);
      c.lineTo(-3, 10);
      c.lineTo(-4, -4);
      c.closePath();
      c.fill();
      rect(c, -1, -16, 2, 25, P[0]);
      rect(c, -7, 9, 14, 3, "#c9a24a");
      rect(c, -1, 12, 3, 6, "#6a4a2e");
      c.restore();
    } else if (o.shape === "hammer") {
      c.save();
      c.translate(x, y);
      c.rotate(time * 9 + i);
      rect(c, -1, -2, 3, 14, P[3]);
      rect(c, -6, -9, 13, 8, P[2]);
      rect(c, -5, -8, 11, 2, P[0]);
      c.restore();
    } else if (o.shape === "skull") {
      rect(c, x - 5, y - 6, 10, 9, P[1]);
      rect(c, x - 3, y - 3, 2, 2, "#14121a");
      rect(c, x + 1, y - 3, 2, 2, "#14121a");
      glow(c, x, y - 2, 10, alpha(P[2], 0.6), alpha(P[3], 0));
    } else {
      glow(c, x, y, 16, alpha(P[1], 0.95), alpha(P[3], 0));
      if (el === "fire") flame(c, x, y + 5, 16 + Math.sin(time * 20 + i) * 4, 6, P[2], P[1]);
      glow(c, x, y, 7, alpha(P[0], 1), alpha(P[1], 0));
      rect(c, x - 2, y - 2, 5, 5, P[0]);
    }
  }
  c.globalAlpha = 1;
}
// A spinning funnel that crawls forward, dragging debris with it.
export function drawTornado(c, z, time) {
  const el = elementOf(z.style),
    P = palettes[el],
    fade = Math.min(1, z.life * 2);
  c.save();
  c.globalAlpha = fade * 0.35;
  c.fillStyle = "#14201a";
  c.beginPath();
  c.ellipse(z.x, z.y, z.radius, z.radius * 0.4, 0, 0, Math.PI * 2);
  c.fill();
  for (let k = 0; k < 9; k++) {
    const h = k * 9,
      w = z.radius * (0.35 + k * 0.09),
      sway = Math.sin(time * 6 + k * 0.6) * (3 + k);
    c.globalAlpha = fade * (0.9 - k * 0.05);
    c.strokeStyle = k % 3 === 0 ? P[3] : k % 2 ? P[2] : P[1];
    c.lineWidth = 4;
    c.beginPath();
    const spin = time * 14 + k;
    c.ellipse(z.x + sway, z.y - h, w, w * 0.3, 0, spin, spin + Math.PI * 1.3);
    c.stroke();
  }
  for (let i = 0; i < 10; i++) {
    const a = time * 10 + i * 0.63,
      h = ((time * 50 + i * 9) % 80),
      w = z.radius * (0.35 + h / 80);
    c.globalAlpha = fade;
    rect(c, z.x + Math.cos(a) * w, z.y - h + Math.sin(a) * w * 0.3, 3, 3, i % 3 ? P[3] : P[0]);
  }
  c.restore();
}
// A small cast flare on a boss as it begins a spell.
export function drawBossCast(c, e, time) {
  const el = elementOf(e.style),
    P = palettes[el],
    p = 1 - e.life / e.maxLife;
  c.save();
  c.globalAlpha = 1 - p;
  c.strokeStyle = P[2];
  c.lineWidth = 2;
  for (let k = 0; k < 2; k++) {
    c.beginPath();
    c.ellipse(e.x, e.y + 4, 30 + k * 12 + p * 20, (30 + k * 12 + p * 20) * 0.45, 0, time * (k ? -2 : 2), time * (k ? -2 : 2) + Math.PI * 1.6);
    c.stroke();
  }
  glow(c, e.x, e.y - 30, 26 * (1 - p) + 6, alpha(P[0], 0.9), alpha(P[2], 0));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + time * 4,
      d = 36 * (1 - p);
    rect(c, e.x + Math.cos(a) * d, e.y - 30 + Math.sin(a) * d * 0.6, 3, 3, P[1]);
  }
  c.restore();
}
// A cone of breath: fire, frost or poison rolling out from the caster.
export function drawBreath(c, e, time) {
  const el = elementOf(e.style),
    P = palettes[el],
    p = 1 - e.life / e.maxLife;
  c.save();
  for (let i = 0; i < 40; i++) {
    const k = (hash((e.seed || 0) + i) + p * 1.4) % 1,
      a = e.angle + (hash(i * 3 + 1) - 0.5) * 2 * e.arc * 0.9,
      d = k * e.radius,
      x = e.x + Math.cos(a) * d,
      y = e.y - 10 + Math.sin(a) * d * 0.8,
      size = 4 + k * 12;
    c.globalAlpha = (1 - k) * (1 - p * 0.6);
    glow(c, x, y, size, alpha(k < 0.3 ? P[0] : k < 0.6 ? P[1] : P[2], 0.9), alpha(P[3], 0));
  }
  c.restore();
}
// The falling shape that telegraphs a boss strike: an orb dropping from the sky onto the circle.
export function drawFallingOrb(c, x, y, progress, style, time) {
  const el = elementOf(style),
    P = palettes[el],
    fy = y - (1 - progress) * 170,
    fx = x + (1 - progress) * 40;
  c.save();
  for (let i = 1; i < 6; i++) {
    c.globalAlpha = 0.5 - i * 0.08;
    glow(c, fx + i * 4, fy - i * 12, 10 - i, alpha(P[2], 0.9), alpha(P[3], 0));
  }
  c.globalAlpha = 1;
  if (el === "bone") {
    glow(c, fx, fy, 18, "#9fe0a0dd", "#5aa83a00");
    rect(c, fx - 7, fy - 8, 14, 11, "#e8e2cc");
    rect(c, fx - 5, fy - 5, 4, 4, "#14121a");
    rect(c, fx + 1, fy - 5, 4, 4, "#14121a");
    rect(c, fx - 4, fy + 3, 8, 3, "#b8b29c");
    flame(c, fx, fy - 8, 12 + Math.sin(time * 20) * 3, 6, "#5ad06a", "#c8ffd0");
  } else {
    glow(c, fx, fy, 16, alpha(P[1], 0.95), alpha(P[3], 0));
    rect(c, fx - 3, fy - 3, 6, 6, P[0]);
    if (el === "fire") flame(c, fx, fy + 4, 14 + Math.sin(time * 20) * 3, 6, P[2], P[1]);
  }
  c.restore();
}
// Energy gathering along a line before a boss's beam fires.
export function drawChargingLine(c, h, time) {
  const P = palettes[elementOf(h.style)],
    charge = Math.min(1, h.age / (h.age + Math.max(0.001, h.delay)));
  c.save();
  c.translate(h.x, h.y);
  c.rotate(h.angle);
  for (let i = 0; i < 18; i++) {
    const t = (hash(i) + time * 1.6) % 1;
    c.globalAlpha = 0.4 + charge * 0.6;
    glow(c, t * h.range * charge, (hash(i * 3) - 0.5) * h.width, 6, alpha(P[1], 0.9), alpha(P[2], 0));
  }
  glow(c, 0, -10, 10 + charge * 18, alpha(P[0], 0.8), alpha(P[2], 0));
  c.restore();
}

// ---------- Class dodges ----------
// Each class moves its own way; particles carry the theme.
export function dodgeBurst(g, style, x, y, angle) {
  g.vfx ??= [];
  const back = angle + Math.PI;
  const R = Math.random;
  if (style === "chargeDust") {
    for (let i = 0; i < 26; i++) {
      const a = back + (R() - 0.5) * 1.6;
      push(g, { x, y, z: 2, vx: Math.cos(a) * (30 + R() * 70), vy: Math.sin(a) * (20 + R() * 40), vz: 8 + R() * 20, life: 0.7 + R() * 0.6, size: 7 + R() * 7, grow: 12, ramp: "earth", alpha: 0.55, blob: true, drag: 2 });
    }
    for (let i = 0; i < 12; i++) {
      const a = back + (R() - 0.5) * 2;
      push(g, { x, y, z: 2, vx: Math.cos(a) * (40 + R() * 60), vy: Math.sin(a) * (25 + R() * 40), vz: 60 + R() * 80, grav: 320, bounce: 0.3, life: 0.7, size: 2 + R() * 2, ramp: "earth", drag: 1 });
    }
    g.addDecal?.(x, y, 26, "earth", 2.5);
  } else if (style === "roll") {
    for (let i = 0; i < 22; i++) {
      const a = R() * Math.PI * 2;
      push(g, { x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 4, z: 6 + R() * 10, vx: Math.cos(a) * (15 + R() * 25), vy: Math.sin(a) * (10 + R() * 15), vz: 10 + R() * 20, life: 0.9 + R() * 0.8, size: 9 + R() * 8, grow: 14, ramp: "smoke", alpha: 0.6, blob: true, drag: 1.6 });
    }
    for (let i = 0; i < 16; i++) {
      const a = R() * Math.PI * 2;
      push(g, { x, y, z: 8 + R() * 14, vx: Math.cos(a) * (40 + R() * 50), vy: Math.sin(a) * (25 + R() * 30), vz: 20 + R() * 30, grav: 40, life: 0.9 + R() * 0.6, size: 2 + R(), ramp: "wind", shape: "shard", drag: 1.5 });
    }
  } else if (style === "holyDash") {
    for (let i = 0; i < 22; i++) {
      const a = R() * Math.PI * 2;
      push(g, { x, y, z: 12 + R() * 16, vx: Math.cos(a) * (20 + R() * 40), vy: Math.sin(a) * (14 + R() * 24), vz: 10 + R() * 30, grav: -10, life: 0.8 + R() * 0.7, size: 2 + R() * 1.5, ramp: "light", add: true, shape: R() < 0.5 ? "shard" : "cross", drag: 1.4 });
    }
    g.effects.push({ type: "wingFlash", x, y, life: 0.45, maxLife: 0.45 });
  } else if (style === "chiStep") {
    for (let i = 0; i < 16; i++) {
      const a = R() * Math.PI * 2;
      push(g, { x, y, z: 6 + R() * 26, vx: Math.cos(a) * 30, vy: Math.sin(a) * 18, vz: 15 + R() * 20, life: 0.5 + R() * 0.4, size: 2 + R() * 1.5, ramp: "light", add: true, shape: R() < 0.4 ? "cross" : undefined, drag: 2 });
    }
  } else if (style === "rocket") {
    for (let i = 0; i < 16; i++) {
      const a = angle + Math.PI + (R() - 0.5) * 1.2;
      push(g, { x, y, z: 4, vx: Math.cos(a) * (40 + R() * 50), vy: Math.sin(a) * (24 + R() * 30), vz: 10 + R() * 20, life: 0.8 + R() * 0.5, size: 8 + R() * 6, grow: 10, ramp: "smoke", alpha: 0.5, blob: true, drag: 1.8 });
    }
  } else if (style === "crows") {
    for (let i = 0; i < 18; i++) {
      const a = R() * Math.PI * 2,
        sp = 40 + R() * 70;
      push(g, { x, y, z: 10 + R() * 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 30 + R() * 40, grav: -20, life: 0.7 + R() * 0.5, size: 3 + R() * 2, ramp: "smoke", shape: "shard", drag: 0.8 });
    }
    for (let i = 0; i < 10; i++) push(g, { x, y, z: 10, vx: (R() - 0.5) * 40, vy: (R() - 0.5) * 24, vz: 10, life: 0.9, size: 9, grow: 10, ramp: "smoke", alpha: 0.4, blob: true, drag: 1.5 });
  } else if (style === "spiritWolf") {
    for (let i = 0; i < 20; i++) {
      const a = R() * Math.PI * 2;
      push(g, { x, y, z: 6 + R() * 14, vx: Math.cos(a) * 40, vy: Math.sin(a) * 24, vz: 20 + R() * 30, life: 0.6 + R() * 0.4, size: 2 + R() * 2, ramp: "ice", add: true, drag: 1.6 });
    }
    g.effects.push({ type: "spiritWolf", x, y, angle, life: 0.5, maxLife: 0.5 });
  } else if (style === "portal" || style === "grave") {
    const ramp = style === "portal" ? "arcane" : "poison";
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      push(g, { x: x + Math.cos(a) * 16, y: y + Math.sin(a) * 6, z: 4 + R() * 26, vx: Math.cos(a + 1.5) * 50, vy: Math.sin(a + 1.5) * 20, vz: 20 + R() * 30, life: 0.5 + R() * 0.4, size: 1.5 + R() * 2, ramp, add: true, drag: 2 });
    }
    if (style === "grave")
      for (let i = 0; i < 6; i++) push(g, { x: x + (R() - 0.5) * 20, y, z: 4, vx: 0, vy: 0, vz: 30 + R() * 25, life: 1.1, size: 7, grow: 4, ramp: "poison", alpha: 0.45, add: true, blob: true, drag: 0.5 });
  }
}
// Trail particles emitted every frame while a dash is under way.
export function dodgeTrail(g, style, x, y, angle, dt) {
  g.vfx ??= [];
  const R = Math.random,
    n = Math.round(dt * 90 + R());
  for (let i = 0; i < n; i++) {
    if (style === "chargeDust") push(g, { x: x + (R() - 0.5) * 10, y, z: 2, vx: -Math.cos(angle) * 20 + (R() - 0.5) * 20, vy: -Math.sin(angle) * 12, vz: 6 + R() * 10, life: 0.6 + R() * 0.4, size: 6 + R() * 5, grow: 10, ramp: "earth", alpha: 0.45, blob: true, drag: 2 });
    else if (style === "roll") push(g, { x, y, z: 6 + R() * 10, vx: (R() - 0.5) * 40, vy: (R() - 0.5) * 24, vz: 10 + R() * 20, grav: 30, life: 0.6 + R() * 0.5, size: 2, ramp: "wind", shape: "shard", drag: 1.5 });
    else if (style === "chiStep") g.effects.push({ type: "afterimage", x, y, angle, life: 0.35, maxLife: 0.35 });
    else if (style === "rocket") {
      push(g, { x: x - Math.cos(angle) * 6, y, z: 4, vx: -Math.cos(angle) * 60 + (R() - 0.5) * 20, vy: -Math.sin(angle) * 36, vz: -10, life: 0.25 + R() * 0.2, size: 5 + R() * 3, grow: -10, ramp: "fire", add: true, blob: true, drag: 2 });
      push(g, { x: x - Math.cos(angle) * 10, y, z: 4, vx: -Math.cos(angle) * 20, vy: -Math.sin(angle) * 12, vz: 6, life: 0.8, size: 6, grow: 10, ramp: "smoke", alpha: 0.4, blob: true, drag: 1.5 });
    } else if (style === "spiritWolf") push(g, { x: x + (R() - 0.5) * 10, y, z: 6 + R() * 14, vx: -Math.cos(angle) * 30, vy: -Math.sin(angle) * 18, vz: 6, life: 0.4 + R() * 0.3, size: 3 + R() * 2, ramp: "ice", add: true, blob: true, drag: 2 });
    else if (style === "holyDash") push(g, { x: x + (R() - 0.5) * 8, y, z: 8 + R() * 22, vx: -Math.cos(angle) * 30, vy: -Math.sin(angle) * 18, vz: 0, life: 0.35 + R() * 0.3, size: 2 + R() * 2, ramp: "light", add: true, shape: "streak", drag: 2 });
  }
}

// A spectral wolf leaps ahead of the summoner as they dash.
export function drawSpiritWolf(c, e, time) {
  const p = 1 - e.life / e.maxLife,
    d = 90 * p,
    x = e.x + Math.cos(e.angle) * d,
    y = e.y + Math.sin(e.angle) * d - Math.sin(p * Math.PI) * 20,
    face = Math.cos(e.angle) < 0 ? -1 : 1;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = (1 - p) * 0.9;
  c.translate(x, y);
  c.scale(face, 1);
  glow(c, 0, -14, 24, "#a8d8ff88", "#6aa8e800");
  rect(c, -12, -18, 22, 9, "#a8d8ff");
  rect(c, 8, -24, 10, 9, "#c8e8ff");
  rect(c, 15, -19, 5, 3, "#88b8f0");
  rect(c, 10, -28, 3, 4, "#88b8f0");
  rect(c, 13, -21, 2, 2, "#ffffff");
  rect(c, -18, -18, 7, 3, "#a8d8ff");
  for (const lx of [-10, -4, 3, 8]) rect(c, lx, -10, 3, 7, "#88b8f0");
  c.restore();
}

// ---------- Basic attacks ----------
// Which way a weapon swings, from its appearance.
export function attackStyle(appearance = "") {
  if (["hammer", "mace", "axe", "seraphHammer"].includes(appearance)) return "heavy";
  if (appearance === "spear") return "thrust";
  if (["daggers", "claws", "beastClaws"].includes(appearance)) return "claw";
  if (appearance === "whip") return "whip";
  if (appearance === "fists") return "fist";
  if (appearance === "scythe") return "reap";
  if (["bow", "crossbow", "phoenixBow"].includes(appearance)) return "bow";
  if (["staff", "wand", "skullstaff", "frostStaff", "cosmicStaff", "lichStaff", "beastStaff", "moonstaff"].includes(appearance)) return "cast";
  return "blade";
}
// Particles thrown off by a basic attack, matched to the weapon.
export function attackParticles(g, style, x, y, angle, range, color = "#ffffff", element) {
  g.vfx ??= [];
  const R = Math.random,
    ca = Math.cos(angle),
    sa = Math.sin(angle),
    tipX = x + ca * range * 0.85,
    tipY = y + sa * range * 0.85,
    ramp = element && ramps[element] ? element : null;
  if (style === "heavy") {
    for (let i = 0; i < 14; i++) {
      const a = R() * Math.PI * 2;
      push(g, { x: tipX, y: tipY, z: 2, vx: Math.cos(a) * (20 + R() * 40), vy: Math.sin(a) * (12 + R() * 24), vz: 10 + R() * 25, life: 0.5 + R() * 0.4, size: 5 + R() * 5, grow: 9, ramp: "earth", alpha: 0.5, blob: true, drag: 2.5 });
    }
    for (let i = 0; i < 8; i++) {
      const a = R() * Math.PI * 2;
      push(g, { x: tipX, y: tipY, z: 2, vx: Math.cos(a) * 50, vy: Math.sin(a) * 30, vz: 50 + R() * 60, grav: 300, bounce: 0.3, life: 0.6, size: 2, ramp: "earth", drag: 1 });
    }
    g.addDecal?.(tipX, tipY, 18, "earth", 1.6);
  } else if (style === "thrust") {
    for (let i = 0; i < 10; i++) push(g, { x: x + ca * range * (0.3 + R() * 0.7), y: y + sa * range * (0.3 + R() * 0.7), z: 12, vx: ca * 120, vy: sa * 120, vz: 0, life: 0.15 + R() * 0.12, size: 1.5, ramp: "physical", add: true, shape: "streak", drag: 4 });
  } else if (style === "claw" || style === "whip" || style === "fist") {
    for (let i = 0; i < 8; i++) {
      const a = angle + (R() - 0.5) * 1.6;
      push(g, { x: tipX, y: tipY, z: 12, vx: Math.cos(a) * (60 + R() * 60), vy: Math.sin(a) * (40 + R() * 40), vz: 10 + R() * 20, life: 0.2 + R() * 0.2, size: 1.5, ramp: ramp || "physical", add: true, shape: "streak", drag: 3 });
    }
  } else if (style === "cast") {
    const sx = x + ca * 12,
      sy = y + sa * 6;
    for (let i = 0; i < 10; i++) {
      const a = R() * Math.PI * 2;
      push(g, { x: sx, y: sy, z: 30, vx: Math.cos(a) * 30 + ca * 30, vy: Math.sin(a) * 20 + sa * 20, vz: (R() - 0.5) * 30, life: 0.3 + R() * 0.25, size: 1.5 + R() * 1.5, ramp: ramp || "arcane", add: true, drag: 2.5 });
    }
  } else if (style === "bow") {
    for (let i = 0; i < 6; i++) push(g, { x: x + ca * 14, y: y + sa * 8, z: 16 + (R() - 0.5) * 6, vx: ca * (90 + R() * 60), vy: sa * (90 + R() * 60), vz: 0, life: 0.18, size: 1, ramp: "wind", add: true, shape: "streak", drag: 3 });
  } else {
    for (let i = 0; i < 7; i++) {
      const a = angle + (R() - 0.5) * 2;
      push(g, { x: x + Math.cos(a) * range * 0.9, y: y + Math.sin(a) * range * 0.9, z: 10, vx: Math.cos(a + 1.5) * 60, vy: Math.sin(a + 1.5) * 40, vz: 10, life: 0.2 + R() * 0.15, size: 1.5, ramp: ramp || "physical", add: true, shape: "streak", drag: 3 });
    }
  }
}

// A golden after-image left behind by the monk's chi step.
export function drawAfterimage(c, e) {
  const p = 1 - e.life / e.maxLife;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = (1 - p) * 0.6;
  const g2 = c.createLinearGradient(e.x, e.y - 34, e.x, e.y);
  g2.addColorStop(0, "#ffe08a00");
  g2.addColorStop(0.5, "#ffd06a");
  g2.addColorStop(1, "#ffb03a00");
  c.fillStyle = g2;
  c.fillRect(e.x - 7, e.y - 34, 14, 34);
  c.fillStyle = "#ffe8a0";
  c.fillRect(e.x - 4, e.y - 34, 8, 8);
  c.restore();
}

// ---------- Hits and deaths ----------
// What a creature is made of decides what flies off it when struck.
const materials = {
  slime: "goo", toad: "goo",
  skeleton: "bone", revenant: "bone", ghoul: "bone", boneKing: "bone",
  golem: "stone", sandGolem: "sand", titan: "stone", guardian: "stone",
  treantling: "wood", treant: "wood",
  crab: "chitin", scorpion: "chitin", spider: "venom", broodQueen: "venom",
  wisp: "magic", shade: "void", herald: "void", eclipse: "void", stormLord: "magic",
  yeti: "snow", frostTyrant: "snow", frostWyrm: "snow",
};
const matLook = {
  goo: { ramp: "poison", blob: true, size: 3, grav: 260 },
  bone: { ramp: "bone", shape: "shard", size: 2, grav: 320 },
  stone: { ramp: "earth", size: 2.5, grav: 340, bounce: 0.3 },
  sand: { ramp: "earth", size: 2, grav: 200, blob: true },
  wood: { ramp: "earth", shape: "shard", size: 2, grav: 300, leaf: true },
  chitin: { ramp: "fire", shape: "shard", size: 2, grav: 320 },
  venom: { ramp: "void", blob: true, size: 3, grav: 260 },
  magic: { ramp: "arcane", add: true, size: 2, grav: -20 },
  void: { ramp: "void", add: true, size: 2, grav: -30 },
  snow: { ramp: "ice", blob: true, size: 3, grav: 120 },
  blood: { ramp: "blood", size: 2, grav: 320 },
};
export function hitBurst(g, e, from, crit, dead) {
  g.vfx ??= [];
  const mat = materials[e.type] || "blood",
    L = matLook[mat],
    away = Math.atan2(e.y - from.y, e.x - from.x),
    n = dead ? 26 : crit ? 12 : 6,
    R = Math.random;
  for (let i = 0; i < n; i++) {
    const a = away + (R() - 0.5) * (dead ? 6.2 : 1.6),
      sp = 40 + R() * (dead ? 110 : 80);
    push(g, { x: e.x, y: e.y, z: 12 + R() * 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 30 + R() * 70, grav: L.grav, bounce: L.bounce, life: 0.45 + R() * 0.5, size: L.size + R() * 1.5, ramp: L.ramp, add: L.add, blob: L.blob, shape: L.shape, drag: 1.2 });
  }
  if (L.leaf)
    for (let i = 0; i < (dead ? 8 : 2); i++) push(g, { x: e.x, y: e.y, z: 26, vx: (R() - 0.5) * 60, vy: (R() - 0.5) * 30, vz: 20, grav: 30, life: 1.1, size: 2, ramp: "poison", shape: "shard", drag: 1 });
  if (dead) {
    // A last puff, and for the undead and shadows a rising wisp of soul.
    for (let i = 0; i < 6; i++) push(g, { x: e.x + (R() - 0.5) * 20, y: e.y, z: 6, vx: (R() - 0.5) * 30, vy: (R() - 0.5) * 16, vz: 10, life: 0.9, size: 8, grow: 10, ramp: "smoke", alpha: 0.35, blob: true, drag: 1.5 });
    if (["bone", "void", "magic"].includes(mat))
      push(g, { x: e.x, y: e.y, z: 20, vx: 0, vy: 0, vz: 45, life: 1.2, size: 6, grow: -3, ramp: mat === "bone" ? "poison" : "void", add: true, blob: true, drag: 0.5 });
  }
}

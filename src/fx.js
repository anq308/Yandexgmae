import { drawFallingOrb, drawChargingLine } from "./skillvfx.js";
export function emitFx(g, type, x, y, color = "#e6d9a8", count = 18) {
  if (!g.sparks) g.sparks = [];
  for (let i = 0; i < count; i++) {
    const angle = i * 2.39996 + g.time * 0.6,
      speed = type === "trail" ? 15 : 25 + (i % 7) * 11,
      life = type === "phase" ? 1.2 : 0.35 + (i % 5) * 0.11;
    g.sparks.push({
      x,
      y: y - 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 18,
      life,
      maxLife: life,
      color,
      size: type === "phase" ? 3 : type === "crit" ? 3 : i % 4 === 0 ? 2 : 1,
      type,
      glow: ["crit", "loot", "phase", "heal"].includes(type),
    });
  }
  if (g.sparks.length > 400) g.sparks.splice(0, g.sparks.length - 400);
}
export function updateFx(g, dt) {
  for (const p of g.sparks) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += dt * 35;
  }
  g.sparks = g.sparks.filter((p) => p.life > 0);
}
export function drawHazard(c, h, time) {
  if (h.shape === "eclipse") {
    drawEclipseHazard(c, h, time);
    return;
  }
  c.save();
  c.translate(h.x, h.y);
  const pulsing = 0.18 + Math.sin(time * 12) * 0.06;
  c.fillStyle =
    h.color +
    (h.done
      ? "65"
      : Math.round(pulsing * 255)
          .toString(16)
          .padStart(2, "0"));
  c.strokeStyle = h.done ? "#fff3ce" : h.color;
  c.lineWidth = h.done ? 3 : 1.5;
  c.setLineDash(h.done ? [] : [5, 3]);
  c.beginPath();
  if (h.shape === "line" || h.shape === "volley") {
    c.rotate(h.angle);
    const width =
      h.shape === "volley"
        ? Math.max(25, h.range * Math.sin((h.count * h.spread) / 2))
        : h.width;
    if (h.shape === "volley") {
      c.moveTo(0, 0);
      c.lineTo(h.range, -width);
      c.lineTo(h.range, width);
      c.closePath();
    } else c.rect(0, -width, h.range, width * 2);
  } else if (h.shape === "cone") {
    c.moveTo(0, 0);
    c.arc(0, 0, h.radius, h.angle - h.arc, h.angle + h.arc);
    c.closePath();
  } else {
    c.arc(0, 0, h.radius, 0, Math.PI * 2);
    if (h.shape === "ring") c.arc(0, 0, h.inner, 0, Math.PI * 2, true);
  }
  c.fill("evenodd");
  c.stroke();
  c.setLineDash([]);
  if (!h.done && h.shape !== "line" && h.shape !== "volley") {
    c.strokeStyle = "#fff0bd";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(
      0,
      0,
      Math.max(8, h.radius * 0.38),
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * Math.min(1, h.age / (h.age + h.delay)),
    );
    c.stroke();
  }
  // A boss spell visibly falls from the sky onto its circle.
  if (!h.done && h.style && h.owner !== "weather" && (!h.shape || h.shape === "circle" || h.shape === "lightning"))
    drawFallingOrb(c, 0, 0, Math.min(1, h.age / (h.age + Math.max(0.001, h.delay))), h.style, time);
  if (h.shape === "lightning" && h.done) {
    c.strokeStyle = "#fff9dd";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(-15, -130);
    c.lineTo(10, -82);
    c.lineTo(-12, -52);
    c.lineTo(0, 0);
    c.stroke();
  }
  c.restore();
  if (!h.done && h.style && h.shape === "line" && h.owner !== "weather") drawChargingLine(c, h, time);
}
// Night pulse: the whole arena darkens except a few golden safe circles.
function drawEclipseHazard(c, h, time) {
  c.save();
  const charge = Math.min(1, h.age / (h.age + Math.max(0.001, h.delay)));
  c.fillStyle = h.done ? "#2a1a4acc" : `rgba(40,22,70,${0.18 + charge * 0.35})`;
  c.beginPath();
  c.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
  for (const z of h.safe || []) {
    c.moveTo(z.x + z.r, z.y);
    c.arc(z.x, z.y, z.r, 0, Math.PI * 2, true);
  }
  c.fill("evenodd");
  c.strokeStyle = "#a183ff";
  c.setLineDash([6, 4]);
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
  for (const z of h.safe || []) {
    const g = c.createRadialGradient(z.x, z.y, 2, z.x, z.y, z.r);
    g.addColorStop(0, "#fff3c0aa");
    g.addColorStop(1, "#ffd36a22");
    c.fillStyle = g;
    c.beginPath();
    c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#ffe08f";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(z.x, z.y, z.r - 1 + Math.sin(time * 6) * 1.5, 0, Math.PI * 2);
    c.stroke();
  }
  if (!h.done) {
    c.strokeStyle = "#fff0bd";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(h.x, h.y, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge);
    c.stroke();
  }
  c.restore();
}
export function drawSparks(c, g) {
  for (const p of g.sparks) {
    c.globalAlpha = Math.min(1, (p.life / p.maxLife) * 1.6);
    c.fillStyle = p.color;
    if (p.type === "lightning") {
      c.fillRect(p.x - 1, p.y - 5, 2, 12);
    } else if (p.glow || p.type === "crit") {
      const size = p.size * (0.5 + p.life / p.maxLife);
      c.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      c.globalAlpha *= 0.3;
      c.fillRect(p.x - size, p.y - size, size * 2, size * 2);
    } else c.fillRect(p.x, p.y, p.size, p.size);
  }
  c.globalAlpha = 1;
}
// Crescent swing: a filled arc that thins out along the swing direction.
// Special swing shapes for heavy weapons, spears, claws, whips and fists.
function drawStyledSlash(c, e) {
  const t = 1 - e.life / e.maxLife,
    fade = Math.min(1, (e.life / e.maxLife) * 1.8),
    ox = e.x,
    oy = e.y - 10,
    ca = Math.cos(e.angle),
    sa = Math.sin(e.angle),
    R = e.radius;
  c.save();
  c.globalAlpha = fade;
  if (e.style === "thrust") {
    const len = R * Math.min(1, t * 3.5);
    c.strokeStyle = e.color;
    c.lineWidth = 7;
    c.globalAlpha = fade * 0.35;
    c.beginPath();
    c.moveTo(ox + ca * 10, oy + sa * 10);
    c.lineTo(ox + ca * len, oy + sa * len);
    c.stroke();
    c.globalAlpha = fade;
    c.strokeStyle = "#ffffff";
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(ox + ca * len, oy + sa * len, 4 * fade + 1, 0, Math.PI * 2);
    c.fill();
  } else if (e.style === "heavy") {
    // A thick overhead crescent that crashes into the ground in front.
    const span = 0.7,
      sweep = Math.min(1, t * 2.6);
    c.fillStyle = e.color;
    c.globalAlpha = fade * 0.75;
    c.beginPath();
    c.arc(ox, oy, R, e.angle - span, e.angle - span + span * 2 * sweep);
    c.arc(ox, oy, R * 0.45, e.angle - span + span * 2 * sweep, e.angle - span, true);
    c.closePath();
    c.fill();
    if (t > 0.35) {
      const hx = ox + ca * R * 0.85,
        hy = oy + 10 + sa * R * 0.85,
        k = (t - 0.35) / 0.65;
      c.globalAlpha = (1 - k) * 0.9;
      c.strokeStyle = "#fff4d0";
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(hx, hy, 6 + k * 22, (6 + k * 22) * 0.45, 0, 0, Math.PI * 2);
      c.stroke();
    }
  } else if (e.style === "claw") {
    // Three parallel rakes across the target.
    const nx = -sa,
      ny = ca;
    for (let k = -1; k <= 1; k++) {
      const off = k * 6,
        a = Math.min(1, t * 3 - (k + 1) * 0.25);
      if (a <= 0) continue;
      const sx = ox + ca * R * 0.35 + nx * (off - 10),
        sy = oy + sa * R * 0.35 + ny * (off - 10),
        ex = ox + ca * R + nx * (off + 10),
        ey = oy + sa * R + ny * (off + 10);
      c.strokeStyle = e.color;
      c.lineWidth = 4;
      c.globalAlpha = fade * 0.5;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(sx + (ex - sx) * a, sy + (ey - sy) * a);
      c.stroke();
      c.strokeStyle = "#ffffff";
      c.lineWidth = 1.5;
      c.globalAlpha = fade;
      c.stroke();
    }
  } else if (e.style === "whip") {
    // A curling lash that snaps at the far end.
    const len = R * Math.min(1, t * 3),
      nx = -sa,
      ny = ca,
      bend = Math.sin(t * Math.PI) * 18;
    c.strokeStyle = e.color;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(ox + ca * 8, oy + sa * 8);
    c.quadraticCurveTo(ox + ca * len * 0.5 + nx * bend, oy + sa * len * 0.5 + ny * bend, ox + ca * len, oy + sa * len);
    c.stroke();
    if (t > 0.3) {
      c.fillStyle = "#fff4d0";
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        c.fillRect(ox + ca * len + Math.cos(a) * 5 * t, oy + sa * len + Math.sin(a) * 5 * t, 2, 2);
      }
    }
  } else if (e.style === "bite") {
    // Two rows of fangs snapping shut in front of the wolf.
    const px = ox + ca * R * 0.85,
      py = oy + sa * R * 0.85,
      gap = 14 * (1 - Math.min(1, t * 2.5)),
      nx = -sa,
      ny = ca;
    for (const side of [-1, 1]) {
      const bx = px + nx * gap * side,
        by = py + ny * gap * side;
      c.fillStyle = "#f4ead0";
      for (let k = -2; k <= 2; k++) {
        const fx = bx + ca * k * 5,
          fy = by + sa * k * 5;
        c.beginPath();
        c.moveTo(fx - ca * 2, fy - sa * 2);
        c.lineTo(fx + ca * 2, fy + sa * 2);
        c.lineTo(fx - nx * 6 * side, fy - ny * 6 * side);
        c.fill();
      }
    }
    if (t > 0.4) {
      c.globalAlpha = fade * (1 - t);
      c.fillStyle = "#c83a3a";
      for (let i = 0; i < 5; i++) c.fillRect(px + (Math.sin(i * 7) * 8), py + Math.cos(i * 3) * 6, 2, 2);
    }
  } else if (e.style === "fist") {
    // A punch: a star-shaped impact at fist range.
    const px = ox + ca * R * 0.8,
      py = oy + sa * R * 0.8,
      size = 6 + t * 14;
    c.fillStyle = "#fff4d0";
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2,
        d = i % 2 ? size * 0.4 : size;
      c.lineTo(px + Math.cos(a) * d, py + Math.sin(a) * d);
    }
    c.fill();
    c.strokeStyle = e.color;
    c.lineWidth = 2;
    c.stroke();
  }
  c.restore();
}
export function drawSlash(c, e) {
  if (["thrust", "heavy", "claw", "whip", "fist", "bite"].includes(e.style)) return drawStyledSlash(c, e);
  const t = 1 - e.life / e.maxLife,
    arc = e.arc || 1.2,
    start = e.angle - arc,
    sweep = arc * 2 * Math.min(1, t * 2.4),
    outer = e.radius * (0.82 + t * 0.22),
    inner = outer * (e.crit ? 0.55 : 0.68);
  c.save();
  c.globalAlpha = Math.min(1, (e.life / e.maxLife) * 1.8);
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    const a0 = start + (sweep * i) / steps,
      a1 = start + (sweep * (i + 1)) / steps,
      fade = (i + 1) / steps;
    c.fillStyle = e.color;
    c.globalAlpha = Math.min(1, (e.life / e.maxLife) * 1.8) * fade * 0.75;
    c.beginPath();
    c.arc(e.x, e.y - 10, outer, a0, a1);
    c.arc(e.x, e.y - 10, inner + (outer - inner) * (1 - fade) * 0.6, a1, a0, true);
    c.closePath();
    c.fill();
  }
  c.globalAlpha = Math.min(1, (e.life / e.maxLife) * 2);
  c.strokeStyle = e.crit ? "#fff3c4" : "#ffffffcc";
  c.lineWidth = e.crit || e.rarity === "legendary" ? 2 : 1;
  // Rare weapons leave sparkles along the swing; legendary ones a golden edge.
  if (e.rarity === "epic" || e.rarity === "legendary") {
    for (let i = 0; i < 6; i++) {
      const a = start + (sweep * i) / 5,
        rr = outer + Math.sin(i * 3.1) * 4;
      c.fillStyle = e.rarity === "legendary" ? "#ffe08a" : "#d8b8ff";
      c.fillRect(e.x + Math.cos(a) * rr - 1, e.y - 10 + Math.sin(a) * rr - 1, 2, 2);
    }
    if (e.rarity === "legendary") c.strokeStyle = "#ffe08a";
  }
  c.beginPath();
  c.arc(e.x, e.y - 10, outer, start, start + sweep);
  c.stroke();
  c.restore();
}
// Defeated enemies sink and break into rising motes instead of vanishing.
export function drawDeath(c, e, time, drawEnemyFn) {
  const t = 1 - e.life / e.maxLife,
    m = e.enemy;
  c.save();
  c.globalAlpha = Math.max(0, 1 - t * 1.25);
  c.translate(m.x, m.y);
  c.scale(1 + t * 0.15, 1 - t * 0.35);
  c.translate(-m.x, -m.y);
  if (c.filter !== undefined) c.filter = `brightness(${1 + t * 1.5}) saturate(${1 - t})`;
  drawEnemyFn(c, { ...m, hp: m.maxHp, windup: 0, slow: 0, mark: 0, stun: 0 }, time);
  if (c.filter !== undefined) c.filter = "none";
  c.restore();
  c.save();
  const count = m.boss ? 26 : 10;
  for (let i = 0; i < count; i++) {
    const a = i * 2.39996,
      r = (m.boss ? 30 : 12) * (0.4 + (i % 4) * 0.2),
      x = m.x + Math.cos(a) * r * (1 + t),
      y = m.y - 12 + Math.sin(a) * r * 0.5 - t * (28 + (i % 5) * 9);
    c.globalAlpha = Math.max(0, 1 - t) * 0.9;
    c.fillStyle = i % 3 ? m.color || "#e8dfb5" : "#fff6d8";
    c.fillRect(x, y, i % 4 ? 2 : 3, i % 4 ? 2 : 3);
  }
  c.restore();
}
export function drawLevelUp(c, e, time) {
  const t = 1 - e.life / e.maxLife,
    alpha = Math.sin(Math.min(1, t) * Math.PI);
  c.save();
  const g = c.createLinearGradient(e.x, e.y - 140, e.x, e.y);
  g.addColorStop(0, "#fff3c000");
  g.addColorStop(0.6, "#ffe9a055");
  g.addColorStop(1, "#ffe9a0aa");
  c.globalAlpha = alpha;
  c.fillStyle = g;
  c.fillRect(e.x - 14 - t * 6, e.y - 140, 28 + t * 12, 142);
  c.strokeStyle = "#ffe39a";
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(e.x, e.y, 14 + t * 40, 5 + t * 14, 0, 0, Math.PI * 2);
  c.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + time * 3;
    c.fillStyle = "#fff6cf";
    c.fillRect(e.x + Math.cos(a) * 18, e.y - 20 - t * 70 - (i % 3) * 10, 2, 2);
  }
  c.restore();
}
// Screen-space red edge when health is low.
export function drawVignette(c, w, h, danger, time) {
  if (danger <= 0) return;
  const pulse = 0.75 + Math.sin(time * 6) * 0.25,
    g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7);
  g.addColorStop(0, "rgba(120,10,10,0)");
  g.addColorStop(1, `rgba(140,18,18,${0.45 * danger * pulse})`);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}
const lightCanvas =
  typeof document !== "undefined" ? document.createElement("canvas") : null;
// Collects every light in view: hero, campfires, lamps, torches, magic and loot.
export function lightSources(g, cx, cy, w, h) {
  const s = g.save,
    list = [{ x: s.x, y: s.y - 10, r: s.activeDungeon ? 150 : 120, color: "#ffe0a8", power: 1 }];
  for (const o of g.world.getObjectsInRect(cx - 120, cy - 120, w + 240, h + 240)) {
    if (o.type === "camp")
      list.push({ x: o.x, y: o.y - 8, r: 150 + Math.sin(g.time * 9 + o.x) * 6, color: "#ffb35c", power: 1 });
    else if (o.type === "lamp")
      list.push({ x: o.x, y: o.y - 22, r: 95, color: "#ffd88a", power: 0.9 });
    else if (o.type === "furniture" && (o.kind === "fireplace" || o.kind === "furnace"))
      list.push({ x: o.x, y: o.y - 14, r: 170 + Math.sin(g.time * 8) * 6, color: "#ffb35c", power: 1 });
    else if (o.type === "furniture" && o.kind === "window")
      list.push({ x: o.x, y: o.y + 10, r: 90, color: "#d8eaff", power: 0.7 });
    else if (o.type === "furniture" && (o.kind === "candle" || o.kind === "lantern"))
      list.push({ x: o.x, y: o.y - (o.kind === "lantern" ? 50 : 26), r: o.kind === "lantern" ? 85 : 60, color: "#ffcf7a", power: 0.8 });
    else if (o.type === "torch")
      list.push({ x: o.x, y: o.y - 20, r: 115 + Math.sin(g.time * 11 + o.y) * 5, color: o.color || "#ffc27a", power: 0.95 });
    else if (o.type === "crystal" && !g.collected.has(o.id))
      list.push({ x: o.x, y: o.y - 12, r: 55, color: "#9ee8ef", power: 0.6 });
    else if ((o.type === "rune" || o.type === "altar") && s.flags?.[o.id])
      list.push({ x: o.x, y: o.y - 24, r: 120, color: "#f3d787", power: 0.8 });
    else if (o.type === "altar")
      list.push({ x: o.x, y: o.y - 24, r: 80, color: "#91dacf", power: 0.6 });
    else if (o.type === "entrance")
      list.push({ x: o.x, y: o.y - 20, r: 70, color: "#c9b6ef", power: 0.6 });
  }
  for (const p of g.projectiles)
    if (p.type === "magic") list.push({ x: p.x, y: p.y, r: 42, color: p.color || "#b3e8eb", power: 0.7 });
  for (const d of g.activeLoot) list.push({ x: d.x, y: d.y - 14, r: 80, color: "#efd384", power: 0.8 });
  for (const e of g.enemies)
    if (e.hp > 0 && (e.type === "wisp" || e.boss || e.type === "herald") && Math.abs(e.x - s.x) < w && Math.abs(e.y - s.y) < h)
      list.push({ x: e.x, y: e.y - 20, r: e.boss ? 120 : 60, color: e.color || "#9abade", power: e.type === "eclipse" ? 0.25 : 0.6 });
  for (const z of g.zones)
    if (z.type === "meteor" || z.type === "trap") list.push({ x: z.x, y: z.y, r: z.radius + 20, color: z.color, power: 0.55 });
  for (const h of g.hazards) if (h.done) list.push({ x: h.x, y: h.y, r: 90, color: h.color, power: 0.7 });
  return list;
}
export function drawClimate(c, g, cx, cy, w, h) {
  const s = g.save;
  if (!s) return;
  const cl = g.climate;
  const dark = Math.min(0.82, cl.dark + (g.eclipseDark || 0));
  if (dark > 0.06 && lightCanvas) {
    if (lightCanvas.width !== w || lightCanvas.height !== h) {
      lightCanvas.width = w;
      lightCanvas.height = h;
    }
    const l = lightCanvas.getContext("2d"),
      lights = lightSources(g, cx, cy, w, h);
    l.globalCompositeOperation = "source-over";
    l.clearRect(0, 0, w, h);
    l.fillStyle = `rgba(9,15,30,${dark})`;
    l.fillRect(0, 0, w, h);
    l.globalCompositeOperation = "destination-out";
    for (const p of lights) {
      const x = p.x - cx,
        y = p.y - cy;
      if (x < -p.r || y < -p.r || x > w + p.r || y > h + p.r) continue;
      const grad = l.createRadialGradient(x, y, 0, x, y, p.r);
      grad.addColorStop(0, `rgba(0,0,0,${p.power})`);
      grad.addColorStop(0.45, `rgba(0,0,0,${p.power * 0.65})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      l.fillStyle = grad;
      l.fillRect(x - p.r, y - p.r, p.r * 2, p.r * 2);
    }
    c.drawImage(lightCanvas, cx, cy);
    // Warm additive glow so light sources tint their surroundings.
    c.save();
    c.globalCompositeOperation = "lighter";
    for (const p of lights.slice(1)) {
      const grad = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 0.6);
      grad.addColorStop(0, hexAlpha(p.color, 0.22 * dark * p.power));
      grad.addColorStop(1, hexAlpha(p.color, 0));
      c.fillStyle = grad;
      c.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    c.restore();
  }
  if (!(s.activeDungeon || s.interior) && (cl.season === "autumn" || cl.season === "spring") && cl.weather !== "snow") {
    // Falling leaves in autumn, drifting petals in spring.
    const autumn = cl.season === "autumn";
    for (let i = 0; i < 26; i++) {
      const x = cx + ((i * 131 + g.time * (18 + (i % 5) * 4)) % (w + 40)) - 20,
        y = cy + ((i * 71 + g.time * (22 + (i % 3) * 6)) % (h + 20)) - 10,
        sway = Math.sin(g.time * 2 + i) * 4;
      c.fillStyle = autumn ? ["#d8843a", "#b4542a", "#f0b050"][i % 3] : ["#f4c8d8", "#fff0f4", "#e8b0c8"][i % 3];
      c.fillRect(x + sway, y, autumn ? 3 : 2, 2);
    }
  }
  if (!(s.activeDungeon || s.interior) && cl.sunset > 0) {
    // Warm golden light around sunrise and sunset.
    c.fillStyle = `rgba(255,150,60,${cl.sunset * 0.12})`;
    c.fillRect(cx, cy, w, h);
  }
  if (cl.weather === "fog") {
    for (let i = 0; i < 7; i++) {
      const x = cx + ((i * 139 + g.time * 8) % (w + 160)) - 80,
        y = cy + ((i * 83) % h);
      c.fillStyle = "#b6c7be0a";
      c.beginPath();
      c.ellipse(x, y, 130, 22, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  if (!(s.activeDungeon || s.interior) && ["rain", "storm", "snow"].includes(cl.weather)) {
    const snow = cl.weather === "snow";
    c.strokeStyle = snow ? "#e1edf5aa" : "#c1d5e775";
    c.lineWidth = 1;
    for (let i = 0; i < 85; i++) {
      const x = cx + ((i * 47 + g.time * (snow ? 11 + Math.sin(i) * 4 : 49)) % w),
        y = cy + ((i * 83 + g.time * (snow ? 24 : 210)) % h);
      if (snow) ((c.fillStyle = "#e4ebd9"), c.fillRect(x + Math.sin(g.time * 2 + i) * 3, y, i % 3 ? 2 : 1, i % 3 ? 2 : 1));
      else {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 4, y + 11);
        c.stroke();
        if (i % 9 === 0) {
          // Splashes where drops land.
          c.fillStyle = "#d4e3ee66";
          c.fillRect(x - 6, cy + ((i * 37 + Math.floor(g.time * 4) * 53) % h), 3, 1);
        }
      }
    }
    if (cl.weather === "storm" && Math.sin(g.time * 0.7) > 0.995) {
      c.fillStyle = "#eef2ff30";
      c.fillRect(cx, cy, w, h);
    }
  }
}
function hexAlpha(hex, alpha) {
  const v = parseInt((hex || "#ffffff").slice(1, 7), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${Math.max(0, Math.min(1, alpha))})`;
}
// Class dodge visuals: portals, graves, holy streaks, leaf rolls and dust.
export function drawDodge(c, e, time) {
  const t = 1 - e.life / e.maxLife,
    fade = Math.min(1, (e.life / e.maxLife) * 2);
  c.save();
  if (e.style === "portal") {
    // Swirling violet ring that opens, then closes.
    const open = Math.sin(Math.min(1, t * 1.2) * Math.PI),
      rx = 16 * open + 2,
      ry = 24 * open + 2;
    c.globalAlpha = fade;
    const g = c.createRadialGradient(e.x, e.y - 16, 1, e.x, e.y - 16, ry);
    g.addColorStop(0, "#1a0a2e");
    g.addColorStop(0.7, "#6a3ad0aa");
    g.addColorStop(1, "#c8a8ff00");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(e.x, e.y - 16, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#e0c8ff";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(e.x, e.y - 16, rx, ry, 0, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = time * 7 + (i / 8) * Math.PI * 2;
      c.fillStyle = i % 2 ? "#c8a8ff" : "#fff";
      c.fillRect(e.x + Math.cos(a) * rx - 1, e.y - 16 + Math.sin(a) * ry - 1, 2, 2);
    }
  } else if (e.style === "grave") {
    // Disturbed earth, grasping bone hands and green mist.
    const rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
    c.globalAlpha = fade;
    c.fillStyle = "#4a3824";
    c.beginPath();
    c.ellipse(e.x, e.y + 1, 18, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#6b5234";
    c.beginPath();
    c.ellipse(e.x, e.y, 14, 4, 0, 0, Math.PI * 2);
    c.fill();
    for (const [dx, h] of [
      [-10, 10],
      [9, 12],
    ]) {
      const hy = e.y - h * rise;
      c.fillStyle = "#e8e2cc";
      c.fillRect(e.x + dx, hy, 2, h * rise);
      c.fillRect(e.x + dx - 2, hy - 2, 2, 3);
      c.fillRect(e.x + dx + 2, hy - 3, 2, 3);
      c.fillRect(e.x + dx, hy - 4, 2, 3);
    }
    c.globalAlpha = fade * 0.5;
    for (let i = 0; i < 6; i++) {
      c.fillStyle = "#9fe0a0";
      c.fillRect(e.x - 14 + i * 5, e.y - 6 - ((t * 30 + i * 7) % 18), 3, 3);
    }
  } else if (e.style === "holyDash") {
    const len = 70 * Math.min(1, t * 3);
    c.globalAlpha = fade * 0.8;
    c.strokeStyle = "#ffe08a";
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(e.x, e.y - 14);
    c.lineTo(e.x + Math.cos(e.angle) * len, e.y - 14 + Math.sin(e.angle) * len);
    c.stroke();
    c.strokeStyle = "#fffbe0";
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = "#ffe08a";
    for (let i = 0; i < 4; i++) {
      const d = len * (i / 4);
      c.fillRect(e.x + Math.cos(e.angle) * d - 1, e.y - 26 + Math.sin(e.angle) * d, 2, 6);
    }
  } else if (e.style === "roll") {
    c.globalAlpha = fade;
    for (let i = 0; i < 7; i++) {
      const d = 60 * t * (i / 7),
        x = e.x + Math.cos(e.angle) * d + Math.sin(i * 3) * 6,
        y = e.y - 4 + Math.sin(e.angle) * d + Math.cos(i * 2) * 4;
      c.fillStyle = i % 2 ? "#8fd06a" : "#c8e88a";
      c.fillRect(x, y, 3, 2);
    }
  } else {
    c.globalAlpha = fade * 0.7;
    for (let i = 0; i < 6; i++) {
      const d = 50 * t * (i / 6);
      c.fillStyle = "#cbb88e";
      c.beginPath();
      c.arc(e.x + Math.cos(e.angle) * d, e.y + Math.sin(e.angle) * d, 3 + t * 5, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

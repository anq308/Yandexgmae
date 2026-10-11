// Element-specific visuals for projectiles, ground zones, casts and impacts.
const R = (c, x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
export const elementColors = {
  fire: ["#ff7a2a", "#ffd06a", "#fff4c0"],
  ice: ["#6ac8f0", "#c8f2ff", "#ffffff"],
  lightning: ["#a070ff", "#e0ccff", "#ffffff"],
  poison: ["#5aa83a", "#b4e67e", "#e8ffc8"],
  void: ["#5a2a9a", "#b48cff", "#f0e0ff"],
  light: ["#e8b02a", "#ffe08a", "#fffbe0"],
  bone: ["#a8a490", "#e8e2cc", "#ffffff"],
  arcane: ["#4a8ae8", "#a8d8ff", "#ffffff"],
  physical: ["#a08860", "#e8d8b0", "#ffffff"],
};
const glow = (c, x, y, r, col, a = 0.5) => {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col + Math.round(a * 255).toString(16).padStart(2, "0"));
  g.addColorStop(1, col + "00");
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
};
// Projectile sprites, drawn rotated along their flight direction.
export function drawProjectile(c, p, time) {
  const style = p.style || (p.type === "arrow" ? "arrow" : p.element || "arcane"),
    [dark, mid, core] = elementColors[style] || [p.color, p.color, "#ffffff"];
  c.save();
  c.translate(p.x, p.y);
  // Hostile spells are larger and pulse, so they read clearly against the ground.
  if (p.enemy && style !== "arrow") {
    glow(c, 0, 0, 20 + Math.sin(time * 14) * 3, mid.slice(0, 7), 0.35);
    c.scale(1.4, 1.4);
  }
  const angle = Math.atan2(p.vy, p.vx);
  if (style !== "arrow" && style !== "bone") glow(c, 0, 0, 14, mid.slice(0, 7), 0.45);
  c.rotate(angle);
  if (style === "axe") {
    // A thrown woodcutter's axe, spinning end over end.
    c.rotate(time * 18);
    R(c, -1, -8, 2, 14, "#6a4428");
    R(c, -1, -9, 7, 5, "#b8c4c8");
    R(c, 4, -9, 2, 5, "#e8f0f0");
    c.restore();
    return;
  }
  if (style === "arrow") {
    R(c, -12, -0.5, 14, 1, p.enemy ? "#8a5a3a" : "#c8a070");
    c.fillStyle = p.enemy ? "#d0704a" : "#e8f0f0";
    c.beginPath();
    c.moveTo(6, 0);
    c.lineTo(1, -3);
    c.lineTo(1, 3);
    c.fill();
    R(c, -13, -2, 3, 1, p.color || "#e04a3a");
    R(c, -13, 1, 3, 1, p.color || "#e04a3a");
    c.globalAlpha = 0.3;
    R(c, -24, -0.5, 10, 1, "#ffffff");
  } else if (style === "bone") {
    R(c, -10, -1, 16, 2, "#e8e2cc");
    R(c, -12, -2, 3, 4, "#d8d2bc");
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.moveTo(9, 0);
    c.lineTo(4, -3);
    c.lineTo(4, 3);
    c.fill();
    c.globalAlpha = 0.4;
    R(c, -22, -1, 10, 2, "#9fe0a0");
  } else if (style === "fire") {
    for (let i = 0; i < 5; i++) {
      const f = Math.sin(time * 30 + i) * 1.5;
      R(c, -6 - i * 3, -2 + f * 0.5, 3, 3 + (i % 2), i % 2 ? dark : mid);
    }
    c.fillStyle = dark;
    c.beginPath();
    c.arc(0, 0, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = mid;
    c.beginPath();
    c.arc(1, 0, 3.5, 0, Math.PI * 2);
    c.fill();
    R(c, 0, -1, 2, 2, core);
  } else if (style === "ice") {
    c.fillStyle = dark;
    c.beginPath();
    c.moveTo(8, 0);
    c.lineTo(0, -3);
    c.lineTo(-9, 0);
    c.lineTo(0, 3);
    c.fill();
    c.fillStyle = mid;
    c.beginPath();
    c.moveTo(7, 0);
    c.lineTo(0, -1.5);
    c.lineTo(-6, 0);
    c.fill();
    R(c, 3, -1, 2, 1, core);
  } else if (style === "lightning") {
    c.strokeStyle = mid;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-14, 0);
    for (let i = 1; i <= 5; i++) c.lineTo(-14 + i * 4, (Math.sin(time * 60 + i * 2.3) * 3) | 0);
    c.stroke();
    c.strokeStyle = core;
    c.lineWidth = 1;
    c.stroke();
    R(c, 4, -2, 4, 4, core);
  } else if (style === "poison") {
    c.fillStyle = dark;
    c.beginPath();
    c.ellipse(0, 0, 5, 4, 0, 0, Math.PI * 2);
    c.fill();
    R(c, -1, -2, 3, 2, mid);
    for (let i = 0; i < 3; i++) R(c, -6 - i * 4, Math.sin(time * 9 + i) * 2, 2, 2, mid);
  } else if (style === "void") {
    c.fillStyle = "#14081e";
    c.beginPath();
    c.arc(0, 0, 4.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = mid;
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(0, 0, 6, time * 8, time * 8 + 4);
    c.stroke();
    R(c, -1, -1, 2, 2, core);
  } else if (style === "light") {
    c.fillStyle = mid;
    for (let i = 0; i < 4; i++) {
      c.save();
      c.rotate(time * 6 + (i * Math.PI) / 2);
      c.fillRect(-1, -7, 2, 14);
      c.restore();
    }
    c.fillStyle = core;
    c.beginPath();
    c.arc(0, 0, 3.5, 0, Math.PI * 2);
    c.fill();
  } else {
    c.fillStyle = dark;
    c.beginPath();
    c.arc(0, 0, 4.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = mid;
    c.beginPath();
    c.arc(0.5, 0, 3, 0, Math.PI * 2);
    c.fill();
    R(c, 0, -1, 2, 2, core);
    for (let i = 0; i < 3; i++) R(c, -6 - i * 4, -1, 3 - i, 2, mid);
  }
  c.restore();
}
// Ground zones: traps, hallowed ground, poison pools, frost fields and meteors.
export function drawZone(c, z, time) {
  if (z.type === "charge") return;
  const style = z.style || "arcane",
    [dark, mid, core] = elementColors[style] || [z.color, z.color, "#ffffff"],
    fade = Math.min(1, z.life * 2);
  c.save();
  c.globalAlpha = fade;
  if (z.type === "meteor") {
    // Shadow grows under a falling rock; the strike lands when life ends.
    const fall = z.fall || 0.7;
    if (z.life > fall) {
      c.globalAlpha = 0.35;
      c.strokeStyle = mid;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.ellipse(z.x, z.y, z.radius, z.radius * 0.45, 0, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.restore();
      return;
    }
    const t = 1 - Math.max(0, z.life) / fall;
    if (z.shape === "arrow" || z.shape === "hammer" || z.shape === "skull" || z.shape === "rocket") {
      c.fillStyle = `rgba(0,0,0,${0.15 + t * 0.35})`;
      c.beginPath();
      c.ellipse(z.x, z.y, z.radius * 0.5 * (0.4 + t * 0.6), z.radius * 0.2, 0, 0, Math.PI * 2);
      c.fill();
      const fy = z.y - (1 - t) * 170;
      if (z.shape === "arrow")
        for (let k = -1; k <= 1; k++) {
          R(c, z.x + k * 7, fy - 22 + Math.abs(k) * 6, 1, 18, "#c8a070");
          R(c, z.x + k * 7 - 2, fy - 4 + Math.abs(k) * 6, 5, 4, "#e8f0f0");
          R(c, z.x + k * 7 - 1, fy - 24 + Math.abs(k) * 6, 3, 3, "#e04a3a");
        }
      else if (z.shape === "rocket") {
        // A brass rocket diving nose-first with a trail of fire.
        R(c, z.x - 3, fy - 18, 6, 16, "#8a9098");
        R(c, z.x - 2, fy - 18, 2, 16, "#c8d0d8");
        R(c, z.x - 3, fy - 2, 6, 4, "#c84a2a");
        R(c, z.x - 5, fy - 20, 10, 3, "#c8a050");
        glow(c, z.x, fy - 26, 12, "#ff8a2a", 0.8);
        for (let i = 1; i < 5; i++) R(c, z.x - 2 + Math.sin(time * 30 + i) * 2, fy - 22 - i * 6, 4, 4, i % 2 ? "#ffd04a" : "#ff6a10");
      } else if (z.shape === "hammer") {
        glow(c, z.x, fy, 20, mid.slice(0, 7), 0.7);
        R(c, z.x - 1, fy - 14, 3, 16, "#f4ead0");
        R(c, z.x - 8, fy - 20, 17, 9, mid);
        R(c, z.x - 7, fy - 19, 15, 2, core);
      } else {
        glow(c, z.x, fy, 18, "#9fe0a0", 0.6);
        R(c, z.x - 6, fy - 8, 12, 10, "#e8e2cc");
        R(c, z.x - 4, fy - 5, 3, 3, "#14121a");
        R(c, z.x + 1, fy - 5, 3, 3, "#14121a");
        for (let i = 1; i < 5; i++) R(c, z.x - 1, fy - 10 - i * 8, 3, 4, "#9fe0a0");
      }
      c.restore();
      return;
    }
    c.fillStyle = `rgba(0,0,0,${0.15 + t * 0.35})`;
    c.beginPath();
    c.ellipse(z.x, z.y, z.radius * (0.3 + t * 0.7), z.radius * 0.35 * (0.3 + t * 0.7), 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = mid;
    c.setLineDash([6, 4]);
    c.beginPath();
    c.ellipse(z.x, z.y, z.radius, z.radius * 0.45, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    const fy = z.y - (1 - t) * 160,
      fx = z.x + (1 - t) * 60;
    glow(c, fx, fy, 22, mid.slice(0, 7), 0.6);
    for (let i = 1; i < 6; i++) R(c, fx + i * 6, fy - i * 14, 5 - i * 0.6, 5 - i * 0.6, i % 2 ? dark : mid);
    c.fillStyle = style === "light" ? mid : "#6a4a3a";
    c.beginPath();
    c.arc(fx, fy, 8, 0, Math.PI * 2);
    c.fill();
    R(c, fx - 3, fy - 3, 4, 4, core);
    c.restore();
    return;
  }
  // Base disc.
  c.fillStyle = dark + "30";
  c.beginPath();
  c.ellipse(z.x, z.y, z.radius, z.radius * 0.55, 0, 0, Math.PI * 2);
  c.fill();
  if (z.pull || style === "void") {
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = i % 2 ? mid : "#14081e";
      c.lineWidth = 2;
      c.beginPath();
      for (let a = 0; a < Math.PI * 4; a += 0.3) {
        const r = (a / (Math.PI * 4)) * z.radius;
        const x = z.x + Math.cos(a - time * 3 + i * 2) * r,
          y = z.y + Math.sin(a - time * 3 + i * 2) * r * 0.55;
        a ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
  } else if (style === "light") {
    // Rotating rune circle.
    c.strokeStyle = mid;
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(z.x, z.y, z.radius, z.radius * 0.55, 0, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.ellipse(z.x, z.y, z.radius * 0.7, z.radius * 0.38, 0, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = time + (i * Math.PI) / 4;
      R(c, z.x + Math.cos(a) * z.radius * 0.85 - 2, z.y + Math.sin(a) * z.radius * 0.47 - 3, 4, 6, core);
    }
    c.globalAlpha = fade * (0.4 + Math.sin(time * 6) * 0.2);
    for (let i = 0; i < 5; i++) R(c, z.x - z.radius * 0.6 + i * z.radius * 0.3, z.y - 20 - ((time * 30 + i * 9) % 30), 2, 6, mid);
  } else if (style === "poison") {
    c.fillStyle = dark + "70";
    c.beginPath();
    c.ellipse(z.x, z.y, z.radius * 0.9, z.radius * 0.5, 0, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 9; i++) {
      const life = (time * 0.8 + i / 9) % 1,
        a = i * 2.4;
      c.globalAlpha = fade * (1 - life);
      c.strokeStyle = mid;
      c.beginPath();
      c.arc(z.x + Math.cos(a) * z.radius * 0.6, z.y + Math.sin(a) * z.radius * 0.3 - life * 10, 2 + life * 3, 0, Math.PI * 2);
      c.stroke();
    }
  } else if (style === "fire") {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2,
        h = 6 + Math.abs(Math.sin(time * 10 + i)) * 8;
      const x = z.x + Math.cos(a) * z.radius * 0.85,
        y = z.y + Math.sin(a) * z.radius * 0.47;
      R(c, x - 2, y - h, 4, h, i % 2 ? dark : mid);
      R(c, x - 1, y - h - 2, 2, 3, core);
    }
  } else if (style === "ice") {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const x = z.x + Math.cos(a) * z.radius * 0.8,
        y = z.y + Math.sin(a) * z.radius * 0.44;
      c.fillStyle = i % 2 ? mid : core;
      c.beginPath();
      c.moveTo(x, y - 12);
      c.lineTo(x + 3, y);
      c.lineTo(x - 3, y);
      c.fill();
    }
  } else if (z.type === "trap") {
    // Steel jaws with teeth.
    c.strokeStyle = "#8d9ba3";
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(z.x, z.y, z.radius * 0.5, z.radius * 0.28, 0, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      R(c, z.x + Math.cos(a) * z.radius * 0.5 - 1, z.y + Math.sin(a) * z.radius * 0.28 - 4, 2, 4, "#d7e0e2");
    }
    c.strokeStyle = z.color;
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.ellipse(z.x, z.y, z.radius, z.radius * 0.55, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
  } else {
    c.strokeStyle = z.color;
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(z.x, z.y, z.radius, z.radius * 0.55, time, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}
// A brief rune circle under the hero whenever a spell is cast.
export function drawCast(c, e, time) {
  const t = 1 - e.life / e.maxLife,
    r = 14 + t * 22,
    [, mid, core] = elementColors[e.style] || [e.color, e.color, "#fff"];
  c.save();
  c.globalAlpha = Math.max(0, 1 - t);
  c.strokeStyle = mid;
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(e.x, e.y, r, r * 0.45, 0, 0, Math.PI * 2);
  c.stroke();
  for (let i = 0; i < 6; i++) {
    const a = time * 4 + (i * Math.PI) / 3;
    R(c, e.x + Math.cos(a) * r - 1, e.y + Math.sin(a) * r * 0.45 - 1, 3, 3, core);
  }
  for (let i = 0; i < 5; i++) R(c, e.x - 12 + i * 6, e.y - 10 - t * 30 - (i % 2) * 8, 2, 5, mid);
  c.restore();
}

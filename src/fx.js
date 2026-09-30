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
      size: type === "phase" ? 3 : i % 4 === 0 ? 2 : 1,
      type,
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
}
export function drawSparks(c, g) {
  for (const p of g.sparks) {
    c.globalAlpha = Math.min(1, (p.life / p.maxLife) * 1.6);
    c.fillStyle = p.color;
    if (p.type === "lightning") {
      c.fillRect(p.x - 1, p.y - 5, 2, 12);
    } else c.fillRect(p.x, p.y, p.size, p.size);
  }
  c.globalAlpha = 1;
}
export function drawClimate(c, g, cx, cy, w, h) {
  const s = g.save;
  if (!s) return;
  const cl = g.climate;
  const dark = cl.dark,
    light = c.createRadialGradient(
      s.x,
      s.y - 10,
      65,
      s.x,
      s.y - 10,
      g.save.activeDungeon ? 235 : 290,
    );
  light.addColorStop(0, `rgba(9,15,30,${dark * 0.1})`);
  light.addColorStop(0.55, `rgba(9,15,30,${dark * 0.45})`);
  light.addColorStop(1, `rgba(9,15,30,${dark})`);
  c.fillStyle = light;
  c.fillRect(cx, cy, w, h);
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
  if (!s.activeDungeon && ["rain", "storm", "snow"].includes(cl.weather)) {
    const snow = cl.weather === "snow";
    c.strokeStyle = snow ? "#e1edf5aa" : "#c1d5e775";
    c.lineWidth = 1;
    for (let i = 0; i < 85; i++) {
      const x = cx + ((i * 47 + g.time * (snow ? 11 : 49)) % w),
        y = cy + ((i * 83 + g.time * (snow ? 24 : 210)) % h);
      if (snow) ((c.fillStyle = "#e4ebd9"), c.fillRect(x, y, 2, 2));
      else {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 4, y + 11);
        c.stroke();
      }
    }
  }
}

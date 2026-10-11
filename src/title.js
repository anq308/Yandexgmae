import { drawHero } from "./art.js";
// Animated pixel-art title scene: night sky, moon, a citadel on a cliff, pine
// silhouettes and a lone hero by a campfire. Drawn at low resolution and scaled.
const W = 320,
  H = 180;
const hash = (n) => Math.abs(Math.sin(n * 127.1) * 43758.5453) % 1;
const stars = Array.from({ length: 70 }, (_, i) => ({
  x: Math.floor(hash(i) * W),
  y: Math.floor(hash(i + 99) * 90),
  p: hash(i + 7) * 6,
  big: hash(i + 3) > 0.9,
}));
const embers = Array.from({ length: 26 }, (_, i) => ({ seed: i, off: hash(i + 40) }));
function ridge(c, base, amp, step, seed, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, H);
  for (let x = 0; x <= W; x += step) {
    const y = base - Math.abs(Math.sin(x * 0.021 + seed) * amp) - Math.abs(Math.sin(x * 0.067 + seed * 2) * amp * 0.4);
    c.lineTo(x, Math.round(y));
  }
  c.lineTo(W, H);
  c.fill();
}
function pine(c, x, y, h, color) {
  c.fillStyle = color;
  for (let i = 0; i < h; i += 2) {
    const w = Math.round(((i / h) * h) / 3) + 1;
    c.fillRect(x - w, y - h + i, w * 2 + 1, 2);
  }
  c.fillRect(x, y, 1, 3);
}
export function drawTitleScene(canvas, t, hero) {
  const c = canvas.getContext("2d");
  if (canvas.width !== W) {
    canvas.width = W;
    canvas.height = H;
  }
  c.imageSmoothingEnabled = false;
  // Sky: deep violet into a warm horizon.
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#0b0a1a");
  sky.addColorStop(0.45, "#241a3a");
  sky.addColorStop(0.7, "#5a2e3a");
  sky.addColorStop(0.85, "#a0503a");
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  for (const s of stars) {
    const a = 0.4 + Math.sin(t * 2 + s.p) * 0.4;
    c.fillStyle = `rgba(255,240,210,${Math.max(0.1, a)})`;
    c.fillRect(s.x, s.y, s.big ? 2 : 1, s.big ? 2 : 1);
  }
  // Moon with a soft halo.
  const mx = 242,
    my = 38;
  const halo = c.createRadialGradient(mx, my, 6, mx, my, 46);
  halo.addColorStop(0, "#fff1c855");
  halo.addColorStop(1, "#fff1c800");
  c.fillStyle = halo;
  c.fillRect(mx - 50, my - 50, 100, 100);
  c.fillStyle = "#f6e8c4";
  c.beginPath();
  c.arc(mx, my, 14, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#e0cfa4";
  c.fillRect(mx - 6, my - 4, 4, 3);
  c.fillRect(mx + 3, my + 4, 5, 3);
  // Distant mountains.
  ridge(c, 120, 38, 4, 1.2, "#2a1f3a");
  ridge(c, 132, 26, 3, 2.7, "#211830");
  // Citadel on a rocky cliff: keep, towers, battlements, banners, lit windows.
  const stone = "#1a1326",
    rim = "#3a2c52";
  c.fillStyle = "#120d1c";
  c.beginPath();
  c.moveTo(20, 140);
  c.lineTo(34, 112);
  c.lineTo(52, 104);
  c.lineTo(104, 106);
  c.lineTo(118, 122);
  c.lineTo(126, 140);
  c.fill();
  const tower = (x, top, w, h, roof) => {
    c.fillStyle = stone;
    c.fillRect(x, top, w, h);
    c.fillStyle = rim;
    c.fillRect(x + w - 1, top, 1, h);
    if (roof) {
      c.fillStyle = "#24183a";
      c.beginPath();
      c.moveTo(x - 2, top);
      c.lineTo(x + w / 2, top - roof);
      c.lineTo(x + w + 2, top);
      c.fill();
      c.fillStyle = rim;
      c.fillRect(x + w / 2, top - roof, 1, roof);
    } else
      for (let i = 0; i < w; i += 3) {
        c.fillStyle = stone;
        c.fillRect(x + i, top - 2, 2, 2);
      }
  };
  tower(56, 80, 34, 28, 0);
  tower(44, 66, 10, 42, 14);
  tower(92, 58, 10, 50, 16);
  tower(70, 70, 8, 12, 10);
  c.fillStyle = stone;
  c.fillRect(38, 96, 72, 12);
  for (let i = 0; i < 72; i += 4) c.fillRect(38 + i, 94, 2, 2);
  // Gate and bridge.
  c.fillStyle = "#06040a";
  c.fillRect(68, 98, 8, 10);
  c.fillStyle = "#2a1f3a";
  c.fillRect(60, 108, 24, 2);
  // Banners waving on the tall towers.
  for (const [x, y] of [[49, 52], [97, 42]]) {
    c.fillStyle = "#3a2c52";
    c.fillRect(x, y, 1, 6);
    const wave = Math.round(Math.sin(t * 4 + x) * 1);
    c.fillStyle = "#a3281f";
    c.fillRect(x + 1, y + wave, 5, 3);
  }
  for (const [x, y, p] of [[47, 74, 0], [95, 66, 1], [95, 80, 2], [60, 86, 3], [80, 86, 4], [72, 74, 5], [48, 88, 6]]) {
    c.fillStyle = Math.sin(t * 3 + p * 1.7) > -0.7 ? "#ffcf6a" : "#a0702a";
    c.fillRect(x, y, 2, 3);
    c.fillStyle = "rgba(255,200,100,0.15)";
    c.fillRect(x - 1, y - 1, 4, 5);
  }
  // Mid forest silhouettes.
  ridge(c, 146, 10, 2, 4.1, "#141c1c");
  for (let i = 0; i < 26; i++) pine(c, 6 + i * 13 + Math.round(hash(i + 5) * 6), 150 + Math.round(hash(i) * 4), 18 + Math.round(hash(i + 9) * 12), "#0e1616");
  // Drifting fog bands.
  for (let i = 0; i < 4; i++) {
    const x = ((t * (6 + i * 3) + i * 90) % (W + 160)) - 120;
    c.fillStyle = "rgba(180,170,200,0.07)";
    c.beginPath();
    c.ellipse(x, 140 + i * 6, 90, 6, 0, 0, Math.PI * 2);
    c.fill();
  }
  // Foreground hill.
  c.fillStyle = "#0b0d10";
  c.beginPath();
  c.moveTo(0, H);
  c.lineTo(0, 160);
  c.quadraticCurveTo(110, 146, 200, 156);
  c.quadraticCurveTo(270, 162, W, 154);
  c.lineTo(W, H);
  c.fill();
  // Campfire glow and flames.
  const fx = 150,
    fy = 158,
    flick = Math.sin(t * 13) * 1.5 + Math.sin(t * 7) * 1;
  const glow = c.createRadialGradient(fx, fy - 4, 2, fx, fy - 4, 56 + flick * 2);
  glow.addColorStop(0, "rgba(255,170,80,0.45)");
  glow.addColorStop(1, "rgba(255,120,40,0)");
  c.fillStyle = glow;
  c.fillRect(fx - 70, fy - 70, 140, 100);
  c.fillStyle = "#3a2414";
  c.fillRect(fx - 7, fy, 14, 2);
  c.fillRect(fx - 5, fy - 1, 3, 2);
  c.fillRect(fx + 2, fy - 1, 3, 2);
  c.fillStyle = "#e8702a";
  c.fillRect(fx - 4, fy - 7 - flick, 8, 7 + flick);
  c.fillStyle = "#ffb44a";
  c.fillRect(fx - 2, fy - 10 - flick, 4, 9 + flick);
  c.fillStyle = "#fff0b0";
  c.fillRect(fx - 1, fy - 6, 2, 5);
  for (const e of embers) {
    const life = (t * 0.5 + e.off) % 1,
      x = fx + Math.sin(t * 2 + e.seed) * 6 + (e.off - 0.5) * 20 * life,
      y = fy - 8 - life * 70;
    c.fillStyle = `rgba(255,${180 - life * 120},80,${1 - life})`;
    c.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  // The hero stands by the fire, cape stirring in the wind.
  if (hero) {
    c.save();
    c.filter = "brightness(0.65) sepia(0.4)";
    drawHero(c, fx + 20, fy + 1, hero.characterClass || "warrior", {
      scale: 0.8,
      ...(hero.appearance || {}),
      race: hero.race,
      player: !!hero.characterClass,
      weapon: hero.weapon || "sword",
      armor: hero.armor || "chain",
      facing: Math.PI,
      time: t,
    });
    c.restore();
  }
  // Fireflies.
  for (let i = 0; i < 8; i++) {
    const a = Math.sin(t * 1.3 + i * 2.1);
    c.fillStyle = `rgba(220,255,140,${0.4 + a * 0.4})`;
    c.fillRect(Math.round(30 + i * 37 + Math.sin(t * 0.7 + i) * 8), Math.round(150 + Math.cos(t + i) * 6), 1, 1);
  }
  // Vignette.
  const v = c.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 200);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.55)");
  c.fillStyle = v;
  c.fillRect(0, 0, W, H);
}

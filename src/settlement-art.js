import { season } from "./art.js";
const R = (c, x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
const P = (c, pts, col) => {
  c.fillStyle = col;
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
};
const shadow = (c, x, y, w) => {
  c.fillStyle = "#142b2640";
  c.beginPath();
  c.ellipse(x, y + 2, w, 4, 0, 0, Math.PI * 2);
  c.fill();
};
// Flat decorations drawn under characters.
export const isFlatDecor = (o) => o.type === "decor" && ["field", "farm", "pen", "flowerbed", "shell", "starfish", "seaweed", "tidepool", "pier"].includes(o.kind);
// One crop sprite centred on (px, py).
function crop(c, kind, px, py, sway) {
  if (season === "winter") {
    R(c, px - 3, py - 1, 6, 2, "#e8eef0");
    return;
  }
  if (kind === "wheat") {
    const ripe = season === "autumn" || season === "summer";
    R(c, px + sway, py - 7, 1, 8, ripe ? "#b8902e" : "#6a9a44");
    R(c, px - 2 + sway, py - 9, 2, 4, ripe ? "#f0d070" : "#9ccc6a");
    R(c, px + 1 + sway, py - 8, 2, 4, ripe ? "#e0c060" : "#8cbc5a");
  } else if (kind === "cabbage") {
    R(c, px - 4, py - 4, 8, 6, "#4a8a3e");
    R(c, px - 3, py - 5, 6, 5, "#6ab456");
    R(c, px - 1, py - 4, 3, 3, "#b8e88a");
  } else if (kind === "carrot") {
    R(c, px - 1, py - 1, 3, 3, "#e8822a");
    R(c, px - 3 + sway, py - 6, 2, 5, "#5aa84a");
    R(c, px + 1 + sway, py - 7, 2, 6, "#6ab456");
  } else {
    const big = season === "autumn" || season === "summer";
    R(c, px - 4, py - 3, 3, 2, "#4a8a3e");
    R(c, px + 2, py - 4, 3, 2, "#4a8a3e");
    if (big) {
      R(c, px - 4, py - 5, 8, 6, "#e8822a");
      R(c, px - 4, py - 5, 8, 2, "#f8a24a");
      R(c, px - 1, py - 5, 1, 6, "#c8621a");
      R(c, px, py - 8, 2, 3, "#4a7a2a");
    } else R(c, px - 2, py - 4, 4, 4, "#6aa84a");
  }
}
export function drawDecor(c, o, time) {
  const { x, y } = o;
  const k = o.kind;
  if (k === "farm") {
    // A fenced kitchen garden: neat raised beds separated by narrow paths.
    const w = o.w * 24,
      h = o.h * 24,
      x0 = x - w / 2,
      y0 = y - h / 2;
    R(c, x0 - 4, y0 - 4, w + 8, h + 8, "#b89a6a");
    for (let row = 0; row < o.h; row++) {
      const by = y0 + row * 24 + 3,
        kind = o.crops[row % o.crops.length];
      R(c, x0 + 2, by, w - 4, 18, "#5a3a22");
      R(c, x0 + 2, by, w - 4, 3, "#7a5232");
      R(c, x0 + 2, by + 15, w - 4, 3, "#3e2816");
      R(c, x0 + 2, by + 8, w - 4, 2, "#4a3020");
      const n = o.w * 3;
      for (let i = 0; i < n; i++) crop(c, kind, x0 + 6 + i * ((w - 12) / (n - 1)), by + 12, Math.round(Math.sin(time * 2 + i + row)));
    }
    // Low wattle fence with a gate gap at the bottom middle.
    const post = (px, py) => {
      R(c, px - 1, py - 8, 3, 10, "#6a4a2e");
      R(c, px - 1, py - 8, 3, 2, "#a8845a");
    };
    const gate = x - 14;
    for (let px = x0 - 4; px <= x0 + w + 4; px += 12) {
      post(px, y0 - 4);
      if (px < gate || px > gate + 28) post(px, y0 + h + 4);
    }
    for (let py = y0 + 8; py < y0 + h + 4; py += 12) {
      post(x0 - 4, py);
      post(x0 + w + 4, py);
    }
    R(c, x0 - 4, y0 - 9, w + 8, 2, "#8a6a42");
    R(c, x0 - 4, y0 + h - 1, gate - x0 + 4, 2, "#8a6a42");
    R(c, gate + 28, y0 + h - 1, x0 + w + 4 - gate - 28, 2, "#8a6a42");
    R(c, x0 - 5, y0 - 9, 2, h + 10, "#8a6a42");
    R(c, x0 + w + 3, y0 - 9, 2, h + 10, "#8a6a42");
    return true;
  }
  if (k === "shell") {
    const v = o.variant || 0;
    if (v === 0) {
      R(c, x - 3, y - 2, 6, 4, "#f4e0d0");
      R(c, x - 2, y - 3, 4, 1, "#f4e0d0");
      R(c, x - 1, y - 2, 1, 4, "#d8b8a8");
      R(c, x + 1, y - 2, 1, 4, "#d8b8a8");
    } else {
      R(c, x - 3, y - 2, 5, 3, "#e8c8a0");
      R(c, x + 2, y - 1, 2, 2, "#d0a080");
      R(c, x - 2, y - 1, 1, 1, "#a87858");
    }
    return true;
  }
  if (k === "starfish") {
    const col = o.variant === 1 ? "#e86a4a" : "#f0a040";
    R(c, x - 1, y - 6, 2, 12, col);
    R(c, x - 6, y - 2, 12, 2, col);
    R(c, x - 4, y + 2, 2, 3, col);
    R(c, x + 2, y + 2, 2, 3, col);
    R(c, x - 1, y - 1, 2, 2, "#ffd890");
    return true;
  }
  if (k === "seaweed") {
    for (let i = 0; i < 3; i++) R(c, x - 6 + i * 4, y - 2 + (i % 2) * 2, 5, 2, i % 2 ? "#3a6a3a" : "#4a8a4a");
    R(c, x - 2, y - 4, 2, 2, "#5a9a4a");
    return true;
  }
  if (k === "tidepool") {
    R(c, x - 10, y - 5, 20, 10, "#c8b080");
    R(c, x - 8, y - 4, 16, 8, "#5aa0b8");
    R(c, x - 6, y - 3, 6, 2, "#8ac8d8");
    R(c, x + 3, y, 2, 2, "#e86a4a");
    return true;
  }
  if (k === "pier") {
    const [dx, dy] = o.dir,
      vertical = dy !== 0,
      len = o.len * 24,
      w = vertical ? 18 : len,
      hh = vertical ? len : 18;
    R(c, x - w / 2, y - hh / 2 + 4, w, hh, "#2a4a5a55");
    R(c, x - w / 2, y - hh / 2, w, hh, "#8a6a42");
    for (let i = 0; i < (vertical ? hh : w); i += 6)
      if (vertical) R(c, x - w / 2, y - hh / 2 + i, w, 1, "#5c4228");
      else R(c, x - w / 2 + i, y - hh / 2, 1, hh, "#5c4228");
    const end = vertical ? [x, y + (dy * hh) / 2] : [x + (dx * w) / 2, y];
    for (const [px, py] of [[end[0] - (vertical ? 9 : 0), end[1] - (vertical ? 0 : 9)], [end[0] + (vertical ? 7 : 0), end[1] + (vertical ? 0 : 7)]]) R(c, px, py - 2, 3, 6, "#4a3220");
    return true;
  }
  if (k === "boat") {
    shadow(c, x, y + 2, 20);
    P(c, [[x - 20, y - 8], [x + 20, y - 8], [x + 14, y + 2], [x - 14, y + 2]], o.variant ? "#6a4428" : "#7a5234");
    R(c, x - 18, y - 9, 36, 2, "#a8744a");
    R(c, x - 14, y - 6, 28, 4, "#4a3018");
    R(c, x - 10, y - 6, 2, 4, "#8a6a42");
    R(c, x + 6, y - 6, 2, 4, "#8a6a42");
    R(c, x - 2, y - 12, 18, 2, "#c8b090");
    if (o.variant) R(c, x - 14, y - 4, 6, 3, "#c8d8e8");
    return true;
  }
  if (k === "netRack") {
    shadow(c, x, y, 18);
    R(c, x - 18, y - 30, 2, 30, "#6b4428");
    R(c, x + 16, y - 30, 2, 30, "#6b4428");
    R(c, x - 18, y - 30, 36, 2, "#8a5a34");
    c.strokeStyle = "#5a5a4a";
    c.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.moveTo(x - 16 + i * 6, y - 28);
      c.lineTo(x - 13 + i * 6 + Math.sin(time + i) * 1, y - 8);
      c.stroke();
    }
    for (let j = 0; j < 4; j++) R(c, x - 16, y - 24 + j * 5, 32, 1, "#5a5a4a");
    R(c, x - 6, y - 14, 5, 3, "#8ab0d0");
    return true;
  }
  if (k === "barrelStack") {
    shadow(c, x, y, 14);
    for (const [dx, dy] of [[-8, 0], [8, 0], [0, -14]]) {
      R(c, x + dx - 7, y + dy - 14, 14, 14, "#7a4e2a");
      R(c, x + dx - 7, y + dy - 11, 14, 2, "#4a4a52");
      R(c, x + dx - 7, y + dy - 4, 14, 2, "#4a4a52");
      R(c, x + dx - 5, y + dy - 14, 2, 14, "#9a6a3a");
    }
    return true;
  }
  if (k === "crates") {
    shadow(c, x, y, 14);
    for (const [dx, dy] of [[-7, 0], [7, 0], [0, -12]]) {
      R(c, x + dx - 7, y + dy - 12, 14, 12, "#9a6234");
      R(c, x + dx - 7, y + dy - 12, 14, 2, "#c49060");
      R(c, x + dx - 1, y + dy - 12, 2, 12, "#6b4428");
    }
    return true;
  }
  if (k === "campfirePot") {
    R(c, x - 8, y - 2, 16, 3, "#4a3220");
    R(c, x - 9, y - 22, 2, 22, "#3a2a1a");
    R(c, x + 7, y - 22, 2, 22, "#3a2a1a");
    R(c, x - 9, y - 22, 18, 2, "#3a2a1a");
    R(c, x - 5, y - 14, 10, 8, "#2a2a30");
    const f = Math.sin(time * 9) * 1.5;
    R(c, x - 4, y - 5 - f, 8, 4 + f, "#f39237");
    R(c, x - 2, y - 7 - f, 4, 4, "#ffe08a");
    if (Math.sin(time * 2) > 0) R(c, x - 1, y - 20 - ((time * 10) % 8), 3, 3, "#e8e8f088");
    return true;
  }
  if (k === "wreck") {
    shadow(c, x, y + 4, 40);
    P(c, [[x - 44, y - 6], [x + 30, y - 18], [x + 44, y - 4], [x + 20, y + 8], [x - 36, y + 8]], "#5c3e24");
    P(c, [[x - 40, y - 4], [x + 28, y - 15], [x + 38, y - 4], [x + 18, y + 4], [x - 32, y + 4]], "#3a2616");
    for (let i = 0; i < 6; i++) R(c, x - 30 + i * 11, y - 14 + (i < 3 ? 0 : -4), 3, 20 - i, "#7a5234");
    R(c, x + 4, y - 58, 4, 50, "#5c3e24");
    R(c, x - 10, y - 46, 30, 3, "#5c3e24");
    P(c, [[x - 8, y - 43], [x + 18, y - 43], [x + 12, y - 22], [x - 4, y - 28]], "#c8b89a");
    R(c, x - 2, y - 38, 6, 5, "#a89878");
    R(c, x + 20, y - 4, 8, 6, "#9a6234");
    R(c, x - 46, y + 4, 10, 3, "#4a6a3a");
    return true;
  }
  if (k === "driftwood") {
    shadow(c, x, y, 12);
    R(c, x - 12, y - 4, 24, 4, "#a89880");
    R(c, x - 12, y - 4, 24, 1, "#c8b8a0");
    R(c, x + 6, y - 8, 2, 5, "#a89880");
    R(c, x - 8, y, 4, 2, "#8a7a62");
    return true;
  }
  if (k === "duneGrass") {
    const sway = Math.round(Math.sin(time * 1.5 + x * 0.1) * 1.5);
    for (let i = 0; i < 5; i++) R(c, x - 6 + i * 3 + (i > 1 ? sway : 0), y - 8 - (i % 2) * 3, 1, 8 + (i % 2) * 3, i % 2 ? "#a8b060" : "#8a9a4a");
    return true;
  }
  if (k === "grave") {
    shadow(c, x, y, 9);
    const v = Math.round(x + y) % 3;
    if (v === 0) {
      R(c, x - 7, y - 20, 14, 20, "#7a7a84");
      R(c, x - 5, y - 23, 10, 4, "#7a7a84");
      R(c, x - 7, y - 20, 2, 20, "#9a9aa4");
      R(c, x - 3, y - 14, 6, 1, "#4a4a54");
      R(c, x - 3, y - 10, 6, 1, "#4a4a54");
    } else if (v === 1) {
      R(c, x - 1, y - 24, 3, 24, "#6a6a72");
      R(c, x - 7, y - 18, 15, 3, "#6a6a72");
      R(c, x - 1, y - 24, 1, 24, "#8a8a92");
    } else {
      R(c, x - 6, y - 14, 12, 14, "#6a6a72");
      R(c, x - 6, y - 14, 12, 2, "#8a8a92");
      R(c, x + 2, y - 8, 4, 4, "#4a6a3a");
    }
    R(c, x - 6, y + 1, 12, 6, "#5a4a32");
    return true;
  }
  if (k === "deadTree") {
    shadow(c, x, y, 12);
    R(c, x - 3, y - 40, 6, 42, "#3a2e26");
    R(c, x - 3, y - 40, 2, 42, "#4e4036");
    for (const [dx, dy, len, dir] of [[0, -36, 14, -1], [0, -28, 12, 1], [0, -20, 10, -1], [0, -44, 8, 1]])
      for (let i = 0; i < len; i++) R(c, x + dx + i * dir, y + dy - Math.floor(i / 2), 2, 2, "#3a2e26");
    if (Math.sin(time * 0.7 + x) > 0.4) {
      R(c, x + 8, y - 48, 5, 3, "#14141a");
      R(c, x + 12, y - 50, 2, 2, "#14141a");
    }
    return true;
  }
  if (k === "field") {
    const w = o.w * 24,
      h = o.h * 24,
      x0 = x - 12,
      y0 = y - 12;
    R(c, x0, y0, w, h, "#6a4a2e");
    for (let row = 0; row < o.h * 3; row++) {
      R(c, x0, y0 + row * 8 + 6, w, 2, "#553a22");
      for (let col = 0; col < o.w * 3; col++) {
        const px = x0 + col * 8 + 4,
          py = y0 + row * 8 + 4,
          sway = Math.round(Math.sin(time * 2 + col + row) * 1);
        if (season === "winter") {
          R(c, px - 2, py, 4, 2, "#e8eef0");
          continue;
        }
        if (o.crop === "wheat") {
          const ripe = season === "autumn" || season === "summer";
          R(c, px + sway, py - 4, 1, 6, ripe ? "#c8a040" : "#7aa850");
          R(c, px - 1 + sway, py - 5, 3, 2, ripe ? "#f0d070" : "#9ccc6a");
        } else if (o.crop === "cabbage") {
          R(c, px - 2, py - 2, 5, 4, "#5aa04a");
          R(c, px - 1, py - 1, 3, 2, "#a8dc7a");
        } else {
          const big = season === "autumn";
          R(c, px - 2, py - (big ? 3 : 1), big ? 6 : 3, big ? 5 : 3, big ? "#e8822a" : "#6aa84a");
          if (big) R(c, px, py - 4, 1, 2, "#4a7a2a");
        }
      }
    }
    return true;
  }
  if (k === "pen") {
    const { w, h } = o,
      post = (px, py) => {
        R(c, px - 1, py - 10, 3, 12, "#7a5a3a");
        R(c, px - 1, py - 10, 3, 2, "#a8845a");
      };
    for (let px = x; px <= x + w; px += 12) {
      post(px, y);
      post(px, y + h);
    }
    for (let py = y; py <= y + h; py += 12) {
      post(x, py);
      post(x + w, py);
    }
    R(c, x, y - 6, w, 2, "#a8845a");
    R(c, x, y + h - 6, w, 2, "#a8845a");
    R(c, x, y - 6, 2, h, "#a8845a");
    R(c, x + w, y - 6, 2, h, "#a8845a");
    return true;
  }
  if (k === "flowerbed") {
    R(c, x - 14, y - 4, 28, 8, "#5a3a22");
    for (let i = 0; i < 7; i++) R(c, x - 12 + i * 4, y - 6 - (i % 2) * 2, 3, 3, ["#e04a5a", "#f2c14e", "#d070e0", "#ffffff"][i % 4]);
    return true;
  }
  if (k === "windmill") {
    shadow(c, x, y, 22);
    P(c, [[x - 14, y], [x - 9, y - 48], [x + 9, y - 48], [x + 14, y]], "#c8b490");
    P(c, [[x + 2, y], [x + 4, y - 48], [x + 9, y - 48], [x + 14, y]], "#a89470");
    P(c, [[x - 12, y - 46], [x, y - 60], [x + 12, y - 46]], "#8a4a32");
    R(c, x - 4, y - 14, 8, 14, "#5a3a22");
    R(c, x - 3, y - 34, 6, 6, "#3a2a1a");
    const hubY = y - 44;
    for (let i = 0; i < 4; i++) {
      const a = time * 1.2 + (i * Math.PI) / 2;
      c.save();
      c.translate(x, hubY);
      c.rotate(a);
      R(c, -1, -26, 3, 26, "#6b4428");
      R(c, 2, -24, 6, 20, "#e8e0c8");
      c.restore();
    }
    R(c, x - 2, hubY - 2, 5, 5, "#3a2a1a");
    return true;
  }
  if (k === "scarecrow") {
    shadow(c, x, y, 8);
    R(c, x - 1, y - 30, 2, 30, "#6b4428");
    R(c, x - 12, y - 22, 24, 2, "#6b4428");
    R(c, x - 6, y - 24, 12, 12, "#7a5a8a");
    R(c, x - 4, y - 32, 8, 8, "#e8c070");
    R(c, x - 6, y - 34, 12, 3, "#5a3a22");
    R(c, x - 2, y - 29, 1, 1, "#1b120c");
    R(c, x + 1, y - 29, 1, 1, "#1b120c");
    R(c, x - 13, y - 22, 3, 4, "#e8c070");
    R(c, x + 10, y - 22, 3, 4, "#e8c070");
    return true;
  }
  if (k === "haystack") {
    shadow(c, x, y, 14);
    const snow = season === "winter";
    P(c, [[x - 14, y], [x - 10, y - 14], [x, y - 20], [x + 10, y - 14], [x + 14, y]], "#c8a040");
    P(c, [[x - 10, y - 14], [x, y - 20], [x + 10, y - 14], [x, y - 12]], snow ? "#eef3f2" : "#e8c860");
    for (let i = 0; i < 5; i++) R(c, x - 10 + i * 5, y - 8 + (i % 2), 1, 6, "#a8802a");
    return true;
  }
  if (k === "cart") {
    shadow(c, x, y, 16);
    R(c, x - 14, y - 14, 26, 8, "#8a5a34");
    R(c, x - 14, y - 16, 26, 2, "#a8744a");
    R(c, x - 12, y - 20, 22, 6, "#c8a040");
    R(c, x + 12, y - 10, 8, 2, "#6b4428");
    for (const wx of [-9, 6]) {
      c.fillStyle = "#3a2a1a";
      c.beginPath();
      c.arc(x + wx, y - 3, 5, 0, Math.PI * 2);
      c.fill();
      R(c, x + wx - 1, y - 4, 2, 2, "#8a6a4a");
    }
    return true;
  }
  if (k === "woodpile") {
    shadow(c, x, y, 12);
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 4 - row; i++) {
        const lx = x - 12 + i * 7 + row * 3,
          ly = y - 6 - row * 6;
        R(c, lx, ly, 6, 6, "#8a5a34");
        R(c, lx + 1, ly + 1, 4, 4, "#d6a066");
        R(c, lx + 2, ly + 2, 2, 2, "#a8744a");
      }
    return true;
  }
  if (k === "beehive") {
    shadow(c, x, y, 7);
    R(c, x - 5, y - 4, 10, 4, "#6b4428");
    for (let i = 0; i < 3; i++) R(c, x - 6 + i, y - 8 - i * 4, 12 - i * 2, 4, i % 2 ? "#d0a050" : "#e8c070");
    R(c, x - 1, y - 7, 2, 2, "#3a2a1a");
    if (season !== "winter")
      for (let i = 0; i < 3; i++) R(c, x + Math.cos(time * 5 + i * 2) * 9, y - 14 + Math.sin(time * 7 + i) * 5, 1, 1, "#2a2a1a");
    return true;
  }
  if (k === "stall") {
    shadow(c, x, y, 18);
    R(c, x - 16, y - 12, 32, 10, "#8a5a34");
    R(c, x - 16, y - 12, 32, 2, "#a8744a");
    R(c, x - 15, y - 30, 2, 20, "#6b4428");
    R(c, x + 13, y - 30, 2, 20, "#6b4428");
    for (let i = 0; i < 6; i++) R(c, x - 18 + i * 6, y - 34, 6, 6, i % 2 ? "#f4ead0" : "#c0302a");
    for (let i = 0; i < 6; i++) P(c, [[x - 18 + i * 6, y - 28], [x - 15 + i * 6, y - 25], [x - 12 + i * 6, y - 28]], i % 2 ? "#f4ead0" : "#c0302a");
    const goods = { apples: ["#e0483a", "#62b04e"], fish: ["#8ab0d0", "#c8d8e8"], cloth: ["#7a5a9a", "#d0a050"], pots: ["#a86a3a", "#c8884a"] }[o.goods] || ["#e0483a", "#62b04e"];
    for (let i = 0; i < 7; i++) R(c, x - 13 + i * 4, y - 15 - (i % 2) * 2, 3, 3, goods[i % 2]);
    return true;
  }
  if (k === "trough") {
    R(c, x - 12, y - 6, 24, 7, "#6b4428");
    R(c, x - 10, y - 5, 20, 3, season === "winter" ? "#c8e8f0" : "#5a9ab0");
    return true;
  }
  if (k === "fishrack") {
    R(c, x - 12, y - 22, 2, 22, "#6b4428");
    R(c, x + 10, y - 22, 2, 22, "#6b4428");
    R(c, x - 12, y - 22, 24, 2, "#8a5a34");
    for (let i = 0; i < 4; i++) {
      R(c, x - 8 + i * 5, y - 20, 1, 3, "#c8b490");
      R(c, x - 9 + i * 5, y - 17 + Math.sin(time * 2 + i), 3, 7, "#8ab0d0");
    }
    return true;
  }
  return false;
}
// Abandoned hut: sagging roof with holes, boarded windows, ivy.
export function drawRuinHouse(c, o, time) {
  const { x, y } = o;
  shadow(c, x, y + 4, 44);
  R(c, x - 36, y - 30, 72, 36, "#4a3a2c");
  R(c, x - 34, y - 28, 68, 32, "#7a6a54");
  for (let j = 0; j < 4; j++) R(c, x - 34, y - 24 + j * 8, 68, 1, "#5a4a3a");
  P(c, [[x - 42, y - 30], [x - 24, y - 56], [x + 26, y - 52], [x + 42, y - 30]], "#3a2e26");
  P(c, [[x - 38, y - 33], [x - 22, y - 53], [x + 24, y - 50], [x + 38, y - 33]], "#5a4636");
  // Holes in the roof.
  R(c, x - 8, y - 46, 10, 6, "#1a120c");
  R(c, x + 14, y - 40, 8, 5, "#1a120c");
  R(c, x - 10, y - 20, 18, 26, "#2a1e16");
  R(c, x - 8, y - 18, 14, 4, "#5a4636");
  R(c, x - 8, y - 8, 14, 3, "#5a4636");
  for (const wx of [-28, 18]) {
    R(c, x + wx, y - 22, 12, 12, "#1a120c");
    R(c, x + wx - 1, y - 19, 14, 2, "#8a6a4a");
    R(c, x + wx - 1, y - 14, 14, 2, "#8a6a4a");
  }
  for (let i = 0; i < 8; i++) R(c, x - 36 + (i % 2) * 2, y - 28 + i * 4, 3 + (i % 3), 3, i % 2 ? "#3e6a3a" : "#5a8a4a");
  for (let i = 0; i < 5; i++) R(c, x + 30 + (i % 2) * 2, y - 24 + i * 5, 3, 3, "#4a7a3a");
  c.globalAlpha = 0.5 + Math.sin(time * 2) * 0.2;
  R(c, x - 2, y - 2, 4, 3, "#ffe08a");
  c.globalAlpha = 1;
}
// Farm animals with idle and walk animations.
export function drawCritter(c, a, time) {
  const { x, y } = a,
    step = a.moving ? Math.round(Math.sin(time * 10 + a.seed) * 1.5) : 0;
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(a.face, 1);
  if (a.kind === "crab") {
    const x = 0,
      y = 0,
      legs = a.moving ? Math.round(Math.sin(time * 18 + a.seed)) : 0;
    shadow(c, x, y, 6);
    R(c, x - 5, y - 6, 10, 5, "#d84a2a");
    R(c, x - 4, y - 7, 8, 2, "#f06a3a");
    R(c, x - 3, y - 9, 1, 2, "#1b120c");
    R(c, x + 2, y - 9, 1, 2, "#1b120c");
    R(c, x - 8, y - 8 + legs, 3, 3, "#d84a2a");
    R(c, x + 5, y - 8 - legs, 3, 3, "#d84a2a");
    for (let i = 0; i < 3; i++) {
      R(c, x - 7, y - 3 + i * 1 + (i % 2 ? legs : 0), 2, 1, "#b83a1a");
      R(c, x + 5, y - 3 + i * 1 + (i % 2 ? 0 : legs), 2, 1, "#b83a1a");
    }
    c.restore();
    return;
  }
  if (a.kind === "gull") {
    const x = 0,
      y = 0,
      flap = Math.sin(time * 8 + a.seed),
      hy = y - 70;
    c.fillStyle = "#0a1a2a30";
    c.beginPath();
    c.ellipse(x, y, 6, 2, 0, 0, Math.PI * 2);
    c.fill();
    R(c, x - 3, hy - 1, 7, 3, "#f4f4f4");
    R(c, x + 4, hy - 1, 2, 1, "#f0a040");
    const wy = Math.round(flap * 3);
    P(c, [[x - 1, hy], [x - 10, hy - 3 - wy], [x - 6, hy + 1]], "#e8e8ec");
    P(c, [[x + 1, hy], [x + 10, hy - 3 - wy], [x + 6, hy + 1]], "#e8e8ec");
    R(c, x - 10, hy - 3 - wy, 2, 1, "#3a3a42");
    R(c, x + 9, hy - 3 - wy, 2, 1, "#3a3a42");
    c.restore();
    return;
  }
  if (a.kind === "chicken") {
    shadow(c, 0, 0, 5);
    const peck = !a.moving && Math.sin(time * 3 + a.seed) > 0.7 ? 3 : 0;
    R(c, -4, -8, 8, 6, "#f4f0e0");
    R(c, 2, -12 + peck, 4, 5, "#f4f0e0");
    R(c, 3, -13 + peck, 2, 2, "#e0483a");
    R(c, 6, -10 + peck, 2, 1, "#f2a03a");
    R(c, 4, -11 + peck, 1, 1, "#1b120c");
    R(c, -1, -2, 1, 3 + step, "#f2a03a");
    R(c, 2, -2, 1, 3 - step, "#f2a03a");
  } else if (a.kind === "pig") {
    shadow(c, 0, 0, 9);
    R(c, -9, -11, 16, 9, "#f0a8a0");
    R(c, -9, -11, 16, 2, "#ffc8c0");
    R(c, 5, -12, 6, 7, "#f0a8a0");
    R(c, 9, -9, 3, 3, "#e08880");
    R(c, 7, -11, 1, 1, "#1b120c");
    R(c, 5, -13, 2, 2, "#e08880");
    R(c, -10, -9, 2, 2, "#e08880");
    for (const lx of [-7, -3, 1, 4]) R(c, lx, -2, 2, 3 + (lx % 2 ? step : -step), "#d08880");
  } else if (a.kind === "goat" || a.kind === "sheep") {
    shadow(c, 0, 0, 9);
    const wool = a.kind === "sheep";
    R(c, -9, -13, 16, 9, wool ? "#f0efd9" : "#c8b8a0");
    if (wool) R(c, -10, -12, 18, 7, "#fffdf0");
    R(c, 6, -15, 6, 7, wool ? "#817769" : "#a89880");
    R(c, 9, -14, 1, 1, "#1b120c");
    if (!wool) {
      R(c, 7, -18, 1, 3, "#6a5a4a");
      R(c, 10, -18, 1, 3, "#6a5a4a");
      R(c, 10, -9, 2, 3, "#e8e0d0");
    }
    for (const lx of [-7, -3, 1, 4]) R(c, lx, -4, 2, 5 + (lx % 2 ? step : -step), "#6a5e4a");
  } else {
    // Cow: white with black patches.
    shadow(c, 0, 0, 12);
    R(c, -12, -16, 22, 11, "#f4f0e8");
    R(c, -9, -15, 6, 5, "#2a2a2a");
    R(c, 1, -12, 5, 5, "#2a2a2a");
    R(c, 9, -19, 7, 9, "#f4f0e8");
    R(c, 13, -14, 4, 4, "#f0b8b0");
    R(c, 11, -17, 1, 1, "#1b120c");
    R(c, 9, -21, 2, 3, "#d8c8a0");
    R(c, 14, -21, 2, 3, "#d8c8a0");
    R(c, -13, -14, 2, 7, "#2a2a2a");
    for (const lx of [-10, -5, 2, 6]) R(c, lx, -5, 3, 6 + (lx % 2 ? step : -step), "#e8e0d8");
  }
  c.restore();
}

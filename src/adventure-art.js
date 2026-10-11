import { label } from "./i18n.js";
import { drawStatus } from "./art.js";
const rect = (c, x, y, w, h, color) => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
const line = (c, points, color, width = 1) => {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  for (let i = 0; i < points.length; i++)
    c[i ? "lineTo" : "moveTo"](...points[i]);
  c.stroke();
};
export function drawAdventureObject(c, o, time, world, collected) {
  const { x, y, type } = o;
  if (type === "fishspot") {
    rect(c, x - 17, y - 7, 34, 11, "#836945");
    for (let i = 0; i < 5; i++)
      rect(c, x - 17 + i * 7, y - 7, 1, 11, "#c1a478");
    rect(c, x - 20, y - 8, 3, 17, "#554932");
    rect(c, x + 17, y - 8, 3, 17, "#554932");
    c.fillStyle = "#91cbd5";
    c.beginPath();
    c.ellipse(x, y - 24, 7, 3, 0, 0, Math.PI * 2);
    c.fill();
    line(
      c,
      [
        [x + 6, y - 24],
        [x + 11, y - 28],
        [x + 11, y - 20],
        [x + 6, y - 24],
      ],
      "#91cbd5",
    );
    return true;
  }
  if (type === "berryBush") {
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i % 2 ? "#628358" : "#42664a";
      c.beginPath();
      c.arc(x - 7 + i * 5, y - 5 - (i % 2) * 5, 7, 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 5; i++)
      rect(c, x - 9 + i * 4, y - 7 - (i % 2) * 5, 3, 3, "#c98396");
    return true;
  }
  if (type === "dungeonFloor") {
    const { w, h, theme } = o;
    c.save();
    c.translate(x, y);
    c.globalAlpha = 0.45;
    const palette = {
      crypt: ["#6c3e54", "#b08a70"],
      mine: ["#498492", "#b8e0dd"],
      abyss: ["#385b43", "#91b16f"],
      citadel: ["#513d72", "#cdb0ec"],
    }[theme];
    c.fillStyle = palette[0];
    c.fillRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = palette[1];
    c.lineWidth = 2;
    c.strokeRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);
    c.beginPath();
    c.arc(0, 0, Math.min(w, h) * 0.32, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      c.save();
      c.rotate(a);
      line(
        c,
        [
          [0, -12],
          [10, -28],
          [0, -40],
          [-10, -28],
          [0, -12],
        ],
        palette[1],
      );
      c.restore();
    }
    if (o.arena) {
      c.globalAlpha = 0.7;
      c.font = "12px monospace";
      c.textAlign = "center";
      c.fillStyle = palette[1];
      c.fillText("◆  " + label(o.name).toUpperCase() + "  ◆", 0, -h / 2 + 24);
    }
    c.restore();
    return true;
  }
  if (type === "dungeonDecor") {
    if (o.theme === "crypt") {
      rect(c, x - 11, y - 16, 22, 18, "#595665");
      rect(c, x - 9, y - 18, 18, 4, "#878190");
      rect(c, x - 2, y - 13, 4, 8, "#b7a9a5");
      rect(c, x - 5, y - 11, 10, 2, "#b7a9a5");
      rect(c, x + 13, y - 5, 5, 4, "#bfb7a1");
      rect(c, x + 14, y - 4, 1, 1, "#34353d");
    } else if (o.theme === "mine") {
      for (let i = 0; i < 3; i++) {
        line(
          c,
          [
            [x - 12 + i * 9, y],
            [x - 10 + i * 9, y - 25 - i * 5],
            [x - 3 + i * 9, y],
          ],
          "#9dcdd8",
          4,
        );
        line(
          c,
          [
            [x - 10 + i * 9, y - 20],
            [x - 7 + i * 9, y - 2],
          ],
          "#d8efec",
          1,
        );
      }
      rect(c, x - 15, y + 1, 38, 4, "#5996aa");
    } else if (o.theme === "abyss") {
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        line(
          c,
          [
            [x, y - 12],
            [x + Math.cos(a) * 25, y - 12 + Math.sin(a) * 15],
          ],
          "#91a77a",
        );
      }
      c.strokeStyle = "#81957366";
      for (let i = 1; i < 4; i++) {
        c.beginPath();
        c.ellipse(x, y - 12, i * 6, i * 4, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.fillStyle = "#6d8f57";
      c.beginPath();
      c.ellipse(x + 20, y - 3, 7, 10, 0, 0, Math.PI * 2);
      c.fill();
      rect(c, x + 18, y - 10, 2, 4, "#b9c991");
    } else {
      rect(c, x - 11, y - 23, 22, 25, "#4a405e");
      rect(c, x - 13, y - 25, 26, 3, "#8c7aab");
      rect(c, x - 2, y - 19, 4, 15, "#c3a0df");
      line(
        c,
        [
          [x - 6, y - 8],
          [x, y - 17],
          [x + 6, y - 8],
          [x, y - 3],
          [x - 6, y - 8],
        ],
        "#e3c7fb",
        1,
      );
      c.globalAlpha = 0.2 + Math.sin(time * 2) * 0.08;
      c.fillStyle = "#b990e6";
      c.beginPath();
      c.arc(x, y - 12, 20, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    }
    return true;
  }
  if (type === "door") return true;
  if (type === "houseExit") {
    rect(c, x - 16, y - 2, 32, 8, "#6b3a2a");
    rect(c, x - 14, y, 28, 4, "#9a5a3a");
    rect(c, x - 2, y - 14 + Math.sin(time * 4) * 2, 4, 8, "#ffe08a");
    return true;
  }
  if (type === "stash") {
    const open = collected.has(o.id);
    rect(c, x - 11, y - 12, 22, 14, "#5c3a1e");
    rect(c, x - 10, y - 11, 20, 11, "#9a6234");
    rect(c, x - 11, y - 15 - (open ? 6 : 0), 22, 6, "#b07a48");
    rect(c, x - 2, y - 9, 4, 4, "#f2c14e");
    return true;
  }
  if (type === "furniture") {
    drawFurniture(c, o, time);
    return true;
  }
  if (type === "wood") {
    if (collected.has(o.id)) return true;
    rect(c, x - 9, y - 4, 17, 7, "#805d42");
    rect(c, x - 8, y - 4, 3, 7, "#ba9762");
    line(
      c,
      [
        [x - 3, y - 3],
        [x + 6, y - 3],
      ],
      "#b08c53",
    );
    return true;
  }
  if (type === "loot") {
    const glow = c.createRadialGradient(x, y - 14, 2, x, y - 14, 27);
    glow.addColorStop(0, "#efd38466");
    glow.addColorStop(1, "#efd38400");
    c.fillStyle = glow;
    c.fillRect(x - 28, y - 44, 56, 56);
    rect(c, x - 1, y - 55, 2, 45, "#f4da9999");
    rect(c, x - 8, y - 8, 16, 10, "#8b6558");
    rect(c, x - 5, y - 11, 10, 5, "#c3a67a");
    rect(c, x - 2, y - 7, 4, 4, "#f6dd95");
    for (let i = 0; i < 4; i++) {
      const a = time * 1.4 + (i * Math.PI) / 2;
      rect(c, x + Math.cos(a) * 16, y - 15 + Math.sin(a) * 8, 2, 2, "#f4dfa7");
    }
    return true;
  }
  if (type === "entrance" && drawEntrance(c, o, time)) return true;
  if (type === "entrance" || type === "exit") {
    rect(c, x - 24, y - 33, 48, 35, "#566365");
    rect(c, x - 20, y - 34, 40, 7, "#96a297");
    rect(c, x - 23, y - 23, 6, 25, "#82918b");
    rect(c, x + 17, y - 23, 6, 25, "#81918a");
    rect(c, x - 16, y - 28, 32, 29, "#152128");
    rect(c, x - 11, y - 19, 22, 20, "#0c171f");
    rect(c, x - 14, y - 2, 28, 3, "#a3ada0");
    const color =
      {
        crypt: "#baa4d9",
        mine: "#9edff1",
        abyss: "#b9d28c",
        citadel: "#dec2f3",
      }[o.dungeon] || "#e4d09b";
    rect(c, x - 3, y - 31, 6, 7, color);
    rect(c, x - 19, y - 24, 2, 3, color);
    rect(c, x + 18, y - 24, 2, 3, color);
    return true;
  }
  if (type === "board") {
    rect(c, x - 14, y - 29, 28, 21, "#674e36");
    rect(c, x - 12, y - 27, 24, 17, "#9f8456");
    rect(c, x - 9, y - 24, 8, 10, "#dac99c");
    rect(c, x + 3, y - 22, 6, 7, "#e3d1a4");
    rect(c, x - 13, y - 9, 3, 12, "#70593c");
    rect(c, x + 10, y - 9, 3, 12, "#70593c");
    return true;
  }
  if (type === "torch") {
    rect(c, x - 2, y - 14, 4, 18, "#645649");
    rect(c, x - 5, y - 16, 10, 4, "#ab8660");
    rect(c, x - 3, y - 24, 6, 9, o.color || "#edc680");
    rect(c, x - 1, y - 28 + Math.sin(time * 10) * 2, 2, 12, "#ffefc6");
    c.fillStyle = "#ffd29a13";
    c.beginPath();
    c.arc(x, y - 20, 27, 0, Math.PI * 2);
    c.fill();
    return true;
  }
  if (type === "stairs") {
    for (let i = 0; i < 6; i++)
      rect(
        c,
        x - 13 + i,
        y - 12 + i * 3,
        26 - i * 2,
        3,
        i % 2 ? "#3b484e" : "#75868a",
      );
    rect(c, x - 1, y - 27, 2, 12, "#eed8a1");
    line(
      c,
      [
        [x - 5, y - 19],
        [x, y - 14],
        [x + 5, y - 19],
      ],
      "#eed8a1",
      2,
    );
    return true;
  }
  if (type === "gate") {
    if (world.gateOpen) return true;
    rect(c, x - 31, y - 17, 63, 9, "#788393");
    rect(c, x - 25, y - 21, 2, 20, "#ccb9db");
    rect(c, x - 10, y - 21, 2, 20, "#ccb9db");
    rect(c, x + 8, y - 21, 2, 20, "#ccb9db");
    rect(c, x + 23, y - 21, 2, 20, "#ccb9db");
    return true;
  }
  if (type === "dungeonChest") {
    rect(
      c,
      x - 11,
      y - 11,
      22,
      12,
      collected.has(o.id) ? "#504a48" : "#9f785b",
    );
    rect(c, x - 10, y - 13, 20, 4, "#b09a6e");
    rect(c, x - 2, y - 7, 4, 4, "#e4c184");
    return true;
  }
  if (o.type === "dungeonPillar") {
    rect(c, x - 8, y - 30, 16, 30, "#59606c");
    rect(c, x - 10, y - 34, 20, 5, "#818b99");
    rect(c, x - 5, y - 26, 2, 19, "#8f99a2");
    rect(c, x - 10, y - 2, 20, 5, "#343a46");
    rect(c, x - 2, y - 26, 4, 4, o.color);
    return true;
  }
  if (o.type === "dungeonTrap") {
    c.strokeStyle = o.color + "70";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(x, y, 18, 0, Math.PI * 2);
    c.moveTo(x - 12, y);
    c.lineTo(x + 12, y);
    c.moveTo(x, y - 12);
    c.lineTo(x, y + 12);
    c.stroke();
    return true;
  }
  return false;
}
// Each dungeon entrance has its own landmark so it reads from afar.
function drawEntrance(c, o, time) {
  const { x, y, dungeon } = o,
    pulse = 0.5 + Math.sin(time * 3) * 0.3;
  c.fillStyle = "#10192450";
  c.beginPath();
  c.ellipse(x, y + 4, 46, 10, 0, 0, Math.PI * 2);
  c.fill();
  if (dungeon === "crypt") {
    // Stone mausoleum with columns, a cross and graves.
    for (const [dx, dy] of [[-44, 4], [40, 8], [-34, 20]]) {
      rect(c, x + dx - 5, y + dy - 14, 10, 14, "#8a8a92");
      rect(c, x + dx - 5, y + dy - 14, 10, 3, "#b4b4be");
      rect(c, x + dx - 1, y + dy - 11, 2, 6, "#5a5a62");
    }
    rect(c, x - 30, y - 44, 60, 46, "#6a6a72");
    rect(c, x - 34, y - 48, 68, 6, "#9a9aa2");
    c.fillStyle = "#8a8a92";
    c.beginPath();
    c.moveTo(x - 36, y - 48);
    c.lineTo(x, y - 66);
    c.lineTo(x + 36, y - 48);
    c.fill();
    rect(c, x - 2, y - 80, 4, 16, "#b4b4be");
    rect(c, x - 7, y - 75, 14, 4, "#b4b4be");
    for (const dx of [-26, 20]) {
      rect(c, x + dx, y - 42, 6, 44, "#b4b4be");
      rect(c, x + dx + 1, y - 42, 2, 44, "#d4d4dc");
    }
    rect(c, x - 13, y - 34, 26, 36, "#141018");
    c.globalAlpha = pulse;
    rect(c, x - 10, y - 30, 20, 30, "#7a5aa860");
    c.globalAlpha = 1;
  } else if (dungeon === "mine") {
    // Timber-framed shaft with rails, a cart and a lantern.
    c.fillStyle = "#7a8288";
    c.beginPath();
    c.moveTo(x - 50, y + 2);
    c.lineTo(x - 30, y - 50);
    c.lineTo(x + 30, y - 56);
    c.lineTo(x + 52, y + 2);
    c.fill();
    rect(c, x - 22, y - 40, 44, 42, "#14181c");
    rect(c, x - 24, y - 44, 6, 46, "#7a5234");
    rect(c, x + 18, y - 44, 6, 46, "#7a5234");
    rect(c, x - 26, y - 46, 52, 6, "#9a6a40");
    for (let i = 0; i < 5; i++) rect(c, x - 14 + i * 1, y - 2 + i * 6, 28 - i * 2, 2, "#5a3a22");
    rect(c, x - 10, y, 2, 30, "#9aa0a8");
    rect(c, x + 8, y, 2, 30, "#9aa0a8");
    rect(c, x + 24, y - 10, 18, 10, "#6a5a4a");
    rect(c, x + 24, y - 12, 18, 3, "#9a8a6a");
    rect(c, x + 26, y - 14, 4, 3, "#b4b4be");
    rect(c, x + 32, y - 15, 5, 4, "#c9a25a");
    rect(c, x - 33, y - 34, 4, 8, "#5a3a22");
    c.globalAlpha = 0.6 + Math.sin(time * 9) * 0.2;
    rect(c, x - 34, y - 30, 6, 6, "#ffd88a");
    c.globalAlpha = 1;
    for (const [dx, dy] of [[-40, -10], [36, -40]]) rect(c, x + dx, y + dy, 8, 6, "#a8e4f6");
  } else if (dungeon === "abyss") {
    // A rotten pit ringed by roots, with poisonous glow from below.
    c.fillStyle = "#2a3020";
    c.beginPath();
    c.ellipse(x, y - 8, 42, 18, 0, 0, Math.PI * 2);
    c.fill();
    const g = c.createRadialGradient(x, y - 8, 2, x, y - 8, 36);
    g.addColorStop(0, `rgba(160,230,110,${0.55 * pulse})`);
    g.addColorStop(1, "rgba(30,40,20,0)");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, y - 8, 36, 14, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#0e140a";
    c.beginPath();
    c.ellipse(x, y - 6, 24, 8, 0, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      line(c, [[x + Math.cos(a) * 36, y - 8 + Math.sin(a) * 15], [x + Math.cos(a) * 52, y - 12 + Math.sin(a) * 22 - 6], [x + Math.cos(a) * 58, y - 2 + Math.sin(a) * 24]], "#5a4026", 3);
    }
    for (let i = 0; i < 5; i++) rect(c, x - 18 + i * 9, y - 18 - ((time * 20 + i * 11) % 30), 3, 3, "#b4e67e");
  } else if (dungeon === "citadel") {
    // Floating runic archway between crystal shards.
    const hover = Math.sin(time * 2) * 3;
    rect(c, x - 30, y - 4, 60, 6, "#4a405e");
    for (const dx of [-26, 18]) {
      rect(c, x + dx, y - 58 + hover, 8, 54, "#6a5a8a");
      rect(c, x + dx + 2, y - 58 + hover, 2, 54, "#9a8abe");
    }
    rect(c, x - 30, y - 64 + hover, 60, 8, "#7a6a9a");
    rect(c, x - 18, y - 56 + hover, 36, 52, "#1a1028");
    c.globalAlpha = pulse;
    const g = c.createLinearGradient(x, y - 56, x, y);
    g.addColorStop(0, "#dcc2ff");
    g.addColorStop(1, "#6a3ad000");
    c.fillStyle = g;
    c.fillRect(x - 16, y - 54 + hover, 32, 50);
    c.globalAlpha = 1;
    for (let i = 0; i < 4; i++) rect(c, x - 24 + i * 15, y - 62 + hover, 3, 3, "#fff0b0");
    for (const [dx, dy] of [[-48, -20], [44, -26]]) {
      const b = Math.sin(time * 2 + dx) * 4;
      c.fillStyle = "#c8a8ff";
      c.beginPath();
      c.moveTo(x + dx, y + dy - 16 + b);
      c.lineTo(x + dx + 6, y + dy + b);
      c.lineTo(x + dx, y + dy + 8 + b);
      c.lineTo(x + dx - 6, y + dy + b);
      c.fill();
    }
  } else return false;
  return true;
}
// Interior furniture for taverns, shops, the forge and homes.
function drawFurniture(c, o, time) {
  let { x, y, kind: k } = o;
  if (k === "fireplace") {
    rect(c, x - 18, y - 40, 36, 42, "#6a6a72");
    rect(c, x - 14, y - 36, 28, 4, "#8a8a92");
    rect(c, x - 10, y - 20, 20, 20, "#1a1210");
    const f = Math.sin(time * 9) * 2;
    rect(c, x - 7, y - 10 + f, 14, 10 - f, "#f39237");
    rect(c, x - 4, y - 14 + f, 8, 12, "#ffe08a");
  } else if (k === "window") {
    const w = o.wall ? y - 26 : y;
    rect(c, x - 12, w - 32, 24, 22, "#3a2a1c");
    rect(c, x - 10, w - 30, 20, 18, "#a8d8f0");
    rect(c, x - 10, w - 30, 20, 5, "#c8ecff");
    rect(c, x - 1, w - 30, 2, 18, "#3a2a1c");
    rect(c, x - 10, w - 22, 20, 2, "#3a2a1c");
    rect(c, x - 14, w - 10, 28, 3, "#7a5234");
    if (o.wall) {
      rect(c, x - 10, w - 14, 4, 4, "#e0483a");
      rect(c, x + 5, w - 14, 4, 4, "#f2c14e");
    }
  } else if (k === "rug") {
    rect(c, x - 34, y - 16, 68, 34, "#7a2a24");
    rect(c, x - 30, y - 12, 60, 26, "#a83a30");
    rect(c, x - 26, y - 8, 52, 18, "#c9a25a");
    rect(c, x - 22, y - 4, 44, 10, "#a83a30");
  } else if (k === "table") {
    rect(c, x - 14, y - 14, 28, 12, "#7a5234");
    rect(c, x - 14, y - 14, 28, 3, "#a87444");
    rect(c, x - 12, y - 2, 3, 6, "#5c3a1e");
    rect(c, x + 9, y - 2, 3, 6, "#5c3a1e");
    rect(c, x - 4, y - 18, 5, 5, "#e8e2cc");
    rect(c, x + 3, y - 17, 4, 4, "#c98a3a");
    if (o.mugs) {
      rect(c, x - 11, y - 19, 4, 5, "#c9a25a");
      rect(c, x - 11, y - 20, 4, 2, "#f4ecd8");
      rect(c, x + 8, y - 18, 4, 4, "#8a5a30");
    }
  } else if (k === "stool") {
    rect(c, x - 5, y - 8, 10, 4, "#9a6234");
    rect(c, x - 4, y - 4, 2, 6, "#5c3a1e");
    rect(c, x + 2, y - 4, 2, 6, "#5c3a1e");
  } else if (k === "counter") {
    rect(c, x - 12, y - 18, 25, 20, "#6b4428");
    rect(c, x - 12, y - 18, 25, 4, "#a87444");
    if (o.goods !== undefined) {
      const g = o.goods % 4;
      if (g === 0) rect(c, x - 6, y - 23, 5, 5, "#e0483a");
      if (g === 1) rect(c, x - 4, y - 24, 8, 6, "#c8b08a");
      if (g === 2) rect(c, x - 3, y - 25, 4, 7, "#4f94e8");
    } else if (Math.round(o.x / 24) % 2) rect(c, x - 4, y - 24, 6, 6, "#c9d8d0");
  } else if (k === "shelf") {
    rect(c, x - 12, y - 40, 24, 40, "#5c3a1e");
    for (let i = 0; i < 3; i++) {
      rect(c, x - 10, y - 30 + i * 12, 20, 2, "#9a6234");
      rect(c, x - 8 + i * 4, y - 37 + i * 12, 4, 7, ["#e0483a", "#4f94e8", "#62b04e"][i]);
      rect(c, x + 2, y - 36 + i * 12, 5, 6, "#d6a066");
    }
  } else if (k === "barrel") {
    rect(c, x - 9, y - 18, 18, 20, "#7a4e2a");
    rect(c, x - 9, y - 14, 18, 2, "#4a4a52");
    rect(c, x - 9, y - 4, 18, 2, "#4a4a52");
    rect(c, x - 6, y - 18, 3, 20, "#9a6a3a");
  } else if (k === "crate") {
    rect(c, x - 10, y - 16, 20, 18, "#9a6234");
    rect(c, x - 10, y - 16, 20, 2, "#c49060");
    rect(c, x - 1, y - 16, 2, 18, "#6b4428");
  } else if (k === "bed") {
    rect(c, x - 16, y - 34, 32, 42, "#5c3a1e");
    rect(c, x - 16, y - 38, 32, 6, "#7a5234");
    rect(c, x - 14, y - 30, 28, 34, "#c8d0e0");
    rect(c, x - 14, y - 14, 28, 18, "#a83a30");
    rect(c, x - 14, y - 14, 28, 3, "#c84a3a");
    for (let i = 0; i < 4; i++) rect(c, x - 12 + i * 7, y - 6, 3, 3, "#e8c86a");
    rect(c, x - 11, y - 28, 22, 9, "#f4f4f8");
  } else if (k === "anvil") {
    rect(c, x - 14, y - 16, 28, 7, "#4e5a63");
    rect(c, x - 14, y - 16, 28, 2, "#8d9ba3");
    rect(c, x - 6, y - 9, 12, 8, "#3a4248");
    rect(c, x - 10, y - 1, 20, 4, "#2a3036");
  } else if (k === "furnace") {
    rect(c, x - 16, y - 34, 32, 36, "#6a5a52");
    rect(c, x - 10, y - 18, 20, 14, "#1a1210");
    rect(c, x - 8, y - 12, 16, 8, Math.sin(time * 6) > 0 ? "#f39237" : "#ff6a2a");
  } else if (k === "cobweb") {
    if (o.wall) y -= 22;
    c.strokeStyle = "#d8d8d8aa";
    c.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(x - 12, y - 34);
      c.lineTo(x - 12 + i * 8, y - 34 + 24 - i * 6);
      c.stroke();
    }
    for (let r = 6; r < 22; r += 6) {
      c.beginPath();
      c.arc(x - 12, y - 34, r, 0, Math.PI / 2);
      c.stroke();
    }
  } else if (k === "brokenTable") {
    rect(c, x - 14, y - 12, 18, 4, "#6a4a2e");
    rect(c, x + 2, y - 8, 12, 3, "#6a4a2e");
    rect(c, x - 12, y - 8, 3, 8, "#4a321e");
    rect(c, x + 8, y - 5, 3, 5, "#4a321e");
  } else if (k === "bones") {
    rect(c, x - 8, y - 3, 12, 2, "#e8e2cc");
    rect(c, x - 9, y - 4, 2, 4, "#e8e2cc");
    rect(c, x + 3, y - 4, 2, 4, "#e8e2cc");
    rect(c, x + 6, y - 8, 6, 5, "#e8e2cc");
    rect(c, x + 7, y - 6, 1, 1, "#1b120c");
  } else if (k === "brokenShelf") {
    rect(c, x - 12, y - 40, 24, 40, "#4a321e");
    rect(c, x - 10, y - 30, 20, 2, "#6a4a2e");
    rect(c, x - 10, y - 18, 9, 2, "#6a4a2e");
    rect(c, x - 6, y - 37, 3, 6, "#6a6a72");
  } else if (k === "kegRack") {
    rect(c, x - 22, y - 40, 44, 4, "#5c3a1e");
    rect(c, x - 22, y - 22, 44, 4, "#5c3a1e");
    for (const dx of [-14, 0, 14]) {
      rect(c, x + dx - 6, y - 36, 12, 13, "#8a5a30");
      rect(c, x + dx - 6, y - 32, 12, 2, "#4a4a52");
      rect(c, x + dx - 2, y - 31, 4, 4, "#3a2616");
    }
  } else if (k === "bottleShelf" || k === "potionShelf") {
    rect(c, x - 16, y - 50, 32, 3, "#5c3a1e");
    rect(c, x - 16, y - 34, 32, 3, "#5c3a1e");
    const cols = k === "potionShelf" ? ["#e0483a", "#4f94e8", "#62b04e", "#b06ae0", "#f2c14e"] : ["#3a6a2e", "#6a3a2a", "#2a4a6a", "#8a7a3a", "#3a6a2e"];
    for (let i = 0; i < 5; i++) {
      rect(c, x - 14 + i * 6, y - 58 + (i % 2), 4, 8 - (i % 2), cols[i]);
      rect(c, x - 13 + i * 6, y - 60 + (i % 2), 2, 2, "#d8d0c0");
      rect(c, x - 14 + i * 6, y - 42, 4, 8, cols[(i + 2) % 5]);
    }
  } else if (k === "banner") {
    rect(c, x - 12, y - 58, 24, 2, "#3a2616");
    rect(c, x - 9, y - 56, 18, 30, "#8a2a24");
    rect(c, x - 9, y - 56, 18, 2, "#c9a25a");
    rect(c, x - 3, y - 48, 6, 10, "#f2c14e");
    rect(c, x - 9, y - 26, 6, 4, "#8a2a24");
    rect(c, x + 3, y - 26, 6, 4, "#8a2a24");
  } else if (k === "trophy") {
    rect(c, x - 8, y - 46, 16, 14, "#5c3a1e");
    rect(c, x - 5, y - 44, 10, 10, "#8a6a4a");
    rect(c, x - 3, y - 40, 2, 2, "#1b120c");
    rect(c, x + 1, y - 40, 2, 2, "#1b120c");
    rect(c, x - 14, y - 56, 2, 12, "#e8dcc0");
    rect(c, x + 12, y - 56, 2, 12, "#e8dcc0");
    rect(c, x - 14, y - 50, 8, 2, "#e8dcc0");
    rect(c, x + 6, y - 50, 8, 2, "#e8dcc0");
  } else if (k === "keg") {
    rect(c, x - 11, y - 20, 22, 18, "#8a5a30");
    rect(c, x - 11, y - 16, 22, 2, "#4a4a52");
    rect(c, x - 11, y - 7, 22, 2, "#4a4a52");
    rect(c, x - 2, y - 13, 4, 6, "#c9a25a");
    rect(c, x - 9, y - 2, 18, 4, "#5c3a1e");
  } else if (k === "bench") {
    rect(c, x - 20, y - 10, 40, 5, "#9a6234");
    rect(c, x - 20, y - 10, 40, 2, "#c08048");
    rect(c, x - 17, y - 5, 3, 7, "#5c3a1e");
    rect(c, x + 14, y - 5, 3, 7, "#5c3a1e");
  } else if (k === "candle") {
    const f = Math.sin(time * 11 + x) > 0 ? 1 : 0;
    rect(c, x + 6, y - 24, 3, 6, "#f4ecd8");
    rect(c, x + 6, y - 28 - f, 3, 4 + f, "#ffb44a");
    rect(c, x + 7, y - 27, 1, 2, "#fff0b0");
  } else if (k === "lantern" && o.wall) {
    rect(c, x - 6, y - 44, 10, 2, "#2a2a30");
    rect(c, x - 6, y - 52, 2, 8, "#2a2a30");
    rect(c, x - 2, y - 60, 3, 8, "#f4ecd8");
    rect(c, x - 2, y - 64 - (Math.sin(time * 11 + x) > 0 ? 1 : 0), 3, 4, "#ffb44a");
  } else if (k === "cobwebFloor") {
    c.strokeStyle = "#d8d8d888";
    c.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(x + 10, y + 10);
      c.lineTo(x + 10 - Math.cos(i * 0.4) * 22, y + 10 - Math.sin(i * 0.4) * 22);
      c.stroke();
    }
  } else if (k === "lantern") {
    rect(c, x - 1, y - 72, 2, 18, "#2a2a30");
    rect(c, x - 5, y - 56, 10, 12, "#2a2a30");
    rect(c, x - 3, y - 54, 6, 8, Math.sin(time * 7 + x) > -0.6 ? "#ffd36a" : "#f0a040");
  } else if (k === "plant") {
    rect(c, x - 7, y - 10, 14, 11, "#a0522d");
    rect(c, x - 8, y - 11, 16, 3, "#c06a3a");
    for (const [dx, dy, w] of [[-8, -22, 6], [2, -26, 6], [-3, -30, 6], [4, -18, 6], [-10, -16, 5]]) rect(c, x + dx, y + dy, w, 8, "#3f8a3a");
    rect(c, x - 2, y - 24, 2, 14, "#2e6a2a");
  } else if (k === "hangingHerbs") {
    rect(c, x - 16, y - 60, 32, 2, "#5c3a1e");
    for (let i = 0; i < 5; i++) {
      rect(c, x - 14 + i * 7, y - 58, 1, 6, "#c8b08a");
      rect(c, x - 16 + i * 7, y - 52, 5, 9, ["#5a8a3a", "#8a6a3a", "#6a9a4a", "#a05a3a", "#4a7a3a"][i]);
    }
  } else if (k === "scales") {
    rect(c, x - 1, y - 40, 2, 14, "#c9a25a");
    rect(c, x - 10, y - 40, 20, 2, "#c9a25a");
    rect(c, x - 12, y - 36, 6, 2, "#c9a25a");
    rect(c, x + 6, y - 34, 6, 2, "#c9a25a");
  } else if (k === "display") {
    rect(c, x - 16, y - 16, 32, 14, "#7a5234");
    rect(c, x - 16, y - 16, 32, 3, "#a87444");
    rect(c, x - 13, y - 2, 3, 5, "#5c3a1e");
    rect(c, x + 10, y - 2, 3, 5, "#5c3a1e");
    const goods = o.goods === "fruit" ? ["#e0483a", "#f2c14e", "#62b04e", "#e0483a", "#f39237"] : ["#4f94e8", "#a83a30", "#c9a25a", "#62b04e", "#b06ae0"];
    for (let i = 0; i < 5; i++) rect(c, x - 14 + i * 6, y - 22 + (i % 2) * 2, 5, 6, goods[i]);
  } else if (k === "sacks") {
    for (const [dx, dy] of [[-8, 0], [6, 0], [-1, -8]]) {
      rect(c, x + dx - 6, y + dy - 14, 12, 14, "#c8b08a");
      rect(c, x + dx - 4, y + dy - 17, 8, 4, "#a89068");
      rect(c, x + dx - 6, y + dy - 14, 2, 14, "#a89068");
    }
  } else if (k === "toolRack") {
    rect(c, x - 18, y - 54, 36, 3, "#5c3a1e");
    rect(c, x - 14, y - 51, 2, 22, "#7a5234");
    rect(c, x - 17, y - 32, 8, 5, "#6a6a72");
    rect(c, x - 3, y - 51, 2, 18, "#7a5234");
    rect(c, x - 6, y - 36, 8, 4, "#8d9ba3");
    rect(c, x + 9, y - 51, 2, 20, "#6a6a72");
    rect(c, x + 6, y - 33, 8, 3, "#6a6a72");
  } else if (k === "bellows") {
    rect(c, x - 12, y - 12, 18, 10, "#6a3a22");
    rect(c, x - 12, y - 14, 18, 3, "#8a5a30");
    rect(c, x + 6, y - 9, 8, 3, "#4a4a52");
    const puff = (Math.sin(time * 3) + 1) * 2;
    rect(c, x - 10, y - 18 - puff, 14, 3, "#5c3a1e");
  } else if (k === "quench") {
    rect(c, x - 11, y - 16, 22, 17, "#6b4428");
    rect(c, x - 11, y - 16, 22, 2, "#4a4a52");
    rect(c, x - 9, y - 14, 18, 4, "#3a6a8a");
    if (Math.sin(time * 2) > 0.6) rect(c, x - 2, y - 22 - (time * 20) % 8, 3, 3, "#d8d8e0aa");
  } else if (k === "grindstone") {
    rect(c, x - 12, y - 4, 24, 5, "#5c3a1e");
    rect(c, x - 10, y - 8, 3, 6, "#5c3a1e");
    rect(c, x + 7, y - 8, 3, 6, "#5c3a1e");
    c.fillStyle = "#8a8a92";
    c.beginPath();
    c.arc(x, y - 16, 10, 0, Math.PI * 2);
    c.fill();
    const a = time * 4;
    rect(c, x + Math.cos(a) * 6 - 1, y - 16 + Math.sin(a) * 6 - 1, 3, 3, "#5a5a62");
    rect(c, x - 1, y - 17, 3, 3, "#3a3a42");
  } else if (k === "armorStand") {
    rect(c, x - 1, y - 34, 2, 34, "#5c3a1e");
    rect(c, x - 8, y - 1, 16, 3, "#5c3a1e");
    rect(c, x - 9, y - 32, 18, 16, "#8d9ba3");
    rect(c, x - 9, y - 32, 18, 3, "#b8c4ca");
    rect(c, x - 12, y - 32, 5, 6, "#6a7a82");
    rect(c, x + 7, y - 32, 5, 6, "#6a7a82");
    rect(c, x - 5, y - 44, 10, 11, "#8d9ba3");
    rect(c, x - 3, y - 40, 6, 2, "#1b120c");
  } else if (k === "coal") {
    for (const [dx, dy] of [[-8, 0], [-2, -3], [4, 0], [0, 2], [-5, 3], [8, 2]]) rect(c, x + dx - 3, y + dy - 4, 6, 5, "#1e1e24");
    rect(c, x - 3, y - 6, 2, 2, "#ff6a2a");
  } else if (k === "ingots") {
    for (let i = 0; i < 3; i++) rect(c, x - 10 + i * 7, y - 6, 6, 4, "#b8c4ca");
    for (let i = 0; i < 2; i++) rect(c, x - 7 + i * 7, y - 10, 6, 4, "#e0a050");
  } else if (k === "workbench") {
    rect(c, x - 18, y - 14, 36, 8, "#7a5234");
    rect(c, x - 18, y - 14, 36, 2, "#a87444");
    rect(c, x - 16, y - 6, 3, 8, "#5c3a1e");
    rect(c, x + 13, y - 6, 3, 8, "#5c3a1e");
    rect(c, x - 10, y - 18, 10, 4, "#6a6a72");
    rect(c, x + 4, y - 17, 8, 3, "#8d9ba3");
  } else if (k === "brokenWindow") {
    rect(c, x - 10, y - 50, 20, 18, "#3a2a1c");
    rect(c, x - 8, y - 48, 16, 14, "#4a5a62");
    rect(c, x - 8, y - 48, 6, 5, "#a8d8f0");
    rect(c, x + 3, y - 40, 5, 6, "#a8d8f0");
    rect(c, x - 9, y - 40, 18, 2, "#3a2a1c");
  } else if (k === "chairDown") {
    rect(c, x - 8, y - 4, 14, 4, "#6a4a2e");
    rect(c, x + 4, y - 12, 3, 10, "#6a4a2e");
    rect(c, x - 7, y, 3, 3, "#4a321e");
  } else if (k === "rubble") {
    for (const [dx, dy, w] of [[-10, 0, 7], [-2, -3, 6], [5, 1, 8], [0, 3, 5], [-6, 4, 4]]) rect(c, x + dx, y + dy - 4, w, 4, "#6a5a52");
    rect(c, x - 2, y - 7, 4, 2, "#8a7a72");
  } else if (k === "hole") {
    rect(c, x - 16, y - 8, 32, 14, "#1a120c");
    rect(c, x - 18, y - 6, 2, 10, "#4a321e");
    rect(c, x + 16, y - 4, 3, 8, "#4a321e");
    rect(c, x - 10, y - 9, 6, 2, "#6a4a2e");
  } else if (k === "beam") {
    c.save();
    c.translate(x, y);
    c.rotate(-0.35);
    rect(c, -30, -6, 60, 9, "#5c3a1e");
    rect(c, -30, -6, 60, 2, "#7a5234");
    c.restore();
  } else if (k === "brokenBarrel") {
    rect(c, x - 9, y - 10, 18, 12, "#6a4428");
    rect(c, x - 9, y - 6, 18, 2, "#4a4a52");
    rect(c, x - 12, y - 2, 6, 3, "#6a4428");
    rect(c, x + 8, y - 16, 3, 8, "#6a4428");
  } else if (k === "moss") {
    for (const [dx, dy] of [[-8, 0], [-2, -2], [4, 1], [9, -1]]) rect(c, x + dx, y + dy, 6, 3, "#4a6a3a99");
  } else if (k === "wallPlates") {
    rect(c, x - 18, y - 42, 36, 3, "#5c3a1e");
    for (let i = 0; i < 4; i++) {
      c.fillStyle = ["#e8e2cc", "#4f94e8", "#e8e2cc", "#c9a25a"][i];
      c.beginPath();
      c.arc(x - 13 + i * 9, y - 48, 4, 0, Math.PI * 2);
      c.fill();
    }
  } else if (k === "cookingPot") {
    rect(c, x - 7, y - 30, 14, 9, "#2a2a30");
    rect(c, x - 6, y - 31, 12, 2, "#8aa05a");
    if (Math.sin(time * 3 + 1) > 0) rect(c, x - 2, y - 38 - ((time * 12) % 6), 3, 3, "#e8e8f0aa");
  } else if (k === "wardrobe") {
    rect(c, x - 14, y - 46, 28, 48, "#6b4428");
    rect(c, x - 12, y - 42, 11, 40, "#8a5a34");
    rect(c, x + 1, y - 42, 11, 40, "#8a5a34");
    rect(c, x - 3, y - 24, 2, 4, "#c9a25a");
    rect(c, x + 1, y - 24, 2, 4, "#c9a25a");
    rect(c, x - 15, y - 48, 30, 3, "#a87444");
  } else if (k === "bookshelf") {
    rect(c, x - 13, y - 48, 26, 50, "#5c3a1e");
    for (let i = 0; i < 4; i++) {
      rect(c, x - 11, y - 34 + i * 11, 22, 2, "#9a6234");
      for (let j = 0; j < 5; j++) rect(c, x - 10 + j * 4, y - 43 + i * 11, 3, 9 - ((i + j) % 3), ["#a83a30", "#4f6ab8", "#62904e", "#c9a25a", "#7a4a8a"][(i * 2 + j) % 5]);
    }
  } else if (k === "chair") {
    rect(c, x - 6, y - 10, 12, 4, "#9a6234");
    rect(c, x - 6, y - 22, 3, 14, "#7a5234");
    rect(c, x - 5, y - 6, 2, 7, "#5c3a1e");
    rect(c, x + 3, y - 6, 2, 7, "#5c3a1e");
  } else if (k === "washbasin") {
    rect(c, x - 10, y - 14, 20, 5, "#8a8a92");
    rect(c, x - 8, y - 13, 16, 2, "#6aa0c8");
    rect(c, x - 8, y - 9, 16, 10, "#7a5234");
  } else if (k === "vase") {
    rect(c, x - 4, y - 14, 8, 10, "#4f6ab8");
    rect(c, x - 2, y - 18, 4, 4, "#4f6ab8");
    rect(c, x - 6, y - 24, 4, 4, "#e0483a");
    rect(c, x + 2, y - 26, 4, 4, "#f2c14e");
    rect(c, x - 1, y - 22, 2, 5, "#3f8a3a");
  } else if (k === "weaponRack") {
    rect(c, x - 14, y - 34, 28, 4, "#6b4428");
    for (let i = 0; i < 4; i++) {
      rect(c, x - 11 + i * 7, y - 32, 2, 22, "#c8d4d8");
      rect(c, x - 12 + i * 7, y - 12, 4, 2, "#c9a25a");
    }
  }
}
function skeleton(c, x, y, time, king = false) {
  const scale = king ? 1.9 : 1;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const step = Math.sin(time * 7) * 2;
  rect(c, -6, -25, 12, 10, "#c9c6ad");
  rect(c, -4, -24, 2, 3, "#3c3648");
  rect(c, 3, -24, 2, 3, "#3c3648");
  rect(c, -2, -18, 5, 2, "#736d65");
  rect(c, -1, -15, 2, 12, "#c7c3aa");
  for (let i = 0; i < 3; i++)
    line(
      c,
      [
        [-5, -13 + i * 3],
        [5, -13 + i * 3],
      ],
      "#b9b59a",
      2,
    );
  line(
    c,
    [
      [-5, -13],
      [-10, -7],
      [-11, -3],
    ],
    "#c5bda5",
    2,
  );
  line(
    c,
    [
      [5, -13],
      [10, -8],
      [12, -4],
    ],
    "#c5bda5",
    2,
  );
  rect(c, -5, -3 + step, 3, 8, "#b4b29c");
  rect(c, 3, -3 - step, 3, 8, "#b4b29c");
  if (king) {
    rect(c, -10, -30, 20, 5, "#b89966");
    for (const offset of [-8, -1, 6]) rect(c, offset, -36, 3, 8, "#efd099");
    rect(c, -8, -13, 5, 19, "#7c638d");
    rect(c, 5, -13, 5, 19, "#7c638d");
    line(
      c,
      [
        [15, -29],
        [15, 5],
      ],
      "#8b725b",
      3,
    );
    rect(c, 11, -32, 8, 8, "#cbb4f1");
  } else {
    line(
      c,
      [
        [12, -15],
        [17, -10],
        [16, -3],
      ],
      "#a1855e",
      2,
    );
  }
  c.restore();
}
// Act III shadows: translucent bodies, violet eyes; Nerei carries a black sun.
function shadowFigure(c, e, time) {
  const { x, type } = e,
    boss = type === "eclipse",
    herald = type === "herald",
    size = boss ? 2.2 : herald ? 1.35 : 1,
    hover = Math.sin(time * 2.5 + x * 0.1) * (boss ? 3 : 2),
    y = e.y + hover;
  c.save();
  c.translate(x, y);
  if (boss) {
    // Black sun with a pulsing corona behind the body.
    const pulse = 1 + Math.sin(time * 2) * 0.05;
    const corona = c.createRadialGradient(0, -66, 18, 0, -66, 62 * pulse);
    corona.addColorStop(0, "#00000000");
    corona.addColorStop(0.45, "#c9a8ff88");
    corona.addColorStop(1, "#c9a8ff00");
    c.fillStyle = corona;
    c.fillRect(-70, -136, 140, 140);
    c.fillStyle = "#0b0712";
    c.beginPath();
    c.arc(0, -66, 26, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#f3e4ff";
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(0, -66, 26, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + time * 0.4,
        len = 8 + (i % 3) * 5;
      line(
        c,
        [
          [Math.cos(a) * 30, -66 + Math.sin(a) * 30],
          [Math.cos(a) * (30 + len), -66 + Math.sin(a) * (30 + len)],
        ],
        "#d7bcff",
        1,
      );
    }
  }
  c.scale(size, size);
  c.globalAlpha = boss ? 1 : 0.88;
  // Wispy tail instead of legs.
  for (let i = 0; i < 4; i++) {
    const sway = Math.sin(time * 5 + i) * 3;
    c.fillStyle = i % 2 ? "#2a1f3d" : "#3a2b55";
    c.beginPath();
    c.moveTo(-8 + i * 4, -8);
    c.lineTo(-6 + i * 4 + sway, 4 + (i % 2) * 3);
    c.lineTo(-3 + i * 4, -8);
    c.fill();
  }
  // Robe body.
  c.fillStyle = boss ? "#1c1229" : "#2d2142";
  c.beginPath();
  c.moveTo(-11, -8);
  c.lineTo(-8, -26);
  c.lineTo(0, -31);
  c.lineTo(8, -26);
  c.lineTo(11, -8);
  c.closePath();
  c.fill();
  rect(c, -7, -25, 3, 15, boss ? "#3b2a58" : "#4a3970");
  rect(c, -1, -24, 2, 15, e.color || "#9c86d6");
  // Hood and face.
  c.fillStyle = boss ? "#120b1d" : "#221833";
  c.beginPath();
  c.moveTo(-7, -27);
  c.lineTo(0, -40);
  c.lineTo(7, -27);
  c.lineTo(5, -22);
  c.lineTo(-5, -22);
  c.closePath();
  c.fill();
  rect(c, -4, -30, 8, 6, "#07040c");
  const eye = boss && e.phase >= 3 ? "#fff1a8" : "#d8b8ff";
  rect(c, -3, -28, 2, 1, eye);
  rect(c, 2, -28, 2, 1, eye);
  c.globalAlpha = 0.35;
  rect(c, -4, -29, 4, 3, eye);
  rect(c, 1, -29, 4, 3, eye);
  c.globalAlpha = boss ? 1 : 0.88;
  if (herald || boss) {
    // Horned crown.
    poly(c, [[-6, -36], [-10, -45], [-3, -38]], "#4e3b70");
    poly(c, [[6, -36], [10, -45], [3, -38]], "#4e3b70");
  }
  if (boss) {
    for (const dx of [-4, 0, 4]) poly(c, [[dx - 1.5, -40], [dx, -47], [dx + 1.5, -40]], "#d7bcff");
    if (e.phase >= 3) {
      // Light breaks through the cracks in the final phase.
      c.globalAlpha = 0.6 + Math.sin(time * 9) * 0.3;
      line(c, [[-6, -20], [-2, -14], [-5, -10]], "#fff1a8", 1);
      line(c, [[5, -22], [2, -16], [6, -11]], "#fff1a8", 1);
      c.globalAlpha = 1;
    }
  }
  // Clawed arms.
  const reach = Math.sin(time * 4) * 2;
  line(c, [[-9, -22], [-15, -15 + reach], [-17, -10 + reach]], "#3a2b55", 3);
  line(c, [[9, -22], [15, -15 - reach], [17, -10 - reach]], "#3a2b55", 3);
  for (const side of [-1, 1])
    for (let k = 0; k < 3; k++)
      rect(c, side * 17 + (side > 0 ? k : -k - 1), -10 - side * reach + k, 1, 3, "#c8b4ee");
  if (herald || boss) {
    // Orbiting eclipse shard / void orb.
    const a = time * 2.4,
      ox = Math.cos(a) * 16,
      oy = -24 + Math.sin(a) * 6;
    poly(c, [[ox, oy - 5], [ox + 3, oy], [ox, oy + 5], [ox - 3, oy]], boss ? "#f3e4ff" : "#b48cff");
    c.globalAlpha = 0.3;
    c.fillStyle = "#d7bcff";
    c.beginPath();
    c.arc(ox, oy, 6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  if (e.shield > 0) {
    c.save();
    c.globalAlpha = 0.35 + Math.sin(time * 8) * 0.12;
    c.strokeStyle = "#d7bcff";
    c.fillStyle = "#6b4fa833";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(x, y - 24 * size, 18 * size, 28 * size, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();
  }
}
const poly = (c, points, color) => {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)));
  c.closePath();
  c.fill();
};
export function drawAdvancedEnemy(c, e, time) {
  const { x, y, type } = e;
  const advanced = [
    "bat",
    "skeleton",
    "bandit",
    "spider",
    "shaman",
    "revenant",
    "boneKing",
    "frostTyrant",
    "broodQueen",
    "stormLord",
    "shade",
    "herald",
    "eclipse",
  ];
  if (!advanced.includes(type)) return false;
  c.fillStyle = "#10192455";
  c.beginPath();
  c.ellipse(x, y + 4, e.boss ? 27 : 12, 5, 0, 0, Math.PI * 2);
  c.fill();
  if (type === "shade" || type === "herald" || type === "eclipse")
    shadowFigure(c, e, time);
  else if (type === "skeleton" || type === "boneKing")
    skeleton(c, x, y, time, type === "boneKing");
  else if (type === "bat") {
    const wing = Math.sin(time * 12) * 7;
    line(
      c,
      [
        [x - 2, y - 13],
        [x - 15, y - 21 + wing],
        [x - 19, y - 12],
        [x - 8, y - 8],
        [x, y - 12],
        [x + 8, y - 8],
        [x + 19, y - 12],
        [x + 15, y - 21 + wing],
        [x + 2, y - 13],
      ],
      "#968daa",
      3,
    );
    rect(c, x - 3, y - 16, 7, 10, "#736887");
    rect(c, x - 2, y - 14, 1, 2, "#efd693");
    rect(c, x + 2, y - 14, 1, 2, "#efd693");
  } else if (type === "spider" || type === "broodQueen") {
    const b = type === "broodQueen" ? 2.3 : 1;
    c.save();
    c.translate(x, y);
    c.scale(b, b);
    for (let i = 0; i < 4; i++) {
      const yy = -15 + i * 5,
        step = Math.sin(time * 5 + i) * 3;
      line(
        c,
        [
          [-8, yy],
          [-19, yy - 4 + step],
          [-24, yy + 7],
        ],
        "#81905e",
        2,
      );
      line(
        c,
        [
          [8, yy],
          [19, yy - 4 - step],
          [24, yy + 7],
        ],
        "#81905e",
        2,
      );
    }
    rect(c, -11, -21, 22, 19, "#718653");
    rect(c, -8, -20, 16, 13, type === "broodQueen" ? "#9eb06e" : "#9aab70");
    rect(c, -5, -12, 10, 9, "#506746");
    for (const dx of [-5, 1, 5]) rect(c, dx, -10, 2, 2, "#f1da82");
    rect(c, -4, -23, 9, 5, "#b7b988");
    if (e.phase >= 2) {
      rect(c, -6, -22, 3, 3, "#e9bc8c");
      rect(c, 4, -21, 3, 3, "#e9bc8c");
    }
    c.restore();
  } else if (type === "frostTyrant") {
    rect(c, x - 20, y - 58, 40, 44, "#79a8b7");
    rect(c, x - 15, y - 57, 30, 38, "#b0d7da");
    rect(c, x - 28, y - 40, 11, 33, "#8dbbc5");
    rect(c, x + 17, y - 40, 11, 33, "#8dbbc5");
    rect(c, x - 17, y - 13, 11, 18, "#769ea9");
    rect(c, x + 6, y - 13, 11, 18, "#769ea9");
    for (const dx of [-18, -5, 12]) {
      c.fillStyle = "#c3f0ee";
      c.beginPath();
      c.moveTo(x + dx, y - 58);
      c.lineTo(x + dx + 4, y - 76);
      c.lineTo(x + dx + 10, y - 58);
      c.fill();
    }
    rect(c, x - 9, y - 44, 5, 4, "#d8ffff");
    rect(c, x + 6, y - 44, 5, 4, "#d8ffff");
    rect(c, x - 5, y - 28, 10, 10, "#80e2eb");
  } else {
    const boss = type === "stormLord",
      size = boss ? 1.9 : 1;
    c.save();
    c.translate(x, y + Math.sin(time * 3) * (boss ? 3 : 0));
    c.scale(size, size);
    const color =
      type === "bandit"
        ? "#927258"
        : type === "revenant"
          ? "#758379"
          : type === "shaman"
            ? "#9272a6"
            : "#a18abc";
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(-10, -19);
    c.lineTo(-14, 3);
    c.lineTo(14, 3);
    c.lineTo(10, -19);
    c.closePath();
    c.fill();
    rect(c, -6, -31, 12, 14, boss ? "#b9a6c5" : "#988977");
    rect(c, -7, -32, 14, 6, color);
    rect(c, -3, -24, 2, 2, "#efd295");
    rect(c, 3, -24, 2, 2, "#efd295");
    rect(c, -11, -15, 4, 15, "#786580");
    rect(c, 8, -15, 4, 15, "#786580");
    if (type === "bandit")
      line(
        c,
        [
          [14, -20],
          [14, 3],
        ],
        "#dfdbbd",
        3,
      );
    else {
      line(
        c,
        [
          [15, -31],
          [15, 4],
        ],
        "#957863",
        2,
      );
      rect(c, 12, -34, 7, 7, boss ? "#eed8ff" : "#bc9ddd");
    }
    if (boss) {
      for (let i = 0; i < 4; i++) {
        const a = time + (i * Math.PI) / 2;
        rect(c, Math.cos(a) * 22, Math.sin(a) * 11 - 37, 4, 4, "#dbc0ff");
      }
      rect(c, -4, -37, 8, 4, "#dec7f1");
    }
    c.restore();
  }
  if (e.boss && e.ward) {
    c.strokeStyle = "#dbc4f0a0";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(x, y - 26, 33, 46, 0, 0, Math.PI * 2);
    c.stroke();
  }
  if (e.windup > 0) {
    line(
      c,
      [
        [x, y - 8],
        [e.aimX || x, e.aimY || y],
      ],
      "#efa989",
      1.5,
    );
  }
  drawStatus(c, e, time, e.boss ? 80 : 43);
  return true;
}
export function drawSkillEffect(c, e, time) {
  if (!e.style) return;
  const progress = 1 - e.life / e.maxLife,
    r = e.radius * progress;
  c.save();
  c.globalAlpha = Math.min(1, (e.life / e.maxLife) * 1.6);
  c.strokeStyle = e.color;
  c.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 + time * 0.5,
      x = e.x + Math.cos(a) * r,
      y = e.y + Math.sin(a) * r;
    if (["lightning", "chainlightning", "thunderstrike"].includes(e.style)) {
      line(
        c,
        [
          [x - 4, y - 8],
          [x + 3, y - 3],
          [x - 3, y + 3],
          [x + 4, y + 8],
        ],
        e.color,
        2,
      );
    } else if (["fire", "meteor"].includes(e.style)) {
      line(
        c,
        [
          [x - 4, y + 5],
          [x - 2, y - 2],
          [x + 2, y - 9],
          [x + 4, y + 5],
        ],
        e.color,
        2,
      );
    } else if (["void", "stealth"].includes(e.style)) {
      c.beginPath();
      c.arc(x, y, 3 + Math.sin(time * 4 + i), 0, Math.PI * 2);
      c.stroke();
    } else if (e.style === "frostnova") {
      line(
        c,
        [
          [x, y - 6],
          [x - 4, y],
          [x, y + 7],
          [x + 4, y],
          [x, y - 6],
        ],
        "#cceff9",
        1,
      );
    } else if (e.style === "whirlwind") {
      c.beginPath();
      c.arc(e.x, e.y, r, a, a + 0.24);
      c.stroke();
    } else
      line(
        c,
        [
          [x, y],
          [e.x + Math.cos(a) * r * 0.75, e.y + Math.sin(a) * r * 0.75],
        ],
        e.color,
        2,
      );
  }
  c.restore();
}

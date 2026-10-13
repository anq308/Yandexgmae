import { weapons } from "./equipment.js";
import { wearables } from "./gear.js";
import { TILE, WIDTH, HEIGHT, regionAt } from "./world.js";
const r = (c, x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
const poly = (c, points, col) => {
  c.fillStyle = col;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
};
const shadow = (c, x, y, w = 18) => {
  c.fillStyle = "#142b2640";
  c.beginPath();
  c.ellipse(x, y + 3, w, 5, 0, 0, Math.PI * 2);
  c.fill();
};
const tint = (hex, amount) => {
  const value = parseInt(hex.replace("#", ""), 16);
  if (!Number.isFinite(value)) return hex;
  return (
    "#" +
    [(value >> 16) & 255, (value >> 8) & 255, value & 255]
      .map((v) =>
        Math.max(0, Math.min(255, v + amount))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
};
export function drawWeapon(c, id, phase = 0) {
  const variant = weapons[id];
  const glow = (variant?.element && variant.color) || {
    flameblade: "#ffb76d",
    titanblade: "#e0b9ff",
    frostSpear: "#a3e9ff",
    moonbow: "#a3e9ff",
    venombow: "#bddf81",
    stormbow: "#e0b9ff",
    emberstaff: "#ffb76d",
    tidestaff: "#a3e9ff",
    voidstaff: "#ba9afa",
    thunderwand: "#e0b9ff",
  }[id];
  const base = variant?.appearance || id;
  id =
    {
      scimitar: "sword",
      flameblade: "greatsword",
      titanblade: "greatsword",
      frostSpear: "spear",
      longbow: "bow",
      moonbow: "bow",
      venombow: "bow",
      stormbow: "bow",
      shadowdaggers: "daggers",
      repeater: "crossbow",
      earthstaff: "staff",
      emberstaff: "staff",
      moonstaff: "wand",
      tidestaff: "frostStaff",
      voidstaff: "staff",
      thunderwand: "wand",
    }[base] || base;
  const radiant = variant?.element === "light";
  const swing = Math.sin(phase * Math.PI) * 0.8;
  c.save();
  c.translate(9, -10);
  c.rotate(-swing);
  if (mythicWeapon(c, id, performance.now() / 1000)) {
    c.restore();
    return;
  }
  if (radiant) {
    c.save();
    c.globalAlpha = 0.35 + Math.sin(phase * 6 + performance.now() / 300) * 0.1;
    c.fillStyle = "#fff2b8";
    c.translate(2, -16);
    for (let i = 0; i < 6; i++) {
      c.rotate(Math.PI / 3);
      c.fillRect(-1, -22, 2, 7);
    }
    c.restore();
  }
  if (variant?.lifesteal) {
    c.shadowColor = "#e0585e";
    c.shadowBlur = 6;
  }
  if (glow) {
    c.shadowColor = glow;
    c.shadowBlur = 7;
  }
  if (id === "mace") {
    r(c, 1, -16, 3, 27, "#7a5236");
    r(c, 0, 5, 5, 3, "#d1ae73");
    r(c, -3, -25, 11, 10, "#9aa8ae");
    r(c, -2, -24, 4, 4, "#e2ebe6");
    for (const [dx, dy] of [[-5, -21], [8, -21], [2, -28], [2, -14]])
      r(c, dx, dy, 2, 2, "#cdd6d8");
    r(c, -3, -16, 11, 2, "#c9a24a");
  } else if (id === "scythe") {
    r(c, 1, -26, 2, 38, "#5c4630");
    r(c, 1, -26, 1, 38, "#8a6a48");
    poly(c, [[2, -27], [-14, -24], [-20, -16], [-12, -21], [2, -22]], "#c8d4d0");
    poly(c, [[2, -27], [-14, -24], [-13, -23], [2, -25]], "#f4fff4");
    r(c, 0, -1, 4, 2, "#9fe0a0");
  } else if (id === "skullstaff") {
    r(c, 0, -18, 2, 30, "#5c4a3a");
    r(c, -1, -10, 4, 2, "#8a7a5a");
    r(c, -3, -26, 8, 7, "#e8e2cc");
    r(c, -2, -24, 2, 2, "#1c1a22");
    r(c, 2, -24, 2, 2, "#1c1a22");
    r(c, -2, -20, 6, 1, "#b8b29c");
    r(c, -1, -19, 1, 1, "#e8e2cc");
    r(c, 2, -19, 1, 1, "#e8e2cc");
  } else if (id === "axe" || id === "hammer") {
    r(c, 1, -21, 3, 32, "#825438");
    r(c, 0, 5, 5, 3, "#d1ae73");
    if (id === "hammer") {
      r(c, -7, -26, 20, 11, "#8ba7b3");
      r(c, -5, -25, 16, 3, "#dce4df");
      r(c, 0, -27, 5, 13, "#cdb781");
    } else {
      poly(
        c,
        [
          [-8, -27],
          [3, -23],
          [12, -29],
          [13, -15],
          [3, -17],
          [-8, -13],
        ],
        "#a6bcc4",
      );
      r(c, 1, -25, 3, 11, "#d8c68b");
    }
  } else if (id === "spear") {
    r(c, 1, -27, 2, 38, "#8d6646");
    poly(
      c,
      [
        [-2, -27],
        [2, -35],
        [6, -27],
        [2, -23],
      ],
      "#b7cdd0",
    );
    r(c, 2, -32, 1, 8, "#e0eee5");
    r(c, -1, -23, 6, 2, "#c9aa69");
  } else if (id === "sword" || id === "greatsword") {
    const wide = id === "greatsword" ? 5 : 3,
      length = id === "greatsword" ? 27 : 21;
    r(c, 0, -length, wide, length, "#8ca8b0");
    r(c, 1, -length, 1, length, "#eff5dd");
    poly(
      c,
      [
        [0, -length],
        [wide / 2, -length - 4],
        [wide, -length],
      ],
      "#e2ecdf",
    );
    r(c, -3, 0, wide + 6, 2, "#d5b470");
    r(c, 1, 2, 2, 8, "#70513a");
    r(c, 0, 8, 4, 2, "#ccad6a");
  } else if (id === "whip") {
    // Handle and a lashing, curling thong.
    r(c, 0, -6, 3, 14, "#5a3a22");
    r(c, -1, 6, 5, 3, "#c9a24a");
    c.strokeStyle = "#8a5a34";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(1, -6);
    const lash = Math.sin(phase * Math.PI) * 14;
    c.quadraticCurveTo(-8 - lash, -20, 6 + lash, -30 - lash * 0.5);
    c.stroke();
    r(c, 5 + lash, -31 - lash * 0.5, 3, 2, "#c8a070");
  } else if (id === "fists") {
    // Wrapped fists, punching forward on the swing.
    const jab = Math.sin(phase * Math.PI) * 8;
    for (const [off, j] of [[-15, 0], [1, jab]]) {
      r(c, off + j * 0.6, -6 - j * 0.3, 7, 6, "#e8c8a0");
      r(c, off + j * 0.6, -6 - j * 0.3, 7, 2, variant?.color || "#f4e0c0");
      r(c, off + j * 0.6, -3 - j * 0.3, 7, 1, variant?.color || "#f4e0c0");
    }
  } else if (id === "wrench") {
    r(c, 1, -16, 3, 27, "#8a9098");
    r(c, 1, -16, 1, 27, "#c8d0d8");
    r(c, -4, -24, 13, 4, "#8a9098");
    r(c, -4, -28, 4, 6, "#8a9098");
    r(c, 5, -28, 4, 6, "#8a9098");
    r(c, 0, 8, 5, 4, "#4a3020");
  } else if (id === "gun") {
    // A flintlock with a brass-bound barrel.
    r(c, -2, -26, 4, 24, "#4a4a52");
    r(c, -1, -26, 1, 24, "#8a9098");
    r(c, -3, -10, 6, 3, "#c8a050");
    r(c, -3, -20, 6, 2, "#c8a050");
    r(c, -4, -2, 8, 10, "#6a4428");
    r(c, 3, -6, 3, 4, "#3a3a42");
    if (phase > 0 && phase < 0.4) {
      r(c, -3, -32, 6, 5, "#ffe08a");
      r(c, -1, -36, 2, 4, "#fff4c0");
    }
  } else if (id === "claws") {
    for (const off of [-16, 2]) {
      r(c, off - 1, -2, 6, 5, "#6a4a2e");
      for (let k = 0; k < 3; k++) {
        r(c, off + k * 2, -10 - k, 1, 9 + k, "#e8e2cc");
        r(c, off + k * 2, -11 - k, 1, 2, "#ffffff");
      }
    }
  } else if (id === "daggers") {
    for (const offset of [-17, 1]) {
      r(c, offset, -12, 2, 13, "#d3e2dc");
      r(c, offset - 2, 1, 6, 2, "#bc9e63");
      r(c, offset, 3, 2, 5, "#76513e");
    }
  } else if (id === "bow") {
    c.strokeStyle = "#71523b";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, -4, 12, -Math.PI / 2, Math.PI / 2);
    c.stroke();
    c.strokeStyle = "#c9a468";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(0, -4, 11, -Math.PI / 2, Math.PI / 2);
    c.stroke();
    r(c, 0, -16, 1, 24, "#e3d6a8");
    r(c, -3, -5, 15, 1, "#b6d2c5");
  } else if (id === "crossbow") {
    r(c, -5, -6, 16, 4, "#735941");
    r(c, -1, -14, 3, 21, "#b5a888");
    r(c, -8, -12, 21, 2, "#c9bb90");
    r(c, -8, -11, 2, 7, "#745741");
    r(c, 12, -11, 2, 7, "#745741");
    r(c, 0, -17, 1, 12, "#dae3d0");
  } else {
    const color =
      id === "frostStaff" ? "#a6ddf8" : id === "wand" ? "#d5e5a9" : "#9edfd8";
    r(c, 0, -20, 2, id === "wand" ? 24 : 32, "#7d5d44");
    r(c, -2, -21, 6, 2, "#bdad77");
    poly(
      c,
      [
        [1, -31],
        [6, -25],
        [1, -18],
        [-4, -25],
      ],
      color,
    );
    r(c, 0, -29, 2, 8, "#f3ffec");
    if (id === "frostStaff") {
      r(c, -6, -25, 14, 1, color);
      r(c, 1, -33, 1, 17, color);
    }
  }
  if (glow) {
    c.fillStyle = glow;
    for (let i = 0; i < 3; i++) {
      c.globalAlpha = 0.45 + i * 0.15;
      c.fillRect(-6 + i * 6, -32 + Math.sin(phase * 8 + i) * 4, 2, 2);
    }
    c.globalAlpha = 1;
  }
  c.restore();
}
// Mythic weapons: oversized, animated and unmistakable.
function mythicWeapon(c, id, t) {
  if (id === "infernoBlade") {
    // A huge obsidian greatsword with a molten core and living flames.
    c.shadowColor = "#ff5a1a";
    c.shadowBlur = 10;
    poly(c, [[-4, 0], [-5, -38], [2, -48], [9, -38], [8, 0]], "#2a1a18");
    poly(c, [[-2, -2], [-2, -37], [2, -44], [6, -37], [6, -2]], "#ff6a1a");
    r(c, 1, -40, 2, 38, "#ffe08a");
    for (let i = 0; i < 6; i++) r(c, -1 + (i % 2) * 5, -34 + i * 6, 1, 3, "#ffb03a");
    poly(c, [[-12, 2], [-4, -2], [8, -2], [16, 2], [8, 4], [-4, 4]], "#5a2a1a");
    r(c, -10, 1, 4, 2, "#ff8a3a");
    r(c, 12, 1, 4, 2, "#ff8a3a");
    r(c, 0, 4, 4, 9, "#3a2016");
    r(c, -1, 12, 6, 3, "#ffb03a");
    c.shadowBlur = 0;
    for (let i = 0; i < 7; i++) {
      const k = (t * 1.4 + i / 7) % 1,
        x = -3 + ((i * 37) % 10) + Math.sin(t * 6 + i) * 2,
        y = -6 - k * 48;
      c.globalAlpha = 1 - k;
      r(c, x, y, 3 - k * 2, 3 - k * 2, k < 0.4 ? "#ffe08a" : k < 0.7 ? "#ff8a3a" : "#c83a1a");
    }
    c.globalAlpha = 1;
    return true;
  }
  if (id === "phoenixBow") {
    // The bow's limbs are burning wings; embers fall from the feathers.
    const flap = Math.sin(t * 4) * 2;
    c.shadowColor = "#ffb03a";
    c.shadowBlur = 8;
    for (const dir of [-1, 1]) {
      poly(c, [[0, -4], [6, -4 + dir * 10], [4, -4 + dir * 20 + flap * dir], [-2, -4 + dir * 24 + flap * dir], [2, -4 + dir * 12]], "#ff6a1a");
      poly(c, [[1, -4], [5, -4 + dir * 10], [3, -4 + dir * 18 + flap * dir], [0, -4 + dir * 12]], "#ffd36a");
      for (let i = 0; i < 3; i++) r(c, 3 + i * 2, -4 + dir * (12 + i * 4) + flap * dir, 3, 2, i === 2 ? "#ffffff" : "#ffb03a");
    }
    c.shadowBlur = 0;
    r(c, -1, -27, 1, 46, "#fff4c0");
    r(c, -2, -7, 5, 6, "#c83a1a");
    r(c, -1, -6, 3, 4, "#ffe08a");
    for (let i = 0; i < 4; i++) {
      const k = (t + i / 4) % 1;
      c.globalAlpha = 1 - k;
      r(c, 6 + Math.sin(t * 3 + i) * 4, -10 + k * 26, 2, 2, "#ffb03a");
    }
    c.globalAlpha = 1;
    return true;
  }
  if (id === "cosmicStaff") {
    // A tall staff holding a nebula; three stars orbit it.
    r(c, 0, -22, 3, 38, "#2a2448");
    r(c, 1, -22, 1, 38, "#5a4a9a");
    r(c, -3, -24, 9, 3, "#c9a24a");
    const glow = c.createRadialGradient(2, -34, 1, 2, -34, 12);
    glow.addColorStop(0, "#ffffff");
    glow.addColorStop(0.3, "#c8a8ff");
    glow.addColorStop(1, "#4a2a9a00");
    c.fillStyle = glow;
    c.beginPath();
    c.arc(2, -34, 12, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#c9a24a";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(2, -34, 10, 4, Math.sin(t) * 0.3, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 3; i++) {
      const a = t * 2 + (i * Math.PI * 2) / 3,
        x = 2 + Math.cos(a) * 12,
        y = -34 + Math.sin(a) * 5;
      r(c, x - 1, y - 1, 3, 3, ["#fff4c0", "#a8e4ff", "#ff9ad0"][i]);
    }
    return true;
  }
  if (id === "seraphHammer") {
    // A golden maul with feathered wings and a halo above it.
    const flap = Math.sin(t * 3) * 2;
    r(c, 1, -20, 3, 34, "#f4ead0");
    r(c, 0, 12, 5, 3, "#ffd36a");
    c.shadowColor = "#fff4c0";
    c.shadowBlur = 9;
    r(c, -7, -30, 18, 12, "#ffd36a");
    r(c, -6, -29, 16, 3, "#fff8d8");
    r(c, 0, -32, 5, 16, "#f4ead0");
    c.shadowBlur = 0;
    for (const dir of [-1, 1])
      for (let i = 0; i < 4; i++) r(c, 2 + dir * (11 + i * 3) - (dir < 0 ? 3 : 0), -30 + i * 2 - flap, 3, 8 - i, i % 2 ? "#efe6d0" : "#ffffff");
    c.globalAlpha = 0.85;
    c.strokeStyle = "#ffe08a";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(2, -38 + Math.sin(t * 2), 7, 2.5, 0, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
    return true;
  }
  if (id === "lichStaff") {
    // A crowned skull wreathed in green soul-fire, with runes circling it.
    r(c, 0, -20, 3, 36, "#2a2a30");
    r(c, 1, -20, 1, 36, "#5a6a5a");
    for (const y of [-8, 2]) r(c, -1, y, 5, 2, "#7aff9a");
    c.shadowColor = "#7aff9a";
    c.shadowBlur = 10;
    for (let i = 0; i < 5; i++) {
      const h = 8 + Math.sin(t * 9 + i) * 3;
      r(c, -6 + i * 3, -34 - h, 2, h, i % 2 ? "#7aff9a" : "#c8ffd0");
    }
    c.shadowBlur = 0;
    r(c, -4, -32, 11, 9, "#e8e2cc");
    r(c, -3, -29, 3, 3, "#14121a");
    r(c, 2, -29, 3, 3, "#14121a");
    r(c, -2, -28, 1, 1, "#7aff9a");
    r(c, 3, -28, 1, 1, "#7aff9a");
    r(c, -2, -24, 7, 2, "#b8b29c");
    for (let i = 0; i < 4; i++) r(c, -5 + i * 3, -36 + (i % 2), 2, 4, "#ffd36a");
    for (let i = 0; i < 3; i++) {
      const a = -t * 2 + (i * Math.PI * 2) / 3;
      r(c, 1 + Math.cos(a) * 11, -28 + Math.sin(a) * 6, 2, 3, "#7aff9a");
    }
    return true;
  }
  if (id === "dragonFists") {
    // Burning gauntlets with a coiling dragon of flame.
    c.shadowColor = "#ff7a3a";
    c.shadowBlur = 8;
    for (const off of [-16, 1]) {
      r(c, off, -7, 8, 7, "#c83a1a");
      r(c, off, -7, 8, 2, "#ffd36a");
      r(c, off + 1, -4, 6, 1, "#ff8a2a");
    }
    c.shadowBlur = 0;
    for (let i = 0; i < 8; i++) {
      const a = t * 4 + i * 0.6,
        x = Math.cos(a) * (10 + i),
        y = -12 + Math.sin(a * 1.3) * 8 - i * 2;
      c.globalAlpha = 1 - i / 9;
      r(c, x, y, 3, 3, i < 2 ? "#fff4b0" : i < 5 ? "#ffa21a" : "#e8401a");
    }
    c.globalAlpha = 1;
    return true;
  }
  if (id === "worldCannon") {
    // A huge steam cannon with a blazing core and venting steam.
    r(c, -4, -34, 9, 36, "#3a3a42");
    r(c, -3, -34, 2, 36, "#6a7078");
    for (const y of [-30, -20, -10]) r(c, -5, y, 11, 3, "#c8a050");
    const glowC = c.createRadialGradient(0, -6, 1, 0, -6, 12);
    glowC.addColorStop(0, "#fff4c0");
    glowC.addColorStop(1, "#ff8a2a00");
    c.fillStyle = glowC;
    c.fillRect(-12, -18, 24, 24);
    r(c, -2, -8, 5, 5, "#ffb03a");
    r(c, -6, 2, 12, 6, "#6a4428");
    if (Math.sin(t * 5) > 0) {
      c.globalAlpha = 0.5;
      r(c, 5, -26 - ((t * 30) % 10), 5, 5, "#e8e8f0");
      c.globalAlpha = 1;
    }
    return true;
  }
  if (id === "beastStaff") {
    // A gnarled staff crowned with antlers and a howling wolf spirit.
    r(c, 0, -22, 3, 38, "#5a3a22");
    r(c, 1, -22, 1, 38, "#8a5a34");
    for (const [dx, dy] of [[-8, -36], [-6, -40], [6, -38], [9, -42], [-10, -32], [10, -34]]) r(c, dx, dy, 2, 8, "#e8d8b0");
    r(c, -7, -30, 16, 3, "#e8d8b0");
    const g2 = c.createRadialGradient(2, -40, 1, 2, -40, 14);
    g2.addColorStop(0, "#ffffffcc");
    g2.addColorStop(1, "#ffd06000");
    c.fillStyle = g2;
    c.fillRect(-12, -54, 28, 28);
    c.globalAlpha = 0.75 + Math.sin(t * 4) * 0.2;
    r(c, -4, -46, 10, 7, "#ffe8a0");
    r(c, 4, -50, 3, 4, "#ffe8a0");
    r(c, -3, -50, 3, 4, "#ffe8a0");
    r(c, 3, -44, 2, 2, "#3a2a14");
    r(c, 5, -41 + Math.sin(t * 6) * 1, 4, 2, "#fff4c0");
    c.globalAlpha = 1;
    return true;
  }
  if (id === "beastClaws") {
    // Blazing claws trailing living flame.
    c.shadowColor = "#ff7a3a";
    c.shadowBlur = 8;
    for (const off of [-16, 2]) {
      r(c, off - 1, -2, 7, 6, "#3a1a10");
      for (let k = 0; k < 3; k++) {
        r(c, off + k * 2, -14 - k * 2, 2, 13 + k * 2, "#ff8a2a");
        r(c, off + k * 2, -15 - k * 2, 1, 4, "#fff4b0");
      }
      for (let i = 0; i < 3; i++) {
        const k2 = (t * 2 + i / 3) % 1;
        c.globalAlpha = 1 - k2;
        r(c, off + i * 2, -18 - k2 * 14, 2, 2, k2 < 0.5 ? "#ffd04a" : "#ff6a1a");
      }
      c.globalAlpha = 1;
    }
    c.shadowBlur = 0;
    return true;
  }
  return false;
}
// Race silhouettes: elven ears, dwarven beards, orcish tusks, undead glow.
function drawRaceFeatures(c, race, skin, hair, back, side) {
  if (race === "elf") {
    r(c, -9, -31, 3, 2, skin);
    r(c, -8, -29, 2, 3, skin);
    r(c, 7, -31, 3, 2, tint(skin, -9));
    r(c, 6, -29, 2, 3, tint(skin, -9));
  } else if (race === "dwarf" && !back) {
    r(c, -5, -25, 10, 6, hair);
    r(c, -3, -19, 6, 4, hair);
    r(c, -1, -15, 2, 2, tint(hair, -20));
    r(c, -2, -24, 4, 1, tint(hair, 25));
  } else if (race === "orc" && !back) {
    r(c, -5, -29, 10, 1, tint(skin, -30));
    r(c, side ? 1 : -3, -23, 1, 2, "#f4ead0");
    r(c, side ? 4 : 2, -23, 1, 2, "#f4ead0");
  } else if (race === "beastkin") {
    // Triangular furry ears on the sides of the head, with pink insides and tufts.
    for (const d of [-1, 1]) {
      poly(c, [[d * 4, -32], [d * 9, -40], [d * 10, -31]], tint(hair, -12));
      poly(c, [[d * 5, -32], [d * 8.5, -38], [d * 9, -32]], back ? tint(hair, -25) : "#e8a8a0");
      r(c, d * 9 - (d < 0 ? 1 : 0), -41, 1, 2, tint(hair, 20));
    }
    if (!back) {
      r(c, -2, -24, 4, 1, tint(skin, -30));
      r(c, -5, -25, 2, 1, tint(skin, -18));
      r(c, 4, -25, 2, 1, tint(skin, -18));
    }
  } else if (race === "demonkin") {
    // Curved horns and glowing eyes.
    r(c, -7, -37, 2, 5, "#3a2a2a");
    r(c, -8, -39, 2, 3, "#5a4a4a");
    r(c, 6, -37, 2, 5, "#3a2a2a");
    r(c, 7, -39, 2, 3, "#5a4a4a");
    if (!back) {
      r(c, side ? 2 : -3, -27, 2, 1, "#ffb040");
      if (!side) r(c, 2, -27, 2, 1, "#ffb040");
    }
  } else if (race === "lizardfolk") {
    // A spiny crest and scaled cheeks.
    for (let i = 0; i < 4; i++) r(c, -1, -38 + i * 3, 2 + (i % 2), 3, tint(skin, -30));
    if (!back) {
      r(c, -5, -25, 2, 1, tint(skin, -25));
      r(c, 4, -25, 2, 1, tint(skin, -25));
      r(c, side ? 2 : -3, -27, 2, 2, "#e8d040");
      if (!side) r(c, 2, -27, 2, 2, "#e8d040");
    }
  } else if (race === "undead" && !back) {
    r(c, side ? 2 : -3, -27, 2, 2, "#9fe0a0");
    if (!side) r(c, 2, -27, 2, 2, "#9fe0a0");
    r(c, -4, -25, 1, 3, tint(skin, -35));
    r(c, 3, -30, 1, 4, tint(skin, -35));
  }
}
// Terraria-style class outfits: the same armor looks different per class,
// and higher tiers add ornaments, headgear and glowing details.
export const armorTier = { cloth: 1, leather: 2, chain: 3, scale: 3, grave: 4, plate: 4, frost: 5, runic: 5, shadow: 5, ember: 6, mithril: 6, storm: 7, dragon: 8, abyss: 8, seraph: 8 };
const armorPalette = { none: "#9a8466", cloth: "#a79877", leather: "#966c49", chain: "#8c9b9f", scale: "#7a9a7a", plate: "#a8b5b8", grave: "#9b8aae", frost: "#92bbc7", ember: "#b5816b", storm: "#b6a0d1", runic: "#a1b4aa", shadow: "#4a4458", mithril: "#c8dce8", dragon: "#a8382a", abyss: "#3a2a52", seraph: "#f4ead0" };
// Monks wear a saffron gi; engineers a leather apron, goggles and brass.
function drawCraftOutfit(c, cls, tier, raw, time, back, hasHelm) {
  if (cls === "monk") {
    const gi = mix(raw, "#e8902a", 0.6),
      dark = tint(gi, -30),
      light = tint(gi, 25),
      sash = tier >= 4 ? "#c83a2a" : "#6a3a1a";
    poly(c, [[-7, -21], [7, -21], [6, -7], [-6, -7]], gi);
    poly(c, [[-1, -21], [7, -21], [6, -7], [1, -7]], dark);
    r(c, -5, -20, 2, 12, light);
    if (!back) {
      poly(c, [[-4, -21], [0, -13], [4, -21]], tint(gi, -45));
      r(c, -1, -14, 2, 2, tint(gi, -45));
    }
    r(c, -7, -9, 14, 3, sash);
    r(c, 5, -9, 2, 6, sash);
    r(c, -5, -6, 4, 8, tint(gi, -20));
    r(c, 2, -6, 4, 8, tint(gi, -35));
    r(c, -10, -18, 3, 6, gi);
    r(c, 7, -18, 3, 6, dark);
    r(c, -10, -11, 3, 3, "#f4e0c0");
    r(c, 7, -11, 3, 3, "#f4e0c0");
    if (tier >= 2 && !back) for (let i = 0; i < 5; i++) r(c, -5 + i * 2.5, -21 + Math.abs(i - 2), 2, 2, "#6a3a1a");
    if (tier >= 3) {
      r(c, -7, -21, 14, 1, "#ffd36a");
      r(c, -7, -8, 14, 1, "#ffd36a");
    }
    if (tier >= 5 && !hasHelm) {
      r(c, -7, -32, 14, 2, "#c83a2a");
      r(c, -1, -33, 3, 3, "#7ad8a0");
      r(c, -9, -31, 3, 4, "#c83a2a");
    }
    if (tier >= 6) {
      c.globalAlpha = 0.5 + Math.sin(time * 3) * 0.2;
      for (let i = 0; i < 3; i++) {
        const a = time * 2 + (i / 3) * Math.PI * 2;
        r(c, Math.cos(a) * 13, -22 + Math.sin(a) * 5, 2, 2, "#ffe08a");
      }
      c.globalAlpha = 1;
    }
    return;
  }
  const leather = mix(raw, "#7a5232", 0.55),
    dark = tint(leather, -30),
    brass = "#c8a050";
  poly(c, [[-7, -21], [7, -21], [7, -7], [-7, -7]], "#5a6470");
  r(c, -6, -20, 12, 13, leather);
  r(c, -6, -20, 3, 13, tint(leather, 20));
  r(c, 3, -20, 3, 13, dark);
  if (!back) {
    r(c, -4, -18, 8, 10, tint(leather, -15));
    r(c, -2, -16, 4, 3, "#3a3a42");
  } else {
    // A backpack with a pressure tank and a pipe.
    r(c, -6, -22, 12, 13, "#6a5038");
    r(c, -4, -24, 3, 8, brass);
    r(c, 2, -26, 2, 6, "#6a7078");
  }
  r(c, -7, -9, 14, 3, "#4a3020");
  for (const x of [-5, -1, 3]) r(c, x, -9, 2, 4, x === -1 ? brass : "#8a9098");
  r(c, -5, -6, 4, 8, "#4a4a52");
  r(c, 2, -6, 4, 8, "#3a3a42");
  r(c, -10, -18, 3, 7, leather);
  r(c, 7, -18, 3, 7, dark);
  r(c, -10, -11, 3, 3, "#6a5038");
  r(c, 7, -11, 3, 3, "#6a5038");
  if (!hasHelm) {
    // Goggles pushed up on the forehead.
    r(c, -6, -31, 12, 2, "#4a3020");
    r(c, -5, -32, 4, 3, brass);
    r(c, 1, -32, 4, 3, brass);
    r(c, -4, -31, 2, 1, "#7ac8ff");
    r(c, 2, -31, 2, 1, "#7ac8ff");
  }
  if (tier >= 3) {
    r(c, -10, -21, 5, 4, brass);
    r(c, 5, -21, 5, 4, brass);
    r(c, -9, -20, 3, 1, "#f0d080");
  }
  if (tier >= 5 && !back) {
    const pulse = 0.6 + Math.sin(time * 5) * 0.3;
    c.globalAlpha = pulse;
    r(c, -2, -16, 4, 3, "#7ac8ff");
    c.globalAlpha = 1;
  }
  if (tier >= 6 && Math.sin(time * 4) > 0.3) {
    c.globalAlpha = 0.4;
    r(c, -9, -30 - ((time * 20) % 10), 4, 4, "#e8e8f0");
    c.globalAlpha = 1;
  }
}
// Mythic armor grows wings: leathery dragon wings, tattered shadow wings or feathered angel wings.
const wingArmors = { dragon: 1, abyss: 1, seraph: 1 };
function drawWings(c, kind, time) {
  const flap = Math.sin(time * 3) * 4,
    lift = Math.sin(time * 3) * 2;
  for (const dir of [-1, 1]) {
    c.save();
    c.scale(dir, 1);
    if (kind === "seraph") {
      // Three rows of feathers, gold-tipped.
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 6 - row; i++) {
          const x = 5 + i * 4 + row * 2,
            y = -26 - i * 2.2 + row * 6 - flap * (i / 5) - lift;
          r(c, x, y, 4, 10 - row * 2, row === 0 ? "#ffffff" : row === 1 ? "#efe6d0" : "#d8ccb0");
          if (i === 5 - row) r(c, x + 1, y - 2, 3, 3, "#ffd36a");
        }
      r(c, 3, -26 - lift, 4, 8, "#fff8e8");
    } else if (kind === "dragon") {
      poly(c, [[4, -22], [16, -32 - flap], [30, -28 - flap], [26, -18 - flap / 2], [22, -10], [16, -14], [10, -8], [6, -12]], "#7a1e18");
      poly(c, [[6, -20], [16, -30 - flap], [28, -27 - flap], [24, -19 - flap / 2], [20, -12], [15, -15], [10, -10]], "#b8382a");
      c.strokeStyle = "#3a120e";
      c.lineWidth = 1.5;
      for (const [ex, ey] of [[22, -10], [16, -14], [10, -8]]) {
        c.beginPath();
        c.moveTo(16, -31 - flap);
        c.lineTo(ex, ey);
        c.stroke();
      }
      r(c, 15, -34 - flap, 3, 3, "#e8dcc0");
      r(c, 29, -30 - flap, 2, 3, "#e8dcc0");
    } else {
      // Tattered shadow wings with drifting void motes.
      poly(c, [[4, -22], [14, -34 - flap], [28, -30 - flap], [24, -22], [27, -16], [20, -15], [22, -8], [14, -12], [12, -6], [6, -12]], "#1a1226");
      poly(c, [[6, -21], [14, -31 - flap], [25, -28 - flap], [21, -21], [17, -17], [11, -14]], "#3a2a52");
      for (let i = 0; i < 3; i++) {
        const t = (time * 0.6 + i * 0.33) % 1;
        c.globalAlpha = 1 - t;
        r(c, 14 + i * 5, -20 - t * 18 - flap * 0.5, 2, 2, "#b08aff");
        c.globalAlpha = 1;
      }
    }
    c.restore();
  }
}
// A brief flash of golden wings when the paladin dashes.
export function drawWingFlash(c, e, time) {
  const p = 1 - e.life / e.maxLife;
  c.save();
  c.globalAlpha = 1 - p;
  c.translate(e.x, e.y);
  c.scale(1 + p * 0.6, 1 + p * 0.6);
  c.globalCompositeOperation = "lighter";
  drawWings(c, "seraph", time);
  c.restore();
}
function drawHalo(c, time) {
  const bob = Math.sin(time * 2) * 1;
  c.save();
  c.globalAlpha = 0.85;
  c.strokeStyle = "#ffe08a";
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, -40 + bob, 7, 2.5, 0, 0, Math.PI * 2);
  c.stroke();
  c.globalAlpha = 0.25;
  c.fillStyle = "#fff4c0";
  c.beginPath();
  c.ellipse(0, -40 + bob, 10, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
const mix = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  return "#" + [16, 8, 0].map((sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t).toString(16).padStart(2, "0")).join("");
};
function drawClassArmor(c, cls, id, time, back, hasHelm) {
  if (cls === "monk" || cls === "engineer") return drawCraftOutfit(c, cls, armorTier[id] || 1, armorPalette[id] || "#9a8466", time, back, hasHelm);
  // New classes borrow an outfit cut: summoners dress like hunters, shapeshifters wear druid robes.
  const druid = cls === "shapeshifter";
  if (cls === "summoner") cls = "ranger";
  if (druid) cls = "mage";
  const tier = armorTier[id] || 1,
    raw = armorPalette[id] || "#a79877",
    pulse = 0.55 + Math.sin(time * 4) * 0.35;
  if (cls === "mage" || cls === "necromancer") {
    const necro = cls === "necromancer",
      base = necro ? mix(raw, "#241c30", 0.65) : druid ? mix(raw, "#3a6a3a", 0.5) : mix(raw, "#4a3a9a", 0.45),
      dark = tint(base, -30),
      light = tint(base, 25),
      trim = necro ? (tier >= 4 ? "#9fe0a0" : "#8a8470") : tier >= 4 ? "#efcf83" : "#c9b27b";
    // Long robe hides the legs; sleeves with cuffs.
    poly(c, [[-7, -21], [7, -21], [9, 4], [-9, 4]], base);
    poly(c, [[2, -21], [7, -21], [9, 4], [3, 4]], dark);
    r(c, -5, -20, 3, 18, light);
    r(c, -10, -19, 4, 11, base);
    r(c, 6, -19, 4, 11, dark);
    r(c, -10, -10, 4, 2, trim);
    r(c, 6, -10, 4, 2, trim);
    r(c, -7, -10, 14, 2, necro ? "#3a3044" : trim);
    if (tier >= 2) r(c, -9, 2, 18, 2, trim);
    if (tier >= 3) {
      r(c, -1, -20, 2, 22, trim);
      r(c, -5, -22, 10, 2, dark);
      if (necro) {
        r(c, -2, -11, 4, 3, "#e2dccb");
        r(c, -1, -10, 1, 1, "#14121a");
        r(c, 1, -10, 1, 1, "#14121a");
      } else {
        r(c, -2, -16, 4, 4, "#ffe08a");
        r(c, -1, -17, 2, 6, "#fff4c0");
      }
    }
    if (tier >= 4) {
      if (necro)
        for (const x of [-11, 6]) {
          r(c, x, -23, 6, 5, "#e2dccb");
          r(c, x + 1, -21, 1, 1, "#14121a");
          r(c, x + 3, -21, 1, 1, "#14121a");
        }
      else {
        r(c, -11, -22, 5, 4, "#c9a24a");
        r(c, 6, -22, 5, 4, "#c9a24a");
      }
    }
    if (tier >= 5) {
      c.globalAlpha = pulse;
      if (necro) for (let i = 0; i < 3; i++) r(c, -4, -18 + i * 3, 8, 1, "#9fe0a0");
      else for (const [x, y] of [[-4, -6], [3, -3], [-2, 0]]) r(c, x, y, 2, 2, "#a8ecff");
      c.globalAlpha = 1;
    }
    if (!hasHelm && !back) {
      if (necro) {
        // Deep hood with glowing eyes.
        poly(c, [[-8, -27], [0, -38], [8, -27], [7, -21], [-7, -21]], dark);
        r(c, -5, -30, 10, 8, "#0e0b12");
        if (tier >= 3) {
          r(c, -3, -27, 2, 1, "#9fe0a0");
          r(c, 2, -27, 2, 1, "#9fe0a0");
        }
      } else if (druid) {
        // A leafy circlet that grows antlers with better armour.
        r(c, -8, -33, 16, 3, "#4f8a3a");
        for (const x of [-7, -3, 2, 6]) r(c, x, -35, 3, 3, "#6fae5e");
        if (tier >= 3)
          for (const d of [-1, 1]) {
            r(c, d * 6 - (d < 0 ? 1 : 0), -40, 2, 7, "#e8d8b0");
            r(c, d * 9 - (d < 0 ? 1 : 0), -43, 2, 5, "#e8d8b0");
            r(c, d * 6 - (d < 0 ? 3 : -1), -42, 4, 2, "#e8d8b0");
          }
      } else if (tier >= 2) {
        poly(c, [[-9, -31], [0, -44 - tier], [8, -31]], base);
        poly(c, [[-9, -31], [0, -44 - tier], [-2, -31]], light);
        r(c, -9, -32, 18, 2, trim);
        if (tier >= 5) r(c, -1, -40, 2, 2, "#ffe08a");
      }
    }
    if (tier >= 6) {
      // Floating orbs (mage) or soul flames (necromancer).
      for (let i = 0; i < 2; i++) {
        const a = time * 2.5 + i * Math.PI;
        c.globalAlpha = 0.8;
        r(c, Math.cos(a) * 13 - 1, -24 + Math.sin(a) * 4, 3, 3, necro ? "#9fe0a0" : druid ? "#c8f08a" : "#c8a8ff");
        c.globalAlpha = 1;
      }
    }
    return;
  }
  if (cls === "ranger") {
    const base = mix(raw, "#4a6a3a", 0.45),
      dark = tint(base, -30),
      light = tint(base, 25);
    r(c, -6, -20, 12, 13, base);
    r(c, 2, -20, 4, 13, dark);
    r(c, -5, -19, 2, 10, light);
    r(c, -7, -9, 14, 2, "#5a3a22");
    r(c, -2, -9, 3, 2, "#d7b46d");
    r(c, -10, -18, 4, 9, base);
    r(c, 6, -18, 4, 9, dark);
    if (tier >= 2) poly(c, [[-6, -19], [-4, -19], [6, -10], [4, -10]], "#5a3a22");
    if (tier >= 3) {
      for (let y = -18; y < -10; y += 2) for (let x = -5 + ((y / 2) % 2 ? 1 : 0); x < 5; x += 3) r(c, x, y, 2, 1, light);
      r(c, -7, -8, 4, 5, "#7a5236");
      r(c, 4, -8, 4, 5, "#7a5236");
    }
    if (tier >= 4) {
      r(c, -12, -22, 6, 4, dark);
      r(c, -13, -24, 2, 4, "#e8e0c8");
      r(c, -10, -25, 2, 4, "#d84a3c");
    }
    if (tier >= 5) {
      c.globalAlpha = pulse;
      for (const [x, y] of [[-3, -16], [2, -13], [-1, -11]]) r(c, x, y, 2, 2, "#b4e67e");
      c.globalAlpha = 1;
    }
    if (!hasHelm && tier >= 2 && !back) {
      // The hood frames the face instead of covering it.
      r(c, -7, -37, 14, 6, dark);
      r(c, -8, -33, 3, 10, dark);
      r(c, 5, -33, 3, 10, dark);
      r(c, -5, -36, 10, 2, base);
      r(c, -2, -38, 4, 2, base);
    }
    return;
  }
  // Warrior and paladin: padded cloth up to ornate plate.
  const paladin = cls === "paladin",
    metal = paladin ? mix(raw, "#e8e8f0", 0.35) : raw,
    dark = tint(metal, -35),
    light = tint(metal, 35),
    trim = paladin || tier >= 5 ? "#efcf83" : "#c9b27b";
  if (tier === 1) {
    r(c, -6, -20, 12, 13, metal);
    for (let y = -17; y <= -11; y += 3) r(c, -6, y, 12, 1, dark);
    r(c, -10, -18, 4, 9, metal);
    r(c, 6, -18, 4, 9, dark);
  } else if (tier === 2) {
    r(c, -6, -20, 12, 13, metal);
    armorDetail(c, "leather", metal, trim, time, 0);
  } else {
    r(c, -6, -20, 12, 13, tier >= 4 ? light : metal);
    if (tier === 3) for (let y = -19; y < -9; y += 2) for (let x = -5 + ((y / 2) % 2 ? 1 : 0); x < 6; x += 2) r(c, x, y, 1, 1, light);
    else {
      r(c, -1, -20, 2, 12, "#ffffff");
      r(c, -6, -14, 12, 1, dark);
    }
    // Pauldrons grow with the tier.
    const pw = tier >= 4 ? 7 : 5;
    r(c, -6 - pw, -23, pw, 6, metal);
    r(c, -6 - pw, -23, pw, 2, light);
    r(c, 6, -23, pw, 6, metal);
    r(c, 6, -23, pw, 2, light);
    r(c, -10, -17, 4, 8, dark);
    r(c, 6, -17, 4, 8, dark);
    r(c, -6, -8, 5, 5, metal);
    r(c, 1, -8, 5, 5, metal);
    if (paladin || tier === 3) {
      // Tabard: white with a gold sun cross for paladins, colored for warriors.
      r(c, -4, -18, 8, 16, paladin ? "#f4efe0" : tint(metal, -50));
      r(c, -1, -17, 2, 10, paladin ? "#e0b440" : light);
      r(c, -3, -14, 6, 2, paladin ? "#e0b440" : light);
    }
    r(c, -6, -9, 12, 2, trim);
  }
  if (tier >= 6) {
    c.globalAlpha = pulse;
    r(c, -5, -19, 1, 8, paladin ? "#fff4c0" : "#a8ecff");
    r(c, 4, -19, 1, 8, paladin ? "#fff4c0" : "#a8ecff");
    c.globalAlpha = 1;
  }
  if (!hasHelm && tier >= 4 && !back) {
    if (paladin) {
      // Winged helm.
      r(c, -6, -35, 12, 6, light);
      r(c, -6, -31, 12, 1, dark);
      poly(c, [[-6, -34], [-12, -40], [-9, -32]], "#f4f4f8");
      poly(c, [[6, -34], [12, -40], [9, -32]], "#f4f4f8");
      if (tier >= 6) {
        c.strokeStyle = "#ffe08a";
        c.globalAlpha = pulse;
        c.beginPath();
        c.ellipse(0, -42, 7, 2, 0, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 1;
      }
    } else {
      // Great helm with a visor slit and plume.
      r(c, -6, -35, 12, 12, metal);
      r(c, -6, -35, 12, 2, light);
      r(c, -5, -29, 10, 2, "#14121a");
      r(c, -1, -40, 2, 6, tier >= 5 ? "#a3281f" : "#c9a24a");
      r(c, 1, -41, 3, 3, tier >= 5 ? "#e0483a" : "#e8c070");
    }
  }
}
const capeArmors = {
  plate: "#7b3f3a",
  frost: "#5e8fa5",
  ember: "#6e3326",
  storm: "#5b3f86",
  runic: "#3f6656",
  grave: "#4f4060",
};
function drawCape(c, color, step, time, front) {
  const sway = Math.sin(time * 3) * 1.5 + step * 0.5;
  if (front) {
    poly(c, [[-8, -21], [8, -21], [10 + sway, 2], [-10 + sway, 2]], color);
    r(c, -7, -20, 14, 2, tint(color, 30));
    for (let i = -6; i <= 6; i += 4) r(c, i + sway * 0.6, -12, 1, 12, tint(color, -25));
  } else {
    poly(c, [[-8, -20], [8, -20], [11 + sway, 1], [-11 + sway, 1]], tint(color, -20));
    r(c, -11 + sway, 0, 22, 2, tint(color, -40));
  }
}
// Per-armor surface details drawn over the torso so each set reads differently.
function armorDetail(c, id, col, trim, time, step) {
  const pulse = 0.55 + Math.sin(time * 4) * 0.35;
  if (id === "cloth") {
    for (let y = -17; y <= -11; y += 3) r(c, -6, y, 12, 1, tint(col, -22));
    r(c, -1, -20, 2, 11, tint(col, -30));
    r(c, -4, -21, 8, 2, tint(col, 25));
  } else if (id === "leather") {
    poly(c, [[-6, -19], [-4, -19], [6, -10], [4, -10]], "#5a3f2b");
    r(c, -1, -15, 3, 3, "#d7b46d");
    r(c, -9, -21, 4, 4, "#7a5338");
    r(c, 6, -21, 4, 4, "#7a5338");
    r(c, -6, -9, 12, 2, "#4d3424");
    r(c, -5, -7, 3, 4, "#7a5338");
  } else if (id === "chain") {
    for (let y = -19; y < -9; y += 2)
      for (let x = -5 + ((y / 2) % 2 ? 1 : 0); x < 6; x += 2) r(c, x, y, 1, 1, "#c8d3d4");
    r(c, -6, -8, 12, 4, tint(col, -15));
    for (let x = -6; x < 6; x += 2) r(c, x, -5, 1, 1, "#c8d3d4");
  } else if (id === "plate") {
    r(c, -6, -20, 12, 12, "#b8c4c6");
    r(c, -1, -20, 2, 12, "#e7efe8");
    r(c, -6, -14, 12, 1, "#8a989b");
    r(c, -11, -23, 7, 6, "#9eabae");
    r(c, -11, -23, 7, 2, "#e1e9e2");
    r(c, 5, -23, 7, 6, "#9eabae");
    r(c, 5, -23, 7, 2, "#e1e9e2");
    r(c, -6, -7, 5, 4, "#a5b2b4");
    r(c, 2, -7, 5, 4, "#a5b2b4");
    r(c, -2, -9, 4, 2, trim);
  } else if (id === "grave") {
    poly(c, [[-9, -22], [9, -22], [6, -8], [-6, -8]], "#5f4f72");
    r(c, -2, -20, 4, 4, "#e2dccb");
    r(c, -1, -19, 2, 1, "#3c3648");
    for (let i = 0; i < 3; i++) r(c, -5 + i * 4, -11, 2, 3, "#d4cdb8");
  } else if (id === "frost") {
    r(c, -6, -20, 12, 12, "#a9d3dd");
    r(c, -4, -18, 3, 8, "#e6fbff");
    poly(c, [[-11, -21], [-8, -28], [-6, -21]], "#d8f6ff");
    poly(c, [[6, -21], [8, -28], [11, -21]], "#d8f6ff");
    c.globalAlpha = pulse;
    r(c, 0, -16, 2, 4, "#bff4ff");
    c.globalAlpha = 1;
  } else if (id === "ember") {
    r(c, -6, -20, 12, 12, "#6f3d31");
    r(c, -11, -22, 7, 6, "#5b3027");
    r(c, 5, -22, 7, 6, "#5b3027");
    c.globalAlpha = pulse;
    for (const [x, y, w, h] of [[-4, -18, 1, 5], [-3, -14, 4, 1], [2, -19, 1, 7], [3, -13, 2, 1], [-9, -20, 3, 1], [7, -19, 3, 1]])
      r(c, x, y, w, h, "#ffae5c");
    c.globalAlpha = 1;
  } else if (id === "storm") {
    r(c, -6, -20, 12, 12, "#8f78b8");
    r(c, -11, -23, 7, 6, "#cdb8f1");
    r(c, 5, -23, 7, 6, "#cdb8f1");
    c.globalAlpha = pulse;
    poly(c, [[1, -19], [-2, -14], [1, -14], [-1, -9], [4, -15], [1, -15]], "#fff3a8");
    c.globalAlpha = 1;
    r(c, -6, -9, 12, 2, "#efd57d");
  } else if (id === "runic") {
    r(c, -6, -20, 12, 12, "#7d968b");
    r(c, -11, -22, 7, 5, "#6c857b");
    r(c, 5, -22, 7, 5, "#6c857b");
    c.globalAlpha = pulse;
    for (const [x, y] of [[-4, -18], [2, -17], [-2, -13], [3, -12]]) {
      r(c, x, y, 2, 1, "#a8ffd9");
      r(c, x, y + 1, 1, 2, "#a8ffd9");
    }
    c.globalAlpha = 1;
  }
}
export function drawHero(c, x, y, style = "warrior", options = {}) {
  const {
    skin = "#e9b88a",
    hair = "#654333",
    cape,
    frame = 0,
    scale = 1,
    facing = Math.PI / 2,
    swing = 0,
    armorLevel = 0,
  } = options;
  const back = options.direction === -1 || Math.sin(facing) < -0.65,
    side = Math.abs(Math.cos(facing)) > 0.72,
    mirror = side && Math.cos(facing) < 0;
  const body =
      cape ||
      {
        warrior: "#597b92",
        ranger: "#72905d",
        mage: "#8876aa",
        paladin: "#c9b27a",
        necromancer: "#4f4a5e",
        summoner: "#8a7448",
        shapeshifter: "#5a7a4a",
        monk: "#e8902a",
        engineer: "#7a5232",
        elder: "#9a855f",
        herbalist: "#64917b",
        smith: "#916b4e",
      }[style] ||
      "#72905d",
    dark = tint(body, -35),
    light = tint(body, 28),
    trim = armorLevel > 2 ? "#efcf83" : "#c9b27b";
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(mirror ? -scale : scale, scale * (options.race === "dwarf" ? 0.88 : 1));
  shadow(c, 0, 0, 9);
  const step = Math.round(Math.sin(frame) * 2),
    breathe = Math.round(
      Math.sin(frame ? frame * 0.5 : (options.time || 0) * 2.2) *
        (frame ? 0.4 : 0.6),
    );
  const bare = options.player && (!options.armor || options.armor === "none");
  const caped = options.player && capeArmors[options.armor];
  const winged = options.wings || (options.player && wingArmors[options.armor] && options.armor);
  if (winged && !back) drawWings(c, winged, options.time || 0);
  if (caped && !back) drawCape(c, caped, step, options.time || 0, false);
  if (!bare) {
    poly(
      c,
      [
        [-7, -19],
        [-10, -5 + step],
        [-7, 0],
        [-1, -3],
        [6, 0],
        [9, -5 - step],
        [6, -19],
      ],
      dark,
    );
    r(c, -8, -19, 3, 14, body);
    r(c, 6, -18, 2, 12, light);
    r(c, -7, -4, 3, 3, light);
    r(c, -5, -6, 4, 10 + step, "#263939");
    r(c, 2, -6, 4, 10 - step, "#263939");
    r(c, -4, -5, 2, 7 + step, "#516361");
    r(c, 3, -5, 2, 7 - step, "#516361");
    r(c, -6, 1 + step, 6, 4, "#453b31");
    r(c, 1, 1 - step, 6, 4, "#453b31");
    r(c, -5, 1 + step, 4, 1, "#a07b50");
    r(c, 2, 1 - step, 4, 1, "#a07b50");
    r(c, -7, -20 + breathe, 14, 15, "#253932");
    r(c, -6, -19 + breathe, 12, 13, body);
    r(c, -5, -18 + breathe, 3, 10, light);
    r(c, 3, -16 + breathe, 3, 10, dark);
    r(c, -7, -8, 14, 3, "#715c42");
    r(c, -2, -8, 4, 3, trim);
    r(c, -1, -7, 2, 1, "#f0ddb0");
    r(c, -10, -18 + breathe, 4, 10, "#2a3831");
    r(c, -9, -17 + breathe, 3, 8, body);
    r(c, -9, -9, 3, 4, skin);
    r(c, 7, -18 + breathe, 3, 10, dark);
    r(c, 7, -10, 3, 4, skin);
    r(c, 8, -9, 1, 2, tint(skin, 20));
  } else {
    r(c, -5, -7, 4, 11 + step, skin);
    r(c, 2, -7, 4, 11 - step, skin);
    r(c, -6, 2 + step, 6, 3, tint(skin, -15));
    r(c, 1, 2 - step, 6, 3, tint(skin, -15));
    r(c, -6, -20 + breathe, 12, 14, skin);
    r(c, 3, -18, 3, 12, tint(skin, -20));
    r(c, -5, -7, 11, 4, "#ded2ad");
    r(c, -5, -4, 4, 2, "#c4b898");
    r(c, 2, -4, 4, 2, "#c4b898");
    r(c, -9, -18 + breathe, 3, 13, skin);
    r(c, 7, -18 + breathe, 3, 13, tint(skin, -15));
  }
  const gear = options.equipment || {},
    pants = wearables[gear.legs],
    boots = wearables[gear.feet];
  if (pants) {
    r(c, -5, -6, 4, 10 + step, pants.color);
    r(c, 2, -6, 4, 10 - step, pants.color);
    r(c, -5, -6, 11, 2, tint(pants.color, -25));
  } else if (options.player && !bare) {
    r(c, -5, -4, 4, 8 + step, skin);
    r(c, 2, -4, 4, 8 - step, skin);
  }
  if (boots) {
    r(c, -6, step, 6, 5, boots.color);
    r(c, 1, -step, 6, 5, boots.color);
    r(c, -6, step, 6, 1, tint(boots.color, 35));
  } else if (options.player) {
    r(c, -6, 2 + step, 6, 3, skin);
    r(c, 1, 2 - step, 6, 3, skin);
  }
  r(c, -2, -23, 4, 4, tint(skin, -25));
  r(c, -6, -33 + breathe, 12, 11, "#2c332b");
  r(c, -5, -31 + breathe, 10, 10, skin);
  r(c, 3, -29 + breathe, 2, 7, tint(skin, -22));
  r(c, -7, -28, 2, 4, tint(skin, -9));
  r(c, 5, -28, 2, 4, tint(skin, -9));
  r(c, -5, -33 + breathe, 10, 4, hair);
  r(c, -6, -31 + breathe, 3, 7, hair);
  r(c, -3, -32 + breathe, 6, 1, tint(hair, 27));
  r(c, 4, -31 + breathe, 2, 5, tint(hair, -20));
  if (back) {
    r(c, -5, -30, 10, 8, hair);
    r(c, -4, -25, 8, 3, tint(hair, -20));
    r(c, -1, -29, 1, 5, tint(hair, 19));
  } else {
    r(c, side ? 2 : -3, -27, 2, 2, "#243a37");
    if (!side) r(c, 2, -27, 2, 2, "#243a37");
    r(c, side ? 3 : -2, -27, 1, 1, "#f4f1d6");
    r(c, 0, -24, 2, 1, tint(skin, -30));
    r(c, side ? 2 : -1, -22, 3, 1, "#a66d52");
  }
  drawRaceFeatures(c, options.race, skin, hair, back, side);
  if (!options.player && style === "warrior" && options.armor !== "none") {
    r(c, -9, -20, 5, 5, "#7b9399");
    r(c, -9, -20, 5, 1, "#d0dcd2");
    r(c, 5, -20, 5, 5, "#7b9399");
    r(c, 5, -20, 5, 1, "#ccd8ce");
    r(c, -4, -17, 8, 5, "#7f9699");
    r(c, -3, -16, 6, 1, "#c4d2ca");
    r(c, -4, -11, 8, 2, trim);
    r(c, -5, -33, 10, 2, "#8ca1a2");
    r(c, -1, -34, 3, 2, "#b2beb2");
  }
  if (options.armor && options.armor !== "none") {
    const col =
      {
        cloth: "#a79877",
        leather: "#966c49",
        chain: "#8c9b9f",
        plate: "#a8b5b8",
        grave: "#9b8aae",
        frost: "#92bbc7",
        ember: "#b5816b",
        storm: "#b6a0d1",
        runic: "#a1b4aa",
      }[options.armor] || body;
    r(c, -6, -20, 12, 13, col);
    r(c, -5, -19, 2, 10, tint(col, 25));
    r(c, -6, -9, 12, 2, trim);
    if (
      ["chain", "plate", "frost", "ember", "storm", "runic"].includes(
        options.armor,
      )
    ) {
      r(c, -9, -21, 5, 5, tint(col, -10));
      r(c, 5, -21, 5, 5, tint(col, 10));
      if (!options.player) r(c, -5, -33, 10, 3, col);
    }
    if (options.player)
      drawClassArmor(c, style, options.armor, options.time || 0, back, !!wearables[gear.head]);
    else armorDetail(c, options.armor, col, trim, options.time || 0, step);
  }
  if (caped && back) drawCape(c, caped, step, options.time || 0, true);
  if (winged && back) drawWings(c, winged, options.time || 0);
  if (winged === "seraph") drawHalo(c, options.time || 0);
  if (style === "ranger" && !options.player) {
    poly(
      c,
      [
        [-7, -29],
        [-4, -36],
        [3, -36],
        [7, -29],
      ],
      body,
    );
    r(c, -5, -31, 11, 2, dark);
    r(c, -2, -35, 4, 1, light);
    r(c, -6, -16, 11, 2, trim);
    r(c, -6, -14, 2, 5, trim);
    r(c, 4, -19, 2, 9, "#715c42");
  }
  if (style === "mage" && !options.player) {
    poly(
      c,
      [
        [-9, -29],
        [0, -39],
        [6, -30],
      ],
      dark,
    );
    poly(
      c,
      [
        [-7, -30],
        [0, -38],
        [2, -30],
      ],
      body,
    );
    r(c, -9, -29, 17, 2, trim);
    r(c, -4, -12, 8, 2, trim);
    r(c, -5, -5, 10, 3, body);
    r(c, -5, -4, 10, 1, light);
    r(c, -1, -17, 2, 4, "#ccead9");
  }
  if (style === "paladin" && !options.player) {
    // Tabard with a gold sun and a plumed helm.
    r(c, -5, -19, 10, 13, "#efe6cc");
    r(c, -1, -18, 2, 10, "#e0b440");
    r(c, -4, -15, 8, 2, "#e0b440");
    r(c, -6, -34, 12, 5, "#c8d0d2");
    r(c, -6, -30, 12, 1, "#8e9a9e");
    r(c, -1, -40, 3, 7, "#d84a3c");
    r(c, 1, -42, 3, 4, "#ff7a5c");
    r(c, -9, -21, 5, 5, "#c8d0d2");
    r(c, 5, -21, 5, 5, "#c8d0d2");
  }
  if (style === "necromancer" && !options.player) {
    // Deep hood, bone belt and a faint green glow.
    poly(c, [[-8, -27], [0, -40], [8, -27], [6, -21], [-6, -21]], "#2e2a38");
    r(c, -4, -29, 8, 6, "#14121a");
    r(c, -3, -27, 2, 1, "#9fe0a0");
    r(c, 2, -27, 2, 1, "#9fe0a0");
    r(c, -6, -9, 12, 2, "#e2dccb");
    for (const dx of [-5, -1, 3]) r(c, dx, -8, 2, 3, "#d4cdb8");
    c.globalAlpha = 0.25;
    r(c, -10, -6, 20, 3, "#9fe0a0");
    c.globalAlpha = 1;
  }
  if (style === "elder") {
    r(c, -4, -25, 8, 6, "#dfd7bc");
    r(c, -3, -22, 6, 2, "#a3ad9a");
    r(c, -6, -33, 12, 3, "#d3cfb9");
    r(c, 10, -17, 2, 22, "#846340");
    r(c, 9, -18, 4, 3, "#b6a16d");
  }
  if (style === "herbalist") {
    r(c, -5, -32, 11, 2, "#c5caa9");
    r(c, -4, -13, 8, 10, "#c3c9a4");
    r(c, -3, -12, 6, 1, "#e2e3bf");
    r(c, 0, -10, 2, 3, "#6f9878");
  }
  if (style === "smith") {
    r(c, -4, -15, 9, 11, "#715440");
    r(c, -3, -15, 1, 11, "#a58257");
    r(c, -2, -22, 6, 3, "#604b39");
    r(c, 10, -12, 2, 16, "#8e7049");
    r(c, 7, -17, 8, 5, "#9aa8a4");
    r(c, 7, -17, 8, 1, "#d1d9c3");
  }
  const head = wearables[gear.head];
  if (head) {
    r(c, -6, -34, 12, 5, head.color);
    r(c, -7, -31, 3, 7, tint(head.color, -25));
    r(c, 5, -31, 2, 7, tint(head.color, -15));
    r(c, -5, -34, 10, 1, tint(head.color, 35));
  }
  if (gear.offhand === "buckler") {
    r(c, -14, -18, 8, 14, "#876b45");
    r(c, -13, -16, 6, 10, "#b6965f");
    r(c, -11, -13, 2, 4, "#d5d3b1");
  }
  if (gear.offhand === "quiver") {
    r(c, -12, -24, 5, 15, "#855a3e");
    r(c, -12, -28, 1, 10, "#e8d1a5");
    r(c, -9, -27, 1, 10, "#e8d1a5");
  }
  if (gear.offhand === "cyclopsEye") {
    r(c, -14, -17, 7, 7, "#e8e0cc");
    r(c, -12, -15, 3, 3, "#3a6ad0");
    r(c, -11, -14, 1, 1, "#ffffff");
  }
  if (gear.offhand === "holySymbol") {
    r(c, -14, -18, 7, 9, "#c79a3a");
    r(c, -12, -17, 3, 7, "#ffe08a");
    r(c, -14, -15, 7, 2, "#ffe08a");
  }
  if (gear.offhand === "boneCharm") {
    r(c, -13, -16, 5, 6, "#e2dccb");
    r(c, -12, -14, 1, 1, "#14121a");
    r(c, -10, -14, 1, 1, "#14121a");
    r(c, -11, -20, 1, 4, "#8a7a5a");
  }
  if (gear.offhand === "focus") {
    poly(
      c,
      [
        [-12, -17],
        [-16, -12],
        [-12, -7],
        [-8, -12],
      ],
      "#98d9e1",
    );
  }
  if (
    ["warrior", "ranger", "mage", "paladin", "necromancer", "summoner", "shapeshifter", "monk", "engineer"].includes(style) &&
    (!options.player || options.weapon)
  ) {
    const id =
      options.weapon ||
      {
        warrior: "sword",
        ranger: "bow",
        mage: "staff",
        paladin: "mace",
        necromancer: "boneWand",
        summoner: "totemStaff",
        shapeshifter: "druidClaws",
        monk: "handWraps",
        engineer: "flintlock",
      }[style];
    drawWeapon(c, id, Math.min(1, swing / 0.35));
  }
  c.restore();
}
// Current season drives tree and ground palettes; the game updates it on change.
export let season = "spring";
export const setSeason = (value) => (season = value);
const autumnLeaves = ["#7a3a20", "#b4542a", "#d8843a", "#f0b050"],
  springLeaves = ["#3a6a44", "#4f8a52", "#6fae5e", "#9ccc78"];
export function drawTree(c, x, y, style = "pine", variant = 0) {
  if (season === "winter" && style !== "palm") {
    if (style === "pine" || style === "snow") style = "snow";
    else return drawBareTree(c, x, y, variant);
  }
  const snow = style === "snow";
  shadow(c, x, y, 18);
  r(c, x - 3, y - 15, 6, 18, "#675642");
  r(c, x - 1, y - 14, 2, 15, "#9a7650");
  if (style === "palm") {
    r(c, x - 3, y - 39, 6, 40, "#8b754c");
    r(c, x - 2, y - 39, 2, 38, "#c0a56f");
    for (let i = 0; i < 7; i++) r(c, x - 3, y - 37 + i * 5, 6, 1, "#625b3d");
    for (const [dx, dy] of [
      [-24, 5],
      [-20, -10],
      [0, -18],
      [20, -10],
      [25, 6],
    ]) {
      poly(
        c,
        [
          [x, y - 42],
          [x + dx * 0.5, y - 42 + dy - 4],
          [x + dx, y - 39 + dy + 7],
          [x + dx * 0.5, y - 42 + dy + 2],
        ],
        "#477957",
      );
      poly(
        c,
        [
          [x, y - 43],
          [x + dx * 0.5, y - 44 + dy],
          [x + dx, y - 38 + dy + 7],
        ],
        "#82a76e",
      );
    }
    r(c, x - 5, y - 40, 4, 4, "#8a6c43");
    r(c, x + 2, y - 39, 4, 4, "#8a6c43");
  } else if (style === "oak" || style === "amber" || style === "willow") {
    const cols =
      season === "autumn" && style !== "willow"
        ? variant % 2
          ? autumnLeaves
          : ["#78603a", "#a18043", "#c09d55", "#dab86f"]
        : season === "spring" && style === "oak"
          ? springLeaves
          : style === "amber"
        ? ["#78603a", "#a18043", "#c09d55", "#dab86f"]
        : style === "willow"
          ? ["#315b50", "#487664", "#60967b", "#81ae86"]
          : ["#315b40", "#43764a", "#5b9255", "#75a761"];
    r(c, x - 20, y - 40, 38, 21, cols[0]);
    r(c, x - 15, y - 49, 30, 38, cols[1]);
    r(c, x - 24, y - 34, 47, 16, cols[1]);
    r(c, x - 13, y - 48, 26, 13, cols[2]);
    r(c, x - 20, y - 36, 16, 12, cols[2]);
    r(c, x + 1, y - 40, 14, 13, cols[2]);
    r(c, x - 11, y - 48, 13, 6, cols[3]);
    r(c, x - 21, y - 34, 6, 6, cols[3]);
    r(c, x + 4, y - 38, 5, 4, cols[3]);
    r(c, x + 13, y - 24, 7, 5, cols[0]);
    for (const [dx, dy] of [
      [-15, -43],
      [-3, -40],
      [8, -47],
      [-18, -28],
      [3, -30],
      [17, -30],
    ]) {
      r(c, x + dx, y + dy, 4, 2, cols[3]);
      r(c, x + dx + 2, y + dy + 3, 3, 2, cols[0]);
    }
    if (style === "willow")
      for (const dx of [-20, -14, 13, 19]) {
        r(c, x + dx, y - 27, 2, 18, cols[1]);
        r(c, x + dx + 1, y - 22, 2, 13, cols[2]);
      }
  } else {
    const shades = snow
      ? ["#355f62", "#50817b", "#74a295"]
      : ["#254d3d", "#37684b", "#518050"];
    for (let i = 0; i < 3; i++) {
      const top = y - 55 + i * 13,
        span = 12 + i * 5;
      poly(
        c,
        [
          [x, top],
          [x + span, top + 25],
          [x + span - 4, top + 28],
          [x - span + 4, top + 28],
          [x - span, top + 25],
        ],
        shades[0],
      );
      poly(
        c,
        [
          [x, top],
          [x + 3, top + 9],
          [x + span - 4, top + 23],
          [x - span + 3, top + 23],
        ],
        shades[1],
      );
      poly(
        c,
        [
          [x, top],
          [x + 4, top + 13],
          [x - span + 5, top + 20],
        ],
        snow ? "#d7e4d8" : shades[2],
      );
      r(
        c,
        x - span + 5,
        top + 21,
        7 + variant,
        2,
        snow ? "#edf1df" : "#709658",
      );
    }
  }
}
// Winter: leafless branches dusted with snow.
function drawBareTree(c, x, y, variant) {
  shadow(c, x, y, 16);
  r(c, x - 3, y - 26, 6, 29, "#5e4a38");
  r(c, x - 1, y - 25, 2, 26, "#86684a");
  for (const [dx, dy, len, dir] of [[0, -26, 16, -1], [0, -30, 14, 1], [0, -20, 12, 1], [0, -16, 10, -1], [0, -36, 9, -1]]) {
    for (let i = 0; i < len; i++) r(c, x + dx + i * dir, y + dy - Math.floor(i * 0.7), 2, 2, "#5e4a38");
    r(c, x + dx + len * dir - (dir < 0 ? 2 : 0), y + dy - Math.floor(len * 0.7) - 1, 4, 2, "#eef3f2");
  }
  r(c, x - 4, y - 28, 8, 2, "#eef3f2");
  if (variant % 2) r(c, x - 12, y - 18, 6, 1, "#eef3f2");
}
function drawHouse(c, x, y, style) {
  const roof =
    style === "red"
      ? ["#774039", "#a85945", "#bd7050"]
      : style === "green"
        ? ["#34564c", "#4d7968", "#69917a"]
        : ["#725644", "#997251", "#ae895e"];
  shadow(c, x, y + 5, 53);
  r(c, x - 41, y - 35, 82, 43, "#705744");
  r(c, x - 38, y - 34, 76, 40, "#d2bc8e");
  for (let j = 0; j < 4; j++) r(c, x - 38, y - 29 + j * 9, 76, 1, "#b6a077");
  r(c, x - 38, y - 34, 5, 40, "#7e6549");
  r(c, x + 32, y - 34, 6, 40, "#7e6549");
  r(c, x - 38, y - 2, 76, 6, "#7e6549");
  poly(
    c,
    [
      [x - 49, y - 35],
      [x - 29, y - 66],
      [x + 28, y - 66],
      [x + 49, y - 35],
    ],
    roof[0],
  );
  poly(
    c,
    [
      [x - 45, y - 39],
      [x - 27, y - 64],
      [x + 27, y - 64],
      [x + 44, y - 39],
    ],
    roof[1],
  );
  for (let row = 0; row < 5; row++) {
    const inset = (4 - row) * 4;
    r(c, x - 43 + inset, y - 61 + row * 5, 86 - inset * 2, 1, roof[2]);
    for (let a = 0; a < 8; a++)
      r(
        c,
        x - 36 + inset + a * 10 + (row % 2) * 4,
        y - 60 + row * 5,
        1,
        4,
        roof[0],
      );
  }
  r(c, x + 20, y - 71, 10, 19, "#8f8e79");
  r(c, x + 18, y - 72, 14, 3, "#b5b3a0");
  r(c, x - 10, y - 22, 19, 29, "#70513d");
  r(c, x - 7, y - 20, 13, 25, "#926747");
  r(c, x + 2, y - 10, 2, 2, "#e2c379");
  r(c, x - 13, y + 6, 25, 3, "#b9ad90");
  r(c, x - 15, y + 9, 29, 3, "#918f78");
  for (const wx of [-27, 18]) {
    r(c, x + wx, y - 24, 12, 14, "#725740");
    r(c, x + wx + 2, y - 22, 8, 10, "#bcd0b1");
    r(c, x + wx + 6, y - 22, 1, 10, "#826648");
    r(c, x + wx + 2, y - 17, 8, 1, "#826648");
    r(c, x + wx - 2, y - 10, 16, 3, "#7f694c");
    r(c, x + wx - 2, y - 8, 16, 3, "#4f764e");
    r(c, x + wx + 2, y - 9, 2, 2, "#d5b76c");
    r(c, x + wx + 8, y - 9, 2, 2, "#cc8c86");
  }
}
export function drawObject(c, o, time, collected = new Set(), flags = {}) {
  const { x, y, type } = o;
  if (collected.has(o.id) && ["herb", "ore", "crystal", "wood"].includes(type))
    return;
  if (type === "tree") drawTree(c, x, y, o.style, o.variant);
  else if (type === "house") drawHouse(c, x, y, o.style);
  else if (type === "npc" || type === "trainer") {
    drawHero(c, x, y, o.style, {
      hair: o.style === "herbalist" ? "#ad634c" : undefined,
    });
  } else if (type === "rock" || type === "ore") {
    shadow(c, x, y, 12);
    poly(
      c,
      [
        [x - 12, y],
        [x - 10, y - 12],
        [x - 3, y - 19],
        [x + 9, y - 14],
        [x + 14, y - 2],
        [x + 8, y + 4],
        [x - 8, y + 4],
      ],
      "#657573",
    );
    poly(
      c,
      [
        [x - 10, y - 11],
        [x - 3, y - 18],
        [x + 9, y - 13],
        [x + 5, y - 6],
        [x - 5, y - 5],
      ],
      o.style === "snow" ? "#d6dfd7" : "#99a69a",
    );
    r(c, x - 8, y - 3, 6, 2, "#85948a");
    if (type === "ore") {
      r(c, x - 5, y - 14, 5, 4, "#d6b086");
      r(c, x + 6, y - 8, 4, 4, "#c99162");
    }
  } else if (type === "flower") {
    const color = ["#e4d39b", "#d9a694", "#aaa0c4", "#c6d2a3"][o.variant];
    r(c, x, y - 4, 1, 6, "#578254");
    r(c, x - 3, y - 7, 6, 4, color);
    r(c, x - 1, y - 8, 2, 6, color);
    r(c, x - 1, y - 5, 2, 2, "#e9cb79");
    r(c, x + 5, y - 2, 2, 3, "#82a55e");
  } else if (type === "herb") {
    r(c, x - 1, y - 12, 2, 16, "#5e915a");
    poly(
      c,
      [
        [x, y - 4],
        [x - 10, y - 10],
        [x - 9, y - 15],
        [x - 1, y - 9],
      ],
      "#a5c27d",
    );
    poly(
      c,
      [
        [x, y - 9],
        [x + 9, y - 17],
        [x + 11, y - 12],
        [x, y - 4],
      ],
      "#7ca36e",
    );
    r(c, x - 2, y - 17, 4, 4, "#d6e5bd");
    r(c, x - 1, y - 19, 2, 8, "#e4f2ce");
  } else if (type === "crystal") {
    shadow(c, x, y, 10);
    poly(
      c,
      [
        [x, y - 26],
        [x + 8, y - 17],
        [x + 6, y + 1],
        [x - 5, y + 1],
        [x - 8, y - 17],
      ],
      "#579db0",
    );
    poly(
      c,
      [
        [x, y - 26],
        [x + 3, y - 15],
        [x, y + 1],
        [x - 5, y - 17],
      ],
      "#b5ece6",
    );
    poly(
      c,
      [
        [x + 3, y - 15],
        [x + 8, y - 17],
        [x + 6, y + 1],
        [x, y + 1],
      ],
      "#7bc8cf",
    );
    r(c, x - 9, y - 5, 3, 6, "#8ca1a0");
  } else if (type === "camp") {
    shadow(c, x, y, 15);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      r(c, x + Math.cos(a) * 12 - 3, y + Math.sin(a) * 5 - 2, 6, 4, "#a4a28a");
    }
    r(c, x - 9, y, 19, 3, "#765039");
    r(c, x - 6, y - 2, 13, 3, "#a4774e");
    const f = Math.sin(time * 9) * 3;
    poly(
      c,
      [
        [x - 6, y - 1],
        [x - 8, y - 7],
        [x - 2, y - 12 + f],
        [x, y - 20],
        [x + 3, y - 11],
        [x + 7, y - 7],
        [x + 5, y - 1],
      ],
      "#e89b42",
    );
    poly(
      c,
      [
        [x - 3, y - 1],
        [x - 4, y - 6],
        [x + 1, y - 13 + f],
        [x + 4, y - 4],
      ],
      "#f8d476",
    );
    r(c, x - 1, y - 7, 2, 7, "#fff0b8");
  } else if (type === "chest") {
    const open = collected.has(o.id);
    shadow(c, x, y, 13);
    r(c, x - 11, y - 12, 22, 15, "#684d35");
    r(c, x - 10, y - 11, 20, 12, "#a37745");
    r(c, x - 11, y - 15 - (open ? 8 : 0), 22, 7, "#b48c54");
    r(c, x - 8, y - 15 - (open ? 8 : 0), 2, 7, "#e0c07b");
    r(c, x + 6, y - 15 - (open ? 8 : 0), 2, 7, "#e0c07b");
    r(c, x - 11, y - 9, 22, 2, "#5d4633");
    r(c, x - 2, y - 9, 4, 5, "#d4ba74");
  } else if (type === "rune" || type === "altar") {
    shadow(c, x, y, 21);
    r(c, x - 18, y - 1, 36, 7, "#6c807b");
    r(c, x - 14, y - 6, 28, 6, "#a0ada0");
    r(c, x - 10, y - 34, 20, 29, "#637d76");
    r(c, x - 8, y - 33, 7, 27, "#8da394");
    poly(
      c,
      [
        [x - 10, y - 34],
        [x - 5, y - 44],
        [x + 5, y - 44],
        [x + 10, y - 34],
      ],
      "#a5b2a0",
    );
    const active = flags[o.id] || (type === "altar" && flags.victory);
    const color = active ? "#f3d787" : "#91dacf";
    r(c, x - 2, y - 33, 4, 20, color);
    r(c, x - 6, y - 28, 12, 3, color);
    r(c, x - 6, y - 19, 12, 3, color);
    r(c, x - 1, y - 38, 2, 3, color);
    c.globalAlpha = 0.2 + Math.sin(time * 2) * 0.07;
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y - 24, 20, 28, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  } else if (type === "crop") {
    r(c, x - 11, y - 8, 22, 15, "#846d46");
    for (let i = 0; i < 3; i++) {
      r(c, x - 8 + i * 7, y - 5, 2, 9, "#55583a");
      r(c, x - 10 + i * 7, y - 8, 6, 4, "#8aaa5f");
      r(c, x - 8 + i * 7, y - 11, 2, 7, "#aeca70");
      r(c, x - 7 + i * 7, y - 4, 2, 3, o.variant ? "#d4a058" : "#aabc69");
    }
  } else if (type === "fence") {
    r(c, x - 11, y - 10, 22, 3, "#bcaa77");
    r(c, x - 11, y - 4, 22, 3, "#ac996b");
    r(c, x - 10, y - 15, 3, 18, "#d0bb84");
    r(c, x + 8, y - 15, 3, 18, "#d0bb84");
  } else if (type === "pillar") {
    shadow(c, x, y, 13);
    r(c, x - 10, y - 3, 20, 6, "#768781");
    r(c, x - 7, y - 37, 14, 34, "#a4b1a2");
    r(c, x - 3, y - 36, 3, 33, "#bec5af");
    r(c, x + 3, y - 35, 3, 30, "#7b8e86");
    r(c, x - 10, y - 40, 20, 6, "#b7bfa9");
    r(c, x - 2, y - 28, 7, 2, "#74867c");
    r(c, x - 4, y - 12, 6, 2, "#74867c");
  } else if (type === "lamp") {
    r(c, x - 2, y - 26, 3, 30, "#655646");
    r(c, x - 5, y - 31, 10, 3, "#665441");
    r(c, x - 4, y - 27, 8, 9, "#e9c777");
    r(c, x - 2, y - 25, 4, 5, "#ffe6a0");
    r(c, x - 5, y - 18, 10, 2, "#655441");
  } else if (type === "sheep") {
    shadow(c, x, y, 10);
    r(c, x - 7, y - 10, 14, 10, "#e1e0c7");
    r(c, x - 10, y - 7, 18, 6, "#f0efd9");
    r(c, x - 4, y - 13, 10, 6, "#e9e8d0");
    r(c, x + 7, y - 8, 5, 6, "#817769");
    r(c, x + 10, y - 7, 1, 1, "#343c33");
    r(c, x - 5, y, 2, 4, "#665e4a");
    r(c, x + 4, y, 2, 4, "#665e4a");
  } else if (type === "well") {
    shadow(c, x, y, 17);
    r(c, x - 13, y - 13, 26, 16, "#a0a590");
    r(c, x - 10, y - 15, 20, 8, "#446e73");
    r(c, x - 15, y - 16, 30, 4, "#bdbba0");
    r(c, x - 14, y - 30, 3, 20, "#735c43");
    r(c, x + 11, y - 30, 3, 20, "#735c43");
    poly(
      c,
      [
        [x - 20, y - 30],
        [x, y - 44],
        [x + 20, y - 30],
      ],
      "#987354",
    );
    r(c, x - 17, y - 30, 34, 3, "#755840");
  } else if (type === "sign") {
    r(c, x - 1, y - 9, 3, 14, "#7e6847");
    r(c, x - 12, y - 19, 26, 12, "#b39a65");
    r(c, x - 8, y - 15, 15, 2, "#6d6144");
    r(c, x + 4, y - 18, 2, 8, "#6d6144");
  }
}
export function drawEnemy(c, e, time) {
  const { x, y, type } = e;
  shadow(c, x, y, type === "guardian" ? 24 : 12);
  if (type === "slime") {
    const t = time * 4 + e.x,
      squash = Math.sin(t) * 0.12,
      sx = 1 + squash,
      sy = 1 - squash;
    c.save();
    c.translate(x, y + 1);
    c.scale(sx, sy);
    const body = e.elite ? "#a8c46a" : "#5f9e86",
      light = e.elite ? "#d9eb9c" : "#8fcca3";
    c.fillStyle = tint(body, -30);
    c.beginPath();
    c.ellipse(0, -7, 14, 10, 0, Math.PI, 0);
    c.lineTo(14, 0);
    c.lineTo(-14, 0);
    c.fill();
    c.fillStyle = body;
    c.beginPath();
    c.ellipse(0, -7, 12.5, 9, 0, Math.PI, 0);
    c.lineTo(12.5, -1);
    c.lineTo(-12.5, -1);
    c.fill();
    c.globalAlpha = 0.55;
    c.fillStyle = light;
    c.beginPath();
    c.ellipse(-4, -11, 5, 3, -0.4, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
    r(c, -6, -14, 2, 2, "#f2fff0");
    // Floating core inside the jelly.
    r(c, 3, -5 + Math.sin(t * 0.7) * 1.5, 3, 3, tint(body, 40));
    const blink = Math.sin(time * 1.3 + e.x) > 0.96;
    r(c, -5, -7, 3, blink ? 1 : 3, "#1f3335");
    r(c, 3, -7, 3, blink ? 1 : 3, "#1f3335");
    if (!blink) {
      r(c, -5, -7, 1, 1, "#e9fff1");
      r(c, 3, -7, 1, 1, "#e9fff1");
    }
    r(c, -2, -3, 4, 1, "#2f4f48");
    c.restore();
  } else if (type === "wolf") {
    const run = e.lunge > 0 ? time * 22 : time * 9,
      step = Math.sin(run) * 2,
      dir = e.face || 1;
    c.save();
    c.translate(x, y);
    c.scale(dir, 1);
    const fur = "#6a8184",
      light = "#a9b9b6",
      dark = "#4b6264";
    // Tail
    poly(c, [[-13, -12], [-24, -18 + Math.sin(time * 6) * 2], [-22, -9], [-14, -6]], "#91a6a0");
    r(c, -23, -17 + Math.sin(time * 6) * 2, 3, 2, "#dfe6d6");
    // Back legs
    r(c, -11, -5, 4, 9 + step, dark);
    r(c, -6, -5, 3, 8 - step, fur);
    // Body
    poly(c, [[-15, -10], [-9, -17], [6, -17], [13, -11], [10, -3], [-12, -3]], fur);
    r(c, -10, -16, 15, 4, light);
    r(c, -9, -16, 9, 1, "#d6ddcb");
    r(c, -8, -6, 14, 3, "#56706f");
    // Front legs
    r(c, 4, -5, 4, 9 - step, dark);
    r(c, 8, -5, 3, 8 + step, fur);
    r(c, 4, 3 - step, 5, 2, "#3b4f50");
    // Head
    poly(c, [[7, -20], [15, -21], [22, -15], [21, -11], [12, -9], [6, -12]], "#7d989a");
    poly(c, [[8, -20], [9, -27], [13, -21]], "#5d7a7c");
    poly(c, [[12, -21], [14, -27], [16, -20]], "#4f6a6c");
    r(c, 16, -14, 7, 3, "#c4cfc0");
    r(c, 21, -15, 2, 2, "#263a39");
    r(c, 14, -18, 2, 2, e.lunge > 0 ? "#ff8a5b" : "#f2d27c");
    r(c, 17, -11, 4, 1, "#f2efe0");
    c.restore();
  } else if (type === "wisp") {
    const b = Math.sin(time * 3 + e.x) * 3;
    const glow = c.createRadialGradient(x, y - 15 + b, 2, x, y - 15 + b, 22);
    glow.addColorStop(0, "#c8ecff88");
    glow.addColorStop(1, "#9abade00");
    c.fillStyle = glow;
    c.fillRect(x - 24, y - 40 + b, 48, 48);
    for (let i = 0; i < 5; i++) {
      const f = Math.sin(time * 12 + i * 1.7) * 2;
      poly(
        c,
        [
          [x - 8 + i * 4, y - 9 + b],
          [x - 6 + i * 4 + f, y - 22 - (i % 2 ? 6 : 10) + b],
          [x - 4 + i * 4, y - 9 + b],
        ],
        i % 2 ? "#9fc9ec" : "#c9e6ff",
      );
    }
    c.fillStyle = "#97b7d4";
    c.beginPath();
    c.ellipse(x, y - 12 + b, 8, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#e9f6ff";
    c.beginPath();
    c.ellipse(x, y - 13 + b, 5, 4, 0, 0, Math.PI * 2);
    c.fill();
    r(c, x - 3, y - 15 + b, 2, 3, "#2e4a63");
    r(c, x + 2, y - 15 + b, 2, 3, "#2e4a63");
    for (let i = 0; i < 3; i++)
      r(c, x - 6 + i * 6, y - 2 + b + Math.sin(time * 5 + i) * 3, 1, 3, "#bfe0ff");
  } else if (type === "sentinel") {
    drawHero(c, x, y, "warrior", {
      skin: "#8f9a86",
      hair: "#746747",
      cape: "#8e7751",
      weapon: "crossbow",
      frame: time * 3,
      facing: Math.atan2((e.aimY || y + 1) - y, (e.aimX || x) - x),
    });
    r(c, x - 5, y - 27, 10, 2, "#dec582");
    r(c, x - 1, y - 29, 2, 7, "#dcc177");
  } else if (type === "golem" || type === "guardian" || type === "titan") {
    const b = type === "titan" ? 2.1 : type === "guardian" ? 1.8 : 1;
    c.save();
    c.translate(x, y);
    c.scale(b, b);
    r(c, -9, -23, 18, 20, "#6f7b82");
    r(c, -7, -25, 14, 18, "#94a0a0");
    r(c, -4, -21, 8, 2, "#758989");
    r(c, -5, -17, 3, 2, "#9de0d7");
    r(c, 3, -17, 3, 2, "#9de0d7");
    r(c, -15, -15, 7, 14, "#859493");
    r(c, 9, -15, 7, 14, "#859493");
    r(c, -7, -4, 5, 7, "#627277");
    r(c, 3, -4, 5, 7, "#627277");
    r(c, -2, -10, 4, 4, "#c6eee0");
    r(c, -3, -27, 7, 4, "#b9c4b5");
    if (type === "titan") {
      r(c, -11, -30, 22, 4, "#ab9560");
      r(c, -11, -35, 4, 6, "#d1bf80");
      r(c, -2, -38, 4, 9, "#dfcf93");
      r(c, 7, -35, 4, 6, "#d1bf80");
      r(c, -2, -10, 4, 4, "#f6d58c");
    }
    r(c, -11, -13, 2, 10, "#c1cbbb");
    r(c, 10, -13, 2, 10, "#657c74");
    r(c, -8, -24, 2, 4, "#cad3c1");
    // Moss on the shoulders and pulsing core cracks.
    r(c, -15, -16, 7, 2, "#6f9a5c");
    r(c, 10, -16, 5, 2, "#7fa866");
    r(c, -6, -26, 4, 1, "#7fa866");
    c.globalAlpha = 0.55 + Math.sin(time * 3 + e.x) * 0.35;
    const core = type === "titan" ? "#ffd98c" : type === "guardian" ? "#9ff5e6" : "#9de0d7";
    r(c, -1, -18, 1, 6, core);
    r(c, -4, -13, 3, 1, core);
    r(c, 2, -9, 4, 1, core);
    r(c, -5, -17, 3, 2, core);
    r(c, 3, -17, 3, 2, core);
    c.globalAlpha = 1;
    c.restore();
  } else {
    const b = Math.sin(time * 3) * 3;
    c.fillStyle = "#9abade44";
    c.beginPath();
    c.arc(x, y - 13 + b, 16, 0, Math.PI * 2);
    c.fill();
    poly(
      c,
      [
        [x, y - 29 + b],
        [x + 9, y - 18 + b],
        [x + 4, y - 3 + b],
        [x - 3, y - 5 + b],
        [x - 10, y - 19 + b],
      ],
      "#97b7d4",
    );
    r(c, x - 3, y - 20 + b, 2, 3, "#eef7df");
    r(c, x + 3, y - 20 + b, 2, 3, "#eef7df");
  }
  drawStatus(c, e, time, ["guardian", "titan"].includes(type) ? 69 : 43);
  if (e.windup > 0 && e.boss) {
    c.strokeStyle = "#e7a071";
    c.lineWidth = 1;
    c.beginPath();
    if (["sentinel", "wisp"].includes(e.type)) {
      c.moveTo(x, y - 8);
      c.lineTo(e.aimX, e.aimY - 8);
    } else
      c.arc(
        x,
        y,
        ["guardian", "titan"].includes(type) ? 95 : 26,
        0,
        Math.PI * 2,
      );
    c.stroke();
  }
}
// Shared status icons and health bar for every enemy model.
export function drawStatus(c, e, time, barOffset = 43) {
  const { x, y } = e,
    top = y - barOffset;
  if (e.slow > 0)
    for (let i = 0; i < 3; i++) {
      const a = time * 2 + (i * Math.PI * 2) / 3,
        px = x + Math.cos(a) * 13,
        py = y - 10 + Math.sin(a) * 4;
      r(c, px - 1, py - 3, 2, 6, "#d6f4ff");
      r(c, px - 3, py - 1, 6, 2, "#d6f4ff");
    }
  if (e.burn > 0)
    for (let i = 0; i < 3; i++) {
      const fx = x - 8 + i * 8,
        h = 4 + Math.abs(Math.sin(time * 14 + i)) * 4;
      r(c, fx, y - 12 - h, 2, h, i % 2 ? "#ffb15e" : "#ffe08a");
    }
  if (e.poison > 0)
    for (let i = 0; i < 3; i++) {
      const py = y - 20 - ((time * 18 + i * 9) % 22);
      c.globalAlpha = 0.8;
      r(c, x - 7 + i * 6, py, 2, 2, "#a7e07a");
      c.globalAlpha = 1;
    }
  if (e.mark > 0) {
    c.strokeStyle = "#f5cd7b";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(x, top - 6, 4 + Math.sin(time * 6), 0, Math.PI * 2);
    c.stroke();
    r(c, x - 1, top - 12, 2, 12, "#f5cd7b");
    r(c, x - 6, top - 7, 12, 2, "#f5cd7b");
  }
  if (e.stun > 0)
    for (let i = 0; i < 3; i++) {
      const a = time * 6 + (i * Math.PI * 2) / 3;
      r(c, x + Math.cos(a) * 9 - 1, top + 4 + Math.sin(a) * 3, 3, 3, "#f3e7a6");
    }
  if (e.hp < e.maxHp && !e.boss) {
    const ratio = Math.max(0, e.hp / e.maxHp);
    r(c, x - 16, top - 1, 32, 5, "#0f1916");
    r(c, x - 15, top, 30, 3, "#3b2a28");
    r(c, x - 15, top, 30 * ratio, 3, ratio > 0.5 ? "#d58d74" : ratio > 0.25 ? "#e3a95f" : "#e2665a");
    r(c, x - 15, top, 30 * ratio, 1, "#f3c2a5");
  }
}
// Cache small terrain chunks instead of allocating a full 54 MB world bitmap.
export function createTerrain(world) {
  const chunks = new Map(),
    chunkTiles = 16,
    chunkSize = chunkTiles * TILE;
  const hash = (x, y) =>
    Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
  function paint(c, x, y) {
    const v = world.tiles[y * WIDTH + x],
      px = x * TILE,
      py = y * TILE,
      reg = regionAt(px, py),
      rand = hash(x, y);
    const warm = ["coast", "island", "badlands"].includes(reg);
    const grass =
      season === "winter" && !warm
        ? ["#dde5e2", "#e5ebe8", "#d6dfdc"]
        : season === "autumn" && !warm
          ? reg === "forest"
            ? ["#8a8a52", "#94884e", "#8c8c58"]
            : ["#aaa064", "#b2a468", "#a69a5e"]
          : reg === "forest"
            ? season === "spring"
              ? ["#6f9a5e", "#76a264", "#7ca668"]
              : ["#759063", "#7a9668", "#809a6a"]
            : reg === "amberwood"
              ? ["#a7a16b", "#aca572", "#a4a06b"]
              : season === "spring"
                ? ["#88b06a", "#8db46e", "#92b872"]
                : ["#90a771", "#93a975", "#96ac77"];
    const frozen = season === "winter" && !warm && reg !== "coast";
    const colors =
      v === 2
        ? frozen
          ? ["#a9c8d4", "#b2d0da", "#a4c4d0"]
          : ["#548b91", "#60969b", "#639da0"]
        : v === 3
          ? ["#b2a278", "#b5a87b", "#b7aa80"]
          : v === 1
            ? season === "winter" && !warm
              ? ["#d8d2c4", "#ddd6c8", "#d4cdbf"]
              : ["#c8b58a", "#cdb98c", "#cfbd91"]
            : v === 4
              ? ["#c3c9b4", "#cbd0bc", "#bfc6b2"]
              : v === 5
                ? ["#84988b", "#8a9d8c", "#879989"]
                : v === 6
                  ? ["#d5c99d", "#dacda2", "#d8cca0"]
                  : v === 7
                    ? ["#6c8f77", "#70937b", "#73957c"]
                    : v === 8
                      ? {
                          crypt: ["#2f2937", "#352e3f", "#393347"],
                          mine: ["#253d49", "#2b4552", "#30505c"],
                          abyss: ["#23352c", "#2b3b2e", "#2f4333"],
                          citadel: ["#2d2540", "#352d49", "#3c3352"],
                          interior: ["#4a3524", "#523b28", "#47321f"],
                        }[world.theme] || ["#253039", "#2b353e", "#303b43"]
                      : v === 9
                        ? world.theme === "mine"
                          ? ["#6b8991", "#6c8894", "#78979a"]
                          : world.theme === "abyss"
                            ? ["#4f6454", "#546953", "#526659"]
                            : world.theme === "citadel"
                              ? ["#6a587c", "#715c85", "#77648e"]
                              : world.theme === "interior"
                                ? ["#8a6440", "#916a44", "#865f3c"]
                                : ["#575769", "#5e5d6c", "#63626f"]
                        : grass;
    r(c, px, py, TILE, TILE, colors[Math.floor(rand * 3)]);
    if (v === 8 && world.theme === "interior") {
      // Back wall: plaster with timber beams above, wood panelling below; elsewhere a dark frame.
      const below = world.tiles[(y + 1) * WIDTH + x],
        below2 = world.tiles[(y + 2) * WIDTH + x],
        side = world.tiles[y * WIDTH + x - 1] === 9 || world.tiles[y * WIDTH + x + 1] === 9;
      if (below === 9) {
        r(c, px, py, TILE, TILE, "#6b4a2c");
        for (let j = 0; j < 3; j++) r(c, px, py + 3 + j * 7, TILE, 1, "#4a321e");
        r(c, px + (x % 2 ? 4 : 15), py, 1, TILE, "#553a22");
        r(c, px, py, TILE, 3, "#3a2616");
        r(c, px, py + TILE - 2, TILE, 2, "#2a1a10");
      } else if (below2 === 9) {
        r(c, px, py, TILE, TILE, "#c8b08a");
        if (rand > 0.6) r(c, px + 5 + rand * 8, py + 8, 4, 2, "#b89e78");
        r(c, px, py, TILE, 4, "#4a321e");
        if (x % 3 === 0) r(c, px + 9, py, 6, TILE, "#5c3e24");
      } else if (side || below === 8 && world.tiles[(y + 3) * WIDTH + x] === 9) {
        r(c, px, py, TILE, TILE, "#2a1c12");
        r(c, px, py, TILE, 2, "#3e2a1a");
      } else r(c, px, py, TILE, TILE, "#120c08");
    } else if (v === 8) {
      r(c, px, py, TILE, 2, "#48525e");
      r(c, px, py + 12, TILE, 1, "#1d252e");
      r(c, px + 12, py, 1, 12, "#1c252e");
    } else if (v === 9 && world.theme === "interior") {
      // Wooden planks with staggered seams.
      for (let j = 0; j < 3; j++) r(c, px, py + j * 8 + 7, TILE, 1, "#5e4228");
      r(c, px + (y % 2 ? 6 : 16), py, 1, TILE, "#6a4a2e");
    } else if (v === 9) {
      r(c, px, py + 23, TILE, 1, "#3b414b");
      r(c, px + 23, py, 1, TILE, "#444955");
      if (rand > 0.72) r(c, px + 6, py + 8, 9, 1, "#7b7b8930");
    } else if (v === 3) {
      for (let j = 0; j < 6; j++) r(c, px, py + j * 4, TILE, 1, "#897954");
      r(c, px, py, 2, TILE, "#d2bd89");
      r(c, px + TILE - 2, py, 2, TILE, "#d2bd89");
    } else if (v === 2) {
      r(c, px + Math.floor(rand * 10), py + 8, 9, 1, "#8bb8b0");
      r(c, px + 8, py + 18, 8, 1, "#73aba5");
      for (const [dx, dy] of [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ]) {
        const n = world.tiles[(y + dy) * WIDTH + x + dx];
        if (n !== 2 && n !== 3) {
          const shore = reg === "coast" ? "#ead9ab" : "#b8be8d";
          if (dx) r(c, px + (dx > 0 ? 21 : 0), py, 3, 24, shore);
          else r(c, px, py + (dy > 0 ? 21 : 0), 24, 3, shore);
        }
      }
    } else {
      for (let j = 0; j < 4; j++) {
        const hx = hash(x + j, y + 1),
          hy = hash(x, y + j + 8);
        r(
          c,
          px + hx * 20 + 2,
          py + hy * 20 + 1,
          v === 1 ? 2 : 1,
          v === 1 || v === 6 ? 1 : 3,
          v === 4
            ? "#e1e4d0"
            : v === 1
              ? "#b39d74"
              : v === 5
                ? "#a5b3a0"
                : v === 6
                  ? "#b9a977"
                  : season === "winter" && !warm
                    ? "#c4d0cc"
                    : season === "autumn" && !warm
                      ? "#8e8448"
                      : "#789761",
        );
        if (v === 0 && j < 2)
          r(
            c,
            px + hx * 20 + 1,
            py + hy * 20 + 3,
            3,
            1,
            season === "winter" && !warm
              ? "#f6faf8"
              : season === "autumn" && !warm
                ? "#d8b05a"
                : "#b1bf89",
          );
      }
      if (v === 5 && rand > 0.48) {
        r(c, px + 3, py + 7, 18, 1, "#6d877e");
        r(c, px + 15, py + 7, 1, 14, "#6d877e");
      }
    }
  }
  const overview = document.createElement("canvas");
  overview.width = WIDTH * 4;
  overview.height = HEIGHT * 4;
  const oc = overview.getContext("2d");
  const colors = [
    "#90a771",
    "#cdb98c",
    "#60969b",
    "#b5a87b",
    "#cbd0bc",
    "#8a9d8c",
    "#d5c99d",
    "#6c8f77",
    "#253039",
    "#606572",
  ];
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      oc.fillStyle = colors[world.tiles[y * WIDTH + x]];
      oc.fillRect(x * 4, y * 4, 4, 4);
    }
  for (const o of world.objects)
    if (o.type === "tree") {
      oc.fillStyle = regionAt(o.x, o.y) === "amberwood" ? "#947444" : "#527952";
      oc.fillRect((o.x / TILE) * 4 - 1, (o.y / TILE) * 4 - 1, 2, 2);
    }
  function chunk(bx, by) {
    const key = bx + "," + by;
    if (chunks.has(key)) {
      const value = chunks.get(key);
      chunks.delete(key);
      chunks.set(key, value);
      return value;
    }
    const canvas = document.createElement("canvas");
    canvas.width = chunkSize;
    canvas.height = chunkSize;
    const c = canvas.getContext("2d");
    c.translate(-bx * chunkSize, -by * chunkSize);
    for (
      let y = by * chunkTiles;
      y < Math.min(HEIGHT, (by + 1) * chunkTiles);
      y++
    )
      for (
        let x = bx * chunkTiles;
        x < Math.min(WIDTH, (bx + 1) * chunkTiles);
        x++
      )
        paint(c, x, y);
    chunks.set(key, canvas);
    if (chunks.size > 24) chunks.delete(chunks.keys().next().value);
    return canvas;
  }
  return {
    overview,
    chunks,
    draw(c, sx, sy, sw, sh, dx = 0, dy = 0, dw = sw, dh = sh) {
      c.save();
      c.beginPath();
      c.rect(dx, dy, dw, dh);
      c.clip();
      c.translate(dx, dy);
      c.scale(dw / sw, dh / sh);
      c.translate(-sx, -sy);
      for (
        let by = Math.max(0, Math.floor(sy / chunkSize));
        by <=
        Math.min(
          Math.ceil(HEIGHT / chunkTiles) - 1,
          Math.floor((sy + sh) / chunkSize),
        );
        by++
      )
        for (
          let bx = Math.max(0, Math.floor(sx / chunkSize));
          bx <=
          Math.min(
            Math.ceil(WIDTH / chunkTiles) - 1,
            Math.floor((sx + sw) / chunkSize),
          );
          bx++
        )
          c.drawImage(chunk(bx, by), bx * chunkSize, by * chunkSize);
      c.restore();
    },
  };
}

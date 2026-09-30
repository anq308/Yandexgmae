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
  id = variant?.appearance ||
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
    }[id] || id;
  const swing = Math.sin(phase * Math.PI) * 0.8;
  c.save();
  c.translate(9, -10);
  c.rotate(-swing);
  if (glow) {
    c.shadowColor = glow;
    c.shadowBlur = 7;
  }
  if (id === "axe" || id === "hammer") {
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
  c.scale(mirror ? -scale : scale, scale);
  shadow(c, 0, 0, 9);
  const step = Math.round(Math.sin(frame) * 2),
    breathe = Math.round(Math.sin(frame ? frame * 0.5 : 0) * 0.4);
  const bare = options.player && (!options.armor || options.armor === "none");
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
  }
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
    ["warrior", "ranger", "mage"].includes(style) &&
    (!options.player || options.weapon)
  ) {
    const id =
      options.weapon ||
      { warrior: "sword", ranger: "bow", mage: "staff" }[style];
    drawWeapon(c, id, Math.min(1, swing / 0.35));
  }
  c.restore();
}
export function drawTree(c, x, y, style = "pine", variant = 0) {
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
      style === "amber"
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
    const bob = Math.sin(time * 4 + e.x) * 2;
    poly(
      c,
      [
        [x - 12, y + 1],
        [x - 13, y - 7],
        [x - 8, y - 15 + bob],
        [x + 5, y - 16 + bob],
        [x + 12, y - 9],
        [x + 13, y + 1],
      ],
      "#4b8177",
    );
    r(c, x - 8, y - 12 + bob, 15, 10, "#81ba94");
    r(c, x - 5, y - 14 + bob, 7, 3, "#b4d4a1");
    r(c, x - 5, y - 5, 2, 3, "#293f42");
    r(c, x + 4, y - 5, 2, 3, "#293f42");
    r(c, x - 3, y, 7, 1, "#426b60");
  } else if (type === "wolf") {
    const step = Math.sin(time * 9) * 2;
    poly(
      c,
      [
        [x - 15, y - 9],
        [x - 10, y - 17],
        [x + 7, y - 16],
        [x + 15, y - 8],
        [x + 12, y - 1],
        [x - 12, y - 1],
      ],
      "#6a8184",
    );
    r(c, x - 10, y - 15, 16, 8, "#9daead");
    r(c, x - 10, y - 15, 10, 2, "#c8d0ba");
    r(c, x + 7, y - 17, 7, 11, "#7d989a");
    poly(
      c,
      [
        [x + 7, y - 16],
        [x + 8, y - 24],
        [x + 13, y - 17],
      ],
      "#5d7a7c",
    );
    r(c, x + 11, y - 14, 2, 2, "#edcd81");
    r(c, x + 14, y - 9, 7, 4, "#aebdad");
    r(c, x + 20, y - 9, 2, 2, "#344c49");
    r(c, x - 8, y - 2 + step, 3, 7, "#4e6b69");
    r(c, x + 7, y - 2 - step, 3, 7, "#4e6b69");
    poly(
      c,
      [
        [x - 14, y - 11],
        [x - 24, y - 19],
        [x - 21, y - 8],
        [x - 14, y - 3],
      ],
      "#91a6a0",
    );
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
  if (e.slow > 0) {
    c.strokeStyle = "#bce3f3";
    c.lineWidth = 1;
    c.strokeRect(x - 16, y - 35, 32, 39);
  }
  if (e.mark > 0) {
    r(c, x - 1, y - 48, 2, 9, "#f5cd7b");
    r(c, x - 5, y - 44, 10, 2, "#f5cd7b");
  }
  if (e.stun > 0) {
    r(c, x - 6, y - 41, 3, 3, "#e7dda8");
    r(c, x + 4, y - 43, 3, 3, "#e7dda8");
  }
  if (e.hp < e.maxHp) {
    r(
      c,
      x - 15,
      y - (["guardian", "titan"].includes(type) ? 69 : 43),
      30,
      3,
      "#293c37",
    );
    r(
      c,
      x - 15,
      y - (["guardian", "titan"].includes(type) ? 69 : 43),
      (30 * e.hp) / e.maxHp,
      3,
      "#cb8e7b",
    );
  }
  if (e.windup > 0) {
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
    const grass =
      reg === "forest"
        ? ["#759063", "#7a9668", "#809a6a"]
        : reg === "amberwood"
          ? ["#a7a16b", "#aca572", "#a4a06b"]
          : ["#90a771", "#93a975", "#96ac77"];
    const colors =
      v === 2
        ? ["#548b91", "#60969b", "#639da0"]
        : v === 3
          ? ["#b2a278", "#b5a87b", "#b7aa80"]
          : v === 1
            ? ["#c8b58a", "#cdb98c", "#cfbd91"]
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
                        }[world.theme] || ["#253039", "#2b353e", "#303b43"]
                      : v === 9
                        ? world.theme === "mine"
                          ? ["#6b8991", "#6c8894", "#78979a"]
                          : world.theme === "abyss"
                            ? ["#4f6454", "#546953", "#526659"]
                            : world.theme === "citadel"
                              ? ["#6a587c", "#715c85", "#77648e"]
                              : ["#575769", "#5e5d6c", "#63626f"]
                        : grass;
    r(c, px, py, TILE, TILE, colors[Math.floor(rand * 3)]);
    if (v === 8) {
      r(c, px, py, TILE, 2, "#48525e");
      r(c, px, py + 12, TILE, 1, "#1d252e");
      r(c, px + 12, py, 1, 12, "#1c252e");
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
                  : "#789761",
        );
        if (v === 0 && j < 2)
          r(c, px + hx * 20 + 1, py + hy * 20 + 3, 3, 1, "#b1bf89");
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

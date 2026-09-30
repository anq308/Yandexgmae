import { label } from "./i18n.js";
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
  ];
  if (!advanced.includes(type)) return false;
  c.fillStyle = "#10192455";
  c.beginPath();
  c.ellipse(x, y + 4, e.boss ? 27 : 12, 5, 0, 0, Math.PI * 2);
  c.fill();
  if (type === "skeleton" || type === "boneKing")
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
  if (e.slow > 0) {
    c.strokeStyle = "#b9e8f3";
    c.strokeRect(x - 16, y - 35, 32, 38);
  }
  if (!e.boss && e.hp < e.maxHp) {
    rect(c, x - 16, y - 43, 32, 3, "#28363b");
    rect(
      c,
      x - 16,
      y - 43,
      (32 * e.hp) / e.maxHp,
      3,
      e.elite ? "#dfb57b" : "#b69b81",
    );
  }
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

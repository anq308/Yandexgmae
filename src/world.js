export const TILE = 24,
  WIDTH = 256,
  HEIGHT = 192;
export const point = (x, y) => ({
  x: x * TILE + TILE / 2,
  y: y * TILE + TILE / 2,
});
export function random(seed = 72131) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function regionAt(x, y) {
  x /= TILE;
  y /= TILE;
  if (x > 178 && x < 203 && y > 138 && y < 158) return "frontier";
  if (x > 172 && y < 30) return "tundra";
  if (x > 172 && y < 77) return "highlands";
  if (x > 172 && y < 112) return "deadwood";
  if (x > 172) return "badlands";
  if (y > 150) return "island";
  if (x > 127 && x < 153 && y > 70 && y < 92) return "harbor";
  if (y > 99) return "coast";
  if (x > 112 && y > 58) return "marsh";
  if (x > 112) return "amberwood";
  if (x > 78 && y > 57 && y < 94) return "ruins";
  if (x > 62 && y < 26) return "mountain";
  if (x > 63 && x < 81 && y > 26 && y < 43) return "outpost";
  if (x > 43 && x < 61 && y > 56) return "lake";
  if (x > 13 && x < 35 && y > 51 && y < 72) return "village";
  if (x > 29 && x < 65 && y < 57 && y > 26) return "forest";
  return "meadow";
}
export const landmarks = [
  {
    id: "elder",
    type: "npc",
    ...point(26, 59),
    name: ["Староста Оливер", "Elder Oliver"],
    role: ["Хранитель историй", "Keeper of stories"],
    style: "elder",
  },
  {
    id: "herbalist",
    type: "npc",
    ...point(18, 64),
    name: ["Травница Мира", "Mira the Herbalist"],
    role: ["Зелья и травы", "Potions & herbs"],
    style: "herbalist",
  },
  {
    id: "smith",
    type: "npc",
    ...point(30, 65),
    name: ["Кузнец Брам", "Bram the Smith"],
    role: ["Снаряжение", "Equipment"],
    style: "smith",
  },
  {
    id: "scout",
    type: "npc",
    ...point(72, 34),
    name: ["Следопыт Рин", "Scout Rin"],
    role: ["Страж перевала", "Pass watcher"],
    style: "ranger",
  },
  {
    id: "camp1",
    type: "camp",
    ...point(23, 63),
    name: ["Костёр деревни", "Village campfire"],
  },
  {
    id: "camp2",
    type: "camp",
    ...point(71, 36),
    name: ["Костёр Высокого Ключа", "Highspring campfire"],
  },
  {
    id: "forestRune",
    type: "rune",
    ...point(44, 37),
    name: ["Лесной обелиск", "Forest obelisk"],
  },
  {
    id: "mountainRune",
    type: "rune",
    ...point(87, 15),
    name: ["Горный обелиск", "Mountain obelisk"],
  },
  {
    id: "altar",
    type: "altar",
    ...point(91, 67),
    name: ["Сердце долины", "Heart of the valley"],
  },
  ...[
    [34, 49],
    [42, 35],
    [59, 39],
    [75, 23],
    [94, 17],
    [82, 60],
    [97, 73],
    [16, 76],
    [119, 36],
    [148, 29],
    [156, 47],
    [129, 63],
    [151, 96],
    [162, 78],
    [87, 112],
    [38, 121],
  ].map(([x, y], i) => ({
    id: "chest" + i,
    type: "chest",
    ...point(x, y),
    name: ["Старинный сундук", "Ancient chest"],
  })),
];
landmarks.push(
  {
    id: "camp3",
    type: "camp",
    ...point(138, 82),
    name: ["Костёр Речной пристани", "Riverport campfire"],
  },
  {
    id: "camp4",
    type: "camp",
    ...point(47, 113),
    name: ["Лагерь у моря", "Seaside camp"],
  },
  {
    id: "captain",
    type: "npc",
    ...point(141, 78),
    name: ["Капитан Лея", "Captain Lea"],
    role: ["Дальние земли", "The farlands"],
    style: "ranger",
  },
);
landmarks.push(
  {
    id: "board",
    type: "board",
    ...point(28, 62),
    name: ["Доска поручений", "Contract board"],
  },
  {
    id: "farBoard",
    type: "board",
    ...point(193, 149),
    name: ["Доска пограничья", "Frontier contracts"],
  },
  {
    id: "camp5",
    type: "camp",
    ...point(190, 148),
    name: ["Костёр пограничья", "Frontier campfire"],
  },
  {
    id: "camp6",
    type: "camp",
    ...point(59, 173),
    name: ["Лагерь Песчаного острова", "Sand Isle camp"],
  },
  {
    id: "cryptPortal",
    type: "entrance",
    dungeon: "crypt",
    ...point(67, 57),
    name: ["Лиственная гробница", "Leafhaven Crypt"],
  },
  {
    id: "minePortal",
    type: "entrance",
    dungeon: "mine",
    ...point(95, 16),
    name: ["Шахты вечного льда", "Everfrost Mines"],
  },
  {
    id: "abyssPortal",
    type: "entrance",
    dungeon: "abyss",
    ...point(190, 88),
    name: ["Провал ядовитых корней", "Venomroot Abyss"],
  },
  {
    id: "citadelPortal",
    type: "entrance",
    dungeon: "citadel",
    ...point(222, 45),
    name: ["Цитадель расколотого неба", "Shattered Sky Citadel"],
  },
  ...Array.from({ length: 24 }, (_, i) => ({
    id: "chest" + (16 + i),
    type: "chest",
    ...point(
      i < 4 ? 32 + i * 16 : 179 + ((i * 19) % 67),
      i < 4 ? 166 + (i % 3) * 5 : 32 + ((i * 17) % 139),
    ),
    name: ["Сундук дальних земель", "Farlands chest"],
  })),
);
const house = (id, x, y, style) => ({
  id,
  type: "house",
  ...point(x, y),
  style,
});
landmarks.push(
  {
    id: "bladeMentor",
    type: "trainer",
    characterClass: "warrior",
    style: "warrior",
    name: ["Наставник Торн", "Mentor Thorn"],
    ...point(20, 60),
  },
  {
    id: "rangerMentor",
    type: "trainer",
    characterClass: "ranger",
    style: "ranger",
    name: ["Следопыт Лиса", "Ranger Lysa"],
    ...point(30, 60),
  },
  {
    id: "mageMentor",
    type: "trainer",
    characterClass: "mage",
    style: "mage",
    name: ["Архивист Эйра", "Archivist Eira"],
    ...point(27, 68),
  },
  {
    id: "paladinMentor",
    type: "trainer",
    characterClass: "paladin",
    style: "paladin",
    name: ["Сестра Аврора", "Sister Aurora"],
    ...point(33, 60),
  },
  {
    id: "necroMentor",
    type: "trainer",
    characterClass: "necromancer",
    style: "necromancer",
    name: ["Отшельник Морв", "Morv the Hermit"],
    ...point(16, 58),
  },
  {
    id: "beastMentor",
    type: "trainer",
    characterClass: "summoner",
    style: "summoner",
    name: ["Зверолов Брок", "Brock the Beastcaller"],
    ...point(13, 63),
  },
  {
    id: "druidMentor",
    type: "trainer",
    characterClass: "shapeshifter",
    style: "shapeshifter",
    name: ["Друидесса Ива", "Iva the Druid"],
    ...point(35, 65),
  },
  {
    id: "monkMentor",
    type: "trainer",
    characterClass: "monk",
    style: "monk",
    name: ["Мастер Шэнь", "Master Shen"],
    ...point(18, 67),
  },
  {
    id: "engineerMentor",
    type: "trainer",
    characterClass: "engineer",
    style: "engineer",
    name: ["Изобретательница Гретта", "Gretta the Inventor"],
    ...point(26, 72),
  },
  {
    id: "riverFishing",
    type: "fishspot",
    name: ["Рыбалка на реке", "River fishing"],
    ...point(52, 58),
  },
  {
    id: "lakeFishing",
    type: "fishspot",
    name: ["Тихий берег", "Quiet bank"],
    ...point(42, 72),
  },
  {
    id: "seaFishing",
    type: "fishspot",
    name: ["Морская рыбалка", "Sea fishing"],
    ...point(145, 92),
  },
  {
    id: "islandFishing",
    type: "fishspot",
    name: ["Рыбалка на острове", "Island fishing"],
    ...point(59, 181),
  },
  ...[
    [31, 54],
    [38, 58],
    [42, 46],
    [67, 37],
    [143, 36],
    [189, 145],
  ].map(([x, y], i) => ({
    id: "berry" + i,
    type: "berryBush",
    name: ["Ягодный куст", "Berry bush"],
    ...point(x, y),
  })),
);
export function createWorld() {
  const rng = random(),
    tiles = new Uint8Array(WIDTH * HEIGHT),
    blocked = new Uint8Array(WIDTH * HEIGHT),
    objects = [];
  const set = (x, y, v) => {
    if (x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT) tiles[y * WIDTH + x] = v;
  };
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      const region = regionAt(x * TILE, y * TILE);
      let type = ["mountain", "tundra", "highlands"].includes(region)
        ? 4
        : ["ruins", "deadwood"].includes(region)
          ? 5
          : ["coast", "badlands", "island"].includes(region)
            ? 6
            : region === "marsh"
              ? 7
              : 0;
      const river = 55 + Math.sin(y * 0.12) * 3;
      if (
        (Math.abs(x - river) < 1.7 && y > 20) ||
        ((x - 50) / 7) ** 2 + ((y - 68) / 10) ** 2 < 1
      )
        type = 2;
      if (
        (x < 174 &&
          y > 126 + Math.sin(x * 0.08) * 3 &&
          !(x > 23 && x < 106 && y > 153 && y < 186)) ||
        (x > 116 &&
          y > 59 &&
          y < 99 &&
          Math.sin(x * 0.18) * Math.cos(y * 0.22) > 0.6)
      )
        type = 2;
      set(x, y, type);
    }
  const road = (ax, ay, bx, by, width = 2) => {
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay) * 2);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(ax + ((bx - ax) * s) / steps),
        y = Math.round(ay + ((by - ay) * s) / steps);
      for (let oy = -width; oy <= width; oy++)
        for (let ox = -width; ox <= width; ox++)
          if (Math.abs(ox) + Math.abs(oy) <= width + 1)
            set(x + ox, y + oy, tiles[(y + oy) * WIDTH + x + ox] === 2 ? 3 : 1);
    }
  };
  road(158, 48, 190, 52, 1);
  road(190, 52, 222, 45, 1);
  road(190, 52, 201, 20, 1);
  road(155, 89, 184, 90, 1);
  road(184, 90, 190, 88, 1);
  road(184, 90, 204, 116, 1);
  road(204, 116, 190, 148, 1);
  road(190, 148, 226, 167, 1);
  road(190, 148, 159, 140, 1);
  road(155, 114, 159, 140, 1);
  road(85, 113, 85, 158, 1);
  road(85, 158, 59, 173, 1);
  road(59, 173, 32, 171, 1);
  road(181, 148, 199, 148, 2);
  road(190, 142, 190, 156, 2);
  road(15, 63, 33, 63, 2);
  road(24, 56, 24, 69, 2);
  road(30, 61, 39, 46, 1);
  road(39, 46, 45, 38, 1);
  road(39, 46, 58, 46, 1);
  road(58, 46, 71, 35, 1);
  road(67, 35, 78, 35, 2);
  road(73, 35, 86, 17, 1);
  road(86, 17, 94, 17, 2);
  road(71, 35, 77, 53, 1);
  road(77, 53, 91, 66, 1);
  road(76, 53, 69, 57, 1);
  road(86, 67, 99, 67, 2);
  road(91, 61, 91, 73, 2);
  road(24, 68, 19, 76, 1);
  road(94, 17, 116, 30, 1);
  road(116, 30, 148, 38, 1);
  road(148, 38, 158, 48, 1);
  road(99, 67, 118, 70, 1);
  road(118, 70, 137, 81, 1);
  road(137, 81, 155, 89, 1);
  road(131, 81, 147, 81, 2);
  road(139, 75, 139, 88, 2);
  road(91, 73, 85, 96, 1);
  road(85, 96, 48, 113, 1);
  road(48, 113, 38, 121, 1);
  road(85, 96, 132, 107, 1);
  road(132, 107, 155, 114, 1);
  objects.push(
    house("frontier1", 183, 143, "brown"),
    house("frontier2", 195, 142, "red"),
    house("frontier3", 199, 153, "green"),
    house("islandHome", 56, 167, "green"),
    house("home1", 19, 57, "red"),
    house("home2", 29, 55, "brown"),
    house("shop", 16, 61, "green"),
    house("forge", 32, 62, "brown"),
    house("home3", 29, 70, "red"),
    house("home4", 20, 70, "brown"),
    house("hill1", 68, 30, "green"),
    house("hill2", 77, 30, "red"),
    house("hill3", 78, 39, "brown"),
    house("harbor1", 132, 76, "green"),
    house("harbor2", 145, 76, "red"),
    house("harbor3", 145, 87, "brown"),
    house("seaside", 44, 109, "green"),
  );
  // Every interactable gets an unobstructed clearing, including the boss arena.
  const clear = (x, y, r = 2) => {
    for (let oy = -r; oy <= r; oy++)
      for (let ox = -r; ox <= r; ox++) {
        const tx = Math.floor(x / TILE) + ox,
          ty = Math.floor(y / TILE) + oy;
        if (tiles[ty * WIDTH + tx] === 2) set(tx, ty, 0);
      }
  };
  landmarks.forEach((o) =>
    clear(o.x, o.y, o.type === "altar" ? 7 : o.type === "entrance" ? 3 : 1),
  );
  enemySpawns.forEach((o) => clear(o.x, o.y, o.type === "titan" ? 4 : 1));
  for (let y = 1; y < HEIGHT - 1; y++)
    for (let x = 1; x < WIDTH - 1; x++) {
      const i = y * WIDTH + x,
        type = tiles[i],
        region = regionAt(x * TILE, y * TILE),
        v = rng();
      blocked[i] = type === 2 ? 1 : 0;
      if (type === 1 || type === 2 || type === 3) continue;
      const p = point(x, y);
      if (
        landmarks.some(
          (o) =>
            Math.hypot(o.x - p.x, o.y - p.y) < (o.type === "altar" ? 180 : 62),
        ) ||
        enemySpawns.some(
          (o) =>
            Math.hypot(o.x - p.x, o.y - p.y) < (o.type === "titan" ? 170 : 38),
        ) ||
        objects.some(
          (o) =>
            o.type === "house" &&
            Math.abs(o.x - p.x) < 90 &&
            Math.abs(o.y - p.y) < 85,
        )
      )
        continue;
      const treeChance =
        region === "forest" || region === "amberwood"
          ? 0.22
          : region === "mountain"
            ? 0.04
            : region === "ruins"
              ? 0.025
              : region === "coast"
                ? 0.018
                : region === "marsh"
                  ? 0.04
                  : 0.085;
      if (v < treeChance) {
        objects.push({
          id: `tree${i}`,
          type: "tree",
          ...p,
          style: ["mountain", "tundra", "highlands"].includes(region)
            ? "snow"
            : region === "amberwood"
              ? "amber"
              : region === "coast"
                ? "palm"
                : region === "marsh"
                  ? "willow"
                  : rng() > 0.34
                    ? "pine"
                    : "oak",
          variant: Math.floor(rng() * 3),
        });
        blocked[i] = 1;
      } else if (v < treeChance + 0.025) {
        objects.push({
          id: `rock${i}`,
          type: "rock",
          ...p,
          style: region === "mountain" ? "snow" : "normal",
        });
        blocked[i] = 1;
      } else if (
        v < treeChance + 0.073 &&
        region !== "mountain" &&
        region !== "ruins"
      )
        objects.push({
          id: `flower${i}`,
          type: "flower",
          ...p,
          variant: Math.floor(rng() * 4),
        });
    }
  // Resources are persistent by ID, so collecting and reloading cannot duplicate them.
  [
    [34, 52],
    [37, 48],
    [41, 45],
    [45, 42],
    [47, 35],
    [32, 42],
    [39, 39],
    [49, 49],
    [29, 47],
    [61, 47],
    [18, 74],
    [24, 76],
    [67, 44],
    [73, 44],
    [65, 31],
    [80, 49],
  ].forEach(([x, y], i) =>
    objects.push({ id: `herb${i}`, type: "herb", ...point(x, y) }),
  );
  [
    [79, 25],
    [83, 22],
    [90, 21],
    [94, 14],
    [87, 11],
    [77, 20],
    [92, 27],
    [99, 21],
    [67, 24],
    [73, 23],
    [97, 31],
    [82, 17],
  ].forEach(([x, y], i) =>
    objects.push({ id: `ore${i}`, type: "ore", ...point(x, y) }),
  );
  [
    [82, 20],
    [86, 14],
    [91, 12],
    [95, 23],
    [78, 16],
    [90, 26],
    [98, 18],
    [83, 12],
  ].forEach(([x, y], i) =>
    objects.push({ id: `crystal${i}`, type: "crystal", ...point(x, y) }),
  );
  for (let i = 0; i < 32; i++) {
    const type = ["herb", "ore", "crystal", "wood"][i % 4],
      x = 178 + ((i * 17) % 66),
      y = 35 + ((i * 13) % 137);
    objects.push({
      id: type + "Expansion" + i,
      type,
      ...point(
        x >= 197 && x <= 200 && y >= 152 && y <= 154
          ? 194
          : x >= 181 && x <= 184 && y >= 142 && y <= 144
            ? 187
            : x >= 193 && x <= 196 && y >= 141 && y <= 143
              ? 190
              : x,
        y,
      ),
    });
  }
  for (let i = 0; i < 10; i++)
    objects.push({
      id: "woodVillage" + i,
      type: "wood",
      ...point(33 + i * 2, 54 + (i % 4)),
    });
  objects.push(...landmarks);
  [
    [118, 40],
    [123, 46],
    [132, 30],
    [149, 44],
    [161, 51],
    [119, 72],
    [127, 85],
    [153, 85],
    [144, 93],
    [66, 103],
    [48, 118],
    [101, 107],
  ].forEach(([x, y], i) =>
    objects.push({ id: `herbFar${i}`, type: "herb", ...point(x, y) }),
  );
  [
    [120, 28],
    [147, 33],
    [158, 39],
    [133, 65],
    [156, 92],
    [97, 101],
    [76, 111],
    [38, 118],
  ].forEach(([x, y], i) =>
    objects.push({ id: `oreFar${i}`, type: "ore", ...point(x, y) }),
  );
  [
    [124, 33],
    [145, 42],
    [159, 44],
    [154, 98],
    [102, 115],
    [62, 118],
  ].forEach(([x, y], i) =>
    objects.push({ id: `crystalFar${i}`, type: "crystal", ...point(x, y) }),
  );
  const resources = objects.filter((o) =>
    ["herb", "ore", "crystal", "wood"].includes(o.type),
  );
  // Remove trees as well as their collision cells so gathering never happens
  // inside a visually solid trunk.
  for (let i = objects.length - 1; i >= 0; i--)
    if (
      ["tree", "rock"].includes(objects[i].type) &&
      resources.some(
        (o) => Math.hypot(o.x - objects[i].x, o.y - objects[i].y) < 36,
      )
    )
      objects.splice(i, 1);
  resources.forEach((o) => {
    const tx = Math.floor(o.x / TILE),
      ty = Math.floor(o.y / TILE);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        blocked[(ty + dy) * WIDTH + tx + dx] = 0;
        if (tiles[(ty + dy) * WIDTH + tx + dx] === 2) set(tx + dx, ty + dy, 0);
      }
  });
  objects
    .filter((o) => o.type === "house")
    .forEach((o) => {
      const x = Math.floor(o.x / TILE),
        y = Math.floor(o.y / TILE);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -2; dx <= 1; dx++) blocked[(y + dy) * WIDTH + x + dx] = 1;
    });
  // Decorative details of the settlements and ruins.
  // Crops now grow in the fenced farm plots of settlements.js.
  [].forEach(([x, y], i) =>
    objects.push({
      id: `crop${i}`,
      type: "crop",
      ...point(x, y),
      variant: i % 3,
    }),
  );
  [
    [13, 59],
    [14, 59],
    [15, 59],
    [16, 59],
  ].forEach(([x, y], i) =>
    objects.push({ id: `fence${i}`, type: "fence", ...point(x, y) }),
  );
  [
    [85, 61],
    [97, 61],
    [85, 73],
    [98, 73],
    [88, 59],
    [94, 75],
  ].forEach(([x, y], i) =>
    objects.push({ id: `pillar${i}`, type: "pillar", ...point(x, y) }),
  );
  [
    [21, 61],
    [27, 62],
    [69, 35],
    [75, 35],
    [88, 64],
    [94, 70],
  ].forEach(([x, y], i) =>
    objects.push({ id: `lamp${i}`, type: "lamp", ...point(x, y) }),
  );
  [
    [17, 73],
    [19, 73],
  ].forEach(([x, y], i) =>
    objects.push({ id: `sheep${i}`, type: "sheep", ...point(x, y) }),
  );
  objects.push(
    { id: "well", type: "well", ...point(25, 56) },
    { id: "sign", type: "sign", ...point(32, 58) },
  );
  [
    [146, 34],
    [153, 33],
    [146, 43],
    [154, 44],
    [156, 96],
    [163, 94],
  ].forEach(([x, y], i) =>
    objects.push({ id: `eastPillar${i}`, type: "pillar", ...point(x, y) }),
  );
  [
    [133, 83],
    [137, 87],
    [142, 82],
    [45, 114],
  ].forEach(([x, y], i) =>
    objects.push({ id: `farLamp${i}`, type: "lamp", ...point(x, y) }),
  );
  for (let x = 136; x <= 145; x++)
    for (let y = 90; y < 94; y++) {
      set(x, y, 3);
      blocked[y * WIDTH + x] = 0;
    }
  const buckets = new Map(),
    bucketSize = TILE * 12;
  for (const o of objects) {
    const key = `${Math.floor(o.x / bucketSize)},${Math.floor(o.y / bucketSize)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(o);
  }
  return {
    tiles,
    blocked,
    objects,
    width: WIDTH,
    height: HEIGHT,
    addObject(o) {
      objects.push(o);
      const key = `${Math.floor(o.x / bucketSize)},${Math.floor(o.y / bucketSize)}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(o);
    },
    removeObject(o) {
      const i = objects.indexOf(o);
      if (i >= 0) objects.splice(i, 1);
      const list = buckets.get(`${Math.floor(o.x / bucketSize)},${Math.floor(o.y / bucketSize)}`);
      if (list && list.includes(o)) list.splice(list.indexOf(o), 1);
    },
    getObjectsInRect(x, y, w, h) {
      const result = [];
      for (
        let by = Math.floor(y / bucketSize);
        by <= Math.floor((y + h) / bucketSize);
        by++
      )
        for (
          let bx = Math.floor(x / bucketSize);
          bx <= Math.floor((x + w) / bucketSize);
          bx++
        )
          result.push(...(buckets.get(`${bx},${by}`) || []));
      return result;
    },
  };
}
export const enemySpawns = [
  ...[
    [35, 47],
    [39, 44],
    [43, 48],
    [45, 40],
    [48, 44],
    [34, 40],
    [40, 34],
    [50, 37],
    [47, 51],
    [37, 51],
    [60, 49],
    [63, 42],
  ].map(([x, y], i) => ({ id: "slime" + i, type: "slime", ...point(x, y) })),
  ...[
    [77, 25],
    [81, 21],
    [87, 22],
    [91, 17],
    [95, 25],
    [85, 12],
  ].map(([x, y], i) => ({ id: "golem" + i, type: "golem", ...point(x, y) })),
  ...[
    [82, 59],
    [85, 65],
    [95, 62],
    [97, 69],
    [86, 72],
    [99, 74],
  ].map(([x, y], i) => ({ id: "wisp" + i, type: "wisp", ...point(x, y) })),
  { id: "guardian", type: "guardian", ...point(91, 65) },
  ...[
    [118, 34],
    [124, 39],
    [132, 43],
    [141, 32],
    [149, 47],
    [157, 41],
    [120, 62],
    [130, 69],
    [143, 66],
    [152, 73],
  ].map(([x, y], i) => ({ id: `wolf${i}`, type: "wolf", ...point(x, y) })),
  ...[
    [122, 77],
    [127, 91],
    [151, 90],
    [158, 84],
    [142, 103],
    [98, 113],
    [67, 113],
    [40, 119],
  ].map(([x, y], i) => ({
    id: `sentinel${i}`,
    type: "sentinel",
    ...point(x, y),
  })),
  { id: "titanEast", type: "titan", ...point(150, 38) },
  { id: "titanCoast", type: "titan", ...point(123, 115) },
];
for (let i = 0; i < 100; i++) {
  const type = ["bandit", "spider", "skeleton", "shaman", "revenant", "bat"][
    i % 6
  ];
  const x =
    i < 18
      ? 34 + ((i * 7) % 63)
      : i < 30
        ? 33 + ((i * 9) % 60)
        : 178 + ((i * 23) % 68);
  const y =
    i < 18
      ? 78 + ((i * 5) % 39)
      : i < 30
        ? 157 + ((i * 7) % 26)
        : 18 + ((i * 19) % 151);
  const safeX =
    x >= 181 && x <= 184 && y >= 142 && y <= 144
      ? 187
      : x >= 193 && x <= 196 && y >= 141 && y <= 143
        ? 190
        : x >= 197 && x <= 200 && y >= 152 && y <= 154
          ? 194
          : x >= 54 && x <= 57 && y >= 166 && y <= 168
            ? 60
            : x;
  enemySpawns.push({
    id: type + "Expansion" + i,
    type,
    ...point(safeX, y),
    tier: i < 18 ? 1 : i < 30 ? 2 : Math.min(4, 1 + Math.floor(y / 55)),
    nightOnly: type === "revenant" && i % 2 === 0,
  });
}
export function canWalk(world, x, y, radius = 7) {
  for (const [dx, dy] of [
    [-radius, -radius],
    [radius, -radius],
    [-radius, radius],
    [radius, radius],
  ]) {
    const tx = Math.floor((x + dx) / TILE),
      ty = Math.floor((y + dy) / TILE);
    if (
      tx < 1 ||
      ty < 1 ||
      tx >= WIDTH - 1 ||
      ty >= HEIGHT - 1 ||
      world.blocked[ty * WIDTH + tx]
    )
      return false;
  }
  return true;
}
// A binary heap and octile heuristic keep long routes responsive.
export function findPath(world, from, to) {
  const sx = Math.floor(from.x / TILE),
    sy = Math.floor(from.y / TILE),
    ex = Math.floor(to.x / TILE),
    ey = Math.floor(to.y / TILE);
  if (
    ex < 1 ||
    ey < 1 ||
    ex >= WIDTH - 1 ||
    ey >= HEIGHT - 1 ||
    world.blocked[ey * WIDTH + ex]
  )
    return [];
  const start = sy * WIDTH + sx,
    end = ey * WIDTH + ex,
    costs = new Float64Array(WIDTH * HEIGHT).fill(Infinity),
    came = new Int32Array(WIDTH * HEIGHT).fill(-1),
    heap = [];
  const heuristic = (x, y) => {
    const dx = Math.abs(ex - x),
      dy = Math.abs(ey - y);
    return Math.min(dx, dy) * 14 + Math.abs(dx - dy) * 10;
  };
  const push = (value) => {
    heap.push(value);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent].score <= value.score) break;
      heap[i] = heap[parent];
      i = parent;
    }
    heap[i] = value;
  };
  const pop = () => {
    const top = heap[0],
      last = heap.pop();
    if (heap.length) {
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let child = i * 2 + 1;
        if (
          child + 1 < heap.length &&
          heap[child + 1].score < heap[child].score
        )
          child++;
        if (heap[child].score >= last.score) break;
        heap[i] = heap[child];
        i = child;
      }
      heap[i] = last;
    }
    return top;
  };
  costs[start] = 0;
  push({ key: start, cost: 0, score: heuristic(sx, sy) });
  const directions = [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  while (heap.length) {
    const cur = pop();
    if (cur.cost !== costs[cur.key]) continue;
    if (cur.key === end) {
      const path = [];
      for (let k = end; k !== start; k = came[k]) {
        if (k < 0) return [];
        path.push(point(k % WIDTH, Math.floor(k / WIDTH)));
      }
      return path.reverse();
    }
    const x = cur.key % WIDTH,
      y = Math.floor(cur.key / WIDTH);
    for (const [dx, dy] of directions) {
      const nx = x + dx,
        ny = y + dy,
        key = ny * WIDTH + nx;
      if (
        nx < 1 ||
        ny < 1 ||
        nx >= WIDTH - 1 ||
        ny >= HEIGHT - 1 ||
        world.blocked[key] ||
        (dx &&
          dy &&
          (world.blocked[y * WIDTH + nx] || world.blocked[ny * WIDTH + x]))
      )
        continue;
      const cost = cur.cost + (dx && dy ? 14 : 10);
      if (cost < costs[key]) {
        costs[key] = cost;
        came[key] = cur.key;
        push({ key, cost, score: cost + heuristic(nx, ny) });
      }
    }
  }
  return [];
}
export function lineOfSight(world, a, b) {
  const distance = Math.hypot(b.x - a.x, b.y - a.y),
    steps = Math.max(1, Math.ceil(distance / 8));
  for (let i = 1; i <= steps; i++)
    if (
      !canWalk(
        world,
        a.x + ((b.x - a.x) * i) / steps,
        a.y + ((b.y - a.y) * i) / steps,
        1,
      )
    )
      return false;
  return true;
}

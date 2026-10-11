import { landmarks } from "./world.js";
export const CHEST_COUNT = landmarks.filter((o) => o.type === "chest").length;
import { tr, label } from "./i18n.js";
import { heralds } from "./eclipse.js";
export const countGathered = (save, type) =>
  save.collected.filter((id) => id.startsWith(type)).length;
export function questInfo(save) {
  const st = save.story || { fate: {}, knows: {} },
    fate = st.fate || {},
    wave = st.wave;
  const q = [
    {
      title: tr("Чужак со Знаком", "The stranger with the Mark"),
      desc: tr("Вас нашли на берегу без памяти. Староста Оливер знает, что значит знак на вашей ладони.", "You were found on the shore with no memory. Elder Oliver knows what the mark on your palm means."),
      target: "elder",
      steps: [[tr("Поговорить со старостой Оливером", "Speak to Elder Oliver"), 0, 1]],
    },
    {
      title: tr("Шёпот обелиска", "Whisper of the obelisk"),
      desc: wave?.anchor === "forestRune"
        ? tr("Скверна вырвалась из обелиска. Отбейтесь — и он загорится.", "Blight burst from the obelisk. Fight it off and it will ignite.")
        : tr("Лесной обелиск треснул. Коснитесь его — Знак подскажет, что делать. Решать вам.", "The forest obelisk is cracked. Touch it — the Mark will guide you. The choice is yours."),
      target: wave?.anchor === "forestRune" ? null : "forestRune",
      steps: [
        [tr("Коснуться лесного обелиска", "Touch the forest obelisk"), +!!wave || +!!save.flags.forestRune, 1],
        [tr("Защитить обелиск от скверны", "Defend the obelisk from the blight"), +!!save.flags.forestRune, 1],
      ],
    },
    {
      title: tr("Тайна старосты", "The elder's secret"),
      desc: save.flags.obeliskPower
        ? tr("Вы выпили силу обелиска. Оливер заметит это по глазам.", "You drank the obelisk's power. Oliver will see it in your eyes.")
        : tr("Обелиск горит. Оливер должен объяснить, что на самом деле держат обелиски.", "The obelisk burns. Oliver must explain what the obelisks really hold."),
      target: "elder",
      steps: [[tr("Вернуться к Оливеру", "Return to Oliver"), 0, 1]],
    },
    {
      title: tr("Пепел на вершинах", "Ash on the peaks"),
      desc: wave?.anchor === "mountainRune"
        ? tr("Пепельные напали. Отбейтесь у горного обелиска.", "The Ashen attack. Fight them off at the mountain obelisk.")
        : tr("Лею, сестру разведчика Рина, держат у горного обелиска. От вашего решения зависит её жизнь.", "Lea, the scout Rin's sister, is held at the mountain obelisk. Her life depends on your choice."),
      target: wave?.anchor === "mountainRune" ? null : "mountainRune",
      steps: [
        [tr("Найти Лею у горного обелиска", "Find Lea at the mountain obelisk"), +!!fate.lea, 1],
        [tr("Зажечь горный обелиск", "Light the mountain obelisk"), +!!save.flags.mountainRune, 1],
      ],
    },
    {
      title: tr("Страж перевала", "The pass watcher"),
      desc: fate.lea === "dead"
        ? tr("Рин уже знает, что его сестра мертва. Что вы ему скажете?", "Rin already knows his sister is dead. What will you tell him?")
        : tr("Рин ждёт вестей о сестре в Высоком Ключе.", "Rin waits for news of his sister in Highspring."),
      target: "scout",
      steps: [[tr("Поговорить с Рином", "Speak to Rin"), 0, 1]],
    },
    {
      title: tr("Сердце забытой долины", "Heart of the forgotten valley"),
      desc: tr("В руинах на юго-востоке Сердце долины стережёт каменный страж Ардана. Он спросит, чей свет вы несёте.", "In the south-eastern ruins Ardan's stone Warden guards the Heart of the valley. It will ask whose light you carry."),
      target: "altar",
      steps: [
        [tr("Ответить стражу", "Answer the Warden"), +!!save.flags.bossAwake, 1],
        [tr("Пройти стража — мечом или словом", "Get past the Warden — by sword or word"), +!!save.flags.bossDefeated, 1],
      ],
    },
    {
      title: tr("Правда Оливера", "Oliver's truth"),
      desc: fate.ivva === "captured"
        ? tr("Вернитесь к Оливеру. Пленная жрица Ивва ждёт вашего суда.", "Return to Oliver. The captive priestess Ivva awaits your judgement.")
        : tr("Вернитесь к Оливеру: пора узнать, что на самом деле спит под долиной.", "Return to Oliver: it is time to learn what truly sleeps beneath the valley."),
      target: "elder",
      steps: [[tr("Поговорить с Оливером", "Speak to Oliver"), 0, 1]],
    },
    {
      title: tr("Четыре печати глубин", "Four depth seals"),
      desc: tr(
        "Победите владык четырёх подземелий. Три первые печати откроют Штормовую цитадель.",
        "Defeat all four dungeon lords. The first three seals unlock the Storm Citadel.",
      ),
      target: allSeals(save) ? "elder" : null,
      steps: [
        ...[
          ["crypt", "Костяной король", "Bone King"],
          ["mine", "Ледяной тиран", "Frost Tyrant"],
          ["abyss", "Матка глубин", "Brood Queen"],
          ["citadel", "Повелитель бури", "Storm Lord"],
        ].map(([id, ru, en]) => [tr(ru, en), +!!save.flags["seal-" + id], 1]),
        [
          tr("Рассказать Оливеру о печатях", "Tell Oliver about the seals"),
          0,
          1,
        ],
      ],
    },
    {
      title: tr("Голос за печатями", "The voice beyond the seals"),
      desc: tr(
        "Печати были замками. Нерей Бессветный пробуждается, а три его вестника несут осколки затмения. Отнимите осколки.",
        "The seals were locks. Nerei the Lightless is waking, and his three heralds carry eclipse shards. Take the shards.",
      ),
      target: null,
      steps: heralds.map((h) => [
        label(h.name),
        +!!save.flags["shard-" + h.shard],
        1,
      ]),
    },
    {
      title: tr("Разлом в Сердце долины", "The rift in the Heart"),
      desc: tr(
        "Осколки откроют разлом над Сердцем долины. Нерей сильнее любого владыки глубин: его затмение гасит свет — ищите светлые круги.",
        "The shards open the rift above the Heart of the valley. Nerei is stronger than any dungeon lord: his eclipse swallows light — seek the circles of light.",
      ),
      target: "altar",
      steps: [
        [
          tr("Открыть разлом осколками", "Open the rift with the shards"),
          +!!save.flags.eclipseAwake,
          1,
        ],
        [
          tr("Победить Нерея Бессветного", "Defeat Nerei the Lightless"),
          +!!save.flags.eclipseDefeated,
          1,
        ],
      ],
    },
    {
      title: tr("Рассвет Эльдерии", "Dawn of Elderia"),
      desc: tr(
        "Нерей повержен. Вернитесь к Оливеру и решите, что станет с осколками — и с долиной.",
        "Nerei has fallen. Return to Oliver and decide what becomes of the shards — and of the valley.",
      ),
      target: "elder",
      steps: [[tr("Поговорить с Оливером", "Speak to Oliver"), 0, 1]],
    },
    {
      title: tr("Хроники продолжаются", "The chronicles continue"),
      desc: tr(
        "История завершена, но долина хранит тайны: сундуки, испытания подземелий и далёкие земли.",
        "The story is complete, but the valley keeps its secrets: chests, dungeon challenges and distant lands.",
      ),
      target: null,
      steps: [
        [
          tr("Найти все сундуки", "Find every chest"),
          save.collected.filter((id) => id.startsWith("chest")).length,
          CHEST_COUNT,
        ],
        [
          tr("Открыть все земли", "Discover every land"),
          save.discovered.length,
          21,
        ],
        [
          tr("7 побед в каждом подземелье", "7 clears of every dungeon"),
          ["crypt", "mine", "abyss", "citadel"].filter(
            (id) => (save.dungeonClears[id] || 0) >= 7,
          ).length,
          4,
        ],
      ],
    },
  ];
  return q[save.quest];
}
export const allSeals = (save) =>
  ["crypt", "mine", "abyss", "citadel"].every((id) => save.flags["seal-" + id]);
export const FINAL_QUEST = 11;
export function objectiveTarget(game) {
  const s = game.save,
    q = questInfo(s);
  if (s.activeDungeon) {
    return (
      game.activeLoot[0] ||
      game.enemies.find((e) => e.hp > 0 && e.guard) ||
      game.enemies.find((e) => e.hp > 0 && !e.summoned) ||
      game.world.objects.find((o) => o.type === "stairs")
    );
  }
  if (s.quest === 7) {
    const id = ["crypt", "mine", "abyss", "citadel"].find(
      (id) => !s.flags["seal-" + id],
    );
    if (id) return landmarks.find((o) => o.dungeon === id);
  }
  if (s.quest === 8) {
    const herald = game.enemies
      .filter((e) => e.type === "herald" && e.hp > 0)
      .sort(
        (a, b) =>
          Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y),
      )[0];
    if (herald) return herald;
  }
  if (s.quest === 9 && s.flags.eclipseAwake) {
    const boss = game.enemies.find((e) => e.type === "eclipse" && e.hp > 0);
    if (boss) return boss;
    if (game.activeLoot[0]) return game.activeLoot[0];
  }
  if (s.quest === 10 && game.activeLoot[0]) return game.activeLoot[0];
  if (q.target) return landmarks.find((o) => o.id === q.target);
  if (s.story?.wave)
    return game.enemies
      .filter((e) => e.storyWave === s.story.wave.tag && e.hp > 0)
      .sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y))[0];
  return null;
}
// Obelisks answer only at their chapter of the story.
export function canActivate(save, id) {
  return (id === "forestRune" && save.quest === 1) || (id === "mountainRune" && save.quest === 3);
}

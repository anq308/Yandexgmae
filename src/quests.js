import { landmarks } from "./world.js";
export const CHEST_COUNT = landmarks.filter((o) => o.type === "chest").length;
import { tr } from "./i18n.js";
export const countGathered = (save, type) =>
  save.collected.filter((id) => id.startsWith(type)).length;
export function questInfo(save) {
  const herbs = countGathered(save, "herb"),
    crystals = countGathered(save, "crystal");
  const q = [
    {
      title: tr("Добро пожаловать в долину", "Welcome to the valley"),
      desc: tr("Поговорите со старостой Оливером.", "Speak to Elder Oliver."),
      target: "elder",
      steps: [
        [tr("Найти старосту в деревне", "Find the elder in the village"), 0, 1],
      ],
    },
    {
      title: tr("Шёпот лесного обелиска", "Whisper of the forest"),
      desc: tr(
        "Помогите лесу и зажгите древний обелиск.",
        "Help the forest and awaken its ancient obelisk.",
      ),
      target: save.kills.slime >= 5 && herbs >= 3 ? "forestRune" : null,
      steps: [
        [
          tr("Победить лесных слизней", "Defeat woodland slimes"),
          save.kills.slime,
          5,
        ],
        [tr("Собрать лунную траву", "Gather moonleaf"), herbs, 3],
        [
          tr("Активировать лесной обелиск", "Activate the forest obelisk"),
          +!!save.flags.forestRune,
          1,
        ],
      ],
    },
    {
      title: tr("Весть для старосты", "News for the elder"),
      desc: tr(
        "Расскажите Оливеру о пробуждении обелиска.",
        "Tell Oliver that the obelisk has awakened.",
      ),
      target: "elder",
      steps: [[tr("Вернуться к Оливеру", "Return to Oliver"), 0, 1]],
    },
    {
      title: tr("Свет серебряных вершин", "Light of the Silver Peaks"),
      desc: tr(
        "Восстановите обелиск высоко в горах.",
        "Restore the obelisk high in the mountains.",
      ),
      target: save.kills.golem >= 3 && crystals >= 3 ? "mountainRune" : null,
      steps: [
        [
          tr("Победить каменных големов", "Defeat stone golems"),
          save.kills.golem,
          3,
        ],
        [tr("Собрать кристаллы света", "Gather glowing crystals"), crystals, 3],
        [
          tr("Активировать горный обелиск", "Activate the mountain obelisk"),
          +!!save.flags.mountainRune,
          1,
        ],
      ],
    },
    {
      title: tr("Страж перевала", "The pass watcher"),
      desc: tr(
        "Найдите Рина в деревне Высокий Ключ.",
        "Find Rin in Highspring Village.",
      ),
      target: "scout",
      steps: [[tr("Поговорить с Рином", "Speak to Rin"), 0, 1]],
    },
    {
      title: tr("Сердце забытой долины", "Heart of the forgotten valley"),
      desc: tr(
        "Идите к руинам на юго-востоке. Разбудите хранителя.",
        "Go to the southeastern ruins. Awaken the guardian.",
      ),
      target: "altar",
      steps: [
        [
          tr("Найти Сердце долины", "Find the Heart of the valley"),
          +!!save.flags.bossAwake,
          1,
        ],
        [
          tr("Победить древнего хранителя", "Defeat the ancient guardian"),
          +!!save.flags.bossDefeated,
          1,
        ],
      ],
    },
    {
      title: tr("Возвращение героя", "The hero returns"),
      desc: tr(
        "Вернитесь к Оливеру за последней наградой.",
        "Return to Oliver for your final reward.",
      ),
      target: "elder",
      steps: [[tr("Поговорить с Оливером", "Speak to Oliver"), 0, 1]],
    },
    {
      title: tr("Четыре печати глубин", "Four depth seals"),
      desc: tr(
        "Победите владык четырёх подземелий. Три первые печати откроют Штормовую цитадель.",
        "Defeat all four dungeon lords. The first three seals unlock the Storm Citadel.",
      ),
      target: null,
      steps: [
        ...[
          ["crypt", "Король костей", "Bone King"],
          ["mine", "Ледяной тиран", "Frost Tyrant"],
          ["abyss", "Королева выводка", "Brood Queen"],
          ["citadel", "Владыка шторма", "Storm Lord"],
        ].map(([id, ru, en]) => [tr(ru, en), +!!save.flags["seal-" + id], 1]),
        [
          tr("Найти все сундуки", "Find every chest"),
          save.collected.filter((id) => id.startsWith("chest")).length,
          CHEST_COUNT,
        ],
      ],
    },
  ];
  return q[save.quest];
}
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
  if (q.target) return landmarks.find((o) => o.id === q.target);
  if (s.quest === 1) {
    if (s.kills.slime < 5)
      return game.enemies.find((e) => e.type === "slime" && e.hp > 0);
    return game.world.objects.find(
      (o) => o.type === "herb" && !game.collected.has(o.id),
    );
  }
  if (s.quest === 3) {
    if (s.kills.golem < 3)
      return game.enemies.find((e) => e.type === "golem" && e.hp > 0);
    return game.world.objects.find(
      (o) => o.type === "crystal" && !game.collected.has(o.id),
    );
  }
  return null;
}
export function canActivate(save, id) {
  if (id === "forestRune")
    return (
      save.quest === 1 &&
      save.kills.slime >= 5 &&
      countGathered(save, "herb") >= 3
    );
  if (id === "mountainRune")
    return (
      save.quest === 3 &&
      save.kills.golem >= 3 &&
      countGathered(save, "crystal") >= 3
    );
  return false;
}

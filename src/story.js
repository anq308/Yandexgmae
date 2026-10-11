import { tr, label, classes } from "./i18n.js";
import { races } from "./races.js";
import { landmarks } from "./world.js";
import { makeEnemy } from "./battle.js";
import { walkableNear } from "./eclipse.js";
// The branching main story. Every scene is a conversation whose answers change who lives,
// who stands beside the hero, how strong the bosses are and which ending the valley gets.
// The hero's class and race unlock their own answers ([Маг], [Некромант], [Орк] …).

export function storyOf(s) {
  s.story ??= {};
  const st = s.story;
  st.dawn ??= 0;
  st.dusk ??= 0;
  st.trust ??= 0;
  st.knows ??= {};
  st.fate ??= {};
  st.seen ??= [];
  st.log ??= [];
  st.mods ??= {};
  return st;
}
const L = (ru, en) => [ru, en];
const said = (st, key) => st.seen.includes(key);
// People the hero talks to outside the village.
const voices = {
  ardan: { name: L("Голос Ардана", "Voice of Ardan"), role: L("Эхо первого хранителя", "Echo of the first guardian"), style: "paladin" },
  ivva: { name: L("Жрица Ивва", "Priestess Ivva"), role: L("Пепельный культ", "The Ashen cult"), style: "necromancer" },
  guardian: { name: L("Страж Ардана", "Ardan's Warden"), role: L("Каменный страж Сердца", "Stone keeper of the Heart"), style: "warrior" },
  nerei: { name: L("Нерей Бессветный", "Nerei the Lightless"), role: L("Узник под долиной", "Prisoner beneath the valley"), style: "necromancer" },
};
const npc = (id) => landmarks.find((o) => o.id === id);
// Opening words depend on who the hero is.
const classOpening = {
  warrior: L("Рыбаки говорят, ты сжимал рукоять меча так, что пальцы пришлось разжимать по одному.", "The fishermen say you gripped your sword so hard they had to pry your fingers loose one by one."),
  ranger: L("Странно: следы вели к берегу из леса, а не с моря. Ты пришёл сам — и ничего не помнишь?", "Strange: the tracks led to the shore from the woods, not the sea. You walked here yourself — and remember nothing?"),
  mage: L("Вокруг тебя на песке плавились ракушки. Магия сочилась из тебя, как вода из треснувшего кувшина.", "Shells were melting in the sand around you. Magic leaked from you like water from a cracked jug."),
  paladin: L("На твоём щите — солнце Ордена Рассвета. Орден пал сто лет назад. Откуда же ты?", "Your shield bears the sun of the Order of Dawn. The Order fell a hundred years ago. So where are you from?"),
  monk: L("Ты медитировал на берегу, пока тебя не нашли. Три дня. Без еды. И даже не обернулся, когда рыбаки окликнули.", "You were meditating on the shore when they found you. Three days. Without food. You didn't even turn when the fishermen called."),
  engineer: L("Рядом с тобой лежали обломки странного летающего аппарата. Кузнец Брам до сих пор не может понять, как он держался в воздухе.", "The wreck of a strange flying machine lay beside you. Bram the smith still can't work out how it stayed in the air."),
  summoner: L("Тебя нашли в окружении волков — они сторожили тебя три ночи и ушли, когда пришли рыбаки.", "You were found surrounded by wolves — they guarded you for three nights and left when the fishermen came."),
  shapeshifter: L("Рыбак клянётся, что сначала увидел на берегу раненого волка, а потом — тебя. На том же месте.", "A fisherman swears he first saw a wounded wolf on the shore, and then you. In the very same spot."),
  necromancer: L("Рыбаки хотели тебя сжечь: вокруг лежали мёртвые чайки, и они… шевелились. Я не позволил.", "The fishermen wanted to burn you: dead gulls lay all around, and they… moved. I didn't allow it."),
};
const raceOpening = {
  orc: L(" Люди косятся на твои клыки — дай им время.", " People stare at your tusks — give them time."),
  undead: L(" Дети прячутся, когда ты проходишь мимо. Мёртвые не должны ходить, говорят они. Но ты ходишь.", " Children hide when you pass. The dead shouldn't walk, they say. Yet you do."),
  elf: L(" Эльфы не приходили в долину со времён Ардана.", " No elf has come to the valley since Ardan's time."),
  dwarf: L(" Гномы редко покидают горы. Значит, тебя гнало что-то сильнее привычки.", " Dwarves rarely leave the mountains. Something stronger than habit drove you here."),
};
const fateText = {
  lea: { saved: L("Лея жива и вернулась к брату.", "Lea lives and is back with her brother."), wounded: L("Лея выжила, но шрам от чёрного ножа останется навсегда.", "Lea survived, but the black knife's scar will stay forever."), dead: L("Лея погибла на алтаре Пепельных — по вашей сделке.", "Lea died on the Ashen altar — by your bargain.") },
  ivva: { fled: L("Ивва бежала в тень и продолжает проповедовать.", "Ivva fled into the shadows and still preaches."), dead: L("Ивва мертва.", "Ivva is dead."), redeemed: L("Ивва отреклась от культа и помогает долине.", "Ivva renounced the cult and helps the valley."), pact: L("Ивва связана с вами сделкой и служит Нерею.", "Ivva is bound to you by a pact and serves Nerei."), captured: L("Ивва в плену у старосты.", "Ivva is the elder's prisoner."), exiled: L("Ивву изгнали из долины.", "Ivva was exiled from the valley.") },
  rin: { ally: L("Рин поклялся встать рядом с вами в последней битве.", "Rin swore to stand beside you in the final battle."), home: L("Рин остался с сестрой и охраняет перевал.", "Rin stayed with his sister and guards the pass."), enemy: L("Рин ушёл к Пепельным, чтобы отомстить вам.", "Rin joined the Ashen to take revenge on you."), deceived: L("Рин верит вашей лжи и сражается за вас.", "Rin believes your lie and fights for you."), broken: L("Рин ушёл из долины, не простив вас.", "Rin left the valley without forgiving you.") },
  guardian: { spared: L("Страж Ардана уснул в мире и благословил вас.", "Ardan's Warden fell asleep in peace and blessed you."), slain: L("Страж Ардана пал в бою.", "Ardan's Warden fell in battle.") },
};
export function fateLines(s) {
  const st = storyOf(s),
    out = [];
  for (const who of ["lea", "ivva", "rin", "guardian"]) if (st.fate[who]) out.push(label(fateText[who][st.fate[who]]));
  if (st.knows.secretKept) out.push(tr("Тайна Оливера осталась тайной.", "Oliver's secret stayed a secret."));
  if (st.knows.villageKnows) out.push(tr("Деревня знает правду о том, что спит под долиной.", "The village knows what sleeps beneath the valley."));
  return out;
}
export function storyLog(s) {
  return storyOf(s).log.map((e) => label(e));
}
// Scenes. text(s, st) builds the speech; choices are filtered by class, race and knowledge.
export const scenes = {
  prologue: {
    speaker: () => npc("elder"),
    nodes: {
      start: {
        text: (s) =>
          tr("Очнулся? Хвала свету. Три дня назад тебя нашли на берегу — без памяти, только с этим знаком на ладони. ", "Awake? Thank the light. Three days ago you were found on the shore — no memory, only this mark on your palm. ") +
          label(classOpening[s.characterClass]) +
          label(raceOpening[s.race] || L("", "")) +
          tr(" Это Знак Рассвета, знак Ардана, первого хранителя. С тех пор как ты здесь, обелиски гаснут, а по ночам из леса выходят твари. Долина позвала тебя не случайно.", " It is the Mark of Dawn, the mark of Ardan, the first guardian. Since you came, the obelisks fade and beasts walk out of the woods at night. The valley did not call you by chance."),
        choices: [
          { id: "accept", primary: true, text: L("Я помогу долине.", "I will help the valley."), run: (c) => c.startQuest(L("Вы обещали Оливеру помочь долине.", "You promised Oliver to help the valley.")) },
          { id: "mark", text: L("Что это за знак на моей ладони?", "What is this mark on my palm?"), answer: L("Знак Рассвета выбирает сам. Ардан говорил, что знак откликается на обелиски — коснись лесного, и он вспыхнет. Тогда ты поймёшь больше, чем могу рассказать я.", "The Mark of Dawn chooses for itself. Ardan said it answers the obelisks — touch the forest one and it will flare. Then you will understand more than I can tell you.") },
          { id: "obelisks", text: L("Почему гаснут обелиски?", "Why are the obelisks fading?"), answer: L("Два обелиска держат свет долины, как свечи в окне. Лесной — к северу, в Шепчущем лесу. Горный — у Высокого Ключа. Когда они гаснут, просыпается то, что спит под землёй.", "Two obelisks hold the valley's light like candles in a window. The forest one lies north in the Whispering Woods, the mountain one above Highspring. When they fade, what sleeps below wakes.") },
          { id: "trust", text: L("Почему я должен вам верить?", "Why should I trust you?"), answer: L("Ты и не должен. Посмотри на ладонь, когда подойдёшь к обелиску. Если я ошибся — уйдёшь с нашим хлебом. Если нет… долина обретёт хранителя.", "You needn't. Look at your palm when you reach the obelisk. If I'm wrong, you leave with our bread. If not… the valley gains a guardian.") },
          { id: "w", cls: ["warrior"], text: L("Покажи, кого бить. Остальное — потом.", "Show me what to hit. The rest can wait."), run: (c) => { c.st.trust += 1; return c.startQuest(L("Вы пришли как меч долины, без лишних вопросов.", "You came as the valley's sword, asking nothing.")); } },
          { id: "m", cls: ["mage"], text: L("Этот знак — не дар, а замок. Я чувствую в нём чужую волю.", "This mark is not a gift but a lock. I can feel someone else's will in it."), run: (c) => { c.st.knows.seal = true; c.st.trust -= 1; return c.startQuest(L("Вы почуяли, что Знак — это печать. Оливер отвёл глаза.", "You sensed the Mark is a seal. Oliver looked away.")); } },
          { id: "r", cls: ["ranger"], text: L("Я пришёл из леса. Кто ещё ходит там по ночам?", "I came out of the woods. Who else walks there at night?"), answer: L("…Люди в серых плащах. Пепельные. Они поклоняются тому, кто под землёй, и считают Знак проклятием. Береги ладонь, следопыт.", "…People in grey cloaks. The Ashen. They worship what lies underground and call the Mark a curse. Guard your palm, ranger."), run: (c) => { c.st.knows.cult = true; } },
          { id: "p", cls: ["paladin"], text: L("Клянусь светом Рассвета защищать долину.", "I swear by the light of Dawn to protect the valley."), run: (c) => { c.st.dawn += 1; c.st.trust += 1; c.s.inventory.potion += 2; return c.startQuest(L("Вы принесли клятву Рассвета. Оливер дал вам два зелья.", "You swore the oath of Dawn. Oliver gave you two potions.")); } },
          { id: "n", cls: ["necromancer"], text: L("Мёртвые на берегу шептали мне одно имя — Нерей.", "The dead on the shore whispered one name to me — Nerei."), run: (c) => { c.st.knows.name = true; c.st.trust -= 1; c.st.dusk += 1; return c.startQuest(L("Вы произнесли имя Нерея. Оливер побледнел и велел никогда не повторять его.", "You spoke Nerei's name. Oliver went pale and told you never to say it again.")); } },
          { id: "o", race: ["orc"], text: L("Ваши люди смотрят на меня как на зверя.", "Your people look at me like a beast."), answer: L("Люди боятся того, чего не знают. Помоги им — и через месяц они будут рассказывать детям про орка, который спас долину.", "People fear what they don't know. Help them, and in a month they'll tell their children about the orc who saved the valley.") },
          { id: "u", race: ["undead"], text: L("Я мёртв. Почему Знак выбрал мертвеца?", "I am dead. Why would the Mark choose a corpse?"), answer: L("…Ардан говорил, что Знак ищет того, кто стоит на границе света и тьмы. Может быть, никто не стоит на ней ближе тебя.", "…Ardan said the Mark seeks one who stands on the border of light and dark. Perhaps no one stands closer to it than you."), run: (c) => { c.st.knows.border = true; } },
        ],
      },
    },
  },
  forest: {
    speaker: () => voices.ardan,
    nodes: {
      start: {
        text: () => tr("Знак на ладони вспыхивает, и из трещины в камне поднимается полупрозрачная фигура в латах. «Обелиск треснул, знаконосец. Из раны сочится серая скверна — и в ней цепь, уходящая под землю. Восстанови свет. Или… сделай то, что сделал бы он».", "The mark flares and a translucent armoured figure rises from the crack. “The obelisk is cracked, mark-bearer. Grey blight seeps from the wound — and in it a chain that runs underground. Restore the light. Or… do what he would have done.”"),
        choices: [
          { id: "runes", cls: ["mage"], race: ["elf"], text: L("Прочитать руны на камне.", "Read the runes on the stone."), answer: L("Руны говорят не «свети», а «держи». Это не маяк — это замок. Цепь тянется на юго-восток, к Сердцу долины, и на другом её конце кто-то живой. Очень злой. Очень одинокий.", "The runes do not say “shine” but “hold”. This is no beacon — it is a lock. The chain runs south-east to the Heart of the valley, and someone alive is at its other end. Very angry. Very lonely."), run: (c) => { c.st.knows.truth = true; c.log(L("Вы прочли руны: обелиски — замки на темнице.", "You read the runes: the obelisks are prison locks.")); } },
          { id: "dead", cls: ["necromancer"], race: ["undead"], text: L("Спросить мёртвого стража у подножия.", "Question the dead sentry at its foot."), answer: L("Кости скрипят: «Ардан запер брата не за тьму. Нерей нашёл способ вернуть умерших. Ардан увидел, что приходит с той стороны, — и испугался. Мы держали цепь. Мы умерли, держа её»", "The bones creak: “Ardan did not lock his brother away for darkness. Nerei found a way to bring back the dead. Ardan saw what came through — and was afraid. We held the chain. We died holding it.”"), run: (c) => { c.st.knows.betrayal = true; c.log(L("Мёртвый страж рассказал: Нерей хотел вернуть мёртвых.", "The dead sentry told you: Nerei wished to bring back the dead.")); } },
          { id: "tracks", cls: ["ranger"], text: L("Осмотреть землю вокруг обелиска.", "Examine the ground around the obelisk."), answer: L("Свежие следы босых ног и серый пепел. Кто-то приходил сюда до вас и долбил камень. Пепельные не ждут, пока обелиск погаснет сам, — они ему помогают.", "Fresh barefoot prints and grey ash. Someone came before you and chipped at the stone. The Ashen don't wait for the obelisk to fade — they help it."), run: (c) => { c.st.knows.cult = true; } },
          { id: "light", primary: true, text: L("Восстановить свет.", "Restore the light."), run: (c) => { c.st.dawn += 1; c.log(L("Вы вернули свет лесному обелиску.", "You restored the forest obelisk's light.")); c.wave("forest", "forestRune", [["slime", 4], ["wisp", 1]]); } },
          { id: "pray", cls: ["paladin"], text: L("Помолиться и выжечь скверну светом.", "Pray and burn out the blight with light."), run: (c) => { c.st.dawn += 2; c.log(L("Молитва паладина ослабила скверну.", "The paladin's prayer weakened the blight.")); c.wave("forest", "forestRune", [["slime", 2]]); } },
          { id: "root", cls: ["warrior"], race: ["orc", "dwarf"], text: L("Вырвать гнилой корень голыми руками.", "Tear out the rotten root with bare hands."), run: (c) => { c.st.dawn += 1; c.s.hp = Math.max(1, Math.round(c.s.hp * 0.7)); c.log(L("Вы вырвали корень скверны руками и обожглись.", "You tore out the blight's root by hand and got burned.")); c.wave("forest", "forestRune", [["slime", 2], ["wisp", 1]]); } },
          { id: "drink", text: L("Выпить силу обелиска.", "Drink the obelisk's power."), run: (c) => { c.st.dusk += 2; c.s.flags.obeliskPower = true; c.log(L("Вы выпили силу обелиска: +5% урона навсегда. Призрак Ардана отвернулся.", "You drank the obelisk's power: +5% damage forever. Ardan's ghost turned away.")); c.wave("forest", "forestRune", [["slime", 4], ["wisp", 2]]); } },
        ],
      },
    },
  },
  oliver2: {
    speaker: () => npc("elder"),
    nodes: {
      start: {
        text: (s, st) =>
          (s.flags.obeliskPower
            ? tr("Постой. Твои глаза… они серые, как пепел. Ты пил из обелиска? Ардан говорил, что так начинал его брат. ", "Wait. Your eyes… they're grey as ash. You drank from the obelisk? Ardan said that's how his brother began. ")
            : tr("Лес вздохнул — я почувствовал это даже здесь. ", "The woods breathed again — I felt it even here. ")) +
          (st.knows.truth || st.knows.betrayal || st.knows.name
            ? tr("Но по лицу вижу: ты узнал там больше, чем я хотел бы.", "But I can see in your face: you learned more there than I'd like.")
            : tr("Спасибо тебе, хранитель.", "Thank you, guardian.")),
        choices: [
          { id: "confront", text: L("Обелиски — замки. Кого вы держите под долиной?", "The obelisks are locks. Who are you keeping beneath the valley?"), tag: L("Знание", "Knowledge"), need: (s, st) => st.knows.truth || st.knows.betrayal || st.knows.name || st.knows.seal, run: () => "confess" },
          { id: "next", primary: true, text: L("Что дальше?", "What now?"), run: () => "news" },
        ],
      },
      confess: {
        text: () => tr("…Нерей. Брат Ардана. Мой род сто лет стережёт эту тайну: я последний. Если люди узнают, что под их домами спит бессмертный, они разбегутся — или пойдут к Пепельным. Прошу тебя: никому ни слова.", "…Nerei. Ardan's brother. My family has guarded this secret for a hundred years; I am the last. If people learn an immortal sleeps beneath their homes, they'll flee — or join the Ashen. I beg you: not a word to anyone."),
        choices: [
          { id: "keep", primary: true, text: L("Я сохраню тайну.", "I will keep the secret."), run: (c) => { c.st.trust += 1; c.st.knows.secretKept = true; c.log(L("Вы обещали хранить тайну Оливера.", "You promised to keep Oliver's secret.")); return "news"; } },
          { id: "tell", text: L("Люди имеют право знать, что спит под ними.", "People have a right to know what sleeps beneath them."), run: (c) => { c.st.trust -= 1; c.st.knows.villageKnows = true; c.log(L("Вы рассказали деревне правду. Люди напуганы, но больше не слепы.", "You told the village the truth. People are afraid but no longer blind.")); return "news"; } },
          { id: "threat", cls: ["warrior"], race: ["orc"], text: L("Солжёшь мне ещё раз — и я уйду. Пусть Нерей сам вас будит.", "Lie to me once more and I leave. Let Nerei wake you himself."), run: (c) => { c.st.trust -= 1; c.log(L("Вы пригрозили Оливеру. Он больше не лжёт — но и не доверяет.", "You threatened Oliver. He lies no more — nor trusts you.")); return "news"; } },
        ],
      },
      news: {
        text: (s, st) => tr(`Плохие вести с перевала. Лея, сестра разведчика Рина, пропала у горного обелиска. Пастухи видели серые плащи — Пепельных.${st.knows.cult ? " Ты был прав: они ходят по лесу и подтачивают обелиски." : ""} Если они прольют её кровь на камень, второй замок треснет. Иди к Высокому Ключу, пока не поздно.`, `Bad news from the pass. Lea, sister of the scout Rin, vanished at the mountain obelisk. Shepherds saw grey cloaks — the Ashen.${st.knows.cult ? " You were right: they roam the woods and gnaw at the obelisks." : ""} If they spill her blood on the stone, the second lock will crack. Go to Highspring before it's too late.`),
        choices: [
          { id: "gold", primary: true, text: L("Я пойду. (Взять награду · 80 монет)", "I'll go. (Take the reward · 80 coins)"), run: (c) => { c.s.gold += 80; c.g.addXp(70); return c.setQuest(3); } },
          { id: "give", text: L("Оставьте золото семье Леи. (+1 очко навыка)", "Give the gold to Lea's family. (+1 skill point)"), run: (c) => { c.s.skillPoints += 1; c.s.flags.generous = true; c.st.dawn += 1; c.st.trust += 1; c.g.addXp(70); c.log(L("Вы отдали награду семье пропавшей девушки.", "You gave the reward to the missing girl's family.")); return c.setQuest(3); } },
        ],
      },
    },
  },
  ivva: {
    speaker: () => voices.ivva,
    nodes: {
      start: {
        text: () => tr("У обелиска на коленях стоит связанная девушка — Лея. Над ней жрица в сером плаще с ножом из чёрного стекла. «Знаконосец. Пришёл зажечь ещё одну свечу на могиле живого? Её кровь ослабит замок. Нерей не чудовище: его заперли за то, что он хотел вернуть нам мёртвых. Твой Ардан был тюремщиком. Уйди — и я расскажу тебе всё».", "A bound girl kneels by the obelisk — Lea. Over her stands a priestess in a grey cloak with a black-glass knife. “Mark-bearer. Come to light another candle on a living man's grave? Her blood will weaken the lock. Nerei is no monster: he was imprisoned for wanting to give us back our dead. Your Ardan was a jailer. Walk away — and I'll tell you everything.”"),
        choices: [
          { id: "fight", primary: true, text: L("Отпусти её — или умрёшь.", "Let her go — or die."), run: (c) => { c.st.dawn += 1; c.st.fate.lea = "saved"; c.st.fate.ivva = "fled"; c.log(L("Вы отбили Лею у Пепельных. Ивва бежала.", "You fought the Ashen for Lea. Ivva fled.")); c.wave("mountain", "mountainRune", [["bandit", 3], ["shaman", 1]]); } },
          { id: "deal", text: L("Сделка: правда о Нерее — и я уйду.", "A bargain: the truth about Nerei — and I walk away."), run: (c) => { c.st.dusk += 3; c.st.knows.truth = c.st.knows.betrayal = true; c.st.fate.lea = "dead"; c.st.fate.ivva = "pact"; c.log(L("Вы заключили сделку с Иввой. Лея погибла.", "You made a pact with Ivva. Lea died.")); c.light("mountainRune"); return "afterDeal"; } },
          { id: "truth", tag: L("Правда об Ардане", "Truth about Ardan"), need: (s, st) => st.knows.betrayal || st.knows.truth, text: L("Я знаю, за что заперли Нерея. Но смерть Леи никого не вернёт.", "I know why Nerei was imprisoned. But Lea's death won't bring anyone back."), run: (c) => { c.st.dawn += 1; c.st.knows.truth = c.st.knows.betrayal = true; c.st.fate.lea = "saved"; c.st.fate.ivva = "redeemed"; c.log(L("Вы убедили Ивву опустить нож. Она отреклась от культа.", "You convinced Ivva to lower the knife. She renounced the cult.")); c.light("mountainRune"); return "redeemed"; } },
          { id: "forgive", cls: ["paladin"], need: (s, st) => st.dawn >= 1, text: L("Свет прощает и тебя, сестра. Опусти нож.", "The light forgives you too, sister. Lower the knife."), run: (c) => { c.st.dawn += 1; c.st.fate.lea = "saved"; c.st.fate.ivva = "redeemed"; c.log(L("Паладин простил Ивву. Она отреклась от культа.", "The paladin forgave Ivva. She renounced the cult.")); c.light("mountainRune"); return "redeemed"; } },
          { id: "dispel", cls: ["mage"], text: L("Развеять ритуал одним словом.", "Unravel the ritual with a single word."), run: (c) => { c.st.fate.lea = "saved"; c.st.fate.ivva = "fled"; c.log(L("Вы развеяли ритуал. Ивва бежала, оставив культистов.", "You unravelled the ritual. Ivva fled, leaving her cultists.")); c.wave("mountain", "mountainRune", [["bandit", 2]]); } },
          { id: "raise", cls: ["necromancer"], text: L("Мёртвые у этого камня слушают меня, а не тебя.", "The dead at this stone obey me, not you."), run: (c) => { c.st.dusk += 1; c.st.fate.lea = "saved"; c.st.fate.ivva = "dead"; c.log(L("Ваши мертвецы разорвали Ивву. Лея видела всё.", "Your dead tore Ivva apart. Lea saw everything.")); c.light("mountainRune"); return "raised"; } },
          { id: "shoot", cls: ["ranger"], text: L("(Выбить нож выстрелом.)", "(Shoot the knife out of her hand.)"), run: (c) => { c.st.fate.lea = "saved"; c.st.fate.ivva = "captured"; c.log(L("Выстрел выбил нож. Ивва в плену, культисты нападают.", "Your shot knocked the knife away. Ivva is captured, the cultists attack.")); c.wave("mountain", "mountainRune", [["bandit", 2]]); } },
          { id: "charge", cls: ["warrior"], race: ["orc"], text: L("(Броситься на неё.)", "(Charge her.)"), run: (c) => { c.st.fate.lea = "wounded"; c.st.fate.ivva = "dead"; c.log(L("Вы зарубили Ивву, но нож успел задеть Лею.", "You cut Ivva down, but her knife grazed Lea.")); c.wave("mountain", "mountainRune", [["bandit", 3]]); } },
        ],
      },
      afterDeal: {
        free: true,
        text: () => tr("Нож опускается. Лея затихает. Ивва шепчет: «Ардан запер брата, потому что испугался тех, кто вернулся с той стороны. Обелиски — его цепи, Сердце — замок. Принеси осколки затмения к Сердцу — и мир увидит, кто был прав». Обелиск вспыхивает — но свет его серый.", "The knife falls. Lea goes still. Ivva whispers: “Ardan imprisoned his brother because he feared those who returned from the other side. The obelisks are his chains, the Heart is the lock. Bring the eclipse shards to the Heart and the world will see who was right.” The obelisk flares — but its light is grey."),
        choices: [{ id: "go", primary: true, text: L("…Уйти.", "…Leave."), run: () => {} }],
      },
      redeemed: {
        free: true,
        text: () => tr("Ивва режет верёвки и отдаёт нож вам. «Я хотела вернуть сына. Нерей обещал. Может, обещал правду — но не такой ценой». Лея бежит к перевалу. Обелиск вспыхивает чистым золотом.", "Ivva cuts the ropes and hands you the knife. “I wanted my son back. Nerei promised. Maybe he promised truly — but not at this price.” Lea runs to the pass. The obelisk flares pure gold."),
        choices: [{ id: "go", primary: true, text: L("Иди с миром.", "Go in peace."), run: () => {} }],
      },
      raised: {
        free: true,
        text: () => tr("Из-под снега поднимаются кости и тянутся к жрице. Её крик обрывается. Лея смотрит на вас так, как смотрят на чудовище, — и всё же шепчет «спасибо». Обелиск загорается.", "Bones rise from the snow and reach for the priestess. Her scream is cut short. Lea looks at you the way one looks at a monster — and still whispers “thank you”. The obelisk ignites."),
        choices: [{ id: "go", primary: true, text: L("Идём, Лея.", "Come, Lea."), run: () => {} }],
      },
    },
  },
  rin: {
    speaker: () => npc("scout"),
    nodes: {
      start: {
        text: (s, st) =>
          st.fate.lea === "dead"
            ? tr("Её нашли у обелиска. Пастух говорит, ты стоял рядом с жрицей и не поднял оружие. Скажи мне, что он лжёт.", "They found her by the obelisk. A shepherd says you stood beside the priestess and never raised your weapon. Tell me he's lying.")
            : tr(`Ты вернул мне Лею${st.fate.lea === "wounded" ? " — живой, хоть и раненой" : ""}. Я в долгу, который не оплатить золотом. Но кое-что я могу: тропа к Сердцу долины идёт через мой перевал, и я знаю, как там пройти.`, `You brought Lea back to me${st.fate.lea === "wounded" ? " — alive, though wounded" : ""}. I owe you a debt gold can't pay. But I can do something: the trail to the Heart of the valley runs through my pass, and I know the way.`),
        choices: [
          { id: "oath", primary: true, need: (s, st) => st.fate.lea !== "dead", text: L("Береги её. А в последней битве мне понадобится твой лук.", "Look after her. And in the final battle I'll need your bow."), run: (c) => { c.st.fate.rin = "ally"; c.log(L("Рин поклялся сражаться рядом с вами.", "Rin swore to fight beside you.")); return c.rinReward(); } },
          { id: "stay", need: (s, st) => st.fate.lea !== "dead", text: L("Останься с сестрой. Это важнее любой битвы.", "Stay with your sister. That matters more than any battle."), run: (c) => { c.st.fate.rin = "home"; c.st.dawn += 1; c.log(L("Вы отпустили Рина к сестре.", "You sent Rin home to his sister.")); return c.rinReward(); } },
          { id: "truth", need: (s, st) => st.fate.lea === "dead", text: L("Это правда. Я выбрал знание. Мне жаль.", "It's true. I chose knowledge. I'm sorry."), run: (c) => { c.st.fate.rin = "enemy"; c.log(L("Вы признались Рину. Он ушёл к Пепельным.", "You confessed to Rin. He left to join the Ashen.")); return c.rinReward(true); } },
          { id: "lie", need: (s, st) => st.fate.lea === "dead", text: L("Ложь. Я не успел — жрица была быстрее.", "A lie. I was too late — the priestess was faster."), run: (c) => { c.st.fate.rin = "deceived"; c.st.dusk += 1; c.log(L("Вы солгали Рину. Он верит вам и пойдёт с вами в бой.", "You lied to Rin. He believes you and will fight beside you.")); return c.rinReward(); } },
          { id: "raise", cls: ["necromancer"], need: (s, st) => st.fate.lea === "dead", text: L("Я могу поднять её. На один вечер.", "I can raise her. For one evening."), run: (c) => { c.st.fate.rin = "broken"; c.st.dusk += 1; c.log(L("Вы подняли мёртвую Лею на один вечер. Рин ушёл из долины.", "You raised dead Lea for one evening. Rin left the valley.")); return c.rinReward(true); } },
        ],
      },
    },
  },
  guardian: {
    speaker: () => voices.guardian,
    nodes: {
      start: {
        text: () => tr("Каменный исполин поднимает голову. В глазницах вспыхивают кристаллы, и голос гремит так, что дрожит земля: «ЧЕЙ СВЕТ ТЫ НЕСЁШЬ?»", "The stone giant raises its head. Crystals flare in its sockets, and its voice shakes the ground: “WHOSE LIGHT DO YOU CARRY?”"),
        choices: [
          { id: "fight", primary: true, text: L("Свет Ардана. Отойди.", "Ardan's light. Stand aside."), run: (c) => c.awaken(1, 1, L("Вы бросили вызов стражу.", "You challenged the Warden.")) },
          { id: "spare", tag: L("Вся правда", "The whole truth"), need: (s, st) => st.knows.truth && st.knows.betrayal, text: L("Ардан ошибся, а ты сто лет стережёшь его страх. Отдохни.", "Ardan was wrong, and you've guarded his fear for a hundred years. Rest."), run: (c) => c.spare() },
          { id: "oath", cls: ["paladin"], need: (s, st) => st.dawn >= 2, text: L("Я тоже давал клятву Рассвету. Позволь мне её исполнить.", "I too swore an oath to Dawn. Let me fulfil it."), run: (c) => c.spare() },
          { id: "rest", cls: ["necromancer"], race: ["undead"], text: L("Ты давно мёртв. Я освобождаю тебя.", "You died long ago. I release you."), run: (c) => { c.st.dusk += 1; return c.awaken(0.7, 1, L("Ваша сила надломила стража: −30% здоровья.", "Your power cracked the Warden: −30% health.")); } },
          { id: "crack", cls: ["mage"], text: L("Я вижу трещину в твоей печати.", "I can see the crack in your seal."), run: (c) => c.awaken(0.8, 1, L("Вы расширили трещину в печати стража: −20% здоровья.", "You widened the crack in the Warden's seal: −20% health.")) },
          { id: "flank", cls: ["ranger"], text: L("(Тихо обойти и ударить в трещину.)", "(Slip around and strike the crack.)"), run: (c) => c.awaken(0.85, 1, L("Внезапная атака: страж ранен, −15% здоровья.", "Ambush: the Warden is wounded, −15% health.")) },
          { id: "duel", cls: ["warrior"], race: ["orc", "dwarf"], text: L("Сразимся честно. Один на один.", "Let us fight fairly. One on one."), run: (c) => { c.s.gold += 100; return c.awaken(0.9, 0.9, L("Страж принял честный бой и сдерживает удары.", "The Warden accepted a fair duel and holds back its blows.")); } },
          { id: "dusk", tag: L("Сумерки", "Dusk"), need: (s, st) => st.dusk >= 3, text: L("Тьма — тоже свет. Только уставший.", "Darkness is light too. Just tired."), run: (c) => { c.st.dusk += 1; c.st.mods.darkResonance = true; return c.awaken(1.3, 1.2, L("Страж в ярости (+30% здоровья), но тьма в вас откликнулась Нерею.", "The Warden is enraged (+30% health), but the dark in you resonated with Nerei.")); } },
        ],
      },
    },
  },
  seals: {
    speaker: () => npc("elder"),
    nodes: {
      start: {
        text: (s, st) =>
          (st.fate.guardian === "spared" ? tr("Страж уснул сам? За сто лет он не склонился ни перед кем. ", "The Warden lay down by itself? In a hundred years it never bowed to anyone. ") : tr("Хранитель пал. ", "The Warden has fallen. ")) +
          (st.trust <= -2
            ? tr("Я благодарен, но скажу прямо: я тебе не верю. Пепельные знают о тебе слишком много. Награды не будет — только правда. ", "I'm grateful, but I'll be blunt: I don't trust you. The Ashen know too much about you. There'll be no reward — only the truth. ")
            : "") +
          tr("Перед смертью Ардан запер брата под долиной четырьмя печатями глубин. Они слабеют. Пока они держатся, у нас есть время.", "Before he died, Ardan locked his brother beneath the valley with four depth seals. They're weakening. While they hold, we have time."),
        choices: [
          { id: "judge", need: (s, st) => st.fate.ivva === "captured" && !st.knows.judged, primary: true, text: L("Сначала решим, что делать с Иввой.", "First, let's decide what to do with Ivva."), run: () => "ivva" },
          { id: "finish", primary: true, need: (s, st) => st.fate.ivva !== "captured" || st.knows.judged, text: L("Я спущусь в глубины.", "I'll go into the depths."), run: (c) => c.finishAct() },
        ],
      },
      ivva: {
        text: () => tr("Жрица сидит в погребе. Она не просит пощады — только смотрит. Люди требуют казни. Решение за тобой, хранитель: ты поймал её, тебе и судить.", "The priestess sits in the cellar. She asks no mercy — only stares. The people want her executed. The choice is yours, guardian: you caught her, you judge her."),
        choices: [
          { id: "execute", text: L("Казнить.", "Execute her."), run: (c) => { c.st.dusk += 1; c.st.fate.ivva = "dead"; c.st.knows.judged = true; c.log(L("По вашему слову Ивву казнили.", "On your word Ivva was executed.")); return "start"; } },
          { id: "exile", text: L("Изгнать из долины.", "Exile her from the valley."), run: (c) => { c.st.fate.ivva = "exiled"; c.st.knows.judged = true; c.log(L("Ивву изгнали из долины.", "Ivva was exiled from the valley.")); return "start"; } },
          { id: "free", text: L("Отпустить под мою ответственность.", "Release her on my word."), run: (c) => { c.st.dawn += 1; c.st.trust -= 1; c.st.fate.ivva = "redeemed"; c.st.knows.truth = true; c.st.knows.judged = true; c.log(L("Вы поручились за Ивву. Она рассказала, что Сердце — главный замок.", "You vouched for Ivva. She told you the Heart is the main lock.")); return "start"; } },
        ],
      },
    },
  },
  nerei: {
    speaker: () => voices.nerei,
    nodes: {
      start: {
        text: (s, st) =>
          tr("Осколки вырываются из рук и впиваются в трещину. Из разлома поднимается тень в короне из чёрного света. «Брат запер меня за то, что я хотел вернуть мёртвых. Сто лет я слышал, как плачут живые над могилами, — и не мог помочь. ", "The shards tear from your hands into the crack. A shadow crowned in black light rises from the rift. “My brother imprisoned me for wanting to bring back the dead. For a hundred years I heard the living weep over graves — and could not help. ") +
          (st.fate.ivva === "pact" ? tr("Моя жрица говорит, ты умеешь торговаться. ", "My priestess says you know how to bargain. ") : "") +
          tr("А что сделаешь ты, носящий его знак?»", "And what will you do, bearer of his mark?”"),
        choices: [
          { id: "fight", primary: true, text: L("Ты останешься в темнице навсегда.", "You will stay imprisoned forever."), run: (c) => c.rift(1, 1, L("Вы отказали Нерею.", "You refused Nerei.")) },
          { id: "heard", tag: L("Правда об Ардане", "Truth about Ardan"), need: (s, st) => st.knows.betrayal, text: L("Я знаю правду. Ардан боялся. Но мёртвые должны спать — даже ради живых.", "I know the truth. Ardan was afraid. But the dead must sleep — even for the living."), run: (c) => { c.st.mods.nereiHeard = true; return c.rift(0.8, 1, L("Нерей услышал вас и сражается без ярости (−20% здоровья).", "Nerei heard you and fights without rage (−20% health).")); } },
          { id: "peace", cls: ["paladin"], text: L("Свет не мстит. Я дам тебе покой.", "Light does not take revenge. I will give you peace."), run: (c) => { c.st.mods.nereiHeard = true; c.st.dawn += 1; return c.rift(0.85, 0.9, L("Нерей колеблется перед светом паладина.", "Nerei wavers before the paladin's light.")); } },
          { id: "kin", cls: ["necromancer"], race: ["undead"], text: L("Мы похожи, Нерей. Поделись со мной силой.", "We are alike, Nerei. Share your power with me."), run: (c) => { c.st.dusk += 2; c.st.mods.nereiPact = true; return c.rift(1, 0.85, L("Нерей признал в вас родственную тьму и бьёт слабее.", "Nerei recognised a kindred dark in you and strikes softer.")); } },
          { id: "power", text: L("Дай мне силу — и я открою тебе путь наверх.", "Give me power — and I'll open your way up."), run: (c) => { c.st.dusk += 2; c.st.mods.nereiPact = true; return c.rift(1, 1, L("«Докажи», — ответил Нерей и напал.", "“Prove it,” Nerei replied, and attacked.")); } },
        ],
      },
    },
  },
  epilogue: {
    speaker: () => npc("elder"),
    nodes: {
      start: {
        text: (s, st) =>
          tr("Солнце над руинами… я и не надеялся увидеть его снова. ", "The sun over the ruins… I never hoped to see it again. ") +
          (st.mods.nereiHeard ? tr("Говорят, перед тем как рассыпаться, Нерей улыбнулся. ", "They say Nerei smiled before he crumbled. ") : "") +
          tr("Но осколки затмения в твоей сумке всё ещё шепчут. Ардан развеял бы их. Нерей — оставил бы себе. Каким ты войдёшь в легенды?", "But the eclipse shards in your bag still whisper. Ardan would have scattered them. Nerei would have kept them. How will you enter the legends?"),
        choices: [
          { id: "dawn", primary: true, text: L("Развеять осколки — свет навсегда. (500 монет и 2 очка)", "Scatter the shards — light forever. (500 coins and 2 points)"), run: (c) => c.ending("dawn") },
          { id: "dusk", text: L("Оставить силу затмения себе. (+12% урона навсегда)", "Keep the eclipse's power. (+12% damage forever)"), run: (c) => c.ending("dusk") },
          { id: "peace", tag: L("Примирение", "Reconciliation"), need: (s, st) => st.mods.nereiHeard, text: L("Отпустить душу Нерея к брату. Пусть хоть там они помирятся.", "Release Nerei's soul to his brother. Let them make peace at last."), run: (c) => c.ending("peace") },
          { id: "wait", text: L("Мне нужно подумать.", "I need time to think."), run: () => {} },
        ],
      },
    },
  },
};
// Each scene belongs to one moment of the story; afterwards its answers do nothing.
const sceneOpenAt = {
  prologue: (s) => s.quest === 0,
  forest: (s, st) => s.quest === 1 && !s.flags.forestRune && !st.wave,
  oliver2: (s) => s.quest === 2,
  ivva: (s, st) => s.quest === 3 && (!st.fate.lea || !st.wave),
  rin: (s) => s.quest === 4,
  guardian: (s) => s.quest === 5 && !s.flags.bossAwake,
  seals: (s) => s.quest === 6,
  nerei: (s) => s.quest === 9 && !s.flags.eclipseAwake,
  epilogue: (s) => s.quest === 10,
};
export const sceneOpen = (s, id) => !!sceneOpenAt[id]?.(s, storyOf(s));
// Answers shown to this hero right now.
export function sceneChoices(s, sceneId, nodeId) {
  const st = storyOf(s),
    node = scenes[sceneId].nodes[nodeId];
  return node.choices.filter((ch) => {
    if (ch.answer && said(st, sceneId + ":" + ch.id)) return false;
    if (ch.cls || ch.race) {
      const ok = (ch.cls || []).includes(s.characterClass) || (ch.race || []).includes(s.race);
      if (!ok) return false;
    }
    return !ch.need || ch.need(s, st);
  });
}
export function choiceTag(s, ch) {
  if (ch.cls?.includes(s.characterClass)) return label(classes[s.characterClass].name);
  if (ch.race?.includes(s.race)) return label(races[s.race].name);
  return ch.tag ? label(ch.tag) : "";
}
export function sceneText(s, sceneId, nodeId) {
  return scenes[sceneId].nodes[nodeId].text(s, storyOf(s));
}
// Game-side helpers used by the scenes: waves of enemies, lighting obelisks, boss changes.
export function installStory(Game) {
  Object.assign(Game.prototype, {
    spawnStoryWave(tag, anchorId, list) {
      const st = storyOf(this.save),
        o = landmarks.find((x) => x.id === anchorId);
      let n = 0;
      for (const [type, count] of list)
        for (let i = 0; i < count; i++, n++) {
          const a = (n / 6) * Math.PI * 2,
            p = walkableNear(this.world, o.x + Math.cos(a) * 110, o.y + Math.sin(a) * 80, 6);
          const e = makeEnemy({ id: `story-${tag}-${n}-${this.save.playtime | 0}`, type, ...p, unique: true, storyWave: tag }, undefined, this.save.level);
          e.state = "alert";
          this.enemies.push(e);
        }
      st.wave = { tag, anchor: anchorId };
      this.emit("phase", o.x, o.y - 30, "#9a8aa8", 40);
      this.shake = this.controls.screenShake ? 0.4 : 0;
    },
    // Called every frame: finishes a story fight when its last enemy falls (or after a reload).
    storyTick() {
      const s = this.save,
        st = s?.story;
      if (!st?.wave || s.activeDungeon || s.interior) return;
      if (this.enemies.some((e) => e.storyWave === st.wave.tag && e.hp > 0)) return;
      const { anchor } = st.wave;
      st.wave = null;
      this.lightObelisk(anchor);
    },
    lightObelisk(id) {
      const s = this.save,
        o = landmarks.find((x) => x.id === id);
      if (s.flags[id]) return;
      s.flags[id] = true;
      s.quest = id === "forestRune" ? 2 : 4;
      this.addXp(id === "forestRune" ? 60 : 90);
      this.emit("phase", o.x, o.y - 30, s.flags.obeliskPower && id === "forestRune" ? "#a8a0b0" : "#ffe08a", 50);
      this.audio.effect("level");
      this.onToast(id === "forestRune" ? tr("Лесной обелиск горит. Вернитесь к Оливеру.", "The forest obelisk burns. Return to Oliver.") : tr("Горный обелиск горит. Найдите Рина в Высоком Ключе.", "The mountain obelisk burns. Find Rin in Highspring."));
      this.persist();
      this.onChange();
    },
    // Story choices reshape the guardian and Nerei when they enter the fight.
    shapeBoss(e, hpMul, dmgMul) {
      e.maxHp = Math.round(e.maxHp * hpMul);
      e.hp = e.maxHp;
      e.damage = Math.round(e.damage * dmgMul);
      e.scaled = true;
    },
    // Rin fights at your side against Nerei; if he turned on you, the Ashen come with him.
    storyBattle(dt) {
      const s = this.save,
        st = s?.story;
      if (!st || s.quest !== 9 || !s.flags.eclipseAwake) return;
      const boss = this.enemies.find((e) => e.type === "eclipse" && e.hp > 0);
      if (!boss) return;
      if (st.fate.rin === "ally" || st.fate.rin === "deceived") {
        this.rinTimer = (this.rinTimer ?? 3) - dt;
        if (this.rinTimer <= 0) {
          this.rinTimer = 4;
          this.damageEnemy(boss, Math.round(boss.maxHp * 0.025));
          this.emit("hit", boss.x, boss.y - 30, "#c8f0a0", 14);
          if (!this.rinCalled) this.onToast(tr("Рин здесь! Его стрелы бьют по Нерею.", "Rin is here! His arrows strike Nerei."));
          this.rinCalled = true;
        }
      }
    },
  });
}

// Villagers talk about what the hero has done; the freshest consequence comes first.
export function storyRumors(s) {
  const st = storyOf(s),
    out = [];
  if (st.fate.lea === "dead") out.push(L("Говорят, у горного обелиска погибла девушка, а знаконосец стоял рядом и смотрел. Мира больше не продаёт ему зелья в долг.", "They say a girl died at the mountain obelisk while the mark-bearer stood and watched. Mira no longer sells potions on credit."));
  if (st.fate.lea === "saved" || st.fate.lea === "wounded") out.push(L("Лея из Высокого Ключа рассказывает всем, как её спасли от Пепельных. Дети играют в «хранителя и жрицу».", "Lea of Highspring tells everyone how she was saved from the Ashen. Children play “guardian and priestess”."));
  if (st.fate.ivva === "redeemed") out.push(L("Бывшая жрица Ивва лечит больных у старой часовни. Одни плюют ей вслед, другие несут хлеб.", "The former priestess Ivva heals the sick by the old chapel. Some spit after her, others bring bread."));
  if (st.fate.ivva === "fled") out.push(L("Пепельные снова видели свою жрицу в лесу. Двери на ночь запирайте крепче.", "The Ashen saw their priestess in the woods again. Lock your doors tighter at night."));
  if (st.fate.rin === "enemy") out.push(L("Рин из Высокого Ключа ушёл к Пепельным. Говорят, он поклялся отомстить знаконосцу.", "Rin of Highspring joined the Ashen. They say he swore revenge on the mark-bearer."));
  if (st.knows.villageKnows) out.push(L("Теперь все знают, что под долиной спит Нерей. Кто-то уехал, кто-то молится, а кто-то тайком ходит к Пепельным.", "Now everyone knows Nerei sleeps beneath the valley. Some left, some pray, and some secretly visit the Ashen."));
  if (s.flags.obeliskPower) out.push(L("У знаконосца серые глаза, как у пепла. Старики шепчутся: так начинал брат Ардана.", "The mark-bearer has ash-grey eyes. The old folk whisper: that's how Ardan's brother began."));
  if (st.fate.guardian === "spared") out.push(L("Страж Сердца уснул без боя. Такого не видели сто лет.", "The Heart's Warden lay down without a fight. No one has seen that in a hundred years."));
  return out;
}
export function villagerMood(s) {
  const st = storyOf(s),
    lean = st.dawn - st.dusk;
  if (st.fate.lea === "dead" || lean <= -4) return L("Люди замолкают, когда вы входите. Кто-то крестится.", "People fall silent when you enter. Someone makes a warding sign.");
  if (lean >= 3) return L("Вам кивают с улыбкой. Кто-то предлагает кружку за счёт заведения.", "People nod and smile. Someone offers you a mug on the house.");
  return null;
}

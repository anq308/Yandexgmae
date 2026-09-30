import {
  rankLevel,
  skillsFor,
  barFor,
  abilityRank,
  weaponDiscipline,
  disciplines,
} from "./abilities.js";
import { wearables, slotNames, recipes } from "./gear.js";
import {
  armors,
  equippedArmor,
  starterWeapons,
  weaponUpgradeCost,
  armorUpgradeCost,
} from "./equipment.js";
import {
  dungeons,
  bossNames,
  mobNames,
  contracts,
  contractProgress,
  dungeonAccess,
} from "./content.js";
import { weatherNames, weatherDescription } from "./climate.js";
import "./style.css";
import {
  tr,
  classes,
  label,
  items,
  regions,
  language,
  setLanguage,
} from "./i18n.js";
import { icon } from "./icons.js";
import {
  weapons,
  defaultWeapon,
  classWeapons,
  equippedWeapon,
  deriveStats,
  skillTrees,
  skillConfig,
} from "./equipment.js";
import {
  keyLabel,
  saveControls,
  normalizeControls,
  defaultBindings,
} from "./controls.js";
import { drawHero } from "./art.js";
import { Game } from "./game.js";
import { Platform } from "./platform.js";
import { GameAudio } from "./audio.js";
import { newSave, readLocal, validateSave } from "./storage.js";
import { TILE, WIDTH, HEIGHT, landmarks, canWalk } from "./world.js";
import {
  questInfo,
  CHEST_COUNT,
  objectiveTarget,
  canActivate,
  countGathered,
} from "./quests.js";

const app = document.querySelector("#app");
app.innerHTML = `<main class="game-shell"><canvas id="world" aria-label="${tr("Игровой мир", "Game world")}"></canvas><div class="world-shade"></div><div id="screen"></div><div id="hud" hidden></div><div id="modal-root"></div><div id="toast" role="status"></div><div class="background-pause" hidden>${icon("pause")}<span></span></div></main>`;
const platform = new Platform(),
  audio = new GameAudio(),
  game = new Game(document.querySelector("#world"), platform, audio);
const screen = document.querySelector("#screen"),
  hud = document.querySelector("#hud"),
  modalRoot = document.querySelector("#modal-root");
let state = "menu",
  modal = null,
  existingSave = null,
  selectedClass = "warrior",
  selectedWeapon = "sword",
  appearance = { skin: "#e9b88a", hair: "#654333", cape: null },
  toastTimer = 0,
  platformPaused = false,
  blurred = !document.hasFocus(),
  adPending = false,
  newGameIntent = false;
let draftName = "";
try {
  draftName = sessionStorage.getItem("elderia-draft-name") || "";
} catch {}
const skins = ["#e9b88a", "#d9a175", "#b77e59", "#815b46"];
const hairs = ["#654333", "#d6b675", "#352f31", "#a75944", "#e0dbcc"];
const capes = ["#567d9a", "#699460", "#8874b4", "#b56a5d", "#c0a16c"];
const btn = (text, action, style = "primary", ico) =>
  `<button class="button ${style}" data-action="${action}">${ico ? icon(ico) : ""}<span>${text}</span></button>`;
const escapeHTML = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const badge = (text) => `<span class="eyebrow">${text}</span>`;
const brand = () =>
  `<div class="brand">${icon("crystal")}<div>${tr("ЭЛЬДЕРИЯ", "ELDERIA")}<small>${tr("ХРОНИКИ ЗАБЫТОЙ ДОЛИНЫ", "CHRONICLES OF THE FORGOTTEN VALLEY")}</small></div></div>`;

function syncPause() {
  const paused =
    state !== "game" ||
    (!!modal && modal !== "fishing") ||
    document.hidden ||
    blurred ||
    platformPaused;
  game.setPaused(paused);
  document.querySelector(".background-pause").hidden = !(
    state === "game" &&
    !modal &&
    (document.hidden || blurred || platformPaused)
  );
  document.querySelector(".background-pause span").textContent = tr(
    "Приключение на паузе",
    "Adventure paused",
  );
}
function toast(text) {
  const el = document.querySelector("#toast");
  el.textContent = text;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 3500);
}
function titleBar(back = false) {
  return `<header class="menu-header">${brand()}<div class="header-actions">${back ? `<button class="text-button" data-action="menu">← ${tr("Назад", "Back")}</button>` : ""}<button class="icon-button" data-action="sound" aria-label="${tr("Включить или отключить звук", "Toggle audio")}">${icon(audio.enabled ? "sound" : "mute")}</button><button class="language-button" data-action="language">${language.toUpperCase()}</button></div></header>`;
}
function showMenu() {
  state = "menu";
  modal = null;
  modalRoot.innerHTML = "";
  hud.hidden = true;
  screen.hidden = false;
  app.classList.remove("playing", "creating");
  syncPause();
  screen.innerHTML = `<div class="menu-screen">${titleBar()}<section class="menu-hero"><div class="hero-kicker"><span></span>${tr("ВАША ИСТОРИЯ НАЧИНАЕТСЯ ЗДЕСЬ", "YOUR STORY BEGINS HERE")}</div><h1>${tr("В каждой долине<br>есть своя <em>легенда.</em>", "Every valley<br>holds a <em>legend.</em>")}</h1><p>${tr("За шелестом листвы скрывается целый мир.<br>Создайте героя. Найдите свой путь. Разбудите Эльдерию.", "A whole world waits beyond the whispering leaves.<br>Create a hero. Find your path. Awaken Elderia.")}</p><div class="menu-buttons">${existingSave ? btn(tr("Продолжить путешествие", "Continue adventure"), "continue", "primary", "play") : btn(tr("Начать путешествие", "Begin your adventure"), "create", "primary", "arrow")}${existingSave ? btn(tr("Новый герой", "New hero"), "create", "secondary") : btn(tr("Как играть", "How to play"), "help", "secondary", "book")}</div>${existingSave ? `<div class="save-caption"><span class="status-dot"></span>${escapeHTML(existingSave.name)} · ${label(classes[existingSave.characterClass].name)} · ${tr("Уровень", "Level")} ${existingSave.level}</div>` : ""}<div class="hero-tags"><span>${icon("map")}${tr("Открытый мир", "Open world")}</span><span>${icon("sword")}${tr("3 класса", "3 classes")}</span><span>${icon("spark")}${tr("Ваша история", "Your story")}</span></div></section><div class="scene-caption"><span>01 / 04</span><i></i><div>${tr("Лиственная деревня", "Leafhaven Village")}<small>${tr("Там, где начинается путь", "Where the journey begins")}</small></div></div><footer class="menu-footer"><span>${tr("ПИКСЕЛЬНЫЙ МИР. БОЛЬШОЕ ПРИКЛЮЧЕНИЕ.", "A PIXEL WORLD. A GRAND ADVENTURE.")}</span><button data-action="help" class="text-button">${icon("book")}${tr("Справочник путешественника", "Traveler’s guide")}</button><span>v1.3 · ${tr("Сохранения включены", "Autosave enabled")}</span></footer></div>`;
}
function showCreation() {
  state = "create";
  hud.hidden = true;
  screen.hidden = false;
  app.classList.add("creating");
  app.classList.remove("playing");
  syncPause();
  const c = classes[selectedClass],
    startingSkill = skillsFor({
      characterClass: selectedClass,
      equippedWeapon: selectedWeapon,
    })[0];
  screen.innerHTML = `<div class="creation-screen">${titleBar(true)}<div class="creation-heading">${badge(tr("ГЛАВА I · НОВОЕ НАЧАЛО", "CHAPTER I · A NEW BEGINNING"))}<h1>${tr("Каким будет ваш <em>герой?</em>", "Who will your <em>hero be?</em>")}</h1><p>${tr("У каждого пути — своя сила. Выберите тот, что ближе вам.", "Every path has its own strength. Choose the one that speaks to you.")}</p></div><section class="character-layout"><div class="character-preview"><div class="preview-top"><span>${tr("ВАШ ПЕРСОНАЖ", "YOUR CHARACTER")}</span><span>01 <i> / 03</i></span></div><div class="portrait-stage"><div class="portrait-glow"></div><div class="portrait-ring"></div><canvas id="hero-preview" width="160" height="150"></canvas><div class="portrait-ground"></div><span class="portrait-spark s1">✧</span><span class="portrait-spark s2">✧</span></div><div class="character-caption"><h2>${label(c.name)}</h2><p>${label(c.tagline)}</p></div><div class="appearance-options"><div><span>${tr("Кожа", "Skin")}</span><div class="swatches">${skins.map((col) => `<button class="swatch ${appearance.skin === col ? "active" : ""}" style="--swatch:${col}" data-color="skin" data-value="${col}" aria-label="${tr("Цвет кожи", "Skin color")} ${col}"></button>`).join("")}</div></div><div><span>${tr("Волосы", "Hair")}</span><div class="swatches">${hairs.map((col) => `<button class="swatch ${appearance.hair === col ? "active" : ""}" style="--swatch:${col}" data-color="hair" data-value="${col}" aria-label="${tr("Цвет волос", "Hair color")} ${col}"></button>`).join("")}</div></div></div><div class="preview-note">${icon("spark")}${tr("Маленький герой. Большая судьба.", "A little hero. A grand destiny.")}</div></div><div class="character-setup"><label class="input-label" for="hero-name">${tr("ИМЯ ВАШЕГО ГЕРОЯ", "YOUR HERO’S NAME")}</label><div class="name-input"><input id="hero-name" placeholder="${tr("Например, Элиан", "For example, Elian")}" maxlength="20" autocomplete="off" value="${escapeHTML(draftName)}">${icon("leaf")}</div><div class="section-label"><span>${tr("ВЫБЕРИТЕ КЛАСС", "CHOOSE YOUR CLASS")}</span><span>${tr("3 пути на выбор", "3 paths to choose")}</span></div><div class="class-list">${Object.entries(
    classes,
  )
    .map(
      ([key, c]) =>
        `<button class="class-card ${selectedClass === key ? "selected" : ""}" data-class="${key}" aria-pressed="${selectedClass === key}" style="--class-color:${c.color}"><div class="class-icon">${icon(c.icon)}</div><div><h3>${label(c.name)}</h3><p>${label(c.tagline)}</p></div><span class="class-select">${selectedClass === key ? icon("check") : ""}</span></button>`,
    )
    .join(
      "",
    )}</div><div class="starter-weapons"><span class="input-label">${tr("СТАРТОВОЕ ОРУЖИЕ", "STARTING WEAPON")}</span><div>${starterWeapons(
    selectedClass,
  )
    .map(
      ([id, w]) =>
        `<button data-start-weapon="${id}" class="starter-weapon ${id === selectedWeapon ? "selected" : ""}" aria-pressed="${id === selectedWeapon}">${icon(w.icon)}<span>${label(w.name)}</span></button>`,
    )
    .join(
      "",
    )}</div><p>${label(weapons[selectedWeapon].desc)} · ${tr("Оружие будет в рюкзаке; герой начинает без одежды.", "The weapon starts in your backpack; your hero has no clothing.")}</p></div><div class="class-description"><p>${label(c.desc)}</p><div class="stats-grid"><div>${icon("heart")}<span>${tr("Здоровье", "Health")}</span><strong>${c.hp}</strong></div><div>${icon("sword")}<span>${tr("Урон", "Damage")}</span><strong>${Math.round(c.damage * weapons[selectedWeapon].multiplier)}</strong></div><div>${icon("spark")}<span>${tr("Энергия", "Energy")}</span><strong>${c.mana}</strong></div></div><div class="class-skill">${icon("spark")}<div><span>${tr("ОСОБАЯ СПОСОБНОСТЬ", "SPECIAL ABILITY")}</span><strong>${label(startingSkill.name)}</strong><p>${label(startingSkill.desc)}</p></div></div></div><div class="creation-start">${btn(tr("Отправиться в путь", "Set out on your journey"), "start", "primary", "arrow")}<span>${icon("shield")}${tr("Прогресс сохраняется автоматически", "Your progress is saved automatically")}</span></div></div></section><footer class="creation-footer"><span>✧ ${tr("Не нужно быть великим, чтобы начать.", "You don’t have to be great to begin.")}</span><span>${tr("Впереди целый мир.", "A whole world lies ahead.")}</span></footer></div>`;
  const cv = document.querySelector("#hero-preview"),
    ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  drawHero(ctx, 80, 124, selectedClass, {
    player: true,
    armor: "none",
    weapon: null,
    ...appearance,
    scale: ["spear", "staff", "frostStaff", "wand"].includes(selectedWeapon)
      ? 2.6
      : 3,
    weapon: null,
    armor: "none",
  });
}
function renderHUD() {
  previousQuestHTML = "";
  lastMapDraw = -Infinity;
  const s = game.save;
  hud.innerHTML = `<header class="game-header">${brand()}<nav><button class="nav-button" data-action="map">${icon("map")}<span>${tr("Карта", "Map")}</span><kbd>M</kbd></button><button class="nav-button" data-action="journal">${icon("book")}<span>${tr("Задания", "Quests")}</span><kbd>J</kbd></button><button class="nav-button" data-action="inventory">${icon("bag")}<span>${tr("Рюкзак", "Bag")}</span><kbd>I</kbd></button><button class="nav-button" data-action="skills">${icon("spark")}<span>${tr("Умения", "Skills")}</span><kbd>K</kbd><b class="skill-point-indicator" id="skill-points-dot"></b></button><i></i><button class="icon-button" data-action="sound" aria-label="${tr("Звук", "Sound")}">${icon(audio.enabled ? "sound" : "mute")}</button><button class="icon-button" data-action="pause" aria-label="${tr("Пауза", "Pause")}">${icon("pause")}</button></nav></header><div class="player-card"><div class="player-avatar"><canvas id="hud-avatar" width="52" height="55"></canvas><span id="level-label">${s.level}</span></div><div class="player-bars"><div class="player-name"><b>${escapeHTML(s.name)}</b><span id="class-label">${label(classes[s.characterClass].name)}</span></div><div class="resource-row hp">${icon("heart")}<div class="resource-bar"><i id="hp-fill"></i></div><span id="hp-value"></span></div><div class="resource-row mana">${icon("spark")}<div class="resource-bar"><i id="mana-fill"></i></div><span id="mana-value"></span></div><div class="xp-bar"><i id="xp-fill"></i></div></div></div><div class="location-badge">${icon("leaf")}<span id="location-name"></span><i></i>${icon("sun")}<span id="time-label"></span></div><aside class="quest-tracker"><div class="tracker-heading">${icon("flag")}<span>${tr("ВАШЕ ПРИКЛЮЧЕНИЕ", "YOUR ADVENTURE")}</span><button class="icon-button tiny" data-action="journal" aria-label="${tr("Открыть задания", "Open quests")}">${icon("arrow")}</button></div><h3 id="quest-title"></h3><div id="quest-steps"></div><div class="quest-direction" id="quest-direction"></div></aside><button class="minimap-box" data-action="map" aria-label="${tr("Открыть карту", "Open map")}"><canvas id="minimap" width="168" height="132"></canvas><span>${icon("map")}${tr("КАРТА ДОЛИНЫ", "VALLEY MAP")}<kbd>M</kbd></span></button><button class="weather-badge" data-action="weather" id="weather-badge"></button><div class="boss-health" id="boss-health" hidden></div><div class="dungeon-status" id="dungeon-status" hidden></div><div class="buff-display" id="buff-display"></div><div class="enemy-focus" id="enemy-focus" hidden></div><div class="bottom-left"><div class="gold-count">${icon("coin")}<b id="gold-value"></b><span>${tr("монет", "coins")}</span></div><div class="save-status"><span class="status-dot"></span>${tr("Автосохранение", "Autosave")}</div></div><div class="action-bar"><button class="action-slot" data-action="attack">${icon(equippedWeapon(s).icon)}<span>${tr("Атака", "Attack")}</span><kbd>SPACE</kbd></button>${[
    0, 1, 2, 3, 4,
  ]
    .map((i) => {
      const cfg = skillConfig(s, i);
      return `<button class="action-slot ${i === 0 ? "skill-slot" : "extra-skill"}" data-action="${i === 0 ? "skill" : "skill-" + i}" data-skill-slot="${i}" data-bar-slot="${i}" draggable="true" title="${label(cfg.name)} · ${label(cfg.desc)}">${icon(cfg.icon)}<span>${label(cfg.name)}</span><kbd>${keyLabel(game.controls.bindings["skill" + (i + 1)])}</kbd>${i === 0 ? '<i id="skill-overlay"></i><b id="skill-countdown"></b>' : `<b id="extra-cooldown-${i}"></b>`}<i class="ability-lock" id="skill-lock-${i}">${icon("lock")}</i></button>`;
    })
    .join(
      "",
    )}<button class="action-slot" data-action="dodge">${icon("boot")}<span>${tr("Рывок", "Dodge")}</span><kbd>SHIFT</kbd><b id="dodge-countdown"></b></button><i class="slot-divider"></i><button class="action-slot potion-slot" data-action="potion">${icon("potion")}<span>${tr("Зелье", "Potion")}</span><kbd>R</kbd><b id="potion-count"></b><i class="potion-countdown" id="potion-countdown"></i></button><button class="action-slot interact-slot" data-action="interact">${icon("leaf")}<span>${tr("Действие", "Interact")}</span><kbd>E</kbd></button></div><div class="interaction-prompt" id="interaction-prompt" hidden></div><div class="movement-tip" id="movement-tip"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>${tr("Движение", "Move")}</span><i></i><span>${tr("Нажмите на тропу, чтобы идти", "Click a trail to walk")}</span><button data-action="dismissTip" aria-label="${tr("Скрыть подсказку", "Hide hint")}">×</button></div><div class="touch-joystick" id="joystick"><div class="joystick-knob"></div></div>`;
  const ctx = document.querySelector("#hud-avatar").getContext("2d");
  ctx.imageSmoothingEnabled = false;
  drawHero(ctx, 26, 50, s.characterClass, {
    ...s.appearance,
    player: true,
    equipment: s.equippedWearables,
    scale: ["spear", "staff", "frostStaff", "wand"].includes(s.equippedWeapon)
      ? 1.05
      : 1.35,
    weapon: s.equippedWeapon,
    armorLevel: s.armorLevel,
    armor: s.equippedArmor,
  });
  const hintActions = {
    attack: "attack",
    skill: "skill1",
    dodge: "dodge",
    potion: "potion",
    interact: "interact",
    map: "map",
    journal: "journal",
    inventory: "inventory",
    skills: "skills",
  };
  for (const [action, key] of Object.entries(hintActions))
    hud
      .querySelectorAll(`[data-action="${action}"] kbd`)
      .forEach(
        (el) => (el.textContent = keyLabel(game.controls.bindings[key])),
      );
  updateHUD();
}
let previousQuestHTML = "",
  lastMapDraw = 0,
  lastMapZone = "";
function updateHUD() {
  if (state !== "game" || !game.save || hud.hidden) return;
  const s = game.save,
    stats = game.stats;
  document.querySelector("#hp-fill").style.width =
    `${(s.hp / stats.maxHp) * 100}%`;
  document.querySelector("#mana-fill").style.width =
    `${(s.mana / stats.maxMana) * 100}%`;
  document.querySelector("#hp-value").textContent =
    `${Math.ceil(s.hp)} / ${stats.maxHp}`;
  document.querySelector("#mana-value").textContent =
    `${Math.floor(s.mana)} / ${stats.maxMana}`;
  document.querySelector("#xp-fill").style.width =
    `${(s.xp / game.xpNeeded) * 100}%`;
  document.querySelector("#level-label").textContent = s.level;
  document.querySelector("#gold-value").textContent = s.gold;
  document.querySelector("#potion-count").textContent = s.inventory.potion;
  document.querySelector("#potion-countdown").textContent =
    game.potionCooldown > 0 ? Math.ceil(game.potionCooldown) + "s" : "";
  document
    .querySelector(".potion-slot")
    .classList.toggle("on-cooldown", game.potionCooldown > 0);
  document.querySelector("#location-name").textContent = label(
    regions[game.currentRegion] || regions.village,
  );
  const climate = game.climate,
    hours = Math.floor(climate.hour);
  document.querySelector("#time-label").textContent =
    `${String(hours).padStart(2, "0")}:${String(Math.floor((climate.hour % 1) * 60)).padStart(2, "0")}`;
  document.querySelector("#weather-badge").innerHTML =
    `${icon(climate.weather === "snow" ? "snow" : climate.weather === "storm" ? "spark" : "sun")}<span>${label(weatherNames[climate.weather])}${climate.night ? " · " + tr("Ночь", "Night") : ""}</span>`;
  document.querySelector("#weather-badge").title = weatherDescription(climate);
  const boss = game.enemies.find((e) => e.boss && e.engaged && e.hp > 0),
    bossEl = document.querySelector("#boss-health");
  bossEl.hidden = !boss;
  app.classList.toggle("boss-active", !!boss);
  app.classList.toggle("in-dungeon", !!s.activeDungeon);
  if (boss)
    bossEl.innerHTML = `<div><b>${label(bossNames[boss.type])}</b><span>${tr("Фаза", "Phase")} ${boss.phase}/3${boss.enraged ? " · " + tr("ЯРОСТЬ", "ENRAGED") : ""}</span></div><div class="boss-bar"><i style="width:${(boss.hp / boss.maxHp) * 100}%"></i><em></em><em></em></div><small>${Math.ceil(boss.hp)} / ${boss.maxHp}${boss.ward ? " · " + tr("Щит свиты −25% урона", "Minion ward −25% damage") : ""}</small>`;
  const dungeonEl = document.querySelector("#dungeon-status");
  dungeonEl.hidden = !s.activeDungeon;
  if (s.activeDungeon) {
    const d = s.activeDungeon;
    dungeonEl.innerHTML = `<strong>${tr("Этаж", "Floor")} ${d.floor}/${dungeons[d.id].floors}</strong><span>${tr("Стражи", "Guards")}: ${game.enemies.filter((e) => e.hp > 0 && !e.boss && !e.summoned).length}${game.world.gateOpen ? " · " + tr("Зал открыт", "Hall open") : ""}</span>`;
  }
  const quest = s.activeDungeon
    ? {
        title: label(dungeons[s.activeDungeon.id].name),
        steps: [
          [
            tr("Зачистить стражей этажа", "Clear the floor guards"),
            game.world.spawns.filter((e) => e.guard).length -
              game.enemies.filter((e) => e.guard && e.hp > 0).length,
            game.world.spawns.filter((e) => e.guard).length,
          ],
          [
            tr(
              s.activeDungeon.floor === dungeons[s.activeDungeon.id].floors
                ? "Победить владыку"
                : "Зачистить зал и найти лестницу",
              s.activeDungeon.floor === dungeons[s.activeDungeon.id].floors
                ? "Defeat the dungeon lord"
                : "Clear the hall and find the stairs",
            ),
            +game.enemies.every((e) => e.hp <= 0 || e.summoned),
            1,
          ],
        ],
      }
    : questInfo(s);
  document.querySelector("#quest-title").textContent = quest.title;
  const steps = quest.steps
    .map(
      ([name, have, need]) =>
        `<div class="quest-step ${have >= need ? "done" : ""}"><span class="step-mark">${have >= need ? icon("check") : ""}</span><span>${name}</span><b>${Math.min(have, need)}/${need}</b></div>`,
    )
    .join("");
  if (steps !== previousQuestHTML) {
    document.querySelector("#quest-steps").innerHTML = steps;
    previousQuestHTML = steps;
  }
  const target = objectiveTarget(game),
    direction = document.querySelector("#quest-direction");
  if (target) {
    const distance = Math.round(
        Math.hypot(target.x - s.x, target.y - s.y) / TILE,
      ),
      angle = Math.atan2(target.y - s.y, target.x - s.x);
    direction.innerHTML = `<span style="transform:rotate(${angle}rad)">${icon("arrow")}</span>${tr("До цели", "To objective")} <b>${distance} ${tr("шаг.", "tiles")}</b>`;
  } else direction.innerHTML = tr("Исследуйте долину", "Explore the valley");
  const nearby = game.nearest(),
    prompt = document.querySelector("#interaction-prompt");
  prompt.hidden = !nearby;
  if (nearby) {
    const text = nearby.name
      ? label(nearby.name)
      : label(items[nearby.type] || ["Взаимодействовать", "Interact"]);
    prompt.innerHTML = `<kbd>${keyLabel(game.controls.bindings.interact)}</kbd><span>${text}</span>${icon("leaf")}`;
  }
  for (let i = 0; i < 5; i++) {
    const cfg = skillConfig(s, i),
      cd = game.skillCooldownAt(i);
    if (i > 0)
      document.querySelector("#extra-cooldown-" + i).textContent =
        cd > 0 ? Math.ceil(cd) : "";
    document.querySelector("#skill-lock-" + i).hidden =
      cfg.rank > 0 && s.level >= cfg.level && !!s.equippedWeapon;
  }
  document.querySelector("#skill-points-dot").textContent =
    s.skillPoints > 0 ? s.skillPoints : "";
  document.querySelector("#buff-display").innerHTML = [
    ["stealth", "moon", tr("Невидимость", "Invisible")],
    ["focus", "target", tr("Сосредоточение", "Focus")],
    ["haste", "boot", tr("Ветер троп", "Trail wind")],
    ["bulwark", "shield", tr("Железная кожа", "Iron skin")],
    ["poison", "leaf", tr("Отравление", "Poisoned")],
    ["chilled", "snow", tr("Замерзание", "Chilled")],
  ]
    .filter(([id]) => game.buffs[id] > 0)
    .map(([id, i, name]) => `${icon(i)}${name} ${Math.ceil(game.buffs[id])}s`)
    .join(" · ");
  const focus = game
      .combatEnemies()
      .filter((e) => Math.hypot(e.x - s.x, e.y - s.y) < 190)
      .sort(
        (a, b) =>
          Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y),
      )[0],
    focusEl = document.querySelector("#enemy-focus");
  focusEl.hidden = !focus || !!boss;
  if (focus) {
    const names = mobNames;
    focusEl.innerHTML = `<span>${label(names[focus.type])} · Lv. ${focus.level}</span><div><i style="width:${(focus.hp / focus.maxHp) * 100}%"></i></div><small>${Math.ceil(focus.hp)} / ${focus.maxHp}</small>`;
  }
  document.querySelector("#skill-countdown").textContent =
    game.skillCooldown > 0 ? Math.ceil(game.skillCooldown) : "";
  document.querySelector("#skill-overlay").style.height =
    `${(game.skillCooldown / skillConfig(s, 0).cooldown) * 100}%`;
  document.querySelector("#dodge-countdown").textContent =
    game.dodgeCooldown > 0 ? Math.ceil(game.dodgeCooldown) : "";
  if (game.zoneId !== lastMapZone || game.time - lastMapDraw > 0.35) {
    lastMapDraw = game.time;
    lastMapZone = game.zoneId;
    drawMap(document.querySelector("#minimap"), false);
  }
  if (s.playtime > 50) document.querySelector("#movement-tip").hidden = true;
}
function startGame(save) {
  state = "game";
  modal = null;
  modalRoot.innerHTML = "";
  screen.hidden = true;
  hud.hidden = false;
  app.classList.add("playing");
  app.classList.remove("creating");
  game.load(save);
  existingSave = save;
  previousQuestHTML = "";
  audio.unlock();
  renderHUD();
  syncPause();
  if (save.hp <= 0) showDeath();
  else if (save.playtime < 1)
    toast(
      tr(
        "Рюкзак I: возьмите стартовое оружие. Одежду предстоит найти или создать. Затем поговорите со старостой.",
        "Backpack I: equip your starting weapon. Find or craft clothing, then speak to the elder.",
      ),
    );
}
function openModal(title, body, kind = "standard", subtitle = "") {
  const scroll = modal === kind ? modalRoot.querySelector(".modal-body")?.scrollTop || 0 : 0;
  modal = kind;
  game.persist();
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal ${kind}" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}"><header class="modal-header"><div>${badge(subtitle || tr("ЭЛЬДЕРИЯ · СПРАВОЧНИК ПУТЕШЕСТВЕННИКА", "ELDERIA · TRAVELER’S GUIDE"))}<h2>${title}</h2></div>${kind === "death" ? "" : `<button class="icon-button" data-action="close" aria-label="${tr("Закрыть", "Close")}">${icon("close")}</button>`}</header><div class="modal-body">${body}</div></section></div>`;
  syncPause();
  modalRoot.querySelector("button, input")?.focus({preventScroll:true});
  modalRoot.querySelector(".modal-body").scrollTop = scroll;
}
function closeModal() {
  if (modal === "fishing") game.cancelFishing();
  if (adPending || modal === "death") return;
  modal = null;
  bindingAwait = null;
  modalRoot.innerHTML = "";
  syncPause();
}
function dialog(o, text, buttons, extra = "") {
  openModal(
    label(o.name),
    `<div class="dialog-person"><canvas id="dialog-portrait" width="90" height="90"></canvas><div><span>${label(o.role || ["Житель долины", "Valley resident"])}</span><p>${text}</p></div></div>${extra}<div class="dialog-actions">${buttons}</div>`,
    "dialog",
    tr("РАЗГОВОР У ТРОПЫ", "A CONVERSATION BY THE TRAIL"),
  );
  const ctx = document.querySelector("#dialog-portrait").getContext("2d");
  drawHero(ctx, 45, 79, o.style, { scale: 2 });
}
function showHelp() {
  const key = (action) => keyLabel(game.controls.bindings[action]);
  openModal(
    tr("Справочник путешественника", "Traveler’s guide"),
    `<p class="modal-intro">${tr("Два обелиска погасли, и древний хранитель потерял покой. Помогите жителям, верните свет долине и станьте частью её истории.", "Two obelisks have gone dark and the ancient guardian has lost its peace. Help the villagers, restore the valley’s light and become part of its story.")}</p><div class="help-grid">${[
      ["W A S D / ↑ ↓ ← →", tr("Движение", "Move")],
      [
        key("attack"),
        tr("Атака · можно удерживать", "Attack · hold for repeated strikes"),
      ],
      [
        `${key("skill1")} / ${key("skill2")} / ${key("skill3")} / ${key("skill4")} / ${key("skill5")}`,
        tr(
          "Пять ячеек · приёмы зависят от оружия",
          "Five slots · abilities depend on your weapon",
        ),
      ],
      [
        key("dodge"),
        tr("Рывок с неуязвимостью", "Dodge with brief invulnerability"),
      ],
      [
        key("interact"),
        tr(
          "Разговор, сбор, сундуки и костры",
          "Talk, gather, open chests and rest",
        ),
      ],
      [key("potion"), tr("Зелье здоровья · +65 HP", "Health potion · +65 HP")],
      [
        `${key("inventory")} / ${key("journal")} / ${key("map")}`,
        tr("Рюкзак / задания / карта", "Bag / quests / map"),
      ],
      [
        key("skills"),
        tr("Книга умений · прокачка навыков", "Skill book · upgrade abilities"),
      ],
      ["ESC", tr("Пауза и настройки", "Pause & settings")],
    ]
      .map(
        ([key, action]) => `<div><kbd>${key}</kbd><span>${action}</span></div>`,
      )
      .join(
        "",
      )}</div><div class="guide-note">${icon("leaf")}<p>${tr("На телефоне двигайтесь джойстиком и используйте кнопки внизу. Нажмите на врага для атаки, на жителя — чтобы подойти и поговорить. Оружие меняется в рюкзаке и покупается у Брама. Начинаете без брони: покупайте или создавайте её у Брама, редкую ищите у боссов. Поручения доступны в журнале. Подземелья требуют указанного уровня; их входы отмечены на карте. У костров вы бесплатно восстанавливаете здоровье и энергию, если рядом безопасно. Зелья имеют общую перезарядку 8 секунд. Костры открывают быстрое перемещение на карте. Красная область или линия предупреждает об атаке — сделайте рывок!", "On a phone, move with the joystick and use the bottom buttons. Tap enemies to attack and villagers to approach and talk. Equip weapons in your bag and buy them from Bram. Start without armor: buy or craft it at Bram’s; claim rare armor from bosses. Find contracts in the journal and dungeon entrances on the map. Dungeons require the indicated level. Safe campfires restore health and energy for free. Potions share an 8-second cooldown. Rest at campfires to unlock fast travel on the map. A red area or line warns of an attack — dodge!")}</p></div>${btn(tr("Всё понятно", "Got it"), "close", "primary", "check")}`,
    "help",
  );
}
function showJournal() {
  const s = game.save,
    q = questInfo(s);
  openModal(
    tr("Журнал приключений", "Adventure journal"),
    `<div class="journal-main"><span class="quest-type">${tr("ОСНОВНАЯ ИСТОРИЯ", "MAIN STORY")} · ${tr("Глава", "Chapter")} ${Math.min(4, Math.floor(s.quest / 2) + 1)}</span><h3>${q.title}</h3><p>${q.desc}</p>${q.steps.map(([name, have, need]) => `<div class="journal-step ${have >= need ? "done" : ""}">${icon(have >= need ? "check" : "flag")}<span>${name}</span><b>${Math.min(have, need)} / ${need}</b></div>`).join("")}${btn(tr("Посмотреть на карте", "Show on map"), "map", "secondary", "map")}</div><div class="side-quests"><h3>${tr("Истории жителей", "Villagers’ stories")}</h3><div>${icon("leaf")}<span><strong>${tr("Запасы для Миры", "Supplies for Mira")}</strong><small>${s.flags.herbQuestDone ? tr("Завершено · награда получена", "Completed · reward claimed") : s.flags.herbQuest ? tr(`Принесите 6 трав: ${s.inventory.herb}/6. Награда: 3 зелья и 50 монет.`, `Bring 6 herbs: ${s.inventory.herb}/6. Reward: 3 potions and 50 coins.`) : tr("Поговорите с травницей в Лиственной деревне.", "Speak to the herbalist in Leafhaven.")}</small></span>${s.flags.herbQuestDone ? icon("check") : ""}</div><div>${icon("sword")}<span><strong>${tr("Работа для кузнеца", "A smith’s work")}</strong><small>${s.flags.smithQuestDone ? tr("Завершено · награда получена", "Completed · reward claimed") : s.flags.smithQuest ? tr(`Принесите 4 руды: ${s.inventory.ore}/4. Награда: улучшение оружия.`, `Bring 4 ore: ${s.inventory.ore}/4. Reward: a weapon upgrade.`) : tr("Поговорите с Брамом у кузницы.", "Speak to Bram by the forge.")}</small></span>${s.flags.smithQuestDone ? icon("check") : ""}</div><div>${icon("target")}<span><strong>${tr("Патруль дальних земель", "Farlands patrol")}</strong><small>${s.flags.expeditionDone ? tr("Завершено · оружие получено", "Completed · weapon claimed") : s.flags.expedition ? tr(`Волки ${s.kills.wolf || 0}/6 · Стражи ${s.kills.sentinel || 0}/4`, `Wolves ${s.kills.wolf || 0}/6 · Sentinels ${s.kills.sentinel || 0}/4`) : tr("Капитан Лея ждёт на Речной пристани.", "Captain Lea awaits in Riverport.")}</small></span></div></div><h3 class="small-heading">${tr("ПЕЧАТИ ГЛУБИН · НОВАЯ КАМПАНИЯ", "DEPTH SEALS · NEW CAMPAIGN")}</h3>${dungeonCards()}${btn(tr("Доска поручений", "Contract board"), "contracts", "secondary", "flag")}<div class="journal-stats"><span>${tr("Мест открыто", "Places discovered")}<b>${s.discovered.length} / ${Object.keys(regions).length}</b></span><span>${tr("Сундуков найдено", "Chests found")}<b>${s.collected.filter((x) => x.startsWith("chest")).length} / ${CHEST_COUNT}</b></span><span>${tr("Время в долине", "Time in the valley")}<b>${Math.floor(s.playtime / 60)} ${tr("мин", "min")}</b></span></div>`,
    "journal",
  );
}
let bagSelected = null,
  craftDraft = [], bagFilter = "all", recipeMaterial = null;
const itemIcon = k => ({wood:"wood",ore:"ore",fiber:"fiber",leather:"leather",essence:"essence",bandage:"bandage",bait:"bait",berry:"berry",pearl:"pearl",rod:"rod",herb:"leaf"})[k] || (k.includes("Fish") ? "fish" : k.includes("Scroll") ? "book" : k.toLowerCase().includes("potion") ? "potion" : "crystal");
const gearIcon = (slot) =>
  ({
    head: "helmet",
    chest: "shield",
    legs: "pants",
    feet: "boot",
    mainhand: "sword",
    offhand: "shield",
  })[slot];
function bagEntries() {
  const s = game.save,
    out = [];
  for (const id of s.ownedWeapons.filter((id) => id !== s.equippedWeapon))
    out.push({
      key: "w:" + id,
      id,
      type: "w",
      name: label(weapons[id].name),
      icon: weapons[id].icon,
      n: 1,
    });
  for (const id of s.ownedArmors.filter(
    (id) => id !== "none" && id !== s.equippedArmor,
  ))
    out.push({
      key: "a:" + id,
      id,
      type: "a",
      name: label(armors[id].name),
      icon: "shield",
      n: 1,
    });
  for (const id of s.ownedWearables.filter(
    (id) => !Object.values(s.equippedWearables).includes(id),
  ))
    out.push({
      key: "g:" + id,
      id,
      type: "g",
      name: label(wearables[id].name),
      icon: gearIcon(wearables[id].slot),
      n: 1,
    });
  for (const [id, total] of Object.entries(s.inventory))
    for (let j = 0; j < Math.ceil(total / 64); j++)
      out.push({
        key: "i:" + id + ":" + j,
        id,
        type: "i",
        name: label(items[id]),
        icon: itemIcon(id),
        n: Math.min(64, total - j * 64),
      });
  const order = s.bagOrder || [];
  return out.sort(
    (a, b) =>
      (order.includes(a.key) ? order.indexOf(a.key) : 1e6) -
      (order.includes(b.key) ? order.indexOf(b.key) : 1e6),
  );
}
function selectedRecipe() {
  const counts = {};
  for (const id of craftDraft) counts[id] = (counts[id] || 0) + 1;
  return recipes.find(
    (r) =>
      JSON.stringify(Object.entries(r.inputs).sort()) ===
      JSON.stringify(Object.entries(counts).sort()),
  );
}
function recipeItem(r) {
  return r.gear ? {name:label(r.name), icon:gearIcon(wearables[r.gear].slot), n:1} : {name:label(r.name), icon:itemIcon(Object.keys(r.output)[0]), n:Object.values(r.output)[0]};
}
const materialHints = {
  wood: ["Древесина: поваленные ветки на лесных тропах.", "Wood: fallen branches along forest trails."],
  fiber: ["Волокно: добыча обычных врагов и тайники.", "Fiber: normal enemy loot and chests."],
  leather: ["Кожа: волки, разбойники и тайники.", "Leather: wolves, bandits and chests."],
  ore: ["Руда: горные тропы и шахты.", "Ore: mountain trails and mines."],
  crystal: ["Кристаллы: горные месторождения и тайники.", "Crystals: mountain deposits and chests."],
  essence: ["Эссенция: боссы и элитные враги.", "Essence: bosses and elite enemies."],
  herb: ["Трава: собирайте на лугах. Ночью сбор удваивается.", "Herbs: gather in meadows. Night doubles gathering."],
  rawFish: ["Сырая рыба: рыбалка с удочкой у отмеченных берегов.", "Raw fish: fish with a rod at marked shores."],
};
function ingredientCounts(inputs) {
  return `<div class="ingredient-counts">${Object.entries(inputs).map(([k,n]) => `<span class="${game.save.inventory[k] >= n ? 'enough' : 'missing'}" title="${label(materialHints[k] || items[k])}">${icon(itemIcon(k))}${label(items[k])}<b>${game.save.inventory[k] || 0}/${n}</b></span>`).join('')}</div>`;
}
function bagItemDescription(e) {
  if (!e) return tr("Нажмите предмет: здесь появятся свойства и действия. Снаряжение также можно перетащить на героя.", "Select an item to see its properties and actions. You can also drag equipment onto your hero.");
  if (e.type === 'w') {
    const w = weapons[e.id], stats = deriveStats({...game.save, equippedWeapon:e.id}, classes[game.save.characterClass]);
    return `${label(w.desc)} · Lv. ${w.level || 1} · ${stats.damage} ${tr('урона','damage')} (${stats.damage-game.stats.damage >= 0 ? '+' : ''}${stats.damage-game.stats.damage}) · ${w.cooldown} ${tr('с между атаками','s between attacks')}`;
  }
  if (e.type === 'a' || e.type === 'g') {
    const a = e.type === 'a' ? armors[e.id] : wearables[e.id];
    return `Lv. ${a.level || 1} · +${a.defense} ${tr('защиты','defense')} · +${a.hp} HP${a.mana ? ` · +${a.mana} MP` : ''}`;
  }
  return label(materialHints[e.id] || {
    rod:['Нужна для рыбалки. На берегу со знаком рыбы нажмите E.','Required for fishing. Press E at shores marked with a fish.'],
    bait:['Расходуется при забросе и расширяет зону успешной подсечки.','Consumed when casting; widens the successful hook zone.'],
    bandage:['Восстанавливает 25 HP и снимает отравление. Общий откат еды и зелий: 8 с.','Restores 25 HP and cures poison. Food and potions share an 8 s cooldown.'],
    cookedFish:['Восстанавливает 40 HP и 15 энергии. Общий откат: 8 с.','Restores 40 HP and 15 energy. Shared cooldown: 8 s.'],
    berry:['Восстанавливает 12 HP. Общий откат: 8 с.','Restores 12 HP. Shared cooldown: 8 s.'],
    potion:['Восстанавливает 65 HP. Общий откат: 8 с.','Restores 65 HP. Shared cooldown: 8 s.'],
    manaPotion:['Восстанавливает 60 энергии. Общий откат: 8 с.','Restores 60 energy. Shared cooldown: 8 s.'],
  }[e.id] || (e.id.includes('Scroll') ? ['Откройте книгу умений: манускрипт расходуется только при первом изучении третьего приёма школы.','Open the skill book: a manuscript is consumed only when first learning a school’s third ability.'] : ['Материал для ремесла или торговли.','A material for crafting or trading.']));
}
function showInventory() {
  const s = game.save, all = bagEntries(), entries = all.filter(e => bagFilter === 'all' || (bagFilter === 'gear' ? e.type !== 'i' : bagFilter === 'materials' ? e.type === 'i' && materialHints[e.id] : e.type === 'i' && !materialHints[e.id])),
    chosen = all.find(e => e.key === bagSelected), r = selectedRecipe(), reason = r ? game.craftReason(r.id) : '',
    batch = r && !r.gear ? Math.min(99, ...Object.entries(r.inputs).map(([k,n]) => Math.floor((s.inventory[k] || 0)/n))) : 1,
    equipped = {...s.equippedWearables, mainhand:s.equippedWeapon, chest:s.equippedArmor === 'none' ? null : s.equippedArmor};
  const slots = Object.entries(slotNames).map(([slot,name]) => {
    const id = equipped[slot], a = slot === 'mainhand' ? weapons[id] : slot === 'chest' ? armors[id] : wearables[id];
    return `<button class="gear-cell ${id ? 'filled' : ''}" data-gear-slot="${slot}" data-action="unequip-${slot}" title="${label(name)}${a ? ' · '+label(a.name)+' · '+tr('Нажмите, чтобы снять','Click to remove') : ''}">${icon(id ? a.icon || gearIcon(slot) : gearIcon(slot))}<small>${label(name)}</small></button>`;
  }).join('');
  let selectedActions = '';
  if (chosen) {
    if (chosen.type !== 'i') {
      const a=({w:weapons,a:armors,g:wearables})[chosen.type][chosen.id], locked=s.level < (a.level || 1);
      selectedActions = `<button class="button primary" data-action="${({w:'equip-',a:'armorEquip-',g:'wearEquip-'})[chosen.type]+chosen.id}" ${locked ? 'disabled' : ''}>${locked ? tr('Нужен уровень '+a.level,'Requires level '+a.level) : tr('Надеть / взять в руки','Equip')}</button>`;
    }
    else if (['berry','cookedFish','bandage'].includes(chosen.id)) selectedActions = btn(tr('Использовать','Use'),'eat-'+chosen.id,'primary');
    else if (['potion','manaPotion'].includes(chosen.id)) selectedActions = btn(tr('Использовать','Use'),'use-'+chosen.id,'primary');
    else if (recipes.some(r => chosen.id in r.inputs)) selectedActions = btn(tr('Подходящие рецепты','Matching recipes'),'recipesFor-'+chosen.id,'secondary','book');
  }
  openModal(tr('Рюкзак и экипировка','Backpack & equipment'),
  `<div class="inventory-heading"><div>${badge(escapeHTML(s.name)+' · Lv. '+s.level)}<p>${game.stats.maxHp} HP · ${game.stats.defense} ${tr('защиты','defense')} · ${game.stats.damage} ${tr('урона','damage')}</p></div><div class="inventory-gold">${icon('coin')}${s.gold}</div></div>
  <div class="survival-top"><div class="paperdoll">${slots}<canvas id="paperdoll" width="160" height="190"></canvas></div>
  <div class="small-workbench"><h3>${tr('Верстак · выберите рецепт','Workbench · choose a recipe')}</h3><select id="recipe-picker" aria-label="${tr('Рецепт','Recipe')}"><option value="">${tr('Выберите, что создать…','Choose what to craft…')}</option>${recipes.map(q => `<option value="${q.id}" ${r?.id === q.id ? 'selected' : ''}>${label(q.name)}${recipeItem(q).n > 1 ? ' × '+recipeItem(q).n : ''}</option>`).join('')}</select>
  <div class="craft-layout"><div class="craft-cells">${[0,1,2,3].map(i => `<button class="bag-cell" data-craft-cell="${i}" data-action="craftClear-${i}" title="${craftDraft[i] ? label(items[craftDraft[i]]) : tr('Перетащите материал','Drag an ingredient')}">${craftDraft[i] ? icon(itemIcon(craftDraft[i])) : ''}</button>`).join('')}</div>${icon('arrow')}<button class="craft-output bag-cell" data-action="craftOutput" ${!r || reason ? 'disabled' : ''}>${icon(r ? recipeItem(r).icon : 'book')}<small>${r ? recipeItem(r).name+' × '+recipeItem(r).n : tr('Результат','Output')}</small></button></div>
  ${r ? ingredientCounts(r.inputs)+`<p class="craft-status ${reason ? 'missing' : 'enough'}" role="status">${reason || tr('Материалы есть · можно создать','Ingredients ready · craft now')}</p><div class="gear-actions"><button class="button primary" data-action="craftMake-${r.id}-1" ${reason ? 'disabled' : ''}>${tr('Создать','Craft')} ${recipeItem(r).n > 1 ? '× '+recipeItem(r).n : ''}${r.gear ? tr(' и надеть',' & equip') : ''}</button>${batch > 1 ? `<button class="button secondary" data-action="craftMake-${r.id}-${batch}" ${reason ? 'disabled' : ''}>${tr('Создать всё','Craft all')} (${batch * recipeItem(r).n})</button>` : ''}</div>` : `<p>${tr('Выберите рецепт сверху: материалы расставятся автоматически. Создание тратит их только после нажатия «Создать». Можно также составить рецепт вручную в сетке 2 × 2.','Choose a recipe above to fill the grid automatically. Materials are spent only when you press Craft. You can also arrange them manually in the 2 × 2 grid.')}</p>`}
  </div></div>
  <div class="bag-description"><div><h3>${chosen ? chosen.name : tr('Предметы в рюкзаке','Backpack items')}</h3><p>${bagItemDescription(chosen)}</p></div>${selectedActions}</div>
  <div class="bag-filters">${[['all','Всё','All'],['gear','Снаряжение','Equipment'],['materials','Материалы','Materials'],['supplies','Расходники','Supplies']].map(([id,ru,en]) => `<button class="recipe-chip ${bagFilter === id ? 'active' : ''}" data-action="bagFilter-${id}" aria-pressed="${bagFilter === id}">${tr(ru,en)}</button>`).join('')}</div>
  <div class="block-backpack">${Array.from({length:Math.max(18,Math.ceil(entries.length/9)*9)},(_,i) => {const e=entries[i]; return `<button class="bag-cell ${e?.key===bagSelected ? 'selected' : ''}" data-bag-index="${all.indexOf(e) < 0 ? all.length+i : all.indexOf(e)}" ${e ? `data-bag-key="${e.key}" draggable="true" data-action="bagSelect-${e.key}" title="${e.name}" aria-label="${e.name} · ${e.n}"` : 'aria-label="'+tr('Пустая ячейка','Empty slot')+'"'}>${e ? icon(e.icon)+`<span class="bag-name">${e.name}</span><b>${e.n}</b>` : ''}</button>`;}).join('')}</div>
  <h3 class="small-heading">${tr('РЕЦЕПТЫ · НАЖМИТЕ, ЧТОБЫ СОБРАТЬ','RECIPES · CLICK TO PREPARE')}</h3><div class="recipe-list">${recipes.filter(q => !recipeMaterial || recipeMaterial in q.inputs).map(q => `<button class="recipe-chip ${r?.id===q.id ? 'active' : ''}" data-action="recipe-${q.id}" title="${materialText(q.inputs)}">${icon(recipeItem(q).icon)}<span>${label(q.name)}<small>${recipeItem(q).n} ${tr('шт.','items')} · ${q.camp ? tr('у костра','at camp') : tr('в рюкзаке','in backpack')}</small></span>${icon(game.craftReason(q.id) ? 'lock' : 'check')}</button>`).join('')}</div>
  <details class="inventory-details"><summary>${tr('Снаряжение: полные характеристики','Equipment: full details')}</summary>${weaponCards()}${armorCards()}${wearableCards('inventory')}</details>${btn(tr('Рыбалка и ремесло','Fishing & crafts'),'activities','secondary','fish')}`, 'inventory');
  document.querySelector('#recipe-picker').addEventListener('change', e => {
    if (e.target.value) action('recipe-'+e.target.value);
    else {craftDraft=[];showInventory();}
  });
  const ctx = document.querySelector('#paperdoll').getContext('2d'); ctx.imageSmoothingEnabled=false;
  drawHero(ctx,80,160,s.characterClass,{...s.appearance,player:true,equipment:s.equippedWearables,weapon:s.equippedWeapon,armor:s.equippedArmor,scale:3.5});
}
function purchaseActions(id, item, kind) {
  const s=game.save, level=item.level || 1, price=item.price || (kind === "weapon" ? 45 : 0),
    owned=(kind === "weapon" ? s.ownedWeapons : kind === "armor" ? s.ownedArmors : s.ownedWearables).includes(id),
    equipPrefix={weapon:"equip-",armor:"armorEquip-",wear:"wearEquip-"}[kind],
    buyPrefix={weapon:"buyWeapon-",armor:"armorBuy-",wear:"wearBuy-"}[kind],
    craftPrefix={weapon:"weaponCraft-",armor:"armorCraft-",wear:"wearCraft-"}[kind];
  if (owned) return `<button class="button secondary" data-action="${equipPrefix+id}" ${s.level < level ? 'disabled' : ''}>${s.level < level ? tr('Нужен уровень '+level,'Requires level '+level) : tr('Надеть / взять в руки','Equip')}</button>`;
  const canCraft=item.recipe && Object.entries(item.recipe).every(([k,n])=>(s.inventory[k]||0)>=n);
  return `<div class="gear-actions">${price ? `<button class="button secondary" data-action="${buyPrefix+id}" ${s.level < level || s.gold < price ? 'disabled' : ''}>${icon('coin')}${tr('Купить','Buy')} · ${price}</button>` : ''}${item.recipe ? `<button class="button secondary" data-action="${craftPrefix+id}" ${s.level < level || !canCraft ? 'disabled' : ''}>${tr('Создать','Craft')}</button>` : ''}</div>${s.level < level ? `<p class="purchase-reason">${tr('Нужен уровень '+level+' · ваш '+s.level,'Requires level '+level+' · yours '+s.level)}</p>` : price && s.gold < price ? `<p class="purchase-reason">${tr('Не хватает '+(price-s.gold)+' монет','Need '+(price-s.gold)+' more coins')}</p>` : ''}${item.recipe ? ingredientCounts(item.recipe) : ''}`;
}
function wearableCards(mode = "shop") {
  const s=game.save;
  return `<div class="armory-grid">${Object.entries(wearables).filter(([id,a])=>(!a.class || a.class === s.characterClass) && (mode === 'inventory' ? s.ownedWearables.includes(id) : true)).map(([id,a])=>`<article class="gear-card"><div class="gear-title">${icon(gearIcon(a.slot))}<h3>${label(a.name)}</h3></div><p>Lv. ${a.level} · +${a.defense} ${tr('защиты','defense')} · +${a.hp} HP</p>${s.equippedWearables[a.slot] === id ? `<span class="equipped-label">${icon('check')}${tr('Надето','Equipped')}</span>` : purchaseActions(id,a,'wear')}</article>`).join('')}</div>`;
}
function showActivities() {
  const a = game.save.activities;
  openModal(
    tr("Жизнь в долине", "Life in the valley"),
    `<p class="modal-intro">${tr("Сделайте удочку из 2 дерева и 1 волокна. Ищите знак рыбы на берегу или карте. Дождитесь поклёвки и нажмите E, пробел или кнопку, когда поплавок попадёт в зелёную полосу. Наживка расширяет полосу.", "Craft a rod from 2 wood and 1 fiber. Look for a fish on the shore or map. Wait for a bite, then press E, Space or the button when the float enters the green band. Bait widens the band.")}</p><div class="journal-stats"><span>${tr("Рыб поймано", "Fish caught")}<b>${a.catches}</b></span><span>${tr("Видов", "Species")}<b>${a.fishSpecies.length}/4</b></span><span>${tr("Создано предметов", "Recipes crafted")}<b>${a.recipes}</b></span><span>${tr("Собрано ягод", "Berries gathered")}<b>${a.berries}</b></span></div><p>${tr("Дождь удваивает улов. Ночью встречается лунная рыба, в море — макрель. Среди находок бывают жемчуг и манускрипты. Рыбу готовят у костра, ягодные кусты восстанавливаются через 2 минуты игрового времени.", "Rain doubles catches. Moonfish appear at night, mackerel at sea. Finds may include pearls and manuscripts. Cook fish at campfires; berry bushes regrow after 2 minutes of game time.")}</p>${btn(tr("К верстаку", "Open crafting"), "inventory", "secondary", "bag")}`,
    "activities",
  );
}
function showFishing() {
  openModal(
    tr("Рыбалка", "Fishing"),
    `<div class="fishing-scene">${icon("fish")}<span id="fish-phase"></span></div><div class="fishing-meter"><i id="fish-target"></i><b id="fish-cursor"></b></div><p id="fish-help"></p><div class="modal-actions">${btn(tr("Подсечь · E / SPACE", "Hook · E / SPACE"), "fishTap", "primary", "rod")}${btn(tr("Ещё заброс", "Cast again"), "fishAgain", "secondary")}${btn(tr("Уйти с берега", "Leave the shore"), "close", "secondary")}</div>`,
    "fishing",
  );
  updateFishingUI();
}
function updateFishingUI() {
  if (modal !== "fishing" || !game.fishing) return;
  const f = game.fishing,
    w = f.bait ? 0.17 : 0.12;
  document.querySelector("#fish-target").style.cssText =
    `left:${(f.target - w) * 100}%;width:${w * 200}%`;
  document.querySelector("#fish-cursor").style.left =
    `${(f.cursor || 0) * 100}%`;
  document.querySelector("#fish-phase").textContent = {
    waiting: tr("Поплавок на воде…", "Waiting for a bite…"),
    bite: tr("Клюёт!", "A bite!"),
    caught: tr("Поймано!", "Caught!"),
    miss: tr("Рыба сорвалась", "The fish escaped"),
  }[f.phase];
  document.querySelector("#fish-help").textContent =
    f.phase === "caught"
      ? label(
          {
            carp: ["Карп", "Carp"],
            trout: ["Форель", "Trout"],
            moonfish: ["Лунная рыба", "Moonfish"],
            mackerel: ["Макрель", "Mackerel"],
          }[f.species],
        ) + (f.rare ? " · " + tr("Редкая находка!", "Rare find!") : "")
      : tr(
          "Подсеките, когда бегунок будет в зелёной зоне.",
          "Hook when the cursor is inside the green band.",
        );
  document.querySelector('[data-action="fishTap"]').disabled =
    f.phase !== "bite";
  document.querySelector('[data-action="fishAgain"]').disabled = ![
    "caught",
    "miss",
  ].includes(f.phase);
}
function weaponCards(mode = "inventory") {
  const s = game.save;
  return `<div class="armory-grid">${classWeapons(s.characterClass)
    .filter(([id, w]) =>
      mode === "shop" ? !w.source : s.ownedWeapons.includes(id),
    )
    .map(([id, w]) => {
      const owned = s.ownedWeapons.includes(id),
        equipped = s.equippedWeapon === id,
        locked = s.level < (w.level || 1),
        stats = deriveStats(
          { ...s, equippedWeapon: id },
          classes[s.characterClass],
        );
      return `<article class="gear-card ${equipped ? "equipped" : ""}"><div class="gear-title">${icon(w.icon)}<div><h3>${label(w.name)}</h3><small>${tr("УРОВЕНЬ", "LEVEL")} ${w.level || 1} · ${w.source ? tr("ТРОФЕЙ", "BOSS LOOT") : w.rarity ? tr("РЕДКОЕ", "RARE") : tr("ОБЫЧНОЕ", "COMMON")}</small></div></div><p>${label(w.desc)}</p><div class="gear-stats">${stats.damage} ${tr("урона", "damage")} · ${w.cooldown.toFixed(2)} ${tr("с", "s")} · ${Math.round(w.range / TILE)} ${tr("клеток", "tiles")}${w.element ? ` · ${tr("Стихия", "Element")}: ${label({ fire: ["Огонь", "Fire"], ice: ["Лёд", "Ice"], poison: ["Яд", "Poison"], lightning: ["Молния", "Lightning"], void: ["Тьма", "Void"] }[w.element])}` : ""}</div>${equipped ? `<span class="equipped-label">${icon("check")}${tr("В руках", "Equipped")}</span>` : purchaseActions(id,w,'weapon')}</article>`;
    })
    .join("")}</div>`;
}
function skillBenefit(a, rank) {
  const power = 1 + Math.max(0,rank-1)*.25, effect = a.effect || a.id;
  if (effect === 'bulwark') return tr(`Защита −55% урона · ${5+rank} с`, `Guard −55% damage · ${5+rank} s`);
  if (effect === 'stealth') return tr(`Невидимость ${(a.duration || 5)+rank-1} с`, `Invisible ${(a.duration || 5)+rank-1} s`);
  if (effect === 'heal') return tr(`Лечение ${Math.round(20*power)}% HP`, `Heal ${Math.round(20*power)}% HP`);
  if (effect === 'restore') return tr(`Восстановление ${40*power} энергии`, `Restore ${40*power} energy`);
  if (effect === 'focus' || effect === 'haste') return tr(`Длительность ${8+rank} с`, `Duration ${8+rank} s`);
  if (effect === 'blink') return tr(`Дальность ${160+(rank-1)*20}`, `Range ${160+(rank-1)*20}`);
  return tr(`Сила ${Math.round(power*100)}%`, `Power ${Math.round(power*100)}%`);
}
function showSkills() {
  const s=game.save, profile=disciplines[weaponDiscipline(s)], bar=barFor(s);
  openModal(tr('Книга умений','Skill book'), `<div class="skills-intro"><div><p>${label(classes[s.characterClass].name)} · ${label(profile.name)}</p><span>${tr('Первое изучение открывает приём. Усиление требует только уровня героя и одного очка. Очки получаете при повышении уровня.','First learning unlocks an ability. Upgrades require only hero level and one point. Gain points by leveling up.')}</span></div><strong>${s.skillPoints}<small>${tr('ОЧКОВ','POINTS')}</small></strong></div>
  <p class="skill-rules">${tr('Ранг II: начальный уровень приёма +2. Ранг III: +5. Обучение у наставника, манускрипт и материалы оплачиваются только при первом изучении.','Rank II: ability starting level +2. Rank III: +5. Mentor training, manuscripts and materials are paid only on first learning.')}</p>
  <div class="ability-bar-editor">${bar.map((id,i) => `<button class="bar-edit-slot" data-bar-slot="${i}" data-action="barRotate-${i}" draggable="true"><kbd>${keyLabel(game.controls.bindings['skill'+(i+1)])}</kbd>${icon(skillConfig(s,i).icon)}<span>${label(skillConfig(s,i).name)}</span></button>`).join('')}</div>
  <div class="skill-tree">${skillsFor(s).map((a,i) => {
    const rank=abilityRank(s,a.id), reason=game.acquisitionReason(a.id), cd=n => (a.cooldown-Math.max(0,n-1)*.5).toFixed(1),
      source={practice:tr(`Освоить школу: ${Math.min(8,s.weaponPractice[weaponDiscipline(s)] || 0)}/8 попаданий обычной атакой`, `Learn school: ${Math.min(8,s.weaponPractice[weaponDiscipline(s)] || 0)}/8 basic attack hits`), mentor:tr('Первое изучение: наставник класса в деревне · 60 монет','First learning: class mentor in the village · 60 coins'), tome:tr('Первое изучение: 1 манускрипт вашего класса. Тайники, данжи или редкий улов.','First learning: 1 manuscript for your class. Chests, dungeons or rare catches.'), quest:tr('Первое изучение: выполните личное задание из описания.','First learning: complete the personal quest in the description.'), ritual:tr('Первое изучение: у костра · 3 кристалла + 1 эссенция.','First learning: at camp · 3 crystals + 1 essence.')}[a.source];
    return `<article class="skill-node ${rank ? 'unlocked' : 'locked'}" draggable="true" data-ability="${a.id}"><div class="skill-node-icon" draggable="true" data-ability="${a.id}" title="${tr('Перетащите значок на панель','Drag icon onto the bar')}">${icon(a.icon)}</div><div class="skill-node-main"><div class="skill-node-top"><h3>${label(a.name)}</h3><kbd>${keyLabel(game.controls.bindings['skill'+(bar.indexOf(a.id)+1)])}</kbd></div><p>${label(a.desc)}</p><div class="skill-ranks">${[1,2,3].map(n=>`<i class="${rank >= n ? 'filled' : ''}"></i>`).join('')}<span>${rank ? tr('Изучено · ранг ','Learned · rank ')+rank+'/3' : tr('Ещё не изучено','Not learned yet')}</span></div>
    ${rank ? `<div class="skill-current">${skillBenefit(a,rank)} · ${a.cost} ${tr('энергии','energy')} · ${tr('откат','cooldown')} ${cd(rank)} ${tr('с','s')}</div>` : `<p class="skill-source">${source}</p>`}
    ${rank < 3 ? `<div class="skill-preview"><b>${tr('Следующий ранг','Next rank')} ${rank+1} · Lv. ${rankLevel(a,rank+1)}</b><span>${rank ? skillBenefit(a,rank)+' → ' : ''}${skillBenefit(a,rank+1)} · ${tr('откат','cooldown')} ${rank ? cd(rank)+' → ' : ''}${cd(rank+1)} ${tr('с','s')}</span></div>` : ''}
    <p class="skill-status ${reason && rank < 3 ? 'missing' : 'enough'}">${reason || (rank ? tr('Можно усилить · 1 очко','Upgrade available · 1 point') : tr('Можно изучить · 1 очко','Learning available · 1 point'))}</p>
    <div class="skill-placement"><small>${tr('Ячейка панели:','Bar slot:')}</small>${[0,1,2,3,4].map(n=>`<button data-action="assign-${a.id}-${n}" aria-label="${tr('Назначить на ','Assign to ')}${keyLabel(game.controls.bindings['skill'+(n+1)])}" class="${bar[n]===a.id ? 'active' : ''}">${keyLabel(game.controls.bindings['skill'+(n+1)])}</button>`).join('')}</div>
    ${!rank && a.source === 'mentor' && !s.activeDungeon ? btn(tr('Показать наставника на карте','Show mentor on map'),'locateMentor','secondary','map') : ''}</div>
    <button class="button ${reason ? 'secondary' : 'primary'} skill-learn" data-action="learn-${i}" ${reason ? 'disabled' : ''}>${rank>=3 ? tr('Максимум','Maximum') : rank ? tr('Усилить до ранга '+(rank+1)+' · 1 очко','Upgrade to rank '+(rank+1)+' · 1 point') : tr('Изучить · 1 очко','Learn · 1 point')}</button></article>`;
  }).join('')}</div><div class="guide-note"><p>${tr('Ранги одной школы сохраняются при смене оружия. Клинки следопыта дают невидимость, лук — залп, арбалет — пробитие. Перетащите значок умения на панель, чтобы сменить клавишу.','School ranks persist when switching weapons. Ranger blades grant invisibility, bows grant volleys, crossbows grant piercing shots. Drag an ability icon onto the bar to change its key.')}</p></div>${masteriesPanel()}`, 'skills');
}
let bindingAwait = null;
function showControls() {
  bindingAwait = null;
  const labels = {
    attack: ["Атака", "Attack"],
    skill1: ["Первое умение", "First ability"],
    skill2: ["Второе умение", "Second ability"],
    skill3: ["Третье умение", "Third ability"],
    skill4: ["Четвёртое умение", "Fourth ability"],
    skill5: ["Пятое умение", "Fifth ability"],
    dodge: ["Рывок", "Dodge"],
    interact: ["Взаимодействие", "Interact"],
    potion: ["Зелье", "Potion"],
    inventory: ["Рюкзак", "Bag"],
    journal: ["Журнал", "Journal"],
    map: ["Карта", "Map"],
    skills: ["Книга умений", "Skill book"],
  };
  openModal(
    tr("Управление и отклик", "Controls & feedback"),
    `<div class="control-toggles">${[
      [
        "autoAim",
        tr("Автонаведение на ближайшего врага", "Aim at the nearest enemy"),
        tr(
          "Если выключить — атаки направляются к курсору.",
          "When disabled, attacks aim at your cursor.",
        ),
      ],
      [
        "clickAttack",
        tr("Нажатие по врагу — атака", "Click an enemy to attack"),
        tr(
          "Нажатие на свободную тропу всегда задаёт маршрут.",
          "Clicking a clear trail always sets a route.",
        ),
      ],
      [
        "screenShake",
        tr("Отклик камеры при ударе", "Camera shake on impact"),
        "",
      ],
      ["showDamage", tr("Показывать числа урона", "Show damage numbers"), ""],
    ]
      .map(
        ([key, title, desc]) =>
          `<label class="control-toggle"><span><b>${title}</b>${desc ? `<small>${desc}</small>` : ""}</span><input type="checkbox" data-control="${key}" ${game.controls[key] ? "checked" : ""}></label>`,
      )
      .join(
        "",
      )}</div><h3 class="small-heading">${tr("КЛАВИШИ · НАЖМИТЕ ДЛЯ ИЗМЕНЕНИЯ", "KEYS · CLICK TO REBIND")}</h3><div class="key-bindings">${Object.entries(
      labels,
    )
      .map(
        ([key, name]) =>
          `<div><span>${label(name)}</span><button class="binding-button" data-rebind="${key}">${keyLabel(game.controls.bindings[key])}</button></div>`,
      )
      .join(
        "",
      )}</div><p class="fine-print">${tr("WASD, стрелки и Esc остаются фиксированными. При выборе занятой клавиши действия меняются местами. На телефоне удерживайте кнопку атаки для серии ударов.", "WASD, arrow keys and Esc stay fixed. Choosing an occupied key swaps the two actions. On a phone, hold the attack button for repeated strikes.")}</p>${btn(tr("Вернуть стандартные", "Reset defaults"), "resetControls", "secondary", "reset")}`,
    "controls",
  );
}
function showCaptain(o = landmarks.find((o) => o.id === "captain")) {
  const s = game.save;
  let text, buttons;
  if (!s.flags.expedition) {
    text = tr(
      "В Янтарной роще поселились быстрые волки, а болотные тропы охраняют стрелковые стражи. Помоги обезопасить путь: победи 6 волков и 4 стражей. Я дам тебе оружие, 160 монет и очко навыков.",
      "Swift wolves roam Amberwood, and ranged sentinels guard the marsh trails. Defeat 6 wolves and 4 sentinels to secure the route. I will reward you with a weapon, 160 coins and a skill point.",
    );
    buttons = btn(
      tr("Принять поручение", "Accept the expedition"),
      "acceptExpedition",
      "primary",
      "flag",
    );
  } else if (!s.flags.expeditionDone) {
    text = tr(
      `Волки: ${s.kills.wolf || 0}/6. Стражи: ${s.kills.sentinel || 0}/4. Тропы ведут на север к роще и на юг к побережью. Берегись каменных титанов!`,
      `Wolves: ${s.kills.wolf || 0}/6. Sentinels: ${s.kills.sentinel || 0}/4. Trails lead north to the grove and south to the coast. Beware the stone titans!`,
    );
    buttons = btn(
      tr("Получить награду", "Claim reward"),
      "expeditionReward",
      "primary",
      "coin",
    );
  } else {
    text = tr(
      "Спасибо! Тропы снова безопаснее. Отдохни у костра: после посещения лагеря можно быстро вернуться к нему через карту. Вдали ещё остаются тайники и два каменных титана.",
      "Thank you! The trails are safer again. Rest at a campfire to unlock it as a fast-travel destination on your map. Secrets and two stone titans still await in the farlands.",
    );
    buttons = btn(
      tr("Продолжить путь", "Continue"),
      "close",
      "primary",
      "arrow",
    );
  }
  dialog(o, text, buttons);
}
let mapState = { zoom: 1, x: (WIDTH * TILE) / 2, y: (HEIGHT * TILE) / 2 },
  mapDrag = null;
function mapDimensions() {
  return game.world.bounds || { width: WIDTH, height: HEIGHT };
}
function mapTransform(canvas, large) {
  const { width, height } = mapDimensions();
  const zoom = large ? mapState.zoom : 1,
    sx = (canvas.width / (width * TILE)) * zoom,
    sy = (canvas.height / (height * TILE)) * zoom;
  return {
    sx,
    sy,
    ox: large ? mapState.x - canvas.width / (2 * sx) : 0,
    oy: large ? mapState.y - canvas.height / (2 * sy) : 0,
  };
}
function drawMap(canvas, large) {
  if (!canvas) return;
  const c = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height,
    s = game.save,
    { sx, sy, ox, oy } = mapTransform(canvas, large);
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#19382c";
  c.fillRect(0, 0, w, h);
  c.save();
  c.translate(-ox * sx, -oy * sy);
  const { width, height } = mapDimensions();
  c.drawImage(
    game.terrain.overview,
    0,
    0,
    width * 4,
    height * 4,
    0,
    0,
    width * TILE * sx,
    height * TILE * sy,
  );
  c.fillStyle = "#314f3d25";
  c.fillRect(0, 0, width * TILE * sx, height * TILE * sy);
  for (const o of game.world.objects)
    if (o.type === "house") {
      c.fillStyle = "#dac199";
      c.fillRect(o.x * sx - 3, o.y * sy - 2, 6, 4);
    }
  if (large && !s.activeDungeon) {
    const labels = [
      ["village", 24, 61],
      ["forest", 44, 42],
      ["mountain", 85, 16],
      ["outpost", 73, 35],
      ["ruins", 91, 68],
      ["lake", 50, 73],
      ["amberwood", 139, 36],
      ["marsh", 146, 63],
      ["harbor", 141, 84],
      ["coast", 92, 115],
      ["tundra", 213, 20],
      ["highlands", 226, 65],
      ["deadwood", 220, 100],
      ["frontier", 190, 151],
      ["badlands", 230, 155],
      ["island", 66, 176],
    ];
    c.font = "11px system-ui";
    c.textAlign = "center";
    for (const [key, x, y] of labels) {
      const text = label(regions[key]),
        tw = c.measureText(text).width;
      c.fillStyle = "#172e25cb";
      c.fillRect(x * TILE * sx - tw / 2 - 6, y * TILE * sy - 20, tw + 12, 19);
      c.fillStyle = "#f2e4c6";
      c.fillText(text, x * TILE * sx, y * TILE * sy - 7);
    }
  }
  if (!s.activeDungeon)
    for (const portal of landmarks.filter((o) => o.type === "entrance")) {
      c.fillStyle = dungeons[portal.dungeon].color;
      c.beginPath();
      c.arc(portal.x * sx, portal.y * sy, large ? 5 : 3, 0, Math.PI * 2);
      c.fill();
      if (large) {
        c.font = "10px system-ui";
        c.textAlign = "center";
        c.fillStyle = "#f5e8d0";
        c.fillText(
          label(dungeons[portal.dungeon].name),
          portal.x * sx,
          portal.y * sy + 17,
        );
      }
    }
  if (large && !s.activeDungeon)
    for (const o of landmarks.filter((o) =>
      ["fishspot", "trainer"].includes(o.type),
    )) {
      c.fillStyle = o.type === "fishspot" ? "#94d0df" : "#d3b77f";
      c.beginPath();
      c.arc(o.x * sx, o.y * sy, 4, 0, Math.PI * 2);
      c.fill();
      c.font = "10px system-ui";
      c.textAlign = "center";
      if (o.type === "fishspot" || o.id === "bladeMentor")
        c.fillText(
          o.type === "fishspot"
            ? tr("Рыбалка", "Fishing")
            : tr("Наставники", "Mentors"),
          o.x * sx,
          o.y * sy + 14,
        );
    }
  if (large && s && !s.activeDungeon)
    for (const camp of landmarks.filter((o) => o.type === "camp")) {
      const unlocked = s.visitedCamps.includes(camp.id);
      c.fillStyle = unlocked ? "#e6c985" : "#536e60";
      c.fillRect(camp.x * sx - 4, camp.y * sy - 4, 8, 8);
      c.strokeStyle = "#193d2c";
      c.strokeRect(camp.x * sx - 4, camp.y * sy - 4, 8, 8);
    }
  if (s.activeDungeon)
    for (const o of game.world.objects.filter((o) =>
      ["stairs", "exit", "dungeonChest"].includes(o.type),
    )) {
      c.fillStyle = o.type === "dungeonChest" ? "#bdb18b" : "#9ee4e8";
      c.fillRect(o.x * sx - 3, o.y * sy - 3, 6, 6);
      if (large && o.type !== "dungeonChest") {
        c.fillStyle = "#d9e8d3";
        c.font = "10px system-ui";
        c.textAlign = "center";
        c.fillText(
          o.type === "stairs" ? tr("Лестница", "Stairs") : tr("Выход", "Exit"),
          o.x * sx,
          o.y * sy + 15,
        );
      }
    }
  const goal = s && objectiveTarget(game);
  for (const [p, color, radius] of [
    [goal, "#f9d67f", large ? 5 : 3],
    [s, "#ffefc9", large ? 5 : 3],
    [game.waypoint, "#9ee4e8", large ? 6 : 3],
  ])
    if (p) {
      c.fillStyle = color;
      c.beginPath();
      c.arc(p.x * sx, p.y * sy, radius, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#233e31";
      c.lineWidth = 2;
      c.stroke();
    }
  c.restore();
  if (large) {
    const zoomLabel = document.querySelector("#map-zoom-value");
    if (zoomLabel)
      zoomLabel.textContent = Math.round(mapState.zoom * 100) + "%";
    const marker = document.querySelector("#map-marker-label");
    if (marker)
      marker.textContent = game.waypoint
        ? tr(
            `Отметка: ${Math.round(Math.hypot(game.waypoint.x - s.x, game.waypoint.y - s.y) / TILE)} клеток`,
            `Marker: ${Math.round(Math.hypot(game.waypoint.x - s.x, game.waypoint.y - s.y) / TILE)} tiles`,
          )
        : tr(
            "Нажмите на карту, чтобы поставить отметку. Перетаскивайте для обзора.",
            "Click to place a marker. Drag to explore.",
          );
  }
}
function showMap() {
  const { width, height } = mapDimensions();
  mapState = { zoom: 1, x: (width * TILE) / 2, y: (height * TILE) / 2 };
  openModal(
    game.save.activeDungeon
      ? label(dungeons[game.save.activeDungeon.id].name)
      : tr("Карта забытой долины", "Map of the forgotten valley"),
    `<div class="map-controls"><span>${width} × ${height} ${tr("клеток", "tiles")}</span><div><button class="icon-button" data-action="mapZoomOut" aria-label="${tr("Уменьшить карту", "Zoom out")}">${icon("minus")}</button><b id="map-zoom-value">100%</b><button class="icon-button" data-action="mapZoomIn" aria-label="${tr("Увеличить карту", "Zoom in")}">${icon("plus")}</button><button class="icon-button" data-action="mapCenter" aria-label="${tr("Найти героя", "Find your hero")}">${icon("target")}</button></div></div><div class="map-wrap"><canvas id="large-map" width="860" height="680"></canvas><span class="map-north">N<br>↑</span></div><div class="map-route"><span id="map-marker-label"></span>${btn(tr("Идти к отметке", "Walk to marker"), "mapWalk", "secondary", "flag")}</div><div class="map-camps" ${game.save.activeDungeon ? "hidden" : ""}><span>${tr("БЫСТРОЕ ПЕРЕМЕЩЕНИЕ · ОТКРОЙТЕ КОСТРЫ", "FAST TRAVEL · DISCOVER CAMPFIRES")}</span><div>${landmarks
      .filter((o) => o.type === "camp" && !game.save.activeDungeon)
      .map(
        (camp) =>
          `<button class="camp-travel ${game.save.visitedCamps.includes(camp.id) ? "unlocked" : ""}" data-action="travel-${camp.id}" ${game.save.visitedCamps.includes(camp.id) ? "" : "disabled"}>${icon(game.save.visitedCamps.includes(camp.id) ? "home" : "lock")}<span>${label(camp.name)}</span></button>`,
      )
      .join(
        "",
      )}</div></div><div class="map-legend"><span><i class="map-dot player-dot"></i>${tr("Ваш герой", "Your hero")}</span><span><i class="map-dot goal-dot"></i>${tr("Текущая цель", "Current objective")}</span><span><i class="map-dot" style="background:#9ee4e8"></i>${tr("Ваша отметка", "Your marker")}</span></div>`,
    "world-map",
  );
  drawMap(document.querySelector("#large-map"), true);
}
function mapPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect(),
    t = mapTransform(canvas, true);
  return {
    x:
      t.ox + (((event.clientX - rect.left) / rect.width) * canvas.width) / t.sx,
    y:
      t.oy +
      (((event.clientY - rect.top) / rect.height) * canvas.height) / t.sy,
  };
}
function showPause() {
  openModal(
    tr("У костра можно выдохнуть", "Take a breath by the fire"),
    `<p class="modal-intro">${tr("Ваше путешествие сохранено. Долина подождёт.", "Your journey is saved. The valley will wait.")}</p><div class="pause-buttons">${btn(tr("Продолжить", "Resume"), "close", "primary", "play")}${btn(tr("Как играть", "How to play"), "help", "secondary", "book")}${btn(tr("Звук: ", "Sound: ") + (audio.enabled ? tr("включён", "on") : tr("выключен", "off")), "soundPause", "secondary", audio.enabled ? "sound" : "mute")}${btn(tr("Управление", "Controls"), "controls", "secondary", "settings")}${btn(tr("Полный экран", "Fullscreen"), "fullscreen", "secondary", "fullscreen")}${btn(tr("Главное меню", "Main menu"), "leave", "secondary", "home")}</div><p class="fine-print">${tr("Сохранение обновляется после наград, покупок и каждые 3 секунды.", "Your save updates after rewards, purchases and every 3 seconds.")}</p>`,
    "pause",
  );
}
function showDeath() {
  openModal(
    tr("Даже герою нужен отдых", "Even a hero needs rest"),
    `<div class="death-symbol">${icon("leaf")}</div><p class="modal-intro">${tr("Жители нашли вас на тропе и помогли вернуться к последнему костру. Снаряжение, опыт и задания остаются с вами. Потеря: 12% монет (до 200). Забег в подземелье сбрасывается; выпавшие трофеи ждут у входа.", "Villagers found you on the trail and will bring you back to your last campfire. Your equipment, experience and quests stay with you. Cost: 12% of coins (up to 200). Your dungeon run resets; dropped trophies wait at its entrance.")}</p>${btn(tr("Вернуться к костру", "Return to the campfire"), "respawn", "primary", "home")}`,
    "death",
  );
}
function showVictory() {
  openModal(
    tr("Свет вернулся в долину", "Light returns to the valley"),
    `<div class="victory-symbol">${icon("crystal")}</div><p class="modal-intro">${tr("Древний хранитель обрёл покой. Обелиски вновь освещают тропы, а жители будут помнить ваше имя. Вернитесь к Оливеру, чтобы закончить историю и получить награду.", "The ancient guardian is at peace. The obelisks light the trails once more, and the villagers will remember your name. Return to Oliver to finish the story and claim your reward.")}</p>${btn(tr("Продолжить путешествие", "Continue your journey"), "close", "primary", "arrow")}`,
    "victory",
  );
}
function interact(o) {
  const s = game.save;
  if (o.type === "trainer") {
    if (o.style !== s.characterClass) {
      toast(
        tr(
          "Вам нужен наставник вашего класса.",
          "Visit your own class mentor.",
        ),
      );
      return;
    }
    showSkills();
    return;
  }
  if (o.type === "berryBush") {
    toast(
      game.harvestBerry(o)
        ? tr("Собрано 2 ягоды.", "Collected 2 berries.")
        : tr("Куст ещё восстанавливается.", "The bush is still regrowing."),
    );
    return;
  }
  if (o.type === "fishspot") {
    if (game.startFishing(o)) showFishing();
    return;
  }
  if (o.type === "entrance") {
    showDungeon(o.dungeon);
    return;
  }
  if (o.type === "board") {
    showContracts();
    return;
  }
  if (o.type === "loot") {
    showLoot(o);
    return;
  }
  if (o.type === "dungeonChest") {
    if (game.lootChest(o))
      toast(
        tr(
          "Сундук: материалы, монеты и зелье.",
          "Chest: materials, coins and a potion.",
        ),
      );
    return;
  }
  if (o.type === "exit") {
    showDungeonExit();
    return;
  }
  if (o.type === "stairs") {
    if (game.nextDungeonFloor()) {
      renderHUD();
      toast(tr("Переход завершён.", "Transition complete."));
    }
    return;
  }
  if (["herb", "ore", "crystal", "chest", "wood"].includes(o.type)) {
    game.collect(o);
    return;
  }
  if (o.type === "camp") {
    openModal(
      label(o.name),
      `<div class="camp-symbol">${icon("sun")}</div><p class="modal-intro">${tr("Тихий треск огня, тёплый чай и короткая передышка. Отдых восстанавливает здоровье и энергию, занимает игровое время и сохраняет точку возвращения. Рядом с врагами отдых недоступен.", "A crackling fire, warm tea and a moment to rest. Rest restores health and energy, advances world time and sets your return point. You cannot rest near enemies.")}</p><div class="dialog-actions">${btn(tr("Отдохнуть бесплатно", "Rest for free"), `rest-${o.id}`, "primary", "heart")}${btn(tr("Дождаться утра", "Wait until morning"), `waitMorning-${o.id}`, "secondary", "sun")}${btn(tr("Дождаться ночи", "Wait until night"), `waitNight-${o.id}`, "secondary", "moon")}${platform.hasAds ? btn(tr("Реклама → 2 зелья", "Watch an ad → 2 potions"), "rewarded", "secondary", "potion") : ""}</div>`,
      "camp",
    );
    return;
  }
  if (o.type === "rune") {
    if (s.flags[o.id]) {
      toast(
        tr(
          "Обелиск уже светится. Долина помнит вашу помощь.",
          "The obelisk already glows. The valley remembers your help.",
        ),
      );
      return;
    }
    if (canActivate(s, o.id)) {
      s.flags[o.id] = true;
      s.quest = o.id === "forestRune" ? 2 : 4;
      game.addXp(45);
      game.persist();
      game.audio.effect("level");
      updateHUD();
      toast(
        tr(
          "Обелиск пробудился! Задание обновлено.",
          "The obelisk has awakened! Quest updated.",
        ),
      );
    } else
      toast(
        tr(
          "Сначала выполните задания обелиска в журнале.",
          "Complete the obelisk tasks in your journal first.",
        ),
      );
    return;
  }
  if (o.type === "altar") {
    if (s.flags.bossDefeated) {
      toast(
        tr(
          "Сердце долины вновь сияет.",
          "The Heart of the valley shines again.",
        ),
      );
      return;
    }
    if (s.quest < 5) {
      toast(
        tr(
          "Сначала восстановите оба обелиска и поговорите с Рином.",
          "Restore both obelisks and speak to Rin first.",
        ),
      );
      return;
    }
    if (s.flags.bossAwake) {
      toast(
        tr(
          "Хранитель рядом. Уклоняйтесь от его кругового удара!",
          "The guardian is nearby. Dodge its circular strike!",
        ),
      );
      return;
    }
    openModal(
      tr("Древний хранитель", "Ancient guardian"),
      `<p class="modal-intro">${tr("Кристаллы отзываются на свет обелисков. Когда вы коснётесь Сердца долины, хранитель пробудится. Приготовьте зелья и следите за кругом его атаки.", "The crystals respond to the obelisks’ light. Touch the Heart of the valley to awaken the guardian. Prepare your potions and watch for its attack circle.")}</p>${btn(tr("Пробудить хранителя", "Awaken the guardian"), "awaken", "primary", "crystal")}`,
      "dialog",
    );
    return;
  }
  if (o.id === "sign") {
    toast(
      tr(
        "Северо-восток — лес и горы. Юго-восток — древние руины.",
        "Northeast: woods and mountains. Southeast: ancient ruins.",
      ),
    );
    return;
  }
  if (o.id === "elder") {
    if (s.quest === 0)
      dialog(
        o,
        tr(
          "Здравствуй, путник. Когда-то два обелиска хранили покой нашей долины. Теперь их свет угас. Начни с Шепчущего леса: помоги с пятью слизнями, найди три лунные травы и коснись обелиска.",
          "Welcome, traveler. Two obelisks once kept our valley at peace. Their light has faded. Begin in the Whispering Woods: defeat five slimes, find three moonleaves and touch the obelisk.",
        ),
        btn(
          tr("Я помогу долине", "I will help the valley"),
          "acceptMain",
          "primary",
          "flag",
        ),
      );
    else if (s.quest === 2)
      dialog(
        o,
        tr(
          "Лес снова дышит свободно! Вот награда за твою помощь. Теперь отправляйся к Серебряным вершинам: победи трёх големов, собери три кристалла и зажги второй обелиск. Рин в Высоком Ключе расскажет о руинах.",
          "The woods can breathe again! Here is your reward. Now travel to the Silver Peaks: defeat three golems, gather three crystals and light the second obelisk. Rin in Highspring will tell you about the ruins.",
        ),
        btn(
          tr("Получить 80 монет и 70 XP", "Claim 80 coins and 70 XP"),
          "forestReward",
          "primary",
          "coin",
        ),
      );
    else if (s.quest === 6)
      dialog(
        o,
        tr(
          "Ты вернул свет Эльдерии. Мы будем рассказывать твою историю у костра. Прими наш дар — он поможет тебе открыть все оставшиеся тайны долины.",
          "You restored Elderia’s light. We will tell your story by the fire. Accept our gift — it will help you uncover the valley’s remaining secrets.",
        ),
        btn(
          tr("Завершить историю · 200 монет", "Finish the story · 200 coins"),
          "finalReward",
          "primary",
          "crystal",
        ),
      );
    else
      dialog(
        o,
        s.quest === 7
          ? tr(
              "Наша долина всегда будет твоим домом. Загляни к Мире и Браму, если ещё не помог им. В глубинах ждут четыре владыки, а по миру разбросаны сорок тайников.",
              "Our valley will always be your home. Visit Mira and Bram if they still need help. Four dungeon lords await below, and forty hidden chests are scattered across the world.",
            )
          : tr(
              "Следуй подсказкам в журнале. Лесной обелиск стоит на севере леса, а горный — на высокой площадке. У костра всегда можно бесплатно восстановить силы.",
              "Follow your journal’s guidance. The forest obelisk is north of the woods, and the mountain obelisk stands on a high plateau. You can always recover for free at a campfire.",
            ),
        btn(tr("Продолжить", "Continue"), "close", "primary", "arrow"),
      );
    return;
  }
  if (o.id === "scout") {
    if (s.quest === 4)
      dialog(
        o,
        tr(
          "Свет вершин вернулся! С двумя обелисками можно разбудить Сердце долины. Иди на юго-восток, к древним руинам. Хранитель силён, но медлителен: красный круг предупредит об ударе.",
          "The peaks shine again! With both obelisks lit, you can awaken the Heart of the valley. Head southeast to the old ruins. The guardian is strong but slow: a red circle will warn you of its strike.",
        ),
        btn(
          tr("Получить 90 монет и 80 XP", "Claim 90 coins and 80 XP"),
          "mountainReward",
          "primary",
          "coin",
        ),
      );
    else
      dialog(
        o,
        tr(
          "Тропы на севере ведут к кристаллам и големам. Улучши снаряжение у Брама, если бой даётся тяжело. Каждый обелиск отзывается только на помощь долине.",
          "The northern trails lead to crystals and golems. Upgrade your equipment at Bram’s if battles feel hard. Each obelisk responds only to those who help the valley.",
        ),
        btn(tr("Спасибо, Рин", "Thanks, Rin"), "close", "primary", "arrow"),
      );
    return;
  }
  if (o.id === "herbalist") {
    showHerbalist(o);
    return;
  }
  if (o.id === "smith") showSmith(o);
  if (o.id === "captain") showCaptain(o);
}
function showHerbalist(o = landmarks.find((x) => x.id === "herbalist")) {
  const s = game.save;
  const quest = s.flags.herbQuestDone
    ? `<div class="shop-note">${icon("check")}${tr("Запасы для Миры · завершено", "Supplies for Mira · completed")}</div>`
    : !s.flags.herbQuest
      ? `<div class="shop-quest"><p>${tr("Поможете пополнить запасы? Принесите 6 лунных трав — получите 3 зелья и 50 монет.", "Help me restock? Bring 6 moonleaves for 3 potions and 50 coins.")}</p>${btn(tr("Взять задание", "Accept quest"), "acceptHerbs", "secondary", "flag")}</div>`
      : `<div class="shop-quest"><p>${tr(`Лунная трава: ${s.inventory.herb}/6. Награда: 3 зелья и 50 монет.`, `Moonleaf: ${s.inventory.herb}/6. Reward: 3 potions and 50 coins.`)}</p>${btn(tr("Передать травы", "Give herbs"), "herbReward", "secondary", "leaf")}</div>`;
  dialog(
    o,
    tr(
      "Хорошее зелье начинается с хорошей травы. Берегите себя в дороге! Вы также можете варить зелья прямо в рюкзаке.",
      "A good potion starts with a good herb. Stay safe on your travels! You can also brew potions in your backpack.",
    ),
    btn(tr("До встречи", "See you soon"), "close", "secondary"),
    `${quest}<div class="shop-row"><span>${icon("potion")}${tr("Зелье здоровья · +65 HP", "Health potion · +65 HP")}</span>${btn("20 ◈", "buyPotion", "secondary", "coin")}</div><div class="shop-row"><span>${icon("spark")}${tr("Зелье энергии · +60 MP", "Energy potion · +60 MP")}</span>${btn("25 ◈", "buyMana", "secondary", "coin")}</div>`,
  );
}
function showSmith(o = landmarks.find((x) => x.id === "smith")) {
  const s = game.save;
  const quest = s.flags.smithQuestDone
    ? `<div class="shop-note">${icon("check")}${tr("Работа для кузнеца · завершено", "A smith’s work · completed")}</div>`
    : !s.flags.smithQuest
      ? `<div class="shop-quest"><p>${tr("Нужны 4 куска железной руды с горных троп. Принесёшь — бесплатно улучшу оружие.", "I need 4 pieces of iron ore from the mountain trails. Bring them and I will upgrade your weapon for free.")}</p>${btn(tr("Взять задание", "Accept quest"), "acceptSmith", "secondary", "flag")}</div>`
      : `<div class="shop-quest"><p>${tr(`Железная руда: ${s.inventory.ore}/4. Награда: +1 к оружию.`, `Iron ore: ${s.inventory.ore}/4. Reward: +1 weapon upgrade.`)}</p>${btn(tr("Передать руду", "Give ore"), "smithReward", "secondary", "crystal")}</div>`;
  dialog(
    o,
    tr(
      "Броню покупают, создают из материалов или находят у боссов. Усиление оружия и брони требует монет, руды, а позднее — эссенций.",
      "Buy armor, craft it from materials or claim it from bosses. Upgrades require coins and ore, with essences needed for higher ranks.",
    ),
    btn(tr("До встречи", "See you soon"), "close", "secondary"),
    `${quest}<h3 class="small-heading">${tr("ОРУЖИЕ В ПРОДАЖЕ", "WEAPONS FOR SALE")}</h3>${weaponCards("shop")}<h3 class="small-heading">${tr("БРОНЯ · ПОКУПКА И КРАФТ", "ARMOR · BUY & CRAFT")}</h3>${armorCards("shop")}${wearableCards("shop")}<h3 class="small-heading">${tr("УСИЛЕНИЕ СНАРЯЖЕНИЯ", "EQUIPMENT UPGRADES")}</h3>${[
      "weapon",
      "armor",
    ]
      .map((kind) => {
        const rank = s[kind + "Level"],
          cost = kind === "weapon" ? weaponUpgradeCost(s) : armorUpgradeCost(s),
          required = 2 + rank * 2;
        return `<div class="shop-row"><span>${icon(kind === "weapon" ? "sword" : "shield")}<b>${tr(kind === "weapon" ? "Оружие" : "Броня", kind === "weapon" ? "Weapon" : "Armor")} +${rank}${rank < 6 ? " → +" + (rank + 1) : " · MAX"}</b><small>${tr("Нужен уровень", "Requires level")} ${required} · ${cost.gold} ◈ · ${materialText({ ore: cost.ore, essence: cost.essence })}${kind === "weapon" ? " · +3 " + tr("урона", "damage") : " · +2 " + tr("защиты", "defense")}</small></span><button class="button secondary" data-action="${kind === "weapon" ? "upgradeWeapon" : "upgradeArmor"}" ${rank >= 6 || s.level < required || (kind === "armor" && s.equippedArmor === "none") ? "disabled" : ""}>${tr("Усилить", "Upgrade")}</button></div>`;
      })
      .join("")}`,
  );
}
function materialText(recipe = {}) {
  return Object.entries(recipe)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${label(items[id])}: ${n}`)
    .join(" · ");
}
function armorCards(mode = "inventory") {
  const s = game.save;
  return `<div class="armory-grid">${Object.entries(armors)
    .filter(([id, a]) =>
      mode === "shop" ? id !== "none" && !a.source : s.ownedArmors.includes(id),
    )
    .map(([id, a]) => {
      const owned = s.ownedArmors.includes(id),
        equipped = s.equippedArmor === id,
        locked = s.level < (a.level || 1);
      return `<article class="gear-card ${equipped ? "equipped" : ""}"><div class="gear-title">${icon("shield")}<div><h3>${label(a.name)}</h3><small>${a.source ? tr("ТРОФЕЙ БОССА", "BOSS LOOT") : tr("СНАРЯЖЕНИЕ", "EQUIPMENT")} · ${tr("Уровень", "Level")} ${a.level || 1}</small></div></div><p>${label(a.desc)}</p><div class="gear-stats">${a.defense} ${tr("защиты", "defense")} · +${a.hp} HP${a.mana ? ` · +${a.mana} MP` : ""}</div>${equipped ? `<span class="equipped-label">${icon("check")}${tr("Надето", "Equipped")}</span>` : purchaseActions(id,a,'armor')}</article>`;
    })
    .join("")}</div>`;
}
function showContracts() {
  const s = game.save;
  openModal(
    tr("Поручения долины", "Valley contracts"),
    `<p class="modal-intro">${tr("Поручения связывают охоту, крафт, ночной дозор и походы в подземелья. Ресурсы для поставок расходуются при получении награды.", "Contracts cover hunts, crafting, night patrols and dungeon expeditions. Delivery materials are consumed when claiming a reward.")}</p><div class="contract-list">${contracts
      .map((q) => {
        const status = s.contracts[q.id],
          value = contractProgress(s, q),
          locked = s.level < q.level;
        return `<article class="contract-card ${status === "done" ? "done" : ""}"><div><span>${tr("УРОВЕНЬ", "LEVEL")} ${q.level}${status === "done" ? ` · ${tr("ЗАВЕРШЕНО", "COMPLETED")}` : ""}</span><h3>${label(q.name)}</h3><p>${label(q.desc)}</p><small>${q.gold} ◈ · ${q.xp} XP${q.points ? ` · +${q.points} ${tr("очк.", "points")}` : ""}</small></div><div class="contract-side"><b>${Math.min(value, q.count)} / ${q.count}</b>${status === "done" ? icon("check") : status === "active" ? `<button class="button ${value >= q.count ? "primary" : "secondary"}" data-action="contractClaim-${q.id}" ${value >= q.count ? "" : "disabled"}>${tr("Награда", "Claim")}</button>` : `<button class="button secondary" data-action="contractAccept-${q.id}" ${locked ? "disabled" : ""}>${locked ? tr(`С ${q.level} ур.`, `Level ${q.level}`) : tr("Принять", "Accept")}</button>`}</div></article>`;
      })
      .join("")}</div>`,
    "contracts",
  );
}
function dungeonCards() {
  return `<div class="dungeon-list">${Object.entries(dungeons)
    .map(
      ([id, d]) =>
        `<article class="dungeon-card" style="--dungeon-color:${d.color}"><div>${icon("crystal")}<h3>${label(d.name)}</h3><span>${tr("УР.", "LVL")} ${d.level} · ${d.floors} ${tr("этажа", "floors")}</span></div><p>${label(d.desc)}</p><small>${game.save.dungeonClears[id] > 0 ? tr(`Побед: ${game.save.dungeonClears[id]} · следующий заход сложнее`, `Clears: ${game.save.dungeonClears[id]} · next run is harder`) : tr("Печать ещё не получена", "Seal not yet claimed")}</small></article>`,
    )
    .join("")}</div>`;
}
function showDungeon(id) {
  const d = dungeons[id],
    s = game.save,
    canEnter = dungeonAccess(s, id);
  openModal(
    label(d.name),
    `<div class="dungeon-intro" style="--dungeon-color:${d.color}">${icon("crystal")}<span>${tr("ПОДЗЕМЕЛЬЕ", "DUNGEON")} · ${tr("УРОВЕНЬ", "LEVEL")} ${d.level} · ${d.floors} ${tr("ЭТАЖА", "FLOORS")}</span><h3>${label(bossNames[d.boss])}</h3><p>${label(d.desc)}</p></div><div class="dungeon-loot"><b>${tr("ГАРАНТИРОВАННЫЕ ТРОФЕИ", "GUARANTEED SPOILS")}</b><span>${icon(weapons[d.loot[s.characterClass]].icon)}${label(weapons[d.loot[s.characterClass]].name)}</span><span>${icon("shield")}${label(armors[d.armor].name)}</span><span>${icon("crystal")}${tr("Эссенции для редкого крафта", "Essences for rare crafting")}</span></div><p class="fine-print">${tr("В зале босса выход запечатывается. Зелья имеют перезарядку 8 секунд. После поражения вы вернётесь к костру. Собранное снаряжение сохранится; зачистку придётся начать снова. Неподобранные трофеи перемещаются к входу.", "The boss arena seals its exit. Potions have an 8-second cooldown. Defeat returns you to a campfire. Collected equipment is kept, but the run starts over. Unclaimed spoils move to the entrance.")}</p>${s.dungeonClears[id] ? `<p class="tier-warning">${tr(`Испытание ${Math.min(6, s.dungeonClears[id]) + 1}: враги усилены. Повторные трофеи превращаются в эссенции.`, `Challenge ${Math.min(6, s.dungeonClears[id]) + 1}: stronger enemies. Duplicate gear grants essences.`)}</p>` : ""}<div class="dialog-actions"><button class="button primary" data-action="dungeonEnter-${id}" ${canEnter ? "" : "disabled"}>${tr("Спуститься", "Enter dungeon")}</button>${btn(tr("Подготовиться", "Prepare"), "close", "secondary")}</div>${!canEnter ? `<p class="recipe-text">${tr(`Нужен уровень ${d.level}${id === "citadel" ? " и три печати других подземелий" : ""}.`, `Requires level ${d.level}${id === "citadel" ? " and the other three dungeon seals" : ""}.`)}</p>` : ""}`,
    "dungeon-modal",
  );
}
function showLoot(drop) {
  const c = drop.contents;
  openModal(
    tr("Трофеи босса", "Boss spoils"),
    `<div class="loot-symbol">${icon("crystal")}</div><p class="modal-intro">${tr("Добыча лежит у поверженного босса. Заберите её в рюкзак.", "Spoils await beside the fallen boss. Take them into your bag.")}</p><div class="loot-contents">${c.weapon ? `<div>${icon(weapons[c.weapon].icon)}<b>${label(weapons[c.weapon].name)}</b><small>${tr("Оружие", "Weapon")} · ${tr("Ур.", "Lvl")} ${weapons[c.weapon].level || 1}</small></div>` : ""}${c.wearable ? `<div>${icon(gearIcon(wearables[c.wearable].slot))}<b>${label(wearables[c.wearable].name)}</b><small>${label(slotNames[wearables[c.wearable].slot])} · Lv. ${wearables[c.wearable].level}</small></div>` : ""}${c.armor ? `<div>${icon("shield")}<b>${label(armors[c.armor].name)}</b><small>${tr("Броня", "Armor")} · ${tr("Ур.", "Lvl")} ${armors[c.armor].level || 1}</small></div>` : ""}<div>${icon("coin")}<b>${c.gold} ◈</b><small>${materialText(c.items)}</small></div></div>${btn(tr("Забрать добычу", "Take spoils"), `lootClaim-${drop.id}`, "primary", "bag")}`,
    "loot",
  );
}
function showDungeonExit() {
  openModal(
    tr("Выход из подземелья", "Leave dungeon"),
    `<p class="modal-intro">${tr("Выйти на поверхность? При следующем заходе зачистка начнётся с первого этажа. Добытое снаряжение останется с вами; оставленные трофеи появятся у входа.", "Return to the surface? Your next run starts on the first floor. Keep all collected equipment; unclaimed spoils will appear at the entrance.")}</p><div class="dialog-actions">${btn(tr("Выйти", "Leave"), "dungeonLeave", "primary", "arrow")}${btn(tr("Остаться", "Stay"), "close", "secondary")}</div>`,
    "dungeon-exit",
  );
}
function showWeather() {
  const c = game.climate;
  openModal(
    tr("Погода и время", "Weather & time"),
    `<div class="climate-intro">${icon(c.weather === "snow" ? "snow" : c.weather === "storm" ? "spark" : "sun")}<h3>${label(weatherNames[c.weather])} · ${c.night ? tr("Ночь", "Night") : tr("День", "Day")}</h3><p>${weatherDescription(c)}</p></div><p class="modal-intro">${tr("Ночью враги наносят на 20% больше урона, замечают вас дальше и дают на 15% больше опыта. Лунная трава даёт двойную добычу. У костра можно дождаться утра или ночи. В подземельях погода определяется их окружением.", "At night enemies deal 20% more damage, detect you farther away and grant 15% more experience. Moonleaf harvests double. Wait for morning or night at a campfire. Dungeon conditions depend on their environment.")}</p><p class="fine-print">${tr(`Следующая смена погоды примерно через ${Math.ceil(c.untilChange)} секунд игры.`, `The next weather change is in about ${Math.ceil(c.untilChange)} gameplay seconds.`)}</p>${btn(tr("Понятно", "Got it"), "close", "primary", "check")}`,
    "weather",
  );
}
function masteriesPanel() {
  const s = game.save;
  return `<h3 class="small-heading">${tr("МАСТЕРСТВО · С 5 УРОВНЯ", "MASTERY · LEVEL 5")}</h3><div class="mastery-grid">${[
    ["vitality", tr("Живучесть", "Vitality"), "+8 HP"],
    ["focus", tr("Сосредоточение", "Focus"), "+6 MP · +0.12 MP/s"],
    ["precision", tr("Точность", "Precision"), "+2 " + tr("урона", "damage")],
  ]
    .map(
      ([id, name, desc]) =>
        `<div><h3>${name}</h3><p>${desc}</p><span>${s.masteries[id]} / 8</span><button class="button secondary" data-action="mastery-${id}" ${s.level < 5 || s.skillPoints < 1 || s.masteries[id] >= 8 ? "disabled" : ""}>+1 · ${tr("очко", "point")}</button></div>`,
    )
    .join("")}</div>`;
}

function saveAndUpdate() {
  game.persist();
  updateHUD();
}
function spendGold(amount, fn) {
  if (game.save.gold < amount) {
    toast(
      tr(
        "Не хватает монет. Выполняйте задания и ищите сундуки.",
        "Not enough coins. Complete quests and find chests.",
      ),
    );
    return false;
  }
  game.save.gold -= amount;
  fn();
  saveAndUpdate();
  audio.effect("pickup");
  return true;
}
async function action(name) {
  if (name === "activities") {
    showActivities();
    return;
  }
  if (name === "fishTap") {
    game.fishingTap();
    return;
  }
  if (name === "fishAgain") {
    const o = landmarks.find((o) => o.id === game.fishing?.spot);
    if (o && game.startFishing(o)) updateFishingUI();
    return;
  }
  if (name.startsWith("assign-")) {
    const [, id, slot] = name.split("-");
    game.assignAbility(id, Number(slot));
    renderHUD();
    showSkills();
    return;
  }
  if (name.startsWith("barRotate-")) {
    const i = Number(name.slice(10));
    game.assignAbility(barFor(game.save)[(i + 1) % 5], i);
    renderHUD();
    showSkills();
    return;
  }
  if (name === "locateMentor") {
    const o = landmarks.find(o=>o.type === "trainer" && o.class === game.save.characterClass) || landmarks.find(o=>o.id === ({warrior:"bladeMentor",ranger:"rangerMentor",mage:"mageMentor"})[game.save.characterClass]);
    game.waypoint = {x:o.x,y:o.y}; showMap(); return;
  }
  if (name.startsWith("bagFilter-")) { bagFilter=name.slice(10); showInventory(); return; }
  if (name.startsWith("recipesFor-")) {
    recipeMaterial=name.slice(11);
    const r=recipes.find(r=>recipeMaterial in r.inputs && !game.craftReason(r.id)) || recipes.find(r=>recipeMaterial in r.inputs);
    action("recipe-"+r.id);
    document.querySelector(".small-workbench").scrollIntoView({block:"nearest"}); return;
  }
  if (name.startsWith("craftMake-")) {
    const [,id,count]=name.split("-"); game.craftSmall(id,Number(count)); renderHUD(); showInventory(); return;
  }
  if (name.startsWith("bagSelect-")) {
    bagSelected = name.slice(10);
    showInventory();
    return;
  }
  if (name.startsWith("unequip-")) {
    game.removeGear(name.slice(8));
    renderHUD();
    showInventory();
    return;
  }
  if (name.startsWith("wearEquip-")) {
    if (!game.equipWearable(name.slice(10)))
      toast(tr("Нужен более высокий уровень.", "Requires a higher level."));
    renderHUD();
    if (modal === "inventory") showInventory();
    else showSmith();
    return;
  }
  if (name.startsWith("wearBuy-") || name.startsWith("wearCraft-")) {
    if (
      !game.acquireWearable(
        name.slice(name.indexOf("-") + 1),
        name.startsWith("wearCraft"),
      )
    )
      toast(
        tr(
          "Не хватает уровня, монет или материалов.",
          "Requires level, coins or materials.",
        ),
      );
    renderHUD();
    showSmith();
    return;
  }
  if (name.startsWith("eat-")) {
    game.eatFood(name.slice(4));
    showInventory();
    return;
  }
  if (name.startsWith("recipe-")) {
    const r = recipes.find((r) => r.id === name.slice(7));
    if (!r) return;
    recipeMaterial = null;
    craftDraft = Object.entries(r.inputs).flatMap(([id, n]) =>
      Array(n).fill(id),
    );
    showInventory();
    document.querySelector(".small-workbench").scrollIntoView({block:"nearest"});
    return;
  }
  if (name.startsWith("craftAdd-")) {
    const id = name.slice(9);
    if (
      craftDraft.length < 4 &&
      (game.save.inventory[id] || 0) > craftDraft.filter((k) => k === id).length
    )
      craftDraft.push(id);
    showInventory();
    return;
  }
  if (name.startsWith("craftClear-")) {
    craftDraft.splice(Number(name.slice(11)), 1);
    showInventory();
    return;
  }
  if (name === "craftOutput") {
    const r = selectedRecipe();
    if (r) game.craftSmall(r.id);
    renderHUD();
    showInventory();
    return;
  }
  audio.unlock();
  const s = game.save;
  if (name === "contracts") {
    showContracts();
    return;
  }
  if (name === "weather") {
    showWeather();
    return;
  }
  if (name === "gearLocked") {
    toast(
      tr(
        "Для этого снаряжения нужен более высокий уровень.",
        "This equipment requires a higher level.",
      ),
    );
    return;
  }
  if (name.startsWith("contractAccept-")) {
    if (game.acceptContract(name.slice(15))) showContracts();
    return;
  }
  if (name.startsWith("contractClaim-")) {
    if (game.claimContract(name.slice(14))) showContracts();
    return;
  }
  if (name.startsWith("dungeonEnter-")) {
    if (game.enterDungeon(name.slice(13))) {
      closeModal();
      renderHUD();
    } else
      toast(
        tr(
          "Нельзя войти: проверьте уровень, печати и отойдите от врагов.",
          "Cannot enter: check your level, seals and nearby enemies.",
        ),
      );
    return;
  }
  if (name === "dungeonLeave") {
    if (game.leaveDungeon()) {
      closeModal();
      renderHUD();
    }
    return;
  }
  if (name.startsWith("lootClaim-")) {
    if (game.collectLoot(name.slice(10))) {
      closeModal();
      toast(tr("Трофеи добавлены в рюкзак.", "Spoils added to your bag."));
    }
    return;
  }
  if (name.startsWith("armorEquip-")) {
    if (game.equipArmor(name.slice(11))) {
      renderHUD();
      if (modal === "inventory") showInventory();
      else showSmith();
    }
    return;
  }
  if (
    name.startsWith("armorBuy-") ||
    name.startsWith("armorCraft-") ||
    name.startsWith("weaponCraft-")
  ) {
    const craft = name.includes("Craft"),
      kind = name.startsWith("weapon") ? "weapon" : "armor",
      id = name.slice(name.indexOf("-") + 1);
    if (game.acquireEquipment(kind, id, craft)) {
      renderHUD();
      showSmith();
    } else
      toast(
        tr(
          "Проверьте уровень, монеты и материалы.",
          "Check your level, coins and materials.",
        ),
      );
    return;
  }
  if (name.startsWith("mastery-")) {
    if (game.learnMastery(name.slice(8))) showSkills();
    return;
  }
  if (name.startsWith("waitMorning-") || name.startsWith("waitNight-")) {
    if (
      game.waitAtCamp(
        name.slice(name.indexOf("-") + 1),
        name.startsWith("waitMorning") ? 8 : 20,
      )
    ) {
      closeModal();
      updateHUD();
    }
    return;
  }
  if (name === "sound" || name === "soundPause") {
    audio.setEnabled(!audio.enabled);
    if (state === "game") {
      renderHUD();
      if (name === "soundPause") showPause();
    } else if (state === "create") showCreation();
    else showMenu();
    return;
  }
  if (name === "language") {
    setLanguage(language === "ru" ? "en" : "ru");
    if (state === "create") showCreation();
    else showMenu();
    return;
  }
  if (name === "create") {
    if (existingSave) {
      openModal(
        tr("Начать новую историю?", "Begin a new story?"),
        `<p class="modal-intro">${tr("В игре одна ячейка сохранения. Текущее путешествие заменится только после создания нового героя.", "The game has one save slot. Your current adventure will only be replaced after you create a new hero.")}</p>${btn(tr("Создать нового героя", "Create a new hero"), "confirmCreate", "primary", "spark")}${btn(tr("Вернуться", "Go back"), "close", "secondary")}`,
        "confirm",
      );
    } else {
      newGameIntent = true;
      showCreation();
    }
    return;
  }
  if (name === "confirmCreate") {
    newGameIntent = true;
    closeModal();
    showCreation();
    return;
  }
  if (name === "menu") {
    showMenu();
    return;
  }
  if (name === "continue") {
    startGame(existingSave);
    return;
  }
  if (name === "start") {
    const input = document.querySelector("#hero-name"),
      nameValue = input.value.trim() || tr("Элиан", "Elian");
    if (!newGameIntent) return;
    if (document.fullscreenEnabled && matchMedia("(pointer: coarse)").matches)
      document.documentElement.requestFullscreen().catch(() => {});
    const fresh = newSave(
      nameValue,
      selectedClass,
      { ...appearance },
      selectedWeapon,
    );
    platform.save(fresh);
    existingSave = fresh;
    newGameIntent = false;
    startGame(fresh);
    return;
  }
  if (name === "help") {
    showHelp();
    return;
  }
  if (name === "close") {
    closeModal();
    return;
  }
  if (name === "leave") {
    game.persist();
    existingSave = game.save;
    platform.flush();
    showMenu();
    return;
  }
  if (name === "pause") {
    showPause();
    return;
  }
  if (name === "inventory") {
    showInventory();
    return;
  }
  if (name === "journal") {
    showJournal();
    return;
  }
  if (name === "map") {
    showMap();
    return;
  }
  if (name === "fullscreen") {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (document.documentElement.requestFullscreen)
      document.documentElement
        .requestFullscreen()
        .catch(() =>
          toast(
            tr(
              "Полный экран недоступен в этом браузере.",
              "Fullscreen is unavailable in this browser.",
            ),
          ),
        );
    else
      toast(
        tr(
          "Полный экран управляется браузером.",
          "Fullscreen is managed by your browser.",
        ),
      );
    return;
  }
  if (name === "dismissTip") {
    document.querySelector("#movement-tip").hidden = true;
    return;
  }
  if (name === "respawn") {
    game.respawn();
    modal = null;
    modalRoot.innerHTML = "";
    syncPause();
    return;
  }
  if (name === "mapZoomIn" || name === "mapZoomOut") {
    mapState.zoom = Math.max(
      1,
      Math.min(3, mapState.zoom + (name === "mapZoomIn" ? 0.35 : -0.35)),
    );
    drawMap(document.querySelector("#large-map"), true);
    return;
  }
  if (name === "mapCenter") {
    mapState.x = s.x;
    mapState.y = s.y;
    mapState.zoom = Math.max(1.5, mapState.zoom);
    drawMap(document.querySelector("#large-map"), true);
    return;
  }
  if (name === "mapWalk") {
    if (!game.waypoint) {
      toast(
        tr(
          "Сначала поставьте отметку на карте.",
          "Place a marker on the map first.",
        ),
      );
      return;
    }
    closeModal();
    game.moveTo(game.waypoint.x, game.waypoint.y);
    return;
  }
  if (name.startsWith("travel-")) {
    if (game.fastTravel(name.slice(7))) {
      closeModal();
      updateHUD();
      toast(
        tr(
          "Вы прибыли к открытому костру.",
          "You arrived at a discovered campfire.",
        ),
      );
    }
    return;
  }
  if (name === "skills") {
    showSkills();
    return;
  }
  if (name === "controls") {
    showControls();
    return;
  }
  if (name === "resetControls") {
    game.controls = normalizeControls(null);
    saveControls(game.controls);
    renderHUD();
    showControls();
    return;
  }
  if (name.startsWith("skill-")) {
    game.useSkill(Number(name.slice(6)));
    return;
  }
  if (name.startsWith("learn-")) {
    if (game.learnSkill(Number(name.slice(6)))) showSkills();
    return;
  }
  if (name.startsWith("equip-")) {
    if (game.equipWeapon(name.slice(6))) {
      renderHUD();
      if (modal === "inventory") showInventory();
      else showSmith();
    }
    return;
  }
  if (name.startsWith("buyWeapon-")) {
    const id = name.slice(10);
    if (game.acquireEquipment("weapon", id)) {
      renderHUD();
      showSmith();
    } else
      toast(tr("Проверьте уровень и монеты.", "Check your level and coins."));
    return;
  }
  if (name === "acceptExpedition" && !s.flags.expedition) {
    s.flags.expedition = true;
    saveAndUpdate();
    showCaptain();
    return;
  }
  if (
    name === "expeditionReward" &&
    s.flags.expedition &&
    !s.flags.expeditionDone
  ) {
    if ((s.kills.wolf || 0) < 6 || (s.kills.sentinel || 0) < 4) {
      toast(tr("Патруль ещё не завершён.", "The patrol is not complete yet."));
      return;
    }
    s.flags.expeditionDone = true;
    s.gold += 160;
    s.skillPoints++;
    const reward = classWeapons(s.characterClass).find(
      ([id]) => !s.ownedWeapons.includes(id),
    );
    if (reward) s.ownedWeapons.push(reward[0]);
    game.addXp(120);
    saveAndUpdate();
    showCaptain();
    return;
  }
  if (name === "attack") {
    game.attack();
    return;
  }
  if (name === "skill") {
    game.attack(true);
    return;
  }
  if (name === "dodge") {
    game.dodge();
    return;
  }
  if (name === "potion") {
    game.potion();
    return;
  }
  if (name === "interact") {
    game.interact();
    return;
  }
  if (!s) return;
  if (name.startsWith("rest-")) {
    if (!game.rest(landmarks.find((o) => o.id === name.slice(5)))) return;
    closeModal();
    toast(
      tr(
        "Силы восстановлены. Точка возвращения сохранена.",
        "Fully restored. Return point saved.",
      ),
    );
    return;
  }
  if (name === "rewarded") {
    if (adPending) return;
    adPending = true;
    modalRoot.querySelectorAll("button").forEach((b) => (b.disabled = true));
    const rewarded = await platform.rewarded(() => {
      s.inventory.potion += 2;
      game.persist();
    });
    adPending = false;
    closeModal();
    toast(
      rewarded
        ? tr("Вы получили 2 зелья здоровья.", "You received 2 health potions.")
        : tr(
            "Реклама недоступна или просмотр не завершён.",
            "The ad is unavailable or was not completed.",
          ),
    );
    return;
  }
  if (name === "acceptMain" && s.quest === 0) {
    s.quest = 1;
    saveAndUpdate();
    closeModal();
    toast(
      tr(
        "Новое задание: Шёпот лесного обелиска.",
        "New quest: Whisper of the forest.",
      ),
    );
    return;
  }
  if (name === "forestReward" && s.quest === 2) {
    s.gold += 80;
    game.addXp(70);
    s.quest = 3;
    saveAndUpdate();
    closeModal();
    return;
  }
  if (name === "mountainReward" && s.quest === 4) {
    s.gold += 90;
    game.addXp(80);
    s.quest = 5;
    saveAndUpdate();
    closeModal();
    return;
  }
  if (name === "awaken" && s.quest === 5) {
    s.flags.bossAwake = true;
    saveAndUpdate();
    closeModal();
    toast(
      tr(
        "Хранитель пробудился. Следите за красным кругом!",
        "The guardian is awake. Watch for the red circle!",
      ),
    );
    return;
  }
  if (name === "finalReward" && s.quest === 6) {
    s.gold += 200;
    game.addXp(150);
    s.quest = 7;
    s.flags.victory = true;
    saveAndUpdate();
    closeModal();
    toast(
      tr(
        "Первую историю завершили! В журнале открыта кампания четырёх печатей глубин.",
        "The first story is complete! Find the four depth seals campaign in your journal.",
      ),
    );
    return;
  }
  if (name === "acceptHerbs" && !s.flags.herbQuest) {
    s.flags.herbQuest = true;
    saveAndUpdate();
    showHerbalist();
    return;
  }
  if (name === "acceptSmith" && !s.flags.smithQuest) {
    s.flags.smithQuest = true;
    saveAndUpdate();
    showSmith();
    return;
  }
  if (name === "herbReward" && !s.flags.herbQuestDone && s.flags.herbQuest) {
    if (s.inventory.herb < 6) {
      toast(tr("Нужно 6 лунных трав.", "You need 6 moonleaves."));
      return;
    }
    s.inventory.herb -= 6;
    s.inventory.potion += 3;
    s.gold += 50;
    s.flags.herbQuestDone = true;
    game.addXp(50);
    saveAndUpdate();
    showHerbalist();
    return;
  }
  if (name === "smithReward" && !s.flags.smithQuestDone && s.flags.smithQuest) {
    if (s.inventory.ore < 4) {
      toast(tr("Нужно 4 куска руды.", "You need 4 pieces of ore."));
      return;
    }
    s.inventory.ore -= 4;
    if (s.weaponLevel >= 6) s.inventory.essence += 2;
    else s.weaponLevel++;
    s.flags.smithQuestDone = true;
    game.addXp(50);
    saveAndUpdate();
    showSmith();
    return;
  }
  if (name === "buyPotion") {
    if (spendGold(20, () => s.inventory.potion++)) showHerbalist();
    return;
  }
  if (name === "buyMana") {
    if (spendGold(25, () => s.inventory.manaPotion++)) showHerbalist();
    return;
  }
  if (name === "upgradeWeapon" || name === "upgradeArmor") {
    if (game.upgradeEquipment(name === "upgradeWeapon" ? "weapon" : "armor"))
      showSmith();
    else
      toast(
        tr(
          "Нужны уровень, материалы, монеты и надетое снаряжение. Максимальное усиление: +6.",
          "Requires level, materials, coins and equipped gear. Maximum upgrade: +6.",
        ),
      );
    return;
  }
  if (name === "craftPotion" || name === "craftMana") {
    const key = name === "craftPotion" ? "herb" : "crystal",
      cost = key === "herb" ? 3 : 1;
    if (s.inventory[key] < cost) {
      toast(tr("Не хватает ресурсов.", "Not enough resources."));
      return;
    }
    s.inventory[key] -= cost;
    s.inventory[key === "herb" ? "potion" : "manaPotion"]++;
    saveAndUpdate();
    showInventory();
    return;
  }
  if (name.startsWith("use-")) {
    const key = name.slice(4),
      stat = key === "potion" ? "hp" : "mana",
      max = stat === "hp" ? game.stats.maxHp : game.stats.maxMana;
    if (s[stat] >= max) {
      toast(tr("Запас уже полон.", "Already full."));
      return;
    }
    if (!s.inventory[key]) return;
    game.potion(key, true);
    showInventory();
    return;
  }
}
app.addEventListener("click", (e) => {
  const starter = e.target.closest("[data-start-weapon]");
  if (starter) {
    selectedWeapon = starter.dataset.startWeapon;
    showCreation();
    return;
  }
  const rebind = e.target.closest("[data-rebind]");
  if (rebind) {
    bindingAwait = rebind.dataset.rebind;
    rebind.textContent = tr("Нажмите клавишу", "Press a key");
    return;
  }
  const color = e.target.closest("[data-color]");
  if (color) {
    appearance[color.dataset.color] = color.dataset.value;
    showCreation();
    return;
  }
  const cc = e.target.closest("[data-class]");
  if (cc) {
    selectedClass = cc.dataset.class;
    selectedWeapon = defaultWeapon(selectedClass);
    appearance.cape = null;
    showCreation();
    return;
  }
  const control = e.target.closest("[data-action]");
  if (control && !control.disabled) action(control.dataset.action);
});
app.addEventListener("input", (e) => {
  if (e.target.id === "hero-name") {
    draftName = e.target.value;
    try {
      sessionStorage.setItem("elderia-draft-name", draftName);
    } catch {}
  }
});
document.addEventListener("contextmenu", (e) => e.preventDefault());
app.addEventListener("change", (e) => {
  if (e.target.matches("[data-control]")) {
    game.controls[e.target.dataset.control] = e.target.checked;
    saveControls(game.controls);
  }
});
window.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (bindingAwait && modal === "controls") {
    e.preventDefault();
    if (e.code === "Escape") {
      showControls();
      return;
    }
    if (
      !/^(Key[A-Z]|Digit[0-9]|Space|ShiftLeft|ShiftRight)$/.test(e.code) ||
      ["KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code) ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey
    ) {
      toast(
        tr(
          "Выберите букву, цифру, пробел или Shift. WASD заняты движением.",
          "Choose a letter, digit, Space or Shift. WASD are reserved for movement.",
        ),
      );
      return;
    }
    const bindings = game.controls.bindings,
      old = bindings[bindingAwait],
      other = Object.keys(bindings).find(
        (k) => k !== bindingAwait && bindings[k] === e.code,
      );
    if (other) bindings[other] = old;
    bindings[bindingAwait] = e.code;
    saveControls(game.controls);
    renderHUD();
    showControls();
    return;
  }
  if (state !== "game") {
    if (e.code === "Escape" && modal) closeModal();
    return;
  }
  const bindings = game.controls.bindings,
    moves = [
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ],
    actionKey =
      Object.keys(bindings).find((k) => bindings[k] === e.code) ||
      (e.code === "ShiftRight" && bindings.dodge === "ShiftLeft"
        ? "dodge"
        : null);
  if (!actionKey && !moves.includes(e.code) && e.code !== "Escape") return;
  e.preventDefault();
  audio.unlock();
  if (e.repeat && actionKey !== "attack") return;
  if (modal) {
    if (modal === "fishing" && ["attack", "interact"].includes(actionKey))
      game.fishingTap();
    if (e.code === "Escape") closeModal();
    return;
  }
  game.keys.add(e.code);
  if (actionKey === "skill1") game.useSkill(0);
  else if (actionKey === "skill2") game.useSkill(1);
  else if (actionKey === "skill3") game.useSkill(2);
  else if (actionKey === "skill4") game.useSkill(3);
  else if (actionKey === "skill5") game.useSkill(4);
  else if (actionKey === "dodge") game.dodge();
  else if (actionKey === "interact") game.interact();
  else if (actionKey === "potion") game.potion();
  else if (actionKey === "inventory") showInventory();
  else if (actionKey === "journal") showJournal();
  else if (actionKey === "map") showMap();
  else if (actionKey === "skills") showSkills();
  else if (e.code === "Escape") showPause();
});
window.addEventListener("keyup", (e) => game.keys.delete(e.code));
const worldCanvas = document.querySelector("#world");
function worldPoint(e) {
  const r = worldCanvas.getBoundingClientRect();
  return {
    x: game.view.x + ((e.clientX - r.left) / r.width) * game.canvas.width,
    y: game.view.y + ((e.clientY - r.top) / r.height) * game.canvas.height,
  };
}
worldCanvas.addEventListener("pointermove", (e) => {
  game.pointer = worldPoint(e);
});
let attackPointer = null,
  joystickPointer = null;
worldCanvas.addEventListener("pointerdown", (e) => {
  audio.unlock();
  if (game.paused) return;
  const p = worldPoint(e);
  game.pointer = p;
  const enemy = game
    .combatEnemies()
    .find((o) => Math.hypot(p.x - o.x, p.y - (o.y - 14)) < 25);
  if (e.button === 0 && enemy && game.controls.clickAttack) {
    game.path = [];
    game.selectedTarget = enemy.id;
    game.heldAttack = true;
    attackPointer = e.pointerId;
    worldCanvas.setPointerCapture(e.pointerId);
    game.attack();
    return;
  }
  const object = game.world
    .getObjectsInRect(p.x - 35, p.y - 35, 70, 70)
    .concat(game.activeLoot)
    .filter((o) =>
      [
        "npc",
        "camp",
        "herb",
        "ore",
        "crystal",
        "chest",
        "rune",
        "altar",
        "trainer",
        "fishspot",
        "berryBush",
        "wood",
        "board",
        "entrance",
        "exit",
        "stairs",
        "dungeonChest",
      ].includes(o.type),
    )
    .find((o) => Math.hypot(p.x - o.x, p.y - (o.y - 12)) < 26);
  if (e.button === 0 && object) {
    if (Math.hypot(object.x - game.save.x, object.y - game.save.y) < 46)
      game.onInteract(object);
    else {
      game.moveTo(object.x, object.y);
      if (game.path.length) game.pendingInteraction = object.id;
    }
    return;
  }
  game.selectedTarget = null;
  game.moveTo(p.x, p.y);
});
app.addEventListener("pointerdown", (e) => {
  const map = e.target.closest("#large-map");
  if (map) {
    mapDrag = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: mapState.x,
      y: mapState.y,
      moved: false,
    };
    map.setPointerCapture(e.pointerId);
    e.preventDefault();
    return;
  }
  const joystick = e.target.closest("#joystick");
  if (joystick && joystickPointer === null) {
    joystickPointer = e.pointerId;
    joystick.setPointerCapture(e.pointerId);
    moveJoystick(e, joystick);
    audio.unlock();
    e.preventDefault();
  }
  const attack = e.target.closest('[data-action="attack"]');
  if (attack && !game.paused) {
    game.heldAttack = true;
    attackPointer = e.pointerId;
    attack.setPointerCapture(e.pointerId);
    game.attack();
    audio.unlock();
  }
});
function moveJoystick(e, joystick) {
  const rect = joystick.getBoundingClientRect(),
    dx = e.clientX - rect.left - rect.width / 2,
    dy = e.clientY - rect.top - rect.height / 2,
    length = Math.hypot(dx, dy),
    limit = rect.width * 0.28,
    dead = 5,
    magnitude = Math.max(0, Math.min(1, (length - dead) / (limit - dead)));
  game.joystick = {
    x: length ? (dx / length) * magnitude : 0,
    y: length ? (dy / length) * magnitude : 0,
  };
  joystick.querySelector(".joystick-knob").style.transform =
    `translate(${dx / Math.max(1, length / limit)}px,${dy / Math.max(1, length / limit)}px)`;
}
app.addEventListener("pointermove", (e) => {
  if (mapDrag && e.pointerId === mapDrag.id) {
    const canvas = document.querySelector("#large-map");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect(),
      t = mapTransform(canvas, true),
      dx = e.clientX - mapDrag.startX,
      dy = e.clientY - mapDrag.startY;
    if (Math.hypot(dx, dy) > 6) mapDrag.moved = true;
    if (mapDrag.moved) {
      mapState.x = Math.max(
        0,
        Math.min(
          WIDTH * TILE,
          mapDrag.x - ((dx / rect.width) * canvas.width) / t.sx,
        ),
      );
      mapState.y = Math.max(
        0,
        Math.min(
          HEIGHT * TILE,
          mapDrag.y - ((dy / rect.height) * canvas.height) / t.sy,
        ),
      );
      drawMap(canvas, true);
    }
    return;
  }
  if (e.pointerId === joystickPointer) {
    const joy = document.querySelector("#joystick");
    if (joy) moveJoystick(e, joy);
  }
});
function releasePointer(e) {
  if (mapDrag && e.pointerId === mapDrag.id) {
    const canvas = document.querySelector("#large-map");
    if (canvas && !mapDrag.moved && e.type !== "pointercancel") {
      const p = mapPoint(e, canvas);
      if (canWalk(game.world, p.x, p.y)) {
        game.waypoint = p;
        drawMap(canvas, true);
      } else
        toast(
          tr(
            "Поставьте отметку на доступной тропе.",
            "Place the marker on a clear path.",
          ),
        );
    }
    mapDrag = null;
  }
  if (e.pointerId === attackPointer) {
    attackPointer = null;
    game.heldAttack = false;
  }
  if (e.pointerId === joystickPointer) {
    joystickPointer = null;
    game.joystick = { x: 0, y: 0 };
    const knob = document.querySelector(".joystick-knob");
    if (knob) knob.style.transform = "";
  }
}
window.addEventListener("pointerup", releasePointer);
window.addEventListener("pointercancel", releasePointer);
app.addEventListener(
  "wheel",
  (e) => {
    if (e.target.id === "large-map") {
      e.preventDefault();
      mapState.zoom = Math.max(
        1,
        Math.min(3, mapState.zoom + (e.deltaY < 0 ? 0.2 : -0.2)),
      );
      drawMap(e.target, true);
    }
  },
  { passive: false },
);
window.addEventListener("blur", () => {
  blurred = true;
  game.persist();
  syncPause();
});
window.addEventListener("focus", () => {
  blurred = false;
  syncPause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) game.persist();
  else blurred = !document.hasFocus();
  syncPause();
});
window.addEventListener("pagehide", () => {
  game.persist();
  platform.flush();
});
platform.onPause = () => {
  platformPaused = true;
  syncPause();
};
platform.onResume = () => {
  platformPaused = false;
  syncPause();
};
game.onChange = () => {
  updateHUD();
  updateFishingUI();
};
game.onToast = toast;
game.onInteract = interact;
game.onDeath = showDeath;
game.onVictory = showVictory;
platform.init().then((save) => {
  existingSave = save;
  showMenu();
  game.render(0.01);
  platform.ready();
});
// A development-only hook supports deterministic browser checks. It is removed
// by Vite from production, so release builds never expose the game state.
if (import.meta.env.DEV)
  window.__ELDERIA__ = {
    game,
    platform,
    audio,
    startGame,
    action,
    validateSave,
    readLocal,
    questInfo,
    CHEST_COUNT,
    canActivate,
    countGathered,
  };

let draggedItem = null;
document.addEventListener("dragstart", (e) => {
  const el = e.target.closest("[data-bag-key],[data-ability],[data-bar-slot]");
  if (!el) return;
  draggedItem = el.dataset.bagKey
    ? { bag: el.dataset.bagKey }
    : el.dataset.ability
      ? { ability: el.dataset.ability }
      : { ability: barFor(game.save)[Number(el.dataset.barSlot)] };
  e.dataTransfer.setData("text/plain", JSON.stringify(draggedItem));
});
document.addEventListener("dragover", (e) => {
  if (
    e.target.closest(
      "[data-gear-slot],[data-bag-index],[data-craft-cell],[data-bar-slot]",
    )
  )
    e.preventDefault();
});
document.addEventListener("drop", (e) => {
  const el = e.target.closest(
    "[data-gear-slot],[data-bag-index],[data-craft-cell],[data-bar-slot]",
  );
  if (!el || !draggedItem) return;
  e.preventDefault();
  const data = draggedItem;
  draggedItem = null;
  if (data.ability && el.dataset.barSlot !== undefined) {
    game.assignAbility(data.ability, Number(el.dataset.barSlot));
    renderHUD();
    if (modal === "skills") showSkills();
    return;
  }
  const item = bagEntries().find((i) => i.key === data.bag);
  if (!item) return;
  if (el.dataset.gearSlot) {
    const slot = el.dataset.gearSlot;
    let ok = false;
    if (item.type === "w" && slot === "mainhand")
      ok = game.equipWeapon(item.id);
    if (item.type === "a" && slot === "chest") ok = game.equipArmor(item.id);
    if (item.type === "g" && wearables[item.id].slot === slot)
      ok = game.equipWearable(item.id);
    if (!ok)
      toast(
        tr(
          "Этот предмет не подходит в ячейку или нужен уровень.",
          "Wrong equipment slot or level too low.",
        ),
      );
    renderHUD();
  } else if (el.dataset.craftCell !== undefined && item.type === "i") {
    const i = Number(el.dataset.craftCell);
    if (
      i <= craftDraft.length &&
      game.save.inventory[item.id] >
        craftDraft.filter((k) => k === item.id).length
    )
      craftDraft[i] = item.id;
  } else if (el.dataset.bagIndex !== undefined) {
    const order = bagEntries().map((i) => i.key),
      from = order.indexOf(item.key),
      to = Math.min(Number(el.dataset.bagIndex), order.length - 1);
    [order[from], order[to]] = [order[to], order[from]];
    game.save.bagOrder = order;
    game.persist();
  }
  showInventory();
});

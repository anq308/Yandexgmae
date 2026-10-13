import {
  rankLevel,
  skillsFor,
  barFor,
  abilityRank,
  weaponDiscipline,
  disciplines,
  schoolOf,
  rankConfig,
  rankPerks,
  abilityCatalog,
  utilitySkills,
} from "./abilities.js";
import { RESPEC_COST, trainerIds } from "./life.js";
import { wearables, slotNames, recipes } from "./gear.js";
import {
  canPayMaterials,
  armors,
  equippedArmor,
  starterWeapons,
  weaponUpgradeCost,
  armorUpgradeCost, missingRequirements, mythicRequirementNames } from "./equipment.js";
import {
  dungeons,
  bossNames,
  mobNames,
  contracts,
  contractProgress,
  dungeonAccess,
  difficulties,
} from "./content.js";
import { weatherNames, weatherDescription, seasonNames, seasonDescription } from "./climate.js";
import "@fontsource/tiny5/400.css";
import "@fontsource/press-start-2p/400.css";
import "./style.css";
import "./theme.css";
import "./mobile.css";
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
  critChance,
  elementNames,
} from "./equipment.js";
import { shardCount, heralds } from "./eclipse.js";
import { introPages, drawIntroScene, resetIntroScene, loreEntries } from "./intro.js";
import { storyOf, scenes, sceneOpen, sceneChoices, choiceTag, sceneText, fateLines, storyLog, storyRumors, villagerMood } from "./story.js";
import { worldBosses } from "./worldbosses.js";
import { races } from "./races.js";
import { drawTitleScene } from "./title.js";
import {
  interiorDefs,
  sellPrices,
  buyPrices,
  tavernMenu,
  ROOM_PRICE,
  gearSellPrice,
} from "./interiors.js";
import { worldOverview, fogOverlay, isDiscovered, drawMapIcon, labelPlacer } from "./mapview.js";
import {
  keyLabel,
  saveControls,
  normalizeControls,
  defaultBindings,
} from "./controls.js";
import { drawHero, armorTier } from "./art.js";
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
  allSeals,
} from "./quests.js";

const app = document.querySelector("#app");
// Phones and small tablets get their own layout (see mobile.css).
function syncDevice() {
  const w = innerWidth,
    h = innerHeight,
    coarse = matchMedia("(pointer: coarse)").matches,
    m = coarse ? Math.min(w, h) <= 820 : Math.min(w, h) <= 500 || w <= 600,
    root = document.documentElement;
  root.classList.toggle("m", m);
  root.classList.toggle("m-land", m && w > h);
  root.classList.toggle("m-port", m && w <= h);
}
syncDevice();
addEventListener("resize", syncDevice);
addEventListener("orientationchange", () => setTimeout(syncDevice, 120));
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
  selectedRace = "human",
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
let sceneLoop = 0;
// Runs the animated title / creation backdrop while those screens are open.
function runScene(id, draw) {
  cancelAnimationFrame(sceneLoop);
  const tick = (now) => {
    const canvas = document.getElementById(id);
    if (!canvas || state === "game") return;
    draw(canvas, now / 1000);
    sceneLoop = requestAnimationFrame(tick);
  };
  sceneLoop = requestAnimationFrame(tick);
}
function showMenu() {
  state = "menu";
  modal = null;
  modalRoot.innerHTML = "";
  hud.hidden = true;
  screen.hidden = false;
  app.classList.remove("playing", "creating");
  app.classList.add("titled");
  syncPause();
  const hero = existingSave
    ? { characterClass: existingSave.characterClass, appearance: existingSave.appearance, race: existingSave.race, weapon: existingSave.equippedWeapon || existingSave.ownedWeapons[0], armor: existingSave.equippedArmor === "none" ? "chain" : existingSave.equippedArmor }
    : { characterClass: "warrior", weapon: "sword", armor: "chain" };
  screen.innerHTML = `<div class="title-screen"><canvas id="title-scene" aria-hidden="true"></canvas><div class="title-corner"><button class="icon-button" data-action="sound" aria-label="${tr("Включить или отключить звук", "Toggle audio")}">${icon(audio.enabled ? "sound" : "mute")}</button><button class="language-button" data-action="language">${language.toUpperCase()}</button></div><div class="title-ui"><div class="title-logo">${icon("crystal")}<div class="logo-word">${tr("ЭЛЬДЕРИЯ", "ELDERIA")}</div><div class="logo-sub">${tr("ХРОНИКИ ЗАБЫТОЙ ДОЛИНЫ", "CHRONICLES OF THE FORGOTTEN VALLEY")}</div></div><h1 class="title-tagline">${tr("В каждой долине есть своя <em>легенда.</em>", "Every valley holds a <em>legend.</em>")}</h1><nav class="title-menu">${existingSave ? btn(tr("Продолжить путешествие", "Continue adventure"), "continue", "primary", "play") : btn(tr("Начать путешествие", "Begin your adventure"), "create", "primary", "arrow")}${existingSave ? btn(tr("Новый герой", "New hero"), "create", "secondary", "plus") : ""}${btn(tr("Справочник путешественника", "Traveler’s guide"), "help", "secondary", "book")}</nav>${existingSave ? `<div class="save-caption">${escapeHTML(existingSave.name)} · ${label((races[existingSave.race] || races.human).name)} · ${label(classes[existingSave.characterClass].name)} · ${tr("Уровень", "Level")} ${existingSave.level}</div>` : ""}</div><footer class="title-footer"><span>${tr("Пиксельная action RPG", "A pixel action RPG")} · ${Object.keys(classes).length} ${tr("классов", "classes")} · ${Object.keys(races).length} ${tr("рас", "races")}</span><span>v2.9 · ${tr("Сохранения включены", "Autosave enabled")}</span></footer></div>`;
  runScene("title-scene", (canvas, t) => drawTitleScene(canvas, t, hero));
}
// Character creation: race column, animated hero at a campfire, class column.
function statBar(name, value, max, ic) {
  return `<div class="stat-bar">${icon(ic)}<span>${name}</span><i><b style="width:${Math.min(100, (value / max) * 100)}%"></b></i><strong>${value}</strong></div>`;
}
function showCreation() {
  state = "create";
  hud.hidden = true;
  screen.hidden = false;
  app.classList.add("creating");
  app.classList.remove("playing", "titled");
  syncPause();
  const c = classes[selectedClass],
    race = races[selectedRace],
    startingSkill =
      abilityCatalog[
        disciplines[
          weaponDiscipline({
            characterClass: selectedClass,
            equippedWeapon: selectedWeapon,
          })
        ].ids[0]
      ];
  const preview = deriveStats(
    { ...newSave("x", selectedClass, {}, selectedWeapon, selectedRace), equippedWeapon: selectedWeapon },
    c,
  );
  screen.innerHTML = `<div class="creation-screen">${titleBar(true)}<div class="creation-heading">${badge(tr("ГЛАВА I · НОВОЕ НАЧАЛО", "CHAPTER I · A NEW BEGINNING"))}<h1>${tr("Каким будет ваш <em>герой?</em>", "Who will your <em>hero be?</em>")}</h1></div>
  <section class="creation-grid">
    <div class="creation-col races-col"><h2 class="col-title">${tr("Раса", "Race")}</h2><div class="race-list">${Object.entries(races)
      .map(
        ([key, r]) =>
          `<button class="race-card ${selectedRace === key ? "selected" : ""}" data-race="${key}" aria-pressed="${selectedRace === key}"><b>${label(r.name)}</b><ul>${r.perks.map((p) => `<li>${label(p)}</li>`).join("")}</ul></button>`,
      )
      .join("")}</div><p class="race-desc">${label(race.desc)}</p></div>
    <div class="creation-col stage-col"><div class="hero-stage"><canvas id="hero-preview" width="200" height="190"></canvas><div class="stage-name"><b>${label(race.name)} · ${label(c.name)}</b><small>${label(c.tagline)}</small></div></div>
      <label class="input-label" for="hero-name">${tr("ИМЯ ГЕРОЯ", "HERO NAME")}</label><div class="name-input"><input id="hero-name" placeholder="${tr("Например, Элиан", "For example, Elian")}" maxlength="20" autocomplete="off" value="${escapeHTML(draftName)}">${icon("leaf")}</div>
      <div class="appearance-options"><div><span>${tr("Кожа", "Skin")}</span><div class="swatches">${race.skins.map((col) => `<button class="swatch ${appearance.skin === col ? "active" : ""}" style="--swatch:${col}" data-color="skin" data-value="${col}" aria-label="${tr("Цвет кожи", "Skin color")} ${col}"></button>`).join("")}</div></div><div><span>${tr("Волосы", "Hair")}</span><div class="swatches">${hairs.map((col) => `<button class="swatch ${appearance.hair === col ? "active" : ""}" style="--swatch:${col}" data-color="hair" data-value="${col}" aria-label="${tr("Цвет волос", "Hair color")} ${col}"></button>`).join("")}</div></div></div>
      <div class="creation-start">${btn(tr("Отправиться в путь", "Set out on your journey"), "start", "primary", "arrow")}<span>${icon("shield")}${tr("Прогресс сохраняется автоматически", "Your progress is saved automatically")}</span></div></div>
    <div class="creation-col class-col"><h2 class="col-title">${tr("Класс", "Class")}</h2><div class="class-list">${Object.entries(classes)
      .map(
        ([key, k]) =>
          `<button class="class-card ${selectedClass === key ? "selected" : ""}" data-class="${key}" aria-pressed="${selectedClass === key}"><canvas class="class-portrait" data-portrait="${key}" width="40" height="44"></canvas><b>${label(k.name)}</b></button>`,
      )
      .join("")}</div>
      <p class="class-desc">${label(c.desc)}</p>
      <div class="stat-bars">${statBar(tr("Здоровье", "Health"), preview.maxHp, 190, "heart")}${statBar(tr("Энергия", "Energy"), preview.maxMana, 160, "spark")}${statBar(tr("Урон", "Damage"), preview.damage, 40, "sword")}${statBar(tr("Скорость", "Speed"), Math.round(preview.speed), 140, "boot")}</div>
      <span class="input-label">${tr("СТАРТОВОЕ ОРУЖИЕ", "STARTING WEAPON")}</span><div class="starter-weapons">${starterWeapons(selectedClass)
        .map(([id, w]) => `<button data-start-weapon="${id}" class="starter-weapon ${id === selectedWeapon ? "selected" : ""}" aria-pressed="${id === selectedWeapon}">${icon(w.icon)}<span>${label(w.name)}</span></button>`)
        .join("")}</div><p class="weapon-note">${label(weapons[selectedWeapon].desc)}</p>
      <div class="class-skill">${icon(startingSkill.icon)}<div><span>${tr("ПЕРВОЕ УМЕНИЕ", "FIRST ABILITY")}</span><strong>${label(startingSkill.name)}</strong><p>${label(startingSkill.desc)}</p></div></div></div>
  </section></div>`;
  for (const cv of document.querySelectorAll("[data-portrait]")) {
    const ctx = cv.getContext("2d"),
      cls = cv.dataset.portrait;
    ctx.imageSmoothingEnabled = false;
    drawHero(ctx, 20, 42, cls, { scale: 0.95, weapon: defaultWeapon(cls), armor: "leather" });
  }
  // The preview hero idles by a campfire and swings the chosen weapon now and then.
  runScene("hero-preview", (cv, t) => {
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const g = ctx.createRadialGradient(100, 175, 10, 100, 160, 120);
    g.addColorStop(0, "#5a3218");
    g.addColorStop(1, "#120d0a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 200, 190);
    const flick = Math.sin(t * 12) * 2;
    ctx.fillStyle = `rgba(255,150,60,${0.12 + Math.sin(t * 9) * 0.03})`;
    ctx.beginPath();
    ctx.ellipse(100, 170, 90, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8702a";
    ctx.fillRect(160, 160 - flick, 10, 12 + flick);
    ctx.fillStyle = "#ffd06a";
    ctx.fillRect(163, 156 - flick, 4, 14 + flick);
    for (let i = 0; i < 6; i++) {
      const life = (t * 0.6 + i / 6) % 1;
      ctx.fillStyle = `rgba(255,190,90,${1 - life})`;
      ctx.fillRect(164 + Math.sin(t * 3 + i) * 5, 156 - life * 60, 2, 2);
    }
    const swing = (t % 3.2) < 0.35 ? (t % 3.2) : 0;
    drawHero(ctx, 92, 172, selectedClass, {
      race: selectedRace,
      player: true,
      ...appearance,
      weapon: selectedWeapon,
      armor: "none",
      scale: 3.2,
      time: t,
      swing,
      facing: Math.PI / 2,
    });
  });
}
function renderHUD() {
  previousQuestHTML = "";
  lastMapDraw = -Infinity;
  const s = game.save;
  hud.innerHTML = `<header class="game-header">${brand()}<nav><button class="nav-button" data-action="map">${icon("map")}<span>${tr("Карта", "Map")}</span><kbd>M</kbd></button><button class="nav-button" data-action="journal">${icon("book")}<span>${tr("Задания", "Quests")}</span><kbd>J</kbd></button><button class="nav-button" data-action="inventory">${icon("bag")}<span>${tr("Рюкзак", "Bag")}</span><kbd>I</kbd></button><button class="nav-button" data-action="skills">${icon("spark")}<span>${tr("Умения", "Skills")}</span><kbd>K</kbd><b class="skill-point-indicator" id="skill-points-dot"></b></button><i></i><button class="icon-button" data-action="sound" aria-label="${tr("Звук", "Sound")}">${icon(audio.enabled ? "sound" : "mute")}</button><button class="icon-button" data-action="pause" aria-label="${tr("Пауза", "Pause")}">${icon("pause")}</button></nav></header><div class="player-card"><div class="player-avatar"><canvas id="hud-avatar" width="52" height="55"></canvas><span id="level-label">${s.level}</span></div><div class="player-bars"><div class="player-name"><b>${escapeHTML(s.name)}</b><span id="class-label">${label(races[s.race]?.name || races.human.name)} · ${label(classes[s.characterClass].name)}</span></div><div class="resource-row hp">${icon("heart")}<div class="resource-bar"><i id="hp-fill"></i></div><span id="hp-value"></span></div><div class="resource-row mana">${icon("spark")}<div class="resource-bar"><i id="mana-fill"></i></div><span id="mana-value"></span></div><div class="xp-bar"><i id="xp-fill"></i></div><div class="xp-text" id="xp-text"></div></div></div><div class="location-badge">${icon("leaf")}<span id="location-name"></span><i></i>${icon("sun")}<span id="time-label"></span></div><aside class="quest-tracker"><div class="tracker-heading">${icon("flag")}<span>${tr("ВАШЕ ПРИКЛЮЧЕНИЕ", "YOUR ADVENTURE")}</span><button class="icon-button tiny" data-action="journal" aria-label="${tr("Открыть задания", "Open quests")}">${icon("arrow")}</button></div><h3 id="quest-title"></h3><div id="quest-steps"></div><div class="quest-direction" id="quest-direction"></div></aside><button class="minimap-box" data-action="map" aria-label="${tr("Открыть карту", "Open map")}"><canvas id="minimap" width="168" height="132"></canvas><span>${icon("map")}${tr("КАРТА ДОЛИНЫ", "VALLEY MAP")}<kbd>M</kbd></span></button><button class="weather-badge" data-action="weather" id="weather-badge"></button><div class="boss-health" id="boss-health" hidden></div><div class="dungeon-status" id="dungeon-status" hidden></div><div class="buff-display" id="buff-display"></div><div class="enemy-focus" id="enemy-focus" hidden></div><div class="bottom-left"><div class="gold-count">${icon("coin")}<b id="gold-value"></b><span>${tr("монет", "coins")}</span></div><div class="save-status"><span class="status-dot"></span>${tr("Автосохранение", "Autosave")}</div></div><div class="action-bar"><div class="hud-globe hp"><div class="globe-frame"><i class="globe-fill" id="hp-globe"></i><i class="globe-shine"></i></div><span id="hp-globe-text"></span></div><button class="action-slot" data-action="attack">${icon(equippedWeapon(s).icon)}<span>${tr("Атака", "Attack")}</span><kbd>SPACE</kbd></button>${[
    0, 1, 2, 3, 4,
  ]
    .map((i) => {
      const cfg = skillConfig(s, i);
      return `<button class="action-slot ${i === 0 ? "skill-slot" : "extra-skill"}" data-action="${i === 0 ? "skill" : "skill-" + i}" data-skill-slot="${i}" data-bar-slot="${i}" draggable="true" title="${label(cfg.name)} · ${label(cfg.desc)}">${icon(cfg.icon)}<span>${label(cfg.name)}</span><kbd>${keyLabel(game.controls.bindings["skill" + (i + 1)])}</kbd><em class="slot-cost">${cfg.cost}</em><i class="slot-cooldown" id="slot-cd-${i}"></i>${i === 0 ? '<i id="skill-overlay"></i><b id="skill-countdown"></b>' : `<b id="extra-cooldown-${i}"></b>`}<i class="ability-lock" id="skill-lock-${i}">${icon("lock")}</i></button>`;
    })
    .join(
      "",
    )}<button class="action-slot" data-action="dodge">${icon("boot")}<span>${tr("Рывок", "Dodge")}</span><kbd>SHIFT</kbd><b id="dodge-countdown"></b></button><i class="slot-divider"></i><button class="action-slot potion-slot" data-action="potion">${icon("potion")}<span>${tr("Зелье", "Potion")}</span><kbd>R</kbd><b id="potion-count"></b><i class="potion-countdown" id="potion-countdown"></i></button><button class="action-slot interact-slot" data-action="interact">${icon("leaf")}<span>${tr("Действие", "Interact")}</span><kbd>E</kbd></button><div class="hud-globe mana"><div class="globe-frame"><i class="globe-fill" id="mana-globe"></i><i class="globe-shine"></i></div><span id="mana-globe-text"></span></div></div><div class="interaction-prompt" id="interaction-prompt" data-action="interact" role="button" hidden></div><div class="movement-tip" id="movement-tip"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>${tr("Движение", "Move")}</span><i></i><span>${tr("Нажмите на тропу, чтобы идти", "Click a trail to walk")}</span><button data-action="dismissTip" aria-label="${tr("Скрыть подсказку", "Hide hint")}">×</button></div><div class="touch-joystick" id="joystick"><div class="joystick-knob"></div></div>`;
  const ctx = document.querySelector("#hud-avatar").getContext("2d");
  ctx.imageSmoothingEnabled = false;
  drawHero(ctx, 26, 50, s.characterClass, {
    ...s.appearance,
    race: s.race,
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
  document.querySelector("#hp-globe").style.height =
    `${Math.max(0, Math.min(100, (s.hp / stats.maxHp) * 100))}%`;
  document.querySelector("#mana-globe").style.height =
    `${Math.max(0, Math.min(100, (s.mana / stats.maxMana) * 100))}%`;
  document.querySelector("#hp-globe-text").textContent =
    `${Math.ceil(s.hp)} / ${stats.maxHp}`;
  document.querySelector("#mana-globe-text").textContent =
    `${Math.floor(s.mana)} / ${stats.maxMana}`;
  document.querySelector("#xp-text").textContent = tr(
    `Опыт ${Math.floor(s.xp)} / ${game.xpNeeded}${s.skillPoints ? ` · очков: ${s.skillPoints}` : ""}`,
    `XP ${Math.floor(s.xp)} / ${game.xpNeeded}${s.skillPoints ? ` · points: ${s.skillPoints}` : ""}`,
  );
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
  document.querySelector("#location-name").textContent = s.interior
    ? label(interiorDefs[s.interior.id].name)
    : label(regions[game.currentRegion] || regions.village);
  const climate = game.climate,
    hours = Math.floor(climate.hour);
  document.querySelector("#time-label").textContent =
    `${String(hours).padStart(2, "0")}:${String(Math.floor((climate.hour % 1) * 60)).padStart(2, "0")}`;
  document.querySelector("#weather-badge").innerHTML =
    `${icon(climate.weather === "snow" ? "snow" : climate.weather === "storm" ? "spark" : "sun")}<span>${label(seasonNames[climate.season])} · ${label(weatherNames[climate.weather])}${climate.night ? " · " + tr("Ночь", "Night") : ""}</span>`;
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
    dungeonEl.innerHTML = `<strong>${label(difficulties[d.difficulty || 0].name)} · ${tr("Этаж", "Floor")} ${d.floor}/${dungeons[d.id].floors}</strong><span>${tr("Стражи", "Guards")}: ${game.enemies.filter((e) => e.hp > 0 && !e.boss && !e.summoned).length}${game.world.gateOpen ? " · " + tr("Зал открыт", "Hall open") : ""}</span>`;
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
    document.querySelector("#slot-cd-" + i).style.height =
      cd > 0 ? `${Math.min(100, (cd / cfg.cooldown) * 100)}%` : "0";
    document
      .querySelector(`[data-skill-slot="${i}"]`)
      .classList.toggle("no-mana", cfg.rank > 0 && s.mana < cfg.cost);
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
    ["berserk", "sword", tr("Ярость зверя", "Beast rage")],
    ["avatar", "holy", tr("Аватар света", "Avatar of light")],
    ["divineShield", "shield", tr("Божественный щит", "Divine shield")],
    ["retribution", "sun", tr("Возмездие", "Retribution")],
    ["pact", "skull", tr("Тёмный пакт", "Dark pact")],
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
  app.classList.remove("creating", "titled");
  game.load(save);
  existingSave = save;
  previousQuestHTML = "";
  audio.unlock();
  renderHUD();
  syncPause();
  if (save.hp <= 0) showDeath();
  // A brand-new hero first hears the chronicle of the valley (automated test browsers skip it).
  else if (save.playtime < 1 && !save.flags.introSeen && !navigator.webdriver) {
    resetIntroScene();
    showIntro(0);
  }
  else if (save.playtime < 1)
    toast(
      tr(
        "Оружие уже в руках. Поговорите со старостой Оливером у костра — он ждёт вас.",
        "Your weapon is in hand. Speak to Elder Oliver by the campfire — he is waiting.",
      ),
    );
}
// ---------- The opening chronicle ----------
let introFrame = null,
  introPage = 0;
function showIntro(page = 0) {
  const pages = introPages();
  introPage = page;
  const p = pages[page];
  openModal(
    p.title,
    `<div class="intro"><div class="intro-frame"><canvas id="intro-scene" width="320" height="180"></canvas><span class="intro-chapter">${tr("ГЛАВА", "CHAPTER")} ${["I", "II", "III", "IV", "V", "VI"][page]}</span></div><div class="intro-caption"><h3 class="intro-title">${p.title}</h3><p class="intro-text" data-full="${escapeHTML(p.text)}"></p></div><div class="intro-foot"><div class="intro-dots">${pages.map((_, i) => `<i class="${i === page ? "on" : i < page ? "seen" : ""}"></i>`).join("")}</div><div class="dialog-actions">${btn(tr("Пропустить", "Skip"), "introDone", "secondary")}${page < pages.length - 1 ? btn(tr("Далее", "Next"), "introNext", "primary", "arrow") : btn(tr("Начать путь", "Begin the journey"), "introDone", "primary", "flag")}</div></div></div>`,
    "intro-modal",
    tr("ХРОНИКИ ЗАБЫТОЙ ДОЛИНЫ", "CHRONICLES OF THE FORGOTTEN VALLEY"),
  );
  cancelAnimationFrame(introFrame);
  const canvas = document.querySelector("#intro-scene"),
    text = document.querySelector(".intro-text"),
    full = p.text,
    started = performance.now(),
    loop = () => {
      if (!document.body.contains(canvas)) return;
      const t = (performance.now() - started) / 1000;
      drawIntroScene(canvas, page, t);
      // The chronicle writes itself after the picture fades in.
      const shown = Math.max(0, Math.floor((t - 0.6) * 45));
      if (text.textContent.length < full.length) text.textContent = full.slice(0, shown);
      introFrame = requestAnimationFrame(loop);
    };
  // A click on the scene finishes the line at once.
  canvas.addEventListener("click", () => (text.textContent = full));
  loop();
}
function finishIntro() {
  cancelAnimationFrame(introFrame);
  if (game.save) game.save.flags.introSeen = true;
  game.persist();
  closeModal();
  toast(tr("Найдите старосту Оливера у костра Лиственной деревни.", "Find Elder Oliver by the Leafhaven campfire."));
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
// Game-style conversation: our hero on the left, the speaker on the right,
// text in the middle with numbered answers (keys 1-9 pick an answer).
let typeTimer = null;
function dialog(o, text, buttons, extra = "") {
  const s = game.save;
  openModal(
    label(o.name),
    `<div class="vn-dialog"><div class="vn-portrait hero"><canvas id="vn-hero" width="120" height="132"></canvas><span>${escapeHTML(s?.name || "")}</span></div><div class="vn-center"><span class="vn-role">${label(o.role || ["Житель долины", "Valley resident"])}</span><h3>${label(o.name)}</h3><p class="vn-text" data-full="${escapeHTML(text)}"></p><div class="vn-choices">${buttons}</div></div><div class="vn-portrait npc"><canvas id="vn-npc" width="120" height="132"></canvas><span>${label(o.name)}</span></div></div>${extra ? `<div class="vn-extra">${extra}</div>` : ""}`,
    "dialog vn",
    tr("РАЗГОВОР", "CONVERSATION"),
  );
  const hero = document.querySelector("#vn-hero").getContext("2d"),
    npc = document.querySelector("#vn-npc").getContext("2d");
  hero.imageSmoothingEnabled = npc.imageSmoothingEnabled = false;
  if (s)
    drawHero(hero, 60, 122, s.characterClass, {
      ...s.appearance,
      race: s.race,
      player: true,
      equipment: s.equippedWearables,
      weapon: s.equippedWeapon,
      armor: s.equippedArmor,
      scale: 2.6,
      facing: 0,
    });
  drawHero(npc, 60, 122, o.style, { scale: 2.6, facing: Math.PI });
  // Typewriter reveal; a click on the text shows it instantly.
  const el = document.querySelector(".vn-text"),
    full = text.replace(/<[^>]+>/g, "");
  let shown = 0;
  clearInterval(typeTimer);
  typeTimer = setInterval(() => {
    shown = Math.min(full.length, shown + 3);
    el.textContent = full.slice(0, shown);
    if (shown >= full.length) clearInterval(typeTimer);
  }, 16);
  el.addEventListener("click", () => {
    clearInterval(typeTimer);
    el.textContent = full;
  });
}
// Story scenes: the conversation decides what happens next. Class and race answers are tagged.
function playScene(id, node = "start", answer = null) {
  const s = game.save,
    sc = scenes[id],
    buttons = sceneChoices(s, id, node)
      .map((ch) => {
        const tag = choiceTag(s, ch);
        return `<button class="button ${ch.primary ? "primary" : "secondary"} ${tag ? "tagged" : ""}" data-action="sc-${id}-${node}-${ch.id}">${tag ? `<em class="choice-tag">[${escapeHTML(tag)}]</em>` : ""}<span>${label(ch.text)}</span></button>`;
      })
      .join("");
  dialog(sc.speaker(s), answer ? label(answer) : sceneText(s, id, node), buttons);
}
function storyCtx() {
  const s = game.save,
    st = storyOf(s),
    ctx = { s, st, g: game, closed: false };
  const done = (message) => {
    ctx.closed = true;
    saveAndUpdate();
    closeModal();
    if (message) toast(message);
  };
  Object.assign(ctx, {
    log: (entry) => {
      st.log.push(entry);
      if (st.log.length > 40) st.log.shift();
    },
    startQuest: (entry) => {
      ctx.log(entry);
      s.quest = 1;
      done(tr("Новое задание: «Шёпот обелиска». Лесной обелиск — к северу.", "New quest: “Whisper of the obelisk”. The forest obelisk lies north."));
    },
    setQuest: (n) => {
      s.quest = n;
      audio.effect("quest");
      done(tr("Задание обновлено. Загляните в журнал.", "Quest updated. Check your journal."));
    },
    wave: (tag, anchor, list) => {
      game.spawnStoryWave(tag, anchor, list);
      done(tr("Скверна поднимается! Отбейтесь — и обелиск загорится.", "The blight rises! Fight it off and the obelisk will ignite."));
    },
    light: (id) => game.lightObelisk(id),
    rinReward: (gone) => {
      s.gold += gone ? 0 : 90;
      game.addXp(80);
      s.quest = 5;
      done(gone ? tr("Рин ушёл. Путь к Сердцу долины — на юго-восток, через руины.", "Rin is gone. The way to the Heart lies south-east, through the ruins.") : tr("Рин показал тропу к Сердцу долины. +90 монет.", "Rin showed you the trail to the Heart. +90 coins."));
    },
    awaken: (hp, dmg, entry) => {
      s.flags.bossAwake = true;
      const e = game.enemies.find((e) => e.type === "guardian" && e.hp > 0);
      if (e) game.shapeBoss(e, hp, dmg);
      ctx.log(entry);
      done(tr("Страж пробудился. Следите за красным кругом!", "The Warden is awake. Watch for the red circle!"));
    },
    spare: () => {
      const e = game.enemies.find((e) => e.type === "guardian");
      st.fate.guardian = "spared";
      st.dawn += 1;
      s.flags.guardianBlessing = true;
      s.flags.bossAwake = s.flags.bossDefeated = true;
      s.quest = 6;
      ctx.log(["Страж Ардана уснул без боя и благословил вас: +40 к здоровью.", "Ardan's Warden lay down without a fight and blessed you: +40 health."]);
      if (e) {
        e.hp = 0;
        game.defeated.add(e.id);
        game.bossDrop(e);
        game.addXp(e.xp);
        game.enemies = game.enemies.filter((x) => x !== e);
      }
      done(tr("Страж уснул навсегда. Вернитесь к Оливеру.", "The Warden sleeps forever. Return to Oliver."));
    },
    finishAct: () => {
      if (st.trust > -2) s.gold += 200;
      game.addXp(150);
      s.quest = 7;
      s.flags.victory = true;
      done(tr("Новая глава: «Четыре печати глубин».", "New chapter: “Four depth seals”."));
    },
    rift: (hp, dmg, entry) => {
      if (!game.openRift()) {
        ctx.closed = true;
        closeModal();
        toast(tr("Подойдите ближе к Сердцу долины.", "Move closer to the Heart of the valley."));
        return;
      }
      const boss = game.enemies.find((e) => e.type === "eclipse");
      const extraHp = (st.fate.ivva === "pact" ? 0.9 : 1) * (st.mods.darkResonance ? 0.85 : 1),
        extraDmg = st.fate.ivva === "redeemed" ? 0.85 : 1;
      if (boss) game.shapeBoss(boss, hp * extraHp, dmg * extraDmg);
      if (st.fate.rin === "enemy") game.spawnStoryWave("ashen", "altar", [["bandit", 3]]);
      ctx.log(entry);
      done(st.fate.rin === "enemy" ? tr("Нерей вышел на свет — и с ним Рин во главе Пепельных!", "Nerei steps into the light — and Rin leads the Ashen beside him!") : tr("Разлом открыт. Нерей Бессветный выходит на свет!", "The rift is open. Nerei the Lightless steps into the light!"));
    },
    ending: (kind) => {
      ctx.closed = true;
      if (kind === "peace") {
        s.quest = 11;
        s.gold += 300;
        s.skillPoints += 2;
        s.flags.reconciled = s.flags.dawnHero = true;
        game.addXp(600);
        audio.effect("quest");
        saveAndUpdate();
        showEnding();
      } else action(kind === "dusk" ? "epilogueDusk" : "epilogue");
    },
  });
  return ctx;
}
function runSceneChoice(name) {
  const [, id, node, cid] = name.split("-"),
    s = game.save,
    st = storyOf(s),
    ch = scenes[id]?.nodes[node]?.choices.find((c) => c.id === cid);
  // Follow-up narration ("free" nodes) may end after the scene moved the story on.
  if (!ch || (!scenes[id].nodes[node].free && !sceneOpen(s, id)) || !sceneChoices(s, id, node).includes(ch)) {
    closeModal();
    return;
  }
  const ctx = storyCtx(),
    next = ch.run ? ch.run(ctx) : undefined;
  if (ctx.closed) return;
  if (ch.answer) {
    st.seen.push(id + ":" + cid);
    saveAndUpdate();
    playScene(id, node, ch.answer);
    return;
  }
  saveAndUpdate();
  if (typeof next === "string") playScene(id, next);
  else closeModal();
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
let journalTab = "story";
function showJournal() {
  const s = game.save,
    q = questInfo(s),
    tabs = [
      ["story", tr("Сюжет", "Story"), "book"],
      ["fates", tr("Решения", "Choices"), "flag"],
      ["lore", tr("Летопись", "Chronicle"), "book"],
      ["people", tr("Жители", "Villagers"), "home"],
      ["bosses", tr("Боссы и подземелья", "Bosses & dungeons"), "skull"],
      ["stats", tr("Итоги", "Records"), "crown"],
    ];
  const side = [
    ["leaf", tr("Запасы для Миры", "Supplies for Mira"), s.flags.herbQuestDone, s.flags.herbQuestDone ? tr("Завершено · награда получена", "Completed · reward claimed") : s.flags.herbQuest ? tr(`Принесите 6 трав: ${s.inventory.herb}/6. Награда: 3 зелья и 50 монет.`, `Bring 6 herbs: ${s.inventory.herb}/6. Reward: 3 potions and 50 coins.`) : tr("Поговорите с травницей в Лиственной деревне.", "Speak to the herbalist in Leafhaven.")],
    ["sword", tr("Работа для кузнеца", "A smith’s work"), s.flags.smithQuestDone, s.flags.smithQuestDone ? tr("Завершено · награда получена", "Completed · reward claimed") : s.flags.smithQuest ? tr(`Принесите 4 руды: ${s.inventory.ore}/4. Награда: улучшение оружия.`, `Bring 4 ore: ${s.inventory.ore}/4. Reward: a weapon upgrade.`) : tr("Поговорите с Брамом у кузницы.", "Speak to Bram by the forge.")],
    ["target", tr("Патруль дальних земель", "Farlands patrol"), s.flags.expeditionDone, s.flags.expeditionDone ? tr("Завершено · оружие получено", "Completed · weapon claimed") : s.flags.expedition ? tr(`Волки ${s.kills.wolf || 0}/6 · Стражи ${s.kills.sentinel || 0}/4`, `Wolves ${s.kills.wolf || 0}/6 · Sentinels ${s.kills.sentinel || 0}/4`) : tr("Капитан Лея ждёт на Речной пристани.", "Captain Lea awaits in Riverport.")],
  ];
  const st = storyOf(s),
    log = storyLog(s),
    fates = fateLines(s),
    lean = st.dawn - st.dusk;
  const body = {
    lore: `<div class="lore-list">${loreEntries().map(([t, x]) => `<article><h3>${t}</h3><p>${x}</p></article>`).join("")}</div>${btn(tr("Пересмотреть вступление", "Replay the opening"), "intro", "secondary", "book")}`,
    fates: `<div class="story-balance"><span>${icon("sun")}${tr("Рассвет", "Dawn")} <b>${st.dawn}</b></span><div class="balance-bar"><i style="left:${Math.max(4, Math.min(96, 50 - lean * 6))}%"></i></div><span><b>${st.dusk}</b> ${tr("Сумерки", "Dusk")}${icon("moon")}</span></div><p class="fine-print">${lean > 1 ? tr("Знак на ладони светится золотом. Свет ведёт вас.", "The Mark glows gold. Light guides you.") : lean < -1 ? tr("Знак на ладони подёрнут серым пеплом. Тьма ближе, чем кажется.", "The Mark is veiled in grey ash. Darkness is closer than it seems.") : tr("Знак мерцает — вы ещё не выбрали сторону.", "The Mark flickers — you have not yet chosen a side.")} ${tr("Доверие Оливера", "Oliver's trust")}: <b>${st.trust > 0 ? "+" : ""}${st.trust}</b></p>${fates.length ? `<h3 class="small-heading">${tr("СУДЬБЫ", "FATES")}</h3><ul class="fate-list">${fates.map((f) => `<li>${escapeHTML(f)}</li>`).join("")}</ul>` : ""}<h3 class="small-heading">${tr("ВАШИ РЕШЕНИЯ", "YOUR DECISIONS")}</h3>${log.length ? `<ol class="decision-log">${log.map((e) => `<li>${escapeHTML(e)}</li>`).join("")}</ol>` : `<p class="fine-print">${tr("Вы ещё не приняли ни одного решения. Каждый ответ в разговорах меняет историю.", "You haven't made any decisions yet. Every answer in a conversation changes the story.")}</p>`}`,
    story: `<div class="journal-main"><span class="quest-type">${tr("ОСНОВНАЯ ИСТОРИЯ", "MAIN STORY")} · ${chapterLabel(s.quest)}</span><h3>${q.title}</h3><p>${q.desc}</p>${q.steps.map(([name, have, need]) => `<div class="journal-step ${have >= need ? "done" : ""}">${icon(have >= need ? "check" : "flag")}<span>${name}</span><b>${Math.min(have, need)} / ${need}</b></div>`).join("")}${btn(tr("Посмотреть на карте", "Show on map"), "map", "secondary", "map")}</div><div class="chapter-line">${[0, 3, 7, 8, 11].map((n, i) => `<span class="${s.quest >= n ? "reached" : ""}">${["I", "II", "III", "IV", "★"][i]}</span>`).join("<i></i>")}</div>`,
    people: `<div class="side-quests">${side.map(([ic, title, done, text]) => `<div class="${done ? "done" : ""}">${icon(ic)}<span><strong>${title}</strong><small>${text}</small></span>${done ? icon("check") : ""}</div>`).join("")}</div>${btn(tr("Доска поручений", "Contract board"), "contracts", "secondary", "flag")}`,
    bosses: `<h3 class="small-heading">${tr("МИРОВЫЕ БОССЫ · ВОЗРОЖДАЮТСЯ ЧЕРЕЗ 20 МИН", "WORLD BOSSES · RETURN AFTER 20 MIN")}</h3><div class="world-boss-list">${worldBosses.map((b) => `<div class="${s.flags["wb-" + b.type] ? "done" : ""}">${icon(s.flags["wb-" + b.type] ? "check" : "skull")}<span><strong>${label(b.name)}</strong><small>${label(regions[{ treant: "amberwood", sandWorm: "island", witch: "marsh", banditKing: "badlands", cyclops: "highlands", frostWyrm: "tundra" }[b.type]])} · ${tr("ур.", "lvl")} ${b.baseLevel}+ · ${label(wearables[b.trophy].name)}</small></span></div>`).join("")}</div><h3 class="small-heading">${tr("ПЕЧАТИ ГЛУБИН", "DEPTH SEALS")}</h3>${dungeonCards()}`,
    stats: `<div class="journal-stats"><span>${tr("Мест открыто", "Places discovered")}<b>${s.discovered.length} / ${Object.keys(regions).length}</b></span><span>${tr("Сундуков найдено", "Chests found")}<b>${s.collected.filter((x) => x.startsWith("chest")).length} / ${CHEST_COUNT}</b></span><span>${tr("Время в долине", "Time in the valley")}<b>${Math.floor(s.playtime / 60)} ${tr("мин", "min")}</b></span><span>${tr("Врагов побеждено", "Foes defeated")}<b>${Object.values(s.kills).reduce((a, b) => a + b, 0)}</b></span><span>${tr("Подземелий пройдено", "Dungeons cleared")}<b>${Object.values(s.dungeonClears).reduce((a, b) => a + b, 0)}</b></span><span>${tr("Рыбы поймано", "Fish caught")}<b>${s.activities.catches}</b></span></div>`,
  }[journalTab];
  openModal(
    tr("Журнал приключений", "Adventure journal"),
    `<div class="vendor-tabs journal-tabs">${tabs.map(([id, name, ic]) => `<button class="recipe-chip ${journalTab === id ? "active" : ""}" data-action="journalTab-${id}">${icon(ic)}${name}</button>`).join("")}</div>${body}`,
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
// Character sheet and gear comparison: every stat a piece changes, with the delta.
function statLines(st) {
  return [
    ["sword", tr("Урон", "Damage"), st.damage],
    ["shield", tr("Защита", "Defense"), st.defense],
    ["heart", tr("Здоровье", "Health"), st.maxHp],
    ["spark", tr("Энергия", "Energy"), st.maxMana],
    ["target", tr("Крит", "Crit"), Math.round(st.crit * 100), "%"],
    ["boot", tr("Скорость", "Speed"), Math.round(st.speed)],
    ["map", tr("Дальность", "Range"), Math.round(st.range / TILE * 10) / 10],
    ["reset", tr("Восст. энергии", "Energy regen"), Math.round(st.manaRegen * 100) / 100, "/s"],
  ];
}
function fullStats(save) {
  const st = deriveStats(save, classes[save.characterClass]);
  return { ...st, crit: critChance(save, st.weapon) };
}
function characterSheet() {
  return `<div class="char-sheet">${statLines(fullStats(game.save)).map(([ic, name, v, unit = ""]) => `<span>${icon(ic)}<small>${name}</small><b>${v}${unit}</b></span>`).join("")}</div>`;
}
function gearComparison(kind, id) {
  const s = game.save,
    trial = { ...s, equippedWearables: { ...s.equippedWearables } };
  if (kind === "w") trial.equippedWeapon = id;
  else if (kind === "a") trial.equippedArmor = id;
  else trial.equippedWearables[wearables[id].slot] = id;
  const now = statLines(fullStats(s)),
    then = statLines(fullStats(trial));
  const rows = then
    .map(([ic, name, v, unit = ""], i) => {
      const d = Math.round((v - now[i][2]) * 100) / 100;
      return d ? `<span class="${d > 0 ? "up" : "down"}">${icon(ic)}${name} ${d > 0 ? "+" : ""}${d}${unit}</span>` : "";
    })
    .join("");
  return `<div class="gear-compare">${rows || `<span>${tr("Не меняет характеристики (уже надето?)", "No stat change (already equipped?)")}</span>`}</div>`;
}
function bagItemDescription(e) {
  if (!e) return tr("Нажмите предмет: здесь появятся свойства и действия. Снаряжение также можно перетащить на героя.", "Select an item to see its properties and actions. You can also drag equipment onto your hero.");
  if (e.type === 'w') {
    const w = weapons[e.id], stats = deriveStats({...game.save, equippedWeapon:e.id}, classes[game.save.characterClass]);
    return `${label(w.desc)} · Lv. ${w.level || 1} · ${stats.damage} ${tr('урона','damage')} · ${w.cooldown} ${tr('с между атаками','s between attacks')}${gearComparison('w', e.id)}`;
  }
  if (e.type === 'a' || e.type === 'g') {
    const a = e.type === 'a' ? armors[e.id] : wearables[e.id];
    return `Lv. ${a.level || 1} · +${a.defense} ${tr('защиты','defense')} · +${a.hp} HP${a.mana ? ` · +${a.mana} MP` : ''}${a.speed ? ` · ${a.speed > 0 ? '+' : ''}${a.speed} ${tr('скорости','speed')}` : ''}${a.crit ? ` · +${Math.round(a.crit*100)}% ${tr('крит','crit')}` : ''}${gearComparison(e.type, e.id)}`;
  }
  return label(materialHints[e.id] || {
    rod:['Нужна для рыбалки. На берегу со знаком рыбы нажмите E.','Required for fishing. Press E at shores marked with a fish.'],
    bait:['Расходуется при забросе и расширяет зону успешной подсечки.','Consumed when casting; widens the successful hook zone.'],
    bandage:['Восстанавливает 25 HP и снимает отравление. Общий откат еды и зелий: 8 с.','Restores 25 HP and cures poison. Food and potions share an 8 s cooldown.'],
    cookedFish:['Восстанавливает 40 HP и 15 энергии. Общий откат: 8 с.','Restores 40 HP and 15 energy. Shared cooldown: 8 s.'],
    berry:['Восстанавливает 12 HP. Общий откат: 8 с.','Restores 12 HP. Shared cooldown: 8 s.'],
    potion:['Восстанавливает 65 HP. Общий откат: 8 с.','Restores 65 HP. Shared cooldown: 8 s.'],
    manaPotion:['Восстанавливает 60 энергии. Общий откат: 8 с.','Restores 60 energy. Shared cooldown: 8 s.'],
  }[e.id] || (e.id.includes('Scroll') ? ['Прочитайте манускрипт своего класса: +1 очко навыка.','Read a manuscript of your class: +1 skill point.'] : ['Материал для ремесла или торговли.','A material for crafting or trading.']));
}
let invTab = "gear";
function bagRarity(e) {
  if (e.type === "w") return weapons[e.id].rarity || "common";
  if (e.type === "a") return armors[e.id].rarity || ((armorTier[e.id] || 1) >= 5 ? "epic" : (armorTier[e.id] || 1) >= 3 ? "rare" : "common");
  if (e.type === "g") {
    const w = wearables[e.id];
    return w.source ? "legendary" : w.level >= 10 ? "epic" : w.level >= 5 ? "rare" : "common";
  }
  return e.id === "essence" ? "epic" : e.id.endsWith("Scroll") || e.id === "pearl" ? "rare" : "common";
}
function showInventory() {
  const s = game.save, all = bagEntries(), entries = all.filter(e => bagFilter === 'all' || (bagFilter === 'gear' ? e.type !== 'i' : bagFilter === 'materials' ? e.type === 'i' && materialHints[e.id] : e.type === 'i' && !materialHints[e.id])),
    chosen = all.find(e => e.key === bagSelected), r = selectedRecipe(), reason = r ? game.craftReason(r.id) : '',
    batch = r && !r.gear ? Math.min(99, ...Object.entries(r.inputs).map(([k,n]) => Math.floor((s.inventory[k] || 0)/n))) : 1,
    equipped = {...s.equippedWearables, mainhand:s.equippedWeapon, chest:s.equippedArmor === 'none' ? null : s.equippedArmor};
  const slot = (key) => {
    const name = slotNames[key], id = equipped[key], a = key === 'mainhand' ? weapons[id] : key === 'chest' ? armors[id] : wearables[id];
    return `<button class="gear-cell ${id ? 'filled' : ''}" data-gear-slot="${key}" data-action="unequip-${key}" title="${label(name)}${a ? ' · '+label(a.name)+' · '+tr('Нажмите, чтобы снять','Click to remove') : ''}">${icon(id ? a.icon || gearIcon(key) : gearIcon(key))}<small>${a ? label(a.name) : label(name)}</small></button>`;
  };
  let selectedActions = '';
  if (chosen) {
    if (chosen.type !== 'i') {
      const a=({w:weapons,a:armors,g:wearables})[chosen.type][chosen.id], locked=s.level < (a.level || 1);
      selectedActions = `<button class="button primary" data-action="${({w:'equip-',a:'armorEquip-',g:'wearEquip-'})[chosen.type]+chosen.id}" ${locked ? 'disabled' : ''}>${locked ? tr('Нужен уровень '+a.level,'Requires level '+a.level) : tr('Надеть / взять в руки','Equip')}</button>`;
    }
    else if (['berry','cookedFish','bandage'].includes(chosen.id)) selectedActions = btn(tr('Использовать','Use'),'eat-'+chosen.id,'primary');
    else if (['potion','manaPotion'].includes(chosen.id)) selectedActions = btn(tr('Использовать','Use'),'use-'+chosen.id,'primary');
    else if (chosen.id === s.characterClass + 'Scroll') selectedActions = btn(tr('Прочитать · +1 очко','Read · +1 point'),'readScroll','primary','book');
    else if (recipes.some(r => chosen.id in r.inputs)) selectedActions = btn(tr('Подходящие рецепты','Matching recipes'),'recipesFor-'+chosen.id,'secondary','book');
  }
  const tabs = `<div class="vendor-tabs inv-tabs">${[['gear',tr('Снаряжение','Equipment'),'bag'],['craft',tr('Ремесло','Crafting'),'wood']].map(([id,n,ic]) => `<button class="recipe-chip ${invTab === id ? 'active' : ''}" data-action="invTab-${id}">${icon(ic)}${n}</button>`).join('')}</div>`;
  const head = `<div class="inventory-heading"><div>${badge(escapeHTML(s.name)+' · '+label((races[s.race] || races.human).name)+' · '+label(classes[s.characterClass].name)+' · Lv. '+s.level)}</div><div class="inventory-gold">${icon('coin')}${s.gold}</div></div>`;
  const gearTab = `<div class="inv-layout"><section class="doll-panel"><div class="paperdoll2"><div class="doll-col">${['head','chest','legs','feet'].map(slot).join('')}</div><canvas id="paperdoll" width="160" height="190"></canvas><div class="doll-col">${['mainhand','offhand'].map(slot).join('')}</div></div>${characterSheet()}</section>
  <section class="bag-panel"><div class="bag-filters">${[['all','Всё','All'],['gear','Снаряжение','Equipment'],['materials','Материалы','Materials'],['supplies','Расходники','Supplies']].map(([id,ru,en]) => `<button class="recipe-chip ${bagFilter === id ? 'active' : ''}" data-action="bagFilter-${id}" aria-pressed="${bagFilter === id}">${tr(ru,en)}</button>`).join('')}</div>
  <div class="block-backpack">${Array.from({length:Math.max(24,Math.ceil(entries.length/6)*6)},(_,i) => {const e=entries[i]; return `<button class="bag-cell ${e ? 'rarity-cell-' + bagRarity(e) : ''} ${e?.key===bagSelected ? 'selected' : ''}" data-bag-index="${all.indexOf(e) < 0 ? all.length+i : all.indexOf(e)}" ${e ? `data-bag-key="${e.key}" draggable="true" data-action="bagSelect-${e.key}" title="${e.name}" aria-label="${e.name} · ${e.n}"` : 'aria-label="'+tr('Пустая ячейка','Empty slot')+'"'}>${e ? icon(e.icon)+`<span class="bag-name">${e.name}</span>${e.n > 1 ? `<b>${e.n}</b>` : ''}` : ''}</button>`;}).join('')}</div>
  <div class="bag-description"><div><h3 class="${chosen ? 'rarity-' + bagRarity(chosen) : ''}">${chosen ? chosen.name : tr('Выберите предмет','Select an item')}</h3><p>${bagItemDescription(chosen)}</p></div>${selectedActions}</div></section></div>`;
  const craftTab = `<div class="craft-tab"><div class="small-workbench"><h3>${tr('Верстак · выберите рецепт','Workbench · choose a recipe')}</h3><select id="recipe-picker" aria-label="${tr('Рецепт','Recipe')}"><option value="">${tr('Выберите, что создать…','Choose what to craft…')}</option>${recipes.map(q => `<option value="${q.id}" ${r?.id === q.id ? 'selected' : ''}>${label(q.name)}${recipeItem(q).n > 1 ? ' × '+recipeItem(q).n : ''}</option>`).join('')}</select>
  <div class="craft-layout"><div class="craft-cells">${[0,1,2,3].map(i => `<button class="bag-cell" data-craft-cell="${i}" data-action="craftClear-${i}" title="${craftDraft[i] ? label(items[craftDraft[i]]) : tr('Перетащите материал','Drag an ingredient')}">${craftDraft[i] ? icon(itemIcon(craftDraft[i])) : ''}</button>`).join('')}</div>${icon('arrow')}<button class="craft-output bag-cell" data-action="craftOutput" ${!r || reason ? 'disabled' : ''}>${icon(r ? recipeItem(r).icon : 'book')}<small>${r ? recipeItem(r).name+' × '+recipeItem(r).n : tr('Результат','Output')}</small></button></div>
  ${r ? ingredientCounts(r.inputs)+`<p class="craft-status ${reason ? 'missing' : 'enough'}" role="status">${reason || tr('Материалы есть · можно создать','Ingredients ready · craft now')}</p><div class="gear-actions"><button class="button primary" data-action="craftMake-${r.id}-1" ${reason ? 'disabled' : ''}>${tr('Создать','Craft')} ${recipeItem(r).n > 1 ? '× '+recipeItem(r).n : ''}${r.gear ? tr(' и надеть',' & equip') : ''}</button>${batch > 1 ? `<button class="button secondary" data-action="craftMake-${r.id}-${batch}" ${reason ? 'disabled' : ''}>${tr('Создать всё','Craft all')} (${batch * recipeItem(r).n})</button>` : ''}</div>` : `<p>${tr('Выберите рецепт: материалы расставятся автоматически и спишутся только после нажатия «Создать».','Choose a recipe: ingredients fill in automatically and are spent only when you press Craft.')}</p>`}
  </div><h3 class="small-heading">${tr('РЕЦЕПТЫ','RECIPES')}</h3><div class="recipe-list">${recipes.filter(q => !recipeMaterial || recipeMaterial in q.inputs).map(q => `<button class="recipe-chip ${r?.id===q.id ? 'active' : ''}" data-action="recipe-${q.id}" title="${materialText(q.inputs)}">${icon(recipeItem(q).icon)}<span>${label(q.name)}<small>${recipeItem(q).n} ${tr('шт.','items')} · ${q.camp ? tr('у костра','at camp') : tr('в рюкзаке','in backpack')}</small></span>${icon(game.craftReason(q.id) ? 'lock' : 'check')}</button>`).join('')}</div>${btn(tr('Рыбалка и ремесло','Fishing & crafts'),'activities','secondary','fish')}</div>`;
  openModal(tr('Рюкзак и экипировка','Backpack & equipment'), head + tabs + (invTab === 'craft' ? craftTab : gearTab), 'inventory');
  if (invTab === 'craft') {
    document.querySelector('#recipe-picker').addEventListener('change', e => {
      if (e.target.value) action('recipe-'+e.target.value);
      else {craftDraft=[];showInventory();}
    });
    return;
  }
  const ctx = document.querySelector('#paperdoll').getContext('2d'); ctx.imageSmoothingEnabled=false;
  drawHero(ctx,80,170,s.characterClass,{...s.appearance,race:s.race,player:true,equipment:s.equippedWearables,weapon:s.equippedWeapon,armor:s.equippedArmor,scale:3.4,time:game.time});
}
function purchaseActions(id, item, kind) {
  const s=game.save, level=item.level || 1, price=item.price || (kind === "weapon" && !item.recipe ? 45 : 0),
    owned=(kind === "weapon" ? s.ownedWeapons : kind === "armor" ? s.ownedArmors : s.ownedWearables).includes(id),
    equipPrefix={weapon:"equip-",armor:"armorEquip-",wear:"wearEquip-"}[kind],
    buyPrefix={weapon:"buyWeapon-",armor:"armorBuy-",wear:"wearBuy-"}[kind],
    craftPrefix={weapon:"weaponCraft-",armor:"armorCraft-",wear:"wearCraft-"}[kind];
  if (owned) return `<button class="button secondary" data-action="${equipPrefix+id}" ${s.level < level ? 'disabled' : ''}>${s.level < level ? tr('Нужен уровень '+level,'Requires level '+level) : tr('Надеть / взять в руки','Equip')}</button>`;
  const missing=missingRequirements(s,item),
    needs=item.requires ? `<ul class="mythic-needs">${item.requires.map((f)=>`<li class="${s.flags[f] ? 'done' : ''}">${icon(s.flags[f] ? 'check' : 'lock')}${label(mythicRequirementNames[f] || [f,f])}</li>`).join('')}</ul>` : '';
  const canCraft=!missing.length && item.recipe && Object.entries(item.recipe).every(([k,n])=>(s.inventory[k]||0)>=n);
  return `<div class="gear-actions">${price ? `<button class="button secondary" data-action="${buyPrefix+id}" ${s.level < level || s.gold < price ? 'disabled' : ''}>${icon('coin')}${tr('Купить','Buy')} · ${price}</button>` : ''}${item.recipe ? `<button class="button secondary" data-action="${craftPrefix+id}" ${s.level < level || !canCraft ? 'disabled' : ''}>${tr('Создать','Craft')}</button>` : ''}</div>${s.level < level ? `<p class="purchase-reason">${tr('Нужен уровень '+level+' · ваш '+s.level,'Requires level '+level+' · yours '+s.level)}</p>` : price && s.gold < price ? `<p class="purchase-reason">${tr('Не хватает '+(price-s.gold)+' монет','Need '+(price-s.gold)+' more coins')}</p>` : ''}${needs}${item.recipe ? ingredientCounts(item.recipe) : ''}`;
}
function wearableCards(mode = "shop") {
  const s=game.save;
  return `<div class="armory-grid">${Object.entries(wearables).filter(([id,a])=>(!a.class || a.class === s.characterClass) && (mode === 'inventory' ? s.ownedWearables.includes(id) : !a.source)).map(([id,a])=>`<article class="gear-card"><div class="gear-title">${icon(gearIcon(a.slot))}<h3>${label(a.name)}</h3></div><p>Lv. ${a.level} · +${a.defense} ${tr('защиты','defense')} · +${a.hp} HP${a.mana ? ` · +${a.mana} MP` : ''}${a.speed ? ` · +${a.speed} ${tr('скорости','speed')}` : ''}${a.crit ? ` · +${Math.round(a.crit*100)}% ${tr('крит','crit')}` : ''}</p>${s.equippedWearables[a.slot] !== id ? gearComparison('g', id) : ''}${s.equippedWearables[a.slot] === id ? `<span class="equipped-label">${icon('check')}${tr('Надето','Equipped')}</span>` : purchaseActions(id,a,'wear')}</article>`).join('')}</div>`;
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
      return `<article class="gear-card ${equipped ? "equipped" : ""}"><div class="gear-title">${icon(w.icon)}<div><h3>${label(w.name)}</h3><small>${tr("УРОВЕНЬ", "LEVEL")} ${w.level || 1} · ${w.rarity === "legendary" ? tr("ЛЕГЕНДАРНОЕ", "LEGENDARY") : w.source ? tr("ТРОФЕЙ", "BOSS LOOT") : w.rarity === "epic" ? tr("ЭПИЧЕСКОЕ", "EPIC") : w.rarity ? tr("РЕДКОЕ", "RARE") : tr("ОБЫЧНОЕ", "COMMON")}</small></div></div><p>${label(w.desc)}</p><div class="gear-stats">${stats.damage} ${tr("урона", "damage")} · ${w.cooldown.toFixed(2)} ${tr("с", "s")} · ${Math.round(w.range / TILE)} ${tr("клеток", "tiles")}${w.element ? ` · ${tr("Стихия", "Element")}: ${label(elementNames[w.element])}` : ""} · ${tr("крит", "crit")} ${Math.round(critChance(s, w) * 100)}%${w.lifesteal ? ` · ${tr("вампиризм", "life steal")} ${Math.round(w.lifesteal * 100)}%` : ""}${w.splash ? ` · ${tr("взрыв", "splash")}` : ""}</div>${equipped || locked ? "" : gearComparison("w", id)}${equipped ? `<span class="equipped-label">${icon("check")}${tr("В руках", "Equipped")}</span>` : purchaseActions(id,w,'weapon')}</article>`;
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
let skillSel = null,
  skillSchool = null;
// Compact tile: icon, rank pips, cost and a quick learn button. Full details live in the side panel.
function skillCard(a, bar) {
  const s = game.save,
    rank = abilityRank(s, a.id),
    cfg = rankConfig(s, a, Math.max(1, rank)),
    reason = game.acquisitionReason(a.id),
    perks = rankPerks(a),
    slot = bar.indexOf(a.id),
    state = rank >= 3 ? "maxed" : rank ? "learned" : reason ? "unlearned" : "unlearned can-learn";
  return `<article class="skill-card ${state} ${!reason && rank && rank < 3 ? "can-learn" : ""} ${skillSel === a.id ? "selected" : ""}" data-ability="${a.id}" data-action="skillSel-${a.id}" draggable="true"><div class="skill-node-icon" draggable="true" data-ability="${a.id}">${icon(a.icon)}${slot >= 0 ? `<kbd>${keyLabel(game.controls.bindings["skill" + (slot + 1)])}</kbd>` : ""}${rank < 3 ? `<button class="tile-learn ${reason ? "" : "ready"}" data-action="learn-${a.id}" ${reason ? "disabled" : ""} title="${reason || tr("Изучить · 1 очко", "Learn · 1 point")}">+</button>` : ""}</div><div class="skill-node-text"><b>${label(a.name)}</b><p class="skill-short">${label(a.desc)}</p><div class="skill-ranks">${[1, 2, 3].map((n) => `<i class="${rank >= n ? "filled" : ""}"></i>`).join("")}</div><div class="skill-costs"><span class="cost-mana">${icon("spark")}${a.cost}</span><span class="cost-level">${rank >= 3 ? tr("макс.", "max") : `${tr("ур.", "lv")} ${rankLevel(a, Math.min(3, rank + 1))}`}</span>${cfg.affinity ? `<span class="affinity">+15%</span>` : ""}</div></div><div class="tile-hidden"><ol class="rank-perks">${perks.map((p, i) => `<li class="${rank === i + 1 ? "current" : rank > i ? "done" : ""}">${label(p)}</li>`).join("")}</ol>${reason && rank < 3 ? `<p class="skill-status missing">${reason}</p>` : ""}</div></article>`;
}
function skillDetail(a, bar) {
  if (!a) return "";
  const s = game.save,
    rank = abilityRank(s, a.id),
    cfg = rankConfig(s, a, Math.max(1, rank)),
    reason = game.acquisitionReason(a.id),
    perks = rankPerks(a);
  return `<aside class="skill-detail"><div class="skill-detail-head"><span class="detail-icon">${icon(a.icon)}</span><div><h3>${label(a.name)}</h3><small>${label((disciplines[schoolOf(a.id)] || { name: ["Общее", "Utility"] }).name)}</small></div></div><div class="detail-costs"><span>${icon("spark")}${a.cost} ${tr("энергии", "energy")}</span><span>${icon("reset")}${cfg.cooldown.toFixed(1)} ${tr("с", "s")}</span>${cfg.affinity ? `<span class="affinity">+15% ${tr("от оружия", "weapon")}</span>` : ""}</div><p>${label(a.desc)}</p><ol class="detail-perks">${perks.map((p, i) => `<li class="${rank === i + 1 ? "current" : rank > i ? "done" : ""}"><b>${["I", "II", "III"][i]}</b><span>${label(p)}</span><small>${tr("ур.", "lv")} ${rankLevel(a, i + 1)}</small></li>`).join("")}</ol>${rank < 3 ? `<button class="button ${reason ? "secondary" : "primary"}" data-action="learnSel" ${reason ? "disabled" : ""}>${rank ? tr(`Усилить до ранга ${["I", "II", "III"][rank]} · 1 очко`, `Upgrade to rank ${["I", "II", "III"][rank]} · 1 point`) : tr("Изучить · 1 очко", "Learn · 1 point")}</button>` : `<p class="detail-max">${tr("Максимальный ранг", "Maximum rank")}</p>`}${reason && rank < 3 ? `<p class="detail-reason">${reason}</p>` : ""}<div class="detail-slots"><small>${tr("Поставить на клавишу:", "Put on key:")}</small>${[0, 1, 2, 3, 4].map((n) => `<button data-action="assign-${a.id}-${n}" class="${bar[n] === a.id ? "active" : ""}">${keyLabel(game.controls.bindings["skill" + (n + 1)])}</button>`).join("")}</div></aside>`;
}
function showSkills() {
  const s = game.save,
    bar = barFor(s),
    weaponSchool = s.equippedWeapon ? weaponDiscipline(s) : null,
    mentor = landmarks.find((o) => o.id === trainerIds[s.characterClass]),
    nearMentor = !s.activeDungeon && mentor && Math.hypot(s.x - mentor.x, s.y - mentor.y) < 90,
    spent = Object.values(s.abilityRanks).reduce((n, r) => n + r, 0),
    schools = [
      ...Object.entries(disciplines).filter(([, d]) => d.class === s.characterClass),
      ["utility", { name: ["Общие умения класса", "Class utilities"], ids: utilitySkills[s.characterClass] }],
    ];
  if (!skillSel || abilityCatalog[skillSel]?.class !== s.characterClass) skillSel = bar[0];
  if (!schools.some(([k]) => k === skillSchool)) skillSchool = (weaponSchool && schools.some(([k]) => k === weaponSchool) ? weaponSchool : schools[0][0]);
  const [schoolKey, school] = schools.find(([k]) => k === skillSchool),
    learned = (d) => d.ids.filter((id) => abilityRank(s, id) > 0).length;
  openModal(
    tr("Книга умений", "Skill book"),
    `<div class="skills-intro sb-head"><div class="sb-crest">${icon(classes[s.characterClass].icon || "spark")}</div><div><p>${label(classes[s.characterClass].name)} · ${tr("уровень", "level")} ${s.level}</p><span>${tr("Выберите школу слева. Умения работают с любым оружием; одно очко — изучить или усилить. Оружие своей школы даёт +15%.", "Pick a school on the left. Abilities work with any weapon; one point learns or upgrades. A weapon of the same school adds +15%.")}</span></div><strong class="${s.skillPoints ? "has-points" : ""}">${s.skillPoints}<small>${tr("ОЧКОВ", "POINTS")}</small></strong></div>
  <div class="sb2 skill-layout"><nav class="sb-schools">${schools
    .map(([key, d]) => {
      const first = abilityCatalog[d.ids[0]];
      return `<button class="sb-school-tab ${key === schoolKey ? "active" : ""} ${key === weaponSchool ? "affine" : ""}" data-action="skillSchool-${key}"><span class="sb-tab-icon">${icon(first.icon)}</span><span class="sb-tab-text"><b>${label(d.name)}</b><small>${learned(d)} / ${d.ids.length} ${tr("изучено", "learned")}${key === weaponSchool ? " · +15%" : ""}</small></span></button>`;
    })
    .join("")}</nav>
  <section class="sb-center"><div class="skill-school"><h3 class="school-title"><span>${label(school.name)}</span>${schoolKey === weaponSchool ? `<span class="affinity">${tr("школа оружия · +15%", "weapon school · +15%")}</span>` : ""}</h3><div class="skill-grid sb-path">${school.ids.map((id, i) => `<div class="sb-step"><span class="sb-step-num">${["I", "II", "III", "IV"][i]}</span>${skillCard(abilityCatalog[id], bar)}</div>`).join("")}</div></div>
  ${nearMentor ? `<div class="vendor-upgrade">${icon("reset")}<span><b>${tr("Забыть умения", "Reset abilities")}</b><small>${tr(`Вернуть ${spent} очк. · ${RESPEC_COST} монет`, `Return ${spent} points · ${RESPEC_COST} coins`)}</small></span><button class="button secondary" data-action="respec" ${!spent || s.gold < RESPEC_COST ? "disabled" : ""}>${tr("Сбросить", "Reset")}</button></div>` : ""}
  ${masteriesPanel()}</section><div class="sb-side"><div class="sb-bar"><span class="sb-bar-title">${tr("Панель умений", "Ability bar")}<small>${tr("Перетащите умение на ячейку или нажмите ячейку, чтобы сдвинуть", "Drag an ability onto a slot, or click a slot to shift it")}</small></span><div class="ability-bar-editor">${bar.map((id, i) => { const c = skillConfig(s, i); return `<button class="bar-edit-slot ${c.rank ? "" : "locked"}" data-bar-slot="${i}" data-action="barRotate-${i}" draggable="true" title="${label(c.name)}"><kbd>${keyLabel(game.controls.bindings["skill" + (i + 1)])}</kbd>${icon(c.icon)}<em>${c.cost}</em></button>`; }).join("")}</div></div>${skillDetail(abilityCatalog[skillSel], bar)}</div></div>`,
    "skills",
  );
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
// Uniform scale keeps the valley's proportions; the map is centred when it does not fill the canvas.
function mapTransform(canvas, large) {
  const { width, height } = mapDimensions();
  const zoom = large ? mapState.zoom : 1,
    scale = Math.min(canvas.width / (width * TILE), canvas.height / (height * TILE)) * zoom,
    viewW = canvas.width / scale,
    viewH = canvas.height / scale;
  return {
    sx: scale,
    sy: scale,
    ox: large ? mapState.x - viewW / 2 : (width * TILE - viewW) / 2,
    oy: large ? mapState.y - viewH / 2 : (height * TILE - viewH) / 2,
  };
}
function drawMap(canvas, large) {
  if (!canvas) return;
  const c = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height,
    s = game.save,
    { sx, sy, ox, oy } = mapTransform(canvas, large),
    overworld = !s.activeDungeon && !s.interior,
    discovered = s.discovered;
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#14100c";
  c.fillRect(0, 0, w, h);
  c.save();
  c.translate(-ox * sx, -oy * sy);
  const { width, height } = mapDimensions(),
    mw = width * TILE * sx,
    mh = height * TILE * sy;
  if (overworld) c.drawImage(worldOverview(game.world, game.season || "spring"), 0, 0, mw, mh);
  else {
    // Dungeons and rooms only use the top-left part of the tile grid: crop the overview to it.
    const img = game.terrain.overview,
      fw = game.world.width || WIDTH,
      fh = game.world.height || HEIGHT;
    c.drawImage(img, 0, 0, (img.width * width) / fw, (img.height * height) / fh, 0, 0, mw, mh);
  }
  if (overworld) c.drawImage(fogOverlay(discovered), 0, 0, mw, mh);
  else
    for (const o of game.world.objects)
      if (["stairs", "exit", "dungeonChest"].includes(o.type))
        drawMapIcon(c, o.type === "dungeonChest" ? "coin" : o.type === "stairs" ? "arrow" : "home", o.x * sx, o.y * sy, large ? 16 : 8);
  const size = large ? 20 : 8,
    seen = (o) => !overworld || isDiscovered(discovered, o.x, o.y);
  c.font = `${large ? 15 : 10}px Tiny5, monospace`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  const place = labelPlacer(c);
  if (overworld) {
    for (const o of landmarks) {
      if (!seen(o)) continue;
      const x = o.x * sx,
        y = o.y * sy;
      if (o.type === "entrance") drawMapIcon(c, { crypt: "skull", mine: "ore", abyss: "leaf", citadel: "crystal" }[o.dungeon], x, y, size, dungeons[o.dungeon].color);
      else if (o.type === "camp") drawMapIcon(c, s.visitedCamps.includes(o.id) ? "sun" : "lock", x, y, large ? 16 : 7);
      else if (large && o.type === "fishspot") drawMapIcon(c, "fish", x, y, 16);
      else if (large && o.type === "trainer" && o.characterClass === s.characterClass) drawMapIcon(c, "book", x, y, 16, "#f2c14e");
    }
    for (const e of game.enemies.filter(
      (e) =>
        e.hp > 0 &&
        (e.type === "herald" || e.type === "eclipse" || (large && e.worldBoss && isDiscovered(discovered, e.x, e.y))),
    ))
      drawMapIcon(c, e.worldBoss ? "crown" : "essence", e.x * sx, e.y * sy, size, e.worldBoss ? "#ff6a4a" : "#c9a8ff");
    if (large) {
      const labels = [
        ["village", 24, 61], ["forest", 44, 42], ["mountain", 85, 16], ["outpost", 73, 35],
        ["ruins", 91, 68], ["lake", 50, 73], ["amberwood", 139, 36], ["marsh", 146, 63],
        ["harbor", 141, 84], ["coast", 92, 115], ["tundra", 213, 20], ["highlands", 226, 65],
        ["deadwood", 220, 100], ["frontier", 190, 151], ["badlands", 230, 155], ["island", 66, 176],
        ["meadow", 30, 14],
      ];
      for (const [key, x, y] of labels)
        place(discovered.includes(key) ? label(regions[key]) : "???", x * TILE * sx, y * TILE * sy - 14, discovered.includes(key) ? "#f2e4c6" : "#8a7a60");
      for (const o of landmarks.filter((o) => o.type === "entrance" && seen(o)))
        place(label(dungeons[o.dungeon].name), o.x * sx, o.y * sy + 16, dungeons[o.dungeon].color);
      for (const e of game.enemies.filter((e) => e.hp > 0 && e.worldBoss && isDiscovered(discovered, e.x, e.y)))
        place(label(bossNames[e.type]), e.x * sx, e.y * sy + 16, "#ffb09a");
    }
  }
  const goal = s && objectiveTarget(game);
  if (goal) drawMapIcon(c, "flag", goal.x * sx, goal.y * sy, size, "#f9d67f");
  if (game.waypoint) drawMapIcon(c, "target", game.waypoint.x * sx, game.waypoint.y * sy, size);
  // The hero is an arrow pointing where they face.
  const a = game.facing ?? Math.PI / 2,
    px = s.x * sx,
    py = s.y * sy,
    r = large ? 9 : 6;
  c.fillStyle = "#0b0806";
  c.beginPath();
  c.arc(px, py, r + 2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ffe08a";
  c.beginPath();
  c.moveTo(px + Math.cos(a) * r, py + Math.sin(a) * r);
  c.lineTo(px + Math.cos(a + 2.5) * r, py + Math.sin(a + 2.5) * r);
  c.lineTo(px + Math.cos(a + Math.PI) * r * 0.3, py + Math.sin(a + Math.PI) * r * 0.3);
  c.lineTo(px + Math.cos(a - 2.5) * r, py + Math.sin(a - 2.5) * r);
  c.closePath();
  c.fill();
  c.restore();
  // Parchment frame.
  c.strokeStyle = "#5b4527";
  c.lineWidth = large ? 4 : 2;
  c.strokeRect(0, 0, w, h);
  if (large) {
    const zoomLabel = document.querySelector("#map-zoom-value");
    if (zoomLabel) zoomLabel.textContent = Math.round(mapState.zoom * 100) + "%";
    const travel = document.querySelector("#map-travel"),
      campTarget = mapState.camp && landmarks.find((o) => o.id === mapState.camp);
    if (travel) {
      travel.hidden = !campTarget;
      if (campTarget) travel.lastChild.textContent = tr(`Переместиться: ${label(campTarget.name)}`, `Travel: ${label(campTarget.name)}`);
    }
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
    `<div class="map-controls"><span>${width} × ${height} ${tr("клеток", "tiles")}</span><div><button class="icon-button" data-action="mapZoomOut" aria-label="${tr("Уменьшить карту", "Zoom out")}">${icon("minus")}</button><b id="map-zoom-value">100%</b><button class="icon-button" data-action="mapZoomIn" aria-label="${tr("Увеличить карту", "Zoom in")}">${icon("plus")}</button><button class="icon-button" data-action="mapCenter" aria-label="${tr("Найти героя", "Find your hero")}">${icon("target")}</button></div></div><div class="map-main"><div class="map-wrap"><canvas id="large-map" width="864" height="648"></canvas><span class="map-north">N<br>↑</span></div><div class="map-route"><span id="map-marker-label"></span><div class="gear-actions"><button class="button primary" data-action="mapTravel" id="map-travel" hidden>${icon("sun")}${tr("Переместиться к костру", "Travel to campfire")}</button>${btn(tr("Идти к отметке", "Walk to marker"), "mapWalk", "secondary", "flag")}</div></div><div class="map-camps" ${game.save.activeDungeon ? "hidden" : ""}><span>${icon("sun")}${tr("БЫСТРОЕ ПЕРЕМЕЩЕНИЕ", "FAST TRAVEL")}<small>${tr("Костры открываются, когда вы подходите к ним", "Campfires unlock when you walk up to them")}</small></span><div>${landmarks
      .filter((o) => o.type === "camp" && !game.save.activeDungeon)
      .map(
        (camp) =>
          `<button class="camp-travel ${game.save.visitedCamps.includes(camp.id) ? "unlocked" : ""}" data-action="travel-${camp.id}" ${game.save.visitedCamps.includes(camp.id) ? "" : "disabled"}>${icon(game.save.visitedCamps.includes(camp.id) ? "home" : "lock")}<span>${label(camp.name)}</span></button>`,
      )
      .join(
        "",
      )}</div></div></div><div class="map-legend">${[["arrow", tr("Ваш герой", "Your hero")], ["flag", tr("Цель задания", "Objective")], ["target", tr("Ваша отметка", "Your marker")], ["skull", tr("Подземелье", "Dungeon")], ["sun", tr("Костёр", "Campfire")], ["crown", tr("Мировой босс", "World boss")], ["fish", tr("Рыбалка", "Fishing")], ["book", tr("Ваш наставник", "Your mentor")]].map(([i, t]) => `<span>${icon(i)}${t}</span>`).join("")}<span class="fog-key"></span>${tr("Неисследованные земли", "Unexplored lands")}</div>`,
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
function showEclipseVictory() {
  openModal(
    tr("Затмение рассеялось", "The eclipse has passed"),
    `<div class="victory-symbol dawn">${icon("sun")}</div><p class="modal-intro">${tr("Нерей Бессветный рассыпался тысячей искр. Над руинами впервые за столетие взошло солнце, и Сердце долины засияло ровным золотым светом. На земле лежат реликвии рассвета — заберите их и вернитесь к Оливеру.", "Nerei the Lightless broke into a thousand sparks. For the first time in a century the sun rose over the ruins, and the Heart of the valley glows a steady gold. The relics of dawn lie on the ground — take them and return to Oliver.")}</p>${btn(tr("Забрать реликвии", "Collect the relics"), "close", "primary", "arrow")}`,
    "victory",
  );
}
function showEnding() {
  const s = game.save,
    kind = s.flags.reconciled ? "peace" : s.flags.duskPower ? "dusk" : "dawn",
    fates = fateLines(s);
  const text = {
    peace: tr(`Так закончилась история ${escapeHTML(s.name)}, Примирителя братьев. Вы не развеяли осколки и не оставили их себе — вы отпустили душу Нерея туда, где его ждал Ардан. Обелиски гаснут один за другим: держать больше некого. Долина впервые за сто лет живёт без замков.`, `So ends the tale of ${escapeHTML(s.name)}, Reconciler of brothers. You neither scattered the shards nor kept them — you released Nerei's soul to where Ardan waited. One by one the obelisks go dark: there is no one left to hold. For the first time in a century the valley lives without locks.`),
    dusk: tr(`Так закончилась история ${escapeHTML(s.name)}, Повелителя сумерек. Осколки затмения слились со Знаком Рассвета, и на ладони теперь горит серое пламя. Обелиски светят, но старый Оливер больше не смотрит вам в глаза. У костров шепчутся: не стал ли новый хранитель вторым Нереем?`, `So ends the tale of ${escapeHTML(s.name)}, Lord of Dusk. The eclipse shards fused with the Mark of Dawn and a grey flame now burns on your palm. The obelisks shine, but old Oliver no longer meets your eyes. By the fires they whisper: has the new guardian become a second Nerei?`),
    dawn: tr(`Так закончилась история ${escapeHTML(s.name)}, Хранителя рассвета. Вы развеяли осколки, и Знак на ладони засиял чистым золотом, как у Ардана. Обелиски горят, печати глубин целы, а тени ушли за горизонт. В Лиственной деревне у костра теперь рассказывают новую легенду — вашу.`, `So ends the tale of ${escapeHTML(s.name)}, Keeper of Dawn. You scattered the shards and the Mark shone pure gold, as Ardan's once did. The obelisks burn, the depth seals hold and the shadows have fled. By the Leafhaven campfire they now tell a new legend — yours.`),
  }[kind];
  openModal(
    tr("Хроники забытой долины", "Chronicles of the Forgotten Valley"),
    `<div class="ending"><div class="victory-symbol ${kind === "dusk" ? "" : "dawn"}">${icon(kind === "dusk" ? "moon" : kind === "peace" ? "heart" : "crown")}</div><p class="modal-intro">${text}</p>${fates.length ? `<h3 class="small-heading">${tr("СУДЬБЫ", "FATES")}</h3><ul class="fate-list">${fates.map((f) => `<li>${escapeHTML(f)}</li>`).join("")}</ul>` : ""}<div class="journal-stats"><span>${tr("Уровень", "Level")}<b>${s.level}</b></span><span>${tr("Время в долине", "Time in the valley")}<b>${Math.floor(s.playtime / 60)} ${tr("мин", "min")}</b></span><span>${tr("Сундуков", "Chests")}<b>${s.collected.filter((x) => x.startsWith("chest")).length} / ${CHEST_COUNT}</b></span><span>${tr("Земель открыто", "Lands found")}<b>${s.discovered.length} / ${Object.keys(regions).length}</b></span><span>${tr("Врагов побеждено", "Foes defeated")}<b>${Object.values(s.kills).reduce((a, b) => a + b, 0)}</b></span></div><p class="fine-print">${tr("Мир остаётся открытым: подземелья можно проходить на всё более сложных испытаниях, а в журнале появились задачи эпилога.", "The world stays open: dungeons can be cleared at ever harder challenges, and the journal lists epilogue goals.")}</p></div>${btn(tr("Продолжить путешествие", "Continue your journey"), "close", "primary", "arrow")}`,
    "victory",
  );
}
function chapterLabel(q) {
  return q <= 2
    ? tr("Глава I · Обелиски", "Chapter I · The obelisks")
    : q <= 6
      ? tr("Глава II · Хранитель", "Chapter II · The guardian")
      : q === 7
        ? tr("Глава III · Печати глубин", "Chapter III · Depth seals")
        : q <= 10
          ? tr("Глава IV · Затмение", "Chapter IV · The eclipse")
          : tr("Эпилог", "Epilogue");
}
let lastKeeper = null;
const rumors = [
  ["Говорят, Древень Мшистый бродит в Янтарной роще. Его корни вылезают прямо из земли — не стойте на линии!", "They say Mossbark roams Amberwood. Its roots burst from the ground — don't stand in line!"],
  ["Песчаный червь на острове зарывается и выныривает под ногами. Двигайтесь, когда земля дрожит.", "The sand worm on the isle burrows and bursts out underfoot. Move when the ground shakes."],
  ["Атаман Кривой Клык держит Пепельные пустоши. Его сапоги, говорят, лёгкие как перо.", "Crookfang rules the Ashen Badlands. His boots are said to be light as a feather."],
  ["Ледяной вирм кружит над тундрой. Огонь против него хорош, но холод бьёт больно.", "The frost wyrm circles the tundra. Fire works well, but its frost hurts."],
  ["Ведьма Мора на болотах оставляет ядовитые лужи. Не задерживайтесь в зелёном.", "Mora the witch leaves poison pools in the marshes. Don't linger in the green."],
  ["Циклоп Гром на нагорье стреляет лучом из глаза. Уходите вбок, а не назад.", "Thunderhide the cyclops fires an eye beam. Step sideways, not back."],
  ["Осенью враги роняют больше золота, а весной быстрее учишься.", "In autumn enemies drop more gold, and in spring you learn faster."],
];
function showKeeper(o = lastKeeper) {
  if (!o) return;
  lastKeeper = o;
  const s = game.save,
    def = interiorDefs[o.house];
  if (def.kind === "forge") {
    dialog(o, tr("Мастер Брам у горна снаружи, но я принимаю заказы. Что сковать?", "Master Bram works the forge outside, but I take orders. What shall we make?"), btn(tr("Открыть мастерскую", "Open the workshop"), "openSmith", "primary", "mace") + btn(tr("До встречи", "Goodbye"), "close", "secondary"));
    return;
  }
  if (def.kind === "home") {
    dialog(o, label(def.line), btn(tr("Спасибо", "Thanks"), "close", "primary", "arrow"));
    return;
  }
  const row = (k, price, actions) =>
    `<div class="shop-row"><span>${icon(itemIcon(k))}<b>${label(items[k])}</b><small>${price} ◈ · ${tr("в рюкзаке", "in bag")}: ${s.inventory[k] || 0}</small></span><div class="gear-actions">${actions}</div></div>`;
  if (def.kind === "tavern") {
    const told = storyRumors(game.save),
      rumor = told.length && Math.floor(game.time / 20) % 2 === 0 ? told[Math.floor(game.time / 40) % told.length] : rumors[Math.floor(game.time / 20) % rumors.length];
    const mood = villagerMood(game.save);
    dialog(
      o,
      (mood ? label(mood) + " " : "") + label(rumor),
      btn(tr("До встречи", "Goodbye"), "close", "secondary"),
      `<h3 class="small-heading">${tr("МЕНЮ", "MENU")}</h3>${Object.entries(tavernMenu)
        .map(([k, p]) => row(k, p, `<button class="button secondary" data-action="trade-buy-${k}-1" ${s.gold < p ? "disabled" : ""}>${tr("Купить", "Buy")}</button>`))
        .join("")}<div class="shop-row"><span>${icon("moon")}<b>${tr("Комната до утра", "A room until morning")}</b><small>${ROOM_PRICE} ◈ · ${tr("полное восстановление, время до 8:00", "full recovery, time skips to 8:00")}</small></span><button class="button primary" data-action="innRest" ${s.gold < ROOM_PRICE ? "disabled" : ""}>${tr("Снять", "Rent")}</button></div>`,
    );
    return;
  }
  const owned = [
    ...s.ownedWeapons.filter((id) => id !== s.equippedWeapon).map((id) => ["weapon", id, weapons[id]]),
    ...s.ownedArmors.filter((id) => id !== "none" && id !== s.equippedArmor).map((id) => ["armor", id, armors[id]]),
    ...s.ownedWearables.filter((id) => !Object.values(s.equippedWearables).includes(id)).map((id) => ["wear", id, wearables[id]]),
  ];
  dialog(
    o,
    tr("Покупаю материалы и ненужное снаряжение, продаю припасы. Надетые вещи не беру.", "I buy materials and spare gear and sell supplies. I won't take what you're wearing."),
    btn(tr("До встречи", "Goodbye"), "close", "secondary"),
    `<h3 class="small-heading">${tr("ПРОДАТЬ МАТЕРИАЛЫ", "SELL MATERIALS")}</h3>${Object.entries(sellPrices)
      .filter(([k]) => s.inventory[k] > 0)
      .map(([k, p]) => row(k, p, `<button class="button secondary" data-action="trade-sell-${k}-1">${tr("Продать 1", "Sell 1")}</button><button class="button secondary" data-action="trade-sell-${k}-999">${tr("Всё", "All")} · ${p * s.inventory[k]} ◈</button>`))
      .join("") || `<p class="fine-print">${tr("Нечего продать.", "Nothing to sell.")}</p>`}
    <h3 class="small-heading">${tr("ПРОДАТЬ СНАРЯЖЕНИЕ", "SELL GEAR")}</h3>${owned
      .map(([kind, id, it]) => `<div class="shop-row"><span>${icon(kind === "weapon" ? it.icon : kind === "armor" ? "shield" : gearIcon(it.slot))}<b>${label(it.name)}</b><small>${gearSellPrice(kind, id)} ◈</small></span><button class="button secondary" data-action="sellGear-${kind}-${id}" ${kind === "weapon" && s.ownedWeapons.length <= 1 ? "disabled" : ""}>${tr("Продать", "Sell")}</button></div>`)
      .join("") || `<p class="fine-print">${tr("Всё снаряжение надето.", "All your gear is equipped.")}</p>`}
    <h3 class="small-heading">${tr("КУПИТЬ", "BUY")}</h3>${Object.entries(buyPrices)
      .map(([k, p]) => row(k, p, `<button class="button secondary" data-action="trade-buy-${k}-1" ${s.gold < p ? "disabled" : ""}>${tr("Купить", "Buy")}</button>`))
      .join("")}`,
  );
}
function interact(o) {
  const s = game.save;
  if (o.type === "door") {
    if (game.enterHouse(o.house)) toast(label(interiorDefs[o.house].name));
    return;
  }
  if (o.type === "houseExit") {
    game.leaveHouse();
    return;
  }
  if (o.type === "stash") {
    const found = game.openStash(o);
    toast(
      !found
        ? tr("Сундук пуст.", "The chest is empty.")
        : o.rich
          ? tr("Старый сундук: золото, 2 эссенции и снаряжение! Загляните в рюкзак.", "Old chest: gold, 2 essences and gear! Check your backpack.")
          : tr("Сундук: 25 монет, материалы и зелье.", "Chest: 25 coins, materials and a potion."),
    );
    return;
  }
  if (o.id?.startsWith("keeper-")) {
    showKeeper(o);
    return;
  }
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
    const st = storyOf(s);
    if (s.flags[o.id]) {
      toast(tr("Обелиск горит. Долина помнит, каким светом вы его зажгли.", "The obelisk burns. The valley remembers what light you lit it with."));
      return;
    }
    if (st.wave?.anchor === o.id) {
      toast(tr("Скверна ещё жива — добейте врагов вокруг обелиска!", "The blight still lives — finish the foes around the obelisk!"));
      return;
    }
    const scene = o.id === "forestRune" && s.quest === 1 ? "forest" : o.id === "mountainRune" && s.quest === 3 ? "ivva" : null;
    if (scene) playScene(scene);
    else toast(tr("Обелиск молчит. Знак на ладони ещё не откликается — следуйте журналу.", "The obelisk is silent. The Mark doesn't answer yet — follow your journal."));
    return;
  }
  if (o.type === "altar") {
    if (s.quest === 9 && !s.flags.eclipseAwake) {
      playScene("nerei");
      return;
    }
    if (s.quest === 9 && s.flags.eclipseAwake) {
      toast(
        tr(
          "Нерей рядом. Ищите светлые круги, когда он гасит свет!",
          "Nerei is near. Seek the circles of light when he swallows it!",
        ),
      );
      return;
    }
    if (s.quest === 8) {
      toast(
        tr(
          `Сердце треснуло. Нужны осколки затмения: ${shardCount(s)}/3.`,
          `The Heart is cracked. You need the eclipse shards: ${shardCount(s)}/3.`,
        ),
      );
      return;
    }
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
    playScene("guardian");
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
    const scene = { 0: "prologue", 2: "oliver2", 6: "seals", 10: "epilogue" }[s.quest];
    if (scene) {
      playScene(scene);
      return;
    }
    if (s.quest === 7 && allSeals(s))
      dialog(
        o,
        tr(
          "Четыре печати… Я молился, чтобы этот день не наступил. Печати не просто держали владык — они были замками на темнице Нерея Бессветного, первого хранителя долины, который захотел погасить солнце. Прошлой ночью Сердце долины треснуло. Из трещины вышли три вестника, и каждый унёс осколок затмения: в Мёртвый лес, на Туманные болота и в Белую тундру. Пока осколки у них, разлом открыт наполовину — и тень растёт. Отними осколки, и мы закроем это навсегда.",
          "Four seals… I prayed this day would never come. The seals did not just hold the lords — they were locks on the prison of Nerei the Lightless, the valley’s first guardian, who wished to put out the sun. Last night the Heart of the valley cracked. Three heralds stepped out, each carrying an eclipse shard: to Deadwood, the Misty Marshes and the White Tundra. While they hold the shards the rift stays half open — and the shadow grows. Take the shards and we will end this for good.",
        ),
        btn(
          tr("Я найду вестников · 300 монет", "I will find the heralds · 300 coins"),
          "actThree",
          "primary",
          "flag",
        ),
      );
    else if (s.quest === 8 || s.quest === 9)
      dialog(
        o,
        s.quest === 8
          ? tr(
              `Вестники прячутся в дальних землях: Мёртвый лес, Туманные болота, Белая тундра. Осколков у тебя: ${shardCount(s)} из 3. Тени боятся света — оружие света ранит их сильнее, а сами они умеют появляться за спиной. Не стой на месте.`,
              `The heralds hide in the farlands: Deadwood, the Misty Marshes, the White Tundra. You hold ${shardCount(s)} of 3 shards. Shadows fear light — they also slip behind your back. Keep moving.`,
            )
          : tr(
              "Осколки у тебя. Иди к Сердцу долины и вложи их в разлом. Когда Нерей погасит свет, ищи золотые круги — только в них затмение не тронет тебя.",
              "You hold the shards. Go to the Heart of the valley and set them in the rift. When Nerei swallows the light, seek the golden circles — only there will the eclipse spare you.",
            ),
        btn(tr("Продолжить", "Continue"), "close", "primary", "arrow"),
      );
    else
      dialog(
        o,
        s.quest === 11 && s.flags.reconciled
          ? tr(
              "Иногда по ночам над руинами видят две фигуры у костра — в латах и в короне из тени. Они больше не спорят. Спасибо тебе, хранитель.",
              "Some nights two figures are seen by a fire above the ruins — one in armour, one crowned in shadow. They argue no more. Thank you, guardian.",
            )
          : s.quest === 11 && s.flags.duskPower
          ? tr(
              "…Ты выбрал силу. Я не осуждаю — Ардан тоже сомневался. Но знай: если серое пламя когда-нибудь возьмёт верх, долине снова понадобится хранитель.",
              "…You chose power. I don't judge — Ardan doubted too. But know this: if the grey flame ever wins, the valley will need a guardian again.",
            )
          : s.quest === 11
          ? tr(
              "Хранитель рассвета! Дети уже играют в тебя у колодца. Долина спокойна, но сундуки дальних земель и испытания глубин всё ещё ждут смелых.",
              "Keeper of Dawn! The children already play at being you by the well. The valley is calm, but the farland chests and the depth challenges still await the brave.",
            )
          : s.quest === 7
          ? tr(
              "Наша долина всегда будет твоим домом. Загляни к Мире и Браму, если ещё не помог им. В глубинах ждут четыре владыки, а по миру разбросаны сорок тайников.",
              "Our valley will always be your home. Visit Mira and Bram if they still need help. Four dungeon lords await below, and forty hidden chests are scattered across the world.",
            )
          : s.quest === 1
          ? tr(
              "Лесной обелиск — к северу, в Шепчущем лесу. Коснись его — и Знак покажет, что делать.",
              "The forest obelisk lies north in the Whispering Woods. Touch it and the Mark will show you what to do.",
            )
          : s.quest === 3
          ? tr(
              "Лея всё ещё у Пепельных. Горный обелиск — над Высоким Ключом. Торопись.",
              "Lea is still with the Ashen. The mountain obelisk stands above Highspring. Hurry.",
            )
          : tr(
              "Следуй журналу. У костра всегда можно бесплатно восстановить силы.",
              "Follow your journal. You can always recover for free at a campfire.",
            ),
        btn(tr("Продолжить", "Continue"), "close", "primary", "arrow"),
      );
    return;
  }
  if (o.id === "scout") {
    const rin = storyOf(s).fate.rin;
    if (s.quest === 4) {
      playScene("rin");
      return;
    }
    if (rin === "enemy" || rin === "broken")
      dialog(
        o,
        rin === "enemy"
          ? tr("Дом Рина пуст. На столе пепел и записка: «Ты выбрал знание. Я выбрал месть. Встретимся у Сердца».", "Rin's house is empty. On the table — ash and a note: “You chose knowledge. I choose revenge. We'll meet at the Heart.”")
          : tr("Дом Рина пуст. Соседи говорят, он ушёл за горы в ту же ночь и не оглянулся.", "Rin's house is empty. The neighbours say he left over the mountains that same night without looking back."),
        btn(tr("Уйти", "Leave"), "close", "primary", "arrow"),
      );
    else if (s.quest >= 8 && s.quest <= 10)
      dialog(
        o,
        tr(
          "Я видел тени у перевала — они двигаются быстрее волков и появляются за спиной. Не стой на месте и держи рывок наготове. Оружие света из Сердца долины, говорят, режет их как бумагу.",
          "I saw shadows by the pass — faster than wolves, and they appear behind your back. Keep moving and save your dodge. They say weapons of light from the Heart cut them like paper.",
        ),
        btn(tr("Спасибо, Рин", "Thanks, Rin"), "close", "primary", "arrow"),
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
    storyOf(s).fate.lea === "dead"
      ? tr("…Лея покупала у меня ромашку каждую весну. Бери, что нужно, и уходи.", "…Lea bought chamomile from me every spring. Take what you need and go.")
      : storyOf(s).fate.ivva === "redeemed"
        ? tr("Ивва приходила за травами — для больных. Не думала, что скажу это, но спасибо, что дал ей шанс.", "Ivva came for herbs — for the sick. I never thought I'd say it, but thank you for giving her a chance.")
        : storyOf(s).knows.villageKnows
          ? tr("Теперь я варю зелья с молитвой: кто знает, что проснётся под нами завтра. Береги себя.", "Now I brew with a prayer: who knows what wakes beneath us tomorrow. Take care.")
          : tr(
              "Хорошее зелье начинается с хорошей травы. Берегите себя в дороге! Вы также можете варить зелья прямо в рюкзаке.",
              "A good potion starts with a good herb. Stay safe on your travels! You can also brew potions in your backpack.",
            ),
    btn(tr("До встречи", "See you soon"), "close", "secondary"),
    `${quest}<div class="shop-row"><span>${icon("potion")}${tr("Зелье здоровья · +65 HP", "Health potion · +65 HP")}</span>${btn("20 ◈", "buyPotion", "secondary", "coin")}</div><div class="shop-row"><span>${icon("spark")}${tr("Зелье энергии · +60 MP", "Energy potion · +60 MP")}</span>${btn("25 ◈", "buyMana", "secondary", "coin")}</div>`,
  );
}
// Vendor screen: tabs, a compact list with quick actions and a detail panel.
let vendorTab = "weapon",
  vendorSel = null;
const rarityName = (r) =>
  ({ mythic: tr("МИФИЧЕСКОЕ", "MYTHIC"), legendary: tr("ЛЕГЕНДАРНОЕ", "LEGENDARY"), epic: tr("ЭПИЧЕСКОЕ", "EPIC"), rare: tr("РЕДКОЕ", "RARE") })[r] || tr("ОБЫЧНОЕ", "COMMON");
function vendorEntries(tab) {
  const s = game.save;
  if (tab === "weapon")
    return classWeapons(s.characterClass)
      .filter(([, w]) => !w.source)
      .map(([id, w]) => ({ kind: "weapon", id, item: w, icon: w.icon, rarity: w.rarity || "common", owned: s.ownedWeapons.includes(id), equipped: s.equippedWeapon === id }));
  if (tab === "armor")
    return Object.entries(armors)
      .filter(([id, a]) => id !== "none" && !a.source)
      .map(([id, a]) => ({ kind: "armor", id, item: a, icon: "shield", rarity: a.rarity || ((a.level || 1) >= 12 ? "legendary" : (a.level || 1) >= 7 ? "epic" : (a.level || 1) >= 4 ? "rare" : "common"), owned: s.ownedArmors.includes(id), equipped: s.equippedArmor === id }));
  return Object.entries(wearables)
    .filter(([, a]) => !a.source && (!a.class || a.class === s.characterClass))
    .map(([id, a]) => ({ kind: "wear", id, item: a, icon: gearIcon(a.slot), rarity: a.level >= 10 ? "epic" : a.level >= 5 ? "rare" : "common", owned: s.ownedWearables.includes(id), equipped: s.equippedWearables[a.slot] === id }));
}
function quickAction(e) {
  const s = game.save,
    level = e.item.level || 1,
    price = e.item.price || (e.kind === "weapon" && !e.item.recipe ? 45 : 0),
    prefix = { weapon: ["equip-", "buyWeapon-", "weaponCraft-"], armor: ["armorEquip-", "armorBuy-", "armorCraft-"], wear: ["wearEquip-", "wearBuy-", "wearCraft-"] }[e.kind];
  if (e.equipped) return `<span class="vendor-state">${icon("check")}${tr("Надето", "Worn")}</span>`;
  if (e.owned) return `<button class="button secondary" data-action="${prefix[0] + e.id}" ${s.level < level ? "disabled" : ""}>${tr("Надеть", "Equip")}</button>`;
  if (price) return `<button class="button secondary" data-action="${prefix[1] + e.id}" ${s.level < level || s.gold < price ? "disabled" : ""}>${icon("coin")}${price}</button>`;
  if (e.item.requires && missingRequirements(s, e.item).length) return `<span class="vendor-state">${icon("lock")}${tr("Нужны победы", "Needs victories")}</span>`;
  if (e.item.recipe) return `<button class="button secondary" data-action="${prefix[2] + e.id}" ${s.level < level || !canPayMaterials(s, e.item.recipe) ? "disabled" : ""}>${tr("Создать", "Craft")}</button>`;
  return "";
}
function vendorDetail(e) {
  if (!e) return `<div class="gear-card vendor-detail"><div class="gear-title"><div><h3>${tr("Выберите товар", "Choose an item")}</h3><small>${tr("СЛЕВА", "FROM THE LIST")}</small></div></div><p>${tr("Здесь появятся характеристики и сравнение с надетым.", "Stats and a comparison with your gear appear here.")}</p><div class="gear-stats"></div></div>`;
  const s = game.save,
    it = e.item;
  let stats = "";
  if (e.kind === "weapon") {
    const st = deriveStats({ ...s, equippedWeapon: e.id }, classes[s.characterClass]);
    stats = `${st.damage} ${tr("урона", "damage")} · ${it.cooldown.toFixed(2)} ${tr("с", "s")} · ${Math.round(it.range / TILE)} ${tr("клеток", "tiles")}${it.element ? ` · ${label(elementNames[it.element])}` : ""} · ${tr("крит", "crit")} ${Math.round(critChance(s, it) * 100)}%${it.lifesteal ? ` · ${tr("вампиризм", "life steal")} ${Math.round(it.lifesteal * 100)}%` : ""}`;
  } else stats = `+${it.defense} ${tr("защиты", "defense")} · +${it.hp} HP${it.mana ? ` · +${it.mana} MP` : ""}${it.speed ? ` · ${it.speed > 0 ? "+" : ""}${it.speed} ${tr("скорости", "speed")}` : ""}${it.crit ? ` · +${Math.round(it.crit * 100)}% ${tr("крит", "crit")}` : ""}`;
  return `<article class="gear-card vendor-detail ${e.equipped ? "equipped" : ""}"><div class="gear-title">${icon(e.icon)}<div><h3 class="rarity-${e.rarity}">${label(it.name)}</h3><small>${tr("УРОВЕНЬ", "LEVEL")} ${it.level || 1} · ${rarityName(e.rarity)}</small></div></div><p>${label(it.desc || ["", ""]) || ""}</p><div class="gear-stats">${stats}</div>${e.equipped ? "" : gearComparison({ weapon: "w", armor: "a", wear: "g" }[e.kind], e.id)}${e.equipped ? `<span class="equipped-label">${icon("check")}${tr("Надето", "Equipped")}</span>` : purchaseActions(e.id, it, e.kind)}</article>`;
}
function showSmith(o = landmarks.find((x) => x.id === "smith")) {
  const s = game.save,
    tabs = [
      ["weapon", tr("Оружие", "Weapons"), "sword"],
      ["armor", tr("Броня", "Armor"), "shield"],
      ["wear", tr("Одежда", "Clothing"), "helmet"],
    ],
    entries = vendorEntries(vendorTab),
    chosen = entries.find((e) => e.id === vendorSel) || entries.find((e) => e.equipped) || entries[0];
  const quest = s.flags.smithQuestDone
    ? ""
    : !s.flags.smithQuest
      ? `<div class="vendor-quest"><span>${icon("flag")}${tr("Нужны 4 куска руды. Принесёшь — бесплатно улучшу оружие.", "I need 4 iron ore. Bring them and I'll upgrade your weapon for free.")}</span>${btn(tr("Взять задание", "Accept quest"), "acceptSmith", "secondary")}</div>`
      : `<div class="vendor-quest"><span>${icon("flag")}${tr(`Руда: ${s.inventory.ore}/4 · награда: +1 к оружию`, `Ore: ${s.inventory.ore}/4 · reward: +1 weapon`)}</span>${btn(tr("Передать руду", "Give ore"), "smithReward", "secondary")}</div>`;
  const upgrades = ["weapon", "armor"]
    .map((kind) => {
      const rank = s[kind + "Level"],
        cost = kind === "weapon" ? weaponUpgradeCost(s) : armorUpgradeCost(s),
        required = 2 + rank * 2;
      return `<div class="vendor-upgrade">${icon(kind === "weapon" ? "sword" : "shield")}<span><b>${tr(kind === "weapon" ? "Оружие" : "Броня", kind === "weapon" ? "Weapon" : "Armor")} +${rank}${rank < 6 ? " → +" + (rank + 1) : " · MAX"}</b><small>${tr("ур.", "lvl")} ${required} · ${cost.gold} ◈ · ${materialText({ ore: cost.ore, essence: cost.essence })}</small></span><button class="button secondary" data-action="${kind === "weapon" ? "upgradeWeapon" : "upgradeArmor"}" ${rank >= 6 || s.level < required || s.gold < cost.gold || (kind === "armor" && s.equippedArmor === "none") ? "disabled" : ""}>${tr("Усилить", "Upgrade")}</button></div>`;
    })
    .join("");
  openModal(
    label(o.name),
    `<div class="vendor-head"><canvas id="vendor-face" width="64" height="64"></canvas><p>${tr("Выбирай, путник. Броня и клинки ждут того, кто их заслужит.", "Take your pick, traveler. Armor and blades await whoever earns them.")}</p><div class="inventory-gold">${icon("coin")}${s.gold}</div></div>${quest}
    <div class="vendor-tabs">${tabs.map(([id, name, ic]) => `<button class="recipe-chip ${vendorTab === id ? "active" : ""}" data-action="vendorTab-${id}">${icon(ic)}${name}</button>`).join("")}</div>
    <div class="vendor-layout"><div class="vendor-list">${entries
      .map(
        (e) =>
          `<div class="vendor-row ${chosen?.id === e.id ? "selected" : ""} ${s.level < (e.item.level || 1) ? "locked" : ""}" data-action="vendorSel-${e.id}" role="button" tabindex="0">${icon(e.icon)}<span><b class="rarity-${e.rarity}">${label(e.item.name)}</b><small>${tr("ур.", "lvl")} ${e.item.level || 1}${e.owned ? " · " + tr("есть", "owned") : ""}</small></span>${quickAction(e)}</div>`,
      )
      .join("")}</div>${vendorDetail(chosen)}</div>
    <div class="vendor-upgrades">${upgrades}</div>`,
    "vendor",
    tr("КУЗНИЦА", "FORGE"),
  );
  const face = document.querySelector("#vendor-face").getContext("2d");
  face.imageSmoothingEnabled = false;
  drawHero(face, 32, 60, o.style || "smith", { scale: 1.5 });
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
      return `<article class="gear-card ${equipped ? "equipped" : ""}"><div class="gear-title">${icon("shield")}<div><h3>${label(a.name)}</h3><small>${a.source ? tr("ТРОФЕЙ БОССА", "BOSS LOOT") : tr("СНАРЯЖЕНИЕ", "EQUIPMENT")} · ${tr("Уровень", "Level")} ${a.level || 1}</small></div></div><p>${label(a.desc)}</p><div class="gear-stats">${a.defense} ${tr("защиты", "defense")} · +${a.hp} HP${a.mana ? ` · +${a.mana} MP` : ""}${a.speed ? ` · ${a.speed > 0 ? "+" : ""}${a.speed} ${tr("скорости", "speed")}` : ""}</div>${equipped || locked ? "" : gearComparison("a", id)}${equipped ? `<span class="equipped-label">${icon("check")}${tr("Надето", "Equipped")}</span>` : purchaseActions(id,a,'armor')}</article>`;
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
    `<div class="dungeon-intro" style="--dungeon-color:${d.color}">${icon("crystal")}<span>${tr("ПОДЗЕМЕЛЬЕ", "DUNGEON")} · ${tr("УРОВЕНЬ", "LEVEL")} ${d.level} · ${d.floors} ${tr("ЭТАЖА", "FLOORS")}</span><h3>${label(bossNames[d.boss])}</h3><p>${label(d.desc)}</p></div><div class="dungeon-loot"><b>${tr("ГАРАНТИРОВАННЫЕ ТРОФЕИ", "GUARANTEED SPOILS")}</b><span>${icon(weapons[d.loot[s.characterClass]].icon)}${label(weapons[d.loot[s.characterClass]].name)}</span><span>${icon("shield")}${label(armors[d.armor].name)}</span><span>${icon("crystal")}${tr("Эссенции для редкого крафта", "Essences for rare crafting")}</span></div><p class="fine-print">${tr("В зале босса выход запечатывается. Зелья имеют перезарядку 8 секунд. После поражения вы вернётесь к костру. Собранное снаряжение сохранится; зачистку придётся начать снова. Неподобранные трофеи перемещаются к входу.", "The boss arena seals its exit. Potions have an 8-second cooldown. Defeat returns you to a campfire. Collected equipment is kept, but the run starts over. Unclaimed spoils move to the entrance.")}</p>${s.dungeonClears[id] ? `<p class="tier-warning">${tr(`Испытание ${Math.min(6, s.dungeonClears[id]) + 1}: враги усилены. Повторные трофеи превращаются в эссенции.`, `Challenge ${Math.min(6, s.dungeonClears[id]) + 1}: stronger enemies. Duplicate gear grants essences.`)}</p>` : ""}<div class="difficulty-list">${difficulties
      .map((df, i) => {
        const ok = dungeonAccess(s, id, i);
        return `<div class="vendor-upgrade">${icon(["sword", "shield", "skull"][i])}<span><b>${label(df.name)} · ${tr("ур.", "lvl")} ${d.level + df.level}+</b><small>${i ? tr(`Враги: здоровье ×${df.hp}, урон ×${df.damage} · трофеи: +${df.loot} предм., эссенции ×${df.essence}`, `Foes: health ×${df.hp}, damage ×${df.damage} · spoils: +${df.loot} items, essence ×${df.essence}`) : tr("Стандартные враги и трофеи", "Standard foes and spoils")}</small></span><button class="button ${i ? "secondary" : "primary"}" data-action="dungeonEnter-${id}${i ? "-" + i : ""}" ${ok ? "" : "disabled"}>${tr("Спуститься", "Enter dungeon")}</button></div>`;
      })
      .join("")}</div><div class="dialog-actions">${btn(tr("Подготовиться", "Prepare"), "close", "secondary")}</div>${!canEnter ? `<p class="recipe-text">${tr(`Нужен уровень ${d.level}${id === "citadel" ? " и три печати других подземелий" : ""}.`, `Requires level ${d.level}${id === "citadel" ? " and the other three dungeon seals" : ""}.`)}</p>` : ""}`,
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
    `<div class="climate-intro">${icon(c.weather === "snow" ? "snow" : c.weather === "storm" ? "spark" : "sun")}<h3>${label(seasonNames[c.season])}, ${tr("день", "day")} ${c.dayInSeason} · ${label(weatherNames[c.weather])} · ${c.night ? tr("Ночь", "Night") : tr("День", "Day")}</h3><p>${weatherDescription(c)}</p><p>${seasonDescription(c)}</p></div><p class="modal-intro">${tr("Ночью враги наносят на 20% больше урона, замечают вас дальше и дают на 15% больше опыта. Лунная трава даёт двойную добычу. У костра можно дождаться утра или ночи. В подземельях погода определяется их окружением.", "At night enemies deal 20% more damage, detect you farther away and grant 15% more experience. Moonleaf harvests double. Wait for morning or night at a campfire. Dungeon conditions depend on their environment.")}</p><p class="fine-print">${tr(`Следующая смена погоды примерно через ${Math.ceil(c.untilChange)} секунд игры.`, `The next weather change is in about ${Math.ceil(c.untilChange)} gameplay seconds.`)}</p>${btn(tr("Понятно", "Got it"), "close", "primary", "check")}`,
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
  if (name.startsWith("sc-")) {
    runSceneChoice(name);
    return;
  }
  if (name === "intro") {
    resetIntroScene();
    showIntro(0);
    return;
  }
  if (name === "introNext") {
    showIntro(Math.min(introPages().length - 1, introPage + 1));
    return;
  }
  if (name === "introDone") {
    finishIntro();
    return;
  }
  if (name.startsWith("skillSchool-")) {
    skillSchool = name.slice(12);
    showSkills();
    return;
  }
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
    skillSel = id;
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
    const o = landmarks.find(o=>o.type === "trainer" && o.class === game.save.characterClass) || landmarks.find(o=>o.id === ({warrior:"bladeMentor",ranger:"rangerMentor",mage:"mageMentor",paladin:"paladinMentor",necromancer:"necroMentor"})[game.save.characterClass]);
    game.waypoint = {x:o.x,y:o.y}; showMap(); return;
  }
  if (name.startsWith("bagFilter-")) { bagFilter=name.slice(10); showInventory(); return; }
  if (name.startsWith("recipesFor-")) {
    invTab = "craft";
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
    invTab = "craft";
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
    const [, id, diff = "0"] = name.split("-");
    if (game.enterDungeon(id, Number(diff))) {
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
    vendorTab = kind;
    vendorSel = id;
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
      selectedRace,
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
  if (name === "mapTravel") {
    const id = mapState.camp;
    if (id && game.fastTravel(id)) {
      closeModal();
      updateHUD();
      toast(tr("Вы у костра.", "You are at the campfire."));
    }
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
    skillSel = name.slice(6);
    if (game.learnSkill(name.slice(6))) {
      renderHUD();
      showSkills();
    }
    return;
  }
  if (name.startsWith("trade-")) {
    const [, mode, key, n] = name.split("-");
    if (!game.tradeItem(mode, key, Number(n)))
      toast(tr("Не хватает монет или товара.", "Not enough coins or goods."));
    renderHUD();
    showKeeper();
    return;
  }
  if (name.startsWith("sellGear-")) {
    const [, kind, id] = name.split("-");
    if (game.sellGear(kind, id)) renderHUD();
    showKeeper();
    return;
  }
  if (name === "innRest") {
    if (game.innRest()) {
      closeModal();
      updateHUD();
      toast(tr("Вы выспались. Утро, силы полностью восстановлены.", "You slept well. It's morning and you're fully rested."));
    }
    return;
  }
  if (name === "openSmith") {
    showSmith();
    return;
  }
  if (name.startsWith("invTab-")) {
    invTab = name.slice(7);
    showInventory();
    return;
  }
  if (name.startsWith("journalTab-")) {
    journalTab = name.slice(11);
    showJournal();
    return;
  }
  if (name.startsWith("skillSel-")) {
    skillSel = name.slice(9);
    showSkills();
    return;
  }
  if (name === "learnSel") {
    if (skillSel && game.learnSkill(skillSel)) {
      renderHUD();
      showSkills();
    }
    return;
  }
  if (name.startsWith("vendorTab-")) {
    vendorTab = name.slice(10);
    vendorSel = null;
    showSmith();
    return;
  }
  if (name.startsWith("vendorSel-")) {
    vendorSel = name.slice(10);
    showSmith();
    return;
  }
  if (name === "respec") {
    if (game.respecSkills()) {
      renderHUD();
      showSkills();
      toast(tr("Умения сброшены, очки возвращены.", "Abilities reset, points returned."));
    }
    return;
  }
  if (name === "readScroll") {
    if (game.readManuscript()) showInventory();
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
  if (name === "epilogueDusk" && s.quest === 10) {
    s.quest = 11;
    s.skillPoints += 1;
    s.flags.duskPower = true;
    s.flags.dawnHero = false;
    game.addXp(600);
    audio.effect("quest");
    saveAndUpdate();
    showEnding();
    return;
  }
  if (name === "actThree" && s.quest === 7 && allSeals(s)) {
    s.quest = 8;
    s.gold += 300;
    game.spawnQuestEnemies();
    audio.effect("quest");
    saveAndUpdate();
    closeModal();
    toast(
      tr(
        "Новая глава: «Голос за печатями». Вестники отмечены на карте.",
        "New chapter: “The voice beyond the seals”. Heralds are marked on the map.",
      ),
    );
    return;
  }
  if (name === "openRift") {
    if (game.openRift()) {
      closeModal();
      toast(
        tr(
          "Разлом открыт. Нерей Бессветный выходит на свет!",
          "The rift is open. Nerei the Lightless steps into the light!",
        ),
      );
    } else toast(tr("Подойдите ближе к Сердцу долины.", "Move closer to the Heart of the valley."));
    return;
  }
  if (name === "epilogue" && s.quest === 10) {
    s.quest = 11;
    s.gold += 500;
    s.skillPoints += 2;
    s.flags.dawnHero = true;
    game.addXp(600);
    audio.effect("quest");
    saveAndUpdate();
    showEnding();
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
  const rc = e.target.closest("[data-race]");
  if (rc) {
    selectedRace = rc.dataset.race;
    appearance.skin = races[selectedRace].skins[0];
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
  // Skip the click that follows a touch-down we already handled.
  if (control && touchFired && touchFired.name === control.dataset.action && performance.now() - touchFired.time < 800) {
    touchFired = null;
    return;
  }
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
  if (modal && !bindingAwait && /^Digit[1-9]$/.test(e.code) && modalRoot.querySelector(".vn-choices")) {
    const choice = modalRoot.querySelectorAll(".vn-choices button:not(:disabled)")[Number(e.code.slice(5)) - 1];
    if (choice) choice.click();
    return;
  }
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
document.addEventListener("mapicons", () => {
  if (modal === "world-map") drawMap(document.querySelector("#large-map"), true);
});
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
  joystickPointer = null,
  touchFired = null;
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
  // On touch screens every HUD button fires on touch-down, so dodge, skills and potions
  // work while the other thumb is still holding the joystick (iOS drops such clicks).
  const slot =
    e.pointerType !== "mouse" &&
    !game.paused &&
    e.target.closest('#hud .action-slot:not([data-action="attack"]), #interaction-prompt');
  if (slot && !slot.disabled) {
    touchFired = { name: slot.dataset.action, time: performance.now() };
    action(slot.dataset.action);
    audio.unlock();
    e.preventDefault();
    return;
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
      const p = mapPoint(e, canvas),
        t = mapTransform(canvas, true),
        camp = !game.save.activeDungeon && !game.save.interior
          ? landmarks.find(
              (o) => o.type === "camp" && Math.hypot((o.x - p.x) * t.sx, (o.y - p.y) * t.sy) < 8,
            )
          : null;
      // A click near a discovered campfire also offers fast travel there.
      mapState.camp = camp && game.save.visitedCamps.includes(camp.id) ? camp.id : null;
      if (camp && !mapState.camp)
        toast(tr("Этот костёр ещё не открыт: подойдите к нему.", "This campfire is undiscovered: walk up to it first."));
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
game.onEclipseVictory = showEclipseVictory;
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
    barFor,
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

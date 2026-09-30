import { tr } from "./i18n.js";
export const DAY_LENGTH = 900,
  WEATHER_LENGTH = 180;
export const weatherNames = {
  clear: ["Ясно", "Clear"],
  rain: ["Дождь", "Rain"],
  fog: ["Туман", "Fog"],
  storm: ["Гроза", "Storm"],
  snow: ["Снег", "Snow"],
};
export function climateAt(save, region = "village", dungeon = null) {
  const elapsed = (save?.playtime || 0) + (save?.restTime || 0),
    hour = (8 + (elapsed / DAY_LENGTH) * 24) % 24,
    night = hour < 6 || hour >= 20;
  const sequence = [
    "clear",
    "rain",
    "fog",
    "clear",
    "storm",
    "rain",
    "clear",
    "fog",
  ];
  let weather =
    sequence[Math.floor(elapsed / WEATHER_LENGTH) % sequence.length];
  if (
    ["tundra", "mountain", "highlands"].includes(region) &&
    ["rain", "storm"].includes(weather)
  )
    weather = "snow";
  if (dungeon)
    weather =
      dungeon === "mine" ? "snow" : dungeon === "abyss" ? "fog" : "clear";
  const dark = dungeon
    ? 0.56
    : night
      ? 0.57
      : hour < 8 || hour > 18
        ? 0.25
        : 0.04;
  return {
    hour,
    night,
    weather,
    dark,
    elapsed,
    speed: weather === "snow" ? 0.85 : weather === "rain" ? 0.92 : 1,
    enemyDamage: night && !dungeon ? 1.2 : 1,
    aggro: weather === "fog" ? 150 : night ? 270 : 225,
    xp: night && !dungeon ? 1.15 : 1,
    fire:
      weather === "rain" || weather === "storm"
        ? 0.7
        : weather === "snow"
          ? 1.15
          : 1,
    ice: weather === "rain" || weather === "snow" ? 1.2 : 1,
    lightning: weather === "rain" || weather === "storm" ? 1.25 : 1,
    untilChange: WEATHER_LENGTH - (elapsed % WEATHER_LENGTH),
  };
}
export function weatherDescription(climate) {
  return {
    clear: tr(
      "Чистый обзор. Ночью враги сильнее, а лунная трава даёт двойную добычу.",
      "Clear visibility. At night enemies are stronger and moonleaf harvests double.",
    ),
    rain: tr(
      "Скорость −8%, огонь −30%, лёд +20%, молнии +25%.",
      "Speed −8%, fire −30%, ice +20%, lightning +25%.",
    ),
    fog: tr(
      "Дальность автонаведения и обнаружения врагов ограничена.",
      "Auto-aim and enemy detection distances are reduced.",
    ),
    storm: tr(
      "Молнии +25%, огонь −30%. На открытой местности опасны удары молний.",
      "Lightning +25%, fire −30%. Lightning strikes threaten exposed ground.",
    ),
    snow: tr(
      "Скорость −15%, лёд +20%, огонь +15%. Тёплая броня защищает от замедления.",
      "Speed −15%, ice +20%, fire +15%. Weatherproof armor prevents the slowdown.",
    ),
  }[climate.weather];
}
export function elementMultiplier(climate, element) {
  return climate[element] || 1;
}

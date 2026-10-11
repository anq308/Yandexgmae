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
export const DAYS_PER_SEASON = 2;
export const seasonNames = {
  spring: ["Весна", "Spring"],
  summer: ["Лето", "Summer"],
  autumn: ["Осень", "Autumn"],
  winter: ["Зима", "Winter"],
};
const SEASONS = ["spring", "summer", "autumn", "winter"];
// Each season has its own weather rotation and day length.
const seasonWeather = {
  spring: ["clear", "rain", "fog", "clear", "storm", "rain", "clear", "fog"],
  summer: ["clear", "clear", "storm", "clear", "rain", "clear", "clear", "fog"],
  autumn: ["fog", "rain", "clear", "fog", "rain", "storm", "clear", "rain"],
  winter: ["snow", "clear", "snow", "fog", "snow", "snow", "clear", "snow"],
};
const daylight = {
  spring: { dawn: 6, dusk: 20 },
  summer: { dawn: 4.5, dusk: 21.5 },
  autumn: { dawn: 6.5, dusk: 19.5 },
  winter: { dawn: 7.5, dusk: 18 },
};
export function climateAt(save, region = "village", dungeon = null) {
  const elapsed = (save?.playtime || 0) + (save?.restTime || 0),
    day = Math.floor((elapsed + DAY_LENGTH / 3) / DAY_LENGTH),
    season = SEASONS[Math.floor(day / DAYS_PER_SEASON) % 4],
    hour = (8 + (elapsed / DAY_LENGTH) * 24) % 24,
    { dawn, dusk } = daylight[season],
    night = hour < dawn || hour >= dusk;
  const sequence = seasonWeather[season];
  let weather =
    sequence[Math.floor(elapsed / WEATHER_LENGTH) % sequence.length];
  if (
    ["tundra", "mountain", "highlands"].includes(region) &&
    ["rain", "storm"].includes(weather)
  )
    weather = "snow";
  if (["island", "coast", "badlands"].includes(region) && weather === "snow")
    weather = season === "winter" ? "rain" : "clear";
  if (dungeon)
    weather =
      dungeon === "mine" ? "snow" : dungeon === "abyss" ? "fog" : "clear";
  const indoors = dungeon === "interior";
  // Soft twilight around dawn and dusk; full brightness during the day.
  const twilight = Math.min(
    Math.abs(hour - dawn),
    Math.abs(hour - dusk),
  );
  const dark = indoors
    ? 0.18
    : dungeon
    ? 0.56
    : night
      ? twilight < 1
        ? 0.3 + twilight * 0.22
        : 0.52
      : twilight < 1.2
        ? 0.2 * (1 - twilight / 1.2)
        : 0;
  return {
    hour,
    night,
    weather,
    dark,
    elapsed,
    day,
    season,
    dayInSeason: (day % DAYS_PER_SEASON) + 1,
    sunset: !night && !dungeon && twilight < 1.2 ? 1 - twilight / 1.2 : 0,
    speed: weather === "snow" ? 0.85 : weather === "rain" ? 0.92 : 1,
    enemyDamage: night && !dungeon ? 1.2 : 1,
    aggro: weather === "fog" ? 150 : night ? 270 : 225,
    xp: (night && !dungeon ? 1.15 : 1) * (season === "spring" ? 1.05 : 1),
    gold: season === "autumn" ? 1.15 : 1,
    fire:
      (weather === "rain" || weather === "storm"
        ? 0.7
        : weather === "snow"
          ? 1.15
          : 1) * (season === "summer" ? 1.1 : 1),
    ice: (weather === "rain" || weather === "snow" ? 1.2 : 1) * (season === "winter" ? 1.15 : 1),
    lightning: weather === "rain" || weather === "storm" ? 1.25 : 1,
    untilChange: WEATHER_LENGTH - (elapsed % WEATHER_LENGTH),
  };
}
export function seasonDescription(climate) {
  return {
    spring: tr("Весна: +5% опыта, свежая трава, частые дожди.", "Spring: +5% experience, fresh grass, frequent rain."),
    summer: tr("Лето: длинный день, огонь +10%, грозы.", "Summer: long days, fire +10%, thunderstorms."),
    autumn: tr("Осень: золото с врагов +15%, туманы и листопад.", "Autumn: +15% gold from enemies, fog and falling leaves."),
    winter: tr("Зима: короткий день, лёд +15%, снег по всей долине.", "Winter: short days, ice +15%, snow across the valley."),
  }[climate.season];
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

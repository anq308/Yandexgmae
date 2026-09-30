const paths = {
  wood: '<path d="m4 8 11-5 6 3v10l-11 5-6-3Zm0 0 6 3 11-5M10 11v10m-3-8v3m7-5v5m4-6v5"/>',
  ore: '<path d="m3 17 2-9 7-5 7 4 3 10-6 5H8Zm2-9 7 4 7-5m-7 5 4 10m-4-10-9 5"/>',
  fiber: '<path d="M5 21c12-12-1-12 12-18M9 21c12-12-1-12 12-18M2 17 17 2m-9 9 7 7M5 14l7 7"/>',
  leather: '<path d="M4 4 9 2l3 3 3-3 5 2-2 5 3 5-3 7-6-2-6 2-3-7 3-5Zm5 7 6 5"/>',
  bandage: '<path d="m2 8 6-6 14 14-6 6Zm3-3 14 14M9 9l6 6m-6-2 2-2m2 4 2-2"/>',
  bait: '<path d="M4 6c-3 4 6 5 3 9s5 9 9 4 1-5-2-6 4-7 6-4"/><circle cx="5" cy="5" r="2"/>',
  berry: '<circle cx="8" cy="14" r="5"/><circle cx="16" cy="14" r="5"/><path d="M12 10V3m0 4c-5 0-6-5-6-5 6 0 6 5 6 5Zm0 0c5 0 6-5 6-5-6 0-6 5-6 5Z"/>',
  essence: '<path d="M12 2c6 7 9 10 6 15a7 7 0 0 1-12 0C3 12 6 9 12 2Zm0 9c3 3 4 5 2 7s-5 0-4-3Z"/>',
  pearl: '<circle cx="12" cy="12" r="8"/><path d="M7 11a5 5 0 0 1 5-5m4 10 2-2"/>',
  hand: '<path d="M7 12V5a2 2 0 0 1 4 0v6-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v8c0 5-3 8-7 8-3 0-5-2-7-5l-2-4c-1-3 2-4 4-1Z"/>',
  fish: '<path d="M3 12c5-8 12-8 16 0-4 8-11 8-16 0Zm16 0 4-5v10Z"/><circle cx="7" cy="11" r="1"/>',
  rod: '<path d="M3 21 16 3m-3 4 7-4v12a3 3 0 0 1-6 0m2-12 4 0"/>',
  helmet: '<path d="M4 17V9a8 8 0 0 1 16 0v8h-5l-3 4-3-4Zm0-6h16m-8-9v7"/>',
  pants: '<path d="M5 3h14l1 18h-7l-1-11-1 11H4Zm0 4h14"/>',

  spear: '<path d="m18 2 4 4-6 7-5-5Zm-4 8L3 21m-1-3 4 4"/>',
  crossbow:
    '<path d="M3 6c6-6 12-6 18 0L12 12ZM12 3v18m-3-3 3 3 3-3M3 6l4 4m14-4-4 4"/>',
  daggers:
    '<path d="m3 2 7 5v9H7V7Zm18 0-7 5v9h3V7ZM5 16h7m0 0h7M8 16v6m8-6v6"/>',
  snow: '<path d="M12 2v20M3 7l18 10M3 17 21 7M8 4l4 3 4-3M8 20l4-3 4 3M3 11l5-1-1-5m10 14-1-5 5-1M3 13l5 1-1 5m10-14-1 5 5 1"/>',
  trap: '<path d="m3 19 6-14 3 5 3-5 6 14ZM3 19l4-5 3 5 2-5 3 5 3-5 3 5M12 10v4"/>',
  target:
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  meteor:
    '<path d="m22 2-9 8M20 7l-4 4M15 2l-5 5m1 4a6 6 0 1 0 2 2M7 14l3-3 3 3-3 3Z"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  minus: '<path d="M4 12h16"/>',
  lock: '<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
  sword:
    '<path d="m14 4 6-2-2 6-9 9-4-4Z"/><path d="m4 12 8 8M7 17l-4 4m-1-3 4 4"/>',
  bow: '<path d="M6 3c16 0 16 18 0 18L14 12Z"/><path d="M3 12h17m-4-3 4 3-4 3"/>',
  staff:
    '<path d="m5 21 10-12m-5-6 6-2 5 5-2 6-6-1Z"/><path d="m13 4 4 4m-6 4 3 3"/>',
  leaf: '<path d="M20 3C8 1 2 8 6 16s16 0 14-13Z"/><path d="m3 22 13-13m-8 8-1-6m5 2 5 1"/>',
  map: '<path d="m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3Z"/><path d="M8 2v17M16 5v17"/>',
  book: '<path d="M12 5C7 1 2 3 2 3v16s5-2 10 2c5-4 10-2 10-2V3s-5-2-10 2Zm0 0v16"/>',
  bag: '<path d="M5 7h14l2 14H3Zm3 0V5a4 4 0 0 1 8 0v2M8 12h8"/>',
  sound: '<path d="M10 4 5 9H2v6h3l5 5Zm5 4c4 2 4 6 0 8m3-11c7 4 7 10 0 14"/>',
  mute: '<path d="M10 4 5 9H2v6h3l5 5Zm5 5 7 7m0-7-7 7"/>',
  pause: '<path d="M7 4v16M17 4v16"/>',
  play: '<path d="m8 4 13 8-13 8Z"/>',
  arrow: '<path d="M3 12h18m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  heart: '<path d="M12 21 3 12C-3 4 8-1 12 6c4-7 15-2 9 6Z"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 6v12m3-10H10a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H9"/>',
  potion:
    '<path d="M9 2h6v6l4 6a5 5 0 0 1-4 8H9a5 5 0 0 1-4-8l4-6ZM7 14h10M8 2h8"/>',
  shield: '<path d="m12 2 9 4v7c0 5-9 9-9 9s-9-4-9-9V6Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  home: '<path d="m2 10 10-8 10 8M5 8v14h14V8M9 22v-8h6v8"/>',
  settings:
    '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
  crystal: '<path d="m12 2 7 7-3 12H8L5 9Zm0 0L9 9l3 12 3-12Zm-7 7h14"/>',
  flag: '<path d="M5 22V3c6-5 8 5 15 0v10c-7 5-9-5-15 0"/>',
  boot: '<path d="M8 3h8v11l5 3v4H3v-7h5ZM8 7h8m-8 4h8"/>',
  moon: '<path d="M20 16A9 9 0 0 1 8 3a9 9 0 1 0 12 13Z"/>',
  fullscreen: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 9M3 3v7h7"/>',
};
export function icon(name, cls = "") {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
}

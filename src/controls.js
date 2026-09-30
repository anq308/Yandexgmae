export const defaultBindings = {
  attack: "Space",
  skill1: "KeyQ",
  skill2: "KeyF",
  skill3: "KeyC",
  skill4: "KeyV",
  skill5: "KeyB",
  dodge: "ShiftLeft",
  interact: "KeyE",
  potion: "KeyR",
  inventory: "KeyI",
  journal: "KeyJ",
  map: "KeyM",
  skills: "KeyK",
};
const allowed = /^(Key[A-Z]|Digit[0-9]|Space|ShiftLeft|ShiftRight)$/;
export function loadControls() {
  try {
    return normalizeControls(
      JSON.parse(localStorage.getItem("elderia-controls-v2")),
    );
  } catch {
    return normalizeControls(null);
  }
}
export function normalizeControls(input) {
  const bindings = { ...defaultBindings };
  if (input?.bindings) {
    const keys = Object.keys(bindings),
      values = keys.map((key) => input.bindings[key]);
    if (
      Object.keys(input.bindings).length === keys.length &&
      new Set(values).size === values.length &&
      values.every(
        (v) =>
          typeof v === "string" &&
          allowed.test(v) &&
          !["KeyW", "KeyA", "KeyS", "KeyD"].includes(v),
      )
    )
      Object.assign(bindings, input.bindings);
  }
  return {
    bindings,
    autoAim: input?.autoAim !== false,
    clickAttack: input?.clickAttack !== false,
    screenShake: input?.screenShake !== false,
    showDamage: input?.showDamage !== false,
  };
}
export function saveControls(controls) {
  try {
    localStorage.setItem("elderia-controls-v2", JSON.stringify(controls));
  } catch {}
}
export function keyLabel(code) {
  return code === "Space"
    ? "SPACE"
    : code.startsWith("Shift")
      ? "SHIFT"
      : code.replace("Key", "").replace("Digit", "");
}
export function movement(keys) {
  let x =
      (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
      (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
    y =
      (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
      (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
  const length = Math.hypot(x, y);
  if (length) {
    x /= length;
    y /= length;
  }
  return { x, y };
}

export class GameAudio {
  enabled = true;
  paused = true;
  context = null;
  timer = null;
  note = 0;
  constructor() {
    try {
      this.enabled = localStorage.getItem("elderia-audio") !== "off";
    } catch {}
  }
  unlock() {
    if (!this.context) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio) this.context = new Audio();
    }
    if (this.enabled && !this.paused) this.context?.resume().catch(() => {});
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    try {
      localStorage.setItem("elderia-audio", enabled ? "on" : "off");
    } catch {}
    this.sync();
  }
  setPaused(paused) {
    this.paused = paused;
    this.sync();
  }
  sync() {
    clearInterval(this.timer);
    if (!this.context) return;
    if (this.enabled && !this.paused) {
      this.context.resume().catch(() => {});
      this.timer = setInterval(() => this.ambient(), 720);
    } else this.context.suspend().catch(() => {});
  }
  tone(freq, duration = 0.16, type = "sine", volume = 0.05) {
    if (
      !this.enabled ||
      this.paused ||
      !this.context ||
      this.context.state !== "running"
    )
      return;
    const osc = this.context.createOscillator(),
      gain = this.context.createGain(),
      now = this.context.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }
  ambient() {
    const melody = [
      293.66, 0, 440, 0, 392, 0, 349.23, 0, 293.66, 0, 261.63, 0, 220, 0,
      261.63, 0,
    ];
    const freq = melody[this.note++ % melody.length];
    if (freq) this.tone(freq, 0.9, "sine", 0.016);
    if (this.note % 4 === 0) this.tone(146.83, 2, "sine", 0.012);
  }
  effect(kind) {
    if (kind === "hit") {
      this.tone(180, 0.07, "triangle", 0.06);
      this.tone(90, 0.12, "sine", 0.035);
    } else if (kind === "pickup") {
      this.tone(587, 0.12);
      setTimeout(() => this.tone(880, 0.15), 65);
    } else if (kind === "level") {
      [392, 494, 587, 784].forEach((f, i) =>
        setTimeout(() => this.tone(f, 0.3), i * 90),
      );
    } else if (kind === "skill") this.tone(660, 0.4, "triangle", 0.035);
    else if (kind === "hurt") this.tone(100, 0.18, "sawtooth", 0.025);
  }
}

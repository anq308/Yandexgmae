export class GameAudio {
  enabled = true;
  paused = true;
  context = null;
  timer = null;
  note = 0;
  mood = "day";
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
  // Day, night, dungeon and boss moods share one sequencer with different scales.
  setMood(mood) {
    if (mood !== this.mood) {
      this.mood = mood;
      this.note = 0;
    }
  }
  ambient() {
    const melodies = {
      day: [293.66, 0, 440, 0, 392, 0, 349.23, 0, 293.66, 0, 261.63, 0, 220, 0, 261.63, 0],
      night: [220, 0, 0, 261.63, 0, 0, 246.94, 0, 196, 0, 0, 220, 0, 0, 174.61, 0],
      dungeon: [146.83, 0, 174.61, 0, 155.56, 0, 0, 0, 146.83, 0, 130.81, 0, 0, 116.54, 0, 0],
      boss: [196, 233.08, 196, 293.66, 196, 233.08, 277.18, 261.63, 196, 233.08, 196, 311.13, 293.66, 277.18, 261.63, 233.08],
      eclipse: [174.61, 0, 207.65, 185, 0, 155.56, 0, 233.08, 174.61, 0, 207.65, 0, 261.63, 0, 233.08, 0],
    };
    const melody = melodies[this.mood] || melodies.day,
      freq = melody[this.note++ % melody.length],
      tense = this.mood === "boss" || this.mood === "eclipse";
    if (freq) this.tone(freq, tense ? 0.35 : 0.9, tense ? "triangle" : "sine", tense ? 0.02 : 0.016);
    if (this.note % 4 === 0)
      this.tone(tense ? 98 : this.mood === "dungeon" ? 73.42 : 146.83, 2, "sine", tense ? 0.02 : 0.012);
    if (tense && this.note % 2 === 0) this.tone(60, 0.12, "square", 0.012);
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
    } else if (kind === "coin") {
      this.tone(1320, 0.06, "square", 0.018);
      setTimeout(() => this.tone(1760, 0.08, "square", 0.014), 45);
    } else if (kind === "crit") {
      this.tone(260, 0.08, "square", 0.04);
      this.tone(130, 0.18, "triangle", 0.05);
      setTimeout(() => this.tone(990, 0.12, "sine", 0.025), 30);
    } else if (kind === "death") {
      this.tone(220, 0.25, "triangle", 0.035);
      setTimeout(() => this.tone(147, 0.3, "triangle", 0.03), 70);
    } else if (kind === "quest") {
      [523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => this.tone(f, 0.45, "triangle", 0.03), i * 120),
      );
    } else if (kind === "skill") this.tone(660, 0.4, "triangle", 0.035);
    else if (kind === "hurt") this.tone(100, 0.18, "sawtooth", 0.025);
  }
}

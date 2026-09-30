import { setLanguage } from "./i18n.js";
import { chooseSave, readLocal, writeLocal } from "./storage.js";
export class Platform {
  sdk = null;
  player = null;
  running = false;
  readySent = false;
  latest = null;
  cloudTimer = 0;
  cloudBusy = false;
  lastCloudWrite = 0;
  onPause = () => {};
  onResume = () => {};
  async init() {
    // No SDK requests are made during local development. The release archive uses
    // the relative SDK path required by the platform-hosted integration.
    const local =
      ["localhost", "127.0.0.1", "::1", "[::1]", ""].includes(
        location.hostname,
      ) ||
      /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
    setLanguage("ru");
    if (local) return readLocal();
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/sdk.js";
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.append(script);
      });
      this.sdk = await window.YaGames.init();
      setLanguage(this.sdk.environment.i18n.lang);
      this.sdk.on("game_api_pause", () => this.onPause());
      this.sdk.on("game_api_resume", () => this.onResume());
      try {
        this.player = await this.sdk.getPlayer();
        const data = await this.player.getData(["elderia"]);
        return chooseSave(readLocal(), data.elderia);
      } catch {
        return readLocal();
      }
    } catch {
      return readLocal();
    }
  }
  ready() {
    if (!this.readySent && this.sdk) {
      this.sdk.features.LoadingAPI?.ready();
      this.readySent = true;
    }
  }
  gameplay(active) {
    if (this.running === active) return;
    this.running = active;
    if (active) this.sdk?.features.GameplayAPI?.start();
    else this.sdk?.features.GameplayAPI?.stop();
  }
  save(save) {
    save.updatedAt = Date.now();
    const localSuccess = writeLocal(save);
    this.latest = JSON.parse(JSON.stringify(save));
    if (this.player) this.queueCloud();
    return localSuccess;
  }
  queueCloud() {
    clearTimeout(this.cloudTimer);
    const wait = Math.max(600, 15500 - (Date.now() - this.lastCloudWrite));
    this.cloudTimer = setTimeout(() => this.flush(), wait);
  }
  async flush() {
    if (!this.player || !this.latest || this.cloudBusy) return;
    const snapshot = this.latest;
    this.latest = null;
    this.cloudBusy = true;
    this.lastCloudWrite = Date.now();
    try {
      await this.player.setData({ elderia: snapshot }, true);
    } catch {
      if (!this.latest) this.latest = snapshot;
    } finally {
      this.cloudBusy = false;
      if (this.latest) this.queueCloud();
    }
  }
  get hasAds() {
    return !!this.sdk?.adv;
  }
  rewarded(onReward) {
    if (!this.hasAds) return Promise.resolve(false);
    this.onPause();
    this.gameplay(false);
    return new Promise((resolve) => {
      let rewarded = false,
        finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        this.onResume();
        resolve(rewarded);
      };
      try {
        this.sdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => this.onPause(),
            onRewarded: () => {
              if (!rewarded) {
                rewarded = true;
                onReward();
              }
            },
            onClose: finish,
            onError: finish,
          },
        });
      } catch {
        finish();
      }
    });
  }
}

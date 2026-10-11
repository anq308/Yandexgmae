import { canWalk, landmarks, lineOfSight, point, TILE } from "./world.js";
import { makeEnemy, addHazard } from "./battle.js";
import { tr, label } from "./i18n.js";
// Act III: three heralds carry eclipse shards; the shards open the rift above the Heart.
export const heralds = [
  {
    id: "heraldDeadwood",
    shard: "deadwood",
    at: [186, 95],
    name: ["Вестник Мёртвого леса", "Herald of Deadwood"],
  },
  {
    id: "heraldMarsh",
    shard: "marsh",
    at: [118, 66],
    name: ["Вестник Туманных болот", "Herald of the Misty Marshes"],
  },
  {
    id: "heraldTundra",
    shard: "tundra",
    at: [192, 14],
    name: ["Вестник Белой тундры", "Herald of the White Tundra"],
  },
];
export const shardCount = (save) =>
  heralds.filter((h) => save.flags["shard-" + h.shard]).length;
export const dawnWeapons = {
  warrior: "dawnblade",
  ranger: "dawnbow",
  mage: "dawnstaff",
  paladin: "dawnhammer",
  necromancer: "duskstaff",
};
// Finds the closest open spot so quest spawns never land inside trees or water.
export function walkableNear(world, x, y, radius = 10) {
  for (let ring = 0; ring < 12; ring++)
    for (let i = 0; i < Math.max(1, ring * 8); i++) {
      const a = (i / Math.max(1, ring * 8)) * Math.PI * 2,
        px = x + Math.cos(a) * ring * TILE,
        py = y + Math.sin(a) * ring * TILE;
      if (canWalk(world, px, py, radius)) return { x: px, y: py };
    }
  return { x, y };
}
export function questSpawns(world, save) {
  const list = [];
  if (save.quest >= 8)
    for (const h of heralds) {
      if (save.flags["shard-" + h.shard]) continue;
      const p = walkableNear(world, point(...h.at).x, point(...h.at).y, 12);
      list.push({
        id: h.id,
        type: "herald",
        ...p,
        shard: h.shard,
        unique: true,
        tier: 2,
        elite: true,
      });
      for (let k = 0; k < 2; k++) {
        const q = walkableNear(world, p.x + (k ? 60 : -60), p.y + 30, 8);
        list.push({
          id: h.id + "-shade" + k,
          type: "shade",
          ...q,
          unique: true,
          tier: 1,
        });
      }
    }
  if (save.quest === 9 && save.flags.eclipseAwake) {
    const altar = landmarks.find((o) => o.id === "altar");
    list.push({
      id: "eclipse",
      type: "eclipse",
      ...walkableNear(world, altar.x, altar.y - 70, 16),
      boss: true,
      unique: true,
    });
  }
  return list;
}
export function installEclipse(Game) {
  Object.assign(Game.prototype, {
    spawnQuestEnemies() {
      if (!this.save || this.save.activeDungeon) return;
      for (const spawn of questSpawns(this.world, this.save)) {
        if (this.defeated.has(spawn.id) || this.enemies.some((e) => e.id === spawn.id))
          continue;
        this.enemies.push(makeEnemy(spawn, undefined, this.save.level));
      }
    },
    collectShard(e) {
      const s = this.save;
      if (!e.shard || s.flags["shard-" + e.shard]) return;
      s.flags["shard-" + e.shard] = true;
      this.emit("phase", e.x, e.y, "#d7b8ff", 40);
      const found = shardCount(s);
      this.audio.effect("quest");
      if (found >= heralds.length && s.quest === 8) {
        s.quest = 9;
        this.onToast(
          tr(
            "Все три осколка затмения у вас! Идите к Сердцу долины.",
            "You hold all three eclipse shards! Go to the Heart of the valley.",
          ),
        );
      } else
        this.onToast(
          tr(
            `Осколок затмения получен (${found}/3).`,
            `Eclipse shard claimed (${found}/3).`,
          ),
        );
    },
    openRift() {
      const s = this.save,
        altar = landmarks.find((o) => o.id === "altar");
      if (
        s.quest !== 9 ||
        s.flags.eclipseAwake ||
        shardCount(s) < heralds.length ||
        Math.hypot(altar.x - s.x, altar.y - s.y) > 80
      )
        return false;
      s.flags.eclipseAwake = true;
      this.spawnQuestEnemies();
      this.emit("phase", altar.x, altar.y - 40, "#c9a8ff", 70);
      this.shake = this.controls.screenShake ? 0.5 : 0;
      this.persist();
      this.onChange();
      return true;
    },
    defeatEclipse(e) {
      const s = this.save;
      s.flags.eclipseDefeated = true;
      s.quest = 10;
      this.eclipseDark = 0;
      this.audio.effect("quest");
      this.onEclipseVictory?.();
    },
    // Custom behaviour for act III enemies. Returns true when the enemy was fully handled.
    enemySpecial(e, dt, dist) {
      const s = this.save;
      if (e.type === "shade") {
        e.blink = Math.max(0, (e.blink ?? 2) - dt);
        if (e.blink <= 0 && dist > 70 && dist < 230 && this.buffs.stealth <= 0) {
          const behind = this.facing + Math.PI,
            x = s.x + Math.cos(behind) * 34,
            y = s.y + Math.sin(behind) * 34;
          if (canWalk(this.world, x, y, 6)) {
            this.emit("phase", e.x, e.y, "#9c86d6", 10);
            e.x = x;
            e.y = y;
            e.cooldown = Math.min(e.cooldown, 0.3);
            this.emit("phase", x, y, "#9c86d6", 10);
          }
          e.blink = 5;
        }
        return false;
      }
      if (e.type !== "herald") return false;
      if (dist > 380 || e.stun > 0) return true;
      if (!e.engaged) {
        if (dist > 260 || !lineOfSight(this.world, e, s)) return true;
        e.engaged = true;
        this.onToast(label(heralds.find((h) => h.shard === e.shard)?.name || ["Вестник", "Herald"]));
      }
      e.cooldown = Math.max(0, e.cooldown - dt);
      e.shieldTimer = (e.shieldTimer ?? 6) - dt;
      e.shield = Math.max(0, (e.shield || 0) - dt);
      if (e.shieldTimer <= 0) {
        e.shieldTimer = 9;
        e.shield = 3.5;
        this.emit("phase", e.x, e.y, "#b48cff", 18);
        const alive = this.enemies.filter((m) => m.owner === e.id && m.hp > 0).length;
        if (alive < 2) {
          const p = walkableNear(this.world, e.x + 50, e.y + 20, 6),
            m = makeEnemy(
              { id: e.id + "-echo-" + ++this.spawnSerial, type: "shade", ...p, owner: e.id, summoned: true, tier: 1 },
              undefined,
              s.level,
            );
          m.xp = m.gold = 0;
          this.enemies.push(m);
        }
      }
      if (e.cooldown <= 0 && dist < 300) {
        e.cooldown = 2.3;
        const n = (e.attackIndex = (e.attackIndex || 0) + 1);
        if (n % 3 === 0) {
          const a = Math.atan2(s.y - e.y, s.x - e.x);
          addHazard(this, {
            shape: "line",
            x: e.x,
            y: e.y,
            angle: a,
            range: 340,
            width: 22,
            delay: 0.9,
            damage: e.damage * 1.1,
            element: "void",
            color: "#b48cff",
            owner: e.id,
          });
        } else
          for (let k = 0; k < 3; k++)
            addHazard(this, {
              x: s.x + Math.cos(k * 2.1) * k * 40,
              y: s.y + Math.sin(k * 2.1) * k * 40,
              radius: 44,
              delay: 0.85 + k * 0.18,
              damage: e.damage,
              element: "void",
              color: "#b48cff",
              owner: e.id,
            });
        this.emit("cast", e.x, e.y, "#d9a0e9", 15);
      } else if (dist > 170) {
        const speed = e.speed * (e.slow > 0 ? 0.4 : 1) * dt,
          dx = (s.x - e.x) / dist,
          dy = (s.y - e.y) / dist;
        if (canWalk(this.world, e.x + dx * speed, e.y + dy * speed, 8)) {
          e.x += dx * speed;
          e.y += dy * speed;
        }
      } else if (dist < 90) {
        const speed = e.speed * 0.8 * dt,
          dx = (e.x - s.x) / Math.max(1, dist),
          dy = (e.y - s.y) / Math.max(1, dist);
        if (canWalk(this.world, e.x + dx * speed, e.y + dy * speed, 8)) {
          e.x += dx * speed;
          e.y += dy * speed;
        }
      }
      return true;
    },
  });
}

import { Battle, ARENA, setArena, Pickup } from './battle';
import { Mon, Trainer, FOCUS, sizeHpMul } from './mon';
import { Rng, clamp } from '../core/util';
import { MAPS, makeRoyaleMap, MapDef } from '../data/maps';
import { BASE_IDS, SPECIES, formAt } from '../data/species';
import * as L from '../league';
import type { Save, Owned } from '../state';

/** Battle Royale auf der echten Kampf-Engine: Du läufst über eine riesige Karte; kommt ein Rivale heran, kämpft ihr mit den normalen Steuerungen genau dort.
 *  Alle anderen Rivalen sind einfache Wanderer, die sich gegenseitig (unsichtbar simuliert) ausschalten. Ein Sturm engt die Karte ein. */
export const PLAYERS = 25;
const ENGAGE_R = 104, LEAVE_R = 250, SIM_R = 40, ITEM_CAP = 6;
const STORM_WAIT = 42, STORM_SHRINK = 230, STORM_R0 = 1050, STORM_R1 = 90;

export interface Rival { id: number; mon: Mon; sp: string; lvl: number; tactic: 'attack' | 'balanced' | 'counter' | 'defend'; alive: boolean; goal: { x: number; y: number } | null; cd: number; aggro: number; stuck: number; place: number; sim: Sim | null; drop: boolean }
interface Sim { other: Rival; bt: Battle; ta: Trainer; tb: Trainer; steps: number; acc: number }

/** Statische Spieldaten laufen über ein globales ARENA: Hintergrund-Simulationen brauchen kurz die normale Arena. */
function withArena<T>(f: () => T): T { const sv = { ...ARENA }; try { return f(); } finally { setArena(sv); } }

export class RoyaleCtl {
  rng: Rng; map: MapDef; b!: Battle; rivals: Rival[] = []; me!: Mon;
  kills = 0; t = 0; over = false; engaged: Rival | null = null;
  zone = { x: 750, y: 750, r: STORM_R0 }; stormAcc = 0;
  nextItem = 8; sims: Sim[] = []; len: number;
  msg: (t: string) => void = () => {};
  /** Wird beim Start der Platzierung gesetzt (Rang des Spielers beim Ausscheiden). */
  place = 0;
  constructor(public save: Save, public lead: Owned, seed = (Math.random() * 1e9) | 0) {
    this.rng = new Rng(seed);
    this.map = makeRoyaleMap(seed % 100000 + 1); MAPS[this.map.id] = this.map;
    const spec = L.customEnemy(1, { name: 'x', level: lead.level, count: 1, coins: 0 });
    this.len = L.lenMulOf(spec);
  }
  get alive() { return this.rivals.filter((r) => r.alive).length; }

  /** Spieler- und Gegner-Trainer erzeugen (der Gegner-Platz bleibt leer, bis ein Rivale angreift). */
  trainers(): { player: Trainer; enemy: Trainer } {
    const player = L.playerTrainer(this.save, { team: [this.lead.id], hp: {} }, 1, this.len);
    const enemy = new Trainer(1, 'RIVALE', [], true);
    return { player, enemy };
  }

  /** Nach dem Erzeugen des Kampfs: Karte, Rivalen und Items aufstellen. */
  attach(b: Battle) {
    this.b = b; b.royale = true; b.finaleAt = Infinity; b.worldOn = true; b.pickupCap = 99; b.pickupLife = 120; b.onStep = (dt) => this.step(dt);
    const big = this.map.big!, rng = this.rng;
    this.me = b.trainers[0].active!;
    this.zone.x = big.w / 2 + rng.range(-120, 120); this.zone.y = big.h / 2 + rng.range(-120, 120);
    const sp = this.freeSpot(big.w * 0.15, 300); this.me.x = sp.x; this.me.y = sp.y; b.trainers[0].lastX = sp.x; b.trainers[0].lastY = sp.y;
    for (let i = 0; i < PLAYERS; i++) {
      const lvl = clamp(this.lead.level + rng.int(-3, 2), 5, 60), sps = formAt(rng.pick(BASE_IDS), lvl);
      const spec = L.customEnemy(rng.int(1, 1e9), { name: SPECIES[sps].name, level: lvl, count: 1, coins: 0, pool: [sps] });
      const mon = L.enemyTrainer(spec, 1, this.len).team[0];
      let p = this.freeSpot(0, 0); for (let k = 0; k < 30 && Math.hypot(p.x - this.me.x, p.y - this.me.y) < 360; k++) p = this.freeSpot(0, 0);
      mon.x = p.x; mon.y = p.y; mon.state = 'ready'; mon.t = 0; mon.since = 0; mon.fought = true; mon.look = rng.range(0, 6.28);
      this.rivals.push({ id: i, mon, sp: sps, lvl, tactic: rng.pick(['attack', 'balanced', 'counter', 'defend'] as const), alive: true, goal: null, cd: rng.range(0, 5), aggro: 0, stuck: 0, place: 0, sim: null, drop: false });
      b.extras.push(mon);
    }
    // Items: wenige, dafür ein Heiltrank in Reichweite zum Üben
    this.spawnItem('heal', this.me.x + rng.range(-150, 150), this.me.y + rng.range(-150, 150));
    for (let i = 0; i < 4; i++) this.spawnItem();
    this.updateHud();
  }

  blockedAt(x: number, y: number, r: number, m?: Mon) {
    return this.map.features.some((f) => Math.hypot(f.x - x, f.y - y) < f.r + r && !(m && f.kind !== 'tree' && f.kind !== 'rock' && this.b?.canEnter(m, f)));
  }
  freeSpot(margin: number, near: number): { x: number; y: number } {
    const big = this.map.big!, rng = this.rng;
    for (let i = 0; i < 40; i++) {
      const x = near ? clamp(this.zone.x + rng.range(-near, near), big.x0 + 40, big.x1 - 40) : rng.range(big.x0 + 60 + margin, big.x1 - 60 - margin);
      const y = near ? clamp(this.zone.y + rng.range(-near, near), big.y0 + 40, big.y1 - 40) : rng.range(big.y0 + 60 + margin, big.y1 - 60 - margin);
      if (!this.map.features.some((f) => Math.hypot(f.x - x, f.y - y) < f.r + 30)) return { x, y };
    }
    return { x: this.zone.x, y: this.zone.y };
  }

  spawnItem(kind?: Pickup['kind'], x?: number, y?: number) {
    const r = this.rng.next() * 100;
    const k: Pickup['kind'] = kind ?? (r < 40 ? 'heal' : r < 62 ? 'power' : r < 84 ? 'focus' : 'speed');
    let p = x === undefined ? this.freeSpot(0, Math.max(120, this.zone.r - 40)) : { x, y: y! };
    if (x !== undefined && this.map.features.some((f) => Math.hypot(f.x - p.x, f.y - p.y) < f.r + 20)) p = this.freeSpot(0, 200);
    p = { x: clamp(p.x, ARENA.x0 + 20, ARENA.x1 - 20), y: clamp(p.y, ARENA.y0 + 20, ARENA.y1 - 20) };
    this.b.spawnPickup(k, p.x, p.y, this.b.pickupLife);
  }

  zoneR() { return this.t < STORM_WAIT ? STORM_R0 : Math.max(STORM_R1, STORM_R0 - ((this.t - STORM_WAIT) / STORM_SHRINK) * (STORM_R0 - STORM_R1)); }

  step(dt: number) {
    if (this.over || this.b.winner !== null) return;
    const b = this.b, me = this.me; this.t += dt;
    this.zone.r = this.zoneR(); b.storm = this.zone;
    // Sturm: Schaden außerhalb des sicheren Bereichs
    this.stormAcc += dt;
    if (this.stormAcc >= 0.5) {
      this.stormAcc -= 0.5;
      const prog = clamp((this.t - STORM_WAIT) / STORM_SHRINK, 0, 1);
      const hit = (m: Mon, mult: number) => { if (m.alive && Math.hypot(m.x - this.zone.x, m.y - this.zone.y) > this.zone.r) { b.damageDirect(m, Math.max(1, Math.round(m.maxHp * (0.008 + 0.014 * prog) * mult)), '#ff5a80'); return true; } return false; };
      if (me.alive && me.state !== 'faint') { if (hit(me, 1) && Math.random() < 0.5) b.text(me.x, me.y, 'STURM!', '#ff5a80', 0.8, false, me.sp.height + 10); }
      for (const rv of this.rivals) if (rv.alive && !rv.sim && rv.mon.alive) { if (hit(rv.mon, 1.4) && rv.mon.hp <= 0) { rv.mon.hp = 0; this.eliminate(rv, 'STURM'); } }
    }
    // Items
    this.nextItem -= dt;
    if (this.nextItem <= 0) { this.nextItem = this.rng.range(13, 19); if (b.pickups.length < ITEM_CAP) this.spawnItem(); }
    for (const rv of this.rivals) {   // Rivalen sammeln gelegentlich selbst ein
      if (!rv.alive || rv.sim || this.engaged === rv) continue;
      const pk = b.pickups.find((p) => p.life > 0 && Math.hypot(p.x - rv.mon.x, p.y - rv.mon.y) < 18);
      if (pk) { pk.life = 0; if (pk.kind === 'heal') rv.mon.hp = Math.min(rv.mon.maxHp, rv.mon.hp + Math.round(rv.mon.maxHp * 0.25)); }
    }
    // Der Rivale im Kampf
    const e = this.engaged;
    if (e) {
      if (!e.mon.alive && e.mon.state === 'faint' && e.mon.t > 1.1) this.defeatEngaged(e);
      else if (e.mon.alive && me.alive && Math.hypot(e.mon.x - me.x, e.mon.y - me.y) > LEAVE_R) this.disengage(e);
    }
    this.moveRivals(dt);
    this.runSims(dt);
    if (!this.engaged && me.alive && me.state !== 'faint') this.tryEngage();
    this.updateHud();
  }

  /** Rivale rückt als Gegner in den Kampf nach. */
  tryEngage() {
    const me = this.me;
    let best: Rival | null = null, bd = ENGAGE_R;
    for (const rv of this.rivals) {
      if (!rv.alive || rv.sim || rv.cd > 0) continue;
      const d = Math.hypot(rv.mon.x - me.x, rv.mon.y - me.y);
      if (d < bd) { bd = d; best = rv; }
    }
    if (!best) return;
    const b = this.b, tr = b.trainers[1], m = best.mon;
    tr.team = [m]; tr.active = m; tr.name = SPECIES[best.sp].name.toUpperCase(); tr.baseTactic = best.tactic; tr.tactic = best.tactic; tr.focus = FOCUS.start; tr.order = null;
    m.side = 1; m.state = 'ready'; m.t = 0; m.since = 0; m.vx = 0; m.vy = 0; m.invuln = 0.4; m.fought = true; m.think = 0.25; m.man = null;
    m.face = me.x >= m.x ? 1 : -1;
    b.extras = b.extras.filter((x) => x !== m); this.engaged = best; best.aggro = 0;
    b.shake = Math.max(b.shake, 2); b.events.push({ type: 'cmd' });
    this.msg('KAMPF GEGEN ' + SPECIES[best.sp].name.toUpperCase() + ' LV' + best.lvl + '!');
  }

  /** Spieler flieht: der Rivale bleibt mit seinen KP auf der Karte (und jagt dich vielleicht weiter). */
  disengage(e: Rival) {
    const b = this.b, tr = b.trainers[1];
    tr.team = []; tr.active = null; this.engaged = null; e.cd = 3; e.aggro = 7; e.mon.state = 'ready'; e.mon.vx = 0; e.mon.vy = 0;
    b.extras.push(e.mon);
    this.msg('ENTKOMMEN – ' + SPECIES[e.sp].name.toUpperCase() + ' BLEIBT ZURÜCK.');
  }

  defeatEngaged(e: Rival) {
    const b = this.b, tr = b.trainers[1];
    tr.team = []; tr.active = null; this.engaged = null; this.kills++; this.eliminate(e, 'KAMPF', true);
    const me = this.me; if (me.alive) { const h = Math.round(me.maxHp * 0.08), bf = me.hp; me.hp = Math.min(me.maxHp, me.hp + h); if (me.hp > bf) b.text(me.x, me.y, '+' + (me.hp - bf), '#60f080', 1, true, me.sp.height + 8); }
    if (this.rng.chance(0.4) && b.pickups.length < ITEM_CAP + 2) this.spawnItem(this.rng.chance(0.6) ? 'heal' : undefined, e.mon.x, e.mon.y);
    this.msg('KILL! NOCH ' + this.alive + ' ÜBRIG.');
  }

  eliminate(rv: Rival, why: string, byPlayer = false) {
    if (!rv.alive) return;
    rv.alive = false; rv.place = this.alive + 1;
    this.b.extras = this.b.extras.filter((m) => m !== rv.mon);
    if (this.engaged === rv) { this.b.trainers[1].team = []; this.b.trainers[1].active = null; this.engaged = null; }
    if (rv.sim) { rv.sim = null; }
    if (!byPlayer && why === 'STURM') this.msg('EIN MONSTER IM STURM GEFALLEN · NOCH ' + this.alive);
    if (this.alive === 0 && this.me.alive) { this.place = 1; this.b.winner = 0; }
  }

  moveRivals(dt: number) {
    const b = this.b, me = this.me, big = this.map.big!;
    for (const rv of this.rivals) {
      if (!rv.alive || rv.sim || this.engaged === rv) continue;
      const m = rv.mon; rv.cd -= dt; rv.aggro = Math.max(0, rv.aggro - dt);
      const dm = Math.hypot(m.x - me.x, m.y - me.y);
      if (rv.aggro <= 0 && dm < 240 && m.hpFrac > 0.45 && me.alive && this.rng.chance(dt * 0.25)) rv.aggro = 8;
      let gx: number, gy: number;
      const out = Math.hypot(m.x - this.zone.x, m.y - this.zone.y) > this.zone.r - 20;
      if (out) { gx = this.zone.x; gy = this.zone.y; rv.goal = null; }
      else if (rv.aggro > 0 && me.alive) { gx = me.x; gy = me.y; if (dm > 360) rv.aggro = 0; }
      else {
        if (!rv.goal || Math.hypot(rv.goal.x - m.x, rv.goal.y - m.y) < 14) { const a = this.rng.range(0, 6.28), r = Math.sqrt(this.rng.next()) * Math.max(60, this.zone.r - 60); rv.goal = { x: clamp(this.zone.x + Math.cos(a) * r, big.x0 + 30, big.x1 - 30), y: clamp(this.zone.y + Math.sin(a) * r, big.y0 + 30, big.y1 - 30) }; }
        gx = rv.goal.x; gy = rv.goal.y;
      }
      const dx = gx - m.x, dy = gy - m.y, d = Math.hypot(dx, dy) || 1;
      const hold = this.engaged && rv.aggro > 0 && dm < 120;   // wartet, bis der Platz im Kampf frei ist
      const spd = m.baseSpeed * (out ? 0.8 : rv.aggro > 0 ? 0.72 : 0.42);
      m.moving = !hold && d > 6;
      if (m.moving) {
        const ox = m.x, oy = m.y;
        m.x += (dx / d) * spd * dt; m.y += (dy / d) * spd * dt;
        this.collide(m);
        m.look = Math.atan2(dy, dx); m.face = dx >= 0 ? 1 : -1; m.walkT += dt;
        rv.stuck = Math.hypot(m.x - ox, m.y - oy) < spd * dt * 0.35 ? rv.stuck + dt : 0;
        if (rv.stuck > 1.1) { rv.goal = null; rv.stuck = 0; if (rv.aggro > 0) rv.aggro = Math.min(rv.aggro, 1.5); }
      }
      m.t += dt;
    }
  }

  /** Rivalen laufen nicht durch Bäume, Felsen und Wasser (außer Wassertypen). */
  collide(m: Mon) {
    const big = this.map.big!, b = this.b;
    for (const f of this.map.features) {
      const dx = m.x - f.x, dy = m.y - f.y; if (Math.abs(dx) > f.r + 40 || Math.abs(dy) > f.r + 40) continue;
      if (b.canEnter(m, f)) continue;
      const d = Math.hypot(dx, dy) || 0.01, min = f.r + m.sp.radius * 0.45 + 2;
      if (d < min) { m.x = f.x + (dx / d) * min; m.y = f.y + (dy / d) * min; }
    }
    m.x = clamp(m.x, big.x0, big.x1); m.y = clamp(m.y, big.y0, big.y1);
  }

  /** Rivale gegen Rivale: unsichtbare Schnellsimulation mit denselben Kampfwerten; nach dem Ende scheidet einer aus. */
  runSims(dt: number) {
    if (this.sims.length < 2) {
      outer: for (let i = 0; i < this.rivals.length; i++) for (let j = i + 1; j < this.rivals.length; j++) {
        const a = this.rivals[i], c = this.rivals[j];
        if (!a.alive || !c.alive || a.sim || c.sim || this.engaged === a || this.engaged === c || a.cd > 0 || c.cd > 0) continue;
        if (Math.hypot(a.mon.x - c.mon.x, a.mon.y - c.mon.y) < SIM_R) { this.startSim(a, c); break outer; }
      }
    }
    for (const s of [...this.sims]) {
      const a = this.rivals.find((r) => r.sim === s)!, c = s.other;
      if (!a || !a.alive || !c.alive) { this.sims = this.sims.filter((x) => x !== s); a && (a.sim = null); c.sim = null; continue; }
      if (Math.random() < dt * 3) this.clash(a, c);
      s.acc += dt * 30 * 2.2;   // etwa doppelt so schnell wie echte Zeit: ein Rivalen-Kampf dauert so ca. 20–40 s
      withArena(() => { while (s.acc >= 1 && s.bt.winner === null && s.steps < 30 * 240) { s.bt.update(1 / 30); s.bt.events.length = 0; s.steps++; s.acc--; } });
      if (s.bt.winner !== null || s.steps >= 30 * 240) {
        const wa = s.bt.winner === 0 ? a : c, lo = wa === a ? c : a, wm = (wa === a ? s.ta : s.tb).team[0];
        this.sims = this.sims.filter((x) => x !== s); a.sim = null; c.sim = null;
        wa.mon.hp = Math.max(Math.round(wa.mon.maxHp * 0.06), Math.round((wm.hp / wm.maxHp) * wa.mon.maxHp)); wa.cd = 4;
        lo.mon.hp = 0; this.eliminate(lo, 'KAMPF');
        if (this.alive > 0) this.msg('NOCH ' + this.alive + ' ÜBRIG.');
      }
    }
  }
  startSim(a: Rival, c: Rival) {
    const mk = (r: Rival, side: 0 | 1) => { const mon = new Mon(r.sp, r.lvl, r.mon.nature, { moves: L.enemyMoves(r.sp, r.lvl), hpMul: sizeHpMul(1) * this.len, hpFrac: Math.max(0.05, r.mon.hpFrac) }); return new Trainer(side, 'x', [mon], true); };
    const ta = mk(a, 0), tb = mk(c, 1);
    const bt = withArena(() => { const x = new Battle(ta, tb, this.rng.int(1, 1e9), 'none', 'meadow'); x.worldOn = false; return x; });
    const s: Sim = { other: c, bt, ta, tb, steps: 0, acc: 0 }; a.sim = s; c.sim = s; this.sims.push(s);
    a.mon.look = Math.atan2(c.mon.y - a.mon.y, c.mon.x - a.mon.x); c.mon.look = a.mon.look + Math.PI; a.mon.moving = false; c.mon.moving = false;
  }
  clash(a: Rival, c: Rival) {
    const b = this.b, x = (a.mon.x + c.mon.x) / 2, y = (a.mon.y + c.mon.y) / 2;
    for (let i = 0; i < 5; i++) b.parts.push({ x: x + this.rng.range(-8, 8), y: y + this.rng.range(-4, 4), vx: this.rng.range(-40, 40), vy: this.rng.range(-20, 20), life: 0.45, max: 0.45, color: i % 2 ? '#ffe060' : '#ffffff', size: 2, grav: 0, z: this.rng.range(6, 22), vz: 30, gz: 0 });
    a.mon.flash = 0.08; c.mon.flash = 0.08;
  }

  updateHud() {
    const st = this.t < STORM_WAIT ? 'STURM IN ' + Math.ceil(STORM_WAIT - this.t) + ' S' : this.zone.r > STORM_R1 + 1 ? 'STURM ENGT EIN' : 'LETZTER KREIS';
    this.b.hudInfo = ['ÜBRIG ' + (this.alive + 1) + '/' + (PLAYERS + 1) + '  KILLS ' + this.kills, st];
  }

  /** Platzierung des Spielers (1 = Sieger). */
  placeNow() { return this.b.winner === 0 ? 1 : this.alive + 1; }
}

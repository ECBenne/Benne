import { Rng, clamp, TAU, angleDiff } from '../core/util';
import { Mon, Trainer } from './mon';
import { MoveDef } from '../data/moves';
import { typeEffectiveness } from '../data/types';
import { NATURES } from '../data/species';
import { thinkReady, trainerAI } from './ai';

/** Spielfeld (Füße-Koordinaten) – wird vom Renderer passend zum Gerät gesetzt. */
export const ARENA = { x0: 15, y0: 66, x1: 165, y1: 214 };
export function setArena(w: number, h: number) {
  ARENA.x0 = 24; ARENA.x1 = w - 24;
  ARENA.y1 = h - 36;
  ARENA.y0 = Math.max(70, ARENA.y1 - 250);
}
export function spawnPos(side: 0 | 1): [number, number] {
  const cx = (ARENA.x0 + ARENA.x1) / 2, h = ARENA.y1 - ARENA.y0;
  return [cx, side === 0 ? ARENA.y0 + h * 0.78 : ARENA.y0 + h * 0.22];
}

export interface Projectile { id: number; x: number; y: number; vx: number; vy: number; r: number; life: number; owner: Mon; move: MoveDef; age: number }
export interface Zone { id: number; x: number; y: number; r: number; t: number; delay: number; owner: Mon; move: MoveDef; done: boolean; fade: number }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; grav: number; z: number }
export interface FloatText { x: number; y: number; text: string; color: string; life: number; max: number; vy: number; big?: boolean }
export interface Slash { x: number; y: number; ang: number; t: number; r: number; color: string }
export interface Bolt { x: number; y: number; t: number; seed: number }
export interface Ghost { x: number; y: number; face: number; t: number; mon: Mon }

export type BattleEvent =
  | { type: 'shoot'; move: MoveDef }
  | { type: 'hit'; mon: Mon; dmg: number; eff: number; move: MoveDef }
  | { type: 'thunder' } | { type: 'flame' } | { type: 'slash' } | { type: 'dash' }
  | { type: 'faint'; mon: Mon } | { type: 'switch' } | { type: 'dodge' } | { type: 'heal' }
  | { type: 'status'; id: string } | { type: 'cmd' };


export class Battle {
  rng: Rng;
  t = 0;
  trainers: [Trainer, Trainer];
  projs: Projectile[] = [];
  zones: Zone[] = [];
  parts: Particle[] = [];
  texts: FloatText[] = [];
  slashes: Slash[] = [];
  bolts: Bolt[] = [];
  ghosts: Ghost[] = [];
  events: BattleEvent[] = [];
  shake = 0; hitstop = 0; flashScreen = 0;
  winner: 0 | 1 | null = null;
  overT = 0;
  choosing = false; choosingT = 0;
  private idc = 1;
  stats = { dmg: [0, 0], hits: [0, 0], dodges: [0, 0] };

  constructor(a: Trainer, b: Trainer, seed = 1) {
    this.rng = new Rng(seed);
    this.trainers = [a, b];
    for (const tr of this.trainers) {
      const first = tr.team.find((m) => m.alive)!;
      tr.active = first;
      first.state = 'summon'; first.t = 0; first.invuln = 0.5; first.fought = true;
      [first.x, first.y] = spawnPos(tr.side);
      first.face = tr.side === 0 ? 1 : -1;
      tr.lastX = first.x; tr.lastY = first.y;
    }
  }

  enemyOf(m: Mon): Mon | null { return this.trainers[1 - m.side].active; }
  trainerOf(m: Mon) { return this.trainers[m.side]; }
  nid() { return this.idc++; }

  // ───────────── Hauptschleife ─────────────
  update(rawDt: number) {
    if (this.hitstop > 0) { this.hitstop -= rawDt; this.updateFx(rawDt * 0.2); return; }
    let dt = rawDt;
    const player = this.trainers[0];
    this.choosing = !player.auto && !player.active && player.aliveCount > 0 && !this.winner;
    if (this.choosing) {
      this.choosingT += rawDt; dt *= 0.1;
      if (this.choosingT > 6) this.requestSwitch(player, player.team.findIndex((m) => m.alive), true);
    } else this.choosingT = 0;

    this.t += dt;
    for (const tr of this.trainers) {
      tr.switchCd = Math.max(0, tr.switchCd - dt);
      tr.cmdCd = Math.max(0, tr.cmdCd - dt);
      tr.itemCd = Math.max(0, tr.itemCd - dt);
      if (tr.auto || tr.side === 1) trainerAI(this, tr, dt);
      if (tr.pending !== null) this.processPending(tr);
    }
    for (const tr of this.trainers) for (const m of tr.team) if (m.onField) this.updateMon(m, dt);
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.updateFx(dt);
    this.checkEnd(dt);
  }

  private checkEnd(dt: number) {
    if (this.winner !== null) { this.overT += dt; return; }
    for (const tr of this.trainers) {
      if (tr.aliveCount === 0 && !(tr.active && tr.active.state === 'faint' && tr.active.t < 1.1)) {
        this.winner = (1 - tr.side) as 0 | 1;
      }
    }
  }

  // ───────────── Mon-Zustandsautomat ─────────────
  private updateMon(m: Mon, dt: number) {
    const tr = this.trainerOf(m);
    m.t += dt;
    m.flash = Math.max(0, m.flash - dt);
    m.invuln = Math.max(0, m.invuln - dt);
    m.dodgeCd = Math.max(0, m.dodgeCd - dt);
    m.forced = Math.max(0, m.forced - dt);
    m.retreatT = Math.max(0, m.retreatT - dt);
    m.lagHp += (m.hp - m.lagHp) * Math.min(1, dt * 2.5);
    if (m.lagHp < m.hp) m.lagHp = m.hp;
    // Knockback
    m.x += m.kx * dt; m.y += m.ky * dt;
    const kd = Math.exp(-9 * dt); m.kx *= kd; m.ky *= kd;
    this.updateStatus(m, dt);
    const cdRate = m.para > 0 ? 0.7 : 1;
    for (const k in m.cd) m.cd[k] = Math.max(0, m.cd[k] - dt * cdRate);
    m.moving = false;

    switch (m.state) {
      case 'ready': {
        thinkReady(this, m, dt);
        break;
      }
      case 'windup': {
        m.vx *= 0.8; m.vy *= 0.8; m.x += m.vx * dt; m.y += m.vy * dt;
        m.face = Math.cos(m.aim) >= 0 ? 1 : -1;
        if (m.t >= m.move!.windup) this.fireMove(m);
        break;
      }
      case 'active': this.updateActive(m, dt); break;
      case 'recover': {
        m.vx *= 0.85; m.vy *= 0.85; m.x += m.vx * dt; m.y += m.vy * dt;
        if (m.t >= m.move!.recover) { m.state = 'ready'; m.t = 0; m.move = null; }
        break;
      }
      case 'dodge': {
        m.x += m.dashDx * dt; m.y += m.dashDy * dt;
        m.moving = true;
        if (Math.floor(m.t * 60) % 2 === 0) this.ghosts.push({ x: m.x, y: m.y, face: m.face, t: 0, mon: m });
        if (m.t >= 0.2) { m.state = 'ready'; m.t = 0; }
        break;
      }
      case 'stagger': {
        if (m.t >= 0.28) { m.state = 'ready'; m.t = 0; }
        break;
      }
      case 'faint': {
        if (m.t > 1.25) {
          m.state = 'benched';
          if (tr.active === m) { tr.lastX = m.x; tr.lastY = m.y; tr.active = null; tr.chooseT = 0; }
        }
        break;
      }
      case 'recall': {
        if (m.t >= 0.35) { /* wird in processPending beendet */ }
        break;
      }
      case 'summon': {
        if (m.t >= 0.4) { m.state = 'ready'; m.t = 0; }
        break;
      }
    }
    // in der Arena halten
    m.x = clamp(m.x, ARENA.x0, ARENA.x1);
    m.y = clamp(m.y, ARENA.y0, ARENA.y1);
    m.walkT += dt * (m.moving ? 1 : 0);
  }

  private updateStatus(m: Mon, dt: number) {
    if (m.burn > 0) {
      m.burn -= dt; m.burnT += dt;
      if (Math.random() < dt * 14) this.spawnPart(m.x + (Math.random() - 0.5) * 8, m.y - 18, '#f8a030', 1, 14, 0.4, 1.5, -20);
      if (m.burnT >= 1) { m.burnT -= 1; this.damageDirect(m, Math.max(1, Math.round(m.maxHp * 0.022)), '#f08030'); }
    }
    if (m.para > 0) {
      m.para -= dt;
      if (Math.random() < dt * 10) this.spawnPart(m.x + (Math.random() - 0.5) * 12, m.y - 6 - Math.random() * 10, '#f8e848', 1, 10, 0.2, 1, 0);
    }
  }

  private damageDirect(m: Mon, dmg: number, color: string) {
    if (!m.alive || m.state === 'faint') return;
    m.hp = Math.max(0, m.hp - dmg);
    this.text(m.x, m.y - m.sp.height, String(dmg), color, 0.7);
    if (m.hp <= 0) this.faint(m);
  }

  // ───────────── Attacken ─────────────
  startMove(m: Mon, mv: MoveDef, aim: number, target?: { x: number; y: number }) {
    m.state = 'windup'; m.t = 0; m.move = mv; m.aim = aim; m.hitDone = false; m.moveSerial = this.nid();
    m.cd[mv.id] = mv.cooldown;
    m.face = Math.cos(aim) >= 0 ? 1 : -1;
    if (mv.kind === 'aoe') {
      const tx = clamp(target?.x ?? m.x + Math.cos(aim) * 60, ARENA.x0, ARENA.x1);
      const ty = clamp(target?.y ?? m.y + Math.sin(aim) * 60, ARENA.y0, ARENA.y1);
      this.zones.push({ id: this.nid(), x: tx, y: ty, r: mv.radius!, t: 0, delay: mv.windup, owner: m, move: mv, done: false, fade: 0 });
    }
    if (mv.kind === 'cone' || mv.kind === 'dash') m.forced = 0;
  }

  private fireMove(m: Mon) {
    const mv = m.move!;
    const e = this.enemyOf(m);
    switch (mv.kind) {
      case 'projectile': {
        const sp = mv.speed!;
        this.projs.push({
          id: this.nid(), x: m.x + Math.cos(m.aim) * 10, y: m.y + Math.sin(m.aim) * 5,
          vx: Math.cos(m.aim) * sp, vy: Math.sin(m.aim) * sp, r: mv.radius!, life: 1.8, owner: m, move: mv, age: 0,
        });
        this.events.push({ type: 'shoot', move: mv });
        m.vx -= Math.cos(m.aim) * 20; m.vy -= Math.sin(m.aim) * 20;
        this.endMove(m);
        break;
      }
      case 'melee': {
        this.slashes.push({ x: m.x + Math.cos(m.aim) * 14, y: m.y - 14 + Math.sin(m.aim) * 8, ang: m.aim, t: 0, r: mv.radius!, color: '#ffffff' });
        this.events.push({ type: 'slash' });
        if (e && e.targetable) {
          const dx = e.x - m.x, dy = e.y - m.y, d = Math.hypot(dx, dy) - e.sp.radius;
          if (d < mv.radius! && Math.abs(angleDiff(m.aim, Math.atan2(dy, dx))) < mv.arc! + 0.35) this.hit(m, e, mv, 1);
        }
        m.vx = Math.cos(m.aim) * 90; m.vy = Math.sin(m.aim) * 90;
        this.endMove(m);
        break;
      }
      case 'dash': {
        const dist = Math.min(mv.range, e ? Math.hypot(e.x - m.x, e.y - m.y) + 12 : mv.range);
        m.state = 'active'; m.t = 0; m.hitDone = false;
        m.dashLeft = dist; m.dashDx = Math.cos(m.aim); m.dashDy = Math.sin(m.aim);
        this.events.push({ type: 'dash' });
        break;
      }
      case 'aoe': {
        const z = this.zones.find((zz) => zz.owner === m && !zz.done && zz.move === mv);
        if (z) this.strikeZone(z);
        this.endMove(m);
        break;
      }
      case 'cone': {
        m.state = 'active'; m.t = 0; m.tickT = 0; m.hitDone = false;
        this.events.push({ type: 'flame' });
        break;
      }
    }
  }

  private endMove(m: Mon) {
    m.state = 'recover'; m.t = 0;
    const N = NATURES[m.nature];
    m.retreatT = N.hitAndRun * (0.7 + this.rng.next() * 0.6);
  }

  private updateActive(m: Mon, dt: number) {
    const mv = m.move!;
    const e = this.enemyOf(m);
    if (mv.kind === 'dash') {
      const step = mv.speed! * dt;
      m.x += m.dashDx * step; m.y += m.dashDy * step; m.dashLeft -= step; m.moving = true;
      m.face = m.dashDx >= 0 ? 1 : -1;
      if (Math.floor(m.t * 90) % 2 === 0) this.ghosts.push({ x: m.x, y: m.y, face: m.face, t: 0, mon: m });
      if (e && e.targetable && !m.hitDone && Math.hypot(e.x - m.x, e.y - m.y) < e.sp.radius + m.sp.radius + 3) {
        m.hitDone = true; this.hit(m, e, mv, 1);
        m.vx = -m.dashDx * 70; m.vy = -m.dashDy * 70; this.endMove(m); return;
      }
      if (m.dashLeft <= 0) { m.vx = m.dashDx * 40; m.vy = m.dashDy * 40; this.endMove(m); }
    } else if (mv.kind === 'cone') {
      m.vx *= 0.9; m.vy *= 0.9;
      if (e) {
        const want = Math.atan2(e.y - m.y, e.x - m.x);
        m.aim += clamp(angleDiff(m.aim, want), -1.3 * dt, 1.3 * dt);
      }
      m.face = Math.cos(m.aim) >= 0 ? 1 : -1;
      // Flammen-Partikel
      for (let i = 0; i < 3; i++) {
        const a = m.aim + (Math.random() - 0.5) * mv.arc! * 1.6;
        const sp = 70 + Math.random() * 60;
        this.parts.push({
          x: m.x + Math.cos(m.aim) * 10, y: m.y - 12 + Math.sin(m.aim) * 5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.9,
          life: 0.42, max: 0.42, color: (mv.type === 'water' ? ['#ffffff', '#a8d0f8', '#6890f0', '#4870d0'] : ['#f8e8a0', '#f8c030', '#f07820', '#d83818'])[i % 4], size: 2 + (Math.random() * 2) | 0, grav: -10, z: 8,
        });
      }
      m.tickT += dt;
      if (m.tickT >= 0.2) {
        m.tickT -= 0.2;
        if (e && e.targetable) {
          const dx = e.x - m.x, dy = e.y - m.y, d = Math.hypot(dx, dy) - e.sp.radius * 0.5;
          if (d < mv.range && Math.abs(angleDiff(m.aim, Math.atan2(dy, dx))) < mv.arc! + 0.12) this.hit(m, e, mv, 0.2, { noStagger: true });
        }
      }
      if (m.t >= mv.duration!) this.endMove(m);
    }
  }

  private strikeZone(z: Zone) {
    z.done = true; z.fade = 0.5;
    this.bolts.push({ x: z.x, y: z.y, t: 0, seed: this.rng.next() * 1000 });
    this.events.push({ type: 'thunder' });
    this.shake = Math.max(this.shake, 3); this.flashScreen = 0.12;
    for (let i = 0; i < 18; i++) this.spawnPart(z.x, z.y, i % 2 ? '#f8e848' : '#ffffff', 1, 120, 0.5, 2, 0);
    const e = this.enemyOf(z.owner);
    if (e && e.targetable && Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.sp.radius * 0.6) this.hit(z.owner, e, z.move, 1);
  }

  private updateProjectiles(dt: number) {
    for (const p of this.projs) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.age += dt;
      if (p.move.type === 'fire' && Math.random() < 0.6) this.spawnPart(p.x, p.y, Math.random() < 0.5 ? '#f8c030' : '#f07820', 1, 14, 0.3, 2, -10, 10);
      if (p.move.type === 'electric' && Math.random() < 0.5) this.spawnPart(p.x, p.y, '#f8f080', 1, 30, 0.2, 1, 0, 10);
      const e = this.enemyOf(p.owner);
      if (e && e.targetable && Math.hypot(e.x - p.x, e.y - 6 - p.y) < p.r + e.sp.radius) {
        this.hit(p.owner, e, p.move, 1, { dirX: p.vx, dirY: p.vy });
        p.life = 0;
        for (let i = 0; i < 8; i++) this.spawnPart(p.x, p.y, p.move.type === 'fire' ? '#f8c030' : p.move.type === 'water' ? '#8cc0ff' : '#f8f080', 1, 70, 0.3, 2, 0, 10);
      }
      if (p.x < ARENA.x0 - 14 || p.x > ARENA.x1 + 14 || p.y < ARENA.y0 - 14 || p.y > ARENA.y1 + 14) p.life = 0;
    }
    this.projs = this.projs.filter((p) => p.life > 0);
  }

  private updateZones(dt: number) {
    for (const z of this.zones) {
      if (!z.done) {
        z.t += dt;
        if (z.owner.state !== 'windup' || z.owner.move !== z.move) { z.done = true; z.fade = 0.15; } // abgebrochen
      } else z.fade -= dt;
    }
    this.zones = this.zones.filter((z) => !z.done || z.fade > 0);
  }

  // ───────────── Schaden ─────────────
  calc(att: Mon, def: Mon, mv: MoveDef) {
    const A = mv.physical ? att.atk : att.spa, D = mv.physical ? def.def : def.spd;
    const base = ((2 * att.level) / 5 + 2) * mv.power * A / D / 50 + 2;
    const stab = att.sp.types.includes(mv.type) ? 1.5 : 1;
    const eff = typeEffectiveness(mv.type, def.sp.types);
    const crit = this.rng.next() < 1 / 14 ? 1.5 : 1;
    const rand = 0.88 + this.rng.next() * 0.12;
    // Echtzeit: Typ-Vor-/Nachteile abgemildert (1.5x / 0.67x), sonst entscheidet das Matchup allein
    const effDmg = eff > 1 ? 1.5 : eff < 1 ? 0.67 : 1;
    return { dmg: base * stab * effDmg * rand * crit, eff, crit: crit > 1 };
  }

  hit(att: Mon, def: Mon, mv: MoveDef, scale: number, o: { dirX?: number; dirY?: number; noStagger?: boolean } = {}) {
    const r = this.calc(att, def, mv);
    const dmg = Math.max(1, Math.round(r.dmg * scale));
    def.hp = Math.max(0, def.hp - dmg);
    def.flash = 0.14;
    this.stats.dmg[att.side] += dmg; this.stats.hits[att.side]++;
    const big = scale >= 1;
    const col = r.eff > 1 ? '#ff6050' : r.eff < 1 ? '#a0a0a0' : '#ffffff';
    this.text(def.x + (Math.random() - 0.5) * 8, def.y - def.sp.height - 4, String(dmg) + (r.crit ? '!' : ''), col, big ? 0.8 : 0.5, big);
    if (big && r.eff > 1) this.text(def.x, def.y - def.sp.height - 14, 'SEHR EFFEKTIV', '#ff8070', 0.9);
    if (big && r.eff < 1) this.text(def.x, def.y - def.sp.height - 14, 'NICHT SEHR EFF.', '#b0b0b0', 0.9);
    this.events.push({ type: 'hit', mon: def, dmg, eff: r.eff, move: mv });
    if (big) {
      this.hitstop = Math.max(this.hitstop, r.eff > 1 || r.crit ? 0.07 : 0.04);
      this.shake = Math.max(this.shake, r.eff > 1 ? 3 : 1.5);
      let dx = o.dirX ?? def.x - att.x, dy = o.dirY ?? def.y - att.y;
      const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      const kb = def.hp <= 0 ? 160 : 60;
      def.kx += dx * kb; def.ky += dy * kb * 0.8;
      for (let i = 0; i < 6; i++) this.spawnPart(def.x, def.y - 18, mv.type === "fire" ? "#f8c030" : mv.type === "electric" ? '#f8f080' : mv.type === 'water' ? '#8cc0ff' : '#ffffff', 1, 80, 0.3, 2, 0, 8);
    }
    // Status
    if (mv.status && def.alive && this.rng.next() < mv.status.chance * Math.min(1, scale * 1.2)) {
      if (mv.status.id === 'burn' && def.burn <= 0 && !def.sp.types.includes('fire')) { def.burn = 6; def.burnT = 0; this.text(def.x, def.y - def.sp.height - 22, 'VERBRANNT', '#f08030', 0.9); this.events.push({ type: 'status', id: 'burn' }); }
      if (mv.status.id === 'para' && def.para <= 0 && !def.sp.types.includes('electric')) { def.para = 6; this.text(def.x, def.y - def.sp.height - 22, 'PARALYSIERT', '#f8d030', 0.9); this.events.push({ type: 'status', id: 'para' }); }
    }
    // Unterbrechen
    if (def.hp > 0 && !o.noStagger && big) {
      if ((def.state === 'windup' && !def.move!.armor) || def.state === 'recover') {
        def.state = 'stagger'; def.t = 0; def.move = null;
      } else if (def.state === 'ready') { def.state = 'stagger'; def.t = 0; }
    }
    if (def.hp <= 0) this.faint(def);
  }

  private faint(m: Mon) {
    m.hp = 0; m.state = 'faint'; m.t = 0; m.move = null;
    this.projs = this.projs.filter((p) => p.owner !== m);
    for (const z of this.zones) if (z.owner === m) { z.done = true; z.fade = 0; }
    this.events.push({ type: 'faint', mon: m });
    this.shake = Math.max(this.shake, 4);
  }

  // ───────────── Trainer-Aktionen (Manager) ─────────────
  canSwitchTo(tr: Trainer, idx: number) {
    const m = tr.team[idx];
    if (!m || !m.alive || m === tr.active || tr.pending !== null) return false;
    if (tr.active && tr.active.alive && tr.switchCd > 0) return false;
    if (tr.active && !['ready', 'recover', 'stagger', 'windup', 'active', 'dodge'].includes(tr.active.state) && tr.active.alive) return false;
    return true;
  }

  requestSwitch(tr: Trainer, idx: number, force = false) {
    if (idx < 0) return false;
    if (!force && !this.canSwitchTo(tr, idx)) return false;
    const cur = tr.active;
    if (cur && cur.alive) {
      cur.state = 'recall'; cur.t = 0; cur.invuln = 1; cur.move = null;
      this.projs = this.projs.filter((p) => p.owner !== cur);
      for (const z of this.zones) if (z.owner === cur) { z.done = true; z.fade = 0; }
      tr.pending = idx;
    } else {
      tr.pending = idx; // direkt nach K.O.
    }
    return true;
  }

  private processPending(tr: Trainer) {
    const cur = tr.active;
    if (cur && cur.alive && cur.state === 'recall' && cur.t < 0.35) return;
    const idx = tr.pending!; tr.pending = null;
    const nm = tr.team[idx];
    if (!nm || !nm.alive) { if (cur && cur.state === 'recall') { cur.state = 'ready'; } return; }
    let x = tr.lastX, y = tr.lastY;
    if (cur && cur.alive) {
      x = cur.x; y = cur.y; cur.state = 'benched';
      for (let i = 0; i < 10; i++) this.spawnPart(x, y - 10, '#ff6060', 1, 60, 0.4, 2, 0, 10);
    }
    tr.active = nm; nm.x = x; nm.y = y; nm.vx = nm.vy = nm.kx = nm.ky = 0;
    nm.state = 'summon'; nm.t = 0; nm.invuln = 0.45; nm.move = null; nm.fought = true;
    nm.face = tr.side === 0 ? 1 : -1;
    for (const k in nm.cd) nm.cd[k] = Math.max(nm.cd[k], 0.6);
    const sp = nm.special; if (sp) nm.cd[sp.id] = Math.max(nm.cd[sp.id], 3);
    tr.lastX = x; tr.lastY = y;
    tr.switchCd = 5;
    this.events.push({ type: 'switch' });
    for (let i = 0; i < 12; i++) this.spawnPart(x, y - 10, '#ffffff', 1, 70, 0.45, 2, 0, 10);
  }

  setTactic(tr: Trainer, t: Trainer['tactic']) { tr.tactic = t; }

  /** Befehl: aktives Pokémon soll seinen Spezialangriff einsetzen. */
  commandSpecial(tr: Trainer) {
    const m = tr.active;
    if (!m || !m.alive || tr.cmdCd > 0) return false;
    const sp = m.special; if (!sp || m.cd[sp.id] > 0.05) return false;
    m.forced = 4; tr.cmdCd = 8;
    this.events.push({ type: 'cmd' });
    this.text(m.x, m.y - m.sp.height - 10, 'SPEZIAL!', '#ffe060', 0.9);
    return true;
  }

  /** kind 'potion': 45 % KP, 'super': volle KP + Status heilen */
  usePotion(tr: Trainer, kind: 'potion' | 'super' = 'potion') {
    const m = tr.active;
    const have = kind === 'super' ? tr.supers : tr.potions;
    if (!m || !m.alive || have <= 0 || tr.itemCd > 0 || (m.hp >= m.maxHp && !(kind === 'super' && (m.burn > 0 || m.para > 0)))) return false;
    if (kind === 'super') tr.supers--; else tr.potions--;
    tr.itemCd = 2;
    const heal = kind === 'super' ? m.maxHp : Math.round(m.maxHp * 0.45);
    const before = m.hp;
    m.hp = Math.min(m.maxHp, m.hp + heal);
    if (kind === 'super') { m.burn = 0; m.para = 0; }
    this.text(m.x, m.y - m.sp.height, '+' + (m.hp - before), '#60f080', 1, true);
    this.events.push({ type: 'heal' });
    for (let i = 0; i < 12; i++) this.spawnPart(m.x + (Math.random() - 0.5) * 16, m.y - 4, '#80ff90', 1, 30, 0.7, 2, -40, 4);
    return true;
  }

  // ───────────── Effekte ─────────────
  spawnPart(x: number, y: number, color: string, n: number, speed: number, life: number, size: number, grav: number, z = 0) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = Math.random() * speed;
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, life, max: life, color, size, grav, z });
    }
  }
  text(x: number, y: number, text: string, color: string, life: number, big = false) {
    this.texts.push({ x, y, text, color, life, max: life, vy: -22, big });
  }
  private updateFx(dt: number) {
    for (const p of this.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt; p.vx *= 0.96; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const tx of this.texts) { tx.life -= dt; tx.y += tx.vy * dt; tx.vy *= 0.92; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const s of this.slashes) s.t += dt;
    this.slashes = this.slashes.filter((s) => s.t < 0.22);
    for (const b of this.bolts) b.t += dt;
    this.bolts = this.bolts.filter((b) => b.t < 0.35);
    for (const g of this.ghosts) g.t += dt;
    this.ghosts = this.ghosts.filter((g) => g.t < 0.18);
    this.shake = Math.max(0, this.shake - dt * 14);
    this.flashScreen = Math.max(0, this.flashScreen - dt);
  }
}

import { Rng, clamp, TAU, angleDiff } from '../core/util';
import { Mon, Trainer, FOCUS } from './mon';
import { ARENA_MODS, ArenaMod } from '../data/league';
import { MAPS, MapDef, Feature, TERRAIN_BONUS, GRASS_REGEN } from '../data/maps';
import { MoveDef } from '../data/moves';
import { typeEffectiveness } from '../data/types';
import { NATURES } from '../data/species';
import { thinkReady, trainerAI, manualDodge } from './ai';

/** Spielfeld (Füße-Koordinaten in der Bodenebene). */
const LVL_DMG = 0.055;
/** Finale: ab dieser Kampfzeit (s) steigt der Schaden stetig – kein Kampf zieht sich endlos. */
export const FINALE_AT = 90;
export const ARENA = { x0: 44, y0: 140, x1: 296, y1: 500 };
export function spawnPos(side: 0 | 1): [number, number] {
  const cx = (ARENA.x0 + ARENA.x1) / 2, h = ARENA.y1 - ARENA.y0;
  return [cx, side === 0 ? ARENA.y0 + h * 0.78 : ARENA.y0 + h * 0.22];
}

export interface Projectile { id: number; x: number; y: number; vx: number; vy: number; r: number; life: number; owner: Mon; move: MoveDef; age: number; scale: number; trail: { x: number; y: number }[] }
export interface Zone { id: number; x: number; y: number; r: number; t: number; delay: number; owner: Mon; move: MoveDef; done: boolean; fade: number }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; grav: number; z: number; vz?: number; gz?: number; grow?: number }
export interface FloatText { x: number; y: number; z: number; rise: number; text: string; color: string; life: number; max: number; vy: number; big?: boolean }
export interface Slash { x: number; y: number; z: number; ang: number; t: number; r: number; color: string }
export interface Bolt { x: number; y: number; t: number; seed: number }
export type ImpactKind = 'star' | 'ring' | 'claw' | 'scorch' | 'groundring';
export interface Impact { x: number; y: number; z: number; t: number; max: number; kind: ImpactKind; c1: string; c2: string; ang: number; big: boolean; r: number }
export interface Ghost { x: number; y: number; face: number; t: number; mon: Mon }

export type BattleEvent =
  | { type: 'shoot'; move: MoveDef }
  | { type: 'hit'; mon: Mon; dmg: number; eff: number; move: MoveDef }
  | { type: 'thunder' } | { type: 'blast' } | { type: 'flame' } | { type: 'slash' } | { type: 'dash' }
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
  impacts: Impact[] = [];
  shotQueue: { at: number; m: Mon; mv: MoveDef; ang: number }[] = [];
  events: BattleEvent[] = [];
  shake = 0; hitstop = 0; flashScreen = 0;
  winner: 0 | 1 | null = null;
  mod: ArenaMod;
  map: MapDef;
  rocks: Feature[];
  slowmo = 0;               // K.O.-Zeitlupe
  finale = false;
  overT = 0;
  choosing = false; choosingT = 0;
  private idc = 1;
  stats = { dmg: [0, 0], hits: [0, 0], dodges: [0, 0] };

  constructor(a: Trainer, b: Trainer, seed = 1, modId = 'none', mapId = 'meadow') {
    this.rng = new Rng(seed);
    this.map = MAPS[mapId] ?? MAPS.meadow; this.rocks = this.map.features.filter((f) => f.kind === 'rock');
    this.mod = ARENA_MODS[modId] ?? ARENA_MODS.none;
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
    if (this.slowmo > 0) { this.slowmo -= rawDt; dt *= 0.3; }
    const player = this.trainers[0];
    this.choosing = !player.auto && !player.active && player.aliveCount > 0 && !this.winner;
    if (this.choosing) {
      this.choosingT += rawDt; dt *= 0.1;
      if (this.choosingT > 6) this.requestSwitch(player, player.team.findIndex((m) => m.alive), true);
    } else this.choosingT = 0;

    if (this.t < FINALE_AT && this.t + dt >= FINALE_AT && this.winner === null) { this.finale = true; this.events.push({ type: 'cmd' }); this.flashScreen = 0.1; }
    this.t += dt;
    for (const tr of this.trainers) {
      tr.switchCd = Math.max(0, tr.switchCd - dt);
      tr.cmdCd = Math.max(0, tr.cmdCd - dt);
      tr.itemCd = Math.max(0, tr.itemCd - dt);
      tr.focus = Math.min(FOCUS.max, tr.focus + FOCUS.regen * tr.focusRegenMul * (1 + (tr.active?.amulet?.focusRegen ?? 0)) * dt);
      if (tr.auto || tr.side === 1) trainerAI(this, tr, dt);
      if (tr.pending !== null) this.processPending(tr);
    }
    for (const tr of this.trainers) for (const m of tr.team) if (m.onField) this.updateMon(m, dt);
    this.processShots();
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
    m.buffT = Math.max(0, m.buffT - dt);
    if (m.shieldT > 0) { m.shieldT -= dt; if (m.shieldT <= 0) m.shield = 0; }
    if (m.boss && !m.rage && m.alive && m.hp < m.maxHp * 0.5 && m.state !== 'faint') {   // Boss-Wut: schneller und angriffslustiger
      m.rage = true; m.baseSpeed *= 1.15; m.flash = 0.5; this.shake = Math.max(this.shake, 3);
      this.text(m.x, m.y, 'WUT!', '#ff5060', 1.2, true, m.sp.height + 12); this.events.push({ type: 'status', id: 'rage' });
    }
    m.lagHp += (m.hp - m.lagHp) * Math.min(1, dt * 2.5);
    if (m.lagHp < m.hp) m.lagHp = m.hp;
    // Knockback
    m.x += m.kx * dt; m.y += m.ky * dt;
    const kd = Math.exp(-9 * dt); m.kx *= kd; m.ky *= kd;
    this.updateStatus(m, dt);
    const cdRate = (m.para > 0 ? 0.7 : 1) * (m.rage ? 1.3 : 1);
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
        this.charge(m, dt);
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
    this.updateLook(m);
    this.resolveTerrain(m, dt);
    // in der Arena halten
    m.x = clamp(m.x, ARENA.x0, ARENA.x1);
    m.y = clamp(m.y, ARENA.y0, ARENA.y1);
    m.walkT += dt * (m.moving ? 1 : 0);
  }

  // ───────────── Gelände ─────────────
  /** Darf das Monster dieses Gelände betreten? */
  canEnter(m: Mon, f: Feature) { return f.kind === 'grass' || (f.kind === 'water' && m.sp.types.includes('water')) || (f.kind === 'lava' && m.sp.types.includes('fire')); }
  /** Ist die Sichtlinie durch einen Felsen versperrt? */
  losBlocked(ax: number, ay: number, bx: number, by: number) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    for (const f of this.rocks) {
      const t = Math.max(0, Math.min(1, ((f.x - ax) * dx + (f.y - ay) * dy) / l2));
      if (Math.hypot(ax + dx * t - f.x, ay + dy * t - f.y) < f.r - 2) return true;
    }
    return false;
  }
  private resolveTerrain(m: Mon, dt: number) {
    m.terrain = null; m.own = false;
    for (const f of this.map.features) {
      const dx = m.x - f.x, dy = m.y - f.y, d = Math.hypot(dx, dy) || 0.01;
      if (this.canEnter(m, f)) {
        if (d < f.r - 3) { m.terrain = f.kind as 'water' | 'lava' | 'grass'; m.own = (f.kind === 'water' && m.sp.types.includes('water')) || (f.kind === 'lava' && m.sp.types.includes('fire')) || (f.kind === 'grass' && m.sp.types.includes('grass')); }
        continue;
      }
      const min = f.r + m.sp.radius * 0.45;
      if (d < min) {   // herausschieben; Sturmangriffe prallen ab
        m.x = f.x + (dx / d) * min; m.y = f.y + (dy / d) * min;
        if (m.state === 'active' && m.move?.kind === 'dash') { m.dashLeft = 0; this.dust(m.x, m.y, 5); }
        m.kx *= 0.3; m.ky *= 0.3;
      }
    }
    if (m.own && m.terrain === 'grass' && m.alive && m.hp < m.maxHp && m.state !== 'faint') {   // Pflanze regeneriert im hohen Gras
      m.regenAcc += m.maxHp * GRASS_REGEN * dt;
      if (m.regenAcc >= 1) { const h = Math.floor(m.regenAcc); m.regenAcc -= h; m.hp = Math.min(m.maxHp, m.hp + h); if (Math.random() < 0.25) this.spawnPart(m.x, m.y, '#90e070', 1, 20, 0.5, 2, -30, 6); }
    }
  }

  private updateStatus(m: Mon, dt: number) {
    if (m.amulet?.regen && m.alive && m.hp < m.maxHp && m.state !== 'faint') { m.regenAcc += m.maxHp * m.amulet.regen * dt; if (m.regenAcc >= 1) { const h = Math.floor(m.regenAcc); m.regenAcc -= h; m.hp = Math.min(m.maxHp, m.hp + h); } }
    if (m.burn > 0) {
      m.burn -= dt; m.burnT += dt;
      if (Math.random() < dt * 14) this.spawnPart(m.x + (Math.random() - 0.5) * 8, m.y, '#f8a030', 1, 14, 0.4, 1.5, -20, 18);
      if (m.burnT >= 1) { m.burnT -= 1; this.damageDirect(m, Math.max(1, Math.round(m.maxHp * 0.022)), '#f08030'); }
    }
    if (m.para > 0) {
      m.para -= dt;
      if (Math.random() < dt * 10) this.spawnPart(m.x + (Math.random() - 0.5) * 12, m.y, '#f8e848', 1, 10, 0.2, 1, 0, 6 + Math.random() * 10);
    }
  }

  private damageDirect(m: Mon, dmg: number, color: string) {
    if (!m.alive || m.state === 'faint') return;
    m.hp = Math.max(0, m.hp - dmg);
    this.text(m.x, m.y, String(dmg), color, 0.7, false, m.sp.height);
    if (m.hp <= 0) this.faint(m);
  }

  // ───────────── Attacken ─────────────
  startMove(m: Mon, mv: MoveDef, aim: number, target?: { x: number; y: number }) {
    m.state = 'windup'; m.t = 0; m.move = mv; m.aim = aim; m.hitDone = false; m.moveSerial = this.nid();
    m.cd[mv.id] = mv.cooldown;
    if (m.forcedId === mv.id) { m.forcedId = null; m.forced = 0; }
    if (mv.cooldown >= 3) this.text(m.x, m.y, mv.name.toUpperCase(), this.typePalette(mv.type)[1], 0.9, false, m.sp.height + 6);
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
        const n = mv.shots ?? 1, sc = n > 1 ? (mv.shotScale ?? 1) : 1;
        if (mv.interval) {
          this.spawnProj(m, mv, m.aim, sc);
          for (let i = 1; i < n; i++) this.shotQueue.push({ at: this.t + i * mv.interval, m, mv, ang: m.aim });
        } else {
          for (let i = 0; i < n; i++) this.spawnProj(m, mv, m.aim + (n > 1 ? (i - (n - 1) / 2) * (mv.spread ?? 0.2) : 0), sc);
        }
        this.muzzle(m, mv);
        this.events.push({ type: 'shoot', move: mv });
        m.vx -= Math.cos(m.aim) * 24; m.vy -= Math.sin(m.aim) * 24;
        this.endMove(m);
        break;
      }
      case 'melee': {
        this.slashes.push({ x: m.x + Math.cos(m.aim) * 14, y: m.y + Math.sin(m.aim) * 8, z: 14, ang: m.aim, t: 0, r: mv.radius!, color: '#ffffff' });
        this.events.push({ type: 'slash' });
        if (e && e.targetable) {
          const dx = e.x - m.x, dy = e.y - m.y, d = Math.hypot(dx, dy) - e.sp.radius;
          if (d < mv.radius! && Math.abs(angleDiff(m.aim, Math.atan2(dy, dx))) < mv.arc! + 0.35) { this.hit(m, e, mv, 1); this.dust(e.x, e.y, 4); }
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
      case 'self': {
        const pal = this.typePalette(mv.type);
        if (mv.heal) { const before = m.hp; m.hp = Math.min(m.maxHp, m.hp + Math.round(m.maxHp * mv.heal)); this.text(m.x, m.y, '+' + (m.hp - before), '#60f080', 1, true, m.sp.height); this.events.push({ type: 'heal' }); }
        if (mv.buff) { m.buffT = Math.max(m.buffT, mv.buff); this.text(m.x, m.y, 'ANGRIFF +', '#ff9060', 0.9, false, m.sp.height + 10); this.events.push({ type: 'cmd' }); }
        for (let i = 0; i < 18; i++) { const a = Math.random() * 6.28; this.parts.push({ x: m.x + Math.cos(a) * 12, y: m.y + Math.sin(a) * 8, vx: 0, vy: 0, life: 0.7, max: 0.7, color: pal[i % 3], size: 2, grav: 0, z: 2, vz: 40 + Math.random() * 40, gz: 0 }); }
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
      this.parts.push({ x: m.x - m.dashDx * 6 + (Math.random() - 0.5) * 6, y: m.y - m.dashDy * 6 + (Math.random() - 0.5) * 4, vx: -m.dashDx * 20, vy: -m.dashDy * 20, life: 0.22, max: 0.22, color: mv.type === 'fire' ? (Math.random() < 0.5 ? '#f8c030' : '#f07820') : mv.type === 'water' ? (Math.random() < 0.5 ? '#a8d0f8' : '#6890f0') : mv.type === 'grass' ? (Math.random() < 0.5 ? '#90d048' : '#3f7f2a') : '#ffffff', size: mv.type === 'normal' ? 2 : 3, grav: 0, z: 6 + Math.random() * m.sp.height * 0.5 });
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
      // Strahl-Partikel (Flammen / Wasser)
      const water = mv.type === 'water';
      const grass = mv.type === 'grass';
      const pal = grass ? ['#ffffff', '#f8c8dc', '#b8e068', '#78b840', '#4a8a2c'] : water ? ['#ffffff', '#c8e4ff', '#8cc0ff', '#6890f0', '#4870d0'] : ['#fff6c0', '#f8e070', '#f8a030', '#f07820', '#d83818'];
      for (let i = 0; i < 9; i++) {
        const a = m.aim + (Math.random() - 0.5) * mv.arc! * (water ? 0.8 : 1.5);
        const sp = (water ? 150 : 110) + Math.random() * 90;
        const life = (water ? 0.42 : 0.5) * (0.65 + Math.random() * 0.45);
        this.parts.push({
          x: m.x + Math.cos(m.aim) * (m.sp.radius + 6), y: m.y + Math.sin(m.aim) * (m.sp.radius * 0.5 + 3), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.9,
          life, max: life, color: pal[(Math.random() * pal.length) | 0], size: 3 + ((Math.random() * 2) | 0), grow: water ? 2 : 5, grav: water ? 0 : -8, z: m.sp.height * 0.5 + Math.random() * 4, vz: water ? -6 : grass ? 8 : 10, gz: grass ? 60 : 0,
        });
      }
      m.tickT += dt;
      if (m.tickT >= 0.2) {
        m.tickT -= 0.2;
        if (e && e.targetable) {
          const dx = e.x - m.x, dy = e.y - m.y, d = Math.hypot(dx, dy) - e.sp.radius * 0.5;
          if (d < mv.range && Math.abs(angleDiff(m.aim, Math.atan2(dy, dx))) < mv.arc! + 0.12 && !this.losBlocked(m.x, m.y, e.x, e.y)) this.hit(m, e, mv, 0.2, { noStagger: true });
        }
      }
      if (m.t >= mv.duration!) this.endMove(m);
    }
  }

  private strikeZone(z: Zone) {
    z.done = true; z.fade = 0.5;
    const t = z.move.type, pal = this.typePalette(t), big = z.r > 28;
    if (t === 'electric') for (const dx of [0, -9, 9]) this.bolts.push({ x: z.x + dx, y: z.y, t: Math.abs(dx) / 200, seed: this.rng.next() * 1000 });
    this.impacts.push({ x: z.x, y: z.y, z: 0, t: 0, max: 1.4, kind: 'scorch', c1: t === 'water' ? '#3a5a8a' : t === 'grass' ? '#2f5a2a' : '#3a3020', c2: pal[1], ang: 0, big: true, r: z.r });
    this.impacts.push({ x: z.x, y: z.y, z: 0, t: 0, max: 0.4, kind: 'groundring', c1: pal[0], c2: pal[1], ang: 0, big: true, r: z.r * 1.7 });
    this.events.push({ type: t === 'electric' ? 'thunder' : 'blast' });
    this.shake = Math.max(this.shake, big ? 5 : 3.5); this.flashScreen = big ? 0.14 : 0.08;
    // Säule aus Partikeln in Typfarbe (Feuer steigt, Wasser spritzt hoch und fällt, Pflanze wirbelt)
    const n = big ? 70 : 44;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * z.r, sp = 20 + Math.random() * 50;
      this.parts.push({ x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, life: 0.5 + Math.random() * 0.4, max: 0.9, color: pal[i % 3], size: 2 + (i % 3), grow: t === 'fire' ? 3 : 1,
        grav: 0, z: 2, vz: (t === 'water' ? 150 : 90) + Math.random() * 90, gz: t === 'water' ? 380 : t === 'grass' ? 160 : 40 });
    }
    const e = this.enemyOf(z.owner);
    if (e && e.targetable && Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.sp.radius * 0.6) this.hit(z.owner, e, z.move, 1);
  }

  // ───────────── Effekte rund um Attacken ─────────────
  private spawnProj(m: Mon, mv: MoveDef, ang: number, scale: number) {
    const sp = mv.speed!;
    this.projs.push({
      id: this.nid(), x: m.x + Math.cos(ang) * (m.sp.radius + 4), y: m.y + Math.sin(ang) * (m.sp.radius * 0.5 + 2),
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: mv.radius!, life: 1.8, owner: m, move: mv, age: 0, scale, trail: [],
    });
  }
  private processShots() {
    for (const q of this.shotQueue) {
      if (this.t < q.at) continue;
      const mm = q.m; q.at = Infinity;
      if (mm.alive && mm.state !== 'faint' && mm.state !== 'benched' && mm.state !== 'recall') {
        const e = this.enemyOf(mm);
        const ang = e ? Math.atan2(e.y - mm.y, e.x - mm.x) * 0.5 + q.ang * 0.5 : q.ang; // Salve zielt leicht nach
        this.spawnProj(mm, q.mv, ang, q.mv.shotScale ?? 1);
        this.events.push({ type: 'shoot', move: q.mv });
        this.muzzle(mm, q.mv, 3);
      }
    }
    this.shotQueue = this.shotQueue.filter((q) => q.at !== Infinity);
  }
  private typePalette(t: string) {
    return t === 'grass' ? ['#f0ffd0', '#90d048', '#3f7f2a'] : t === 'fire' ? ['#fff6c0', '#f8a030', '#d83818'] : t === 'water' ? ['#ffffff', '#a8d0f8', '#6890f0'] : t === 'electric' ? ['#ffffff', '#f8f080', '#f8d030'] : ['#ffffff', '#e8e8e8', '#c8c8c8'];
  }
  /** Mündungsblitz am Maul */
  private muzzle(m: Mon, mv: MoveDef, n = 8) {
    const pal = this.typePalette(mv.type);
    for (let i = 0; i < n; i++) {
      const a = m.aim + (Math.random() - 0.5) * 1.2, sp = 40 + Math.random() * 70;
      this.parts.push({ x: m.x + Math.cos(m.aim) * (m.sp.radius + 4), y: m.y + Math.sin(m.aim) * (m.sp.radius * 0.5 + 2), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, life: 0.2, max: 0.2, color: pal[i % 3], size: 2, grav: 0, z: m.sp.height * 0.45 });
    }
  }
  /** Aufladen: Partikel strömen zum Monster (macht die Anspannung lesbar) */
  private charge(m: Mon, dt: number) {
    const mv = m.move!; if (Math.random() > dt * (mv.armor ? 70 : 38)) return;
    const pal = this.typePalette(mv.type), a = Math.random() * 6.28, r = m.sp.radius + 12 + Math.random() * 8;
    this.parts.push({ x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * r * 3.2, vy: -Math.sin(a) * r * 2.2, life: 0.26, max: 0.26, color: pal[(Math.random() * 3) | 0], size: 2, grav: 0, z: 6 + Math.random() * m.sp.height * 0.7 });
  }
  dust(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = 20 + Math.random() * 40; this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, life: 0.4, max: 0.4, color: i % 2 ? '#e0d4a8' : '#c8bc90', size: 3, grav: 0, z: 2, vz: 20 + Math.random() * 20, gz: 60 }); }
  }
  /** Treffer-Effekt je Typ: Stern + Ring + Typ-Partikel */
  private impact(def: Mon, mv: MoveDef, big: boolean, ang: number) {
    const pal = this.typePalette(mv.type), z = def.sp.height * 0.5;
    this.impacts.push({ x: def.x, y: def.y, z, t: 0, max: big ? 0.3 : 0.2, kind: mv.id === 'clawswipe' ? 'claw' : 'star', c1: pal[1], c2: pal[0], ang, big, r: big ? 14 : 9 });
    if (big) this.impacts.push({ x: def.x, y: def.y, z, t: 0, max: 0.32, kind: 'ring', c1: pal[2], c2: pal[0], ang, big, r: 24 });
    const n = big ? 14 : 6;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, sp = 40 + Math.random() * 90;
      const water = mv.type === 'water', fire = mv.type === 'fire', grass = mv.type === 'grass';
      this.parts.push({ x: def.x, y: def.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, life: 0.35 + Math.random() * 0.2, max: 0.5, color: pal[i % 3], size: 2 + (i % 2),
        grav: 0, z, vz: water ? 50 + Math.random() * 60 : fire ? 20 + Math.random() * 40 : grass ? 30 + Math.random() * 40 : (Math.random() - 0.3) * 60, gz: water ? 260 : fire ? -30 : grass ? 110 : 0 });
    }
  }

  private updateLook(m: Mon) {
    const e = this.enemyOf(m);
    let want = m.look;
    if (m.state === 'windup' || (m.state === 'active' && m.move?.kind === 'cone')) want = m.aim;
    else if (m.state === 'active' && m.move?.kind === 'dash') want = Math.atan2(m.dashDy, m.dashDx);
    else if (Math.hypot(m.vx, m.vy) > 22 && m.state === 'ready') want = Math.atan2(m.vy, m.vx);
    else if (m.state === 'recover' && m.move) want = m.aim;
    else if (e && e.state !== 'benched') want = Math.atan2(e.y - m.y, e.x - m.x);
    m.look = want;
  }

  private updateProjectiles(dt: number) {
    for (const p of this.projs) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.age += dt;
      p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 9) p.trail.shift();
      if (p.move.type === 'fire' && Math.random() < 0.7) this.parts.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 10, life: 0.35, max: 0.35, color: Math.random() < 0.5 ? '#f8c030' : '#d83818', size: 2, grav: 0, z: 14, vz: 16, gz: 0 });
      if (p.move.type === 'electric' && Math.random() < 0.6) this.parts.push({ x: p.x + (Math.random() - 0.5) * 8, y: p.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 20, life: 0.18, max: 0.18, color: '#f8f080', size: 1, grav: 0, z: 14 + (Math.random() - 0.5) * 10 });
      if (p.move.type === 'grass' && Math.random() < 0.6) this.parts.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 24, vy: (Math.random() - 0.5) * 12, life: 0.4, max: 0.4, color: Math.random() < 0.5 ? '#90d048' : '#3f7f2a', size: 2, grav: 0, z: p.owner.sp.height * 0.5, vz: 8, gz: 90 });
      if (p.move.type === 'water' && Math.random() < 0.5) this.parts.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 10, life: 0.3, max: 0.3, color: '#a8d0f8', size: 1, grav: 0, z: 14, vz: 10, gz: 120 });
      for (const f of this.rocks) if (Math.hypot(f.x - p.x, f.y - p.y) < f.r - 1) { p.life = 0; const pal = this.typePalette(p.move.type); for (let i = 0; i < 6; i++) this.spawnPart(p.x, p.y, pal[i % 3], 1, 60, 0.3, 2, 0, 12); this.events.push({ type: 'slash' }); break; }
      if (p.life <= 0) continue;
      const e = this.enemyOf(p.owner);
      if (e && e.targetable && Math.hypot(e.x - p.x, e.y - p.y) < p.r + e.sp.radius) {
        this.hit(p.owner, e, p.move, p.scale, { dirX: p.vx, dirY: p.vy });
        p.life = 0;
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
    // Level-Ausgleich: KP wachsen durch Entwicklung schneller als der Schaden – so bleibt die Kampfdauer über alle Level ähnlich
    const base = (((2 * att.level) / 5 + 2) * mv.power * A / D / 50 + 2) * (1 + Math.max(0, att.level - 10) * LVL_DMG);
    const stab = att.sp.types.includes(mv.type) ? 1.5 : 1;
    const eff = typeEffectiveness(mv.type, def.sp.types);
    const crit = this.rng.next() < 1 / 14 ? 1.5 : 1;
    const rand = 0.88 + this.rng.next() * 0.12;
    // Echtzeit: Typ-Vor-/Nachteile abgemildert (1.5x / 0.67x), sonst entscheidet das Matchup allein
    const effDmg = eff > 1 ? 1.1 : eff < 1 ? 0.93 : 1;
    // Wetter, Amulett, Anfeuern, Boss-Wut; Verteidiger: Amulett
    const mul = (1 + Math.max(0, (this.t - FINALE_AT) / 40)) * (att.own ? TERRAIN_BONUS : 1) * (att.hpFrac < 0.25 ? 1.1 : 1) * (this.mod.mul[mv.type] ?? 1) * (att.amulet?.dmgType === mv.type ? att.amulet.dmgMul ?? 1 : 1) * (att.buffT > 0 ? 1.25 : 1) * (att.rage ? 1.15 : 1) * (att.elixir ? 1.2 : 1) * (att.hpFrac < 0.5 ? att.amulet?.rage ?? 1 : 1) / (def.amulet?.takenMul ?? 1);
    return { dmg: base * stab * effDmg * rand * crit * mul, eff, crit: crit > 1 };
  }

  hit(att: Mon, def: Mon, mv: MoveDef, scale: number, o: { dirX?: number; dirY?: number; noStagger?: boolean } = {}) {
    const r = this.calc(att, def, mv);
    let dmg = Math.max(1, Math.round(r.dmg * scale));
    if (def.shield > 0) {   // Schild nimmt Schaden auf
      const ab = Math.min(def.shield, dmg); def.shield -= ab; dmg -= ab;
      this.text(def.x, def.y, 'SCHILD', '#8cdcff', 0.5, false, def.sp.height + 14);
      if (def.shield <= 0) { def.shieldT = 0; this.spawnPart(def.x, def.y, '#8cdcff', 10, 70, 0.4, 2, 0, def.sp.height * 0.5); }
    }
    def.hp = Math.max(0, def.hp - dmg);
    def.flash = 0.14;
    this.stats.dmg[att.side] += dmg; this.stats.hits[att.side]++;
    const big = scale >= 0.9, mid = scale >= 0.3;
    const col = r.eff > 1 ? '#ff6050' : r.eff < 1 ? '#a0a0a0' : '#ffffff';
    if (dmg > 0) this.text(def.x + (Math.random() - 0.5) * 8, def.y, String(dmg) + (r.crit ? '!' : ''), col, big ? 0.8 : 0.55, big, def.sp.height + 4);
    if (big && r.crit) this.text(def.x, def.y, 'VOLLTREFFER!', '#ffe060', 0.9, false, def.sp.height + 24);
    if (big && r.eff > 1) this.text(def.x, def.y, 'SEHR EFFEKTIV', '#ff8070', 0.9, false, def.sp.height + 14);
    if (big && r.eff < 1) this.text(def.x, def.y, 'NICHT SEHR EFF.', '#b0b0b0', 0.9, false, def.sp.height + 14);
    if (def.amulet?.reflect && dmg > 0 && att.alive && att.state !== 'faint') { const back = Math.max(1, Math.round(dmg * def.amulet.reflect)); att.hp = Math.max(1, att.hp - back); if (scale >= 0.9) this.text(att.x, att.y, String(back), '#9ad060', 0.6, false, att.sp.height + 2); }
    const drain = (mv.drain ?? 0) + (att.amulet?.drain ?? 0);
    if (drain > 0 && dmg > 0 && att.alive && att.state !== 'faint') {
      const heal = Math.max(1, Math.round(dmg * drain)); const before = att.hp;
      att.hp = Math.min(att.maxHp, att.hp + heal);
      if (att.hp > before && (scale >= 0.9 || this.rng.next() < 0.5)) this.text(att.x, att.y, '+' + (att.hp - before), '#60f080', 0.6, false, att.sp.height + 8);
    }
    this.events.push({ type: 'hit', mon: def, dmg, eff: r.eff, move: mv });
    const hitAng = Math.atan2(o.dirY ?? def.y - att.y, o.dirX ?? def.x - att.x);
    if (mid) this.impact(def, mv, big, hitAng);
    if (mid) {
      if (big) {
        this.hitstop = Math.max(this.hitstop, r.eff > 1 || r.crit ? 0.07 : 0.04);
        this.shake = Math.max(this.shake, r.eff > 1 ? 3 : 1.6);
      }
      let dx = o.dirX ?? def.x - att.x, dy = o.dirY ?? def.y - att.y;
      const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      const kb = (def.hp <= 0 ? 160 : 60) * (big ? 1 : 0.45);
      def.kx += dx * kb; def.ky += dy * kb * 0.8;
    }
    // Status
    if (mv.status && def.alive && this.rng.next() < mv.status.chance * Math.min(1, scale * 1.2)) {
      if (mv.status.id === 'burn' && def.burn <= 0 && !def.sp.types.includes('fire')) { def.burn = 6; def.burnT = 0; this.text(def.x, def.y, 'VERBRANNT', '#f08030', 0.9, false, def.sp.height + 22); this.events.push({ type: 'status', id: 'burn' }); }
      if (mv.status.id === 'para' && def.para <= 0 && !def.sp.types.includes('electric')) { def.para = 6; this.text(def.x, def.y, 'PARALYSIERT', '#f8d030', 0.9, false, def.sp.height + 22); this.events.push({ type: 'status', id: 'para' }); }
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
    this.slowmo = 0.7; this.flashScreen = Math.max(this.flashScreen, 0.1);
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
      x = cur.x; y = cur.y; cur.state = 'benched'; cur.elixir = false; cur.forcedId = null;
      for (let i = 0; i < 10; i++) this.spawnPart(x, y, '#ff6060', 1, 60, 0.4, 2, 0, 12);
    }
    tr.active = nm; nm.x = x; nm.y = y; nm.vx = nm.vy = nm.kx = nm.ky = 0;
    nm.state = 'summon'; nm.t = 0; nm.invuln = 0.45; nm.move = null; nm.fought = true;
    nm.face = tr.side === 0 ? 1 : -1;
    for (const k in nm.cd) nm.cd[k] = Math.max(nm.cd[k], 0.6);
    const sp = nm.special; if (sp) nm.cd[sp.id] = Math.max(nm.cd[sp.id], 3);
    tr.lastX = x; tr.lastY = y;
    tr.switchCd = nm.amulet?.quickSwap ? 2.5 : 5;
    this.events.push({ type: 'switch' });
    for (let i = 0; i < 12; i++) this.spawnPart(x, y, '#ffffff', 1, 70, 0.45, 2, 0, 12);
  }

  setTactic(tr: Trainer, t: Trainer['tactic']) { tr.tactic = t; }

  // ───────────── Manager-Befehle (kosten Fokus) ─────────────
  private spend(tr: Trainer, cost: number) {
    if (tr.focus < cost || tr.cmdCd > 0) return false;
    tr.focus -= cost; tr.cmdCd = 0.6; this.events.push({ type: 'cmd' }); return true;
  }
  /** Befiehlt eine bestimmte ausgerüstete Attacke (Spezial kostet mehr Fokus). */
  commandMove(tr: Trainer, id: string) {
    const m = tr.active;
    if (!m || !m.alive) return false;
    const mv = m.moves.find((x) => x.id === id); if (!mv || m.cd[mv.id] > 3) return false;   // fast bereit = vormerken
    if (!this.spend(tr, mv.special ? FOCUS.special : FOCUS.move)) return false;
    m.forced = 6; m.forcedId = mv.id;
    this.text(m.x, m.y, 'BEFEHL: ' + mv.name.toUpperCase(), '#ffe060', 0.8, false, m.sp.height + 14);
    return true;
  }
  /** Spezial! Das aktive Monster setzt seinen Spezialangriff ein, sobald er bereit ist. */
  commandSpecial(tr: Trainer) {
    const m = tr.active;
    if (!m || !m.alive) return false;
    const sp = m.special; if (!sp || m.cd[sp.id] > 0.05) return false;
    if (!this.spend(tr, FOCUS.special)) return false;
    m.forced = 4; m.forcedId = sp.id;
    this.text(m.x, m.y, 'SPEZIAL!', '#ffe060', 0.9, false, m.sp.height + 10);
    return true;
  }
  /** Schild: nimmt bis zu 30 % der max. KP an Schaden auf (4 s). */
  commandShield(tr: Trainer) {
    const m = tr.active;
    if (!m || !m.alive || m.shield > 0 || !this.spend(tr, FOCUS.shield)) return false;
    m.shield = Math.round(m.maxHp * 0.3); m.shieldT = 4;
    this.text(m.x, m.y, 'SCHILD!', '#8cdcff', 0.9, false, m.sp.height + 10);
    this.spawnPart(m.x, m.y, '#8cdcff', 14, 60, 0.5, 2, 0, m.sp.height * 0.5);
    return true;
  }
  /** Anfeuern: +25 % Schaden für 8 s. */
  commandBuff(tr: Trainer) {
    const m = tr.active;
    if (!m || !m.alive || m.buffT > 0 || !this.spend(tr, FOCUS.buff)) return false;
    m.buffT = 8;
    this.text(m.x, m.y, 'ANGRIFF +', '#ff9060', 0.9, false, m.sp.height + 10);
    this.spawnPart(m.x, m.y, '#ff9060', 14, 60, 0.5, 2, -20, m.sp.height * 0.4);
    return true;
  }
  /** Ausweichen! Das aktive Monster springt sofort aus der Gefahr. */
  commandDodge(tr: Trainer) {
    const m = tr.active;
    if (!m || !m.alive || tr.focus < FOCUS.dodge || tr.cmdCd > 0) return false;
    if (!manualDodge(this, m)) return false;
    tr.focus -= FOCUS.dodge; tr.cmdCd = 0.4; this.events.push({ type: 'cmd' });
    return true;
  }

  /** Items: 'potion' 45 % KP · 'super' volle KP + Status · 'focus' +50 Fokus · 'elixir' +20 % Schaden bis zum Auswechseln */
  usePotion(tr: Trainer, kind: 'potion' | 'super' | 'focus' | 'elixir' = 'potion') {
    const m = tr.active;
    if (!m || !m.alive || tr.itemCd > 0) return false;
    if (kind === 'focus') {
      if (tr.focusPots <= 0 || tr.focus > FOCUS.max - 10) return false;
      tr.focusPots--; tr.itemCd = 2; tr.focus = Math.min(FOCUS.max, tr.focus + 50);
      this.text(m.x, m.y, 'FOKUS +50', '#78e0f8', 1, false, m.sp.height + 8); this.events.push({ type: 'cmd' }); return true;
    }
    if (kind === 'elixir') {
      if (tr.elixirs <= 0 || m.elixir) return false;
      tr.elixirs--; tr.itemCd = 2; m.elixir = true;
      this.text(m.x, m.y, 'ELIXIER! ANGRIFF +20%', '#ff9060', 1.1, false, m.sp.height + 8); this.events.push({ type: 'cmd' });
      this.spawnPart(m.x, m.y, '#ff9060', 16, 60, 0.6, 2, -30, m.sp.height * 0.4); return true;
    }
    const have = kind === 'super' ? tr.supers : tr.potions;
    if (have <= 0 || (m.hp >= m.maxHp && !(kind === 'super' && (m.burn > 0 || m.para > 0)))) return false;
    if (kind === 'super') tr.supers--; else tr.potions--;
    tr.itemCd = 2;
    const heal = kind === 'super' ? m.maxHp : Math.round(m.maxHp * 0.45);
    const before = m.hp;
    m.hp = Math.min(m.maxHp, m.hp + heal);
    if (kind === 'super') { m.burn = 0; m.para = 0; }
    this.text(m.x, m.y, '+' + (m.hp - before), '#60f080', 1, true, m.sp.height);
    this.events.push({ type: 'heal' });
    for (let i = 0; i < 12; i++) this.spawnPart(m.x + (Math.random() - 0.5) * 16, m.y, '#80ff90', 1, 30, 0.7, 2, -40, 4);
    return true;
  }

  // ───────────── Effekte ─────────────
  spawnPart(x: number, y: number, color: string, n: number, speed: number, life: number, size: number, grav: number, z = 0) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = Math.random() * speed;
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, life, max: life, color, size, grav, z });
    }
  }
  text(x: number, y: number, text: string, color: string, life: number, big = false, z = 24) {
    this.texts.push({ x, y, z, rise: 0, text, color, life, max: life, vy: -22, big });
  }
  private updateFx(dt: number) {
    for (const p of this.parts) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt; p.vx *= 0.96;
      if (p.vz !== undefined) { p.z += p.vz * dt; p.vz -= (p.gz ?? 0) * dt; if (p.z < 0) { p.z = 0; p.vz = 0; } }
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const tx of this.texts) { tx.life -= dt; tx.rise -= tx.vy * dt; tx.vy *= 0.92; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const s of this.slashes) s.t += dt;
    this.slashes = this.slashes.filter((s) => s.t < 0.22);
    for (const b of this.bolts) b.t += dt;
    this.bolts = this.bolts.filter((b) => b.t < 0.35);
    for (const im of this.impacts) im.t += dt;
    this.impacts = this.impacts.filter((im) => im.t < im.max);
    for (const g of this.ghosts) g.t += dt;
    this.ghosts = this.ghosts.filter((g) => g.t < 0.18);
    this.shake = Math.max(0, this.shake - dt * 14);
    this.flashScreen = Math.max(0, this.flashScreen - dt);
  }
}

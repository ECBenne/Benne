import { Rng, clamp, TAU, angleDiff } from '../core/util';
import { Mon, Trainer, FOCUS } from './mon';
import { ARENA_MODS, ArenaMod } from '../data/league';
import { MAPS, MapDef, Feature, TERRAIN_BONUS, GRASS_REGEN } from '../data/maps';
import { MoveDef, StageStat, STAGE_NAMES, STAGE_MAX, stageMul } from '../data/moves';
import { typeEffectiveness, TYPE_FX, TypeId } from '../data/types';
import { NATURES } from '../data/species';
import { synergies, synDmg, synFocus, bondDmg } from '../data/synergy';
import { thinkReady, trainerAI, manualDodge } from './ai';

/** Spielfeld (Füße-Koordinaten in der Bodenebene). */
const LVL_DMG = 0.055;
/** Finale: ab dieser Kampfzeit (s) steigt der Schaden stetig – kein Kampf zieht sich endlos. */
export const FINALE_AT = 70;   // Standard; ein Kampf kann via lenMul länger sein
/** Kampftempo: Attacken kommen seltener (Abklingzeit ×PACE), treffen dafür härter (Schaden ×PACE) – gleiche Kampfdauer, weniger Schlag auf Schlag. */
export const PACE = 1.25;
export const ARENA = { x0: 44, y0: 140, x1: 356, y1: 576 };
export function spawnPos(side: 0 | 1): [number, number] {
  const cx = (ARENA.x0 + ARENA.x1) / 2, h = ARENA.y1 - ARENA.y0;
  return [cx, side === 0 ? ARENA.y0 + h * 0.78 : ARENA.y0 + h * 0.22];
}

export interface Projectile { homing?: number; evaded?: boolean; id: number; x: number; y: number; vx: number; vy: number; r: number; life: number; owner: Mon; move: MoveDef; age: number; scale: number; trail: { x: number; y: number }[] }
export interface Pickup { id: number; kind: 'heal' | 'power' | 'focus' | 'speed'; x: number; y: number; t: number; life: number }
export interface Hazard { id: number; x: number; y: number; r: number; t: number; delay: number; type: TypeId; done: boolean; fade: number }
export const PICKUP_INFO: Record<Pickup['kind'], { name: string; color: string }> = {
  heal: { name: 'HEILQUELLE', color: '#58e078' }, power: { name: 'KRAFTKRISTALL', color: '#ff6a50' }, focus: { name: 'FOKUSORB', color: '#58b8ff' }, speed: { name: 'TEMPOFEDER', color: '#ffe050' },
};
export interface Zone { id: number; x: number; y: number; r: number; t: number; delay: number; owner: Mon; move: MoveDef; done: boolean; fade: number }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; grav: number; z: number; vz?: number; gz?: number; grow?: number }
export interface FloatText { x: number; y: number; z: number; rise: number; text: string; color: string; life: number; max: number; vy: number; big?: boolean }
export interface Slash { x: number; y: number; z: number; ang: number; t: number; r: number; color: string }
export interface Bolt { x: number; y: number; t: number; seed: number }
export type ImpactKind = 'star' | 'ring' | 'claw' | 'scorch' | 'groundring' | 'pillar' | 'spikes' | 'shock' | 'vortex';
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
  stepNo = 0; hurtFlash = 0;
  pickups: Pickup[] = []; hazards: Hazard[] = [];
  worldOn = true;                       // Arena-Ereignisse (Kristalle, Unwetter); im Tutorial aus
  nextPickupAt = 7; nextHazardAt = 20;
  eventBanner: { text: string; t: number; color: string } | null = null;
  strikeQueue: { at: number; x: number; y: number; r: number; owner: Mon; mv: MoveDef; scale: number }[] = [];
  events: BattleEvent[] = [];
  shake = 0; hitstop = 0; flashScreen = 0;
  winner: 0 | 1 | null = null;
  mod: ArenaMod;
  map: MapDef;
  rocks: Feature[];
  slowmo = 0;               // K.O.-Zeitlupe
  finaleAt = FINALE_AT;
  finale = false;
  overT = 0;
  choosing = false; choosingT = 0;
  private idc = 1;
  stats = { dmg: [0, 0], hits: [0, 0], dodges: [0, 0], counters: [0, 0], blocked: [0, 0], parries: [0, 0], specials: [0, 0], pickups: [0, 0], hazardHits: [0, 0], perfects: [0, 0], interrupts: [0, 0], maxCombo: [0, 0] };

  constructor(a: Trainer, b: Trainer, seed = 1, modId = 'none', mapId = 'meadow', lenMul = 1) {
    this.finaleAt = Math.round(FINALE_AT * lenMul);
    this.rng = new Rng(seed);
    this.map = MAPS[mapId] ?? MAPS.meadow; this.rocks = this.map.features.filter((f) => f.kind === 'rock');
    this.mod = ARENA_MODS[modId] ?? ARENA_MODS.none;
    this.trainers = [a, b];
    for (const tr of this.trainers) {
      tr.syn = synergies(tr.team.map((m) => m.sp.types));
      tr.focusRegenMul *= synFocus(tr.syn);
      const first = tr.team.find((m) => m.alive)!;
      tr.active = first;
      first.state = 'summon'; first.since = 0; first.t = 0; first.invuln = 0.5; first.fought = true;
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

    if (this.t < this.finaleAt && this.t + dt >= this.finaleAt && this.winner === null) { this.finale = true; this.events.push({ type: 'cmd' }); this.flashScreen = 0.1; }
    this.t += dt;
    for (const tr of this.trainers) {
      tr.switchCd = Math.max(0, tr.switchCd - dt);
      tr.cmdCd = Math.max(0, tr.cmdCd - dt);
      tr.itemCd = Math.max(0, tr.itemCd - dt);
      tr.focus = Math.min(FOCUS.max, tr.focus + FOCUS.regen * tr.focusRegenMul * (1 + (tr.active?.amulet?.focusRegen ?? 0)) * (tr.active && tr.active.alive && tr.active.hpFrac < 0.3 ? 1.5 : 1) * dt);
      if (tr.auto || tr.side === 1) trainerAI(this, tr, dt);
      if (tr.pending !== null) this.processPending(tr);
    }
    // Reihenfolge wechselt jeden Schritt, damit keine Seite bei gleichzeitigen Ereignissen bevorzugt wird
    const order = this.stepNo++ % 2 === 0 ? this.trainers : [this.trainers[1], this.trainers[0]];
    for (const tr of order) for (const m of tr.team) if (m.onField) this.updateMon(m, dt);
    this.processShots();
    this.processStrikes();
    if (this.worldOn && this.winner === null) this.updateWorld(dt);
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.updateFx(dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    this.checkEnd(dt);
  }

  private checkEnd(dt: number) {
    if (this.winner !== null) { this.overT += dt; return; }
    const lost = this.trainers.filter((tr) => tr.aliveCount === 0 && !(tr.active && tr.active.state === 'faint' && tr.active.t < 1.1));
    if (lost.length === 1) this.winner = (1 - lost[0].side) as 0 | 1;
    else if (lost.length === 2) this.winner = (this.rng.next() < 0.5 ? 0 : 1);   // gleichzeitig: Münzwurf statt Seitenvorteil
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
    m.speedT = Math.max(0, m.speedT - dt);
    if (m.flow > 0) { m.flowT -= dt; if (m.flowT <= 0) { m.flow--; m.flowT = 5; } }
    m.counterT = Math.max(0, m.counterT - dt);
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
    // Wer sich aus dem Kampf zurückzieht und nicht getroffen wird, erholt sich langsam
    { const foe = this.enemyOf(m); const away = !!foe && foe.alive && Math.hypot(foe.x - m.x, foe.y - m.y) > 125 && this.t - m.lastHurt > 2.5 && m.alive && m.state !== 'faint' && m.state !== 'windup' && m.state !== 'active' && m.state !== 'summon';
      m.recovering = away && m.hp < m.maxHp;
      if (m.recovering) { m.recAcc += m.maxHp * 0.014 * dt; if (m.recAcc >= 1) { const hh = Math.floor(m.recAcc); m.recAcc -= hh; m.hp = Math.min(m.maxHp, m.hp + hh); if (Math.random() < 0.18) this.text(m.x, m.y, '+' + hh, '#60f080', 0.6, false, m.sp.height + 6); }
        if (Math.random() < dt * 8) this.parts.push({ x: m.x + (Math.random() - 0.5) * 12, y: m.y, vx: 0, vy: 0, life: 0.6, max: 0.6, color: '#78f090', size: 2, grav: 0, z: 4, vz: 20 + Math.random() * 14, gz: 0 }); } }
    const cdRate = (m.para > 0 ? 0.7 : 1) * (m.rage ? 1.3 : 1) * (1 + 0.06 * m.stage.spe) / PACE;
    for (const k in m.cd) m.cd[k] = Math.max(0, m.cd[k] - dt * cdRate);
    m.moving = false;

    switch (m.state) {
      case 'ready': {
        thinkReady(this, m, dt);
        break;
      }
      case 'windup': {
        if (m.move && !m.move.armor && m.move.kind !== 'dash' && m.move.kind !== 'cone' && this.enemyOf(m)?.targetable) { const f = m.face; thinkReady(this, m, dt, true, this.trainerOf(m).order ? 0.75 : 0.4); m.face = f; if (m.state !== 'windup') break; }
        else { m.vx *= 0.8; m.vy *= 0.8; m.x += m.vx * dt; m.y += m.vy * dt; }
        m.face = Math.cos(m.aim) >= 0 ? 1 : -1;
        this.charge(m, dt);
        if (m.t >= m.move!.windup) this.fireMove(m);
        break;
      }
      case 'active': this.updateActive(m, dt); break;
      case 'recover': {
        if (this.enemyOf(m)?.targetable && m.t > 0.04) { thinkReady(this, m, dt, true, this.trainerOf(m).order ? 1 : 0.9); if (m.state !== 'recover') break; }
        else { m.vx *= 0.85; m.vy *= 0.85; m.x += m.vx * dt; m.y += m.vy * dt; }
        if (m.t >= (m.move?.recover ?? 0) * (m.nature === 'hasty' ? 0.75 : 1)) { m.state = 'ready'; m.t = 0; m.move = null; }
        break;
      }
      case 'dodge': {
        m.x += m.dashDx * dt; m.y += m.dashDy * dt;
        m.moving = true;
        if (Math.floor(m.t * 60) % 2 === 0) this.ghosts.push({ x: m.x, y: m.y, face: m.face, t: 0, mon: m });
        if (m.t >= m.dodgeLen) {
          m.state = 'ready'; m.t = 0;
          const o = this.trainerOf(m).order;   // nach dem Ausweichen die neue Stelle halten, nicht zurück in die Gefahr laufen
          if (o && o.kind === 'hold') { o.x = clamp(m.x, ARENA.x0 + 6, ARENA.x1 - 6); o.y = clamp(m.y, ARENA.y0 + 6, ARENA.y1 - 6); o.until = Math.max(o.until, this.t + 12); }
          else if (o && o.kind === 'go') this.trainerOf(m).order = null;
        }
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

  /** Flow: gutes Spiel baut Stufen auf (mehr Schaden, weniger erlittener Schaden), sie klingen nach einigen Sekunden ab. */
  addFlow(m: Mon, n = 1) {
    const before = m.flow; m.flow = Math.min(4, m.flow + n); m.flowT = 8;
    if (m.flow > before) this.text(m.x, m.y, 'FLOW x' + m.flow, '#7af0ff', 0.9, false, m.sp.height + 44);
  }

  /** Ein Angriff ging ins Leere, weil das Ziel ausgewichen ist: Feedback, Konter-Fenster, Strafe für Nahkämpfer. */
  registerDodge(def: Mon, att: Mon, punish: boolean) {
    if (def.lastReg > this.t - 0.8) return;   // nicht mehrfach pro Ausweichen
    def.lastReg = this.t;
    const tc = this.trainerOf(def).tactic;
    def.counterT = tc === 'defend' || tc === 'counter' ? 5 : 3;
    const perfect = def.manualT >= 0 && this.t - def.manualT < 0.55;   // gezielt und im richtigen Moment ausgewichen
    if (perfect) {
      def.counterT = 6; def.cperf = true; this.addFlow(def); const dt = this.trainerOf(def); dt.focus = Math.min(FOCUS.max, dt.focus + 30); def.dodgeCd = 0; this.stats.perfects[def.side]++;
      this.text(def.x, def.y, 'PERFEKT!', '#ffe060', 1.1, true, def.sp.height + 26);
      this.slowmo = Math.max(this.slowmo, 0.22); this.shake = Math.max(this.shake, 3); this.flashScreen = Math.max(this.flashScreen, 0.07); this.hitstop = Math.max(this.hitstop, 0.05);
      this.impacts.push({ x: def.x, y: def.y, z: def.sp.height * 0.5, t: 0, max: 0.4, kind: 'ring', c1: '#ffe060', c2: '#ffffff', ang: 0, big: true, r: 34 });
      if (att.alive && att.state !== 'faint' && !att.move?.armor) { att.punishT = Math.max(att.punishT, 0.8); if (att.state === 'ready' || att.state === 'stagger') { att.state = 'stagger'; att.t = -0.4; att.move = null; } }
    }
    this.text(def.x, def.y, 'AUSGEWICHEN!', '#c8b0ff', 0.9, false, def.sp.height + 12);
    this.spawnPart(def.x, def.y, '#c8b0ff', 8, 70, 0.4, 2, 0, def.sp.height * 0.5);
    if (punish && att.alive && !att.move?.armor) { att.punishT = 0.55; this.text(att.x, att.y, 'VERPATZT!', '#b0b0b0', 0.8, false, att.sp.height + 6); }
  }

  /** Werte-Stufe ändern (Angriff, Verteidigung, Tempo): höchstens ±3, Wirkung siehe stageMul. */
  applyStage(m: Mon, stat: StageStat, n: number) {
    if (!m.alive || m.state === 'faint') return;
    const before = m.stage[stat]; m.stage[stat] = Math.max(-STAGE_MAX, Math.min(STAGE_MAX, before + n));
    const d = m.stage[stat] - before, up = n > 0;
    if (!d) { this.text(m.x, m.y, STAGE_NAMES[stat] + (up ? ' IST AM LIMIT' : ' GEHT NICHT TIEFER'), '#b0b0b0', 0.9, false, m.sp.height + 12); return; }
    this.text(m.x, m.y, STAGE_NAMES[stat] + ' ' + (up ? '▲' : '▼').repeat(Math.abs(d)), up ? '#70e890' : '#ff7080', 1.2, false, m.sp.height + 12);
    for (let i = 0; i < 12; i++) this.parts.push({ x: m.x + (Math.random() - 0.5) * 20, y: m.y + (Math.random() - 0.5) * 6, vx: 0, vy: 0, life: 0.7, max: 0.7, color: up ? '#70e890' : '#ff7080', size: 2, grav: 0, z: up ? 2 : m.sp.height, vz: up ? 55 : -55, gz: 0 });
    this.events.push({ type: 'status', id: up ? 'buff' : 'debuff' });
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
      if (m.burnT >= 1) { m.burnT -= 1; this.damageDirect(m, Math.max(1, Math.round(m.maxHp * 0.008)), '#f08030'); }
    }
    if (m.psn > 0) {
      m.psn -= dt; m.psnT += dt;
      if (Math.random() < dt * 9) this.parts.push({ x: m.x + (Math.random() - 0.5) * 10, y: m.y, vx: 0, vy: 0, life: 0.7, max: 0.7, color: Math.random() < 0.5 ? '#c060d0' : '#c8f060', size: 2, grav: 0, z: 10, vz: 22 + Math.random() * 14, gz: 0 });
      if (m.psnT >= 1) { m.psnT -= 1; this.damageDirect(m, Math.max(1, Math.round(m.maxHp * 0.009)), '#c060d0'); }
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
      this.zones.push({ id: this.nid(), x: mv.nova ? m.x : tx, y: mv.nova ? m.y : ty, r: mv.multi ? mv.radius! * 1.9 : mv.radius!, t: 0, delay: mv.windup, owner: m, move: mv, done: false, fade: 0 });
    }
    if (mv.kind === 'cone' || mv.kind === 'dash') m.forced = 0;
  }

  private fireMove(m: Mon) {
    const mv = m.move!;
    if (mv.special) { this.stats.specials[m.side]++; this.slowmo = Math.max(this.slowmo, 0.22); this.shake = Math.max(this.shake, 3.5); this.flashScreen = Math.max(this.flashScreen, 0.06); this.text(m.x, m.y, mv.name.toUpperCase() + '!', this.typePalette(mv.type)[1], 1.1, true, m.sp.height + 22); }
    const e = this.enemyOf(m);
    switch (mv.kind) {
      case 'projectile': {
        const n = mv.shots ?? 1, sc = n > 1 ? (mv.shotScale ?? 1) : 1;
        if (mv.ring) {
          for (let i = 0; i < n; i++) this.spawnProj(m, mv, m.aim + (i * TAU) / n, sc);
          this.ringBurst(m, mv);
        } else if (mv.interval) {
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
        const meleeMiss = !!e && e.alive && this.t - e.lastDodge < 0.9 && Math.hypot(e.x - m.x, e.y - m.y) - e.sp.radius < mv.radius! + 70;
        if (e && e.targetable) {
          const dx = e.x - m.x, dy = e.y - m.y, d = Math.hypot(dx, dy) - e.sp.radius;
          if (d < mv.radius! && Math.abs(angleDiff(m.aim, Math.atan2(dy, dx))) < mv.arc! + 0.35) { this.hit(m, e, mv, 1); this.dust(e.x, e.y, 4); }
          else if (meleeMiss) this.registerDodge(e, m, true);
        } else if (meleeMiss && e) this.registerDodge(e, m, true);
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
      case 'status': {   // Gegner schwächen, wenn er in Reichweite ist
        this.impacts.push({ x: m.x, y: m.y, z: 0, t: 0, max: 0.45, kind: 'groundring', c1: '#c070e0', c2: '#ffffff', ang: 0, big: true, r: mv.range });
        this.events.push({ type: 'status', id: 'debuff' });
        if (e && e.targetable && Math.hypot(e.x - m.x, e.y - m.y) <= mv.range + e.sp.radius) for (const fx of mv.stages ?? []) this.applyStage(e, fx.stat, fx.n);
        else this.text(m.x, m.y, 'ZU WEIT WEG', '#b0b0b0', 0.8, false, m.sp.height + 8);
        this.endMove(m);
        break;
      }
      case 'self': {
        const pal = this.typePalette(mv.type);
        for (const fx of mv.stages ?? []) this.applyStage(m, fx.stat, fx.n);
        if (mv.heal) { const before = m.hp; m.hp = Math.min(m.maxHp, m.hp + Math.round(m.maxHp * mv.heal)); this.text(m.x, m.y, '+' + (m.hp - before), '#60f080', 1, true, m.sp.height); this.events.push({ type: 'heal' }); }
        if (mv.shield) { m.shield = Math.max(m.shield, Math.round(m.maxHp * mv.shield)); m.shieldT = 5; this.text(m.x, m.y, 'SCHILD!', '#8cdcff', 0.9, false, m.sp.height + 10); this.events.push({ type: 'cmd' }); }
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
    if (m.punishT > 0) { m.t = -m.punishT; m.punishT = 0; }
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
      this.parts.push({ x: m.x - m.dashDx * 6 + (Math.random() - 0.5) * 6, y: m.y - m.dashDy * 6 + (Math.random() - 0.5) * 4, vx: -m.dashDx * 20, vy: -m.dashDy * 20, life: 0.22, max: 0.22, color: (TYPE_FX[mv.type as TypeId]?.pal ?? TYPE_FX.normal.pal)[Math.random() < 0.5 ? 1 : 2], size: mv.type === 'normal' ? 2 : 3, grav: 0, z: 6 + Math.random() * m.sp.height * 0.5 });
      if (e && e.targetable && !m.hitDone && Math.hypot(e.x - m.x, e.y - m.y) < e.sp.radius + m.sp.radius + 3) {
        m.hitDone = true; this.hit(m, e, mv, 1);
        m.vx = -m.dashDx * 70; m.vy = -m.dashDy * 70; this.endMove(m); return;
      }
      if (m.dashLeft <= 0 && !m.hitDone && e && e.alive && this.t - e.lastDodge < 1.0 && Math.hypot(e.x - m.x, e.y - m.y) < 70) { m.hitDone = true; this.registerDodge(e, m, true); }
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
      const fxp = TYPE_FX[mv.type as TypeId]?.pal ?? TYPE_FX.normal.pal;
      const pal = mv.type === 'wind' || mv.type === 'poison' || mv.type === 'metal' || mv.type === 'light' || mv.type === 'earth' || mv.type === 'sound' || mv.type === 'dark' || mv.type === 'crystal' ? [fxp[0], fxp[0], fxp[1], fxp[1], fxp[2]] : mv.type === 'ice' ? ['#ffffff', '#e0f8ff', '#a8e0f8', '#78c8e8', '#4898c0'] : mv.type === 'ghost' ? ['#f0e0ff', '#d0a8f0', '#a070d0', '#7048a8', '#503078'] : mv.type === 'rock' ? ['#f0e0c0', '#d8c090', '#b09060', '#8a6a40', '#6a5030'] : mv.type === 'electric' ? ['#ffffff', '#fff6a0', '#f8e848', '#f8d030', '#d8a818'] : grass ? ['#ffffff', '#f8c8dc', '#b8e068', '#78b840', '#4a8a2c'] : water ? ['#ffffff', '#c8e4ff', '#8cc0ff', '#6890f0', '#4870d0'] : ['#fff6c0', '#f8e070', '#f8a030', '#f07820', '#d83818'];
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

  /** Kranz-Salve: Druckring und Funken rund ums Monster */
  private ringBurst(m: Mon, mv: MoveDef) {
    const pal = this.typePalette(mv.type);
    this.impacts.push({ x: m.x, y: m.y, z: 0, t: 0, max: 0.4, kind: 'shock', c1: pal[1], c2: pal[0], ang: 0, big: true, r: 46 });
    for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU; this.parts.push({ x: m.x, y: m.y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 60, life: 0.3, max: 0.3, color: pal[i % 3], size: 2, grav: 0, z: m.sp.height * 0.4 }); }
    this.shake = Math.max(this.shake, 2.5); this.events.push({ type: 'blast' });
  }

  /** Nova: Druckwelle um das Monster */
  private strikeNova(z: Zone) {
    z.done = true; z.fade = 0.5;
    const t = z.move.type, pal = this.typePalette(t), m = z.owner;
    this.impacts.push({ x: m.x, y: m.y, z: 0, t: 0, max: 0.55, kind: 'shock', c1: pal[1], c2: pal[0], ang: 0, big: true, r: z.r * 1.15 });
    this.impacts.push({ x: m.x, y: m.y, z: 0, t: -0.1, max: 0.5, kind: 'shock', c1: pal[2], c2: pal[1], ang: 0, big: true, r: z.r * 1.15 });
    this.impacts.push({ x: m.x, y: m.y, z: 0, t: -0.2, max: 0.45, kind: 'shock', c1: pal[0], c2: pal[2], ang: 0, big: true, r: z.r * 0.9 });
    this.typeStrike(t, m.x, m.y, z.r * 0.8, true);
    for (let i = 0; i < 46; i++) { const a = (i / 46) * TAU, sp = 110 + (i % 3) * 40; this.parts.push({ x: m.x, y: m.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, life: 0.45, max: 0.45, color: pal[i % 3], size: 2 + (i % 2), grav: 0, z: 5, grow: 1 }); }
    this.shake = Math.max(this.shake, 6.5); this.flashScreen = Math.max(this.flashScreen, 0.14); this.hitstop = Math.max(this.hitstop, 0.05);
    this.events.push({ type: t === 'electric' ? 'thunder' : 'blast' });
    const e = this.enemyOf(m);
    if (e && e.targetable && Math.hypot(e.x - m.x, e.y - m.y) < z.r + e.sp.radius * 0.6) {
      const dx = e.x - m.x, dy = e.y - m.y, dl = Math.hypot(dx, dy) || 1;
      this.hit(m, e, z.move, 1);
      e.kx += (dx / dl) * 170; e.ky += (dy / dl) * 120;
    } else if (e && e.alive && this.t - e.lastDodge < 1.6 && Math.hypot(e.x - m.x, e.y - m.y) < z.r * 2) this.registerDodge(e, m, false);
  }

  /** Schauer: mehrere Einschläge nacheinander im Zielgebiet, der erste genau aufs Ziel */
  private strikeMulti(z: Zone) {
    z.done = true; z.fade = 0.35;
    const n = z.move.multi ?? 4, sub = z.move.radius!;
    for (let i = 0; i < n; i++) {
      const a = this.rng.next() * TAU, d = Math.sqrt(this.rng.next()) * (z.r - sub * 0.6);
      this.strikeQueue.push({ at: this.t + i * 0.16, x: i === 0 ? z.x : z.x + Math.cos(a) * d, y: i === 0 ? z.y : z.y + Math.sin(a) * d * 0.8, r: sub, owner: z.owner, mv: z.move, scale: 0.6 });
    }
  }
  // ───────────── Arena-Ereignisse: Kristalle zum Einsammeln und Unwetter ─────────────
  private freeSpot(margin: number): { x: number; y: number } {
    for (let i = 0; i < 20; i++) {
      const x = this.rng.range(ARENA.x0 + margin, ARENA.x1 - margin), y = this.rng.range(ARENA.y0 + margin + 10, ARENA.y1 - margin - 10);
      if (!this.rocks.some((f) => Math.hypot(f.x - x, f.y - y) < f.r + 22) && !this.pickups.some((p) => Math.hypot(p.x - x, p.y - y) < 60)) return { x, y };
    }
    return { x: (ARENA.x0 + ARENA.x1) / 2, y: (ARENA.y0 + ARENA.y1) / 2 };
  }
  private updateWorld(dt: number) {
    // Kristalle
    if (this.t >= this.nextPickupAt && this.pickups.length < 2) {
      const sp = this.freeSpot(34), r = this.rng.next() * 100;
      const kind: Pickup['kind'] = r < 34 ? 'heal' : r < 60 ? 'power' : r < 84 ? 'focus' : 'speed';
      this.pickups.push({ id: this.nid(), kind, x: sp.x, y: sp.y, t: 0, life: 15 });
      this.nextPickupAt = this.t + this.rng.range(9, 14);
      this.events.push({ type: 'cmd' });
    } else if (this.t >= this.nextPickupAt) this.nextPickupAt = this.t + 3;
    for (const p of this.pickups) {
      p.t += dt; p.life -= dt;
      for (const tr of this.trainers) {
        const m = tr.active; if (!m || !m.alive || !m.targetable && m.state !== 'dodge') continue;
        if (m.state === 'faint' || m.state === 'benched' || m.state === 'recall' || m.state === 'summon') continue;
        if (Math.hypot(m.x - p.x, m.y - p.y) < m.sp.radius + 11 && p.life > 0) { this.collect(tr, m, p); p.life = 0; }
      }
    }
    this.pickups = this.pickups.filter((p) => p.life > 0);
    // Unwetter
    if (this.t >= this.nextHazardAt) {
      const type = ({ volcano: 'fire', lake: 'water', jungle: 'grass', rocks: 'rock' } as Record<string, TypeId>)[this.map.id] ?? 'electric';
      const names: Record<string, string> = { fire: 'METEORREGEN!', water: 'FLUTWELLEN!', grass: 'DORNENFELD!', rock: 'STEINSCHLAG!', electric: 'GEWITTER!' };
      const n = 4 + (this.t > this.finaleAt ? 2 : 0) + (this.rng.chance(0.4) ? 1 : 0);
      for (let i = 0; i < n; i++) {
        // jeder zweite Einschlag zielt auf ein Monster, die anderen fallen in die Arena
        const tm = [this.trainers[0].active, this.trainers[1].active].filter((m): m is Mon => !!m && m.alive)[i % 2 === 0 ? 0 : 1];
        const sp = tm && i % 2 === 0 ? { x: tm.x + this.rng.range(-22, 22), y: tm.y + this.rng.range(-22, 22) } : this.freeSpot(24);
        this.hazards.push({ id: this.nid(), x: clamp(sp.x, ARENA.x0 + 10, ARENA.x1 - 10), y: clamp(sp.y, ARENA.y0 + 10, ARENA.y1 - 10), r: 27, t: -i * 0.45, delay: 1.35, type, done: false, fade: 0 });
      }
      this.eventBanner = { text: names[type], t: 2.2, color: '#ff8a50' }; this.events.push({ type: 'cmd' });
      this.nextHazardAt = this.t + this.rng.range(24, 34) * (this.t > this.finaleAt ? 0.7 : 1);
    }
    for (const h of this.hazards) {
      if (h.done) { h.fade -= dt; continue; }
      h.t += dt;
      if (h.t >= h.delay) this.strikeHazard(h);
    }
    this.hazards = this.hazards.filter((h) => !h.done || h.fade > 0);
    if (this.eventBanner) { this.eventBanner.t -= dt; if (this.eventBanner.t <= 0) this.eventBanner = null; }
  }
  private strikeHazard(h: Hazard) {
    h.done = true; h.fade = 0.5;
    const pal = this.typePalette(h.type);
    this.impacts.push({ x: h.x, y: h.y, z: 0, t: 0, max: 0.4, kind: 'groundring', c1: pal[0], c2: pal[1], ang: 0, big: true, r: h.r * 1.5 });
    this.typeStrike(h.type, h.x, h.y, h.r, true);
    this.shake = Math.max(this.shake, 3); this.events.push({ type: h.type === 'electric' ? 'thunder' : 'blast' });
    for (const tr of this.trainers) {
      const m = tr.active; if (!m || !m.alive || m.invuln > 0 || m.state === 'faint' || m.state === 'benched' || m.state === 'recall' || m.state === 'summon') continue;
      if (Math.hypot(m.x - h.x, m.y - h.y) < h.r + m.sp.radius * 0.5) {
        const dmg = Math.max(1, Math.round(m.maxHp * 0.07 * (typeEffectiveness(h.type, m.sp.types) > 1 ? 1.3 : typeEffectiveness(h.type, m.sp.types) < 1 ? 0.7 : 1)));
        this.damageDirect(m, dmg, '#ff9a50'); m.flash = 0.14; this.stats.hazardHits[m.side]++;
      }
    }
  }
  private collect(tr: Trainer, m: Mon, p: Pickup) {
    const info = PICKUP_INFO[p.kind];
    this.stats.pickups[m.side]++;
    if (p.kind === 'heal') { const h = Math.round(m.maxHp * 0.2), b = m.hp; m.hp = Math.min(m.maxHp, m.hp + h); this.text(m.x, m.y, '+' + (m.hp - b), '#60f080', 1, true, m.sp.height + 8); }
    else if (p.kind === 'power') { m.buffT = Math.max(m.buffT, 9); this.text(m.x, m.y, 'KRAFT!', '#ff8a60', 1, true, m.sp.height + 8); }
    else if (p.kind === 'focus') { tr.focus = Math.min(FOCUS.max, tr.focus + 30); this.text(m.x, m.y, 'FOKUS +30', '#70c8ff', 1, true, m.sp.height + 8); }
    else { m.speedT = 8; this.text(m.x, m.y, 'TEMPO!', '#ffe860', 1, true, m.sp.height + 8); }
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; this.parts.push({ x: m.x, y: m.y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 44, life: 0.4, max: 0.4, color: i % 2 ? info.color : '#ffffff', size: 2, grav: 0, z: m.sp.height * 0.4 }); }
    this.impacts.push({ x: m.x, y: m.y, z: 0, t: 0, max: 0.35, kind: 'groundring', c1: info.color, c2: '#ffffff', ang: 0, big: true, r: 30 });
    this.events.push({ type: 'heal' });
  }

  /** Für das Tutorial und Tests: Kristall/Unwetter gezielt erzeugen. */
  spawnPickup(kind: Pickup['kind'], x: number, y: number) { const p: Pickup = { id: this.nid(), kind, x, y, t: 0, life: 60 }; this.pickups.push(p); return p; }
  spawnHazard(x: number, y: number, type: TypeId, delay = 1.8) { const hz: Hazard = { id: this.nid(), x, y, r: 27, t: 0, delay, type, done: false, fade: 0 }; this.hazards.push(hz); return hz; }

  /** Tippen aufs Spielfeld: Stellung beziehen und halten (bei einem Kristall: nur hinlaufen). Das Monster kämpft von dort aus weiter. */
  orderMove(tr: Trainer, x: number, y: number) {
    const m = tr.active; if (!m || !m.alive) return false;
    const pk = this.pickups.find((p) => Math.hypot(p.x - x, p.y - y) < 30);
    tr.order = { kind: pk ? 'go' : 'hold', x: clamp(pk ? pk.x : x, ARENA.x0 + 6, ARENA.x1 - 6), y: clamp(pk ? pk.y : y, ARENA.y0 + 6, ARENA.y1 - 6), until: this.t + (pk ? 6 : 20) };
    this.events.push({ type: 'cmd' }); return true;
  }
  /** Tippen auf den Gegner: aggressiv angreifen, bis der Befehl ausläuft. */
  orderAttack(tr: Trainer) {
    const m = tr.active; if (!m || !m.alive) return false;
    tr.order = { kind: 'attack', x: m.x, y: m.y, until: this.t + 10 };
    this.events.push({ type: 'cmd' }); return true;
  }
  /** Tippen auf das eigene Monster: zurück zur Automatik. */
  clearOrder(tr: Trainer) { const had = !!tr.order; tr.order = null; if (had) this.events.push({ type: 'cmd' }); return had; }

  private processStrikes() {
    if (!this.strikeQueue.length) return;
    for (const q of this.strikeQueue) {
      if (this.t < q.at) continue; const s = q; q.at = Infinity;
      if (!s.owner.alive) continue;
      const pal = this.typePalette(s.mv.type);
      this.impacts.push({ x: s.x, y: s.y, z: 0, t: 0, max: 0.4, kind: 'groundring', c1: pal[0], c2: pal[1], ang: 0, big: true, r: s.r * 1.6 });
      this.typeStrike(s.mv.type, s.x, s.y, s.r, false);
      this.shake = Math.max(this.shake, 2.2); this.events.push({ type: s.mv.type === 'electric' ? 'thunder' : 'blast' });
      const e = this.enemyOf(s.owner);
      if (e && e.targetable && Math.hypot(e.x - s.x, e.y - s.y) < s.r + e.sp.radius * 0.6) this.hit(s.owner, e, s.mv, s.scale);
    }
    this.strikeQueue = this.strikeQueue.filter((q) => q.at !== Infinity);
  }

  /** Typ-Effekt eines Einschlags: Säule, Stacheln, Wirbel, Sog … je nach Element */
  private typeStrike(t: string, x: number, y: number, r: number, big: boolean) {
    const pal = this.typePalette(t), P = (n: number, f: (i: number) => Particle) => { for (let i = 0; i < n; i++) this.parts.push(f(i)); };
    const R = Math.random;
    switch (t) {
      case 'fire': this.impacts.push({ x, y, z: 0, t: 0, max: 0.6, kind: 'pillar', c1: '#f07820', c2: '#fff6c0', ang: 0, big, r }); break;
      case 'light': this.impacts.push({ x, y, z: 0, t: 0, max: 0.7, kind: 'pillar', c1: '#fff0a0', c2: '#ffffff', ang: 0, big: true, r: r * 0.9 }); this.flashScreen = Math.max(this.flashScreen, 0.1); break;
      case 'ghost': this.impacts.push({ x, y, z: 0, t: 0, max: 0.8, kind: 'pillar', c1: '#583888', c2: '#d0a8f0', ang: 0, big, r: r * 0.8 }); P(18, (i) => ({ x: x + (R() - 0.5) * r * 1.6, y: y + (R() - 0.5) * r, vx: (R() - 0.5) * 8, vy: 0, life: 0.9, max: 0.9, color: pal[i % 3], size: 2, grav: 0, z: 2, vz: 40 + R() * 50, gz: -10 })); break;
      case 'ice': case 'crystal': case 'earth': case 'rock': this.impacts.push({ x, y, z: 0, t: 0, max: 0.75, kind: 'spikes', c1: pal[1], c2: pal[0], ang: R() * 6, big, r }); this.impacts.push({ x, y, z: 0, t: 0, max: 0.75, kind: 'spikes', c1: pal[2], c2: pal[1], ang: R() * 6, big: false, r: r * 0.6 }); break;
      case 'grass': this.impacts.push({ x, y, z: 0, t: 0, max: 0.7, kind: 'spikes', c1: '#78b840', c2: '#e8ffb0', ang: R() * 6, big, r }); break;
      case 'dark': this.impacts.push({ x, y, z: 0, t: 0, max: 0.8, kind: 'vortex', c1: '#6a50a0', c2: '#201838', ang: 0, big: true, r }); P(24, (i) => { const a = R() * TAU, d = r * (0.8 + R() * 0.6); return { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.7, vx: -Math.cos(a) * d * 2.2, vy: -Math.sin(a) * d * 1.5, life: 0.45, max: 0.45, color: pal[i % 3], size: 2, grav: 0, z: 6 }; }); break;
      case 'wind': this.impacts.push({ x, y, z: 0, t: 0, max: 0.8, kind: 'vortex', c1: '#c8ffe8', c2: '#6cd0a8', ang: 1, big, r }); P(30, (i) => { const a = R() * TAU, d = R() * r; return { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.7, vx: -Math.sin(a) * 60, vy: Math.cos(a) * 40, life: 0.7, max: 0.7, color: pal[i % 3], size: 2, grav: 0, z: 2, vz: 70 + R() * 60, gz: 0 }; }); break;
      case 'sound': for (let k = 0; k < 3; k++) this.impacts.push({ x, y, z: 0, t: -k * 0.1, max: 0.45, kind: 'shock', c1: pal[1], c2: pal[0], ang: 0, big: true, r: r * (1.3 + k * 0.25) }); break;
      case 'poison': this.impacts.push({ x, y, z: 0, t: 0, max: 1.6, kind: 'scorch', c1: '#7a2a90', c2: '#c8f060', ang: 0, big: true, r: r * 1.1 }); P(16, (i) => ({ x: x + (R() - 0.5) * r * 1.4, y: y + (R() - 0.5) * r, vx: 0, vy: 0, life: 0.9, max: 0.9, color: i % 2 ? '#c8f060' : '#c060d0', size: 3, grav: 0, z: 2, vz: 25 + R() * 30, gz: -8 })); break;
      case 'metal': P(20, (i) => { const a = R() * TAU; return { x, y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 90, life: 0.35, max: 0.35, color: i % 2 ? '#ffffff' : '#c8d0e0', size: 1, grav: 0, z: 6 + R() * 8, vz: 50 + R() * 80, gz: 320 }; }); this.impacts.push({ x, y, z: 0, t: 0, max: 0.35, kind: 'shock', c1: '#ffffff', c2: '#c8d0e0', ang: 0, big, r: r * 1.2 }); break;
      case 'water': this.impacts.push({ x, y, z: 0, t: 0, max: 0.6, kind: 'pillar', c1: '#6890f0', c2: '#e0f0ff', ang: 0, big, r: r * 0.7 }); break;
      case 'electric': this.bolts.push({ x, y, t: 0, seed: R() * 1000 }); break;
      default: break;
    }
  }

  private strikeZone(z: Zone) {
    if (z.move.multi) { this.strikeMulti(z); return; }
    if (z.move.nova) { this.strikeNova(z); return; }
    z.done = true; z.fade = 0.5;
    const t = z.move.type, pal = this.typePalette(t), big = z.r > 28;
    if (t === 'electric') for (const dx of [0, -9, 9]) this.bolts.push({ x: z.x + dx, y: z.y, t: Math.abs(dx) / 200, seed: this.rng.next() * 1000 });
    this.impacts.push({ x: z.x, y: z.y, z: 0, t: 0, max: 1.4, kind: 'scorch', c1: t === 'water' ? '#3a5a8a' : t === 'grass' ? '#2f5a2a' : t === 'ice' ? '#5a8aa8' : t === 'ghost' ? '#403060' : t === 'rock' ? '#5a4a30' : '#3a3020', c2: pal[1], ang: 0, big: true, r: z.r });
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
    else if (e && e.alive && this.t - e.lastDodge < 1.6 && Math.hypot(e.x - z.x, e.y - z.y) < z.r * 2.4) this.registerDodge(e, z.owner, false);
  }

  // ───────────── Effekte rund um Attacken ─────────────
  private spawnProj(m: Mon, mv: MoveDef, ang: number, scale: number) {
    const sp = mv.speed!;
    this.projs.push({
      id: this.nid(), x: m.x + Math.cos(ang) * (m.sp.radius + 4), y: m.y + Math.sin(ang) * (m.sp.radius * 0.5 + 2),
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: mv.radius!, life: mv.homing ? 2.6 : mv.ring ? 1.2 : 1.8, owner: m, move: mv, age: 0, scale, trail: [], homing: mv.homing,
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
  private typePalette(t: string): string[] {
    return [...(TYPE_FX[t as keyof typeof TYPE_FX]?.pal ?? TYPE_FX.normal.pal)];
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
      if (p.homing) {   // lenkende Kugeln: drehen sich zum Gegner
        const he = this.enemyOf(p.owner);
        if (he && he.targetable) {
          const a = Math.atan2(p.vy, p.vx), sp = Math.hypot(p.vx, p.vy), want = Math.atan2(he.y - p.y, he.x - p.x);
          const na = a + clamp(angleDiff(a, want), -p.homing * dt, p.homing * dt);
          p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp;
        }
      }
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.age += dt;
      p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 9) p.trail.shift();
      if (p.move.type === 'fire' && Math.random() < 0.7) this.parts.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 10, life: 0.35, max: 0.35, color: Math.random() < 0.5 ? '#f8c030' : '#d83818', size: 2, grav: 0, z: 14, vz: 16, gz: 0 });
      if (p.move.type === 'electric' && Math.random() < 0.6) this.parts.push({ x: p.x + (Math.random() - 0.5) * 8, y: p.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 20, life: 0.18, max: 0.18, color: '#f8f080', size: 1, grav: 0, z: 14 + (Math.random() - 0.5) * 10 });
      if (p.move.type === 'grass' && Math.random() < 0.6) this.parts.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 24, vy: (Math.random() - 0.5) * 12, life: 0.4, max: 0.4, color: Math.random() < 0.5 ? '#90d048' : '#3f7f2a', size: 2, grav: 0, z: p.owner.sp.height * 0.5, vz: 8, gz: 90 });
      if (p.move.type === 'water' && Math.random() < 0.5) this.parts.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 10, life: 0.3, max: 0.3, color: '#a8d0f8', size: 1, grav: 0, z: 14, vz: 10, gz: 120 });
      for (const f of this.rocks) if (Math.hypot(f.x - p.x, f.y - p.y) < f.r - 1) { p.life = 0; const pal = this.typePalette(p.move.type); for (let i = 0; i < 6; i++) this.spawnPart(p.x, p.y, pal[i % 3], 1, 60, 0.3, 2, 0, 12); this.events.push({ type: 'slash' }); break; }
      if (p.life <= 0) continue;
      const e = this.enemyOf(p.owner);
      if (e && !p.evaded && this.t - e.lastDodge < 1.0 && e.alive) { const dx = e.x - p.x, dy = e.y - p.y; if (Math.hypot(dx, dy) < p.r + e.sp.radius + 30 && dx * p.vx + dy * p.vy < 0) { p.evaded = true; this.registerDodge(e, p.owner, false); } }
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
        if (z.move.nova) { z.x = z.owner.x; z.y = z.owner.y; }
        if (z.owner.state !== 'windup' || z.owner.move !== z.move) { z.done = true; z.fade = 0.15; } // abgebrochen
      } else z.fade -= dt;
    }
    this.zones = this.zones.filter((z) => !z.done || z.fade > 0);
  }

  // ───────────── Schaden ─────────────
  calc(att: Mon, def: Mon, mv: MoveDef) {
    const A = (mv.physical ? att.atk : att.spa) * stageMul(att.stage.atk), D = (mv.physical ? def.def : def.spd) * stageMul(def.stage.def);
    // Level-Ausgleich: KP wachsen durch Entwicklung schneller als der Schaden – so bleibt die Kampfdauer über alle Level ähnlich
    const base = (((2 * att.level) / 5 + 2) * mv.power * A / D / 50 + 2) * (1 + Math.max(0, att.level - 10) * LVL_DMG);
    const stab = att.sp.types.includes(mv.type) ? 1.5 : 1;
    const eff = typeEffectiveness(mv.type, def.sp.types);
    const crit = this.rng.next() < (att.nature === 'sly' ? 1 / 7 : 1 / 14) ? 1.5 : 1;
    const rand = 0.88 + this.rng.next() * 0.12;
    // Echtzeit: Typ-Vor-/Nachteile abgemildert (1.5x / 0.67x), sonst entscheidet das Matchup allein
    const effDmg = eff > 1 ? 1.07 : eff < 1 ? 0.95 : 1;   // bewusst mild: in langen Kämpfen entscheidet schon ein kleiner Vorteil
    // Wetter, Amulett, Anfeuern, Boss-Wut; Verteidiger: Amulett
    const tA = this.trainerOf(att).tactic, tD = this.trainerOf(def).tactic;
    const counter = att.counterT > 0 && mv.kind !== 'status' ? (tA === 'counter' ? 1.5 : tA === 'defend' ? 1.45 : 1.3) * (att.cperf ? 1.3 : 1) : 1;
    const mul = PACE * counter * (1 + 0.08 * Math.min(att.combo, 6)) * (1 + 0.12 * att.flow) / (1 + 0.09 * def.flow) * (tA === 'attack' ? 1.08 : 1) * (tD === 'defend' ? 0.92 : 1) * (1 + Math.max(0, (this.t - this.finaleAt) / 28)) * (att.own ? TERRAIN_BONUS : 1) * (att.hpFrac < 0.25 ? 1.1 : 1) * (att.nature === 'brave' && att.hpFrac < 0.5 ? 1.12 : 1) * (def.nature === 'calm' ? 0.92 : 1) * bondDmg(att.bondLvl) * synDmg(this.trainerOf(att).syn, mv.type) * (this.mod.mul[mv.type] ?? 1) * (att.amulet?.dmgType === mv.type ? att.amulet.dmgMul ?? 1 : 1) * (att.buffT > 0 ? 1.25 : 1) * (att.rage ? 1.15 : 1) * (att.elixir ? 1.2 : 1) * (att.hpFrac < 0.5 ? att.amulet?.rage ?? 1 : 1) / (def.amulet?.takenMul ?? 1);
    return { dmg: base * stab * effDmg * rand * crit * mul, eff, crit: crit > 1, counter: counter > 1 };
  }

  hit(att: Mon, def: Mon, mv: MoveDef, scale: number, o: { dirX?: number; dirY?: number; noStagger?: boolean } = {}) {
    const r = this.calc(att, def, mv);
    let dmg = Math.max(1, Math.round(r.dmg * scale));
    if (scale >= 0.9) {   // Wer den Gegner mitten im Aufladen oder direkt nach seinem Angriff trifft, richtet mehr an
      if (def.state === 'windup' && def.move && !def.move.armor) { dmg = Math.round(dmg * 1.4); this.stats.interrupts[att.side]++; this.addFlow(att); const at = this.trainerOf(att); at.focus = Math.min(FOCUS.max, at.focus + 10); this.text(def.x, def.y, 'UNTERBROCHEN!', '#ffb060', 0.9, false, def.sp.height + 34); }
      else if (def.state === 'recover' && def.t < 0.3) { dmg = Math.round(dmg * 1.2); this.text(def.x, def.y, 'LÜCKE!', '#ffd890', 0.7, false, def.sp.height + 34); }
    }
    if (r.counter && scale >= 0.9) { att.counterT = 0; att.cperf = false; this.stats.counters[att.side]++; this.text(att.x, att.y, 'KONTER!', '#ffe060', 1, true, att.sp.height + 14); this.shake = Math.max(this.shake, 3); this.hitstop = Math.max(this.hitstop, 0.06); }
    if (def.shield > 0 && scale >= 0.9 && this.t - def.shieldAt < 0.7) {   // Parade: Schild kurz vor dem Treffer aktiviert
      dmg = 0; this.stats.parries[def.side]++; def.counterT = 5; def.shieldAt = -9; this.addFlow(def); { const dt = this.trainerOf(def); dt.focus = Math.min(FOCUS.max, dt.focus + 25); }
      this.text(def.x, def.y, 'PARIERT!', '#ffffff', 1.1, true, def.sp.height + 16);
      this.shake = Math.max(this.shake, 4); this.hitstop = Math.max(this.hitstop, 0.08); this.flashScreen = Math.max(this.flashScreen, 0.08);
      if (att.alive && att.state !== 'faint') {
        if (att.state === 'windup' || att.state === 'active') att.punishT = 1.0;      // mitten im Angriff: lange Erholzeit nach dem Schlag
        else { att.state = 'stagger'; att.t = -0.5; att.move = null; }
      }
      this.impacts.push({ x: def.x, y: def.y, z: def.sp.height * 0.5, t: 0, max: 0.35, kind: 'ring', c1: '#8cdcff', c2: '#ffffff', ang: 0, big: true, r: 30 });
    }
    if (def.shield > 0 && dmg > 0) {   // Schild nimmt Schaden auf
      const ab = Math.min(def.shield, dmg); def.shield -= ab; dmg -= ab; this.stats.blocked[def.side] += ab;
      this.text(def.x, def.y, 'GEBLOCKT -' + ab, '#8cdcff', 0.8, false, def.sp.height + 14);
      if (def.shield <= 0) { def.shieldT = 0; this.spawnPart(def.x, def.y, '#8cdcff', 10, 70, 0.4, 2, 0, def.sp.height * 0.5); }
    }
    if (def.hp - dmg <= 0 && def.bondLvl >= 2 && !def.survived && def.hp > 1) {   // Bindung: Durchhalten
      dmg = def.hp - 1; def.survived = true;
      if (def.bondLvl >= 3) { const hl = Math.round(def.maxHp * 0.25); def.hp = Math.min(def.maxHp, def.hp + hl); this.text(def.x, def.y, '+' + hl, '#60f080', 0.7, false, def.sp.height + 8); }
      this.text(def.x, def.y, 'DURCHHALTEN!', '#ff9ad0', 1.1, true, def.sp.height + 26); this.shake = Math.max(this.shake, 3); this.hitstop = Math.max(this.hitstop, 0.07);
    }
    def.hp = Math.max(0, def.hp - dmg);
    def.flash = 0.14; if (dmg > 0) { def.lastHurt = this.t; if (def.side === 0) this.hurtFlash = Math.max(this.hurtFlash, Math.min(0.45, 0.12 + dmg / def.maxHp * 2)); }
    if (dmg > 0) { def.combo = 0; if (scale >= 0.3) { att.combo++; this.stats.maxCombo[att.side] = Math.max(this.stats.maxCombo[att.side], att.combo); if (att.combo >= 3 && scale >= 0.9) this.text(att.x, att.y, 'KOMBO x' + att.combo, '#ffd060', 0.8, false, att.sp.height + 20); } }
    if (def.nature === 'brave' && !def.traitShown && def.alive && def.hpFrac < 0.5) { def.traitShown = true; this.text(def.x, def.y, 'KAMPFGEIST!', '#ff8060', 1, false, def.sp.height + 26); }
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
    if (mv.foeStage && def.alive && scale >= 0.3 && this.rng.next() < mv.foeStage.chance * Math.min(1, scale * 1.2)) this.applyStage(def, mv.foeStage.stat, mv.foeStage.n);
    // Status
    if (mv.status && def.alive && this.rng.next() < mv.status.chance * Math.min(1, scale * 1.2)) {
      if (mv.status.id === 'burn' && def.burn <= 0 && !def.sp.types.includes('fire')) { def.burn = 6; def.burnT = 0; this.text(def.x, def.y, 'VERBRANNT', '#f08030', 0.9, false, def.sp.height + 22); this.events.push({ type: 'status', id: 'burn' }); }
      if (mv.status.id === 'poison' && def.psn <= 0 && !def.sp.types.includes('poison') && !def.sp.types.includes('metal')) { def.psn = 8; def.psnT = 0; this.text(def.x, def.y, 'VERGIFTET', '#c060d0', 0.9, false, def.sp.height + 22); this.events.push({ type: 'status', id: 'burn' }); }
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
      x = cur.x; y = cur.y; cur.state = 'benched'; cur.elixir = false; cur.forcedId = null; cur.stage = { atk: 0, def: 0, spe: 0 };
      for (let i = 0; i < 10; i++) this.spawnPart(x, y, '#ff6060', 1, 60, 0.4, 2, 0, 12);
    }
    tr.active = nm; nm.x = x; nm.y = y; nm.vx = nm.vy = nm.kx = nm.ky = 0;
    nm.state = 'summon'; nm.since = this.t; nm.t = 0; nm.invuln = 0.45; nm.move = null; nm.fought = true;
    nm.face = tr.side === 0 ? 1 : -1;
    for (const k in nm.cd) nm.cd[k] = Math.max(nm.cd[k], 0.6);
    const sp = nm.special; if (sp) nm.cd[sp.id] = Math.max(nm.cd[sp.id], 3);
    const foeM = this.enemyOf(nm);
    if (foeM && foeM.alive && nm.moves.some((mv) => mv.kind !== 'self' && mv.kind !== 'status' && typeEffectiveness(mv.type, foeM.sp.types) > 1) && typeEffectiveness(foeM.moves[0]?.type ?? 'normal', nm.sp.types) <= 1) {
      nm.counterT = 4; this.text(x, y, 'TYPVORTEIL!', '#ffe060', 1.1, true, nm.sp.height + 14);
    }
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
    const sp = m.special; if (!sp || m.cd[sp.id] > 3 || m.forcedId === sp.id) return false;   // fast bereit = vormerken
    if (!this.spend(tr, FOCUS.special)) return false;
    m.forced = 6; m.forcedId = sp.id;
    this.text(m.x, m.y, 'SPEZIAL!', '#ffe060', 0.9, false, m.sp.height + 10);
    return true;
  }
  /** Schild: nimmt bis zu 30 % der max. KP an Schaden auf (4 s). */
  commandShield(tr: Trainer) {
    const m = tr.active;
    if (!m || !m.alive || m.shield > 0 || !this.spend(tr, FOCUS.shield)) return false;
    m.shield = Math.round(m.maxHp * 0.3); m.shieldT = 4; m.shieldAt = this.t;
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
  commandDodge(tr: Trainer, ang?: number) {
    const m = tr.active;
    if (!m || !m.alive || tr.focus < FOCUS.dodge || tr.cmdCd > 0) return false;
    if (!manualDodge(this, m, ang)) return false;
    tr.focus -= FOCUS.dodge; tr.cmdCd = 0.25; this.events.push({ type: 'cmd' });
    return true;
  }
  /** Warum ein Wisch nicht ausgelöst hat (für die Meldung an den Spieler). */
  dodgeBlock(tr: Trainer): string {
    const m = tr.active;
    if (!m || !m.alive) return '';
    if (tr.focus < FOCUS.dodge) return 'NICHT GENUG FOKUS FÜR DIE ROLLE (' + FOCUS.dodge + ').';
    if (m.dodgeCd > 1.3) return 'ROLLE LÄDT NOCH KURZ …';
    return 'JETZT NICHT MÖGLICH (' + m.state.toUpperCase() + ').';
  }
  /** Sichtbare Rückmeldung bei einer gezielten Rolle: Staubwolke, Ring, Richtungsstreifen. */
  dodgeFx(m: Mon, a: number) {
    this.text(m.x, m.y, 'ROLLE!', '#ffffff', 0.6, false, m.sp.height + 10);
    this.impacts.push({ x: m.x, y: m.y, z: 0, t: 0, max: 0.3, kind: 'groundring', c1: '#ffffff', c2: '#c8e0ff', ang: 0, big: false, r: 26 });
    for (let i = 0; i < 12; i++) { const s = Math.random() * 0.8 - 0.4; this.parts.push({ x: m.x, y: m.y, vx: -Math.cos(a + s) * (50 + Math.random() * 60), vy: -Math.sin(a + s) * (35 + Math.random() * 40), life: 0.35, max: 0.35, color: i % 2 ? '#f0e8d0' : '#ffffff', size: 2, grav: 0, z: 3 }); }
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
    // Texte am selben Monster übereinander stapeln statt zu überlagern
    const near = this.texts.filter((q) => Math.abs(q.x - x) < 36 && Math.abs(q.y - y) < 24 && q.max - q.life < 0.55).length;
    this.texts.push({ x, y, z: z + Math.min(3, near) * 9, rise: 0, text, color, life, max: life, vy: -22, big });
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

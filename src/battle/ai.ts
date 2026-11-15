import type { Battle } from './battle';
import { ARENA } from './battle';
import { Mon, Trainer, FOCUS } from './mon';
import { NATURES, TACTICS } from '../data/species';
import { typeEffectiveness } from '../data/types';
import { clamp } from '../core/util';
import { TERRAIN_BONUS, GRASS_SLOW } from '../data/maps';
import { stageMul } from '../data/moves';
const PULL = 0.25;   // Zug zum eigenen Element

const hyp = Math.hypot;

interface Threat { id: number; kind: 'proj' | 'zone' | 'melee'; dir: number; cx: number; cy: number }

/** Erkennt die gefährlichste anrollende Attacke für m. */
function findThreat(b: Battle, m: Mon): Threat | null {
  const e = b.enemyOf(m);
  if (!e) return null;
  for (const p of b.projs) {
    if (p.owner === m) continue;
    const rx = p.x - m.x, ry = p.y - m.y;
    const v2 = p.vx * p.vx + p.vy * p.vy;
    const tc = -(rx * p.vx + ry * p.vy) / v2;
    if (tc < 0 || tc > 0.65) continue;
    const d = hyp(rx + p.vx * tc, ry + p.vy * tc);
    if (d < p.r + m.sp.radius + 5) return { id: p.id, kind: 'proj', dir: Math.atan2(p.vy, p.vx), cx: p.x, cy: p.y };
  }
  for (const z of b.zones) {
    if (z.owner === m || z.done) continue;
    if (hyp(z.x - m.x, z.y - m.y) < z.r + m.sp.radius + 4) return { id: z.id, kind: 'zone', dir: Math.atan2(m.y - z.y, m.x - z.x), cx: z.x, cy: z.y };
  }
  if (e.move && (e.state === 'windup' || e.state === 'active')) {
    const mv = e.move;
    const d = hyp(m.x - e.x, m.y - e.y);
    const off = Math.abs(Math.atan2(Math.sin(Math.atan2(m.y - e.y, m.x - e.x) - e.aim), Math.cos(Math.atan2(m.y - e.y, m.x - e.x) - e.aim)));
    if ((mv.kind === 'melee' || mv.kind === 'dash') && d < mv.range + 22 && off < 1.0)
      return { id: e.moveSerial, kind: 'melee', dir: e.aim, cx: e.x, cy: e.y };
    if (mv.kind === 'cone' && d < mv.range + 14 && off < mv.arc! + 0.3)
      return { id: e.moveSerial, kind: 'melee', dir: e.aim, cx: e.x, cy: e.y };
  }
  return null;
}

function room(m: Mon, a: number) {
  const tx = m.x + Math.cos(a) * 40, ty = m.y + Math.sin(a) * 40;
  return Math.min(tx - ARENA.x0, ARENA.x1 - tx, ty - ARENA.y0, ARENA.y1 - ty);
}

/** Manueller Ausweich-Befehl des Managers: springt sofort seitlich aus der Gefahr. */
export function manualDodge(b: Battle, m: Mon): boolean {
  if (!['ready', 'recover', 'stagger', 'windup'].includes(m.state) || (m.state === 'windup' && m.move?.armor)) return false;
  const e = b.enemyOf(m);
  const th = findThreat(b, m) ?? { id: 0, kind: 'melee' as const, dir: e ? Math.atan2(m.y - e.y, m.x - e.x) : 0, cx: m.x, cy: m.y };
  startDodge(b, m, th);
  return true;
}

function startDodge(b: Battle, m: Mon, th: Threat) {
  let a: number;
  if (th.kind === 'zone') a = th.dir; // radial aus der Zone heraus
  else {
    // seitlich zur Bedrohung, auf die Seite mit mehr Platz
    const p1 = th.dir + Math.PI / 2, p2 = th.dir - Math.PI / 2;
    a = room(m, p1) + b.rng.range(-8, 8) > room(m, p2) ? p1 : p2;
  }
  a += b.rng.range(-0.3, 0.3);
  const sp = 190;
  m.state = 'dodge'; m.t = 0; m.move = null;
  m.dashDx = Math.cos(a) * sp; m.dashDy = Math.sin(a) * sp;
  m.face = m.dashDx >= 0 ? 1 : -1;
  m.invuln = 0.14;
  m.dodgeCd = (b.trainerOf(m).tactic === 'counter' ? 1.15 : 1.7) * (m.nature === 'timid' ? 0.75 : 1);
  m.lastDodge = b.t;
  b.stats.dodges[m.side]++;
  b.events.push({ type: 'dodge' });
}

export function thinkReady(b: Battle, m: Mon, dt: number) {
  const tr = b.trainerOf(m);
  const e = b.enemyOf(m);
  const N = NATURES[m.nature];
  const T = TACTICS[tr.tactic];
  const rng = b.rng;

  m.think -= dt; m.orbitT -= dt;
  if (m.orbitT <= 0) { if (rng.chance(0.55)) m.orbit = (m.orbit * -1) as 1 | -1; m.orbitT = rng.range(1, 2.8); }

  const targetable = !!e && e.alive && e.state !== 'benched';
  if (!targetable) { // Gegner wechselt/ist K.O.: locker zur Mitte
    const [cx, cy] = [(ARENA.x0 + ARENA.x1) / 2, m.side === 0 ? ARENA.y0 + (ARENA.y1 - ARENA.y0) * 0.65 : ARENA.y0 + (ARENA.y1 - ARENA.y0) * 0.35];
    m.vx += ((cx - m.x) * 0.9 - m.vx) * Math.min(1, dt * 4); m.vy += ((cy - m.y) * 0.9 - m.vy) * Math.min(1, dt * 4);
    integrate(m, dt);
    return;
  }
  const dx = e!.x - m.x, dy = e!.y - m.y, dist = hyp(dx, dy) || 1;
  const toE = { x: dx / dist, y: dy / dist };

  // ── Ausweichen ──
  const th = findThreat(b, m);
  if (th && !m.seen.has(th.id)) {
    m.seen.add(th.id);
    if (m.seen.size > 60) m.seen.clear();
    const p = clamp(N.dodge * T.dodge * 0.9, 0, 0.95);
    if (rng.chance(p)) m.react = { at: b.t + rng.range(0.07, 0.22), ...th };
  }
  if (m.react && b.t >= m.react.at) {
    const r = m.react; m.react = null;
    if (m.dodgeCd <= 0) { startDodge(b, m, { id: 0, ...r }); return; }
  }

  const noLos = b.rocks.length > 0 && b.losBlocked(m.x, m.y, e!.x, e!.y);
  // ── Angriff wählen ──
  let bestMv = null as Mon['moves'][number] | null, bestScore = 0;
  const gate = clamp(0.45 + 0.55 * N.aggression * T.aggr, 0.25, 1);
  const wantId = m.forced > 0 ? m.forcedId : null; const wantSpecial = !!wantId;
  const soon: typeof m.moves = [];
  for (const mv of m.moves) {
    if (m.cd[mv.id] > 0.35) continue;
    const eff = typeEffectiveness(mv.type, e!.sp.types);
    if (mv.kind === 'status') {   // Gegner schwächen: nur in Reichweite und solange es noch etwas bringt
      if (m.cd[mv.id] > 0 || dist > mv.range) continue;
      const room = (mv.stages ?? []).some((fx) => e!.stage[fx.stat] > -2);
      const want = wantId === mv.id ? 1e6 : room ? 95 * (m.moveW[mv.id] ?? 1) * (0.8 + rng.next() * 0.4) : 0;
      if (want > bestScore) { bestScore = want; bestMv = mv; }
      continue;
    }
    if (mv.kind === 'self') {   // Heilung bei wenig KP, Stärkung wenn Abstand da ist
      if (m.cd[mv.id] > 0) continue;
      if (wantId === mv.id) { bestScore = 1e6; bestMv = mv; continue; }
      const want = (mv.stages ? ((mv.stages.some((fx) => m.stage[fx.stat] < 2) && dist > 40) ? 100 : 0) : mv.heal ? (m.hpFrac < 0.5 ? 400 : m.hpFrac < 0.7 ? 60 : 0) : mv.shield && !mv.buff ? (m.shield <= 0 && m.hpFrac < 0.8 ? 110 : 0) : (m.buffT <= 0 && dist > 45 ? 90 : 0)) * (m.moveW[mv.id] ?? 1);
      if (want > bestScore) { bestScore = want; bestMv = mv; }
      continue;
    }
    let sc = mv.power * eff * (N.weights[mv.kind] ?? 1) * (mv.special ? 1.1 : 1) * (m.moveW[mv.id] ?? 1);
    if (wantId === mv.id) sc *= 50;
    if (mv.kind === 'melee' || mv.kind === 'dash') sc *= 0.75 + 0.5 * N.aggression * T.aggr;
    soon.push(mv);
    if (m.cd[mv.id] > 0) continue;
    if (dist > mv.range || dist < (mv.minRange ?? 0)) continue;
    if ((mv.kind === 'projectile' || mv.kind === 'cone' || mv.kind === 'dash') && noLos) continue;   // Fels im Weg
    sc *= 0.8 + rng.next() * 0.4;
    if ((e!.state === 'recover' || e!.state === 'stagger') && (mv.kind === 'melee' || mv.kind === 'dash' || mv.kind === 'cone')) sc *= 1.4;   // Lücke nutzen
    if (sc > bestScore) { bestScore = sc; bestMv = mv; }
  }
  if (m.think <= 0) {
    m.think = rng.range(0.08, 0.22);
    if (bestMv && (wantSpecial || rng.chance(gate))) {
      let aim = Math.atan2(dy, dx);
      let target: { x: number; y: number } | undefined;
      const mv = bestMv;
      if (mv.kind === 'projectile') {
        const tt = (dist / mv.speed!) * N.lead;
        aim = Math.atan2(dy + e!.vy * tt, dx + e!.vx * tt) + rng.range(-0.1, 0.1) * (1.15 - N.lead);
      } else if (mv.kind === 'aoe') {
        const lead = 0.25 + 0.4 * N.lead;
        target = { x: e!.x + e!.vx * mv.windup * lead, y: e!.y + e!.vy * mv.windup * lead };
        aim = Math.atan2(target.y - m.y, target.x - m.x);
      } else if (mv.kind === 'dash') {
        aim = Math.atan2(dy + e!.vy * 0.1, dx + e!.vx * 0.1);
      }
      b.startMove(m, mv, aim, target);
      return;
    }
  }

  const attackSoon0 = soon.some((mv) => mv.kind !== 'self');
  // Lücken des Gegners nutzen: nach seinem Angriff (Erholphase) nachsetzen; vor seinem Nahkampf-Anlauf Abstand halten
  const punish = e!.alive && (e!.state === 'recover' || e!.state === 'stagger') && dist < 120 && attackSoon0;
  const threatened = e!.state === 'windup' && !!e!.move && (e!.move.kind === 'melee' || e!.move.kind === 'dash') && dist < e!.move.range + 24 && m.dodgeCd > 0.3;
  // ── Bewegung ──
  let desired: number;
  let pick: typeof bestMv = null, pw = 0;
  for (const mv of soon) {
    if (mv.kind === 'self' || mv.kind === 'status') continue;
    const w = mv.power * (N.weights[mv.kind] ?? 1) * (wantId === mv.id ? 50 : 1);
    if (w > pw) { pw = w; pick = mv; }
  }
  const rangeF = clamp(N.range * T.range, 0.45, 1.5);
  if (pick) desired = Math.max(14, pick.range * 0.72 * (pick.kind === 'melee' || pick.kind === 'dash' ? Math.min(1, rangeF + 0.2) : rangeF));
  else desired = 78 * rangeF;

  let radial = clamp((dist - desired) / 16, -1, 1);
  if (punish) radial = Math.max(radial, 0.9);
  else if (threatened) radial = Math.min(radial, -0.8);
  if (m.retreatT > 0) radial = -1;
  const orbitW = N.orbit * 0.6 * (Math.abs(radial) > 0.8 ? 0.5 : 1);
  let vx = toE.x * radial - toE.y * m.orbit * orbitW;
  let vy = toE.y * radial + toE.x * m.orbit * orbitW;

  // Keine Sichtlinie: seitlich um den Felsen herum
  const attackSoon = soon.some((mv) => mv.kind !== 'self');
  if (noLos && attackSoon) { vx = toE.x; vy = toE.y; }   // Angriff bereit, aber Fels im Weg: direkt zum Gegner (die Hindernis-Umgehung führt außen herum)
  // Deckung suchen: bei wenig KP oder defensiver Taktik hinter den nächsten Felsen, solange kein Angriff bereit ist
  if (b.rocks.length && !attackSoon && (m.hpFrac < 0.4 || tr.tactic === 'defend' || m.retreatT > 0)) {
    let best = null as null | { x: number; y: number }, bd = 1e9;
    for (const f of b.rocks) { const ex = f.x - e!.x, ey = f.y - e!.y, el = hyp(ex, ey) || 1; const px = f.x + (ex / el) * (f.r + 13), py = f.y + (ey / el) * (f.r + 13); const d2 = hyp(px - m.x, py - m.y); if (d2 < bd) { bd = d2; best = { x: px, y: py }; } }
    if (best && bd < 150) { const k = Math.min(1, bd / 14); vx = ((best.x - m.x) / (bd || 1)) * k; vy = ((best.y - m.y) / (bd || 1)) * k; }
  }
  // Gelände: Hindernisse umlaufen, zum eigenen Element hingezogen
  for (const f of b.map.features) {
    const fx = m.x - f.x, fy = m.y - f.y, fd = hyp(fx, fy) || 1;
    if (b.canEnter(m, f)) {
      const mine = (f.kind === 'water' && m.sp.types.includes('water')) || (f.kind === 'lava' && m.sp.types.includes('fire')) || (f.kind === 'grass' && m.sp.types.includes('grass'));
      if (mine && fd > f.r - 10 && fd < f.r + 70) { vx -= (fx / fd) * PULL; vy -= (fy / fd) * PULL; }
      continue;
    }
    const near = f.r + m.sp.radius + 16;
    if (fd < near) { const push = 1 - (fd - f.r) / (near - f.r); vx += (fx / fd) * push * 1.6 - (fy / fd) * m.orbit * push * 0.9; vy += (fy / fd) * push * 1.6 + (fx / fd) * m.orbit * push * 0.9; }
  }
  // Wände meiden
  const wm = 22;
  if (m.x < ARENA.x0 + wm) vx += ((ARENA.x0 + wm - m.x) / wm) * 1.4;
  if (m.x > ARENA.x1 - wm) vx -= ((m.x - (ARENA.x1 - wm)) / wm) * 1.4;
  if (m.y < ARENA.y0 + wm) vy += ((ARENA.y0 + wm - m.y) / wm) * 1.4;
  if (m.y > ARENA.y1 - wm) vy -= ((m.y - (ARENA.y1 - wm)) / wm) * 1.4;

  // Einschlagzonen zu Fuß verlassen
  for (const z of b.zones) {
    if (z.owner === m || z.done) continue;
    const zx = m.x - z.x, zy = m.y - z.y, zd = hyp(zx, zy) || 1;
    if (zd < z.r + 8 && m.seen.has(z.id)) { vx += (zx / zd) * 1.6; vy += (zy / zd) * 1.6; }
  }
  const vl = hyp(vx, vy);
  if (vl > 1) { vx /= vl; vy /= vl; }
  const spd = m.baseSpeed * stageMul(m.stage.spe) * (m.para > 0 ? 0.55 : 1) * (0.92 + 0.12 * T.aggr) * (m.own ? TERRAIN_BONUS : m.terrain === 'grass' ? GRASS_SLOW : 1) * (m.hpFrac < 0.25 ? 1.08 : 1);
  m.vx += (vx * spd - m.vx) * Math.min(1, dt * 9);
  m.vy += (vy * spd - m.vy) * Math.min(1, dt * 9);
  m.face = dx >= 0 ? 1 : -1;
  integrate(m, dt);
}

function integrate(m: Mon, dt: number) {
  m.x += m.vx * dt; m.y += m.vy * dt;
  m.moving = Math.hypot(m.vx, m.vy) > 8;
}

// ───────────── Trainer-KI (Gegner & Demo) ─────────────
export function trainerAI(b: Battle, tr: Trainer, dt: number) {
  tr.aiT -= dt;
  if (!tr.active) {
    // K.O.: nach kurzer Bedenkzeit besten Nachfolger schicken
    if (tr.aliveCount > 0 && tr.pending === null) {
      tr.chooseT += dt;
      if (tr.chooseT > 0.9) {
        const foe = b.trainers[1 - tr.side].active;
        let best = -1, bs = -1;
        tr.team.forEach((m, i) => {
          if (!m.alive) return;
          const eff = foe ? Math.max(...m.moves.map((mv) => typeEffectiveness(mv.type, foe.sp.types))) : 1;
          const s = m.hpFrac + eff * 0.3 + b.rng.next() * 0.2;
          if (s > bs) { bs = s; best = i; }
        });
        b.requestSwitch(tr, best, true);
      }
    }
    return;
  }
  if (tr.aiT > 0) return;
  tr.aiT = 0.4;
  const m = tr.active;
  if (!m.alive || tr.pending !== null) return;

  // Taktik der Lage anpassen (der Gegner-Trainer denkt mit)
  const foe = b.trainers[1 - tr.side].active;
  if (tr.side === 1 || tr.auto) {
    const want = m.hpFrac < 0.35 && tr.aliveCount > 1 ? 'defend' : foe && foe.hpFrac < 0.3 ? 'attack' : tr.baseTactic;
    if (want !== tr.tactic) b.setTactic(tr, want);
  }
  // Trank
  if (m.hpFrac < 0.3 && tr.itemCd <= 0 && b.rng.chance(0.5)) { if (tr.potions > 0) b.usePotion(tr); else if (tr.supers > 0) b.usePotion(tr, 'super'); }

  // Wechsel bei schlechter Lage
  if (m.hpFrac < 0.28 && tr.switchCd <= 0) {
    const cand = tr.team.map((x, i) => ({ x, i })).filter(({ x }) => x.alive && x !== m && x.hpFrac > 0.45);
    if (cand.length && b.rng.chance(0.7)) {
      cand.sort((a, c) => c.x.hpFrac - a.x.hpFrac);
      b.requestSwitch(tr, cand[0].i);
      return;
    }
  }
  // Parade: Schild genau dann, wenn ein Starkangriff gleich einschlägt
  const fm = foe && foe.alive ? foe : null;
  if (fm && fm.state === 'windup' && fm.move && fm.move.armor && fm.t > fm.move.windup * 0.45 && m.shield <= 0 && tr.focus >= FOCUS.shield && Math.hypot(fm.x - m.x, fm.y - m.y) < fm.move.range + 20 && b.rng.chance(tr.side === 1 ? 0.35 : 1)) { b.commandShield(tr); return; }
  // Spezial-Befehl
  const sp = m.special;
  if (sp && m.cd[sp.id] <= 0 && tr.focus >= FOCUS.special + 10 && b.rng.chance(0.4)) b.commandSpecial(tr);
  else if (m.hpFrac < 0.5 && m.shield <= 0 && tr.focus >= FOCUS.shield + 10 && b.rng.chance(0.3)) b.commandShield(tr);
  else if (m.buffT <= 0 && tr.focus >= FOCUS.buff + 35 && b.rng.chance(0.25)) b.commandBuff(tr);
}

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

interface Threat { id: number; kind: 'proj' | 'zone' | 'melee'; dir: number; cx: number; cy: number; eta?: number }

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
    if (d < p.r + m.sp.radius + 5) return { id: p.id, kind: 'proj', dir: Math.atan2(p.vy, p.vx), cx: p.x, cy: p.y, eta: tc };
  }
  for (const z of b.zones) {
    if (z.owner === m || z.done) continue;
    if (hyp(z.x - m.x, z.y - m.y) < z.r + m.sp.radius + 4) return { id: z.id, kind: 'zone', dir: Math.atan2(m.y - z.y, m.x - z.x), cx: z.x, cy: z.y, eta: Math.max(0, z.delay - z.t) };
  }
  if (e.move && (e.state === 'windup' || e.state === 'active')) {
    const mv = e.move;
    const d = hyp(m.x - e.x, m.y - e.y);
    const off = Math.abs(Math.atan2(Math.sin(Math.atan2(m.y - e.y, m.x - e.x) - e.aim), Math.cos(Math.atan2(m.y - e.y, m.x - e.x) - e.aim)));
    if ((mv.kind === 'melee' || mv.kind === 'dash') && d < mv.range + 22 && off < 1.0)
      return { id: e.moveSerial, kind: 'melee', dir: e.aim, cx: e.x, cy: e.y, eta: e.state === 'windup' ? Math.max(0, mv.windup - e.t) : 0 };
    if (mv.kind === 'cone' && d < mv.range + 14 && off < mv.arc! + 0.3)
      return { id: e.moveSerial, kind: 'melee', dir: e.aim, cx: e.x, cy: e.y, eta: e.state === 'windup' ? Math.max(0, mv.windup - e.t) : 0 };
  }
  return null;
}

/** Sekunden, bis die nächste Attacke des Gegners trifft (für Hinweise), sonst null. */
export function incomingEta(b: Battle, m: Mon): number | null { const th = findThreat(b, m); return th ? th.eta ?? 0 : null; }

function room(m: Mon, a: number) {
  const tx = m.x + Math.cos(a) * 40, ty = m.y + Math.sin(a) * 40;
  return Math.min(tx - ARENA.x0, ARENA.x1 - tx, ty - ARENA.y0, ARENA.y1 - ty);
}

/** Manueller Ausweich-Befehl des Managers: springt sofort seitlich aus der Gefahr. */
export function manualDodge(b: Battle, m: Mon, ang?: number): boolean {
  if (m.dodgeCd > 1.3) return false;   // Rolle ist noch nicht wieder bereit (nach 0,4 s wieder möglich)
  if (!['ready', 'recover', 'stagger', 'windup', 'active'].includes(m.state)) return false;   // auch mitten im eigenen Angriff: bricht ihn ab
  const e = b.enemyOf(m);
  const real = findThreat(b, m);
  const th = real ?? { id: 0, kind: 'melee' as const, dir: e ? Math.atan2(m.y - e.y, m.x - e.x) : 0, cx: m.x, cy: m.y };
  // Zielhilfe: wer längs der Angriffsrichtung wischt (hin oder weg), rollt trotzdem zur Seite; bei Flächen immer aus der Zone heraus
  if (real && ang !== undefined) {
    const d = Math.atan2(Math.sin(ang - th.dir), Math.cos(ang - th.dir));
    if (th.kind === 'zone') { if (Math.cos(d) < -0.2) ang = th.dir; }
    else if (Math.abs(Math.sin(d)) < 0.55) ang = th.dir + (Math.sin(d) >= 0 ? 1 : -1) * Math.PI / 2;
  }
  m.manualT = b.t;
  startDodge(b, m, th, ang, true);
  return true;
}

function startDodge(b: Battle, m: Mon, th: Threat, forceAng?: number, manual = false) {
  let a: number;
  if (forceAng !== undefined) a = forceAng;
  else if (th.kind === 'zone') a = th.dir; // radial aus der Zone heraus
  else {
    // seitlich zur Bedrohung, auf die Seite mit mehr Platz
    const p1 = th.dir + Math.PI / 2, p2 = th.dir - Math.PI / 2;
    a = room(m, p1) + b.rng.range(-8, 8) > room(m, p2) ? p1 : p2;
  }
  if (forceAng === undefined) a += b.rng.range(-0.3, 0.3);
  const sp = manual ? 250 : 190;
  m.dsx = m.x; m.dsy = m.y;
  m.state = 'dodge'; m.t = 0; m.move = null; m.dodgeLen = manual ? 0.28 : 0.2;
  m.dashDx = Math.cos(a) * sp; m.dashDy = Math.sin(a) * sp;
  m.face = m.dashDx >= 0 ? 1 : -1;
  m.invuln = manual ? 0.34 : 0.16;   // gezielte Rolle schützt länger
  m.dodgeCd = (b.trainerOf(m).tactic === 'counter' ? 1.15 : 1.7) * (m.nature === 'timid' ? 0.75 : 1);
  m.lastDodge = b.t;
  b.stats.dodges[m.side]++;
  b.events.push({ type: 'dodge' });
  if (manual) b.dodgeFx(m, a);
}

/** moveOnly: nur bewegen (während Aufladen/Erholen), keine neue Attacke oder Ausweichen. spdMul: Tempo-Anteil. */
export function thinkReady(b: Battle, m: Mon, dt: number, moveOnly = false, spdMul = 1) {
  const tr = b.trainerOf(m);
  const e = b.enemyOf(m);
  const N = NATURES[m.nature];
  const T = TACTICS[tr.tactic];
  const rng = b.rng;

  m.think -= dt; m.orbitT -= dt;
  if (m.orbitT <= 0) { if (rng.chance(0.55)) m.orbit = (m.orbit * -1) as 1 | -1; m.orbitT = rng.range(1, 2.8); }

  const targetable = !!e && e.alive && e.state !== 'benched';
  if (!targetable && b.royale) {   // Royale ohne Gegner: nur dem Laufbefehl folgen
    let ord = tr.order && tr.active === m ? tr.order : null;
    if (ord && (b.t >= ord.until || (ord.kind === 'go' && hyp(ord.x - m.x, ord.y - m.y) < 9))) { tr.order = null; ord = null; }
    let vx = 0, vy = 0;
    if (ord && ord.kind !== 'attack') { const dx2 = ord.x - m.x, dy2 = ord.y - m.y, l = hyp(dx2, dy2) || 1; if (l > 7) { const k = Math.min(1, l / 14); vx = (dx2 / l) * k; vy = (dy2 / l) * k; } else if (ord.kind === 'hold') ord.until = b.t + 0.01; }
    const spd = spdMul * 1.12 * (m.speedT > 0 ? 1.35 : 1) * m.baseSpeed * stageMul(m.stage.spe) * (m.para > 0 ? 0.55 : 1) * (m.own ? TERRAIN_BONUS : m.terrain === 'grass' ? GRASS_SLOW : 1);
    m.vx += (vx * spd - m.vx) * Math.min(1, dt * 18); m.vy += (vy * spd - m.vy) * Math.min(1, dt * 18);
    if (vx || vy) m.face = vx >= 0 ? 1 : -1;
    integrate(m, dt);
    return;
  }
  if (!targetable) { // Gegner wechselt/ist K.O.: locker zur Mitte
    const [cx, cy] = [(ARENA.x0 + ARENA.x1) / 2, m.side === 0 ? ARENA.y0 + (ARENA.y1 - ARENA.y0) * 0.65 : ARENA.y0 + (ARENA.y1 - ARENA.y0) * 0.35];
    m.vx += ((cx - m.x) * 0.9 - m.vx) * Math.min(1, dt * 4); m.vy += ((cy - m.y) * 0.9 - m.vy) * Math.min(1, dt * 4);
    integrate(m, dt);
    return;
  }
  const dx = e!.x - m.x, dy = e!.y - m.y, dist = hyp(dx, dy) || 1;
  const toE = { x: dx / dist, y: dy / dist };

  // ── Ausweichen ──
  const refl = m.sk.dodge;
  const canReact = !moveOnly || ((tr.skill > 0 || refl > 0) && !(m.state === 'windup' && m.move?.armor));   // Können-Simulation: auch beim Aufladen/Erholen ausweichen (wie ein Mensch per Wisch)
  const th = canReact ? findThreat(b, m) : null;
  if (th && !m.seen.has(th.id)) {
    m.seen.add(th.id);
    if (m.seen.size > 60) m.seen.clear();
    const p = clamp(N.dodge * T.dodge * 0.9 * (tr.manual ? 0.65 : 1) * (1 + 0.3 * refl), 0, 0.98);
    if (refl > 0 && rng.chance(Math.min(0.7, 0.065 * refl)) && rng.chance(Math.min(1, p + 0.3))) m.react = { at: b.t + Math.max(0.02, (th.eta ?? 0.3) - rng.range(0.14, 0.26)), manual: true, ...th } as typeof m.react;   // Reflexe: gezielt und perfekt getimt
    else if (tr.skill > 0 && rng.chance(tr.skill)) m.react = { at: b.t + Math.max(0.02, (th.eta ?? 0.3) - rng.range(0.14, 0.26)), manual: true, ...th } as typeof m.react;
    else if (rng.chance(p)) m.react = { at: b.t + rng.range(0.07, 0.22) / (1 + 0.15 * refl), ...th };
  }
  if (canReact && m.react && b.t >= m.react.at) {
    const r = m.react; m.react = null;
    const man = !!(r as { manual?: boolean }).manual;
    if (man ? m.dodgeCd <= 1.0 : m.dodgeCd <= 0) { if (man) m.manualT = b.t; startDodge(b, m, { id: 0, ...r }, undefined, man); return; }
  }

  const noLos = b.rocks.length > 0 && b.losBlocked(m.x, m.y, e!.x, e!.y);
  // ── Angriff wählen ──
  let bestMv = null as Mon['moves'][number] | null, bestScore = 0;
  const gate = clamp(0.45 + 0.55 * N.aggression * T.aggr, 0.25, 1);
  const sense = m.sk.sense, windowOpen = sense > 0 && e!.state === 'windup' && !!e!.move && !e!.move.armor;   // Gespür: Gegner lädt auf – jetzt zuschlagen
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
  // Wer einen Laufbefehl bekommen hat, läuft erst hin und greift dann an (höchstens 1,6 s lang)
  const walking = (() => { const o = tr.order; if (!o || tr.active !== m || o.kind === 'attack') return false; return b.t - o.t0 < 1.6 && (o.kind === 'go' || hyp(o.x - m.x, o.y - m.y) > 16); })();
  if (m.think <= 0 && !moveOnly) {
    m.think = rng.range(0.08, 0.22);
    if (bestMv && !walking && (wantSpecial || rng.chance(gate) || (windowOpen && rng.chance(0.09 * sense)))) {
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
  const meleeish = !!pick && (pick.kind === 'melee' || pick.kind === 'dash');

  // ── Manöver: Monster bleiben nicht aneinander kleben, sondern kreisen, umgehen, weichen aus und stürmen vor ──
  if (!m.man || b.t >= m.man.until || (m.man.k === 'roam' && hyp(m.man.tx - m.x, m.man.ty - m.y) < 14)) m.man = pickManeuver(b, m, e!, N, tr.tactic, meleeish);
  const man = m.man;
  let ord = tr.order && tr.active === m ? tr.order : null;
  if (ord && (b.t >= ord.until || (ord.kind === 'go' && hyp(ord.x - m.x, ord.y - m.y) < 9))) { tr.order = null; ord = null; }
  let radial: number, orbitW: number, boost = 1;
  let vx: number, vy: number;
  if (man.k === 'flank' || man.k === 'roam') {
    let tx = man.tx, ty = man.ty;
    if (man.k === 'flank') { tx = e!.x + Math.cos(man.th) * man.dist; ty = e!.y + Math.sin(man.th) * man.dist; tx = clamp(tx, ARENA.x0 + 22, ARENA.x1 - 22); ty = clamp(ty, ARENA.y0 + 22, ARENA.y1 - 22); }
    const ld = hyp(tx - m.x, ty - m.y) || 1;
    vx = (tx - m.x) / ld; vy = (ty - m.y) / ld; boost = 1.1; radial = 0; orbitW = 0;
    if (man.k === 'flank' && ld < 12) man.until = 0;
  } else {
    const want = man.k === 'rush' ? Math.min(desired, 30) : man.dist;
    radial = clamp((dist - want) / 14, -1, 1);
    orbitW = man.k === 'strafe' ? 1.05 : man.k === 'kite' ? 0.55 : 0.5;
    if (man.k === 'rush') boost = 1.12;
    if (man.k === 'kite') boost = 1.06;
    if (Math.abs(radial) > 0.8) orbitW *= 0.6;
    vx = toE.x * radial - toE.y * m.orbit * orbitW; vy = toE.y * radial + toE.x * m.orbit * orbitW;
  }
  // Kristall holen: Monster der KI sind gierig, das eigene nur manchmal (den Rest übernimmt der Spieler per Tippen)
  const greed = tr.auto || tr.side === 1 ? 0.85 : 0.4;
  let goal: { x: number; y: number } | null = null, gd = 1e9;
  for (const pk of b.pickups) {
    if (!m.decided.has(pk.id)) { m.decided.add(pk.id); if (rng.chance(greed * (pk.kind === 'heal' ? (m.hpFrac < 0.75 ? 1.15 : 0.5) : 1))) m.want.add(pk.id); }
    const d = hyp(pk.x - m.x, pk.y - m.y);
    if (m.want.has(pk.id) && d < gd && d < 200 && pk.life > d / (m.baseSpeed * 0.9) + 0.5) { gd = d; goal = pk; }
  }
  if (goal && !ord) { const l = hyp(goal.x - m.x, goal.y - m.y) || 1; vx = (goal.x - m.x) / l; vy = (goal.y - m.y) / l; boost = 1.12; }
  // Befehl des Spielers hat Vorrang
  if (ord) {
    if (ord.kind === 'attack') {
      const want = Math.min(desired, 46), rad = clamp((dist - want) / 14, -1, 1);
      vx = toE.x * rad - toE.y * m.orbit * 0.35; vy = toE.y * rad + toE.x * m.orbit * 0.35; boost = 1.15;
    } else {
      const dx2 = ord.x - m.x, dy2 = ord.y - m.y, l = hyp(dx2, dy2) || 1;
      if (ord.kind === 'hold' && l < 7) { vx = 0; vy = 0; boost = 0; }   // Stellung gehalten: stehen bleiben
      else { const k = ord.kind === 'hold' ? Math.min(1, l / 14) : 1; vx = (dx2 / l) * k; vy = (dy2 / l) * k; boost = 1.12; }
    }
  }
  if (punish && !ord) { vx = toE.x * 0.95; vy = toE.y * 0.95; boost = 1.1; }
  else if (threatened && !ord) { vx = -toE.x * 0.9 - toE.y * m.orbit * 0.6; vy = -toE.y * 0.9 + toE.x * m.orbit * 0.6; boost = 1.12; }
  if (m.retreatT > 0 && !ord) { vx = -toE.x - toE.y * m.orbit * 0.5; vy = -toE.y + toE.x * m.orbit * 0.5; boost = 1.08; }
  // Unwetter: aus den markierten Kreisen laufen (die KI meist, das eigene Monster nur manchmal – sonst hilft der Spieler)
  const care = tr.auto || tr.side === 1 ? 0.8 : 0.4;
  for (const hz of b.hazards) {
    if (hz.done) continue;
    if (!m.decided.has(hz.id)) { m.decided.add(hz.id); if (rng.chance(care)) m.want.add(hz.id); }
    const hx = m.x - hz.x, hy = m.y - hz.y, hd = hyp(hx, hy) || 1;
    if (m.want.has(hz.id) && hd < hz.r + 18 && !ord) { vx = (hx / hd) * 2.4; vy = (hy / hd) * 2.4; boost = 1.2; }
  }
  // weiche Abstoßung: nie ineinander stehen
  const sep = e!.sp.radius + m.sp.radius + 14;
  if (dist < sep && !punish) { const k = (sep - dist) / sep; vx -= toE.x * k * 1.6; vy -= toE.y * k * 1.6; }

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
  const spd = spdMul * boost * (m.speedT > 0 ? 1.35 : 1) * m.baseSpeed * stageMul(m.stage.spe) * (m.para > 0 ? 0.55 : 1) * (0.92 + 0.12 * T.aggr) * (m.own ? TERRAIN_BONUS : m.terrain === 'grass' ? GRASS_SLOW : 1) * (m.hpFrac < 0.25 ? 1.08 : 1);
  const ease = ord ? 18 : 9;   // mit Befehl direkter reagieren
  m.vx += (vx * spd - m.vx) * Math.min(1, dt * ease);
  m.vy += (vy * spd - m.vy) * Math.min(1, dt * ease);
  m.face = dx >= 0 ? 1 : -1;
  integrate(m, dt);
}

/** Nächstes Bewegungsmanöver nach Wesen, Taktik und Attacken-Art wählen. */
function pickManeuver(b: Battle, m: Mon, e: Mon, N: (typeof NATURES)[string], tactic: string, meleeish: boolean): NonNullable<Mon['man']> {
  const rng = b.rng;
  const W: Record<string, Record<string, number>> = {
    brave: { rush: 1.6, flank: 2, strafe: 1.5, kite: 0.6, roam: 1.3 }, timid: { rush: 0.4, flank: 1.2, strafe: 2, kite: 3, roam: 1.8 },
    hasty: { rush: 1.3, flank: 3, strafe: 2, kite: 1.2, roam: 2.6 }, sly: { rush: 0.8, flank: 2.6, strafe: 1.5, kite: 1.7, roam: 1.5 },
    calm: { rush: 1, flank: 1.6, strafe: 2, kite: 1.2, roam: 1.4 },
  };
  const w = { ...(W[m.nature] ?? W.calm) };
  if (tactic === 'attack') { w.rush *= 1.7; w.kite *= 0.5; } else if (tactic === 'defend') { w.kite *= 1.7; w.roam *= 1.4; w.rush *= 0.5; } else if (tactic === 'counter') { w.strafe *= 1.8; w.flank *= 1.2; }
  if (meleeish) { w.kite *= 0.35; w.roam *= 0.5; w.rush *= 1.3; w.flank *= 1.2; }
  if (m.hpFrac < 0.35) { w.kite *= 1.6; w.roam *= 1.5; w.rush *= 0.6; }
  let tot = 0; for (const k in w) tot += w[k];
  let r = rng.next() * tot, k = 'strafe'; for (const key in w) { r -= w[key]; if (r <= 0) { k = key; break; } }
  const ang = Math.atan2(m.y - e.y, m.x - e.x), sign = (rng.chance(0.5) ? 1 : -1) as 1 | -1;
  const man = { k: k as NonNullable<Mon['man']>['k'], until: b.t + rng.range(0.9, 2.0) / (0.8 + 0.4 * N.orbit), dist: 70, th: ang, sign, tx: 0, ty: 0 };
  if (k === 'strafe') man.dist = rng.range(70, 125);
  else if (k === 'kite') { man.dist = rng.range(135, 195); man.until = b.t + rng.range(1.2, 2.2); }
  else if (k === 'rush') man.until = b.t + rng.range(0.9, 1.6);
  else if (k === 'flank') { man.th = ang + sign * rng.range(1.3, 2.3); man.dist = rng.range(70, 125); man.until = b.t + rng.range(1.3, 2.2); }
  else { // roam: zufälliger Punkt in der Arena, nicht zu nah am Gegner
    for (let i = 0; i < 8; i++) {
      const tx = rng.range(ARENA.x0 + 28, ARENA.x1 - 28), ty = rng.range(ARENA.y0 + 28, ARENA.y1 - 28);
      if (hyp(tx - e.x, ty - e.y) > 62 && !b.rocks.some((f) => hyp(tx - f.x, ty - f.y) < f.r + 16)) { man.tx = tx; man.ty = ty; break; }
      man.tx = tx; man.ty = ty;
    }
    man.until = b.t + 2.6;
  }
  return man;
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
  if (tr.passive) return;   // reine Automatik: nur Wechsel nach K.O. (oben), keine Befehle
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

/**
 * Liga-Logik (ohne Oberfläche, testbar): Karte, Gegner, Belohnungen, Heilung.
 */
import { Rng } from './core/util';
import { Mon, Trainer, computeStats, FOCUS, sizeHpMul } from './battle/mon';
import { SPECIES, BASE_IDS, NATURE_IDS, formAt, baseForm, learnedMoves, MAX_MOVES } from './data/species';
import { MOVES } from './data/moves';
import { typeEffectiveness } from './data/types';
import { bondLevel } from './data/synergy';
import type { CupDef } from './data/cups';
import { AMULET_IDS, AMULETS, PRICES } from './data/items';
import { BOSSES, LAYERS, MOD_IDS, NodeKind, TRAINER_DEFS, TrainerDef, RIVAL, STYLE_INFO, MAX_TIER } from './data/league';
import { MAP_IDS } from './data/maps';
import type { MapNode, Owned, Run, Save, ShopStock, ChestLoot } from './state';
import { CHEST, ROSTER_MAX, newOwned, markSeen } from './state';

// ───────────── Karte ─────────────
export function generateMap(seed: number, tier: number): MapNode[][] {
  const rng = new Rng(seed);
  const layers: MapNode[][] = [];
  let id = 0;
  for (let L = 0; L < LAYERS; L++) {
    const n = L === LAYERS - 1 ? 1 : L === 0 ? 2 : rng.int(2, 3);
    const kinds: NodeKind[] = [];
    for (let i = 0; i < n; i++) {
      let k: NodeKind;
      if (L === LAYERS - 1) k = 'boss';
      else if (L === 0) k = 'battle';
      else {
        const w: [NodeKind, number][] = [['battle', 0.42], ['elite', L >= 3 ? 0.15 : 0], ['rest', 0.18], ['shop', 0.12], ['event', 0.16]];
        let r = rng.next() * w.reduce((a, b) => a + b[1], 0); k = 'battle';
        for (const [kk, ww] of w) { r -= ww; if (r <= 0) { k = kk; break; } }
      }
      kinds.push(k);
    }
    if (L === 4) kinds[rng.int(0, n - 1)] = 'rival';       // dein Rivale wartet in der Mitte der Liga
    if (L === LAYERS - 2 && !kinds.includes('rest')) kinds[rng.int(0, n - 1)] = 'rest';       // vor dem Boss: Rastplatz
    if (L === 3 && !kinds.some((k) => k === 'rest' || k === 'shop')) kinds[rng.int(0, n - 1)] = rng.chance(0.5) ? 'rest' : 'shop';
    if (L >= 1 && L < LAYERS - 1 && !kinds.some((k) => k === 'battle' || k === 'elite' || k === 'rival')) kinds[0] = 'battle';
    layers.push(kinds.map((kind, idx) => ({ id: id++, layer: L, idx, kind, next: [] })));
  }
  // Verbindungen
  for (let L = 0; L < LAYERS - 1; L++) {
    const cur = layers[L], nxt = layers[L + 1];
    for (const nd of cur) {
      const j = Math.round((nd.idx * (nxt.length - 1)) / Math.max(1, cur.length - 1));
      const set = new Set<number>([j]);
      if (nxt.length > 1 && rng.chance(0.55)) set.add(Math.max(0, Math.min(nxt.length - 1, j + (rng.chance(0.5) ? 1 : -1))));
      nd.next = [...set].map((x) => nxt[x].id);
    }
    for (const t of nxt) if (!cur.some((c) => c.next.includes(t.id))) {            // jeder Knoten braucht einen Zugang
      const c = cur.reduce((a, b) => (Math.abs(b.idx / Math.max(1, cur.length - 1) - t.idx / Math.max(1, nxt.length - 1)) < Math.abs(a.idx / Math.max(1, cur.length - 1) - t.idx / Math.max(1, nxt.length - 1)) ? b : a));
      c.next.push(t.id);
    }
  }
  void tier;
  return layers;
}

export function nodeById(run: Run, id: number): MapNode { for (const L of run.layers) for (const n of L) if (n.id === id) return n; throw new Error('Knoten fehlt'); }

export function reachable(run: Run): MapNode[] {
  if (run.at === null) return run.layers[0];
  const cur = nodeById(run, run.at);
  return cur.layer + 1 < run.layers.length ? cur.next.map((i) => nodeById(run, i)) : [];
}
export const isDone = (run: Run, n: MapNode) => run.at !== null && n.layer <= nodeById(run, run.at).layer;

// ───────────── Lauf ─────────────
export const maxHpOf = (o: Owned) => computeStats(o.sp, o.level, o.bonus, o.item).maxHp;

export function newRun(save: Save, tier: number, seed = (Math.random() * 1e9) | 0): Run {
  const hp: Record<number, number> = {};
  for (const id of save.team) hp[id] = 1;
  return { tier, seed, layers: generateMap(seed, tier), at: null, pending: null, team: [...save.team], hp, earned: 0, won: 0, started: Date.now(), shops: {}, events: {} };
}

export const ownedOf = (save: Save, id: number) => save.mons.find((m) => m.id === id)!;
export const avgLevel = (save: Save, run: Run) => run.team.reduce((a, id) => a + ownedOf(save, id).level, 0) / Math.max(1, run.team.length);

/** KP-Anteil verändern (nur lebende bzw. mit Wiederbelebung). */
export function healFrac(run: Run, id: number, frac: number, revive = false) {
  const cur = run.hp[id] ?? 1;
  if (cur <= 0 && !revive) return false;
  run.hp[id] = Math.min(1, (cur <= 0 ? 0 : cur) + frac);
  return true;
}

// ───────────── Gegner ─────────────
export interface EnemyMon { sp: string; level: number; nature: string; amulet?: string | null; boss?: boolean; hpMul?: number }
export interface EnemySpec {
  kind: 'battle' | 'elite' | 'boss' | 'wild' | 'rival'; name: string; title?: string; mons: EnemyMon[];
  style?: TrainerDef['style']; styleText?: string; quote?: string; look?: string;
  tactic: 'attack' | 'balanced' | 'defend' | 'counter'; mod: string; map: string; coins: number;
  amuletDrop: boolean; recruitChance: number; focusMul: number;
}

export function makeEnemy(save: Save, run: Run, node: MapNode, wild = false): EnemySpec {
  const rng = new Rng(run.seed * 131 + node.id * 17 + (wild ? 7 : 0));
  const tier = run.tier, L = node.layer, avg = avgLevel(save, run);
  const kind: EnemySpec['kind'] = wild ? 'wild' : node.kind === 'elite' ? 'elite' : node.kind === 'boss' ? 'boss' : node.kind === 'rival' ? 'rival' : 'battle';
  const myTypes = run.team.map((id) => SPECIES[ownedOf(save, id).sp]);
  const base = Math.max(5, Math.round(avg) - 3 + Math.floor(tier / 2) + Math.floor(L / 5));
  const ts = Math.max(1, run.team.length);
  let lvl = base, count = Math.min(ts, 1 + Math.floor(L / 3)), tactic: EnemySpec['tactic'] = 'balanced';
  const def = rng.pick(TRAINER_DEFS);
  let name = def.name, title: string | undefined, mod = rng.pick([...MOD_IDS, 'none', 'none']);
  let coins = 40 + tier * 12 + L * 4, drop = false, recruit = 0, focusMul = 1;
  let map = L === 0 && tier === 1 ? 'meadow' : rng.pick(MAP_IDS);
  if (tier === 1 && L <= 2) mod = 'none';   // Einstieg: erst die Arenen kennenlernen, Wetter kommt später
  if (kind === 'elite') { lvl = base + 1; count = Math.min(3, count + (ts >= 2 ? 1 : 0)); tactic = 'attack'; coins = 110 + tier * 20; drop = true; name = 'Elite ' + name; }
  if (kind === 'wild') { lvl = Math.max(5, base - 2); count = 2; coins = 90 + tier * 15; name = 'Wildes Rudel'; mod = 'none'; }
  if (kind === 'rival') { lvl = base + 1 + Math.floor(save.rival.wins / 2); count = ts; tactic = 'balanced'; coins = 140 + tier * 25; drop = true; name = RIVAL.name; title = RIVAL.title; }
  const boss = BOSSES[(tier - 1) % BOSSES.length];
  if (kind === 'boss') { lvl = base + Math.max(-1, tier - 3); count = ts >= 2 ? Math.min(3, ts) : 1; tactic = 'attack'; coins = 260 + tier * 60; drop = true; recruit = 0; name = boss.name; title = boss.title; mod = boss.mod; map = boss.map; focusMul = 1.4; if (ts >= 2) count = Math.min(MAX_TEAM_ENEMY, ts + (tier <= 1 ? 1 : 0)); }
  else if (kind === 'battle' || kind === 'elite') tactic = L >= 2 ? def.style : 'balanced';
  // faire Auswahl in den ersten Etappen: kein Gegner mit Typvorteil
  const fair = BASE_IDS.filter((id) => !myTypes.some((m) => SPECIES[id].moves.some((mv) => typeEffectiveness(MOVES[mv].type, m.types) > 1)));
  let pool = L <= 1 && tier === 1 && fair.length ? fair : BASE_IDS;
  if ((kind === 'battle' || kind === 'elite') && def.type && L >= 1) pool = BASE_IDS.filter((id) => SPECIES[id].types.includes(def.type!));
  if (kind === 'boss' && boss.type) pool = BASE_IDS.filter((id) => SPECIES[id].types.includes(boss.type!));
  const mons: EnemyMon[] = [];
  for (let i = 0; i < count; i++) {
    const l = lvl + (i === count - 1 && count > 1 ? 1 : 0);
    const sp = formAt(rng.pick(pool), l);
    let nature = kind === 'wild' ? rng.pick(NATURE_IDS) : kind === 'rival' ? rng.pick(NATURE_IDS) : rng.pick(def.natures);
    mons.push({ sp, level: l, nature, amulet: (kind === 'elite' || kind === 'boss') && rng.chance(0.7) ? rng.pick(AMULET_IDS) : null, boss: kind === 'boss' && i === 0, hpMul: (kind === 'boss' && tier === 1 ? 0.8 : 1) + 0.04 * (tier - 1) });
  }
  // Rivale: wählt sein erstes Monster so, dass es gegen dein Anführer-Monster im Vorteil ist
  if (kind === 'rival') {
    const lead = SPECIES[ownedOf(save, run.team[0]).sp];
    const beats = (a: string, b: string) => (a === 'fire' && b === 'grass') || (a === 'grass' && b === 'water') || (a === 'water' && b === 'fire');
    const counter = BASE_IDS.find((id) => beats(SPECIES[id].types[0], lead.types[0]));
    if (counter) mons[0].sp = formAt(counter, mons[0].level);
    mons.forEach((m) => { m.amulet = rng.chance(0.5) ? rng.pick(AMULET_IDS) : null; });
  }
  const showDef = kind === 'battle' || kind === 'elite';
  return {
    kind, name, title, mons, tactic, mod, map, coins, amuletDrop: drop, recruitChance: recruit, focusMul,
    style: showDef ? def.style : kind === 'rival' ? 'balanced' : undefined, styleText: showDef ? STYLE_INFO[def.style] : kind === 'rival' ? 'RIVALE: STELLT SEIN TEAM GEGEN DEINES AUF' : undefined,
    quote: showDef ? def.quote : kind === 'rival' ? RIVAL.quotes[(save.rival.wins + save.rival.losses) % RIVAL.quotes.length] : undefined, look: showDef ? def.look : undefined,
  };
}

/** Attacken eines Gegners: der stärkste gelernte Spezialangriff plus die zuletzt gelernten übrigen. */
export function enemyMoves(sp: string, level: number): string[] {
  const known = learnedMoves(sp, level).map((id) => MOVES[id]);
  const special = [...known].reverse().find((m) => m.special);
  const rest = known.filter((m) => !m.special).slice(-(MAX_MOVES - (special ? 1 : 0)));
  return [...rest, ...(special ? [special] : [])].map((m) => m.id);
}

/** Kampfgröße = größeres der beiden Teams (bestimmt die KP-Skalierung, damit Kämpfe 1–2 Minuten dauern). */
export const battleSize = (teamSize: number, spec: EnemySpec) => Math.max(teamSize, spec.mons.length);
/** Kampflänge nach Bedeutung: normale Kämpfe kürzer, Elite etwas, Bosse deutlich länger. */
export const MAX_TEAM_ENEMY = 5;
export const lenMulOf = (spec: EnemySpec) => (spec.kind === 'boss' ? 1.35 : spec.kind === 'elite' || spec.kind === 'rival' ? 1.12 : spec.kind === 'wild' ? 0.9 : 0.85);

/** Gegner werten ihre Attacken mit dem Level auf (ohne Spezialisierungen), damit sie mithalten. */
export function enemyMoveStates(sp: string, level: number) {
  const lv = Math.max(1, Math.min(4, 1 + Math.floor((level - 9) / 5))), out: Record<string, { lv: number; perks: string[] }> = {};
  for (const id of enemyMoves(sp, level)) out[id] = { lv, perks: [] };
  return out;
}

export function enemyTrainer(spec: EnemySpec, size = 3, len = 1): Trainer {
  const team = spec.mons.map((m) => new Mon(m.sp, m.level, m.nature, { amulet: m.amulet, boss: m.boss, hpMul: (m.hpMul ?? 1) * sizeHpMul(size) * len, moves: enemyMoves(m.sp, m.level), moveStates: enemyMoveStates(m.sp, m.level) }));
  const tr = new Trainer(1, spec.name, team, true);
  tr.tactic = spec.tactic; tr.baseTactic = spec.tactic; tr.focusRegenMul = spec.focusMul; tr.potions = spec.kind === 'boss' ? 2 : spec.kind === 'elite' ? 1 : 0;
  tr.focus = FOCUS.start;
  return tr;
}

/** Spieler-Team aus dem Lauf (Reihenfolge = Aufstellung, K.O.-Monster bleiben K.O.). */
export function playerTrainer(save: Save, run: Pick<Run, 'team' | 'hp'>, size = 3, len = 1): Trainer {
  const team = run.team.map((id) => {
    const o = ownedOf(save, id);
    const m = new Mon(o.sp, o.level, o.nature, { bonus: o.bonus, amulet: o.item, hpFrac: run.hp[id] ?? 1, moves: o.moves, moveStates: o.mv, hpMul: sizeHpMul(size) * len, bondLvl: bondLevel(o.bond) });
    m.ownerId = id; return m;
  });
  const tr = new Trainer(0, 'Du', team, false);
  tr.potions = save.inv.potion; tr.supers = save.inv.super; tr.focusPots = save.inv.focus; tr.elixirs = save.inv.elixir;
  return tr;
}

// ───────────── Belohnungen ─────────────
export function randomAmulets(rng: Rng, n: number, exclude: string[] = []): string[] {
  const pool = AMULET_IDS.filter((a) => !exclude.includes(a));
  const out: string[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
  return out;
}

export function makeShopStock(run: Run, node: MapNode): ShopStock {
  const rng = new Rng(run.seed * 977 + node.id * 31);
  const disc = 0.85;
  return {
    potion: 3, super: 1, revive: 1,
    amulets: randomAmulets(rng, 2).map((id) => ({ id, price: Math.round(AMULETS[id].price * disc) })),
  };
}
export const shopPrice = (k: 'potion' | 'super' | 'revive') => Math.round(PRICES[k] * 0.85);

export function tierUnlocked(save: Save) { return Math.min(MAX_TIER, save.tier); }
export { baseForm };

/** Nach jedem Sieg erholen sich lebende Monster etwas. */
export const WIN_HEAL = 0.2;

/** Frei definierter Gegner (Turm, Übung). */
export function customEnemy(seed: number, o: { name: string; level: number; count: number; coins: number; boss?: boolean; hpMul?: number; kind?: EnemySpec['kind']; pool?: string[]; mod?: string; map?: string; tactic?: EnemySpec['tactic'] }): EnemySpec {
  const rng = new Rng(seed);
  const mons: EnemyMon[] = [];
  for (let i = 0; i < o.count; i++) mons.push({ sp: formAt(rng.pick(o.pool ?? BASE_IDS), o.level), level: o.level, nature: rng.pick(NATURE_IDS), amulet: o.boss ? rng.pick(AMULET_IDS) : null, boss: o.boss && i === 0, hpMul: o.hpMul });
  return { kind: o.kind ?? 'battle', name: o.name, mons, tactic: o.tactic ?? 'balanced', mod: o.mod ?? 'none', map: o.map ?? rng.pick(MAP_IDS), coins: o.coins, amuletDrop: false, recruitChance: 0, focusMul: 1 };
}
/** Erfahrung je Kampfart */
export const XP_MON: Record<EnemySpec['kind'], number> = { battle: 16, wild: 18, elite: 26, rival: 30, boss: 45 };
export const XP_PLAYER: Record<EnemySpec['kind'], number> = { battle: 25, wild: 28, elite: 40, rival: 55, boss: 90 };

/** Öffnet eine Monsterkiste (verbraucht einen Schlüssel). Monster sind selten; nach einigen Nieten gibt es eine Garantie. */
export function openChest(save: Save, rnd: () => number = Math.random): ChestLoot | null {
  if (save.inv.keys <= 0) return null;
  save.inv.keys--; save.chest.opened++;
  const avg = save.team.reduce((a, id) => a + (save.mons.find((m) => m.id === id)?.level ?? 10), 0) / Math.max(1, save.team.length);
  const room = save.mons.length < ROSTER_MAX;
  const r = rnd();
  if (room && (r < CHEST.monster || save.chest.miss >= CHEST.pity - 1)) {
    const level = Math.max(5, Math.round(avg) - 2), sp = formAt(BASE_IDS[Math.floor(rnd() * BASE_IDS.length)], level);
    save.mons.push(newOwned(save.nextId++, sp, NATURE_IDS[Math.floor(rnd() * NATURE_IDS.length)], level)); markSeen(save, sp);
    save.chest.miss = 0; save.stats.recruits++;
    return { kind: 'monster', sp, level };
  }
  save.chest.miss++;
  if (r < CHEST.monster + CHEST.amulet) { const id = AMULET_IDS[Math.floor(rnd() * AMULET_IDS.length)]; save.inv.amulets.push(id); return { kind: 'amulet', id }; }
  const items = ['potion', 'potion', 'super', 'revive', 'focus', 'elixir', 'books', 'books'] as const, item = items[Math.floor(rnd() * items.length)];
  const n = item === 'potion' ? 2 : 1, coins = 120 + Math.floor(rnd() * 140);
  save.inv[item] += n; save.coins += coins;
  return { kind: 'items', coins, item, n };
}

/** Gegner einer Runde: Level und Teamgröße wachsen von Runde zu Runde. */
const MAP_OF: Partial<Record<import('./data/types').TypeId, string>> = { fire: 'volcano', water: 'lake', grass: 'jungle' };
const BEATS: Record<string, string> = { fire: 'water', water: 'grass', grass: 'fire' };   // Typ, der gegen den Schlüssel gewinnt
export function cupRoundSpec(save: Save, cup: CupDef, team: number[], round: number, seed: number): EnemySpec {
  const n = cup.rounds.length, r = round, rng = new Rng(seed + r * 101);
  const avg = team.reduce((a, id) => a + ownedOf(save, id).level, 0) / team.length;
  const level = Math.max(5, Math.round(avg) + cup.lvlOff + Math.floor(r / 2));
  const count = Math.min(team.length, Math.max(1, Math.round((team.length * (r + 1)) / n)));
  const final = r === n - 1, rival = !!cup.rival && final;
  const def = rng.pick(TRAINER_DEFS);
  let pool = cup.type ? BASE_IDS.filter((id) => SPECIES[id].types.includes(cup.type!)) : BASE_IDS;
  let counterPool: string[] | null = null;
  let name = def.name, tactic = r >= 1 ? def.style : 'balanced';
  if (rival) {
    const lead = SPECIES[ownedOf(save, team[0]).sp].types[0];
    const want = BEATS[lead]; const cp = BASE_IDS.filter((id) => SPECIES[id].types[0] === want);
    if (cp.length) counterPool = cp; name = RIVAL.name; tactic = 'balanced';
  }
  const spec = customEnemy(seed + r * 7919, { name, level: level + (final ? 1 : 0) + (rival ? Math.floor(save.rival.wins / 2) : 0), count, coins: Math.round(cup.coins * (0.5 + 0.25 * r)), kind: rival ? 'rival' : final ? 'elite' : 'battle', mod: cup.mod, map: (cup.type && MAP_OF[cup.type]) || MAP_IDS[(seed + r) % MAP_IDS.length], pool, tactic: tactic as EnemySpec['tactic'] });
  if (rival && counterPool) spec.mons[0].sp = formAt(rng.pick(counterPool), spec.mons[0].level);
  if (rival) { spec.title = RIVAL.title; spec.style = 'balanced'; spec.styleText = 'RIVALE: STELLT SEIN TEAM GEGEN DEINES AUF'; spec.quote = RIVAL.quotes[(save.rival.wins + save.rival.losses) % RIVAL.quotes.length]; spec.focusMul = 1.15; }
  else { spec.style = def.style; spec.styleText = STYLE_INFO[def.style]; spec.quote = def.quote; if (final) spec.focusMul = 1.15; }
  return spec;
}


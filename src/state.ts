import { Bonus, noBonus } from './battle/mon';
import { SPECIES, starterMoves, learnedMoves, learnset, MAX_MOVES } from './data/species';
import type { NodeKind } from './data/league';
import type { MoveState } from './data/mastery';
import { MOVES } from './data/moves';

export interface Owned {
  id: number; sp: string; nature: string; level: number; xp: number;
  moves: string[];                       // ausgerüstet, in Rangfolge
  extra: string[];                       // per Schriftrolle gelernt
  mv: Record<string, MoveState>;         // Stufe/Spezialisierung/Regel je Attacke
  ap: number;                            // freie Attackenpunkte
  bonus: Bonus; item: string | null;
}
export interface Inventory { potion: number; super: number; revive: number; focus: number; elixir: number; keys: number; books: number; scrolls: string[]; amulets: string[] }

export interface MapNode { id: number; layer: number; idx: number; kind: NodeKind; next: number[] }
export interface ShopStock { potion: number; super: number; revive: number; amulets: { id: string; price: number }[] }

/** Ein Liga-Lauf: Karte, Team-KP (Anteil 0..1, 0 = K.O.) und Fortschritt. */
export interface Run {
  tier: number; seed: number;
  layers: MapNode[][];
  at: number | null;              // zuletzt abgeschlossener Knoten
  pending: number | null;         // gewählter, noch nicht abgeschlossener Knoten
  team: number[];                 // Aufstellung (Owned-IDs)
  hp: Record<number, number>;
  earned: number; won: number; started: number;
  shops: Record<number, ShopStock>;
  events: Record<number, string>;
}

export interface Save {
  v: 5; coins: number; tier: number; best: number; nextId: number;
  mons: Owned[]; team: number[]; inv: Inventory; sound: boolean;
  run: Run | null;
  stats: { runs: number; clears: number; battles: number; wins: number; recruits: number; evolves: number; elites: number; stars: number; towerBest: number; learned: number };
  pl: { lvl: number; xp: number };                 // Spielerlevel
  chest: { opened: number; miss: number };         // Kisten: geöffnet / ohne Monster in Folge
  raidLv: number;                                  // Raid-Stufe (steigt mit jedem Sieg)
  ach: string[];                                   // abgeholte Erfolge
  seen: string[];                                  // bekannte Monster (Sammlung)
  daily: { last: string; streak: number };
  opt: { vibe: boolean; music: boolean; hints: boolean };
  tut: { guide: boolean; battle: boolean };
}

export const KEY = 'arena-manager-v5';
export const OLD_KEY = 'arena-manager-v4';
export const MAX_TEAM = 3;
export const ROSTER_MAX = 12;

export const newOwned = (id: number, sp: string, nature: string, level: number): Owned => ({ id, sp, nature, level, xp: 0, moves: starterMoves(sp, level), extra: [], mv: {}, ap: Math.max(1, level - 9), bonus: noBonus(), item: null });

export const newSave = (): Save => ({
  v: 5, coins: 250, tier: 1, best: 0, nextId: 1, mons: [], team: [],
  inv: { potion: 3, super: 0, revive: 1, focus: 1, elixir: 0, keys: 0, books: 0, scrolls: [], amulets: [] }, sound: true, run: null,
  stats: { runs: 0, clears: 0, battles: 0, wins: 0, recruits: 0, evolves: 0, elites: 0, stars: 0, towerBest: 0, learned: 0 },
  pl: { lvl: 1, xp: 0 }, chest: { opened: 0, miss: 0 }, raidLv: 0,
  ach: [], seen: [], daily: { last: '', streak: 0 }, opt: { vibe: true, music: true, hints: true }, tut: { guide: false, battle: false },
});

function sanitize(s: Save): Save {
  s.mons = s.mons.filter((m) => SPECIES[m.sp]).map((m) => {
    const extra = (Array.isArray(m.extra) ? m.extra : []).filter((x) => MOVES[x]);
    const known = [...learnedMoves(m.sp, m.level), ...extra];
    let moves = (Array.isArray(m.moves) ? m.moves : []).filter((x) => known.includes(x)).slice(0, MAX_MOVES);
    if (!moves.length) moves = starterMoves(m.sp, m.level);
    return { ...m, xp: m.xp ?? 0, moves, extra, mv: m.mv ?? {}, ap: m.ap ?? Math.max(1, m.level - 9), bonus: { ...noBonus(), ...(m.bonus ?? {}) }, item: m.item ?? null };
  });
  s.team = (Array.isArray(s.team) ? s.team : []).filter((id) => s.mons.some((m) => m.id === id)).slice(0, MAX_TEAM);
  if (!s.team.length && s.mons.length) s.team = [s.mons[0].id];
  const inv: Partial<Inventory> = s.inv ?? {};
  s.inv = { potion: inv.potion ?? 0, super: inv.super ?? 0, revive: inv.revive ?? 0, focus: inv.focus ?? 1, elixir: inv.elixir ?? 0, keys: inv.keys ?? 0, books: inv.books ?? 0, scrolls: (inv.scrolls ?? []).filter((x) => MOVES[x]), amulets: inv.amulets ?? [] };
  const d = newSave();
  s.stats = { ...d.stats, ...(s.stats ?? {}) }; s.pl = { ...d.pl, ...(s.pl ?? {}) }; s.chest = { ...d.chest, ...(s.chest ?? {}) }; s.raidLv = s.raidLv ?? 0; s.opt = { ...d.opt, ...(s.opt ?? {}) }; s.daily = { ...d.daily, ...(s.daily ?? {}) }; s.tut = { ...d.tut, ...(s.tut ?? {}) };
  s.ach = Array.isArray(s.ach) ? s.ach : []; s.seen = Array.isArray(s.seen) ? s.seen.filter((x) => SPECIES[x]) : [];
  for (const m of s.mons) if (!s.seen.includes(m.sp)) s.seen.push(m.sp);
  // laufender Lauf mit unbekannten Monstern -> verwerfen
  if (s.run && (!Array.isArray(s.run.layers) || s.run.team.some((id) => !s.mons.some((m) => m.id === id)))) s.run = null;
  return s;
}

export const SLOTS = 3;
const slotKey = (i: number) => 'arena-manager-slot-' + i;
const ACTIVE = 'arena-manager-active';

/** Alte Einzel-Spielstände in Platz 1 übernehmen (einmalig). */
function migrate(storage: Storage | null) {
  try {
    if (!storage) return;
    for (let i = 1; i <= SLOTS; i++) if (storage.getItem(slotKey(i))) return;
    const v5 = storage.getItem(KEY);
    if (v5) { storage.setItem(slotKey(1), v5); return; }
    const old = storage.getItem(OLD_KEY);
    if (old) {
      const o = JSON.parse(old);
      if (o && o.v === 4 && Array.isArray(o.mons)) {
        const s = newSave();
        s.coins = o.coins ?? s.coins; s.nextId = o.nextId ?? 1; s.sound = o.sound !== false;
        s.mons = o.mons.map((m: any) => newOwned(m.id, m.sp, m.nature, m.level)); s.team = o.team ?? [];
        s.inv.potion = o.items?.potion ?? 3; s.inv.super = o.items?.super ?? 0;
        storage.setItem(slotKey(1), JSON.stringify(s));
      }
    }
  } catch { /* ignorieren */ }
}

export function activeSlot(storage: Storage | null): number {
  migrate(storage);
  try { const n = Number(storage?.getItem(ACTIVE)); if (n >= 1 && n <= SLOTS) return n; } catch { /* */ }
  return 1;
}
export function setActiveSlot(storage: Storage | null, i: number) { try { storage?.setItem(ACTIVE, String(i)); } catch { /* */ } }

/** Lädt einen Spielstand-Platz (leer = null). */
export function loadSlot(storage: Storage | null, i: number): Save | null {
  migrate(storage);
  try {
    const raw = storage?.getItem(slotKey(i));
    if (raw) { const s = JSON.parse(raw); if (s && s.v === 5 && Array.isArray(s.mons)) return sanitize({ ...newSave(), ...s }); }
  } catch { /* ignorieren */ }
  return null;
}
export function persist(s: Save, storage: Storage | null, slot = 1) { try { storage?.setItem(slotKey(slot), JSON.stringify(s)); } catch { /* ignorieren */ } }
export function deleteSlot(storage: Storage | null, i: number) { try { storage?.removeItem(slotKey(i)); } catch { /* */ } }

export const markSeen = (s: Save, sp: string) => { if (!s.seen.includes(sp)) s.seen.push(sp); };

/** Trainer-Titel nach Spielerlevel */
export const RANKS = [
  { n: 'Neuling', w: 1 }, { n: 'Rekrut', w: 3 }, { n: 'Kämpfer', w: 6 }, { n: 'Veteran', w: 10 },
  { n: 'Profi', w: 15 }, { n: 'Meister', w: 22 }, { n: 'Legende', w: 30 },
];
export function rankOf(lvl: number) { let i = 0; while (i + 1 < RANKS.length && lvl >= RANKS[i + 1].w) i++; return RANKS[i]; }

// ───────────── Erfahrung ─────────────
export const xpNeed = (level: number) => 30 + level * 5;            // Monster: ~5 Siege je Level am Anfang, später mehr
export const plNeed = (lvl: number) => 80 + 40 * lvl;               // Spieler
export const MAX_LEVEL = 50;

export interface XpResult { levels: number; evolved: { from: string; to: string }[]; learned: string[] }
/** Gibt einem Monster Erfahrung: Levelaufstieg, Entwicklung, neue Attacken (werden ausgerüstet, solange Platz ist). */
export function gainXp(s: Save, o: Owned, amount: number): XpResult {
  const res: XpResult = { levels: 0, evolved: [], learned: [] };
  o.xp += amount;
  while (o.level < MAX_LEVEL && o.xp >= xpNeed(o.level)) {
    o.xp -= xpNeed(o.level); o.level++; res.levels++; o.ap++;
    const e = SPECIES[o.sp].evolvesTo;
    if (e && o.level >= e.level) { res.evolved.push({ from: o.sp, to: e.id }); o.sp = e.id; markSeen(s, e.id); s.stats.evolves++; }
    for (const [mv, l] of learnset(o.sp)) if (l === o.level) { res.learned.push(mv); s.stats.learned++; if (o.moves.length < MAX_MOVES && !o.moves.includes(mv)) o.moves.push(mv); }
  }
  return res;
}
export interface PlResult { levels: number; coins: number; potions: number; revives: number; keys: number }
/** Spieler-Erfahrung mit Belohnungen je Level. */
export function gainPlayerXp(s: Save, amount: number): PlResult {
  const r: PlResult = { levels: 0, coins: 0, potions: 0, revives: 0, keys: 0 };
  s.pl.xp += amount;
  while (s.pl.xp >= plNeed(s.pl.lvl)) {
    s.pl.xp -= plNeed(s.pl.lvl); s.pl.lvl++; r.levels++;
    const c = 60 + 15 * s.pl.lvl; r.coins += c; s.coins += c;
    if (s.pl.lvl % 2 === 0) { r.potions++; s.inv.potion++; }
    if (s.pl.lvl % 5 === 0) { r.revives++; s.inv.revive++; }
    if (s.pl.lvl % 4 === 0) { r.keys++; s.inv.keys++; }
  }
  return r;
}
export const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
export const yesterdayStr = () => { const d = new Date(Date.now() - 864e5); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

// ───────────── Kisten ─────────────
export const CHEST = { monster: 0.2, amulet: 0.28, pity: 6 };   // Monster-Chance, Amulett-Chance, Garantie nach so vielen Kisten ohne Monster
export type ChestLoot = { kind: 'monster'; sp: string; level: number } | { kind: 'amulet'; id: string } | { kind: 'items'; coins: number; item: 'potion' | 'super' | 'revive' | 'focus' | 'elixir' | 'books'; n: number };
/** Alle Attacken, die ein Monster kennt (gelernt + Schriftrollen). */
export const knownMoves = (o: Owned) => [...learnedMoves(o.sp, o.level), ...o.extra.filter((x) => !learnedMoves(o.sp, o.level).includes(x))];

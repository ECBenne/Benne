import { Bonus, noBonus } from './battle/mon';
import { SPECIES } from './data/species';
import type { NodeKind } from './data/league';

export interface Owned { id: number; sp: string; nature: string; level: number; bonus: Bonus; item: string | null }
export interface Inventory { potion: number; super: number; revive: number; amulets: string[] }

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
  stats: { runs: number; clears: number; battles: number; recruits: number };
}

export const KEY = 'arena-manager-v5';
export const OLD_KEY = 'arena-manager-v4';
export const MAX_TEAM = 3;
export const ROSTER_MAX = 12;

export const newOwned = (id: number, sp: string, nature: string, level: number): Owned => ({ id, sp, nature, level, bonus: noBonus(), item: null });

export const newSave = (): Save => ({
  v: 5, coins: 250, tier: 1, best: 0, nextId: 1, mons: [], team: [],
  inv: { potion: 3, super: 0, revive: 1, amulets: [] }, sound: true, run: null,
  stats: { runs: 0, clears: 0, battles: 0, recruits: 0 },
});

function sanitize(s: Save): Save {
  s.mons = s.mons.filter((m) => SPECIES[m.sp]).map((m) => ({ ...m, bonus: { ...noBonus(), ...(m.bonus ?? {}) }, item: m.item ?? null }));
  s.team = (Array.isArray(s.team) ? s.team : []).filter((id) => s.mons.some((m) => m.id === id)).slice(0, MAX_TEAM);
  if (!s.team.length && s.mons.length) s.team = [s.mons[0].id];
  const inv: Partial<Inventory> = s.inv ?? {};
  s.inv = { potion: inv.potion ?? 0, super: inv.super ?? 0, revive: inv.revive ?? 0, amulets: inv.amulets ?? [] };
  // laufender Lauf mit unbekannten Monstern -> verwerfen
  if (s.run && (!Array.isArray(s.run.layers) || s.run.team.some((id) => !s.mons.some((m) => m.id === id)))) s.run = null;
  return s;
}

export function loadSave(storage: Storage | null): Save {
  try {
    const raw = storage?.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.v === 5 && Array.isArray(s.mons)) return sanitize({ ...newSave(), ...s }); }
    // Migration vom alten Spielstand (v4): Monster, Münzen und Items übernehmen
    const old = storage?.getItem(OLD_KEY);
    if (old) {
      const o = JSON.parse(old);
      if (o && o.v === 4 && Array.isArray(o.mons)) {
        const s = newSave();
        s.coins = o.coins ?? s.coins; s.nextId = o.nextId ?? 1; s.sound = o.sound !== false;
        s.mons = o.mons.map((m: any) => newOwned(m.id, m.sp, m.nature, m.level)); s.team = o.team ?? [];
        s.inv.potion = o.items?.potion ?? 3; s.inv.super = o.items?.super ?? 0;
        return sanitize(s);
      }
    }
  } catch { /* ignorieren */ }
  return newSave();
}
export function persist(s: Save, storage: Storage | null) { try { storage?.setItem(KEY, JSON.stringify(s)); } catch { /* ignorieren */ } }

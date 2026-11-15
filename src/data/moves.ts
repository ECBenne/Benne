import type { TypeId } from './types';

/**
 * Wie eine Attacke in Echtzeit funktioniert:
 *  projectile – fliegender Ball, ausweichbar
 *  melee      – Nahkampf-Bogen
 *  dash       – Sturmangriff entlang einer Linie
 *  aoe        – Markierung am Boden, schlägt nach Verzögerung ein (ausweichbar durch Weglaufen)
 *  cone       – gehaltener Strahl / Kegel
 *  self       – wirkt auf das Monster selbst (Heilung, Schild oder Werte-Stufen)
 *  status     – schwächt den Gegner in Reichweite (senkt Werte-Stufen), macht keinen Schaden
 */
export type MoveKind = 'projectile' | 'melee' | 'dash' | 'aoe' | 'cone' | 'self' | 'status';
export type StageStat = 'atk' | 'def' | 'spe';
export interface StageFx { stat: StageStat; n: number }
export type StatusId = 'burn' | 'para';

export interface MoveDef {
  id: string;
  name: string;
  type: TypeId;
  kind: MoveKind;
  physical: boolean;
  power: number;
  cooldown: number;   // s
  windup: number;     // s (Telegraph / Anlaufzeit)
  recover: number;    // s Nachlaufzeit
  range: number;      // max. Einsatzdistanz (px)
  minRange?: number;
  speed?: number;     // Projektil-/Dash-Tempo
  radius?: number;    // Projektil-/AoE-Radius
  arc?: number;       // Nahkampf-/Kegelwinkel (halb, rad)
  duration?: number;  // Kegel: Dauer
  status?: { id: StatusId; chance: number };
  shots?: number;     // Projektile pro Einsatz
  spread?: number;    // Fächerwinkel (rad), alle Schüsse gleichzeitig
  interval?: number;  // Salve: Abstand zwischen den Schüssen (s)
  shotScale?: number; // Schaden je Schuss relativ zur Attacke
  heal?: number;      // self: heilt Anteil der max. KP
  buff?: number;      // self: Sekunden mit +25 % Schaden
  shield?: number;    // self: Schild in Anteil der max. KP
  stages?: StageFx[]; // self: eigene Werte-Stufen · status: Stufen des Gegners
  foeStage?: StageFx & { chance: number };   // Nebeneffekt bei Treffer
  scroll?: number;    // nur per Schriftrolle lernbar (Preis)
  drain?: number;     // Anteil des Schadens, den der Angreifer als KP zurückbekommt
  special?: boolean;  // wird vom Trainer-Befehl "Spezial" gewählt
  armor?: boolean;    // wird beim Aufladen nicht unterbrochen
}

export const MOVES: Record<string, MoveDef> = {
  /** Fächer aus drei Feuerbällen */
  sparkburst: {
    id: 'sparkburst', name: 'Funkenschwarm', type: 'fire', kind: 'projectile', physical: false,
    power: 40, cooldown: 1.6, windup: 0.28, recover: 0.2, range: 115, minRange: 22,
    speed: 135, radius: 4.5, status: { id: 'burn', chance: 0.18 }, shots: 3, spread: 0.2, shotScale: 0.46,
  },
  /** Schneller Nahkampfhieb */
  clawswipe: {
    id: 'clawswipe', name: 'Krallenhieb', type: 'normal', kind: 'melee', physical: true,
    power: 40, cooldown: 1.0, windup: 0.16, recover: 0.2, range: 34, radius: 34, arc: 1.0,
  },
  /** Feuriger Sturmangriff */
  blazerush: {
    id: 'blazerush', name: 'Flammenrausch', type: 'fire', kind: 'dash', physical: true,
    power: 50, cooldown: 3.6, windup: 0.22, recover: 0.3, range: 96, minRange: 30,
    speed: 300, radius: 10, status: { id: 'burn', chance: 0.25 },
  },
  /** Spezial: gehaltener Feuerstrahl */
  dragonfire: {
    id: 'dragonfire', name: 'Drachenglut', type: 'fire', kind: 'cone', physical: false,
    power: 90, cooldown: 7, windup: 0.45, recover: 0.3, range: 66, minRange: 0,
    radius: 66, arc: 0.45, duration: 1.0, status: { id: 'burn', chance: 0.5 }, special: true, armor: true,
  },
  // ── Wasser ──
  /** Salve aus drei Wasserperlen */
  pearlshot: {
    id: 'pearlshot', name: 'Perlschuss', type: 'water', kind: 'projectile', physical: false,
    power: 40, cooldown: 1.5, windup: 0.3, recover: 0.2, range: 115, minRange: 22,
    speed: 160, radius: 4, shots: 3, interval: 0.09, shotScale: 0.47,
  },
  /** Wuchtiger Flossenhieb */
  finslap: {
    id: 'finslap', name: 'Flossenhieb', type: 'water', kind: 'melee', physical: true,
    power: 42, cooldown: 1.0, windup: 0.18, recover: 0.2, range: 34, radius: 34, arc: 1.1,
  },
  /** Sturmangriff auf einer Welle */
  tiderush: {
    id: 'tiderush', name: 'Wellenritt', type: 'water', kind: 'dash', physical: true,
    power: 50, cooldown: 3.6, windup: 0.22, recover: 0.3, range: 96, minRange: 30,
    speed: 290, radius: 10,
  },
  /** Spezial: gehaltener Wasserstrahl */
  torrent: {
    id: 'torrent', name: 'Strudelstrahl', type: 'water', kind: 'cone', physical: false,
    power: 100, cooldown: 7, windup: 0.5, recover: 0.3, range: 72,
    radius: 72, arc: 0.4, duration: 1.0, special: true, armor: true,
  },
  // ── Pflanze ──
  /** Fächer aus drei Blättern */
  leafvolley: {
    id: 'leafvolley', name: 'Blattsalve', type: 'grass', kind: 'projectile', physical: false,
    power: 40, cooldown: 1.6, windup: 0.28, recover: 0.2, range: 115, minRange: 22,
    speed: 140, radius: 4.5, shots: 3, spread: 0.22, shotScale: 0.46,
  },
  /** Peitschende Ranke mit großer Reichweite, saugt etwas Kraft ab */
  vinewhip: {
    id: 'vinewhip', name: 'Rankenpeitsche', type: 'grass', kind: 'melee', physical: true,
    power: 42, cooldown: 1.1, windup: 0.2, recover: 0.2, range: 38, radius: 38, arc: 0.9, drain: 0.06,
  },
  /** Sturmangriff auf Wurzeln */
  rootrush: {
    id: 'rootrush', name: 'Wurzelsprint', type: 'grass', kind: 'dash', physical: true,
    power: 50, cooldown: 3.6, windup: 0.22, recover: 0.3, range: 96, minRange: 30,
    speed: 295, radius: 10,
  },
  /** Spezial: Blütenstrahl, heilt beim Treffen */
  bloomstorm: {
    id: 'bloomstorm', name: 'Blütensturm', type: 'grass', kind: 'cone', physical: false,
    power: 90, cooldown: 7, windup: 0.5, recover: 0.3, range: 70,
    radius: 70, arc: 0.42, duration: 1.0, special: true, armor: true, drain: 0.05,
  },
  // ── Lernbare Attacken ──
  heatup: { id: 'heatup', name: 'Anheizen', type: 'fire', kind: 'self', physical: false, power: 0, cooldown: 15, windup: 0.5, recover: 0.2, range: 999, buff: 7 },
  magmaball: { id: 'magmaball', name: 'Magmakugel', type: 'fire', kind: 'projectile', physical: false, power: 72, cooldown: 4.8, windup: 0.5, recover: 0.3, range: 125, minRange: 30, speed: 112, radius: 7, status: { id: 'burn', chance: 0.4 } },
  firerain: { id: 'firerain', name: 'Feuerregen', type: 'fire', kind: 'aoe', physical: false, power: 78, cooldown: 8, windup: 0.9, recover: 0.3, range: 150, minRange: 30, radius: 24, status: { id: 'burn', chance: 0.35 } },
  inferno: { id: 'inferno', name: 'Inferno', type: 'fire', kind: 'aoe', physical: false, power: 112, cooldown: 11, windup: 1.15, recover: 0.4, range: 150, minRange: 20, radius: 34, status: { id: 'burn', chance: 0.6 }, special: true, armor: true },
  aquaring: { id: 'aquaring', name: 'Aquaring', type: 'water', kind: 'self', physical: false, power: 0, cooldown: 22, windup: 0.6, recover: 0.2, range: 999, heal: 0.13 },
  bubblebomb: { id: 'bubblebomb', name: 'Blasenbombe', type: 'water', kind: 'projectile', physical: false, power: 72, cooldown: 4.8, windup: 0.5, recover: 0.3, range: 125, minRange: 30, speed: 108, radius: 7, foeStage: { stat: 'spe', n: -1, chance: 0.6 } },
  geyser: { id: 'geyser', name: 'Geysir', type: 'water', kind: 'aoe', physical: false, power: 80, cooldown: 8, windup: 0.9, recover: 0.3, range: 150, minRange: 30, radius: 24 },
  tidalwave: { id: 'tidalwave', name: 'Flutwelle', type: 'water', kind: 'aoe', physical: false, power: 114, cooldown: 11, windup: 1.15, recover: 0.4, range: 150, minRange: 20, radius: 34, special: true, armor: true },
  synthesis: { id: 'synthesis', name: 'Synthese', type: 'grass', kind: 'self', physical: false, power: 0, cooldown: 22, windup: 0.6, recover: 0.2, range: 999, heal: 0.13 },
  seedbomb: { id: 'seedbomb', name: 'Samenbombe', type: 'grass', kind: 'projectile', physical: true, power: 72, cooldown: 4.8, windup: 0.5, recover: 0.3, range: 125, minRange: 30, speed: 110, radius: 7, foeStage: { stat: 'def', n: -1, chance: 0.6 } },
  thornfield: { id: 'thornfield', name: 'Dornenfeld', type: 'grass', kind: 'aoe', physical: false, power: 76, cooldown: 8, windup: 0.9, recover: 0.3, range: 150, minRange: 30, radius: 24, drain: 0.1 },
  wildwrath: { id: 'wildwrath', name: 'Urwaldzorn', type: 'grass', kind: 'aoe', physical: false, power: 110, cooldown: 11, windup: 1.15, recover: 0.4, range: 150, minRange: 20, radius: 34, special: true, armor: true, drain: 0.08 },
  // ── Schriftrollen (für jedes Monster lernbar) ──
  ramcharge: { id: 'ramcharge', name: 'Rammstoß', type: 'normal', kind: 'dash', physical: true, power: 55, cooldown: 4, windup: 0.25, recover: 0.3, range: 100, minRange: 30, speed: 300, radius: 10, scroll: 380 },
  aimshot: { id: 'aimshot', name: 'Zielschuss', type: 'normal', kind: 'projectile', physical: false, power: 48, cooldown: 2.4, windup: 0.3, recover: 0.2, range: 140, minRange: 30, speed: 230, radius: 4, scroll: 380 },
  rockfall: { id: 'rockfall', name: 'Steinschlag', type: 'normal', kind: 'aoe', physical: true, power: 74, cooldown: 8, windup: 0.85, recover: 0.3, range: 150, minRange: 30, radius: 24, scroll: 450 },
  guardwall: { id: 'guardwall', name: 'Schutzwall', type: 'normal', kind: 'self', physical: false, power: 0, cooldown: 16, windup: 0.4, recover: 0.2, range: 999, shield: 0.2, scroll: 450 },
  warcry: { id: 'warcry', name: 'Kampfschrei', type: 'normal', kind: 'self', physical: false, power: 0, cooldown: 14, windup: 0.6, recover: 0.2, range: 999, stages: [{ stat: 'atk', n: 1 }], scroll: 420 },
  mending: { id: 'mending', name: 'Heilwelle', type: 'normal', kind: 'self', physical: false, power: 0, cooldown: 22, windup: 0.6, recover: 0.2, range: 999, heal: 0.13, scroll: 480 },
  // ── Werte verändern (wie in den Vorbildern: schwächen und stärken) ──
  glare: { id: 'glare', name: 'Glutblick', type: 'fire', kind: 'status', physical: false, power: 0, cooldown: 15, windup: 0.5, recover: 0.2, range: 120, stages: [{ stat: 'atk', n: -1 }] },
  soak: { id: 'soak', name: 'Durchnässen', type: 'water', kind: 'status', physical: false, power: 0, cooldown: 11, windup: 0.5, recover: 0.2, range: 120, stages: [{ stat: 'spe', n: -1 }, { stat: 'atk', n: -1 }] },
  lure: { id: 'lure', name: 'Lockduft', type: 'grass', kind: 'status', physical: false, power: 0, cooldown: 11, windup: 0.5, recover: 0.2, range: 120, stages: [{ stat: 'def', n: -1 }] },
  dragondance: { id: 'dragondance', name: 'Drachentanz', type: 'fire', kind: 'self', physical: false, power: 0, cooldown: 18, windup: 0.8, recover: 0.2, range: 999, stages: [{ stat: 'atk', n: 1 }, { stat: 'spe', n: 1 }] },
  shellguard: { id: 'shellguard', name: 'Panzerschale', type: 'water', kind: 'self', physical: false, power: 0, cooldown: 18, windup: 0.8, recover: 0.2, range: 999, stages: [{ stat: 'def', n: 2 }] },
  growth: { id: 'growth', name: 'Wachstum', type: 'grass', kind: 'self', physical: false, power: 0, cooldown: 24, windup: 0.8, recover: 0.2, range: 999, stages: [{ stat: 'atk', n: 1 }, { stat: 'def', n: 1 }] },
  growl: { id: 'growl', name: 'Knurrer', type: 'normal', kind: 'status', physical: false, power: 0, cooldown: 11, windup: 0.5, recover: 0.2, range: 120, stages: [{ stat: 'atk', n: -1 }], scroll: 360 },
  scaryface: { id: 'scaryface', name: 'Grimasse', type: 'normal', kind: 'status', physical: false, power: 0, cooldown: 12, windup: 0.5, recover: 0.2, range: 120, stages: [{ stat: 'spe', n: -2 }], scroll: 420 },
  harden: { id: 'harden', name: 'Härtner', type: 'normal', kind: 'self', physical: false, power: 0, cooldown: 13, windup: 0.5, recover: 0.2, range: 999, stages: [{ stat: 'def', n: 1 }], scroll: 360 },
  agility: { id: 'agility', name: 'Agilität', type: 'normal', kind: 'self', physical: false, power: 0, cooldown: 16, windup: 0.6, recover: 0.2, range: 999, stages: [{ stat: 'spe', n: 2 }], scroll: 420 },
};

/**
 * Attacken-Familie je Typ nach dem gleichen Muster wie Feuer/Wasser/Pflanze:
 * Salve, Nahkampf, Sturmangriff, Spezialstrahl, Anheizen, Kugel, Feld, Sturm (Spezial), Schwächen, Stärken.
 */
function family(type: TypeId, n: Record<'shot' | 'melee' | 'dash' | 'beam' | 'buff' | 'ball' | 'field' | 'storm' | 'weak' | 'tune' | 'guard', [string, string]>, o: { phys?: boolean; st?: StatusId; sa?: number; foe?: StageFx & { chance: number }; drain?: number; weak: StageFx[]; tune: StageFx[] }) {
  const st = (c: number) => (o.st ? { status: { id: o.st, chance: c } } : {});
  const d = (id: string, name: string, x: Partial<MoveDef>): [string, MoveDef] => [id, { id, name, type, physical: false, power: 0, cooldown: 1, windup: 0.3, recover: 0.2, range: 115, kind: 'projectile', ...x } as MoveDef];
  const p = !!o.phys;
  return Object.fromEntries([
    d(n.shot[0], n.shot[1], { kind: 'projectile', physical: p, power: 40, cooldown: 1.6, windup: 0.28, minRange: 22, speed: 135, radius: 4.5, shots: 3, spread: 0.2, shotScale: 0.46, ...st(0.15) }),
    d(n.melee[0], n.melee[1], { kind: 'melee', physical: true, power: 42, cooldown: 1.0, windup: 0.18, range: 34, radius: 34, arc: 1.05, ...(o.drain ? { drain: o.drain } : {}) }),
    d(n.dash[0], n.dash[1], { kind: 'dash', physical: true, power: 50, cooldown: 3.6, windup: 0.22, recover: 0.3, range: 96, minRange: 30, speed: 295, radius: 10, ...st(0.2) }),
    d(n.beam[0], n.beam[1], { kind: 'cone', physical: p, power: 92, cooldown: 7, windup: 0.48, recover: 0.3, range: 68, minRange: 0, radius: 68, arc: 0.43, duration: 1.0, special: true, armor: true, ...st(0.45), ...(o.foe ? { foeStage: o.foe } : {}), ...(o.drain ? { drain: o.drain } : {}) }),
    d(n.buff[0], n.buff[1], { kind: 'self', power: 0, cooldown: 15, windup: 0.5, range: 999, buff: 7 }),
    d(n.ball[0], n.ball[1], { kind: 'projectile', physical: p, power: 72, cooldown: 4.8, windup: 0.5, recover: 0.3, range: 125, minRange: 30, speed: 110, radius: 7, ...(o.foe ? { foeStage: o.foe } : {}), ...st(0.35) }),
    d(n.field[0], n.field[1], { kind: 'aoe', physical: p, power: 78, cooldown: 8, windup: 0.9, recover: 0.3, range: 150, minRange: 30, radius: 24, ...st(0.3), ...(o.drain ? { drain: o.drain } : {}) }),
    d(n.storm[0], n.storm[1], { kind: 'aoe', physical: p, power: 112, cooldown: 11, windup: 1.15, recover: 0.4, range: 150, minRange: 20, radius: 34, special: true, armor: true, ...st(0.5), ...(o.drain ? { drain: o.drain } : {}) }),
    d(n.weak[0], n.weak[1], { kind: 'status', cooldown: 13, windup: 0.5, range: 120, stages: o.weak }),
    d(n.tune[0], n.tune[1], { kind: 'self', cooldown: 18, windup: 0.8, range: 999, stages: o.tune }),
    d(n.guard[0], n.guard[1], { kind: 'self', cooldown: 16, windup: 0.5, range: 999, shield: 0.2 }),
  ]);
}
Object.assign(MOVES,
  family('electric', { shot: ['zapshot', 'Funkenblitz'], melee: ['nipbite', 'Zwickbiss'], dash: ['voltleap', 'Blitzsprung'], beam: ['thunderbeam', 'Donnerstrahl'], buff: ['charge', 'Aufladen'], ball: ['chainbolt', 'Kettenblitz'], field: ['stormfield', 'Gewitterfeld'], storm: ['thunderstorm', 'Gewittersturm'], weak: ['shock', 'Stromschlag'], tune: ['overload', 'Überladung'], guard: ['staticveil', 'Statikschleier'] }, { st: 'para', weak: [{ stat: 'spe', n: -1 }, { stat: 'def', n: -1 }], tune: [{ stat: 'atk', n: 1 }, { stat: 'spe', n: 1 }] }),
  family('rock', { shot: ['pebbleshot', 'Geröllschuss'], melee: ['rockbreaker', 'Felsbrecher'], dash: ['stoneroll', 'Steinwalze'], beam: ['dustbeam', 'Staubstrahl'], buff: ['rockrage', 'Steinzorn'], ball: ['boulder', 'Felsbrocken'], field: ['quake', 'Erdbeben'], storm: ['mountainfall', 'Bergsturz'], weak: ['dustcloud', 'Staubwolke'], tune: ['stonearmor', 'Steinpanzer'], guard: ['rockwall', 'Felswall'] }, { phys: true, foe: { stat: 'spe', n: -1, chance: 0.5 }, weak: [{ stat: 'spe', n: -1 }, { stat: 'atk', n: -1 }], tune: [{ stat: 'def', n: 2 }] }),
  family('ice', { shot: ['frostshard', 'Eissplitter'], melee: ['frostbite', 'Frostbiss'], dash: ['iceslide', 'Eisrutsche'], beam: ['icebreath', 'Eisatem'], buff: ['coldfocus', 'Kältefokus'], ball: ['iceball', 'Eiskugel'], field: ['hailstorm', 'Hagelregen'], storm: ['blizzard', 'Blizzard'], weak: ['chill', 'Kälteschauer'], tune: ['icedance', 'Eistanz'], guard: ['iceshell', 'Eispanzer'] }, { foe: { stat: 'spe', n: -1, chance: 0.5 }, weak: [{ stat: 'atk', n: -1 }, { stat: 'spe', n: -1 }], tune: [{ stat: 'def', n: 1 }, { stat: 'spe', n: 1 }] }),
  family('ghost', { shot: ['shadowball', 'Schattenball'], melee: ['veilslash', 'Schleierhieb'], dash: ['ghostleap', 'Geistersprung'], beam: ['spookfire', 'Spukglut'], buff: ['haunt', 'Spuk'], ball: ['cursebolt', 'Fluchkugel'], field: ['spookfield', 'Spukfeld'], storm: ['ghoststorm', 'Geistersturm'], weak: ['scareface', 'Schreckgesicht'], tune: ['shadowdance', 'Schattentanz'], guard: ['shadowveil', 'Schattenhülle'] }, { foe: { stat: 'atk', n: -1, chance: 0.5 }, drain: 0.05, weak: [{ stat: 'def', n: -1 }, { stat: 'atk', n: -1 }], tune: [{ stat: 'atk', n: 1 }, { stat: 'spe', n: 1 }] }),
);

export const SCROLL_IDS = Object.keys(MOVES).filter((id) => MOVES[id].scroll);

export const STAGE_NAMES: Record<StageStat, string> = { atk: 'ANGRIFF', def: 'VERTEIDIGUNG', spe: 'TEMPO' };
export const STAGE_MAX = 3;
export const STAGE_STEP = 1.13;
/** Wirkung einer Stufe: jede Stufe ×1,13 (bzw. ÷1,13), bei ±3 also etwa ±44 %. */
export const stageMul = (n: number) => Math.pow(STAGE_STEP, n);

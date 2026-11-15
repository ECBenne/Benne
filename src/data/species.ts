import type { TypeId } from './types';

export interface BaseStats { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }

export interface SpeciesDef {
  id: string;
  name: string;
  dex: number;
  types: TypeId[];
  base: BaseStats;
  moves: string[];       // MOVES ids
  evolvesTo?: { id: string; level: number };   // Weiterentwicklung
  buyable?: boolean;     // im Shop/als Starter wählbar (Standard: ja)
  radius: number;        // Trefferradius (px)
  height: number;        // Spritehöhe (px) für Effekte/Zahlen
  blurb: string;
}

export const SPECIES: Record<string, SpeciesDef> = {
  glimmdra: {
    id: 'glimmdra', name: 'Glimmdra', dex: 1, types: ['fire'],
    base: { hp: 45, atk: 53, def: 45, spa: 58, spd: 50, spe: 70 },
    moves: ['sparkburst', 'clawswipe', 'blazerush', 'dragonfire'],
    evolvesTo: { id: 'glutdrax', level: 14 },
    radius: 11, height: 46,
    blurb: 'Ein junger Feuerdrache. Wendig im Nahkampf, gefährlich mit seinem Drachenatem.',
  },
  glutdrax: {
    id: 'glutdrax', name: 'Glutdrax', dex: 2, types: ['fire'],
    base: { hp: 64, atk: 78, def: 65, spa: 84, spd: 68, spe: 79 },
    moves: ['sparkburst', 'clawswipe', 'blazerush', 'dragonfire'],
    evolvesTo: { id: 'glutwyrm', level: 22 },
    buyable: false,
    radius: 14, height: 55,
    blurb: 'Die Weiterentwicklung von Glimmdra. Größer, stärker und mit Stacheln aus Glut.',
  },
  glutwyrm: {
    id: 'glutwyrm', name: 'Glutwyrm', dex: 3, types: ['fire'],
    base: { hp: 82, atk: 100, def: 80, spa: 103, spd: 86, spe: 90 },
    moves: ['sparkburst', 'clawswipe', 'blazerush', 'dragonfire'],
    buyable: false,
    radius: 17, height: 62,
    blurb: 'Die letzte Stufe. Ein geflügelter Feuerwyrm, dessen Drachenglut ganze Arenen erhellt.',
  },
  // ── Wasser-Reihe ──
  tropfling: {
    id: 'tropfling', name: 'Tropfling', dex: 4, types: ['water'],
    base: { hp: 48, atk: 54, def: 48, spa: 62, spd: 53, spe: 68 },
    moves: ['pearlshot', 'finslap', 'tiderush', 'torrent'],
    evolvesTo: { id: 'flutdrax', level: 14 },
    radius: 11, height: 46,
    blurb: 'Ein neugieriger Wasserdrache. Verspielt, flink und treffsicher mit seinen Wasserperlen.',
  },
  flutdrax: {
    id: 'flutdrax', name: 'Flutdrax', dex: 5, types: ['water'],
    base: { hp: 66, atk: 78, def: 67, spa: 85, spd: 70, spe: 78 },
    moves: ['pearlshot', 'finslap', 'tiderush', 'torrent'],
    evolvesTo: { id: 'gischtwyrm', level: 22 },
    buyable: false,
    radius: 14, height: 55,
    blurb: 'Die Weiterentwicklung von Tropfling. Kraftvoll und mit einem Kamm aus Gold.',
  },
  gischtwyrm: {
    id: 'gischtwyrm', name: 'Gischtwyrm', dex: 6, types: ['water'],
    base: { hp: 81, atk: 99, def: 82, spa: 102, spd: 87, spe: 90 },
    moves: ['pearlshot', 'finslap', 'tiderush', 'torrent'],
    buyable: false,
    radius: 17, height: 61,
    blurb: 'Die letzte Stufe. Ein geflügelter Wasserwyrm, der Stürme aus Gischt entfesselt.',
  },
  // ── Pflanzen-Reihe ──
  knoespling: {
    id: 'knoespling', name: 'Knöspling', dex: 7, types: ['grass'],
    base: { hp: 49, atk: 52, def: 49, spa: 58, spd: 52, spe: 64 },
    moves: ['leafvolley', 'vinewhip', 'rootrush', 'bloomstorm'],
    evolvesTo: { id: 'laubpard', level: 14 },
    radius: 11, height: 46,
    blurb: 'Ein zähes Pflanzenjunges mit einer Knospe am Schwanz. Entzieht Gegnern mit Ranken Kraft.',
  },
  laubpard: {
    id: 'laubpard', name: 'Laubpard', dex: 8, types: ['grass'],
    base: { hp: 65, atk: 78, def: 66, spa: 84, spd: 69, spe: 78 },
    moves: ['leafvolley', 'vinewhip', 'rootrush', 'bloomstorm'],
    evolvesTo: { id: 'maehnenflor', level: 22 },
    buyable: false,
    radius: 14, height: 55,
    blurb: 'Die Weiterentwicklung von Knöspling. Geschmeidig wie eine Raubkatze, getarnt im Laub.',
  },
  maehnenflor: {
    id: 'maehnenflor', name: 'Mähnenflor', dex: 9, types: ['grass'],
    base: { hp: 81, atk: 99, def: 82, spa: 101, spd: 87, spe: 90 },
    moves: ['leafvolley', 'vinewhip', 'rootrush', 'bloomstorm'],
    buyable: false,
    radius: 17, height: 60,
    blurb: 'Die letzte Stufe. Eine Mähne aus Blättern und Blüten, die ihn nach jedem Treffer stärkt.',
  },
};
/** Form eines Monsters auf einem Level (für Gegner): entwickelt, sobald das Level erreicht ist. */
export function formAt(id: string, level: number): string {
  let cur = SPECIES[id];
  while (cur?.evolvesTo && level >= cur.evolvesTo.level) cur = SPECIES[cur.evolvesTo.id];
  return cur?.id ?? id;
}
export const SPECIES_IDS = Object.keys(SPECIES);
/** Nur Grundformen werden verkauft / als Gegner-Basis genutzt. */
export const BASE_IDS = SPECIES_IDS.filter((id) => SPECIES[id].buyable !== false);

/** Wesen steuert das Verhalten der KI – das Herzstück der Eigenständigkeit. */
export interface NatureDef {
  id: string;
  name: string;
  blurb: string;
  range: number;       // Abstandsfaktor (<1 nah ran, >1 Abstand halten)
  dodge: number;       // Ausweich-Wahrscheinlichkeit
  aggression: number;  // Angriffslust
  hitAndRun: number;   // Rückzug nach Angriff (s)
  orbit: number;       // Umkreis-Tempo
  lead: number;        // Zielgenauigkeit (Vorhalten)
  speed: number;       // Tempo-Faktor
  weights: Record<string, number>; // Vorlieben je Attacken-Art
}

export const NATURES: Record<string, NatureDef> = {
  brave: {
    id: 'brave', name: 'Mutig', blurb: 'Stürmt direkt ran, liebt den Nahkampf.',
    range: 0.55, dodge: 0.3, aggression: 1, hitAndRun: 0, orbit: 0.5, lead: 0.4, speed: 1,
    weights: { melee: 1.35, dash: 1.3, projectile: 0.85, aoe: 1, cone: 1.25 },
  },
  timid: {
    id: 'timid', name: 'Scheu', blurb: 'Hält Abstand, weicht oft aus, schießt aus der Ferne.',
    range: 1.25, dodge: 0.8, aggression: 0.45, hitAndRun: 0.3, orbit: 1, lead: 0.7, speed: 1.05,
    weights: { melee: 0.6, dash: 0.8, projectile: 1.3, aoe: 1.1, cone: 0.9 },
  },
  hasty: {
    id: 'hasty', name: 'Hastig', blurb: 'Zuschlagen und wegflitzen – Hit & Run.',
    range: 0.8, dodge: 0.55, aggression: 0.75, hitAndRun: 0.95, orbit: 1.3, lead: 0.5, speed: 1.12,
    weights: { melee: 1.1, dash: 1.4, projectile: 1, aoe: 0.9, cone: 0.9 },
  },
  sly: {
    id: 'sly', name: 'Listig', blurb: 'Zielt voraus, nutzt Spezialangriffe und lauert.',
    range: 1.0, dodge: 0.65, aggression: 0.6, hitAndRun: 0.45, orbit: 0.8, lead: 1, speed: 1,
    weights: { melee: 0.8, dash: 0.9, projectile: 1.1, aoe: 1.6, cone: 1.4 },
  },
};
export const NATURE_IDS = Object.keys(NATURES);

export type TacticId = 'attack' | 'balanced' | 'defend';
export const TACTICS: Record<TacticId, { name: string; aggr: number; dodge: number; range: number; blurb: string }> = {
  attack: { name: 'Angriff', aggr: 1.35, dodge: 0.75, range: 0.8, blurb: 'ANGRIFF: +8% SCHADEN, SETZT NACH, WEICHT SELTENER AUS.' },
  balanced: { name: 'Ausgewogen', aggr: 1, dodge: 1, range: 1, blurb: 'AUSGEWOGEN: FOLGT DEM WESEN DES MONSTERS.' },
  defend: { name: 'Defensiv', aggr: 0.7, dodge: 1.3, range: 1.25, blurb: 'DEFENSIV: -8% SCHADEN, WEICHT OFT AUS, LANGES KONTER-FENSTER.' },
};

/** Grundform einer Entwicklungslinie (für Anwerben: man bekommt die kleine Form). */
export function baseForm(id: string): string {
  let cur = id;
  for (let i = 0; i < 5; i++) {
    const parent = SPECIES_IDS.find((k) => SPECIES[k].evolvesTo?.id === cur);
    if (!parent) break;
    cur = parent;
  }
  return cur;
}

/** Lernbare Attacken je Entwicklungslinie: [Attacke, Level]. Höchstens MAX_MOVES sind ausgerüstet. */
export const MAX_MOVES = 4;
export const LEARNSETS: Record<string, [string, number][]> = {
  glimmdra: [['sparkburst', 1], ['clawswipe', 1], ['dragonfire', 1], ['glare', 1], ['blazerush', 11], ['heatup', 13], ['magmaball', 16], ['firerain', 19], ['dragondance', 21], ['inferno', 24]],
  tropfling: [['pearlshot', 1], ['finslap', 1], ['torrent', 1], ['soak', 1], ['tiderush', 11], ['aquaring', 13], ['bubblebomb', 16], ['geyser', 19], ['shellguard', 21], ['tidalwave', 24]],
  knoespling: [['leafvolley', 1], ['vinewhip', 1], ['bloomstorm', 1], ['lure', 1], ['rootrush', 11], ['synthesis', 13], ['seedbomb', 16], ['thornfield', 19], ['growth', 21], ['wildwrath', 24]],
};
export const learnset = (sp: string) => LEARNSETS[baseForm(sp)] ?? SPECIES[sp].moves.map((m) => [m, 1] as [string, number]);
export const learnedMoves = (sp: string, level: number) => learnset(sp).filter(([, l]) => l <= level).map(([m]) => m);
/** Erste Ausrüstung: die ersten vier gelernten Attacken. */
export const starterMoves = (sp: string, level: number) => learnedMoves(sp, level).slice(0, MAX_MOVES);

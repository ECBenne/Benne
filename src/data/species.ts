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
    base: { hp: 45, atk: 55, def: 45, spa: 60, spd: 50, spe: 70 },
    moves: ['sparkburst', 'clawswipe', 'blazerush', 'dragonfire'],
    evolvesTo: { id: 'glutdrax', level: 14 },
    radius: 11, height: 46,
    blurb: 'Ein junger Feuerdrache. Wendig im Nahkampf, gefährlich mit seinem Drachenatem.',
  },
  glutdrax: {
    id: 'glutdrax', name: 'Glutdrax', dex: 2, types: ['fire'],
    base: { hp: 62, atk: 78, def: 62, spa: 84, spd: 66, spe: 80 },
    moves: ['sparkburst', 'clawswipe', 'blazerush', 'dragonfire'],
    evolvesTo: { id: 'glutwyrm', level: 22 },
    buyable: false,
    radius: 14, height: 55,
    blurb: 'Die Weiterentwicklung von Glimmdra. Größer, stärker und mit Stacheln aus Glut.',
  },
  glutwyrm: {
    id: 'glutwyrm', name: 'Glutwyrm', dex: 3, types: ['fire'],
    base: { hp: 80, atk: 100, def: 78, spa: 104, spd: 85, spe: 92 },
    moves: ['sparkburst', 'clawswipe', 'blazerush', 'dragonfire'],
    buyable: false,
    radius: 17, height: 62,
    blurb: 'Die letzte Stufe. Ein geflügelter Feuerwyrm, dessen Drachenglut ganze Arenen erhellt.',
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
  attack: { name: 'Angriff', aggr: 1.35, dodge: 0.75, range: 0.8, blurb: 'Setzt nach, weicht weniger aus.' },
  balanced: { name: 'Ausgewogen', aggr: 1, dodge: 1, range: 1, blurb: 'Folgt dem Wesen.' },
  defend: { name: 'Defensiv', aggr: 0.7, dodge: 1.3, range: 1.25, blurb: 'Abstand & Ausweichen.' },
};

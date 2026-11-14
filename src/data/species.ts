import type { TypeId } from './types';

export interface BaseStats { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }

export interface SpeciesDef {
  id: string;
  name: string;
  dex: number;
  types: TypeId[];
  base: BaseStats;
  moves: string[];       // MOVES ids
  radius: number;        // Trefferradius (px)
  height: number;        // Spritehöhe (px) für Effekte/Zahlen
  blurb: string;
}

export const SPECIES: Record<string, SpeciesDef> = {
  pikachu: {
    id: 'pikachu', name: 'Pikachu', dex: 25, types: ['electric'],
    base: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 },
    moves: ['thundershock', 'quickattack', 'thunder'],
    radius: 8, height: 44,
    blurb: 'Blitzschnell. Weicht aus, flitzt heran und hält mit Donner die Stellung.',
  },
  charmander: {
    id: 'charmander', name: 'Glumanda', dex: 4, types: ['fire'],
    base: { hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65 },
    moves: ['ember', 'scratch', 'flamethrower'],
    radius: 8, height: 41,
    blurb: 'Zäh und feurig. Kratzt im Nahkampf und röstet mit dem Flammenwurf.',
  },
  squirtle: {
    id: 'squirtle', name: 'Schiggy', dex: 7, types: ['water'],
    base: { hp: 44, atk: 48, def: 65, spa: 50, spd: 64, spe: 43 },
    moves: ['watergun', 'tackle', 'hydropump'],
    radius: 8, height: 39,
    blurb: 'Gemächlich, aber extrem robust. Stellt sich quer und spült alles weg.',
  },
};
export const SPECIES_IDS = Object.keys(SPECIES);

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

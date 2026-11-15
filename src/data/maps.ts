import type { TypeId } from './types';

/**
 * Arenen mit Gelände. Koordinaten in der Bodenebene (Spielfeld x 44..356, y 140..576; Startpunkte bei y≈235 und y≈480).
 *  rock  – blockiert Laufwege und Geschosse (Deckung)
 *  water – nur Wasser-Monster können hinein (für sie: schneller, stärker)
 *  lava  – nur Feuer-Monster können hinein (für sie: schneller, stärker)
 *  grass – hohes Gras: Pflanzen-Monster regenerieren und sind stärker, alle anderen werden gebremst
 */
export type FeatureKind = 'rock' | 'water' | 'lava' | 'grass';
export interface Feature { kind: FeatureKind; x: number; y: number; r: number }
export interface MapDef {
  id: string; name: string; desc: string; favors: TypeId | null;
  features: Feature[];
  theme: { t1: string; t2: string; hi: string; lo: string; grout: string };
}
const SAND = { t1: '#dccb96', t2: '#d4c28a', hi: '#e8d9a4', lo: '#c9b57e', grout: '#bfab74' };
export const MAPS: Record<string, MapDef> = {
  meadow: { id: 'meadow', name: 'Wiesenarena', desc: 'Offenes Feld ohne Hindernisse.', favors: null, features: [], theme: SAND },
  rocks: {
    id: 'rocks', name: 'Felsgarten', desc: 'Felsen blockieren Wege und Geschosse – ideal für Deckung.', favors: null,
    features: [{ kind: 'rock', x: 170, y: 320, r: 15 }, { kind: 'rock', x: 104, y: 276, r: 14 }, { kind: 'rock', x: 236, y: 364, r: 14 }, { kind: 'rock', x: 232, y: 232, r: 11 }, { kind: 'rock', x: 108, y: 408, r: 11 }],
    theme: { t1: '#cfc6b4', t2: '#c5bca8', hi: '#ddd5c4', lo: '#b8ae9a', grout: '#a89e8a' },
  },
  lake: {
    id: 'lake', name: 'Seeufer', desc: 'Nur Wasser-Monster durchqueren den See – sie sind darin schneller und stärker.', favors: 'water',
    features: [{ kind: 'water', x: 170, y: 320, r: 50 }, { kind: 'rock', x: 78, y: 250, r: 11 }, { kind: 'rock', x: 262, y: 390, r: 11 }],
    theme: SAND,
  },
  volcano: {
    id: 'volcano', name: 'Vulkanfeld', desc: 'Nur Feuer-Monster betreten die Lava – sie sind darin schneller und stärker.', favors: 'fire',
    features: [{ kind: 'lava', x: 106, y: 320, r: 36 }, { kind: 'lava', x: 234, y: 320, r: 36 }, { kind: 'rock', x: 170, y: 262, r: 11 }, { kind: 'rock', x: 170, y: 378, r: 11 }],
    theme: { t1: '#9a8f88', t2: '#8f847d', hi: '#aba099', lo: '#80756e', grout: '#6e645e' },
  },
  jungle: {
    id: 'jungle', name: 'Dschungel', desc: 'Hohes Gras bremst alle außer Pflanzen-Monstern – diese heilen sich darin.', favors: 'grass',
    features: [{ kind: 'grass', x: 108, y: 268, r: 36 }, { kind: 'grass', x: 232, y: 372, r: 36 }, { kind: 'grass', x: 170, y: 320, r: 26 }, { kind: 'rock', x: 236, y: 262, r: 12 }, { kind: 'rock', x: 104, y: 378, r: 12 }],
    theme: { t1: '#c8c896', t2: '#bcbe8a', hi: '#d6d8a6', lo: '#aeb07e', grout: '#9aa070' },
  },
};
/** Die Karten wurden für die kleine Arena (252×360 um 170/320) entworfen: auf die große Arena übertragen und mit weiterem Gelände füllen. */
const fit = (f: Feature): Feature => ({ kind: f.kind, x: Math.round(200 + (f.x - 170) * 1.238), y: Math.round(358 + (f.y - 320) * 1.211), r: Math.round(f.r * 1.22) });
for (const m of Object.values(MAPS)) m.features = m.features.map(fit);
const EXTRA: Record<string, Feature[]> = {
  rocks: [{ kind: 'rock', x: 90, y: 440, r: 15 }, { kind: 'rock', x: 312, y: 300, r: 14 }, { kind: 'rock', x: 200, y: 520, r: 12 }, { kind: 'rock', x: 130, y: 200, r: 13 }],
  lake: [{ kind: 'rock', x: 300, y: 220, r: 12 }, { kind: 'rock', x: 100, y: 500, r: 13 }, { kind: 'water', x: 78, y: 214, r: 22 }, { kind: 'water', x: 322, y: 506, r: 22 }],
  volcano: [{ kind: 'lava', x: 84, y: 480, r: 24 }, { kind: 'lava', x: 316, y: 236, r: 24 }, { kind: 'rock', x: 90, y: 230, r: 12 }, { kind: 'rock', x: 312, y: 490, r: 12 }],
  jungle: [{ kind: 'grass', x: 300, y: 214, r: 28 }, { kind: 'grass', x: 96, y: 500, r: 28 }, { kind: 'rock', x: 84, y: 330, r: 12 }, { kind: 'rock', x: 322, y: 420, r: 12 }],
};
for (const [id, extra] of Object.entries(EXTRA)) MAPS[id].features.push(...extra);
export const MAP_IDS = Object.keys(MAPS);
export const TERRAIN_BONUS = 1.15;      // Schaden und Tempo im eigenen Element
export const GRASS_SLOW = 0.82;         // fremde Typen im hohen Gras
export const GRASS_REGEN = 0.008;       // Pflanze im Gras: Anteil max. KP je Sekunde

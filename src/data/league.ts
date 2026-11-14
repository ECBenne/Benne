import type { TypeId } from './types';

/** Arena-Wetter: verstärkt/schwächt Typen. Sichtbar im Scouting, wirkt im ganzen Kampf. */
export interface ArenaMod { id: string; name: string; desc: string; mul: Partial<Record<TypeId, number>>; tint: string }
export const ARENA_MODS: Record<string, ArenaMod> = {
  none: { id: 'none', name: 'Klar', desc: 'Keine besonderen Bedingungen.', mul: {}, tint: '' },
  sun: { id: 'sun', name: 'Sonnenschein', desc: 'Feuer +25%, Wasser -15%', mul: { fire: 1.25, water: 0.85 }, tint: 'rgba(255,190,80,0.10)' },
  rain: { id: 'rain', name: 'Regen', desc: 'Wasser +25%, Feuer -15%', mul: { water: 1.25, fire: 0.85 }, tint: 'rgba(80,120,200,0.14)' },
  jungle: { id: 'jungle', name: 'Dschungelluft', desc: 'Pflanze +25%, Wasser -10%', mul: { grass: 1.25, water: 0.9 }, tint: 'rgba(80,200,90,0.10)' },
};
export const MOD_IDS = Object.keys(ARENA_MODS);

export type NodeKind = 'battle' | 'elite' | 'rest' | 'shop' | 'event' | 'boss';
export const NODE_INFO: Record<NodeKind, { label: string; color: string; blurb: string }> = {
  battle: { label: 'KAMPF', color: '#e87868', blurb: 'Ein Trainerkampf.' },
  elite: { label: 'ELITE', color: '#d058e8', blurb: 'Starker Gegner mit Amulett als Beute.' },
  rest: { label: 'RAST', color: '#7ad088', blurb: 'Heilen oder trainieren.' },
  shop: { label: 'HÄNDLER', color: '#f8d030', blurb: 'Einkaufen mit deinen Münzen.' },
  event: { label: '?', color: '#58c8e8', blurb: 'Ein Zufallsereignis.' },
  boss: { label: 'BOSS', color: '#ff4050', blurb: 'Der Liga-Boss. Besiege ihn, um die Liga zu gewinnen.' },
};

export const TRAINERS = ['Camper Tim', 'Trainerin Lea', 'Angler Ben', 'Ass-Trainer Kai', 'Wanderin Sofie', 'Förster Max', 'Schwimmerin Ida', 'Heizer Otto', 'Gärtnerin Pia', 'Ranger Jonas'];
export const BOSSES = [
  { name: 'Arenaleiterin Mara', title: 'Hüterin der Glut', mod: 'sun', type: 'fire' as TypeId | null, map: 'volcano' },
  { name: 'Kapitän Gorm', title: 'Herr der Gezeiten', mod: 'rain', type: 'water' as TypeId | null, map: 'lake' },
  { name: 'Hüter Alder', title: 'König des Waldes', mod: 'jungle', type: 'grass' as TypeId | null, map: 'jungle' },
  { name: 'Champion Rot', title: 'Meister der Liga', mod: 'none', type: null as TypeId | null, map: 'rocks' },
];
export const MAX_TIER = 4;
export const LAYERS = 9;       // Etappen 0..8, Etappe 8 = Boss

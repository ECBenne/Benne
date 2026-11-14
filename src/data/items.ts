import type { TypeId } from './types';

/** Amulette: eine Ausrüstung pro Monster. Wirkung wird beim Kampfstart auf das Monster angewendet. */
export interface AmuletDef {
  id: string; name: string; desc: string; price: number; color: string;
  dmgType?: TypeId; dmgMul?: number;   // mehr Schaden für Attacken eines Typs
  takenMul?: number;                   // erlittener Schaden (<1 = weniger)
  speedMul?: number;                   // Lauftempo
  hpMul?: number;                      // max. KP
  drain?: number;                      // heilt Anteil des verursachten Schadens
  focusRegen?: number;                 // Fokus-Aufladung (+Anteil), wenn aktiv im Kampf
}

export const AMULETS: Record<string, AmuletDef> = {
  ember_charm: { id: 'ember_charm', name: 'Glutamulett', desc: '+15% Feuer-Schaden', price: 320, color: '#f08030', dmgType: 'fire', dmgMul: 1.15 },
  tide_pearl: { id: 'tide_pearl', name: 'Gezeitenperle', desc: '+15% Wasser-Schaden', price: 320, color: '#6890f0', dmgType: 'water', dmgMul: 1.15 },
  leaf_seed: { id: 'leaf_seed', name: 'Blattsamen', desc: '+15% Pflanzen-Schaden', price: 320, color: '#78c850', dmgType: 'grass', dmgMul: 1.15 },
  guard_stone: { id: 'guard_stone', name: 'Schildstein', desc: '-10% erlittener Schaden', price: 380, color: '#a8a8c0', takenMul: 0.9 },
  swift_feather: { id: 'swift_feather', name: 'Windfeder', desc: '+10% Tempo', price: 300, color: '#e8e0a0', speedMul: 1.1 },
  life_pearl: { id: 'life_pearl', name: 'Lebensperle', desc: '+12% KP', price: 340, color: '#f87890', hpMul: 1.12 },
  vamp_fang: { id: 'vamp_fang', name: 'Saugzahn', desc: 'Heilt 8% des Schadens', price: 420, color: '#c050a0', drain: 0.08 },
  focus_band: { id: 'focus_band', name: 'Fokusband', desc: '+40% Fokus-Aufladung', price: 360, color: '#58c8e8', focusRegen: 0.4 },
};
export const AMULET_IDS = Object.keys(AMULETS);

export const PRICES = { potion: 120, super: 320, revive: 420, mon: 700 };

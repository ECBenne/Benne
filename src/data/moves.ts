import type { TypeId } from './types';

/**
 * Wie eine Attacke in Echtzeit funktioniert:
 *  projectile – fliegender Ball, ausweichbar
 *  melee      – Nahkampf-Bogen
 *  dash       – Sturmangriff entlang einer Linie
 *  aoe        – Markierung am Boden, schlägt nach Verzögerung ein (ausweichbar durch Weglaufen)
 *  cone       – gehaltener Strahl / Kegel
 */
export type MoveKind = 'projectile' | 'melee' | 'dash' | 'aoe' | 'cone';
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
    speed: 160, radius: 4, shots: 3, interval: 0.09, shotScale: 0.42,
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
    power: 92, cooldown: 7, windup: 0.5, recover: 0.3, range: 72,
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
    power: 42, cooldown: 1.1, windup: 0.2, recover: 0.2, range: 38, radius: 38, arc: 0.9, drain: 0.1,
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
    radius: 70, arc: 0.42, duration: 1.0, special: true, armor: true, drain: 0.08,
  },
};

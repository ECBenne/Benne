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
    power: 40, cooldown: 1.0, windup: 0.16, recover: 0.2, range: 26, radius: 26, arc: 1.0,
  },
  /** Feuriger Sturmangriff */
  blazerush: {
    id: 'blazerush', name: 'Flammenrausch', type: 'fire', kind: 'dash', physical: true,
    power: 50, cooldown: 3.6, windup: 0.22, recover: 0.3, range: 90, minRange: 26,
    speed: 300, radius: 7, status: { id: 'burn', chance: 0.25 },
  },
  /** Spezial: gehaltener Feuerstrahl */
  dragonfire: {
    id: 'dragonfire', name: 'Drachenglut', type: 'fire', kind: 'cone', physical: false,
    power: 90, cooldown: 7, windup: 0.45, recover: 0.3, range: 66, minRange: 0,
    radius: 66, arc: 0.45, duration: 1.0, status: { id: 'burn', chance: 0.5 }, special: true, armor: true,
  },
};

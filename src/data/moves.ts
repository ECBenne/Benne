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
  thundershock: {
    id: 'thundershock', name: 'Donnerschock', type: 'electric', kind: 'projectile', physical: false,
    power: 40, cooldown: 1.5, windup: 0.22, recover: 0.18, range: 125, minRange: 22,
    speed: 210, radius: 5, status: { id: 'para', chance: 0.3 },
  },
  quickattack: {
    id: 'quickattack', name: 'Ruckzuck', type: 'normal', kind: 'dash', physical: true,
    power: 40, cooldown: 2.1, windup: 0.14, recover: 0.22, range: 78, minRange: 18,
    speed: 300, radius: 7,
  },
  thunder: {
    id: 'thunder', name: 'Donner', type: 'electric', kind: 'aoe', physical: false,
    power: 85, cooldown: 7, windup: 0.95, recover: 0.35, range: 150, minRange: 30,
    radius: 22, status: { id: 'para', chance: 0.5 }, special: true, armor: true,
  },
  ember: {
    id: 'ember', name: 'Glut', type: 'fire', kind: 'projectile', physical: false,
    power: 40, cooldown: 1.6, windup: 0.28, recover: 0.2, range: 115, minRange: 22,
    speed: 135, radius: 4.5, status: { id: 'burn', chance: 0.18 }, shots: 3, spread: 0.2, shotScale: 0.46,
  },
  scratch: {
    id: 'scratch', name: 'Kratzer', type: 'normal', kind: 'melee', physical: true,
    power: 40, cooldown: 1.0, windup: 0.16, recover: 0.2, range: 26, radius: 26, arc: 1.0,
  },
  flamethrower: {
    id: 'flamethrower', name: 'Flammenwurf', type: 'fire', kind: 'cone', physical: false,
    power: 90, cooldown: 7, windup: 0.45, recover: 0.3, range: 66, minRange: 0,
    radius: 66, arc: 0.45, duration: 1.0, status: { id: 'burn', chance: 0.5 }, special: true, armor: true,
  },
  watergun: {
    id: 'watergun', name: 'Aquaknarre', type: 'water', kind: 'projectile', physical: false,
    power: 40, cooldown: 1.5, windup: 0.3, recover: 0.2, range: 115, minRange: 22,
    speed: 160, radius: 4, shots: 3, interval: 0.09, shotScale: 0.42,
  },
  tackle: {
    id: 'tackle', name: 'Tackle', type: 'normal', kind: 'melee', physical: true,
    power: 45, cooldown: 1.2, windup: 0.2, recover: 0.25, range: 28, radius: 28, arc: 1.1,
  },
  hydropump: {
    id: 'hydropump', name: 'Hydropumpe', type: 'water', kind: 'cone', physical: false,
    power: 95, cooldown: 7, windup: 0.5, recover: 0.3, range: 72,
    radius: 72, arc: 0.4, duration: 1.0, special: true, armor: true,
  },
};

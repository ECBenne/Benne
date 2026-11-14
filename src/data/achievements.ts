import type { Save } from '../state';
import { SPECIES } from './species';

export interface Achievement { id: string; name: string; desc: string; goal: number; reward: number; value: (s: Save) => number }
const owned = (s: Save) => new Set(s.mons.map((m) => m.sp)).size;
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'win1', name: 'Erster Sieg', desc: 'Gewinne einen Kampf.', goal: 1, reward: 50, value: (s) => s.stats.wins },
  { id: 'win10', name: 'Kämpfer', desc: 'Gewinne 10 Kämpfe.', goal: 10, reward: 120, value: (s) => s.stats.wins },
  { id: 'win40', name: 'Veteran', desc: 'Gewinne 40 Kämpfe.', goal: 40, reward: 300, value: (s) => s.stats.wins },
  { id: 'recruit', name: 'Rekrutierer', desc: 'Wirb ein Monster an.', goal: 1, reward: 60, value: (s) => s.stats.recruits },
  { id: 'evolve', name: 'Entwicklung', desc: 'Lass ein Monster sich entwickeln.', goal: 1, reward: 100, value: (s) => s.stats.evolves },
  { id: 'elite3', name: 'Elitejäger', desc: 'Besiege 3 Elite-Gegner.', goal: 3, reward: 150, value: (s) => s.stats.elites },
  { id: 'collect', name: 'Sammler', desc: 'Besitze 5 verschiedene Monster-Arten.', goal: 5, reward: 200, value: (s) => owned(s) },
  { id: 'dex', name: 'Forscher', desc: 'Entdecke alle ' + Object.keys(SPECIES).length + ' Monster.', goal: Object.keys(SPECIES).length, reward: 250, value: (s) => s.seen.length },
  { id: 'clear1', name: 'Ligasieger', desc: 'Gewinne eine Liga.', goal: 1, reward: 250, value: (s) => s.stats.clears },
  { id: 'clear4', name: 'Champion', desc: 'Gewinne 4 Ligen.', goal: 4, reward: 600, value: (s) => s.stats.clears },
];
export const claimable = (s: Save) => ACHIEVEMENTS.filter((a) => !s.ach.includes(a.id) && a.value(s) >= a.goal);

import type { Save } from '../state';
import { SPECIES } from './species';

export interface Achievement { id: string; name: string; desc: string; goal: number; reward: number; value: (s: Save) => number }
const owned = (s: Save) => new Set(s.mons.map((m) => m.sp)).size;
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'win1', name: 'Erster Sieg', desc: 'Gewinne einen Kampf.', goal: 1, reward: 50, value: (s) => s.stats.wins },
  { id: 'win10', name: 'Kämpfer', desc: 'Gewinne 10 Kämpfe.', goal: 10, reward: 120, value: (s) => s.stats.wins },
  { id: 'win40', name: 'Veteran', desc: 'Gewinne 40 Kämpfe.', goal: 40, reward: 300, value: (s) => s.stats.wins },
  { id: 'recruit', name: 'Glückstreffer', desc: 'Ziehe ein Monster aus einer Kiste.', goal: 1, reward: 100, value: (s) => s.stats.recruits },
  { id: 'chest5', name: 'Schatzsucher', desc: 'Öffne 5 Kisten.', goal: 5, reward: 150, value: (s) => s.chest.opened },
  { id: 'raid3', name: 'Raid-Veteran', desc: 'Gewinne 3 Raids.', goal: 3, reward: 250, value: (s) => s.raidLv },
  { id: 'evolve', name: 'Entwicklung', desc: 'Lass ein Monster sich entwickeln.', goal: 1, reward: 100, value: (s) => s.stats.evolves },
  { id: 'elite3', name: 'Elitejäger', desc: 'Besiege 3 Elite-Gegner.', goal: 3, reward: 150, value: (s) => s.stats.elites },
  { id: 'collect', name: 'Sammler', desc: 'Besitze 5 verschiedene Monster-Arten.', goal: 5, reward: 200, value: (s) => owned(s) },
  { id: 'dex', name: 'Forscher', desc: 'Entdecke alle ' + Object.keys(SPECIES).length + ' Monster.', goal: Object.keys(SPECIES).length, reward: 250, value: (s) => s.seen.length },
  { id: 'learn3', name: 'Lehrmeister', desc: 'Lass deine Monster 3 neue Attacken lernen.', goal: 3, reward: 120, value: (s) => s.stats.learned },
  { id: 'stars30', name: 'Sternesammler', desc: 'Sammle 30 Sterne in Kämpfen.', goal: 30, reward: 200, value: (s) => s.stats.stars },
  { id: 'tower5', name: 'Turmsteiger', desc: 'Erreiche Etage 5 im Turm.', goal: 5, reward: 150, value: (s) => s.stats.towerBest },
  { id: 'tower12', name: 'Turmherr', desc: 'Erreiche Etage 12 im Turm.', goal: 12, reward: 400, value: (s) => s.stats.towerBest },
  { id: 'pl5', name: 'Aufsteiger', desc: 'Erreiche Spielerlevel 5.', goal: 5, reward: 150, value: (s) => s.pl.lvl },
  { id: 'pl12', name: 'Routinier', desc: 'Erreiche Spielerlevel 12.', goal: 12, reward: 400, value: (s) => s.pl.lvl },
  { id: 'cup1', name: 'Pokalsieger', desc: 'Gewinne ein Turnier.', goal: 1, reward: 150, value: (s) => Object.values(s.trophies).filter((n) => n > 0).length },
  { id: 'cup4', name: 'Pokalsammler', desc: 'Gewinne 4 verschiedene Turniere.', goal: 4, reward: 350, value: (s) => Object.values(s.trophies).filter((n) => n > 0).length },
  { id: 'cupg', name: 'Meister der Liga', desc: 'Gewinne die Meisterschaft.', goal: 1, reward: 600, value: (s) => s.trophies.gold ?? 0 },
  { id: 'rival3', name: 'Rivalenbezwinger', desc: 'Besiege deinen Rivalen 3-mal.', goal: 3, reward: 250, value: (s) => s.rival.wins },
  { id: 'clear1', name: 'Ligasieger', desc: 'Gewinne eine Liga.', goal: 1, reward: 250, value: (s) => s.stats.clears },
  { id: 'clear4', name: 'Champion', desc: 'Gewinne 4 Ligen.', goal: 4, reward: 600, value: (s) => s.stats.clears },
];
export const claimable = (s: Save) => ACHIEVEMENTS.filter((a) => !s.ach.includes(a.id) && a.value(s) >= a.goal);

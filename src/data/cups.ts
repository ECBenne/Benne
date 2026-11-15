import type { TypeId } from './types';

/** Turniere: feste Regeln, mehrere Runden, Pokal als Belohnung. */
export interface CupDef {
  id: string; name: string; blurb: string; minPl: number;
  rounds: string[]; maxTeam: number; lvlOff: number;
  type?: TypeId; mod: string; coins: number; keys: number; amulet: boolean; rival?: boolean;
}
export const CUPS: CupDef[] = [
  { id: 'bronze', name: 'Bronze-Cup', blurb: 'DER EINSTIEG: MAX. 2 MONSTER, GEGNER LEICHT UNTER DEINEM LEVEL.', minPl: 2, rounds: ['VIERTELFINALE', 'HALBFINALE', 'FINALE'], maxTeam: 2, lvlOff: -2, mod: 'none', coins: 60, keys: 1, amulet: false },
  { id: 'fire', name: 'Feuer-Cup', blurb: 'NUR FEUER-GEGNER, SONNENSCHEIN: WASSER-MONSTER SIND IM NACHTEIL.', minPl: 5, rounds: ['VIERTELFINALE', 'HALBFINALE', 'FINALE'], maxTeam: 3, lvlOff: -2, type: 'fire', mod: 'sun', coins: 90, keys: 1, amulet: false },
  { id: 'water', name: 'Wasser-Cup', blurb: 'NUR WASSER-GEGNER BEI REGEN: PFLANZEN-MONSTER HABEN ES SCHWER.', minPl: 5, rounds: ['VIERTELFINALE', 'HALBFINALE', 'FINALE'], maxTeam: 3, lvlOff: -2, type: 'water', mod: 'rain', coins: 90, keys: 1, amulet: false },
  { id: 'grass', name: 'Pflanzen-Cup', blurb: 'NUR PFLANZEN-GEGNER IM DSCHUNGEL: FEUER IST DEIN FREUND.', minPl: 5, rounds: ['VIERTELFINALE', 'HALBFINALE', 'FINALE'], maxTeam: 3, lvlOff: -2, type: 'grass', mod: 'jungle', coins: 90, keys: 1, amulet: false },
  { id: 'silver', name: 'Silber-Cup', blurb: '4 RUNDEN, MAX. 3 MONSTER, GEGNER MIT EIGENEN STRATEGIEN.', minPl: 9, rounds: ['ACHTELFINALE', 'VIERTELFINALE', 'HALBFINALE', 'FINALE'], maxTeam: 3, lvlOff: -1, mod: 'none', coins: 150, keys: 1, amulet: true },
  { id: 'gold', name: 'Meisterschaft', blurb: 'DAS GROSSE FINALE: 4 RUNDEN, BIS ZU 5 MONSTER – IM ENDSPIEL WARTET DEIN RIVALE.', minPl: 14, rounds: ['ACHTELFINALE', 'VIERTELFINALE', 'HALBFINALE', 'FINALE'], maxTeam: 5, lvlOff: -1, mod: 'none', coins: 260, keys: 2, amulet: true, rival: true },
];
export const CUP_HEAL = 0.4;   // Erholung zwischen den Runden
export const cupById = (id: string) => CUPS.find((c) => c.id === id)!;

/** Rivalen-Geschichte: wächst mit deinen Siegen und Niederlagen gegen ihn. */
export const RIVAL_STORY = [
  'KAI IST DEIN NACHBAR AUS DEM DORF. ER WILL AUCH CHAMPION WERDEN – UND ER HAT DICH SCHON BEOBACHTET.',
  'KAI HAT DICH ERNST GENOMMEN. „DAS WAR GLÜCK. NÄCHSTES MAL NICHT!“',
  'KAI TRAINIERT JETZT TÄGLICH. SEIN TEAM IST AUF DEINS ABGESTIMMT.',
  'KAI RESPEKTIERT DICH. „WIR BEIDE SIND WEIT GEKOMMEN – ABER NUR EINER KANN CHAMPION SEIN.“',
  'KAI IST DEIN GRÖSSTER RIVALE UND INZWISCHEN AUCH DEIN FREUND. JEDES DUELL IST EIN FEST.',
];
export const rivalStory = (wins: number) => RIVAL_STORY[Math.min(RIVAL_STORY.length - 1, wins)];

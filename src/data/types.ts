export type TypeId = 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'rock' | 'ice' | 'ghost'
  | 'wind' | 'poison' | 'metal' | 'light' | 'earth' | 'sound' | 'dark' | 'crystal';

export const TYPE_NAMES: Record<TypeId, string> = {
  normal: 'Normal', fire: 'Feuer', water: 'Wasser', grass: 'Pflanze', electric: 'Elektro', rock: 'Stein', ice: 'Eis', ghost: 'Geist',
  wind: 'Wind', poison: 'Gift', metal: 'Metall', light: 'Licht', earth: 'Erde', sound: 'Klang', dark: 'Dunkel', crystal: 'Kristall',
};
export const TYPE_COLORS: Record<TypeId, string> = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0', grass: '#78c850', electric: '#f8d030', rock: '#b8a038', ice: '#98d8d8', ghost: '#705898',
  wind: '#8fe0c0', poison: '#b050b8', metal: '#b8b8d0', light: '#fff0a0', earth: '#e0b868', sound: '#f080b0', dark: '#6a5a8a', crystal: '#c890f0',
};

/**
 * Optik je Typ: Farben (hell, mittel, dunkel) und Stil der Projektile.
 *  proj: flame drop leaf bolt chunk shard wisp slash bubble disc star ring void prism
 */
export type ProjStyle = 'flame' | 'drop' | 'leaf' | 'bolt' | 'chunk' | 'shard' | 'wisp' | 'slash' | 'bubble' | 'disc' | 'star' | 'ring' | 'void' | 'prism' | 'orb';
export const TYPE_FX: Record<TypeId, { pal: [string, string, string]; proj: ProjStyle }> = {
  normal: { pal: ['#ffffff', '#e8e8e8', '#a8a090'], proj: 'orb' },
  fire: { pal: ['#fff6c0', '#f8a030', '#d83818'], proj: 'flame' },
  water: { pal: ['#ffffff', '#a8d0f8', '#6890f0'], proj: 'drop' },
  grass: { pal: ['#f0ffd0', '#90d048', '#3f7f2a'], proj: 'leaf' },
  electric: { pal: ['#ffffff', '#f8f080', '#f8d030'], proj: 'bolt' },
  rock: { pal: ['#f0e0c0', '#c8a868', '#7a5a34'], proj: 'chunk' },
  ice: { pal: ['#ffffff', '#c8f0ff', '#78c8e8'], proj: 'shard' },
  ghost: { pal: ['#f0e0ff', '#a878d8', '#583888'], proj: 'wisp' },
  wind: { pal: ['#ffffff', '#c8ffe8', '#6cd0a8'], proj: 'slash' },
  poison: { pal: ['#f0d0ff', '#c060d0', '#6a2878'], proj: 'bubble' },
  metal: { pal: ['#ffffff', '#c8d0e0', '#7880a0'], proj: 'disc' },
  light: { pal: ['#ffffff', '#fff0a0', '#f8c840'], proj: 'star' },
  earth: { pal: ['#f8e8b8', '#d8a850', '#8a5a28'], proj: 'chunk' },
  sound: { pal: ['#ffffff', '#ffb0d8', '#e050a0'], proj: 'ring' },
  dark: { pal: ['#d8c8f8', '#6a50a0', '#201838'], proj: 'void' },
  crystal: { pal: ['#ffffff', '#e0b8ff', '#a060e0'], proj: 'prism' },
};

// Angreifer -> Verteidiger -> Multiplikator (nur Abweichungen von 1)
const CHART: Partial<Record<TypeId, Partial<Record<TypeId, number>>>> = {
  normal: { rock: 0.5, ghost: 0.5, metal: 0.5 },
  fire: { grass: 2, ice: 2, ghost: 2, metal: 2, water: 0.5, fire: 0.5, rock: 0.5 },
  water: { fire: 2, rock: 2, earth: 2, grass: 0.5, water: 0.5, ice: 0.5 },
  grass: { water: 2, rock: 2, earth: 2, fire: 0.5, grass: 0.5, ice: 0.5, poison: 0.5, wind: 0.5 },
  electric: { water: 2, ice: 2, wind: 2, metal: 2, grass: 0.5, electric: 0.5, rock: 0.5, earth: 0.5 },
  rock: { fire: 2, electric: 2, ice: 2, wind: 2, water: 0.5, grass: 0.5, rock: 0.5, earth: 0.5, metal: 0.5 },
  ice: { grass: 2, ghost: 2, wind: 2, earth: 2, fire: 0.5, water: 0.5, ice: 0.5, rock: 0.5, metal: 0.5 },
  ghost: { ghost: 2, electric: 2, light: 0.5, dark: 0.5, normal: 0.5, rock: 0.5 },
  wind: { grass: 2, poison: 2, rock: 0.5, electric: 0.5, metal: 0.5, crystal: 0.5 },
  poison: { grass: 2, light: 2, rock: 0.5, ghost: 0.5, poison: 0.5, metal: 0.5, earth: 0.5 },
  metal: { ice: 2, rock: 2, crystal: 2, fire: 0.5, water: 0.5, electric: 0.5, metal: 0.5 },
  light: { ghost: 2, dark: 2, poison: 2, light: 0.5, metal: 0.5, crystal: 0.5 },
  earth: { fire: 2, electric: 2, rock: 2, metal: 2, poison: 2, grass: 0.5, wind: 0.5, ice: 0.5 },
  sound: { ice: 2, ghost: 2, crystal: 2, rock: 0.5, metal: 0.5, sound: 0.5 },
  dark: { ghost: 2, light: 2, sound: 2, dark: 0.5, metal: 0.5, normal: 0.5 },
  crystal: { wind: 2, dark: 2, poison: 2, sound: 2, earth: 0.5, metal: 0.5, crystal: 0.5 },
};

export function typeEffectiveness(atk: TypeId, defTypes: readonly TypeId[]): number {
  let m = 1;
  for (const d of defTypes) m *= CHART[atk]?.[d] ?? 1;
  return m;
}

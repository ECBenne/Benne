export type TypeId = 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'rock' | 'ice' | 'ghost';

export const TYPE_NAMES: Record<TypeId, string> = {
  normal: 'Normal', fire: 'Feuer', water: 'Wasser', grass: 'Pflanze', electric: 'Elektro', rock: 'Stein', ice: 'Eis', ghost: 'Geist',
};
export const TYPE_COLORS: Record<TypeId, string> = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0', grass: '#78c850', electric: '#f8d030', rock: '#b8a038', ice: '#98d8d8', ghost: '#705898',
};

// Angreifer -> Verteidiger -> Multiplikator (nur Abweichungen von 1)
const CHART: Partial<Record<TypeId, Partial<Record<TypeId, number>>>> = {
  fire: { grass: 2, ice: 2, ghost: 2, water: 0.5, fire: 0.5, rock: 0.5 },
  water: { fire: 2, rock: 2, grass: 0.5, water: 0.5, ice: 0.5 },
  grass: { water: 2, rock: 2, fire: 0.5, grass: 0.5, ice: 0.5 },
  electric: { water: 2, ice: 2, grass: 0.5, electric: 0.5, rock: 0.5 },
  rock: { fire: 2, electric: 2, ice: 2, water: 0.5, grass: 0.5, rock: 0.5 },
  ice: { grass: 2, ghost: 2, fire: 0.5, water: 0.5, ice: 0.5, rock: 0.5 },
  ghost: { ghost: 2, electric: 2, normal: 0.5, rock: 0.5 },
  normal: { rock: 0.5, ghost: 0.5 },
};

export function typeEffectiveness(atk: TypeId, defTypes: readonly TypeId[]): number {
  let m = 1;
  for (const d of defTypes) m *= CHART[atk]?.[d] ?? 1;
  return m;
}

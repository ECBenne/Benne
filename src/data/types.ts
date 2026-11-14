export type TypeId = 'normal' | 'fire' | 'water' | 'grass' | 'electric';

export const TYPE_NAMES: Record<TypeId, string> = {
  normal: 'Normal', fire: 'Feuer', water: 'Wasser', grass: 'Pflanze', electric: 'Elektro',
};
export const TYPE_COLORS: Record<TypeId, string> = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0', grass: '#78c850', electric: '#f8d030',
};

// Angreifer -> Verteidiger -> Multiplikator (nur Abweichungen von 1)
const CHART: Partial<Record<TypeId, Partial<Record<TypeId, number>>>> = {
  fire: { grass: 2, water: 0.5, fire: 0.5 },
  water: { fire: 2, grass: 0.5, water: 0.5, electric: 1 },
  grass: { water: 2, fire: 0.5, grass: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5 },
};

export function typeEffectiveness(atk: TypeId, defTypes: readonly TypeId[]): number {
  let m = 1;
  for (const d of defTypes) m *= CHART[atk]?.[d] ?? 1;
  return m;
}

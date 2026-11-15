import type { TypeId } from './types';
import { TYPE_NAMES } from './types';

/** Bindung: wächst mit gemeinsamen Siegen und schaltet sichtbare Kampfboni frei. */
export const BOND_AT = [0, 4, 10, 20];   // Siege mit diesem Monster für Stufe 0..3
export const BOND_NAMES = ['FREMD', 'VERTRAUT', 'FREUNDE', 'SEELENPARTNER'];
export const BOND_DESC = [
  'NOCH KEIN BONUS. KÄMPFT MEHR ZUSAMMEN.',
  '+4% SCHADEN.',
  '+4% SCHADEN · HÄLT EINMAL PRO KAMPF MIT 1 KP DURCH.',
  '+8% SCHADEN · HÄLT EINMAL PRO KAMPF MIT 1 KP DURCH UND HEILT DABEI 25%.',
];
export const bondLevel = (wins: number) => { let l = 0; BOND_AT.forEach((n, i) => { if (wins >= n) l = i; }); return l; };
export const bondDmg = (lvl: number) => (lvl >= 3 ? 1.08 : lvl >= 1 ? 1.04 : 1);

/** Team-Synergien: ergeben sich aus der Zusammenstellung des Teams. */
export interface Synergy { id: string; name: string; desc: string; type?: TypeId; dmg?: number; focus?: number }
export function synergies(teamTypes: TypeId[][]): Synergy[] {
  const out: Synergy[] = [];
  const count: Partial<Record<TypeId, number>> = {};
  for (const ts of teamTypes) for (const t of ts) count[t] = (count[t] ?? 0) + 1;
  for (const [t, n] of Object.entries(count) as [TypeId, number][]) {
    if (n >= 2) out.push({ id: 'type-' + t, name: TYPE_NAMES[t].toUpperCase() + '-VERBUND', desc: TYPE_NAMES[t].toUpperCase() + '-ATTACKEN +' + (n >= 3 ? 10 : 6) + '% SCHADEN', type: t, dmg: n >= 3 ? 1.1 : 1.06 });
  }
  if (count.fire && count.water && count.grass) out.push({ id: 'triad', name: 'DREIKLANG', desc: 'FEUER, WASSER UND PFLANZE: FOKUS LÄDT 15% SCHNELLER', focus: 1.15 });
  return out;
}
export const synDmg = (syn: Synergy[], type: TypeId) => syn.reduce((a, s) => a * (s.type === type ? s.dmg ?? 1 : 1), 1);
export const synFocus = (syn: Synergy[]) => syn.reduce((a, s) => a * (s.focus ?? 1), 1);

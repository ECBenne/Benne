import type { MoveDef, MoveKind } from './moves';

/** Zustand einer Attacke bei einem Monster: Stufe, gewählte Spezialisierungen, Einsatzregel. */
export interface MoveState { lv: number; perks: string[]; rule?: 'auto' | 'often' | 'rare' }
export const MAX_MOVE_LV = 5;
export const LV_BONUS = 0.1;                         // +10 % Wirkung je Stufe
export const upCost = (lv: number) => lv;            // Attackenpunkte für Stufe lv → lv+1 (1, 2, 3, 4)
export const PERK_LEVELS = [3, 5] as const;          // auf diesen Stufen wird eine Spezialisierung gewählt

export const PERKS: Record<string, { name: string; desc: string }> = {
  cd: { name: 'Schnell', desc: '-20% Abklingzeit' },
  pow: { name: 'Wucht', desc: '+15% Stärke' },
  range: { name: 'Reichweite', desc: '+25% Reichweite' },
  drain: { name: 'Aussaugen', desc: 'Heilt 10% des Schadens' },
  radius: { name: 'Großfläche', desc: '+25% Radius' },
  windup: { name: 'Blitzstart', desc: '-30% Aufladezeit' },
  effect: { name: 'Verstärkt', desc: '+30% Wirkung' },
  guard: { name: 'Schutz', desc: 'Gibt zusätzlich einen kleinen Schild' },
};
const CHOICES: Record<MoveKind, [[string, string], [string, string]]> = {
  projectile: [['cd', 'pow'], ['range', 'drain']],
  melee: [['cd', 'pow'], ['range', 'drain']],
  dash: [['cd', 'pow'], ['range', 'drain']],
  aoe: [['cd', 'radius'], ['pow', 'windup']],
  cone: [['cd', 'range'], ['pow', 'drain']],
  self: [['cd', 'effect'], ['guard', 'cd']],
  status: [['cd', 'range'], ['windup', 'cd']],
};
/** Die zwei Spezialisierungen, die auf Stufe 3 (i=0) bzw. 5 (i=1) zur Wahl stehen. */
export const perkChoices = (kind: MoveKind, i: 0 | 1) => CHOICES[kind][i];
/** Wie viele Spezialisierungen stehen bei dieser Stufe zu? */
export const perkSlots = (lv: number) => PERK_LEVELS.filter((l) => lv >= l).length;

export const RULES = { auto: { name: 'Normal', w: 1 }, often: { name: 'Oft', w: 1.5 }, rare: { name: 'Selten', w: 0.55 } } as const;
export const SLOT_WEIGHT = [1.25, 1.1, 1, 0.9];     // Rangfolge der Plätze

/** Wirksame Werte einer Attacke nach Stufe und Spezialisierungen. */
export function tunedMove(def: MoveDef, st?: MoveState): MoveDef {
  const lv = Math.max(1, Math.min(MAX_MOVE_LV, st?.lv ?? 1)), k = 1 + LV_BONUS * (lv - 1);
  const m: MoveDef = { ...def, status: def.status ? { ...def.status } : undefined };
  m.power = Math.round(def.power * k);
  if (m.heal) m.heal *= k; if (m.buff) m.buff *= k; if (m.shield) m.shield *= k;
  let cd = 0;
  for (const p of st?.perks ?? []) {
    if (p === 'cd') cd++;
    else if (p === 'pow') m.power = Math.round(m.power * 1.15);
    else if (p === 'range') { m.range *= 1.25; if (m.kind === 'melee' || m.kind === 'cone') m.radius = (m.radius ?? m.range) * 1.25; if (m.speed && m.kind === 'projectile') m.speed *= 1.15; }
    else if (p === 'drain') m.drain = (m.drain ?? 0) + 0.1;
    else if (p === 'radius') m.radius = (m.radius ?? 20) * 1.25;
    else if (p === 'windup') m.windup *= 0.7;
    else if (p === 'effect') { if (m.heal) m.heal *= 1.3; if (m.buff) m.buff *= 1.3; if (m.shield) m.shield *= 1.3; }
    else if (p === 'guard') m.shield = (m.shield ?? 0) + 0.1;
  }
  // Attacken ohne Schaden werden mit der Stufe schneller wieder einsetzbar
  const lvCd = def.stages && !def.power ? 1 - 0.06 * (lv - 1) : 1;
  m.cooldown = +(def.cooldown * Math.pow(0.8, cd) * lvCd).toFixed(2);
  return m;
}

/**
 * Fertigkeiten: bestimmen, wie klug und gut die Automatik deines Monsters kämpft.
 * Sie wachsen durch Einsatz im Kampf (schneller mit Bindung); die Obergrenze hängt von der Bindung ab.
 */
export type SkillId = 'dodge' | 'counter' | 'parry' | 'sense' | 'focus';
export const SKILL_IDS: SkillId[] = ['dodge', 'counter', 'parry', 'sense', 'focus'];
export const SKILLS: Record<SkillId, { name: string; desc: (lv: number) => string; how: string }> = {
  dodge: { name: 'Reflexe', how: 'WÄCHST DURCH AUTOMATISCHES AUSWEICHEN', desc: (l) => 'WEICHT ' + Math.round(l * 30) + '% ÖFTER UND SCHNELLER AUS · ' + Math.round(Math.min(70, l * 6.5)) + '% PERFEKT GETIMT' },
  counter: { name: 'Konterkraft', how: 'WÄCHST DURCH KONTER NACH AUSWEICHEN UND PARIEREN', desc: (l) => 'KONTER +' + l * 5 + '% STÄRKER · FENSTER +' + (l * 0.3).toFixed(1).replace('.', ',') + ' S' },
  parry: { name: 'Pariersinn', how: 'WÄCHST DURCH PARADEN', desc: (l) => 'PARIERT STARKE ANGRIFFE VON SELBST (' + Math.round(Math.min(100, l * 11)) + '% BEI BEREITEM FOKUS)' },
  sense: { name: 'Gespür', how: 'WÄCHST DURCH UNTERBRECHEN', desc: (l) => 'UNTERBRICHT GEGNERISCHES AUFLADEN (' + Math.round(l * 9) + '%) · UNTERBRECHEN +' + l * 3 + '% SCHADEN' },
  focus: { name: 'Konzentration', how: 'WÄCHST DURCH SPEZIALANGRIFFE', desc: (l) => 'FOKUS LÄDT ' + l * 5 + '% SCHNELLER · SETZT SPEZIAL SELBST EIN' + (l >= 3 ? ' · FEUERT AN' : '') + (l >= 5 ? ' · NUTZT TRÄNKE' : '') },
};
export const MAX_SKILL = 10;
/** Erfahrung bis zur nächsten Stufe. */
export const skillNeed = (lv: number) => 8 + 6 * lv;
/** Höchste erreichbare Stufe je Bindungsstufe (0..3). */
export const skillCap = (bondLvl: number) => Math.min(MAX_SKILL, 3 + 2 * bondLvl + (bondLvl >= 3 ? 1 : 0));
export interface SkillState { lv: number; xp: number }
export type Skills = Record<SkillId, SkillState>;
export const noSkills = (): Skills => ({ dodge: { lv: 0, xp: 0 }, counter: { lv: 0, xp: 0 }, parry: { lv: 0, xp: 0 }, sense: { lv: 0, xp: 0 }, focus: { lv: 0, xp: 0 } });
export type SkillLv = Record<SkillId, number>;
export const skillLevels = (s?: Partial<Skills>): SkillLv => ({ dodge: s?.dodge?.lv ?? 0, counter: s?.counter?.lv ?? 0, parry: s?.parry?.lv ?? 0, sense: s?.sense?.lv ?? 0, focus: s?.focus?.lv ?? 0 });
/** Gegner-Monster: Fertigkeiten wachsen mit dem Level (Bosse etwas besser). */
export const enemySkills = (level: number, boss = false): SkillLv => { const l = Math.max(0, Math.min(7, Math.floor((level - 6) / 6)) + (boss ? 1 : 0)); return { dodge: l, counter: Math.max(0, l - 1), parry: Math.max(0, l - 2), sense: Math.max(0, l - 1), focus: Math.max(0, l - 1) }; };
/** Erfahrung gutschreiben (Bindung beschleunigt); gibt neue Stufen zurück. */
export function gainSkill(s: Skills, id: SkillId, amount: number, bondLvl: number): number {
  const st = s[id], cap = skillCap(bondLvl); let ups = 0;
  if (st.lv >= cap) return 0;
  st.xp += amount * (1 + 0.25 * bondLvl);
  while (st.lv < cap && st.xp >= skillNeed(st.lv)) { st.xp -= skillNeed(st.lv); st.lv++; ups++; }
  if (st.lv >= cap) st.xp = Math.min(st.xp, skillNeed(st.lv) - 1);
  return ups;
}

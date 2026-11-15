import { Save, QuestState, Expedition, todayStr, now, gainXp, gainPlayerXp, xpNeed, Owned } from '../state';
import { Rng } from '../core/util';
import { SPECIES } from '../data/species';
import { AMULET_IDS } from '../data/items';
import { SCROLL_IDS } from '../data/moves';

/**
 * Tagesaufgaben, Wochenziel und alles, was auch ohne Spielen weiterläuft
 * (Trainingslager, Expeditionen, Gratis-Beutel). Reine Logik ohne Oberfläche.
 */

// ───────────── Tagesaufgaben ─────────────
export interface QuestDef { kind: string; tier: 0 | 1 | 2; goal: (lvl: number) => number; text: (goal: number, type?: string) => string }
const TN: Record<string, string> = { fire: 'FEUER', water: 'WASSER', grass: 'PFLANZEN', electric: 'ELEKTRO', rock: 'STEIN', ice: 'EIS', ghost: 'GEIST', wind: 'WIND', poison: 'GIFT', metal: 'METALL', light: 'LICHT', earth: 'ERDE', sound: 'KLANG', dark: 'DUNKEL', crystal: 'KRISTALL', normal: 'NORMAL' };
export const QUESTS: QuestDef[] = [
  { kind: 'wins', tier: 0, goal: (l) => (l < 8 ? 2 : 3), text: (n) => 'GEWINNE ' + n + ' KÄMPFE' },
  { kind: 'kos', tier: 0, goal: (l) => (l < 8 ? 4 : 6), text: (n) => 'BESIEGE ' + n + ' GEGNER-MONSTER' },
  { kind: 'dodges', tier: 0, goal: (l) => (l < 8 ? 10 : 16), text: (n) => 'WEICHE ' + n + '-MAL AUS' },
  { kind: 'specials', tier: 0, goal: (l) => (l < 8 ? 2 : 4), text: (n) => 'SETZE ' + n + '-MAL DEN SPEZIALANGRIFF EIN' },
  { kind: 'pickups', tier: 1, goal: (l) => (l < 8 ? 2 : 4), text: (n) => 'SAMMLE ' + n + ' ARENA-KRISTALLE EIN' },
  { kind: 'parries', tier: 1, goal: (l) => (l < 8 ? 2 : 3), text: (n) => 'PARIERE ' + n + ' ANGRIFFE MIT DEM SCHILD' },
  { kind: 'perfects', tier: 1, goal: (l) => (l < 8 ? 2 : 4), text: (n) => 'WEICHE ' + n + '-MAL PERFEKT AUS (WISCHEN KURZ VOR DEM TREFFER)' },
  { kind: 'interrupts', tier: 1, goal: (l) => (l < 8 ? 2 : 4), text: (n) => 'UNTERBRICH ' + n + ' ANGRIFFE DES GEGNERS WÄHREND DES AUFLADENS' },
  { kind: 'counters', tier: 1, goal: (l) => (l < 8 ? 3 : 5), text: (n) => 'LANDE ' + n + ' KONTER NACH EINEM AUSWEICHEN' },
  { kind: 'damage', tier: 1, goal: (l) => 1200 + l * 140, text: (n) => 'VERURSACHE ' + n + ' SCHADEN' },
  { kind: 'typeWin', tier: 1, goal: () => 1, text: (_n, t) => 'GEWINNE EINEN KAMPF MIT EINEM ' + (TN[t ?? 'fire'] ?? '') + '-MONSTER ALS ANFÜHRER' },
  { kind: 'chests', tier: 1, goal: () => 1, text: () => 'ÖFFNE EINE KISTE' },
  { kind: 'perfect', tier: 2, goal: () => 1, text: () => 'GEWINNE EINEN KAMPF, OHNE DASS EIN MONSTER K.O. GEHT' },
  { kind: 'ligaWins', tier: 2, goal: (l) => (l < 8 ? 2 : 3), text: (n) => 'GEWINNE ' + n + ' KÄMPFE IN LIGA, TURM, RAID ODER TURNIER' },
  { kind: 'combo', tier: 2, goal: () => 1, text: () => 'ERREICHE EINE KOMBO VON 5 TREFFERN, OHNE GETROFFEN ZU WERDEN' },
  { kind: 'hazards', tier: 2, goal: () => 3, text: () => 'ÜBERSTEHE 3 KÄMPFE, IN DENEN DEIN MONSTER KEINEN UNWETTERSCHADEN NIMMT' },
  { kind: 'expeditions', tier: 2, goal: () => 1, text: () => 'SCHICKE EINE EXPEDITION LOS' },
];
const TIER_REWARD = [{ coins: 60, potion: 1, xp: 10 }, { coins: 100, potion: 0, xp: 18 }, { coins: 160, potion: 0, xp: 30 }];
export const questReward = (q: QuestState) => TIER_REWARD[q.tier];
export const BONUS_REWARD = { coins: 150, keys: 1, xp: 40 };
export const WEEK_GOAL = 12, WEEK_REWARD = { coins: 320, keys: 2, revive: 1 };

const weekId = () => { const d = new Date(now()); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-W' + Math.ceil(((+t - +y) / 864e5 + 1) / 7); };
const hashStr = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

/** Stellt sicher, dass für heute Aufgaben da sind (neuer Tag = neue Aufgaben, neue Woche = Wochenzähler zurück). */
export function ensureQuests(s: Save) {
  const q = s.quests, day = todayStr(), wk = weekId();
  if (q.week !== wk) { q.week = wk; q.wkWins = 0; q.wkClaimed = false; }
  if (q.day === day && q.list.length === 3) return;
  const rng = new Rng(hashStr(day) + s.pl.lvl * 7 + s.nextId);
  const types = [...new Set(s.mons.slice(0, 20).map((m) => SPECIES[m.sp].types[0]))];
  const out: QuestState[] = [];
  for (const tier of [0, 1, 2] as const) {
    let pool = QUESTS.filter((d) => d.tier === tier);
    if (tier === 2 && s.pl.lvl < 6) pool = pool.filter((d) => d.kind !== 'expeditions');
    const d = pool[rng.int(0, pool.length - 1)];
    const type = d.kind === 'typeWin' ? types[rng.int(0, Math.max(0, types.length - 1))] ?? 'fire' : undefined;
    out.push({ id: day + '-' + tier, kind: d.kind, goal: d.goal(s.pl.lvl), prog: 0, claimed: false, type, tier });
  }
  q.day = day; q.list = out; q.bonus = false;
}
export const questText = (q: QuestState) => (QUESTS.find((d) => d.kind === q.kind) ?? QUESTS[0]).text(q.goal, q.type);

/** Fortschritt melden (n = Menge). */
export function track(s: Save, kind: string, n = 1, ctx: { type?: string } = {}) {
  ensureQuests(s);
  for (const q of s.quests.list) {
    if (q.kind !== kind || q.claimed || q.prog >= q.goal) continue;
    if (kind === 'typeWin' && q.type && ctx.type !== q.type) continue;
    q.prog = Math.min(q.goal, q.prog + n);
  }
}
export const questsDone = (s: Save) => s.quests.list.filter((q) => q.prog >= q.goal).length;
export const claimableQuests = (s: Save) => s.quests.list.filter((q) => q.prog >= q.goal && !q.claimed).length + (bonusReady(s) ? 1 : 0) + (weekReady(s) ? 1 : 0);
export const bonusReady = (s: Save) => !s.quests.bonus && s.quests.list.length === 3 && s.quests.list.every((q) => q.claimed);
export const weekReady = (s: Save) => !s.quests.wkClaimed && s.quests.wkWins >= WEEK_GOAL;

export function claimQuest(s: Save, id: string) {
  const q = s.quests.list.find((x) => x.id === id); if (!q || q.claimed || q.prog < q.goal) return null;
  q.claimed = true; s.tut.questDone = true; const r = TIER_REWARD[q.tier];
  s.coins += r.coins; s.inv.potion += r.potion; gainPlayerXp(s, r.xp);
  return r;
}
export function claimBonus(s: Save) { if (!bonusReady(s)) return false; s.quests.bonus = true; s.coins += BONUS_REWARD.coins; s.inv.keys += BONUS_REWARD.keys; gainPlayerXp(s, BONUS_REWARD.xp); return true; }
export function claimWeek(s: Save) { if (!weekReady(s)) return false; s.quests.wkClaimed = true; s.coins += WEEK_REWARD.coins; s.inv.keys += WEEK_REWARD.keys; s.inv.revive += WEEK_REWARD.revive; return true; }

// ───────────── Trainingslager ─────────────
export const CAMP_CAP_H = 8;
export const campSlots = (s: Save) => 1 + (s.pl.lvl >= 5 ? 1 : 0) + (s.pl.lvl >= 10 ? 1 : 0) + (s.pl.lvl >= 16 ? 1 : 0);
export const campHours = (s: Save) => (s.camp.ids.length && s.camp.since ? Math.max(0, Math.min(CAMP_CAP_H, (now() - s.camp.since) / 36e5)) : 0);
export const campXpPerHour = (o: Owned) => Math.max(2, Math.round(xpNeed(o.level) * 0.14));
export const campBondPerHour = 0.25;
export function campPreview(s: Save) {
  const h = campHours(s);
  return s.camp.ids.map((id) => { const o = s.mons.find((m) => m.id === id)!; return { o, xp: Math.floor(campXpPerHour(o) * h), bond: Math.floor(h * campBondPerHour) }; }).filter((x) => x.o);
}
export function campCollect(s: Save) {
  const prev = campPreview(s), out = prev.map((p) => ({ name: SPECIES[p.o.sp].name, xp: p.xp, bond: p.bond, levels: 0 }));
  prev.forEach((p, i) => { const r = gainXp(s, p.o, p.xp); p.o.bond += p.bond; out[i].levels = r.levels; });
  s.camp.since = now();
  if (prev.some((p) => p.xp > 0)) track(s, 'camp', 1);
  return out;
}
export function campAssign(s: Save, id: number) {
  if (s.camp.ids.includes(id) || s.camp.ids.length >= campSlots(s) || isBusy(s, id)) return false;
  if (s.camp.ids.length === 0) s.camp.since = now(); else campCollect(s);
  s.camp.ids.push(id); return true;
}
export function campRemove(s: Save, id: number) { campCollect(s); s.camp.ids = s.camp.ids.filter((x) => x !== id); }

// ───────────── Expeditionen ─────────────
export const EXPED_KINDS: Record<Expedition['kind'], { name: string; blurb: string }> = {
  treasure: { name: 'SCHATZSUCHE', blurb: 'VIELE MÜNZEN, DAZU MANCHMAL TRÄNKE.' },
  explore: { name: 'ERKUNDUNG', blurb: 'ERFAHRUNG FÜR DAS MONSTER, MANCHMAL EIN AMULETT ODER EINE SCHRIFTROLLE.' },
  cave: { name: 'KRISTALLHÖHLE', blurb: 'WENIGER MÜNZEN, ABER CHANCE AUF EINEN KISTENSCHLÜSSEL.' },
};
export const EXPED_DURS = [0.5, 2, 8];   // Stunden
export const expedSlots = (s: Save) => 1 + (s.pl.lvl >= 6 ? 1 : 0) + (s.pl.lvl >= 12 ? 1 : 0);
export const isBusy = (s: Save, id: number) => s.exped.some((e) => e.mon === id);
export const expedLeft = (e: Expedition) => Math.max(0, e.start + e.dur * 36e5 - now());
export const expedDone = (e: Expedition) => expedLeft(e) <= 0;
export function expedStart(s: Save, mon: number, kind: Expedition['kind'], dur: number) {
  if (s.exped.length >= expedSlots(s) || isBusy(s, mon) || s.team.includes(mon) || s.camp.ids.includes(mon)) return false;
  s.exped.push({ id: s.nextId++, mon, start: now(), dur, kind, seed: (Math.random() * 1e9) | 0 });
  track(s, 'expeditions', 1); return true;
}
export interface ExpedLoot { name: string; coins: number; potions: number; keys: number; xp: number; levels: number; amulet: string | null; scroll: string | null }
export function expedClaim(s: Save, id: number): ExpedLoot | null {
  const e = s.exped.find((x) => x.id === id); if (!e || !expedDone(e)) return null;
  const o = s.mons.find((m) => m.id === e.mon)!, rng = new Rng(e.seed), h = e.dur, lv = o.level;
  const f = 0.7 + lv / 28;
  const loot: ExpedLoot = { name: SPECIES[o.sp].name, coins: 0, potions: 0, keys: 0, xp: 0, levels: 0, amulet: null, scroll: null };
  if (e.kind === 'treasure') { loot.coins = Math.round(60 * Math.pow(h, 0.8) * f); if (rng.chance(0.15 * Math.sqrt(h))) loot.potions = 1; }
  else if (e.kind === 'explore') { loot.coins = Math.round(25 * Math.pow(h, 0.8) * f); loot.xp = Math.round(xpNeed(lv) * 0.2 * Math.pow(h, 0.7)); if (rng.chance(Math.min(0.35, 0.09 * Math.sqrt(h) + 0.04))) { if (rng.chance(0.5)) loot.amulet = AMULET_IDS[rng.int(0, AMULET_IDS.length - 1)]; else loot.scroll = SCROLL_IDS[rng.int(0, SCROLL_IDS.length - 1)]; } }
  else { loot.coins = Math.round(30 * Math.pow(h, 0.8) * f); if (rng.chance(h <= 0.5 ? 0.05 : h <= 2 ? 0.22 : 0.7)) loot.keys = 1; }
  s.coins += loot.coins; s.inv.potion += loot.potions; s.inv.keys += loot.keys;
  if (loot.amulet) s.inv.amulets.push(loot.amulet); if (loot.scroll) s.inv.scrolls.push(loot.scroll);
  if (loot.xp) loot.levels = gainXp(s, o, loot.xp).levels;
  s.exped = s.exped.filter((x) => x.id !== id);
  return loot;
}

// ───────────── Gratis-Beutel ─────────────
export const SACK_EVERY_H = 6;
export const sackLeft = (s: Save) => Math.max(0, s.sack.last + SACK_EVERY_H * 36e5 - now());
export const sackReady = (s: Save) => sackLeft(s) <= 0;
export function sackClaim(s: Save) {
  if (!sackReady(s)) return null;
  const rng = new Rng((now() / 1000) | 0), coins = 40 + s.pl.lvl * 6 + rng.int(0, 30), potion = rng.chance(0.4) ? 1 : 0, focus = rng.chance(0.2) ? 1 : 0;
  s.sack.last = now(); s.coins += coins; s.inv.potion += potion; s.inv.focus += focus;
  return { coins, potion, focus };
}

// ───────────── Rückkehr-Bericht ─────────────
export function offlineSummary(s: Save) {
  const camp = campHours(s), doneExp = s.exped.filter(expedDone).length;
  return { camp: s.camp.ids.length > 0 && camp >= 1, campHours: camp, expeditions: doneExp, sack: sackReady(s), any: (s.camp.ids.length > 0 && camp >= 1) || doneExp > 0 };
}
export const homeDot = (s: Save) => claimableQuests(s) > 0 || sackReady(s) || s.exped.some(expedDone) || (s.camp.ids.length > 0 && campHours(s) >= 1);

// ───────────── Erste Schritte (Einstiegsliste nach dem Tutorial) ─────────────
export const FIRSTS: { id: string; text: string; done: (s: Save) => boolean }[] = [
  { id: 'win', text: 'GEWINNE DEINEN ERSTEN KAMPF (SPIELEN → LIGA)', done: (s) => s.stats.wins >= 1 },
  { id: 'moves', text: 'STUFE EINE ATTACKE AUF (TEAM → MONSTER → ATTACKE)', done: (s) => s.mons.some((o) => Object.values(o.mv).some((m) => m.lv > 1)) },
  { id: 'chest', text: 'ÖFFNE DEINE ERSTE KISTE (SHOP → KISTEN)', done: (s) => s.chest.opened >= 1 },
  { id: 'camp', text: 'SCHICKE EIN MONSTER INS TRAININGSLAGER ODER AUF EXPEDITION', done: (s) => s.camp.ids.length > 0 || s.exped.length > 0 },
  { id: 'quest', text: 'HOLE DIR EINE TAGESAUFGABE AB', done: (s) => s.tut.questDone },
];
export const FIRST_REWARD = 60, FIRST_ALL = { keys: 1, coins: 100 };
export const firstsDoneCount = (s: Save) => FIRSTS.filter((f) => s.tut.firsts.includes(f.id)).length;
export const firstsOpen = (s: Save) => s.tut.battle && firstsDoneCount(s) < FIRSTS.length;
/** Neu erledigte Schritte belohnen; gibt deren Texte zurück. */
export function checkFirsts(s: Save): string[] {
  const out: string[] = [];
  for (const f of FIRSTS) if (!s.tut.firsts.includes(f.id) && f.done(s)) { s.tut.firsts.push(f.id); s.coins += FIRST_REWARD; out.push(f.text); }
  if (out.length && firstsDoneCount(s) === FIRSTS.length) { s.inv.keys += FIRST_ALL.keys; s.coins += FIRST_ALL.coins; }
  return out;
}

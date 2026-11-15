import type { Game } from '../game';
import { h, onTap, spriteCanvas, pixIcon } from './dom';
import { sfx } from '../audio';
import { SPECIES } from '../data/species';
import { TYPE_NAMES } from '../data/types';
import { ARENA_MODS } from '../data/league';
import { MAPS } from '../data/maps';
import * as L from '../league';
import { playMenu } from './modes';
import { applyWin, battleStats } from './reward';
import { synergyBox } from './menus';
import { gainPlayerXp, markSeen } from '../state';
import type { Battle } from '../battle/battle';

interface Series { round: number; team: number[]; earned: number; seed: number }

export function seriesIntro(g: Game) {
  const s = g.save, box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); playMenu(g); });
  box.append(bk, h('h2', '', 'TRAINER-SERIE'), h('div', 'subt', 'REKORD: ' + s.stats.seriesBest + ' SIEGE IN FOLGE'));
  box.append(h('div', 'bigp', 'KÄMPFE GEGEN TRAINER, EINEN NACH DEM ANDEREN. NACH JEDEM SIEG WIRD DEIN GANZES TEAM VOLL GEHEILT – DAFÜR WERDEN DIE GEGNER SCHNELL STÄRKER UND BRINGEN MEHR MONSTER MIT. ALLE 5 RUNDEN WARTET EIN CHAMPION. EINE NIEDERLAGE BEENDET DIE SERIE; MÜNZEN UND ERFAHRUNG BEHÄLTST DU.'));
  box.append(h('div', 'banner2', 'BELOHNUNG: MÜNZEN UND ERFAHRUNG JE SIEG · KISTENSCHLÜSSEL ALLE 5 SIEGE'));
  const strip = h('div', 'tstrip'); for (const o of g.teamOwned) { const c = h('div', 'tmini'); c.append(spriteCanvas(o.sp, 1), h('span', '', SPECIES[o.sp].name.toUpperCase().slice(0, 10)), h('span', '', 'LV ' + o.level)); strip.append(c); }
  const go = h('button', 'btn big', 'SERIE STARTEN');
  onTap(go, () => { sfx.ui(); seriesRound(g, { round: 1, team: [...g.save.team], earned: 0, seed: (Math.random() * 1e9) | 0 }); });
  box.append(h('div', 'sec', 'DEIN TEAM'), strip, synergyBox(g.teamOwned.map((o) => SPECIES[o.sp].types)), go); g.setScreen(box);
}

function seriesRound(g: Game, t: Series) {
  g.toMenu();
  const spec = L.seriesSpec(t.team, g.save, t.round, t.seed); spec.mons.forEach((m) => markSeen(g.save, m.sp));
  const boss = t.round % 5 === 0, box = h('div', 'page');
  box.append(h('h2', '', (boss ? 'CHAMPION ' : 'GEGNER ') + t.round), h('div', 'subt', spec.name.toUpperCase() + ' · ARENA: ' + MAPS[spec.map].name.toUpperCase() + (spec.mod !== 'none' ? ' · ' + ARENA_MODS[spec.mod].name.toUpperCase() : '')));
  const prof = h('div', 'banner2 prof'); prof.append(h('b', '', 'STIL'), document.createTextNode(spec.styleText ?? ''));
  if (spec.quote) prof.append(document.createElement('br'), h('i', 'quote', '„' + spec.quote + '“')); box.append(prof);
  const er = h('div', 'erow'); for (const m of spec.mons) { const c = h('div', 'ecard' + (m.boss ? ' boss' : '')); c.append(spriteCanvas(m.sp, 1), h('b', '', SPECIES[m.sp].name.toUpperCase()), h('span', '', 'LV ' + m.level + ' · ' + SPECIES[m.sp].types.map((x) => TYPE_NAMES[x].toUpperCase()).join('/'))); er.append(c); }
  box.append(er, h('div', 'tip', 'DEIN TEAM IST VOLL GEHEILT. BISHER: ' + (t.round - 1) + ' SIEGE · ' + t.earned + ' MÜNZEN'));
  const go = h('button', 'btn big', 'KAMPF!');
  onTap(go, () => {
    sfx.ui(); const hp: Record<number, number> = {}; t.team.forEach((id) => (hp[id] = 1));
    const size = L.battleSize(t.team.length, spec), len = L.lenMulOf(spec);
    g.beginBattle({ kind: 'tower', player: L.playerTrainer(g.save, { team: t.team, hp }, size, len), enemy: L.enemyTrainer(spec, size, len), len, mod: spec.mod, map: spec.map, banner: (boss ? 'CHAMPION ' : 'GEGNER ') + t.round, sub: spec.name.toUpperCase(), onEnd: (win, b) => seriesAfter(g, t, spec, win, b) });
  });
  const out = h('button', 'btn ghost', 'AUFGEBEN'); onTap(out, () => { sfx.back(); seriesEnd(g, t, false, true); });
  box.append(go, out); g.setScreen(box);
}

function seriesAfter(g: Game, t: Series, spec: L.EnemySpec, win: boolean, b: Battle) {
  g.save.stats.battles++;
  if (!win) { gainPlayerXp(g.save, 8); g.persist(); return seriesEnd(g, t, true, false); }
  const r = applyWin(g, b, { coins: spec.coins, monXp: 14 + t.round, plXp: 20 + t.round * 2 });
  t.earned += r.total; g.save.stats.seriesBest = Math.max(g.save.stats.seriesBest, t.round);
  const key = t.round % 5 === 0; if (key) g.save.inv.keys++;
  g.persist();
  const box = h('div', 'modal result win');
  box.append(h('h2', '', 'GEGNER ' + t.round + ' BESIEGT'), ...r.nodes);
  if (key) box.append(h('div', 'evo', '🗝 CHAMPION BESIEGT: +1 KISTENSCHLÜSSEL'));
  box.append(battleStats(b), h('div', 'sub', 'DEIN TEAM WIRD VOLL GEHEILT. DER NÄCHSTE GEGNER IST STÄRKER.'));
  const next = h('button', 'btn big', 'NÄCHSTER GEGNER'); onTap(next, () => { sfx.ui(); t.round++; seriesRound(g, t); });
  const out = h('button', 'btn ghost', 'AUFHÖREN'); onTap(out, () => { sfx.back(); seriesEnd(g, t, false, false); });
  box.append(next, out); g.setScreen(box);
}

function seriesEnd(g: Game, t: Series, lost: boolean, quit: boolean) {
  const wins = Math.max(0, t.round - 1);
  const box = h('div', 'modal result ' + (lost ? 'lose' : 'win'));
  box.append(h('h2', '', lost ? 'SERIE BEENDET' : quit ? 'AUFGEGEBEN' : 'GUT GEKÄMPFT'), h('div', 'sub', lost ? 'DER ' + t.round + '. GEGNER WAR ZU STARK.' : 'DU HÖRST AUF.'));
  const st = h('div', 'stats'); const sv = (k: string, v: string) => { const r = h('div', 'srow'); r.append(h('span', '', k), h('b', '', v)); st.append(r); };
  sv('SIEGE IN FOLGE', String(wins)); sv('MÜNZEN VERDIENT', String(t.earned)); sv('REKORD', String(g.save.stats.seriesBest)); box.append(st);
  const ok = h('button', 'btn big', 'ZURÜCK'); onTap(ok, () => { sfx.ui(); g.toMenu(); playMenu(g); }); box.append(ok); g.setScreen(box);
}

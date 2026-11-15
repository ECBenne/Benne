import type { Game } from '../game';
import type { Battle } from '../battle/battle';
import { h, icons, spriteCanvas } from './dom';
import { sfx } from '../audio';
import { SPECIES } from '../data/species';
import { MOVES } from '../data/moves';
import { gainXp, gainPlayerXp, xpNeed, plNeed } from '../state';

/** Sieg auswerten: Sterne, Münzen, Monster- und Spieler-Erfahrung. Gibt die Anzeige-Elemente zurück. */
export function applyWin(g: Game, b: Battle, o: { coins: number; monXp: number; plXp: number }): { stars: number; total: number; nodes: HTMLElement[] } {
  const pt = b.trainers[0], s = g.save, nodes: HTMLElement[] = [];
  const kos = pt.team.filter((m) => !m.alive).length, avgHp = pt.team.reduce((a, m) => a + m.hp / m.maxHp, 0) / pt.team.length;
  const stars = kos === 0 && avgHp >= 0.6 ? 3 : kos === 0 ? 2 : 1;
  const bonus = Math.round(o.coins * 0.15 * (stars - 1)), total = o.coins + bonus;
  s.stats.wins++; s.stats.stars += stars; s.coins += total;
  const sr = h('div', 'stars'); for (let i = 0; i < 3; i++) sr.append(h('b', i < stars ? 'on' : '', '★'));
  nodes.push(sr, h('div', 'sub', stars === 3 ? 'PERFEKT! KEIN K.O., VIELE KP.' : stars === 2 ? 'GUT! KEIN MONSTER K.O.' : 'GESCHAFFT – MIT VERLUSTEN.'));
  // Monster-Erfahrung
  const xpBox = h('div', 'xpbox'); let special = false;
  for (const m of pt.team) {
    if (!m.fought) continue;
    const ow = s.mons.find((x) => x.id === m.ownerId); if (!ow) continue;
    const beforeName = SPECIES[ow.sp].name.toUpperCase(), beforeLv = ow.level;
    const r = gainXp(s, ow, o.monXp);
    const row = h('div', 'xprow'); const bar = h('div', 'bar'); const f = h('i', 'stat'); f.style.width = Math.round((ow.xp / xpNeed(ow.level)) * 100) + '%'; bar.append(f);
    const tx = h('div', 'tx'); tx.append(h('span', '', beforeName + (r.levels ? '  LV ' + beforeLv + ' ▶ ' + ow.level : '  LV ' + ow.level)), bar);
    row.append(spriteCanvas(ow.sp, 1), tx, h('b', '', '+' + o.monXp + ' EP')); xpBox.append(row);
    for (const e of r.evolved) { xpBox.append(h('div', 'evo', '★ ' + SPECIES[e.from].name.toUpperCase() + ' ENTWICKELT SICH ZU ' + SPECIES[e.to].name.toUpperCase() + '!')); special = true; }
    for (const mv of r.learned) { xpBox.append(h('div', 'evo', '✦ NEUE ATTACKE: ' + MOVES[mv].name.toUpperCase() + (ow.moves.includes(mv) ? '' : ' (IM TEAM-MENÜ AUSRÜSTEN)'))); special = true; }
  }
  nodes.push(xpBox);
  const rw = h('div', 'srow'); const rwb = h('b'); rwb.append(icons.coin(1), document.createTextNode(' +' + o.coins + (bonus ? ' +' + bonus + ' BONUS' : ''))); rw.append(h('span', '', 'MÜNZEN'), rwb); nodes.push(rw);
  // Spieler-Erfahrung
  const pr = gainPlayerXp(s, o.plXp + 5 * stars);
  const prow = h('div', 'srow'); prow.append(h('span', '', 'SPIELER-EP'), h('b', '', '+' + (o.plXp + 5 * stars) + ' · ' + s.pl.xp + '/' + plNeed(s.pl.lvl))); nodes.push(prow);
  if (pr.levels) { nodes.push(h('div', 'evo', '▲ SPIELERLEVEL ' + s.pl.lvl + '! +' + pr.coins + ' MÜNZEN' + (pr.potions ? ' · +' + pr.potions + ' TRANK' : '') + (pr.revives ? ' · +' + pr.revives + ' BELEBER' : '') + (pr.keys ? ' · +' + pr.keys + ' SCHLÜSSEL' : ''))); special = true; }
  if (special) sfx.handle({ type: 'heal' }, false);
  return { stars, total, nodes };
}

export function battleStats(b: Battle): HTMLElement {
  const st = h('div', 'stats'); const sv = (k: string, v: string) => { const r = h('div', 'srow'); r.append(h('span', '', k), h('b', '', v)); st.appendChild(r); };
  sv('SCHADEN', String(b.stats.dmg[0])); sv('AUSGEWICHEN', String(b.stats.dodges[0])); sv('KONTER', String(b.stats.counters[0])); sv('GEBLOCKT', String(b.stats.blocked[0])); sv('DAUER', Math.round(b.t) + 'S');
  return st;
}

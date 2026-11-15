import type { Game } from '../game';
import { h, onTap, spriteCanvas, pixIcon } from './dom';
import { sfx } from '../audio';
import { SPECIES, BASE_IDS, formAt } from '../data/species';
import { TYPE_NAMES } from '../data/types';
import type { TypeId } from '../data/types';
import { ARENA_MODS, TRAINER_DEFS, STYLE_INFO, RIVAL } from '../data/league';
import { MAPS, MAP_IDS } from '../data/maps';
import { CUP_HEAL, CUPS, CupDef, cupById, rivalStory } from '../data/cups';
import { RANKS, rankOf, plNeed, gainPlayerXp, markSeen } from '../state';
import * as L from '../league';
import { Rng } from '../core/util';
import { applyWin, battleStats } from './reward';
import { synergyBox } from './menus';
import { playMenu } from './modes';
import type { Battle } from '../battle/battle';

interface Tourney { cup: CupDef; round: number; team: number[]; hp: Record<number, number>; earned: number; seed: number }

const roundSpec = (g: Game, t: Tourney) => L.cupRoundSpec(g.save, t.cup, t.team, t.round, t.seed);

export function cupsMenu(g: Game) {
  const box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); playMenu(g); });
  const total = Object.values(g.save.trophies).filter((n) => n > 0).length;
  box.append(bk, h('h2', '', 'TURNIERE'), h('div', 'subt', 'POKALE: ' + total + ' / ' + CUPS.length), h('div', 'natdesc', 'FESTE REGELN, MEHRERE RUNDEN, POKAL ALS BELOHNUNG. DEIN TEAM ERHOLT SICH ZWISCHEN DEN RUNDEN UM 40 %.'));
  for (const cup of CUPS) {
    const open = g.save.pl.lvl >= cup.minPl, won = g.save.trophies[cup.id] ?? 0;
    const r = h('button', 'modecard' + (open ? '' : ' off')); const tx = h('div', 'tx');
    tx.append(h('b', '', (won ? '★ ' : '') + cup.name.toUpperCase()), h('span', '', cup.blurb), h('small', '', open ? cup.rounds.length + ' RUNDEN · MAX. ' + cup.maxTeam + ' MONSTER' + (won ? ' · GEWONNEN: ' + won + '×' : '') : '🔒 FREI AB SPIELERLEVEL ' + cup.minPl));
    r.append(pixIcon(cup.rival ? 'rival' : 'boss', 4), tx, h('span', 'go', open ? '▶' : ''));
    onTap(r, () => { if (!open) return g.toast('FREI AB SPIELERLEVEL ' + cup.minPl); sfx.ui(); cupIntro(g, cup); }); box.append(r);
  }
  g.setScreen(box);
}

function cupIntro(g: Game, cup: CupDef) {
  const team = g.save.team.slice(0, cup.maxTeam);
  const box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); cupsMenu(g); });
  const won = g.save.trophies[cup.id] ?? 0;
  box.append(bk, h('h2', '', cup.name.toUpperCase()), h('div', 'subt', cup.rounds.length + ' RUNDEN · MAX. ' + cup.maxTeam + ' MONSTER'), h('div', 'bigp', cup.blurb));
  box.append(h('div', 'sec', 'TURNIERBAUM'));
  const tree = h('div', 'bracket'); cup.rounds.forEach((n, i) => tree.append(h('div', 'br' + (i === cup.rounds.length - 1 ? ' fin' : ''), (i + 1) + '. ' + n + (cup.rival && i === cup.rounds.length - 1 ? ' · RIVALE KAI' : '')))); box.append(tree);
  box.append(h('div', 'banner2', 'BELOHNUNG: ' + (won ? 'MÜNZEN (WIEDERHOLUNG HALB)' : 'POKAL · ' + cup.keys + ' KISTENSCHLÜSSEL' + (cup.amulet ? ' · AMULETT' : '') + ' · MÜNZEN')));
  box.append(h('div', 'sec', 'DEIN TEAM (DIE ERSTEN ' + cup.maxTeam + ')'));
  const strip = h('div', 'tstrip'); for (const id of team) { const o = L.ownedOf(g.save, id); const c = h('div', 'tmini'); c.append(spriteCanvas(o.sp, 1), h('span', '', SPECIES[o.sp].name.toUpperCase().slice(0, 10)), h('span', '', 'LV ' + o.level)); strip.append(c); }
  box.append(strip, synergyBox(team.map((id) => SPECIES[L.ownedOf(g.save, id).sp].types), 'DEINE SYNERGIEN'));
  if (g.save.team.length > cup.maxTeam) box.append(h('div', 'natdesc', 'DEIN TEAM IST GRÖSSER: NUR DIE ERSTEN ' + cup.maxTeam + ' DÜRFEN ANTRETEN. DIE REIHENFOLGE ÄNDERST DU IM TEAM-TAB.'));
  const go = h('button', 'btn big', 'TURNIER STARTEN');
  onTap(go, () => { sfx.ui(); const hp: Record<number, number> = {}; team.forEach((id) => (hp[id] = 1)); cupRound(g, { cup, round: 0, team, hp, earned: 0, seed: (Math.random() * 1e9) | 0 }); });
  box.append(go); g.setScreen(box);
}

function cupRound(g: Game, t: Tourney) {
  g.toMenu();
  const spec = roundSpec(g, t), name = t.cup.rounds[t.round]; spec.mons.forEach((m) => markSeen(g.save, m.sp));
  const box = h('div', 'page');
  box.append(h('h2', '', name), h('div', 'subt', spec.name.toUpperCase() + ' · ARENA: ' + MAPS[spec.map].name.toUpperCase() + (spec.mod !== 'none' ? ' · WETTER: ' + ARENA_MODS[spec.mod].name.toUpperCase() : '')));
  const prof = h('div', 'banner2 prof'); prof.append(h('b', '', 'STIL'), document.createTextNode(spec.styleText ?? ''));
  if (spec.quote) prof.append(document.createElement('br'), h('i', 'quote', '„' + spec.quote + '“'));
  if (spec.kind === 'rival') prof.append(document.createElement('br'), document.createTextNode('BISHERIGE DUELLE: ' + g.save.rival.wins + ' SIEGE · ' + g.save.rival.losses + ' NIEDERLAGEN'));
  box.append(prof);
  const er = h('div', 'erow'); for (const m of spec.mons) { const c = h('div', 'ecard'); c.append(spriteCanvas(m.sp, 1), h('b', '', SPECIES[m.sp].name.toUpperCase()), h('span', '', 'LV ' + m.level + ' · ' + SPECIES[m.sp].types.map((x) => TYPE_NAMES[x].toUpperCase()).join('/'))); er.append(c); }
  box.append(er, synergyBox(spec.mons.map((m) => SPECIES[m.sp].types), 'GEGNER-SYNERGIEN'), h('div', 'sec', 'DEIN TEAM'));
  const strip = h('div', 'tstrip');
  for (const id of t.team) { const o = L.ownedOf(g.save, id), hp = t.hp[id] ?? 0; const c = h('div', 'tmini' + (hp <= 0 ? ' ko' : '')); const bar = h('div', 'bar'); const f = h('i'); f.style.width = Math.round(hp * 100) + '%'; f.className = hp > 0.5 ? '' : hp > 0.2 ? 'mid' : 'low'; bar.append(f); c.append(spriteCanvas(o.sp, 1), bar, h('span', '', hp <= 0 ? 'K.O.' : Math.round(hp * 100) + '%')); strip.append(c); }
  const go = h('button', 'btn big', 'KAMPF!');
  onTap(go, () => {
    sfx.ui();
    const size = L.battleSize(t.team.length, spec), len = L.lenMulOf(spec);
    g.beginBattle({ kind: 'cup', player: L.playerTrainer(g.save, t, size, len), enemy: L.enemyTrainer(spec, size, len), len, mod: spec.mod, map: spec.map, banner: name, sub: t.cup.name.toUpperCase(), onEnd: (win, b) => cupAfter(g, t, spec, win, b) });
  });
  const out = h('button', 'btn ghost', 'AUFGEBEN'); onTap(out, () => { sfx.back(); cupEnd(g, t, false, true); });
  box.append(strip, go, out); g.setScreen(box);
}

function cupAfter(g: Game, t: Tourney, spec: L.EnemySpec, win: boolean, b: Battle) {
  const pt = b.trainers[0]; g.save.stats.battles++;
  if (spec.kind === 'rival') { if (win) g.save.rival.wins++; else g.save.rival.losses++; }
  for (const m of pt.team) t.hp[m.ownerId] = m.alive ? m.hp / m.maxHp : 0;
  if (!win) { gainPlayerXp(g.save, 8); g.persist(); return cupEnd(g, t, false, false); }
  const final = t.round === t.cup.rounds.length - 1;
  const r = applyWin(g, b, { coins: spec.coins, monXp: 16 + t.round * 4, plXp: 24 + t.round * 8 });
  t.earned += r.total;
  for (const id of t.team) if ((t.hp[id] ?? 0) > 0) t.hp[id] = Math.min(1, t.hp[id] + CUP_HEAL);
  g.persist();
  if (final) return cupEnd(g, t, true, false, r.nodes);
  const box = h('div', 'modal result win');
  box.append(h('h2', '', t.cup.rounds[t.round] + ' GEWONNEN'), ...r.nodes, battleStats(b), h('div', 'sub', 'WEITER GEHT ES MIT: ' + t.cup.rounds[t.round + 1]));
  const next = h('button', 'btn big', 'NÄCHSTE RUNDE'); onTap(next, () => { sfx.ui(); t.round++; cupRound(g, t); });
  box.append(next); g.setScreen(box);
}

function cupEnd(g: Game, t: Tourney, champion: boolean, quit: boolean, extra: HTMLElement[] = []) {
  const box = h('div', 'modal result ' + (champion ? 'win' : 'lose'));
  if (champion) {
    const first = !(g.save.trophies[t.cup.id] > 0); g.save.trophies[t.cup.id] = (g.save.trophies[t.cup.id] ?? 0) + 1;
    const bonus = Math.round(t.cup.coins * (first ? 1.5 : 0.7)); g.save.coins += bonus;
    if (first) { g.save.inv.keys += t.cup.keys; if (t.cup.amulet) { const a = L.randomAmulets(new Rng(t.seed), 1, g.save.inv.amulets)[0]; if (a) g.save.inv.amulets.push(a); } }
    g.persist(); sfx.jingle(true);
    box.append(h('h2', '', '🏆 TURNIERSIEG!'), h('div', 'sub', t.cup.name.toUpperCase() + ' GEWONNEN'), ...extra);
    box.append(h('div', 'evo', 'POKAL-PRÄMIE: +' + bonus + ' MÜNZEN' + (first ? ' · +' + t.cup.keys + ' KISTENSCHLÜSSEL' + (t.cup.amulet ? ' · +1 AMULETT' : '') : '')));
    if (t.cup.rival) box.append(h('div', 'sub', 'KAI: „' + RIVAL.quotes[2] + '“'));
  } else {
    g.persist();
    box.append(h('h2', '', quit ? 'AUFGEGEBEN' : 'AUSGESCHIEDEN'), h('div', 'sub', quit ? 'DU VERLÄSST DAS TURNIER.' : 'IN DER ' + t.cup.rounds[t.round] + ' WAR SCHLUSS. ES KOSTET NICHTS – VERSUCH ES NOCH EINMAL!'));
  }
  const st = h('div', 'stats'); const sv = (k: string, v: string) => { const r = h('div', 'srow'); r.append(h('span', '', k), h('b', '', v)); st.append(r); };
  sv('RUNDEN GESCHAFFT', String(champion ? t.cup.rounds.length : t.round)); sv('MÜNZEN VERDIENT', String(t.earned)); box.append(st);
  const ok = h('button', 'btn big', 'ZU DEN TURNIEREN'); onTap(ok, () => { sfx.ui(); g.toMenu(); cupsMenu(g); }); box.append(ok); g.setScreen(box);
}

// ───────────── Karriere ─────────────
export function careerScreen(g: Game) {
  const s = g.save, box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); playMenu(g); });
  const rk = rankOf(s.pl.lvl), idx = RANKS.findIndex((x) => x.n === rk.n), nxt = RANKS[idx + 1];
  box.append(bk, h('h2', '', 'KARRIERE'), h('div', 'subt', 'RANG: ' + rk.n.toUpperCase() + ' · SPIELERLEVEL ' + s.pl.lvl));
  const xb = h('div', 'bar'); xb.style.width = '220px'; const xi = h('i', 'stat'); xi.style.width = Math.round((s.pl.xp / plNeed(s.pl.lvl)) * 100) + '%'; xb.append(xi);
  box.append(xb, h('div', 'natdesc', nxt ? 'NÄCHSTER RANG: ' + nxt.n.toUpperCase() + ' AB SPIELERLEVEL ' + nxt.w : 'HÖCHSTER RANG ERREICHT!'));
  const lad = h('div', 'bracket'); RANKS.forEach((x, i) => lad.append(h('div', 'br' + (i === idx ? ' fin' : ''), (i <= idx ? '✔ ' : '· ') + x.n.toUpperCase() + ' · LV ' + x.w))); box.append(h('div', 'sec', 'KARRIERELEITER'), lad);
  box.append(h('div', 'sec', 'POKALSCHRANK'));
  const tg = h('div', 'trophies'); for (const c of CUPS) { const n = s.trophies[c.id] ?? 0; const d = h('div', 'trophy' + (n ? ' on' : ''), (n ? '🏆' : '·') ); d.append(h('span', '', c.name.toUpperCase().replace('-CUP', '').replace('MEISTERSCHAFT', 'MEISTER')), h('small', '', n ? n + '×' : 'OFFEN')); tg.append(d); } box.append(tg);
  box.append(h('div', 'sec', 'RIVALE KAI'));
  const rv = h('div', 'banner2 prof'); rv.append(h('b', '', RIVAL.title.toUpperCase()), document.createTextNode(rivalStory(s.rival.wins)), document.createElement('br'), document.createTextNode('BILANZ: ' + s.rival.wins + ' SIEGE · ' + s.rival.losses + ' NIEDERLAGEN')); box.append(rv);
  box.append(h('div', 'sec', 'BILANZ'));
  const st = h('div', 'stats'); const sv = (k: string, v: string) => { const r = h('div', 'srow'); r.append(h('span', '', k), h('b', '', v)); st.append(r); };
  sv('LIGEN GEWONNEN', String(s.stats.clears)); sv('KÄMPFE GEWONNEN', s.stats.wins + ' / ' + s.stats.battles); sv('STERNE', String(s.stats.stars)); sv('TURM-REKORD', 'ETAGE ' + s.stats.towerBest); sv('RAID-STUFE', String(s.raidLv + 1)); sv('MONSTER ENTDECKT', s.seen.length + ' / ' + Object.keys(SPECIES).length);
  box.append(st); g.setScreen(box);
}

import { synergies, BOND_AT, BOND_NAMES, BOND_DESC, bondLevel } from '../data/synergy';
import type { Game } from '../game';
import { h, onTap, spriteCanvas, animSprite, icons, amuletIcon, pixIcon, typePill } from './dom';
import { sfx } from '../audio';
import { SPECIES, SPECIES_IDS, NATURES, NATURE_IDS, baseForm, learnset, MAX_MOVES } from '../data/species';
import { MOVES, moveKindInfo } from '../data/moves';
import { TYPE_NAMES } from '../data/types';
import { AMULETS } from '../data/items';
import { ACHIEVEMENTS, claimable } from '../data/achievements';
import { computeStats, STATS, STAT_NAMES, BONUS_MAX, BONUS_STEP } from '../battle/mon';
import { teamCap, SLOT_LEVELS, Owned, xpNeed } from '../state';
import { chooseAmulet } from './gear';
import { movesSection, showMove } from './moves';

const KIND_NAMES: Record<string, string> = { projectile: 'FERNKAMPF', melee: 'NAHKAMPF', dash: 'STURMANGRIFF', aoe: 'FLÄCHENSCHLAG', cone: 'STRAHL', self: 'SELBST', status: 'SCHWÄCHUNG' };
const REF: Record<string, number> = { hp: 220, atk: 75, def: 70, spa: 80, spd: 72, spe: 68 };

/** Entwicklungslinie als Bildleiste (unbekannte Stufen als Silhouette). */
function evoLine(g: Game, id: string): HTMLElement {
  const line: string[] = [baseForm(id)];
  while (SPECIES[line[line.length - 1]].evolvesTo) line.push(SPECIES[line[line.length - 1]].evolvesTo!.id);
  const row = h('div', 'evoline');
  line.forEach((sp, i) => {
    if (i) row.append(h('span', 'ar', '▶'));
    const known = g.save.seen.includes(sp);
    const st = h('div', 'st' + (sp === id ? ' cur' : '') + (known ? '' : ' unk'));
    const lv = i > 0 ? SPECIES[line[i - 1]].evolvesTo!.level : 1;
    st.append(spriteCanvas(sp, 1), h('span', '', known ? SPECIES[sp].name.toUpperCase() : '???'), h('span', '', i ? 'AB LV ' + lv : 'START'));
    row.append(st);
  });
  return row;
}

/** Zeigt die Team-Synergien (oder einen Hinweis, wie man sie bekommt). */
export function synergyBox(types: import('../data/types').TypeId[][], title = 'SYNERGIEN'): HTMLElement {
  const box = h('div', 'synbox'); const list = synergies(types);
  box.append(h('div', 'sec', title));
  if (!list.length) box.append(h('div', 'natdesc', 'KEINE. ZWEI MONSTER GLEICHEN TYPS ODER FEUER+WASSER+PFLANZE ZUSAMMEN GEBEN BONI.'));
  for (const s of list) { const r = h('div', 'syn'); r.append(h('b', '', '✦ ' + s.name), h('span', '', s.desc)); box.append(r); }
  return box;
}

function statBars(o: { sp: string; level: number; bonus?: Owned['bonus']; item?: string | null }): HTMLElement {
  const st = computeStats(o.sp, o.level, o.bonus, o.item);
  const box = h('div', 'bars');
  const vals: Record<string, number> = { hp: st.maxHp, atk: st.atk, def: st.def, spa: st.spa, spd: st.spd, spe: st.spe };
  for (const k of STATS) {
    const r = h('div', 'brow'); const bar = h('div', 'bar'); const i = h('i', 'stat'); i.style.width = Math.min(100, (vals[k] / REF[k]) * 100) + '%'; bar.append(i);
    r.append(h('span', '', STAT_NAMES[k].toUpperCase()), bar, h('b', '', String(vals[k]))); box.append(r);
  }
  return box;
}

/** Detailseite eines Monsters im Besitz. */
export function showMonster(g: Game, id: number, back: () => void) {
  const o = g.save.mons.find((m) => m.id === id); if (!o) return back();
  const sp = SPECIES[o.sp], inTeam = g.save.team.includes(o.id), runLocked = !!g.save.run;
  const box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); back(); });
  box.append(bk, h('h2', '', sp.name.toUpperCase()));
  const hero = h('div', 'hero'); const stage = h('div', 'stage'); stage.append(animSprite(o.sp, 3, (t) => g.tickers.push(t))); hero.append(stage);
  const tags = h('div', 'tags'); sp.types.forEach((t) => tags.append(typePill(t, TYPE_NAMES[t].toUpperCase()))); tags.append(h('span', 'tag', 'LV ' + o.level));
  const xb = h('div', 'bar'); xb.style.width = '200px'; const xi = h('i', 'stat'); xi.style.width = Math.round((o.xp / xpNeed(o.level)) * 100) + '%'; xb.append(xi);
  hero.append(tags, xb, h('div', 'subt', 'ERFAHRUNG ' + o.xp + ' / ' + xpNeed(o.level)), h('div', 'subt', sp.blurb.toUpperCase()));
  box.append(hero, statBars(o));
  // Wesen
  box.append(h('div', 'sec', 'WESEN'));
  const ng = h('div', 'natgrid'); const natTxt = (n: string) => NATURES[n].blurb.toUpperCase() + '  ◆ ' + NATURES[n].trait.name.toUpperCase() + ': ' + NATURES[n].trait.desc;
  const nd = h('div', 'natdesc', natTxt(o.nature));
  for (const n of NATURE_IDS) { const b = h('button', n === o.nature ? 'on' : '', NATURES[n].name.toUpperCase()); onTap(b, () => { o.nature = n; sfx.ui(); g.persist(); ng.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); nd.textContent = natTxt(n); }); ng.append(b); }
  box.append(ng, nd);
  // Bindung
  const bl = bondLevel(o.bond), nextAt = BOND_AT[bl + 1];
  box.append(h('div', 'sec', 'BINDUNG'));
  const bb = h('div', 'bar'); bb.style.width = '200px'; const bi = h('i', 'stat'); bi.style.width = (nextAt ? Math.round(((o.bond - BOND_AT[bl]) / (nextAt - BOND_AT[bl])) * 100) : 100) + '%'; bb.append(bi);
  box.append(h('div', 'natdesc bondn', '♥ ' + BOND_NAMES[bl] + ' · ' + o.bond + ' GEMEINSAME SIEGE'), bb, h('div', 'natdesc', BOND_DESC[bl] + (nextAt ? '  NÄCHSTE STUFE BEI ' + nextAt + ' SIEGEN.' : '')));
  // Attacken: Rangfolge, Aufwerten, Spezialisierungen, Schriftrollen
  const keep = (fn: () => void) => { const y = (g.el.screens.querySelector('.wrap') as HTMLElement)?.scrollTop ?? 0; fn(); const w = g.el.screens.querySelector('.wrap') as HTMLElement; if (w) w.scrollTop = y; };
  box.append(...movesSection(g, o, () => keep(() => showMonster(g, id, back)), (mid) => showMove(g, o, mid, () => showMonster(g, id, back))));
  // Amulett
  box.append(h('div', 'sec', 'AMULETT'));
  const am = h('button', 'amrow');
  const a = o.item ? AMULETS[o.item] : null;
  const tx = h('div', 'tx'); tx.append(document.createTextNode(a ? a.name.toUpperCase() : 'KEIN AMULETT'), h('small', '', a ? a.desc.toUpperCase() : 'TIPPEN ZUM AUSRÜSTEN'));
  am.append(a ? amuletIcon(a.color, 3) : pixIcon('more', 2), tx); onTap(am, () => { sfx.ui(); chooseAmulet(g, o, () => showMonster(g, id, back)); });
  box.append(am);
  // Training
  box.append(h('div', 'sec', 'TRAINING (+' + Math.round(BONUS_STEP * 100) + '% JE STUFE)'));
  { const base = computeStats(o.sp, o.level, undefined, null), now = computeStats(o.sp, o.level, o.bonus, null);
    for (const k of STATS) { const key = k === 'hp' ? 'maxHp' : k; const r = h('div', 'statrow'); const pips = h('div', 'pips'); for (let i = 0; i < BONUS_MAX; i++) pips.append(h('i', i < o.bonus[k] ? 'on' : ''));
      const d = (now as Record<string, number>)[key] - (base as Record<string, number>)[key];
      r.append(h('span', '', STAT_NAMES[k].toUpperCase()), pips, h('em', 'dlt', d > 0 ? '+' + d : '–')); box.append(r); } }
  box.append(h('div', 'natdesc', 'STUFEN GIBT ES AN RASTPLÄTZEN IN DER LIGA.'));
  box.append(h('div', 'sec', 'ENTWICKLUNG'), evoLine(g, o.sp));
  // Aktionen
  const tg = h('button', 'btn big ' + (inTeam ? 'danger' : ''), inTeam ? 'AUS DEM TEAM NEHMEN' : 'INS TEAM (' + g.save.team.length + '/' + teamCap(g.save) + ')');
  if (runLocked) tg.classList.add('off');
  onTap(tg, () => {
    if (runLocked) return g.toast('IM LIGA-LAUF GESPERRT');
    if (inTeam) { if (g.save.team.length <= 1) return g.toast('MIND. 1 MONSTER!'); g.save.team = g.save.team.filter((i) => i !== o.id); }
    else { if (g.save.team.length >= teamCap(g.save)) return g.toast(g.save.team.length >= 5 ? 'TEAM IST VOLL' : 'NÄCHSTER PLATZ AB SPIELERLEVEL ' + SLOT_LEVELS[g.save.team.length]); g.save.team.push(o.id); }
    sfx.ui(); g.persist(); showMonster(g, id, back);
  });
  box.append(tg);
  g.setScreen(box);
}

/** Sammlung (Monsterdex). */
export function showDex(g: Game) {
  const box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); g.go('more'); });
  const owned = new Set(g.save.mons.map((m) => m.sp));
  box.append(bk, h('h2', '', 'SAMMLUNG'), h('div', 'subt', g.save.seen.length + ' / ' + SPECIES_IDS.length + ' ENTDECKT · ' + owned.size + ' IM BESITZ'));
  const grid = h('div', 'dexgrid');
  SPECIES_IDS.forEach((id, i) => {
    const known = g.save.seen.includes(id);
    const c = h('button', 'dexc' + (known ? '' : ' unk') + (owned.has(id) ? ' own' : ''));
    c.append(h('span', 'dn', '#' + String(i + 1).padStart(2, '0')), spriteCanvas(id, 1), h('span', '', known ? SPECIES[id].name.toUpperCase() : '???'));
    onTap(c, () => { if (!known) return g.toast('NOCH NICHT ENTDECKT'); sfx.ui(); showInfo(g, id); });
    grid.append(c);
  });
  box.append(grid, h('div', 'natdesc', 'MONSTER ENTDECKST DU, INDEM DU SIE BESITZT ODER IN DER LIGA GEGEN SIE KÄMPFST.'));
  g.setScreen(box);
}

function showInfo(g: Game, id: string) {
  const sp = SPECIES[id]; const box = h('div', 'page');
  const bk = h('button', 'back', '◀ SAMMLUNG'); onTap(bk, () => { sfx.back(); showDex(g); });
  box.append(bk, h('h2', '', sp.name.toUpperCase()));
  const hero = h('div', 'hero'); const stage = h('div', 'stage'); stage.append(animSprite(id, 3, (t) => g.tickers.push(t))); hero.append(stage);
  const tags = h('div', 'tags'); sp.types.forEach((t) => tags.append(typePill(t, TYPE_NAMES[t].toUpperCase()))); hero.append(tags, h('div', 'subt', sp.blurb.toUpperCase()));
  box.append(hero, statBars({ sp: id, level: 20 }), h('div', 'natdesc', 'WERTE BEI LEVEL 20.'), h('div', 'sec', 'ATTACKEN'));
  for (const [mid, l] of learnset(id)) { const m = MOVES[mid]; const r = h('div', 'mrow'); const mn = h('div', 'mn'); mn.append(document.createTextNode(m.name.toUpperCase()), h('small', '', (moveKindInfo(m)?.[0] ?? KIND_NAMES[m.kind]) + (l > 1 ? ' · AB LEVEL ' + l : ' · VON ANFANG AN'))); r.append(mn, typePill(m.type, TYPE_NAMES[m.type].toUpperCase())); box.append(r); }
  box.append(h('div', 'sec', 'ENTWICKLUNG'), evoLine(g, id));
  g.setScreen(box);
}

/** Erfolge mit Belohnungen. */
export function showAchievements(g: Game) {
  const box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); g.go('more'); });
  box.append(bk, h('h2', '', 'ERFOLGE'), h('div', 'subt', g.save.ach.length + ' / ' + ACHIEVEMENTS.length + ' ABGEHOLT'));
  const order = [...ACHIEVEMENTS].sort((a, b) => Number(g.save.ach.includes(a.id)) - Number(g.save.ach.includes(b.id)));
  for (const a of order) {
    const v = Math.min(a.goal, a.value(g.save)), done = g.save.ach.includes(a.id), ready = !done && v >= a.goal;
    const r = h('div', 'ach' + (done ? ' done' : '')); const tx = h('div', 'tx');
    const bar = h('div', 'bar'); const i = h('i'); i.style.width = (v / a.goal) * 100 + '%'; bar.append(i);
    tx.append(document.createTextNode(a.name.toUpperCase()), h('small', '', a.desc.toUpperCase() + ' (' + v + '/' + a.goal + ')'), bar);
    const b = h('button', 'chip price ' + (ready ? 'gold' : 'off'), done ? '✓' : String(a.reward)); if (!done) b.prepend(icons.coin(1));
    onTap(b, () => { if (!ready) return; g.save.ach.push(a.id); g.save.coins += a.reward; g.persist(); sfx.handle({ type: 'heal' }, false); g.toast('+' + a.reward + ' MÜNZEN'); showAchievements(g); });
    r.append(tx, b); box.append(r);
  }
  g.setScreen(box);
}

/** Anleitung in vier Seiten. */
export function showGuide(g: Game, after: () => void) {
  const pages: { t: string; p: string; icons: () => HTMLElement[] }[] = [
    { t: 'DU BIST DER TRAINER', p: 'DEINE MONSTER KÄMPFEN SELBST: SIE LAUFEN, WEICHEN AUS UND GREIFEN AN. DU GIBST DIE BEFEHLE UND WECHSELST DIE MONSTER.', icons: () => [spriteCanvas('glimmdra', 2, 2), spriteCanvas('tropfling', 2, 6)] },
    { t: 'FOKUS-BEFEHLE', p: 'DIE FOKUS-LEISTE LÄDT SICH AUF. SCHILD KURZ VOR EINEM STARKEN TREFFER = PARADE UND KONTER. TIPPE EINE KARTE, UM ZU WECHSELN.', icons: () => [pixIcon('battle', 4), pixIcon('team', 4), pixIcon('liga', 4)] },
    { t: 'DIE LIGA', p: 'WÄHLE DEINEN WEG DURCH 9 ETAPPEN: KÄMPFE, RAST, HÄNDLER UND EREIGNISSE. DEINE KP BLEIBEN ERHALTEN. AM ENDE WARTET EIN BOSS.', icons: () => [pixIcon('rest', 4), pixIcon('shop', 4), pixIcon('elite', 4), pixIcon('boss', 4)] },
    { t: 'TYPEN & TAKTIK', p: 'ES GIBT 16 TYPEN. DIE ERSTEN DREI: FEUER SCHLÄGT PFLANZE, PFLANZE SCHLÄGT WASSER, WASSER SCHLÄGT FEUER – DIE ANDEREN ZEIGT DIR DAS SCOUTING. MANCHE ATTACKEN SCHWÄCHEN DEN GEGNER ODER STÄRKEN DICH, BIS ZUM AUSWECHSELN. IM TEAM-MENÜ LEGST DU RANGFOLGE UND STUFEN DER ATTACKEN FEST. NEUE MONSTER GIBT ES NUR AUS KISTEN.', icons: () => [spriteCanvas('knoespling', 2, 2), spriteCanvas('glimmdra', 2, 2), spriteCanvas('tropfling', 2, 2)] },
    { t: 'KAMPF STEUERN', p: 'TIPPE AUFS SPIELFELD: DEIN MONSTER LÄUFT DORTHIN. WISCHE SCHNELL: HECHTROLLE IN DIESE RICHTUNG. SCHILD KURZ VOR EINEM STARKEN TREFFER GIBT PARADE UND KONTER. WECHSELN UND ITEMS BRAUCHEN KEINEN FOKUS-VORRAT, BEFEHLE SCHON.', icons: () => [pixIcon('battle', 4), spriteCanvas('tropfling', 2, 2), pixIcon('focus', 4)] },
    { t: 'KRISTALLE & UNWETTER', p: 'IN DER ARENA ERSCHEINEN KRISTALLE: HEILEN, KRAFT, FOKUS ODER TEMPO. ROTE KREISE WARNEN VOR UNWETTER – LAUF RECHTZEITIG HERAUS. BEIDE SEITEN JAGEN DIE KRISTALLE!', icons: () => [pixIcon('elite', 4), pixIcon('event', 4), pixIcon('focus', 4)] },
    { t: 'MONSTER & KISTEN', p: 'DU STARTEST MIT EINEM DER DREI STARTER. NEUE MONSTER GIBT ES NUR AUS KISTEN – SELTEN. SCHLÜSSEL BEKOMMST DU AUS RAIDS, BOSSEN, TAGESAUFGABEN UND EXPEDITIONEN.', icons: () => [pixIcon('chest', 4), pixIcon('key', 4), pixIcon('raid', 4)] },
    { t: 'JEDEN TAG WAS NEUES', p: 'TAGESAUFGABEN UND EIN WOCHENZIEL BRINGEN MÜNZEN UND SCHLÜSSEL. IM TRAININGSLAGER UND AUF EXPEDITIONEN ARBEITEN DEINE MONSTER AUCH, WENN DU NICHT SPIELST. ALLES FINDEST DU IM START-TAB.', icons: () => [pixIcon('rest', 4), pixIcon('home', 4), pixIcon('scroll', 4)] },
  ];
  let i = 0;
  const box = h('div', 'modal');
  const render = () => {
    box.innerHTML = ''; const pg = pages[i];
    const gd = h('div', 'guide'); const gi = h('div', 'gi'); pg.icons().forEach((e) => gi.append(e));
    gd.append(gi, h('h2', '', pg.t), h('p', '', pg.p));
    const dots = h('div', 'dots'); pages.forEach((_, k) => dots.append(h('i', k === i ? 'on' : '')));
    const next = h('button', 'btn big', i === pages.length - 1 ? 'VERSTANDEN!' : 'WEITER');
    onTap(next, () => { sfx.ui(); if (i === pages.length - 1) { g.save.tut.guide = true; g.persist(); after(); } else { i++; render(); } });
    box.append(gd, dots, next);
    if (i > 0) { const pv = h('button', 'btn ghost', 'ZURÜCK'); onTap(pv, () => { sfx.back(); i--; render(); }); box.append(pv); }
  };
  render(); g.setScreen(box);
}

/** Optionen. */
export function showOptions(g: Game) {
  const box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); g.go('more'); });
  box.append(bk, h('h2', '', 'OPTIONEN'));
  const opt = (name: string, sub: string, get: () => boolean, set: (v: boolean) => void) => {
    const r = h('div', 'opt'); const t = h('div'); t.append(document.createTextNode(name), h('small', '', sub));
    const b = h('button', 'tg' + (get() ? ' on' : ''), get() ? 'AN' : 'AUS');
    onTap(b, () => { set(!get()); b.classList.toggle('on', get()); b.textContent = get() ? 'AN' : 'AUS'; g.persist(); sfx.ui(); });
    r.append(t, b); box.append(r);
  };
  opt('SOUND', 'EFFEKTE UND SIGNALE', () => g.save.sound, (v) => g.setSound(v));
  opt('MUSIK', 'HINTERGRUNDMUSIK IM KAMPF', () => g.save.opt.music, (v) => { g.save.opt.music = v; });
  opt('VIBRATION', 'BEI TREFFERN UND TIPPEN (NUR ANDROID)', () => g.save.opt.vibe, (v) => { g.save.opt.vibe = v; g.applyOpts(); });
  opt('KAMPF-TIPPS', 'HINWEISE WÄHREND DES KAMPFES', () => g.save.opt.hints, (v) => { g.save.opt.hints = v; });
  const gd = h('button', 'btn ghost', 'ANLEITUNG ANSEHEN'); onTap(gd, () => { sfx.ui(); showGuide(g, () => showOptions(g)); });
  const reset = h('button', 'btn ghost', 'SPIELSTÄNDE VERWALTEN'); onTap(reset, () => { sfx.ui(); g.showSlots(); });
  box.append(gd, reset, h('div', 'natdesc', 'ARENA MANAGER · PROTOTYP v0.9 · ALLE MONSTER UND ATTACKEN SIND EIGENE ERFINDUNGEN.'));
  g.setScreen(box);
}

/** Tab „Mehr". */
export function moreContent(g: Game): HTMLElement[] {
  const out: HTMLElement[] = [h('h2', '', 'MEHR')];
  const row = (icon: HTMLElement, name: string, sub: string, fn: () => void, badge = 0) => {
    const r = h('button', 'amrow'); const tx = h('div', 'tx'); tx.append(document.createTextNode(name), h('small', '', sub));
    r.append(icon, tx); if (badge) r.append(h('span', 'pip', String(badge))); onTap(r, () => { sfx.ui(); fn(); }); out.push(r);
  };
  row(pixIcon('liga', 3), 'ERFOLGE', g.save.ach.length + ' / ' + ACHIEVEMENTS.length + ' ABGEHOLT', () => showAchievements(g), claimable(g.save).length);
  row(pixIcon('team', 3), 'SAMMLUNG', g.save.seen.length + ' / ' + SPECIES_IDS.length + ' MONSTER ENTDECKT', () => showDex(g));
  row(pixIcon('event', 3), 'ANLEITUNG', 'SO FUNKTIONIERT DAS SPIEL', () => showGuide(g, () => g.go('more')));
  row(pixIcon('battle', 3), 'TUTORIAL WIEDERHOLEN', 'GEFÜHRTER ÜBUNGSKAMPF: SPEZIAL, SCHILD, LAUFEN, WISCHEN, KRISTALLE, UNWETTER', () => g.startTutorial(() => g.go('more')));
  row(pixIcon('battle', 3), 'TUTORIAL-KAMPF', 'DER GEFÜHRTE ERSTE KAMPF ZUM WIEDERHOLEN', () => g.startTutorial(() => g.go('more')));
  row(pixIcon('more', 3), 'OPTIONEN', 'SOUND, VIBRATION, SPIELSTAND', () => showOptions(g));
  const s = g.save.stats;
  const st = h('div', 'stats'); const sv = (k: string, v: string | number) => { const r = h('div', 'srow'); r.append(h('span', '', k), h('b', '', String(v))); st.append(r); };
  sv('SIEGE', s.wins); sv('KÄMPFE', s.battles); sv('LIGEN GEWONNEN', s.clears); sv('MONSTER ANGEWORBEN', s.recruits);
  out.push(h('div', 'sec', 'STATISTIK'), st);
  return out;
}

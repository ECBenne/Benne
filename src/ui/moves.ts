import type { Game } from '../game';
import { h, onTap, typePill, pixIcon } from './dom';
import { sfx } from '../audio';
import { MOVES, MoveDef } from '../data/moves';
import { TYPE_NAMES } from '../data/types';
import { learnset, MAX_MOVES } from '../data/species';
import { MAX_MOVE_LV, PERKS, PERK_LEVELS, RULES, MoveState, perkChoices, perkSlots, tunedMove, upCost, LV_BONUS } from '../data/mastery';
import { Owned, knownMoves } from '../state';

const KIND: Record<string, [string, string]> = {
  projectile: ['FERNKAMPF', 'FLIEGT AUF DEN GEGNER ZU. KANN AUSGEWICHEN WERDEN UND BLEIBT AN FELSEN HÄNGEN.'],
  melee: ['NAHKAMPF', 'SCHNELLER SCHLAG AUS DER NÄHE. TRIFFT SICHER, WENN DER GEGNER IN REICHWEITE IST.'],
  dash: ['STURMANGRIFF', 'DAS MONSTER STÜRMT IN EINER LINIE VOR. ÜBERBRÜCKT DISTANZ, PRALLT AN FELSEN AB.'],
  aoe: ['FLÄCHENSCHLAG', 'MARKIERT EINE ZONE UND SCHLÄGT NACH KURZER ZEIT EIN. TRIFFT AUCH HINTER FELSEN.'],
  cone: ['STRAHL', 'GEHALTENER STRAHL MIT MEHREREN TREFFERN. BRAUCHT FREIE SICHT.'],
  self: ['SELBST', 'WIRKT AUF DAS MONSTER SELBST. WIRD EINGESETZT, WENN ES SINNVOLL IST.'],
};
const st = (o: Owned, id: string): MoveState => (o.mv[id] ??= { lv: 1, perks: [] });

/** Kurzbeschreibung einer Attacke (für Listen und den Shop). */
export function moveSummary(m: MoveDef): string {
  const eff = m.kind === 'self' ? [m.heal ? 'HEILT ' + Math.round(m.heal * 100) + '%' : '', m.buff ? '+25% SCHADEN ' + Math.round(m.buff) + 'S' : '', m.shield ? 'SCHILD ' + Math.round(m.shield * 100) + '%' : ''].filter(Boolean).join(' · ') : 'STÄRKE ' + m.power;
  return KIND[m.kind][0] + ' · ' + eff + ' · ' + m.cooldown + 'S';
}
const pips = (lv: number) => { const p = h('span', 'lvp'); for (let i = 0; i < MAX_MOVE_LV; i++) p.append(h('i', i < lv ? 'on' : '')); return p; };

/** Attacken-Bereich der Monster-Seite: Rangfolge, gelernte und künftige Attacken, Punkte, Schriftrollen. */
export function movesSection(g: Game, o: Owned, refresh: () => void, openMove: (id: string) => void): HTMLElement[] {
  const out: HTMLElement[] = [h('div', 'sec', 'ATTACKEN ' + o.moves.length + '/' + MAX_MOVES + ' · RANGFOLGE')];
  const ap = h('div', 'aprow'); const apt = h('div'); apt.append(document.createTextNode('ATTACKENPUNKTE'), h('small', '', '1 PRO LEVEL · ZUM AUFWERTEN'));
  ap.append(apt, h('b', '', String(o.ap)));
  out.push(ap);
  if (g.save.inv.books > 0) { const bk = h('button', 'btn ghost', 'LEHRBUCH BENUTZEN (×' + g.save.inv.books + '): +1 PUNKT'); bk.style.maxWidth = 'none'; onTap(bk, () => { g.save.inv.books--; o.ap++; g.persist(); sfx.handle({ type: 'heal' }, false); refresh(); }); out.push(bk); }
  const row = (id: string, cls: string, sub: string) => {
    const base = MOVES[id], m = tunedMove(base, o.mv[id]), s = st(o, id);
    const r = h('button', 'mrow ' + cls); const mn = h('div', 'mn'); const title = h('div'); title.append(document.createTextNode(m.name.toUpperCase() + (m.special ? ' ★' : '')), pips(s.lv));
    mn.append(title, h('small', '', sub || moveSummary(m))); r.append(mn, typePill(m.type, TYPE_NAMES[m.type].toUpperCase()));
    onTap(r, () => { sfx.ui(); openMove(id); }); return r;
  };
  o.moves.forEach((id, i) => {
    const sr = h('div', 'slotrow'); const mv = h('div', 'mv');
    const up = h('button', 'mvb', '▲'), dn = h('button', 'mvb', '▼');
    onTap(up, () => { if (i > 0) { [o.moves[i - 1], o.moves[i]] = [o.moves[i], o.moves[i - 1]]; sfx.ui(); g.persist(); refresh(); } });
    onTap(dn, () => { if (i < o.moves.length - 1) { [o.moves[i + 1], o.moves[i]] = [o.moves[i], o.moves[i + 1]]; sfx.ui(); g.persist(); refresh(); } });
    mv.append(up, dn); sr.append(h('div', 'num', String(i + 1)), row(id, 'eq', ''), mv); out.push(sr);
  });
  out.push(h('div', 'natdesc', 'PLATZ 1 WIRD AM LIEBSTEN EINGESETZT, PLATZ 4 AM SELTENSTEN. TIPPE EINE ATTACKE ZUM AUFWERTEN.'));
  const known = knownMoves(o).filter((id) => !o.moves.includes(id));
  if (known.length) out.push(h('div', 'sec', 'GELERNT, NICHT AUSGERÜSTET'));
  for (const id of known) out.push(row(id, '', ''));
  const locked = learnset(o.sp).filter(([, l]) => l > o.level);
  if (locked.length) out.push(h('div', 'sec', 'LERNT SPÄTER'));
  for (const [id, l] of locked) { const r = h('div', 'mrow lock'); const mn = h('div', 'mn'); mn.append(document.createTextNode('???'), h('small', '', KIND[MOVES[id].kind][0] + ' · AB LEVEL ' + l)); r.append(mn, typePill(MOVES[id].type, TYPE_NAMES[MOVES[id].type].toUpperCase())); out.push(r); }
  // Schriftrollen
  const scrolls = [...new Set(g.save.inv.scrolls)].filter((id) => !knownMoves(o).includes(id));
  if (scrolls.length) out.push(h('div', 'sec', 'SCHRIFTROLLEN IM BESITZ'));
  for (const id of scrolls) {
    const r = h('button', 'amrow'); const tx = h('div', 'tx'); tx.append(document.createTextNode(MOVES[id].name.toUpperCase() + ' BEIBRINGEN'), h('small', '', moveSummary(MOVES[id])));
    r.append(pixIcon('scroll', 3), tx);
    onTap(r, () => { const i = g.save.inv.scrolls.indexOf(id); if (i < 0) return; g.save.inv.scrolls.splice(i, 1); o.extra.push(id); if (o.moves.length < MAX_MOVES) o.moves.push(id); g.save.stats.learned++; g.persist(); sfx.handle({ type: 'heal' }, false); g.toast(MOVES[id].name.toUpperCase() + ' GELERNT!'); refresh(); });
    out.push(r);
  }
  return out;
}

/** Detailseite einer Attacke: Werte, Aufwerten, Spezialisierung, Einsatzregel, Ausrüsten. */
export function showMove(g: Game, o: Owned, id: string, back: () => void) {
  const base = MOVES[id], s = st(o, id), m = tunedMove(base, s), next = s.lv < MAX_MOVE_LV ? tunedMove(base, { ...s, lv: s.lv + 1 }) : null;
  const eq = o.moves.includes(id), re = () => showMove(g, o, id, back);
  const box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); back(); });
  const title = h('h2', '', m.name.toUpperCase());
  const tags = h('div', 'tags'); tags.append(typePill(m.type, TYPE_NAMES[m.type].toUpperCase()), h('span', 'tag', KIND[m.kind][0])); if (m.special) tags.append(h('span', 'tag', '★ SPEZIAL'));
  box.append(bk, title, tags, h('div', 'subt', KIND[m.kind][1]));
  const kv = h('div', 'kv'); const cell = (k: string, v: string, nv?: string) => { const c = h('div', '', k); c.append(h('b', '', v + (nv && nv !== v ? ' ▶ ' + nv : ''))); kv.append(c); };
  if (m.kind === 'self') {
    if (m.heal) cell('HEILUNG', Math.round(m.heal * 100) + '%', next ? Math.round(next.heal! * 100) + '%' : undefined);
    if (m.buff) cell('STÄRKUNG', m.buff.toFixed(1) + 'S', next?.buff ? next.buff.toFixed(1) + 'S' : undefined);
    if (m.shield) cell('SCHILD', Math.round(m.shield * 100) + '%', next?.shield ? Math.round(next.shield * 100) + '%' : undefined);
  } else cell('STÄRKE', String(m.power), next ? String(next.power) : undefined);
  cell('ABKLINGZEIT', m.cooldown + 'S'); if (m.kind !== 'self') cell('REICHWEITE', String(Math.round(m.range)));
  cell('AUFLADEZEIT', m.windup.toFixed(2) + 'S');
  if (m.status) cell(m.status.id === 'burn' ? 'VERBRENNUNG' : 'PARALYSE', Math.round(m.status.chance * 100) + '%');
  if (m.drain) cell('AUSSAUGEN', Math.round(m.drain * 100) + '%');
  box.append(kv);
  // Aufwerten
  const lvRow = h('div', 'sec'); lvRow.append(document.createTextNode('STUFE ' + s.lv + '/' + MAX_MOVE_LV), pips(s.lv)); box.append(lvRow);
  if (next) {
    const cost = upCost(s.lv), ok = o.ap >= cost;
    const up = h('button', 'btn' + (ok ? '' : ' off'), 'AUFWERTEN: ' + cost + ' PUNKT' + (cost > 1 ? 'E' : '') + ' (DU HAST ' + o.ap + ')'); up.style.maxWidth = 'none';
    onTap(up, () => { if (!ok) return g.toast('NICHT GENUG ATTACKENPUNKTE'); o.ap -= cost; s.lv++; g.persist(); sfx.handle({ type: 'heal' }, false); re(); });
    box.append(up, h('div', 'natdesc', 'JEDE STUFE: +' + Math.round(LV_BONUS * 100) + '% WIRKUNG. AUF STUFE 3 UND 5 WÄHLST DU EINE SPEZIALISIERUNG.'));
  } else box.append(h('div', 'natdesc', 'HÖCHSTE STUFE ERREICHT.'));
  // Spezialisierungen
  PERK_LEVELS.forEach((need, i) => {
    const [a, b] = perkChoices(base.kind, i as 0 | 1), chosen = s.perks[i], open = perkSlots(s.lv) > i;
    box.append(h('div', 'sec', 'SPEZIALISIERUNG ' + (i + 1) + (open ? '' : ' · AB STUFE ' + need)));
    const pr = h('div', 'perk');
    for (const p of [a, b]) {
      const bt = h('button', (chosen === p ? 'on' : open && !chosen ? 'pick' : ''), PERKS[p].name.toUpperCase()); bt.append(h('small', '', PERKS[p].desc.toUpperCase()));
      if (!open) bt.style.opacity = '.4';
      onTap(bt, () => { if (!open) return g.toast('ERST AUF STUFE ' + need); if (i > 0 && !s.perks[0]) return g.toast('ERST SPEZIALISIERUNG 1 WÄHLEN'); s.perks[i] = p; g.persist(); sfx.ui(); re(); });
      pr.append(bt);
    }
    box.append(pr);
  });
  box.append(h('div', 'natdesc', 'SPEZIALISIERUNGEN KANNST DU JEDERZEIT KOSTENLOS WECHSELN.'));
  // Einsatzregel
  box.append(h('div', 'sec', 'EINSATZ IM KAMPF'));
  const seg = h('div', 'seg2');
  for (const k of Object.keys(RULES) as (keyof typeof RULES)[]) { const bt = h('button', (s.rule ?? 'auto') === k ? 'on' : '', RULES[k].name.toUpperCase()); onTap(bt, () => { s.rule = k; g.persist(); sfx.ui(); re(); }); seg.append(bt); }
  box.append(seg, h('div', 'natdesc', 'OFT: DAS MONSTER GREIFT BEVORZUGT ZU DIESER ATTACKE. SELTEN: NUR, WENN NICHTS ANDERES PASST.'));
  // Ausrüsten
  const tg = h('button', 'btn big ' + (eq ? 'danger' : ''), eq ? 'ABLEGEN' : 'AUSRÜSTEN (' + o.moves.length + '/' + MAX_MOVES + ')');
  onTap(tg, () => {
    if (eq) { if (o.moves.length <= 1) return g.toast('MIND. 1 ATTACKE'); o.moves = o.moves.filter((x) => x !== id); }
    else { if (o.moves.length >= MAX_MOVES) return g.toast('ERST EINE ATTACKE ABLEGEN'); o.moves.push(id); }
    sfx.ui(); g.persist(); re();
  });
  box.append(tg);
  g.setScreen(box);
}

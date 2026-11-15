import type { Game } from '../game';
import { h, onTap, spriteCanvas, pixIcon } from './dom';
import { sfx } from '../audio';
import { SPECIES } from '../data/species';
import { AMULETS } from '../data/items';
import { MOVES } from '../data/moves';
import { now, rankOf, SLOT_LEVELS } from '../state';
import * as Lv from '../systems/live';

const fmtT = (ms: number) => { const m = Math.ceil(ms / 60000); return m >= 60 ? Math.floor(m / 60) + ' STD ' + (m % 60 ? (m % 60) + ' MIN' : '') : m + ' MIN'; };

/** Zähler, die sich selbst aktualisieren, solange das Element im Dokument steht. */
function live(el: HTMLElement, fn: () => void) {
  fn(); const id = window.setInterval(() => { if (!document.body.contains(el)) return window.clearInterval(id); fn(); }, 1000);
}

/** Karten für den Start-Tab: Tagesaufgaben, Offline-Bereich. */
export function homeCards(g: Game): HTMLElement[] {
  const s = g.save; Lv.ensureQuests(s);
  const out: HTMLElement[] = [];
  // ── Erste Schritte (nach dem Tutorial, bis alles erledigt ist) ──
  const fresh = Lv.checkFirsts(s); if (fresh.length) { g.persist(); g.toast('SCHRITT GESCHAFFT: +' + Lv.FIRST_REWARD + ' MÜNZEN'); }
  if (Lv.firstsOpen(s)) {
    const fc = h('div', 'homecard questcard'); const fh = h('div', 'qhead'); fh.append(h('b', '', 'ERSTE SCHRITTE'), h('span', '', Lv.firstsDoneCount(s) + ' / ' + Lv.FIRSTS.length));
    fc.append(fh);
    for (const f of Lv.FIRSTS) { const done = s.tut.firsts.includes(f.id); const r = h('div', 'qrow' + (done ? ' done' : '')); const tx = h('div', 'qtx'); tx.append(h('span', '', f.text), h('small', '', '+' + Lv.FIRST_REWARD + ' MÜNZEN')); r.append(tx); if (done) r.append(h('span', 'qok', '✔')); fc.append(r); }
    fc.append(h('div', 'natdesc', 'ALLE FÜNF: +' + Lv.FIRST_ALL.coins + ' MÜNZEN UND 1 KISTENSCHLÜSSEL'));
    out.push(fc);
  }
  // ── Tagesaufgaben ──
  const qc = h('div', 'homecard questcard');
  const head = h('div', 'qhead'); head.append(h('b', '', 'TAGESAUFGABEN'), h('span', '', Lv.questsDone(s) + ' / 3'));
  qc.append(head);
  for (const q of s.quests.list) {
    const r = h('div', 'qrow' + (q.claimed ? ' done' : ''));
    const tx = h('div', 'qtx'); tx.append(h('span', '', Lv.questText(q)));
    const bar = h('div', 'bar'); const f = h('i', 'stat'); f.style.width = Math.round((q.prog / q.goal) * 100) + '%'; bar.append(f);
    const rw = Lv.questReward(q);
    tx.append(bar, h('small', '', (q.prog >= 1e4 ? '' : q.prog + ' / ' + q.goal) + ' · BELOHNUNG ' + rw.coins + ' MÜNZEN' + (rw.potion ? ' + TRANK' : '') + ' + ' + rw.xp + ' EP'));
    r.append(tx);
    if (q.claimed) r.append(h('span', 'qok', '✔'));
    else if (q.prog >= q.goal) { const b = h('button', 'chip gold', 'ABHOLEN'); onTap(b, () => { if (Lv.claimQuest(s, q.id)) { sfx.handle({ type: 'heal' }, false); g.persist(); g.toast('+' + rw.coins + ' MÜNZEN'); g.showHub(); } }); r.append(b); }
    qc.append(r);
  }
  const bonus = h('div', 'qrow bonus' + (s.quests.bonus ? ' done' : ''));
  const bt = h('div', 'qtx'); bt.append(h('span', '', 'ALLE 3 ERLEDIGT: TAGES-BONUS'), h('small', '', Lv.BONUS_REWARD.coins + ' MÜNZEN + 1 KISTENSCHLÜSSEL + ' + Lv.BONUS_REWARD.xp + ' EP')); bonus.append(bt);
  if (s.quests.bonus) bonus.append(h('span', 'qok', '✔'));
  else if (Lv.bonusReady(s)) { const b = h('button', 'chip gold', 'ABHOLEN'); onTap(b, () => { if (Lv.claimBonus(s)) { sfx.handle({ type: 'heal' }, false); g.persist(); g.toast('+1 KISTENSCHLÜSSEL'); g.showHub(); } }); bonus.append(b); }
  qc.append(bonus);
  const wk = h('div', 'qrow week' + (s.quests.wkClaimed ? ' done' : ''));
  const wt = h('div', 'qtx'); wt.append(h('span', '', 'WOCHENZIEL: GEWINNE ' + Lv.WEEK_GOAL + ' KÄMPFE'));
  const wb = h('div', 'bar'); const wf = h('i', 'stat'); wf.style.width = Math.round((Math.min(Lv.WEEK_GOAL, s.quests.wkWins) / Lv.WEEK_GOAL) * 100) + '%'; wb.append(wf);
  wt.append(wb, h('small', '', Math.min(Lv.WEEK_GOAL, s.quests.wkWins) + ' / ' + Lv.WEEK_GOAL + ' · ' + Lv.WEEK_REWARD.coins + ' MÜNZEN + ' + Lv.WEEK_REWARD.keys + ' SCHLÜSSEL + BELEBER')); wk.append(wt);
  if (s.quests.wkClaimed) wk.append(h('span', 'qok', '✔'));
  else if (Lv.weekReady(s)) { const b = h('button', 'chip gold', 'ABHOLEN'); onTap(b, () => { if (Lv.claimWeek(s)) { sfx.handle({ type: 'heal' }, false); g.persist(); g.toast('WOCHENKISTE! +2 SCHLÜSSEL'); g.showHub(); } }); wk.append(b); }
  qc.append(wk);
  out.push(qc);

  // ── Offline-Bereich ──
  const oc = h('div', 'homecard offcard');
  oc.append(h('div', 'qhead', 'AUCH OFFLINE AKTIV'));
  const btn = (title: string, status: () => string, dot: () => boolean, fn: () => void) => {
    const b = h('button', 'offbtn'); const st = h('small'); b.append(h('b', '', title), st); if (dot()) b.append(h('i', 'dot'));
    live(st, () => { st.textContent = status(); }); onTap(b, () => { sfx.ui(); fn(); }); oc.append(b);
  };
  btn('GRATIS-BEUTEL', () => (Lv.sackReady(s) ? 'BEREIT – TIPPEN ZUM ABHOLEN' : 'NÄCHSTER IN ' + fmtT(Lv.sackLeft(s))), () => Lv.sackReady(s), () => {
    const r = Lv.sackClaim(s); if (!r) return g.toast('NOCH NICHT BEREIT');
    g.persist(); sfx.handle({ type: 'heal' }, false); g.toast('+' + r.coins + ' MÜNZEN' + (r.potion ? ' · +TRANK' : '') + (r.focus ? ' · +FOKUSTRANK' : '')); g.showHub();
  });
  btn('TRAININGSLAGER', () => { const n = s.camp.ids.length; return n ? n + '/' + Lv.campSlots(s) + ' BELEGT · ' + Lv.campHours(s).toFixed(1).replace('.', ',') + ' STD GESAMMELT' : 'KEINE MONSTER – SCHICKE SIE TRAINIEREN'; }, () => s.camp.ids.length > 0 && Lv.campHours(s) >= 1, () => showCamp(g));
  btn('EXPEDITIONEN', () => { const d = s.exped.filter(Lv.expedDone).length; return s.exped.length ? s.exped.length + '/' + Lv.expedSlots(s) + ' UNTERWEGS' + (d ? ' · ' + d + ' FERTIG' : '') : 'SCHICKE MONSTER AUF BEUTEZUG'; }, () => s.exped.some(Lv.expedDone), () => showExped(g));
  out.push(oc);
  return out;
}

// ───────────── Trainingslager ─────────────
export function showCamp(g: Game) {
  const s = g.save, box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); g.showHub(); });
  box.append(bk, h('h2', '', 'TRAININGSLAGER'), h('div', 'natdesc', 'DIE MONSTER TRAINIEREN AUCH, WENN DU NICHT SPIELST: ERFAHRUNG UND BINDUNG. NACH ' + Lv.CAMP_CAP_H + ' STUNDEN IST DAS LAGER VOLL – HOL DIR DIE BEUTE VORHER AB.'));
  const prev = Lv.campPreview(s);
  const total = h('div', 'subt'); live(total, () => { total.textContent = 'GESAMMELT: ' + Lv.campHours(s).toFixed(1).replace('.', ',') + ' / ' + Lv.CAMP_CAP_H + ' STD'; });
  box.append(total);
  for (const p of prev) {
    const row = h('div', 'amrow'); const tx = h('div', 'tx');
    const xpEl = h('small');
    live(xpEl, () => { const pp = Lv.campPreview(s).find((x) => x.o.id === p.o.id); xpEl.textContent = pp ? '+' + pp.xp + ' EP · +' + pp.bond + ' BINDUNG · ' + Lv.campXpPerHour(p.o) + ' EP/STD' : ''; });
    tx.append(h('div', '', SPECIES[p.o.sp].name.toUpperCase() + ' LV' + p.o.level), xpEl);
    const rm = h('button', 'chip red', 'RAUS'); onTap(rm, () => { Lv.campRemove(s, p.o.id); g.persist(); sfx.back(); showCamp(g); });
    row.append(spriteCanvas(p.o.sp, 1), tx, rm); box.append(row);
  }
  for (let i = prev.length; i < Lv.campSlots(s); i++) {
    const row = h('button', 'amrow'); row.append(pixIcon('more', 2), h('div', 'tx', 'FREIER PLATZ · MONSTER SCHICKEN'));
    onTap(row, () => { sfx.ui(); pickMon(g, 'TRAINIEREN', (o) => !s.camp.ids.includes(o.id) && !Lv.isBusy(s, o.id), (o) => { Lv.campAssign(s, o.id); g.persist(); showCamp(g); }, () => showCamp(g)); }); box.append(row);
  }
  const nxt = [5, 10, 16].find((l) => s.pl.lvl < l);
  if (nxt) box.append(h('div', 'natdesc', '🔒 WEITERER PLATZ AB SPIELERLEVEL ' + nxt));
  const take = h('button', 'btn big', 'ERFAHRUNG ABHOLEN'); if (!prev.length) take.classList.add('off');
  onTap(take, () => {
    if (!prev.length) return g.toast('KEINE MONSTER IM LAGER');
    const r = Lv.campCollect(s); g.persist(); sfx.handle({ type: 'heal' }, false);
    g.toast(r.map((x) => x.name.toUpperCase() + ' +' + x.xp + ' EP' + (x.levels ? ' ▲' : '')).join(' · ')); showCamp(g);
  });
  box.append(take); g.setScreen(box);
}

function pickMon(g: Game, title: string, ok: (o: { id: number; sp: string; level: number }) => boolean, done: (o: any) => void, back: () => void) {
  const s = g.save, box = h('div', 'page');
  box.append(h('h2', '', title), h('div', 'sub', 'WELCHES MONSTER?'));
  let n = 0;
  for (const o of s.mons) {
    if (!ok(o)) continue; n++;
    const b = h('button', 'amrow'); const tx = h('div', 'tx'); tx.append(h('div', '', SPECIES[o.sp].name.toUpperCase() + ' LV' + o.level), h('small', '', s.team.includes(o.id) ? 'IM TEAM' : 'KADER'));
    b.append(spriteCanvas(o.sp, 1), tx); onTap(b, () => { sfx.ui(); done(o); }); box.append(b);
  }
  if (!n) box.append(h('div', 'natdesc', 'KEIN MONSTER VERFÜGBAR.'));
  box.append(g.backBtn(back)); g.setScreen(box);
}

// ───────────── Expeditionen ─────────────
export function showExped(g: Game) {
  const s = g.save, box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); g.showHub(); });
  box.append(bk, h('h2', '', 'EXPEDITIONEN'), h('div', 'natdesc', 'SCHICKE MONSTER AUS DEM KADER AUF BEUTEZUG. SIE KOMMEN ZURÜCK, AUCH WENN DU DAS SPIEL ZWISCHENDURCH SCHLIESST. WÄHREND DER REISE STEHEN SIE NICHT IM TEAM.'));
  for (const e of s.exped) {
    const o = s.mons.find((m) => m.id === e.mon)!, row = h('div', 'amrow'); const tx = h('div', 'tx'); const st = h('small');
    tx.append(h('div', '', SPECIES[o.sp].name.toUpperCase() + ' · ' + Lv.EXPED_KINDS[e.kind].name), st);
    live(st, () => { st.textContent = Lv.expedDone(e) ? 'ZURÜCK! BEUTE WARTET.' : 'NOCH ' + fmtT(Lv.expedLeft(e)); });
    const b = h('button', 'chip gold', 'ABHOLEN');
    onTap(b, () => {
      const l = Lv.expedClaim(s, e.id); if (!l) return g.toast('NOCH UNTERWEGS');
      g.persist(); sfx.handle({ type: 'heal' }, false);
      const lines = ['+' + l.coins + ' MÜNZEN']; if (l.potions) lines.push('+1 TRANK'); if (l.keys) lines.push('🗝 +1 KISTENSCHLÜSSEL'); if (l.xp) lines.push('+' + l.xp + ' EP' + (l.levels ? ' · LEVELAUFSTIEG!' : '')); if (l.amulet) lines.push('AMULETT: ' + AMULETS[l.amulet].name.toUpperCase()); if (l.scroll) lines.push('SCHRIFTROLLE: ' + MOVES[l.scroll].name.toUpperCase());
      lootModal(g, l.name.toUpperCase() + ' IST ZURÜCK!', lines, () => showExped(g));
    });
    row.append(spriteCanvas(o.sp, 1), tx, b); box.append(row);
  }
  for (let i = s.exped.length; i < Lv.expedSlots(s); i++) {
    const row = h('button', 'amrow'); row.append(pixIcon('more', 2), h('div', 'tx', 'FREIER PLATZ · NEUE EXPEDITION'));
    onTap(row, () => { sfx.ui(); newExped(g); }); box.append(row);
  }
  const nxt = [6, 12].find((l) => s.pl.lvl < l); if (nxt) box.append(h('div', 'natdesc', '🔒 WEITERER PLATZ AB SPIELERLEVEL ' + nxt));
  g.setScreen(box);
}

function newExped(g: Game) {
  const s = g.save;
  pickMon(g, 'EXPEDITION', (o) => !s.team.includes(o.id) && !s.camp.ids.includes(o.id) && !Lv.isBusy(s, o.id), (o) => {
    let kind: 'treasure' | 'explore' | 'cave' = 'treasure', dur = 2;
    const render = () => {
      const box = h('div', 'page'); box.append(h('h2', '', SPECIES[o.sp].name.toUpperCase()), h('div', 'sub', 'WOHIN UND WIE LANGE?'));
      box.append(h('div', 'sec', 'ZIEL')); const k = h('div', 'seg2');
      for (const id of ['treasure', 'explore', 'cave'] as const) { const b = h('button', id === kind ? 'on' : '', Lv.EXPED_KINDS[id].name); onTap(b, () => { sfx.ui(); kind = id; render(); }); k.append(b); }
      box.append(k, h('div', 'tip', Lv.EXPED_KINDS[kind].blurb));
      box.append(h('div', 'sec', 'DAUER')); const d = h('div', 'seg2');
      for (const x of Lv.EXPED_DURS) { const b = h('button', x === dur ? 'on' : '', x < 1 ? '30 MIN' : x + ' STD'); onTap(b, () => { sfx.ui(); dur = x; render(); }); d.append(b); }
      box.append(d, h('div', 'natdesc', 'LÄNGERE REISEN BRINGEN DEUTLICH MEHR (UND BEI DER KRISTALLHÖHLE EINE HÖHERE SCHLÜSSELCHANCE).'));
      const go = h('button', 'btn big', 'LOSSCHICKEN'); onTap(go, () => { if (Lv.expedStart(s, o.id, kind, dur)) { g.persist(); sfx.handle({ type: 'heal' }, false); showExped(g); } else g.toast('GEHT NICHT'); });
      box.append(go, g.backBtn(() => showExped(g))); g.setScreen(box);
    };
    render();
  }, () => showExped(g));
}

function lootModal(g: Game, title: string, lines: string[], after: () => void) {
  const m = h('div', 'modal result win'); m.append(h('h2', '', title)); for (const l of lines) m.append(h('div', 'evo', l));
  const ok = h('button', 'btn big', 'WEITER'); onTap(ok, () => { sfx.ui(); after(); }); m.append(ok); g.setScreen(m);
}

// ───────────── Rückkehr-Bericht ─────────────
/** Beim Start: zeigt, was in der Zwischenzeit passiert ist, und lässt alles mit einem Tipp einsammeln. */
export function welcomeBack(g: Game): boolean {
  const s = g.save, o = Lv.offlineSummary(s);
  if (!o.any) return false;
  const m = h('div', 'modal result win'); m.append(h('h2', '', 'WILLKOMMEN ZURÜCK!'), h('div', 'sub', 'WÄHREND DU WEG WARST …'));
  if (o.camp) m.append(h('div', 'evo', '🏕 TRAININGSLAGER: ' + o.campHours.toFixed(1).replace('.', ',') + ' STD GESAMMELT'));
  if (o.expeditions) m.append(h('div', 'evo', '🧭 ' + o.expeditions + (o.expeditions > 1 ? ' EXPEDITIONEN SIND' : ' EXPEDITION IST') + ' ZURÜCK'));
  if (o.sack) m.append(h('div', 'evo', '🎁 DEIN GRATIS-BEUTEL IST BEREIT'));
  const all = h('button', 'btn big', 'ALLES ABHOLEN');
  onTap(all, () => {
    const lines: string[] = [];
    if (o.camp) { const r = Lv.campCollect(s); lines.push(...r.map((x) => x.name.toUpperCase() + ': +' + x.xp + ' EP' + (x.levels ? ' · LEVELAUFSTIEG!' : '') + (x.bond ? ' · +' + x.bond + ' BINDUNG' : ''))); }
    for (const e of s.exped.filter(Lv.expedDone)) { const l = Lv.expedClaim(s, e.id); if (l) lines.push(l.name.toUpperCase() + ': +' + l.coins + ' MÜNZEN' + (l.keys ? ' · 🗝 +1' : '') + (l.xp ? ' · +' + l.xp + ' EP' : '') + (l.amulet ? ' · AMULETT' : '') + (l.scroll ? ' · SCHRIFTROLLE' : '')); }
    const sk = Lv.sackClaim(s); if (sk) lines.push('GRATIS-BEUTEL: +' + sk.coins + ' MÜNZEN' + (sk.potion ? ' · +TRANK' : ''));
    g.persist(); sfx.handle({ type: 'heal' }, false);
    lootModal(g, 'EINGESAMMELT!', lines, () => g.showHub());
  });
  const later = h('button', 'btn ghost', 'SPÄTER'); onTap(later, () => { sfx.back(); g.showHub(true); });
  m.append(all, later); g.setScreen(m); return true;
}

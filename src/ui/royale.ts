import type { Game } from '../game';
import { h, onTap, spriteCanvas, pixIcon } from './dom';
import { sfx } from '../audio';
import { SPECIES } from '../data/species';
import { RoyaleCtl, PLAYERS } from '../battle/royale';
import { playMenu } from './modes';
import { snap, announce } from './gains';
import { gainXp, gainPlayerXp } from '../state';
import { track } from '../systems/live';

/** Battle Royale: riesige Karte, 25 andere Monster auf dem Spielerlevel, schrumpfender Sturm, Items zum Einsammeln – gekämpft wird direkt auf der Karte. */
/** Startbildschirm des Modus. */
export function royaleIntro(g: Game) {
  const s = g.save, lead = g.teamOwned[0], box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); playMenu(g); });
  box.append(bk, h('h2', '', 'BATTLE ROYALE'), h('div', 'subt', 'BESTE PLATZIERUNG: ' + (s.stats.royaleBest ? 'PLATZ ' + s.stats.royaleBest : '–') + ' · KILLS GESAMT: ' + s.stats.royaleKills));
  box.append(h('div', 'bigp', '26 MONSTER, EINE RIESIGE KARTE. NUR EINES BLEIBT ÜBRIG! DU STEUERST DEIN ANFÜHRER-MONSTER PER TIPPEN. KOMMT EIN ANDERES MONSTER HERAN, KÄMPFST DU DIREKT AUF DER KARTE – MIT DEN NORMALEN STEUERUNGEN. DEINE KP BLEIBEN ERHALTEN: ZIEH DICH ZURÜCK, UM DICH ZU ERHOLEN, ODER SAMMLE HEILUNG, KRAFT, FOKUS UND TEMPO EIN. EIN STURM ENGT DIE KARTE EIN. DIE GEGNER HABEN DEIN LEVEL.'));
  box.append(h('div', 'banner2', 'BELOHNUNG NACH KILLS UND PLATZIERUNG – AUCH WENN DU VERLIERST. 5 KILLS ODER EIN PLATZ IN DEN TOP 3 GEBEN EINEN KISTENSCHLÜSSEL.'));
  if (lead) { const c = h('div', 'tmini'); c.style.margin = '6px auto'; c.append(spriteCanvas(lead.sp, 1), h('span', '', SPECIES[lead.sp].name.toUpperCase().slice(0, 12)), h('span', '', 'LV ' + lead.level)); box.append(h('div', 'sec', 'DEIN KÄMPFER'), c); }
  const go = h('button', 'btn big', 'ABSPRINGEN!'); onTap(go, () => { sfx.ui(); startRoyale(g); }); box.append(go); g.setScreen(box);
}


function startRoyale(g: Game) {
  const lead = g.teamOwned[0], ctl = new RoyaleCtl(g.save, lead), { player, enemy } = ctl.trainers(), before = snap(g.save);
  (window as unknown as { __royale?: RoyaleCtl }).__royale = ctl;
  g.beginBattle({ kind: 'royale', player, enemy, mod: 'none', map: ctl.map.id, len: ctl.len, royale: ctl, banner: 'BATTLE ROYALE', sub: PLAYERS + ' RIVALEN · NUR EINER BLEIBT', onEnd: (win) => finish(g, ctl, win, before) });
  ctl.msg = (t) => g.cmdMsg(t);
}

function finish(g: Game, ctl: RoyaleCtl, win: boolean, before: ReturnType<typeof snap>) {
  const place = win ? 1 : ctl.placeNow(), kills = ctl.kills, s = g.save, lead = g.teamOwned[0];
  const coins = kills * 35 + (place === 1 ? 250 : place <= 3 ? 120 : place <= 5 ? 80 : place <= 10 ? 50 : 15) + (PLAYERS + 1 - place) * 4;
  const keys = (kills >= 5 || place <= 3 ? 1 : 0) + (place === 1 ? 1 : 0);
  const mxp = kills * 14 + (PLAYERS + 1 - place) * 2 + 10, pxp = 20 + kills * 10 + (PLAYERS + 1 - place);
  s.coins += coins; s.inv.keys += keys; if (lead) gainXp(s, lead, mxp); gainPlayerXp(s, pxp);
  s.stats.royaleBest = s.stats.royaleBest ? Math.min(s.stats.royaleBest, place) : place; s.stats.royaleKills += kills; s.stats.battles++;
  track(s, 'kos', kills);
  g.persist();
  const box = h('div', 'modal result ' + (place === 1 ? 'win' : 'lose'));
  box.append(h('h2', '', place === 1 ? '🏆 CHAMPION!' : 'AUSGESCHIEDEN'), h('div', 'sub', place === 1 ? 'DU HAST ALLE BESIEGT!' : 'PLATZ ' + place + ' VON ' + (PLAYERS + 1)));
  const st = h('div', 'stats'); const sv = (k: string, v: string) => { const r = h('div', 'srow'); r.append(h('span', '', k), h('b', '', v)); st.append(r); };
  sv('PLATZ', place + ' / ' + (PLAYERS + 1)); sv('KILLS', String(kills)); sv('ÜBERLEBT', Math.round(ctl.t) + ' S'); sv('MÜNZEN', '+' + coins); sv('KISTENSCHLÜSSEL', keys ? '+' + keys : '–'); sv('ERFAHRUNG', '+' + mxp + ' EP'); box.append(st);
  if (!keys) box.append(h('div', 'sub', 'MIT 5 KILLS ODER EINEM PLATZ IN DEN TOP 3 GIBT ES EINEN SCHLÜSSEL.'));
  const again = h('button', 'btn big', 'NOCH EINMAL'); onTap(again, () => { sfx.ui(); g.toMenu(); royaleIntro(g); });
  const ok = h('button', 'btn ghost', 'ZURÜCK'); onTap(ok, () => { sfx.back(); g.toMenu(); playMenu(g); });
  box.append(again, ok); g.setScreen(box); announce(g, before, ['PLATZ ' + place + ' · ' + kills + ' KILLS'], place === 1 ? 'DU HAST GEWONNEN' : 'BELOHNUNG');
}
void pixIcon;

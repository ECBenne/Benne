import { track } from '../systems/live';
import type { Game } from '../game';
import { h, onTap, spriteCanvas, amuletIcon, pixIcon, icons, heartIcon } from './dom';
import { sfx } from '../audio';
import { SPECIES } from '../data/species';
import { AMULETS } from '../data/items';
import { TYPE_NAMES } from '../data/types';
import { openChest } from '../league';
import { CHEST, ROSTER_MAX } from '../state';

const ITEM_NAMES = { potion: 'TRANK', super: 'SUPERTRANK', revive: 'BELEBER', focus: 'FOKUS-TRANK', elixir: 'ANGRIFFS-ELIXIER', books: 'LEHRBUCH (+1 ATTACKENPUNKT)' };

/** Inhalt des Shop-Reiters „Kisten". Monster gibt es nur hier – und nur mit etwas Glück. */
export function chestContent(g: Game): HTMLElement[] {
  const s = g.save, out: HTMLElement[] = [];
  const box = h('div', 'chest px');
  const kr = h('div', 'keyrow'); kr.append(pixIcon('key', 3), document.createTextNode('SCHLÜSSEL: ' + s.inv.keys));
  const open = h('button', 'btn big' + (s.inv.keys ? '' : ' off'), s.inv.keys ? 'KISTE ÖFFNEN' : 'KEIN SCHLÜSSEL');
  onTap(open, () => { if (!s.inv.keys) return g.toast('SCHLÜSSEL GIBT ES BEI BOSSEN UND IM RAID'); sfx.ui(); openAnim(g); });
  box.append(pixIcon('chest', 8), h('b', '', 'MONSTERKISTE'), kr, open);
  out.push(box);
  out.push(h('div', 'sec', 'INHALT'));
  const odds = h('div', 'stats'); const sv = (k: string, v: string) => { const r = h('div', 'srow'); r.append(h('span', '', k), h('b', '', v)); odds.append(r); };
  sv('MONSTER', Math.round(CHEST.monster * 100) + '%'); sv('AMULETT', Math.round(CHEST.amulet * 100) + '%'); sv('ITEMS + MÜNZEN', Math.round((1 - CHEST.monster - CHEST.amulet) * 100) + '%');
  sv('GARANTIE', 'MONSTER SPÄTESTENS IN ' + Math.max(1, CHEST.pity - s.chest.miss) + ' KISTE(N)');
  out.push(odds);
  if (s.mons.length >= ROSTER_MAX) out.push(h('div', 'natdesc', 'DEIN KADER IST VOLL – KISTEN ENTHALTEN GERADE KEINE MONSTER.'));
  out.push(h('div', 'sec', 'SO BEKOMMST DU SCHLÜSSEL'));
  out.push(h('div', 'bigp', 'LIGA-BOSS BESIEGEN · RAID GEWINNEN · TURMWÄCHTER (JEDE 5. ETAGE) · ALLE 4 SPIELERLEVEL'));
  return out;
}

function openAnim(g: Game) {
  const loot = openChest(g.save); if (!loot) return;
  track(g.save, 'chests', 1);
  g.persist();
  const box = h('div', 'modal');
  const ch = h('div', 'chestbox shake'); ch.append(pixIcon('chest', 8));
  box.append(h('h2', '', 'KISTE …'), ch);
  g.setScreen(box);
  sfx.handle({ type: 'dash' }, false);
  const t = window.setTimeout(() => {
    box.innerHTML = '';
    const lt = h('div', 'loot');
    if (loot.kind === 'monster') {
      const sp = SPECIES[loot.sp];
      lt.append(spriteCanvas(loot.sp, 3), h('b', '', 'EIN MONSTER! ' + sp.name.toUpperCase()), h('div', 'sub', sp.types.map((t2) => TYPE_NAMES[t2].toUpperCase()).join('/') + ' · LEVEL ' + loot.level + ' · JETZT IM KADER'));
      sfx.jingle(true);
    } else if (loot.kind === 'amulet') {
      const a = AMULETS[loot.id]; lt.append(amuletIcon(a.color, 6), h('b', '', 'AMULETT: ' + a.name.toUpperCase()), h('div', 'sub', a.desc.toUpperCase())); sfx.handle({ type: 'heal' }, false);
    } else {
      const ic = loot.item === 'revive' ? heartIcon(5) : loot.item === 'focus' ? pixIcon('focus', 5) : loot.item === 'elixir' ? pixIcon('elixir', 5) : loot.item === 'books' ? pixIcon('book', 5) : loot.item === 'super' ? icons.super() : icons.potion();
      lt.append(ic, h('b', '', loot.n + '× ' + ITEM_NAMES[loot.item]), h('div', 'sub', '+' + loot.coins + ' MÜNZEN')); sfx.handle({ type: 'heal' }, false);
    }
    box.append(h('h2', '', 'GEFUNDEN!'), lt);
    if (g.save.inv.keys > 0) { const again = h('button', 'btn big', 'NOCH EINE (' + g.save.inv.keys + ')'); onTap(again, () => { sfx.ui(); openAnim(g); }); box.append(again); }
    const ok = h('button', 'btn ' + (g.save.inv.keys > 0 ? 'ghost' : 'big'), 'WEITER'); onTap(ok, () => { sfx.ui(); g.shopTab = 'chests'; g.showShop(); }); box.append(ok);
  }, 1100);
  g.tickers.push(t);
}

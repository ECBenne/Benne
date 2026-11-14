import type { Game } from '../game';
import { AMULETS } from '../data/items';
import { amuletIcon, h, onTap } from './dom';
import { sfx } from '../audio';
import type { Owned } from '../state';

/** Amulett-Auswahl für ein Monster (Ablegen / aus dem Inventar anlegen). */
export function chooseAmulet(g: Game, o: Owned, done: () => void) {
  const box = h('div', 'page');
  box.append(h('h2', '', 'AMULETT'), h('div', 'sub', 'EIN AMULETT PRO MONSTER. WIRKT IM KAMPF.'));
  const row = (id: string | null, count = 1) => {
    const a = id ? AMULETS[id] : null;
    const r = h('button', 'amrow');
    const sw = a ? amuletIcon(a.color, 2) : h('span', 'sw');
    const tx = h('div', 'tx'); tx.append(h('div', '', a ? a.name.toUpperCase() + (count > 1 ? ' ×' + count : '') : 'KEIN AMULETT'), h('small', '', a ? a.desc.toUpperCase() : 'AMULETT ABLEGEN'));
    r.append(sw, tx);
    onTap(r, () => {
      sfx.ui();
      if (o.item) g.save.inv.amulets.push(o.item);
      if (id) { const i = g.save.inv.amulets.indexOf(id); if (i >= 0) g.save.inv.amulets.splice(i, 1); }
      o.item = id; g.persist(); done();
    });
    return r;
  };
  if (o.item) box.append(h('div', 'sec', 'AKTUELL: ' + AMULETS[o.item].name.toUpperCase()));
  box.append(row(null));
  const counts: Record<string, number> = {};
  for (const a of g.save.inv.amulets) counts[a] = (counts[a] ?? 0) + 1;
  for (const id of Object.keys(counts)) box.append(row(id, counts[id]));
  if (!Object.keys(counts).length) box.append(h('div', 'natdesc', 'KEINE AMULETTE IM BESITZ. SIE FALLEN BEI ELITE-GEGNERN UND BOSSEN ODER KOMMEN AUS DEM SHOP.'));
  const back = h('button', 'btn ghost', 'ZURÜCK'); onTap(back, () => { sfx.back(); done(); });
  box.append(back);
  g.setScreen(box);
}

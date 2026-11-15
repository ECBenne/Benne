import type { Game } from '../game';
import type { Save } from '../state';
import { h, icons, pixIcon } from './dom';
import { sfx } from '../audio';

/** Momentaufnahme dessen, was man gewinnen kann (für den Vergleich vorher/nachher). */
export interface Snap { coins: number; keys: number; potion: number; super: number; revive: number; focus: number; elixir: number; amulets: number; scrolls: number; lvl: number; mons: number; books: number }
export const snap = (s: Save): Snap => ({ coins: s.coins, keys: s.inv.keys, potion: s.inv.potion, super: s.inv.super, revive: s.inv.revive, focus: s.inv.focus, elixir: s.inv.elixir, amulets: s.inv.amulets.length, scrolls: s.inv.scrolls.length, lvl: s.pl.lvl, mons: s.mons.length, books: s.inv.books });

/** Zeigt alles, was seit `before` dazugekommen ist, als Einblendung (nicht blockierend, verschwindet von selbst). */
export function announce(g: Game, before: Snap, extra: string[] = [], title = 'DU HAST GEWONNEN') {
  const a = snap(g.save), rows: { ic: () => HTMLElement; text: string }[] = [];
  const d = (k: keyof Snap) => a[k] - before[k];
  if (d('coins') > 0) rows.push({ ic: () => icons.coin(2), text: '+' + d('coins') + ' MÜNZEN' });
  if (d('keys') > 0) rows.push({ ic: () => pixIcon('key', 2), text: '+' + d('keys') + ' KISTENSCHLÜSSEL' });
  if (d('potion') > 0) rows.push({ ic: () => icons.potion(), text: '+' + d('potion') + ' TRANK' });
  if (d('super') > 0) rows.push({ ic: () => icons.super(), text: '+' + d('super') + ' SUPERTRANK' });
  if (d('revive') > 0) rows.push({ ic: () => pixIcon('rest', 2), text: '+' + d('revive') + ' BELEBER' });
  if (d('focus') > 0) rows.push({ ic: () => pixIcon('focus', 2), text: '+' + d('focus') + ' FOKUS-TRANK' });
  if (d('elixir') > 0) rows.push({ ic: () => pixIcon('elixir', 2), text: '+' + d('elixir') + ' ELIXIER' });
  if (d('amulets') > 0) rows.push({ ic: () => pixIcon('elite', 2), text: d('amulets') + (d('amulets') > 1 ? ' NEUE AMULETTE' : ' NEUES AMULETT') });
  if (d('scrolls') > 0) rows.push({ ic: () => pixIcon('scroll', 2), text: d('scrolls') + (d('scrolls') > 1 ? ' NEUE SCHRIFTROLLEN' : ' NEUE SCHRIFTROLLE') });
  if (d('books') > 0) rows.push({ ic: () => pixIcon('book', 2), text: '+' + d('books') + ' ATTACKENBUCH' });
  if (d('mons') > 0) rows.push({ ic: () => pixIcon('team', 2), text: 'NEUES MONSTER IM KADER!' });
  if (d('lvl') > 0) rows.push({ ic: () => pixIcon('liga', 2), text: 'SPIELERLEVEL ' + a.lvl + '!' });
  for (const t of extra) rows.push({ ic: () => pixIcon('event', 2), text: t });
  if (!rows.length) return;
  document.getElementById('gains')?.remove();
  const box = h('div', 'gains'); box.id = 'gains';
  box.append(h('div', 'gtitle', title));
  rows.slice(0, 7).forEach((r, i) => { const it = h('div', 'gitem'); it.style.animationDelay = i * 0.12 + 's'; it.append(r.ic(), h('span', '', r.text)); box.append(it); });
  box.addEventListener('pointerup', () => box.remove());
  document.body.appendChild(box); sfx.handle({ type: 'heal' }, false);
  window.setTimeout(() => { box.classList.add('out'); window.setTimeout(() => box.remove(), 400); }, 3800);
}

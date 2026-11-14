import { getSprite } from '../gfx/sprites';

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '', attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

/** Vorschau-Bild (Richtung 0 = zur Kamera, Spalte 0). */
export function spriteCanvas(speciesId: string, scale = 2, dir = 0, col = 0): HTMLCanvasElement {
  const s = getSprite(speciesId);
  const fr = s.frames[dir][col];
  const c = document.createElement('canvas');
  c.width = fr.n.width; c.height = fr.n.height; c.className = 'spr';
  c.style.width = c.width * scale + 'px'; c.style.height = c.height * scale + 'px';
  c.getContext('2d')!.drawImage(fr.n, 0, 0);
  return c;
}

/** Tap-Handler, der auch bei schnellem Tippen auf Touchgeräten zuverlässig feuert. */
export function onTap(el: HTMLElement, fn: (e: Event) => void) {
  el.addEventListener('pointerup', (e) => { e.preventDefault(); fn(e); });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

/** Kleines Pixel-Icon aus Zeichenraster. */
export function iconCanvas(rows: string[], pal: Record<string, string>, scale = 2): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = rows[0].length; c.height = rows.length; c.className = 'spr';
  c.style.width = c.width * scale + 'px'; c.style.height = c.height * scale + 'px';
  const g = c.getContext('2d')!;
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
  return c;
}
const POTION = ['...kkkk...', '...kwwk...', '...kkkk...', '..kppppk..', '.kpppwppk.', '.kpppwppk.', '.kppppppk.', '.kppppppk.', '..kkkkkk..'];
export const icons = {
  potion: () => iconCanvas(POTION, { k: '#2b2030', w: '#fff', p: '#c860e8' }, 3),
  super: () => iconCanvas(POTION, { k: '#2b2030', w: '#fff', p: '#f8c030' }, 3),
  coin: (s = 2) => iconCanvas(['..kkkk..', '.kggggk.', 'kgGyygGk', 'kgyGGygk', 'kgyGGygk', 'kgGyygGk', '.kggggk.', '..kkkk..'], { k: '#7a4a10', g: '#f8d030', G: '#fff0a0', y: '#d8a010' }, s),
};

export const amuletIcon = (color: string, scale = 2) => iconCanvas(['..kkkk..', '.kwwwwk.', 'kwccccck', 'kwccccck', '.kcccck.', '..kcck..', '...kk...'], { k: '#2b2030', w: '#ffffff', c: color }, scale);
export const heartIcon = (scale = 2) => iconCanvas(['.kk..kk.', 'krrkkrrk', 'krrrrrrk', 'krrrrrrk', '.krrrrk.', '..krrk..', '...kk...'], { k: '#2b2030', r: '#f05878' }, scale);

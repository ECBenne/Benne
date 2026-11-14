import { getSprite } from '../gfx/sprites';

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '', attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

export function spriteCanvas(speciesId: string, scale = 2, frame = 'idle0', face: 1 | -1 = 1): HTMLCanvasElement {
  const s = getSprite(speciesId);
  const c = document.createElement('canvas');
  c.width = s.w; c.height = s.h; c.className = 'spr';
  c.style.width = s.w * scale + 'px'; c.style.height = s.h * scale + 'px';
  c.getContext('2d')!.drawImage(face === 1 ? s.frames[frame].n : s.frames[frame].f, 0, 0);
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

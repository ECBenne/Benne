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
export const uiSettings = { vibe: true };
export function onTap(el: HTMLElement, fn: (e: Event) => void) {
  el.addEventListener('pointerup', (e) => { e.preventDefault(); if (uiSettings.vibe && navigator.vibrate) { try { navigator.vibrate(6); } catch { /* */ } } fn(e); });
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

/** Animierter Sprite (läuft auf der Stelle); Tippen dreht ihn. Der Timer wird über reg() zum Aufräumen gemeldet. */
export function animSprite(id: string, scale: number, reg: (timer: number) => void, startDir = 0): HTMLCanvasElement {
  const sp = getSprite(id);
  const c = document.createElement('canvas'); c.width = sp.w; c.height = sp.h; c.className = 'spr';
  c.style.width = sp.w * scale + 'px'; c.style.height = sp.h * scale + 'px';
  const g = c.getContext('2d')!; let dir = startDir, col = 0;
  const draw = () => { g.clearRect(0, 0, c.width, c.height); g.drawImage(sp.frames[dir][col].n, 0, 0); };
  draw();
  reg(window.setInterval(() => { col = (col + 1) % sp.cols; draw(); }, 105));
  c.addEventListener('pointerup', () => { dir = (dir + 1) % sp.dirs; draw(); });
  return c;
}

const ICON_PAL = { k: '#2b2030', w: '#ffffff', y: '#f8d030', r: '#e84838', o: '#f08030', b: '#6890f0', g: '#78c850', c: '#58c8e8', p: '#c860e8', n: '#a8661c', d: '#6a6a74' };
const ICONS: Record<string, string[]> = {
  battle: ['...kkkk..', '..kyyyk..', '.kyyyk...', 'kyyyyyyk.', '..kyyk...', '..kyk....', '.kyk.....', '.kk......'],
  elite: ['.kkkkkkk.', 'kwwwwwwwk', 'kwkwwwkwk', 'kwwwkwwwk', '.kwwwwwk.', '.kwkwkwk.', '..kkkkk..'],
  rest: ['....k....', '...krk...', '..krork..', '.krooork.', '.kroyork.', '.kkkkkkk.', '.nnnnnnn.'],
  shop: ['..kkkkk..', '...kyk...', '..kkkkk..', '.kyyyyyk.', 'kyyykyyyk', 'kyyykyyyk', '.kyyyyyk.', '..kkkkk..'],
  event: ['..kkkkk..', '.kwwwwwk.', '.kk...kwk', '.....kwk.', '....kwk..', '...kwk...', '...kk....', '...kwk...'],
  boss: ['k...k...k', 'kk.kyk.kk', 'kykkykkyk', 'kyyyyyyyk', 'kyyryyryk', 'kyyyyyyyk', 'kkkkkkkkk'],
  home: ['....k....', '...kwk...', '..kwwwk..', '.kwwwwwk.', 'kwwwwwwwk', '.kwwkwwk.', '.kwwkwwk.', '.kkkkkkk.'],
  liga: ['.kkkkkkk.', 'kyyyyyyyk', 'kyykkkyyk', '.kyyyyyk.', '..kyyyk..', '...kyk...', '..kyyyk..', '.kkkkkkk.'],
  team: ['..kk.kk..', '.kwwkwwk.', '.kwwkwwk.', '..kk.kk..', '.kwwkwwk.', 'kwwwkwwwk', 'kwwwkwwwk', '.kkk.kkk.'],
  shopt: ['..kkkkk..', '.kwwwwwk.', 'kwwwwwwwk', 'kwwkkkwwk', 'kwwwwwwwk', 'kwwwwwwwk', '.kkkkkkk.'],
  key: ['..kkk....', '.kyyyk...', 'kyykyyk..', 'kyyyyykkk', '.kyyykyyk', '..kkk.kyk', '......kk.'],
  focus: ['...kkk...', '...kwk...', '..kkkkk..', '.kccccck.', 'kccwcccck', 'kccwcccck', '.kccccck.', '..kkkkk..'],
  elixir: ['...kkk...', '...kwk...', '..kkkkk..', '.kooooook', 'koowooook', 'koowooook', '.koooook.', '..kkkkk..'],
  chest: ['.kkkkkkkkk.', 'knnnnnnnnnk', 'knyyyyyyynk', 'kkkkkykkkkk', 'knnnkykknnk', 'knnnnnnnnnk', 'knnnnnnnnnk', 'kkkkkkkkkkk'],
  raid: ['k.......k', 'kk.....kk', 'krk...krk', 'krrkkkrrk', 'krwrrrwrk', 'krrrrrrrk', '.krrkrrk.', '..kk.kk..'],
  more: ['.........', 'kkk.kkk.k', 'kwk.kwk.k', 'kkk.kkk.k', '.........', 'kkk.kkk.k', 'kwk.kwk.k', 'kkk.kkk.k'],
};
export const pixIcon = (name: string, scale = 2, pal: Record<string, string> = {}) => iconCanvas(ICONS[name], { ...ICON_PAL, ...pal }, scale);
export const typePill = (t: string, name: string) => h('span', 'tag ' + t, name);

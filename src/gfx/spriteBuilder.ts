/**
 * Pixel-Sprite-Builder:
 *  - Sprites werden als Zeichen-Raster (Layer) definiert
 *  - Outline und Unterkanten-Schatten werden automatisch erzeugt -> einheitlicher Look
 *  - Spiegelung und Weiß-Silhouette (Treffer-Blitz) werden vorgerendert
 */
export interface Layer { rows: string[]; x: number; y: number }
export type Grid = string[][];

export interface ArtDef {
  w: number; h: number;                 // Rastergröße (ohne Outline)
  palette: Record<string, string>;
  shade: Record<string, string>;        // Zeichen -> Schatten-Zeichen (Unterkante)
  outline: string;
  frames: Record<string, Layer[]>;      // Frame-Name -> Layer
  /** Ankerpunkt (Füße) relativ zum fertigen Sprite-Canvas */
  anchor: { x: number; y: number };
}

export interface Sprite {
  w: number; h: number; ax: number; ay: number;
  frames: Record<string, { n: HTMLCanvasElement; f: HTMLCanvasElement; wn: HTMLCanvasElement; wf: HTMLCanvasElement }>;
}

const PAD = 1;

function compose(art: ArtDef, layers: Layer[]): Grid {
  const g: Grid = Array.from({ length: art.h }, () => Array(art.w).fill('.'));
  for (const l of layers) {
    l.rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        const c = row[rx];
        if (c === '.' || c === ' ') continue;
        const gx = l.x + rx, gy = l.y + ry;
        if (gx >= 0 && gy >= 0 && gx < art.w && gy < art.h) g[gy][gx] = c === '~' ? '.' : c;
      }
    });
  }
  return g;
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}

function render(art: ArtDef, g: Grid) {
  const W = art.w + PAD * 2, H = art.h + PAD * 2;
  const solid = (x: number, y: number) => {
    const gx = x - PAD, gy = y - PAD;
    return gx >= 0 && gy >= 0 && gx < art.w && gy < art.h && g[gy][gx] !== '.';
  };
  const n = canvas(W, H); const ctx = n.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (solid(x, y)) {
      let ch = g[y - PAD][x - PAD];
      // Unterkanten-Schatten
      if (art.shade[ch] && !solid(x, y + 1)) ch = art.shade[ch];
      else if (art.shade[ch] && !solid(x, y + 2) && (x + y) % 2 === 0 && false) ch = art.shade[ch];
      ctx.fillStyle = art.palette[ch] ?? '#f0f';
      ctx.fillRect(x, y, 1, 1);
    } else if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
      ctx.fillStyle = art.outline;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // Weiß-Silhouette
  const wn = canvas(W, H); const wc = wn.getContext('2d')!;
  wc.drawImage(n, 0, 0); wc.globalCompositeOperation = 'source-in'; wc.fillStyle = '#fff'; wc.fillRect(0, 0, W, H);
  const flip = (src: HTMLCanvasElement) => {
    const f = canvas(W, H); const fc = f.getContext('2d')!;
    fc.translate(W, 0); fc.scale(-1, 1); fc.drawImage(src, 0, 0); return f;
  };
  return { n, f: flip(n), wn, wf: flip(wn) };
}

export function buildSprite(art: ArtDef): Sprite {
  const frames: Sprite['frames'] = {};
  for (const [name, layers] of Object.entries(art.frames)) frames[name] = render(art, compose(art, layers));
  return { w: art.w + PAD * 2, h: art.h + PAD * 2, ax: art.anchor.x + PAD, ay: art.anchor.y + PAD, frames };
}

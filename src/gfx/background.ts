import { Rng } from '../core/util';

/** Logische Auflösung – passt sich dem Gerät an (ganzzahliger Pixel-Maßstab bleibt scharf). */
export const view = { w: 180, h: 250 };
export interface Rect { x0: number; y0: number; x1: number; y1: number }

const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Vorgerenderte Arena (Diamant/Perl-Stil): Wiese, gepflasterter Kampfplatz, Wald, Teich, Zaun. */
export function buildBackground(W: number, H: number, A: Rect): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const r = new Rng(1234);
  const px = (x: number, y: number, col: string, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };

  // ── 1. Wiese: drei Grüntöne, Flecken + Kachelraster ──
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const coarse = hash(x >> 4, y >> 4), fine = hash(x >> 1, y >> 1);
    let col = coarse > 0.72 ? '#62b042' : coarse > 0.3 ? '#6cbc48' : '#74c64c';
    if (fine > 0.93) col = '#7ed056';
    if (((x >> 4) + (y >> 4)) % 2 === 0) col = col === '#62b042' ? '#5eac40' : col === '#6cbc48' ? '#68b846' : col;
    px(x, y, col, 2, 2);
  }
  // Halme, Blumen
  const tuft = (x: number, y: number) => { px(x, y, '#4f9c36'); px(x + 2, y, '#4f9c36'); px(x + 1, y + 1, '#4f9c36'); px(x + 1, y - 1, '#58a83a'); };
  for (let i = 0; i < Math.round(W * H / 120); i++) tuft(r.int(0, W - 3), r.int(8, H - 4));
  const flower = (x: number, y: number) => { const col = r.pick(['#ffffff', '#f8e060', '#f890b8', '#ff8060']); px(x, y - 1, col); px(x - 1, y, col); px(x + 1, y, col); px(x, y + 1, col); px(x, y, '#f8c830'); };

  // ── 2. Kampfplatz (gepflastert) ──
  const cx = (A.x0 + A.x1) / 2, cy = (A.y0 + A.y1) / 2;
  const hw = (A.x1 - A.x0) / 2 + 10, hh = (A.y1 - A.y0) / 2 + 10, rad = 22;
  const rrDist = (x: number, y: number) => { // negativ = innen
    const qx = Math.abs(x - cx) - (hw - rad), qy = Math.abs(y - cy) - (hh - rad);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
  };
  for (let y = Math.floor(cy - hh) - 4; y <= cy + hh + 4; y++) for (let x = Math.floor(cx - hw) - 4; x <= cx + hw + 4; x++) {
    const d = rrDist(x, y);
    if (d > 3) continue;
    if (d > 0) { px(x, y, '#9c8a58'); continue; }                       // Außenkante (Schatten)
    if (d > -2) { px(x, y, '#e9dfb8'); continue; }                      // helle Einfassung
    if (d > -4) { px(x, y, '#b8a46c'); continue; }
    const tx = Math.floor((x - cx + 1000) / 12), ty = Math.floor((y - cy + 1000) / 12);
    const grout = (x - cx + 1000) % 12 === 0 || (y - cy + 1000) % 12 === 0;
    let col = (tx + ty) % 2 ? '#dccb96' : '#d6c48c';
    const n = hash(x, y); if (n > 0.9) col = '#e4d4a0'; else if (n < 0.05) col = '#cdb982';
    px(x, y, grout ? '#c9b67e' : col);
  }
  // Spielfeld-Linien
  const line = '#f6efd2', lineS = '#bfae7a';
  const inset = 8;
  for (let y = Math.floor(cy - hh); y <= cy + hh; y++) for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
    const d = rrDist(x, y) + inset;
    if (d > -1 && d <= 0) px(x, y, line);
  }
  for (let x = Math.floor(cx - hw + inset); x <= cx + hw - inset; x++) { px(x, cy, line); px(x, cy + 1, lineS); }
  for (let a = 0; a < Math.PI * 2; a += 0.012) {
    px(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26, line);
    px(cx + Math.cos(a) * 25, cy + Math.sin(a) * 25 + 1, lineS);
    px(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, line);
  }
  // Startmarkierungen
  for (const side of [-1, 1]) { const my = cy + side * (A.y1 - A.y0) * 0.28; px(cx - 12, my, line, 25, 1); }

  // ── 3. Bäume & Büsche ──
  const shadow = (x: number, y: number, w: number) => { g.globalAlpha = 0.22; px(x - w / 2, y - 2, '#0c3a1c', w, 4); px(x - w / 2 - 2, y - 1, '#0c3a1c', w + 4, 2); g.globalAlpha = 1; };
  const tree = (x: number, y: number, s: number) => {
    shadow(x, y, s * 1.5);
    px(x - 2, y - 10, '#7a4a24', 5, 11); px(x - 2, y - 10, '#9a6a3a', 2, 11); px(x + 2, y - 10, '#5a3418', 1, 11);
    const cyy = y - 10 - s * 0.6;
    for (let yy = -s; yy <= s; yy++) for (let xx = -s; xx <= s; xx++) {
      const d = Math.hypot(xx, yy * 1.08);
      if (d > s) continue;
      let col = '#2f8a3a';
      if (d > s - 1.3) col = '#1d5a2a';
      else if (xx + yy < -s * 0.55) col = '#58b848';
      else if (xx + yy > s * 0.55) col = '#26702f';
      if (d < s - 1.3 && hash(x + xx, cyy + yy) > 0.93) col = '#48a844';
      px(x + xx, cyy + yy, col);
    }
  };
  const bush = (x: number, y: number, s: number) => {
    shadow(x, y + s * 0.4, s * 1.8);
    for (let yy = -s; yy <= s * 0.5; yy++) for (let xx = -s; xx <= s; xx++) {
      const d = Math.hypot(xx, yy * 1.25); if (d > s) continue;
      px(x + xx, y + yy, d > s - 1.2 ? '#1f5a2a' : (xx + yy < -s * 0.5 ? '#58b848' : '#2f8a3a'));
    }
  };

  // Teich oben (liegt im Waldstück oberhalb des Platzes)
  const topH = A.y0 - 12;
  const pondX = Math.round(W * 0.6), pondY = Math.round(topH * 0.66), prx = 30, pry = 13;
  for (let y = -pry - 3; y <= pry + 3; y++) for (let x = -prx - 3; x <= prx + 3; x++) {
    const d = (x * x) / (prx * prx) + (y * y) / (pry * pry), d2 = (x * x) / ((prx + 3) * (prx + 3)) + (y * y) / ((pry + 3) * (pry + 3));
    if (d <= 1) px(pondX + x, pondY + y, d > 0.8 ? '#3870d8' : ((x + y * 2) % 11 === 0 ? '#9cc8ff' : (hash(x, y) > 0.9 ? '#78a8f8' : '#5890f0')));
    else if (d2 <= 1) px(pondX + x, pondY + y, '#e0d09c');
  }
  px(pondX - 12, pondY - 3, '#b8dcff', 6, 1); px(pondX + 6, pondY + 3, '#b8dcff', 5, 1);
  for (let i = 0; i < 4; i++) { const rx = pondX - prx + 4 + i * 3, ry = pondY + pry; px(rx, ry - 6, '#2f8a3a', 1, 6); px(rx + 1, ry - 8, '#58b848', 1, 8); }

  // Baumreihen oben (Wald), Teich ausgespart
  for (let row = 0, y = topH; y > -14; row++, y -= 14) {
    for (let x = -4 + (row % 2) * 9; x < W + 12; x += 19) {
      if (Math.abs(x - pondX) < prx + 12 && y > pondY - 20 && y < pondY + 30) continue;
      tree(x, y + (row % 2) * 2, 13 - Math.min(row, 2));
    }
  }
  // Seitenbäume/-büsche
  for (let y = A.y0 + 10; y < A.y1 + 24; y += 36) { bush(-3, y, 11); bush(W + 3, y + 18, 11); }
  // Unten: Hecke + Zaun
  const fy = A.y1 + 18;
  for (let x = -6; x < W + 10; x += 15) bush(x, H - 3, 11);
  for (let x = 6; x < W - 4; x += 26) { px(x, fy, '#e9d9a9', 4, 12); px(x, fy, '#fff4d0', 4, 1); px(x + 3, fy + 1, '#a89868', 1, 11); }
  px(0, fy + 3, '#d8c898', W, 2); px(0, fy + 5, '#a89868', W, 1); px(0, fy + 8, '#d8c898', W, 2); px(0, fy + 10, '#a89868', W, 1);

  // Blumen & Felsen im Außenbereich
  for (let i = 0; i < 40; i++) {
    const x = r.int(2, W - 3), y = r.int(topH + 6, H - 14);
    if (rrDist(x, y) < 6) continue;
    flower(x, y);
  }
  for (let i = 0; i < 5; i++) {
    const x = r.int(8, W - 12), y = r.int(topH + 8, H - 24);
    if (rrDist(x, y) < 10) continue;
    px(x, y, '#8a8a92', 6, 4); px(x + 1, y - 1, '#a8a8b0', 4, 1); px(x, y + 3, '#62626a', 6, 1); px(x + 1, y, '#c0c0c8', 2, 1);
  }
  // Eckfackeln-Steine am Platz
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const x = cx + sx * (hw - 4), y = cy + sy * (hh - 4); px(x - 2, y - 2, '#8a8a92', 5, 5); px(x - 2, y - 2, '#c0c0c8', 5, 1); px(x - 1, y - 1, '#a8a8b0', 3, 3); }

  // Weiche Randabdunklung
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,30,10,0.22)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return c;
}

import { Rng } from '../core/util';

/** Logische Auflösung – passt sich dem Gerät an (ganzzahliger Pixel-Maßstab bleibt scharf). */
export const view = { w: 180, h: 250 };
export interface Rect { x0: number; y0: number; x1: number; y1: number }

/** Vorgerenderte Arena im Stil von Diamant/Perl: Wiese, Baumreihe, Kampfplatz mit Linien. */
export function buildBackground(VW: number, VH: number, A: Rect): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = VW; c.height = VH;
  const g = c.getContext('2d')!;
  const r = new Rng(42);
  const px = (x: number, y: number, col: string, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w, h); };

  // Wiese: leichtes Schachbrett
  for (let ty = 0; ty < VH; ty += 16) for (let tx = 0; tx < VW; tx += 16) px(tx, ty, ((tx + ty) / 16) % 2 ? '#74c64c' : '#6cbe46', 16, 16);
  // Halme & Blümchen
  for (let i = 0; i < Math.round(VW * VH / 170); i++) {
    const x = r.int(0, VW - 3), y = r.int(30, VH - 4);
    const k = r.next();
    if (k < 0.7) { px(x, y, '#58a83a'); px(x + 2, y, '#58a83a'); px(x + 1, y + 1, '#58a83a'); }
    else if (k < 0.85) { px(x, y, '#86d85a'); px(x + 1, y, '#86d85a'); }
    else { const col = r.pick(['#ffffff', '#f8e060', '#f890b8']); px(x, y, col); px(x + 1, y + 1, col); px(x + 1, y, '#f8d030'); }
  }
  // Kampfplatz (Sand) – Ellipse
  const cx = Math.round((A.x0 + A.x1) / 2), cy = Math.round((A.y0 + A.y1) / 2), rx = Math.round((A.x1 - A.x0) / 2) + 6, ry = Math.round((A.y1 - A.y0) / 2) + 6;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
    if (d <= 1) {
      let col = (x + y) & 1 && d > 0.8 ? '#cdb77f' : '#dbc78f';
      if (d > 0.93) col = '#b7a26b';
      if (((x >> 1) + (y >> 1)) % 7 === 0 && d < 0.8) col = '#d3bf87';
      px(cx + x, cy + y, col);
    }
  }
  // Linien (Mittellinie, Kreis)
  const line = '#efe6c4';
  for (let x = -(rx - 10); x <= rx - 10; x++) px(cx + x, cy, line);
  for (let a = 0; a < Math.PI * 2; a += 0.01) {
    px(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18, line);
    px(cx + Math.cos(a) * (rx - 9), cy + Math.sin(a) * (ry - 9), line);
  }
  px(cx - 1, cy - 1, line, 3, 3);
  // Seitenbäume / Büsche
  const bush = (x: number, y: number, s: number) => {
    for (let yy = -s; yy <= s; yy++) for (let xx = -s; xx <= s; xx++) {
      const d = Math.hypot(xx, yy * 1.1);
      if (d <= s) px(x + xx, y + yy, d > s - 1.2 ? '#1f5a2a' : (xx + yy < -s * 0.6 ? '#4aa84a' : '#2f8638'));
    }
    px(x - s * 0.4, y - s * 0.4, '#7fd070', 2, 1);
  };
  // Baumreihen oben (füllen alles oberhalb des Kampfplatzes)
  const topEdge = A.y0 - 20;
  for (let row = 0, y = 17; y < topEdge + 14; row++, y += 12) for (let x = -6 + (row % 2) * 8; x < VW + 10; x += 17) bush(x, y, 14 - (row === 0 ? 0 : 0));
  px(0, 0, '#1b4d26', VW, 5);
  // Seitenbüsche
  for (let y = A.y0 + 4; y < A.y1 + 10; y += 26) { bush(-2, y, 10); bush(VW + 2, y + 12, 10); }
  // unten: Hecke + Zaun
  for (let x = -4; x < VW + 10; x += 13) bush(x, VH - 4, 11);
  // Schatten unter der Baumreihe
  g.globalAlpha = 0.18; px(0, topEdge + 12, '#103a1c', VW, 5); g.globalAlpha = 1;
  // Zaunpfosten
  const fy = VH - 22;
  for (let x = 12; x < VW - 6; x += 28) { px(x, fy, '#e8d8a8', 3, 8); px(x, fy, '#fff4d0', 3, 1); px(x + 2, fy + 1, '#a89868', 1, 7); }
  px(0, fy + 3, '#d8c898', VW, 2); px(0, fy + 5, '#a89868', VW, 1);
  return c;
}

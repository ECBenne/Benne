import { Rng } from '../core/util';
import { TILT, SCREEN_WORLD, Y } from './world';
import { ARENA } from '../battle/battle';

const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/**
 * Vorgerenderte Weltkarte in geneigter Ansicht (Bodenebene in Y gestaucht, Objekte stehen aufrecht).
 * Größenverhältnisse: Pokémon ~35-40 px hoch -> Bäume ~75 px, Zaun ~18 px, Eckpfeiler ~26 px.
 */
export function buildBackground(): HTMLCanvasElement {
  const W = SCREEN_WORLD.w, H = SCREEN_WORLD.h;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const r = new Rng(1234);
  const px = (x: number, y: number, col: string, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };

  // ── Wiese ──
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const coarse = hash(x >> 4, y >> 4), fine = hash(x >> 1, y >> 1);
    let col = coarse > 0.72 ? '#62b042' : coarse > 0.3 ? '#6cbc48' : '#74c64c';
    if (fine > 0.93) col = '#7ed056';
    px(x, y, col, 2, 2);
  }
  const tuft = (x: number, y: number) => { px(x, y, '#4f9c36'); px(x + 3, y, '#4f9c36'); px(x + 1, y + 1, '#4f9c36', 2, 1); px(x + 1, y - 2, '#58a83a'); px(x + 2, y - 1, '#58a83a'); };
  for (let i = 0; i < Math.round(W * H / 220); i++) tuft(r.int(0, W - 4), r.int(10, H - 4));

  // ── Kampfplatz: gepflastert, erhöht, mit Vorderkante ──
  const cx = (ARENA.x0 + ARENA.x1) / 2;
  const top = Y(ARENA.y0) - 14, bot = Y(ARENA.y1) + 12;       // Platzfläche (Bildschirm)
  const left = ARENA.x0 - 14, right = ARENA.x1 + 14;
  const cy = (top + bot) / 2, hw = (right - left) / 2, hh = (bot - top) / 2, rad = 20;
  const rrDist = (x: number, y: number) => {
    const qx = Math.abs(x - cx) - (hw - rad), qy = Math.abs(y - cy) - (hh - rad);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
  };
  const LIP = 9;  // Höhe der Vorderkante
  // Schatten + Vorderkante (Steinwand)
  for (let y = Math.floor(top) - 2; y <= bot + LIP + 6; y++) for (let x = Math.floor(left) - 2; x <= right + 2; x++) {
    const d = rrDist(x, y - LIP);
    if (rrDist(x, y) <= 0) continue;            // Platzfläche kommt später
    if (d <= 0) {                                 // Wandfläche
      const wallT = (y - (bot - 0)) ;
      const brick = ((x >> 4) + (Math.floor((y - bot) / 5))) % 2 === 0;
      px(x, y, (x % 16 === 0 || (y - Math.floor(bot)) % 5 === 0) ? '#8e7a4c' : brick ? '#b09a68' : '#a89260');
    } else if (d < 4) { g.globalAlpha = 0.28; px(x, y, '#0e3a1c'); g.globalAlpha = 1; }
  }
  // Platzfläche
  const TW = 20, TH = Math.round(20 * TILT);
  for (let y = Math.floor(top) - 3; y <= bot + 3; y++) for (let x = Math.floor(left) - 3; x <= right + 3; x++) {
    const d = rrDist(x, y);
    if (d > 0) continue;
    if (d > -2) { px(x, y, '#f0e6c0'); continue; }
    if (d > -4) { px(x, y, '#bba66e'); continue; }
    const tx = Math.floor((x + 1000) / TW), ty = Math.floor((y + 1000) / TH);
    const grout = (x + 1000) % TW === 0 || (y + 1000) % TH === 0;
    let col = (tx + ty) % 2 ? '#dccb96' : '#d5c38b';
    const n = hash(x, y); if (n > 0.92) col = '#e6d6a2'; else if (n < 0.05) col = '#cbb780';
    // dezenter Verlauf: hinten etwas dunkler
    px(x, y, grout ? '#c4b078' : col);
  }
  // Linien (perspektivisch: Kreis wird Ellipse)
  const line = '#f8f0d4', lineS = '#bba874';
  for (let y = Math.floor(top); y <= bot; y++) for (let x = Math.floor(left); x <= right; x++) { const d = rrDist(x, y) + 10; if (d > -1 && d <= 0) px(x, y, line); }
  const midY = Y((ARENA.y0 + ARENA.y1) / 2);
  for (let x = Math.floor(left + 10); x <= right - 10; x++) { px(x, midY, line); px(x, midY + 1, lineS); }
  for (let a = 0; a < Math.PI * 2; a += 0.008) {
    px(cx + Math.cos(a) * 44, midY + Math.sin(a) * 44 * TILT, line);
    px(cx + Math.cos(a) * 43, midY + Math.sin(a) * 43 * TILT + 1, lineS);
    px(cx + Math.cos(a) * 5, midY + Math.sin(a) * 5 * TILT, line);
  }
  for (const f of [0.22, 0.78]) { const my = Y(ARENA.y0 + (ARENA.y1 - ARENA.y0) * f); px(cx - 22, my, line, 45, 1); px(cx - 22, my + 1, lineS, 45, 1); }

  // ── Objekte (aufrecht) ──
  const shadow = (x: number, y: number, w: number) => { g.globalAlpha = 0.24; px(x - w / 2, y - 3, '#0c3a1c', w, 6); px(x - w / 2 - 3, y - 2, '#0c3a1c', w + 6, 4); g.globalAlpha = 1; };
  const tree = (x: number, y: number, s: number) => {
    shadow(x + 3, y, s * 1.9);
    const tw = Math.max(5, Math.round(s * 0.32)), th = Math.round(s * 1.0);
    px(x - tw / 2, y - th, '#7a4a24', tw, th); px(x - tw / 2, y - th, '#9a6a3a', 2, th); px(x + tw / 2 - 1, y - th, '#5a3418', 1, th);
    for (let i = 0; i < 3; i++) px(x - tw / 2 + 1, y - 4 - i * 5, '#5a3418', tw - 2, 1);
    const cyy = y - th - s * 0.7;
    for (let yy = -s; yy <= s * 0.9; yy++) for (let xx = -s; xx <= s; xx++) {
      const d = Math.hypot(xx, yy * 1.05);
      if (d > s) continue;
      let col = '#2f8a3a';
      if (d > s - 1.6) col = '#1d5a2a';
      else if (xx + yy < -s * 0.55) col = '#58b848';
      else if (xx + yy > s * 0.6) col = '#26702f';
      if (d < s - 1.6 && hash(x + xx, cyy + yy) > 0.9) col = (xx + yy < 0) ? '#6cc858' : '#2a7c34';
      px(x + xx, cyy + yy, col);
    }
    // Blattbüschel
    for (let i = 0; i < 6; i++) { const ax = x + r.int(-s + 4, s - 4), ay = cyy + r.int(-s + 4, s - 4); px(ax, ay, '#7ad868', 3, 1); px(ax + 1, ay + 1, '#3a9a42', 2, 1); }
  };
  const bush = (x: number, y: number, s: number) => {
    shadow(x, y + 1, s * 2);
    for (let yy = -s; yy <= s * 0.4; yy++) for (let xx = -s; xx <= s; xx++) {
      const d = Math.hypot(xx, yy * 1.3); if (d > s) continue;
      px(x + xx, y + yy, d > s - 1.4 ? '#1f5a2a' : (xx + yy < -s * 0.5 ? '#58b848' : hash(x + xx, y + yy) > 0.9 ? '#48a844' : '#2f8a3a'));
    }
  };

  // Teich
  const topBand = top - 2;
  const pondX = Math.round(W * 0.7), pondY = Math.round(topBand * 0.55), prx = 46, pry = 14;
  for (let y = -pry - 3; y <= pry + 3; y++) for (let x = -prx - 3; x <= prx + 3; x++) {
    const d = (x * x) / (prx * prx) + (y * y) / (pry * pry), d2 = (x * x) / ((prx + 3) * (prx + 3)) + (y * y) / ((pry + 3) * (pry + 3));
    if (d <= 1) px(pondX + x, pondY + y, d > 0.82 ? '#3870d8' : ((x + y * 2) % 13 === 0 ? '#9cc8ff' : (hash(x, y) > 0.9 ? '#78a8f8' : '#5890f0')));
    else if (d2 <= 1) px(pondX + x, pondY + y, '#e0d09c');
  }
  px(pondX - 22, pondY - 4, '#b8dcff', 9, 1); px(pondX + 10, pondY + 3, '#b8dcff', 8, 1);
  // Seerosenblatt
  px(pondX + 20, pondY - 2, '#3a9a42', 7, 3); px(pondX + 22, pondY - 3, '#58b848', 3, 1); px(pondX + 25, pondY - 2, '#f890b8', 2, 2);
  for (let i = 0; i < 5; i++) { const rx = pondX - prx + 6 + i * 4, ry = pondY + pry; px(rx, ry - 9, '#2f8a3a', 1, 9); px(rx + 1, ry - 12, '#58b848', 1, 12); px(rx - 1, ry - 7, '#58b848', 1, 7); }

  // Wald oben: zwei gestaffelte Reihen, Teich ausgespart
  const rowsY = [topBand + 4, topBand - 22, topBand - 46];
  rowsY.forEach((y, row) => {
    for (let x = -8 + (row % 2) * 22; x < W + 20; x += 44) {
      if (Math.abs(x - pondX) < prx + 20 && y > pondY - 32) continue;
      tree(x, y, 22 - row * 2);
    }
  });
  // Seitliche Baumreihen (außerhalb des Platzes)
  for (let y = top + 40; y < bot + 20; y += 74) { tree(-4, y, 20); tree(W + 4, y + 36, 20); }

  // Unten: Hecke + Zaun
  const fy = bot + LIP + 6;
  for (let x = -8; x < W + 12; x += 24) bush(x, H - 2, 15);
  for (let x = 8; x < W - 6; x += 34) { px(x, fy, '#eadaa8', 5, 17); px(x, fy, '#fff4d0', 5, 1); px(x + 4, fy + 1, '#a89868', 1, 16); }
  px(0, fy + 4, '#dccc9c', W, 3); px(0, fy + 7, '#a89868', W, 1); px(0, fy + 11, '#dccc9c', W, 3); px(0, fy + 14, '#a89868', W, 1);

  // Blumen & Felsen
  const flower = (x: number, y: number) => { const col = r.pick(['#ffffff', '#f8e060', '#f890b8', '#ff8060']); px(x, y - 2, col); px(x - 2, y, col); px(x + 2, y, col); px(x, y + 2, col); px(x - 1, y - 1, col, 3, 3); px(x, y, '#f8c830'); px(x + 1, y + 3, '#3a9a42'); };
  for (let i = 0; i < 70; i++) {
    const x = r.int(2, W - 3), y = r.int(topBand + 8, H - 24);
    if (rrDist(x, y) < 14 || rrDist(x, y - LIP) < 14) continue;
    flower(x, y);
  }
  for (let i = 0; i < 6; i++) {
    const x = r.int(10, W - 20), y = r.int(topBand + 16, H - 40);
    if (rrDist(x, y) < 20 || rrDist(x, y - LIP) < 20) continue;
    shadow(x + 6, y + 8, 18);
    px(x, y, '#8a8a92', 12, 8); px(x + 1, y - 1, '#a8a8b0', 9, 1); px(x, y + 7, '#62626a', 12, 1); px(x + 2, y + 1, '#c0c0c8', 4, 2); px(x + 3, y - 2, '#a8a8b0', 5, 1);
  }
  // Eckpfeiler mit Laterne
  for (const sx of [left + 6, right - 6]) for (const sy of [top + 8, bot - 4]) {
    shadow(sx + 2, sy + 2, 14);
    px(sx - 4, sy - 22, '#9a9aa4', 9, 24); px(sx - 4, sy - 22, '#c8c8d0', 9, 2); px(sx - 4, sy - 22, '#c8c8d0', 2, 24); px(sx + 3, sy - 20, '#6a6a74', 2, 22);
    px(sx - 3, sy - 26, '#f8e8a0', 7, 4); px(sx - 2, sy - 25, '#fff8d8', 5, 2); px(sx - 5, sy - 27, '#6a6a74', 11, 2);
  }

  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.5, W / 2, H / 2, Math.max(W, H) * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,30,10,0.22)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return c;
}

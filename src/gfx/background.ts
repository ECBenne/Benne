import { Rng } from '../core/util';
import { MAPS, MapDef, Feature } from '../data/maps';
import { TILT, WORLD, SCREEN_WORLD, X, Y, sc, unproject } from './world';

const hash = (x: number, y: number) => {
  let h = (Math.floor(x) * 374761393 + Math.floor(y) * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

// Platz (Bodenebene): gepflasterter, erhöhter Kampfplatz
export const COURT = { x0: 24, y0: 118, x1: 376, y1: 600, r: 28 };
const POND = { x: 308, y: 64, rx: 54, ry: 24 };
const LIP = 10; // Höhe der Vorderkante in Pixeln

const courtDist = (x: number, y: number) => {
  const cx = (COURT.x0 + COURT.x1) / 2, cy = (COURT.y0 + COURT.y1) / 2;
  const qx = Math.abs(x - cx) - ((COURT.x1 - COURT.x0) / 2 - COURT.r), qy = Math.abs(y - cy) - ((COURT.y1 - COURT.y0) / 2 - COURT.r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - COURT.r;
};

/** Weltkarte in echter Perspektive (Mode-7-artig für den Boden, aufrechte skalierte Objekte). */
export function buildBackground(map: MapDef = MAPS.meadow): HTMLCanvasElement {
  const W = SCREEN_WORLD.w, H = SCREEN_WORLD.h;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H), d = img.data;
  const r = new Rng(4321);

  const G = ['#62b042', '#6cbc48', '#74c64c'].map(hex), G2 = hex('#7ed056'), GS = hex('#68b846');
  const T1 = hex(map.theme.t1), T2 = hex(map.theme.t2), TL = hex(map.theme.hi), TD = hex(map.theme.lo), GR = hex(map.theme.grout), EDGE1 = hex('#f2e8c2'), EDGE2 = hex('#b8a36c');
  const W1 = hex('#b09a68'), W2 = hex('#a28c5c'), WG = hex('#7e6c40');
  const WA = hex('#3870d8'), WB = hex('#5890f0'), WC = hex('#9cc8ff'), SAND = hex('#e0d09c');

  for (let Yp = 0; Yp < H; Yp++) for (let Xp = 0; Xp < W; Xp++) {
    const { x, y } = unproject(Xp, Yp);
    const s = sc(y);
    let col: number[];
    const cd = courtDist(x, y);
    const pondD = ((x - POND.x) / POND.rx) ** 2 + ((y - POND.y) / POND.ry) ** 2;
    if (cd <= 0) {
      if (cd > -2.4) col = EDGE1;
      else if (cd > -5) col = EDGE2;
      else {
        const TW = 26;
        const gx = ((x % TW) + TW) % TW < 1 / s, gy = ((y % TW) + TW) % TW < 1 / (TILT * s);
        const tx = Math.floor(x / TW), ty = Math.floor(y / TW);
        col = (tx + ty) & 1 ? T1 : T2;
        const n = hash(Math.floor(x / 2), Math.floor(y / 2));
        if (n > 0.975) col = TL; else if (n < 0.02) col = TD;
        if (gx || gy) col = GR;
        // Gelände der Arena: Wasser, Lava, hohes Gras (mit Ufer-/Randstreifen)
        for (const f of map.features) {
          if (f.kind === 'rock') continue;
          const fd = Math.hypot(x - f.x, y - f.y);
          if (fd > f.r + 3) continue;
          const wob = hash(Math.floor(x / 3), Math.floor(y / 3));
          if (f.kind === 'water') {
            if (fd > f.r) col = [226, 212, 160];
            else if (fd > f.r - 3) col = [56, 112, 216];
            else col = ((x * 0.4 + y * 1.3) % 13) < 1.2 && wob > 0.35 ? [176, 214, 255] : wob > 0.92 ? [120, 168, 248] : [88, 144, 240];
          } else if (f.kind === 'lava') {
            if (fd > f.r) col = [70, 50, 44];
            else if (fd > f.r - 3) col = [150, 40, 20];
            else col = ((x * 0.5 - y * 1.1 + 400) % 15) < 1.6 && wob > 0.3 ? [255, 236, 150] : wob > 0.85 ? [255, 190, 70] : wob < 0.18 ? [200, 60, 24] : [240, 120, 32];
          } else {
            if (fd > f.r) continue;
            const blade = (Math.floor(x) + Math.floor(y / 2) * 2) % 4 === 0;
            col = fd > f.r - 2 ? [58, 128, 50] : blade ? [70, 150, 56] : wob > 0.8 ? [120, 200, 88] : [92, 176, 70];
          }
        }
      }
    } else if (pondD <= 1) {
      col = pondD > 0.8 ? WA : (((x * 0.35 + y * 1.1) % 12) < 1.1 && hash(x / 3, y / 3) > 0.4 ? WC : WB);
    } else if (pondD <= 1.18) {
      col = SAND;
    } else {
      // Wiese: Mähstreifen + Flecken, die mit der Perspektive mitwandern
      const coarse = hash(x / 26, y / 26), fine = hash(x / 5, y / 5);
      col = coarse > 0.72 ? G[0] : coarse > 0.3 ? G[1] : G[2];
      if (fine > 0.93) col = G2;
      if (Math.floor(y / 46) % 2 === 0) col = [col[0] - 4, col[1] - 6, col[2] - 4];
      // Vorderwand des Platzes
      const up = unproject(Xp, Yp - LIP);
      if (courtDist(up.x, up.y) <= 0) {
        let k = 1; while (k < LIP && courtDist(...(Object.values(unproject(Xp, Yp - k)) as [number, number])) > 0) k++;
        const brick = ((Xp >> 4) + Math.floor(k / 5)) & 1;
        col = (Xp % 16 === 0 || k % 5 === 0) ? WG : brick ? W1 : W2;
        const dk = 1 - (k / LIP) * 0.18; col = [col[0] * dk, col[1] * dk, col[2] * dk];
      } else {
        const up2 = unproject(Xp, Yp - LIP - 4);
        if (courtDist(up2.x, up2.y) <= 0) col = [col[0] * 0.78, col[1] * 0.82, col[2] * 0.78];
      }
    }
    const i = (Yp * W + Xp) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);

  const px = (x: number, y: number, col: string, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const P = (x: number, y: number): [number, number] => [X(x, y), Y(y)];

  // ── Platzmarkierungen (Pfade in der Bodenebene -> projiziert) ──
  const line = '#f8f0d4', lineS = '#bba874';
  const plot = (x: number, y: number) => { const [sx, sy] = P(x, y); px(sx, sy, line); px(sx, sy + 1, lineS); };
  const inset = 12;
  const rx0 = COURT.x0 + inset, rx1 = COURT.x1 - inset, ry0 = COURT.y0 + inset, ry1 = COURT.y1 - inset, rr = COURT.r - inset;
  const path = (f: (t: number) => [number, number], n: number) => { for (let i = 0; i <= n; i++) { const [x, y] = f(i / n); plot(x, y); } };
  path((t) => [rx0 + rr + t * (rx1 - rx0 - 2 * rr), ry0], 900); path((t) => [rx0 + rr + t * (rx1 - rx0 - 2 * rr), ry1], 900);
  path((t) => [rx0, ry0 + rr + t * (ry1 - ry0 - 2 * rr)], 900); path((t) => [rx1, ry0 + rr + t * (ry1 - ry0 - 2 * rr)], 900);
  for (const [cx, cy, a0] of [[rx0 + rr, ry0 + rr, Math.PI], [rx1 - rr, ry0 + rr, Math.PI * 1.5], [rx1 - rr, ry1 - rr, 0], [rx0 + rr, ry1 - rr, Math.PI * 0.5]] as [number, number, number][])
    path((t) => [cx + Math.cos(a0 + t * Math.PI / 2) * rr, cy + Math.sin(a0 + t * Math.PI / 2) * rr], 120);
  const midY = (COURT.y0 + COURT.y1) / 2, midX = (COURT.x0 + COURT.x1) / 2;
  path((t) => [rx0 + t * (rx1 - rx0), midY], 900);
  path((t) => [midX + Math.cos(t * Math.PI * 2) * 56, midY + Math.sin(t * Math.PI * 2) * 56], 500);
  path((t) => [midX + Math.cos(t * Math.PI * 2) * 6, midY + Math.sin(t * Math.PI * 2) * 6], 60);
  for (const yy of [ARENA_START(0), ARENA_START(1)]) path((t) => [midX - 34 + t * 68, yy], 140);

  // ── Aufrechte Objekte, nach Tiefe sortiert ──
  const shadow = (x: number, y: number, w: number) => { g.globalAlpha = 0.24; px(x - w / 2, y - 3, '#0c3a1c', w, 6); px(x - w / 2 - 3, y - 2, '#0c3a1c', w + 6, 4); g.globalAlpha = 1; };
  const tree = (wx: number, wy: number, size: number) => {
    const f = sc(wy), [x, y] = P(wx, wy), s = Math.round(size * f);
    shadow(x + 3, y, s * 1.9);
    const tw = Math.max(5, Math.round(s * 0.34)), th = Math.round(s * 1.05);
    px(x - tw / 2, y - th, '#7a4a24', tw, th); px(x - tw / 2, y - th, '#9a6a3a', 2, th); px(x + tw / 2 - 1, y - th, '#5a3418', 1, th);
    for (let i = 0; i < 3; i++) px(x - tw / 2 + 1, y - 4 - i * 5, '#5a3418', tw - 2, 1);
    const cyy = y - th - s * 0.7;
    for (let yy = -s; yy <= s * 0.9; yy++) for (let xx = -s; xx <= s; xx++) {
      const dd = Math.hypot(xx, yy * 1.05); if (dd > s) continue;
      let col = '#2f8a3a';
      if (dd > s - 1.6) col = '#1d5a2a'; else if (xx + yy < -s * 0.55) col = '#58b848'; else if (xx + yy > s * 0.6) col = '#26702f';
      if (dd < s - 1.6 && hash(x + xx, cyy + yy) > 0.9) col = (xx + yy < 0) ? '#6cc858' : '#2a7c34';
      px(x + xx, cyy + yy, col);
    }
    for (let i = 0; i < 6; i++) { const ax = x + r.int(-s + 4, s - 4), ay = cyy + r.int(-s + 4, s - 4); px(ax, ay, '#7ad868', 3, 1); px(ax + 1, ay + 1, '#3a9a42', 2, 1); }
  };
  const bush = (wx: number, wy: number, size: number) => {
    const f = sc(wy), [x, y] = P(wx, wy), s = Math.round(size * f);
    shadow(x, y + 1, s * 2);
    for (let yy = -s; yy <= s * 0.4; yy++) for (let xx = -s; xx <= s; xx++) {
      const dd = Math.hypot(xx, yy * 1.3); if (dd > s) continue;
      px(x + xx, y + yy, dd > s - 1.4 ? '#1f5a2a' : (xx + yy < -s * 0.5 ? '#58b848' : hash(x + xx, y + yy) > 0.9 ? '#48a844' : '#2f8a3a'));
    }
  };
  const pillar = (wx: number, wy: number) => {
    const f = sc(wy), [x, y] = P(wx, wy), w = Math.round(13 * f), h = Math.round(40 * f);
    shadow(x + 2, y + 2, w * 1.6);
    px(x - w / 2, y - h, '#9a9aa4', w, h); px(x - w / 2, y - h, '#c8c8d0', w, 2); px(x - w / 2, y - h, '#c8c8d0', 2, h); px(x + w / 2 - 2, y - h + 2, '#6a6a74', 2, h - 2);
    px(x - w / 2 + 2, y - h - Math.round(5 * f), '#f8e8a0', w - 4, Math.round(5 * f)); px(x - w / 2 + 3, y - h - Math.round(4 * f), '#fff8d8', w - 6, Math.max(1, Math.round(3 * f)));
    px(x - w / 2 - 2, y - h - Math.round(6 * f), '#6a6a74', w + 4, 2);
  };
  const rock = (wx: number, wy: number) => {
    const f = sc(wy), [x, y] = P(wx, wy), w = Math.round(22 * f), h = Math.round(14 * f);
    shadow(x, y + 2, w * 1.4);
    px(x - w / 2, y - h, '#8a8a92', w, h); px(x - w / 2 + 1, y - h - 1, '#a8a8b0', w - 3, 1); px(x - w / 2, y - 1, '#62626a', w, 1); px(x - w / 2 + 2, y - h + 1, '#c0c0c8', Math.round(w * 0.35), 2);
  };
  const flower = (wx: number, wy: number) => {
    const f = sc(wy), [x, y] = P(wx, wy), t = Math.max(2, Math.round(2.2 * f)), col = r.pick(['#ffffff', '#f8e060', '#f890b8', '#ff8060']);
    px(x, y - 2 * t, col, t, t); px(x - t, y - t, col, t, t); px(x + t, y - t, col, t, t); px(x, y, col, t, t); px(x, y - t, '#f8c830', t, t); px(x, y + t, '#3a9a42', 1, Math.max(2, t));
  };
  const tuft = (wx: number, wy: number) => { const f = sc(wy), [x, y] = P(wx, wy), t = Math.max(2, Math.round(2 * f)); px(x, y, '#4f9c36', t, t * 2); px(x + t * 2, y, '#4f9c36', t, t * 2); px(x + t, y - t, '#58a83a', t, t * 3); };
  const fencePost = (wx: number, wy: number) => { const f = sc(wy), [x, y] = P(wx, wy), w = Math.round(6 * f), h = Math.round(26 * f); px(x - w / 2, y - h, '#eadaa8', w, h); px(x - w / 2, y - h, '#fff4d0', w, 1); px(x + w / 2 - 1, y - h + 1, '#a89868', 1, h - 1); };

  type Obj = { y: number; f: () => void };
  const objs: Obj[] = [];
  const add = (y: number, f: () => void) => objs.push({ y, f });

  // Wald oben (3 Reihen), Teich ausgespart
  [18, 54, 90].forEach((wy, row) => {
    for (let wx = -10 + (row % 2) * 26; wx < WORLD.w + 30; wx += 52) {
      if (Math.abs(wx - POND.x) < POND.rx + 26 && wy > 20 && wy < 106) continue;
      add(wy, () => tree(wx, wy, 25 - row * 1.5));
    }
  });
  // Seitenbäume
  for (let wy = 150; wy < WORLD.h; wy += 96) { add(wy, () => tree(-8, wy, 24)); add(wy + 48, () => tree(WORLD.w + 8, wy + 48, 24)); }
  // Schilf am Teich
  for (let i = 0; i < 7; i++) add(POND.y + POND.ry + 2, () => { const [x, y] = P(POND.x - POND.rx + 10 + i * 5, POND.y + POND.ry + 2); const h = Math.round(12 * sc(POND.y)); px(x, y - h, '#2f8a3a', 1, h); px(x + 1, y - h - 3, '#58b848', 1, h + 3); });
  // Eckpfeiler
  for (const [wx, wy] of [[COURT.x0 + 8, COURT.y0 + 10], [COURT.x1 - 8, COURT.y0 + 10], [COURT.x0 + 8, COURT.y1 - 6], [COURT.x1 - 8, COURT.y1 - 6]]) add(wy, () => pillar(wx, wy));
  // Streuobjekte auf der Wiese
  const free = (x: number, y: number, m: number) => courtDist(x, y) > m && ((x - POND.x) / (POND.rx + 10)) ** 2 + ((y - POND.y) / (POND.ry + 10)) ** 2 > 1 && y > 112;
  for (let i = 0; i < 220; i++) { const x = r.range(0, WORLD.w), y = r.range(100, WORLD.h - 6); if (free(x, y, 6)) { const k = r.next(); add(y, () => (k < 0.55 ? tuft(x, y) : flower(x, y))); } }
  for (let i = 0; i < 40; i++) { const x = r.range(2, WORLD.w - 2), y = r.range(112, WORLD.h - 10); if (free(x, y, 12) && !(y > COURT.y1 + 10)) add(y, () => rock(x, y)); }
  // Unten: Zaun + Hecke
  const FY = COURT.y1 + 22;
  for (let wx = -10; wx < WORLD.w + 40; wx += 40) add(FY, () => fencePost(wx, FY));
  add(FY - 0.01, () => { for (const hh of [9, 18]) { const f = sc(FY), [x0, y0] = P(-30, FY), [x1] = P(WORLD.w + 30, FY); px(x0, y0 - hh * f - 2, '#dccc9c', x1 - x0, 3); px(x0, y0 - hh * f + 1, '#a89868', x1 - x0, 1); } });
  for (let wx = -10; wx < WORLD.w + 30; wx += 28) add(WORLD.h - 4, () => bush(wx, WORLD.h - 4, 17));

  objs.sort((a, b) => a.y - b.y).forEach((o) => o.f());

  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.5, W / 2, H / 2, Math.max(W, H) * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,30,10,0.2)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return c;
}

function ARENA_START(side: 0 | 1) { return COURT.y0 + (COURT.y1 - COURT.y0) * (side === 0 ? 0.24 : 0.76); }

/** Felsen als eigenes Bild (wird im Kampf nach Tiefe sortiert gezeichnet, damit Monster dahinter verdeckt sind). */
export function rockSprite(f: Feature, mossy = false): { c: HTMLCanvasElement; ax: number; ay: number } {
  const k = sc(f.y), rw = Math.round(f.r * k), w = rw * 2 + 6, hgt = Math.round(f.r * 1.7 * k) + 6;
  const c = document.createElement('canvas'); c.width = w; c.height = hgt + Math.round(rw * TILT);
  const g = c.getContext('2d')!; const cx = w / 2, base = hgt;
  const px = (x: number, y: number, col: string) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  for (let y = 0; y < c.height; y++) for (let x = 0; x < w; x++) {
    const dx = (x - cx) / rw;
    if (Math.abs(dx) > 1) continue;
    const foot = base + Math.sqrt(1 - dx * dx) * rw * TILT * 0.9;                 // Standfläche (vorn rund)
    const top = base - (hgt - 4) * Math.pow(1 - dx * dx, 0.55) + hash(x >> 2, 3) * 3; // unregelmäßige Kuppe
    if (y < top || y > foot) continue;
    const edge = y < top + 1.5 || y > foot - 1.2 || Math.abs(dx) > 0.93;
    const light = dx < -0.25 && y < base - hgt * 0.3, dark = dx > 0.35 || y > base - 2;
    const n = hash(x >> 1, y >> 1);
    let col = edge ? '#3c3c46' : light ? (n > 0.8 ? '#d0d0d8' : '#b4b4be') : dark ? (n > 0.85 ? '#6a6a74' : '#5c5c68') : n > 0.9 ? '#a0a0aa' : '#8a8a94';
    if (mossy && !edge && y < top + hgt * 0.35 && n > 0.25) col = n > 0.7 ? '#78c058' : '#4f9c3a';
    px(x, y, col);
  }
  // Risse
  g.fillStyle = '#4a4a54'; g.fillRect(Math.round(cx - rw * 0.2), Math.round(base - hgt * 0.55), 1, Math.round(hgt * 0.3)); g.fillRect(Math.round(cx + rw * 0.3), Math.round(base - hgt * 0.4), 1, Math.round(hgt * 0.2));
  return { c, ax: w / 2, ay: base };
}

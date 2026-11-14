/**
 * Sprite-System: Spritesheet mit 8 Blickrichtungen (Zeilen) x N Laufbildern (Spalten).
 * Zeilen-Reihenfolge: 0=S (zur Kamera), 1=SE, 2=E, 3=NE, 4=N (weg), 5=NW, 6=W, 7=SW.
 * Pro Bild ist eine Weiß-Silhouette (Treffer-Blitz) vorgerendert. Gezeichnet wird immer 1:1 (keine Verzerrung).
 */
export interface Frame { n: HTMLCanvasElement; wn: HTMLCanvasElement }
export interface SheetMeta { cw: number; ch: number; ax: number; ay: number; rows: number; cols: number }
export interface Sprite {
  w: number; h: number;          // Zellgröße
  ax: number; ay: number;        // Ankerpunkt (Füße) in der Zelle
  dirs: number; cols: number;
  frames: Frame[][];             // [Richtung][Laufbild]
  shadow: { w: number; dx: number }[];   // Schattenbreite/-versatz je Richtung (aus den Füßen berechnet)
}

const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

export function spriteFromSheet(img: HTMLImageElement, m: SheetMeta): Sprite {
  const frames: Frame[][] = [];
  for (let r = 0; r < m.rows; r++) {
    const row: Frame[] = [];
    for (let c = 0; c < m.cols; c++) {
      const n = canvas(m.cw, m.ch); n.getContext('2d')!.drawImage(img, c * m.cw, r * m.ch, m.cw, m.ch, 0, 0, m.cw, m.ch);
      const wn = canvas(m.cw, m.ch); const g = wn.getContext('2d')!;
      g.drawImage(n, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, m.cw, m.ch);
      row.push({ n, wn });
    }
    frames.push(row);
  }
  // Schatten: Breite der Standfläche (untere Pixelreihen) je Richtung, über alle Laufbilder gemittelt
  const shadow = frames.map((row) => {
    let w = 0, cx = 0, n = 0;
    for (const f of row) {
      const d = f.n.getContext('2d')!.getImageData(0, Math.max(0, m.ay - 7), m.cw, 8).data;
      let x0 = m.cw, x1 = -1;
      for (let y = 0; y < 8; y++) for (let x = 0; x < m.cw; x++) if (d[(y * m.cw + x) * 4 + 3] > 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
      if (x1 >= x0) { w += x1 - x0 + 1; cx += (x0 + x1) / 2 - m.ax; n++; }
    }
    return { w: Math.round(((n ? w / n : 20) + 8)), dx: Math.round(n ? cx / n : 0) };
  });
  return { w: m.cw, h: m.ch, ax: m.ax, ay: m.ay, dirs: m.rows, cols: m.cols, frames, shadow };
}

/** Blickwinkel (rad, y nach unten) -> Richtungsindex 0..7 */
export function dirFromAngle(a: number): number {
  const deg = (a * 180) / Math.PI;
  return ((Math.round((90 - deg) / 45) % 8) + 8) % 8;
}
export function dirCenterDeg(i: number) { return 90 - 45 * i; }

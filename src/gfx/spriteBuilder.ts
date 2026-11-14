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
  return { w: m.cw, h: m.ch, ax: m.ax, ay: m.ay, dirs: m.rows, cols: m.cols, frames };
}

/** Blickwinkel (rad, y nach unten) -> Richtungsindex 0..7 */
export function dirFromAngle(a: number): number {
  const deg = (a * 180) / Math.PI;
  return ((Math.round((90 - deg) / 45) % 8) + 8) % 8;
}
export function dirCenterDeg(i: number) { return 90 - 45 * i; }

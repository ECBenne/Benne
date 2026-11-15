/**
 * Kleine Piktogramme für die Kampfsteuerung (16×16, mit Kontur), damit keine großen Textknöpfe nötig sind.
 * Werden als Canvas gezeichnet und per CSS pixelig vergrößert.
 */
type Draw = (g: CanvasRenderingContext2D) => void;
const OUT = '#2b2030';
const poly = (g: CanvasRenderingContext2D, pts: [number, number][], fill: string, stroke = OUT) => {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  g.fillStyle = fill; g.fill(); g.lineWidth = 1; g.strokeStyle = stroke; g.stroke();
};
const circ = (g: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke = OUT) => { g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fillStyle = fill; g.fill(); g.lineWidth = 1; g.strokeStyle = stroke; g.stroke(); };

const G: Record<string, Draw> = {
  // Taktik: Angriff (Schwert), Ausgewogen (Waage), Konter (Rückpfeil), Defensiv (Schild)
  attack: (g) => { poly(g, [[13, 1.5], [14.5, 3], [7, 10.5], [5.5, 9]], '#ff7060'); poly(g, [[4, 8], [8, 12], [6.5, 13.5], [2.5, 9.5]], '#f8d030'); poly(g, [[2.5, 10], [5, 12.5], [2.5, 14.5], [1, 13]], '#b0703c'); },
  balanced: (g) => { poly(g, [[8, 1.5], [14, 8], [8, 14.5], [2, 8]], '#9ad8ff'); circ(g, 8, 8, 2.4, '#ffffff'); },
  counter: (g) => { g.lineWidth = 2.4; g.strokeStyle = OUT; g.beginPath(); g.arc(8.5, 8.5, 4.6, -1.2, 3.6, true); g.stroke(); g.lineWidth = 1.2; g.strokeStyle = '#a8c8ff'; g.beginPath(); g.arc(8.5, 8.5, 4.6, -1.2, 3.6, true); g.stroke(); poly(g, [[1.5, 6.5], [7, 5.5], [3.5, 11]], '#a8c8ff'); },
  defend: (g) => { poly(g, [[8, 1.5], [14, 3.5], [13, 10], [8, 14.5], [3, 10], [2, 3.5]], '#78b0ff'); poly(g, [[8, 4], [11.5, 5], [10.8, 9], [8, 11.8]], '#d8ecff', '#d8ecff'); },
  // Befehle: Spezial (Stern), Schild (Blase), Anfeuern (Pfeil nach oben mit Funken)
  special: (g) => { const pts: [number, number][] = []; for (let i = 0; i < 10; i++) { const a = -1.5708 + (i * Math.PI) / 5, r = i % 2 ? 3.4 : 7.4; pts.push([8 + Math.cos(a) * r, 8.4 + Math.sin(a) * r]); } poly(g, pts, '#ffd040'); circ(g, 8, 8.4, 1.8, '#fff6c0', '#fff6c0'); },
  shield: (g) => { circ(g, 8, 8, 6.4, '#8cdcff'); circ(g, 8, 8, 4.2, '#d8f4ff', '#d8f4ff'); g.fillStyle = '#ffffff'; g.fillRect(5, 5, 2, 2); },
  buff: (g) => { poly(g, [[8, 1.5], [13, 8], [10, 8], [10, 14], [6, 14], [6, 8], [3, 8]], '#ff9a68'); g.fillStyle = '#ffe0c0'; g.fillRect(7, 5, 2, 2); },
};

/** Piktogramm als Canvas (CSS-Größe `px`). */
export function glyph(name: string, px = 28): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = 16; c.height = 16; c.className = 'glyph';
  c.style.width = px + 'px'; c.style.height = px + 'px';
  const g = c.getContext('2d')!; g.imageSmoothingEnabled = false; G[name]?.(g); return c;
}

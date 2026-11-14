/**
 * Sprite-System: Original-Diamant/Perl-Frontsprites (Fan-Projekt), beschnitten und eingebettet.
 * Pro Sprite werden Spiegelung und Weiß-Silhouette (Treffer-Blitz) vorgerendert.
 * Animation (Hüpfen, Anspannen, Ausweichen, Fallen) erzeugt der Renderer prozedural.
 */
export interface Frame { n: HTMLCanvasElement; f: HTMLCanvasElement; wn: HTMLCanvasElement; wf: HTMLCanvasElement }
export interface Sprite { w: number; h: number; ax: number; ay: number; frames: Record<string, Frame> }

const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

export function spriteFromImage(img: HTMLImageElement): Sprite {
  const w = img.naturalWidth, h = img.naturalHeight;
  const n = canvas(w, h); n.getContext('2d')!.drawImage(img, 0, 0);
  const wn = canvas(w, h); const wc = wn.getContext('2d')!;
  wc.drawImage(n, 0, 0); wc.globalCompositeOperation = 'source-in'; wc.fillStyle = '#fff'; wc.fillRect(0, 0, w, h);
  const flip = (s: HTMLCanvasElement) => { const f = canvas(w, h); const c = f.getContext('2d')!; c.translate(w, 0); c.scale(-1, 1); c.drawImage(s, 0, 0); return f; };
  const fr: Frame = { n, f: flip(n), wn, wf: flip(wn) };
  // alle Animationszustände teilen sich das Bild; Bewegung kommt vom Renderer
  return { w, h, ax: Math.round(w / 2), ay: h, frames: { idle0: fr, idle1: fr, walk0: fr, walk1: fr, atk: fr } };
}

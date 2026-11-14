/**
 * Sprite-System: Original-Diamant/Perl-Sprites (Vorder- UND Rückansicht, Fan-Projekt).
 * Aus jedem Bild werden prozedural Animationsposen erzeugt (pixelgenau, ohne Unschärfe):
 *   idle, walk0/walk1 (Schritt: Fuß hebt sich, Körper neigt sich), crouch (Anspannen), lunge (Zuschlagen)
 * Pro Pose sind Spiegelung und Weiß-Silhouette (Treffer-Blitz) vorgerendert.
 */
export interface Frame { n: HTMLCanvasElement; f: HTMLCanvasElement; wn: HTMLCanvasElement; wf: HTMLCanvasElement }
export type Pose = 'idle' | 'walk0' | 'walk1' | 'crouch' | 'lunge';
export interface Sprite {
  w: number; h: number;                                  // Vorderansicht (für UI/Schatten)
  front: Record<Pose, Frame>; back: Record<Pose, Frame>;
  frames: Record<string, Frame>;                         // Kompatibilität: Vorderansicht (idle0, walk1 …)
}

const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const PAD = 4;  // unterer Rand unter den Füßen (Anker)

function frameOf(c: HTMLCanvasElement): Frame {
  const wn = canvas(c.width, c.height); const wc = wn.getContext('2d')!;
  wc.drawImage(c, 0, 0); wc.globalCompositeOperation = 'source-in'; wc.fillStyle = '#fff'; wc.fillRect(0, 0, c.width, c.height);
  const flip = (s: HTMLCanvasElement) => { const f = canvas(s.width, s.height); const g = f.getContext('2d')!; g.translate(s.width, 0); g.scale(-1, 1); g.drawImage(s, 0, 0); return f; };
  return { n: c, f: flip(c), wn, wf: flip(wn) };
}

/** Originalbild unverändert (kein Skalieren, Scheren oder Drehen – Pixelart bleibt scharf). */
function plain(img: HTMLImageElement): HTMLCanvasElement {
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = canvas(w, h + PAD); c.getContext('2d')!.drawImage(img, 0, 0);   // PAD Pixel Luft unten (Anker = Füße)
  return c;
}

function buildView(img: HTMLImageElement): Record<Pose, Frame> {
  const f = frameOf(plain(img));
  return { idle: f, walk0: f, walk1: f, crouch: f, lunge: f };
}

export function spriteFromImages(front: HTMLImageElement, back: HTMLImageElement): Sprite {
  const f = buildView(front), b = buildView(back);
  return { w: front.naturalWidth, h: front.naturalHeight, front: f, back: b, frames: { idle0: f.idle, idle1: f.idle, walk0: f.walk0, walk1: f.walk1, atk: f.crouch } };
}

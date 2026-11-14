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
const PAD = 4;

function frameOf(c: HTMLCanvasElement): Frame {
  const wn = canvas(c.width, c.height); const wc = wn.getContext('2d')!;
  wc.drawImage(c, 0, 0); wc.globalCompositeOperation = 'source-in'; wc.fillStyle = '#fff'; wc.fillRect(0, 0, c.width, c.height);
  const flip = (s: HTMLCanvasElement) => { const f = canvas(s.width, s.height); const g = f.getContext('2d')!; g.translate(s.width, 0); g.scale(-1, 1); g.drawImage(s, 0, 0); return f; };
  return { n: c, f: flip(c), wn, wf: flip(wn) };
}

interface Opt { sx?: number; sy?: number; lean?: number; liftL?: number; liftR?: number }

/** Erzeugt eine Pose: Skalierung (Anspannen/Strecken, unten verankert), Neigung per Zeilenversatz, Fußheben. */
function pose(img: HTMLImageElement, o: Opt): HTMLCanvasElement {
  const w = img.naturalWidth, h = img.naturalHeight;
  const tw = Math.round(w * (o.sx ?? 1)), th = Math.round(h * (o.sy ?? 1));
  const W = w + PAD * 2 + 4, H = h + PAD * 2;
  // 1. skaliert, unten mittig verankert
  const a = canvas(W, H); const ag = a.getContext('2d')!; ag.imageSmoothingEnabled = false;
  ag.drawImage(img, 0, 0, w, h, Math.round((W - tw) / 2), H - PAD - th, tw, th);
  if (!o.lean && !o.liftL && !o.liftR) return a;
  // 2. Neigung (Zeilenversatz, oben mehr) + Füße einzeln anheben
  const out = canvas(W, H); const g = out.getContext('2d')!; g.imageSmoothingEnabled = false;
  const top = H - PAD - th, feetFrom = H - PAD - Math.round(th * 0.24);
  for (let y = top; y < H - PAD; y++) {
    const k = 1 - (y - top) / th;                       // 1 oben … 0 unten
    const dx = Math.round((o.lean ?? 0) * k * 1.6);
    if (y >= feetFrom) {
      g.drawImage(a, 0, y, W / 2, 1, dx, y - (o.liftL ?? 0), W / 2, 1);
      g.drawImage(a, W / 2, y, W / 2, 1, W / 2 + dx, y - (o.liftR ?? 0), W / 2, 1);
    } else g.drawImage(a, 0, y, W, 1, dx, y, W, 1);
  }
  return out;
}

function buildView(img: HTMLImageElement): Record<Pose, Frame> {
  return {
    idle: frameOf(pose(img, {})),
    walk0: frameOf(pose(img, { lean: 1, liftL: 2 })),
    walk1: frameOf(pose(img, { lean: -1, liftR: 2 })),
    crouch: frameOf(pose(img, { sy: 0.9 })),
    lunge: frameOf(pose(img, { sy: 1.08, lean: 1 })),
  };
}

export function spriteFromImages(front: HTMLImageElement, back: HTMLImageElement): Sprite {
  const f = buildView(front), b = buildView(back);
  return { w: front.naturalWidth, h: front.naturalHeight, front: f, back: b, frames: { idle0: f.idle, idle1: f.idle, walk0: f.walk0, walk1: f.walk1, atk: f.crouch } };
}

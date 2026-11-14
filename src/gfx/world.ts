/**
 * Echte Perspektive: Die Bodenebene (x,y) wird mit Fluchtpunkt auf den Bildschirm projiziert.
 *  - hinten (kleines y) ist alles schmaler und kleiner, vorne (großes y) breiter und größer
 *  - TILT staucht zusätzlich die Tiefe (flacher Blickwinkel)
 *  - Objekte und Sprites stehen aufrecht und skalieren mit der Tiefe
 */
export const TILT = 0.72;
export const WORLD = { w: 340, h: 560 };                 // Bodenebene (Spielkoordinaten)
export const S_FAR = 0.7, S_NEAR = 1.16;                 // Maßstab am hinteren / vorderen Rand
const H = WORLD.h;

export const sc = (y: number) => S_FAR + (S_NEAR - S_FAR) * (y / H);                  // Maßstab in Tiefe y
export const Y = (y: number) => TILT * (S_FAR * y + ((S_NEAR - S_FAR) * y * y) / (2 * H));
export const SCREEN_WORLD = { w: Math.round(WORLD.w * S_NEAR), h: Math.round(Y(H)) };
export const X = (x: number, y: number) => SCREEN_WORLD.w / 2 + (x - WORLD.w / 2) * sc(y);

/** Bildschirm (Weltbild-Koordinaten) -> Bodenebene (Umkehrung der Projektion). */
export function unproject(sx: number, sy: number) {
  const a = (TILT * (S_NEAR - S_FAR)) / (2 * H), b = TILT * S_FAR;
  const y = (-b + Math.sqrt(b * b + 4 * a * Math.max(0, sy))) / (2 * a);
  return { x: WORLD.w / 2 + (sx - SCREEN_WORLD.w / 2) / sc(y), y };
}

/** Sprite-/Objektgröße relativ zur Mitte der Arena (1.0 = Originalpixel). */
export const SPR = (y: number) => sc(y) / sc(300);

/** Sichtfenster (logische Pixel) – passt sich dem Gerät an. */
export const view = { w: 234, h: 294 };

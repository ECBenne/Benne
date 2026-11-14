/** Geneigte Ansicht (3/4-Perspektive): Die Bodenebene wird in Y gestaucht, Sprites stehen aufrecht. */
export const TILT = 0.7;
export const WORLD = { w: 340, h: 520 };                       // Bodenebene (Spielkoordinaten)
export const Y = (y: number) => y * TILT;                       // Bodenebene -> Bildschirm
export const SCREEN_WORLD = { w: WORLD.w, h: Math.round(WORLD.h * TILT) };

/** Sichtfenster (logische Pixel) – passt sich dem Gerät an. */
export const view = { w: 234, h: 294 };

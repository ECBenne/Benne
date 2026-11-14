import type { ArtDef, Layer } from './spriteBuilder';

/** Alle Sprites blicken nach RECHTS. Raster 28x28, Outline wird automatisch ergänzt. */

// ───────────────────────── PIKACHU ─────────────────────────
const P_HEAD: string[] = [
  '..KK.....KK.....',
  '..KK.....KK.....',
  '..YY.....YY.....',
  '..YYY....YYY....',
  '..YYYY..YYYY....',
  '.YYYYYYYYYYYY...',
  'YYYYYYYYYYYYYY..',
  'YYYYYYYYYYYYYYY.',
  'YYYYYYYYYYwKYYY.',
  'YYYYYYYYYYKKYYK.',
  'YYYYYYYYYYKKYYY.',
  'YYYYYYYYYrrrYYY.',
  'YYYYYYYYYrrrYYY.',
  '.YYYYYYYYYYYYY..',
  '..YYYYYYYYYYY...',
];
const P_HEAD_OPEN: string[] = [
  ...P_HEAD.slice(0, 12),
  'YYYYYYYYYrrrYKK.',
  '.YYYYYYYYYKppK..',
  '..YYYYYYYYKKK...',
];
const P_BODY: string[] = [
  '..YYYYYYYYYY..',
  '.nYYYYYYYYYYY.',
  'nnYYYYYYYYYYyY',
  'YYYYYYYYYYYyyY',
  'nYYYYYYYYYYYYY',
  'YYYYYYYYYYYYY.',
  '.YYYYYYYYYYYY.',
  '..YYYYYYYYYY..',
];
const P_TAIL_A: string[] = [
  '.....YYYY',
  '.....YYY.',
  '....YYY..',
  '..YYYYYY.',
  '....YYYY.',
  '.....YY..',
  '....YY...',
  '...YYn...',
  '...nnn...',
  '....nn...',
];
const P_TAIL_B: string[] = [
  '....YYYYY',
  '....YYY..',
  '...YYY...',
  '.YYYYYY..',
  '...YYYY..',
  '....YY...',
  '...YY....',
  '..YYn....',
  '..nnn....',
  '...nn....',
];
const P_FEET_STAND: string[] = [
  '..YYYY....YYYYY',
  '.YYYYY....YYYYY',
];
const P_FEET_W0: string[] = [
  '.YYYY.......YYY',
  '.........YYYYYY',
];
const P_FEET_W1: string[] = [
  '..YYYYY.....YY.',
  '..YYYYY...YYYYY',
];

const pikaFrame = (head: string[], tail: string[], feet: string[], dy = 0): Layer[] => [
  { rows: tail, x: 0, y: 12 + dy },
  { rows: P_BODY, x: 5, y: 16 + dy },
  { rows: feet, x: 6, y: 24 + dy },
  { rows: head, x: 9, y: 2 + dy },
];

export const PIKACHU_ART: ArtDef = {
  w: 28, h: 29, anchor: { x: 14, y: 29 },
  palette: {
    Y: '#f8d838', y: '#d8a820', K: '#2b2030', r: '#e84838', w: '#ffffff', n: '#a8661c', p: '#e85868',
  },
  shade: { Y: 'y' },
  outline: '#2b2030',
  frames: {
    idle0: pikaFrame(P_HEAD, P_TAIL_A, P_FEET_STAND),
    idle1: pikaFrame(P_HEAD, P_TAIL_B, P_FEET_STAND, 0),
    walk0: pikaFrame(P_HEAD, P_TAIL_B, P_FEET_W0, -1),
    walk1: pikaFrame(P_HEAD, P_TAIL_A, P_FEET_W1, 0),
    atk: pikaFrame(P_HEAD_OPEN, P_TAIL_B, P_FEET_W1, 0),
  },
};

// ───────────────────────── GLUMANDA ─────────────────────────
const C_HEAD: string[] = [
  '...OOOOOOOO.....',
  '..OOOOOOOOOOO...',
  '.OOOOOOOOOOOOO..',
  '.OOOOOOOOOOwKOO.',
  'OOOOOOOOOOOKKOOO',
  'OOOOOOOOOOOKKOOO',
  'OOOOOOOOOOOOOOOK',
  '.OOOOOOOOOOOOOOO',
  '.oOOOOOOOOOOOOK.',
  '..oooOOOOOOOOO..',
];
const C_HEAD_OPEN: string[] = [
  ...C_HEAD.slice(0, 7),
  '.OOOOOOOOOOOOKpK',
  '.oOOOOOOOOOOKppK',
  '..oooOOOOOOKKKK.',
];
const C_BODY: string[] = [
  '..OOOOOOOOOO..',
  '.OOOOOOOOCCCO.',
  'OOOOOOOOOCCCCO',
  'OOOOOOOOOCCCCO',
  'OOOOOOOOCCCCCO',
  'OOOOOOOOCCCCCO',
  '.OOOOOOOCCCCO.',
  '.OOOOOOOOCCCo.',
  '..OOOOOOOOoo..',
];
// Schwanz: endet bei (tipX,tipY) -> dort wird die Flamme animiert gezeichnet
const C_TAIL_A: string[] = [
  '....OO..',
  '...OOO..',
  '..OOO...',
  '..OOO...',
  '.OOOOO..',
  'OOOOOO..',
  '.OOOO...',
];
const C_TAIL_B: string[] = [
  '.....OO.',
  '....OOO.',
  '...OOO..',
  '..OOO...',
  '.OOOOO..',
  'OOOOOO..',
  '.OOOO...',
];
const C_FEET_STAND: string[] = [
  '..OOOO....OOOOO',
  '..OOOO....OOOOO',
  '.CCCCC....CCCCC',
];
const C_FEET_W0: string[] = [
  '.OOOO.......OOO',
  '.OOOO.......OOO',
  '.CCCC......CCCC',
];
const C_FEET_W1: string[] = [
  '..OOOOO.....OO.',
  '..OOOOO...OOOOO',
  '..CCCCC...CCCCC',
];
const charFrame = (head: string[], tail: string[], feet: string[], dy = 0): Layer[] => [
  { rows: tail, x: 0, y: 15 + dy },
  { rows: C_BODY, x: 5, y: 17 + dy },
  { rows: feet, x: 6, y: 26 + dy },
  { rows: head, x: 9, y: 7 + dy },
];

export const CHARMANDER_ART: ArtDef = {
  w: 28, h: 29, anchor: { x: 14, y: 29 },
  palette: {
    O: '#f08030', o: '#c85820', C: '#f8d890', c: '#d8b068', K: '#2b2030', w: '#ffffff', p: '#e85868',
  },
  shade: { O: 'o', C: 'c' },
  outline: '#2b2030',
  frames: {
    idle0: charFrame(C_HEAD, C_TAIL_A, C_FEET_STAND),
    idle1: charFrame(C_HEAD, C_TAIL_B, C_FEET_STAND),
    walk0: charFrame(C_HEAD, C_TAIL_B, C_FEET_W0, -1),
    walk1: charFrame(C_HEAD, C_TAIL_A, C_FEET_W1, 0),
    atk: charFrame(C_HEAD_OPEN, C_TAIL_B, C_FEET_W1, 0),
  },
};
/** Flammenspitze am Schwanz (Pixel im ArtDef-Raster, ohne Outline-Padding) */
export const CHARMANDER_FLAME = { x: 5, y: 13 };

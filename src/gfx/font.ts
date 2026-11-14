/** Eigene 3x5-Pixelschrift (alles GROSS, mit Umlauten) – skaliert ganzzahlig, immer scharf. */
const G: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111',
  '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001',
  '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110',
  '.': '000000000000010', ',': '000000000010100', '!': '010010010000010', '?': '110001010000010', '%': '101001010100101',
  '/': '001001010100100', '-': '000000111000000', ':': '000010000010000', '+': '000010111010000', ' ': '000000000000000',
  "'": '010010000000000', '*': '000101010101000', 'x': '000101010101000',
};
const UMLAUT: Record<string, string> = { 'Ä': 'A', 'Ö': 'O', 'Ü': 'U' };

export function textWidth(s: string, scale = 1) {
  return Math.max(0, s.length * 4 - 1) * scale;
}

export function drawText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, scale = 1, shadow?: string) {
  s = s.toUpperCase().replace(/ß/g, 'SS');
  const pass = (ox: number, oy: number, col: string) => {
    ctx.fillStyle = col;
    let cx = x + ox;
    for (const ch of s) {
      const uml = UMLAUT[ch];
      const g = G[uml ?? ch] ?? G['?'];
      for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(cx + (i % 3) * scale, y + oy + Math.floor(i / 3) * scale, scale, scale);
      if (uml) { ctx.fillRect(cx, y + oy - 2 * scale, scale, scale); ctx.fillRect(cx + 2 * scale, y + oy - 2 * scale, scale, scale); }
      cx += 4 * scale;
    }
  };
  if (shadow) pass(scale, scale, shadow);
  pass(0, 0, color);
}

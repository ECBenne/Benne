import { Game } from './game';
import { loadSprites } from './gfx/sprites';

const screen = document.getElementById('screen') as HTMLCanvasElement;
loadSprites().then(() => {
  const game = new Game(screen);
  (window as any).__game = game; // Debug/Tests
  document.getElementById('boot')?.remove();
}).catch((e) => { const b = document.getElementById('boot'); if (b) b.innerHTML = '<b>FEHLER</b><span>' + String(e?.message ?? e) + '</span>'; });

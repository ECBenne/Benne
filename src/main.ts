import { Game } from './game';
import { loadSprites } from './gfx/sprites';
import { Mon, Trainer } from './battle/mon';
import * as League from './league';
import * as State from './state';
import * as Live from './systems/live';
import { incomingEta } from './battle/ai';

const screen = document.getElementById('screen') as HTMLCanvasElement;
loadSprites().then(() => {
  const game = new Game(screen);
  (window as any).__game = game; // Debug/Tests
  (window as any).__lib = { Mon, Trainer, League, State, Live, eta: incomingEta };
  document.getElementById('boot')?.remove();
}).catch((e) => { const b = document.getElementById('boot'); if (b) b.innerHTML = '<b>FEHLER</b><span>' + String(e?.message ?? e) + '</span>'; });

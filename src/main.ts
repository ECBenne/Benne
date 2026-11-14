import { Game } from './game';
import { loadSprites } from './gfx/sprites';

const screen = document.getElementById('screen') as HTMLCanvasElement;
loadSprites().then(() => {
  const game = new Game(screen);
  (window as any).__game = game; // Debug/Tests
});

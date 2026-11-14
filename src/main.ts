import { Game } from './game';

const screen = document.getElementById('screen') as HTMLCanvasElement;
const game = new Game(screen);
(window as any).__game = game; // Debug/Tests

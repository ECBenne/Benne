import { loadSprites, getSprite } from './gfx/sprites';
loadSprites().then(() => {
  const c = document.getElementById('c') as HTMLCanvasElement, g = c.getContext('2d')!; g.imageSmoothingEnabled = false;
  const sp = getSprite((window as any).SP);
  const poses = ['idle', 'walk0', 'walk1', 'crouch', 'lunge'] as const;
  [sp.front, sp.back].forEach((v, row) => poses.forEach((p, i) => g.drawImage(v[p].n, 4 + i * 50, 3 + row * 50)));
});

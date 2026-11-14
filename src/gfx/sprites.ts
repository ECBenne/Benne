import { spriteFromImage, Sprite } from './spriteBuilder';
import pikachu from './img/pikachu.png';
import charmander from './img/charmander.png';
import squirtle from './img/squirtle.png';

const SRC: Record<string, string> = { pikachu, charmander, squirtle };
const cache: Record<string, Sprite> = {};

/** Muss vor dem Spielstart einmal abgewartet werden. */
export function loadSprites(): Promise<void> {
  return Promise.all(Object.entries(SRC).map(([id, url]) => new Promise<void>((res, rej) => {
    const img = new Image();
    img.onload = () => { cache[id] = spriteFromImage(img); res(); };
    img.onerror = () => rej(new Error('Sprite fehlt: ' + id));
    img.src = url;
  }))).then(() => undefined);
}

export function getSprite(id: string): Sprite { return cache[id]; }

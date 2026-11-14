import { spriteFromImages, Sprite } from './spriteBuilder';
import pikachu from './img/pikachu.png';
import pikachuB from './img/pikachu_b.png';
import charmander from './img/charmander.png';
import charmanderB from './img/charmander_b.png';
import squirtle from './img/squirtle.png';
import squirtleB from './img/squirtle_b.png';

const SRC: Record<string, [string, string]> = { pikachu: [pikachu, pikachuB], charmander: [charmander, charmanderB], squirtle: [squirtle, squirtleB] };
const cache: Record<string, Sprite> = {};
const load = (url: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Sprite fehlt: ' + url.slice(0, 30))); i.src = url; });

/** Muss vor dem Spielstart einmal abgewartet werden. */
export function loadSprites(): Promise<void> {
  return Promise.all(Object.entries(SRC).map(async ([id, [f, b]]) => { cache[id] = spriteFromImages(await load(f), await load(b)); })).then(() => undefined);
}
export function getSprite(id: string): Sprite { return cache[id]; }

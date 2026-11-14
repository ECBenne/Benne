import { spriteFromSheet, Sprite, SheetMeta } from './spriteBuilder';
import glimmdraSheet from './img/glimmdra.png';
import glimmdraMeta from './img/glimmdra.json';
import glutdraxSheet from './img/glutdrax.png';
import glutdraxMeta from './img/glutdrax.json';

const SRC: Record<string, [string, SheetMeta]> = { glimmdra: [glimmdraSheet, glimmdraMeta as SheetMeta], glutdrax: [glutdraxSheet, glutdraxMeta as SheetMeta] };
const cache: Record<string, Sprite> = {};
const load = (url: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Sprite fehlt')); i.src = url; });

/** Muss vor dem Spielstart einmal abgewartet werden. */
export function loadSprites(): Promise<void> {
  return Promise.all(Object.entries(SRC).map(async ([id, [url, meta]]) => { cache[id] = spriteFromSheet(await load(url), meta); })).then(() => undefined);
}
export function getSprite(id: string): Sprite { return cache[id]; }

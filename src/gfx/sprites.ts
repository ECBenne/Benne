import { spriteFromSheet, Sprite, SheetMeta } from './spriteBuilder';
import glimmdraSheet from './img/glimmdra.png';
import glimmdraMeta from './img/glimmdra.json';
import glutdraxSheet from './img/glutdrax.png';
import glutdraxMeta from './img/glutdrax.json';
import glutwyrmSheet from './img/glutwyrm.png';
import glutwyrmMeta from './img/glutwyrm.json';
import tropflingSheet from './img/tropfling.png';
import tropflingMeta from './img/tropfling.json';
import flutdraxSheet from './img/flutdrax.png';
import flutdraxMeta from './img/flutdrax.json';
import gischtwyrmSheet from './img/gischtwyrm.png';
import gischtwyrmMeta from './img/gischtwyrm.json';
import knoesplingSheet from './img/knoespling.png';
import knoesplingMeta from './img/knoespling.json';
import laubpardSheet from './img/laubpard.png';
import laubpardMeta from './img/laubpard.json';
import maehnenflorSheet from './img/maehnenflor.png';
import maehnenflorMeta from './img/maehnenflor.json';

const SRC: Record<string, [string, SheetMeta]> = { glimmdra: [glimmdraSheet, glimmdraMeta as SheetMeta], glutdrax: [glutdraxSheet, glutdraxMeta as SheetMeta], glutwyrm: [glutwyrmSheet, glutwyrmMeta as SheetMeta],
  tropfling: [tropflingSheet, tropflingMeta as SheetMeta], flutdrax: [flutdraxSheet, flutdraxMeta as SheetMeta], gischtwyrm: [gischtwyrmSheet, gischtwyrmMeta as SheetMeta],
  knoespling: [knoesplingSheet, knoesplingMeta as SheetMeta], laubpard: [laubpardSheet, laubpardMeta as SheetMeta], maehnenflor: [maehnenflorSheet, maehnenflorMeta as SheetMeta] };
const cache: Record<string, Sprite> = {};
const load = (url: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Sprite fehlt')); i.src = url; });

/** Muss vor dem Spielstart einmal abgewartet werden. */
export function loadSprites(): Promise<void> {
  return Promise.all(Object.entries(SRC).map(async ([id, [url, meta]]) => { cache[id] = spriteFromSheet(await load(url), meta); })).then(() => undefined);
}
export function getSprite(id: string): Sprite { return cache[id]; }

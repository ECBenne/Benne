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
import funkelkrabbSheet from './img/funkelkrabb.png';
import funkelkrabbMeta from './img/funkelkrabb.json';
import sprungvoltSheet from './img/sprungvolt.png';
import sprungvoltMeta from './img/sprungvolt.json';
import donnerhirschSheet from './img/donnerhirsch.png';
import donnerhirschMeta from './img/donnerhirsch.json';
import kieselbudSheet from './img/kieselbud.png';
import kieselbudMeta from './img/kieselbud.json';
import schichtgrubSheet from './img/schichtgrub.png';
import schichtgrubMeta from './img/schichtgrub.json';
import felswachtSheet from './img/felswacht.png';
import felswachtMeta from './img/felswacht.json';
import flockfiepSheet from './img/flockfiep.png';
import flockfiepMeta from './img/flockfiep.json';
import frostschnabelSheet from './img/frostschnabel.png';
import frostschnabelMeta from './img/frostschnabel.json';
import gletscherflugSheet from './img/gletscherflug.png';
import gletscherflugMeta from './img/gletscherflug.json';
import fetzlingSheet from './img/fetzling.png';
import fetzlingMeta from './img/fetzling.json';
import schleierichSheet from './img/schleierich.png';
import schleierichMeta from './img/schleierich.json';
import nachtnahtSheet from './img/nachtnaht.png';
import nachtnahtMeta from './img/nachtnaht.json';
import knospenkrabSheet from './img/knospenkrab.png';
import knospenkrabMeta from './img/knospenkrab.json';
import farnschreckSheet from './img/farnschreck.png';
import farnschreckMeta from './img/farnschreck.json';
import orchidevaSheet from './img/orchideva.png';
import orchidevaMeta from './img/orchideva.json';
import raureifSheet from './img/raureif.png';
import raureifMeta from './img/raureif.json';
import dunstkalmarSheet from './img/dunstkalmar.png';
import dunstkalmarMeta from './img/dunstkalmar.json';
import windstelzSheet from './img/windstelz.png';
import windstelzMeta from './img/windstelz.json';
import sporenschleimSheet from './img/sporenschleim.png';
import sporenschleimMeta from './img/sporenschleim.json';
import bronzepanzerSheet from './img/bronzepanzer.png';
import bronzepanzerMeta from './img/bronzepanzer.json';
import lichtglockeSheet from './img/lichtglocke.png';
import lichtglockeMeta from './img/lichtglocke.json';
import duenenhupfSheet from './img/duenenhupf.png';
import duenenhupfMeta from './img/duenenhupf.json';
import quakustikSheet from './img/quakustik.png';
import quakustikMeta from './img/quakustik.json';
import mondschweifSheet from './img/mondschweif.png';
import mondschweifMeta from './img/mondschweif.json';
import drusellaSheet from './img/drusella.png';
import drusellaMeta from './img/drusella.json';

const SRC: Record<string, [string, SheetMeta]> = { glimmdra: [glimmdraSheet, glimmdraMeta as SheetMeta], glutdrax: [glutdraxSheet, glutdraxMeta as SheetMeta], glutwyrm: [glutwyrmSheet, glutwyrmMeta as SheetMeta],
  tropfling: [tropflingSheet, tropflingMeta as SheetMeta], flutdrax: [flutdraxSheet, flutdraxMeta as SheetMeta], gischtwyrm: [gischtwyrmSheet, gischtwyrmMeta as SheetMeta],
  knoespling: [knoesplingSheet, knoesplingMeta as SheetMeta], laubpard: [laubpardSheet, laubpardMeta as SheetMeta], maehnenflor: [maehnenflorSheet, maehnenflorMeta as SheetMeta], funkelkrabb: [funkelkrabbSheet, funkelkrabbMeta as SheetMeta], sprungvolt: [sprungvoltSheet, sprungvoltMeta as SheetMeta], donnerhirsch: [donnerhirschSheet, donnerhirschMeta as SheetMeta], kieselbud: [kieselbudSheet, kieselbudMeta as SheetMeta], schichtgrub: [schichtgrubSheet, schichtgrubMeta as SheetMeta], felswacht: [felswachtSheet, felswachtMeta as SheetMeta], flockfiep: [flockfiepSheet, flockfiepMeta as SheetMeta], frostschnabel: [frostschnabelSheet, frostschnabelMeta as SheetMeta], gletscherflug: [gletscherflugSheet, gletscherflugMeta as SheetMeta], fetzling: [fetzlingSheet, fetzlingMeta as SheetMeta], schleierich: [schleierichSheet, schleierichMeta as SheetMeta], nachtnaht: [nachtnahtSheet, nachtnahtMeta as SheetMeta], knospenkrab: [knospenkrabSheet, knospenkrabMeta as SheetMeta], farnschreck: [farnschreckSheet, farnschreckMeta as SheetMeta], orchideva: [orchidevaSheet, orchidevaMeta as SheetMeta], raureif: [raureifSheet, raureifMeta as SheetMeta], dunstkalmar: [dunstkalmarSheet, dunstkalmarMeta as SheetMeta], windstelz: [windstelzSheet, windstelzMeta as SheetMeta], sporenschleim: [sporenschleimSheet, sporenschleimMeta as SheetMeta], bronzepanzer: [bronzepanzerSheet, bronzepanzerMeta as SheetMeta], lichtglocke: [lichtglockeSheet, lichtglockeMeta as SheetMeta], duenenhupf: [duenenhupfSheet, duenenhupfMeta as SheetMeta], quakustik: [quakustikSheet, quakustikMeta as SheetMeta], mondschweif: [mondschweifSheet, mondschweifMeta as SheetMeta], drusella: [drusellaSheet, drusellaMeta as SheetMeta] };
const cache: Record<string, Sprite> = {};
const load = (url: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Sprite fehlt')); i.src = url; });

/** Muss vor dem Spielstart einmal abgewartet werden. */
export function loadSprites(): Promise<void> {
  return Promise.all(Object.entries(SRC).map(async ([id, [url, meta]]) => { cache[id] = spriteFromSheet(await load(url), meta); })).then(() => undefined);
}
export function getSprite(id: string): Sprite { return cache[id]; }

import type { TypeId } from './types';

export interface BaseStats { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }

export interface SpeciesDef {
  id: string;
  name: string;
  dex: number;
  types: TypeId[];
  base: BaseStats;
  moves: string[];       // MOVES ids
  evolvesTo?: { id: string; level: number };   // Weiterentwicklung
  buyable?: boolean;     // im Shop/als Starter wählbar (Standard: ja)
  radius: number;        // Trefferradius (px)
  height: number;        // Spritehöhe (px) für Effekte/Zahlen
  blurb: string;
}

export const SPECIES: Record<string, SpeciesDef> = {
  glimmdra: {
    id: 'glimmdra', name: 'Glimmdra', dex: 1, types: ['fire'],
    base: { hp: 45, atk: 53, def: 45, spa: 58, spd: 50, spe: 70 },
    moves: ['sparkburst', 'clawswipe', 'blazerush', 'dragonfire'],
    evolvesTo: { id: 'glutdrax', level: 14 },
    radius: 11, height: 46,
    blurb: 'Ein junger Feuerdrache. Wendig im Nahkampf, gefährlich mit seinem Drachenatem.',
  },
  glutdrax: {
    id: 'glutdrax', name: 'Glutdrax', dex: 2, types: ['fire'],
    base: { hp: 64, atk: 78, def: 65, spa: 84, spd: 68, spe: 79 },
    moves: ['sparkburst', 'clawswipe', 'blazerush', 'dragonfire'],
    evolvesTo: { id: 'glutwyrm', level: 22 },
    buyable: false,
    radius: 14, height: 55,
    blurb: 'Die Weiterentwicklung von Glimmdra. Größer, stärker und mit Stacheln aus Glut.',
  },
  glutwyrm: {
    id: 'glutwyrm', name: 'Glutwyrm', dex: 3, types: ['fire'],
    base: { hp: 82, atk: 100, def: 80, spa: 103, spd: 86, spe: 90 },
    moves: ['sparkburst', 'clawswipe', 'blazerush', 'dragonfire'],
    buyable: false,
    radius: 17, height: 62,
    blurb: 'Die letzte Stufe. Ein geflügelter Feuerwyrm, dessen Drachenglut ganze Arenen erhellt.',
  },
  // ── Wasser-Reihe ──
  tropfling: {
    id: 'tropfling', name: 'Tropfling', dex: 4, types: ['water'],
    base: { hp: 48, atk: 54, def: 48, spa: 62, spd: 53, spe: 68 },
    moves: ['pearlshot', 'finslap', 'tiderush', 'torrent'],
    evolvesTo: { id: 'flutdrax', level: 14 },
    radius: 11, height: 46,
    blurb: 'Ein neugieriger Wasserdrache. Verspielt, flink und treffsicher mit seinen Wasserperlen.',
  },
  flutdrax: {
    id: 'flutdrax', name: 'Flutdrax', dex: 5, types: ['water'],
    base: { hp: 66, atk: 78, def: 67, spa: 85, spd: 70, spe: 78 },
    moves: ['pearlshot', 'finslap', 'tiderush', 'torrent'],
    evolvesTo: { id: 'gischtwyrm', level: 22 },
    buyable: false,
    radius: 14, height: 55,
    blurb: 'Die Weiterentwicklung von Tropfling. Kraftvoll und mit einem Kamm aus Gold.',
  },
  gischtwyrm: {
    id: 'gischtwyrm', name: 'Gischtwyrm', dex: 6, types: ['water'],
    base: { hp: 81, atk: 99, def: 82, spa: 102, spd: 87, spe: 90 },
    moves: ['pearlshot', 'finslap', 'tiderush', 'torrent'],
    buyable: false,
    radius: 17, height: 61,
    blurb: 'Die letzte Stufe. Ein geflügelter Wasserwyrm, der Stürme aus Gischt entfesselt.',
  },
  // ── Pflanzen-Reihe ──
  knoespling: {
    id: 'knoespling', name: 'Knöspling', dex: 7, types: ['grass'],
    base: { hp: 49, atk: 52, def: 49, spa: 58, spd: 52, spe: 64 },
    moves: ['leafvolley', 'vinewhip', 'rootrush', 'bloomstorm'],
    evolvesTo: { id: 'laubpard', level: 14 },
    radius: 11, height: 46,
    blurb: 'Ein zähes Pflanzenjunges mit einer Knospe am Schwanz. Entzieht Gegnern mit Ranken Kraft.',
  },
  laubpard: {
    id: 'laubpard', name: 'Laubpard', dex: 8, types: ['grass'],
    base: { hp: 65, atk: 78, def: 66, spa: 84, spd: 69, spe: 78 },
    moves: ['leafvolley', 'vinewhip', 'rootrush', 'bloomstorm'],
    evolvesTo: { id: 'maehnenflor', level: 22 },
    buyable: false,
    radius: 14, height: 55,
    blurb: 'Die Weiterentwicklung von Knöspling. Geschmeidig wie eine Raubkatze, getarnt im Laub.',
  },
  maehnenflor: {
    id: 'maehnenflor', name: 'Mähnenflor', dex: 9, types: ['grass'],
    base: { hp: 81, atk: 99, def: 82, spa: 101, spd: 87, spe: 90 },
    moves: ['leafvolley', 'vinewhip', 'rootrush', 'bloomstorm'],
    buyable: false,
    radius: 17, height: 60,
    blurb: 'Die letzte Stufe. Eine Mähne aus Blättern und Blüten, die ihn nach jedem Treffer stärkt.',
  },
  // ── Neue Reihen: Elektro, Stein, Eis, Geist ──
  funkelkrabb: {
    id: 'funkelkrabb', name: 'Funkelkrabb', dex: 10, types: ['electric'],
    base: { hp: 46,atk: 56,def: 46,spa: 68,spd: 52,spe: 76 },
    moves: ['zapshot', 'nipbite', 'voltleap', 'thunderbeam'],
    evolvesTo: { id: 'sprungvolt', level: 14 },
    radius: 11, height: 44,
    blurb: 'Eine winzige Funkenlarve. Sie lädt sich beim Krabbeln auf und zwickt neugierig zu.',
  },
  sprungvolt: {
    id: 'sprungvolt', name: 'Sprungvolt', dex: 11, types: ['electric'],
    base: { hp: 68,atk: 86,def: 66,spa: 98,spd: 70,spe: 104 },
    moves: ['zapshot', 'nipbite', 'voltleap', 'thunderbeam'],
    evolvesTo: { id: 'donnerhirsch', level: 22 },
    buyable: false,
    radius: 14, height: 54,
    blurb: 'Eine flinke Blitzgrille. Mit kräftigen Hinterbeinen springt sie dem Gegner in die Flanke.',
  },
  donnerhirsch: {
    id: 'donnerhirsch', name: 'Donnerhirsch', dex: 12, types: ['electric'],
    base: { hp: 78,atk: 100,def: 78,spa: 108,spd: 82,spe: 108 },
    moves: ['zapshot', 'nipbite', 'voltleap', 'thunderbeam'],
    buyable: false,
    radius: 17, height: 64,
    blurb: 'Ein mächtiger Hirschkäfer. Zwischen seinem Kupfergeweih zucken Blitze.',
  },
  kieselbud: {
    id: 'kieselbud', name: 'Kieselbud', dex: 13, types: ['rock'],
    base: { hp: 58,atk: 60,def: 66,spa: 40,spd: 50,spe: 44 },
    moves: ['pebbleshot', 'rockbreaker', 'stoneroll', 'dustbeam'],
    evolvesTo: { id: 'schichtgrub', level: 14 },
    radius: 11, height: 44,
    blurb: 'Ein kleiner Sandmaulwurf mit Kieselkappe. Gräbt gern und hält erstaunlich viel aus.',
  },
  schichtgrub: {
    id: 'schichtgrub', name: 'Schichtgrub', dex: 14, types: ['rock'],
    base: { hp: 78,atk: 80,def: 88,spa: 56,spd: 68,spe: 50 },
    moves: ['pebbleshot', 'rockbreaker', 'stoneroll', 'dustbeam'],
    evolvesTo: { id: 'felswacht', level: 22 },
    buyable: false,
    radius: 14, height: 54,
    blurb: 'Ein stämmiger Wombat mit Felsplatten auf dem Rücken. Langsam, aber kaum aufzuhalten.',
  },
  felswacht: {
    id: 'felswacht', name: 'Felswacht', dex: 15, types: ['rock'],
    base: { hp: 104,atk: 108,def: 124,spa: 64,spd: 90,spe: 52 },
    moves: ['pebbleshot', 'rockbreaker', 'stoneroll', 'dustbeam'],
    buyable: false,
    radius: 18, height: 62,
    blurb: 'Ein riesiger Panzerwächter mit Sandsteinkuppel und Steinkeule. Eine wandelnde Festung.',
  },
  flockfiep: {
    id: 'flockfiep', name: 'Flockfiep', dex: 16, types: ['ice'],
    base: { hp: 48, atk: 50, def: 48, spa: 69, spd: 56, spe: 71 },
    moves: ['frostshard', 'frostbite', 'iceslide', 'icebreath'],
    evolvesTo: { id: 'frostschnabel', level: 14 },
    radius: 10, height: 44,
    blurb: 'Ein flauschiges Eisküken. Sein Piepen lässt die Luft um ihn herum gefrieren.',
  },
  frostschnabel: {
    id: 'frostschnabel', name: 'Frostschnabel', dex: 17, types: ['ice'],
    base: { hp: 66,atk: 66,def: 64,spa: 96,spd: 74,spe: 86 },
    moves: ['frostshard', 'frostbite', 'iceslide', 'icebreath'],
    evolvesTo: { id: 'gletscherflug', level: 22 },
    buyable: false,
    radius: 13, height: 54,
    blurb: 'Ein junger Frostvogel. Sein Schnabel schießt scharfe Eissplitter.',
  },
  gletscherflug: {
    id: 'gletscherflug', name: 'Gletscherflug', dex: 18, types: ['ice'],
    base: { hp: 80,atk: 80,def: 78,spa: 110,spd: 90,spe: 100 },
    moves: ['frostshard', 'frostbite', 'iceslide', 'icebreath'],
    buyable: false,
    radius: 17, height: 64,
    blurb: 'Ein majestätischer Eisvogel. Seine Schwingen bringen Hagel und Schneesturm.',
  },
  fetzling: {
    id: 'fetzling', name: 'Fetzling', dex: 19, types: ['ghost'],
    base: { hp: 40,atk: 46,def: 38,spa: 62,spd: 52,spe: 80 },
    moves: ['shadowball', 'veilslash', 'ghostleap', 'spookfire'],
    evolvesTo: { id: 'schleierich', level: 14 },
    radius: 11, height: 44,
    blurb: 'Ein zerlumptes Spukgeschöpf. Es huscht durch die Arena und erschreckt gern.',
  },
  schleierich: {
    id: 'schleierich', name: 'Schleierich', dex: 20, types: ['ghost'],
    base: { hp: 58,atk: 64,def: 54,spa: 88,spd: 72,spe: 98 },
    moves: ['shadowball', 'veilslash', 'ghostleap', 'spookfire'],
    evolvesTo: { id: 'nachtnaht', level: 22 },
    buyable: false,
    radius: 14, height: 54,
    blurb: 'Ein schwebender Schleiergeist. Trifft aus dem Nichts und verschwindet wieder.',
  },
  nachtnaht: {
    id: 'nachtnaht', name: 'Nachtnaht', dex: 21, types: ['ghost'],
    base: { hp: 76,atk: 88,def: 72,spa: 112,spd: 94,spe: 110 },
    moves: ['shadowball', 'veilslash', 'ghostleap', 'spookfire'],
    buyable: false,
    radius: 16, height: 64,
    blurb: 'Ein gekrönter Geist in nachtviolettem Umhang. Seine Nähte halten die Dunkelheit zusammen.',
  },
  knospenkrab: {
    id: 'knospenkrab', name: 'Knospenkrab', dex: 22, types: ['grass'],
    base: { hp: 54,atk: 50,def: 66,spa: 54,spd: 58,spe: 42 },
    moves: ['leafvolley', 'vinewhip', 'rootrush', 'bloomstorm'],
    evolvesTo: { id: 'farnschreck', level: 14 },
    radius: 11, height: 46,
    blurb: 'Eine Schildkröte mit Knospe auf dem Panzer. Gemächlich, zäh und voller Pflanzenkraft.',
  },
  farnschreck: {
    id: 'farnschreck', name: 'Farnschreck', dex: 23, types: ['grass'],
    base: { hp: 64, atk: 80, def: 64, spa: 86, spd: 68, spe: 80 },
    moves: ['leafvolley', 'vinewhip', 'rootrush', 'bloomstorm'],
    evolvesTo: { id: 'orchideva', level: 22 },
    buyable: false,
    radius: 14, height: 54,
    blurb: 'Eine elegante Blattmantis. Mit ihren Farnsicheln schneidet sie blitzschnell zu.',
  },
  orchideva: {
    id: 'orchideva', name: 'Orchideva', dex: 24, types: ['grass'],
    base: { hp: 80, atk: 102, def: 76, spa: 110, spd: 84, spe: 88 },
    moves: ['leafvolley', 'vinewhip', 'rootrush', 'bloomstorm'],
    buyable: false,
    radius: 17, height: 64,
    blurb: 'Eine prächtige Orchideenmantis. Ihre Blütenschwingen betören und zerschneiden zugleich.',
  },
  raureif: {
    id: 'raureif', name: 'Raureif', dex: 25, types: ['ice'],
    base: { hp: 61, atk: 57, def: 68, spa: 45, spd: 59, spe: 40 },
    moves: ['frostshard', 'frostbite', 'iceslide', 'icebreath'],
    radius: 15, height: 54,
    blurb: 'Ein zotteliger Eisbüffel mit Gletscherhörnern. Rammt Gegner und lässt kaum etwas durch.',
  },
  dunstkalmar: {
    id: 'dunstkalmar', name: 'Dunstkalmar', dex: 26, types: ['ghost'],
    base: { hp: 44, atk: 40, def: 44, spa: 66, spd: 60, spe: 64 },
    moves: ['shadowball', 'veilslash', 'ghostleap', 'spookfire'],
    radius: 13, height: 54,
    blurb: 'Ein schwebender Nebelkalmar. Seine Bänder ziehen den Gegner in den Dunst.',
  },
  windstelz: {
    id: 'windstelz', name: 'Windstelz', dex: 27, types: ['wind'],
    base: { hp: 47, atk: 68, def: 45, spa: 66, spd: 52, spe: 99 },
    moves: ['windcutter', 'gustpeck', 'galedash', 'cyclone'],
    radius: 12, height: 58,
    blurb: 'Ein schlanker Sekretärvogel auf langen Beinen. Tritt blitzschnell zu und tänzelt davon.',
  },
  sporenschleim: {
    id: 'sporenschleim', name: 'Sporenschleim', dex: 28, types: ['poison'],
    base: { hp: 59, atk: 43, def: 55, spa: 59, spd: 57, spe: 28 },
    moves: ['toxdart', 'sludgebite', 'slimeslide', 'toxicspray'],
    radius: 14, height: 50,
    blurb: 'Eine breite Schnecke mit Pilzgarten auf dem Rücken. Gemächlich, aber ihr Gift wirkt lange.',
  },
  bronzepanzer: {
    id: 'bronzepanzer', name: 'Bronzepanzer', dex: 29, types: ['metal'],
    base: { hp: 52, atk: 60, def: 74, spa: 40, spd: 58, spe: 36 },
    moves: ['steelshard', 'ironhit', 'bronzecharge', 'lasercut'],
    radius: 16, height: 50,
    blurb: 'Ein Hufeisenkrebs mit Bronzepanzer. Langsam, aber fast unzerstörbar.',
  },
  lichtglocke: {
    id: 'lichtglocke', name: 'Lichtglocke', dex: 30, types: ['light'],
    base: { hp: 50, atk: 39, def: 48, spa: 73, spd: 71, spe: 63 },
    moves: ['lightorb', 'glowtouch', 'flashleap', 'holybeam'],
    radius: 11, height: 46,
    blurb: 'Eine kleine Quallenglocke aus Bernsteinglas. Ihr Schein blendet und heilt zugleich.',
  },
  duenenhupf: {
    id: 'duenenhupf', name: 'Dünenhupf', dex: 31, types: ['earth'],
    base: { hp: 46, atk: 66, def: 46, spa: 44, spd: 48, spe: 97 },
    moves: ['dirtshot', 'burrowhit', 'sandleap', 'sandblast'],
    radius: 12, height: 52,
    blurb: 'Eine flinke Wüstenspringmaus. Huscht über Dünen und gräbt sich blitzschnell ein.',
  },
  quakustik: {
    id: 'quakustik', name: 'Quakustik', dex: 32, types: ['sound'],
    base: { hp: 55, atk: 47, def: 49, spa: 72, spd: 61, spe: 57 },
    moves: ['sonicpulse', 'echoslap', 'rumbledash', 'screech'],
    radius: 15, height: 50,
    blurb: 'Ein runder Frosch mit Resonanzblasen. Sein Quaken lässt die Arena beben.',
  },
  mondschweif: {
    id: 'mondschweif', name: 'Mondschweif', dex: 33, types: ['dark'],
    base: { hp: 46, atk: 68, def: 44, spa: 64, spd: 51, spe: 90 },
    moves: ['nightshard', 'shadowclaw', 'pounce', 'darkpulse'],
    radius: 12, height: 50,
    blurb: 'Eine schlanke Schleichkatze mit Mondzeichen. Schlägt aus dem Dunkel zu.',
  },
  drusella: {
    id: 'drusella', name: 'Drusella', dex: 34, types: ['crystal'],
    base: { hp: 54, atk: 46, def: 68, spa: 56, spd: 63, spe: 27 },
    moves: ['prismshard', 'geodehit', 'crystalroll', 'prismbeam'],
    radius: 13, height: 52,
    blurb: 'Eine Schnecke mit Amethyst-Geode als Haus. Langsam, aber ihre Kristalle brechen das Licht zu Strahlen.',
  },
};
/** Form eines Monsters auf einem Level (für Gegner): entwickelt, sobald das Level erreicht ist. */
export function formAt(id: string, level: number): string {
  let cur = SPECIES[id];
  while (cur?.evolvesTo && level >= cur.evolvesTo.level) cur = SPECIES[cur.evolvesTo.id];
  return cur?.id ?? id;
}
export const SPECIES_IDS = Object.keys(SPECIES);
/** Einzelmonster ohne Entwicklung: Werte wachsen mit dem Level wie bei einer ganzen Entwicklungslinie. */
const EVO_TARGETS = new Set(SPECIES_IDS.map((k) => SPECIES[k].evolvesTo?.id).filter(Boolean));
export const isSingle = (id: string) => !SPECIES[id].evolvesTo && !EVO_TARGETS.has(id);
export const singleGrowth = (level: number) => 1 + 0.38 * Math.min(1, Math.max(0, (level - 10) / 6)) + 0.33 * Math.min(1, Math.max(0, (level - 20) / 6));
/** Nur Grundformen werden verkauft / als Gegner-Basis genutzt. */
export const BASE_IDS = SPECIES_IDS.filter((id) => SPECIES[id].buyable !== false);

/** Wesen steuert das Verhalten der KI – das Herzstück der Eigenständigkeit. */
export interface NatureDef {
  id: string;
  name: string;
  blurb: string;
  range: number;       // Abstandsfaktor (<1 nah ran, >1 Abstand halten)
  dodge: number;       // Ausweich-Wahrscheinlichkeit
  aggression: number;  // Angriffslust
  hitAndRun: number;   // Rückzug nach Angriff (s)
  orbit: number;       // Umkreis-Tempo
  lead: number;        // Zielgenauigkeit (Vorhalten)
  speed: number;       // Tempo-Faktor
  weights: Record<string, number>; // Vorlieben je Attacken-Art
  trait: { name: string; desc: string }; // Eigenschaft mit spürbarer Wirkung im Kampf
}

export const NATURES: Record<string, NatureDef> = {
  brave: {
    id: 'brave', name: 'Mutig', blurb: 'Stürmt direkt ran, liebt den Nahkampf.',
    range: 0.55, dodge: 0.3, aggression: 1, hitAndRun: 0, orbit: 0.5, lead: 0.4, speed: 1,
    weights: { melee: 1.35, dash: 1.3, projectile: 0.85, aoe: 1, cone: 1.25 },
    trait: { name: 'Kampfgeist', desc: 'UNTER 50% KP: +12% SCHADEN.' },
  },
  timid: {
    id: 'timid', name: 'Scheu', blurb: 'Hält Abstand, weicht oft aus, schießt aus der Ferne.',
    range: 1.25, dodge: 0.8, aggression: 0.45, hitAndRun: 0.3, orbit: 1, lead: 0.7, speed: 1.05,
    weights: { melee: 0.6, dash: 0.8, projectile: 1.3, aoe: 1.1, cone: 0.9 },
    trait: { name: 'Wachsam', desc: 'AUSWEICHEN LÄDT 25% SCHNELLER NACH.' },
  },
  hasty: {
    id: 'hasty', name: 'Hastig', blurb: 'Zuschlagen und wegflitzen – Hit & Run.',
    range: 0.8, dodge: 0.55, aggression: 0.75, hitAndRun: 0.95, orbit: 1.3, lead: 0.5, speed: 1.12,
    weights: { melee: 1.1, dash: 1.4, projectile: 1, aoe: 0.9, cone: 0.9 },
    trait: { name: 'Flinkheit', desc: 'ERHOLT SICH 25% SCHNELLER NACH ANGRIFFEN.' },
  },
  sly: {
    id: 'sly', name: 'Listig', blurb: 'Zielt voraus, nutzt Spezialangriffe und lauert.',
    range: 1.0, dodge: 0.65, aggression: 0.6, hitAndRun: 0.45, orbit: 0.8, lead: 1, speed: 1,
    weights: { melee: 0.8, dash: 0.9, projectile: 1.1, aoe: 1.6, cone: 1.4 },
    trait: { name: 'Kalkül', desc: 'VOLLTREFFER-CHANCE VERDOPPELT (14%).' },
  },
  calm: {
    id: 'calm', name: 'Ruhig', blurb: 'Bleibt gelassen, kämpft ausgewogen und hält viel aus.',
    range: 0.95, dodge: 0.5, aggression: 0.7, hitAndRun: 0.2, orbit: 0.7, lead: 0.7, speed: 1,
    weights: { melee: 1, dash: 0.9, projectile: 1, aoe: 1.1, cone: 1.1 },
    trait: { name: 'Zähigkeit', desc: 'ERHÄLT 8% WENIGER SCHADEN.' },
  },
};
export const NATURE_IDS = Object.keys(NATURES);

export type TacticId = 'attack' | 'balanced' | 'defend' | 'counter';
export const TACTICS: Record<TacticId, { name: string; aggr: number; dodge: number; range: number; blurb: string }> = {
  attack: { name: 'Angriff', aggr: 1.35, dodge: 0.75, range: 0.8, blurb: 'ANGRIFF: +8% SCHADEN, SETZT NACH, WEICHT SELTENER AUS.' },
  balanced: { name: 'Ausgewogen', aggr: 1, dodge: 1, range: 1, blurb: 'AUSGEWOGEN: FOLGT DEM WESEN DES MONSTERS.' },
  counter: { name: 'Konter', aggr: 0.8, dodge: 1.6, range: 1.05, blurb: 'KONTER: WEICHT AM HÄUFIGSTEN AUS, DANACH +50% KONTER-SCHADEN. WENIG EIGENER DRUCK.' },
  defend: { name: 'Defensiv', aggr: 0.7, dodge: 1.3, range: 1.25, blurb: 'DEFENSIV: -8% SCHADEN, WEICHT OFT AUS, LANGES KONTER-FENSTER.' },
};

/** Grundform einer Entwicklungslinie (für Anwerben: man bekommt die kleine Form). */
export function baseForm(id: string): string {
  let cur = id;
  for (let i = 0; i < 5; i++) {
    const parent = SPECIES_IDS.find((k) => SPECIES[k].evolvesTo?.id === cur);
    if (!parent) break;
    cur = parent;
  }
  return cur;
}

/** Lernbare Attacken je Entwicklungslinie: [Attacke, Level]. Höchstens MAX_MOVES sind ausgerüstet. */
export const MAX_MOVES = 4;
export const LEARNSETS: Record<string, [string, number][]> = {
  glimmdra: [['sparkburst', 1], ['clawswipe', 1], ['dragonfire', 1], ['glare', 1], ['blazerush', 11], ['heatup', 13], ['magmaball', 16], ['firerain', 19], ['dragondance', 21], ['inferno', 24]],
  tropfling: [['pearlshot', 1], ['finslap', 1], ['torrent', 1], ['soak', 1], ['tiderush', 11], ['aquaring', 13], ['bubblebomb', 16], ['geyser', 19], ['shellguard', 21], ['tidalwave', 24]],
  knoespling: [['leafvolley', 1], ['vinewhip', 1], ['bloomstorm', 1], ['lure', 1], ['rootrush', 11], ['synthesis', 13], ['seedbomb', 16], ['thornfield', 19], ['growth', 21], ['wildwrath', 24]],
};
/** Attacken-Ids je Typ: Salve, Nahkampf, Sturmangriff, Strahl, Anheizen, Kugel, Feld, Sturm, Schwächen, Stärken, Schutz, Kranz, Verfolger, Schauer, Nova */
const SIG_IDS: Record<string, string[]> = { fire: ['flamering', 'emberseek', 'meteorfall', 'blazenova'], water: ['bubblering', 'aquaseek', 'rainshower', 'surgenova'], grass: ['seedring', 'sporeseek', 'thornrain', 'bloomnova'] };
const FAM: Record<string, string[]> = {
  electric: ['zapshot', 'nipbite', 'voltleap', 'thunderbeam', 'charge', 'chainbolt', 'stormfield', 'thunderstorm', 'shock', 'overload', 'staticveil', 'sparkring', 'ballbolt', 'boltrain', 'plasmanova'],
  rock: ['pebbleshot', 'rockbreaker', 'stoneroll', 'dustbeam', 'rockrage', 'boulder', 'quake', 'mountainfall', 'dustcloud', 'stonearmor', 'rockwall', 'rockring', 'rubbleseek', 'meteorshower', 'quakenova'],
  ice: ['frostshard', 'frostbite', 'iceslide', 'icebreath', 'coldfocus', 'iceball', 'hailstorm', 'blizzard', 'chill', 'icedance', 'iceshell', 'frostring', 'snowseek', 'iciclerain', 'frostnova'],
  ghost: ['shadowball', 'veilslash', 'ghostleap', 'spookfire', 'haunt', 'cursebolt', 'spookfield', 'ghoststorm', 'scareface', 'shadowdance', 'shadowveil', 'wispring', 'soulseek', 'spiritrain', 'phantomnova'],
  wind: ['windcutter', 'gustpeck', 'galedash', 'cyclone', 'tailwind', 'razorgale', 'twister', 'tempest', 'gust', 'featherdance', 'airveil', 'bladering', 'galeseek', 'featherrain', 'cyclonenova'],
  poison: ['toxdart', 'sludgebite', 'slimeslide', 'toxicspray', 'venomrage', 'acidblob', 'sludgepool', 'toxicrain', 'stench', 'sporeguard', 'slimeshell', 'acidring', 'toxseek', 'sporerain', 'toxicnova'],
  metal: ['steelshard', 'ironhit', 'bronzecharge', 'lasercut', 'sharpen', 'steelball', 'gearfield', 'steelrain', 'rustcloud', 'ironfort', 'platewall', 'sawring', 'bladeseek', 'steelhail', 'steelnova'],
  light: ['lightorb', 'glowtouch', 'flashleap', 'holybeam', 'radiance', 'sunspear', 'lightpillar', 'dawn', 'dazzle', 'blessing', 'lightshield', 'starring', 'beamseek', 'starfall', 'solarnova'],
  earth: ['dirtshot', 'burrowhit', 'sandleap', 'sandblast', 'dunefocus', 'claybomb', 'sinkhole', 'upheaval', 'sandtrap', 'burrowup', 'sandwall', 'pebblering', 'dustseek', 'stonefount', 'sandnova'],
  sound: ['sonicpulse', 'echoslap', 'rumbledash', 'screech', 'amplify', 'bassbomb', 'resonance', 'symphony', 'discord', 'harmony', 'soundwall', 'noteburst', 'echoseek', 'bassrain', 'soundnova'],
  dark: ['nightshard', 'shadowclaw', 'pounce', 'darkpulse', 'menace', 'voidorb', 'blackhole', 'eclipse', 'taunt', 'nightcloak', 'darkveil', 'shadering', 'voidseek', 'shadowrain', 'voidnova'],
  crystal: ['prismshard', 'geodehit', 'crystalroll', 'prismbeam', 'resonate', 'amethyst', 'crystalbloom', 'geodestorm', 'refract', 'faceting', 'crystalshell', 'prismring', 'gemseek', 'shardstorm', 'diamondnova'],
};
const SLOT_LV = [1, 1, 1, 1, 6, 9, 11, 13, 14, 16, 19, 21, 22, 24, 27];
/** Lernliste aus den Buchstaben-Kürzeln: s=Salve e=Nahkampf d=Sturm b=Strahl u=Anheizen l=Kugel f=Feld t=Sturm w=Schwächen n=Stärken g=Schutz r=Kranz k=Verfolger a=Schauer v=Nova */
const KEYS = 'sedbulftwngrkav';
const kit = (type: string, order = 'sebwrgdukl' + 'fnatv'): [string, number][] => [...order].map((c, i) => [FAM[type][KEYS.indexOf(c)], SLOT_LV[i]] as [string, number]);
Object.assign(LEARNSETS, {
  funkelkrabb: kit('electric'), kieselbud: kit('rock'), flockfiep: kit('ice'), fetzling: kit('ghost'), knospenkrab: LEARNSETS.knoespling,
  // Einzelgänger: eigene Reihenfolge, die zum Kampfstil passt
  raureif: kit('ice', 'egbwrsdukl' + 'fnatv'), dunstkalmar: kit('ghost', 'swkbrgdula' + 'fnetv'),
  windstelz: kit('wind', 'edswrbgukl' + 'fnatv'), sporenschleim: kit('poison', 'sbwgrdulkf' + 'naetv'),
  bronzepanzer: kit('metal', 'egdbwrusl' + 'kfntav'), lichtglocke: kit('light', 'sbwgurkdlf' + 'naetv'),
  duenenhupf: kit('earth', 'edswrbgukl' + 'fnatv'), quakustik: kit('sound', 'sbwgrdulkf' + 'naetv'),
  mondschweif: kit('dark', 'edbwrguskl' + 'fnatv'), drusella: kit('crystal', 'ebgwrsdulk' + 'fnatv'),
});
// Starter-Linien bekommen zusätzlich die vier Signaturattacken
for (const [line, type] of [['glimmdra', 'fire'], ['tropfling', 'water'], ['knoespling', 'grass']] as const) {
  const sg = SIG_IDS[type]; LEARNSETS[line].push([sg[0], 6], [sg[1], 14], [sg[2], 22], [sg[3], 27]);
}
LEARNSETS.knospenkrab = LEARNSETS.knoespling;
export const learnset = (sp: string) => LEARNSETS[baseForm(sp)] ?? SPECIES[sp].moves.map((m) => [m, 1] as [string, number]);
export const learnedMoves = (sp: string, level: number) => learnset(sp).filter(([, l]) => l <= level).map(([m]) => m);
/** Erste Ausrüstung: die ersten vier gelernten Attacken. */
export const starterMoves = (sp: string, level: number) => learnedMoves(sp, level).slice(0, MAX_MOVES);

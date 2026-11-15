// src/core/util.ts
var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
var TAU = Math.PI * 2;
var Rng = class {
  constructor(s = 1) {
    this.s = s;
  }
  s;
  next() {
    this.s |= 0;
    this.s = this.s + 1831565813 | 0;
    let t = Math.imul(this.s ^ this.s >>> 15, 1 | this.s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  range(a, b) {
    return a + (b - a) * this.next();
  }
  int(a, b) {
    return Math.floor(this.range(a, b + 1));
  }
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
  chance(p) {
    return this.next() < p;
  }
};
function angleDiff(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

// src/data/species.ts
var SPECIES = {
  glimmdra: {
    id: "glimmdra",
    name: "Glimmdra",
    dex: 1,
    types: ["fire"],
    base: { hp: 45, atk: 53, def: 45, spa: 58, spd: 50, spe: 70 },
    moves: ["sparkburst", "clawswipe", "blazerush", "dragonfire"],
    evolvesTo: { id: "glutdrax", level: 14 },
    radius: 11,
    height: 46,
    blurb: "Ein junger Feuerdrache. Wendig im Nahkampf, gef\xE4hrlich mit seinem Drachenatem."
  },
  glutdrax: {
    id: "glutdrax",
    name: "Glutdrax",
    dex: 2,
    types: ["fire"],
    base: { hp: 64, atk: 78, def: 65, spa: 84, spd: 68, spe: 79 },
    moves: ["sparkburst", "clawswipe", "blazerush", "dragonfire"],
    evolvesTo: { id: "glutwyrm", level: 22 },
    buyable: false,
    radius: 14,
    height: 55,
    blurb: "Die Weiterentwicklung von Glimmdra. Gr\xF6\xDFer, st\xE4rker und mit Stacheln aus Glut."
  },
  glutwyrm: {
    id: "glutwyrm",
    name: "Glutwyrm",
    dex: 3,
    types: ["fire"],
    base: { hp: 82, atk: 100, def: 80, spa: 103, spd: 86, spe: 90 },
    moves: ["sparkburst", "clawswipe", "blazerush", "dragonfire"],
    buyable: false,
    radius: 17,
    height: 62,
    blurb: "Die letzte Stufe. Ein gefl\xFCgelter Feuerwyrm, dessen Drachenglut ganze Arenen erhellt."
  },
  // ── Wasser-Reihe ──
  tropfling: {
    id: "tropfling",
    name: "Tropfling",
    dex: 4,
    types: ["water"],
    base: { hp: 48, atk: 54, def: 48, spa: 62, spd: 53, spe: 68 },
    moves: ["pearlshot", "finslap", "tiderush", "torrent"],
    evolvesTo: { id: "flutdrax", level: 14 },
    radius: 11,
    height: 46,
    blurb: "Ein neugieriger Wasserdrache. Verspielt, flink und treffsicher mit seinen Wasserperlen."
  },
  flutdrax: {
    id: "flutdrax",
    name: "Flutdrax",
    dex: 5,
    types: ["water"],
    base: { hp: 66, atk: 78, def: 67, spa: 85, spd: 70, spe: 78 },
    moves: ["pearlshot", "finslap", "tiderush", "torrent"],
    evolvesTo: { id: "gischtwyrm", level: 22 },
    buyable: false,
    radius: 14,
    height: 55,
    blurb: "Die Weiterentwicklung von Tropfling. Kraftvoll und mit einem Kamm aus Gold."
  },
  gischtwyrm: {
    id: "gischtwyrm",
    name: "Gischtwyrm",
    dex: 6,
    types: ["water"],
    base: { hp: 81, atk: 99, def: 82, spa: 102, spd: 87, spe: 90 },
    moves: ["pearlshot", "finslap", "tiderush", "torrent"],
    buyable: false,
    radius: 17,
    height: 61,
    blurb: "Die letzte Stufe. Ein gefl\xFCgelter Wasserwyrm, der St\xFCrme aus Gischt entfesselt."
  },
  // ── Pflanzen-Reihe ──
  knoespling: {
    id: "knoespling",
    name: "Kn\xF6spling",
    dex: 7,
    types: ["grass"],
    base: { hp: 49, atk: 52, def: 49, spa: 58, spd: 52, spe: 64 },
    moves: ["leafvolley", "vinewhip", "rootrush", "bloomstorm"],
    evolvesTo: { id: "laubpard", level: 14 },
    radius: 11,
    height: 46,
    blurb: "Ein z\xE4hes Pflanzenjunges mit einer Knospe am Schwanz. Entzieht Gegnern mit Ranken Kraft."
  },
  laubpard: {
    id: "laubpard",
    name: "Laubpard",
    dex: 8,
    types: ["grass"],
    base: { hp: 65, atk: 78, def: 66, spa: 84, spd: 69, spe: 78 },
    moves: ["leafvolley", "vinewhip", "rootrush", "bloomstorm"],
    evolvesTo: { id: "maehnenflor", level: 22 },
    buyable: false,
    radius: 14,
    height: 55,
    blurb: "Die Weiterentwicklung von Kn\xF6spling. Geschmeidig wie eine Raubkatze, getarnt im Laub."
  },
  maehnenflor: {
    id: "maehnenflor",
    name: "M\xE4hnenflor",
    dex: 9,
    types: ["grass"],
    base: { hp: 81, atk: 99, def: 82, spa: 101, spd: 87, spe: 90 },
    moves: ["leafvolley", "vinewhip", "rootrush", "bloomstorm"],
    buyable: false,
    radius: 17,
    height: 60,
    blurb: "Die letzte Stufe. Eine M\xE4hne aus Bl\xE4ttern und Bl\xFCten, die ihn nach jedem Treffer st\xE4rkt."
  },
  // ── Neue Reihen: Elektro, Stein, Eis, Geist ──
  funkelkrabb: {
    id: "funkelkrabb",
    name: "Funkelkrabb",
    dex: 10,
    types: ["electric"],
    base: { hp: 46, atk: 56, def: 46, spa: 68, spd: 52, spe: 76 },
    moves: ["zapshot", "nipbite", "voltleap", "thunderbeam"],
    evolvesTo: { id: "sprungvolt", level: 14 },
    radius: 11,
    height: 44,
    blurb: "Eine winzige Funkenlarve. Sie l\xE4dt sich beim Krabbeln auf und zwickt neugierig zu."
  },
  sprungvolt: {
    id: "sprungvolt",
    name: "Sprungvolt",
    dex: 11,
    types: ["electric"],
    base: { hp: 68, atk: 86, def: 66, spa: 98, spd: 70, spe: 104 },
    moves: ["zapshot", "nipbite", "voltleap", "thunderbeam"],
    evolvesTo: { id: "donnerhirsch", level: 22 },
    buyable: false,
    radius: 14,
    height: 54,
    blurb: "Eine flinke Blitzgrille. Mit kr\xE4ftigen Hinterbeinen springt sie dem Gegner in die Flanke."
  },
  donnerhirsch: {
    id: "donnerhirsch",
    name: "Donnerhirsch",
    dex: 12,
    types: ["electric"],
    base: { hp: 78, atk: 100, def: 78, spa: 108, spd: 82, spe: 108 },
    moves: ["zapshot", "nipbite", "voltleap", "thunderbeam"],
    buyable: false,
    radius: 17,
    height: 64,
    blurb: "Ein m\xE4chtiger Hirschk\xE4fer. Zwischen seinem Kupfergeweih zucken Blitze."
  },
  kieselbud: {
    id: "kieselbud",
    name: "Kieselbud",
    dex: 13,
    types: ["rock"],
    base: { hp: 58, atk: 60, def: 66, spa: 40, spd: 50, spe: 44 },
    moves: ["pebbleshot", "rockbreaker", "stoneroll", "dustbeam"],
    evolvesTo: { id: "schichtgrub", level: 14 },
    radius: 11,
    height: 44,
    blurb: "Ein kleiner Sandmaulwurf mit Kieselkappe. Gr\xE4bt gern und h\xE4lt erstaunlich viel aus."
  },
  schichtgrub: {
    id: "schichtgrub",
    name: "Schichtgrub",
    dex: 14,
    types: ["rock"],
    base: { hp: 78, atk: 80, def: 88, spa: 56, spd: 68, spe: 50 },
    moves: ["pebbleshot", "rockbreaker", "stoneroll", "dustbeam"],
    evolvesTo: { id: "felswacht", level: 22 },
    buyable: false,
    radius: 14,
    height: 54,
    blurb: "Ein st\xE4mmiger Wombat mit Felsplatten auf dem R\xFCcken. Langsam, aber kaum aufzuhalten."
  },
  felswacht: {
    id: "felswacht",
    name: "Felswacht",
    dex: 15,
    types: ["rock"],
    base: { hp: 104, atk: 108, def: 124, spa: 64, spd: 90, spe: 52 },
    moves: ["pebbleshot", "rockbreaker", "stoneroll", "dustbeam"],
    buyable: false,
    radius: 18,
    height: 62,
    blurb: "Ein riesiger Panzerw\xE4chter mit Sandsteinkuppel und Steinkeule. Eine wandelnde Festung."
  },
  flockfiep: {
    id: "flockfiep",
    name: "Flockfiep",
    dex: 16,
    types: ["ice"],
    base: { hp: 48, atk: 50, def: 48, spa: 69, spd: 56, spe: 71 },
    moves: ["frostshard", "frostbite", "iceslide", "icebreath"],
    evolvesTo: { id: "frostschnabel", level: 14 },
    radius: 10,
    height: 44,
    blurb: "Ein flauschiges Eisk\xFCken. Sein Piepen l\xE4sst die Luft um ihn herum gefrieren."
  },
  frostschnabel: {
    id: "frostschnabel",
    name: "Frostschnabel",
    dex: 17,
    types: ["ice"],
    base: { hp: 66, atk: 66, def: 64, spa: 96, spd: 74, spe: 86 },
    moves: ["frostshard", "frostbite", "iceslide", "icebreath"],
    evolvesTo: { id: "gletscherflug", level: 22 },
    buyable: false,
    radius: 13,
    height: 54,
    blurb: "Ein junger Frostvogel. Sein Schnabel schie\xDFt scharfe Eissplitter."
  },
  gletscherflug: {
    id: "gletscherflug",
    name: "Gletscherflug",
    dex: 18,
    types: ["ice"],
    base: { hp: 80, atk: 80, def: 78, spa: 110, spd: 90, spe: 100 },
    moves: ["frostshard", "frostbite", "iceslide", "icebreath"],
    buyable: false,
    radius: 17,
    height: 64,
    blurb: "Ein majest\xE4tischer Eisvogel. Seine Schwingen bringen Hagel und Schneesturm."
  },
  fetzling: {
    id: "fetzling",
    name: "Fetzling",
    dex: 19,
    types: ["ghost"],
    base: { hp: 40, atk: 46, def: 38, spa: 62, spd: 52, spe: 80 },
    moves: ["shadowball", "veilslash", "ghostleap", "spookfire"],
    evolvesTo: { id: "schleierich", level: 14 },
    radius: 11,
    height: 44,
    blurb: "Ein zerlumptes Spukgesch\xF6pf. Es huscht durch die Arena und erschreckt gern."
  },
  schleierich: {
    id: "schleierich",
    name: "Schleierich",
    dex: 20,
    types: ["ghost"],
    base: { hp: 58, atk: 64, def: 54, spa: 88, spd: 72, spe: 98 },
    moves: ["shadowball", "veilslash", "ghostleap", "spookfire"],
    evolvesTo: { id: "nachtnaht", level: 22 },
    buyable: false,
    radius: 14,
    height: 54,
    blurb: "Ein schwebender Schleiergeist. Trifft aus dem Nichts und verschwindet wieder."
  },
  nachtnaht: {
    id: "nachtnaht",
    name: "Nachtnaht",
    dex: 21,
    types: ["ghost"],
    base: { hp: 76, atk: 88, def: 72, spa: 112, spd: 94, spe: 110 },
    moves: ["shadowball", "veilslash", "ghostleap", "spookfire"],
    buyable: false,
    radius: 16,
    height: 64,
    blurb: "Ein gekr\xF6nter Geist in nachtviolettem Umhang. Seine N\xE4hte halten die Dunkelheit zusammen."
  },
  knospenkrab: {
    id: "knospenkrab",
    name: "Knospenkrab",
    dex: 22,
    types: ["grass"],
    base: { hp: 54, atk: 50, def: 66, spa: 54, spd: 58, spe: 42 },
    moves: ["leafvolley", "vinewhip", "rootrush", "bloomstorm"],
    evolvesTo: { id: "farnschreck", level: 14 },
    radius: 11,
    height: 46,
    blurb: "Eine Schildkr\xF6te mit Knospe auf dem Panzer. Gem\xE4chlich, z\xE4h und voller Pflanzenkraft."
  },
  farnschreck: {
    id: "farnschreck",
    name: "Farnschreck",
    dex: 23,
    types: ["grass"],
    base: { hp: 64, atk: 80, def: 64, spa: 86, spd: 68, spe: 80 },
    moves: ["leafvolley", "vinewhip", "rootrush", "bloomstorm"],
    evolvesTo: { id: "orchideva", level: 22 },
    buyable: false,
    radius: 14,
    height: 54,
    blurb: "Eine elegante Blattmantis. Mit ihren Farnsicheln schneidet sie blitzschnell zu."
  },
  orchideva: {
    id: "orchideva",
    name: "Orchideva",
    dex: 24,
    types: ["grass"],
    base: { hp: 80, atk: 102, def: 76, spa: 110, spd: 84, spe: 88 },
    moves: ["leafvolley", "vinewhip", "rootrush", "bloomstorm"],
    buyable: false,
    radius: 17,
    height: 64,
    blurb: "Eine pr\xE4chtige Orchideenmantis. Ihre Bl\xFCtenschwingen bet\xF6ren und zerschneiden zugleich."
  },
  raureif: {
    id: "raureif",
    name: "Raureif",
    dex: 25,
    types: ["ice"],
    base: { hp: 61, atk: 57, def: 68, spa: 45, spd: 59, spe: 40 },
    moves: ["frostshard", "frostbite", "iceslide", "icebreath"],
    radius: 15,
    height: 54,
    blurb: "Ein zotteliger Eisb\xFCffel mit Gletscherh\xF6rnern. Rammt Gegner und l\xE4sst kaum etwas durch."
  },
  dunstkalmar: {
    id: "dunstkalmar",
    name: "Dunstkalmar",
    dex: 26,
    types: ["ghost"],
    base: { hp: 44, atk: 40, def: 44, spa: 66, spd: 60, spe: 64 },
    moves: ["shadowball", "veilslash", "ghostleap", "spookfire"],
    radius: 13,
    height: 54,
    blurb: "Ein schwebender Nebelkalmar. Seine B\xE4nder ziehen den Gegner in den Dunst."
  },
  windstelz: {
    id: "windstelz",
    name: "Windstelz",
    dex: 27,
    types: ["wind"],
    base: { hp: 47, atk: 68, def: 45, spa: 66, spd: 52, spe: 99 },
    moves: ["windcutter", "gustpeck", "galedash", "cyclone"],
    radius: 12,
    height: 58,
    blurb: "Ein schlanker Sekret\xE4rvogel auf langen Beinen. Tritt blitzschnell zu und t\xE4nzelt davon."
  },
  sporenschleim: {
    id: "sporenschleim",
    name: "Sporenschleim",
    dex: 28,
    types: ["poison"],
    base: { hp: 59, atk: 43, def: 55, spa: 59, spd: 57, spe: 28 },
    moves: ["toxdart", "sludgebite", "slimeslide", "toxicspray"],
    radius: 14,
    height: 50,
    blurb: "Eine breite Schnecke mit Pilzgarten auf dem R\xFCcken. Gem\xE4chlich, aber ihr Gift wirkt lange."
  },
  bronzepanzer: {
    id: "bronzepanzer",
    name: "Bronzepanzer",
    dex: 29,
    types: ["metal"],
    base: { hp: 52, atk: 60, def: 74, spa: 40, spd: 58, spe: 36 },
    moves: ["steelshard", "ironhit", "bronzecharge", "lasercut"],
    radius: 16,
    height: 50,
    blurb: "Ein Hufeisenkrebs mit Bronzepanzer. Langsam, aber fast unzerst\xF6rbar."
  },
  lichtglocke: {
    id: "lichtglocke",
    name: "Lichtglocke",
    dex: 30,
    types: ["light"],
    base: { hp: 50, atk: 39, def: 48, spa: 73, spd: 71, spe: 63 },
    moves: ["lightorb", "glowtouch", "flashleap", "holybeam"],
    radius: 11,
    height: 46,
    blurb: "Eine kleine Quallenglocke aus Bernsteinglas. Ihr Schein blendet und heilt zugleich."
  },
  duenenhupf: {
    id: "duenenhupf",
    name: "D\xFCnenhupf",
    dex: 31,
    types: ["earth"],
    base: { hp: 46, atk: 66, def: 46, spa: 44, spd: 48, spe: 97 },
    moves: ["dirtshot", "burrowhit", "sandleap", "sandblast"],
    radius: 12,
    height: 52,
    blurb: "Eine flinke W\xFCstenspringmaus. Huscht \xFCber D\xFCnen und gr\xE4bt sich blitzschnell ein."
  },
  quakustik: {
    id: "quakustik",
    name: "Quakustik",
    dex: 32,
    types: ["sound"],
    base: { hp: 55, atk: 47, def: 49, spa: 72, spd: 61, spe: 57 },
    moves: ["sonicpulse", "echoslap", "rumbledash", "screech"],
    radius: 15,
    height: 50,
    blurb: "Ein runder Frosch mit Resonanzblasen. Sein Quaken l\xE4sst die Arena beben."
  },
  mondschweif: {
    id: "mondschweif",
    name: "Mondschweif",
    dex: 33,
    types: ["dark"],
    base: { hp: 46, atk: 68, def: 44, spa: 64, spd: 51, spe: 90 },
    moves: ["nightshard", "shadowclaw", "pounce", "darkpulse"],
    radius: 12,
    height: 50,
    blurb: "Eine schlanke Schleichkatze mit Mondzeichen. Schl\xE4gt aus dem Dunkel zu."
  },
  drusella: {
    id: "drusella",
    name: "Drusella",
    dex: 34,
    types: ["crystal"],
    base: { hp: 54, atk: 46, def: 68, spa: 56, spd: 63, spe: 27 },
    moves: ["prismshard", "geodehit", "crystalroll", "prismbeam"],
    radius: 13,
    height: 52,
    blurb: "Eine Schnecke mit Amethyst-Geode als Haus. Langsam, aber ihre Kristalle brechen das Licht zu Strahlen."
  }
};
function formAt(id, level) {
  let cur = SPECIES[id];
  while (cur?.evolvesTo && level >= cur.evolvesTo.level) cur = SPECIES[cur.evolvesTo.id];
  return cur?.id ?? id;
}
var SPECIES_IDS = Object.keys(SPECIES);
var EVO_TARGETS = new Set(SPECIES_IDS.map((k) => SPECIES[k].evolvesTo?.id).filter(Boolean));
var isSingle = (id) => !SPECIES[id].evolvesTo && !EVO_TARGETS.has(id);
var singleGrowth = (level) => 1 + 0.38 * Math.min(1, Math.max(0, (level - 10) / 6)) + 0.33 * Math.min(1, Math.max(0, (level - 20) / 6));
var BASE_IDS = SPECIES_IDS.filter((id) => SPECIES[id].buyable !== false);
var NATURES = {
  brave: {
    id: "brave",
    name: "Mutig",
    blurb: "St\xFCrmt direkt ran, liebt den Nahkampf.",
    range: 0.55,
    dodge: 0.3,
    aggression: 1,
    hitAndRun: 0,
    orbit: 0.5,
    lead: 0.4,
    speed: 1,
    weights: { melee: 1.35, dash: 1.3, projectile: 0.85, aoe: 1, cone: 1.25 },
    trait: { name: "Kampfgeist", desc: "UNTER 50% KP: +12% SCHADEN." }
  },
  timid: {
    id: "timid",
    name: "Scheu",
    blurb: "H\xE4lt Abstand, weicht oft aus, schie\xDFt aus der Ferne.",
    range: 1.25,
    dodge: 0.8,
    aggression: 0.45,
    hitAndRun: 0.3,
    orbit: 1,
    lead: 0.7,
    speed: 1.05,
    weights: { melee: 0.6, dash: 0.8, projectile: 1.3, aoe: 1.1, cone: 0.9 },
    trait: { name: "Wachsam", desc: "AUSWEICHEN L\xC4DT 25% SCHNELLER NACH." }
  },
  hasty: {
    id: "hasty",
    name: "Hastig",
    blurb: "Zuschlagen und wegflitzen \u2013 Hit & Run.",
    range: 0.8,
    dodge: 0.55,
    aggression: 0.75,
    hitAndRun: 0.95,
    orbit: 1.3,
    lead: 0.5,
    speed: 1.12,
    weights: { melee: 1.1, dash: 1.4, projectile: 1, aoe: 0.9, cone: 0.9 },
    trait: { name: "Flinkheit", desc: "ERHOLT SICH 25% SCHNELLER NACH ANGRIFFEN." }
  },
  sly: {
    id: "sly",
    name: "Listig",
    blurb: "Zielt voraus, nutzt Spezialangriffe und lauert.",
    range: 1,
    dodge: 0.65,
    aggression: 0.6,
    hitAndRun: 0.45,
    orbit: 0.8,
    lead: 1,
    speed: 1,
    weights: { melee: 0.8, dash: 0.9, projectile: 1.1, aoe: 1.6, cone: 1.4 },
    trait: { name: "Kalk\xFCl", desc: "VOLLTREFFER-CHANCE VERDOPPELT (14%)." }
  },
  calm: {
    id: "calm",
    name: "Ruhig",
    blurb: "Bleibt gelassen, k\xE4mpft ausgewogen und h\xE4lt viel aus.",
    range: 0.95,
    dodge: 0.5,
    aggression: 0.7,
    hitAndRun: 0.2,
    orbit: 0.7,
    lead: 0.7,
    speed: 1,
    weights: { melee: 1, dash: 0.9, projectile: 1, aoe: 1.1, cone: 1.1 },
    trait: { name: "Z\xE4higkeit", desc: "ERH\xC4LT 8% WENIGER SCHADEN." }
  }
};
var NATURE_IDS = Object.keys(NATURES);
var TACTICS = {
  attack: { name: "Angriff", aggr: 1.35, dodge: 0.75, range: 0.8, blurb: "ANGRIFF: +8% SCHADEN, SETZT NACH, WEICHT SELTENER AUS." },
  balanced: { name: "Ausgewogen", aggr: 1, dodge: 1, range: 1, blurb: "AUSGEWOGEN: FOLGT DEM WESEN DES MONSTERS." },
  counter: { name: "Konter", aggr: 0.8, dodge: 1.6, range: 1.05, blurb: "KONTER: WEICHT AM H\xC4UFIGSTEN AUS, DANACH +50% KONTER-SCHADEN. WENIG EIGENER DRUCK." },
  defend: { name: "Defensiv", aggr: 0.7, dodge: 1.3, range: 1.25, blurb: "DEFENSIV: -8% SCHADEN, WEICHT OFT AUS, LANGES KONTER-FENSTER." }
};
function baseForm(id) {
  let cur = id;
  for (let i = 0; i < 5; i++) {
    const parent = SPECIES_IDS.find((k) => SPECIES[k].evolvesTo?.id === cur);
    if (!parent) break;
    cur = parent;
  }
  return cur;
}
var MAX_MOVES = 4;
var LEARNSETS = {
  glimmdra: [["sparkburst", 1], ["clawswipe", 1], ["dragonfire", 1], ["glare", 1], ["blazerush", 11], ["heatup", 13], ["magmaball", 16], ["firerain", 19], ["dragondance", 21], ["inferno", 24]],
  tropfling: [["pearlshot", 1], ["finslap", 1], ["torrent", 1], ["soak", 1], ["tiderush", 11], ["aquaring", 13], ["bubblebomb", 16], ["geyser", 19], ["shellguard", 21], ["tidalwave", 24]],
  knoespling: [["leafvolley", 1], ["vinewhip", 1], ["bloomstorm", 1], ["lure", 1], ["rootrush", 11], ["synthesis", 13], ["seedbomb", 16], ["thornfield", 19], ["growth", 21], ["wildwrath", 24]]
};
var SIG_IDS = { fire: ["flamering", "emberseek", "meteorfall", "blazenova"], water: ["bubblering", "aquaseek", "rainshower", "surgenova"], grass: ["seedring", "sporeseek", "thornrain", "bloomnova"] };
var FAM = {
  electric: ["zapshot", "nipbite", "voltleap", "thunderbeam", "charge", "chainbolt", "stormfield", "thunderstorm", "shock", "overload", "staticveil", "sparkring", "ballbolt", "boltrain", "plasmanova"],
  rock: ["pebbleshot", "rockbreaker", "stoneroll", "dustbeam", "rockrage", "boulder", "quake", "mountainfall", "dustcloud", "stonearmor", "rockwall", "rockring", "rubbleseek", "meteorshower", "quakenova"],
  ice: ["frostshard", "frostbite", "iceslide", "icebreath", "coldfocus", "iceball", "hailstorm", "blizzard", "chill", "icedance", "iceshell", "frostring", "snowseek", "iciclerain", "frostnova"],
  ghost: ["shadowball", "veilslash", "ghostleap", "spookfire", "haunt", "cursebolt", "spookfield", "ghoststorm", "scareface", "shadowdance", "shadowveil", "wispring", "soulseek", "spiritrain", "phantomnova"],
  wind: ["windcutter", "gustpeck", "galedash", "cyclone", "tailwind", "razorgale", "twister", "tempest", "gust", "featherdance", "airveil", "bladering", "galeseek", "featherrain", "cyclonenova"],
  poison: ["toxdart", "sludgebite", "slimeslide", "toxicspray", "venomrage", "acidblob", "sludgepool", "toxicrain", "stench", "sporeguard", "slimeshell", "acidring", "toxseek", "sporerain", "toxicnova"],
  metal: ["steelshard", "ironhit", "bronzecharge", "lasercut", "sharpen", "steelball", "gearfield", "steelrain", "rustcloud", "ironfort", "platewall", "sawring", "bladeseek", "steelhail", "steelnova"],
  light: ["lightorb", "glowtouch", "flashleap", "holybeam", "radiance", "sunspear", "lightpillar", "dawn", "dazzle", "blessing", "lightshield", "starring", "beamseek", "starfall", "solarnova"],
  earth: ["dirtshot", "burrowhit", "sandleap", "sandblast", "dunefocus", "claybomb", "sinkhole", "upheaval", "sandtrap", "burrowup", "sandwall", "pebblering", "dustseek", "stonefount", "sandnova"],
  sound: ["sonicpulse", "echoslap", "rumbledash", "screech", "amplify", "bassbomb", "resonance", "symphony", "discord", "harmony", "soundwall", "noteburst", "echoseek", "bassrain", "soundnova"],
  dark: ["nightshard", "shadowclaw", "pounce", "darkpulse", "menace", "voidorb", "blackhole", "eclipse", "taunt", "nightcloak", "darkveil", "shadering", "voidseek", "shadowrain", "voidnova"],
  crystal: ["prismshard", "geodehit", "crystalroll", "prismbeam", "resonate", "amethyst", "crystalbloom", "geodestorm", "refract", "faceting", "crystalshell", "prismring", "gemseek", "shardstorm", "diamondnova"]
};
var SLOT_LV = [1, 1, 1, 1, 6, 9, 11, 13, 14, 16, 19, 21, 22, 24, 27];
var KEYS = "sedbulftwngrkav";
var kit = (type, order = "sebwrgduklfnatv") => [...order].map((c, i) => [FAM[type][KEYS.indexOf(c)], SLOT_LV[i]]);
Object.assign(LEARNSETS, {
  funkelkrabb: kit("electric"),
  kieselbud: kit("rock"),
  flockfiep: kit("ice"),
  fetzling: kit("ghost"),
  knospenkrab: LEARNSETS.knoespling,
  // Einzelgänger: eigene Reihenfolge, die zum Kampfstil passt
  raureif: kit("ice", "egbwrsduklfnatv"),
  dunstkalmar: kit("ghost", "swkbrgdulafnetv"),
  windstelz: kit("wind", "edswrbguklfnatv"),
  sporenschleim: kit("poison", "sbwgrdulkfnaetv"),
  bronzepanzer: kit("metal", "egdbwruslkfntav"),
  lichtglocke: kit("light", "sbwgurkdlfnaetv"),
  duenenhupf: kit("earth", "edswrbguklfnatv"),
  quakustik: kit("sound", "sbwgrdulkfnaetv"),
  mondschweif: kit("dark", "edbwrgusklfnatv"),
  drusella: kit("crystal", "ebgwrsdulkfnatv")
});
for (const [line, type] of [["glimmdra", "fire"], ["tropfling", "water"], ["knoespling", "grass"]]) {
  const sg = SIG_IDS[type];
  LEARNSETS[line].push([sg[0], 6], [sg[1], 14], [sg[2], 22], [sg[3], 27]);
}
LEARNSETS.knospenkrab = LEARNSETS.knoespling;
var learnset = (sp) => LEARNSETS[baseForm(sp)] ?? SPECIES[sp].moves.map((m) => [m, 1]);
var learnedMoves = (sp, level) => learnset(sp).filter(([, l]) => l <= level).map(([m]) => m);
var starterMoves = (sp, level) => learnedMoves(sp, level).slice(0, MAX_MOVES);

// src/data/moves.ts
var MOVES = {
  /** Fächer aus drei Feuerbällen */
  sparkburst: {
    id: "sparkburst",
    name: "Funkenschwarm",
    type: "fire",
    kind: "projectile",
    physical: false,
    power: 40,
    cooldown: 1.6,
    windup: 0.28,
    recover: 0.2,
    range: 115,
    minRange: 22,
    speed: 135,
    radius: 4.5,
    status: { id: "burn", chance: 0.18 },
    shots: 3,
    spread: 0.2,
    shotScale: 0.46
  },
  /** Schneller Nahkampfhieb */
  clawswipe: {
    id: "clawswipe",
    name: "Krallenhieb",
    type: "normal",
    kind: "melee",
    physical: true,
    power: 40,
    cooldown: 1,
    windup: 0.16,
    recover: 0.2,
    range: 34,
    radius: 34,
    arc: 1
  },
  /** Feuriger Sturmangriff */
  blazerush: {
    id: "blazerush",
    name: "Flammenrausch",
    type: "fire",
    kind: "dash",
    physical: true,
    power: 50,
    cooldown: 3.6,
    windup: 0.22,
    recover: 0.3,
    range: 96,
    minRange: 30,
    speed: 300,
    radius: 10,
    status: { id: "burn", chance: 0.25 }
  },
  /** Spezial: gehaltener Feuerstrahl */
  dragonfire: {
    id: "dragonfire",
    name: "Drachenglut",
    type: "fire",
    kind: "cone",
    physical: false,
    power: 90,
    cooldown: 7,
    windup: 0.45,
    recover: 0.3,
    range: 66,
    minRange: 0,
    radius: 66,
    arc: 0.45,
    duration: 1,
    status: { id: "burn", chance: 0.5 },
    special: true,
    armor: true
  },
  // ── Wasser ──
  /** Salve aus drei Wasserperlen */
  pearlshot: {
    id: "pearlshot",
    name: "Perlschuss",
    type: "water",
    kind: "projectile",
    physical: false,
    power: 40,
    cooldown: 1.5,
    windup: 0.3,
    recover: 0.2,
    range: 115,
    minRange: 22,
    speed: 160,
    radius: 4,
    shots: 3,
    interval: 0.09,
    shotScale: 0.47
  },
  /** Wuchtiger Flossenhieb */
  finslap: {
    id: "finslap",
    name: "Flossenhieb",
    type: "water",
    kind: "melee",
    physical: true,
    power: 42,
    cooldown: 1,
    windup: 0.18,
    recover: 0.2,
    range: 34,
    radius: 34,
    arc: 1.1
  },
  /** Sturmangriff auf einer Welle */
  tiderush: {
    id: "tiderush",
    name: "Wellenritt",
    type: "water",
    kind: "dash",
    physical: true,
    power: 50,
    cooldown: 3.6,
    windup: 0.22,
    recover: 0.3,
    range: 96,
    minRange: 30,
    speed: 290,
    radius: 10
  },
  /** Spezial: gehaltener Wasserstrahl */
  torrent: {
    id: "torrent",
    name: "Strudelstrahl",
    type: "water",
    kind: "cone",
    physical: false,
    power: 100,
    cooldown: 7,
    windup: 0.5,
    recover: 0.3,
    range: 72,
    radius: 72,
    arc: 0.4,
    duration: 1,
    special: true,
    armor: true
  },
  // ── Pflanze ──
  /** Fächer aus drei Blättern */
  leafvolley: {
    id: "leafvolley",
    name: "Blattsalve",
    type: "grass",
    kind: "projectile",
    physical: false,
    power: 40,
    cooldown: 1.6,
    windup: 0.28,
    recover: 0.2,
    range: 115,
    minRange: 22,
    speed: 140,
    radius: 4.5,
    shots: 3,
    spread: 0.22,
    shotScale: 0.46
  },
  /** Peitschende Ranke mit großer Reichweite, saugt etwas Kraft ab */
  vinewhip: {
    id: "vinewhip",
    name: "Rankenpeitsche",
    type: "grass",
    kind: "melee",
    physical: true,
    power: 42,
    cooldown: 1.1,
    windup: 0.2,
    recover: 0.2,
    range: 38,
    radius: 38,
    arc: 0.9,
    drain: 0.06
  },
  /** Sturmangriff auf Wurzeln */
  rootrush: {
    id: "rootrush",
    name: "Wurzelsprint",
    type: "grass",
    kind: "dash",
    physical: true,
    power: 50,
    cooldown: 3.6,
    windup: 0.22,
    recover: 0.3,
    range: 96,
    minRange: 30,
    speed: 295,
    radius: 10
  },
  /** Spezial: Blütenstrahl, heilt beim Treffen */
  bloomstorm: {
    id: "bloomstorm",
    name: "Bl\xFCtensturm",
    type: "grass",
    kind: "cone",
    physical: false,
    power: 90,
    cooldown: 7,
    windup: 0.5,
    recover: 0.3,
    range: 70,
    radius: 70,
    arc: 0.42,
    duration: 1,
    special: true,
    armor: true,
    drain: 0.05
  },
  // ── Lernbare Attacken ──
  heatup: { id: "heatup", name: "Anheizen", type: "fire", kind: "self", physical: false, power: 0, cooldown: 15, windup: 0.5, recover: 0.2, range: 999, buff: 7 },
  magmaball: { id: "magmaball", name: "Magmakugel", type: "fire", kind: "projectile", physical: false, power: 72, cooldown: 4.8, windup: 0.5, recover: 0.3, range: 125, minRange: 30, speed: 112, radius: 7, status: { id: "burn", chance: 0.4 } },
  firerain: { id: "firerain", name: "Feuerregen", type: "fire", kind: "aoe", physical: false, power: 78, cooldown: 8, windup: 0.9, recover: 0.3, range: 150, minRange: 30, radius: 24, status: { id: "burn", chance: 0.35 } },
  inferno: { id: "inferno", name: "Inferno", type: "fire", kind: "aoe", physical: false, power: 112, cooldown: 11, windup: 1.15, recover: 0.4, range: 150, minRange: 20, radius: 34, status: { id: "burn", chance: 0.6 }, special: true, armor: true },
  aquaring: { id: "aquaring", name: "Aquaring", type: "water", kind: "self", physical: false, power: 0, cooldown: 22, windup: 0.6, recover: 0.2, range: 999, heal: 0.13 },
  bubblebomb: { id: "bubblebomb", name: "Blasenbombe", type: "water", kind: "projectile", physical: false, power: 72, cooldown: 4.8, windup: 0.5, recover: 0.3, range: 125, minRange: 30, speed: 108, radius: 7, foeStage: { stat: "spe", n: -1, chance: 0.6 } },
  geyser: { id: "geyser", name: "Geysir", type: "water", kind: "aoe", physical: false, power: 80, cooldown: 8, windup: 0.9, recover: 0.3, range: 150, minRange: 30, radius: 24 },
  tidalwave: { id: "tidalwave", name: "Flutwelle", type: "water", kind: "aoe", physical: false, power: 114, cooldown: 11, windup: 1.15, recover: 0.4, range: 150, minRange: 20, radius: 34, special: true, armor: true },
  synthesis: { id: "synthesis", name: "Synthese", type: "grass", kind: "self", physical: false, power: 0, cooldown: 22, windup: 0.6, recover: 0.2, range: 999, heal: 0.13 },
  seedbomb: { id: "seedbomb", name: "Samenbombe", type: "grass", kind: "projectile", physical: true, power: 72, cooldown: 4.8, windup: 0.5, recover: 0.3, range: 125, minRange: 30, speed: 110, radius: 7, foeStage: { stat: "def", n: -1, chance: 0.6 } },
  thornfield: { id: "thornfield", name: "Dornenfeld", type: "grass", kind: "aoe", physical: false, power: 76, cooldown: 8, windup: 0.9, recover: 0.3, range: 150, minRange: 30, radius: 24, drain: 0.1 },
  wildwrath: { id: "wildwrath", name: "Urwaldzorn", type: "grass", kind: "aoe", physical: false, power: 110, cooldown: 11, windup: 1.15, recover: 0.4, range: 150, minRange: 20, radius: 34, special: true, armor: true, drain: 0.08 },
  // ── Schriftrollen (für jedes Monster lernbar) ──
  ramcharge: { id: "ramcharge", name: "Rammsto\xDF", type: "normal", kind: "dash", physical: true, power: 55, cooldown: 4, windup: 0.25, recover: 0.3, range: 100, minRange: 30, speed: 300, radius: 10, scroll: 380 },
  aimshot: { id: "aimshot", name: "Zielschuss", type: "normal", kind: "projectile", physical: false, power: 48, cooldown: 2.4, windup: 0.3, recover: 0.2, range: 140, minRange: 30, speed: 230, radius: 4, scroll: 380 },
  rockfall: { id: "rockfall", name: "Steinschlag", type: "normal", kind: "aoe", physical: true, power: 74, cooldown: 8, windup: 0.85, recover: 0.3, range: 150, minRange: 30, radius: 24, scroll: 450 },
  guardwall: { id: "guardwall", name: "Schutzwall", type: "normal", kind: "self", physical: false, power: 0, cooldown: 16, windup: 0.4, recover: 0.2, range: 999, shield: 0.2, scroll: 450 },
  warcry: { id: "warcry", name: "Kampfschrei", type: "normal", kind: "self", physical: false, power: 0, cooldown: 14, windup: 0.6, recover: 0.2, range: 999, stages: [{ stat: "atk", n: 1 }], scroll: 420 },
  mending: { id: "mending", name: "Heilwelle", type: "normal", kind: "self", physical: false, power: 0, cooldown: 22, windup: 0.6, recover: 0.2, range: 999, heal: 0.13, scroll: 480 },
  // ── Werte verändern (wie in den Vorbildern: schwächen und stärken) ──
  glare: { id: "glare", name: "Glutblick", type: "fire", kind: "status", physical: false, power: 0, cooldown: 15, windup: 0.5, recover: 0.2, range: 120, stages: [{ stat: "atk", n: -1 }] },
  soak: { id: "soak", name: "Durchn\xE4ssen", type: "water", kind: "status", physical: false, power: 0, cooldown: 11, windup: 0.5, recover: 0.2, range: 120, stages: [{ stat: "spe", n: -1 }, { stat: "atk", n: -1 }] },
  lure: { id: "lure", name: "Lockduft", type: "grass", kind: "status", physical: false, power: 0, cooldown: 11, windup: 0.5, recover: 0.2, range: 120, stages: [{ stat: "def", n: -1 }] },
  dragondance: { id: "dragondance", name: "Drachentanz", type: "fire", kind: "self", physical: false, power: 0, cooldown: 18, windup: 0.8, recover: 0.2, range: 999, stages: [{ stat: "atk", n: 1 }, { stat: "spe", n: 1 }] },
  shellguard: { id: "shellguard", name: "Panzerschale", type: "water", kind: "self", physical: false, power: 0, cooldown: 18, windup: 0.8, recover: 0.2, range: 999, stages: [{ stat: "def", n: 2 }] },
  growth: { id: "growth", name: "Wachstum", type: "grass", kind: "self", physical: false, power: 0, cooldown: 24, windup: 0.8, recover: 0.2, range: 999, stages: [{ stat: "atk", n: 1 }, { stat: "def", n: 1 }] },
  growl: { id: "growl", name: "Knurrer", type: "normal", kind: "status", physical: false, power: 0, cooldown: 11, windup: 0.5, recover: 0.2, range: 120, stages: [{ stat: "atk", n: -1 }], scroll: 360 },
  scaryface: { id: "scaryface", name: "Grimasse", type: "normal", kind: "status", physical: false, power: 0, cooldown: 12, windup: 0.5, recover: 0.2, range: 120, stages: [{ stat: "spe", n: -2 }], scroll: 420 },
  harden: { id: "harden", name: "H\xE4rtner", type: "normal", kind: "self", physical: false, power: 0, cooldown: 13, windup: 0.5, recover: 0.2, range: 999, stages: [{ stat: "def", n: 1 }], scroll: 360 },
  agility: { id: "agility", name: "Agilit\xE4t", type: "normal", kind: "self", physical: false, power: 0, cooldown: 16, windup: 0.6, recover: 0.2, range: 999, stages: [{ stat: "spe", n: 2 }], scroll: 420 }
};
function family(type, n, o) {
  const st = (c) => o.st ? { status: { id: o.st, chance: c } } : {};
  const d = (id, name, x) => [id, { id, name, type, physical: false, power: 0, cooldown: 1, windup: 0.3, recover: 0.2, range: 115, kind: "projectile", ...x }];
  const p = !!o.phys;
  return Object.fromEntries([
    d(n.shot[0], n.shot[1], { kind: "projectile", physical: p, power: 40, cooldown: 1.6, windup: 0.28, minRange: 22, speed: 135, radius: 4.5, shots: 3, spread: 0.2, shotScale: 0.46, ...st(0.15) }),
    d(n.melee[0], n.melee[1], { kind: "melee", physical: true, power: 42, cooldown: 1, windup: 0.18, range: 34, radius: 34, arc: 1.05, ...o.drain ? { drain: o.drain } : {} }),
    d(n.dash[0], n.dash[1], { kind: "dash", physical: true, power: 50, cooldown: 3.6, windup: 0.22, recover: 0.3, range: 96, minRange: 30, speed: 295, radius: 10, ...st(0.2) }),
    d(n.beam[0], n.beam[1], { kind: "cone", physical: p, power: 92, cooldown: 7, windup: 0.48, recover: 0.3, range: 68, minRange: 0, radius: 68, arc: 0.43, duration: 1, special: true, armor: true, ...st(0.45), ...o.foe ? { foeStage: o.foe } : {}, ...o.drain ? { drain: o.drain } : {} }),
    d(n.buff[0], n.buff[1], { kind: "self", power: 0, cooldown: 15, windup: 0.5, range: 999, buff: 7 }),
    d(n.ball[0], n.ball[1], { kind: "projectile", physical: p, power: 72, cooldown: 4.8, windup: 0.5, recover: 0.3, range: 125, minRange: 30, speed: 110, radius: 7, ...o.foe ? { foeStage: o.foe } : {}, ...st(0.35) }),
    d(n.field[0], n.field[1], { kind: "aoe", physical: p, power: 78, cooldown: 8, windup: 0.9, recover: 0.3, range: 150, minRange: 30, radius: 24, ...st(0.3), ...o.drain ? { drain: o.drain } : {} }),
    d(n.storm[0], n.storm[1], { kind: "aoe", physical: p, power: 112, cooldown: 11, windup: 1.15, recover: 0.4, range: 150, minRange: 20, radius: 34, special: true, armor: true, ...st(0.5), ...o.drain ? { drain: o.drain } : {} }),
    d(n.weak[0], n.weak[1], { kind: "status", cooldown: 13, windup: 0.5, range: 120, stages: o.weak }),
    d(n.tune[0], n.tune[1], { kind: "self", cooldown: 18, windup: 0.8, range: 999, stages: o.tune }),
    d(n.guard[0], n.guard[1], { kind: "self", cooldown: 16, windup: 0.5, range: 999, shield: 0.2 })
  ]);
}
Object.assign(
  MOVES,
  family("electric", { shot: ["zapshot", "Funkenblitz"], melee: ["nipbite", "Zwickbiss"], dash: ["voltleap", "Blitzsprung"], beam: ["thunderbeam", "Donnerstrahl"], buff: ["charge", "Aufladen"], ball: ["chainbolt", "Kettenblitz"], field: ["stormfield", "Gewitterfeld"], storm: ["thunderstorm", "Gewittersturm"], weak: ["shock", "Stromschlag"], tune: ["overload", "\xDCberladung"], guard: ["staticveil", "Statikschleier"] }, { st: "para", weak: [{ stat: "spe", n: -1 }, { stat: "def", n: -1 }], tune: [{ stat: "atk", n: 1 }, { stat: "spe", n: 1 }] }),
  family("rock", { shot: ["pebbleshot", "Ger\xF6llschuss"], melee: ["rockbreaker", "Felsbrecher"], dash: ["stoneroll", "Steinwalze"], beam: ["dustbeam", "Staubstrahl"], buff: ["rockrage", "Steinzorn"], ball: ["boulder", "Felsbrocken"], field: ["quake", "Erdbeben"], storm: ["mountainfall", "Bergsturz"], weak: ["dustcloud", "Staubwolke"], tune: ["stonearmor", "Steinpanzer"], guard: ["rockwall", "Felswall"] }, { phys: true, foe: { stat: "spe", n: -1, chance: 0.5 }, weak: [{ stat: "spe", n: -1 }, { stat: "atk", n: -1 }], tune: [{ stat: "def", n: 2 }] }),
  family("ice", { shot: ["frostshard", "Eissplitter"], melee: ["frostbite", "Frostbiss"], dash: ["iceslide", "Eisrutsche"], beam: ["icebreath", "Eisatem"], buff: ["coldfocus", "K\xE4ltefokus"], ball: ["iceball", "Eiskugel"], field: ["hailstorm", "Hagelregen"], storm: ["blizzard", "Blizzard"], weak: ["chill", "K\xE4lteschauer"], tune: ["icedance", "Eistanz"], guard: ["iceshell", "Eispanzer"] }, { foe: { stat: "spe", n: -1, chance: 0.5 }, weak: [{ stat: "atk", n: -1 }, { stat: "spe", n: -1 }], tune: [{ stat: "def", n: 1 }, { stat: "spe", n: 1 }] }),
  family("ghost", { shot: ["shadowball", "Schattenball"], melee: ["veilslash", "Schleierhieb"], dash: ["ghostleap", "Geistersprung"], beam: ["spookfire", "Spukglut"], buff: ["haunt", "Spuk"], ball: ["cursebolt", "Fluchkugel"], field: ["spookfield", "Spukfeld"], storm: ["ghoststorm", "Geistersturm"], weak: ["scareface", "Schreckgesicht"], tune: ["shadowdance", "Schattentanz"], guard: ["shadowveil", "Schattenh\xFClle"] }, { foe: { stat: "atk", n: -1, chance: 0.5 }, drain: 0.05, weak: [{ stat: "def", n: -1 }, { stat: "atk", n: -1 }], tune: [{ stat: "atk", n: 1 }, { stat: "spe", n: 1 }] })
);
Object.assign(
  MOVES,
  family("wind", { shot: ["windcutter", "Windklinge"], melee: ["gustpeck", "Sturmpicken"], dash: ["galedash", "Sturmflug"], beam: ["cyclone", "Wirbelstrahl"], buff: ["tailwind", "R\xFCckenwind"], ball: ["razorgale", "Schneidesturm"], field: ["twister", "Wirbelsturm"], storm: ["tempest", "Orkan"], weak: ["gust", "Windsto\xDF"], tune: ["featherdance", "Federtanz"], guard: ["airveil", "Luftschleier"] }, { foe: { stat: "spe", n: -1, chance: 0.5 }, weak: [{ stat: "spe", n: -2 }], tune: [{ stat: "spe", n: 2 }] }),
  family("poison", { shot: ["toxdart", "Giftpfeil"], melee: ["sludgebite", "Schlammbiss"], dash: ["slimeslide", "Schleimrutsche"], beam: ["toxicspray", "Giftgischt"], buff: ["venomrage", "Giftzorn"], ball: ["acidblob", "S\xE4ureklumpen"], field: ["sludgepool", "Giftsumpf"], storm: ["toxicrain", "Giftregen"], weak: ["stench", "Gestank"], tune: ["sporeguard", "Sporenschutz"], guard: ["slimeshell", "Schleimpanzer"] }, { st: "poison", foe: { stat: "def", n: -1, chance: 0.5 }, weak: [{ stat: "atk", n: -1 }, { stat: "def", n: -1 }], tune: [{ stat: "def", n: 1 }, { stat: "spe", n: 1 }] }),
  family("metal", { shot: ["steelshard", "Stahlsplitter"], melee: ["ironhit", "Eisenhieb"], dash: ["bronzecharge", "Bronzesturm"], beam: ["lasercut", "Metallstrahl"], buff: ["sharpen", "Sch\xE4rfen"], ball: ["steelball", "Stahlkugel"], field: ["gearfield", "Zahnradfeld"], storm: ["steelrain", "Stahlregen"], weak: ["rustcloud", "Rostwolke"], tune: ["ironfort", "Eisenfestung"], guard: ["platewall", "Plattenwall"] }, { phys: true, foe: { stat: "def", n: -1, chance: 0.5 }, weak: [{ stat: "def", n: -2 }], tune: [{ stat: "def", n: 2 }] }),
  family("light", { shot: ["lightorb", "Lichtkugel"], melee: ["glowtouch", "Leuchtschlag"], dash: ["flashleap", "Lichtsprung"], beam: ["holybeam", "Heiliger Strahl"], buff: ["radiance", "Strahlkraft"], ball: ["sunspear", "Sonnenspeer"], field: ["lightpillar", "Lichts\xE4ule"], storm: ["dawn", "Morgenglanz"], weak: ["dazzle", "Blenden"], tune: ["blessing", "Segen"], guard: ["lightshield", "Lichtschild"] }, { foe: { stat: "atk", n: -1, chance: 0.4 }, drain: 0.05, weak: [{ stat: "atk", n: -1 }, { stat: "spe", n: -1 }], tune: [{ stat: "atk", n: 1 }, { stat: "def", n: 1 }] }),
  family("earth", { shot: ["dirtshot", "Erdschuss"], melee: ["burrowhit", "Grabschlag"], dash: ["sandleap", "Sandsprung"], beam: ["sandblast", "Sandstrahl"], buff: ["dunefocus", "D\xFCnenkraft"], ball: ["claybomb", "Lehmbombe"], field: ["sinkhole", "Sandloch"], storm: ["upheaval", "Erdbeben"], weak: ["sandtrap", "Sandfalle"], tune: ["burrowup", "Eingraben"], guard: ["sandwall", "Sandwall"] }, { phys: true, foe: { stat: "spe", n: -1, chance: 0.5 }, weak: [{ stat: "spe", n: -2 }], tune: [{ stat: "def", n: 1 }, { stat: "spe", n: 1 }] }),
  family("sound", { shot: ["sonicpulse", "Schallwelle"], melee: ["echoslap", "Echoschlag"], dash: ["rumbledash", "Dr\xF6hnlauf"], beam: ["screech", "Kreischstrahl"], buff: ["amplify", "Verst\xE4rker"], ball: ["bassbomb", "Basswucht"], field: ["resonance", "Resonanzfeld"], storm: ["symphony", "Sinfonie"], weak: ["discord", "Missklang"], tune: ["harmony", "Harmonie"], guard: ["soundwall", "Schallwand"] }, { foe: { stat: "def", n: -1, chance: 0.4 }, weak: [{ stat: "atk", n: -1 }, { stat: "def", n: -1 }], tune: [{ stat: "atk", n: 1 }, { stat: "spe", n: 1 }] }),
  family("dark", { shot: ["nightshard", "Nachtsplitter"], melee: ["shadowclaw", "Schattenklaue"], dash: ["pounce", "Dunkelsprung"], beam: ["darkpulse", "Finsterstrahl"], buff: ["menace", "Bedrohung"], ball: ["voidorb", "Leerekugel"], field: ["blackhole", "Schwarzes Loch"], storm: ["eclipse", "Finsternis"], weak: ["taunt", "Spott"], tune: ["nightcloak", "Nachtmantel"], guard: ["darkveil", "Dunkelschleier"] }, { phys: true, foe: { stat: "atk", n: -1, chance: 0.4 }, weak: [{ stat: "atk", n: -1 }, { stat: "def", n: -1 }], tune: [{ stat: "atk", n: 1 }, { stat: "spe", n: 1 }] }),
  family("crystal", { shot: ["prismshard", "Prismensplitter"], melee: ["geodehit", "Geodenschlag"], dash: ["crystalroll", "Kristallrolle"], beam: ["prismbeam", "Prismastrahl"], buff: ["resonate", "Kristallglanz"], ball: ["amethyst", "Amethystschuss"], field: ["crystalbloom", "Kristallbl\xFCte"], storm: ["geodestorm", "Geodensturm"], weak: ["refract", "Brechung"], tune: ["faceting", "Schliff"], guard: ["crystalshell", "Kristallpanzer"] }, { foe: { stat: "spe", n: -1, chance: 0.4 }, weak: [{ stat: "atk", n: -1 }, { stat: "spe", n: -1 }], tune: [{ stat: "def", n: 1 }, { stat: "atk", n: 1 }] })
);
var SIG = {
  normal: [["wheelshot", "Rundumschlag"], ["seeker", "Zielsucher"], ["stonerain", "Kieselregen"], ["shockwave", "Druckwelle"]],
  fire: [["flamering", "Flammenkranz"], ["emberseek", "Glutj\xE4ger"], ["meteorfall", "Glutmeteore"], ["blazenova", "Feuernova"]],
  water: [["bubblering", "Blasenkranz"], ["aquaseek", "Wasserj\xE4ger"], ["rainshower", "Platzregen"], ["surgenova", "Brandungswelle"]],
  grass: [["seedring", "Samenkranz"], ["sporeseek", "Sporenj\xE4ger"], ["thornrain", "Dornenregen"], ["bloomnova", "Bl\xFCtenexplosion"]],
  electric: [["sparkring", "Funkenkranz"], ["ballbolt", "Kugelblitz"], ["boltrain", "Blitzhagel"], ["plasmanova", "Plasmanova"]],
  rock: [["rockring", "Felsenkranz"], ["rubbleseek", "Ger\xF6llf\xE4nger"], ["meteorshower", "Meteorschauer"], ["quakenova", "Bebenwelle"]],
  ice: [["frostring", "Frostkranz"], ["snowseek", "Schneej\xE4ger"], ["iciclerain", "Eiszapfenregen"], ["frostnova", "Frostnova"]],
  ghost: [["wispring", "Irrlichtkranz"], ["soulseek", "Seelenj\xE4ger"], ["spiritrain", "Geisterregen"], ["phantomnova", "Geisterwoge"]],
  wind: [["bladering", "Klingenkranz"], ["galeseek", "Windj\xE4ger"], ["featherrain", "Federsturm"], ["cyclonenova", "Wirbelwand"]],
  poison: [["acidring", "S\xE4urekranz"], ["toxseek", "Giftj\xE4ger"], ["sporerain", "Sporenregen"], ["toxicnova", "Giftwolke"]],
  metal: [["sawring", "S\xE4gekranz"], ["bladeseek", "Klingenj\xE4ger"], ["steelhail", "Stahlhagel"], ["steelnova", "Metallsturm"]],
  light: [["starring", "Sternenkranz"], ["beamseek", "Lichtj\xE4ger"], ["starfall", "Sternenfall"], ["solarnova", "Sonneneruption"]],
  earth: [["pebblering", "Kieselkranz"], ["dustseek", "Staubj\xE4ger"], ["stonefount", "Felsfont\xE4ne"], ["sandnova", "Sandsturm"]],
  sound: [["noteburst", "Notenwirbel"], ["echoseek", "Echoj\xE4ger"], ["bassrain", "Bassregen"], ["soundnova", "Schallring"]],
  dark: [["shadering", "Schattenkranz"], ["voidseek", "Finsterj\xE4ger"], ["shadowrain", "Schattenregen"], ["voidnova", "Nullpunkt"]],
  crystal: [["prismring", "Prismenkranz"], ["gemseek", "Edelsteinj\xE4ger"], ["shardstorm", "Splitterhagel"], ["diamondnova", "Diamantnova"]]
};
var SIGPHYS = ["rock", "metal", "earth", "dark", "normal"];
var SIGST = { fire: "burn", electric: "para", poison: "poison" };
for (const [type, [ring, seek, rain, nova]] of Object.entries(SIG)) {
  const phys = SIGPHYS.includes(type), stt = SIGST[type];
  const sx = (c) => stt ? { status: { id: stt, chance: c } } : {};
  const base = { type, physical: phys, windup: 0.4, recover: 0.3 };
  MOVES[ring[0]] = { ...base, id: ring[0], name: ring[1], kind: "projectile", power: 38, cooldown: 6.5, windup: 0.5, range: 96, minRange: 0, speed: 125, radius: 5.5, shots: type === "wind" || type === "sound" ? 12 : 8, ring: true, shotScale: 0.5, ...sx(0.15) };
  MOVES[seek[0]] = { ...base, id: seek[0], name: seek[1], kind: "projectile", power: 44, cooldown: 5.5, windup: 0.4, range: 135, minRange: 30, speed: 92, radius: 6, shots: 3, interval: 0.2, homing: 2.4, shotScale: 0.55, ...sx(0.15) };
  MOVES[rain[0]] = { ...base, id: rain[0], name: rain[1], kind: "aoe", power: 96, cooldown: 9, windup: 1, range: 150, minRange: 30, radius: 19, multi: 4, ...sx(0.25) };
  MOVES[nova[0]] = { ...base, id: nova[0], name: nova[1], kind: "aoe", power: 100, cooldown: 10, windup: 0.85, recover: 0.4, range: 50, minRange: 0, radius: 52, nova: true, armor: true, ...sx(0.3) };
}
for (const id of ["wheelshot", "seeker", "stonerain", "shockwave"]) MOVES[id].scroll = 520;
var SCROLL_IDS = Object.keys(MOVES).filter((id) => MOVES[id].scroll);
var STAGE_NAMES = { atk: "ANGRIFF", def: "VERTEIDIGUNG", spe: "TEMPO" };
var STAGE_MAX = 3;
var STAGE_STEP = 1.13;
var stageMul = (n) => Math.pow(STAGE_STEP, n);

// src/data/items.ts
var AMULETS = {
  ember_charm: { id: "ember_charm", name: "Glutamulett", desc: "+15% Feuer-Schaden", price: 320, color: "#f08030", dmgType: "fire", dmgMul: 1.15 },
  tide_pearl: { id: "tide_pearl", name: "Gezeitenperle", desc: "+15% Wasser-Schaden", price: 320, color: "#6890f0", dmgType: "water", dmgMul: 1.15 },
  leaf_seed: { id: "leaf_seed", name: "Blattsamen", desc: "+15% Pflanzen-Schaden", price: 320, color: "#78c850", dmgType: "grass", dmgMul: 1.15 },
  guard_stone: { id: "guard_stone", name: "Schildstein", desc: "-10% erlittener Schaden", price: 380, color: "#a8a8c0", takenMul: 0.9 },
  swift_feather: { id: "swift_feather", name: "Windfeder", desc: "+10% Tempo", price: 300, color: "#e8e0a0", speedMul: 1.1 },
  life_pearl: { id: "life_pearl", name: "Lebensperle", desc: "+12% KP", price: 340, color: "#f87890", hpMul: 1.12 },
  vamp_fang: { id: "vamp_fang", name: "Saugzahn", desc: "Heilt 8% des Schadens", price: 420, color: "#c050a0", drain: 0.08 },
  thorn_mail: { id: "thorn_mail", name: "Dornenpanzer", desc: "Wirft 12% des erlittenen Schadens zur\xFCck", price: 400, color: "#5a8a3a", reflect: 0.12 },
  rage_stone: { id: "rage_stone", name: "Wutstein", desc: "+20% Schaden unter 50% KP", price: 380, color: "#d03030", rage: 1.2 },
  swap_band: { id: "swap_band", name: "Wechselband", desc: "Halbe Wartezeit beim Einwechseln", price: 300, color: "#f8f8f8", quickSwap: true },
  regen_leaf: { id: "regen_leaf", name: "Heilblatt", desc: "Heilt 0,5% KP pro Sekunde", price: 420, color: "#70e0a0", regen: 5e-3 },
  focus_band: { id: "focus_band", name: "Fokusband", desc: "+40% Fokus-Aufladung", price: 360, color: "#58c8e8", focusRegen: 0.4 }
};
var AMULET_IDS = Object.keys(AMULETS);

// src/data/mastery.ts
var MAX_MOVE_LV = 5;
var LV_BONUS = 0.1;
var RULES = { auto: { name: "Normal", w: 1 }, often: { name: "Oft", w: 1.5 }, rare: { name: "Selten", w: 0.55 } };
var SLOT_WEIGHT = [1.25, 1.1, 1, 0.9];
function tunedMove(def, st) {
  const lv = Math.max(1, Math.min(MAX_MOVE_LV, st?.lv ?? 1)), k = 1 + LV_BONUS * (lv - 1);
  const m = { ...def, status: def.status ? { ...def.status } : void 0 };
  m.power = Math.round(def.power * k);
  if (m.heal) m.heal *= k;
  if (m.buff) m.buff *= k;
  if (m.shield) m.shield *= k;
  let cd = 0;
  for (const p of st?.perks ?? []) {
    if (p === "cd") cd++;
    else if (p === "pow") m.power = Math.round(m.power * 1.15);
    else if (p === "range") {
      m.range *= 1.25;
      if (m.kind === "melee" || m.kind === "cone") m.radius = (m.radius ?? m.range) * 1.25;
      if (m.speed && m.kind === "projectile") m.speed *= 1.15;
    } else if (p === "drain") m.drain = (m.drain ?? 0) + 0.1;
    else if (p === "radius") m.radius = (m.radius ?? 20) * 1.25;
    else if (p === "windup") m.windup *= 0.7;
    else if (p === "effect") {
      if (m.heal) m.heal *= 1.3;
      if (m.buff) m.buff *= 1.3;
      if (m.shield) m.shield *= 1.3;
    } else if (p === "guard") m.shield = (m.shield ?? 0) + 0.1;
  }
  const lvCd = def.stages && !def.power ? 1 - 0.06 * (lv - 1) : 1;
  m.cooldown = +(def.cooldown * Math.pow(0.8, cd) * lvCd).toFixed(2);
  return m;
}

// src/battle/mon.ts
var HP_SCALE = 3;
var sizeHpMul = (n) => n <= 1 ? 2.1 : n === 2 ? 1.45 : n === 3 ? 1.1 : n === 4 ? 1 : 0.92;
var noBonus = () => ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
var BONUS_STEP = 0.04;
function computeStats(speciesId, level, bonus, amulet, hpMul = 1) {
  const sp = SPECIES[speciesId], bn = bonus ?? noBonus();
  const gr = isSingle(speciesId) ? singleGrowth(level) : 1;
  const b = gr === 1 ? sp.base : { hp: sp.base.hp * gr, atk: sp.base.atk * gr, def: sp.base.def * gr, spa: sp.base.spa * gr, spd: sp.base.spd * gr, spe: sp.base.spe * gr };
  const stat = (v, k) => Math.floor((2 * v * level / 100 + 5) * (1 + BONUS_STEP * bn[k]));
  const am = amulet ? AMULETS[amulet] : void 0;
  const maxHp = Math.round((Math.floor(2 * b.hp * level / 100) + level + 10) * HP_SCALE * (1 + BONUS_STEP * bn.hp) * (am?.hpMul ?? 1) * hpMul);
  return { maxHp, atk: stat(b.atk, "atk"), def: stat(b.def, "def"), spa: stat(b.spa, "spa"), spd: stat(b.spd, "spd"), spe: stat(b.spe, "spe") };
}
var uid = 1;
var Mon = class {
  // aktuelles Bewegungsmanöver
  constructor(speciesId, level, nature, o = {}) {
    this.speciesId = speciesId;
    this.level = level;
    this.nature = nature;
    this.sp = SPECIES[speciesId];
    this.moves = (o.moves?.length ? o.moves : this.sp.moves).filter((id) => MOVES[id]).map((id) => tunedMove(MOVES[id], o.moveStates?.[id]));
    this.moves.forEach((mv, i) => {
      this.moveW[mv.id] = (SLOT_WEIGHT[i] ?? 0.9) * RULES[o.moveStates?.[mv.id]?.rule ?? "auto"].w;
    });
    this.amulet = o.amulet ? AMULETS[o.amulet] ?? null : null;
    this.boss = !!o.boss;
    this.bondLvl = o.bondLvl ?? 0;
    const st = computeStats(speciesId, level, o.bonus, o.amulet, (o.hpMul ?? 1) * (o.boss ? 1.2 : 1));
    this.maxHp = st.maxHp;
    this.atk = st.atk;
    this.def = st.def;
    this.spa = st.spa;
    this.spd = st.spd;
    this.spe = st.spe;
    this.hp = Math.max(0, Math.min(this.maxHp, Math.round(this.maxHp * (o.hpFrac ?? 1))));
    this.lagHp = this.hp;
    const spe = Math.floor(2 * this.sp.base.spe * level / 100 + 5);
    void spe;
    this.baseSpeed = 1.14 * (36 + this.sp.base.spe * 0.6) * (NATURES[nature]?.speed ?? 1) * (this.amulet?.speedMul ?? 1);
    for (const m of this.moves) this.cd[m.id] = 0;
  }
  speciesId;
  level;
  nature;
  uid = uid++;
  ownerId = 0;
  // Verweis auf den Spielstand-Eintrag
  fought = false;
  // war im Kampf aktiv (für Erfahrung)
  sp;
  moves;
  maxHp;
  hp;
  lagHp;
  atk;
  def;
  spa;
  spd;
  spe;
  baseSpeed;
  amulet;
  boss = false;
  rage = false;
  terrain = null;
  // steht gerade in diesem Gelände
  own = false;
  // … und es ist das eigene Element
  regenAcc = 0;
  counterT = 0;
  // Konter-Fenster nach gelungenem Ausweichen (Sekunden)
  punishT = 0;
  // verpatzter Angriff: längere Erholzeit
  lastReg = -9;
  lastDodge = -9;
  // Kampfzeit des letzten Ausweichens
  stage = { atk: 0, def: 0, spe: 0 };
  // Werte-Stufen (−3 … +3), verfallen beim Auswechseln
  shield = 0;
  shieldT = 0;
  shieldAt = -9;
  // shieldAt: Kampfzeit der Aktivierung (für Parade)   // Schild-Befehl: nimmt Schaden auf
  buffT = 0;
  // Anfeuern: +25 % Schaden
  bondLvl = 0;
  survived = false;
  traitShown = false;
  // Bindung, „Durchhalten“ schon genutzt, Wesens-Hinweis gezeigt
  side = 0;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  kx = 0;
  ky = 0;
  face = 1;
  look = 0;
  // Blickrichtung (rad)
  dirIdx = 0;
  // Renderer: aktuelle Blickrichtung (0=S, 1=SE, 2=E … gegen den Uhrzeigersinn)
  aim = 0;
  state = "benched";
  t = 0;
  move = null;
  moveSerial = 0;
  hitDone = false;
  dashLeft = 0;
  dashDx = 0;
  dashDy = 0;
  tickT = 0;
  cd = {};
  moveW = {};
  // KI-Gewicht je Attacke (Platz in der Rangfolge × Einsatzregel)
  burn = 0;
  burnT = 0;
  para = 0;
  psn = 0;
  psnT = 0;
  invuln = 0;
  dodgeCd = 0;
  flash = 0;
  stagger = 0;
  walkT = 0;
  moving = false;
  // KI-Zustand
  think = 0.3;
  orbit = 1;
  orbitT = 1;
  retreatT = 0;
  forced = 0;
  forcedId = null;
  // vom Trainer befohlene Attacke
  elixir = false;
  // Angriffs-Elixier: +20 % Schaden, solange auf dem Feld
  seen = /* @__PURE__ */ new Set();
  react = null;
  evade = null;
  man = null;
  get alive() {
    return this.hp > 0;
  }
  get hpFrac() {
    return this.hp / this.maxHp;
  }
  /** Kann gerade getroffen werden? */
  get targetable() {
    return this.alive && this.invuln <= 0 && this.state !== "recall" && this.state !== "summon" && this.state !== "faint" && this.state !== "benched";
  }
  get onField() {
    return this.state !== "benched";
  }
  get special() {
    return this.moves.find((m) => m.special);
  }
};
var FOCUS = { max: 100, start: 40, regen: 4.5, special: 30, move: 15, shield: 25, buff: 25, dodge: 15 };
var Trainer = class {
  constructor(side, name, team, auto) {
    this.side = side;
    this.name = name;
    this.team = team;
    this.auto = auto;
    team.forEach((m) => m.side = side);
  }
  side;
  name;
  team;
  auto;
  active = null;
  tactic = "balanced";
  baseTactic = "balanced";
  // Grundplan der KI
  switchCd = 0;
  cmdCd = 0;
  itemCd = 0;
  potions = 2;
  supers = 0;
  focusPots = 0;
  elixirs = 0;
  focus = FOCUS.start;
  syn = [];
  // Team-Synergien
  focusRegenMul = 1;
  // z. B. Boss-Trainer laden schneller
  pending = null;
  chooseT = 0;
  // Auswahl nach K.O. (KI)
  aiT = 0;
  lastX = 0;
  lastY = 0;
  get aliveCount() {
    return this.team.filter((m) => m.alive).length;
  }
};

// src/data/league.ts
var ARENA_MODS = {
  none: { id: "none", name: "Klar", desc: "Keine besonderen Bedingungen.", mul: {}, tint: "" },
  sun: { id: "sun", name: "Sonnenschein", desc: "Feuer +25%, Wasser -15%", mul: { fire: 1.25, water: 0.85 }, tint: "rgba(255,190,80,0.10)" },
  rain: { id: "rain", name: "Regen", desc: "Wasser +25%, Feuer -15%", mul: { water: 1.25, fire: 0.85 }, tint: "rgba(80,120,200,0.14)" },
  jungle: { id: "jungle", name: "Dschungelluft", desc: "Pflanze +25%, Wasser -10%", mul: { grass: 1.25, water: 0.9 }, tint: "rgba(80,200,90,0.10)" }
};
var MOD_IDS = Object.keys(ARENA_MODS);
var TRAINER_DEFS = [
  { name: "Camper Tim", style: "balanced", type: null, natures: ["brave", "timid", "hasty", "sly"], quote: "Ich nehme, was der Wald hergibt!", look: "Vielseitig" },
  { name: "Trainerin Lea", style: "attack", type: "fire", natures: ["brave", "hasty"], quote: "Wer z\xF6gert, verliert!", look: "Feuer \xB7 st\xFCrmt vor" },
  { name: "Angler Ben", style: "defend", type: "water", natures: ["timid"], quote: "Geduld f\xE4ngt jeden Fisch.", look: "Wasser \xB7 h\xE4lt Abstand" },
  { name: "Ass-Trainer Kai", style: "counter", type: null, natures: ["sly", "timid"], quote: "Greif nur an \u2013 ich warte.", look: "Konter \xB7 weicht aus" },
  { name: "Wanderin Sofie", style: "balanced", type: "grass", natures: ["sly", "timid"], quote: "Die Natur ist mein Verb\xFCndeter.", look: "Pflanze \xB7 listig" },
  { name: "F\xF6rster Max", style: "defend", type: "grass", natures: ["timid", "sly"], quote: "Hier kommt keiner durch.", look: "Pflanze \xB7 defensiv" },
  { name: "Schwimmerin Ida", style: "attack", type: "water", natures: ["hasty", "brave"], quote: "Ab ins kalte Wasser!", look: "Wasser \xB7 Tempo" },
  { name: "Heizer Otto", style: "attack", type: "fire", natures: ["brave"], quote: "Mehr Glut! MEHR!", look: "Feuer \xB7 Wucht" },
  { name: "G\xE4rtnerin Pia", style: "counter", type: "grass", natures: ["sly"], quote: "Jede Blume hat Dornen.", look: "Pflanze \xB7 Konter" },
  { name: "Ranger Jonas", style: "balanced", type: null, natures: ["hasty", "brave", "sly"], quote: "Ich lese deine Schritte.", look: "Vielseitig" }
];
var RIVAL = { name: "Rivale Kai", title: "Dein ewiger Rivale", quotes: ["Du schon wieder! Diesmal gewinne ich.", "Ich habe ge\xFCbt. Du auch?", "Gleiches Ziel, nur einer wird Champion!"] };
var STYLE_INFO = {
  attack: "ANGRIFF: ST\xDCRMT VOR, WEICHT SELTEN AUS",
  balanced: "AUSGEWOGEN: PASST SICH AN",
  defend: "DEFENSIV: H\xC4LT ABSTAND, NUTZT DECKUNG",
  counter: "KONTER: WEICHT AUS UND SCHL\xC4GT ZUR\xDCCK"
};
var BOSSES = [
  { name: "Arenaleiterin Mara", title: "H\xFCterin der Glut", mod: "sun", type: "fire", map: "volcano" },
  { name: "Kapit\xE4n Gorm", title: "Herr der Gezeiten", mod: "rain", type: "water", map: "lake" },
  { name: "H\xFCter Alder", title: "K\xF6nig des Waldes", mod: "jungle", type: "grass", map: "jungle" },
  { name: "Champion Rot", title: "Meister der Liga", mod: "none", type: null, map: "rocks" }
];
var LAYERS = 9;

// src/data/maps.ts
var SAND = { t1: "#dccb96", t2: "#d4c28a", hi: "#e8d9a4", lo: "#c9b57e", grout: "#bfab74" };
var MAPS = {
  meadow: { id: "meadow", name: "Wiesenarena", desc: "Offenes Feld ohne Hindernisse.", favors: null, features: [], theme: SAND },
  rocks: {
    id: "rocks",
    name: "Felsgarten",
    desc: "Felsen blockieren Wege und Geschosse \u2013 ideal f\xFCr Deckung.",
    favors: null,
    features: [{ kind: "rock", x: 170, y: 320, r: 15 }, { kind: "rock", x: 104, y: 276, r: 14 }, { kind: "rock", x: 236, y: 364, r: 14 }, { kind: "rock", x: 232, y: 232, r: 11 }, { kind: "rock", x: 108, y: 408, r: 11 }],
    theme: { t1: "#cfc6b4", t2: "#c5bca8", hi: "#ddd5c4", lo: "#b8ae9a", grout: "#a89e8a" }
  },
  lake: {
    id: "lake",
    name: "Seeufer",
    desc: "Nur Wasser-Monster durchqueren den See \u2013 sie sind darin schneller und st\xE4rker.",
    favors: "water",
    features: [{ kind: "water", x: 170, y: 320, r: 50 }, { kind: "rock", x: 78, y: 250, r: 11 }, { kind: "rock", x: 262, y: 390, r: 11 }],
    theme: SAND
  },
  volcano: {
    id: "volcano",
    name: "Vulkanfeld",
    desc: "Nur Feuer-Monster betreten die Lava \u2013 sie sind darin schneller und st\xE4rker.",
    favors: "fire",
    features: [{ kind: "lava", x: 106, y: 320, r: 36 }, { kind: "lava", x: 234, y: 320, r: 36 }, { kind: "rock", x: 170, y: 262, r: 11 }, { kind: "rock", x: 170, y: 378, r: 11 }],
    theme: { t1: "#9a8f88", t2: "#8f847d", hi: "#aba099", lo: "#80756e", grout: "#6e645e" }
  },
  jungle: {
    id: "jungle",
    name: "Dschungel",
    desc: "Hohes Gras bremst alle au\xDFer Pflanzen-Monstern \u2013 diese heilen sich darin.",
    favors: "grass",
    features: [{ kind: "grass", x: 108, y: 268, r: 36 }, { kind: "grass", x: 232, y: 372, r: 36 }, { kind: "grass", x: 170, y: 320, r: 26 }, { kind: "rock", x: 236, y: 262, r: 12 }, { kind: "rock", x: 104, y: 378, r: 12 }],
    theme: { t1: "#c8c896", t2: "#bcbe8a", hi: "#d6d8a6", lo: "#aeb07e", grout: "#9aa070" }
  }
};
var MAP_IDS = Object.keys(MAPS);
var TERRAIN_BONUS = 1.15;
var GRASS_SLOW = 0.82;
var GRASS_REGEN = 8e-3;

// src/data/types.ts
var TYPE_NAMES = {
  normal: "Normal",
  fire: "Feuer",
  water: "Wasser",
  grass: "Pflanze",
  electric: "Elektro",
  rock: "Stein",
  ice: "Eis",
  ghost: "Geist",
  wind: "Wind",
  poison: "Gift",
  metal: "Metall",
  light: "Licht",
  earth: "Erde",
  sound: "Klang",
  dark: "Dunkel",
  crystal: "Kristall"
};
var TYPE_FX = {
  normal: { pal: ["#ffffff", "#e8e8e8", "#a8a090"], proj: "orb" },
  fire: { pal: ["#fff6c0", "#f8a030", "#d83818"], proj: "flame" },
  water: { pal: ["#ffffff", "#a8d0f8", "#6890f0"], proj: "drop" },
  grass: { pal: ["#f0ffd0", "#90d048", "#3f7f2a"], proj: "leaf" },
  electric: { pal: ["#ffffff", "#f8f080", "#f8d030"], proj: "bolt" },
  rock: { pal: ["#f0e0c0", "#c8a868", "#7a5a34"], proj: "chunk" },
  ice: { pal: ["#ffffff", "#c8f0ff", "#78c8e8"], proj: "shard" },
  ghost: { pal: ["#f0e0ff", "#a878d8", "#583888"], proj: "wisp" },
  wind: { pal: ["#ffffff", "#c8ffe8", "#6cd0a8"], proj: "slash" },
  poison: { pal: ["#f0d0ff", "#c060d0", "#6a2878"], proj: "bubble" },
  metal: { pal: ["#ffffff", "#c8d0e0", "#7880a0"], proj: "disc" },
  light: { pal: ["#ffffff", "#fff0a0", "#f8c840"], proj: "star" },
  earth: { pal: ["#f8e8b8", "#d8a850", "#8a5a28"], proj: "chunk" },
  sound: { pal: ["#ffffff", "#ffb0d8", "#e050a0"], proj: "ring" },
  dark: { pal: ["#d8c8f8", "#6a50a0", "#201838"], proj: "void" },
  crystal: { pal: ["#ffffff", "#e0b8ff", "#a060e0"], proj: "prism" }
};
var CHART = {
  normal: { rock: 0.5, ghost: 0.5, metal: 0.5 },
  fire: { grass: 2, ice: 2, ghost: 2, metal: 2, water: 0.5, fire: 0.5, rock: 0.5 },
  water: { fire: 2, rock: 2, earth: 2, grass: 0.5, water: 0.5, ice: 0.5 },
  grass: { water: 2, rock: 2, earth: 2, fire: 0.5, grass: 0.5, ice: 0.5, poison: 0.5, wind: 0.5 },
  electric: { water: 2, ice: 2, wind: 2, metal: 2, grass: 0.5, electric: 0.5, rock: 0.5, earth: 0.5 },
  rock: { fire: 2, electric: 2, ice: 2, wind: 2, water: 0.5, grass: 0.5, rock: 0.5, earth: 0.5, metal: 0.5 },
  ice: { grass: 2, ghost: 2, wind: 2, earth: 2, fire: 0.5, water: 0.5, ice: 0.5, rock: 0.5, metal: 0.5 },
  ghost: { ghost: 2, electric: 2, light: 0.5, dark: 0.5, normal: 0.5, rock: 0.5 },
  wind: { grass: 2, poison: 2, rock: 0.5, electric: 0.5, metal: 0.5, crystal: 0.5 },
  poison: { grass: 2, light: 2, rock: 0.5, ghost: 0.5, poison: 0.5, metal: 0.5, earth: 0.5 },
  metal: { ice: 2, rock: 2, crystal: 2, fire: 0.5, water: 0.5, electric: 0.5, metal: 0.5 },
  light: { ghost: 2, dark: 2, poison: 2, light: 0.5, metal: 0.5, crystal: 0.5 },
  earth: { fire: 2, electric: 2, rock: 2, metal: 2, poison: 2, grass: 0.5, wind: 0.5, ice: 0.5 },
  sound: { ice: 2, ghost: 2, crystal: 2, rock: 0.5, metal: 0.5, sound: 0.5 },
  dark: { ghost: 2, light: 2, sound: 2, dark: 0.5, metal: 0.5, normal: 0.5 },
  crystal: { wind: 2, dark: 2, poison: 2, sound: 2, earth: 0.5, metal: 0.5, crystal: 0.5 }
};
function typeEffectiveness(atk, defTypes) {
  let m = 1;
  for (const d of defTypes) m *= CHART[atk]?.[d] ?? 1;
  return m;
}

// src/data/synergy.ts
var BOND_AT = [0, 4, 10, 20];
var bondLevel = (wins) => {
  let l = 0;
  BOND_AT.forEach((n, i) => {
    if (wins >= n) l = i;
  });
  return l;
};
var bondDmg = (lvl) => lvl >= 3 ? 1.08 : lvl >= 1 ? 1.04 : 1;
function synergies(teamTypes) {
  const out = [];
  const count = {};
  for (const ts of teamTypes) for (const t of ts) count[t] = (count[t] ?? 0) + 1;
  for (const [t, n] of Object.entries(count)) {
    if (n >= 2) out.push({ id: "type-" + t, name: TYPE_NAMES[t].toUpperCase() + "-VERBUND", desc: TYPE_NAMES[t].toUpperCase() + "-ATTACKEN +" + (n >= 3 ? 10 : 6) + "% SCHADEN", type: t, dmg: n >= 3 ? 1.1 : 1.06 });
  }
  if (count.fire && count.water && count.grass) out.push({ id: "triad", name: "DREIKLANG", desc: "FEUER, WASSER UND PFLANZE: FOKUS L\xC4DT 15% SCHNELLER", focus: 1.15 });
  return out;
}
var synDmg = (syn, type) => syn.reduce((a, s) => a * (s.type === type ? s.dmg ?? 1 : 1), 1);
var synFocus = (syn) => syn.reduce((a, s) => a * (s.focus ?? 1), 1);

// src/battle/ai.ts
var PULL = 0.25;
var hyp = Math.hypot;
function findThreat(b, m) {
  const e = b.enemyOf(m);
  if (!e) return null;
  for (const p of b.projs) {
    if (p.owner === m) continue;
    const rx = p.x - m.x, ry = p.y - m.y;
    const v2 = p.vx * p.vx + p.vy * p.vy;
    const tc = -(rx * p.vx + ry * p.vy) / v2;
    if (tc < 0 || tc > 0.65) continue;
    const d = hyp(rx + p.vx * tc, ry + p.vy * tc);
    if (d < p.r + m.sp.radius + 5) return { id: p.id, kind: "proj", dir: Math.atan2(p.vy, p.vx), cx: p.x, cy: p.y };
  }
  for (const z of b.zones) {
    if (z.owner === m || z.done) continue;
    if (hyp(z.x - m.x, z.y - m.y) < z.r + m.sp.radius + 4) return { id: z.id, kind: "zone", dir: Math.atan2(m.y - z.y, m.x - z.x), cx: z.x, cy: z.y };
  }
  if (e.move && (e.state === "windup" || e.state === "active")) {
    const mv = e.move;
    const d = hyp(m.x - e.x, m.y - e.y);
    const off = Math.abs(Math.atan2(Math.sin(Math.atan2(m.y - e.y, m.x - e.x) - e.aim), Math.cos(Math.atan2(m.y - e.y, m.x - e.x) - e.aim)));
    if ((mv.kind === "melee" || mv.kind === "dash") && d < mv.range + 22 && off < 1)
      return { id: e.moveSerial, kind: "melee", dir: e.aim, cx: e.x, cy: e.y };
    if (mv.kind === "cone" && d < mv.range + 14 && off < mv.arc + 0.3)
      return { id: e.moveSerial, kind: "melee", dir: e.aim, cx: e.x, cy: e.y };
  }
  return null;
}
function room(m, a) {
  const tx = m.x + Math.cos(a) * 40, ty = m.y + Math.sin(a) * 40;
  return Math.min(tx - ARENA.x0, ARENA.x1 - tx, ty - ARENA.y0, ARENA.y1 - ty);
}
function manualDodge(b, m) {
  if (!["ready", "recover", "stagger", "windup"].includes(m.state) || m.state === "windup" && m.move?.armor) return false;
  const e = b.enemyOf(m);
  const th = findThreat(b, m) ?? { id: 0, kind: "melee", dir: e ? Math.atan2(m.y - e.y, m.x - e.x) : 0, cx: m.x, cy: m.y };
  startDodge(b, m, th);
  return true;
}
function startDodge(b, m, th) {
  let a;
  if (th.kind === "zone") a = th.dir;
  else {
    const p1 = th.dir + Math.PI / 2, p2 = th.dir - Math.PI / 2;
    a = room(m, p1) + b.rng.range(-8, 8) > room(m, p2) ? p1 : p2;
  }
  a += b.rng.range(-0.3, 0.3);
  const sp = 190;
  m.state = "dodge";
  m.t = 0;
  m.move = null;
  m.dashDx = Math.cos(a) * sp;
  m.dashDy = Math.sin(a) * sp;
  m.face = m.dashDx >= 0 ? 1 : -1;
  m.invuln = 0.14;
  m.dodgeCd = (b.trainerOf(m).tactic === "counter" ? 1.15 : 1.7) * (m.nature === "timid" ? 0.75 : 1);
  m.lastDodge = b.t;
  b.stats.dodges[m.side]++;
  b.events.push({ type: "dodge" });
}
function thinkReady(b, m, dt, moveOnly = false, spdMul = 1) {
  const tr = b.trainerOf(m);
  const e = b.enemyOf(m);
  const N = NATURES[m.nature];
  const T = TACTICS[tr.tactic];
  const rng = b.rng;
  m.think -= dt;
  m.orbitT -= dt;
  if (m.orbitT <= 0) {
    if (rng.chance(0.55)) m.orbit = m.orbit * -1;
    m.orbitT = rng.range(1, 2.8);
  }
  const targetable = !!e && e.alive && e.state !== "benched";
  if (!targetable) {
    const [cx, cy] = [(ARENA.x0 + ARENA.x1) / 2, m.side === 0 ? ARENA.y0 + (ARENA.y1 - ARENA.y0) * 0.65 : ARENA.y0 + (ARENA.y1 - ARENA.y0) * 0.35];
    m.vx += ((cx - m.x) * 0.9 - m.vx) * Math.min(1, dt * 4);
    m.vy += ((cy - m.y) * 0.9 - m.vy) * Math.min(1, dt * 4);
    integrate(m, dt);
    return;
  }
  const dx = e.x - m.x, dy = e.y - m.y, dist = hyp(dx, dy) || 1;
  const toE = { x: dx / dist, y: dy / dist };
  const th = moveOnly ? null : findThreat(b, m);
  if (th && !m.seen.has(th.id)) {
    m.seen.add(th.id);
    if (m.seen.size > 60) m.seen.clear();
    const p = clamp(N.dodge * T.dodge * 0.9, 0, 0.95);
    if (rng.chance(p)) m.react = { at: b.t + rng.range(0.07, 0.22), ...th };
  }
  if (!moveOnly && m.react && b.t >= m.react.at) {
    const r = m.react;
    m.react = null;
    if (m.dodgeCd <= 0) {
      startDodge(b, m, { id: 0, ...r });
      return;
    }
  }
  const noLos = b.rocks.length > 0 && b.losBlocked(m.x, m.y, e.x, e.y);
  let bestMv = null, bestScore = 0;
  const gate = clamp(0.45 + 0.55 * N.aggression * T.aggr, 0.25, 1);
  const wantId = m.forced > 0 ? m.forcedId : null;
  const wantSpecial = !!wantId;
  const soon = [];
  for (const mv of m.moves) {
    if (m.cd[mv.id] > 0.35) continue;
    const eff = typeEffectiveness(mv.type, e.sp.types);
    if (mv.kind === "status") {
      if (m.cd[mv.id] > 0 || dist > mv.range) continue;
      const room2 = (mv.stages ?? []).some((fx) => e.stage[fx.stat] > -2);
      const want = wantId === mv.id ? 1e6 : room2 ? 95 * (m.moveW[mv.id] ?? 1) * (0.8 + rng.next() * 0.4) : 0;
      if (want > bestScore) {
        bestScore = want;
        bestMv = mv;
      }
      continue;
    }
    if (mv.kind === "self") {
      if (m.cd[mv.id] > 0) continue;
      if (wantId === mv.id) {
        bestScore = 1e6;
        bestMv = mv;
        continue;
      }
      const want = (mv.stages ? mv.stages.some((fx) => m.stage[fx.stat] < 2) && dist > 40 ? 100 : 0 : mv.heal ? m.hpFrac < 0.5 ? 400 : m.hpFrac < 0.7 ? 60 : 0 : mv.shield && !mv.buff ? m.shield <= 0 && m.hpFrac < 0.8 ? 110 : 0 : m.buffT <= 0 && dist > 45 ? 90 : 0) * (m.moveW[mv.id] ?? 1);
      if (want > bestScore) {
        bestScore = want;
        bestMv = mv;
      }
      continue;
    }
    let sc = mv.power * eff * (N.weights[mv.kind] ?? 1) * (mv.special ? 1.1 : 1) * (m.moveW[mv.id] ?? 1);
    if (wantId === mv.id) sc *= 50;
    if (mv.kind === "melee" || mv.kind === "dash") sc *= 0.75 + 0.5 * N.aggression * T.aggr;
    soon.push(mv);
    if (m.cd[mv.id] > 0) continue;
    if (dist > mv.range || dist < (mv.minRange ?? 0)) continue;
    if ((mv.kind === "projectile" || mv.kind === "cone" || mv.kind === "dash") && noLos) continue;
    sc *= 0.8 + rng.next() * 0.4;
    if ((e.state === "recover" || e.state === "stagger") && (mv.kind === "melee" || mv.kind === "dash" || mv.kind === "cone")) sc *= 1.4;
    if (sc > bestScore) {
      bestScore = sc;
      bestMv = mv;
    }
  }
  if (m.think <= 0 && !moveOnly) {
    m.think = rng.range(0.08, 0.22);
    if (bestMv && (wantSpecial || rng.chance(gate))) {
      let aim = Math.atan2(dy, dx);
      let target;
      const mv = bestMv;
      if (mv.kind === "projectile") {
        const tt = dist / mv.speed * N.lead;
        aim = Math.atan2(dy + e.vy * tt, dx + e.vx * tt) + rng.range(-0.1, 0.1) * (1.15 - N.lead);
      } else if (mv.kind === "aoe") {
        const lead = 0.25 + 0.4 * N.lead;
        target = { x: e.x + e.vx * mv.windup * lead, y: e.y + e.vy * mv.windup * lead };
        aim = Math.atan2(target.y - m.y, target.x - m.x);
      } else if (mv.kind === "dash") {
        aim = Math.atan2(dy + e.vy * 0.1, dx + e.vx * 0.1);
      }
      b.startMove(m, mv, aim, target);
      return;
    }
  }
  const attackSoon0 = soon.some((mv) => mv.kind !== "self");
  const punish = e.alive && (e.state === "recover" || e.state === "stagger") && dist < 120 && attackSoon0;
  const threatened = e.state === "windup" && !!e.move && (e.move.kind === "melee" || e.move.kind === "dash") && dist < e.move.range + 24 && m.dodgeCd > 0.3;
  let desired;
  let pick = null, pw = 0;
  for (const mv of soon) {
    if (mv.kind === "self" || mv.kind === "status") continue;
    const w = mv.power * (N.weights[mv.kind] ?? 1) * (wantId === mv.id ? 50 : 1);
    if (w > pw) {
      pw = w;
      pick = mv;
    }
  }
  const rangeF = clamp(N.range * T.range, 0.45, 1.5);
  if (pick) desired = Math.max(14, pick.range * 0.72 * (pick.kind === "melee" || pick.kind === "dash" ? Math.min(1, rangeF + 0.2) : rangeF));
  else desired = 78 * rangeF;
  const meleeish = !!pick && (pick.kind === "melee" || pick.kind === "dash");
  if (!m.man || b.t >= m.man.until || m.man.k === "roam" && hyp(m.man.tx - m.x, m.man.ty - m.y) < 14) m.man = pickManeuver(b, m, e, N, tr.tactic, meleeish);
  const man = m.man;
  let radial, orbitW, boost = 1;
  let vx, vy;
  if (man.k === "flank" || man.k === "roam") {
    let tx = man.tx, ty = man.ty;
    if (man.k === "flank") {
      tx = e.x + Math.cos(man.th) * man.dist;
      ty = e.y + Math.sin(man.th) * man.dist;
      tx = clamp(tx, ARENA.x0 + 22, ARENA.x1 - 22);
      ty = clamp(ty, ARENA.y0 + 22, ARENA.y1 - 22);
    }
    const ld = hyp(tx - m.x, ty - m.y) || 1;
    vx = (tx - m.x) / ld;
    vy = (ty - m.y) / ld;
    boost = 1.1;
    radial = 0;
    orbitW = 0;
    if (man.k === "flank" && ld < 12) man.until = 0;
  } else {
    const want = man.k === "rush" ? Math.min(desired, 30) : man.dist;
    radial = clamp((dist - want) / 14, -1, 1);
    orbitW = man.k === "strafe" ? 1.05 : man.k === "kite" ? 0.55 : 0.5;
    if (man.k === "rush") boost = 1.12;
    if (man.k === "kite") boost = 1.06;
    if (Math.abs(radial) > 0.8) orbitW *= 0.6;
    vx = toE.x * radial - toE.y * m.orbit * orbitW;
    vy = toE.y * radial + toE.x * m.orbit * orbitW;
  }
  if (punish) {
    vx = toE.x * 0.95;
    vy = toE.y * 0.95;
    boost = 1.1;
  } else if (threatened) {
    vx = -toE.x * 0.9 - toE.y * m.orbit * 0.6;
    vy = -toE.y * 0.9 + toE.x * m.orbit * 0.6;
    boost = 1.12;
  }
  if (m.retreatT > 0) {
    vx = -toE.x - toE.y * m.orbit * 0.5;
    vy = -toE.y + toE.x * m.orbit * 0.5;
    boost = 1.08;
  }
  const sep = e.sp.radius + m.sp.radius + 14;
  if (dist < sep && !punish) {
    const k = (sep - dist) / sep;
    vx -= toE.x * k * 1.6;
    vy -= toE.y * k * 1.6;
  }
  const attackSoon = soon.some((mv) => mv.kind !== "self");
  if (noLos && attackSoon) {
    vx = toE.x;
    vy = toE.y;
  }
  if (b.rocks.length && !attackSoon && (m.hpFrac < 0.4 || tr.tactic === "defend" || m.retreatT > 0)) {
    let best = null, bd = 1e9;
    for (const f of b.rocks) {
      const ex = f.x - e.x, ey = f.y - e.y, el = hyp(ex, ey) || 1;
      const px = f.x + ex / el * (f.r + 13), py = f.y + ey / el * (f.r + 13);
      const d2 = hyp(px - m.x, py - m.y);
      if (d2 < bd) {
        bd = d2;
        best = { x: px, y: py };
      }
    }
    if (best && bd < 150) {
      const k = Math.min(1, bd / 14);
      vx = (best.x - m.x) / (bd || 1) * k;
      vy = (best.y - m.y) / (bd || 1) * k;
    }
  }
  for (const f of b.map.features) {
    const fx = m.x - f.x, fy = m.y - f.y, fd = hyp(fx, fy) || 1;
    if (b.canEnter(m, f)) {
      const mine = f.kind === "water" && m.sp.types.includes("water") || f.kind === "lava" && m.sp.types.includes("fire") || f.kind === "grass" && m.sp.types.includes("grass");
      if (mine && fd > f.r - 10 && fd < f.r + 70) {
        vx -= fx / fd * PULL;
        vy -= fy / fd * PULL;
      }
      continue;
    }
    const near = f.r + m.sp.radius + 16;
    if (fd < near) {
      const push = 1 - (fd - f.r) / (near - f.r);
      vx += fx / fd * push * 1.6 - fy / fd * m.orbit * push * 0.9;
      vy += fy / fd * push * 1.6 + fx / fd * m.orbit * push * 0.9;
    }
  }
  const wm = 22;
  if (m.x < ARENA.x0 + wm) vx += (ARENA.x0 + wm - m.x) / wm * 1.4;
  if (m.x > ARENA.x1 - wm) vx -= (m.x - (ARENA.x1 - wm)) / wm * 1.4;
  if (m.y < ARENA.y0 + wm) vy += (ARENA.y0 + wm - m.y) / wm * 1.4;
  if (m.y > ARENA.y1 - wm) vy -= (m.y - (ARENA.y1 - wm)) / wm * 1.4;
  for (const z of b.zones) {
    if (z.owner === m || z.done) continue;
    const zx = m.x - z.x, zy = m.y - z.y, zd = hyp(zx, zy) || 1;
    if (zd < z.r + 8 && m.seen.has(z.id)) {
      vx += zx / zd * 1.6;
      vy += zy / zd * 1.6;
    }
  }
  const vl = hyp(vx, vy);
  if (vl > 1) {
    vx /= vl;
    vy /= vl;
  }
  const spd = spdMul * boost * m.baseSpeed * stageMul(m.stage.spe) * (m.para > 0 ? 0.55 : 1) * (0.92 + 0.12 * T.aggr) * (m.own ? TERRAIN_BONUS : m.terrain === "grass" ? GRASS_SLOW : 1) * (m.hpFrac < 0.25 ? 1.08 : 1);
  m.vx += (vx * spd - m.vx) * Math.min(1, dt * 9);
  m.vy += (vy * spd - m.vy) * Math.min(1, dt * 9);
  m.face = dx >= 0 ? 1 : -1;
  integrate(m, dt);
}
function pickManeuver(b, m, e, N, tactic, meleeish) {
  const rng = b.rng;
  const W = {
    brave: { rush: 1.6, flank: 2, strafe: 1.5, kite: 0.6, roam: 1.3 },
    timid: { rush: 0.4, flank: 1.2, strafe: 2, kite: 3, roam: 1.8 },
    hasty: { rush: 1.3, flank: 3, strafe: 2, kite: 1.2, roam: 2.6 },
    sly: { rush: 0.8, flank: 2.6, strafe: 1.5, kite: 1.7, roam: 1.5 },
    calm: { rush: 1, flank: 1.6, strafe: 2, kite: 1.2, roam: 1.4 }
  };
  const w = { ...W[m.nature] ?? W.calm };
  if (tactic === "attack") {
    w.rush *= 1.7;
    w.kite *= 0.5;
  } else if (tactic === "defend") {
    w.kite *= 1.7;
    w.roam *= 1.4;
    w.rush *= 0.5;
  } else if (tactic === "counter") {
    w.strafe *= 1.8;
    w.flank *= 1.2;
  }
  if (meleeish) {
    w.kite *= 0.35;
    w.roam *= 0.5;
    w.rush *= 1.3;
    w.flank *= 1.2;
  }
  if (m.hpFrac < 0.35) {
    w.kite *= 1.6;
    w.roam *= 1.5;
    w.rush *= 0.6;
  }
  let tot = 0;
  for (const k2 in w) tot += w[k2];
  let r = rng.next() * tot, k = "strafe";
  for (const key in w) {
    r -= w[key];
    if (r <= 0) {
      k = key;
      break;
    }
  }
  const ang = Math.atan2(m.y - e.y, m.x - e.x), sign = rng.chance(0.5) ? 1 : -1;
  const man = { k, until: b.t + rng.range(0.9, 2) / (0.8 + 0.4 * N.orbit), dist: 70, th: ang, sign, tx: 0, ty: 0 };
  if (k === "strafe") man.dist = rng.range(70, 125);
  else if (k === "kite") {
    man.dist = rng.range(135, 195);
    man.until = b.t + rng.range(1.2, 2.2);
  } else if (k === "rush") man.until = b.t + rng.range(0.9, 1.6);
  else if (k === "flank") {
    man.th = ang + sign * rng.range(1.3, 2.3);
    man.dist = rng.range(70, 125);
    man.until = b.t + rng.range(1.3, 2.2);
  } else {
    for (let i = 0; i < 8; i++) {
      const tx = rng.range(ARENA.x0 + 28, ARENA.x1 - 28), ty = rng.range(ARENA.y0 + 28, ARENA.y1 - 28);
      if (hyp(tx - e.x, ty - e.y) > 62 && !b.rocks.some((f) => hyp(tx - f.x, ty - f.y) < f.r + 16)) {
        man.tx = tx;
        man.ty = ty;
        break;
      }
      man.tx = tx;
      man.ty = ty;
    }
    man.until = b.t + 2.6;
  }
  return man;
}
function integrate(m, dt) {
  m.x += m.vx * dt;
  m.y += m.vy * dt;
  m.moving = Math.hypot(m.vx, m.vy) > 8;
}
function trainerAI(b, tr, dt) {
  tr.aiT -= dt;
  if (!tr.active) {
    if (tr.aliveCount > 0 && tr.pending === null) {
      tr.chooseT += dt;
      if (tr.chooseT > 0.9) {
        const foe2 = b.trainers[1 - tr.side].active;
        let best = -1, bs = -1;
        tr.team.forEach((m2, i) => {
          if (!m2.alive) return;
          const eff = foe2 ? Math.max(...m2.moves.map((mv) => typeEffectiveness(mv.type, foe2.sp.types))) : 1;
          const s = m2.hpFrac + eff * 0.3 + b.rng.next() * 0.2;
          if (s > bs) {
            bs = s;
            best = i;
          }
        });
        b.requestSwitch(tr, best, true);
      }
    }
    return;
  }
  if (tr.aiT > 0) return;
  tr.aiT = 0.4;
  const m = tr.active;
  if (!m.alive || tr.pending !== null) return;
  const foe = b.trainers[1 - tr.side].active;
  if (tr.side === 1 || tr.auto) {
    const want = m.hpFrac < 0.35 && tr.aliveCount > 1 ? "defend" : foe && foe.hpFrac < 0.3 ? "attack" : tr.baseTactic;
    if (want !== tr.tactic) b.setTactic(tr, want);
  }
  if (m.hpFrac < 0.3 && tr.itemCd <= 0 && b.rng.chance(0.5)) {
    if (tr.potions > 0) b.usePotion(tr);
    else if (tr.supers > 0) b.usePotion(tr, "super");
  }
  if (m.hpFrac < 0.28 && tr.switchCd <= 0) {
    const cand = tr.team.map((x, i) => ({ x, i })).filter(({ x }) => x.alive && x !== m && x.hpFrac > 0.45);
    if (cand.length && b.rng.chance(0.7)) {
      cand.sort((a, c) => c.x.hpFrac - a.x.hpFrac);
      b.requestSwitch(tr, cand[0].i);
      return;
    }
  }
  const fm = foe && foe.alive ? foe : null;
  if (fm && fm.state === "windup" && fm.move && fm.move.armor && fm.t > fm.move.windup * 0.45 && m.shield <= 0 && tr.focus >= FOCUS.shield && Math.hypot(fm.x - m.x, fm.y - m.y) < fm.move.range + 20 && b.rng.chance(tr.side === 1 ? 0.35 : 1)) {
    b.commandShield(tr);
    return;
  }
  const sp = m.special;
  if (sp && m.cd[sp.id] <= 0 && tr.focus >= FOCUS.special + 10 && b.rng.chance(0.4)) b.commandSpecial(tr);
  else if (m.hpFrac < 0.5 && m.shield <= 0 && tr.focus >= FOCUS.shield + 10 && b.rng.chance(0.3)) b.commandShield(tr);
  else if (m.buffT <= 0 && tr.focus >= FOCUS.buff + 35 && b.rng.chance(0.25)) b.commandBuff(tr);
}

// src/battle/battle.ts
var LVL_DMG = 0.055;
var FINALE_AT = 70;
var ARENA = { x0: 44, y0: 140, x1: 296, y1: 500 };
function spawnPos(side) {
  const cx = (ARENA.x0 + ARENA.x1) / 2, h = ARENA.y1 - ARENA.y0;
  return [cx, side === 0 ? ARENA.y0 + h * 0.78 : ARENA.y0 + h * 0.22];
}
var Battle = class {
  rng;
  t = 0;
  trainers;
  projs = [];
  zones = [];
  parts = [];
  texts = [];
  slashes = [];
  bolts = [];
  ghosts = [];
  impacts = [];
  shotQueue = [];
  stepNo = 0;
  strikeQueue = [];
  events = [];
  shake = 0;
  hitstop = 0;
  flashScreen = 0;
  winner = null;
  mod;
  map;
  rocks;
  slowmo = 0;
  // K.O.-Zeitlupe
  finaleAt = FINALE_AT;
  finale = false;
  overT = 0;
  choosing = false;
  choosingT = 0;
  idc = 1;
  stats = { dmg: [0, 0], hits: [0, 0], dodges: [0, 0], counters: [0, 0], blocked: [0, 0], parries: [0, 0] };
  constructor(a, b, seed = 1, modId = "none", mapId = "meadow", lenMul = 1) {
    this.finaleAt = Math.round(FINALE_AT * lenMul);
    this.rng = new Rng(seed);
    this.map = MAPS[mapId] ?? MAPS.meadow;
    this.rocks = this.map.features.filter((f) => f.kind === "rock");
    this.mod = ARENA_MODS[modId] ?? ARENA_MODS.none;
    this.trainers = [a, b];
    for (const tr of this.trainers) {
      tr.syn = synergies(tr.team.map((m) => m.sp.types));
      tr.focusRegenMul *= synFocus(tr.syn);
      const first = tr.team.find((m) => m.alive);
      tr.active = first;
      first.state = "summon";
      first.t = 0;
      first.invuln = 0.5;
      first.fought = true;
      [first.x, first.y] = spawnPos(tr.side);
      first.face = tr.side === 0 ? 1 : -1;
      tr.lastX = first.x;
      tr.lastY = first.y;
    }
  }
  enemyOf(m) {
    return this.trainers[1 - m.side].active;
  }
  trainerOf(m) {
    return this.trainers[m.side];
  }
  nid() {
    return this.idc++;
  }
  // ───────────── Hauptschleife ─────────────
  update(rawDt) {
    if (this.hitstop > 0) {
      this.hitstop -= rawDt;
      this.updateFx(rawDt * 0.2);
      return;
    }
    let dt = rawDt;
    if (this.slowmo > 0) {
      this.slowmo -= rawDt;
      dt *= 0.3;
    }
    const player = this.trainers[0];
    this.choosing = !player.auto && !player.active && player.aliveCount > 0 && !this.winner;
    if (this.choosing) {
      this.choosingT += rawDt;
      dt *= 0.1;
      if (this.choosingT > 6) this.requestSwitch(player, player.team.findIndex((m) => m.alive), true);
    } else this.choosingT = 0;
    if (this.t < this.finaleAt && this.t + dt >= this.finaleAt && this.winner === null) {
      this.finale = true;
      this.events.push({ type: "cmd" });
      this.flashScreen = 0.1;
    }
    this.t += dt;
    for (const tr of this.trainers) {
      tr.switchCd = Math.max(0, tr.switchCd - dt);
      tr.cmdCd = Math.max(0, tr.cmdCd - dt);
      tr.itemCd = Math.max(0, tr.itemCd - dt);
      tr.focus = Math.min(FOCUS.max, tr.focus + FOCUS.regen * tr.focusRegenMul * (1 + (tr.active?.amulet?.focusRegen ?? 0)) * (tr.active && tr.active.alive && tr.active.hpFrac < 0.3 ? 1.5 : 1) * dt);
      if (tr.auto || tr.side === 1) trainerAI(this, tr, dt);
      if (tr.pending !== null) this.processPending(tr);
    }
    const order = this.stepNo++ % 2 === 0 ? this.trainers : [this.trainers[1], this.trainers[0]];
    for (const tr of order) for (const m of tr.team) if (m.onField) this.updateMon(m, dt);
    this.processShots();
    this.processStrikes();
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.updateFx(dt);
    this.checkEnd(dt);
  }
  checkEnd(dt) {
    if (this.winner !== null) {
      this.overT += dt;
      return;
    }
    const lost = this.trainers.filter((tr) => tr.aliveCount === 0 && !(tr.active && tr.active.state === "faint" && tr.active.t < 1.1));
    if (lost.length === 1) this.winner = 1 - lost[0].side;
    else if (lost.length === 2) this.winner = this.rng.next() < 0.5 ? 0 : 1;
  }
  // ───────────── Mon-Zustandsautomat ─────────────
  updateMon(m, dt) {
    const tr = this.trainerOf(m);
    m.t += dt;
    m.flash = Math.max(0, m.flash - dt);
    m.invuln = Math.max(0, m.invuln - dt);
    m.dodgeCd = Math.max(0, m.dodgeCd - dt);
    m.forced = Math.max(0, m.forced - dt);
    m.retreatT = Math.max(0, m.retreatT - dt);
    m.buffT = Math.max(0, m.buffT - dt);
    m.counterT = Math.max(0, m.counterT - dt);
    if (m.shieldT > 0) {
      m.shieldT -= dt;
      if (m.shieldT <= 0) m.shield = 0;
    }
    if (m.boss && !m.rage && m.alive && m.hp < m.maxHp * 0.5 && m.state !== "faint") {
      m.rage = true;
      m.baseSpeed *= 1.15;
      m.flash = 0.5;
      this.shake = Math.max(this.shake, 3);
      this.text(m.x, m.y, "WUT!", "#ff5060", 1.2, true, m.sp.height + 12);
      this.events.push({ type: "status", id: "rage" });
    }
    m.lagHp += (m.hp - m.lagHp) * Math.min(1, dt * 2.5);
    if (m.lagHp < m.hp) m.lagHp = m.hp;
    m.x += m.kx * dt;
    m.y += m.ky * dt;
    const kd = Math.exp(-9 * dt);
    m.kx *= kd;
    m.ky *= kd;
    this.updateStatus(m, dt);
    const cdRate = (m.para > 0 ? 0.7 : 1) * (m.rage ? 1.3 : 1) * (1 + 0.06 * m.stage.spe);
    for (const k in m.cd) m.cd[k] = Math.max(0, m.cd[k] - dt * cdRate);
    m.moving = false;
    switch (m.state) {
      case "ready": {
        thinkReady(this, m, dt);
        break;
      }
      case "windup": {
        if (m.move && !m.move.armor && m.move.kind !== "dash" && m.move.kind !== "cone" && this.enemyOf(m)?.targetable) {
          const f = m.face;
          thinkReady(this, m, dt, true, 0.4);
          m.face = f;
        } else {
          m.vx *= 0.8;
          m.vy *= 0.8;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
        }
        m.face = Math.cos(m.aim) >= 0 ? 1 : -1;
        this.charge(m, dt);
        if (m.t >= m.move.windup) this.fireMove(m);
        break;
      }
      case "active":
        this.updateActive(m, dt);
        break;
      case "recover": {
        if (this.enemyOf(m)?.targetable && m.t > 0.04) thinkReady(this, m, dt, true, 0.9);
        else {
          m.vx *= 0.85;
          m.vy *= 0.85;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
        }
        if (m.t >= (m.move?.recover ?? 0) * (m.nature === "hasty" ? 0.75 : 1)) {
          m.state = "ready";
          m.t = 0;
          m.move = null;
        }
        break;
      }
      case "dodge": {
        m.x += m.dashDx * dt;
        m.y += m.dashDy * dt;
        m.moving = true;
        if (Math.floor(m.t * 60) % 2 === 0) this.ghosts.push({ x: m.x, y: m.y, face: m.face, t: 0, mon: m });
        if (m.t >= 0.2) {
          m.state = "ready";
          m.t = 0;
        }
        break;
      }
      case "stagger": {
        if (m.t >= 0.28) {
          m.state = "ready";
          m.t = 0;
        }
        break;
      }
      case "faint": {
        if (m.t > 1.25) {
          m.state = "benched";
          if (tr.active === m) {
            tr.lastX = m.x;
            tr.lastY = m.y;
            tr.active = null;
            tr.chooseT = 0;
          }
        }
        break;
      }
      case "recall": {
        if (m.t >= 0.35) {
        }
        break;
      }
      case "summon": {
        if (m.t >= 0.4) {
          m.state = "ready";
          m.t = 0;
        }
        break;
      }
    }
    this.updateLook(m);
    this.resolveTerrain(m, dt);
    m.x = clamp(m.x, ARENA.x0, ARENA.x1);
    m.y = clamp(m.y, ARENA.y0, ARENA.y1);
    m.walkT += dt * (m.moving ? 1 : 0);
  }
  /** Ein Angriff ging ins Leere, weil das Ziel ausgewichen ist: Feedback, Konter-Fenster, Strafe für Nahkämpfer. */
  registerDodge(def, att, punish) {
    if (def.lastReg > this.t - 0.8) return;
    def.lastReg = this.t;
    const tc = this.trainerOf(def).tactic;
    def.counterT = tc === "defend" || tc === "counter" ? 5 : 3;
    this.text(def.x, def.y, "AUSGEWICHEN!", "#c8b0ff", 0.9, false, def.sp.height + 12);
    this.spawnPart(def.x, def.y, "#c8b0ff", 8, 70, 0.4, 2, 0, def.sp.height * 0.5);
    if (punish && att.alive && !att.move?.armor) {
      att.punishT = 0.55;
      this.text(att.x, att.y, "VERPATZT!", "#b0b0b0", 0.8, false, att.sp.height + 6);
    }
  }
  /** Werte-Stufe ändern (Angriff, Verteidigung, Tempo): höchstens ±3, Wirkung siehe stageMul. */
  applyStage(m, stat, n) {
    if (!m.alive || m.state === "faint") return;
    const before = m.stage[stat];
    m.stage[stat] = Math.max(-STAGE_MAX, Math.min(STAGE_MAX, before + n));
    const d = m.stage[stat] - before, up = n > 0;
    if (!d) {
      this.text(m.x, m.y, STAGE_NAMES[stat] + (up ? " IST AM LIMIT" : " GEHT NICHT TIEFER"), "#b0b0b0", 0.9, false, m.sp.height + 12);
      return;
    }
    this.text(m.x, m.y, STAGE_NAMES[stat] + " " + (up ? "\u25B2" : "\u25BC").repeat(Math.abs(d)), up ? "#70e890" : "#ff7080", 1.2, false, m.sp.height + 12);
    for (let i = 0; i < 12; i++) this.parts.push({ x: m.x + (Math.random() - 0.5) * 20, y: m.y + (Math.random() - 0.5) * 6, vx: 0, vy: 0, life: 0.7, max: 0.7, color: up ? "#70e890" : "#ff7080", size: 2, grav: 0, z: up ? 2 : m.sp.height, vz: up ? 55 : -55, gz: 0 });
    this.events.push({ type: "status", id: up ? "buff" : "debuff" });
  }
  // ───────────── Gelände ─────────────
  /** Darf das Monster dieses Gelände betreten? */
  canEnter(m, f) {
    return f.kind === "grass" || f.kind === "water" && m.sp.types.includes("water") || f.kind === "lava" && m.sp.types.includes("fire");
  }
  /** Ist die Sichtlinie durch einen Felsen versperrt? */
  losBlocked(ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    for (const f of this.rocks) {
      const t = Math.max(0, Math.min(1, ((f.x - ax) * dx + (f.y - ay) * dy) / l2));
      if (Math.hypot(ax + dx * t - f.x, ay + dy * t - f.y) < f.r - 2) return true;
    }
    return false;
  }
  resolveTerrain(m, dt) {
    m.terrain = null;
    m.own = false;
    for (const f of this.map.features) {
      const dx = m.x - f.x, dy = m.y - f.y, d = Math.hypot(dx, dy) || 0.01;
      if (this.canEnter(m, f)) {
        if (d < f.r - 3) {
          m.terrain = f.kind;
          m.own = f.kind === "water" && m.sp.types.includes("water") || f.kind === "lava" && m.sp.types.includes("fire") || f.kind === "grass" && m.sp.types.includes("grass");
        }
        continue;
      }
      const min = f.r + m.sp.radius * 0.45;
      if (d < min) {
        m.x = f.x + dx / d * min;
        m.y = f.y + dy / d * min;
        if (m.state === "active" && m.move?.kind === "dash") {
          m.dashLeft = 0;
          this.dust(m.x, m.y, 5);
        }
        m.kx *= 0.3;
        m.ky *= 0.3;
      }
    }
    if (m.own && m.terrain === "grass" && m.alive && m.hp < m.maxHp && m.state !== "faint") {
      m.regenAcc += m.maxHp * GRASS_REGEN * dt;
      if (m.regenAcc >= 1) {
        const h = Math.floor(m.regenAcc);
        m.regenAcc -= h;
        m.hp = Math.min(m.maxHp, m.hp + h);
        if (Math.random() < 0.25) this.spawnPart(m.x, m.y, "#90e070", 1, 20, 0.5, 2, -30, 6);
      }
    }
  }
  updateStatus(m, dt) {
    if (m.amulet?.regen && m.alive && m.hp < m.maxHp && m.state !== "faint") {
      m.regenAcc += m.maxHp * m.amulet.regen * dt;
      if (m.regenAcc >= 1) {
        const h = Math.floor(m.regenAcc);
        m.regenAcc -= h;
        m.hp = Math.min(m.maxHp, m.hp + h);
      }
    }
    if (m.burn > 0) {
      m.burn -= dt;
      m.burnT += dt;
      if (Math.random() < dt * 14) this.spawnPart(m.x + (Math.random() - 0.5) * 8, m.y, "#f8a030", 1, 14, 0.4, 1.5, -20, 18);
      if (m.burnT >= 1) {
        m.burnT -= 1;
        this.damageDirect(m, Math.max(1, Math.round(m.maxHp * 8e-3)), "#f08030");
      }
    }
    if (m.psn > 0) {
      m.psn -= dt;
      m.psnT += dt;
      if (Math.random() < dt * 9) this.parts.push({ x: m.x + (Math.random() - 0.5) * 10, y: m.y, vx: 0, vy: 0, life: 0.7, max: 0.7, color: Math.random() < 0.5 ? "#c060d0" : "#c8f060", size: 2, grav: 0, z: 10, vz: 22 + Math.random() * 14, gz: 0 });
      if (m.psnT >= 1) {
        m.psnT -= 1;
        this.damageDirect(m, Math.max(1, Math.round(m.maxHp * 9e-3)), "#c060d0");
      }
    }
    if (m.para > 0) {
      m.para -= dt;
      if (Math.random() < dt * 10) this.spawnPart(m.x + (Math.random() - 0.5) * 12, m.y, "#f8e848", 1, 10, 0.2, 1, 0, 6 + Math.random() * 10);
    }
  }
  damageDirect(m, dmg, color) {
    if (!m.alive || m.state === "faint") return;
    m.hp = Math.max(0, m.hp - dmg);
    this.text(m.x, m.y, String(dmg), color, 0.7, false, m.sp.height);
    if (m.hp <= 0) this.faint(m);
  }
  // ───────────── Attacken ─────────────
  startMove(m, mv, aim, target) {
    m.state = "windup";
    m.t = 0;
    m.move = mv;
    m.aim = aim;
    m.hitDone = false;
    m.moveSerial = this.nid();
    m.cd[mv.id] = mv.cooldown;
    if (m.forcedId === mv.id) {
      m.forcedId = null;
      m.forced = 0;
    }
    if (mv.cooldown >= 3) this.text(m.x, m.y, mv.name.toUpperCase(), this.typePalette(mv.type)[1], 0.9, false, m.sp.height + 6);
    m.face = Math.cos(aim) >= 0 ? 1 : -1;
    if (mv.kind === "aoe") {
      const tx = clamp(target?.x ?? m.x + Math.cos(aim) * 60, ARENA.x0, ARENA.x1);
      const ty = clamp(target?.y ?? m.y + Math.sin(aim) * 60, ARENA.y0, ARENA.y1);
      this.zones.push({ id: this.nid(), x: mv.nova ? m.x : tx, y: mv.nova ? m.y : ty, r: mv.multi ? mv.radius * 1.9 : mv.radius, t: 0, delay: mv.windup, owner: m, move: mv, done: false, fade: 0 });
    }
    if (mv.kind === "cone" || mv.kind === "dash") m.forced = 0;
  }
  fireMove(m) {
    const mv = m.move;
    if (mv.special) {
      this.slowmo = Math.max(this.slowmo, 0.22);
      this.shake = Math.max(this.shake, 3.5);
      this.flashScreen = Math.max(this.flashScreen, 0.06);
      this.text(m.x, m.y, mv.name.toUpperCase() + "!", this.typePalette(mv.type)[1], 1.1, true, m.sp.height + 22);
    }
    const e = this.enemyOf(m);
    switch (mv.kind) {
      case "projectile": {
        const n = mv.shots ?? 1, sc = n > 1 ? mv.shotScale ?? 1 : 1;
        if (mv.ring) {
          for (let i = 0; i < n; i++) this.spawnProj(m, mv, m.aim + i * TAU / n, sc);
          this.ringBurst(m, mv);
        } else if (mv.interval) {
          this.spawnProj(m, mv, m.aim, sc);
          for (let i = 1; i < n; i++) this.shotQueue.push({ at: this.t + i * mv.interval, m, mv, ang: m.aim });
        } else {
          for (let i = 0; i < n; i++) this.spawnProj(m, mv, m.aim + (n > 1 ? (i - (n - 1) / 2) * (mv.spread ?? 0.2) : 0), sc);
        }
        this.muzzle(m, mv);
        this.events.push({ type: "shoot", move: mv });
        m.vx -= Math.cos(m.aim) * 24;
        m.vy -= Math.sin(m.aim) * 24;
        this.endMove(m);
        break;
      }
      case "melee": {
        this.slashes.push({ x: m.x + Math.cos(m.aim) * 14, y: m.y + Math.sin(m.aim) * 8, z: 14, ang: m.aim, t: 0, r: mv.radius, color: "#ffffff" });
        this.events.push({ type: "slash" });
        const meleeMiss = !!e && e.alive && this.t - e.lastDodge < 0.9 && Math.hypot(e.x - m.x, e.y - m.y) - e.sp.radius < mv.radius + 70;
        if (e && e.targetable) {
          const dx = e.x - m.x, dy = e.y - m.y, d = Math.hypot(dx, dy) - e.sp.radius;
          if (d < mv.radius && Math.abs(angleDiff(m.aim, Math.atan2(dy, dx))) < mv.arc + 0.35) {
            this.hit(m, e, mv, 1);
            this.dust(e.x, e.y, 4);
          } else if (meleeMiss) this.registerDodge(e, m, true);
        } else if (meleeMiss && e) this.registerDodge(e, m, true);
        m.vx = Math.cos(m.aim) * 90;
        m.vy = Math.sin(m.aim) * 90;
        this.endMove(m);
        break;
      }
      case "dash": {
        const dist = Math.min(mv.range, e ? Math.hypot(e.x - m.x, e.y - m.y) + 12 : mv.range);
        m.state = "active";
        m.t = 0;
        m.hitDone = false;
        m.dashLeft = dist;
        m.dashDx = Math.cos(m.aim);
        m.dashDy = Math.sin(m.aim);
        this.events.push({ type: "dash" });
        break;
      }
      case "aoe": {
        const z = this.zones.find((zz) => zz.owner === m && !zz.done && zz.move === mv);
        if (z) this.strikeZone(z);
        this.endMove(m);
        break;
      }
      case "status": {
        this.impacts.push({ x: m.x, y: m.y, z: 0, t: 0, max: 0.45, kind: "groundring", c1: "#c070e0", c2: "#ffffff", ang: 0, big: true, r: mv.range });
        this.events.push({ type: "status", id: "debuff" });
        if (e && e.targetable && Math.hypot(e.x - m.x, e.y - m.y) <= mv.range + e.sp.radius) for (const fx of mv.stages ?? []) this.applyStage(e, fx.stat, fx.n);
        else this.text(m.x, m.y, "ZU WEIT WEG", "#b0b0b0", 0.8, false, m.sp.height + 8);
        this.endMove(m);
        break;
      }
      case "self": {
        const pal = this.typePalette(mv.type);
        for (const fx of mv.stages ?? []) this.applyStage(m, fx.stat, fx.n);
        if (mv.heal) {
          const before = m.hp;
          m.hp = Math.min(m.maxHp, m.hp + Math.round(m.maxHp * mv.heal));
          this.text(m.x, m.y, "+" + (m.hp - before), "#60f080", 1, true, m.sp.height);
          this.events.push({ type: "heal" });
        }
        if (mv.shield) {
          m.shield = Math.max(m.shield, Math.round(m.maxHp * mv.shield));
          m.shieldT = 5;
          this.text(m.x, m.y, "SCHILD!", "#8cdcff", 0.9, false, m.sp.height + 10);
          this.events.push({ type: "cmd" });
        }
        if (mv.buff) {
          m.buffT = Math.max(m.buffT, mv.buff);
          this.text(m.x, m.y, "ANGRIFF +", "#ff9060", 0.9, false, m.sp.height + 10);
          this.events.push({ type: "cmd" });
        }
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * 6.28;
          this.parts.push({ x: m.x + Math.cos(a) * 12, y: m.y + Math.sin(a) * 8, vx: 0, vy: 0, life: 0.7, max: 0.7, color: pal[i % 3], size: 2, grav: 0, z: 2, vz: 40 + Math.random() * 40, gz: 0 });
        }
        this.endMove(m);
        break;
      }
      case "cone": {
        m.state = "active";
        m.t = 0;
        m.tickT = 0;
        m.hitDone = false;
        this.events.push({ type: "flame" });
        break;
      }
    }
  }
  endMove(m) {
    m.state = "recover";
    m.t = 0;
    if (m.punishT > 0) {
      m.t = -m.punishT;
      m.punishT = 0;
    }
    const N = NATURES[m.nature];
    m.retreatT = N.hitAndRun * (0.7 + this.rng.next() * 0.6);
  }
  updateActive(m, dt) {
    const mv = m.move;
    const e = this.enemyOf(m);
    if (mv.kind === "dash") {
      const step = mv.speed * dt;
      m.x += m.dashDx * step;
      m.y += m.dashDy * step;
      m.dashLeft -= step;
      m.moving = true;
      m.face = m.dashDx >= 0 ? 1 : -1;
      if (Math.floor(m.t * 90) % 2 === 0) this.ghosts.push({ x: m.x, y: m.y, face: m.face, t: 0, mon: m });
      this.parts.push({ x: m.x - m.dashDx * 6 + (Math.random() - 0.5) * 6, y: m.y - m.dashDy * 6 + (Math.random() - 0.5) * 4, vx: -m.dashDx * 20, vy: -m.dashDy * 20, life: 0.22, max: 0.22, color: (TYPE_FX[mv.type]?.pal ?? TYPE_FX.normal.pal)[Math.random() < 0.5 ? 1 : 2], size: mv.type === "normal" ? 2 : 3, grav: 0, z: 6 + Math.random() * m.sp.height * 0.5 });
      if (e && e.targetable && !m.hitDone && Math.hypot(e.x - m.x, e.y - m.y) < e.sp.radius + m.sp.radius + 3) {
        m.hitDone = true;
        this.hit(m, e, mv, 1);
        m.vx = -m.dashDx * 70;
        m.vy = -m.dashDy * 70;
        this.endMove(m);
        return;
      }
      if (m.dashLeft <= 0 && !m.hitDone && e && e.alive && this.t - e.lastDodge < 1 && Math.hypot(e.x - m.x, e.y - m.y) < 70) {
        m.hitDone = true;
        this.registerDodge(e, m, true);
      }
      if (m.dashLeft <= 0) {
        m.vx = m.dashDx * 40;
        m.vy = m.dashDy * 40;
        this.endMove(m);
      }
    } else if (mv.kind === "cone") {
      m.vx *= 0.9;
      m.vy *= 0.9;
      if (e) {
        const want = Math.atan2(e.y - m.y, e.x - m.x);
        m.aim += clamp(angleDiff(m.aim, want), -1.3 * dt, 1.3 * dt);
      }
      m.face = Math.cos(m.aim) >= 0 ? 1 : -1;
      const water = mv.type === "water";
      const grass = mv.type === "grass";
      const fxp = TYPE_FX[mv.type]?.pal ?? TYPE_FX.normal.pal;
      const pal = mv.type === "wind" || mv.type === "poison" || mv.type === "metal" || mv.type === "light" || mv.type === "earth" || mv.type === "sound" || mv.type === "dark" || mv.type === "crystal" ? [fxp[0], fxp[0], fxp[1], fxp[1], fxp[2]] : mv.type === "ice" ? ["#ffffff", "#e0f8ff", "#a8e0f8", "#78c8e8", "#4898c0"] : mv.type === "ghost" ? ["#f0e0ff", "#d0a8f0", "#a070d0", "#7048a8", "#503078"] : mv.type === "rock" ? ["#f0e0c0", "#d8c090", "#b09060", "#8a6a40", "#6a5030"] : mv.type === "electric" ? ["#ffffff", "#fff6a0", "#f8e848", "#f8d030", "#d8a818"] : grass ? ["#ffffff", "#f8c8dc", "#b8e068", "#78b840", "#4a8a2c"] : water ? ["#ffffff", "#c8e4ff", "#8cc0ff", "#6890f0", "#4870d0"] : ["#fff6c0", "#f8e070", "#f8a030", "#f07820", "#d83818"];
      for (let i = 0; i < 9; i++) {
        const a = m.aim + (Math.random() - 0.5) * mv.arc * (water ? 0.8 : 1.5);
        const sp = (water ? 150 : 110) + Math.random() * 90;
        const life = (water ? 0.42 : 0.5) * (0.65 + Math.random() * 0.45);
        this.parts.push({
          x: m.x + Math.cos(m.aim) * (m.sp.radius + 6),
          y: m.y + Math.sin(m.aim) * (m.sp.radius * 0.5 + 3),
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp * 0.9,
          life,
          max: life,
          color: pal[Math.random() * pal.length | 0],
          size: 3 + (Math.random() * 2 | 0),
          grow: water ? 2 : 5,
          grav: water ? 0 : -8,
          z: m.sp.height * 0.5 + Math.random() * 4,
          vz: water ? -6 : grass ? 8 : 10,
          gz: grass ? 60 : 0
        });
      }
      m.tickT += dt;
      if (m.tickT >= 0.2) {
        m.tickT -= 0.2;
        if (e && e.targetable) {
          const dx = e.x - m.x, dy = e.y - m.y, d = Math.hypot(dx, dy) - e.sp.radius * 0.5;
          if (d < mv.range && Math.abs(angleDiff(m.aim, Math.atan2(dy, dx))) < mv.arc + 0.12 && !this.losBlocked(m.x, m.y, e.x, e.y)) this.hit(m, e, mv, 0.2, { noStagger: true });
        }
      }
      if (m.t >= mv.duration) this.endMove(m);
    }
  }
  /** Kranz-Salve: Druckring und Funken rund ums Monster */
  ringBurst(m, mv) {
    const pal = this.typePalette(mv.type);
    this.impacts.push({ x: m.x, y: m.y, z: 0, t: 0, max: 0.4, kind: "shock", c1: pal[1], c2: pal[0], ang: 0, big: true, r: 46 });
    for (let i = 0; i < 22; i++) {
      const a = i / 22 * TAU;
      this.parts.push({ x: m.x, y: m.y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 60, life: 0.3, max: 0.3, color: pal[i % 3], size: 2, grav: 0, z: m.sp.height * 0.4 });
    }
    this.shake = Math.max(this.shake, 2.5);
    this.events.push({ type: "blast" });
  }
  /** Nova: Druckwelle um das Monster */
  strikeNova(z) {
    z.done = true;
    z.fade = 0.5;
    const t = z.move.type, pal = this.typePalette(t), m = z.owner;
    this.impacts.push({ x: m.x, y: m.y, z: 0, t: 0, max: 0.55, kind: "shock", c1: pal[1], c2: pal[0], ang: 0, big: true, r: z.r * 1.15 });
    this.impacts.push({ x: m.x, y: m.y, z: 0, t: -0.1, max: 0.5, kind: "shock", c1: pal[2], c2: pal[1], ang: 0, big: true, r: z.r * 1.15 });
    this.impacts.push({ x: m.x, y: m.y, z: 0, t: -0.2, max: 0.45, kind: "shock", c1: pal[0], c2: pal[2], ang: 0, big: true, r: z.r * 0.9 });
    this.typeStrike(t, m.x, m.y, z.r * 0.8, true);
    for (let i = 0; i < 46; i++) {
      const a = i / 46 * TAU, sp = 110 + i % 3 * 40;
      this.parts.push({ x: m.x, y: m.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, life: 0.45, max: 0.45, color: pal[i % 3], size: 2 + i % 2, grav: 0, z: 5, grow: 1 });
    }
    this.shake = Math.max(this.shake, 6.5);
    this.flashScreen = Math.max(this.flashScreen, 0.14);
    this.hitstop = Math.max(this.hitstop, 0.05);
    this.events.push({ type: t === "electric" ? "thunder" : "blast" });
    const e = this.enemyOf(m);
    if (e && e.targetable && Math.hypot(e.x - m.x, e.y - m.y) < z.r + e.sp.radius * 0.6) {
      const dx = e.x - m.x, dy = e.y - m.y, dl = Math.hypot(dx, dy) || 1;
      this.hit(m, e, z.move, 1);
      e.kx += dx / dl * 170;
      e.ky += dy / dl * 120;
    } else if (e && e.alive && this.t - e.lastDodge < 1.6 && Math.hypot(e.x - m.x, e.y - m.y) < z.r * 2) this.registerDodge(e, m, false);
  }
  /** Schauer: mehrere Einschläge nacheinander im Zielgebiet, der erste genau aufs Ziel */
  strikeMulti(z) {
    z.done = true;
    z.fade = 0.35;
    const n = z.move.multi ?? 4, sub = z.move.radius;
    for (let i = 0; i < n; i++) {
      const a = this.rng.next() * TAU, d = Math.sqrt(this.rng.next()) * (z.r - sub * 0.6);
      this.strikeQueue.push({ at: this.t + i * 0.16, x: i === 0 ? z.x : z.x + Math.cos(a) * d, y: i === 0 ? z.y : z.y + Math.sin(a) * d * 0.8, r: sub, owner: z.owner, mv: z.move, scale: 0.6 });
    }
  }
  processStrikes() {
    if (!this.strikeQueue.length) return;
    for (const q of this.strikeQueue) {
      if (this.t < q.at) continue;
      const s = q;
      q.at = Infinity;
      if (!s.owner.alive) continue;
      const pal = this.typePalette(s.mv.type);
      this.impacts.push({ x: s.x, y: s.y, z: 0, t: 0, max: 0.4, kind: "groundring", c1: pal[0], c2: pal[1], ang: 0, big: true, r: s.r * 1.6 });
      this.typeStrike(s.mv.type, s.x, s.y, s.r, false);
      this.shake = Math.max(this.shake, 2.2);
      this.events.push({ type: s.mv.type === "electric" ? "thunder" : "blast" });
      const e = this.enemyOf(s.owner);
      if (e && e.targetable && Math.hypot(e.x - s.x, e.y - s.y) < s.r + e.sp.radius * 0.6) this.hit(s.owner, e, s.mv, s.scale);
    }
    this.strikeQueue = this.strikeQueue.filter((q) => q.at !== Infinity);
  }
  /** Typ-Effekt eines Einschlags: Säule, Stacheln, Wirbel, Sog … je nach Element */
  typeStrike(t, x, y, r, big) {
    const pal = this.typePalette(t), P = (n, f) => {
      for (let i = 0; i < n; i++) this.parts.push(f(i));
    };
    const R = Math.random;
    switch (t) {
      case "fire":
        this.impacts.push({ x, y, z: 0, t: 0, max: 0.6, kind: "pillar", c1: "#f07820", c2: "#fff6c0", ang: 0, big, r });
        break;
      case "light":
        this.impacts.push({ x, y, z: 0, t: 0, max: 0.7, kind: "pillar", c1: "#fff0a0", c2: "#ffffff", ang: 0, big: true, r: r * 0.9 });
        this.flashScreen = Math.max(this.flashScreen, 0.1);
        break;
      case "ghost":
        this.impacts.push({ x, y, z: 0, t: 0, max: 0.8, kind: "pillar", c1: "#583888", c2: "#d0a8f0", ang: 0, big, r: r * 0.8 });
        P(18, (i) => ({ x: x + (R() - 0.5) * r * 1.6, y: y + (R() - 0.5) * r, vx: (R() - 0.5) * 8, vy: 0, life: 0.9, max: 0.9, color: pal[i % 3], size: 2, grav: 0, z: 2, vz: 40 + R() * 50, gz: -10 }));
        break;
      case "ice":
      case "crystal":
      case "earth":
      case "rock":
        this.impacts.push({ x, y, z: 0, t: 0, max: 0.75, kind: "spikes", c1: pal[1], c2: pal[0], ang: R() * 6, big, r });
        this.impacts.push({ x, y, z: 0, t: 0, max: 0.75, kind: "spikes", c1: pal[2], c2: pal[1], ang: R() * 6, big: false, r: r * 0.6 });
        break;
      case "grass":
        this.impacts.push({ x, y, z: 0, t: 0, max: 0.7, kind: "spikes", c1: "#78b840", c2: "#e8ffb0", ang: R() * 6, big, r });
        break;
      case "dark":
        this.impacts.push({ x, y, z: 0, t: 0, max: 0.8, kind: "vortex", c1: "#6a50a0", c2: "#201838", ang: 0, big: true, r });
        P(24, (i) => {
          const a = R() * TAU, d = r * (0.8 + R() * 0.6);
          return { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.7, vx: -Math.cos(a) * d * 2.2, vy: -Math.sin(a) * d * 1.5, life: 0.45, max: 0.45, color: pal[i % 3], size: 2, grav: 0, z: 6 };
        });
        break;
      case "wind":
        this.impacts.push({ x, y, z: 0, t: 0, max: 0.8, kind: "vortex", c1: "#c8ffe8", c2: "#6cd0a8", ang: 1, big, r });
        P(30, (i) => {
          const a = R() * TAU, d = R() * r;
          return { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.7, vx: -Math.sin(a) * 60, vy: Math.cos(a) * 40, life: 0.7, max: 0.7, color: pal[i % 3], size: 2, grav: 0, z: 2, vz: 70 + R() * 60, gz: 0 };
        });
        break;
      case "sound":
        for (let k = 0; k < 3; k++) this.impacts.push({ x, y, z: 0, t: -k * 0.1, max: 0.45, kind: "shock", c1: pal[1], c2: pal[0], ang: 0, big: true, r: r * (1.3 + k * 0.25) });
        break;
      case "poison":
        this.impacts.push({ x, y, z: 0, t: 0, max: 1.6, kind: "scorch", c1: "#7a2a90", c2: "#c8f060", ang: 0, big: true, r: r * 1.1 });
        P(16, (i) => ({ x: x + (R() - 0.5) * r * 1.4, y: y + (R() - 0.5) * r, vx: 0, vy: 0, life: 0.9, max: 0.9, color: i % 2 ? "#c8f060" : "#c060d0", size: 3, grav: 0, z: 2, vz: 25 + R() * 30, gz: -8 }));
        break;
      case "metal":
        P(20, (i) => {
          const a = R() * TAU;
          return { x, y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 90, life: 0.35, max: 0.35, color: i % 2 ? "#ffffff" : "#c8d0e0", size: 1, grav: 0, z: 6 + R() * 8, vz: 50 + R() * 80, gz: 320 };
        });
        this.impacts.push({ x, y, z: 0, t: 0, max: 0.35, kind: "shock", c1: "#ffffff", c2: "#c8d0e0", ang: 0, big, r: r * 1.2 });
        break;
      case "water":
        this.impacts.push({ x, y, z: 0, t: 0, max: 0.6, kind: "pillar", c1: "#6890f0", c2: "#e0f0ff", ang: 0, big, r: r * 0.7 });
        break;
      case "electric":
        this.bolts.push({ x, y, t: 0, seed: R() * 1e3 });
        break;
      default:
        break;
    }
  }
  strikeZone(z) {
    if (z.move.multi) {
      this.strikeMulti(z);
      return;
    }
    if (z.move.nova) {
      this.strikeNova(z);
      return;
    }
    z.done = true;
    z.fade = 0.5;
    const t = z.move.type, pal = this.typePalette(t), big = z.r > 28;
    if (t === "electric") for (const dx of [0, -9, 9]) this.bolts.push({ x: z.x + dx, y: z.y, t: Math.abs(dx) / 200, seed: this.rng.next() * 1e3 });
    this.impacts.push({ x: z.x, y: z.y, z: 0, t: 0, max: 1.4, kind: "scorch", c1: t === "water" ? "#3a5a8a" : t === "grass" ? "#2f5a2a" : t === "ice" ? "#5a8aa8" : t === "ghost" ? "#403060" : t === "rock" ? "#5a4a30" : "#3a3020", c2: pal[1], ang: 0, big: true, r: z.r });
    this.impacts.push({ x: z.x, y: z.y, z: 0, t: 0, max: 0.4, kind: "groundring", c1: pal[0], c2: pal[1], ang: 0, big: true, r: z.r * 1.7 });
    this.events.push({ type: t === "electric" ? "thunder" : "blast" });
    this.shake = Math.max(this.shake, big ? 5 : 3.5);
    this.flashScreen = big ? 0.14 : 0.08;
    const n = big ? 70 : 44;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * z.r, sp = 20 + Math.random() * 50;
      this.parts.push({
        x: z.x + Math.cos(a) * d,
        y: z.y + Math.sin(a) * d,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp * 0.6,
        life: 0.5 + Math.random() * 0.4,
        max: 0.9,
        color: pal[i % 3],
        size: 2 + i % 3,
        grow: t === "fire" ? 3 : 1,
        grav: 0,
        z: 2,
        vz: (t === "water" ? 150 : 90) + Math.random() * 90,
        gz: t === "water" ? 380 : t === "grass" ? 160 : 40
      });
    }
    const e = this.enemyOf(z.owner);
    if (e && e.targetable && Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.sp.radius * 0.6) this.hit(z.owner, e, z.move, 1);
    else if (e && e.alive && this.t - e.lastDodge < 1.6 && Math.hypot(e.x - z.x, e.y - z.y) < z.r * 2.4) this.registerDodge(e, z.owner, false);
  }
  // ───────────── Effekte rund um Attacken ─────────────
  spawnProj(m, mv, ang, scale) {
    const sp = mv.speed;
    this.projs.push({
      id: this.nid(),
      x: m.x + Math.cos(ang) * (m.sp.radius + 4),
      y: m.y + Math.sin(ang) * (m.sp.radius * 0.5 + 2),
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      r: mv.radius,
      life: mv.homing ? 2.6 : mv.ring ? 1.2 : 1.8,
      owner: m,
      move: mv,
      age: 0,
      scale,
      trail: [],
      homing: mv.homing
    });
  }
  processShots() {
    for (const q of this.shotQueue) {
      if (this.t < q.at) continue;
      const mm = q.m;
      q.at = Infinity;
      if (mm.alive && mm.state !== "faint" && mm.state !== "benched" && mm.state !== "recall") {
        const e = this.enemyOf(mm);
        const ang = e ? Math.atan2(e.y - mm.y, e.x - mm.x) * 0.5 + q.ang * 0.5 : q.ang;
        this.spawnProj(mm, q.mv, ang, q.mv.shotScale ?? 1);
        this.events.push({ type: "shoot", move: q.mv });
        this.muzzle(mm, q.mv, 3);
      }
    }
    this.shotQueue = this.shotQueue.filter((q) => q.at !== Infinity);
  }
  typePalette(t) {
    return [...TYPE_FX[t]?.pal ?? TYPE_FX.normal.pal];
  }
  /** Mündungsblitz am Maul */
  muzzle(m, mv, n = 8) {
    const pal = this.typePalette(mv.type);
    for (let i = 0; i < n; i++) {
      const a = m.aim + (Math.random() - 0.5) * 1.2, sp = 40 + Math.random() * 70;
      this.parts.push({ x: m.x + Math.cos(m.aim) * (m.sp.radius + 4), y: m.y + Math.sin(m.aim) * (m.sp.radius * 0.5 + 2), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, life: 0.2, max: 0.2, color: pal[i % 3], size: 2, grav: 0, z: m.sp.height * 0.45 });
    }
  }
  /** Aufladen: Partikel strömen zum Monster (macht die Anspannung lesbar) */
  charge(m, dt) {
    const mv = m.move;
    if (Math.random() > dt * (mv.armor ? 70 : 38)) return;
    const pal = this.typePalette(mv.type), a = Math.random() * 6.28, r = m.sp.radius + 12 + Math.random() * 8;
    this.parts.push({ x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * r * 3.2, vy: -Math.sin(a) * r * 2.2, life: 0.26, max: 0.26, color: pal[Math.random() * 3 | 0], size: 2, grav: 0, z: 6 + Math.random() * m.sp.height * 0.7 });
  }
  dust(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, sp = 20 + Math.random() * 40;
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, life: 0.4, max: 0.4, color: i % 2 ? "#e0d4a8" : "#c8bc90", size: 3, grav: 0, z: 2, vz: 20 + Math.random() * 20, gz: 60 });
    }
  }
  /** Treffer-Effekt je Typ: Stern + Ring + Typ-Partikel */
  impact(def, mv, big, ang) {
    const pal = this.typePalette(mv.type), z = def.sp.height * 0.5;
    this.impacts.push({ x: def.x, y: def.y, z, t: 0, max: big ? 0.3 : 0.2, kind: mv.id === "clawswipe" ? "claw" : "star", c1: pal[1], c2: pal[0], ang, big, r: big ? 14 : 9 });
    if (big) this.impacts.push({ x: def.x, y: def.y, z, t: 0, max: 0.32, kind: "ring", c1: pal[2], c2: pal[0], ang, big, r: 24 });
    const n = big ? 14 : 6;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, sp = 40 + Math.random() * 90;
      const water = mv.type === "water", fire = mv.type === "fire", grass = mv.type === "grass";
      this.parts.push({
        x: def.x,
        y: def.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp * 0.5,
        life: 0.35 + Math.random() * 0.2,
        max: 0.5,
        color: pal[i % 3],
        size: 2 + i % 2,
        grav: 0,
        z,
        vz: water ? 50 + Math.random() * 60 : fire ? 20 + Math.random() * 40 : grass ? 30 + Math.random() * 40 : (Math.random() - 0.3) * 60,
        gz: water ? 260 : fire ? -30 : grass ? 110 : 0
      });
    }
  }
  updateLook(m) {
    const e = this.enemyOf(m);
    let want = m.look;
    if (m.state === "windup" || m.state === "active" && m.move?.kind === "cone") want = m.aim;
    else if (m.state === "active" && m.move?.kind === "dash") want = Math.atan2(m.dashDy, m.dashDx);
    else if (Math.hypot(m.vx, m.vy) > 22 && m.state === "ready") want = Math.atan2(m.vy, m.vx);
    else if (m.state === "recover" && m.move) want = m.aim;
    else if (e && e.state !== "benched") want = Math.atan2(e.y - m.y, e.x - m.x);
    m.look = want;
  }
  updateProjectiles(dt) {
    for (const p of this.projs) {
      if (p.homing) {
        const he = this.enemyOf(p.owner);
        if (he && he.targetable) {
          const a = Math.atan2(p.vy, p.vx), sp = Math.hypot(p.vx, p.vy), want = Math.atan2(he.y - p.y, he.x - p.x);
          const na = a + clamp(angleDiff(a, want), -p.homing * dt, p.homing * dt);
          p.vx = Math.cos(na) * sp;
          p.vy = Math.sin(na) * sp;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.age += dt;
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 9) p.trail.shift();
      if (p.move.type === "fire" && Math.random() < 0.7) this.parts.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 10, life: 0.35, max: 0.35, color: Math.random() < 0.5 ? "#f8c030" : "#d83818", size: 2, grav: 0, z: 14, vz: 16, gz: 0 });
      if (p.move.type === "electric" && Math.random() < 0.6) this.parts.push({ x: p.x + (Math.random() - 0.5) * 8, y: p.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 20, life: 0.18, max: 0.18, color: "#f8f080", size: 1, grav: 0, z: 14 + (Math.random() - 0.5) * 10 });
      if (p.move.type === "grass" && Math.random() < 0.6) this.parts.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 24, vy: (Math.random() - 0.5) * 12, life: 0.4, max: 0.4, color: Math.random() < 0.5 ? "#90d048" : "#3f7f2a", size: 2, grav: 0, z: p.owner.sp.height * 0.5, vz: 8, gz: 90 });
      if (p.move.type === "water" && Math.random() < 0.5) this.parts.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 10, life: 0.3, max: 0.3, color: "#a8d0f8", size: 1, grav: 0, z: 14, vz: 10, gz: 120 });
      for (const f of this.rocks) if (Math.hypot(f.x - p.x, f.y - p.y) < f.r - 1) {
        p.life = 0;
        const pal = this.typePalette(p.move.type);
        for (let i = 0; i < 6; i++) this.spawnPart(p.x, p.y, pal[i % 3], 1, 60, 0.3, 2, 0, 12);
        this.events.push({ type: "slash" });
        break;
      }
      if (p.life <= 0) continue;
      const e = this.enemyOf(p.owner);
      if (e && !p.evaded && this.t - e.lastDodge < 1 && e.alive) {
        const dx = e.x - p.x, dy = e.y - p.y;
        if (Math.hypot(dx, dy) < p.r + e.sp.radius + 30 && dx * p.vx + dy * p.vy < 0) {
          p.evaded = true;
          this.registerDodge(e, p.owner, false);
        }
      }
      if (e && e.targetable && Math.hypot(e.x - p.x, e.y - p.y) < p.r + e.sp.radius) {
        this.hit(p.owner, e, p.move, p.scale, { dirX: p.vx, dirY: p.vy });
        p.life = 0;
      }
      if (p.x < ARENA.x0 - 14 || p.x > ARENA.x1 + 14 || p.y < ARENA.y0 - 14 || p.y > ARENA.y1 + 14) p.life = 0;
    }
    this.projs = this.projs.filter((p) => p.life > 0);
  }
  updateZones(dt) {
    for (const z of this.zones) {
      if (!z.done) {
        z.t += dt;
        if (z.move.nova) {
          z.x = z.owner.x;
          z.y = z.owner.y;
        }
        if (z.owner.state !== "windup" || z.owner.move !== z.move) {
          z.done = true;
          z.fade = 0.15;
        }
      } else z.fade -= dt;
    }
    this.zones = this.zones.filter((z) => !z.done || z.fade > 0);
  }
  // ───────────── Schaden ─────────────
  calc(att, def, mv) {
    const A = (mv.physical ? att.atk : att.spa) * stageMul(att.stage.atk), D = (mv.physical ? def.def : def.spd) * stageMul(def.stage.def);
    const base = ((2 * att.level / 5 + 2) * mv.power * A / D / 50 + 2) * (1 + Math.max(0, att.level - 10) * LVL_DMG);
    const stab = att.sp.types.includes(mv.type) ? 1.5 : 1;
    const eff = typeEffectiveness(mv.type, def.sp.types);
    const crit = this.rng.next() < (att.nature === "sly" ? 1 / 7 : 1 / 14) ? 1.5 : 1;
    const rand = 0.88 + this.rng.next() * 0.12;
    const effDmg = eff > 1 ? 1.07 : eff < 1 ? 0.95 : 1;
    const tA = this.trainerOf(att).tactic, tD = this.trainerOf(def).tactic;
    const counter = att.counterT > 0 && mv.kind !== "status" ? tA === "counter" ? 1.5 : tA === "defend" ? 1.45 : 1.3 : 1;
    const mul = counter * (tA === "attack" ? 1.08 : 1) * (tD === "defend" ? 0.92 : 1) * (1 + Math.max(0, (this.t - this.finaleAt) / 28)) * (att.own ? TERRAIN_BONUS : 1) * (att.hpFrac < 0.25 ? 1.1 : 1) * (att.nature === "brave" && att.hpFrac < 0.5 ? 1.12 : 1) * (def.nature === "calm" ? 0.92 : 1) * bondDmg(att.bondLvl) * synDmg(this.trainerOf(att).syn, mv.type) * (this.mod.mul[mv.type] ?? 1) * (att.amulet?.dmgType === mv.type ? att.amulet.dmgMul ?? 1 : 1) * (att.buffT > 0 ? 1.25 : 1) * (att.rage ? 1.15 : 1) * (att.elixir ? 1.2 : 1) * (att.hpFrac < 0.5 ? att.amulet?.rage ?? 1 : 1) / (def.amulet?.takenMul ?? 1);
    return { dmg: base * stab * effDmg * rand * crit * mul, eff, crit: crit > 1, counter: counter > 1 };
  }
  hit(att, def, mv, scale, o = {}) {
    const r = this.calc(att, def, mv);
    let dmg = Math.max(1, Math.round(r.dmg * scale));
    if (r.counter && scale >= 0.9) {
      att.counterT = 0;
      this.stats.counters[att.side]++;
      this.text(att.x, att.y, "KONTER!", "#ffe060", 1, true, att.sp.height + 14);
      this.shake = Math.max(this.shake, 3);
      this.hitstop = Math.max(this.hitstop, 0.06);
    }
    if (def.shield > 0 && scale >= 0.9 && this.t - def.shieldAt < 0.7) {
      dmg = 0;
      this.stats.parries[def.side]++;
      def.counterT = 5;
      def.shieldAt = -9;
      this.text(def.x, def.y, "PARIERT!", "#ffffff", 1.1, true, def.sp.height + 16);
      this.shake = Math.max(this.shake, 4);
      this.hitstop = Math.max(this.hitstop, 0.08);
      this.flashScreen = Math.max(this.flashScreen, 0.08);
      if (att.alive && att.state !== "faint") {
        if (att.state === "windup" || att.state === "active") att.punishT = 1;
        else {
          att.state = "stagger";
          att.t = -0.5;
          att.move = null;
        }
      }
      this.impacts.push({ x: def.x, y: def.y, z: def.sp.height * 0.5, t: 0, max: 0.35, kind: "ring", c1: "#8cdcff", c2: "#ffffff", ang: 0, big: true, r: 30 });
    }
    if (def.shield > 0 && dmg > 0) {
      const ab = Math.min(def.shield, dmg);
      def.shield -= ab;
      dmg -= ab;
      this.stats.blocked[def.side] += ab;
      this.text(def.x, def.y, "GEBLOCKT -" + ab, "#8cdcff", 0.8, false, def.sp.height + 14);
      if (def.shield <= 0) {
        def.shieldT = 0;
        this.spawnPart(def.x, def.y, "#8cdcff", 10, 70, 0.4, 2, 0, def.sp.height * 0.5);
      }
    }
    if (def.hp - dmg <= 0 && def.bondLvl >= 2 && !def.survived && def.hp > 1) {
      dmg = def.hp - 1;
      def.survived = true;
      if (def.bondLvl >= 3) {
        const hl = Math.round(def.maxHp * 0.25);
        def.hp = Math.min(def.maxHp, def.hp + hl);
        this.text(def.x, def.y, "+" + hl, "#60f080", 0.7, false, def.sp.height + 8);
      }
      this.text(def.x, def.y, "DURCHHALTEN!", "#ff9ad0", 1.1, true, def.sp.height + 26);
      this.shake = Math.max(this.shake, 3);
      this.hitstop = Math.max(this.hitstop, 0.07);
    }
    def.hp = Math.max(0, def.hp - dmg);
    def.flash = 0.14;
    if (def.nature === "brave" && !def.traitShown && def.alive && def.hpFrac < 0.5) {
      def.traitShown = true;
      this.text(def.x, def.y, "KAMPFGEIST!", "#ff8060", 1, false, def.sp.height + 26);
    }
    this.stats.dmg[att.side] += dmg;
    this.stats.hits[att.side]++;
    const big = scale >= 0.9, mid = scale >= 0.3;
    const col = r.eff > 1 ? "#ff6050" : r.eff < 1 ? "#a0a0a0" : "#ffffff";
    if (dmg > 0) this.text(def.x + (Math.random() - 0.5) * 8, def.y, String(dmg) + (r.crit ? "!" : ""), col, big ? 0.8 : 0.55, big, def.sp.height + 4);
    if (big && r.crit) this.text(def.x, def.y, "VOLLTREFFER!", "#ffe060", 0.9, false, def.sp.height + 24);
    if (big && r.eff > 1) this.text(def.x, def.y, "SEHR EFFEKTIV", "#ff8070", 0.9, false, def.sp.height + 14);
    if (big && r.eff < 1) this.text(def.x, def.y, "NICHT SEHR EFF.", "#b0b0b0", 0.9, false, def.sp.height + 14);
    if (def.amulet?.reflect && dmg > 0 && att.alive && att.state !== "faint") {
      const back = Math.max(1, Math.round(dmg * def.amulet.reflect));
      att.hp = Math.max(1, att.hp - back);
      if (scale >= 0.9) this.text(att.x, att.y, String(back), "#9ad060", 0.6, false, att.sp.height + 2);
    }
    const drain = (mv.drain ?? 0) + (att.amulet?.drain ?? 0);
    if (drain > 0 && dmg > 0 && att.alive && att.state !== "faint") {
      const heal = Math.max(1, Math.round(dmg * drain));
      const before = att.hp;
      att.hp = Math.min(att.maxHp, att.hp + heal);
      if (att.hp > before && (scale >= 0.9 || this.rng.next() < 0.5)) this.text(att.x, att.y, "+" + (att.hp - before), "#60f080", 0.6, false, att.sp.height + 8);
    }
    this.events.push({ type: "hit", mon: def, dmg, eff: r.eff, move: mv });
    const hitAng = Math.atan2(o.dirY ?? def.y - att.y, o.dirX ?? def.x - att.x);
    if (mid) this.impact(def, mv, big, hitAng);
    if (mid) {
      if (big) {
        this.hitstop = Math.max(this.hitstop, r.eff > 1 || r.crit ? 0.07 : 0.04);
        this.shake = Math.max(this.shake, r.eff > 1 ? 3 : 1.6);
      }
      let dx = o.dirX ?? def.x - att.x, dy = o.dirY ?? def.y - att.y;
      const dl = Math.hypot(dx, dy) || 1;
      dx /= dl;
      dy /= dl;
      const kb = (def.hp <= 0 ? 160 : 60) * (big ? 1 : 0.45);
      def.kx += dx * kb;
      def.ky += dy * kb * 0.8;
    }
    if (mv.foeStage && def.alive && scale >= 0.3 && this.rng.next() < mv.foeStage.chance * Math.min(1, scale * 1.2)) this.applyStage(def, mv.foeStage.stat, mv.foeStage.n);
    if (mv.status && def.alive && this.rng.next() < mv.status.chance * Math.min(1, scale * 1.2)) {
      if (mv.status.id === "burn" && def.burn <= 0 && !def.sp.types.includes("fire")) {
        def.burn = 6;
        def.burnT = 0;
        this.text(def.x, def.y, "VERBRANNT", "#f08030", 0.9, false, def.sp.height + 22);
        this.events.push({ type: "status", id: "burn" });
      }
      if (mv.status.id === "poison" && def.psn <= 0 && !def.sp.types.includes("poison") && !def.sp.types.includes("metal")) {
        def.psn = 8;
        def.psnT = 0;
        this.text(def.x, def.y, "VERGIFTET", "#c060d0", 0.9, false, def.sp.height + 22);
        this.events.push({ type: "status", id: "burn" });
      }
      if (mv.status.id === "para" && def.para <= 0 && !def.sp.types.includes("electric")) {
        def.para = 6;
        this.text(def.x, def.y, "PARALYSIERT", "#f8d030", 0.9, false, def.sp.height + 22);
        this.events.push({ type: "status", id: "para" });
      }
    }
    if (def.hp > 0 && !o.noStagger && big) {
      if (def.state === "windup" && !def.move.armor || def.state === "recover") {
        def.state = "stagger";
        def.t = 0;
        def.move = null;
      } else if (def.state === "ready") {
        def.state = "stagger";
        def.t = 0;
      }
    }
    if (def.hp <= 0) this.faint(def);
  }
  faint(m) {
    m.hp = 0;
    m.state = "faint";
    m.t = 0;
    m.move = null;
    this.projs = this.projs.filter((p) => p.owner !== m);
    for (const z of this.zones) if (z.owner === m) {
      z.done = true;
      z.fade = 0;
    }
    this.events.push({ type: "faint", mon: m });
    this.slowmo = 0.7;
    this.flashScreen = Math.max(this.flashScreen, 0.1);
    this.shake = Math.max(this.shake, 4);
  }
  // ───────────── Trainer-Aktionen (Manager) ─────────────
  canSwitchTo(tr, idx) {
    const m = tr.team[idx];
    if (!m || !m.alive || m === tr.active || tr.pending !== null) return false;
    if (tr.active && tr.active.alive && tr.switchCd > 0) return false;
    if (tr.active && !["ready", "recover", "stagger", "windup", "active", "dodge"].includes(tr.active.state) && tr.active.alive) return false;
    return true;
  }
  requestSwitch(tr, idx, force = false) {
    if (idx < 0) return false;
    if (!force && !this.canSwitchTo(tr, idx)) return false;
    const cur = tr.active;
    if (cur && cur.alive) {
      cur.state = "recall";
      cur.t = 0;
      cur.invuln = 1;
      cur.move = null;
      this.projs = this.projs.filter((p) => p.owner !== cur);
      for (const z of this.zones) if (z.owner === cur) {
        z.done = true;
        z.fade = 0;
      }
      tr.pending = idx;
    } else {
      tr.pending = idx;
    }
    return true;
  }
  processPending(tr) {
    const cur = tr.active;
    if (cur && cur.alive && cur.state === "recall" && cur.t < 0.35) return;
    const idx = tr.pending;
    tr.pending = null;
    const nm = tr.team[idx];
    if (!nm || !nm.alive) {
      if (cur && cur.state === "recall") {
        cur.state = "ready";
      }
      return;
    }
    let x = tr.lastX, y = tr.lastY;
    if (cur && cur.alive) {
      x = cur.x;
      y = cur.y;
      cur.state = "benched";
      cur.elixir = false;
      cur.forcedId = null;
      cur.stage = { atk: 0, def: 0, spe: 0 };
      for (let i = 0; i < 10; i++) this.spawnPart(x, y, "#ff6060", 1, 60, 0.4, 2, 0, 12);
    }
    tr.active = nm;
    nm.x = x;
    nm.y = y;
    nm.vx = nm.vy = nm.kx = nm.ky = 0;
    nm.state = "summon";
    nm.t = 0;
    nm.invuln = 0.45;
    nm.move = null;
    nm.fought = true;
    nm.face = tr.side === 0 ? 1 : -1;
    for (const k in nm.cd) nm.cd[k] = Math.max(nm.cd[k], 0.6);
    const sp = nm.special;
    if (sp) nm.cd[sp.id] = Math.max(nm.cd[sp.id], 3);
    const foeM = this.enemyOf(nm);
    if (foeM && foeM.alive && nm.moves.some((mv) => mv.kind !== "self" && mv.kind !== "status" && typeEffectiveness(mv.type, foeM.sp.types) > 1) && typeEffectiveness(foeM.moves[0]?.type ?? "normal", nm.sp.types) <= 1) {
      nm.counterT = 4;
      this.text(x, y, "TYPVORTEIL!", "#ffe060", 1.1, true, nm.sp.height + 14);
    }
    tr.lastX = x;
    tr.lastY = y;
    tr.switchCd = nm.amulet?.quickSwap ? 2.5 : 5;
    this.events.push({ type: "switch" });
    for (let i = 0; i < 12; i++) this.spawnPart(x, y, "#ffffff", 1, 70, 0.45, 2, 0, 12);
  }
  setTactic(tr, t) {
    tr.tactic = t;
  }
  // ───────────── Manager-Befehle (kosten Fokus) ─────────────
  spend(tr, cost) {
    if (tr.focus < cost || tr.cmdCd > 0) return false;
    tr.focus -= cost;
    tr.cmdCd = 0.6;
    this.events.push({ type: "cmd" });
    return true;
  }
  /** Befiehlt eine bestimmte ausgerüstete Attacke (Spezial kostet mehr Fokus). */
  commandMove(tr, id) {
    const m = tr.active;
    if (!m || !m.alive) return false;
    const mv = m.moves.find((x) => x.id === id);
    if (!mv || m.cd[mv.id] > 3) return false;
    if (!this.spend(tr, mv.special ? FOCUS.special : FOCUS.move)) return false;
    m.forced = 6;
    m.forcedId = mv.id;
    this.text(m.x, m.y, "BEFEHL: " + mv.name.toUpperCase(), "#ffe060", 0.8, false, m.sp.height + 14);
    return true;
  }
  /** Spezial! Das aktive Monster setzt seinen Spezialangriff ein, sobald er bereit ist. */
  commandSpecial(tr) {
    const m = tr.active;
    if (!m || !m.alive) return false;
    const sp = m.special;
    if (!sp || m.cd[sp.id] > 3 || m.forcedId === sp.id) return false;
    if (!this.spend(tr, FOCUS.special)) return false;
    m.forced = 6;
    m.forcedId = sp.id;
    this.text(m.x, m.y, "SPEZIAL!", "#ffe060", 0.9, false, m.sp.height + 10);
    return true;
  }
  /** Schild: nimmt bis zu 30 % der max. KP an Schaden auf (4 s). */
  commandShield(tr) {
    const m = tr.active;
    if (!m || !m.alive || m.shield > 0 || !this.spend(tr, FOCUS.shield)) return false;
    m.shield = Math.round(m.maxHp * 0.3);
    m.shieldT = 4;
    m.shieldAt = this.t;
    this.text(m.x, m.y, "SCHILD!", "#8cdcff", 0.9, false, m.sp.height + 10);
    this.spawnPart(m.x, m.y, "#8cdcff", 14, 60, 0.5, 2, 0, m.sp.height * 0.5);
    return true;
  }
  /** Anfeuern: +25 % Schaden für 8 s. */
  commandBuff(tr) {
    const m = tr.active;
    if (!m || !m.alive || m.buffT > 0 || !this.spend(tr, FOCUS.buff)) return false;
    m.buffT = 8;
    this.text(m.x, m.y, "ANGRIFF +", "#ff9060", 0.9, false, m.sp.height + 10);
    this.spawnPart(m.x, m.y, "#ff9060", 14, 60, 0.5, 2, -20, m.sp.height * 0.4);
    return true;
  }
  /** Ausweichen! Das aktive Monster springt sofort aus der Gefahr. */
  commandDodge(tr) {
    const m = tr.active;
    if (!m || !m.alive || tr.focus < FOCUS.dodge || tr.cmdCd > 0) return false;
    if (!manualDodge(this, m)) return false;
    tr.focus -= FOCUS.dodge;
    tr.cmdCd = 0.4;
    this.events.push({ type: "cmd" });
    return true;
  }
  /** Items: 'potion' 45 % KP · 'super' volle KP + Status · 'focus' +50 Fokus · 'elixir' +20 % Schaden bis zum Auswechseln */
  usePotion(tr, kind = "potion") {
    const m = tr.active;
    if (!m || !m.alive || tr.itemCd > 0) return false;
    if (kind === "focus") {
      if (tr.focusPots <= 0 || tr.focus > FOCUS.max - 10) return false;
      tr.focusPots--;
      tr.itemCd = 2;
      tr.focus = Math.min(FOCUS.max, tr.focus + 50);
      this.text(m.x, m.y, "FOKUS +50", "#78e0f8", 1, false, m.sp.height + 8);
      this.events.push({ type: "cmd" });
      return true;
    }
    if (kind === "elixir") {
      if (tr.elixirs <= 0 || m.elixir) return false;
      tr.elixirs--;
      tr.itemCd = 2;
      m.elixir = true;
      this.text(m.x, m.y, "ELIXIER! ANGRIFF +20%", "#ff9060", 1.1, false, m.sp.height + 8);
      this.events.push({ type: "cmd" });
      this.spawnPart(m.x, m.y, "#ff9060", 16, 60, 0.6, 2, -30, m.sp.height * 0.4);
      return true;
    }
    const have = kind === "super" ? tr.supers : tr.potions;
    if (have <= 0 || m.hp >= m.maxHp && !(kind === "super" && (m.burn > 0 || m.para > 0))) return false;
    if (kind === "super") tr.supers--;
    else tr.potions--;
    tr.itemCd = 2;
    const heal = kind === "super" ? m.maxHp : Math.round(m.maxHp * 0.45);
    const before = m.hp;
    m.hp = Math.min(m.maxHp, m.hp + heal);
    if (kind === "super") {
      m.burn = 0;
      m.para = 0;
    }
    this.text(m.x, m.y, "+" + (m.hp - before), "#60f080", 1, true, m.sp.height);
    this.events.push({ type: "heal" });
    for (let i = 0; i < 12; i++) this.spawnPart(m.x + (Math.random() - 0.5) * 16, m.y, "#80ff90", 1, 30, 0.7, 2, -40, 4);
    return true;
  }
  // ───────────── Effekte ─────────────
  spawnPart(x, y, color, n, speed, life, size, grav, z = 0) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = Math.random() * speed;
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, life, max: life, color, size, grav, z });
    }
  }
  text(x, y, text, color, life, big = false, z = 24) {
    const near = this.texts.filter((q) => Math.abs(q.x - x) < 36 && Math.abs(q.y - y) < 24 && q.max - q.life < 0.55).length;
    this.texts.push({ x, y, z: z + Math.min(3, near) * 9, rise: 0, text, color, life, max: life, vy: -22, big });
  }
  updateFx(dt) {
    for (const p of this.parts) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.grav * dt;
      p.vx *= 0.96;
      if (p.vz !== void 0) {
        p.z += p.vz * dt;
        p.vz -= (p.gz ?? 0) * dt;
        if (p.z < 0) {
          p.z = 0;
          p.vz = 0;
        }
      }
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const tx of this.texts) {
      tx.life -= dt;
      tx.rise -= tx.vy * dt;
      tx.vy *= 0.92;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const s of this.slashes) s.t += dt;
    this.slashes = this.slashes.filter((s) => s.t < 0.22);
    for (const b of this.bolts) b.t += dt;
    this.bolts = this.bolts.filter((b) => b.t < 0.35);
    for (const im of this.impacts) im.t += dt;
    this.impacts = this.impacts.filter((im) => im.t < im.max);
    for (const g of this.ghosts) g.t += dt;
    this.ghosts = this.ghosts.filter((g) => g.t < 0.18);
    this.shake = Math.max(0, this.shake - dt * 14);
    this.flashScreen = Math.max(0, this.flashScreen - dt);
  }
};

// src/state.ts
var newOwned = (id, sp, nature, level) => ({ id, sp, nature, level, xp: 0, moves: starterMoves(sp, level), extra: [], mv: {}, ap: Math.max(1, level - 9), bond: 0, bonus: noBonus(), item: null });
var newSave = () => ({
  v: 5,
  coins: 250,
  tier: 1,
  best: 0,
  nextId: 1,
  mons: [],
  team: [],
  inv: { potion: 3, super: 0, revive: 1, focus: 1, elixir: 0, keys: 0, books: 0, scrolls: [], amulets: [] },
  sound: true,
  run: null,
  stats: { runs: 0, clears: 0, battles: 0, wins: 0, recruits: 0, evolves: 0, elites: 0, stars: 0, towerBest: 0, learned: 0 },
  pl: { lvl: 1, xp: 0 },
  chest: { opened: 0, miss: 0 },
  raidLv: 0,
  rival: { wins: 0, losses: 0 },
  trophies: {},
  ach: [],
  seen: [],
  daily: { last: "", streak: 0 },
  opt: { vibe: true, music: true, hints: true },
  tut: { guide: false, battle: false }
});
var markSeen = (s, sp) => {
  if (!s.seen.includes(sp)) s.seen.push(sp);
};
var xpNeed = (level) => 30 + level * 5;
var MAX_LEVEL = 50;
function gainXp(s, o, amount) {
  const res = { levels: 0, evolved: [], learned: [] };
  o.xp += amount;
  while (o.level < MAX_LEVEL && o.xp >= xpNeed(o.level)) {
    o.xp -= xpNeed(o.level);
    o.level++;
    res.levels++;
    o.ap++;
    const e = SPECIES[o.sp].evolvesTo;
    if (e && o.level >= e.level) {
      res.evolved.push({ from: o.sp, to: e.id });
      o.sp = e.id;
      markSeen(s, e.id);
      s.stats.evolves++;
    }
    for (const [mv, l] of learnset(o.sp)) if (l === o.level) {
      res.learned.push(mv);
      s.stats.learned++;
      if (o.moves.length < MAX_MOVES && !o.moves.includes(mv)) o.moves.push(mv);
    }
  }
  return res;
}

// src/data/cups.ts
var CUPS = [
  { id: "bronze", name: "Bronze-Cup", blurb: "DER EINSTIEG: MAX. 2 MONSTER, GEGNER LEICHT UNTER DEINEM LEVEL.", minPl: 2, rounds: ["VIERTELFINALE", "HALBFINALE", "FINALE"], maxTeam: 2, lvlOff: -2, mod: "none", coins: 60, keys: 1, amulet: false },
  { id: "fire", name: "Feuer-Cup", blurb: "NUR FEUER-GEGNER, SONNENSCHEIN: WASSER-MONSTER SIND IM NACHTEIL.", minPl: 5, rounds: ["VIERTELFINALE", "HALBFINALE", "FINALE"], maxTeam: 3, lvlOff: -2, type: "fire", mod: "sun", coins: 90, keys: 1, amulet: false },
  { id: "water", name: "Wasser-Cup", blurb: "NUR WASSER-GEGNER BEI REGEN: PFLANZEN-MONSTER HABEN ES SCHWER.", minPl: 5, rounds: ["VIERTELFINALE", "HALBFINALE", "FINALE"], maxTeam: 3, lvlOff: -2, type: "water", mod: "rain", coins: 90, keys: 1, amulet: false },
  { id: "grass", name: "Pflanzen-Cup", blurb: "NUR PFLANZEN-GEGNER IM DSCHUNGEL: FEUER IST DEIN FREUND.", minPl: 5, rounds: ["VIERTELFINALE", "HALBFINALE", "FINALE"], maxTeam: 3, lvlOff: -2, type: "grass", mod: "jungle", coins: 90, keys: 1, amulet: false },
  { id: "silver", name: "Silber-Cup", blurb: "4 RUNDEN, MAX. 3 MONSTER, GEGNER MIT EIGENEN STRATEGIEN.", minPl: 9, rounds: ["ACHTELFINALE", "VIERTELFINALE", "HALBFINALE", "FINALE"], maxTeam: 3, lvlOff: -1, mod: "none", coins: 150, keys: 1, amulet: true },
  { id: "gold", name: "Meisterschaft", blurb: "DAS GROSSE FINALE: 4 RUNDEN, BIS ZU 5 MONSTER \u2013 IM ENDSPIEL WARTET DEIN RIVALE.", minPl: 14, rounds: ["ACHTELFINALE", "VIERTELFINALE", "HALBFINALE", "FINALE"], maxTeam: 5, lvlOff: -1, mod: "none", coins: 260, keys: 2, amulet: true, rival: true }
];
var CUP_HEAL = 0.4;
var cupById = (id) => CUPS.find((c) => c.id === id);

// src/league.ts
function generateMap(seed, tier) {
  const rng = new Rng(seed);
  const layers = [];
  let id = 0;
  for (let L = 0; L < LAYERS; L++) {
    const n = L === LAYERS - 1 ? 1 : L === 0 ? 2 : rng.int(2, 3);
    const kinds = [];
    for (let i = 0; i < n; i++) {
      let k;
      if (L === LAYERS - 1) k = "boss";
      else if (L === 0) k = "battle";
      else {
        const w = [["battle", 0.42], ["elite", L >= 3 ? 0.15 : 0], ["rest", 0.18], ["shop", 0.12], ["event", 0.16]];
        let r = rng.next() * w.reduce((a, b) => a + b[1], 0);
        k = "battle";
        for (const [kk, ww] of w) {
          r -= ww;
          if (r <= 0) {
            k = kk;
            break;
          }
        }
      }
      kinds.push(k);
    }
    if (L === 4) kinds[rng.int(0, n - 1)] = "rival";
    if (L === LAYERS - 2 && !kinds.includes("rest")) kinds[rng.int(0, n - 1)] = "rest";
    if (L === 3 && !kinds.some((k) => k === "rest" || k === "shop")) kinds[rng.int(0, n - 1)] = rng.chance(0.5) ? "rest" : "shop";
    if (L >= 1 && L < LAYERS - 1 && !kinds.some((k) => k === "battle" || k === "elite" || k === "rival")) kinds[0] = "battle";
    layers.push(kinds.map((kind, idx) => ({ id: id++, layer: L, idx, kind, next: [] })));
  }
  for (let L = 0; L < LAYERS - 1; L++) {
    const cur = layers[L], nxt = layers[L + 1];
    for (const nd of cur) {
      const j = Math.round(nd.idx * (nxt.length - 1) / Math.max(1, cur.length - 1));
      const set = /* @__PURE__ */ new Set([j]);
      if (nxt.length > 1 && rng.chance(0.55)) set.add(Math.max(0, Math.min(nxt.length - 1, j + (rng.chance(0.5) ? 1 : -1))));
      nd.next = [...set].map((x) => nxt[x].id);
    }
    for (const t of nxt) if (!cur.some((c) => c.next.includes(t.id))) {
      const c = cur.reduce((a, b) => Math.abs(b.idx / Math.max(1, cur.length - 1) - t.idx / Math.max(1, nxt.length - 1)) < Math.abs(a.idx / Math.max(1, cur.length - 1) - t.idx / Math.max(1, nxt.length - 1)) ? b : a);
      c.next.push(t.id);
    }
  }
  void tier;
  return layers;
}
function nodeById(run, id) {
  for (const L of run.layers) for (const n of L) if (n.id === id) return n;
  throw new Error("Knoten fehlt");
}
function reachable(run) {
  if (run.at === null) return run.layers[0];
  const cur = nodeById(run, run.at);
  return cur.layer + 1 < run.layers.length ? cur.next.map((i) => nodeById(run, i)) : [];
}
function newRun(save, tier, seed = Math.random() * 1e9 | 0) {
  const hp = {};
  for (const id of save.team) hp[id] = 1;
  return { tier, seed, layers: generateMap(seed, tier), at: null, pending: null, team: [...save.team], hp, earned: 0, won: 0, started: Date.now(), shops: {}, events: {} };
}
var ownedOf = (save, id) => save.mons.find((m) => m.id === id);
var avgLevel = (save, run) => run.team.reduce((a, id) => a + ownedOf(save, id).level, 0) / Math.max(1, run.team.length);
function healFrac(run, id, frac, revive = false) {
  const cur = run.hp[id] ?? 1;
  if (cur <= 0 && !revive) return false;
  run.hp[id] = Math.min(1, (cur <= 0 ? 0 : cur) + frac);
  return true;
}
function makeEnemy(save, run, node, wild = false) {
  const rng = new Rng(run.seed * 131 + node.id * 17 + (wild ? 7 : 0));
  const tier = run.tier, L = node.layer, avg = avgLevel(save, run);
  const kind = wild ? "wild" : node.kind === "elite" ? "elite" : node.kind === "boss" ? "boss" : node.kind === "rival" ? "rival" : "battle";
  const myTypes = run.team.map((id) => SPECIES[ownedOf(save, id).sp]);
  const base = Math.max(5, Math.round(avg) - 3 + Math.floor(tier / 2) + Math.floor(L / 5));
  const ts = Math.max(1, run.team.length);
  let lvl = base, count = Math.min(ts, 1 + Math.floor(L / 3)), tactic = "balanced";
  const def = rng.pick(TRAINER_DEFS);
  let name = def.name, title, mod = rng.pick([...MOD_IDS, "none", "none"]);
  let coins = 40 + tier * 12 + L * 4, drop = false, recruit = 0, focusMul = 1;
  let map = L === 0 && tier === 1 ? "meadow" : rng.pick(MAP_IDS);
  if (tier === 1 && L <= 2) mod = "none";
  if (kind === "elite") {
    lvl = base + 1;
    count = Math.min(3, count + (ts >= 2 ? 1 : 0));
    tactic = "attack";
    coins = 110 + tier * 20;
    drop = true;
    name = "Elite " + name;
  }
  if (kind === "wild") {
    lvl = Math.max(5, base - 2);
    count = 2;
    coins = 90 + tier * 15;
    name = "Wildes Rudel";
    mod = "none";
  }
  if (kind === "rival") {
    lvl = base + 1 + Math.floor(save.rival.wins / 2);
    count = ts;
    tactic = "balanced";
    coins = 140 + tier * 25;
    drop = true;
    name = RIVAL.name;
    title = RIVAL.title;
  }
  const boss = BOSSES[(tier - 1) % BOSSES.length];
  if (kind === "boss") {
    lvl = base + Math.max(-1, tier - 3);
    count = ts >= 2 ? Math.min(3, ts) : 1;
    tactic = "attack";
    coins = 260 + tier * 60;
    drop = true;
    recruit = 0;
    name = boss.name;
    title = boss.title;
    mod = boss.mod;
    map = boss.map;
    focusMul = 1.4;
    if (ts >= 2) count = Math.min(MAX_TEAM_ENEMY, ts + (tier <= 1 ? 1 : 0));
  } else if (kind === "battle" || kind === "elite") tactic = L >= 2 ? def.style : "balanced";
  const fair = BASE_IDS.filter((id) => !myTypes.some((m) => SPECIES[id].moves.some((mv) => typeEffectiveness(MOVES[mv].type, m.types) > 1)));
  let pool = L <= 1 && tier === 1 && fair.length ? fair : BASE_IDS;
  if ((kind === "battle" || kind === "elite") && def.type && L >= 1) pool = BASE_IDS.filter((id) => SPECIES[id].types.includes(def.type));
  if (kind === "boss" && boss.type) pool = BASE_IDS.filter((id) => SPECIES[id].types.includes(boss.type));
  const mons = [];
  for (let i = 0; i < count; i++) {
    const l = lvl + (i === count - 1 && count > 1 ? 1 : 0);
    const sp = formAt(rng.pick(pool), l);
    let nature = kind === "wild" ? rng.pick(NATURE_IDS) : kind === "rival" ? rng.pick(NATURE_IDS) : rng.pick(def.natures);
    mons.push({ sp, level: l, nature, amulet: (kind === "elite" || kind === "boss") && rng.chance(0.7) ? rng.pick(AMULET_IDS) : null, boss: kind === "boss" && i === 0, hpMul: (kind === "boss" && tier === 1 ? 0.8 : 1) + 0.04 * (tier - 1) });
  }
  if (kind === "rival") {
    const lead = SPECIES[ownedOf(save, run.team[0]).sp];
    const beats = (a, b) => a === "fire" && b === "grass" || a === "grass" && b === "water" || a === "water" && b === "fire";
    const counter = BASE_IDS.find((id) => beats(SPECIES[id].types[0], lead.types[0]));
    if (counter) mons[0].sp = formAt(counter, mons[0].level);
    mons.forEach((m) => {
      m.amulet = rng.chance(0.5) ? rng.pick(AMULET_IDS) : null;
    });
  }
  const showDef = kind === "battle" || kind === "elite";
  return {
    kind,
    name,
    title,
    mons,
    tactic,
    mod,
    map,
    coins,
    amuletDrop: drop,
    recruitChance: recruit,
    focusMul,
    style: showDef ? def.style : kind === "rival" ? "balanced" : void 0,
    styleText: showDef ? STYLE_INFO[def.style] : kind === "rival" ? "RIVALE: STELLT SEIN TEAM GEGEN DEINES AUF" : void 0,
    quote: showDef ? def.quote : kind === "rival" ? RIVAL.quotes[(save.rival.wins + save.rival.losses) % RIVAL.quotes.length] : void 0,
    look: showDef ? def.look : void 0
  };
}
function enemyMoves(sp, level) {
  const known = learnedMoves(sp, level).map((id) => MOVES[id]);
  const special = [...known].reverse().find((m) => m.special);
  const rest = known.filter((m) => !m.special).slice(-(MAX_MOVES - (special ? 1 : 0)));
  return [...rest, ...special ? [special] : []].map((m) => m.id);
}
var MAX_TEAM_ENEMY = 5;
var lenMulOf = (spec) => spec.kind === "boss" ? 1.35 : spec.kind === "elite" || spec.kind === "rival" ? 1.12 : spec.kind === "wild" ? 0.9 : 0.85;
function enemyMoveStates(sp, level) {
  const lv = Math.max(1, Math.min(4, 1 + Math.floor((level - 9) / 5))), out = {};
  for (const id of enemyMoves(sp, level)) out[id] = { lv, perks: [] };
  return out;
}
function enemyTrainer(spec, size = 3, len = 1) {
  const team = spec.mons.map((m) => new Mon(m.sp, m.level, m.nature, { amulet: m.amulet, boss: m.boss, hpMul: (m.hpMul ?? 1) * sizeHpMul(size) * len, moves: enemyMoves(m.sp, m.level), moveStates: enemyMoveStates(m.sp, m.level) }));
  const tr = new Trainer(1, spec.name, team, true);
  tr.tactic = spec.tactic;
  tr.baseTactic = spec.tactic;
  tr.focusRegenMul = spec.focusMul;
  tr.potions = spec.kind === "boss" ? 2 : spec.kind === "elite" ? 1 : 0;
  tr.focus = FOCUS.start;
  return tr;
}
function playerTrainer(save, run, size = 3, len = 1) {
  const team = run.team.map((id) => {
    const o = ownedOf(save, id);
    const m = new Mon(o.sp, o.level, o.nature, { bonus: o.bonus, amulet: o.item, hpFrac: run.hp[id] ?? 1, moves: o.moves, moveStates: o.mv, hpMul: sizeHpMul(size) * len, bondLvl: bondLevel(o.bond) });
    m.ownerId = id;
    return m;
  });
  const tr = new Trainer(0, "Du", team, false);
  tr.potions = save.inv.potion;
  tr.supers = save.inv.super;
  tr.focusPots = save.inv.focus;
  tr.elixirs = save.inv.elixir;
  return tr;
}
var WIN_HEAL = 0.2;
function customEnemy(seed, o) {
  const rng = new Rng(seed);
  const mons = [];
  for (let i = 0; i < o.count; i++) mons.push({ sp: formAt(rng.pick(o.pool ?? BASE_IDS), o.level), level: o.level, nature: rng.pick(NATURE_IDS), amulet: o.boss ? rng.pick(AMULET_IDS) : null, boss: o.boss && i === 0, hpMul: o.hpMul });
  return { kind: o.kind ?? "battle", name: o.name, mons, tactic: o.tactic ?? "balanced", mod: o.mod ?? "none", map: o.map ?? rng.pick(MAP_IDS), coins: o.coins, amuletDrop: false, recruitChance: 0, focusMul: 1 };
}
var XP_MON = { battle: 16, wild: 18, elite: 26, rival: 30, boss: 45 };
var MAP_OF = { fire: "volcano", water: "lake", grass: "jungle" };
var BEATS = { fire: "water", water: "grass", grass: "fire" };
function cupRoundSpec(save, cup, team, round, seed) {
  const n = cup.rounds.length, r = round, rng = new Rng(seed + r * 101);
  const avg = team.reduce((a, id) => a + ownedOf(save, id).level, 0) / team.length;
  const level = Math.max(5, Math.round(avg) + cup.lvlOff + Math.floor(r / 2));
  const count = Math.min(team.length, Math.max(1, Math.round(team.length * (r + 1) / n)));
  const final = r === n - 1, rival = !!cup.rival && final;
  const def = rng.pick(TRAINER_DEFS);
  let pool = cup.type ? BASE_IDS.filter((id) => SPECIES[id].types.includes(cup.type)) : BASE_IDS;
  let counterPool = null;
  let name = def.name, tactic = r >= 1 ? def.style : "balanced";
  if (rival) {
    const lead = SPECIES[ownedOf(save, team[0]).sp].types[0];
    const want = BEATS[lead];
    const cp = BASE_IDS.filter((id) => SPECIES[id].types[0] === want);
    if (cp.length) counterPool = cp;
    name = RIVAL.name;
    tactic = "balanced";
  }
  const spec = customEnemy(seed + r * 7919, { name, level: level + (final ? 1 : 0) + (rival ? Math.floor(save.rival.wins / 2) : 0), count, coins: Math.round(cup.coins * (0.5 + 0.25 * r)), kind: rival ? "rival" : final ? "elite" : "battle", mod: cup.mod, map: cup.type && MAP_OF[cup.type] || MAP_IDS[(seed + r) % MAP_IDS.length], pool, tactic });
  if (rival && counterPool) spec.mons[0].sp = formAt(rng.pick(counterPool), spec.mons[0].level);
  if (rival) {
    spec.title = RIVAL.title;
    spec.style = "balanced";
    spec.styleText = "RIVALE: STELLT SEIN TEAM GEGEN DEINES AUF";
    spec.quote = RIVAL.quotes[(save.rival.wins + save.rival.losses) % RIVAL.quotes.length];
    spec.focusMul = 1.15;
  } else {
    spec.style = def.style;
    spec.styleText = STYLE_INFO[def.style];
    spec.quote = def.quote;
    if (final) spec.focusMul = 1.15;
  }
  return spec;
}

// src/runsim.ts
function simulateRun(seed, tier, starter, teamSize = 1, level = 10) {
  const rng = new Rng(seed);
  const save = newSave();
  for (let i = 0; i < teamSize; i++) {
    const o = newOwned(save.nextId++, formAt(i === 0 ? starter : rng.pick(["glimmdra", "tropfling", "knoespling"]), level), rng.pick(NATURE_IDS), level);
    o.moves = enemyMoves(o.sp, level);
    save.mons.push(o);
    save.team.push(o.id);
  }
  const run = newRun(save, tier, seed);
  save.run = run;
  let layerReached = 0, battles = 0;
  const avgHp = () => run.team.reduce((a, id) => a + (run.hp[id] ?? 0), 0) / run.team.length;
  while (true) {
    for (const id of run.team) {
      if ((run.hp[id] ?? 0) <= 0 && save.inv.revive > 0) {
        save.inv.revive--;
        run.hp[id] = 0.4;
      }
      while ((run.hp[id] ?? 0) > 0 && run.hp[id] < 0.45 && save.inv.potion > 0) {
        save.inv.potion--;
        healFrac(run, id, 0.45);
      }
    }
    const opts = reachable(run);
    if (!opts.length) break;
    const hpAvg = avgHp();
    const pick = opts.find((n) => n.kind === "rest" && hpAvg < 0.75) ?? opts.find((n) => n.kind === "boss") ?? opts.find((n) => n.kind === "elite" && hpAvg > 0.7) ?? opts.find((n) => n.kind === "battle") ?? opts.find((n) => n.kind === "event") ?? opts[0];
    layerReached = pick.layer;
    if (pick.kind === "rest") {
      for (const id of run.team) healFrac(run, id, 0.5, true);
      if (run.hp[run.team[0]] <= 0) run.hp[run.team[0]] = 0.25;
      run.at = pick.id;
      continue;
    }
    if (pick.kind === "shop") {
      save.inv.potion += 2;
      save.inv.revive += 1;
      run.at = pick.id;
      continue;
    }
    if (pick.kind === "event") {
      if (pick.kind === "event") for (const id of run.team) healFrac(run, id, 0.1);
      run.at = pick.id;
      continue;
    }
    const spec = makeEnemy(save, run, pick);
    const size = Math.max(run.team.length, spec.mons.length);
    const len = lenMulOf(spec);
    const pt = playerTrainer(save, run, size, len);
    pt.auto = true;
    const pot0 = pt.potions;
    if (pt.aliveCount === 0) return { cleared: false, layer: layerReached, battles };
    const b = new Battle(pt, enemyTrainer(spec, size, len), rng.int(1, 1e9), spec.mod, spec.map, len);
    let steps = 0;
    while (b.winner === null && steps < 60 * 600) {
      b.update(1 / 60);
      b.events.length = 0;
      steps++;
    }
    battles++;
    save.inv.potion = Math.max(0, save.inv.potion - (pot0 - pt.potions));
    for (const m of pt.team) run.hp[m.ownerId] = m.hp / m.maxHp;
    if (b.winner !== 0) return { cleared: false, layer: layerReached, battles };
    for (const m of pt.team) if (m.fought) {
      const ow = ownedOf(save, m.ownerId);
      gainXp(save, ow, XP_MON[spec.kind]);
      ow.bond++;
    }
    for (const id of run.team) if ((run.hp[id] ?? 0) > 0) healFrac(run, id, WIN_HEAL);
    run.at = pick.id;
    run.won++;
    if (pick.kind === "boss") return { cleared: true, layer: layerReached, battles };
  }
  return { cleared: false, layer: layerReached, battles };
}
function simulateCup(seed, cupId, starter, teamSize, level, trainerLvl = 0) {
  const cup = cupById(cupId), rng = new Rng(seed);
  const save = newSave();
  save.pl.lvl = cup.minPl;
  const n = Math.min(teamSize, cup.maxTeam);
  for (let i = 0; i < n; i++) {
    const o = newOwned(save.nextId++, formAt(i === 0 ? starter : rng.pick(["glimmdra", "tropfling", "knoespling"]), level), rng.pick(NATURE_IDS), level);
    o.bond = trainerLvl;
    o.moves = enemyMoves(o.sp, level);
    save.mons.push(o);
    save.team.push(o.id);
  }
  const t = { team: [...save.team], hp: {} };
  t.team.forEach((id) => t.hp[id] = 1);
  for (let r = 0; r < cup.rounds.length; r++) {
    const spec = cupRoundSpec(save, cup, t.team, r, seed);
    const size = Math.max(t.team.length, spec.mons.length), len = lenMulOf(spec);
    const pt = playerTrainer(save, t, size, len);
    pt.auto = true;
    if (pt.aliveCount === 0) return r;
    const b = new Battle(pt, enemyTrainer(spec, size, len), rng.int(1, 1e9), spec.mod, spec.map, len);
    let steps = 0;
    while (b.winner === null && steps < 60 * 600) {
      b.update(1 / 60);
      b.events.length = 0;
      steps++;
    }
    for (const m of pt.team) t.hp[m.ownerId] = m.alive ? m.hp / m.maxHp : 0;
    if (b.winner !== 0) return r;
    for (const id of t.team) if ((t.hp[id] ?? 0) > 0) t.hp[id] = Math.min(1, t.hp[id] + CUP_HEAL);
  }
  return cup.rounds.length;
}
function simulateRaid(seed, raidLv, starter, teamSize, level) {
  const rng = new Rng(seed), save = newSave();
  for (let i = 0; i < teamSize; i++) {
    const o = newOwned(save.nextId++, formAt(i === 0 ? starter : rng.pick(["glimmdra", "tropfling", "knoespling"]), level), rng.pick(NATURE_IDS), level);
    o.moves = enemyMoves(o.sp, level);
    save.mons.push(o);
    save.team.push(o.id);
  }
  const t = { team: [...save.team], hp: {} };
  t.team.forEach((id) => t.hp[id] = 1);
  const spec = customEnemy(9e3 + raidLv * 37, { name: "RAID-BOSS", level: Math.max(8, level + 1 + Math.floor(raidLv / 2)), count: 1, coins: 0, kind: "boss", boss: true, hpMul: 0.9 + raidLv * 0.04, tactic: "attack" });
  spec.focusMul = 1.5;
  const size = Math.max(2, t.team.length), len = lenMulOf(spec);
  const pt = playerTrainer(save, t, size, len);
  pt.auto = true;
  const b = new Battle(pt, enemyTrainer(spec, size, len), rng.int(1, 1e9), spec.mod, spec.map, len);
  let steps = 0;
  while (b.winner === null && steps < 60 * 600) {
    b.update(1 / 60);
    b.events.length = 0;
    steps++;
  }
  return b.winner === 0;
}
globalThis.simulateRun = simulateRun;
globalThis.simulateRaid = simulateRaid;
globalThis.simulateCup = simulateCup;
export {
  simulateCup,
  simulateRaid,
  simulateRun
};

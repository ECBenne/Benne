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
    radius: 12,
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
    radius: 16,
    height: 61,
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
    radius: 12,
    height: 45,
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
    radius: 15,
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
    height: 60,
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
    radius: 12,
    height: 48,
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
    radius: 14,
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
    height: 62,
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
    radius: 12,
    height: 48,
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
    radius: 15,
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
    height: 66,
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
    height: 52,
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
    height: 56,
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
    height: 60,
    blurb: "Eine pr\xE4chtige Orchideenmantis. Ihre Bl\xFCtenschwingen bet\xF6ren und zerschneiden zugleich."
  },
  raureif: {
    id: "raureif",
    name: "Raureif",
    dex: 25,
    types: ["ice"],
    base: { hp: 61, atk: 57, def: 68, spa: 45, spd: 59, spe: 40 },
    moves: ["frostshard", "frostbite", "iceslide", "icebreath"],
    radius: 16,
    height: 53,
    blurb: "Ein zotteliger Eisb\xFCffel mit Gletscherh\xF6rnern. Rammt Gegner und l\xE4sst kaum etwas durch."
  },
  dunstkalmar: {
    id: "dunstkalmar",
    name: "Dunstkalmar",
    dex: 26,
    types: ["ghost"],
    base: { hp: 44, atk: 40, def: 44, spa: 66, spd: 60, spe: 64 },
    moves: ["shadowball", "veilslash", "ghostleap", "spookfire"],
    radius: 14,
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
    radius: 14,
    height: 57,
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
    height: 48,
    blurb: "Ein Hufeisenkrebs mit Bronzepanzer. Langsam, aber fast unzerst\xF6rbar."
  },
  lichtglocke: {
    id: "lichtglocke",
    name: "Lichtglocke",
    dex: 30,
    types: ["light"],
    base: { hp: 50, atk: 39, def: 48, spa: 73, spd: 71, spe: 63 },
    moves: ["lightorb", "glowtouch", "flashleap", "holybeam"],
    radius: 12,
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
    radius: 13,
    height: 53,
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
    height: 46,
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
    height: 53,
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
    height: 54,
    blurb: "Eine Schnecke mit Amethyst-Geode als Haus. Langsam, aber ihre Kristalle brechen das Licht zu Strahlen."
  }
};
var SPECIES_IDS = Object.keys(SPECIES);
var EVO_TARGETS = new Set(SPECIES_IDS.map((k) => SPECIES[k].evolvesTo?.id).filter(Boolean));
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
function baseForm(id) {
  let cur = id;
  for (let i = 0; i < 5; i++) {
    const parent = SPECIES_IDS.find((k) => SPECIES[k].evolvesTo?.id === cur);
    if (!parent) break;
    cur = parent;
  }
  return cur;
}
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

// src/data/check.ts
var bad = 0;
for (const id of Object.keys(SPECIES)) {
  const ls = LEARNSETS[baseForm(id)];
  if (!ls) {
    console.log("Keine Lernliste:", id);
    bad++;
    continue;
  }
  const ids = ls.map(([m]) => m);
  for (const m of ids) if (!MOVES[m]) {
    console.log("Attacke fehlt:", id, m);
    bad++;
  }
  if (new Set(ids).size !== ids.length) {
    console.log("Dublette:", id);
    bad++;
  }
  for (const m of SPECIES[id].moves) if (!MOVES[m]) {
    console.log("Standard-Attacke fehlt:", id, m);
    bad++;
  }
}
console.log("Arten:", Object.keys(SPECIES).length, "\xB7 Attacken:", Object.keys(MOVES).length, "\xB7 Fehler:", bad);

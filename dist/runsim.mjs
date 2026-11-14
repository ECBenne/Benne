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
    base: { hp: 62, atk: 78, def: 62, spa: 84, spd: 66, spe: 80 },
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
    base: { hp: 62, atk: 75, def: 62, spa: 79, spd: 67, spe: 76 },
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
    base: { hp: 79, atk: 96, def: 79, spa: 97, spd: 85, spe: 90 },
    moves: ["leafvolley", "vinewhip", "rootrush", "bloomstorm"],
    buyable: false,
    radius: 17,
    height: 60,
    blurb: "Die letzte Stufe. Eine M\xE4hne aus Bl\xE4ttern und Bl\xFCten, die ihn nach jedem Treffer st\xE4rkt."
  }
};
function formAt(id, level) {
  let cur = SPECIES[id];
  while (cur?.evolvesTo && level >= cur.evolvesTo.level) cur = SPECIES[cur.evolvesTo.id];
  return cur?.id ?? id;
}
var SPECIES_IDS = Object.keys(SPECIES);
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
    weights: { melee: 1.35, dash: 1.3, projectile: 0.85, aoe: 1, cone: 1.25 }
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
    weights: { melee: 0.6, dash: 0.8, projectile: 1.3, aoe: 1.1, cone: 0.9 }
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
    weights: { melee: 1.1, dash: 1.4, projectile: 1, aoe: 0.9, cone: 0.9 }
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
    weights: { melee: 0.8, dash: 0.9, projectile: 1.1, aoe: 1.6, cone: 1.4 }
  }
};
var NATURE_IDS = Object.keys(NATURES);
var TACTICS = {
  attack: { name: "Angriff", aggr: 1.35, dodge: 0.75, range: 0.8, blurb: "Setzt nach, weicht weniger aus." },
  balanced: { name: "Ausgewogen", aggr: 1, dodge: 1, range: 1, blurb: "Folgt dem Wesen." },
  defend: { name: "Defensiv", aggr: 0.7, dodge: 1.3, range: 1.25, blurb: "Abstand, Ausweichen, Deckung suchen." }
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
var sizeHpMul = (n) => n <= 1 ? 2.1 : n === 2 ? 1.45 : 1.1;
var noBonus = () => ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
var BONUS_STEP = 0.04;
function computeStats(speciesId, level, bonus, amulet, hpMul = 1) {
  const sp = SPECIES[speciesId], b = sp.base, bn = bonus ?? noBonus();
  const stat = (v, k) => Math.floor((2 * v * level / 100 + 5) * (1 + BONUS_STEP * bn[k]));
  const am = amulet ? AMULETS[amulet] : void 0;
  const maxHp = Math.round((Math.floor(2 * b.hp * level / 100) + level + 10) * HP_SCALE * (1 + BONUS_STEP * bn.hp) * (am?.hpMul ?? 1) * hpMul);
  return { maxHp, atk: stat(b.atk, "atk"), def: stat(b.def, "def"), spa: stat(b.spa, "spa"), spd: stat(b.spd, "spd"), spe: stat(b.spe, "spe") };
}
var uid = 1;
var Mon = class {
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
    this.baseSpeed = (36 + this.sp.base.spe * 0.6) * (NATURES[nature]?.speed ?? 1) * (this.amulet?.speedMul ?? 1);
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
  stage = { atk: 0, def: 0, spe: 0 };
  // Werte-Stufen (−3 … +3), verfallen beim Auswechseln
  shield = 0;
  shieldT = 0;
  // Schild-Befehl: nimmt Schaden auf
  buffT = 0;
  // Anfeuern: +25 % Schaden
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
  switchCd = 0;
  cmdCd = 0;
  itemCd = 0;
  potions = 2;
  supers = 0;
  focusPots = 0;
  elixirs = 0;
  focus = FOCUS.start;
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
var TRAINERS = ["Camper Tim", "Trainerin Lea", "Angler Ben", "Ass-Trainer Kai", "Wanderin Sofie", "F\xF6rster Max", "Schwimmerin Ida", "Heizer Otto", "G\xE4rtnerin Pia", "Ranger Jonas"];
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
var CHART = {
  fire: { grass: 2, water: 0.5, fire: 0.5 },
  water: { fire: 2, grass: 0.5, water: 0.5, electric: 1 },
  grass: { water: 2, fire: 0.5, grass: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5 }
};
function typeEffectiveness(atk, defTypes) {
  let m = 1;
  for (const d of defTypes) m *= CHART[atk]?.[d] ?? 1;
  return m;
}

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
  m.dodgeCd = 1.7;
  b.stats.dodges[m.side]++;
  b.events.push({ type: "dodge" });
}
function thinkReady(b, m, dt) {
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
  const th = findThreat(b, m);
  if (th && !m.seen.has(th.id)) {
    m.seen.add(th.id);
    if (m.seen.size > 60) m.seen.clear();
    const p = clamp(N.dodge * T.dodge * 0.9, 0, 0.95);
    if (rng.chance(p)) m.react = { at: b.t + rng.range(0.07, 0.22), ...th };
  }
  if (m.react && b.t >= m.react.at) {
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
    if (sc > bestScore) {
      bestScore = sc;
      bestMv = mv;
    }
  }
  if (m.think <= 0) {
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
  let radial = clamp((dist - desired) / 16, -1, 1);
  if (m.retreatT > 0) radial = -1;
  const orbitW = N.orbit * 0.6 * (Math.abs(radial) > 0.8 ? 0.5 : 1);
  let vx = toE.x * radial - toE.y * m.orbit * orbitW;
  let vy = toE.y * radial + toE.x * m.orbit * orbitW;
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
  const spd = m.baseSpeed * stageMul(m.stage.spe) * (m.para > 0 ? 0.55 : 1) * (0.92 + 0.12 * T.aggr) * (m.own ? TERRAIN_BONUS : m.terrain === "grass" ? GRASS_SLOW : 1) * (m.hpFrac < 0.25 ? 1.08 : 1);
  m.vx += (vx * spd - m.vx) * Math.min(1, dt * 9);
  m.vy += (vy * spd - m.vy) * Math.min(1, dt * 9);
  m.face = dx >= 0 ? 1 : -1;
  integrate(m, dt);
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
        const foe = b.trainers[1 - tr.side].active;
        let best = -1, bs = -1;
        tr.team.forEach((m2, i) => {
          if (!m2.alive) return;
          const eff = foe ? Math.max(...m2.moves.map((mv) => typeEffectiveness(mv.type, foe.sp.types))) : 1;
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
  const sp = m.special;
  if (sp && m.cd[sp.id] <= 0 && tr.focus >= FOCUS.special + 10 && b.rng.chance(0.4)) b.commandSpecial(tr);
  else if (m.hpFrac < 0.5 && m.shield <= 0 && tr.focus >= FOCUS.shield + 10 && b.rng.chance(0.3)) b.commandShield(tr);
  else if (m.buffT <= 0 && tr.focus >= FOCUS.buff + 35 && b.rng.chance(0.25)) b.commandBuff(tr);
}

// src/battle/battle.ts
var LVL_DMG = 0.055;
var FINALE_AT = 90;
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
  finale = false;
  overT = 0;
  choosing = false;
  choosingT = 0;
  idc = 1;
  stats = { dmg: [0, 0], hits: [0, 0], dodges: [0, 0] };
  constructor(a, b, seed = 1, modId = "none", mapId = "meadow") {
    this.rng = new Rng(seed);
    this.map = MAPS[mapId] ?? MAPS.meadow;
    this.rocks = this.map.features.filter((f) => f.kind === "rock");
    this.mod = ARENA_MODS[modId] ?? ARENA_MODS.none;
    this.trainers = [a, b];
    for (const tr of this.trainers) {
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
    if (this.t < FINALE_AT && this.t + dt >= FINALE_AT && this.winner === null) {
      this.finale = true;
      this.events.push({ type: "cmd" });
      this.flashScreen = 0.1;
    }
    this.t += dt;
    for (const tr of this.trainers) {
      tr.switchCd = Math.max(0, tr.switchCd - dt);
      tr.cmdCd = Math.max(0, tr.cmdCd - dt);
      tr.itemCd = Math.max(0, tr.itemCd - dt);
      tr.focus = Math.min(FOCUS.max, tr.focus + FOCUS.regen * tr.focusRegenMul * (1 + (tr.active?.amulet?.focusRegen ?? 0)) * dt);
      if (tr.auto || tr.side === 1) trainerAI(this, tr, dt);
      if (tr.pending !== null) this.processPending(tr);
    }
    for (const tr of this.trainers) for (const m of tr.team) if (m.onField) this.updateMon(m, dt);
    this.processShots();
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
    for (const tr of this.trainers) {
      if (tr.aliveCount === 0 && !(tr.active && tr.active.state === "faint" && tr.active.t < 1.1)) {
        this.winner = 1 - tr.side;
      }
    }
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
        m.vx *= 0.8;
        m.vy *= 0.8;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.face = Math.cos(m.aim) >= 0 ? 1 : -1;
        this.charge(m, dt);
        if (m.t >= m.move.windup) this.fireMove(m);
        break;
      }
      case "active":
        this.updateActive(m, dt);
        break;
      case "recover": {
        m.vx *= 0.85;
        m.vy *= 0.85;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.t >= m.move.recover) {
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
      this.zones.push({ id: this.nid(), x: tx, y: ty, r: mv.radius, t: 0, delay: mv.windup, owner: m, move: mv, done: false, fade: 0 });
    }
    if (mv.kind === "cone" || mv.kind === "dash") m.forced = 0;
  }
  fireMove(m) {
    const mv = m.move;
    const e = this.enemyOf(m);
    switch (mv.kind) {
      case "projectile": {
        const n = mv.shots ?? 1, sc = n > 1 ? mv.shotScale ?? 1 : 1;
        if (mv.interval) {
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
        if (e && e.targetable) {
          const dx = e.x - m.x, dy = e.y - m.y, d = Math.hypot(dx, dy) - e.sp.radius;
          if (d < mv.radius && Math.abs(angleDiff(m.aim, Math.atan2(dy, dx))) < mv.arc + 0.35) {
            this.hit(m, e, mv, 1);
            this.dust(e.x, e.y, 4);
          }
        }
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
      this.parts.push({ x: m.x - m.dashDx * 6 + (Math.random() - 0.5) * 6, y: m.y - m.dashDy * 6 + (Math.random() - 0.5) * 4, vx: -m.dashDx * 20, vy: -m.dashDy * 20, life: 0.22, max: 0.22, color: mv.type === "fire" ? Math.random() < 0.5 ? "#f8c030" : "#f07820" : mv.type === "water" ? Math.random() < 0.5 ? "#a8d0f8" : "#6890f0" : mv.type === "grass" ? Math.random() < 0.5 ? "#90d048" : "#3f7f2a" : "#ffffff", size: mv.type === "normal" ? 2 : 3, grav: 0, z: 6 + Math.random() * m.sp.height * 0.5 });
      if (e && e.targetable && !m.hitDone && Math.hypot(e.x - m.x, e.y - m.y) < e.sp.radius + m.sp.radius + 3) {
        m.hitDone = true;
        this.hit(m, e, mv, 1);
        m.vx = -m.dashDx * 70;
        m.vy = -m.dashDy * 70;
        this.endMove(m);
        return;
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
      const pal = grass ? ["#ffffff", "#f8c8dc", "#b8e068", "#78b840", "#4a8a2c"] : water ? ["#ffffff", "#c8e4ff", "#8cc0ff", "#6890f0", "#4870d0"] : ["#fff6c0", "#f8e070", "#f8a030", "#f07820", "#d83818"];
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
  strikeZone(z) {
    z.done = true;
    z.fade = 0.5;
    const t = z.move.type, pal = this.typePalette(t), big = z.r > 28;
    if (t === "electric") for (const dx of [0, -9, 9]) this.bolts.push({ x: z.x + dx, y: z.y, t: Math.abs(dx) / 200, seed: this.rng.next() * 1e3 });
    this.impacts.push({ x: z.x, y: z.y, z: 0, t: 0, max: 1.4, kind: "scorch", c1: t === "water" ? "#3a5a8a" : t === "grass" ? "#2f5a2a" : "#3a3020", c2: pal[1], ang: 0, big: true, r: z.r });
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
      life: 1.8,
      owner: m,
      move: mv,
      age: 0,
      scale,
      trail: []
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
    return t === "grass" ? ["#f0ffd0", "#90d048", "#3f7f2a"] : t === "fire" ? ["#fff6c0", "#f8a030", "#d83818"] : t === "water" ? ["#ffffff", "#a8d0f8", "#6890f0"] : t === "electric" ? ["#ffffff", "#f8f080", "#f8d030"] : ["#ffffff", "#e8e8e8", "#c8c8c8"];
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
    const crit = this.rng.next() < 1 / 14 ? 1.5 : 1;
    const rand = 0.88 + this.rng.next() * 0.12;
    const effDmg = eff > 1 ? 1.07 : eff < 1 ? 0.95 : 1;
    const mul = (1 + Math.max(0, (this.t - FINALE_AT) / 40)) * (att.own ? TERRAIN_BONUS : 1) * (att.hpFrac < 0.25 ? 1.1 : 1) * (this.mod.mul[mv.type] ?? 1) * (att.amulet?.dmgType === mv.type ? att.amulet.dmgMul ?? 1 : 1) * (att.buffT > 0 ? 1.25 : 1) * (att.rage ? 1.15 : 1) * (att.elixir ? 1.2 : 1) * (att.hpFrac < 0.5 ? att.amulet?.rage ?? 1 : 1) / (def.amulet?.takenMul ?? 1);
    return { dmg: base * stab * effDmg * rand * crit * mul, eff, crit: crit > 1 };
  }
  hit(att, def, mv, scale, o = {}) {
    const r = this.calc(att, def, mv);
    let dmg = Math.max(1, Math.round(r.dmg * scale));
    if (def.shield > 0) {
      const ab = Math.min(def.shield, dmg);
      def.shield -= ab;
      dmg -= ab;
      this.text(def.x, def.y, "SCHILD", "#8cdcff", 0.5, false, def.sp.height + 14);
      if (def.shield <= 0) {
        def.shieldT = 0;
        this.spawnPart(def.x, def.y, "#8cdcff", 10, 70, 0.4, 2, 0, def.sp.height * 0.5);
      }
    }
    def.hp = Math.max(0, def.hp - dmg);
    def.flash = 0.14;
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
    this.texts.push({ x, y, z, rise: 0, text, color, life, max: life, vy: -22, big });
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
var newOwned = (id, sp, nature, level) => ({ id, sp, nature, level, xp: 0, moves: starterMoves(sp, level), extra: [], mv: {}, ap: Math.max(1, level - 9), bonus: noBonus(), item: null });
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
    if (L === LAYERS - 2 && !kinds.includes("rest")) kinds[rng.int(0, n - 1)] = "rest";
    if (L === 3 && !kinds.some((k) => k === "rest" || k === "shop")) kinds[rng.int(0, n - 1)] = rng.chance(0.5) ? "rest" : "shop";
    if (L >= 1 && L < LAYERS - 1 && !kinds.some((k) => k === "battle" || k === "elite")) kinds[0] = "battle";
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
  const kind = wild ? "wild" : node.kind === "elite" ? "elite" : node.kind === "boss" ? "boss" : "battle";
  const myTypes = run.team.map((id) => SPECIES[ownedOf(save, id).sp]);
  const base = Math.max(5, Math.round(avg) - 3 + Math.floor(tier / 2) + Math.floor(L / (tier === 1 ? 5 : 4)));
  const ts = Math.max(1, run.team.length);
  let lvl = base, count = Math.min(ts, 1 + Math.floor(L / 3)), tactic = "balanced";
  let name = rng.pick(TRAINERS), title, mod = rng.pick([...MOD_IDS, "none", "none"]);
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
  } else if (!wild) tactic = L >= 3 ? rng.pick(["balanced", "attack", "defend"]) : "balanced";
  const fair = BASE_IDS.filter((id) => !myTypes.some((m) => SPECIES[id].moves.some((mv) => typeEffectiveness(MOVES[mv].type, m.types) > 1)));
  let pool = L <= 1 && tier === 1 && fair.length ? fair : BASE_IDS;
  if (kind === "boss" && boss.type) pool = BASE_IDS.filter((id) => SPECIES[id].types.includes(boss.type));
  const mons = [];
  for (let i = 0; i < count; i++) {
    const l = lvl + (i === count - 1 && count > 1 ? 1 : 0);
    const sp = formAt(rng.pick(pool), l);
    mons.push({ sp, level: l, nature: rng.pick(NATURE_IDS), amulet: (kind === "elite" || kind === "boss") && rng.chance(0.7) ? rng.pick(AMULET_IDS) : null, boss: kind === "boss" && i === 0, hpMul: (kind === "boss" && tier === 1 ? 0.8 : 1) + 0.04 * (tier - 1) });
  }
  return { kind, name, title, mons, tactic, mod, map, coins, amuletDrop: drop, recruitChance: recruit, focusMul };
}
function enemyMoves(sp, level) {
  const known = learnedMoves(sp, level).map((id) => MOVES[id]);
  const special = [...known].reverse().find((m) => m.special);
  const rest = known.filter((m) => !m.special).slice(-(MAX_MOVES - (special ? 1 : 0)));
  return [...rest, ...special ? [special] : []].map((m) => m.id);
}
function enemyMoveStates(sp, level) {
  const lv = Math.max(1, Math.min(4, 1 + Math.floor((level - 9) / 5))), out = {};
  for (const id of enemyMoves(sp, level)) out[id] = { lv, perks: [] };
  return out;
}
function enemyTrainer(spec, size = 3) {
  const team = spec.mons.map((m) => new Mon(m.sp, m.level, m.nature, { amulet: m.amulet, boss: m.boss, hpMul: (m.hpMul ?? 1) * sizeHpMul(size), moves: enemyMoves(m.sp, m.level), moveStates: enemyMoveStates(m.sp, m.level) }));
  const tr = new Trainer(1, spec.name, team, true);
  tr.tactic = spec.tactic;
  tr.focusRegenMul = spec.focusMul;
  tr.potions = spec.kind === "boss" ? 2 : spec.kind === "elite" ? 1 : 0;
  tr.focus = FOCUS.start;
  return tr;
}
function playerTrainer(save, run, size = 3) {
  const team = run.team.map((id) => {
    const o = ownedOf(save, id);
    const m = new Mon(o.sp, o.level, o.nature, { bonus: o.bonus, amulet: o.item, hpFrac: run.hp[id] ?? 1, moves: o.moves, moveStates: o.mv, hpMul: sizeHpMul(size) });
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
var XP_MON = { battle: 16, wild: 18, elite: 26, boss: 45 };

// src/runsim.ts
function simulateRun(seed, tier, starter, teamSize = 1, level = 10) {
  const rng = new Rng(seed);
  const save = newSave();
  for (let i = 0; i < teamSize; i++) {
    const o = newOwned(save.nextId++, formAt(i === 0 ? starter : rng.pick(["glimmdra", "tropfling", "knoespling"]), level), rng.pick(NATURE_IDS), level);
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
    const pt = playerTrainer(save, run, size);
    pt.auto = true;
    const pot0 = pt.potions;
    if (pt.aliveCount === 0) return { cleared: false, layer: layerReached, battles };
    const b = new Battle(pt, enemyTrainer(spec, size), rng.int(1, 1e9), spec.mod, spec.map);
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
    for (const m of pt.team) if (m.fought) gainXp(save, ownedOf(save, m.ownerId), XP_MON[spec.kind]);
    for (const id of run.team) if ((run.hp[id] ?? 0) > 0) healFrac(run, id, WIN_HEAL);
    run.at = pick.id;
    run.won++;
    if (pick.kind === "boss") return { cleared: true, layer: layerReached, battles };
  }
  return { cleared: false, layer: layerReached, battles };
}
globalThis.simulateRun = simulateRun;
export {
  simulateRun
};

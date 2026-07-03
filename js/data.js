// =====================================================================
//  ONE PIECE: Reise zum Piratenkönig — Spieldaten
// =====================================================================
'use strict';

// ---- Kachel-Typen ----
const T = {
  W: 0,      // seichtes Wasser
  D: 1,      // Tiefsee (braucht Going Merry)
  S: 2,      // Sturmsee (braucht Thousand Sunny)
  SAND: 3,
  GRASS: 4,
  TALL: 5,   // hohes Gras -> Zufallskämpfe
  TREE: 6,
  ROCK: 7,
  HOUSE: 8,
  SHOP: 9,
  BASE: 10,  // Marinebasis-Mauer
  DOCK: 11,
  PATH: 12,
  SNOW: 13,
  DESERT: 14,
  CHEST: 15,
  CHEST_OPEN: 16,
};

const WORLD_W = 280, WORLD_H = 176, TS = 32;
const WORLD_SEED = 1337;

// Begehbare Land-Kacheln
const WALKABLE = new Set([T.SAND, T.GRASS, T.TALL, T.PATH, T.DOCK, T.SNOW, T.DESERT, T.CHEST_OPEN]);
const WATER_TILES = new Set([T.W, T.D, T.S]);

// ---- Schiffe ----
const SHIPS = {
  0: { name: 'Kein Schiff', tiles: [] },
  1: { name: 'Beiboot', tiles: [T.W] },
  2: { name: 'Going Merry', tiles: [T.W, T.D] },
  3: { name: 'Thousand Sunny', tiles: [T.W, T.D, T.S] },
};

// ---- Aussehen-Presets ----
function L(skin, hair, style, shirt, pants, hat) {
  return { skin, hair, style, shirt, pants, hat: !!hat };
}
const LOOKS = {
  villager1: L('#e8b88a', '#5a3a1a', 0, '#2e7d32', '#31456b'),
  villager2: L('#d99a68', '#222222', 1, '#8a5a2b', '#333'),
  makino:    L('#f0c8a0', '#2e7d32', 2, '#e8c468', '#7a4a2b'),
  shanks:    L('#e8b88a', '#d62828', 1, '#5a3a1a', '#222', false),
  mayor:     L('#e8b88a', '#cccccc', 0, '#4a4a6a', '#333'),
  marine:    L('#e8b88a', '#3a2a1a', 0, '#f5f5f5', '#2a4a8a'),
  bandit:    L('#d99a68', '#3a2a1a', 1, '#6a4a2a', '#3a2a1a'),
  pirate:    L('#e8b88a', '#222', 1, '#8a2be2', '#333'),
  hunter:    L('#d99a68', '#1a5c2a', 0, '#4a5a3a', '#222'),
  zorro:     L('#e8b88a', '#2e7d32', 0, '#f5f5f5', '#1a3a2a'),
  nami:      L('#f0c8a0', '#f4863c', 2, '#f5f5f5', '#4a6aaa'),
  lysop:     L('#c88a58', '#222', 1, '#c8a832', '#8a5a2b'),
  sanji:     L('#f0c8a0', '#e8c468', 2, '#222233', '#222233'),
  chopper:   L('#e8b88a', '#8a5a2b', 1, '#d62828', '#8a2be2'),
  robin:     L('#e8b88a', '#222244', 2, '#6a3aaa', '#222'),
  franky:    L('#d99a68', '#2ab8e8', 1, '#e83a3a', '#2ab8e8'),
  brook:     L('#f5f0e0', '#111', 1, '#222233', '#222233'),
  rayleigh:  L('#e8b88a', '#dddddd', 1, '#3a3a4a', '#222'),
  wirt:      L('#e8b88a', '#8a5a2b', 0, '#7a4a2b', '#333'),
  smith:     L('#d99a68', '#4a3a2a', 0, '#5a6a7a', '#333'),
};

// ---- Teufelsfrüchte ----
const FRUITS = {
  gomu: {
    name: 'Gum-Gum-Frucht',
    desc: 'Dein Körper wird zu Gummi! +50 max. KP.',
    hp: 50,
    moves: [
      { name: 'Gum-Gum-Pistole', pow: 18, cost: 2 },
      { name: 'Gum-Gum-Bazooka', pow: 28, cost: 5 },
    ],
  },
  mera: {
    name: 'Feuer-Frucht',
    desc: 'Du beherrschst das Feuer. Angriffe können Verbrennungen verursachen.',
    moves: [
      { name: 'Feuerspeer', pow: 16, cost: 1, fx: 'burn' },
      { name: 'Feuerfaust', pow: 24, cost: 4, fx: 'burn' },
    ],
  },
  goro: {
    name: 'Donner-Frucht',
    desc: 'Blitz und Donner! Chance, Gegner zu lähmen.',
    moves: [
      { name: 'Blitzschlag', pow: 20, cost: 2, fx: 'stun' },
      { name: 'Zorn des Donnergotts', pow: 32, cost: 6, fx: 'stun' },
    ],
  },
  hie: {
    name: 'Frost-Frucht',
    desc: 'Eiskalt! Chance, Gegner einzufrieren.',
    moves: [
      { name: 'Eiszapfen', pow: 19, cost: 2, fx: 'stun' },
      { name: 'Eiszeit', pow: 27, cost: 5 },
    ],
  },
  ope: {
    name: 'OP-Frucht',
    desc: 'Die Operationsfrucht. Deine Frucht-Angriffe heilen dich.',
    moves: [
      { name: 'Shambles', pow: 17, cost: 2, fx: 'drain' },
      { name: 'Gamma-Messer', pow: 27, cost: 5, fx: 'drain' },
    ],
  },
  yami: {
    name: 'Finster-Frucht',
    desc: 'Die Dunkelheit verschlingt alles. Enorme Kraft, aber du erleidest 20% mehr Schaden.',
    takenMult: 1.2,
    moves: [
      { name: 'Schwarzes Loch', pow: 26, cost: 3 },
      { name: 'Finstere Flut', pow: 38, cost: 7 },
    ],
  },
};

// ---- Items ----
const ITEMS = {
  meat:   { name: 'Fleisch', heal: 45, price: 100, desc: 'Heilt 45 KP.' },
  potion: { name: 'Heiltrank', heal: 100, price: 300, desc: 'Heilt 100 KP.' },
  feast:  { name: 'Festmahl', heal: 9999, price: 900, desc: 'Heilt alle KP.' },
  cola:   { name: 'Energie-Cola', energy: 6, price: 150, desc: 'Stellt im Kampf 6 Ausdauer wieder her.' },
};
const DEFAULT_SHOP = ['meat', 'potion', 'feast', 'cola'];

// ---- Basis-Attacken ----
const BASE_MOVES = [
  { name: 'Faustschlag', pow: 10, cost: 0, minLvl: 1 },
  { name: 'Wirbeltritt', pow: 14, cost: 1, minLvl: 5 },
  { name: 'Sturm-Kombo', pow: 19, cost: 3, minLvl: 12 },
  { name: 'Haki-Schlag', pow: 24, cost: 4, reqArm: 1 },
  { name: 'Königsdruck', pow: 34, cost: 7, reqConq: 1 },
];

// ---- Gegner-Arten ----
const KINDS = {
  bandit:      { name: 'Berg-Bandit', sprite: 'bandit' },
  rekrut:      { name: 'Marine-Rekrut', sprite: 'marine' },
  soldat:      { name: 'Marine-Soldat', sprite: 'marine' },
  pirat:       { name: 'Pirat', sprite: 'pirate' },
  jaeger:      { name: 'Kopfgeldjäger', sprite: 'hunter' },
  leutnant:    { name: 'Marine-Leutnant', sprite: 'marine' },
  kapitaen:    { name: 'Marine-Kapitän', sprite: 'marine' },
  wuesten:     { name: 'Wüstenpirat', sprite: 'pirate' },
  patrouille:  { name: 'Marine-Patrouille', sprite: 'ship' },
  seekoenig:   { name: 'Seekönig', sprite: 'seaking' },
  kriegsschiff:{ name: 'Marine-Kriegsschiff', sprite: 'ship' },
};

// Zufallskämpfe an Land, nach Insel-Stufe
const TIER_TABLES = {
  1: [ { k: 'bandit', a: 2, b: 4 }, { k: 'rekrut', a: 2, b: 5 } ],
  2: [ { k: 'soldat', a: 6, b: 10 }, { k: 'pirat', a: 6, b: 11 } ],
  3: [ { k: 'soldat', a: 12, b: 17 }, { k: 'jaeger', a: 13, b: 18 } ],
  4: [ { k: 'leutnant', a: 20, b: 28 }, { k: 'wuesten', a: 19, b: 27 } ],
  5: [ { k: 'kapitaen', a: 33, b: 43 }, { k: 'leutnant', a: 30, b: 40 } ],
};

// Zufallskämpfe auf See (nach Wassertyp; Westblau vs. Grand Line über x-Koordinate)
function seaTable(tile, x) {
  if (tile === T.S) return [ { k: 'kriegsschiff', a: 36, b: 46 }, { k: 'seekoenig', a: 32, b: 42 } ];
  if (tile === T.D) return [ { k: 'seekoenig', a: 16, b: 30 }, { k: 'patrouille', a: 15, b: 24 } ];
  if (x >= 186) return [ { k: 'patrouille', a: 18, b: 28 }, { k: 'seekoenig', a: 16, b: 26 } ];
  return [ { k: 'patrouille', a: 3, b: 8 }, { k: 'pirat', a: 3, b: 8 } ];
}

// ---- Bosse ----
const BOSSES = {
  higuma:     { name: 'Higuma der Bär', lvl: 5,  sprite: 'bandit', berry: 600,   bounty: 50000,
    intro: ['Verschwinde, Kleiner, oder ich mach dich fertig!'],
    defeated: ['Autsch... du bist ja stärker als Shanks\' Trottel-Bande...'] },
  morgan:     { name: 'Käpt\'n Axt-Hand Morgan', lvl: 8, sprite: 'marine', berry: 1500, bounty: 3000000,
    intro: ['Ich bin die Gerechtigkeit dieser Stadt!', 'Niemand widersetzt sich Käpt\'n Morgan!'],
    defeated: ['Unmöglich... besiegt von einem Niemand...'] },
  buggy:      { name: 'Buggy der Clown', lvl: 11, sprite: 'pirate', berry: 2500, bounty: 8000000,
    intro: ['Du wagst es, über meine rote FLAMMENDE Nase zu lachen?!', 'Ich zerteile dich in Stücke!'],
    defeated: ['Meine Crew! Rückzug! RÜCKZUG!'] },
  kuro:       { name: 'Käpt\'n Kuro', lvl: 14, sprite: 'hunter', berry: 3500, bounty: 16000000,
    intro: ['Mein Plan war perfekt. Drei Jahre Vorbereitung...', 'Du wirst hier verschwinden. Lautlos.'],
    defeated: ['Mein... perfekter... Plan...'] },
  krieg:      { name: 'Don Krieg', lvl: 17, sprite: 'pirate', berry: 5000, bounty: 30000000,
    intro: ['Ich bin der stärkste Mann des Eastblue!', 'Dieses Restaurant gehört jetzt mir!'],
    defeated: ['Diese... Stärke... unmöglich...'] },
  arlong:     { name: 'Arlong', lvl: 20, sprite: 'hunter', berry: 8000, bounty: 45000000,
    intro: ['Menschen sind eine minderwertige Spezies!', 'Ein Fischmensch kennt keine Gnade!'],
    defeated: ['Nami... gehört... nicht mehr mir...'] },
  smoker:     { name: 'Käpt\'n Smoker', lvl: 24, sprite: 'marine', berry: 12000, bounty: 80000000,
    intro: ['Kein Pirat verlässt Loguetown ohne meine Erlaubnis.', 'Weißer Jäger — das nennen sie mich!'],
    defeated: ['Verschwinde zur Grand Line... wir sehen uns wieder!'] },
  wapol:      { name: 'König Wapol', lvl: 27, sprite: 'pirate', berry: 16000, bounty: 120000000,
    intro: ['Dieses Königreich gehört MIR!', 'Ich fresse dich mitsamt deiner Crew!'],
    defeated: ['Mein Königreich... mein Schloss...'] },
  crocodile:  { name: 'Sir Crocodile', lvl: 31, sprite: 'hunter', berry: 25000, bounty: 200000000,
    intro: ['Alabasta wird untergehen — nach meinem Plan.', 'Träumer wie du sterben in der Wüste.'],
    defeated: ['Ein Grünschnabel... besiegt mich...?'] },
  lucci:      { name: 'Rob Lucci', lvl: 36, sprite: 'hunter', berry: 40000, bounty: 320000000,
    intro: ['Dunkle Gerechtigkeit.', 'Du kannst die Weltregierung nicht besiegen.'],
    defeated: ['Diese Kraft... stärker als die Gerechtigkeit...'] },
  akainu:     { name: 'Admiral Akainu', lvl: 45, sprite: 'marine', berry: 80000, bounty: 900000000,
    intro: ['Absolute Gerechtigkeit duldet keine Piraten.', 'Hier endet deine Reise. Für immer.'],
    defeated: ['Die Marine... wird dich niemals vergessen...'] },
  blackbeard: { name: 'Marschall D. Teach', lvl: 52, sprite: 'pirate', berry: 150000, bounty: 1500000000,
    intro: ['Zehahaha! Das One Piece gehört MIR!', 'Der Traum der Menschen endet NIEMALS...', '...aber DEINER endet HIER!'],
    defeated: ['Zehaha... ha... der Wille des D. ...', 'Du bist es... der neue König...'] },
};

// ---- Crew-Mitglieder ----
const CREW = {
  zorro:   { name: 'Lorenor Zorro',  role: 'Schwertkämpfer', bonus: '+15% Angriff', look: 'zorro' },
  nami:    { name: 'Nami',           role: 'Navigatorin', bonus: 'Halbiert Zufallskämpfe auf See', look: 'nami' },
  lysop:   { name: 'Lysop',          role: 'Scharfschütze', bonus: '+25% Fluchtchance', look: 'lysop' },
  sanji:   { name: 'Sanji',          role: 'Smutje', bonus: 'Heilt nach jedem Kampf 20% KP', look: 'sanji' },
  chopper: { name: 'Tony Chopper',   role: 'Schiffsarzt', bonus: 'Items heilen 50% mehr, überlebt 1 K.o. pro Kampf', look: 'chopper' },
  robin:   { name: 'Nico Robin',     role: 'Archäologin', bonus: '+20% Erfahrung', look: 'robin' },
  franky:  { name: 'Franky',         role: 'Schiffszimmermann', bonus: 'Kann die Thousand Sunny bauen, +10% Verteidigung', look: 'franky' },
  brook:   { name: 'Brook',          role: 'Musiker', bonus: '+10% Ausweichchance', look: 'brook' },
};

// ---- Inseln ----
// npcs: dx/dy relativ zum Inselzentrum
const ISLANDS = [
  {
    id: 'fuchsia', name: 'Windmühlendorf', x: 34, y: 118, r: 15, biome: 'grass', tier: 1,
    dockAngle: Math.PI / 2,
    npcs: [
      { dx: 0, dy: -3, type: 'inn', name: 'Makino', look: 'makino',
        lines: ['Willkommen in der Partys Bar!', 'Ruh dich aus — ich mache dich wieder fit!'] },
      { dx: -3, dy: 1, type: 'talk', name: 'Rotschopf Shanks', look: 'shanks',
        lines: ['Du willst König der Piraten werden? Dann setz alles auf diesen Traum!',
          'Zuerst brauchst du ein Schiff. Der Schiffsbauer am Steg im Süden verkauft dir ein Beiboot.',
          'Berry verdienst du im hohen Gras — dort lauern Banditen und Marine-Rekruten.',
          'Und pass auf Higuma auf, den Banditen im Wald nordöstlich des Dorfes!'] },
      { dx: 3, dy: 1, type: 'mayor', name: 'Bürgermeister Woop Slap', look: 'mayor' },
      { dx: 7, dy: -7, type: 'boss', boss: 'higuma', name: 'Higuma' },
      { dx: 1, dy: 10, type: 'ship', name: 'Schiffsbauer', look: 'smith', sale: { ship: 1, price: 500 } },
    ],
    chests: [
      { dx: -9, dy: -8, content: { fruit: 'gomu' } },
      { dx: 8, dy: 7, content: { berry: 300 } },
    ],
  },
  {
    id: 'shells', name: 'Shells Town', x: 66, y: 92, r: 14, biome: 'grass', tier: 1, base: true,
    dockAngle: Math.PI / 2,
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Rika', look: 'villager1',
        lines: ['Die Marinebasis hier wird von dem schrecklichen Käpt\'n Morgan geführt...', 'Ruh dich aus!'] },
      { dx: 3, dy: 1, type: 'talk', name: 'Bürger', look: 'villager2',
        lines: ['Der Schwertkämpfer Zorro ist im Hof der Basis angebunden!', 'Er hat einem Mädchen geholfen und wurde dafür bestraft...'] },
      { dx: 5, dy: -4, type: 'crew', crew: 'zorro', needFlag: 'boss_morgan', name: 'Zorro', look: 'zorro',
        ask: ['Du hast Morgan besiegt? Nicht schlecht.', 'Ich habe einen Schwur geleistet: Ich werde der beste Schwertkämpfer der Welt!', 'Ein Piratenkönig braucht den besten Schwertkämpfer, oder?'],
        wait: ['Besiege erst Käpt\'n Morgan, dann reden wir.'] },
    ],
    chests: [
      { dx: -7, dy: 6, content: { item: 'potion', qty: 2 } },
      { dx: 7, dy: 7, content: { berry: 500 } },
    ],
  },
  {
    id: 'orange', name: 'Orange Town', x: 100, y: 128, r: 13, biome: 'grass', tier: 2,
    dockAngle: Math.PI,
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Boodle', look: 'mayor',
        lines: ['Buggy der Clown terrorisiert unsere Stadt!', 'Sein Lager ist im Norden. Bitte hilf uns!'] },
      { dx: 0, dy: -7, type: 'boss', boss: 'buggy', name: 'Buggy' },
      { dx: -4, dy: 0, type: 'crew', crew: 'nami', needFlag: 'boss_arlong', name: 'Nami', look: 'nami',
        ask: ['Arlong Park ist gefallen... mein Dorf ist endlich frei!', 'Ich bin Navigatorin — die beste der Welt!', 'Ich zeichne dir die Karte bis ans Ende der Welt!'],
        wait: ['Ich diene Arlong nur, weil er mein Dorf gefangen hält...', 'Sein Versteck ist Arlong Park, südwestlich von hier.', 'Wenn du ihn besiegst... reden wir.'] },
    ],
    chests: [ { dx: 7, dy: -5, content: { berry: 800 } } ],
  },
  {
    id: 'syrup', name: 'Sirup-Dorf', x: 128, y: 96, r: 14, biome: 'grass', tier: 2,
    dockAngle: Math.PI / 2,
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Kaya', look: 'makino',
        lines: ['Mein Butler Klahadore... irgendetwas stimmt nicht mit ihm.', 'Bitte ruh dich aus.'] },
      { dx: 6, dy: -6, type: 'boss', boss: 'kuro', name: 'Klahadore' },
      { dx: -3, dy: -2, type: 'crew', crew: 'lysop', needFlag: 'boss_kuro', name: 'Lysop', look: 'lysop',
        ask: ['Du hast Käpt\'n Kuro besiegt! Ich, der große Käpt\'n Lysop, habe natürlich geholfen!', 'Ich bin der beste Scharfschütze der Meere!', 'Ein tapferer Krieger der See gehört auf ein Piratenschiff!'],
        wait: ['Die PIRATEN KOMMEN! Äh... ich meine... der Butler Klahadore ist in Wahrheit Käpt\'n Kuro!', 'Er plant etwas Schreckliches im Norden der Insel!'] },
    ],
    chests: [
      { dx: -9, dy: 7, content: { fruit: 'goro' } },
      { dx: 8, dy: 5, content: { berry: 1200 } },
    ],
  },
  {
    id: 'baratie', name: 'Baratie', x: 152, y: 122, r: 8, biome: 'grass', tier: 3,
    dockAngle: Math.PI / 2, noTall: true,
    npcs: [
      { dx: -2, dy: 1, type: 'inn', name: 'Chefkoch Zeff', look: 'wirt',
        lines: ['Willkommen im Baratie, dem besten Restaurant der Meere!', 'Iss dich satt, Bürschchen!'] },
      { dx: 0, dy: -4, type: 'boss', boss: 'krieg', name: 'Don Krieg' },
      { dx: 2, dy: 0, type: 'crew', crew: 'sanji', needFlag: 'boss_krieg', name: 'Sanji', look: 'sanji',
        ask: ['Du hast Don Krieg vermöbelt — nicht übel.', 'Mein Traum ist das All Blue, das Meer, in dem es jeden Fisch der Welt gibt.', 'Ein Koch auf einem Piratenschiff... der alte Zeff würde mich rauswerfen wollen.'],
        wait: ['Don Krieg will das Restaurant übernehmen. Der Kerl da draußen nervt.'] },
    ],
    chests: [ { dx: 3, dy: 3, content: { item: 'feast', qty: 2 } } ],
  },
  {
    id: 'arlongpark', name: 'Arlong Park', x: 122, y: 142, r: 12, biome: 'grass', tier: 3,
    dockAngle: -Math.PI / 2,
    npcs: [
      { dx: -3, dy: 1, type: 'talk', name: 'Nojiko', look: 'villager1',
        lines: ['Arlong presst unser Dorf seit Jahren aus.', 'Nami arbeitet nur für ihn, um uns freizukaufen...', 'Bitte — besiege Arlong!'] },
      { dx: 0, dy: -5, type: 'boss', boss: 'arlong', name: 'Arlong' },
    ],
    chests: [ { dx: 6, dy: 4, content: { berry: 3000 } } ],
  },
  {
    id: 'logue', name: 'Loguetown', x: 176, y: 104, r: 14, biome: 'grass', tier: 3, base: true,
    dockAngle: 0,
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Wirtin', look: 'villager1',
        lines: ['Loguetown — die Stadt des Anfangs und des Endes.', 'Hier wurde Gold Roger geboren und hingerichtet.', 'Ruh dich aus, bevor du zur Grand Line aufbrichst!'] },
      { dx: -5, dy: 3, type: 'haki', name: 'Silvers Rayleigh', look: 'rayleigh' },
      { dx: 3, dy: 1, type: 'talk', name: 'Händler', look: 'villager2',
        lines: ['Östlich von hier beginnt die Tiefsee der Grand Line.', 'Mit einem Beiboot kommst du da nicht durch — du brauchst ein richtiges Schiff!', 'Der Schiffsbauer am Ost-Steg baut dir die Going Merry.'] },
      { dx: 8, dy: 1, type: 'ship', name: 'Schiffsbauer', look: 'smith', sale: { ship: 2, price: 5000 } },
    ],
    chests: [ { dx: -8, dy: -6, content: { berry: 2000 } } ],
  },
  {
    id: 'drum', name: 'Drum', x: 208, y: 52, r: 14, biome: 'snow', tier: 4,
    dockAngle: Math.PI / 2,
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Dr. Kudel', look: 'villager1',
        lines: ['Brrr! Willkommen auf der Winterinsel Drum.', 'Der tyrannische König Wapol ist zurückgekehrt...', 'Leg dich ans Feuer, ich päppel dich auf.'] },
      { dx: 0, dy: -6, type: 'boss', boss: 'wapol', name: 'Wapol' },
      { dx: -4, dy: -1, type: 'crew', crew: 'chopper', needFlag: 'boss_wapol', name: 'Chopper', look: 'chopper',
        ask: ['Du hast Wapol vertrieben! D-Danke...', 'Ich bin ein Rentier, das eine Teufelsfrucht gegessen hat. Und Arzt!', 'E-Es ist nicht so, dass ich mitkommen WILL, Idiot! ...Aber ich komme mit!'],
        wait: ['W-Wapol ist oben am Schloss! Er macht allen Angst!'] },
    ],
    chests: [
      { dx: 8, dy: -7, content: { fruit: 'hie' } },
      { dx: -8, dy: 6, content: { item: 'potion', qty: 3 } },
    ],
  },
  {
    id: 'alabasta', name: 'Alabasta', x: 214, y: 132, r: 16, biome: 'desert', tier: 4,
    dockAngle: Math.PI,
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Prinzessin Vivi', look: 'villager1',
        lines: ['Mein Königreich wird von innen zerstört...', 'Sir Crocodile steckt hinter allem!', 'Bitte, ruh dich aus und hilf uns dann!'] },
      { dx: 0, dy: -7, type: 'boss', boss: 'crocodile', name: 'Sir Crocodile' },
      { dx: -5, dy: 2, type: 'crew', crew: 'robin', needFlag: 'boss_crocodile', name: 'Nico Robin', look: 'robin',
        ask: ['Du hast Crocodile besiegt. Interessant.', 'Ich suche die wahre Geschichte der Welt — das Rio-Porneglyph.', 'Es liegt dort, wo auch dein Schatz liegt. Lass mich mitkommen.'],
        wait: ['Ich arbeite für Crocodile... noch. Beeindrucke mich.'] },
    ],
    chests: [
      { dx: 10, dy: 8, content: { fruit: 'mera' } },
      { dx: -10, dy: -8, content: { berry: 5000 } },
    ],
  },
  {
    id: 'water7', name: 'Water 7', x: 246, y: 92, r: 13, biome: 'grass', tier: 4,
    dockAngle: -Math.PI / 2,
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Kokoro', look: 'villager1',
        lines: ['Water 7 — Stadt der Schiffsbauer!', 'Ngagaga! Ruh dich aus!'] },
      { dx: 5, dy: -6, type: 'boss', boss: 'lucci', name: 'Rob Lucci' },
      { dx: -4, dy: 0, type: 'crew', crew: 'franky', needFlag: 'boss_lucci', name: 'Franky', look: 'franky',
        ask: ['Du hast Lucci besiegt?! SUUUPER!', 'Ich bin Cyborg und der beste Schiffszimmermann der Welt!', 'Ich baue dir das Schiff der Träume — die Thousand Sunny!'],
        wait: ['Die CP9 kontrolliert die Werft. Rob Lucci ist ihr Anführer — ein Monster.'] },
      { dx: 4, dy: 3, type: 'ship', name: 'Werft', look: 'smith', sale: { ship: 3, price: 25000, needCrew: 'franky' } },
    ],
    chests: [ { dx: -8, dy: -6, content: { fruit: 'ope' } } ],
  },
  {
    id: 'geisterschiff', name: 'Geisterschiff-Riff', x: 198, y: 152, r: 7, biome: 'grass', tier: 4, noTall: true,
    dockAngle: Math.PI / 2,
    npcs: [
      { dx: 0, dy: 0, type: 'crew', crew: 'brook', needCrew: 5, name: 'Brook', look: 'brook',
        ask: ['Yohoho! Ein Besucher! Ich bin nur noch Knochen — ein Skelett-Musiker!', 'Fünfzig Jahre trieb ich allein auf diesem Riff...', 'Eine so große Crew! Darf ich mitkommen? Ich spiele auch auf! Yohohoho!'],
        wait: ['Yohoho... deine Crew ist noch klein.', 'Komm wieder, wenn mindestens 5 Gefährten an deiner Seite stehen!'] },
    ],
    chests: [ { dx: 2, dy: 2, content: { berry: 4000 } } ],
  },
  {
    id: 'marineford', name: 'Marineford', x: 238, y: 150, r: 13, biome: 'grass', tier: 5, base: true, storm: true,
    dockAngle: Math.PI,
    npcs: [],
    chests: [ { dx: -7, dy: 5, content: { fruit: 'yami' } } ],
  },
  {
    id: 'laughtale', name: 'Laugh Tale', x: 244, y: 28, r: 10, biome: 'grass', tier: 5, storm: true, noTall: true,
    dockAngle: Math.PI / 2,
    npcs: [
      { dx: 0, dy: -2, type: 'boss', boss: 'blackbeard', name: 'Blackbeard' },
    ],
    chests: [ { dx: 0, dy: -5, content: { special: 'onepiece' } } ],
  },
];

// Boss der Marinebasen steht an der Basistür (wird in world.js platziert)
const BASE_BOSSES = { shells: 'morgan', logue: 'smoker', marineford: 'akainu' };

// ---- Questlinie (für den Ziel-Hinweis) ----
const QUESTS = [
  { flag: 'has_ship',        text: 'Kaufe ein Beiboot beim Schiffsbauer im Windmühlendorf (500 Berry). Kämpfe im hohen Gras!' },
  { flag: 'boss_higuma',     text: 'Besiege den Banditen Higuma im Wald nordöstlich des Windmühlendorfs.' },
  { flag: 'boss_morgan',     text: 'Segle nach Shells Town (Nordosten) und besiege Käpt\'n Morgan in der Marinebasis.' },
  { flag: 'crew_zorro',      text: 'Rekrutiere Zorro in Shells Town.' },
  { flag: 'boss_buggy',      text: 'Besiege Buggy den Clown in Orange Town (Südosten).' },
  { flag: 'boss_kuro',       text: 'Entlarve Käpt\'n Kuro im Sirup-Dorf (Nordosten).' },
  { flag: 'boss_krieg',      text: 'Besiege Don Krieg am schwimmenden Restaurant Baratie und rekrutiere Sanji.' },
  { flag: 'boss_arlong',     text: 'Stürme Arlong Park (Süden) und befreie Namis Dorf. Rekrutiere danach Nami in Orange Town.' },
  { flag: 'boss_smoker',     text: 'Stelle dich Käpt\'n Smoker in Loguetown (Osten). Besuche auch Rayleigh zum Haki-Training!' },
  { flag: 'ship2',           text: 'Kaufe die Going Merry in Loguetown (5000 Berry), um die Tiefsee der Grand Line zu überqueren.' },
  { flag: 'boss_wapol',      text: 'Grand Line! Besiege König Wapol auf der Winterinsel Drum (Norden).' },
  { flag: 'boss_crocodile',  text: 'Besiege Sir Crocodile im Wüstenkönigreich Alabasta (Süden).' },
  { flag: 'boss_lucci',      text: 'Besiege Rob Lucci in Water 7 (Osten). Franky kann dir dann die Thousand Sunny bauen.' },
  { flag: 'ship3',           text: 'Lass Franky die Thousand Sunny bauen (25000 Berry), um Sturmsee zu durchqueren.' },
  { flag: 'boss_akainu',     text: 'Durchquere die Sturmsee und besiege Admiral Akainu in Marineford (Südosten)!' },
  { flag: 'boss_blackbeard', text: 'Segle nach Laugh Tale (Nordosten) und besiege Blackbeard im finalen Kampf!' },
  { flag: 'king',            text: 'Öffne die Schatzkammer auf Laugh Tale und beanspruche das One Piece!' },
];

// =====================================================================
//  ONE PIECE: Reise zum Piratenkönig — Spieldaten
// =====================================================================
'use strict';

// ---- Kachel-Typen ----
const T = {
  W: 0,      // seichtes Wasser (Eastblue / Häfen)
  D: 1,      // Tiefsee / Grand Line (braucht Going Merry)
  S: 2,      // Sturmsee / Neue Welt (braucht Thousand Sunny)
  SAND: 3,
  GRASS: 4,
  TALL: 5,
  TREE: 6,
  ROCK: 7,
  HOUSE: 8,
  SHOP: 9,
  BASE: 10,
  DOCK: 11,
  PATH: 12,
  CHEST: 15,
  CHEST_OPEN: 16,
};

const WORLD_W = 600, WORLD_H = 400, TS = 32;
const WORLD_SEED = 4711;
const PARADISE_X = 202;   // ab hier: Grand Line (Tiefsee)
const NEWWORLD_X = 435;   // ab hier: Neue Welt (Sturmsee)

const WALKABLE = new Set([T.SAND, T.GRASS, T.TALL, T.PATH, T.DOCK, T.CHEST_OPEN]);
const WATER_TILES = new Set([T.W, T.D, T.S]);

// ---- Schiffe ----
const SHIPS = {
  0: { name: 'Kein Schiff', tiles: [], speed: 0 },
  1: { name: 'Beiboot', tiles: [T.W], speed: 230 },
  2: { name: 'Going Merry', tiles: [T.W, T.D], speed: 265 },
  3: { name: 'Thousand Sunny', tiles: [T.W, T.D, T.S], speed: 300 },
};

// ---- Aussehen ----
function L(skin, hair, style, shirt, pants, hat) {
  return { skin, hair, style, shirt, pants, hat: !!hat };
}
const LOOKS = {
  villager1: L('#e8b88a', '#5a3a1a', 0, '#3f9048', '#31456b'),
  villager2: L('#d99a68', '#26262e', 1, '#8a5a2b', '#333'),
  makino:    L('#f0c8a0', '#2e7d32', 2, '#e8c468', '#7a4a2b'),
  shanks:    L('#e8b88a', '#d63a3a', 1, '#4a3220', '#26262e'),
  mayor:     L('#e8b88a', '#c8c8cc', 0, '#4a4a6a', '#333'),
  marine:    L('#e8b88a', '#3a2a1a', 0, '#f2f4f8', '#2a4a8a'),
  bandit:    L('#d99a68', '#3a2a1a', 1, '#6a4a2a', '#3a2a1a'),
  pirate:    L('#e8b88a', '#26262e', 1, '#7a3ab8', '#333'),
  hunter:    L('#d99a68', '#1a5c2a', 0, '#4a5a3a', '#26262e'),
  zorro:     L('#e8b88a', '#3fa050', 0, '#f2f4f8', '#1a3a2a'),
  nami:      L('#f0c8a0', '#f4863c', 2, '#f2f4f8', '#4a6aaa'),
  lysop:     L('#c88a58', '#26262e', 1, '#c8a832', '#8a5a2b'),
  sanji:     L('#f0c8a0', '#e8c468', 2, '#26262e', '#26262e'),
  chopper:   L('#e8b88a', '#8a5a2b', 1, '#d63a3a', '#7a3ab8'),
  robin:     L('#e8b88a', '#222244', 2, '#6a3aaa', '#26262e'),
  franky:    L('#d99a68', '#2ab8e8', 1, '#e83a3a', '#2ab8e8'),
  brook:     L('#f5f0e0', '#111118', 1, '#26262e', '#26262e'),
  jinbe:     L('#5a8ac8', '#26262e', 0, '#c86a2a', '#333'),
  rayleigh:  L('#e8b88a', '#dddde2', 1, '#3a3a4a', '#26262e'),
  wirt:      L('#e8b88a', '#8a5a2b', 0, '#7a4a2b', '#333'),
  smith:     L('#d99a68', '#4a3a2a', 0, '#5a6a7a', '#333'),
  dealer:    L('#d99a68', '#26262e', 2, '#443355', '#26262e', true),
};

// =====================================================================
//  TEUFELSFRÜCHTE (34 Stück)
//  passive: hp/atkMult/defMult/speedMult/lifesteal/regen/thorns/takenMult/dodge
//  skills:  kind: proj | aoe | melee | dash | heal
//           mult = Schadensmultiplikator auf deinen Angriff
//           fx: burn | freeze | stun | knock | drain
// =====================================================================
const FRUITS = {
  gomu:  { name: 'Gum-Gum-Frucht', type: 'Paramecia', desc: 'Gummikörper: +60 max. KP.',
    passive: { hp: 60 },
    skills: [
      { name: 'Gum-Gum-Pistole', kind: 'proj', mult: 1.7, cost: 18, cd: 1.2, color: '#e8b88a', speed: 560, range: 300 },
      { name: 'Gum-Gum-Bazooka', kind: 'melee', mult: 2.6, cost: 32, cd: 4, fx: 'knock', color: '#e8b88a' } ] },
  mera:  { name: 'Feuer-Frucht', type: 'Logia', desc: 'Herrsche über das Feuer.',
    skills: [
      { name: 'Feuerfaust', kind: 'proj', mult: 1.9, cost: 20, cd: 1.5, fx: 'burn', color: '#ff7b3a', speed: 520, range: 340 },
      { name: 'Flammensäule', kind: 'aoe', mult: 2.2, cost: 36, cd: 6, fx: 'burn', radius: 130, color: '#ff5a1a' } ] },
  goro:  { name: 'Donner-Frucht', type: 'Logia', desc: 'Der Blitz selbst. +10% Tempo.',
    passive: { speedMult: 1.1 },
    skills: [
      { name: 'El Thor', kind: 'proj', mult: 2.0, cost: 22, cd: 1.6, fx: 'stun', color: '#ffe45a', speed: 700, range: 380 },
      { name: 'Blitz-Nova', kind: 'aoe', mult: 1.7, cost: 34, cd: 6, fx: 'stun', radius: 140, color: '#ffef8a' } ] },
  hie:   { name: 'Frost-Frucht', type: 'Logia', desc: 'Eiszeit auf Knopfdruck.',
    skills: [
      { name: 'Eislanze', kind: 'proj', mult: 1.8, cost: 20, cd: 1.5, fx: 'freeze', color: '#9adcf0', speed: 540, range: 330 },
      { name: 'Eiszeit', kind: 'aoe', mult: 1.5, cost: 34, cd: 6.5, fx: 'freeze', radius: 150, color: '#c8ecf8' } ] },
  magu:  { name: 'Magma-Frucht', type: 'Logia', desc: 'Alles verbrennt. +10% Angriff.',
    passive: { atkMult: 1.1 },
    skills: [
      { name: 'Magma-Faust', kind: 'proj', mult: 2.4, cost: 26, cd: 2, fx: 'burn', color: '#e83a1a', speed: 460, range: 300 },
      { name: 'Vulkanausbruch', kind: 'aoe', mult: 2.6, cost: 42, cd: 8, fx: 'burn', radius: 140, color: '#ff4a1a' } ] },
  pika:  { name: 'Glitzer-Frucht', type: 'Logia', desc: 'Lichtgeschwindigkeit! +15% Tempo.',
    passive: { speedMult: 1.15 },
    skills: [
      { name: 'Laserstrahl', kind: 'proj', mult: 2.0, cost: 22, cd: 1.2, color: '#fff8b0', speed: 850, range: 450 },
      { name: 'Yata-Spiegel', kind: 'dash', mult: 1.9, cost: 28, cd: 4.5, color: '#fffad0' } ] },
  suna:  { name: 'Sand-Frucht', type: 'Logia', desc: 'Die Wüste gehorcht dir.',
    skills: [
      { name: 'Desert Spada', kind: 'proj', mult: 1.9, cost: 20, cd: 1.5, color: '#e0c080', speed: 520, range: 340 },
      { name: 'Sandsturm', kind: 'aoe', mult: 1.8, cost: 34, cd: 6, radius: 150, color: '#e8cc90' } ] },
  moku:  { name: 'Rauch-Frucht', type: 'Logia', desc: 'Körper aus Rauch: +5% Ausweichen.',
    passive: { dodge: 0.05 },
    skills: [
      { name: 'White Blow', kind: 'melee', mult: 2.0, cost: 20, cd: 2, fx: 'knock', color: '#d8d8e0' },
      { name: 'White Out', kind: 'aoe', mult: 1.4, cost: 30, cd: 5.5, fx: 'stun', radius: 130, color: '#e8e8f0' } ] },
  gasu:  { name: 'Gas-Frucht', type: 'Logia', desc: 'Giftige Schwaden.',
    skills: [
      { name: 'Gastanet', kind: 'aoe', mult: 1.7, cost: 30, cd: 5, fx: 'burn', radius: 150, color: '#b8e05a' } ] },
  yuki:  { name: 'Schnee-Frucht', type: 'Logia', desc: 'Sanft und tödlich kalt.',
    skills: [
      { name: 'Schneesturm', kind: 'aoe', mult: 1.6, cost: 30, cd: 5.5, fx: 'freeze', radius: 150, color: '#f0f6fc' } ] },
  yami:  { name: 'Finster-Frucht', type: 'Logia', desc: 'Enorme Macht: +25% Angriff, aber +25% erlittener Schaden.',
    passive: { atkMult: 1.25, takenMult: 1.25 },
    skills: [
      { name: 'Schwarzes Loch', kind: 'aoe', mult: 2.4, cost: 36, cd: 6, fx: 'knock', radius: 160, color: '#3a2a55' },
      { name: 'Liberation', kind: 'proj', mult: 2.8, cost: 40, cd: 5, color: '#553a88', speed: 480, range: 320 } ] },
  gura:  { name: 'Beben-Frucht', type: 'Paramecia', desc: 'Die stärkste Paramecia: +20% Angriff.',
    passive: { atkMult: 1.2 },
    skills: [
      { name: 'Seequake', kind: 'aoe', mult: 3.0, cost: 48, cd: 9, fx: 'knock', radius: 180, color: '#e8e8f8' } ] },
  ope:   { name: 'OP-Frucht', type: 'Paramecia', desc: 'Die Operationsfrucht: Frucht-Angriffe heilen dich.',
    skills: [
      { name: 'Shambles', kind: 'dash', mult: 1.7, cost: 24, cd: 3.5, fx: 'drain', color: '#7ae0f0' },
      { name: 'Gamma Knife', kind: 'melee', mult: 2.7, cost: 36, cd: 5, fx: 'drain', color: '#5ad0e8' } ] },
  hana:  { name: 'Flora-Frucht', type: 'Paramecia', desc: 'Überall sprießen Arme.',
    skills: [
      { name: 'Clutch', kind: 'melee', mult: 1.9, cost: 20, cd: 2.2, fx: 'stun', color: '#f0a0c0' },
      { name: 'Mil Fleur', kind: 'aoe', mult: 1.6, cost: 30, cd: 5, fx: 'stun', radius: 130, color: '#f0b8d0' } ] },
  bara:  { name: 'Trenn-Trenn-Frucht', type: 'Paramecia', desc: 'Klingen prallen ab: +15% Verteidigung.',
    passive: { defMult: 1.15 },
    skills: [
      { name: 'Bara Bara Festival', kind: 'aoe', mult: 1.6, cost: 28, cd: 4.5, radius: 140, color: '#e88a8a' } ] },
  doku:  { name: 'Gift-Frucht', type: 'Paramecia', desc: 'Wandelndes Gift.',
    skills: [
      { name: 'Venom Demon', kind: 'proj', mult: 2.2, cost: 26, cd: 2.2, fx: 'burn', color: '#9a4ad0', speed: 440, range: 300 },
      { name: 'Giftwolke', kind: 'aoe', mult: 1.8, cost: 32, cd: 5.5, fx: 'burn', radius: 140, color: '#b060e0' } ] },
  nikyu: { name: 'Tatzen-Frucht', type: 'Paramecia', desc: 'Stoße alles von dir.',
    skills: [
      { name: 'Pad Hō', kind: 'proj', mult: 2.2, cost: 24, cd: 1.8, fx: 'knock', color: '#f8c8d8', speed: 600, range: 360 },
      { name: 'Ursus Shock', kind: 'aoe', mult: 2.2, cost: 40, cd: 8, fx: 'knock', radius: 170, color: '#f8d8e8' } ] },
  horo:  { name: 'Geister-Frucht', type: 'Paramecia', desc: 'Negativ-Geister lähmen den Kampfgeist.',
    skills: [
      { name: 'Negative Hollow', kind: 'proj', mult: 1.0, cost: 16, cd: 1.6, fx: 'stun', color: '#c0c0f0', speed: 400, range: 320 },
      { name: 'Geisterschwarm', kind: 'aoe', mult: 1.5, cost: 30, cd: 5, fx: 'stun', radius: 140, color: '#d0d0f8' } ] },
  kage:  { name: 'Schatten-Frucht', type: 'Paramecia', desc: 'Stiehl Kraft: 10% Lebensraub auf alles.',
    passive: { lifesteal: 0.10 },
    skills: [
      { name: 'Schatten-Asgard', kind: 'melee', mult: 2.4, cost: 30, cd: 4, color: '#44446a' } ] },
  ito:   { name: 'Faden-Frucht', type: 'Paramecia', desc: 'Unsichtbare Fäden schneiden alles.',
    skills: [
      { name: 'Overheat', kind: 'proj', mult: 2.2, cost: 24, cd: 1.8, color: '#f8f8ff', speed: 640, range: 420 },
      { name: 'Parasite', kind: 'proj', mult: 1.5, cost: 20, cd: 2.5, fx: 'stun', color: '#ffffff', speed: 500, range: 340 } ] },
  bomu:  { name: 'Bomben-Frucht', type: 'Paramecia', desc: 'Dein Körper explodiert (kontrolliert).',
    skills: [
      { name: 'Nasenfeuer', kind: 'proj', mult: 2.0, cost: 22, cd: 1.8, color: '#f8a03a', speed: 480, range: 300 },
      { name: 'Detonation', kind: 'aoe', mult: 2.1, cost: 36, cd: 6, fx: 'knock', radius: 150, color: '#ffb04a' } ] },
  kilo:  { name: 'Kilo-Frucht', type: 'Paramecia', desc: 'Tonnenschwer: +20% Verteidigung.',
    passive: { defMult: 1.2 },
    skills: [
      { name: '10.000-Kilo-Presse', kind: 'melee', mult: 2.6, cost: 30, cd: 4, fx: 'knock', color: '#c8c8d0' } ] },
  toge:  { name: 'Dornen-Frucht', type: 'Paramecia', desc: 'Stacheln überall: Angreifer erleiden 15% Reflexschaden.',
    passive: { thorns: 0.15 },
    skills: [
      { name: 'Stachelsturm', kind: 'aoe', mult: 1.7, cost: 30, cd: 5, radius: 140, color: '#c86a8a' } ] },
  ori:   { name: 'Käfig-Frucht', type: 'Paramecia', desc: 'Eisenfesseln aus dem Nichts.',
    skills: [
      { name: 'Eisenfessel', kind: 'proj', mult: 1.5, cost: 18, cd: 1.8, fx: 'stun', color: '#8a8a9a', speed: 460, range: 300 } ] },
  noro:  { name: 'Slow-Slow-Frucht', type: 'Paramecia', desc: 'Verlangsamt alles um dich.',
    skills: [
      { name: 'Noro-Noro-Strahl', kind: 'proj', mult: 0.9, cost: 14, cd: 1.2, fx: 'stun', color: '#f0b8f0', speed: 520, range: 340 } ] },
  awa:   { name: 'Blasen-Frucht', type: 'Paramecia', desc: 'Seifenblasen waschen Kraft weg.',
    skills: [
      { name: 'Seifensturm', kind: 'aoe', mult: 1.5, cost: 26, cd: 4.5, radius: 140, color: '#c8f0f8' } ] },
  sube:  { name: 'Glatt-Glatt-Frucht', type: 'Paramecia', desc: 'Alles gleitet ab: +20% Tempo, +5% Ausweichen.',
    passive: { speedMult: 1.2, dodge: 0.05 },
    skills: [
      { name: 'Rutschangriff', kind: 'dash', mult: 1.7, cost: 22, cd: 3, color: '#f8e8f0' } ] },
  mane:  { name: 'Kopier-Frucht', type: 'Paramecia', desc: 'Verwirre Gegner mit Doppelgängern.',
    skills: [
      { name: 'Doppelgänger-Wirbel', kind: 'aoe', mult: 1.6, cost: 28, cd: 4.5, fx: 'stun', radius: 130, color: '#e8d0a0' } ] },
  beri:  { name: 'Beeren-Frucht', type: 'Paramecia', desc: 'Zerfalle in Kugeln: +10% Ausweichen.',
    passive: { dodge: 0.10 },
    skills: [
      { name: 'Beerenlawine', kind: 'aoe', mult: 1.5, cost: 26, cd: 4.5, radius: 130, color: '#a0c860' } ] },
  hito:  { name: 'Mensch-Mensch-Frucht', type: 'Zoan', desc: 'Erleuchtung: +8% auf alle Werte.',
    passive: { hp: 30, atkMult: 1.08, defMult: 1.08, speedMult: 1.08 },
    skills: [
      { name: 'Kokosnuss-Kanone', kind: 'melee', mult: 2.1, cost: 22, cd: 2.5, color: '#e8b88a' } ] },
  tori:  { name: 'Phönix-Frucht', type: 'Mythische Zoan', desc: 'Blaue Flammen heilen: +1% KP-Regeneration pro Sekunde.',
    passive: { regen: 0.01 },
    skills: [
      { name: 'Phönix-Sturz', kind: 'dash', mult: 1.9, cost: 26, cd: 4, fx: 'drain', color: '#5ac8f0' } ] },
  ushi:  { name: 'Bison-Frucht', type: 'Zoan', desc: 'Rohe Kraft: +40 KP, +10% Angriff.',
    passive: { hp: 40, atkMult: 1.1 },
    skills: [
      { name: 'Fiddle Banff', kind: 'dash', mult: 2.0, cost: 26, cd: 3.5, fx: 'knock', color: '#8a6a4a' } ] },
  neko:  { name: 'Leoparden-Frucht', type: 'Zoan', desc: 'Raubtier: +15% Tempo, +10% Angriff.',
    passive: { speedMult: 1.15, atkMult: 1.1 },
    skills: [
      { name: 'Shigan-Klaue', kind: 'melee', mult: 2.3, cost: 24, cd: 2.5, color: '#e8c85a' } ] },
  inu:   { name: 'Wolfs-Frucht', type: 'Zoan', desc: 'Jäger im Rudel: +10% Tempo.',
    passive: { speedMult: 1.1 },
    skills: [
      { name: 'Reißzahn-Hatz', kind: 'dash', mult: 1.9, cost: 24, cd: 3, color: '#a8a8b8' } ] },
  zoo:   { name: 'Elefanten-Frucht', type: 'Zoan', desc: 'Koloss: +60 KP, +15% Verteidigung.',
    passive: { hp: 60, defMult: 1.15 },
    skills: [
      { name: 'Rüsselstoß', kind: 'melee', mult: 2.2, cost: 26, cd: 3, fx: 'knock', color: '#b0b0c0' } ] },
};
const FRUIT_IDS = Object.keys(FRUITS);

// ---- Items ----
const ITEMS = {
  meat:   { name: 'Fleisch', heal: 60, price: 120, desc: 'Heilt 60 KP.' },
  potion: { name: 'Heiltrank', heal: 150, price: 350, desc: 'Heilt 150 KP.' },
  feast:  { name: 'Festmahl', heal: 9999, price: 1200, desc: 'Heilt alle KP.' },
  cola:   { name: 'Energie-Cola', stamina: 60, price: 180, desc: 'Stellt sofort 60 Ausdauer wieder her.' },
};
const DEFAULT_SHOP = ['meat', 'potion', 'feast', 'cola'];

// ---- Gegner-Arten ----
const KINDS = {
  bandit:      { name: 'Bandit', sprite: 'bandit', water: false },
  rekrut:      { name: 'Marine-Rekrut', sprite: 'marine', water: false, marine: true },
  soldat:      { name: 'Marine-Soldat', sprite: 'marine', water: false, marine: true },
  pirat:       { name: 'Pirat', sprite: 'pirate', water: false },
  jaeger:      { name: 'Kopfgeldjäger', sprite: 'hunter', water: false },
  leutnant:    { name: 'Marine-Leutnant', sprite: 'marine', water: false, marine: true },
  kapitaen:    { name: 'Marine-Kapitän', sprite: 'marine', water: false, marine: true },
  vize:        { name: 'Marine-Vizeadmiral', sprite: 'marine', water: false, marine: true },
  agent:       { name: 'Baroque-Agent', sprite: 'hunter', water: false },
  cp:          { name: 'CP9-Agent', sprite: 'hunter', water: false },
  samurai:     { name: 'Beasts-Samurai', sprite: 'pirate', water: false },
  patrouille:  { name: 'Marine-Patrouille', sprite: 'ship', water: true, marine: true, ranged: true },
  kriegsschiff:{ name: 'Marine-Kriegsschiff', sprite: 'ship', water: true, marine: true, ranged: true },
  seekoenig:   { name: 'Seekönig', sprite: 'seaking', water: true },
};

// Land-Gegner nach Insel-Stufe (1-9)
const TIER_TABLES = {
  1: [ { k: 'bandit', a: 2, b: 5 }, { k: 'rekrut', a: 2, b: 5 } ],
  2: [ { k: 'pirat', a: 5, b: 9 }, { k: 'rekrut', a: 5, b: 9 } ],
  3: [ { k: 'soldat', a: 9, b: 14 }, { k: 'jaeger', a: 9, b: 14 } ],
  4: [ { k: 'agent', a: 14, b: 20 }, { k: 'soldat', a: 14, b: 20 } ],
  5: [ { k: 'leutnant', a: 20, b: 28 }, { k: 'jaeger', a: 20, b: 28 }, { k: 'cp', a: 22, b: 28 } ],
  6: [ { k: 'kapitaen', a: 28, b: 36 }, { k: 'pirat', a: 28, b: 36 } ],
  7: [ { k: 'vize', a: 36, b: 46 }, { k: 'samurai', a: 36, b: 46 } ],
  8: [ { k: 'samurai', a: 46, b: 56 }, { k: 'vize', a: 46, b: 56 } ],
  9: [ { k: 'vize', a: 56, b: 64 }, { k: 'samurai', a: 56, b: 64 } ],
};

// See-Gegner nach Wasserzone
function seaTable(tile) {
  if (tile === T.S) return [ { k: 'kriegsschiff', a: 38, b: 55 }, { k: 'seekoenig', a: 35, b: 52 } ];
  if (tile === T.D) return [ { k: 'patrouille', a: 15, b: 28 }, { k: 'seekoenig', a: 14, b: 26 } ];
  return [ { k: 'patrouille', a: 3, b: 8 }, { k: 'seekoenig', a: 4, b: 9 } ];
}

// ---- Bosse ----
const BOSSES = {
  higuma:     { name: 'Higuma der Bär', lvl: 5, sprite: 'bandit', berry: 800, bounty: 50000,
    intro: ['Verschwinde, Kleiner, oder ich mach dich fertig!'],
    defeated: ['Autsch... du bist ja stärker als Shanks\' Bande...'] },
  morgan:     { name: 'Käpt\'n Axt-Hand Morgan', lvl: 9, sprite: 'marine', berry: 2000, bounty: 3000000,
    intro: ['Ich bin die Gerechtigkeit dieser Stadt!'],
    defeated: ['Unmöglich... besiegt von einem Niemand...'] },
  buggy:      { name: 'Buggy der Clown', lvl: 12, sprite: 'pirate', berry: 3000, bounty: 8000000,
    intro: ['Du wagst es, über meine rote FLAMMENDE Nase zu lachen?!'],
    defeated: ['Meine Crew! Rückzug! RÜCKZUG!'] },
  kuro:       { name: 'Käpt\'n Kuro', lvl: 15, sprite: 'hunter', berry: 4000, bounty: 16000000,
    intro: ['Mein Plan war perfekt. Du wirst hier lautlos verschwinden.'],
    defeated: ['Mein... perfekter... Plan...'] },
  krieg:      { name: 'Don Krieg', lvl: 18, sprite: 'pirate', berry: 6000, bounty: 30000000,
    intro: ['Ich bin der stärkste Mann des Eastblue!'],
    defeated: ['Diese... Stärke...'] },
  arlong:     { name: 'Arlong', lvl: 21, sprite: 'hunter', berry: 9000, bounty: 45000000,
    intro: ['Ein Fischmensch kennt keine Gnade, Mensch!'],
    defeated: ['Nami... gehört... nicht mehr mir...'] },
  smoker:     { name: 'Käpt\'n Smoker', lvl: 25, sprite: 'marine', berry: 14000, bounty: 80000000,
    intro: ['Kein Pirat verlässt Loguetown ohne meine Erlaubnis.'],
    defeated: ['Verschwinde zur Grand Line... wir sehen uns wieder!'] },
  mr5:        { name: 'Mr. 5', lvl: 27, sprite: 'hunter', berry: 15000, bounty: 90000000,
    intro: ['Baroque-Firma, Officer Agent. Dein Pech.'],
    defeated: ['Die Firma... wird davon erfahren...'] },
  mr3:        { name: 'Mr. 3', lvl: 29, sprite: 'hunter', berry: 17000, bounty: 100000000,
    intro: ['Meine Wachs-Kunst wird dein Grabmal!'],
    defeated: ['Mein Meisterwerk... zerstört...'] },
  wapol:      { name: 'König Wapol', lvl: 31, sprite: 'pirate', berry: 20000, bounty: 120000000,
    intro: ['Dieses Königreich gehört MIR! Ich fresse dich auf!'],
    defeated: ['Mein Königreich... mein Schloss...'] },
  crocodile:  { name: 'Sir Crocodile', lvl: 34, sprite: 'hunter', berry: 28000, bounty: 200000000,
    intro: ['Alabasta wird untergehen — nach meinem Plan.'],
    defeated: ['Ein Grünschnabel... besiegt mich...?'] },
  bellamy:    { name: 'Bellamy die Hyäne', lvl: 35, sprite: 'pirate', berry: 26000, bounty: 195000000,
    intro: ['Träumer wie du werden auf Jaya ausgelacht!'],
    defeated: ['Ein Traum... ist also doch etwas wert...'] },
  enel:       { name: 'Gottheit Enel', lvl: 39, sprite: 'pirate', berry: 40000, bounty: 250000000,
    intro: ['Ich bin GOTT. Niemand entkommt meinem Donnergericht!'],
    defeated: ['Unmöglich... ein Sterblicher...'] },
  foxy:       { name: 'Foxy der Silberfuchs', lvl: 37, sprite: 'pirate', berry: 30000, bounty: 220000000,
    intro: ['Fehfehfeh! Zeit für ein Davy-Back-Fight!'],
    defeated: ['Feh... du bist einfach zu flink...'] },
  lucci:      { name: 'Rob Lucci', lvl: 42, sprite: 'hunter', berry: 55000, bounty: 320000000,
    intro: ['Dunkle Gerechtigkeit. Du kannst die Weltregierung nicht besiegen.'],
    defeated: ['Diese Kraft... stärker als die Gerechtigkeit...'] },
  moria:      { name: 'Gecko Moria', lvl: 44, sprite: 'pirate', berry: 60000, bounty: 360000000,
    intro: ['Kishishishi! Dein Schatten gehört MIR!'],
    defeated: ['Mein Schatten-Reich... zerfällt...'] },
  kizaru:     { name: 'Admiral Kizaru', lvl: 47, sprite: 'marine', berry: 70000, bounty: 400000000,
    intro: ['Ohh~ wie unheimlich, wie unheimlich. Zeit zu sterben~'],
    defeated: ['Ohh~ das war wohl... zu schnell für mich~'] },
  boa:        { name: 'Boa Hancock', lvl: 46, sprite: 'pirate', berry: 65000, bounty: 420000000,
    intro: ['Du wagst es, Amazon Lily zu betreten? Versteinere!'],
    defeated: ['Beeindruckend... vielleicht... verzeihe ich dir.'] },
  magellan:   { name: 'Chefwärter Magellan', lvl: 49, sprite: 'hunter', berry: 75000, bounty: 450000000,
    intro: ['Impel Down lässt niemanden entkommen. Gift-Hydra!'],
    defeated: ['Das Gefängnis... hat versagt...'] },
  hody:       { name: 'Hody Jones', lvl: 51, sprite: 'hunter', berry: 80000, bounty: 500000000,
    intro: ['Die Fischmenscheninsel gehört den wahren Fischmenschen!'],
    defeated: ['Diese Energie... was bist du...?'] },
  akainu:     { name: 'Flottenadmiral Akainu', lvl: 54, sprite: 'marine', berry: 120000, bounty: 900000000,
    intro: ['Absolute Gerechtigkeit duldet keine Piraten. Hier endet deine Reise.'],
    defeated: ['Die Marine... wird dich niemals vergessen...'] },
  caesar:     { name: 'Caesar Clown', lvl: 53, sprite: 'hunter', berry: 90000, bounty: 550000000,
    intro: ['Shurororo! Mein Gas wird dich zersetzen!'],
    defeated: ['Mein Labor... meine Forschung...'] },
  doflamingo: { name: 'Don Quichotte de Flamingo', lvl: 56, sprite: 'pirate', berry: 110000, bounty: 700000000,
    intro: ['Fuffuffuffu! Dressrosa ist meine Bühne — und du nur eine Marionette!'],
    defeated: ['Die Fäden... sind gerissen...'] },
  jack:       { name: 'Jack die Dürre', lvl: 58, sprite: 'pirate', berry: 120000, bounty: 800000000,
    intro: ['Zou wird fallen. Und du mit ihm.'],
    defeated: ['Kaido... wird das rächen...'] },
  bigmom:     { name: 'Big Mom', lvl: 61, sprite: 'pirate', berry: 200000, bounty: 1200000000,
    intro: ['Mamamama! Hochzeitstorte oder LEBEN — du verlierst beides!'],
    defeated: ['Meine... Torte... mein Imperium...'] },
  kaido:      { name: 'Kaido der 100 Bestien', lvl: 64, sprite: 'pirate', berry: 250000, bounty: 1500000000,
    intro: ['Worororo! Das stärkste Wesen der Welt fällt nicht!', 'Zeig mir, ob dein Wille Feuer fangen kann!'],
    defeated: ['Worororo... endlich... jemand, der es kann...'] },
  loki:       { name: 'Prinz Loki von Elbaf', lvl: 60, sprite: 'pirate', berry: 150000, bounty: 1000000000,
    intro: ['Ein Zwerg fordert einen Riesen heraus? HAH!'],
    defeated: ['Bei Odins Bart... welch ein Krieger...'] },
  blackbeard: { name: 'Marschall D. Teach', lvl: 70, sprite: 'pirate', berry: 500000, bounty: 3000000000,
    intro: ['Zehahaha! Das One Piece gehört MIR!', 'Der Traum der Menschen endet NIEMALS — aber DEINER endet HIER!'],
    defeated: ['Zehaha... ha... der Wille des D. ...', 'Du bist es... der neue König...'] },
};

// ---- Crew ----
const CREW = {
  zorro:   { name: 'Lorenor Zorro', role: 'Schwertkämpfer', bonus: '+15% Angriff, kämpft an deiner Seite', look: 'zorro' },
  nami:    { name: 'Nami', role: 'Navigatorin', bonus: '+10% Schiffstempo, findet 25% mehr Berry', look: 'nami' },
  lysop:   { name: 'Lysop', role: 'Scharfschütze', bonus: 'Kämpft mit Schleuder an deiner Seite', look: 'lysop' },
  sanji:   { name: 'Sanji', role: 'Smutje', bonus: '+20% KP-Regeneration außerhalb des Kampfes', look: 'sanji' },
  chopper: { name: 'Tony Chopper', role: 'Schiffsarzt', bonus: 'Items heilen 50% mehr, rettet dich 1× pro Kampf', look: 'chopper' },
  robin:   { name: 'Nico Robin', role: 'Archäologin', bonus: '+20% Erfahrung', look: 'robin' },
  franky:  { name: 'Franky', role: 'Schiffszimmermann', bonus: 'Baut die Thousand Sunny, +10% Verteidigung', look: 'franky' },
  brook:   { name: 'Brook', role: 'Musiker', bonus: '+10% Ausweichchance', look: 'brook' },
  jinbe:   { name: 'Jinbe', role: 'Steuermann', bonus: '+15% Schiffstempo, kämpft an deiner Seite', look: 'jinbe' },
};
// Crew-Mitglieder, die aktiv mitkämpfen
const CREW_FIGHTERS = { zorro: 0.5, lysop: 0.35, jinbe: 0.45 };

// =====================================================================
//  INSELN (31) — die Welt von One Piece
//  Eastblue (x<202) · Grand Line/Paradies (202-435) · Neue Welt (>435)
// =====================================================================
const ISLANDS = [
  // ---------- EASTBLUE ----------
  {
    id: 'fuchsia', name: 'Windmühlendorf', x: 40, y: 200, r: 16, biome: 'grass', tier: 1,
    dockAngle: Math.PI / 2,
    boss: 'higuma', bossPos: { dx: 8, dy: -8 },
    npcs: [
      { dx: 0, dy: -3, type: 'inn', name: 'Makino', look: 'makino',
        lines: ['Willkommen in der Partys Bar!', 'Ruh dich aus — ich mache dich wieder fit!'] },
      { dx: -3, dy: 1, type: 'talk', name: 'Rotschopf Shanks', look: 'shanks',
        lines: ['Du willst König der Piraten werden? Dann setz alles auf diesen Traum!',
          'Kauf dir beim Schiffsbauer am Südsteg ein Beiboot und stich in See!',
          'Da draußen warten Banditen und Marine — kämpfe, sammle Berry und werde stärker.',
          'Und lass die Finger von Higuma im Nordwald... oder auch nicht. Hehe.'] },
      { dx: 3, dy: 1, type: 'mayor', name: 'Bürgermeister Woop Slap', look: 'mayor' },
      { dx: 1, dy: 10, type: 'ship', name: 'Schiffsbauer', look: 'smith', sale: { ship: 1, price: 500 } },
    ],
    chests: [ { dx: -10, dy: -9, content: { fruit: 'gomu' } }, { dx: 9, dy: 8, content: { berry: 400 } } ],
  },
  {
    id: 'shells', name: 'Shells Town', x: 95, y: 140, r: 15, biome: 'grass', tier: 1, base: true,
    dockAngle: Math.PI / 2, baseBoss: 'morgan',
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Rika', look: 'villager1',
        lines: ['Käpt\'n Morgan regiert die Marinebasis mit eiserner Axt...', 'Ruh dich aus!'] },
      { dx: 5, dy: -4, type: 'crew', crew: 'zorro', needFlag: 'boss_morgan', name: 'Zorro', look: 'zorro',
        ask: ['Du hast Morgan besiegt? Nicht schlecht.', 'Ich werde der beste Schwertkämpfer der Welt!', 'Ein Piratenkönig braucht den besten Schwertkämpfer, oder?'],
        wait: ['Besiege erst Käpt\'n Morgan an der Basis, dann reden wir.'] },
    ],
    chests: [ { dx: -8, dy: 7, content: { item: 'potion', qty: 2 } }, { dx: 8, dy: 8, content: { berry: 600 } } ],
  },
  {
    id: 'orange', name: 'Orange Town', x: 110, y: 250, r: 14, biome: 'grass', tier: 1,
    dockAngle: Math.PI,
    boss: 'buggy', bossPos: { dx: 0, dy: -7 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Boodle', look: 'mayor',
        lines: ['Buggy der Clown terrorisiert unsere Stadt vom Nordplatz aus!', 'Bitte hilf uns — und ruh dich aus.'] },
    ],
    chests: [ { dx: 8, dy: -5, content: { fruit: 'bara' } }, { dx: -8, dy: 6, content: { berry: 900 } } ],
  },
  {
    id: 'syrup', name: 'Sirup-Dorf', x: 150, y: 180, r: 15, biome: 'grass', tier: 2,
    dockAngle: Math.PI / 2,
    boss: 'kuro', bossPos: { dx: 7, dy: -7 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Kaya', look: 'makino',
        lines: ['Mein Butler Klahadore... irgendetwas stimmt nicht mit ihm.', 'Bitte ruh dich aus.'] },
      { dx: -3, dy: -3, type: 'crew', crew: 'lysop', needFlag: 'boss_kuro', name: 'Lysop', look: 'lysop',
        ask: ['Du hast Käpt\'n Kuro entlarvt! Ich, der große Käpt\'n Lysop, habe natürlich geholfen!', 'Ein tapferer Krieger der See gehört auf ein Piratenschiff!'],
        wait: ['Der Butler Klahadore ist in Wahrheit der Pirat Käpt\'n Kuro!', 'Er lauert im Norden der Insel!'] },
    ],
    chests: [ { dx: -9, dy: 8, content: { berry: 1400 } } ],
  },
  {
    id: 'baratie', name: 'Baratie', x: 175, y: 260, r: 9, biome: 'grass', tier: 2, noTall: true,
    dockAngle: Math.PI / 2,
    boss: 'krieg', bossPos: { dx: 0, dy: -5 },
    npcs: [
      { dx: -2, dy: 1, type: 'inn', name: 'Chefkoch Zeff', look: 'wirt',
        lines: ['Willkommen im Baratie, dem besten Restaurant der Meere!', 'Iss dich satt, Bürschchen!'] },
      { dx: 2, dy: 1, type: 'crew', crew: 'sanji', needFlag: 'boss_krieg', name: 'Sanji', look: 'sanji',
        ask: ['Du hast Don Krieg vermöbelt — nicht übel.', 'Mein Traum ist das All Blue. Ein Koch gehört aufs Meer!'],
        wait: ['Don Krieg will das Restaurant übernehmen. Der Kerl da draußen nervt.'] },
    ],
    chests: [ { dx: 3, dy: 4, content: { item: 'feast', qty: 2 } } ],
  },
  {
    id: 'arlongpark', name: 'Arlong Park', x: 120, y: 320, r: 14, biome: 'grass', tier: 2,
    dockAngle: -Math.PI / 2,
    boss: 'arlong', bossPos: { dx: 0, dy: -6 },
    npcs: [
      { dx: -3, dy: 1, type: 'talk', name: 'Nojiko', look: 'villager1',
        lines: ['Arlong presst unser Dorf seit Jahren aus.', 'Nami arbeitet nur für ihn, um uns freizukaufen...', 'Bitte — besiege Arlong!'] },
      { dx: 3, dy: 1, type: 'crew', crew: 'nami', needFlag: 'boss_arlong', name: 'Nami', look: 'nami',
        ask: ['Arlong Park ist gefallen... mein Dorf ist frei!', 'Ich bin die beste Navigatorin der Welt — ich zeichne dir die Karte bis ans Ende der Welt!'],
        wait: ['Geh weg. Ich gehöre zu Arlongs Crew... noch.'] },
    ],
    chests: [ { dx: 7, dy: 5, content: { berry: 3500 } } ],
  },
  {
    id: 'logue', name: 'Loguetown', x: 185, y: 120, r: 16, biome: 'grass', tier: 3, base: true,
    dockAngle: 0, baseBoss: 'smoker',
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Wirtin', look: 'villager1',
        lines: ['Loguetown — Stadt des Anfangs und des Endes.', 'Hier wurde Gold Roger geboren und hingerichtet.', 'Ruh dich aus, bevor du zur Grand Line aufbrichst!'] },
      { dx: -5, dy: 3, type: 'haki', name: 'Silvers Rayleigh', look: 'rayleigh' },
      { dx: 3, dy: 1, type: 'talk', name: 'Händler', look: 'villager2',
        lines: ['Östlich beginnt die Tiefsee der Grand Line — mit einem Beiboot bist du dort verloren!', 'Der Schiffsbauer am Oststeg baut dir die Going Merry.'] },
      { dx: 9, dy: 1, type: 'ship', name: 'Schiffsbauer', look: 'smith', sale: { ship: 2, price: 8000 } },
    ],
    chests: [ { dx: -9, dy: -7, content: { berry: 2500 } } ],
  },
  // ---------- GRAND LINE / PARADIES ----------
  {
    id: 'twincape', name: 'Twin Cape', x: 210, y: 215, r: 8, biome: 'grass', tier: 3, noTall: true,
    dockAngle: Math.PI,
    npcs: [
      { dx: 0, dy: -2, type: 'inn', name: 'Leuchtturmwärter Crocus', look: 'mayor',
        lines: ['Willkommen auf der Grand Line, junger Pirat!', 'Ich habe einst mit Rogers Crew das Ende der Welt gesehen...', 'Ruh dich aus — der Weg wird hart.'] },
    ],
    chests: [ { dx: 3, dy: 3, content: { berry: 2000 } } ],
  },
  {
    id: 'whiskey', name: 'Whiskey Peak', x: 225, y: 160, r: 13, biome: 'desert', tier: 3,
    dockAngle: Math.PI / 2,
    boss: 'mr5', bossPos: { dx: 0, dy: -6 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Igaram', look: 'villager2',
        lines: ['Ma-Ma-Maa! Diese Stadt ist voller Kopfgeldjäger der Baroque-Firma!', 'Pass auf dich auf... und ruh dich aus.'] },
    ],
    chests: [ { dx: 7, dy: 6, content: { berry: 3000 } } ],
  },
  {
    id: 'ohara', name: 'Ohara (Ruinen)', x: 230, y: 40, r: 12, biome: 'grass', tier: 3, noTall: true,
    dockAngle: Math.PI / 2,
    npcs: [
      { dx: 0, dy: 0, type: 'talk', name: 'Alter Gelehrter', look: 'mayor',
        lines: ['Ohara... einst das Zentrum der Gelehrsamkeit, vom Buster Call ausgelöscht.', 'Die Wahrheit der verlorenen Geschichte liegt am Ende der Grand Line...', 'Nimm, was von unserer Bibliothek übrig ist.'] },
    ],
    chests: [ { dx: -5, dy: 4, content: { fruit: 'hana' } }, { dx: 5, dy: 4, content: { berry: 5000 } } ],
  },
  {
    id: 'littlegarden', name: 'Little Garden', x: 250, y: 240, r: 14, biome: 'grass', tier: 3,
    dockAngle: 0,
    boss: 'mr3', bossPos: { dx: 0, dy: -7 },
    npcs: [
      { dx: -3, dy: 1, type: 'talk', name: 'Riese Dorry', look: 'bandit',
        lines: ['GEGYAGYAGYA! Diese Insel ist ein Schlachtfeld der Riesen!', 'Ein Wachs-Mann treibt hier sein Unwesen. Zeig ihm Elbafs Mut!'] },
    ],
    chests: [ { dx: 8, dy: 6, content: { fruit: 'bomu' } } ],
  },
  {
    id: 'drum', name: 'Drum', x: 270, y: 80, r: 14, biome: 'snow', tier: 4,
    dockAngle: Math.PI / 2,
    boss: 'wapol', bossPos: { dx: 0, dy: -7 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Dr. Kudel', look: 'villager1',
        lines: ['Brrr! Willkommen auf der Winterinsel Drum.', 'Der Tyrann Wapol ist zurück... Leg dich ans Feuer, ich päppel dich auf.'] },
      { dx: -4, dy: -2, type: 'crew', crew: 'chopper', needFlag: 'boss_wapol', name: 'Chopper', look: 'chopper',
        ask: ['Du hast Wapol vertrieben! D-Danke...', 'E-Es ist nicht so, dass ich mitkommen WILL, Idiot! ...Aber ich komme mit!'],
        wait: ['W-Wapol ist oben am Schloss! Er macht allen Angst!'] },
    ],
    chests: [ { dx: 8, dy: -7, content: { fruit: 'hie' } }, { dx: -8, dy: 7, content: { item: 'potion', qty: 3 } } ],
  },
  {
    id: 'alabasta', name: 'Alabasta', x: 300, y: 300, r: 18, biome: 'desert', tier: 4,
    dockAngle: Math.PI,
    boss: 'crocodile', bossPos: { dx: 0, dy: -8 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Prinzessin Vivi', look: 'villager1',
        lines: ['Mein Königreich wird von innen zerstört... Sir Crocodile steckt dahinter!', 'Bitte, ruh dich aus und hilf uns dann!'] },
      { dx: -5, dy: 3, type: 'crew', crew: 'robin', needFlag: 'boss_crocodile', name: 'Nico Robin', look: 'robin',
        ask: ['Du hast Crocodile besiegt. Interessant.', 'Ich suche die wahre Geschichte der Welt. Sie liegt dort, wo auch dein Schatz liegt.'],
        wait: ['Ich arbeite für Crocodile... noch. Beeindrucke mich.'] },
    ],
    chests: [ { dx: 11, dy: 9, content: { fruit: 'mera' } }, { dx: -11, dy: -9, content: { fruit: 'suna' } }, { dx: 0, dy: 12, content: { berry: 6000 } } ],
  },
  {
    id: 'jaya', name: 'Jaya / Mocktown', x: 320, y: 180, r: 13, biome: 'grass', tier: 4,
    dockAngle: Math.PI / 2,
    boss: 'bellamy', bossPos: { dx: 4, dy: -5 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Barkeeper Terry', look: 'wirt',
        lines: ['Mocktown — Stadt der Spötter. Hier lacht man über Träumer.', 'Es heißt, eine Insel schwebt im Himmel... Norden, sagen die Karten. Nur Verrückte glauben dran.'] },
    ],
    chests: [ { dx: 7, dy: 6, content: { berry: 8000 } } ],
  },
  {
    id: 'skypiea', name: 'Skypiea', x: 350, y: 40, r: 15, biome: 'sky', tier: 5,
    dockAngle: Math.PI / 2,
    boss: 'enel', bossPos: { dx: 0, dy: -7 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Conis', look: 'makino',
        lines: ['Heso! Willkommen im Himmelsmeer Skypiea!', '"Gott" Enel herrscht mit Blitz und Furcht über uns...', 'Ruh dich in den Wolken aus.'] },
    ],
    chests: [ { dx: 8, dy: 7, content: { fruit: 'goro' } }, { dx: -8, dy: 7, content: { berry: 10000 } } ],
  },
  {
    id: 'longring', name: 'Long Ring Land', x: 365, y: 120, r: 12, biome: 'grass', tier: 4,
    dockAngle: 0,
    boss: 'foxy', bossPos: { dx: 0, dy: -6 },
    npcs: [
      { dx: -3, dy: 1, type: 'talk', name: 'Nomaden-Hirte', look: 'villager2',
        lines: ['Diese Insel ist laaaaang. Alles hier ist laaaaang.', 'Der Silberfuchs Foxy fordert jeden zum Kampf — pass auf deine Crew auf!'] },
    ],
    chests: [ { dx: 6, dy: 5, content: { berry: 7000 } } ],
  },
  {
    id: 'water7', name: 'Water 7', x: 390, y: 220, r: 16, biome: 'grass', tier: 5,
    dockAngle: -Math.PI / 2,
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Kokoro', look: 'villager1',
        lines: ['Water 7 — Stadt der Schiffsbauer! Ngagaga!', 'Die CP9 hat sich Enies Lobby im Nordosten unter den Nagel gerissen...', 'Ruh dich aus!'] },
      { dx: -4, dy: 3, type: 'crew', crew: 'franky', needFlag: 'boss_lucci', name: 'Franky', look: 'franky',
        ask: ['Du hast Lucci besiegt?! SUUUPER!', 'Ich baue dir das Schiff der Träume — die Thousand Sunny!'],
        wait: ['Rob Lucci von der CP9 sitzt in Enies Lobby, nordöstlich von hier. Ein Monster.'] },
      { dx: 4, dy: 3, type: 'ship', name: 'Werft', look: 'smith', sale: { ship: 3, price: 50000, needCrew: 'franky' } },
    ],
    chests: [ { dx: -9, dy: -7, content: { fruit: 'ope' } } ],
  },
  {
    id: 'enies', name: 'Enies Lobby', x: 405, y: 150, r: 14, biome: 'grass', tier: 5, base: true,
    dockAngle: Math.PI, baseBoss: 'lucci',
    npcs: [],
    chests: [ { dx: -7, dy: 6, content: { berry: 12000 } } ],
  },
  {
    id: 'thriller', name: 'Thriller Bark', x: 370, y: 320, r: 15, biome: 'dark', tier: 5,
    dockAngle: -Math.PI / 2,
    boss: 'moria', bossPos: { dx: 0, dy: -7 },
    npcs: [
      { dx: 3, dy: 2, type: 'crew', crew: 'brook', needCrew: 5, name: 'Brook', look: 'brook',
        ask: ['Yohoho! Ein Besucher! Ich bin nur noch Knochen — ein Skelett-Musiker!', 'Eine so große Crew! Darf ich mitkommen? Ich spiele auch auf! Yohohoho!'],
        wait: ['Yohoho... deine Crew ist noch klein.', 'Komm wieder mit mindestens 5 Gefährten!'] },
    ],
    chests: [ { dx: -8, dy: 6, content: { fruit: 'kage' } }, { dx: 8, dy: 6, content: { fruit: 'horo' } } ],
  },
  {
    id: 'sabaody', name: 'Sabaody-Archipel', x: 400, y: 265, r: 14, biome: 'grass', tier: 5,
    dockAngle: Math.PI / 2,
    boss: 'kizaru', bossPos: { dx: 6, dy: -6 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Shakuyaku', look: 'makino',
        lines: ['Willkommen in Shakkys Bar, Sabaody-Archipel.', 'Hier trennt sich die Spreu vom Weizen — dahinter wartet die Neue Welt.', 'Ruh dich aus.'] },
      { dx: 3, dy: 1, type: 'merchant', name: 'Schwarzmarkt-Händler', look: 'dealer' },
      { dx: -5, dy: 3, type: 'haki', name: 'Silvers Rayleigh', look: 'rayleigh' },
    ],
    chests: [ { dx: 8, dy: 7, content: { berry: 15000 } } ],
  },
  {
    id: 'amazon', name: 'Amazon Lily', x: 340, y: 370, r: 13, biome: 'grass', tier: 5,
    dockAngle: -Math.PI / 2,
    boss: 'boa', bossPos: { dx: 0, dy: -6 },
    npcs: [
      { dx: -3, dy: 1, type: 'talk', name: 'Kriegerin', look: 'villager1',
        lines: ['Männer sind auf Amazon Lily eigentlich verboten!', 'Nur wer Prinzessin Boa Hancock beeindruckt, darf bleiben...'] },
    ],
    chests: [ { dx: 7, dy: 6, content: { fruit: 'mane' } } ],
  },
  {
    id: 'impel', name: 'Impel Down', x: 280, y: 370, r: 13, biome: 'dark', tier: 6, base: true,
    dockAngle: -Math.PI / 2, baseBoss: 'magellan',
    npcs: [],
    chests: [ { dx: -7, dy: 5, content: { fruit: 'doku' } } ],
  },
  {
    id: 'marineford', name: 'Marineford', x: 415, y: 335, r: 15, biome: 'grass', tier: 6, base: true,
    dockAngle: Math.PI, baseBoss: 'akainu',
    npcs: [],
    chests: [ { dx: -8, dy: 6, content: { fruit: 'yami' } } ],
  },
  // ---------- NEUE WELT ----------
  {
    id: 'fishman', name: 'Fischmenscheninsel', x: 450, y: 290, r: 14, biome: 'coral', tier: 6,
    dockAngle: -Math.PI / 2,
    boss: 'hody', bossPos: { dx: 0, dy: -7 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Camie', look: 'makino',
        lines: ['Willkommen auf der Fischmenscheninsel, 10.000 Meter unter dem Meer!', '(Na gut — in dieser Welt liegt sie AUF dem Meer. Details!)', 'Ruh dich aus!'] },
      { dx: 3, dy: 1, type: 'crew', crew: 'jinbe', needFlag: 'boss_hody', name: 'Jinbe', look: 'jinbe',
        ask: ['Du hast Hody gestoppt und meine Heimat gerettet.', 'Ich, Jinbe, Ritter der Meere, stehe in deiner Schuld.', 'Mein Steuer gehört dir, zukünftiger König der Piraten!'],
        wait: ['Hody Jones vergiftet diese Insel mit Hass. Stoppe ihn — dann reden wir.'] },
    ],
    chests: [ { dx: 7, dy: 6, content: { berry: 20000 } } ],
  },
  {
    id: 'punk', name: 'Punk Hazard', x: 460, y: 120, r: 14, biome: 'snow', tier: 6,
    dockAngle: Math.PI / 2,
    boss: 'caesar', bossPos: { dx: 0, dy: -7 },
    npcs: [
      { dx: -3, dy: 1, type: 'talk', name: 'Gefangener Samurai', look: 'pirate',
        lines: ['Diese Insel ist halb Feuer, halb Eis — und voller Gift!', 'Der Wissenschaftler Caesar Clown experimentiert hier mit Gas...'] },
    ],
    chests: [ { dx: 8, dy: -6, content: { fruit: 'gasu' } }, { dx: -8, dy: 6, content: { fruit: 'yuki' } } ],
  },
  {
    id: 'dressrosa', name: 'Dressrosa', x: 490, y: 220, r: 16, biome: 'desert', tier: 7,
    dockAngle: Math.PI,
    boss: 'doflamingo', bossPos: { dx: 0, dy: -8 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Rebecca', look: 'villager1',
        lines: ['Dressrosa tanzt nach Doflamingos Fäden...', 'Im Kolosseum kämpfen Sklaven um eine Teufelsfrucht.', 'Ruh dich aus, Fremder.'] },
    ],
    chests: [ { dx: 10, dy: 8, content: { fruit: 'ito' } }, { dx: -10, dy: 8, content: { berry: 30000 } } ],
  },
  {
    id: 'zou', name: 'Zou', x: 520, y: 150, r: 13, biome: 'grass', tier: 7,
    dockAngle: Math.PI / 2,
    boss: 'jack', bossPos: { dx: 0, dy: -6 },
    npcs: [
      { dx: -3, dy: 1, type: 'talk', name: 'Mink-Krieger', look: 'villager2',
        lines: ['Diese Insel liegt auf dem Rücken eines wandernden Riesenelefanten!', 'Jack die Dürre will unser Volk auslöschen — hilf uns!'] },
    ],
    chests: [ { dx: 7, dy: 6, content: { fruit: 'zoo' } } ],
  },
  {
    id: 'wholecake', name: 'Whole Cake Island', x: 520, y: 300, r: 15, biome: 'grass', tier: 7,
    dockAngle: -Math.PI / 2,
    boss: 'bigmom', bossPos: { dx: 0, dy: -7 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Pudding', look: 'makino',
        lines: ['Willkommen auf Whole Cake Island... Mama sieht ALLES.', 'Iss ein Stück Torte und ruh dich aus — vielleicht dein letztes.'] },
    ],
    chests: [ { dx: 8, dy: 7, content: { berry: 50000 } } ],
  },
  {
    id: 'elbaf', name: 'Elbaf', x: 560, y: 220, r: 14, biome: 'snow', tier: 8,
    dockAngle: Math.PI,
    boss: 'loki', bossPos: { dx: 0, dy: -7 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Riesen-Wirtin', look: 'villager1',
        lines: ['WILLKOMMEN IN ELBAF, LAND DER RIESEN!', 'Entschuldige. Wir sprechen immer so. RUH DICH AUS!'] },
    ],
    chests: [ { dx: 8, dy: 6, content: { fruit: 'gura' } } ],
  },
  {
    id: 'wano', name: 'Wano-Land', x: 555, y: 95, r: 16, biome: 'sakura', tier: 8,
    dockAngle: Math.PI,
    boss: 'kaido', bossPos: { dx: 0, dy: -8 },
    npcs: [
      { dx: -3, dy: 1, type: 'inn', name: 'Okiku', look: 'makino',
        lines: ['Willkommen in Wano, Land der Samurai.', 'Kaido der 100 Bestien hält unser Land seit 20 Jahren besetzt.', 'Ruh dich aus — und öffne Wano die Augen.'] },
    ],
    chests: [ { dx: 10, dy: 8, content: { fruit: 'tori' } }, { dx: -10, dy: 8, content: { berry: 80000 } } ],
  },
  {
    id: 'laughtale', name: 'Laugh Tale', x: 580, y: 40, r: 12, biome: 'grass', tier: 9, noTall: true,
    dockAngle: Math.PI / 2,
    boss: 'blackbeard', bossPos: { dx: 0, dy: -3 },
    npcs: [],
    chests: [ { dx: 0, dy: -6, content: { special: 'onepiece' } } ],
  },
];

// ---- Questlinie ----
const QUESTS = [
  { flag: 'has_ship',        text: 'Kaufe ein Beiboot beim Schiffsbauer im Windmühlendorf (500 Berry). Besiege Gegner für Berry!' },
  { flag: 'boss_higuma',     text: 'Besiege den Banditen Higuma im Nordwald des Windmühlendorfs.' },
  { flag: 'boss_morgan',     text: 'Segle nach Shells Town (Nordosten) und besiege Käpt\'n Morgan an der Marinebasis.' },
  { flag: 'crew_zorro',      text: 'Rekrutiere Zorro in Shells Town.' },
  { flag: 'boss_buggy',      text: 'Besiege Buggy den Clown in Orange Town (Süden).' },
  { flag: 'boss_kuro',       text: 'Entlarve Käpt\'n Kuro im Sirup-Dorf und rekrutiere Lysop.' },
  { flag: 'boss_krieg',      text: 'Besiege Don Krieg am Restaurant Baratie und rekrutiere Sanji.' },
  { flag: 'boss_arlong',     text: 'Stürme Arlong Park (Südwesten) und rekrutiere danach Nami.' },
  { flag: 'boss_smoker',     text: 'Stelle dich Käpt\'n Smoker in Loguetown. Besuche auch Rayleigh zum Haki-Training (ab Level 10)!' },
  { flag: 'ship2',           text: 'Kaufe die Going Merry in Loguetown (8.000 Berry) und segle ostwärts auf die Grand Line!' },
  { flag: 'boss_crocodile',  text: 'Grand Line! Kämpfe dich über Whiskey Peak und Drum bis nach Alabasta und stürze Sir Crocodile.' },
  { flag: 'boss_enel',       text: 'Segle nach Skypiea im hohen Norden und besiege "Gott" Enel.' },
  { flag: 'boss_lucci',      text: 'Besiege Rob Lucci in Enies Lobby. Danach baut Franky in Water 7 die Thousand Sunny.' },
  { flag: 'ship3',           text: 'Lass Franky die Thousand Sunny bauen (50.000 Berry), um die Sturmsee der Neuen Welt zu überqueren.' },
  { flag: 'boss_moria',      text: 'Besiege Gecko Moria auf Thriller Bark (Süden).' },
  { flag: 'boss_kizaru',     text: 'Stelle dich Admiral Kizaru auf dem Sabaody-Archipel.' },
  { flag: 'boss_akainu',     text: 'Greife Marineford an und besiege Flottenadmiral Akainu!' },
  { flag: 'boss_hody',       text: 'Neue Welt! Rette die Fischmenscheninsel vor Hody Jones und rekrutiere Jinbe.' },
  { flag: 'boss_doflamingo', text: 'Schneide Doflamingos Fäden auf Dressrosa durch.' },
  { flag: 'boss_bigmom',     text: 'Besiege Kaiserin Big Mom auf Whole Cake Island.' },
  { flag: 'boss_kaido',      text: 'Befreie Wano: Besiege Kaido, das stärkste Wesen der Welt!' },
  { flag: 'boss_blackbeard', text: 'Segle nach Laugh Tale (äußerster Nordosten) und besiege Blackbeard im finalen Kampf!' },
  { flag: 'king',            text: 'Öffne die Schatzkammer auf Laugh Tale und beanspruche das One Piece!' },
];

// ---- Erfolge ----
const ACHIEVEMENTS = [
  { id: 'first_ship', name: 'Kapitän', desc: 'Kaufe dein erstes Boot.', check: st => st.ship >= 1 },
  { id: 'merry', name: 'Auf zur Grand Line', desc: 'Erwirb die Going Merry.', check: st => st.ship >= 2 },
  { id: 'sunny', name: 'Sturmfest', desc: 'Erwirb die Thousand Sunny.', check: st => st.ship >= 3 },
  { id: 'first_mate', name: 'Erster Nakama', desc: 'Rekrutiere dein erstes Crewmitglied.', check: st => st.crew.length >= 1 },
  { id: 'full_crew', name: 'Strohhut-Bande komplett', desc: 'Rekrutiere alle ' + Object.keys(CREW).length + ' Crewmitglieder.', check: st => st.crew.length >= Object.keys(CREW).length },
  { id: 'first_fruit', name: 'Verbotene Frucht', desc: 'Finde deine erste Teufelsfrucht.', check: st => !!st.fruit || st.inventory.fruits.length > 0 || FRUIT_IDS.some(fid => st.flags['fruit_' + fid]) },
  { id: 'fruit_master', name: 'Fruchthändler', desc: 'Entdecke alle ' + FRUIT_IDS.length + ' Teufelsfrüchte.', check: st => FRUIT_IDS.every(fid => st.flags['fruit_' + fid] || st.inventory.fruits.includes(fid) || st.fruit === fid) },
  { id: 'first_boss', name: 'Erster Sieg', desc: 'Besiege deinen ersten Boss.', check: st => Object.keys(BOSSES).some(id => st.flags['boss_' + id]) },
  { id: 'boss_10', name: 'Gefürchtet', desc: 'Besiege 10 Bosse.', check: st => Object.keys(BOSSES).filter(id => st.flags['boss_' + id]).length >= 10 },
  { id: 'all_bosses', name: 'Bezwinger der Meere', desc: 'Besiege alle Bosse.', check: st => ISLANDS.filter(il => il.boss || il.baseBoss).every(il => st.flags['boss_' + (il.boss || il.baseBoss)]) },
  { id: 'level_10', name: 'Erfahren', desc: 'Erreiche Level 10.', check: st => st.lvl >= 10 },
  { id: 'level_25', name: 'Veteran', desc: 'Erreiche Level 25.', check: st => st.lvl >= 25 },
  { id: 'level_50', name: 'Legende', desc: 'Erreiche Level 50.', check: st => st.lvl >= 50 },
  { id: 'bounty_1m', name: 'Gesuchter Pirat', desc: 'Erreiche 1.000.000 Berry Kopfgeld.', check: st => st.bounty >= 1000000 },
  { id: 'bounty_100m', name: 'Supernova', desc: 'Erreiche 100.000.000 Berry Kopfgeld.', check: st => st.bounty >= 100000000 },
  { id: 'bounty_1b', name: 'Kaiser der Meere', desc: 'Erreiche 1.000.000.000 Berry Kopfgeld.', check: st => st.bounty >= 1000000000 },
  { id: 'rich', name: 'Reeder', desc: 'Besitze 100.000 Berry gleichzeitig.', check: st => st.berries >= 100000 },
  { id: 'cartographer', name: 'Kartograph', desc: 'Entdecke alle Inseln der Welt.', check: st => ISLANDS.every(il => st.discovered[il.id]) },
  { id: 'haki_master', name: 'Meister aller Haki', desc: 'Erlerne Rüstungs-, Observations- und Königshaki.', check: st => st.haki.arm > 0 && st.haki.obs > 0 && st.haki.conq > 0 },
  { id: 'king', name: 'König der Piraten', desc: 'Beanspruche das One Piece.', check: st => !!st.flags.king },
];

// Piraten-Rang nach Kopfgeld: aufsteigende Titel, wie sie die Weltregierung vergeben würde.
// Der letzte Eintrag (König der Piraten) hängt nicht am Kopfgeld, sondern am King-Flag.
const BOUNTY_RANKS = [
  { min: 0, title: 'Unbekannter Pirat' },
  { min: 1000, title: 'Anfänger-Pirat' },
  { min: 1000000, title: 'Gesuchter Pirat' },
  { min: 10000000, title: 'Berüchtigter Pirat' },
  { min: 50000000, title: 'Gefürchteter Pirat' },
  { min: 100000000, title: 'Supernova' },
  { min: 300000000, title: 'Kronprätendent' },
  { min: 550000000, title: 'Warlord-Niveau' },
  { min: 1000000000, title: 'Kaiser der Meere' },
  { min: 3000000000, title: 'Legende der Neuen Welt' },
];
// Liefert den aktuellen Piraten-Rang (Index + Titel) für einen Spielstand.
function bountyRank(st) {
  if (st.flags && st.flags.king) return { idx: BOUNTY_RANKS.length, title: 'König der Piraten' };
  let idx = 0;
  for (let i = 0; i < BOUNTY_RANKS.length; i++) {
    if (st.bounty >= BOUNTY_RANKS[i].min) idx = i;
  }
  return { idx, title: BOUNTY_RANKS[idx].title };
}

// Teufelsfrüchte, die der Schwarzmarkt-Händler anbietet (rotierend)
const MERCHANT_PRICE = 60000;
const FRUIT_SELL_PRICE = 20000;

// =====================================================================
//  Weltgenerierung & Rendering
// =====================================================================
'use strict';

const World = {
  map: null,
  npcs: [],          // { x,y, island, def, bossId? }
  chests: [],        // { x,y, key, content }
  minimap: null,
};

// Deterministischer Hash-Noise (0..1)
function hashNoise(x, y, salt) {
  let h = (x * 374761393 + y * 668265263 + (salt || 0) * 1442695040 + WORLD_SEED * 40503) | 0;
  h = (h ^ (h >> 13)) | 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >> 16)) >>> 0;
  return h / 4294967295;
}

function idx(x, y) { return y * WORLD_W + x; }
function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return T.ROCK;
  return World.map[idx(x, y)];
}
function setTile(x, y, t) {
  if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return;
  World.map[idx(x, y)] = t;
}

// Küstenform: pro Insel 16 Winkel-Offsets, weich interpoliert
function coastFactor(island, angle) {
  if (!island._offs) {
    island._offs = [];
    for (let k = 0; k < 16; k++) island._offs.push(hashNoise(k, island.x, island.y));
  }
  const t = ((angle / (Math.PI * 2)) % 1 + 1) % 1 * 16;
  const i0 = Math.floor(t) % 16, i1 = (i0 + 1) % 16, f = t - Math.floor(t);
  const o = island._offs[i0] * (1 - f) + island._offs[i1] * f;
  return 0.78 + 0.26 * o;
}

function islandLandAt(island, x, y) {
  const dx = x - island.x, dy = y - island.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > island.r + 1) return 0;
  const f = coastFactor(island, Math.atan2(dy, dx));
  const landR = island.r * f;
  if (dist >= landR) return 0;
  return dist > landR - 2.4 ? 1 : 2; // 1 = Strand, 2 = Inland
}

function islandAt(x, y) {
  for (const il of ISLANDS) {
    const dx = x - il.x, dy = y - il.y;
    if (dx * dx + dy * dy <= (il.r + 2) * (il.r + 2)) return il;
  }
  return null;
}

function groundTile(biome) {
  return biome === 'snow' ? T.SNOW : biome === 'desert' ? T.DESERT : T.GRASS;
}

function genWorld() {
  const map = new Uint8Array(WORLD_W * WORLD_H);
  World.map = map;
  World.npcs = [];
  World.chests = [];

  // 1) Grund-Wasserzonen: Westblau seicht, ab x=186 Tiefsee
  for (let y = 0; y < WORLD_H; y++)
    for (let x = 0; x < WORLD_W; x++)
      map[idx(x, y)] = x >= 186 ? T.D : T.W;

  // 2) Sturmzonen um die Finalinseln
  for (const il of ISLANDS) {
    if (!il.storm) continue;
    const R = il.r + 12;
    for (let y = il.y - R; y <= il.y + R; y++)
      for (let x = il.x - R; x <= il.x + R; x++) {
        const dx = x - il.x, dy = y - il.y;
        if (dx * dx + dy * dy <= R * R) setTile(x, y, T.S);
      }
  }

  // 3) Seichter Hafenring um Grand-Line-Inseln (ohne Sturm-Inseln)
  for (const il of ISLANDS) {
    if (il.x < 186 || il.storm) continue;
    const R = il.r + 7;
    for (let y = il.y - R; y <= il.y + R; y++)
      for (let x = il.x - R; x <= il.x + R; x++) {
        const dx = x - il.x, dy = y - il.y;
        if (dx * dx + dy * dy <= R * R && tileAt(x, y) === T.D) setTile(x, y, T.W);
      }
  }

  // 4) Inseln stempeln
  for (const il of ISLANDS) {
    const g = groundTile(il.biome);
    for (let y = il.y - il.r - 1; y <= il.y + il.r + 1; y++)
      for (let x = il.x - il.r - 1; x <= il.x + il.r + 1; x++) {
        const land = islandLandAt(il, x, y);
        if (land === 1) setTile(x, y, T.SAND);
        else if (land === 2) setTile(x, y, g);
      }

    // Dorfmitte freiräumen
    for (let y = il.y - 2; y <= il.y + 2; y++)
      for (let x = il.x - 2; x <= il.x + 2; x++)
        if (islandLandAt(il, x, y)) setTile(x, y, T.PATH);

    // Bäume / Felsen / hohes Gras im Inland
    for (let y = il.y - il.r; y <= il.y + il.r; y++)
      for (let x = il.x - il.r; x <= il.x + il.r; x++) {
        if (tileAt(x, y) !== g) continue;
        const dx = x - il.x, dy = y - il.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 3.5) continue;
        const n1 = hashNoise(x, y, 7);
        const n2 = hashNoise(x, y, 13);
        if (n1 < 0.13) setTile(x, y, T.TREE);
        else if (n1 < 0.16) setTile(x, y, T.ROCK);
        else if (!il.noTall && n2 < 0.30) setTile(x, y, T.TALL);
      }

    // Häuser um die Dorfmitte
    if (il.npcs.length) {
      const hs = [[-2, -2], [2, -2], [-4, 0], [4, -1]];
      for (const [hx, hy] of hs) {
        const x = il.x + hx, y = il.y + hy;
        if (islandLandAt(il, x, y) === 2 && tileAt(x, y) !== T.PATH) setTile(x, y, T.HOUSE);
      }
      // Laden südöstlich der Mitte
      if (!il.noShop && il.id !== 'geisterschiff' && il.id !== 'laughtale' && il.id !== 'marineford') {
        setTile(il.x + 2, il.y + 2, T.SHOP);
        setTile(il.x + 2, il.y + 3, T.PATH);
      }
    }

    // Marinebasis (5x3 Block nördlich) + Boss an der Tür
    if (il.base) {
      for (let y = il.y - 7; y <= il.y - 5; y++)
        for (let x = il.x - 2; x <= il.x + 2; x++) setTile(x, y, T.BASE);
      setTile(il.x, il.y - 4, T.PATH);
      setTile(il.x, il.y - 3, T.PATH);
      const bossId = BASE_BOSSES[il.id];
      if (bossId) {
        World.npcs.push({
          x: il.x, y: il.y - 4, island: il,
          def: { type: 'boss', boss: bossId, name: BOSSES[bossId].name },
        });
      }
    }

    // Steg: vom Zentrum Richtung dockAngle bis ins Wasser, dann 4 Kacheln Steg
    const ca = Math.cos(il.dockAngle), sa = Math.sin(il.dockAngle);
    let px = il.x, py = il.y, steps = 0;
    while (steps < il.r + 4) {
      const nx = Math.round(il.x + ca * steps), ny = Math.round(il.y + sa * steps);
      if (WATER_TILES.has(tileAt(nx, ny))) { px = nx; py = ny; break; }
      if (tileAt(nx, ny) !== T.HOUSE && tileAt(nx, ny) !== T.BASE && tileAt(nx, ny) !== T.SHOP)
        setTile(nx, ny, T.PATH);
      steps++;
    }
    for (let d = 0; d < 4; d++) {
      const nx = Math.round(px + ca * d), ny = Math.round(py + sa * d);
      if (WATER_TILES.has(tileAt(nx, ny)) || tileAt(nx, ny) === T.DOCK) setTile(nx, ny, T.DOCK);
    }

    // NPCs platzieren (Boden freiräumen)
    for (const def of il.npcs) {
      const x = il.x + def.dx, y = il.y + def.dy;
      const t = tileAt(x, y);
      if (WATER_TILES.has(t) || t === T.TREE || t === T.ROCK || t === T.HOUSE || t === T.BASE || t === T.SHOP)
        setTile(x, y, T.PATH);
      // eine Nachbarkachel begehbar machen
      for (const [ax, ay] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const tt = tileAt(x + ax, y + ay);
        if (WALKABLE.has(tt)) break;
        if (tt === T.TREE || tt === T.ROCK || WATER_TILES.has(tt)) { setTile(x + ax, y + ay, T.PATH); break; }
      }
      World.npcs.push({ x, y, island: il, def });
    }

    // Truhen
    for (const ch of il.chests) {
      let x = il.x + ch.dx, y = il.y + ch.dy;
      // sicherstellen, dass die Truhe auf der Insel liegt
      let tries = 0;
      while (!islandLandAt(il, x, y) && tries < 12) {
        x = il.x + Math.round(ch.dx * (1 - tries * 0.12));
        y = il.y + Math.round(ch.dy * (1 - tries * 0.12));
        tries++;
      }
      setTile(x, y, T.CHEST);
      // Nachbarkachel freiräumen
      const below = tileAt(x, y + 1);
      if (below === T.TREE || below === T.ROCK || WATER_TILES.has(below)) setTile(x, y + 1, groundTile(il.biome));
      World.chests.push({ x, y, key: x + ',' + y, content: ch.content, island: il });
    }
  }

  buildMinimap();
}

function chestAt(x, y) { return World.chests.find(c => c.x === x && c.y === y); }
function npcAt(x, y, state) {
  return World.npcs.find(n => n.x === x && n.y === y && !npcHidden(n, state));
}
function npcHidden(n, state) {
  return n.def.type === 'crew' && state.crew.includes(n.def.crew);
}

// =====================================================================
//  Rendering
// =====================================================================
const TILE_COLORS = {
  [T.W]: '#2a7ab5', [T.D]: '#134a7c', [T.S]: '#2d2550',
  [T.SAND]: '#e8d28a', [T.GRASS]: '#58a758', [T.TALL]: '#3f8c46',
  [T.TREE]: '#58a758', [T.ROCK]: '#8d99ae', [T.HOUSE]: '#b5651d',
  [T.SHOP]: '#c8863c', [T.BASE]: '#9aa5b1', [T.DOCK]: '#a5713d',
  [T.PATH]: '#d9c08a', [T.SNOW]: '#e8eef5', [T.DESERT]: '#dfc07a',
  [T.CHEST]: '#58a758', [T.CHEST_OPEN]: '#58a758',
};

function drawTile(c, t, sx, sy, wx, wy, time) {
  c.fillStyle = TILE_COLORS[t] || '#000';
  c.fillRect(sx, sy, TS, TS);
  const n = hashNoise(wx, wy, 3);

  switch (t) {
    case T.W: case T.D: case T.S: {
      // animierte Wellen
      const ph = Math.floor(time / 600 + n * 4) % 4;
      if ((wx + wy) % 3 === ph % 3) {
        c.fillStyle = t === T.S ? 'rgba(160,140,220,0.35)' : 'rgba(255,255,255,0.25)';
        c.fillRect(sx + 6 + (ph % 2) * 10, sy + 12 + (ph > 1 ? 8 : 0), 12, 2);
      }
      if (t === T.S && n < 0.08) { // Blitz-Funken in Sturmsee
        c.fillStyle = 'rgba(255,255,160,0.5)';
        c.fillRect(sx + 14, sy + 4, 2, 8);
      }
      break;
    }
    case T.SAND: case T.DESERT:
      if (n < 0.3) { c.fillStyle = 'rgba(0,0,0,0.07)'; c.fillRect(sx + (n * 80) % 24, sy + (n * 130) % 24, 3, 3); }
      break;
    case T.GRASS: case T.SNOW:
      if (n < 0.25) {
        c.fillStyle = t === T.SNOW ? 'rgba(180,200,230,0.6)' : 'rgba(0,0,0,0.10)';
        c.fillRect(sx + (n * 90) % 26, sy + (n * 140) % 26, 4, 2);
      }
      break;
    case T.TALL:
      c.fillStyle = '#2f7038';
      for (let i = 0; i < 4; i++)
        c.fillRect(sx + 3 + i * 8, sy + 8 + ((i + wx) % 2) * 4, 4, TS - 12);
      break;
    case T.TREE: {
      c.fillStyle = '#6b4423'; c.fillRect(sx + 13, sy + 18, 6, 12);
      c.fillStyle = '#2f7038'; c.beginPath(); c.arc(sx + 16, sy + 12, 12, 0, 7); c.fill();
      c.fillStyle = '#3f8c46'; c.beginPath(); c.arc(sx + 12, sy + 9, 7, 0, 7); c.fill();
      break;
    }
    case T.ROCK:
      c.fillStyle = TILE_COLORS[islandAt(wx, wy) ? groundTile(islandAt(wx, wy).biome) : T.GRASS];
      c.fillRect(sx, sy, TS, TS);
      c.fillStyle = '#6c757d'; c.beginPath(); c.arc(sx + 16, sy + 18, 11, 0, 7); c.fill();
      c.fillStyle = '#8d99ae'; c.beginPath(); c.arc(sx + 12, sy + 14, 6, 0, 7); c.fill();
      break;
    case T.HOUSE:
      c.fillStyle = '#8a5a2b'; c.fillRect(sx + 2, sy + 12, TS - 4, TS - 12);
      c.fillStyle = '#d62828';
      c.beginPath(); c.moveTo(sx, sy + 13); c.lineTo(sx + 16, sy + 1); c.lineTo(sx + 32, sy + 13); c.fill();
      c.fillStyle = '#4a2e13'; c.fillRect(sx + 13, sy + 20, 7, 12);
      break;
    case T.SHOP:
      c.fillStyle = '#8a5a2b'; c.fillRect(sx + 2, sy + 10, TS - 4, TS - 10);
      c.fillStyle = '#2a9d8f'; c.fillRect(sx, sy + 4, TS, 8);
      c.fillStyle = '#fff'; c.font = 'bold 9px monospace'; c.fillText('SHOP', sx + 5, sy + 11);
      c.fillStyle = '#4a2e13'; c.fillRect(sx + 13, sy + 20, 7, 12);
      break;
    case T.BASE:
      c.fillStyle = '#7a8794'; c.fillRect(sx + 1, sy + 1, TS - 2, TS - 2);
      c.fillStyle = '#5c6773'; c.fillRect(sx + 4, sy + 4, 8, 8); c.fillRect(sx + 20, sy + 16, 8, 8);
      break;
    case T.DOCK:
      c.fillStyle = '#2a7ab5'; c.fillRect(sx, sy, TS, TS);
      c.fillStyle = '#a5713d'; c.fillRect(sx + 2, sy, TS - 4, TS);
      c.fillStyle = '#7a4a1d'; c.fillRect(sx + 2, sy + 8, TS - 4, 2); c.fillRect(sx + 2, sy + 20, TS - 4, 2);
      break;
    case T.CHEST: case T.CHEST_OPEN: {
      const il = islandAt(wx, wy);
      c.fillStyle = TILE_COLORS[il ? groundTile(il.biome) : T.GRASS];
      c.fillRect(sx, sy, TS, TS);
      c.fillStyle = t === T.CHEST ? '#8a5a2b' : '#5a3a1a';
      c.fillRect(sx + 6, sy + 10, 20, 16);
      c.fillStyle = '#ffd166'; c.fillRect(sx + 6, sy + 14, 20, 3);
      c.fillRect(sx + 14, sy + 12, 4, 6);
      if (t === T.CHEST_OPEN) { c.fillStyle = '#222'; c.fillRect(sx + 8, sy + 12, 16, 6); }
      break;
    }
  }
}

// ---- Figuren zeichnen (16x18-Raster, Skalierung s) ----
function drawChar(c, x, y, s, look, dir, step) {
  const u = s; // eine Rastereinheit in px
  const legOff = step ? 1 : 0;
  // Beine
  c.fillStyle = look.pants || '#333';
  c.fillRect(x + 4 * u, y + (14 + legOff) * u, 3 * u, (4 - legOff) * u);
  c.fillRect(x + 9 * u, y + (14 + (step ? 0 : 1)) * u, 3 * u, (4 - (step ? 0 : 1)) * u);
  // Körper
  c.fillStyle = look.shirt;
  c.fillRect(x + 3 * u, y + 9 * u, 10 * u, 5 * u);
  // Arme
  c.fillStyle = look.skin;
  c.fillRect(x + 1.5 * u, y + 9.5 * u, 2 * u, 4 * u);
  c.fillRect(x + 12.5 * u, y + 9.5 * u, 2 * u, 4 * u);
  // Kopf
  c.fillStyle = look.skin;
  c.fillRect(x + 3.5 * u, y + 2 * u, 9 * u, 7 * u);
  // Haare
  c.fillStyle = look.hair;
  if (look.style === 0) { // kurz
    c.fillRect(x + 3.5 * u, y + 1.2 * u, 9 * u, 2.4 * u);
  } else if (look.style === 1) { // stachelig
    c.fillRect(x + 3.5 * u, y + 1.5 * u, 9 * u, 2 * u);
    for (let i = 0; i < 4; i++) c.fillRect(x + (4 + i * 2.3) * u, y + 0.2 * u, 1.4 * u, 1.6 * u);
  } else { // lang
    c.fillRect(x + 3.5 * u, y + 1.2 * u, 9 * u, 2.4 * u);
    c.fillRect(x + 2.6 * u, y + 2 * u, 1.6 * u, 7.5 * u);
    c.fillRect(x + 11.8 * u, y + 2 * u, 1.6 * u, 7.5 * u);
  }
  // Gesicht (nicht bei Rückenansicht)
  if (dir !== 'up') {
    c.fillStyle = '#222';
    const eyeY = y + 5 * u;
    if (dir === 'left') { c.fillRect(x + 4.5 * u, eyeY, 1.5 * u, 1.5 * u); c.fillRect(x + 8 * u, eyeY, 1.5 * u, 1.5 * u); }
    else if (dir === 'right') { c.fillRect(x + 7 * u, eyeY, 1.5 * u, 1.5 * u); c.fillRect(x + 10.5 * u, eyeY, 1.5 * u, 1.5 * u); }
    else { c.fillRect(x + 5.5 * u, eyeY, 1.5 * u, 1.5 * u); c.fillRect(x + 9 * u, eyeY, 1.5 * u, 1.5 * u); }
  } else {
    c.fillStyle = look.hair;
    c.fillRect(x + 3.5 * u, y + 2 * u, 9 * u, 4 * u);
  }
  // Strohhut
  if (look.hat) {
    c.fillStyle = '#e8c468';
    c.beginPath(); c.ellipse(x + 8 * u, y + 2.2 * u, 7.5 * u, 2.2 * u, 0, 0, 7); c.fill();
    c.fillRect(x + 4.5 * u, y - 1.5 * u, 7 * u, 3.5 * u);
    c.fillStyle = '#d62828';
    c.fillRect(x + 4.5 * u, y + 1 * u, 7 * u, 1.2 * u);
  }
}

// ---- Schiff zeichnen ----
function drawShip(c, x, y, shipLvl, time) {
  const bob = Math.sin(time / 400) * 2;
  y += bob;
  if (shipLvl >= 3) { // Thousand Sunny
    c.fillStyle = '#e8c468'; c.fillRect(x - 6, y + 16, 44, 14);
    c.fillStyle = '#d62828'; c.fillRect(x - 6, y + 26, 44, 4);
    c.fillStyle = '#8a5a2b'; c.fillRect(x + 14, y - 6, 3, 24);
    c.fillStyle = '#fff'; c.fillRect(x + 3, y - 6, 11, 14); c.fillRect(x + 18, y - 6, 11, 14);
    c.fillStyle = '#f4a10c'; c.beginPath(); c.arc(x - 6, y + 20, 6, 0, 7); c.fill();
  } else if (shipLvl === 2) { // Going Merry
    c.fillStyle = '#c8a06a'; c.fillRect(x - 4, y + 16, 40, 13);
    c.fillStyle = '#8a5a2b'; c.fillRect(x + 14, y - 6, 3, 24);
    c.fillStyle = '#fff'; c.fillRect(x + 4, y - 6, 10, 13); c.fillRect(x + 18, y - 6, 10, 13);
    c.fillStyle = '#f5f5f5'; c.beginPath(); c.arc(x - 4, y + 19, 5, 0, 7); c.fill();
  } else { // Beiboot
    c.fillStyle = '#8a5a2b';
    c.beginPath(); c.moveTo(x - 2, y + 18); c.lineTo(x + 34, y + 18);
    c.lineTo(x + 28, y + 28); c.lineTo(x + 4, y + 28); c.fill();
    c.fillStyle = '#6b4423'; c.fillRect(x + 14, y + 2, 3, 17);
    c.fillStyle = '#f5f5f5'; c.fillRect(x + 17, y + 2, 12, 11);
  }
}

// ---- Gegner-Sprites im Kampf ----
const ENEMY_LOOKS = {
  bandit: LOOKS.bandit, marine: LOOKS.marine, pirate: LOOKS.pirate, hunter: LOOKS.hunter,
};
function drawEnemySprite(c, cx, cy, sprite, time) {
  const bob = Math.sin(time / 350) * 3;
  if (sprite === 'seaking') {
    c.fillStyle = '#2a6a4a';
    for (let i = 0; i < 5; i++) {
      const r = 34 - i * 4;
      c.beginPath(); c.arc(cx - 60 + i * 34, cy + 40 - i * 26 + bob * (i % 2 ? 1 : -1), r, 0, 7); c.fill();
    }
    c.fillStyle = '#3f8c5c'; c.beginPath(); c.arc(cx + 76, cy - 64 + bob, 30, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(cx + 66, cy - 72 + bob, 7, 0, 7); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(cx + 66, cy - 72 + bob, 3.5, 0, 7); c.fill();
    c.fillStyle = '#e8d28a';
    for (let i = 0; i < 3; i++) c.fillRect(cx + 58 + i * 10, cy - 48 + bob, 6, 10);
  } else if (sprite === 'ship') {
    c.fillStyle = '#5c6773'; c.fillRect(cx - 70, cy + 10 + bob, 140, 34);
    c.fillStyle = '#8d99ae'; c.fillRect(cx - 70, cy + 10 + bob, 140, 6);
    c.fillStyle = '#4a3a2a'; c.fillRect(cx - 4, cy - 70 + bob, 6, 84);
    c.fillStyle = '#e9edf5'; c.fillRect(cx - 44, cy - 66 + bob, 40, 44); c.fillRect(cx + 8, cy - 66 + bob, 40, 44);
    c.fillStyle = '#2a4a8a'; c.font = 'bold 22px monospace'; c.fillText('MARINE', cx - 42, cy - 38 + bob);
    c.fillStyle = '#333';
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(cx - 40 + i * 40, cy + 28 + bob, 7, 0, 7); c.fill(); }
  } else {
    const look = ENEMY_LOOKS[sprite] || LOOKS.pirate;
    drawChar(c, cx - 48, cy - 60 + bob, 6, look, 'down', Math.floor(time / 500) % 2);
  }
}

// ---- Minimap ----
const MINI_COLORS = {
  [T.W]: '#2a7ab5', [T.D]: '#134a7c', [T.S]: '#3a2a55',
  [T.SAND]: '#e8d28a', [T.GRASS]: '#4f9e4f', [T.TALL]: '#3f8c46',
  [T.TREE]: '#2f7038', [T.ROCK]: '#8d99ae', [T.HOUSE]: '#d62828',
  [T.SHOP]: '#2a9d8f', [T.BASE]: '#9aa5b1', [T.DOCK]: '#a5713d',
  [T.PATH]: '#d9c08a', [T.SNOW]: '#eef2f8', [T.DESERT]: '#dfc07a',
  [T.CHEST]: '#ffd166', [T.CHEST_OPEN]: '#8a6a2b',
};
function buildMinimap() {
  const cv = document.createElement('canvas');
  cv.width = WORLD_W; cv.height = WORLD_H;
  const c = cv.getContext('2d');
  const img = c.createImageData(WORLD_W, WORLD_H);
  for (let y = 0; y < WORLD_H; y++)
    for (let x = 0; x < WORLD_W; x++) {
      const col = MINI_COLORS[World.map[idx(x, y)]] || '#000';
      const r = parseInt(col.slice(1, 3), 16), g = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
      const p = (y * WORLD_W + x) * 4;
      img.data[p] = r; img.data[p + 1] = g; img.data[p + 2] = b; img.data[p + 3] = 255;
    }
  c.putImageData(img, 0, 0);
  World.minimap = cv;
}

// ---- Weltszene zeichnen ----
function drawWorld(c, G, time) {
  const st = G.state;
  const viewW = 960, viewH = 640;
  let camX = G.px + TS / 2 - viewW / 2;
  let camY = G.py + TS / 2 - viewH / 2;
  camX = Math.max(0, Math.min(WORLD_W * TS - viewW, camX));
  camY = Math.max(0, Math.min(WORLD_H * TS - viewH, camY));

  const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
  const x1 = Math.min(WORLD_W - 1, x0 + Math.ceil(viewW / TS) + 1);
  const y1 = Math.min(WORLD_H - 1, y0 + Math.ceil(viewH / TS) + 1);

  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      drawTile(c, tileAt(x, y), Math.round(x * TS - camX), Math.round(y * TS - camY), x, y, time);

  // NPCs
  for (const n of World.npcs) {
    if (n.x < x0 - 1 || n.x > x1 + 1 || n.y < y0 - 1 || n.y > y1 + 1) continue;
    if (npcHidden(n, st)) continue;
    const sx = n.x * TS - camX, sy = n.y * TS - camY;
    const look = n.def.look ? LOOKS[n.def.look] :
      (n.def.type === 'boss' ? ENEMY_LOOKS[BOSSES[n.def.boss].sprite] || LOOKS.pirate : LOOKS.villager1);
    drawChar(c, sx + 2, sy - 4, 1.75, look, 'down', 0);
    // Boss-Ausrufezeichen, wenn noch nicht besiegt
    if (n.def.type === 'boss' && !st.flags['boss_' + n.def.boss]) {
      c.fillStyle = '#d62828'; c.font = 'bold 16px monospace';
      c.fillText('!', sx + 13, sy - 8);
    }
  }

  // Crew läuft hinterher
  if (!st.onShip) {
    for (let i = 0; i < st.crew.length; i++) {
      const pos = G.trail[i];
      if (!pos) break;
      const sx = pos.x * TS - camX, sy = pos.y * TS - camY;
      const look = LOOKS[CREW[st.crew[i]].look];
      drawChar(c, sx + 2, sy - 4, 1.75, look, pos.dir || 'down', G.walkFrame);
    }
  }

  // Spieler (+ Schiff)
  const psx = G.px - camX, psy = G.py - camY;
  if (st.onShip) {
    drawShip(c, psx, psy, st.ship, time);
    drawChar(c, psx + 4, psy - 10, 1.4, st.look, st.facing, 0);
  } else {
    drawChar(c, psx + 2, psy - 4, 1.75, st.look, st.facing, G.moving ? G.walkFrame : 0);
  }
}

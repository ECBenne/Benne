// =====================================================================
//  Weltgenerierung & Rendering (weiche, moderne 2D-Grafik)
// =====================================================================
'use strict';

const World = {
  map: null,
  npcs: [],
  chests: [],
  minimap: null,
};

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
function tileAtPx(px, py) { return tileAt(Math.floor(px / TS), Math.floor(py / TS)); }

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
  return dist > landR - 2.4 ? 1 : 2;
}

function islandAt(x, y) {
  for (const il of ISLANDS) {
    const dx = x - il.x, dy = y - il.y;
    if (dx * dx + dy * dy <= (il.r + 2) * (il.r + 2)) return il;
  }
  return null;
}

function genWorld() {
  const map = new Uint8Array(WORLD_W * WORLD_H);
  World.map = map;
  World.npcs = [];
  World.chests = [];

  // 1) Meereszonen: Eastblue seicht, Paradies tief, Neue Welt Sturm
  for (let y = 0; y < WORLD_H; y++)
    for (let x = 0; x < WORLD_W; x++)
      map[idx(x, y)] = x >= NEWWORLD_X ? T.S : x >= PARADISE_X ? T.D : T.W;

  // 2) Seichter Hafenring um alle Grand-Line-/Neue-Welt-Inseln
  for (const il of ISLANDS) {
    if (il.x + il.r < PARADISE_X) continue;
    const R = il.r + 6;
    for (let y = il.y - R; y <= il.y + R; y++)
      for (let x = il.x - R; x <= il.x + R; x++) {
        const dx = x - il.x, dy = y - il.y;
        if (dx * dx + dy * dy <= R * R && WATER_TILES.has(tileAt(x, y))) setTile(x, y, T.W);
      }
  }

  // 3) Inseln stempeln
  for (const il of ISLANDS) {
    for (let y = il.y - il.r - 1; y <= il.y + il.r + 1; y++)
      for (let x = il.x - il.r - 1; x <= il.x + il.r + 1; x++) {
        const land = islandLandAt(il, x, y);
        if (land === 1) setTile(x, y, T.SAND);
        else if (land === 2) setTile(x, y, T.GRASS);
      }

    // Dorfmitte
    for (let y = il.y - 2; y <= il.y + 2; y++)
      for (let x = il.x - 2; x <= il.x + 2; x++)
        if (islandLandAt(il, x, y)) setTile(x, y, T.PATH);

    // Vegetation
    for (let y = il.y - il.r; y <= il.y + il.r; y++)
      for (let x = il.x - il.r; x <= il.x + il.r; x++) {
        if (tileAt(x, y) !== T.GRASS) continue;
        const dx = x - il.x, dy = y - il.y;
        if (Math.sqrt(dx * dx + dy * dy) < 3.5) continue;
        const n1 = hashNoise(x, y, 7);
        const n2 = hashNoise(x, y, 13);
        if (n1 < 0.12) setTile(x, y, T.TREE);
        else if (n1 < 0.15) setTile(x, y, T.ROCK);
        else if (!il.noTall && n2 < 0.26) setTile(x, y, T.TALL);
      }

    // Häuser & Laden
    if (il.npcs.length) {
      for (const [hx, hy] of [[-2, -2], [2, -2], [-4, 0], [4, -1]]) {
        const x = il.x + hx, y = il.y + hy;
        if (islandLandAt(il, x, y) === 2 && tileAt(x, y) !== T.PATH) setTile(x, y, T.HOUSE);
      }
      if (il.npcs.some(n => n.type === 'inn')) {
        setTile(il.x + 2, il.y + 2, T.SHOP);
        setTile(il.x + 2, il.y + 3, T.PATH);
      }
    }

    // Marinebasis
    if (il.base) {
      for (let y = il.y - 7; y <= il.y - 5; y++)
        for (let x = il.x - 2; x <= il.x + 2; x++) setTile(x, y, T.BASE);
      setTile(il.x, il.y - 4, T.PATH);
      setTile(il.x, il.y - 3, T.PATH);
    }

    // Steg
    const ca = Math.cos(il.dockAngle), sa = Math.sin(il.dockAngle);
    let px = il.x, py = il.y, steps = 0;
    while (steps < il.r + 4) {
      const nx = Math.round(il.x + ca * steps), ny = Math.round(il.y + sa * steps);
      if (WATER_TILES.has(tileAt(nx, ny))) { px = nx; py = ny; break; }
      const t = tileAt(nx, ny);
      if (t !== T.HOUSE && t !== T.BASE && t !== T.SHOP) setTile(nx, ny, T.PATH);
      steps++;
    }
    for (let d = 0; d < 4; d++) {
      const nx = Math.round(px + ca * d), ny = Math.round(py + sa * d);
      if (WATER_TILES.has(tileAt(nx, ny)) || tileAt(nx, ny) === T.DOCK) setTile(nx, ny, T.DOCK);
    }

    // NPCs
    for (const def of il.npcs) {
      const x = il.x + def.dx, y = il.y + def.dy;
      const t = tileAt(x, y);
      if (WATER_TILES.has(t) || t === T.TREE || t === T.ROCK || t === T.HOUSE || t === T.BASE || t === T.SHOP)
        setTile(x, y, T.PATH);
      World.npcs.push({ x, y, island: il, def });
    }

    // Boss-Freifläche (Bosse spawnen als Gegner-Entities, brauchen Platz)
    if (il.boss && il.bossPos) {
      const bx = il.x + il.bossPos.dx, by = il.y + il.bossPos.dy;
      for (let y = by - 1; y <= by + 1; y++)
        for (let x = bx - 1; x <= bx + 1; x++) {
          const t = tileAt(x, y);
          if (t === T.TREE || t === T.ROCK || WATER_TILES.has(t) || t === T.HOUSE) setTile(x, y, T.GRASS);
        }
    }

    // Truhen
    for (const ch of il.chests) {
      let x = il.x + ch.dx, y = il.y + ch.dy;
      let tries = 0;
      while (!islandLandAt(il, x, y) && tries < 12) {
        x = il.x + Math.round(ch.dx * (1 - tries * 0.12));
        y = il.y + Math.round(ch.dy * (1 - tries * 0.12));
        tries++;
      }
      setTile(x, y, T.CHEST);
      const below = tileAt(x, y + 1);
      if (below === T.TREE || below === T.ROCK || WATER_TILES.has(below)) setTile(x, y + 1, T.GRASS);
      World.chests.push({ x, y, key: x + ',' + y, content: ch.content, island: il });
    }
  }

  buildMinimap();
}

function chestAt(x, y) { return World.chests.find(c => c.x === x && c.y === y); }
function npcHidden(n, state) {
  return n.def.type === 'crew' && state.crew.includes(n.def.crew);
}

// =====================================================================
//  Biome & Farben
// =====================================================================
const BIOMES = {
  grass:  { ground: '#5cb464', tall: '#47a04f', sand: '#eedc9e', canopy: '#2e8b47', canopy2: '#43aa5c', trunk: '#7a5230' },
  snow:   { ground: '#e9f0f7', tall: '#c9dcec', sand: '#dde7ef', canopy: '#2f5d46', canopy2: '#3d7458', trunk: '#5c4632' },
  desert: { ground: '#e3bd7a', tall: '#cfa55e', sand: '#f1ddae', canopy: '#4f9e58', canopy2: '#66b46e', trunk: '#9a7040' },
  sky:    { ground: '#f1ead3', tall: '#e0d6b4', sand: '#fbf7ea', canopy: '#d9c47e', canopy2: '#e8d694', trunk: '#b09250' },
  sakura: { ground: '#7cc17e', tall: '#63ad6b', sand: '#eedc9e', canopy: '#ef9fc4', canopy2: '#f7bcd6', trunk: '#7a5230' },
  dark:   { ground: '#5f7a62', tall: '#4c6650', sand: '#cfc49e', canopy: '#31473a', canopy2: '#3e5847', trunk: '#4a3a2e' },
  coral:  { ground: '#79c3a7', tall: '#5fb195', sand: '#f2ddb5', canopy: '#e77fa2', canopy2: '#f19cb8', trunk: '#c8b090' },
};
function biomeOf(x, y) {
  const il = islandAt(x, y);
  return BIOMES[il && il.biome || 'grass'];
}

const WATER_COLORS = {
  [T.W]: '#3a9fd6',
  [T.D]: '#1c67a0',
  [T.S]: '#282650',
};

// =====================================================================
//  Kachel-Rendering
// =====================================================================
function drawTile(c, t, sx, sy, wx, wy, time) {
  const n = hashNoise(wx, wy, 3);

  if (WATER_TILES.has(t)) {
    c.fillStyle = WATER_COLORS[t];
    c.fillRect(sx, sy, TS, TS);
    // sehr subtile Flächenvariation
    if (n > 0.72) {
      c.fillStyle = 'rgba(255,255,255,0.045)';
      c.fillRect(sx, sy, TS, TS);
    } else if (n < 0.18) {
      c.fillStyle = 'rgba(0,20,50,0.05)';
      c.fillRect(sx, sy, TS, TS);
    }
    // sanfte Wellenbögen
    const ph = (time / 1400 + n * 6.28);
    if (n > 0.42 && n < 0.58) {
      const off = Math.sin(ph) * 5;
      c.strokeStyle = t === T.S ? 'rgba(150,130,220,0.25)' : 'rgba(255,255,255,0.20)';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(sx + 16 + off, sy + 20, 9, Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
    }
    if (t === T.S && n > 0.965) { // Blitzfunken in der Sturmsee
      const fl = Math.sin(time / 90 + n * 40) > 0.6;
      if (fl) { c.fillStyle = 'rgba(255,245,170,0.7)'; c.fillRect(sx + 14, sy + 4, 3, 12); }
    }
    return;
  }

  const B = biomeOf(wx, wy);

  // Landkacheln mit weichen Kanten (überlappende runde Ecken)
  const ground =
    t === T.SAND ? B.sand :
    t === T.PATH ? '#dcc491' :
    t === T.DOCK ? '#a5713d' :
    B.ground;

  c.fillStyle = ground;
  c.beginPath();
  c.roundRect(sx - 2, sy - 2, TS + 4, TS + 4, 7);
  c.fill();

  switch (t) {
    case T.GRASS:
      if (n < 0.3) {
        c.fillStyle = 'rgba(0,0,0,0.06)';
        c.beginPath(); c.ellipse(sx + 8 + n * 40, sy + 10 + n * 30, 5, 2.5, 0, 0, 7); c.fill();
      }
      break;
    case T.TALL: {
      c.fillStyle = B.tall;
      const sway = Math.sin(time / 700 + wx * 1.7 + wy) * 2;
      for (let i = 0; i < 3; i++) {
        const bx = sx + 5 + i * 10;
        c.beginPath();
        c.moveTo(bx, sy + 28);
        c.quadraticCurveTo(bx + 3 + sway, sy + 12, bx + 5 + sway, sy + 5);
        c.quadraticCurveTo(bx + 7 + sway, sy + 12, bx + 9, sy + 28);
        c.fill();
      }
      break;
    }
    case T.TREE: {
      c.fillStyle = 'rgba(0,0,0,0.18)';
      c.beginPath(); c.ellipse(sx + 16, sy + 27, 12, 4.5, 0, 0, 7); c.fill();
      c.fillStyle = B.trunk;
      c.beginPath(); c.roundRect(sx + 13, sy + 15, 6, 13, 3); c.fill();
      c.fillStyle = B.canopy;
      c.beginPath(); c.arc(sx + 16, sy + 10, 12, 0, 7); c.fill();
      c.fillStyle = B.canopy2;
      c.beginPath(); c.arc(sx + 11, sy + 7, 7, 0, 7); c.fill();
      break;
    }
    case T.ROCK:
      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.beginPath(); c.ellipse(sx + 16, sy + 24, 12, 4, 0, 0, 7); c.fill();
      c.fillStyle = '#96a1b0';
      c.beginPath(); c.arc(sx + 16, sy + 17, 10, 0, 7); c.fill();
      c.fillStyle = '#aeb9c6';
      c.beginPath(); c.arc(sx + 12, sy + 13, 5.5, 0, 7); c.fill();
      break;
    case T.HOUSE: {
      c.fillStyle = 'rgba(0,0,0,0.18)';
      c.beginPath(); c.ellipse(sx + 16, sy + 30, 15, 4, 0, 0, 7); c.fill();
      c.fillStyle = '#a1683a';
      c.beginPath(); c.roundRect(sx + 3, sy + 12, 26, 18, 3); c.fill();
      c.fillStyle = '#d84c3e';
      c.beginPath();
      c.moveTo(sx - 1, sy + 14); c.lineTo(sx + 16, sy + 1); c.lineTo(sx + 33, sy + 14);
      c.closePath(); c.fill();
      c.fillStyle = '#5b3a1e';
      c.beginPath(); c.roundRect(sx + 13, sy + 20, 7, 10, 2); c.fill();
      c.fillStyle = '#ffe9a8';
      c.beginPath(); c.roundRect(sx + 6, sy + 16, 5, 5, 1.5); c.fill();
      break;
    }
    case T.SHOP: {
      c.fillStyle = 'rgba(0,0,0,0.18)';
      c.beginPath(); c.ellipse(sx + 16, sy + 30, 15, 4, 0, 0, 7); c.fill();
      c.fillStyle = '#a1683a';
      c.beginPath(); c.roundRect(sx + 3, sy + 10, 26, 20, 3); c.fill();
      c.fillStyle = '#2a9d8f';
      c.beginPath(); c.roundRect(sx + 1, sy + 4, 30, 8, 3); c.fill();
      c.fillStyle = '#fff';
      c.font = 'bold 8px sans-serif';
      c.fillText('SHOP', sx + 6, sy + 10.5);
      c.fillStyle = '#5b3a1e';
      c.beginPath(); c.roundRect(sx + 13, sy + 20, 7, 10, 2); c.fill();
      break;
    }
    case T.BASE:
      c.fillStyle = '#8593a3';
      c.beginPath(); c.roundRect(sx - 1, sy - 1, TS + 2, TS + 2, 4); c.fill();
      c.fillStyle = '#6d7c8c';
      c.beginPath(); c.roundRect(sx + 4, sy + 4, 9, 9, 2); c.fill();
      c.beginPath(); c.roundRect(sx + 19, sy + 16, 9, 9, 2); c.fill();
      break;
    case T.DOCK:
      c.fillStyle = '#8a5c30';
      c.fillRect(sx + 2, sy + 7, TS - 4, 2.5);
      c.fillRect(sx + 2, sy + 19, TS - 4, 2.5);
      c.fillStyle = 'rgba(0,0,0,0.10)';
      c.fillRect(sx, sy + 29, TS, 3);
      break;
    case T.CHEST: case T.CHEST_OPEN: {
      c.fillStyle = B.ground;
      c.beginPath(); c.roundRect(sx - 2, sy - 2, TS + 4, TS + 4, 7); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.18)';
      c.beginPath(); c.ellipse(sx + 16, sy + 27, 12, 4, 0, 0, 7); c.fill();
      c.fillStyle = t === T.CHEST ? '#9a6a34' : '#6a4622';
      c.beginPath(); c.roundRect(sx + 6, sy + 10, 20, 17, 4); c.fill();
      c.fillStyle = '#ffd166';
      c.fillRect(sx + 6, sy + 15, 20, 3);
      c.beginPath(); c.roundRect(sx + 13.5, sy + 13, 5, 7, 2); c.fill();
      if (t === T.CHEST_OPEN) {
        c.fillStyle = '#241a10';
        c.beginPath(); c.roundRect(sx + 8, sy + 12, 16, 6, 2); c.fill();
      }
      break;
    }
  }
}

// =====================================================================
//  Figuren (weich gerundet)
// =====================================================================
function drawChar(c, cx, cy, s, look, dir, walk) {
  // cx,cy = Fußpunkt-Mitte; s = Skalierung (1 = 26px hoch)
  const u = s;
  const bob = walk ? Math.sin(performance.now() / 90) * 1.5 * u : 0;
  // Schatten
  c.fillStyle = 'rgba(0,0,0,0.22)';
  c.beginPath(); c.ellipse(cx, cy, 8 * u, 3 * u, 0, 0, 7); c.fill();

  const top = cy - 24 * u + bob;
  // Beine
  const legSpread = walk ? Math.sin(performance.now() / 90) * 2.4 * u : 0;
  c.fillStyle = look.pants || '#31456b';
  c.beginPath(); c.roundRect(cx - 5 * u + legSpread, cy - 8 * u, 4 * u, 8 * u, 2 * u); c.fill();
  c.beginPath(); c.roundRect(cx + 1 * u - legSpread, cy - 8 * u, 4 * u, 8 * u, 2 * u); c.fill();
  // Körper
  c.fillStyle = look.shirt;
  c.beginPath(); c.roundRect(cx - 6 * u, top + 10 * u, 12 * u, 8.5 * u, 3.5 * u); c.fill();
  // Arme
  c.fillStyle = look.skin;
  c.beginPath(); c.roundRect(cx - 8.5 * u, top + 11 * u, 3 * u, 6 * u, 1.5 * u); c.fill();
  c.beginPath(); c.roundRect(cx + 5.5 * u, top + 11 * u, 3 * u, 6 * u, 1.5 * u); c.fill();
  // Kopf
  c.fillStyle = look.skin;
  c.beginPath(); c.arc(cx, top + 5.5 * u, 6 * u, 0, 7); c.fill();
  // Haare
  c.fillStyle = look.hair;
  if (dir === 'up') {
    c.beginPath(); c.arc(cx, top + 5.5 * u, 6 * u, 0, 7); c.fill();
  } else if (look.style === 0) {
    c.beginPath(); c.arc(cx, top + 4.6 * u, 6 * u, Math.PI, 0); c.fill();
  } else if (look.style === 1) {
    c.beginPath(); c.arc(cx, top + 4.6 * u, 6 * u, Math.PI, 0); c.fill();
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(cx + i * 2.4 * u - 1.2 * u, top + 1.4 * u);
      c.lineTo(cx + i * 2.4 * u, top - 2.6 * u);
      c.lineTo(cx + i * 2.4 * u + 1.2 * u, top + 1.4 * u);
      c.closePath(); c.fill();
    }
  } else {
    c.beginPath(); c.arc(cx, top + 4.6 * u, 6 * u, Math.PI, 0); c.fill();
    c.beginPath(); c.roundRect(cx - 6.5 * u, top + 4 * u, 2.6 * u, 11 * u, 1.3 * u); c.fill();
    c.beginPath(); c.roundRect(cx + 3.9 * u, top + 4 * u, 2.6 * u, 11 * u, 1.3 * u); c.fill();
  }
  // Gesicht
  if (dir !== 'up') {
    c.fillStyle = '#26262e';
    const ey = top + 6 * u;
    const eo = dir === 'left' ? -1.6 * u : dir === 'right' ? 1.6 * u : 0;
    c.beginPath(); c.arc(cx - 2 * u + eo, ey, 0.9 * u, 0, 7); c.fill();
    c.beginPath(); c.arc(cx + 2 * u + eo, ey, 0.9 * u, 0, 7); c.fill();
  }
  // Strohhut
  if (look.hat) {
    c.fillStyle = '#eac86a';
    c.beginPath(); c.ellipse(cx, top + 1.6 * u, 8.5 * u, 3 * u, 0, 0, 7); c.fill();
    c.beginPath(); c.arc(cx, top + 0.6 * u, 4.6 * u, Math.PI, 0); c.fill();
    c.fillStyle = '#d63a3a';
    c.beginPath(); c.roundRect(cx - 4.6 * u, top - 0.4 * u, 9.2 * u, 1.8 * u, 0.9 * u); c.fill();
  }
}

// ---- Schiff (Draufsicht/Seitenmix, weich) ----
function drawShipTop(c, cx, cy, shipLvl, time, enemy) {
  const bob = Math.sin(time / 420 + cx * 0.01) * 2.5;
  const y = cy + bob;

  // Beiboot: kleines Ruderboot mit Mini-Segel
  if (!enemy && shipLvl === 1) {
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath(); c.ellipse(cx, y + 10, 20, 6, 0, 0, 7); c.fill();
    c.fillStyle = '#9a6a38';
    c.beginPath();
    c.moveTo(cx - 16, y - 2);
    c.quadraticCurveTo(cx, y - 8, cx + 16, y - 2);
    c.quadraticCurveTo(cx + 17, y + 4, cx + 13, y + 8);
    c.lineTo(cx - 13, y + 8);
    c.quadraticCurveTo(cx - 17, y + 4, cx - 16, y - 2);
    c.fill();
    c.fillStyle = '#7a5028';
    c.fillRect(cx - 14, y + 2, 28, 2.5);
    c.fillStyle = '#6c4522';
    c.fillRect(cx - 1, y - 22, 2.5, 22);
    c.fillStyle = '#f7f3e8';
    c.beginPath();
    c.moveTo(cx + 1, y - 21);
    c.quadraticCurveTo(cx + 13, y - 15, cx + 2, y - 6);
    c.closePath(); c.fill();
    return;
  }

  // Kielwasser
  c.fillStyle = 'rgba(255,255,255,0.18)';
  c.beginPath(); c.ellipse(cx, y + 12, 30, 8, 0, 0, 7); c.fill();

  const hull = enemy ? '#5d6b7a' : shipLvl >= 3 ? '#c8973a' : '#b98a54';
  const trim = enemy ? '#8593a3' : shipLvl >= 3 ? '#d84c3e' : '#6c4522';
  c.fillStyle = hull;
  c.beginPath();
  c.moveTo(cx - 26, y - 2);
  c.quadraticCurveTo(cx, y - 12, cx + 26, y - 2);
  c.quadraticCurveTo(cx + 30, y + 4, cx + 24, y + 10);
  c.lineTo(cx - 24, y + 10);
  c.quadraticCurveTo(cx - 30, y + 4, cx - 26, y - 2);
  c.fill();
  c.fillStyle = trim;
  c.fillRect(cx - 25, y + 4, 50, 3);
  // Mast + Segel
  c.fillStyle = '#6c4522';
  c.fillRect(cx - 1.5, y - 30, 3, 30);
  c.fillStyle = enemy ? '#e9edf5' : '#f7f3e8';
  c.beginPath();
  c.moveTo(cx, y - 28);
  c.quadraticCurveTo(cx + 18, y - 20, cx + 2, y - 6);
  c.closePath(); c.fill();
  if (enemy) {
    c.fillStyle = '#2a4a8a';
    c.font = 'bold 8px sans-serif';
    c.fillText('MARINE', cx - 14, y - 16);
  }
  // Galionsfigur der Sunny
  if (!enemy && shipLvl >= 3) {
    c.fillStyle = '#f4b01c';
    c.beginPath(); c.arc(cx - 28, y + 2, 6, 0, 7); c.fill();
  }
  if (!enemy && shipLvl === 2) {
    c.fillStyle = '#f2f4f8';
    c.beginPath(); c.arc(cx - 27, y + 2, 5, 0, 7); c.fill();
  }
}

// ---- Seekönig ----
function drawSeaking(c, cx, cy, time, scale) {
  const s = scale || 1;
  const bob = Math.sin(time / 350 + cx * 0.02) * 3;
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.beginPath(); c.ellipse(cx, cy + 12 * s, 26 * s, 7 * s, 0, 0, 7); c.fill();
  c.fillStyle = '#2f7a56';
  for (let i = 2; i >= 0; i--) {
    c.beginPath();
    c.arc(cx - i * 16 * s, cy + bob * (i % 2 ? -0.6 : 1) + i * 4 * s, (14 - i * 3) * s, 0, 7);
    c.fill();
  }
  c.fillStyle = '#3c9a6c';
  c.beginPath(); c.arc(cx + 8 * s, cy - 14 * s + bob, 12 * s, 0, 7); c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(cx + 12 * s, cy - 17 * s + bob, 3.4 * s, 0, 7); c.fill();
  c.fillStyle = '#111';
  c.beginPath(); c.arc(cx + 13 * s, cy - 17 * s + bob, 1.7 * s, 0, 7); c.fill();
  c.fillStyle = '#e8d28a';
  c.beginPath();
  c.moveTo(cx + 4 * s, cy - 6 * s + bob); c.lineTo(cx + 7 * s, cy - 1 * s + bob); c.lineTo(cx + 10 * s, cy - 6 * s + bob);
  c.closePath(); c.fill();
}

const ENEMY_LOOKS = {
  bandit: LOOKS.bandit, marine: LOOKS.marine, pirate: LOOKS.pirate, hunter: LOOKS.hunter,
};

// =====================================================================
//  Minimap
// =====================================================================
const MINI_COLORS = {
  [T.W]: '#3fa5dc', [T.D]: '#1e6ba3', [T.S]: '#2c2a52',
  [T.SAND]: '#eedc9e', [T.GRASS]: '#5cb464', [T.TALL]: '#47a04f',
  [T.TREE]: '#2e8b47', [T.ROCK]: '#96a1b0', [T.HOUSE]: '#d84c3e',
  [T.SHOP]: '#2a9d8f', [T.BASE]: '#8593a3', [T.DOCK]: '#a5713d',
  [T.PATH]: '#dcc491', [T.CHEST]: '#ffd166', [T.CHEST_OPEN]: '#8a6a2b',
};
function buildMinimap() {
  const cv = document.createElement('canvas');
  cv.width = WORLD_W; cv.height = WORLD_H;
  const c = cv.getContext('2d');
  const img = c.createImageData(WORLD_W, WORLD_H);
  for (let y = 0; y < WORLD_H; y++)
    for (let x = 0; x < WORLD_W; x++) {
      let col = MINI_COLORS[World.map[idx(x, y)]] || '#000';
      const t = World.map[idx(x, y)];
      if (t === T.GRASS || t === T.TALL || t === T.TREE) {
        const il = islandAt(x, y);
        if (il && il.biome && il.biome !== 'grass') col = BIOMES[il.biome].ground;
      }
      const r = parseInt(col.slice(1, 3), 16), g = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
      const p = (y * WORLD_W + x) * 4;
      img.data[p] = r; img.data[p + 1] = g; img.data[p + 2] = b; img.data[p + 3] = 255;
    }
  c.putImageData(img, 0, 0);
  World.minimap = cv;
}

// =====================================================================
//  Weltszene
// =====================================================================
function drawWorld(c, G, time) {
  const st = G.state;
  const viewW = 960, viewH = 640;
  let camX = G.px - viewW / 2;
  let camY = G.py - viewH / 2;
  camX = Math.max(0, Math.min(WORLD_W * TS - viewW, camX));
  camY = Math.max(0, Math.min(WORLD_H * TS - viewH, camY));
  G.camX = camX; G.camY = camY;

  const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
  const x1 = Math.min(WORLD_W - 1, x0 + Math.ceil(viewW / TS) + 1);
  const y1 = Math.min(WORLD_H - 1, y0 + Math.ceil(viewH / TS) + 1);

  // Wasser zuerst (damit Landkacheln mit runden Kanten überlappen können)
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const t = tileAt(x, y);
      if (WATER_TILES.has(t)) drawTile(c, t, x * TS - camX, y * TS - camY, x, y, time);
    }
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const t = tileAt(x, y);
      if (!WATER_TILES.has(t)) drawTile(c, t, x * TS - camX, y * TS - camY, x, y, time);
    }

  // Berry-Drops & Item-Drops
  drawPickups(c, camX, camY, time);

  // NPCs
  for (const n of World.npcs) {
    if (n.x < x0 - 1 || n.x > x1 + 1 || n.y < y0 - 1 || n.y > y1 + 1) continue;
    if (npcHidden(n, st)) continue;
    const sx = n.x * TS - camX + TS / 2, sy = n.y * TS - camY + TS - 3;
    drawChar(c, sx, sy, 1.15, LOOKS[n.def.look] || LOOKS.villager1, 'down', false);
  }

  // Gegner
  drawEnemies(c, camX, camY, time);

  // Crew-Begleiter
  if (!st.onShip) {
    for (let i = 0; i < st.crew.length; i++) {
      const pos = trailPoint(G, (i + 1) * 34);
      if (!pos) break;
      drawChar(c, pos.x - camX, pos.y - camY, 1.1, LOOKS[CREW[st.crew[i]].look], pos.dir || 'down', G.isMoving);
    }
  }

  // Spieler
  if (st.onShip) {
    drawShipTop(c, G.px - camX, G.py - camY, st.ship, time, false);
    drawChar(c, G.px - camX, G.py - camY - 8, 0.85, st.look, st.facing, false);
  } else {
    drawChar(c, G.px - camX, G.py - camY, 1.2, st.look, st.facing, G.isMoving);
  }

  // Projektile, Effekte, Schadenszahlen
  drawProjectiles(c, camX, camY, time);
  drawEffects(c, camX, camY, time);

  // Interaktions-Hinweis
  if (G.interactHint) {
    const ix = G.interactHint.x - camX, iy = G.interactHint.y - camY;
    c.fillStyle = 'rgba(10,22,38,0.85)';
    c.beginPath(); c.roundRect(ix - 14, iy - 46, 28, 20, 6); c.fill();
    c.fillStyle = '#ffd166';
    c.font = 'bold 12px sans-serif';
    c.textAlign = 'center';
    c.fillText('E', ix, iy - 32);
    c.textAlign = 'left';
  }
}

// Position auf der Lauf-Spur (für Crew-Begleiter), dist = Pixel hinter dem Spieler
function trailPoint(G, dist) {
  const tr = G.trail;
  if (!tr.length) return null;
  let acc = 0;
  let prev = { x: G.px, y: G.py };
  for (let i = 0; i < tr.length; i++) {
    const p = tr[i];
    const d = Math.hypot(p.x - prev.x, p.y - prev.y);
    if (acc + d >= dist) {
      const f = (dist - acc) / (d || 1);
      return { x: prev.x + (p.x - prev.x) * f, y: prev.y + (p.y - prev.y) * f, dir: p.dir };
    }
    acc += d;
    prev = p;
  }
  return tr[tr.length - 1];
}

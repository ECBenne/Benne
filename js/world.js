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

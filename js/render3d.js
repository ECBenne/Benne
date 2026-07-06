// =====================================================================
//  3D-Renderer (Ego-Perspektive, Voxel-/Minecraft-Stil, Three.js)
//  Die Spiellogik bleibt 2D auf der Kachelebene — hier wird sie
//  als blockige 3D-Welt dargestellt. 1 Kachel = 1 Block (32 px).
// =====================================================================
'use strict';

const R3 = {
  renderer: null, scene: null, camera: null,
  chunks: new Map(),
  ents: new Map(),
  projMeshes: [], pickMeshes: [],
  fxGroup: null,
  labelWrap: null, labelPool: [], floaterPool: [],
  boat: null, sunLight: null, hemi: null,
  mat: null,
  eyeY: 2.6,
  skyCur: new THREE.Color(0x8ec9ea),
  fogCur: new THREE.Color(0x9fd0ea),
};
const CHUNK = 16;
const CHUNK_RADIUS = 4;
const EYE = 1.62;
const WATER_Y = 0.42;

// ---------------------------------------------------------------
//  Hilfen
// ---------------------------------------------------------------
const _colCache = {};
function col3(hex) {
  if (!_colCache[hex]) {
    _colCache[hex] = [
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255,
    ];
  }
  return _colCache[hex];
}
function shade(c, f) { return [c[0] * f, c[1] * f, c[2] * f]; }

// Geometrie-Baukasten für Chunks (Positionen + Normalen + Vertexfarben)
function GB() { this.pos = []; this.nor = []; this.col = []; this.idx = []; this.v = 0; }
GB.prototype.quad = function (a, b, c, d, n, color) {
  const P = this.pos, N = this.nor, C = this.col, I = this.idx;
  P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
  for (let i = 0; i < 4; i++) { N.push(n[0], n[1], n[2]); C.push(color[0], color[1], color[2]); }
  I.push(this.v, this.v + 1, this.v + 2, this.v, this.v + 2, this.v + 3);
  this.v += 4;
};
// Quader von (x0,y0,z0) bis (x1,y1,z1); faces: {top,bottom,px,nx,pz,nz}
GB.prototype.box = function (x0, y0, z0, x1, y1, z1, cTop, cSide, faces) {
  const f = faces || {};
  if (f.top !== false)
    this.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0], cTop);
  if (f.bottom)
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], shade(cSide, 0.5));
  if (f.px !== false)
    this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0], shade(cSide, 0.82));
  if (f.nx !== false)
    this.quad([x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [-1, 0, 0], shade(cSide, 0.82));
  if (f.pz !== false)
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], shade(cSide, 0.92));
  if (f.nz !== false)
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], shade(cSide, 0.72));
};
GB.prototype.build = function () {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
  g.setIndex(this.idx);
  return g;
};

// ---------------------------------------------------------------
//  Initialisierung
// ---------------------------------------------------------------
function init3D(canvas) {
  R3.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  R3.renderer.setSize(960, 640, false);
  R3.scene = new THREE.Scene();
  R3.scene.fog = new THREE.Fog(0x9fd0ea, 28, 105);
  R3.camera = new THREE.PerspectiveCamera(72, 960 / 640, 0.1, 160);
  R3.camera.rotation.order = 'YXZ';

  R3.hemi = new THREE.HemisphereLight(0xf5f8ff, 0x8a7a5a, 0.85);
  R3.scene.add(R3.hemi);
  R3.sunLight = new THREE.DirectionalLight(0xfff2d0, 0.7);
  R3.sunLight.position.set(0.6, 1, 0.35);
  R3.scene.add(R3.sunLight);

  R3.mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  R3.fxGroup = new THREE.Group();
  R3.scene.add(R3.fxGroup);
  R3.labelWrap = el('labels');

  // Spielerboot (sichtbar in Ego-Perspektive vor der Kamera)
  R3.boat = buildBoat();
  R3.boat.visible = false;
  R3.scene.add(R3.boat);
}

function resetWorld3D() {
  for (const [, ch] of R3.chunks) { R3.scene.remove(ch.mesh); ch.mesh.geometry.dispose(); }
  R3.chunks.clear();
  for (const [, e] of R3.ents) R3.scene.remove(e.group);
  R3.ents.clear();
}

// ---------------------------------------------------------------
//  Chunks (16×16 Kacheln als ein Mesh)
// ---------------------------------------------------------------
function groundColorOf(t, wx, wy) {
  const B = biomeOf(wx, wy);
  const base =
    t === T.SAND ? B.sand :
    t === T.PATH ? '#dcc491' :
    t === T.TALL ? B.ground :
    B.ground;
  const c = col3(base);
  const v = 0.92 + hashNoise(wx, wy, 21) * 0.14; // Minecraft-Flickenteppich
  return shade(c, v);
}

function buildChunk(cx, cz) {
  const gb = new GB();
  const x0 = cx * CHUNK, z0 = cz * CHUNK;

  for (let dz = 0; dz < CHUNK; dz++) {
    for (let dx = 0; dx < CHUNK; dx++) {
      const wx = x0 + dx, wz = z0 + dz;
      if (wx >= WORLD_W || wz >= WORLD_H) continue;
      const t = tileAt(wx, wz);
      const X = wx, Z = wz;

      if (WATER_TILES.has(t) || t === T.DOCK) {
        // Wasserfläche
        const wc = col3(WATER_COLORS[t === T.DOCK ? T.W : t]);
        const v = 0.94 + hashNoise(wx, wz, 5) * 0.12;
        gb.quad([X, WATER_Y, Z], [X, WATER_Y, Z + 1], [X + 1, WATER_Y, Z + 1], [X + 1, WATER_Y, Z], [0, 1, 0], shade(wc, v));
        if (t === T.DOCK) {
          // Holzsteg über dem Wasser
          const p = col3('#a5713d');
          gb.box(X, WATER_Y + 0.1, Z, X + 1, WATER_Y + 0.24, Z + 1, p, shade(p, 0.8), { bottom: true });
        }
        continue;
      }

      // Landblock (Deckel + Küstenwände)
      const gc = groundColorOf(t, wx, wz);
      const sand = col3(biomeOf(wx, wz).sand);
      const nW = WATER_TILES.has(tileAt(wx + 1, wz)) || tileAt(wx + 1, wz) === T.DOCK;
      const nE = WATER_TILES.has(tileAt(wx - 1, wz)) || tileAt(wx - 1, wz) === T.DOCK;
      const nS = WATER_TILES.has(tileAt(wx, wz + 1)) || tileAt(wx, wz + 1) === T.DOCK;
      const nN = WATER_TILES.has(tileAt(wx, wz - 1)) || tileAt(wx, wz - 1) === T.DOCK;
      gb.box(X, 0, Z, X + 1, 1, Z + 1, gc, sand,
        { bottom: false, px: nW, nx: nE, pz: nS, nz: nN });

      const B = biomeOf(wx, wz);
      switch (t) {
        case T.TALL: {
          const tc = col3(B.tall);
          gb.box(X + 0.15, 1, Z + 0.15, X + 0.85, 1.42, Z + 0.85, shade(tc, 1.05), tc);
          break;
        }
        case T.TREE: {
          const trunk = col3(B.trunk);
          const can = col3(B.canopy), can2 = col3(B.canopy2);
          const h = 2.1 + hashNoise(wx, wz, 31) * 1.1;
          gb.box(X + 0.38, 1, Z + 0.38, X + 0.62, 1 + h, Z + 0.62, trunk, trunk);
          gb.box(X - 0.3, 1 + h - 0.2, Z - 0.3, X + 1.3, 2.3 + h, Z + 1.3, shade(can2, 1.05), can, { bottom: true });
          break;
        }
        case T.ROCK: {
          const g1 = col3('#96a1b0');
          gb.box(X + 0.15, 1, Z + 0.15, X + 0.85, 1.62, Z + 0.85, shade(g1, 1.1), g1);
          break;
        }
        case T.HOUSE: {
          const wall = col3('#b98a54');
          const roof = col3('#d84c3e');
          gb.box(X + 0.04, 1, Z + 0.04, X + 0.96, 2.35, Z + 0.96, wall, wall);
          gb.box(X - 0.1, 2.35, Z - 0.1, X + 1.1, 2.8, Z + 1.1, shade(roof, 1.05), roof, { bottom: true });
          break;
        }
        case T.SHOP: {
          const wall = col3('#c8a06a');
          const roof = col3('#2a9d8f');
          gb.box(X + 0.04, 1, Z + 0.04, X + 0.96, 2.35, Z + 0.96, wall, wall);
          gb.box(X - 0.1, 2.35, Z - 0.1, X + 1.1, 2.8, Z + 1.1, shade(roof, 1.1), roof, { bottom: true });
          break;
        }
        case T.BASE: {
          const g1 = col3('#8593a3');
          gb.box(X, 1, Z, X + 1, 3.4, Z + 1, shade(g1, 0.9), g1);
          break;
        }
        case T.CHEST: case T.CHEST_OPEN: {
          const body = col3(t === T.CHEST ? '#9a6a34' : '#5c3e1e');
          const lid = col3(t === T.CHEST ? '#ffd166' : '#241a10');
          gb.box(X + 0.22, 1, Z + 0.22, X + 0.78, 1.42, Z + 0.78, lid, body);
          break;
        }
      }
    }
  }

  const mesh = new THREE.Mesh(gb.build(), R3.mat);
  mesh.frustumCulled = true;
  return mesh;
}

function ensureChunks() {
  const pcx = Math.floor(G.px / TS / CHUNK), pcz = Math.floor(G.py / TS / CHUNK);
  for (let dz = -CHUNK_RADIUS; dz <= CHUNK_RADIUS; dz++) {
    for (let dx = -CHUNK_RADIUS; dx <= CHUNK_RADIUS; dx++) {
      const cx = pcx + dx, cz = pcz + dz;
      if (cx < 0 || cz < 0 || cx * CHUNK >= WORLD_W || cz * CHUNK >= WORLD_H) continue;
      const key = cx + ',' + cz;
      if (!R3.chunks.has(key)) {
        const mesh = buildChunk(cx, cz);
        R3.scene.add(mesh);
        R3.chunks.set(key, { mesh, cx, cz });
      }
    }
  }
  // weit entfernte Chunks entsorgen
  for (const [key, ch] of R3.chunks) {
    if (Math.abs(ch.cx - pcx) > CHUNK_RADIUS + 2 || Math.abs(ch.cz - pcz) > CHUNK_RADIUS + 2) {
      R3.scene.remove(ch.mesh);
      ch.mesh.geometry.dispose();
      R3.chunks.delete(key);
    }
  }
}

function dirtyTile3D(tx, tz) {
  const key = Math.floor(tx / CHUNK) + ',' + Math.floor(tz / CHUNK);
  const ch = R3.chunks.get(key);
  if (ch) {
    R3.scene.remove(ch.mesh);
    ch.mesh.geometry.dispose();
    ch.mesh = buildChunk(ch.cx, ch.cz);
    R3.scene.add(ch.mesh);
  }
}

// ---------------------------------------------------------------
//  Blockige Figuren
// ---------------------------------------------------------------
function boxMesh(w, h, d, hex) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color: new THREE.Color(hex) }));
}

function buildHumanoid(look, scale) {
  const s = scale || 1;
  const g = new THREE.Group();
  const parts = {};
  // Beine
  parts.ll = boxMesh(0.22 * s, 0.5 * s, 0.24 * s, look.pants || '#31456b');
  parts.ll.position.set(-0.14 * s, 0.25 * s, 0);
  parts.rl = boxMesh(0.22 * s, 0.5 * s, 0.24 * s, look.pants || '#31456b');
  parts.rl.position.set(0.14 * s, 0.25 * s, 0);
  // Körper
  const body = boxMesh(0.56 * s, 0.6 * s, 0.3 * s, look.shirt);
  body.position.y = 0.8 * s;
  // Arme
  parts.la = boxMesh(0.16 * s, 0.55 * s, 0.2 * s, look.skin);
  parts.la.position.set(-0.38 * s, 0.82 * s, 0);
  parts.ra = boxMesh(0.16 * s, 0.55 * s, 0.2 * s, look.skin);
  parts.ra.position.set(0.38 * s, 0.82 * s, 0);
  // Kopf
  const head = boxMesh(0.44 * s, 0.42 * s, 0.42 * s, look.skin);
  head.position.y = 1.34 * s;
  // Haare
  const hair = boxMesh(0.48 * s, 0.16 * s, 0.46 * s, look.hair);
  hair.position.y = 1.56 * s;
  // Augen
  const eyeL = boxMesh(0.07 * s, 0.07 * s, 0.03 * s, '#26262e');
  eyeL.position.set(-0.11 * s, 1.36 * s, 0.22 * s);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.11 * s;
  g.add(parts.ll, parts.rl, body, parts.la, parts.ra, head, hair, eyeL, eyeR);
  // Strohhut
  if (look.hat) {
    const brim = boxMesh(0.72 * s, 0.06 * s, 0.72 * s, '#eac86a');
    brim.position.y = 1.62 * s;
    const crown = boxMesh(0.4 * s, 0.16 * s, 0.4 * s, '#eac86a');
    crown.position.y = 1.72 * s;
    const band = boxMesh(0.42 * s, 0.06 * s, 0.42 * s, '#d63a3a');
    band.position.y = 1.66 * s;
    g.add(brim, crown, band);
  }
  g.userData.parts = parts;
  return g;
}

function buildShip3D(enemy, mastZ) {
  const g = new THREE.Group();
  const hullC = enemy ? '#5d6b7a' : '#b98a54';
  const hull = boxMesh(1.4, 0.5, 3.0, hullC);
  hull.position.y = 0.3;
  const bow = boxMesh(1.0, 0.4, 0.7, hullC);
  bow.position.set(0, 0.35, -1.75);
  const mz = typeof mastZ === 'number' ? mastZ : 0;
  const mast = boxMesh(0.12, 2.4, 0.12, '#6c4522');
  mast.position.set(0, 1.6, mz);
  const sail = boxMesh(1.5, 1.3, 0.06, enemy ? '#e9edf5' : '#f7f3e8');
  sail.position.set(0, 1.9, mz + 0.1);
  g.add(hull, bow, mast, sail);
  if (enemy) {
    const stripe = boxMesh(1.44, 0.14, 3.02, '#2a4a8a');
    stripe.position.y = 0.42;
    g.add(stripe);
  }
  g.userData.parts = {};
  return g;
}

function buildSeaking(scale) {
  const s = scale || 1;
  const g = new THREE.Group();
  const c1 = boxMesh(1.0 * s, 1.0 * s, 1.0 * s, '#3c9a6c');
  c1.position.y = 0.9 * s;
  const head = boxMesh(0.8 * s, 0.8 * s, 0.8 * s, '#2f7a56');
  head.position.set(0, 1.7 * s, -0.3 * s);
  const eye = boxMesh(0.14 * s, 0.14 * s, 0.05 * s, '#ffffff');
  eye.position.set(-0.2 * s, 1.85 * s, -0.72 * s);
  const eye2 = eye.clone(); eye2.position.x = 0.2 * s;
  const tail = boxMesh(0.7 * s, 0.7 * s, 1.2 * s, '#2f7a56');
  tail.position.set(0, 0.5 * s, 1.0 * s);
  g.add(c1, head, eye, eye2, tail);
  g.userData.parts = {};
  return g;
}

function buildBoat() {
  const g = buildShip3D(false, 1.15);
  g.scale.set(0.8, 0.8, 0.8);
  return g;
}

// ---------------------------------------------------------------
//  Entities synchronisieren
// ---------------------------------------------------------------
function getEnt(key, builder) {
  let e = R3.ents.get(key);
  if (!e) {
    const group = builder();
    R3.scene.add(group);
    e = { group, seen: 0 };
    R3.ents.set(key, e);
  }
  return e;
}

function animWalk(group, time, moving, speed) {
  const p = group.userData.parts;
  if (!p || !p.la) return;
  const a = moving ? Math.sin(time / (speed || 140)) * 0.6 : 0;
  p.la.rotation.x = a; p.ra.rotation.x = -a;
  p.ll.rotation.x = -a; p.rl.rotation.x = a;
}

function syncEntities(time, frame) {
  const st = G.state;

  // Gegner
  for (const e of G.enemies) {
    const key = 'e' + e.id;
    const ent = getEnt(key, () =>
      e.sprite === 'ship' ? buildShip3D(true) :
      e.sprite === 'seaking' ? buildSeaking(e.boss ? 1.5 : 1) :
      buildHumanoid(ENEMY_LOOKS[e.sprite] || LOOKS.pirate, e.boss ? 1.55 : 1));
    ent.seen = frame;
    const y = e.water ? WATER_Y : 1;
    ent.group.position.set(e.x / TS, y + (e.water ? Math.sin(time / 400 + e.id) * 0.05 : 0), e.y / TS);
    // Blickrichtung
    let ang = 0;
    if (e.aggro) ang = Math.atan2(G.px - e.x, G.py - e.y);
    else if (e.vx || e.vy) ang = Math.atan2(e.vx, e.vy);
    ent.group.rotation.y = ang;
    animWalk(ent.group, time + e.id * 313, e.aggro || !!(e.vx || e.vy), 150);
    if (e.stun > 0) ent.group.rotation.z = Math.sin(time / 90) * 0.1;
    else ent.group.rotation.z = 0;
  }

  // NPCs
  for (let i = 0; i < World.npcs.length; i++) {
    const n = World.npcs[i];
    const nx = n.x + 0.5, nz = n.y + 0.5;
    const d = Math.hypot(nx - G.px / TS, nz - G.py / TS);
    if (d > 70 || npcHidden(n, st)) continue;
    const key = 'n' + i;
    const ent = getEnt(key, () => buildHumanoid(LOOKS[n.def.look] || LOOKS.villager1, 1));
    ent.seen = frame;
    ent.group.position.set(nx, 1, nz);
    // NPC schaut zum Spieler, wenn nah
    if (d < 6) ent.group.rotation.y = Math.atan2(G.px / TS - nx, G.py / TS - nz);
    animWalk(ent.group, time, false);
  }

  // Crew-Begleiter
  if (!st.onShip) {
    for (let i = 0; i < st.crew.length; i++) {
      const pos = trailPoint(G, (i + 1) * 42);
      if (!pos) break;
      const key = 'c' + st.crew[i];
      const ent = getEnt(key, () => buildHumanoid(LOOKS[CREW[st.crew[i]].look], 1));
      ent.seen = frame;
      ent.group.position.set(pos.x / TS, 1, pos.y / TS);
      const nx = i === 0 ? G.px : (trailPoint(G, i * 42) || pos).x;
      const nz = i === 0 ? G.py : (trailPoint(G, i * 42) || pos).y;
      ent.group.rotation.y = Math.atan2(nx - pos.x, nz - pos.y);
      animWalk(ent.group, time + i * 200, G.isMoving);
    }
  }

  // Spielerboot
  R3.boat.visible = st.onShip;
  if (st.onShip) {
    const bf = forwardVec();
    R3.boat.position.set(
      G.px / TS + bf.x * 1.1,
      WATER_Y + Math.sin(time / 420) * 0.04,
      G.py / TS + bf.y * 1.1);
    R3.boat.rotation.y = G.yaw; // Bug (lokal -z) zeigt in Blickrichtung
    const sc = st.ship >= 3 ? 1.15 : st.ship === 2 ? 1.0 : 0.7;
    R3.boat.scale.set(sc, sc, sc);
  }

  // verwaiste Entities entfernen
  for (const [key, ent] of R3.ents) {
    if (ent.seen !== frame && key[0] !== 'n') {
      R3.scene.remove(ent.group);
      R3.ents.delete(key);
    } else if (key[0] === 'n' && ent.seen !== frame) {
      ent.group.visible = false;
    } else if (key[0] === 'n') {
      ent.group.visible = true;
    }
  }
}

// ---------------------------------------------------------------
//  Projektile, Drops, Effekte
// ---------------------------------------------------------------
const _sphereGeo = new THREE.SphereGeometry(1, 10, 8);
const _cubeGeo = new THREE.BoxGeometry(1, 1, 1);
const _ringGeo = new THREE.RingGeometry(0.85, 1, 28);

function syncPools(list, meshes, makeMesh, syncMesh) {
  while (meshes.length < list.length) {
    const m = makeMesh();
    R3.scene.add(m);
    meshes.push(m);
  }
  while (meshes.length > list.length) {
    const m = meshes.pop();
    R3.scene.remove(m);
  }
  for (let i = 0; i < list.length; i++) syncMesh(list[i], meshes[i]);
}

function syncProjectiles(time) {
  syncPools(G.projs, R3.projMeshes,
    () => new THREE.Mesh(_sphereGeo, new THREE.MeshBasicMaterial({ color: 0xffffff })),
    (p, m) => {
      m.material.color.set(p.color);
      const r = p.r / 32 * 1.6;
      m.scale.set(r, r, r);
      m.position.set(p.x / TS, 1.3, p.y / TS);
    });
}

function syncPickups(time) {
  syncPools(G.pickups, R3.pickMeshes,
    () => new THREE.Mesh(_cubeGeo, new THREE.MeshLambertMaterial({ color: 0xffd166 })),
    (p, m) => {
      const isFruit = p.type === 'fruit';
      m.material.color.set(isFruit ? 0x9a4ad0 : 0xffd166);
      const s = isFruit ? 0.34 : 0.22;
      m.scale.set(s, s, s);
      m.position.set(p.x / TS, 1.35 + Math.sin(time / 260 + p.x) * 0.12, p.y / TS);
      m.rotation.y = time / 500 + p.x;
      m.rotation.x = isFruit ? 0.5 : 0;
    });
}

function syncFx(time) {
  const active = new Set();
  for (const f of G.fx) {
    if (!f._mesh) {
      if (f.type === 'aoe') {
        f._mesh = new THREE.Mesh(_ringGeo, new THREE.MeshBasicMaterial({
          color: new THREE.Color(f.color), transparent: true, opacity: 0.8,
          side: THREE.DoubleSide, depthWrite: false,
        }));
        f._mesh.rotation.x = -Math.PI / 2;
        f._mesh.position.set(f.x / TS, 1.06, f.y / TS);
        f._dur = f.t;
      } else if (f.type === 'slash') {
        f._mesh = new THREE.Mesh(_ringGeo, new THREE.MeshBasicMaterial({
          color: new THREE.Color(f.color || '#ffffff'), transparent: true, opacity: 0.9,
          side: THREE.DoubleSide, depthWrite: false,
        }));
        f._mesh.position.set(
          f.x / TS + Math.cos(f.dir) * 1.2, 1.5, f.y / TS + Math.sin(f.dir) * 1.2);
        f._mesh.rotation.y = -f.dir + Math.PI / 2;
        f._dur = f.t;
      } else if (f.type === 'dash') {
        const len = Math.hypot(f.x2 - f.x, f.y2 - f.y) / TS;
        f._mesh = new THREE.Mesh(_cubeGeo, new THREE.MeshBasicMaterial({
          color: new THREE.Color(f.color), transparent: true, opacity: 0.7, depthWrite: false,
        }));
        f._mesh.scale.set(0.3, 0.3, len);
        f._mesh.position.set((f.x + f.x2) / 2 / TS, 1.3, (f.y + f.y2) / 2 / TS);
        f._mesh.rotation.y = Math.atan2(f.x2 - f.x, f.y2 - f.y);
        f._dur = f.t;
      } else if (f.type === 'muzzle') {
        f._mesh = new THREE.Mesh(_sphereGeo, new THREE.MeshBasicMaterial({
          color: 0xffc85a, transparent: true, opacity: 0.9, depthWrite: false,
        }));
        f._mesh.scale.set(0.3, 0.3, 0.3);
        f._mesh.position.set(f.x / TS, 1.3, f.y / TS);
        f._dur = f.t;
      }
      if (f._mesh) R3.fxGroup.add(f._mesh);
    }
    if (f._mesh) {
      active.add(f._mesh);
      const prog = 1 - f.t / (f._dur || 0.3);
      if (f.type === 'aoe') {
        const s = (f.radius / TS) * (0.3 + prog * 0.7);
        f._mesh.scale.set(s, s, s);
        f._mesh.material.opacity = (1 - prog) * 0.8;
      } else if (f.type === 'slash') {
        const s = 0.5 + prog * 0.7;
        f._mesh.scale.set(s, s, s);
        f._mesh.material.opacity = (1 - prog) * 0.9;
      } else {
        f._mesh.material.opacity = (1 - prog) * 0.8;
      }
    }
  }
  for (let i = R3.fxGroup.children.length - 1; i >= 0; i--) {
    const m = R3.fxGroup.children[i];
    if (!active.has(m)) {
      R3.fxGroup.remove(m);
      m.material.dispose();
    }
  }
}

// ---------------------------------------------------------------
//  Labels & Schadenszahlen (HTML-Overlay, projiziert)
// ---------------------------------------------------------------
const _v3 = new THREE.Vector3();
function projectToScreen(wx, wy, wz) {
  _v3.set(wx, wy, wz).project(R3.camera);
  if (_v3.z > 1 || _v3.z < -1) return null;
  return { x: (_v3.x * 0.5 + 0.5) * 100, y: (-_v3.y * 0.5 + 0.5) * 100 };
}

function getPoolDiv(pool, i, cls) {
  let d = pool[i];
  if (!d) {
    d = document.createElement('div');
    d.className = cls;
    R3.labelWrap.appendChild(d);
    pool[i] = d;
  }
  d.style.display = 'block';
  return d;
}
function hidePoolRest(pool, from) {
  for (let i = from; i < pool.length; i++) pool[i].style.display = 'none';
}

function syncLabels() {
  const st = G.state;
  let li = 0;

  // Gegner-Labels (die nächsten mit HP-Anzeige)
  const cands = [];
  for (const e of G.enemies) {
    const d = Math.hypot(e.x - G.px, e.y - G.py);
    if (d > 900) continue;
    if (e.aggro || e.hp < e.maxHp || e.boss) cands.push({ e, d });
  }
  cands.sort((a, b) => a.d - b.d);
  for (const { e } of cands.slice(0, 10)) {
    const h = e.boss ? 3.2 : e.sprite === 'ship' ? 3.0 : 2.2;
    const p = projectToScreen(e.x / TS, (e.water ? WATER_Y : 1) + h, e.y / TS);
    if (!p) continue;
    const div = getPoolDiv(R3.labelPool, li++, 'elabel');
    div.style.left = p.x + '%';
    div.style.top = p.y + '%';
    const pct = Math.max(0, e.hp / e.maxHp * 100);
    const barColor = pct > 50 ? '#58c86a' : pct > 25 ? '#f0b040' : '#e05050';
    div.innerHTML =
      '<div class="ename' + (e.boss ? ' boss' : '') + '">' + e.name + ' Lv.' + e.lvl +
      (e.stun > 0 ? ' ✦' : '') + (e.burn > 0 ? ' 🔥' : '') + '</div>' +
      '<div class="ebar"><div style="width:' + pct + '%;background:' + barColor + '"></div></div>';
  }

  // Interaktions-Hinweis
  if (G.interactHint) {
    const p = projectToScreen(G.interactHint.x / TS, 2.3, G.interactHint.y / TS);
    if (p) {
      const div = getPoolDiv(R3.labelPool, li++, 'elabel');
      div.style.left = p.x + '%';
      div.style.top = p.y + '%';
      div.innerHTML = '<div class="ehint">[E] ' + (G.interactHint.label || '') + '</div>';
    }
  }
  hidePoolRest(R3.labelPool, li);

  // Schadenszahlen
  let fi = 0;
  for (const f of G.floaters) {
    const p = projectToScreen(f.x / TS, 2.0 + (1.1 - f.ttl) * 1.4, f.y / TS);
    if (!p) continue;
    const div = getPoolDiv(R3.floaterPool, fi++, 'floater');
    div.style.left = p.x + '%';
    div.style.top = p.y + '%';
    div.style.color = f.color;
    div.style.opacity = Math.min(1, f.ttl / 0.4);
    div.textContent = f.text;
  }
  hidePoolRest(R3.floaterPool, fi);
}

// ---------------------------------------------------------------
//  Himmel / Nebel je Meereszone
// ---------------------------------------------------------------
const ZONE_SKY = {
  [T.W]: [0x8ec9ea, 0xa8d8ee],
  [T.D]: [0x76b3dc, 0x8ec2e2],
  [T.S]: [0x4a4468, 0x585278],
};
const _skyTarget = new THREE.Color(), _fogTarget = new THREE.Color();
function syncSky(dt) {
  const t = tileAtPx(G.px, G.py);
  const zone = WATER_TILES.has(t) ? t : (G.px / TS >= NEWWORLD_X ? T.S : G.px / TS >= PARADISE_X ? T.D : T.W);
  const pair = ZONE_SKY[zone] || ZONE_SKY[T.W];
  _skyTarget.set(pair[0]);
  _fogTarget.set(pair[1]);
  R3.skyCur.lerp(_skyTarget, Math.min(1, dt * 1.5));
  R3.fogCur.lerp(_fogTarget, Math.min(1, dt * 1.5));
  R3.renderer.setClearColor(R3.skyCur);
  R3.scene.fog.color.copy(R3.fogCur);
}

// ---------------------------------------------------------------
//  Frame
// ---------------------------------------------------------------
let _frame = 0;
function render3D(time, dt) {
  if (!G.state || !World.map) {
    R3.renderer.setClearColor(0x0a1626);
    R3.renderer.clear();
    return;
  }
  _frame++;
  ensureChunks();
  syncEntities(time, _frame);
  syncProjectiles(time);
  syncPickups(time);
  syncFx(time);
  syncSky(dt);

  // Kamera
  const st = G.state;
  const targetEye = st.onShip ? WATER_Y + 1.35 : 1 + EYE;
  R3.eyeY += (targetEye - R3.eyeY) * Math.min(1, dt * 8);
  const bob = G.isMoving && !st.onShip ? Math.sin(time / 160) * 0.05 : 0;
  R3.camera.position.set(G.px / TS, R3.eyeY + bob + G.jumpY, G.py / TS);
  R3.camera.rotation.y = G.yaw;
  R3.camera.rotation.x = G.pitch;

  R3.renderer.render(R3.scene, R3.camera);
  syncLabels();
}

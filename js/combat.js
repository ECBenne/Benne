// =====================================================================
//  Echtzeit-Kampfsystem — Gegner leben direkt in der Spielwelt
// =====================================================================
'use strict';

const MAX_ENEMIES = 45;
const AGGRO_RANGE = 175;
const DEAGGRO_RANGE = 520;

// ---------------------------------------------------------------
//  Spieler-Werte
// ---------------------------------------------------------------
function fruitPassive(st) { return (st.fruit && FRUITS[st.fruit].passive) || {}; }

function playerMaxHp(st) {
  return Math.round((80 + (st.lvl - 1) * 14 + (fruitPassive(st).hp || 0)));
}
function playerAtk(st) {
  let a = 12 + (st.lvl - 1) * 2.6;
  a *= fruitPassive(st).atkMult || 1;
  if (st.crew.includes('zorro')) a *= 1.15;
  a *= 1 + 0.08 * st.haki.arm;
  return a;
}
function playerDef(st) {
  let d = 4 + (st.lvl - 1) * 1.2;
  d *= fruitPassive(st).defMult || 1;
  if (st.crew.includes('franky')) d *= 1.10;
  return d;
}
function playerSpeed(st) {
  if (st.onShip) {
    let s = SHIPS[st.ship].speed;
    if (st.crew.includes('nami')) s *= 1.10;
    if (st.crew.includes('jinbe')) s *= 1.15;
    return s;
  }
  return 175 * (fruitPassive(st).speedMult || 1);
}
function playerDodge(st) {
  let d = 0.05 * st.haki.obs + (fruitPassive(st).dodge || 0);
  if (st.crew.includes('brook')) d += 0.10;
  return Math.min(0.55, d);
}

// ---------------------------------------------------------------
//  Gegner-Erzeugung
// ---------------------------------------------------------------
let entitySeq = 1;

function enemyStats(lvl, boss) {
  return {
    maxHp: Math.round((20 + lvl * 8) * (boss ? 6 : 1)),
    atk: (6 + lvl * 2.0) * (boss ? 1.3 : 1),
    def: 1 + lvl * 0.8,
    xp: Math.round(lvl * 12 * (boss ? 8 : 1)),
  };
}

function makeEnemy(kindId, lvl, x, y, opts) {
  const kind = KINDS[kindId] || KINDS.pirat;
  const s = enemyStats(lvl, opts && opts.boss);
  return {
    id: entitySeq++,
    kindId, name: opts && opts.name || kind.name,
    sprite: opts && opts.sprite || kind.sprite,
    marine: !!kind.marine, water: !!kind.water, ranged: !!kind.ranged,
    lvl, x, y,
    hp: s.maxHp, maxHp: s.maxHp, atk: s.atk, def: s.def, xp: s.xp,
    speed: (kind.water ? 110 : 68) + Math.min(90, lvl * 1.3),
    r: kind.sprite === 'ship' || kind.sprite === 'seaking' ? 26 : 14,
    dir: 'down', vx: 0, vy: 0,
    state: 'wander', wanderT: 0, atkCd: 0, shootCd: 0,
    stun: 0, burn: 0, burnT: 0,
    kx: 0, ky: 0,
    home: { x, y },
    islandId: opts && opts.islandId || null,
    boss: !!(opts && opts.boss), bossId: opts && opts.bossId || null,
    aggro: false, talked: false,
  };
}

// ---------------------------------------------------------------
//  Spawning / Bevölkerung der Inseln
// ---------------------------------------------------------------
function populateIsland(il) {
  const st = G.state;
  const count = Math.min(14, Math.round(il.r * 0.65));
  const table = TIER_TABLES[il.tier];
  let placed = 0, tries = 0;
  while (placed < count && tries < 300 && G.enemies.length < MAX_ENEMIES) {
    tries++;
    const a = Math.random() * Math.PI * 2;
    const d = 4 + Math.random() * (il.r - 5);
    const tx = Math.round(il.x + Math.cos(a) * d);
    const ty = Math.round(il.y + Math.sin(a) * d);
    const t = tileAt(tx, ty);
    if (!(t === T.GRASS || t === T.TALL || t === T.SAND)) continue;
    // nicht direkt im Dorf
    if (Math.hypot(tx - il.x, ty - il.y) < 5) continue;
    const e = table[Math.floor(Math.random() * table.length)];
    const lvl = e.a + Math.floor(Math.random() * (e.b - e.a + 1));
    G.enemies.push(makeEnemy(e.k, lvl, tx * TS + TS / 2, ty * TS + TS / 2, { islandId: il.id }));
    placed++;
  }
  // Boss
  const bossId = il.baseBoss || il.boss;
  if (bossId && !st.flags['boss_' + bossId]) {
    const boss = BOSSES[bossId];
    const bp = il.baseBoss ? { dx: 0, dy: -4 } : il.bossPos;
    const bx = (il.x + bp.dx) * TS + TS / 2, by = (il.y + bp.dy) * TS + TS / 2;
    const e = makeEnemy('pirat', boss.lvl, bx, by,
      { boss: true, bossId, name: boss.name, sprite: boss.sprite, islandId: il.id });
    e.r = 18;
    G.enemies.push(e);
  }
}

function updatePopulation() {
  const st = G.state;
  const ptx = G.px / TS, pty = G.py / TS;
  for (const il of ISLANDS) {
    const d = Math.hypot(ptx - il.x, pty - il.y);
    if (d < il.r + 42 && !G.populated[il.id]) {
      G.populated[il.id] = true;
      populateIsland(il);
    } else if (d > il.r + 62 && G.populated[il.id]) {
      G.populated[il.id] = false;
      G.enemies = G.enemies.filter(e => e.islandId !== il.id);
    }
  }
  // See-Gegner in Spielernähe spawnen
  if (st.onShip && Math.random() < 0.35) {
    const seaCount = G.enemies.filter(e => e.water).length;
    if (seaCount < 3 && G.enemies.length < MAX_ENEMIES) {
      const a = Math.random() * Math.PI * 2;
      const dist = 520 + Math.random() * 200;
      const ex = G.px + Math.cos(a) * dist, ey = G.py + Math.sin(a) * dist;
      const t = tileAtPx(ex, ey);
      if (WATER_TILES.has(t)) {
        const tab = seaTable(t);
        const pick = tab[Math.floor(Math.random() * tab.length)];
        const lvl = pick.a + Math.floor(Math.random() * (pick.b - pick.a + 1));
        G.enemies.push(makeEnemy(pick.k, lvl, ex, ey, {}));
      }
    }
  }
  // weit entfernte See-Gegner entfernen
  G.enemies = G.enemies.filter(e =>
    !(e.water && !e.islandId && Math.hypot(e.x - G.px, e.y - G.py) > 1400));
}

// ---------------------------------------------------------------
//  Gegner-KI & Bewegung
// ---------------------------------------------------------------
// Dorfzentren sind Schutzzonen: dort greifen Streuner nicht an
function inSafeZone(px, py) {
  const tx = px / TS, ty = py / TS;
  const il = islandAt(Math.floor(tx), Math.floor(ty));
  if (!il || !il.npcs.some(n => n.type === 'inn' || n.type === 'talk' || n.type === 'ship')) return false;
  return Math.hypot(tx - il.x, ty - il.y) < 5.5;
}

function enemyBlocked(e, x, y) {
  const t = tileAtPx(x, y);
  if (e.water) return !WATER_TILES.has(t);
  return !WALKABLE.has(t);
}

function moveEnemy(e, dx, dy, dt) {
  const nx = e.x + dx * dt, ny = e.y + dy * dt;
  if (!enemyBlocked(e, nx, e.y)) e.x = nx;
  if (!enemyBlocked(e, e.x, ny)) e.y = ny;
  if (Math.abs(dx) > Math.abs(dy)) e.dir = dx > 0 ? 'right' : 'left';
  else if (dy !== 0) e.dir = dy > 0 ? 'down' : 'up';
}

function updateEnemies(dt, time) {
  const st = G.state;
  for (const e of G.enemies) {
    // Rückstoß abbauen
    if (e.kx || e.ky) {
      moveEnemy(e, e.kx, e.ky, dt);
      e.kx *= Math.pow(0.02, dt); e.ky *= Math.pow(0.02, dt);
      if (Math.abs(e.kx) < 5) e.kx = 0;
      if (Math.abs(e.ky) < 5) e.ky = 0;
    }
    // Verbrennung
    if (e.burn > 0) {
      e.burnT -= dt;
      if (e.burnT <= 0) {
        e.burnT = 0.8;
        e.burn--;
        dealToEnemy(e, Math.max(2, Math.round(e.maxHp * 0.03)), null, null, true);
        if (e.hp <= 0) continue;
      }
    }
    if (e.stun > 0) { e.stun -= dt; continue; }

    const dxp = G.px - e.x, dyp = G.py - e.y;
    const dist = Math.hypot(dxp, dyp);

    // Aggro-Logik
    if (e.boss) {
      if (!e.aggro) continue; // Bosse warten, bis man sie anspricht (oder angreift)
    } else if (!e.aggro && dist < AGGRO_RANGE && !inSafeZone(G.px, G.py)) {
      // See-Gegner ignorieren Spieler an Land und umgekehrt
      const playerOnWater = st.onShip;
      if (e.water === playerOnWater || dist < 90) e.aggro = true;
    }
    if (e.aggro && dist > DEAGGRO_RANGE) e.aggro = false;
    // Ins Dorf geflüchtet? Streuner lassen ab (Bosse nicht)
    if (e.aggro && !e.boss && inSafeZone(G.px, G.py)) e.aggro = false;

    e.atkCd = Math.max(0, e.atkCd - dt);
    e.shootCd = Math.max(0, e.shootCd - dt);

    if (e.aggro) {
      const ux = dxp / (dist || 1), uy = dyp / (dist || 1);
      const melee = !e.ranged;
      const wantDist = e.ranged ? 210 : e.r + 16;

      if (e.ranged && dist < 150) {
        moveEnemy(e, -ux * e.speed, -uy * e.speed, dt); // Abstand halten
      } else if (dist > wantDist) {
        moveEnemy(e, ux * e.speed, uy * e.speed, dt);
      }

      // Nahkampf
      if (melee && dist < e.r + 26 && e.atkCd <= 0) {
        e.atkCd = 1.25;
        dealToPlayer(e, e.atk * (0.9 + Math.random() * 0.3));
      }
      // Fernkampf (Schiffe) & Boss-Orbs
      if ((e.ranged || e.boss) && dist < 340 && e.shootCd <= 0) {
        e.shootCd = e.boss ? 3.2 : 2.4;
        G.projs.push({
          x: e.x, y: e.y - 10,
          vx: ux * 300, vy: uy * 300,
          dmg: e.atk * 1.1, range: 400, traveled: 0,
          friendly: false, color: e.boss ? '#ff5a5a' : '#26262e', r: e.boss ? 9 : 6,
        });
      }
    } else {
      // Umherstreifen
      e.wanderT -= dt;
      if (e.wanderT <= 0) {
        e.wanderT = 1.5 + Math.random() * 2.5;
        const a = Math.random() * Math.PI * 2;
        e.vx = Math.cos(a) * e.speed * 0.35;
        e.vy = Math.sin(a) * e.speed * 0.35;
        if (Math.random() < 0.3) { e.vx = 0; e.vy = 0; }
        // in Richtung Heimat tendieren
        const hd = Math.hypot(e.home.x - e.x, e.home.y - e.y);
        if (hd > 180) {
          e.vx = (e.home.x - e.x) / hd * e.speed * 0.4;
          e.vy = (e.home.y - e.y) / hd * e.speed * 0.4;
        }
      }
      if (e.vx || e.vy) moveEnemy(e, e.vx, e.vy, dt);
    }
  }
}

// ---------------------------------------------------------------
//  Schaden
// ---------------------------------------------------------------
function dealToEnemy(e, raw, fx, knockDir, isDot) {
  const st = G.state;
  const dmg = Math.max(1, Math.round(raw - e.def * 0.5));
  e.hp -= dmg;
  if (!e.boss) e.aggro = true;
  else e.aggro = true;
  addFloater(e.x, e.y - 30, '-' + dmg, isDot ? '#ff9a5a' : '#ffe45a');

  if (fx === 'burn') { e.burn = Math.max(e.burn, 4); e.burnT = 0.8; }
  if (fx === 'stun' || fx === 'freeze') e.stun = Math.max(e.stun, 1.4);
  if (fx === 'knock' && knockDir) {
    e.kx = Math.cos(knockDir) * 420; e.ky = Math.sin(knockDir) * 420;
  }
  // Lebensraub
  const ls = fruitPassive(st).lifesteal || 0;
  if (ls > 0 && !isDot) {
    st.hp = Math.min(playerMaxHp(st), st.hp + Math.round(dmg * ls));
  }
  if (fx === 'drain') {
    st.hp = Math.min(playerMaxHp(st), st.hp + Math.round(dmg * 0.4));
    addFloater(G.px, G.py - 40, '+' + Math.round(dmg * 0.4), '#7ae582');
  }

  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  const st = G.state;
  G.enemies = G.enemies.filter(x => x.id !== e.id);

  // Erfahrung
  let xp = e.xp;
  if (st.crew.includes('robin')) xp = Math.round(xp * 1.2);
  const msgs = gainXp(xp);
  addFloater(e.x, e.y - 44, '+' + xp + ' EP', '#9fc2e8');
  for (const m of msgs) addFloater(G.px, G.py - 50, m, '#ffd166');

  // Kopfgeld
  st.bounty += e.lvl * (e.marine ? 300 : 120);

  // Berry-Drops
  let berry = Math.round(e.lvl * (12 + Math.random() * 10)) * (e.boss ? 0 : 1);
  if (e.boss) berry = BOSSES[e.bossId].berry;
  if (st.crew.includes('nami')) berry = Math.round(berry * 1.25);
  const coins = e.boss ? 6 : 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < coins; i++) {
    const a = Math.random() * Math.PI * 2;
    G.pickups.push({
      type: 'berry', amount: Math.max(1, Math.round(berry / coins)),
      x: e.x + Math.cos(a) * 14, y: e.y + Math.sin(a) * 14,
      vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, ttl: 40,
    });
  }
  // Seltener Teufelsfrucht-Drop
  const dropChance = e.boss ? 0.10 : 0.012;
  if (Math.random() < dropChance) {
    const owned = new Set(st.inventory.fruits.concat(st.fruit ? [st.fruit] : []));
    const pool = FRUIT_IDS.filter(f => !owned.has(f));
    if (pool.length) {
      G.pickups.push({
        type: 'fruit', fruitId: pool[Math.floor(Math.random() * pool.length)],
        x: e.x, y: e.y, vx: 0, vy: -30, ttl: 60,
      });
    }
  }

  if (e.boss) bossDefeated(e);
  updateHUD();
}

function bossDefeated(e) {
  const st = G.state;
  const boss = BOSSES[e.bossId];
  st.flags['boss_' + e.bossId] = true;
  st.bounty = Math.max(st.bounty, boss.bounty);
  const lines = boss.defeated.concat([
    'Dein Kopfgeld steigt auf ' + boss.bounty.toLocaleString('de-DE') + ' Berry!',
  ]);
  say(boss.name, lines);
  autoSave();
}

function dealToPlayer(e, raw) {
  const st = G.state;
  if (G.iframes > 0) return;
  // Ausweichen
  if (Math.random() < playerDodge(st)) {
    addFloater(G.px, G.py - 44, 'Ausgewichen!', '#9fc2e8');
    return;
  }
  let dmg = Math.max(1, Math.round(raw - playerDef(st) * 0.5));
  dmg = Math.round(dmg * (1 - 0.06 * st.haki.arm));
  dmg = Math.round(dmg * (fruitPassive(st).takenMult || 1));
  dmg = Math.max(1, dmg);
  st.hp -= dmg;
  G.iframes = 0.6;
  G.hitFlash = 0.25;
  addFloater(G.px, G.py - 44, '-' + dmg, '#ff7b7b');

  // Dornen-Reflex
  const thorns = fruitPassive(st).thorns || 0;
  if (thorns > 0) dealToEnemy(e, raw * thorns, null, null, true);

  if (st.hp <= 0) {
    if (st.crew.includes('chopper') && !G.usedRevive) {
      G.usedRevive = true;
      st.hp = Math.round(playerMaxHp(st) * 0.4);
      addFloater(G.px, G.py - 56, 'Chopper rettet dich!', '#7ae582');
    } else {
      st.hp = 0;
      playerDefeated();
    }
  }
  updateHUD();
}

// ---------------------------------------------------------------
//  Spieler-Angriffe
// ---------------------------------------------------------------
// Blickrichtung aus der Kamera (Ego-Perspektive): Winkel auf der Kachelebene
function facingAngle() {
  const f = forwardVec();
  return Math.atan2(f.y, f.x);
}

function playerAttack() {
  const st = G.state;
  if (G.atkCd > 0) return;
  G.atkCd = 0.38;

  if (st.onShip) {
    // Kanonenschuss
    const a = facingAngle();
    G.projs.push({
      x: G.px, y: G.py - 8,
      vx: Math.cos(a) * 420, vy: Math.sin(a) * 420,
      dmg: playerAtk(st) * 1.3, range: 380, traveled: 0,
      friendly: true, color: '#26262e', r: 7,
    });
    G.fx.push({ type: 'muzzle', x: G.px + Math.cos(a) * 30, y: G.py - 8 + Math.sin(a) * 30, t: 0.12 });
    return;
  }

  const a = facingAngle();
  G.fx.push({ type: 'slash', x: G.px, y: G.py - 14, dir: a, t: 0.18 });
  meleeHit(a, 56, 1.0, null, 1.35);
}

// Nahkampf-Treffer in Blickrichtung: range px, mult Schaden, fx Effekt, arc Bogenbreite
function meleeHit(angle, range, mult, fx, arc) {
  const st = G.state;
  const atk = playerAtk(st);
  for (const e of G.enemies.slice()) {
    const dx = e.x - G.px, dy = (e.y - 14) - (G.py - 14);
    const d = Math.hypot(dx, dy);
    if (d > range + e.r) continue;
    const da = Math.abs(normAngle(Math.atan2(dy, dx) - angle));
    if (d > 20 && da > (arc || 1.2)) continue;
    dealToEnemy(e, atk * mult * (0.9 + Math.random() * 0.2), fx, angle);
  }
}
function normAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function castSkill(slot) {
  const st = G.state;
  if (!st.fruit) {
    addFloater(G.px, G.py - 50, 'Keine Teufelsfrucht!', '#9fc2e8');
    return;
  }
  const skill = FRUITS[st.fruit].skills[slot];
  if (!skill) return;
  if (G.skillCd[slot] > 0) return;
  if (G.stamina < skill.cost) {
    addFloater(G.px, G.py - 50, 'Zu erschöpft!', '#9fc2e8');
    return;
  }
  G.stamina -= skill.cost;
  G.skillCd[slot] = skill.cd;
  const atk = playerAtk(st);
  const a = facingAngle();

  if (skill.kind === 'proj') {
    G.projs.push({
      x: G.px, y: G.py - 14,
      vx: Math.cos(a) * skill.speed, vy: Math.sin(a) * skill.speed,
      dmg: atk * skill.mult, range: skill.range, traveled: 0,
      friendly: true, color: skill.color, r: 9, fx: skill.fx,
    });
  } else if (skill.kind === 'aoe') {
    G.fx.push({ type: 'aoe', x: G.px, y: G.py - 10, radius: skill.radius, color: skill.color, t: 0.45 });
    for (const e of G.enemies.slice()) {
      const d = Math.hypot(e.x - G.px, e.y - G.py);
      if (d <= skill.radius + e.r) {
        dealToEnemy(e, atk * skill.mult * (0.9 + Math.random() * 0.2), skill.fx,
          Math.atan2(e.y - G.py, e.x - G.px));
      }
    }
  } else if (skill.kind === 'melee') {
    G.fx.push({ type: 'slash', x: G.px, y: G.py - 14, dir: a, t: 0.22, color: skill.color, big: true });
    meleeHit(a, 80, skill.mult, skill.fx, 1.5);
  } else if (skill.kind === 'dash') {
    const dashLen = 130;
    G.fx.push({ type: 'dash', x: G.px, y: G.py, x2: G.px + Math.cos(a) * dashLen, y2: G.py + Math.sin(a) * dashLen, color: skill.color, t: 0.25 });
    // Schaden entlang der Strecke
    for (const e of G.enemies.slice()) {
      const t = projectOnSegment(G.px, G.py, Math.cos(a), Math.sin(a), dashLen, e.x, e.y);
      if (t !== null && t < 40 + e.r) {
        dealToEnemy(e, atk * skill.mult * (0.9 + Math.random() * 0.2), skill.fx,
          Math.atan2(e.y - G.py, e.x - G.px));
      }
    }
    // Teleport ans Ende (nur wenn frei)
    const tx = G.px + Math.cos(a) * dashLen, ty = G.py + Math.sin(a) * dashLen;
    if (!playerBlocked(tx, ty)) { G.px = tx; G.py = ty; }
  }
  updateHUD();
}

function projectOnSegment(x0, y0, ux, uy, len, px, py) {
  const dx = px - x0, dy = py - y0;
  const t = dx * ux + dy * uy;
  if (t < 0 || t > len) return null;
  const cx = x0 + ux * t, cy = y0 + uy * t;
  return Math.hypot(px - cx, py - cy);
}

function conquerorWave() {
  const st = G.state;
  if (st.haki.conq <= 0) return;
  if (G.conqCd > 0 || G.stamina < 40) return;
  G.stamina -= 40;
  G.conqCd = 18;
  const radius = 150 + st.haki.conq * 25;
  G.fx.push({ type: 'aoe', x: G.px, y: G.py - 10, radius, color: '#c84af0', t: 0.6 });
  addFloater(G.px, G.py - 56, 'KÖNIGSHAKI!', '#c84af0');
  for (const e of G.enemies.slice()) {
    const d = Math.hypot(e.x - G.px, e.y - G.py);
    if (d <= radius + e.r) {
      e.stun = Math.max(e.stun, 2.2 + st.haki.conq * 0.3);
      dealToEnemy(e, playerAtk(st) * (0.8 + st.haki.conq * 0.25), null,
        Math.atan2(e.y - G.py, e.x - G.px));
    }
  }
  updateHUD();
}

// ---------------------------------------------------------------
//  Crew kämpft mit
// ---------------------------------------------------------------
function updateCrewFighters(dt) {
  const st = G.state;
  if (st.onShip) return;
  G.crewCd -= dt;
  if (G.crewCd > 0) return;
  G.crewCd = 1.4;
  let i = 0;
  for (const id of st.crew) {
    const mult = CREW_FIGHTERS[id];
    i++;
    if (!mult) continue;
    const pos = trailPoint(G, i * 34);
    if (!pos) continue;
    // nächstes Ziel
    let best = null, bd = 240;
    for (const e of G.enemies) {
      if (!e.aggro) continue;
      const d = Math.hypot(e.x - pos.x, e.y - pos.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (best) {
      const a = Math.atan2(best.y - pos.y, best.x - pos.x);
      G.projs.push({
        x: pos.x, y: pos.y - 14,
        vx: Math.cos(a) * 380, vy: Math.sin(a) * 380,
        dmg: playerAtk(st) * mult, range: 280, traveled: 0,
        friendly: true, color: id === 'zorro' ? '#7ae582' : id === 'jinbe' ? '#5a8ac8' : '#e8c468', r: 5,
      });
    }
  }
}

// ---------------------------------------------------------------
//  Projektile & Pickups
// ---------------------------------------------------------------
function updateProjectiles(dt) {
  const st = G.state;
  for (const p of G.projs) {
    const step = Math.hypot(p.vx, p.vy) * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.traveled += step;
    if (p.traveled > p.range) { p.dead = true; continue; }
    // Landtreffer für Kanonenkugeln
    const t = tileAtPx(p.x, p.y);
    if (t === T.TREE || t === T.ROCK || t === T.HOUSE || t === T.BASE) { p.dead = true; continue; }

    if (p.friendly) {
      for (const e of G.enemies) {
        if (Math.hypot(e.x - p.x, (e.y - 12) - p.y) < e.r + p.r) {
          dealToEnemy(e, p.dmg * (0.9 + Math.random() * 0.2), p.fx, Math.atan2(p.vy, p.vx));
          p.dead = true;
          break;
        }
      }
    } else {
      if (Math.hypot(G.px - p.x, (G.py - 12) - p.y) < 16 + p.r) {
        dealToPlayer({ atk: p.dmg, def: 0 }, p.dmg);
        p.dead = true;
      }
    }
  }
  G.projs = G.projs.filter(p => !p.dead);
}

function updatePickups(dt) {
  const st = G.state;
  for (const p of G.pickups) {
    p.ttl -= dt;
    if (p.ttl <= 0) { p.dead = true; continue; }
    // Reibung
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= Math.pow(0.05, dt); p.vy *= Math.pow(0.05, dt);
    const d = Math.hypot(G.px - p.x, G.py - p.y);
    // Magnet
    if (d < 90) {
      p.x += (G.px - p.x) / d * 260 * dt;
      p.y += (G.py - p.y) / d * 260 * dt;
    }
    if (d < 26) {
      p.dead = true;
      if (p.type === 'berry') {
        st.berries += p.amount;
        addFloater(G.px, G.py - 40, '+' + p.amount.toLocaleString('de-DE') + ' B', '#ffd166');
      } else if (p.type === 'fruit') {
        st.inventory.fruits.push(p.fruitId);
        say('Teufelsfrucht!', ['Du hast die ' + FRUITS[p.fruitId].name + ' erbeutet!',
          FRUITS[p.fruitId].desc, 'Öffne das Menü (ESC) → Beutel, um sie zu essen.']);
        autoSave();
      }
      updateHUD();
    }
  }
  G.pickups = G.pickups.filter(p => !p.dead);
}

function addFloater(x, y, text, color) {
  G.floaters.push({ x: x + (Math.random() * 16 - 8), y, text, color, ttl: 1.1 });
  if (G.floaters.length > 40) G.floaters.shift();
}

function updateEffects(dt) {
  for (const f of G.floaters) { f.ttl -= dt; f.y -= 34 * dt; }
  G.floaters = G.floaters.filter(f => f.ttl > 0);
  for (const f of G.fx) f.t -= dt;
  G.fx = G.fx.filter(f => f.t > 0);
}

// Haupt-Update des Kampfsystems
let popTimer = 0;
function updateCombat(dt, time) {
  popTimer -= dt;
  if (popTimer <= 0) { popTimer = 0.6; updatePopulation(); }

  G.atkCd = Math.max(0, G.atkCd - dt);
  G.conqCd = Math.max(0, G.conqCd - dt);
  G.skillCd[0] = Math.max(0, G.skillCd[0] - dt);
  G.skillCd[1] = Math.max(0, G.skillCd[1] - dt);
  G.iframes = Math.max(0, G.iframes - dt);
  G.hitFlash = Math.max(0, G.hitFlash - dt);

  const st = G.state;
  // Ausdauer-Regeneration
  G.stamina = Math.min(100, G.stamina + 14 * dt);
  // Passive Heilung (Phönix / Sanji außerhalb des Kampfes)
  const regen = (fruitPassive(st).regen || 0) +
    (st.crew.includes('sanji') && !G.enemies.some(e => e.aggro) ? 0.02 : 0);
  if (regen > 0 && st.hp < playerMaxHp(st)) {
    G.regenAcc = (G.regenAcc || 0) + playerMaxHp(st) * regen * dt;
    if (G.regenAcc >= 1) {
      st.hp = Math.min(playerMaxHp(st), st.hp + Math.floor(G.regenAcc));
      G.regenAcc -= Math.floor(G.regenAcc);
    }
  }

  updateEnemies(dt, time);
  updateCrewFighters(dt);
  updateProjectiles(dt);
  updatePickups(dt);
  updateEffects(dt);
}

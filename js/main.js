// =====================================================================
//  Haupt-Engine: Spielschleife, freie Bewegung, Interaktion, Menüs
// =====================================================================
'use strict';

function el(id) { return document.getElementById(id); }

const SAVE_KEY = 'onepiece_save_v2';
const SETTINGS_KEY = 'onepiece_settings_v1';
const HAKI_COSTS = [2000, 6000, 15000, 40000, 100000];

const G = {
  mode: 'title',       // title | create | world | dialog | menu | shop | credits
  state: null,
  px: 0, py: 0,        // Spielerposition (Pixel, Fußpunkt)
  facing: 'down',
  yaw: Math.PI, pitch: 0,   // Ego-Kamera
  jumpY: 0, jumpV: 0,
  pointerLocked: false,
  isMoving: false,
  trail: [],
  keys: {},
  dlg: null,
  bannerTimeout: null,
  shopMode: null,
  menuTab: 'status',
  lastTime: 0,
  lastIsland: null,
  lastTileKey: '',
  interactHint: null,
  camX: 0, camY: 0,
  mouseSensMult: 1,
  // Kampf-Zustand (nicht gespeichert)
  enemies: [], projs: [], pickups: [], floaters: [], fx: [],
  populated: {},
  stamina: 100, atkCd: 0, skillCd: [0, 0], conqCd: 0,
  iframes: 0, hitFlash: 0, usedRevive: false, crewCd: 0,
};

// ---------------------------------------------------------------
//  Einstellungen (Lautstärke, Mausempfindlichkeit) — unabhängig vom Spielstand
// ---------------------------------------------------------------
function loadSettings() {
  let s = { volume: 0.5, muted: false, mouseSens: 1 };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) s = Object.assign(s, JSON.parse(raw));
  } catch (e) { /* ignorieren, Standardwerte nutzen */ }
  SFX.setVolume(s.volume);
  SFX.setEnabled(!s.muted);
  G.mouseSensMult = s.mouseSens;
  return s;
}
function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) { /* voll */ }
}

// ---------------------------------------------------------------
//  Spielzustand
// ---------------------------------------------------------------
function newState(name, look) {
  return {
    version: 2,
    name, look,
    lvl: 1, xp: 0, hp: 0,
    berries: 300, bounty: 0,
    haki: { arm: 0, obs: 0, conq: 0 },
    fruit: null,
    inventory: { items: { meat: 3 }, fruits: [] },
    crew: [],
    ship: 0, onShip: false,
    px: 40 * TS + TS / 2, py: 203 * TS,
    facing: 'down',
    flags: {},
    openedChests: {},
    discovered: {},
    respawn: { x: 40 * TS + TS / 2, y: 203 * TS },
    merchantSeed: 1,
  };
}

function gainXp(xp) {
  const st = G.state;
  st.xp += xp;
  const msgs = [];
  let need = xpNeed(st.lvl);
  while (st.xp >= need) {
    st.xp -= need;
    st.lvl++;
    st.hp = playerMaxHp(st);
    msgs.push('LEVEL ' + st.lvl + '!');
    need = xpNeed(st.lvl);
  }
  if (msgs.length) { updateSkillbar(); SFX.levelup(); }
  return msgs;
}
function xpNeed(lvl) { return Math.round(lvl * lvl * 14 + lvl * 12); }

function questDone(flag) {
  const st = G.state;
  if (flag === 'has_ship') return st.ship >= 1;
  if (flag === 'ship2') return st.ship >= 2;
  if (flag === 'ship3') return st.ship >= 3;
  if (flag.startsWith('crew_')) return st.crew.includes(flag.slice(5));
  return !!st.flags[flag];
}
function questText() {
  for (const q of QUESTS) if (!questDone(q.flag)) return q.text;
  return 'Du bist der König der Piraten! Erkunde deine Welt.';
}

// ---------------------------------------------------------------
//  Speichern / Laden
// ---------------------------------------------------------------
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } catch (e) { /* voll */ }
}
function autoSave() { if (G.state) saveGame(); }
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const st = JSON.parse(raw);
    if (!st || !st.name || !st.look || st.version !== 2) return null;
    return st;
  } catch (e) { return null; }
}

// ---------------------------------------------------------------
//  Dialoge
// ---------------------------------------------------------------
function say(name, lines, cb) {
  G.dlg = { name, lines: lines.slice(), cb: cb || null };
  G.mode = 'dialog';
  el('dialog').classList.remove('hidden');
  el('dlgname').textContent = name || '';
  el('dlgtext').textContent = G.dlg.lines.shift();
}
function advanceDialog() {
  if (!G.dlg) return;
  if (G.dlg.lines.length) {
    el('dlgtext').textContent = G.dlg.lines.shift();
  } else {
    const cb = G.dlg.cb;
    G.dlg = null;
    el('dialog').classList.add('hidden');
    G.mode = 'world';
    updateHUD();
    if (cb) cb();
  }
}

// ---------------------------------------------------------------
//  Bewegung (frei, pixelbasiert)
// ---------------------------------------------------------------
function tileBlocksPlayer(t) {
  const st = G.state;
  if (WATER_TILES.has(t)) {
    return !(st.onShip && SHIPS[st.ship].tiles.includes(t));
  }
  if (WALKABLE.has(t)) return false;
  return true;
}
function playerBlocked(x, y) {
  const r = 10;
  return tileBlocksPlayer(tileAtPx(x - r, y - 4)) ||
         tileBlocksPlayer(tileAtPx(x + r, y - 4)) ||
         tileBlocksPlayer(tileAtPx(x - r, y + r * 0.6)) ||
         tileBlocksPlayer(tileAtPx(x + r, y + r * 0.6));
}

// Blickrichtung der Kamera auf der Kachelebene (px-Koordinaten)
function forwardVec() {
  return { x: -Math.sin(G.yaw), y: -Math.cos(G.yaw) };
}

function updateMovement(dt) {
  const st = G.state;
  const f = forwardVec();
  const rx = -f.y, ry = f.x; // Rechts-Vektor der Kamera
  let vx = 0, vy = 0;
  if (G.keys.up)    { vx += f.x; vy += f.y; }
  if (G.keys.down)  { vx -= f.x; vy -= f.y; }
  if (G.keys.right) { vx += rx; vy += ry; }
  if (G.keys.left)  { vx -= rx; vy -= ry; }

  // Sprung (kosmetisch, Minecraft-Feeling)
  if (G.jumpY > 0 || G.jumpV !== 0) {
    G.jumpV -= 14 * dt;
    G.jumpY += G.jumpV * dt;
    if (G.jumpY <= 0) { G.jumpY = 0; G.jumpV = 0; }
  }

  G.isMoving = !!(vx || vy);
  if (!G.isMoving) return;

  const len = Math.hypot(vx, vy);
  vx /= len; vy /= len;
  const sp = playerSpeed(st);

  const nx = G.px + vx * sp * dt;
  const ny = G.py + vy * sp * dt;
  if (!playerBlocked(nx, G.py)) G.px = nx;
  if (!playerBlocked(G.px, ny)) G.py = ny;
  G.px = Math.max(12, Math.min(WORLD_W * TS - 12, G.px));
  G.py = Math.max(12, Math.min(WORLD_H * TS - 12, G.py));

  // Für Speicherstand & Altsysteme grobe Blickrichtung merken
  G.facing = Math.abs(f.x) >= Math.abs(f.y) ? (f.x > 0 ? 'right' : 'left') : (f.y > 0 ? 'down' : 'up');
  st.facing = G.facing;
  st.px = G.px; st.py = G.py;
  st.yaw = G.yaw;

  // Lauf-Spur für Crew-Begleiter
  const last = G.trail[0];
  if (!last || Math.hypot(G.px - last.x, G.py - last.y) > 12) {
    G.trail.unshift({ x: G.px, y: G.py, dir: G.facing });
    if (G.trail.length > 60) G.trail.pop();
  }

  onTileMaybeChanged();
}

function onTileMaybeChanged() {
  const st = G.state;
  const tx = Math.floor(G.px / TS), ty = Math.floor(G.py / TS);
  const key = tx + ',' + ty;
  if (key === G.lastTileKey) return;
  G.lastTileKey = key;
  const t = tileAt(tx, ty);

  // vom Schiff an Land gehen
  if (st.onShip && WALKABLE.has(t)) st.onShip = false;
  if (t === T.PATH) st.respawn = { x: G.px, y: G.py };

  const il = islandAt(tx, ty);
  const ilId = il ? il.id : null;
  if (ilId && ilId !== G.lastIsland) {
    if (!st.discovered[ilId]) {
      st.discovered[ilId] = true;
      st.bounty += 5000; // Entdecker-Bonus
    }
    showBanner(il.name);
  }
  G.lastIsland = ilId;
}

function showBanner(text) {
  const b = el('banner');
  b.textContent = text;
  b.classList.remove('hidden');
  clearTimeout(G.bannerTimeout);
  G.bannerTimeout = setTimeout(() => b.classList.add('hidden'), 2500);
}

// ---------------------------------------------------------------
//  Interaktion
// ---------------------------------------------------------------
function findInteractable() {
  const st = G.state;
  let best = null, bd = 60;
  for (const n of World.npcs) {
    if (npcHidden(n, st)) continue;
    const nx = n.x * TS + TS / 2, ny = n.y * TS + TS / 2;
    const d = Math.hypot(nx - G.px, ny - G.py);
    if (d < bd) { bd = d; best = { type: 'npc', npc: n, x: nx, y: ny, label: n.def.name }; }
  }
  for (const ch of World.chests) {
    if (st.openedChests[ch.key]) continue;
    const cx = ch.x * TS + TS / 2, cy = ch.y * TS + TS / 2;
    const d = Math.hypot(cx - G.px, cy - G.py);
    if (d < bd) { bd = d; best = { type: 'chest', chest: ch, x: cx, y: cy, label: 'Schatztruhe' }; }
  }
  for (const e of G.enemies) {
    if (!e.boss || e.aggro) continue;
    const d = Math.hypot(e.x - G.px, e.y - G.py);
    if (d < Math.max(bd, 80)) { bd = d; best = { type: 'boss', enemy: e, x: e.x, y: e.y, label: e.name }; }
  }
  // Laden-Tür
  const fv = forwardVec();
  const sx = G.px + fv.x * 40, sy = G.py + fv.y * 40;
  if (!best && tileAtPx(sx, sy) === T.SHOP) best = { type: 'shop', x: sx, y: sy, label: 'Laden' };
  return best;
}

function interact() {
  const st = G.state;
  const target = findInteractable();
  if (target) {
    if (target.type === 'npc') { npcInteract(target.npc); return; }
    if (target.type === 'chest') { openChest(target.chest); return; }
    if (target.type === 'shop') { openShop(); return; }
    if (target.type === 'boss') {
      const e = target.enemy;
      const boss = BOSSES[e.bossId];
      say(boss.name, boss.intro, () => { e.aggro = true; });
      return;
    }
  }

  // In See stechen
  const fv = forwardVec();
  const wx = G.px + fv.x * 50, wy = G.py + fv.y * 50;
  const t = tileAtPx(wx, wy);
  if (WATER_TILES.has(t) && !st.onShip) {
    if (st.ship === 0) {
      say('', ['Ohne Schiff kannst du nicht aufs Meer hinaus.', 'Der Schiffsbauer im Windmühlendorf verkauft Beiboote.']);
    } else if (!SHIPS[st.ship].tiles.includes(t)) {
      const need = t === T.S
        ? 'Die Sturmsee der Neuen Welt! Nur die Thousand Sunny übersteht das.'
        : 'Die Tiefsee der Grand Line ist zu gefährlich! Du brauchst die Going Merry aus Loguetown.';
      say('', [need]);
    } else {
      st.onShip = true;
      G.px = wx; G.py = wy;
      st.px = wx; st.py = wy;
    }
  }
}

function npcInteract(npc) {
  const st = G.state;
  const d = npc.def;
  switch (d.type) {
    case 'talk':
      say(d.name, d.lines);
      break;
    case 'inn':
      say(d.name, d.lines, () => {
        st.hp = playerMaxHp(st);
        G.stamina = 100;
        st.respawn = { x: G.px, y: G.py };
        say('', ['Du bist vollständig ausgeruht! KP und Ausdauer wiederhergestellt.']);
      });
      break;
    case 'mayor':
      if (!st.flags.boss_higuma) {
        say(d.name, ['Der Bandit Higuma treibt sein Unwesen im Nordwald!', 'Wenn du ihn vertreibst, gebe ich dir 500 Berry Belohnung!']);
      } else if (!st.flags.mayor_reward) {
        st.flags.mayor_reward = true;
        st.berries += 500;
        say(d.name, ['Du hast Higuma vertrieben! Das Dorf dankt dir!', 'Hier, 500 Berry — hochverdient!']);
      } else {
        say(d.name, ['Werde ein Pirat, auf den das Dorf stolz sein kann!']);
      }
      break;
    case 'crew': {
      const c = CREW[d.crew];
      if (st.crew.includes(d.crew)) { say(c.name, ['Ich bin Teil deiner Crew! Auf zum nächsten Abenteuer!']); break; }
      const ok = (d.needFlag ? !!st.flags[d.needFlag] : true) && (d.needCrew ? st.crew.length >= d.needCrew : true);
      if (!ok) { say(c.name, d.wait); break; }
      say(c.name, d.ask, () => {
        st.crew.push(d.crew);
        say('', [c.name + ' (' + c.role + ') schließt sich deiner Crew an!', 'Bonus: ' + c.bonus]);
        autoSave();
      });
      break;
    }
    case 'ship': {
      const sale = d.sale;
      const ship = SHIPS[sale.ship];
      if (st.ship >= sale.ship) { say(d.name, ['Dein Schiff ist bestens in Schuss! Gute Fahrt!']); break; }
      if (sale.needCrew && !st.crew.includes(sale.needCrew)) {
        say(d.name, ['Die Thousand Sunny kann nur ein wahrer Meister bauen.', 'Hol dir Franky in die Crew, dann legen wir los!']);
        break;
      }
      if (st.berries < sale.price) {
        say(d.name, ['Die ' + ship.name + ' kostet ' + sale.price.toLocaleString('de-DE') + ' Berry.', 'So viel hast du nicht dabei!']);
        break;
      }
      say(d.name, ['Die ' + ship.name + ' für ' + sale.price.toLocaleString('de-DE') + ' Berry — abgemacht?'], () => {
        st.berries -= sale.price;
        st.ship = sale.ship;
        say('', ['Du hast die ' + ship.name + ' erhalten!', 'Stell dich ans Wasser und drücke E, um in See zu stechen!']);
        autoSave();
      });
      break;
    }
    case 'haki':
      if (st.lvl < 10) {
        say(d.name, ['Ich bin Silvers Rayleigh, die "Rechte Hand des Piratenkönigs".', 'Haki schlummert in jedem — aber du bist noch zu schwach.', 'Komm mit Level 10 wieder!']);
      } else {
        say(d.name, ['Haki — die Kraft des Willens. Ich kann sie in dir wecken.'], openHakiMenu);
      }
      break;
    case 'merchant':
      say(d.name, ['Psst... ich habe Ware, die es offiziell gar nicht gibt.', 'Teufelsfrüchte. Frisch... naja, relativ frisch.'], openMerchant);
      break;
  }
}

function openChest(chest) {
  const st = G.state;
  if (!chest || st.openedChests[chest.key]) return;
  const c = chest.content;
  if (c.special === 'onepiece') {
    if (!st.flags.boss_blackbeard) {
      say('', ['Eine gewaltige Schatzkammer... doch eine dunkle Aura versperrt den Weg.', 'Besiege Blackbeard, um das One Piece zu beanspruchen!']);
      return;
    }
    winGame();
    return;
  }
  st.openedChests[chest.key] = true;
  setTile(chest.x, chest.y, T.CHEST_OPEN);
  dirtyTile3D(chest.x, chest.y);
  if (c.berry) {
    st.berries += c.berry;
    say('Schatztruhe', ['Du findest ' + c.berry.toLocaleString('de-DE') + ' Berry!']);
  } else if (c.item) {
    st.inventory.items[c.item] = (st.inventory.items[c.item] || 0) + (c.qty || 1);
    say('Schatztruhe', ['Du findest ' + ITEMS[c.item].name + ' ×' + (c.qty || 1) + '!']);
  } else if (c.fruit) {
    st.inventory.fruits.push(c.fruit);
    say('Schatztruhe', ['Eine seltsam gemusterte Frucht...', 'Du findest die ' + FRUITS[c.fruit].name + ' (' + FRUITS[c.fruit].type + ')!', FRUITS[c.fruit].desc, 'Öffne das Menü (ESC) → Beutel, um sie zu essen.']);
  }
  autoSave();
  updateHUD();
}

// ---------------------------------------------------------------
//  Shop / Haki / Schwarzmarkt
// ---------------------------------------------------------------
function openShop() {
  releasePointer();
  G.mode = 'shop'; G.shopMode = 'shop';
  el('shop').classList.remove('hidden');
  el('shoptitle').textContent = 'Laden';
  renderShop();
}
function renderShop() {
  const st = G.state;
  el('shopberry').textContent = 'Dein Geld: ' + st.berries.toLocaleString('de-DE') + ' Berry';
  const wrap = el('shopitems');
  wrap.innerHTML = '';
  for (const id of DEFAULT_SHOP) {
    const item = ITEMS[id];
    const row = document.createElement('div');
    row.className = 'mline';
    row.innerHTML = '<span>' + item.name + ' — ' + item.price + ' B</span><span class="desc">' + item.desc + '</span>';
    const btn = document.createElement('button');
    btn.className = 'mbtn'; btn.textContent = 'Kaufen';
    btn.disabled = st.berries < item.price;
    btn.onclick = () => {
      st.berries -= item.price;
      st.inventory.items[id] = (st.inventory.items[id] || 0) + 1;
      renderShop(); updateHUD(); autoSave();
    };
    row.appendChild(btn);
    wrap.appendChild(row);
  }
}

function openHakiMenu() {
  releasePointer();
  G.mode = 'shop'; G.shopMode = 'haki';
  el('shop').classList.remove('hidden');
  el('shoptitle').textContent = 'Haki-Training bei Rayleigh';
  renderHaki();
}
function renderHaki() {
  const st = G.state;
  el('shopberry').textContent = 'Dein Geld: ' + st.berries.toLocaleString('de-DE') + ' Berry';
  const wrap = el('shopitems');
  wrap.innerHTML = '';
  const defs = [
    { key: 'arm', name: 'Rüstungshaki', desc: '+8% Schaden & −6% erlittener Schaden pro Stufe.' },
    { key: 'obs', name: 'Observationshaki', desc: '+5% Ausweichchance pro Stufe.' },
    { key: 'conq', name: 'Königshaki', desc: 'Schockwelle (Taste 3): betäubt alle Gegner im Umkreis.', locked: !st.flags.boss_akainu, lockText: 'Nur die Stärksten tragen Königshaki. Besiege Flottenadmiral Akainu in Marineford!' },
  ];
  for (const h of defs) {
    const lvl = st.haki[h.key];
    const row = document.createElement('div');
    row.className = 'mline';
    if (h.locked) {
      row.innerHTML = '<span>' + h.name + ' 🔒</span><span class="desc">' + h.lockText + '</span>';
    } else if (lvl >= 5) {
      row.innerHTML = '<span>' + h.name + ' (Stufe 5 — MAX)</span><span class="desc">' + h.desc + '</span>';
    } else {
      const cost = HAKI_COSTS[lvl];
      row.innerHTML = '<span>' + h.name + ' (Stufe ' + lvl + ')</span><span class="desc">' + h.desc + '</span>';
      const btn = document.createElement('button');
      btn.className = 'mbtn';
      btn.textContent = 'Trainieren (' + cost.toLocaleString('de-DE') + ' B)';
      btn.disabled = st.berries < cost;
      btn.onclick = () => {
        st.berries -= cost;
        st.haki[h.key]++;
        renderHaki(); updateHUD(); updateSkillbar(); autoSave();
      };
      row.appendChild(btn);
    }
    wrap.appendChild(row);
  }
}

function merchantOffers() {
  const st = G.state;
  const owned = new Set(st.inventory.fruits.concat(st.fruit ? [st.fruit] : []));
  const pool = FRUIT_IDS.filter(f => !owned.has(f));
  const offers = [];
  for (let i = 0; i < 4 && pool.length; i++) {
    const pick = Math.floor(hashNoise(st.merchantSeed, i, 99) * pool.length);
    offers.push(pool.splice(pick, 1)[0]);
  }
  return offers;
}
function openMerchant() {
  releasePointer();
  G.mode = 'shop'; G.shopMode = 'merchant';
  el('shop').classList.remove('hidden');
  el('shoptitle').textContent = 'Schwarzmarkt — Teufelsfrüchte';
  renderMerchant();
}
function renderMerchant() {
  const st = G.state;
  el('shopberry').textContent = 'Dein Geld: ' + st.berries.toLocaleString('de-DE') + ' Berry';
  const wrap = el('shopitems');
  wrap.innerHTML = '';

  const h1 = document.createElement('div');
  h1.innerHTML = '<h3 style="color:#ffd166;margin:4px 0 6px">Aktuelles Angebot (' + MERCHANT_PRICE.toLocaleString('de-DE') + ' B pro Frucht)</h3>';
  wrap.appendChild(h1);
  for (const fid of merchantOffers()) {
    const f = FRUITS[fid];
    const row = document.createElement('div');
    row.className = 'mline';
    row.innerHTML = '<span><b>' + f.name + '</b> <span style="color:#c88af0">(' + f.type + ')</span></span><span class="desc">' + f.desc + '</span>';
    const btn = document.createElement('button');
    btn.className = 'mbtn'; btn.textContent = 'Kaufen';
    btn.disabled = st.berries < MERCHANT_PRICE;
    btn.onclick = () => {
      st.berries -= MERCHANT_PRICE;
      st.inventory.fruits.push(fid);
      st.merchantSeed++;
      renderMerchant(); updateHUD(); autoSave();
    };
    row.appendChild(btn);
    wrap.appendChild(row);
  }
  const reroll = document.createElement('button');
  reroll.className = 'mbtn';
  reroll.textContent = 'Neues Angebot (5.000 B)';
  reroll.disabled = st.berries < 5000;
  reroll.onclick = () => { st.berries -= 5000; st.merchantSeed++; renderMerchant(); updateHUD(); };
  wrap.appendChild(reroll);

  if (st.inventory.fruits.length) {
    const h2 = document.createElement('div');
    h2.innerHTML = '<h3 style="color:#ffd166;margin:14px 0 6px">Deine Früchte verkaufen (' + FRUIT_SELL_PRICE.toLocaleString('de-DE') + ' B)</h3>';
    wrap.appendChild(h2);
    st.inventory.fruits.forEach((fid, i) => {
      const f = FRUITS[fid];
      const row = document.createElement('div');
      row.className = 'mline';
      row.innerHTML = '<span>' + f.name + '</span><span class="desc">' + f.desc + '</span>';
      const btn = document.createElement('button');
      btn.className = 'mbtn'; btn.textContent = 'Verkaufen';
      btn.onclick = () => {
        st.inventory.fruits.splice(i, 1);
        st.berries += FRUIT_SELL_PRICE;
        renderMerchant(); updateHUD(); autoSave();
      };
      row.appendChild(btn);
      wrap.appendChild(row);
    });
  }
}
function closeShop() {
  el('shop').classList.add('hidden');
  G.mode = 'world';
  updateHUD();
  grabPointer();
}

// ---------------------------------------------------------------
//  Hauptmenü
// ---------------------------------------------------------------
const MENU_TABS = [
  ['status', 'Status'], ['crew', 'Crew'], ['bag', 'Beutel'],
  ['map', 'Karte'], ['help', 'Hilfe'], ['settings', 'Einstellungen'], ['save', 'Speichern'],
];
function openMenu() {
  releasePointer();
  G.mode = 'menu';
  el('menu').classList.remove('hidden');
  renderMenu(G.menuTab);
}
function closeMenu() {
  el('menu').classList.add('hidden');
  G.mode = 'world';
  updateHUD();
  grabPointer();
}
function renderMenu(tab) {
  G.menuTab = tab;
  const tabs = el('menutabs');
  tabs.innerHTML = '';
  for (const [id, label] of MENU_TABS) {
    const t = document.createElement('div');
    t.className = 'tab' + (id === tab ? ' active' : '');
    t.textContent = label;
    t.onclick = () => { SFX.click(); renderMenu(id); };
    tabs.appendChild(t);
  }
  const body = el('menubody');
  body.innerHTML = '';
  const st = G.state;

  if (tab === 'status') {
    const f = st.fruit ? FRUITS[st.fruit] : null;
    body.innerHTML =
      '<h3>' + st.name + ' — Level ' + st.lvl + '</h3>' +
      'KP: ' + Math.round(st.hp) + ' / ' + playerMaxHp(st) + '<br>' +
      'Angriff: ' + Math.round(playerAtk(st)) + ' &middot; Verteidigung: ' + Math.round(playerDef(st)) +
      ' &middot; Ausweichen: ' + Math.round(playerDodge(st) * 100) + '%<br>' +
      'EP: ' + st.xp + ' / ' + xpNeed(st.lvl) + '<br><br>' +
      'Kopfgeld: <b style="color:#ffd166">' + st.bounty.toLocaleString('de-DE') + ' Berry</b><br>' +
      'Geld: ' + st.berries.toLocaleString('de-DE') + ' Berry<br>' +
      'Teufelsfrucht: ' + (f ? f.name + ' (' + f.type + ')' : '—') + '<br>' +
      'Schiff: ' + SHIPS[st.ship].name + '<br>' +
      'Haki — Rüstung: ' + st.haki.arm + ' &middot; Observation: ' + st.haki.obs + ' &middot; König: ' + st.haki.conq + '<br>' +
      '<h3>Aktuelles Ziel</h3>' + questText();
  } else if (tab === 'crew') {
    body.innerHTML = '<h3>Deine Crew (' + st.crew.length + '/9)</h3>';
    if (!st.crew.length) body.innerHTML += 'Noch keine Crew. Hilf den Menschen auf den Inseln, dann schließen sie sich dir an!';
    for (const id of st.crew) {
      const c = CREW[id];
      const row = document.createElement('div');
      row.className = 'mline';
      row.innerHTML = '<span><b>' + c.name + '</b> — ' + c.role + '</span><span class="desc">' + c.bonus + '</span>';
      body.appendChild(row);
    }
  } else if (tab === 'bag') {
    body.innerHTML = '<h3>Items</h3>';
    let any = false;
    for (const id of Object.keys(st.inventory.items)) {
      const qty = st.inventory.items[id];
      if (qty <= 0) continue;
      any = true;
      const item = ITEMS[id];
      const row = document.createElement('div');
      row.className = 'mline';
      row.innerHTML = '<span>' + item.name + ' ×' + qty + '</span><span class="desc">' + item.desc + '</span>';
      const btn = document.createElement('button');
      btn.className = 'mbtn'; btn.textContent = 'Benutzen';
      btn.disabled = item.heal ? st.hp >= playerMaxHp(st) : G.stamina >= 100;
      btn.onclick = () => {
        st.inventory.items[id]--;
        if (item.heal) {
          let heal = item.heal;
          if (st.crew.includes('chopper')) heal = Math.round(heal * 1.5);
          st.hp = Math.min(playerMaxHp(st), st.hp + heal);
        }
        if (item.stamina) G.stamina = Math.min(100, G.stamina + item.stamina);
        renderMenu('bag'); updateHUD();
      };
      row.appendChild(btn);
      body.appendChild(row);
    }
    if (!any) body.innerHTML += 'Keine Items. Der Laden (SHOP-Gebäude) hilft weiter.';

    body.insertAdjacentHTML('beforeend', '<h3>Teufelsfrüchte (' + FRUIT_IDS.length + ' existieren)</h3>');
    if (st.fruit) {
      const f = FRUITS[st.fruit];
      body.insertAdjacentHTML('beforeend',
        'Deine Kraft: <b>' + f.name + '</b> <span style="color:#c88af0">(' + f.type + ')</span><br>' +
        '<span class="desc">' + f.desc + '</span><br>' +
        f.skills.map((s, i) => 'Taste ' + (i + 1) + ': ' + s.name).join(' · ') + '<br><br>');
    }
    if (!st.inventory.fruits.length && !st.fruit) {
      body.insertAdjacentHTML('beforeend', 'Noch keine gefunden. Suche Schatztruhen, besiege starke Gegner oder besuche den Schwarzmarkt auf Sabaody!');
    }
    st.inventory.fruits.forEach((fid, i) => {
      const f = FRUITS[fid];
      const row = document.createElement('div');
      row.className = 'mline';
      row.innerHTML = '<span><b>' + f.name + '</b> <span style="color:#c88af0">(' + f.type + ')</span></span><span class="desc">' + f.desc + '</span>';
      const btn = document.createElement('button');
      btn.className = 'mbtn';
      btn.textContent = st.fruit ? 'Essen (ersetzt aktuelle Kraft!)' : 'Essen';
      btn.onclick = () => {
        if (st.fruit && !confirm('Deine aktuelle Teufelskraft (' + FRUITS[st.fruit].name + ') geht dabei unwiderruflich verloren. Wirklich essen?')) return;
        st.fruit = fid;
        st.inventory.fruits.splice(i, 1);
        st.hp = Math.min(st.hp, playerMaxHp(st));
        renderMenu('bag'); updateHUD(); updateSkillbar(); autoSave();
      };
      row.appendChild(btn);
      body.appendChild(row);
    });
  } else if (tab === 'map') {
    body.innerHTML = '<div id="mapwrap"></div>';
    const cv = document.createElement('canvas');
    cv.id = 'mapcanvas';
    cv.width = WORLD_W; cv.height = WORLD_H;
    cv.style.width = '100%';
    const c = cv.getContext('2d');
    c.drawImage(World.minimap, 0, 0);
    // Zonen-Beschriftung
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.font = 'bold 13px sans-serif';
    c.fillText('EASTBLUE', 60, 16);
    c.fillText('GRAND LINE', 280, 16);
    c.fillText('NEUE WELT', 480, 16);
    // Spielerposition
    const px = G.px / TS, py = G.py / TS;
    c.fillStyle = '#ff2222';
    c.beginPath(); c.arc(px, py, 4, 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(px, py, 4, 0, 7); c.stroke();
    body.querySelector('#mapwrap').appendChild(cv);
    let names = '<h3>Entdeckte Inseln (' + Object.keys(st.discovered).length + '/' + ISLANDS.length + ')</h3>';
    const found = ISLANDS.filter(i => st.discovered[i.id]);
    names += found.length ? found.map(i => i.name).join(' · ') : 'Noch keine — stich in See!';
    body.insertAdjacentHTML('beforeend', names);
  } else if (tab === 'help') {
    body.innerHTML =
      '<h3>Steuerung</h3>' +
      'WASD / Pfeiltasten — Bewegen<br>' +
      'LEERTASTE / J — Angreifen (auf dem Schiff: Kanone!)<br>' +
      '1 / 2 — Teufelsfrucht-Skills &middot; 3 — Königshaki-Schockwelle<br>' +
      'E / Enter — Interagieren, Dialog weiter<br>' +
      'ESC — Menü<br><br>' +
      '<h3>So wirst du König der Piraten</h3>' +
      '1. Kaufe ein Schiff und segle von Insel zu Insel (E am Wasser).<br>' +
      '2. Kämpfe direkt in der Welt — Gegner droppen Berry und selten Teufelsfrüchte!<br>' +
      '3. Jeder Sieg erhöht dein Kopfgeld. Bosse (rote Namen) geben riesige Sprünge.<br>' +
      '4. Rekrutiere 9 Crew-Mitglieder — Zorro, Lysop & Jinbe kämpfen aktiv mit!<br>' +
      '5. Es gibt ' + FRUIT_IDS.length + ' Teufelsfrüchte: in Truhen, als Drops und beim Schwarzmarkt auf Sabaody.<br>' +
      '6. Trainiere Haki bei Rayleigh (Loguetown & Sabaody, ab Level 10).<br>' +
      '7. Beiboot → Going Merry (Grand Line) → Thousand Sunny (Neue Welt).<br>' +
      '8. Besiege Blackbeard auf Laugh Tale und hole dir das One Piece!<br><br>' +
      'In Tavernen wirst du kostenlos geheilt. Beim K.o. verlierst du 25% deiner Berry.';
  } else if (tab === 'settings') {
    let s = { volume: SFX.getVolume(), muted: !SFX.isEnabled(), mouseSens: G.mouseSensMult };
    body.innerHTML = '<h3>Einstellungen</h3>';

    const volRow = document.createElement('div');
    volRow.className = 'mline';
    volRow.innerHTML = '<span>Lautstärke</span>';
    const volVal = document.createElement('span');
    volVal.className = 'mval';
    volVal.textContent = Math.round(s.volume * 100) + '%';
    const volSlider = document.createElement('input');
    volSlider.type = 'range'; volSlider.min = '0'; volSlider.max = '100'; volSlider.value = Math.round(s.volume * 100);
    volSlider.className = 'mslider';
    volSlider.oninput = () => {
      s.volume = volSlider.value / 100;
      volVal.textContent = volSlider.value + '%';
      SFX.setVolume(s.volume);
      saveSettings(s);
    };
    volSlider.onchange = () => SFX.click();
    volRow.appendChild(volSlider);
    volRow.appendChild(volVal);
    body.appendChild(volRow);

    const muteRow = document.createElement('div');
    muteRow.className = 'mline';
    const muteLbl = document.createElement('label');
    const muteChk = document.createElement('input');
    muteChk.type = 'checkbox'; muteChk.checked = s.muted;
    muteChk.onchange = () => {
      s.muted = muteChk.checked;
      SFX.setEnabled(!s.muted);
      saveSettings(s);
      if (!s.muted) SFX.click();
    };
    muteLbl.appendChild(muteChk);
    muteLbl.appendChild(document.createTextNode(' Soundeffekte stumm schalten'));
    muteRow.appendChild(muteLbl);
    body.appendChild(muteRow);

    const sensRow = document.createElement('div');
    sensRow.className = 'mline';
    sensRow.innerHTML = '<span>Mausempfindlichkeit</span>';
    const sensVal = document.createElement('span');
    sensVal.className = 'mval';
    sensVal.textContent = s.mouseSens.toFixed(1) + '×';
    const sensSlider = document.createElement('input');
    sensSlider.type = 'range'; sensSlider.min = '0.3'; sensSlider.max = '2.5'; sensSlider.step = '0.1';
    sensSlider.value = s.mouseSens;
    sensSlider.className = 'mslider';
    sensSlider.oninput = () => {
      s.mouseSens = parseFloat(sensSlider.value);
      sensVal.textContent = s.mouseSens.toFixed(1) + '×';
      G.mouseSensMult = s.mouseSens;
      saveSettings(s);
    };
    sensRow.appendChild(sensSlider);
    sensRow.appendChild(sensVal);
    body.appendChild(sensRow);
  } else if (tab === 'save') {
    body.innerHTML = '<h3>Spielstand</h3>Das Spiel speichert automatisch nach Kämpfen, Truhen und Käufen.<br><br>';
    const btn = document.createElement('button');
    btn.className = 'mbtn'; btn.textContent = 'Jetzt speichern';
    btn.onclick = () => { saveGame(); btn.textContent = 'Gespeichert! ✔'; };
    body.appendChild(btn);
    const del = document.createElement('button');
    del.className = 'mbtn danger'; del.textContent = 'Spielstand löschen & neu starten';
    del.onclick = () => {
      if (confirm('Wirklich den kompletten Spielstand löschen?')) {
        localStorage.removeItem(SAVE_KEY);
        location.reload();
      }
    };
    body.appendChild(del);
  }
}

// ---------------------------------------------------------------
//  Niederlage & Sieg
// ---------------------------------------------------------------
function playerDefeated() {
  const st = G.state;
  st.berries = Math.floor(st.berries * 0.75);
  st.hp = playerMaxHp(st);
  st.onShip = false;
  G.px = st.respawn.x; G.py = st.respawn.y;
  st.px = G.px; st.py = G.py;
  G.trail = [];
  G.enemies = []; G.projs = []; G.populated = {};
  G.usedRevive = false;
  G.stamina = 100;
  G.iframes = 2;
  say('', ['Du wachst in Sicherheit wieder auf...', 'Ein Teil deiner Berry ist verloren. Kopf hoch — ein Pirat gibt niemals auf!']);
  autoSave();
}

function winGame() {
  releasePointer();
  const st = G.state;
  st.flags.king = true;
  st.bounty = Math.max(st.bounty, 5600000000);
  G.mode = 'credits';
  el('hud').classList.add('hidden');
  el('skillbar').classList.add('hidden');
  el('credits').classList.remove('hidden');
  el('creditsbody').innerHTML =
    st.name + ' hat das One Piece gefunden!<br><br>' +
    'Level: ' + st.lvl + '<br>' +
    'Kopfgeld: ' + st.bounty.toLocaleString('de-DE') + ' Berry<br>' +
    'Crew: ' + (st.crew.length ? st.crew.map(id => CREW[id].name).join(', ') : '—') + '<br>' +
    'Teufelsfrucht: ' + (st.fruit ? FRUITS[st.fruit].name : 'Keine — pure Willenskraft!') + '<br>' +
    'Entdeckte Inseln: ' + Object.keys(st.discovered).length + '/' + ISLANDS.length + '<br><br>' +
    'Eine neue Ära der Piraten beginnt!';
  autoSave();
}

// ---------------------------------------------------------------
//  HUD & Skill-Leiste
// ---------------------------------------------------------------
function setHpBar(elFill, cur, max) {
  const pct = Math.max(0, Math.min(100, cur / max * 100));
  elFill.style.width = pct + '%';
  elFill.className = 'hpfill' + (pct < 25 ? ' crit' : pct < 55 ? ' low' : '');
}

function updateHUD() {
  const st = G.state;
  if (!st) return;
  el('hudname').textContent = st.name;
  el('hudlvl').textContent = 'Lv. ' + st.lvl;
  setHpBar(el('hudhp'), st.hp, playerMaxHp(st));
  el('hudstamina').style.width = G.stamina + '%';
  el('hudberry').textContent = st.berries.toLocaleString('de-DE') + ' Berry';
  el('hudbounty').textContent = 'Kopfgeld: ' + st.bounty.toLocaleString('de-DE');
  el('hudquest').textContent = 'Ziel: ' + questText();
}

function updateSkillbar() {
  const st = G.state;
  if (!st) return;
  const f = st.fruit ? FRUITS[st.fruit] : null;
  for (let i = 0; i < 2; i++) {
    const box = el('sk-' + (i + 1));
    const skill = f && f.skills[i];
    box.querySelector('.skname').textContent = skill ? skill.name : '—';
    box.classList.toggle('nofruit', !skill);
  }
  el('sk-3').classList.toggle('nofruit', st.haki.conq <= 0);
}

function tickSkillbar() {
  const st = G.state;
  if (!st) return;
  const f = st.fruit ? FRUITS[st.fruit] : null;
  for (let i = 0; i < 2; i++) {
    const box = el('sk-' + (i + 1));
    const skill = f && f.skills[i];
    const cd = G.skillCd[i];
    box.classList.toggle('oncd', !!skill && cd > 0);
    box.querySelector('.skcd').style.width = skill && skill.cd ? (cd / skill.cd * 100) + '%' : '0%';
  }
  el('sk-atk').classList.toggle('oncd', G.atkCd > 0.1);
  const c3 = el('sk-3');
  c3.classList.toggle('oncd', G.conqCd > 0);
  c3.querySelector('.skcd').style.width = (G.conqCd / 18 * 100) + '%';
  el('hudstamina').style.width = G.stamina + '%';
  setHpBar(el('hudhp'), G.state.hp, playerMaxHp(G.state));
}

// ---------------------------------------------------------------
//  Charaktererstellung
// ---------------------------------------------------------------
const CC = { style: 1, hair: '#1a1a1a', skin: '#e8b88a', shirt: '#d63a3a', };
const CC_HAIR = ['#1a1a1a', '#5a3a1a', '#e8c468', '#d63a3a', '#2e7d32', '#2a6ac8', '#f4863c', '#c8c8cc'];
const CC_SKIN = ['#f0c8a0', '#e8b88a', '#d99a68', '#a8703c', '#6a4a2a'];
const CC_SHIRT = ['#d63a3a', '#2a6ac8', '#2e7d32', '#e8c468', '#7a3ab8', '#f2f4f8', '#26262e'];
const CC_STYLES = ['Kurz', 'Stachelig', 'Lang'];

function buildCreateUI() {
  const mkSwatches = (wrapId, colors, key) => {
    const wrap = el(wrapId);
    wrap.innerHTML = '';
    colors.forEach(col => {
      const s = document.createElement('div');
      s.className = 'swatch' + (CC[key] === col ? ' sel' : '');
      s.style.background = col;
      s.onclick = () => { CC[key] = col; buildCreateUI(); };
      wrap.appendChild(s);
    });
  };
  mkSwatches('chair', CC_HAIR, 'hair');
  mkSwatches('cskin', CC_SKIN, 'skin');
  mkSwatches('cshirt', CC_SHIRT, 'shirt');
  const hw = el('chairstyle');
  hw.innerHTML = '';
  CC_STYLES.forEach((label, i) => {
    const b = document.createElement('div');
    b.className = 'hopt' + (CC.style === i ? ' sel' : '');
    b.textContent = label;
    b.onclick = () => { CC.style = i; buildCreateUI(); };
    hw.appendChild(b);
  });
}
function drawCreatePreview() {
  const cv = el('cprev');
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  const look = { skin: CC.skin, hair: CC.hair, style: CC.style, shirt: CC.shirt, pants: '#31456b', hat: el('chat').checked };
  drawChar(c, 100, 205, 6.5, look, 'down', false);
}

// ---------------------------------------------------------------
//  Spielstart
// ---------------------------------------------------------------
function startGame(st) {
  G.state = st;
  st.hp = st.hp > 0 ? Math.min(st.hp, playerMaxHp(st)) : playerMaxHp(st);
  genWorld();
  for (const key of Object.keys(st.openedChests)) {
    const [x, y] = key.split(',').map(Number);
    if (tileAt(x, y) === T.CHEST) setTile(x, y, T.CHEST_OPEN);
  }
  G.px = st.px; G.py = st.py;
  G.facing = st.facing || 'down';
  G.yaw = typeof st.yaw === 'number' ? st.yaw : Math.PI;
  G.pitch = 0;
  resetWorld3D();
  G.trail = []; G.lastIsland = null; G.lastTileKey = '';
  G.enemies = []; G.projs = []; G.pickups = []; G.floaters = []; G.fx = [];
  G.populated = {};
  G.stamina = 100;
  el('title').classList.add('hidden');
  el('create').classList.add('hidden');
  el('credits').classList.add('hidden');
  el('hud').classList.remove('hidden');
  el('skillbar').classList.remove('hidden');
  updateLockHint();
  G.mode = 'world';
  updateHUD();
  updateSkillbar();
  if (!st.flags.intro_done) {
    st.flags.intro_done = true;
    say('Erzähler', [
      'Windmühlendorf, Eastblue.',
      'Hier beginnt die Geschichte von ' + st.name + ' — dem zukünftigen König der Piraten!',
      'Eine riesige Welt liegt vor dir: der Eastblue, die Grand Line und die Neue Welt.',
      'Sprich mit Rotschopf Shanks im Dorf. Er weiß, wie dein Abenteuer beginnt.',
      '(Maus = Umsehen · WASD = Laufen · Klick = Angriff · E = Interagieren · ESC = Menü)',
    ]);
  }
}

// ---------------------------------------------------------------
//  Eingabe
// ---------------------------------------------------------------
const KEYMAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
  W: 'up', S: 'down', A: 'left', D: 'right',
};

function handleAction() {
  switch (G.mode) {
    case 'world': interact(); break;
    case 'dialog': advanceDialog(); break;
  }
}
function handleEscape() {
  switch (G.mode) {
    case 'world': openMenu(); break;
    case 'menu': closeMenu(); break;
    case 'shop': closeShop(); break;
  }
}

window.addEventListener('keydown', (e) => {
  const dir = KEYMAP[e.key];
  if (dir) { e.preventDefault(); G.keys[dir] = true; return; }

  if (e.key === ' ') {
    e.preventDefault();
    if (G.mode === 'world') { if (G.jumpY === 0 && G.jumpV === 0) { G.jumpV = 4.6; SFX.jump(); } }
    else if (G.mode === 'dialog' && !e.repeat) advanceDialog();
    return;
  }
  if (e.key === 'j' || e.key === 'J') {
    if (G.mode === 'world') playerAttack();
    return;
  }
  if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
    e.preventDefault();
    if (!e.repeat) handleAction();
    return;
  }
  if (e.key === '1' && G.mode === 'world') { castSkill(0); return; }
  if (e.key === '2' && G.mode === 'world') { castSkill(1); return; }
  if (e.key === '3' && G.mode === 'world') { conquerorWave(); return; }
  if (e.key === 'Escape') { e.preventDefault(); handleEscape(); }
});
window.addEventListener('keyup', (e) => {
  const dir = KEYMAP[e.key];
  if (dir) G.keys[dir] = false;
});

el('dialog').addEventListener('click', () => { if (G.mode === 'dialog') advanceDialog(); });

// ---------------------------------------------------------------
//  Maus: Pointer Lock (Umsehen) + Klick (Angriff)
// ---------------------------------------------------------------
const IS_TOUCH = 'ontouchstart' in window;

function grabPointer() {
  if (IS_TOUCH || G.mode !== 'world') return;
  const c = el('game');
  if (document.pointerLockElement !== c && c.requestPointerLock) {
    try { c.requestPointerLock(); } catch (err) { /* braucht Nutzer-Geste */ }
  }
}
function releasePointer() {
  if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock();
}
function updateLockHint() {
  const hint = el('lockhint');
  if (!hint) return;
  const show = !IS_TOUCH && G.state && G.mode === 'world' && !G.pointerLocked;
  hint.classList.toggle('hidden', !show);
  el('crosshair').classList.toggle('hidden',
    !(G.state && (G.mode === 'world' || G.mode === 'dialog')));
}

document.addEventListener('pointerlockchange', () => {
  G.pointerLocked = document.pointerLockElement === el('game');
  // ESC bei aktivem Pointer Lock verlässt erst den Lock → dann Menü öffnen
  if (!G.pointerLocked && G.mode === 'world' && !IS_TOUCH && G.state) {
    openMenu();
  }
  updateLockHint();
});

document.addEventListener('mousemove', (e) => {
  if (!G.pointerLocked) return;
  G.yaw -= e.movementX * 0.0022 * G.mouseSensMult;
  G.pitch -= e.movementY * 0.0022 * G.mouseSensMult;
  G.pitch = Math.max(-1.35, Math.min(1.35, G.pitch));
});

el('game').addEventListener('mousedown', (e) => {
  if (IS_TOUCH) return;
  if (G.mode === 'dialog') { advanceDialog(); return; }
  if (G.mode !== 'world') return;
  if (!G.pointerLocked) { grabPointer(); return; }
  if (e.button === 0) playerAttack();
  else if (e.button === 2) interact();
});
el('game').addEventListener('contextmenu', (e) => e.preventDefault());

// Touch-Steuerung
function setupTouch() {
  if (!IS_TOUCH) return;
  el('touch').classList.remove('hidden');

  // Wischen auf dem Spielfeld = Kamera drehen
  let lastTouch = null;
  const cv = el('game');
  cv.addEventListener('touchstart', (e) => {
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  });
  cv.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!lastTouch) return;
    const t = e.touches[0];
    G.yaw -= (t.clientX - lastTouch.x) * 0.006 * G.mouseSensMult;
    G.pitch -= (t.clientY - lastTouch.y) * 0.006 * G.mouseSensMult;
    G.pitch = Math.max(-1.35, Math.min(1.35, G.pitch));
    lastTouch = { x: t.clientX, y: t.clientY };
  }, { passive: false });
  cv.addEventListener('touchend', () => { lastTouch = null; });
  document.querySelectorAll('.dbtn').forEach(btn => {
    const dir = btn.dataset.dir;
    const on = (e) => { e.preventDefault(); G.keys[dir] = true; };
    const off = (e) => { e.preventDefault(); G.keys[dir] = false; };
    btn.addEventListener('touchstart', on); btn.addEventListener('touchend', off); btn.addEventListener('touchcancel', off);
  });
  el('tbtnA').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (G.mode === 'world') playerAttack();
    else if (G.mode === 'dialog') advanceDialog();
  });
  el('tbtnB').addEventListener('touchstart', (e) => { e.preventDefault(); handleAction(); });
  el('tbtnM').addEventListener('touchstart', (e) => { e.preventDefault(); handleEscape(); });
  el('tbtnS1').addEventListener('touchstart', (e) => { e.preventDefault(); if (G.mode === 'world') castSkill(0); });
  el('tbtnS2').addEventListener('touchstart', (e) => { e.preventDefault(); if (G.mode === 'world') castSkill(1); });
}

// ---------------------------------------------------------------
//  Spielschleife
// ---------------------------------------------------------------
const canvas = el('game');
init3D(canvas);

function update(dt, time) {
  if (!G.state) return;
  if (G.mode === 'world') {
    updateMovement(dt);
    updateCombat(dt, time);
    G.interactHint = null;
    const target = findInteractable();
    if (target) G.interactHint = { x: target.x, y: target.y, label: target.label || '' };
    tickSkillbar();
  }
  if (G.frameToggle !== G.mode) {
    G.frameToggle = G.mode;
    updateLockHint();
  }
}

function loop(time) {
  const dt = Math.min(0.05, (time - G.lastTime) / 1000 || 0);
  G.lastTime = time;
  update(dt, time);
  render3D(time, dt);
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------
//  Init
// ---------------------------------------------------------------
function init() {
  loadSettings();
  const save = loadGame();
  if (save) el('btnContinue').classList.remove('hidden');

  el('btnNew').onclick = () => {
    SFX.click();
    el('title').classList.add('hidden');
    el('create').classList.remove('hidden');
    G.mode = 'create';
    buildCreateUI();
  };
  el('btnContinue').onclick = () => {
    SFX.click();
    const st = loadGame();
    if (st) startGame(st);
  };
  el('btnStart').onclick = () => {
    SFX.click();
    const name = el('cname').value.trim() || 'Ruffy';
    const look = { skin: CC.skin, hair: CC.hair, style: CC.style, shirt: CC.shirt, pants: '#31456b', hat: el('chat').checked };
    startGame(newState(name, look));
    saveGame();
  };
  el('btnFreeplay').onclick = () => {
    SFX.click();
    el('credits').classList.add('hidden');
    el('hud').classList.remove('hidden');
    el('skillbar').classList.remove('hidden');
    G.mode = 'world';
  };

  setupTouch();
  setInterval(() => { if (G.mode === 'world') autoSave(); }, 25000);
  setInterval(() => { if (G.mode === 'create') drawCreatePreview(); }, 120);

  requestAnimationFrame(loop);
}

init();

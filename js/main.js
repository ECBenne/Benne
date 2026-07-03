// =====================================================================
//  Haupt-Engine: Spielschleife, Bewegung, Interaktion, Menüs, Save
// =====================================================================
'use strict';

function el(id) { return document.getElementById(id); }

const SAVE_KEY = 'onepiece_save_v1';
const HAKI_COSTS = [1500, 4000, 10000, 25000, 60000];

const G = {
  mode: 'title',       // title | create | world | dialog | menu | shop | battle | credits
  state: null,
  px: 0, py: 0,        // Pixelposition des Spielers
  moving: false, tx: 0, ty: 0, moveT: 0,
  walkFrame: 0,
  trail: [],
  lastIsland: null,
  keys: {},
  dlg: null,
  bannerTimeout: null,
  shopMode: null,      // 'shop' | 'haki'
  menuTab: 'status',
  lastTime: 0,
};

// ---------------------------------------------------------------
//  Spielzustand
// ---------------------------------------------------------------
function newState(name, look) {
  return {
    name, look,
    lvl: 1, xp: 0, hp: 0,
    berries: 300, bounty: 0,
    haki: { arm: 0, obs: 0, conq: 0 },
    fruit: null,
    inventory: { items: { meat: 2 }, fruits: [] },
    crew: [],
    ship: 0, onShip: false,
    x: 34, y: 120, facing: 'down',
    flags: {},
    openedChests: {},
    discovered: {},
    respawn: { x: 34, y: 120 },
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
    msgs.push('LEVEL UP! Du bist jetzt Level ' + st.lvl + '! (KP voll aufgefüllt)');
    need = xpNeed(st.lvl);
  }
  return msgs;
}
function xpNeed(lvl) { return lvl * lvl * 15 + lvl * 10; }

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
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } catch (e) { /* voll/blockiert */ }
}
function autoSave() { if (G.state) saveGame(); }
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const st = JSON.parse(raw);
    if (!st || !st.name || !st.look) return null;
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
//  Bewegung & Kollision
// ---------------------------------------------------------------
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function canWalk(x, y) {
  if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return false;
  if (npcAt(x, y, G.state)) return false;
  const t = tileAt(x, y);
  if (t === T.CHEST) return false;
  if (WATER_TILES.has(t)) {
    return G.state.onShip && SHIPS[G.state.ship].tiles.includes(t);
  }
  // an Land gehen ist vom Schiff aus erlaubt
  return WALKABLE.has(t);
}

function startMove(dir, force) {
  const st = G.state;
  st.facing = dir;
  const [dx, dy] = DIRS[dir];
  const nx = st.x + dx, ny = st.y + dy;
  if (!force && !canWalk(nx, ny)) return false;
  G.trail.unshift({ x: st.x, y: st.y, dir });
  if (G.trail.length > 10) G.trail.pop();
  G.moving = true; G.tx = nx; G.ty = ny; G.moveT = 0;
  return true;
}

function finishMove() {
  const st = G.state;
  st.x = G.tx; st.y = G.ty;
  G.px = st.x * TS; G.py = st.y * TS;
  G.moving = false;
  stepEvents();
}

function stepEvents() {
  const st = G.state;
  const t = tileAt(st.x, st.y);

  if (st.onShip && WALKABLE.has(t)) st.onShip = false;
  if (t === T.PATH) st.respawn = { x: st.x, y: st.y };

  // Insel-Banner + Entdeckung
  const il = islandAt(st.x, st.y);
  const ilId = il ? il.id : null;
  if (ilId && ilId !== G.lastIsland) {
    st.discovered[ilId] = true;
    showBanner(il.name);
  }
  G.lastIsland = ilId;

  // Zufallskämpfe
  if (!st.flags.king || Math.random() < 0.6) {
    if (t === T.TALL && il) {
      if (Math.random() < 0.11) { startWildBattle(TIER_TABLES[il.tier]); return; }
    } else if (st.onShip && WATER_TILES.has(t)) {
      let rate = t === T.S ? 0.075 : t === T.D ? 0.055 : 0.04;
      if (st.crew.includes('nami')) rate /= 2;
      if (Math.random() < rate) { startWildBattle(seaTable(t, st.x)); return; }
    }
  }
  updateHUD();
}

function showBanner(text) {
  const b = el('banner');
  b.textContent = text;
  b.classList.remove('hidden');
  clearTimeout(G.bannerTimeout);
  G.bannerTimeout = setTimeout(() => b.classList.add('hidden'), 2500);
}

// ---------------------------------------------------------------
//  Interaktion (E / Leertaste / A-Knopf)
// ---------------------------------------------------------------
function interact() {
  const st = G.state;
  const [dx, dy] = DIRS[st.facing];
  const fx = st.x + dx, fy = st.y + dy;

  const npc = npcAt(fx, fy, st);
  if (npc) { npcInteract(npc); return; }

  const t = tileAt(fx, fy);
  if (t === T.CHEST) { openChest(chestAt(fx, fy)); return; }
  if (t === T.SHOP) { openShop(); return; }

  if (WATER_TILES.has(t) && !st.onShip) {
    if (st.ship === 0) {
      say('', ['Ohne Schiff kannst du nicht aufs Meer hinaus.', 'Der Schiffsbauer im Windmühlendorf verkauft Beiboote.']);
    } else if (!SHIPS[st.ship].tiles.includes(t)) {
      const need = t === T.S ? 'Nur die Thousand Sunny übersteht diese Sturmsee!' : 'Die Tiefsee ist zu gefährlich! Du brauchst die Going Merry aus Loguetown.';
      say('', [need]);
    } else {
      st.onShip = true;
      startMove(st.facing, true);
      say('', ['Du setzt die Segel mit der ' + SHIPS[st.ship].name + '!']);
    }
    return;
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
        st.respawn = { x: st.x, y: st.y };
        say('', ['Du bist vollständig ausgeruht! KP wiederhergestellt.']);
      });
      break;
    case 'mayor':
      if (!st.flags.boss_higuma) {
        say(d.name, ['Der Bandit Higuma treibt sein Unwesen im Wald nordöstlich des Dorfes!', 'Wenn du ihn vertreibst, gebe ich dir 500 Berry Belohnung!']);
      } else if (!st.flags.mayor_reward) {
        st.flags.mayor_reward = true;
        st.berries += 500;
        say(d.name, ['Du hast Higuma vertrieben! Das Dorf dankt dir!', 'Hier, 500 Berry — hochverdient!']);
      } else {
        say(d.name, ['Danke für alles! Werde ein Pirat, auf den das Dorf stolz sein kann!']);
      }
      break;
    case 'boss': {
      const boss = BOSSES[d.boss];
      if (st.flags['boss_' + d.boss]) {
        say(boss.name, boss.defeated);
      } else {
        say(boss.name, boss.intro, () => startBossBattle(d.boss));
      }
      break;
    }
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
        say(d.name, ['Die ' + ship.name + ' kostet ' + sale.price.toLocaleString('de-DE') + ' Berry.', 'So viel hast du nicht dabei, Bürschchen!']);
        break;
      }
      say(d.name, ['Die ' + ship.name + ' für ' + sale.price.toLocaleString('de-DE') + ' Berry — abgemacht?'], () => {
        st.berries -= sale.price;
        st.ship = sale.ship;
        say('', ['Du hast die ' + ship.name + ' erhalten!', 'Stell dich ans Wasser (Steg) und drücke E, um in See zu stechen!']);
        autoSave();
      });
      break;
    }
    case 'haki':
      if (st.lvl < 10) {
        say(d.name, ['Ich bin Silvers Rayleigh, die "Rechte Hand des Piratenkönigs".', 'Haki schlummert in jedem — aber du bist noch zu schwach.', 'Komm wieder, wenn du Level 10 erreicht hast!']);
      } else {
        say(d.name, ['Haki — die Kraft des Willens. Ich kann sie in dir wecken.'], openHakiMenu);
      }
      break;
  }
}

function openChest(chest) {
  const st = G.state;
  if (!chest) return;
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
  if (c.berry) {
    st.berries += c.berry;
    say('Schatztruhe', ['Du findest ' + c.berry.toLocaleString('de-DE') + ' Berry!']);
  } else if (c.item) {
    st.inventory.items[c.item] = (st.inventory.items[c.item] || 0) + (c.qty || 1);
    say('Schatztruhe', ['Du findest ' + ITEMS[c.item].name + ' ×' + (c.qty || 1) + '!']);
  } else if (c.fruit) {
    st.inventory.fruits.push(c.fruit);
    say('Schatztruhe', ['Eine seltsam gemusterte Frucht...', 'Du findest die ' + FRUITS[c.fruit].name + '!', 'Öffne das Menü (ESC) → Beutel, um sie zu essen.']);
  }
  autoSave();
}

// ---------------------------------------------------------------
//  Shop & Haki-Training
// ---------------------------------------------------------------
function openShop() {
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
    { key: 'arm', name: 'Rüstungshaki', desc: '+8% Schaden & -6% erlittener Schaden pro Stufe. Stufe 1 schaltet "Haki-Schlag" frei.' },
    { key: 'obs', name: 'Observationshaki', desc: '+5% Ausweichchance pro Stufe.' },
    { key: 'conq', name: 'Königshaki', desc: 'Chance, dass Gegner vor Furcht aussetzen. Stufe 1 schaltet "Königsdruck" frei.', locked: !st.flags.boss_akainu, lockText: 'Nur die Stärksten tragen Königshaki. Besiege Admiral Akainu!' },
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
        renderHaki(); updateHUD(); autoSave();
      };
      row.appendChild(btn);
    }
    wrap.appendChild(row);
  }
}
function closeShop() {
  el('shop').classList.add('hidden');
  G.mode = 'world';
  updateHUD();
}

// ---------------------------------------------------------------
//  Hauptmenü (ESC)
// ---------------------------------------------------------------
const MENU_TABS = [
  ['status', 'Status'], ['crew', 'Crew'], ['bag', 'Beutel'],
  ['map', 'Karte'], ['help', 'Hilfe'], ['save', 'Speichern'],
];
function openMenu() {
  G.mode = 'menu';
  el('menu').classList.remove('hidden');
  renderMenu(G.menuTab);
}
function closeMenu() {
  el('menu').classList.add('hidden');
  G.mode = 'world';
  updateHUD();
}
function renderMenu(tab) {
  G.menuTab = tab;
  const tabs = el('menutabs');
  tabs.innerHTML = '';
  for (const [id, label] of MENU_TABS) {
    const t = document.createElement('div');
    t.className = 'tab' + (id === tab ? ' active' : '');
    t.textContent = label;
    t.onclick = () => renderMenu(id);
    tabs.appendChild(t);
  }
  const body = el('menubody');
  body.innerHTML = '';
  const st = G.state;

  if (tab === 'status') {
    const fruitName = st.fruit ? FRUITS[st.fruit].name : '—';
    body.innerHTML =
      '<h3>' + st.name + ' — Level ' + st.lvl + '</h3>' +
      'KP: ' + st.hp + ' / ' + playerMaxHp(st) + '<br>' +
      'Angriff: ' + Math.round(playerAtk(st)) + ' &middot; Verteidigung: ' + Math.round(playerDef(st)) + '<br>' +
      'EP: ' + st.xp + ' / ' + xpNeed(st.lvl) + '<br><br>' +
      'Kopfgeld: <b style="color:#ffd166">' + st.bounty.toLocaleString('de-DE') + ' Berry</b><br>' +
      'Geld: ' + st.berries.toLocaleString('de-DE') + ' Berry<br>' +
      'Teufelsfrucht: ' + fruitName + '<br>' +
      'Schiff: ' + SHIPS[st.ship].name + '<br>' +
      'Haki — Rüstung: ' + st.haki.arm + ' &middot; Observation: ' + st.haki.obs + ' &middot; König: ' + st.haki.conq + '<br>' +
      '<h3>Aktuelles Ziel</h3>' + questText();
  } else if (tab === 'crew') {
    body.innerHTML = '<h3>Deine Crew (' + st.crew.length + '/8)</h3>';
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
      if (item.heal) {
        const btn = document.createElement('button');
        btn.className = 'mbtn'; btn.textContent = 'Benutzen';
        btn.disabled = st.hp >= playerMaxHp(st);
        btn.onclick = () => {
          st.inventory.items[id]--;
          let heal = item.heal;
          if (st.crew.includes('chopper')) heal = Math.round(heal * 1.5);
          st.hp = Math.min(playerMaxHp(st), st.hp + heal);
          renderMenu('bag'); updateHUD();
        };
        row.appendChild(btn);
      }
      body.appendChild(row);
    }
    if (!any) body.innerHTML += 'Keine Items.';
    body.innerHTML += '<h3>Teufelsfrüchte</h3>';
    if (st.fruit) {
      const p = document.createElement('div');
      p.innerHTML = 'Du trägst die Kraft der <b>' + FRUITS[st.fruit].name + '</b> in dir.<br><span class="desc">' + FRUITS[st.fruit].desc + '</span><br><br>';
      body.appendChild(p);
    }
    if (!st.inventory.fruits.length && !st.fruit) body.innerHTML += 'Noch keine gefunden. Suche Schatztruhen auf den Inseln!';
    for (let i = 0; i < st.inventory.fruits.length; i++) {
      const fid = st.inventory.fruits[i];
      const f = FRUITS[fid];
      const row = document.createElement('div');
      row.className = 'mline';
      row.innerHTML = '<span>' + f.name + '</span><span class="desc">' + f.desc + '</span>';
      const btn = document.createElement('button');
      btn.className = 'mbtn';
      btn.textContent = st.fruit ? 'Bereits eine gegessen' : 'Essen';
      btn.disabled = !!st.fruit;
      btn.onclick = () => {
        st.fruit = fid;
        st.inventory.fruits.splice(i, 1);
        st.hp = Math.min(st.hp, playerMaxHp(st));
        if (FRUITS[fid].hp) st.hp += FRUITS[fid].hp;
        renderMenu('bag'); updateHUD(); autoSave();
      };
      row.appendChild(btn);
      body.appendChild(row);
    }
  } else if (tab === 'map') {
    body.innerHTML = '<div id="mapwrap"></div>';
    const cv = document.createElement('canvas');
    cv.id = 'mapcanvas';
    cv.width = WORLD_W * 2; cv.height = WORLD_H * 2;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(World.minimap, 0, 0, WORLD_W * 2, WORLD_H * 2);
    // Spielerposition
    c.fillStyle = '#ff2222';
    c.fillRect(st.x * 2 - 3, st.y * 2 - 3, 7, 7);
    c.strokeStyle = '#fff'; c.strokeRect(st.x * 2 - 3, st.y * 2 - 3, 7, 7);
    body.querySelector('#mapwrap').appendChild(cv);
    let names = '<h3>Entdeckte Inseln</h3>';
    const found = ISLANDS.filter(i => st.discovered[i.id]);
    names += found.length ? found.map(i => i.name).join(' · ') : 'Noch keine — stich in See!';
    const div = document.createElement('div');
    div.innerHTML = names;
    body.appendChild(div);
  } else if (tab === 'help') {
    body.innerHTML =
      '<h3>Steuerung</h3>' +
      'Pfeiltasten / WASD — Bewegen<br>' +
      'E / Leertaste / Enter — Interagieren, Dialog weiter, Kampfaktion<br>' +
      'ESC — Menü öffnen/schließen<br><br>' +
      '<h3>So wirst du König der Piraten</h3>' +
      '1. Kaufe ein Schiff und segle von Insel zu Insel (E am Wasser).<br>' +
      '2. Kämpfe im hohen Gras und auf See für EP und Berry.<br>' +
      '3. Besiege die Bosse jeder Insel — dein Kopfgeld steigt!<br>' +
      '4. Rekrutiere Crew-Mitglieder — jedes gibt dir einen Bonus.<br>' +
      '5. Finde Teufelsfrüchte in Schatztruhen (nur EINE essbar!).<br>' +
      '6. Trainiere Haki bei Rayleigh in Loguetown (ab Level 10).<br>' +
      '7. Bessere Schiffe erschließen Tiefsee und Sturmsee.<br>' +
      '8. Besiege Blackbeard auf Laugh Tale und hole dir das One Piece!<br><br>' +
      'In Tavernen (sprich mit der Wirtin) wirst du kostenlos geheilt.';
  } else if (tab === 'save') {
    body.innerHTML = '<h3>Spielstand</h3>Das Spiel speichert automatisch nach Kämpfen, Truhen und Käufen.<br><br>';
    const btn = document.createElement('button');
    btn.className = 'mbtn'; btn.textContent = 'Jetzt speichern';
    btn.onclick = () => { saveGame(); btn.textContent = 'Gespeichert! ✔'; };
    body.appendChild(btn);
    const del = document.createElement('button');
    del.className = 'mbtn'; del.textContent = 'Spielstand löschen & neu starten';
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
  st.x = st.respawn.x; st.y = st.respawn.y;
  G.px = st.x * TS; G.py = st.y * TS;
  G.moving = false;
  G.trail = [];
  say('', ['Du wachst in Sicherheit wieder auf...', 'Ein Teil deiner Berry ist verloren gegangen. Kopf hoch — ein Pirat gibt niemals auf!']);
  autoSave();
}

function winGame() {
  const st = G.state;
  st.flags.king = true;
  st.bounty = Math.max(st.bounty, 3000000000);
  G.mode = 'credits';
  el('hud').classList.add('hidden');
  el('credits').classList.remove('hidden');
  el('creditsbody').innerHTML =
    st.name + ' hat das One Piece gefunden!<br><br>' +
    'Level: ' + st.lvl + '<br>' +
    'Kopfgeld: ' + st.bounty.toLocaleString('de-DE') + ' Berry<br>' +
    'Crew: ' + (st.crew.length ? st.crew.map(id => CREW[id].name).join(', ') : '—') + '<br>' +
    'Teufelsfrucht: ' + (st.fruit ? FRUITS[st.fruit].name : 'Keine — pure Willenskraft!') + '<br><br>' +
    'Eine neue Ära der Piraten beginnt!';
  autoSave();
}

// ---------------------------------------------------------------
//  HUD
// ---------------------------------------------------------------
function updateHUD() {
  const st = G.state;
  if (!st) return;
  el('hudname').textContent = st.name;
  el('hudlvl').textContent = 'Lv. ' + st.lvl;
  setHpBar(el('hudhp'), st.hp, playerMaxHp(st));
  el('hudberry').textContent = st.berries.toLocaleString('de-DE') + ' Berry';
  el('hudbounty').textContent = 'Kopfgeld: ' + st.bounty.toLocaleString('de-DE');
  el('hudquest').textContent = 'Ziel: ' + questText();
}

// ---------------------------------------------------------------
//  Charaktererstellung
// ---------------------------------------------------------------
const CC = {
  name: 'Ruffy',
  style: 1,
  hair: '#1a1a1a', skin: '#e8b88a', shirt: '#d62828',
  hat: true,
};
const CC_HAIR = ['#1a1a1a', '#5a3a1a', '#e8c468', '#d62828', '#2e7d32', '#2a6ac8', '#f4863c', '#cccccc'];
const CC_SKIN = ['#f0c8a0', '#e8b88a', '#d99a68', '#a8703c', '#6a4a2a'];
const CC_SHIRT = ['#d62828', '#2a6ac8', '#2e7d32', '#e8c468', '#8a2be2', '#f5f5f5', '#222233'];
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
  drawChar(c, 20, 40, 10, look, 'down', 0);
}

// ---------------------------------------------------------------
//  Spielstart
// ---------------------------------------------------------------
function startGame(st) {
  G.state = st;
  st.hp = st.hp > 0 ? Math.min(st.hp, playerMaxHp(st)) : playerMaxHp(st);
  genWorld();
  // geöffnete Truhen wieder anwenden
  for (const key of Object.keys(st.openedChests)) {
    const [x, y] = key.split(',').map(Number);
    if (tileAt(x, y) === T.CHEST) setTile(x, y, T.CHEST_OPEN);
  }
  G.px = st.x * TS; G.py = st.y * TS;
  G.moving = false; G.trail = []; G.lastIsland = null;
  el('title').classList.add('hidden');
  el('create').classList.add('hidden');
  el('credits').classList.add('hidden');
  el('hud').classList.remove('hidden');
  G.mode = 'world';
  updateHUD();
  if (!st.flags.intro_done) {
    st.flags.intro_done = true;
    say('Erzähler', [
      'Windmühlendorf, Eastblue.',
      'Hier beginnt die Geschichte von ' + st.name + ' — dem zukünftigen König der Piraten!',
      'Sprich mit Rotschopf Shanks im Dorf. Er weiß, wie dein Abenteuer beginnt.',
      '(Bewegen: Pfeiltasten/WASD · Interagieren: E · Menü: ESC)',
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
    case 'battle': handleBattleKey('action'); break;
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
  if (dir) {
    e.preventDefault();
    G.keys[dir] = true;
    if (G.mode === 'battle' && !e.repeat) handleBattleKey(dir);
    return;
  }
  if (e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (!e.repeat) handleAction();
    return;
  }
  if (e.key === 'Escape') { e.preventDefault(); handleEscape(); }
});
window.addEventListener('keyup', (e) => {
  const dir = KEYMAP[e.key];
  if (dir) G.keys[dir] = false;
});

// Dialog / Kampfnachricht per Klick weiterschalten
el('dialog').addEventListener('click', () => { if (G.mode === 'dialog') advanceDialog(); });
el('bmsg').addEventListener('click', () => { if (G.mode === 'battle') handleBattleKey('action'); });

// Touch-Steuerung
function setupTouch() {
  if (!('ontouchstart' in window)) return;
  el('touch').classList.remove('hidden');
  document.querySelectorAll('.dbtn').forEach(btn => {
    const dir = btn.dataset.dir;
    const on = (e) => { e.preventDefault(); G.keys[dir] = true; if (G.mode === 'battle') handleBattleKey(dir); };
    const off = (e) => { e.preventDefault(); G.keys[dir] = false; };
    btn.addEventListener('touchstart', on); btn.addEventListener('touchend', off); btn.addEventListener('touchcancel', off);
  });
  el('tbtnA').addEventListener('touchstart', (e) => { e.preventDefault(); handleAction(); });
  el('tbtnB').addEventListener('touchstart', (e) => { e.preventDefault(); handleEscape(); });
}

// ---------------------------------------------------------------
//  Spielschleife
// ---------------------------------------------------------------
const canvas = el('game');
const ctx = canvas.getContext('2d');

function update(dt) {
  if (G.mode !== 'world' && G.mode !== 'dialog' && G.mode !== 'menu' && G.mode !== 'shop') return;
  const st = G.state;
  if (!st) return;

  const speed = (st.onShip ? 7.5 : 5.5) * TS; // px pro Sekunde

  if (G.moving) {
    G.moveT += dt;
    const dur = TS / speed;
    const t = Math.min(1, G.moveT / dur);
    G.px = (st.x + (G.tx - st.x) * t) * TS;
    G.py = (st.y + (G.ty - st.y) * t) * TS;
    G.walkFrame = Math.floor(performance.now() / 140) % 2;
    if (t >= 1) finishMove();
  } else if (G.mode === 'world') {
    for (const dir of ['up', 'down', 'left', 'right']) {
      if (G.keys[dir]) { startMove(dir); break; }
    }
  }
}

function draw(time) {
  ctx.clearRect(0, 0, 960, 640);
  if (G.mode === 'battle') {
    drawBattle(ctx, time);
  } else if (G.state && World.map) {
    drawWorld(ctx, G, time);
  } else {
    ctx.fillStyle = '#0b2a45';
    ctx.fillRect(0, 0, 960, 640);
  }
}

function loop(time) {
  const dt = Math.min(0.05, (time - G.lastTime) / 1000 || 0);
  G.lastTime = time;
  update(dt);
  draw(time);
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------
//  Init
// ---------------------------------------------------------------
function init() {
  const save = loadGame();
  if (save) el('btnContinue').classList.remove('hidden');

  el('btnNew').onclick = () => {
    el('title').classList.add('hidden');
    el('create').classList.remove('hidden');
    G.mode = 'create';
    buildCreateUI();
  };
  el('btnContinue').onclick = () => {
    const st = loadGame();
    if (st) startGame(st);
  };
  el('btnStart').onclick = () => {
    const name = el('cname').value.trim() || 'Ruffy';
    const look = { skin: CC.skin, hair: CC.hair, style: CC.style, shirt: CC.shirt, pants: '#31456b', hat: el('chat').checked };
    startGame(newState(name, look));
    saveGame();
  };
  el('btnFreeplay').onclick = () => {
    el('credits').classList.add('hidden');
    el('hud').classList.remove('hidden');
    G.mode = 'world';
  };

  setupTouch();
  setInterval(() => { if (G.mode === 'world') autoSave(); }, 25000);

  // Vorschau in der Charaktererstellung laufend aktualisieren
  setInterval(() => { if (G.mode === 'create') drawCreatePreview(); }, 120);

  requestAnimationFrame(loop);
}

init();

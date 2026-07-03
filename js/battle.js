// =====================================================================
//  Rundenbasiertes Kampfsystem (Pokémon-Stil)
// =====================================================================
'use strict';

const B = {
  active: false,
  enemy: null,
  boss: null,          // Boss-Id, falls Bosskampf
  msgs: [],
  afterMsgs: null,
  menu: [],
  sel: 0,
  energy: 10,
  maxEnergy: 10,
  usedRevive: false,
  eStun: 0, eBurn: 0,
  shake: 0, flash: 0,
  over: false,
};

// ---- Statistiken ----
function enemyStats(lvl, isBoss) {
  const hpMult = isBoss ? 1.5 : 1, atkMult = isBoss ? 1.15 : 1, defMult = isBoss ? 1.2 : 1;
  return {
    maxHp: Math.round((24 + lvl * 6.5) * hpMult),
    atk: (7 + lvl * 2.2) * atkMult,
    def: (2 + lvl * 1.1) * defMult,
  };
}

function playerMaxHp(st) {
  let hp = 70 + (st.lvl - 1) * 12;
  if (st.fruit && FRUITS[st.fruit].hp) hp += FRUITS[st.fruit].hp;
  return hp;
}
function playerAtk(st) {
  let a = 14 + (st.lvl - 1) * 3;
  if (st.crew.includes('zorro')) a *= 1.15;
  return a;
}
function playerDef(st) {
  let d = 5 + (st.lvl - 1) * 1.5;
  if (st.crew.includes('franky')) d *= 1.10;
  return d;
}

function playerMoves(st) {
  const moves = [];
  for (const m of BASE_MOVES) {
    if (m.minLvl && st.lvl < m.minLvl) continue;
    if (m.reqArm && st.haki.arm < m.reqArm) continue;
    if (m.reqConq && st.haki.conq < m.reqConq) continue;
    moves.push(m);
  }
  if (st.fruit) for (const m of FRUITS[st.fruit].moves) moves.push({ ...m, fruit: true });
  return moves;
}

// ---- Kampfstart ----
function makeEnemy(kindId, lvl, bossId) {
  const base = bossId ? BOSSES[bossId] : KINDS[kindId];
  const stats = enemyStats(lvl, !!bossId);
  return {
    name: base.name, sprite: base.sprite, lvl,
    hp: stats.maxHp, maxHp: stats.maxHp, atk: stats.atk, def: stats.def,
    boss: !!bossId,
  };
}

function startWildBattle(table) {
  const e = table[Math.floor(Math.random() * table.length)];
  const lvl = e.a + Math.floor(Math.random() * (e.b - e.a + 1));
  beginBattle(makeEnemy(e.k, lvl, null), null);
}

function startBossBattle(bossId) {
  beginBattle(makeEnemy(null, BOSSES[bossId].lvl, bossId), bossId);
}

function beginBattle(enemy, bossId) {
  const st = G.state;
  B.active = true; B.over = false;
  B.enemy = enemy; B.boss = bossId;
  B.energy = B.maxEnergy; B.usedRevive = false;
  B.eStun = 0; B.eBurn = 0; B.shake = 0; B.flash = 0;
  G.mode = 'battle';
  el('battleui').classList.remove('hidden');
  el('hud').classList.add('hidden');
  updateBattleBars();
  const intro = bossId
    ? [enemy.name + ' stellt sich dir entgegen!']
    : ['Ein wilder ' + enemy.name + ' (Lv. ' + enemy.lvl + ') greift an!'];
  showBMsgs(intro, openBattleMenu);
}

// ---- Nachrichten-Queue ----
function showBMsgs(lines, then) {
  B.msgs = lines.slice();
  B.afterMsgs = then;
  el('bmenu').classList.add('hidden');
  el('bmsg').classList.remove('hidden');
  el('bmsgtext').textContent = B.msgs.shift();
}
function advanceBMsg() {
  if (B.msgs.length) {
    el('bmsgtext').textContent = B.msgs.shift();
  } else {
    const cb = B.afterMsgs; B.afterMsgs = null;
    if (cb) cb();
  }
}

// ---- Menü ----
function openBattleMenu() {
  if (B.over) return;
  const st = G.state;
  B.menu = [];
  for (const m of playerMoves(st)) {
    B.menu.push({
      label: m.name, cost: m.cost ? m.cost + ' ASD' : '',
      disabled: m.cost > B.energy,
      run: () => playerAttack(m),
    });
  }
  for (const id of Object.keys(st.inventory.items)) {
    const qty = st.inventory.items[id];
    if (qty > 0 && (ITEMS[id].heal || ITEMS[id].energy)) {
      B.menu.push({
        label: ITEMS[id].name + ' ×' + qty, cost: 'Item',
        run: () => useBattleItem(id),
      });
    }
  }
  B.menu.push({ label: 'Flucht', cost: '', run: tryFlee });
  B.sel = 0;
  renderBattleMenu();
  el('bmsg').classList.add('hidden');
  el('bmenu').classList.remove('hidden');
}

function renderBattleMenu() {
  const wrap = el('bmenu');
  wrap.innerHTML = '';
  B.menu.forEach((opt, i) => {
    const d = document.createElement('div');
    d.className = 'bopt' + (i === B.sel ? ' sel' : '') + (opt.disabled ? ' dis' : '');
    d.innerHTML = '<span>' + opt.label + '</span><span class="cost">' + opt.cost + '</span>';
    d.onclick = () => { if (!opt.disabled) { B.sel = i; selectBattleOption(); } };
    wrap.appendChild(d);
  });
  const selEl = wrap.children[B.sel];
  if (selEl) selEl.scrollIntoView({ block: 'nearest' });
}

function selectBattleOption() {
  const opt = B.menu[B.sel];
  if (!opt || opt.disabled) return;
  el('bmenu').classList.add('hidden');
  opt.run();
}

function handleBattleKey(key) {
  if (!el('bmenu').classList.contains('hidden')) {
    if (key === 'up') { B.sel = (B.sel + B.menu.length - 1) % B.menu.length; renderBattleMenu(); }
    else if (key === 'down') { B.sel = (B.sel + 1) % B.menu.length; renderBattleMenu(); }
    else if (key === 'left') { B.sel = Math.max(0, B.sel - 2); renderBattleMenu(); }
    else if (key === 'right') { B.sel = Math.min(B.menu.length - 1, B.sel + 2); renderBattleMenu(); }
    else if (key === 'action') selectBattleOption();
  } else if (!el('bmsg').classList.contains('hidden')) {
    if (key === 'action') advanceBMsg();
  }
}

// ---- Schadensberechnung ----
function calcDamage(atk, pow, def, atkMult, defTakenMult) {
  const raw = atk * pow / 10 * (atkMult || 1);
  const red = def * 0.55;
  const variance = 0.85 + Math.random() * 0.3;
  return Math.max(1, Math.round((raw - red) * variance * (defTakenMult || 1)));
}

// ---- Spielerzug ----
function playerAttack(move) {
  const st = G.state;
  if (move.cost) B.energy -= move.cost;
  const armMult = 1 + 0.08 * st.haki.arm;
  const dmg = calcDamage(playerAtk(st), move.pow, B.enemy.def, armMult, 1);
  B.enemy.hp = Math.max(0, B.enemy.hp - dmg);
  B.shake = 14;
  const msgs = [st.name + ' setzt ' + move.name + ' ein!', B.enemy.name + ' erleidet ' + dmg + ' Schaden!'];

  // Frucht-Effekte
  if (move.fx === 'burn' && Math.random() < 0.4 && B.enemy.hp > 0) {
    B.eBurn = 3; msgs.push(B.enemy.name + ' brennt!');
  }
  if (move.fx === 'stun' && Math.random() < 0.35 && B.enemy.hp > 0) {
    B.eStun = 1; msgs.push(B.enemy.name + ' ist gelähmt!');
  }
  if (move.fx === 'drain') {
    const heal = Math.round(dmg * 0.5);
    st.hp = Math.min(playerMaxHp(st), st.hp + heal);
    msgs.push('Du heilst dich um ' + heal + ' KP!');
  }
  updateBattleBars();
  if (B.enemy.hp <= 0) showBMsgs(msgs.concat([B.enemy.name + ' wurde besiegt!']), winSequence);
  else showBMsgs(msgs, enemyTurn);
}

function useBattleItem(id) {
  const st = G.state;
  const item = ITEMS[id];
  st.inventory.items[id]--;
  const msgs = [];
  if (item.heal) {
    let heal = item.heal;
    if (st.crew.includes('chopper')) heal = Math.round(heal * 1.5);
    const max = playerMaxHp(st);
    const before = st.hp;
    st.hp = Math.min(max, st.hp + heal);
    msgs.push('Du benutzt ' + item.name + ' und heilst ' + (st.hp - before) + ' KP!');
  }
  if (item.energy) {
    B.energy = Math.min(B.maxEnergy, B.energy + item.energy);
    msgs.push('Du benutzt ' + item.name + '! Ausdauer +' + item.energy + '.');
  }
  updateBattleBars();
  showBMsgs(msgs, enemyTurn);
}

function tryFlee() {
  const st = G.state;
  if (B.boss) { showBMsgs(['Vor diesem Kampf gibt es kein Entkommen!'], openBattleMenu); return; }
  let chance = 0.5 + (st.lvl - B.enemy.lvl) * 0.05;
  if (st.crew.includes('lysop')) chance += 0.25;
  if (Math.random() < Math.max(0.15, Math.min(0.95, chance))) {
    showBMsgs(['Du entkommst dem Kampf!'], endBattle);
  } else {
    showBMsgs(['Flucht gescheitert!'], enemyTurn);
  }
}

// ---- Gegnerzug ----
function enemyTurn() {
  if (B.over) return;
  const st = G.state;
  const msgs = [];

  // Brennen
  if (B.eBurn > 0) {
    const burnDmg = Math.max(2, Math.round(B.enemy.maxHp * 0.06));
    B.enemy.hp = Math.max(0, B.enemy.hp - burnDmg);
    B.eBurn--;
    msgs.push(B.enemy.name + ' erleidet ' + burnDmg + ' Verbrennungsschaden!');
    if (B.enemy.hp <= 0) {
      updateBattleBars();
      showBMsgs(msgs.concat([B.enemy.name + ' wurde besiegt!']), winSequence);
      return;
    }
  }
  // Lähmung
  if (B.eStun > 0) {
    B.eStun--;
    updateBattleBars();
    showBMsgs(msgs.concat([B.enemy.name + ' ist gelähmt und kann nicht angreifen!']), roundEnd);
    return;
  }
  // Königshaki
  if (st.haki.conq > 0 && Math.random() < 0.06 * st.haki.conq) {
    showBMsgs(msgs.concat(['Dein Königshaki lässt ' + B.enemy.name + ' erzittern!']), roundEnd);
    return;
  }
  // Observationshaki / Brook: Ausweichen
  let dodge = 0.05 * st.haki.obs;
  if (st.crew.includes('brook')) dodge += 0.10;
  if (Math.random() < dodge) {
    showBMsgs(msgs.concat(['Du weichst dem Angriff von ' + B.enemy.name + ' aus!']), roundEnd);
    return;
  }

  const pow = 9 + Math.random() * 4;
  let taken = calcDamage(B.enemy.atk, pow, playerDef(st), 1, 1);
  taken = Math.round(taken * (1 - 0.06 * st.haki.arm));
  if (st.fruit && FRUITS[st.fruit].takenMult) taken = Math.round(taken * FRUITS[st.fruit].takenMult);
  taken = Math.max(1, taken);
  st.hp = Math.max(0, st.hp - taken);
  B.flash = 14;
  msgs.push(B.enemy.name + ' greift an! Du erleidest ' + taken + ' Schaden!');

  if (st.hp <= 0) {
    if (st.crew.includes('chopper') && !B.usedRevive) {
      B.usedRevive = true;
      st.hp = Math.round(playerMaxHp(st) * 0.4);
      msgs.push('Chopper flickt dich in letzter Sekunde zusammen! (' + st.hp + ' KP)');
      updateBattleBars();
      showBMsgs(msgs, roundEnd);
      return;
    }
    updateBattleBars();
    showBMsgs(msgs.concat(['Du gehst zu Boden...']), loseSequence);
    return;
  }
  updateBattleBars();
  showBMsgs(msgs, roundEnd);
}

function roundEnd() {
  B.energy = Math.min(B.maxEnergy, B.energy + 2);
  updateBattleBars();
  openBattleMenu();
}

// ---- Sieg / Niederlage ----
function winSequence() {
  const st = G.state;
  const msgs = [];
  let xp = B.enemy.lvl * 15 * (B.boss ? 4 : 1);
  if (st.crew.includes('robin')) xp = Math.round(xp * 1.2);
  let berry = Math.round(B.enemy.lvl * 12 + Math.random() * B.enemy.lvl * 6);
  if (B.boss) berry = BOSSES[B.boss].berry;
  st.berries += berry;
  msgs.push('Du erhältst ' + xp + ' EP und ' + berry.toLocaleString('de-DE') + ' Berry!');

  if (B.boss) {
    const boss = BOSSES[B.boss];
    st.flags['boss_' + B.boss] = true;
    st.bounty = Math.max(st.bounty, boss.bounty);
    msgs.push('Dein Kopfgeld steigt auf ' + boss.bounty.toLocaleString('de-DE') + ' Berry!');
    if (boss.defeated) msgs.push(boss.name + ': "' + boss.defeated.join(' ') + '"');
  }

  msgs.push(...gainXp(xp));

  if (st.crew.includes('sanji')) {
    const max = playerMaxHp(st);
    if (st.hp < max) {
      const heal = Math.round(max * 0.2);
      st.hp = Math.min(max, st.hp + heal);
      msgs.push('Sanji kocht dir etwas — +' + heal + ' KP!');
    }
  }
  showBMsgs(msgs, endBattle);
}

function loseSequence() {
  showBMsgs(['Deine Crew zieht dich aus dem Wasser...'], () => {
    endBattle();
    playerDefeated();
  });
}

function endBattle() {
  B.active = false; B.over = true;
  el('battleui').classList.add('hidden');
  el('hud').classList.remove('hidden');
  G.mode = 'world';
  updateHUD();
  autoSave();
}

// ---- Anzeige ----
function setHpBar(elFill, cur, max) {
  const pct = Math.max(0, Math.min(100, cur / max * 100));
  elFill.style.width = pct + '%';
  elFill.className = 'hpfill' + (pct < 25 ? ' crit' : pct < 55 ? ' low' : '');
}

function updateBattleBars() {
  const st = G.state;
  el('ename').textContent = B.enemy.name;
  el('elvl').textContent = 'Lv. ' + B.enemy.lvl;
  setHpBar(el('ehp'), B.enemy.hp, B.enemy.maxHp);
  el('estatus').textContent =
    (B.eBurn > 0 ? '🔥 brennt ' : '') + (B.eStun > 0 ? '⚡ gelähmt' : '');
  el('pname').textContent = st.name;
  el('plvl').textContent = 'Lv. ' + st.lvl;
  const max = playerMaxHp(st);
  setHpBar(el('php'), st.hp, max);
  el('phpnum').textContent = st.hp + ' / ' + max + ' KP';
  el('penergy').textContent = 'Ausdauer: ' + B.energy + '/' + B.maxEnergy;
}

// ---- Kampfszene zeichnen ----
function drawBattle(c, time) {
  // Hintergrund
  const grd = c.createLinearGradient(0, 0, 0, 640);
  grd.addColorStop(0, '#87ceeb'); grd.addColorStop(0.55, '#bfe3f0');
  grd.addColorStop(0.55, '#2a7ab5'); grd.addColorStop(1, '#134a7c');
  c.fillStyle = grd; c.fillRect(0, 0, 960, 640);
  // Sonne & Wolken
  c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(830, 80, 40, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.8)';
  c.beginPath(); c.arc(200, 90, 26, 0, 7); c.arc(240, 84, 32, 0, 7); c.arc(280, 92, 24, 0, 7); c.fill();

  let ex = 700, ey = 240, px = 240, py = 470;
  if (B.shake > 0) { ex += Math.sin(time / 25) * 8; B.shake--; }
  if (B.flash > 0) { px += Math.sin(time / 25) * 8; B.flash--; }

  // Plattformen
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.beginPath(); c.ellipse(ex, ey + 66, 130, 26, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(px + 30, py + 40, 110, 24, 0, 0, 7); c.fill();

  // Gegner
  if (B.enemy) drawEnemySprite(c, ex, ey, B.enemy.sprite, time);
  // Spieler (Rückenansicht)
  drawChar(c, px - 30, py - 70, 6.5, G.state.look, 'up', Math.floor(time / 450) % 2);

  if (B.flash > 6) {
    c.fillStyle = 'rgba(255,60,60,0.15)';
    c.fillRect(0, 0, 960, 640);
  }
}

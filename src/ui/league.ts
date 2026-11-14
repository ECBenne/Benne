import type { Game } from '../game';
import { h, onTap, spriteCanvas, icons, amuletIcon, heartIcon, pixIcon } from './dom';
import { sfx } from '../audio';
import { chooseAmulet } from './gear';
import { applyWin, battleStats } from './reward';
import { SPECIES, NATURES, NATURE_IDS, baseForm, formAt } from '../data/species';
import { MOVES } from '../data/moves';
import { TYPE_NAMES, typeEffectiveness, TypeId } from '../data/types';
import { AMULETS, PRICES } from '../data/items';
import { ARENA_MODS, NODE_INFO, LAYERS, MAX_TIER, BOSSES } from '../data/league';
import { MAPS } from '../data/maps';
import { STATS, STAT_NAMES, BONUS_MAX, computeStats } from '../battle/mon';
import * as L from '../league';
import { newOwned, markSeen, gainXp, gainPlayerXp, MapNode, Run, ROSTER_MAX } from '../state';
import { Rng } from '../core/util';
import type { Battle } from '../battle/battle';

const R = () => Math.random();
const tname = (t: TypeId) => TYPE_NAMES[t].toUpperCase();

export function leagueEntry(g: Game) { if (g.save.run) showMap(g); else showNewRun(g); }

// ───────────── Neue Liga ─────────────
function showNewRun(g: Game) {
  let tier = Math.min(g.save.tier, MAX_TIER);
  const render = () => {
    const box: HTMLElement[] = [];
    const boss = BOSSES[(tier - 1) % BOSSES.length];
    box.push(h('h2', '', 'NEUE LIGA'));
    const row = h('div', 'seg2');
    for (let t = 1; t <= MAX_TIER; t++) { const open = t <= g.save.tier; const b = h('button', t === tier ? 'on' : '', open ? 'STUFE ' + t : '🔒 ' + t); if (!open) b.style.opacity = '.4'; onTap(b, () => { if (!open) return g.toast('GEWINNE STUFE ' + (t - 1)); sfx.ui(); tier = t; render(); }); row.appendChild(b); }
    const ban = h('div', 'banner2'); ban.append(h('b', '', 'BOSS: ' + boss.name.toUpperCase()), document.createTextNode(boss.title.toUpperCase() + ' · ARENA: ' + MAPS[boss.map].name.toUpperCase() + (boss.type ? ' · TYP ' + tname(boss.type) : '')));
    const strip = h('div', 'tstrip');
    for (const o of g.teamOwned) { const c = h('div', 'tmini'); c.append(spriteCanvas(o.sp, 1), h('span', '', SPECIES[o.sp].name.toUpperCase().slice(0, 10)), h('span', '', 'LV ' + o.level)); strip.appendChild(c); }
    const legend = h('div', 'pills');
    for (const k of ['battle', 'elite', 'rest', 'shop', 'event', 'boss'] as const) { const p = h('span', 'pill'); p.style.display = 'inline-flex'; p.style.alignItems = 'center'; p.style.gap = '5px'; p.append(pixIcon(k, 1), document.createTextNode(NODE_INFO[k].label)); legend.append(p); }
    const info = h('div', 'bigp', LAYERS + ' ETAPPEN BIS ZUM BOSS. DU WÄHLST DEN WEG. DEINE KP BLEIBEN ZWISCHEN DEN KÄMPFEN ERHALTEN – TEILE TRÄNKE UND RASTPLÄTZE GUT EIN.');
    const go = h('button', 'btn big', 'LIGA STARTEN');
    onTap(go, () => { sfx.ui(); g.save.run = L.newRun(g.save, tier); g.save.stats.runs++; g.persist(); showMap(g); });
    box.push(row, ban, h('div', 'sec', 'DEIN TEAM'), strip, legend, info, go);
    g.tabScreen('liga', box);
  };
  render();
}

// ───────────── Karte ─────────────
function teamStrip(g: Game, run: Run, onPick?: (id: number) => void) {
  const strip = h('div', 'tstrip');
  for (const id of run.team) {
    const o = L.ownedOf(g.save, id), hp = run.hp[id] ?? 1, mx = L.maxHpOf(o);
    const c = h('button', 'tmini' + (hp <= 0 ? ' ko' : ''));
    const nm = h('span', '', SPECIES[o.sp].name.toUpperCase().slice(0, 9) + ' ' + o.level);
    if (o.item) { const d = h('i', 'it'); d.style.background = AMULETS[o.item].color; nm.appendChild(d); }
    const bar = h('div', 'bar'); const i = h('i'); i.style.width = Math.round(hp * 100) + '%'; i.className = hp > 0.5 ? '' : hp > 0.2 ? 'mid' : 'low'; bar.appendChild(i);
    c.append(spriteCanvas(o.sp, 1), nm, bar, h('span', '', hp <= 0 ? 'K.O.' : Math.round(hp * mx) + '/' + mx));
    if (onPick) onTap(c, () => { sfx.ui(); onPick(id); });
    strip.appendChild(c);
  }
  return strip;
}

export function showMap(g: Game) {
  const run = g.save.run!; run.pending = null;
  const reach = new Set(L.reachable(run).map((n) => n.id));
  const curLayer = run.at === null ? -1 : L.nodeById(run, run.at).layer;
  const box: HTMLElement[] = [];
  box.push(h('h2', '', 'LIGA STUFE ' + run.tier), h('div', 'subt', 'ETAPPE ' + Math.min(LAYERS, curLayer + 2) + ' VON ' + LAYERS + ' · TIPPE EIN MONSTER ZUM HEILEN'), teamStrip(g, run, (id) => monMenu(g, id)));
  const wrap = h('div', 'mapwrap');
  let firstGo: HTMLElement | null = null;
  const els = new Map<number, HTMLElement>();
  for (const layer of [...run.layers].reverse()) {
    const row = h('div', 'layer');
    for (const n of layer) {
      const info = NODE_INFO[n.kind];
      const done = L.isDone(run, n), go = reach.has(n.id);
      const b = h('button', 'node' + (done ? ' done' : go ? ' go' : ' lock') + (run.at === n.id ? ' cur' : ''));
      b.style.setProperty('--c', info.color);
      b.append(pixIcon(n.kind, 2), h('b', '', done ? '✓ ' + info.label : info.label));
      onTap(b, () => { if (go) { sfx.ui(); enterNode(g, n); } else g.toast(done ? 'SCHON ERLEDIGT' : 'NOCH NICHT ERREICHBAR'); });
      els.set(n.id, b); row.appendChild(b); if (go && !firstGo) firstGo = b;
    }
    wrap.appendChild(row);
  }
  box.push(wrap);
  // Verbindungslinien nach dem Layout
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); wrap.prepend(svg as unknown as Node as HTMLElement);
  const draw = () => {
    svg.innerHTML = ''; const wr = wrap.getBoundingClientRect();
    for (const layer of run.layers) for (const n of layer) for (const t of n.next) {
      const a = els.get(n.id)!.getBoundingClientRect(), b = els.get(t)!.getBoundingClientRect();
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('x1', String(a.left + a.width / 2 - wr.left)); ln.setAttribute('y1', String(a.top - wr.top));
      ln.setAttribute('x2', String(b.left + b.width / 2 - wr.left)); ln.setAttribute('y2', String(b.top + b.height - wr.top));
      const onPath = L.isDone(run, n) && (L.isDone(run, L.nodeById(run, t)) || reach.has(t)) && run.at !== null && L.nodeById(run, run.at).layer >= n.layer && (run.at === n.id || L.isDone(run, n) && L.nodeById(run, t).layer <= curLayer + 1);
      ln.setAttribute('stroke', reach.has(t) && run.at === n.id ? '#f8d030' : onPath ? '#7ad088' : '#3a4668'); ln.setAttribute('stroke-width', '3'); ln.setAttribute('stroke-dasharray', reach.has(t) ? '' : '5 4');
      svg.appendChild(ln);
    }
  };
  let armed = false;
  const quit = h('button', 'btn ghost', 'LIGA ABBRECHEN');
  onTap(quit, () => {
    if (!armed) { armed = true; quit.textContent = 'WIRKLICH? MÜNZEN BLEIBEN'; quit.classList.add('danger'); setTimeout(() => { armed = false; quit.textContent = 'LIGA ABBRECHEN'; quit.classList.remove('danger'); }, 3000); return; }
    g.save.run = null; g.persist(); g.showHub();
  });
  box.push(quit);
  g.tabScreen('liga', box);
  requestAnimationFrame(() => { draw(); const sc = g.el.screens.querySelector('.scroll') as HTMLElement; if (!sc) return; const t = (firstGo as HTMLElement | null); if (t) sc.scrollTop = Math.max(0, t.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 200); });
}

// ───────────── Monster-Menü auf der Karte ─────────────
function monMenu(g: Game, id: number) {
  const run = g.save.run!; const o = L.ownedOf(g.save, id);
  const hp = run.hp[id] ?? 1, mx = L.maxHpOf(o), st = computeStats(o.sp, o.level, o.bonus, o.item);
  const box = h('div', 'page');
  const sp = SPECIES[o.sp];
  box.append(h('h2', '', sp.name.toUpperCase()), h('div', 'sub', sp.types.map((t) => tname(t)).join('/') + ' · LV ' + o.level + ' · ' + NATURES[o.nature].name.toUpperCase()));
  const art = h('div', 'tmini'); art.append(spriteCanvas(o.sp, 2)); (art as HTMLElement).style.maxWidth = '160px';
  const bar = h('div', 'bar'); bar.style.width = '100%'; const i = h('i'); i.style.width = Math.round(hp * 100) + '%'; i.className = hp > 0.5 ? '' : hp > 0.2 ? 'mid' : 'low'; bar.appendChild(i);
  art.append(bar, h('span', '', hp <= 0 ? 'K.O.' : Math.round(hp * mx) + ' / ' + mx + ' KP'));
  box.append(art);
  const stats = h('div', 'bigp', `ANG ${st.atk} · VERT ${st.def} · SP.ANG ${st.spa} · SP.VERT ${st.spd} · TEMPO ${st.spe}`);
  box.append(stats);
  const mkBtn = (txt: string, cls: string, ok: boolean, fn: () => void) => { const b = h('button', 'btn ' + cls, txt); b.style.maxWidth = 'none'; if (!ok) b.classList.add('ghost'); onTap(b, () => { if (ok) { sfx.ui(); fn(); } }); return b; };
  box.append(
    mkBtn(`TRANK (×${g.save.inv.potion}) +45% KP`, '', g.save.inv.potion > 0 && hp > 0 && hp < 1, () => { g.save.inv.potion--; L.healFrac(run, id, 0.45); g.persist(); sfx.handle({ type: 'heal' }, false); monMenu(g, id); }),
    mkBtn(`SUPERTRANK (×${g.save.inv.super}) VOLL`, '', g.save.inv.super > 0 && hp > 0 && hp < 1, () => { g.save.inv.super--; L.healFrac(run, id, 1); g.persist(); sfx.handle({ type: 'heal' }, false); monMenu(g, id); }),
    mkBtn(`BELEBER (×${g.save.inv.revive}) 40% KP`, '', g.save.inv.revive > 0 && hp <= 0, () => { g.save.inv.revive--; run.hp[id] = 0.4; g.persist(); sfx.handle({ type: 'heal' }, false); monMenu(g, id); }),
    mkBtn(o.item ? 'AMULETT: ' + AMULETS[o.item].name.toUpperCase() : 'AMULETT ANLEGEN', 'ghost', true, () => chooseAmulet(g, o, () => monMenu(g, id))),
    g.backBtn(() => showMap(g)),
  );
  g.setScreen(box);
}

// ───────────── Knoten betreten ─────────────
function completeNode(g: Game, node: MapNode, toastText?: string) {
  const run = g.save.run!; run.at = node.id; run.pending = null; g.persist();
  showMap(g); if (toastText) g.toast(toastText);
}

function enterNode(g: Game, node: MapNode) {
  const run = g.save.run!; run.pending = node.id;
  if (node.kind === 'battle' || node.kind === 'elite' || node.kind === 'boss') scouting(g, node, L.makeEnemy(g.save, run, node));
  else if (node.kind === 'rest') restScreen(g, node);
  else if (node.kind === 'shop') shopScreen(g, node);
  else eventScreen(g, node);
}

// ───────────── Scouting & Aufstellung ─────────────
function matchupTip(g: Game, run: Run, spec: L.EnemySpec): string {
  const lead = spec.mons[0]; const et = SPECIES[lead.sp].types;
  const alive = run.team.filter((id) => (run.hp[id] ?? 1) > 0).map((id) => L.ownedOf(g.save, id));
  const adv = (att: TypeId[], defT: TypeId[], sp: string) => Math.max(...SPECIES[sp].moves.map((m) => (att.includes(MOVES[m].type as TypeId) ? typeEffectiveness(MOVES[m].type, defT) : 1)), ...att.map((t) => typeEffectiveness(t, defT)));
  const best = alive.map((o) => ({ o, e: Math.max(...att(o.sp).map((t) => typeEffectiveness(t, et))) })).sort((a, b) => b.e - a.e)[0];
  function att(sp: string) { return SPECIES[sp].moves.map((m) => MOVES[m].type as TypeId); }
  void adv;
  const first = alive[0];
  if (!first) return 'KEIN KAMPFFÄHIGES MONSTER! BENUTZE EINEN BELEBER AUF DER KARTE.';
  const threat = Math.max(...att(lead.sp).map((t) => typeEffectiveness(t, SPECIES[first.sp].types)));
  const mod = ARENA_MODS[spec.mod];
  let t = '';
  if (best && best.e > 1) t += 'TIPP: ' + SPECIES[best.o.sp].name.toUpperCase() + ' HAT TYPVORTEIL GEGEN DEN GEGNER-ANFÜHRER (' + tname(et[0]) + '). ';
  if (threat > 1) t += 'ACHTUNG: DER GEGNER HAT TYPVORTEIL GEGEN ' + SPECIES[first.sp].name.toUpperCase() + '. ';
  const map = MAPS[spec.map];
  if (map?.favors) {
    const mine = alive.filter((o) => SPECIES[o.sp].types.includes(map.favors!)), theirs = spec.mons.filter((x) => SPECIES[x.sp].types.includes(map.favors!));
    if (mine.length) t += 'ARENA-VORTEIL FÜR ' + SPECIES[mine[0].sp].name.toUpperCase() + '. ';
    if (theirs.length) t += 'ACHTUNG: DIE ARENA STÄRKT ' + SPECIES[theirs[0].sp].name.toUpperCase() + ' DES GEGNERS. ';
  } else if (map?.features.length) t += 'FELSEN BIETEN DECKUNG – DEFENSIV NUTZT SIE. ';
  return t || 'AUSGEGLICHENES MATCHUP. NUTZE FOKUS-BEFEHLE UND WECHSLE BEI SCHWACHEN KP.';
}

function scouting(g: Game, node: MapNode, spec: L.EnemySpec, wild = false) {
  g.toMenu();
  const run = g.save.run!;
  const box = h('div', 'page');
  const kindTxt = spec.kind === 'boss' ? 'BOSS-KAMPF' : spec.kind === 'elite' ? 'ELITE-KAMPF' : spec.kind === 'wild' ? 'WILDES RUDEL' : 'TRAINERKAMPF';
  box.append(g.coinBar(), h('h2', '', kindTxt), h('div', 'sub', spec.name.toUpperCase() + (spec.title ? ' · ' + spec.title.toUpperCase() : '')));
  const mod = ARENA_MODS[spec.mod];
  const map = MAPS[spec.map] ?? MAPS.meadow;
  const ban = h('div', 'banner2'); ban.append(h('b', '', 'ARENA: ' + map.name.toUpperCase()), document.createTextNode(map.desc.toUpperCase()));
  if (mod.id !== 'none') ban.append(document.createElement('br'), document.createTextNode('WETTER ' + mod.name.toUpperCase() + ': ' + mod.desc.toUpperCase()));
  ban.append(document.createElement('br'), document.createTextNode('BELOHNUNG ' + spec.coins + ' MÜNZEN' + (spec.amuletDrop ? ' + AMULETT' : '')));
  box.append(ban);
  const er = h('div', 'erow');
  for (const m of spec.mons) markSeen(g.save, m.sp);
  for (const m of spec.mons) {
    const c = h('div', 'ecard' + (m.boss ? ' boss' : ''));
    const sp = SPECIES[m.sp];
    const am = m.amulet ? AMULETS[m.amulet] : null;
    c.append(spriteCanvas(m.sp, 1), h('b', '', sp.name.toUpperCase()), h('span', '', 'LV ' + m.level + (m.boss ? ' · BOSS' : '')), h('span', '', sp.types.map((t) => tname(t)).join('/') + ' · ' + NATURES[m.nature].name.toUpperCase().slice(0, 6)));
    if (am) c.append(h('span', '', '◆ ' + am.name.toUpperCase()));
    er.appendChild(c);
  }
  box.append(er, h('div', 'tip', matchupTip(g, run, spec)), h('div', 'sec', 'DEINE AUFSTELLUNG (ERSTES = ANFÜHRER)'));
  run.team.forEach((id, i) => {
    const o = L.ownedOf(g.save, id), hp = run.hp[id] ?? 1;
    const row = h('div', 'ordrow'); row.style.opacity = hp > 0 ? '1' : '.5';
    const bar = h('div', 'bar'); const f = h('i'); f.style.width = Math.round(hp * 100) + '%'; f.className = hp > 0.5 ? '' : hp > 0.2 ? 'mid' : 'low'; bar.appendChild(f);
    const mv = h('div', 'mv');
    const up = h('button', 'mvb', '▲'), dn = h('button', 'mvb', '▼');
    onTap(up, () => { if (i > 0) { [run.team[i - 1], run.team[i]] = [run.team[i], run.team[i - 1]]; sfx.ui(); scouting(g, node, spec, wild); } });
    onTap(dn, () => { if (i < run.team.length - 1) { [run.team[i + 1], run.team[i]] = [run.team[i], run.team[i + 1]]; sfx.ui(); scouting(g, node, spec, wild); } });
    mv.append(up, dn);
    row.append(spriteCanvas(o.sp, 1), h('span', '', SPECIES[o.sp].name.toUpperCase().slice(0, 9) + ' ' + o.level), bar, h('span', '', hp <= 0 ? 'K.O.' : Math.round(hp * 100) + '%'), mv);
    box.appendChild(row);
  });
  const alive = run.team.some((id) => (run.hp[id] ?? 1) > 0);
  const go = h('button', 'btn big', 'KAMPF!');
  if (!alive) go.classList.add('ghost');
  onTap(go, () => { if (!alive) return g.toast('KEIN MONSTER KAMPFFÄHIG'); sfx.ui(); startBattle(g, node, spec, wild); });
  box.append(go);
  if (wild) { const skip = g.backBtn(() => completeNode(g, node, 'UMGANGEN'), 'UMGEHEN'); box.append(skip); }
  else box.append(g.backBtn(() => showMap(g), 'ZURÜCK ZUR KARTE'));
  g.setScreen(box);
}

function startBattle(g: Game, node: MapNode, spec: L.EnemySpec, wild: boolean) {
  const run = g.save.run!;
  const player = L.playerTrainer(g.save, run), enemy = L.enemyTrainer(spec);
  g.beginBattle({
    player, enemy, mod: spec.mod, map: spec.map,
    banner: spec.kind === 'boss' ? 'BOSS-KAMPF' : spec.kind === 'elite' ? 'ELITE-KAMPF' : 'KAMPF',
    sub: spec.name.toUpperCase(),
    onEnd: (win, b) => afterBattle(g, node, spec, win, b, wild),
  });
}

// ───────────── Nach dem Kampf ─────────────
function afterBattle(g: Game, node: MapNode, spec: L.EnemySpec, win: boolean, b: Battle, wild: boolean) {
  const run = g.save.run!; const pt = b.trainers[0];
  for (const m of pt.team) run.hp[m.ownerId] = m.alive ? m.hp / m.maxHp : 0;
  g.save.stats.battles++;
  const stat = (box: HTMLElement) => {
    const st = h('div', 'stats'); const sv = (k: string, v: string) => { const r = h('div', 'srow'); r.append(h('span', '', k), h('b', '', v)); st.appendChild(r); };
    sv('SCHADEN', String(b.stats.dmg[0])); sv('AUSGEWICHEN', String(b.stats.dodges[0])); sv('DAUER', Math.round(b.t) + 'S'); box.append(st);
  };
  if (!win) {
    g.save.run = null; gainPlayerXp(g.save, 8); g.persist();
    const box = h('div', 'modal result lose');
    box.append(h('h2', '', 'NIEDERLAGE'), h('div', 'sub', spec.name.toUpperCase() + ' HAT GEWONNEN. DIE LIGA IST VORBEI.'), (() => { const d = h('div'); stat(d); return d; })());
    box.append(h('div', 'lvup', 'BEHALTENE MÜNZEN: ' + run.earned), h('div', 'sub', 'MONSTER, AMULETTE UND TRAINING BLEIBEN ERHALTEN.'));
    const menu = h('button', 'btn big', 'ZUM MENÜ'); onTap(menu, () => { sfx.ui(); g.showHub(); }); box.append(menu);
    g.setScreen(box); return;
  }
  // Belohnungen: Sterne, Münzen, Erfahrung (Monster und Spieler)
  if (spec.kind === 'elite') g.save.stats.elites++;
  const r = applyWin(g, b, { coins: spec.coins, monXp: L.XP_MON[spec.kind], plXp: L.XP_PLAYER[spec.kind] });
  run.earned += r.total; run.won++;
  for (const id of run.team) if ((run.hp[id] ?? 0) > 0) L.healFrac(run, id, L.WIN_HEAL);
  const rng = new Rng((Math.random() * 1e9) | 0);
  let amuletGot: string | null = null;
  if (spec.kind === 'elite') { amuletGot = L.randomAmulets(rng, 1)[0]; g.save.inv.amulets.push(amuletGot); }
  if (!wild) { run.at = node.id; run.pending = null; }
  g.persist();
  const box = h('div', 'modal result win');
  box.append(h('h2', '', spec.kind === 'boss' ? 'BOSS BESIEGT!' : 'SIEG!'), h('div', 'sub', spec.name.toUpperCase() + ' IST BESIEGT'), ...r.nodes);
  if (amuletGot) box.append(h('div', 'evo', '◆ AMULETT: ' + AMULETS[amuletGot].name.toUpperCase()));
  box.append(battleStats(b));
  const next = h('button', 'btn big', 'WEITER');
  onTap(next, () => {
    sfx.ui();
    const afterRecruit = () => { if (spec.kind === 'boss') bossReward(g, run); else { g.toMenu(); showMap(g); } };
    if (rng.chance(spec.recruitChance)) recruitOffer(g, spec, afterRecruit); else afterRecruit();
  });
  box.append(next);
  g.setScreen(box);
}

function recruitOffer(g: Game, spec: L.EnemySpec, next: () => void) {
  const em = spec.mons[Math.floor(R() * spec.mons.length)];
  const sp = baseForm(em.sp), lvl = Math.max(5, em.level - 3);
  if (g.save.mons.length >= ROSTER_MAX) return next();
  const box = h('div', 'modal');
  box.append(h('h2', '', 'ANWERBEN?'), h('div', 'sub', 'EIN ' + SPECIES[sp].name.toUpperCase() + ' (LV ' + lvl + ') MÖCHTE SICH DIR ANSCHLIESSEN.'));
  const art = h('div', 'tmini'); art.append(spriteCanvas(sp, 2), h('span', '', SPECIES[sp].types.map((t) => tname(t)).join('/'))); (art as HTMLElement).style.maxWidth = '170px';
  const yes = h('button', 'btn big', 'ANWERBEN'); onTap(yes, () => { sfx.handle({ type: 'heal' }, false); g.own(newOwned(g.save.nextId++, formAt(sp, lvl), NATURE_IDS[Math.floor(R() * NATURE_IDS.length)], lvl)); g.save.stats.recruits++; g.persist(); g.toast(SPECIES[sp].name.toUpperCase() + ' ANGEWORBEN!'); next(); });
  const no = h('button', 'btn ghost', 'ABLEHNEN'); onTap(no, () => { sfx.back(); next(); });
  box.append(art, yes, no); g.setScreen(box);
}

function bossReward(g: Game, run: Run) {
  g.toMenu();
  const rng = new Rng((Math.random() * 1e9) | 0);
  const opts = L.randomAmulets(rng, 3);
  const box = h('div', 'page');
  box.append(h('h2', '', 'LIGA GEWONNEN!'), h('div', 'sub', 'WÄHLE DEINE BELOHNUNG: EIN AMULETT.'));
  for (const id of opts) {
    const a = AMULETS[id];
    const r = h('button', 'amrow'); const tx = h('div', 'tx'); tx.append(h('div', '', a.name.toUpperCase()), h('small', '', a.desc.toUpperCase()));
    r.append(amuletIcon(a.color, 3), tx);
    onTap(r, () => { sfx.handle({ type: 'heal' }, false); g.save.inv.amulets.push(id); finishLeague(g, run, a.name.toUpperCase()); });
    box.appendChild(r);
  }
  g.setScreen(box);
}

function finishLeague(g: Game, run: Run, gotName: string) {
  g.save.best = Math.max(g.save.best, run.tier);
  const unlocked = Math.min(MAX_TIER, Math.max(g.save.tier, run.tier + 1)); const newTier = unlocked > g.save.tier;
  g.save.tier = unlocked; g.save.stats.clears++; g.save.run = null; g.persist();
  const box = h('div', 'page');
  box.append(h('h2', '', 'LIGA GESCHAFFT!'), h('div', 'sub', 'STUFE ' + run.tier + ' ABGESCHLOSSEN'));
  const st = h('div', 'stats'); const sv = (k: string, v: string) => { const r = h('div', 'srow'); r.append(h('span', '', k), h('b', '', v)); st.appendChild(r); };
  sv('SIEGE', String(run.won)); sv('MÜNZEN VERDIENT', String(run.earned)); sv('AMULETT', gotName);
  box.append(st);
  if (newTier) box.append(h('div', 'evo', '★ LIGA-STUFE ' + unlocked + ' FREIGESCHALTET!'));
  else if (run.tier >= MAX_TIER) box.append(h('div', 'evo', '★ DU HAST ALLE LIGEN GESCHAFFT!'));
  const menu = h('button', 'btn big', 'ZUM MENÜ'); onTap(menu, () => { sfx.ui(); g.showHub(); });
  box.append(menu); g.setScreen(box);
}

// ───────────── Rast ─────────────
function restScreen(g: Game, node: MapNode) {
  g.toMenu();
  const run = g.save.run!;
  const box = h('div', 'page');
  box.append(g.coinBar(), h('h2', '', 'RASTPLATZ'), h('div', 'sub', 'EIN RUHIGER ORT. WAS BRAUCHT DEIN TEAM?'), teamStrip(g, run));
  const heal = h('button', 'btn big choice', 'RASTEN: +50% KP · K.O. WIRD MIT 25% KP WIEDERBELEBT');
  onTap(heal, () => { sfx.handle({ type: 'heal' }, false); for (const id of run.team) { if ((run.hp[id] ?? 0) <= 0) run.hp[id] = 0.25; else L.healFrac(run, id, 0.5); } completeNode(g, node, 'TEAM ERHOLT SICH'); });
  const train = h('button', 'btn choice', 'TRAINIEREN: +1 TRAININGSSTUFE (DAUERHAFT +4%)');
  onTap(train, () => { sfx.ui(); trainPick(g, node); });
  box.append(heal, train);
  g.setScreen(box);
}

function trainPick(g: Game, node: MapNode) {
  const run = g.save.run!;
  const box = h('div', 'page');
  box.append(h('h2', '', 'TRAINING'), h('div', 'sub', 'WELCHES MONSTER SOLL TRAINIEREN?'));
  for (const id of run.team) {
    const o = L.ownedOf(g.save, id);
    const b = h('button', 'amrow'); const tx = h('div', 'tx'); tx.append(h('div', '', SPECIES[o.sp].name.toUpperCase() + ' LV' + o.level), h('small', '', STATS.map((k) => k.toUpperCase() + ' ' + o.bonus[k]).join(' · ')));
    b.append(spriteCanvas(o.sp, 1), tx); onTap(b, () => { sfx.ui(); trainStat(g, node, id); }); box.appendChild(b);
  }
  box.append(g.backBtn(() => restScreen(g, node)));
  g.setScreen(box);
}

function trainStat(g: Game, node: MapNode, id: number) {
  const o = L.ownedOf(g.save, id);
  const box = h('div', 'page');
  box.append(h('h2', '', SPECIES[o.sp].name.toUpperCase()), h('div', 'sub', 'WORAUF LIEGT DER FOKUS? (MAX. ' + BONUS_MAX + ' STUFEN)'));
  for (const k of STATS) {
    const row = h('div', 'statrow'); const pips = h('div', 'pips'); for (let i = 0; i < BONUS_MAX; i++) pips.appendChild(h('i', i < o.bonus[k] ? 'on' : ''));
    const b = h('button', 'chip gold', o.bonus[k] >= BONUS_MAX ? 'MAX' : '+'); if (o.bonus[k] >= BONUS_MAX) b.classList.add('off');
    onTap(b, () => { if (o.bonus[k] >= BONUS_MAX) return; sfx.handle({ type: 'heal' }, false); o.bonus[k]++; completeNode(g, node, STAT_NAMES[k].toUpperCase() + ' +'); });
    row.append(h('span', '', STAT_NAMES[k].toUpperCase()), pips, b); box.appendChild(row);
  }
  box.append(g.backBtn(() => trainPick(g, node)));
  g.setScreen(box);
}

// ───────────── Händler ─────────────
function shopScreen(g: Game, node: MapNode) {
  g.toMenu();
  const run = g.save.run!;
  const stock = (run.shops[node.id] ??= L.makeShopStock(run, node));
  const box = h('div', 'page');
  box.append(g.coinBar(), h('h2', '', 'WANDERHÄNDLER'), h('div', 'sub', 'RABATT -15%. VORRAT IST BEGRENZT.'));
  const row = (ic: HTMLElement, name: string, desc: string, price: number, left: string, ok: boolean, fn: () => void) => {
    const r = h('div', 'row card2'); const art = h('div', 'sart ico'); art.appendChild(ic);
    const info = h('div', 'sinfo'); info.append(h('div', 'nm', name), h('div', 'mvs', desc), h('div', 'ty', left));
    const b = h('button', 'chip gold price', ok ? String(price) : 'VERKAUFT'); if (ok) b.prepend(icons.coin(1)); if (!ok || g.save.coins < price) b.classList.add('off');
    onTap(b, () => { if (!ok) return; if (g.save.coins < price) return g.toast('NICHT GENUG MÜNZEN'); g.save.coins -= price; fn(); g.persist(); sfx.handle({ type: 'heal' }, false); shopScreen(g, node); });
    r.append(art, info, b); box.appendChild(r);
  };
  row(icons.potion(), 'TRANK', 'HEILT 45% KP.', L.shopPrice('potion'), 'VORRAT: ' + stock.potion, stock.potion > 0, () => { stock.potion--; g.save.inv.potion++; });
  row(icons.super(), 'SUPERTRANK', 'VOLLE KP UND STATUS.', L.shopPrice('super'), 'VORRAT: ' + stock.super, stock.super > 0, () => { stock.super--; g.save.inv.super++; });
  row(heartIcon(3), 'BELEBER', 'BELEBT EIN K.O.-MONSTER.', L.shopPrice('revive'), 'VORRAT: ' + stock.revive, stock.revive > 0, () => { stock.revive--; g.save.inv.revive++; });
  stock.amulets.forEach((a, i) => { const d = AMULETS[a.id]; row(amuletIcon(d.color, 3), d.name.toUpperCase(), d.desc.toUpperCase(), a.price, 'EINMALIG', a.price > 0, () => { g.save.inv.amulets.push(a.id); stock.amulets[i].price = 0; }); });
  const go = h('button', 'btn big', 'WEITER'); onTap(go, () => { sfx.ui(); completeNode(g, node); }); box.append(go);
  g.setScreen(box);
}

// ───────────── Ereignisse ─────────────
const EVENTS = ['treasure', 'spring', 'wild', 'trader', 'altar'] as const;
function eventScreen(g: Game, node: MapNode) {
  g.toMenu();
  const run = g.save.run!;
  const id = (run.events[node.id] ??= EVENTS[new Rng(run.seed + node.id * 7).int(0, EVENTS.length - 1)]);
  const box = h('div', 'page');
  const choice = (txt: string, cls: string, fn: () => void) => { const b = h('button', 'btn choice ' + cls, txt); onTap(b, () => { sfx.ui(); fn(); }); box.appendChild(b); };
  const result = (title: string, text: string) => { const b2 = h('div', 'page'); b2.append(h('h2', '', title), h('div', 'bigp', text)); const ok = h('button', 'btn big', 'WEITER'); onTap(ok, () => { sfx.ui(); completeNode(g, node); }); b2.append(ok); g.setScreen(b2); };
  const alive = () => run.team.filter((i) => (run.hp[i] ?? 0) > 0);
  if (id === 'treasure') {
    box.append(g.coinBar(), h('h2', '', 'VERLASSENE TRUHE'), h('div', 'bigp', 'AM WEGESRAND STEHT EINE ALTE TRUHE. NIEMAND IST IN DER NÄHE. ÖFFNEN?'));
    choice('ÖFFNEN', '', () => {
      const r = R();
      if (r < 0.6) { const c = 80 + Math.floor(R() * 70); g.save.coins += c; run.earned += c; result('SCHATZ!', 'DU FINDEST ' + c + ' MÜNZEN.'); }
      else if (r < 0.85) { const a = L.randomAmulets(new Rng((R() * 1e9) | 0), 1)[0]; g.save.inv.amulets.push(a); result('SELTENER FUND!', 'DU FINDEST EIN AMULETT: ' + AMULETS[a].name.toUpperCase() + '.'); }
      else { const t = alive()[0]; if (t !== undefined) run.hp[t] = Math.max(0.05, (run.hp[t] ?? 1) - 0.25); result('FALLE!', 'EIN GIFTPFEIL TRIFFT DEIN ERSTES MONSTER: -25% KP.'); }
    });
    choice('LIEBER NICHT', 'ghost', () => completeNode(g, node));
  } else if (id === 'spring') {
    box.append(g.coinBar(), h('h2', '', 'HEILQUELLE'), h('div', 'bigp', 'EIN KLARER, SCHIMMERNDER QUELLTEUCH. DAS WASSER STRAHLT SANFT.'));
    choice('TRINKEN: +30% KP FÜR ALLE', '', () => { for (const i of alive()) L.healFrac(run, i, 0.3); sfx.handle({ type: 'heal' }, false); result('ERFRISCHT', 'DEIN TEAM FÜHLT SICH BESSER: +30% KP.'); });
  } else if (id === 'wild') {
    box.append(g.coinBar(), h('h2', '', 'WILDES RUDEL'), h('div', 'bigp', 'EIN RUDEL WILDER MONSTER VERSPERRT DEN WEG. KÄMPFEN BRINGT VIEL BEUTE – ABER KOSTET KP.'));
    choice('KÄMPFEN', '', () => scouting(g, node, L.makeEnemy(g.save, run, node, true), true));
    choice('UMGEHEN', 'ghost', () => completeNode(g, node));
  } else if (id === 'trader') {
    const a = L.randomAmulets(new Rng(run.seed + node.id * 13), 1)[0]; const price = 200;
    box.append(g.coinBar(), h('h2', '', 'FAHRENDER HÄNDLER'), h('div', 'bigp', 'EIN HÄNDLER BIETET EIN SELTENES AMULETT AN: ' + AMULETS[a].name.toUpperCase() + ' (' + AMULETS[a].desc.toUpperCase() + ') FÜR ' + price + ' MÜNZEN.'));
    choice('KAUFEN (' + price + ')', g.save.coins >= price ? '' : 'ghost', () => { if (g.save.coins < price) return g.toast('NICHT GENUG MÜNZEN'); g.save.coins -= price; g.save.inv.amulets.push(a); g.persist(); result('GEKAUFT', AMULETS[a].name.toUpperCase() + ' IST JETZT DEIN.'); });
    choice('ABLEHNEN', 'ghost', () => completeNode(g, node));
  } else {
    box.append(g.coinBar(), h('h2', '', 'ALTAR DER KRAFT'), h('div', 'bigp', 'EIN UNHEIMLICHER ALTAR FLÜSTERT: OPFERE 20% DER KP DEINES ERSTEN MONSTERS UND ERHALTE DAFÜR 60 ERFAHRUNG.'));
    choice('OPFERN (+60 EP)', '', () => { const t = alive()[0]; if (t === undefined) return completeNode(g, node); const o = L.ownedOf(g.save, t); const r = gainXp(g.save, o, 60); run.hp[t] = Math.max(0.05, (run.hp[t] ?? 1) - 0.2); g.persist(); result('KRAFT!', SPECIES[o.sp].name.toUpperCase() + ' ERHÄLT 60 EP' + (r.levels ? ' UND IST NUN LEVEL ' + o.level + '.' : '.')); });
    choice('ABLEHNEN', 'ghost', () => completeNode(g, node));
  }
  g.setScreen(box);
}

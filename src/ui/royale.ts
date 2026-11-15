import type { Game } from '../game';
import { h, onTap, spriteCanvas, pixIcon } from './dom';
import { sfx } from '../audio';
import { SPECIES, BASE_IDS, NATURE_IDS, formAt } from '../data/species';
import { getSprite } from '../gfx/sprites';
import { dirFromAngle } from '../gfx/spriteBuilder';
import { Battle } from '../battle/battle';
import { Mon, Trainer, sizeHpMul } from '../battle/mon';
import * as L from '../league';
import { Rng, clamp } from '../core/util';
import { playMenu } from './modes';
import { snap, announce } from './gains';
import { gainXp, gainPlayerXp } from '../state';
import { track } from '../systems/live';
import { TYPE_FX } from '../data/types';
import type { TypeId } from '../data/types';

/** Battle Royale: riesige Karte, 25 andere Monster auf dem Spielerlevel, schrumpfender Sturm, Items zum Einsammeln. */
const MAP = 1400, PLAYERS = 25, SPEED = 82, AI_SPEED = 50, FIGHT_R = 34;
interface Rm { id: number; sp: string; lvl: number; nature: string; hp: number; x: number; y: number; alive: boolean; goal: { x: number; y: number } | null; cd: number; chase: number; dir: number; moving: boolean; place: number }
interface Item { id: number; kind: 'heal' | 'power' | 'focus'; x: number; y: number }
const ITEM_COL: Record<Item['kind'], string> = { heal: '#58e078', power: '#ff6a50', focus: '#58b8ff' };
const ITEM_NAME: Record<Item['kind'], string> = { heal: 'HEILUNG', power: 'KRAFT', focus: 'FOKUS' };

/** Startbildschirm des Modus. */
export function royaleIntro(g: Game) {
  const s = g.save, lead = g.teamOwned[0], box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); playMenu(g); });
  box.append(bk, h('h2', '', 'BATTLE ROYALE'), h('div', 'subt', 'BESTE PLATZIERUNG: ' + (s.stats.royaleBest ? 'PLATZ ' + s.stats.royaleBest : '–') + ' · KILLS GESAMT: ' + s.stats.royaleKills));
  box.append(h('div', 'bigp', '26 MONSTER, EINE RIESIGE KARTE. NUR EINES BLEIBT ÜBRIG! DU STEUERST DEIN ANFÜHRER-MONSTER PER TIPPEN. BERÜHRST DU EIN ANDERES MONSTER, GIBT ES EINEN ECHTEN KAMPF. DEINE KP BLEIBEN ZWISCHEN DEN KÄMPFEN ERHALTEN – SAMMLE HEILUNG, KRAFT UND FOKUS AUF DER KARTE EIN. EIN STURM ENGT DIE KARTE EIN. DIE GEGNER HABEN DEIN LEVEL.'));
  box.append(h('div', 'banner2', 'BELOHNUNG NACH KILLS UND PLATZIERUNG – AUCH WENN DU VERLIERST. 5 KILLS ODER EIN PLATZ IN DEN TOP 3 GEBEN EINEN KISTENSCHLÜSSEL.'));
  if (lead) { const c = h('div', 'tmini'); c.style.margin = '6px auto'; c.append(spriteCanvas(lead.sp, 1), h('span', '', SPECIES[lead.sp].name.toUpperCase().slice(0, 12)), h('span', '', 'LV ' + lead.level)); box.append(h('div', 'sec', 'DEIN KÄMPFER'), c); }
  const go = h('button', 'btn big', 'ABSPRINGEN!'); onTap(go, () => { sfx.ui(); new Royale(g).start(); }); box.append(go); g.setScreen(box);
}

class Royale {
  rng = new Rng((Math.random() * 1e9) | 0);
  mons: Rm[] = []; items: Item[] = []; me!: Rm; owned!: ReturnType<Game['teamOwned']['at']> & object;
  t = 0; kills = 0; nid = 1; alive = 0; over = false; target: { x: number; y: number } | null = null; paused = false;
  buff = false; focusBonus = 0; zone = { x: MAP / 2, y: MAP / 2, r: 760 }; lastItem = 0; fightQueue = 0; msg = ''; msgT = 0;
  root!: HTMLDivElement; cv!: HTMLCanvasElement; g2!: CanvasRenderingContext2D; bg!: HTMLCanvasElement; hud!: { alive: HTMLElement; kills: HTMLElement; hpf: HTMLElement; hpt: HTMLElement; storm: HTMLElement; msg: HTMLElement };
  raf = 0; last = 0; before!: ReturnType<typeof snap>; camX = 0; camY = 0; mini!: HTMLCanvasElement;
  constructor(public g: Game) { this.owned = g.teamOwned[0]; this.before = snap(g.save); }

  start() {
    const lvl = this.owned.level;
    this.zone.x = MAP / 2 + this.rng.range(-140, 140); this.zone.y = MAP / 2 + this.rng.range(-140, 140);
    this.me = { id: 0, sp: this.owned.sp, lvl, nature: this.owned.nature, hp: 1, x: this.rng.range(300, 1100), y: this.rng.range(300, 1100), alive: true, goal: null, cd: 0, chase: 0, dir: 0, moving: false, place: 0 };
    this.mons.push(this.me);
    for (let i = 0; i < PLAYERS; i++) {
      const l = clamp(lvl + this.rng.int(-3, 2), 5, 60), sp = formAt(this.rng.pick(BASE_IDS), l);
      let x = 0, y = 0; for (let k = 0; k < 30; k++) { x = this.rng.range(80, MAP - 80); y = this.rng.range(80, MAP - 80); if (Math.hypot(x - this.me.x, y - this.me.y) > 260) break; }
      this.mons.push({ id: this.nid++, sp, lvl: l, nature: this.rng.pick(NATURE_IDS), hp: 1, x, y, alive: true, goal: null, cd: this.rng.range(0, 4), chase: 0, dir: this.rng.int(0, 7), moving: false, place: 0 });
    }
    this.alive = this.mons.length;
    for (let i = 0; i < 22; i++) this.spawnItem();
    (window as unknown as { __royale?: Royale }).__royale = this;
    this.buildBg(); this.mount(); this.last = performance.now(); this.loop();
  }

  spawnItem() { const r = this.rng.next(); this.items.push({ id: this.nid++, kind: r < 0.55 ? 'heal' : r < 0.8 ? 'power' : 'focus', x: this.rng.range(60, MAP - 60), y: this.rng.range(60, MAP - 60) }); }

  buildBg() {
    const c = document.createElement('canvas'); c.width = MAP; c.height = MAP; const g = c.getContext('2d')!, r = new Rng(77);
    g.fillStyle = '#62b042'; g.fillRect(0, 0, MAP, MAP);
    for (let i = 0; i < 2600; i++) { g.fillStyle = r.chance(0.5) ? '#6cbc48' : '#58a63c'; g.fillRect(r.int(0, MAP), r.int(0, MAP), r.int(2, 6), r.int(2, 4)); }
    for (let i = 0; i < 40; i++) { const x = r.range(60, MAP - 60), y = r.range(60, MAP - 60), rx = r.range(30, 80), ry = rx * 0.6; g.fillStyle = '#3a78c8'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.28); g.fill(); g.fillStyle = '#5a98e0'; g.beginPath(); g.ellipse(x, y - 3, rx - 6, ry - 6, 0, 0, 6.28); g.fill(); }
    for (let i = 0; i < 150; i++) { const x = r.range(20, MAP - 20), y = r.range(20, MAP - 20); g.fillStyle = '#1c5a22'; g.beginPath(); g.arc(x, y, r.range(10, 20), 0, 6.28); g.fill(); g.fillStyle = '#2f8a3a'; g.beginPath(); g.arc(x - 3, y - 4, r.range(7, 14), 0, 6.28); g.fill(); }
    for (let i = 0; i < 70; i++) { const x = r.range(20, MAP - 20), y = r.range(20, MAP - 20); g.fillStyle = '#8a8a94'; g.beginPath(); g.arc(x, y, r.range(7, 14), 0, 6.28); g.fill(); g.fillStyle = '#b4b4be'; g.beginPath(); g.arc(x - 2, y - 3, 5, 0, 6.28); g.fill(); }
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1; for (let i = 0; i <= MAP; i += 100) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, MAP); g.moveTo(0, i); g.lineTo(MAP, i); g.stroke(); }
    this.bg = c;
  }

  mount() {
    this.root = document.createElement('div'); this.root.className = 'royale';
    this.cv = document.createElement('canvas'); this.cv.className = 'rcv'; this.root.appendChild(this.cv);
    const top = h('div', 'rtop'); const mk = (cls: string) => { const e = h('div', cls); top.appendChild(e); return e; };
    const alive = mk('ra'), kills = mk('rk'), storm = mk('rs');
    const hp = h('div', 'rhp'); const hpf = h('i'); const hpt = h('b'); hp.append(hpf, hpt);
    const msg = h('div', 'rmsg'); const mini = document.createElement('canvas'); mini.width = 64; mini.height = 64; mini.className = 'rmini'; this.mini = mini;
    const quit = h('button', 'mini rquit', '✕'); onTap(quit, () => { if (window.confirm('Royale aufgeben? Kills und Platzierung zählen trotzdem für die Belohnung.')) this.finish(true); });
    this.root.append(top, hp, msg, mini, quit); this.hud = { alive, kills, hpf, hpt, storm, msg };
    this.root.append(h('div', 'rhint', 'TIPPE AUFS FELD ZUM LAUFEN · BERÜHRE EIN MONSTER = KAMPF · SAMMLE ITEMS'));
    document.body.appendChild(this.root); this.g2 = this.cv.getContext('2d')!; this.resize();
    window.addEventListener('resize', this.onResize);
    this.cv.addEventListener('pointerup', (e) => { if (this.paused || this.over) return; const p = this.toWorld(e.clientX, e.clientY); this.target = p; sfx.ui(); });
  }
  onResize = () => this.resize();
  resize() { const dpr = Math.min(2, window.devicePixelRatio || 1); this.cv.width = Math.round(innerWidth * dpr); this.cv.height = Math.round(innerHeight * dpr); this.dpr = dpr; }
  dpr = 1; scale = 2;
  toWorld(cx: number, cy: number) { return { x: clamp(this.camX + (cx * this.dpr) / (this.scale * this.dpr), 0, MAP), y: clamp(this.camY + (cy * this.dpr) / (this.scale * this.dpr), 0, MAP) }; }

  flash(t: string) { this.msg = t; this.msgT = 2.4; }

  loop = () => {
    if (this.over) return;
    const now = performance.now(), dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    if (!this.paused) this.update(dt);
    this.draw(); this.raf = requestAnimationFrame(this.loop);
  };

  zoneR() { const t = this.t; return t < 35 ? 760 : Math.max(70, 760 - ((t - 35) / 150) * 690); }

  update(dt: number) {
    this.t += dt; this.zone.r = this.zoneR(); this.msgT -= dt;
    // Spieler bewegt sich
    const me = this.me;
    me.moving = false;
    if (this.target) { const dx = this.target.x - me.x, dy = this.target.y - me.y, d = Math.hypot(dx, dy); if (d < 6) this.target = null; else { me.x += (dx / d) * SPEED * dt; me.y += (dy / d) * SPEED * dt; me.dir = dirFromAngle(Math.atan2(dy, dx)); me.moving = true; } }
    me.x = clamp(me.x, 10, MAP - 10); me.y = clamp(me.y, 10, MAP - 10);
    if (!me.moving) me.hp = Math.min(1, me.hp + 0.004 * dt);   // Erholung beim Stehen
    // Sturm
    const out = (m: Rm) => Math.hypot(m.x - this.zone.x, m.y - this.zone.y) > this.zone.r;
    if (out(me)) { me.hp -= (0.03 + 0.03 * (this.t / 180)) * dt; if (me.hp <= 0) { me.hp = 0; return this.defeat('IM STURM'); } }
    // KI
    for (const m of this.mons) {
      if (m === me || !m.alive) continue;
      m.cd -= dt; m.moving = false;
      if (out(m)) { m.hp -= 0.05 * dt; if (m.hp <= 0) { this.kill(m, 'STURM'); continue; } m.goal = { x: this.zone.x + this.rng.range(-60, 60), y: this.zone.y + this.rng.range(-60, 60) }; }
      const dm = Math.hypot(m.x - me.x, m.y - me.y);
      if (m.chase > 0) { m.chase -= dt; m.goal = { x: me.x, y: me.y }; if (dm > 280) m.chase = 0; }
      else if (dm < 150 && m.hp > 0.45 && m.cd <= 0 && this.rng.chance(dt * 0.35)) m.chase = 4;
      if (!m.goal || Math.hypot(m.goal.x - m.x, m.goal.y - m.y) < 10) { const a = this.rng.range(0, 6.28), rr = Math.sqrt(this.rng.next()) * Math.max(40, this.zone.r - 30); m.goal = { x: clamp(this.zone.x + Math.cos(a) * rr, 30, MAP - 30), y: clamp(this.zone.y + Math.sin(a) * rr, 30, MAP - 30) }; }
      const dx = m.goal.x - m.x, dy = m.goal.y - m.y, d = Math.hypot(dx, dy) || 1, sp = m.chase > 0 ? AI_SPEED * 1.15 : AI_SPEED;
      m.x += (dx / d) * sp * dt; m.y += (dy / d) * sp * dt; m.dir = dirFromAngle(Math.atan2(dy, dx)); m.moving = true;
    }
    // Items
    for (const it of [...this.items]) {
      if (Math.hypot(it.x - me.x, it.y - me.y) < 20) { this.pickup(it); continue; }
      for (const m of this.mons) if (m !== me && m.alive && Math.hypot(it.x - m.x, it.y - m.y) < 16) { if (it.kind === 'heal') m.hp = Math.min(1, m.hp + 0.3); this.items = this.items.filter((x) => x !== it); break; }
    }
    if (this.t - this.lastItem > 5 && this.items.length < 40) { this.lastItem = this.t; this.spawnItem(); }
    // Kämpfe: Spieler gegen KI (echt), KI gegen KI (Simulation)
    for (const m of this.mons) {
      if (m === me || !m.alive) continue;
      if (m.cd <= 0 && me.alive && Math.hypot(m.x - me.x, m.y - me.y) < FIGHT_R) { this.playerFight(m); return; }
    }
    if (this.fightQueue <= 0) {
      outer: for (let i = 1; i < this.mons.length; i++) for (let j = i + 1; j < this.mons.length; j++) {
        const a = this.mons[i], b = this.mons[j];
        if (a.alive && b.alive && a.cd <= 0 && b.cd <= 0 && Math.hypot(a.x - b.x, a.y - b.y) < FIGHT_R) { this.aiFight(a, b); this.fightQueue = 0.6; break outer; }
      }
    } else this.fightQueue -= dt;
    if (this.alive <= 1 && me.alive) this.finish(false);
  }

  pickup(it: Item) {
    this.items = this.items.filter((x) => x !== it); sfx.handle({ type: 'heal' }, false);
    if (it.kind === 'heal') { this.me.hp = Math.min(1, this.me.hp + 0.35); this.flash('HEILUNG +35% KP'); }
    else if (it.kind === 'power') { this.buff = true; this.flash('KRAFT: DEIN NÄCHSTER KAMPF STARTET MIT BONUS-SCHADEN'); }
    else { this.focusBonus = Math.min(60, this.focusBonus + 35); this.flash('FOKUS: DEIN NÄCHSTER KAMPF STARTET MIT +35 FOKUS'); }
  }

  kill(m: Rm, why: string) { m.alive = false; m.place = this.alive; this.alive--; if (why === 'STURM') this.flash('EIN MONSTER IM STURM GEFALLEN · NOCH ' + this.alive); }

  /** KI gegen KI: schnelle Simulation mit denselben Kampfwerten. */
  aiFight(a: Rm, b: Rm) {
    const mk = (m: Rm, side: 0 | 1) => { const mon = new Mon(m.sp, m.lvl, m.nature, { moves: L.enemyMoves(m.sp, m.lvl), hpMul: sizeHpMul(1), hpFrac: Math.max(0.05, m.hp) }); return new Trainer(side, 'x', [mon], true); };
    const ta = mk(a, 0), tb = mk(b, 1), bt = new Battle(ta, tb, this.rng.int(1, 1e9), 'none', 'meadow'); bt.worldOn = false;
    let s = 0; while (bt.winner === null && s < 30 * 220) { bt.update(1 / 30); bt.events.length = 0; s++; }
    const wa = bt.winner === 0 ? a : b, lo = wa === a ? b : a, wm = (wa === a ? ta : tb).team[0];
    wa.hp = Math.max(0.05, wm.hp / wm.maxHp); wa.cd = 3; this.kill(lo, 'KAMPF');
  }

  /** Spieler trifft auf ein Monster: echter Kampf mit seinen Steuerungen. */
  playerFight(m: Rm) {
    this.paused = true; this.root.style.display = 'none'; sfx.ui();
    const lead = this.owned, hp: Record<number, number> = { [lead.id]: Math.max(0.03, this.me.hp) };
    const spec = L.customEnemy(this.rng.int(1, 1e9), { name: SPECIES[m.sp].name, level: m.lvl, count: 1, coins: 0, pool: [m.sp], tactic: this.rng.pick(['attack', 'balanced', 'counter', 'defend'] as const), map: this.rng.pick(['meadow', 'rocks', 'jungle', 'lake', 'volcano']) });
    spec.mons[0].nature = m.nature;
    const len = L.lenMulOf(spec), player = L.playerTrainer(this.g.save, { team: [lead.id], hp }, 1, len), enemy = L.enemyTrainer(spec, 1, len);
    enemy.team[0].hp = Math.max(1, Math.round(enemy.team[0].maxHp * Math.max(0.1, m.hp)));
    if (this.focusBonus) { player.focus = Math.min(100, player.focus + this.focusBonus); this.focusBonus = 0; }
    if (this.buff) { player.team[0].buffT = 9999; }
    const hadBuff = this.buff; this.buff = false;
    this.g.beginBattle({ kind: 'royale', player, enemy, mod: 'none', map: spec.map, len, banner: 'BATTLE ROYALE', sub: 'NOCH ' + this.alive + ' ÜBRIG · ' + this.kills + ' KILLS' + (hadBuff ? ' · KRAFT' : ''), noConsume: false, onEnd: (win, b) => {
      this.g.toMenu();
      const mm = b.trainers[0].team[0]; this.me.hp = mm.alive ? Math.max(0.03, mm.hp / mm.maxHp) : 0;
      if (win) { this.kill(m, 'KAMPF'); this.kills++; this.me.hp = Math.min(1, this.me.hp + 0.08); this.flash('KILL! +' + this.kills + ' · NOCH ' + this.alive + ' ÜBRIG'); this.paused = false; this.root.style.display = ''; this.last = performance.now(); this.target = null; m.cd = 99; if (this.alive <= 1) this.finish(false); }
      else { this.root.style.display = ''; this.defeat('BESIEGT VON ' + SPECIES[m.sp].name.toUpperCase()); }
    } });
  }

  defeat(why: string) { this.me.alive = false; this.me.place = this.alive; this.alive--; this.finish(true, why); }

  finish(lost: boolean, why = '') {
    if (this.over) return; this.over = true; cancelAnimationFrame(this.raf); window.removeEventListener('resize', this.onResize);
    const place = lost ? Math.max(1, this.me.place || this.alive) : 1, s = this.g.save;
    const coins = this.kills * 35 + (place === 1 ? 250 : place <= 3 ? 120 : place <= 5 ? 80 : place <= 10 ? 50 : 15) + (PLAYERS + 1 - place) * 4;
    const keys = (this.kills >= 5 || place <= 3 ? 1 : 0) + (place === 1 ? 1 : 0);
    const mxp = this.kills * 14 + (PLAYERS + 1 - place) * 2 + 10, pxp = 20 + this.kills * 10 + (PLAYERS + 1 - place);
    s.coins += coins; s.inv.keys += keys; gainXp(s, this.owned, mxp); gainPlayerXp(s, pxp);
    s.stats.royaleBest = s.stats.royaleBest ? Math.min(s.stats.royaleBest, place) : place; s.stats.royaleKills += this.kills; s.stats.battles++;
    track(s, 'kos', this.kills); if (place === 1) { track(s, 'wins'); s.quests.wkWins++; }
    this.g.persist(); this.root.remove();
    const box = h('div', 'modal result ' + (place === 1 ? 'win' : 'lose'));
    box.append(h('h2', '', place === 1 ? '🏆 CHAMPION!' : lost ? 'AUSGESCHIEDEN' : 'BEENDET'), h('div', 'sub', place === 1 ? 'DU HAST ALLE BESIEGT!' : (why ? why + ' · ' : '') + 'PLATZ ' + place + ' VON ' + (PLAYERS + 1)));
    const st = h('div', 'stats'); const sv = (k: string, v: string) => { const r = h('div', 'srow'); r.append(h('span', '', k), h('b', '', v)); st.append(r); };
    sv('PLATZ', place + ' / ' + (PLAYERS + 1)); sv('KILLS', String(this.kills)); sv('ÜBERLEBT', Math.round(this.t) + ' S'); sv('MÜNZEN', '+' + coins); sv('KISTENSCHLÜSSEL', keys ? '+' + keys : '–'); sv('ERFAHRUNG', '+' + mxp + ' EP'); box.append(st);
    if (!keys) box.append(h('div', 'sub', 'MIT 5 KILLS ODER EINEM PLATZ IN DEN TOP 3 GIBT ES EINEN SCHLÜSSEL.'));
    const again = h('button', 'btn big', 'NOCH EINMAL'); onTap(again, () => { sfx.ui(); this.g.toMenu(); royaleIntro(this.g); });
    const ok = h('button', 'btn ghost', 'ZURÜCK'); onTap(ok, () => { sfx.back(); this.g.toMenu(); playMenu(this.g); });
    box.append(again, ok); this.g.setScreen(box); announce(this.g, this.before, ['PLATZ ' + place + ' · ' + this.kills + ' KILLS'], place === 1 ? 'DU HAST GEWONNEN' : 'BELOHNUNG');
  }

  draw() {
    const c = this.cv, g = this.g2, W = c.width, H = c.height, sc = this.scale * this.dpr; this.scale = 2;
    g.imageSmoothingEnabled = false; g.fillStyle = '#1f5a2a'; g.fillRect(0, 0, W, H);
    const vw = W / sc, vh = H / sc; this.camX = clamp(this.me.x - vw / 2, 0, MAP - vw); this.camY = clamp(this.me.y - vh * 0.55, 0, MAP - vh);
    g.save(); g.scale(sc, sc); g.translate(-Math.round(this.camX), -Math.round(this.camY));
    g.drawImage(this.bg, 0, 0);
    // Sturm
    g.fillStyle = 'rgba(150,30,70,.38)'; g.beginPath(); g.rect(0, 0, MAP, MAP); g.arc(this.zone.x, this.zone.y, this.zone.r, 0, 6.28, true); g.fill('evenodd');
    g.strokeStyle = '#ff5a80'; g.lineWidth = 3; g.beginPath(); g.arc(this.zone.x, this.zone.y, this.zone.r, 0, 6.28); g.stroke();
    // Items
    for (const it of this.items) { const y = it.y + Math.sin(this.t * 4 + it.x) * 2; g.globalAlpha = 0.35; g.fillStyle = ITEM_COL[it.kind]; g.beginPath(); g.arc(it.x, y, 12, 0, 6.28); g.fill(); g.globalAlpha = 1; g.fillStyle = ITEM_COL[it.kind]; g.beginPath(); g.arc(it.x, y, 7, 0, 6.28); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(it.x - 2, y - 2, 2.5, 0, 6.28); g.fill(); }
    // Ziel
    if (this.target) { g.strokeStyle = '#ffe060'; g.lineWidth = 2; g.beginPath(); g.arc(this.target.x, this.target.y, 8 + Math.sin(this.t * 8) * 2, 0, 6.28); g.stroke(); }
    // Monster (nach Tiefe sortiert)
    const vis = this.mons.filter((m) => m.alive && m.x > this.camX - 60 && m.x < this.camX + vw + 60 && m.y > this.camY - 80 && m.y < this.camY + vh + 60).sort((a, b) => a.y - b.y);
    for (const m of vis) {
      const sp = getSprite(m.sp), col = m.moving ? Math.floor(this.t * 8) % sp.cols : 0, fr = sp.frames[m.dir % sp.dirs][col].n;
      g.globalAlpha = 0.3; g.fillStyle = '#10301a'; g.beginPath(); g.ellipse(m.x, m.y, 14, 5, 0, 0, 6.28); g.fill(); g.globalAlpha = 1;
      g.drawImage(fr, Math.round(m.x - sp.ax), Math.round(m.y - sp.ay));
      const isMe = m === this.me, bw = 26, by = Math.round(m.y - SPECIES[m.sp].height - 8);
      g.fillStyle = '#10141c'; g.fillRect(Math.round(m.x - bw / 2) - 1, by - 1, bw + 2, 5);
      g.fillStyle = m.hp > 0.5 ? '#48d048' : m.hp > 0.2 ? '#f8c828' : '#e83830'; g.fillRect(Math.round(m.x - bw / 2), by, Math.round(bw * m.hp), 3);
      g.fillStyle = isMe ? '#58c8ff' : (m.chase > 0 ? '#ff4a3a' : '#ffffff'); g.font = '7px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillText(isMe ? 'DU' : 'LV' + m.lvl, m.x, by - 3);
      if (isMe) { g.strokeStyle = '#58c8ff'; g.lineWidth = 2; g.beginPath(); g.ellipse(m.x, m.y, 18, 7, 0, 0, 6.28); g.stroke(); }
    }
    g.restore();
    // HUD
    this.hud.alive.textContent = 'ÜBRIG ' + this.alive + '/' + (PLAYERS + 1); this.hud.kills.textContent = 'KILLS ' + this.kills;
    const left = Math.max(0, 35 - this.t); this.hud.storm.textContent = this.t < 35 ? 'STURM IN ' + Math.ceil(left) + ' S' : 'STURM ENGT EIN';
    this.hud.hpf.style.width = Math.round(this.me.hp * 100) + '%'; this.hud.hpf.className = this.me.hp > 0.5 ? '' : this.me.hp > 0.2 ? 'mid' : 'low'; this.hud.hpt.textContent = SPECIES[this.me.sp].name.toUpperCase() + ' LV' + this.me.lvl + (this.buff ? ' · KRAFT' : '') + (this.focusBonus ? ' · FOKUS' : '');
    this.hud.msg.textContent = this.msgT > 0 ? this.msg : ''; this.hud.msg.style.opacity = this.msgT > 0 ? '1' : '0';
    // Minikarte
    const mg = this.mini.getContext('2d')!, k = 64 / MAP; mg.fillStyle = '#2a5a2a'; mg.fillRect(0, 0, 64, 64); mg.strokeStyle = '#ff5a80'; mg.beginPath(); mg.arc(this.zone.x * k, this.zone.y * k, this.zone.r * k, 0, 6.28); mg.stroke();
    for (const m of this.mons) if (m.alive) { mg.fillStyle = m === this.me ? '#58c8ff' : '#ff6a6a'; mg.fillRect(Math.round(m.x * k) - 1, Math.round(m.y * k) - 1, m === this.me ? 3 : 2, m === this.me ? 3 : 2); }
  }
}
void TYPE_FX; void pixIcon;

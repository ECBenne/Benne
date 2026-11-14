import { Battle } from './battle/battle';
import { Mon, Trainer, FOCUS, computeStats } from './battle/mon';
import { NATURES, NATURE_IDS, SPECIES, BASE_IDS, formAt, TACTICS, TacticId } from './data/species';
import { TYPE_NAMES } from './data/types';
import { AMULETS, PRICES } from './data/items';
import { Renderer } from './gfx/renderer';
import { sfx } from './audio';
import { amuletIcon, h, icons, onTap, spriteCanvas, heartIcon, pixIcon, uiSettings, typePill } from './ui/dom';
import { leagueEntry } from './ui/league';
import { moreContent, showMonster, showGuide } from './ui/menus';
import { claimable } from './data/achievements';
import { Rng } from './core/util';
import { loadSave, persist, newOwned, newSave, markSeen, rankOf, plNeed, todayStr, yesterdayStr, Save, MAX_TEAM, ROSTER_MAX } from './state';
import { playMenu } from './ui/modes';

export interface BattleSetup {
  player: Trainer; enemy: Trainer; mod: string; map?: string; banner: string; sub?: string;
  onEnd: (win: boolean, b: Battle) => void;
}
export type Tab = 'home' | 'liga' | 'team' | 'shop' | 'more';

const STARTER_LEVEL = 10;
const storage = () => { try { return localStorage; } catch { return null; } };

export class Game {
  r: Renderer;
  battle: Battle | null = null;
  demo: Battle | null = null;
  showcase: Mon[] | null = null;
  save: Save;
  speed = 1; paused = false;
  mode: 'menu' | 'battle' | 'result' = 'menu';
  tab: Tab = 'home';
  shopTab: 'items' | 'amulets' | 'mons' = 'items';
  tickers: number[] = [];
  last = 0; acc = 0;
  resultShown = false;
  hintT = 0; hintKey = '';
  onEnd: BattleSetup['onEnd'] | null = null;
  cardEls: { root: HTMLElement; hp: HTMLElement; lv: HTMLElement; cd: HTMLElement; sig: string }[] = [];
  el = {
    cards: document.getElementById('cards')!, tactics: document.getElementById('tactics')!, tip: document.getElementById('tipbar')!,
    btnSpecial: document.getElementById('btnSpecial') as HTMLButtonElement, btnShield: document.getElementById('btnShield') as HTMLButtonElement,
    btnBuff: document.getElementById('btnBuff') as HTMLButtonElement, btnDodge: document.getElementById('btnDodge') as HTMLButtonElement,
    btnPotion: document.getElementById('btnPotion') as HTMLButtonElement, btnSuper: document.getElementById('btnSuper') as HTMLButtonElement,
    focusFill: document.getElementById('focusfill')!, focusVal: document.getElementById('focusval')!,
    screens: document.getElementById('screens')!, btnSpeed: document.getElementById('btnSpeed')!, btnPause: document.getElementById('btnPause')!,
    btnSound: document.getElementById('btnSound')!,
  };

  constructor(screen: HTMLCanvasElement) {
    this.r = new Renderer(screen);
    this.save = loadSave(storage());
    sfx.setMuted(!this.save.sound);
    this.applyOpts();
    this.el.btnSound.textContent = this.save.sound ? '♪' : '♪✕';
    this.bindControls();
    this.startDemo();
    this.showTitle();
    requestAnimationFrame((t) => this.loop(t));
  }

  persist() { persist(this.save, storage()); }
  applyOpts() { uiSettings.vibe = this.save.opt.vibe; }
  resetAll() { this.save = newSave(); this.persist(); this.applyOpts(); this.showTitle(); }
  get teamOwned() { return this.save.team.map((id) => this.save.mons.find((m) => m.id === id)!).filter(Boolean); }
  own(o: ReturnType<typeof newOwned>) { this.save.mons.push(o); markSeen(this.save, o.sp); }

  // ───────────── Hauptschleife ─────────────
  loop(t: number) {
    const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
    this.last = t;
    if (this.mode === 'menu') {
      if (this.showcase) this.drawShowcase(dt);
      else if (this.demo && !this.solid) {
        const b = this.demo;
        this.acc += dt; let n = 0; while (this.acc >= 1 / 60 && n++ < 8) { b.update(1 / 60); this.acc -= 1 / 60; }
        b.events.length = 0; this.r.draw(b, dt, false);
        if (b.winner !== null && b.overT > 1.5) this.startDemo();
      }
    } else if (this.battle) {
      const b = this.battle;
      if (!this.paused) {
        this.acc += dt * this.speed;
        let n = 0;
        while (this.acc >= 1 / 60 && n++ < 8) { b.update(1 / 60); this.acc -= 1 / 60; }
        for (const e of b.events) sfx.handle(e, true);
        b.events.length = 0;
      }
      this.r.draw(b, this.paused ? 0 : dt, true);
      if (this.mode === 'battle') { this.updatePanel(dt); this.checkResult(b); }
    }
    sfx.tick(this.paused ? 0 : dt);
    requestAnimationFrame((tt) => this.loop(tt));
  }
  solid = false;

  startDemo() {
    const r = new Rng((Math.random() * 1e9) | 0);
    const mk = (side: 0 | 1) => { const l = r.pick([12, 16]); return new Trainer(side, '', [new Mon(formAt(r.pick(BASE_IDS), l), l, r.pick(NATURE_IDS))], true); };
    this.demo = new Battle(mk(0), mk(1), (Math.random() * 1e6) | 0, 'none', r.pick(['meadow', 'rocks', 'lake', 'volcano', 'jungle']));
  }

  /** Schaufenster: das Team steht animiert auf dem Platz und dreht sich ab und zu. */
  buildShowcase() {
    const team = this.teamOwned.slice(0, 3);
    const n = team.length;
    this.showcase = team.map((o, i) => { const m = new Mon(o.sp, o.level, o.nature); m.x = 170 + (i - (n - 1) / 2) * 56; m.y = 320 + (i % 2) * 6; m.state = 'ready'; m.look = Math.PI / 2; m.uid += i * 3; return m; });
  }
  private scT = 0;
  drawShowcase(dt: number) {
    this.scT += dt; const L = this.showcase!;
    const seq = [0, 1, 0, 7, 0, 2, 0, 6]; // S, SE, S, SW, S, E, S, W (Blickrichtung ändert sich langsam, versetzt je Monster)
    L.forEach((m, i) => { const step = Math.floor(this.scT / 2.6 + i * 1.7) % seq.length; m.look = ((90 - 45 * seq[step]) * Math.PI) / 180; m.moving = false; });
    // Monster mittig im freien Bereich über der Startkarte zeigen (auch auf kleinen Bildschirmen)
    const card = this.el.screens.querySelector('.homecard') as HTMLElement | null, st = this.r.screen.getBoundingClientRect();
    const free = card ? (card.getBoundingClientRect().top - st.top) / Math.max(1, st.height) : 0.6;
    this.r.drawShowcase(L, dt, Math.max(0.12, Math.min(0.45, free * 0.62)));
  }

  // ───────────── Kampf ─────────────
  beginBattle(o: BattleSetup) {
    sfx.unlock(); this.showcase = null; this.solid = false;
    this.battle = new Battle(o.player, o.enemy, (Math.random() * 1e6) | 0, o.mod, o.map ?? 'meadow');
    this.onEnd = o.onEnd;
    this.mode = 'battle'; this.resultShown = false; this.acc = 0;
    this.speed = 1; this.paused = false; this.el.btnSpeed.textContent = '1X'; this.hintKey = ''; this.hintT = 0;
    this.closeScreens();
    document.body.dataset.mode = 'battle';
    this.buildCards(); this.syncTactics();
    this.r.showBanner(o.banner, 1.6, o.sub);
    if (this.save.opt.music) sfx.startMusic();
  }

  settleItems(b: Battle) { const p = b.trainers[0]; this.save.inv.potion = p.potions; this.save.inv.super = p.supers; }

  checkResult(b: Battle) {
    if (b.winner !== null && b.overT > 1.3 && !this.resultShown) {
      this.resultShown = true; this.mode = 'result';
      sfx.stopMusic(); sfx.jingle(b.winner === 0);
      this.settleItems(b);
      this.onEnd?.(b.winner === 0, b);
    }
  }

  // ───────────── Steuerung im Kampf ─────────────
  bindControls() {
    this.el.tactics.innerHTML = '';
    (Object.keys(TACTICS) as TacticId[]).forEach((id) => {
      const btn = h('button', 'seg', TACTICS[id].name.toUpperCase(), { 'data-t': id });
      onTap(btn, () => { if (this.mode !== 'battle' || !this.battle) return; this.battle.setTactic(this.battle.trainers[0], id); sfx.ui(); this.syncTactics(); });
      this.el.tactics.appendChild(btn);
    });
    const cmd = (btn: HTMLElement, f: (b: Battle, t: Trainer) => unknown) => onTap(btn, () => { if (this.mode === 'battle' && this.battle) f(this.battle, this.battle.trainers[0]); });
    cmd(this.el.btnSpecial, (b, t) => b.commandSpecial(t)); cmd(this.el.btnShield, (b, t) => b.commandShield(t));
    cmd(this.el.btnBuff, (b, t) => b.commandBuff(t)); cmd(this.el.btnDodge, (b, t) => b.commandDodge(t));
    cmd(this.el.btnPotion, (b, t) => b.usePotion(t, 'potion')); cmd(this.el.btnSuper, (b, t) => b.usePotion(t, 'super'));
    onTap(this.el.btnSpeed, () => { this.speed = this.speed === 1 ? 2 : 1; this.el.btnSpeed.textContent = this.speed + 'X'; sfx.ui(); });
    onTap(this.el.btnPause, () => this.togglePause());
    onTap(this.el.btnSound, () => this.setSound(!sfx.muted ? false : true));
    window.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.mode === 'battle' && !this.paused) this.togglePause(); });
  }

  setSound(on: boolean) {
    sfx.unlock(); sfx.setMuted(!on); this.save.sound = on; this.persist();
    this.el.btnSound.textContent = on ? '♪' : '♪✕'; if (on) sfx.ui();
  }

  syncTactics() {
    if (!this.battle) return;
    const cur = this.battle.trainers[0].tactic;
    this.el.tactics.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.getAttribute('data-t') === cur));
  }

  buildCards() {
    this.el.cards.innerHTML = ''; this.cardEls = [];
    const b = this.battle!, tr = b.trainers[0];
    tr.team.forEach((m, i) => {
      const root = h('button', 'card');
      const art = h('div', 'art'); art.appendChild(spriteCanvas(m.speciesId, 1));
      const info = h('div', 'info');
      const name = h('div', 'nm', m.sp.name.toUpperCase());
      const lv = h('div', 'lv', 'LV' + m.level + ' ' + NATURES[m.nature].name.toUpperCase());
      if (m.amulet) { const dot = h('i'); dot.style.cssText = 'width:6px;height:6px;display:inline-block;margin-left:3px;border-radius:2px;background:' + m.amulet.color; name.appendChild(dot); }
      const bar = h('div', 'bar'); const hp = h('i'); bar.appendChild(hp);
      info.append(name, lv, bar);
      const cd = h('div', 'cdtag');
      root.append(art, info, cd);
      onTap(root, () => { if (this.mode === 'battle') b.requestSwitch(tr, i); });
      this.el.cards.appendChild(root);
      this.cardEls.push({ root, hp, lv, cd, sig: '' });
    });
  }

  /** Kampf-Tipps (nur solange aktiviert): erklärt dem Spieler im richtigen Moment, was zu tun ist. */
  private tip(b: Battle, tr: Trainer): string {
    const m = tr.active; if (!m || !m.alive) return b.choosing ? 'WÄHLE DEIN NÄCHSTES MONSTER: TIPPE EINE KARTE.' : '';
    const e = b.enemyOf(m);
    if (m.hpFrac < 0.35 && tr.team.some((x) => x.alive && x !== m)) return 'WENIG KP! TIPPE EINE ANDERE KARTE ZUM WECHSELN.';
    if (e && (e.state === 'windup') && e.move && (e.move.kind === 'aoe' || e.move.armor) && tr.focus >= FOCUS.dodge) return 'GEFAHR! TIPPE AUSWEICHEN ODER SCHILD.';
    if (m.special && m.cd[m.special.id] <= 0.05 && tr.focus >= FOCUS.special) return 'FOKUS BEREIT! SPEZIAL SETZT DIE STÄRKSTE ATTACKE EIN.';
    if (tr.focus < FOCUS.dodge) return 'FOKUS LÄDT SICH AUF. BEFEHLE KOSTEN FOKUS.';
    if (m.hpFrac < 0.6 && tr.potions > 0) return 'TIPP: EIN TRANK HEILT 45% KP.';
    if (b.rocks.length && tr.tactic !== 'defend' && m.hpFrac < 0.7) return 'TIPP: BEI DEFENSIV SUCHT DEIN MONSTER DECKUNG HINTER FELSEN.';
    return '';
  }

  updatePanel(dt = 0) {
    const b = this.battle!, tr = b.trainers[0];
    tr.team.forEach((m, i) => {
      const c = this.cardEls[i]; if (!c) return;
      const pct = Math.round((m.hp / m.maxHp) * 100);
      const cls = m === tr.active ? 'on' : !m.alive ? 'ko' : '';
      const canSw = b.canSwitchTo(tr, i);
      const sig = [pct, cls, canSw, b.choosing, Math.ceil(tr.switchCd)].join('|');
      if (sig === c.sig) return; c.sig = sig;
      c.hp.style.width = pct + '%';
      c.hp.className = pct > 50 ? '' : pct > 20 ? 'mid' : 'low';
      c.root.className = 'card ' + cls + (canSw ? ' can' : '') + (b.choosing && m.alive ? ' pick' : '');
      c.cd.textContent = m === tr.active ? '' : (m.alive && tr.switchCd > 0 && !b.choosing ? Math.ceil(tr.switchCd) + 's' : '');
    });
    const m = tr.active, f = tr.focus, alive = !!m && m.alive && m.state !== 'summon';
    this.el.focusFill.style.width = f + '%'; this.el.focusVal.textContent = String(Math.floor(f));
    const sp = m?.special;
    const label = (btn: HTMLElement, name: string, cost: number, extra = '') => { const t = name + '<small>' + (extra || cost) + '</small>'; if (btn.innerHTML !== t) btn.innerHTML = t; };
    label(this.el.btnSpecial, 'SPEZIAL', FOCUS.special, sp ? sp.name.toUpperCase() : '—');
    label(this.el.btnShield, 'SCHILD', FOCUS.shield); label(this.el.btnBuff, 'ANFEUERN', FOCUS.buff); label(this.el.btnDodge, 'AUSWEICHEN', FOCUS.dodge);
    this.el.btnSpecial.disabled = !(alive && sp && m!.cd[sp.id] <= 0.05 && f >= FOCUS.special && tr.cmdCd <= 0);
    this.el.btnShield.disabled = !(alive && m!.shield <= 0 && f >= FOCUS.shield && tr.cmdCd <= 0);
    this.el.btnBuff.disabled = !(alive && m!.buffT <= 0 && f >= FOCUS.buff && tr.cmdCd <= 0);
    this.el.btnDodge.disabled = !(alive && f >= FOCUS.dodge && tr.cmdCd <= 0 && ['ready', 'recover', 'stagger', 'windup'].includes(m!.state));
    const hurt = !!m && m.hp < m.maxHp;
    this.el.btnPotion.disabled = !m || !m.alive || tr.potions <= 0 || tr.itemCd > 0 || !hurt;
    this.el.btnPotion.textContent = 'TRANK ×' + tr.potions;
    this.el.btnSuper.disabled = !m || !m.alive || tr.supers <= 0 || tr.itemCd > 0 || !(hurt || m.burn > 0 || m.para > 0);
    this.el.btnSuper.textContent = 'SUPER ×' + tr.supers;
    // Tipps
    this.hintT -= dt;
    if (this.hintT <= 0) {
      this.hintT = 0.5;
      const t = this.save.opt.hints ? this.tip(b, tr) : '';
      if (t !== this.hintKey) { this.hintKey = t; this.el.tip.textContent = t; this.el.tip.classList.toggle('on', !!t); }
    }
  }

  togglePause() {
    if (this.mode !== 'battle') return;
    sfx.ui();
    this.paused = !this.paused;
    this.el.screens.innerHTML = '';
    this.el.screens.className = this.paused ? 'on dim' : '';
    if (this.paused) {
      const box = h('div', 'modal');
      box.append(h('h2', '', 'PAUSE'));
      const tg = (name: string, get: () => boolean, set: (v: boolean) => void) => {
        const r = h('div', 'opt'); r.append(h('div', '', name)); const b = h('button', 'tg' + (get() ? ' on' : ''), get() ? 'AN' : 'AUS');
        onTap(b, () => { set(!get()); b.classList.toggle('on', get()); b.textContent = get() ? 'AN' : 'AUS'; this.persist(); sfx.ui(); }); r.append(b); box.append(r);
      };
      tg('SOUND', () => this.save.sound, (v) => this.setSound(v));
      tg('KAMPF-TIPPS', () => this.save.opt.hints, (v) => { this.save.opt.hints = v; this.hintKey = '#'; });
      const resume = h('button', 'btn big', 'WEITER'); onTap(resume, () => this.togglePause());
      let armed = false;
      const quit = h('button', 'btn ghost', 'AUFGEBEN');
      onTap(quit, () => {
        if (!armed) { armed = true; quit.textContent = 'KAMPF VERLOREN GEBEN?'; quit.classList.add('danger'); return; }
        const b = this.battle!; this.settleItems(b); this.paused = false; this.closeScreens(); sfx.stopMusic();
        this.mode = 'result'; this.resultShown = true; b.trainers[0].team.forEach((m) => { m.hp = 0; });
        this.onEnd?.(false, b);
      });
      box.append(resume, quit);
      this.el.screens.appendChild(box);
    }
  }

  // ───────────── Menü-Gerüst ─────────────
  closeScreens() { this.clearTickers(); this.el.screens.innerHTML = ''; this.el.screens.className = ''; }
  clearTickers() { this.tickers.forEach((t) => clearInterval(t)); this.tickers = []; }

  /** Zeigt eine Seite im Vollbild (ohne Navigationsleiste). Seiten über einem Kampf (Ergebnis) bleiben abgedunkelt transparent. */
  setScreen(node: HTMLElement, o: { solid?: boolean; home?: boolean } = {}) {
    this.clearTickers();
    const inResult = this.mode === 'result';
    if (!inResult) { this.mode = 'menu'; document.body.dataset.mode = 'menu'; }
    const solid = o.solid ?? !inResult;
    this.solid = solid && !o.home;
    this.el.screens.className = 'on ' + (o.home ? 'home' : solid ? 'solid' : 'dim');
    this.el.screens.innerHTML = '';
    if (node.classList.contains('page')) { const sub = h('div', 'wrap'); sub.append(node); this.el.screens.append(sub); sub.scrollTop = 0; }
    else this.el.screens.append(node);
    if (!o.home) this.showcase = null;
  }
  /** Zurück ins Menü (nach einem Kampf). */
  toMenu() { this.mode = 'menu'; this.battle = null; document.body.dataset.mode = 'menu'; this.acc = 0; }

  /** Seite mit Kopfzeile und unterer Navigationsleiste. */
  tabScreen(tab: Tab, content: HTMLElement[], home = false) {
    this.toMenu(); this.tab = tab;
    const rank = rankOf(this.save.pl.lvl);
    const shell = h('div', 'shell' + (home ? ' home' : ''));
    const top = h('div', 'topbar'); const c = h('div', 'coins'); c.append(icons.coin(2), h('b', '', String(this.save.coins)));
    const rk = h('div', 'rank'); rk.append(h('b', '', 'LEVEL ' + this.save.pl.lvl), document.createTextNode(rank.n.toUpperCase()));
    top.append(c, rk);
    const main = h('div', 'scroll'); content.forEach((n) => main.append(n));
    const nav = h('div', 'nav');
    const tabs: [Tab, string, string][] = [['home', 'home', 'START'], ['liga', 'liga', 'SPIELEN'], ['team', 'team', 'TEAM'], ['shop', 'shopt', 'SHOP'], ['more', 'more', 'MEHR']];
    for (const [t, ic, label] of tabs) {
      const b = h('button', 'navbtn' + (t === tab ? ' on' : '')); b.append(pixIcon(ic, 2, { w: t === tab ? '#f8d030' : '#a2acce' }), document.createTextNode(label));
      if ((t === 'more' && claimable(this.save).length) || (t === 'home' && this.dailyReady())) b.append(h('i', 'dot'));
      onTap(b, () => { if (t !== this.tab || !home) { sfx.ui(); this.go(t); } });
      nav.append(b);
    }
    shell.append(top, main, nav);
    if (home) this.buildShowcase();
    this.setScreen(shell, { home, solid: !home });
    if (home) this.buildShowcase();
  }

  go(tab: Tab) {
    if (!this.save.mons.length) return this.showStarter();
    if (tab === 'home') this.showHub(); else if (tab === 'liga') playMenu(this);
    else if (tab === 'team') this.showTeam(); else if (tab === 'shop') this.showShop(); else this.tabScreen('more', moreContent(this));
  }

  /** Einfache Kopfzeile für Unterseiten. */
  coinBar(right?: string): HTMLElement {
    const bar = h('div', 'coinbar');
    const c = h('div', 'coins'); c.append(icons.coin(2), h('b', '', String(this.save.coins)));
    bar.append(c, h('div', 'rnd', right ?? 'LIGA ' + this.save.tier));
    return bar;
  }
  backBtn(fn: () => void, label = 'ZURÜCK') { const b = h('button', 'btn ghost', label); onTap(b, () => { sfx.back(); fn(); }); return b; }
  toast(text: string) { const t = h('div', 'toast', text); document.body.appendChild(t); setTimeout(() => t.remove(), 1500); }

  // ───────────── Täglicher Bonus ─────────────
  dailyReady() { return this.save.daily.last !== todayStr(); }
  dailyReward() { const streak = this.save.daily.last === yesterdayStr() ? this.save.daily.streak + 1 : 1; return { streak, coins: 50 + 25 * Math.min(streak - 1, 6) }; }
  claimDaily() {
    if (!this.dailyReady()) return;
    const r = this.dailyReward(); this.save.coins += r.coins; this.save.daily = { last: todayStr(), streak: r.streak }; this.persist();
    sfx.handle({ type: 'heal' }, false); this.toast('+' + r.coins + ' MÜNZEN · TAG ' + r.streak); this.showHub();
  }

  // ───────────── Titel / Starter / Start ─────────────
  showTitle() {
    this.toMenu(); this.showcase = null;
    const box = h('div', 'title');
    const logo = h('div', 'logo'); logo.append(h('span', 'l1', 'ARENA'), h('span', 'l2', 'MANAGER'));
    const sub = h('div', 'subt', 'ECHTZEIT-KÄMPFE · DU BIST DER TRAINER');
    const mons = h('div', 'tmons'); mons.append(spriteCanvas('glimmdra', 2, 0), spriteCanvas('tropfling', 2, 0), spriteCanvas('knoespling', 2, 0));
    const start = h('button', 'btn big', this.save.mons.length ? 'WEITERSPIELEN' : 'NEUES SPIEL');
    onTap(start, () => { sfx.unlock(); sfx.ui(); this.save.mons.length ? this.showHub() : this.showStarter(); });
    box.append(logo, sub, mons, start, h('div', 'best', this.save.stats.clears ? 'LIGEN GEWONNEN: ' + this.save.stats.clears : 'PROTOTYP v0.6'));
    this.setScreen(box, { solid: false });
    this.el.screens.className = 'on dim';
  }

  showStarter() {
    this.toMenu();
    const box = h('div', 'page');
    box.append(h('h2', '', 'DEIN ERSTES MONSTER'), h('div', 'subt', 'WÄHLE DEINEN PARTNER. WEITERE MONSTER FINDEST DU AUF DEINEM WEG.'));
    const rng = new Rng((Math.random() * 1e9) | 0);
    for (const id of BASE_IDS) {
      const sp = SPECIES[id];
      const row = h('div', 'row card2');
      const art = h('div', 'sart'); art.style.minWidth = '150px'; art.style.minHeight = '128px'; art.appendChild(spriteCanvas(id, 2));
      const info = h('div', 'sinfo');
      info.append(h('div', 'nm', sp.name.toUpperCase()), h('div', 'ty', sp.types.map((t) => TYPE_NAMES[t].toUpperCase()).join('/')), h('div', 'mvs', sp.blurb.toUpperCase()));
      const pick = h('button', 'chip gold', 'WÄHLEN');
      onTap(pick, () => {
        sfx.ui();
        const o = newOwned(this.save.nextId++, id, rng.pick(NATURE_IDS), STARTER_LEVEL);
        this.own(o); this.save.team = [o.id]; this.persist();
        this.toast(sp.name.toUpperCase() + ' SCHLIESST SICH DIR AN!');
        showGuide(this, () => this.showHub());
      });
      info.append(pick); row.append(art, info); box.appendChild(row);
    }
    box.append(this.backBtn(() => this.showTitle()));
    this.setScreen(box);
  }

  showHub() {
    const run = this.save.run, rank = rankOf(this.save.pl.lvl), lead = this.teamOwned[0], pl = this.save.pl;
    const card = h('div', 'homecard');
    const lr = h('div', 'leadrow'); const l = h('div'); l.append(h('b', '', lead ? SPECIES[lead.sp].name.toUpperCase() : ''), document.createElement('br'), h('span', '', lead ? 'LV ' + lead.level + ' · ' + NATURES[lead.nature].name.toUpperCase() : ''));
    const inv = h('div', 'inv'); const it = (ic: HTMLElement, n: number) => { const d = h('div', 'it'); d.append(ic, h('b', '', '×' + n)); return d; };
    inv.append(it(icons.potion(), this.save.inv.potion), it(heartIcon(2), this.save.inv.revive), it(amuletIcon('#f8d030', 2), this.save.inv.amulets.length));
    lr.append(l, inv);
    const rb = h('div', 'rankbar'); const rbi = h('i'); rbi.style.width = Math.round((pl.xp / plNeed(pl.lvl)) * 100) + '%'; rb.append(rbi);
    const rl = h('div', 'rankline'); rl.append(h('span', '', 'SPIELERLEVEL ' + pl.lvl + ' · ' + rank.n.toUpperCase()), h('span', '', pl.xp + ' / ' + plNeed(pl.lvl) + ' EP'));
    const league = h('button', 'btn big', run ? 'LIGA FORTSETZEN' : 'SPIELEN');
    onTap(league, () => { sfx.ui(); run ? leagueEntry(this) : playMenu(this); });
    card.append(lr, rb, rl, league);
    if (this.dailyReady()) {
      const r = this.dailyReward(); const d = h('button', 'btn ghost', 'TÄGLICHER BONUS: +' + r.coins + ' MÜNZEN'); d.style.maxWidth = 'none';
      onTap(d, () => this.claimDaily()); card.append(d);
    } else card.append(h('div', 'rankline', 'TÄGLICHER BONUS ABGEHOLT · SERIE ' + this.save.daily.streak + ' TAG(E)'));
    this.tabScreen('home', [card], true);
  }

  // ───────────── Team ─────────────
  showTeam() {
    const locked = !!this.save.run;
    const box: HTMLElement[] = [h('h2', '', 'TEAM ' + this.save.team.length + '/' + MAX_TEAM)];
    box.push(h('div', 'subt', locked ? 'EIN LIGA-LAUF LÄUFT: DAS TEAM IST GESPERRT.' : 'TIPPE EIN MONSTER FÜR DETAILS, WESEN, AMULETT UND TEAM-PLATZ.'));
    const open = (id: number) => { sfx.ui(); showMonster(this, id, () => this.showTeam()); };
    const slots = h('div', 'slots');
    for (let i = 0; i < MAX_TEAM; i++) {
      const o = this.teamOwned[i];
      const r = h('button', 'slot' + (o ? ' on' : '')); r.style.width = '100%'; r.style.textAlign = 'left';
      if (o) {
        const sp = SPECIES[o.sp], st = computeStats(o.sp, o.level, o.bonus, o.item);
        const art = h('div', 'sart'); art.append(spriteCanvas(o.sp, 1)); const info = h('div', 'sinfo');
        info.append(h('div', 'nm', (i === 0 ? '★ ' : '') + sp.name.toUpperCase()), h('div', 'ty', 'LV ' + o.level + ' · KP ' + st.maxHp + ' · ' + NATURES[o.nature].name.toUpperCase()));
        const tg = h('div', 'tags'); sp.types.forEach((t) => tg.append(typePill(t, TYPE_NAMES[t].toUpperCase()))); if (o.item) tg.append(h('span', 'tag', '◆ ' + AMULETS[o.item].name.toUpperCase()));
        info.append(tg); r.append(art, info); onTap(r, () => open(o.id));
      } else { r.append(h('div', 'natdesc', 'FREIER PLATZ · MONSTER AUS DEM KADER WÄHLEN')); r.style.opacity = '.6'; }
      slots.append(r);
    }
    box.push(slots);
    const rest = this.save.mons.filter((m) => !this.save.team.includes(m.id));
    box.push(h('div', 'sec', 'KADER (' + this.save.mons.length + '/' + ROSTER_MAX + ')'));
    if (!rest.length) box.push(h('div', 'natdesc', 'NOCH KEINE WEITEREN MONSTER. WIRB SIE NACH KÄMPFEN AN ODER KAUFE SIE IM SHOP.'));
    for (const o of rest) {
      const sp = SPECIES[o.sp]; const r = h('button', 'card2'); r.style.textAlign = 'left';
      const art = h('div', 'sart'); art.append(spriteCanvas(o.sp, 1)); const info = h('div', 'sinfo');
      info.append(h('div', 'nm', sp.name.toUpperCase()), h('div', 'ty', 'LV ' + o.level + ' · ' + NATURES[o.nature].name.toUpperCase()));
      const add = h('span', 'chip gold', 'DETAILS'); add.style.alignSelf = 'center';
      r.append(art, info, add); onTap(r, () => open(o.id)); box.push(r);
    }
    this.tabScreen('team', box);
  }

  // ───────────── Shop ─────────────
  showShop() {
    const box: HTMLElement[] = [h('h2', '', 'SHOP')];
    const seg = h('div', 'seg2');
    for (const [k, n] of [['items', 'ITEMS'], ['amulets', 'AMULETTE'], ['mons', 'MONSTER']] as const) { const b = h('button', this.shopTab === k ? 'on' : '', n); onTap(b, () => { sfx.ui(); this.shopTab = k; this.showShop(); }); seg.append(b); }
    box.push(seg);
    const buy = (price: number, give: () => void, what: string) => {
      if (this.save.coins < price) { this.toast('NICHT GENUG MÜNZEN'); return; }
      this.save.coins -= price; give(); this.persist(); sfx.unlock(); sfx.handle({ type: 'heal' }, false); this.toast(what + ' GEKAUFT!'); this.showShop();
    };
    const item = (ic: HTMLElement, name: string, text: string, price: number, own: string, fn: () => void) => {
      const row = h('div', 'row card2'); const art = h('div', 'sart ico'); art.appendChild(ic);
      const info = h('div', 'sinfo'); info.append(h('div', 'nm', name), h('div', 'mvs', text), h('div', 'ty', own));
      const b = h('button', 'chip gold price', String(price)); b.prepend(icons.coin(1)); if (this.save.coins < price) b.classList.add('off');
      onTap(b, fn); row.append(art, info, b); box.push(row);
    };
    if (this.shopTab === 'items') {
      item(icons.potion(), 'TRANK', 'HEILT 45% KP.', PRICES.potion, 'BESITZ: ' + this.save.inv.potion, () => buy(PRICES.potion, () => this.save.inv.potion++, 'TRANK'));
      item(icons.super(), 'SUPERTRANK', 'HEILT ALLE KP UND STATUS.', PRICES.super, 'BESITZ: ' + this.save.inv.super, () => buy(PRICES.super, () => this.save.inv.super++, 'SUPERTRANK'));
      item(heartIcon(3), 'BELEBER', 'BELEBT EIN K.O.-MONSTER MIT 40% KP.', PRICES.revive, 'BESITZ: ' + this.save.inv.revive, () => buy(PRICES.revive, () => this.save.inv.revive++, 'BELEBER'));
    } else if (this.shopTab === 'amulets') {
      for (const a of Object.values(AMULETS)) item(amuletIcon(a.color, 3), a.name.toUpperCase(), a.desc.toUpperCase(), a.price, 'IM BESITZ: ' + this.save.inv.amulets.filter((x) => x === a.id).length, () => buy(a.price, () => this.save.inv.amulets.push(a.id), a.name.toUpperCase()));
    } else {
      const rng = new Rng((Math.random() * 1e9) | 0);
      for (const id of BASE_IDS) {
        const sp = SPECIES[id];
        const have = this.save.mons.filter((m) => m.sp === id || SPECIES[m.sp].evolvesTo?.id === id).length;
        const lv = Math.max(5, Math.round(this.teamOwned.reduce((a, m) => a + m.level, 0) / Math.max(1, this.teamOwned.length)) - 2);
        item(spriteCanvas(id, 1), sp.name.toUpperCase(), sp.types.map((t) => TYPE_NAMES[t].toUpperCase()).join('/') + ' · LV ' + lv, PRICES.mon, 'BESITZ: ' + have, () => {
          if (this.save.mons.length >= ROSTER_MAX) return this.toast('KEIN PLATZ MEHR');
          buy(PRICES.mon, () => this.own(newOwned(this.save.nextId++, formAt(id, lv), rng.pick(NATURE_IDS), lv)), sp.name.toUpperCase());
        });
      }
    }
    box.push(h('div', 'natdesc', 'MÜNZEN VERDIENST DU IN DER LIGA UND MIT ERFOLGEN.'));
    this.tabScreen('shop', box);
  }
}

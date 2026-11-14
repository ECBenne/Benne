import { Battle } from './battle/battle';
import { Mon, Trainer, FOCUS, STATS, computeStats } from './battle/mon';
import { NATURES, NATURE_IDS, SPECIES, BASE_IDS, formAt, TACTICS, TacticId } from './data/species';
import { MOVES } from './data/moves';
import { TYPE_NAMES } from './data/types';
import { AMULETS, PRICES } from './data/items';
import { Renderer } from './gfx/renderer';
import { sfx } from './audio';
import { amuletIcon, h, icons, onTap, spriteCanvas, heartIcon } from './ui/dom';
import { chooseAmulet } from './ui/gear';
import { leagueEntry } from './ui/league';
import { Rng } from './core/util';
import { loadSave, persist, newOwned, newSave, Save, MAX_TEAM, ROSTER_MAX } from './state';
import { LAYERS } from './data/league';

export interface BattleSetup {
  player: Trainer; enemy: Trainer; mod: string; banner: string; sub?: string;
  onEnd: (win: boolean, b: Battle) => void;
}

const STARTER_LEVEL = 10;
const storage = () => { try { return localStorage; } catch { return null; } };

export class Game {
  r: Renderer;
  battle: Battle | null = null;
  demo: Battle | null = null;
  save: Save;
  speed = 1; paused = false;
  mode: 'menu' | 'battle' | 'result' = 'menu';
  last = 0; acc = 0;
  resultShown = false;
  onEnd: BattleSetup['onEnd'] | null = null;
  cardEls: { root: HTMLElement; hp: HTMLElement; lv: HTMLElement; cd: HTMLElement; sig: string }[] = [];
  el = {
    cards: document.getElementById('cards')!, tactics: document.getElementById('tactics')!,
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
    this.el.btnSound.textContent = this.save.sound ? '♪' : '♪✕';
    this.bindControls();
    this.startDemo();
    this.showTitle();
    requestAnimationFrame((t) => this.loop(t));
  }

  persist() { persist(this.save, storage()); }
  get teamOwned() { return this.save.team.map((id) => this.save.mons.find((m) => m.id === id)!).filter(Boolean); }

  // ───────────── Hauptschleife ─────────────
  loop(t: number) {
    const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
    this.last = t;
    const b = this.mode === 'menu' ? this.demo : this.battle;
    if (b) {
      if (!this.paused) {
        this.acc += dt * (this.mode === 'battle' ? this.speed : 1);
        let n = 0;
        while (this.acc >= 1 / 60 && n++ < 8) { b.update(1 / 60); this.acc -= 1 / 60; }
        for (const e of b.events) sfx.handle(e, this.mode === 'battle');
        b.events.length = 0;
      }
      this.r.draw(b, this.paused ? 0 : dt, this.mode !== 'menu');
      if (this.mode === 'menu' && b.winner !== null && b.overT > 1.5) this.startDemo();
      if (this.mode === 'battle') { this.updatePanel(); this.checkResult(b); }
    }
    sfx.tick(this.paused ? 0 : dt);
    requestAnimationFrame((tt) => this.loop(tt));
  }

  startDemo() {
    const r = new Rng((Math.random() * 1e9) | 0);
    const mk = (side: 0 | 1) => { const l = r.pick([12, 16]); return new Trainer(side, '', [new Mon(formAt(r.pick(BASE_IDS), l), l, r.pick(NATURE_IDS))], true); };
    this.demo = new Battle(mk(0), mk(1), (Math.random() * 1e6) | 0);
  }

  // ───────────── Kampf ─────────────
  beginBattle(o: BattleSetup) {
    sfx.unlock();
    this.battle = new Battle(o.player, o.enemy, (Math.random() * 1e6) | 0, o.mod);
    this.onEnd = o.onEnd;
    this.mode = 'battle'; this.resultShown = false; this.acc = 0;
    this.speed = 1; this.paused = false; this.el.btnSpeed.textContent = '1X';
    this.closeScreens();
    document.body.dataset.mode = 'battle';
    this.buildCards(); this.syncTactics();
    this.r.showBanner(o.banner, 1.6, o.sub);
    sfx.startMusic();
  }

  /** Verbrauchte Tränke zurück ins Inventar. */
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
      if (m.amulet) { const dot = h('i', 'it'); dot.style.background = m.amulet.color; (dot as HTMLElement).style.cssText += ';width:6px;height:6px;display:inline-block;margin-left:3px;border-radius:2px;background:' + m.amulet.color; name.appendChild(dot); }
      const bar = h('div', 'bar'); const hp = h('i'); bar.appendChild(hp);
      info.append(name, lv, bar);
      const cd = h('div', 'cdtag');
      root.append(art, info, cd);
      onTap(root, () => { if (this.mode === 'battle') b.requestSwitch(tr, i); });
      this.el.cards.appendChild(root);
      this.cardEls.push({ root, hp, lv, cd, sig: '' });
    });
  }

  updatePanel() {
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
  }

  togglePause() {
    if (this.mode !== 'battle') return;
    sfx.ui();
    this.paused = !this.paused;
    this.el.screens.innerHTML = '';
    this.el.screens.classList.toggle('on', this.paused);
    if (this.paused) {
      const box = h('div', 'modal');
      box.append(h('h2', '', 'PAUSE'));
      const resume = h('button', 'btn', 'WEITER'); onTap(resume, () => this.togglePause());
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

  // ───────────── Menü-Grundlagen ─────────────
  closeScreens() { this.el.screens.innerHTML = ''; this.el.screens.classList.remove('on'); }

  setScreen(...nodes: HTMLElement[]) {
    if (this.mode !== 'result') { this.mode = 'menu'; document.body.dataset.mode = 'menu'; }   // Ergebnis-Fenster liegen über dem Kampfbild
    this.el.screens.innerHTML = ''; this.el.screens.classList.add('on');
    nodes.forEach((n) => this.el.screens.appendChild(n));
    this.el.screens.scrollTop = 0;
  }
  /** Zurück ins Menü (nach einem Kampf). */
  toMenu() { this.mode = 'menu'; this.battle = null; document.body.dataset.mode = 'menu'; this.acc = 0; }

  coinBar(right?: string): HTMLElement {
    const bar = h('div', 'coinbar');
    const c = h('div', 'coins'); c.append(icons.coin(2), h('b', '', String(this.save.coins)));
    bar.append(c, h('div', 'rnd', right ?? 'LIGA ' + this.save.tier));
    return bar;
  }
  backBtn(fn: () => void, label = 'ZURÜCK') { const b = h('button', 'btn ghost', label); onTap(b, () => { sfx.back(); fn(); }); return b; }
  toast(text: string) { const t = h('div', 'toast', text); document.body.appendChild(t); setTimeout(() => t.remove(), 1500); }

  // ───────────── Titel / Starter / Hub ─────────────
  showTitle() {
    this.toMenu();
    const box = h('div', 'title');
    const logo = h('div', 'logo'); logo.append(h('span', 'l1', 'ARENA'), h('span', 'l2', 'MANAGER'));
    const sub = h('div', 'sub', 'ECHTZEIT-KÄMPFE · DU BIST DER TRAINER');
    const mons = h('div', 'tmons'); mons.append(spriteCanvas('glimmdra', 2, 0), spriteCanvas('tropfling', 2, 0), spriteCanvas('knoespling', 2, 0));
    const start = h('button', 'btn big', this.save.mons.length ? 'WEITERSPIELEN' : 'NEUES SPIEL');
    onTap(start, () => { sfx.unlock(); sfx.ui(); this.save.mons.length ? this.showHub() : this.showStarter(); });
    box.append(logo, sub, mons, start, h('div', 'best', this.save.stats.clears ? 'LIGEN GEWONNEN: ' + this.save.stats.clears : 'PROTOTYP v0.4'));
    this.setScreen(box);
  }

  showStarter() {
    this.toMenu();
    const box = h('div', 'page');
    box.append(h('h2', '', 'DEIN ERSTES MONSTER'), h('div', 'sub', 'DEIN PARTNER FÜR DEN ANFANG. WEITERE MONSTER FINDEST DU AUF DEM WEG.'));
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
        this.save.mons.push(o); this.save.team = [o.id]; this.persist();
        this.toast(sp.name.toUpperCase() + ' SCHLIESST SICH DIR AN!'); this.showHub();
      });
      info.append(pick); row.append(art, info); box.appendChild(row);
    }
    box.append(this.backBtn(() => this.showTitle()));
    this.setScreen(box);
  }

  showHub() {
    this.toMenu();
    const run = this.save.run;
    const box = h('div', 'page hub');
    box.append(this.coinBar(), h('h2', '', 'HAUPTMENÜ'));
    const teamRow = h('div', 'teamrow');
    this.teamOwned.forEach((m) => { const c = h('div', 'tm'); c.append(spriteCanvas(m.sp, 1), h('span', '', 'LV' + m.level)); teamRow.appendChild(c); });
    const league = h('button', 'btn big', run ? 'LIGA FORTSETZEN' : 'LIGA STARTEN');
    onTap(league, () => { sfx.ui(); leagueEntry(this); });
    const grid = h('div', 'grid2');
    const mk = (txt: string, fn: () => void, cls = '') => { const b = h('button', 'btn tile ' + cls, txt); onTap(b, () => { sfx.ui(); fn(); }); return b; };
    grid.append(mk('TEAM', () => this.showTeam()), mk('SHOP', () => this.showShop(), 'shop'), mk('OPTIONEN', () => this.showOptions(), 'ghost'), mk('TITEL', () => this.showTitle(), 'ghost'));
    const inv = h('div', 'inv');
    const it = (ic: HTMLElement, n: number) => { const d = h('div', 'it'); d.append(ic, h('b', '', '×' + n)); return d; };
    inv.append(it(icons.potion(), this.save.inv.potion), it(icons.super(), this.save.inv.super), it(heartIcon(2), this.save.inv.revive), it(amuletIcon('#f8d030', 2), this.save.inv.amulets.length));
    const info = h('div', 'sub', run ? 'LAUF AKTIV: ETAPPE ' + ((run.at === null ? 0 : (run.layers.flat().find((n) => n.id === run.at)?.layer ?? 0) + 1)) + '/' + LAYERS + ' · STUFE ' + run.tier : 'DEIN BESTER: LIGA-STUFE ' + Math.max(0, this.save.best) + ' · FREIGESCHALTET: ' + this.save.tier);
    box.append(teamRow, league, info, grid, inv);
    this.setScreen(box);
  }

  // ───────────── Team ─────────────
  showTeam(back: () => void = () => this.showHub()) {
    this.toMenu();
    const locked = !!this.save.run;
    const box = h('div', 'page');
    box.append(this.coinBar(), h('h2', '', 'TEAM ' + this.save.team.length + '/' + MAX_TEAM));
    const desc = h('div', 'natdesc', locked ? 'EIN LIGA-LAUF LÄUFT: DAS TEAM IST GESPERRT, AMULETTE KANNST DU WECHSELN.' : 'WESEN ÄNDERT DAS KAMPFVERHALTEN. AMULETTE GEBEN BONI. IM KAMPF ZÄHLEN NUR MONSTER IM TEAM.');
    const list = h('div', 'slots');
    for (const o of this.save.mons) {
      const sp = SPECIES[o.sp], inTeam = this.save.team.includes(o.id);
      const row = h('div', 'slot' + (inTeam ? ' on' : ''));
      const art = h('div', 'sart'); art.appendChild(spriteCanvas(o.sp, 1));
      const info = h('div', 'sinfo');
      const st = computeStats(o.sp, o.level, o.bonus, o.item);
      const trained = STATS.reduce((a, k) => a + o.bonus[k], 0);
      info.append(h('div', 'nm', sp.name.toUpperCase() + '  LV' + o.level), h('div', 'ty', sp.types.map((t) => TYPE_NAMES[t].toUpperCase()).join('/') + ' · KP ' + st.maxHp + ' · TRAINING ' + trained));
      const nb = h('button', 'chip', '↻ ' + NATURES[o.nature].name.toUpperCase());
      onTap(nb, () => { o.nature = NATURE_IDS[(NATURE_IDS.indexOf(o.nature) + 1) % NATURE_IDS.length]; sfx.ui(); this.persist(); desc.textContent = NATURES[o.nature].name.toUpperCase() + ': ' + NATURES[o.nature].blurb.toUpperCase(); this.showTeam(back); });
      const am = h('button', 'chip am');
      if (o.item) { const sw = h('i', 'sw'); sw.style.background = AMULETS[o.item].color; am.append(sw, document.createTextNode(AMULETS[o.item].name.toUpperCase())); } else am.textContent = '+ AMULETT';
      onTap(am, () => { sfx.ui(); chooseAmulet(this, o, () => this.showTeam(back)); });
      const tg = h('button', 'chip ' + (inTeam ? 'red' : 'gold'), inTeam ? 'RAUS' : 'INS TEAM');
      onTap(tg, () => {
        if (locked) return this.toast('IM LAUF GESPERRT');
        if (inTeam) { if (this.save.team.length <= 1) return this.toast('MIND. 1 MONSTER!'); this.save.team = this.save.team.filter((i) => i !== o.id); }
        else { if (this.save.team.length >= MAX_TEAM) return this.toast('TEAM IST VOLL!'); this.save.team.push(o.id); }
        sfx.ui(); this.persist(); this.showTeam(back);
      });
      const btns = h('div', 'btnrow'); btns.append(nb, am, tg);
      info.append(btns, h('div', 'mvs', sp.moves.map((m) => MOVES[m].name.toUpperCase()).join(' · ')));
      row.append(art, info); list.appendChild(row);
    }
    box.append(list, desc, this.backBtn(back));
    this.setScreen(box);
  }

  // ───────────── Shop ─────────────
  showShop() {
    this.toMenu();
    const box = h('div', 'page');
    box.append(this.coinBar(), h('h2', '', 'SHOP'));
    const buy = (price: number, give: () => void, what: string) => {
      if (this.save.coins < price) { this.toast('NICHT GENUG MÜNZEN'); return; }
      this.save.coins -= price; give(); this.persist(); sfx.unlock(); sfx.handle({ type: 'heal' }, false); this.toast(what + ' GEKAUFT!'); this.showShop();
    };
    const item = (ic: HTMLElement, name: string, text: string, price: number, own: string, fn: () => void) => {
      const row = h('div', 'row card2');
      const art = h('div', 'sart ico'); art.appendChild(ic);
      const info = h('div', 'sinfo'); info.append(h('div', 'nm', name), h('div', 'mvs', text), h('div', 'ty', own));
      const b = h('button', 'chip gold price', String(price)); b.prepend(icons.coin(1)); if (this.save.coins < price) b.classList.add('off');
      onTap(b, fn); row.append(art, info, b); box.appendChild(row);
    };
    box.append(h('div', 'sec', 'ITEMS'));
    item(icons.potion(), 'TRANK', 'HEILT 45% KP.', PRICES.potion, 'BESITZ: ' + this.save.inv.potion, () => buy(PRICES.potion, () => this.save.inv.potion++, 'TRANK'));
    item(icons.super(), 'SUPERTRANK', 'HEILT ALLE KP UND STATUS.', PRICES.super, 'BESITZ: ' + this.save.inv.super, () => buy(PRICES.super, () => this.save.inv.super++, 'SUPERTRANK'));
    item(heartIcon(3), 'BELEBER', 'BELEBT EIN K.O.-MONSTER MIT 40% KP (AUF DER KARTE).', PRICES.revive, 'BESITZ: ' + this.save.inv.revive, () => buy(PRICES.revive, () => this.save.inv.revive++, 'BELEBER'));
    box.append(h('div', 'sec', 'AMULETTE'));
    for (const a of Object.values(AMULETS)) item(amuletIcon(a.color, 3), a.name.toUpperCase(), a.desc.toUpperCase(), a.price, 'IM BESITZ: ' + this.save.inv.amulets.filter((x) => x === a.id).length, () => buy(a.price, () => this.save.inv.amulets.push(a.id), a.name.toUpperCase()));
    box.append(h('div', 'sec', 'MONSTER'));
    const rng = new Rng((Math.random() * 1e9) | 0);
    for (const id of BASE_IDS) {
      const sp = SPECIES[id];
      const have = this.save.mons.filter((m) => m.sp === id || SPECIES[m.sp].evolvesTo?.id === id).length;
      const lv = Math.max(5, Math.round(this.teamOwned.reduce((a, m) => a + m.level, 0) / Math.max(1, this.teamOwned.length)) - 2);
      item(spriteCanvas(id, 1), sp.name.toUpperCase(), sp.types.map((t) => TYPE_NAMES[t].toUpperCase()).join('/') + ' · LV ' + lv, PRICES.mon, 'BESITZ: ' + have, () => {
        if (this.save.mons.length >= ROSTER_MAX) return this.toast('KEIN PLATZ MEHR');
        buy(PRICES.mon, () => this.save.mons.push(newOwned(this.save.nextId++, formAt(id, lv), rng.pick(NATURE_IDS), lv)), sp.name.toUpperCase());
      });
    }
    box.append(h('div', 'natdesc', 'MÜNZEN VERDIENST DU IN DER LIGA. NEUE MONSTER SETZT DU IM TEAM-MENÜ EIN.'), this.backBtn(() => this.showHub()));
    this.setScreen(box);
  }

  // ───────────── Optionen ─────────────
  showOptions() {
    this.toMenu();
    const box = h('div', 'page');
    box.append(h('h2', '', 'OPTIONEN'));
    const snd = h('button', 'btn', 'SOUND: ' + (this.save.sound ? 'AN' : 'AUS'));
    onTap(snd, () => { this.setSound(!this.save.sound); snd.textContent = 'SOUND: ' + (this.save.sound ? 'AN' : 'AUS'); });
    let armed = false;
    const reset = h('button', 'btn ghost', 'SPIELSTAND LÖSCHEN');
    onTap(reset, () => {
      if (!armed) { armed = true; reset.textContent = 'WIRKLICH LÖSCHEN?'; reset.classList.add('danger'); setTimeout(() => { armed = false; reset.textContent = 'SPIELSTAND LÖSCHEN'; reset.classList.remove('danger'); }, 3000); return; }
      this.save = newSave(); this.persist(); this.showTitle();
    });
    box.append(snd, reset, h('div', 'natdesc', 'ARENA MANAGER · PROTOTYP. ALLE MONSTER UND ATTACKEN SIND EIGENE ERFINDUNGEN.'), this.backBtn(() => this.showHub()));
    this.setScreen(box);
  }
}

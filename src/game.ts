import { Battle } from './battle/battle';
import { Mon, Trainer } from './battle/mon';
import { NATURES, NATURE_IDS, SPECIES, BASE_IDS, formAt, TACTICS, TacticId } from './data/species';
import { Renderer } from './gfx/renderer';
import { sfx } from './audio';
import { h, icons, onTap, spriteCanvas } from './ui/dom';
import { Rng } from './core/util';
import { MOVES } from './data/moves';
import { TYPE_NAMES, typeEffectiveness } from './data/types';

interface Owned { id: number; sp: string; nature: string; level: number }
interface Save {
  v: 4; coins: number; round: number; best: number; nextId: number;
  mons: Owned[]; team: number[]; items: { potion: number; super: number }; sound: boolean;
}

const KEY = 'arena-manager-v4';
const RIVALS = ['Rivale Blau', 'Camper Tim', 'Trainerin Lea', 'Angler Ben', 'Ass-Trainer Kai', 'Arenaleiterin Mara', 'Champ Rot'];
const MAX_TEAM = 3;
export const PRICES = { potion: 150, super: 400, mon: 700 };
const STARTER_LEVEL = 10;

const newSave = (): Save => ({ v: 4, coins: 200, round: 1, best: 0, nextId: 1, mons: [], team: [], items: { potion: 2, super: 0 }, sound: true });

export class Game {
  r: Renderer;
  battle: Battle | null = null;
  demo: Battle | null = null;
  save: Save;
  speed = 1; paused = false;
  mode: 'menu' | 'battle' | 'result' = 'menu';
  last = 0; acc = 0;
  resultShown = false;
  cardEls: { root: HTMLElement; hp: HTMLElement; lv: HTMLElement; cd: HTMLElement; sig: string }[] = [];
  el = {
    panel: document.getElementById('panel')!, cards: document.getElementById('cards')!, tactics: document.getElementById('tactics')!,
    btnSpecial: document.getElementById('btnSpecial') as HTMLButtonElement, btnPotion: document.getElementById('btnPotion') as HTMLButtonElement,
    btnSuper: document.getElementById('btnSuper') as HTMLButtonElement,
    screens: document.getElementById('screens')!, btnSpeed: document.getElementById('btnSpeed')!, btnPause: document.getElementById('btnPause')!,
    btnSound: document.getElementById('btnSound')!, top: document.getElementById('topbtns')!, hint: document.getElementById('hint')!,
  };

  constructor(screen: HTMLCanvasElement) {
    this.r = new Renderer(screen);
    this.save = this.load();
    sfx.setMuted(!this.save.sound);
    this.el.btnSound.textContent = this.save.sound ? '♪' : '♪✕';
    this.bindControls();
    this.startDemo();
    this.showTitle();
    requestAnimationFrame((t) => this.loop(t));
  }

  // ───────────── Spielstand ─────────────
  load(): Save {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.v === 4 && Array.isArray(s.mons)) {
        // Aufräumen: unbekannte Monster entfernen, Team reparieren
        s.mons = s.mons.filter((m: Owned) => SPECIES[m.sp]);
        s.team = (Array.isArray(s.team) ? s.team : []).filter((id: number) => s.mons.some((m: Owned) => m.id === id));
        if (!s.team.length && s.mons.length) s.team = [s.mons[0].id];
        return { ...newSave(), ...s };
      }
    } catch { /* ignorieren */ }
    return newSave();
  }
  persist() { try { localStorage.setItem(KEY, JSON.stringify(this.save)); } catch { /* ignorieren */ } }
  get teamMons(): Owned[] { return this.save.team.map((id) => this.save.mons.find((m) => m.id === id)!).filter(Boolean); }
  avgLevel() { const t = this.teamMons; return t.length ? t.reduce((a, m) => a + m.level, 0) / t.length : STARTER_LEVEL; }

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
  makeEnemy(): Trainer {
    const round = this.save.round;
    const rng = new Rng(round * 7919 + 13);
    const lvl = Math.max(5, Math.round(this.avgLevel()) - 1 + Math.floor((round - 1) / 3));
    const count = Math.min(3, Math.max(1, this.save.team.length + (round >= 6 ? 1 : 0)));
    // Die ersten Kämpfe: kein Gegner mit Typvorteil gegen dein Team
    const mine = this.teamMons.map((o) => SPECIES[o.sp]);
    const fair = BASE_IDS.filter((id) => !mine.some((m) => SPECIES[id].moves.some((mv) => typeEffectiveness(MOVES[mv].type, m.types) > 1)));
    const pool = round < 4 && fair.length ? fair : BASE_IDS;
    const team: Mon[] = [];
    for (let i = 0; i < count; i++) { const l = lvl + (i === count - 1 && count > 1 ? 1 : 0); team.push(new Mon(formAt(rng.pick(pool), l), l, rng.pick(NATURE_IDS))); }
    const tr = new Trainer(1, RIVALS[(round - 1) % RIVALS.length], team, true);
    tr.tactic = round < 3 ? 'balanced' : rng.pick<TacticId>(['balanced', 'attack', 'defend']);
    return tr;
  }

  startBattle() {
    sfx.unlock();
    const owned = this.teamMons;
    const team = owned.map((o) => { const m = new Mon(o.sp, o.level, o.nature); m.ownerId = o.id; return m; });
    const player = new Trainer(0, 'Du', team, false);
    player.potions = this.save.items.potion; player.supers = this.save.items.super;
    this.battle = new Battle(player, this.makeEnemy(), (Math.random() * 1e6) | 0);
    this.mode = 'battle'; this.resultShown = false; this.acc = 0;
    this.speed = 1; this.paused = false; this.el.btnSpeed.textContent = '1X';
    this.closeScreens();
    document.body.dataset.mode = 'battle';
    this.buildCards();
    this.syncTactics();
    this.r.showBanner('KAMPF ' + this.save.round, 1.5, this.battle.trainers[1].name.toUpperCase());
    sfx.startMusic();
  }

  /** Verbrauchte Items zurück in den Spielstand. */
  settleItems(b: Battle) {
    const p = b.trainers[0];
    this.save.items.potion = p.potions; this.save.items.super = p.supers;
  }

  checkResult(b: Battle) {
    if (b.winner !== null && b.overT > 1.3 && !this.resultShown) {
      this.resultShown = true; this.mode = 'result';
      sfx.stopMusic(); sfx.jingle(b.winner === 0);
      this.showResult(b.winner === 0, b);
    }
  }

  // ───────────── Steuerung im Kampf ─────────────
  bindControls() {
    this.el.tactics.innerHTML = '';
    (Object.keys(TACTICS) as TacticId[]).forEach((id) => {
      const btn = h('button', 'seg', TACTICS[id].name.toUpperCase(), { 'data-t': id });
      onTap(btn, () => {
        if (this.mode !== 'battle' || !this.battle) return;
        this.battle.setTactic(this.battle.trainers[0], id); sfx.ui(); this.syncTactics();
      });
      this.el.tactics.appendChild(btn);
    });
    onTap(this.el.btnSpecial, () => { if (this.mode === 'battle' && this.battle) this.battle.commandSpecial(this.battle.trainers[0]); });
    onTap(this.el.btnPotion, () => { if (this.mode === 'battle' && this.battle) this.battle.usePotion(this.battle.trainers[0], 'potion'); });
    onTap(this.el.btnSuper, () => { if (this.mode === 'battle' && this.battle) this.battle.usePotion(this.battle.trainers[0], 'super'); });
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
    this.el.hint.textContent = TACTICS[cur].blurb;
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
    const m = tr.active; const sp = m?.special;
    const ready = !!m && !!sp && m.cd[sp.id] <= 0.05 && tr.cmdCd <= 0 && m.alive && m.state !== 'summon';
    this.el.btnSpecial.disabled = !ready;
    this.el.btnSpecial.textContent = ready ? sp!.name.toUpperCase() + '!' : (tr.cmdCd > 0 ? 'BEFEHL ' + Math.ceil(tr.cmdCd) + 'S' : sp ? 'LÄDT…' : 'SPEZIAL');
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
      const quit = h('button', 'btn ghost', 'AUFGEBEN'); onTap(quit, () => {
        this.settleItems(this.battle!); this.persist(); this.paused = false; this.battle = null; this.showHub();
      });
      box.append(resume, quit);
      this.el.screens.appendChild(box);
    }
  }

  // ───────────── Menü-Grundlagen ─────────────
  closeScreens() { this.el.screens.innerHTML = ''; this.el.screens.classList.remove('on'); }

  setScreen(...nodes: HTMLElement[]) {
    this.mode = 'menu'; document.body.dataset.mode = 'menu';
    this.el.screens.innerHTML = ''; this.el.screens.classList.add('on');
    nodes.forEach((n) => this.el.screens.appendChild(n));
  }

  coinBar(): HTMLElement {
    const bar = h('div', 'coinbar');
    const c = h('div', 'coins'); c.append(icons.coin(2), h('b', '', String(this.save.coins)));
    bar.append(c, h('div', 'rnd', 'KAMPF ' + this.save.round));
    return bar;
  }

  backBtn(fn: () => void, label = 'ZURÜCK') {
    const b = h('button', 'btn ghost', label); onTap(b, () => { sfx.back(); fn(); }); return b;
  }

  toast(text: string) {
    const t = h('div', 'toast', text); document.body.appendChild(t);
    setTimeout(() => t.remove(), 1400);
  }

  // ───────────── Titel / Hub ─────────────
  showTitle() {
    const box = h('div', 'title');
    const logo = h('div', 'logo');
    logo.append(h('span', 'l1', 'ARENA'), h('span', 'l2', 'MANAGER'));
    const sub = h('div', 'sub', 'ECHTZEIT-KÄMPFE · DU BIST DER TRAINER');
    const mons = h('div', 'tmons'); mons.append(spriteCanvas('glimmdra', 3, 1), spriteCanvas('glutdrax', 3, 7));
    const start = h('button', 'btn big', this.save.mons.length ? 'WEITERSPIELEN' : 'NEUES SPIEL');
    onTap(start, () => { sfx.unlock(); sfx.ui(); this.save.mons.length ? this.showHub() : this.showStarter(); });
    box.append(logo, sub, mons, start, h('div', 'best', this.save.best ? 'BESTER SIEG: KAMPF ' + this.save.best : 'PROTOTYP v0.3'));
    this.setScreen(box);
  }

  showStarter() {
    const box = h('div', 'page');
    box.append(h('h2', '', 'DEIN ERSTES MONSTER'), h('div', 'sub', 'DEIN PARTNER FÜR DEN ANFANG. WEITERE MONSTER KANNST DU SPÄTER KAUFEN.'));
    const rng = new Rng((Math.random() * 1e9) | 0);
    for (const id of BASE_IDS) {
      const sp = SPECIES[id];
      const row = h('div', 'row card2');
      const art = h('div', 'sart'); art.appendChild(spriteCanvas(id, 2));
      const info = h('div', 'sinfo');
      info.append(h('div', 'nm', sp.name.toUpperCase()), h('div', 'ty', sp.types.map((t) => TYPE_NAMES[t].toUpperCase()).join('/')), h('div', 'mvs', sp.blurb.toUpperCase()));
      const pick = h('button', 'chip gold', 'WÄHLEN');
      onTap(pick, () => {
        sfx.ui();
        const o: Owned = { id: this.save.nextId++, sp: id, nature: rng.pick(NATURE_IDS), level: STARTER_LEVEL };
        this.save.mons.push(o); this.save.team = [o.id]; this.persist();
        this.toast(sp.name.toUpperCase() + ' SCHLIESST SICH DIR AN!');
        this.showHub();
      });
      info.append(pick);
      row.append(art, info);
      box.appendChild(row);
    }
    box.append(this.backBtn(() => this.showTitle()));
    this.setScreen(box);
  }

  showHub() {
    const box = h('div', 'page hub');
    box.append(this.coinBar(), h('h2', '', 'HAUPTMENÜ'));
    const tm = this.teamMons;
    const teamRow = h('div', 'teamrow');
    tm.forEach((m) => { const c = h('div', 'tm'); c.append(spriteCanvas(m.sp, 1), h('span', '', 'LV' + m.level)); teamRow.appendChild(c); });
    const fight = h('button', 'btn big', 'KAMPF ' + this.save.round + ' STARTEN');
    onTap(fight, () => { sfx.ui(); this.startBattle(); });
    const grid = h('div', 'grid2');
    const mk = (txt: string, fn: () => void, cls = '') => { const b = h('button', 'btn tile ' + cls, txt); onTap(b, () => { sfx.ui(); fn(); }); return b; };
    grid.append(mk('TEAM', () => this.showTeam()), mk('SHOP', () => this.showShop(), 'shop'), mk('OPTIONEN', () => this.showOptions(), 'ghost'), mk('TITEL', () => this.showTitle(), 'ghost'));
    const inv = h('div', 'inv');
    const it = (ic: HTMLElement, n: number) => { const d = h('div', 'it'); d.append(ic, h('b', '', '×' + n)); return d; };
    inv.append(it(icons.potion(), this.save.items.potion), it(icons.super(), this.save.items.super));
    box.append(teamRow, fight, grid, inv);
    this.setScreen(box);
  }

  // ───────────── Team ─────────────
  showTeam() {
    const box = h('div', 'page');
    box.append(this.coinBar(), h('h2', '', 'TEAM ' + this.save.team.length + '/' + MAX_TEAM));
    const desc = h('div', 'natdesc', 'TIPPE AUF DAS WESEN, UM DAS KAMPFVERHALTEN ZU ÄNDERN. IM KAMPF ZÄHLEN NUR MONSTER IM TEAM.');
    const list = h('div', 'slots');
    const render = () => {
      list.innerHTML = '';
      for (const o of this.save.mons) {
        const sp = SPECIES[o.sp], inTeam = this.save.team.includes(o.id);
        const row = h('div', 'slot' + (inTeam ? ' on' : ''));
        const art = h('div', 'sart'); art.appendChild(spriteCanvas(o.sp, 2));
        const info = h('div', 'sinfo');
        info.append(h('div', 'nm', sp.name.toUpperCase() + '  LV' + o.level), h('div', 'ty', sp.types.map((t) => TYPE_NAMES[t].toUpperCase()).join('/')));
        const nb = h('button', 'chip', '↻ ' + NATURES[o.nature].name.toUpperCase());
        onTap(nb, () => { o.nature = NATURE_IDS[(NATURE_IDS.indexOf(o.nature) + 1) % NATURE_IDS.length]; sfx.ui(); this.persist(); desc.textContent = NATURES[o.nature].name.toUpperCase() + ': ' + NATURES[o.nature].blurb.toUpperCase(); render(); });
        const tg = h('button', 'chip ' + (inTeam ? 'red' : 'gold'), inTeam ? 'RAUS' : 'INS TEAM');
        onTap(tg, () => {
          if (inTeam) { if (this.save.team.length <= 1) return this.toast('MIND. 1 MONSTER!'); this.save.team = this.save.team.filter((i) => i !== o.id); }
          else { if (this.save.team.length >= MAX_TEAM) return this.toast('TEAM IST VOLL!'); this.save.team.push(o.id); }
          sfx.ui(); this.persist(); this.showTeam();
        });
        const btns = h('div', 'btnrow'); btns.append(nb, tg);
        info.append(btns, h('div', 'mvs', sp.moves.map((m) => MOVES[m].name.toUpperCase()).join(' · ')));
        row.append(art, info); list.appendChild(row);
      }
    };
    render();
    box.append(list, desc, this.backBtn(() => this.showHub()));
    this.setScreen(box);
  }

  // ───────────── Shop ─────────────
  showShop() {
    const box = h('div', 'page');
    box.append(this.coinBar(), h('h2', '', 'SHOP'));
    const buy = (price: number, give: () => void, what: string) => {
      if (this.save.coins < price) { this.toast('NICHT GENUG MÜNZEN'); return; }
      this.save.coins -= price; give(); this.persist(); sfx.unlock(); sfx.handle({ type: 'heal' }, false); this.toast(what + ' GEKAUFT!'); this.showShop();
    };
    const item = (ic: HTMLElement, name: string, text: string, price: number, own: string, fn: () => void) => {
      const row = h('div', 'row card2');
      const art = h('div', 'sart ico'); art.appendChild(ic);
      const info = h('div', 'sinfo');
      info.append(h('div', 'nm', name), h('div', 'mvs', text), h('div', 'ty', own));
      const b = h('button', 'chip gold price', String(price));
      b.prepend(icons.coin(1)); if (this.save.coins < price) b.classList.add('off');
      onTap(b, fn); row.append(art, info, b); box.appendChild(row);
    };
    box.append(h('div', 'sec', 'ITEMS'));
    item(icons.potion(), 'TRANK', 'HEILT 45% KP DES AKTIVEN MONSTERS IM KAMPF.', PRICES.potion, 'BESITZ: ' + this.save.items.potion, () => buy(PRICES.potion, () => this.save.items.potion++, 'TRANK'));
    item(icons.super(), 'SUPERTRANK', 'HEILT ALLE KP UND HEILT VERBRENNUNG/PARALYSE.', PRICES.super, 'BESITZ: ' + this.save.items.super, () => buy(PRICES.super, () => this.save.items.super++, 'SUPERTRANK'));
    box.append(h('div', 'sec', 'MONSTER'));
    const rng = new Rng((Math.random() * 1e9) | 0);
    for (const id of BASE_IDS) {
      const sp = SPECIES[id];
      const have = this.save.mons.filter((m) => m.sp === id).length;
      item(spriteCanvas(id, 1.5), sp.name.toUpperCase(), sp.types.map((t) => TYPE_NAMES[t].toUpperCase()).join('/') + ' · LV ' + Math.max(5, Math.round(this.avgLevel()) - 2), PRICES.mon, 'BESITZ: ' + have, () => buy(PRICES.mon, () => {
        const o: Owned = { id: this.save.nextId++, sp: id, nature: rng.pick(NATURE_IDS), level: Math.max(5, Math.round(this.avgLevel()) - 2) };
        this.save.mons.push(o);
      }, sp.name.toUpperCase()));
    }
    box.append(h('div', 'natdesc', 'MÜNZEN VERDIENST DU DURCH SIEGE. NEUE MONSTER SETZT DU IM TEAM-MENÜ EIN.'), this.backBtn(() => this.showHub()));
    this.setScreen(box);
  }

  // ───────────── Optionen ─────────────
  showOptions() {
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

  // ───────────── Ergebnis ─────────────
  showResult(win: boolean, b: Battle) {
    this.settleItems(b);
    const en = b.trainers[1];
    const coins = win ? 60 + this.save.round * 15 : 15;
    this.save.coins += coins;
    const ups: string[] = []; const evolved: string[] = [];
    if (win) {
      for (const m of b.trainers[0].team) if (m.fought) {
        const o = this.save.mons.find((x) => x.id === m.ownerId);
        if (o) {
          const before = SPECIES[o.sp].name.toUpperCase(); ups.push(before + ' LV' + o.level + ' → ' + (o.level + 1)); o.level++;
          const evo = SPECIES[o.sp].evolvesTo;
          if (evo && o.level >= evo.level) { o.sp = evo.id; evolved.push(before + ' ENTWICKELT SICH ZU ' + SPECIES[evo.id].name.toUpperCase() + '!'); }
        }
      }
      this.save.best = Math.max(this.save.best, this.save.round);
      this.save.round++;
    }
    this.persist();
    const box = h('div', 'modal result ' + (win ? 'win' : 'lose'));
    box.append(h('h2', '', win ? 'SIEG!' : 'NIEDERLAGE'));
    box.append(h('div', 'sub', win ? en.name.toUpperCase() + ' IST BESIEGT' : 'DIESMAL HAT ' + en.name.toUpperCase() + ' GEWONNEN'));
    const stat = h('div', 'stats');
    const sv = (k: string, v: string | HTMLElement) => { const r = h('div', 'srow'); r.append(h('span', '', k)); const bb = h('b'); if (typeof v === 'string') bb.textContent = v; else bb.appendChild(v); r.append(bb); stat.appendChild(r); };
    sv('SCHADEN', String(b.stats.dmg[0])); sv('AUSGEWICHEN', String(b.stats.dodges[0])); sv('DAUER', Math.round(b.t) + 'S');
    const reward = h('span', 'rw'); reward.append(icons.coin(1), document.createTextNode(' +' + coins)); sv('BELOHNUNG', reward);
    box.append(stat);
    ups.forEach((u) => box.append(h('div', 'lvup', u)));
    evolved.forEach((u) => box.append(h('div', 'evo', '★ ' + u)));
    if (evolved.length) sfx.handle({ type: 'heal' }, false);
    const again = h('button', 'btn big', win ? 'NÄCHSTER KAMPF' : 'NOCHMAL');
    onTap(again, () => { sfx.ui(); this.startBattle(); });
    const menu = h('button', 'btn ghost', 'MENÜ'); onTap(menu, () => { sfx.back(); this.showHub(); });
    box.append(again, menu);
    this.setScreen(box);
    this.mode = 'result'; document.body.dataset.mode = 'battle';
  }
}

import { Battle } from './battle/battle';
import { Mon, Trainer } from './battle/mon';
import { NATURES, NATURE_IDS, SPECIES, SPECIES_IDS, TACTICS, TacticId } from './data/species';
import { Renderer } from './gfx/renderer';
import { sfx } from './audio';
import { h, onTap, spriteCanvas } from './ui/dom';
import { Rng } from './core/util';
import { MOVES } from './data/moves';
import { TYPE_NAMES } from './data/types';

interface Slot { sp: string; nature: string }
interface Save { round: number; best: number; slots: Slot[] }

const KEY = 'arena-manager-v2';
const RIVALS = ['Rivale Blau', 'Camper Tim', 'Trainerin Lea', 'Angler Ben', 'Ass-Trainer Kai', 'Arenaleiterin Mara', 'Champ Rot'];

export class Game {
  r: Renderer;
  battle: Battle | null = null;
  demo: Battle | null = null;
  save: Save;
  speed = 1; paused = false;
  mode: 'title' | 'team' | 'battle' | 'result' = 'title';
  last = 0; acc = 0;
  resultShown = false;
  cardEls: { root: HTMLElement; hp: HTMLElement; lv: HTMLElement; cd: HTMLElement; sig: string }[] = [];
  el = {
    panel: document.getElementById('panel')!, cards: document.getElementById('cards')!, tactics: document.getElementById('tactics')!,
    btnSpecial: document.getElementById('btnSpecial') as HTMLButtonElement, btnPotion: document.getElementById('btnPotion') as HTMLButtonElement,
    screens: document.getElementById('screens')!, btnSpeed: document.getElementById('btnSpeed')!, btnPause: document.getElementById('btnPause')!,
    btnSound: document.getElementById('btnSound')!, top: document.getElementById('topbtns')!, hint: document.getElementById('hint')!,
  };

  constructor(screen: HTMLCanvasElement) {
    this.r = new Renderer(screen);
    this.save = this.load();
    this.bindControls();
    this.startDemo();
    this.showTitle();
    requestAnimationFrame((t) => this.loop(t));
  }

  // ───────────── Speicher ─────────────
  load(): Save {
    const def: Save = { round: 1, best: 0, slots: [{ sp: 'charmander', nature: 'brave' }, { sp: 'squirtle', nature: 'timid' }, { sp: 'pikachu', nature: 'hasty' }] };
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && Array.isArray(s.slots) && s.slots.length === 3) return { ...def, ...s };
    } catch { /* ignorieren */ }
    return def;
  }
  persist() { try { localStorage.setItem(KEY, JSON.stringify(this.save)); } catch { /* ignorieren */ } }

  playerLevel() { return 12 + (this.save.round - 1) * 2; }

  // ───────────── Hauptschleife ─────────────
  loop(t: number) {
    const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
    this.last = t;
    const b = this.mode === 'battle' || this.mode === 'result' ? this.battle : this.demo;
    if (b) {
      if (!this.paused) {
        this.acc += dt * (this.mode === 'battle' ? this.speed : 1);
        let n = 0;
        while (this.acc >= 1 / 60 && n++ < 8) { b.update(1 / 60); this.acc -= 1 / 60; }
        for (const e of b.events) sfx.handle(e, this.mode === 'battle');
        b.events.length = 0;
      }
      this.r.draw(b, this.paused ? 0 : dt, this.mode !== 'title' && this.mode !== 'team');
      if (this.mode === 'title' || this.mode === 'team') {
        if (b.winner !== null && b.overT > 1.5) this.startDemo();
      }
      if (this.mode === 'battle') { this.updatePanel(); this.checkResult(b); }
    }
    sfx.tick(this.paused ? 0 : dt);
    requestAnimationFrame((tt) => this.loop(tt));
  }

  // ───────────── Demo (Titel-Hintergrund) ─────────────
  startDemo() {
    const r = new Rng((Math.random() * 1e9) | 0);
    const mk = (side: 0 | 1) => new Trainer(side, '', [
      new Mon(r.pick(SPECIES_IDS), 14, r.pick(NATURE_IDS)), new Mon(r.pick(SPECIES_IDS), 14, r.pick(NATURE_IDS)),
    ], true);
    this.demo = new Battle(mk(0), mk(1), (Math.random() * 1e6) | 0);
  }

  // ───────────── Kampf ─────────────
  makeEnemy(): Trainer {
    const round = this.save.round;
    const rng = new Rng(round * 7919 + 13);
    const lvl = 11 + (round - 1) * 2 + Math.max(0, round - 3);
    const count = round === 1 ? 2 : 3;
    const team: Mon[] = [];
    for (let i = 0; i < count; i++) team.push(new Mon(rng.pick(SPECIES_IDS), lvl + (i === count - 1 ? 1 : 0), rng.pick(NATURE_IDS)));
    const tr = new Trainer(1, RIVALS[(round - 1) % RIVALS.length], team, true);
    tr.tactic = round < 3 ? 'balanced' : rng.pick<TacticId>(['balanced', 'attack', 'defend']);
    return tr;
  }

  startBattle() {
    sfx.unlock();
    const team = this.save.slots.map((s) => new Mon(s.sp, this.playerLevel(), s.nature));
    const player = new Trainer(0, 'Du', team, false);
    this.battle = new Battle(player, this.makeEnemy(), (Math.random() * 1e6) | 0);
    this.mode = 'battle'; this.resultShown = false; this.acc = 0;
    this.speed = 1; this.paused = false; this.el.btnSpeed.textContent = '1X';
    this.el.screens.innerHTML = ''; this.el.screens.classList.remove('on');
    document.body.dataset.mode = 'battle';
    this.buildCards();
    this.syncTactics();
    const en = this.battle.trainers[1];
    this.r.showBanner('KAMPF ' + this.save.round, 1.5, en.name.toUpperCase());
    sfx.startMusic();
  }

  checkResult(b: Battle) {
    if (b.winner !== null && b.overT > 1.3 && !this.resultShown) {
      this.resultShown = true; this.mode = 'result';
      sfx.stopMusic(); sfx.jingle(b.winner === 0);
      this.showResult(b.winner === 0, b);
    }
  }

  // ───────────── Steuerung ─────────────
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
    onTap(this.el.btnPotion, () => { if (this.mode === 'battle' && this.battle) this.battle.usePotion(this.battle.trainers[0]); });
    onTap(this.el.btnSpeed, () => { this.speed = this.speed === 1 ? 2 : 1; this.el.btnSpeed.textContent = this.speed + 'X'; sfx.ui(); });
    onTap(this.el.btnPause, () => this.togglePause());
    onTap(this.el.btnSound, () => { sfx.unlock(); sfx.setMuted(!sfx.muted); this.el.btnSound.textContent = sfx.muted ? '♪✕' : '♪'; sfx.ui(); });
    // Audio beim ersten Tippen freischalten
    window.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.mode === 'battle' && !this.paused) this.togglePause(); });
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
      onTap(root, () => { if (this.mode === 'battle' && b.requestSwitch(tr, i)) { /* Sound über Event */ } });
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
    this.el.btnSpecial.textContent = ready ? 'SPEZIAL: ' + sp!.name.toUpperCase() : (tr.cmdCd > 0 ? 'BEFEHL ' + Math.ceil(tr.cmdCd) + 'S' : sp ? 'LÄDT…' : 'SPEZIAL');
    this.el.btnPotion.disabled = !m || !m.alive || tr.potions <= 0 || tr.itemCd > 0 || m.hp >= m.maxHp;
    this.el.btnPotion.textContent = 'TRANK ×' + tr.potions;
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
      const quit = h('button', 'btn ghost', 'AUFGEBEN'); onTap(quit, () => { this.paused = false; this.battle = null; this.showTeam(); });
      box.append(resume, quit);
      this.el.screens.appendChild(box);
    }
  }

  // ───────────── Screens ─────────────
  setScreen(...nodes: HTMLElement[]) {
    this.el.screens.innerHTML = ''; this.el.screens.classList.add('on');
    nodes.forEach((n) => this.el.screens.appendChild(n));
  }

  showTitle() {
    this.mode = 'title'; document.body.dataset.mode = 'title';
    const box = h('div', 'title');
    const logo = h('div', 'logo');
    logo.append(h('span', 'l1', 'ARENA'), h('span', 'l2', 'MANAGER'));
    const sub = h('div', 'sub', 'ECHTZEIT-KÄMPFE · DU BIST DER TRAINER');
    const mons = h('div', 'tmons'); mons.append(spriteCanvas('charmander', 3), spriteCanvas('squirtle', 3, 'idle0', -1));
    const start = h('button', 'btn big', 'START');
    onTap(start, () => { sfx.unlock(); sfx.ui(); this.showTeam(); });
    const best = h('div', 'best', this.save.best ? 'BESTER SIEG: KAMPF ' + this.save.best : 'FAN-PROJEKT · PROTOTYP v0.1');
    box.append(logo, sub, mons, start, best);
    this.setScreen(box);
  }

  showTeam() {
    this.mode = 'team'; document.body.dataset.mode = 'team';
    sfx.stopMusic();
    const box = h('div', 'team');
    box.append(h('h2', '', 'DEIN TEAM'), h('div', 'sub', 'KAMPF ' + this.save.round + ' · LV ' + this.playerLevel()));
    const list = h('div', 'slots');
    const desc = h('div', 'natdesc');
    const render = () => {
      list.innerHTML = '';
      this.save.slots.forEach((s, i) => {
        const sp = SPECIES[s.sp], nat = NATURES[s.nature];
        const row = h('div', 'slot');
        const art = h('button', 'sart'); art.appendChild(spriteCanvas(s.sp, 2));
        onTap(art, () => { s.sp = SPECIES_IDS[(SPECIES_IDS.indexOf(s.sp) + 1) % SPECIES_IDS.length]; sfx.ui(); this.persist(); render(); });
        const info = h('div', 'sinfo');
        info.append(h('div', 'nm', sp.name.toUpperCase()), h('div', 'ty', sp.types.map((t) => TYPE_NAMES[t].toUpperCase()).join('/') + ' · #' + sp.dex));
        const nb = h('button', 'chip', '↻ ' + nat.name.toUpperCase());
        onTap(nb, () => { s.nature = NATURE_IDS[(NATURE_IDS.indexOf(s.nature) + 1) % NATURE_IDS.length]; sfx.ui(); this.persist(); render(); desc.textContent = NATURES[s.nature].blurb; });
        info.append(nb);
        info.append(h('div', 'mvs', sp.moves.map((m) => MOVES[m].name.toUpperCase()).join(' · ')));
        row.append(h('div', 'idx', String(i + 1)), art, info);
        list.appendChild(row);
      });
    };
    render();
    desc.textContent = 'TIPP: TIPPE AUF EIN POKÉMON, UM ES ZU TAUSCHEN, UND AUF DAS WESEN, UM DAS VERHALTEN ZU ÄNDERN.';
    const go = h('button', 'btn big', 'KAMPF STARTEN');
    onTap(go, () => { sfx.unlock(); sfx.ui(); this.startBattle(); });
    const back = h('button', 'btn ghost', 'ZURÜCK');
    onTap(back, () => { sfx.back(); this.showTitle(); });
    box.append(list, desc, go, back);
    this.setScreen(box);
  }

  showResult(win: boolean, b: Battle) {
    const box = h('div', 'modal result ' + (win ? 'win' : 'lose'));
    box.append(h('h2', '', win ? 'SIEG!' : 'NIEDERLAGE'));
    const en = b.trainers[1];
    box.append(h('div', 'sub', win ? en.name.toUpperCase() + ' IST BESIEGT' : 'DIESMAL HAT ' + en.name.toUpperCase() + ' GEWONNEN'));
    const stat = h('div', 'stats');
    const sv = (k: string, v: string) => { const r = h('div', 'row'); r.append(h('span', '', k), h('b', '', v)); stat.appendChild(r); };
    sv('SCHADEN', String(b.stats.dmg[0])); sv('TREFFER', String(b.stats.hits[0])); sv('AUSGEWICHEN', String(b.stats.dodges[0]));
    sv('DAUER', Math.round(b.t) + 'S');
    box.append(stat);
    if (win) {
      this.save.best = Math.max(this.save.best, this.save.round);
      this.save.round++;
      this.persist();
      const next = h('button', 'btn big', 'NÄCHSTER KAMPF');
      onTap(next, () => { sfx.ui(); this.showTeam(); });
      box.append(h('div', 'sub', 'TEAM STEIGT AUF LV ' + this.playerLevel()), next);
    } else {
      const again = h('button', 'btn big', 'NOCHMAL');
      onTap(again, () => { sfx.ui(); this.showTeam(); });
      box.append(again);
    }
    this.setScreen(box);
  }
}

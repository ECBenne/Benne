import type { Game } from '../game';
import { h, onTap, spriteCanvas, pixIcon } from './dom';
import { sfx } from '../audio';
import { SPECIES, BASE_IDS } from '../data/species';
import { TYPE_NAMES, TypeId } from '../data/types';
import { ARENA_MODS, MOD_IDS, LAYERS } from '../data/league';
import { MAPS, MAP_IDS } from '../data/maps';
import * as L from '../league';
import { leagueEntry } from './league';
import { applyWin, battleStats } from './reward';
import { gainPlayerXp, markSeen, rankOf } from '../state';
import { cupsMenu, careerScreen } from './cups';
import { CUPS } from '../data/cups';
import type { Battle } from '../battle/battle';

/** Tab „Spielen": Auswahl der Spielmodi. */
export function playMenu(g: Game) {
  const run = g.save.run;
  const box: HTMLElement[] = [h('h2', '', 'SPIELEN')];
  const mode = (icon: HTMLElement, name: string, desc: string, status: string, fn: () => void, cls = '') => {
    const r = h('button', 'modecard ' + cls); const tx = h('div', 'tx');
    tx.append(h('b', '', name), h('span', '', desc), h('small', '', status)); r.append(icon, tx, h('span', 'go', '▶'));
    onTap(r, () => { sfx.ui(); fn(); }); box.push(r);
  };
  const etappe = run ? (run.at === null ? 1 : L.nodeById(run, run.at).layer + 2) : 0;
  mode(pixIcon('liga', 4), 'LIGA', 'DER HAUPTMODUS: 9 ETAPPEN MIT WEGWAHL, RAST, HÄNDLER UND BOSS.', run ? 'LAUF AKTIV · ETAPPE ' + Math.min(LAYERS, etappe) + '/' + LAYERS + ' · STUFE ' + run.tier : 'FREIGESCHALTET: STUFE ' + g.save.tier + ' · GEWONNEN: ' + g.save.stats.clears, () => leagueEntry(g), 'main');
  const cupsWon = Object.values(g.save.trophies).filter((n) => n > 0).length;
  mode(pixIcon('rival', 4), 'TURNIERE', 'CUPS MIT FESTEN REGELN: VIERTELFINALE BIS FINALE. IM GROSSEN FINALE WARTET DEIN RIVALE.', 'POKALE: ' + cupsWon + ' / ' + CUPS.length + ' · ' + rankOf(g.save.pl.lvl).n.toUpperCase(), () => cupsMenu(g));
  mode(pixIcon('boss', 4), 'TURM', 'ENDLOS-KAMPF: ETAGE FÜR ETAGE STÄRKERE GEGNER. WIE WEIT KOMMST DU?', 'REKORD: ETAGE ' + g.save.stats.towerBest, () => towerIntro(g));
  mode(pixIcon('raid', 4), 'RAID', 'EIN RIESIGER BOSS GEGEN DEIN GANZES TEAM. JEDER SIEG BRINGT EINEN KISTENSCHLÜSSEL – UND DER NÄCHSTE RAID WIRD HÄRTER.', 'RAID-STUFE ' + (g.save.raidLv + 1) + ' · BELOHNUNG: 1 SCHLÜSSEL', () => raidIntro(g));
  mode(pixIcon('battle', 4), 'ÜBUNG', 'FREIER KAMPF OHNE RISIKO. IDEAL, UM ATTACKEN UND TAKTIKEN ZU TESTEN.', 'KEINE BELOHNUNG · KP WERDEN NICHT VERBRAUCHT', () => practiceSetup(g));
  mode(pixIcon('liga', 4), 'KARRIERE', 'DEIN WEG ZUM CHAMPION: RANG, POKALSCHRANK, RIVALE KAI UND BILANZ.', 'RANG: ' + rankOf(g.save.pl.lvl).n.toUpperCase(), () => careerScreen(g));
  g.tabScreen('liga', box);
}

// ───────────── Turm ─────────────
interface Tower { floor: number; team: number[]; hp: Record<number, number>; earned: number }
const avgLv = (g: Game) => g.teamOwned.reduce((a, o) => a + o.level, 0) / Math.max(1, g.teamOwned.length);

function towerIntro(g: Game) {
  const box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); playMenu(g); });
  box.append(bk, h('h2', '', 'TURM'), h('div', 'subt', 'REKORD: ETAGE ' + g.save.stats.towerBest));
  box.append(h('div', 'bigp', 'JEDE ETAGE EIN KAMPF. DIE GEGNER WERDEN STÄRKER. NACH JEDEM SIEG ERHOLT SICH DEIN TEAM UM 25%. DU KANNST JEDERZEIT AUSSTEIGEN – MÜNZEN UND ERFAHRUNG BEHÄLTST DU IMMER.'));
  const strip = h('div', 'tstrip'); for (const o of g.teamOwned) { const c = h('div', 'tmini'); c.append(spriteCanvas(o.sp, 1), h('span', '', SPECIES[o.sp].name.toUpperCase().slice(0, 10)), h('span', '', 'LV ' + o.level)); strip.append(c); }
  const go = h('button', 'btn big', 'TURM BETRETEN');
  onTap(go, () => { sfx.ui(); const hp: Record<number, number> = {}; g.save.team.forEach((id) => (hp[id] = 1)); towerFloor(g, { floor: 1, team: [...g.save.team], hp, earned: 0 }); });
  box.append(strip, go); g.setScreen(box);
}

function towerSpec(g: Game, t: Tower): L.EnemySpec {
  const lvl = Math.max(5, Math.round(avgLv(g)) - 3 + Math.floor(t.floor / 2));
  const count = Math.min(3, Math.min(t.team.length, 1 + Math.floor((t.floor - 1) / 3)) + (t.floor % 5 === 0 && t.team.length > 1 ? 1 : 0));
  const elite = t.floor % 5 === 0;
  return L.customEnemy((Math.random() * 1e9) | 0, { name: (elite ? 'TURMWÄCHTER ' : 'ETAGE ') + t.floor, level: lvl + (elite ? 1 : 0), count: Math.max(1, Math.min(3, count)), coins: 22 + t.floor * 7 + (elite ? 60 : 0), kind: elite ? 'elite' : 'battle', mod: t.floor % 3 === 0 ? MOD_IDS[1 + (t.floor / 3 | 0) % 3] : 'none', map: MAP_IDS[t.floor % MAP_IDS.length], tactic: elite ? 'attack' : 'balanced' });
}

function towerFloor(g: Game, t: Tower) {
  g.toMenu();
  const spec = towerSpec(g, t); spec.mons.forEach((m) => markSeen(g.save, m.sp));
  const box = h('div', 'page');
  box.append(h('h2', '', 'ETAGE ' + t.floor), h('div', 'subt', (spec.kind === 'elite' ? 'TURMWÄCHTER! ' : '') + 'ARENA: ' + MAPS[spec.map].name.toUpperCase() + (spec.mod !== 'none' ? ' · WETTER: ' + ARENA_MODS[spec.mod].name.toUpperCase() : '') + ' · ' + spec.coins + ' MÜNZEN'), h('div', 'tip', MAPS[spec.map].desc.toUpperCase()));
  const er = h('div', 'erow');
  for (const m of spec.mons) { const c = h('div', 'ecard'); c.append(spriteCanvas(m.sp, 1), h('b', '', SPECIES[m.sp].name.toUpperCase()), h('span', '', 'LV ' + m.level + ' · ' + SPECIES[m.sp].types.map((x) => TYPE_NAMES[x].toUpperCase()).join('/'))); er.append(c); }
  box.append(er, h('div', 'sec', 'DEIN TEAM'));
  const strip = h('div', 'tstrip');
  for (const id of t.team) { const o = L.ownedOf(g.save, id), hp = t.hp[id] ?? 0; const c = h('div', 'tmini' + (hp <= 0 ? ' ko' : '')); const bar = h('div', 'bar'); const f = h('i'); f.style.width = Math.round(hp * 100) + '%'; f.className = hp > 0.5 ? '' : hp > 0.2 ? 'mid' : 'low'; bar.append(f); c.append(spriteCanvas(o.sp, 1), bar, h('span', '', hp <= 0 ? 'K.O.' : Math.round(hp * 100) + '%')); strip.append(c); }
  const go = h('button', 'btn big', 'KAMPF!');
  onTap(go, () => {
    sfx.ui();
    const size = L.battleSize(t.team.length, spec), len = L.lenMulOf(spec);
    g.beginBattle({ player: L.playerTrainer(g.save, t, size, len), enemy: L.enemyTrainer(spec, size, len), len, mod: spec.mod, map: spec.map, banner: 'ETAGE ' + t.floor, sub: spec.kind === 'elite' ? 'TURMWÄCHTER' : 'TURM', onEnd: (win, b) => towerAfter(g, t, spec, win, b) });
  });
  box.append(strip, go);
  if (t.floor > 1) { const out = h('button', 'btn ghost', 'AUSSTEIGEN (' + t.earned + ' MÜNZEN VERDIENT)'); onTap(out, () => { sfx.back(); towerEnd(g, t, false); }); box.append(out); }
  else box.append(g.backBtn(() => playMenu(g)));
  g.setScreen(box);
}

function towerAfter(g: Game, t: Tower, spec: L.EnemySpec, win: boolean, b: Battle) {
  const pt = b.trainers[0]; g.save.stats.battles++;
  for (const m of pt.team) t.hp[m.ownerId] = m.alive ? m.hp / m.maxHp : 0;
  if (!win) { g.save.stats.towerBest = Math.max(g.save.stats.towerBest, t.floor - 1); gainPlayerXp(g.save, 8); g.persist(); return towerEnd(g, t, true); }
  const r = applyWin(g, b, { coins: spec.coins, monXp: spec.kind === 'elite' ? 22 : 14, plXp: spec.kind === 'elite' ? 32 : 20 });
  t.earned += r.total; g.save.stats.towerBest = Math.max(g.save.stats.towerBest, t.floor);
  const key = spec.kind === 'elite'; if (key) g.save.inv.keys++;
  for (const id of t.team) if ((t.hp[id] ?? 0) > 0) t.hp[id] = Math.min(1, t.hp[id] + 0.25);
  g.persist();
  const box = h('div', 'modal result win');
  box.append(h('h2', '', 'ETAGE ' + t.floor + ' GESCHAFFT'), ...r.nodes);
  if (key) box.append(h('div', 'evo', '🗝 TURMWÄCHTER BESIEGT: +1 KISTENSCHLÜSSEL'));
  box.append(battleStats(b));
  const next = h('button', 'btn big', 'NÄCHSTE ETAGE'); onTap(next, () => { sfx.ui(); t.floor++; towerFloor(g, t); });
  const out = h('button', 'btn ghost', 'AUSSTEIGEN'); onTap(out, () => { sfx.back(); towerEnd(g, t, false); });
  box.append(next, out); g.setScreen(box);
}

function towerEnd(g: Game, t: Tower, lost: boolean) {
  const done = lost ? t.floor - 1 : t.floor - 1 + 0;
  const box = h('div', 'modal result ' + (lost ? 'lose' : 'win'));
  box.append(h('h2', '', lost ? 'TURM-ENDE' : 'AUSGESTIEGEN'), h('div', 'sub', lost ? 'DEIN TEAM IST AUF ETAGE ' + t.floor + ' GESCHEITERT.' : 'DU VERLÄSST DEN TURM.'));
  const st = h('div', 'stats'); const sv = (k: string, v: string) => { const r = h('div', 'srow'); r.append(h('span', '', k), h('b', '', v)); st.append(r); };
  sv('GESCHAFFTE ETAGEN', String(Math.max(0, done))); sv('MÜNZEN VERDIENT', String(t.earned)); sv('REKORD', 'ETAGE ' + g.save.stats.towerBest);
  const ok = h('button', 'btn big', 'ZURÜCK'); onTap(ok, () => { sfx.ui(); g.toMenu(); playMenu(g); });
  box.append(st, ok); g.setScreen(box);
}

// ───────────── Übung ─────────────
function practiceSetup(g: Game) {
  let diff = 0, type = 'any', count = Math.min(3, g.save.team.length), map = 'meadow';
  const render = () => {
    const box = h('div', 'page');
    const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); playMenu(g); });
    box.append(bk, h('h2', '', 'ÜBUNGSKAMPF'), h('div', 'subt', 'OHNE RISIKO UND OHNE BELOHNUNG. TESTE ATTACKEN, WESEN UND TAKTIKEN.'));
    const seg = (title: string, opts: [string, string | number][], cur: string | number, set: (v: any) => void) => {
      box.append(h('div', 'sec', title)); const s = h('div', 'seg2');
      for (const [label, v] of opts) { const b = h('button', v === cur ? 'on' : '', label); onTap(b, () => { sfx.ui(); set(v); render(); }); s.append(b); }
      box.append(s);
    };
    seg('STÄRKE', [['LEICHT', -3], ['GLEICH', 0], ['SCHWER', 3]], diff, (v) => (diff = v));
    const T4 = (a: [string, string][]) => a;
    seg('GEGNER-TYP', T4([['EGAL', 'any'], ['FEUER', 'fire'], ['WASSER', 'water'], ['PFLANZE', 'grass']]), type, (v) => (type = v));
    for (const row of [[['ELEKTRO', 'electric'], ['STEIN', 'rock'], ['EIS', 'ice'], ['GEIST', 'ghost']], [['WIND', 'wind'], ['GIFT', 'poison'], ['METALL', 'metal'], ['LICHT', 'light']], [['ERDE', 'earth'], ['KLANG', 'sound'], ['DUNKEL', 'dark'], ['KRISTALL', 'crystal']]] as [string, string][][]) {
      const s3 = h('div', 'seg2'); for (const [label, v] of row) { const b = h('button', v === type ? 'on' : '', label); onTap(b, () => { sfx.ui(); type = v; render(); }); s3.append(b); } box.append(s3);
    }
    seg('ANZAHL', [['1', 1], ['2', 2], ['3', 3]], count, (v) => (count = v));
    seg('ARENA', MAP_IDS.slice(0, 3).map((m) => [MAPS[m].name.toUpperCase().slice(0, 10), m] as [string, string]), map, (v) => (map = v));
    { const s2 = h('div', 'seg2'); for (const m of MAP_IDS.slice(3)) { const b = h('button', m === map ? 'on' : '', MAPS[m].name.toUpperCase()); onTap(b, () => { sfx.ui(); map = m; render(); }); s2.append(b); } box.append(s2, h('div', 'tip', MAPS[map].desc.toUpperCase())); }
    const go = h('button', 'btn big', 'KAMPF STARTEN');
    onTap(go, () => {
      sfx.ui();
      const spec = L.customEnemy((Math.random() * 1e9) | 0, { name: 'ÜBUNGSPARTNER', level: Math.max(5, Math.round(avgLv(g)) + diff), count, coins: 0, map, pool: type === 'any' ? BASE_IDS : BASE_IDS.filter((id) => SPECIES[id].types.includes(type as TypeId)) });
      const hp: Record<number, number> = {}; g.save.team.forEach((id) => (hp[id] = 1));
      const size = L.battleSize(g.save.team.length, spec);
      const player = L.playerTrainer(g.save, { team: [...g.save.team], hp }, size);
      g.beginBattle({ player, enemy: L.enemyTrainer(spec, size), mod: 'none', map, banner: 'ÜBUNG', sub: 'OHNE RISIKO', noConsume: true, onEnd: (win, b) => {
        const box2 = h('div', 'modal result ' + (win ? 'win' : 'lose'));
        box2.append(h('h2', '', win ? 'ÜBUNG GEWONNEN' : 'ÜBUNG VERLOREN'), h('div', 'sub', 'KEINE BELOHNUNG, KEIN VERLUST.'), battleStats(b));
        const again = h('button', 'btn big', 'NOCHMAL'); onTap(again, () => { sfx.ui(); g.toMenu(); practiceSetup(g); });
        const ok = h('button', 'btn ghost', 'ZURÜCK'); onTap(ok, () => { sfx.back(); g.toMenu(); playMenu(g); });
        box2.append(again, ok); g.setScreen(box2);
      } });
    });
    box.append(go); g.setScreen(box);
  };
  render();
}

// ───────────── Raid ─────────────
function raidSpec(g: Game): L.EnemySpec {
  const lv = g.save.raidLv, level = Math.max(8, Math.round(avgLv(g)) + 1 + Math.floor(lv / 2));
  const spec = L.customEnemy(9000 + lv * 37, { name: 'RAID-BOSS', level, count: 1, coins: 150 + lv * 50, kind: 'boss', boss: true, hpMul: 0.9 + lv * 0.04, tactic: 'attack', map: MAP_IDS[1 + (lv % (MAP_IDS.length - 1))] });
  spec.focusMul = 1.5; return spec;
}
function raidIntro(g: Game) {
  const spec = raidSpec(g), m = spec.mons[0]; markSeen(g.save, m.sp);
  const box = h('div', 'page');
  const bk = h('button', 'back', '◀ ZURÜCK'); onTap(bk, () => { sfx.back(); playMenu(g); });
  box.append(bk, h('h2', '', 'RAID STUFE ' + (g.save.raidLv + 1)), h('div', 'subt', 'EIN BOSS GEGEN DEIN GANZES TEAM. DEIN TEAM STARTET MIT VOLLEN KP.'));
  const c = h('div', 'ecard boss'); c.style.maxWidth = '180px'; c.append(spriteCanvas(m.sp, 2), h('b', '', SPECIES[m.sp].name.toUpperCase()), h('span', '', 'LV ' + m.level + ' · ' + SPECIES[m.sp].types.map((x) => TYPE_NAMES[x].toUpperCase()).join('/')), h('span', '', 'RIESIGE KP · WIRD BEI HALBEN KP WÜTEND'));
  const ban = h('div', 'banner2'); ban.append(h('b', '', 'ARENA: ' + MAPS[spec.map].name.toUpperCase()), document.createTextNode(MAPS[spec.map].desc.toUpperCase()), document.createElement('br'), document.createTextNode('BELOHNUNG: 1 KISTENSCHLÜSSEL + ' + spec.coins + ' MÜNZEN'));
  const strip = h('div', 'tstrip'); for (const o of g.teamOwned) { const t = h('div', 'tmini'); t.append(spriteCanvas(o.sp, 1), h('span', '', SPECIES[o.sp].name.toUpperCase().slice(0, 10)), h('span', '', 'LV ' + o.level)); strip.append(t); }
  const go = h('button', 'btn big', 'RAID STARTEN');
  onTap(go, () => {
    sfx.ui();
    const hp: Record<number, number> = {}; g.save.team.forEach((id) => (hp[id] = 1));
    const size = Math.max(2, g.save.team.length), len = L.lenMulOf(spec);
    g.beginBattle({ player: L.playerTrainer(g.save, { team: [...g.save.team], hp }, size, len), enemy: L.enemyTrainer(spec, size, len), len, mod: 'none', map: spec.map, banner: 'RAID', sub: 'STUFE ' + (g.save.raidLv + 1), onEnd: (win, b) => {
      g.save.stats.battles++;
      const box2 = h('div', 'modal result ' + (win ? 'win' : 'lose'));
      if (win) {
        const r = applyWin(g, b, { coins: spec.coins, monXp: 34, plXp: 70 }); g.save.inv.keys++; g.save.raidLv++; g.persist();
        box2.append(h('h2', '', 'RAID GEWONNEN!'), ...r.nodes, h('div', 'evo', '🗝 +1 KISTENSCHLÜSSEL'), battleStats(b));
      } else { gainPlayerXp(g.save, 10); g.persist(); box2.append(h('h2', '', 'RAID VERLOREN'), h('div', 'sub', 'DER BOSS WAR ZU STARK. TRAINIERE DEIN TEAM UND VERSUCH ES ERNEUT – ES KOSTET NICHTS.'), battleStats(b)); }
      const ok = h('button', 'btn big', 'WEITER'); onTap(ok, () => { sfx.ui(); g.toMenu(); playMenu(g); }); box2.append(ok); g.setScreen(box2);
    } });
  });
  box.append(c, ban, h('div', 'sec', 'DEIN TEAM'), strip, go); g.setScreen(box);
}

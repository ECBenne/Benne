// Spielt einen Kampf gezielt durch: erzwingt ein Ausweichen vor einem Nahkampfangriff und fotografiert Warnzeichen, Ausweichen, Konter
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['Pixel 7'], hasTouch: true })).newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.addInitScript(() => { localStorage.setItem('arena-manager-active', '1'); localStorage.setItem('arena-manager-slot-1', JSON.stringify({ v: 5, coins: 500, tier: 1, best: 0, nextId: 3, mons: [{ id: 1, sp: 'glimmdra', nature: 'timid', level: 20 }, { id: 2, sp: 'tropfling', nature: 'brave', level: 20 }], team: [1], inv: { potion: 3, super: 0, revive: 1, amulets: [] }, sound: false, run: null, tut: { guide: true, battle: true } })); });
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
await p.tap('text=WEITERSPIELEN'); await p.tap('.navbtn:has-text("SPIELEN")'); await p.tap('.modecard:has-text("ÜBUNG")'); await p.tap('text=KAMPF STARTEN'); await p.waitForTimeout(2500);
const res = await p.evaluate(() => {
  const g = window.__game, bt = g.battle; g.paused = true; const log = [];
  const m = bt.trainers[0].active, e = bt.trainers[1].active; m.hp = m.maxHp = e.hp = e.maxHp = 99999;
  // Gegner greift an, Spieler weicht aus
  m.x = 170; m.y = 330; e.x = 170; e.y = 300; m.vx = m.vy = e.vx = e.vy = 0; m.think = e.think = 99;
  const sw = e.moves.find(x => x.kind === 'melee') ?? e.moves.find(x => x.kind === 'dash') ?? e.moves.find(x => x.kind === 'projectile'); log.push('Angriff: ' + sw.id); e.cd[sw.id] = 0; bt.startMove(e, sw, Math.atan2(m.y - e.y, m.x - e.x), { x: m.x, y: m.y });
  for (let i = 0; i < 6; i++) bt.update(1 / 60);
  bt.commandDodge(bt.trainers[0]);
  let shot = 0;
  for (let i = 0; i < 90; i++) { bt.update(1 / 60); if (m.counterT > 0 && !shot) { shot = 1; g.r.manual = 0; for (let k = 0; k < 30; k++) g.r.follow(bt, 0.1); g.r.draw(bt, 1 / 60); log.push('counterT=' + m.counterT.toFixed(1) + ' @' + i); window.__snap = 1; break; } }
  return { log, counters: bt.stats.counters, dodges: bt.stats.dodges, punish: e.punishT, state: e.state, t: e.t };
});
console.log(JSON.stringify(res));
await p.waitForTimeout(100); await p.screenshot({ path: out + '/counter-1.png' });
const res2 = await p.evaluate(() => {
  const g = window.__game, bt = g.battle; const m = bt.trainers[0].active, e = bt.trainers[1].active;
  // Konter: eigener Treffer innerhalb des Fensters
  const mv = m.moves.find(x => x.kind === 'projectile' || x.kind === 'melee'); m.cd[mv.id] = 0; e.state = 'ready'; e.invuln = 0;
  const before = e.hp; m.x = 170; m.y = 330; e.x = 170; e.y = 310;
  bt.hit(m, e, mv, 1);
  g.r.draw(bt, 1 / 60);
  return { dmg: before - e.hp, counterT: m.counterT, counters: bt.stats.counters };
});
console.log(JSON.stringify(res2));
await p.waitForTimeout(100); await p.screenshot({ path: out + '/counter-2.png' });
await b.close();

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone SE'], hasTouch: true })).newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.addInitScript(() => { localStorage.setItem('arena-manager-active', '1'); localStorage.setItem('arena-manager-slot-1', JSON.stringify({ v: 5, coins: 500, tier: 1, best: 0, nextId: 3, mons: [{ id: 1, sp: 'glimmdra', nature: 'timid', level: 20 }], team: [1], inv: { potion: 3, super: 0, revive: 1, amulets: [] }, sound: false, run: null, tut: { guide: true, battle: true } })); });
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
await p.tap('text=WEITERSPIELEN'); await p.tap('.navbtn:has-text("SPIELEN")'); await p.tap('.modecard:has-text("ÜBUNG")'); await p.tap('text=KAMPF STARTEN'); await p.waitForTimeout(2500);
await p.tap('.seg:has-text("KONTER")'); await p.waitForTimeout(300);
const r = await p.evaluate(() => {
  const g = window.__game, bt = g.battle; g.paused = true; const m = bt.trainers[0].active, e = bt.trainers[1].active;
  m.hp = m.maxHp = e.hp = e.maxHp = 99999; m.x = 170; m.y = 340; e.x = 170; e.y = 300; m.vx = m.vy = e.vx = e.vy = 0; m.think = e.think = 99;
  const sw = e.moves.find(x => x.kind === 'melee') ?? e.moves.find(x => x.kind === 'dash') ?? e.moves.find(x => x.kind === 'projectile');
  e.cd[sw.id] = 0; bt.startMove(e, sw, Math.atan2(m.y - e.y, m.x - e.x), { x: m.x, y: m.y });
  m.state = 'ready'; bt.trainers[0].focus = 100;
  for (let i = 0; i < 9; i++) bt.update(1 / 60);
  bt.commandShield(bt.trainers[0]);           // Schild kurz vor dem Treffer
  const before = m.hp; bt.update(1 / 60);
  const full = e.moves.find(x => x.kind === 'melee' || x.kind === 'dash') ?? e.moves.find(x => x.power > 0);
  bt.hit(e, m, full, 1); g.r.draw(bt, 1 / 60); for (let i = 0; i < 6; i++) bt.update(1 / 60); g.r.draw(bt, 1 / 60);
  return { parries: bt.stats.parries, lost: before - m.hp, counterT: m.counterT, tactic: bt.trainers[0].tactic };
});
console.log(JSON.stringify(r));
await p.waitForTimeout(120); await p.screenshot({ path: out + '/parry.png' });
await b.close();

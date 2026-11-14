// Löst gezielt Spezialeffekte aus und fotografiert sie (Pikachu-Starter: Donner-Zone + Blitz)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone 13'], hasTouch: true })).newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForTimeout(800);
await p.tap('text=NEUES SPIEL'); await p.tap('text=WÄHLEN >> nth=2'); await p.waitForTimeout(300); await p.tap('text=STARTEN');
await p.waitForTimeout(2200);
await p.evaluate(() => {
  const g = window.__game, bt = g.battle; g.paused = true;
  for (let i = 0; i < 40; i++) bt.update(1 / 60);
  const m = bt.trainers[0].active, e = bt.trainers[1].active;
  const mv = m.moves.find((x) => x.kind === 'aoe');
  m.cd[mv.id] = 0; bt.startMove(m, mv, 0, { x: e.x + 30, y: e.y });
  e.vx = e.vy = 0;
  for (let i = 0; i < 40; i++) bt.update(1 / 60);
  g.r.manual = 99; g.r.cam.x = Math.max(0, e.x - 100); g.r.cam.y = Math.max(0, e.y * 0.7 - 120);
  g.r.draw(bt, 1 / 60);
});
await p.waitForTimeout(100); await p.screenshot({ path: out + '/fx-zone.png' });
await p.evaluate(() => { const g = window.__game, bt = g.battle; let n = 0; while (!bt.bolts.length && n++ < 120) bt.update(1 / 60); bt.update(1/60); g.r.draw(bt, 1 / 60); });
await p.waitForTimeout(100); await p.screenshot({ path: out + '/fx-bolt.png' });
await b.close();

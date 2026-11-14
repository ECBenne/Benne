// Isolierter Attacken-Test: KI beider Seiten eingefroren, eine Attacke, Bildfolge in voller Auflösung
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const [,, out, starter, moveId, ...stepsArg] = process.argv;
const steps = stepsArg.map(Number);
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone 13'], hasTouch: true })).newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForTimeout(800);
await p.tap('text=NEUES SPIEL'); await p.tap(`text=WÄHLEN >> nth=${starter}`); await p.waitForTimeout(300); await p.tap('text=STARTEN');
await p.waitForTimeout(2200);
await p.evaluate((moveId) => {
  const g = window.__game, bt = g.battle; g.paused = true;
  const m = bt.trainers[0].active, e = bt.trainers[1].active;
  e.hp = e.maxHp = 9999; m.hp = m.maxHp = 9999;
  e.x = 170; e.y = 270; m.x = 170; m.y = 380; m.vx = m.vy = e.vx = e.vy = 0;
  e.state = 'ready'; e.t = 0;
  const mv = m.moves.find(x => x.id === moveId); m.cd[mv.id] = 0; bt.startMove(m, mv, Math.atan2(e.y - m.y, e.x - m.x), { x: e.x, y: e.y });
  window.__frame = () => { m.think = e.think = 99; e.dodgeCd = 99; e.vx = e.vy = 0; bt.update(1 / 60); };
}, moveId);
let i = 0;
for (const n of steps) {
  await p.evaluate((n) => { const g = window.__game; for (let k = 0; k < n; k++) window.__frame(); g.r.manual = 0; for (let k = 0; k < 40; k++) g.r.follow(g.battle, 0.1); g.r.draw(g.battle, 1 / 60); }, n);
  await p.waitForTimeout(60); await p.screenshot({ path: `${out}/b-${moveId}-${i++}.png`, clip: { x: 100, y: 150, width: 200, height: 330 } });
}
await b.close();

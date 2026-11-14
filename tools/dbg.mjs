import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone 13'], hasTouch: true })).newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForTimeout(800);
await p.tap('text=NEUES SPIEL'); await p.tap('text=WÄHLEN >> nth=0'); await p.waitForTimeout(300); await p.tap('text=STARTEN');
for (let i = 0; i < 4; i++) {
  await p.waitForTimeout(1500); await p.screenshot({ path: process.argv[2] + '/dbg' + i + '.png' });
  console.log(await p.evaluate(() => { const g = window.__game, r = g.r, bt = g.battle; const ms = bt.trainers.map(t => t.active && [t.active.speciesId, Math.round(t.active.x), Math.round(t.active.y), t.active.state]); return JSON.stringify({ cam: r.cam, view: [r.k, innerWidth], manual: r.manual, ms }); }));
}
await b.close();

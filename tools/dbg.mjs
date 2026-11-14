import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['Pixel 7'], hasTouch: true })).newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForTimeout(500);
await p.tap('text=START'); await p.tap('text=KAMPF STARTEN'); await p.waitForTimeout(200);
const r = await p.evaluate(() => {
  const g = window.__game, bt = g.battle; g.paused = true; const log = [];
  let prev = '';
  for (let i = 0; i < 9000 && bt.winner === null; i++) {
    bt.update(1/60);
    const pl = bt.trainers[0];
    const s = `${pl.active ? pl.active.speciesId + ':' + pl.active.state : 'NONE'} ch=${bt.choosing} pend=${pl.pending}`;
    if (s !== prev) { log.push(i + ' ' + s); prev = s; }
  }
  return log.slice(0, 40);
});
console.log(r.join('\n'));
await b.close();

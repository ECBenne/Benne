// Spult den Kampf gezielt vor und fotografiert besondere Momente (Zone, Strahl, Blitz, K.O., Wechsel, Ergebnis)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['Pixel 7'], hasTouch: true });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForTimeout(800);
await p.tap('text=START'); await p.tap('text=KAMPF STARTEN'); await p.waitForTimeout(300);

const step = (cond, max = 3000) => p.evaluate(({ cond, max }) => {
  const g = window.__game; const f = new Function('b', 'return ' + cond);
  g.paused = true; // eigene Schleife: Spiel pausiert, wir treiben manuell
  for (let i = 0; i < max; i++) { g.battle.update(1 / 60); if (f(g.battle)) { g.r.draw(g.battle, 1/60); g.battle.events.length = 0; return i; } }
  g.r.draw(g.battle, 1/60); return -1;
}, { cond, max });
const shot = async (name) => { await p.waitForTimeout(80); await p.screenshot({ path: `${out}/${name}.png` }); };

console.log('zone', await step('b.zones.some(z=>!z.done && z.t>0.6)')); await shot('fx-zone');
console.log('bolt', await step('b.bolts.length>0')); await shot('fx-bolt');
console.log('cone', await step('b.trainers.some(t=>t.active&&t.active.move&&t.active.move.kind==="cone"&&t.active.state==="active"&&t.active.t>0.4)')); await shot('fx-cone');
console.log('slash', await step('b.slashes.length>0')); await shot('fx-slash');
console.log('faint', await step('b.trainers[0].active&&b.trainers[0].active.state==="faint"||b.trainers[1].active&&b.trainers[1].active.state==="faint"')); await shot('fx-faint');
console.log('choose', await step('b.choosing', 6000)); await shot('fx-choose');
const info = await p.evaluate(() => { const b = window.__game.battle; return { choosing: b.choosing, hp: b.trainers[0].team.map(m => m.hp), act: b.trainers[0].active?.speciesId }; });
console.log(JSON.stringify(info));
await b.close();

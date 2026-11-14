// Prüft: alter/kaputter Spielstand (Weiterspielen) + Entwicklung nach Sieg
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['Pixel 7'], hasTouch: true });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
// kaputter Spielstand mit unbekanntem Monster (wie der alte Pokémon-Stand)
await p.addInitScript(() => { localStorage.setItem('arena-manager-v4', JSON.stringify({ v: 4, coins: 500, round: 3, best: 2, nextId: 3, mons: [{ id: 1, sp: 'pikachu', nature: 'hasty', level: 12 }, { id: 2, sp: 'glimmdra', nature: 'brave', level: 13 }], team: [1], items: { potion: 2, super: 0 }, sound: true })); });
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForTimeout(900);
await p.tap('text=WEITERSPIELEN'); await p.waitForTimeout(400);
await p.screenshot({ path: out + '/evo-hub.png' });
console.log('Hub:', await p.evaluate(() => JSON.stringify({ team: window.__game.save.team, mons: window.__game.save.mons.map(m => m.sp + m.level) })));
await p.tap('text=STARTEN'); await p.waitForTimeout(1200);
// Kampf sofort gewinnen -> Ergebnis mit Entwicklung
await p.evaluate(() => { const g = window.__game, bt = g.battle; for (const m of bt.trainers[1].team) m.hp = 0; for (const m of bt.trainers[1].team) { m.state = 'faint'; m.t = 2; } bt.trainers[1].active = null; });
await p.waitForTimeout(3500);
await p.screenshot({ path: out + '/evo-result.png' });
console.log('Nach Sieg:', await p.evaluate(() => JSON.stringify(window.__game.save.mons.map(m => m.sp + m.level))));
await b.close();

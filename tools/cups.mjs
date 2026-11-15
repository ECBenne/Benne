// Spielt ein Turnier (Gold-Meisterschaft) per Bot durch und macht Screenshots; prüft Fehler.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone SE'], hasTouch: true })).newPage();
let errs = 0; p.on('pageerror', e => { errs++; console.log('PAGEERROR', e.message); });
const mon = (id, sp, nature) => ({ id, sp, nature, level: 16, xp: 0, moves: [], extra: [], mv: {}, ap: 3, bond: 3, bonus: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, item: null });
await p.addInitScript((ms) => { localStorage.setItem('arena-manager-active', '1'); localStorage.setItem('arena-manager-slot-1', JSON.stringify({ v: 5, coins: 500, tier: 1, best: 0, nextId: 4, mons: ms, team: [1, 2, 3], pl: { lvl: 15, xp: 0 }, inv: { potion: 3 }, run: null, tut: { guide: true, battle: true } })); }, [mon(1, 'glutdrax', 'brave'), mon(2, 'tropfling', 'calm'), mon(3, 'knoespling', 'sly')]);
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
const tap = async (s) => { await p.locator(s).first().tap(); await p.waitForTimeout(350); };
await tap('text=WEITERSPIELEN'); await tap('.navbtn:has-text("SPIELEN")');
await p.locator('.modecard:has-text("TURNIERE")').scrollIntoViewIfNeeded(); await p.screenshot({ path: out + '/C-spielen.png' });
await tap('.modecard:has-text("TURNIERE")'); await p.screenshot({ path: out + '/C-cups.png' });
await tap('.modecard:has-text("MEISTERSCHAFT")'); await p.screenshot({ path: out + '/C-intro.png' });
await tap('text=TURNIER STARTEN'); await p.screenshot({ path: out + '/C-runde1.png' });
for (let r = 0; r < 4; r++) {
  await tap('text=KAMPF!'); await p.waitForTimeout(500);
  await p.evaluate(() => { const bt = window.__game.battle; for (const m of bt.trainers[1].team) m.hp = 0; });
  await p.waitForTimeout(3500);
  await p.screenshot({ path: out + '/C-after' + r + '.png' });
  if (r < 3) { await tap('text=NÄCHSTE RUNDE'); if (r === 2) await p.screenshot({ path: out + '/C-finale.png' }); }
}
console.log('Pokale', await p.evaluate(() => JSON.stringify(window.__game.save.trophies)), 'Rivale', await p.evaluate(() => JSON.stringify(window.__game.save.rival)));
await tap('text=ZU DEN TURNIEREN'); await tap('text=◀ ZURÜCK'); await tap('.modecard:has-text("KARRIERE")'); await p.screenshot({ path: out + '/C-karriere.png' });
await p.evaluate(() => document.querySelector('.wrap')?.scrollTo(0, 9999)); await p.screenshot({ path: out + '/C-karriere2.png' });
console.log('Fehler', errs); await b.close();

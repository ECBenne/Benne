// Spielt das ganze Tutorial durch: Starterwahl (nur 3), Anleitung, geführter Kampf mit allen Schritten
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone SE'], hasTouch: true })).newPage();
let errs = 0; p.on('pageerror', e => { errs++; console.log('PAGEERROR', e.message); });
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
const tap = async (s) => { await p.locator(s).first().tap(); await p.waitForTimeout(350); };
await tap('text=NEUES SPIEL');
console.log('Starter zur Wahl:', await p.locator('.row.card2').count());
await p.screenshot({ path: out + '/TU-1.png' });
await tap('text=WÄHLEN');
let pages = 0; while (await p.locator('text=WEITER').count() && !(await p.locator('text=VERSTANDEN').count())) { await tap('.btn.big'); pages++; if (pages > 12) break; }
console.log('Anleitungsseiten:', pages + 1);
await p.screenshot({ path: out + '/TU-2.png' });
await tap('text=VERSTANDEN!'); await p.waitForTimeout(2500);
const step = () => p.evaluate(() => window.__game.tut?.step);
const wait = async (n, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await step()) >= n) return true; await p.waitForTimeout(200); } return false; };
const log = async (n) => console.log('Schritt', n, 'erreicht:', await wait(n), '|', await p.evaluate(() => document.getElementById('tipbar').textContent.slice(0, 60)));
await p.screenshot({ path: out + '/TU-3.png' });
await log(1); await tap('#btnSpecial:not([disabled])');
await log(2); await tap('#btnShield');
await log(3); { const q = await p.evaluate(() => { const g = window.__game, b = g.battle, m = b.trainers[0].active, e = b.trainers[1].active; const wx = Math.max(70, Math.min(330, (m.x + e.x) / 2 + 80)), wy = Math.max(190, Math.min(520, (m.y + e.y) / 2 + 60)); return g.r.clientAt(wx, wy); }); await p.touchscreen.tap(q.x, q.y); await p.waitForTimeout(500); }
await log(4); { const e = await p.evaluate(() => { const g = window.__game, m = g.battle.trainers[1].active; return g.r.clientPos(m); }); await p.touchscreen.tap(e.x, e.y); await p.waitForTimeout(500); }
await log(5); { const e = await p.evaluate(() => { const g = window.__game, m = g.battle.trainers[0].active; return g.r.clientPos(m); }); await p.touchscreen.tap(e.x, e.y); await p.waitForTimeout(500); }
await log(6); for (let k = 0; k < 5 && (await step()) === 6; k++) { await p.mouse.move(150, 180); await p.mouse.down(); await p.mouse.move(260, 190, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(700); }
await log(7); await p.screenshot({ path: out + '/TU-4.png' });
const pk = await p.evaluate(() => { const b = window.__game.battle, r = window.__game.r; const k = b.pickups[0]; return k ? { x: k.x, y: k.y } : null; });
// Kristall antippen: Bildschirmposition berechnen
if (pk) { const pos = await p.evaluate(({ x, y }) => { const r = window.__game.r; const m = window.__lib; return null; }, pk); }
await p.evaluate(() => { const b = window.__game.battle; const k = b.pickups[0]; if (k) b.orderMove(b.trainers[0], k.x, k.y); });
await log(8); await p.screenshot({ path: out + '/TU-5.png' });
await p.evaluate(() => { const b = window.__game.battle; const m = b.trainers[0].active; b.orderMove(b.trainers[0], m.x + 90, m.y); });
await log(9); await p.screenshot({ path: out + '/TU-6.png' });
await tap('.seg[data-t="defend"]'); await log(10);
await tap('#btnPotion'); await log(11); await p.screenshot({ path: out + '/TU-7.png' });
await p.evaluate(() => { const bt = window.__game.battle; for (const m of bt.trainers[1].team) m.hp = 0; }); await p.waitForTimeout(4500);
await p.screenshot({ path: out + '/TU-8.png' });
await tap('text=WEITER'); await p.waitForTimeout(500);
await p.screenshot({ path: out + '/TU-9.png' });
console.log('Fehler', errs); await b.close();

// Zeigt Liga-Karte mit Rivalenknoten, Rivalen-Scouting, Trainerprofil und den Team-Bildschirm mit gesperrten Plätzen
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone SE'], hasTouch: true })).newPage();
let errs = 0; p.on('pageerror', e => { errs++; console.log('PAGEERROR', e.message); });
await p.addInitScript(() => { localStorage.setItem('arena-manager-active', '1'); localStorage.setItem('arena-manager-slot-1', JSON.stringify({ v: 5, coins: 500, tier: 1, best: 0, nextId: 4, mons: [{ id: 1, sp: 'glimmdra', nature: 'timid', level: 14 }, { id: 2, sp: 'tropfling', nature: 'brave', level: 14 }, { id: 3, sp: 'knoespling', nature: 'sly', level: 14 }], team: [1, 2], pl: { lvl: 4, xp: 0 }, inv: { potion: 3, super: 0, revive: 1, amulets: [] }, sound: false, run: null, tut: { guide: true, battle: true } })); });
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
await p.tap('text=WEITERSPIELEN'); await p.tap('.navbtn:has-text("TEAM")'); await p.waitForTimeout(400); await p.screenshot({ path: out + '/R-team.png' });
await p.tap('.navbtn:has-text("SPIELEN")'); await p.tap('.modecard:has-text("LIGA")'); await p.tap('text=LIGA STARTEN'); await p.waitForTimeout(700); await p.screenshot({ path: out + '/R-karte.png' });
// zum Rivalen vorspulen
await p.evaluate(() => { const r = window.__game.save.run; const rv = r.layers.flat().find(n => n.kind === 'rival'); r.at = r.layers[rv.layer - 1][0].id; r.layers[rv.layer - 1][0].next = r.layers[rv.layer - 1][0].next.concat(rv.id); });
await p.tap('.navbtn:has-text("START")'); await p.tap('.navbtn:has-text("SPIELEN")'); await p.tap('.modecard:has-text("LIGA")'); await p.waitForTimeout(500);
const rid = await p.evaluate(() => { const r = window.__game.save.run; return r.layers.flat().find(n => n.kind === 'rival').id; });
await p.evaluate((rid) => { document.querySelectorAll('.node.go').forEach(() => {}); }, rid);
await p.locator('.node:has-text("RIVALE")').first().tap(); await p.waitForTimeout(500); await p.screenshot({ path: out + '/R-rivale.png' });
await p.tap('text=ZURÜCK ZUR KARTE'); await p.waitForTimeout(300);
await p.locator('.node.go').first().tap(); await p.waitForTimeout(500); await p.screenshot({ path: out + '/R-trainer.png' });
console.log('Fehler', errs); await b.close();

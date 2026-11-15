// Prüft die große Arena: Kristalle, Unwetter, Laufbefehl per Tippen, Wisch-Ausweichen
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone SE'], hasTouch: true })).newPage();
let errs = 0; p.on('pageerror', e => { errs++; console.log('PAGEERROR', e.message); });
const mon = (id, sp, nature) => ({ id, sp, nature, level: 16, xp: 0, moves: [], extra: [], mv: {}, ap: 3, bond: 0, bonus: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, item: null });
await p.addInitScript((ms) => { localStorage.setItem('arena-manager-active', '1'); localStorage.setItem('arena-manager-slot-1', JSON.stringify({ v: 5, coins: 500, tier: 1, best: 0, nextId: 4, mons: ms, team: [1, 2], pl: { lvl: 15, xp: 0 }, inv: { potion: 3 }, run: null, tut: { guide: true, battle: true }, opt: { vibe: false, music: false, hints: true } })); }, [mon(1, 'glutdrax', 'brave'), mon(2, 'tropfling', 'calm')]);
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
await p.tap('text=WEITERSPIELEN'); await p.waitForTimeout(300);
await p.tap('.navbtn:has-text("SPIELEN")'); await p.waitForTimeout(300); await p.locator('.modecard:has-text("ÜBUNG")').tap(); await p.waitForTimeout(300);
await p.locator('text=KAMPF STARTEN').tap(); await p.waitForTimeout(1500);
// Zeit vorspulen bis zu einem Kristall und einem Unwetter
await p.evaluate(() => { const b = window.__game.battle; b.nextPickupAt = b.t + 0.2; b.nextHazardAt = b.t + 0.3; });
await p.waitForTimeout(2200);
await p.screenshot({ path: out + '/W-1.png' });
const info = await p.evaluate(() => { const b = window.__game.battle; return { pickups: b.pickups.map(k => k.kind), hazards: b.hazards.length, ord: !!b.trainers[0].order }; });
console.log('Welt:', JSON.stringify(info));
// Tippen auf den Boden: Laufbefehl
await p.mouse.move(0, 0);
await p.touchscreen.tap(250, 220); await p.waitForTimeout(500);
console.log('Befehl gesetzt:', await p.evaluate(() => !!window.__game.battle.trainers[0].order));
await p.screenshot({ path: out + '/W-2.png' });
await p.waitForTimeout(2500); await p.screenshot({ path: out + '/W-3.png' });
const st = await p.evaluate(() => { const b = window.__game.battle; return JSON.stringify({ pick: b.stats.pickups, haz: b.stats.hazardHits, t: Math.round(b.t) }); });
console.log('Statistik:', st, 'Fehler', errs);
await b.close();

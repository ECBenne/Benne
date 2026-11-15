// Zeigt die neuen Monster im Kampf (alle Richtungen werden im Spiel genutzt) und im Sammlungs-Menü
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone SE'], hasTouch: true })).newPage();
let errs = 0; p.on('pageerror', e => { errs++; console.log('PAGEERROR', e.message); });
const mon = (id, sp, nature) => ({ id, sp, nature, level: 20, xp: 0, moves: [], extra: [], mv: {}, ap: 3, bond: 0, bonus: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, item: null });
const ids = ['donnerhirsch', 'felswacht', 'gletscherflug', 'nachtnaht', 'knospenkrab', 'schichtgrub', 'sprungvolt', 'frostschnabel', 'schleierich', 'funkelkrabb', 'kieselbud', 'flockfiep'];
await p.addInitScript((ms) => { localStorage.setItem('arena-manager-active', '1'); localStorage.setItem('arena-manager-slot-1', JSON.stringify({ v: 5, coins: 500, tier: 1, best: 0, nextId: 20, mons: ms, team: [1, 2, 3], pl: { lvl: 15, xp: 0 }, inv: { potion: 3 }, run: null, seen: ms.map(m => m.sp), tut: { guide: true, battle: true } })); }, ids.map((s, i) => mon(i + 1, s, ['brave', 'timid', 'hasty', 'sly', 'calm'][i % 5])));
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
const tap = async (s) => { await p.locator(s).first().tap(); await p.waitForTimeout(400); };
await tap('text=WEITERSPIELEN'); await tap('.navbtn:has-text("MEHR")'); await tap('text=SAMMLUNG'); await p.screenshot({ path: out + '/N-dex.png' });
await p.evaluate(() => document.querySelector('.wrap')?.scrollTo(0, 9999)); await p.screenshot({ path: out + '/N-dex2.png' });
await tap('text=ZURÜCK'); await tap('.navbtn:has-text("SPIELEN")'); await tap('.modecard:has-text("ÜBUNG")'); await tap('text=KAMPF STARTEN'); await p.waitForTimeout(6000); await p.screenshot({ path: out + '/N-kampf.png' });
await p.waitForTimeout(5000); await p.screenshot({ path: out + '/N-kampf2.png' });
console.log('Fehler', errs); await b.close();

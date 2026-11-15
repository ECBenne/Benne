// Screenshots: Monsterdetail (Wesen, Bindung, Training) und Team-Synergien
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone SE'], hasTouch: true })).newPage();
let errs = 0; p.on('pageerror', e => { errs++; console.log('PAGEERROR', e.message); });
const mon = (id, sp, nature, bond) => ({ id, sp, nature, level: 14, xp: 0, moves: [], extra: [], mv: {}, ap: 3, bond, bonus: { hp: 2, atk: 1, def: 0, spa: 3, spd: 0, spe: 0 }, item: null });
await p.addInitScript((ms) => { localStorage.setItem('arena-manager-active', '1'); localStorage.setItem('arena-manager-slot-1', JSON.stringify({ v: 5, coins: 500, tier: 1, best: 0, nextId: 4, mons: ms, team: [1, 2, 3], pl: { lvl: 7, xp: 0 }, inv: { potion: 3 }, run: null, tut: { guide: true, battle: true } })); }, [mon(1, 'glimmdra', 'brave', 12), mon(2, 'glimmdra', 'sly', 5), mon(3, 'tropfling', 'calm', 0)]);
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
await p.tap('text=WEITERSPIELEN'); await p.tap('.navbtn:has-text("TEAM")'); await p.waitForTimeout(400);
await p.locator('.synbox').scrollIntoViewIfNeeded(); await p.screenshot({ path: out + '/P3-team.png' });
await p.evaluate(() => document.querySelector('.wrap')?.scrollTo(0, 0));
await p.locator('.slot').first().tap(); await p.waitForTimeout(500);
await p.evaluate(() => document.querySelector('.wrap')?.scrollTo(0, 330)); await p.screenshot({ path: out + '/P3-detail.png' });
await p.evaluate(() => document.querySelector('.wrap')?.scrollTo(0, 1200)); await p.screenshot({ path: out + '/P3-train.png' });
console.log('Fehler', errs); await b.close();

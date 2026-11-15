// Prüft die Größe der Tippflächen (min. 40x40 px) auf den wichtigsten Bildschirmen
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone SE'], hasTouch: true })).newPage();
const mon = (id, sp, nature) => ({ id, sp, nature, level: 16, xp: 0, moves: [], extra: [], mv: {}, ap: 3, bond: 3, bonus: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, item: null });
await p.addInitScript((ms) => { localStorage.setItem('arena-manager-active', '1'); localStorage.setItem('arena-manager-slot-1', JSON.stringify({ v: 5, coins: 500, tier: 1, best: 0, nextId: 4, mons: ms, team: [1, 2, 3], pl: { lvl: 15, xp: 0 }, inv: { potion: 3, super: 1, focus: 1 }, run: null, tut: { guide: true, battle: true } })); }, [mon(1, 'glutdrax', 'brave'), mon(2, 'tropfling', 'calm'), mon(3, 'knoespling', 'sly')]);
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
const audit = async (name) => { const bad = await p.evaluate(() => [...document.querySelectorAll('button, .btn, .chip, [role=button]')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && (r.height < 38 || r.width < 38) && cs.pointerEvents !== 'none'; }).map((e) => (e.className + ':' + (e.textContent || '').trim().slice(0, 14) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)))); console.log(name, bad.length ? bad.slice(0, 8).join(' | ') : 'OK'); };
await p.tap('text=WEITERSPIELEN'); await p.waitForTimeout(400); await audit('Start');
for (const t of ['SPIELEN', 'TEAM', 'SHOP', 'MEHR']) { await p.locator('.navbtn:has-text("' + t + '")').tap(); await p.waitForTimeout(400); await audit(t); }
await p.locator('.navbtn:has-text("SPIELEN")').tap(); await p.locator('.modecard:has-text("ÜBUNG")').tap(); await p.waitForTimeout(300); await p.locator('text=KAMPF STARTEN').tap(); await p.waitForTimeout(2500); await audit('Kampf'); if (process.argv[2]) await p.screenshot({ path: process.argv[2] });
await b.close();

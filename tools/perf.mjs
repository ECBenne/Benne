// Misst Bildraten im Kampf (3 gegen 3) mit gedrosselter CPU (Handy-Simulation)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone SE'], hasTouch: true });
const p = await ctx.newPage();
let errs = 0; p.on('pageerror', e => { errs++; console.log('PAGEERROR', e.message); });
const mon = (id, sp, nature) => ({ id, sp, nature, level: 16, xp: 0, moves: [], extra: [], mv: {}, ap: 3, bond: 3, bonus: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, item: null });
await p.addInitScript((ms) => { localStorage.setItem('arena-manager-active', '1'); localStorage.setItem('arena-manager-slot-1', JSON.stringify({ v: 5, coins: 500, tier: 1, best: 0, nextId: 4, mons: ms, team: [1, 2, 3], pl: { lvl: 15, xp: 0 }, inv: { potion: 3 }, run: null, tut: { guide: true, battle: true }, opt: { vibe: false, music: false, hints: true } })); }, [mon(1, 'glutdrax', 'brave'), mon(2, 'tropfling', 'calm'), mon(3, 'knoespling', 'sly')]);
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
const cdp = await ctx.newCDPSession(p);
for (const rate of [1, 4]) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await p.evaluate(() => { const g = window.__game; g.toMenu?.(); });
  await p.tap('text=WEITERSPIELEN').catch(() => {});
  await p.tap('.navbtn:has-text("SPIELEN")').catch(() => {}); await p.locator('.modecard:has-text("ÜBUNG")').tap(); await p.waitForTimeout(300);
  await p.locator('text=ANZAHL').scrollIntoViewIfNeeded(); await p.locator('.seg2:nth-of-type(3) button:has-text("3")').first().tap().catch(() => {});
  await p.locator('text=KAMPF STARTEN').tap(); await p.waitForTimeout(2500);
  console.log('Modus', await p.evaluate(() => window.__game.mode + ' Monster ' + window.__game.battle?.trainers[0].team.length + 'v' + window.__game.battle?.trainers[1].team.length)); const r = await p.evaluate(() => new Promise((res) => { const d = []; let last = performance.now(); const f = (t) => { d.push(t - last); last = t; if (d.length < 240) requestAnimationFrame(f); else { d.sort((a, b) => a - b); res({ avg: d.reduce((a, b) => a + b, 0) / d.length, p95: d[Math.floor(d.length * 0.95)], max: d[d.length - 1] }); } }; requestAnimationFrame(f); }));
  console.log('CPU x' + rate, 'Ø ' + r.avg.toFixed(1) + ' ms · p95 ' + r.p95.toFixed(1) + ' ms · max ' + r.max.toFixed(1) + ' ms');
  await p.evaluate(() => { window.__game.mode = 'menu'; window.__game.toMenu(); }); await p.reload(); await p.waitForTimeout(800);
}
console.log('Fehler', errs); await b.close();

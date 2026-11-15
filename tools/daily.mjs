// Tagesaufgaben, Lager, Expeditionen, Beutel – mit Zeitsprung
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone SE'], hasTouch: true });
const p = await ctx.newPage();
let errs = 0; p.on('pageerror', e => { errs++; console.log('PAGEERROR', e.message); });
const mon = (id, sp, nature, lv) => ({ id, sp, nature, level: lv, xp: 0, moves: [], extra: [], mv: {}, ap: 3, bond: 0, bonus: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, item: null });
await p.addInitScript((ms) => { if (!localStorage.getItem('arena-manager-active')) { localStorage.setItem('arena-manager-active', '1'); localStorage.setItem('arena-manager-slot-1', JSON.stringify({ v: 5, coins: 500, tier: 1, best: 0, nextId: 10, mons: ms, team: [1], pl: { lvl: 12, xp: 0 }, inv: { potion: 3 }, run: null, tut: { guide: true, battle: true } })); } }, [mon(1, 'glutdrax', 'brave', 16), mon(2, 'tropfling', 'calm', 12), mon(3, 'kieselbud', 'sly', 8), mon(4, 'fetzling', 'hasty', 9)]);
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
const tap = async (s) => { await p.locator(s).first().tap(); await p.waitForTimeout(350); };
await tap('text=WEITERSPIELEN'); await p.waitForTimeout(300);
await p.screenshot({ path: out + '/D-0.png' });
await tap('text=SPÄTER'); await p.waitForTimeout(300);
await p.screenshot({ path: out + '/D-1.png' });
await p.evaluate(() => document.querySelector('.wrap')?.scrollTo(0, 9999)); await p.screenshot({ path: out + '/D-2.png' });
// Lager belegen
await tap('text=TRAININGSLAGER'); await tap('text=FREIER PLATZ'); await tap('.amrow >> nth=0');
await p.screenshot({ path: out + '/D-3.png' });
console.log('Lager:', await p.evaluate(() => JSON.stringify(window.__game.save.camp)));
// Expedition
await tap('text=ZURÜCK'); await tap('text=EXPEDITIONEN'); await tap('text=FREIER PLATZ'); await tap('.amrow >> nth=0'); await tap('text=8 STD'); await tap('text=KRISTALLHÖHLE'); await p.screenshot({ path: out + '/D-4.png' }); await tap('text=LOSSCHICKEN');
console.log('Expeditionen:', await p.evaluate(() => JSON.stringify(window.__game.save.exped.map(e => [e.mon, e.kind, e.dur]))));
await p.screenshot({ path: out + '/D-5.png' });
// 9 Stunden vorspulen und neu laden: Rückkehr-Bericht
await p.evaluate(() => { const { State } = window.__lib; window.__game.save.camp.since -= 9 * 36e5; window.__game.save.exped.forEach(e => { e.start -= 9 * 36e5; }); window.__game.save.sack.last = 0; window.__game.persist(); });
console.log('vor Reload:', await p.evaluate(() => JSON.stringify({ camp: window.__game.save.camp, ex: window.__game.save.exped.map(e=>e.start), now: Date.now(), raw: JSON.parse(localStorage.getItem('arena-manager-slot-' + window.__game.slot)).camp })));
await p.reload(); await p.waitForTimeout(900);console.log('nach Reload:', await p.evaluate(() => JSON.stringify({ camp: window.__game.save.camp, ex: window.__game.save.exped.length }))); console.log('Dbg:', await p.evaluate(() => { const L = window.__lib, s = window.__game.save; return JSON.stringify({ now: L.State.now(), skew: L.State.clock.skew, since: s.camp.since, h: L.Live.campHours(s), diff: (L.State.now() - s.camp.since) / 36e5 }); }));
console.log('Summary:', await p.evaluate(() => JSON.stringify(window.__lib.Live.offlineSummary(window.__game.save))));
await tap('text=WEITERSPIELEN'); await p.waitForTimeout(400);
await p.screenshot({ path: out + '/D-6.png' });
await tap('text=ALLES ABHOLEN'); await p.screenshot({ path: out + '/D-7.png' });
console.log('Nach Abholen:', await p.evaluate(() => { const s = window.__game.save; return JSON.stringify({ coins: s.coins, keys: s.inv.keys, lvl: s.mons.map(m => m.level + ':' + m.xp + ':b' + m.bond), exped: s.exped.length }); }));
// Aufgaben erledigen (simuliert) und abholen
await tap('text=WEITER');
await p.evaluate(() => { const L = window.__lib.Live, s = window.__game.save; L.ensureQuests(s); for (const q of s.quests.list) q.prog = q.goal; s.quests.wkWins = 12; window.__game.persist(); window.__game.showHub(true); });
await p.waitForTimeout(400);
console.log('Hit:', await p.evaluate(() => { const c = [...document.querySelectorAll('.chip')].find(e => e.textContent.includes('ABHOLEN')); if (!c) return 'kein Chip'; c.scrollIntoView({ block: 'center' }); const r = c.getBoundingClientRect(); const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return r.x + ',' + r.y + ' ' + r.width + 'x' + r.height + ' -> ' + (el && (el.tagName + '.' + el.className)) + ' / ' + document.getElementById('screens')?.className; }));
for (let i = 0; i < 1; i++) { const n = await p.locator('text=ABHOLEN').count(); if (!n) break; await p.locator('.chip:has-text("ABHOLEN")').first().tap({ timeout: 4000 }).catch((e) => console.log('Tap-Fehler', String(e).slice(0, 160))); await p.waitForTimeout(450); }
await p.screenshot({ path: out + '/D-8.png' });
console.log('Quests:', await p.evaluate(() => { const s = window.__game.save; return JSON.stringify({ coins: s.coins, keys: s.inv.keys, q: s.quests.list.map(q => q.kind + ':' + q.claimed), bonus: s.quests.bonus, wk: s.quests.wkClaimed }); }));
console.log('Fehler', errs); await b.close();

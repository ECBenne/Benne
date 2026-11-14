// Spieltest der Liga: Hub -> Karte -> Scouting -> Kampf (Befehle) -> Belohnung -> Rast/Händler/Ereignisse
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['Pixel 7'], hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERROR', e.message); });
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForTimeout(900);
const shot = async (n, wait = 250) => { await p.waitForTimeout(wait); await p.screenshot({ path: `${out}/L-${n}.png` }); };
await p.tap('text=NEUES SPIEL'); await p.tap('text=WÄHLEN >> nth=0'); await p.waitForTimeout(400);
await shot('1-hub');
await p.tap('text=LIGA STARTEN'); await shot('2-neueliga');
await p.tap('text=LIGA STARTEN'); await p.waitForTimeout(600); await shot('3-map');
await p.tap('.node.go >> nth=0'); await shot('4-scouting');
await p.tap('text=KAMPF!'); await p.waitForTimeout(2200); await shot('5-kampf');
// Befehle: Schild + Anfeuern probieren
await p.evaluate(() => { const g = window.__game; g.battle.trainers[0].focus = 100; });
await p.tap('#btnShield'); await p.tap('#btnBuff'); await p.waitForTimeout(600); await shot('6-befehle');
console.log('Fokus nach 2 Befehlen:', await p.evaluate(() => Math.round(window.__game.battle.trainers[0].focus)));
// Gewinn erzwingen
await p.evaluate(() => { const bt = window.__game.battle; for (const m of bt.trainers[1].team) { m.hp = 0; } });
await p.waitForTimeout(4500); await shot('7-belohnung');
await p.tap('text=WEITER');
if (await p.locator('text=ANWERBEN?').count()) { await shot('7b-anwerben'); await p.tap('text=ANWERBEN >> nth=1'); }
await p.waitForTimeout(500); await shot('8-map2');
// Knotentypen testen
const goKind = async (kind, name) => {
  await p.evaluate((kind) => { const r = window.__game.save.run; const cur = r.at === null ? r.layers[0] : r.next ?? []; const reach = r.at === null ? r.layers[0] : (() => { const n = r.layers.flat().find(x => x.id === r.at); return n.next.map(i => r.layers.flat().find(x => x.id === i)); })(); reach.forEach(n => n.kind = kind); }, kind);
  await p.tap('text=HAUPTMENÜ'); await p.waitForTimeout(200); await p.tap('text=LIGA FORTSETZEN'); await p.waitForTimeout(500);
  await p.tap('.node.go >> nth=0'); await shot(name);
};
await goKind('rest', '9-rast');
await p.tap('text=TRAINIEREN'); await shot('9b-training');
await p.tap('.amrow >> nth=0'); await shot('9c-trainstat');
await p.tap('.statrow >> nth=1 >> button'); await p.waitForTimeout(600);
await goKind('shop', '10-haendler');
await p.tap('text=WEITER'); await p.waitForTimeout(500);
await p.evaluate(() => { const r = window.__game.save.run; });
await goKind('event', '11-ereignis');
console.log('Fehler:', errs.length);
await b.close();

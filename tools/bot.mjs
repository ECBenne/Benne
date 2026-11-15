// Komplettlauf-Bot: klickt das ganze Spiel durch (kleiner Bildschirm) und meldet Fehler.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2], dev = process.argv[3] || 'iPhone SE';
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices[dev], hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERROR', e.message); });
p.on('console', m => { if (m.type() === 'error') { errs.push(m.text()); console.log('console.error', m.text()); } });
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForTimeout(900);
let n = 0;
const shot = async (name, wait = 300) => { await p.waitForTimeout(wait); await p.screenshot({ path: `${out}/B-${String(++n).padStart(2, '0')}-${name}.png` }); };
const has = async (t) => (await p.locator(`text=${t}`).count()) > 0;
const tap = async (sel) => { await p.locator(sel).first().tap({ timeout: 4000 }); await p.waitForTimeout(220); };
const nav = (label) => tap(`.navbtn:has-text("${label}")`);
// Überlauf prüfen: nichts darf breiter als der Bildschirm sein
const overflow = async (where) => { const w = await p.evaluate(() => { const vw = innerWidth; const bad = [...document.querySelectorAll('#screens *, #panel *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 1 || r.left < -1); }); return bad.slice(0, 3).map(e => e.className + ':' + (e.textContent || '').slice(0, 30)); }); if (w.length) console.log('ÜBERLAUF bei', where, w); };
const win = () => p.evaluate(() => { const bt = window.__game.battle; for (const m of bt.trainers[1].team) m.hp = 0; });
const lose = () => p.evaluate(() => { const bt = window.__game.battle; for (const m of bt.trainers[0].team) m.hp = 0; });

await tap('text=NEUES SPIEL'); await overflow('starter'); await shot('starter');
await tap('text=WÄHLEN'); for (let i = 0; i < 9 && !(await has('VERSTANDEN')); i++) await tap('.btn.big'); await tap('text=VERSTANDEN!');
// Tutorial-Kampf: Schritte werden in tools/tutorial.mjs einzeln geprüft, hier nur durchschalten
await p.waitForTimeout(3000); await shot('tutorial-1'); await overflow('tutorial');
for (let i = 0; i < 12; i++) { const st = await p.evaluate(() => window.__game.tut?.step ?? -1); if (st < 0 || st >= 9) break; await p.evaluate(() => { const g = window.__game; if (g.tut) { g.tut.step++; g.tut.t = 0; } }); await p.waitForTimeout(700); if (i === 3) await shot('tutorial-2'); }
console.log('Tutorial-Schritt:', await p.evaluate(() => window.__game.tut?.step));
await win(); await p.waitForTimeout(4500); await shot('tutorial-ende'); await overflow('tutorial-ende'); await tap('text=WEITER');
await shot('start', 800); await overflow('start');
await tap('text=TÄGLICHER BONUS');
// Monster mit hohem Level testen (Attacken umrüsten)
await p.evaluate(() => { const g = window.__game; const o = g.save.mons[0]; o.level = 20; g.persist(); });
await p.reload(); await p.waitForTimeout(900); await tap('text=WEITERSPIELEN');
await nav('TEAM'); await overflow('team'); await tap('.slot.on'); await shot('monster'); await overflow('monster');
await p.evaluate(() => document.querySelector('.wrap').scrollTo(0, 620)); await shot('attacken');
// Attacken-Verwaltung: Rangfolge, Aufwerten, Spezialisierung, Einsatzregel
await p.evaluate(() => { window.__game.save.mons[0].ap = 12; });
const before = await p.evaluate(() => window.__game.save.mons[0].moves.join(','));
await tap('.slotrow .mvb >> nth=1'); // Platz 1 nach unten
console.log('Rangfolge vorher:', before, '| nachher:', await p.evaluate(() => window.__game.save.mons[0].moves.join(',')));
await tap('.slotrow .mrow'); await shot('attacke-detail'); await overflow('attacke-detail');
await tap('text=AUFWERTEN'); await tap('text=AUFWERTEN'); await tap('.perk button'); await tap('.seg2 >> text=OFT'); await shot('attacke-stufe3');
console.log('Attacke:', await p.evaluate(() => JSON.stringify(window.__game.save.mons[0].mv)), 'AP:', await p.evaluate(() => window.__game.save.mons[0].ap));
await tap('text=◀ ZURÜCK'); await p.evaluate(() => document.querySelector('.wrap').scrollTo(0, 620)); await shot('attacken-liste');
await tap('text=◀ ZURÜCK');
await nav('SHOP'); await tap('.chip.price'); await overflow('shop'); await shot('shop-items');
await p.evaluate(() => { window.__game.save.coins = 3000; window.__game.save.inv.keys = 9; }); await tap('.seg2 >> text=AMULETTE'); await tap('.chip.price'); await shot('shop-amulette');
await tap('.seg2 >> text=ROLLEN'); await tap('.chip.price'); await shot('rollen'); await overflow('rollen');
await tap('.seg2 >> text=KISTEN'); await shot('kisten'); await overflow('kisten');
await tap('text=KISTE ÖFFNEN'); await p.waitForTimeout(1500); await shot('kiste-offen');
for (let i = 0; i < 8 && (await p.evaluate(() => window.__game.save.mons.length)) < 2; i++) { await tap('text=NOCH EINE'); await p.waitForTimeout(1500); }
console.log('Kisten geöffnet:', await p.evaluate(() => JSON.stringify(window.__game.save.chest)), 'Monster:', await p.evaluate(() => window.__game.save.mons.length));
await tap('text=WEITER');
await nav('TEAM'); await shot('team-kader'); await tap('.card2'); await tap('text=INS TEAM'); await tap('text=◀ ZURÜCK');
await tap('.slot.on'); await p.evaluate(() => document.querySelector('.wrap').scrollTo(0, 99999)); await p.waitForTimeout(200); if (await has('BEIBRINGEN')) { await tap('.amrow:has-text("BEIBRINGEN")'); console.log('Schriftrolle gelernt:', await p.evaluate(() => window.__game.save.mons.map(m => m.extra.join('+')).join('|'))); } await tap('text=◀ ZURÜCK');
await nav('MEHR'); await overflow('mehr'); await tap('text=ERFOLGE'); await overflow('erfolge'); await tap('text=◀ ZURÜCK'); await tap('text=SAMMLUNG'); await tap('.dexc.own'); await shot('dex-info'); await tap('text=◀ SAMMLUNG'); await tap('text=◀ ZURÜCK'); await tap('text=OPTIONEN'); await overflow('optionen'); await tap('text=◀ ZURÜCK');
// Übung
await nav('SPIELEN'); await shot('spielen'); await overflow('spielen');
await tap('.modecard:has-text("ÜBUNG")'); await overflow('uebung'); await shot('uebung'); await tap('text=KAMPF STARTEN'); await p.waitForTimeout(2500); await shot('kampf'); await overflow('kampf');
await tap('#btnPause'); await shot('pause'); await tap('text=WEITER'); await win(); await p.waitForTimeout(4200); await shot('uebung-ende'); await tap('text=ZURÜCK');
// Raid
await tap('.modecard:has-text("RAID")'); await shot('raid'); await overflow('raid'); await tap('text=RAID STARTEN'); await p.waitForTimeout(2500); await shot('raid-kampf'); await win(); await p.waitForTimeout(4500); await shot('raid-sieg'); await tap('text=WEITER');
// Turm: 3 Etagen, dann verlieren
await tap('.modecard:has-text("TURM")'); await tap('text=TURM BETRETEN');
for (let f = 1; f <= 3; f++) { await overflow('turm-etage'); await tap('text=KAMPF!'); await p.waitForTimeout(1800); await win(); await p.waitForTimeout(4200); if (f === 1) await shot('turm-sieg'); await overflow('turm-sieg'); await tap('text=NÄCHSTE ETAGE'); }
await tap('text=KAMPF!'); await p.waitForTimeout(1800); await lose(); await p.waitForTimeout(4500); await shot('turm-ende'); await tap('text=ZURÜCK');
console.log('Turm-Rekord:', await p.evaluate(() => window.__game.save.stats.towerBest));
// Liga: kompletter Lauf
await tap('.modecard:has-text("LIGA")'); await overflow('neue-liga'); await tap('text=LIGA STARTEN'); await shot('karte', 700); await overflow('karte');
let steps = 0, kinds = {};
while (steps++ < 14) {
  if (!(await p.locator('.node.go').count())) break;
  await tap('.node.go'); await p.waitForTimeout(250);
  const kind = await p.evaluate(() => { const r = window.__game.save.run; return r && r.pending !== null ? r.layers.flat().find(x => x.id === r.pending).kind : '?'; });
  kinds[kind] = (kinds[kind] || 0) + 1; await overflow('knoten-' + kind);
  if (kind === 'battle' || kind === 'elite' || kind === 'boss' || kind === 'rival') {
    if (kinds[kind] === 1) await shot('scouting-' + kind);
    await tap('text=KAMPF!'); await p.waitForTimeout(1800); await win(); await p.waitForTimeout(4300);
    if (kinds[kind] === 1) await shot('sieg-' + kind); await overflow('sieg-' + kind);
    await tap('text=WEITER'); await p.waitForTimeout(300);
    if (await has('ANWERBEN?')) { await shot('anwerben'); await tap('text=ABLEHNEN'); }
    if (kind === 'boss') { await shot('boss-belohnung'); await overflow('boss-belohnung'); await tap('.amrow'); await shot('liga-geschafft'); await tap('text=ZUM MENÜ'); break; }
  } else if (kind === 'rest') { await tap('text=RASTEN'); }
  else if (kind === 'shop') { if (kinds.shop === 1) await shot('haendler'); await tap('text=WEITER'); }
  else {
    await shot('ereignis-' + steps);
    for (const t of ['ÖFFNEN', 'TRINKEN', 'UMGEHEN', 'ABLEHNEN', 'OPFERN']) if (await has(t)) { await tap(`text=${t}`); break; }
    if (await has('WEITER')) await tap('text=WEITER');
  }
  await p.waitForTimeout(300);
}
console.log('Knoten:', JSON.stringify(kinds));
const st = await p.evaluate(() => { const s = window.__game.save; return { tier: s.tier, clears: s.stats.clears, run: !!s.run, pl: s.pl, coins: s.coins, mons: s.mons.map(m => m.sp + m.level + ':' + m.moves.length) }; });
console.log('Stand:', JSON.stringify(st));
await shot('start-danach', 800);
// Niederlage in der Liga
await nav('SPIELEN'); await tap('.modecard:has-text("LIGA")'); await tap('text=LIGA STARTEN'); await tap('.node.go'); await tap('text=KAMPF!'); await p.waitForTimeout(1800); await lose(); await p.waitForTimeout(4500); await shot('niederlage'); await tap('text=ZUM MENÜ');
// Neu laden: Spielstand bleibt
await p.reload(); await p.waitForTimeout(900); await tap('text=WEITERSPIELEN'); await shot('nach-neuladen', 700);
// Spielstände: zweiten Platz anlegen, prüfen, wieder löschen
await p.reload(); await p.waitForTimeout(900); await tap('text=SPIELSTÄNDE'); await shot('spielstaende'); await overflow('spielstaende');
await tap('.slotcard >> nth=1 >> text=NEUES SPIEL'); await tap('text=WÄHLEN >> nth=1'); await p.waitForTimeout(300);
await p.reload(); await p.waitForTimeout(900); await tap('text=SPIELSTÄNDE'); await shot('spielstaende-2');
const slots = () => p.evaluate(() => [1, 2, 3].map(i => { const r = localStorage.getItem('arena-manager-slot-' + i); return r ? JSON.parse(r).mons.map(m => m.sp).join('+') : 'leer'; }).join(' | ') + ' · aktiv ' + localStorage.getItem('arena-manager-active'));
console.log('Plätze:', await slots());
await tap('.slotcard >> nth=1 >> text=LÖSCHEN'); await tap('.slotcard >> nth=1 >> text=WIRKLICH?'); await p.waitForTimeout(300);
console.log('nach Löschen:', await slots());
await tap('.slotcard >> nth=0 >> text=LADEN'); await shot('platz1-geladen', 700);
console.log('Geladen:', await p.evaluate(() => window.__game.slot + ':' + window.__game.save.mons.length + ' Monster'));
console.log('FEHLER GESAMT:', errs.length);
await b.close();

// Größenvergleich: Glimmdra + Glutdrax nebeneinander an verschiedenen Stellen der Karte
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone 13'], hasTouch: true })).newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.addInitScript(() => { localStorage.setItem('arena-manager-v4', JSON.stringify({ v: 4, coins: 500, round: 1, best: 0, nextId: 3, mons: [{ id: 1, sp: 'glutdrax', nature: 'brave', level: 20 }], team: [1], items: { potion: 2, super: 0 }, sound: true })); });
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForTimeout(800);
await p.tap('text=WEITERSPIELEN'); await p.tap('text=STARTEN'); await p.waitForTimeout(1500);
const shot = async (name, js) => {
  await p.evaluate((js) => { const g = window.__game, bt = g.battle; g.paused = true; const m = bt.trainers[0].active, e = bt.trainers[1].active; m.hp = m.maxHp = e.hp = e.maxHp = 9999; m.think = e.think = 99; new Function('g', 'bt', 'm', 'e', js)(g, bt, m, e); for (let i = 0; i < 4; i++) bt.update(1 / 60); g.r.manual = 99; g.r.draw(bt, 1 / 60); }, js);
  await p.waitForTimeout(80); await p.screenshot({ path: `${out}/${name}.png` });
};
// Gegner = Glimmdra (Stufe 1) erzwingen: neues Mon-Objekt nicht nötig, wir vergleichen Spritegrößen per Blick auf beide
await shot('sc-top', 'm.x=90;m.y=150;m.vx=m.vy=0;e.x=230;e.y=150;e.vx=e.vy=0; g.r.cam.x=0; g.r.cam.y=20;');
await shot('sc-mid', 'm.x=120;m.y=330;e.x=200;e.y=330; g.r.cam.x=60; g.r.cam.y=100;');
await shot('sc-bottom', 'm.x=120;m.y=490;e.x=200;e.y=490; g.r.cam.x=60; g.r.cam.y=200;');
await b.close();

// Löst gezielt Attacken aus und fotografiert sie. Nutzung: node tools/fx.mjs <outdir> <starter-index 0..2>
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2], starter = +(process.argv[3] ?? 0);
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone 13'], hasTouch: true })).newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForTimeout(800);
await p.tap('text=NEUES SPIEL'); await p.tap(`text=WÄHLEN >> nth=${starter}`); await p.waitForTimeout(300); await p.tap('text=STARTEN');
await p.waitForTimeout(2200);
const snap = async (name, js, steps) => {
  await p.evaluate(({ js, steps }) => {
    const g = window.__game, bt = g.battle; g.paused = true;
    const m = bt.trainers[0].active, e = bt.trainers[1].active;
    e.hp = e.maxHp = 9999; m.hp = m.maxHp = 9999;
    new Function('bt', 'm', 'e', js)(bt, m, e);
    for (let i = 0; i < steps; i++) bt.update(1 / 60);
    g.r.manual = 0; for (let i = 0; i < 30; i++) g.r.follow(bt, 0.1);
    g.r.draw(bt, 1 / 60);
  }, { js, steps });
  await p.waitForTimeout(80); await p.screenshot({ path: `${out}/a-${name}.png` });
};
const place = 'e.x=170;e.y=250;e.vx=e.vy=0;m.x=170;m.y=380;m.vx=m.vy=0;';
const use = (id, ang) => `${place} const mv=m.moves.find(x=>x.id==="${id}"); m.cd[mv.id]=0; e.state="stagger"; e.t=-9; bt.startMove(m,mv,${ang ?? 'Math.atan2(e.y-m.y,e.x-m.x)'}, {x:e.x,y:e.y});`;
for (const [name, id, steps] of [['move1', null, 0]]) { }
const moves = await p.evaluate(() => window.__game.battle.trainers[0].active.moves.map(x => x.id));
console.log('moves', moves);
await snap('idle-back', place + 'e.state="ready";', 5);
for (const id of moves) {
  await snap(`${id}-1windup`, use(id), 12);
  await snap(`${id}-2fire`, '', 22);
  await snap(`${id}-3mid`, '', 14);
  await snap(`${id}-4late`, '', 14);
}
await b.close();

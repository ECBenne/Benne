// Fotografiert jede Arena im Kampf (Monster gezielt ins Gelände gestellt)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const out = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['Pixel 7'], hasTouch: true })).newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.addInitScript(() => { localStorage.setItem('arena-manager-v5', JSON.stringify({ v: 5, coins: 500, tier: 1, best: 0, nextId: 4, mons: [{ id: 1, sp: 'tropfling', nature: 'timid', level: 14 }, { id: 2, sp: 'glimmdra', nature: 'brave', level: 14 }, { id: 3, sp: 'knoespling', nature: 'sly', level: 14 }], team: [1, 2, 3], inv: { potion: 3, super: 0, revive: 1, amulets: [] }, sound: false, run: null, tut: { guide: true } })); });
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
await p.tap('text=WEITERSPIELEN'); await p.waitForTimeout(300);
const maps = { rocks: [0, [150, 345], [170, 250]], lake: [0, [170, 330], [250, 250]], volcano: [1, [106, 322], [170, 300]], jungle: [2, [112, 270], [232, 372]] };
for (const [map, [lead, pm, em]] of Object.entries(maps)) {
  await p.evaluate(async ({ map, lead, pm, em }) => {
    const g = window.__game; const L = g.__L;
    const s = g.save; const order = [s.mons[lead].id, ...s.mons.filter((_, i) => i !== lead).map(m => m.id)]; s.team = order;
  }, { map, lead, pm, em });
  await p.tap('.navbtn:has-text("SPIELEN")'); await p.tap('.modecard:has-text("ÜBUNG")');
  await p.tap(`.seg2 >> text=${{ rocks: 'FELSGARTEN', lake: 'SEEUFER', volcano: 'VULKANFELD', jungle: 'DSCHUNGEL' }[map]}`);
  await p.tap('text=KAMPF STARTEN'); await p.waitForTimeout(2600);
  await p.evaluate(({ pm, em }) => { const g = window.__game, bt = g.battle; g.paused = true; const m = bt.trainers[0].active, e = bt.trainers[1].active; m.x = pm[0]; m.y = pm[1]; e.x = em[0]; e.y = em[1]; m.vx = m.vy = e.vx = e.vy = 0; m.think = e.think = 9; for (let i = 0; i < 3; i++) bt.update(1 / 60); g.r.manual = 99; g.r.cam.x = 40; g.r.cam.y = 70; g.r.draw(bt, 1 / 60); }, { pm, em });
  await p.waitForTimeout(100); await p.screenshot({ path: `${out}/M-${map}.png`, clip: { x: 0, y: 0, width: 412, height: 560 } });
  await p.evaluate(() => { const g = window.__game; g.paused = false; for (const m of g.battle.trainers[1].team) m.hp = 0; });
  await p.waitForTimeout(4300); await p.tap('text=ZURÜCK'); await p.waitForTimeout(300);
}
await b.close();

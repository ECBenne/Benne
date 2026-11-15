// Löst Attacken gezielt aus und fotografiert die Effekte. node tools/fxshots.mjs <ordner> <Art> <Attacke,Attacke,...>
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const [out, sp, movesArg, delays] = process.argv.slice(2);
const moves = movesArg.split(',');
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone SE'], hasTouch: true, deviceScaleFactor: 2 })).newPage();
let errs = 0; p.on('pageerror', e => { errs++; console.log('PAGEERROR', e.message); });
await p.addInitScript(() => { localStorage.setItem('arena-manager-active', '1'); localStorage.setItem('arena-manager-slot-1', JSON.stringify({ v: 5, coins: 500, tier: 1, best: 0, nextId: 4, mons: [{ id: 1, sp: 'glimmdra', nature: 'brave', level: 5, xp: 0, moves: [], extra: [], mv: {}, ap: 3, bond: 0, bonus: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, item: null }], team: [1], pl: { lvl: 15, xp: 0 }, inv: { potion: 3 }, run: null, tut: { guide: true, battle: true }, opt: { vibe: false, music: false, hints: false } })); });
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(900);
await p.tap('text=WEITERSPIELEN'); await p.waitForTimeout(300);
const mvIds = moves;
await p.evaluate(([sp, mvIds]) => {
  const g = window.__game, { Mon, Trainer, League: L } = window.__lib;
  const me = new Mon(sp, 22, 'calm', { moves: mvIds, hpMul: 6 }); const pl = new Trainer(0, 'Du', [me], false);
  const spec = L.customEnemy(5, { name: 'Dummy', level: 20, count: 1, coins: 0, pool: ['felswacht'], map: 'meadow' });
  const en = L.enemyTrainer(spec, 1, 6);
  g.beginBattle({ player: pl, enemy: en, mod: 'none', map: 'meadow', banner: 'TEST', sub: '', noConsume: true, len: 1, onEnd: () => {} });
  en.auto = false; en.team[0].hp = en.team[0].maxHp = 999999; en.team[0].baseSpeed = 0;
  g.battle.trainers[0].auto = false;
}, [sp, mvIds]);
await p.waitForTimeout(2200);
for (let i = 0; i < mvIds.length; i++) {
  const id = mvIds[i];
  const info = await p.evaluate((id) => { const g = window.__game, b = g.battle, m = b.trainers[0].active, e = b.trainers[1].active; const mv = m.moves.find(x => x.id === id); m.state = 'ready'; m.cd[id] = 0; m.x = 170; m.y = 400; e.x = 170; e.y = mv.nova ? 410 : 270; e.vx = e.vy = 0; b.startMove(m, mv, Math.atan2(e.y - m.y, e.x - m.x), { x: e.x, y: e.y }); return { w: mv.windup, kind: mv.kind }; }, id);
  const ts = (delays ?? '0.1,0.3,0.6').split(',').map(Number);
  let last = 0;
  for (let k = 0; k < ts.length; k++) {
    await p.waitForTimeout(Math.max(30, (info.w + ts[k] - last) * 1000)); last = info.w + ts[k];
    await p.screenshot({ path: `${out}/FX-${id}-${k}.png`, clip: { x: 0, y: 60, width: 375, height: 420 } });
  }
  await p.waitForTimeout(1800);
}
console.log('Fehler', errs); await b.close();

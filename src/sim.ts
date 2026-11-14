import { Battle } from './battle/battle';
import { Mon, Trainer } from './battle/mon';
import { NATURE_IDS } from './data/species';
import { Rng } from './core/util';

export function runSim(n: number, lvl = 14) {
  const out: any[] = [];
  const r = new Rng(7);
  for (let i = 0; i < n; i++) {
    const mk = (side: 0 | 1) => new Trainer(side, 'T' + side, [
      new Mon('pikachu', lvl, r.pick(NATURE_IDS)), new Mon('charmander', lvl, r.pick(NATURE_IDS)), new Mon('squirtle', lvl, r.pick(NATURE_IDS)),
    ], true);
    const b = new Battle(mk(0), mk(1), 100 + i);
    let steps = 0;
    while (b.winner === null && steps < 60 * 300) { b.update(1 / 60); b.events.length = 0; steps++; }
    out.push({ winner: b.winner, secs: +(steps / 60).toFixed(1), dmg: b.stats.dmg, dodges: b.stats.dodges, hits: b.stats.hits });
  }
  return out;
}
(globalThis as any).runSim = runSim;

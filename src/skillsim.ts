import { Battle } from './battle/battle';
import { Mon, Trainer, sizeHpMul } from './battle/mon';
import { NATURE_IDS, formAt } from './data/species';
import { Rng } from './core/util';
import { enemyMoves } from './league';

const POOL = ['glimmdra', 'tropfling', 'knoespling', 'funkelkrabb', 'kieselbud', 'flockfiep', 'fetzling', 'windstelz', 'bronzepanzer', 'quakustik'];
/** Spieler mit Können `skill` gegen KI: Seite 0 weicht schwächer automatisch aus (wie im Spiel), dafür gezielt und perfekt mit Wahrscheinlichkeit `skill`. */
export function skillSim(n: number, lvl: number, plus: number, count: number, skill: number) {
  const r = new Rng(11); let wins = 0, perfects = 0, parries = 0, secs = 0;
  for (let i = 0; i < n; i++) {
    const mk = (side: 0 | 1, l: number) => { const t = new Trainer(side, 'T' + side, Array.from({ length: count }, () => { const sp = formAt(r.pick(POOL), l); return new Mon(sp, l, r.pick(NATURE_IDS), { moves: enemyMoves(sp, l), hpMul: sizeHpMul(count) }); }), true); return t; };
    const a = mk(0, lvl), b = mk(1, lvl + plus); a.manual = true; a.skill = skill;
    const bt = new Battle(a, b, 300 + i, 'none', 'meadow'); let s = 0;
    while (bt.winner === null && s < 60 * 300) { bt.update(1 / 60); bt.events.length = 0; s++; }
    if (bt.winner === 0) wins++; perfects += bt.stats.perfects[0]; parries += bt.stats.parries[0]; secs += s / 60;
  }
  return { wins, perfects: perfects / n, parries: parries / n, secs: secs / n };
}
(globalThis as any).skillSim = skillSim;

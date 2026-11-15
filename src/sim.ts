import { Battle } from './battle/battle';
import { Mon, Trainer } from './battle/mon';
import { NATURE_IDS, BASE_IDS, formAt } from './data/species';
import { Rng } from './core/util';
import { enemyMoves } from './league';
import { sizeHpMul } from './battle/mon';

export function runSim(n: number, lvl = 14, count = 3, idsA: string[] = BASE_IDS, idsB: string[] = BASE_IDS, mapId = 'meadow') {
  const out: any[] = [];
  const r = new Rng(7);
  for (let i = 0; i < n; i++) {
        const mk = (side: 0 | 1) => new Trainer(side, 'T' + side, Array.from({ length: count }, () => ((sp: string) => new Mon(sp, lvl, r.pick(NATURE_IDS), { moves: enemyMoves(sp, lvl), hpMul: sizeHpMul(count) }))(formAt(r.pick(side === 0 ? idsA : idsB), lvl)) ?? new Mon('glimmdra', lvl, r.pick(NATURE_IDS))), true);
    const b = new Battle(mk(0), mk(1), 100 + i, 'none', mapId);
    let steps = 0;
    let dsum = 0, dn = 0, close = 0, travel = 0; const last = new Map<number, [number, number]>();
    while (b.winner === null && steps < 60 * 300) {
      b.update(1 / 60); b.events.length = 0; steps++;
      const a0 = b.trainers[0].active, a1 = b.trainers[1].active;
      if (a0 && a1 && a0.alive && a1.alive && steps % 6 === 0) { const d = Math.hypot(a0.x - a1.x, a0.y - a1.y); dsum += d; dn++; if (d < 38) close++; }
      for (const m of [a0, a1]) if (m && m.alive && steps % 6 === 0) { const l = last.get(m.uid); if (l) travel += Math.hypot(m.x - l[0], m.y - l[1]); last.set(m.uid, [m.x, m.y]); }
    }
    out.push({ avgDist: dn ? dsum / dn : 0, closeFrac: dn ? close / dn : 0, travel: travel / Math.max(1, steps / 60), winner: b.winner, secs: +(steps / 60).toFixed(1), dmg: b.stats.dmg, dodges: b.stats.dodges, hits: b.stats.hits, counters: b.stats.counters, blocked: b.stats.blocked, parries: b.stats.parries });
  }
  return out;
}
(globalThis as any).runSim = runSim;

import { Battle } from './battle/battle';
import { Rng } from './core/util';
import { newSave, newOwned, Save } from './state';
import { WIN_HEAL, newRun, makeEnemy, enemyTrainer, playerTrainer, reachable, nodeById, healFrac, ownedOf } from './league';
import { SPECIES, NATURE_IDS, formAt } from './data/species';

/** Spielt einen Liga-Lauf mit einfacher Spieler-KI durch (zum Einstellen der Schwierigkeit). */
export function simulateRun(seed: number, tier: number, starter: string, teamSize = 1, level = 10) {
  const rng = new Rng(seed);
  const save: Save = newSave();
  for (let i = 0; i < teamSize; i++) { const o = newOwned(save.nextId++, formAt(i === 0 ? starter : rng.pick(['glimmdra', 'tropfling', 'knoespling']), level), rng.pick(NATURE_IDS), level); save.mons.push(o); save.team.push(o.id); }
  const run = newRun(save, tier, seed);
  save.run = run;
  let layerReached = 0, battles = 0;
  const avgHp = () => run.team.reduce((a, id) => a + (run.hp[id] ?? 0), 0) / run.team.length;
  while (true) {
    // Manager-Entscheidungen zwischen den Kämpfen: Tränke/Beleber einsetzen
    for (const id of run.team) {
      if ((run.hp[id] ?? 0) <= 0 && save.inv.revive > 0) { save.inv.revive--; run.hp[id] = 0.4; }
      while ((run.hp[id] ?? 0) > 0 && run.hp[id] < 0.45 && save.inv.potion > 0) { save.inv.potion--; healFrac(run, id, 0.45); }
    }
    const opts = reachable(run);
    if (!opts.length) break;
    // Politik: bei wenig KP Rast bevorzugen, Elite nur bei guter Lage, sonst Kampf
    const hpAvg = avgHp();
    const pick = opts.find((n) => n.kind === 'rest' && hpAvg < 0.75) ?? opts.find((n) => n.kind === 'boss')
      ?? opts.find((n) => n.kind === 'elite' && hpAvg > 0.7) ?? opts.find((n) => n.kind === 'battle') ?? opts.find((n) => n.kind === 'event') ?? opts[0];
    layerReached = pick.layer;
    if (pick.kind === 'rest') { for (const id of run.team) healFrac(run, id, 0.5, true); if (run.hp[run.team[0]] <= 0) run.hp[run.team[0]] = 0.25; run.at = pick.id; continue; }
    if (pick.kind === 'shop') { save.inv.potion += 2; save.inv.revive += 1; run.at = pick.id; continue; }
    if (pick.kind === 'event') { if (pick.kind === 'event') for (const id of run.team) healFrac(run, id, 0.1); run.at = pick.id; continue; }
    // Kampf
    const spec = makeEnemy(save, run, pick);
    const pt = playerTrainer(save, run); pt.auto = true;
    const pot0 = pt.potions;
    if (pt.aliveCount === 0) return { cleared: false, layer: layerReached, battles };
    const b = new Battle(pt, enemyTrainer(spec), rng.int(1, 1e9), spec.mod);
    let steps = 0;
    while (b.winner === null && steps < 60 * 400) { b.update(1 / 60); b.events.length = 0; steps++; }
    battles++; save.inv.potion = Math.max(0, save.inv.potion - (pot0 - pt.potions));
    for (const m of pt.team) run.hp[m.ownerId] = m.hp / m.maxHp;
    if (b.winner !== 0) return { cleared: false, layer: layerReached, battles };
    for (const m of pt.team) if (m.fought) { const o = ownedOf(save, m.ownerId); o.level++; const e = SPECIES[o.sp].evolvesTo; if (e && o.level >= e.level) o.sp = e.id; }
    for (const id of run.team) if ((run.hp[id] ?? 0) > 0) healFrac(run, id, WIN_HEAL);
    run.at = pick.id; run.won++;
    if (pick.kind === 'boss') return { cleared: true, layer: layerReached, battles };
  }
  return { cleared: false, layer: layerReached, battles };
}
(globalThis as any).simulateRun = simulateRun;

import { Battle } from './battle/battle';
import { Rng } from './core/util';
import { newSave, newOwned, gainXp, Save } from './state';
import { cupById, CUP_HEAL } from './data/cups';
import { seriesSpec, enemyMoves, customEnemy, cupRoundSpec, WIN_HEAL, XP_MON, lenMulOf, newRun, makeEnemy, enemyTrainer, playerTrainer, reachable, nodeById, healFrac, ownedOf } from './league';
import { SPECIES, NATURE_IDS, formAt } from './data/species';

/** Spielt einen Liga-Lauf mit einfacher Spieler-KI durch (zum Einstellen der Schwierigkeit). */
export function simulateRun(seed: number, tier: number, starter: string, teamSize = 1, level = 10) {
  const rng = new Rng(seed);
  const save: Save = newSave();
  for (let i = 0; i < teamSize; i++) { const o = newOwned(save.nextId++, formAt(i === 0 ? starter : rng.pick(['glimmdra', 'tropfling', 'knoespling']), level), rng.pick(NATURE_IDS), level); o.moves = enemyMoves(o.sp, level); save.mons.push(o); save.team.push(o.id); }
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
    const size = Math.max(run.team.length, spec.mons.length);
    const len = lenMulOf(spec);
    const pt = playerTrainer(save, run, size, len); pt.auto = true;
    const pot0 = pt.potions;
    if (pt.aliveCount === 0) return { cleared: false, layer: layerReached, battles };
    const b = new Battle(pt, enemyTrainer(spec, size, len), rng.int(1, 1e9), spec.mod, spec.map, len);
    let steps = 0;
    while (b.winner === null && steps < 60 * 600) { b.update(1 / 60); b.events.length = 0; steps++; }
    battles++; save.inv.potion = Math.max(0, save.inv.potion - (pot0 - pt.potions));
    for (const m of pt.team) run.hp[m.ownerId] = m.hp / m.maxHp;
    if (b.winner !== 0) return { cleared: false, layer: layerReached, battles };
    for (const m of pt.team) if (m.fought) { const ow = ownedOf(save, m.ownerId); gainXp(save, ow, XP_MON[spec.kind]); ow.bond++; }
    for (const id of run.team) if ((run.hp[id] ?? 0) > 0) healFrac(run, id, WIN_HEAL);
    run.at = pick.id; run.won++;
    if (pick.kind === 'boss') return { cleared: true, layer: layerReached, battles };
  }
  return { cleared: false, layer: layerReached, battles };
}

/** Spielt ein Turnier mit der Spieler-KI durch (Schwierigkeit der Cups prüfen). */
export function simulateCup(seed: number, cupId: string, starter: string, teamSize: number, level: number, trainerLvl = 0) {
  const cup = cupById(cupId), rng = new Rng(seed);
  const save: Save = newSave(); save.pl.lvl = cup.minPl;
  const n = Math.min(teamSize, cup.maxTeam);
  for (let i = 0; i < n; i++) { const o = newOwned(save.nextId++, formAt(i === 0 ? starter : rng.pick(['glimmdra', 'tropfling', 'knoespling']), level), rng.pick(NATURE_IDS), level); o.bond = trainerLvl; o.moves = enemyMoves(o.sp, level); save.mons.push(o); save.team.push(o.id); }
  const t = { team: [...save.team], hp: {} as Record<number, number> }; t.team.forEach((id) => (t.hp[id] = 1));
  for (let r = 0; r < cup.rounds.length; r++) {
    const spec = cupRoundSpec(save, cup, t.team, r, seed);
    const size = Math.max(t.team.length, spec.mons.length), len = lenMulOf(spec);
    const pt = playerTrainer(save, t, size, len); pt.auto = true;
    if (pt.aliveCount === 0) return r;
    const b = new Battle(pt, enemyTrainer(spec, size, len), rng.int(1, 1e9), spec.mod, spec.map, len);
    let steps = 0; while (b.winner === null && steps < 60 * 600) { b.update(1 / 60); b.events.length = 0; steps++; }
    for (const m of pt.team) t.hp[m.ownerId] = m.alive ? m.hp / m.maxHp : 0;
    if (b.winner !== 0) return r;
    for (const id of t.team) if ((t.hp[id] ?? 0) > 0) t.hp[id] = Math.min(1, t.hp[id] + CUP_HEAL);
  }
  return cup.rounds.length;
}
/** Raid-Boss gegen ein Team (wie in ui/modes.ts): true = Sieg */
export function simulateRaid(seed: number, raidLv: number, starter: string, teamSize: number, level: number) {
  const rng = new Rng(seed), save: Save = newSave();
  for (let i = 0; i < teamSize; i++) { const o = newOwned(save.nextId++, formAt(i === 0 ? starter : rng.pick(['glimmdra', 'tropfling', 'knoespling']), level), rng.pick(NATURE_IDS), level); o.moves = enemyMoves(o.sp, level); save.mons.push(o); save.team.push(o.id); }
  const t = { team: [...save.team], hp: {} as Record<number, number> }; t.team.forEach((id) => (t.hp[id] = 1));
  const spec = customEnemy(9000 + raidLv * 37, { name: 'RAID-BOSS', level: Math.max(8, level + 1 + Math.floor(raidLv / 2)), count: 1, coins: 0, kind: 'boss', boss: true, hpMul: 0.9 + raidLv * 0.04, tactic: 'attack' });
  spec.focusMul = 1.5;
  const size = Math.max(2, t.team.length), len = lenMulOf(spec);
  const pt = playerTrainer(save, t, size, len); pt.auto = true;
  const b = new Battle(pt, enemyTrainer(spec, size, len), rng.int(1, 1e9), spec.mod, spec.map, len);
  let steps = 0; while (b.winner === null && steps < 60 * 600) { b.update(1 / 60); b.events.length = 0; steps++; }
  return b.winner === 0;
}
/** Trainer-Serie mit Test-Spieler: Anzahl besiegter Gegner. */
export function simulateSeries(seed: number, starter: string, teamSize: number, level: number, skill = 0) {
  const rng = new Rng(seed), save: Save = newSave();
  for (let i = 0; i < teamSize; i++) { const o = newOwned(save.nextId++, formAt(i === 0 ? starter : rng.pick(['glimmdra', 'tropfling', 'knoespling']), level), rng.pick(NATURE_IDS), level); o.moves = enemyMoves(o.sp, level); save.mons.push(o); save.team.push(o.id); }
  const team = [...save.team]; let round = 1;
  for (; round < 40; round++) {
    const spec = seriesSpec(team, save, round, seed), hp: Record<number, number> = {}; team.forEach((id) => (hp[id] = 1));
    const size = Math.max(team.length, spec.mons.length), len = lenMulOf(spec);
    const pt = playerTrainer(save, { team, hp }, size, len); pt.auto = true; pt.manual = skill > 0; pt.skill = skill;
    const b = new Battle(pt, enemyTrainer(spec, size, len), rng.int(1, 1e9), spec.mod, spec.map, len);
    let steps = 0; while (b.winner === null && steps < 60 * 400) { b.update(1 / 60); b.events.length = 0; steps++; }
    if (b.winner !== 0) break;
  }
  return round - 1;
}
(globalThis as any).simulateRun = simulateRun;
(globalThis as any).simulateSeries = simulateSeries;
(globalThis as any).simulateRaid = simulateRaid;
(globalThis as any).simulateCup = simulateCup;

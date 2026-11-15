import { build } from 'esbuild';
import { pathToFileURL } from 'url';
await build({ entryPoints: ['src/runsim.ts'], bundle: true, format: 'esm', platform: 'node', outfile: 'dist/runsim.mjs', logLevel: 'warning', loader: { '.png': 'empty' } });
await import(pathToFileURL(process.cwd() + '/dist/runsim.mjs').href);
// node tools/raidsim.mjs <Läufe> <Raid-Stufe> <Team> <Level>
const n = +(process.argv[2] ?? 12), rl = +(process.argv[3] ?? 0), team = +(process.argv[4] ?? 3), lvl = +(process.argv[5] ?? 14);
const st = ['glimmdra', 'tropfling', 'knoespling', 'funkelkrabb', 'kieselbud', 'flockfiep']; let w = 0;
for (let i = 0; i < n; i++) if (globalThis.simulateRaid(700 + i, rl, st[i % st.length], team, lvl)) w++;
console.log(`Raid-Stufe ${rl + 1}, Team ${team}, Lv ${lvl}: ${w}/${n} Siege`);

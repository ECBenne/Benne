import { build } from 'esbuild';
import { pathToFileURL } from 'url';
await build({ entryPoints: ['src/runsim.ts'], bundle: true, format: 'esm', platform: 'node', outfile: 'dist/runsim.mjs', logLevel: 'warning', loader: { '.png': 'empty' } });
await import(pathToFileURL(process.cwd() + '/dist/runsim.mjs').href);
// node tools/seriessim.mjs <Läufe> <Team> <Level>
const n = +(process.argv[2] ?? 10), team = +(process.argv[3] ?? 3), lvl = +(process.argv[4] ?? 15);
const st = ['glimmdra', 'tropfling', 'knoespling', 'funkelkrabb', 'kieselbud', 'flockfiep'];
for (const skill of [0, 1]) { const r = []; for (let i = 0; i < n; i++) r.push(globalThis.simulateSeries(900 + i, st[i % st.length], team, lvl, skill)); r.sort((a, b) => a - b); console.log(`Können ${skill}: Ø ${(r.reduce((a, b) => a + b, 0) / n).toFixed(1)} Siege (Median ${r[n >> 1]}, max ${r[n - 1]})`); }
